# Source backup — provenance

This folder is a recovery of the InnerU source code. It was exported from the **published site**
because the ChatGPT Sites project source had become unreachable (the platform's Git backend failed
with `HTTP 500 … fatal: expected 'packfile'`, and ChatGPT Sites exposes no export/download feature).

| | |
|---|---|
| Published site | https://body-quest-um-al-emarat.ahmed87ahmed.chatgpt.site |
| ChatGPT Sites project id | `appgprj_6aaed33fdc948191b343dd435e2bbd61` |
| Exported (UTC) | 2026-10-03 |
| Method | byte-exact download of every file the published site serves (`restore-inneru.ps1`) |
| Files | 45 · ~5.2 MB |
| Per-file SHA-256 | `_export-manifest.json` |
| Download report | `_download-report.txt`, `_download-log.txt` |

## Why this is real source, not a reconstruction

The published site serves **unbundled, unminified** JavaScript (`app.js` ≈ 62 KB, plus one module per
world) and plain CSS, with original identifiers, comments and formatting. Downloading it therefore
returns the application's actual source files — no reverse-engineering, no re-typing, no guessing.

## What could NOT be recovered

These live only inside ChatGPT Sites and are not part of the served files:

- publishing/hosting configuration, custom-domain settings
- environment variables and secrets
- any edits made **after** the last publish (only the published revision could be downloaded)

## Deviation from the served bytes

The **first Git commit** in this repository is the untouched export. Everything after it is a
deliberate change, so `_export-manifest.json` matches commit #1 and differs for any file edited later:

1. `respiratory.js`, `circulatory-integration.js` — fixed `NaN` progress values
   (`Number(x.mastery)` → `Number(!!x.mastery)`; `undefined` was being coerced to `NaN`).
2. `index.html`, `404.html` — removed the Cloudflare bot-challenge `<script>` block that the old host
   injected at the edge; deleted the downloaded `cdn-cgi/` folder.
3. Added development/deployment files: `serve.ps1`, `dev.cmd`, `package.json`, `README.md`,
   `SOURCE-BACKUP.md`, `.gitignore`, `.gitattributes`.

## If the original project ever becomes reachable again

Compare it against this folder and check hashes against `_export-manifest.json`. `git log` plus that
manifest gives an exact record of both the original bytes and every subsequent change.
