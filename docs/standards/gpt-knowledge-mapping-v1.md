# GPT Knowledge Mapping v1

## 1. Purpose

This standard defines how SmartFlow repository documentation should be mapped to version-controlled Custom GPT assistant configurations.

It prevents duplicated documentation, unsafe uploads and stale assistant knowledge.

## 2. Scope

This standard applies to:

- `assistants/smartflow-system-architect/`
- `assistants/smartflow-agent-engineer/`
- `assistants/smartflow-qa-audit/`
- future SmartFlow assistant manifests

It does not move or replace canonical documentation.

## 3. Shared Baseline Knowledge

The shared baseline documents are:

- `README.md`
- `PROJECT_STATUS.md`
- `docs/README.md`

`MASTER_CONTEXT.md` and `CLAUDE_CONTEXT.md` are shared only where full-system context is needed.

`docs/standards/DOCUMENTATION_STANDARD_V1.0.md` is shared when documentation behavior matters.

## 4. Assistant-Specific Knowledge

Knowledge must be assigned by role responsibility, not uploaded to every GPT automatically.

| Assistant | Required Focus | Typical Knowledge |
| --- | --- | --- |
| SmartFlow System Architect | architecture, boundaries, contracts, migration planning | project status, ADRs, architecture docs, AI architecture docs, standards |
| SmartFlow Agent Engineer | agent implementation, execution policy, handlers, approval, typed results | project status, architecture docs, AI docs, standards, testing docs |
| SmartFlow QA & Audit | requirement coverage, safety, regression and merge readiness | project status, audit reports, ADRs, architecture docs, testing docs, standards |

## 5. Excluded Files

Do not upload:

- `.env` files
- secrets or credentials
- generated output
- `node_modules/`
- `dist/`
- `coverage/`
- package lockfiles
- `.knowledge/context_output.md`

`.knowledge/` is an operational Knowledge Engine source and must not be copied into `assistants/`.

`.prompts/` is an operational prompt library and must not be copied into `assistants/`.

Specific files from `.knowledge/` or `.prompts/` may only be uploaded manually when explicitly approved and necessary.

## 6. Upload Workflow

1. Review the assistant's `knowledge.md` manifest.
2. Confirm every concrete path exists.
3. Upload only the listed canonical documents.
4. Do not upload the manifest itself.
5. Do not copy document contents into the assistant directory.
6. Record the update in the assistant's `changelog.md`.
7. Update `Last Verified` after re-verification.

## 7. Update Workflow

When a source document changes materially:

1. Identify which assistant role depends on that source.
2. Re-upload the changed document manually to the related GPT Knowledge.
3. Update the assistant manifest if the relevant source set changed.
4. Record the change in `changelog.md`.

Material changes include architecture milestones, ADRs, standards, execution policy, approval policy, testing requirements and current project status.

## 8. Freshness Rules

- `PROJECT_STATUS.md` is the current-state authority.
- Approved ADRs take precedence over older design assumptions.
- Knowledge manifests must be reviewed after major milestones.
- New documents must be assigned by role responsibility.
- Stale files should be removed from GPT Knowledge when they are no longer canonical.

## 9. Conflict Resolution

When documents conflict:

1. Prefer `PROJECT_STATUS.md` for current implementation state.
2. Prefer approved ADRs for architectural decisions.
3. Prefer official standards for documentation and process behavior.
4. Treat older context files as supporting evidence, not final authority.
5. If conflict remains, mark it as unresolved instead of guessing.

## 10. Security Rules

- Never upload secrets, credentials, `.env` files or private tokens.
- Never upload generated dependency or build output.
- Prefer canonical documents over copied summaries.
- Do not upload source code unless a specific assistant task requires implementation review.
- Do not upload operational generated context as a substitute for source documents.

## 11. Review Checklist

Before updating GPT Knowledge:

- Every listed path exists.
- No generated files are included.
- No secrets are included.
- No whole folder is listed blindly.
- The assistant role genuinely needs each document.
- `PROJECT_STATUS.md` is included where current state matters.
- Relevant ADRs are included where architecture decisions matter.
- `Last Verified` is current.
- The assistant `changelog.md` records the update.
