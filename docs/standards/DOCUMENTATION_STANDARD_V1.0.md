# Documentation Standard v1.0

**Version:** 1.0  
**Status:** Official Standard  
**Applies To:** All current and future software projects

---

# 1. Purpose

This document defines the official documentation standard for all projects. Its goals are:

- Consistency
- Simplicity
- Long-term stability
- AI-friendly organization
- Easy maintenance

---

# 2. Scope

This standard applies to:

- SmartFlow
- Smart Academy
- Future projects
- Human contributors
- Codex
- Claude Code
- ChatGPT GPTs
- Future AI agents

---

# 3. Core Principles

- Documentation is part of the product.
- Every document has one clear responsibility.
- Prefer updating existing documentation over creating duplicates.
- Keep the documentation structure stable.
- Separate Architecture, Design, AI, Decisions and Standards.
- Major structural changes require an ADR.

---

# 4. Repository Root

Keep only important project-wide files in the repository root.

Recommended files:

- README.md
- PROJECT_STATUS.md
- CLAUDE.md

Optional:

- MASTER_CONTEXT.md
- CLAUDE_CONTEXT.md
- AUDIT_REPORT.md
- DEPLOYMENT_CHECKLIST.md

---

# 5. Documentation Structure

```
docs/
├── overview/
├── architecture/
├── design/
├── ai/
├── decisions/
├── standards/
├── testing/
├── roadmap/
└── reference/
```

This structure is the official documentation standard and should remain stable.

---

# 6. Folder Responsibilities

## overview

Project overview, goals, vision, glossary and high-level concepts.

## architecture

System architecture, frontend, backend, database, deployment and technical design.

## design

UI, UX, prototypes, wireframes, design system and visual concepts.

## ai

Agent systems, Memory, RAG, Prompting, Knowledge Engine, Personalization, Recommendation and AI architecture.

## decisions

Architecture Decision Records (ADR) and major project decisions.

## standards

Official project standards such as Coding, Documentation, Naming, UI, Content and Prompt standards.

## testing

Testing strategy, QA, validation, regression and acceptance criteria.

## roadmap

Current roadmap, milestones and future plans.

## reference

Research, external documentation, glossary and supporting references.

---

# 7. Naming Rules

Folders:

- lowercase
- descriptive
- no spaces

Files:

- kebab-case preferred
- meaningful names
- Markdown (.md)

---

# 8. Writing Rules

Every document should clearly state:

- Purpose
- Scope
- Main Content
- References (if applicable)

Avoid duplicated content.

Use links instead of copying information.

Keep documents concise and up to date.

---

# 9. Architecture Documents

Architecture documents should describe:

- Responsibilities
- Boundaries
- Dependencies
- Data Flow
- Contracts

Do not mix implementation details with architecture.

---

# 10. AI Documents

AI documentation belongs only inside `docs/ai`.

Document:

- Purpose
- Inputs
- Outputs
- Components
- Risks
- Future improvements

---

# 11. ADR Rules

Every major architectural decision should include:

- Context
- Decision
- Alternatives
- Consequences
- Status

---

# 12. Standards

Standards define reusable project rules.

Examples:

- Coding Standard
- Documentation Standard
- Naming Standard
- Prompt Standard
- UI Standard
- Content Standard

---

# 13. Testing Documentation

Testing documents should describe:

- Strategy
- Test types
- Validation
- Regression policy
- Acceptance criteria

---

# 14. Roadmap

Roadmap documents describe future direction rather than implementation details.

---

# 15. Project Status

`PROJECT_STATUS.md` remains in the repository root.

It represents the current state of the project and should be updated after significant milestones.

---

# 16. AI Compatibility

This documentation structure is designed for:

- Developers
- ChatGPT
- Claude Code
- Codex
- AI Agents

Documentation should always be understandable by both humans and AI systems.

---

# 17. Change Policy

Do not create new top-level documentation folders unless absolutely necessary.

Prefer extending the existing structure.

Major documentation structure changes require an ADR.

---

# 18. Documentation Review Checklist

Before merging documentation:

- Correct folder
- Correct title
- No duplication
- Links verified
- Naming follows the standard
- PROJECT_STATUS updated if needed

---

# Summary

This document establishes the permanent documentation standard for all projects.

The structure is intentionally simple, scalable and stable. Future documentation should grow within this standard instead of introducing new top-level folders.
