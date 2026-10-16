# InnerU illustrated adventure entry

`login.html` (also `/login` on Vercel) is the browser entry. Opening `/` or
`/index.html` without a hash replaces the URL with `login.html`, retaining the
query string. Explicit workspace bookmarks such as `/#dashboard`,
`index.html#teacher` and `index.html#home` remain available. The PWA keeps its
existing start URL (`./`), which opens the entry. No build or authentication
provider is required.

The user's latest illustrated reference replaces the museum tunnel with a warm,
bright discovery landscape, a student explorer, an educator and a friendly
animated companion. The existing homepage, lessons, anatomy models, dashboard,
reward logic and public Teacher tools remain unchanged.

## Open-ended curriculum

The entry names no specific systems and contains no fixed number of systems,
missions or mastery keys. Generic Explore, Stay Curious and Level Up tips explain
how to begin without presenting a module catalogue. The saved-profile summary
shows actual XP without assuming a curriculum size. More learning content can be
added to the platform without changing this entry page.

The top brand uses InnerU's established name and portal fonts with the reference's
coral and gold adventure treatment. The existing InnerU mark appears in the footer.
The student role is Body Explorer; the teacher role is Mission Guide.

## Artwork and motion

Four original generated WebP assets in `assets/login` are optimized for the page:

- `adventure-landscape.webp`: scenic background, approximately 177 KB.
- `student-explorer.webp`: separate role-card artwork, approximately 117 KB.
- `teacher-guide.webp`: separate educator illustration, approximately 62 KB.
- `quest-companion.webp`: transparent companion artwork, approximately 28 KB.

Text, buttons, tips, sparkles and trails are separate HTML/SVG/CSS layers. No functional UI
labels or system list are baked into the artwork. The wooden signpost slogans
are decorative scenery. Scenery uses bounded desktop
parallax, soft cloud drift, sunlight, drifting leaves and motes. Cards respond to
hover and pointer tilt; the companion bobs and responds to taps with rotating
encouragement. These interactions never award points or save learning data.

Motion follows the OS preference, the existing portal preference and the visible
Reduce motion control. Hidden tabs pause decorative motion; companion reaction
animations cancel when motion is disabled or the page is left. Phones use stacked
cards, a compact companion and inline discovery controls. Artwork failures retain
readable controls and a scenic gradient. JavaScript-free links open the existing
workspaces.

## Browser access and data preservation

The user chose browser-based entry. Student/Teacher selection chooses a navigation
destination; it does not create an account, authenticated role or permission.

- Student opens `index.html#dashboard`. An optional nickname reads `bodyquest-v1`
  again on submission and changes only its name, preserving every progress field.
- Teacher opens `index.html#teacher` and makes no profile write. The existing
  browser class list and progress-code tools continue to work as before.
- Empty names retain the current name. Invalid names stay in a focused field with
  accessible feedback. Full or unreadable storage exposes a continue-without-saving
  option and leaves the existing data untouched.
- Switching roles retains a draft in memory. Back/Escape restores the original
  role control. Native tip dialogs return focus to their opener.
- Existing homepage and lesson files are not loaded or restyled by this entry.

Worker v36 caches the new page and all four illustration assets for offline use.
Versioned CSS/JS requests avoid the preceding tunnel presentation. The old tunnel
artwork stays on disk for compatibility but is not used or precached by this page.
The entry registers the worker without an automatic controller-change reload that
could discard a nickname being typed. Existing app pages retain their PWA behavior.

## Validation

Run `python _dev-tools/verify-login.py` with Python Playwright and Chromium at
`/usr/bin/chromium`. It serves its own temporary port and drives the real entry,
browser data, role controls and destination pages. Coverage includes character
artwork, absence of curriculum-specific labels, whole-card selection, companion
interaction, tip dialogs, desktop and phone layouts, keyboard focus, motion
preferences, nickname-only writes, concurrent updates, unreadable/full storage,
history restoration, image failure, disabled JavaScript, actual precache contents
and an offline reload. The existing dashboard regression is
`python _dev-tools/verify-dashboard.py`.
