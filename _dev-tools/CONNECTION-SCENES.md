# Everyday action and anatomy illustrations

Six original 1536 × 1024 illustrations replace the generic arm, bone, ankle,
sarcomere and skin icons in the two lower sections of System Connections. Each
scene pairs a cheerful, modestly dressed student with an enlarged anatomical
study. Teal sportswear, navy, warm ivory, mint frames and subtle brass details
continue InnerU's portal identity. Original PNGs are retained in the generation
workspace; optimized WebP deployment assets total less than 1.2 MB.

| Activity | Anatomical focus |
|---|---|
| Climbing stairs | Quadriceps, patella, patellar ligament and knee extensors |
| Holding a school bag | Steady elbow-flexor tension, distal biceps tendon, radius and ulna |
| A twisted ankle | Tibia/fibula, talus/calcaneus, anterior talofibular and calcaneofibular ligaments |
| Lifting a school bag | Biceps, distal tendon attachment to radius, opposing triceps |
| Running | Lungs, heart and skeletal muscle as separate connected teaching studies |
| Moving in hot weather | Eccrine gland and surface duct, dermal circulation and evaporation |

The anatomical studies preserve the distinction between tendon and ligament,
identify the radius as the biceps insertion and the olecranon as the triceps
insertion, describe approximately isometric holding separately from lifting,
and explain that evaporation supplies sweat's main cooling effect. The running
scene has no diagram arrows that could imply a blood route bypassing the heart.
Its explanation distinguishes lung exchange, right/left heart pumping and
muscle ATP use. Structure markers are calibrated to the final image coordinates.

Reference framework: OpenStax *Anatomy and Physiology 2e*, chapters 5 (skin),
9 (joints), 11 (appendicular muscles), 19–20 (heart/circulation) and 22 (respiration).
The illustrations are enlarged teaching reconstructions, not anatomical scans.

`connection-art.js` wraps the existing connection-page renderer after the muscular
extension. It changes only the six illustrated cards. Each native disclosure
reveals the relevant system team and explanation; an anatomy lens presents three
selectable structures, a numbered location marker and optional magnification.
Previous/next controls browse all six scenes without course prerequisites.
Escape closes the modal; Tab/Shift+Tab cycle within it, close restores focus,
and arrow keys/Home/End navigate structure selections. Original system matching,
written reflection, prerequisites and once-only 35 XP reward remain in place.
Browsing the cards and anatomy lens never writes learner progress.

Decorative discovery sparkles animate only near the viewport. They pause when
the tab is hidden or the lens is open. A local pause control, the existing app
motion preference and system reduced motion stop animation. No anatomical mesh
is deformed to imply physiological movement. Listeners and observers are disposed
when the page is removed. Layout changes from three columns to two at 900px and
one at 600px; phone footer links wrap. Both entry points and offline shell v29
include the versioned module and CSS. Images enter the existing offline asset
cache after being viewed.

Run `python3 _dev-tools/verify-connection-scenes.py` with Playwright and Chromium.
It exercises all six disclosures/lenses, all 18 structure selections, magnification,
keyboard and modal navigation, motion settings, five screen widths, read-only
exploration, route cleanup and the existing complete 35 XP connection challenge.
