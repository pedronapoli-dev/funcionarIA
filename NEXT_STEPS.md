# Próximos Passos — educar-se-ia

> Estado em: 2026-06-10 | Último commit: `d9d8416 update claude.md`

---

## ✅ O que foi feito (não refazer)

- Stripe integrado: 4 produtos/preços, checkout, webhook, mapeamento tier → plano
- Limites por tier: `checkPlansLimit` + `checkAndIncrementApiCall` em `lib/limits.ts` (18 testes passando)
- Degradação graciosa: 402 → `ApiLimitError` → `limitError` em `useAsyncAction` → `LimitReachedBlock`
- ExerciseModal, RecalibrateModal, CheckinCard todos tratando 402 separado de erro genérico
- Página `/planos` com pricing cards e `/planos/sucesso`
- Banner de aviso 80% no dashboard
- Link "Planos" no header da landing
- Migration 004 aplicada no Supabase
- CLAUDE.md atualizado

---

## ✅ Concluído nesta sessão

- **Migration 005**: `increment_api_calls` RPC aplicada (SECURITY DEFINER, EXECUTE restrito a `service_role`); `limits.ts` atualizado para chamar via fire-and-forget em planos `max`
- **Migration 006**: tabela `skill_usage_log` criada (RLS habilitado)
- **Cooldowns**: `lib/cooldowns.ts` (24h checkin / 168h recalibrate, por plan_id ou por usuário) wired em `routes/skills.ts`; 429 + `CooldownResponse` → `ApiCooldownError` → `cooldownError` → `CooldownNotice` (CheckinCard + RecalibrateModal)
- Bug fix: `runRecalibration` não recebia `plan_id` (Phase 2 MCP nunca ativava) — corrigido
- **packages/prompts removido**: pacote deletado, lockfile limpo, referências em CLAUDE.md/AGENTS.md/copilot-instructions.md removidas
- 31/31 testes passando (apps/api), `tsc --noEmit` limpo em apps/api e apps/web

---

## 🔴 Pendências técnicas (por prioridade)

### 1. ~~Migration 005 — tracking de calls em planos ilimitados~~ ✅ Feito

Planos `max` nunca bloqueiam, mas o contador `api_calls_this_month` não é incrementado.
Precisa de uma stored procedure para incremento atômico (evita race condition).

**Rodar no Supabase SQL Editor:**
```sql
-- Migration 005: incremento atômico de api_calls para planos ilimitados
CREATE OR REPLACE FUNCTION increment_api_calls(user_id uuid)
RETURNS void
LANGUAGE sql
SECURITY DEFINER
AS $$
  UPDATE public.users
  SET api_calls_this_month = api_calls_this_month + 1
  WHERE id = user_id;
$$;
```

**Depois, atualizar `apps/api/src/lib/limits.ts`** — substituir o bloco de planos ilimitados:
```typescript
if (maxApiCallsPerMonth === null) {
  // fire-and-forget: não bloqueia, só registra
  supabase.rpc('increment_api_calls', { user_id: userId }).then(() => {})
  return { allowed: true }
}
```

---

### 2. Testar o fluxo Stripe end-to-end

O webhook está configurado em modo **test** no Stripe. Verificar:

- [ ] `npm run dev` (web :3000, api :3001)
- [ ] Abrir `/planos`, clicar em "Assinar" no plano Básico
- [ ] Completar checkout no Stripe (cartão teste: `4242 4242 4242 4242`)
- [ ] Verificar se o `plan` do usuário foi atualizado no Supabase (`users.plan = 'basic'`)
- [ ] Verificar se o banner de upgrade some no dashboard
- [ ] Testar geração de exercícios: deve liberar 30 calls/mês em vez de 10

---

### 3. ~~Cooldown de checkin/recalibrate~~ ✅ Feito

Hoje o usuário pode fazer check-in/recalibrar infinitas vezes no mesmo dia.
A intenção (comentada no código) era limitar a 1x por semana.

