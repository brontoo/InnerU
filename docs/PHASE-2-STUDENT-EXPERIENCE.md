# Phase 2 — student experience

Implemented on `feat/phase-two-student-experience`, building on local Phase 1
checkpoint `c06d3b5` (itself based on main `4440adc`). Date: 4 November 2026.
Nothing was pushed, deployed or published. No production accounts, student data,
database schema or permissions were changed. Phase 3 models, teacher analytics
and adaptive-learning infrastructure are outside this change.

## Implemented design

- **Compact personal welcome:** actual stored avatar/nickname and verified school
  class, a short welcome and one prominent next action. The oversized explorer
  portrait is replaced by the existing account avatar, not by new artwork or
  invented student information.
- **Four concise indicators:** missions/finals completed out of **45**, System
  Keys out of six, current XP level with actual earned XP, and due review items.
  Regular missions and finals are named separately. The existing 150-XP level
  presentation is preserved, separately from the chosen challenge setting.
- **Continue Learning:** the authorized mission title, system illustration,
  existing authored objective, saved-activity status and next action are visible
  together. Checking, error, locked, completed and conflicting-version states
  have suitable alternatives rather than fabricated availability.
- **Six scientific cards:** consistent image placement, names, short descriptions,
  mission counts, progress, key status, a real system link and a separate
  expandable mission record. Three columns on desktop, two on tablet, one on
  narrow phones. Existing optimized images retain their anatomical orientation.
- **Learning priorities:** at most three explainable actions based on authorized
  availability, recorded assessment evidence and the existing review schedule.
  No probability, prediction or mastery percentage is invented.
- **Achievements:** the existing recently earned/upcoming badge providers,
  requirements, details and IDs are reused. Inspection still pays no XP.
- **History and preferences:** the discovery log, filters, earlier-progress
  accounting, XP breakdown, nickname/challenge/motion preferences, account/cloud
  controls and explicit reset/cancel behavior remain in dedicated lower sections.
  The cloud panel remains at the bottom, not reintroduced into the page header.

The visual foundation uses the Phase 1 navy/teal/ivory tokens, card/control
corners, quiet borders and shadows. Cards have restrained hover movement and
progress updates have short visual transitions. Browser/app reduced-motion
preferences disable those effects without delaying or disabling interaction.

## Reused providers and components

| Existing source | Phase 2 use |
| --- | --- |
| `InneruLearning.snapshot()` | The single source for XP, 39 regular missions, six finals, 45 completion opportunities, keys, achievements, history and system progress. |
| `InneruMissionAccess` | The existing candidate ordering/allowed-and-unfinished selection is exposed as read-only `recommend()`, reused by both existing links and the new view. No second access algorithm or stored lock state. |
| `mastery-catalog.js`, `mastery-model.js` | Existing objective-to-check mappings and conservative evidence rules. The dashboard does not infer mastery from completion, XP, badges or time. |
| `InneruEvidence.normalise()` | Only the current learner's saved, normalized responses are inspected. No answer or feedback record is rewritten. |
| `inneruReviewStats()` / `review-state.js` | Previously attempted, genuinely due items; fresh questions are not falsely counted as due. |
| `InneruAccount.markup()` and verified user | Real avatar/nickname/class; no sample production profile. |
| Existing badge card/dialog/history/preferences functions | Original requirements, once-only awards, focus return, filters, reset and history compatibility. |
| `--iu-*` / `.iu-card` | Shared design tokens and surfaces, without adding a framework or dependency. |

## Recommendation rules

1. Unresolved cloud versions take priority. The next action focuses the existing
   explicit cloud/device choice controls. It does not merge, choose or overwrite
   records automatically. Other personal priorities wait until that choice.
2. Normal lesson recommendations use the existing server-supplied mission
   catalog: `allowed && !completed`, following the existing progress-based world
   order. Completed, individually locked, teacher-locked and prerequisite-blocked
   missions are excluded by that provider.
3. If no unfinished mission is available, offer system exploration and retain the
   teacher-lock explanation. Connection failure is distinguished from a teacher
   lock; checking availability does not imply an available lesson.
