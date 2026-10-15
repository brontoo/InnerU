# Excretory anatomical discoveries

Seven original 1536 × 1024 anatomical studies are delivered as WebP files in
`assets/excretory-missions/` (approximately 1.8 MB combined). Generated PNG sources
are retained outside the deployed repository in `/workspace/generated_images/`.

The six mission cards open a native dialog independently of expedition locks.
Every lab includes its matching study, numbered structures and an explanation.
The six kidney-care files use individual crops of the comparative plate; the
treatment studio has a separate hollow-fibre dialyzer study. All 18 mission checks
and eight final decisions have an inspection link with a relevant anatomical crop.

`excretory-art.js` owns the artwork, 31 structure descriptions, transient discovery
badges, process diagrams and motion controls. It never calls `save`, `reward` or
any storage API. Existing lesson questions, reward IDs, prerequisites and preview
completion logic remain in `excretory.js`.

Scientific relationships represented in authored overlays:

- Waste sorting selects lungs, sweat glands or kidneys. The organ specimens are
  separate studies, not parts of a connected waste pipe.
- Small solutes cross the glomerular barrier into the first filtrate. Blood cells
  and most large proteins remain in the capillary lumen.
- Reabsorption moves tubule → interstitium → blood. Secretion moves the opposite
  way. Net urea waste continues toward urine; some urea is reabsorbed.
- The actual ADH slider changes the visible principal-cell water channels and
  relative water return. Channel counts and outputs are qualitative.
- The separate acid–base detail identifies an alpha intercalated cell; it does
  not attribute hydrogen-ion secretion to the ADH principal-cell diagram.
- Dialysis blood and dialysis fluid occupy separate compartments. Membranes
  retain cells and most proteins; pressure governs fluid removal.
- The water audit uses 180 L of **filtrate**, not blood volume. Approximate adult
  output is 1.5 L daily after 178.5 L returns to blood.

Motion pauses when illustrations leave the viewport, the tab is hidden, a guide
is open, the user pauses, or either app/system reduced motion is enabled.
Route disposal stops SVG timelines and disconnects observers and listeners.
Stationary particles start within their physiological compartment even before
an SVG animation begins. Structure buttons provide 44-pixel alternatives to the
numbered image pins on small screens.

Verification:

```sh
node --check excretory-art.js
node --check excretory.js
python3 _dev-tools/verify-excretory-art.py
python3 _dev-tools/verify-excretory.py
```

The second browser harness also verifies all lab completions, free-preview
storage isolation, nonduplicate XP, persistent keys, mobile layouts, and the
existing 3D anatomical relationships, selection transparency and fallback.
