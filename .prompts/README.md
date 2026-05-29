# dailyFlow Prompt Library

Structured prompts for local AI (Ollama + Continue.dev) development.

## Usage in Continue.dev

### Option 1: Copy-paste into chat

Open the .md file, copy content, paste in Continue (Ctrl+L)

### Option 2: Use as slash command

In ~/.continue/config.json, reference prompt files:
(check docs.continue.dev for current file-based prompt syntax)

### Option 3: Use @file context

In Continue chat: @.prompts/system/dailyflow-context.md

## When to Use What

| Situation | Prompt |
| --------- | ------ |
| Starting a new feature | templates/new-feature.md |
| Writing a Supabase service | templates/supabase-service.md |
| Writing a React Query hook | templates/react-query-hook.md |
| Adding a new page | templates/new-page.md |
| Reviewing code before commit | review/code-review.md |
| Security check before deploy | review/security-review.md |
| Performance check | review/performance-review.md |
| Cleaning up a messy component | refactor/component-refactor.md |
| Cleaning up a service | refactor/service-refactor.md |
| Cleaning up a hook | refactor/hook-refactor.md |
| IHK exam topic | templates/ihk-explain.md |
| React Query data issues | debugging/react-query-debug.md |
| Supabase RLS or auth errors | debugging/supabase-debug.md |
| TypeScript compiler errors | debugging/typescript-debug.md |
| Deploy to Cloudflare Pages | deployment/cloudflare-pages.md |
| Update AI Worker | deployment/cloudflare-worker.md |
| Add new DB table | deployment/supabase-migration.md |
| Write a unit test | testing/unit-test.md |
| Write an integration test | testing/integration-test.md |
| Write an E2E test | testing/e2e-test.md |

## Maintenance

- Update system/dailyflow-context.md when adding new features or tables
- Update system/supabase-patterns.md when adding new tables or patterns
- These prompts are part of the codebase — commit them with git
