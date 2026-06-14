# Próximos Passos — educar-se-ia

> Estado em: 2026-06-11 | Último commit: `c973705 apply tests missing`

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

## ✅ Concluído nesta sessão (2)

- **Bug fix crítico**: webhook do Stripe esperava `request.rawBody` (`config: { rawBody: true }`) mas nenhum plugin o populava — `constructEvent` sempre lançava "assinatura inválida" e o webhook nunca funcionava em produção. Corrigido registrando `fastify-raw-body` em `server.ts`. Isso desbloqueia o item 2 abaixo.
- **Testes de integração** (item 4): `routes/__tests__/{plans,exercises,skills,webhook}.test.ts` cobrindo 402/`LimitedResponse`, 429/`CooldownResponse` e o webhook do Stripe (assinatura real via `Stripe.webhooks.generateTestHeaderString`)
- 47/47 testes passando (apps/api), `tsc --noEmit` limpo em apps/api e apps/web
- README.md: tabela de planos atualizada para os 5 tiers (free/básico/pro/max/beta) + `.env` e `.env.example` com todas as `STRIPE_PRICE_ID_*`

## ✅ Concluído nesta sessão (3)

- **Os 4 itens de UI/UX do ciclo anterior** (ver seção "Melhorias de produto"
  abaixo) foram implementados:
  - `apps/web/src/components/DashboardSkeleton.tsx` — skeleton animado (3
    cards de stat + 3 linhas de plano) renderizado em `dashboard/page.tsx`
    enquanto `state === 'loading'`, junto do header real "Meus Planos"
  - Toast de confirmação (`sonner`, configurado em `app/layout.tsx`) em
    `plan/[id]/page.tsx` → `handleComplete`: sucesso = "Sessão concluída! Mais
    um passo na sua jornada.", erro = "Não foi possível registrar a sessão.
    Tente novamente."
  - `apps/web/src/app/not-found.tsx` — 404 customizada (ícone `SearchX`,
    "Página não encontrada", link "Voltar para o início" → `/`)
  - Empty state em `plan/[id]/page.tsx` quando `schedule.length === 0` —
    ícone `CalendarX`, "Nenhuma semana de estudos ainda", link "Voltar para o
    painel" → `/dashboard` (tabs de semana/barra de progresso ficam ocultos)
- **Ambiente de testes criado para `apps/web`** (antes só `apps/api` tinha
  testes): Vitest 4 + React Testing Library + jsdom, `vite-tsconfig-paths`
  resolve `@/*` e `@educarseia/types` direto do source (sem build). Config em
  `apps/web/vitest.config.ts` / `vitest.setup.ts`. Script `"test": "vitest
  run"` em `apps/web/package.json`.
- **`turbo.json`** ganhou task `"test": {}`; raiz tem `"test": "turbo run
  test"`. `packages/config` e `packages/types` ganharam `"test": "echo skip"`
  (mesmo padrão já usado para `type-check`) para o turbo não falhar nesses
  workspaces sem suíte própria.
- **21 testes novos em `apps/web`** cobrindo os 4 itens de UI/UX acima +
  `DashboardSkeleton`, `not-found`, `lib/constants.ts`, `useAsyncAction`,
  `dashboard/page.tsx` (loading/empty/lista/banner 80%) e `plan/[id]/page.tsx`
  (empty schedule, conclusão de sessão com toast de sucesso/erro).
- **Fix**: `vitest.setup.ts` não tinha `afterEach(cleanup)` do RTL — sem
  `globals: true` no Vitest, o cleanup automático não é registrado, e renders
  de testes anteriores ficavam acumulados no DOM (causando falsos negativos
  por elementos duplicados). Agora todo `__tests__/` futuro em `apps/web`
  já herda o cleanup correto.
- `npm run test` na raiz → **68/68 testes passando** (47 `apps/api` + 21
  `apps/web`); `npm run type-check` em `apps/web` limpo.

## ✅ Concluído nesta sessão (4) — Auth completeness + páginas LGPD

Gate de pré-beta: dois blockers identificados (sem fluxo de recuperação de
senha / `/auth/` vazio, sem páginas legais/exclusão de conta) foram fechados.

