# Required mission anatomy and task clarity

Implemented locally on `improve/mission-anatomy-task-clarity`, based on `main` at
`d4df25c`. Publication to `main` and the connected Vercel production site was
subsequently authorized on 14 November 2026. Release verification is required
before that push. No database migration, new
dependency, account configuration or model replacement is required.

## Audit and scope

The [audit table](MISSION-ANATOMY-AUDIT.md) was created before application edits
from all 45 authorized teacher previews: 39 regular missions and six system
finals. Its second table records the implemented illustrations and task headings
from all 45 actual student routes. All six systems already had relevant tissue,
organ or microscopic anatomy. Suitable artwork is retained rather than replacing
it with unrelated generic imagery.

The student audit uses isolated local accounts and prerequisite records only in
the local PostgreSQL fixture. Canonical prerequisite reward IDs come from the
existing database catalogue. Each current mission remains unfinished, and the
real account and server mission gates still authorize entry. Browser contexts
block external requests; no production learner, school account or database is
used. Screenshot prerequisite XP belongs to these explicit test fixtures.

## What changed

- Every required investigation has a prominent action heading: identify, match,
  order, predict, compare or explain. Questions retain their original scientific
  prompts and add an explicit answer action. Headings remain visible in Guided
  mode; question reading reads the scientific prompt. Dynamic skeletal question
  redraws and respiratory stations receive the same presentation.
- Action headings are ARIA headings in presentation-only containers. The original
  h2/h3/h4 prompts remain in place, preserving the older generic submission
  identities as well as all explicit assessment IDs. Original control elements,
  values, event handlers, feedback and answer withholding remain unchanged.
- Renal sorting destinations show the actual lungs, skin/sweat-gland and urinary
  structures, or the relevant capillary/tubule compartment. Their original
  selection/drag/keyboard handling remains responsible for answers and points.
- Filtration, tubular exchange and ADH now use the existing detailed renal tissue
  studies with directional transport overlays. The captions stay in responsive
  HTML instead of shrinking or colliding inside SVG text. The overlays remain
  qualitative; their numbers and speed are not measured physiological values.
- The separate acid–base view is a code-native collecting-duct wall section:
  an alpha intercalated cell, neighboring epithelial cells, interstitium and
  a distinct capillary containing red cells. H⁺ points into tubular fluid;
  bicarbonate points toward blood. The principal-cell ADH view remains separate.
  Chemical formulas and physical transport directions stay LTR in Arabic.
- Optional renal side quests now start collapsed **after** required checks.
  The full shared circulation journey and supplementary renal anatomy studies
  are available through Learn more disclosures. Their controls and content are
  retained. The optional respiratory breathing targets use the same disclosure
  pattern. Required skin renewal and muscular investigations remain required.
- The required skin renewal step no longer says “bonus.” The muscular arm target
  now correctly instructs full extension rather than a contracted sarcomere state.
  These are instruction-only corrections; no target or completion rule changed.
- Authored Arabic covers the new headings, process labels and optional-work
  labels. Student writing, teacher feedback, scientific values, answer strings
  and account identity are not translated or changed.

No scientific lesson facts, answer feedback, safety/context notes or objectives
were removed. Useful references were moved into disclosures, not discarded.
No 3D model, model controls, XP rule, badge, key, mission lock, preview rule,
teacher assignment, permission, RLS policy or synchronization implementation
is changed. Unrelated dashboards and login design remain unchanged; entry-file
changes only update cache references for the changed catalogue/route manifest.

## Files

| Files | Purpose |
| --- | --- |
| `mission-opening.js`, `mission-navigation.css` | Mission-scoped task actions, dynamic presentation, optional disclosures, readable responsive styles. |
| `excretory-art.js`, `excretory-art.css` | Anatomical transport figures, alpha-intercalated-cell section and HTML labels. |
| `excretory.js` | Anatomical sorting destinations, process placement and direct initial sorting guidance. |
| `integ-activities.js`, `muscle.js` | Correct the two misleading required-task instructions. |
| `locales/ar/common.js`, `locales/ar/skeletal.js`, `locales/ar/integumentary.js`, `locales/ar/muscle.js`, `locales/ar/respiratory.js`, `locales/ar/circulatory.js`, `locales/ar/excretory.js` | Explicit authored Arabic task and diagram labels. |
| `route-manifest.js`, `locale.js`, `sw.js`, `index.html`, `404.html`, `login.html`, `connection.html` | Matching route/catalogue cache versions and worker update. Mission-only assets remain deferred. |
| `_dev-tools/verify-mission-clarity.py`, `_dev-tools/run-critical-checks.js`, `package.json` | The all-mission browser audit, integrated in the normal release gate. |
| `_dev-tools/verify-mastery.py` | Open the optional renal disclosure through its real UI before checking existing first-retry feedback. All original feedback/privacy assertions remain. |
| `_dev-tools/README.md`, `locales/README.md` | Verification instructions and current authored catalogue count. |
| `docs/MISSION-ANATOMY-AUDIT.md`, `docs/MISSION-CLARITY-CHECKS.json`, this report, `docs/screenshots/mission-clarity/` | Before/after inventory, machine-readable verification and reviewable actual browser screenshots. |

