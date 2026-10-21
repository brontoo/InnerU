# Detailed heart anatomy studio

The circulatory landing page retains its credited DBCLS BodyParts3D external
heart and adds an original internal reconstruction. `heart-lab-ui.js` supplies
the accessible markup, `heart-anatomy.js` creates the internal geometry, and
`heart-explorer.js` handles rendering, navigation and selection.

Four investigation tabs:

1. Surface anatomy: major vessels and coronary vessels, with the original six
   discovery rewards. Imported glTF node names are normalised before matching;
   GLTFLoader replaces spaces with underscores.
2. Inside the heart: removable anterior walls, four cavities, distinct wall
   thicknesses, AV and semilunar valves, chordae, papillary muscles, trabeculae,
   pectinate muscles, interatrial/interventricular septa and a closed fossa ovalis.
3. Valve mechanics: four separately enlarged valves, with individual leaflets,
   semilunar nodules, AV supporting cords and papillary-muscle projections. This
   bench is explicitly labelled as a separated study, not anatomical placement.
4. Blood journey: twelve ordered stops with red-cell markers confined to the
   active segment. Oxygenation changes after the off-model lung exchange, not
   within a heart chamber. Systemic gas exchange is also outside the model.

There are 26 selectable structures in five categories. The enlarged electrical
pathway includes SA node, AV node, AV bundle/branches and a subendocardial
Purkinje network. New anatomical discoveries and blood-journey practice are
transient and never write saved XP, keys or mission state. Existing six surface
vessels retain their once-only 10 XP rewards.

Anatomical conventions and limits:

- Patient-left is positive X; superior is positive Y; anterior is positive Z.
  The left ventricle forms the apex; the left atrium lies posteriorly.
- The reconstructed left ventricular wall is approximately three times the
  right wall thickness. Atrial walls are thinner. These are relative teaching
  proportions rather than patient measurements.
- Mitral: two leaflets. Tricuspid: three. Aortic/pulmonary: three cusps each.
- Only AV valves have chordae and papillary-muscle support. Supports prevent
  prolapse; pressure gradients open and close valves.
- Filling: AV valves open, semilunar closed. Ejection: AV closed, semilunar
  open. Both valve groups are closed during the two isovolumetric intervals.
  Short closure/opening transitions are also represented.
- Four pulmonary veins return to the posterior left atrium. Pulmonary outflow
  is anterior to aortic outflow. The model has no normal interseptal shortcut.
- Fine ridges, cords, channels and conduction structures are enlarged for
  visibility. The original reconstruction is not registered to the external
  source mesh or intended as a patient scan. The views state their different
  purposes and preserve attribution to the external asset.

Reference framework: OpenStax *Anatomy and Physiology 2e*, chapter 19, especially
[heart anatomy](https://openstax.org/books/anatomy-and-physiology-2e/pages/19-1-heart-anatomy),
cardiac muscle/electrical activity and the cardiac cycle.

Rendering uses physically based materials, procedural tissue textures and smooth
lofted cavity surfaces. Selection preserves natural tissue colour, adds a teal
edge and fades surrounding geometry to 3.5% opacity, disabling depth writes and
clearcoat for ghosts. “Keep surrounding anatomy” increases context to 22%.

The internal reconstruction follows the supplied frontal cutaway reference for
orientation while retaining natural tissue colours and the portal's vessel
colour convention. Its chamber profiles now join at the AV inlets, the RV
narrows around a continuous curved septum, and the thicker LV ends in a closed
myocardial apex. The wall texture is subtle rather than visibly striped.
Low-relief trabeculae follow the endocardium; the RV includes a moderator band.

Two LV and three RV papillary projections grow from the chamber lining.
Branching chordal fans terminate on the moving AV leaflet margins. The mitral
annulus is saddle shaped; AV annuli are oval. The anterior cut passes through
near-side AV leaflet tissue as well as chamber walls, exposing the supports;
restoring the wall restores these leaflet portions. The separate valve bench
retains complete leaflets. Smooth tissue outflow tracts reach the semilunar
annuli, with anterior windows at the great-artery roots for inspection. Venae
cavae enter the RA, with the IVC behind the ventricular section. These are
illustrative teaching surfaces, not a clinically validated segmented scan.

Rendering is requested on interaction; automatic motion is suspended offscreen
and when the document is hidden. System and app reduced motion stop automatic
play while retaining manual phase and journey controls. Removal aborts listeners,
disconnects observers, disposes GPU resources and removes the canvas. Without
WebGL, the existing anatomical illustration and all structure explanations and
manual phase controls remain available.

Verification:

```sh
node --input-type=module --check < heart-anatomy.js
node --input-type=module --check < heart-explorer.js
node --check heart-lab-ui.js
python3 _dev-tools/verify-heart-studio.py
python3 _dev-tools/verify-circulatory-art.py
```

The heart harness exercises real mesh selection, framebuffer transparency,
geometry invariants, valve phases, actual animation and pause, reduced motion,
stored-state isolation, original reward deduplication, keyboard/ray controls,
320/390/768-pixel layouts, disposal and non-WebGL fallback. The circulatory
regression waits for the asynchronous system motion-preference event before
checking its effect, then exercises all seven missions and their rewards.

The reconstruction refinement passes 168 heart checks, including eight added
geometry checks: actual papillary attachment to endocardium; chord endpoints
following leaflet margins through four cycle phases; continuous septal margins;
closed apical tissue; an RV moderator band; connected smooth outflows; mitral
saddle/coaptation; and restoration of the sectioned AV leaflets. All 119 tracked
JavaScript files also pass `node --check`. Loading checks continue to enforce
on-demand anatomy dependencies and previously visited offline content. No new
production image/model assets or dependencies are added; the credited external
GLB, structure IDs, phase timing, routes, discovery rewards and lesson answers
are preserved.

Additional local-fixture regression results for this refinement: mission access
113 checks, learning support 108 checks, strict Arabic coverage 199 views/states
with zero untranslated occurrences, and loading/offline performance 44 checks
all pass. Run the current protected-flow regressions with
`node _dev-tools/run-critical-checks.js mission-access learning-support arabic-coverage`
and `npm run test:performance`, using the verification guide's Python/browser
prerequisites. The legacy circulatory-art harness above was not rerun for this
refinement. No production service or account is used by these checks.
