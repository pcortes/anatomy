"use client";

import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import {
  ArrowLeft,
  ArrowRight,
  CircleAlert,
  Check,
  Ear,
  Eye,
  Hand,
  Heart,
  LoaderCircle,
  Mic,
  MicOff,
  RotateCcw,
  Sparkles,
  UsersRound,
  Volume2,
  VolumeX,
  X,
} from "lucide-react";
import type { LearningArtifact } from "@/app/lib/learning-artifact";
import { useRealtimeTutor, type TutorVoiceStatus } from "@/app/lib/realtime-tutor";
import styles from "./LearningStudio.module.css";

type LearnStage = "hook" | "model" | "explore" | "check" | "transfer";
type ExploreReaction = "ready" | "listen" | "correct" | "try-again" | "complete";

const STAGES: LearnStage[] = ["hook", "model", "explore", "check", "transfer"];

export function LearningExperience({
  artifact,
  initialMicrophoneStream,
  onExit,
}: {
  artifact: LearningArtifact;
  initialMicrophoneStream?: MediaStream | null;
  onExit: () => void;
}) {
  const [stage, setStage] = useState<LearnStage>("hook");
  const [selectedItem, setSelectedItem] = useState<string | null>(null);
  const [placed, setPlaced] = useState<Record<string, string>>({});
  const [feedback, setFeedback] = useState("Tap the wiggling picture. Listen. Then tap a glowing picture home.");
  const [exploreReaction, setExploreReaction] = useState<ExploreReaction>("ready");
  const [wrongChoice, setWrongChoice] = useState<string | null>(null);
  const [solved, setSolved] = useState(false);
  const [confetti, setConfetti] = useState(false);
  const [adultHelpRequested, setAdultHelpRequested] = useState(false);
  const [voiceCue, setVoiceCue] = useState<string | null>(null);
  const autoVoiceStartedRef = useRef(false);

  const stageIndex = STAGES.indexOf(stage);
  const placedCount = Object.keys(placed).length;
  const allPlaced = placedCount === artifact.explore.items.length;
  const unplaced = useMemo(() => artifact.explore.items.filter((item) => !placed[item.id]), [artifact.explore.items, placed]);
  const learningFocus = findLearningFocus(artifact);
  const focusHome = findFocusHome(artifact, learningFocus);
  const exampleHome = resolveModelHome(artifact, learningFocus);
  const stageNarration = useMemo(() => buildCompleteStageNarration(artifact), [artifact]);
  const narrator = useRealtimeTutor({
    artifact,
    stage,
    instruction: stageNarration[stage],
    feedback,
    progress: stage === "explore"
      ? `${placedCount} of ${artifact.explore.items.length} pictures placed`
      : stage === "check" ? solved ? "the interface confirmed the answer" : "waiting for a picture choice"
        : `step ${stageIndex + 1} of ${STAGES.length}`,
    onRepeatRequested: (instruction) => setVoiceCue(instruction),
    onHintRequested: (hint) => {
      setVoiceCue(hint);
      if (stage === "explore") setFeedback(hint);
    },
    onAdultHelpRequested: () => setAdultHelpRequested(true),
  }, initialMicrophoneStream);
  const voiceEnabled = narrator.connected;
  const voiceRefreshRequired = narrator.error?.startsWith("Wonderweave was updated") ?? false;
  const autoConnectVoice = narrator.connect;
  const realtimeSupported = narrator.supported;

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [stage]);

  useEffect(() => {
    if (!realtimeSupported || autoVoiceStartedRef.current) return;
    autoVoiceStartedRef.current = true;
    void autoConnectVoice(stageNarration.hook);
  }, [autoConnectVoice, realtimeSupported, stageNarration.hook]);

  const enableVoice = async () => {
    await narrator.connect(stageNarration[stage]);
  };

  const toggleVoice = () => {
    if (voiceEnabled) narrator.toggleMute();
    else void enableVoice();
  };

  const repeatInstruction = () => {
    setVoiceCue(stageNarration[stage]);
    if (voiceEnabled) narrator.speak(stageNarration[stage], "instruction");
    else void narrator.connect(stageNarration[stage]);
  };

  const say = (message: string, purpose: "feedback" | "celebration" = "feedback") => {
    if (voiceEnabled) narrator.speak(message, purpose);
  };

  const readAloud = (message: string) => {
    if (voiceEnabled) narrator.speak(message, "instruction");
    else void narrator.connect(message);
  };

  const moveToStage = (next: LearnStage) => {
    setStage(next);
    setVoiceCue(null);
    if (voiceEnabled) narrator.speak(stageNarration[next], "instruction", { interruptCurrent: true });
  };

  const hearHookPicture = (itemId: string) => {
    const item = artifact.explore.items.find((candidate) => candidate.id === itemId);
    if (!item) return;
    say(`${item.label}. You found the ${item.label} picture. Tap another picture, or tap the big glowing eye button when you are ready.`);
  };

  const selectItem = (itemId: string) => {
    const item = artifact.explore.items.find((candidate) => candidate.id === itemId);
    if (!item) return;
    const message = `${item.label}. ${buildHomeMap(artifact)} Now both big picture homes are glowing. Tap the matching home picture.`;
    setSelectedItem(item.id);
    setExploreReaction("listen");
    setFeedback(message);
    say(message);
  };

  const putInCategory = (categoryId: string) => {
    const category = artifact.explore.categories.find((candidate) => candidate.id === categoryId);
    if (!category) return;
    if (!selectedItem) {
      const message = `${category.visualCue}. This picture is ${spokenHomeLabel(category.label)}. ${category.description} Now tap the wiggling picture above.`;
      setFeedback(message);
      setExploreReaction("ready");
      say(message);
      return;
    }
    const item = artifact.explore.items.find((candidate) => candidate.id === selectedItem);
    if (!item) return;
    if (item.category !== categoryId) {
      const message = `Good try. ${item.label} does not go with ${category.visualCue}. The other big picture home is wiggling now. Tap the other home.`;
      setFeedback(message);
      setExploreReaction("try-again");
      say(message);
      return;
    }
    const finishesGame = placedCount + 1 === artifact.explore.items.length;
    const message = `${item.label} goes with ${category.visualCue}. You did it.${finishesGame ? " Every picture is home. Tap the big glowing arrow at the bottom." : " Now another picture is wiggling. Tap it to keep going."}`;
    setPlaced((current) => ({ ...current, [item.id]: categoryId }));
    setSelectedItem(null);
    setExploreReaction(finishesGame ? "complete" : "correct");
    setFeedback(message);
    say(message, finishesGame ? "celebration" : "feedback");
  };

  const answer = (choiceId: string) => {
    const choice = artifact.check.choices.find((candidate) => candidate.id === choiceId);
    if (!choice) return;
    if (choice.correct) {
      setWrongChoice(null);
      setSolved(true);
      setConfetti(true);
      say(`${choice.label}. ${choice.explanation} ${artifact.celebration.message} Tap the big glowing arrow for one last activity.`, "celebration");
      window.setTimeout(() => setConfetti(false), 1_500);
    } else {
      setWrongChoice(choiceId);
      setSolved(false);
      say(`${choice.label}. Good try. ${choice.explanation} ${artifact.check.hint} Look for the other picture that is wiggling.`);
    }
  };

  const restart = () => {
    moveToStage("hook");
    setSelectedItem(null);
    setPlaced({});
    setFeedback("Tap the wiggling picture. Listen. Then tap a glowing picture home.");
    setExploreReaction("ready");
    setWrongChoice(null);
    setSolved(false);
  };

  return (
    <main className={`${styles.learnShell} ${styles.preReaderShell} ${styles[`accent_${artifact.theme.accent}`]}`} data-testid="learning-experience">
      <header className={styles.childHeader}>
        <button type="button" className={styles.adultExit} onClick={onExit} aria-label="Return to the grown-up lesson preview">
          <ArrowLeft size={21} /><UsersRound size={23} /><span className={styles.srOnly}>Grown-up</span>
        </button>

        <div className={styles.pictureProgress} aria-label={`Activity ${stageIndex + 1} of ${STAGES.length}`}>
          <StageDot active={stage === "hook"} complete={stageIndex > 0}><Sparkles size={18} /></StageDot>
          <StageDot active={stage === "model"} complete={stageIndex > 1}><Eye size={18} /></StageDot>
          <StageDot active={stage === "explore"} complete={stageIndex > 2}><Hand size={18} /></StageDot>
          <StageDot active={stage === "check"} complete={stageIndex > 3}><Ear size={18} /></StageDot>
          <StageDot active={stage === "transfer"} complete={false}><Heart size={18} /></StageDot>
        </div>

        <div className={styles.pictureTools}>
          <button
            type="button"
            className={voiceEnabled ? styles.soundOn : styles.soundOff}
            onClick={toggleVoice}
            aria-pressed={voiceEnabled && !narrator.muted}
            aria-label={!voiceEnabled ? "Start the voice guide" : narrator.muted ? "Turn the microphone on" : "Rest the microphone"}
            data-testid="sound-toggle"
          >
            {narrator.status === "connecting" ? <LoaderCircle className={styles.spin} size={25} />
              : voiceEnabled && !narrator.muted ? <Mic size={25} />
                : voiceEnabled ? <MicOff size={25} />
                  : <VolumeX size={25} />}
          </button>
          <button
            type="button"
            className={styles.pictureRepeat}
            onClick={repeatInstruction}
            disabled={!narrator.supported}
            aria-label="Hear everything again"
            data-testid="repeat-instruction"
          >
            <Volume2 size={27} /><RotateCcw size={15} />
          </button>
        </div>
      </header>

      <button
        type="button"
        className={`${styles.voiceGuide} ${narrator.status === "speaking" ? styles.voiceSpeaking : ""} ${narrator.connected ? styles.voiceConnected : ""}`}
        onClick={repeatInstruction}
        aria-label="Tap your Wonder Buddy to hear help again"
        data-testid="voice-status"
        data-narration-count={narrator.count}
        data-voice-state={narrator.status}
        data-voice-connected={narrator.connected}
        data-narration-protected={narrator.narrationProtected}
        data-narration-complete-count={narrator.completedCount}
        data-last-spoken-transcript={narrator.lastTranscript}
        data-last-narration-outcome={narrator.lastNarrationOutcome}
      >
        <span className={styles.voiceBuddy} aria-hidden="true">
          <Sparkles className={styles.buddySpark} size={15} />
          <span className={styles.buddyEyes}><i /><i /></span>
          <span className={styles.buddySmile} />
        </span>
        <span className={styles.voiceWave} aria-hidden="true"><i /><i /><i /><i /><i /></span>
        <span className={styles.srOnly} role="status" aria-live="polite">{voiceStatusLabel(narrator.status, narrator.connected, narrator.narrationProtected)}</span>
      </button>

      {!narrator.supported && (
        <div className={styles.grownupRecovery} role="status" data-grownup-only="true">
          <UsersRound size={24} /><span><strong>Grown-up help needed.</strong> This browser cannot use the live voice guide.</span>
        </div>
      )}

      {narrator.error && (
        <div className={styles.grownupRecovery} role="alert" data-testid="voice-error" data-grownup-only="true">
          <CircleAlert size={20} /><span><strong>Grown-up help needed.</strong> {narrator.error}</span>
          <button type="button" onClick={voiceRefreshRequired ? () => window.location.reload() : repeatInstruction} data-testid="retry-voice">
            {voiceRefreshRequired ? "Refresh voice" : "Try sound again"}
          </button>
        </div>
      )}

      {voiceCue && voiceEnabled && (
        <div className={styles.pictureVoiceCue} role="status" data-testid="voice-cue">
          <Volume2 size={24} /><span className={styles.voiceWave} aria-hidden="true"><i /><i /><i /><i /></span>
          <span className={styles.srOnly}>{voiceCue}</span>
          <button type="button" onClick={() => setVoiceCue(null)} aria-label="Hide the voice cue"><X size={17} /></button>
        </div>
      )}

      {adultHelpRequested && (
        <div className={styles.grownupRecovery} role="alert" data-testid="grownup-help" data-grownup-only="true">
          <UsersRound size={24} /><span><strong>Grown-up help, please.</strong> Stay together for this part.</span>
          <button type="button" onClick={() => setAdultHelpRequested(false)} aria-label="Dismiss grown-up help"><X size={18} /></button>
        </div>
      )}

      {stage === "hook" && (
        <section className={`${styles.childStage} ${styles.pictureHookStage}`} data-testid="hook-stage" data-prereader="true">
          <h1 className={styles.srOnly}>{artifact.title}</h1>
          <div className={styles.pictureGalaxy} aria-label="Tap a picture to hear its name">
            {artifact.explore.items.slice(0, 4).map((item, index) => (
              <button
                type="button"
                key={item.id}
                className={index === 0 ? styles.gentleWiggle : ""}
                onClick={() => hearHookPicture(item.id)}
                aria-label={`Hear ${item.label}`}
              >
                <span aria-hidden="true">{item.emoji}</span>
                <span className={styles.srOnly}>{item.label}</span>
              </button>
            ))}
            <div className={styles.topicSpark} aria-hidden="true">
              {learningFocus ? <strong className={styles.focusGlyph}>{learningFocus}</strong> : <Sparkles size={48} />}
            </div>
          </div>
          <PicturePath label="Look at the pictures, listen, then continue">
            <Eye size={34} /><span className={styles.pathWave}><i /><i /><i /></span><ArrowRight size={36} />
          </PicturePath>
          {!voiceEnabled && narrator.supported && (
            <button className={styles.soundStart} type="button" onClick={() => void enableVoice()} disabled={narrator.status === "connecting"} data-testid="start-sound-button" aria-label="Start sound">
              {narrator.status === "connecting" ? <LoaderCircle className={styles.spin} size={46} /> : <Volume2 size={50} />}
              <span className={styles.srOnly}>Start sound</span>
            </button>
          )}
          <NextPictureButton testId="begin-explore-button" label="Show me the example" onClick={() => moveToStage("model")}>
            <Eye size={38} /><ArrowRight size={31} />
          </NextPictureButton>
        </section>
      )}

      {stage === "model" && (
        <section className={`${styles.childStage} ${styles.pictureModelStage}`} data-testid="model-stage" data-prereader="true">
          <h1 className={styles.srOnly}>{artifact.model.headline}</h1>
          <button className={styles.replayStageButton} type="button" onClick={() => readAloud(stageNarration.model)} aria-label="Hear and watch the example again" data-testid="model-read-aloud">
            <Volume2 size={30} /><RotateCcw size={17} />
          </button>
          <button className={styles.modelVisual} type="button" onClick={() => readAloud(`${artifact.model.exampleLabel}. ${artifact.model.explanation}`)} aria-label={`Hear the ${artifact.model.exampleLabel} example`}>
            <span className={styles.modelHeroEmoji} aria-hidden="true">
              <i>{artifact.model.exampleEmoji}</i>
            </span>
            <span className={styles.modelSoundBridge} aria-hidden="true"><Ear size={42} /><i /><i /><i /></span>
            <span
              className={styles.modelHomeEmoji}
              aria-hidden="true"
              data-testid="model-destination-home"
              data-category-id={exampleHome?.id ?? "unresolved"}
            >
              <i>{exampleHome?.emoji ?? <Sparkles size={76} />}</i>
              {learningFocus && exampleHome?.id === focusHome?.id && <strong className={styles.homeFocusGlyph}>{learningFocus}</strong>}
            </span>
            <span className={styles.srOnly}>{artifact.model.exampleLabel}. {artifact.model.explanation}</span>
          </button>
          <div className={styles.gestureBubble} aria-hidden="true"><Hand size={39} /><span>↔</span></div>
          <NextPictureButton testId="start-guided-play" label="My turn" onClick={() => moveToStage("explore")}>
            <Hand size={39} /><ArrowRight size={31} />
          </NextPictureButton>
        </section>
      )}

      {stage === "explore" && (
        <section className={`${styles.childStage} ${styles.pictureExploreStage}`} data-testid="explore-stage" data-prereader="true">
          <h1 className={styles.srOnly}>Find each picture&apos;s home</h1>
          <div className={styles.exploreTopline}>
            <PicturePath label="Tap a picture, listen, then tap a picture home">
              <Hand size={31} /><ArrowRight size={25} /><Ear size={31} /><ArrowRight size={25} />
              <span className={styles.twoHomes} aria-hidden="true"><i>●</i><i>●</i></span>
            </PicturePath>
            <button className={styles.replayStageButton} type="button" onClick={() => readAloud(stageNarration.explore)} aria-label="Hear the game and both homes again" data-testid="explore-read-aloud">
              <Volume2 size={30} /><RotateCcw size={17} />
            </button>
            <span className={styles.pictureProgressDots} aria-label={`${placedCount} of ${artifact.explore.items.length} pictures home`}>
              {artifact.explore.items.map((item) => <i key={item.id} className={placed[item.id] ? styles.progressDone : ""}>{placed[item.id] ? <Check size={13} /> : null}</i>)}
            </span>
          </div>

          <div className={styles.pictureTray} aria-label="Pictures to sort">
            {unplaced.map((item, index) => (
              <button
                type="button"
                key={item.id}
                onClick={() => selectItem(item.id)}
                className={`${selectedItem === item.id ? styles.itemSelected : ""} ${!selectedItem && index === 0 ? styles.gentleWiggle : ""}`}
                aria-pressed={selectedItem === item.id}
                aria-label={`${item.label}. Hear this picture, then choose its home.`}
                data-testid={`explore-item-${item.id}`}
              >
                <span aria-hidden="true">{item.emoji}</span>
                {selectedItem === item.id && <i className={styles.selectedSound} aria-hidden="true"><Ear size={25} /></i>}
                <span className={styles.srOnly}>{item.label}</span>
              </button>
            ))}
            {unplaced.length === 0 && <div className={styles.pictureTrayComplete} aria-hidden="true"><Check size={54} /><Sparkles size={35} /></div>}
          </div>

          <div className={styles.pictureHomeGrid} aria-label="Picture homes">
            {artifact.explore.categories.map((category, index) => {
              const isWrongHome = exploreReaction === "try-again" && selectedItem
                && artifact.explore.items.find((item) => item.id === selectedItem)?.category !== category.id;
              return (
                <article className={`${styles.pictureHomeCard} ${selectedItem ? styles.homeReady : ""} ${isWrongHome ? styles.homeTryOther : ""}`} key={category.id} data-home-number={index + 1}>
                  <button
                    type="button"
                    className={styles.homeSpeaker}
                    onClick={() => readAloud(`${category.visualCue}. ${spokenHomeLabel(category.label)}. ${category.description}`)}
                    aria-label={`Hear the ${category.visualCue} home clue`}
                    data-testid={`category-audio-${category.id}`}
                  >
                    <Volume2 size={26} />
                  </button>
                  <button
                    type="button"
                    className={styles.pictureHomeTarget}
                    onClick={() => putInCategory(category.id)}
                    aria-label={`${category.visualCue}. ${category.label}. ${category.description}`}
                    data-testid={`category-${category.id}`}
                  >
                    <span className={styles.homeHeroEmoji} aria-hidden="true">{category.emoji}</span>
                    {learningFocus && category.id === focusHome?.id && (
                      <strong className={styles.homeFocusGlyph} data-testid="learning-focus-symbol" aria-hidden="true">{learningFocus}</strong>
                    )}
                    <span className={styles.srOnly}>{category.label}. {category.description}</span>
                    <div className={styles.homeContents} aria-hidden="true">
                      {artifact.explore.items.filter((item) => placed[item.id] === category.id).map((item) => <span key={item.id}>{item.emoji}</span>)}
                    </div>
                  </button>
                </article>
              );
            })}
          </div>

          <div className={`${styles.pictureReaction} ${styles[`reaction_${exploreReaction.replace("-", "_")}`]}`} role="status" aria-live="polite" data-testid="explore-feedback">
            <button type="button" onClick={() => say(feedback)} aria-label="Hear the last clue again"><Volume2 size={28} /></button>
            <ReactionPicture reaction={exploreReaction} />
            <span className={styles.srOnly}>{feedback}</span>
            {allPlaced && (
              <button type="button" className={styles.miniNextButton} onClick={() => moveToStage("check")} aria-label="Go to the next activity" data-testid="continue-to-check">
                <ArrowRight size={39} />
              </button>
            )}
          </div>
        </section>
      )}

      {stage === "check" && (
        <section className={`${styles.childStage} ${styles.pictureCheckStage}`} data-testid="check-stage" data-prereader="true">
          {confetti && <div className={styles.confetti} aria-hidden="true"><i>●</i><i>★</i><i>◆</i><i>●</i><i>✦</i><i>◆</i></div>}
          <h1 className={styles.srOnly}>{artifact.check.prompt}</h1>
          <PicturePath label="Listen to the question, then tap a picture">
            <Ear size={35} /><span className={styles.pathWave}><i /><i /><i /></span><Hand size={35} />
          </PicturePath>
          <button className={styles.questionSpeaker} type="button" onClick={() => readAloud(stageNarration.check)} aria-label="Hear the question and every picture again">
            <Volume2 size={39} /><RotateCcw size={18} />
          </button>
          <div className={styles.pictureChoiceGrid}>
            {artifact.check.choices.map((choice, index) => (
              <button
                type="button"
                key={choice.id}
                onClick={() => answer(choice.id)}
                className={`${solved && choice.correct ? styles.choiceCorrect : ""} ${wrongChoice === choice.id ? styles.choiceWrong : ""} ${wrongChoice && !choice.correct && index === 0 ? "" : wrongChoice && choice.id !== wrongChoice ? styles.gentleWiggle : ""}`}
                disabled={solved}
                aria-label={choice.label}
                data-testid={`check-choice-${choice.id}`}
              >
                <span aria-hidden="true">{choice.emoji}</span>
                <span className={styles.srOnly}>{choice.label}</span>
                {solved && choice.correct ? <i aria-hidden="true"><Check size={31} /></i> : wrongChoice === choice.id ? <i aria-hidden="true"><RotateCcw size={29} /></i> : null}
              </button>
            ))}
          </div>
          {wrongChoice && !solved && (
            <div className={styles.pictureHint} role="status" data-testid="supportive-hint">
              <button type="button" onClick={() => say(`${artifact.check.choices.find((choice) => choice.id === wrongChoice)?.explanation} ${artifact.check.hint}`)} aria-label="Hear the hint again"><Volume2 size={30} /></button>
              <Ear size={35} /><RotateCcw size={35} />
              <span className={styles.srOnly}>Good try. {artifact.check.choices.find((choice) => choice.id === wrongChoice)?.explanation} {artifact.check.hint}</span>
            </div>
          )}
          {solved && (
            <div className={styles.pictureSolved} role="status" data-testid="correct-feedback">
              <Heart size={42} fill="currentColor" /><Check size={45} />
              <span className={styles.srOnly}>{artifact.celebration.headline}. {artifact.check.choices.find((choice) => choice.correct)?.explanation}</span>
              <button type="button" className={styles.miniNextButton} onClick={() => moveToStage("transfer")} aria-label="Go to the final activity" data-testid="continue-to-transfer">
                <ArrowRight size={40} />
              </button>
            </div>
          )}
        </section>
      )}

      {stage === "transfer" && (
        <section className={`${styles.childStage} ${styles.pictureTransferStage}`} data-testid="transfer-stage" data-prereader="true">
          <h1 className={styles.srOnly}>{artifact.celebration.headline}</h1>
          <div className={styles.celebrationOrb} aria-hidden="true"><Sparkles size={56} /><span>✦</span><span>●</span><span>◆</span></div>
          <div className={styles.togetherVisual} aria-hidden="true">
            <UsersRound size={64} />
            <span className={styles.togetherPictures}>{artifact.explore.items.slice(0, 3).map((item) => <i key={item.id}>{item.emoji}</i>)}</span>
            <Hand size={51} />
          </div>
          <button type="button" className={styles.finalListenButton} onClick={() => readAloud(stageNarration.transfer)} aria-label="Hear the together activity again">
            <Volume2 size={43} /><RotateCcw size={21} />
          </button>
          <p className={styles.srOnly}>{artifact.celebration.message} {artifact.transfer.prompt} {artifact.transfer.adultCue}</p>
          <button type="button" className={styles.playAgainPicture} onClick={restart} aria-label="Play the whole lesson again" data-testid="play-again-button">
            <RotateCcw size={39} /><Sparkles size={30} />
          </button>
        </section>
      )}
    </main>
  );
}

