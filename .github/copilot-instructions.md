# educar-se-ia — Project Instructions & State

> Single source of truth for all AI-assisted development. Updated 2026-06-08.

## Project

**educar-se-ia** — AI-powered study plan generator that transforms academic syllabi (ementas) into personalized study plans. Turborepo monorepo: Next.js 16 frontend + Fastify 5.8 API + Supabase (PostgreSQL, Auth, RLS) + Stripe payments + Anthropic Claude AI.

**Pedagogical foundation:** Freire (autonomy), Piaget (constructivism), Vygotsky (ZDP/scaffolding), Bloom (taxonomy + mastery learning), Darcy Ribeiro (integral education), Sweller (cognitive load), Ebbinghaus (spaced repetition). These are not decorative — every prompt, schedule field, and UI element reflects them.

## Structure

```
apps/web/          → @educarseia/web (Next.js App Router, React 18, Tailwind 3.4)
apps/api/          → @educarseia/api (Fastify 5.8, Zod, @fastify/jwt)
packages/types/    → @educarseia/types (shared types — single source of truth)
packages/config/   → shared configuration (tsconfig presets only for now)
packages/prompts/  → AI prompt templates (has src/prompts.ts + src/router.ts but NOT used by API — API has its own copy in apps/api/src/lib/prompts.ts)
```

## Current State (what's built)

### Backend — apps/api/src/

**Server (server.ts):** Fastify with CORS, multipart (10MB), JWT (JWKS from Supabase, supports ES256 + RS256), rate limiting (60/min). Health check at `/health`.

**Routes:**
- `POST /api/subjects/upload` — PDF upload → text extraction → AI parse → save
- `POST /api/subjects/text` — Raw text → AI parse → save
- `GET|PATCH|DELETE /api/subjects/:id` — CRUD
- `POST /api/plans` — Generate study plan (accepts student_profile, enable_sm2, enable_youtube)
- `GET /api/plans` — List plans (with subjects join)
- `GET /api/plans/:id` — Plan detail (with subjects join)
- `PATCH /api/plans/:id/session` — Mark day complete (week + day)
- `DELETE /api/plans/:id`
- `POST /api/exercises/generate` — Generate exercises (bloom_level, plan_phase aware)
- `GET /api/exercises?plan_id=` — List exercises
- `PATCH /api/exercises/:id/answer` — Answer exercise
- `POST /api/skills/diagnose` — Pedagogical diagnostic (ZDP, prerequisites, risk topics)
- `POST /api/skills/checkin` — Weekly progress evaluation
- `POST /api/skills/recalibrate` — Plan recalibration when blocked

**Services:** subjectService (PDF extract + AI parse), planService (generate + complete session), exerciseService (generate + answer), diagnoseService, checkinService, recalibrateService.

**AI System (lib/):**
- `anthropic.ts` — generate() and generateWithTools() (agentic tool_use loop), model: `claude-sonnet-4-6`
- `prompts.ts` (v3.0.0) — All system/user prompts with pedagogical examples
- `skillRouter.ts` — Routes to prompt variant based on (studentLevel, urgency, planPhase, performanceTrend). Variants: foundation-first, mastery-refinement, intensive-review, standard, recovery, acceleration.

**MCP Tools (lib/mcp/):** Internal TypeScript functions exposed to Claude via tool_use API:
- `supabaseTools.ts` — get_student_progress, get_spaced_review_status, get_plan_context
- `spacedRepTools.ts` — SM-2 algorithm (calculate_review_schedule, get_next_reviews_due) — pure computation
- `resourceTools.ts` — search_youtube_education (YouTube Data API v3, graceful degradation if no key)
- `registry.ts` — Central dispatcher

### Frontend — apps/web/src/

**Pages:**
- `/login` — Email/password auth with Supabase
- `/dashboard` — Plan list with stats, empty state
- `/plan/new` — 5-step wizard: Upload → Confirm (editable metadata) → Profile (knowledge level, formats, context, blocks) → Configure (hours, days, exam date) → Generating
- `/plan/[id]` — Plan detail with week navigation, session completion, exercise/checkin/recalibrate flows

**Components:**
- `DayItem` — Study session card with complete toggle, badges (type/priority/bloom), mastery criteria, review chain, tip, practice button
- `CheckinCard` — Weekly check-in form + results (trend, progress, action rationale)
- `ExerciseModal` — Exercise generation/display with scaffolded hints, answer feedback
- `RecalibrateModal` — "I'm stuck" flow: block type → topic → AI recalibration results
- `BloomBadge` + `BloomDistribution` — Bloom level visualization
- `Navbar` — Header with nav + logout

**Error handling:** `error.tsx` (route-level) and `global-error.tsx` (root-level) error boundaries.

**Lib:** Typed API client (api.ts), Supabase clients (browser + server), middleware (auth guard), constants (UI labels/config), useAsyncAction hook.

