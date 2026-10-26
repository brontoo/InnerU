# InnerU — Explore What's Inside

Interactive, gamified human-body learning for **Grade 10 Science** at **Um Al-Emarat School**.
The learning portal uses plain HTML / CSS / JavaScript with no build step or framework.
Email/password accounts use the Vercel Node function in `api/auth.js` and Supabase Auth.
Connect the account service using [_dev-tools/ACCOUNT-SETUP.md](_dev-tools/ACCOUNT-SETUP.md).
The illustrated entry includes twelve animated avatar choices and redirects authenticated
accounts to their verified Student or Teacher Dashboard. Without the external configuration, account creation is unavailable.

The muscular full-body studio has been removed in both languages. Its separate
elbow activity and all lessons remain available. See the
[removal regression notes](_dev-tools/MUSCULAR-STUDIO.md).

The muscular foundation also includes a detailed **animated elbow lab**: real arm
bones, two biceps heads, three triceps heads, fixed-length tendon routes, and three
open discovery challenges. Bend or straighten with a slider, pause the movement,
and examine the attachments. Its discovery stars do not alter saved lesson XP.
See [_dev-tools/ARM-LAB.md](_dev-tools/ARM-LAB.md).

Six worlds (one per body system) + a final mission that ties them together, a
spaced-practice review system, classroom tools for the teacher, and an offline copy
for weak wifi.

---

## What a student does

| Where | What it is |
|---|---|
| `#home` | the human systems map: six worlds, each with missions, checks and a System Key |
| `#world`, `#integumentary`, `#muscle`, `#respiratory`, `#circulatory`, `#excretory` | the six worlds: 6–7 missions each, an interactive lab, three checks per mission, and a final challenge that earns the Key |
| `#mission/N` | a skeletal-system mission (World 02; its content lives in `content-skeletal.js`) |
| `#detective`, `#connect`, `#badges`, `#daily` | Body Detective cases, System Connections, achievements, the daily question |
| `#final` | **Keep the body alive** — the capstone: one scenario, six applied decisions across all six systems, a written synthesis, and a printable certificate (unlocked with 6/6 System Keys) |
| `#review` | **spaced practice**: 54 questions from all six systems, Leitner boxes (1 · 3 · 7 · 16 days), missed items return first |
| `#glossary` | every key term in the six systems, one sentence each, with the Arabic term beside it |
| `#teacher` | **classroom tools** (see below) |

Learning progress stays available offline in **`localStorage`** under `bodyquest-v1`.
After [installing the Supabase schema](supabase/README.md), signed-in accounts
sync learning, answers, fixed task credits and achievements across devices with
explicit conflict handling. Approved teachers can review enrolled students’ work. Account email, password and avatar metadata
are handled by the connected auth service; passwords and session tokens are not stored
in application localStorage.

**Tap an underlined term** for a one-sentence definition with the Arabic word beside it.
Use **Listen / Stop** to read supported instructions and feedback, or pronounce
selected anatomy structure names. Speech starts only after activation and depends
on available browser voices. Glossary definitions remain readable on screen.

## Excretory expedition

World 06 follows the supplied textbook lesson (pp. 40–44) through six missions:
waste relay, kidney mapping, selective filtration, reabsorption, homeostasis and
kidney-care case files. A mission combines a field briefing, an interactive lab,
three checks and optional side quests. Earn fragments and a final Balance Key.

Use **Preview all activities**, or **Preview freely** on any mission card, to
open every activity and the final challenge without completing prerequisites.
Preview also exposes answer explanations and keeps student XP, progress and
keys unchanged. Return to expedition to earn real progress.

The **Anatomy Studio** rebuilds the excretory model with four tabs: urinary
organs, kidney cutaway, nephron and animated urine flow. Drag or use left/right
arrows to rotate; scroll or use +/− to zoom. Select structures to isolate them and
read their functions. **Focus structure** frames the selected organ or region.
The anatomy-informed surfaces include renal vessels connected to the aorta and
vena cava, posterior bladder entry, papillae, minor/major calyces and a magnified
nephron. Each view is enlarged independently; these are teaching reconstructions.
An illustration and structure explanations remain available without WebGL.