- **Footer compartilhado** (`components/Footer.tsx`) com links para
  `/termos`, `/privacidade` e `mailto:contato@educarse-ia.com.br`; landing
  page atualizada para usá-lo.
- **`/termos`** e **`/privacidade`** — páginas estáticas (Server Components)
  com conteúdo pt-BR completo (LGPD art. 18, operadores terceiros — Supabase/
  Stripe/Anthropic/YouTube, retenção, cookies disclosure-only). Operador é
  pessoa física: placeholders `[CPF do responsável]` e `[comarca]` em
  `/termos` ainda precisam ser preenchidos.
- **Middleware** (`middleware.ts`): matcher passou a excluir `/auth/*`
  (necessário para o callback PKCE rodar sem sessão); `/termos`/`/privacidade`
  adicionados a `publicPaths`.
- **`/auth/callback`** (route handler) + `lib/supabase-route.ts`
  (`createSupabaseRouteHandlerClient`, adapter `getAll`/`setAll`) — trata
  `exchangeCodeForSession`, usado tanto por confirmação de email quanto por
  recuperação de senha.
- **Fluxo de "esqueci minha senha"**: `/login` ganhou modos `forgot` /
  `forgot-sent` (`resetPasswordForEmail` → `/auth/callback?next=/auth/reset-password`)
  e `/auth/reset-password` (`'use client'`, valida sessão — mostra "Link
  inválido ou expirado" se ausente — senão formulário de nova senha via
  `updateUser`).
- **Exclusão de conta**: `DELETE /api/account` (`routes/account.ts`) cancela
  assinaturas Stripe ativas/trialing (log + segue em caso de erro) e chama
  `supabase.auth.admin.deleteUser` (cascade remove tudo). `accountApi.delete()`
  no client.
- **`/conta`**: página de perfil/plano/uso + `DeleteAccountModal` (confirma
  digitando "EXCLUIR"). Link no `Navbar` (ícone `Settings`).
- Signup em `/login` ganhou texto de consentimento com links para
  `/termos`/`/privacidade`.
- `npm run type-check` (4 workspaces) e `npm run test` (68/68) continuam
  passando; `npm run build --workspace=apps/web` gera todas as rotas novas
  (`/auth/callback` dinâmica, `/auth/reset-password`, `/conta`, `/termos`,
  `/privacidade` estáticas).

**Pendências fora do código (não esquecer antes do beta):**
- [x] ~~Configurar forwarding de email para `contato@educarse-ia.com.br`~~ ✅
      Feito (sessão 6) — Cloudflare Email Routing.
- [x] ~~Supabase Auth → URL Configuration → Redirect URLs~~ ✅ Feito (sessão 6)
      — `Site URL` + `/auth/callback` e `/**` para `localhost:3000` e
      `educarse-ia.com.br`. Fluxo "esqueci minha senha" testado end-to-end.
- [x] ~~Preencher `[CPF do responsável]` e `[comarca]` em `/termos`~~ ✅ Feito (sessão 5)

**Verificação manual pendente** (UI ainda não testada no browser pelo
usuário): footer da landing, `/termos`, `/privacidade`, fluxo "esqueci minha
senha" + tela de confirmação, consentimento no signup, `/auth/reset-password`
sem sessão, `/conta` + modal de exclusão, link do Navbar.

---

## ✅ Concluído nesta sessão (5) — SEO/shareability + comunidade Discord

- **`/termos`**: placeholders `[CPF do responsável]` → `860.763.795-96` e
  `[comarca]` → `Salvador/Bahia` preenchidos.
- **SEO & shareability**: `lib/constants.ts` ganhou `SITE_URL`
  (`https://educarse-ia.com.br`); `layout.tsx` ganhou `metadataBase` + OG/Twitter
  card completos (pt_BR, `summary_large_image`); novos `opengraph-image.tsx` e
  `icon.tsx` (favicon) gerados via `next/og` `ImageResponse` (indigo-600,
  wordmark + tagline / letter-mark "e" — sem assets binários); novos `robots.ts`
  (permite tudo exceto `/dashboard`, `/plan`, `/conta`, `/auth`) e `sitemap.ts`
  (`/`, `/planos`, `/termos`, `/privacidade`, `/login`).
