# Muscular anatomy studio

The muscular landing page inserts the new studio **immediately after its hero**,
before the existing learning sequence. It uses local Three.js / OrbitControls,
with two local GLBs and no external model service. It is a genuine rotatable,
ray-pickable 3D model, independent of the legacy shared body-atlas renderer.

Six keyboard-accessible tabs organize 23 structures into whole body, neck,
shoulders/arms, chest/core, back and hips/legs. Selection turns toward the
appropriate anterior/posterior view, frames the structure and colors it teal.
Other muscle meshes become transparent. Labels, direct picking, front/back,
auto rotation, zoom, focus and reset operate on the same live scene.

The smooth head, neck, hands and feet retain their mannequin material. The head
has no exposed facial muscles, teeth, skull or eyes. Matte coral muscle materials
have fine fascicle shading and illustrative pale attachment regions. The paired
rectus abdominis includes tendinous intersections. The broad forearm flexor,
forearm extensor, hamstring and erector-spinae groups are teaching regions,
not exhaustive constituent muscles or a layered dissection. Tibialis anterior is
anterior; gastrocnemius, soleus and the Achilles tendon are posterior. The tendon
is explicitly described as non-contractile connective tissue.

Opaque shorts cover the pelvis, hips and proximal thighs through every view and
selection. Clothing is excluded from the transparency logic, writes depth and
occludes ray picking. Gluteus maximus is included as a **covered region**: the
shorts highlight at the hips and its action/attachments remain readable. There is
no undress control. Protected portions of the body-support template have also
been removed from the shipped GLB, not merely hidden behind a translucent mesh.

The main muscle meshes derive from DBCLS BodyParts3D 4.3, recovered from the
repository history; additional regions are original body-surface reconstructions.
See `assets/muscular/ATTRIBUTION.md` for attribution and the asset license.
Descriptions follow OpenStax *Anatomy and Physiology 2e*, Chapter 11. These are
major muscles of a teaching atlas, not all human muscles or a patient scan.

Discovery counts stay within the current studio visit. Browsing does not write
progress, grant XP, answer questions or unlock missions. The existing muscular
lesson progression, seven investigations and final evaluation remain intact.

The studio observes viewport and page visibility to pause rendering, disposes
geometry/materials/listeners when the route is removed, and respects reduced
motion. Auto rotation starts off; it can be deliberately enabled. If WebGL or a
model download fails, a render of the same covered mannequin replaces the canvas,
and all six tabs, 23 anatomy descriptions and attachment notes remain usable.
The matching HTML entry points and offline worker reference versioned modules;
service worker v18 refreshes the shell.

Run `python3 _dev-tools/verify-muscle-studio.py` for functional, geometry, garment
coverage, progress preservation, mobile, reduced-motion and fallback checks.
