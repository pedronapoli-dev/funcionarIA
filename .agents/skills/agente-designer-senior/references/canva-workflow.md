# Fluxo de assets visuais (Canva)

Para peças visuais externas/de marketing — OG images, capas, posts de lançamento
beta, banners. Para gráficos/ícones *dentro* do app, prefira SVG/código (versionável,
acessível, sem dependência externa). Use o Canva quando a peça é uma imagem
finalizada para distribuição.

## Pré-requisito: a identidade primeiro

Não gere peças antes de a identidade estar definida (fases 2–3). Uma peça do Canva
sem tokens de marca vira mais um genérico. Sequência correta: estratégia → tokens
(cor, tipo) → *então* peças que aplicam esses tokens. Leve cores (hex) e fontes
decididas para dentro do Canva.

## Ferramentas Canva disponíveis (MCP)

A conexão Canva expõe, entre outras (nomes podem variar conforme a sessão):

- `list-brand-kits` — ver brand kits existentes (cores, fontes, logos salvos).
- `generate-design` / `generate-design-structured` — gerar design a partir de
  prompt; a versão *structured* aceita especificação mais controlada.
- `create-design-from-brand-template` / `search-brand-templates` — partir de
  template de marca para consistência.
- `upload-asset-from-url` — subir logo/imagem (ex.: um SVG de marca exportado).
- `get-design` / `get-design-thumbnail` / `get-design-content` — inspecionar.
- `export-design` / `get-export-formats` — exportar PNG/PDF/etc.
- `resize-design` — gerar variações de tamanho (OG 1200×630, story, post).
- `perform-editing-operations` + `start/commit-editing-transaction` — edições
  programáticas com transação.

Sempre confira as ferramentas realmente disponíveis na sessão antes de assumir.

## Fluxo recomendado

1. **Cheque o brand kit** (`list-brand-kits`). Se não houver um com a identidade
   nova, considere criar/registrar as cores e fontes decididas para reuso.
2. **Defina a especificação da peça**: dimensão (OG = 1200×630; quadrado social =
   1080×1080; story = 1080×1920), mensagem, hierarquia (1 ideia por peça —
   coerência de Mayer), cores e fontes de marca.
3. **Gere** com `generate-design-structured` passando a spec, ou parta de um
   `brand-template`. Aplique os tokens (não as cores default do Canva).
4. **Revise** com `get-design-thumbnail`; cheque contraste do texto sobre fundo
   (mesma régua AA — `scripts/check_contrast.py`).
5. **Exporte** (`export-design`) no formato alvo e **gere variações** com
   `resize-design`.
6. Para OG image do app, lembre que já existe `apps/web/src/app/opengraph-image.tsx`
   — decida se a peça será estática (Canva→arquivo) ou gerada por código (mantém
   no repo, versionável). Para algo dinâmico/versionado, código é melhor; para
   campanha pontual, Canva serve bem.

## Princípios de marca nas peças

- Uma mensagem por peça; hierarquia inequívoca; muito respiro.
- Cor de marca como acento sobre neutros (Albers: acento rende cercado de calma).
- Tipografia da marca (display + corpo), não as fontes default do template.
- Contraste AA inclusive em peça de marketing — legibilidade é credibilidade.
- Consistência entre peças (mesmos tokens) constrói reconhecimento.

## Se o Canva não estiver conectado

Sugira a conexão (registro de conectores) ou entregue a peça como SVG/HTML
renderizável e/ou via skill de imagem, mantendo os mesmos tokens de marca.
