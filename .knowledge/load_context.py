"""
Load SmartFlow Context for AI
Usage:
  python .knowledge/load_context.py
  python .knowledge/load_context.py "specific question or topic"
"""

import sys
import chromadb
from chromadb.utils import embedding_functions
from pathlib import Path
from datetime import date
from rich.console import Console

console = Console()

KB_DIR = Path(__file__).parent
CHROMA_DIR = KB_DIR / "chroma_db"

SYSTEM_PROMPT = """You are the AI Technical Architect for the SmartFlow project.

You have complete knowledge of:
- Project structure, patterns, and architecture
- All Supabase tables, schemas, and RLS policies
- React + TypeScript + TanStack Query v5 patterns
- Cloudflare Pages + Workers deployment process
- The roadmap, known bugs, and lessons learned
- Local AI setup (Ollama + Continue.dev)
- The prompt library (.prompts/ — 24 files, 7 categories)

Your responsibilities:
1. Answer project questions with specific, accurate details
2. Review code against project standards (.prompts/review/)
3. Suggest improvements aligned with existing patterns
4. Propose features aligned with the roadmap
5. Act as Code Reviewer, Security Reviewer, DB Reviewer, UI Reviewer, DevOps Reviewer

Always follow patterns from .prompts/ and rules from .knowledge/docs/.
Default language: respond in the same language the user writes in.
"""

CORE_IDS = [
    "kb_01_project_overview",
    "kb_02_architecture",
    "kb_03_database_schema",
    "kb_04_frontend_patterns",
    "kb_07_roadmap",
]


def load_full_context(question: str = "") -> str:
    if not CHROMA_DIR.exists():
        console.print("[red]✗ Knowledge Base not built![/red]")
        console.print("Run: python .knowledge/build_kb.py")
        sys.exit(1)

    ef = embedding_functions.OllamaEmbeddingFunction(
        url="http://localhost:11434/api/embeddings",
        model_name="nomic-embed-text"
    )

    client = chromadb.PersistentClient(path=str(CHROMA_DIR))
    collection = client.get_collection("dailyflow", embedding_function=ef)

    if question:
        results = collection.query(
            query_texts=[question],
            n_results=8,
            include=["documents", "metadatas"]
        )
        context_docs = results["documents"][0]
        context_metas = results["metadatas"][0]
        console.print(f"  🎯 Loaded {len(context_docs)} relevant docs for: {question}")
    else:
        results = collection.get(
            ids=CORE_IDS,
            include=["documents", "metadatas"]
        )
        context_docs = results["documents"]
        context_metas = results["metadatas"]
        console.print(f"  📚 Loaded {len(context_docs)} core docs")

    today = date.today().isoformat()
    context = f"""# SmartFlow AI Context — {today}

## System Role

{SYSTEM_PROMPT}

---

## Project Knowledge

"""
    for doc, meta in zip(context_docs, context_metas):
        context += f"### {meta['title']}\n"
        context += f"Source: `{meta['source']}`\n\n"
        context += f"{doc}\n\n---\n\n"

    return context


if __name__ == "__main__":
    question = " ".join(sys.argv[1:]) if len(sys.argv) > 1 else ""

    console.print("\n[bold blue]🧠  Loading SmartFlow Context...[/bold blue]")
    context = load_full_context(question)

    output_file = KB_DIR / "context_output.md"
    output_file.write_text(context, encoding="utf-8")

    console.print(f"[green]✓ Context ready![/green]")
    console.print(f"   📄 {output_file}")
    console.print(f"   📏 {len(context):,} characters")
    console.print("\n[bold]Copy contents of context_output.md and paste into your AI.[/bold]\n")
