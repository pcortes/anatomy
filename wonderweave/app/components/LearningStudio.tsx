"use client";

import { useEffect, useId, useState, useSyncExternalStore } from "react";
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  BookOpenCheck,
  Calculator,
  Check,
  ChevronDown,
  CircleAlert,
  Clock3,
  Eye,
  LibraryBig,
  LockKeyhole,
  Play,
  RotateCcw,
  ShieldCheck,
  Shapes,
  Sparkles,
  WandSparkles,
} from "lucide-react";
import type { GenerateResponse, GenerationBrief } from "@/app/lib/learning-artifact";
import { LearningExperience } from "./LearningExperience";
import styles from "./LearningStudio.module.css";

type StudioMode = "brief" | "preview" | "learn";
type FieldErrors = Partial<Record<keyof GenerationBrief, string>>;

const LOADING_STAGES = [
  "Choosing the right learning progression…",
  "Writing the listen-look-tap journey…",
  "Designing visual cues and spoken feedback…",
  "Checking age fit, method, and safety…",
];

const EXAMPLE_BRIEFS: Array<Pick<GenerationBrief, "topic" | "objective" | "domain" | "context">> = [
  {
    topic: "Seeds and the /s/ sound",
    objective: "Hear the first sound in familiar words and identify which words begin with /s/.",
    domain: "early-literacy",
    context: "Use seed and garden pictures. Children do not need to read independently.",
  },
  {
    topic: "Counting seeds",
    objective: "Recognize and compare small groups of seeds using quantities from 1 to 5.",
    domain: "early-math",
    context: "Use structured dot-like seed arrangements and one-to-one touching cues.",
  },
  {
    topic: "How a seed grows",
    objective: "Sequence the first stages of seed growth while practicing oral vocabulary and counting to 4.",
    domain: "integrated",
    context: "Make plant science the meaningful theme; keep one lead skill and one light connection.",
  },
];

const DOMAIN_OPTIONS = [
  { value: "early-literacy", label: "Reading", detail: "Sounds, letters & words", icon: BookOpen },
  { value: "early-math", label: "Math", detail: "Number sense & patterns", icon: Calculator },
  { value: "integrated", label: "Blend", detail: "One lead skill + a theme", icon: Shapes },
] as const;

const EMPTY_RESULT_ERROR = "The lesson workshop returned an empty draft. Please retry.";
const SAVED_LESSON_KEY = "wonderweave.saved-lesson.v1";

