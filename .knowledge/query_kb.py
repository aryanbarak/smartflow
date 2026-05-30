"""
DailyFlow Knowledge Base Query
Usage: python .knowledge/query_kb.py "your question"
       python .knowledge/query_kb.py "supabase RLS pattern" --results 3
"""

import sys
import chromadb
from chromadb.utils import embedding_functions
from pathlib import Path
from rich.console import Console
from rich.panel import Panel

console = Console()

KB_DIR = Path(__file__).parent
CHROMA_DIR = KB_DIR / "chroma_db"


def query_kb(question: str, n_results: int = 5) -> None:
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

    results = collection.query(
        query_texts=[question],
        n_results=n_results,
        include=["documents", "metadatas", "distances"]
    )

    console.print(f"\n[bold blue]🔍 Query: {question}[/bold blue]")
    console.print(f"[dim]Found {len(results['documents'][0])} results[/dim]\n")

    for i, (doc, meta, dist) in enumerate(zip(
        results["documents"][0],
        results["metadatas"][0],
        results["distances"][0]
    )):
        relevance = round((1 - dist) * 100)
        preview = doc[:600] + ("..." if len(doc) > 600 else "")
        color = "green" if relevance > 70 else "yellow" if relevance > 40 else "red"

        console.print(Panel(
            f"[bold]{meta['title']}[/bold]\n"
            f"[dim]Source: {meta['source']} | Type: {meta['type']}[/dim]\n"
            f"[{color}]Relevance: {relevance}%[/{color}]\n\n"
            f"{preview}",
            title=f"Result {i + 1}",
            border_style="cyan"
        ))


if __name__ == "__main__":
    if len(sys.argv) < 2:
        console.print("[yellow]Usage: python query_kb.py 'your question'[/yellow]")
        console.print("[yellow]       python query_kb.py 'question' --results 3[/yellow]")
        sys.exit(1)

    n = 5
    args = sys.argv[1:]
    if "--results" in args:
        idx = args.index("--results")
        n = int(args[idx + 1])
        args = [a for i, a in enumerate(args) if i != idx and i != idx + 1]

    question = " ".join(args)
    query_kb(question, n_results=n)