Run `python3 _dev-tools/verify-excretory.py` for the current excretory browser
checks. See `_dev-tools/EXCRETORY-CONTENT.md` for lesson alignment and scientific
clarifications.

## Teacher workspace

Approved teachers have four primary destinations:

| Area | Content |
|---|---|
| Explore Worlds (`#home`) | Shared body-system home and read-only anatomy exploration |
| Dashboard (`#teacher`) | Overview, Students, Missions, Feedback and Analytics views |
| Mission Preview (`#teacher?view=preview`) | Existing 45 lesson/final previews; progress and locks stay unchanged |
| Achievements Board (`#teacher?view=board`) | Class-filtered Discovery League with XP, mission and badge rankings, student passports and earned badge details |

The dashboard and board read the teacher’s assigned cloud roster. They never use
sample students, browser imports or another teacher’s classes as a fallback. Tied
scores share a rank, and zero scores are unranked. Celebrations add no XP.
Student login, class assignments and saved learning are unchanged. Mission
controls continue to require [Supabase migration 007](supabase/migrations/007_mission_access.sql).

Local verification: `_dev-tools/verify-teacher-workspace.py` exercises real
PostgreSQL permissions with local Auth fixtures, shared Home, dashboard data,
class filters, rankings, celebrations and desktop/mobile layouts.
`_dev-tools/verify-mission-access.py` covers mission locks, progression and all
45 read-only teacher previews. No production account is created by these tests.

## Daily workflow (two double-clicks)

| Click | When | What it does |
|---|---|---|
| `start-work.cmd` | when you sit down | pulls from GitHub, starts the local server, opens the site |
| `push-updates.cmd` | when you finish | commits and pushes → Vercel redeploys |

Always work through `start-work.cmd` (or `dev.cmd`): the 3D labs use ES modules and
`fetch()` for `.glb` models, which browsers block on `file://`.

---

## Architecture

### The shell

`index.html` and its byte-identical fallback `404.html` load only the shared
shell, account/role checks, progress services, student dashboard and accessibility
styles. There is no build step and scripts remain ordered classic globals.

* `learning-catalog.js` contains shared mission names and achievement metadata.
  `app.js` contains shared state, layout and dispatch primitives. Activity bodies
  moved unchanged to `skeletal-core.js`, `home-core.js`, `connections-core.js` and
  `daily-core.js`; shared exhibit markup lives in `exhibit-core.js`.
* `route-runtime.js` installs a stable renderer dispatcher **before** the account,
  accessibility and mission-access wrappers. Deferred world wrappers register with
  `InneruRouteModules.registerRenderer()` inside those permanent guards; they do
  not replace the global secure `route()` or autorender during download.
* `route-manifest.js` lists ordered script/style groups. `route-loader.js` loads
  the requested group once, waits for its styles, then invokes the guarded route.
  Concurrent requests share promises; navigation tickets discard stale renders.
  Failed downloads and a 30-second download deadline produce an accessible retry
  state. A timed-out in-flight script is retained so retry cannot execute it twice.
* Styles retain their original cascade positions through `data-style-order`, even
  when systems are visited in a different order. Existing hash paths and preview
  query parameters are unchanged. A cold deep link loads its dependencies first.
* `world-navigation.js` holds the thin home/reference extensions in their original
  order. Home needs the system links and progress summaries, not every lesson.
  Teacher dashboard, review, detective, connections and daily interfaces each load
  on their own route. `review-state.js` keeps dashboard scheduling statistics
  available without downloading the review questions or interface.
* Body-system groups load when that system opens. Respiratory and integumentary
  activity engines, and circulatory mission interactions, load on mission routes.
  Shared respiratory layout styles also load with the skin world, which reuses
  those components; world styles include their overview/preview-bar rules.
  Card illustrations are requested by the cards that use them; lesson illustrations
  are requested by their rendered activity, not by the dashboard or worker install.
* `anatomy-loader.js` imports `body-atlas.js` only for an atlas host, and
  `heart-explorer.js` only for a heart host. Existing muscular, skin and renal
  importers, viewport model loading, disposal, fallbacks, materials and attribution
  remain in place. Three.js is never fetched by login or the student dashboard.