**Arquivo:** `apps/api/src/routes/skills.ts`

Implementar verificação simples antes de chamar `checkAndIncrementApiCall`:
```typescript
// Verificar última vez que fez checkin para este plan+week
const { data: lastCheckin } = await supabase
  .from('study_sessions') // ou uma tabela dedicada
  .select('created_at')
  .eq('plan_id', planId)
  .eq('type', 'checkin')
  .order('created_at', { ascending: false })
  .limit(1)
  .single()

const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000)
if (lastCheckin && new Date(lastCheckin.created_at) > oneDayAgo) {
  return reply.status(429).send({ error: 'Já fez check-in hoje. Volte amanhã.' })
}
```

> Nota: pode precisar de coluna `type` na tabela `study_sessions` ou tabela separada `checkins`.

---

### 4. Testes E2E básicos (opcional mas recomendado antes do launch)

Hoje só `limits.ts` tem testes. Considerar ao menos testes de integração para:

- `POST /api/plans` retorna 402 quando limite atingido
- `POST /api/exercises/generate` retorna 402 + `LimitedResponse` shape
- Webhook Stripe atualiza `users.plan` corretamente

**Sugestão:** usar `supertest` + mock do Supabase client (mesmo padrão dos testes de limits).

---

### 5. ~~packages/prompts — limpar ou remover~~ ✅ Feito (pacote removido)

---

## 🟡 Melhorias de produto (próximo ciclo)

### UI/UX
- [ ] Loading skeleton no dashboard (hoje carrega sem indicador)
- [ ] Toast de confirmação ao completar sessão de estudo
- [ ] Página de erro 404 customizada
- [ ] Empty state melhor no `/plan/[id]` quando não há semanas

### Funcionalidades
- [ ] Export do plano em PDF (mencionado no roadmap, adiado)
- [ ] Compartilhar plano (link público read-only)
- [ ] Notificações de revisão espaçada (email ou push)
- [ ] Diagnóstico pedagógico acessível da landing (preview sem login)

---

## 🔧 Setup no VS Code / Claude Code

```bash
# Abrir projeto
cd /Users/pedro/Developer/funcionaria/funcionaria

# Rodar tudo
npm run dev

# Checar tipos
cd apps/api && npm run type-check
cd apps/web && npx tsc --noEmit

# Rodar testes
cd apps/api && npm run test

# Commitar o que ficou pendente desta sessão
git add -A && git commit -m "feat: limit enforcement UI + tests + CLAUDE.md"
```

### Variáveis de ambiente necessárias

| Arquivo | Variável | Onde pegar |
|---|---|---|
| `apps/api/.env` | `STRIPE_PRICE_ID_BASIC` | Dashboard Stripe → Products |
| `apps/api/.env` | `STRIPE_PRICE_ID_PRO` | Dashboard Stripe → Products |
| `apps/api/.env` | `STRIPE_PRICE_ID_MAX` | Dashboard Stripe → Products |
| `apps/api/.env` | `STRIPE_PRICE_ID_BETA` | Dashboard Stripe → Products |
| `apps/api/.env` | `STRIPE_WEBHOOK_SECRET` | Dashboard Stripe → Webhooks |
| `apps/web/.env.local` | `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Dashboard Stripe → API Keys |

---

## 📁 Arquivos-chave para orientação rápida

```
.claude/CLAUDE.md                          ← contexto completo do projeto
apps/api/src/lib/limits.ts                 ← lógica de limites por tier
apps/api/src/lib/__tests__/limits.test.ts  ← testes (vitest)
apps/api/src/routes/checkout.ts            ← POST /api/checkout
apps/api/src/routes/webhook.ts             ← Stripe webhook
apps/web/src/app/planos/page.tsx           ← página de pricing
apps/web/src/components/LimitReachedBlock.tsx  ← CTA de upgrade
apps/web/src/hooks/useAsyncAction.ts       ← hook com limitError
packages/types/src/index.ts               ← PLAN_LIMITS e todos os tipos
```
