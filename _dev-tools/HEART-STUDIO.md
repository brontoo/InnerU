# Heart anatomy studio

The circulatory landing page provides four investigations using the existing
Three.js loader, roles and learning state. `heart-lab-ui.js` supplies accessible
markup; `heart-explorer.js` controls rendering, selection and loading.

1. **Surface anatomy** uses the existing DBCLS BodyParts3D exterior and named
   coronary additions. The original six vessel discoveries still award 10 XP
   each once. Coronary child selections share the original coronary credit.
2. **Inside the heart** now uses registered atlas geometry: the existing heart
   wall plus four cavity envelopes, eleven valve leaflets/cusps with attached
   chordal tissue, and five papillary structures. It does not use the former
   procedurally lofted chambers. `heart-atlas-cutaway.js` builds a curved anterior
   dissection, preserving the apex, wall thickness and actual oblique valve
   relationships. Cut surfaces follow the real wall intersections. Restoring the
   front wall restores removed tissue and root-window portions.
3. **Valve mechanics** retains the separate enlarged teaching bench from
   `heart-anatomy.js`: two mitral leaflets, three tricuspid leaflets, and three
   cusps per semilunar valve. Its pressure-based phases and AV cord animation
   remain available, including keyboard/manual controls and reduced motion.
4. **Blood journey** retains the original independent teaching reconstruction
   and twelve physiological route segments. It is not a motion simulation of
   the fixed atlas pose; the footer distinguishes the two investigations.

The atlas pose links directly to Valve mechanics rather than showing a phase
scrubber that could falsely imply that the reference mesh depicts every cardiac
phase. Surface, inside, valve bench and flow remain individually labelled tabs.
No mission content, answers, XP rules, locks, account permissions or data model
are changed. Internal exploration and changing cameras never award points.

There are 34 selectable structures. Natural tissue remains clear while context
fades to 3.5%, or 22% with Keep surrounding anatomy. Source winding is respected
so the highlight does not obscure tissue colour. Focus uses actual atlas bounds;
rotation and anatomical left/right directions remain physical in Arabic too.

## Source and adaptations

See [source IDs, license and optional rebuild instructions](../assets/heart-surface-ATTRIBUTION.md).
`anatomical-heart.glb` is byte-for-byte unchanged. The additional
`heart-interior.glb` is 913,956 bytes and contains only twenty missing internal
structures, with primary source names, per-input SHA-256 hashes and pinned
revision `jixiangying/anatomy@be67a977abe25a36f59793fda86a506618fd4d27`.
The original shared transform is `[x,z,-y] × .01 + [-.1,-12.25,-1.2]`.

Inside geometry retains the atlas coordinates. Rendering removes near-side
triangles and closes section edges from actual wall contours; it does not invent
new cup-shaped cavities or relocate the valve leaflets. Chamber inspection uses
its original cavity envelope. Individual selection regions for septal tissue,
fossa ovalis and attached chordal tissue are teaching regions, not clinical
segmentations. Endocardial ridges and electrical paths are small educational
overlays registered to the actual chamber surfaces. Fine features are simplified
for school use; this is not a clinically validated patient model.

The papillary source names are taken from the OBJ headers, not the secondary
manifest (which gives different names for some structures). The viewer groups
these source parts as Papillary muscles without inventing a source-specific
clinical label. AV cords remain the source tissue attached to AV leaflets;
semilunar cusps never gain cords or papillary supports.

NumPy is needed only to rebuild the optional asset. Production and browser tests
have no new dependency. No raw OBJ copies or reference images are deployed.

## Loading and accessibility

The internal GLB and its preparation module load only when Inside the heart is
first opened. Both the parsed source and constructed atlas are reused. A request
generation guards asynchronous view changes. Failure preserves the illustration,
structure explanations and a labelled retry action; a failed ES module requests
an ordinary page reload on retry so the browser's failed-import cache is cleared.
Already visited atlas geometry and modules work after offline refresh. The
service worker caches them at use time, never in the installation shell.

English/Arabic labels, keyboard selection, focus and read-aloud continue through
the existing locale/speech layers. All new reference-pose, loading, error and
attribution text has authored Modern Standard Arabic. Motion is user activated;
reduced motion retains manual views. Renderer cleanup also releases the cached
atlas and parsed source geometry when leaving the route.

## Verification

```sh
npm test -- heart-studio
npm test -- dashboard mission-access teacher-workspace learning-support arabic-coverage pronunciation
npm run test:performance
```

Use the prerequisites in [the verification guide](README.md). Fixtures block
outbound browser requests and use isolated local PostgreSQL. They never use
production accounts or services. Native speech is intercepted for text/voice
policy checks; these tests do not certify device-specific acoustic pronunciation.

The heart harness verifies actual source IDs, cavity/leaflet/papillary geometry,
section closure, retained apex, all internal and external selections, ghosting,
keyboard/ray controls, wall restoration, independent valve mechanics, 320/390/
768/1440px Arabic views, learning/reward preservation, one-time loading, retry,
view races, disposal, non-WebGL fallback and truly offline atlas refresh. Existing
procedural geometry invariants remain tests of the separate valve/flow teaching
reconstruction, rather than being presented as proof of the atlas anatomy.

## Verified results — 11 November 2026

- Heart studio: 267 checks, including the actual registered atlas, complete wall/
  support restoration, named selections, retry/races and offline refresh.
- Student dashboard: 65 checks; mission access and teacher controls: 224;
  teacher workspace and class isolation: 89; Guided/language support: 108.
- Arabic audio policy: 899 checks over 190 spoken parts. Strict Arabic audit:
  zero untranslated occurrences across 188 views/states.
- Loading/offline budget: 49 checks. Initial dashboard: 81,067 compressed JS
  bytes, 35,763 CSS bytes, 712,327 image bytes and zero model bytes. The new
  internal model is fetched only after its own tab opens.
- All 129 JavaScript files pass `node --check`; Python verifier/builder compile;
  `index.html` and `404.html` retain identical content.

Screenshots capture the atlas, individual selections and 320/390/768/1440px
Arabic layouts in the chosen `INNERU_TEST_ARTIFACT_DIR`. These are focused local
release regressions, not a clinical or device-wide acoustic certification. The
historical static-server circulatory-art harness and unrelated release suites
were not rerun for this anatomy-only change.
