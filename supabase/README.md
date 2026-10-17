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
| `profiles` | One row per Auth user: nickname, avatar, approved role; no password |
| `systems`, `missions` | Six systems, missions and required task credits |
| `badges`, `reward_definitions` | Achievement requirements and fixed task XP |
| `student_progress` | Full resumable learning snapshot, revision and total XP |
| `system_progress` | Per-system completed missions and mastery |
| `learning_responses` | Submitted answers, attempt history and activity feedback |
| `xp_events` | Unique credits per account/task; duplicate saves cannot pay twice |
| `student_badges` | Achievements derived from completed tasks and mission gates |
| `classrooms`, `enrollments` | Approved teachers, classes and joined students |
| `teacher_feedback` | Assigned teachers' feedback on a specific submitted answer |
| `inneru_schema` | Installed database schema version |

Students can read their own records. Teachers can read learning records only
for students enrolled in a class they own. Anonymous clients cannot read learner
records. Direct writes are revoked; authenticated RPCs use the session's user
ID and check authorization. All learning tables have row-level security enabled.
Role metadata from signup and the entry role cards never approve teacher access.

## Approve a teacher

After the teacher has signed up, the **project owner** can run this query in the
SQL Editor, substituting the verified teacher's email (not their password):

```sql
update public.profiles p
set role = 'teacher'
from auth.users u
where p.id = u.id and lower(u.email) = lower('teacher@example.com');
```

The teacher refreshes the portal, opens Teacher Dashboard → **Open cloud
classroom**, creates a named class and shares its generated class code. A signed-in
student joins from Student Dashboard. Only then does their synced work appear
for that teacher. The existing imported browser register stays separate from the
cloud roster; this prevents a browser-imported name from impersonating an account.
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
`003_functions.sql`. `setup.sql` is their combined installer. Curriculum names
are captured in `catalog.json` from the actual learning model. After changing
course content, review `_dev-tools/build-db-catalog.py`, regenerate the catalog
seeds and combined installer, and apply the reviewed database update.

Verification uses a temporary `postgres:17-alpine` container, the real SQL
functions/RLS, production API handlers and Python Playwright. Test data never
uses a real student's email or password. See `_dev-tools/verify-database.py` and
`_dev-tools/verify-cloud-learning.py`. Local success does not validate production
credentials, email delivery or whether the migration was run in Supabase.

For local verification with Docker and the existing Playwright/Chromium setup:

```sh
python3 _dev-tools/prepare-db-tests.py
python3 _dev-tools/verify-database.py
python3 _dev-tools/verify-cloud-learning.py
```

The container exposes no database port. Stop this task's test service afterward
with `docker stop inneru-db-check`; retain it only for future local verification.
