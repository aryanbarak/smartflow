# SmartFlow Knowledge Engine Architecture Audit

Date: 2026-07-11

Scope: audit only. This document describes the current `.knowledge/` implementation
without proposing or applying code changes.

## 1. High-Level Architecture

The SmartFlow knowledge system is a local retrieval and context-preparation
toolchain built around Markdown source documents, prompt files, Ollama
embeddings, and ChromaDB persistent vector storage.

The canonical source of truth is `.knowledge/docs/`. The generated retrieval
database lives in `.knowledge/chroma_db/`, and generated context for AI sessions
lives in `.knowledge/context_output.md`.

At a high level, the system has four roles:

1. Knowledge ingestion:
   - `build_kb.py` reads Markdown from `.knowledge/docs/` and `.prompts/`.
   - It embeds each whole Markdown file with Ollama.
   - It stores embeddings and metadata in a Chroma collection.

2. Semantic query:
   - `query_kb.py` opens the Chroma collection.
   - It embeds a user question with the same Ollama embedding model.
   - It returns the nearest documents with relevance previews.

3. Context export:
   - `load_context.py` loads either fixed core docs or query-relevant docs.
   - It wraps them in a system prompt.
   - It writes `.knowledge/context_output.md` for copy-paste into an AI assistant.

4. Maintenance helpers:
   - `auto_update.py` edits `PROJECT_STATUS.md` from recent git commits and can rebuild the KB.
   - `daily_update.py` creates or updates `DAILY_LOG.md` through interactive prompts.
   - `kb_shortcuts.ps1` defines PowerShell helpers, but it is not part of the requested file focus.

Important naming note: the product documentation now uses SmartFlow, but the
knowledge scripts, Chroma collection, console messages, and shortcut file still
use legacy DailyFlow/dailyflow naming.

## 2. Execution Flow

### Build Flow

```text
.knowledge/docs/*.md
+ repo-level .prompts/**/*.md
-> load_documents()
-> whole-file document objects
-> OllamaEmbeddingFunction
-> Chroma PersistentClient
-> delete collection "dailyflow"
-> create collection "dailyflow"
-> add documents in batches of 10
-> .knowledge/chroma_db/
```

Current behavior is a full rebuild. The existing collection is deleted before a
new collection is created.

### Query Flow

```text
question from CLI
-> parse --results option
-> OllamaEmbeddingFunction
-> Chroma PersistentClient
-> get collection "dailyflow"
-> collection.query()
-> documents + metadata + distances
-> Rich panels in terminal
```

The query tool does not write files.

### Context Loading Flow

Without a question:

```text
CORE_IDS
-> collection.get(ids=CORE_IDS)
-> system prompt
-> concatenate core docs
-> write .knowledge/context_output.md
```

With a question:

```text
question from CLI
-> collection.query(n_results=8)
-> relevant docs
-> system prompt
-> concatenate relevant docs
-> write .knowledge/context_output.md
```

### Maintenance Flow

`auto_update.py`:

```text
git log
-> detect feat:/feature: and fix:/bugfix: commits
-> regex-update PROJECT_STATUS.md
-> optionally run build_kb.py
-> optionally git add + git commit
```

`daily_update.py`:

```text
interactive prompts
-> DAILY_LOG.md entry
-> insert newest entry near top
```

## 3. Dependency Graph

### build_kb.py

Imports:

- `sys`
- `chromadb`
- `chromadb.utils.embedding_functions`
- `pathlib.Path`
- `urllib.request` inside `build_knowledge_base()`

Calls:

- `get_ollama_embeddings()`
- `load_documents()`
- `urllib.request.urlopen("http://localhost:11434", timeout=3)`
- `chromadb.PersistentClient(path=str(CHROMA_DIR))`
- `client.delete_collection("dailyflow")`
- `client.create_collection(...)`
- `collection.add(...)`

Reads:

- `.knowledge/docs/*.md`
- `.prompts/**/*.md`

Writes:

- `.knowledge/chroma_db/`

### query_kb.py

Imports:

- `sys`
- `chromadb`
- `chromadb.utils.embedding_functions`
- `pathlib.Path`
- `rich.console.Console`
- `rich.panel.Panel`

Calls:

- `chromadb.PersistentClient(path=str(CHROMA_DIR))`
- `client.get_collection("dailyflow", embedding_function=ef)`
- `collection.query(...)`
- Rich console rendering

Reads:

- `.knowledge/chroma_db/`

Writes:

- terminal output only

### load_context.py

Imports:

- `sys`
- `chromadb`
- `chromadb.utils.embedding_functions`
- `pathlib.Path`
- `datetime.date`
- `rich.console.Console`

Calls:

- `chromadb.PersistentClient(path=str(CHROMA_DIR))`
- `client.get_collection("dailyflow", embedding_function=ef)`
- `collection.get(ids=CORE_IDS, ...)`
- `collection.query(..., n_results=8, ...)`
- `output_file.write_text(...)`

Reads:

- `.knowledge/chroma_db/`

Writes:

- `.knowledge/context_output.md`

### auto_update.py

Imports:

- `re`
- `sys`
- `subprocess`
- `pathlib.Path`
- `datetime.date`

Calls:

- `git log`
- regex substitutions on `PROJECT_STATUS.md`
- optionally `.knowledge/venv/Scripts/python.exe .knowledge/build_kb.py`
- optionally `git diff --quiet`
- optionally `git add`
- optionally `git commit`

Reads:

- git history
- `PROJECT_STATUS.md`

Writes:

- `PROJECT_STATUS.md`
- optionally `.knowledge/chroma_db/`
- optionally git index and git history

### daily_update.py

Imports:

- `datetime.date`
- `pathlib.Path`
- `rich.console.Console`
- `rich.prompt.Prompt`

Calls:

- interactive Rich prompts
- `DAILY_LOG.read_text(...)`
- `DAILY_LOG.write_text(...)`

Reads:

- `DAILY_LOG.md` if present

Writes:

- `DAILY_LOG.md`

## 4. Responsibilities

### build_kb.py

Purpose:

- Build the local semantic knowledge database.

Inputs:

- Markdown files directly inside `.knowledge/docs/`
- Markdown files recursively inside repo-level `.prompts/`
- Ollama server availability
- `nomic-embed-text` model availability

Outputs:

- Chroma collection named `dailyflow`
- Persistent data under `.knowledge/chroma_db/`
- terminal progress output

Dependencies:

- Ollama at `http://localhost:11434`
- ChromaDB Python package
- `nomic-embed-text`
- local filesystem

Side effects:

- Deletes the existing `dailyflow` Chroma collection.
- Recreates the collection.
- Embeds and stores every loaded Markdown document.

### query_kb.py

Purpose:

- Query the Chroma knowledge base from the command line.

Inputs:

- CLI question text
- optional `--results N`
- existing Chroma collection
- Ollama embedding model

Outputs:

- terminal-rendered Rich panels with document previews, metadata, and relevance estimate

Dependencies:

- `.knowledge/chroma_db/`
- collection `dailyflow`
- Ollama embedding endpoint
- Rich

Side effects:

- none beyond terminal output

### load_context.py

Purpose:

- Produce AI-ready Markdown context from either core docs or semantically relevant docs.

Inputs:

- optional CLI question
- existing Chroma collection
- fixed `CORE_IDS` when no question is provided

Outputs:

- `.knowledge/context_output.md`

Dependencies:

- `.knowledge/chroma_db/`
- collection `dailyflow`
- Ollama embedding endpoint
- Rich

Side effects:

- overwrites `.knowledge/context_output.md`

### auto_update.py

Purpose:

- Maintenance helper that updates project status from recent git commits.

Inputs:

- recent git commits
- command flags:
  - `--full`
  - `--no-commit`

Outputs:

- updated `PROJECT_STATUS.md`
- optional rebuilt ChromaDB
- optional git commit

Dependencies:

- git CLI
- `PROJECT_STATUS.md`
- Python executable, preferably `.knowledge/venv/Scripts/python.exe`
- `build_kb.py` for `--full`

Side effects:

- edits `PROJECT_STATUS.md`
- can rebuild `.knowledge/chroma_db/`
- can stage and commit changes

### daily_update.py

Purpose:

- Interactive daily log helper.

Inputs:

- user answers from Rich prompts
- optional existing `DAILY_LOG.md`

Outputs:

- updated or created `DAILY_LOG.md`

Dependencies:

- Rich
- terminal interactivity

Side effects:

- writes `DAILY_LOG.md`

## 5. Configuration

Hard-coded paths:

- `KB_DIR = Path(__file__).parent`
- `DOCS_DIR = KB_DIR / "docs"`
- `CHROMA_DIR = KB_DIR / "chroma_db"`
- `PROMPTS_DIR = KB_DIR.parent / ".prompts"`
- `STATUS_FILE = ROOT / "PROJECT_STATUS.md"`
- `KB_SCRIPT = ROOT / ".knowledge" / "build_kb.py"`
- `VENV_PYTHON = ROOT / ".knowledge" / "venv" / "Scripts" / "python.exe"`
- `DAILY_LOG = KB_DIR.parent / "DAILY_LOG.md"`

Hard-coded collection:

- `dailyflow`

Hard-coded embedding model:

- `nomic-embed-text`

Hard-coded Ollama endpoints:

- health check: `http://localhost:11434`
- embeddings: `http://localhost:11434/api/embeddings`

Hard-coded Chroma settings:

- persistent directory: `.knowledge/chroma_db`
- collection metadata: `{"hnsw:space": "cosine"}`

Hard-coded document loading rules:

- `.knowledge/docs/*.md` only, non-recursive
- `.prompts/**/*.md`, recursive
- document ID for knowledge docs: `kb_{md_file.stem}`
- document ID for prompts: `prompt_{md_file.parent.name}_{md_file.stem}`

Hard-coded batching and limits:

- build batch size: `10`
- query default results: `5`
- query `--results` accepts direct integer conversion without range validation
- context question results: `8`
- context core IDs:
  - `kb_01_project_overview`
  - `kb_02_architecture`
  - `kb_03_database_schema`
  - `kb_04_frontend_patterns`
  - `kb_07_roadmap`
- query preview length: `600` characters
- auto-update recent commits: `10`
- auto-update printed commits: first `5`
- Ollama health-check timeout: `3` seconds

Hard-coded generated files:

- `.knowledge/context_output.md`
- `.knowledge/chroma_db/`
- `PROJECT_STATUS.md`
- `DAILY_LOG.md`

Hard-coded system prompt:

- `load_context.py` embeds a large `SYSTEM_PROMPT` string that still refers to
  "DailyFlow", fixed roles, supported domains, and `.prompts/`.

Hard-coded legacy naming:

- script docstrings and console labels use DailyFlow.
- Chroma collection name is `dailyflow`.
- shortcut paths in `kb_shortcuts.ps1` point to `C:\Projects\fiae-workspace\dailyflow\.knowledge`, not the current `smartflow` path.

## 6. Current Limitations

High-impact limitations:

- No chunking: each Markdown file is embedded as one document, reducing retrieval precision for large docs.
- Full rebuild only: `build_kb.py` deletes and recreates the whole collection.
- No incremental update detection or content hashing.
- No abstraction around embedding providers.
- No abstraction around vector store providers.
- No schema/version metadata for the generated vector database.
- The collection name remains `dailyflow`, which is a legacy name.
- `load_context.py` relies on fixed IDs; renamed docs can silently break context loading.
- `context_output.md` is overwritten without backup or diff.

Medium-impact limitations:

- Configuration is hard-coded across scripts instead of centralized.
- Ollama endpoint, model, collection name, and result limits are duplicated.
- Query relevance is calculated as `round((1 - distance) * 100)`, which assumes distance semantics that may not generalize.
- Prompt document IDs can collide when two prompts in different deeper paths share the same parent folder name and stem.
- Knowledge doc IDs can collide if nested docs are later added without changing the ID scheme.
- Build script ignores read errors for prompts but not for knowledge docs.
- Query script does not validate `--results` bounds or malformed argument order.
- Rich emoji output can fail on Windows console encodings unless UTF-8 is configured.
- The system has no automated tests.

Low-impact limitations:

- Console output still says DailyFlow.
- `.knowledge/docs/00_index.md` documents some limitations but does not cover all current scripts.
- There is no machine-readable manifest for indexed docs.
- There is no generated report showing which documents were indexed.

## 7. Migration Readiness

### Supabase pgvector

Migration difficulty: medium to high.

Reasons:

- Current code directly depends on ChromaDB APIs.
- There is no repository/interface layer around vector storage.
- Document IDs and metadata are simple enough to preserve.
- The ingestion pipeline is small, so migration is feasible, but it would require
  rewriting storage and query calls.
- Supabase pgvector would require schema design, migrations, auth/security
  policy decisions, and insertion/query code.

Work that would be needed later:

- define a vector table schema,
- define document/version metadata,
- replace Chroma `collection.add()` with Supabase inserts/upserts,
- replace Chroma `collection.query()` with vector similarity SQL/RPC,
- decide whether vectors are local-only, user-private, or project-global,
- add migration and rebuild tooling.

### Cloud Embedding Providers

Migration difficulty: medium.

Reasons:

- Embedding creation is duplicated but localized in each script.
- The current API uses Chroma's `OllamaEmbeddingFunction`, not a project-owned
  embedding interface.
- Switching providers would require changing build, query, and context scripts
  together.
- The rest of the document model is provider-neutral.

Work that would be needed later:

- introduce a provider abstraction,
- configure model/provider through environment or config,
- handle API keys safely,
- normalize embedding dimensions,
- ensure vector store compatibility with new dimensions,
- add rate limiting and retry handling.

### Overall Migration Assessment

The system is small and understandable, which helps migration. The main blocker
is tight coupling to ChromaDB and Ollama inside the scripts. A future migration
would be easier if document loading, embedding, vector storage, and context
rendering were separated behind explicit interfaces.

## 8. Risks

Operational risks:

- If Ollama is not running, build/query/context loading fails.
- If `nomic-embed-text` is missing, Chroma embedding calls fail.
- If Windows console encoding is not UTF-8, Rich emoji output can crash.
- Full rebuilds can lose the previous collection if a later batch fails.