4. An unresolved, matched automatically checked response can recommend its own
   evidence/lesson. The link restores the existing system/mission/evidence filter.
   Teacher-written feedback is not interpreted as an automatic grade.
5. Genuinely due review items can recommend spaced practice. A completed historical
   lesson with **no matched assessment evidence** can recommend adding evidence;
   it is not labeled incorrect or secure.
6. Without lesson evidence, offer useful general glossary navigation. With saved
   evidence and room for another useful action, link to that system's evidence.
   Do not duplicate the generic header destination or fill three slots artificially.
7. Six saved keys retain the existing whole-body final/practice alternatives.
   The capstone, daily discovery and detective work never enlarge the 45-item
   denominator. Missing historical XP is never invented from completion flags.

The API and database remain authoritative on lesson entry/save. Changing a card,
URL, label, preference or client role cannot grant teacher/owner permissions or
remove server mission prerequisites. No server, SQL, RLS or authentication
implementation was changed.

## Navigation and mission presentation

The existing student Review link is **moved** into primary navigation, giving six
visible student destinations on mobile without another copy in the sidebar.
Routes and hash IDs are unchanged. The shared breadcrumb reflects the actual
student destination/system. Teacher and owner navigation remains separate.

All body-system mission pages reuse their actual title blocks, objective mapping
and completion controls. The shared objective/navigation panel follows the title
instead of pushing it below a large extra banner. It provides dashboard return,
system/mission position, saved-completion status and jumps to activities/checks/
writing **only where those existing sections are present**. The explanatory
learning-evidence copy remains in a native disclosure.

Jumps scroll/focus existing content. They do not fill inputs, reveal answers,
invoke grading, pay rewards or mark steps complete. There is no artificial
six-step assessment sequence. Teacher previews keep their existing presentation
and read-only behavior. Mission controls, task requirements and next-mission
guards remain unchanged.

## Accessibility and bilingual behavior

- Native links, buttons, disclosures and dialog behavior; no clickable divs.
- System-detail buttons use `aria-expanded`/`aria-controls` with a labeled region,
  matching their new disclosure behavior rather than pretending to be tabs.
  Keyboard arrows/Home/End remain available; ordinary Tab reaches every action.
- Meaningful progress labels, final actual values, visible focus, flexible text,
  touch targets and unchanged dialog/reset focus return.
- New UI uses authored Modern Standard Arabic in the existing dashboard/mastery
  catalogues. The 20 catalogues now have **7,629 entries**, 79 more than Phase 1.
  This is catalogue coverage, not a claim of independent linguistic certification.
- Old thumbnail-tab caption rules were removed after rendered review showed them
  shrinking Arabic localization spans inside the new cards. Caption size is now
  tested, along with overflow and layout columns.
- Scientific images/physical model controls stay unmirrored. Only navigation
  arrows follow RTL. Class codes and numeric position indicators remain isolated.
- Guided mode and existing user-activated read-aloud remain available. No speech
  autoplays; instructions/choices and live unsaved preference inputs survive
  language/Guided changes. User writing, names and teacher feedback are not
  automatically translated.

## Loading, caching and budgets

The ordered `student` route group loads the dashboard/achievement interface and
the **existing** objective/evidence metadata when those views are first opened.
There is no unconditional dashboard autorender while a group is downloading.
The stable guarded dispatcher, file promises, navigation tickets and error/retry
states remain in charge. Returning to a view reuses loaded files.

No body-system activity engine, Three.js or model is loaded by the dashboard.
Mission-navigation CSS loads only with the mission help group. The worker still
installs just the essential shell (42 URLs); the dashboard module and metadata
are cached after use. API/session/learning responses remain excluded. Previously
visited public/anatomy routes and uncached/offline explanations retain coverage.
Protected routes still fail closed when live account verification is unavailable.

Measurements use the existing 1440×1000 cold, local fake-account fixture, gzip
response-body sizes, network-idle plus one second, external fonts blocked and
the worker disabled for transfer measurement. These are not production Web Vitals.

