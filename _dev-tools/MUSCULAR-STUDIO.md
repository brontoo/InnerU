# Optional muscular rotation

The muscular landing page has a compact **Explore muscles in 3D** section after
its existing hero. It replaces neither the lesson sequence nor the independent
elbow movement activity. The previous "Meet your movement makers" studio,
region tabs and discovery counts remain retired. A right-hand controls/profile panel
now reuses the portal's existing descriptions for 17 major muscles.

The reference informs warm red muscular tissue, pale connective tissue and an
anatomical whole-body presentation. The actual geometry is a complete open atlas,
not a newly invented surface or a reconstruction claimed from one photograph.
The source pose and attachments are retained. Front/back/side presets, pointer
and touch rotation, keyboard turning, zoom, reset and explicitly enabled spin
operate on a real Three.js scene. Full-body inspection has no progress, XP,
evidence, completion, lock or account writes. All original activities remain.

## Loading and accessibility

The lightweight markup/control module and stylesheet load with the muscular
route. The renderer, Three.js and `rotational-atlas.glb` load only after pressing
**Open 3D model**. Successful parsing is reused on returning; each view clones and
cleans up its own geometries/materials, controls, observer subscriptions and GPU
renderer. Rendering stops when idle, offscreen, in a hidden tab or after leaving.
Automatic rotation starts off, and stops when reduced motion is enabled.

Buttons provide alternatives to drag/pinch. Stage focus supports physical left/
right arrows, `+`/`-` zoom and `Home` reset. Arabic controls and messages use the
existing authored catalogue; canvas axes stay physical in RTL. The matching
rendered poster stays available on a failed download or unsupported WebGL.
Failure status offers a retry; no lesson is reset. Context loss also restores
the poster and allows retry. A previously opened model, viewer and poster are
cached through the existing service worker for offline refresh. Unvisited content
retains the existing explicit offline failure behavior.

## Asset provenance and optional build

See [asset attribution](../assets/muscular/ATTRIBUTION.md). The local GLB batches
muscle, tendon/fascia and bone-support geometry into at most twelve small draw batches with 16-bit indices, uses the
existing GLTFLoader's `KHR_mesh_quantization` support and needs no new decoder.
Surface fibre shading is illustrative, not a claim to recover every fascicle.
Source structures remain named in embedded metadata. No external service is
called while viewing anatomy and no production account/DB changes are needed.

To rebuild (not needed for development, tests or deployment): use a separate Python virtual environment with
`numpy==2.3.5` and `fast-simplification==0.1.13`, download the pinned public inputs below outside the
repository, then run from the repository root:

```sh
# Both inputs are from this exact upstream revision:
# https://github.com/JohanBellander/BodyExplorer/tree/cd2a6391d31cf4da663304d671fae138adfd6b2d/public
python _dev-tools/build-muscle-rotator.py \
  --muscles /path/to/anatomy.glb --skeleton /path/to/skeleton.glb \
  --output assets/muscular/rotational-atlas.glb
```

The builder verifies both SHA-256 input hashes. It does not download files, use
Supabase, or modify any other asset. Raw inputs are not shipped as duplicates.
The poster is a direct WebP render of the same model in the portal's viewer.

## Verification

Run `npm test -- muscle-studio` with the existing documented local prerequisites.
It covers both languages at 320, 390, 768 and 1440px, actual model rotations,
keyboard/zoom controls, explicit/reduced motion, preserved lesson DOM and elbow
behavior, unchanged saved learning, deferred/reused requests, retry/WebGL fallback
and previously visited model access after an offline refresh. Screenshots go to
the configurable artifact directory. Wider mission, Arabic and performance
release checks still apply. These asset-build packages are not test or runtime dependencies.

### Verified on 9 November 2026

- 82 focused bilingual viewer/preservation checks; real rendered muscle pixels
  checked after viewport changes, not just the presence of a canvas.
- 57 elbow anatomy/activity checks. The legacy animation harness now observes
  its angle and pauses in the same browser task, fixing a protocol-timing race;
  the elbow implementation and rewards are unchanged.
- Student dashboard, all system/mission lock controls, teacher workspace and
  Guided/read-aloud regressions passed. Strict Arabic audit: zero gaps across
  187 existing views/states; the focused viewer check covers its open Arabic UI.
- 49 cold-loading, direct-route and offline checks passed. Initial dashboard:
  81,024 compressed JS bytes, 35,763 CSS bytes, 712,327 image bytes, zero models.
  The new 10,682,972-byte atlas (about 7.2 MiB gzip) is downloaded only on request;
  its 716,299 triangles are batched into ten draws. The WebP poster is about 34 KB.
- JavaScript/Python syntax and HTML entry-point parity checked. Screenshots of
  front/back/side and narrow English/Arabic layouts are written by the focused
  suite to its configured artifact directory.

No database migration, credentials, server configuration or production data change
is required. Asset-build tools are optional and separate from production/test
runtime dependencies.

## Right-side controls and muscle profiles — 10 November 2026

On desktop the physical model remains on the left and the control/detail panel
stays on the right in both English and Arabic. At widths up to 1100px the panel
stacks below the model. It contains the existing view/turn/zoom/reset/spin tools,
17 keyboard-selectable muscle profiles (location, main function, movement,
everyday example and tissue type), a selected region label, Focus structure,
Show all, and the same single pronunciation control used by the other anatomy
viewers. Details remain readable before opening 3D or when WebGL is unavailable.

The descriptions reuse the existing muscular facts in `body-atlas.js`; authored
Arabic is maintained in `locales/ar/muscle.js`. The pronunciation adapter uses the
shared local browser speech engine and stops the previous name on selection.
No page-wide reader or duplicate instruction/audio bars are inserted here.

Selecting a profile or focusing moves the camera and its label only. Both
`rotational-atlas.glb` and its WebP poster are byte-for-byte unchanged. The GLB
SHA-256 remains `52066023e390604bd3daef4883ea1ec812792547c8697cf8a2d9917af839645d`.
The focused browser test also hashes the mounted geometry buffers and checks
materials/transforms before and after using the new controls. No model rebuild,
new anatomy asset, lesson, reward, progress, database or permission change is made.

Source/cache version changes deliver the panel and its translations to existing
installations; the atlas stays on demand and reuses its existing runtime cache.

Sidebar verification: 167 focused viewer checks passed, including all 17 Arabic
profiles, physical right-side placement, mobile stacking, bounded labels, keyboard
selection, camera focus, shared pronunciation and unchanged model buffers/assets.
The expanded audio suite passed 866 checks across 182 spoken parts, including
every new muscle name. Teacher workspace (89), Guided/read-aloud (108), strict
Arabic coverage (zero gaps across 187 sampled views/states) and all 49 loading/
offline checks passed. The initial dashboard remains within its existing budgets:
81,069 compressed JavaScript bytes, 35,763 CSS bytes and zero model downloads.
An additional context-loss/retry check confirmed that profile selection, label
visibility and saved learning survive recovery.
