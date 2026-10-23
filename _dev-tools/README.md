# Automatic critical release checks

`npm test` runs the same eleven critical checks as GitHub Actions, **sequentially**:

| Script | Release coverage |
|---|---|
| `verify-mastery.py` | Evidence-only objective statuses, six-system retry help, own feedback, class isolation and RTL/Guided reflow |
| `verify-accounts.py` | Signup, sign-in, avatars, recovery, cookies and account isolation |
| `verify-student-classes.py` | All six class choices, pending teacher linking and class permissions |
| `verify-dashboard.py` | Real mission work, once-only XP, saved progress, badges and responsive student dashboard |
| `verify-mission-access.py` | Persistent locks, sequence gates, teacher controls and all 45 read-only previews |
| `verify-teacher-dashboard.py` | Assigned roster, actual student answers, versioned feedback, exports and individual records |
| `verify-teacher-workspace.py` | Four teacher destinations, shared home, rankings and teacher-class isolation |
| `verify-owner.py` | Owner authorization, audited assignments, teacher approval and class boundaries |
| `verify-learning-support.py` | Guided mode, language/RTL, controlled speech, actual rewards, locks and mobile reflow |
| `verify-arabic-coverage.py` | All mission previews, system pages, selected anatomy, instruction steps and populated teacher views |
| `verify-arabic-layout.py` | Rendered Arabic screens, clipped text, illustration collisions, responsive RTL and dialogs |

The dashboard scripts use signed-in local fixtures, not the retired anonymous
teacher/import interface. Existing progress-code formats are checked as data
compatibility without restoring one account over another. The other historical
harnesses below are optional; they are not part of this release gate.

## Prerequisites and commands

Use Node.js 22+, Python 3.12+, and a running Docker engine with Linux-container
support (Docker Desktop on Windows/macOS). No npm runtime or test packages are
needed; Node uses its standard library. Browser dependencies are **test-only** in
`_dev-tools/requirements-test.txt` and should be installed in a virtual environment.
From the checkout root on Linux/macOS:

```sh
python3 -m venv .venv
. .venv/bin/activate
python -m pip install -r _dev-tools/requirements-test.txt
python -m playwright install chromium
# Linux/CI: python -m playwright install --with-deps chromium
npm test
```

Windows PowerShell (leave the existing `.cmd`/PowerShell launchers in place):

```powershell
python -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install -r _dev-tools/requirements-test.txt
python -m playwright install chromium
npm test
```

The runner uses `python3` on Unix or `python` on Windows. `PYTHON` can point to a
specific environment's Python executable if activation is unavailable. It uses
Playwright's installed Chromium by default; it never assumes a system browser
path. An explicit `INNERU_TEST_CHROMIUM_EXECUTABLE` override is available only for
restricted developer environments that cannot download Playwright's browser.
CI does not set that override. `PLAYWRIGHT_BROWSERS_PATH` is also supported by
Playwright for choosing a writable browser cache.

`npm run dev:local` serves the same static portal on loopback port 8080, without
PowerShell or a framework. `PORT` selects another port. This has the same static
scope as `serve.ps1`; it does not simulate production accounts. The verification
scripts start their own loopback Auth/API server for account and database checks.
The existing `npm run dev`, `npm start` and Windows launchers are unchanged.

## Guided mode, read-aloud and Arabic

For owner staffing setup, permissions and the focused `npm run test:owner` command,
see [OWNER-MANAGEMENT.md](OWNER-MANAGEMENT.md).

`npm run test:accessibility` runs the new support regression alone, using its own
isolated PostgreSQL container. `npm test` includes it alongside the other release suites.
`npm run test:arabic-coverage` runs the strict catalogue audit alone. It is also
included in `npm test`, writes the outstanding strings for each exercised view,
and fails if any remain. Passing the audit establishes coverage of those states,
not every possible dynamic response or linguistic quality.
See [LEARNING-SUPPORT.md](LEARNING-SUPPORT.md) for behaviour, WCAG review, test
scope and limitations, and [locales/README.md](../locales/README.md) for translation
authoring. The earlier structure-only audio policy is superseded by explicit
instruction/feedback reading; there is still no autoplay.

## Loading performance and lazy routes

