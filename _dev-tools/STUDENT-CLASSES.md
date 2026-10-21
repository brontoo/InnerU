# Student classes and assigned teachers

Students choose exactly one of **10G1, 10G2, 10G3, 10G4, 10G5, 10G6** in the
existing signup form before choosing their avatar. Teacher signup, email
confirmation, password sign-in, sessions and owner approval are unchanged.

| Classes | Assigned teacher | Matching verified Auth email |
| --- | --- | --- |
| 10G1, 10G2, 10G3, 10G4 | Maryam | Sf.Alhammadi@moe.sch.ae |
| 10G5, 10G6 | Riham | Riham.hassan@moe.sch.ae |

Email comparison is case insensitive. Students never choose a teacher or a role
permission. Students still enter Student Dashboard; teachers enter Teacher
Dashboard under the existing approved-role rules.

These are the initial assignments. Migration 008 adds an owner-only management
screen for staffing changes while retaining the same six class codes and student
membership. Removing a teacher leaves the class and its students intact. Teacher
approval remains separate from assignment. See [OWNER-MANAGEMENT.md](OWNER-MANAGEMENT.md).

## Activate in the existing Supabase project

Run the complete [setup.sql](../supabase/setup.sql) in the project owner's
**Supabase SQL Editor**. It installs the class mapping and automatic roster rules
while preserving existing accounts, approved roles and learning records. Projects
already on migration 005 can instead apply
[006_automatic_rosters.sql](../supabase/migrations/006_automatic_rosters.sql).

This checkout has no live database-owner connection. Local test results do not
mean the migration has been applied to production. No Vercel environment-variable
changes are needed. If code deploys before SQL, the dashboard explicitly reports
that the database update is required; it never falls back to class invitations or
an imported teacher register. Classes submitted during that interval remain in
Auth signup metadata and are backfilled by the installer.

The migration creates **configuration records**, not Auth accounts:

- `school_classes`: the six fixed classes and their teacher emails.
- `school_teachers`: Maryam and Riham, with nullable links to real profiles.
- `profiles.class_code`, `assigned_teacher_email`, `assigned_teacher_id`: the
  student's durable class and canonical teacher identity.

Missing teachers remain pending (`teacher_id IS NULL`). Registering and verifying
the matching email links the actual account to all pending students automatically.
The teacher still needs normal owner approval; this does not change teacher signup
or turn email metadata into teacher permission. Once Maryam has registered and
confirmed her email, use the existing owner-only helper if not already approved:

```sql
select public.inneru_approve_teacher('Sf.Alhammadi@moe.sch.ae');
```

There is no need to run this before she joins, and it will reject an absent or
unverified account. Existing Riham approval is preserved.

## Existing students and saved learning

Existing students without a saved class choose once at their next sign-in. Direct
signed-in dashboard URLs also lead to this step until it is complete. Their Auth
ID, answers, mission progress, points and badges remain intact. Once selected,
future sign-ins do not ask again.

Students cannot reassign themselves after the first saved choice. For a school
correction, the owner can update only `profiles.class_code` in the SQL Editor;
the trigger derives the correct teacher. No teacher fields should be entered
manually. Changing Auth avatar/name/class metadata cannot overwrite an existing
saved class.

Teachers' main dashboard totals, class filter, student register, progress, answers,
achievements and feedback use the database roster for these school classes.
Refresh records loads the latest synced work. School assignments do not require
joining a shared class code or importing progress codes. Teachers with no assigned
school classes see an empty roster. Archived browser records and old invitation
enrollments do not appear in any account's school roster.

## Enforcement

- The signup API validates the exact six values for student signup only. It ignores
  caller-supplied teacher IDs/emails. The one-time selection RPC uses `auth.uid()`.
- Database CHECK/FK constraints enforce the class-to-email mapping; a profile
  trigger derives the teacher email and linked ID, including pending assignments.
- Only the database owner can edit the mapping configuration. Authenticated users
  cannot write profile, teacher, class or enrollment tables directly.
- Row-level security checks the approved teacher role and assigned teacher ID on
  profile, progress, responses, XP and badge reads. Feedback uses the same check.
- Invitation creation and joining are retired at the API and direct database RPC
  permissions. Legacy tables remain intact for owner recovery, but no legacy
  enrollment grants access, including for students who have not selected a class.
- Email confirmation/change and account deletion refresh or revoke teacher links.
  Unverified emails and unapproved teacher roles cannot open another student's data.
- Class assignments live outside the learning snapshot. Progress-code imports and
  learning uploads cannot override them.

## Verification

With Docker and Playwright/Chromium installed:

```sh
python3 _dev-tools/prepare-db-tests.py
python3 _dev-tools/verify-student-classes.py
python3 _dev-tools/verify-database.py
python3 _dev-tools/verify-accounts.py
python3 _dev-tools/verify-roles.py
python3 _dev-tools/verify-cloud-learning.py
python3 _dev-tools/verify-connection.py
```

The class suite uses a separate local PostgreSQL database and a fake Auth service.
The school's email addresses are used only as matching test strings in that
isolated fixture; no real account is created and no email is sent. It exercises
all six classes, missing/invalid selection, pending and later teacher registration,
existing students, identity/progress preservation, teacher isolation across all
learning tables, feedback, tampering, stale enrollment, desktop and mobile/touch
layouts, native keyboard selection, and teacher account/email lifecycle.

Stop the local test container with `docker stop inneru-db-check` when finished.