| Cold page | JS before → after | CSS before → after | Images before → after | Requests | Early models |
| --- | --- | --- | --- | --- | --- |
| Sign-in | 24,181 → 24,178 B | 11,674 → 11,674 B | 431,251 → 431,251 B | 18 → 18 | 0 → 0 |
| Initial signed-in dashboard | 73,217 → 80,984 B | 33,644 → 35,763 B | 828,887 → 712,327 B | 48 → 49 | 0 → 0 |

Initial dashboard images fall **14.1%**; combined measured JS/CSS/image bodies
fall **106,674 bytes**. The final 49-check loading/offline gate passed.
Current dashboard headroom: 936 B JS and 1,101 B CSS.
The small sign-in JS difference is version-string compression, not a login change.

Only dashboard budgets were adjusted: **72 → 80 KiB JS**, **34 → 36 KiB CSS**,
**48 → 50 requests**. Login and image limits are unchanged. The extra allowance
is for the actual redesigned UI plus reusable objective/evidence metadata and
the additional route requests, rather than loading activity engines. Removing
the large welcome portrait reduces initial image transfer. No duplicate
production artwork, new framework or runtime dependency was added.

## Actual screenshots

Before: Phase 1 checkpoint, `/tmp/inneru-phase2-before/`. After: the corrected
rendered implementation captured by the local student-experience check. Both
use real application views with explicitly fake local accounts and no production
student. These are browser screenshots, not generated mockups.

| Required view | Before | After |
| --- | --- | --- |
| Desktop dashboard, English, 1440px | [Before](screenshots/phase-2/before-dashboard-en-1440.png) | [After](screenshots/phase-2/after-dashboard-en-1440.png) |
| Mobile dashboard, English, 390px | [Before](screenshots/phase-2/before-dashboard-en-390.png) | [After](screenshots/phase-2/after-dashboard-en-390.png) |
| Six-system grid, English | [Before](screenshots/phase-2/before-six-system-grid-en.png) | [After](screenshots/phase-2/after-six-system-grid-en.png) |
| Continue Learning | [Before](screenshots/phase-2/before-continue-learning-en.png) | [After](screenshots/phase-2/after-continue-learning-en.png) |
| Mission navigation, English, 1440px | [Before](screenshots/phase-2/before-mission-navigation-en-1440.png) | [After](screenshots/phase-2/after-mission-navigation-en-1440.png) |
| Arabic dashboard, 390px | [Before](screenshots/phase-2/before-dashboard-ar-390.png) | [After](screenshots/phase-2/after-dashboard-ar-390.png) |
| Six-system grid, Arabic | [Before](screenshots/phase-2/before-six-system-grid-ar.png) | [After](screenshots/phase-2/after-six-system-grid-ar.png) |
| Mission navigation, Arabic, 390px | [Before](screenshots/phase-2/before-mission-navigation-ar-390.png) | [After](screenshots/phase-2/after-mission-navigation-ar-390.png) |

The complete focused capture sets additionally cover **320, 390, 768, 1024,
1440 and 1680px in both languages**. Actual visual review corrected small inherited
card captions, the avatar sizing conflict and mission-header ordering. Documentary
PNG files are excluded from deployment by the existing `docs/` ignore rule.

## Executed verification

Environment: Node 24.19.0, Python 3.12.14, local Chromium 154 and isolated
`postgres:17-alpine` fixtures. Local runs explicitly selected the installed browser;
tests default to Playwright's installed Chromium in CI/clean environments.

Baseline commands:

- `npm test -- dashboard usability`: both PASS (65 dashboard assertions and the
  existing authorized-pathway/usability coverage).
- `npm run test:performance`: 49 checks PASS.
- `verify-student-experience.py --capture-baseline`: 14 assertions PASS and actual
  before screenshots. This option intentionally omits new-view assertions.

After implementation:

| Suite | Final outcome | Assertions / scope |
| --- | --- | --- |
| Student experience | PASS | 105; final rerun also covers current screenshots. |
| Shared design foundation | PASS | 173 bilingual navigation, keyboard and responsive checks. |
| Arabic pronunciation/audio | PASS | Existing voice fallback, cancellation, privacy and instruction/structure coverage. |
| Authorized pathways/usability | PASS | Existing real-access, evidence and classroom-attention checks. |
| Removed muscular studio | PASS | Removal retained; independent elbow activity unchanged. |
| Evidence-based mastery | PASS on targeted rerun | 82; initial full-run failure and correction described below. |
| Sign-in/signup | PASS | Existing account-entry and recovery checks. |
| Student classes | PASS | All six classes, teacher assignment and existing role approval. |
| Student progress/dashboard | PASS | 65; final rerun after the last CSS adjustment also passed. |
| Mission access | PASS | Locks, prerequisites, controls, all previews and persistence. |
| Teacher dashboard | PASS | Assigned roster, saved work and feedback. |
| Teacher workspace | PASS | Distinct navigation and class-isolated views. |
| Owner staffing | PASS | Owner authorization, approvals, assignment boundaries and audit. |
| Learning support/accessibility | PASS | Guided, keyboard, read-aloud, Arabic, reduced motion and state preservation. |
| Strict Arabic coverage | PASS | Zero untranslated occurrences across 187 views/states. |
| Rendered Arabic layout | PASS | 450 rendered viewport/states; 475 assertions. |

All **16 distinct release suites passed across the full run and corrected targeted
reruns**. The initial `npm test` exited 1 because of the mastery failure below;
there was no second complete 16-suite invocation. Targeted commands were
`npm test -- mastery student-experience`, `npm test -- student-experience dashboard`
and `npm run test:student-experience` for final screenshot framing. No known
release assertion remains failing.

`npm run test:performance` passed all **49** budget, deep-link, refresh, retry,
route-race, reuse and offline/cache checks on the final source. `node --check`
passed for all **124 tracked JavaScript files**; changed Python scripts compile,
`git diff --check` passed, and the two HTML entry points remain byte-identical.
The protected API/auth/SQL/learning model and body-system activity source files
have no Phase 2 changes. Tests use loopback fake accounts and isolated databases;
production credentials/data are excluded by the existing runners.

The initial full run caught a duplicated generic evidence destination and failed
the mastery harness's strict single-link selection. The product was corrected:
empty-data priorities now lead to the glossary; evidence actions are contextual.
The mastery suite and student-experience suite were then rerun successfully.
The initial failure remains in `/tmp/inneru-phase2-release/mastery/check.log`;
it is not represented as a passing run.

During development, two old dashboard assertions were adapted from tab selection
to expanded mission-detail controls; all original progress/reward assertions
remain. New test setup also waits for native disclosure updates and actual cloud
reloads when loading explicit historical fixtures. These do not relax permission,
assessment or reward checks.

Main logs/artifacts: `/tmp/inneru-phase2-release/`,
`/tmp/inneru-phase2-mastery-regression/`, `/tmp/inneru-phase2-final-review/` and
`/tmp/inneru-phase2-verified-loading/`, `/tmp/inneru-phase2-final-check/` and
`/tmp/inneru-phase2-final-captures/`. Full console logs use the same path plus
`.log`. Artifacts are local run outputs, not published student information.

## Files changed

42 Phase 2 files, relative to the Phase 1 checkpoint. This includes the report
and 16 before/after PNG artifacts; no production assets were added.

