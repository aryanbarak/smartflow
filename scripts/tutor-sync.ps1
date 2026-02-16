Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

$CoreExport = "C:\Projects\fiae-workspace\fiae-tutor-core\export\tutor"
$Target = "C:\Projects\fiae-workspace\dailyflow\public\tutor"

Write-Host "[tutor:sync] Source: $CoreExport"
Write-Host "[tutor:sync] Target: $Target"

if (-not (Test-Path -LiteralPath $CoreExport -PathType Container)) {
  Write-Error "[tutor:sync] Source export folder not found: $CoreExport"
  exit 1
}

if (Test-Path -LiteralPath $Target) {
  Remove-Item -LiteralPath $Target -Recurse -Force
}
New-Item -ItemType Directory -Path $Target -Force | Out-Null

Copy-Item -Path (Join-Path $CoreExport "*") -Destination $Target -Recurse -Force

Write-Host "[tutor:sync] Success."