function StageDot({ active, complete, children }: { active: boolean; complete: boolean; children: ReactNode }) {
  return <span className={`${active ? styles.pictureStageActive : ""} ${complete ? styles.pictureStageComplete : ""}`} aria-hidden="true">{complete ? <Check size={16} /> : children}</span>;
}

function PicturePath({ label, children }: { label: string; children: ReactNode }) {
  return <div className={styles.picturePath} role="img" aria-label={label} data-testid="prereader-picture-path">{children}<span className={styles.srOnly}>{label}</span></div>;
}

function NextPictureButton({ testId, label, onClick, children }: { testId: string; label: string; onClick: () => void; children: ReactNode }) {
  return (
    <button className={styles.bigPictureNext} type="button" onClick={onClick} aria-label={label} data-testid={testId}>
      {children}<span className={styles.srOnly}>{label}</span>
    </button>
  );
}

function ReactionPicture({ reaction }: { reaction: ExploreReaction }) {
  switch (reaction) {
    case "listen": return <span aria-hidden="true"><Ear size={39} /><ArrowRight size={28} /></span>;
    case "correct": return <span aria-hidden="true"><Check size={43} /><Hand size={34} /></span>;
    case "try-again": return <span aria-hidden="true"><Heart size={36} /><RotateCcw size={38} /></span>;
    case "complete": return <span aria-hidden="true"><Sparkles size={43} /><Check size={42} /></span>;
    default: return <span aria-hidden="true"><Hand size={39} /><Ear size={34} /></span>;
  }
}