After installing the same test-only prerequisites above, run
`npm run test:performance`. Docker is not needed for this additional check: it
uses fake loopback Auth/API fixtures and isolated browser storage. It measures
cold login/dashboard gzip payloads, enforces `performance-budget.json`, checks
direct routes and refresh, module reuse/retry, stale navigation, essential-only
worker install, visited anatomy offline refresh and uncached offline guidance.
API responses must never appear in the worker caches. See the measured baseline
and limits in [README.md](../README.md#offline-and-performance).
The offline fixture disconnects both the page and the worker's network fetch,
while exercising the real worker cache/fallback code. It first verifies that the
chosen missing route was never cached and restores network fetch before retry.

`python _dev-tools/measure-loading.py [output.json]` records measurements without
checking limits. Both commands honor the existing artifact and browser overrides.
Do not add production credentials or run them against the deployed portal.

The heart, muscle and skin studio harnesses now share the portable browser,
loopback fixture and artifact helpers. They retain their real WebGL geometry,
selection, material, responsive and fallback assertions. Their route-cleanup
checks return to public Home; authenticated mission coverage lives in the
critical release suite.

## Isolation, artifacts and failures

The test runner removes inherited Supabase/Vercel service configuration. The
fixture server supplies a fake key and a loopback-only Auth provider, and refuses
outbound provider requests. Browser contexts abort external HTTP resources.
Tests use fake local accounts; school teacher emails are matching fixture strings
inside the isolated database only. No email is sent and no production service,
student account, database permissions or data is changed.
The class suite's read-only session probe allows two transport retries for
`ECONNRESET`; it never retries signup/save requests or HTTP errors. Regression
fixtures deliberately drop one session connection, reject an invalid HTTP method,
and exhaust the retry limit to verify recovery, identity binding and failure.

Each `npm test` run creates a randomly named, labelled `postgres:17-alpine`
container with **no published port or mounted volume**. The existing
`prepare-db-tests.py` bootstraps the test-only Auth schema and applies the existing
SQL installer there. Suites have separate database names, run one after another,
and the runner removes only its own container on completion/interruption. A
standalone database suite uses the existing `inneru-db-check` container; stop it
with `docker stop inneru-db-check` when finished. Only labelled test containers
of the expected image are accepted.

The runner prints each suite's result, continues after a failed check, writes a
JSON summary, and exits nonzero if any suite fails. Each suite has a six-minute
limit. Logs, screenshots and database/fixture output go under a fresh directory
in the OS temporary folder by default. Set `INNERU_TEST_ARTIFACT_DIR` to choose a
root directory (use a fresh directory per run); each suite gets its own subfolder.
The path is printed at startup. Browser failures capture available pages before
teardown. Generated artifacts, Python caches and `.venv` are not source files.

`.github/workflows/critical-checks.yml` runs on pull requests targeting `main`
and pushes to `main`, without secrets or deployment steps. It installs the pinned
Playwright package and its Chromium, runs `npm test`, and uploads the temporary
artifact directory **only on failure**, retaining it for seven days. Results also
appear in the Actions job summary.

For a focused hosted loading diagnosis, run
`gh workflow run critical-checks.yml --ref main -f loading_only=true`.
This manual option reports a separate **Loading diagnostics** status, skips the
database suite, and cannot substitute for **Critical checks**. Pull-request and
push runs still execute every release check. Loading failures also appear in a GitHub annotation
so their final error lines remain readable when artifact downloads are unavailable.
Failed critical suites likewise report their name and final traceback lines in
annotations, while preserving the full artifact log and failing exit code.

If failed checks should block merges, a repository administrator must configure
GitHub branch protection/rulesets on `main` to require **Critical checks** from
**InnerU release checks**. The workflow alone does not block merges. These changes
do not configure branch protection, change Vercel, merge or publish anything.

---

# Verification harnesses

For the standalone InnerU adventure entry at `/login.html`, run
`python3 _dev-tools/verify-login.py`. It verifies signup, returning sign-in,
animated avatars, role-specific dashboard redirects, session cookies, separate learner
archives, confirmation/recovery, responsive layouts, motion preferences and
offline account behavior. It uses the real API adapter against an isolated local
provider fixture. See [DISCOVERY-ENTRY.md](DISCOVERY-ENTRY.md) and
[ACCOUNT-SETUP.md](ACCOUNT-SETUP.md) for the required production configuration.

These are the headless harnesses used while building the site. Each one serves this
project read-only on a local port, loads the real pages inside same-origin iframes,
drives the DOM (clicks, sliders, typed answers) and prints a PASS/FAIL report.

    python _dev-tools/verify-stage6.py
    # then read the printed URL with any headless Chrome, e.g.
    #   chrome --headless=new --virtual-time-budget=240000 --dump-dom http://127.0.0.1:8817/_verify.html

They are development tools: excluded from the deployment by `.vercelignore`, and they
never write to the project. Adjust the `ROOT` constant if the project is not at
`C:\InnerU`.


Note: these servers are **threaded**. A single-threaded server serialises the 25+
script requests each page needs, and under Chrome's virtual-time budget a frame can then
be asserted before its scripts have run (which shows up as a mysteriously empty page).

| File | What it covers |
|---|---|
| `verify-stage1.py` | answer-position mixing, withheld feedback, weak-concept tracking, the central System Key counter |
| `verify-stage2.py` | the capstone mission, the labs of the time, the certificate, the accessibility layer |
| `verify-stage3.py` | teacher tools (progress codes, class list, reset/undo), offline plumbing, lazy three.js |
| `verify-stage4.py` | the six excretory labs, and that the extracted skeletal content still drives its pages |
| `verify-stage5.py` | the breathing simulator and the spaced-practice review system |
| `verify-stage6.py` | the habit layer (streak, plan, banner) and the force-vs-load simulator |
| `verify-stage7.py` | legacy glossary and page-reader checks; audio is superseded by `verify-pronunciation.py` |

Each harness pins its own port, so they can be run one at a time.

## Current excretory expedition

Run `python3 _dev-tools/verify-excretory.py` with Python Playwright and Chromium.
It serves the current checkout automatically, checks the actual interactions,
reports a nonzero exit status on failure, and stops its own server. See
[EXCRETORY-CONTENT.md](EXCRETORY-CONTENT.md) for lesson coverage. Stage 4 targets
an older excretory interface; the new runner covers the redesigned activities.

## Living-skin anatomy studio

Run `python3 _dev-tools/verify-skin.py` for the current integumentary 3D studio.
It checks the generated anatomical geometry, rendered selection transparency,
all structure/view controls, animated function routes, keyboard access, mobile
layout, reduced motion and the scientific fallback. See
[SKIN-ANATOMY.md](SKIN-ANATOMY.md) for anatomical choices and rendering behavior.

## Muscular anatomy studio

Run `python3 _dev-tools/verify-muscle-studio.py` for the current muscular studio.
It checks actual geometry, all 23 selections, garment coverage, rotation, mesh
picking, anatomy descriptions, learner-progress preservation, route cleanup,
mobile layout, reduced motion and fallback behavior. See
[MUSCULAR-STUDIO.md](MUSCULAR-STUDIO.md) for anatomical and rendering choices.

## Antagonistic elbow movement activity

Run `python3 _dev-tools/verify-arm-lab.py` for the anatomical elbow animation and
three discovery challenges. It verifies rigid bones, tendon lengths and physical
attachments, direction-based activation, challenge rewards, saved-progress
preservation, mobile layout, reduced motion and the interactive SVG fallback.
See [ARM-LAB.md](ARM-LAB.md) for the rig and scientific assumptions.

## Skeletal mission pathway

Run `python3 _dev-tools/verify-skeletal-course.py` to complete all eight skeletal
investigations and 24 science checks, verify rewards and prerequisites, exercise
every activity in preview without saving progress, and check keyboard access,
mobile layouts, reduced motion, shared routes and offline shell files. See
[SKELETAL-COURSE.md](SKELETAL-COURSE.md) for the learning sequence and anatomy.

## Respiratory card anatomy studies

Run `python3 _dev-tools/verify-respiratory-cards.py` to exercise the seven anatomy
guides, structure selection, motion controls, mobile layouts and existing mission
gates and rewards. See [RESPIRATORY-CARD-ART.md](RESPIRATORY-CARD-ART.md) for the
anatomical subjects and presentation behavior.

## Respiratory illustrated activities

Run `python3 _dev-tools/verify-respiratory-activities.py` to complete all six labs,
18 science checks and eight final stages, verify scientific process directions,
breathing behavior, rewards, isolated preview mode, mobile layouts and cleanup.
See [RESPIRATORY-ACTIVITIES.md](RESPIRATORY-ACTIVITIES.md) for the activity coverage.

## Home expedition gallery

Run `python3 _dev-tools/verify-home-expedition.py` to exercise all six anatomical
world previews, real route navigation and resume links, saved-state preservation,
System Key collection and final gates, keyboard access, responsive layouts and
motion preferences. See [HOME-EXPEDITION.md](HOME-EXPEDITION.md) for progress rules
and artwork sources.

## Everyday connection scenes

Run `python3 _dev-tools/verify-connection-scenes.py` to explore all six original
action/anatomy scenes and their 18 structure explanations, verify magnification,
keyboard and modal behavior, motion preferences, responsive layouts and saved
progress, and complete the original connection challenge with its 35 XP reward.
See [CONNECTION-SCENES.md](CONNECTION-SCENES.md) for anatomical choices and artwork.

## Interactive body-team challenge

Run `python3 _dev-tools/verify-body-team.py` to exercise the six-system anatomy
lab, running/weather scenarios, science predictions, tap/drag/menu matching,
guided writing, original reward gates, responsive layouts and motion settings.
See [BODY-TEAM.md](BODY-TEAM.md) for learning behavior and integration details.

## Six-system Body Detective

Run `python3 _dev-tools/verify-detective.py` to complete the six distinct evidence
benches, validate claims and their limits, verify once-only XP, isolated practice,
teacher-code restore, keyboard access, motion settings, responsive layouts and
offline shell URLs. See [DETECTIVE-LAB.md](DETECTIVE-LAB.md) for the activity audit,
scientific assumptions and progress rules.

## Student dashboard and achievements

Run `python3 _dev-tools/verify-dashboard.py` to exercise real task completions,
shared XP and badge requirements, six-system progress, live updates, current and
legacy progress-code restores, final certificates, profile/reset behavior,
keyboard/dialog access, preview isolation and phone layouts. See
[STUDENT-DASHBOARD.md](STUDENT-DASHBOARD.md) for the ledger and completion rules.

## Interactive Recall Studio

Run `python3 _dev-tools/verify-recall-studio.py` to exercise anatomical selection,
balanced/focused/due sessions, answer records, spaced intervals, early practice,
pause/resume, isolated retry rounds, reset scope, motion settings, keyboard/lens
controls and phone layouts. See [RECALL-STUDIO.md](RECALL-STUDIO.md) for the
scheduling rules and scientific wording corrections.

## Teacher classroom dashboard

For the current Home, distinct teacher views, class-scoped Control Panel and
read-only lesson previews, see [MISSION-ACCESS.md](MISSION-ACCESS.md).
Run `python3 _dev-tools/verify-mission-access.py` for the browser/API/PostgreSQL
checks of persistent locks, sequential progression and all 45 mission previews.

Run `python3 _dev-tools/verify-teacher-dashboard.py` for real submitted answers,
student snapshot collection, individual progress and achievements, feedback,
backups, legacy imports, reset/undo, and responsive records. See
[TEACHER-DASHBOARD.md](TEACHER-DASHBOARD.md) for the browser classroom data model.

## Anatomy pronunciation

Run `python3 _dev-tools/verify-pronunciation.py` to verify structure-only audio in
all six anatomy studios, detailed dermis and heart selections, cancellation,
keyboard access, unsupported speech engines, and the absence of narration on
other pages and glossary definitions. Speech requests are intercepted to check
the exact utterance text without relying on installed voices or an audio device.
See [STRUCTURE-AUDIO.md](STRUCTURE-AUDIO.md) for scope and device behavior.
The former page reader and its arbitrary-text API have been removed. Native
browser voices provide pronunciation; voice availability depends on the device.

## Account database and cloud learning

`verify-database.py` runs real PostgreSQL RLS, Auth trigger, task-credit, badge,
revision and classroom authorization checks. `verify-cloud-learning.py` drives
the production gateway and browser against that database using an isolated Auth
fixture. They require a local `inneru-db-check` PostgreSQL container; see
[supabase/README.md](../supabase/README.md) for production installation and access.

`python3 _dev-tools/verify-connection.py` checks connection diagnostics with the
production account/learning handlers against an isolated Auth fixture. It covers
missing script assets, CSP, disabled JavaScript, stalled API timeouts and retries,
configuration and schema errors, healthy results and phone layouts. No production
credentials or database container are needed for this diagnostics harness.

## Account-bound dashboard access

Run `python3 _dev-tools/verify-roles.py` after `prepare-db-tests.py` to verify
database roles, teacher approval, role-specific dashboard routes, identity
binding, isolated browser registers and the expanded avatar collection. See
[ACCOUNT-ROLES.md](ACCOUNT-ROLES.md). The original public-dashboard harnesses
contain cross-role/anonymous workflows that the new access policy supersedes.
Use the role, account, database and cloud-learning suites for current behavior.

Mastery checks can run alone with `node _dev-tools/run-critical-checks.js mastery`.
They use the same local PostgreSQL fixture, fake accounts and browser setup. See
[the mastery criteria](../README.md#evidence-based-mastery) for the explicit
check-to-objective mapping and the limits of retained evidence. No migration is needed.

## Rendered Arabic layout

`npm run test:arabic-layout` runs the layout regression alone. It is also part of
`npm test` and the existing failure-only GitHub Actions artifact upload. See
[ARABIC-LAYOUT.md](ARABIC-LAYOUT.md) for reproduced problems, viewport coverage,
geometry exclusions and screenshot/report locations. This checks layout separately
from translation completeness; it uses the same isolated fixtures and browser setup.
