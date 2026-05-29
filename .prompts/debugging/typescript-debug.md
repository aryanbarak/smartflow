# TypeScript Debug — dailyFlow

Fix a TypeScript error in the dailyFlow app.

## Project Config
- TypeScript 5.8.3, strict mode
- Path alias: @/ → src/
- Vite + SWC compiler

## Common Errors & Fixes

### "Property does not exist on type"
- Check if type is correctly imported
- Check if optional chaining needed (`?.`)
- Check if type guard needed

### "Type 'X' is not assignable to type 'Y'"
- Check union types — maybe missing a case
- Check if null/undefined needs handling
- Check if `as` cast is appropriate (last resort — add comment explaining why)

### "Cannot find module '@/...'"
- Check tsconfig.json paths
- Check if file actually exists at that path
- Restart TypeScript server: Ctrl+Shift+P → "TypeScript: Restart TS Server"

### "Object is possibly null/undefined"
- Add null check before usage
- Use optional chaining: `obj?.property`
- Use nullish coalescing: `value ?? defaultValue`

### Supabase type errors
- Check src/integrations/supabase/types.ts
- Use `Database['public']['Tables']['table_name']['Row']` type
- New tables added manually may need `as any` cast until types are regenerated

### Common linter warnings in this project
- `typescript:S6759` — mark component props as `Readonly<{...}>`
- `typescript:S3358` — extract nested ternaries into if/else
- `typescript:S7735` — avoid negated condition as primary branch
- `typescript:S1128` — remove unused imports
- `typescript:S4325` — remove unnecessary type assertions (`as`)

## Rules for This Project
- No `any` — use `unknown` and narrow
- No non-null assertion `!` without a comment explaining why
- Prefer type inference over explicit annotation where obvious

## Error Message:
[PASTE FULL ERROR HERE]

## Code:
[PASTE CODE HERE]
