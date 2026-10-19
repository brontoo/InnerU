# InnerU interface messages

`ar/common.js` contains shared controls and parameterised labels; `ar/science.js`
contains scientific vocabulary and 71 plain-language glossary definitions. Other
catalogues belong to a route/body system. Catalogues are scoped to the current
route: renal “Pelvis” and skeletal “Pelvis” cannot override one another. English source messages are the keys.
All Arabic entries are explicit Modern Standard Arabic text. There is no remote
translation service, translated placeholder generator, or translation of student
writing, emails, passwords or names.

This branch has **partial Arabic coverage**, not a completed Arabic release.
Sign-in, dashboard navigation, teacher workspace controls, shared glossary and
representative first activities have authored translations. Later lesson text,
questions, feedback branches, the recall studio, connection lab, detective cases
and some anatomy descriptions still need translation and linguistic review.
Untranslated messages retain English and receive an English language annotation
where possible. A fallback is never counted as a translation.

`npm run test:arabic-coverage` visits the seven teacher views, 45 read-only mission
previews and 12 student/information routes with isolated fixtures. It writes
`arabic-coverage.json` under the printed artifact directory and **fails if gaps
remain**. This conservative report also lists some intentional bilingual science
labels and source citations; review them rather than removing the gate or adding
empty translations. It does not explore every answer/feedback branch, so passing
that audit alone would not prove full coverage.

Add new messages to the relevant catalogue without changing assessment logic.
Parameterised keys use named braces, for example `"MISSION {number}"`. Longer,
more specific patterns take precedence; numeric slots accept numbers only. Unknown
captions fall back to English instead of being hidden inside an Arabic template.
Use `{person}` for identity names, which are preserved and bidi-isolated. Do
not use a broad wildcard to hide untranslated English in an Arabic sentence.
Keep answer values, route fragments, task IDs and student-provided content in
English/original form. The display-only locale layer stores original text on
`data-iu-source` spans; semantic/evidence readers call `InneruLocale.source(node)`.
Native option values remain original; their `label` is translated separately.

For an existing ambiguous key such as “Back”, use a specific contextual message
for new controls (e.g. “Previous instruction”). Do not globally replace one
meaning with another. Preserve formulas, units and abbreviations such as ATP,
ADH, ABO, O₂, CO₂ and pH; use bidi isolation for interpolated Latin values.

Catalogues load only after Arabic is selected and only for the current route.
The service worker caches them on first use. English source messages stay in the
existing activity files; importing a catalogue must never render an activity,
answer a question, award credit or change permission checks.
