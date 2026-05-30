"""
DailyFlow Knowledge Base Builder
Usage: python .knowledge/build_kb.py
"""

import os
import sys
import chromadb
from chromadb.utils import embedding_functions
from pathlib import Path
from rich.console import Console
from rich.progress import track

console = Console()

KB_DIR = Path(__file__).parent
DOCS_DIR = KB_DIR / "docs"
CHROMA_DIR = KB_DIR / "chroma_db"
PROMPTS_DIR = KB_DIR.parent / ".prompts"


def get_ollama_embeddings():
    return embedding_functions.OllamaEmbeddingFunction(
        url="http://localhost:11434/api/embeddings",
        model_name="nomic-embed-text"
    )


def load_documents():
    docs = []

    # Load KB docs (English only)
    for md_file in sorted(DOCS_DIR.glob("*.md")):
        content = md_file.read_text(encoding="utf-8")
        docs.append({
            "id": f"kb_{md_file.stem}",
            "content": content,
            "metadata": {
                "source": str(md_file.relative_to(KB_DIR.parent)),
                "type": "knowledge_base",
                "title": md_file.stem.replace("_", " ").title()
            }
        })
        console.print(f"  📄 {md_file.name}")

    # Load prompt files (English only — skip Persian راهنما.md)
    for md_file in PROMPTS_DIR.rglob("*.md"):
        try:
            content = md_file.read_text(encoding="utf-8")
        except Exception:
            continue
        rel_path = md_file.relative_to(PROMPTS_DIR.parent)
        docs.append({
            "id": f"prompt_{md_file.parent.name}_{md_file.stem}",
            "content": content,
            "metadata": {
                "source": str(rel_path),
                "type": "prompt",
                "title": md_file.stem.replace("-", " ").title()
            }
        })
        console.print(f"  📝 {rel_path}")

    return docs


def build_knowledge_base():
    console.print("\n[bold blue]🧠  DailyFlow Knowledge Base Builder[/bold blue]\n")

    import urllib.request
    try:
        urllib.request.urlopen("http://localhost:11434", timeout=3)
    except Exception:
        console.print("[red]✗ Ollama is not running![/red]")
        console.print("  Start it with: ollama serve")
        sys.exit(1)

    console.print("[green]✓ Ollama is running[/green]")

    console.print("\n[bold]Loading documents...[/bold]")
    docs = load_documents()
    console.print(f"\n[green]✓ Loaded {len(docs)} documents[/green]")

    console.print("\n[bold]Building vector database...[/bold]")
    client = chromadb.PersistentClient(path=str(CHROMA_DIR))

    try:
        client.delete_collection("dailyflow")
        console.print("  🗑  Cleared existing collection")
    except Exception:
        pass

    ef = get_ollama_embeddings()
    collection = client.create_collection(
        name="dailyflow",
        embedding_function=ef,
        metadata={"hnsw:space": "cosine"}
    )

    batch_size = 10
    for i in track(range(0, len(docs), batch_size), description="Embedding..."):
        batch = docs[i:i + batch_size]
        collection.add(
            ids=[d["id"] for d in batch],
            documents=[d["content"] for d in batch],
            metadatas=[d["metadata"] for d in batch]
        )

    console.print(f"\n[bold green]✓ Knowledge Base built![/bold green]")
    console.print(f"   📦 {collection.count()} vectors stored")
    console.print(f"   💾 Saved to: {CHROMA_DIR}\n")


if __name__ == "__main__":
    build_knowledge_base()
