import type { Config } from 'tailwindcss'

// educar-se-ia — Tailwind 3.4 config
// Paleta: Teal-Petróleo × Terracota × Creme
//
// Cores mapeadas de CSS variables em canais RGB "R G B" para suportar
// modificador de opacidade do Tailwind: bg-primary/80, text-accent/60 etc.
//
// Tokens semânticos (color-*) são os únicos que a UI deve usar.
// Primitivos (teal-*, terra-*, creme-*) ficam disponíveis para casos
// em que a escala crua é necessária (ex.: gradientes, ilustrações).

const config: Config = {
  content: ['./src/**/*.{ts,tsx}'],

  theme: {
    extend: {

      // ── Famílias tipográficas ─────────────────────────────────────────────
      // Fonte de display: Fraunces — serifada orgânica com personalidade,
      //   legível e distinta. Títulos da landing, h1–h2 do produto.
      //   Próximo passo: adicionar via next/font ou <link> do Google Fonts.
      // Corpo/UI: Inter — permanece. Excelente para leitura de texto denso.
      fontFamily: {
        sans:    ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        display: ['Fraunces', 'Georgia', 'ui-serif', 'serif'],
        mono:    ['JetBrains Mono', 'ui-monospace', 'SFMono-Regular', 'monospace'],
      },

      // ── Escala tipográfica (base 16, razão ≈1.25 — terça maior) ──────────
      // Bringhurst / Tim Brown: escala modular produz harmonia e elimina
      // tamanhos arbitrários. Cada tamanho vem com line-height pareado.
      // Papéis: display / h1 / h2 / h3 / h4 / body / body-sm / caption / overline
      fontSize: {
        'xs':      ['0.75rem',  { lineHeight: '1rem',    letterSpacing: '0.025em' }],   // 12px — caption, overline
        'sm':      ['0.875rem', { lineHeight: '1.375rem', letterSpacing: '0em' }],       // 14px — body-sm
        'base':    ['1rem',     { lineHeight: '1.625rem', letterSpacing: '0em' }],       // 16px — body (1.625 = 26px, leitura densa)
        'lg':      ['1.125rem', { lineHeight: '1.75rem',  letterSpacing: '-0.01em' }],   // 18px — body-lg / label grande
        'xl':      ['1.25rem',  { lineHeight: '1.75rem',  letterSpacing: '-0.01em' }],   // 20px — h4
        '2xl':     ['1.5rem',   { lineHeight: '2rem',     letterSpacing: '-0.02em' }],   // 24px — h3
        '3xl':     ['1.875rem', { lineHeight: '2.25rem',  letterSpacing: '-0.02em' }],   // 30px — h2
        '4xl':     ['2.25rem',  { lineHeight: '2.625rem', letterSpacing: '-0.03em' }],   // 36px — h1
        '5xl':     ['3rem',     { lineHeight: '1.1',      letterSpacing: '-0.04em' }],   // 48px — display-sm
        '6xl':     ['3.75rem',  { lineHeight: '1.05',     letterSpacing: '-0.04em' }],   // 60px — display
        '7xl':     ['4.5rem',   { lineHeight: '1',        letterSpacing: '-0.04em' }],   // 72px — display-lg
      },

      // ── Cores: semânticas + primitivas em canais RGB ─────────────────────
      colors: {

        // ── Semânticos: papéis (a UI usa ESTES) ────────────────────────────
        bg:             'rgb(var(--color-bg) / <alpha-value>)',
        surface:        'rgb(var(--color-surface) / <alpha-value>)',
        'surface-muted':'rgb(var(--color-surface-muted) / <alpha-value>)',
        'surface-subtle':'rgb(var(--color-surface-subtle) / <alpha-value>)',

        border:         'rgb(var(--color-border) / <alpha-value>)',
        'border-strong':'rgb(var(--color-border-strong) / <alpha-value>)',
        'border-focus': 'rgb(var(--color-border-focus) / <alpha-value>)',

        text:           'rgb(var(--color-text) / <alpha-value>)',
        'text-muted':   'rgb(var(--color-text-muted) / <alpha-value>)',
        'text-subtle':  'rgb(var(--color-text-subtle) / <alpha-value>)',
        'text-on-dark': 'rgb(var(--color-text-on-dark) / <alpha-value>)',

        primary:        'rgb(var(--color-primary) / <alpha-value>)',
        'primary-hover':'rgb(var(--color-primary-hover) / <alpha-value>)',
        'on-primary':   'rgb(var(--color-on-primary) / <alpha-value>)',
        'primary-soft': 'rgb(var(--color-primary-soft) / <alpha-value>)',

        accent:         'rgb(var(--color-accent) / <alpha-value>)',
        'accent-hover': 'rgb(var(--color-accent-hover) / <alpha-value>)',
        'on-accent':    'rgb(var(--color-on-accent) / <alpha-value>)',
        'accent-soft':  'rgb(var(--color-accent-soft) / <alpha-value>)',

        success:        'rgb(var(--color-success) / <alpha-value>)',
        'success-soft': 'rgb(var(--color-success-soft) / <alpha-value>)',
        warning:        'rgb(var(--color-warning) / <alpha-value>)',
        'warning-soft': 'rgb(var(--color-warning-soft) / <alpha-value>)',
        danger:         'rgb(var(--color-danger) / <alpha-value>)',
        'danger-soft':  'rgb(var(--color-danger-soft) / <alpha-value>)',
        info:           'rgb(var(--color-info) / <alpha-value>)',
        'info-soft':    'rgb(var(--color-info-soft) / <alpha-value>)',

        // ── Primitivos: escalas cruas (use só quando tokens semânticos não bastam) ─
        teal: {
          950: 'rgb(var(--teal-950) / <alpha-value>)',
          900: 'rgb(var(--teal-900) / <alpha-value>)',
          800: 'rgb(var(--teal-800) / <alpha-value>)',
          700: 'rgb(var(--teal-700) / <alpha-value>)',
          600: 'rgb(var(--teal-600) / <alpha-value>)',
          500: 'rgb(var(--teal-500) / <alpha-value>)',
          400: 'rgb(var(--teal-400) / <alpha-value>)',
          300: 'rgb(var(--teal-300) / <alpha-value>)',
          200: 'rgb(var(--teal-200) / <alpha-value>)',
          100: 'rgb(var(--teal-100) / <alpha-value>)',
          50:  'rgb(var(--teal-50) / <alpha-value>)',
        },
        terra: {
          950: 'rgb(var(--terra-950) / <alpha-value>)',
          900: 'rgb(var(--terra-900) / <alpha-value>)',
          800: 'rgb(var(--terra-800) / <alpha-value>)',
          700: 'rgb(var(--terra-700) / <alpha-value>)',
          600: 'rgb(var(--terra-600) / <alpha-value>)',
          500: 'rgb(var(--terra-500) / <alpha-value>)',
          400: 'rgb(var(--terra-400) / <alpha-value>)',
          200: 'rgb(var(--terra-200) / <alpha-value>)',
          100: 'rgb(var(--terra-100) / <alpha-value>)',
          50:  'rgb(var(--terra-50) / <alpha-value>)',
        },
        creme: {
          500: 'rgb(var(--creme-500) / <alpha-value>)',
          400: 'rgb(var(--creme-400) / <alpha-value>)',
          300: 'rgb(var(--creme-300) / <alpha-value>)',
          200: 'rgb(var(--creme-200) / <alpha-value>)',
          100: 'rgb(var(--creme-100) / <alpha-value>)',
          50:  'rgb(var(--creme-50) / <alpha-value>)',
          0:   'rgb(var(--creme-0) / <alpha-value>)',
        },
      },

      // ── Border radius: escala intencional ────────────────────────────────
      borderRadius: {
        xs:   'var(--radius-xs)',
        sm:   'var(--radius-sm)',
        DEFAULT: 'var(--radius-md)',
        md:   'var(--radius-md)',
        lg:   'var(--radius-lg)',
        xl:   'var(--radius-xl)',
        '2xl':'var(--radius-2xl)',
        full: 'var(--radius-full)',
      },

      // ── Sombras com leve cor petróleo ─────────────────────────────────────
      // Refactoring UI: sombras coloridas (não cinza puro) parecem mais ricas.
      boxShadow: {
        xs:  'var(--shadow-xs)',
        sm:  'var(--shadow-sm)',
        DEFAULT: 'var(--shadow-sm)',
        md:  'var(--shadow-md)',
        lg:  'var(--shadow-lg)',
        xl:  'var(--shadow-xl)',
        none: 'none',
      },

      // ── Transições: durações e easing padronizados ────────────────────────
      transitionDuration: {
        instant: '80ms',
        fast:    '150ms',
        base:    '220ms',
        slow:    '350ms',
      },
      transitionTimingFunction: {
        standard: 'cubic-bezier(0.2, 0, 0, 1)',
        enter:    'cubic-bezier(0, 0, 0.2, 1)',
        exit:     'cubic-bezier(0.4, 0, 1, 1)',
      },

      // ── Espaçamento: escala base-4 estendida ─────────────────────────────
      // Tailwind já é base-4 nativamente. Extensões apenas para passos extras
      // necessários além da escala padrão.
      spacing: {
        '13': '3.25rem',  // 52px — espaço especial entre seções
        '18': '4.5rem',   // 72px — hero padding
        '22': '5.5rem',   // 88px — section gap grande
      },

      // ── Largura máxima de leitura (Bringhurst: 45-75 chars/linha) ─────────
      maxWidth: {
        prose: '65ch',
        'prose-sm': '52ch',
      },
    },
  },

  plugins: [],
} satisfies Config

export default config
