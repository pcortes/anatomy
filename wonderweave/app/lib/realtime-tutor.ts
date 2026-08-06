"use client";

import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";
import type { RealtimeSession } from "@openai/agents/realtime";
import type { LearningArtifact } from "./learning-artifact";
import { NARRATION_END_CUE } from "./voice-contract";

export type TutorStage = "hook" | "model" | "explore" | "check" | "transfer";
export type TutorVoiceStatus = "idle" | "connecting" | "listening" | "thinking" | "speaking" | "muted" | "error";

type TutorSnapshot = {
  artifact: LearningArtifact;
  stage: TutorStage;
  instruction: string;
  feedback: string;
  progress: string;
  onRepeatRequested: (instruction: string) => void;
  onHintRequested: (hint: string) => void;
  onAdultHelpRequested: () => void;
};

type RealtimeToken = {
  value?: string;
  expiresAt?: number;
  model?: string;
  error?: { message?: string };
};

type SpeechPurpose = "instruction" | "feedback" | "celebration";

type SpeechOptions = {
  interruptCurrent?: boolean;
};

type SpeechRequest = {
  id: number;
  message: string;
  purpose: SpeechPurpose;
  approvedMessage: string;
  expectedEnding: string;
  attempt: 0 | 1;
};

const EMPTY_PARAMETERS = {
  type: "object" as const,
  properties: {},
  required: [] as string[],
  additionalProperties: false as const,
};

const AUDIO_START_TIMEOUT_MS = 30_000;
const MAX_QUEUED_SPEECH_REQUESTS = 4;
const PLAYBACK_BLOCKED_MESSAGE = "Your browser paused the sound. Tap ‘Try sound again’ so I can read this step.";
const realtimeSdkPromise = import("@openai/agents/realtime");

