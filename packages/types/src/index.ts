// ============================================================
// @educarseia/types
// Fonte única de verdade para tipos compartilhados entre
// apps/web (Next.js) e apps/api (Fastify).
//
// Frontend:  import type { Plan } from '@/types'
// Backend:   import type { Plan } from '@educarseia/types'
// ============================================================

export type UserPlan = 'free' | 'basic' | 'pro' | 'max' | 'beta'

export interface PlanLimits {
  maxPlans:       number | null  // null = ilimitado
  maxApiCallsPerMonth: number | null  // null = ilimitado
}

export const PLAN_LIMITS: Record<UserPlan, PlanLimits> = {
  free:  { maxPlans: 2,    maxApiCallsPerMonth: 10  },
  basic: { maxPlans: 10,   maxApiCallsPerMonth: 30  },
  pro:   { maxPlans: null, maxApiCallsPerMonth: 100 },
  max:   { maxPlans: null, maxApiCallsPerMonth: null },
  beta:  { maxPlans: null, maxApiCallsPerMonth: 100 },
}

export interface User {
  id:                     string
  email:                  string
  full_name?:             string | null
  university?:            string | null
  course?:                string | null
  semester?:              number | null
  plan:                   UserPlan
  plans_count:            number
  api_calls_this_month:   number
  api_calls_reset_at?:    string | null
  stripe_customer_id?:    string | null
  created_at:             string
  updated_at:             string
}

export type SubjectSourceType = 'pdf' | 'text' | 'manual'

export interface Subject {
  id:                  string
  user_id:             string
  name:                string
  code?:               string | null
  course?:             string | null
  university?:         string | null
  credits?:            number | null
  workload_hours?:     number | null
  description?:        string | null
  topics:              string[]
  bibliography:        string[]
  prerequisites:       string[]
  raw_text?:           string | null
  source_type:         SubjectSourceType
  created_at:          string
}

export interface ParsedSubject {
  name:               string
  code:               string | null
  course:             string | null
  university:         string | null
  credits:            number | null
  workload_hours:     number | null
  description:        string
  topics:             string[]
  bibliography:       string[]
  prerequisites:      string[]
  // Pedagogical enrichments (optional — populated when AI can infer)
  difficulty_level?:   'acessível' | 'desafiador' | 'avançado'
  zdp_entry_point?:    string                    // Knowledge required before starting
  topic_dependencies?: Record<string, string[]>  // topic → its internal prerequisites
}

// ── Pedagogical progression types ────────────────────────────────────────────

// Scaffolding level: support intensity that should DECREASE over plan duration
export type ScaffoldingLevel = 'alto' | 'medio' | 'baixo'

export type SessionType = 'teoria' | 'exercicio' | 'revisao'
export type Priority    = 'alta'   | 'media'     | 'baixa'
export type PlanStatus  = 'active' | 'completed' | 'archived'
export type BloomLevel  = 'lembrar' | 'entender' | 'aplicar' | 'analisar' | 'avaliar' | 'criar'

export interface ScheduleDay {
  day:                number
  topic:              string
  duration_minutes:   number
  type:               SessionType
  priority:           Priority
  completed:          boolean
  tip?:               string
  bloom_level?:       BloomLevel       // Bloom cognitive level targeted by this session
  mastery_criteria?:  string           // Observable criterion to confirm mastery before advancing
  review_of?:         string[]         // Topics reviewed (populated when type === 'revisao')
  scaffolding_level?: ScaffoldingLevel // Support intensity: 'alto' early → 'baixo' late in plan
  autonomous?:        boolean          // true = no-AI session (strengthens metacognition)
  real_context?:      string           // Connection to student's real-life goal (Freire/Darcy)
}

export interface ScheduleWeek {
  week:              number
  focus:             string
  days:              ScheduleDay[]
  module?:           string            // Instructional phase, e.g. "Fundamentos" / "Aprofundamento"
  scaffolding_level?: ScaffoldingLevel // Week-level scaffolding (decreases over plan)
  zdp_focus?:        string            // What ZDP gap this week bridges
}

export interface Plan {
  id:            string
  user_id:       string
  subject_id:    string
  title:         string
  status:        PlanStatus
  hours_per_day: number
  days_per_week: number
  exam_date?:    string | null
  total_weeks:   number
  schedule:      ScheduleWeek[]
  progress:              number
  application_context?:  string | null
  created_at:            string
  updated_at:            string
  subjects?:             Subject
}

export interface CreatePlanInput {
  subject_id:    string
  hours_per_day: number
  days_per_week: number
  exam_date?:    string
  course?:       string
  // Student profile for ZDP-calibrated plan generation
  student_profile?: StudentProfile
}

