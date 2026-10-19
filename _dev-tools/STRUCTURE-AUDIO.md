# Anatomy pronunciation and instruction reading

The audio control appears beside the selected-structure information in the skin,
skeletal, muscular, respiratory, heart and excretory anatomy studios, including
the 3D opposing-muscle arm activity. Students
choose anatomy with the model or its structure buttons and explicitly press
**Pronounce structure**. Only that structure's name is passed to browser speech
synthesis. Selecting a structure does not play audio automatically.

The former page reader, speed control and arbitrary-text `inneruSpeech.speakText`
API remain removed. The current accessibility branch also offers explicit
instruction/feedback **Listen / Stop** controls and Guided steps. They share the
same cancellation mechanism and use browser English/Arabic voices. See
[LEARNING-SUPPORT.md](LEARNING-SUPPORT.md) for the current scope and tests.
Nothing autoplays; user writing and account inputs are not speech targets.

`speech.js` resolves the current anatomy name from the model's selected-structure
panel and semantic selection flags. The anatomy control does not accept arbitrary text from a caller or text selection.
The separate instruction reader accepts only marked instruction/feedback elements,
never an arbitrary string, input or textarea. Mesh-name
underscores are converted to spaces for anatomical pronunciation. Detailed dermal
parts and internal heart structures use the same names as their selection panels.

Changing the selection, resetting it, leaving the page, hiding the tab, or pressing
Escape stops speech. The button also stops an active pronunciation. Audio does
not save a preference, answer, XP or achievement. A suitable local English or Arabic voice is preferred
when available; actual voice availability and synthesis are supplied by the browser
and operating system. Missing engines and synthesis errors are explained beside
the control. The anatomy remains explorable without audio.

`structure-audio.css` scopes styling to these controls. The service-worker shell
(version 52) includes the new CSS and updated speech/glossary scripts. Browser
voices may require installation or network access on some devices.

Run `npm run test:accessibility` for the current instruction-reading policy,
selected-language voices, cancellation, missing engines, keyboard activation and
unchanged learning credits. Existing anatomy-studio checks cover real structure
selection, model controls and scientific geometry. The older
`verify-pronunciation.py` harness still assumes anonymous lesson access and the
retired no-instruction-audio policy; it is not the current release gate.
Intercepted speech requests verify application behaviour, not the acoustic quality
of an operating-system voice.
