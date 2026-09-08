param(
  [switch]$SkipTests
)

$ErrorActionPreference = 'Stop'
$projectRoot = Split-Path -Parent $PSScriptRoot
$manifestPath = Join-Path $projectRoot 'module.json'
$manifest = Get-Content -LiteralPath $manifestPath -Raw | ConvertFrom-Json

if (-not $SkipTests) {
  Push-Location $projectRoot
  try { npm test } finally { Pop-Location }
  if ($LASTEXITCODE -ne 0) { throw 'Os testes falharam.' }
}

Push-Location $projectRoot
try { npm run package } finally { Pop-Location }
if ($LASTEXITCODE -ne 0) { throw 'O empacotamento falhou.' }

$packagePath = Join-Path $projectRoot "dist\$($manifest.id)-$($manifest.version)\$($manifest.id)"
$zipPath = Join-Path $projectRoot "dist\$($manifest.id)-$($manifest.version).zip"
if (Test-Path -LiteralPath $zipPath) { Remove-Item -LiteralPath $zipPath }
Compress-Archive -Path (Join-Path $packagePath '*') -DestinationPath $zipPath -CompressionLevel Optimal

$zip = Get-Item -LiteralPath $zipPath
Write-Host "Release pronta: $($zip.FullName) ($($zip.Length) bytes)"
