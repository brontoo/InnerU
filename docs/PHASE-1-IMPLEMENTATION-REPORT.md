# Phase 1 implementation and verification

Date: 5 November 2026. Branch: `feat/phase-one-design-foundation`, from fetched
`main` at `4440adc`. Phase 1 only; no push, deployment, model rebuild, framework,
database migration, production account or production record operation.

## What changed

- Established documented palette, spacing, radius, typography, focus, target,
  width and elevation tokens in the existing `style.css`. Added opt-in primitives
  for page/header, cards, controls, tabs/filters, progress, badges, tables,
  dialogs/tooltips, loading/empty states and proportional illustrations.
- Applied a deliberately small subset to the shared shell: consistent navigation
  spacing/targets, one RTL-aware selected marker, wrapping mobile primary links,
  flexible header rows and larger footer link targets. Existing dashboard and
  lesson layouts/artwork retain their own designs.
- Added student current-route semantics to the existing `account-session.js`
  decorator. Secondary destinations and system routes select their actual
  navigation owner. Teacher/owner reference pages no longer falsely highlight
  Dashboard. Routing and permission decisions are unchanged.
- Updated only the affected shell asset versions in both HTML entry points and
  the worker, with a new shell cache version. Added no precache assets or new
  initial request. Route loading and offline cache behavior remain intact.
- Added a local-only browser check to the existing sequential release runner and
  an `npm run test:design-foundation` shortcut. Added these reports and source
  screenshot pairs. Excluded `docs/` from deployment uploads, matching existing
  documentation/tool exclusions; Vercel project settings were not changed.
- Corrected the optional elbow harness's obsolete anonymous-mission cleanup
  assumption and switched it to the existing portable local-fixture helpers.
  No model or production authentication behavior was changed to satisfy a test.

## Actual rendered review and screenshots

The focused shell review covers sign-in, student dashboard, teacher dashboard
and owner assignments in **English and Arabic**, each at **1440×1000,
768×1000, 390×1000 and 320×1000**: 32 before states and 32 after states.
The images are real local Chromium captures using fake account fixtures.
Before/after figures are viewport screenshots; the broader Arabic layout gate
also captures full-page mission, illustration and viewer states.

Representative source screenshots, included for review:

| Screen | Before | After |
| --- | --- | --- |
| Student, English, 390px | [Before](screenshots/phase-1/before-student-en-390.png) | [After](screenshots/phase-1/after-student-en-390.png) |
| Student, Arabic, 320px | [Before](screenshots/phase-1/before-student-ar-320.png) | [After](screenshots/phase-1/after-student-ar-320.png) |
| Teacher, English, 1440px | [Before](screenshots/phase-1/before-teacher-en-1440.png) | [After](screenshots/phase-1/after-teacher-en-1440.png) |
| Teacher, Arabic, 768px | [Before](screenshots/phase-1/before-teacher-ar-768.png) | [After](screenshots/phase-1/after-teacher-ar-768.png) |

The after screenshot deliberately leaves keyboard focus visible on the current
link. Focus outline and current-page marker serve different purposes.

The broader layout gate exercised first-mission submitted feedback and Guided
steps in all six systems; the system worlds, selected anatomy modes/structures
and all mission/final previews; Home/gallery, dashboard, badges, glossary,
review/session, daily, detective cases, connections, capstone and information
routes; account/glossary/badge dialogs, teacher views and individual work,
feedback, owner assignments and confirmation dialogs. Typical widths were
320/768/1440px, with selected screens additionally checked at 390, 1024, 1060,
1100, 1280 and 1680px. Selected English switches and short-height dialogs were
also exercised. **475 assertions passed across 450 viewport/state captures**;
this is not every possible route/state/width combination.

Geometry confirms a concrete improvement: English student navigation at 390px
previously needed **768px** of horizontal content in a **357px** viewport; after,
it fits **358px within 358px**. Arabic at 320px previously needed **582px within
287px**; after, it fits **287px within 287px**. Student current-page annotations
changed from zero to one. Existing teacher current-page annotations remain one.

Complete generated captures/geometry are in `/tmp/inneru-phase1-before/` and
`/tmp/inneru-phase1-after/` (final focused rerun:
`/tmp/inneru-phase1-after-final/`); they are temporary run artifacts, not production
assets. The full rendered-layout gate also produced **450 captures with zero reported
issue states**; its complete state/geometry inventory is
`/tmp/inneru-phase1-release/arabic-layout/layout-report.json`. The new foundation
gate reproduces after captures in its printed artifact directory.
It checks six additional secondary destinations, role navigation, target sizes,
focus, overflow and unchanged in-memory learning state.

