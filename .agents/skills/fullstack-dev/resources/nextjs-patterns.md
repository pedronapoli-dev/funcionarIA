# Next.js App Router Patterns

> Based on [Next.js Official Documentation](https://nextjs.org/docs) — App Router (v14+/v16+)

## Server vs Client Components

**Default: Server Components** — components are server-rendered unless explicitly marked with `'use client'`.

### Decision Matrix

| Need | Component Type | Reason |
|---|---|---|
| Fetch data from DB/API | **Server** | Direct access, no client bundle |
| Use API keys / secrets | **Server** | Never exposed to browser |
| Heavy computation | **Server** | Runs on server, zero JS shipped |
| SEO-critical content | **Server** | Full HTML in initial response |
| `useState`, `useReducer` | **Client** | Requires React state |
| `useEffect`, `useLayoutEffect` | **Client** | Requires lifecycle |
| `onClick`, `onChange`, event handlers | **Client** | Requires browser interactivity |
| Browser APIs (`localStorage`, `window`) | **Client** | Server has no browser context |
| Custom hooks with state/effects | **Client** | Hooks trigger client rendering |

> **Reference**: https://nextjs.org/docs/app/building-your-application/rendering/server-components#when-to-use-server-and-client-components

### Pattern: Server Component fetches, Client Component interacts

```typescript
// app/plans/[id]/page.tsx — SERVER Component (default)
import { PlanSchedule } from '@/components/plan-schedule'
import { getplan } from '@/lib/data'

export default async function PlanPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const plan = await getPlan(id)

  return (
    <div>
      <h1>{plan.title}</h1>
      {/* Pass serializable data to client component */}
      <PlanSchedule schedule={plan.schedule} planId={plan.id} />
    </div>
  )
}
```

```typescript
// components/plan-schedule.tsx — CLIENT Component
'use client'

import { useState } from 'react'
import type { ScheduleWeek } from '@/types'

interface PlanScheduleProps {
  schedule: ScheduleWeek[]
  planId: string
}

export function PlanSchedule({ schedule, planId }: PlanScheduleProps) {
  const [activeWeek, setActiveWeek] = useState(0)
  // Client-side interactivity here...
}
```

> **Key Rule**: Pass data DOWN from Server → Client via props. Never import server-only code in client components.

## File Conventions (App Router)

| File | Purpose | Ref |
|---|---|---|
| `page.tsx` | Route UI — renders at the segment URL | [Docs](https://nextjs.org/docs/app/api-reference/file-conventions/page) |
| `layout.tsx` | Shared UI wrapper — persists across navigations | [Docs](https://nextjs.org/docs/app/api-reference/file-conventions/layout) |
| `loading.tsx` | Suspense fallback — shown while segment loads | [Docs](https://nextjs.org/docs/app/api-reference/file-conventions/loading) |
| `error.tsx` | Error boundary — catches errors in the segment | [Docs](https://nextjs.org/docs/app/api-reference/file-conventions/error) |
| `not-found.tsx` | 404 UI for `notFound()` calls | [Docs](https://nextjs.org/docs/app/api-reference/file-conventions/not-found) |
| `template.tsx` | Like layout but re-mounts on navigation | [Docs](https://nextjs.org/docs/app/api-reference/file-conventions/template) |
| `default.tsx` | Fallback for parallel routes | [Docs](https://nextjs.org/docs/app/api-reference/file-conventions/default) |

### Root Layout (Required)

```typescript
// app/layout.tsx — MUST contain <html> and <body>
export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  )
}
```

## Route Organization

```
app/
├── (auth)/                  # Route group — no URL segment
│   ├── login/page.tsx       # /login
│   └── layout.tsx           # Shared auth layout
├── (dashboard)/             # Route group
│   ├── dashboard/page.tsx   # /dashboard
│   ├── plans/
│   │   ├── page.tsx         # /plans
│   │   └── [id]/
│   │       ├── page.tsx     # /plans/:id
│   │       └── loading.tsx  # Loading state for /plans/:id
│   └── layout.tsx           # Dashboard layout with sidebar
├── layout.tsx               # Root layout
└── page.tsx                 # / (home)
```

### Route Groups `(folder)`

> Organize routes without affecting the URL path. Use for shared layouts or logical grouping.
> **Reference**: https://nextjs.org/docs/app/building-your-application/routing/route-groups

### Dynamic Segments `[param]`

```typescript
// app/plans/[id]/page.tsx
export default async function PlanPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  // Fetch plan by id...
}
```

> **Reference**: https://nextjs.org/docs/app/api-reference/file-conventions/dynamic-routes

## Data Fetching

### Server Components (Recommended)

```typescript
// Fetch directly in the component — no useEffect, no loading state boilerplate
export default async function PlansPage() {
  const plans = await getPlans() // Direct async call
  return <PlanList plans={plans} />
}
```

### Client-Side Fetching (When Needed)

Use the typed API client pattern from `lib/api.ts`:

```typescript
'use client'

import { useEffect, useState } from 'react'
import { plansApi } from '@/lib/api'
import type { Plan } from '@/types'

export function PlanList() {
  const [plans, setPlans] = useState<Plan[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    plansApi.list()
      .then(({ plans }) => setPlans(plans))
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <LoadingSkeleton />
  return <div>{plans.map(p => <PlanCard key={p.id} plan={p} />)}</div>
}
```

## Middleware

> **Reference**: https://nextjs.org/docs/app/building-your-application/routing/middleware

Middleware runs **before** every matched request. Use for:
- Authentication checks (redirect unauthenticated users)
- Token refresh (via Supabase SSR)
- Redirects and rewrites

```typescript
// src/middleware.ts
import { NextRequest, NextResponse } from 'next/server'

export async function middleware(request: NextRequest) {
  // Auth logic here...
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|api).*)'],
}
```

## `'use client'` Boundary Best Practices

1. **Push `'use client'` as deep as possible** — keep pages as Server Components, wrap only the interactive parts
2. **Never put `'use client'` in `layout.tsx`** unless the entire layout tree needs client-side interactivity
3. **Create small, focused client components** — extract interactive pieces into their own files
4. **Pass Server data via props** — fetch in Server Component, pass to Client Component as serializable props

```
❌ BAD: 'use client' on the page
  page.tsx ('use client') — entire page ships JS

✅ GOOD: 'use client' only on interactive parts
  page.tsx (Server) → fetches data
    └── InteractiveWidget ('use client') → handles clicks
```

## Metadata & SEO

> **Reference**: https://nextjs.org/docs/app/building-your-application/optimizing/metadata

```typescript
// app/plans/[id]/page.tsx
import type { Metadata } from 'next'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>
}): Promise<Metadata> {
  const { id } = await params
  const plan = await getPlan(id)
  return {
    title: plan.title,
    description: `Study plan: ${plan.title}`,
  }
}
```
