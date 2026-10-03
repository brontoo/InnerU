# InnerU — Explore What's Inside

Interactive, gamified human-body learning site for **Grade 10 Science** at **Um Al-Emarat School**.
Six "worlds" = six body systems, each with missions, three checks per mission, a final challenge and a **System Key**.

Plain HTML / CSS / JavaScript. **No build step, no framework, no dependencies.**

---

## Run it locally

Double-click **`dev.cmd`**, or:

```powershell
powershell -ExecutionPolicy Bypass -File .\serve.ps1          # http://localhost:8080
powershell -ExecutionPolicy Bypass -File .\serve.ps1 -Port 5500 -NoBrowser
```

> **Why not just open `index.html`?** The 3D labs use ES modules (`heart-explorer.js`, `body-atlas.js`)
> and load `.glb` models with `fetch()`. Browsers block both on `file://` URLs, so the 3D viewers
> fail silently when the file is opened directly. Always use the local server for development.

`serve.ps1` is a self-contained static server (no admin rights, no internet, no extra installs).

---

## Deploy

The repository root **is** the deployable site — there is nothing to build.

| Host | How |
|---|---|
| Cloudflare Pages | Direct Upload, or connect this repo (build command: *none*, output: `/`) |
| Netlify | drag the folder onto https://app.netlify.com/drop, or connect the repo |
| GitHub Pages | Settings → Pages → deploy from branch `main`, folder `/` |
| Any static host | copy the folder |

Routing is hash-based (`#world`, `#mission/3`, `#respiratory/mastery`), so **no SPA rewrite rules are needed**.
`404.html` is a copy of the shell used as a fallback.

---

## Architecture

```
index.html          loads 10 stylesheets, 14 classic scripts, then 2 ES modules — in a deliberate order
app.js              core: state, storage, router, layout, home / world / mission / dashboard / badges /
                    detective / connect / daily / info, progression + XP + badges
anatomy.js          body map drawing used by the home screen
visuals.js          muscle/micro-anatomy SVG generators
body-atlas-ui.js    shared 3D "atlas" markup + helpers
body-atlas.js       (ES module) three.js scene builder for the atlases
heart-explorer.js   (ES module) interactive 3D heart
shoulder.js         extra atlas part data
rich-pages.js       presentation layer for the skeletal world pages
muscle*.js          muscular world: missions, learning widgets, visuals
circulatory*.js     circulatory world: 7 missions, mastery, boss, dashboard/badges integration
respiratory.js      respiratory world (6 missions + final challenge)
integumentary.js    integumentary world (6 missions + final challenge)
excretory.js        excretory world (6 missions + final challenge)
*.css               one stylesheet per world + shared style.css / exhibit.css
assets/three/       vendored three.js r-? (three.module.js, GLTFLoader.js, OrbitControls.js)
assets/*.glb        anatomical 3D models (heart, muscle additions)
assets/*.webp       photographic assets
```

### The extension pattern (important)

Each world is a self-contained module that *wraps* the core without editing it:

```js
const oldRoute = route;
window.removeEventListener('hashchange', oldRoute);
route = function () { /* my hashes first */ ... else oldRoute(); };
window.addEventListener('hashchange', route);

const oldHome = home;   home = function(){ oldHome(); /* decorate the home screen */ };
const oldPortal = portal; portal = function(i){ if(i!==MY_INDEX) return oldPortal(i); /* my card */ };
```

**Load order in `index.html` matters**: the last loaded module becomes the outermost wrapper and
runs its decorations last. If you add a world, append its script tag after the existing ones.

### State model

- One `localStorage` key: **`bodyquest-v1`** (see `save()` / the `state` object in `app.js`).
- Global slice: `state.name`, `state.xp`, `state.done[]` (skeletal world: missions 1–7 + boss 8),
  `state.rewards[]`, `state.weak[]`, `state.level` (Explorer / Challenger / Master), `state.motion`.
- Per-world slice: `state.integumentary`, `state.respiratory`, `state.excretory`, `state.circ`, `state.muscle`
  — each `{ done: [], steps: {}, mastery: bool }`.
- Six System Keys: one per world, earned by finishing that world's final challenge.

### Routes

`#home` `#world` `#mission/N` `#dashboard` `#detective` `#connect` `#badges` `#daily`
`#sources` `#about` `#privacy` `#attribution`
plus per world: `#respiratory[/mission/N|/mastery]`, `#integumentary[...]`, `#excretory[...]`,
`#muscle[/mission/N|/complete|/review]`, `#circulatory[/N|/mastery|/boss]`

---

## Provenance and changes

This repository began as a **byte-exact export of the published site** (see `SOURCE-BACKUP.md`
and `_export-manifest.json`). The first commit is the untouched export; every later commit is a
deliberate change. Current changes:

1. **Fixed `NaN`** shown to students — `Number(someState.mastery)` on a fresh profile evaluates to
   `NaN` (`undefined` coerced). Affected: `respiratory.js` (percent + `/6 keys`), and the same latent
   pattern in `circulatory-integration.js`.
2. **Removed the Cloudflare bot-challenge snippet** that the host had injected into `index.html` and
   `404.html`, and deleted the downloaded `cdn-cgi/` folder. It belongs to the old host, not the app.
3. Added `serve.ps1`, `dev.cmd`, `package.json`, `README.md`, `SOURCE-BACKUP.md`, `.gitignore`,
   `.gitattributes`.

---

## Content credits

In-app: `#sources`, `#attribution`, `#about`, `#privacy`.
The 3D heart mesh is derived from **DBCLS BodyParts3D** (CC BY-SA 2.1 Japan); textbook figures are not
reproduced. Progress is stored only in the student's own browser.

---

## ملخص سريع بالعربية

- **للتشغيل:** انقر مرتين على `dev.cmd` — سيفتح الموقع على `http://localhost:8080`
  (لا تفتح `index.html` مباشرة، لأن مختبرات 3D لا تعمل من نظام الملفات).
- **للنشر:** ارفع المجلد كما هو إلى Cloudflare Pages أو Netlify — لا توجد عملية بناء.
  التوجيه بـ `#hash` فلا تحتاج قواعد إعادة كتابة.
- **لإضافة عالم جديد:** ملف JS مستقل يلتفّ حول `route`/`home`/`portal`، ويُضاف في نهاية قائمة
  السكربتات في `index.html`، مع مقطع حالة خاص به في `state`.
- **التقدّم** يُحفظ في `localStorage` تحت المفتاح `bodyquest-v1`.
