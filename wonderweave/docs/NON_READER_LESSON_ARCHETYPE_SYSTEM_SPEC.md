# Wonderweave Non-Reader Lesson Archetype System

Status: implementation specification; educator review required before general release  
Version: 1.0  
Learners: ages 3–6, especially children who do not yet decode interface text  
Audience: product, curriculum, design, engineering, QA, research, accessibility, child safety  
Depends on: `LEARNING_ARTIFACT_COMPILER_ENGINEERING_SPEC.md` and `PRE_READER_INTERACTION_STANDARD.md`

## 1. Executive decision

Wonderweave should expand from one generated sorting experience into a typed library of research-aligned lesson archetypes. The system must not ask a model to invent arbitrary child-facing code. It must ask a model to fill a validated learning artifact, select a suitable archetype from a finite registry, and render that artifact through a trusted, tested component.

The compiler must choose the lesson form in this order:

```text
observable objective
  → domain-specific learning progression
  → developmental entry point
  → cognitive action the child must perform
  → lesson archetype
  → topic/theme and visual world
```

The topic is not the pedagogy. “Seeds” can support listening for `/s/`, counting with one-to-one correspondence, comparing quantities, sequencing plant growth, predicting what a plant needs, or telling back an observation. The learning objective determines the archetype; the seed theme makes the objective concrete and meaningful.

The product promise is stronger than “audio is available.” A child who cannot read must be able to infer what can be touched, understand what each picture means, perform the learning action, interpret feedback, request help, and move to the next step without decoding a label. Words may remain visible as adult support and print exposure.

### 1.1 What ships first

Build the shared runtime, then release archetypes in three evidence-gated waves:

1. Foundation wave: Listen & Point, Match Pairs, Count & Build, Compare & Choose, Sequence & Grow.
2. Reasoning wave: Flash & See, Pattern & Continue, Predict–Test–Reveal, Cause & Effect Lab, Spatial Build.
3. Language and transfer wave: Sound Hunt, Story Talk & Tell-Back, Move & Imitate, Real-World Hunt.

The current classification prototype remains available as `picture_sort`, but it becomes one archetype rather than the default shape for every objective.

### 1.2 Claims discipline

This design is informed by strong early-learning practice guidance and some outcome research. That does not prove Wonderweave accelerates learning. Product copy must not claim “accelerated,” “personalized mastery,” “evidence-proven,” or “educator-approved” until the relevant artifact has passed the review and study gates in sections 16 and 17.

## 2. How this extends the original plan

The original compiler specification already calls for adding one primitive at a time: sequence, compare, number line, part–whole, cause/effect, story choice, sound/phoneme match, and spatial exploration. The pre-reader standard adds listen-and-point, count-and-build, sequence-and-grow, match, compare, trace, manipulate, predict-and-reveal, and tell-back.

This document is the normative expansion of that plan. It adds:

- a selection method so mechanics are chosen for learning reasons;
- a shared non-reader interaction grammar;
- granular contracts for ages 3–4, 4–5, and 5–6;
- fourteen new archetype definitions plus the current `picture_sort`, for fifteen trusted renderers total;
- a discriminated artifact schema and renderer registry;
- voice, adaptation, validation, analytics, and E2E contracts;
- a qualified educator and family sign-off process;
- an implementation sequence that a junior engineer can execute without inventing pedagogy.

Where this document conflicts with a generic UI behavior in the earlier prototype, this document governs new archetypes. The child-safety, privacy, teacher-review, no-arbitrary-code, and real-E2E rules in the original specification remain binding.

## 3. Research synthesis and product implications

### 3.1 Evidence hierarchy

Use evidence in this order:

1. systematic reviews and high-quality practice guides;
2. professional position statements based on broad evidence review;
3. individual controlled studies;
4. documented practices from respected learning products;
5. expert judgment and product benchmarks;

Competitor behavior is inspiration, not evidence of efficacy. Engagement is not a proxy for learning.

### 3.2 Findings that constrain the product

| Finding | Evidence posture | Product implication |
|---|---|---|
| Young children learn through joyful, active, play-based experiences with meaningful choice and adult guidance. | NAEYC developmentally appropriate practice; strong professional consensus | Preserve a clear learning goal while offering bounded child choice, exploration, wonder, and delight. Do not use either unstructured free play or long direct-instruction monologues as the whole lesson. |
| Guided play can outperform direct instruction for some early mathematics, shape, spatial-language, and task-switching outcomes, but results vary by outcome and study. | 2022 systematic review: 39 studies; 17 in meta-analysis | Use guided play where the target benefits from manipulation, comparison, spatial exploration, or hypothesis testing. Do not claim it universally beats explicit teaching. |
| Early mathematics should follow developmental progressions and include subitizing, meaningful counting, magnitude comparison, and basic problems. | IES/WWC practice guide and REL toolkit | Implement distinct math actions. Do not collapse number learning into tapping a numeral or reciting a count sequence. |
| Foundational reading instruction develops oral/academic language, awareness of speech sounds, sound–letter links, decoding, and connected reading in a deliberate progression. | IES/WWC practice guide; strongest evidence in the guide for sound segments/letter links and decoding | Pre-readers first work with heard words and sounds. Letters appear only when the objective is a sound–symbol link. Pictures must not train children to guess printed words. |
| Responsive back-and-forth interaction supports early language and social foundations; naming what the child attends to is useful. | Harvard Center on the Developing Child synthesis | The tutor acknowledges the actual tap or utterance, adds one useful idea, then waits. It does not fill silence with chatter. |
| Early science is strongest when children investigate accessible questions through direct action and observation with adult guidance. | NSTA early-childhood inquiry guidance; National Academies early STEM synthesis | Science archetypes ask children to observe, predict, test, compare, and explain. They end with a safe off-screen observation whenever possible. |
| High-quality educational content can support learning, and caregiver joint engagement can strengthen effects; heavy solo, low-quality use carries risks. | 2026 AAP policy and technical report | Design for a child and grown-up to talk together. Use short, bounded sessions, a clear stopping point, and an off-screen transfer. Exclude autoplay loops, streak pressure, ads, loot, and engagement-maximizing rewards. |
| Screen-to-world transfer is not automatic for young children. | Developmental media literature summarized by AAP and reviews | Pair the screen action with concrete objects, gestures, movement, or a caregiver conversation. Measure transfer, not only in-app success. |

### 3.3 Primary sources

