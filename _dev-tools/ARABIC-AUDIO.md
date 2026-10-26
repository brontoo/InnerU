# Arabic audio — compact controls

The page-wide “Listen to a part” dropdown was removed after user feedback. It is
not rendered on sign-in, student/teacher/owner screens, system pages or lessons.
Audio download errors no longer insert a page-wide retry panel either.

Anatomy studios have one existing **Pronounce structure** control beside their
selected-structure description. Generic status/feedback readers are excluded
from anatomy roots, so loading messages, canvas tooltips and anatomical info
cannot generate duplicate Listen buttons. Models, lesson content and assessment
logic are unchanged.

Existing instruction/feedback and Guided **Listen / Stop** controls remain, as do
compact readers inside open glossary definitions and non-credential dialogs.
Nothing autoplays. Escape, route/language/instruction changes, structure changes
and hidden tabs cancel pending and active speech. Hidden answers, private work
and field values are not speech targets. Pronunciation aliases only read the
written letters/digits of abbreviations; they add no unseen definitions or hints.

## Windows Chrome and Arabic voice discovery

An empty/incomplete `speechSynthesis.getVoices()` list does not conclusively prove
that the browser's native engine cannot speak Arabic. The controller waits for
late voices, selects an explicitly available Arabic voice where possible, and
otherwise asks the native engine to resolve `utterance.lang = 'ar-SA'` without
assigning an English voice. It reports reading only after native `onstart`.

If native synthesis actually fails, the activated control displays an Arabic
message explaining that an Arabic text-to-speech voice must be enabled in device
settings. The portal cannot install Windows voices and does not claim that a
mocked speech request proves audible pronunciation.

For Windows Chrome:

1. Open Windows **Settings → Time & language → Speech**.
2. Under **Manage voices → Add voices**, install an Arabic speech voice if offered.
   Depending on Windows version, the download may instead be under
   **Language & region → Arabic → Language options → Text-to-speech**.
3. Fully close and reopen Chrome, then activate an instruction or structure reader.

Availability depends on the Windows edition/language packages and the browser's
native engine. Installing a keyboard language alone does not establish that its
speech voice is installed. No paid service, external TTS API, prerecorded audio
assets or new production dependency is used.

## Verification

Use the existing Python/Playwright/Docker prerequisites in [README.md](README.md):

```sh
npm run test:audio
npm run test:accessibility
npm run test:arabic-coverage
npm run test:performance
```

The audio audit uses isolated local accounts/database fixtures. It checks removal
of the page-wide bar, single anatomy controls, real named selections, all 45
teacher mission/final previews with Guided reading, live feedback, glossary and
dialog reading, unchanged saved learning, late/empty/English-only voice lists,
native Arabic language delegation, actual synthesis errors, cancellation,
privacy, chunking, compact mobile controls, module retry and offline reuse.
The fake engine records text/language/voice requests; acoustic review on real
Windows Chrome remains necessary.

Artifacts include `arabic-audio-requests.json`, screenshots and local fixture logs
under the configured `INNERU_TEST_ARTIFACT_DIR`. The supplementary native-browser
probe verifies the genuine error/fallback when no voices are installed and checks
the skin studio at 1440px and 390px with no duplicate readers. No production
accounts or Supabase data are used. No migration or privileged key is required.

## Correction verification — 26 October 2026

- Focused audio audit: 793 assertions and 165 speech requests passed. A subsequent
  targeted native-engine probe also verified Arabic language delegation,
  Windows voice guidance, network-error distinction and reporting only after
  native `onstart`.
- Guided/accessibility regression: 108 assertions passed.
- Mission access/progression/teacher preview regression: passed.
- Strict Arabic coverage: zero untranslated occurrences across 187 states.
- Loading/offline/performance budget: all 49 checks passed with unchanged limits.
- JavaScript syntax: all 124 tracked files passed `node --check`.
- Rendered skin studio: checked at 1440px and 390px, with no page-wide bar,
  no duplicate anatomy readers and no horizontal overflow. Screenshots:
  `/tmp/inneru-compact-skin-desktop.png` and
  `/tmp/inneru-compact-skin-mobile.png`.

Logs/artifacts are under `/tmp/inneru-compact-audio`,
`/tmp/inneru-compact-regression` and `/tmp/inneru-compact-loading` in this workspace.
The native Chromium probe had no installed voices and displayed the truthful
Arabic voice-setup message. Windows Chrome acoustic playback could not be tested
from this Linux environment. The complete 14-suite release gate was not rerun
locally for this focused correction; it remains the GitHub Actions push gate.