## Verification and artifacts

Use the existing prerequisites in [_dev-tools/README.md](../_dev-tools/README.md).
The audit is available as `npm run test:mission-clarity`. The normal `npm test`
gate now runs twenty suites sequentially, including the new audit, the existing
feedback/evidence and reward tests, account/class/owner boundaries, teacher
previews, accessibility, pronunciation, Arabic coverage and rendered layout.
`npm run test:performance` retains the existing budgets and offline rules.

The initial focused run identified two new acid–base translation fragments whose
punctuation prevented exact matching; both captions were corrected. It also
caught a grid-placement problem in the skin questions, which was fixed by keeping
the action with the existing question text. The fixture setup was corrected to
include canonical prerequisite reward records and fresh account-bound contexts.
No product permission or progression rule was weakened for a test.

All 45 student missions are checked in English/Arabic at 390 and 1440 CSS pixels;
representative first missions also use 320 and 768px. Further checks cover Guided
mode, keyboard activation and visible focus, read-aloud requests and Escape,
dynamic question redraws/stations, optional work, incorrect-answer XP, actual
ADH/filter/exchange states and reduced motion. The narrow Arabic acid–base section
is captured at 320px. The full Arabic layout suite covers additional portal
routes, mission previews, dialogs, anatomy and responsive states.

Curated screenshots are in [docs/screenshots/mission-clarity](screenshots/mission-clarity/README.md).
The current complete release logs, JSON inventories and screenshots are under
`/workspace/scratch/inneru-mission-release-20261114/` in this execution workspace.
Earlier temporary logs were lost when the environment stopped, so all twenty
suites were rerun from the saved source. Final clean-release results are below.

Browser automation uses the supported local Chromium override with the existing
pinned Playwright environment. Acoustic Arabic pronunciation, physical devices,
manual screen-reader operation and independent scientific illustration review
were not performed. Automated geometry/coverage checks and screenshot inspection
do not constitute full WCAG conformance or an exhaustive review of every possible
conditional feedback branch. All required missions have suitable anatomy in the
completed inventory; these practical review limits remain explicit.

## Final release verification — 14 November 2026

All **20 critical suites passed** in one clean sequential run using isolated local fixtures.
The new mission audit passed **800 assertions across all 45 authorized student routes**.
Strict Arabic coverage found **0 untranslated occurrences across 188 views/states**.
The rendered Arabic audit passed **476 checks across 450 viewport/states**.
Performance, lazy routes and offline behavior passed **49 checks**, with existing budgets unchanged.

| Suite | Result | Seconds |
| --- | --- | --- |
| Consistent bilingual mission openings and role-safe activity navigation | PASS | 120 |
| Required mission anatomy, explicit tasks and optional-work hierarchy | PASS | 118 |
| Student experience, evidence priorities and accessible navigation | PASS | 49 |
| Shared design foundation, bilingual navigation and keyboard access | PASS | 22 |
| Arabic audio coverage, scientific names and voice fallback | PASS | 246 |
| Available pathways, honest mastery guidance and class-scoped attention | PASS | 18 |
| Optional muscular rotation and preserved elbow learning | PASS | 105 |
| Heart anatomy, named selection and preserved discovery rewards | PASS | 75 |
| Evidence-based mastery, feedback and isolation | PASS | 26 |
| Sign-in and signup | PASS | 44 |
| Student account access, connection recovery and confirmation | PASS | 24 |
| Student classes and teacher assignment | PASS | 78 |
| Student progress and dashboard | PASS | 21 |
| Mission locks, progression, previews and controls | PASS | 85 |
| Teacher roster, student work and feedback | PASS | 23 |
| Teacher workspace, isolation and navigation | PASS | 28 |
| Owner access, teacher approval and class assignments | PASS | 27 |
| Guided mode, Arabic presentation and controlled read-aloud | PASS | 56 |
| Strict Arabic coverage audit | PASS | 145 |
| Rendered Arabic layout and artwork separation | PASS | 381 |

Cold loading (compressed response bytes, local desktop fixture):

| Route | Requests | JavaScript | CSS | Images | 3D models |
| --- | ---: | ---: | ---: | ---: | ---: |
| login | 18 | 24550 | 11676 | 431251 | 0 |
| dashboard | 44 | 81789 | 35795 | 317563 | 0 |

JavaScript syntax, changed Python syntax, identical `index.html`/`404.html` entry points,
and `git diff --check` also passed. The checks retain the original progression,
reward, private-feedback, student isolation and assigned-class boundaries.
See [machine-readable results](MISSION-CLARITY-CHECKS.json).
