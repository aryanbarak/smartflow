"""
DailyFlow Knowledge Base Builder
Usage: python .knowledge/build_kb.py
"""

import sys
import chromadb
from chromadb.utils import embedding_functions
from pathlib import Path

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
        print(f"  [kb]  {md_file.name}")

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
        print(f"  [pr]  {rel_path}")

    return docs


def build_knowledge_base():
    print("\n=== DailyFlow Knowledge Base Builder ===\n")

    import urllib.request
    try:
        urllib.request.urlopen("http://localhost:11434", timeout=3)
    except Exception:
        print("ERROR: Ollama is not running. Start it with: ollama serve")
        sys.exit(1)

    print("OK   Ollama is running")
    print("\nLoading documents...")
    docs = load_documents()
    print(f"\nOK   Loaded {len(docs)} documents")

    print("\nBuilding vector database...")
    client = chromadb.PersistentClient(path=str(CHROMA_DIR))

    try:
        client.delete_collection("dailyflow")
        print("     Cleared existing collection")
    except Exception:
        pass

    ef = get_ollama_embeddings()
    collection = client.create_collection(
        name="dailyflow",
        embedding_function=ef,
        metadata={"hnsw:space": "cosine"}
    )

    batch_size = 10
    total = len(docs)
    for i in range(0, total, batch_size):
        batch = docs[i:i + batch_size]
        collection.add(
            ids=[d["id"] for d in batch],
            documents=[d["content"] for d in batch],
            metadatas=[d["metadata"] for d in batch]
        )
        end = min(i + batch_size, total)
        print(f"     Embedded {end}/{total}...")

    print(f"\nDONE  Knowledge Base built!")
    print(f"      {collection.count()} vectors stored")
    print(f"      Saved to: {CHROMA_DIR}\n")


if __name__ == "__main__":
    build_knowledge_base()
