# Interactive body-team connection challenge

`body-team.js` wraps the existing System Connections renderer after the illustrated
everyday scenes. It replaces the old four response cards, matching table and
narrow writing sidebar with three connected sections:

1. **Explore the response.** A navy anatomy lab offers six freely selectable
   systems, detailed original portal artwork, rest/jog/faster-run controls, a
   hot/mild weather switch and a two-choice science prediction for each system.
   The explanations distinguish ventilation and alveolar exchange, the two heart
   circuits, muscle tension/ATP use, skeletal leverage, evaporative cooling and
   kidney regulation over time. Pace and temperature change the qualitative
   response descriptions. A decorative response cue changes tempo, without
   deforming anatomical images or claiming measured physiological rates.
2. **Build the team.** Students tap a contribution then a system, drag a role
   to a slot, or use the native menus. Each role can occupy one slot; moving it
   frees its previous slot. Placements are not marked correct until checked.
   Correct, retry and empty states include text, rather than colour alone.
3. **Tell the story.** Oxygen, movement and cooling prompts guide the learner's
   explanation without inserting answers. The word count is descriptive, not
   a grade. The existing model comparison and self-reflection are retained.

The source `#systems` selects, `#check-match`, feedback, `#connection-reason`,
`#compare` and `#connection-model` nodes are moved intact. Their original match
and written-comparison handlers continue to run, including the exact once-only
`connection` reward of 35 XP. Correct matches alone, anatomy exploration,
predictions, scenario controls and role placement do not award or save progress.
Changing/resetting a checked answer invalidates the new validation flag. A capture
handler blocks a stale reflection event before the original reward handler, so
an earlier successful check cannot bypass the current matching prerequisite.

Local counters describe systems explored and roles placed; they are not course
completion or new persistent achievements. Anatomy and pace/weather exploration
never write the learner record. Existing earned rewards remain visible on return.

The three-step rail and run-hero action scroll and focus the relevant section
without changing the page hash. System tabs support arrow keys/Home/End. All
controls have native keyboard alternatives; select labels include the system
name. The response animation is suspended outside the viewport, when the document
is hidden or while an existing anatomy lens is open. Local pause, app motion
settings and OS reduced motion are respected. Removal aborts listeners and
disconnects observers; no animation timers or rendering loops are introduced.

At desktop widths, anatomy and coaching sit side by side; the team board uses
three columns and the writing workspace two. Tablet and phone layouts stack
the lab, use two/one matching columns and keep touch controls readable down to
320px. On phones, the role bank scrolls horizontally and stays available while
matching, avoiding repeated trips back up the board. All artwork reuses the original optimized home anatomy studies. Both HTML
entry points load versioned JS/CSS; offline shell v30 includes them.

Run `python3 _dev-tools/verify-body-team.py` for actual scenario changes, all six
anatomical systems, predictions, click/keyboard/drag placement, unique assignment,
withheld feedback, stale-reflection prevention, writing guidance, reward
deduplication, motion preferences, five viewport widths, route cleanup and reload.
Run `python3 _dev-tools/verify-connection-scenes.py` for regression coverage of
all six everyday illustrated cards and their 18 structure explanations.