- **Bug crítico em `middleware.ts`**: as novas rotas de metadata
  (`/robots.txt`, `/sitemap.xml`, `/icon`, `/opengraph-image`) estavam sendo
  redirecionadas (307) para `/login` pelo matcher de auth — corrigido excluindo
  essas rotas do matcher.
- **Bug crítico pré-existente**: `/planos` também redirecionava visitantes
  deslogados para `/login` — o link "Planos" da landing e qualquer link de
  pricing compartilhado não funcionavam para prospects. Adicionado a
  `publicPaths`.
- **Comunidade Discord**: novo card "Comunidade" em `/conta`, renderizado
  apenas quando `NEXT_PUBLIC_DISCORD_INVITE_URL` está definida (mesmo padrão de
  graceful degradation do `YOUTUBE_API_KEY`). Documentado em
  `.claude/CLAUDE.md` → `apps/web/.env.local`.
- Verificado via build + servidor de produção local: `/icon` e
  `/opengraph-image` retornam `image/png` (renderização visual confirmada),
  `/robots.txt` → `text/plain`, `/sitemap.xml` → `application/xml`, `/planos`
  → 200.
- 68/68 testes passando, `npm run type-check` limpo, `npm run build
  --workspace=apps/web` gera `/icon`, `/opengraph-image`, `/robots.txt`,
  `/sitemap.xml` como rotas estáticas.

**Análise de mercado — comunidade & marketing** (resumo da discussão):
- Grandes servidores Discord de estudos no Brasil (Study Community BR ~41k,
  Estudos em Evidência ~48k, Illuminapse) são genéricos/foco ENEM-vestibular —
  não competir por essa audiência.
- Recomendação: comunidade pequena e curada via convites pessoais aos usuários
  reais (padrão "alpha → beta invite-only → expansão por referral"), não um
  link público de "entre aqui".
- Canais diretos recomendados para o público real (universitários já
  matriculados, não vestibulandos): micro-influencers studygram/studytok
  focados em rotina universitária (5k-50k seguidores), grupos de WhatsApp/
  Telegram de turma, subreddits/grupos de universidades específicas. O demo
  "ementa → plano em 60s" é naturalmente bom para vídeo curto.

**Pendências fora do código:**
- [x] Servidor Discord configurado pelo usuário.
- [x] ~~Definir `NEXT_PUBLIC_DISCORD_INVITE_URL` em `apps/web/.env.local`~~ ✅
      Feito (sessão 6) — card "Comunidade" confirmado em `/conta`.
- [x] ~~Adicionar `NEXT_PUBLIC_DISCORD_INVITE_URL` nas env vars de produção
      (Vercel → projeto `funcionar-ia-api` → Production) + redeploy.~~ ✅
      Feito (sessão 6).
- [ ] Iniciar convites pessoais para os primeiros usuários reais.

---

## ✅ Concluído nesta sessão (6) — Blockers externos pré-beta: auth + email

- **Supabase Auth — Redirect URLs**: `Site URL` = `https://educarse-ia.com.br`;
  `Redirect URLs` ganharam `http://localhost:3000/auth/callback`,
  `http://localhost:3000/**`, `https://educarse-ia.com.br/auth/callback` e
  `https://educarse-ia.com.br/**`. Fluxo "esqueci minha senha" testado
  end-to-end (login → email → `/auth/callback` → `/auth/reset-password` →
  nova senha → `/dashboard`).
- **Email transacional (Supabase Auth) — Resend custom SMTP**: domínio
  `educarse-ia.com.br` verificado no Resend (DKIM via `resend._domainkey`,
  SPF em `send.educarse-ia.com.br` → `amazonses.com`); Supabase Auth → SMTP
  Settings configurado com `smtp.resend.com:465` / user `resend` / API key do
  Resend. Emails de auth agora saem de `noreply@educarse-ia.com.br`
  (confirmado "Delivered" no painel do Resend), substituindo o mailer padrão
  `noreply@mail.app.supabase.io` (rate-limited, baixa reputação).
- **DMARC**: adicionado `_dmarc.educarse-ia.com.br` TXT
  (`v=DMARC1; p=none; rua=mailto:contato@educarse-ia.com.br`) — ausente
  antes, é checado pelos filtros de spam do Gmail/Outlook.
