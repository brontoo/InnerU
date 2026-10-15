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
