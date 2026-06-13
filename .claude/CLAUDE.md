# educar-se-ia — Project Instructions & State

> Single source of truth for all AI-assisted development. Updated 2026-06-10.

## Project

**educar-se-ia** — AI-powered study plan generator that transforms academic syllabi (ementas) into personalized study plans. Turborepo monorepo: Next.js 16 frontend + Fastify 5.8 API + Supabase (PostgreSQL, Auth, RLS) + Stripe payments + Anthropic Claude AI.

**Pedagogical foundation:** Freire (autonomy), Piaget (constructivism), Vygotsky (ZDP/scaffolding), Bloom (taxonomy + mastery learning), Darcy Ribeiro (integral education), Sweller (cognitive load), Ebbinghaus (spaced repetition). These are not decorative — every prompt, schedule field, and UI element reflects them.

## Structure

```
apps/web/          → @educarseia/web (Next.js App Router, React 18, Tailwind 3.4)
apps/api/          → @educarseia/api (Fastify 5.8, Zod, @fastify/jwt)
packages/types/    → @educarseia/types (shared types — single source of truth)
packages/config/   → shared configuration (tsconfig presets only for now)
```

## Current State (what's built)

### Backend — apps/api/src/

**Server (server.ts):** Fastify with CORS, multipart (10MB), JWT (JWKS from Supabase, supports ES256 + RS256), rate limiting (60/min). Health check at `/health`.

**Routes:**
- `POST /api/subjects/upload` — PDF upload → text extraction → AI parse → save
- `POST /api/subjects/text` — Raw text → AI parse → save
- `GET|PATCH|DELETE /api/subjects/:id` — CRUD
- `POST /api/plans` — Generate study plan (accepts student_profile, enable_sm2, enable_youtube). Enforces `maxPlans` per tier.
- `GET /api/plans` — List plans (with subjects join)
- `GET /api/plans/:id` — Plan detail (with subjects join)
- `PATCH /api/plans/:id/session` — Mark day complete (week + day)
- `DELETE /api/plans/:id`
- `POST /api/exercises/generate` — Generate exercises (bloom_level, plan_phase aware). Enforces `maxApiCallsPerMonth` per tier.
- `GET /api/exercises?plan_id=` — List exercises
- `PATCH /api/exercises/:id/answer` — Answer exercise
- `POST /api/skills/diagnose` — Pedagogical diagnostic (ZDP, prerequisites, risk topics)
- `POST /api/skills/checkin` — Weekly progress evaluation. Enforces `maxApiCallsPerMonth` + 24h cooldown (per plan, or per user when no `plan_id`).
- `POST /api/skills/recalibrate` — Plan recalibration when blocked. Enforces `maxApiCallsPerMonth` + 168h (1 week) cooldown (per plan, or per user when no `plan_id`).
- `POST /api/checkout` — Create Stripe Checkout Session for plan upgrade. Returns `{ url }`.
- `POST /api/webhook` — Stripe webhook (checkout.session.completed, subscription updated/deleted).

**Services:** subjectService (PDF extract + AI parse), planService (generate + complete session), exerciseService (generate + answer), diagnoseService, checkinService, recalibrateService.

**AI System (lib/):**
- `anthropic.ts` — generate() and generateWithTools() (agentic tool_use loop), model: `claude-sonnet-4-6`
- `prompts.ts` (v3.0.0) — All system/user prompts with pedagogical examples
- `skillRouter.ts` — Routes to prompt variant based on (studentLevel, urgency, planPhase, performanceTrend). Variants: foundation-first, mastery-refinement, intensive-review, standard, recovery, acceleration.
- `limits.ts` — `checkPlansLimit()` and `checkAndIncrementApiCall()`. Enforces PLAN_LIMITS, monthly reset, 80% usage warning. Unlimited tiers track usage via `increment_api_calls` RPC (fire-and-forget). Fails open on DB error. 20 unit tests in `src/lib/__tests__/limits.test.ts`.
- `cooldowns.ts` — `checkSkillCooldown()` and `recordSkillUsage()`. Enforces per-skill cooldowns (checkin: 24h, recalibrate: 168h) scoped by `plan_id` (or per-user when absent), backed by `skill_usage_log` table. Returns 429 + `CooldownResponse` shape. Fails open on DB error. 11 unit tests in `src/lib/__tests__/cooldowns.test.ts`.

