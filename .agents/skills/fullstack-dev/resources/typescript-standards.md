# TypeScript Standards & SOLID Principles

> Based on [TypeScript Official Documentation](https://www.typescriptlang.org/docs/) — v5.x

## SOLID Principles in TypeScript

### S — Single Responsibility Principle

Each module, class, or function should have **one reason to change**.

```typescript
// ❌ BAD: Route handler does validation + business logic + database + response
fastify.post('/', async (request, reply) => {
  // validates, fetches, computes, inserts, formats...
})

// ✅ GOOD: Separated concerns
// routes/plans.ts     → HTTP layer (schema, auth, response codes)
// services/planService.ts → Business logic (computation, orchestration)
// lib/supabase.ts     → Data access (queries, mutations)
```

**This project's structure enforces SRP:**

| Layer | Responsibility | Directory |
|---|---|---|
| Routes | HTTP interface (schemas, status codes, auth hooks) | `routes/*.ts` |
| Services | Business logic (orchestration, computation) | `services/*.ts` |
| Lib | Infrastructure (DB, AI, external APIs) | `lib/*.ts` |
| Plugins | Cross-cutting concerns (auth, logging) | `plugins/*.ts` |

### O — Open/Closed Principle

Open for extension, closed for modification. Use **composition** over modification.

```typescript
// ✅ GOOD: Fastify plugin system is OCP by design
// Add new functionality by registering new plugins — never modify server.ts internals
await server.register(newFeaturePlugin)

// ✅ GOOD: Strategy pattern for different plan generation variants
interface PlanGenerator {
  generate(input: PlanInput): Promise<Plan>
}

class StandardPlanGenerator implements PlanGenerator { /* ... */ }
class AdaptivePlanGenerator implements PlanGenerator { /* ... */ }
```

### L — Liskov Substitution Principle

Subtypes must be substitutable for their base types.

```typescript
// ✅ GOOD: All plan types conform to the Plan interface
type PlanStatus = 'active' | 'completed' | 'archived'

// Any Plan can be used where Plan is expected, regardless of status
function displayPlan(plan: Plan): void {
  // Works with any PlanStatus
}
```

### I — Interface Segregation Principle

Prefer small, focused interfaces over large ones.

```typescript
// ❌ BAD: Monolithic interface
interface UserOperations {
  getUser(id: string): Promise<User>
  createUser(data: CreateUserInput): Promise<User>
  updateUser(id: string, data: Partial<User>): Promise<User>
  deleteUser(id: string): Promise<void>
  getUserPlans(id: string): Promise<Plan[]>
  getUserExercises(id: string): Promise<Exercise[]>
  processPayment(id: string, amount: number): Promise<void>
}

// ✅ GOOD: Segregated interfaces
interface UserReader {
  getUser(id: string): Promise<User>
}

interface UserWriter {
  createUser(data: CreateUserInput): Promise<User>
  updateUser(id: string, data: Partial<User>): Promise<User>
  deleteUser(id: string): Promise<void>
}

interface UserPlanAccess {
  getUserPlans(userId: string): Promise<Plan[]>
}
```

### D — Dependency Inversion Principle

Depend on abstractions (types/interfaces), not concretions.

```typescript
// ❌ BAD: Direct dependency on Supabase
import { supabase } from '../lib/supabase'

function getPlans(userId: string) {
  return supabase.from('plans').select('*').eq('user_id', userId)
}

// ✅ GOOD: Depend on abstraction
interface PlanRepository {
  findByUserId(userId: string): Promise<Plan[]>
}

// Implementation can be swapped (Supabase, Prisma, mock)
class SupabasePlanRepository implements PlanRepository {
  async findByUserId(userId: string): Promise<Plan[]> {
    const { data } = await supabase.from('plans').select('*').eq('user_id', userId)
    return data ?? []
  }
}
```

## Naming Conventions

> **Reference**: https://www.typescriptlang.org/docs/handbook/declaration-files/do-s-and-don-ts.html

| Element | Convention | Example | Anti-Pattern |
|---|---|---|---|
| Interfaces | `PascalCase`, no `I` prefix | `Plan`, `User` | `IPlan`, `IUser` |
| Types | `PascalCase` | `PlanStatus`, `BloomLevel` | `planStatus` |
| Type aliases (union) | `PascalCase` | `SessionType = 'teoria' \| 'exercicio'` | |
| Enums | `PascalCase` members | Prefer union types over enums | |
| Functions | `camelCase`, verb prefix | `generatePlan()`, `getPlanById()` | `plan()`, `planGenerate()` |
| Variables | `camelCase` | `totalWeeks`, `userId` | `TotalWeeks` |
| Constants | `UPPER_SNAKE_CASE` | `FREE_PLAN_LIMIT` | `freePlanLimit` |
| Files | `kebab-case` | `plan-service.ts` | `planService.ts`, `PlanService.ts` |
| Booleans | `is`/`has`/`can`/`should` prefix | `isActive`, `hasAccess` | `active`, `access` |
| Event handlers | `handle` + noun + verb | `handlePlanCreate` | `create`, `onPlan` |
| Async functions | Same as sync, no suffix | `generatePlan()` | `generatePlanAsync()` |

## Shared Types (`@funcionaria/types`)

> Single source of truth — defined once in `packages/types/src/index.ts`, never duplicated.

### Import Conventions

```typescript
// ✅ Frontend (apps/web) — via path alias
import type { Plan, Subject, Exercise } from '@/types'

// ✅ Backend (apps/api) — via package name
import type { Plan, Subject, Exercise } from '@funcionaria/types'

// ✅ Always use `import type` for type-only imports
import type { ScheduleWeek } from '@funcionaria/types'

// ❌ NEVER duplicate types across apps
// ❌ NEVER define shared types in apps/web or apps/api
```

### Type Design Patterns

```typescript
// Union types over enums (tree-shakeable, serializable)
export type PlanStatus = 'active' | 'completed' | 'archived'

// Interfaces for data shapes (extendable)
export interface Plan {
  id:         string
  user_id:    string
  title:      string
  status:     PlanStatus
  schedule:   ScheduleWeek[]
  created_at: string
}

// Utility types for API payloads
export interface CreatePlanInput {
  subject_id:    string
  hours_per_day: number
  days_per_week: number
  exam_date?:    string
}

// Pick/Omit for partial updates
type UpdatePlanInput = Partial<Pick<Plan, 'title' | 'status'>>
```

## `import type` Usage

> **Reference**: https://www.typescriptlang.org/docs/handbook/release-notes/typescript-3-8.html#type-only-imports-and-exports

```typescript
// ✅ ALWAYS use `import type` when importing only types
import type { FastifyPluginAsync, FastifyRequest, FastifyReply } from 'fastify'
import type { Plan, Subject } from '@funcionaria/types'

// ✅ Mixed imports — separate type and value imports
import { supabase } from '../lib/supabase'
import type { Plan } from '@funcionaria/types'

// ❌ BAD: importing types without `type` keyword
import { Plan, Subject } from '@funcionaria/types'
```

## Runtime Validation with Zod

> **Reference**: https://zod.dev

Use Zod for **runtime** validation (API inputs); TypeScript for **compile-time** type safety.

```typescript
import { z } from 'zod'

// Define schema
const createPlanSchema = z.object({
  subject_id:    z.string().uuid(),
  hours_per_day: z.number().min(0.5).max(12),
  days_per_week: z.number().int().min(1).max(7),
  exam_date:     z.string().date().optional(),
})

// Infer type from schema (DRY — schema IS the type)
type CreatePlanInput = z.infer<typeof createPlanSchema>

// Validate at runtime
const validated = createPlanSchema.parse(request.body) // throws on invalid
const result = createPlanSchema.safeParse(input) // returns { success, data | error }
```

## Error Handling Patterns

### Typed Error Objects

```typescript
// API error type (shared)
export interface ApiError {
  error:        string
  upgrade_url?: string
}

// Usage: always return typed errors
if (user?.plan === 'free' && plansCount >= FREE_PLAN_LIMIT) {
  return reply.status(402).send({
    error: 'Free plan limit reached.',
    upgrade_url: '/plans',
  } satisfies ApiError)
}
```

### Discriminated Unions for Results

```typescript
type Result<T> =
  | { success: true; data: T }
  | { success: false; error: string }

async function generatePlan(input: PlanInput): Promise<Result<Plan>> {
  try {
    const plan = await planService.generate(input)
    return { success: true, data: plan }
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'Unknown error' }
  }
}
```

### Never `any` — Use `unknown` + Narrowing

```typescript
// ❌ BAD
catch (err: any) {
  console.log(err.message)
}

// ✅ GOOD
catch (err: unknown) {
  const message = err instanceof Error ? err.message : 'Unknown error'
  request.log.error({ err }, message)
}
```

## Generics Best Practices

```typescript
// ✅ Generic API request function (this project's pattern)
async function request<T>(method: string, path: string, body?: unknown): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, { method, /* ... */ })
  return res.json() as Promise<T>
}

// Usage: fully typed at call site
const { plans } = await request<{ plans: Plan[] }>('GET', '/api/plans')

// ✅ Constrained generics
function getProperty<T, K extends keyof T>(obj: T, key: K): T[K] {
  return obj[key]
}
```

## Strict TypeScript Configuration

> **Reference**: https://www.typescriptlang.org/tsconfig

Ensure these are enabled in `tsconfig.json`:

```json
{
  "compilerOptions": {
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true,
    "forceConsistentCasingInFileNames": true,
    "exactOptionalPropertyTypes": false
  }
}
```
