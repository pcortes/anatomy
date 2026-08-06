import { NextResponse } from "next/server";
import { readServerSecret, readServerSetting } from "@/app/lib/server-environment";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const DEFAULT_REALTIME_MODEL = "gpt-realtime-2.1";
const TOKEN_TTL_SECONDS = 600;

type ClientSecretResponse = {
  value?: string;
  expires_at?: number;
  error?: { type?: string };
};

export async function POST() {
  const traceId = `voice_${crypto.randomUUID()}`;
  const headers = {
    "Cache-Control": "no-store, max-age=0",
    "X-Trace-Id": traceId,
  };
  const apiKey = readServerSecret("OPENAI_API_KEY");
  const model = readServerSetting("REALTIME_MODEL", DEFAULT_REALTIME_MODEL);

  if (!apiKey) {
    return NextResponse.json(
      { error: { code: "VOICE_NOT_CONFIGURED", message: "Live voice is not configured on this server.", traceId } },
      { status: 503, headers },
    );
  }

  let response: Response;
  try {
    response = await fetch("https://api.openai.com/v1/realtime/client_secrets", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        expires_after: {
          anchor: "created_at",
          seconds: TOKEN_TTL_SECONDS,
        },
        session: {
          type: "realtime",
          model,
          instructions: [
            "You are the warm voice inside Wonderweave, an adult-supervised learning experience for ages 3 to 6.",
            "Use one short spoken idea at a time. Never ask for a child's name, location, contact details, school, or private information.",
            "Stay inside the teacher-approved lesson supplied by the application. The application state and tools are authoritative.",
          ].join(" "),
          output_modalities: ["audio"],
          reasoning: { effort: "low" },
          audio: {
            input: {
              noise_reduction: { type: "near_field" },
              turn_detection: {
                type: "semantic_vad",
                eagerness: "low",
                create_response: true,
                interrupt_response: true,
              },
            },
            output: {
              voice: "marin",
              speed: 0.94,
            },
          },
          // Page narration is bounded by our artifact schema, but audio tokens
          // accumulate much faster than written words. A numeric ceiling can
          // stop a healthy read-aloud mid-sentence, so use the API's unbounded
          // per-response setting and enforce brevity in the lesson schema.
          max_output_tokens: "inf",
          tracing: null,
        },
      }),
      cache: "no-store",
    });
  } catch {
    return NextResponse.json(
      { error: { code: "VOICE_PROVIDER_UNAVAILABLE", message: "The voice guide could not be reached.", traceId } },
      { status: 502, headers },
    );
  }

  let payload: ClientSecretResponse = {};
  try {
    payload = await response.json() as ClientSecretResponse;
  } catch {
    // Provider bodies are deliberately not copied into application errors.
  }

  if (!response.ok || !payload.value || !payload.expires_at) {
    console.error(JSON.stringify({
      event: "realtime.client_secret_failed",
      traceId,
      status: response.status,
      providerType: payload.error?.type || "unknown",
    }));
    const status = response.status === 401 || response.status === 403 ? 503
      : response.status === 429 ? 429
        : 502;
    const code = status === 429 ? "VOICE_BUSY"
      : status === 503 ? "VOICE_NOT_CONFIGURED"
        : "VOICE_PROVIDER_UNAVAILABLE";
    const message = status === 429
      ? "The voice guide is busy. Please try again in a moment."
      : status === 503
        ? "Live voice is not configured on this server."
        : "The voice guide could not start.";
    return NextResponse.json({ error: { code, message, traceId } }, { status, headers });
  }

  return NextResponse.json(
    { value: payload.value, expiresAt: payload.expires_at, model },
    { status: 200, headers },
  );
}
