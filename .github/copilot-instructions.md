# FuncionarIA — Copilot Instructions

> These instructions apply to every GitHub Copilot interaction in this project.

## Project Overview

**FuncionarIA** is an AI-powered study plan generator that transforms academic syllabi into personalized study plans. Built as a Turborepo monorepo with a Next.js frontend, Fastify API, and Supabase backend.

## Tech Stack

- **Frontend**: Next.js 16 (App Router), React 18, Tailwind CSS 3.4, `@supabase/ssr`
- **Backend**: Fastify 5.8, Node.js 20+, `@fastify/jwt`, `@fastify/cors`, Zod
- **Database & Auth**: Supabase (PostgreSQL + Auth + RLS)
- **AI**: Anthropic Claude API (`@anthropic-ai/sdk`)
- **Payments**: Stripe
- **Monorepo**: Turborepo 2, npm workspaces
- **Language**: TypeScript 5 end-to-end

## Project Structure

```
funcionaria/
├── apps/web/          → @funcionaria/web (Next.js frontend)
├── apps/api/          → @funcionaria/api (Fastify backend)
├── packages/types/    → @funcionaria/types (shared types — single source of truth)
├── packages/config/   → @funcionaria/config
├── packages/prompts/  → @funcionaria/prompts
```

## Coding Standards

### TypeScript
- Use `strict: true` — no `any` types (use `unknown` + type guards)
- Always use `import type` for type-only imports
- Shared types go in `packages/types/src/index.ts` — NEVER duplicate across apps
- Frontend imports: `import type { Plan } from '@/types'`
- Backend imports: `import type { Plan } from '@funcionaria/types'`
- Prefer union types over enums: `type PlanStatus = 'active' | 'completed' | 'archived'`
- Always prefer arrow functions
- Don't use magic numbers/strings — create constants or enums in `packages/config` or `packages/types`
- Always centralize implementations, avoid duplicating logic across frontend/backend — create shared functions in `packages/config` or `packages/prompts` and import them where needed
- Use legible variable and function names — prioritize clarity over brevity

### Naming Conventions
- **Files**: `kebab-case.ts` / `kebab-case.tsx`
- **Components**: `PascalCase` (e.g., `PlanCard`)
- **Functions/variables**: `camelCase` (e.g., `generatePlan()`)
- **Types/Interfaces**: `PascalCase`, no `I` prefix (e.g., `Plan`, not `IPlan`)
- **Constants**: `UPPER_SNAKE_CASE` (e.g., `FREE_PLAN_LIMIT`)
- **API routes**: plural nouns, kebab-case (`/api/plans`, `/api/study-sessions`)
- **Database**: `snake_case` tables and columns (`user_id`, `created_at`)
- **Env vars**: `UPPER_SNAKE_CASE` (`SUPABASE_URL`)

### Frontend (Next.js App Router)
- Components are **Server Components by default** — only add `'use client'` when state/effects/events are needed
- Push `'use client'` as deep as possible — fetch data in Server Components, pass to Client Components via props
- Use the typed API client from `lib/api.ts` for backend calls
- Use `clsx` + `tailwind-merge` (via `cn()` helper) for conditional classes
- Never use inline styles — use Tailwind utilities
- **Hooks before guards:** all `useState`, `useEffect`, `useMemo`, `useCallback`, and other hooks must be declared before any conditional `return` — if a `useMemo` depends on nullable state, guard inside the memo (`if (!x) return fallback`) rather than placing the hook after an early return

### Backend (Fastify)
- Follow plugin architecture: ecosystem plugins → custom plugins → decorators → hooks → routes
- Routes in `routes/*.ts`, business logic in `services/*.ts`, infra in `lib/*.ts`
- Use `fastify-plugin` (fp) for shared decorators, scoped plugins for routes
- Validate requests with JSON Schema in route options
- Authenticate with `preHandler: [fastify.authenticate]`
- Always augment Fastify types with `declare module 'fastify'` when adding decorators

### Supabase
- Frontend: `createBrowserClient` from `@supabase/ssr`
- Server: `createServerClient` from `@supabase/ssr` with cookie handling
- Backend API: `createClient` with `SUPABASE_SERVICE_ROLE_KEY` (bypasses RLS)
- Always filter by `user_id` in backend queries (RLS is bypassed by service role)
- Use `getClaims()` not `getSession()` for server-side auth checks

### Error Handling
- Return `{ error: string }` for all error responses
- Use proper HTTP status codes (201 for create, 204 for delete, 402 for limit)
- Never swallow errors — log, rethrow, or return typed errors
- Use `unknown` for catch blocks, never `any`

### SOLID Principles
- **Single Responsibility**: routes handle HTTP, services handle logic, lib handles infra
- **Open/Closed**: extend via Fastify plugins, not modifying existing code
- **Dependency Inversion**: depend on types/interfaces from `@funcionaria/types`

## Language

- Code: always in English (variable names, function names, comments)
- User-facing strings: Portuguese (pt-BR) — this is a Brazilian Portuguese product