### The extension pattern

Keep cross-cutting guards outside deferred renderers. A deferred world captures
`InneruRouteModules.renderer`, defines its wrapper and registers it once:

```js
const previous = InneruRouteModules.renderer;
InneruRouteModules.registerRenderer(function () {
  if (/* this world's route */) { /* existing renderer */ }
  else previous();
});
```

Core account, preview, glossary and accessibility wrappers continue to wrap the
stable dispatcher. The shared speech controller handles user-activated structure
pronunciation and supported instruction/feedback reading; nothing autoplays. Do not add eager world imports to the shell or
have a deferred module call `route()` while it is loading.

### State

```
bodyquest-v1
├── name, xp, level, motion, rewards[], weak[]      (skeletal world lives here)
├── integumentary / respiratory / excretory  { done[], steps{}, mastery, weak[] }
├── circ   { done[], steps[], mastery, boss }
├── muscle { done[], tasks{}, weak[], xp }
├── capstone { done, date, stations{}, response, rubric[] }
├── review   { items{ box, lastSeen, due }, answers, correct, sessions }
└── habit    { last, streak, best, days{}, dismissed }
```

Six **System Keys** are counted by one function (`keysEarned()` in `app.js`), used by
the home card, the dashboard and the capstone gate.

### Content

* `content-skeletal.js` — World 02 assessment items and clinical cases; shared mission names are in `learning-catalog.js` and reference links in `world-navigation.js`
* every other world keeps its lessons, labs and checks at the top of its own file
* `review.js` holds the 54-item review pool
* `capstone.js` holds the final-mission scenario and rubric

## Owner teacher and class management

Verified accounts explicitly designated with the existing `admin` role have a
**School assignments** screen at `#owner`. Owners can review and confirm changes
to the six class assignments and explicitly approve verified teacher requests.
Assignment does not approve a teacher. Changes are audited; students keep their
class, work and mission settings. API and database checks enforce owner access.
Apply migration 008 and, if needed, designate the initial owner once as described
in [OWNER-MANAGEMENT.md](_dev-tools/OWNER-MANAGEMENT.md). No new privileged key is
required. The focused local check is `npm run test:owner`, also included in `npm test`.

## Learning support and Arabic

The sign-in screen and portal top bar offer **Guided mode** and a language
selector. Guided mode defaults off; it shows activity instructions one at a time
without resetting answers or changing mission credit. **Listen / Stop** reads
instructions or feedback only after activation, using an available browser voice.
English and Arabic are supported when those voices are installed. All text stays
available when speech is unavailable. Existing anatomy pronunciation and reduced
motion remain available. Preferences are device-local and separate from scored
progress; no database migration is required.

Audio stays beside the relevant instruction, feedback or selected anatomical
structure. The page-wide reading dropdown has been removed. Arabic synthesis
selects an available Arabic voice or lets the browser resolve the Arabic language
when its voice list is incomplete. Native synthesis failures explain how to enable
an Arabic text-to-speech voice in device settings. Windows Chrome may need an
Arabic Windows speech component and a browser restart; the portal cannot install
that voice. Scientific pronunciation cues add no assessment hints. See
[the Arabic audio notes](_dev-tools/ARABIC-AUDIO.md).

Arabic uses RTL layout and 20 authored, route-specific message catalogues (7,550
entries). They cover navigation, sign-in/recovery, student and teacher dashboards,
all six systems' lessons and activities, feedback, anatomy explanations, recall,
connections, detective cases and information pages. Original scientific terms
remain available with Arabic definitions in the glossary. User names, submitted
writing, account fields and teacher-authored notes remain original.

The strict `npm run test:arabic-coverage` audit is included in `npm test`. It
checks mission entry views, selected anatomy, instruction sequences and populated
teacher records; unknown English is reported rather than disguised in an Arabic
placeholder. Passing it is not a full linguistic or WCAG certification. See
[the implementation and verification notes](_dev-tools/LEARNING-SUPPORT.md) and
[the locale authoring guide](locales/README.md).

