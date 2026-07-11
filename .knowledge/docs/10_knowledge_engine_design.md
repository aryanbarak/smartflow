# SmartFlow Knowledge Engine V2 Design

Date: 2026-07-11

Status: architecture design specification only. This document defines the target
Knowledge Engine V2 architecture. It does not prescribe implementation code and
does not change the current local workflow.

Authoritative input: `.knowledge/docs/09_knowledge_engine_architecture_audit.md`

## 1. System Overview

Knowledge Engine V2 is a modular retrieval and context-generation architecture
for SmartFlow project knowledge. It preserves the current local pipeline while
introducing clean boundaries for future provider changes.

Current Phase 1 compatibility target:

```text
Markdown
-> Ollama embeddings
-> ChromaDB
-> Query
-> Context loader
```

Target V2 architecture:

```text
Knowledge sources
-> document loader
-> document normalizer
-> chunker
-> metadata builder
-> embedding provider
-> vector store
-> retriever
-> context composer
-> generated context output
```

The V2 design separates domain responsibilities from infrastructure concerns.
Markdown loading, chunking, embedding, storage, retrieval, and context rendering
become independently replaceable components connected by stable data models.

Phase 1 continues to use local Markdown, Ollama, and ChromaDB. Later phases can
move embeddings or vector storage to cloud providers without changing source
document semantics or context composition rules.

## 2. Architectural Goals

- Preserve compatibility with the existing local `.knowledge/` workflow.
- Keep `.knowledge/docs/` as the source of truth.
- Keep generated files and vector databases as outputs, not canonical records.
- Separate document loading, chunking, embedding, storage, retrieval, and context
  rendering.
- Invert dependencies so high-level workflows depend on provider contracts, not
  concrete ChromaDB or Ollama APIs.
- Make provider selection configuration-driven.
- Support local-first operation during Phase 1.
- Enable incremental migration to Supabase pgvector or cloud embeddings.
- Improve retrieval precision through chunking and stable metadata.
- Support deterministic context generation with auditable source attribution.
- Make testing possible without Ollama or ChromaDB by using in-memory providers.
- Keep security and privacy explicit before any cloud migration.

## 3. Non-goals

- No LLM reasoning layer inside the knowledge engine.
- No autonomous documentation updates.
- No replacement of `.knowledge/docs/` as the canonical knowledge source.
- No mandatory cloud dependency in Phase 1.
- No multi-user cloud synchronization in Phase 1.
- No indexing of private runtime user data.
- No storage of secrets in vector metadata.
- No semantic memory for end users.
- No direct coupling to SmartFlow frontend runtime state.
- No generated code or implementation details in this design.

## 4. Component Diagram

```text
Knowledge Sources
  |
  v
Source Registry
  |
  v
Document Loader
  |
  v
Document Normalizer
  |
  v
Chunking Service
  |
  v
Metadata Builder
  |
  v
Embedding Provider Boundary
  |
  v
Vector Store Boundary
  |
  +--> Local ChromaDB Provider
  |
  +--> Future Supabase pgvector Provider
  |
  +--> Future Cloud Vector Provider
  |
  v
Retriever
  |
  v
Context Composer
  |
  v
Context Output Writer
```

Maintenance components:

```text
Configuration
  |
  +--> Build Pipeline
  +--> Query Pipeline
  +--> Context Generation Pipeline
  +--> Maintenance Pipeline

Observability
  |
  +--> Logs
  +--> Build Manifest
  +--> Provider Health Reports
```

## 5. Data Flow

Knowledge Engine V2 has three primary data flows.

Build-time data flow:

```text
source file
-> normalized document
-> chunks
-> metadata
-> embeddings
-> vector records
-> build manifest
```

Query-time data flow:

```text
query text
-> query embedding
-> vector search
-> ranked chunks
-> source references
-> formatted query result
```

Context-generation data flow:

```text
fixed context request or question
-> retrieval policy
-> selected chunks/documents
-> context sections
-> generated context_output.md
```

The build flow writes vector storage and a manifest. The query flow should not
write persistent state. The context flow writes only generated context output.

## 6. Build Pipeline

