# Usability and evidence guidance — 25 October 2026

Branch: `improve/learning-usability`. Baseline: current main `ac70682`.
No database migration, API change, production data operation, new dependency,
repository setting change or deployment is part of this work.

## Student pathways and reset

`mission-access.js` decorates the dashboard's primary action, learning-plan action
and selected-system resume from the account's existing server-authorized mission
catalogue. Accessible unfinished work in the previously recommended system comes
first; other systems follow the existing order. An unavailable system or an empty
catalogue offers Explore Worlds with checking, locked or reconnect guidance.
Individual locks and all prerequisite decisions remain server-controlled. Changing
system tabs reuses the loaded catalogue; progress and normal access refreshes
update recommendations. No availability is inferred from XP or forged local flags.

Reset is now labelled “Reset my learning progress”. The existing device/cloud
scope and removal of feedback attached to deleted answers are explained before
confirmation. The confirmation initially focuses Keep my progress; cancellation
restores focus to Reset and changes no learning. Reset implementation and reward
rules remain unchanged.

## Mastery and classroom follow-up

Mastery criteria and evidence mappings are unchanged. When a complete latest check
set is correct but independent first-response evidence is insufficient, guidance
acknowledges corrections and explains that a later, different assessment is needed.
It does not promise that repeating the same checks can satisfy the criterion.
No new assessment, automatic grade, teacher override or extra XP was added. Some
objectives have no additional mapped assessment; those remain Developing until
valid independent evidence exists. Designing follow-up assessments is a separate
curriculum decision for the school.

Authorized missions/finals display their existing catalogue objective and an
explanation of the distinction between learning evidence, completion and mastery.
The display-only module loads with the existing mission evidence-help group;
locked denial pages do not display lesson objectives. Nothing is recorded merely
by reading this guidance or changing presentation preferences.

Teacher Overview has three separate attention categories: objectives with
unresolved matched incorrect checks, objectives without graded evidence, and
unreviewed ungraded submissions. It uses only the existing authorized classroom
response. Missing evidence is not labelled low understanding. The class picker
scopes every category; individual and class-wide links apply the existing
Mastery/Feedback filters. Five learners per category are listed, with a link to
matching records, so large rosters do not create an unbounded summary. Names and
original submitted writing remain verbatim. No endpoint or RLS policy changed.

## Presentation and language

Six teacher dashboard tabs share a desktop row and wrap in three columns at
smaller widths. Essential dashboard labels are larger. Mobile language and Guided
controls stay visible in a compact row with meaningful native labels; identity,
account actions and glossary controls remain available. No additional disclosure
or hidden preference state was necessary.

Authored Arabic count phrases use “من” across the six worlds and dashboards.
Standalone numeric fractions are bidi-isolated without changing their values;
SVG/model coordinates, formulas and interactive answer values are unaffected.
Display dates share UAE time and stable English source strings so the existing
authored date catalogue can translate and restore a live page without resetting
an activity. Arabic catalogue keys and English assessment answers are preserved.

About now describes all six systems. Privacy describes assigned-class cloud
access instead of retired classroom imports. It accurately distinguishes clearing
browser data from deleting the cloud account; no deletion API or policy is invented.
README now describes the removed full-body studio and current explicit read-aloud.
Historical support reports are labelled as snapshots, not current release results.

## Assets and offline behavior

Six 512 × 512 explorer portraits replace the original 1536 × 1024 sheet; only the
chosen portrait is requested on the dashboard. All twelve identities remain
available, and the already compact second guide/friend sheet is retained. Original
crop coordinates and artwork are preserved. Four scientific plates are replaced
by lossless WebP at identical dimensions. The old originals are removed; source
GLBs used by the independent elbow activity remain unchanged.

[usability-image-proof.json](usability-image-proof.json) records source commit,
original crop, dimensions, replacement bytes and decoded RGBA hashes. Comparison
against original files at `ac70682` verified every visible pixel and alpha;
invisible RGB at zero alpha is normalized. This one-time asset preparation used
Pillow; running the application and release checks adds no Pillow dependency.
The replacement files reduce total deployed asset bytes by 3,299,561 bytes.

The service-worker shell version is bumped; changed resources/catalogues have new
query versions. Existing runtime visited-content caching, route retries, offline
messages, API cache exclusion and authorization remain intact. Old optional full-
body muscular assets are still absent. No Three.js or model is fetched on login
or the initial dashboard.