- NAEYC, Developmentally Appropriate Practice definition: https://www.naeyc.org/node/3807
- NAEYC, Principles of Child Development and Learning: https://www.naeyc.org/node/3796
- IES/WWC, Teaching Math to Young Children: https://ies.ed.gov/ncee/WWC/PracticeGuide/18/Published
- IES/REL, Teaching Math to Young Children Toolkit: https://ies.ed.gov/ncee/rel/math-young-children
- IES/WWC, Foundational Skills to Support Reading for Understanding: https://ies.ed.gov/ncee/wwc/PracticeGuide/21/Published
- IES/WWC, Phonological Awareness Training evidence summary: https://ies.ed.gov/ncee/wwc/Intervention/274
- Skene et al., guided-play systematic review and meta-analysis: https://pmc.ncbi.nlm.nih.gov/articles/PMC9545698/
- Harvard Center on the Developing Child, Serve and Return: https://developingchild.harvard.edu/key-concept/serve-and-return/
- NSTA, Ongoing Inquiry in the Early Years: https://www.nsta.org/science-and-children/science-and-children-february-2011/early-years-ongoing-inquiry
- AAP, Digital Ecosystems policy statement: https://publications.aap.org/pediatrics/article/157/2/e2025075320/206129/Digital-Ecosystems-Children-and-Adolescents-Policy
- AAP, Digital Ecosystems technical report: https://publications.aap.org/pediatrics/article/157/2/e2025075321/206128/Digital-Ecosystems-Children-and-Adolescents

## 4. Instructional architecture

Every lesson uses a common teaching loop. Screens may combine adjacent functions, but no function may disappear accidentally.

```text
Orient → Model → Invite → Act → Contingent feedback
       → Faded-support try → Changed retrieval → Off-screen transfer
```

### 4.1 Orient

- Establish one perceptible goal in a short spoken cue.
- Bind the goal to a visible semantic anchor: a real object, character action, quantity, sound icon, or transformation.
- Avoid meta-language such as “you do not need to read this screen.”
- Do not explain the entire lesson before the child can act.

### 4.2 Model

- Show one complete worked example using the actual gesture and actual targets.
- Synchronize speech, highlighting, and motion.
- Explain the relevant feature: “I hear `/s/` first, so sun goes by the snake.”
- Never use an example that is absent from or visually inconsistent with the playable world.

### 4.3 Invite and act

- Ask for one cognitive action and one physical action.
- Make the intended object gently move or glow; retain other valid exploration where appropriate.
- The child may tap, drag, point, say, count, move, imitate, arrange, or reveal.
- The system waits without filler after the invitation.

### 4.4 Contingent feedback

- Visual state and speech change together within 300 ms for local interactions.
- Correct feedback names the feature or strategy, not just success.
- The first error preserves the attempt and gives one discriminating cue.
- The second error models one smaller step, then gives a simpler retry.
- After repeated confusion, invite a grown-up without shame.

### 4.5 Fading, retrieval, and transfer

- Guided practice may highlight the relevant target.
- The next example removes one support.
- Retrieval changes the example or representation; it must not be a visual copy.
- Transfer uses nearby objects, the child’s body, nature, drawing, or adult conversation.
- End deliberately. Do not auto-start another lesson.

## 5. Developmental profiles

Age is a default, not a diagnosis. Teacher judgment and observed task behavior may choose an easier or harder support profile without labeling the child.

| Contract | Ages 3–4 | Ages 4–5 | Ages 5–6 |
|---|---|---|---|
| Default active lesson time | 4–6 minutes | 5–8 minutes | 6–10 minutes |
| Simultaneous actionable choices | 2–3 | 2–4 | 3–4 |
| Primary touch target | 64 px preferred; 56 px minimum | 60 px preferred; 52 px minimum | 56 px preferred; 52 px minimum |
| Spoken invitation | Usually 3–8 words | Usually 4–10 words | Usually 5–12 words |
| Page-entry audio | One goal and first action; target ≤20 seconds | Goal, cue, first action; target ≤30 seconds | Goal, one reason, first action; target ≤40 seconds |
| Representation | Concrete pictures, sound, movement, real objects | Concrete pictures plus simple spatial/quantity structure | Pictures plus emerging letters, numerals, frames, arrows, diagrams |
| Memory load | One step visible at a time | One step; occasional two-part rhythm with demonstration | One sentence; second step appears after first completes |
| Feedback | Immediate contrast and reenactment | Feature cue, retry | Feature cue, strategy prompt, retry |
| Retrieval | Recognition or imitation | Changed picture/quantity/action | Changed representation or simple explanation |
| Adult role | Co-play cue required | Co-play cue default | Transfer cue required; in-app support can be lighter |

### 5.1 Inclusive defaults

- Do not infer ability, disability, home language, or reading level from age.
- Permit replay without penalty and without increasing task difficulty.
- Support reduced motion, captions/transcripts for adults, keyboard/switch navigation, screen-reader names, and non-color cues.
- Allow a teacher to replace culturally unfamiliar examples.
- A child may respond through touch, gesture, object movement, or speech; speech recognition cannot be the sole path to completion.
- Never show a timer to the child. Never rank speed.

## 6. Non-reader interaction grammar

Every archetype is built from the following primitives. A new primitive requires design-system review and real child usability evidence.

### 6.1 Semantic anchors

An anchor is a picture or animated object that directly represents meaning. A colored empty box is not a semantic anchor. “Snake” for `/s/`, a hand placing one seed in each hole, a balance for comparison, and a sprout changing over time are anchors.

Each actionable concept must have:

- a stable `cueId`;
- a semantic picture or transformation;
- a spoken name;
- a non-text state change;
- concise visible print for adults and exposure;
- an accessible name that includes action and meaning.

### 6.2 Action signaling

- Wiggle means “try me,” never correctness.
- Glow means “available now,” never correctness.
- A warm transformation plus speech means “that worked.”
- A gentle pause plus contrast cue means “look/listen again.”
- Arrows are used only when motion or sequence is also demonstrated.
- Color may reinforce a distinction but never carries it alone.

### 6.3 Audio behavior

- Stage entry reads the immediate goal and first action automatically once sound has been enabled.
- Tapping the persistent buddy repeats the current immediate instruction.
- Tapping an object says its name and its task-relevant feature.
- Tapping Next cancels the previous page’s audio immediately and begins the new page cue. Old narration must not queue behind the new page.
- Protected app-authored narration cannot interrupt itself because of echo or room noise.
- After the immediate cue completes, the microphone reopens for a short, interruptible conversation.
- A visible mute control may silence sound, but sound starts enabled after the grown-up’s initial permission tap.
- The UI remains usable if the live voice connection fails; deterministic prerecorded or generated clips are a future fallback.