export function LearningStudio() {
  const [mode, setMode] = useState<StudioMode>("brief");
  const [brief, setBrief] = useState<GenerationBrief>({
    topic: EXAMPLE_BRIEFS[0].topic,
    objective: EXAMPLE_BRIEFS[0].objective,
    domain: EXAMPLE_BRIEFS[0].domain,
    age: 6,
    durationMinutes: 8,
    context: EXAMPLE_BRIEFS[0].context,
  });
  const [result, setResult] = useState<GenerateResponse | null>(null);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [error, setError] = useState<string | null>(null);
  const [errorTrace, setErrorTrace] = useState<string | null>(null);
  const [loadingStage, setLoadingStage] = useState(0);
  const [generating, setGenerating] = useState(false);
  const [preparedVoiceStream, setPreparedVoiceStream] = useState<MediaStream | null>(null);
  const hydrated = useSyncExternalStore(emptySubscribe, () => true, () => false);
  const formId = useId();

  useEffect(() => {
    if (!generating) return;
    const interval = window.setInterval(() => {
      setLoadingStage((current) => Math.min(current + 1, LOADING_STAGES.length - 1));
    }, 3_700);
    return () => window.clearInterval(interval);
  }, [generating]);

  useEffect(() => {
    try {
      const saved = window.sessionStorage.getItem(SAVED_LESSON_KEY);
      if (!saved) return;
      const parsed = JSON.parse(saved) as { mode?: StudioMode; result?: GenerateResponse };
      if (!parsed.result?.artifact || !parsed.result.receipt) return;
      const restore = window.setTimeout(() => {
        setResult(parsed.result ?? null);
        setMode(parsed.mode === "learn" ? "learn" : "preview");
      }, 0);
      return () => window.clearTimeout(restore);
    } catch {
      window.sessionStorage.removeItem(SAVED_LESSON_KEY);
    }
  }, []);

  const saveLesson = (nextResult: GenerateResponse, nextMode: "preview" | "learn") => {
    try {
      window.sessionStorage.setItem(SAVED_LESSON_KEY, JSON.stringify({ result: nextResult, mode: nextMode }));
    } catch {
      // The lesson still works when storage is unavailable; only refresh recovery is lost.
    }
  };

  const startLearningWithSound = async () => {
    let stream: MediaStream | null = null;
    try {
      if (navigator.mediaDevices?.getUserMedia) {
        // Begin microphone access inside the grown-up's play tap. Keeping the
        // page actively capturing lets the learner screen start audio without
        // a second autoplay-permission tap in supported browsers.
        stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      }
    } catch {
      // Enter the lesson anyway. The learner screen provides a clear retry.
    }
    setPreparedVoiceStream(stream);
    setMode("learn");
    if (result) saveLesson(result, "learn");
  };

  const update = <K extends keyof GenerationBrief>(field: K, value: GenerationBrief[K]) => {
    setBrief((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: undefined }));
    setError(null);
  };

  const applyExample = (index: number) => {
    setBrief((current) => ({ ...current, ...EXAMPLE_BRIEFS[index] }));
    setErrors({});
    setError(null);
  };

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setGenerating(true);
    setLoadingStage(0);
    setErrors({});
    setError(null);
    setErrorTrace(null);

    try {
      const response = await fetch("/api/generate", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(brief),
      });
      const payload = await response.json() as GenerateResponse & {
        error?: { message?: string; traceId?: string; fields?: FieldErrors };
      };
      if (!response.ok) {
        setErrors(payload.error?.fields ?? {});
        setError(payload.error?.message ?? "The lesson workshop could not finish this draft.");
        setErrorTrace(payload.error?.traceId ?? null);
        return;
      }
      if (!payload.artifact || !payload.receipt) {
        setError(EMPTY_RESULT_ERROR);
        return;
      }
      setResult(payload);
      setMode("preview");
      saveLesson(payload, "preview");
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch {
      setError("The lesson workshop could not be reached. Check the connection and try again.");
    } finally {
      setGenerating(false);
    }
  };

  if (mode === "learn" && result) {
    return <LearningExperience artifact={result.artifact} initialMicrophoneStream={preparedVoiceStream} onExit={() => {
      preparedVoiceStream?.getTracks().forEach((track) => track.stop());
      setPreparedVoiceStream(null);
      setMode("preview");
      saveLesson(result, "preview");
    }} />;
  }

  return (
    <main className={styles.shell} data-testid="learning-studio">
      <header className={styles.topbar}>
        <button className={styles.brand} type="button" onClick={() => setMode("brief")} aria-label="Wonderweave home">
          <span className={styles.brandMark} aria-hidden="true"><Sparkles size={20} /></span>
          <span><strong>Wonderweave</strong><small>teacher studio</small></span>
        </button>
        <nav className={styles.nav} aria-label="Primary navigation">
          <button className={styles.navActive} type="button"><WandSparkles size={17} /> Create</button>
          <a href="/anatomy"><LibraryBig size={17} /> Anatomy reference</a>
        </nav>
        <button className={styles.profile} type="button" aria-label="Open teacher profile">
          <span>PC</span><ChevronDown size={15} />
        </button>
      </header>

      {mode === "brief" ? (
        <div className={styles.studioGrid}>
          <section className={styles.formPanel} aria-labelledby={`${formId}-title`}>
            <div className={styles.kicker}><span>01</span> Shape the learning moment</div>
            <h1 id={`${formId}-title`}>What should click<br />for them today?</h1>
            <p className={styles.intro}>Choose reading, math, or a blend. We’ll turn any topic into a tiny listen-look-tap world—no independent reading required.</p>

            <form onSubmit={submit} noValidate>
              <div className={styles.exampleRow} aria-label="Example lesson briefs">
                <span>Try seeds</span>
                {EXAMPLE_BRIEFS.map((example, index) => (
                  <button key={example.topic} type="button" onClick={() => applyExample(index)}>{example.topic}</button>
                ))}
              </div>

              <fieldset className={styles.domainField}>
                <legend>Learning pathway</legend>
                <div className={styles.domainOptions}>
                  {DOMAIN_OPTIONS.map((option) => {
                    const Icon = option.icon;
                    const selected = brief.domain === option.value;
                    return (
                      <button
                        key={option.value}
                        type="button"
                        className={selected ? styles.domainSelected : ""}
                        aria-pressed={selected}
                        onClick={() => update("domain", option.value)}
                        data-testid={`domain-${option.value}`}
                      >
                        <Icon size={20} aria-hidden="true" />
                        <span><strong>{option.label}</strong><small>{option.detail}</small></span>
                        {selected && <Check size={16} aria-hidden="true" />}
                      </button>
                    );
                  })}
                </div>
                {errors.domain && <small className={styles.fieldError}>{errors.domain}</small>}
              </fieldset>

              <label className={styles.field}>
                <span>Topic</span>
                <input
                  data-testid="topic-input"
                  value={brief.topic}
                  onChange={(event) => update("topic", event.target.value)}
                  maxLength={120}
                  aria-invalid={Boolean(errors.topic)}
                  aria-describedby={errors.topic ? `${formId}-topic-error` : undefined}
                  placeholder="e.g. Seeds and the /s/ sound"
                />
                {errors.topic && <small id={`${formId}-topic-error`} className={styles.fieldError}>{errors.topic}</small>}
              </label>

              <label className={styles.field}>
                <span>One observable learning goal</span>
                <textarea
                  data-testid="objective-input"
                  value={brief.objective}
                  onChange={(event) => update("objective", event.target.value)}
                  maxLength={240}
                  aria-invalid={Boolean(errors.objective)}
                  aria-describedby={errors.objective ? `${formId}-objective-error` : `${formId}-objective-help`}
                  placeholder="Children will hear, point, count, compare…"
                />
                <small id={`${formId}-objective-help`} className={styles.fieldHelp}>Use a verb you can see: sort, compare, explain, build, predict.</small>
                {errors.objective && <small id={`${formId}-objective-error`} className={styles.fieldError}>{errors.objective}</small>}
              </label>

              <div className={styles.fieldPair}>
                <label className={styles.field}>
                  <span>Learner age</span>
                  <select data-testid="age-input" value={brief.age} onChange={(event) => update("age", Number(event.target.value))}>
                    {[3, 4, 5, 6].map((age) => <option key={age} value={age}>Age {age}</option>)}
                  </select>
                </label>
                <label className={styles.field}>
                  <span>Time together</span>
                  <select data-testid="duration-input" value={brief.durationMinutes} onChange={(event) => update("durationMinutes", Number(event.target.value) as GenerationBrief["durationMinutes"])}>
                    {[5, 8, 10, 12, 15].map((minutes) => <option key={minutes} value={minutes}>{minutes} minutes</option>)}
                  </select>
                </label>
              </div>

              <label className={styles.field}>
                <span>Helpful class context <em>optional</em></span>
                <textarea
                  className={styles.shortArea}
                  value={brief.context}
                  onChange={(event) => update("context", event.target.value)}
                  maxLength={300}
                  aria-invalid={Boolean(errors.context)}
                  placeholder="What have they noticed already? Any common mix-up?"
                />
                {errors.context && <small className={styles.fieldError}>{errors.context}</small>}
              </label>

              <div className={styles.privacyNote}>
                <LockKeyhole size={17} aria-hidden="true" />
                <span><strong>Describe the class, not a child.</strong> Don’t enter names, diagnoses, contact details, or student records.</span>
              </div>

              {error && (
                <div className={styles.errorBanner} role="alert" data-testid="generation-error">
                  <CircleAlert size={20} />
                  <span><strong>We couldn’t finish that lesson.</strong>{error}{errorTrace && <small>Reference {errorTrace}</small>}</span>
                </div>
              )}

              <button className={styles.generateButton} data-testid="generate-button" type="submit" disabled={!hydrated || generating}>
                {generating ? <><span className={styles.loader} aria-hidden="true" /> {LOADING_STAGES[loadingStage]}</> : <><WandSparkles size={20} /> Weave my lesson <ArrowRight size={20} /></>}
              </button>
              <p className={styles.generateCaption}>A live model designs the draft. Nothing publishes until you review it.</p>
            </form>
          </section>

          <aside className={styles.visionPanel} aria-label="How Wonderweave designs a lesson">
            <div className={styles.orbit} aria-hidden="true">
              <span className={styles.orbitOne}>notice</span>
              <span className={styles.orbitTwo}>try</span>
              <span className={styles.orbitThree}>explain</span>
              <div className={styles.orbitCore}><Sparkles size={34} /><strong>aha!</strong></div>
            </div>
            <div className={styles.visionCopy}>
              <span className={styles.handNote}>play with a purpose ↓</span>
              <h2>Listen. Look.<br />Tap. Grow.</h2>
              <p>For ages 3–6, every lesson pairs explicit teaching with guided play, spoken cues, big semantic pictures, warm feedback, and an off-screen conversation.</p>
              <ol>
                <li><span>1</span><div><strong>Model the thinking</strong><small>One clear worked example before the child tries.</small></div></li>
                <li><span>2</span><div><strong>Guide active practice</strong><small>Children hear, point, tap, say, count, and move.</small></div></li>
                <li><span>3</span><div><strong>Retrieve and transfer</strong><small>A changed example, then a real-world family moment.</small></div></li>
              </ol>
            </div>
            <div className={styles.trustStrip}>
              <span><ShieldCheck size={17} /> schema checked</span>
              <span><Eye size={17} /> teacher reviewed</span>
              <span><BookOpenCheck size={17} /> learning-led</span>
            </div>
          </aside>
        </div>
      ) : result ? (
        <Preview result={result} onEdit={() => setMode("brief")} onPlay={startLearningWithSound} />
      ) : null}
    </main>
  );
}

