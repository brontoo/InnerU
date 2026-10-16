# InnerU Recall Studio

The `#review` page is rebuilt in `review.js` and `review.css`. The studio uses the
portal's navy, mint, ivory and brass palette and its existing premium anatomical
studies. It keeps all 54 question IDs (`r0`–`r53`), stored boxes and due dates.

## Learning flow

- An interactive six-specimen constellation focuses the practice builder on a
  chosen system. Selectable system cards support focused or mixed practice.
- Balanced mix interleaves selected systems; a ten-question all-system trail
  includes all six systems. Quick five rotates its starting system between
  completed sessions. Questions do not repeat within a trail.
- Due-now mode uses only scheduled questions that are actually due. It explains
  an empty queue rather than silently starting an empty session.
- The builder reports the actual question count when a selected system has fewer
  than ten questions. A zero-system selection disables session launch.
- A memory map lets students inspect Unseen, Rebuild and the four spaced stages.
  Its questions are expandable, with keyboard-accessible tabs and real counts.
- Questions pair an anatomical study and magnifiable lens with answer selection,
  an explicit recall-check action, scientific feedback and a displayed return
  date. The recall trail records correct and rebuild outcomes with local lights.
- Session summaries show system-specific results, each question's next return,
  and an optional practice-only retry containing exactly the missed questions.
- Paused sessions can be resumed in the same tab, including after route changes.
  Answer order and already-revealed feedback remain stable. Starting a new trail
  prompts before replacing an unfinished local session. Reload discards the local
  trail but preserves answers already recorded in the review schedule.

## Scheduling and honest progress

New or due questions answered correctly advance through 1, 3, 7 and 16-day
intervals. The maximum box remains 4. A missed answer returns to box 0 and is due
immediately. The stored due date remains authoritative.

Correct early practice keeps its current box and due date; repeatedly checking a
future item cannot accelerate it through all the spaced stages. An early missed
answer still returns to Rebuild. Each committed first answer updates accuracy
once. Session counts increment once on a completed primary trail, not on render,
pause, resume or retry. Retry rounds alter neither accuracy nor the saved plan.

Recall lights are local session feedback. Review does not grant mission XP,
mission completion flags, System Keys or achievement badges. The public
`inneruReviewStats()` accessor retains `{pool, due, next}` for dashboard and habit
tools. `InneruRecall` exposes read-only question/schedule/queue views for checks.

The seven-day rhythm uses actual new answer records in `state.review.days` and
keeps up to 90 day entries. It does not fabricate past daily totals from aggregate
accuracy. Existing review totals are preserved. Reading the studio or changing
its selection/stage controls does not save progress. The existing habit route
continues to record an opening of Review as a day of work.

Review reset now requires an explicit UI confirmation and clears only review
history and the local trail. It preserves missions, XP, rewards and keys. The
global dashboard reset continues to clear review along with all other progress.

## Content audit

Three question wordings were corrected without changing IDs:

- Muscle fatigue is described as multifactorial, including changes in energy
  supply and ion balance; lactate alone is not identified as its sole cause.
- Tobacco smoking is identified as the established leading preventable cause of
  lung cancer, avoiding the earlier unsupported equivalence with vaping.
- Touch and pressure detection is attributed to sensory endings/receptors
  without locating every cutaneous sensory ending exclusively in the dermis.

Flagged lesson links now include muscular and circulatory records when present.
The old mapping that sent skeletal mission-one mistakes to the first skin
question was removed. A flagged lesson is linked to its actual system/mission;
the studio does not claim every flagged question has a one-to-one pool match.

## Motion and access

Animated specimen movement, constellation connections, feedback and rhythm bars
have a local pause. OS and app reduced-motion preferences override decorative
motion. Ambient animations pause when offscreen or in a hidden document. No
automatic advance, countdown or audio is introduced. Manual controls remain
available while motion is off.

Dialogs use native modal behavior; lens close returns focus to its opener.
Session entry, next-question transitions and feedback have deliberate focus
targets. Number keys 1–3 select an answer inside the session without committing
it. Stage arrows, Home and End navigate the memory map. All diagrams and controls
fit the tested 320–1680 px layouts. Observers and event listeners are disposed on
page changes. Decorative SVG connections cannot intercept specimen clicks.

Both HTML entry points use versioned review URLs, and the offline shell is
version 33. No new image downloads or external libraries are required.

## Verification

Run `python3 _dev-tools/verify-recall-studio.py` with Python Playwright and
Chromium. It exercises bank identity, corrected science, all specimen links,
mixed/focused/due queues, first-answer records, pause/resume, practice-only
retries, every interval transition, early practice, rhythm counts, reset scope,
keyboard focus, lens controls, motion preferences, responsive layouts, cleanup
and offline shell files.

`python3 _dev-tools/verify-dashboard.py` checks integration with actual mission
credits, badges, transfers and the dashboard's public review statistics. The
older stage-five harness targets the replaced immediate-answer UI; use the
current Recall Studio runner for its new two-step answer flow.