## Test environment and executed results

Node 24.19.0, Python 3.12.14, Chromium 154.0.8037.57, local Docker PostgreSQL
17 Alpine. Locally `INNERU_TEST_CHROMIUM_EXECUTABLE=/usr/bin/chromium` selects
this installed browser; the tests default to Playwright's installed Chromium on
a clean machine and in CI. Existing prerequisite instructions remain in
`_dev-tools/README.md`; no production dependencies were added.

Before implementation:

- `npm test -- usability teacher-workspace`: **PASS**, 20s and 20s.
  Log: `/tmp/inneru-phase1-baseline.log`.
- Focused capture baseline: **39 checks PASS**, 32 images; it intentionally does
  not require new navigation conventions. The capture helper was adjusted during
  development to wait for normal cloud initialization before comparing state.
- `npm run test:performance`: **49 checks PASS**.

After implementation:

- Focused browser review: **173 checks PASS**, 32 after captures plus secondary
  student destinations and teacher/owner reference-page selection. This final
  targeted rerun includes the information-page fix made during the full gate.
- `npm run test:performance`: **49 checks PASS** including direct routes,
  refresh, reuse, load errors/retry, route races, lazy boundaries, shell-only
  install, cached anatomy/offline refresh, uncached guidance and API exclusion.
- `node --check`: **124 tracked JavaScript files PASS**.
- `cmp index.html 404.html` and `git diff --check`: **PASS**.
- Full sequential release: **all 15 suites PASS, exit 0**. Additional heart, skin
  and corrected elbow checks passed; exact results and the initial legacy-test
  failure are documented below.

### Full sequential release gate

Command: `INNERU_TEST_CHROMIUM_EXECUTABLE=/usr/bin/chromium
INNERU_TEST_ARTIFACT_DIR=/tmp/inneru-phase1-release npm test`.
Uses randomly named, labelled isolated SQL fixtures; no production service
configuration is passed to the test processes. Logs/screenshots and summary JSON
are under `/tmp/inneru-phase1-release/`; full console log is
`/tmp/inneru-phase1-release.log`.

| Check | Result | Seconds |
| --- | --- | --- |
| Shared design foundation, bilingual navigation and keyboard access | PASS | 28 |
| Arabic audio coverage, scientific names and voice fallback | PASS | 326 |
| Available pathways, honest mastery guidance and class-scoped attention | PASS | 21 |
| Removed muscular studio and preserved elbow learning | PASS | 14 |
| Evidence-based mastery, feedback and isolation | PASS | 35 |
| Sign-in and signup | PASS | 46 |
| Student classes and teacher assignment | PASS | 117 |
| Student progress and dashboard | PASS | 36 |
| Mission locks, progression, previews and controls | PASS | 60 |
| Teacher roster, student work and feedback | PASS | 39 |
| Teacher workspace, isolation and navigation | PASS | 60 |
| Owner access, teacher approval and class assignments | PASS | 48 |
| Guided mode, Arabic presentation and controlled read-aloud | PASS | 78 |
| Strict Arabic coverage audit | PASS | 329 |
| Rendered Arabic layout and artwork separation | PASS | 415 |

Full `npm test` exited **0**. The first foundation run in that gate had 171
assertions; the final targeted rerun passed 173 after adding the two teacher/owner
information-page cases. That rerun covers the last navigation-only adjustment;
no application edits followed it. The Arabic coverage gate reports **zero gaps
across 187 views/states**.

### Additional scientific-viewer checks

Existing `verify-heart-studio.py` and `verify-skin.py` use the local fake-service
fixture. The initial optional `verify-arm-lab.py` run passed its anatomy and
activity checks, then timed out waiting for a protected mission without a login.
This was a stale test assumption: cleanup now returns to public Home. The harness
also now uses the same portable local-only helpers and configurable artifacts.
The original failure log is retained, and the corrected rerun is reported below.
Separate logs/screenshots are under
`/tmp/inneru-phase1-viewers/`. These exercise existing geometry, controls,
fallbacks and learning preservation; no model source was edited.

| Existing check | Result | Evidence |
| --- | --- | --- |
| Heart studio | PASS — 168 assertions | `/tmp/inneru-phase1-viewers/heart-studio/check.log` |
| Skin studio | PASS — 213 assertions | `/tmp/inneru-phase1-viewers/skin/check.log` |
| Elbow lab (corrected harness) | PASS — 57 assertions | `/tmp/inneru-phase1-arm-corrected.log`; screenshots in `/tmp/inneru-phase1-viewers/arm-lab-corrected/` |

