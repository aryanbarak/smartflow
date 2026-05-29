# Security Review Prompt — dailyFlow

Review this code for security issues in the dailyFlow Supabase + React app.

## Check These
- [ ] No secrets or API keys in frontend code (Supabase anon key is OK — it's public by design)
- [ ] No SQL injection vectors (use Supabase parameterized queries, never string concatenation)
- [ ] RLS enforced — user can only access own data (user_id filter on all queries)
- [ ] No user input directly in DOM (XSS) — React escapes by default, watch for dangerouslySetInnerHTML
- [ ] File uploads: type and size validated before upload to Supabase Storage
- [ ] Auth state checked before sensitive operations (getUser() at top of every service function)
- [ ] No sensitive data in localStorage — only use dailyflow: prefix keys for non-sensitive prefs
- [ ] CORS: Cloudflare Worker only allows barakzai.cloud origin — localhost requests blocked in prod
- [ ] No environment variables with secrets exposed to client bundle (VITE_ prefix variables are public)

## Code to Review:
[PASTE CODE HERE]
