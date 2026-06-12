import Link from 'next/link'
import {
  GraduationCap, Upload, UserCog, Sparkles, TrendingUp,
  Brain, Layers, Target, BookOpen, BarChart3, RefreshCw, Zap,
  ArrowRight, CheckCircle2,
} from 'lucide-react'
import { Footer } from '@/components/Footer'

// ── Static data ──────────────────────────────────────────────

const STEPS = [
  {
    icon: Upload,
    title: 'Envie sua ementa',
    description: 'Upload do PDF ou cole o texto. A IA extrai tópicos, pré-requisitos e bibliografia.',
  },
  {
    icon: UserCog,
    title: 'Configure seu perfil',
    description: 'Nível de conhecimento, formatos preferidos e por que precisa aprender.',
  },
  {
    icon: Sparkles,
    title: 'Receba seu plano',
    description: 'Cronograma semanal personalizado com teoria, prática e revisão espaçada.',
  },
  {
    icon: TrendingUp,
    title: 'Estude com acompanhamento',
    description: 'Exercícios, check-ins semanais e recalibração quando você travar.',
  },
] as const

const FEATURES = [
  { icon: Brain,      title: 'Taxonomia de Bloom',     description: 'Cada sessão tem nível cognitivo definido — de recordar a criar.' },
  { icon: Layers,     title: 'Scaffolding progressivo', description: 'Suporte alto no início, autonomia total no final.' },
  { icon: Target,     title: 'Critérios de maestria',   description: 'Saiba exatamente o que precisa dominar antes de avançar.' },
  { icon: RefreshCw,  title: 'Revisão espaçada (SM-2)', description: 'Algoritmo científico define quando revisar cada tópico.' },
  { icon: BarChart3,  title: 'Check-in semanal',        description: 'Avaliação quantitativa e qualitativa com ações concretas.' },
  { icon: Zap,        title: 'Recalibração inteligente', description: 'Travou? A IA diagnostica o bloqueio e ajusta o plano.' },
] as const

const FRAMEWORKS = [
  'Freire (autonomia)',
  'Vygotsky (zona de desenvolvimento proximal)',
  'Bloom (taxonomia cognitiva)',
  'Piaget (construtivismo)',
  'Sweller (carga cognitiva)',
  'Ebbinghaus (repetição espaçada)',
  'Darcy Ribeiro (educação integral)',
] as const

// ── Mock data for the demo ───────────────────────────────────

const MOCK_EMENTA = `Cálculo Diferencial e Integral II
MAT0122 — Engenharia Civil — 4 créditos

Ementa: Integrais definidas e indefinidas.
Técnicas de integração. Integrais impróprias.
Sequências e séries numéricas. Séries de
potências. Séries de Taylor. Aplicações...`

const MOCK_PLAN_WEEKS = [
  {
    week: 1,
    focus: 'Fundamentos de integração',
    days: [
      { topic: 'Integral indefinida e antiderivadas',     type: 'teoria',    bloom: 'Compreender', done: true },
      { topic: 'Regras básicas de integração',             type: 'exercicio', bloom: 'Aplicar',     done: true },
      { topic: 'Integral definida e Teorema Fundamental', type: 'teoria',    bloom: 'Compreender', done: false },
      { topic: 'Revisão: antiderivadas + TFC',            type: 'revisao',   bloom: 'Recordar',    done: false },
    ],
  },
  {
    week: 2,
    focus: 'Técnicas de integração',
    days: [
      { topic: 'Integração por substituição',    type: 'teoria',    bloom: 'Aplicar',  done: false },
      { topic: 'Integração por partes',           type: 'teoria',    bloom: 'Aplicar',  done: false },
      { topic: 'Prática: substituição + partes',  type: 'exercicio', bloom: 'Analisar', done: false },
    ],
  },
]

const TYPE_COLORS: Record<string, string> = {
  teoria:    'bg-indigo-50 text-indigo-700 ring-indigo-700/10',
  exercicio: 'bg-purple-50 text-purple-700 ring-purple-700/10',
  revisao:   'bg-amber-50  text-amber-700  ring-yellow-600/20',
}

const TYPE_LABELS: Record<string, string> = {
  teoria: 'Teoria', exercicio: 'Prática', revisao: 'Revisão',
}

