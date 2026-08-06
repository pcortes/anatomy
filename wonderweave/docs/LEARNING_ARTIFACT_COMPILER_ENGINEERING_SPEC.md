# Learning Artifact Compiler

## Product, pedagogy, UX, safety, and engineering specification

**Status:** Implementation specification and external-review candidate  
**Version:** 2.1 — pre-reader audio maps for early literacy and mathematics
**Last updated:** 2026-08-04  
**Audience:** Product, engineering, curriculum, learning science, child UX, safety, privacy, and accessibility reviewers  
**Implementation target:** `anatomy`, a Next.js/Vinext application deployed with OpenAI Sites  

> **Approval truth:** No external educator has approved this document yet. The review process and acceptance forms below are requirements for a production release. A prototype may be used for internal product review, but it must not be represented as educator-certified until the named independent reviewers have signed the release record.

---

## 1. Executive decision

Build a **Learning Artifact Compiler**, not an unrestricted website-writing agent.

A teacher supplies a structured lesson brief. A live model turns that brief into a declarative `LearningArtifact`. A trusted renderer composes the artifact from tested interaction primitives such as story hooks, sorting games, visual explorers, prediction prompts, retrieval questions, and celebrations. The model may select and populate approved primitives, but it may not emit or execute arbitrary JavaScript, HTML, CSS, database queries, remote URLs, or tracking code.

This architecture is the shortest credible path to dashboards that are:

- available within minutes;
- meaningfully different for each lesson;
- instructionally coherent rather than merely attractive;
- safe and usable without independent reading for children ages 3–6;
- accessible and usable on touch devices;
- inspectable and editable by a teacher;
- testable before a learner sees them;
- portable across model providers.

The first prototype proves one complete flow:

1. A teacher enters a topic, age, learning objective, duration, and learner context.
2. A server route sends a privacy-minimized brief to a live model.
3. Structured output is validated against the artifact contract and policy checks.
4. The teacher previews the generated lesson and sees the pedagogical rationale.
5. A child completes a listen/wonder → worked example → guided play → retrieval → off-screen transfer loop.
6. The app records only local, ephemeral progress in Prototype 1.
7. Real-model API and real-browser end-to-end tests verify the complete flow.

---

## 2. Product intent

### 2.1 Problem

Teachers can describe a compelling interactive experience faster than they can build one. General-purpose code generation can produce a page quickly, but creates unacceptable variance in child safety, instructional quality, responsiveness, accessibility, correctness, and runtime security. Static template libraries are safer, but rarely fit the exact objective, age, culture, classroom time, and misconceptions of a lesson.

The product must combine the specificity of generation with the reliability of a controlled runtime.

### 2.2 Outcome

Within three minutes of submitting a brief, a teacher receives a classroom-ready, editable, interactive lesson that:

- has one explicit, observable learning objective;
- starts with curiosity or prediction rather than exposition;
- includes active manipulation or a meaningful choice;
- asks the learner to retrieve or apply the target idea;
- gives explanatory, non-shaming feedback;
- ends with a transfer prompt or teacher conversation cue;
- meets the age-band and accessibility constraints in this specification;
- contains a transparent provenance and review record.

### 2.3 Success metrics

Prototype metrics are quality gates, not growth targets.

| Metric | Prototype 1 target | Production target |
|---|---:|---:|
| Valid artifact generation | ≥95% first attempt | ≥99.5% including one repair |
| Brief-to-preview latency, p95 | ≤90 seconds | ≤30 seconds |
| Child task completion without adult UI help | observed in moderated review | ≥85% by age band |
| Objective-aligned retrieval item | 100% rubric pass | 100% automated + sampled human audit |
| Critical accessibility violations | 0 | 0 |
| Child PII sent to model | 0 fields | 0 fields |
| Arbitrary generated code executed | never | never |
| Teacher approval before assignment | required | required by default |

Do not use time-on-screen as a learning-success metric. Prefer completion, correct transfer, teacher usefulness, and learner explanation.

### 2.4 Non-goals for Prototype 1

- A full learning-management system.
- Automatic grading, diagnosis, or special-education placement.
- Unreviewed autonomous publishing to children.
- Open-ended child chat.
- Child accounts, advertising, social features, leaderboards, streak pressure, or purchases.
- Arbitrary code generation or iframe execution.
- Claims of efficacy before a valid study.
- Replacement of a teacher, caregiver, therapist, or clinician.

---

## 3. Users and operating modes

### 3.1 Teacher author

Needs to turn tomorrow’s objective into an experience quickly, see exactly what will be taught, change inaccurate or unsuitable language, and trust that no learner data has leaked.

### 3.2 Child learner, ages 3–6

Needs a clear invitation, a small number of choices, fast causal feedback, generous recovery from error, concrete language, and a visible sense of progress without manipulative rewards.

### 3.3 Caregiver or co-player

May read aloud, ask the transfer prompt, or operate the interface with a young learner. The artifact should create conversation, not isolate the child.

### 3.4 Curriculum and safety reviewer

Needs a diffable artifact, source/provenance notes, rubric results, policy flags, and an immutable publication record.

### 3.5 Modes

| Mode | Actor | Capabilities |
|---|---|---|
| Studio | teacher/reviewer | author brief, generate, edit, preview, approve |
| Learn | child with optional adult | complete the approved interaction |
| Review | teacher/reviewer | inspect objective, sequence, rationale, flags, and results |

Prototype 1 implements Studio and Learn in one local flow. Authentication, persistence, assignments, and immutable publication records are Phase 2.

---

## 4. Evidence-based learning model

The product follows a short, repeatable learning loop:

```text
Connect → Predict → Act → Explain → Retrieve → Transfer → Celebrate effort
```

