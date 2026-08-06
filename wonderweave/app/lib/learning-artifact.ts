export const ARTIFACT_SCHEMA_VERSION = "2.1" as const;
export const PROMPT_VERSION = "artifact-v2.2-audio-guided-interaction" as const;
export const POLICY_VERSION = "child-safe-v1" as const;

export type ThemeAccent = "coral" | "sun" | "leaf" | "sky" | "grape";
export type ThemeMotif = "garden" | "space" | "workshop" | "ocean" | "museum";
export type LearningDomain = "early-literacy" | "early-math" | "integrated";

export type GenerationBrief = {
  topic: string;
  objective: string;
  domain: LearningDomain;
  age: number;
  durationMinutes: 5 | 8 | 10 | 12 | 15;
  context: string;
};

export type LearningArtifact = {
  schemaVersion: typeof ARTIFACT_SCHEMA_VERSION;
  title: string;
  subtitle: string;
  topic: string;
  domain: LearningDomain;
  age: number;
  durationMinutes: number;
  objective: string;
  methodology: {
    primaryMethod: string;
    skillProgression: string;
    accessibilitySupports: string;
  };
  theme: {
    accent: ThemeAccent;
    motif: ThemeMotif;
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
      visualCue: string;
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

export type GenerationReceipt = {
  provider: "anthropic" | "openai";
  model: string;
  promptVersion: typeof PROMPT_VERSION;
  schemaVersion: typeof ARTIFACT_SCHEMA_VERSION;
  policyVersion: typeof POLICY_VERSION;
  generatedAt: string;
  traceId: string;
  latencyMs: number;
  attempts: number;
  validation: {
    schema: "pass";
    policy: "pass";
  };
};

export type GenerateResponse = {
  artifact: LearningArtifact;
  receipt: GenerationReceipt;
};

export type ValidationSuccess<T> = { ok: true; value: T };
export type ValidationFailure = {
  ok: false;
  code: "INVALID_BRIEF" | "INVALID_ARTIFACT" | "UNSAFE_CONTENT";
  message: string;
  fields?: Record<string, string>;
  issues: string[];
};
export type ValidationResult<T> = ValidationSuccess<T> | ValidationFailure;

export type ArtifactNormalization = {
  value: unknown;
  changes: string[];
};

const STRING_SCHEMA = (maxLength: number) => ({
  type: "string",
  minLength: 1,
  maxLength,
});

export const LEARNING_ARTIFACT_JSON_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: [
    "schemaVersion",
    "title",
    "subtitle",
    "topic",
    "domain",
    "age",
    "durationMinutes",
    "objective",
    "methodology",
    "theme",
    "hook",
    "model",
    "explore",
    "check",
    "transfer",
    "celebration",
    "narration",
    "teacherNotes",
  ],
  properties: {
    schemaVersion: { type: "string", const: ARTIFACT_SCHEMA_VERSION },
    title: STRING_SCHEMA(70),
    subtitle: STRING_SCHEMA(100),
    topic: STRING_SCHEMA(120),
    domain: { type: "string", enum: ["early-literacy", "early-math", "integrated"] },
    age: { type: "integer" },
    durationMinutes: { type: "integer", enum: [5, 8, 10, 12, 15] },
    objective: STRING_SCHEMA(240),
    methodology: {
      type: "object",
      additionalProperties: false,
      required: ["primaryMethod", "skillProgression", "accessibilitySupports"],
      properties: {
        primaryMethod: STRING_SCHEMA(180),
        skillProgression: STRING_SCHEMA(220),
        accessibilitySupports: STRING_SCHEMA(220),
      },
    },
    theme: {
      type: "object",
      additionalProperties: false,
      required: ["accent", "motif"],
      properties: {
        accent: { type: "string", enum: ["coral", "sun", "leaf", "sky", "grape"] },
        motif: { type: "string", enum: ["garden", "space", "workshop", "ocean", "museum"] },
      },
    },
    hook: {
      type: "object",
      additionalProperties: false,
      required: ["prompt", "wonderQuestion"],
      properties: {
        prompt: STRING_SCHEMA(180),
        wonderQuestion: STRING_SCHEMA(160),
      },
    },
    model: {
      type: "object",
      additionalProperties: false,
      required: ["headline", "instruction", "exampleEmoji", "exampleLabel", "explanation", "gestureCue"],
      properties: {
        headline: STRING_SCHEMA(60),
        instruction: STRING_SCHEMA(140),
        exampleEmoji: STRING_SCHEMA(12),
        exampleLabel: STRING_SCHEMA(50),
        explanation: STRING_SCHEMA(180),
        gestureCue: STRING_SCHEMA(120),
      },
    },
    explore: {
      type: "object",
      additionalProperties: false,
      required: ["instruction", "items", "categories"],
      properties: {
        instruction: STRING_SCHEMA(160),
        items: {
          type: "array",
          items: {
            type: "object",
            additionalProperties: false,
            required: ["id", "label", "detail", "emoji", "category"],
            properties: {
              id: { type: "string", pattern: "^[a-z0-9-]{1,32}$" },
              label: STRING_SCHEMA(40),
              detail: STRING_SCHEMA(110),
              emoji: STRING_SCHEMA(12),
              category: { type: "string", pattern: "^[a-z0-9-]{1,32}$" },
            },
          },
        },
        categories: {
          type: "array",
          items: {
            type: "object",
            additionalProperties: false,
            required: ["id", "label", "description", "emoji", "visualCue"],
            properties: {
              id: { type: "string", pattern: "^[a-z0-9-]{1,32}$" },
              label: STRING_SCHEMA(36),
              description: STRING_SCHEMA(90),
              emoji: STRING_SCHEMA(12),
              visualCue: STRING_SCHEMA(40),
            },
          },
        },
      },
    },
    check: {
      type: "object",
      additionalProperties: false,
      required: ["prompt", "choices", "hint"],
      properties: {
        prompt: STRING_SCHEMA(180),
        choices: {
          type: "array",
          items: {
            type: "object",
            additionalProperties: false,
            required: ["id", "label", "emoji", "explanation", "correct"],
            properties: {
              id: { type: "string", pattern: "^[a-z0-9-]{1,32}$" },
              label: STRING_SCHEMA(90),
              emoji: STRING_SCHEMA(12),
              explanation: STRING_SCHEMA(180),
              correct: { type: "boolean" },
            },
          },
        },
        hint: STRING_SCHEMA(150),
      },
    },
    transfer: {
      type: "object",
      additionalProperties: false,
      required: ["prompt", "adultCue"],
      properties: {
        prompt: STRING_SCHEMA(180),
        adultCue: STRING_SCHEMA(220),
      },
    },
    celebration: {
      type: "object",
      additionalProperties: false,
      required: ["headline", "message"],
      properties: {
        headline: STRING_SCHEMA(60),
        message: STRING_SCHEMA(160),
      },
    },
    narration: {
      type: "object",
      additionalProperties: false,
      required: ["welcome", "hook", "model", "explore", "check", "transfer"],
      properties: {
        welcome: STRING_SCHEMA(220),
        hook: STRING_SCHEMA(260),
        model: STRING_SCHEMA(260),
        explore: STRING_SCHEMA(220),
        check: STRING_SCHEMA(220),
        transfer: STRING_SCHEMA(240),
      },
    },
    teacherNotes: {
      type: "object",
      additionalProperties: false,
      required: ["rationale", "lookFor", "misconception", "sourceNote"],
      properties: {
        rationale: STRING_SCHEMA(300),
        lookFor: STRING_SCHEMA(220),
        misconception: STRING_SCHEMA(220),
        sourceNote: STRING_SCHEMA(220),
      },
    },
  },
} as const;

const ALLOWED_DURATIONS = new Set([5, 8, 10, 12, 15]);
const ID_PATTERN = /^[a-z0-9-]{1,32}$/;
const URL_OR_MARKUP_PATTERN = /(?:https?:\/\/|www\.|<\/?[a-z]|javascript:|data:text|on(?:click|load|error)\s*=)/i;
const CHILD_RECORD_PATTERN = /\b(?:diagnos(?:is|ed)|iep|504 plan|student id|medical record|disciplinary record)\b/i;
const HIGH_RISK_PATTERN = /\b(?:self[- ]?harm|suicide|sexual|pornograph|buy now|weapon|make a bomb|illegal drug)\b/i;
const EMAIL_PATTERN = /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/i;
const PHONE_PATTERN = /\b(?:\+\d{1,3}[ .-]?)?(?:\(\d{3}\)|\d{3})[ .-]\d{3}[ .-]\d{4}\b/;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function text(value: unknown): string | null {
  return typeof value === "string" ? value.trim() : null;
}

export function parseGenerationBrief(value: unknown): ValidationResult<GenerationBrief> {
  const fields: Record<string, string> = {};
  if (!isRecord(value)) {
    return { ok: false, code: "INVALID_BRIEF", message: "Check the lesson brief.", issues: ["Request must be an object."] };
  }

  const topic = text(value.topic) ?? "";
  const objective = text(value.objective) ?? "";
  const context = text(value.context) ?? "";
  const age = typeof value.age === "number" ? value.age : Number.NaN;
  const durationMinutes = typeof value.durationMinutes === "number" ? value.durationMinutes : Number.NaN;

  if (topic.length < 3 || topic.length > 120) fields.topic = "Use 3–120 characters.";
  if (objective.length < 10 || objective.length > 240) fields.objective = "Use one observable objective in 10–240 characters.";
  const domain = text(value.domain) ?? "";
  if (!Number.isInteger(age) || age < 3 || age > 6) fields.age = "Choose an age from 3 through 6.";
  if (!["early-literacy", "early-math", "integrated"].includes(domain)) fields.domain = "Choose reading, math, or an integrated lesson.";
  if (!ALLOWED_DURATIONS.has(durationMinutes)) fields.durationMinutes = "Choose 5, 8, 10, 12, or 15 minutes.";
  if (context.length > 300) fields.context = "Keep context under 300 characters.";

  const combined = `${topic}\n${objective}\n${context}`;
  if (EMAIL_PATTERN.test(combined) || PHONE_PATTERN.test(combined) || CHILD_RECORD_PATTERN.test(combined)) {
    fields.context = "Describe the class, not an individual child or student record.";
  }
  if (HIGH_RISK_PATTERN.test(combined)) {
    fields.topic = "This prototype only supports ordinary early-learning topics.";
  }
  if (URL_OR_MARKUP_PATTERN.test(combined)) {
    fields.context = "Links and markup are not accepted in lesson briefs.";
  }

  const issues = Object.entries(fields).map(([field, issue]) => `${field}: ${issue}`);
  if (issues.length) {
    return { ok: false, code: "INVALID_BRIEF", message: "Check the highlighted fields.", fields, issues };
  }

  return {
    ok: true,
    value: {
      topic,
      objective,
      domain: domain as LearningDomain,
      age,
      durationMinutes: durationMinutes as GenerationBrief["durationMinutes"],
      context,
    },
  };
}

/**
 * Canonicalize mechanical model variance before deterministic validation.
 * This never invents lesson content or correctness. It only applies the
 * renderer's stable IDs and enforces already-declared string ceilings.
 */
export function normalizeGeneratedArtifact(value: unknown): ArtifactNormalization {
  if (!isRecord(value)) return { value, changes: [] };

  const normalized = JSON.parse(JSON.stringify(value)) as unknown;
  const changes: string[] = [];
  normalizeStringLengths(normalized, LEARNING_ARTIFACT_JSON_SCHEMA, "artifact", changes);
  normalizeArtifactIds(normalized, changes);
  return { value: normalized, changes };
}

export function validateLearningArtifact(value: unknown): ValidationResult<LearningArtifact> {
  const issues: string[] = [];
  if (!isRecord(value)) {
    return { ok: false, code: "INVALID_ARTIFACT", message: "The generated lesson was malformed.", issues: ["Artifact must be an object."] };
  }

  const requiredStrings: Array<[string, unknown, number]> = [
    ["title", value.title, 70], ["subtitle", value.subtitle, 100], ["topic", value.topic, 120],
    ["objective", value.objective, 240],
  ];
  for (const [path, candidate, max] of requiredStrings) validateString(path, candidate, max, issues);
  if (value.schemaVersion !== ARTIFACT_SCHEMA_VERSION) issues.push(`schemaVersion must be ${ARTIFACT_SCHEMA_VERSION}.`);
  if (!Number.isInteger(value.age) || Number(value.age) < 3 || Number(value.age) > 6) issues.push("age must be an integer from 3 through 6.");
  if (!["early-literacy", "early-math", "integrated"].includes(String(value.domain))) issues.push("domain is invalid.");
  if (!ALLOWED_DURATIONS.has(Number(value.durationMinutes))) issues.push("durationMinutes is not supported.");

  const theme = value.theme;
  if (!isRecord(theme) || !["coral", "sun", "leaf", "sky", "grape"].includes(String(theme.accent)) || !["garden", "space", "workshop", "ocean", "museum"].includes(String(theme.motif))) {
    issues.push("theme is invalid.");
  }

  const hook = value.hook;
  if (!isRecord(hook)) issues.push("hook is missing.");
  else {
    validateString("hook.prompt", hook.prompt, 180, issues);
    validateString("hook.wonderQuestion", hook.wonderQuestion, 160, issues);
  }

  const methodology = value.methodology;
  if (!isRecord(methodology)) issues.push("methodology is missing.");
  else {
    validateString("methodology.primaryMethod", methodology.primaryMethod, 180, issues);
    validateString("methodology.skillProgression", methodology.skillProgression, 220, issues);
    validateString("methodology.accessibilitySupports", methodology.accessibilitySupports, 220, issues);
  }

  const model = value.model;
  if (!isRecord(model)) issues.push("model is missing.");
  else {
    validateString("model.headline", model.headline, 60, issues);
    validateString("model.instruction", model.instruction, 140, issues);
    validateString("model.exampleEmoji", model.exampleEmoji, 12, issues);
    validateString("model.exampleLabel", model.exampleLabel, 50, issues);
    validateString("model.explanation", model.explanation, 180, issues);
    validateString("model.gestureCue", model.gestureCue, 120, issues);
  }

  const explore = value.explore;
  const categoryIds = new Set<string>();
  if (!isRecord(explore)) issues.push("explore is missing.");
  else {
    validateString("explore.instruction", explore.instruction, 160, issues);
    if (!Array.isArray(explore.categories) || explore.categories.length !== 2) issues.push("explore.categories must contain exactly two categories.");
    else explore.categories.forEach((candidate, index) => {
      if (!isRecord(candidate)) return issues.push(`explore.categories.${index} is invalid.`);
      const id = text(candidate.id) ?? "";
      if (!ID_PATTERN.test(id) || categoryIds.has(id)) issues.push(`explore.categories.${index}.id is invalid or duplicated.`);
      categoryIds.add(id);
      validateString(`explore.categories.${index}.label`, candidate.label, 36, issues);
      validateString(`explore.categories.${index}.description`, candidate.description, 90, issues);
      validateString(`explore.categories.${index}.emoji`, candidate.emoji, 12, issues);
      validateString(`explore.categories.${index}.visualCue`, candidate.visualCue, 40, issues);
    });
    const itemIds = new Set<string>();
    if (!Array.isArray(explore.items) || explore.items.length < 4 || explore.items.length > 6) issues.push("explore.items must contain four to six items.");
    else explore.items.forEach((candidate, index) => {
      if (!isRecord(candidate)) return issues.push(`explore.items.${index} is invalid.`);
      const id = text(candidate.id) ?? "";
      if (!ID_PATTERN.test(id) || itemIds.has(id)) issues.push(`explore.items.${index}.id is invalid or duplicated.`);
      itemIds.add(id);
      validateString(`explore.items.${index}.label`, candidate.label, 40, issues);
      validateString(`explore.items.${index}.detail`, candidate.detail, 110, issues);
      validateString(`explore.items.${index}.emoji`, candidate.emoji, 12, issues);
      if (!categoryIds.has(String(candidate.category))) issues.push(`explore.items.${index}.category does not exist.`);
    });
  }

  const check = value.check;
  if (!isRecord(check)) issues.push("check is missing.");
  else {
    validateString("check.prompt", check.prompt, 180, issues);
    validateString("check.hint", check.hint, 150, issues);
    if (!Array.isArray(check.choices) || check.choices.length < 3 || check.choices.length > 4) issues.push("check.choices must contain three or four choices.");
    else {
      const choiceIds = new Set<string>();
      let correct = 0;
      check.choices.forEach((candidate, index) => {
        if (!isRecord(candidate)) return issues.push(`check.choices.${index} is invalid.`);
        const id = text(candidate.id) ?? "";
        if (!ID_PATTERN.test(id) || choiceIds.has(id)) issues.push(`check.choices.${index}.id is invalid or duplicated.`);
        choiceIds.add(id);
        validateString(`check.choices.${index}.label`, candidate.label, 90, issues);
        validateString(`check.choices.${index}.emoji`, candidate.emoji, 12, issues);
        validateString(`check.choices.${index}.explanation`, candidate.explanation, 180, issues);
        if (typeof candidate.correct !== "boolean") issues.push(`check.choices.${index}.correct must be boolean.`);
        if (candidate.correct === true) correct += 1;
      });
      if (correct !== 1) issues.push("check.choices must contain exactly one correct answer.");
    }
  }

  const narration = value.narration;
  if (!isRecord(narration)) issues.push("narration is missing.");
  else Object.entries({ welcome: 220, hook: 260, model: 260, explore: 220, check: 220, transfer: 240 })
    .forEach(([field, max]) => validateString(`narration.${field}`, narration[field], max, issues));

  for (const [section, limits] of [["transfer", { prompt: 180, adultCue: 220 }], ["celebration", { headline: 60, message: 160 }], ["teacherNotes", { rationale: 300, lookFor: 220, misconception: 220, sourceNote: 220 }]] as const) {
    const candidate = value[section];
    if (!isRecord(candidate)) issues.push(`${section} is missing.`);
    else Object.entries(limits).forEach(([field, max]) => validateString(`${section}.${field}`, candidate[field], max, issues));
  }

  const allStrings = collectStrings(value);
  if (allStrings.some((candidate) => URL_OR_MARKUP_PATTERN.test(candidate))) issues.push("Artifact contains a URL, markup, or executable syntax.");
  if (allStrings.some((candidate) => HIGH_RISK_PATTERN.test(candidate) || CHILD_RECORD_PATTERN.test(candidate))) {
    return { ok: false, code: "UNSAFE_CONTENT", message: "The lesson needs a safety review before it can be shown.", issues: ["Artifact matched a restricted content category."] };
  }

  if (issues.length) return { ok: false, code: "INVALID_ARTIFACT", message: "The generated lesson did not pass validation.", issues };
  return { ok: true, value: value as LearningArtifact };
}

function validateString(path: string, value: unknown, max: number, issues: string[]) {
  if (typeof value !== "string" || value.trim().length === 0 || value.length > max) {
    issues.push(`${path} must contain 1–${max} characters.`);
  }
}

function normalizeStringLengths(value: unknown, schema: unknown, path: string, changes: string[]): string | undefined {
  if (!isRecord(schema)) return;

  if (typeof value === "string" && typeof schema.maxLength === "number" && value.length > schema.maxLength) {
    return truncateAtBoundary(value, schema.maxLength);
  }

  if (Array.isArray(value) && isRecord(schema.items)) {
    value.forEach((item, index) => {
      const replacement = normalizeStringLengths(item, schema.items, `${path}.${index}`, changes);
      if (replacement !== undefined) {
        value[index] = replacement;
        changes.push(`${path}.${index}:trimmed`);
      }
    });
    return;
  }

  if (!isRecord(value) || !isRecord(schema.properties)) return;
  for (const [key, childSchema] of Object.entries(schema.properties)) {
    if (!(key in value)) continue;
    const replacement = normalizeStringLengths(value[key], childSchema, `${path}.${key}`, changes);
    if (replacement !== undefined) {
      value[key] = replacement;
      changes.push(`${path}.${key}:trimmed`);
    }
  }
}

function normalizeArtifactIds(value: unknown, changes: string[]) {
  if (!isRecord(value) || !isRecord(value.explore)) return;
  const categories = Array.isArray(value.explore.categories) ? value.explore.categories : [];
  const items = Array.isArray(value.explore.items) ? value.explore.items : [];
  const originalCategoryIds = categories.map((category) => isRecord(category) ? text(category.id) : null);
  const categoryIdsAreMappable = originalCategoryIds.every(Boolean)
    && new Set(originalCategoryIds).size === originalCategoryIds.length;

  if (categoryIdsAreMappable) {
    const categoryMap = new Map(originalCategoryIds.map((id, index) => [id as string, `home-${index + 1}`]));
    categories.forEach((category, index) => {
      if (!isRecord(category)) return;
      const canonical = `home-${index + 1}`;
      if (category.id !== canonical) changes.push(`artifact.explore.categories.${index}.id:canonicalized`);
      category.id = canonical;
    });
    items.forEach((item) => {
      if (!isRecord(item)) return;
      const canonicalCategory = categoryMap.get(String(item.category));
      if (canonicalCategory) item.category = canonicalCategory;
    });
  }

  items.forEach((item, index) => {
    if (!isRecord(item)) return;
    const canonical = `picture-${index + 1}`;
    if (item.id !== canonical) changes.push(`artifact.explore.items.${index}.id:canonicalized`);
    item.id = canonical;
  });

  if (!isRecord(value.check) || !Array.isArray(value.check.choices)) return;
  value.check.choices.forEach((choice, index) => {
    if (!isRecord(choice)) return;
    const canonical = `choice-${index + 1}`;
    if (choice.id !== canonical) changes.push(`artifact.check.choices.${index}.id:canonicalized`);
    choice.id = canonical;
  });
}

function truncateAtBoundary(value: string, maxLength: number) {
  const codePoints = Array.from(value);
  while (codePoints.join("").length > maxLength) codePoints.pop();
  const hardCut = codePoints.join("").trimEnd();
  const lastSpace = hardCut.lastIndexOf(" ");
  const cut = lastSpace >= Math.floor(maxLength * 0.65) ? hardCut.slice(0, lastSpace) : hardCut;
  return cut.replace(/[,:;\-–—]+$/u, "").trimEnd();
}

function collectStrings(value: unknown): string[] {
  if (typeof value === "string") return [value];
  if (Array.isArray(value)) return value.flatMap(collectStrings);
  if (isRecord(value)) return Object.values(value).flatMap(collectStrings);
  return [];
}
