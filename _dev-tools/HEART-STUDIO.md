# Detailed heart anatomy studio

The circulatory landing page retains its credited DBCLS BodyParts3D external
heart and adds an original internal reconstruction. `heart-lab-ui.js` supplies
the accessible markup, `heart-anatomy.js` creates the internal geometry, and
`heart-explorer.js` handles rendering, navigation and selection.

Four investigation tabs:

1. Surface anatomy: major vessels and coronary vessels, with the original six
   discovery rewards. Source IDs, rather than display names, identify each imported vessel.
   Named external coronary branches can also be selected individually.
2. Inside the heart: removable anterior walls, four cavities, distinct wall
   thicknesses, AV and semilunar valves, chordae, papillary muscles, trabeculae,
   pectinate muscles, interatrial/interventricular septa and a closed fossa ovalis.
3. Valve mechanics: four separately enlarged valves, with individual leaflets,
   semilunar nodules, AV supporting cords and papillary-muscle projections. This
   bench is explicitly labelled as a separated study, not anatomical placement.
4. Blood journey: twelve ordered stops with red-cell markers confined to the
   active segment. Oxygenation changes after the off-model lung exchange, not
   within a heart chamber. Systemic gas exchange is also outside the model.

There are 34 selectable structures in six categories: 26 internal structures
and eight external landmarks. The enlarged electrical
pathway includes SA node, AV node, AV bundle/branches and a subendocardial
Purkinje network. Internal discoveries, appendages and blood-journey practice are transient.
The six original surface discoveries retain their once-only 10 XP rewards;
all six named coronary branches/veins share the original coronary discovery.
No new reward IDs, mission state or completion rules are introduced.

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

## Surface and cutaway refinement

`heart-surface.js` maps the atlas source IDs to LAD, RCA, LCA and coronary
sinus; FJ6164 is a duplicate LAD export and is hidden. The added 155,008-byte
`heart-surface-details.glb` supplies the missing circumflex and great cardiac
vein segments from the same licensed atlas, registered against the existing
left coronary mesh. See [source IDs, license and rebuild instructions](../assets/heart-surface-ATTRIBUTION.md).
The base GLB is unchanged. Atrial appendages reuse regions of its existing
atrial tissue; these are teaching selection regions, not clinical segmentations.
The displayed IVC is shortened and an original schematic proximal common carotid
branch completes the three arch branches. No reference image is republished.

The AV annular tissue now bridges each atrium and ventricle to its actual valve
ring. Papillary tips retain their chamber selection IDs. Selecting a semilunar
valve selects its valve tissue without misidentifying the muscular outflow as
valve. Selected leaflets use the same animated surface for their outline.
Pulmonary bifurcation passes posteriorly; twelve separate journey segments
cross the appropriate chamber/valve passages during the correct phase.

Outline culling accounts for the base atlas's inward triangle winding so its
selected tissue keeps its natural colour. Named surface selections use a teal outline, fade
surroundings and offer focus while retaining the chosen viewing direction.
Labels, explanations and controls are authored in English and Arabic.
All extra modules and the additional GLB load only when the heart viewer opens;
the service worker caches them on first use, never in the initial app shell.

Run protected-flow regressions with:

```sh
node _dev-tools/run-critical-checks.js mission-access dashboard teacher-workspace learning-support arabic-coverage pronunciation
npm run test:performance
```

Checks use local fixtures, no production account or service. Geometry checks
cannot establish clinical validity: the model is for school anatomy exploration.

Verification for this refinement (10 November 2026): 240 heart checks; 65 student
progress/dashboard checks; 224 mission access/control checks; 89 teacher workspace
checks; 108 learning-support checks; 899 Arabic audio-policy checks covering 190
spoken parts; zero Arabic gaps across 188 audited views/states; 49 loading/offline
checks; and syntax checks for all 128 JavaScript files. Screenshots cover all
four views, individual external selections, and Arabic at 320/390/768/1440px.
The optional asset rebuild reproduces the checked-in GLB byte-for-byte.

The initial signed-in dashboard transfers 81,069 compressed JS bytes, 35,763 CSS
bytes and 712,327 image bytes, with no 3D model requested. The additional coronary
GLB is 155,008 bytes and loads with the heart viewer. Offline verification forces
the worker's network fetch to fail before refreshing and selecting coronary
anatomy again. Test fixtures block outbound browser requests and use isolated
PostgreSQL, never production accounts or services. Native speech is stubbed for
text/voice-policy verification; device-specific acoustic quality is not certified.
The historical static-server circulatory-art harness was not run: current
protected-flow suites above cover this change without its retired account setup.