- **Forwarding `contato@educarse-ia.com.br`**: Cloudflare Email Routing
  habilitado (MX `route{1,2,3}.mx.cloudflare.net` + SPF automáticos), regra
  custom → email pessoal verificado. Testado, email chegou (inicialmente em
  spam, esperado para domínio novo).
- **Bug de UX/segurança corrigido**: tela "forgot-sent" em `/login`
  (`apps/web/src/app/login/page.tsx`) afirmava "Enviamos um link..." mesmo
  quando o email não corresponde a nenhuma conta (GoTrue retorna 200 sempre,
  por design anti-enumeration). Copy ajustada para "Se houver uma conta
  cadastrada com [email], enviamos um link... Verifique também a caixa de
  spam." — não confirma/nega existência da conta, mas explica por que o
  email pode não chegar.
- **`NEXT_PUBLIC_DISCORD_INVITE_URL`**: definido em `apps/web/.env.local`
  (`https://discord.gg/F5Tqkk499v`) e nas env vars de produção (Vercel,
  `funcionar-ia-api`); card "Comunidade" confirmado em `/conta` e redeploy feito.
- 21/21 testes `apps/web` continuam passando (`npm run test --workspace=apps/web`).

> **Nota para o futuro**: se `educarse-ia.com.br` continuar caindo em spam
> mesmo com SPF/DKIM/DMARC corretos, é comportamento esperado de "cold domain"
> no Gmail/Outlook — melhora com volume/tempo de envio legítimo; marcar
> "não é spam" ajuda a treinar o filtro por destinatário.

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

### 2. ~~Testar o fluxo Stripe end-to-end~~ ✅ Feito

Pipeline completo (checkout → assinatura Stripe → webhook → upgrade de tier)
verificado via script novo **`apps/api/scripts/verify-stripe-e2e.mjs`**
(`npm run verify:stripe`, dentro de `apps/api/`). Não roda no `npm run test`
(vitest) — usa Stripe test mode + Supabase reais e cria/limpa um usuário
descartável a cada execução. Útil para revalidar após qualquer mudança de
config do Stripe.

Bugs encontrados e corrigidos no caminho:
- `STRIPE_SECRET_KEY` em `.env` era um placeholder (`sk_test_...`) — usuário
  substituiu pela chave real de test mode.
- `STRIPE_PRICE_ID_BASIC/PRO/MAX/BETA` apontavam para **preços de live mode**
  (a conta de test mode não tinha nenhum produto/preço). Catálogo espelhado
  para test mode (mesmos nomes/descrições/valores) e `.env` atualizado com os
  novos `price_...` de test mode.

Resultado da última execução: `POST /api/checkout` → 200 + url de checkout;
assinatura de teste criada na Basic; `POST /api/webhooks/stripe` → 200
`{received:true}`; `users.plan` virou `'basic'` e `stripe_customer_id` foi
persistido.

- [x] `npm run dev` (web :3000, api :3001)
- [x] Checkout (`/api/checkout`) cria sessão Stripe válida
- [x] Assinatura Stripe (cartão teste) → webhook `checkout.session.completed`
- [x] `users.plan = 'basic'` + `stripe_customer_id` atualizados via webhook
- [ ] Banner de 80% some no dashboard (lógica client-side, não coberta pelo script — `api_calls_this_month / maxApiCallsPerMonth`)
- [ ] Geração de exercícios libera 30 calls/mês no tier basic (coberto por `limits.test.ts`, mas não exercitado via chamada real à IA)

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

### 4. ~~Testes E2E básicos~~ ✅ Feito

`routes/__tests__/{plans,exercises,skills,webhook}.test.ts` cobrem 402/429 e o
webhook Stripe (assinatura real, `Fastify.inject`).

---

### 5. ~~packages/prompts — limpar ou remover~~ ✅ Feito (pacote removido)

---

### 6. ~~`npm run type-check` (raiz) está quebrado~~ ✅ Feito

