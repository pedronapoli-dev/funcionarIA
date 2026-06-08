// ============================================================
// router.ts — SkillRouter: Router Pattern para seleção de skills
//
// O SkillRouter decide QUAL variante de prompt usar com base no
// contexto do aluno e da requisição. Isso permite escalar o
// sistema com novas skills sem alterar as rotas da API.
//
// Padrão: cada SkillId pode ter múltiplas variantes.
// O roteador seleciona a variante correta via RoutingContext.
//
// Variantes implementadas:
//   generate-plan:
//     - "foundation-first"    (iniciante + urgência baixa/média)
//     - "intensive-review"    (qualquer nível + urgência alta)
//     - "mastery-refinement"  (avançado + urgência baixa/média)
//     - "standard"            (fallback)
//   checkin:
//     - "recovery"            (atrasado)
//     - "acceleration"        (adiantado)
//     - "standard-checkin"    (no-ritmo)
//   generate-exercises:
//     - "exercises-inicial | intermediaria | final" (fase do plano)
//   Demais skills: variante única "standard"
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

// ── Public types (also exported from @funcionaria/types) ──────

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

// ── Helper: infer student level from prior knowledge (0-10) ──

export function inferStudentLevel(priorKnowledge: number): StudentLevel {
  if (priorKnowledge <= 3) return 'iniciante'
  if (priorKnowledge <= 6) return 'intermediario'
  return 'avancado'
}

// ── Helper: infer urgency from days until exam ────────────────

export function inferUrgency(examDate?: string): PlanUrgency {
  if (!examDate) return 'baixa'
  const daysUntil = Math.ceil((new Date(examDate).getTime() - Date.now()) / 86_400_000)
  if (daysUntil <= 14) return 'alta'
  if (daysUntil <= 30) return 'media'
  return 'baixa'
}

// ── Helper: infer plan phase from progress % ─────────────────

export function inferPlanPhase(progressPercent: number): PlanPhase {
  if (progressPercent >= 70) return 'final'
  if (progressPercent >= 30) return 'intermediaria'
  return 'inicial'
}

// ── Helper: infer performance trend ──────────────────────────

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

// ── The Router ────────────────────────────────────────────────

export function routeSkill(context: RoutingContext): SkillRoute {
  const { skill, studentLevel, urgency, planPhase, performanceTrend } = context

  switch (skill) {

    case 'generate-plan': {
      // High urgency (exam in ≤14 days): intensive variant regardless of level
      if (urgency === 'alta') {
        return {
          skillId: skill,
          systemPrompt: GENERATE_PLAN_INTENSIVE_SYSTEM,
          variantName: 'intensive-review',
          rationale:
            'Prova próxima (urgência alta): plano focado em tópicos essenciais, revisão comprimida, bloom_level "aplicar" e "analisar" dominam.',
        }
      }

      // Advanced student with time: skip foundational levels, go for mastery
      if (studentLevel === 'avancado') {
        return {
          skillId: skill,
          systemPrompt: GENERATE_PLAN_SYSTEM,
          variantName: 'mastery-refinement',
          rationale:
            'Aluno avançado: iniciar em bloom_level "aplicar", pular revisões básicas, focar em projetos integradores e nível "avaliar/criar".',
        }
      }

      // Beginner with time: high scaffolding, slow Bloom progression
      if (studentLevel === 'iniciante') {
        return {
          skillId: skill,
          systemPrompt: GENERATE_PLAN_SYSTEM,
          variantName: 'foundation-first',
          rationale:
            'Aluno iniciante: scaffolding máximo nas primeiras semanas, progressão lenta de Bloom (lembrar → entender → aplicar), exemplos concretos antes de abstrações.',
        }
      }

      // Intermediate: standard full-framework plan
      return {
        skillId: skill,
        systemPrompt: GENERATE_PLAN_SYSTEM,
        variantName: 'standard',
        rationale: 'Plano padrão com progressão completa pelos seis pilares pedagógicos.',
      }
    }

    case 'checkin': {
      // Behind schedule: trigger recalibration path
      if (performanceTrend === 'atrasado') {
        return {
          skillId: skill,
          systemPrompt: RECALIBRATE_SYSTEM,
          variantName: 'recovery',
          rationale:
            'Aluno atrasado: recalibrar ritmo, identificar bloqueios, reduzir escopo se necessário. Reconectar ao objetivo (Freire) antes de prescrever.',
        }
      }

      // Ahead of schedule: acceleration path
      if (performanceTrend === 'adiantado') {
        return {
          skillId: skill,
          systemPrompt: CHECKIN_SYSTEM,
          variantName: 'acceleration',
          rationale:
            'Aluno adiantado: propor aceleração, projetos extras, elevação do nível Bloom alvo.',
        }
      }

      // On track: standard check-in
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