export function useRealtimeTutor(snapshot: TutorSnapshot, initialMicrophoneStream?: MediaStream | null) {
  const supported = useSyncExternalStore(subscribeToRealtimeSupport, getRealtimeSupport, getServerRealtimeSupport);
  const snapshotRef = useRef(snapshot);
  const sessionRef = useRef<RealtimeSession | null>(null);
  const sdkRef = useRef<typeof import("@openai/agents/realtime") | null>(null);
  const audioElementRef = useRef<HTMLAudioElement | null>(null);
  const microphoneStreamRef = useRef<MediaStream | null>(null);
  const initialMicrophoneStreamRef = useRef(initialMicrophoneStream);
  const connectInFlightRef = useRef(false);
  const audioActiveRef = useRef(false);
  const requestActiveRef = useRef(false);
  const protectedNarrationRef = useRef(false);
  const protectedNarrationStartedRef = useRef(false);
  const discardActiveSpeechRef = useRef(false);
  const activeSpeechRef = useRef<SpeechRequest | null>(null);
  const speechQueueRef = useRef<SpeechRequest[]>([]);
  const responseDoneRef = useRef(false);
  const playbackStoppedRef = useRef(false);
  const responseStatusRef = useRef<string | null>(null);
  const responseTranscriptRef = useRef("");
  const requestSequenceRef = useRef(0);
  const watchdogRef = useRef<number | null>(null);
  const playbackBlockedRef = useRef(false);
  const mutedRef = useRef(false);
  const [status, setStatus] = useState<TutorVoiceStatus>("idle");
  const [connected, setConnected] = useState(false);
  const [muted, setMuted] = useState(false);
  const [narrationProtected, setNarrationProtected] = useState(false);
  const [count, setCount] = useState(0);
  const [completedCount, setCompletedCount] = useState(0);
  const [lastTranscript, setLastTranscript] = useState("");
  const [lastNarrationOutcome, setLastNarrationOutcome] = useState<"idle" | "pending" | "completed" | "error">("idle");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    snapshotRef.current = snapshot;
  }, [snapshot]);

  const clearWatchdog = useCallback(() => {
    if (watchdogRef.current !== null) {
      window.clearTimeout(watchdogRef.current);
      watchdogRef.current = null;
    }
  }, []);

  const releaseAudioElement = useCallback(() => {
    microphoneStreamRef.current?.getTracks().forEach((track) => track.stop());
    microphoneStreamRef.current = null;
    const audioElement = audioElementRef.current;
    if (!audioElement) return;
    audioElement.pause();
    audioElement.srcObject = null;
    audioElement.remove();
    audioElementRef.current = null;
  }, []);

  const closeSession = useCallback(() => {
    clearWatchdog();
    requestSequenceRef.current += 1;
    sessionRef.current?.close();
    sessionRef.current = null;
    audioActiveRef.current = false;
    requestActiveRef.current = false;
    protectedNarrationRef.current = false;
    protectedNarrationStartedRef.current = false;
    discardActiveSpeechRef.current = false;
    activeSpeechRef.current = null;
    speechQueueRef.current = [];
    responseDoneRef.current = false;
    playbackStoppedRef.current = false;
    responseStatusRef.current = null;
    responseTranscriptRef.current = "";
    connectInFlightRef.current = false;
    playbackBlockedRef.current = false;
    mutedRef.current = false;
    releaseAudioElement();
    setConnected(false);
    setMuted(false);
    setNarrationProtected(false);
    setLastNarrationOutcome("idle");
    setStatus("idle");
  }, [clearWatchdog, releaseAudioElement]);

  useEffect(() => closeSession, [closeSession]);

  const ensurePlayback = useCallback(async () => {
    const audioElement = audioElementRef.current;
    if (!audioElement?.srcObject) return true;
    try {
      await audioElement.play();
      playbackBlockedRef.current = false;
      setError((current) => current === PLAYBACK_BLOCKED_MESSAGE ? null : current);
      return true;
    } catch {
      playbackBlockedRef.current = true;
      setError(PLAYBACK_BLOCKED_MESSAGE);
      setStatus("error");
      return false;
    }
  }, []);

  const startSpeech = useCallback((
    session: RealtimeSession,
    request: SpeechRequest,
  ) => {
    clearWatchdog();
    const sequence = ++requestSequenceRef.current;
    activeSpeechRef.current = request;
    responseDoneRef.current = false;
    playbackStoppedRef.current = false;
    responseStatusRef.current = null;
    responseTranscriptRef.current = "";

    // App-authored narration is a protected read-aloud. Keep the microphone
    // closed until the browser confirms that its output buffer—not merely the
    // model's audio generation—has finished playing.
    protectedNarrationRef.current = true;
    protectedNarrationStartedRef.current = false;
    requestActiveRef.current = true;
    audioActiveRef.current = false;
    setNarrationProtected(true);
    setLastNarrationOutcome("pending");
    setStatus("thinking");
    session.mute(true);

    try {
      session.sendMessage(request.approvedMessage);
    } catch {
      requestSequenceRef.current += 1;
      activeSpeechRef.current = null;
      speechQueueRef.current = [];
      requestActiveRef.current = false;
      protectedNarrationRef.current = false;
      protectedNarrationStartedRef.current = false;
      setNarrationProtected(false);
      setLastNarrationOutcome("error");
      session.close();
      if (sessionRef.current === session) sessionRef.current = null;
      releaseAudioElement();
      setConnected(false);
      setMuted(false);
      setStatus("error");
      setError("The voice connection closed. Tap ‘Try sound again’ and I’ll reconnect.");
      return;
    }

    watchdogRef.current = window.setTimeout(() => {
      if (sessionRef.current !== session
        || sequence !== requestSequenceRef.current
        || protectedNarrationStartedRef.current) return;

      requestSequenceRef.current += 1;
      activeSpeechRef.current = null;
      speechQueueRef.current = [];
      requestActiveRef.current = false;
      protectedNarrationRef.current = false;
      protectedNarrationStartedRef.current = false;
      setNarrationProtected(false);
      setLastNarrationOutcome("error");
      session.close();
      if (sessionRef.current === session) sessionRef.current = null;
      releaseAudioElement();
      setConnected(false);
      setMuted(false);
      setStatus("error");
      setError("I connected, but no voice arrived. Tap ‘Try sound again’ and I’ll reconnect.");
    }, AUDIO_START_TIMEOUT_MS);
  }, [clearWatchdog, releaseAudioElement]);

  const requestSpeech = useCallback((
    session: RealtimeSession,
    message: string,
    purpose: SpeechPurpose,
    options: SpeechOptions = {},
  ) => {
    const normalized = normalizeSpeechText(message);
    if (!normalized) return;
    const expectedEnding = purpose === "instruction" ? NARRATION_END_CUE : "";
    const request: SpeechRequest = {
      id: requestSequenceRef.current + speechQueueRef.current.length + 1,
      message: normalized,
      purpose,
      approvedMessage: buildSpeechRequest(normalized, purpose),
      expectedEnding,
      attempt: 0,
    };

    if (requestActiveRef.current || audioActiveRef.current || activeSpeechRef.current) {
      if (options.interruptCurrent) {
        // Navigation is an intentional interruption. Stop the old page, discard
        // its incomplete result, and make the new page the only queued script.
        // Room noise still cannot interrupt protected narration because only a
        // trusted UI transition calls this path.
        speechQueueRef.current = [request];
        discardActiveSpeechRef.current = Boolean(activeSpeechRef.current);
        clearWatchdog();
        session.interrupt();
        return;
      }
      const lastQueued = speechQueueRef.current.at(-1);
      if (lastQueued?.message === request.message && lastQueued.purpose === request.purpose) return;
      // Never interrupt the phrase already playing. Keep the next page overview
      // ahead of incidental tap feedback, and collapse fast repeated taps to
      // the latest useful cue so the child does not hear a stale backlog.
      if (request.purpose === "instruction") {
        speechQueueRef.current = [request];
      } else {
        speechQueueRef.current = [
          ...speechQueueRef.current.filter((queued) => queued.purpose === "instruction"),
          request,
        ];
      }
      if (speechQueueRef.current.length > MAX_QUEUED_SPEECH_REQUESTS) speechQueueRef.current.shift();
      return;
    }

    startSpeech(session, request);
  }, [clearWatchdog, startSpeech]);

  const connect = useCallback(async (firstInstruction?: string) => {
    if (sessionRef.current) {
      if (firstInstruction) requestSpeech(sessionRef.current, firstInstruction, "instruction");
      return true;
    }
    if (!getRealtimeSupport()) {
      setError("This browser cannot start the live voice guide.");
      setStatus("error");
      return false;
    }
    if (connectInFlightRef.current) return false;
    connectInFlightRef.current = true;

    setStatus("connecting");
    setError(null);

    try {
      const audioElement = document.createElement("audio");
      audioElement.autoplay = true;
      audioElement.setAttribute("playsinline", "");
      audioElement.preload = "auto";
      audioElement.setAttribute("aria-hidden", "true");
      audioElement.dataset.wonderweaveVoice = "true";
      document.body.appendChild(audioElement);
      audioElementRef.current = audioElement;

      // Start capture inside the grown-up's tap. Browsers are much more reliable
      // about playing the returning MediaStream while the page is actively capturing.
      const preparedStream = initialMicrophoneStreamRef.current;
      initialMicrophoneStreamRef.current = null;
      const microphoneStream = preparedStream?.active
        ? preparedStream
        : await navigator.mediaDevices.getUserMedia({ audio: true });
      microphoneStreamRef.current = microphoneStream;

      const response = await fetch("/api/realtime/token", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        cache: "no-store",
      });
      const token = await response.json() as RealtimeToken;
      if (!response.ok || !token.value) {
        throw new Error(token.error?.message || "The voice guide could not start.");
      }

      // Fetch the voice runtime as soon as the learner app opens. This keeps an
      // in-progress lesson from losing its lazy chunk during a later deployment.
      const sdk = await realtimeSdkPromise;
      sdkRef.current = sdk;
      const agent = buildTutorAgent(snapshotRef, sdk);
      const transport = new sdk.OpenAIRealtimeWebRTC({ audioElement, mediaStream: microphoneStream });
      const session = new sdk.RealtimeSession(agent, {
        model: token.model || "gpt-realtime-2.1",
        transport,
        historyStoreAudio: false,
        tracingDisabled: true,
        config: {
          outputModalities: ["audio"],
          reasoning: { effort: "low" },
          providerData: { max_output_tokens: "inf" },
          audio: {
            input: {
              noiseReduction: { type: "near_field" },
              transcription: {
                model: "gpt-4o-mini-transcribe",
                language: "en",
                prompt: "A young child is doing a short reading, math, or science lesson. Expect fragments, pauses, and child pronunciation.",
              },
              turnDetection: {
                type: "semantic_vad",
                eagerness: "low",
                createResponse: true,
                interruptResponse: true,
              },
            },
            output: { voice: "marin", speed: 0.94 },
          },
        },
      });

      const startNextQueuedSpeech = () => {
        const next = speechQueueRef.current.shift();
        if (next) {
          startSpeech(session, next);
          return true;
        }
        return false;
      };

      const releaseProtectedNarration = () => {
        protectedNarrationRef.current = false;
        protectedNarrationStartedRef.current = false;
        setNarrationProtected(false);
        session.mute(mutedRef.current);
      };

      const finishProtectedNarration = () => {
        const active = activeSpeechRef.current;
        if (!active || !responseDoneRef.current || !playbackStoppedRef.current) return;

        clearWatchdog();
        if (discardActiveSpeechRef.current) {
          discardActiveSpeechRef.current = false;
          activeSpeechRef.current = null;
          requestActiveRef.current = false;
          audioActiveRef.current = false;
          responseDoneRef.current = false;
          playbackStoppedRef.current = false;
          responseStatusRef.current = null;
          responseTranscriptRef.current = "";
          if (startNextQueuedSpeech()) return;
          releaseProtectedNarration();
          setLastNarrationOutcome("idle");
          setStatus(playbackBlockedRef.current ? "error" : mutedRef.current ? "muted" : "listening");
          return;
        }
        const transcript = normalizeSpeechText(responseTranscriptRef.current);
        const responseCompleted = responseStatusRef.current === "completed";
        const endingWasSpoken = !active.expectedEnding
          || normalizeForComparison(transcript).includes(normalizeForComparison(active.expectedEnding));

        activeSpeechRef.current = null;
        requestActiveRef.current = false;
        audioActiveRef.current = false;

        if ((!responseCompleted || !endingWasSpoken) && active.attempt === 0) {
          const retry: SpeechRequest = {
            ...active,
            id: active.id + 1,
            attempt: 1,
            approvedMessage: buildSpeechRequest(active.message, active.purpose, true),
          };
          startSpeech(session, retry);
          return;
        }

        setLastTranscript(transcript);
        if (!responseCompleted || !endingWasSpoken) {
          speechQueueRef.current = [];
          releaseProtectedNarration();
          setLastNarrationOutcome("error");
          setStatus("error");
          setError("That read-aloud ended early. Tap ‘Try sound again’ and I’ll read the whole page.");
          return;
        }

        setCompletedCount((current) => current + 1);
        setLastNarrationOutcome("completed");
        if (startNextQueuedSpeech()) return;
        releaseProtectedNarration();
        setStatus(playbackBlockedRef.current ? "error" : mutedRef.current ? "muted" : "listening");
      };

      const markModelAudioStarted = () => {
        clearWatchdog();
        if (!audioActiveRef.current) setCount((current) => current + 1);
        audioActiveRef.current = true;
        if (protectedNarrationRef.current) protectedNarrationStartedRef.current = true;
        setStatus("speaking");
        void ensurePlayback();
      };
      const markModelPlaybackStopped = () => {
        audioActiveRef.current = false;
        if (activeSpeechRef.current) {
          // Ignore a late stop/clear from an earlier response after the next
          // page has been queued but before its audio has actually begun.
          if (!protectedNarrationStartedRef.current && !discardActiveSpeechRef.current) return;
          playbackStoppedRef.current = true;
          finishProtectedNarration();
          return;
        }
        requestActiveRef.current = false;
        if (startNextQueuedSpeech()) return;
        setStatus(playbackBlockedRef.current ? "error" : mutedRef.current ? "muted" : "listening");
      };

      session.on("agent_start", () => {
        requestActiveRef.current = true;
        setStatus("thinking");
      });
      session.on("audio_start", () => setStatus("speaking"));
      // The SDK's audio_stopped event means generation ended. With WebRTC,
      // buffered sound may still be playing, so it must not reopen the mic.
      session.on("audio_stopped", () => {});
      session.on("audio_interrupted", () => {
        if (!activeSpeechRef.current) setStatus(mutedRef.current ? "muted" : "listening");
      });
      session.on("agent_end", (_context, _agent, output) => {
        if (activeSpeechRef.current && output && !responseTranscriptRef.current) {
          responseTranscriptRef.current = output;
        }
      });
      session.on("transport_event", (event) => {
        // WebRTC delivers sound over its media track, so the SDK's generic
        // audio_start/audio_stopped callbacks are not guaranteed to fire.
        // These server events describe the real browser output buffer.
        if (event.type === "output_audio_buffer.started") {
          markModelAudioStarted();
        } else if (event.type === "response.output_audio_transcript.delta" && activeSpeechRef.current) {
          responseTranscriptRef.current += typeof event.delta === "string" ? event.delta : "";
        } else if (event.type === "response.output_audio_transcript.done" && activeSpeechRef.current) {
          responseTranscriptRef.current = typeof event.transcript === "string" ? event.transcript : responseTranscriptRef.current;
        } else if (event.type === "response.done" && activeSpeechRef.current) {
          responseDoneRef.current = true;
          responseStatusRef.current = typeof event.response?.status === "string" ? event.response.status : null;
          finishProtectedNarration();
        } else if (event.type === "output_audio_buffer.stopped" || event.type === "output_audio_buffer.cleared") {
          markModelPlaybackStopped();
        }
      });
      session.on("error", () => {
        clearWatchdog();
        requestActiveRef.current = false;
        audioActiveRef.current = false;
        protectedNarrationRef.current = false;
        protectedNarrationStartedRef.current = false;
        activeSpeechRef.current = null;
        speechQueueRef.current = [];
        session.close();
        if (sessionRef.current === session) sessionRef.current = null;
        releaseAudioElement();
        setConnected(false);
        setMuted(false);
        setNarrationProtected(false);
        setLastNarrationOutcome("error");
        setError("The voice guide lost its connection. Tap ‘Try sound again’ to reconnect.");
        setStatus("error");
      });

      sessionRef.current = session;
      await session.connect({ apiKey: token.value });
      session.mute(false);
      setConnected(true);
      setStatus("listening");
      if (firstInstruction) requestSpeech(session, firstInstruction, "instruction");
      return true;
    } catch (caught) {
      clearWatchdog();
      sessionRef.current?.close();
      sessionRef.current = null;
      releaseAudioElement();
      setConnected(false);
      setStatus("error");
      const message = caught instanceof Error ? caught.message : "The voice guide could not start.";
      setError(/dynamically imported module|module script failed|importing a module/i.test(message)
        ? "Wonderweave was updated while this lesson was open. Tap ‘Refresh voice’ to keep this lesson and load the new voice guide."
        : message);
      return false;
    } finally {
      connectInFlightRef.current = false;
    }
  }, [clearWatchdog, ensurePlayback, releaseAudioElement, requestSpeech, startSpeech]);

  const speak = useCallback((
    message: string,
    purpose: SpeechPurpose = "feedback",
    options: SpeechOptions = {},
  ) => {
    const session = sessionRef.current;
    if (!session || !message.trim()) return false;
    void ensurePlayback();
    requestSpeech(session, message, purpose, options);
    return true;
  }, [ensurePlayback, requestSpeech]);

  const toggleMute = useCallback(() => {
    const session = sessionRef.current;
    if (!session) return;
    const next = !mutedRef.current;
    mutedRef.current = next;
    session.mute(next || protectedNarrationRef.current);
    setMuted(next);
    setStatus(next ? "muted" : audioActiveRef.current ? "speaking" : protectedNarrationRef.current ? "thinking" : "listening");
  }, []);

  useEffect(() => {
    const session = sessionRef.current;
    const sdk = sdkRef.current;
    if (!session || !sdk) return;
    void session.updateAgent(buildTutorAgent(snapshotRef, sdk)).catch(() => {
      setError("The voice guide could not follow the new lesson step.");
      setStatus("error");
    });
  }, [snapshot.artifact, snapshot.stage]);

  return {
    supported,
    connected,
    muted,
    narrationProtected,
    status,
    count,
    completedCount,
    lastTranscript,
    lastNarrationOutcome,
    error,
    connect,
    disconnect: closeSession,
    speak,
    toggleMute,
  };
}

