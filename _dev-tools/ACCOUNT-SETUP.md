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
4. Choose the project's Email confirmation policy in Supabase, not in browser
   code. With automatic confirmation enabled, a new student can enter immediately
   after choosing an avatar and class; teacher approval is still required. When
   confirmation is required, configure email delivery and use the verified callback.
   Never simulate confirmation or grant teacher permissions from a signup choice.
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

The production public settings checked on 13 November 2026 enable email signup
and automatic confirmation. New registrations therefore do not require a
confirmation email. The portal also supports projects/accounts that require
confirmation; this setting belongs to Supabase and is not changed by deployment.
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

Use `npm test -- accounts auth-recovery student-classes` with the prerequisites in
[README.md](README.md). The tests use Playwright's installed Chromium and a
configurable temporary artifact directory, plus isolated PostgreSQL and fake
Auth. `INNERU_TEST_CHROMIUM_EXECUTABLE` is an optional restricted-environment
override; neither the suites nor CI assume a system Chromium path.

The recovery suite covers current/new student access, confirmation and quotas,
interrupted/offline requests, a bounded 30-second timeout, malformed session
responses that fail closed, explicit retry without repeating signup, and Arabic
keyboard/mobile recovery. It never sends real email or uses live passwords.

## Browser connection failures

The message “The account service could not be reached. Check your connection and
try again.” comes from the browser transport. It is distinct from the server's
wrong-password, email-confirmation and role-approval messages. A green server
health check alone cannot establish access from a particular school device.

The sign-in form keeps its live values after a failed request, releases the
controls, and links to **Check account connection** in a new tab. It never replays
a password or signup automatically. Unreadable session HTML/JSON is an error,
rather than being treated as an unconfigured guest session. Passwords and tokens
remain absent from local/session storage.

`connection.html` (CHECKER 3) separately checks the account API, public provider
settings and a rejected empty login POST. Empty validation returns `invalid_email`
before any provider request, so the checker creates no account, submits no real
credentials and changes no session. It distinguishes a browser's ability to read
the API from its ability to send sign-in requests. Owner database checks still
require that browser's valid authenticated session. The external and embedded
checker remain identical so a missing script cannot strand the page.

On the deployed production domain, read-only session/settings and browser POST
validation were reachable from this environment. Device-specific browser, proxy,
endpoint-security or network failures cannot be diagnosed without the affected
browser's checker results. Do not collect passwords or full personal API responses
for troubleshooting, and do not weaken authentication or school network controls.

Provider error parsing accepts both symbolic `code` responses and the hosted GoTrue
shape `{code: 422, error_code: "user_already_exists"}`. The symbolic reason takes
precedence over numeric HTTP codes, so duplicate accounts, invalid credentials,
confirmation requirements and email quotas keep their specific recovery actions.
Never create a replacement identity or reset an existing password without its
normal authenticated/recovery flow.
