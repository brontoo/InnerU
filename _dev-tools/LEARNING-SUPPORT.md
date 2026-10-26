> Historical implementation report: counts and artifact paths below describe that
> implementation snapshot. Current setup and release coverage are in [README.md](README.md);
> the 25 October usability follow-up is documented in [USABILITY.md](USABILITY.md).
> Current Arabic audio coverage and device limits are in [ARABIC-AUDIO.md](ARABIC-AUDIO.md).

# Guided mode, speech and Arabic presentation

Work is on `feat/guided-arabic-accessibility`, based on local performance checkpoint
`6d84f16`. Nothing is published. No database schema, authentication, role,
class-assignment, permission or production-data change is part of this branch.

## Behaviour

The always-available **Guided mode** toggle defaults off. A native language select
is available on sign-in and in the signed-in top bar. Device preferences use
`inneru-accessibility-v1`, following the existing local JSON storage pattern but
separate from assessed progress, account archives and cloud revisions. No database
migration or new account field is needed. Storage failures announce that the
preference will last only for the current page.

Guided activities show one instruction at a time, with Back/Next and keyboard
focus on the changed instruction. Short instruction sequences cover the first
skeletal, respiratory, skin and renal labs. Other instructions divide at sentence
boundaries, preserving decimals and long text. In Arabic, the authored paragraph
is translated before dividing sentences. The step index is retained when the
instruction content is unchanged and clamped when the translated step count differs.
Existing diagrams stay in their activity. Scientific terms open the existing
glossary in place. Turning Guided mode off restores the original instructions.

Changing presentation never calls a route renderer, answer handler, reward,
save-progress or completion function. Choices, option values, input contents and
live task closures stay intact. DOM translations retain source text on
`data-iu-source` spans; semantic/evidence readers use `InneruLocale.source()` or
`sourceAttribute()`. Native option labels translate independently of their values.
The circulation writing check accepts Arabic equivalents for its same six concept
groups; its original 100-character requirement, teacher-review status, task gates
and once-only XP are unchanged. The original submitted writing is saved unchanged.

**Listen / Stop** reads marked instructions and feedback only after activation.
It uses an available English or Arabic browser voice, preferring a suitable local
voice. Missing engines/voices and synthesis errors have visible status messages;
the text remains available. Nothing autoplays. Starting another reading cancels
the first. Routes, languages, instruction steps, activity interaction, Escape,
hidden tabs and page exit cancel speech. Anatomy pronunciation retains its separate
selected-name control and shares cancellation with instruction reading. No paid
service, external translation/audio API, dependency or audio file was added.

## Arabic and RTL

There are **7,204 explicit message and model-label entries in 17 catalogues**.
Coverage includes shared navigation and accessibility labels, sign-in/recovery,
student and teacher dashboards, all six systems' lesson/activity text and choices,
feedback, anatomy descriptions, recall, connections, detective cases and information
pages. Individual model labels include the 104 skeletal and 88 respiratory node
names, including the display aliases produced by GLTFLoader. No model is modified.

Catalogues load when Arabic is selected, for the current route. Teacher reference
cards request their matching curriculum catalogue when they appear, without
loading lesson scripts, styles or models. Context prevents renal “Pelvis” from
replacing skeletal “Pelvis”. Numeric, date and identity interpolation is explicit;
unknown English captions cannot be hidden in a generic Arabic template. Names,
submitted answers, teacher-written notes, emails and passwords remain original.
Scientific English is intentionally retained beside Arabic glossary vocabulary.
See [the catalogue guide](../locales/README.md).

Arabic sets `html[lang=ar][dir=rtl]`; English restores `en/ltr`. Email/password
fields, scientific canvases/SVG coordinates, sliders, formulas and Latin numeric
values retain appropriate LTR/isolation. Horizontal tab arrows mirror in Arabic;
physical 3D rotation controls retain their existing directions. Longer text wraps.
No route, assessment choice, model selection, attribution or reduced-motion
setting is replaced.

## Verification

