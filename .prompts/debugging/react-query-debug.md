# React Query Debug — dailyFlow

Debug a TanStack Query v5 issue in the dailyFlow app.

## Common Issues & Checks

### Data is stale / not updating
- [ ] Is `invalidateQueries` called after mutation?
- [ ] Is `queryKey` exactly matching between useQuery and invalidateQueries?
- [ ] Is `staleTime` set too high?
- [ ] Check: `queryClient.getQueryData(['key'])` in DevTools

### Query not firing
- [ ] Is `enabled` option accidentally `false`?
- [ ] Is the component actually mounted?
- [ ] Is user authenticated? (Supabase getUser() returns null?)

### Mutation not working
- [ ] Is `mutationFn` returning a Promise?
- [ ] Is error being thrown (not swallowed)?
- [ ] Check `onError` — is toast showing?

### Infinite re-renders
- [ ] Is queryKey stable? (no inline objects/arrays)
- [ ] Is a dependency in useEffect causing loop?

## Stack
- TanStack Query v5 — use `isPending` not `isLoading` for mutations
- QueryClient defined in `src/App.tsx`
- DevTools: add `ReactQueryDevtools` temporarily for debugging

## Code to Debug:
[PASTE CODE HERE]

## Error Message:
[PASTE ERROR HERE]
