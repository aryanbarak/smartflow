# Performance Review Prompt — smartFlow

Review this code for performance issues.

## Check These

### React
- [ ] Components re-render unnecessarily?
- [ ] Large lists use virtualization?
- [ ] Images lazy loaded?
- [ ] Framer Motion: reducedMotion respected (from useAppearance().reducedMotion)?
- [ ] AnimatePresence used correctly (key on animated children)?

### Data Fetching
- [ ] Supabase queries select only needed columns (not `select('*')` when avoidable)
- [ ] Queries have appropriate .limit() for large tables
- [ ] staleTime configured in useQuery where data doesn't change often?
- [ ] Multiple queries combined with Promise.all where possible?
- [ ] Mutations invalidate only the specific queryKey, not all queries?

### Bundle
- [ ] Large libraries imported selectively (e.g. recharts tree-shaken)?
- [ ] Heavy pages use lazy() + Suspense for code splitting?
- [ ] No duplicate dependencies imported from different paths?

### Zustand
- [ ] Selectors used to avoid full store re-renders (useStore(s => s.specificField))?
- [ ] Persist middleware only on stores that need it?

## Code to Review:
[PASTE CODE HERE]
