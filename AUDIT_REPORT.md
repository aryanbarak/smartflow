# dailyFlow — Cleanup Audit Report

**Date:** 2026-05-30
**Branch:** `cleanup/audit-2026-05-30`
**Scope:** Full project scan — docs, source files, dependencies, config, migrations
**Action:** Report only — nothing deleted yet

---

## Summary

| Category | Items Found | DELETE | KEEP | REVIEW |
|----------|-------------|--------|------|--------|
| Outdated/redundant docs | 9 | 7 | 1 | 1 |
| Unused source files (ts/tsx) | 4 | 2 | 0 | 2 |
| Unused UI components (ui/) | 12 | 0 | 0 | 12 |
| Unused hook exports | 2 | 0 | 1 | 1 |
| Unused npm packages | 11 | 0 | 0 | 11 |
| Root junk/temp files | 9 | 9 | 0 | 0 |
| Migration conflicts | 2 | 0 | 2 | 1 |

---

## 1. Markdown / Documentation Files

### 1.1 Root Planning Files (were source documents for .prompts/ and .knowledge/)

| File | Recommendation | Reason |
|------|---------------|--------|
| `dailyflow_phase1_revised.md` | **DELETE** | Persian planning doc for Phase 1 Ollama setup. Fully superseded — content is now in `.knowledge/docs/` and `.knowledge/راهنما.md`. Left over in root after implementation. |
| `dailyflow_prompt_discipline.md` | **DELETE** | Source plan document that was used to generate `.prompts/` library. The actual files now live in `.prompts/`. Keeping the source doc adds confusion. |
| `dailyflow_prompt_extension.md` | **DELETE** | Same as above — source plan for the debugging/deployment/testing prompts in `.prompts/`. Already implemented. |

### 1.2 Deployment Docs (partially superseded by CLAUDE_CONTEXT.md + .prompts/deployment/)

| File | Recommendation | Reason |
|------|---------------|--------|
| `DEPLOYMENT_CHECKLIST.md` | **REVIEW** | May still contain useful deployment steps not in `.prompts/deployment/cloudflare-pages.md`. Read before deleting. |
| `DEPLOYMENT_QUICKSTART.md` | **DELETE** | Quick reference guide for an old deployment setup (pre-Cloudflare). References SSH/EC2 infrastructure that no longer exists. |
| `DEPLOYMENT_SETUP.md` | **DELETE** | Detailed setup doc for the old EC2/SSH deployment pipeline. Entirely superseded by the current Cloudflare Pages workflow described in `CLAUDE_CONTEXT.md §7` and `.prompts/deployment/`. |

### 1.3 Other Root Docs

| File | Recommendation | Reason |
|------|---------------|--------|
| `verify-secrets.md` | **DELETE** | References SSH secrets (`SSH_HOST`, `SSH_USER`, `SSH_PORT`, `SSH_PRIVATE_KEY_B64`) and an EC2 IP address. This infrastructure was abandoned. The current deployment uses Cloudflare Pages with no SSH. Dangerously misleading if referenced during a deploy incident. |
| `PROJECT_REPORT.md` | **DELETE** | Generated 2026-05-23 as a one-time project snapshot. Now 7 days old and significantly out of date (Settings page, i18n, Knowledge Base, and .prompts/ library are all missing). `CLAUDE_CONTEXT.md` serves this purpose and is kept up to date. |
| `README.md` | **KEEP** | Brief, accurate (2 lines + live URL). Fine as-is. |
| `PROJECT_STATUS.md` | **KEEP** | Actively maintained tracking file with known bugs, decisions, next priorities, and blocked tasks. Useful and current. |
| `CLAUDE_CONTEXT.md` | **KEEP** | Primary technical context file, kept in sync. The authoritative project reference. |

---

## 2. Source Files (ts/tsx) — Unused or Redundant

### 2.1 Unused Page Component

**`src/pages/Index.tsx`** — **DELETE**

```typescript
// Full content of the file:
import Dashboard from "./Dashboard";
const Index = () => {
  return <Dashboard />;
};
export default Index;
```

- Never imported in `App.tsx` or anywhere else in the project.
- `App.tsx` imports `Dashboard` directly on line 9 and routes it to `/`.
- This is a leftover from a Lovable.dev scaffold that auto-generates an `Index.tsx` wrapper. It has no purpose.

### 2.2 Empty / Stub File

**`src/lib/supabaseClient.ts`** — **DELETE**

- File contains exactly 1 blank line. Completely empty.
- No source file in `src/` imports from `@/lib/supabaseClient`.
- The real Supabase client lives at `src/integrations/supabase/client.ts` (hardcoded URL + key).
- This stub was likely a placeholder that was replaced early in development and never removed.

