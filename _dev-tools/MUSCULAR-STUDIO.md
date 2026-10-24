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

The owner-supplied anterior/posterior reference guides the new superficial
appearance: warm red muscle bellies, directional fascicles, pale attachment tissue,
a gently abducted arm stance, and opaque navy shorts. The existing BodyParts3D
muscles remain the anatomical foundation. No paid service or new model download is
introduced, and neither GLB is replaced.

`muscle-reference-surfaces.js` adds original teaching reconstructions: rounded
shoulder/arm bellies; a closed torso/limb support fitted to the atlas (replacing
mismatched template fragments); an adult-proportioned head with orbital, cheek,
nasal and jaw contours; superficial facial context; patellar and aponeurotic detail;
and tendons projected onto the extremity surfaces. Facial and connective-tissue
context does not become another selectable muscle or learning objective. The
posterior head remains a neutral cranial surface. The arms are spread slightly
using the same continuous deformation for muscles, support and extremities.

Four paired rectus bellies make its intersections visible in relief. Material
fibres follow the fan of pectoralis/latissimus, trapezius subdivisions, oblique
fibres and facial regions. Atlas parts are batched by structure and side, retaining
left/right anchors and all 23 IDs rather than adding draw calls per small part.
Major groups remain simplified: no claim is made to reconstruct every muscle,
patient-specific attachment or a clinical dissection. Tibialis anterior remains
anterior; gastrocnemius, soleus and Achilles remain posterior. Achilles is still
explicitly non-contractile connective tissue.

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
model download fails, a render of the same covered model replaces the canvas,
and all six tabs, 23 anatomy descriptions and attachment notes remain usable.
The matching HTML entry points and offline worker reference versioned modules;
offline shell versions advance with each release.

Run `python3 _dev-tools/verify-muscle-studio.py` for functional, geometry, garment
coverage, progress preservation, mobile, reduced-motion and fallback checks.

## Reference rebuild verification

The focused studio harness additionally checks paired anatomy after deformation,
facial/fascial/extremity geometry, the navy garment, overhead/underneath/diagonal
coverage, and removal of the temporary loading reader. Before/after anterior and
posterior captures are review artifacts. The fallback WebP is rendered from the
actual current Three.js scene using browser-native WebP export, replacing the
existing image rather than adding a duplicate asset. No reference photo is used
as a flat stand-in for the model.

The visual reference guides appearance; these are educational reconstructions,
not a validated medical model or an exact reproduction of the supplied artwork.
The unchanged lesson checks, XP, progression, mission locks, teacher previews,
keyboard controls and reduced-motion preferences continue to use existing code.

Projected labels measure their actual translated size, wrap longer names and stay
inside the stage below the active selection badge. A resize observer handles late
fonts and language changes. Their projected anatomical coordinates are retained;
RTL never mirrors the body. The completed loading message's temporary Listen
control is removed instead of remaining over the view label.

Final local checks on 23 October 2026:

| Check | Result |
|---|---|
| Muscular studio | PASS — 108 assertions, including 213 covered samples tested from eight directions; zero uncovered samples |
| Teacher workspace/class isolation | PASS — 89 assertions |
| Guided mode/accessibility/read-aloud | PASS — 108 assertions |
| Strict Arabic coverage | PASS — zero gaps across 203 views/states |
| Loading, lazy routes and offline | PASS — 47 assertions; initial dashboard fetches no viewer/model code |
| JavaScript syntax | PASS — 126 tracked/new files, plus explicit ESM parsing of the three changed model modules |
| Patch/Python syntax | PASS — `git diff --check` and harness compilation |

Tests use loopback fixtures and isolated PostgreSQL only, with Chromium viewport
emulation. Physical devices, other browser engines and professional anatomical
validation are not covered. No production data or schema was changed. The two
existing GLBs are unchanged. The matching fallback was replaced in place (about
45 KiB); no duplicate production image/model was added.

Review renders and before/after screenshots are in
`/tmp/inneru-muscle-reference-review/index.html`; focused studio artifacts are in
`/tmp/inneru-muscle-reference-verified/`. The three affected release-suite results
are in `/tmp/inneru-muscle-reference-release/summary.json`, and the final loading
log is `/tmp/inneru-muscle-reference-performance-final.log`.

Changed files: `muscle-model.js`, new `muscle-reference-surfaces.js`,
`muscle-explorer.js`, `muscle-atlas-ui.js`, `muscle-studio.css`,
`route-manifest.js`, `locales/ar/muscle.js`, `locales/README.md`,
`assets/muscular/classroom-model.webp`, `assets/muscular/ATTRIBUTION.md`,
`_dev-tools/verify-muscle-studio.py` and this report. No migration or new dependency
is required. The implementation was prepared on `feat/muscle-reference-model` before
publication. Subsequent releases are recorded in GitHub commit/deployment history.

Publication preparation on 24 October 2026 advances the essential shell to v56
and versions both HTML entry points’ route manifest. Visited runtime assets remain
cached; installed copies receive the new model module graph. Fresh studio (108),
loading/offline (47) and JavaScript syntax (126 files) checks passed before push.
