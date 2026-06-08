# Fastify Architecture & Plugin Patterns

> Based on [Fastify Official Documentation](https://fastify.dev/docs/latest/) — v5.x

## Core Philosophy

Fastify is built around **plugins** and **encapsulation**. Every route, hook, and decorator lives inside a plugin. This gives you:
- **Isolation**: Each plugin has its own scope
- **Composability**: Plugins can register other plugins
- **Testability**: Plugins can be tested independently

> **Reference**: https://fastify.dev/docs/latest/Guides/Getting-Started/#your-first-plugin

## Plugin Architecture

### Loading Order (Official Recommendation)

```
└── Ecosystem plugins (@fastify/cors, @fastify/jwt, etc.)
└── Custom plugins (your plugins with fastify-plugin)
└── Decorators
└── Hooks
└── Services (route handlers)
```

> **Reference**: https://fastify.dev/docs/latest/Guides/Getting-Started/#loading-order-of-your-plugins

### This Project's Bootstrap Pattern

```typescript
// server.ts — follows the recommended loading order
async function bootstrap() {
  // 1. Ecosystem plugins
  await server.register(cors, { /* ... */ })
  await server.register(multipart, { /* ... */ })
  await server.register(jwt, { /* ... */ })
  await server.register(rateLimit, { /* ... */ })

  // 2. Custom plugins (shared decorators)
  await server.register(authPlugin)

  // 3. Route plugins (services)
  await server.register(plansRoutes,    { prefix: '/api/plans' })
  await server.register(subjectsRoutes, { prefix: '/api/subjects' })
  await server.register(exercisesRoutes,{ prefix: '/api/exercises' })
}
```

## `fastify-plugin` vs Scoped Plugins

### When to Use `fastify-plugin` (fp)

Use `fp()` when you need the plugin's decorators/hooks to be **visible to sibling plugins** (breaks encapsulation intentionally):

```typescript
// plugins/auth.ts — decorator must be available to ALL routes
import fp from 'fastify-plugin'
import { FastifyPluginAsync } from 'fastify'

const authPluginFn: FastifyPluginAsync = async (fastify) => {
  fastify.decorate('authenticate', async function (request, reply) {
    try {
      await request.jwtVerify()
    } catch (err) {
      reply.status(401).send({ error: 'Unauthorized' })
    }
  })
}

export const authPlugin = fp(authPluginFn)

// Type augmentation — ALWAYS declare decorator types
declare module 'fastify' {
  interface FastifyInstance {
    authenticate: (request: FastifyRequest, reply: FastifyReply) => Promise<void>
  }
}
```

> **Reference**: https://fastify.dev/docs/latest/Reference/Plugins/#fastify-plugin

### When to Use Scoped Plugins (Default)

Routes are **scoped by default** — they don't leak decorators/hooks to siblings:

```typescript
// routes/plans.ts — scoped plugin (no fp wrapper)
import { FastifyPluginAsync } from 'fastify'

export const plansRoutes: FastifyPluginAsync = async (fastify) => {
  // These routes are scoped under the prefix defined in server.ts
  fastify.get('/', { preHandler: [fastify.authenticate] }, async (request) => {
    // ...
  })
}
```

## Route Definition Pattern

### Structure: Route → Schema → Service

```
routes/plans.ts      → Defines endpoints, schemas, calls services
services/planService.ts → Business logic, data orchestration
lib/supabase.ts      → Database access layer
schemas/             → Reusable JSON Schema definitions (optional)
```

### Route with Full Typing and Validation

```typescript
import { FastifyPluginAsync } from 'fastify'
import { planService } from '../services/plan-service'

export const plansRoutes: FastifyPluginAsync = async (fastify) => {
  // Define route with generics for full type safety
  fastify.post<{
    Body: {
      subject_id: string
      hours_per_day: number
      days_per_week: number
      exam_date?: string
    }
  }>('/', {
    preHandler: [fastify.authenticate],
    schema: {
      body: {
        type: 'object',
        required: ['subject_id', 'hours_per_day', 'days_per_week'],
        properties: {
          subject_id:    { type: 'string', format: 'uuid' },
          hours_per_day: { type: 'number', minimum: 0.5, maximum: 12 },
          days_per_week: { type: 'integer', minimum: 1, maximum: 7 },
          exam_date:     { type: 'string', format: 'date' },
        },
      },
      response: {
        201: {
          type: 'object',
          properties: {
            plan: { type: 'object' },
          },
        },
      },
    },
  }, async (request, reply) => {
    const userId = (request.user as { sub: string }).sub
    const plan = await planService.generate(userId, request.body)
    return reply.status(201).send({ plan })
  })
}
```

> **Reference**: https://fastify.dev/docs/latest/Reference/Validation-and-Serialization/

## JSON Schema Validation

Fastify uses JSON Schema **natively** for request validation. The schema is compiled at startup for maximum performance.

### Schema Keys

| Key | Validates | Type |
|---|---|---|
| `body` | Request body (POST/PATCH/PUT) | JSON Schema |
| `querystring` | Query parameters | JSON Schema |
| `params` | URL path parameters | JSON Schema |
| `headers` | Request headers | JSON Schema |
| `response` | Response serialization | JSON Schema |

> **Reference**: https://fastify.dev/docs/latest/Reference/Validation-and-Serialization/#validation

### Shared Schemas

```typescript
// schemas/common.ts
export const uuidParam = {
  type: 'object',
  required: ['id'],
  properties: {
    id: { type: 'string', format: 'uuid' },
  },
} as const

// Usage in route:
fastify.get<{ Params: { id: string } }>('/:id', {
  schema: { params: uuidParam },
}, async (request) => {
  const { id } = request.params
})
```

## Hooks (Lifecycle)

> **Reference**: https://fastify.dev/docs/latest/Reference/Hooks/

### Request Lifecycle Order

```
Incoming Request
  └─ onRequest
    └─ preParsing
      └─ preValidation
        └─ preHandler      ← Authentication goes here
          └─ handler       ← Your route handler
            └─ preSerialization
              └─ onSend
                └─ onResponse
```

### Common Hook Patterns

```typescript
// Pre-handler for authentication (this project's pattern)
fastify.get('/protected', {
  preHandler: [fastify.authenticate],
}, async (request) => {
  // request.user is now populated
})

// onRequest for logging/metrics
fastify.addHook('onRequest', async (request) => {
  request.startTime = Date.now()
})

// onResponse for timing
fastify.addHook('onResponse', async (request, reply) => {
  const duration = Date.now() - request.startTime
  request.log.info({ duration }, 'request completed')
})
```

## Error Handling

> **Reference**: https://fastify.dev/docs/latest/Reference/Reply/#errors

### Consistent Error Responses

```typescript
// Pattern: use reply.status().send() with typed error objects
async (request, reply) => {
  const { data, error } = await supabase.from('plans')
    .select('*')
    .eq('id', request.params.id)
    .single()

  if (error || !data) {
    return reply.status(404).send({ error: 'Plan not found' })
  }

  return { plan: data }
}
```

### Custom Error Handler

```typescript
fastify.setErrorHandler(async (error, request, reply) => {
  request.log.error(error)

  if (error.validation) {
    return reply.status(400).send({
      error: 'Validation failed',
      details: error.validation,
    })
  }

  return reply.status(error.statusCode ?? 500).send({
    error: error.message ?? 'Internal Server Error',
  })
})
```

## Type Augmentation

When adding decorators, ALWAYS augment Fastify's type system:

```typescript
// Declare what you decorate
declare module 'fastify' {
  interface FastifyInstance {
    authenticate: (request: FastifyRequest, reply: FastifyReply) => Promise<void>
    supabase: SupabaseClient
  }

  interface FastifyRequest {
    startTime: number
  }
}
```

> **Reference**: https://fastify.dev/docs/latest/Reference/TypeScript/#creating-a-typed-plugin

## Testing

> **Reference**: https://fastify.dev/docs/latest/Guides/Testing/

```typescript
import Fastify from 'fastify'
import { plansRoutes } from '../routes/plans'

describe('Plans API', () => {
  const app = Fastify()

  beforeAll(async () => {
    await app.register(plansRoutes, { prefix: '/api/plans' })
    await app.ready()
  })

  afterAll(() => app.close())

  it('GET /api/plans returns 200', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/api/plans',
    })
    expect(response.statusCode).toBe(200)
  })
})
```