**MCP Tools (lib/mcp/):** Internal TypeScript functions exposed to Claude via tool_use API:
- `supabaseTools.ts` — get_student_progress, get_spaced_review_status, get_plan_context
- `spacedRepTools.ts` — SM-2 algorithm (calculate_review_schedule, get_next_reviews_due) — pure computation
- `resourceTools.ts` — search_youtube_education (YouTube Data API v3, graceful degradation if no key)
- `registry.ts` — Central dispatcher

### Frontend — apps/web/src/

**Pages:**
- `/` — Landing page with features, steps, pedagogical frameworks, CTA. Header has links: Planos / Entrar / Começar grátis.
- `/login` — Email/password auth. After signup shows confirmation screen if email verification required. Has "← Voltar para o início" link.
- `/dashboard` — Plan list with stats, empty state. Shows 80% usage warning banner with link to /planos.
- `/plan/new` — 5-step wizard: Upload → Confirm (editable metadata) → Profile (knowledge level, formats, context, blocks) → Configure (hours, days, exam date) → Generating
- `/plan/[id]` — Plan detail with week navigation, session completion, exercise/checkin/recalibrate flows
- `/planos` — Pricing page: Free / Básico / Pro / Max cards + Beta callout. Pro highlighted. Calls POST /api/checkout.
- `/planos/sucesso` — Post-checkout success page.

**Components:**
- `DayItem` — Study session card with complete toggle, badges (type/priority/bloom), mastery criteria, review chain, tip, practice button
- `CheckinCard` — Weekly check-in form + results (trend, progress, action rationale). Shows `LimitReachedBlock` on 402, `CooldownNotice` on 429 cooldown.
- `ExerciseModal` — Exercise generation/display with scaffolded hints, answer feedback. Catches `ApiLimitError` and generic errors separately; shows `LimitReachedBlock` on 402.
- `RecalibrateModal` — "I'm stuck" flow: block type → topic → AI recalibration results. Shows `LimitReachedBlock` on 402, `CooldownNotice` on 429 cooldown.
- `LimitReachedBlock` — Shared upgrade CTA component (lock icon, usage bar, "Ver planos" button). Props: `{ limitError: LimitedResponse, context?: 'modal' | 'inline' }`.
- `CooldownNotice` — Shared cooldown notice component (clock icon, "tente novamente em..."). Props: `{ cooldownError: CooldownResponse, context?: 'modal' | 'inline' }`.
- `BloomBadge` + `BloomDistribution` — Bloom level visualization
- `Navbar` — Header with nav + logout

**Error handling:** `error.tsx` (route-level) and `global-error.tsx` (root-level) error boundaries.

**Lib:**
- `api.ts` — Typed API client. Throws `ApiLimitError` (extends Error, has `upgrade_url` + `usage`) on 402 responses, `ApiCooldownError` (extends Error, has `retry_at`) on 429 cooldown responses.
- `useAsyncAction` hook — exposes `{ loading, error, limitError, cooldownError, result, execute, reset }`. `limitError: LimitedResponse | null` and `cooldownError: CooldownResponse | null` are separate from `error: string | null`.
- Supabase clients (browser + server), middleware (auth guard), constants (UI labels/config).

### Database (Supabase)

Tables (all RLS-protected): users, subjects, plans, exercises, study_sessions.
Triggers: auto updated_at, auto profile creation on signup.
RPC: increment_plans_count.
Key: plans.schedule stores full ScheduleWeek[] as JSONB; completions tracked in both study_sessions table AND schedule JSONB.

**Applied migrations:**
- 003: `application_context` column on plans
- 004: plan tier constraint (free/basic/pro/max/beta), `api_calls_this_month` int, `api_calls_reset_at` timestamptz on users
- 005: `increment_api_calls(user_id)` RPC (SECURITY DEFINER, atomic counter for unlimited tiers, EXECUTE restricted to `service_role` only)
- 006: `skill_usage_log` table (user_id, plan_id, skill_type, created_at) for checkin/recalibrate cooldown tracking, RLS-protected

### Shared Types (packages/types/src/index.ts)

