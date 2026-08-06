# Wonderweave

Wonderweave turns a teacher's learning goal into a reviewed, audio-first learning adventure for children ages 3–6 who may not read independently yet. A teacher creates the brief; a live model drafts a typed lesson artifact; deterministic code validates it; the teacher reviews it; and the child gets a visual, spoken, touch-first experience.

The current product includes:

- a teacher studio for reading, math, blended, and topic-based goals such as seeds;
- schema- and policy-checked lesson generation with a real Anthropic model;
- a pre-reader learner experience built around pictures, sound, movement, large targets, and visible words that never carry the interaction by themselves;
- an OpenAI Realtime voice guide that can narrate, repeat, listen, respond, and stop immediately when the learner moves to the next page;
- bounded voice tools: the model may explain approved content and offer approved hints, but application code owns correctness and progression;
- a real Playwright journey that exercises generation, a Realtime client secret, WebRTC audio, learner interaction, keyboard access, and responsive layouts.

This is an additive app. In `thebuggeddev/anatomy`, it lives entirely under `wonderweave/`; the original Anatomy app remains untouched.

## Product status

The picture-based model/classify/explain/transfer lesson is implemented and live. The specifications also define a broader pre-reader lesson system—sound hunts, counting and cardinality, composing quantities, patterns, sequencing, spatial language, compare/predict/reveal, movement, story retell, and real-world transfer—but those additional archetypes are a roadmap, not completed product behavior.

The pedagogy, presentation rules, and educator review gates are documented. Do not claim independent educator sign-off until the review evidence required by those specifications has actually been collected.

## Repository location

In the additive upstream layout:

```text
thebuggeddev/anatomy/
├── ...original Anatomy files
└── wonderweave/              # this independent application
```

Run every command below from the directory containing this README. If you cloned the upstream Anatomy branch, start with `cd wonderweave`. If Wonderweave is checked out as a standalone repository, you are already in the right directory.

## Prerequisites

- Node.js `>=22.13.0`
- npm and the committed `package-lock.json`
- provider keys only for live generation and voice
- OpenAI Sites access only for hosted-environment changes or deployment

## Run locally without provider keys

This starts the complete UI and deterministic learner renderer. Live lesson generation and live voice return explicit `503` configuration errors until keys are supplied.

```bash
npm ci
npm run dev
```

Open the exact local URL printed by the development server. Before committing:

```bash
npm test
```

`npm test` runs the secret contract, scans the working tree for credential signatures, builds the production worker, and lints the code.

## Get the two provider keys

Wonderweave currently requires exactly two permanent provider credentials:

| Variable | Classification | Server purpose | Browser exposure |
|---|---|---|---|
| `ANTHROPIC_API_KEY` | secret | Generate the typed lesson artifact | never |
| `OPENAI_API_KEY` | secret | Mint a short-lived Realtime client secret | never |
| `LEARNING_MODEL` | non-secret setting | Pin the generation model; default `claude-sonnet-5` | safe |
| `REALTIME_MODEL` | non-secret setting | Pin the voice model; default `gpt-realtime-2.1` | safe |

