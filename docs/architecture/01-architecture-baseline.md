# SmartFlow Architecture Baseline

## Status

Draft

## Date

2026-07-06

## Purpose

This document captures the current architecture baseline of SmartFlow before Sprint 0 stabilization work.

## Project Vision

SmartFlow is an AI-powered Life Operating System for personal productivity, documents, tasks, calendar, finance, family organization, learning, and AI-assisted workflows.

## Technology Stack

- React
- TypeScript
- Vite
- Tailwind CSS
- Supabase
- Cloudflare Pages
- Cloudflare Workers
- PWA
- TanStack Query
- Zustand

## Current Modules

- Dashboard
- AI Assistant
- Tasks
- Calendar
- Documents
- Finance
- Family
- Photos
- Music
- Notes & Journal
- Habits
- Settings
- Smart Academy
- Knowledge Base

## Repositories

- Frontend: smartflow
- AI Worker: to be verified during Sprint 0

## Database

- Supabase PostgreSQL
- RLS is the primary data security boundary
- Migration workflow requires stabilization

## AI Architecture

- AI calls are routed through Cloudflare Worker
- AI Worker repository/deployment truth must be verified
- AI provider strategy requires formal ADR

## Deployment

- Frontend deploys through Cloudflare Pages
- GitHub Actions are used for deployment
- Worker deployment process requires verification

## Current Risks

- Documentation drift
- AI Worker documentation conflict
- Supabase migration drift
- Generated Supabase types may be outdated
- Limited test coverage
- Missing formal ADR system

## Technical Debt Summary

- Missing ADR system
- Missing formal AI Worker deployment documentation
- Missing Supabase migration discipline
- Weak type generation workflow
- Technical debt backlog not yet formalized

## Next Architecture Priorities

1. Create ADR system
2. Verify AI Worker repository and deployment
3. Document backend API
4. Standardize Supabase migration workflow
5. Regenerate Supabase types
6. Create technical debt backlog