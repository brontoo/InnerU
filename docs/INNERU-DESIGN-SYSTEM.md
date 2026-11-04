# InnerU shared design foundation — Phase 1

Implementation: `style.css`, `--iu-*` tokens at the top and a named shared
component section at the end. No framework, icon library or new CSS request.
The existing Body Quest wordmark, adventure art, system colors and rewards stay.
This is a contract for gradual reuse, not a redesign of the dashboards or lessons.

## Color and hierarchy

| Token | Value | Intended role |
| --- | --- | --- |
| `--iu-navy` | `#14283D` | Strong headings, dark tooltip surfaces |
| `--iu-teal` | `#2C8985` | Scientific accent; not small white-on-teal text |
| `--iu-ivory` | `#F7F3EA` | Illustration and subtle badge surfaces |
| `--iu-coral` | `#E78977` | Decorative warm accent, not an error label alone |
| `--iu-brass` | `#BEA16B` | Decorative borders, awards and separators |
| `--iu-text` | `#183044` | Body/control text |
| `--iu-muted` | `#57717E` | Secondary text on white/light surfaces |
| `--iu-action` | `#087E80` | Primary action background with white text |
| `--iu-action-hover` | `#06676A` | Action hover and selected-navigation text |
| `--iu-selected` | `#E2F1EE` | Active/navigation or quiet selected surface |
| `--iu-focus` | `#086B83` | Visible keyboard focus outline |
| `--iu-surface`, `--iu-surface-soft`, `--iu-border` | `#FFF`, `#F4F8F7`, `#D7E3E6` | Card/control surfaces and quiet boundaries |
| `--iu-control-border` | `#718B95` | Identifiable form-control boundaries (3.60:1 on white) |

Calculated sRGB contrast: body text on white **13.59:1**, muted on white
**5.16:1**, white on action **4.88:1**, selected text on selected surface
**5.72:1**. Reference teal on white is **4.18:1**, coral **2.55:1**, brass
**2.47:1**; these accents must not replace normal-size text/action colors.
These are solid-color calculations, not a claim about every image/gradient.

Use one heading to identify a page, a supporting sentence to explain the next
action, and a primary action only where there is a real task. Keep locked,
unavailable and insufficient-evidence states explicit in text. Do not use color,
an icon or XP as the only explanation of a learning state.

## Sizing and typography

- Spacing: `--iu-space-1` through `7` = **4, 8, 12, 16, 24, 32, 48px**.
- Corners: control **10px**, card **16px**, dialog **20px**.
- Shadows: `--iu-shadow-card` (quiet surface lift), `--iu-shadow-dialog`
  (modal elevation). Avoid decorating every nested block with another shadow.
- `--iu-font-body`: existing DM Sans fallback stack;
  `--iu-font-heading`: existing Manrope stack. Arabic continues to use the
  existing Tahoma/Arial locale rules; do not force a Latin font over them.
- Text scale: `--iu-text-small` **.875rem**, `--iu-text-body` **1rem**,
  `--iu-text-title` **clamp(1.8rem, 3vw, 2.7rem)**. Existing lesson and Arabic
  sizes remain in force. No fixed-height container for a translated paragraph.
- Prose measure: **68ch**; page container maximum **1500px** when opted in.
  Existing teacher/student-specific page widths are preserved.
- Interactive target: **44px** minimum for shared navigation/buttons. Use
  flexible height and padding so Arabic and zoom do not clip the label.

## Component contract

