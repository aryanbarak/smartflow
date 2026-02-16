Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

$CoreDir = "C:\Projects\fiae-workspace\fiae-tutor-core"
$Py = "$CoreDir\.venv\Scripts\python.exe"
$OutRel = "export\tutor"

Write-Host "[tutor:export] CoreDir: $CoreDir"
Write-Host "[tutor:export] Python:  $Py"
Write-Host "[tutor:export] OutDir:  $OutRel"

if (-not (Test-Path -LiteralPath $CoreDir -PathType Container)) {
  Write-Error "[tutor:export] Core directory not found: $CoreDir"
  exit 1
}

if (-not (Test-Path -LiteralPath $Py -PathType Leaf)) {
  Write-Error "[tutor:export] Python interpreter not found: $Py"
  exit 1
}

Push-Location $CoreDir
try {
  & $Py -m fiae_tutor.export.tutor_static --out $OutRel
  if ($LASTEXITCODE -ne 0) {
    Write-Error "[tutor:export] Exporter failed with exit code $LASTEXITCODE"
    exit 1
  }
} finally {
  Pop-Location
}

$Manifest = Join-Path $CoreDir "export\tutor\manifest.json"
if (-not (Test-Path -LiteralPath $Manifest -PathType Leaf)) {
  Write-Error "[tutor:export] Export did not produce manifest: $Manifest"
  exit 1
}

Write-Host "[tutor:export] Success."
