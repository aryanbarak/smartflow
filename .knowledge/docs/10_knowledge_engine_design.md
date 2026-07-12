# SmartFlow Knowledge Engine V2 Design

Date: 2026-07-11

Status: architecture design specification only. This document defines a minimal
migration-ready Knowledge Engine V2 architecture. It does not include
implementation code and does not change the current local workflow.

Authoritative input: `.knowledge/docs/09_knowledge_engine_architecture_audit.md`

## System Overview

Knowledge Engine V2 is a practical provider-based architecture for SmartFlow
project knowledge. Its first responsibility is to preserve the current working
local flow:

```text
Markdown -> Ollama embeddings -> ChromaDB -> Query -> Context output
```

Its migration target is deliberately narrow:

```text
Markdown -> Cloud embeddings -> Supabase pgvector -> Query -> Context output
```

The source of truth remains `.knowledge/docs/`. Generated outputs such as
`.knowledge/context_output.md` and vector databases remain rebuildable artifacts.
The design separates source loading, chunking, embedding, vector storage,
retrieval, and context generation so that Ollama and ChromaDB can be replaced
without rewriting the entire workflow.

## Goals

- Keep the current Markdown, Ollama, ChromaDB workflow functional.
- Keep `.knowledge/docs/` canonical and generated files non-canonical.
- Introduce clear boundaries for embedding and vector storage providers.
- Make configuration explicit rather than scattered across scripts.
- Improve retrieval quality through stable chunks and source metadata.
- Support a future migration to cloud embeddings and Supabase pgvector.
- Keep local development usable without cloud credentials.
- Make the system testable with in-memory providers.
- Avoid indexing secrets, generated context, dependencies, or runtime user data.

## Non-goals

- No LLM reasoning layer inside the knowledge engine.
- No autonomous documentation updates.
- No backend or Supabase requirement for Phase 1.
- No multi-user design in this first migration-ready architecture.
- No semantic memory, vector memory for app users, or runtime personalization.
- No new renderer framework beyond Markdown context output and query output.
- No operational cloud platform design beyond what migration requires.

## Core Component Diagram

```text
Configured Sources
  -> Document Loader
  -> Document Normalizer
  -> Chunker
  -> Metadata Builder
  -> EmbeddingProvider
  -> VectorStore
  -> Retriever
  -> Context Composer
  -> Context Output
```

Provider boundaries:

```text
EmbeddingProvider
  -> Local Ollama provider
  -> Future cloud embedding provider
  -> In-memory test provider

VectorStore
  -> Local ChromaDB provider
  -> Future Supabase pgvector provider
  -> In-memory test provider
```

The build, query, and context-generation workflows depend on these boundaries,
not directly on Ollama, ChromaDB, or Supabase APIs.

## Build Pipeline

The build pipeline converts canonical source documents into searchable vector
records.

It should:

- Discover configured source roots.
- Load allowed Markdown files.
- Exclude generated files, `.env`, dependency directories, databases, and
  private runtime data.
- Normalize document text without modifying source files.
- Split documents into stable chunks.
- Attach safe metadata to each chunk.
- Generate embeddings through the configured `EmbeddingProvider`.
- Store records through the configured `VectorStore`.
- Produce a build summary or manifest.

Phase 1 keeps local defaults: `.knowledge/docs/`, Ollama, and
`.knowledge/chroma_db/`. The build should avoid destructive deletion when a
staged rebuild or upsert is available. If destructive rebuild remains necessary
during compatibility work, it should be explicit and clearly reported.

## Query Pipeline

The query pipeline retrieves relevant knowledge for a question.

It should:

- Validate the query and result limit.
- Generate the query embedding using `EmbeddingProvider`.
- Search the configured `VectorStore`.
- Return ranked chunks with source path, title, heading, and relevance metadata.
- Normalize provider-specific distance values before showing results.
- Avoid writing persistent state during query.

The current CLI query behavior should remain available. The internal retrieval
unit should become a chunk, not a whole file, so large architecture and roadmap
documents can be searched precisely.

## Context Generation Pipeline

The context generation pipeline creates AI-ready project context.

It should:

- Use either fixed core sources or query-driven retrieval.
- Compose selected chunks into a stable Markdown output.
- Preserve source attribution.
- Enforce output size limits.
- Write only to configured generated-output paths.

`.knowledge/context_output.md` remains generated output. It must not become the
source of truth. If context generation cannot find a required core source, it
should report that clearly rather than silently producing misleading context.

## Configuration

Configuration should be centralized and local-first.

Required configuration categories:

- Source roots: canonical docs and optional prompt sources.
- Exclusions: generated context, vector databases, dependencies, secrets, build
  artifacts.
- Embedding provider: provider type, model, endpoint, dimension.
- Vector store: provider type, database path or connection profile, collection
  or table name.
- Retrieval limits: default result count, maximum result count, context output
  size.
- Chunking: chunk size, overlap, heading-aware behavior.
- Compatibility: legacy collection name and legacy document ID mapping.

Local defaults must work without cloud credentials. Cloud credentials must live
outside source-controlled Markdown and should be required only when a cloud
profile is explicitly selected.

## Document Model

A document represents one canonical source file.

It should contain:

- Stable document ID.
- Source type.
- Relative source path.
- Title.
- Normalized text.
- Content hash.
- Last modified or build timestamp.

Document identity should not rely only on filename stems. It should be based on
source category plus normalized relative path so nested files do not collide and
machine-specific absolute paths do not leak into IDs.

## Chunk Model and Chunking Strategy