// ── Page ──────────────────────────────────────────────────────

const LandingPage = () => {
  return (
    <div className="bg-white">

      {/* ── Header ─────────────────────────────────────────── */}
      <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-sm border-b border-gray-100">
        <nav className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-14 items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-md bg-indigo-600">
                <GraduationCap className="text-white" size={16} />
              </div>
              <span className="text-sm font-bold tracking-tight text-gray-900">educar-se-ia</span>
            </div>
            <div className="flex items-center gap-3">
              <Link href="/planos" className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors">
                Planos
              </Link>
              <Link href="/login" className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors">
                Entrar
              </Link>
              <Link href="/login" className="btn-primary py-1.5 text-sm">
                Começar grátis
              </Link>
            </div>
          </div>
        </nav>
      </header>

      {/* ── Hero ───────────────────────────────────────────── */}
      <section className="relative overflow-hidden">
        <div className="mx-auto max-w-5xl px-4 pt-16 pb-20 sm:px-6 sm:pt-24 sm:pb-28 lg:px-8">
          <div className="max-w-2xl">
            <p className="text-sm font-semibold text-indigo-600 mb-3">Estudo inteligente com IA</p>
            <h1 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl lg:text-5xl leading-[1.15]">
              Sua ementa vira um plano de estudos{' '}
              <span className="text-indigo-600">em 60 segundos</span>
            </h1>
            <p className="mt-5 text-base leading-relaxed text-gray-600 sm:text-lg">
              Envie o PDF da sua disciplina e receba um cronograma semanal personalizado
              com teoria, prática, revisão espaçada e exercícios adaptativos.
              Fundamentado em 7 teorias pedagógicas, não em achismo.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/login" className="btn-primary px-5 py-2.5 text-base">
                Criar meu plano grátis <ArrowRight size={16} />
              </Link>
              <a href="#como-funciona" className="btn-secondary px-5 py-2.5 text-base">
                Como funciona
              </a>
            </div>
            <p className="mt-4 text-xs text-gray-400">
              Gratuito — até 2 planos, sem cartão de crédito.
            </p>
          </div>
        </div>
        {/* Subtle gradient accent */}
        <div className="absolute -top-40 -right-40 h-[500px] w-[500px] rounded-full bg-indigo-50 blur-3xl opacity-50 pointer-events-none" />
      </section>

      {/* ── Demo: Ementa → Plano ───────────────────────────── */}
      <section className="bg-gray-50 py-16 sm:py-20">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10">
            <h2 className="text-xl font-bold text-gray-900 sm:text-2xl">De ementa confusa a plano claro</h2>
            <p className="mt-2 text-sm text-gray-500">Veja a transformação que a IA faz com o conteúdo da sua disciplina.</p>
          </div>

          <div className="grid gap-6 lg:grid-cols-2 lg:gap-8 items-start">

            {/* Before: raw ementa */}
            <div className="rounded-xl bg-white p-5 ring-1 ring-gray-200 shadow-sm">
              <div className="flex items-center gap-2 mb-3">
                <BookOpen size={14} className="text-gray-400" />
                <span className="text-xs font-semibold uppercase tracking-wider text-gray-400">Ementa original</span>
              </div>
              <pre className="whitespace-pre-wrap text-sm leading-relaxed text-gray-500 font-mono bg-gray-50 rounded-lg p-4 ring-1 ring-gray-100">
                {MOCK_EMENTA}
              </pre>
            </div>

            {/* After: generated plan */}
            <div className="rounded-xl bg-white p-5 ring-1 ring-indigo-200 shadow-sm shadow-indigo-100/50">
              <div className="flex items-center gap-2 mb-3">
                <Sparkles size={14} className="text-indigo-500" />
                <span className="text-xs font-semibold uppercase tracking-wider text-indigo-500">Plano gerado</span>
              </div>

              <div className="space-y-4">
                {MOCK_PLAN_WEEKS.map(week => (
                  <div key={week.week}>
                    <div className="flex items-center gap-2 mb-2">
                      <span className="flex h-5 w-5 items-center justify-center rounded bg-indigo-600 text-[10px] font-bold text-white">
                        {week.week}
                      </span>
                      <span className="text-xs font-semibold text-gray-700">{week.focus}</span>
                    </div>
                    <ul className="space-y-1.5">
                      {week.days.map((day, i) => (
                        <li
                          key={i}
                          className={`flex items-center gap-2.5 rounded-md px-3 py-2 text-sm ring-1 ring-gray-100 ${
                            day.done ? 'bg-gray-50 opacity-60' : 'bg-white'
                          }`}
                        >
                          <CheckCircle2
                            size={14}
                            className={day.done ? 'text-green-500 flex-shrink-0' : 'text-gray-200 flex-shrink-0'}
                          />
                          <span className={`flex-1 truncate ${day.done ? 'line-through text-gray-400' : 'text-gray-700'}`}>
                            {day.topic}
                          </span>
                          <span className={`inline-flex items-center rounded-full px-1.5 py-0.5 text-[10px] font-medium ring-1 ring-inset ${TYPE_COLORS[day.type]}`}>
                            {TYPE_LABELS[day.type]}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Como funciona ──────────────────────────────────── */}
      <section id="como-funciona" className="py-16 sm:py-20">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-xl font-bold text-gray-900 sm:text-2xl">Como funciona</h2>
            <p className="mt-2 text-sm text-gray-500">4 passos entre receber a ementa e começar a estudar.</p>
          </div>

          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {STEPS.map((step, i) => {
              const Icon = step.icon
              return (
                <div key={i} className="text-center">
                  <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 mb-4">
                    <Icon size={22} />
                  </div>
                  <div className="text-xs font-bold text-indigo-600 mb-1">Passo {i + 1}</div>
                  <h3 className="text-sm font-semibold text-gray-900 mb-1.5">{step.title}</h3>
                  <p className="text-sm leading-relaxed text-gray-500">{step.description}</p>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* ── Features ───────────────────────────────────────── */}
      <section className="bg-gray-50 py-16 sm:py-20">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-xl font-bold text-gray-900 sm:text-2xl">Não é só um cronograma</h2>
            <p className="mt-2 text-sm text-gray-500">Cada plano aplica princípios pedagógicos reais.</p>
          </div>

          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map((feat, i) => {
              const Icon = feat.icon
              return (
                <div key={i} className="rounded-xl bg-white p-5 ring-1 ring-gray-200 shadow-sm">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-md bg-indigo-50 text-indigo-600 flex-shrink-0">
                      <Icon size={16} />
                    </div>
                    <h3 className="text-sm font-semibold text-gray-900">{feat.title}</h3>
                  </div>
                  <p className="text-sm leading-relaxed text-gray-500">{feat.description}</p>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* ── Fundamento pedagógico ──────────────────────────── */}
      <section className="py-16 sm:py-20">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-xl font-bold text-gray-900 sm:text-2xl mb-3">Fundamentado em ciência</h2>
          <p className="text-sm leading-relaxed text-gray-500 mb-8">
            Cada decisão do plano — a ordem dos tópicos, o nível dos exercícios, quando revisar, quando
            aumentar a dificuldade — vem de pesquisa pedagógica real, não de palpite.
          </p>
          <div className="flex flex-wrap justify-center gap-2">
            {FRAMEWORKS.map(f => (
              <span
                key={f}
                className="inline-flex items-center rounded-full bg-gray-50 px-3 py-1.5 text-xs font-medium text-gray-600 ring-1 ring-inset ring-gray-200"
              >
                {f}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ── Final CTA ──────────────────────────────────────── */}
      <section className="bg-indigo-600 py-14 sm:py-16">
        <div className="mx-auto max-w-3xl px-4 text-center">
          <h2 className="text-xl font-bold text-white sm:text-2xl">Pronto para estudar melhor?</h2>
          <p className="mt-3 text-sm text-indigo-200">
            Crie seu primeiro plano em menos de 60 segundos. Grátis, sem cartão.
          </p>
          <Link
            href="/login"
            className="mt-6 inline-flex items-center gap-2 rounded-md bg-white px-6 py-2.5 text-sm font-semibold text-indigo-600 shadow-sm hover:bg-indigo-50 transition-colors"
          >
            Criar meu plano <ArrowRight size={16} />
          </Link>
        </div>
      </section>

      <Footer />
    </div>
  )
}

export default LandingPage
