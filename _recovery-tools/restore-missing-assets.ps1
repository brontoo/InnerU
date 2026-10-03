<#
  restore-missing-assets.ps1
  --------------------------
  Downloads the seven asset files that the first mirror could not discover, because
  the site builds their paths at run time inside template strings - no text scanner
  can see them:

      body-atlas.js   `assets/${kind}-atlas.glb`
                      kind = integumentary | skeletal | muscular | respiratory | excretory
      muscle.js       `assets/${fast?'sprint':'endurance'}.webp`

  Without them every "Body Atlas" 3D viewer falls back to its static placeholder and
  muscular mission 6 ("Endurance or power?") shows two broken images.

  Safe to re-run: an existing file is never overwritten unless you pass -Force.

  Usage:
      double-click  restore-missing-assets.cmd
      or:           powershell -ExecutionPolicy Bypass -File .\restore-missing-assets.ps1
      options:      -Force      re-download even when the file already exists
                    -SiteUrl X  use a different source host
#>
[CmdletBinding()]
param(
  [string]$SiteUrl  = 'https://body-quest-um-al-emarat.ahmed87ahmed.chatgpt.site/',
  [string]$RepoRoot = '',
  [switch]$Force
)

$ErrorActionPreference = 'Continue'
$ProgressPreference    = 'SilentlyContinue'
try { [Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12 } catch {}

$here = $PSScriptRoot
if (-not $here) { $here = Split-Path -Parent $MyInvocation.MyCommand.Path }
if (-not $RepoRoot) { $RepoRoot = Split-Path -Parent $here }

if (-not (Test-Path (Join-Path $RepoRoot 'index.html'))) {
  Write-Host ''
  Write-Host "  [FAILED] $RepoRoot does not look like the InnerU project (no index.html)."
  Write-Host '           Keep this script inside the project folder, in _recovery-tools\.'
  exit 1
}
if (-not $SiteUrl.EndsWith('/')) { $SiteUrl = $SiteUrl + '/' }

# Paths are quoted from the source code; they are the reason the first mirror missed them.
$wanted = @(
  'assets/integumentary-atlas.glb',
  'assets/skeletal-atlas.glb',
  'assets/muscular-atlas.glb',
  'assets/respiratory-atlas.glb',
  'assets/excretory-atlas.glb',
  'assets/sprint.webp',
  'assets/endurance.webp'
)

# A missing path on this host answers 200 with the SPA shell, so validate magic bytes.
$magic = @{
  '.glb'  = [byte[]](0x67, 0x6C, 0x54, 0x46)   # "glTF"
  '.webp' = [byte[]](0x52, 0x49, 0x46, 0x46)   # "RIFF"
}

$curl = Get-Command curl.exe -ErrorAction SilentlyContinue
if ($curl) { $curl = $curl.Source }

Write-Host ''
Write-Host '  InnerU - restoring the assets that only exist behind run-time paths'
Write-Host '  ================================================================='
Write-Host "  From : $SiteUrl"
Write-Host "  Into : $RepoRoot"
Write-Host ''

$results = New-Object System.Collections.ArrayList
$failed  = 0

foreach ($rel in $wanted) {
  $target = Join-Path $RepoRoot ($rel -replace '/', '\')
  $dir = Split-Path -Parent $target
  if ($dir -and -not (Test-Path $dir)) { New-Item -ItemType Directory -Force -Path $dir | Out-Null }

  if ((Test-Path $target) -and -not $Force) {
    $size = (Get-Item $target).Length
    Write-Host ("  [keep]   {0}  ({1:N0} bytes already there)" -f $rel, $size)
    [void]$results.Add([pscustomobject]@{ path = $rel; status = 'kept'; bytes = $size; sha256 = (Get-FileHash $target -Algorithm SHA256).Hash })
    continue
  }

  $url = $SiteUrl + $rel
  $ok = $false
  if ($curl) {
    & $curl -sS -L --fail --max-time 300 -o $target $url 2>$null
    if ($LASTEXITCODE -eq 0 -and (Test-Path $target)) { $ok = $true }
  } else {
    try {
      Invoke-WebRequest -Uri $url -OutFile $target -UseBasicParsing -TimeoutSec 300 -ErrorAction Stop
      $ok = $true
    } catch { $ok = $false }
  }

  if ($ok) {
    $bytes = [System.IO.File]::ReadAllBytes($target)
    $ext   = [System.IO.Path]::GetExtension($target).ToLower()
    $bad   = $false
    if ($bytes.Length -lt 1024) { $bad = $true }
    elseif ($magic.ContainsKey($ext)) {
      $expected = $magic[$ext]
      for ($i = 0; $i -lt $expected.Length; $i++) {
        if ($bytes[$i] -ne $expected[$i]) { $bad = $true; break }
      }
    }
    if ($bad) {
      # Almost certainly the SPA shell returned for a path the host does not have.
      $ok = $false
      Remove-Item $target -Force -ErrorAction SilentlyContinue
    }
  }

  if ($ok) {
    $size = (Get-Item $target).Length
    $sha  = (Get-FileHash $target -Algorithm SHA256).Hash
    Write-Host ("  [OK]     {0}  ({1:N0} bytes)" -f $rel, $size)
    [void]$results.Add([pscustomobject]@{ path = $rel; status = 'downloaded'; bytes = $size; sha256 = $sha })
  } else {
    $failed++
    Write-Host ("  [FAILED] {0}" -f $rel)
    [void]$results.Add([pscustomobject]@{ path = $rel; status = 'failed'; bytes = 0; sha256 = '' })
  }
}

$record = [pscustomobject]@{
  source_url   = $SiteUrl
  restored_utc = (Get-Date).ToUniversalTime().ToString('yyyy-MM-dd HH:mm:ss') + 'Z'
  note         = 'These seven assets are reachable in the code only through run-time template strings, which is why the original mirror (and its dependency check) could not see them. This file is the record for them; _export-manifest.json is an older mixed snapshot and does not include them.'
  files        = $results
}
$recordDir  = Join-Path $RepoRoot '_recovery-tools'
if (-not (Test-Path $recordDir)) { New-Item -ItemType Directory -Force -Path $recordDir | Out-Null }
$recordPath = Join-Path $recordDir '_assets-restored.json'
[System.IO.File]::WriteAllText($recordPath, ($record | ConvertTo-Json -Depth 5), (New-Object System.Text.UTF8Encoding($false)))

Write-Host ''
Write-Host "  Record written: $recordPath"
Write-Host ''
if ($failed -eq 0) {
  Write-Host '  [OK] All seven assets are present.'
  Write-Host '       Next: double-click push-updates.cmd (Vercel redeploys), then reload with Ctrl+F5.'
  exit 0
} else {
  Write-Host ("  [FAILED] {0} of {1} file(s) could not be downloaded." -f $failed, $wanted.Count)
  Write-Host '           Nothing else was changed. Re-run when the network is available.'
  exit 1
}
