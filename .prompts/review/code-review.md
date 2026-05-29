# Code Review Prompt — dailyFlow

Review the following code for the dailyFlow React application.

## Context
{{PASTE CONTEXT FROM .prompts/system/dailyflow-context.md}}

## Check These

### TypeScript
- [ ] No `any` types
- [ ] All async functions typed
- [ ] Props interface defined and marked Readonly<{...}>
- [ ] No non-null assertions without comment

### React
- [ ] No missing useEffect dependencies
- [ ] No stale closures
- [ ] Keys in lists are stable (not index)
- [ ] No inline object creation in JSX
- [ ] No nested interactive controls (button inside div[role=button])

### Supabase
- [ ] getUser() called before DB operations
- [ ] Error handled after every query
- [ ] RLS-compatible (uses user_id filter)
- [ ] .maybeSingle() used where row might not exist

### TanStack Query v5
- [ ] queryKey is array and descriptive
- [ ] invalidateQueries after mutations
- [ ] isPending used (not isLoading) for mutations
- [ ] Error shown to user via toast

### i18n
- [ ] No hardcoded UI strings
- [ ] All strings use t('key') from useT()
- [ ] New keys added to all three languages in src/i18n/index.ts

### Performance
- [ ] No unnecessary re-renders
- [ ] Heavy computations memoized

### Accessibility
- [ ] Buttons have aria-label when no visible text
- [ ] aria-checked is string ('true'/'false') not boolean on role=switch
- [ ] Form inputs have associated labels (htmlFor + id)

## Code to Review:
[PASTE CODE HERE]
