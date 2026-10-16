# Verification harnesses

For the standalone InnerU Discovery Centre at `/login.html`, run
`python _dev-tools/verify-login.py`. It verifies both browser entry flows, saved
progress, interactive anatomy exhibits, responsive layouts, motion preferences,
fallbacks and offline access. See [DISCOVERY-ENTRY.md](DISCOVERY-ENTRY.md).

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
| `verify-stage7.py` | the tap-to-define glossary and the read-aloud control |

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
