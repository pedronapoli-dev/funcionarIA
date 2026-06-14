# Contexto do educar-se-ia

Leia na fase 1 (diagnóstico) e sempre que for gerar código. Aqui está o produto, a
stack, as convenções do repo, a auditoria da identidade atual e os atributos de
marca que ancoram as decisões.

## Índice
1. O produto
2. Público
3. Stack e convenções do repositório (restrições técnicas)
4. Auditoria da identidade atual
5. Atributos de marca (âncoras de decisão)
6. Telas-chave a tratar

---

## 1. O produto

Gerador de planos de estudo com IA: o estudante envia a ementa (PDF/texto) de uma
disciplina e recebe um cronograma semanal personalizado com teoria, prática,
revisão espaçada (SM-2) e exercícios adaptativos. Diferencial central:
**fundamentação pedagógica real** — Freire (autonomia), Piaget (construtivismo),
Vygotsky (ZDP/scaffolding), Bloom (taxonomia + maestria), Darcy Ribeiro (educação
integral), Sweller (carga cognitiva), Ebbinghaus (repetição espaçada).

Recursos: níveis de Bloom por sessão, scaffolding progressivo, critérios de
maestria, revisão espaçada, check-in semanal, recalibração quando o aluno trava.
Tiers: free / basic / pro / max / beta. Lançamento beta é o horizonte imediato —
a identidade precisa estar à altura para os primeiros usuários.

## 2. Público

Estudantes brasileiros (universitários e vestibulandos, principalmente), muitas
vezes sob pressão de prazo/prova, lendo conteúdo denso (inclusive exatas). Isso
puxa o design para: calma, foco, baixa carga cognitiva, legibilidade alta,
confiança/credibilidade, e um tom acolhedor (não infantil, não corporativo frio).

## 3. Stack e convenções do repositório

Restrições que toda entrega de código deve respeitar (fonte: CLAUDE.md do projeto):

- **Frontend**: Next.js 16 (App Router), React 18, **Tailwind 3.4**. Monorepo
  Turborepo. App em `apps/web/`.
- **Tailwind config**: `apps/web/tailwind.config.ts`. Hoje só estende
  `fontFamily.sans = Inter`. É aqui que entram os tokens.
- **Estilos globais/componentes**: `apps/web/src/app/globals.css` com
  `@layer base/components`. Já existem `.btn/.btn-primary/.btn-secondary/.btn-ghost`,
  `.card`, `.badge-*`, `.page-header`, `.form-section`. **Estenda esse padrão**,
  não crie sistema paralelo.
- **Componentes** em `apps/web/src/components/` (PascalCase): `DayItem`,
  `CheckinCard`, `ExerciseModal`, `RecalibrateModal`, `LimitReachedBlock`,
  `CooldownNotice`, `BloomBadge`, `Navbar`, `Footer`.
- **Regras de código**: TypeScript `strict`, sem `any`; Server Components por
  padrão (`'use client'` só quando há estado/efeito/evento, e o mais fundo
  possível); usar `cn()` (clsx + tailwind-merge) para compor classes; **sem inline
  styles**; arrow functions; tipos compartilhados em `@educarseia/types`.
- **Idioma**: código em inglês; **strings de usuário em pt-BR**.
- **Ícones**: `lucide-react` já é usado (ex.: `GraduationCap`, `Sparkles`).
- **Regra de ouro do projeto**: NUNCA gambiarra — causa raiz, solução
  estruturalmente correta. Vale para design também.

Implicação prática: tokens entram como CSS variables em `globals.css` +
mapeamento em `tailwind.config.ts`; componentes existentes são refatorados sobre
os tokens; novos componentes seguem os mesmos utilitários (`.btn`, `.card`...).

## 4. Auditoria da identidade atual

O que existe hoje (estado "Tailwind UI de fábrica"):

- **Tipografia**: só Inter, sem fonte de display; tamanhos definidos ad hoc por
  utilitário (`text-3xl`... `text-5xl`) sem escala documentada.
- **Cor**: primária `indigo-600`; neutros `gray-*`; estados via `green/amber/red/
  purple` soltos nos badges. Sem tokens semânticos, sem cor de marca própria, sem
  escala intencional. Indigo+gray é o default mais reconhecível (= invisível).
- **Forma**: `rounded-md`/`rounded-lg`/`rounded-xl` misturados sem regra; sombras
  só `shadow-sm` + `ring-1` (chapado, sem escala de elevação).
- **Marca/símbolo**: ícone `GraduationCap` (lucide) numa caixa `bg-indigo-600` —
  genérico, não é uma marca, qualquer edtech usa.
- **Movimento**: só `transition-colors`. Sem sistema de motion.
- **OG/ícone**: `opengraph-image.tsx` e `icon.tsx` existem — candidatos a
  redesign assim que a identidade fechar.

Diagnóstico-resumo: competente e sem voz. O trabalho não é "consertar bugs
visuais", é **dar um rosto** que só poderia ser do educar-se-ia.

## 5. Atributos de marca (âncoras de decisão)

Proposta de território a validar com o Peu (use como ponto de partida, não dogma).
Cinco atributos defensáveis, derivados do produto e do público:

1. **Rigoroso** — fundamentado em ciência; transmite método, não palpite.
2. **Claro** — reduz carga cognitiva; cada coisa no seu lugar (Sweller/Mayer).
3. **Confiável** — credibilidade acadêmica; o estudante aposta o tempo dele aqui.
4. **Humano/acolhedor** — Freire: respeita a autonomia; encoraja, não pune.
5. **Focado** — calmo, sem ruído; ajuda a concentrar sob pressão.

Tensão produtiva a equilibrar: **rigor acadêmico × calor humano**. Nem frio
corporativo, nem fofo infantil. A identidade vive nesse ponto. Implicações
plausíveis (a fundamentar caso a caso): paleta com um acento de marca próprio
(sair do indigo default) sobre neutros calmos e levemente quentes; um display com
caráter para títulos + sans altíssima legibilidade no corpo; geometria e
espaçamento generosos (foco); cor de estado funcional, não decorativa.

## 6. Telas-chave a tratar (prioridade para o beta)

- `/` (landing) — primeira impressão; é onde a marca convence. Maior alavanca.
- `/dashboard` — lista de planos, estados vazios, banner de uso.
- `/plan/[id]` — detalhe do plano; navegação por semana; `DayItem`, check-in,
  recalibração. É o coração do uso recorrente.
- `/plan/new` — wizard de 5 passos (segmentação — preservar).
- `/planos` — pricing; conversão.
- `/login` — entrada.
- Marca aplicada: `icon.tsx`, `opengraph-image.tsx`, e peças externas (Canva).
