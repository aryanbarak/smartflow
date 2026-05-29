# Component Refactor Prompt — dailyFlow

Refactor the following React component for the dailyFlow app.

## Goals
- TypeScript strict compliance (no any, Readonly props, explicit return types)
- Split if >200 lines (extract sub-components or custom hooks)
- Extract business logic to custom hooks
- Replace hardcoded strings with useT() keys from src/i18n/index.ts
- Consistent Tailwind CSS patterns
- Framer Motion for animations (respect reducedMotion)
- Sonner for toasts (import { toast } from 'sonner')
- No nested interactive controls (no button inside div[role=button])
- aria-checked as string ('true'/'false') on role=switch toggles

## Stack Reminder
React 18, TypeScript 5, Tailwind CSS 3, Framer Motion, Radix UI,
TanStack Query v5, Supabase, Sonner, Lucide React, i18n via useT()

## Component to Refactor:
[PASTE COMPONENT HERE]
