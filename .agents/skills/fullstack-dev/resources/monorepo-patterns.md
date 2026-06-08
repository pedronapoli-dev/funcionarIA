# Monorepo Patterns (Turborepo)

> Based on [Turborepo Official Documentation](https://turbo.build/repo/docs) — v2.x

## Project Structure

```
funcionaria/
├── apps/
│   ├── web/                # @funcionaria/web — Next.js 16 frontend
│   └── api/                # @funcionaria/api — Fastify 5 backend
├── packages/
│   ├── types/              # @funcionaria/types — shared TypeScript types
│   ├── config/             # @funcionaria/config — shared configuration
│   └── prompts/            # @funcionaria/prompts — AI prompt templates
├── turbo.json              # Pipeline configuration
├── package.json            # Root workspace + global scripts
├── tsconfig.json           # Base TypeScript config (inherited)
└── .npmrc                  # npm workspaces configuration
```

## Workspace Configuration

> **Reference**: https://turbo.build/repo/docs/crafting-your-repository/structuring-a-repository

### Root `package.json`

```json
{
  "name": "funcionaria",
  "private": true,
  "workspaces": ["apps/*", "packages/*"],
  "scripts": {
    "dev":        "turbo run dev",
    "build":      "turbo run build",
    "lint":       "turbo run lint",
    "type-check": "turbo run type-check",
    "clean":      "turbo run clean && rm -rf node_modules"
  },
  "devDependencies": {
    "turbo":      "^2.0.0",
    "typescript": "^5.4.5"
  },
  "engines": {
    "node": ">=20"
  },
  "packageManager": "npm@10.5.0"
}
```

### `turbo.json` Pipeline

> **Reference**: https://turbo.build/repo/docs/reference/configuration

```json
{
  "$schema": "https://turbo.build/schema.json",
  "tasks": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": [".next/**", "dist/**"]
    },
    "dev": {
      "cache": false,
      "persistent": true
    },
    "lint": {},
    "type-check": {
      "dependsOn": ["^build"]
    },
    "clean": {
      "cache": false
    }
  }
}
```

| Key | Purpose |
|---|---|
| `dependsOn: ["^build"]` | Run dependencies' `build` first |
| `outputs` | Files to cache (`.next/`, `dist/`) |
| `cache: false` | Don't cache `dev` or `clean` |
| `persistent: true` | Long-running task (dev server) |

## Import Conventions

### Shared Types

```typescript
// Frontend (apps/web) — via path alias (@/ → src/)
import type { Plan, Subject, Exercise } from '@/types'

// Backend (apps/api) — via package name
import type { Plan, Subject, Exercise } from '@funcionaria/types'
```

> **Rule**: NEVER duplicate types across apps. All shared types go to `packages/types/src/index.ts`.

### Re-export Pattern (Frontend)

```typescript
// apps/web/src/types/index.ts — re-exports from the shared package
export type {
  Plan,
  Subject,
  Exercise,
  ScheduleWeek,
  ScheduleDay,
  // ... all types used in the frontend
} from '@funcionaria/types'
```

This allows the frontend to use `@/types` consistently while the actual types live in the shared package.

## Adding a New Shared Package

### Step-by-step

1. **Create the package directory**:

```bash
mkdir -p packages/new-package/src
```

2. **Create `package.json`**:

```json
{
  "name": "@funcionaria/new-package",
  "version": "0.1.0",
  "private": true,
  "main": "src/index.ts",
  "types": "src/index.ts",
  "scripts": {
    "build": "tsc",
    "type-check": "tsc --noEmit",
    "clean": "rm -rf dist"
  },
  "devDependencies": {
    "typescript": "^5.4.5"
  }
}
```

3. **Create `tsconfig.json`** (extends root):

```json
{
  "extends": "../../tsconfig.json",
  "compilerOptions": {
    "outDir": "dist",
    "rootDir": "src"
  },
  "include": ["src"]
}
```

4. **Add as dependency** in consuming apps:

```json
// apps/web/package.json or apps/api/package.json
{
  "dependencies": {
    "@funcionaria/new-package": "*"
  }
}
```

5. **Install** from root:

```bash
npm install
```

## TypeScript Configuration Inheritance

> **Reference**: https://www.typescriptlang.org/tsconfig#extends

### Root `tsconfig.json` (Base Config)

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true
  }
}
```

### App-specific configs extend root:

```json
// apps/web/tsconfig.json
{
  "extends": "../../tsconfig.json",
  "compilerOptions": {
    "jsx": "preserve",
    "paths": { "@/*": ["./src/*"] }
  }
}
```

## Common Commands

```bash
# Development (all apps in parallel)
npm run dev

# Development (single app)
npx turbo dev --filter=@funcionaria/web
npx turbo dev --filter=@funcionaria/api

# Build (respects dependency order)
npm run build

# Type checking (all packages)
npm run type-check

# Lint (all packages)
npm run lint

# Clean (build artifacts + node_modules)
npm run clean
```

> **Reference**: https://turbo.build/repo/docs/reference/run#--filter-string

## Caching

> **Reference**: https://turbo.build/repo/docs/crafting-your-repository/caching

Turborepo caches task outputs automatically. If you change code in `apps/api` but not in `apps/web`, running `npm run build` will:
1. Rebuild `apps/api` (files changed)
2. Use cached output for `apps/web` (no changes detected)
3. Rebuild `packages/types` only if its source changed

### Cache Invalidation

The cache key includes:
- File contents (hashed)
- Environment variables referenced in the code
- `turbo.json` configuration
- Dependencies' outputs

### When to Disable Caching

```json
{
  "tasks": {
    "dev":   { "cache": false, "persistent": true },
    "clean": { "cache": false }
  }
}
```

## Best Practices

1. **Keep packages focused**: Each package should have a clear, single purpose
2. **Use `*` for internal deps**: `"@funcionaria/types": "*"` — npm resolves to the local workspace version
3. **Root devDependencies only**: Global tools (`turbo`, `typescript`) go in root `package.json`
4. **No circular dependencies**: If A depends on B, B cannot depend on A
5. **Type-check before build**: Add `"dependsOn": ["^build"]` to `type-check` so shared packages are built first
