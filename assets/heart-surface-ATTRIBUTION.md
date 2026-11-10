# Heart surface additions

`anatomical-heart.glb` retains its existing credited DBCLS BodyParts3D surface.
It has not been changed by this refinement.

`heart-surface-details.glb` adds 14 BodyParts3D segments from the same anatomical
coordinate system, © Database Center for Life Science (DBCLS), licensed under
[Creative Commons Attribution-ShareAlike 2.1 Japan](https://creativecommons.org/licenses/by-sa/2.1/jp/).
These adapted surface additions are distributed under that license.

Source: [BodyParts3D](https://lifesciencedb.jp/bp3d/), with OBJ exports retrieved
from the public [jixiangying/anatomy mirror at the pinned revision](https://github.com/jixiangying/anatomy/tree/be67a977abe25a36f59793fda86a506618fd4d27/isa_BP3D_4.0_obj_99).
Each OBJ header identifies DBCLS, license, anatomical English name and source ID.

- Circumflex artery: FJ2649, FJ2650, FJ2651, FJ2653, FJ2654.
- Great cardiac vein and its anterior interventricular segments: FJ2656,
  FJ2658, FJ2659, FJ2660, FJ2661, FJ2662, FJ2663, FJ2664, FJ2665.

The GLB embeds each source name and SHA-256 checksum, the pinned revision and
registration transform. Coordinates map as `[x,z,-y] × 0.01 + [-0.1,-12.25,-1.2]`.
Registration against the existing FJ2737 left coronary artery gives a maximum
vertex discrepancy below 0.00002 model units. Mesh positions and topology are
retained; smooth normals and teaching materials are added. No source OBJ files
or duplicate copies of the existing heart are shipped.

Rebuild after obtaining these licensed OBJ files:

```sh
python3 _dev-tools/build-heart-surface-details.py --source /path/to/obj-directory
```

NumPy is needed only for this optional asset build, not for application runtime
or browser checks. No network request is made by the build script.

`heart-surface.js` separately adapts the existing display: it hides a duplicated
LAD export (FJ6164), shortens the displayed inferior vena cava, identifies
teaching selection regions on the existing atrial appendages, and adds an
original schematic proximal left common carotid branch. Appendage selection
regions are visual teaching regions, not clinical segmentations. The original
internal cutaway and enlarged valve bench are separate teaching reconstructions,
not registered patient-specific anatomy. Material colours and fine structures
are adapted for visibility. These limitations also apply to the interactive
highlighted views.

## Registered internal atlas

`heart-interior.glb` contains 20 additional BodyParts3D structures, with the same
DBCLS attribution, CC BY-SA 2.1 Japan license, pinned source revision and coordinate
registration described above. Each node retains its primary OBJ header's anatomical
name; SHA-256 checksums of the inputs are embedded in GLB provenance metadata.

- Four cavities: FJ2422 (LV), FJ2423 (RV), FJ2424 (RA), FJ2425 (LA).
- Mitral valve with attached chordal tissue: FJ2420, FJ2432.
- Tricuspid valve with attached chordal tissue: FJ2421, FJ2433, FJ2436.
- Aortic cusps: FJ2426, FJ2431, FJ2435.
- Pulmonary cusps: FJ2417, FJ2427, FJ2434.
- Papillary structures: FJ2418, FJ2419, FJ2429, FJ2430, FJ2437.

Primary source names are retained rather than the secondary manifest's occasionally
different papillary names. The displayed ventricular/atrial walls and great vessels
reuse `anatomical-heart.glb`; no second copy of that asset is deployed. This
registered atlas replaces the procedural chamber geometry in **Inside the heart**.

Rebuild using NumPy (asset build only):

```sh
python3 _dev-tools/build-heart-interior.py --source /path/to/obj-directory
```

Adaptations in `heart-atlas-cutaway.js`: curved anterior-oblique dissection;
section closure from actual wall intersections; superficial root windows; natural
teaching materials; and selection partitions on existing tissue. Cavity envelopes
appear when inspecting their chamber. Lower chordal tissue remains part of the
original leaflet geometry, with a separate teaching selection region. Septal,
fossa and chordal selection boundaries are instructional regions, not clinical
segmentations. Small endocardial ridge and conduction overlays are teaching
annotations registered to the atlas, not additional scanned tissue. The atlas
is a fixed reference pose. The original animated valve bench and blood-flow
reconstruction remain separate, clearly labelled teaching investigations.
