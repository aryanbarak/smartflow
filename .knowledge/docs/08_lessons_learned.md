# smartFlow — Lessons Learned

## Technical Decisions & Why

### Supabase Credentials Hardcoded
Problem: GitHub secrets with wrong/truncated values broke auth repeatedly.
Solution: Hardcode public URL + anon key directly in client.ts.
Rule: NEVER add VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY to GitHub secrets.
The anon key is a public credential — RLS enforces data isolation.

### PWA Service Worker
Problem: SW "non-precached-url" crash on page navigation (/tasks, /calendar, etc.).
Solution: Set `navigateFallback: null` in vite-plugin-pwa config.
Rule: Never cache index.html or Supabase API calls in the service worker.

### Calendar: localStorage → Supabase
Problem: Data lost between devices.
Solution: Supabase as primary + localStorage as offline fallback.
Pattern: Always provide offline fallback for critical data.

### Intel Arc 140V GPU with Ollama
Problem: Ollama defaulted to CPU (slower inference).
Solution: OLLAMA_VULKAN=1 environment variable enables iGPU acceleration.
Result: ~14.5 t/s vs ~13 t/s on CPU — minor gain (iGPU shares RAM with CPU,
  so the bottleneck is memory bandwidth, not compute).
Note: Startup script (ollama-gpu.ps1) placed in Windows Startup folder for persistence.
Rule: Always set OLLAMA_VULKAN=1 when using Intel Arc / AMD iGPU on Windows.

### Continue.dev Crashes with Ollama on Windows/Intel Arc

Problem: Continue.dev IDE extension crashes or hangs when calling the local Ollama server
  on Windows with Intel Arc 140V (Vulkan backend).
Root cause: Unknown — possibly a conflict between the Vulkan driver, the Node.js extension
  host, and the Ollama HTTP API under load.
Workaround: Use kb-load to generate context_output.md, then paste into Claude.ai.
  Claude.ai has a larger context window and more reliable behavior than local models.
Status: Blocked until a stable Continue.dev + Ollama + Intel Arc combination is found.
Rule: Don't rely on Continue.dev for the primary AI workflow on this machine.

### OLLAMA_MODELS Path — Verify Drive Letter

Problem: OLLAMA_MODELS=F:\AI\models failed silently (F: drive didn't exist on this machine).
  Models downloaded to default location instead.
Solution: OLLAMA_MODELS=E:\ollamaModels (verified E: exists and has 500GB+ free).
Lesson: Always verify the drive letter with `Get-PSDrive` before setting OLLAMA_MODELS.
  A wrong path causes Ollama to silently fall back to the default location with no error.

### Continue.dev Config Format
Problem: Legacy config.json format was deprecated in Continue.dev v1.2+.
Solution: New config.yaml format with `schema: v1`.
Warning: Config format changes with updates — check docs.continue.dev for current format.
Note: Even with correct config.yaml, Continue.dev remains blocked (see crash issue above).

### TanStack Query v5 Migration
Problem: v4 code used `isLoading` for mutations and old `mutationKey` syntax.
Solution: v5 uses `isPending` for mutations; `mutationKey` removed.
Rule: Always use `isPending` (not `isLoading`) for mutation state in v5.

### Zustand v5
Problem: v4 persist middleware had different API.
Solution: v5 uses `create<State>()(persist(set => ({...}), { name: '...' }))` pattern.
Rule: All persist keys prefixed with `smartflow:` to avoid localStorage conflicts.

### ARIA Accessibility
Problem: Linter flagged `aria-checked={boolean}` as invalid on role=switch.
Solution: Use string form: `aria-checked={checked ? 'true' : 'false'}`.
Problem: Form inputs without explicit labels trigger accessibility errors.
Solution: Use `id=` on input and matching `htmlFor=` on label.

### Nested Interactive Controls
Problem: `button` inside `div[role=button]` triggers linter rule S6819.
Solution: Replace outer div[role=button] with a proper `button` element,
making the inner delete button a sibling instead of a child.

### Audit Before Adding Features

Problem: Over time, scaffold files (Index.tsx, NavLink.tsx, supabaseClient.ts),
  abandoned features (user_api_keys hook + migration), planning docs, and build
  artifacts accumulated in the repo unnoticed.
Solution: Run a full codebase audit (AUDIT_REPORT.md) before starting new work.
Result: Found 19 unused files, deleted 1,625 lines of dead code, removed 1 abandoned
  DB table + migration.
Rule: Audit the codebase every few months. A clean repo is faster to reason about.

### DeepL vs Gemini for Translation

Problem: Gemini translation quality for Farsi and German was inconsistent — occasional
  hallucinations, wrong register, and poor handling of compound German words.
Solution: Use DeepL API via Cloudflare Worker for all translation tasks.
Result: Noticeably better Farsi and German output; 1M free characters/month is sufficient
  for typical personal-app usage.
Rule: Always use DeepL (not an LLM) for de/en/fa translation in this project.

### VITE_AI_AGENT_URL Must Include the /analyze Path

Problem: Setting VITE_AI_AGENT_URL to just the base domain (e.g. `https://api.barakzai.cloud`)
  caused all AI requests to 404. The translate URL was derived with `.replace('/analyze', '/translate')`,
  so both endpoints silently pointed to the root.
Solution: VITE_AI_AGENT_URL must be set to `https://api.barakzai.cloud/analyze` (full path).
Rule: Always set VITE_AI_AGENT_URL to the full /analyze endpoint, not just the base URL.

### PDF Document Translation → Simple Text Translator

Problem: Translating entire PDF documents was impractical — chunking 50k+ characters in parallel
  hits DeepL rate limits, and users rarely needed the full document translated verbatim.
Solution: Replace the document-tied DocumentTranslation component with a standalone TextTranslator
  that accepts free-form text input and calls translationService.translate() directly.
Result: Better UX (no document required), simpler code, no chunking needed.
Rule: Prefer a simple text-input translation UX over document-level translation unless bulk
  translation is an explicit requirement.

### Cloudflare Worker Secrets — Always Verify with wrangler secret list

Problem: A secret set via the Cloudflare dashboard appeared to be active but was under the wrong
  name, causing the Worker to fall back to an undefined key silently.
Solution: Run `wrangler secret list` to confirm the exact secret names visible to the Worker
  at runtime. Dashboard display names and wrangler names can differ.
Rule: After adding or updating any Cloudflare Worker secret, always verify with
  `wrangler secret list` before assuming the Worker can see it.

## Development Workflow That Works
1. Plan feature with Claude — get implementation plan as .md file
2. Implement with Claude Code (terminal)
3. Use .prompts/ templates for consistent patterns across features
4. Update CLAUDE_CONTEXT.md after any significant changes
5. Run `npm run build` locally to catch TypeScript errors before pushing
6. Push to main — Cloudflare Pages auto-deploys in ~30 seconds
7. Run `kb-build` after updating .knowledge/docs/ to keep vectors current

## IHK Exam Prep Notes
- Flashcard feature built specifically for IHK Fachinformatiker AP2 exam
- AI Tutor mode: fiae_algorithms with German IHK pseudocode style
- SM-2 spaced repetition algorithm implemented for optimal review scheduling
- ihk-explain.md template in .prompts/templates/ for exam topic explanations
