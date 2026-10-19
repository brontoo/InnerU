# Guided mode, speech and Arabic presentation

Work is on `feat/guided-arabic-accessibility`, based on the local performance
checkpoint `6d84f16`. Nothing is published. No schema, authentication, role,
class-assignment or production data changes are part of this branch.

## Behaviour

The always-available **Guided mode** toggle defaults off. A native language select
is available on sign-in and in the signed-in top bar. Device preferences use
`inneru-accessibility-v1`, following the existing local JSON storage pattern but
separate from assessed progress, account archives and cloud revisions. No database
migration or new account field is needed. Storage failures announce that the
preference will last only for the current page.

Guided activities expose one instruction at a time, with Back/Next and keyboard
focus on the changed instruction. Explicit short instruction sequences cover the
first skeletal, respiratory, skin and renal labs; other instructions are divided
at sentence boundaries without splitting decimal values or discarding long text. Existing diagrams remain in their original activity.
Scientific vocabulary and the glossary remain available. The original instructions
return when Guided mode is turned off. Assessment questions, choices, inputs,
handlers and task gates remain in place; changing presentation never calls a
route renderer, reward, save-progress or completion function.

**Listen / Stop** is explicit and applies to marked instructions and feedback.
It reads visible text with an available English or Arabic browser voice. Missing
engines/voices and synthesis errors have visible status explanations; text remains
available. Nothing autoplays. Starting another reading cancels the first. Routes,
languages, instruction steps, activity interaction, Escape, hidden tabs and page
exit cancel speech. Anatomy pronunciation retains its separate selected-name
control and shares cancellation with instruction reading. No paid service,
external audio API, dependency or audio file was added.

Arabic sets `html[lang=ar][dir=rtl]`; English restores `en/ltr`. Native email and
password fields, scientific canvases/SVG coordinates, sliders and formula/number
values retain appropriate LTR/isolation. Longer text wraps. Localisation stores
source text for the existing DOM readers so translated button labels cannot alter
answers, response IDs or the circulatory route parser. User writing is excluded.

## Translation status — incomplete

See [the catalogue guide](../locales/README.md). Current catalogues contain over
2,100 authored entries, including shared controls, sign-in/recovery, teacher view
navigation and mission controls, dashboard/home text, terminology and representative
first activities of all six systems. This is **not complete curriculum or interface
coverage**. Later missions, feedback branches, recall, body-team/detective activities,
information pages and anatomy descriptions still contain English. The strict
coverage audit deliberately exits nonzero and lists outstanding text. Do not
publish this as a complete Arabic interface or claim all content is translated.

## Verification

Use the existing test-only Python/Playwright and Docker prerequisites in
[README.md](README.md). Browser and artifacts use the existing configurable helpers.
All accounts, Auth requests, SQL and email strings are isolated local fixtures.

```
npm test                       # seven sequential functional release checks
npm run test:accessibility      # just the Guided/Arabic/speech functional checks
npm run test:arabic-coverage    # strict, currently failing translation inventory
npm run test:performance       # initial payload, lazy routes and offline checks
```

The support regression exercises sign-in without losing typed credentials,
persistence, next/back, actual answer credits and once-only XP, all six first labs,
Arabic teacher views, read-only previews, student lock/sequence denial, supported
Arabic/English speech, unsupported engines, cancellation, native class selection,
keyboard activation, 390/320 CSS pixel reflow, reduced motion and offline Arabic
sign-in. Screenshots and translation-gap reports go into the printed artifact path.
The existing release tests cover the full permissions/progression matrix and all
45 teacher previews. JavaScript syntax is checked separately across tracked and
new source files.

Affected controls were reviewed against WCAG 2.2: keyboard operation (2.1.1),
focus order/visibility (2.4.3/2.4.7), language (3.1.1/3.1.2), text contrast (1.4.3),
reflow (1.4.10), target size (2.5.8), labels/status (4.1.2/4.1.3). New buttons are
at least 32 CSS pixels high (44 for preference/step controls); visible focus has a
three-pixel outline with a white separation ring. New primary text #133f4d on
#f0faf6 and white on #0b7778 meet normal-text contrast. Status/locks use words and
semantic states, not colour alone. Existing reduced-motion settings are retained.
Reference: https://www.w3.org/TR/WCAG22/

Limitations: automated checks are not a full WCAG conformance audit. Manual Arabic
screen-reader/voice testing, native mobile browsers and review by an Arabic-speaking
science educator remain necessary. Browser speech availability varies by device;
tests intercept synthesis requests rather than requiring installed voices or audio.
The legacy structure-only pronunciation harness describes the old no-instructions
audio policy and is not a current functional gate. Its geometry/selection subjects
remain covered by the existing anatomy-studio checks.