## Measurements

Cold local Chromium, 1440 × 1000, gzip body sizes, same existing local fixtures:

| Page/resource | Before | After |
|---|---:|---:|
| Login JS | 24,400 B | 24,485 B |
| Login CSS | 11,596 B | 11,850 B |
| Login images | 428,514 B | 428,514 B |
| Login requests / early models | 18 / 0 | 18 / 0 |
| Dashboard JS | 72,632 B | 73,360 B |
| Dashboard CSS | 31,595 B | 32,063 B |
| Dashboard images | 2,113,950 B | 826,150 B |
| Dashboard requests / early models | 48 / 0 | 48 / 0 |

Dashboard image transfer is approximately 61% smaller. Existing budgets are
unchanged, including 24 KiB login JS and 72 KiB dashboard JS. Loading checks also
exercise deep links, reuse, retry/races, visited anatomy offline refresh and API
cache exclusion. These are local payload measurements, not production timings.

## Release and setup

`npm test` runs 13 suites sequentially. New `verify-usability.py` covers actual
availability, all-locked and failed-check guidance, keyboard reset cancellation,
class-scoped attention, query filters, unchanged mastery criteria, Arabic counts,
objectives, visible mobile preferences and six-tab desktop layout. The existing
muscular removal/preservation guard is now included in the default suite.

Actions use checkout v5, setup-node v5, setup-python v6 and upload-artifact v5
(Node 24-compatible action runtimes). Application checks continue with Node 22
and the existing Python/Playwright/PostgreSQL fixture prerequisites. No secret is
required. Failure-only artifact upload and least-privilege read permissions remain.
An owner must separately configure GitHub to require **Critical checks** on `main`
if failed checks must block merges. No branch-protection setting was changed.

## Review artifacts and limitations

Baseline read-only review/screenshots: `/tmp/inneru-repo-review-targeted-final/`,
`/tmp/inneru-repo-review-render/` and `/tmp/inneru-repo-review-performance/`.
Current release logs, screenshots and summaries: `/tmp/inneru-usability-release/`
and `/tmp/inneru-usability-release.log`. Loading outputs:
`/tmp/inneru-usability-loading-node22/` (Node 22), with the Node 24
comparison in `/tmp/inneru-usability-performance-verified/`.

Local Chromium and local system fonts are used; external services are blocked.
Real iOS/Safari/Android hardware, native screen-reader speech and production email
are not exercised. The Arabic coverage and geometry checks cover their recorded
states; they do not certify every possible response, medical statement or camera
angle. No student data or production credentials are used. Failed development
iterations are retained separately and are not counted as passing checks.

Fresh verification results and a complete file list follow below.

## Fresh verification results

| Suite | Result | Seconds |
|---|---|---:|
| Available pathways, honest mastery guidance and class-scoped attention | PASS | 22 |
| Removed muscular studio and preserved elbow learning | PASS | 12 |
| Evidence-based mastery, feedback and isolation | PASS | 30 |
| Sign-in and signup | PASS | 39 |
| Student classes and teacher assignment | PASS | 71 |
| Student progress and dashboard | PASS | 18 |
| Mission locks, progression, previews and controls | PASS | 36 |
| Teacher roster, student work and feedback | PASS | 22 |
| Teacher workspace, isolation and navigation | PASS | 27 |
| Owner access, teacher approval and class assignments | PASS | 25 |
| Guided mode, Arabic presentation and controlled read-aloud | PASS | 55 |
| Strict Arabic coverage audit | PASS | 162 |
| Rendered Arabic layout and artwork separation | PASS | 429 |

Additional final checks:

- Node 22.23.4: focused usability **40 assertions** and dashboard **65 assertions** PASS, after the final display-date helper relocation and native-option fraction guard.
- Node 22 loading/performance/offline **47 checks** PASS; Node 24 comparison also PASS. No performance limit changed.
- Full Arabic layout **475 assertions**, **450 viewport/states**, zero geometry issues or browser exceptions; widths 320, 390, 768, 1024, 1060, 1100, 1280, 1440 and 1680 CSS pixels.
- Strict Arabic coverage: **187 views/states**, zero untranslated occurrences. New teacher attention and objective guidance also have focused authored-coverage checks.
- `node --check`: all **122 tracked JavaScript files** PASS on Node 22 and Node 24.
- Changed Python harnesses compile, workflow YAML parses, `git diff --check` passes, and index/404 entry shells remain identical.
- All 10 replacement images retain every visible decoded pixel, alpha and dimension. Source image ICC profiles are absent in both originals and replacements.
- Protected paths (API, library authorization, SQL, Vercel config), assessment definitions, muscular learning/arm modules and reward/progression computation are unchanged. The progress read model adds only a display-date helper.

