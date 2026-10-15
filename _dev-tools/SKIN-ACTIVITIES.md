# Living Shield activity studio

`integ-activities.js` supplies the illustrated games and science-check markup;
`integumentary.js` owns routing, lesson content and saved learning progress.
The activities use the original mission illustrations plus six new three-part
medical illustration sheets in `assets/integ-activities/`. The 18 scientific
studies cover the concepts in the 18 mission checks. Final stages reuse the
relevant study. Native source proportions are retained for each sheet.

The missions use different interactions:

1. Match epithelial, connective, smooth-muscle and nervous tissue to the skin.
2. Assemble the layers from outside inward, then identify basal epidermal renewal.
3. Connect sebaceous secretion, hair growth, sweat and nail growth to their destinations.
4. Predict responses to heat, cold and sunlight.
5. Match barrier, pigment, sensory and vascular responses to an incoming challenge.
6. Follow repair checkpoints, then classify superficial, partial-thickness and
   full-thickness burn patterns.

Animations show illustrative routes, evaporation, outward cell differentiation,
partial UV protection and sensory/vascular responses. They are teaching cues,
not measured transport speeds. Healing phases overlap. Goose bumps add little
warmth in humans, melanin does not give complete UV protection, the epidermis
has no blood vessels, and full-thickness burns need urgent care. Calcium markers
illustrate intestinal absorption; intestinal tissue is not shown as bone.

Every objective has a click/tap or keyboard path. Layer assembly also accepts
drag and drop. There are no timed answers, forced automatic advancement, or
penalties for an incorrect attempt. Animation can be paused; reduced-motion
users start with still routes and can explicitly play them. The app’s own motion-off
setting remains authoritative. Off-screen games
pause their animation, and route changes disconnect their event handlers and
visibility observer, including when another body system replaces the page.

The existing progress keys and reward IDs are retained. A lab earns 20 XP,
each mission check 7 XP, each fragment 25 XP, each final stage 8 XP, and the
system key 50 XP. Replays never award a previously earned reward again.
The `?preview=1` fragment parameter opens all missions and the final challenge
using a separate in-memory practice record; it does not write saved answers,
weak-topic records, XP or mission completion. In-page mission links retain the
preview state. A page refresh starts a fresh practice record.

Run `python3 _dev-tools/verify-skin-activities.py` with Python Playwright and
Chromium installed. This uses isolated browser storage and a read-only local
server. It exercises wrong choices, all objectives, drag and keyboard alternatives,
all 18 mission checks and eight final stages, preview isolation, gating, exact
reward totals, reload/replay behavior, actual route animation, reduced motion,
mobile/tablet layout and integration with the existing 3D studio.
