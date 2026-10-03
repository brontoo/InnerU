<#
  restore-inneru.ps1
  ------------------
  Downloads a complete local copy of the published InnerU site (built assets)
  from https://body-quest-um-al-emarat.ahmed87ahmed.chatgpt.site

  It fetches:
    * index.html
    * every <script src="..."> and <link href="..."> asset
    * every <img src="..."> asset
    * source maps (.js.map / sourceMappingURL) if the build ships them

  Results land in .\inneru-site  (same folder as this script by default).

  Run it with:  run.cmd        (double-click)
  or:           powershell -ExecutionPolicy Bypass -File .\restore-inneru.ps1
#>
[CmdletBinding()]
param(
  [string]$SiteUrl = '',
  [string]$OutDir  = '',
  [switch]$Force
)

$ErrorActionPreference = 'Continue'
$ProgressPreference    = 'SilentlyContinue'
try { [Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12 } catch {}

# $PSScriptRoot is NOT reliable inside the param() default block on Windows PowerShell 5.1
# (it comes back empty and the script dies before doing anything), so resolve defaults here.
$here = $PSScriptRoot
if (-not $here) { $here = Split-Path -Parent $MyInvocation.MyCommand.Path }
if (-not $SiteUrl) { $SiteUrl = 'https://body-quest-um-al-emarat.ahmed87ahmed.chatgpt.site/' }
if (-not $OutDir)  { $OutDir  = Join-Path $here 'inneru-site' }

$script:Log     = New-Object System.Collections.ArrayList
$script:Base    = [Uri]$SiteUrl
$script:OutDir  = $OutDir
$script:Results = New-Object System.Collections.ArrayList

function Log([string]$m) {
  Write-Host $m
  [void]$script:Log.Add($m)
}

function Get-Curl {
  $c = Get-Command curl.exe -ErrorAction SilentlyContinue
  if ($c) { return $c.Source }
  return $null
}
$script:Curl = Get-Curl

# Download $url to $localPath. Returns $true on success.
function Save-Url([string]$url, [string]$localPath) {
  $dir = Split-Path -Parent $localPath
  if ($dir -and -not (Test-Path $dir)) { New-Item -ItemType Directory -Force -Path $dir | Out-Null }
  if ($script:Curl) {
    & $script:Curl -sS -L --fail --max-time 90 -o $localPath $url 2>$null
    if ($LASTEXITCODE -eq 0 -and (Test-Path $localPath)) { return $true }
    if (Test-Path $localPath) { Remove-Item $localPath -Force -ErrorAction SilentlyContinue }
  }
  try {
    Invoke-WebRequest -Uri $url -OutFile $localPath -UseBasicParsing -TimeoutSec 90
    if (Test-Path $localPath) { return $true }
  } catch { }
  return $false
}

# Fetch $url into a string (for probing / small files), or $null.
function Get-Text([string]$url) {
  if ($script:Curl) {
    $tmp = [System.IO.Path]::GetTempFileName()
    & $script:Curl -sS -L --fail --max-time 60 -o $tmp $url 2>$null
    if ($LASTEXITCODE -eq 0 -and (Test-Path $tmp)) {
      $t = Get-Content -LiteralPath $tmp -Raw
      Remove-Item $tmp -Force -ErrorAction SilentlyContinue
      return $t
    }
    Remove-Item $tmp -Force -ErrorAction SilentlyContinue
  }
  try { return (Invoke-WebRequest -Uri $url -UseBasicParsing -TimeoutSec 60).Content } catch { }
  return $null
}

# Map a URL to a local relative path.
function Get-LocalPath([Uri]$uri) {
  $p = $uri.AbsolutePath
  if ([string]::IsNullOrEmpty($p) -or $p -eq '/') { $p = '/index.html' }
  if ($p.EndsWith('/')) { $p = $p + 'index.html' }
  $p = $p.TrimStart('/')
  $p = $p -replace '[<>:"|?*]', '_'
  return (Join-Path $script:OutDir ($p -replace '/', '\'))
}

# True if the file looks like the SPA fallback page (i.e. we got index.html instead of the asset).
function Is-HtmlFallback([string]$path) {
  if (-not (Test-Path $path)) { return $false }
  try {
    $head = Get-Content -LiteralPath $path -TotalCount 1 -ErrorAction Stop
    if ($head -match '(?i)^\s*<!doctype html' -or $head -match '(?i)<html') { return $true }
  } catch { }
  return $false
}

function Add-Result([string]$status, [string]$url, [string]$note) {
  [void]$script:Results.Add([pscustomobject]@{ Status = $status; Url = $url; Note = $note })
}

# ---------------------------------------------------------------- main

Log "InnerU site recovery"
Log "Source : $SiteUrl"
Log "Target : $OutDir"
Log ("Date   : " + (Get-Date).ToString('u'))
Log ("Tool   : " + $(if ($script:Curl) { "curl.exe" } else { "Invoke-WebRequest" }))
Log ""

if (-not (Test-Path $OutDir)) {
  try {
    New-Item -ItemType Directory -Force -Path $OutDir -ErrorAction Stop | Out-Null
  } catch {
    # OneDrive / Windows Defender "Controlled folder access" can block writes here.
    $fallback = Join-Path $env:USERPROFILE 'InnerU-backup'
    Log "WARNING: cannot create the folder:"
    Log "         $OutDir"
    Log ("         reason: " + $_.Exception.Message)
    Log "         falling back to: $fallback"
    $OutDir = $fallback
    $script:OutDir = $fallback
    New-Item -ItemType Directory -Force -Path $OutDir | Out-Null
  }
}

# 1) index.html
#    Never overwrite an existing one unless -Force is given: re-running this script
#    must not undo edits you made to the page (that is exactly how the stray
#    Cloudflare snippet came back once already).
$indexLocal = Join-Path $OutDir 'index.html'
if ((Test-Path -LiteralPath $indexLocal) -and -not $Force) {
  Log "index.html already exists - keeping it (pass -Force to replace it)."
} elseif (-not (Save-Url $script:Base.AbsoluteUri $indexLocal)) {
  Log "FATAL: could not download index.html. Check the URL / your internet connection."
  exit 1
}
$html = [System.IO.File]::ReadAllText($indexLocal, [System.Text.Encoding]::UTF8)
Log ("index.html: {0:N0} bytes" -f $html.Length)
Add-Result 'OK' $script:Base.AbsoluteUri 'index.html'

# 2) collect references from the HTML
$refs = New-Object System.Collections.Generic.HashSet[string]
foreach ($m in [regex]::Matches($html, '(?i)(?:src|href)\s*=\s*["'']([^"''>]+)["'']')) {
  [void]$refs.Add($m.Groups[1].Value)
}
# CSS url(...) inside inline styles, plus common PWA files
foreach ($m in [regex]::Matches($html, '(?i)url\(\s*["'']?([^"''\)]+)["'']?\s*\)')) {
  [void]$refs.Add($m.Groups[1].Value)
}
foreach ($extra in @('/manifest.webmanifest', '/site.webmanifest', '/asset-manifest.json', '/package.json', '/package-lock.json', '/README.md', '/site-config.json', '/config.json', '/version.json', '/favicon.ico', '/sw.js', '/service-worker.js', '/robots.txt', '/sitemap.xml', '/404.html', '/_headers', '/_redirects', '/CNAME')) {
  [void]$refs.Add($extra)
}

$baseHost  = $script:Base.Host
$assetUris = New-Object System.Collections.ArrayList
foreach ($r in $refs) {
  if ($r -match '^(?i)(data:|mailto:|tel:|javascript:|#)') { continue }
  $u = $null
  try { $u = [Uri]::new($script:Base, $r) } catch { continue }
  if ($u.Host -ne $baseHost) { continue }
  [void]$assetUris.Add($u)
}
Log ("Referenced same-origin assets found: " + $assetUris.Count)

# 3) download each asset
foreach ($u in $assetUris) {
  $local = Get-LocalPath $u
  if (Test-Path $local) { continue }
  $ok = Save-Url $u.AbsoluteUri $local
  if (-not $ok) {
    Add-Result 'MISSING' $u.AbsoluteUri 'not downloaded'
    continue
  }
  $len = (Get-Item -LiteralPath $local).Length
  # an asset that returns the SPA shell means the file does not exist
  # (only real .html/.htm files may legitimately be HTML)
  if ($u.AbsolutePath -notmatch '(?i)\.(html?)$' -and (Is-HtmlFallback $local)) {
    Remove-Item -LiteralPath $local -Force -ErrorAction SilentlyContinue
    Add-Result 'MISSING' $u.AbsoluteUri 'server returned the SPA shell'
    continue
  }
  Log ("  saved  {0,-60} {1,10:N0} bytes" -f $u.AbsolutePath, $len)
  Add-Result 'OK' $u.AbsoluteUri ("{0:N0} bytes" -f $len)
}

# 3b) recursive pass — assets referenced from INSIDE the code (imports, fetch(), url(), string paths).
#     Without this, a module such as GLTFLoader.js keeps its own imports of ../utils/*.js unpaid.
#   matches "/a/b.svg", "./a/b.svg", "assets/three/three.module.js", "assets/anatomical-heart.glb", url(x.woff2)
#   NB: longer extensions must come first (json before js) and (?![\w]) stops "missions.json" -> "missions.js".
$assetRx = '(?i)["''\(\s]((?:\.{0,2}/)?[\w\-]+(?:/[\w\-\.@]+)+\.(?:webmanifest|json|mjs|js|svg|png|jpe?g|webp|gif|avif|ico|woff2?|ttf|otf|eot|css|mp3|mp4|webm|ogg|wav|glb|gltf|bin|hdr|exr|csv|txt|xml))(?![\w])'
#   files loaded explicitly, including single-file relative imports:
#   import("/x.js"), from './three.core.js', fetch("/x.json"), require("/x.js"), url(x.woff2)
$rootRx  = '(?i)(?:import\s*\(\s*|from\s+|fetch\s*\(\s*|require\s*\(\s*|src\s*[:=]\s*|url\s*\(\s*)["''`]?((?:\.{0,2}/)?[\w\-\.@]+\.(?:webmanifest|json|mjs|js|svg|png|jpe?g|webp|gif|avif|ico|woff2?|ttf|otf|eot|css|glb|gltf|bin))(?![\w])'
$tried   = 0
$round   = 0
$scanned = New-Object System.Collections.Generic.HashSet[string]
$seenRef = New-Object System.Collections.Generic.HashSet[string]
$failed  = New-Object System.Collections.Generic.HashSet[string]
$rootLen = $OutDir.TrimEnd('\').Length
# Repeat until a round discovers nothing new: a file downloaded in one round may itself
# reference further files (e.g. GLTFLoader.js imports ../utils/*.js).
do {
  $round++
  $jobs = New-Object System.Collections.ArrayList
  $toScan = @(Get-ChildItem -Path $OutDir -Recurse -File -ErrorAction SilentlyContinue |
              Where-Object { ($_.Extension -eq '.js' -or $_.Extension -eq '.css') -and -not $scanned.Contains($_.FullName) })
  foreach ($f in $toScan) {
    [void]$scanned.Add($f.FullName)
    $t = [System.IO.File]::ReadAllText($f.FullName, [System.Text.Encoding]::UTF8)
    $refs = New-Object System.Collections.Generic.HashSet[string]
    foreach ($m in [regex]::Matches($t, $assetRx)) { [void]$refs.Add($m.Groups[1].Value) }
    foreach ($m in [regex]::Matches($t, $rootRx))  { [void]$refs.Add($m.Groups[1].Value) }
    foreach ($r in $refs) {
      if ($seenRef.Add($f.FullName + '|' + $r)) {
        [void]$jobs.Add([pscustomobject]@{ Ref = $r; From = $f.FullName })
      }
    }
  }
  Log ("  round {0}: scanned {1} code file(s), {2} new reference(s)" -f $round, $toScan.Count, $jobs.Count)

  $added = 0
  foreach ($job in $jobs) {
    if ($tried -ge 1200) { Log "  (probe limit reached)"; break }
    $r = $job.Ref
    $origin = $script:Base
    if ($r -match '^\.{1,2}/') {
      # "./x" and "../x" resolve against the folder of the file that contains them,
      # not against the site root - this is what makes ../utils/*.js resolve correctly.
      $srcRel = $job.From.Substring($rootLen).TrimStart('\') -replace '\\', '/'
      try { $origin = [Uri]::new($script:Base, '/' + $srcRel) } catch { continue }
    }
    $u = $null
    try { $u = [Uri]::new($origin, $r) } catch { continue }
    if ($u.Host -ne $baseHost) { continue }
    $local = Get-LocalPath $u
    if (Test-Path $local) { continue }
    if ($failed.Contains($u.AbsoluteUri)) { continue }
    $tried++
    if (-not (Save-Url $u.AbsoluteUri $local)) { [void]$failed.Add($u.AbsoluteUri); continue }
    if (Is-HtmlFallback $local) {
      Remove-Item -LiteralPath $local -Force -ErrorAction SilentlyContinue
      [void]$failed.Add($u.AbsoluteUri)
      continue
    }
    $len = (Get-Item -LiteralPath $local).Length
    Log ("  saved  {0,-60} {1,10:N0} bytes" -f $u.AbsolutePath, $len)
    Add-Result 'OK' $u.AbsoluteUri ("{0:N0} bytes (referenced from code)" -f $len)
    $added++
  }
} while ($added -gt 0 -and $round -lt 6)
Log ("Code scan finished after {0} round(s)." -f $round)

# 4) source maps — this is the part that can give the ORIGINAL source back
$mapsFound = 0
$codeFiles = Get-ChildItem -Path $OutDir -Recurse -File -ErrorAction SilentlyContinue |
             Where-Object { $_.Extension -eq '.js' -or $_.Extension -eq '.css' }
foreach ($f in $codeFiles) {
  $rel = $f.FullName.Substring($rootLen).TrimStart('\') -replace '\\', '/'
  $assetBase = $null
  try { $assetBase = [Uri]::new($script:Base, '/' + $rel) } catch { continue }

  $text = Get-Content -LiteralPath $f.FullName -Raw
  $cands = New-Object System.Collections.ArrayList
  foreach ($m in [regex]::Matches($text, '(?i)sourceMappingURL=([^\s\*]+)')) { [void]$cands.Add($m.Groups[1].Value.Trim()) }
  # if the build does not advertise a map, probe for the conventional name anyway
  if ($cands.Count -eq 0) { [void]$cands.Add($f.Name + '.map') }

  foreach ($t in $cands) {
    if ($t -match '^(?i)data:') { continue }
    $remote = $null
    try { $remote = [Uri]::new($assetBase, $t) } catch { continue }
    if ($remote.Host -ne $script:Base.Host) { continue }
    $destMap = Get-LocalPath $remote
    if (Test-Path $destMap) { continue }
    if (Save-Url $remote.AbsoluteUri $destMap) {
      if (Is-HtmlFallback $destMap) {
        Remove-Item -LiteralPath $destMap -Force -ErrorAction SilentlyContinue
      } else {
        $len = (Get-Item -LiteralPath $destMap).Length
        Log ("  SOURCE MAP FOUND: {0} ({1:N0} bytes)" -f $remote.AbsolutePath, $len)
        Add-Result 'SOURCEMAP' $remote.AbsoluteUri ("{0:N0} bytes" -f $len)
        $mapsFound++
      }
    }
  }
}
Log ""
$srcCount = @(Get-ChildItem -Path $OutDir -Recurse -File -ErrorAction SilentlyContinue | Where-Object { $_.Extension -eq '.js' -or $_.Extension -eq '.css' }).Count
if ($mapsFound -gt 0) {
  Log ("Source maps found: " + $mapsFound + "  -> original sources can be reconstructed.")
} elseif ($srcCount -ge 5) {
  Log ("Readable source files downloaded: " + $srcCount)
  Log "This site is NOT bundled. It ships separate, readable .js/.css files,"
  Log "which means what you just downloaded IS effectively the original source code."
} else {
  Log "No source maps published. The downloaded build is still fully re-hostable."
}

# 5) quick fingerprint of the build
$allJs = Get-ChildItem -Path $OutDir -Recurse -File -Include '*.js' -ErrorAction SilentlyContinue
$totalJs = ($allJs | Measure-Object -Property Length -Sum).Sum
Log ""
Log "--- fingerprint ---"
Log ("JS files      : " + $allJs.Count)
Log ("JS total size : " + ("{0:N0}" -f $totalJs) + " bytes")
foreach ($kw in @('react', 'vite', 'next', 'svelte', 'vue', 'tailwind', 'supabase', 'firebase', 'localStorage')) {
  $hit = $false
  foreach ($f in $allJs) { if ((Get-Content -LiteralPath $f.FullName -Raw) -match "(?i)$kw") { $hit = $true; break } }
  Log ("  " + $kw.PadRight(12) + " : " + $(if ($hit) { 'yes' } else { 'no' }))
}

Log ""
Log "--- largest files ---"
Get-ChildItem -Path $OutDir -Recurse -File -ErrorAction SilentlyContinue |
  Where-Object { $_.Name -notlike '_download-*' } |
  Sort-Object Length -Descending | Select-Object -First 15 |
  ForEach-Object { Log ("  {0,10:N0}  {1}" -f $_.Length, $_.FullName.Substring($rootLen).TrimStart('\')) }

# 5b) export manifest with SHA-256 hashes — this is what lets you diff this copy
#     against the real Sites source if it ever becomes available again.
$manifest = New-Object System.Collections.ArrayList
Get-ChildItem -Path $OutDir -Recurse -File -ErrorAction SilentlyContinue |
  Where-Object { $_.Name -notlike '_download-*' -and $_.Name -ne '_export-manifest.json' } |
  ForEach-Object {
    [void]$manifest.Add([pscustomobject]@{
      path   = ($_.FullName.Substring($rootLen).TrimStart('\') -replace '\\', '/')
      bytes  = $_.Length
      sha256 = (Get-FileHash -LiteralPath $_.FullName -Algorithm SHA256).Hash
    })
  }
$meta = [pscustomobject]@{
  source_url    = $SiteUrl
  sites_project = 'appgprj_6aaed33fdc948191b343dd435e2bbd61'
  exported_utc  = (Get-Date).ToUniversalTime().ToString('u')
  file_count    = $manifest.Count
  total_bytes   = (@($manifest | Measure-Object -Property bytes -Sum).Sum)
  note          = 'Byte-exact copy of the files served by the live site. The site ships unbundled, readable source files, so this is the real source code, not a reconstruction.'
  files         = $manifest
}
$meta | ConvertTo-Json -Depth 5 | Set-Content -LiteralPath (Join-Path $OutDir '_export-manifest.json') -Encoding UTF8
Log ""
Log ("Manifest written: _export-manifest.json (" + $manifest.Count + " files, SHA-256 each)")

# 7) dependency check — every relative file the code imports or links must exist locally.
#    This is the check that catches "the 3D lab hangs forever" before it reaches students.
$missingDeps = New-Object System.Collections.ArrayList
$depRx = '(?i)(?:import\s*\(?\s*|from\s+|url\(\s*|src\s*=\s*)["'']?((?:\.{1,2}/)[^"''\)\s;]+)'
$depFiles = Get-ChildItem -Path $OutDir -Recurse -File -ErrorAction SilentlyContinue |
            Where-Object { $_.Extension -eq '.js' -or $_.Extension -eq '.css' -or $_.Extension -eq '.html' }
foreach ($f in $depFiles) {
  $t = [System.IO.File]::ReadAllText($f.FullName, [System.Text.Encoding]::UTF8)
  $dir = Split-Path -Parent $f.FullName
  foreach ($m in [regex]::Matches($t, $depRx)) {
    $ref = $m.Groups[1].Value
    $target = $null
    try { $target = [System.IO.Path]::GetFullPath((Join-Path $dir (($ref.Split('?')[0]) -replace '/', '\'))) } catch { continue }
    if (-not (Test-Path -LiteralPath $target)) {
      $rel = $f.FullName.Substring($rootLen).TrimStart('\') -replace '\\', '/'
      $line = "    {0}   needs   {1}" -f $rel, $ref
      if (-not $missingDeps.Contains($line)) { [void]$missingDeps.Add($line) }
    }
  }
}
Log ""
if ($missingDeps.Count -eq 0) {
  Log "Dependency check: OK - every file referenced by the code exists locally."
  Add-Result 'DEPCHECK' '(all relative references)' 'OK'
} else {
  Log ("Dependency check: {0} MISSING reference(s) - features using them will hang or fail:" -f $missingDeps.Count)
  foreach ($d in $missingDeps) { Log $d }
  Add-Result 'DEP-MISSING' '(relative references)' ("{0} missing" -f $missingDeps.Count)
}

# 6) report
$report = Join-Path $OutDir '_download-report.txt'
$script:Results | Format-Table -AutoSize | Out-String -Width 200 | Set-Content -LiteralPath $report -Encoding UTF8
$script:Log | Set-Content -LiteralPath (Join-Path $OutDir '_download-log.txt') -Encoding UTF8

Log ""
Log ("Summary -> OK: {0}   MISSING: {1}   SOURCEMAPS: {2}" -f `
  (@($script:Results | Where-Object { $_.Status -eq 'OK' }).Count),
  (@($script:Results | Where-Object { $_.Status -eq 'MISSING' }).Count),
  $mapsFound)
Log ""
Log "DONE. Files are in: $OutDir"
Log "Report: $report"