### 2.3 Unused Hook — No Consumers

**`src/hooks/useApiKeys.ts`** — **REVIEW**

- `grep` of entire `src/` directory finds zero files importing `useApiKeys`.
- The corresponding Supabase table (`user_api_keys`) was created in migration `20251224004500_ae7167fc-e847-4b9e-b9f6-c5af1c6412a3.sql`.
- The `src/integrations/supabase/types.ts` references the table schema.
- **Decision needed:** Is API key management a planned feature or abandoned? If abandoned → DELETE the hook + migration. If planned → KEEP and add to roadmap.

### 2.4 Unused Component — No Consumers

**`src/components/NavLink.tsx`** — **REVIEW**

- A styled wrapper around React Router's `NavLink`.
- `grep` for `from "@/components/NavLink"` across all `src/` files returns **zero results**.
- `Sidebar.tsx` and `MobileNav.tsx` import `NavLink` directly from `react-router-dom`, not from this file.
- Likely created early and then bypassed when layout components were built.
- **Recommendation:** Confirm no usage, then DELETE.

---

## 3. Unused UI Components (`src/components/ui/`)

These 12 Radix UI / third-party wrapper components exist in `src/components/ui/` but are never imported by any page, feature, hook, or layout component outside of `ui/` itself. They were installed as part of the standard shadcn/ui scaffold.

| Component File | Underlying Package | Imported by any app code? |
|----------------|--------------------|--------------------------|
| `accordion.tsx` | `@radix-ui/react-accordion` | No |
| `aspect-ratio.tsx` | `@radix-ui/react-aspect-ratio` | No |
| `carousel.tsx` | `embla-carousel-react` | No |
| `context-menu.tsx` | `@radix-ui/react-context-menu` | No |
| `drawer.tsx` | `vaul` | No |
| `hover-card.tsx` | `@radix-ui/react-hover-card` | No |
| `input-otp.tsx` | `input-otp` | No |
| `menubar.tsx` | `@radix-ui/react-menubar` | No |
| `navigation-menu.tsx` | `@radix-ui/react-navigation-menu` | No |
| `radio-group.tsx` | `@radix-ui/react-radio-group` | No |
| `resizable.tsx` | `react-resizable-panels` | No |
| `toggle-group.tsx` | `@radix-ui/react-toggle-group` | No |

**In use (confirmed):**
- `avatar.tsx` → imported by `src/pages/FamilyPage.tsx`
- `slider.tsx` → imported by `src/components/music/MiniPlayer.tsx`

**Recommendation: REVIEW** — Deleting these files would let you safely remove 11 npm packages (see §5). However, shadcn/ui components are standard scaffolding and low overhead. If the project might use any of these in upcoming features (e.g., `accordion` for FAQ, `radio-group` for form inputs), keep them. Otherwise removing them trims ~350 KB from `node_modules`.

---

## 4. Exports / Hooks with Limited or No External Usage

### 4.1 `src/hooks/usePreferences.ts` — **KEEP (but note partial duplication)**

- Currently imported **only** by `src/pages/SettingsPage.tsx`.
- Its `language` field is now **duplicated** by `useAppearance()` in `appearanceStore.ts`.
  - `SettingsPage.tsx` was updated to use `appearance.language` / `appearance.setLanguage` for the language selector.
  - `usePreferences` is still called for `theme` (set via `next-themes`) and `currency`.
- **Not a cleanup candidate yet** — it still serves the `currency` preference which has no home in `appearanceStore`.
- **Future action:** Move `currency` into `appearanceStore`, then delete `usePreferences` entirely.

### 4.2 `src/hooks/useApiKeys.ts` — See §2.3 above.

---

## 5. npm Dependencies Not Used in Source Code

### 5.1 Unused Radix UI Packages (correspond to unused UI components in §3)

All 12 packages below are installed in `package.json` but their corresponding UI components are never imported in application code. Removing them requires also deleting the `ui/` wrapper files in §3.

| Package | Version | Linked UI File |
|---------|---------|---------------|
| `@radix-ui/react-accordion` | (latest) | `ui/accordion.tsx` |
| `@radix-ui/react-aspect-ratio` | (latest) | `ui/aspect-ratio.tsx` |
| `@radix-ui/react-context-menu` | (latest) | `ui/context-menu.tsx` |
| `@radix-ui/react-hover-card` | (latest) | `ui/hover-card.tsx` |
| `@radix-ui/react-menubar` | (latest) | `ui/menubar.tsx` |
| `@radix-ui/react-navigation-menu` | (latest) | `ui/navigation-menu.tsx` |
| `@radix-ui/react-radio-group` | (latest) | `ui/radio-group.tsx` |
| `@radix-ui/react-toggle-group` | (latest) | `ui/toggle-group.tsx` |
| `embla-carousel-react` | 8.6.0 | `ui/carousel.tsx` |
| `vaul` | 0.9.9 | `ui/drawer.tsx` |
| `input-otp` | 1.4.2 | `ui/input-otp.tsx` |
| `react-resizable-panels` | 2.1.9 | `ui/resizable.tsx` |

