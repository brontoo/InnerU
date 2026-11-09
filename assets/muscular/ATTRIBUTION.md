# Muscular activity assets

The retained `anatomical-muscles.glb` and elbow model derive from **BodyParts3D 4.3**,
© Database Center for Life Science (DBCLS), licensed under
[Creative Commons Attribution–ShareAlike 2.1 Japan](https://creativecommons.org/licenses/by-sa/2.1/jp/).
Original project: https://lifesciencedb.jp/bp3d/
Download information: https://dbarchive.biosciencedbc.jp/en/bodyparts3d/download.html

`anatomical-muscles.glb` is retained as the source input for the independent elbow
activity's reproducible extraction script. `movement-arm.glb` remains its unchanged
runtime asset. The retired full-body studio, its body-support GLB and fallback
render were removed on 24 October 2026; they are not part of the portal UI.

## Elbow movement activity

`movement-arm.glb` extracts the left clavicle, scapula, humerus, radius and ulna,
two biceps-brachii heads and three triceps-brachii heads from the same existing
BodyParts3D atlas assets. Transforms are baked into a local elbow coordinate
system, and distal muscle tips are trimmed for reconstructed tendon routes.
Procedural skinning, tendons, movement cues and the interactive SVG are original
teaching adaptations. These adapted anatomy assets remain under CC BY-SA 2.1
Japan. The reproducible extraction script is `_dev-tools/build-arm-asset.py`.

## Optional rotational atlas (November 2026)

`rotational-atlas.glb` and its directly rendered `rotational-atlas.webp` preview
adapt the anatomical mesh data distributed by
[Body Explorer](https://github.com/JohanBellander/BodyExplorer/tree/cd2a6391d31cf4da663304d671fae138adfd6b2d),
commit `cd2a6391d31cf4da663304d671fae138adfd6b2d`.
No application code or framework from that project is included.

- **BodyParts3D**, © The Database Center for Life Science (DBCLS),
  [CC BY-SA 2.1 Japan](https://creativecommons.org/licenses/by-sa/2.1/jp/).
- **Z-Anatomy**, © Gauthier Kervyn and contributors,
  [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/).
  Original project: https://www.z-anatomy.com/

The upstream `anatomy.glb` contains 401 BodyParts3D and 66 Z-Anatomy source
meshes; `skeleton.glb` supplies BodyParts3D skeletal support. The upstream
mapping and provenance remain available at the pinned source. Each dataset
retains its attribution and ShareAlike terms. These adapted mesh data and the
rendered preview are provided under the corresponding source ShareAlike
licenses; portal code is not part of those anatomy datasets.

InnerU changes: triangle simplification, millimetre/Z-up coordinate conversion,
tissue-based batching, position/normal/UV quantization, warm muscle and pale
connective-tissue/support colors, and a subtle visual fibre shading texture.
No muscle attachments or pose are procedurally replaced. The model keeps the
source atlas stance; the user's supplied image guides the appearance rather
than serving as a recoverable 3D scan. This is a simplified teaching atlas,
not a patient-specific or clinical model.

The embedded GLB metadata lists all retained source structures. The reproducible
build and pinned input checksums are in `_dev-tools/build-muscle-rotator.py`.
The existing elbow assets and their attribution above are unchanged.
