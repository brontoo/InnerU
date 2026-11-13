# Student progress home

Implemented locally on `improve/student-progress-home`, based on `main` at
`9035757`. This work does not deploy or publish the portal. No database migration,
new dependency, account setup, or curriculum change is required.

## Resulting hierarchy

1. **Welcome and next lesson** share a single primary action. Name, avatar and
   class come from the current account's bound profile. A first recorded attempt
   counts as started work even when it earned no XP. Continue uses the existing
   server-authorized recommendation; locked/unavailable/error states retain an
   exploration fallback and explain availability.
2. **Saved learning** appears once near the welcome. Healthy synchronization is
   compact; account/sharing details are disclosed on request. Unassigned and
   pending-teacher notices remain visible in the compact summary. A genuine conflict
   shows the original cloud/device options with progress comparisons and plain
   explanations. Mission continuation pauses until the learner chooses.
3. **Progress snapshot** leads with missions/finals, System Keys and due review.
   XP and its existing 150-point level calculation are a secondary strip. The
   denominator remains 45: 39 regular missions plus six system finals.
4. **Six system records** show completed regular missions, a textual percentage,
   progress bar, Not started/In progress/Complete, the next allowed mission where
   available, and one disclosure action. Full mission lists and their existing
   objective groups render only on expansion. Their links respect current server
   permissions. Initial loading requests just the next-lesson illustration.
5. **Learning evidence** shows relevant objectives and existing assessment-based
   statuses, their reasons and next steps. It links to the existing evidence and
   teacher-feedback view. The criteria remain available in a native disclosure.
6. **Achievements** show up to two earned rewards and one next mission reward.
   The full collection loads only on its own route; detailed XP history starts
   collapsed. Preference/reset controls retain their existing behavior.

Explore Worlds remains the illustrated browser for all six systems and anatomy.
Student browsing no longer repeats the global progress totals or the resume card;
its links lead to system exploration or back to Student Dashboard. Teacher and
public exploration retain their existing behavior. Artwork and model controls
are unchanged.

## Evidence and data limits

The existing `mastery-model.js`, `mastery-catalog.js` and `learning-evidence.js`
remain the source of criteria and objective mappings. The dashboard does not
write assessment answers or calculate mastery from XP, badges, browsing, time or
completion. It uses the same conservative model as the full evidence view:

| Status | Existing evidence rule |
| --- | --- |
| Not enough evidence | No matched automatically checked response is available. |
| Developing | Recorded checks are incomplete, have an unresolved incorrect latest response, or have insufficient independent first-response evidence. |
| Secure | A complete authored check set is currently correct, at least two distinct checks were correct on their first recorded response, and no matched graded response remains incorrect. |

These labels describe recorded checks, not lasting mastery. There is one authored
objective group per existing mission/final, rather than separate grades for every
scientific concept. The latest response and at most four earlier attempts are
retained; unavailable history is never assumed correct. Submitted writing and
teacher feedback remain visible through the existing authorized evidence route,
but are not converted into an automatic mastery grade. Incorrect-answer hints,
answer withholding and retry/reward rules are unchanged and remain covered by
the mastery verification suite.

Card selection uses actual assessment recency, unresolved checks, the next
lesson and historical completed work with missing evidence. Recency selects
what to show; it does not change a status. Inspection never grants XP or changes
saved answers, badges, keys, locks or class assignments.

## Saved-record safety

`cloud-learning.js` still owns synchronization, authorization, revisions, recovery
copies and both explicit resolution actions. The dashboard supplies only the
student panel's presentation. Exact record comparison ignores object-key order
but preserves array order, field presence and every value; no fuzzy comparison,
merging or progress reconstruction occurs. An identical remote record with a
new revision updates local sync metadata without another save or a spurious
choice. Different records still require the learner's explicit choice. Cloud
choice keeps the original device recovery copy; device choice saves through the
unchanged account gateway. Previous-account conflict state is cleared when a new
account's cloud session starts.

No new endpoint, query across students, SQL migration, role grant or RLS change
is introduced. The system-detail permission accessor only projects the current
account's existing catalog for display; route and database authorization still
enforce mission access.

## Files

| Files | Purpose |
| --- | --- |
| `student-dashboard.js`, `student-dashboard.css` | Progress-first layout, objective/evidence cards, compact account presentation, accessible responsive controls. |
| `student-achievements.js` | Existing full collection renderer moved behind its route; requirements and rewards remain shared. |
| `cloud-learning.js` | Mount the student panel near the welcome; suppress only exact-record non-conflicts. |
| `mission-access.js` | Read-only projection of current mission availability for expanded records. |
| `home-expedition.js`, `home-expedition.css` | Student browsing and the dashboard return link. |
| `route-loader.js`, `route-manifest.js` | Defer the full collection through the existing serial loader and navigation safeguards. |
| `locales/ar/dashboard.js`, `locales/ar/home.js`, `locales/README.md`, `locale.js` | Authored Arabic copy and catalogue cache version. Learner/teacher writing stays verbatim. |
| `index.html`, `404.html`, `login.html`, `connection.html`, `sw.js` | Matching cache-version references; no unrelated entry-page redesign. |
| `_dev-tools/verify-student-experience.py` | Expanded real-fixture state, evidence, conflict, keyboard, responsive and screenshot checks. |
| `_dev-tools/verify-dashboard.py`, `_dev-tools/verify-usability.py`, `_dev-tools/verify-mastery.py` | Exercise the disclosed log, unique continuation, real Secure evidence and explicit evidence navigation. |
| `_dev-tools/verify-student-classes.py`, `_dev-tools/verify-owner.py`, `_dev-tools/verify-mission-access.py`, `_dev-tools/verify-arabic-layout.py` | Inspect disclosed sharing details, preserve the exact permission assertions, settle pending browser sync before independent write assertions, and check Arabic counters in the progress home. |