**Recommendation: REVIEW** — These are safe to remove as a group. Removing all 12 packages + their wrapper components would measurably reduce `node_modules` size. Do only if no upcoming features will use them.

### 5.2 DevDependency — `lovable-tagger`

| Package | Version | Purpose |
|---------|---------|---------|
| `lovable-tagger` | 1.1.13 | Lovable.dev platform component tagging (used in `vite.config.ts` dev mode only) |

**Recommendation: KEEP** — Only active in `NODE_ENV=development` via `componentTagger()` in `vite.config.ts`. Has zero production bundle impact. Remove only if you want to cleanly separate from the Lovable.dev platform.

---

## 6. Root Junk / Temp Files

These files in the project root have no role in the codebase, build, or deployment. They are artefacts from earlier development phases.

| File | Recommendation | Reason |
|------|---------------|--------|
| `test-api.json` | **DELETE** | Test data file. Not referenced in any source file or script. |
| `test-persian.json` | **DELETE** | Test data file for Persian text testing. Not referenced anywhere. |
| `test-production.json` | **DELETE** | Test data file. Not referenced anywhere. |
| `dailyflow-dist.zip` | **DELETE** | Old distribution archive. Build artifacts should not be committed to git. |
| `dist.zip` | **DELETE** | Same — old build artifact. |
| `git-push-deployment.bat` | **DELETE** | Old Windows batch script for manual EC2/SSH deployment. The entire deployment pipeline was replaced by Cloudflare Pages + GitHub Actions. |
| `test-deploy.bat` | **DELETE** | Old test deploy script, same era as `git-push-deployment.bat`. |
| `nginx-default.conf` | **DELETE** | Nginx configuration for the old EC2 server. No longer applies — the app runs on Cloudflare Pages (no nginx). |
| `screenshot.png` | **REVIEW** | App screenshot. Could be used for README or documentation, but currently not referenced. Delete if not intentional. |

---

## 7. Migration Files

### 7.1 All 19 Migrations Are Active

All migrations in `supabase/migrations/` correspond to tables that exist in the codebase:

| Migration | Tables Created | Status |
|-----------|----------------|--------|
| `20251224004500_ae7167fc-...` | `user_api_keys` | ⚠️ See below |
| `20251224070000_create_tasks.sql` | `tasks` (v1) | ⚠️ Superseded |
| `20251225090000_create_profiles.sql` | `profiles` | ✅ Active |
| `20251225100000_create_documents_bucket.sql` | Storage bucket | ✅ Active |
| `20251225110000_create_documents_table.sql` | `documents` | ✅ Active |
| `20260504000000_create_dashboard_tables.sql` | `tasks` (v2), `finance_transactions`, `family_children` | ⚠️ See below |
| `20260523000000_create_calendar_events.sql` | `calendar_events` | ✅ Active |
| `20260524000000_create_photos.sql` | `photos` | ✅ Active |
| `20260525000000_add_photo_location.sql` | adds location to photos | ✅ Active |
| `20260526000000_create_family_hub.sql` | Family hub tables | ✅ Active |
| `20260527000000_add_role_to_family.sql` | adds role column | ✅ Active |
| `20260528000001_habit_tracker.sql` | `habits`, `habit_completions` | ✅ Active |
| `20260528000002_budget_goals.sql` | `budget_goals` | ✅ Active |
| `20260528000003_journal.sql` | `journal_entries` | ✅ Active |
| `20260528000004_recurring.sql` | adds recurrence columns | ✅ Active |
| `20260528000005_links_enhanced.sql` | `links` + enhancements | ✅ Active |
| `20260528000006_mood_tracker.sql` | `mood_logs` | ✅ Active |
| `20260528000007_flashcards.sql` | `flashcard_decks`, `flashcards` | ✅ Active |
| `20260528000008_shopping_list.sql` | `shopping_items` | ✅ Active |

### 7.2 Potential Conflicts

**`20251224070000_create_tasks.sql` vs `20260504000000_create_dashboard_tables.sql`**
- Both create or recreate the `tasks` table.
- The later migration uses `CREATE TABLE IF NOT EXISTS` which is safe.
- However, the earlier migration may have created the table without recurrence columns that were added later.
- **Recommendation: KEEP both** — migrations are run in order; the `IF NOT EXISTS` guard prevents conflicts. No action needed.

