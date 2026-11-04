# InnerU scientific visual audit — Phase 1

Source: `main` at `4440adc`; reviewed 5 November 2026. **No model, scientific
label, assessment answer, lesson text or scientific interaction was rebuilt or
edited.** Findings marked “verify” are questions for a qualified anatomy/science
reviewer, not confirmed anatomical errors. Automated geometry checks are useful
invariants, not clinical validation. Shared-shell layout changes are documented
in the other Phase 1 reports.

## Inventory and strong existing work

At the audited revision `assets/` has **83 WebP images (26,353,892 bytes)** and
**seven GLB files (7,147,668 bytes)**. These are repository totals, not startup
transfer: route art and model files load on demand. Vector art also lives in JS
and SVG, and procedural geometry/textures in ES modules; GLB totals alone do not
measure GPU memory or anatomical coverage.

| System | Implementation / strengths | Accuracy and presentation questions to verify |
| --- | --- | --- |
| Skeletal | `body-atlas-ui.js` / `body-atlas.js`, `assets/skeletal-atlas.glb` (2,203,136 B), `skeletal-map-art.js`, mission WebP studies. Existing DBCLS BodyParts3D attribution; selectable regions; front/back/reset/zoom; keyboard rotation; fallback explanatory text. Mission art distinguishes bone interior, joints, remodeling and fracture stages. | Verify region-to-mesh grouping and occlusion for pelvis/spine/ribs/hands. Check whether paired bones, cartilage and sutures are sufficiently distinguishable at normal student zoom. Simplified mission plates should not be read as exact proportions or fracture-management advice. |
| Integumentary | Current studio is `skin-explorer.js` + `skin-model.js`, not simply the old atlas GLB. Layer, gland and sensation modes; procedural tissue detail; model and DOM labels; separation and embedded dermis selection; visible illustration fallback. `integ-activities.js` keeps scientific tasks separate from the viewer. | Enlarged structures/separation are explicitly teaching conventions. Verify relative depth/termination of tactile and pressure receptors, nerve branches, capillary loops and follicles against the intended Grade 10 reference. Confirm tissue translucency does not imply empty spaces or detach glands from their ducts. |
| Muscular | Full-body muscular studio is intentionally removed. `muscle-learning.js` retains tissue/contraction comparisons; `muscle-pair.js`, `muscle-pair-view.js`, `muscle-pair-model.js` provide the independent elbow with real skeletal/muscle source assets, tendon routes, accessible slider and SVG fallback. `assets/muscular/ATTRIBUTION.md` records source attribution. | Verify attachment/surface relationships and visible tendon path at straight, intermediate and flexed poses. Check the distinction between model interpolation and actual muscle shortening/force. Do not restore the rejected full-body model under a “unified viewer” refactor. |
| Respiratory | `body-atlas.js`, `assets/respiratory-atlas.glb` (493,508 B), `resp-map-art.js`, `resp-ventilation.js`, `resp-activities.js`. Separate outer lungs/airways/magnified alveoli; breathing simulator and visual distinction between ventilation and exchange. | The alveolar close-up is explicitly enlarged/separate. Verify branching continuity, lung/diaphragm relationships, capillary contact and diffusion-arrow direction in each selected view. Avoid interpreting animation speed or idealized volumes as patient physiology. |
| Circulatory | `heart-explorer.js` / `heart-anatomy.js` reconstruct a cutaway, valves, conduction and blood-journey modes; optional external `assets/anatomical-heart.glb` (598,232 B). AV leaflet/chordal structure, relative LV wall thickness, pulmonary return and valve phase invariants have dedicated WebGL tests. Mission vessels/blood tasks use separate illustrations. | Specialist verification is still needed for 3D chamber topology, septum/outflow spatial relationships, leaflet coaptation and conduction placement. The procedural interior is **not registered to the DBCLS exterior** and is not a segmented patient scan. Blue/red convention denotes oxygenation, not actual blue blood. No Phase 1 code claim replaces scientific sign-off. |
| Excretory | `excretory-explorer.js` / `excretory-model.js`: organ, cutaway, nephron and flow views; kidney/nephron WebP fallbacks; connected vessels/calyces/papillae and clear magnification note. Missions separately teach waste route, selective filtration, reabsorption and homeostasis. | Verify nephron segment order, vascular adjacency, filtration/reabsorption direction and collecting-duct joining against the intended lesson diagrams. Enlarged nephron and organ-scale views are distinct; do not imply literal organ-scale tubular dimensions. Physiological numerical activities remain educational models. |