Not every artifact needs seven separate screens. The renderer may combine stages, but it must preserve the functions below.

### 4.1 Required instructional functions

1. **Connect:** Activate something the learner can perceive or already knows.
2. **Predict:** Ask for a low-stakes commitment before revealing the answer.
3. **Act:** Let the learner sort, match, move, choose, compare, count, reveal, or simulate.
4. **Explain:** Name the causal or conceptual relationship in age-appropriate language.
5. **Retrieve:** Ask the learner to recall or apply the objective without simply copying the previous display.
6. **Transfer:** Provide one offline observation, movement, drawing, or adult conversation cue.
7. **Celebrate effort:** Acknowledge strategy, noticing, revision, or persistence; do not praise fixed intelligence.

### 4.2 Why these constraints exist

- NAEYC’s developmentally appropriate practice framework covers birth through age eight and emphasizes joyful, engaged learning through play, exploration, and inquiry.
- The American Academy of Pediatrics describes play as supporting cognitive, language, self-regulation, social-emotional, and executive-function development.
- The Institute of Education Sciences recommends combining graphics with verbal descriptions, connecting concrete and abstract representations, interleaving worked examples with problem solving, spacing learning, retrieval practice, and deep explanatory questions.
- Harvard’s serve-and-return framework supports responsive interaction between child and adult rather than passive delivery.
- CAST’s Universal Design for Learning guidance supports multiple means of engagement, representation, and action/expression.

These sources constrain the product’s method; they do not prove that any particular generated artifact is effective.

### 4.3 Age-band contract

#### Ages 3–4: co-play and concrete noticing

- Default session: 4–7 minutes.
- One instruction at a time, usually ≤8 spoken/readable words.
- No reading required for child success.
- Maximum three visible choices.
- Large touch targets: minimum 56×56 CSS pixels; preferred 64×64.
- Favor matching, sorting, pointing, sound, movement, imitation, and cause/effect.
- Adult cue is mandatory.
- Retrieval uses recognition or reenactment, not typed response.
- Avoid timers, failure sounds, abstract scores, and dense navigation.

#### Ages 5–6: guided discovery and early symbols

- Default session: 6–10 minutes.
- One short sentence per instruction; concrete nouns and active verbs.
- Maximum four visible choices.
- Touch target minimum 52×52 CSS pixels.
- Pair emerging symbols or words with pictures, motion, or manipulatives.
- Permit one scaffold after an error, then a simpler retry.
- Retrieval can use picture choice, ordering, classification, or one-word response with an adult.

#### Non-reader guarantee for ages 3–6

- No child-facing action may require decoding a written instruction.
- Every stage has a complete spoken narration and a persistent, child-operable repeat control.
- Complete narration includes every actionable instruction, picture name, category home, and answer choice needed on that screen; it cannot merely summarize the printed copy.
- Every multi-choice activity begins with an audio map that binds each spoken concept to a concrete visible picture cue, such as “the snake picture is the /s/ home.”
- Every item speaks its name and learning clue when tapped. Every category has a large, separate speaker control so a child can preview its meaning without submitting an answer.
- Spoken information is also represented by concise text and semantic pictures; audio is never the only representation.
- The first sound starts only after a child or adult taps the audio invitation. Later stage narration may play automatically while sound remains enabled.
- Every item, category, and answer choice has a semantically meaningful picture cue and an accessible name.
- Directions name the object and the relevant feature; they never rely only on position, shape, or color.
- Children may demonstrate knowledge by tapping, pointing, speaking, gesturing, moving, matching, or manipulating common objects.
- Text remains visible for the adult and for print exposure, but successful completion cannot depend on reading it.

#### Live voice tutor contract

The live voice layer is an interaction modality, not the curriculum authority. The trusted renderer remains responsible for the current stage, correctness, attempts, scaffolding level, navigation, and completion. The voice model may read state and request one of a narrow set of UI actions, but it cannot directly mutate arbitrary page state.

- Start audio and microphone access only after an explicit child or adult tap.
- Use browser WebRTC with a short-lived server-minted credential; permanent provider keys never enter browser code, logs, test artifacts, or source control.
- Default to `gpt-realtime-2.1` with low reasoning effort, near-field noise reduction, semantic turn detection with low eagerness, interruption enabled, and a warm adult voice near 0.94× speed.
- Permit barge-in during open conversational responses. Keep short trusted stage instructions and worked examples protected from echo and incidental room speech. Tapping Next, Exit, or Mute is always an intentional interruption and must stop the current output quickly without carrying old narration into the new stage.
- Use no more than two short spoken sentences per conversational model turn and normally one idea of 3–12 words. Trusted full-screen read-aloud requests are the exception: read every supplied cue in short, ordered phrases without summarizing.
- Interpret fragments and developmental pronunciation modestly. If audio is unclear, ask one concrete clarification rather than guessing.
- Apply the hint ladder: exact repeat → visual/sound cue → one worked clue → grown-up support. Never reveal an answer immediately after the first error.
- Do not ask for names, locations, schools, contact details, accounts, diagnoses, records, or secrets. Do not profile or compare the learner.
- Keep audio and transcripts in memory only in the prototype. Disable SDK tracing and audio history storage. Closing or leaving the learner experience destroys the session.
- Always retain visible text, semantic pictures, and adult cues. A failed voice connection cannot make the lesson unusable.
- Restrict tools to `get_lesson_state`, `repeat_instruction`, `give_approved_hint`, and `ask_grown_up`. Any future state-changing tool requires an explicit state-machine transition contract and E2E evidence.

### 4.4 Domain-specific instructional pathways

#### Early literacy

