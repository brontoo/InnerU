# Arabic rendered-layout audit

Branch `fix/arabic-layout` starts at `origin/main` (`78192b2`). The separate
`feat/evidence-mastery` checkout and its uncommitted changes are preserved. No
production account, database, deployment, permission or curriculum change is part
of this work.

## Problems reproduced and focused fixes

| Rendered problem | Underlying rule fixed |
|---|---|
| Home welcome text covers the large logo in RTL | Give copy and the existing logo separate grid columns; use a compact logo row on phones. No replacement artwork or cropped text. |
| Home system-card titles cover illustrations, especially at 320/768px | Put illustration, caption and progress in separate grid cells, with consistent full-width entry buttons. Long captions can wrap. |
| Mobile achievements-board mascot covers the Arabic heading | Give the existing mascot its own flex row on phones; retain its artwork and animation. |
| Body-map Listen button covers labels and reduces the drawing width | Place the existing reader control in normal flow below the diagram, while retaining its target and speech behavior. |
| Body-map captions become narrow columns or spill outside the map | Restrict the tiny dot rule to decorative spans. Translation spans receive normal caption sizing; callouts retain their physical model sides. |
| Skin missions 3–5 answer labels become 28px tiles and collide | Restrict the A/B/C-marker rule to marker spans. The unchanged answer caption has a flexible, wrapping text slot. |
| Skeletal world title paints over the bone illustration | Reserve an art slot for long titles; stack the existing illustration below the title on narrow screens. No artwork is cropped or replaced. |
| Footer links create 27px horizontal overflow at 320px | Let the existing navigation flex row wrap. Do not hide page overflow. |
| Glossary popover remains off-screen after changing viewport size | Recompute its bounded screen position on resize and caption reflow. Keep scientific English LTR, Arabic definitions RTL, and the existing keyboard/focus behavior. |
| Arabic skin-model labels are clipped after translation changes their width | Observe label size and request a new positioning/render frame, including reduced-motion mode; separate colliding captions vertically while retaining projected horizontal positions, selection and camera controls. |
| Heart selection caption extends beyond the viewer at 320px | Bound the projected caption to the viewer and remeasure after translation; retain model coordinates and physical controls. |
| Muscle hero's optional Listen control extends outside the hero | Put feedback and its reader control in normal flow below the unchanged-size arm illustration. |
| Circulatory final's illustration captions/buttons become squeezed at tablet widths | Make each illustration/caption grid adapt to its own available width, rather than fixed viewport-dependent columns. |
| Labels/answers/tables align left despite RTL; two tab groups navigate backwards | Use `text-align:start` in the original rules. Mirror horizontal keyboard navigation only for Home gallery and review tabs; retain physical 3D controls. |

A few existing conditional body-map descriptions were still English. Their exact
messages now have authored Modern Standard Arabic entries in `locales/ar/home.js`.
The unlocked capstone also has ten missing labels/messages filled in
`locales/ar/capstone.js`, including the parameterised decision count. The obsolete
body-map “World coming soon” tooltip now correctly offers system exploration.
No wildcard translation or translation of user-written content was added.

## Follow-up: Explore Worlds arrangement

The Home page in the supplied screenshots received a further focused pass:

- The navy/mint welcome keeps its original artwork, now separate from the Arabic
  heading and instructions. On phones the logo sits above the copy.
- All six system cards use the same caption/art grid, progress spacing and entry
  button. SVG arrows stay readable and follow interface direction.
- Body-map buttons follow the six-system reading/keyboard order. On phones they
  form a two-column selector below the unchanged anatomical drawing. On medium
  screens the map spans both card columns so cards cannot be clipped at the edges.
- Arabic mission counts say “0 من 6 مهمّات” rather than displaying a reversed
  slash fraction. Counts, destinations and progression calculations are unchanged.

The browser gate also checks all six destinations, entry-button width/target size,
card edges, selector order, mobile labels outside the drawing, keyboard selection
and card/gallery synchronization. Home additionally exercises 1060/1100/1280px
between its existing 320/390/768/1024/1440/1680px checks. English Home remains
included at 320/768/1440px; the shared teacher Home is covered by the workspace
suite. No framework, asset, database or permission change is required.

## Reproduce

Use the existing Python/Playwright and isolated PostgreSQL prerequisites in
[README.md](README.md). No test or production credential is required.

```sh
npm run test:arabic-layout
npm test
npm run test:performance
```

`INNERU_TEST_ARTIFACT_DIR` selects the temporary artifact root. The layout suite
writes `arabic-layout/layout-report.json` and labelled PNGs, one per exercised
viewport/state. The release runner and existing failure-only GitHub artifact
upload include this check. It has a 10-minute cap; other critical suites retain
their six-minute caps. Browser choice follows `test_support.py` (Playwright's
installed Chromium by default, an explicit override only when needed).

