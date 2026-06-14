# Design system e linguagem visual

Como construir as fundações (fase 3) e os componentes (fase 4). Foco em decisões
sistêmicas — tokens, escalas, cor, elevação — não em telas isoladas.

## Índice
1. Refactoring UI (Wathan & Schoger) — o núcleo prático
2. Tokens semânticos e a arquitetura de design tokens
3. Cor — construir escalas e papéis
4. Espaçamento e a escala base-4/8
5. Elevação, profundidade e sombra
6. Atomic Design (Brad Frost)
7. Material Design 3 e Apple HIG — o que pegar emprestado (e o que não)
8. IBM Carbon — rigor de sistema
9. Receita de saída para Tailwind 3.4 + CSS variables

---

## 1. Refactoring UI — o núcleo prático

O livro mais acionável para fazer UI parecer profissional sem talento "artístico".
Princípios centrais:

- **Comece pela funcionalidade, não pela moldura.** Desenhe o conteúdo antes da
  decoração; cor e sombra vêm por último.
- **Hierarquia é tudo.** Não dependa só de tamanho de fonte para hierarquia —
  use **peso** e **cor** (um cinza mais claro recua; mais escuro avança). Texto
  secundário ≠ fonte menor necessariamente; muitas vezes é cor mais suave.
- **Não centralize tudo; use poucos pesos e tamanhos.** Defina um conjunto
  fechado (ex.: 5–7 tamanhos, 2–3 pesos) e nunca saia dele.
- **Espaço em branco generoso, depois remova.** Comece com mais respiro do que
  parece necessário; densifique só onde fizer sentido (tabelas, dashboards).
- **Use cor com intenção, em escalas.** Você precisa de muito mais tons do que
  imagina: ~8–10 passos por matiz (não só claro/médio/escuro). Defina uma cor de
  marca e neutros com leve temperatura, não cinza puro.
- **Profundidade com sombra + cor**, emulando luz vinda de cima (ver seção 5).
- **Trabalhe em escala de cinza primeiro** para forçar hierarquia por
  espaçamento/contraste antes de "resolver" com cor.
- **Dê personalidade via tipografia, cor e linguagem** — é onde a marca vive.

## 2. Tokens semânticos — arquitetura

Tokens em duas (ou três) camadas. Esta separação é o que torna o sistema
manutenível e tematizável:

- **Primitivos / referência**: a paleta crua. `blue-500: #3b82f6`, `gray-900`,
  etc. Ninguém consome direto na UI.
- **Semânticos / sistema**: papéis. `--color-primary`, `--color-surface`,
  `--color-on-surface`, `--color-border`, `--color-success`. A UI consome *estes*.
- **(Opcional) componente**: `--button-bg`, escopados a um componente.

Por que importa: trocar tema (claro/escuro, ou rebranding) muda o mapeamento
semântico→primitivo num lugar só. Nomear por *função* (`on-primary`) e não por
*valor* (`white`) evita o caos quando a cor muda. É o modelo de Material 3 e
Carbon. Sempre entregue tokens semânticos, não só a paleta crua.

## 3. Cor — escalas e papéis

**Construa escalas, não cores soltas.** Para cada matiz funcional (marca,
neutro, sucesso, alerta, erro, info) gere ~10 passos (50→900). Use espaço
perceptual (HSL/OKLCH) para passos uniformes ao olho; ajuste matiz e saturação ao
longo da escala (tons escuros levemente mais saturados/deslocados).

**Papéis a definir:**
- *Primária* (ação principal, marca) + *on-primary* (texto sobre ela).
- *Neutros* com leve temperatura alinhada à marca (não `#000`/cinza puro).
  Texto principal raramente é preto puro; fundo raramente branco puro.
- *Superfícies*: fundo de página, card, elevado.
- *Semânticas de estado*: sucesso/alerta/erro/info — cada uma com fundo-suave +
  texto + borda (o projeto já tem `badge-green/amber/red` ad hoc; sistematize).
- *Bordas/divisores* em opacidades, não cinzas chapados.

**Contraste é restrição, não enfeite.** Todo par texto/fundo passa por
`scripts/check_contrast.py`. AA = 4.5:1 (texto normal), 3:1 (texto grande ≥24px
ou ≥18.66px bold) e 3:1 para componentes/ícones (WCAG 2.2 — ver
`educacional-cognicao.md`).

**Não dependa só de cor** para transmitir informação (daltonismo) — combine cor
com ícone/rótulo/forma. (WCAG 1.4.1 Use of Color.)

## 4. Espaçamento — escala base-4/8

