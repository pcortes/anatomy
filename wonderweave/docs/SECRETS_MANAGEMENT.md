# Wonderweave Secrets Management

Status: production operating contract  
Owner: Wonderweave service owner  
Production secret store: OpenAI Sites environment variables

## Inventory

| Name | Classification | Required | Purpose | Browser exposure |
|---|---|---:|---|---|
| `ANTHROPIC_API_KEY` | secret | yes | Server-to-server lesson artifact generation | never |
| `OPENAI_API_KEY` | secret | yes | Server-only minting of short-lived Realtime client credentials | never |
| `LEARNING_MODEL` | non-secret setting | yes | Pinned lesson-generation model | safe |
| `REALTIME_MODEL` | non-secret setting | yes | Pinned Realtime model | safe |

No other production secret is currently required. `SITES_BYPASS_BEARER` is a just-in-time test credential, not an application environment variable. Generate it only for a private production evidence run and rotate it immediately afterward.

## Storage rules

1. Production values live only in Sites and must be marked secret.
2. Permanent provider keys never enter client components, `NEXT_PUBLIC_*` variables, URLs, source control, screenshots, traces, analytics, or test attachments.
3. `.openai/hosting.json` contains resource identifiers only; it never contains environment values.
4. Local live testing reads an approved credential file outside the repository through `LIVE_MODEL_ENV_FILE` and `LIVE_REALTIME_ENV_FILE`.
5. Local credential files should be owned by the developer and mode `0600`. `.env*`, `.dev.vars*`, `.secrets/`, and common secret-file suffixes are ignored.
6. Provider error bodies are not logged. Public errors contain only stable application codes and trace IDs.
7. Production Playwright traces remain disabled because request headers and short-lived credentials can be captured in network evidence.

## Provisioning and rotation

Create project-scoped provider credentials with the least provider permissions available and explicit spend/rate limits. Use a different key for production than for local testing.

For each secret:

1. Create the replacement at the provider.
2. Update the matching Sites variable as a secret without removing the old provider key yet.
3. Run the real generation or Realtime credential probe against the private production deployment.
4. Run the complete production learner E2E when either provider changes.
5. Revoke the previous provider key.
6. Confirm logs contain no authentication error and record the date, operator, provider key ID or label, and evidence trace ID—never the value.

Rotate on personnel or vendor-access changes, suspected exposure, provider request, or at least every 90 days. A key pasted into chat, an issue, a PR, a shell history entry, or a retained test trace is exposed and must be replaced immediately.

## Local operation

Example external file, stored outside the repository:

```dotenv
ANTHROPIC_API_KEY=<provider value>
OPENAI_API_KEY=<provider value>
```

Then:

```bash
chmod 600 /approved/private/path/wonderweave.env
LIVE_MODEL_ENV_FILE=/approved/private/path/wonderweave.env \
LIVE_REALTIME_ENV_FILE=/approved/private/path/wonderweave.env \
npm run dev:live
```

Do not place real values in `.env.example`. Run `npm run preflight` before every commit. `secrets:check` verifies the declared contract; `secrets:scan` checks tracked and non-ignored files without printing matched values. Run `npm run secrets:scan:history` before a release and after any suspected exposure.

## Incident response

1. Revoke or disable the exposed provider key first.
2. Create a replacement and update Sites as a secret.
3. Rotate any Sites bypass bearer used during the incident.
4. Search current Git and reachable history for the signature without printing it.
5. If committed, treat history rewriting as a separate reviewed operation; deleting the visible line is not sufficient.
6. Inspect provider usage, spend, origin, and timestamps from the earliest possible exposure.
7. Run real provider probes and the production E2E.
8. Record impact, window, remediation, and prevention without recording secret values.

## Release gate

A release fails if either required production secret is absent, provider authentication fails, a permanent credential reaches browser code, a secret signature is present in Git, a production trace is enabled, or the credential used for a live test is not rotated immediately afterward.