Use the existing test-only Python/Playwright and Docker prerequisites in
[README.md](README.md). Browser and artifacts use the configurable helpers. All
accounts, Auth requests, SQL and email strings are isolated local fixtures. Browser
contexts block non-loopback requests; runners strip production environment variables.
No production site, Supabase service, student account or email delivery is used.

```
npm test                       # eight sequential release checks, including coverage
npm run test:accessibility      # Guided/Arabic/speech functional checks alone
npm run test:arabic-coverage    # strict exercised-state translation gate alone
npm run test:performance        # initial payload, lazy routes and offline checks
```

The final full `npm test` run passed:

| Check | Result | Assertions |
|---|---|---:|
| Sign-in and signup | PASS | 46 |
| Student classes and teacher assignment | PASS | 115 |
| Student progress and dashboard | PASS | 65 |
| Mission locks, progression, previews and controls | PASS | 113 |
| Teacher roster, student work and feedback | PASS | 74 |
| Teacher workspace, isolation and navigation | PASS | 89 |
| Guided mode, Arabic and controlled read-aloud | PASS | 106 |
| Strict Arabic coverage | PASS | No missing text in exercised states |

After the full suite, the focused accessibility run passed **108 assertions**, including
two final regressions: links inside instruction paragraphs remain usable, and Arabic
instructions containing Latin scientific abbreviations such as ATP use an Arabic voice.

Functional coverage includes typed credentials, persistence, Next/Back/focus,
failed-catalogue retry, storage failure, real answers and once-only XP, six first
labs, all teacher views, read-only previews, student lock/sequence denial,
Arabic/English speech requests, unsupported synthesis, cancellation, native class
selection, RTL keyboard tabs, 390/320 CSS-pixel reflow, reduced motion and cached
Arabic sign-in offline. All six representative Arabic activities have 390px
screenshots. Both a missing Arabic concept and a complete six-concept written
response are checked; preview work cannot change saved progress.

The strict gate visits student/teacher sign-in, signup/validation/avatar states,
seven teacher views, six system pages, all 45 read-only mission previews, selected
anatomy, first-lab instruction steps, detective cases, connections, student and
information pages, and populated teacher answer/student records. It reports
untranslated text rather than silently treating English fallback as Arabic.
The stricter follow-up passed with zero missing text across **199 labelled
views/states**, including every named skeletal/respiratory mesh label.
It does not exhaust every conditional dialogue or feedback combination.

Loading verification passed **44 checks**. English-default cold gzip measurements:

| Page | JS | CSS | Critical images | Requests | Early 3D models |
|---|---:|---:|---:|---:|---:|
| Sign-in | 24,265 B | 11,525 B | 428,514 B | 18 | 0 |
| First student dashboard | 71,946 B | 31,167 B | 2,113,950 B | 48 | 0 |

The existing dashboard budget is unchanged. Arabic dictionaries are runtime-cached
on first use, not precached. Offline visited routes, retry, route races, cache-write
failure and never caching account/authorization/learning APIs remain covered.
These are local gzip measurements, not production CDN timings.

Additional existing checks: `verify-login.py` passed 46; `verify-heart-studio.py`
passed 160; `verify-muscle-studio.py` passed 95. Optional legacy limitations:

- `verify-skeletal-course.py` passed eight public-page assertions, then waited for
  `.skel-locked` on an anonymous protected mission. The current Auth/mission guard
  uses a different denial view. The signed-in release suite covers the actual
  lock/progression flow; access was not weakened to accommodate this old harness.
- `verify-excretory-art.py` passed 65 illustration assertions, then waited for
  `.ea-scope` on an anonymous protected mission. Authenticated renal previews and
  representative student work are covered by the release/support/coverage suites.
- `verify-skin.py` was retried after the initial five-minute harness timeout. It
  passed 167 geometry, dermis, framebuffer and detail-lens assertions, then timed
  out waiting for the camera transition to settle after clearing the follicle
  lens. The camera/geometry code is unchanged. This optional check is **not a pass**;
  its remaining assertions are unverified in this environment.

