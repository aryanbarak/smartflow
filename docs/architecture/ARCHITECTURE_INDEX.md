# SmartFlow Architecture

Version: 1.0

---

# Purpose

This directory contains the canonical technical architecture of the SmartFlow project.

Documents in this folder define the overall system structure, module boundaries, data flow, component responsibilities, and architectural principles.

This folder represents the single source of truth for SmartFlow architecture.

---

# Contents

Typical documents include:

- Architecture Baseline
- System Architecture
- Workspace Architecture
- Agent Architecture
- AI Architecture
- Database Architecture
- API Architecture
- Deployment Architecture
- Security Architecture

---

# Current Documents

- 01-architecture-baseline.md
- Root status: ../../PROJECT_STATUS.md
- Current generated knowledge source: ../../.knowledge/docs/02_architecture.md

`01-architecture-baseline.md` captures the early stabilization baseline.
`PROJECT_STATUS.md` and `.knowledge/docs/02_architecture.md` describe the
current implemented workspace and agent architecture.

---

# Documentation Rules

- Architecture documents describe long-term system design.
- They should avoid implementation-specific details whenever possible.
- Significant architectural changes must be accompanied by an ADR in:

```
docs/decisions/adr/
```

- Every architecture document should reference related standards when applicable.

---

# Related Documentation

Project Overview

```
docs/overview/
```

AI Architecture

```
docs/ai/
```

Architecture Decisions

```
docs/decisions/
```

Project Standards

```
docs/standards/
```

Roadmap

```
docs/roadmap/
```

---

End of Document
