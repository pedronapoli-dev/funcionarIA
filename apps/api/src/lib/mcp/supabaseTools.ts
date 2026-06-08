// Supabase Progress MCP Tools
// Provides Claude with real student data from the DB,
// replacing manually self-reported fields in checkin/recalibrate prompts.

import type Anthropic from '@anthropic-ai/sdk'
import { supabase } from '../supabase'

// ── Local schedule interfaces ─────────────────────────────────────────────────

interface ScheduleDay {
  topic:      string
  type?:      string
  completed?: boolean
  review_of?: string[]
}

interface ScheduleWeekRaw {
  week:               number
  days?:              ScheduleDay[]
  scaffolding_level?: string
}

// ── Tool definitions (passed to Anthropic API) ────────────────────────────────

export const SUPABASE_TOOLS: Anthropic.Tool[] = [
  {
    name: 'get_student_progress',
    description: 'Returns real study session data for a specific week of a plan. Replaces self-reported hours and topics in the check-in.',
    input_schema: {
      type: 'object' as const,
      required: ['plan_id', 'week_number'],
      properties: {
        plan_id:     { type: 'string', description: 'The plan UUID' },
        week_number: { type: 'integer', description: 'Week number to retrieve data for' },
      },
    },
  },
  {
    name: 'get_spaced_review_status',
    description: 'Returns whether spaced reviews (Ebbinghaus) were completed since a given date. Identifies missed reviews.',
    input_schema: {
      type: 'object' as const,
      required: ['plan_id'],
      properties: {
        plan_id:    { type: 'string', description: 'The plan UUID' },
        since_date: { type: 'string', description: 'ISO date string. Defaults to 7 days ago if omitted.' },
      },
    },
  },
  {
    name: 'get_plan_context',
    description: 'Returns current state of the study plan (weeks, topics done/remaining, scaffolding). Used by recalibrate.',
    input_schema: {
      type: 'object' as const,
      required: ['plan_id'],
      properties: {
        plan_id: { type: 'string', description: 'The plan UUID' },
      },
    },
  },
]

// Pre-filtered tool subsets for specific skills
export const CHECKIN_TOOLS = SUPABASE_TOOLS.filter(t =>
  ['get_student_progress', 'get_spaced_review_status'].includes(t.name)
)

export const RECALIBRATE_TOOLS = SUPABASE_TOOLS.filter(t =>
  t.name === 'get_plan_context'
)

// ── Tool executors ────────────────────────────────────────────────────────────

export interface StudentProgressResult {
  sessions_completed:           number
  sessions_planned:             number
  actual_hours:                 number
  exercise_accuracy_by_topic:   { topic: string; correct: number; total: number }[]
}

export const getStudentProgress = async (input: { plan_id: string; week_number: number }): Promise<StudentProgressResult> => {
  const [sessionsRes, exercisesRes, planRes] = await Promise.all([
    supabase.from('study_sessions')
      .select('week, day, duration_actual, completed')
      .eq('plan_id', input.plan_id)
      .eq('week', input.week_number),
    supabase.from('exercises')
      .select('topic, answer, user_answer, answered_at')
      .eq('plan_id', input.plan_id)
      .not('answered_at', 'is', null),
    supabase.from('plans')
      .select('schedule')
      .eq('id', input.plan_id)
      .single(),
  ])

  const sessions   = sessionsRes.data ?? []
  const exercises  = exercisesRes.data ?? []
  const schedule   = (planRes.data?.schedule as ScheduleWeekRaw[]) ?? []

  // Count planned sessions for this week from plan schedule
  const weekSchedule    = schedule.find((w: ScheduleWeekRaw) => w.week === input.week_number)
  const sessionsPlanned = weekSchedule?.days?.length ?? 0

  const sessionsCompleted = sessions.filter(s => s.completed).length
  const actualHours       = sessions.reduce((sum, s) => sum + ((s.duration_actual ?? 0) / 60), 0)

  // Aggregate exercise accuracy by topic
  const topicMap = new Map<string, { correct: number; total: number }>()
  for (const ex of exercises) {
    const entry = topicMap.get(ex.topic) ?? { correct: 0, total: 0 }
    entry.total++
    if (ex.user_answer === ex.answer) entry.correct++
    topicMap.set(ex.topic, entry)
  }

  return {
    sessions_completed:         sessionsCompleted,
    sessions_planned:           sessionsPlanned,
    actual_hours:               Math.round(actualHours * 10) / 10,
    exercise_accuracy_by_topic: Array.from(topicMap.entries()).map(([topic, v]) => ({ topic, ...v })),
  }
}