### Database (Supabase)

Tables (all RLS-protected): users, subjects, plans, exercises, study_sessions.
Triggers: auto updated_at, auto profile creation on signup.
RPC: increment_plans_count.
Key: plans.schedule stores full ScheduleWeek[] as JSONB; completions tracked in both study_sessions table AND schedule JSONB.
Migration 003: `application_context` column on plans (run `apps/api/src/lib/migrations/003_plans_application_context.sql`).

### Shared Types (packages/types/src/index.ts)

~200 lines covering: User, Subject, ParsedSubject, Plan (with application_context), ScheduleWeek, ScheduleDay, BloomLevel, ScaffoldingLevel, StudentProfile, DiagnosticResult, PlanCheckin, RecalibrateResult, Exercise, StudySession, SkillRoute, RoutingContext, and all union types.

## Known Gaps & Incomplete Features

1. **Stripe checkout flow missing** — Webhook route exists, env vars defined, but no checkout UI or billing page.
2. **No landing page** — `/` redirects to /dashboard.
3. **packages/prompts not used** — API has its own prompts.ts; shared package is a stale duplicate.
4. **No tests** — Zero test files.
5. **Checkin/Recalibrate cooldowns not enforced** — Comments say "Phase 2: DB" but nothing implemented.
6. **Migration 003 not yet applied** — Run `003_plans_application_context.sql` in Supabase SQL Editor.

## Design Decisions to Preserve

- **SkillRouter:** Always route through routeSkill() — never hardcode prompts in routes.
- **MCP = internal tools:** TypeScript functions exposed via Anthropic tool_use, not external MCP servers.
- **SM-2 is pre-computed:** Injected into prompt context BEFORE generation, not called by Claude during.
- **Phase 1 vs Phase 2:** checkin/recalibrate support manual data (no plan_id) AND MCP-backed (with plan_id).
- **Schedule is denormalized JSONB:** Full plan schedule in plans.schedule. Completions tracked in BOTH study_sessions table AND JSONB.
- **Free tier:** 2 plans max, enforced in POST /api/plans.

## Rules

### TypeScript
- `strict: true`, no `any` — use `unknown` + narrowing
- `import type` for type-only imports
- Shared types in `packages/types/src/index.ts` only — never duplicate
- Frontend: `import type { Plan } from '@/types'`
- Backend: `import type { Plan } from '@educarseia/types'`
- Union types over enums
- Always prefer arrow functions

### Naming
- Files: `kebab-case.ts`
- Components: `PascalCase`
- Functions/vars: `camelCase`
- Types: `PascalCase`, no `I` prefix
- Constants: `UPPER_SNAKE_CASE`
- API routes: `/api/plural-nouns`
- DB tables/columns: `snake_case`

### Frontend (Next.js)
- Server Components by default — `'use client'` only for state/effects/events
- Push `'use client'` as deep as possible
- Use typed API client (`lib/api.ts`) for backend calls
- Use `cn()` helper (clsx + tailwind-merge) for class composition
- No inline styles
- **Hooks before guards:** all hooks before any conditional return

### Backend (Fastify)
- Plugin architecture: ecosystem → custom → decorators → hooks → routes
- Routes → Services → Lib (SRP)
- `fastify-plugin` for shared decorators, scoped plugins for routes
- JSON Schema validation in route options
- `preHandler: [fastify.authenticate]` for protected routes
- Augment types: `declare module 'fastify'` for decorators

### Supabase
- Frontend: `createBrowserClient` from `@supabase/ssr`
- Backend: `createClient` with `SUPABASE_SERVICE_ROLE_KEY`
- Always filter by `user_id` in backend queries

### Errors
- Return `{ error: string }` consistently
- Proper HTTP codes (201 create, 204 delete, 402 limit)
- Never swallow errors

### SOLID
- Routes = HTTP, Services = logic, Lib = infra
- Extend via plugins, not modification
- Depend on `@educarseia/types` abstractions

### Language
- Code: English
- User-facing strings: Portuguese (pt-BR)

## Commands

```bash
npm run dev          # all apps in parallel (web :3000, api :3001)
npm run build        # production build with cache
npm run type-check   # TypeScript checks all packages
npm run lint         # lint all packages
```

## Environment Variables

### apps/api/.env
SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, SUPABASE_ANON_KEY, ANTHROPIC_API_KEY, JWT_SECRET, STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET, STRIPE_PRICE_ID_PRO, FRONTEND_URL, YOUTUBE_API_KEY (optional), PORT (default 3001)

### apps/web/.env.local
NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, NEXT_PUBLIC_API_URL, NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY

## Deploy Targets
- Web: Vercel (root: apps/web)
- API: Railway (root: apps/api)
- DB: Supabase hosted
