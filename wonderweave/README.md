# Wonderweave

Wonderweave turns a teacher's learning goal into a reviewed, audio-first learning adventure for children ages 3–6. The teacher studio generates and validates a structured lesson artifact; the learner experience renders only trusted interaction primitives. A bounded OpenAI Realtime voice guide can listen, speak, handle interruption, repeat directions, and provide the next approved hint without owning correctness or lesson progression.

## Prerequisites

- Node.js `>=22.13.0`

## Quick Start

```bash
npm install
npm run dev
npm run build
```

Copy `.env.example` to an ignored local env file and supply server-only credentials. Never prefix model credentials with `NEXT_PUBLIC_`.

- `ANTHROPIC_API_KEY` powers lesson-artifact generation.
- `OPENAI_API_KEY` mints short-lived Realtime client credentials.
- `LEARNING_MODEL` defaults to `claude-sonnet-5`.
- `REALTIME_MODEL` defaults to `gpt-realtime-2.1`.

## Product architecture

- `POST /api/generate` sends a validated teacher brief to the lesson-generation model and accepts only a schema- and policy-valid artifact.
- `POST /api/realtime/token` uses the permanent OpenAI key only on the server and returns a short-lived `ek_…` credential.
- `LearningExperience` owns lesson state, correctness, navigation, visual feedback, and visible text.
- `useRealtimeTutor` opens a browser WebRTC session only after an explicit tap. It keeps audio and transcripts in memory and disables SDK tracing.
- Realtime tools can read lesson state, repeat the current instruction, expose one approved hint, or ask for a grown-up. They cannot mark answers correct or navigate the lesson.

```text
Teacher brief -> generated artifact -> deterministic validation -> teacher preview
                                                             -> learner renderer
Child <-> Realtime voice guide <-> bounded tools <-> learner renderer state
```

The OpenAI SDK is dynamically imported when the voice guide starts, keeping the initial studio bundle small.

## Workspace Auth Headers

OpenAI workspace sites can read the current user's email from
`oai-authenticated-user-email`.

SIWC-authenticated workspace sites may also receive
`oai-authenticated-user-full-name` when the user's SIWC profile has a non-empty
`name` claim. The full-name value is percent-encoded UTF-8 and is accompanied by
`oai-authenticated-user-full-name-encoding: percent-encoded-utf-8`.

Treat the full name as optional and fall back to email when it is absent:

```tsx
import { headers } from "next/headers";

export default async function Home() {
  const requestHeaders = await headers();
  const email = requestHeaders.get("oai-authenticated-user-email");
  const encodedFullName = requestHeaders.get("oai-authenticated-user-full-name");
  const fullName =
    encodedFullName &&
    requestHeaders.get("oai-authenticated-user-full-name-encoding") ===
      "percent-encoded-utf-8"
      ? decodeURIComponent(encodedFullName)
      : null;

  const displayName = fullName ?? email;
  // ...
}
```

## Live integration tests

Live evidence is opt-in; mocked provider responses do not satisfy it.

```bash
LIVE_E2E=1 \
LIVE_MODEL_ENV_FILE=/approved/path/to/generation.env \
LIVE_REALTIME_ENV_FILE=/approved/path/to/realtime.env \
npm run test:e2e:live
```

The suite proves a real generated artifact, a real ephemeral Realtime credential, a real WebRTC connection with generated audio, the complete child interaction, keyboard access, and responsive layouts. Test attachments redact the ephemeral credential.

## Useful Commands

- `npm run dev`: start local development
- `npm run build`: verify the vinext build output
- `npm test`: production build plus lint
- `npm run test:e2e:live`: real provider and real-browser evidence; requires `LIVE_E2E=1`
- `npm run db:generate`: generate Drizzle migrations after schema changes

## Learn More

- [Engineering specification](docs/LEARNING_ARTIFACT_COMPILER_ENGINEERING_SPEC.md)
- [OpenAI voice agents](https://developers.openai.com/api/docs/guides/voice-agents)
- [OpenAI Realtime with WebRTC](https://developers.openai.com/api/docs/guides/realtime-webrtc)
- [vinext](https://github.com/cloudflare/vinext)
