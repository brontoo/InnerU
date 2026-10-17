# InnerU account setup

The entry supports email/password signup, six original animated avatar choices,
returning-user sign-in, email confirmation, password recovery and avatar changes.
Successful sign-in and completed signup open `index.html#home`.

## Connect production accounts

This repository contains the integration, not a provisioned account service.
An unconfigured deployment shows an unavailable message and keeps the existing
public Home link available. Accounts require a Supabase project connected in Vercel.

1. Create or select a Supabase project and enable the Email auth provider.
2. In the Vercel project's environment settings, add:

   | Variable | Value |
   | --- | --- |
   | `SUPABASE_URL` | The project's HTTPS URL |
   | `SUPABASE_PUBLISHABLE_KEY` | The project's publishable key |
   | `APP_ORIGIN` | `https://inneru-gamma.vercel.app` |

   A legacy `SUPABASE_ANON_KEY` is also supported. Use a publishable/anon key;
   service-role and secret keys are rejected. Enter values through the provider's
   settings, rather than committing them or pasting them into chat.
3. In Supabase Authentication URL Configuration, set the Site URL to
   `https://inneru-gamma.vercel.app` and allow the redirect URLs
   `https://inneru-gamma.vercel.app/login` and
   `https://inneru-gamma.vercel.app/login.html`.
4. Keep email confirmation enabled for verified accounts. Configure the project's
   email delivery service for its intended classroom use. The interface waits for
   confirmation when required, then opens Home from the confirmation link. If the
   project's email confirmation policy is disabled, signup opens Home immediately.
5. Redeploy Vercel so its Node function receives these environment settings. For a
   preview deployment, use that deployment's own origin and allowed redirect URLs.
6. Test a real signup, delivered confirmation email, sign-out, returning sign-in
   and password reset on the production domain. The local fixture cannot validate
   live provider settings or email delivery.

Default Supabase email links return access/refresh tokens in the URL fragment;
the entry validates them on the server and immediately removes the fragment.
Custom confirmation templates can instead use
`{{ .SiteURL }}/login?token_hash={{ .TokenHash }}&type=email`. A custom recovery
template must use `type=recovery`. Both forms are supported.

## Session and learning behavior

`api/auth.js` calls Supabase Auth over HTTPS. Session tokens use HttpOnly,
SameSite=Lax cookies, with Secure on HTTPS. Passwords, emails and tokens are never
saved in application localStorage or learner progress codes. The API is private
and uncached, and the service worker bypasses all `/api/` requests.

Avatar IDs and an optional nickname are account metadata. No client-selected role
grants authorization. Lessons and the existing browser teacher dashboard remain
public; this change does not introduce school administrator permissions.

Learning records remain local to the device. Each account receives a separate
local progress archive on sign-out/account switching. Existing unclaimed progress
can be carried into an account using the visible checkbox. Account metadata is
stored by Supabase; learning progress, answers, XP and classroom records are not
automatically synchronized between devices. Existing teacher progress-code and
classroom-backup workflows continue to work. Browser archives are local storage,
not a privacy boundary between people who share a browser profile.

## Verification

Run `python3 _dev-tools/verify-login.py` (or `verify-accounts.py`) with Node,
Python Playwright and Chromium at `/usr/bin/chromium`. The runner starts an
isolated in-memory provider fixture and exercises the actual production adapter,
HTTP cookies, browser UI and redirects. The fixture is excluded from deployment
with the rest of `_dev-tools/`; production never substitutes fake accounts.

Run `verify-dashboard.py` and `verify-teacher-dashboard.py` for the learner
rewards, submitted answers, teacher records and offline regressions.
