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

Either role card opens email/password sign-in. New explorers can choose Create
account, enter their details, then select one of six original illustrated
avatars. Native radio choices, keyboard navigation, selection rings, character
messages and restrained animations make the choice clear and playful.

Signup calls the real account service after avatar selection. It redirects to
Home when the account is authenticated. If email confirmation is required, the
entry gives inbox instructions and redirects after the verification link is
opened. Returning users sign in and go directly to Home. Verified accounts with
no avatar choose one before continuing. The portal avatar menu supports changing
the avatar and signing out. Both role choices lead to Home; neither choice
creates privileged teacher permissions.

An explicit checkbox can carry existing device progress into the new account.
Account switching keeps local learner archives separate. Progress continues to
use the existing browser storage and teacher progress-code tools. It does not
gain cloud synchronization from the login integration.

See [ACCOUNT-SETUP.md](ACCOUNT-SETUP.md) for required Supabase/Vercel settings,
confirmation behavior, session handling and deployment limitations. Without that
external configuration, the entry visibly reports unavailable account sign-in
and keeps the existing public Home link available.

## Artwork and motion

Original generated art in `assets/login` includes the adventure landscape,
student explorer, teacher guide and transparent quest companion. The six new
avatar portraits share `assets/avatars/explorers.png`: Nova, Atlas, Luna, Neo,
Pip and Ember. Text, form controls and avatar identities remain HTML rather than
being baked into the artwork.

Scenery uses bounded desktop parallax, cloud drift, sunlight, leaves and motes.
Role cards respond to pointer tilt; the companion responds to taps with rotating
encouragement. Avatar choices have an entrance sequence and selection wiggle.
These interactions never award XP or change completed tasks.

Motion respects the OS preference, saved portal preference and visible Reduce
motion control. Hidden pages pause decoration. Phone layouts use stacked role
cards and responsive avatar choices. JavaScript-free links keep public learning
pages accessible; account actions require JavaScript and a network connection.

Worker v40 precaches the entry, helpers and illustrations. Auth API requests are
always excluded from caching. Offline learning remains available, while offline
account requests fail clearly instead of returning cached session data.

## Validation

`python3 _dev-tools/verify-login.py` runs the current account and illustrated-entry
checks. It uses the production API adapter against an isolated provider fixture.
Coverage includes credential validation, avatar selection, actual HTTP cookie
sessions, returning login, account switching, legacy progress preservation,
confirmation/recovery links, direct Home navigation, responsive portal avatars,
motion preferences, missing configuration and service-worker exclusions.

The learner and teacher regressions are `verify-dashboard.py` and
`verify-teacher-dashboard.py`. These checks do not validate real email delivery
or a production Supabase project; those need the configured deployment.