The initial elbow failure remains in
`/tmp/inneru-phase1-viewers/arm-lab/check.log`. It is not counted as a passing run.
All 57 corrected checks were actually rerun, including cleanup, mobile,
reduced-motion, no-WebGL and missing-model fallbacks.

## Performance: measured compressed response bodies

Same existing 1440×1000 cold loopback fixture, network-idle plus one-second
settle, worker disabled for payload measurement; external resources are blocked.
These numbers use gzip Content-Length, not a production field LCP measurement.

| Entry | JS before → after | CSS before → after | Critical images before → after | Requests | Models |
| --- | --- | --- | --- | --- | --- |
| Login | 24,181 → 24,181 B | 11,674 → 11,674 B | 431,251 → 431,251 B | 18 → 18 | 0 → 0 |
| Initial signed-in dashboard | 73,069 → 73,217 B | 32,096 → 33,644 B | 828,887 → 828,887 B | 48 → 48 | 0 → 0 |

Existing limits remain unchanged: dashboard JS **73,728 B**, CSS **34,816 B**,
critical images **2,252,800 B**, **48 requests**; login JS **24,576 B**, CSS
**12,288 B**, images **450,560 B**, **18 requests**. No system-specific module,
viewer, Three.js or model is fetched by the initial dashboard. Dashboard JS
headroom is now **511 B**; avoid further eager feature code without measurement.
Measurement JSON/logs: `/tmp/inneru-phase1-performance-before/` and
`/tmp/inneru-phase1-performance-verified/` (final source).

## Files changed

Application/presentation:

- `style.css`: tokens, opt-in primitives and focused shared-shell rules.
- `account-session.js`: student current-navigation and teacher information-page selection only.
- `index.html`, `404.html`: changed stylesheet and decorator version URLs.
- `sw.js`: matching URLs and shell cache version; cache policy unchanged.

Verification/documentation:

- `_dev-tools/verify-design-foundation.py`: new isolated browser/geometry captures.
- `_dev-tools/verify-arm-lab.py`: portable local helpers and authorized public cleanup destination.
- `_dev-tools/run-critical-checks.js`: include the focused check sequentially.
- `package.json`: focused command; existing launchers/dependencies unchanged.
- `_dev-tools/README.md`: prerequisite-linked test scope/instructions.
- `README.md`: links to Phase 1 deliverables.
- `.vercelignore`: exclude the new audit/docs/screenshots from public uploads.
- `docs/INNERU-ENHANCEMENT-AUDIT.md`.
- `docs/INNERU-DESIGN-SYSTEM.md`.
- `docs/SCIENTIFIC-VISUAL-AUDIT.md`.
- `docs/PHASE-1-IMPLEMENTATION-REPORT.md` (this report).
- `docs/screenshots/phase-1/before-student-en-390.png`.
- `docs/screenshots/phase-1/after-student-en-390.png`.
- `docs/screenshots/phase-1/before-student-ar-320.png`.
- `docs/screenshots/phase-1/after-student-ar-320.png`.
- `docs/screenshots/phase-1/before-teacher-en-1440.png`.
- `docs/screenshots/phase-1/after-teacher-en-1440.png`.
- `docs/screenshots/phase-1/before-teacher-ar-768.png`.
- `docs/screenshots/phase-1/after-teacher-ar-768.png`.

## Setup, security and remaining limitations

No new application setup or migration. Existing Supabase configuration and
teacher approval/class assignment policies stay in force. Only navigation
decoration was changed in the identity file; hiding/selection does not grant
access. `api/`, `lib/`, `supabase/`, learning/progress/evidence/assessment files,
scientific assets, locale catalogues and mission definitions are unchanged.
Tests use fake loopback accounts and local databases; school teacher emails are
fixture matching strings only and no email is sent. No production accounts,
student records, permissions or Vercel project settings were changed.

Remaining review: native Arabic audio on classroom OS voices, actual hardware
GPU performance, specialist scientific sign-off, screen-reader assistive-device
review and every possible conditional/camera/zoom state. Firefox and Safari were
not run. Blocked external fonts
mean local captures use available fallback fonts; loaded Google-font appearance
still needs an online device check. A passing coverage test is not a linguistic
review or WCAG certification. The next phase should address these items and
adopt primitives incrementally, not rebuild models based on visual preference.

GitHub administrators must explicitly require the **Critical checks** status
from **InnerU release checks** on `main` if failing checks should block merges.
No branch-protection setting was changed, and no branch was pushed or deployed.
