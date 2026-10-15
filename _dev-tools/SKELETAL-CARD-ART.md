# Skeletal mission card studies

The seven mission cards and final athlete case use original medical illustration
assets in `assets/skeletal-missions/`. The card artwork is deliberately independent
of `missionArt()` and the interactive lesson diagrams: joint movement, skeletal
selection, bone hotspots, fracture sequencing, mission gates and reward IDs retain
their existing behavior.

The studies follow the current lesson content and its OpenStax references:

- Adult skeleton and enlarged thorax: axial and appendicular relationships.
- Femur, sternum, carpals and vertebra: long, flat, short and irregular examples.
- Long-bone cutaway and osteon: compact cortex, trabecular bone, marrow,
  periosteum and microscopic organization.
- Shoulder and elbow: ball-and-socket and hinge articulations with supporting tissue.
- Osteoclast, osteoblasts and osteocytes: resorption, osteoid formation and the
  living bone matrix.
- Four repair specimens: hematoma, soft callus, hard callus and remodeling.
- Four case studies: cartilage, synovium, bursa and lateral ankle ligament.
- Athlete case: the ankle bones and lateral ligament complex.

These are anatomical teaching reconstructions with enlarged microscopic details
and independently scaled specimens. Cell and tissue colors support identification;
they are not patient scans or measurements. Healing phases overlap. The fictional
clinical cases retain the evidence and explanations from the existing lessons.

`skeletal-map-art.js` supplies card markup and a native full-size study dialog with
anatomy keys and lesson explanations. Studying a locked card is independent of
mission entry and never saves progress or awards XP. Artwork stays fully colored
and uses `object-fit: contain`. Small animated focus cues and hover movement retain
the game presentation; a card-animation control, reduced-motion preferences,
visibility checks and route cleanup limit unnecessary movement.
