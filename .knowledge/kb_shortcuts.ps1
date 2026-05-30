# DailyFlow Knowledge Base Shortcuts
# Add to PowerShell profile ($PROFILE):
# . "C:\Projects\fiae-workspace\dailyflow\.knowledge\kb_shortcuts.ps1"

$KB_DIR = "C:\Projects\fiae-workspace\dailyflow\.knowledge"
$VENV_ACTIVATE = "$KB_DIR\venv\Scripts\Activate.ps1"

function kb-build {
    <# Rebuild the ChromaDB vector knowledge base from .knowledge/docs/ and .prompts/ #>
    if (Test-Path $VENV_ACTIVATE) { & $VENV_ACTIVATE }
    python "$KB_DIR\build_kb.py"
}

function kb-load {
    <# Load full context (or topic-specific context) for AI. Opens context_output.md in VS Code. #>
    param([string]$question = "")
    if (Test-Path $VENV_ACTIVATE) { & $VENV_ACTIVATE }
    if ($question) {
        python "$KB_DIR\load_context.py" $question
    } else {
        python "$KB_DIR\load_context.py"
    }
    $output = "$KB_DIR\context_output.md"
    if (Test-Path $output) { code $output }
}

function kb-query {
    <# Quick semantic search in the knowledge base. #>
    param(
        [Parameter(Mandatory = $true)][string]$question,
        [int]$results = 5
    )
    if (Test-Path $VENV_ACTIVATE) { & $VENV_ACTIVATE }
    python "$KB_DIR\query_kb.py" $question --results $results
}

function kb-daily {
    <# Create today's entry in DAILY_LOG.md #>
    if (Test-Path $VENV_ACTIVATE) { & $VENV_ACTIVATE }
    python "$KB_DIR\daily_update.py"
}

function kb-install {
    <# Install Python dependencies for the knowledge base #>
    if (Test-Path $VENV_ACTIVATE) {
        & $VENV_ACTIVATE
    } else {
        Write-Host "Creating virtual environment..." -ForegroundColor Yellow
        python -m venv "$KB_DIR\venv"
        & $VENV_ACTIVATE
    }
    pip install chromadb ollama python-dotenv rich
    Write-Host "Done! Run kb-build to build the knowledge base." -ForegroundColor Green
}

Write-Host ""
Write-Host "DailyFlow KB shortcuts loaded:" -ForegroundColor Green
Write-Host "  kb-install          install Python dependencies" -ForegroundColor Cyan
Write-Host "  kb-build            rebuild knowledge base" -ForegroundColor Cyan
Write-Host "  kb-load             load full context for AI" -ForegroundColor Cyan
Write-Host "  kb-load 'topic'     load context for specific topic" -ForegroundColor Cyan
Write-Host "  kb-query 'q'        quick semantic search" -ForegroundColor Cyan
Write-Host "  kb-daily            create today's log entry" -ForegroundColor Cyan
Write-Host ""
