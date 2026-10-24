# InnerU interface messages

`ar/common.js` contains shared controls and parameterised labels; `ar/science.js`
contains scientific vocabulary and 71 plain-language glossary definitions. Other
catalogues belong to a route/body system. Catalogues are scoped to the current
route: renal “Pelvis” and skeletal “Pelvis” cannot override one another. English source messages are the keys.
All Arabic entries are explicit Modern Standard Arabic text. There is no remote
translation service, translated placeholder generator, or translation of student
writing, emails, passwords or names.

The 19 catalogues contain 7,520 authored entries across the portal, all six systems,
anatomy, feedback, recall, connections, detective investigations and information
pages. Unknown messages retain English with a language annotation where possible;
an English fallback is never counted as Arabic coverage. Original scientific
English in the bilingual glossary and unchanged user writing are intentional.

`npm run test:arabic-coverage` writes `arabic-coverage.json` under the printed
artifact directory and **fails if gaps remain**. It checks teacher views, 45
read-only mission previews, six system pages, selected model structures, first-lab
instruction steps, student/information routes and populated teacher work. It does
not traverse every conditional feedback branch; passing alone is not proof of
complete translation or a linguistic review. Recheck new text when editing lessons.

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
Teacher reference prompts use a `data-iu-locale` curriculum context; their
catalogue loads when those cards appear, without rendering the lesson. Original
submitted answers and teacher-written notes remain unchanged.

For an existing ambiguous key such as “Back”, use a specific contextual message
for new controls (e.g. “Previous instruction”). Do not globally replace one
meaning with another. Preserve formulas, units and abbreviations such as ATP,
ADH, ABO, O₂, CO₂ and pH; use bidi isolation for interpolated Latin values.

Catalogues load only after Arabic is selected, for the current route and any
curriculum reference cards currently displayed.
The service worker caches them on first use. English source messages stay in the
existing activity files; importing a catalogue must never render an activity,
answer a question, award credit or change permission checks.