Create dedicated, project-scoped credentials in the [Anthropic Console](https://console.anthropic.com/settings/keys) and [OpenAI API key settings](https://platform.openai.com/settings/organization/api-keys). Use separate local/test and production keys, least available privilege, provider spend alerts, and rate limits. Do not copy a shared key from another `_catchall` project: reuse makes revocation, attribution, and blast-radius control unreliable.

A key pasted into chat, a ticket, a PR, a shell command, a screenshot, or a retained trace must be treated as exposed and replaced. Never commit a real value to `.env.example`.

## Run locally with real generation and voice

Put the provider values in a file outside the repository. Create it in a password manager or trusted editor so the values do not become shell history:

```dotenv
ANTHROPIC_API_KEY=<value from Anthropic>
OPENAI_API_KEY=<value from OpenAI>
```

Restrict the file, then inject it only into the live process:

```bash
chmod 600 /approved/private/path/wonderweave.env

LIVE_MODEL_ENV_FILE=/approved/private/path/wonderweave.env \
LIVE_REALTIME_ENV_FILE=/approved/private/path/wonderweave.env \
npm run dev:live
```

`dev:live` validates that both keys exist, warns when the file is broadly readable, and launches the dev server without printing the values. The two `LIVE_*_ENV_FILE` variables may point to separate files if the credentials have different owners.

Do not use a `NEXT_PUBLIC_*` variable for either key. In Next.js, that prefix is an intentional client-exposure boundary.

## How voice works

The browser never receives `OPENAI_API_KEY`.

```text
Browser ──POST /api/realtime/token──> Wonderweave server
                                            │
                                            ├── permanent OPENAI_API_KEY
                                            │   stays server-side
                                            ▼
                                      OpenAI Realtime
                                            │
Browser <── short-lived client secret ──────┘
   │
   └── WebRTC speech-to-speech session
```

`POST /api/realtime/token` mints a ten-minute client secret, returns it with `Cache-Control: no-store`, and never returns the permanent key. This follows OpenAI's documented [Realtime WebRTC ephemeral-token pattern](https://developers.openai.com/api/docs/guides/realtime-webrtc#creating-an-ephemeral-token). The session uses server VAD, low interruption eagerness, the `marin` voice, and tracing disabled.

The voice model is intentionally not the lesson engine. `LearningExperience` owns the current page, allowed answers, correctness, navigation, and visual feedback. Voice tools can read current state, replay the current approved script, reveal one approved hint, or request a grown-up; they cannot advance the lesson or mark an answer correct.

Audio and transcript state are held in memory for the active session. The application does not intentionally persist child audio or transcripts. Before a public child-facing launch, complete the privacy review and add the privacy-preserving safety identifier recommended in the current OpenAI Realtime guidance.

## How lesson generation works

```text
Teacher brief
    ↓
POST /api/generate
    ↓
Anthropic lesson draft
    ↓
JSON schema validation + product policy validation
    ↓
Teacher preview and approval
    ↓
Deterministic learner renderer
```

The model generates data, not executable UI code. That boundary makes the learner experience fast, testable, and constrained to reviewed primitives. Generated artifacts must include spoken directions, picture semantics, explicit teaching, guided practice, retrieval, transfer, and error feedback. Visible words support print awareness and grown-up participation; instructions, choices, and state changes must remain understandable through pictures, audio, animation, and position alone.

The implementation contract is in:

- [Learning artifact compiler engineering specification](docs/LEARNING_ARTIFACT_COMPILER_ENGINEERING_SPEC.md)
- [Pre-reader interaction standard](docs/PRE_READER_INTERACTION_STANDARD.md)
- [Non-reader lesson archetype system](docs/NON_READER_LESSON_ARCHETYPE_SYSTEM_SPEC.md)

## Real end-to-end tests

These are real browser journeys, not unit tests and not mocked provider tests. They consume provider quota.

### Local live E2E

```bash
LIVE_E2E=1 \
LIVE_MODEL_ENV_FILE=/approved/private/path/wonderweave.env \
LIVE_REALTIME_ENV_FILE=/approved/private/path/wonderweave.env \
npm run test:e2e:live -- --project desktop-chromium
```

Run both configured browser sizes before release by omitting `--project desktop-chromium`.

The suite proves:

- a real provider-generated artifact passes schema and policy validation;
- the server mints a real ephemeral Realtime credential;
- the browser opens a real WebRTC connection and receives generated audio;
- the learner can complete the visual interaction without independent reading;
- repeat, next-page cancellation, keyboard access, and responsive layouts work.

Test attachments redact the ephemeral client secret. Production traces are disabled because authorization headers and short-lived credentials can otherwise be retained.

### Private production E2E

The current production site is private: [Wonderweave Learning Studio](https://wonderweave-learning-studio.philconimous.chatgpt.site).

For an automated test, generate a just-in-time Sites bypass bearer, store it in a mode-`0600` file outside the repository, and load it into the process without typing the value into the command:

```dotenv
PRODUCTION_BASE_URL=https://wonderweave-learning-studio.philconimous.chatgpt.site
SITES_BYPASS_BEARER=<just-in-time Sites value>
```

```bash
chmod 600 /approved/private/path/wonderweave-production-test.env
set -a
source /approved/private/path/wonderweave-production-test.env
set +a

LIVE_E2E=1 npx playwright test \
  --config playwright.production.config.ts \
  --project desktop-chromium

unset SITES_BYPASS_BEARER
```

Rotate the bypass bearer immediately after the evidence run. It is a test credential, not an application environment variable, and must never be stored in Sites runtime variables, source control, CI artifacts, or Playwright traces.

## Secret management

### Production inventory

Production values live in the OpenAI Sites environment store:

- `ANTHROPIC_API_KEY`: required, marked secret
- `OPENAI_API_KEY`: required, marked secret
- `LEARNING_MODEL`: required non-secret setting
- `REALTIME_MODEL`: required non-secret setting

`.openai/hosting.json` stores only the opaque Sites project identifier and resource bindings. It never stores environment values. Provider keys are read only by server modules through `app/lib/server-environment.ts`; client modules cannot import that server-only boundary.

OpenAI recommends keeping API keys out of code and public repositories and injecting them through environment variables or a secret-management service; see [OpenAI production API-key guidance](https://developers.openai.com/api/docs/guides/production-best-practices#api-keys).

### Rotation procedure

For either provider:

1. Create a replacement project-scoped key. Do not revoke the working key yet.
2. Update the matching Sites value and mark it secret.
3. Deploy or restart on the new environment revision.
4. Run the real provider probe and the complete private-production E2E.
5. Revoke the previous provider key.
6. Record date, operator, provider key label or ID, and evidence trace ID—never the value.

Rotate on suspected exposure, personnel or vendor-access changes, provider request, and at least every 90 days. A suspected leak triggers immediate replacement rather than waiting for proof of misuse.

### Leak response

1. Revoke or disable the exposed key.
2. Create a replacement and update the matching Sites secret.
3. Rotate any Sites bypass bearer involved in the incident.
4. Run `npm run secrets:scan` and `npm run secrets:scan:history`.
5. Inspect provider usage and spend from the earliest possible exposure.
6. Re-run real generation, Realtime, and learner E2E evidence.
7. Document impact and remediation without copying secret values.

Deleting a visible secret from the latest commit does not remove it from Git history. History rewriting is a separate, reviewed incident-response operation.

The complete operating contract is in [the secrets management runbook](docs/SECRETS_MANAGEMENT.md).

## Deploy with OpenAI Sites

The project is already bound to a Sites project through `.openai/hosting.json`. Preserve the existing `project_id`; do not create a second site or replace the file with credentials.

### Release gate

From the app directory:

```bash
npm ci
npm test
npm run secrets:scan:history
```

For a behavior change, also run the local live E2E. Commit the exact validated source before publishing.

### First-time environment setup

In the Sites environment editor, create the four variables in the production inventory above. Mark both API keys secret. Never put a provider value in `.openai/hosting.json`, the source repository, a deployment archive, or a command-line URL.

After changing a provider key or model setting, publish a new version so the release is tied to an explicit environment revision.

### Publish sequence

Sites deployments are versioned and source-backed. The release operator or Codex Sites workflow must:

1. Obtain a short-lived source-repository credential from the existing Sites project.
2. Push the exact validated commit using per-command authorization; never embed the credential in a remote URL or Git config.
3. Build and package the Cloudflare Worker-compatible `dist/` output with `.openai/hosting.json`.
4. Save one Sites version associated with that pushed commit SHA.
5. Deploy the saved version privately.
6. Wait for deployment status `succeeded` and use the returned production URL.
7. Run real provider probes and the private-production E2E.
8. Rotate the just-in-time Sites bypass bearer used for testing.

When using Codex, a sufficient release request is: `Validate the current Wonderweave commit, publish that exact source privately with Sites, run the real production probes and E2E, then rotate the test bypass credential.` Sites source credentials and bypass bearers are short-lived operator credentials; they are never application secrets.

Do not make the site public merely to simplify automated testing. Changing private, shared, or public access is a separate product-owner decision.

## Release checklist

- [ ] `npm test` passes
- [ ] `npm run secrets:scan:history` passes
- [ ] behavior changes pass the real local E2E
- [ ] no child PII, audio, or transcript persistence was introduced
- [ ] provider secrets are server-only and Sites marks them secret
- [ ] generated artifacts still pass schema and policy validation
- [ ] the exact validated commit is the Sites version source
- [ ] private deployment succeeds
- [ ] real generation and Realtime probes succeed in production
- [ ] private-production learner E2E succeeds
- [ ] the test bypass bearer is rotated immediately
- [ ] previous provider keys are revoked after a successful rotation

## Troubleshooting

| Symptom | Meaning | Fix |
|---|---|---|
| `MODEL_NOT_CONFIGURED` or lesson-generation `503` | The server cannot read `ANTHROPIC_API_KEY` | Check the external local file or masked Sites secret, then restart/redeploy |
| `VOICE_NOT_CONFIGURED` or voice `503` | The server cannot mint a Realtime credential | Check `OPENAI_API_KEY`, account/model access, and the current environment revision |
| Voice starts but no sound plays | Browser audio was not unlocked or output is muted | Tap the voice control, allow microphone/audio, check device output, then use Repeat |
| Voice cuts off after Next | Expected cancellation of stale narration | The next page should begin its own current narration |
| Voice cuts off without navigation | Session/VAD or provider failure | Capture the application trace ID, reproduce once, and inspect redacted server logs |
| Production Playwright fails before navigation | Private Sites authorization is absent | Generate a fresh just-in-time bypass bearer; never make the site public as a workaround |
| Secret scanner fails | A credential-like signature exists in tracked or non-ignored content | Do not print it; revoke if real, remove safely, scan current Git and history, and follow incident response |

Provider error bodies are deliberately not copied into public errors or logs. Use the stable application error code and `X-Trace-Id` to correlate a failure.

## Useful commands

| Command | Purpose |
|---|---|
| `npm run dev` | Local UI without loading external credential files |
| `npm run dev:live` | Local UI with approved external live credentials |
| `npm run build` | Build the vinext/Cloudflare Worker output |
| `npm run lint` | Run ESLint |
| `npm run preflight` | Validate the secret contract and scan current files |
| `npm test` | Preflight, production build, and lint |
| `npm run secrets:check` | Validate declared secret names and client boundaries |
| `npm run secrets:runtime` | Require the runtime secret contract in the current process |
| `npm run secrets:scan` | Scan tracked and non-ignored current files without printing values |
| `npm run secrets:scan:history` | Scan reachable Git history without printing values |
| `npm run test:e2e:live` | Run real-provider Playwright evidence |
| `npm run db:generate` | Generate Drizzle migrations after a schema change |

## Architecture map

```text
app/api/generate/                  server generation boundary
app/api/realtime/token/            server Realtime credential boundary
app/components/AnatomyApp.tsx      teacher studio and orchestration
app/components/LearningExperience.tsx
                                   deterministic learner renderer
app/hooks/useRealtimeTutor.ts       browser WebRTC voice session
app/lib/learning-artifact.ts        artifact schema and validation
app/lib/server-environment.ts       server-only environment boundary
e2e/live-generation.spec.ts        real provider/browser journey
docs/                              engineering, pedagogy, UX, and security specs
.openai/hosting.json                Sites project binding; never secret values
```

## Further reading

- [Secrets management runbook](docs/SECRETS_MANAGEMENT.md)
- [OpenAI voice agents](https://developers.openai.com/api/docs/guides/voice-agents)
- [OpenAI Realtime with WebRTC](https://developers.openai.com/api/docs/guides/realtime-webrtc)
- [OpenAI production best practices](https://developers.openai.com/api/docs/guides/production-best-practices)
- [vinext](https://github.com/cloudflare/vinext)
