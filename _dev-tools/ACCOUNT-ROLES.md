# Verified account roles and dashboards

`public.profiles.role` is the sole authority for access. Auth metadata, entry role
cards, browser profile fields and imported progress codes cannot grant a role.
The account API validates the Supabase Auth session, then reads that user's
profile through its own JWT and row-level security. The role returned to the
browser comes from that database row.

Students sign in to `#dashboard`, can explore learning content and cannot open
`#teacher` or its child routes. Teachers/admins sign in to `#teacher`; attempts
to open Student Dashboard, achievements, review or student missions return them
to the teacher workspace. Informational reference/privacy pages remain available.
Anonymous or unverified users cannot open either account dashboard. The app is
hidden while its initial session is checked, preventing a previous user's
workspace from flashing on screen. An unavailable account service leaves private
workspaces closed and gives a sign-in/connection-check explanation.

The account menu and teacher header identify the verified user. Saved learning
is bound to that user's Auth ID. Cloud teacher reads remain limited to students assigned to their school classes
(or unrelated legacy enrollments). See [STUDENT-CLASSES.md](STUDENT-CLASSES.md) for
the six-class mapping, pending teacher links and migration 005. Teachers cannot submit student XP via the API or direct learning RPC.
Browser classroom registers use an account-specific IndexedDB name, so another
teacher's imported register is not automatically opened. Earlier unscoped browser
registers are retained separately and are not silently assigned to an account.
This is UI/API isolation; people with full developer-tool access to the same
browser profile can still inspect that browser's local storage.

## Teacher requests and owner approval

A teacher signup records `requested_role=teacher` while its effective role remains
student until approved. Selecting the teacher card for a student account shows
an explanation and a Request teacher access action, rather than silently opening
Student Dashboard or promoting the account. Approval is a deliberate school-owner
action. Confirmed teachers go to Teacher Dashboard even if they select the student
card. Changes to the approved role are picked up on a fresh verified page load.

For a project that already ran the original installer, run
`supabase/migrations/004_roles_avatars.sql` in the Supabase SQL Editor. It preserves
existing accounts, progress, roles and class records, and adds twelve-avatar
support, teacher requests, and the owner-only approval helper. New projects can
run the combined `supabase/setup.sql` instead.

The project owner can then run:

```sql
select public.inneru_approve_teacher('verified-teacher@example.com');
```

This helper requires an existing email-verified Auth user and is not executable
by an authenticated student or teacher. No password is involved. No account role
was changed in the live project by the coding agent; only the project owner can
apply this SQL without supplying a separate administrative connection.

## Artwork and avatars

The teacher artwork is a regenerated, polished adult educator with a welcoming
expression, simple lavender hijab, glasses, modest science coat, tablet and stylus.
It retains the portal’s softly lit lavender classroom and animated illustration
style. The generated master is retained outside the repository;
`teacher-guide-welcome.webp` is the optimized production encoding. The login card
and Teacher Dashboard share this illustration and retain their existing motion
and reduced-motion behavior.

The original six avatars remain available. A second generated sheet adds Amira,
Sami, Noor, Finn, Pebble and Sage. All twelve are selectable by radio, keyboard and
touch. The chooser scrolls within a bounded area; directional keys use the actual
column count on each screen width. Existing hover/selection animation and reduced
motion controls remain. Both sheets and the hijab illustration are included in the offline worker.

## Checks

- `verify-student-classes.py`: all six assignments, pending teacher registration,
  preserved learning, SQL permissions, school rosters, feedback and desktop/mobile.
- `verify-roles.py`: actual database/Auth profile roles, anonymous denial, wrong
  dashboard routes, role requests/approval, API and direct-RPC restrictions,
  separate teacher registers, identity switching, new avatars and phone layouts.
- `verify-accounts.py`: email/password flow, twelve avatars, role mismatch,
  confirmation/recovery, separate learning archives, cookies and offline API rules.
- `verify-cloud-learning.py`: actual database sync, assigned teacher feedback,
  second-device restore, explicit conflicts and responsive cloud review.
- `verify-database.py`: normalized storage, RLS, XP, badges and transactions.
- `verify-connection.py`: diagnostics success/failure and missing scripts.

Database-backed checks use the isolated `inneru-db-check` test container, prepared
by `prepare-db-tests.py`. No production credentials or school accounts are used.
The old public-dashboard harnesses (`verify-dashboard.py`,
`verify-teacher-dashboard.py`) include anonymous/cross-role workflows superseded
by this access policy; they are historical and are not evidence for current role
access. The current suites above exercise the new account-bound flows.