function buildCompleteStageNarration(artifact: LearningArtifact): Record<LearnStage, string> {
  const learningFocus = findLearningFocus(artifact);
  const modelHome = resolveModelHome(artifact, learningFocus);
  return {
    hook: joinForSpeech([
      "Hi! Let's look at these pictures together.",
      learningFocus ? `The large ${learningFocus} is today's learning letter. Listen for its sound.` : "",
      artifact.narration.hook,
      artifact.hook.prompt,
      artifact.hook.wonderQuestion,
      "You can tap any floating picture and I will name it. When you are ready, tap the large glowing eye and arrow button near the bottom.",
    ]),
    model: joinForSpeech([
      "Watch and listen. The big picture in the middle is our example.",
      artifact.narration.model,
      artifact.model.instruction,
      `${artifact.model.exampleLabel}. ${artifact.model.explanation}`,
      modelHome
        ? `The screen shows the ${artifact.model.exampleLabel} picture, then the listening ear, then ${modelHome.visualCue}. The spoken answer and the picture always match.`
        : "",
      artifact.model.gestureCue,
      "Tap the big picture if you want to hear the example again. Then tap the large glowing hand and arrow button near the bottom for your turn.",
    ]),
    explore: buildExploreGameNarration(artifact),
    check: joinForSpeech([
      "Now listen, then tap one big picture.",
      artifact.narration.check,
      artifact.check.prompt,
      `The picture choices are ${spokenList(artifact.check.choices.map((choice) => choice.label))}.`,
      "Tap the picture that answers the question. Tap the large round speaker if you want to hear everything again.",
    ]),
    transfer: joinForSpeech([
      "You did it! Find your grown-up for this last together activity.",
      artifact.narration.transfer,
      artifact.celebration.message,
      artifact.transfer.prompt,
      artifact.transfer.adultCue,
      "Tap the large speaker to hear the activity again. Tap the round replay arrow when you want to play the whole lesson again.",
    ]),
  };
}

