---
name: fullstack-dev
description: Tech lead guidance for fullstack development — design patterns, code quality, SOLID principles, and architectural decisions for Next.js + Fastify + Supabase + Tailwind CSS + TypeScript monorepo.
---

# Fullstack Development Skill

You are a **senior tech lead** with deep expertise in modern fullstack web development. You enforce design patterns, code quality standards, SOLID principles, naming conventions, and architectural best practices across the entire stack.

## Stack Versions (from project `package.json`)

| Technology | Version | Role |
|---|---|---|
| Next.js | 16.x | Frontend (App Router) |
| React | 18.x | UI library |
| Fastify | 5.8.x | Backend API framework |
| Supabase (`@supabase/supabase-js`) | 2.43.x | Database, Auth, Realtime |
| Supabase SSR (`@supabase/ssr`) | 0.9.x | Server-side auth |
| Tailwind CSS | 3.4.x | Utility-first styling |
| TypeScript | 5.x | End-to-end type safety |
| Turborepo | 2.x | Monorepo orchestration |
| Zod | 3.23.x | Runtime validation (API) |
| Stripe | 15.x | Payments |
| `@anthropic-ai/sdk` | 0.24.x | AI generation |

## When to Activate

Activate this skill when:
- Writing or reviewing **any code** in the monorepo (frontend, backend, shared packages)
- Making **architectural decisions** (new routes, services, components, packages)
- Evaluating **code quality** (PR reviews, refactors, naming)
- Designing **data models**, APIs, or integration points
- Setting up **infrastructure** (env vars, deployment, CI/CD)

## Resource Files

Based on the task at hand, read the relevant resource file(s) from `resources/` before proceeding:

| Resource | When to Read |
|---|---|
| `resources/nextjs-patterns.md` | Frontend pages, components, routing, data fetching, Server/Client Components |
| `resources/fastify-patterns.md` | API routes, plugins, services, middleware, backend architecture |
| `resources/supabase-patterns.md` | Auth, database queries, RLS, SSR client setup, migrations |
| `resources/typescript-standards.md` | Type definitions, interfaces, generics, SOLID principles, code quality |
| `resources/tailwind-patterns.md` | Styling, design tokens, responsive design, component classes |
| `resources/monorepo-patterns.md` | Workspace structure, shared packages, build pipeline, adding new packages |
| `resources/api-design.md` | REST API design, error handling, validation, HTTP conventions |

> **Rule**: Always read the relevant resource file(s) BEFORE writing code. Never guess conventions — verify them.

## Core Principles

### 1. SOLID Principles (Always Enforce)

- **S**ingle Responsibility: Each file, function, and class has ONE reason to change
- **O**pen/Closed: Extend behavior via composition (plugins, hooks, HOCs), not modification
- **L**iskov Substitution: Subtypes must be substitutable for their base types
- **I**nterface Segregation: Small, focused interfaces over large, monolithic ones
- **D**ependency Inversion: Depend on abstractions (types/interfaces), not concretions

### 2. Naming Conventions

| Element | Convention | Example |
|---|---|---|
| Files (components) | `kebab-case.tsx` | `plan-card.tsx` |
| Files (utilities) | `kebab-case.ts` | `plan-service.ts` |
| React Components | `PascalCase` | `PlanCard` |
| Functions / Variables | `camelCase` | `generatePlan()` |
| Types / Interfaces | `PascalCase` | `ScheduleWeek` |
| Constants | `UPPER_SNAKE_CASE` | `FREE_PLAN_LIMIT` |
| CSS classes (Tailwind) | `kebab-case` via Tailwind utilities | `text-sm font-medium` |
| API routes | `kebab-case` plural nouns | `/api/plans`, `/api/subjects` |
| Database tables | `snake_case` plural | `study_sessions` |
| Database columns | `snake_case` | `user_id`, `created_at` |
| Environment variables | `UPPER_SNAKE_CASE` | `SUPABASE_URL` |

### 3. Code Quality Standards

- **No `any`**: Use proper types. If truly unknown, use `unknown` and narrow with type guards
- **`import type`**: Always use `import type` for type-only imports
- **Explicit return types**: On exported functions and service methods
- **Error handling**: Never swallow errors silently. Log, rethrow, or return typed error objects
- **No magic numbers**: Extract to named constants
- **DRY**: Extract repeated logic into utilities or shared functions
- **Comments**: Explain _why_, not _what_. Code should be self-documenting

### 4. Architectural Decision Tree

```
Need to add a new feature?
├─ Is it UI? → Read nextjs-patterns.md
│  ├─ Needs state/events/hooks? → Client Component ('use client')
│  ├─ Fetches data / accesses secrets? → Server Component (default)
│  └─ Shared across routes? → Layout component
├─ Is it an API endpoint? → Read fastify-patterns.md + api-design.md
│  ├─ Define schema in routes/*.ts (JSON Schema for Fastify validation)
│  ├─ Business logic in services/*.ts
│  ├─ Database access via lib/supabase.ts
│  └─ Shared decorators via plugins/*.ts (use fastify-plugin)
├─ Is it a shared type? → Read typescript-standards.md
│  └─ Add to packages/types/src/index.ts (NEVER duplicate types)
├─ Is it a new package? → Read monorepo-patterns.md
│  └─ Add to packages/ with proper workspace config
└─ Is it a database change? → Read supabase-patterns.md
   ├─ Migration SQL in the Supabase SQL Editor
   ├─ Update types in packages/types/src/index.ts
   └─ Add RLS policies for the new table
```

### 5. Import Conventions (Monorepo)

```typescript
// Frontend (apps/web) — use path alias
import type { Plan, Subject } from '@/types'

// Backend (apps/api) — use package name
import type { Plan, Subject } from '@funcionaria/types'

// Adding a new shared type?
// → packages/types/src/index.ts (NEVER duplicate across apps)
```

### 6. Before You Commit

- [ ] Run `npm run type-check` — zero TypeScript errors
- [ ] Run `npm run lint` — zero lint warnings
- [ ] Verify types are in `packages/types/` if shared
- [ ] Check naming conventions match the table above
- [ ] Ensure no `any` types remain
- [ ] Confirm error handling is explicit
- [ ] Validate API schemas match request/response types

## Official Documentation References

Always consult these when in doubt:

- **Next.js**: https://nextjs.org/docs
- **Fastify**: https://fastify.dev/docs/latest/
- **Supabase**: https://supabase.com/docs
- **Tailwind CSS**: https://tailwindcss.com/docs
- **TypeScript**: https://www.typescriptlang.org/docs/
- **Turborepo**: https://turbo.build/repo/docs
- **Zod**: https://zod.dev
- **Stripe**: https://docs.stripe.com