A chunk is the retrievable unit used for embedding and search.

Each chunk should contain:

- Stable chunk ID.
- Parent document ID.
- Chunk text.
- Chunk index.
- Heading or section context.
- Source range where practical.
- Content hash.
- Safe metadata.

Chunking should be deterministic. Prefer Markdown heading boundaries, keep
related heading content together where possible, split oversized sections, and
preserve enough heading context for search results to be understandable.

Whole-file indexing may remain as a temporary compatibility mode, but the V2
target is section-aware chunking.

## Stable IDs

Stable IDs are necessary for incremental builds and migration.

Document IDs should use:

- Source category.
- Normalized relative path.
- Optional legacy alias for current IDs.

Chunk IDs should use:

- Document ID.
- Section path or heading context.
- Chunk index.
- Content-boundary validation hash.

Content hashes should validate whether a record changed, but they should not be
the only identity. This prevents unrelated edits from invalidating every ID.

## EmbeddingProvider Boundary

`EmbeddingProvider` owns text-to-vector conversion.

It must expose:

- Provider identity.
- Model name.
- Vector dimension.
- Health status.
- Single-text embedding.
- Batch embedding.
- Provider-safe errors.

Phase 1 implementation is Ollama. Future implementation may use a cloud
embedding provider. Tests should use an in-memory or deterministic fake provider.
Workflows must not call Ollama or cloud APIs directly.

## VectorStore Boundary

`VectorStore` owns vector persistence and search.

It must expose:

- Store identity.
- Collection or table preparation.
- Upsert vector records.
- Delete stale records.
- Search by embedding and metadata filters.
- Fetch by stable IDs where needed.
- Basic statistics.

Phase 1 implementation is ChromaDB. Future implementation is Supabase pgvector.
Tests should use an in-memory store. The vector store must not create embeddings,
choose chunk boundaries, or render context output.

## Migration Strategy

Migration should be incremental and reversible.

1. Introduce configuration and provider boundaries while keeping Ollama and
   ChromaDB as defaults.
2. Add document and chunk models with stable IDs.
3. Add section-aware chunking behind the local pipeline.
4. Add build/query/context tests using fake providers.
5. Add a Supabase pgvector `VectorStore` provider behind the same interface.
6. Add a cloud embedding `EmbeddingProvider` behind the same interface.
7. Compare local and cloud builds using the same source documents and stable
   IDs before switching defaults.
8. Keep local fallback until cloud parity is verified.

Supabase migration should use a new provider profile, not a rewrite of the
build/query/context workflows.

## Testing

Tests should not require Ollama, ChromaDB, Supabase, or network access.

Required test areas:

- Source discovery and exclusion rules.
- Document ID and chunk ID stability.
- Heading-aware chunking.
- Metadata safety.
- Build pipeline with fake embedding and vector providers.
- Query pipeline with fake vector results.
- Context output shape and source attribution.
- Legacy compatibility for current local collection behavior.
- Provider failure behavior.

Provider contract tests should verify that Ollama, ChromaDB, cloud embeddings,
and Supabase providers can be swapped without changing workflow logic.

## Error Handling

Errors should be explicit and safe.

Build errors:

- Missing source roots.
- Embedding provider unavailable.
- Vector store unavailable.
- Incompatible vector dimension.
- Source file read failure.

Query errors:

- Empty index.
- No matching results.
- Provider unavailable.
- Invalid result limits.

Context generation errors:

- Missing required core source.
- Output write failure.
- Output size exceeded.

Errors must not leak secrets, credentials, raw request payloads, or full document
bodies.

## Security

Security rules:

- Index only explicitly configured project knowledge sources.
- Exclude `.env`, credentials, local databases, generated context, dependencies,
  build outputs, and runtime user data.
- Store safe metadata only.
- Do not log raw document bodies unless an explicit debug mode is enabled.
- Keep cloud providers opt-in.
- Keep cloud credentials outside source-controlled files.
- Treat `context_output.md` as shareable generated context and avoid including
  secrets in it.

Phase 1 indexes project documentation only. Personal SmartFlow user data is out
of scope.

## Risks

- Provider abstraction could become too broad for a small local workflow.
- Chunking could reduce quality if chunks lose heading context.
- Stable ID migration could break fixed core context if legacy aliases are not
  preserved.
- Ollama and ChromaDB remain local dependencies until providers are abstracted.
- Supabase pgvector requires schema, dimension, and access-control decisions
  before production use.
- Cloud embeddings introduce cost, rate limits, and credential handling.

Mitigation: keep local defaults, add tests before migration, preserve legacy IDs,
and treat vector stores as rebuildable outputs.

## Short Implementation Sequence

1. Add a central configuration object for local defaults and exclusions.
2. Define document, chunk, and metadata models.
3. Add stable document and chunk ID generation.
4. Extract Ollama calls behind `EmbeddingProvider`.
5. Extract ChromaDB calls behind `VectorStore`.
6. Add in-memory providers for tests.
7. Add heading-aware chunking.
8. Preserve current query and context commands through compatibility wrappers.
9. Add build manifest and provider health reporting.
10. Add optional cloud embedding and Supabase pgvector providers after local
    parity is tested.

## Conclusion

Knowledge Engine V2 should stay small: local Markdown remains canonical, Ollama
and ChromaDB remain the default working providers, and the first migration-ready
step is clean boundaries. Once document, chunk, embedding, vector store,
retrieval, and context composition responsibilities are separated, SmartFlow can
move from local embeddings and ChromaDB to cloud embeddings and Supabase
pgvector without replacing the knowledge workflow.
