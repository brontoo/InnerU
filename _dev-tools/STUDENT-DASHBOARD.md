# Student dashboard and completion-based achievements

`learning-progress.js` provides a shared, read-only snapshot of six world states,
task credits, completion milestones and achievements. `student-dashboard.js`
replaces the old dashboard and achievement renderers after the existing route
extensions have loaded. `student-dashboard.css` follows the portal's navy, teal,
ivory and brass identity and reuses its anatomical studies.

## Layout and interaction

- Whole-expedition progress, XP level, mission count, earned achievements and keys.
- Six keyboard-accessible anatomy tabs with mission checklists, partial task
  counts, actual completion state, final requirements and accessible resume links.
- Earned and upcoming badges, each opening a native dialog with its requirement,
  progress, earned date when recorded, and a route back to the relevant work.
- A filterable discovery log containing task credits and mission milestones.
- An XP breakdown reconciling the new itemised log with earlier saved points.
- Learning-plan links, profile preferences, teacher-code transfer and an explicit
  reset confirmation that clears all six worlds together.
- A matching achievement collection with earned/locked and system filters.

The expedition denominator is 45: 39 regular missions and six system finals.
Body Detective, System Connections, daily discovery and the whole-body capstone
remain separate activities; their points and achievements are included without
silently changing the mission denominator. Numerical XP level uses the existing
150-XP interval. Explorer/Challenger/Master remains a chosen challenge setting.

## Completion and reward rules

The 49-achievement registry includes one badge for each of the 39 regular
missions, six mastery badges, the four-case skeletal Medical Investigator,
six-file All-Systems Investigator, System Thinker and final Whole-Body Explorer.
This adds the missing muscular mission 7 achievement and gives every system the
same mission/final distinction. Badges derive from saved completion flags, not
page visits or XP thresholds. A correct check can earn XP while its mission's
badge remains locked until the mission is completed. Badge unlocks do not award
another payment for the same work.

Existing activity XP values and stable reward IDs are preserved. The shared
reward function rejects duplicate, negative and non-finite awards and blocks
reward/save calls in preview. The existing task-specific activity gates remain
responsible for verifying success. Capstone decisions and synthesis now use the
same reward function, with a final completion guard requiring all six decisions,
the written explanation and reviewed rubric. The muscular per-world XP subtotal
increments only by the actual global credit, avoiding drift when replay is
blocked after a restore.

`state.learning` version 1 records `{id, xp, at}` for newly credited tasks and
timestamps for new mission/badge milestones. It does not fabricate historical
completion dates. Existing `state.xp` is retained, with any unitemised portion
shown as "Earlier earned points". Existing reward IDs and mission flags remain
valid. Reading snapshots, selecting systems, inspecting badges and filtering the
log leave learner storage unchanged.

Save events update a currently open dashboard; browser `storage` events update
it when another tab completes work. UI event listeners and observers are
disposed on route changes. Reduced motion disables decorative transitions;
all exploration remains usable with keyboard or touch.

## Progress transfer and older codes

Progress-code version 1 remains readable. Optional `r`, `l` and `t` fields carry
exact paid task IDs, the activity log and world task flags, including completed
capstone decisions/reflection. Imported numbers, IDs, timestamps, arrays and
task booleans are checked before use. Muscular completion IDs use the actual
`muscle:complete-*` namespace.

Older compact codes only have mission counts and key flags. They retain their
earlier XP total. A `legacyCompleted`/`legacyFinals` mask prevents those completed
missions and finals from paying for missing historical task IDs when replayed.
New work still earns normal points. Masks are retained if the learner exports a
new code later. New codes preserve exact partial task flags as well as rewards,
so completed discoveries do not need to be re-established after transfer.

Both HTML entry points load the same modules. Updated muscle, capstone and
teacher scripts have new cache URLs; the offline shell is version 32.

## Validation

Run `python3 _dev-tools/verify-dashboard.py` with Python Playwright and Chromium.
It checks real skeletal, muscular and circulatory mission completions, wrong
answers, once-only XP, partial versus completed badges, live updates, current
and legacy transfers, final challenge/certificate restore, cross-tab updates,
profile/reset behavior, keyboard/dialog access, preview isolation, reduced
motion, 320–1680 px layouts and offline shell URLs.

Existing skeletal, skin, respiratory, excretory, Body Detective and body-team
harnesses additionally exercise the shared reward mechanism through their real
activities and preserve their existing completion/preview checks. The Body
Detective badge checks now target the unified achievement dialog.