export interface SpacedReviewStatusResult {
  reviews_due:       number
  reviews_completed: number
  missed_topics:     string[]
}

export const getSpacedReviewStatus = async (input: { plan_id: string; since_date?: string }): Promise<SpacedReviewStatusResult> => {
  const since = input.since_date ?? new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()

  // Get plan schedule to count planned review sessions in this window
  const { data: plan } = await supabase.from('plans').select('schedule').eq('id', input.plan_id).single()
  const schedule = (plan?.schedule as ScheduleWeekRaw[]) ?? []

  const allDays    = schedule.flatMap((w: ScheduleWeekRaw) => w.days ?? [])
  const reviewDays = allDays.filter((d: ScheduleDay) => d.type === 'revisao')

  // Get completed sessions (revisao type) since the date
  const { data: completedReviews } = await supabase.from('study_sessions')
    .select('topic, completed_at')
    .eq('plan_id', input.plan_id)
    .eq('completed', true)
    .gte('completed_at', since)

  const completedTopics = new Set((completedReviews ?? []).map(s => s.topic))
  const missedTopics    = reviewDays
    .filter((d: ScheduleDay) => !completedTopics.has(d.topic) && (d.review_of?.length ?? 0) > 0)
    .map((d: ScheduleDay) => d.topic)

  return {
    reviews_due:       reviewDays.length,
    reviews_completed: completedTopics.size,
    missed_topics:     missedTopics.slice(0, 10), // cap to avoid huge payloads
  }
}

export interface PlanContextResult {
  current_week:            number
  total_weeks:             number
  exam_date:               string | null
  topics_done:             string[]
  topics_remaining:        string[]
  current_scaffolding_level: string
  progress_percent:        number
}

export const getPlanContext = async (input: { plan_id: string }): Promise<PlanContextResult> => {
  const { data: plan } = await supabase.from('plans')
    .select('schedule, total_weeks, exam_date, progress')
    .eq('id', input.plan_id).single()

  if (!plan) throw new Error(`Plan not found: ${input.plan_id}`)

  const schedule    = (plan.schedule as ScheduleWeekRaw[]) ?? []
  const allDays     = schedule.flatMap((w: ScheduleWeekRaw) => w.days ?? [])
  const doneDays    = allDays.filter((d: ScheduleDay) => d.completed)
  const notDoneDays = allDays.filter((d: ScheduleDay) => !d.completed)

  // Current week = last week with any completed session, or 1
  const completedWeeks = schedule.filter((w: ScheduleWeekRaw) => w.days?.some((d: ScheduleDay) => d.completed))
  const currentWeek    = completedWeeks.length > 0 ? completedWeeks[completedWeeks.length - 1].week : 1

  // Scaffolding level from current week
  const currentWeekObj      = schedule.find((w: ScheduleWeekRaw) => w.week === currentWeek)
  const currentScaffolding  = currentWeekObj?.scaffolding_level ?? 'medio'

  return {
    current_week:              currentWeek,
    total_weeks:               plan.total_weeks,
    exam_date:                 plan.exam_date ?? null,
    topics_done:               [...new Set(doneDays.map((d: ScheduleDay) => d.topic))],
    topics_remaining:          [...new Set(notDoneDays.map((d: ScheduleDay) => d.topic))],
    current_scaffolding_level: currentScaffolding,
    progress_percent:          plan.progress ?? 0,
  }
}

// ── Executor dispatcher ───────────────────────────────────────────────────────

export const executeSupabaseTool = async (name: string, input: unknown): Promise<unknown> => {
  switch (name) {
    case 'get_student_progress':    return getStudentProgress(input as { plan_id: string; week_number: number })
    case 'get_spaced_review_status': return getSpacedReviewStatus(input as { plan_id: string; since_date?: string })
    case 'get_plan_context':        return getPlanContext(input as { plan_id: string })
    default: throw new Error(`Unknown supabase tool: ${name}`)
  }
}