Use an explicit developmental progression: oral language and vocabulary → word and syllable awareness → onset-rime → phoneme awareness → letter–sound mapping → simple decoding or connected oral language. Ages three and early four primarily listen, rhyme, clap syllables, and notice vocabulary. Ages four through five may connect one heard sound to one visible letter when aligned to the objective. Ages five through six receive an explicit model of one sound-symbol or decoding move. The product must never teach guessing a word from its picture, outline, sentence context, or first letter alone.

#### Early mathematics

Use a developmental progression and structured visual representations. Supported targets include perceptual and conceptual subitizing, stable-order and one-to-one counting, cardinality, magnitude comparison, composition and decomposition, shape, pattern, spatial language, and tiny story problems. Age three defaults to quantities one through three. Age four defaults to one through five. Ages five through six may use structured quantities through ten, five-frames, composition, comparison, and simple addition or subtraction when explicitly requested. Rote number recitation alone is not an adequate learning interaction.

#### Integrated thematic learning

A topic such as seeds, animals, weather, space, or cooking supplies meaningful vocabulary, examples, and an off-screen context. Each artifact still names one lead literacy or mathematics skill. A second-domain connection must remain light and cannot create a simultaneous double test. The teacher preview must state the primary method, developmental progression, and non-reader supports.

### 4.5 Feedback contract

Correct feedback must explain the relevant feature, not merely say “Correct.” Incorrect feedback must:

1. preserve the child’s dignity;
2. name what was useful in the attempt when possible;
3. provide one actionable cue;
4. allow an immediate retry;
5. reveal the answer after two unsuccessful attempts and then ask a simpler retrieval question.

Forbidden examples: “Wrong,” red-X-only feedback, loss of points, shame, surprise timers, streak loss, or celebratory effects that are stronger for speed than thoughtfulness.

---

## 5. Child experience and presentation principles

### 5.1 Experience qualities

The desired experience is **wonderful, warm, tactile, and intellectually serious**. “Fun” means agency, surprise, humor, discovery, motion with meaning, and a satisfying reveal. It does not mean visual noise or reward compulsion.

Every visual or animation must do at least one job:

- focus attention;
- reveal a relationship;
- provide causal feedback;
- show state or progress;
- establish a memorable metaphor;
- celebrate completion briefly.

### 5.2 Visual system

- Use a calm base palette and one lesson-specific accent.
- Maintain WCAG 2.2 AA contrast for text and controls.
- Never encode correctness, category, or state by color alone.
- Use rounded, friendly geometry without making factual content toy-like or misleading.
- Use responsive type with a minimum rendered body size of 18px in Learn mode.
- Keep line length ≤55 characters for child-facing explanatory text.
- Use illustrations as semantic anchors, not decoration.
- Prefer one strong focal visual per screen.

### 5.3 Motion and sound

- Motion must stop when `prefers-reduced-motion` is active.
- No essential information may depend on animation.
- No sound before an explicit child/adult tap. Once enabled, stage narration may play automatically.
- Every stage has a large “hear again” control plus a persistent mute control.
- Spoken scripts use short sentences, plain language, intentional pauses, and a slower child-appropriate rate.
- Feedback, hints, and transfer instructions are speakable on demand.
- All audio has simultaneous visible text and semantic visual cues.
- Celebration animation lasts ≤1.5 seconds and cannot block the next action.

### 5.4 Navigation

- One primary action per stage.
- A persistent “Leave lesson” control is available to the adult but visually secondary.
- Progress is expressed as named stages or a simple path, not a performance bar.
- Back is allowed during preview; child progress does not silently reset.
- Keyboard order follows the visual order.

### 5.5 Reading and language

- Default to plain, literal language.
- Explain any essential technical term immediately.
- Avoid idioms that do not translate culturally.
- Never ask the model to imitate a living artist, celebrity, or copyrighted character.
- Avoid stereotypes, tokenism, and default assumptions about family structure, bodies, gender, ability, culture, or resources.
- Adult prompts should work with ordinary household objects and offer a no-material alternative.

---

## 6. Teacher studio UX

### 6.1 Brief form

Required fields:

| Field | Rules |
|---|---|
| Topic | 3–120 characters; no child name or personal details |
| Learning objective | 10–240 characters; one observable outcome |
| Learning pathway | early literacy, early math, or integrated |
| Learner age | integer 3–6 |
| Duration | 5, 8, 10, 12, or 15 minutes |

Optional fields:

- context or misconception, maximum 300 characters;
- interests, expressed as general themes only;
- accessibility supports, selected from approved options;
- locale and language;
- standards identifier supplied by the teacher or an approved standards catalog.

The form must show a privacy reminder: **“Describe the class, not an individual child. Do not enter names, diagnoses, contact details, or student records.”**

### 6.2 Generation states

- `idle`: form is editable.
- `validating`: local validation runs synchronously.
- `generating`: show meaningful stages such as “Designing the learning loop” and “Checking age fit.” Do not fake percentage precision.
- `ready`: preview and rationale are shown.
- `needs_review`: artifact rendered, with visible warning flags.
- `blocked`: no child preview; explain the policy category and offer a safe revision.
- `failed`: preserve the form, provide a retry, and show a non-technical error ID.

### 6.3 Teacher preview

The preview header must show:

- objective;
- age and expected time;
- stages and interaction types;
- generated-at timestamp;
- model/provider identifier;
- policy and schema status;
- source status: teacher-supplied, approved catalog, model general knowledge, or unverified.

Prototype 1 provides “Try as learner” and “Start over.” Phase 2 adds field-level editing, versioning, publication, assignment, and co-review.

---

## 7. Declarative artifact contract

### 7.1 Core TypeScript shape

