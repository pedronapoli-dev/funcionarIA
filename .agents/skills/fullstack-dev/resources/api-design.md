# REST API Design & Error Handling

> Based on [Fastify Documentation](https://fastify.dev/docs/latest/), REST conventions, and this project's established patterns.

## URL Naming Conventions

### Resource-Based URLs

```
GET    /api/plans              → List all plans (for authenticated user)
POST   /api/plans              → Create a new plan
GET    /api/plans/:id          → Get a specific plan
PATCH  /api/plans/:id          → Partially update a plan
DELETE /api/plans/:id          → Delete a plan
PATCH  /api/plans/:id/session  → Complete a session within a plan
```

### Rules

| Rule | Example | Anti-Pattern |
|---|---|---|
| Use **plural nouns** | `/api/plans` | `/api/plan`, `/api/getPlan` |
| Use **kebab-case** | `/api/study-sessions` | `/api/studySessions` |
| Use **nouns, not verbs** | `POST /api/plans` | `/api/createPlan` |
| **Nest** related resources | `/api/plans/:id/session` | `/api/complete-session` |
| Use **query params** for filters | `/api/exercises?plan_id=abc` | `/api/exercises/by-plan/abc` |
| Always prefix with `/api/` | `/api/plans` | `/plans` |

## HTTP Methods

| Method | Purpose | Request Body | Idempotent | This Project's Usage |
|---|---|---|---|---|
| `GET` | Read resource(s) | No | Yes | List, Get by ID |
| `POST` | Create resource | Yes | No | Create plan, Upload PDF |
| `PATCH` | Partial update | Yes (partial) | Yes | Complete session, Answer exercise |
| `PUT` | Full replace | Yes (full) | Yes | Not used (prefer PATCH) |
| `DELETE` | Remove resource | No | Yes | Delete plan, subject |

### Status Codes

| Code | Meaning | When to Use |
|---|---|---|
| `200` | OK | Successful GET/PATCH |
| `201` | Created | Successful POST (resource created) |
| `204` | No Content | Successful DELETE |
| `400` | Bad Request | Validation error (malformed input) |
| `401` | Unauthorized | Missing or invalid JWT |
| `402` | Payment Required | Free plan limit reached |
| `403` | Forbidden | Valid JWT but no permission |
| `404` | Not Found | Resource doesn't exist |
| `409` | Conflict | Duplicate resource |
| `422` | Unprocessable | Valid JSON but semantic error |
| `429` | Too Many Requests | Rate limit exceeded |
| `500` | Server Error | Unexpected error |

## Request Validation

### Fastify JSON Schema (Primary)

Fastify compiles JSON Schema at startup for maximum performance:

```typescript
fastify.post<{
  Body: {
    subject_id:    string
    hours_per_day: number
    days_per_week: number
  }
}>('/', {
  schema: {
    body: {
      type: 'object',
      required: ['subject_id', 'hours_per_day', 'days_per_week'],
      properties: {
        subject_id:    { type: 'string' },
        hours_per_day: { type: 'number', minimum: 0.5, maximum: 12 },
        days_per_week: { type: 'integer', minimum: 1, maximum: 7 },
      },
    },
  },
}, handler)
```

> **Reference**: https://fastify.dev/docs/latest/Reference/Validation-and-Serialization/

### Zod for Complex Validation

Use Zod when JSON Schema is insufficient (complex transformations, conditional validation):

```typescript
import { z } from 'zod'

const studentProfileSchema = z.object({
  prior_knowledge_level: z.number().min(0).max(10),
  learning_formats:      z.array(z.enum(['videos', 'leitura', 'exercicios', 'projetos'])),
  application_context:   z.string().min(1).max(500),
  weekly_hours_available: z.number().positive(),
})

// Use in handler for additional validation
const profile = studentProfileSchema.parse(request.body.student_profile)
```

> **Reference**: https://zod.dev

## Error Response Format

### Consistent Structure

```typescript
// All error responses follow this shape
interface ApiError {
  error:        string     // Human-readable message
  upgrade_url?: string     // Optional URL for upgrade (402 responses)
}

// Usage examples:
return reply.status(401).send({ error: 'Unauthorized' })
return reply.status(404).send({ error: 'Plan not found' })
return reply.status(402).send({
  error: 'Free plan limit reached.',
  upgrade_url: '/plans',
})
```

### Error Handling Pattern (Route Level)

```typescript
fastify.get<{ Params: { id: string } }>('/:id', {
  preHandler: [fastify.authenticate],
}, async (request, reply) => {
  const userId = (request.user as { sub: string }).sub
  const { data, error } = await supabase
    .from('plans')
    .select('*, subjects ( * )')
    .eq('id', request.params.id)
    .eq('user_id', userId)
    .single()

  // Always check both error and null data
  if (error || !data) {
    return reply.status(404).send({ error: 'Plan not found' })
  }

  return { plan: data }
})
```

### Global Error Handler

```typescript
// server.ts — catch unhandled errors
fastify.setErrorHandler(async (error, request, reply) => {
  request.log.error(error)

  // Fastify validation errors
  if (error.validation) {
    return reply.status(400).send({
      error: 'Validation failed',
      details: error.validation,
    })
  }

  // Known HTTP errors
  if (error.statusCode) {
    return reply.status(error.statusCode).send({
      error: error.message,
    })
  }

  // Unexpected errors — never leak internals
  return reply.status(500).send({
    error: 'Internal Server Error',
  })
})
```

## Authentication Flow

### JWT via `@fastify/jwt`

```
Client Request
  └── middleware.ts (frontend) verifies session
  └── lib/api.ts adds Authorization header
  └── GET /api/plans (with Bearer token)
        └── preHandler: [fastify.authenticate]
              └── request.jwtVerify() → validates against Supabase JWKS
              └── request.user = { sub: userId, ... }
        └── handler: uses request.user.sub for queries
```

### Protected Routes Pattern

```typescript
// ALWAYS use preHandler for auth — NEVER check auth inside the handler
fastify.get('/', {
  preHandler: [fastify.authenticate],  // ← Auth gate
}, async (request) => {
  const userId = (request.user as { sub: string }).sub
  // ... safe to use userId
})
```

## Rate Limiting

> **Reference**: https://github.com/fastify/fastify-rate-limit

```typescript
await server.register(rateLimit, {
  max: 60,              // 60 requests...
  timeWindow: '1 minute', // ...per minute
})

// Per-route override for expensive operations
fastify.post('/generate', {
  config: {
    rateLimit: {
      max: 5,
      timeWindow: '1 minute',
    },
  },
}, handler)
```

## CORS Configuration

> **Reference**: https://github.com/fastify/fastify-cors

```typescript
await server.register(cors, {
  origin: process.env.FRONTEND_URL ?? 'http://localhost:3000',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
})
```

## Client-Side API Abstraction

### Typed API Client Pattern

```typescript
// lib/api.ts — centralized, typed API client
const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001'

async function getAuthHeader(): Promise<Record<string, string>> {
  const supabase = createClient()
  const { data } = await supabase.auth.getSession()
  const token = data.session?.access_token
  return token ? { Authorization: `Bearer ${token}` } : {}
}

async function request<T>(method: string, path: string, body?: unknown): Promise<T> {
  const authHeader = await getAuthHeader()
  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers: { 'Content-Type': 'application/json', ...authHeader },
    body: body ? JSON.stringify(body) : undefined,
  })

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }))
    throw { status: res.status, ...err }
  }

  if (res.status === 204) return undefined as T
  return res.json()
}

// Domain-specific API objects
export const plansApi = {
  generate: (body: CreatePlanInput) => request<{ plan: Plan }>('POST', '/api/plans', body),
  list:     ()                      => request<{ plans: Plan[] }>('GET', '/api/plans'),
  get:      (id: string)            => request<{ plan: Plan }>('GET', `/api/plans/${id}`),
  delete:   (id: string)            => request<void>('DELETE', `/api/plans/${id}`),
}
```

### Benefits of This Pattern

1. **Type safety at call site**: `plansApi.list()` returns `Promise<{ plans: Plan[] }>`
2. **Centralized auth**: Every request automatically includes the JWT
3. **Consistent error handling**: All errors go through the same path
4. **DRY**: HTTP boilerplate written once

## File Upload Pattern

```typescript
// For multipart uploads (like PDF), use FormData directly
export const subjectsApi = {
  uploadPdf: async (file: File) => {
    const authHeader = await getAuthHeader()
    const form = new FormData()
    form.append('file', file)

    const res = await fetch(`${BASE_URL}/api/subjects/upload`, {
      method: 'POST',
      headers: authHeader, // ⚠️ NO Content-Type — browser sets it with boundary
      body: form,
    })

    if (!res.ok) throw await res.json()
    return res.json() as Promise<{ subject: Subject }>
  },
}
```

> **Reference** (`@fastify/multipart`): https://github.com/fastify/fastify-multipart