// ── Student diagnostic types ──────────────────────────────────────────────────

export type LearningFormat = 'videos' | 'leitura' | 'exercicios' | 'projetos' | 'flashcards' | 'podcasts'

export interface StudentProfile {
  prior_knowledge_level:    number            // 0–10 self-assessment
  learning_formats:         LearningFormat[]  // Preferred study formats
  previous_blocks?:         string[]          // What failed in past attempts
  application_context:      string            // Why learning this (real goal)
  weekly_hours_available:   number            // Realistic hours/week
}

export interface DiagnosticResult {
  zdp_entry_point:                string      // Current state → target state gap
  critical_prerequisites:         string[]    // Must be mastered before plan begins
  risk_topics:                    string[]    // Topics likely to create blocks
  estimated_difficulty:           'acessível' | 'desafiador' | 'avançado'
  recommended_scaffolding_start:  ScaffoldingLevel
  recommended_student_level:      StudentLevel
}

// ── Check-in and recalibration types ─────────────────────────────────────────

export type StudentLevel       = 'iniciante' | 'intermediario' | 'avancado'
export type PlanUrgency        = 'baixa' | 'media' | 'alta'
export type PlanPhase          = 'inicial' | 'intermediaria' | 'final'
export type PerformanceTrend   = 'atrasado' | 'no-ritmo' | 'adiantado'
export type RecalibrationAction = 'manter' | 'desacelerar' | 'acelerar' | 'recalibrar'

export interface PlanCheckin {
  week:                      number
  quantitative_progress:     number               // % of sessions completed
  qualitative_progress:      number               // % mastery criteria confirmed
  spaced_reviews_completed:  boolean
  difficulties:              string               // Student-reported obstacles
  performance_trend:         PerformanceTrend
  proposed_action:           RecalibrationAction
  action_rationale:          string               // Human-centered explanation (Freire)
}

export type RecalibrateActionType =
  | 'subdividir_topico' | 'mudar_formato' | 'reduzir_escopo'
  | 'acelerar' | 'reconectar_objetivo' | 'ajustar_scaffolding'

export interface RecalibrateActionItem {
  action_type:  RecalibrateActionType
  target_topic: string
  description:  string
  rationale:    string
}

export type RecalibrateRootCause = 'ZDP violado' | 'carga cognitiva excessiva' | 'motivação' | 'ritmo'

export interface RecalibrateResult {
  diagnosis:              string
  root_cause:             RecalibrateRootCause
  actions:                RecalibrateActionItem[]
  new_scaffolding_level:  ScaffoldingLevel
  topics_to_skip:         string[]
  motivational_message:   string
  revised_timeline:       string | null
}

// ── Exercise types ────────────────────────────────────────────────────────────

export type ExerciseType   = 'conceitual' | 'aplicacao' | 'analise' | 'metacognitiva'
export type ExerciseOption = { key: 'a' | 'b' | 'c' | 'd'; text: string }

export interface Exercise {
  id:               string
  plan_id:          string
  user_id:          string
  topic:            string
  question:         string
  options:          ExerciseOption[]
  answer:           string
  explanation:      string
  type:             ExerciseType
  scaffolded_hint?: string    // Teacher hint if student is stuck (no answer revealed)
  user_answer?:     string | null
  answered_at?:     string | null
  created_at:       string
}

export interface StudySession {
  id:               string
  user_id:          string
  plan_id:          string
  topic:            string
  week:             number
  day:              number
  duration_actual?: number | null
  completed:        boolean
  notes?:           string | null
  started_at?:      string | null
  completed_at?:    string | null
  created_at:       string
}

export interface ApiError {
  error:        string
  upgrade_url?: string
}

export interface LimitedResponse {
  limited:     true
  upgrade_url: string
  usage:       { used: number; max: number | null; percent: number }
}

export interface UsageWarning {
  warning:     true
  usage:       { used: number; max: number | null; percent: number }
}

export interface CooldownResponse {
  cooldown:  true
  retry_at:  string
  message:   string
}

// ── Router types ──────────────────────────────────────────────────────────────

export type SkillId =
  | 'parse-subject'
  | 'generate-plan'
  | 'generate-exercises'
  | 'diagnose-student'
  | 'checkin'
  | 'recalibrate'

export interface SkillRoute {
  skillId:      SkillId
  systemPrompt: string
  variantName:  string
  rationale:    string   // Why this variant was selected (for logging/debugging)
}

export interface RoutingContext {
  skill:              SkillId
  studentLevel?:      StudentLevel
  urgency?:           PlanUrgency
  planPhase?:         PlanPhase
  performanceTrend?:  PerformanceTrend
}
