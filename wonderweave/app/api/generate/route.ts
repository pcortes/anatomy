import { NextResponse } from "next/server";
import {
  ARTIFACT_SCHEMA_VERSION,
  POLICY_VERSION,
  PROMPT_VERSION,
  parseGenerationBrief,
  type GenerateResponse,
} from "@/app/lib/learning-artifact";
import { generateLearningArtifact, ModelProviderError } from "@/app/lib/model-provider";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_REQUEST_BYTES = 8_192;

export async function POST(request: Request) {
  const traceId = `gen_${crypto.randomUUID()}`;
  const startedAt = Date.now();
  const responseHeaders = {
    "Cache-Control": "no-store, max-age=0",
    "X-Trace-Id": traceId,
  };

  const contentLength = Number(request.headers.get("content-length") || 0);
  if (contentLength > MAX_REQUEST_BYTES) {
    return errorResponse(413, "REQUEST_TOO_LARGE", "Keep the lesson brief under 8 KB.", traceId, responseHeaders);
  }

  let input: unknown;
  try {
    const body = await request.text();
    if (new TextEncoder().encode(body).byteLength > MAX_REQUEST_BYTES) {
      return errorResponse(413, "REQUEST_TOO_LARGE", "Keep the lesson brief under 8 KB.", traceId, responseHeaders);
    }
    input = JSON.parse(body);
  } catch {
    return errorResponse(400, "INVALID_JSON", "Send a valid JSON lesson brief.", traceId, responseHeaders);
  }

  const brief = parseGenerationBrief(input);
  if (!brief.ok) {
    return NextResponse.json(
      { error: { code: brief.code, message: brief.message, traceId, fields: brief.fields } },
      { status: 400, headers: responseHeaders },
    );
  }

  try {
    const generated = await generateLearningArtifact(brief.value);
    const payload: GenerateResponse = {
      artifact: generated.artifact,
      receipt: {
        provider: generated.provider,
        model: generated.model,
        promptVersion: PROMPT_VERSION,
        schemaVersion: ARTIFACT_SCHEMA_VERSION,
        policyVersion: POLICY_VERSION,
        generatedAt: new Date().toISOString(),
        traceId,
        latencyMs: Date.now() - startedAt,
        attempts: generated.attempts,
        validation: { schema: "pass", policy: "pass" },
      },
    };
    return NextResponse.json(payload, { status: 200, headers: responseHeaders });
  } catch (error) {
    const providerError = error instanceof ModelProviderError ? error : null;
    const status = providerError?.kind === "rate_limit" ? 429
      : providerError?.kind === "timeout" ? 504
        : providerError?.kind === "invalid_output" ? 422
          : providerError?.kind === "configuration" || providerError?.kind === "authentication" ? 503
            : 502;
    const code = providerError?.kind === "rate_limit" ? "MODEL_RATE_LIMITED"
      : providerError?.kind === "timeout" ? "MODEL_TIMEOUT"
        : providerError?.kind === "invalid_output" ? "ARTIFACT_REJECTED"
          : providerError?.kind === "configuration" || providerError?.kind === "authentication" ? "MODEL_NOT_CONFIGURED"
            : "MODEL_UNAVAILABLE";

    // The provider error body, prompt, brief, and credentials are deliberately excluded.
    console.error(JSON.stringify({
      event: "generation.failed",
      traceId,
      code,
      latencyMs: Date.now() - startedAt,
      diagnostic: providerError?.kind === "invalid_output" ? providerError.message : undefined,
      validationIssues: providerError?.kind === "invalid_output" ? providerError.issues : undefined,
    }));
    return errorResponse(status, code, publicMessage(code), traceId, responseHeaders);
  }
}

function errorResponse(
  status: number,
  code: string,
  message: string,
  traceId: string,
  headers: Record<string, string>,
) {
  return NextResponse.json({ error: { code, message, traceId } }, { status, headers });
}

function publicMessage(code: string) {
  switch (code) {
    case "MODEL_RATE_LIMITED": return "The lesson workshop is busy. Please try again in a moment.";
    case "MODEL_TIMEOUT": return "The lesson took too long to design. Your brief is saved; please retry.";
    case "ARTIFACT_REJECTED": return "The draft did not pass our lesson checks. Please retry or simplify the objective.";
    case "MODEL_NOT_CONFIGURED": return "Live lesson generation is not configured on this server.";
    default: return "The lesson workshop could not finish this draft. Please try again.";
  }
}