Performance targets:

| Measure | Target |
|---|---|
| Local visual response after tap | p95 ≤300 ms |
| Old audio silence after Next | p95 ≤500 ms |
| Object-name audio starts after tap | p95 ≤1.2 s on supported connection |
| Microphone remains closed through protected narration | 100% of release E2E runs |
| Previous-stage words heard after new-stage cue starts | 0 |

### 6.4 Copy rules

Say:

- “Tap the wiggling seed.”
- “Listen: sun. I hear `/s/` first.”
- “Put one seed in each hole.”
- “Which tray has more? Tap a tray.”

Do not say:

- “You never need to read this screen.”
- “Click submit.”
- “Choose the correct category below.”
- “Great job!” without naming what the child did.
- “Wrong.”
- “Tap the green button” when color is the only cue.

## 7. Domain learning maps

### 7.1 Early literacy

```text
oral language and vocabulary
  → rhyme and word awareness
  → syllables
  → onset–rime
  → phoneme isolation, blending, segmentation
  → sound–letter mapping
  → simple decoding and connected oral/print meaning
```

Rules:

- A phonological-awareness task can use only speech and pictures; letters are not required.
- A phonics task explicitly links the heard sound to a visible letter.
- Never ask the child to infer a written word from its picture or first letter.
- Use continuous consonant sounds when practical for stretching/blending; avoid adding a schwa.
- Teach vocabulary through child-friendly meaning, example, gesture/picture, and retrieval in a new context.
- Story experiences elicit prediction, causal/narrative language, and tell-back; they are not substitutes for explicit phonemic work.

### 7.2 Early mathematics

```text
small-quantity recognition
  → one-to-one counting and stable order
  → cardinality
  → magnitude comparison
  → composition/decomposition
  → tiny operations stories

shape recognition
  → properties
  → composition and spatial relations

copy a pattern
  → extend
  → identify the repeating unit
  → create and explain
```

Rules:

- “Count” means touch or move one object per number word and identify how many altogether.
- Use structured arrangements, five-frames, fingers, or part–whole visuals before abstract numerals.
- If numerals are not the objective, a child can succeed through quantities and speech alone.
- Comparison feedback names both quantities and the relation.
- Shapes are taught through properties and transformations, not only prototype recognition.

### 7.3 Early science

```text
notice and name
  → compare and classify by an observable property
  → order a change
  → predict
  → act/test
  → observe evidence
  → explain or tell back
```

Rules:

- Separate observation (“the soil looks dry”) from inference (“the plant may need water”).
- Let a child commit to a prediction before reveal; predictions are not marked wrong.
- Simulations must disclose what is simplified and never contradict basic physical or biological relationships.
- Prefer phenomena a child can safely revisit off-screen: shadows, rolling, melting, plant parts, weather observations, sound, materials.
- Never ask a child to taste, inhale, handle allergens, use tools, approach animals, or conduct an unsafe experiment without explicit adult control.

### 7.4 Integrated themes

An integrated theme has one lead skill and at most one light connection. The child is tested only on the lead skill. For example:

- Seeds + `/s/`: lead skill is initial-phoneme isolation; plant vocabulary is context.
- Counting seeds: lead skill is one-to-one correspondence; gardening is context.
- How a seed grows: lead skill is life-cycle sequence; ordinal language is support.

## 8. Archetype portfolio

Each archetype below is a separate discriminant in the artifact schema and a separate trusted renderer.

### 8.1 `listen_point` — Listen & Point

Best for: vocabulary, receptive language, attribute recognition, sound identification, simple retrieval.  
Ages: 3–6.  
Child action: hear one short prompt, then tap one of two to four large semantic pictures.

Required sequence:

1. Buddy names the small scene.
2. One picture is modeled and highlighted.
3. The prompt asks for one feature.
4. Every picture names itself when previewed; preview does not submit.
5. A second deliberate tap or a separate central “this one” gesture submits for ages 3–4; ages 4–6 may use one-tap submit after modeling.
6. Retrieval changes the pictures or asks for the converse feature.

Do not use when the objective requires ordering, quantity construction, or causal manipulation. Do not make the child distinguish choices only by labels.

Seed example: “Tap what can grow into a plant,” with seed, stone, and spoon pictures.

### 8.2 `sound_hunt` — Sound Hunt

Best for: rhyme, syllables, initial/final phoneme isolation, onset–rime, alliteration.  
Ages: 3–6; letter anchors only when sound–letter mapping is the objective.  
Child action: tap a picture to hear its word, then place/point it at a semantic sound anchor or collect matching pictures.

Required sequence:

1. Model the target sound with a mouth/air/voice cue and a memorable anchor.
2. Speak the full word naturally, then stretch only the target segment.
3. Child previews each picture by tapping.
4. Child chooses a sound home or adds it to a collection.
5. Feedback repeats the word and isolates the relevant sound.
6. Retrieval uses new pictures, not reordered copies.

Do not use spelling, word shape, or picture guessing as evidence of sound awareness. A snake picture promised in speech must visibly exist.

Seed example: collect sun, sock, and seed beside the hissing snake; leave moon and apple outside.

### 8.3 `picture_sort` — Picture Sort

Best for: classification after the child understands both categories and the category distinction is itself the objective.  
Ages: 3–6.  
Child action: preview one item and place it in one of two picture homes.

Required sequence:

1. Both homes have semantically distinct images and replay controls.
2. Model one full item-to-home placement.
3. One item is active at a time for ages 3–4; child-chosen order is allowed for ages 4–6.
4. Each placement produces explanatory feedback.
5. Retrieval changes at least one item and removes home highlighting.

Do not use as the universal mechanic. Avoid categories with ambiguous or overlapping membership unless ambiguity is the explicit discussion goal.

### 8.4 `match_pairs` — Match Pairs

Best for: object-to-function, animal-to-home, same quantity across representations, shape correspondence, cause-to-observation.  
Ages: 3–6.  
Child action: connect or place one large card beside its meaningful partner.

Required sequence:

1. Model one pair and narrate the relationship.
2. Show at most three candidate partners.
3. A matched pair visibly joins and remains available for replay.
4. Feedback names the relation, not “they match.”
5. Retrieval reverses the direction or changes representation.

Seed example: seed ↔ seed packet; sprout ↔ watering can, only if the intended relation is explained accurately.

### 8.5 `count_build` — Count & Build

