<#
  serve.ps1 — a tiny static web server for local development.
  ---------------------------------------------------------------
  No dependencies, no admin rights, no internet. It exists because the site
  loads ES modules (heart-explorer.js, body-atlas.js) and 3D models (.glb):
  browsers block those on file:// URLs, so a real local server is needed to
  see the 3D labs working.

  Usage:
    powershell -ExecutionPolicy Bypass -File .\serve.ps1
    powershell -ExecutionPolicy Bypass -File .\serve.ps1 -Port 5500
    powershell -ExecutionPolicy Bypass -File .\serve.ps1 -NoBrowser
#>
[CmdletBinding()]
param(
  [int]$Port = 8080,
  [string]$Root = '',
  [switch]$NoBrowser
)

$ErrorActionPreference = 'Stop'

$here = $PSScriptRoot
if (-not $here) { $here = Split-Path -Parent $MyInvocation.MyCommand.Path }
if (-not $Root) { $Root = $here }
$Root = (Resolve-Path -LiteralPath $Root).Path

$mime = @{
  '.html' = 'text/html; charset=utf-8'
  '.htm'  = 'text/html; charset=utf-8'
  '.js'   = 'text/javascript; charset=utf-8'
  '.mjs'  = 'text/javascript; charset=utf-8'
  '.css'  = 'text/css; charset=utf-8'
  '.json' = 'application/json; charset=utf-8'
  '.map'  = 'application/json; charset=utf-8'
  '.txt'  = 'text/plain; charset=utf-8'
  '.xml'  = 'application/xml; charset=utf-8'
  '.svg'  = 'image/svg+xml'
  '.png'  = 'image/png'
  '.jpg'  = 'image/jpeg'
  '.jpeg' = 'image/jpeg'
  '.webp' = 'image/webp'
  '.gif'  = 'image/gif'
  '.ico'  = 'image/x-icon'
  '.glb'  = 'model/gltf-binary'
  '.gltf' = 'model/gltf+json'
  '.bin'  = 'application/octet-stream'
  '.hdr'  = 'application/octet-stream'
  '.woff' = 'font/woff'
  '.woff2' = 'font/woff2'
  '.ttf'  = 'font/ttf'
  '.otf'  = 'font/otf'
  '.wasm' = 'application/wasm'
  '.mp4'  = 'video/mp4'
  '.webm' = 'video/webm'
  '.mp3'  = 'audio/mpeg'
  '.wav'  = 'audio/wav'
  '.pdf'  = 'application/pdf'
}

try {
  $listener = New-Object System.Net.Sockets.TcpListener([System.Net.IPAddress]::Loopback, $Port)
  $listener.Start()
} catch {
  Write-Host "Could not start the server on port $Port." -ForegroundColor Red
  Write-Host "Another program is probably using it. Try:  .\serve.ps1 -Port 5500"
  exit 1
}

$url = "http://localhost:$Port/"
Write-Host ''
Write-Host '  InnerU dev server' -ForegroundColor Cyan
Write-Host "  folder  : $Root"
Write-Host "  address : $url"
Write-Host '  stop    : press Ctrl+C'
Write-Host ''

if (-not $NoBrowser) { Start-Process $url | Out-Null }

try {
  while ($true) {
    $client = $listener.AcceptTcpClient()
    try {
      $client.ReceiveTimeout = 4000
      $client.SendTimeout    = 20000
      $stream = $client.GetStream()
      $reader = New-Object System.IO.StreamReader($stream, [System.Text.Encoding]::ASCII, $false, 1024, $true)

      $requestLine = $reader.ReadLine()
      if ([string]::IsNullOrWhiteSpace($requestLine)) { continue }

      # drain the headers
      $guard = 0
      while ($guard -lt 100) {
        $line = $reader.ReadLine()
        if ($null -eq $line -or $line -eq '') { break }
        $guard++
      }

      $parts  = $requestLine.Split(' ')
      $method = $parts[0]
      $target = $parts[1]
      $pathOnly = [System.Uri]::UnescapeDataString($target.Split('?')[0])
      if ($pathOnly -eq '/' -or $pathOnly -eq '') { $pathOnly = '/index.html' }

      $fullPath = [System.IO.Path]::GetFullPath((Join-Path $Root ($pathOnly.TrimStart('/') -replace '/', '\')))

      $status = '200 OK'
      $body   = $null

      if (-not $fullPath.StartsWith($Root, [System.StringComparison]::OrdinalIgnoreCase)) {
        $status = '403 Forbidden'
        $body = [System.Text.Encoding]::UTF8.GetBytes('403 Forbidden')
      } elseif (Test-Path -LiteralPath $fullPath -PathType Leaf) {
        $body = [System.IO.File]::ReadAllBytes($fullPath)
      } else {
        $status = '404 Not Found'
        $fallback = Join-Path $Root '404.html'
        if (Test-Path -LiteralPath $fallback -PathType Leaf) {
          $body = [System.IO.File]::ReadAllBytes($fallback)
        } else {
          $body = [System.Text.Encoding]::UTF8.GetBytes('404 Not Found')
        }
      }

      $ext = [System.IO.Path]::GetExtension($fullPath).ToLowerInvariant()
      $ctype = $mime[$ext]
      if (-not $ctype) { $ctype = 'application/octet-stream' }

      $head = "HTTP/1.1 $status`r`nContent-Type: $ctype`r`nContent-Length: $($body.Length)`r`nCache-Control: no-cache`r`nConnection: close`r`n`r`n"
      $headBytes = [System.Text.Encoding]::ASCII.GetBytes($head)
      $stream.Write($headBytes, 0, $headBytes.Length)
      if ($method -ne 'HEAD') { $stream.Write($body, 0, $body.Length) }
      $stream.Flush()

      $colour = if ($status -eq '200 OK') { 'DarkGray' } else { 'Yellow' }
      Write-Host ("  {0}  {1}" -f $status.Split(' ')[0], $pathOnly) -ForegroundColor $colour
    } catch {
      # a browser closing a connection early is normal — keep serving
    } finally {
      try { $client.Close() } catch {}
    }
  }
} finally {
  try { $listener.Stop() } catch {}
  Write-Host ''
  Write-Host '  Server stopped.'
}
