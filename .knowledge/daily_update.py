"""
DailyFlow Daily Log Helper
Creates or updates today's entry in DAILY_LOG.md
Usage: python .knowledge/daily_update.py
"""

from datetime import date
from pathlib import Path
from rich.console import Console
from rich.prompt import Prompt

console = Console()

KB_DIR = Path(__file__).parent
DAILY_LOG = KB_DIR.parent / "DAILY_LOG.md"

LOG_HEADER = """# dailyFlow — Daily Log

Chronological log of work sessions. Newest entries at the top.

---

"""


def create_daily_entry() -> None:
    today = date.today()
    date_str = today.strftime("%Y-%m-%d")
    day_name = today.strftime("%A")

    console.print(f"\n[bold blue]📅 Daily Log Entry — {date_str} ({day_name})[/bold blue]\n")

    existing = ""
    if DAILY_LOG.exists():
        existing = DAILY_LOG.read_text(encoding="utf-8")
        if f"## {date_str}" in existing:
            console.print(f"[yellow]⚠ Entry for {date_str} already exists in DAILY_LOG.md.[/yellow]")
            overwrite = Prompt.ask("Overwrite?", choices=["y", "n"], default="n")
            if overwrite != "y":
                return

    what_done = Prompt.ask("[cyan]What did you work on today?[/cyan]")
    issues = Prompt.ask("[cyan]Any issues or blockers?[/cyan]", default="None")
    next_steps = Prompt.ask("[cyan]What's next?[/cyan]")
    commit = Prompt.ask("[cyan]Git commit hash or branch (optional)[/cyan]", default="")

    commit_line = f"\n- Commit: `{commit}`" if commit else ""

    entry = f"""## {date_str} — {day_name}

### Done
- {what_done}{commit_line}

### Issues
- {issues}

### Next
- {next_steps}

---

"""

    if DAILY_LOG.exists():
        content = DAILY_LOG.read_text(encoding="utf-8")
        # Insert after the header section (after the first ---)
        if "---" in content:
            parts = content.split("---\n", 1)
            new_content = parts[0] + "---\n\n" + entry + (parts[1] if len(parts) > 1 else "")
        else:
            new_content = content + entry
        DAILY_LOG.write_text(new_content, encoding="utf-8")
    else:
        DAILY_LOG.write_text(LOG_HEADER + entry, encoding="utf-8")

    console.print(f"\n[green]✓ Entry added to DAILY_LOG.md[/green]")
    console.print(f"   📄 {DAILY_LOG}\n")


if __name__ == "__main__":
    create_daily_entry()
