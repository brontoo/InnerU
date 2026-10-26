# Shared InnerU · Body Quest branding

`inneru-logo.svg` is the single full wordmark used by login, the shared portal
navigation, sidebar signature, footers, Home welcome header and the standalone
account-connection checker. Student,
teacher and owner routes all use that shared shell. The logo keeps the login
palette (navy lettering, coral U, gold notched ribbon), slight tilt and Manrope
ExtraBold letterforms. Letterforms are outlined so the artwork stays identical
in English/Arabic and offline without downloading a font. Manrope is distributed
under the SIL Open Font License; no font binary or new dependency is shipped.

`favicon.svg` uses a matching coral U and gold accent at small tab sizes.
`inneru-mark.svg` and `inneru-mark-light.svg` retain existing icon URLs as compact
companion icons for installed apps and older cached references. Home/review
miniature emblems use the same compact icon. The manifest and service-worker
shell cache the new wordmark and versioned icons; lessons/models remain deferred.

Responsive image dimensions preserve the full artwork. The Latin wordmark stays
left-to-right in Arabic. Logo links retain Home destinations and accessible
names; the desktop sidebar can scroll on short viewports so navigation remains
keyboard-reachable. Learning content, authentication, roles and permissions are
unchanged.

Verification on 26 October 2026:

- Rendered 31 student, teacher and owner routes; checked English/Arabic at
  320, 390, 768, 1024 and 1440 CSS pixels. All three shared shell logo placements
  use the same loaded artwork. Home logo links retain the signed-in identity.
- Login rendering checked in both languages at 320, 390, 768 and 1440px.
- Short 1024×600 desktop navigation remains keyboard-reachable in both languages.
- Existing account, teacher-workspace and owner checks passed.
- Strict Arabic audit passed with zero gaps across 187 states.
- All 49 loading/route/offline checks passed without increasing budgets.

Workspace artifacts: `/tmp/inneru-brand-routes.json`,
`/tmp/inneru-brand-wordmark.png`, `/tmp/inneru-brand-*.png`,
`/tmp/inneru-brand-regression`, `/tmp/inneru-brand-loading-final`.
The browser review uses local fixtures only; production accounts/data are untouched.

The Home welcome now uses `assets/home-body-quest.webp` beside live HTML copy,
replacing the large logo card with a science-adventure illustration. Text and the
system-exploration button remain bilingual, keyboard-operable UI. The 1536×1024
WebP is approximately 290 KiB and loads only on Home; it is not precached during
service-worker installation. Tablet/mobile layouts stack the whole illustration
below the copy, without mirroring its anatomy in RTL.

The welcome follow-up passed usability, teacher-workspace, Guided/accessibility
and strict Arabic-coverage checks, plus all 49 loading/route/offline checks.
Rendered student/teacher reviews covered 320–1680px in English/Arabic, with a
final 14-state responsive check for the stacked layout. Keyboard CTA activation
and earned-progress invariance passed. Workspace artifacts are under
`/tmp/inneru-welcome-*`. Learning activities, progress rules and permissions are
unchanged.