Descoberto ao verificar a sessão de testes de integração — `tsc --noEmit -p
apps/api/tsconfig.json` e `tsc --noEmit -p apps/web/tsconfig.json` (rodados
diretamente) passavam limpos, mas o script da raiz falhava com 3 erros
independentes (TS6310 em `apps/api` por usar `tsc --build --noEmit` contra
referenced project `composite: true`, e scripts `type-check` ausentes em
`packages/types`/`packages/config`).

**Fix aplicado**: `apps/api/package.json` → `type-check` agora é `tsc --noEmit`
(sem `--build`); `packages/types/package.json` ganhou `"type-check": "tsc
--noEmit"`; `packages/config/package.json` ganhou `"type-check": "echo skip"`
(não tem `.ts` próprio, só presets de tsconfig). `npm run type-check` na raiz
agora passa limpo nos 4 workspaces; 47/47 testes de `apps/api` continuam
passando.

---

### 7. Testes automatizados para auth/LGPD (sessão "Concluído (4)")

Os itens A-F (footer/legal pages, forgot/reset password, exclusão de conta,
`/conta`) só foram cobertos por `type-check` + build, sem testes próprios.
Não bloqueia o beta, mas vale fechar antes de iterar mais nessas áreas. Plano
de testes detalhado por arquivo (segue os padrões já usados em
`routes/__tests__/*.test.ts` e `app/**/__tests__/*.test.tsx`):

#### `apps/api/src/routes/__tests__/account.test.ts` — `DELETE /api/account`

Mocks: `../../lib/supabase` (`supabase.from(...).select().eq().single()` +
`supabase.auth.admin.deleteUser`), `stripe` (`new Stripe()` →
`subscriptions.list`/`subscriptions.cancel`), `authenticate` decorator
(padrão `plans.test.ts`, `request.user = { sub: TEST_USER_ID }`).

- [ ] Sem `stripe_customer_id`: pula chamadas ao Stripe, chama `deleteUser(userId)`, retorna 204
- [ ] Com `stripe_customer_id` e assinatura `active`: `subscriptions.list({status:'active'})` retorna 1 sub → `subscriptions.cancel(sub.id)` chamado; `deleteUser` chamado; 204
- [ ] Com `stripe_customer_id` mas sem assinaturas `active`/`trialing`: `list` retorna vazio para os dois status, nenhum `cancel` chamado, `deleteUser` chamado, 204
- [ ] Falha do Stripe não bloqueia exclusão: `subscriptions.list`/`cancel` rejeita → erro logado (`fastify.log.error`), `deleteUser` ainda é chamado, 204
- [ ] Erro ao buscar usuário (`select().single()` retorna `error`): 500 `{ error: 'Erro ao buscar dados da conta.' }`, `deleteUser` não chamado
- [ ] `deleteUser` retorna `error`: 500 `{ error: 'Erro ao excluir conta.' }`

#### `apps/web/src/components/__tests__/Footer.test.tsx`

Sem mocks (Server Component estático, sem hooks).

- [ ] Link "Termos de Uso" → `href="/termos"`
- [ ] Link "Política de Privacidade" → `href="/privacidade"`
- [ ] Link "Contato" → `href="mailto:contato@educarse-ia.com.br"`
- [ ] Texto de copyright contém "educar-se-ia" e o ano atual

#### `apps/web/src/app/termos/__tests__/page.test.tsx` e `privacidade/__tests__/page.test.tsx`

Sem mocks — render direto do Server Component (função síncrona).

- [ ] `/termos`: `<h1>` "Termos de Uso"; presença das seções 1-9 (ex.: "1. Sobre o serviço", "3. Planos, cobrança e cancelamento", "9. Contato"); renderiza `<Footer />`
- [ ] `/privacidade`: `<h1>` "Política de Privacidade"; seções incluindo "3. Compartilhamento com terceiros" (Supabase/Stripe/Anthropic/YouTube) e "6. Cookies"; renderiza `<Footer />`
- [ ] Nota: se `[CPF do responsável]`/`[comarca]` ainda forem placeholders ao escrever o teste, não asserir o texto literal (vai mudar quando preenchido)

#### `apps/web/src/app/login/__tests__/page.test.tsx`