Adote uma escala restrita derivada de 4 (e múltiplos de 8 para os passos
maiores): `4, 8, 12, 16, 24, 32, 48, 64, 96`. Razões:

- Elimina o "quase alinhado": valores arbitrários (13px, 19px) produzem ruído
  perceptível. (Refactoring UI — sistemas de espaçamento.)
- Tailwind já é base-4 (`1`=4px, `2`=8px...). Use a escala nativa; só estenda se
  precisar de passos faltantes.
- Espaçamento é Gestalt aplicado: a proximidade comunica agrupamento. Use
  *menos* espaço dentro de um grupo e *mais* entre grupos. O erro comum é espaço
  uniforme em tudo, que apaga a hierarquia.

## 5. Elevação, profundidade e sombra

- **Luz vem de cima.** Sombra embaixo, e topo levemente mais claro. Sombras reais
  têm blur e spread suaves, não uma linha dura.
- **Escala de elevação** (Material): poucos níveis (ex.: 0/1/2/3/6) mapeados a
  papéis (card de repouso, hover, dropdown, modal). Quanto mais alto, mais
  sombra + menos opacidade de borda.
- O projeto hoje usa só `ring-1` + `shadow-sm` — chapado. Introduza uma escala de
  sombra de marca (sombras coloridas levíssimas no tom neutro, não cinza puro,
  parecem mais ricas — truque do Refactoring UI).

## 6. Atomic Design (Brad Frost)

Mentalidade de composição, do menor ao maior:
**Átomos** (cor, tipo, ícone, input, label) → **Moléculas** (campo = label+input+
erro; badge) → **Organismos** (`DayItem`, `CheckinCard`, header) → **Templates**
(layout de tela) → **Páginas** (instância com dados reais).

Implicação: nunca redesenhe uma página com valores soltos. Defina/atualize os
átomos e moléculas (tokens + componentes em `globals.css` e `components/`) e a
página se monta a partir deles. Consistência emerge da composição, não da
disciplina manual.

## 7. Material Design 3 e Apple HIG — o que pegar

- **Material 3**: excelente referência para *arquitetura de tokens* (roles:
  primary/secondary/tertiary, surface/on-surface, container variants), elevação,
  estados (hover/focus/pressed com state layers) e tematização clara/escura.
  *Não* importe o visual "Google" — pegue o sistema, não a aparência.
- **Apple HIG**: clareza, deferência (UI cede espaço ao conteúdo), profundidade.
  Ótimo para alvos de toque, foco em conteúdo e moderação. Mesma regra: princípio,
  não estética da Apple.

Cuidado: copiar a *aparência* de Material/Apple recria genérico (parecer Google/
Apple também é parecer com todo mundo). Pegue **estrutura e estados**, expresse
com a marca própria.

## 8. IBM Carbon — rigor de sistema

Carbon é referência de como um design system corporativo documenta tokens, grid
2x (base-8), tipografia em escala e estados de componente de forma rigorosa e
acessível por padrão. Use como modelo de *como documentar* o sistema do
educar-se-ia (o brand book deve ter o mesmo nível de especificidade).

## 9. Receita de saída — Tailwind 3.4 + CSS variables

Padrão de entrega de tokens para este repo (ver convenções em
`educar-se-ia-context.md`):

1. **CSS variables semânticas** em `globals.css` (`@layer base :root { ... }`),
   com bloco `.dark` se houver tema escuro. Nomeie por papel.
2. **`tailwind.config.ts`** mapeando as variáveis: `theme.extend.colors.primary:
   'rgb(var(--color-primary) / <alpha-value>)'` (armazene como canais RGB para
   suportar opacidade do Tailwind), `fontFamily`, `spacing` (só extensões),
   `borderRadius`, `boxShadow`, `fontSize` (com line-height pareado).
3. **Componentes** em `@layer components` (`.btn`, `.card`, `.badge-*`) refeitos
   sobre os tokens semânticos — o projeto já segue esse padrão, então estenda-o
   em vez de criar paralelo.
4. **Tabela de contraste** validada acompanhando a entrega.

Ver `assets/design-tokens-template.css` para o esqueleto.

## Fontes
- Wathan, A. & Schoger, S. *Refactoring UI* (2018), refactoringui.com.
- Material Design 3 — m3.material.io (design tokens, color roles, elevation).
- Apple Human Interface Guidelines — developer.apple.com/design.
- IBM Carbon Design System — carbondesignsystem.com.
- Frost, B. *Atomic Design* (2016), atomicdesign.bradfrost.com.