Best for: one-to-one correspondence, stable order, cardinality, composition, tiny addition/subtraction stories.  
Ages: 3–6 with age-bounded quantities.  
Child action: move or tap one object into each visible place while the system counts in synchrony.

Required sequence:

1. Hand animation models one object, one place, one number word.
2. Each placement locks or visibly occupies one place.
3. The system speaks the number word after the object lands, not before.
4. At completion, sweep/highlight the whole set and ask “How many altogether?”
5. Cardinality feedback repeats the final number without recounting first.
6. Retrieval changes spacing or object type while preserving quantity.

Defaults: quantities 1–3 for age 3, 1–5 for age 4, structured quantities through 10 for ages 5–6 when appropriate.

Seed example: place one seed in each of four soil holes, then identify four altogether.

### 8.6 `flash_see` — Flash & See

Best for: perceptual and conceptual subitizing.  
Ages: 3–6; 1–3 initially, then structured groups through 5 or 10.  
Child action: briefly view a structured set, then choose/build the same quantity and explain how it was seen.

Required sequence:

1. Model a canonical arrangement without counting each object.
2. Flash duration is teacher-configured between 600 and 2,000 ms; never score speed.
3. Answer choices use quantities before numerals unless numeral mapping is the objective.
4. Reveal restores the set and groups it visually.
5. Feedback accepts multiple valid grouping explanations.

Seed example: briefly show two seeds on top and two below; reveal “two and two make four.”

### 8.7 `compare_choose` — Compare & Choose

Best for: more/less/same, longer/shorter, heavier/lighter in a faithful simulation, size or observable attributes.  
Ages: 3–6.  
Child action: inspect two concrete representations and tap, move, or balance the one that satisfies the prompt.

Required sequence:

1. Model the comparison process, not only the answer.
2. Visually align countable sets for one-to-one comparison when helpful.
3. Speak both values or attributes and the relation.
4. Include equal comparisons after the relation is understood.
5. Retrieval changes arrangement so area/spacing cannot be used as a shortcut.

Seed example: choose the tray with more seeds, then see both trays aligned one seed to one seed.

### 8.8 `pattern_continue` — Pattern & Continue

Best for: copy, extend, identify, and create repeating patterns.  
Ages: 3–6.  
Child action: place or tap the next object in a rhythmic visual/auditory sequence.

Required sequence:

1. Animate and speak the repeating unit with rhythm.
2. Start with AB, then AAB/ABB/ABC only after demonstrated success.
3. Mark the unit boundary without relying on text.
4. After an error, replay the full unit and pause at the gap.
5. Retrieval changes objects while preserving structure.

Seed example: seed–sprout, seed–sprout, what comes next?

### 8.9 `sequence_grow` — Sequence & Grow

Best for: temporal order, routines, life cycles, narrative order, multi-step processes.  
Ages: 3–6.  
Child action: arrange two to four picture events on a visible path, then replay the transformation.

Required sequence:

1. Model how one event changes into the next.
2. Use motion between states, not arrows alone.
3. Age 3 starts with before/after; age 4 with three steps; ages 5–6 may use four steps and causal language.
4. Feedback narrates the entire completed sequence.
5. Retrieval removes one event for the child to restore or asks what happens next.

Seed example: seed → root → sprout → plant. Do not imply every plant follows an identical timing or appearance.

### 8.10 `predict_test_reveal` — Predict, Test, Reveal

Best for: early science inquiry, probabilistic noticing, transformations, simple data habits.  
Ages: 3–6.  
Child action: choose a prediction without correctness feedback, perform a safe action, observe, then compare prediction with result.

Required sequence:

1. Name the observable question.
2. Offer two or three picture predictions and say that guessing is okay.
3. Record the prediction visibly without praise or rejection.
4. Child initiates the test/reveal.
5. Narrator distinguishes “we thought” from “we saw.”
6. Retrieval changes one variable only.

Seed example: predict which pictured condition helps a sprout; test a faithful simplified model, then invite a real grown-up-led observation over days.

### 8.11 `cause_effect_lab` — Cause & Effect Lab

Best for: controlled manipulation, systems, forces, sound, light, water flow, plant needs.  
Ages: 4–6 by default; limited one-control versions for age 3.  
Child action: manipulate one meaningful control and observe a visible consequence.

Required sequence:

1. Model the control and result once.
2. Expose one variable at a time.
3. Consequences are immediate, proportional where appropriate, and scientifically defensible.
4. The child may freely test within bounded safe states.
5. A guided prompt asks for a comparison after exploration.
6. Retrieval asks the child to produce a target outcome.

Do not use decorative sliders, false precision, or impossible simulation behavior.

Seed example: vary water among none/some/too much across a clearly labeled time-lapse model, with adult explanation that real growth takes time.

### 8.12 `spatial_build` — Spatial Build

Best for: shape composition, position words, symmetry, part–whole relationships, simple engineering constraints.  
Ages: 3–6.  
Child action: rotate, place, stack, or compose large pieces in a bounded workspace.

Required sequence:

1. Model one transformation with gesture and spatial language.
2. Snap zones are generous and visible through motion/outline.
3. Permit valid alternate solutions when the objective allows them.
4. Feedback names position/property: above, beside, under, turn, side, corner.
5. Retrieval asks for the same relation with different pieces.

Seed example: place roots under the soil line and the sprout above it; later rebuild from a changed orientation.

### 8.13 `story_talk` — Story Talk & Tell-Back

Best for: vocabulary, inferential language, causal/narrative language, emotion reasoning, prediction, oral retell.  
Ages: 3–6.  
Child action: listen to a short illustrated beat, tap meaningful scene details, answer one picture/voice question, and retell with pictures.

Required sequence:

1. Use two to five short beats depending on age.
2. Audio and illustration carry the story; text is optional exposure.
3. Ask at most one dialogic prompt per beat.
4. A response may be tap, gesture selected by grown-up, or speech.
5. The story responds briefly, then continues; it does not grade personal interpretation as wrong.
6. Retrieval uses picture ordering or oral tell-back.

Dialogic reading supports oral language; it must not be represented as a replacement for explicit phonological awareness or phonics instruction.

Seed example: a child finds a seed, chooses where to investigate, notices change, and retells first/next/last.

### 8.14 `move_imitate` — Move & Imitate

Best for: syllable segmentation, positional language, gross-motor patterning, acting out vocabulary, self-regulation transitions.  
Ages: 3–6 with grown-up supervision.  
Child action: watch/listen, perform a body action, then tap a large “done/again” picture or let the grown-up confirm.

