# New Feature Template — dailyFlow

Create a complete feature for the dailyFlow app.

## Feature Name: [FEATURE NAME]
## Description: [WHAT IT DOES]

## Generate These Files:

### 1. Types — `src/features/[feature]/types.ts`
- All interfaces and types for this feature
- No `any` types
- Export everything used by other files

### 2. Service — `src/features/[feature]/[feature]Service.ts`
- Follow pattern from .prompts/system/supabase-patterns.md
- CRUD operations: getAll, getById, create, update, delete
- Always getUser() first
- Return typed data, never null for lists

### 3. Hook — `src/features/[feature]/use[Feature].ts`
- useQuery for getAll/getById
- useMutation for create/update/delete
- Proper queryKey invalidation
- Toasts using useT() keys
- isPending (not isLoading) for mutations

### 4. Page — `src/pages/[Feature]Page.tsx`
- Use useT() for all strings — add keys to src/i18n/index.ts
- Loading state
- Empty state with Lucide icon
- Framer Motion animations
- Mobile-responsive layout

### 5. SQL Migration — `supabase/migrations/[timestamp]_[feature].sql`
- CREATE TABLE IF NOT EXISTS with RLS
- Unique constraints where needed
- GRANT ALL ON ... TO authenticated
- Note: run manually in Supabase Dashboard → SQL Editor

### 6. i18n Keys — add to `src/i18n/index.ts`
- [feature]_title
- [feature]_add
- [feature]_no_items (empty state)
- [feature]_item_added / [feature]_item_deleted (toast messages)
- Add to all three: en, de, fa

## Stack
React 18, TypeScript 5, Tailwind CSS 3, Framer Motion,
TanStack Query v5, Supabase, Sonner, Lucide React, i18n via useT()