```ts
type LearningArtifact = {
  schemaVersion: "2.1";
  title: string;
  subtitle: string;
  topic: string;
  domain: "early-literacy" | "early-math" | "integrated";
  age: number;
  durationMinutes: number;
  objective: string;
  methodology: {
    primaryMethod: string;
    skillProgression: string;
    accessibilitySupports: string;
  };
  theme: {
    accent: "coral" | "sun" | "leaf" | "sky" | "grape";
    motif: "garden" | "space" | "workshop" | "ocean" | "museum";
  };
  hook: {
    prompt: string;
    wonderQuestion: string;
  };
  model: {
    headline: string;
    instruction: string;
    exampleEmoji: string;
    exampleLabel: string;
    explanation: string;
    gestureCue: string;
  };
  explore: {
    instruction: string;
    items: Array<{
      id: string;
      label: string;
      detail: string;
      emoji: string;
      category: string;
    }>;
    categories: Array<{
      id: string;
      label: string;
      description: string;
      emoji: string;
      visualCue: string; // concrete spoken name for the emoji, e.g. “the snake picture”
    }>;
  };
  check: {
    prompt: string;
    choices: Array<{
      id: string;
      label: string;
      emoji: string;
      explanation: string;
      correct: boolean;
    }>;
    hint: string;
  };
  transfer: {
    prompt: string;
    adultCue: string;
  };
  celebration: {
    headline: string;
    message: string;
  };
  narration: {
    welcome: string;
    hook: string;
    model: string;
    explore: string;
    check: string;
    transfer: string;
  };
  teacherNotes: {
    rationale: string;
    lookFor: string;
    misconception: string;
    sourceNote: string;
  };
};
```

Prototype 2 intentionally supports one interaction family: **model, classify, explain, and transfer**. The contract is extensible, but additional primitive types must each receive their own pedagogy, accessibility, security, and E2E review before being enabled.

### 7.2 Structural limits

- All properties are required.
- Unknown properties are rejected.
- `explore.items`: 4–6 items.
- `explore.categories`: exactly 2 categories.
- `check.choices`: 3–4 items, exactly one correct.
- Each identifier matches `^[a-z0-9-]{1,32}$` and is unique within its scope.
- Emoji fields contain one simple emoji or approved glyph; the accessible name comes from `label`.
- No string contains HTML, Markdown links, script, event handlers, CSS, data URLs, or remote URLs.
- Strings have explicit maximum lengths enforced by schema and runtime checks.

### 7.3 Semantic validator

JSON Schema can validate shape, not teaching quality. A second validator must confirm:

- objective, big idea, exploration categories, and retrieval item address the same concept;
- the correct answer is supported by the explanation;
- category membership is unambiguous for the supplied items;
- age-band reading limits are respected;
- instructions do not depend on color, drag precision, or prior reading; spoken content always has visible text and semantic visual support;
- no medical, legal, crisis, sexual, violent, hateful, or personally identifying content appears;
- no claim of diagnosis, fixed ability, or guaranteed learning appears;
- teacher notes disclose when factual sources have not been independently verified.

Prototype 1 implements deterministic policy and length checks. Phase 2 adds a second-model semantic critic plus sampled human audit; the critic may block or flag but never silently rewrite a published artifact.

---

## 8. Generation pipeline

```text
Teacher brief
  → deterministic input validation and PII patterns
  → normalized GenerationBrief
  → prompt builder + age-band policy + artifact JSON Schema
  → provider adapter
  → schema-constrained model response
  → trusted mechanical canonicalizer (stable IDs + declared string ceilings)
  → structural validator
  → deterministic safety/quality validator
  → artifact + generation receipt
  → teacher preview
  → explicit teacher approval
  → immutable published version
```

### 8.1 Provider interface

```ts
interface LearningModelProvider {
  readonly id: "anthropic" | "openai";
  generateArtifact(input: GenerationBrief): Promise<GenerationResult>;
}
```

Provider selection is server-only. Browser bundles must never contain provider credentials. Prototype 1 uses Anthropic Messages with `output_config.format.type = "json_schema"`. The implementation must accept a future OpenAI Responses adapter using strict Structured Outputs without changing the artifact renderer.

### 8.2 Model policy

- Default prototype model: `claude-sonnet-5`, configurable by `LEARNING_MODEL`.
- For Sonnet 5 artifact compilation, explicitly disable adaptive thinking and use medium effort. The schema, curriculum prompt, and deterministic validator own this bounded transformation; hidden high-effort reasoning only consumes the shared output budget and increases latency.
- Overall generation deadline: 110 seconds. The first request receives at most 75 seconds; an optional repair receives at most 45 seconds and must remain inside the overall deadline.
- Before validation, the trusted compiler canonicalizes model-authored internal IDs and trims strings at word boundaries to the limits already declared by the full artifact schema. It must never invent examples, category membership, correctness, facts, or instructional content.
- One first-attempt model request plus at most one automatic repair when semantic or structural validation still fails after canonicalization. Do not start repair unless at least 30 seconds remain.
- No silent fallback to an older model.
- Maximum output tokens: 6,000. The artifact grammar requires this headroom even though completed payloads are usually much smaller; lower caps can terminate constrained decoding before the closing JSON tokens.
- Store model/provider/version in the receipt.
- Prompts are versioned in source control; receipt stores the prompt version, not the hidden prompt text.
- Never send names, emails, account identifiers, child records, generated analytics, or previous child answers.

### 8.3 Prompt requirements

The system prompt must:

- identify the model’s role as an early-learning experience designer working under a strict contract;
- prioritize objective alignment and factual modesty over novelty;
- provide age-band constraints;
- require non-shaming feedback and adult co-play;
- forbid child-directed persuasion, purchases, unsafe actions, arbitrary links, and collection of personal data;
- tell the model to choose examples with clear category boundaries;
- require a source note that distinguishes general knowledge from teacher-provided facts;
- avoid asking the model to reveal chain-of-thought; rationale is a short teacher-facing design explanation.

### 8.4 Failure behavior

- 400: invalid brief; show field-specific issues.
- 401/403 from provider: configuration error; never send provider details to child UI.
- 408/504: generation timeout; teacher may retry.
- 422: model output failed validation or policy; return a safe explanation and trace ID.
- 429: rate-limited; show retry guidance and `Retry-After` when available.
- 500: unexpected failure; log trace ID without prompt content or credentials.

No invalid artifact may be partially rendered.

---

## 9. Application architecture

### 9.1 Prototype 1

```text
Next.js/Vinext client
  ├─ TeacherStudio (brief + preview)
  └─ LearningExperience (trusted primitive renderer)
          │
          ▼
POST /api/generate
  ├─ brief validation
  ├─ AnthropicProvider
  ├─ structural parsing
  └─ artifact policy validation
          │
          ▼
Anthropic Messages API (server-side only)
```

Prototype state is held in the page and browser session. This keeps the first product review fast and prevents collection of child data before the persistence and privacy model is approved.

### 9.2 Prototype 3 live voice path

```text
Child microphone + speaker
          │ WebRTC, short-lived credential
          ▼
OpenAI gpt-realtime-2.1
          │ bounded function tools
          ▼
LearningExperience state machine
  ├─ get current approved direction and progress
  ├─ repeat current direction
  ├─ expose one approved hint
  └─ display grown-up help request

POST /api/realtime/token
  ├─ reads OPENAI_API_KEY from server runtime only
  ├─ applies base child-safety session configuration
  ├─ POSTs /v1/realtime/client_secrets
  └─ returns only the short-lived credential, expiry, and model ID
```

The client dynamically imports `@openai/agents` only after voice opt-in. A `RealtimeAgent` receives the validated artifact plus the current lesson stage. Stage transitions update the agent instructions, while tool handlers read the latest renderer state through an in-memory reference. UI-triggered narration is sent as a trusted `[WONDERWEAVE_UI]` message containing approved wording. The model may adjust spoken prosody or divide the wording into child-sized sentences but may not introduce another task.

Required operational controls:

- `Cache-Control: no-store` on client-secret responses.
- Ephemeral secret TTL no greater than ten minutes for the prototype.
- Provider error bodies and credentials excluded from application responses and structured logs.
- Model ID pinned through `REALTIME_MODEL`; no silent downgrade.
- Browser support detection for WebRTC and `getUserMedia` before starting.
- Explicit statuses for idle, connecting, listening, thinking, speaking, muted, and error.
- One-tap microphone mute, repeat control, disconnect on unmount, and visible grown-up fallback.
- A production rate limit and abuse budget are required before access expands beyond the private prototype.

### 9.2 Production target

```text
OpenAI Sites / Cloudflare Worker
  ├─ Next.js/Vinext UI and route handlers
  ├─ Workspace / Sign in with ChatGPT authentication
  ├─ D1: briefs, artifacts, versions, approvals, aggregate sessions
  ├─ R2: reviewed illustration/audio assets only
  ├─ Model gateway: provider routing, receipts, limits, retries
  └─ Observability: redacted structured events and quality dashboards
```

Use D1 for relational product state and R2 only for binary assets. Do not persist secrets, raw model prompts containing teacher text, child free text, or analytics payloads in environment configuration.

### 9.3 Production data model

```sql
CREATE TABLE artifact (
  id TEXT PRIMARY KEY,
  owner_user_id TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('draft','review','approved','archived')),
  current_version INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE artifact_version (
  artifact_id TEXT NOT NULL,
  version INTEGER NOT NULL,
  schema_version TEXT NOT NULL,
  artifact_json TEXT NOT NULL,
  brief_json TEXT NOT NULL,
  provider TEXT NOT NULL,
  model TEXT NOT NULL,
  prompt_version TEXT NOT NULL,
  policy_version TEXT NOT NULL,
  validation_json TEXT NOT NULL,
  generated_at TEXT NOT NULL,
  PRIMARY KEY (artifact_id, version),
  FOREIGN KEY (artifact_id) REFERENCES artifact(id)
);

CREATE TABLE approval (
  artifact_id TEXT NOT NULL,
  version INTEGER NOT NULL,
  reviewer_user_id TEXT NOT NULL,
  decision TEXT NOT NULL CHECK (decision IN ('approved','rejected')),
  rubric_json TEXT NOT NULL,
  created_at TEXT NOT NULL,
  PRIMARY KEY (artifact_id, version, reviewer_user_id)
);

CREATE TABLE learning_session (
  id TEXT PRIMARY KEY,
  artifact_id TEXT NOT NULL,
  artifact_version INTEGER NOT NULL,
  pseudonymous_assignment_id TEXT,
  started_at TEXT NOT NULL,
  completed_at TEXT,
  aggregate_json TEXT NOT NULL,
  FOREIGN KEY (artifact_id) REFERENCES artifact(id)
);
```

Production must scope every query by authenticated owner/workspace. Published versions are immutable. Edits create a new version and require new approval.

---

## 10. API contracts

### `POST /api/generate`

Request:

```json
{
  "topic": "How seeds travel",
  "objective": "Sort seed examples by how they travel and explain one clue.",
  "age": 6,
  "durationMinutes": 8,
  "context": "Students have seen dandelions and burrs."
}
```

Success response:

```json
{
  "artifact": {},
  "receipt": {
    "provider": "anthropic",
    "model": "claude-sonnet-5",
    "promptVersion": "artifact-v1",
    "schemaVersion": "1.0",
    "generatedAt": "2026-08-04T20:00:00.000Z",
    "traceId": "gen_...",
    "latencyMs": 24000,
    "attempts": 1,
    "validation": {
      "schema": "pass",
      "policy": "pass"
    }
  }
}
```

Error response:

```json
{
  "error": {
    "code": "INVALID_BRIEF",
    "message": "Check the highlighted fields.",
    "traceId": "gen_...",
    "fields": { "objective": "Use one observable learning objective." }
  }
}
```

Headers:

- `Content-Type: application/json`
- `Cache-Control: no-store`
- `X-Trace-Id: <traceId>`

The endpoint accepts at most 8 KB. It does not accept arbitrary provider/model values from the browser.

---

## 11. Security, safety, and privacy

### 11.1 Threat model

| Threat | Required mitigation |
|---|---|
| Prompt injection in teacher text | Treat brief as data; fixed system instructions; strict output schema; no tools or browsing in generation call |
| Generated script or markup | Schema strings only; reject `<`, `>`, URLs, event syntax; React text escaping; no `dangerouslySetInnerHTML` |
| Credential disclosure | Server-only environment variables; secret redaction; no keys in repo, browser, receipts, or logs |
| Cross-tenant access | Authenticated workspace ownership on every production query |
| Unsafe lesson | topic input policy, deterministic output policy, teacher approval, reviewer workflow |
| PII collection | privacy copy, field limits, PII patterns, no child fields, short retention |
| Factual hallucination | source note, bounded topics, teacher preview, source-backed Phase 2 mode |
| Denial of wallet | authenticated rate limits, per-workspace quotas, request deduplication, bounded tokens |
| Supply-chain compromise | lockfile, audit review, minimal dependencies, CI provenance |

### 11.2 Child privacy

- Treat the product as child-directed when Learn mode is offered to ages 3–6.
- Collect the minimum data required for the teacher’s educational purpose.
- Prototype 1 stores no child identifier and sends no child interaction to the model.
- Production legal/privacy review must address COPPA, school authorization, parental consent where applicable, data retention, deletion, vendor contracts, and jurisdiction-specific student privacy law.
- No advertising, behavioral profiling, third-party analytics pixels, or sale/sharing of child data.
- Teacher-entered data is not used to train product models without separate, explicit institutional authorization.

### 11.3 Topic policy for Prototype 1

Allow ordinary early-learning topics in science, mathematics, language, arts, community, and social-emotional learning. Block or route to specialized human review:

- individualized medical, mental-health, legal, or safety advice;
- sexual content;
- graphic violence, self-harm, weapons, illegal drugs, or hate;
- requests about a named child, diagnosis, disability record, disciplinary event, or other student record;
- persuasion, political targeting, fundraising, purchasing, or brand promotion directed at children;
- activities involving fire, ingestion, traffic, unsupervised water, heights, sharp tools, electricity, unknown plants/chemicals, or contact with strangers.

---

## 12. Accessibility requirements

Prototype and production target WCAG 2.2 AA, plus relevant W3C cognitive-accessibility guidance.

Required:

- semantic headings and landmarks;
- visible focus and full keyboard operation;
- no drag-only interaction: click/tap selection is the primary method;
- programmatic labels for icons and controls;
- status and feedback announced through a polite live region;
- text resizes to 200% without loss of content or operation;
- landscape and portrait support down to 320 CSS pixels;
- reduced-motion support;
- high contrast and non-color state indicators;
- plain-language instructions near the action;
- no timeout for child tasks;
- errors identified in text and associated with fields;
- screen-reader order matches visual order;
- automated Axe checks plus keyboard and screen-reader manual review.

---

## 13. Observability and operational quality

Emit structured, redacted events:

- `generation.started`
- `generation.completed`
- `generation.failed`
- `artifact.validation_failed`
- `preview.opened`
- `lesson.started`
- `lesson.completed`

Permitted properties: trace ID, workspace ID, schema/prompt/policy version, provider, model, latency, token counts, status, broad age band, and interaction type. Do not log topic/objective text by default. Never log provider keys, authorization headers, full provider error bodies, child answers, or names.

Service objectives after production hardening:

- generation API availability ≥99.5%;
- renderer availability ≥99.9%;
- p95 artifact render interaction response ≤100 ms after load;
- client JavaScript error-free sessions ≥99.5%;
- valid artifact rate ≥99.5% with at most one repair attempt.

---

## 14. Testing strategy

The acceptance suite is end-to-end. Focused component tests may be added later, but they cannot substitute for these gates.

### 14.1 Real-model API E2E

`e2e/live-generation.mjs` must:

1. launch the actual application with a real provider credential;
2. submit a novel brief to the real `/api/generate` route;
3. assert HTTP 200 and `Cache-Control: no-store`;
4. validate the returned artifact contract and receipt;
5. assert the provider/model are real and no fixture marker is present;
6. assert exactly one correct retrieval choice;
7. assert prohibited markup/URL patterns are absent;
8. record only redacted evidence: trace ID, model, latency, schema/policy result, and artifact title;
9. fail if `LIVE_E2E=1` is not set, so a mocked run cannot masquerade as live evidence.

### 14.2 Real-browser E2E

Playwright or the in-app browser must operate the actual UI:

1. load Studio;
2. enter topic, objective, age, duration, and context;
3. submit generation;
4. wait for a live-model preview;
5. start Learn mode;
6. select examples and observe explanatory feedback;
7. answer the retrieval question incorrectly once, verify a supportive hint, then correctly;
8. reach the transfer/celebration state;
9. verify keyboard focus, live feedback, responsive mobile layout, and reduced-motion behavior;
10. capture screenshots for product review.

