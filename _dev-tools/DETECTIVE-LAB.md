# Body Detective: six-system evidence lab

The `#detective` route now contains six independently accessible investigations.
The earlier page repeated the four clinical cases already present in skeletal
mission 7 and appended four muscular case files covering existing muscular
lessons. The new renderer replaces those two collections on this route only.
Original world missions, questions and clinical-case rewards remain available.

## Activity audit and distinct methods

| System | Existing world activities | New detective investigation |
|---|---|---|
| Integumentary | Layers, appendages, thermoregulation, receptors and repair | Compare ten-trial two-point reports at two skin sites; distinguish spatial sensitivity from counting receptors. |
| Skeletal | Framework, shape, bone structure, joints, remodeling, fracture repair and clinical cases | Compare three time-stamped height readings and their measurement method; assess a reversible disc-compression explanation. |
| Muscular | Muscle types, arm pairs, sarcomeres, ATP, fibers and exercise | Reverse a travelling smooth-muscle wave in a horizontal tube and inspect four time-lapse frames. |
| Respiratory | Airway route, ventilation, gas gradients, exchange and disorders | Repair an unequal-volume CO₂-indicator comparison using matched volumes, exposure time and a blank. |
| Circulatory | Vessels, exchange, chambers, circuits, blood components, ABO and exercise | Compare a noisy or weak pulse-clip trace against a constant six-pulse reference. |
| Excretory | Waste routes, kidney mapping, filtration, reabsorption, water balance and care cases | Audit complete urine collections to separate concentration from whole-period urea amount. |

The new scenarios, datasets and observation tools do not reuse world question
sets or mission activities. Shared anatomical concepts are applied through new
experimental-design, measurement and evidence-evaluation tasks.

## Scientific presentation

All numerical records are explicitly fictional teaching data. Touch reports
are not universal thresholds or direct receptor counts. Spinal-height recovery
is consistent with disc compression/fluid shifts; it does not diagnose a spinal
condition. The horizontal peristalsis model isolates directional propulsion and
does not report gut transit times. Its moving constriction and marker are an
enlarged schematic beside the anatomical muscle-wall study.

The CO₂-responsive indicator uses relative units and constant liquid levels;
the display does not measure oxygen or imply exhaled air lacks oxygen. The pulse
bench has no clinical BPM inference: six constant reference pulses are compared
with missing or spurious recorded peaks. Urine collections both cover a complete
24-hour interval; 0.8 L × 25 g/L and 2.0 L × 10 g/L both yield 20 g, without
claiming this establishes filtration rate or kidney function.

Anatomical background follows the portal's existing OpenStax Anatomy and
Physiology 2e references: sensory perception, vertebral column, smooth-muscle
motility, respiratory gas exchange, circulation and urinary physiology.
Illustrations are teaching reconstructions, not diagnostic images.

## Interaction and progress

Each case requires its own observations, two supporting evidence cards, a
supported claim and an appropriate limit. Feedback identifies reasoning to
revisit without granting credit for unsupported assertions. Notes, choices and
bench observations persist locally when switching files, until leaving the page.
Only completed-file credits are saved. A restart clears local observations and
answers without deleting earned credit.

Each file grants 30 XP once, using these independent reward IDs:
`detective2-touch`, `detective2-spine`, `detective2-wave`, `detective2-air`,
`detective2-signal`, `detective2-sample`. Six completions unlock the All-Systems
Investigator achievement for 180 XP total. They do not complete world missions,
award System Keys or grant old `case0`–`case3` credits. Existing saved credits
are retained. The legacy medical-case badge links back to skeletal mission 7.

`#detective?preview=1` provides fully interactive practice, including local
completion stamps, without changing learner storage, XP or the habit record.
Teacher codes retain version 1 with an optional six-bit `d` field; older codes
without it remain valid and grant no new detective credit.

## Layout, motion and assets

Navy, mint, ivory and brass styling follows the portal identity. All six files
have anatomy context, keyboard-accessible tabs, step navigation and readable
tables alongside scalable graphs. The layout fits 320–1680 px screens. Time-lapse
playback respects local pause, OS and app reduced-motion settings; manual frame
controls remain usable. Playback stops on case changes, page removal, hidden
tabs or an offscreen workbench, and event listeners/observers are disposed.

New original generated artwork is in `assets/detective/hero.webp` and
`assets/detective/smooth-muscle.webp`. Other contextual studies reuse the portal's
anatomical assets. New scripts/styles and teacher/habit changes have versioned
URLs in both identical HTML entry points and offline shell version 31. Artwork
uses the existing asset cache behavior.

## Verification

Run `python3 _dev-tools/verify-detective.py` with Python Playwright and Chromium.
It completes all six benches, checks unsupported answers, once-only rewards,
preview isolation, saved-progress restore, old teacher-code compatibility,
keyboard navigation, motion controls, route cleanup, data labels, responsive
layouts and offline shell URLs. The skeletal course harness additionally checks
that the original clinical cases and all eight skeletal investigations still
work: `python3 _dev-tools/verify-skeletal-course.py`.
