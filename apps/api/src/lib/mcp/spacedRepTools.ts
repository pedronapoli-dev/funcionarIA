// SM-2 Spaced Repetition MCP Tools
// Pure TypeScript implementation of the SuperMemo 2 algorithm.
// Replaces fixed Ebbinghaus intervals (+1/+3/+7/+21 days) with
// adaptive intervals based on student performance history.
// Zero external API calls — deterministic, no latency.

import type Anthropic from '@anthropic-ai/sdk'

// ── SM-2 Algorithm ────────────────────────────────────────────────────────────

type DifficultyHint = 'facil' | 'medio' | 'dificil'

// Maps difficulty hint → initial SM-2 quality score (0–5)
const DIFFICULTY_TO_QUALITY: Record<DifficultyHint, number> = {
  facil:   4,
  medio:   3,
  dificil: 2,
}

// Maps accuracy percent → SM-2 quality score
function accuracyToQuality(accuracy: number): number {
  if (accuracy >= 90) return 5
  if (accuracy >= 80) return 4
  if (accuracy >= 70) return 3
  if (accuracy >= 60) return 2
  return 1
}

// SM-2: calculate next review dates for a topic
function sm2ReviewDates(
  studyDate: string,
  quality: number,        // 0–5
  easeFactor = 2.5,       // initial ease factor
): string[] {
  const dates: string[] = []
  let interval   = 1    // days until next review
  let ef         = easeFactor

  // SM-2 generates 3 review dates
  for (let rep = 0; rep < 3; rep++) {
    if (quality < 3) {
      // Failed — restart
      interval = 1
    } else {
      if (rep === 0)      interval = 1
      else if (rep === 1) interval = 3
      else                interval = Math.round(interval * ef)

      // Update ease factor
      ef = Math.max(1.3, ef + 0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02))
    }

    const reviewDate = new Date(studyDate)
    reviewDate.setDate(reviewDate.getDate() + interval)
    dates.push(reviewDate.toISOString().split('T')[0])

    interval = Math.max(1, Math.round(interval * ef))
  }

  return dates
}

// ── Tool definitions ──────────────────────────────────────────────────────────

export const SPACED_REP_TOOLS: Anthropic.Tool[] = [
  {
    name: 'calculate_review_schedule',
    description: 'Calculates adaptive spaced-repetition review dates for each topic using the SM-2 algorithm. Call during plan generation to replace fixed +1/+3/+7/+21 day intervals.',
    input_schema: {
      type: 'object' as const,
      required: ['topics'],
      properties: {
        topics: {
          type: 'array',
          description: 'Topics to calculate review dates for',
          items: {
            type: 'object',
            required: ['topic', 'study_date', 'difficulty_hint'],
            properties: {
              topic:           { type: 'string' },
              study_date:      { type: 'string', description: 'ISO date string (YYYY-MM-DD)' },
              difficulty_hint: { type: 'string', enum: ['facil', 'medio', 'dificil'] },
            },
          },
        },
        student_performance_history: {
          type: 'array',
          description: 'Optional: past exercise accuracy per topic. Overrides difficulty_hint if provided.',
          items: {
            type: 'object',
            required: ['topic', 'accuracy_percent'],
            properties: {
              topic:            { type: 'string' },
              accuracy_percent: { type: 'number', minimum: 0, maximum: 100 },
            },
          },
        },
      },
    },
  },
  {
    name: 'get_next_reviews_due',
    description: 'Returns overdue, due-today, and upcoming reviews for the next 7 days based on SM-2 schedule. Used by checkin and recalibrate.',
    input_schema: {
      type: 'object' as const,
      required: ['review_schedule', 'as_of_date'],
      properties: {
        review_schedule: {
          type: 'array',
          description: 'Review schedule from calculate_review_schedule output',
          items: {
            type: 'object',
            required: ['topic', 'review_dates'],
            properties: {
              topic:        { type: 'string' },
              review_dates: { type: 'array', items: { type: 'string' } },
            },
          },
        },
        as_of_date:    { type: 'string', description: 'Reference date (ISO YYYY-MM-DD). Defaults to today.' },
        completed_topics: {
          type: 'array',
          description: 'Topics where review was already completed (to exclude from overdue/due lists)',
          items: { type: 'string' },
        },
      },
    },
  },
]

// ── Tool executors ────────────────────────────────────────────────────────────

export interface ReviewScheduleEntry {
  topic:        string
  study_date:   string
  review_dates: string[]
  ease_factor:  number
}

export function calculateReviewSchedule(input: {
  topics: Array<{ topic: string; study_date: string; difficulty_hint: DifficultyHint }>
  student_performance_history?: Array<{ topic: string; accuracy_percent: number }>
}): ReviewScheduleEntry[] {
  const performanceMap = new Map<string, number>(
    (input.student_performance_history ?? []).map(p => [p.topic, p.accuracy_percent])
  )

  return input.topics.map(({ topic, study_date, difficulty_hint }) => {
    const accuracy = performanceMap.get(topic)
    const quality  = accuracy !== undefined
      ? accuracyToQuality(accuracy)
      : DIFFICULTY_TO_QUALITY[difficulty_hint]

    const easeFactor   = Math.max(1.3, 2.5 + 0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02))
    const review_dates = sm2ReviewDates(study_date, quality, easeFactor)

    return { topic, study_date, review_dates, ease_factor: Math.round(easeFactor * 100) / 100 }
  })
}

export interface NextReviewsDueResult {
  overdue_topics:     string[]
  due_today:          string[]
  upcoming_7days:     string[]
}

export function getNextReviewsDue(input: {
  review_schedule:   Array<{ topic: string; review_dates: string[] }>
  as_of_date:        string
  completed_topics?: string[]
}): NextReviewsDueResult {
  const today     = new Date(input.as_of_date)
  today.setHours(0, 0, 0, 0)
  const in7days   = new Date(today)
  in7days.setDate(today.getDate() + 7)

  const completed = new Set(input.completed_topics ?? [])

  const overdue: string[]    = []
  const dueToday: string[]   = []
  const upcoming: string[]   = []

  for (const entry of input.review_schedule) {
    if (completed.has(entry.topic)) continue
    for (const dateStr of entry.review_dates) {
      const d = new Date(dateStr)
      d.setHours(0, 0, 0, 0)
      if (d < today)        { overdue.push(entry.topic); break }
      if (d.getTime() === today.getTime()) { dueToday.push(entry.topic); break }
      if (d <= in7days)     { upcoming.push(entry.topic); break }
    }
  }

  return { overdue_topics: overdue, due_today: dueToday, upcoming_7days: upcoming }
}

// ── Executor dispatcher ───────────────────────────────────────────────────────

export function executeSpacedRepTool(name: string, input: unknown): unknown {
  switch (name) {
    case 'calculate_review_schedule': return calculateReviewSchedule(input as Parameters<typeof calculateReviewSchedule>[0])
    case 'get_next_reviews_due':      return getNextReviewsDue(input as Parameters<typeof getNextReviewsDue>[0])
    default: throw new Error(`Unknown spaced-rep tool: ${name}`)
  }
}
