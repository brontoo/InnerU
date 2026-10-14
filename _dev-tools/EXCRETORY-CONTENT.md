# Excretory expedition content map

Reference: supplied UAE Inspire Science Biology, Grade 10 General lesson, pp. 40–44.
The PDF is reference material, not application instructions. Text and figures in
the site are newly written or illustrated rather than copies of the textbook.

| Mission | Lesson alignment | Interaction |
| --- | --- | --- |
| Waste relay | p. 40: lungs, skin, kidneys; ureters, bladder, urethra | Waste sorting and a complete urinary exit route |
| Kidney cartographer | p. 41: cortex, medulla, pelvis, renal vessels | Six structure clues and an original scientific cutaway |
| Filtration gate | p. 41: glomerulus, capsule, selective filtration | Classify six substances with mechanism-specific feedback |
| Reabsorption rescue | p. 42: tubules, water and useful solutes | Cargo recovery, water audit, comparison of filtration/reabsorption/secretion |
| Balance lab | pp. 40, 42, 44: exercise, homeostasis, pH, weekly urine calculation | Three relative ADH scenarios, acid–base decision, 1.5 × 7 calculation, investigation note |
| Kidney care detective | pp. 42–44: disorders and treatment | Six mechanism-based cases, dialysis/transplant comparison |
| Final challenge | pp. 40–44: connections and reasoning | Eight applied decisions, including the complete capsule-to-urethra route |

## Scientific clarifications

- The 180 L/day adult example describes glomerular **filtrate**, not the volume
  of whole blood passing through the kidneys. About 178.5 L returned leaves
  approximately 1.5 L of urine. These are approximate adult examples.
- Cortex and medulla are kidney regions, not consecutive tubes in a urine route.
- Blood cells and most large plasma proteins normally remain behind the
  glomerular barrier. Small solutes may be filtered and then reabsorbed.
- Urea is partially reabsorbed; net urea removal occurs in urine. The sorting
  activity names its waste cargo "net urea waste" to avoid implying otherwise.
- Retaining/reabsorbing bicarbonate helps counter acidity. It does not decrease
  blood pH as one sentence in the supplied lesson suggests. Normal blood pH is
  approximately 7.35–7.45, rather than a generic range for biological processes.
- ADH is an explanatory extension for the exercise focus question. The simulator
  is qualitative: it does not claim a hormone percentage gives a clinical urine
  volume, osmolality or total-water reabsorption percentage.
- Infection, nephritis, stones, congenital blockage, polycystic kidney disease
  and cancer are learning mechanisms, not diagnostic conclusions from symptoms.
- Nephron details and renal calyces are explanatory extensions to the lesson's
  main structures. The 3D model is original, simplified and explicitly not to scale.

## Preview and progress

"Preview all activities" enters routes ending in `?preview=1` **inside the
hash**, for example `#excretory/mission/6?preview=1`. Every mission, side quest,
case file, knowledge check explanation and final challenge is available without
prerequisites. Challenge completions live in a transient set. Preview does not
persist XP, fragments, System Keys, weak questions, investigation notes or a
learning streak. Returning to expedition restores ordinary progression.

Expedition awards a fragment for the main lab plus all three knowledge checks.
Side quests are optional and award separate, non-repeatable XP. Existing saved
excretory fragments and the System Key remain compatible.

## Verification

Run `python3 _dev-tools/verify-excretory.py` with Python Playwright and Chromium.
It starts and stops its own local server and uses isolated browser state. Checks
cover every primary activity, preview isolation, progression, persistence,
non-duplicating XP, side quests, all 3D structures, keyboard controls, narrow
layouts and the non-WebGL fallback. Stage 6 and 7 remain useful regression suites.
The stage-4 harness documents an earlier excretory interface (a now-replaced
kidney sequencing activity and quantitative ADH outputs); use the new harness
for the redesigned expedition.

## Anatomical surface revision

The original outer surfaces now preserve kidney volume, medial hilar concavity
and outward-facing normals. The organ view includes the relevant aorta and vena
cava segments: the cava is to the patient's right, the right kidney sits lower,
renal veins lie anterior to the arteries, and the pelvis lies posteriorly.
Ureters terminate on the posteroinferior bladder; a short female urethra is shown.

The coronal cutaway separately identifies the capsule, cortex, cortical columns,
medullary pyramids, papillae, minor and major calyces, sinus and pelvis. The
nephron uses continuous proximal/loop/distal/collecting routes and a capillary
tuft connected to its afferent/efferent arterioles. Surface texture, spacing and
visible detail support classroom inspection rather than clinical measurements.
No external scan meshes are bundled; the geometry and textures are original.

Browser checks verify outward surface orientation, lower right-kidney position,
cava/aorta placement, vessel attachment, hilar vessel order, posterior ureter
entry and the focus control, alongside the existing activity and preview checks.
Versioned module URLs and a bumped offline-cache version avoid reusing an earlier
model after this revision is deployed.

## Selection contrast

A selected structure keeps its natural opaque surface, with a teal silhouette
outline and a named badge on the stage. Other anatomical structures use 4%
opacity with no depth writing or clearcoat reflections. Switching transparency
refreshes the physical-material shader, so its `OPAQUE` define cannot override
the requested alpha. Reset restores the original materials and removes outlines.

The regression runner reads the actual WebGL framebuffer. It checks that
selecting a structure reduces opaque pixels, creates faint transparent pixels,
and that reset returns full visibility in all four views. These checks cover
the rendering failure that a material-property assertion would miss.