function buildHomeMap(artifact: LearningArtifact) {
  const homes = artifact.explore.categories.map((category) =>
    `${category.visualCue} means ${spokenHomeLabel(category.label)}. ${category.description}`,
  );
  return `Look below. There are two large picture homes. ${homes.join(" ")}`;
}

function buildExploreGameNarration(artifact: LearningArtifact) {
  const example = artifact.explore.items[0];
  const exampleHome = artifact.explore.categories.find((category) => category.id === example?.category);
  const learningFocus = findLearningFocus(artifact);
  const focusHome = findFocusHome(artifact, learningFocus);
  return joinForSpeech([
    "Here is your picture game.",
    learningFocus && focusHome
      ? `The large letter ${learningFocus} stays on ${focusHome.visualCue}. That picture is the ${learningFocus} sound home.`
      : "",
    "First, one picture at the top wiggles. Tap that picture. I will say its name.",
    "Next, the two large picture homes below glow. Tap the matching home picture.",
    buildHomeMap(artifact),
    example && exampleHome
      ? `Let's do the first one together. Find the wiggling ${example.label} picture at the top and tap it. Listen: ${example.label}. ${exampleHome.description} Now look below and tap the large ${exampleHome.visualCue} picture home.`
      : "Find the wiggling picture at the top. Tap it, listen, then tap its glowing picture home below.",
    "A round speaker on each home repeats that home's clue. The speaker at the bottom repeats my last clue.",
  ]);
}