function emptySubscribe() {
  return () => {};
}

function Preview({ result, onEdit, onPlay }: { result: GenerateResponse; onEdit: () => void; onPlay: () => Promise<void> }) {
  const { artifact, receipt } = result;
  return (
    <div className={styles.previewShell} data-testid="lesson-preview">
      <div className={styles.previewTopline}>
        <button type="button" onClick={onEdit}><ArrowLeft size={17} /> Back to brief</button>
        <div><span><Check size={14} /> Schema passed</span><span><ShieldCheck size={14} /> Policy passed</span></div>
      </div>

      <section className={`${styles.previewHero} ${styles[`accent_${artifact.theme.accent}`]}`}>
        <div className={styles.previewMeta}>
          <span>Age {artifact.age}</span><span><Clock3 size={14} /> {artifact.durationMinutes} min</span><span>{artifact.domain.replace("early-", "")}</span><span>🔊 audio-first</span>
        </div>
        <div className={styles.previewTitle}>
          <p>Listen • look • tap</p>
          <h1 data-testid="preview-title">{artifact.title}</h1>
          <h2>{artifact.subtitle}</h2>
        </div>
        <div className={styles.previewAction}>
          <p><strong>Learning goal</strong>{artifact.objective}</p>
          <button type="button" onClick={() => void onPlay()} data-testid="try-lesson-button"><Play size={19} fill="currentColor" /> Start lesson with sound</button>
          <small>Preview only · not published</small>
        </div>
      </section>

      <div className={styles.previewGrid}>
        <section className={styles.sequenceCard}>
          <div className={styles.sectionHeading}><span>Lesson path</span><small>Audio-first explicit teaching + guided play</small></div>
          <div className={styles.pathRow}>
            <article><span>01</span><strong>Listen & wonder</strong><p>{artifact.hook.wonderQuestion}</p></article>
            <ArrowRight aria-hidden="true" />
            <article><span>02</span><strong>Watch one</strong><p>{artifact.model.explanation}</p></article>
            <ArrowRight aria-hidden="true" />
            <article><span>03</span><strong>Tap & try</strong><p>{artifact.explore.instruction}</p></article>
            <ArrowRight aria-hidden="true" />
            <article><span>04</span><strong>Remember</strong><p>{artifact.check.prompt}</p></article>
            <ArrowRight aria-hidden="true" />
            <article><span>05</span><strong>Talk or move</strong><p>{artifact.transfer.prompt}</p></article>
          </div>
        </section>

        <section className={styles.materialCard}>
          <div className={styles.sectionHeading}><span>The playground</span><small>{artifact.explore.items.length} examples · 2 ideas</small></div>
          <div className={styles.materialCategories}>
            {artifact.explore.categories.map((category) => (
              <div key={category.id}>
                <strong>{category.emoji} {category.label}</strong><small>{category.description}</small>
                <p>{artifact.explore.items.filter((item) => item.category === category.id).map((item) => <span key={item.id} title={item.label}>{item.emoji}</span>)}</p>
              </div>
            ))}
          </div>
        </section>

        <section className={styles.teacherCard}>
          <div className={styles.sectionHeading}><span>Teacher lens</span><small>What the design is doing</small></div>
          <dl>
            <div><dt>Primary method</dt><dd>{artifact.methodology.primaryMethod}</dd></div>
            <div><dt>Skill progression</dt><dd>{artifact.methodology.skillProgression}</dd></div>
            <div><dt>Non-reader access</dt><dd>{artifact.methodology.accessibilitySupports}</dd></div>
            <div><dt>Why this works</dt><dd>{artifact.teacherNotes.rationale}</dd></div>
            <div><dt>Look for</dt><dd>{artifact.teacherNotes.lookFor}</dd></div>
            <div><dt>Likely mix-up</dt><dd>{artifact.teacherNotes.misconception}</dd></div>
            <div><dt>Source status</dt><dd>{artifact.teacherNotes.sourceNote}</dd></div>
          </dl>
        </section>

        <aside className={styles.receiptCard}>
          <strong>Generation receipt</strong>
          <dl>
            <div><dt>Provider</dt><dd>{receipt.provider}</dd></div>
            <div><dt>Model</dt><dd data-testid="receipt-model">{receipt.model}</dd></div>
            <div><dt>Time</dt><dd>{(receipt.latencyMs / 1000).toFixed(1)} sec</dd></div>
            <div><dt>Attempts</dt><dd>{receipt.attempts}</dd></div>
            <div><dt>Artifact</dt><dd>v{receipt.schemaVersion}</dd></div>
          </dl>
          <p><ShieldCheck size={17} /> No child data was sent. This draft still needs your judgment before classroom use.</p>
        </aside>
      </div>

      <div className={styles.previewFooter}>
        <button type="button" onClick={onEdit}><RotateCcw size={17} /> Revise brief</button>
        <button type="button" onClick={onPlay}><Play size={17} fill="currentColor" /> Try listen-look-tap mode</button>
      </div>
    </div>
  );
}