The build pipeline is responsible for converting canonical knowledge sources
into searchable vector records.

Responsibilities:

- Discover configured source roots.
- Load allowed file types.
- Normalize document content.
- Exclude generated outputs and sensitive files.
- Split documents into stable chunks.
- Build metadata for each document and chunk.
- Generate embeddings through the configured embedding provider.
- Store vectors through the configured vector store provider.
- Produce a build manifest.
- Report provider health and build statistics.

Phase 1 compatibility:

- Source roots remain `.knowledge/docs/` and repo-level `.prompts/`.
- Embeddings remain local through Ollama.
- Vector storage remains `.knowledge/chroma_db/`.
- The existing Chroma collection can remain compatible through a legacy provider
  mode.

Target behavior:

- Prefer upsert or staged rebuild over destructive collection deletion.
- Track content hashes to support incremental rebuilds.
- Record document, chunk, embedding model, and schema versions in the manifest.
- Keep generated outputs excluded from indexing.

## 7. Query Pipeline

The query pipeline is responsible for retrieving relevant knowledge for a user
question.

Responsibilities:

- Accept a query request.
- Validate result limits and retrieval options.
- Embed the query through the configured embedding provider.
- Search the configured vector store.
- Apply ranking and filtering rules.
- Return ranked chunks with source metadata.
- Render terminal, Markdown, or future structured outputs.

Phase 1 compatibility:

- CLI query behavior remains available.
- Default result counts remain compatible with the current workflow unless
  configuration overrides them.
- Local ChromaDB and Ollama remain the default providers.

Target behavior:

- Query results should reference chunks, not only whole documents.
- Result metadata should include source path, title, section, version, hash, and
  relevance.
- Provider-specific distance values should be normalized before presentation.

## 8. Context Generation Pipeline

The context generation pipeline creates AI-ready project context.

Responsibilities:

- Support fixed core-context generation.
- Support question-driven context generation.
- Retrieve configured core documents or relevant chunks.
- Preserve source attribution.
- Enforce output size and section ordering limits.
- Render a stable Markdown context file.
- Write generated output only to configured output locations.

Phase 1 compatibility:

- `.knowledge/context_output.md` remains the generated context output.
- Existing core context behavior remains available.
- Question-based retrieval remains available.

Target behavior:

- Core context should use logical source identifiers rather than fragile
  filename-derived IDs.
- Context generation should identify missing core sources clearly.
- Context output should include generated timestamp, source manifest version, and
  retrieval mode.
- Generated context remains an output and must not become source of truth.

## 9. Maintenance Pipeline

The maintenance pipeline supports operational upkeep without mixing maintenance
with retrieval logic.

Responsibilities:

- Rebuild or incrementally update the knowledge index.
- Validate configuration.
- Validate source availability.
- Validate provider health.
- Report stale vectors and missing sources.
- Produce or update build manifests.
- Support daily or manual documentation workflows.

Boundaries:

- Maintenance helpers may update explicitly configured human-authored files only
  when invoked for that purpose.
- Maintenance helpers must not silently modify canonical docs during indexing.
- Git operations must remain explicit and separate from knowledge indexing.

## 10. Module Responsibilities

Knowledge source registry:

- Owns the list of source roots and inclusion/exclusion rules.
- Distinguishes canonical docs, prompt library docs, generated outputs, and
  ignored paths.

Document loader:

- Reads supported source files.
- Produces raw document records with path and source type.
- Does not embed, chunk, query, or write vector data.

Document normalizer:

- Normalizes line endings, title extraction, and front matter interpretation.
- Preserves original source references.
- Does not change source files.

Chunking service:

- Splits normalized documents into retrieval units.
- Produces stable chunk boundaries where practical.
- Does not call embedding or storage providers.

Metadata builder:

- Produces document and chunk metadata.
- Adds version, source type, hash, timestamps, and logical identifiers.
- Avoids sensitive raw content in metadata.

Embedding provider:

- Converts text into vector embeddings.
- Owns provider health checks and model metadata.
- Does not know about ChromaDB, Supabase, or context output rendering.

Vector store:

- Stores vectors and metadata.
- Supports upsert, delete, search, and collection/schema inspection.
- Does not create embeddings.

Retriever:

- Coordinates query embedding and vector search.
- Applies result filtering, ranking, and limits.
- Does not render final context files.

Context composer:

- Converts retrieved documents or chunks into AI-ready Markdown.
- Applies section order, size limits, and source attribution.
- Does not query vector stores directly.

Output writer:

- Writes generated files such as `context_output.md`.
- Prevents accidental writes to canonical docs.

Configuration loader:

- Loads and validates configuration.
- Provides provider, path, model, limit, and collection settings to workflows.

Logger:

- Provides consistent operational messages.
- Keeps provider and workflow diagnostics separate from business logic.

## 11. Configuration Layer

V2 should centralize configuration currently duplicated across scripts.

Configuration categories:

- Project identity:
  - product name
  - legacy collection compatibility name
  - documentation root

- Source paths:
  - canonical knowledge docs
  - prompt library docs
  - generated output exclusions
  - optional future docs roots

- Provider settings:
  - embedding provider type
  - embedding model
  - embedding endpoint
  - vector store provider type
  - vector store location
  - collection or table name

- Retrieval settings:
  - default result count
  - maximum result count
  - core context source IDs
  - context output size limit

- Build settings:
  - chunk size policy
  - overlap policy
  - batch size
  - incremental rebuild mode
  - destructive rebuild safety mode

- Logging settings:
  - verbosity
  - structured output option
  - terminal formatting option

Configuration principles:

- Local development defaults must work without cloud credentials.
- Provider-specific secrets must not be stored in source-controlled Markdown.
- The local V1-compatible configuration should be the default Phase 1 profile.
- Future cloud configuration should be additive, not a rewrite.

## 12. Document Model

A document is the canonical representation of one source file or future source
record.

Document responsibilities:

- Identify the source.
- Preserve source path or source URI.
- Preserve source type.
- Preserve normalized text.
- Preserve title and optional section metadata.
- Carry content hash.
- Carry document version.
- Carry timestamps from the source or build process.

Document identity must not depend only on filename stem. It should be stable
across provider changes and collision-resistant across nested paths.

Document content remains the source-derived text. Vector storage may store
chunks and metadata, but `.knowledge/docs/` remains the canonical human-authored
source for project knowledge.

## 13. Metadata Model

Metadata describes the document and chunk without duplicating sensitive content.

Recommended metadata categories:

- Source metadata:
  - source type
  - relative path or source URI
  - logical source ID
  - title
  - section heading

- Build metadata:
  - content hash
  - document version
  - chunk version
  - embedding model
  - embedding provider
  - vector schema version
  - build timestamp

- Retrieval metadata:
  - chunk index
  - token or character range
  - relevance score
  - provider distance value

- Governance metadata:
  - generated vs canonical marker
  - sensitive-source exclusion status
  - owner or project scope for future multi-user support

Metadata must be safe to log and safe to show in retrieval output. Raw document
bodies, secrets, credentials, and private runtime user data should not be stored
as metadata.

## 14. Chunk Model

A chunk is a retrievable segment of a normalized document.

Chunk responsibilities:

- Preserve a stable relationship to its parent document.
- Contain the text used for embedding and retrieval.
- Carry its own stable ID.
- Carry chunk index and source range metadata.
- Carry heading or section context where available.
- Carry content hash for incremental rebuild decisions.

Chunk IDs must remain stable when unrelated documents change. Chunk identity
should not depend on vector provider IDs.

## 15. Chunking Strategy

V2 should replace whole-file embeddings with section-aware chunking.

Strategy:

- Prefer Markdown heading boundaries when available.
- Keep related heading content together when size allows.
- Split oversized sections into bounded chunks.
- Preserve heading context in each chunk.
- Avoid splitting code fences, tables, and structured lists where practical.
- Allow configurable chunk size and overlap.
- Use deterministic boundaries for stable IDs.

Phase 1 can introduce chunking while still using local Ollama and ChromaDB.
Whole-file indexing may remain as a compatibility mode for existing behavior.

Chunking quality goals:

- Improve retrieval precision for large architecture and roadmap documents.
- Keep context output readable.
- Make source attribution granular enough for future citations.
- Keep chunk count manageable for local embedding performance.

## 16. Stable ID Strategy

Stable IDs should solve the current collision risks and fragile core-ID behavior.

Document ID strategy:

- Use normalized relative path from the configured source root.
- Include source category to avoid collisions between docs and prompts.
- Preserve a migration map from legacy IDs such as `kb_01_project_overview`.
- Avoid absolute machine-specific paths in IDs.

Chunk ID strategy:

- Derive from document ID, section path, chunk index, and content boundary.
- Keep IDs stable when unrelated sections change.
- Use content hash as validation metadata, not the only identity.

Core context strategy:

- Core context should reference logical document roles, not only generated IDs.
- Examples of logical roles include project overview, architecture, database
  schema, frontend patterns, and roadmap.

Backward compatibility:

- V2 should recognize current legacy IDs during Phase 1.
- Legacy collection name `dailyflow` can remain available through configuration
  until a controlled migration is performed.

## 17. Versioning Strategy

V2 should version data models, build manifests, and provider outputs.

Versioned elements:

- document model version
- chunk model version
- metadata schema version
- embedding model name and dimension
- embedding provider version where available
- vector store schema version
- context output template version
- build manifest version

Versioning goals:

- Detect stale vector collections.
- Prevent mixing embeddings from incompatible models.
- Support non-destructive rebuilds.
- Make migration from local ChromaDB to Supabase pgvector auditable.
- Allow context generation to report which knowledge build produced the output.

## 18. Embedding Provider Interface

The embedding provider boundary abstracts text-to-vector conversion.

Responsibilities:

- Report provider identity.
- Report model identity and vector dimension.
- Check provider health.
- Embed single text inputs.
- Embed batches.
- Report retryable vs non-retryable failures.
- Surface rate limit or local-service-unavailable states.

Provider implementations:

- Local Ollama embedding provider for Phase 1.
- Future cloud embedding provider.
- Future test or in-memory provider for automated tests.

Rules:

- Build, query, and context workflows depend on the provider boundary.
- Workflows must not directly call Ollama-specific APIs.
- Provider output must include enough model metadata to validate vector store
  compatibility.

## 19. Vector Store Interface

The vector store boundary abstracts persistent vector search.

Responsibilities:

- Report store identity and schema version.
- Prepare or validate collections/tables.
- Store or upsert vector records.
- Delete stale vector records.
- Search by embedding and filters.
- Fetch records by stable IDs.
- Report collection/table statistics.
- Support non-destructive build strategies where possible.

Provider implementations:

- Local ChromaDB provider for Phase 1.
- Future Supabase pgvector provider.
- Future in-memory provider for tests.

Rules:

- Vector stores do not generate embeddings.
- Vector stores do not decide chunk boundaries.
- Vector stores do not render context output.
- Provider-specific distances must be normalized before user-facing reporting.

## 20. Future Cloud Provider Interface

Cloud providers should be introduced behind the same provider boundaries rather
than through workflow rewrites.

Cloud embedding provider responsibilities:

- Use configured cloud model.
- Authenticate through secure environment or secret management.
- Enforce request limits, retries, and timeout policy.
- Report embedding dimensions and model versions.

Cloud vector provider responsibilities:

- Store vectors and metadata in a managed service.
- Support project and future user scoping.
- Support upsert and delete by stable ID.
- Support vector search with metadata filters.
- Expose operational errors without leaking secrets.

Cloud migration constraints:

- No canonical docs should be moved to cloud storage by default.
- Cloud providers must be optional profiles.
- Local development must remain functional.
- Cloud credentials must not be required for Phase 1.

## 21. Future Supabase Vector Store

Supabase pgvector is the preferred future cloud vector store candidate.

Design responsibilities:

- Store chunk vectors in a dedicated table.
- Store metadata fields needed for source attribution and filtering.
- Store vector schema and embedding model metadata.
- Support project-level knowledge collections first.
- Support future user-level scoping only after privacy and access policies are
  designed.