Required sequence:

1. Demonstrate one safe movement.
2. Offer a seated or low-mobility equivalent.
3. Never use the camera as a requirement.
4. Do not infer correctness from motion sensors.
5. Retrieval changes the cue order or asks the child to lead the grown-up.

Seed example: curl small like a seed, reach like a sprout, then act out first/next.

### 8.15 `real_world_hunt` — Real-World Hunt

Best for: transfer, vocabulary, attribute noticing, counting, environmental print with an adult, science observation.  
Ages: 3–6 with a grown-up.  
Child action: leave the screen briefly, find/point/do something safe, and return to report with a picture, tap, or speech.

Required sequence:

1. The grown-up hears the safety-scoped prompt.
2. The screen shows one memorable mission picture.
3. No location, photo, video, or identifying data is collected.
4. The child can return with “found it,” “not yet,” or “show me another.”
5. The tutor asks one observation question, then ends.

Seed example: with a grown-up, find something growing and point to the part above the ground.

## 9. Archetype selection router

The first release uses deterministic rules. The model may recommend candidates, but it cannot override the router without a teacher-visible reason.

| Observable objective signal | Default archetype candidates | Reject when |
|---|---|---|
| identify, point, recognize, name | `listen_point` | child must construct/order/test |
| hear, rhyme, clap, blend, first/last sound | `sound_hunt` | objective is sound–letter mapping but artifact has no letter anchor |
| classify, sort by | `picture_sort` | categories overlap or are not visually/audibly grounded |
| match, connect, belongs with | `match_pairs` | relation is merely visual similarity |
| count, make, give N, how many | `count_build` | objects cannot be individually represented |
| instantly see, how many without counting | `flash_see` | quantity exceeds validated developmental range |
| compare, more, fewer, longer, same | `compare_choose` | representation introduces a perceptual shortcut |
| continue, repeat, what comes next | `pattern_continue` | sequence is non-repeating; use `sequence_grow` |
| order, first/next/last, grows/changes | `sequence_grow` | causal manipulation is the goal |
| predict, test, what will happen | `predict_test_reveal` | prediction is treated as a graded fact recall |
| change, make happen, investigate | `cause_effect_lab` | simulation cannot be scientifically faithful |
| build, turn, above/below, compose | `spatial_build` | drag precision would exceed motor expectations |
| tell, explain, infer, retell | `story_talk` | target is explicit decoding or phoneme manipulation |
| act, move, clap, imitate | `move_imitate` | movement cannot be made safe and inclusive |
| find nearby, show a grown-up, observe outside | `real_world_hunt` | mission requires data capture or uncontrolled risk |

Tie-breakers, in order:

1. choose the archetype that elicits the objective behavior directly;
2. choose the lowest working-memory and motor demand;
3. prefer a form not used in the learner’s last two lessons, if equally valid;
4. prefer an archetype with approved content for the domain and age;
5. surface unresolved ambiguity to the teacher rather than inventing certainty.

## 10. Artifact schema V3

### 10.1 Design

Use a discriminated union. Common teaching stages are shared; mechanic payloads are typed. Generated HTML, JavaScript, CSS, URLs, event handlers, and component names are forbidden.

```ts
type AgeProfile = "age-3-4" | "age-4-5" | "age-5-6";
type Domain = "early-literacy" | "early-math" | "early-science" | "integrated";

type LessonArtifactV3 = {
  schemaVersion: "3.0";
  id: string;
  title: string;
  topic: string;
  objective: string;
  observableVerb: string;
  leadDomain: Domain;
  ageProfile: AgeProfile;
  durationMinutes: number;
  learningProgression: {
    skill: string;
    prerequisite: string;
    nextSkill: string;
  };
  pedagogy: {
    method: string;
    rationale: string;
    evidenceRefs: string[];
    limitations: string[];
  };
  presentation: PresentationContract;
  model: WorkedExample;
  rounds: PracticeRound[];
  retrieval: RetrievalRound;
  transfer: TransferContract;
  support: SupportContract;
  mechanic: LessonMechanic;
  review: ReviewState;
};

type LessonMechanic =
  | ListenPointMechanic
  | SoundHuntMechanic
  | PictureSortMechanic
  | MatchPairsMechanic
  | CountBuildMechanic
  | FlashSeeMechanic
  | CompareChooseMechanic
  | PatternContinueMechanic
  | SequenceGrowMechanic
  | PredictTestRevealMechanic
  | CauseEffectLabMechanic
  | SpatialBuildMechanic
  | StoryTalkMechanic
  | MoveImitateMechanic
  | RealWorldHuntMechanic;
```

### 10.2 Common presentation contract

```ts
type SemanticCue = {
  cueId: string;
  kind: "emoji" | "approved-illustration" | "shape" | "quantity-frame" | "motion";
  value: string;
  spokenName: string;
  alt: string;
};

type SpeechBeat = {
  beatId: string;
  text: string;
  cueIds: string[];
  actionId?: string;
  protected: boolean;
};

type PresentationContract = {
  cues: SemanticCue[];
  stageEntrySpeech: SpeechBeat[];
  repeatSpeech: SpeechBeat[];
  visibleAdultText: string;
  firstActionId: string;
  reducedMotionEquivalent: Record<string, string>;
};
```

Validation rules:

- every `cueId` and `actionId` is unique and referenced;
- every child action has a cue, accessible name, spoken cue, and deterministic transition;
- stage-entry speech references only cues currently visible;
- stage-entry speech ends with one immediate action;
- speech never promises a picture that is absent;
- no action requires a label to distinguish it;
- age-specific choice, quantity, duration, and copy limits pass;
- all correctness comes from structured data, never free-form model judgment;
- retrieval differs from the worked example by validated content identity and/or representation;
- transfer is bounded, safe, adult-readable, and collects no child data.

### 10.3 Example mechanic payload

```ts
type CountBuildMechanic = {
  type: "count_build";
  targetCount: number;
  sourceCueId: string;
  destinationCueIds: string[];
  countWords: string[];
  objectCueIds: string[];
  placementMode: "tap-next" | "drag";
  finalQuantityChoices: Array<{
    id: string;
    quantityCueId: string;
    value: number;
  }>;
};
```

Use `tap-next` as the age 3–4 default because precise dragging may measure motor control instead of number knowledge.

## 11. Compiler and review pipeline