Related documentation updates: `_dev-tools/README.md`,
`_dev-tools/STUDENT-DASHBOARD.md`, `docs/PHASE-2-STUDENT-EXPERIENCE.md`,
and the curated screenshot index.

## Verification and artifacts

Use the existing pinned Playwright/PostgreSQL prerequisites in
[`_dev-tools/README.md`](../_dev-tools/README.md). Tests use isolated local accounts,
local PostgreSQL and blocked external browser requests. They never create sample
students in production. Commands and final results are recorded below. The local restricted-environment Chromium override is supported by
the existing harness; no dependency or test budget is changed.

Representative dashboard captures cover English/Arabic at 320, 390, 768, 1024,
1440 and 1680 CSS pixels; Explore Worlds covers 390, 768 and 1440. Genuine record
choice is captured in English/Arabic at 320 and 1440. Empty, real incorrect work,
missing historical evidence and completed-record cases are verified. Screenshots
also cover all six expanded mission/objective records. Curated before/after
captures are in `docs/screenshots/student-progress-home/`; the complete generated
reports and images remain under `/tmp/inneru-progress-home/` in this workspace.

Browser checks cover reflow, keyboard direction/focus, accessible labels, native
expanders, Guided mode, reduced motion and authored Arabic. This is not a claim
of a complete WCAG conformance audit or physical-device/screen-reader listening
verification. No production student account or production database was used.

### Focused verification completed

- `npm test -- student-experience`: **151 passed**, including empty/real incorrect
  work/completed states, both record choices, identical-record startup and HTTP
  409 reconciliation, unique labels, keyboard direction, 44px key targets, sampled
  4.5:1 text contrast, reduced motion, Guided mode, Arabic and lazy-loading boundaries.
- `npm test -- dashboard`: **67 passed** using actual activity answers/credits,
  including scoped Secure, XP, badges, all six progress records and preservation.
- `npm test -- student-classes mission-access`: **119 + 224 passed**, retaining
  API/SQL/RLS class boundaries, owner-derived assignments, teacher locks, all 45
  preview routes, prerequisites and prevention of forged learning writes.
- `npm test -- owner`: **96 passed**, including visible unassigned-teacher status,
  Arabic sharing details, staffing isolation and unchanged student work.
- `npm test -- arabic-layout`: **476 passed across 450 rendered viewport/states**,
  including the six systems, mission previews, dialogs, RTL, intermediate widths
  and English switching.
- `npm run test:performance`: **49 passed** with existing budgets unchanged. Cold
  dashboard: **44 requests**, **317,563 image bytes**, zero model bytes. The prior
  dashboard used 49 requests and 712,327 image bytes. Login remains within its
  existing request/byte limits.

The first full release run caught outdated assertions for the newly disclosed
sharing details and relocated progress counters, plus an independent API-write
assertion racing pending browser synchronization. The assertions were updated
to exercise the actual user flow, and the write test now waits for synchronization
before checking the original required 403 response. The owner scenario also
identified a mislabeled unassigned-teacher summary, which was corrected. Focused
reruns and a complete `npm test` passed. Final screenshot inspection found an
outline-button color override; the correction was verified in a further 151-check
student-flow run, including normal and hover contrast, and the performance checks.

### Final clean release gate

`npm test` completed with **all 19 suites passing**. This includes the full
accessibility/Guided, strict Arabic coverage, pronunciation, class/owner/RLS,
mission-lock, actual evidence/feedback, reward-preservation and rendered-layout
checks. `npm run test:performance` passed all 49 loading/offline checks with the
existing budgets. Tracked JavaScript plus the new deferred module passed syntax
checks; document parity, embedded-checker parity and whitespace checks passed.

| Suite | Result | Seconds |
| --- | --- | --- |
| Consistent bilingual mission openings and role-safe activity navigation | PASS | 119 |
| Student experience, evidence priorities and accessible navigation | PASS | 46 |
| Shared design foundation, bilingual navigation and keyboard access | PASS | 20 |
| Arabic audio coverage, scientific names and voice fallback | PASS | 200 |
| Available pathways, honest mastery guidance and class-scoped attention | PASS | 13 |
| Optional muscular rotation and preserved elbow learning | PASS | 97 |
| Heart anatomy, named selection and preserved discovery rewards | PASS | 66 |
| Evidence-based mastery, feedback and isolation | PASS | 21 |
| Sign-in and signup | PASS | 41 |
| Student account access, connection recovery and confirmation | PASS | 19 |
| Student classes and teacher assignment | PASS | 71 |
| Student progress and dashboard | PASS | 17 |
| Mission locks, progression, previews and controls | PASS | 75 |
| Teacher roster, student work and feedback | PASS | 20 |
| Teacher workspace, isolation and navigation | PASS | 24 |
| Owner access, teacher approval and class assignments | PASS | 24 |
| Guided mode, Arabic presentation and controlled read-aloud | PASS | 52 |
| Strict Arabic coverage audit | PASS | 128 |
| Rendered Arabic layout and artwork separation | PASS | 417 |

Machine-readable results: [STUDENT-PROGRESS-HOME-CHECKS.json](STUDENT-PROGRESS-HOME-CHECKS.json).
Full release artifacts: `/tmp/inneru-progress-home/release-final/`.
Performance artifacts: `/tmp/inneru-progress-home/performance-complete/`.

The clean run used the existing pinned Playwright interpreter and supported
local Chromium override. No additional setup, dependency or SQL migration is
required. Source and screenshots remain local; no deployment or publication was
performed.
