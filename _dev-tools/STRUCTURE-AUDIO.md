# Anatomy pronunciation

Selected-structure **Pronounce structure** controls remain in the skeletal,
respiratory, skin, heart and excretory studios and the independent elbow
activity. The removed full-body muscular model and its controls stay removed.
Selection alone never starts audio. Model controls and lesson logic are unchanged.

`speech.js` resolves the selected anatomical name from semantic selection flags
and the live information panel, including detailed dermis and internal heart
structures. Mesh-name underscores become spaces. Arabic uses the authored locale
name and speech-only pronunciation cues; English uses the existing English name.
The public reader accepts marked DOM content, not arbitrary text or text fields.

The instruction/glossary reader and anatomy controls share
one cancellation/voice controller. Changing selection, instruction, language or
route; hiding the tab; pressing Escape; or pressing the active button stops audio.
Reading cannot save an answer, award XP, complete a mission or change a lock.
Native browser voices and missing-voice explanations are described in the
[Arabic audio audit](ARABIC-AUDIO.md).

Run `npm run test:audio` for the current pronunciation/reading policy and
`npm run test:accessibility` for Guided instruction and keyboard regressions.
Both are included in `npm test`. The audio harness now uses the same portable
local fixtures and installed Playwright Chromium as the release suite. Its
intercepted utterances verify text and language selection, not acoustic quality.
Existing studio harnesses still cover actual geometry and structure selection.

The page-wide Arabic reading bar is removed. Anatomy status and tooltip nodes do
not receive duplicate instruction readers. On Windows Chrome, an incomplete
voice list delegates Arabic to the native engine; actual failures explain how to
enable an Arabic speech voice in Windows settings.
