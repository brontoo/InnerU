# Owner teacher and class management

The `#owner` route adds **School assignments** to the existing navigation only for
an owner (`profiles.role = 'admin'`). It reuses the approved role and signed-in
HttpOnly-cookie gateway; there is no new login system or client-side allowlist.
Teachers retain their four existing navigation destinations.

## One-time setup

For an installation on migration 007, apply
[`008_owner_assignments.sql`](../supabase/migrations/008_owner_assignments.sql)
using the Supabase project owner's SQL Editor. New installations can use the
combined `supabase/setup.sql`. Back up an existing project first. This code change
does not apply a migration to production or publish the portal.

If an owner profile already has the `admin` role, no bootstrap is needed. Otherwise,
the project owner must explicitly designate an **existing verified, approved
teacher account** once, using their real email in this SQL Editor statement:

```sql
update public.profiles p set role='admin', updated_at=now()
from auth.users u
where p.id=u.id and lower(u.email)=lower('existing-owner@example.com')
  and u.email_confirmed_at is not null and p.role='teacher'
returning p.id, p.role;
```

Require exactly the intended account in the result, then sign in/refresh. No owner
is seeded, inferred from a school email or granted by signup metadata. Ordinary
teachers must not receive `admin`. Routine assignment and teacher approval changes
then use **School assignments** without SQL. No extra environment variable,
service-role key or database password is needed by the application.

## Behaviour and security decisions

- The six existing class codes and one-teacher-per-class model remain. Initial
  Maryam/Riham assignments are retained until the owner changes them. No teacher,
  student, class or fake Auth account is created by the screen.
- Each class shows its current teacher and approval status. Select changes across
  up to six classes, review the before/after list and confirm. Removals explicitly
  explain loss of access; Cancel/Escape leaves the database unchanged.
- A teacher may be assigned to several classes. Only an existing email-verified
  teacher/admin or account requesting teacher access is selectable. The existing
  admin role includes teacher access, so an owner can retain or receive a class
  without any role change. Assigning a pending
  request does **not** approve it. Existing configured but unregistered teachers
  remain visible as pending, but cannot be newly selected as fake accounts.
- Explicit approval reuses `inneru_approve_teacher` behind an owner-checked
  wrapper. That legacy helper remains inaccessible to authenticated JWTs directly.
  Unverified users, ordinary students and owners cannot be approval targets.
  Ambiguous verified emails are rejected; the legacy helper must also return the
  exact account selected, preventing accidental approval/demotion of another ID.
  There is no role editing, owner removal, approval revocation or account deletion
  action, so this screen cannot remove the last owner or demote itself.
- `/api/owner` verifies the current database role on every request. Each SQL RPC
  independently requires `inneru_is_owner()` (admin plus verified Auth email),
  with a fixed empty search path. Browser roles/URLs cannot authorize anything.
  Same-origin mutation checks and private/no-store responses follow existing APIs.
- No RLS policy or direct table-write grant is broadened. `school_classes` and
  `school_teachers` stay inaccessible directly. New `staffing_audit` records are
  accessible only through the owner read RPC, with no authenticated direct writes.
- The fixed email mapping constraint is replaced by owner-managed relationships.
  Allowed class codes, teacher/profile foreign keys and the existing class-scoped
  read predicates remain. A deferred composite FK allows the class mapping and
  derived student links to change atomically. A separate class FK also validates
  temporarily unassigned classes.
- Student `class_code` never changes through this screen. The SQL trigger derives
  teacher fields; removing a teacher clears both links but keeps the class.
  Former teachers lose roster, answer, feedback and mission-control access;
  approved replacements see only students in their new classes. No progress,
  response, reward, badge or mission-setting record is rewritten.
- Serialized transactions validate every proposed change and compare the current
  teacher email with the version the owner reviewed. Stale edits return HTTP 409;
  invalid batches roll back completely. Refresh and review again after a conflict.
- There was no existing staffing audit. The small `staffing_audit` table stores
  actor ID/email, action, before/after values and timestamp for successful changes
  made through the screen. The view shows the latest 50. Failed/no-op changes do
  not create audit entries. Historical/manual SQL changes are not reconstructed.
- The screen and messages have an Arabic catalogue, RTL layout, native selects,
  labelled confirmation dialog, visible focus and live success/error messages.
  The module/style load on demand. No owner API response enters offline caches;
  management requires a live authorized connection.

