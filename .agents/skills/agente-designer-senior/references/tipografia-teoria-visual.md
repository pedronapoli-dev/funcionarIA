# Tipografia e teoria visual

Onde a personalidade da marca mais aparece — e onde o "tudo em Inter, tamanhos
soltos" do estado atual mais denuncia o genérico. Use na fase 3 (fundações).

## Índice
1. Escala tipográfica modular (Bringhurst → Brown)
2. Ellen Lupton — *Thinking with Type*
3. Pareamento de fontes e seleção
4. Müller-Brockmann — sistemas de grid
5. Josef Albers — cor é relacional
6. Saída prática para o sistema

---

## 1. Escala tipográfica modular

Não escolha tamanhos de fonte ao acaso. Uma **escala modular** é uma sequência
gerada por uma razão a partir de um tamanho base — produz harmonia análoga à
musical (Bringhurst formalizou; Tim Brown adaptou à web).

- **Base**: 16px para corpo na web (padrão de legibilidade do navegador).
- **Razão**: escolha conforme o tom. Comuns: 1.2 (terça menor, discreto), **1.25
  (terça maior — ótimo equilíbrio para produto)**, 1.333 (quarta justa, mais
  dramático), 1.5 (quinta, editorial/expressivo). Para uma ferramenta de estudo
  que valoriza calma e foco, 1.2–1.25 costuma ser certo; reserve razões maiores
  para landing/marketing.
- **Gere a escala** multiplicando/dividindo pela razão e *arredonde* para passos
  utilizáveis. Ex. (base 16, ~1.25): 12 · 14 · 16 · 20 · 25 · 31 · 39 · 49 px.
- **Pareie cada tamanho com line-height.** Corpo: 1.5–1.65 (leitura confortável,
  importa para conteúdo educacional denso). Títulos: 1.1–1.25 (mais apertado
  quanto maior). Tailwind permite `fontSize: ['1rem', { lineHeight: '1.6' }]`.
- **Medida (comprimento de linha)**: 45–75 caracteres por linha para corpo
  (Bringhurst). Use `max-w-prose`/`max-w-2xl` em blocos de texto longo — relevante
  nas telas de plano e exercício.

## 2. Ellen Lupton — *Thinking with Type*

Referência canônica de tipografia aplicada. Pontos operacionais:

- **Hierarquia** se constrói com tamanho, peso, cor, espaço e estilo — combine,
  não dependa de um só eixo (ecoa Refactoring UI).
- **Espaçamento entre letras (tracking)**: textos grandes/títulos geralmente
  pedem tracking levemente *negativo*; texto em caixa-alta e pequeno pede
  tracking *positivo* (os rótulos `uppercase tracking-wider` do projeto estão
  corretos nisso).
- **Kerning, leading, alinhamento**: prefira alinhamento à esquerda para corpo
  (justificado na web cria "rios" sem hifenização). Evite centralizar blocos
  longos.
- **Hierarquia tipográfica > ornamento**: uma página com tipografia bem ordenada
  dispensa molduras e cores para se organizar.

## 3. Pareamento e seleção de fontes

- **Contraste com harmonia**: pareie fontes que diferem o suficiente para criar
  hierarquia mas compartilham proporções/era. Combo clássico e seguro: um
  **display/headline com personalidade** (serifada moderna ou grotesca de caráter)
  + um **sans neutro altíssima legibilidade** para corpo/UI.
- **Por que sair do "só Inter"**: Inter é excelente para UI — mantenha-a como
  candidata forte para corpo/interface. O problema não é Inter, é *só* Inter sem
  voz de marca. Uma fonte de display distinta nos títulos da landing e do brand
  já cria identidade sem sacrificar legibilidade onde ela mais importa.
- **Performance e robustez**: prefira fontes variáveis (um arquivo, muitos pesos),
  com `font-display: swap` e fallback de sistema. Menos pesos carregados = menos
  custo. Para PT-BR, garanta cobertura de acentuação completa.
- **Legibilidade do público**: estudantes lendo conteúdo denso sob pressão —
  priorize altura-x generosa, formas abertas, números legíveis (importante para
  conteúdo de cálculo/exatas que aparece nos planos).

## 4. Müller-Brockmann — sistemas de grid

*Grid Systems in Graphic Design*: a grade é a estrutura invisível que dá ordem,
clareza e objetividade — exatamente os valores do educar-se-ia.

- **Grade de colunas** (ex.: 12 colunas) com calhas consistentes organiza layout
  responsivo; alinhe tudo a ela (Gestalt: alinhamento/continuidade).
- **Ritmo vertical**: relacione espaçamentos verticais a uma unidade base
  (base-4/8) para um "baseline" coerente.
- **Objetividade**: a grade serve à legibilidade da informação, não ao ego do
  designer. Casa com a coerência de Mayer — estrutura reduz carga cognitiva.

## 5. Josef Albers — *Interaction of Color*

**A cor é relacional**: a mesma cor parece diferente conforme o vizinho. Implica:

- Avalie cores *em contexto* (no componente real), nunca isoladas no seletor.
- O mesmo cinza de texto "muda" sobre branco vs. sobre card levemente colorido —
  por isso o contraste se verifica no par real (script), não na cor sozinha.
- Use a relatividade a favor: um acento de marca rende mais cercado de neutros
  calmos do que competindo com outras cores saturadas.

## 6. Saída prática

Ao definir tipografia no sistema, entregue:
- Família(s) escolhida(s) com justificativa (papel display vs. corpo/UI) e
  estratégia de carregamento.
- A **escala** completa (tamanho + line-height + peso + tracking sugerido) por
  papel: display, h1–h4, body, body-sm, caption, overline.
- Regras de medida (max-width de leitura) para blocos longos.
- Como vira `theme.extend.fontFamily` e `fontSize` no Tailwind (ver
  `design-system-visual.md` seção 9).

## Fontes
- Bringhurst, R. *The Elements of Typographic Style*.
- Brown, T. — modularscale.com; "More Meaningful Typography".
- Lupton, E. *Thinking with Type* (2ª ed.).
- Müller-Brockmann, J. *Grid Systems in Graphic Design*.
- Albers, J. *Interaction of Color*.
