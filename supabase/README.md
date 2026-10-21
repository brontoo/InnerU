# InnerU Supabase database

The production project supplied for InnerU is
`https://bjqwuwtpirjmgbefpfpz.supabase.co`. No project keys or passwords belong in
this repository. This folder provides migrations; it does not mean those
migrations have already been applied to the live project.

## Install in the existing project

1. Open that Supabase project's **SQL Editor → New query**.
2. Copy the **complete contents of [setup.sql](setup.sql)**, run it, and check that
   it finishes without an error. This creates the tables, access rules, functions,
   Auth-to-profile trigger and curriculum seeds. It also backfills profiles for
   accounts already present in `auth.users`. Rerunning it preserves approved roles
   and account records. Make a Supabase backup before applying updates to an
   already populated production project.
3. In Vercel → InnerU → Settings → Environment Variables, configure Production:

   | Name | Value |
   | --- | --- |
   | `SUPABASE_URL` | `https://bjqwuwtpirjmgbefpfpz.supabase.co` |
   | `SUPABASE_PUBLISHABLE_KEY` | Publishable key from this same Supabase project |
   | `APP_ORIGIN` | `https://inneru-gamma.vercel.app` |

   The legacy `SUPABASE_ANON_KEY` is supported instead of the publishable key.
   Never use a service-role/secret key for this gateway. Enter values securely in
   Vercel, not in chat or Git. Changing cloud-development environment settings does
   not change Vercel's production settings.
4. Redeploy the current `main` branch in Vercel. The deployment must include the
   `api` and `lib` folders. No database password is needed by the application.
5. In Supabase Auth URL Configuration, allow the production site and `/login`
   redirects as described in [_dev-tools/ACCOUNT-SETUP.md](../_dev-tools/ACCOUNT-SETUP.md).
6. Visit `https://inneru-gamma.vercel.app/connection.html` to check the actual
   project host, Auth connectivity, session and database installation. Then test
   a real signup, email confirmation when required, one task completion, sign-out
   and sign-in from a second browser.

The current connection page displays **CHECKER 2**. Each API step has a 20-second
timeout and a specific result. The page embeds its own checker and also provides
an external-script fallback. If JavaScript cannot run, its direct API links remain
available. The old “Checking this deployment…” placeholder is not a successful
check and does not establish whether Supabase is configured.

## School class assignment update

Existing installations should run the complete **[setup.sql](setup.sql)** in the
Supabase SQL Editor. It seeds the six school classes, links registered teachers by
verified email, leaves missing teachers pending, and retires class invitations.
Existing accounts, approved roles and progress are preserved. If migration 005 is
already installed, **[migrations/006_automatic_rosters.sql](migrations/006_automatic_rosters.sql)**
is the incremental update. No teacher account is created by these migrations. See
[STUDENT-CLASSES.md](../_dev-tools/STUDENT-CLASSES.md) for the mapping, one-time
selection for existing students, permissions, and local verification.

## Mission access controls

Mission availability is controlled by migration
**[007_mission_access.sql](migrations/007_mission_access.sql)** after migration 006.
It adds persistent class-scoped system and mission controls, teacher-only previews,
and server validation of sequential student progress. Existing records are kept.
See [MISSION-ACCESS.md](../_dev-tools/MISSION-ACCESS.md) for behavior and verification.

## Owner assignment management

After migration 007, apply **[008_owner_assignments.sql](migrations/008_owner_assignments.sql)**
for the owner-only **School assignments** screen. It uses the existing `admin`
role, retains current assignments and approval checks, and supports assignment,
removal and explicit approval of registered verified teacher requests. Student
classes, work and mission settings are preserved. No owner account is created.
See [OWNER-MANAGEMENT.md](../_dev-tools/OWNER-MANAGEMENT.md) for the one-time owner
designation, audit records, permissions and isolated verification. Routine changes
then require no SQL. No privileged key is used by the application.

## Where to find a new user

Email/password users appear in **Authentication → Users**. They will not appear
in the public Table Editor as password rows. Supabase manages password hashes;
InnerU never creates or reads a custom password table.

The initial signup form collects details. The request is submitted only after
choosing an avatar and pressing **Create account & explore**. A failed request
must show an error. Depending on the project's Auth policy, a successful signup
may require email confirmation before sign-in.

If the account is absent from Authentication → Users, missing learning tables
are not the cause. Check the connection page for the correct Supabase project,
Vercel Production variable values, a fresh deployment and Auth settings/logs.
This code cannot find or migrate a browser-only/failed signup into Auth without a
successful signup request. Do not manually insert password rows into `auth.users`.

## Tables and access

