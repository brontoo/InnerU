# Teacher mission controls and student progression

Apply [007_mission_access.sql](../supabase/migrations/007_mission_access.sql) in
the Supabase SQL Editor after migration 006, or rerun the complete
[setup.sql](../supabase/setup.sql). Deployment does not apply database SQL.
Existing accounts, class assignments, submitted answers, XP, badges and completed
missions are preserved. Reapplying the installer also preserves teacher settings.

## Teacher workspace

The four main teacher destinations are Explore Worlds (`#home`), Dashboard
(`#teacher`), Mission Preview (`#teacher?view=preview`) and Achievements Board
(`#teacher?view=board`). Dashboard contains distinct Overview, Students, Missions,
Feedback, Analytics and Mastery views.

Open **Dashboard → Missions** (`#teacher?view=controls`) to manage access. Choose
the assigned class with **Manage class**, then lock/unlock any of the six systems,
39 regular missions or six final challenges: **51 separate settings per class**.
Teachers can use the same controls in English and Arabic. Saving retains keyboard
focus on the changed setting, including when its Lock/Unlock action changes.

The Control Panel uses the existing six-system order and the teacher's assigned
classes. The class selector changes the scope of edits. A system toggle controls
the whole system; individual toggles control each lesson and final. A system lock
overrides individual unlocks. Reopening a system retains its individual settings.
Systems start locked until their teacher unlocks them. Unlocking a system opens
its normal mission sequence; individual locks can narrow that availability. Missing teachers remain pending and
cannot be impersonated with a class choice or editable Auth metadata.

## Saved access and permissions

`class_mission_settings` stores `(class_code, system_id, mission_number)` and an
`unlocked` boolean. Mission number zero represents the system setting. The table
uses RLS and permits no direct authenticated writes. The authenticated settings
RPC verifies the approved role and canonical school-teacher assignment. Teachers
can manage only their classes; students can neither use the control RPC nor read
the teacher Control Panel. No service-role key is used by the application.

The mission catalog and authorization RPC use the signed-in account's saved class
and database progress, never client role fields or completion arrays. Students
need the system and mission unlocked and **all** earlier regular missions in that
system completed. The final requires every regular mission. Existing historical
gaps therefore do not unlock a later lesson. Route checks fail closed when access
cannot be verified. The classroom controls do not gate unrelated detective,
connections or review activities.
Open lessons recheck access when the tab regains focus, after learning updates,
and every 30 seconds while visible. Saves always enforce the current lock in the
database, including while a previously opened lesson is still displayed.

Each body-system task credit is linked to a curriculum mission. The save RPC
checks new credits, completion changes and mission responses before changing XP
or learning rows. A client cannot upload several future missions in one payload
to bypass the sequence. Prerequisites must already be saved before advancing.
The client flushes the current lesson before requesting the next one. An
unchanged saved record can still sync after a teacher locks it, preserving work.
Offline work on the current lesson stays local; opening a new mission needs an
online access check. A save rejected after a teacher changes a lock stays local
and reports the reason rather than claiming cloud success.

## Teacher preview

Preview authorization is a teacher-only read operation. The runtime clones the
teacher record in memory, uses the existing mission activities and illustrations,
and suppresses save, reward, evidence and cloud-progress writes. Leaving preview
restores the original record. Every mission is previewable irrespective of class
locks. Preview does not edit settings, student completion or student progress.
Students cannot acquire this capability using `?preview=1` or a direct RPC call.

## Verification

Run `python3 _dev-tools/verify-mission-access.py` with the existing local Docker,
Chromium and Playwright setup. The suite uses a separate PostgreSQL database and
a fake Auth provider. School emails are only matching strings in that local
fixture; it never creates a real account or sends email. It covers distinct
navigation and Home, canonical class scopes, keyboard lock/unlock of all 51 settings,
student gate enforcement for every mission/final, unchanged progress/rewards,
refresh/new-session persistence, all 45 previews, progress preservation,
prerequisites, forged snapshots, direct RPC/table access, installer reapplication
and responsive layouts. The role and cloud-learning suites provide regression
coverage for login, identity, account switching, offline work and conflicts.

Verified 8 November 2026 with isolated local fixtures:

- `npm test -- mission-access`: 224 assertions passed, including keyboard
  lock/unlock of all six systems and 45 missions/finals, refresh persistence,
  student access enforcement, previews and unchanged learning records.
- `npm test -- teacher-workspace owner learning-support`: all three suites
  passed (class isolation/navigation, owner approval boundaries, Arabic/Guided
  mode and accessibility behavior).
- `npm run test:performance`: all 49 checks passed; 124 tracked JavaScript files
  passed `node --check`. HTML entry points remain identical.

No SQL, permissions, authentication or lesson-content changes are needed for
this keyboard fix. The production controls RPC was also checked anonymously:
it exists and denies access; no production class setting was read or changed.
