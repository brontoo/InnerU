# Consistent bilingual mission openings

The six systems' 39 regular missions and six system finals share one
presentation layer in `mission-opening.js`. The unlocked whole-body final also
uses it; locked-route notices and certificates keep their existing presentation.
The module loads only with the ordered `evidence-help` route group. Initial
sign-in/dashboard loading does not include it.

## Visible order

1. Compact return links and the existing mission position.
2. Original mission title and original progress counters, where present.
3. The existing objective from `mastery-catalog.js`; the whole-body final reuses
   its authored scenario paragraph.
4. Actual saved completion status, or the existing read-only teacher-preview
   notice and preview/control links.
5. The lesson's original activity rail, or focus/scroll actions for its existing
   activity, checks and written response.
6. Native disclosures for the full original briefing/evidence explanation and,
   when present, the full mission map/class-access explanation.

Different investigations retain their own diagrams, controls, activity order,
scientific instructions and completion controls. There is no artificial common
six-step assessment. Existing end-of-lesson next-mission actions are unchanged.

## Roles and integrity

Students see their own recorded completion and retain the normal server mission
and class gates. Teachers and approved owner/admin accounts see the authorized
read-only preview, including its existing navigation and class-control links.
Anonymous/denied routes do not receive a mission opening. This layer cannot grant
access, unlock a lesson, submit an answer, award XP or complete an activity.

Existing DOM nodes and native rail handlers are moved, not recreated. Title IDs,
input values, question/response IDs, progress counters and scientific illustration
nodes remain intact. Original unique introductory text remains in the briefing;
the same paragraph is reused when it is already the authored objective.

One shared objective/status read-aloud control replaces duplicate readers in the
opening. Reader controls on actual activities/feedback remain. Guided instructions
stay with their existing activity roots. Language/Guided changes do not remount
an activity. Native disclosures and focus targets support keyboard use; smooth
scroll honors reduced motion. RTL uses logical spacing and keeps numeric mission
positions isolated. Four authored Arabic interface entries are in the existing
mastery catalogue.

## Verification

Use the existing prerequisites in [README.md](README.md):

```sh
npm run test:mission-openings
npm test
npm run test:performance
```

The focused suite uses loopback fake accounts and an isolated PostgreSQL database.
It covers student/teacher/owner roles in English/Arabic, 320/390/768/1440px,
all 45 teacher previews, expanded briefing/map translation coverage, keyboard
navigation, unchanged answers/rewards/locks and the existing whole-body final
six-key gate. `--capture-baseline` captures the preceding layout and omits new
component assertions. Baseline and after screenshots/measurements use the standard
`INNERU_TEST_ARTIFACT_DIR` directory, not production assets.

Before captures: `/tmp/inneru-openings-before/`.
After captures and release output: `/tmp/inneru-openings-release/`.
Loading/offline output: `/tmp/inneru-openings-loading/`.

No database migration, new dependency, account/permission change or new model/art
is required. The HTML/manifest/worker version updates make the deferred module
available to returning clients while preserving visited-route offline caching.

## Results — 9 November 2026

All 17 release suites passed across the full run and corrected targeted reruns.
The initial full `npm test` exited nonzero: its new capstone fixture needed an
initialized account snapshot, the breadcrumb assertion assumed only one link,
and the glossary audio probe needed to open the now-collapsed briefing. Those
fixture/selector assumptions were corrected, retaining the original behavior
assertions. Intermediate fixture failures remain in the logs. There was no
second full 17-suite invocation after the corrections.

| Verification | Result |
| --- | --- |
| New mission-opening suite | PASS — 709 assertions; all 45 previews in both languages and student/teacher/owner flows |
| Student experience rerun | PASS — 107 assertions |
| Audio/pronunciation rerun | PASS — 794 assertions, 165 spoken parts using the existing voice stub |
| Strict Arabic audit | PASS — zero untranslated occurrences across 187 states |
| Rendered Arabic layout | PASS — 475 assertions across 450 viewport/states |
| Loading, direct routes and offline cache | PASS — 49 assertions |
| JavaScript syntax | PASS — all 125 tracked/new JavaScript files |

| Other release suite | Result |
| --- | --- |
| Shared design foundation, bilingual navigation and keyboard access | PASS |
| Available pathways, honest mastery guidance and class-scoped attention | PASS |
| Removed muscular studio and preserved elbow learning | PASS |
| Evidence-based mastery, feedback and isolation | PASS |
| Sign-in and signup | PASS |
| Student classes and teacher assignment | PASS |
| Student progress and dashboard | PASS |
| Mission locks, progression, previews and controls | PASS |
| Teacher roster, student work and feedback | PASS |
| Teacher workspace, isolation and navigation | PASS |
| Owner access, teacher approval and class assignments | PASS |
| Guided mode, Arabic presentation and controlled read-aloud | PASS |

Current-source final focused output and screenshots:
`/tmp/inneru-openings-verified/mission-openings/`. Its combined summary explicitly
identifies the successful reruns; the initial full-run summary remains unchanged.
The follow-up output also covers natural textarea Tab order after activity jumps.

At 390px, closed-disclosure total page height for the first skeletal mission fell
from 6,587 to 5,955px in English and 6,647 to 5,966px in Arabic. These are local
rendered full-page heights, not network/Core Web Vitals measurements. The original
briefing/map content remains accessible in native disclosures. Actual before/after
screenshots were visually reviewed for student, teacher and owner flows.

Initial dashboard transfer stays within the existing budgets: 81,005 B gzip JS,
35,763 B gzip CSS, 712,327 B images, 49 requests and no early models. The new module
and stylesheet are deferred; no loading budget was raised.

The application, assessment engines, SQL, permissions, evidence rules and assets
were checked for unintended changes. Only presentation/route metadata, authored
interface translations, cache versions, verification harnesses and documentation
changed. Real native Arabic voice acoustics, actual mobile GPUs and screen-reader
hardware remain outside this local Chromium verification.

## Changed files

- `404.html`
- `README.md`
- `_dev-tools/MISSION-OPENINGS.md`
- `_dev-tools/README.md`
- `_dev-tools/run-critical-checks.js`
- `_dev-tools/verify-arabic-layout.py`
- `_dev-tools/verify-mission-openings.py`
- `_dev-tools/verify-pronunciation.py`
- `_dev-tools/verify-student-experience.py`
- `index.html`
- `locale.js`
- `locales/README.md`
- `locales/ar/mastery.js`
- `login.html`
- `mission-navigation.css`
- `mission-opening.js`
- `package.json`
- `retry-feedback.js`
- `route-loader.js`
- `route-manifest.js`
- `sw.js`