## Offline and performance

`sw.js` installs only the essential HTML, shared JS/CSS, manifest and small brand
icons (39 shell URLs). It does **not** precache body-system modules, Three.js,
models, avatar sheets, mission images or Home artwork. Same-origin route code and
assets enter `inneru-visited-v1` on first use. Code uses network-first with cached
fallback. Cache-write failure does not block a successful online response. Large
assets use the cached copy immediately and revalidate in the background. Previously visited
public Home/anatomy routes work after an offline refresh. An uncached route shows
how to save it by opening it online; missing JS/CSS receives a failed response,
never the app HTML. Old InnerU shell caches are retired without deleting other
applications' caches, and the visited-content cache survives shell updates.

Account sessions, role checks, student mission authorization and learning APIs
are never cached. Protected missions and teacher data still require live
verification, as before; offline caching does not bypass classroom locks or login.
Already saved local progress remains on the device until it can sync. `?nosw=1`
skips worker registration for debugging.

### Measured cold-load baseline and result

Local, repeatable Chromium measurements on 2026-10-19, 1440 × 1000, fresh browser
contexts, no scrolling, through network-idle plus one second. The fixture serves
**gzip** JS/CSS; values are response-body bytes, not header bytes. Images are
actual transferred image bytes, including near-viewport images requested on the
initial page. The worker is disabled for this comparison so install/reload timing
cannot double-count shell requests. A separate check verifies worker installation
and offline refresh. The dashboard uses a signed-in, empty local student fixture;
cloud storage is unconfigured. All requests stay on loopback; external fonts are
blocked. These are payload measurements, not production Vercel timings or Web Vitals.

Baseline: main `471fbf3` with the pre-existing local release-check checkpoint
`64f3b47`; no portal payload changes in that checkpoint.

| Cold page / response bodies | Before | After |
|---|---:|---:|
| Login JavaScript, gzip | 12,913 B | 12,913 B |
| Login CSS, gzip | 9,997 B | 9,993 B |
| Login images | 428,514 B | 428,514 B |
| Login requests | 13 | 13 |
| Student dashboard JavaScript, gzip | 360,436 B | 62,244 B |
| Student dashboard CSS, gzip | 143,920 B | 29,635 B |
| Student dashboard initial images | 2,759,201 B | 2,113,950 B |
| Student dashboard requests | 108 | 44 |
| Models before opening a viewer (both pages) | 0 | 0 |

Dashboard JS is about **83% smaller**, CSS **79% smaller**, and initial images
**23% smaller**. The explorer avatar sheet changed from PNG (2,171,529 B) to
**pixel-identical lossless WebP** (1,526,278 B), replacing the original asset.
Login artwork was already WebP. GLBs and anatomical images are unchanged: the
existing GLTFLoader has no Draco/meshopt decoder configured, so compressing mesh
geometry would require a separate loader/appearance validation change. No model
variants, duplicate production artwork, remeshing or new runtime dependencies
were introduced.

The optional learning-support layer adds local preferences, language selection,
Guided instructions and browser speech controls. Its English-default cold
measurement is 24,269 B gzip JS / 11,525 B gzip CSS / 18 requests on sign-in, and
72,127 B gzip JS / 31,167 B gzip CSS / 48 requests on the first student dashboard.
Images and early model requests are unchanged. Arabic catalogues load only when
Arabic is selected. Teacher answer cards request the matching curriculum catalogue
for reference prompts, without loading that system’s lesson scripts or models. The
login JS/request limits below include these new controls; dashboard limits stay
unchanged. These are local gzip measurements, not production CDN measurements.

### Repeatable loading check and budget

Use the test-only Python/Playwright prerequisites in
[_dev-tools/README.md](_dev-tools/README.md), then run:

```sh
npm run test:performance
# Measurements alone, with an optional JSON output path:
python _dev-tools/measure-loading.py
```

The same performance command runs in GitHub Actions after `npm test`. It fails
if any budget in [_dev-tools/performance-budget.json](_dev-tools/performance-budget.json)
is exceeded, or if initial login/dashboard fetches deferred route scripts/styles,
Three.js, a viewer module or a 3D model. Budgets deliberately allow modest growth
above the measured result while remaining far below the baseline:

| Page | Gzip JS | Gzip CSS | Initial image bytes | Requests |
|---|---:|---:|---:|---:|
| Login | 24 KiB | 12 KiB | 440 KiB | 18 |
| First signed-in dashboard | **72 KiB** | **34 KiB** | **2,200 KiB** | **48** |

The check also opens and refreshes all six system routes with their mission-card
artwork, exercises other direct routes, checks module reuse, failed-load retry and
navigation races, inspects the
worker shell, refreshes a visited 3D anatomy route offline, and tests an uncached
route's offline message. Existing critical checks cover locked student missions,
all 45 teacher previews, cold preview links, permissions and saved progress.
Screenshots, JSON measurements and fixture logs go to `INNERU_TEST_ARTIFACT_DIR`
(or a temporary directory). CI uploads them only on failure. No production
credentials, real accounts, Supabase or deployed site are used.

## Deploy

The repository root **is** the site; there is nothing to build. Vercel deploys it on
every push (`.vercelignore` keeps the development tools and docs out of the deployment,
`vercel.json` sets cache headers). Netlify, Cloudflare Pages and GitHub Pages work too —
routing is hash-based, so no rewrite rules are needed.

## Development tools

`_dev-tools/` holds the headless verification harnesses used while building the site.
They serve this folder read-only on a local port and drive the real pages in Chrome:
run `python _dev-tools/verify-stage6.py`, open the printed URL, and read the PASS/FAIL
report. They are excluded from the deployment.

## Provenance

The source was recovered from the published site after ChatGPT Sites became unreachable —
see `SOURCE-BACKUP.md` and `_export-manifest.json`. Since then the project has been
restructured: the NaN fixes, the Cloudflare snippet removal, the recovered 3D assets,
the six interactive labs, the capstone, review, teacher tools and the habit layer.
The manifest describes the **original export**, not the current tree.

## Evidence-based mastery

Open **Mastery** from Student Dashboard, or the **Mastery** tab inside Teacher
Dashboard. Teachers can filter their authorized roster by class, student, body
system, mission, objective and evidence status. Results paginate at 45 objectives
so a full teacher roster does not create an unbounded page. These are private account views;
there is no public ranking or cross-class analytics endpoint.

The authored [objective catalogue](mastery-catalog.js) groups existing assessment
checks into one composite objective per mission/final (39 missions and six finals).
It is an interpretation of those existing checks, not a new curriculum or a grade
for every sub-concept. Explicit assessment IDs bind evidence to each objective;
XP, badges, keys, completion, time spent and ungraded self-checks are never used.
Named, recorded lab checks also appear as supporting assessment evidence. An
unresolved error in one prevents Secure; correct first recorded lab responses
can contribute to the two-distinct-check minimum, but never replace required
core-check coverage. Route-bound ungraded submissions are shown for review only.

- **Not enough evidence:** no matching boolean assessment result is recorded.
  Ungraded submitted work and teacher comments can still be inspected.
- **Developing:** at least one matched result exists, but checks are missing,
  a latest result is incorrect, or independent evidence is limited.
- **Secure in recorded checks:** all checks in a complete declared set are currently
  correct, at least two distinct checks were correct on their first recorded
  response, and no matched graded check has an unresolved wrong response. The
  alternative existing circulatory final has its own complete set; partial sets
  cannot be combined to manufacture coverage.

“Secure” describes recorded checks only. It does **not** establish lasting mastery,
unaided recall or transfer to unfamiliar situations. Corrected responses remain
visible, but repeating the same question never becomes another independent check.
Only the latest answer and up to four earlier attempts exist in the current data;
when the first attempt has been discarded, its result is treated as unknown.
The existing response store retains at most 600 responses. Older completion-only
records are explicitly insufficient. Written work, a
teacher's review flag and comments are not inferred grades. Comments identify
whether they refer to the current submission or an earlier version.

