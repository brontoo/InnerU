# Arabic audio audit

The Arabic interface offers **استمع إلى جزء من الصفحة** (Listen to a part)
with a native heading/term selector. Choose a section, then activate
**استمع / أوقف**. There is no autoplay and no saved audio recording.

## Scope and behaviour

- Sign-in, signup and recovery; student dashboard/mastery and teacher views;
  owner staffing; Home, review, glossary, daily practice, detective, connections,
  capstone, achievements and information routes have selectable reading parts.
- All 71 glossary entries have individual destinations. The inline glossary and
  open non-credential dialogs also have their own Listen / Stop control.
- Activities retain their existing Guided instruction reader. Visible feedback
  using `aria-live` now receives the same explicit reading control as `role=status`
  feedback. No question, answer value, reward or completion rule was changed.
- Named skeletal, respiratory, skin/dermal, heart and excretory selections, plus
  the retained elbow activity, have selected-structure pronunciation. The removed
  full-body muscular studio stays removed. No model or lesson was recreated.
- Page reading uses the current visible DOM between the selected heading and
  the next visible heading. Closed details, hidden answers, fields/values, marked
  private work, account identities and the audio controls themselves are excluded.
  It does not translate student responses or teacher feedback.
- A single controller prevents overlapping speech. Stop, Escape, route/language/
  instruction changes, selected-structure changes, hidden tabs and changed spoken
  content cancel pending voice discovery and current speech. Adding audio controls
  or updating an unrelated section does not cancel the selected passage.

## Arabic voice and pronunciation policy

The controller waits briefly for asynchronously installed voices, including when
an English voice appears before an Arabic voice. It selects UAE Arabic first,
Saudi Arabic second, then another Arabic voice. Within that preference, a local
voice is preferred. Generic `ar` language tags are accepted. Arabic never falls
back to an English voice. Missing engines/voices and synthesis failures produce
an Arabic status message while all text remains visible.

`locales/ar/speech.js` supplies authored speech-only vowel marks for selected
anatomy names (including الأُذَيْن، البُطَيْن، الأَبْهَر، الحالِب، الإِحْلِيل
and الكُبَيْبَة). Scientific abbreviations remain letters/digits: ATP becomes
«إيه تي بي», O₂ becomes «أو اثنان», CO₂ becomes «سي أو اثنان». These are
reading aids, not unseen definitions or assessment hints. Written formulas,
answers, evidence and visible glossary definitions are unchanged. Long passages
are split into bounded utterances without omitting their text.

`speech.js` keeps a small shared controller; `speech-core.js`/`speech-core.css`
load for Arabic or the first explicit English read. Default English login and
initial dashboard do not download that additional engine or stylesheet. The
service worker caches these resources and the Arabic pronunciation catalogue on
first use, not installation. Previously visited Arabic sign-in retains its
controls offline. Offline synthesis still depends on an installed local voice.
A failed audio-module download offers an explicit retry without starting speech.

## Repeatable verification

Use the prerequisites in [README.md](README.md), then:

```sh
npm run test:audio
npm run test:accessibility
npm run test:arabic-coverage
npm run test:arabic-layout
npm run test:performance
# All critical suites, including the audio audit:
npm test
```

`verify-pronunciation.py` uses isolated local PostgreSQL/Auth fixtures and
intercepts browser synthesis. It checks recorded text and voice requests for all
71 glossary entries, all 45 teacher lesson/final previews and their Guided
instructions, retained anatomical selections, student/teacher/owner pages,
actual incorrect-answer feedback, private-text exclusions, voice discovery and
fallback, keyboard activation, cancellation, chunk completion, retry and offline
restore. Student state and database snapshots must remain unchanged by reading.
Controls are checked at 320, 390, 768 and 1440 CSS pixels. It writes
`arabic-audio-requests.json`, responsive screenshots and glossary screenshots to
the configured `INNERU_TEST_ARTIFACT_DIR`. CI runs it sequentially in `npm test`
and uploads artifacts on failure. No production services or real accounts are used.

## Device listening required

