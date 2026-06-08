import { generate } from '../lib/anthropic'
import { supabase } from '../lib/supabase'
import { generatePlanPrompt } from '../lib/prompts'
import { routeSkill, inferStudentLevel, inferUrgency } from '../lib/skillRouter'
import { calculateReviewSchedule } from '../lib/mcp/spacedRepTools'
import { searchYoutubeEducation }  from '../lib/mcp/resourceTools'
import type { ScheduleWeek } from '@funcionaria/types'

export interface PlanInput {
  userId:               string
  subjectId:            string
  hoursPerDay:          number
  daysPerWeek:          number
  examDate?:            string
  course?:              string
  // Optional student profile — enables router-based personalization
  priorKnowledgeLevel?: number    // 0-10
  learningFormats?:     string[]
  applicationContext?:  string
  // MCP enrichments (opt-in flags)
  enableSm2?:     boolean   // SM-2 adaptive review intervals instead of fixed +1/+3/+7/+21
  enableYoutube?: boolean   // Pre-fetch 1 YouTube URL for the main topic tip field
}

function calcTotalWeeks(topics: string[], examDate?: string, daysPerWeek = 5): number {
  if (examDate) {
    const diffMs = new Date(examDate).getTime() - Date.now()
    return Math.min(20, Math.max(1, Math.ceil(diffMs / (7 * 24 * 60 * 60 * 1000))))
  }
  return Math.max(2, Math.ceil(topics.length / (daysPerWeek * 2)))
}

// Build SM-2 context string for prompt injection.
// Called pre-generation — zero extra LLM tokens.
function buildSm2Context(topics: string[]): string {
  if (topics.length === 0) return ''
  const today = new Date().toISOString().split('T')[0]
  const schedule = calculateReviewSchedule({
    topics: topics.slice(0, 10).map(t => ({ topic: t, study_date: today, difficulty_hint: 'medio' })),
  })
  const lines = schedule.map(r => {
    const intervals = r.review_dates.map(d =>
      `+${Math.round((new Date(d).getTime() - new Date(today).getTime()) / 86_400_000)}d`
    ).join(', ')
    return `- ${r.topic}: ${intervals} (fator de facilidade: ${r.ease_factor})`
  }).join('\n')
  return `\nREVISÃO ESPAÇADA SM-2 (substitui intervalos fixos — use estes):\n${lines}`
}

// Pre-fetch 1 YouTube result for the primary topic and return as prompt context.
// Gracefully returns '' if YOUTUBE_API_KEY is absent or the request fails.
async function buildYoutubeContext(subjectName: string, mainTopic: string): Promise<string> {
  if (!process.env.YOUTUBE_API_KEY) return ''
  const results = await searchYoutubeEducation({ query: `${subjectName} ${mainTopic}`, max_results: 1 })
  if (results.length === 0) return ''
  const r = results[0]
  return `\nRECURSO SUGERIDO: Para o tópico "${mainTopic}", use no campo "tip" da primeira sessão: "${r.title}" — ${r.url} (${r.channel})`
}

export async function generateAndSavePlan(input: PlanInput) {
  const { data: subject, error } = await supabase
    .from('subjects').select('*').eq('id', input.subjectId).eq('user_id', input.userId).single()
  if (error || !subject) throw new Error('Ementa não encontrada')

  const topics     = (subject.topics as string[]) ?? []
  const totalWeeks = calcTotalWeeks(topics, input.examDate, input.daysPerWeek)

  // Route to the correct plan variant based on student context
  const studentLevel = input.priorKnowledgeLevel !== undefined
    ? inferStudentLevel(input.priorKnowledgeLevel)
    : undefined
  const urgency = inferUrgency(input.examDate)
  const { systemPrompt } = routeSkill({ skill: 'generate-plan', studentLevel, urgency })

  // Pre-compute MCP enrichments (no extra LLM calls — injected as prompt context)
  const [sm2Context, youtubeContext] = await Promise.all([
    input.enableSm2 ? buildSm2Context(topics) : '',
    input.enableYoutube ? buildYoutubeContext(subject.name, topics[0] ?? subject.name) : '',
  ])

  const userPrompt = generatePlanPrompt({
    subjectName: subject.name, topics,
    hoursPerDay: input.hoursPerDay, daysPerWeek: input.daysPerWeek,
    totalWeeks, examDate: input.examDate, course: input.course ?? subject.course,
    priorKnowledgeLevel: input.priorKnowledgeLevel,
    learningFormats: input.learningFormats,
    applicationContext: input.applicationContext,
    studentLevel, urgency,
  }) + sm2Context + youtubeContext

  const response = await generate(systemPrompt, userPrompt, 8192)

  let generatedPlan: { title: string; total_weeks: number; schedule: ScheduleWeek[] }
  try { generatedPlan = JSON.parse(response) }
  catch { throw new Error('Falha ao parsear plano da IA. Tente novamente.') }

  // Normalize week and day numbers — LLM occasionally produces duplicates
  generatedPlan.schedule = generatedPlan.schedule.map((week, weekIndex) => ({
    ...week,
    week: weekIndex + 1,
    days: week.days.map((day, dayIndex) => ({ ...day, day: dayIndex + 1 })),
  }))

  const { data: plan, error: planError } = await supabase
    .from('plans')
    .insert({
      user_id: input.userId, subject_id: input.subjectId,
      title: generatedPlan.title, hours_per_day: input.hoursPerDay,
      days_per_week: input.daysPerWeek, exam_date: input.examDate ?? null,
      total_weeks: generatedPlan.total_weeks, schedule: generatedPlan.schedule,
      status: 'active', progress: 0,
    })
    .select().single()
  if (planError) throw planError

  await supabase.rpc('increment_plans_count', { user_id_param: input.userId })
  return plan
}

export async function completeSession(
  userId: string, planId: string, week: number, day: number, durationActual?: number
) {
  await supabase.from('study_sessions').insert({
    user_id: userId, plan_id: planId, week, day, topic: '',
    duration_actual: durationActual, completed: true, completed_at: new Date().toISOString(),
  })

  const { data: plan } = await supabase
    .from('plans').select('schedule').eq('id', planId).eq('user_id', userId).single()
  if (!plan) return

  const schedule = plan.schedule as ScheduleWeek[]
  const weekObj  = schedule.find(w => w.week === week)
  if (weekObj) { const dayObj = weekObj.days.find(d => d.day === day); if (dayObj) dayObj.completed = true }

  const total     = schedule.reduce((a, w) => a + w.days.length, 0)
  const completed = schedule.reduce((a, w) => a + w.days.filter(d => d.completed).length, 0)
  const progress  = total > 0 ? Math.round((completed / total) * 100) : 0

  await supabase.from('plans')
    .update({ schedule, progress, status: progress === 100 ? 'completed' : 'active' })
    .eq('id', planId).eq('user_id', userId)
}
