// ============================================================
// skillRouter.ts — SkillRouter: Router Pattern para seleção de skills
//
// Seleciona a variante de prompt correta com base no contexto
// do aluno e da requisição.
// ============================================================

import {
  PARSE_SUBJECT_SYSTEM,
  GENERATE_PLAN_SYSTEM,
  GENERATE_PLAN_INTENSIVE_SYSTEM,
  GENERATE_EXERCISES_SYSTEM,
  DIAGNOSE_STUDENT_SYSTEM,
  CHECKIN_SYSTEM,
  RECALIBRATE_SYSTEM,
} from './prompts'

const BEGINNER_THRESHOLD  = 3
const ADVANCED_THRESHOLD  = 6
const URGENT_DAYS         = 14
const RELAXED_DAYS        = 30
const EARLY_PHASE_PERCENT = 30
const LATE_PHASE_PERCENT  = 70

export type SkillId =
  | 'parse-subject'
  | 'generate-plan'
  | 'generate-exercises'
  | 'diagnose-student'
  | 'checkin'
  | 'recalibrate'

export type StudentLevel     = 'iniciante' | 'intermediario' | 'avancado'
export type PlanUrgency      = 'baixa' | 'media' | 'alta'
export type PlanPhase        = 'inicial' | 'intermediaria' | 'final'
export type PerformanceTrend = 'atrasado' | 'no-ritmo' | 'adiantado'

export interface RoutingContext {
  skill:             SkillId
  studentLevel?:     StudentLevel
  urgency?:          PlanUrgency
  planPhase?:        PlanPhase
  performanceTrend?: PerformanceTrend
}

export interface SkillRoute {
  skillId:      SkillId
  systemPrompt: string
  variantName:  string
  rationale:    string
}

// ── Inference helpers ─────────────────────────────────────────

export function inferStudentLevel(priorKnowledge: number): StudentLevel {
  if (priorKnowledge <= BEGINNER_THRESHOLD) return 'iniciante'
  if (priorKnowledge <= ADVANCED_THRESHOLD) return 'intermediario'
  return 'avancado'
}

export function inferUrgency(examDate?: string): PlanUrgency {
  if (!examDate) return 'baixa'
  const daysUntil = Math.ceil((new Date(examDate).getTime() - Date.now()) / 86_400_000)
  if (daysUntil <= URGENT_DAYS) return 'alta'
  if (daysUntil <= RELAXED_DAYS) return 'media'
  return 'baixa'
}

export function inferPlanPhase(progressPercent: number): PlanPhase {
  if (progressPercent >= LATE_PHASE_PERCENT) return 'final'
  if (progressPercent >= EARLY_PHASE_PERCENT) return 'intermediaria'
  return 'inicial'
}

export function inferPerformanceTrend(
  progressPercent: number,
  expectedPercent: number,
  masteryRate:     number
): PerformanceTrend {
  const lag = expectedPercent - progressPercent
  if (lag > 20 || masteryRate < 60) return 'atrasado'
  if (lag < -10 && masteryRate > 85) return 'adiantado'
  return 'no-ritmo'
}

// ── Router ────────────────────────────────────────────────────

export function routeSkill(context: RoutingContext): SkillRoute {
  const { skill, studentLevel, urgency, planPhase, performanceTrend } = context

  switch (skill) {

    case 'generate-plan': {
      if (urgency === 'alta') {
        return {
          skillId: skill,
          systemPrompt: GENERATE_PLAN_INTENSIVE_SYSTEM,
          variantName: 'intensive-review',
          rationale:
            'Prova próxima (urgência alta): plano focado em tópicos essenciais, revisão comprimida, bloom_level "aplicar" e "analisar" dominam.',
        }
      }
      if (studentLevel === 'avancado') {
        return {
          skillId: skill,
          systemPrompt: GENERATE_PLAN_SYSTEM,
          variantName: 'mastery-refinement',
          rationale:
            'Aluno avançado: iniciar em bloom_level "aplicar", pular revisões básicas, focar em projetos integradores e nível "avaliar/criar".',
        }
      }
      if (studentLevel === 'iniciante') {
        return {
          skillId: skill,
          systemPrompt: GENERATE_PLAN_SYSTEM,
          variantName: 'foundation-first',
          rationale:
            'Aluno iniciante: scaffolding máximo nas primeiras semanas, progressão lenta de Bloom (lembrar → entender → aplicar), exemplos concretos antes de abstrações.',
        }
      }
      return {
        skillId: skill,
        systemPrompt: GENERATE_PLAN_SYSTEM,
        variantName: 'standard',
        rationale: 'Plano padrão com progressão completa pelos seis pilares pedagógicos.',
      }
    }

    case 'checkin': {
      if (performanceTrend === 'atrasado') {
        return {
          skillId: skill,
          systemPrompt: RECALIBRATE_SYSTEM,
          variantName: 'recovery',
          rationale:
            'Aluno atrasado: recalibrar ritmo, identificar bloqueios, reduzir escopo se necessário. Reconectar ao objetivo (Freire) antes de prescrever.',
        }
      }
      if (performanceTrend === 'adiantado') {
        return {
          skillId: skill,
          systemPrompt: CHECKIN_SYSTEM,
          variantName: 'acceleration',
          rationale:
            'Aluno adiantado: propor aceleração, projetos extras, elevação do nível Bloom alvo.',
        }
      }
      return {
        skillId: skill,
        systemPrompt: CHECKIN_SYSTEM,
        variantName: 'standard-checkin',
        rationale: 'Check-in padrão: avaliar progresso e propor ajustes menores.',
      }
    }

    case 'generate-exercises': {
      const phase = planPhase ?? 'inicial'
      return {
        skillId: skill,
        systemPrompt: GENERATE_EXERCISES_SYSTEM,
        variantName: `exercises-${phase}`,
        rationale: `Fase ${phase}: exercícios calibrados ao nível Bloom desta etapa do plano.`,
      }
    }

    case 'diagnose-student':
      return {
        skillId: skill,
        systemPrompt: DIAGNOSE_STUDENT_SYSTEM,
        variantName: 'standard',
        rationale: 'Diagnóstico pedagógico inicial — calibra ZDP antes de gerar o plano.',
      }

    case 'recalibrate':
      return {
        skillId: skill,
        systemPrompt: RECALIBRATE_SYSTEM,
        variantName: 'standard',
        rationale: 'Recalibração baseada em evidências de performance e bloqueios identificados.',
      }

    case 'parse-subject':
    default:
      return {
        skillId: skill,
        systemPrompt: PARSE_SUBJECT_SYSTEM,
        variantName: 'standard',
        rationale: 'Extração e análise pedagógica da ementa.',
      }
  }
}