`assets/integumentary-atlas.glb` (1,147,464 B) and
`assets/excretory-atlas.glb` (741,408 B) coexist with newer procedural studios.
Legacy group definitions remain in `body-atlas-ui.js`; source inspection alone
is not sufficient to delete them. Under `assets/muscular/`, `movement-arm.glb`
is the arm runtime asset; `anatomical-muscles.glb` is retained as input to its
reproducible extraction script (see `ATTRIBUTION.md`). Neither is a reason to
reintroduce the removed full-body interface. Trace imports and build scripts
before declaring an asset unused.

## Confirmed technical differences

| Area | Code-level observation | Later recommendation |
| --- | --- | --- |
| Controls | Generic atlas uses `[data-view]` / `[data-part]`; skin uses mode/detail/structure controls; heart has mode/group/phase/journey controls; renal viewer has separate organ/nephron/flow tabs; elbow is controller/pose based. | Share the outer control/fallback contract, not a universal scene or forced identical scientific interactions. |
| Lighting/materials | Generic atlas exposure varies by kind (roughly 1.03–1.5); skin uses exposure .98; heart 1.12; elbow 1.10. Pixel ratio caps differ (1.5, 1.7, 1.75). Material roughness/clearcoat/transparency are set by each renderer. | Choose reference screenshots and review tissue appearance against intended art. Differences are confirmed; “incorrect lighting” is not established merely by different numbers. Do not normalize every exposure without viewing models. |
| Labels | Skin projects multiple DOM hotspot labels with resize/layout handling. Heart has a projected selected label and a separate enlarged valve bench. Generic atlas has region/list selection and legacy muscle hotspots. Canvas/model coordinates remain LTR while surrounding Arabic UI is RTL. | Test collision/occlusion at 320px, long Arabic labels, changed zoom, rotation and browser text enlargement. A generic page overflow test cannot detect every projected label problem. |
| Context/isolation | Heart and renal scenes fade surroundings to expose selected anatomy; skin supports tissue separation/translucency. These deliberately alter visibility. | Preserve color/material attribution and explain context modes. Scientific reviewers should check that isolation does not look like a disconnected anatomical relationship. |
| Lifecycle | Renderers own distinct observers, animation loops, resize handlers, controls and disposal. Generic atlas has a continual rAF path; newer viewers suspend/re-render on interaction and visibility. | Profile frame/GPU memory after repeated route switches on actual devices, then share lifecycle helpers. No blanket animation-loop rewrite in Phase 1. |
| Deferred assets | `anatomy-loader.js` imports only hosts present; generic atlas waits for viewport intersection. Skin/renal import after their world renders; heart external surface GLB loads when that surface is requested; arm view imports near its viewport. | Keep model/Three.js code absent from login/dashboard. A world containing a viewer may start its own viewer dependencies before manual interaction; do not claim every viewer waits for a click. |
| Artwork | WebP mission art and inline/vector illustrations have several aspect ratios and some intentional crops. Some display text is separate HTML, while artwork itself can contain diagram detail. | Use proportional containers and inspect important labels before changing `object-fit`. Preserve original visual selection/crop until a demonstrated collision requires an adjustment. Do not add duplicate full-size production variants without measurement. |

## Proposed unified Anatomy Viewer contract (future work only)

The reusable layer should own a named section, loading/error/fallback region,
model stage, keyboard help, structure list, optional view tabs, zoom/reset,
selection announcement, explicit pronunciation control, attribution and disposal.
Adapters should own geometry, facts, coordinate system, camera presets,
scientific modes, magnification, and any existing reward behavior.

Required acceptance criteria for such a later refactor:

- Preserve physical left/right, scientific names, source licenses, fallback art
  and the model's intended material appearance. UI RTL does not mirror anatomy.
- All selection/zoom/mode actions have keyboard alternatives; pointer gestures
  are optional; no speech autoplay; reduced motion stops automatic motion.
- Never couple generic exploration to mission completion or new XP. Audit
  existing explicitly rewarded interactions before altering save paths.
- Cancel observers/listeners/rAF and release GPU resources on removal. Retain
  offline operation for previously visited dependencies and clear uncached states.
- Validate anatomy with a subject specialist and user-test label readability
  with SEN/EAL learners on actual classroom devices.

## Verification and limitations

See [PHASE-1-IMPLEMENTATION-REPORT.md](PHASE-1-IMPLEMENTATION-REPORT.md) for the
executed release, Arabic rendered-layout and viewer regression results and their
artifact paths. Phase 1 does not certify clinical fidelity, all-camera-angle label
clearance, real-device GPU behavior, or acoustic pronunciation by every OS voice.
Those require the targeted reviews above. No accuracy concern in this report was
“fixed” by silently changing lesson content or assessment values.
