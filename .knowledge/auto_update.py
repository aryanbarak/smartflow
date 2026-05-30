"""
DailyFlow Auto-Update Script
Analyzes recent git commits and updates PROJECT_STATUS.md.

Usage:
  python .knowledge/auto_update.py
  python .knowledge/auto_update.py --full    (rebuilds KB too)
  python .knowledge/auto_update.py --no-commit
"""

import re
import sys
import subprocess
from pathlib import Path
from datetime import date

ROOT = Path(__file__).parent.parent
STATUS_FILE = ROOT / "PROJECT_STATUS.md"
KB_SCRIPT = ROOT / ".knowledge" / "build_kb.py"
VENV_PYTHON = ROOT / ".knowledge" / "venv" / "Scripts" / "python.exe"


def run(cmd: list[str], **kwargs) -> str:
    return subprocess.check_output(cmd, cwd=ROOT, **kwargs).decode().strip()


def get_recent_commits(n: int = 10) -> list[dict]:
    raw = run(['git', 'log', f'-{n}', '--pretty=format:%h|%s|%ai'])
    commits = []
    for line in raw.splitlines():
        parts = line.split('|', 2)
        if len(parts) >= 2:
            commits.append({
                'hash': parts[0],
                'message': parts[1],
                'date': parts[2][:10] if len(parts) > 2 else date.today().isoformat(),
            })
    return commits


def detect_new_features(commits: list[dict]) -> list[str]:
    return [
        c['message'].removeprefix('feat:').removeprefix('feature:').strip()
        for c in commits
        if c['message'].lower().startswith(('feat:', 'feature:'))
    ]


def detect_bug_fixes(commits: list[dict]) -> list[str]:
    return [
        c['message'].removeprefix('fix:').removeprefix('bugfix:').strip()
        for c in commits
        if c['message'].lower().startswith(('fix:', 'bugfix:'))
    ]


def update_project_status(commits: list[dict]) -> bool:
    if not STATUS_FILE.exists():
        print("ERROR: PROJECT_STATUS.md not found")
        return False

    content = STATUS_FILE.read_text(encoding='utf-8')
    today = date.today().isoformat()

    if commits:
        last = commits[0]
        content = re.sub(
            r'# Last updated: \d{4}-\d{2}-\d{2}',
            f'# Last updated: {today}',
            content
        )
        content = re.sub(
            r'\*\*Last commit:\*\* .*',
            f'**Last commit:** {last["hash"]} - {last["message"]}',
            content
        )

    STATUS_FILE.write_text(content, encoding='utf-8')
    print(f"[OK]  PROJECT_STATUS.md updated ({today})")
    return True


def has_changes(filepath: Path) -> bool:
    result = subprocess.run(
        ['git', 'diff', '--quiet', str(filepath)],
        cwd=ROOT
    )
    return result.returncode != 0


def auto_update():
    print("\n=== DailyFlow Auto-Update ===\n")

    commits = get_recent_commits(10)
    print(f"Recent commits ({len(commits)} found):")
    for c in commits[:5]:
        print(f"  {c['hash']}  {c['message']}")
    if len(commits) > 5:
        print(f"  ... and {len(commits) - 5} more")

    new_features = detect_new_features(commits)
    bugs_fixed = detect_bug_fixes(commits)

    if new_features:
        print(f"\nNew features detected:")
        for f in new_features:
            print(f"  + {f}")

    if bugs_fixed:
        print(f"\nBug fixes detected:")
        for f in bugs_fixed:
            print(f"  * {f}")

    print()
    update_project_status(commits)

    if '--full' in sys.argv:
        print("\nRebuilding Knowledge Base...")
        python = str(VENV_PYTHON) if VENV_PYTHON.exists() else sys.executable
        subprocess.run([python, str(KB_SCRIPT)], cwd=ROOT)

    if '--no-commit' not in sys.argv and has_changes(STATUS_FILE):
        answer = input("\nCommit updated PROJECT_STATUS.md? [y/N] ").strip().lower()
        if answer == 'y':
            subprocess.run(['git', 'add', str(STATUS_FILE)], cwd=ROOT)
            subprocess.run(
                ['git', 'commit', '-m', 'chore: auto-update project status'],
                cwd=ROOT
            )
            print("[OK]  Committed")
    else:
        print("\nNo changes to commit")

    print("\n=== Auto-update complete ===\n")


if __name__ == "__main__":
    auto_update()