Mocks: `next/navigation` (`useRouter` → `push`/`refresh` como `vi.fn()`),
`@/lib/supabase` (`createClient` → `{ auth: { signInWithPassword, signUp,
resetPasswordForEmail } }`). `userEvent` para preencher/clicar.

- [ ] Modo `signin` (default): heading "Entrar na sua conta", campos email/senha, botão "Esqueci minha senha" visível
- [ ] Clicar "Esqueci minha senha" → modo `forgot`: heading "Redefinir senha", campo de senha desaparece, botão "Enviar link de redefinição"
- [ ] Submeter `forgot` com sucesso (`resetPasswordForEmail` → `{ error: null }`) → modo `forgot-sent`: "Verifique seu email" + email digitado + botão "Voltar para o login"
- [ ] `resetPasswordForEmail` chamado com `redirectTo` contendo `/auth/callback?next=/auth/reset-password`
- [ ] Submeter `forgot` com erro (`{ error: { message: 'X' } }`) → banner de erro "X", permanece em `forgot`
- [ ] "Voltar para o login" (em `forgot` e em `forgot-sent`) → volta para `signin`
- [ ] Alternar para `signup` → texto de consentimento "Ao criar conta, você concorda com os Termos de Uso e a Política de Privacidade." com links `href="/termos"` e `href="/privacidade"`
- [ ] Em `signup`, botão "Esqueci minha senha" não aparece

#### `apps/web/src/app/auth/reset-password/__tests__/page.test.tsx`

Mocks: `next/navigation` (`useRouter`), `sonner` (`toast.success`),
`@/lib/supabase` (`createClient` → `{ auth: { getSession, updateUser } }`).

- [ ] `getSession` → `{ session: null }` → "Link inválido ou expirado" + link "Voltar para o login" → `/login`
- [ ] `getSession` → `{ session: {...} }` → heading "Criar nova senha", campos "Nova senha"/"Confirmar nova senha", botão "Salvar nova senha"
- [ ] Senha < 6 caracteres → erro "A senha precisa ter pelo menos 6 caracteres.", `updateUser` não chamado
- [ ] Senhas diferentes → erro "As senhas não coincidem.", `updateUser` não chamado
- [ ] Sucesso (`updateUser` → `{ error: null }`) → `toast.success('Senha atualizada com sucesso!')`, `router.push('/dashboard')`, `router.refresh()`
- [ ] `updateUser` → `{ error: { message: 'X' } }` → banner de erro "X", sem redirect

#### `apps/web/src/app/conta/__tests__/page.test.tsx`

Mocks: `@/lib/supabase` (`createClient` → `{ auth: { getUser }, from }`,
padrão `mockSingle`/`mockEq`/`mockSelect`/`mockFrom` de `dashboard/page.test.tsx`),
`@/components/DeleteAccountModal` (`() => null`, padrão de mock de
`plan/[id]/page.test.tsx`).

- [ ] Loading (`getUser` pendente): spinner visível, heading "Minha Conta" ausente
- [ ] Erro (`getUser` → `{ user: null }` ou `single()` → `error`): "Não foi possível carregar os dados da sua conta."
- [ ] Sucesso — Perfil: heading "Minha Conta", email + `full_name`/`university`/`course`/`semester` quando presentes
- [ ] Sucesso — Perfil com campos opcionais ausentes: `<dt>` correspondentes não renderizados
- [ ] Plano `free` com `api_calls_this_month: 8`: badge "Grátis", "Até 2", "10 por mês", barra "8 / 10"
- [ ] Plano `max` (limites `null`): "Ilimitado" para planos e gerações, sem barra de uso
- [ ] Link "Gerenciar assinatura" → `href="/planos"`
- [ ] Clicar "Excluir conta" → `DeleteAccountModal` é renderizado (mock visível)

#### `apps/web/src/components/__tests__/DeleteAccountModal.test.tsx`

Mocks: `next/navigation` (`useRouter`), `sonner` (`toast.success`),
`@/lib/api` (`accountApi.delete`), `@/lib/supabase` (`createClient` →
`{ auth: { signOut } }`).

