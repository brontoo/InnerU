# InnerU illustrated adventure entry

`login.html` (also `/login` on Vercel) is the account entry. Opening `/` or
`/index.html` without a hash replaces the URL with `login.html`, retaining the
query string. Explicit portal bookmarks such as `/#dashboard`,
`index.html#teacher` and `index.html#home` remain available. The PWA start URL
continues to open the entry.

The warm landscape, student explorer, educator and friendly companion follow
the user's illustrated reference. No particular systems, fixed curriculum size
or mission catalogue appear on the entry, allowing the portal to grow.

## Account welcome

Either role card opens email/password sign-in. New accounts enter their details,
then select one of twelve original avatars. Signup records the requested role;
verified database profiles determine actual dashboard access. Students open
Student Dashboard, while approved teachers/admins open Teacher Dashboard.
Teacher requests remain pending until approved by the school owner. Both anonymous
visitors and accounts of the wrong role are blocked from private dashboards.

Email confirmation and password recovery still use the real provider. Verified
accounts with no avatar choose one before continuing. The portal account menu
supports avatar changes, role-specific dashboard navigation and signing out.
Existing unclaimed learning can be retained explicitly. Account learning sync and
classroom access follow the schema and policies documented in
[ACCOUNT-ROLES.md](ACCOUNT-ROLES.md) and
[ACCOUNT-SETUP.md](ACCOUNT-SETUP.md).

## Artwork and motion

Original generated art in `assets/login` includes the adventure landscape,
student explorer, teacher guide and transparent quest companion. The original six
avatar portraits share `assets/avatars/explorers.webp`; six additional guides and
friends use `assets/avatars/guides-and-friends.webp`. The teacher wears a simple
lavender hijab in `assets/login/teacher-guide-hijab.webp`. Text, form controls and avatar identities remain HTML rather than
being baked into the artwork.

Scenery uses bounded desktop parallax, cloud drift, sunlight, leaves and motes.
Role cards respond to pointer tilt; the companion responds to taps with rotating
encouragement. Avatar choices have an entrance sequence and selection wiggle.
These interactions never award XP or change completed tasks.

Motion respects the OS preference, saved portal preference and visible Reduce
motion control. Hidden pages pause decoration. Phone layouts use stacked role
cards and responsive avatar choices. JavaScript-free links keep public learning
pages accessible; account actions require JavaScript and a network connection.

Worker v42 precaches the entry, helpers and illustrations. Auth API requests are
always excluded from caching. Offline learning remains available, while offline
account requests fail clearly instead of returning cached session data.

## Validation

`python3 _dev-tools/verify-login.py` runs the current account and illustrated-entry
checks. It uses the production API adapter against an isolated provider fixture.
Coverage includes credential validation, avatar selection, actual HTTP cookie
sessions, returning login, account switching, legacy progress preservation,
confirmation/recovery links, role-specific dashboard navigation, responsive portal avatars,
motion preferences, missing configuration and service-worker exclusions.

The learner and teacher regressions are `verify-roles.py` and
`verify-cloud-learning.py`. These checks do not validate real email delivery
or a production Supabase project; those need the configured deployment.
