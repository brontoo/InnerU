# Removal of the full-body muscular studio

The owner requested removal of the complete “Meet your movement makers” section
on 24 October 2026. Its full-body model, 23 structure descriptions, region tabs,
model controls, discovery counter, audio controls and source/detail footer are no
longer rendered in English or Arabic. The route manifest no longer loads the
studio's script or stylesheet. Its dedicated renderer/model modules, body-support
GLB and fallback image are deleted.

Only the two studio hooks are removed from `muscle.js`; the remaining lesson code
is byte-for-byte unchanged. The hero, illustrations, tissue comparisons, all
learning sections, the independent elbow movement lab, seven investigations,
final challenge, answers, progression, locks and rewards are preserved. Shared
anatomical source data and `movement-arm.glb` are retained for that arm activity.
Unused locale entries are retained to avoid disturbing shared scientific terms.
No database, authentication, curriculum, other system or permission change is made.

The shell/manifest cache version changes so existing installations receive the
removal. Old optional files are no longer referenced by the portal; unrelated
visited-route caches remain intact.

Run `python3 _dev-tools/verify-muscle-studio.py` with the existing local fixture
prerequisites. This is now a removal regression, checking both languages, refresh,
all remaining section/mission cards, working elbow controls, unchanged learning,
responsive widths and no retired model requests. Existing mission-access,
dashboard, Arabic and loading checks cover the wider portal. Performance and
legacy browser harness selectors now target the retained muscular landing page.

Verification for removal: 43 bilingual removal/preservation checks, 65 dashboard
checks, 113 mission-access/progression/preview checks, zero Arabic gaps across
187 remaining views/states, 47 loading/offline checks and syntax checks for all
122 remaining JavaScript files passed. The source preservation comparison confirms
that `muscle.js` differs only in its two removed studio hooks; the learning/arm
modules and shared arm assets are byte-for-byte unchanged. No API, schema,
permission or other system's lesson implementation was modified.
