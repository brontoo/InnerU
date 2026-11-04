# InnerU — Phase 1 repository audit

Audit date: 5 November 2026. Source: `main` at `4440adc`, fetched and confirmed
current before creating `feat/phase-one-design-foundation`. This report separates
observed implementation facts, changes made in Phase 1, and future recommendations.
No deployment, production account access, or production database operation is part
of this audit. See [the implementation report](PHASE-1-IMPLEMENTATION-REPORT.md)
for executed checks, measurements, screenshots and limitations.

## Architecture and boundaries

| Area | Actual implementation and implications |
| --- | --- |
| Entry | `login.html` / `login.js` are the separate illustrated account entry. A visit to `/` or `index.html` without a hash redirects there. `index.html` and byte-identical `404.html` support existing hash deep links. |
| Shell | `app.js` owns state, shared `layout()`, icons, fallback routes and navigation markup. Classic scripts execute in the HTML's declared order; many later files wrap `layout()`, `route()` or `save()`. This is an intentional dependency, not interchangeable module imports. |
| Route loading | `route-runtime.js` supplies a stable dispatcher before account/accessibility wrappers. `route-manifest.js` lists ordered dependencies and style cascade positions. `route-loader.js` shares loading promises, serializes scripts, rejects stale navigation tickets and provides retry/offline states. Deferred renderers register inside permanent guards. |
| Roles | `access.js` gets server-verified roles; `account-session.js` decorates identity/navigation and filters destinations. Student, approved teacher and admin/owner are distinct. Teacher signup metadata does not approve a teacher. |
| Student dashboard | `student-dashboard.js` renders real progress, six system tabs, achievement requirements, a task credit log, preferences and reset confirmation. `learning-progress.js` derives its model. `mastery.js` is a separately loaded evidence view. Do not recreate these features from counters in new widgets. |
| Teacher dashboard | `teacher-dashboard.js` / `teacher-workspace.css`: Overview, Students, Missions, Feedback, Analytics, Mastery; individual student records have their own views. Primary navigation has Explore Worlds, Dashboard, Mission Preview and Achievements Board. `owner.js` adds School assignments only for verified admins. |
| Learning records | `learning-evidence.js` normalizes submitted responses and up to four earlier attempts per response; its 600-record cap is explicit. `learning-progress.js` combines task credits, completion, achievements and responses. `cloud-learning.js` synchronizes account snapshots with revision/conflict handling. |
| Mastery | `mastery-catalog.js` maps objectives to check IDs; `mastery-model.js` derives status from matched assessment evidence. Neither XP nor elapsed time is evidence of secure understanding. One complete correct set plus at least two first-recorded correct responses is the current conservative rule; missing/incorrect/corrected evidence has separate explanations. This is not longitudinal proof of retention. |
| Accounts/API | `api/auth.js`, `lib/auth.js`: Supabase Auth behind same-origin functions, HttpOnly SameSite cookies, origin checks, private responses and refresh. `api/learning.js` / `lib/learning.js` whitelist learning fields and invoke authorized SQL functions. Never put a service key into the browser. |
| SQL | `supabase/migrations/001`–`008` and assembled `setup.sql`: profiles, school assignments, per-class mission settings, progress, responses, unique XP credits, badges, feedback and staffing audit. Existing RLS/definer functions enforce identity, approved roles and saved class boundaries. No SQL change is needed for this phase. |
| Preferences/locales | `preferences.js` stores language/Guided settings separately from the account learning record. `locale.js` loads route-scoped `locales/ar/*` dictionaries and retains source text/option values for answer readers. It excludes names, user writing, credentials and teacher notes from automatic translation. |
| Accessibility/audio | `a11y.js` decorates progress/toggle semantics and route focus/titles. `learning-support.js` adds user-controlled Guided steps and reading controls; `speech.js` defers `speech-core.js`. No speech autoplays. Native Arabic availability depends on installed browser/OS voices. |
| Offline | `sw.js` caches the essential shell on installation and caches routes, locale files and artwork after use. API requests are excluded. Do not put all models or mission art into `SHELL`. Account access still fails closed offline. |
| Deployment | Static files plus Vercel Node API functions; no build framework. `vercel.json` defines `/login` rewrite and cache headers. `.vercelignore` excludes tools, SQL and local configuration. `.github/workflows/critical-checks.yml` runs isolated release checks and a separate performance gate. Windows launchers remain; `npm run dev:local` is the portable alternative. |

