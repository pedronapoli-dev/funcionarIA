# Fundamentos de UX e usabilidade

Princípios atemporais para diagnosticar (fase 1) e validar (fase 5). Estes são os
filtros que separam "parece bom" de "funciona". Use o vocabulário daqui para
nomear problemas com precisão em vez de dizer "ficou estranho".

## Índice
1. Don Norman — princípios de design centrado no humano
2. As 10 heurísticas de Nielsen (com aplicação ao educar-se-ia)
3. Steve Krug — "Don't Make Me Think"
4. Leis quantitativas: Fitts, Hick-Hyman, Miller
5. Princípios de Gestalt
6. Como aplicar nas fases 1 e 5

---

## 1. Don Norman — *The Design of Everyday Things*

A base de tudo. Norman define que um objeto bem desenhado se explica sozinho.
Conceitos operacionais:

- **Affordances**: o que um elemento permite fazer. Um botão deve *parecer*
  clicável. Quando você "achata" demais a UI, mata affordances — usuário não sabe
  o que é interativo. No educar-se-ia, cards de sessão, toggles de "concluído" e
  botões de exercício precisam de affordance inequívoca.
- **Signifiers**: pistas que comunicam a affordance (sublinhado em link, sombra
  em botão, cursor). Affordance sem signifier é affordance escondida.
- **Mapping**: relação entre controle e efeito. Ordene controles espacialmente
  como o efeito que produzem (ex.: progresso da esquerda→direita).
- **Feedback**: toda ação precisa de resposta imediata e visível (estado de
  loading ao gerar plano, confirmação ao marcar dia concluído).
- **Constraints**: limitar opções para evitar erro (desabilitar "avançar" até
  campos obrigatórios; ver `LimitReachedBlock` como constraint visível).
- **Conceptual model & mappings**: a UI deve refletir o modelo mental do usuário
  (semana → dias → sessões espelha como o estudante pensa o cronograma).

Norman também: **erro é falha de design, não do usuário**. Previna (constraints),
e quando ocorrer, torne recuperável (mensagens claras, não becos sem saída).

## 2. As 10 heurísticas de Nielsen (Nielsen Norman Group)

Use como checklist de validação. Para cada, a leitura no contexto do produto:

1. **Visibilidade do status do sistema** — o usuário sempre sabe o que está
   acontecendo? (geração de plano com progresso real, não spinner mudo).
2. **Correspondência sistema↔mundo real** — linguagem do estudante, pt-BR,
   metáforas pedagógicas, não jargão técnico interno.
3. **Controle e liberdade** — saídas claras, desfazer (ex.: desmarcar dia
   concluído, voltar etapas no wizard de 5 passos).
4. **Consistência e padrões** — mesmo componente, mesmo comportamento em todo
   lugar. É exatamente o que um design system garante.
5. **Prevenção de erros** — melhor que boa mensagem de erro é não deixar errar
   (validação, constraints).
6. **Reconhecer em vez de lembrar** — mostre opções, não exija memória; badges de
   tipo/Bloom tornam o estado reconhecível à primeira vista.
7. **Flexibilidade e eficiência** — atalhos para experientes sem atrapalhar
   novatos.
8. **Estética e design minimalista** — cada elemento extra compete por atenção.
   Ecoa direto a coerência de Mayer (ver `educacional-cognicao.md`).
9. **Ajudar a reconhecer e recuperar de erros** — mensagens em linguagem humana,
   com causa e saída (o padrão `{ error: string }` do projeto precisa virar UI
   acionável).
10. **Ajuda e documentação** — disponível quando necessária, contextual.

## 3. Steve Krug — *Don't Make Me Think*

Lei de Krug: **uma página deve ser óbvia, autoexplicativa.** Cada ponto de
interrogação na cabeça do usuário é carga cognitiva que afasta. Princípios
práticos:

- Não faça pensar em *onde clicar* nem *o que isto significa*.
- Convenções existem por um motivo — só quebre quando a alternativa for
  claramente melhor.
- Hierarquia visual = importância visual. O que importa mais é maior/mais forte/
  mais destacado.
- "Satisficing": usuários escolhem a primeira opção razoável, não a ótima. Torne
  a opção certa a mais visível.
- Elimine palavras: "get rid of half the words, then get rid of half of what's
  left." Casa com a coerência de Mayer.

## 4. Leis quantitativas

- **Lei de Fitts**: tempo para atingir um alvo ∝ distância / tamanho. Logo: alvos
  importantes maiores e mais perto; CTAs generosos; alvos de toque ≥ 44×44px
  (também critério WCAG 2.2 — Target Size, ver `educacional-cognicao.md`).
- **Lei de Hick-Hyman**: tempo de decisão cresce com nº de opções. Reduza
  escolhas por tela; agrupe e revele progressivamente (o wizard de 5 passos já
  faz isso — preserve).
- **Miller (7±2)** e **chunking**: memória de trabalho é limitada. Agrupe
  informação em blocos. Direto ligado à carga cognitiva de Sweller.

## 5. Princípios de Gestalt

Como o olho agrupa formas — a gramática da hierarquia visual:

- **Proximidade**: elementos próximos são lidos como grupo. O espaçamento *é*
  semântica: aproxime o que se relaciona, afaste o que não.
- **Similaridade**: itens parecidos são lidos como do mesmo tipo (consistência de
  badges por tipo de sessão).
- **Continuidade / alinhamento**: o olho segue linhas; alinhe a uma grade.
- **Fechamento**: a mente completa formas — permite UIs mais leves.
- **Figura/fundo**: garanta separação clara (contraste, elevação) entre conteúdo
  e superfície.
- **Região comum**: um container (card) une o que está dentro.

Proximidade e similaridade fazem 80% do trabalho de organização — antes de
adicionar linhas e caixas, ajuste espaçamento e repetição.

## 6. Aplicação nas fases

**Fase 1 (diagnóstico):** percorra as 10 heurísticas e Gestalt sobre a tela
atual; nomeie cada violação com o princípio. Ex.: "o status de geração do plano
viola Visibilidade do status (Nielsen #1) — spinner sem progresso".

**Fase 5 (validação):** rode o mesmo checklist no *novo* design. Se uma decisão
melhora uma heurística mas piora outra, explicite o trade-off e a razão da
escolha.

## Fontes
- Norman, D. *The Design of Everyday Things* (ed. revista, 2013).
- Nielsen, J. "10 Usability Heuristics for User Interface Design", Nielsen Norman Group.
- Krug, S. *Don't Make Me Think, Revisited* (2014).
- Fitts (1954); Hick (1952)/Hyman (1953); Miller (1956).
- Wertheimer / escola Gestalt; síntese em NN/g "Gestalt Principles".