The layout gate measures the actual DOM: page overflow, text clipped by a
non-scrollable container, translation spans constrained as flex icons, the
identified caption/artwork collisions, and popover/dialog viewport boundaries.
Closed details, screen-reader-only headings and genuinely scrollable regions are
not counted as visible clipping. It never makes overflow invisible to pass a
check. This supplements the separate strict translation-coverage gate.

## Coverage and review artifacts

The baseline captured **228 viewport/states across 76 routes/states** on unmodified
main at **320, 768 and 1440 CSS pixels**. Before screenshots and raw geometry are
in `/tmp/inneru-arabic-layout-before`. Additional reproduced conditional issues
are captured in `/tmp/inneru-arabic-layout-visual3/arabic-layout`.

The regression exercises:

- Role selection; student/teacher sign-in, registration, validation, avatar
  choices including the last scrollable choice, recovery and its response.
- Student dashboard, badge dialog, glossary/popover, account menu, review session
  and feedback, all detective case selections and six connection-system tabs.
- Teacher overview, students, answers, controls, analytics, preview library,
  rankings and each individual-student record view, with real locally submitted
  work and saved teacher feedback.
- Owner assignments and removal/approval confirmations (cancelled without
  changing assignments or approval).
- Home and each selected body system; all six system worlds; all **39 missions
  and six final assessments** in authorized read-only teacher preview; named
  anatomy modes and representative structure/detail selections.
- Submitted first-mission feedback and Guided/Next states in all six systems;
  the unlocked capstone using a separate historical local fixture; long Arabic names,
  mixed Arabic/English science and verbatim learner writing
  and teacher feedback.
- Core pages at **390, 1024 and 1680px** as well as **320, 768 and 1440px**, English
  switching, RTL keyboard tabs and visible focus. Actual loopback models/assets
  are used; no replacement anatomy or external production service is used.

Final results and artifact locations are recorded in the task report. Baseline,
failed diagnostic iterations and final results are kept in different directories;
a failed diagnostic is not reported as a passing release check.

## Practical limits

This is a Chromium viewport and rendered-DOM audit, not WCAG certification or a
pixel-by-pixel comparison of every possible state. All mission/final routes are
opened, but every possible answer permutation, completion-only celebration,
network failure, OS-native picker and model camera angle is not enumerated.
Diagram/model coordinates and intentional labels inside SVG/canvas require visual
review rather than a blanket HTML overlap rule. Existing functional, Arabic,
permission, progression, rewards and offline/loading checks remain separate gates.
Fonts use local fallbacks in the loopback-only tests; external Google Fonts are
blocked. Real mobile browsers, screen-reader speech and OS voice quality are not
certified by these tests. Production was neither contacted nor deployed.

## Final verification results

No application configuration or database migration is required. Nothing was
published, pushed or deployed. All test services used loopback and isolated fake
accounts; no production Supabase service, student record or email delivery was used.

| Check | Result | Coverage |
|---|---|---|
| `npm test` | PASS | All 10 release suites; 449 visual states in that full run |
| Final affected regression run | PASS | 89 teacher-workspace assertions, 108 support/accessibility assertions and 199 strict Arabic views/states with zero gaps |
| Final expanded `test:arabic-layout` equivalent | PASS | 488 assertions; 464 viewport/states: 449 Arabic and 15 English; zero geometry issues and browser errors |
| Final focused Home check | PASS | 49 Arabic/English geometry, keyboard selection, cleared selection, route/scroll and unchanged-reward checks at 320–1680px |
| Additional conditional Arabic coverage | PASS | Unlocked capstone and populated explorer passport; zero interface gaps |
| `npm run test:performance` | PASS | 46 payload, route, retry, race and offline/cache checks |
| `verify-heart-studio.py` | PASS | 168 anatomy/control/cleanup/fallback assertions |
| JavaScript syntax | PASS | `node --check` across all 120 tracked/new JavaScript files |
| Patch whitespace and protected paths | PASS | `git diff --check`; no API/library/SQL/auth/route-loader/service-worker/Vercel diff |

The full release run preceded the final caption/copy refinements and focused Home
arrangement. Relevant teacher, support, Arabic, layout and loading checks were
rerun. The final pressed-state indication on the map selector received the
additional focused Home run. Home-only changes are in `welcome.css`, `exhibit.css`,
`home-core.js`, `home-expedition.css`, `home-expedition.js`, `locales/ar/home.js`,
the existing layout harness and this report. No additional setup is required.
Failed diagnostic iterations are retained separately and are not counted as passes.

Latest local artifacts: `/tmp/inneru-home-review/index.html` (before/after review),
`/tmp/inneru-home-verified/summary.json` (four affected release suites),
`/tmp/inneru-home-final.log` (focused Home checks) and
`/tmp/inneru-home-performance-final.log` (loading/offline checks). These are local
review outputs, not production assets or deployed pages.