A first incorrect recorded check gives a supportive, mission-related review hint;
original scientific explanations are available after a retry (the muscular
activities retain their existing explicit **Show me** action). Cloud record restoration refreshes the view while retaining its filters, open
evidence and keyboard focus; existing version-conflict choices remain explicit.
The student evidence
view likewise hides a first incorrect response's reference explanation until a
retry or correct answer. Existing answers, reward amounts, once-only XP,
completion requirements, locks and read-only teacher previews are unchanged.

No database migration or additional configuration is required beyond the existing
schema. The student-only `GET /api/learning?action=my-feedback` derives the student
ID from the verified cookie session and reads `teacher_feedback` using that user's
JWT and existing SELECT RLS policy. It cannot accept another student's ID. Teacher
mastery reuses the existing approved, assigned-class `classroom` RPC, without a
new teacher data endpoint. No service key, new grant or RLS change is introduced.

Mastery code, its objective catalogue and stylesheet are deferred. Mission routes
load only the shared catalogue/retry helper alongside their existing modules;
initial login/dashboard do not fetch mastery or body-system code. The service
worker caches optional files after use, while API responses remain uncached.
Previously loaded views remain usable in an already verified offline session;
a fresh private-page reload still requires the existing online identity check.
Teacher comments require a connection and show an explicit fallback when unavailable.
Mastery text is authored in Modern Standard Arabic in
[locales/ar/mastery.js](locales/ar/mastery.js), with existing system catalogues for
assessment prompts. Native disclosure controls, labeled filters, visible focus,
RTL reflow, Guided instructions and user-activated read-aloud are retained.

`npm test` includes `_dev-tools/verify-mastery.py`: pure evidence rules, real wrong
answers/retries in all six systems, unchanged rewards, assigned-class and student
isolation, real teacher comments, keyboard disclosures, Guided mode and mobile RTL.
The strict Arabic audit also covers student and teacher mastery and evidence.
`npm run test:performance` checks the new direct route under the unchanged initial
loading budgets. Tests use isolated local fixtures only.

### Mastery change scope

The implementation changes these files; no migrations, image/model assets, new
dependencies or deployment configuration are changed.

- `404.html`
- `README.md`
- `_dev-tools/README.md`
- `_dev-tools/account-test-server.js`
- `_dev-tools/check-performance.py`
- `_dev-tools/run-critical-checks.js`
- `_dev-tools/verify-arabic-coverage.py`
- `_dev-tools/verify-mastery.py`
- `api/learning.js`
- `circulatory.js`
- `excretory.js`
- `index.html`
- `integumentary.js`
- `learning-support.js`
- `locale.js`
- `locales/ar/dashboard.js`
- `locales/ar/mastery.js`
- `locales/ar/teacher.js`
- `login.html`
- `mastery-catalog.js`
- `mastery-model.js`
- `mastery.css`
- `mastery.js`
- `muscle.js`
- `respiratory.js`
- `retry-feedback.js`
- `route-loader.js`
- `route-manifest.js`
- `skeletal-course.js`
- `student-dashboard.js`
- `sw.js`
- `teacher-dashboard.js`

### Mastery verification results

Local verification on 22 October 2026 used the existing isolated PostgreSQL 17
fixture, Playwright and the supported Chromium executable override (Chromium 154).
No production credentials, accounts, outbound emails or production services were
used. `npm test` passed all ten suites. The expanded mastery suite was rerun after
the final presentation changes and passed 82 checks, including actual ungraded
investigation work, sorting references and a fresh-device cloud-version restore.

| Verification | Result |
|---|---|
| Accounts / signup | PASS — 46 checks |
| Student classes / teacher assignment | PASS — 118 checks |
| Student dashboard / progress | PASS — 65 checks |
| Mission access / locks / previews | PASS — 113 checks |
| Teacher responses / feedback | PASS — 74 checks |
| Teacher workspace / class isolation | PASS — 89 checks |
| Owner / approval / assignments | PASS — 94 checks |
| Guided mode / accessibility / speech | PASS — 108 checks |
| Strict Arabic UI coverage | PASS — zero gaps across 203 views/states |
| Mastery / evidence / privacy / retry | PASS — 82 focused checks |
| Loading / lazy routes / offline caching | PASS — 47 checks |
| JavaScript syntax | PASS — all 124 tracked and new `.js` files |