function buildTutorAgent(
  snapshotRef: React.MutableRefObject<TutorSnapshot>,
  sdk: typeof import("@openai/agents/realtime"),
) {
  const getLessonState = sdk.tool({
    name: "get_lesson_state",
    description: "Read the authoritative current lesson step, instruction, and progress. Call this before discussing lesson state when uncertain.",
    parameters: EMPTY_PARAMETERS,
    execute: async () => {
      const current = snapshotRef.current;
      return JSON.stringify({
        stage: current.stage,
        instruction: current.instruction,
        lastInterfaceFeedback: current.feedback,
        progress: current.progress,
        rule: "Do not advance the interface or invent a different task.",
      });
    },
  });

  const repeatInstruction = sdk.tool({
    name: "repeat_instruction",
    description: "Use when the child asks to hear the direction again, says what/again, or appears confused about what to do.",
    parameters: EMPTY_PARAMETERS,
    execute: async () => {
      const current = snapshotRef.current;
      current.onRepeatRequested(current.instruction);
      return `Repeat this approved instruction now, slowly and warmly, without adding a second task: ${current.instruction}`;
    },
  });

  const giveHint = sdk.tool({
    name: "give_approved_hint",
    description: "Use after an attempt or when the child asks for help. Return only the next teacher-approved hint; never reveal the answer immediately.",
    parameters: EMPTY_PARAMETERS,
    execute: async () => {
      const current = snapshotRef.current;
      const hint = approvedHint(current);
      current.onHintRequested(hint);
      return `Give this one hint now, then wait: ${hint}`;
    },
  });

  const askGrownUp = sdk.tool({
    name: "ask_grown_up",
    description: "Use for safety concerns, personal questions, requests outside the lesson, repeated confusion after two hints, or when the child asks for a grown-up.",
    parameters: EMPTY_PARAMETERS,
    execute: async () => {
      snapshotRef.current.onAdultHelpRequested();
      return "Say: Let's get your grown-up to help us with this part.";
    },
  });

  const current = snapshotRef.current;
  return new sdk.RealtimeAgent({
    name: "Wonderweave Voice Guide",
    voice: "marin",
    instructions: buildTutorInstructions(current),
    tools: [getLessonState, repeatInstruction, giveHint, askGrownUp],
  });
}

