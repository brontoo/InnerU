# Respiratory card anatomy studies

The six respiratory mission cards and final challenge use seven original
1536 × 1024 illustrations in `assets/respiratory-missions/`. The optimized WebP
assets together are under 2 MB. Source PNGs remain outside the deployment.

The studies match the actual mission content:

1. Anterior lungs, lobar fissures, bronchial cutaway and diaphragm.
2. Sagittal upper-airway anatomy beside a separately scaled bronchial tree.
3. Hollow alveoli and capillaries, with a magnified air–blood barrier.
4. Paired thoracic specimens: lower diaphragm during inhalation and higher dome
   during quiet expiration.
5. Pulmonary exchange, biconcave red cells, a tissue capillary and muscle, with
   an enlarged mitochondrion to connect transport with cellular energy.
6. Airway narrowing, bronchial inflammation/mucus, alveolar septal loss and fluid
   within alveoli, corresponding to the mission’s four affected-structure cases.
7. An integrated lung → alveolar exchange → blood delivery → working-cell plate.

These are teaching reconstructions, not patient images. Organ, tissue, cell and
organelle scales differ; illustrated barrier thickness is not a measurement.
The airway route, diffusion directions, partial-pressure gradients, hemoglobin
carriage and quiet breathing are explained outside the images. The patient’s right
is on the viewer’s left in anterior organ views. The affected-tissue studies
describe mechanisms and do not diagnose an individual. Existing lessons, questions,
rewards, progression gates and the respiratory 3D studio are unchanged.

`resp-map-art.js` injects artwork only on the respiratory landing board. CSS is
scoped to `.resp-map`, since other worlds reuse `.resp-card`. Every card, including
locked ones, has a native enlarged study dialog with four anatomy keys and three
selectable regional explanations. Numbered markers locate those regions. Previous
and next controls browse all seven studies without writing learner state.

The fully colored pictures use `object-fit: contain`; controls sit below them.
Gentle focus rings and hover movement maintain the game style. Pause controls,
reduced-motion preferences, viewport observation, document visibility and modal
state control motion. Route cleanup disconnects observers and listeners. Cards
and dialogs fit 320px screens, and the respiratory board’s header/footer wrap.

Run `python3 _dev-tools/verify-respiratory-cards.py` with Playwright, Chromium and
Pillow. It serves the actual site in an isolated profile, loads every image,
exercises all seven guides and 21 region controls, checks storage preservation,
keyboard focus, animation preferences, responsive layouts, mission gates, first
mission completion/rewards, final routing, cleanup and neighboring-world scope.
It also checks every offline shell URL and both HTML entry points, exits nonzero
on failure and shuts down its own server.