```text
Teacher brief
  → privacy scrub and input validation
  → objective normalizer
  → domain progression resolver
  → deterministic archetype router
  → model generates typed content only
  → schema validator
  → pedagogy validator
  → visual/audio referential-integrity validator
  → safety and representation critic
  → teacher preview with rationale and limitations
  → teacher edits/approves
  → immutable published artifact
```

### 11.1 Objective normalizer

Input: topic, teacher objective, age, duration, context.  
Output: one observable child behavior, one lead domain, prerequisite, intended evidence, forbidden shortcuts.

Reject or request teacher revision if:

- the objective contains more than one independently tested skill;
- success cannot be observed in a short lesson;
- the target is developmentally inappropriate or unsafe;
- required cultural/context knowledge is unstated;
- the brief includes child records or identifying information.

### 11.2 Model generation contract

The generation prompt supplies:

- the resolved archetype and its schema;
- age-profile limits;
- domain progression rules;
- approved cue catalog;
- complete positive and negative examples;
- requirement to state uncertainty and limitations;
- requirement to return JSON only.

The model does not choose component names, styling, correctness logic, analytics, network calls, or code.

### 11.3 Critics

Run deterministic validators first. Run model critics only for judgments that cannot be expressed structurally, such as conceptual ambiguity, cultural unfamiliarity, or explanation quality. Critic output is advisory unless mapped to an explicit blocking policy.

Required critic questions:

1. Does the child action directly demonstrate the objective?
2. Could a child succeed through a visual shortcut without the intended thinking?
3. Does every spoken referent exist visibly and mean the same thing?
4. Is the worked example accurate and consistent with the practice items?
5. Does feedback explain the target feature?
6. Is the task operable without reading?
7. Is the science/math/literacy content correct for this entry point?
8. Are the examples culturally respectful and likely familiar, or editable when not?
9. Is the transfer safe and realistic?
10. Does any copy overclaim learning, certainty, or approval?

## 12. Renderer architecture

### 12.1 Registry

```ts
const mechanicRenderers: Record<LessonMechanic["type"], MechanicRenderer> = {
  listen_point: ListenPointRenderer,
  sound_hunt: SoundHuntRenderer,
  picture_sort: PictureSortRenderer,
  match_pairs: MatchPairsRenderer,
  count_build: CountBuildRenderer,
  flash_see: FlashSeeRenderer,
  compare_choose: CompareChooseRenderer,
  pattern_continue: PatternContinueRenderer,
  sequence_grow: SequenceGrowRenderer,
  predict_test_reveal: PredictTestRevealRenderer,
  cause_effect_lab: CauseEffectLabRenderer,
  spatial_build: SpatialBuildRenderer,
  story_talk: StoryTalkRenderer,
  move_imitate: MoveImitateRenderer,
  real_world_hunt: RealWorldHuntRenderer,
};
```

Each renderer receives only validated data and a shared runtime:

```ts
type MechanicRuntime = {
  state: LessonRuntimeState;
  dispatch: (event: LessonEvent) => void;
  speak: (plan: SpeechBeat[], options?: SpeechOptions) => void;
  stopSpeech: (reason: "navigate" | "exit" | "mute") => void;
  announce: (message: string) => void;
  record: (event: LearningEvent) => void;
};
```

Renderers may not call generation APIs, decide correctness through a model, mutate teacher artifacts, or render raw generated markup.

### 12.2 Shared state machine

```text
loading
  → orienting
  → modeling
  → awaiting_action
  → evaluating
  → feedback
  → awaiting_action | retrieval
  → transfer
  → complete
```

Global events:

- `STAGE_ENTERED`: cancel stale speech, load current speech plan, lock mic, start cue.
- `NARRATION_STARTED`: mark protected output active.
- `NARRATION_COMPLETED`: unlock mic, enter `awaiting_action`.
- `NEXT_TAPPED`: cancel response and browser output buffer, clear old queue, transition, speak new stage.
- `REPEAT_TAPPED`: replay current immediate instruction only.
- `OBJECT_PREVIEWED`: speak object name/feature; do not submit unless archetype defines one-tap action.
- `ATTEMPT_SUBMITTED`: evaluate deterministically.
- `HELP_REQUESTED`: move one rung down the approved support ladder.
- `EXIT_TAPPED`: stop audio, close session, discard in-memory transcript.

### 12.3 Visual system

All archetypes reuse:

- one persistent buddy/repeat location;
- one stable Next location and icon;
- one visual stage path;
- semantic illustration tokens;
- motion tokens for invite, demonstrate, connect, transform, retry;
- quantity frames and manipulatives;
- a supportive feedback surface;
- adult-only expandable text.

Variation comes from the learning action, not from moving global controls or reskinning a quiz.

## 13. Voice and conversational tutor contract

The trusted runtime owns navigation, correctness, attempts, and support level. Realtime voice provides speech, brief contingent conversation, and narrow approved tools.

### 13.1 Speech classes

| Class | Interruptible by room speech | Interruptible by navigation | Maximum behavior |
|---|---:|---:|---|
| Stage-entry immediate instruction | no | yes | Complete short approved script |
| Worked example | no | yes | Complete synchronized explanation |
| Object name/feature | no while phrase is playing | yes | One or two short clauses |
| Feedback | no while phrase is playing | yes | Feature + next action |
| Open conversational response | yes | yes | Usually two short sentences, then wait |

Protected narration exists to prevent echo/self-interruption, not to justify long lectures. Page-entry audio must be chunked and short. If additional explanation is useful, reveal it after the child’s first action or through the repeat/help controls.

### 13.2 Tool boundary

Allowed tools:

- `get_lesson_state`
- `repeat_instruction`
- `give_approved_hint`
- `ask_grown_up`

A future tool may record a child’s spoken choice only if the deterministic UI exposes the same choice, the child can complete without speech recognition, and the tool maps to a finite state transition.

### 13.3 Failure behavior

- If Realtime cannot connect, retain all visual actions and show a grown-up read-aloud option.
- Never silently fall back to low-quality browser text-to-speech while presenting it as the same voice experience.
- Do not persist raw child audio or transcripts in the prototype.
- Show a plain grown-up error; never tell the child they caused a voice failure.

## 14. Adaptation without profiling

Adapt the task, not the child’s identity. Keep support state lesson-local unless a teacher explicitly saves progress.

Allowed signals:

- number of attempts on the current concept;
- repeat/help requests;
- successful changed retrieval;
- response modality selected;
- teacher-chosen age/support profile.

Disallowed signals:

- inferred intelligence, diagnosis, emotion, attention disorder, home situation, or reading level;
- facial, biometric, or affect analysis;
- comparisons with other children;
- opaque “ability scores” shown to a child or family.

Support ladder:

```text
0 independent invitation
1 exact slower repeat
2 highlight or contrast the relevant perceptual feature
3 model one smaller step
4 simplify choices or quantity while preserving objective
5 invite grown-up co-play
```

Advance support by one rung after an error or explicit help request. Reduce support only after successful retrieval, never because time elapsed.

## 15. Real E2E release specification

Unit tests may aid development, but they do not satisfy release evidence. Each new archetype requires real browser interaction and, where voice is part of the acceptance path, real provider calls.

### 15.1 Minimum evidence per archetype

Before an archetype is production-enabled:

1. Generate two uncached lessons through the real model API.
2. Cover age profiles 3–4 and 5–6; add 4–5 before general release.
3. Render and complete the lesson in desktop Chromium and a touch/mobile viewport.
4. Complete one full run using real OpenAI Realtime audio.
5. Capture teacher preview, worked example, independent round, retrieval, and transfer screenshots.
6. Store provider/model, trace ID, latency, schema result, policy result, and artifact hash.
7. Have a qualified domain reviewer inspect the artifact and evidence bundle.

### 15.2 Cross-archetype assertions

Every production E2E asserts:

- generated response is uncached and schema-valid;
- no raw HTML, script, URL, or fixture content appears;
- the observable objective maps to the selected archetype;
- all visible actionable targets meet age-profile size limits;
- every action has semantic imagery and an accessible name;
- no child path depends on reading a word;
- stage entry auto-narrates after sound permission;
- the full approved immediate script completes and the mic remains muted through it;
- tapping Next during a repeated old-stage narration cuts it off, never marks it complete, and completes only the new-stage script;
- object taps say the same object/feature that is visible;
- worked example uses a real playable relationship;
- first error gives a useful cue and preserves retry;
- retrieval changes example or representation;
- transfer leaves the screen and is safely adult-mediated;
- no child audio/transcript is persisted after exit;
- no ad, timer, streak loss, random reward, purchase, or endless next lesson exists.

### 15.3 Archetype-specific examples

| Archetype | Required proof |
|---|---|
| `count_build` | One object per destination; synchronous number words; cardinality prompt; age quantity limit |
| `flash_see` | Valid flash duration; no speed score; structured reveal; alternate grouping accepted |
| `compare_choose` | Arrangement changes on retrieval; spacing cannot determine answer |
| `sequence_grow` | Motion shows transition; completed sequence narrates in order |
| `predict_test_reveal` | Prediction gets no right/wrong state; observation is distinguished from prediction |
| `cause_effect_lab` | One variable changes; all output states are within reviewed scientific model |
| `story_talk` | Child can answer by picture; prompt is open enough for oral language and not falsely graded |
| `move_imitate` | Seated alternative exists; no camera permission requested |
| `real_world_hunt` | No photo/location capture; safe grown-up cue; explicit session end |

## 16. Educator, accessibility, family, and safety sign-off

No document can truthfully substitute for real expert approval. “World-class educator approved” is forbidden until named, qualified humans review the actual archetype, sample artifacts, rendered experience, and E2E evidence.

### 16.1 Review panel

At minimum:

- one lead early-childhood educator with recent classroom experience across ages 3–6;
- one domain specialist for each enabled domain: structured early literacy, early mathematics, or inquiry-based early science;
- one accessibility/inclusive-design specialist with early-childhood experience;
- one speech-language or multilingual-learning specialist before voice-based response features expand;
- two caregivers representing target ages and varied reading/technology familiarity;
- child privacy/safety counsel before collecting any persistent learner data;
- moderated usability sessions with children in each age profile, with guardian consent and an appropriate research/privacy protocol.

Paid advisors, conflicts, scope, and evidence reviewed must be disclosed. Prestige is not a substitute for relevant expertise or direct review.

### 16.2 Sign-off artifact

Create `docs/signoffs/<archetype>/<review-date>-<role>.md` containing:

```md
# Archetype review
Reviewer role and relevant qualifications:
Scope reviewed:
Artifact hashes and build commit:
Age profiles observed:
Domain progression judgment: approve | changes required
Non-reader operability judgment: approve | changes required
Concept accuracy judgment: approve | changes required
Feedback/scaffolding judgment: approve | changes required
Representation/cultural concerns:
Safety/accessibility concerns:
Required changes:
Residual limitations:
Decision and date:
```

Release requires all required changes closed and rechecked. Store the sign-off; do not summarize an informal conversation as approval.

### 16.3 Child usability protocol

Observe, do not coach the interface into success. For each session record only consented, minimized research data:

- Can the child identify what to do before the grown-up explains it?
- Can the child find repeat and Next from pictures/location?
- Does audio reference the visible object the child attends to?
- Does the child perform the intended cognitive action or exploit a shortcut?
- What happens after the first error?
- When and why does the grown-up intervene?
- Can the child demonstrate the target on a changed example?
- Can child and grown-up perform the off-screen transfer?

Stop on distress, frustration, fatigue, or child withdrawal. The child owes the product no completion.

## 17. Learning evaluation plan

### 17.1 Product readiness study

Before efficacy claims, run moderated usability with at least five children per age profile per foundation archetype, sampled across varied language, ability, and prior-experience contexts. This is a usability target, not a statistically powered learning study.

Readiness thresholds:

- at least 80% begin the first intended action without a grown-up reading UI text;
- at least 80% locate replay after one modeled use;
- no repeated systematic mismatch between spoken cue and attended visual;
- fewer than 20% require grown-up interface explanation after the worked example;
- no severe safety, dignity, accessibility, or privacy issue;
- reviewers agree in-app success cannot be achieved by a dominant unintended shortcut.

These thresholds are product decisions, not published efficacy norms.

### 17.2 Learning pilot

Use a preregistered, age-appropriate pilot designed with a learning scientist:

- brief baseline probe of the exact target;
- one or more lessons with documented exposure;
- immediate changed-example retrieval;
- delayed retrieval where feasible;
- off-screen or alternate-representation transfer;
- comparison condition appropriate to the claim;
- analysis by age profile and initial skill without labeling children in-product;
- report null and negative findings.

Do not optimize on time-on-screen, total taps, lesson streaks, or voice minutes. Primary product measures are independent action, scaffold level, changed retrieval, transfer, grown-up intervention, and teacher-rated usefulness.

## 18. Implementation plan for a junior engineer

