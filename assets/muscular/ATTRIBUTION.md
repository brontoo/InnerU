# Muscular anatomy studio assets

The anatomical muscles and body support are adapted from **BodyParts3D 4.3**,
© Database Center for Life Science (DBCLS), licensed under
[Creative Commons Attribution–ShareAlike 2.1 Japan](https://creativecommons.org/licenses/by-sa/2.1/jp/).
Original project: https://lifesciencedb.jp/bp3d/
Download information: https://dbarchive.biosciencedbc.jp/en/bodyparts3d/download.html

The source meshes were already present in InnerU's Git history before commit
257a0eb removed the earlier muscular explorer assets. This release extracts the
anatomical muscle meshes and the body template from that history. It removes the
old silhouette, the old head and protected pelvic / upper-thigh template regions.
The supported model adds original smooth mannequin features and opaque shorts.
Additional superficial muscle regions follow the body surface; material shading,
selection colors, procedural garments and the Achilles tendon are teaching
reconstructions. See `muscle-model.js` and `_dev-tools/MUSCULAR-STUDIO.md`.

These adapted model assets and `classroom-model.webp` (rendered from the same 3D
model) are distributed under CC BY-SA 2.1 Japan. Changes are described above.

## Elbow movement activity

`movement-arm.glb` extracts the left clavicle, scapula, humerus, radius and ulna,
two biceps-brachii heads and three triceps-brachii heads from the same existing
BodyParts3D atlas assets. Transforms are baked into a local elbow coordinate
system, and distal muscle tips are trimmed for reconstructed tendon routes.
Procedural skinning, tendons, movement cues and the interactive SVG are original
teaching adaptations. These adapted anatomy assets remain under CC BY-SA 2.1
Japan. The reproducible extraction script is `_dev-tools/build-arm-asset.py`.
