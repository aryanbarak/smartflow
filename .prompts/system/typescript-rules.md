# TypeScript Rules — dailyFlow

## Strict Rules
- No `any` type — use `unknown` and narrow, or define proper interface
- All async functions must have explicit return type
- All props interfaces named as `Props` (local) or `<Component>Props` (exported)
- No non-null assertion (`!`) unless absolutely necessary with comment explaining why

## Naming
- Interfaces: PascalCase (UserProfile, HabitWithStats)
- Types: PascalCase (Lang, MoodScore, RecurrenceType)
- Enums: avoid — use const objects with `as const` instead
- Functions: camelCase, descriptive verbs (getUserProfile, toggleHabit)
- Files: camelCase for services/hooks, PascalCase for components

## Imports Order
1. React
2. External libraries (framer-motion, lucide-react, recharts, etc.)
3. Internal: @/features/...
4. Internal: @/components/...
5. Internal: @/lib/... @/hooks/... @/i18n
6. Types (import type ...)

## React Specific
- Functional components only
- Props destructured in signature
- Mark props as Readonly<{ ... }> to satisfy linter (typescript:S6759)
- No inline object/array creation in JSX (causes re-renders)
- useCallback for functions passed as props
- useMemo only when computation is actually expensive
- Prefer two sibling buttons over a div[role=button] containing a button (nested interactive controls)

## Common Linter Rules to Watch
- typescript:S6759 — mark component props as Readonly<{...}>
- typescript:S3358 — extract nested ternaries into if/else blocks
- typescript:S7735 — avoid negated conditions as primary branch
- typescript:S6819 — use <button> instead of div[role=button]
- typescript:S1128 — remove unused imports
- typescript:S4325 — remove unnecessary type assertions