**`20251224004500_ae7167fc-e847-4b9e-b9f6-c5af1c6412a3.sql` — `user_api_keys` table**
- Creates a `user_api_keys` table (encrypted API key storage per user).
- `src/hooks/useApiKeys.ts` exists but is **never imported** by any component.
- `src/integrations/supabase/types.ts` includes the type definition for this table.
- **Recommendation: REVIEW** — This table may be live in Supabase already. If the feature is not being built, add a cleanup migration to drop it. If it is planned, keep the migration and add the feature to the roadmap.

---

## 8. Config Files

All config files are standard and expected:

| File | Status |
|------|--------|
| `vite.config.ts` | ✅ Active — PWA, chunk splitting, dev proxy |
| `tsconfig.json`, `tsconfig.app.json`, `tsconfig.node.json` | ✅ Active — standard Vite TS split |
| `tailwind.config.ts` | ✅ Active |
| `postcss.config.js` | ✅ Active |
| `eslint.config.js` | ✅ Active |
| `components.json` | ✅ Active — shadcn/ui config |
| `.gitignore` | ✅ Active — updated with .knowledge/ entries |
| `.env`, `.env.local`, `.env.production` | ✅ Active — but `.env` should never be committed |

**Note on `.env`:** Verify `.env` is listed in `.gitignore`. If it contains real credentials and was ever committed, rotate those credentials.

---

## Recommended Cleanup Actions (Prioritized)

### Priority 1 — Safe, No Code Impact (DELETE immediately)

```
# Root junk files
dailyflow-dist.zip
dist.zip
git-push-deployment.bat
test-deploy.bat
nginx-default.conf
test-api.json
test-persian.json
test-production.json

# Outdated planning docs
dailyflow_phase1_revised.md
dailyflow_prompt_discipline.md
dailyflow_prompt_extension.md
verify-secrets.md
PROJECT_REPORT.md
DEPLOYMENT_SETUP.md
DEPLOYMENT_QUICKSTART.md
```

### Priority 2 — Dead Code (DELETE after confirming)

```
src/pages/Index.tsx         # empty wrapper, never imported
src/lib/supabaseClient.ts   # empty file, never imported
```

### Priority 3 — Needs Decision Before Acting

```
src/components/NavLink.tsx  # unused component — confirm then delete
src/hooks/useApiKeys.ts     # no consumers — is API key feature planned?
supabase/migrations/20251224004500_ae7167fc...  # user_api_keys table — feature abandoned?
```

### Priority 4 — Batch Cleanup (remove as a group if committed to no usage)

```
# 12 unused UI components + their npm packages
src/components/ui/accordion.tsx        + @radix-ui/react-accordion
src/components/ui/aspect-ratio.tsx     + @radix-ui/react-aspect-ratio
src/components/ui/carousel.tsx         + embla-carousel-react
src/components/ui/context-menu.tsx     + @radix-ui/react-context-menu
src/components/ui/drawer.tsx           + vaul
src/components/ui/hover-card.tsx       + @radix-ui/react-hover-card
src/components/ui/input-otp.tsx        + input-otp
src/components/ui/menubar.tsx          + @radix-ui/react-menubar
src/components/ui/navigation-menu.tsx  + @radix-ui/react-navigation-menu
src/components/ui/radio-group.tsx      + @radix-ui/react-radio-group
src/components/ui/resizable.tsx        + react-resizable-panels
src/components/ui/toggle-group.tsx     + @radix-ui/react-toggle-group
```

### Priority 5 — Future Refactor (not urgent)

```
src/hooks/usePreferences.ts
  → Move currency into appearanceStore, then delete this hook
  → Already partially superseded (language moved to appearanceStore)
```

---

## What Is NOT Flagged (Confirmed Clean)

- All 21 routed pages in `App.tsx` — all imported and used
- All 19 supabase migrations — all correspond to active tables (with noted caveats)
- All feature services (`*Service.ts`) — all imported by their respective hooks
- All layout components (`Sidebar`, `MobileNav`, `AppLayout`) — actively used
- Core UI components: `button`, `dialog`, `sheet`, `tabs`, `card`, `input`, `select`, `toast`, `badge`, `calendar`, `form`, `skeleton`, etc. — all imported in multiple places
- `.prompts/` library (24 files) — reference docs, appropriate in repo
- `.knowledge/` (8 docs + 5 scripts) — RAG infrastructure, appropriate in repo
- `CLAUDE_CONTEXT.md`, `PROJECT_STATUS.md`, `README.md` — all current and useful