## Six systems: inspected implementations

| System | Learning/content and visual files | Preservation requirement |
| --- | --- | --- |
| Integumentary | `integumentary.js`, `integ-activities.js`, `integ-map-art.js`, `skin-explorer.js`, `skin-model.js` | Six missions, final, skin layering and sensation diagrams; keep activity IDs, check choices and enlarged/not-to-scale disclosures. |
| Skeletal | `content-skeletal.js`, `skeletal-core.js`, `skeletal-course.js`, `skeletal-activities.js`, `skeletal-map-art.js`, `body-atlas*.js` | Seven missions and separate final (legacy route `mission/8`), bone/joint/reconstruction tasks and credited atlas. |
| Muscular | `muscle.js`, `muscle-learning.js`, `muscle-force.js`, `muscle-pair*.js` | Seven missions plus final, tissue comparisons, contraction steps, force/load and independent elbow lab. The removed full-body studio must remain removed in both languages. |
| Respiratory | `respiratory.js`, `resp-activities.js`, `resp-ventilation.js`, `resp-map-art.js`, `body-atlas*.js` | Six missions plus final; distinguish ventilation, exchange and cellular respiration; preserve model magnification and task gates. |
| Circulatory | `circulatory.js`, `circ-activities.js`, `circ-studies.js`, `circ-route-quest.js`, `heart-lab-ui.js`, `heart-explorer.js`, `heart-anatomy.js` | Seven missions plus final, vessel/capillary/blood tasks and heart views. Existing vessel inspection has historical reward behavior: do not blanket-remove saves from it. |
| Excretory | `excretory.js`, `excretory-art.js`, `excretory-explorer.js`, `excretory-model.js` | Six missions plus final, waste route/filtration/reabsorption/water balance/care; distinguish enlarged nephron from organ-scale views. |

Across these systems the current progress model counts **39 missions and six
system finals**, rather than an assumed uniform number of missions per system.
Other routes include Home, review, daily discovery, glossary, detective,
connections, badges, capstone/final and information/source pages. Their route
names, content and dependencies are unchanged by Phase 1.

## Confirmed findings and disposition

