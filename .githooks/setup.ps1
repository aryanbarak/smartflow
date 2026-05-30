# dailyFlow Git Hooks Setup
# Run once from project root: .githooks\setup.ps1

$PROJECT_ROOT = git rev-parse --show-toplevel
$HOOKS_DIR = "$PROJECT_ROOT\.githooks"

Write-Host ""
Write-Host "Setting up dailyFlow git hooks..." -ForegroundColor Blue
Write-Host ""

git config core.hooksPath .githooks
Write-Host "  [OK] core.hooksPath set to .githooks" -ForegroundColor Green

# Convert hooks to Unix line endings (required for Git Bash on Windows)
$hooks = @("post-commit", "pre-push")
foreach ($hook in $hooks) {
    $hookPath = "$HOOKS_DIR\$hook"
    if (Test-Path $hookPath) {
        $content = Get-Content $hookPath -Raw -Encoding UTF8
        $content = $content -replace "`r`n", "`n"
        [System.IO.File]::WriteAllText($hookPath, $content, [System.Text.UTF8Encoding]::new($false))
        Write-Host "  [OK] $hook - Unix line endings applied" -ForegroundColor Green
    } else {
        Write-Host "  [WARN] $hook not found at $hookPath" -ForegroundColor Yellow
    }
}

Write-Host ""
Write-Host "Git hooks ready!" -ForegroundColor Green
Write-Host ""
Write-Host "  post-commit : updates PROJECT_STATUS.md + rebuilds KB (if docs changed)" -ForegroundColor Cyan
Write-Host "  pre-push    : runs npm run build before push (blocks on failure)" -ForegroundColor Cyan
Write-Host ""
Write-Host "To skip pre-push (emergency only): git push --no-verify" -ForegroundColor DarkGray
Write-Host ""
