# InnerU account setup

The entry supports email/password signup, twelve original animated avatar choices,
returning-user sign-in, email confirmation, password recovery and avatar changes.
Verified students open `index.html#dashboard`; approved teachers/admins open
`index.html#teacher`. See [ACCOUNT-ROLES.md](ACCOUNT-ROLES.md) for approval and access.

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
   confirmation when required, then opens the account’s dashboard from the confirmation link. If the
   project's email confirmation policy is disabled, signup opens its verified dashboard (or teacher approval screen) immediately.
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

## Missing confirmation emails or signup limits

The production Auth settings checked during this update require email confirmation.
A reachable account service does not prove that its emails are being delivered.
Creating another account or repeatedly pressing Create account cannot confirm an
existing email, and can hit the provider's request/email quotas.

For the school/project owner:

1. Open Supabase → **Authentication → Users** to check whether the student's
   signup was actually recorded and whether their email is confirmed.
2. Open **Authentication → Logs** and inspect signup/email errors. In the email
   settings, check SMTP configuration, allowed recipients, sender verification
   and delivery logs. Supabase's built-in mail sender has restrictions; configure
   a production SMTP provider for classroom addresses as needed. See the
   [Supabase SMTP guide](https://supabase.com/docs/guides/auth/auth-smtp).
3. Review **Authentication → Rate Limits** for email and request limits. Respect
   the retry interval; configure sending capacity for classroom use rather than
   repeatedly retrying signup. SMTP credentials belong in Supabase settings, not
   the portal's browser code or this repository.
4. After email delivery is working and the sending limit has cleared, the student
   can choose **Help me confirm my email → Send a new confirmation email**, open
   the latest link from their inbox/spam folder, and sign in normally. If no Auth
   account was created, finish Create account once after delivery is configured.

The entry now exposes a direct **Sign in to your account** action on the avatar
signup step and retains the email while clearing the password. Email/request
limits carry a retry interval and pause repeat submissions locally; email limits
also pause resend/recovery, while existing confirmed accounts can still sign in.
Resend is explicit and does not submit signup again. The interface does not claim
an email has been delivered, and it does not grant a session before confirmation.
Temporary throttling of a session check or token refresh preserves the HttpOnly
cookies for a later retry instead of treating the account as signed out.

Available publishable-key access can read public Auth settings and perform user
entry actions. It cannot inspect/change project SMTP configuration or provider
quotas. This update does not change those live administrator settings or disable
email confirmation. It requires no new SQL migration; the separate school-class
feature still requires [migration 005](../supabase/migrations/005_student_classes.sql).

## Session and learning behavior

`api/auth.js` calls Supabase Auth over HTTPS. Session tokens use HttpOnly,
SameSite=Lax cookies, with Secure on HTTPS. Passwords, emails and tokens are never
saved in application localStorage or learner progress codes. The API is private
and uncached, and the service worker bypasses all `/api/` requests.

Avatar IDs and an optional nickname are account metadata. Signup role choices
never grant teacher access. Apply [the database installer](../supabase/README.md)
to enable account-bound learning sync, class enrollment and approved teacher
access. Existing browser classroom imports remain separate from cloud classes.

Authenticated learning sync uses revision checks and keeps offline work locally
until a successful upload. Cross-device conflicts require a learner choice.
Students see their own data; approved teachers see students in their classes.
The database derives XP and badges from seeded task definitions rather than
accepting arbitrary totals. Browser archives are local storage, not a privacy
boundary between people who share a browser profile.

Use `/connection.html` on the deployed site to check the actual configured project
host, Auth connectivity and database installation. Auth accounts appear under
Authentication → Users independently of the public learning tables.

## Verification

Run `python3 _dev-tools/verify-accounts.py` and
`python3 _dev-tools/verify-auth-recovery.py` with Node,
Python Playwright and Chromium at `/usr/bin/chromium`. The runner starts an
isolated in-memory provider fixture and exercises the actual production adapter,
HTTP cookies, browser UI and redirects. The fixture is excluded from deployment
with the rest of `_dev-tools/`; production never substitutes fake accounts.

The recovery suite uses the isolated local PostgreSQL database and fake Auth
provider. It covers missing mail, manual resend, email/request quotas, retry
intervals, existing-student sign-in, cookie preservation and mobile layouts. It
never sends email or uses live account credentials. Run `verify-roles.py` and
`verify-student-classes.py` for the current role and teacher-assignment rules.
