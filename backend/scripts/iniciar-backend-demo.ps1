[CmdletBinding()]
param(
  [ValidateRange(1024, 65535)]
  [int]$Port = 3101
)

$ErrorActionPreference = 'Stop'
$demoDatabase = 'gestion_inventario_construccion_demo'
$backendRoot = Split-Path -Parent $PSScriptRoot
$envFile = Join-Path $backendRoot '.env'
$previousDatabaseUrl = $env:DATABASE_URL
$previousPort = $env:PORT
$previousFrontendOrigin = $env:FRONTEND_ORIGIN

try {
  Push-Location $backendRoot
  if (-not (Test-Path -LiteralPath $envFile)) { throw 'No existe backend/.env con la configuracion MySQL local.' }
  $line = Get-Content -LiteralPath $envFile | Where-Object { $_ -match '^DATABASE_URL=' } | Select-Object -First 1
  if (-not $line) { throw 'No se encontro DATABASE_URL en backend/.env.' }

  $sourceUrl = [Uri](($line -replace '^DATABASE_URL=', '').Trim().Trim('"'))
  if ($sourceUrl.Scheme -ne 'mysql') { throw 'DATABASE_URL no utiliza el esquema mysql.' }
  $builder = [UriBuilder]$sourceUrl
  $builder.Path = "/$demoDatabase"
  $demoUrl = $builder.Uri.AbsoluteUri
  if (([Uri]$demoUrl).AbsolutePath.Trim('/') -ne $demoDatabase) { throw 'La URL demo no coincide exactamente con la base autorizada.' }

  $existing = Get-NetTCPConnection -LocalPort $Port -State Listen -ErrorAction SilentlyContinue
  if ($existing) { throw "El puerto $Port ya esta en uso. Seleccione otro con -Port." }

  $env:DATABASE_URL = $demoUrl
  $env:PORT = $Port.ToString()
  $env:FRONTEND_ORIGIN = 'http://localhost:5173'
  Write-Host "Backend demo: http://localhost:$Port (base $demoDatabase)"
  npm run dev
}
finally {
  Pop-Location -ErrorAction SilentlyContinue
  if ($null -eq $previousDatabaseUrl) { Remove-Item Env:DATABASE_URL -ErrorAction SilentlyContinue } else { $env:DATABASE_URL = $previousDatabaseUrl }
  if ($null -eq $previousPort) { Remove-Item Env:PORT -ErrorAction SilentlyContinue } else { $env:PORT = $previousPort }
  if ($null -eq $previousFrontendOrigin) { Remove-Item Env:FRONTEND_ORIGIN -ErrorAction SilentlyContinue } else { $env:FRONTEND_ORIGIN = $previousFrontendOrigin }
  $demoUrl = $null
}
