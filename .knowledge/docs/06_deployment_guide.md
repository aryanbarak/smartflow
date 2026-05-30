# dailyFlow — Deployment Guide

## Frontend Deploy (Cloudflare Pages)

```bash
# Auto-deploy (push to main)
git push origin main

# Manual trigger
gh workflow run deploy-cloudflare-pages.yml --ref main

# Watch deployment
gh run list --limit 5
gh run watch <run-id>

# Build test locally before pushing
npm run build
```

## AI Worker Deploy

```bash
cd dailyflow-ai-worker
npx wrangler deploy
npx wrangler tail              # live logs
npx wrangler secret put GEMINI_API_KEY
npx wrangler dev               # local dev (CORS allows localhost)
```

## Supabase Migrations

```sql
-- Migration file: supabase/migrations/YYYYMMDDHHMMSS_description.sql
-- Always include all three:
ALTER TABLE public.table_name ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own table_name" ON public.table_name
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
GRANT ALL ON public.table_name TO authenticated;
```

Run migrations: Supabase Dashboard → SQL Editor → paste → Run
Note: FREE tier — no migration CLI, always manual.

## When Auth Breaks ("Failed to fetch" / NetworkError)
1. Check Supabase project not paused (Dashboard → restart project)
2. Verify Site URL = https://barakzai.cloud in Auth → URL Configuration
3. Check that VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are NOT in GitHub Secrets
4. Force redeploy: `gh workflow run deploy-cloudflare-pages.yml --ref main`

## Pre-Deploy Checklist
- [ ] `npm run build` passes locally with no TypeScript errors
- [ ] No hardcoded UI strings (use t() keys)
- [ ] New Supabase tables have RLS + GRANT
- [ ] New env vars added to GitHub Secrets
- [ ] CLAUDE_CONTEXT.md updated
- [ ] .knowledge/docs/ updated if architecture changed

## Post-Deploy Verification
- [ ] https://barakzai.cloud loads correctly
- [ ] Login works (Supabase auth)
- [ ] Check browser console for errors
- [ ] Test the feature that was changed