No network interception, response fixture, fake provider, or test-only application branch is allowed in the live E2E suite.

### 14.3 Quality fixtures

Run a small, versioned set of live briefs spanning:

- age 3: shapes in the home;
- age 4: animal coverings;
- age 5: rhyme or beginning sound;
- age 6: how seeds travel;
- age 7: equal groups and early multiplication;
- age 8: erosion and deposition.

Automated rubrics flag schema, reading length, objective alignment indicators, safety patterns, duplicate choices, ambiguous classification, and feedback tone. Human reviewers sample the rendered output, not just JSON.

### 14.4 Release gates

- build passes;
- lint passes with no warnings;
- dependency audit has no unaccepted high/critical production vulnerabilities;
- live-model E2E passes against the configured production candidate model;
- browser E2E passes on desktop and mobile viewports;
- Axe reports no serious or critical findings;
- credential scan passes;
- privacy and security review passes;
- external educator sign-off record is complete for production.

---

## 15. External expert review and sign-off

### 15.1 Required independent reviewers

At minimum, recruit reviewers who are not the artifact’s implementers:

| Role | Minimum qualification | Decision scope |
|---|---|---|
| Early-childhood educator | 5+ years teaching ages 3–5 or equivalent credential | play, co-learning, instructions, developmental fit |
| Primary educator | 5+ years teaching ages 5–8 | classroom utility, curriculum fit, misconceptions |
| Learning scientist | graduate training and applied experience | learning loop, retrieval, feedback, transfer |
| Child UX researcher/designer | moderated research with children 3–6, including non-readers | comprehension, agency, audio/visual navigation, delight |
| Accessibility specialist | WCAG and assistive-technology experience | keyboard, screen reader, cognitive and motor access |
| Child privacy/safety reviewer | child-directed product experience | data minimization, COPPA posture, safety policy |

One person may cover at most two adjacent roles. Production requires at least four independent people, including both educator roles.

### 15.2 Review materials

Each reviewer receives:

- this specification;
- the rubric below;
- at least six representative generated artifacts, one per age;
- desktop, tablet, and phone builds;
- a screen-reader walkthrough;
- known limitations and model/provider information;
- observed child/caregiver usability evidence after ethics/privacy approval.

### 15.3 Rubric

Score each item 1–4: 1 unacceptable, 2 major revision, 3 acceptable with minor revision, 4 exemplary.

**Concept and pedagogy**

- objective is observable and age-appropriate;
- action is cognitively relevant, not decorative;
- feedback teaches the discriminating feature;
- retrieval requires memory or transfer;
- adult cue extends learning beyond the screen;
- misconceptions and factual uncertainty are handled honestly.

**Presentation**

- focal point is immediately clear;
- language and visual density fit the age;
- illustration/motion clarify the idea;
- delight supports attention without compulsion;
- representation is culturally respectful and inclusive.

**UX and accessibility**

- learner knows what to do without UI coaching;
- errors are recoverable and emotionally safe;
- touch, keyboard, and screen-reader paths work;
- low reading ability does not block ages 3–4;
- adult can pause, exit, and discuss the task.

**Safety and privacy**

- no child PII is requested or transmitted;
- activity can be completed safely in ordinary settings;
- no ads, persuasion, dark patterns, or performance pressure;
- provenance and approval state are visible to the teacher.

Approval requires:

- no item scored 1;
- mean ≥3.25 in each section;
- all critical issues resolved and re-reviewed;
- explicit “approve” from each required role.

### 15.4 Sign-off record

```text
Release candidate:
Commit / deployment:
Schema version:
Prompt version:
Policy version:
Review date:

Reviewer name:
Role / qualification:
Organization (optional):
Artifacts and devices reviewed:
Section scores:
Critical issues:
Decision: APPROVE / REJECT / APPROVE AFTER LISTED CHANGES
Signature or verifiable approval link:
Date:
```

The repository must store the completed record under `docs/reviews/<release>/`. Product copy may say “reviewed by educators” only when that record exists and names the scope of review.

---

## 16. Delivery plan for a junior engineer

### Milestone 1 — vertical slice

- Add the artifact types, JSON Schema, structural parser, deterministic policy checks, prompt builder, and provider interface.
- Implement the Anthropic Messages provider with structured output.
- Implement `POST /api/generate` with request size, timeouts, errors, trace IDs, and no-store headers.
- Build Studio form with literacy/math/integrated pathways; preview methodology metadata; and an audio-first model/classify/retrieve/transfer renderer.
- Implement browser speech synthesis behind an explicit sound-start gesture, with persistent mute and repeat controls, complete visible transcripts, semantic picture cues, and graceful no-speech fallback.
- Keep existing Anatomy Atelier available as a reference route.
- Add real-model and browser E2E scripts.
- Run build, lint, dependency review, and credential scan.
- Deploy privately for product sign-off.

### Milestone 2 — reviewable authoring

- Add D1 migrations and owner-scoped repositories.
- Add workspace authentication.
- Add editable artifact fields, version diff, review rubric, approval, and immutable publication.
- Add rate limits, quotas, idempotency, and generation receipts.
- Add a source-grounded mode for factual topics.

### Milestone 3 — interaction library

Add one primitive at a time: sequence, compare, number line, part-whole model, cause/effect simulator, story choice, sound/phoneme match, and spatial explorer. Every primitive requires:

Use `NON_READER_LESSON_ARCHETYPE_SYSTEM_SPEC.md` as the normative selection, schema, interaction, voice, review, and rollout contract for this milestone.

