# Structure-only anatomy pronunciation

The audio control appears beside the selected-structure information in the skin,
skeletal, muscular, respiratory, heart and excretory anatomy studios, including
the 3D opposing-muscle arm activity. Students
choose anatomy with the model or its structure buttons and explicitly press
**Pronounce structure**. Only that structure's name is passed to browser speech
synthesis. Selecting a structure does not play audio automatically.

The page reader, speed control, glossary audio button, word highlighting and
`inneruSpeech.speakText` API have been removed. Lessons, quizzes, dashboards,
glossary definitions and other portal prose have no narration path.

`speech.js` resolves the current anatomy name from the model's selected-structure
panel and semantic selection flags. It does not accept arbitrary text from a
caller, selected page text, paragraph, answer, user input or queue. Mesh-name
underscores are converted to spaces for anatomical pronunciation. Detailed dermal
parts and internal heart structures use the same names as their selection panels.

Changing the selection, resetting it, leaving the page, hiding the tab, or pressing
Escape stops speech. The button also stops an active pronunciation. Audio does
not save a preference, answer, XP or achievement. A local English voice is preferred
when available; actual voice availability and synthesis are supplied by the browser
and operating system. Missing engines and synthesis errors are explained beside
the control. The anatomy remains explorable without audio.

`structure-audio.css` scopes styling to these controls. The service-worker shell
(version 39) includes the new CSS and updated speech/glossary scripts. Browser
voices may require installation or network access on some devices.

Run `python3 _dev-tools/verify-pronunciation.py`. It drives real selection controls
in all six studios and captures the requested utterances, checking that each is
exactly the current anatomical name. It also tests individual skeletal mesh
selection, detailed dermal/heart structures, cancellation, keyboard access,
unsupported engines, responsive layout and the absence of speech elsewhere.
Intercepted requests verify application behavior; they do not certify acoustic
pronunciation quality of an operating-system voice. The earlier stage-7 audio
harness describes the removed page-reader behavior and is superseded by this test.
