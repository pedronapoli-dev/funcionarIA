import { createClient } from './supabase'
import type { Plan, Subject, Exercise, CreatePlanInput, PlanCheckin, RecalibrateResult } from '@/types'

const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001'

async function getAuthHeader(): Promise<Record<string, string>> {
  const supabase = createClient()
  const { data } = await supabase.auth.getSession()
  const token = data.session?.access_token
  return token ? { Authorization: `Bearer ${token}` } : {}
}

async function request<T>(method: string, path: string, body?: unknown): Promise<T> {
  const authHeader = await getAuthHeader()
  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers: { 'Content-Type': 'application/json', ...authHeader },
    body: body ? JSON.stringify(body) : undefined,
  })
  if (!res.ok) { const err = await res.json().catch(() => ({ error: res.statusText })); throw { status: res.status, ...err } }
  if (res.status === 204) return undefined as T
  return res.json()
}

export const subjectsApi = {
  uploadPdf: async (file: File) => {
    const authHeader = await getAuthHeader()
    const form = new FormData()
    form.append('file', file)
    const res = await fetch(`${BASE_URL}/api/subjects/upload`, { method: 'POST', headers: authHeader, body: form })
    if (!res.ok) { const err = await res.json().catch(() => ({ error: res.statusText })); throw { status: res.status, ...err } }
    return res.json() as Promise<{ subject: Subject }>
  },
  fromText: (text: string)  => request<{ subject: Subject }>('POST', '/api/subjects/text', { text }),
  list:     ()              => request<{ subjects: Subject[] }>('GET', '/api/subjects'),
  get:      (id: string)    => request<{ subject: Subject }>('GET', `/api/subjects/${id}`),
  patch:    (id: string, body: Partial<Pick<Subject, 'name' | 'code' | 'course' | 'university' | 'credits'>>) =>
    request<{ subject: Subject }>('PATCH', `/api/subjects/${id}`, body),
  delete:   (id: string)    => request<void>('DELETE', `/api/subjects/${id}`),
}

export const plansApi = {
  generate: (body: CreatePlanInput) => request<{ plan: Plan }>('POST', '/api/plans', body),
  list:     ()                      => request<{ plans: Plan[] }>('GET', '/api/plans'),
  get:      (id: string)            => request<{ plan: Plan }>('GET', `/api/plans/${id}`),
  delete:   (id: string)            => request<void>('DELETE', `/api/plans/${id}`),
  completeSession: (planId: string, week: number, day: number, durationActual?: number) =>
    request<{ ok: boolean }>('PATCH', `/api/plans/${planId}/session`, { week, day, duration_actual: durationActual }),
}

export const skillsApi = {
  checkin: (body: {
    plan_id?: string
    week: number
    topics_covered: string[]
    mastery_criteria_results: { topic: string; achieved: boolean; notes?: string }[]
    spaced_reviews_done: boolean
    difficulties: string
    hours_studied_this_week: number
    hours_planned_this_week: number
    application_context: string
  }) => request<{ checkin: PlanCheckin }>('POST', '/api/skills/checkin', body),

  recalibrate: (body: {
    plan_id?: string
    blocked_topic: string
    block_type: 'compreensão' | 'ritmo-baixo' | 'ritmo-alto' | 'motivação'
    weeks_current: number
    weeks_remaining: number
    topics_remaining: string[]
    topics_done: string[]
    application_context: string
    current_scaffolding: string
  }) => request<{ recalibration: RecalibrateResult }>('POST', '/api/skills/recalibrate', body),
}

export const exercisesApi = {
  generate: (body: { plan_id: string; topic: string; subject_name: string; course?: string; count?: number; bloom_level?: string; plan_phase?: string }) =>
    request<{ exercises: Exercise[] }>('POST', '/api/exercises/generate', body),
  listByPlan: (planId: string) => request<{ exercises: Exercise[] }>('GET', `/api/exercises?plan_id=${planId}`),
  answer: (exerciseId: string, answer: string) =>
    request<{ correct: boolean; answer: string; explanation: string }>('PATCH', `/api/exercises/${exerciseId}/answer`, { answer }),
}