- [ ] Botão de exclusão desabilitado por padrão e com texto parcial/incorreto (ex.: "excluir", "EXCLU")
- [ ] Digitar exatamente "EXCLUIR" habilita o botão
- [ ] Sucesso: `accountApi.delete()` resolve → `signOut()` → `toast.success('Conta excluída com sucesso.')` → `router.push('/')` + `router.refresh()`
- [ ] Erro: `accountApi.delete()` rejeita → mensagem inline de erro, modal permanece aberto (`onClose` não chamado)
- [ ] Botão "Fechar" (X) e clique no overlay → chamam `onClose`

#### Fora de escopo

`/auth/callback` (route handler) fica fora do Vitest+RTL atual — exige mock
de `next/headers`/`@supabase/ssr` em ambiente de Route Handler; avaliar se
vale um teste dedicado ou cobrir via E2E (Playwright) futuro.

---

### 8. ~~Renomear repositório GitHub para alinhar com a marca~~ ✅ Feito

O repositório no GitHub se chamava `funcionarIA` (nome do projeto antes do
rebranding), enquanto domínio (`educarse-ia.com.br`), pacote raiz
(`educarseia`) e workspaces (`@educarseia/*`) já usavam a marca atual.

**Ação no GitHub:**
- [x] Settings → General → Repository name → `educarse-ia`

**Depois de renomear:**
- [x] Remote local atualizado: `git remote set-url origin git@github.com:pedronapoli-dev/educarse-ia.git`
      (`git fetch` não pôde ser testado neste ambiente — agente SSH sem
      identidades carregadas, problema pré-existente do sandbox, não
      relacionado ao rename; testar `git fetch`/`pull` no terminal normal)
- [x] Vercel: projeto `funcionar-ia-api` (apps/web, domínios
      `educarse-ia.com.br`/`www.educarse-ia.com.br`) consultado via MCP —
      `live`/deployment `READY`, domínios intactos. O link do GitHub App é
      por ID de repositório, então segue o rename automaticamente; campo de
      git link não é exposto pela API consultada, então vale uma checagem
      visual rápida em Project Settings → Git