Each work package is independently reviewable. Do not begin the next production archetype until the previous package’s acceptance evidence exists.

### WP0 — Preserve and baseline the current prototype

1. Tag the current approved commit.
2. Run build, lint, TypeScript, real generation, and real Realtime E2E.
3. Save the evidence manifest and screenshots.
4. Record current `picture_sort` schema and behavior as the migration fixture.

Done when: the current flow can be reproduced from a clean checkout and no secret is stored in Git.

### WP1 — Add V3 types and registry behind a flag

Suggested files:

```text
app/lib/artifacts/v3/base.ts
app/lib/artifacts/v3/mechanics.ts
app/lib/artifacts/v3/schema.ts
app/lib/artifacts/v3/validate.ts
app/lib/mechanics/registry.ts
app/lib/feature-flags.ts
```

Steps:

1. Encode common types and all discriminants.
2. Implement schema parsing with exhaustive errors.
3. Add `picture_sort` adapter from V2.1 to V3.
4. Reject unknown mechanics and raw markup fields.
5. Add a feature flag that defaults V3 off in production.

Done when: V2 remains playable; one V3 `picture_sort` artifact renders identically; exhaustive TypeScript switching fails compilation if a discriminant is unhandled.

### WP2 — Build the shared non-reader runtime

Suggested files:

```text
app/components/lesson-runtime/LessonRuntime.tsx
app/components/lesson-runtime/StageShell.tsx
app/components/lesson-runtime/SemanticCue.tsx
app/components/lesson-runtime/WonderBuddy.tsx
app/components/lesson-runtime/PictureNext.tsx
app/lib/lesson-state-machine.ts
app/lib/speech-plan.ts
```

Steps:

1. Implement the state machine and typed events.
2. Move stage entry/repeat/Next audio behavior into the shared runtime.
3. Guarantee navigation cancellation clears active and queued old speech.
4. Add semantic cue, motion, target-size, reduced-motion, and adult-copy primitives.
5. Add learning-event instrumentation without raw child speech.

Done when: current `picture_sort` uses the shared runtime and the real E2E proves complete narration, protected mic, and navigation cancellation.

### WP3 — Implement deterministic selection and validators

Suggested files:

```text
app/lib/compiler/objective-normalizer.ts
app/lib/compiler/archetype-router.ts
app/lib/compiler/progression-rules.ts
app/lib/compiler/pedagogy-validator.ts
app/lib/compiler/referential-integrity.ts
```

Steps:

1. Encode the routing matrix in section 9.
2. Add age-profile limits.
3. Validate speech-to-cue referential integrity.
4. Validate worked-example/practice/retrieval separation.
5. Surface selection rationale and blocking errors in teacher preview.

Done when: a table-driven fixture for every routing row returns the intended candidates, and real generated artifacts cannot bypass structural validation.

### WP4 — Foundation archetypes

Implement one at a time in this order:

1. `listen_point`
2. `count_build`
3. `compare_choose`
4. `match_pairs`
5. `sequence_grow`

For each:

1. add schema and validator;
2. add renderer using only shared primitives;
3. add generation prompt examples and critic rubric;
4. add teacher preview explanation;
5. add two real generated E2Es across age bands;
6. conduct curriculum/accessibility review;
7. run moderated child usability;
8. enable behind an archetype-specific rollout flag.

Done when: every item in sections 15 and 16 passes for that archetype.

### WP5 — Reasoning archetypes

Order: `flash_see`, `pattern_continue`, `predict_test_reveal`, `spatial_build`, `cause_effect_lab`.

Extra gates:

- math specialist approves all quantity and representation ranges;
- science specialist approves every simulated relationship and limitation;
- performance E2E proves animation remains responsive on target mobile hardware;
- alternative input path exists for all drag/rotate actions.

### WP6 — Language, embodied, and transfer archetypes

Order: `sound_hunt`, `story_talk`, `move_imitate`, `real_world_hunt`.

Extra gates:

- structured literacy specialist approves speech-sound progression and examples;
- speech-language/multilingual specialist reviews pronunciation and response behavior;
- story prompts do not grade subjective answers as factual errors;
- movement has seated equivalents and no camera dependency;
- real-world missions collect no media, location, or identity data.

### WP7 — Teacher planning and proactive generation

Only after archetypes are reviewed:

1. Let a teacher map a lesson-plan objective to one or more candidate archetypes.
2. Show why each candidate fits and which learner action provides evidence.
3. Generate drafts ahead of time, never auto-publish.
4. Reuse approved artifact components when objectives repeat.
5. Require teacher review of content, cultural fit, materials, and transfer.
6. Record immutable artifact hash and reviewer before assignment.

Do not proactively create hundreds of unreviewed activities. Quality, reviewability, and curriculum coherence matter more than catalog size.

## 19. Pull-request checklist

An archetype PR is incomplete unless the author can answer yes to every applicable item:

- [ ] The objective and domain progression are explicit.
- [ ] The archetype directly elicits the intended child behavior.
- [ ] A child can operate it without decoding labels.
- [ ] Speech, pictures, motion, and state use the same referents.
- [ ] One worked example uses the real interaction.
- [ ] One action is requested at a time.
- [ ] Error feedback provides the least necessary cue and retry.
- [ ] Retrieval changes content or representation.
- [ ] Transfer is safe, short, adult-mediated, and off-screen.
- [ ] Age choice/quantity/copy/target limits pass.
- [ ] Reduced-motion and alternative-input paths work.
- [ ] Correctness is deterministic and generated code is impossible.
- [ ] Next cancels prior narration; echo/room noise cannot cut protected speech.
- [ ] Real generation and Realtime E2E evidence is attached.
- [ ] Qualified curriculum and accessibility reviews are stored.
- [ ] Product copy makes no unsupported efficacy or approval claim.

## 20. Product decision summary

Wonderweave should become a learning compiler backed by a small, excellent repertoire of developmentally meaningful actions—not a theme generator that turns every objective into a reskinned sort. The shared experience should feel consistent to a non-reader: listen, look, touch, move, notice, talk, try again. The learning form should vary because counting, phoneme awareness, comparison, sequence, prediction, spatial reasoning, and storytelling are genuinely different kinds of thinking.

The next build target is the shared V3 runtime plus `listen_point` and `count_build`. Those two archetypes exercise the two most important branches—language through listening/semantic pictures and mathematics through concrete manipulation—while forcing the architecture to solve audio, semantic cues, deterministic evidence, age adaptation, retrieval, and off-screen transfer correctly.
