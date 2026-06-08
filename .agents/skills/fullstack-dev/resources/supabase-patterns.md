# Supabase Patterns (SSR, Auth, Database)

> Based on [Supabase Official Documentation](https://supabase.com/docs) — `@supabase/supabase-js` v2.x, `@supabase/ssr` v0.9.x

## Client Types

Supabase requires **different client instances** depending on where the code runs.

### Browser Client (Client Components)

> **Reference**: https://supabase.com/docs/guides/auth/server-side/nextjs#write-utility-functions-to-create-supabase-clients

```typescript
// lib/supabase.ts — used in Client Components & client-side code
import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
```

### Server Client (Server Components, Route Handlers, Server Actions)

```typescript
// lib/supabase-server.ts — used in Server Components
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function createSupabaseServerClient() {
  const cookieStore = await cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: (cookiesToSet) => {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          )
        },
      },
    }
  )
}
```

### API Client (Fastify Backend)

```typescript
// apps/api/src/lib/supabase.ts — service role for backend
import { createClient } from '@supabase/supabase-js'

export const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)
```

> ⚠️ **Never expose `SUPABASE_SERVICE_ROLE_KEY`** to the frontend. It bypasses RLS.

## Authentication

### Middleware / Proxy for Token Refresh

> **Reference**: https://supabase.com/docs/guides/auth/server-side/nextjs#hook-up-proxy

The middleware refreshes expired tokens **before** they reach Server Components:

```typescript
// middleware.ts
import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseMiddlewareClient } from './lib/supabase-server'

export async function middleware(request: NextRequest) {
  const response = NextResponse.next()
  const supabase = createSupabaseMiddlewareClient(request, response)

  // IMPORTANT: Use getClaims() not getSession() for security
  const { data: { session } } = await supabase.auth.getSession()

  const { pathname } = request.nextUrl

  if (!session && pathname !== '/login') {
    return NextResponse.redirect(new URL('/login', request.url))
  }
  if (session && (pathname === '/login' || pathname === '/')) {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  return response
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|api).*)'],
}
```

### Security: `getClaims()` vs `getSession()`

| Method | Where | Validates JWT? | Safe for Auth? |
|---|---|---|---|
| `getClaims()` | Server only | ✅ Yes (verifies signature) | ✅ Yes |
| `getSession()` | Server | ❌ No (reads cookie only) | ⚠️ Risky |
| `getSession()` | Client | N/A (browser context) | ✅ For UI only |

> **Rule**: On the server, always use `getClaims()` for auth decisions. Cookies can be spoofed.
> **Reference**: https://supabase.com/docs/guides/auth/server-side/nextjs#hook-up-proxy

### JWT Verification (Fastify Backend)

This project verifies JWTs against Supabase's JWKS endpoint, supporting both ES256 (new) and RS256 (legacy):

```typescript
// server.ts — JWT verification with JWKS
await server.register(jwt, {
  secret: async (_request, token) => {
    const alg = token.header.alg
    if (alg !== 'ES256' && alg !== 'RS256') {
      throw new Error(`Unsupported algorithm: ${alg}`)
    }
    return getPublicKeyPem(token.header.kid)
  },
  decode: { complete: true },
  verify: { algorithms: ['ES256', 'RS256'] },
})
```

## Database Queries

### Query Pattern (Backend Service Layer)

```typescript
// services/plan-service.ts
export async function getPlanById(userId: string, planId: string) {
  const { data, error } = await supabase
    .from('plans')
    .select('*, subjects ( * )')
    .eq('id', planId)
    .eq('user_id', userId)
    .single()

  if (error) throw error
  if (!data) throw new Error('Plan not found')

  return data
}
```

### Common Query Methods

| Method | SQL Equivalent | Example |
|---|---|---|
| `.select('*')` | `SELECT *` | Fetch all columns |
| `.select('id, title')` | `SELECT id, title` | Specific columns |
| `.select('*, subjects(*)')` | `JOIN` | With relations |
| `.eq('col', val)` | `WHERE col = val` | Equality filter |
| `.neq('col', val)` | `WHERE col != val` | Not equal |
| `.in('col', [v1, v2])` | `WHERE col IN (v1, v2)` | Multiple values |
| `.order('col', { ascending: false })` | `ORDER BY col DESC` | Sorting |
| `.single()` | `LIMIT 1` + expect exactly one | Single row |
| `.maybeSingle()` | `LIMIT 1` + allow null | Optional single |
| `.limit(n)` | `LIMIT n` | Limit rows |

> **Reference**: https://supabase.com/docs/reference/javascript/select

### RPC Functions

```typescript
// Call a Postgres function
await supabase.rpc('increment_plans_count', {
  user_id_param: userId,
})
```

> **Reference**: https://supabase.com/docs/reference/javascript/rpc

## Row Level Security (RLS)

> **Reference**: https://supabase.com/docs/guides/database/postgres/row-level-security

### Pattern: Users Can Only Access Their Own Data

```sql
-- Enable RLS on the table
ALTER TABLE plans ENABLE ROW LEVEL SECURITY;

-- Policy: users can only read their own plans
CREATE POLICY "Users can view own plans"
  ON plans FOR SELECT
  USING (auth.uid() = user_id);

-- Policy: users can only insert their own plans
CREATE POLICY "Users can create own plans"
  ON plans FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Policy: users can only update their own plans
CREATE POLICY "Users can update own plans"
  ON plans FOR UPDATE
  USING (auth.uid() = user_id);

-- Policy: users can only delete their own plans
CREATE POLICY "Users can delete own plans"
  ON plans FOR DELETE
  USING (auth.uid() = user_id);
```

### Service Role Bypasses RLS

The backend uses `SUPABASE_SERVICE_ROLE_KEY` which **bypasses all RLS policies**. This is intentional — the API layer handles authorization via JWT verification and user ID filtering:

```typescript
// Backend: manually filter by user_id (RLS is bypassed)
const { data } = await supabase
  .from('plans')
  .select('*')
  .eq('user_id', userId) // ALWAYS filter by user
```

## Environment Variables

### Frontend (`apps/web/.env.local`)

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...       # Safe to expose
NEXT_PUBLIC_API_URL=http://localhost:3001
```

### Backend (`apps/api/.env`)

```env
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJ...           # ⚠️ NEVER expose
SUPABASE_ANON_KEY=eyJ...                   # For JWKS fetching
JWT_SECRET=your-jwt-secret
```

> **Reference**: https://supabase.com/docs/guides/api/api-keys
