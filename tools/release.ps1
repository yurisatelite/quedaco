param(
  [switch]$SkipTests,
  [switch]$Public
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
try { if ($Public) { node tools/package.mjs --public } else { npm run package } } finally { Pop-Location }
if ($LASTEXITCODE -ne 0) { throw 'O empacotamento falhou.' }

$suffix = if ($Public) { '-public' } else { '' }
$packagePath = Join-Path $projectRoot "dist\$($manifest.id)-$($manifest.version)$suffix\$($manifest.id)"
$zipPath = if ($Public) { Join-Path $projectRoot 'dist\quedaco.zip' } else { Join-Path $projectRoot "dist\$($manifest.id)-$($manifest.version).zip" }
if (Test-Path -LiteralPath $zipPath) { Remove-Item -LiteralPath $zipPath }
Compress-Archive -Path (Join-Path $packagePath '*') -DestinationPath $zipPath -CompressionLevel Optimal

$zip = Get-Item -LiteralPath $zipPath
Copy-Item -LiteralPath $manifestPath -Destination (Join-Path $projectRoot 'dist\module.json') -Force
Write-Host "Release pronta: $($zip.FullName) ($($zip.Length) bytes)"
