# Muscular activity assets

The source muscles and the elbow model derive from **BodyParts3D 4.3**,
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