## Local verification

Use the test-only prerequisites in [README.md](README.md), then run:

```sh
npm run test:owner
npm test
npm run test:performance
```

`npm test` includes the owner suite alongside the existing release checks. Fixtures
use isolated `postgres:17-alpine`, real SQL/RLS and production API handlers with a
loopback fake Auth service. There are no production credentials, real accounts or
outbound emails. Artifacts follow `INNERU_TEST_ARTIFACT_DIR`.

The focused suite covers anonymous/student/teacher/pending denials at API and SQL
levels, CSRF, invalid classes/accounts, verified approval, all-six reassignment,
approval separation, current-class RLS, control/feedback permissions, atomic
rollback, stale edits, last-owner safety, audit immutability, removal confirmation,
refresh persistence, forged browser roles, mobile RTL and original progress/locks.
Results and any environment limitations are reported with the change.

## Results for this change

The final full `npm test` run passed **all nine suites**:

| Check | Result | Assertions |
|---|---|---:|
| Sign-in and signup | PASS | 46 |
| Student classes / teacher assignment | PASS | 115 |
| Student dashboard / progress | PASS | 65 |
| Mission access / locks / previews | PASS | 113 |
| Teacher roster / work / feedback | PASS | 74 |
| Teacher workspace / class isolation | PASS | 89 |
| Owner staffing | PASS | 92 |
| Guided / Arabic / speech | PASS | 108 |
| Arabic coverage | PASS | 199 states, zero missing strings |

A final focused `npm run test:owner` passed **94 assertions** after adding the
ambiguous-email safeguards, including tests that an approval cannot demote or
approve a different account with the same email. The rest of the portal logic
was unchanged by that final owner-only validation.

`npm run test:performance` passed all **44 checks**, with the existing budgets
unchanged. No owner module/style or 3D model is loaded by the initial login or
student dashboard. Cold local gzip JavaScript is 24,269 B on login and 72,127 B
on the first dashboard; CSS/images/request counts remain within their budgets.
All **119** tracked/new JavaScript files passed `node --check`; Actionlint,
identical index/404 shells and `git diff --check` passed.

An additional isolated SQL smoke checked an actual 007 installation with existing
accounts/progress: applying only 008 preserved records, repeating 008 retained a
removed assignment/audit, and replaying the combined installer retained the
owner-managed mapping and student work. All three checks passed. The combined
installer also matches the eight ordered source migrations exactly.

The first full attempt encountered an existing class-test loopback `ECONNRESET`
while reading a session; all other suites passed. No assertion was removed or
weakened. A complete repeat passed all nine suites. The environment reused the
configured system Chromium override; clean developer/CI setup still uses
Playwright's installed Chromium. Local checks do not establish production setup,
real email delivery, installed OS voice quality or assistive-technology conformance.

Artifacts: `/tmp/inneru-owner-release-final` (full suite),
`/tmp/inneru-owner-security-final` (final owner logs/screenshots),
`/tmp/inneru-owner-performance` (loading), and
`/tmp/inneru-owner-upgrade-verified.log` (SQL upgrade smoke).
No production service, credential, real account or email delivery was used.
Nothing was deployed or published, and no branch protection/Vercel setting changed.

## Changed files

This list covers the owner-management change relative to `ac181b8`. Earlier
accessibility and loading work remains on its own parent commits.

- `404.html`
- `README.md`
- `_dev-tools/ACCOUNT-ROLES.md`
- `_dev-tools/OWNER-MANAGEMENT.md`
- `_dev-tools/README.md`
- `_dev-tools/STUDENT-CLASSES.md`
- `_dev-tools/account-test-server.js`
- `_dev-tools/run-critical-checks.js`
- `_dev-tools/verify-owner.py`
- `access.js`
- `account-session.js`
- `api/owner.js`
- `cloud-learning.js`
- `index.html`
- `locale.js`
- `locales/README.md`
- `locales/ar/common.js`
- `locales/ar/owner.js`
- `owner.css`
- `owner.js`
- `package.json`
- `route-loader.js`
- `route-manifest.js`
- `supabase/README.md`
- `supabase/migrations/008_owner_assignments.sql`
- `supabase/setup.sql`
- `sw.js`
