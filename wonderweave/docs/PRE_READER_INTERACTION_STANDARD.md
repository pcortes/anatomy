# Wonderweave Pre-Reader Interaction Standard

Status: product and engineering quality gate  
Audience: product, curriculum, design, engineering, QA  
Learners: ages 3–6, including children who cannot yet decode interface text

## Product promise

Wonderweave may show words, but it must never make decoding those words a prerequisite for participating. A child who cannot read must be able to discover the next action, complete the learning task, ask for help, understand feedback, and recover from an error through pictures, demonstration, motion, spatial consistency, and speech.

Visible print is valuable when it is paired with a concrete picture and spoken immediately. It supports print awareness and vocabulary. Visible print is harmful when it is the only signal that distinguishes actions or explains what happened.

## Benchmark synthesis

The standard combines the strongest recurring patterns in leading early-learning products and learning research:

- Khan Academy Kids: a persistent character guide, joyful varied activity types, a personalized path, and read-aloud support.
- Google Read Along: a child can tap the reading buddy for help; speech is observed continuously; feedback is both verbal and visual; difficulty adapts.
- Duolingo ABC: bite-sized phonics practice, character-led stories, focused turns, and systematic curriculum hidden inside play.
- ABCmouse: a visible step-by-step learning path, varied media and activity formats, and frequent real-world connections.
- Ello and Amira: child-specific speech understanding, low-latency contingent responses, in-the-moment teaching decisions, and a coherent assessment-instruction-practice loop.
- Guided-play research: the adult or system holds a clear learning goal while the child retains meaningful choice; guidance flexes through modeling, hints, questions, and scaffolds.
- Serve-and-return research: the system notices the child's attempt, responds contingently, names what the child is attending to, and creates a genuine back-and-forth exchange.

These systems are benchmarks, not templates. Wonderweave should preserve its own visual identity and teacher-authored learning goal.

## Non-negotiable interaction contract

Every learner stage must pass all of these requirements:

1. Operable without print
   - Every actionable control has a semantic picture, stable position, meaningful motion, or demonstrated use.
   - No two choices are distinguishable only by written labels.
   - Touch targets are at least 44 by 44 CSS pixels; primary targets should be materially larger.

2. Sound attached to meaning
   - Entering a stage speaks the whole immediate task automatically.
   - Tapping any picture speaks its name and the consequence of the tap.
   - A persistent character can be tapped to repeat or clarify.
   - Trusted directions finish before the microphone reopens; conversational turns remain interruptible.

3. Demonstration before demand
   - Show and narrate one complete worked example.
   - Demonstrate the actual gesture and actual screen targets, not an abstract explanation.
   - The child is not tested on an interaction pattern they have not seen.

4. One cognitive move per turn
   - Each spoken turn asks for one action.
   - A child never has to remember a multi-step paragraph while acting.
   - Choice sets are visually small and semantically distinct.

5. Contingent serve and return
   - Acknowledge the child's actual tap or utterance.
   - Add one useful idea or clue.
   - Ask at most one tiny question, then wait.
   - Treat fragments, pauses, gestures, and approximate child pronunciation as meaningful attempts.

6. Child agency inside a learning goal
   - Let the child choose picture order, replay, explore, or answer where the learning goal permits it.
   - Motion suggests a starting point but does not disable other valid exploration.
   - Follow an on-topic curiosity for one turn, then bridge it back to the objective.

7. Adaptive help ladder
   - First need: repeat more slowly.
   - Second need: point with motion, contrast, position, or a sound cue.
   - Third need: model one worked clue and invite the child to finish the final tap.
   - Persistent confusion: invite the grown-up without shame.
   - Never respond to an error with a dead end or a generic “wrong.”

8. Immediate multimodal feedback
   - Correct attempts change the object, play warm speech, and advance visible progress.
   - Incorrect attempts preserve the child's work, explain one contrast, and visually emphasize the next useful option.
   - Praise names the strategy, effort, or noticing—not intelligence.

