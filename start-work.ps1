<#
  start-work.ps1 — start a work session (use this on ANY computer).
  ----------------------------------------------------------------
  1. pulls the latest changes from GitHub, so this copy is never stale
  2. starts the local web server and opens the site in your browser

  Workflow on every computer:
      start-work.cmd        (begin: get latest + run the site)
         ... make your changes ...
      push-updates.cmd      (finish: save + upload to GitHub -> Vercel redeploys)

  Options:
      powershell -ExecutionPolicy Bypass -File .\start-work.ps1 -Port 5500
      powershell -ExecutionPolicy Bypass -File .\start-work.ps1 -NoBrowser
      powershell -ExecutionPolicy Bypass -File .\start-work.ps1 -NoPull
#>
[CmdletBinding()]
param(
  [int]$Port      = 8080,
  [switch]$NoBrowser,
  [switch]$NoPull,
  [string]$Branch = 'main',
  [string]$Remote = 'origin'
)

$ErrorActionPreference = 'Stop'

$here = $PSScriptRoot
if (-not $here) { $here = Split-Path -Parent $MyInvocation.MyCommand.Path }
Set-Location -LiteralPath $here

function Say($m) { Write-Host $m }

Say ''
Say '  InnerU - starting your work session'
Say '  =================================='

if (-not (Get-Command git -ErrorAction SilentlyContinue)) {
  Say '  git is not installed on this computer.'
  Say '  Install "Git for Windows" from https://git-scm.com/download/win, then run this again.'
  exit 1
}
if (-not (Test-Path (Join-Path $here '.git'))) {
  Say '  This folder is not a git clone of the project.'
  Say '  To set the project up on a new computer, open PowerShell and run:'
  Say ''
  Say '      cd C:\'
  Say '      git clone https://github.com/brontoo/InnerU.git InnerU'
  Say ''
  Say '  then open the new folder and double-click start-work.cmd'
  exit 1
}

# --- who will the commits be from? -----------------------------------------
$gname = & git config user.name
$gmail = & git config user.email
if (-not $gname -or -not $gmail) {
  Say ''
  Say '  Note: git has no name/email on this computer yet, so commits will be'
  Say '        recorded as "InnerU Backup <inneru-backup@local>".'
  Say '        To use your own name, run these once:'
  Say '            git config --global user.name  "Ahmed"'
  Say '            git config --global user.email "you@example.com"'
}

# --- 1. pull the latest changes --------------------------------------------
if (-not $NoPull) {
  Say ''
  Say "  Getting the latest changes from GitHub ($Remote/$Branch) ..."

  & git fetch $Remote $Branch
  if ($LASTEXITCODE -ne 0) {
    Say '  Could not reach GitHub (no internet?). Continuing with the local copy.'
    Say '  Remember: do not start editing on two computers at once.'
  } else {
    $localSha  = (& git rev-parse HEAD).Trim()
    $remoteSha = (& git rev-parse "$Remote/$Branch").Trim()

    if ($localSha -eq $remoteSha) {
      Say '  Already up to date.'
    } else {
      $dirty = @(& git status --porcelain).Count -gt 0
      $stashed = $false
      if ($dirty) {
        Say '  You have unsaved changes here - keeping them aside while updating ...'
        & git stash push -u -m 'start-work auto-stash' | Out-Null
        if ($LASTEXITCODE -ne 0) {
          Say '  Could not save your changes aside. Nothing was changed. Ask for help.'
          exit 1
        }
        $stashed = $true
      }

      & git pull --rebase $Remote $Branch
      if ($LASTEXITCODE -ne 0) {
        Say ''
        Say '  The update could not be applied. Nothing was lost.'
        if ($stashed) { & git stash pop | Out-Null }
        Say '  Send the messages above to your assistant before continuing.'
        exit 1
      }

      if ($stashed) {
        & git stash pop
        if ($LASTEXITCODE -ne 0) {
          Say ''
          Say '  Your saved changes could not be re-applied automatically.'
          Say '  They are safe in the stash - run "git stash list" and ask for help.'
          exit 1
        }
        Say '  Your changes were restored.'
      }
      Say ('  Updated: ' + (& git log --oneline -1))
    }
  }
}

# --- 2. start the local server --------------------------------------------
Say ''
Say '  Starting the local server (this window stays open - press Ctrl+C to stop) ...'
Say ''

$psArgs = @('-NoProfile', '-ExecutionPolicy', 'Bypass', '-File', (Join-Path $here 'serve.ps1'), '-Port', "$Port")
if ($NoBrowser) { $psArgs += '-NoBrowser' }
& powershell @psArgs
