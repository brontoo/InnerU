# InnerU — Explore What's Inside

Interactive, gamified human-body learning for **Grade 10 Science** at **Um Al-Emarat School**.
Plain HTML / CSS / JavaScript: **no build step, no framework, no dependencies, no server**.

The muscular world uses a **supplied labelled figure** instead of a 3D mesh. It can be turned
(drag, arrow keys, Auto rotate, Reset view) and it behaves like the other labs: choosing a muscle
makes the body translucent and spotlights that muscle in full colour, with a ring around it, either
from the Muscle List or by tapping one of the 31 dots on the figure. The four muscles that lie on
the back of the body (triceps, latissimus dorsi, gluteals, hamstrings) get a dashed ring where they
pass behind the silhouette, plus a note, so all 17 entries respond.

Six worlds (one per body system) + a final mission that ties them together, a
spaced-practice review system, classroom tools for the teacher, and an offline copy
for weak wifi.

---

## What a student does

| Where | What it is |
|---|---|
| `#home` | the human systems map: six worlds, each with missions, checks and a System Key |
| `#world`, `#integumentary`, `#muscle`, `#respiratory`, `#circulatory`, `#excretory` | the six worlds: 6–7 missions each, an interactive lab, three checks per mission, and a final challenge that earns the Key |
| `#mission/N` | a skeletal-system mission (World 02; its content lives in `content-skeletal.js`) |
| `#detective`, `#connect`, `#badges`, `#daily` | Body Detective cases, System Connections, achievements, the daily question |
| `#final` | **Keep the body alive** — the capstone: one scenario, six applied decisions across all six systems, a written synthesis, and a printable certificate (unlocked with 6/6 System Keys) |
| `#review` | **spaced practice**: 54 questions from all six systems, Leitner boxes (1 · 3 · 7 · 16 days), missed items return first |
| `#glossary` | every key term in the six systems, one sentence each, with the Arabic term beside it |
| `#teacher` | **classroom tools** (see below) |

Progress is stored in **`localStorage`** under `bodyquest-v1`; nothing is uploaded.

Two reading supports run on every lesson page: **tap any underlined term** for a one-sentence
definition with the Arabic word beside it, and **▶ Listen** to have the page read aloud with the
words highlighted as they are spoken. Both respect a per-student preference and need no network.

## What the teacher gets (`#teacher`)

* A **progress code** per student (about 90 characters, checksum protected) that moves
  a student between devices.
* A **class list** built by pasting codes or saving the current device, printable as a
  one-page PDF.
* **"Finish for the next student"** — one tap to clear a shared tablet, with a
  10-minute undo.

## Daily workflow (two double-clicks)

| Click | When | What it does |
|---|---|---|
| `start-work.cmd` | when you sit down | pulls from GitHub, starts the local server, opens the site |
| `push-updates.cmd` | when you finish | commits and pushes → Vercel redeploys |

Always work through `start-work.cmd` (or `dev.cmd`): the 3D labs use ES modules and
`fetch()` for `.glb` models, which browsers block on `file://`.

---

## Architecture

### The shell

`index.html` loads, in this order:

**Stylesheets (14)** — ``teacher.css` · `review.css` · `habit.css` · `style.css` · `exhibit.css` · `muscle.css` · `muscle-learning.css` · `welcome.css` · `circulatory.css` · `body-atlas.css` · `respiratory.css` · `integumentary.css` · `excretory.css` · `capstone.css``

**Scripts (21)** — ``anatomy.js` · `visuals.js` · `body-atlas-ui.js` · `content-skeletal.js` · `app.js` · `circulatory.js` · `rich-pages.js` · `muscle-visuals.js` · `muscle-learning.js` · `muscle.js` · `circulatory-integration.js` · `respiratory.js` · `integumentary.js` · `excretory.js` · `capstone.js` · `a11y.js` · `teacher.js` · `review.js` · `habit.js` · `muscle-force.js` · `pwa.js``

**On-demand modules (`body-atlas.js`, `heart-explorer.js`)** — imported only when a 3D view is on screen, so the ~2 MB
three.js bundle is not downloaded by pages that do not need it.

`404.html` is a byte-identical copy of `index.html`, used as the fallback shell.

### The extension pattern

Nothing edits the core. Every world and every later feature is an **outer wrapper**:

```js
const previousRoute = route;
window.removeEventListener('hashchange', previousRoute);
route = function () { /* my routes first */ ... ; previousRoute(); };
window.addEventListener('hashchange', route);

const previousHome = home; home = function () { previousHome(); /* decorate */ };
```

Loading order therefore matters: the last script loaded is the outermost wrapper.
`glossary.js` marks key terms in the rendered text and `speech.js` reads a page aloud — both
are wrappers too, so no world file knows they exist. `a11y.js` decorates whatever the worlds rendered (progress-bar roles, focus, titles),
and `habit.js` / `teacher.js` / `review.js` / `capstone.js` / `muscle-force.js` add
their layers on top.

### State

```
bodyquest-v1
├── name, xp, level, motion, rewards[], weak[]      (skeletal world lives here)
├── integumentary / respiratory / excretory  { done[], steps{}, mastery, weak[] }
├── circ   { done[], steps[], mastery, boss }
├── muscle { done[], tasks{}, weak[], xp }
├── capstone { done, date, stations{}, response, rubric[] }
├── review   { items{ box, lastSeen, due }, answers, correct, sessions }
└── habit    { last, streak, best, days{}, dismissed }
```

Six **System Keys** are counted by one function (`keysEarned()` in `app.js`), used by
the home card, the dashboard and the capstone gate.

### Content

* `content-skeletal.js` — World 02 content only (missions, 24 assessment items, cases, references)
* every other world keeps its lessons, labs and checks at the top of its own file
* `review.js` holds the 54-item review pool
* `capstone.js` holds the final-mission scenario and rubric

## Offline and performance

* `sw.js` + `manifest.webmanifest` (registered by `pwa.js`) make the site installable
  and usable without wifi: **network-first** for the shell and code so a push is picked
  up immediately, **stale-while-revalidate** for large immutable assets.
* `/?nosw=1` skips the service worker — use it if a stale offline copy ever gets in the way.
* The muscular route loads no three.js and no mesh at all: it shows a 51 KB WebP figure, keeps the
  musculature readable with CSS masks (a dimmed copy plus spotlit copies), and stays interactive.
* 3D payload per route: skeleton 2.2 MB, muscular 4.7 MB, skin 1.1 MB, heart 0.6 MB.
  These `.glb` files ship uncompressed; compressing them (Draco/meshopt) is the main
  remaining performance win.

## Deploy

The repository root **is** the site; there is nothing to build. Vercel deploys it on
every push (`.vercelignore` keeps the development tools and docs out of the deployment,
`vercel.json` sets cache headers). Netlify, Cloudflare Pages and GitHub Pages work too —
routing is hash-based, so no rewrite rules are needed.

## Development tools

`_dev-tools/` holds the headless verification harnesses used while building the site.
They serve this folder read-only on a local port and drive the real pages in Chrome:
run `python _dev-tools/verify-stage6.py`, open the printed URL, and read the PASS/FAIL
report. They are excluded from the deployment.

## Provenance

The source was recovered from the published site after ChatGPT Sites became unreachable —
see `SOURCE-BACKUP.md` and `_export-manifest.json`. Since then the project has been
restructured: the NaN fixes, the Cloudflare snippet removal, the recovered 3D assets,
the six interactive labs, the capstone, review, teacher tools and the habit layer.
The manifest describes the **original export**, not the current tree.
