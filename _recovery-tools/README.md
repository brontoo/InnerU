# Recovery tools — archive only

These are the one-time tools that **recovered this project** from the published site after the
ChatGPT Sites source became unreachable. They are kept here as a record and as a fallback.

**You do not need them for day-to-day work.** For that, use the two files in the project root:

| File | Purpose |
|---|---|
| `start-work.cmd` | pull the latest changes from GitHub, then run the site locally |
| `push-updates.cmd` | commit your changes and push them (Vercel redeploys automatically) |

## What these tools do

| File | What it does |
|---|---|
| `restore-inneru.ps1` | byte-exact download of every file the published site serves, recursively following imports; writes `_export-manifest.json` with a SHA-256 per file, then runs a dependency check |
| `restore-missing-assets.ps1` | downloads the seven assets whose paths the site builds **at run time** (`assets/${kind}-atlas.glb` in `body-atlas.js`, `assets/${fast?'sprint':'endurance'}.webp` in `muscle.js`). No text scan can find those paths, so the first mirror missed them and every Body Atlas 3D viewer fell back to its static placeholder. Never overwrites an existing file unless you pass `-Force`. |
| `publish-to-github.ps1` | first upload only: verifies the remote repository is empty, then init + commit + push |

The double-click wrappers (`run.cmd`, `publish-to-github.cmd`) are not archived — run the `.ps1`
files directly with:

```powershell
powershell -ExecutionPolicy Bypass -File .\restore-inneru.ps1
```

## Important

Both scripts expect to sit one level **above** the site folder:

```
<parent>\
  restore-inneru.ps1
  publish-to-github.ps1
  inneru-site\            <- this project
```

- `restore-inneru.ps1` **never overwrites existing files** (pass `-Force` to replace them), so
  re-running it cannot undo your edits.
- `publish-to-github.ps1` refuses to run against a repository that already has commits — that is
  what `push-updates.cmd` is for.

The recovery record itself lives in the project root: `SOURCE-BACKUP.md`, `_download-report.txt`,
`_download-log.txt`, `_export-manifest.json`.