function findLearningFocus(artifact: LearningArtifact) {
  if (artifact.domain !== "early-literacy") return null;
  const evidence = [artifact.topic, artifact.objective, artifact.title, artifact.model.explanation]
    .join(" ");
  const phoneme = evidence.match(/\/([a-z]{1,3})\//i)?.[1];
  if (phoneme) return phoneme.toLocaleUpperCase();
  const letter = evidence.match(/\bletter\s+([a-z])\b/i)?.[1];
  return letter?.toLocaleUpperCase() ?? null;
}

function findFocusHome(artifact: LearningArtifact, learningFocus: string | null) {
  if (!learningFocus) return undefined;
  const focus = learningFocus.toLocaleLowerCase();
  const scored = artifact.explore.categories.map((category) => ({
    category,
    score: artifact.explore.items.filter((item) =>
      item.category === category.id && item.label.trim().toLocaleLowerCase().startsWith(focus),
    ).length,
  })).sort((left, right) => right.score - left.score);
  if (scored[0]?.score) return scored[0].category;

  return artifact.explore.categories.find((category) => {
    const evidence = `${category.label} ${category.description}`.toLocaleLowerCase();
    return evidence.includes(`/${focus}/`)
      && /(start|begin|same)/.test(evidence)
      && !/(different|other|not\s)/.test(evidence);
  });
}

function resolveModelHome(artifact: LearningArtifact, learningFocus: string | null) {
  const modelItem = artifact.explore.items.find((item) =>
    item.emoji === artifact.model.exampleEmoji
      || item.label.trim().toLocaleLowerCase() === artifact.model.exampleLabel.trim().toLocaleLowerCase(),
  );
  if (modelItem) return artifact.explore.categories.find((category) => category.id === modelItem.category);

  const modelEvidence = `${artifact.model.exampleLabel} ${artifact.model.instruction} ${artifact.model.explanation}`.toLocaleLowerCase();
  const directlyNamed = artifact.explore.categories.find((category) => {
    const label = category.label.replace(/\bhome\b/gi, "").trim().toLocaleLowerCase();
    const visualCue = category.visualCue.trim().toLocaleLowerCase();
    return (label.length > 2 && modelEvidence.includes(label))
      || (visualCue.length > 2 && modelEvidence.includes(visualCue));
  });
  if (directlyNamed) return directlyNamed;

  const focusHome = findFocusHome(artifact, learningFocus);
  if (!learningFocus || !focusHome) return undefined;
  const exampleStartsWithFocus = artifact.model.exampleLabel.trim().toLocaleLowerCase()
    .startsWith(learningFocus.toLocaleLowerCase());
  if (exampleStartsWithFocus) return focusHome;
  return artifact.explore.categories.find((category) => category.id !== focusHome.id);
}

function spokenHomeLabel(label: string) {
  return label.trim().toLocaleLowerCase().endsWith("home") ? label : `${label} home`;
}

function joinForSpeech(parts: string[]) {
  const seen = new Set<string>();
  return parts
    .map((part) => part.replace(/\s+/g, " ").trim())
    .filter((part) => {
      const key = part.toLocaleLowerCase();
      if (!part || seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .join(" ");
}

function spokenList(items: string[]) {
  if (items.length < 2) return items[0] ?? "";
  return `${items.slice(0, -1).join(", ")}, and ${items.at(-1)}`;
}

function voiceStatusLabel(status: TutorVoiceStatus, connected: boolean, narrationProtected: boolean) {
  switch (status) {
    case "connecting": return "The voice guide is waking up.";
    case "listening": return "The voice guide is listening.";
    case "thinking": return narrationProtected ? "The next direction is getting ready." : "The voice guide is thinking.";
    case "speaking": return narrationProtected ? "Listen until this direction finishes." : "The voice guide is talking and can be interrupted.";
    case "muted": return "The microphone is resting.";
    case "error": return "The voice guide needs grown-up help.";
    default: return connected ? "The voice guide is ready." : "Sound starts with the lesson.";
  }
}
