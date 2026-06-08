import { generate, parseJsonResponse } from '../lib/anthropic'
import { supabase } from '../lib/supabase'
import { GENERATE_EXERCISES_SYSTEM, generateExercisesPrompt } from '../lib/prompts'
import type { Exercise } from '@funcionaria/types'

interface ParsedExercise {
  question:         string
  options:          { key: string; text: string }[]
  answer:           string
  explanation?:     string
  type?:            string
  bloom_level?:     string
  scaffolded_hint?: string
}

const VALID_TYPES = new Set(['conceitual', 'aplicacao', 'analise', 'metacognitiva'])

export const generateAndSaveExercises = async (params: {
  userId: string; planId: string; topic: string
  subjectName: string; course?: string; count?: number; bloomLevel?: string
  planPhase?: 'inicial' | 'intermediaria' | 'final'
}) => {
  const response = await generate(
    GENERATE_EXERCISES_SYSTEM,
    generateExercisesPrompt({ topic: params.topic, subjectName: params.subjectName, course: params.course, count: params.count, bloomLevel: params.bloomLevel, planPhase: params.planPhase }),
    2048
  )
  const raw = parseJsonResponse<unknown[]>(response, 'exercícios')
  if (!Array.isArray(raw)) throw new Error('Falha ao gerar exercícios. Tente novamente.')

  const rows = (raw as ParsedExercise[]).map((e) => ({
    user_id:         params.userId,
    plan_id:         params.planId,
    topic:           params.topic,
    question:        e.question,
    options:         e.options ?? [],
    answer:          e.answer ?? '',
    explanation:     e.explanation ?? '',
    type:            VALID_TYPES.has(e.type ?? '') ? e.type! : 'conceitual',
    scaffolded_hint: e.scaffolded_hint ?? null,
  }))
  const { data, error } = await supabase.from('exercises').insert(rows).select()
  if (error) throw error
  return data
}

export const answerExercise = async (userId: string, exerciseId: string, userAnswer: string) => {
  const { data, error } = await supabase
    .from('exercises')
    .update({ user_answer: userAnswer, answered_at: new Date().toISOString() })
    .eq('id', exerciseId).eq('user_id', userId).select().single()
  if (error) throw error
  return data as Exercise
}
