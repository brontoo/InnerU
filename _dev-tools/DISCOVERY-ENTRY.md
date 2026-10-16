# InnerU Discovery Centre

The standalone entry is `login.html`, also exposed at `/login` by Vercel.
Serve the repository with its existing static server; no build, package install,
authentication provider or environment secrets are required. The approved
homepage remains at `index.html#home` and the installed app keeps its original
start URL.

The museum tunnel uses the existing InnerU mark, DM Sans and Manrope typography,
six existing scientific illustrations, and the brief's navy, teal, cyan, violet,
gold and pearl palette. `assets/login/discovery-tunnel.webp` is original generated
architectural artwork, optimized to approximately 160 KB. Exhibit illustrations,
role controls and text are HTML layered over the scene, so all remain interactive
and accessible. Architectural CSS rings provide an image-failure fallback.

## Browser entry and data

The user selected the current browser-based entry. Role selection is navigation,
not an authentication or authorization system. No credentials, accounts, role
grants or server endpoints were introduced.

- Student opens `index.html#dashboard`. The optional nickname reads the current
  `bodyquest-v1` profile and updates only its `name` on explicit submission.
- Teacher opens the existing public `index.html#teacher` progress-code and class
  tools. It does not write a student profile or change teacher permissions.
- Browsing, role selection, exhibit inspection and returning to the role cards
  do not save anything or award XP. Unsaved nicknames stay in page memory.
- Submission reads the latest profile again to retain newer progress from
  another tab. A blank nickname keeps the existing name. New nicknames use the
  app's existing zero-progress default shape.
- Unreadable or unavailable storage is never overwritten by the entry page;
  learners can continue without saving a nickname. Quota errors expose the same
  fallback. Existing workspace behavior remains unchanged.
- Profile text is assigned through input values/textContent; it is never
  interpolated as HTML. Input is limited to 24 characters.

## Interaction and motion

The entry animation does not disable early selection. Cards lift gently, use
bounded pointer tilt and update ambient light. Selecting a card focuses its
entry heading; Back or Escape restores the original role button and any draft.
Native exhibit dialogs contain scientific context and real world links, support
Escape and return focus to their opener. On screens up to 1150 px, an optional
responsive gallery replaces the perspective wall panels.

Pause motion, OS reduced motion and the saved portal motion preference disable
animations and parallax. Desktop pointer work runs only on demand through one
batched animation frame. Hidden tabs pause CSS motion. Native controls, visible
focus indicators, skip navigation and JavaScript-free workspace links are
included. Back/forward restoration recovers controls if a transition was cut
short.

Worker v34 precaches the entry, tunnel and six exhibit illustrations alongside
the existing shell. This page registers the worker without adding a controller
change reload that could discard a nickname being typed. Existing pages keep
their original PWA behavior. Removed the duplicate `content-skeletal.js` cache
request: browsers reject an entire `Cache.addAll()` batch containing duplicates,
which previously prevented shell precaching. The runner now checks actual cache
contents and performs an offline reload, rather than only checking worker status.

## Validation

Run `python _dev-tools/verify-login.py` using Python Playwright and Chromium at
`/usr/bin/chromium`. The runner serves its own temporary local port and checks:
both roles and their real application destinations; all six exhibits at five
desktop sizes; keyboard and dialog focus; desktop parallax; OS, app and local
motion controls; nickname validation and preservation of the complete learning
record; concurrent-tab updates; unreadable/full storage fallbacks; five smaller
layouts; history restoration; unavailable artwork; disabled JavaScript; real
offline worker loading and cached exhibit images; valid precache paths; and the
Vercel entry rewrite. It never contacts production or changes real learner data.

The current dashboard completion regression remains
`python _dev-tools/verify-dashboard.py`. Keep `index.html`, `404.html`, existing
page scripts/styles and anatomical assets unchanged when adjusting this entry.