The existing loading limits were not relaxed:

| Initial view | Gzip JS | Gzip CSS | Critical image bytes | Requests | 3D model bytes |
|---|---:|---:|---:|---:|---:|
| Sign-in | 24,365 | 11,525 | 428,514 | 18 | 0 |
| Student dashboard | 72,474 | 31,167 | 2,113,950 | 48 | 0 |

No mastery/system modules or models are requested on the initial dashboard.
Scientific sorting/sequence references keep their original arrow direction, with
isolated translated terms in the Arabic interface. Personal responses and teacher
comments remain verbatim. The coverage audit measures portal-owned interface text,
not translation of personal content.

These checks cover keyboard operation, focus recovery, status announcements,
contrast, 44px targets and RTL reflow down to 320px, alongside existing reduced
motion checks. They are not a formal WCAG certification or physical-device audit.
Speech uses a deterministic browser-synthesis fixture; real voice availability and
pronunciation depend on the learner's device. Secure remains a description of
recorded checks, without a claim of validated long-term retention.

## Arabic layout verification

`npm run test:arabic-layout` checks rendered Arabic layouts, illustration/caption
separation, RTL controls, popovers and narrow-screen reflow using local test accounts.
It is included in `npm test`; no production credentials are used. See
[_dev-tools/ARABIC-LAYOUT.md](_dev-tools/ARABIC-LAYOUT.md) for scope, review artifacts
and known limits, and [_dev-tools/README.md](_dev-tools/README.md) for prerequisites.

## Usability update — 25 October 2026

Dashboard recommendations use the account’s authorized mission catalogue. If all
unfinished missions are locked, the primary action offers Explore Worlds with an
explanation. Failed access checks never imply that a mission is available.
Teacher Overview separates unresolved incorrect objective checks, objectives
needing evidence and unreviewed submissions, scoped to the selected assigned class.
The linked evidence/feedback filters preserve that scope.

Corrected answers remain recorded even when independent evidence is insufficient.
Mastery now explains when a different later assessment is needed; repeating the
same checks cannot meet the first-response criterion. No assessment, grading rule,
reward, mission gate or database schema changed. Existing objectives are displayed
consistently on authorized lesson/final pages.

Teacher tabs use six desktop columns; narrow headers keep language and Guided
controls visible. Important dashboard labels are larger. Arabic count phrases use
“من” and isolated numeric fractions retain LTR order. Reset wording identifies its
existing device/account effect before confirmation and cancellation returns focus.

The six original explorer portraits are now individual, pixel-preserving WebP
crops. The compact guide/friend sheet remains unchanged. Four scientific PNG plates
are replaced by lossless WebP at the same dimensions. All visible decoded pixels
and alpha match the original images; redundant originals are removed. See
[_dev-tools/usability-image-proof.json](_dev-tools/usability-image-proof.json).

Cold local Chromium/gzip measurements, same fixture and 1440 × 1000 viewport:

| Response bodies | Before (`ac70682`) | After |
|---|---:|---:|
| Login JS | 24,400 B | 24,485 B |
| Login CSS | 11,596 B | 11,850 B |
| Login images / requests / early models | 428,514 B / 18 / 0 | unchanged |
| Dashboard JS | 72,632 B | 73,360 B |
| Dashboard CSS | 31,595 B | 32,063 B |
| Dashboard images | 2,113,950 B | 826,150 B |
| Dashboard requests / early models | 48 / 0 | unchanged |

Initial dashboard image transfer falls approximately **61%**. Existing performance
limits are unchanged. These are response-body measurements on local fixtures,
not production Web Vitals. API responses still remain outside offline caches.

`npm test` now includes 13 sequential suites, including focused usability and
muscular-studio removal/preservation guards. Actions use Node 24-compatible action
releases while the application checks continue on Node 22. No new dependency,
configuration, migration or production service is required. Owners can separately
configure GitHub to require **Critical checks** before merges to `main`; this work
does not alter repository rules or deploy. See the full
[implementation and verification notes](_dev-tools/USABILITY.md).