- [404.html](../404.html)
- [README.md](../README.md)
- [_dev-tools/README.md](../_dev-tools/README.md)
- [_dev-tools/check-performance.py](../_dev-tools/check-performance.py)
- [_dev-tools/performance-budget.json](../_dev-tools/performance-budget.json)
- [_dev-tools/run-critical-checks.js](../_dev-tools/run-critical-checks.js)
- [_dev-tools/verify-dashboard.py](../_dev-tools/verify-dashboard.py)
- [_dev-tools/verify-student-experience.py](../_dev-tools/verify-student-experience.py)
- [account-session.js](../account-session.js)
- [docs/PHASE-2-STUDENT-EXPERIENCE.md](PHASE-2-STUDENT-EXPERIENCE.md)
- [docs/screenshots/phase-2/after-continue-learning-en.png](screenshots/phase-2/after-continue-learning-en.png)
- [docs/screenshots/phase-2/after-dashboard-ar-390.png](screenshots/phase-2/after-dashboard-ar-390.png)
- [docs/screenshots/phase-2/after-dashboard-en-1440.png](screenshots/phase-2/after-dashboard-en-1440.png)
- [docs/screenshots/phase-2/after-dashboard-en-390.png](screenshots/phase-2/after-dashboard-en-390.png)
- [docs/screenshots/phase-2/after-mission-navigation-ar-390.png](screenshots/phase-2/after-mission-navigation-ar-390.png)
- [docs/screenshots/phase-2/after-mission-navigation-en-1440.png](screenshots/phase-2/after-mission-navigation-en-1440.png)
- [docs/screenshots/phase-2/after-six-system-grid-ar.png](screenshots/phase-2/after-six-system-grid-ar.png)
- [docs/screenshots/phase-2/after-six-system-grid-en.png](screenshots/phase-2/after-six-system-grid-en.png)
- [docs/screenshots/phase-2/before-continue-learning-en.png](screenshots/phase-2/before-continue-learning-en.png)
- [docs/screenshots/phase-2/before-dashboard-ar-390.png](screenshots/phase-2/before-dashboard-ar-390.png)
- [docs/screenshots/phase-2/before-dashboard-en-1440.png](screenshots/phase-2/before-dashboard-en-1440.png)
- [docs/screenshots/phase-2/before-dashboard-en-390.png](screenshots/phase-2/before-dashboard-en-390.png)
- [docs/screenshots/phase-2/before-mission-navigation-ar-390.png](screenshots/phase-2/before-mission-navigation-ar-390.png)
- [docs/screenshots/phase-2/before-mission-navigation-en-1440.png](screenshots/phase-2/before-mission-navigation-en-1440.png)
- [docs/screenshots/phase-2/before-six-system-grid-ar.png](screenshots/phase-2/before-six-system-grid-ar.png)
- [docs/screenshots/phase-2/before-six-system-grid-en.png](screenshots/phase-2/before-six-system-grid-en.png)
- [index.html](../index.html)
- [locale.js](../locale.js)
- [locales/README.md](../locales/README.md)
- [locales/ar/dashboard.js](../locales/ar/dashboard.js)
- [locales/ar/mastery.js](../locales/ar/mastery.js)
- [login.html](../login.html)
- [mastery.js](../mastery.js)
- [mission-access.js](../mission-access.js)
- [mission-navigation.css](../mission-navigation.css)
- [package.json](../package.json)
- [retry-feedback.js](../retry-feedback.js)
- [route-loader.js](../route-loader.js)
- [route-manifest.js](../route-manifest.js)
- [student-dashboard.css](../student-dashboard.css)
- [student-dashboard.js](../student-dashboard.js)
- [sw.js](../sw.js)

## Setup, limitations and Phase 3 recommendations

No migration, production-data operation, added dependency or new service setup.
Use the existing test-only prerequisites in `_dev-tools/README.md`. The new check
is included in `npm test` and available as `npm run test:student-experience`.
The hosted workflow was not triggered because this branch was not published.

Only local Chromium was exercised. Safari, Firefox, actual classroom GPUs,
screen-reader devices and native Arabic acoustic playback were not certified.
External fonts are blocked in tests, so screenshots exercise installed fallbacks.
Coverage/geometry checks do not replace a linguistic review or complete WCAG
conformance audit, nor do they traverse every possible conditional lesson state.

Phase 3 should begin with the scientific concerns in the existing visual audit,
qualified anatomy review and real-device label/material/performance testing.
Preserve the intentionally removed muscular full-body studio; its independent
elbow activity remains. Do not combine model work with teacher analytics or a new
adaptive-learning backend. Continue to reuse the established progress/evidence
and authorization providers.
