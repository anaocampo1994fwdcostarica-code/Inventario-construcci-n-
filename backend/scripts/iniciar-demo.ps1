[CmdletBinding()]
param(
  [switch]$IniciarBackend
)

$ErrorActionPreference = 'Stop'
$demoDatabase = 'gestion_inventario_construccion_demo'
$backendRoot = Split-Path -Parent $PSScriptRoot
$envFile = Join-Path $backendRoot '.env'
$previousDatabaseUrl = $env:DATABASE_URL
$previousSeedDatabase = $env:SEED_DATABASE_NAME
$previousAdminPassword = $env:SEED_ADMIN_PASSWORD
$previousEmployeePassword = $env:SEED_EMPLOYEE_PASSWORD
$previousFrontendOrigin = $env:FRONTEND_ORIGIN

function Read-RequiredPassword([string]$label) {
  $secure = Read-Host $label -AsSecureString
  $plain = [Net.NetworkCredential]::new('', $secure).Password
  if ([string]::IsNullOrWhiteSpace($plain) -or $plain.Length -lt 12) {
    throw 'Cada contrasena debe tener al menos 12 caracteres.'
  }
  return $plain
}

try {
  Push-Location $backendRoot
  if (-not (Test-Path -LiteralPath $envFile)) { throw 'No existe backend/.env con la configuracion MySQL local.' }
  $line = Get-Content -LiteralPath $envFile | Where-Object { $_ -match '^DATABASE_URL=' } | Select-Object -First 1
  if (-not $line) { throw 'No se encontro DATABASE_URL en backend/.env.' }

  $rawUrl = ($line -replace '^DATABASE_URL=', '').Trim().Trim('"')
  $sourceUrl = [Uri]$rawUrl
  if ($sourceUrl.Scheme -ne 'mysql') { throw 'DATABASE_URL no utiliza el esquema mysql.' }

  $demoBuilder = [UriBuilder]$sourceUrl
  $demoBuilder.Path = "/$demoDatabase"
  $demoUrl = $demoBuilder.Uri.AbsoluteUri
  $parsedDemo = [Uri]$demoUrl
  if ($parsedDemo.AbsolutePath.Trim('/') -ne $demoDatabase) { throw 'La URL demo no coincide exactamente con la base autorizada.' }

  $adminPassword = Read-RequiredPassword 'Contrasena del administrador demo'
  $employeePassword = Read-RequiredPassword 'Contrasena del empleado demo'
  if ($adminPassword -ceq $employeePassword) { throw 'Las contrasenas demo deben ser diferentes.' }

  $env:DATABASE_URL = $demoUrl
  $env:SEED_DATABASE_NAME = $demoDatabase
  $env:SEED_ADMIN_PASSWORD = $adminPassword
  $env:SEED_EMPLOYEE_PASSWORD = $employeePassword
  $env:FRONTEND_ORIGIN = 'http://localhost:5173'

  Write-Host "Destino verificado: $demoDatabase"
  npm run seed
  Write-Host 'Seed demo completado. Ejecutando una segunda vez para verificar idempotencia.'
  npm run seed

  if ($IniciarBackend) {
    Write-Host 'Iniciando backend con la base demo. Presiona Ctrl+C para detenerlo.'
    npm run dev
  }
}
finally {
  Pop-Location -ErrorAction SilentlyContinue
  if ($null -eq $previousDatabaseUrl) { Remove-Item Env:DATABASE_URL -ErrorAction SilentlyContinue } else { $env:DATABASE_URL = $previousDatabaseUrl }
  if ($null -eq $previousSeedDatabase) { Remove-Item Env:SEED_DATABASE_NAME -ErrorAction SilentlyContinue } else { $env:SEED_DATABASE_NAME = $previousSeedDatabase }
  if ($null -eq $previousAdminPassword) { Remove-Item Env:SEED_ADMIN_PASSWORD -ErrorAction SilentlyContinue } else { $env:SEED_ADMIN_PASSWORD = $previousAdminPassword }
  if ($null -eq $previousEmployeePassword) { Remove-Item Env:SEED_EMPLOYEE_PASSWORD -ErrorAction SilentlyContinue } else { $env:SEED_EMPLOYEE_PASSWORD = $previousEmployeePassword }
  if ($null -eq $previousFrontendOrigin) { Remove-Item Env:FRONTEND_ORIGIN -ErrorAction SilentlyContinue } else { $env:FRONTEND_ORIGIN = $previousFrontendOrigin }
  $adminPassword = $null
  $employeePassword = $null
  $demoUrl = $null
}