Test logs/screenshots are under `/tmp/inneru-release-final`,
`/tmp/inneru-arabic-verified`, `/tmp/inneru-final-loading`,
`/tmp/inneru-final-accessibility`, `/tmp/inneru-accessibility-anatomy` and
`/tmp/inneru-accessibility-skin-final`. Test artifacts are not production assets.
The final syntax check passed all **116** tracked and new JavaScript files. Actionlint,
`git diff --check`, equal index/404 shells and an empty diff for API/library/SQL/
Vercel configuration are checked separately.

## Accessibility review and practical limits

New controls were reviewed against WCAG 2.2 keyboard operation (2.1.1), focus
order/visibility (2.4.3/2.4.7), language (3.1.1/3.1.2), text contrast (1.4.3),
reflow (1.4.10), target size (2.5.8), labels/status (4.1.2/4.1.3). New buttons are
at least 32 CSS pixels high (44 for preference/step controls); visible focus has a
three-pixel outline and white separation ring. New primary text #133f4d on #f0faf6
and white on #0b7778 meet normal-text contrast. Locks/mode use words and semantic
states as well as colour. Existing click/menu alternatives to drag remain intact.
Reference: https://www.w3.org/TR/WCAG22/

Automated checks are not a WCAG conformance certification or a full linguistic
review. Arabic-speaking science-educator and screen-reader review on actual mobile
devices is still appropriate. Viewport tests use Chromium; speech tests capture
synthesis requests rather than certifying an OS voice's acoustic pronunciation.
Local validation used the configurable system Chromium override because the
bundled browser download was blocked in this environment; clean/CI setup still
uses Playwright's installed Chromium by default. Preferences are device-local,
not newly synced account fields. Offline protected lessons retain live access
checks. The older structure-only pronunciation harness is not the current
instruction-reading release gate.

## Changed files

The manifest below covers accessibility work since `6d84f16`; earlier loading work
is already in that parent checkpoint. No production binary assets or test secrets
are added.

- `404.html`
- `README.md`
- `_dev-tools/LEARNING-SUPPORT.md`
- `_dev-tools/README.md`
- `_dev-tools/STRUCTURE-AUDIO.md`
- `_dev-tools/performance-budget.json`
- `_dev-tools/run-critical-checks.js`
- `_dev-tools/verify-arabic-coverage.py`
- `_dev-tools/verify-learning-support.py`
- `anatomy-loader.js`
- `body-team.js`
- `capstone.js`
- `circ-activities.js`
- `circulatory.js`
- `cloud-learning.js`
- `detective.js`
- `excretory-art.js`
- `excretory-explorer.js`
- `excretory.js`
- `glossary.js`
- `heart-explorer.js`
- `home-expedition.js`
- `index.html`
- `integ-activities.js`
- `integumentary.js`
- `learning-evidence.js`
- `learning-support.css`
- `learning-support.js`
- `locale.js`
- `locales/README.md`
- `locales/ar/capstone.js`
- `locales/ar/circulatory.js`
- `locales/ar/common.js`
- `locales/ar/connect.js`
- `locales/ar/dashboard.js`
- `locales/ar/detective.js`
- `locales/ar/excretory.js`
- `locales/ar/home.js`
- `locales/ar/information.js`
- `locales/ar/integumentary.js`
- `locales/ar/login.js`
- `locales/ar/muscle.js`
- `locales/ar/respiratory.js`
- `locales/ar/review.js`
- `locales/ar/science.js`
- `locales/ar/skeletal.js`
- `locales/ar/teacher.js`
- `login.html`
- `login.js`
- `mission-access.js`
- `muscle-atlas-ui.js`
- `muscle-explorer.js`
- `muscle.js`
- `package.json`
- `preferences.js`
- `resp-activities.js`
- `resp-ventilation.js`
- `respiratory.js`
- `rich-pages.js`
- `route-manifest.js`
- `skin-explorer.js`
- `speech.js`
- `student-dashboard.js`
- `sw.js`
- `teacher-dashboard.js`
- `world-navigation.js`