- child UX behavior specification;
- accessibility contract;
- schema extension and migration;
- renderer implementation;
- at least two real-browser E2E cases across age bands;
- educator and accessibility review.

### Milestone 4 — proactive lesson-plan generation

- Import teacher-approved lesson plans or calendar standards.
- Generate drafts overnight into a review inbox.
- Never auto-assign or auto-publish by default.
- Deduplicate similar lessons and reuse reviewed artifacts.
- Let the teacher set cadence, grade/age, standards, language, and quiet hours.
- Provide cost budgets and a kill switch.

### Definition of done for every task

- acceptance behavior is observable in the real application;
- errors and empty/loading states are implemented;
- keyboard and responsive behavior are verified;
- no secret or child PII is logged;
- documentation and contract changes are committed together;
- applicable live E2E passes;
- product reviewer can identify exactly what changed.

---

## 17. Prototype 2 acceptance criteria

The prototype is ready for the user’s sign-off when:

1. A teacher can generate a lesson from the UI with the real configured model.
2. The artifact is schema-constrained and rejected if unsafe or malformed.
3. The preview shows objective, age, time, rationale, source note, provider/model, and validation result.
4. The teacher can choose early literacy, early math, or integrated thematic learning for ages 3–6, including a topic such as seeds.
5. A non-reading child can complete listen/wonder → worked example → tap-first guided practice → changed-example retrieval → off-screen transfer without drag-and-drop or reading an instruction.
6. Every learner stage exposes a large repeat control; live voice starts only after explicit opt-in; stage directions, item clues, category homes, answer choices, feedback, hints, and transfer cues are spoken aloud without requiring print decoding.
7. Every item, category, and answer choice includes a semantic picture cue and accessible name. Each generated category also includes a concrete `visualCue`, and the explore narration binds that cue to the category meaning before the child answers. Text remains available as a transcript and adult support.
8. Incorrect retrieval produces immediate spoken and visible explanatory feedback, one actionable cue, and a retry.
9. The preview identifies the primary method, developmental progression, and non-reader accessibility supports.
10. The UI works at 390×844 and 1280×800, with touch, keyboard controls, reduced motion, and audio-off fallback.
11. No credential is copied into the repository or browser bundle.
12. Build and lint pass; live evidence proves artifact generation, ephemeral Realtime credential minting, a WebRTC session that produces model audio, repeat behavior, and the full child interaction without mocked provider responses.
13. A private deployment URL and screenshot set are supplied for review.
14. The handoff explicitly distinguishes internal product sign-off from independent educator sign-off.

---

## 18. Sources and standards

- [NAEYC — Developmentally Appropriate Practice: Principles](https://www.naeyc.org/resources/position-statements/dap/principles)
- [American Academy of Pediatrics — The Power of Play](https://publications.aap.org/pediatrics/article/142/3/e20182058/38649/The-Power-of-Play-A-Pediatric-Role-in-Enhancing)
- [Institute of Education Sciences — Organizing Instruction and Study to Improve Student Learning](https://ies.ed.gov/ncee/wwc/PracticeGuide/1)
- [Institute of Education Sciences — Foundational Skills to Support Reading for Understanding in K–3](https://ies.ed.gov/ncee/wwc/PracticeGuide/21/Published)
- [Institute of Education Sciences — Teaching Math to Young Children](https://ies.ed.gov/ncee/wwc/earlychildhoodinstruction2)
- [Harvard Center on the Developing Child — Serve and Return](https://developingchild.harvard.edu/key-concept/serve-and-return/)
- [CAST — Universal Design for Learning Guidelines 3.0](https://udlguidelines.cast.org/)
- [W3C — Web Content Accessibility Guidelines 2.2](https://www.w3.org/TR/WCAG22/)
- [W3C — Cognitive Accessibility Guidance](https://www.w3.org/WAI/cognitive/)
- [W3C — Audio and Video Content Accessibility](https://www.w3.org/WAI/media/av/av-content/)
- [UNESCO — Guidance for Generative AI in Education and Research](https://www.unesco.org/en/articles/guidance-generative-ai-education-and-research?hub=66973)
- [FTC — Children’s Online Privacy Protection Rule](https://www.ftc.gov/legal-library/browse/rules/childrens-online-privacy-protection-rule-coppa)
- [OWASP — Application Security Verification Standard 5.0](https://owasp.org/www-project-application-security-verification-standard/)
- [Anthropic — Structured outputs](https://platform.claude.com/docs/en/build-with-claude/structured-outputs)
- [OpenAI — Structured Outputs](https://developers.openai.com/api/docs/guides/structured-outputs)
- [OpenAI — Voice agents](https://developers.openai.com/api/docs/guides/voice-agents)
- [OpenAI — Realtime and audio](https://developers.openai.com/api/docs/guides/realtime)
- [OpenAI — Realtime API with WebRTC](https://developers.openai.com/api/docs/guides/realtime-webrtc)
- [OpenAI — GPT-Realtime-2.1](https://developers.openai.com/api/docs/models/gpt-realtime-2.1)

---

## 19. Open decisions before production

- Which jurisdictions, schools, and home-use scenarios are in initial scope?
- Which standards catalogs may be represented as authoritative, and how are licenses handled?
- What human review is required for science, health, history, and social-emotional topics?
- What is the approved retention period for teacher briefs, artifacts, and aggregate sessions?
- Is any learner-level progress truly required, or can the product remain assignment-aggregate?
- Which languages have qualified educator and linguistic reviewers?
- What evidence threshold supports any “accelerates learning” product claim?
- What is the incident process for a harmful, biased, or factually wrong artifact?

Until these are resolved, describe the product as **designed to support effective learning practices**, not as proven to accelerate learning.