Before/after screenshot review: `/tmp/inneru-usability-review/index.html`.
The full run used Node 24.19.0; the additional focused and loading runs verify the
Node 22 runtime selected by CI. Chromium is the available system browser, selected
through the documented test override; CI retains Playwright's installed browser.
No production services, student records or email delivery were used.
No app/database setup is required. School-designed independent follow-up
assessments and making the workflow a required merge check remain separate owner
and curriculum decisions. Existing visited content is retained in the runtime
cache; changed/versioned content needs an online visit before that new version
can be used offline.

## Complete changed-file inventory

64 paths, including explicit asset replacements/removals:

| Change | File | Purpose |
|---|---|---|
| M | `.github/workflows/critical-checks.yml` | Node 24-compatible action runtimes; release events, permissions and failure artifacts retained. |
| M | `404.html` | Updated shell resource query versions; remains identical to index.html. |
| M | `README.md` | Current feature descriptions, payload comparison, prerequisites and release safeguards. |
| M | `_dev-tools/DISCOVERY-ENTRY.md` | Correct avatar asset paths after lossless sprite splitting. |
| M | `_dev-tools/LEARNING-SUPPORT.md` | Mark historical implementation counts as historical and link current notes. |
| M | `_dev-tools/README.md` | Document all 13 default release suites and unchanged portable prerequisites. |
| A | `_dev-tools/USABILITY.md` | Implementation decisions, limitations, setup, evidence, checks and full file inventory. |
| M | `_dev-tools/run-critical-checks.js` | Include usability and muscular removal/preservation guards sequentially. |
| A | `_dev-tools/usability-image-proof.json` | Reviewable original crop, dimensions, visible RGBA hashes and replacement byte counts. |
| M | `_dev-tools/verify-accounts.py` | Exercise offline avatar caching with a current individual portrait URL. |
| A | `_dev-tools/verify-usability.py` | Focused local-only browser regression for the new guidance, triage, filters, RTL and keyboard behavior. |
| M | `account.css` | Render per-explorer portraits while retaining the existing guide/friend sheet. |
| M | `account.js` | Use selected portrait files; public avatar IDs and account logic preserved. |
| M | `app.js` | Update Privacy copy to describe current account/class data handling. |
| A | `assets/avatars/atlas.webp` | Lossless portrait crop or scientific plate replacement; visible pixels and dimensions verified. |
| A | `assets/avatars/ember.webp` | Lossless portrait crop or scientific plate replacement; visible pixels and dimensions verified. |
| D | `assets/avatars/explorers.webp` | Removed redundant original; replaced by pixel-preserving WebP assets. |
| A | `assets/avatars/luna.webp` | Lossless portrait crop or scientific plate replacement; visible pixels and dimensions verified. |
| A | `assets/avatars/neo.webp` | Lossless portrait crop or scientific plate replacement; visible pixels and dimensions verified. |
| A | `assets/avatars/nova.webp` | Lossless portrait crop or scientific plate replacement; visible pixels and dimensions verified. |
| A | `assets/avatars/pip.webp` | Lossless portrait crop or scientific plate replacement; visible pixels and dimensions verified. |
| D | `assets/excretory-kidney-cutaway.png` | Removed redundant original; replaced by pixel-preserving WebP assets. |
| A | `assets/excretory-kidney-cutaway.webp` | Lossless portrait crop or scientific plate replacement; visible pixels and dimensions verified. |
| D | `assets/excretory-nephron-plate.png` | Removed redundant original; replaced by pixel-preserving WebP assets. |
| A | `assets/excretory-nephron-plate.webp` | Lossless portrait crop or scientific plate replacement; visible pixels and dimensions verified. |
| D | `assets/excretory-science-plate.png` | Removed redundant original; replaced by pixel-preserving WebP assets. |
| A | `assets/excretory-science-plate.webp` | Lossless portrait crop or scientific plate replacement; visible pixels and dimensions verified. |
| D | `assets/integumentary-skin-cutaway.png` | Removed redundant original; replaced by pixel-preserving WebP assets. |
| A | `assets/integumentary-skin-cutaway.webp` | Lossless portrait crop or scientific plate replacement; visible pixels and dimensions verified. |
| M | `excretory-explorer.js` | Only scientific plate asset extensions change from PNG to WebP. |
| M | `excretory.js` | Only scientific plate asset extensions change from PNG to WebP. |
| M | `index.html` | Updated shell resource query versions; ordered script guards unchanged. |
| M | `integumentary.js` | Only skin plate asset extensions change from PNG to WebP. |
| M | `learning-progress.js` | Add a shared read-only UAE display-date helper; progression/reward computation is byte-for-byte unchanged. |
| M | `learning-support.css` | Compact mobile preference row with visible controls and retained native accessible labels. |
| M | `learning-support.js` | Wrap the visible language caption so narrow layouts can compact it without losing the select label. |
| M | `locale.js` | Isolate standalone numeric fractions; preserve native option markup/values; version current catalogues. |
| M | `locales/README.md` | Update the current catalogue entry count. |
| M | `locales/ar/circulatory.js` | Authored Arabic count phrasing and/or messages for current guidance, reset, attention and public information; assessment values unchanged. |
| M | `locales/ar/common.js` | Authored Arabic count phrasing and/or messages for current guidance, reset, attention and public information; assessment values unchanged. |
| M | `locales/ar/dashboard.js` | Authored Arabic count phrasing and/or messages for current guidance, reset, attention and public information; assessment values unchanged. |
| M | `locales/ar/excretory.js` | Authored Arabic count phrasing and/or messages for current guidance, reset, attention and public information; assessment values unchanged. |
| M | `locales/ar/home.js` | Authored Arabic count phrasing and/or messages for current guidance, reset, attention and public information; assessment values unchanged. |
| M | `locales/ar/information.js` | Authored Arabic count phrasing and/or messages for current guidance, reset, attention and public information; assessment values unchanged. |
| M | `locales/ar/integumentary.js` | Authored Arabic count phrasing and/or messages for current guidance, reset, attention and public information; assessment values unchanged. |
| M | `locales/ar/mastery.js` | Authored Arabic count phrasing and/or messages for current guidance, reset, attention and public information; assessment values unchanged. |
| M | `locales/ar/muscle.js` | Authored Arabic count phrasing and/or messages for current guidance, reset, attention and public information; assessment values unchanged. |
| M | `locales/ar/respiratory.js` | Authored Arabic count phrasing and/or messages for current guidance, reset, attention and public information; assessment values unchanged. |
| M | `locales/ar/skeletal.js` | Authored Arabic count phrasing and/or messages for current guidance, reset, attention and public information; assessment values unchanged. |
| M | `locales/ar/teacher.js` | Authored Arabic count phrasing and/or messages for current guidance, reset, attention and public information; assessment values unchanged. |
| M | `login.html` | Updated shared account, locale and support resource versions. |
| M | `mastery-model.js` | Explain independent-evidence follow-up and expose the existing unresolved-error decision; status criteria unchanged. |
| M | `mastery.js` | Render model guidance and apply explicit attention-link filters while preserving normal pagination and focus. |
| M | `mission-access.css` | Style the display-only mission objective note within the existing palette. |
| M | `mission-access.js` | Derive dashboard recommendations from the existing authorized catalogue, with honest locked/error guidance. |
| M | `retry-feedback.js` | Display existing mission objectives and evidence expectations on authorized lesson/final routes. |
| M | `review-state.js` | Use the shared UAE display-date helper; scheduling intervals and learning records unchanged. |
| M | `route-manifest.js` | Load mastery read-model dependencies for teacher triage and version modified deferred resources. |
| M | `student-dashboard.css` | Larger essential labels and isolated numeric progress values. |
| M | `student-dashboard.js` | Recommendation hooks, accurate reset scope/cancel focus and shared display dates. |
| M | `sw.js` | New shell version and resource versions; runtime caching/authorization/API exclusion algorithms unchanged. |
| M | `teacher-dashboard.js` | Assigned-class attention categories, scoped evidence/feedback links and shared display dates. |
| M | `teacher-workspace.css` | Six-column desktop tabs, responsive attention cards and readable metric labels. |
| M | `world-navigation.js` | Replace obsolete three-world rollout announcement with accurate six-system About copy. |
