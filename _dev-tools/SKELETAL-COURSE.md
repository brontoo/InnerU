# Skeletal learning pathway

The material below the skeletal 3D studio now follows three explicit stages:

1. Map the framework: skeletal divisions, bone classification, internal structure.
2. Discover living bone: joint anatomy and movement, then remodeling and loading.
3. Apply the science: fracture repair, four evidence cases, final athlete case.

Mission IDs 1–8, all 24 questions, saved completions, weak-concept IDs, reward IDs
and the Framework Key retain their existing meanings. This is a presentation and
activity update, not a progress migration. The maximum first-time reward is 550 XP:
seven 20-XP investigations, 24 ten-XP checks, four 30-XP cases and the 50-XP final
key. The final reflection uses the existing zero-XP `activity8` marker.

`skeletal-course.js` owns the grouped map and consistent mission layout. Each
mission presents anatomy observation, a hands-on investigation, three checks and
completion in that order. `skeletal-activities.js` supplies the activities:

- Seven-region axial/appendicular sorting, including the hip-bone/sacrum distinction.
- Four anatomical shape specimens with drag/menu matching and written reflection.
- Seven long-bone structures and a solid-versus-trabecular-lattice comparison.
- Five joint stations with movement predictions and the optional shoulder schematic.
- Three resorption/formation balances plus an independently accessible loading task.
- Illustrated repair sequencing, an open four-phase timeline and a stability choice.
- Four case files, each with system, structure, condition and evidence matching.
- Five athlete-case clues, anatomical comparison and a written stability reflection.

The original detailed illustrations from `assets/skeletal-missions/` are used in
the lessons as well as on the cards. SVG viewports show individual specimens at
their original resolution. Selected study windows locate anatomical regions and
carry numbered markers linked to external labels and explanations. These windows
are regions of an illustration, not segmentation of a patient image. The axial
and appendicular views mark several example regions rather than putting a single
box around the whole skeleton. Every study has a native enlarged dialog.

The plane, pivot and suture stations have dedicated labeled teaching schematics.
The carpal study represents eight bones. The neck schematic identifies the atlas
and the dens of the axis. Sutures have no movement cue. The elbow description
distinguishes hinge movement from radioulnar rotation. Microscopic structures,
specimens and repair phases are enlarged independently and are not to scale.
Fracture phases overlap; model mass units are not clinical measurements. Fictional
case evidence does not establish a real medical diagnosis. Science references
remain the OpenStax/MedlinePlus links in `content-skeletal.js`.

Every mission supports `#mission/N?preview=1`; `#world?preview=1` opens the complete
pathway. Preview uses local function state and never calls the reward/save paths.
The shared router strips the query for route matching. The habit layer recognizes
these preview routes and omits its own saves. All investigation subactivities and
questions are visible without passing earlier questions. Expedition progression
still requires the preceding mission and an investigation plus three correct checks.

Pause controls and reduced-motion preferences stop movement cues and the repair
timeline; manual exploration stays available. Timeline callbacks stop when the
activity is detached or the document becomes hidden. Menus and arrow buttons
provide alternatives to dragging. Mobile layouts retain the field guide and wrap
the shared header/footer content instead of overflowing the screen.

Run `python3 _dev-tools/verify-skeletal-course.py` to serve the actual site in an
isolated Playwright Chromium profile. It completes every investigation and all 24
checks, exercises reward deduplication and reloads, verifies prerequisite gates,
tries all activities in preview against a byte-for-byte storage baseline, checks
keyboard/dialog controls, 390px and 320px layouts, reduced motion, shared routes
and every offline shell URL. It stops its own server and exits nonzero on failure.
