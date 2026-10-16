# InnerU home expedition gallery

`home-expedition.js` replaces the lower home timeline, final-mission banner,
skeletal-only summary and three plain discovery links. The welcome and body atlas
remain in place. The new section continues their navy, teal and mint identity,
with ivory surfaces, anatomical artwork and restrained brass details.

The six world tabs update an anatomical preview, real saved progress and a working
enter/continue link. Selection synchronizes in both directions with the original
body map. Hovering the map does not switch the gallery. Repeated highlights leave
the existing preview intact so a control retains keyboard focus. The body-map
shortcut is the only gallery selection action that explicitly scrolls upward.
Arrow keys, Home and End move between tabs; Tab enters the selected preview.

The System Key cabinet opens from the final-mission action or key-ring artwork.
It identifies each earned/missing key and links to its world. The native modal
supports Escape, forward/reverse focus cycling and focus restoration. Navigation
away removes its backdrop and listeners. The final-mission route appears only
after all six existing System Key conditions are satisfied; capstone prerequisites
continue to be enforced by `capstone.js`.

Progress comes from the existing learner record, without awarding or writing
anything during gallery browsing:

| World | Mission milestones | System Key source |
|---|---:|---|
| Integumentary | 6 | `state.integumentary.mastery` |
| Skeletal | 7 | `state.done` includes `8` |
| Muscular | 7 | `state.muscle.done` includes `8` |
| Respiratory | 6 | `state.respiratory.mastery` |
| Circulatory | 7 | `state.circ.mastery` |
| Excretory | 6 | `state.excretory.mastery` |

Each world final contributes one more milestone: 39 missions plus six finals,
45 total. Optional extra cases and the circulatory bonus crisis do not change
this denominator. An earned key signifies its world is complete. Mission IDs are
deduplicated and restricted to the world's mission range. The next destination
is the first unfinished mission, then its world final. The expedition recommends
the most advanced incomplete world, or the skeletal starting point for a new
learner. All six keys direct the learner to the capstone.

Six optimized WebP derivatives in `assets/home-expedition/` reuse the portal's
existing original anatomical illustrations. Sources respectively:
`integ-missions/01-barrier.webp`, `skeletal-missions/01-skeleton.webp`,
`muscle-hero-icon.webp`, `respiratory-missions/01-lungs.webp`,
`circulatory-missions/03-heart.webp`, `excretory-missions/02-kidney-map.webp`.
The collection totals less than 550 KB. The discovery cards reuse the Framework
study, knee investigator and hot-day runners illustrations.

Motion can be paused locally without changing learner preferences. System and
app reduced-motion settings take precedence. Ambient lighting pauses outside
the viewport, while the document is hidden and while the cabinet is open.
Observers and event listeners are disposed when the home section is removed.
Layout supports 320px phones through desktop; home footer links wrap on phones.

Both HTML entry points load versioned gallery CSS and JS. Offline shell v28
includes them; anatomical images use the existing asset cache on first viewing.

Run `python3 _dev-tools/verify-home-expedition.py` with Playwright and Chromium.
The runner serves this checkout automatically and checks actual navigation,
saved-state preservation, all six world completion/resume paths, key gates,
keyboard and modal behavior, responsive layout, motion preferences, lifecycle,
asset loading and offline shell URLs.
