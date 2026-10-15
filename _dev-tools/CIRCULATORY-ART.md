# Circulatory anatomical illustrations

Seven original 1536 × 1024 anatomical teaching studies in
`assets/circulatory-missions/` replace the small symbolic mission-card pictures:

1. An artery's muscular wall, a single-file capillary and a vein with valve leaflets.
2. Capillary endothelium, red cells, interstitial fluid and skeletal muscle.
3. Four-chamber heart cutaway, septum, valves/chordae and an SA-node marker.
4. Separately enlarged lung, heart and skeletal-muscle capillary studies; exact
   pulmonary and systemic routes are explained in the interactive process board.
5. Plasma, biconcave red cells, a neutrophil, platelets and a fibrin repair mesh.
6. A/B/AB/O red-cell antigen and plasma-antibody teaching models.
7. Coronary and cerebral circulation, working muscle and an arterial-plaque inset.

The optimized WebP images total less than 2.5 MB. Generated source PNGs remain
outside the deployment. These are original teaching reconstructions; relative
sizes, tissue cuts and molecular symbols are enlarged for learning. Gold A and
teal B markers in the ABO plate are schematic, not molecular morphology. Red and
blue encode diagram conventions; human blood is always a shade of red. Existing
BodyParts3D heart assets, attribution and 3D controls remain separate.

`circ-studies.js` provides the shared artwork, region crops and accessible
structure explorer. Every mission card, including locked cards, opens a native
field-guide dialog with numbered hotspots, matching structure buttons, local
structure-discovery progress and previous/next navigation. All 30 structures can
be explored without completing questions, bypassing mission gates or writing XP.
The selected marker and explanation always agree; discovery ticks are local to
that explorer. Escape closes the dialog and restores focus to its opener.

`circ-map-art.js` adds the art to the seven cards and mastery panel. The map uses
three columns on wide displays, two on tablets and one on narrow phones. Locked
cards retain full-color artwork and readable descriptions. The board no longer
reuses the `.circ-map` class belonging to the circulation route diagram.

`circ-activities.js` provides matching illustrated clues for the 14 activities,
21 mission checks, 15 mastery items and eight transport-crisis decisions. Each
clue opens its corresponding anatomy detail, including after the answer is saved.
Every lab has a full structure explorer and a synchronized process illustration:

- Vessel buttons locate the artery, capillary or vein and illustrate its role.
- The oxygen slider reverses O2 movement below the tissue level and stops net O2
  movement at equality. CO2 has a separately labeled normal tissue-to-blood route.
- The chamber quest highlights the selected chamber; the pathway now places the
  pulmonary circuit between the right ventricle and left atrium.
- The route quest highlights lung, heart or tissue as the blood-cell journey advances.
- Cargo choices locate plasma, red cells, white cells or platelets; the fibrin
  detail distinguishes the stabilizing mesh from the platelet plug.
- Donor/recipient controls redraw schematic membrane markers and recipient plasma
  antibodies. All 16 ABO combinations use recipient antibodies versus donor red-cell
  antigens. Rh and other clinical compatibility factors are explicitly separate.
- Plaque controls reshape an arterial lumen and locate the plaque inset. The model
  is qualitative, not a measured stenosis or predicted percentage flow reduction.

The existing lab, question and reward IDs remain in `circulatory.js`. Each mission
still requires its lab plus two investigations and three checks for 100 XP. Seven
missions total 700 XP; mastery adds 125; the crisis adds 80: 905 XP maximum. Merely
inspecting anatomy does not earn lab or question credit. Completed cargo buttons
are disabled to prevent advancing past the final job, and completed questions keep
their anatomy controls available. The pulse timer is cleared on navigation.

Motion controls respect manual pause, reduced-motion preferences, the existing
site motion setting, document visibility and viewport visibility. Route cleanup
removes observers, event handlers, open dialogs and lab timers. Styles are scoped
to the circulatory map and learning pages. Both HTML entry points and service-worker
shell include the versioned new modules and CSS.

Run `python3 _dev-tools/verify-circulatory-art.py`. It serves the actual app in an
isolated Chromium profile and checks all art/regions, native-dialog keyboard
behavior, state preservation, gates, the seven complete learning flows, all ABO
pairs, gradient directions, plaque changes, exact XP/reload/replay behavior, both
final challenges, motion settings, 768/390/320px layouts, timer/route cleanup,
neighboring worlds and every offline shell URL. The server shuts down on success
or failure. `verify-respiratory-activities.py` covers the neighboring respiratory
world and its previous interactive ventilation update.

## Animated science overview

`circ-route-quest.js` and `circ-route-quest.css` replace the former text-box
`circMap()` in every mission's **Trace the science** panel and both final pages.
The overview reuses the original anatomical lung and muscle studies from plate 4
and the detailed four-chamber heart from plate 3. SVG viewports crop the original
images without changing their files. Wide and portrait layouts preserve each
specimen's proportions and locate the four chamber controls on the same landmarks.

Eight directed paths form one continuous closed physiological route: systemic
veins/venae cavae → right atrium/right ventricle → pulmonary arteries → lung
capillaries → pulmonary veins → left atrium/left ventricle → aorta/body arteries
→ body capillaries → systemic veins. The pulmonary outflow follows the ventricular
outflow tract, separating it from venous return. Paths have no crossings that
would suggest a shortcut or shunt. Pulmonary and systemic focus controls fade the
other loop; selecting its anatomy reveals the full view again.

The red-cell courier and ambient cells remain red in both circuits. The courier's
oxygen load increases at lung capillaries and decreases at tissue capillaries;
explicit O2/CO2 exchange labels show the opposite directions at the two sites.
Four chamber controls, four vessel controls, two capillary-bed controls and a
keyboard-accessible select menu synchronize the highlighted structure, courier
position and explanation. Labels use the patient's right/left in an anterior view.
Routes, size, speed and cargo icons are labeled schematic rather than clinical
measurements or molecular-scale anatomy.

Follow a red cell plays one full eight-checkpoint practice journey. Pause holds
the courier, next/checkpoint controls support manual exploration, and reset/replay
only change local practice state. Matching play/pause and next controls beside the
diagram keep the animation usable on phones without scrolling to the coach.
A local discovery badge never writes XP, lab
credit, question credit or mission progress. Map motion follows its own pause,
the existing illustration pause, site motion settings, reduced-motion preferences,
viewport visibility and document visibility. Leaving the page cancels animation
frames and disconnects observers and listeners.

Run `python3 _dev-tools/verify-circulation-route.py` for route continuity and
non-crossing geometry in wide/portrait views, all selections, gas exchange and
oxygen loading, full clock-controlled playback, pause/replay, motion preferences,
keyboard access, mobile hit targets, storage preservation and route cleanup.
`verify-circulatory-art.py` still checks the complete seven-mission and final
learning flows, original rewards, all galleries and all offline shell assets.