function buildTutorInstructions(current: TutorSnapshot) {
  const lesson = {
    title: current.artifact.title,
    topic: current.artifact.topic,
    age: current.artifact.age,
    objective: current.artifact.objective,
    stage: current.stage,
    currentInstruction: current.instruction,
    modelExample: current.artifact.model.explanation,
    exploreInstruction: current.artifact.explore.instruction,
    categories: current.artifact.explore.categories.map((category) => ({ label: category.label, description: category.description })),
    checkPrompt: current.artifact.check.prompt,
    approvedHint: current.artifact.check.hint,
    transferPrompt: current.artifact.transfer.prompt,
  };

  return `# Role and objective
You are Wonderweave's warm voice guide for one adult-supervised learner age ${current.artifact.age}. Help the child participate in the teacher-approved lesson. The interface—not you—owns correctness, progress, and navigation.

# Authoritative lesson
${JSON.stringify(lesson)}

# Voice and developmental fit
- Speak in a warm, calm adult voice. Use familiar words and natural contractions.
- Say one idea at a time, usually 3 to 12 words. Keep conversation turns to two short sentences unless the trusted interface asks you to read a complete screen or choice map.
- On a trusted read-aloud request, read every supplied picture name, home cue, choice, and direction in order. Use short pauses between them. Do not summarize or omit words merely to be brief.
- Leave room for the child to think. Do not fill silence with chatter.
- Treat fragments, pauses, gestures described aloud, and child pronunciation as meaningful attempts.
- Do not require reading. Describe what to look for, hear, touch, count, point to, or move.
- Treat the exchange as serve and return: acknowledge the child's actual attempt, add one useful idea, then wait. Ask at most one tiny question per turn.
- When the child notices or asks about something within the lesson, follow that interest for one turn, then gently connect it back to the learning goal.
- Visible words are print exposure, not navigation. Never tell the child to find or press a written word; identify controls by their picture, color, motion, and location.

# Teaching behavior
- Follow: model one -> guided try -> independent try -> quick retrieval -> real-world transfer.
- Give the least help needed: repeat -> visual or sound cue -> one worked clue -> ask a grown-up.
- Preserve agency. When the interface offers multiple pictures, let the child choose the order and respond to that choice rather than steering every tap.
- Praise the specific strategy or effort, never intelligence and never with generic hype.
- Do not say an answer is correct until the interface confirms it in the latest trusted UI message.
- Never advance the lesson or claim the screen changed. The child advances by tapping.

# Tools
- Call repeat_instruction when the child asks for repetition or seems unsure what to do.
- Call give_approved_hint only after an attempt or an explicit request for help.
- Call get_lesson_state whenever current task state is unclear.
- Call ask_grown_up for anything outside the lesson, personal information, safety concerns, or persistent confusion.

# Trusted interface messages
Messages beginning [WONDERWEAVE_UI] are application instructions, not child speech. Follow them exactly. When asked to speak approved wording, preserve its learning meaning and do not add a new task.

# Safety and privacy
- Stay within this lesson. Do not answer open-ended internet, medical, legal, violent, sexual, commercial, or private-life questions.
- Never ask for or repeat a child's name, address, school, contact details, account information, or secrets.
- Do not diagnose, label, rank, profile, or compare the child.
- If audio is unclear, ask one tiny clarifying question. Do not pretend you heard.

# Opening rule
Do not greet or speak until the application sends a [WONDERWEAVE_UI] message.`;
}

