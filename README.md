# FuncionarIA

> Transforme sua ementa em um plano de estudos personalizado em menos de 60 segundos.

---

## Estrutura do Monorepo (Turborepo)

```
funcionaria/
├── apps/
│   ├── web/           # Next.js 14 · TypeScript · Tailwind CSS
│   └── api/           # Fastify 4 · TypeScript · Node.js 20
├── packages/
│   └── types/         # @funcionaria/types — fonte única de verdade para tipos
├── turbo.json         # Pipeline: build, dev, lint, type-check
├── package.json       # Workspace root + scripts globais
├── tsconfig.json      # TypeScript base herdado pelos apps
└── .npmrc             # npm workspaces config
```

### Por que Turborepo?

| Benefício | Impacto prático |
|-----------|----------------|
| `turbo dev` paralelo | Um comando sobe web + api com logs organizados |
| Cache inteligente | Sem mudanças no api? Build não roda de novo |
| `@funcionaria/types` compartilhado | Tipos definidos uma vez, nunca dessincronizam |
| Pipeline declarativa | Ordem de build garantida entre pacotes |

---

## Início Rápido

### Pré-requisitos
- Node.js 20+
- Conta no [Supabase](https://supabase.com)
- Chave da [Anthropic API](https://console.anthropic.com)
- Conta no [Stripe](https://stripe.com) (pode deixar para depois)

### 1. Instalar (uma vez, na raiz)
```bash
npm install
```

### 2. Configurar variáveis
```bash
cp apps/api/.env.example  apps/api/.env
cp apps/web/.env.example  apps/web/.env.local
# Preencha os valores em cada arquivo
```

### 3. Criar banco de dados
Execute `apps/api/src/lib/schema.sql` no SQL Editor do Supabase.

### 4. Rodar
```bash
npm run dev
# web → http://localhost:3000
# api → http://localhost:3001/health
```

---

## Comandos

```bash
npm run dev          # web + api em paralelo
npm run build        # build de produção com cache
npm run type-check   # TypeScript em todos os apps
npm run lint         # lint em todos os apps
npm run clean        # limpa artefatos de build

# App específico
npx turbo dev --filter=@funcionaria/web
npx turbo dev --filter=@funcionaria/api
```

---

## `@funcionaria/types` — Regra de uso

```typescript
// No frontend — sempre via alias local @/types
import type { Plan, Subject, Exercise } from '@/types'

// No backend
import type { Plan, Subject, Exercise } from '@funcionaria/types'

// Adicionar tipo novo que existe nos dois lados?
// → packages/types/src/index.ts  (nunca duplique)
```

---

## Variáveis de Ambiente

### `apps/api/.env`
| Variável | Onde encontrar |
|----------|---------------|
| `SUPABASE_URL` | Supabase → Settings → API |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase → Settings → API ⚠️ nunca exponha |
| `ANTHROPIC_API_KEY` | console.anthropic.com |
| `JWT_SECRET` | Supabase → Settings → API → JWT Secret |
| `STRIPE_SECRET_KEY` | Stripe → Developers → API Keys |
| `STRIPE_WEBHOOK_SECRET` | Stripe → Webhooks → Signing secret |
| `STRIPE_PRICE_ID_PRO` | Stripe → Products → Price ID |
| `FRONTEND_URL` | `http://localhost:3000` em dev |

### `apps/web/.env.local`
| Variável | Onde encontrar |
|----------|---------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase → Settings → API |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase → Settings → API (seguro expor) |
| `NEXT_PUBLIC_API_URL` | `http://localhost:3001` em dev |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Stripe → Developers |

---

## Deploy

| App | Plataforma | Root dir |
|-----|-----------|----------|
| `@funcionaria/web` | Vercel | `apps/web` |
| `@funcionaria/api` | Railway | `apps/api` |
| Banco | Supabase | — |

---

## Stack

| | Tecnologia |
|-|-----------|
| Frontend | Next.js 14 · Tailwind CSS |
| Backend | Fastify 4 · Node.js 20 |
| Banco | Supabase (PostgreSQL + Auth) |
| IA | Claude API · claude-sonnet-4-6 |
| Pagamentos | Stripe |
| Orquestração | Turborepo 2 |
| Linguagem | TypeScript 5 (end-to-end) |
