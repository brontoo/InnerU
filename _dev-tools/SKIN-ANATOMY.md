# Living-skin studio

The integumentary landing page now mounts `skin-explorer.js` with geometry from
`skin-model.js`. Its lifecycle is independent of the shared skeletal, muscular
and respiratory atlas renderer. The older exploded skin GLB is no longer used
on this page. All geometry, tissue textures and lighting are generated locally;
the interactive studio does not require an external model service.

## Anatomical choices

- The initial view is a connected cutaway of hairy skin. The thin epidermis
  meets the thicker dermis at an undulating junction. Fat lies below the skin
  proper. Tissue layers separate only in the dedicated layer view.
- Vascular loops remain beneath the epidermis. Red and blue distinguish
  arterial and venous routes; both carry blood that is red.
- The follicular sheath opens toward the section face to expose the root and
  bulb. A small dermal papilla reaches the bulb from below. Sebaceous lobules
  connect to the upper follicle; the arrector pili runs obliquely to the upper
  dermis.
- The eccrine secretory coil connects continuously to a duct that opens at
  the skin surface, independently of the follicle. Cyan markers trace that
  route. The cooling explanation connects sweat evaporation with heat loss.
- The touch example is a hair-root nerve plexus, appropriate to hairy skin.
  It is not a Meissner corpuscle, which is characteristic of glabrous skin.
  A deeper lamellated receptor illustrates pressure/vibration sensation.
  Golden markers travel away from the follicular plexus into a deeper nerve.
- Microscopic receptors, vessels and glands are enlarged for inspection. This
  is an original teaching reconstruction, not a patient scan, a histological
  measurement or a simulation of physiological transport speeds.

General anatomical references: OpenStax *Anatomy and Physiology 2e*,
[5.1 Layers of the Skin](https://openstax.org/books/anatomy-and-physiology-2e/pages/5-1-layers-of-the-skin)
and [5.2 Accessory Structures of the Skin](https://openstax.org/books/anatomy-and-physiology-2e/pages/5-2-accessory-structures-of-the-skin).

## Interaction and rendering

Four keyboard-accessible tabs provide the connected cutaway, tissue layers,
hair/glands and sensation/supply. Eleven structures can be selected by name,
on-model label or actual mesh picking. Selection retains opaque natural color
and a teal outline while other anatomy becomes transparent. Focus, front/back,
zoom, rotation, label visibility and reset controls operate on the live model.

The function lab offers sweat/circulation and touch routes with pause/play.
Reduced-motion users receive still markers until they choose to play. The
scientific illustration and explanations remain available without WebGL.
Exploration never awards XP, changes mission locks or writes learning progress.

Material batching reduces draw calls while retaining selectable structure
identity. Lighting uses local studio reflections, physical materials and
shadows. Still views render on demand; animated routes and active camera
controls render continuously. Rendering pauses outside the viewport or when the
page is hidden; route changes dispose geometry, textures, controls and the renderer.

## Verification

Run `python3 _dev-tools/verify-skin.py` with Python Playwright and Chromium.
The script serves the repository read-only and uses isolated browser profiles.
It inspects actual geometry for finite positions, epidermal avascularity,
relative layer thickness, fat placement and connected physiological routes.
It reads the WebGL framebuffer to check visible selection transparency, then
exercises all structures, all views, mesh picking, camera controls, separation,
animations, reduced motion, mobile layout, fallback, cleanup and progress
isolation. Screenshots are written to `/tmp/inneru-skin-desktop.png` and
`/tmp/inneru-skin-mobile.png`.