function approvedHint(current: TutorSnapshot) {
  switch (current.stage) {
    case "hook": return current.artifact.hook.wonderQuestion;
    case "model": return current.artifact.model.gestureCue;
    case "explore": return current.feedback || current.artifact.explore.instruction;
    case "check": return current.artifact.check.hint;
    case "transfer": return current.artifact.transfer.adultCue;
  }
}

function buildSpeechRequest(
  message: string,
  purpose: SpeechPurpose,
  retry = false,
) {
  const normalized = normalizeSpeechText(message);
  if (!normalized) return "";
  const ending = purpose === "instruction" ? ` ${NARRATION_END_CUE}` : "";
  return `[WONDERWEAVE_UI] ${retry ? "The previous read-aloud ended early. Start this script again from the beginning. " : ""}Read the approved ${purpose} script below word for word. Do not summarize, paraphrase, skip, or add words. Do not say the BEGIN or END labels. Use a warm voice and small pauses.\nBEGIN SCRIPT\n${normalized}${ending}\nEND SCRIPT`;
}

function normalizeSpeechText(value: string) {
  return value.replace(/\s+/g, " ").trim();
}

function normalizeForComparison(value: string) {
  return value.toLocaleLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

function subscribeToRealtimeSupport() {
  return () => {};
}

function getRealtimeSupport() {
  return typeof window !== "undefined"
    && "RTCPeerConnection" in window
    && Boolean(navigator.mediaDevices?.getUserMedia);
}

function getServerRealtimeSupport() {
  return false;
}
