import {
  LEARNING_ARTIFACT_JSON_SCHEMA,
  normalizeGeneratedArtifact,
  validateLearningArtifact,
  type GenerationBrief,
  type LearningArtifact,
} from "./learning-artifact";
import { buildGenerationPrompt, LEARNING_ARTIFACT_SYSTEM_PROMPT } from "./generation-prompt";
import { readServerSecret, readServerSetting } from "./server-environment";

export class ModelProviderError extends Error {
  constructor(
    message: string,
    readonly kind: "configuration" | "authentication" | "rate_limit" | "timeout" | "provider" | "invalid_output",
    readonly status?: number,
    readonly issues?: string[],
  ) {
    super(message);
    this.name = "ModelProviderError";
  }
}

export type ProviderResult = {
  artifact: LearningArtifact;
  provider: "anthropic";
  model: string;
  attempts: number;
};

type AnthropicMessageResponse = {
  content?: Array<{ type?: string; text?: string }>;
  error?: { type?: string; message?: string };
  stop_reason?: string | null;
};

// Anthropic's constrained decoder accepts a smaller JSON Schema dialect than
// our deterministic validator. Keep the complete contract in
// LEARNING_ARTIFACT_JSON_SCHEMA, but remove constraints that the provider SDKs
// also strip before grammar compilation. The original validator still enforces
// every length and ID rule before an artifact reaches the learner UI.
const PROVIDER_ARTIFACT_SCHEMA = stripProviderUnsupportedKeywords(LEARNING_ARTIFACT_JSON_SCHEMA);

export async function generateLearningArtifact(brief: GenerationBrief): Promise<ProviderResult> {
  return generateWithAttempt(brief, 1, [], Date.now() + 110_000);
}

async function generateWithAttempt(
  brief: GenerationBrief,
  attempt: 1 | 2,
  previousIssues: string[],
  deadline: number,
): Promise<ProviderResult> {
  const apiKey = readServerSecret("ANTHROPIC_API_KEY");
  if (!apiKey) throw new ModelProviderError("The live-model credential is not configured.", "configuration");

  const model = readServerSetting("LEARNING_MODEL", "claude-sonnet-5");
  const remainingMs = deadline - Date.now();
  if (remainingMs < 5_000) throw new ModelProviderError("The model took too long to answer.", "timeout");
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), Math.min(attempt === 1 ? 75_000 : 45_000, remainingMs));

  let response: Response;
  try {
    response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model,
        max_tokens: 6_000,
        ...(model.startsWith("claude-sonnet-5") ? { thinking: { type: "disabled" } } : {}),
        system: LEARNING_ARTIFACT_SYSTEM_PROMPT,
        messages: [{
          role: "user",
          content: [
            buildGenerationPrompt(brief),
            ...(previousIssues.length
              ? [
                  "A previous draft failed deterministic checks. Create a fresh draft that fixes every issue:",
                  previousIssues.join("\n"),
                  "Remember: exactly 2 categories, 4–6 explore items, 3–4 choices, and exactly 1 correct choice.",
                ]
              : []),
          ].join("\n\n"),
        }],
        output_config: {
          ...(model.startsWith("claude-sonnet-5") ? { effort: "medium" } : {}),
          format: {
            type: "json_schema",
            schema: PROVIDER_ARTIFACT_SCHEMA,
          },
        },
      }),
      signal: controller.signal,
      cache: "no-store",
    });
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      throw new ModelProviderError("The model took too long to answer.", "timeout");
    }
    console.error(JSON.stringify({
      event: "model_provider.fetch_failed",
      name: error instanceof Error ? error.name : "UnknownError",
      message: error instanceof Error ? error.message.slice(0, 180) : "Unknown provider failure",
    }));
    throw new ModelProviderError("The model provider could not be reached.", "provider");
  } finally {
    clearTimeout(timeout);
  }

  let payload: AnthropicMessageResponse = {};
  try {
    payload = (await response.json()) as AnthropicMessageResponse;
  } catch {
    // Provider bodies are intentionally not copied into application errors.
  }

  if (!response.ok) {
    console.error(JSON.stringify({
      event: "model_provider.rejected",
      status: response.status,
      type: payload.error?.type || "unknown",
    }));
    if (response.status === 401 || response.status === 403) {
      throw new ModelProviderError("The model credential was rejected.", "authentication", response.status);
    }
    if (response.status === 429) {
      throw new ModelProviderError("The model is temporarily rate limited.", "rate_limit", response.status);
    }
    throw new ModelProviderError("The model provider rejected the request.", "provider", response.status);
  }

  const output = payload.content?.find((block) => block.type === "text")?.text;
  if (!output) {
    throw new ModelProviderError(`The model returned no text artifact (stop: ${payload.stop_reason ?? "unknown"}).`, "invalid_output");
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(output);
  } catch {
    console.error(JSON.stringify({
      event: "artifact.parse_failed",
      attempt,
      stopReason: payload.stop_reason ?? "unknown",
      outputCharacters: output.length,
    }));
    if (attempt === 1) {
      return generateWithAttempt(brief, 2, ["Return one complete JSON artifact. Keep every field concise enough to finish before the token limit."], deadline);
    }
    throw new ModelProviderError(`The model returned incomplete JSON (stop: ${payload.stop_reason ?? "unknown"}).`, "invalid_output");
  }

  const normalized = normalizeGeneratedArtifact(parsed);
  if (normalized.changes.length) {
    console.info(JSON.stringify({ event: "artifact.normalized", attempt, changes: normalized.changes }));
  }
  const validation = validateLearningArtifact(normalized.value);
  if (!validation.ok) {
    console.error(JSON.stringify({ event: "artifact.validation_failed", attempt, issues: validation.issues }));
    if (attempt === 1 && deadline - Date.now() >= 30_000) return generateWithAttempt(brief, 2, validation.issues, deadline);
    throw new ModelProviderError("The artifact failed deterministic validation.", "invalid_output", undefined, validation.issues);
  }

  return { artifact: validation.value, provider: "anthropic", model, attempts: attempt };
}

function stripProviderUnsupportedKeywords(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(stripProviderUnsupportedKeywords);
  if (!value || typeof value !== "object") return value;

  return Object.fromEntries(
    Object.entries(value as Record<string, unknown>)
      .filter(([key]) => !["minLength", "maxLength", "pattern"].includes(key))
      .map(([key, child]) => [key, stripProviderUnsupportedKeywords(child)]),
  );
}