| Finding and code evidence | Phase 1 disposition |
| --- | --- |
| Student sidebar links had `.active` but no `aria-current`; teacher links already had both (`app.js`, `account-session.js`). Supporting routes such as Review did not consistently identify their sidebar destination. | Fixed in the existing identity/navigation decorator. Exactly one matching sidebar destination is current; system lessons map to Explore Worlds; unrelated information pages do not invent a selection. Teacher routing/role logic remains unchanged. |
| Teacher information pages fell through to the Dashboard primary selection even though they were not the dashboard (`account-session.js`). | Fixed only the selected-link decoration: reference/information routes no longer falsely mark Dashboard current. No route or permission changed. |
| At 320/390px the student navigation was a horizontally scrolling flex row (`style.css`, `exhibit.css`). Before screenshots show only a subset of links. Teacher mobile navigation already wraps. | Shared two-column mobile navigation now exposes all existing primary links. Link text can wrap; each target is at least 44px. No new destinations or hamburger state. |
| Arabic selected navigation added a right border (`learning-support.css`) on top of a left inset shadow (`style.css`, `exhibit.css`). The border also consumed width. | One marker on the logical start edge at desktop; one bottom marker on mobile in both languages. No width-changing selection border. |
| Shared styling is scattered: 43 root CSS files totaling 600,770 bytes at the source revision. Base palette variables are redefined in both `style.css` and `exhibit.css`; dashboard namespaces have their own near-identical inks/teals/golds. | Added documented `--iu-*` tokens and opt-in primitives within the existing shell stylesheet. Adopted them only for shared navigation, common panel/button corners, header alignment and footer link targets. Old per-system values remain to avoid cascade changes to lessons. |
| `exhibit.css` overrides the original shell width/padding; `teacher.css` adds a distinct main width; several shared selectors recur in responsive amendments. | Documented ownership/cascade. Future work should migrate one component at a time and remove superseded rules only after route screenshots. A mass CSS consolidation is out of scope. |
| The shell breadcrumb in `app.js` describes broad route families, rather than every individual information/activity route. Teacher top bars also contain several workspace/support labels before the page heading. | Remaining hierarchy recommendation: centralize route display labels and review quiet/transient support-status presentation with learners. Current page headings remain; do not remove status announcements or change activity rendering to achieve cosmetic compression. |
| Multiple wrapping layers and some compressed one-line source make dependencies harder to review (`app.js`, `teacher-dashboard.js`, world wrappers). The stable loader already addresses late-loading security/race hazards. | Documented the dependency contract; no framework/module-system migration or wholesale formatting. |
| The proposed reference teal, coral and brass do not all meet normal-text contrast on white. | Preserved accessible action/text colors; reference accents are decorative tokens. See measured contrast in the design-system guide. |
| Anatomy renderers use different stage layouts, label strategies, lighting/exposure and disposal paths. Some unused legacy muscular branches remain in `body-atlas.js` / `body-atlas-ui.js`. | Scientific audit and a future viewer contract, not model changes or deletion of potentially shared code. |
| Initial loading already defers body-system code, Three.js, 3D assets and optional speech. | Preserved the loader, budgets and essential-only worker install. No new initial request. |
| The optional elbow harness hardcoded Chromium/artifact paths and its cleanup check expected anonymous access to a now-protected mission (`verify-arm-lab.py`). Its first execution reached that obsolete expectation and timed out. | Updated this harness to the existing local fixture/browser/artifact helpers and test cleanup by leaving for public Home. Model assertions remain; no authentication bypass or lesson change. Other historical harnesses still need separate maintenance review. |

## Prioritized next phases — recommendations, not implemented features

1. **Scientific review:** ask a subject specialist to sign off the explicit
   accuracy questions in [SCIENTIFIC-VISUAL-AUDIT.md](SCIENTIFIC-VISUAL-AUDIT.md).
   Code invariants do not establish clinical accuracy.
2. **Incremental component adoption:** start with one non-assessment empty state
   or filter bar. Apply the documented tokens, compare EN/AR screenshots and
   remove only the obsolete rule for that component. Avoid a new parallel set
   of dashboard features.
3. **Viewer contract:** share controls/fallback/label infrastructure while leaving
   geometry and scientific facts in system-specific adapters. First measure GPU
   costs and label collisions on real mobile hardware.
4. **Font reliability:** `style.css` and the login entry request Google fonts.
   Local tests block external hosts and therefore exercise fallback fonts.
   Evaluate licensed self-hosting/subsetting separately, with Arabic typography
   review and a measured payload tradeoff; no font downloads were added here.
5. **Repository maintainability:** consider a narrowly scoped formatter strategy
   for future edited files and verify source/deployment exclusions for new
   documentation folders. Do not mechanically rewrite learning files in this phase.

## Confidence and limits

The findings above come from source inspection plus rendered local Chromium
checks, not a production-account audit. Existing release tests cover much more
than the four shell screenshots, including all systems and conditional states;
their executed results are recorded separately. Software WebGL is useful for
regressions but does not certify device performance. Neither passing browser
checks nor these palette ratios are a full WCAG conformance certification,
Arabic linguistic review, or anatomical validation.
