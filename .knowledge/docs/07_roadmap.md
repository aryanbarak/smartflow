# dailyFlow — Roadmap

## Completed Features
- Authentication (Supabase email + password)
- Dashboard (aggregated overview + Mood widget)
- Tasks (CRUD + recurrence + overdue filter)
- Calendar (Supabase + localStorage fallback + recurrence)
- Finance (CRUD + CSV export/import + charts + PDF export)
- Family Hub (members + shopping list tab)
- Documents (PDF upload + Supabase Storage + signed URLs)
- Learn with AI (Gemini + 4 modes + 3 languages + chat history)
- Photos (masonry grid + lightbox + tags + AI tagging)
- Music (YouTube + local files + Pomodoro + task link + playlists)
- PWA (installable + service worker + offline badge)
- Habit Tracker (streak + progress bar + notifications)
- Daily Journal (mood + auto-save + calendar navigation)
- Flashcards (SM-2 spaced repetition — Again/Hard/Good/Easy)
- Mood Tracker (dashboard widget + 14-day recharts chart)
- Global Search (Ctrl+K — tasks + events + links + journal)
- Shopping List (FamilyPage tab, grouped by category)
- Recurring Tasks & Events
- Links page (tags + search + favicon + favorites)
- Settings page (5 tabs: Profile, Security, Appearance, Notifications, Data)
- i18n (en/de/fa — English default, RTL for Farsi)
- Prompt Library (.prompts/ — 24 files, 7 categories)
- Knowledge Base (Phase 2 — ChromaDB + nomic-embed-text)

## In Progress
- Knowledge Base integration with Continue.dev (query_kb + load_context)

## Planned — High Priority
- Rate limiting on AI Worker (Cloudflare KV counter)
- Optimistic rollback on Supabase write failure

## Planned — Medium Priority
- Extend i18n to Dashboard, Tasks, Calendar, Finance, Documents, Music, Photos, Links, Learn AI
- Mobile-optimize Finance and Family pages
- Prune learn_ai_messages (DB trigger or scheduled function)
- Regenerate Supabase types (supabase gen types) to remove `as any` casts

## Planned — Low Priority
- Sentry / error tracking
- Vitest test coverage for service layer
- Git-initialize dailyflow-ai-worker and add deploy workflow

## Known Bugs
1. learn_ai_messages grows unbounded — no pruning (Low)
2. Family JSONB arrays (events/schedule/notes) grow unbounded (Low)
3. No optimistic rollback on Supabase write failure — UI desyncs until reload (Medium)
4. Single Gemini model — no fallback if rate-limited (Medium)
5. No rate limiting on /analyze endpoint (Medium)
6. Short signed URL lifetime for documents (~20s on free tier config) (Low)
7. No error tracking (Sentry or similar) (Low)
8. dailyflow-ai-worker: no git repo, no CI/CD (Low)
9. Supabase generated types not updated for new tables — new services use `as any` (Low)