Covers: User, Subject, ParsedSubject, Plan (with application_context), ScheduleWeek, ScheduleDay, BloomLevel, ScaffoldingLevel, StudentProfile, DiagnosticResult, PlanCheckin, RecalibrateResult, Exercise, StudySession, SkillRoute, RoutingContext, LimitedResponse, CooldownResponse, and all union types.

**Tier types:**
```typescript
export type UserPlan = 'free' | 'basic' | 'pro' | 'max' | 'beta'

export const PLAN_LIMITS: Record<UserPlan, PlanLimits> = {
  free:  { maxPlans: 2,    maxApiCallsPerMonth: 10  },
  basic: { maxPlans: 10,   maxApiCallsPerMonth: 30  },
  pro:   { maxPlans: null, maxApiCallsPerMonth: 100 },
  max:   { maxPlans: null, maxApiCallsPerMonth: null },
  beta:  { maxPlans: null, maxApiCallsPerMonth: 100 },
}
```

## Known Gaps & Incomplete Features

1. **No PDF export** — Planned for future.
2. **No test coverage for API routes** — Only `limits.ts` and `cooldowns.ts` have unit tests (31 passing via Vitest).

## Design Decisions to Preserve

- **SkillRouter:** Always route through routeSkill() — never hardcode prompts in routes.
- **MCP = internal tools:** TypeScript functions exposed via Anthropic tool_use, not external MCP servers.
- **SM-2 is pre-computed:** Injected into prompt context BEFORE generation, not called by Claude during.
- **Phase 1 vs Phase 2:** checkin/recalibrate support manual data (no plan_id) AND MCP-backed (with plan_id).
- **Schedule is denormalized JSONB:** Full plan schedule in plans.schedule. Completions tracked in BOTH study_sessions table AND JSONB.
- **Limit enforcement:** Always use `checkPlansLimit()` / `checkAndIncrementApiCall()` from `lib/limits.ts`. Return 402 with `LimitedResponse` shape. Never hard-block without upgrade URL.
- **Cooldown enforcement:** Always use `checkSkillCooldown()` / `recordSkillUsage()` from `lib/cooldowns.ts` for checkin/recalibrate. Return 429 with `CooldownResponse` shape. Check cooldown BEFORE `checkAndIncrementApiCall`, record usage AFTER a successful skill run.
- **Graceful degradation:** 402 → `ApiLimitError` on frontend → `limitError` in `useAsyncAction` → `LimitReachedBlock` component. 429 cooldown → `ApiCooldownError` → `cooldownError` → `CooldownNotice` component. Generic errors stay in `error` state. Never mix these.
- **NUNCA UTILIZE GAMBIARRAS TÉCNICAS** — Always find root cause, apply structurally correct solution.

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

# Tests (run from apps/api/)
npm run test         # vitest run (18 tests for lib/limits.ts)
```

## Environment Variables

### apps/api/.env
```
SUPABASE_URL
SUPABASE_SERVICE_ROLE_KEY
SUPABASE_ANON_KEY
ANTHROPIC_API_KEY
JWT_SECRET
STRIPE_SECRET_KEY
STRIPE_WEBHOOK_SECRET
STRIPE_PRICE_ID_BASIC    # price_1TgcXJLt6PKI7uHGsGd5CMqI — R$19.90/mês
STRIPE_PRICE_ID_PRO      # price_1TgcXKLt6PKI7uHGJsP6kaLS — R$29.90/mês
STRIPE_PRICE_ID_MAX      # price_1TgcXLLt6PKI7uHG5cYbDeo9 — R$249.90/ano
STRIPE_PRICE_ID_BETA     # price_1TgcXMLt6PKI7uHGLO3N1x6B — R$14.90/mês
FRONTEND_URL
YOUTUBE_API_KEY          # optional — graceful degradation if absent
PORT                     # default 3001
```

### apps/web/.env.local
```
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
NEXT_PUBLIC_API_URL
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
NEXT_PUBLIC_DISCORD_INVITE_URL  # optional — shows "Comunidade" card on /conta if set
```

## Deploy Targets
- Web: Vercel (root: apps/web)
- API: Railway (root: apps/api)
- DB: Supabase hosted
- Domain: educarse-ia.com.br (A record → Vercel, api.educarse-ia.com.br → Railway)
