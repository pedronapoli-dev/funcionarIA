# FuncionarIA — Agent Instructions

> These instructions apply to all AI agent interactions in this workspace.

## Project

**FuncionarIA** — AI-powered study plan generator. Turborepo monorepo with:
- `apps/web/` — Next.js 16 (App Router, React 18, Tailwind 3.4, Supabase SSR)
- `apps/api/` — Fastify 5.8 (Node.js 20+, @fastify/jwt, Zod)
- `packages/types/` — Shared TypeScript types (single source of truth)
- `packages/config/` — Shared configuration
- `packages/prompts/` — AI prompt templates

**Database & Auth**: Supabase (PostgreSQL + Auth + RLS)
**Payments**: Stripe
**AI**: Anthropic Claude API
**Language**: TypeScript 5 end-to-end

## Core Rules

1. **No `any`** — use `unknown` + type guards. Always `import type` for type-only imports.
2. **Shared types** go in `packages/types/src/index.ts` — never duplicate across apps.
3. **Server Components by default** — only `'use client'` for state/effects/events. Push the boundary as deep as possible.
4. **Fastify plugin architecture** — routes in `routes/*.ts`, business logic in `services/*.ts`, infra in `lib/*.ts`.
5. **Validate** requests with JSON Schema (Fastify) or Zod (complex cases).
6. **Authenticate** with `preHandler: [fastify.authenticate]` — never check auth inside handlers.
7. **Error responses**: always `{ error: string }` with proper HTTP status codes.
8. **Naming**: `kebab-case` files, `PascalCase` components/types, `camelCase` functions, `UPPER_SNAKE_CASE` constants.
9. **Code in English**, user-facing strings in **Portuguese (pt-BR)**.
10. **SOLID principles**: SRP (routes ≠ services ≠ lib), OCP (extend via plugins), DIP (depend on `@funcionaria/types`).
11. **Always prefer arrow functions**.

## Skills

For detailed patterns, read the skill files under `.agents/skills/fullstack-dev/`:
- `SKILL.md` — Main entry with decision trees and conventions
- `resources/nextjs-patterns.md` — App Router, Server/Client Components
- `resources/fastify-patterns.md` — Plugin architecture, hooks, validation
- `resources/supabase-patterns.md` — Auth, SSR clients, RLS, queries
- `resources/typescript-standards.md` — SOLID, naming, Zod, generics
- `resources/tailwind-patterns.md` — Design tokens, cn(), components
- `resources/monorepo-patterns.md` — Turborepo, workspaces, packages
- `resources/api-design.md` — REST conventions, error handling, auth flow