| Table | Purpose |
| --- | --- |
| `profiles` | One row per Auth user: nickname, avatar, approved role, student class and assigned teacher; no password |
| `school_classes`, `school_teachers` | Six school classes, canonical teacher emails and pending/verified account links |
| `class_mission_settings` | Persistent system/mission access per assigned school class, with teacher-only edits |
| `systems`, `missions` | Six systems, missions and required task credits |
| `badges`, `reward_definitions` | Achievement requirements and fixed task XP |
| `student_progress` | Full resumable learning snapshot, revision and total XP |
| `system_progress` | Per-system completed missions and mastery |
| `learning_responses` | Submitted answers, attempt history and activity feedback |
| `xp_events` | Unique credits per account/task; duplicate saves cannot pay twice |
| `student_badges` | Achievements derived from completed tasks and mission gates |
| `classrooms`, `enrollments` | Archived invitation data, retained for owner recovery; no longer used for access |
| `teacher_feedback` | Assigned teachers' feedback on a specific submitted answer |
| `staffing_audit` | Owner-only record of assignment/approval changes with before/after values |
| `inneru_schema` | Installed database schema version |

Students can read their own records. Teachers can read learning records only
for students assigned to them by the saved school-class mapping. Legacy enrollment
records never grant access. Anonymous clients cannot read learner
records. Direct writes are revoked; authenticated RPCs use the session's user
ID and check authorization. All learning tables have row-level security enabled.
Role metadata from signup and the entry role cards never approve teacher access.

## Approve a teacher

After the teacher has signed up, the **project owner** can run this query in the
SQL Editor, substituting the verified teacher's email (not their password):

For existing projects, first apply `migrations/004_roles_avatars.sql`.
Then approve the verified teacher account with the owner-only helper:

```sql
select public.inneru_approve_teacher('teacher@example.com');
```

The teacher signs in again and opens Teacher Dashboard. Maryam’s 10G1–10G4
and Riham’s 10G5–10G6 rosters and synced work appear automatically after students
select their class. Registration with the matching verified email resolves pending
assignments; the approved teacher role still gates access. Teachers without assigned
school classes see an empty cloud roster. Existing imported browser records remain
archived and never appear as account-linked students.
Preparing a shared device should use **Sign out**; account learning is not reset.

## Sync, rewards and limits

- The browser retains offline work and uploads after reconnection. A successful
  cloud save is explicitly reported in the avatar menu and dashboard panel.
- Each save locks one account's revision. Stale versions are rejected rather than
  silently overwriting another device. The learner chooses cloud or device work;
  a local recovery copy is kept before cloud replacement. Retry IDs are idempotent.
- The gateway whitelists learning fields; the database recomputes XP from seeded
  task IDs and fixed credit values. It never accepts a browser-supplied XP total
  or arbitrary badge list. Mission badges require the declared activity/check
  credits; mastery also requires every mission and the final task gate.
- Activity completion and automatic correctness remain reported by the learning
  client. This is a classroom learning record, not a server-proctored assessment
  engine. Written responses remain available for teacher review.
- Earlier points without known task IDs cannot be verified as cloud credits.
  The original device record is retained as a recovery copy when its total differs.
  Unknown task IDs do not mint points. Daily credits are accepted for the current
  UTC date or retained from an existing saved credit.
- Resetting account progress syncs an empty record. Current credits/badges are
  cleared together; deleting answers cascades their associated teacher feedback.
- Account deletion in Supabase Auth cascades through profiles and learning data.
  Imported browser copies/backups must be removed separately when appropriate.
- Browser progress and class imports remain readable by people who share the same
  browser profile. Signing in does not encrypt pre-existing local snapshots.

## Development and migration changes

The ordered sources are `migrations/001_schema.sql`, `002_catalog.sql` and
`003_functions.sql`, `004_roles_avatars.sql`, `005_student_classes.sql` and
`006_automatic_rosters.sql`, `007_mission_access.sql` and `008_owner_assignments.sql`.
`setup.sql` is their combined installer. Curriculum names
are captured in `catalog.json` from the actual learning model. After changing
course content, review `_dev-tools/build-db-catalog.py`, regenerate the catalog
seeds and combined installer, and apply the reviewed database update.

Verification uses a temporary `postgres:17-alpine` container, the real SQL
functions/RLS, production API handlers and Python Playwright. Test data never
uses a real student's email or password. School teacher emails appear only as
matching strings in isolated local test fixtures; no real account or email is created. See `_dev-tools/verify-database.py` and
`_dev-tools/verify-cloud-learning.py`. Local success does not validate production
credentials, email delivery or whether the migration was run in Supabase.

For the automatic critical release gate, see
[_dev-tools/README.md](../_dev-tools/README.md#automatic-critical-release-checks).
After installing the documented test-only prerequisites, run `npm test`. It creates
and cleans up a unique isolated `postgres:17-alpine` container, runs database
checks sequentially, and requires no Supabase project credentials. The GitHub
Actions workflow uses the same command; it does not install or migrate production.

For the optional lower-level database suites with Docker and Python Playwright:

```sh
python3 _dev-tools/prepare-db-tests.py
python3 _dev-tools/verify-database.py
python3 _dev-tools/verify-cloud-learning.py
```

The container exposes no database port. Stop this task's test service afterward
with `docker stop inneru-db-check`; retain it only for future local verification.

See [ACCOUNT-ROLES.md](../_dev-tools/ACCOUNT-ROLES.md) for the role-specific
dashboard rules, requested teacher access and account-specific local registers.
