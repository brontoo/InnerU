# Illustrated respiratory activities

`resp-activities.js` and `resp-activities.css` provide the six mission interiors;
`resp-ventilation.js` renders the interactive textured breathing study in Mission 1.
The existing detailed mission studies are reused at full resolution, with new
original muscle/mitochondrion and mucociliary-epithelium studies in
`assets/respiratory-activities/`. SVG viewports clip individual anatomical regions
without changing the source pictures. Every one of the 18 mission questions and
eight final challenge stages has its own matching anatomical clue.

The investigations now require small science decisions instead of awarding the
lab merely for opening each tab:

- Mission 1: distinguish ventilation, external exchange and cellular respiration
  through three different illustrations and process channels. In the ventilation
  scene, Inhale, Exhale, a keyboard-accessible position slider and Play one breath
  control the premium anatomical illustration itself.
- Mission 2: arrange seven airway landmarks with drag or arrow controls, then
  connect mucus trapping with ciliary clearance toward the throat.
- Mission 3: select the higher partial-pressure side for each gas and release it
  in the correct direction. A thicker barrier slows the qualitative animation.
- Mission 4: compare inhalation/exhalation anatomy, control a moving diaphragm
  schematic and predict pressure changes. The original two bonus goals remain.
- Mission 5: connect both gases at pulmonary and tissue capillaries. Rest/exercise
  controls illustrate changing transport demand.
- Mission 6: match four affected tissues to location and functional consequence.

Process animations are labeled schematic channels outside the anatomical images.
They do not imply measured molecular speeds. The ventilation study additionally
deforms a texture mesh of the original lung artwork: the upper airway is anchored,
both lungs widen, and the diaphragm dome descends and flattens during inhalation.
The reverse movement illustrates quiet exhalation by diaphragm relaxation and
elastic recoil. An overlaid dome trace and anatomical labels follow the tissue.
WebGL renders the texture efficiently, with a Canvas 2D fallback. This is a teaching
animation with enlarged movement, not a patient-specific biomechanical simulation.
The position controls select immediate poses when reduced motion or pause is active.
Air arrows and packets reverse on exhalation and disappear at held positions.
Playback stops on pause, reduced motion, hiding, scrolling out of view, changing
stations and navigation; each scene releases its animation and graphics resources.
Oxygen and carbon dioxide have explicit labels and opposite directions; assistive descriptions use
the same direction as the visible arrows. The breathing illustration moves the
diaphragm dome and lung silhouette together. Transient negative pressure accompanies
increasing volume, positive pressure accompanies decreasing volume, and a held pose
returns to zero alveolar–atmospheric pressure difference with no airflow. Numerical
values are illustrative, not physiological measurements. Breathing depth/rate and
the two existing bonus reward IDs remain available. Automatic playback stops on
pause, reduced motion, document hiding and route removal.

The underlying mission IDs, checks, review IDs, reward IDs and System Key retain
their meanings. Previously earned lab credit is preserved. Six missions award 396
XP, two optional breathing bonuses award 20, and the final eight stages plus key
award 114: 530 XP maximum for this world. New station ticks do not add extra XP.
The lesson now uses partial-pressure wording and correctly identifies smoking as
the leading preventable lung-cancer cause, without claiming vaping is an established
main lung-cancer cause.

All content can be browsed through `#respiratory?preview=1`, mission preview URLs
and `#respiratory/mastery?preview=1`. Preview steps, weak concepts and completions
live in a separate in-memory object. Persistence and reward wrappers skip writes;
the habit layer also recognizes respiratory preview URLs. Completion links retain
preview mode and never claim a real System Key. Expedition prerequisites still
apply outside preview.

Run `python3 _dev-tools/verify-respiratory-activities.py` for the complete mission
and final-stage learning flow, reward/reload behavior, all preview interactions,
gas direction, barrier effect, breathing pressure/hold behavior, keyboard/motion
controls, 768/390/320px layouts, cleanup, neighboring worlds and offline shell URLs.
Run `python3 _dev-tools/verify-respiratory-cards.py` for the existing gallery
regression. Both use isolated Chromium profiles and stop their own servers.
Run `python3 _dev-tools/verify-ventilation.py` for rendered lung expansion, anchored
airway pixels, diaphragm movement, reversible flow, held positions, playback,
keyboard and motion preferences, preview persistence, mobile layouts, lifecycle
cleanup and the Canvas 2D fallback.
