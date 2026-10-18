# Teacher dashboard

Open `index.html#teacher` after signing in with an approved teacher account.
The dashboard uses the authenticated cloud roster: Maryam sees 10G1–10G4 and
Riham sees 10G5–10G6. Students appear after choosing their school class; no class
invitations or progress-code imports are needed. See
[STUDENT-CLASSES.md](STUDENT-CLASSES.md) for installation and permission rules.
The browser register described below is historical storage retained for recovery;
it is no longer used as a fallback for the account dashboard.

The teacher sidebar provides Home, Class overview, Classes & students, Answers &
feedback, Achievements, Control Panel and Mission previews. It tracks the current view and remains available on
individual student records and reference pages. On mobile it uses the portal's
horizontal navigation. Student accounts retain their separate learning links.
Only Home shows the welcome hero. See [MISSION-ACCESS.md](MISSION-ACCESS.md) for
persistent class controls, server progression rules and read-only previews.

## Classroom records

The class overview, searchable/grouped register, individual mission records,
answer desk, feedback, and achievement cabinet read saved student snapshots.
They use the same `InneruLearning.snapshot(profile)` rules as the student dashboard:
39 missions, six system finals, and 49 achievements. Reading another student's
record never replaces the active learner or awards XP.

On the student's device choose Show progress code. Paste that code into the
teacher's Collect student work panel. A current learner ID updates the same
student, including after a nickname change. Different IDs may share a nickname.
Older codes without IDs require an explicit choice when a name is ambiguous.
Repeated identical old imports are deduplicated. Older timestamped snapshots do
not overwrite newer work. Snapshots are manual collections, not live cross-device
connections. Other classroom tabs in the same browser show a refresh notice.

Class records, groups, notes and feedback live in IndexedDB
`inneru-classroom-v2`, separate from the active learner's localStorage profile.
The earlier `inneru-class-v1` metadata register is migrated on first access.
The register starts empty; illustrative learners exist only in isolated tests.

## Answer evidence

`learning-evidence.js` records submitted work from this release onward: graded
checkpoints in all six systems, multi-step skin/respiratory investigations,
submitted muscle explanations, detective case conclusions, connection predictions
and explanations, review answers, and final decisions. Form and investigation
submissions also retain the actual selected values/text where supported. Model
browsing and preview mode create no answer records. The journal keeps the latest
600 task responses and up to four earlier attempts per task, with the total
recorded-attempt count. It is included in new progress codes and classroom backups.

Automatic correct/incorrect status comes from the existing assessment logic.
Written/self-assessed and generic investigation submissions are labelled for
teacher review, without inferring correctness from completion or XP. Accuracy
means the percentage of latest automatically graded task responses that are
correct; it is not a percentage of all historical attempts. Earlier work cannot
reconstruct answer choices or timestamps that were never stored. Summary-only
legacy codes show their reported totals without inventing exact missions or
mission badges.

Teacher feedback is tied to a response's submission timestamp. A newer response
requires a new review and retains the previous comment. Feedback does not edit the
student's answer, points or badges and does not automatically travel back to the
student's device. Export or print feedback to share it.

## Preservation and access

Export classroom backup preserves snapshots, answers, groups, notes and feedback.
Register and response CSV exports use the active filters and protect spreadsheet
formula fields. Invalid backups fail before any partial restore. Older incoming
student snapshots are skipped. Teacher imports never load another profile into
the active learner unless Restore learner on this device is explicitly chosen.
That action and shared-device preparation retain the existing ten-minute undo.
Clearing the register leaves active learner progress intact; clearing site data
removes local records. Browser entry provides no account access controls.

The dashboard supports keyboard-accessible details/confirmations, phone layouts,
print, reduced motion and cached offline access. Service worker version 37 includes
the journal and dashboard modules. No student names, submissions or notes are sent
to a classroom server.

## Verification

Run `python3 _dev-tools/verify-teacher-dashboard.py` with Python Playwright and
Chromium. It drives real submissions in every system, preserves attempts and XP,
collects and reimports codes, reviews writing, tests stale imports, exercises
backups/reset/undo, class migration, concurrent imports, storage errors, classroom
update notices and offline answers, and validates responsive layouts. Existing dashboard, recall,
login, skin and respiratory activity runners remain applicable.