| Class | Semantics/behavior the author must supply |
| --- | --- |
| `.iu-page` | Responsive page width; use inside the existing main landmark, never add a second main. |
| `.iu-page-header`, `.iu-title`, `.iu-prose` | Flexible heading/action row and readable copy; choose actual `h1`/`h2` hierarchy. |
| `.iu-card` | Reusable dashboard/widget surface; provide a heading if it is a section. |
| `.iu-button`, `.iu-button-secondary` | Use a native button for actions, a real link for navigation. Declare `type="button"` for non-submit controls. Disabled state must be meaningful; never rely on styling for authorization. |
| `.iu-tabs` | Appearance only. Navigation views use links and `aria-current="page"`; true same-page tabs need `role="tablist"`, selected state, tab panels and arrow-key behavior. CSS does not implement a tab widget. |
| `.iu-filters` | Wrapping labeled controls; retain original option values, IDs and filter handlers. |
| `.iu-progress` | Track and child span; set `--iu-progress-value:45%`. Provide `role="progressbar"`, name, min/max/current and a visible numeric label. It represents completion, not mastery. |
| `.iu-badge` | Compact text/icon status. Decorative icon gets `aria-hidden`; earned/locked meaning remains in text. Does not award a learning badge. |
| `.iu-table-scroll`, `.iu-table` | Intentional local table scrolling. Supply a caption and header cells/scopes. If horizontally scrollable, make the wrapper keyboard focusable and give it an accessible name. Do not clip the entire page to hide overflow. |
| `.iu-dialog` | Native `dialog` surface; use `showModal()`, a title, close/cancel, Escape and focus return. Do not replace existing secure confirmation handlers. |
| `.iu-tooltip` | Visual surface only; supply `role="tooltip"`/`aria-describedby`, keyboard as well as pointer access, dismissibility and viewport positioning. Essential instructions remain visible outside a tooltip. |
| `.iu-empty`, `.iu-loading` | Visible explanatory text and next step; add appropriate status/live/busy semantics when asynchronous. No decorative infinite animation required. |
| `.iu-illustration` | Figure/image/caption surface with contained, proportional image; explicit dimensions and meaningful alt where needed. Not a replacement for a WebGL viewport or its physical coordinate system. |

These primitives are deliberately opt-in. The first adoption uses existing
`.sidebar .navlink`, `.headrow`, `.panel`, `.btn` and footer links. Teacher metric
cards, assessment choices, model canvases, XP widgets and mission maps are not
bulk restyled.

Example for a future non-assessment section:

```html
<section class="iu-card" aria-labelledby="resource-heading">
  <header class="iu-page-header">
    <div>
      <h2 id="resource-heading">Learning resources</h2>
      <p class="iu-prose">Choose a system to prepare your lesson.</p>
    </div>
    <a class="iu-button" href="#teacher?view=preview">Mission Preview</a>
  </header>
</section>
```

New visible text must have an authored route/common Arabic entry; examples in
documentation are not automatic new UI or permission grants.

## Navigation, responsive and RTL rules

1. Existing hash URLs and verified-role destinations are the source of truth.
   The identity decorator marks student current links; teacher/owner decoration
   retains its own route/query-aware selection. System lessons belong to Explore
   Worlds. Teacher/owner information pages do not falsely select Dashboard;
   unrepresented information pages need no fabricated selected tab.
2. Desktop retains the existing sidebar. At **760px and below**, primary links
   wrap into two columns with flexible height; no student destination is hidden
   in a horizontal strip. Teacher/owner primary destinations remain unchanged.
3. Active navigation combines weight, a filled surface and an edge marker.
   The desktop marker follows the reading start edge; mobile uses the bottom
   edge in either language. Selection adds no border width. Keyboard focus is
   a separate outline, not a substitute for active selection.
4. Use `padding-inline`, `margin-block`, `min-inline-size:0`, flexible grids and
   wrapping text. Do not mirror anatomy, formulas or physical camera controls.
   Keep email/password fields, scientific notation and numeric fractions isolated
   as the existing locale layer requires.
5. Preserve browser/app reduced motion. New primitives have no animation.
   No drag-only or speech-only action is introduced. Reading remains explicitly
   user activated; inability to speak does not hide instructions.
6. Existing global focus/RTL/print rules still apply. New color/background
   combinations need their own contrast review; this token list is not blanket
   approval for arbitrary combinations.

## Cascade and safe adoption

The shell's ordered styles remain in place. Tokens and primitives are in
`style.css`; later `exhibit.css`, route styles and `learning-support.css` retain
their positions. Shared-shell selectors use `.shell .sidebar ...` specificity to
override only competing navigation rules. Do not add `!important` to resolve a
lesson layout collision. Keep geometry, assessment logic, scientific facts and
permission decisions outside this style contract.

The separate login stylesheet retains its existing identity and layout. Its
screens are included in regression screenshots, but this phase does not add the
portal stylesheet to login (which would increase its critical payload). Migrating
login tokens can be evaluated with a measured loading budget in a later change.

Run `npm run test:design-foundation`, `npm run test:arabic-layout`,
`npm run test:accessibility`, `npm run test:arabic-coverage` and the performance
gate for future shared changes. The full `npm test` also includes the foundation
check. See the implementation report for the exact executed scope.