Required future decisions:

- Table schema and indexes.
- Vector dimensions per embedding model.
- RPC or SQL search function shape.
- Row-level security strategy.
- Service-role vs client access boundaries.
- Migration and rebuild process.
- Retention and deletion policy.

Migration posture:

- Supabase pgvector should be introduced as a new vector store provider.
- ChromaDB should remain available until parity is verified.
- A manifest comparison should verify that local and Supabase builds index the
  same logical documents and chunks.

## 22. Migration Strategy

Migration should be incremental and reversible.

Phase 1: local compatibility foundation

- Keep Markdown, Ollama, ChromaDB, query, and context loader working.
- Introduce architecture boundaries and configuration.
- Add manifest and stable IDs.
- Add tests around current behavior.

Phase 2: retrieval quality

- Add chunking.
- Preserve whole-document compatibility mode.
- Add source attribution to query and context output.
- Add incremental rebuild using hashes.

Phase 3: provider abstraction parity

- Move workflows to embedding and vector store boundaries.
- Keep Ollama and ChromaDB as default providers.
- Add in-memory providers for tests.

Phase 4: optional cloud providers

- Add cloud embedding provider profile.
- Add Supabase pgvector provider profile.
- Compare local and cloud retrieval behavior.
- Keep local fallback available.

Phase 5: cloud operational readiness

- Add access control, monitoring, migration tooling, and privacy review.
- Decide whether cloud vectors are project-global or user-scoped.
- Add operational runbooks.

## 23. Testing Strategy

V2 should be testable without Ollama, ChromaDB, or cloud services.

Test categories:

- Document loading tests:
  - source discovery
  - inclusion and exclusion rules
  - generated-file exclusion

- ID strategy tests:
  - stable document IDs
  - stable chunk IDs
  - collision prevention
  - legacy ID compatibility

- Chunking tests:
  - heading-aware splits
  - oversized section splits
  - code fence preservation
  - deterministic boundaries

- Metadata tests:
  - required fields
  - no raw secret metadata
  - schema version presence

- Provider contract tests:
  - embedding provider health states
  - vector store upsert/search behavior
  - in-memory provider parity

- Pipeline tests:
  - build pipeline with fake providers
  - query pipeline with fake providers
  - context generation output shape

- Compatibility tests:
  - local ChromaDB profile still works
  - legacy collection and IDs remain readable during Phase 1

## 24. Error Handling Strategy

Error handling should be explicit and workflow-specific.

Build errors:

- Fail clearly when required source roots are missing.
- Fail clearly when embedding provider is unavailable.
- Avoid deleting a working collection before replacement data is ready.
- Report partial failures with affected source IDs.

Query errors:

- Return clear provider-unavailable messages.
- Validate result limits before retrieval.
- Distinguish empty index from no matching results.

Context generation errors:

- Report missing core sources.
- Avoid writing incomplete context unless explicitly allowed.
- Keep generated output writes atomic where practical.

Provider errors:

- Classify unavailable, unauthorized, rate-limited, incompatible-dimension, and
  malformed-response states.
- Avoid leaking secrets or full request payloads in error output.

## 25. Logging Strategy

Logging should make the local workflow understandable without coupling logic to
terminal formatting.

Logging categories:

- configuration summary
- provider health
- source discovery
- chunking summary
- embedding progress
- vector store write progress
- query summary
- context output summary
- warnings and recoverable errors

Logging rules:

- Keep logs free of secrets.
- Keep raw document bodies out of operational logs.
- Support human-readable terminal output.
- Allow future structured logs for CI or cloud workflows.
- Normalize SmartFlow naming while preserving legacy collection compatibility in
  technical fields.

## 26. Performance Strategy

Performance improvements should preserve local usability.

Build performance:

- Use batching for embeddings and vector writes.
- Use content hashes to skip unchanged chunks.
- Avoid full destructive rebuilds when incremental updates are available.
- Keep chunk sizes bounded to avoid poor embedding quality.

Query performance:

- Use metadata filters for source type or core context mode.
- Limit result counts through configuration.
- Normalize and rank results after provider retrieval.

Context performance:

- Enforce output size limits.
- Prefer already-retrieved chunk metadata over re-reading all sources when safe.
- Keep fixed core context generation deterministic.

Provider performance:

- Use local providers by default for offline development.
- Support provider-specific batch limits through configuration.
- Prepare for rate limiting in cloud embedding profiles.

## 27. Security Considerations

Security is primarily about avoiding accidental indexing or disclosure of
sensitive information.

Rules:

- Generated context is an output and may be pasted into third-party AI tools.
- Secrets, credentials, `.env` files, database dumps, and private runtime data
  must not be indexed.
- Source inclusion must be explicit.
- Exclusion rules must cover generated outputs and dependency directories.
- Metadata must avoid sensitive raw content.
- Cloud providers must require explicit configuration.
- Cloud credentials must live outside source-controlled docs.
- Future Supabase access must define RLS and service boundaries before use.

Privacy posture:

- Phase 1 indexes project knowledge only.
- User personal data from the SmartFlow app is out of scope.
- Future multi-user knowledge support requires a separate privacy design.

## 28. Future Multi-user Support

V2 should not implement multi-user behavior in Phase 1, but it should avoid
blocking it.

Future requirements:

- Project-level knowledge collections.
- Optional user-level or workspace-level collections.
- Clear ownership metadata.
- Access control per collection or record.
- Separate source registries by tenant or project.
- Deletion and retention policy.
- Auditability for cloud indexing.

Design constraints:

- Do not mix project documentation with personal user memory.
- Do not assume a single global collection forever.
- Keep provider boundaries able to accept scope metadata later.

## 29. Extension Points

Planned extension points:

- Additional source loaders:
  - Markdown
  - future ADR-only loaders
  - future exported docs
  - future issue or changelog loaders

- Additional embedding providers:
  - local Ollama
  - cloud embedding APIs
  - test providers

- Additional vector stores:
  - local ChromaDB
  - Supabase pgvector
  - in-memory test store

- Additional output renderers:
  - Markdown context output
  - terminal query output
  - future JSON retrieval reports

- Additional maintenance tools:
  - manifest diff
  - stale index report
  - source validation
  - secret scan
  - provider health check

Extension rules:

- New providers must implement the same provider boundaries.
- New loaders must produce the same document model.
- New renderers must consume retrieved chunks and metadata, not call providers
  directly.

## 30. Risks

Architecture risks:

- Provider abstraction can become too complex for a small local workflow.
- Chunking can reduce context quality if boundaries are too small or lose
  heading context.
- Stable ID migration can break fixed core context if not backward compatible.
- Legacy DailyFlow collection naming can confuse contributors during migration.

Operational risks:

- Ollama remains a local dependency in Phase 1.
- ChromaDB remains the local vector store in Phase 1.
- Full rebuild behavior can remain risky until staged or incremental rebuilds
  are introduced.
- Cloud providers can introduce rate limits, cost, and credential handling
  requirements.

Data risks:

- Prompt indexing may include files that are useful but not canonical project
  status.
- Generated context can expose broad project context to external AI tools.
- Metadata may accidentally become too verbose if not governed.

Migration risks:

- Supabase pgvector requires schema, RLS, and operational decisions before use.
- Embedding dimension changes require collection rebuilds.
- Mixed local/cloud embeddings can produce inconsistent retrieval quality.

Mitigations:

- Keep local Phase 1 compatibility as the default profile.
- Add tests before provider migration.
- Add manifests and version checks before cloud storage.
- Keep canonical knowledge in `.knowledge/docs/`.
- Treat generated context and vector stores as replaceable outputs.

## Design Conclusion

Knowledge Engine V2 should evolve the current local scripts into a provider-based
architecture without disrupting the working local flow. The most important
design change is not cloud migration itself; it is establishing boundaries:
sources, documents, chunks, embeddings, vector storage, retrieval, and context
composition must be separate responsibilities.

With these boundaries in place, SmartFlow can keep using Markdown, Ollama, and
ChromaDB locally while preparing for Supabase pgvector, cloud embeddings,
incremental builds, better tests, and future multi-user knowledge support.