Data quality risks:

- Whole-document embeddings can return broad docs instead of precise sections.
- Fixed core IDs can drift from actual file names.
- Prompt ID collision risk exists for similarly named files.
- Non-recursive `.knowledge/docs/*.md` loading excludes nested future docs.

Documentation risks:

- SmartFlow/DailyFlow naming inconsistency can confuse contributors.
- `.knowledge/prompts/` does not exist even though some instructions mention
  inspecting prompts inside `.knowledge/`; actual prompt source is `.prompts/`.
- `kb_shortcuts.ps1` appears to contain stale absolute paths.

Security/privacy risks:

- The knowledge system indexes all Markdown prompt files under `.prompts/`.
- There is no explicit secret scan before indexing docs/prompts.
- Generated `context_output.md` can contain large project context intended for
  copy-paste into third-party AI tools.
- `auto_update.py` can optionally run git commit operations interactively.

Maintenance risks:

- No tests protect the scripts.
- No config file centralizes model, URL, collection, and paths.
- No explicit versioning for the vector collection schema.
- No incremental rebuild means the workflow depends on full local embedding
  availability.

## 9. Documentation Quality

Matches current implementation:

- `.knowledge/docs/00_index.md` correctly identifies `.knowledge/docs/` as the
  source of truth.
- It correctly states that `context_output.md` is generated and not source of truth.
- It correctly documents the `dailyflow` collection as a legacy technical name.
- It correctly documents that active knowledge docs must live directly inside
  `.knowledge/docs/` because `build_kb.py` uses `DOCS_DIR.glob("*.md")`.
- It correctly mentions the need for Ollama and `nomic-embed-text`.

Inconsistencies and gaps:

- The requested `.knowledge/prompts/` directory does not exist. The actual
  indexed prompt directory is repo-level `.prompts/`.
- `build_kb.py` indexes `.prompts/**/*.md`, but `00_index.md` emphasizes docs
  loading and does not fully document prompt indexing behavior in the limitation section.
- Many script docstrings and console messages still say DailyFlow.
- `load_context.py` system prompt still says "dailyFlow project".
- `kb_shortcuts.ps1` contains an absolute path with `dailyflow`, while this repo
  path is `smartflow`.
- The rebuild procedure in `00_index.md` uses `python .knowledge/build_kb.py`,
  but this machine currently needed `.knowledge/venv/Scripts/python.exe`.
- `load_context.py` can require UTF-8 console encoding on Windows, but the docs
  do not mention this failure mode.
- `auto_update.py` has a regex looking for `# Last updated: YYYY-MM-DD`, while
  the current `PROJECT_STATUS.md` format uses `Last updated: YYYY-MM-DD` without
  a heading marker. This means the date update may not work as intended.

## 10. Improvement Opportunities

### High Priority

- Centralize configuration for collection name, model name, Ollama URL, Chroma path, limits, and core IDs.
- Add document chunking with stable chunk IDs.
- Add a storage/embedding abstraction so Chroma/Ollama can later be replaced by pgvector or cloud embeddings.
- Add incremental rebuild or upsert support based on content hashes.
- Add tests for document loading, ID generation, query argument parsing, and context output generation.
- Fix generated-context workflow documentation for Windows UTF-8 output and venv Python usage.
- Audit naming and path inconsistencies around SmartFlow/DailyFlow without breaking the existing collection.

### Medium Priority

- Add an index manifest showing which files were embedded and when.
- Add collision-safe IDs based on relative paths.
- Add a non-destructive rebuild mode that builds a new collection before switching.
- Add validation for `--results` and better CLI error messages.
- Add query/context output modes that can include section-level sources after chunking.
- Add a secret scan or exclusion rule before indexing Markdown.
- Update `auto_update.py` to match the current `PROJECT_STATUS.md` structure if it remains part of the workflow.

### Low Priority

- Replace emoji console output or force UTF-8-safe console behavior.
- Normalize console titles from DailyFlow to SmartFlow after collection naming is handled.
- Add command examples for venv Python usage.
- Document `kb_shortcuts.ps1` status or update it separately after approval.
- Add optional JSON output for `query_kb.py`.

## Audit Conclusion

The knowledge system is useful, small, and understandable. It already supports a
practical local workflow: maintain Markdown docs, rebuild a ChromaDB collection,
query it semantically, and generate AI-ready context.

Architecturally, it is still a script-based prototype rather than a modular
knowledge engine. Its main constraints are hard-coded configuration, whole-file
embeddings, full rebuilds, tight Chroma/Ollama coupling, no tests, and legacy
DailyFlow naming. These are manageable risks now, but they should be addressed
before migrating to Supabase pgvector, cloud embeddings, or a production-grade
retrieval layer.
