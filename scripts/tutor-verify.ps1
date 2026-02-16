Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

$Required = @(
  "C:\Projects\fiae-workspace\dailyflow\public\tutor\manifest.json",
  "C:\Projects\fiae-workspace\dailyflow\public\tutor\index.json",
  "C:\Projects\fiae-workspace\dailyflow\public\tutor\topics\exam_bank_ap2\exam.de.v1.json"
)

$Missing = @()
foreach ($PathItem in $Required) {
  if (Test-Path -LiteralPath $PathItem -PathType Leaf) {
    Write-Host "[tutor:verify] OK: $PathItem"
  } else {
    Write-Host "[tutor:verify] MISSING: $PathItem"
    $Missing += $PathItem
  }
}

if ($Missing.Count -gt 0) {
  Write-Error "[tutor:verify] Verification failed. Missing $($Missing.Count) required file(s)."
  exit 1
}

Write-Host "[tutor:verify] Success."
