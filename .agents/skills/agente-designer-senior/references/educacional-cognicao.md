# Design educacional, cognição e acessibilidade

Este é o arquivo que torna a skill *do educar-se-ia* e não de um SaaS qualquer. O
produto é fundamentado em teoria da aprendizagem; a interface precisa aplicar a
mesma ciência. Use na fase 2 (estratégia) e na fase 5 (validação).

## Índice
1. A ponte: design = pedagogia vista de outro ângulo
2. Carga cognitiva (Sweller) aplicada à UI
3. Os 12 princípios de Mayer (aprendizagem multimídia) aplicados
4. WCAG 2.2 AA — acessibilidade como requisito
5. Checklist cognitivo-pedagógico de validação

---

## 1. A ponte

O educar-se-ia já cita Sweller (carga cognitiva) e o ecossistema de aprendizagem.
Mayer estende Sweller para *materiais visuais/multimídia* — ou seja, é a teoria
mais diretamente aplicável a interfaces de aprendizagem. Quando você reduz ruído
visual, você não está só "deixando limpo": está reduzindo processamento
extrínseco que rouba memória de trabalho do estudante. Cada decisão de UI tem
leitura cognitiva. Use isso como argumento de marca: *a interface ensina porque
respeita os limites da cognição.*

## 2. Carga cognitiva (John Sweller)

Três tipos de carga sobre a memória de trabalho (que é limitada):

- **Intrínseca**: a dificuldade inerente do conteúdo (o cálculo em si). Não dá
  para eliminar, mas dá para sequenciar (scaffolding — o produto já faz).
- **Extrínseca**: imposta por *como* a informação é apresentada. É o que o design
  controla. Layout confuso, ruído, redundância, navegação obscura = carga
  extrínseca desperdiçada. **Eliminar isto é o trabalho do designer.**
- **Pertinente (germane)**: o esforço produtivo de construir esquemas. Quer-se
  *liberar* memória da extrínseca para sobrar para a pertinente.

Implicação direta: cada elemento de UI que não serve à tarefa compete por memória
de trabalho que deveria estar aprendendo. Minimalismo aqui é pedagógico, não
estético.

## 3. Os 12 princípios de Mayer aplicados ao educar-se-ia

Princípios da Teoria Cognitiva da Aprendizagem Multimídia. Para cada, a leitura
de interface:

**Reduzir processamento extrínseco:**
1. **Coerência** — remova palavras, imagens e enfeites que não ensinam. (Efeito
   forte e replicado.) Tradução UI: corte decoração, gráficos gratuitos, texto
   redundante. Casa com Nielsen #8 e Krug.
2. **Sinalização (signaling)** — destaque a estrutura essencial com pistas
   (títulos, ênfase, numeração, cor com função). Hierarquia tipográfica e badges
   são sinalização.
3. **Redundância** — não repita a mesma info em canais que competem (ex.: texto
   na tela duplicando narração). Em UI: não rotule o óbvio três vezes; um
   significante claro basta.
4. **Contiguidade espacial** — coloque rótulos/explicações *perto* do que
   descrevem (erro junto do campo, dica junto da sessão, não em rodapé distante).
   É Gestalt da proximidade com base empírica.
5. **Contiguidade temporal** — feedback no momento da ação (confirmação imediata
   ao concluir um dia, não depois).

**Gerenciar processamento essencial:**
6. **Segmentação** — quebre em pedaços controlados pelo usuário (o wizard de 5
   passos, semanas→dias). Não despeje tudo de uma vez.
7. **Pré-treinamento** — introduza conceitos/termos antes da tarefa complexa
   (tooltips, onboarding leve, legenda de badges).
8. **Modalidade** — palavra+imagem em canais distintos quando possível.

**Fomentar processamento generativo:**
9. **Multimídia** — palavra + imagem ensina mais que só palavra (use diagramas/
   ícones com função, não ilustração decorativa — cuidado para não violar
   coerência).
10. **Personalização** — tom conversacional, pt-BR humano (o produto já adota).
11. **Voz** — tom humano e acolhedor (Freire: autonomia, respeito ao estudante).
12. **Imagem/Embodiment** — presença social com parcimônia; não force mascote se
    não servir ao aprendizado.

Regra de ouro: quando dois princípios competirem (ex.: multimídia × coerência),
**coerência ganha** — adicionar imagem só se ela ensina.

## 4. WCAG 2.2 nível AA — requisitos

Acessibilidade não é opcional nem "fase 2": é restrição de design desde o token.
Critérios que mais impactam decisões visuais:

- **1.4.3 Contraste (mínimo)** — texto normal **4.5:1**; texto grande (≥24px, ou
  ≥18.66px/14pt bold) **3:1**. Verifique com `scripts/check_contrast.py`.
- **1.4.11 Contraste de não-texto** — componentes de UI e ícones essenciais e
  estados de foco: **3:1** contra o adjacente.
- **1.4.1 Uso de cor** — informação nunca *só* por cor; some ícone/rótulo/forma.
- **1.4.4 / 1.4.10 Redimensionar e reflow** — texto até 200% e layout a 320px sem
  perda; use unidades relativas (rem), não px fixos para tipografia.
- **2.4.7 / 2.4.11 Foco visível e não obscurecido** (2.2 reforça) — todo
  interativo tem estado de foco claro (≥3:1). O projeto usa `focus-visible:outline`
  — mantenha e padronize via token.
- **2.5.8 Tamanho de alvo (mínimo)** — alvos de toque **≥24×24px** (recomendado
  44×44; ver Lei de Fitts). Cheque botões/toggles pequenos como o de "concluído".
- **3.3 Entradas / labels** — todo campo com label associado (o projeto já estiliza
  `label` global — bom; garanta associação `for`/`id`).

Entregue sempre a tabela de contraste dos pares principais e marque quaisquer que
fiquem só em AA grande (não AA normal) para decisão consciente.

## 5. Checklist cognitivo-pedagógico (fase 5)

Antes de entregar qualquer tela/sistema, responda:

- O que aqui é **carga extrínseca** que dá para remover sem perder função?
- A **sinalização** deixa a estrutura óbvia em 1 segundo de varredura?
- Rótulos/erros/dicas estão **espacialmente contíguos** ao que descrevem?
- O feedback é **temporalmente contíguo** à ação?
- A informação está **segmentada** em blocos digeríveis (Miller/7±2)?
- Nenhuma informação depende **só de cor** (1.4.1)?
- Todos os pares de texto passam em **contraste AA**?
- Foco visível e alvos de toque adequados?
- O tom é humano e respeitoso (Freire/Mayer personalização)?

Se algum item falha, conserte a estrutura — não compense com mais decoração.

## Fontes
- Sweller, J. — Cognitive Load Theory (1988; e síntese 2011).
- Mayer, R. E. *Cognitive Theory of Multimedia Learning*; "Principles for Reducing
  Extraneous Processing" (Cambridge Handbook of Multimedia Learning, cap. 12).
- W3C — Web Content Accessibility Guidelines (WCAG) 2.2, nível AA.