Automated speech interception proves text/locale selection and application
behaviour, **not acoustic correctness**. This environment's native Chromium
reports speech-synthesis support but has no installed voices; its real no-voice
fallback was exercised. There was no native Arabic audio output to listen to.
Conditional activity states beyond those exercised by the audio, accessibility
and Arabic coverage suites are not an exhaustive acoustic review.

Before classroom rollout, listen with the actual Arabic voice on representative
Windows/Edge, Android/Chrome and iOS/Safari devices:

1. Select Arabic and activate a sign-in section; confirm Arabic delivery and
   that typed credentials are never spoken.
2. Read an instruction and its feedback in each of the six systems. Verify
   pauses, RTL section selection, Guided Next/Back cancellation and no autoplay.
3. Listen to glossary definitions and the selected anatomical terms listed above;
   verify vowel distinctions with an Arabic-speaking science teacher.
4. Check ATP, ADH, O₂, CO₂, pH and ions as written letters/numbers. Confirm that
   no extra definition or answer hint is introduced.
5. Stop, switch language/route/structure and retry; ensure speech never overlaps.
6. Try a device without an Arabic voice and an offline device with a local
   Arabic voice. Confirm clear fallback text and readable instructions.

Record device, browser, voice name, term and issue before adjusting pronunciation
aliases. Do not claim every browser voice has been acoustically approved.

## Verification results — 26 October 2026

- Full `npm test`: all 14 sequential suites passed, including accounts, class
  assignment, progression, mission access, teacher/owner boundaries, mastery,
  Guided support, Arabic coverage and rendered layout.
- Final expanded `npm run test:audio`: 1,239 assertions passed; 310 Arabic
  speech requests captured, including signup avatars, dialogs, offline restore
  and English/Arabic round trips. The final Guided follow-up also passed all
  108 assertions.
- Arabic coverage: zero untranslated occurrences across 187 exercised states.
- Arabic layout: 475 assertions passed across 450 viewport/states, including
  keyboard focus, dialogs, RTL and physical anatomy control direction.
- `npm run test:performance`: 49 checks passed without increasing any budget;
  optional reader code/styles are absent from the cold English entry/dashboard.
- `node --check`: all 124 tracked JavaScript files passed.
- Native-browser no-voice fallback: passed; no installed voices were available
  for acoustic listening. The automated voice fixture does not claim otherwise.

Final cold English measurements (gzip for code/styles and transferred image bytes):

| View | JS bytes | CSS bytes | Images bytes | Requests | Early models |
|---|---:|---:|---:|---:|---:|
| Sign-in | 24,441 | 11,850 | 428,514 | 18 | 0 |
| Initial student dashboard | 73,316 | 32,063 | 826,150 | 48 | 0 |

Release logs/screenshots are in `/tmp/inneru-audio-release`, loading measurements
in `/tmp/inneru-audio-budget`, and the final expanded audio audit artifacts in
`/tmp/inneru-audio-final-verified`. The final Guided regression is in
`/tmp/inneru-audio-followup/learning-support`. These are workspace artifacts,
not production assets. The local run used Node.js 24.19 and the documented
preinstalled-Chromium 154 override; CI retains Node.js 22 and Playwright Chromium.

No database migration, account configuration, privileged key or production-data
change is required. Learners need a browser/OS Arabic voice for actual synthesis;
local voices are needed for offline synthesis. Nothing was pushed or deployed.

## Files changed

- Reader behaviour and appearance: `speech.js`, `speech-core.js`,
  `speech-core.css`, `learning-support.js`.
- Arabic loading/data: `locale.js`, `locales/ar/speech.js`.
- Consistent entry/cache versions: `index.html`, `404.html`, `login.html`, `sw.js`.
- Repeatable verification: `package.json`, `_dev-tools/run-critical-checks.js`,
  `_dev-tools/verify-pronunciation.py`, `_dev-tools/verify-learning-support.py`,
  `_dev-tools/check-performance.py`.
- Documentation: `README.md`, `locales/README.md`, `_dev-tools/README.md`,
  `_dev-tools/LEARNING-SUPPORT.md`, `_dev-tools/STRUCTURE-AUDIO.md`, and this report.

Authentication/server code, database schema/policies, learning-evidence/progress
logic, assessment content, illustrations and 3D assets are unchanged.