9. Print exposure without print dependence
   - Pair a short visible label with its picture.
   - Speak the label when the picture is tapped.
   - Avoid instructional paragraphs in child mode.
   - Do not direct a pre-reader to “tap the word” unless decoding that specific word is the learning objective.

10. Transfer beyond the screen
    - End with a spoken adult-child action involving talk, pointing, movement, objects, or the surrounding world.
    - The final activity must be replayable from one picture control.

## Canonical Wonderweave turn loop

1. Orient: the Wonder Buddy names the scene and the single immediate goal.
2. Model: the interface performs or narrates one worked example.
3. Invite: one object wiggles; all valid child choices remain available.
4. Observe: the interface and voice system capture the tap, speech, latency, and help request.
5. Decide: the deterministic interface owns correctness; the tutor selects the least necessary approved support.
6. Respond: visual state and speech change together.
7. Wait: the microphone reopens and the child gets an unhurried turn.
8. Retrieve: the child tries a changed example with less support.
9. Transfer: the experience moves into an adult-child real-world exchange.

## Generation requirements

Generated artifacts must provide:

- concrete picture cues that are unambiguous without their labels;
- labels that correctly name the picture and are safe to speak aloud;
- a worked example consistent with the actual interactive items;
- two visually and conceptually distinct choices when classification is used;
- feedback that explains the learning distinction, not just correctness;
- an approved least-help-first hint sequence;
- a short off-screen adult-child transfer;
- no invented visual detail that contradicts the supplied picture.

The activity renderer must not assume every objective should become a sorting game. The compiler should eventually select among mechanics such as listen-and-point, count-and-build, sequence-and-grow, match, compare, trace, manipulate, predict-and-reveal, and tell-back. Mechanic selection is part of pedagogy, not decoration.

## Automated release gates

A production learner flow fails release if:

- a visible child control lacks a picture/icon/motion cue;
- a visible child control is smaller than 44 by 44 CSS pixels;
- an instructional stage does not auto-narrate;
- repeat cannot be invoked from the persistent buddy;
- a trusted instruction can be cut off by room noise or the tutor's own audio;
- a picture tap does not produce spoken identification or feedback;
- the model example contradicts the interactive item set;
- a wrong answer yields only rejection;
- any stage requires reading to locate the next action;
- the final activity remains screen-only.

Run the production test with real generation and Realtime APIs. Mocks may support development but are not release evidence.

## Product measures

Track outcomes that reveal learning and usability rather than raw engagement:

- time to first meaningful child action after narration;
- independent completion rate by stage and age;
- repeat/help requests before and after a worked example;
- attempts and scaffold level per item;
- oral participation rate and tutor response latency;
- retrieval accuracy on a changed example;
- transfer activity replay rate;
- grown-up intervention rate;
- session duration without maximizing it as an end in itself.

Do not use addictive streak pressure, variable-ratio rewards, ads, or penalties for leaving.

## Primary references

- Khan Academy Kids: https://www.khanacademy.org/kids
- Duolingo ABC: https://abc.duolingo.com/static/
- Google Read Along: https://blog.google/products-and-platforms/products/education/early-access-read-along/
- ABCmouse research: https://www.ageoflearning.com/research/abcmouse-2023-rct-research-brief_rgb_03/
- Ello teaching approach: https://www.ello.com/about
- Amira learning loop: https://amiralearning.com/
- Harvard Center on the Developing Child, serve and return: https://developingchild.harvard.edu/key-concept/serve-and-return/
- Guided-play systematic review and meta-analysis: https://pmc.ncbi.nlm.nih.gov/articles/PMC9545698/
- American Academy of Pediatrics, The Power of Play: https://publications.aap.org/pediatrics/article/142/3/e20182058/38649/The-Power-of-Play-A-Pediatric-Role-in-Enhancing