Primary viewport matrix: **320, 768 and 1440 × 1000 CSS pixels**. Core screens also
cover **390, 1024 and 1680px**; short popover/removal dialogs cover **320 × 568px**.
The expanded audit includes System Keys, populated explorer passport, expanded
teacher feedback and both locked and unlocked capstone layouts. The latter uses
a separate, explicitly historical completed-key fixture in the isolated database;
no real learner's progress or role was altered to reach it.

| English-default cold load | gzip JS | gzip CSS | Critical images | Requests | Early models |
|---|---:|---:|---:|---:|---:|
| Sign-in | 24,307 B | 11,596 B | 428,514 B | 18 | 0 |
| Student dashboard | 72,302 B | 31,596 B | 2,113,950 B | 48 | 0 |

All existing budgets pass. No new production assets, dependencies or route groups
were introduced. The existing on-demand model loading and offline behavior pass.

Review artifacts in this workspace:

- `/tmp/inneru-arabic-layout-review/index.html`: 16 before/after comparisons and three extra reviewed screens.
- `/tmp/inneru-arabic-layout-final-pass/arabic-layout/layout-report.json`: final per-state geometry, language, viewport and screenshot manifest; PNGs in the same directory.
- `/tmp/inneru-arabic-layout-final-pass/summary.json`: final visual gate result.
- `/tmp/inneru-arabic-layout-release/summary.json`: full 10-suite release result.
- `/tmp/inneru-arabic-layout-verified/summary.json`: final support, Arabic coverage and expanded layout regression results.
- `/tmp/inneru-arabic-layout-loading-final/loading-measurements.json`: loading measurements.
- `/tmp/inneru-arabic-layout-heart.log`: additional heart studio assertions.

The remaining limits above still apply: representative conditional states, not
every possible answer/error permutation, completion-only certificate, SVG/camera
angle, OS picker or actual device/browser combination. Standalone developer
connection-diagnostic pages are outside the documented learner/teacher hash-route
matrix. Chromium used the explicit local browser override in this restricted
environment; normal developer/CI setup still defaults to Playwright's browser.

## Changed files

48 files. Most route styles change only physical text alignment to
`start`; the structural fixes are described above. No binary assets, API, SQL,
authentication, route loading, service-worker or Vercel configuration changed.

- [README.md](../README.md)
- [_dev-tools/ARABIC-LAYOUT.md](ARABIC-LAYOUT.md)
- [_dev-tools/README.md](README.md)
- [_dev-tools/layout-probe.js](layout-probe.js)
- [_dev-tools/run-critical-checks.js](run-critical-checks.js)
- [_dev-tools/verify-arabic-layout.py](verify-arabic-layout.py)
- [account.css](../account.css)
- [body-atlas.css](../body-atlas.css)
- [body-team.css](../body-team.css)
- [circ-map-art.css](../circ-map-art.css)
- [circ-route-quest.css](../circ-route-quest.css)
- [circulatory.css](../circulatory.css)
- [connection-art.css](../connection-art.css)
- [detective.css](../detective.css)
- [excretory-art.css](../excretory-art.css)
- [excretory.css](../excretory.css)
- [exhibit.css](../exhibit.css)
- [glossary.css](../glossary.css)
- [glossary.js](../glossary.js)
- [heart-explorer.js](../heart-explorer.js)
- [heart-lab.css](../heart-lab.css)
- [home-core.js](../home-core.js)
- [home-expedition.css](../home-expedition.css)
- [home-expedition.js](../home-expedition.js)
- [integ-activities.css](../integ-activities.css)
- [integumentary.css](../integumentary.css)
- [learning-support.js](../learning-support.js)
- [locales/README.md](../locales/README.md)
- [locales/ar/capstone.js](../locales/ar/capstone.js)
- [locales/ar/home.js](../locales/ar/home.js)
- [locales/ar/teacher.js](../locales/ar/teacher.js)
- [login.css](../login.css)
- [muscle-learning.css](../muscle-learning.css)
- [muscle-pair.css](../muscle-pair.css)
- [muscle-studio.css](../muscle-studio.css)
- [muscle.css](../muscle.css)
- [package.json](../package.json)
- [resp-activities.css](../resp-activities.css)
- [respiratory.css](../respiratory.css)
- [review.css](../review.css)
- [review.js](../review.js)
- [skeletal-course.css](../skeletal-course.css)
- [skin-explorer.js](../skin-explorer.js)
- [student-dashboard.css](../student-dashboard.css)
- [style.css](../style.css)
- [teacher-workspace.css](../teacher-workspace.css)
- [teacher.css](../teacher.css)
- [welcome.css](../welcome.css)
