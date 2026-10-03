<#
  publish-to-github.ps1
  ---------------------
  Commits the mirrored InnerU site (folder "inneru-site") to a GitHub repository,
  so the recovered code lives in version control instead of only on disk.

  It expects an EMPTY repository (that is what the ChatGPT-Sites export flow uses).
  If the repository already has commits, this script stops and tells you why.

  Usage:
    powershell -ExecutionPolicy Bypass -File .\publish-to-github.ps1
    powershell -ExecutionPolicy Bypass -File .\publish-to-github.ps1 -RepoUrl https://github.com/you/other-repo.git

  GitHub will ask you to sign in the first time it pushes (Git Credential Manager).
#>
[CmdletBinding()]
param(
  [string]$SourceDir = '',
  [string]$RepoUrl   = 'https://github.com/brontoo/InnerU.git',
  [string]$Branch    = 'main',
  [string]$CommitMsg = 'Source backup exported from ChatGPT Sites'
)

$ErrorActionPreference = 'Stop'

# $PSScriptRoot is NOT reliable inside the param() default block on Windows PowerShell 5.1,
# so resolve the default source folder here in the body.
$here = $PSScriptRoot
if (-not $here) { $here = Split-Path -Parent $MyInvocation.MyCommand.Path }
if (-not $SourceDir) { $SourceDir = Join-Path $here 'inneru-site' }

function Say($m) { Write-Host $m }

Say 'InnerU -> GitHub'
Say "Source folder : $SourceDir"
Say "Repository    : $RepoUrl  (branch $Branch)"
Say ''

# --- preconditions ---------------------------------------------------------
if (-not (Get-Command git -ErrorAction SilentlyContinue)) {
  Say 'FATAL: git is not installed or not on PATH. Install Git for Windows, then re-run.'
  exit 1
}
if (-not (Test-Path (Join-Path $SourceDir 'index.html'))) {
  Say "FATAL: '$SourceDir\index.html' not found."
  Say 'Run run.cmd first so the site is downloaded into "inneru-site".'
  exit 1
}

Say 'Checking the repository ...'
$remoteRefs = & git ls-remote $RepoUrl
if ($LASTEXITCODE -ne 0) {
  Say "FATAL: cannot read $RepoUrl"
  Say 'Check the URL, your internet connection, and that you are signed in to GitHub.'
  exit 1
}
if ($remoteRefs) {
  Say 'STOP: this repository already contains commits:'
  $remoteRefs | ForEach-Object { Say "  $_" }
  Say ''
  Say 'Nothing was changed. Options:'
  Say '  1) create a NEW empty GitHub repository and pass it with -RepoUrl, or'
  Say '  2) clone the existing repository and copy the files in yourself.'
  exit 1
}
Say 'Repository is empty - good.'
Say ''

# --- stage the export ------------------------------------------------------
Push-Location $SourceDir
try {
  if (Test-Path '.git') {
    Say 'Note: this folder is already a git repository; reusing it.'
  } else {
    & git init -b $Branch | Out-Null
    Say "Initialised a new git repository (branch $Branch)."
  }

  # ignore build noise, keep the export provenance files (never clobber an existing file)
  if (-not (Test-Path '.gitignore')) {
    @(
      'node_modules/'
      'dist/'
      'build/'
      '.DS_Store'
      'Thumbs.db'
      '*.tmp'
    ) | Set-Content -LiteralPath '.gitignore' -Encoding UTF8
  }

  $fileCount = @(Get-ChildItem -Recurse -File | Where-Object { $_.FullName -notmatch '\\\.git\\' }).Count
  $bytes     = (@(Get-ChildItem -Recurse -File | Where-Object { $_.FullName -notmatch '\\\.git\\' }) | Measure-Object -Property Length -Sum).Sum

  if (-not (Test-Path 'SOURCE-BACKUP.md')) {
    @"
# InnerU - source backup

Exported from the published site:
https://body-quest-um-al-emarat.ahmed87ahmed.chatgpt.site

- ChatGPT Sites project: ``appgprj_6aaed33fdc948191b343dd435e2bbd61``
- Export date (UTC): $((Get-Date).ToUniversalTime().ToString('u'))
- Files: $fileCount  ($([math]::Round($bytes/1KB,1)) KB)
- Method: byte-exact download of every file the live site serves
  (``restore-inneru.ps1``). The site ships unbundled, readable JS/CSS,
  so these are the real source files, not a reconstruction.
- Per-file SHA-256 hashes: ``_export-manifest.json``

## Not included (lives only inside ChatGPT Sites)

- publish/hosting settings, custom domain and environment variables or secrets
- any edits made after the last publish (only published files could be downloaded)

## Verify later

If the original Sites source becomes reachable again, diff it against this
folder and compare hashes with ``_export-manifest.json``.
"@ | Set-Content -LiteralPath 'SOURCE-BACKUP.md' -Encoding UTF8
  }

  # a commit needs an identity
  if (-not (& git config user.name))  { & git config user.name  'InnerU Backup' }
  if (-not (& git config user.email)) { & git config user.email 'inneru-backup@local' }

  & git add -A
  $staged = @(& git diff --cached --name-only).Count
  if ($staged -eq 0) {
    Say 'Nothing new to commit.'
  } else {
    & git commit -m $CommitMsg | Out-Null
    Say "Committed $staged files."
  }

  # (re)point origin at the target repository — remove ignores a missing origin
  $null = & git remote remove origin
  & git remote add origin $RepoUrl

  Say ''
  Say 'Pushing (GitHub may ask you to sign in) ...'
  & git push -u origin $Branch
  if ($LASTEXITCODE -ne 0) {
    Say ''
    Say 'Push FAILED. Common causes:'
    Say '  - you are signed in as a different GitHub account than the repo owner'
    Say '  - the repository was created by a different account, or is not empty any more'
    Say '  - no network / 2FA prompt not completed'
    Say 'The local commit is safe; fix the cause and run:  git push -u origin ' + $Branch
    exit 1
  }

  $sha = (& git rev-parse --short HEAD)
  Say ''
  Say 'DONE.'
  Say "  commit : $sha  ($Branch)"
  Say "  files  : $fileCount"
  Say "  repo   : $RepoUrl"
} finally {
  Pop-Location
}