- [x] Railway (apps/api): conexão GitHub quebrou após o rename ("GitHub Repo
      not found" na branch de produção, mesmo após reconfigurar o GitHub App)
      — projeto Railway foi deletado e recriado do zero. Ver seção
      "Recriação completa do projeto Railway" abaixo.
- [x] Busca por links hardcoded para `funcionarIA` em README.md/DEPLOY.md/
      package.json/vercel.json/.github — nenhuma referência encontrada
      (apenas paths locais `/Users/pedro/Developer/funcionaria/funcionaria`,
      fora de escopo)

> Nota: nome do projeto na Vercel (`funcionar-ia-api`) e o path local
> (`~/Developer/funcionaria/funcionaria`) ainda usam a marca antiga — cosmético,
> não bloqueia nada, renomear é opcional/separado deste item.

---

#### Recriação completa do projeto Railway (efeito colateral do rename)

O rename do repo GitHub quebrou a conexão do serviço Railway de forma
irrecuperável via reconexão simples (mesmo após desinstalar/reinstalar o
GitHub App, a branch de produção continuava com "GitHub Repo not found").
Solução: deletar o projeto Railway inteiro e recriar do zero.

**Reconstrução** (`apps/api`, segue DEPLOY.md seção 3):
- Source: `pedronapoli-dev/educarse-ia`, branch `main`, root directory `/`,
  Dockerfile path `apps/api/Dockerfile`, start command vazio
- Variáveis copiadas do `apps/api/.env` local (arquivo local não é afetado
  pela exclusão do projeto Railway — todos os secrets continuavam intactos)
- Domínio público auto-gerado: `educarse-ia-production.up.railway.app`

**Problemas encontrados e correções:**
- GitHub App do Railway precisou ser reinstalado com acesso explícito ao
  repo `educarse-ia` (não estava na lista de "Only select repositories")
- Custom domain `api.educarse-ia.com.br` → 404 "Application not found"
  (`x-railway-fallback: true`). Causa: registro CNAME `api` no Cloudflare
  estava proxied (orange cloud), então o verificador do Railway não
  conseguia confirmar o CNAME apontando para o novo target
  (`vwnu87dv.up.railway.app`). **Corrigido** com o botão "Connect" (One-click
  DNS Setup do Cloudflare) no modal "Configure DNS Records" do Railway.
- Depois do DNS corrigido → 502 `"Application failed to respond"` (erro do
  próprio Railway, não mais do Cloudflare). Causa: porta do custom domain
  estava configurada como `3001` (= `EXPOSE 3001` do Dockerfile / fallback
  `process.env.PORT ?? 3001` no código), mas o Railway injeta `PORT=8080` em
  produção — o app na verdade escuta em `8080`. **Corrigido** trocando a
  porta do custom domain de `3001` → `8080`.

**Resultado final:** `https://api.educarse-ia.com.br/health` → `200
{"status":"ok"}`. `git push origin main` confirmado funcionando (branch local
em sync com `origin/main`, commit `8448784`).

> ⚠️ **Nota para o futuro:** se o custom domain do Railway voltar a dar
> "Application failed to respond", confira a porta configurada em
> Settings → Networking — deve ser `8080` (porta injetada pelo Railway em
> produção), **não** `3001` (porta default do código/Dockerfile, só usada
> localmente).

**Loose end não investigado:** durante a reconfiguração do GitHub App,
apareceu um toast "Environment deleted" na aba Settings → Environments do
repo GitHub, com um ambiente "Production" restante. Provavelmente metadata de
deployment tracking do Railway (cosmético, deve se recriar sozinho no próximo
deploy) — confirmar que não afeta nada se notar comportamento estranho em
status checks de PR/commit no futuro.

---

### 9. `npm run lint` está quebrado (pré-existente, fora do escopo da CI)

Descoberto ao configurar `.github/workflows/ci.yaml`: `npm run lint` falha na
raiz por três causas independentes, nenhuma relacionada à branch
`foundation/ci` (confirmado via diff contra `main` — `turbo.json`,
`apps/api/package.json`, `apps/web/package.json` idênticos):

- **`apps/api`**: ESLint 9.39.4 instalado, mas o script é `eslint src --ext .ts`
  (sintaxe pré-v9) e não existe `eslint.config.js` (flat config).
- **`apps/web`**: Next.js 16 removeu `next lint`; o script `"lint": "next lint"`
  falha com "Invalid project directory provided, no such directory:
  apps/web/lint".
- **`packages/types`** e **`packages/config`**: não têm script `lint`, então
  `turbo run lint` falha com "Missing script: lint".

`ci.yaml` roda sem o step de lint até isso ser corrigido. Migração necessária:
criar `eslint.config.js` (flat config) para `apps/api`; decidir substituto
para `next lint` em `apps/web` (ESLint flat config standalone com
`@next/eslint-plugin-next`, ou `@eslint/eslintrc` compat); adicionar script
`lint` (real ou `"echo skip"`, mesmo padrão de `type-check`/`test`/`build`) em
`packages/types` e `packages/config`.

---

## 🟡 Melhorias de produto (próximo ciclo)

### UI/UX
- [x] Loading skeleton no dashboard ✅ Feito (ver "Concluído nesta sessão (3)")
- [x] Toast de confirmação ao completar sessão de estudo ✅ Feito
- [x] Página de erro 404 customizada ✅ Feito
- [x] Empty state melhor no `/plan/[id]` quando não há semanas ✅ Feito

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

# Checar tipos (todos os workspaces)
npm run type-check

# Rodar testes (apps/api + apps/web via Turbo, 68 testes)
npm run test

# Commitar o que ficou pendente desta sessão
git add -A && git commit -m "feat: testes apps/web + UI/UX (skeleton, toast, 404, empty state)"
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
apps/web/src/app/not-found.tsx             ← 404 customizada
apps/web/src/app/dashboard/page.tsx        ← dashboard (loading skeleton, banner 80%)
apps/web/src/app/plan/[id]/page.tsx        ← detalhe do plano (toast, empty state)
apps/web/src/components/DashboardSkeleton.tsx  ← skeleton de loading
apps/web/src/components/LimitReachedBlock.tsx  ← CTA de upgrade
apps/web/src/hooks/useAsyncAction.ts       ← hook com limitError
apps/web/vitest.config.ts                  ← config Vitest + RTL (apps/web)
packages/types/src/index.ts               ← PLAN_LIMITS e todos os tipos
```
