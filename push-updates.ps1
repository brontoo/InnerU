<#
  push-updates.ps1 — save your work to GitHub.
  -------------------------------------------
  Commits every change in this folder and pushes it to GitHub. Use this for normal
  day-to-day work; publish-to-github.cmd is only for the very first upload.

  Usage:
    powershell -ExecutionPolicy Bypass -File .\push-updates.ps1
    powershell -ExecutionPolicy Bypass -File .\push-updates.ps1 -Message "Add excretory quiz"
#>
[CmdletBinding()]
param(
  [string]$Message = '',
  [string]$Branch  = 'main',
  [string]$Remote  = 'origin'
)

$ErrorActionPreference = 'Stop'

$here = $PSScriptRoot
if (-not $here) { $here = Split-Path -Parent $MyInvocation.MyCommand.Path }

function Say($m) { Write-Host $m }

if (-not (Get-Command git -ErrorAction SilentlyContinue)) {
  Say 'git is not installed or not on PATH.'
  exit 1
}
if (-not (Test-Path (Join-Path $here '.git'))) {
  Say 'This folder is not a git repository yet.'
  Say 'Run publish-to-github.cmd (in the parent folder) first.'
  exit 1
}

Set-Location -LiteralPath $here

if (-not $Message) { $Message = 'Update ' + (Get-Date).ToString('yyyy-MM-dd HH:mm') }

& git add -A
$staged = @(& git diff --cached --name-only)
if ($staged.Count -eq 0) {
  Say 'Nothing new to commit - pushing existing commits.'
} else {
  & git commit -m $Message | Out-Null
  Say ("Committed {0} file(s): {1}" -f $staged.Count, $Message)
  $staged | ForEach-Object { Say "   $_" }
}

Say ''
Say "Pushing to $Remote/$Branch ..."
& git push $Remote $Branch
if ($LASTEXITCODE -ne 0) {
  Say ''
  Say 'Push FAILED. Check that you are signed in to GitHub as the account that owns the repository.'
  exit 1
}

$sha = & git rev-parse --short HEAD
Say ''
Say "DONE. $Branch is up to date (commit $sha)."
Say 'Vercel redeploys automatically after a push.'
