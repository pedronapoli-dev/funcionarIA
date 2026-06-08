import { FastifyPluginAsync } from 'fastify'
import type { PlanPhase } from '@funcionaria/types'
import { supabase } from '../lib/supabase'
import { getUserId } from '../plugins/auth'
import { generateAndSaveExercises, answerExercise } from '../services/exerciseService'

export const exercisesRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.post<{ Body: { plan_id: string; topic: string; subject_name: string; course?: string; count?: number; bloom_level?: string; plan_phase?: string } }>('/generate', {
    preHandler: [fastify.authenticate],
    schema: { body: { type: 'object', required: ['plan_id', 'topic', 'subject_name'],
      properties: { plan_id: { type: 'string' }, topic: { type: 'string' }, subject_name: { type: 'string' }, course: { type: 'string' },
        count: { type: 'integer', minimum: 1, maximum: 5 },
        bloom_level: { type: 'string', enum: ['lembrar', 'entender', 'aplicar', 'analisar', 'avaliar', 'criar'] },
        plan_phase: { type: 'string', enum: ['inicial', 'intermediaria', 'final'] } } } },
  }, async (request, reply) => {
    const userId = getUserId(request)
    const exercises = await generateAndSaveExercises({ userId, planId: request.body.plan_id,
      topic: request.body.topic, subjectName: request.body.subject_name, course: request.body.course,
      count: request.body.count, bloomLevel: request.body.bloom_level, planPhase: request.body.plan_phase as PlanPhase | undefined })
    return reply.status(201).send({ exercises })
  })

  fastify.get<{ Querystring: { plan_id: string } }>('/', { preHandler: [fastify.authenticate] }, async (request, reply) => {
    const userId = getUserId(request)
    if (!request.query.plan_id) return reply.status(400).send({ error: 'plan_id obrigatório' })
    const { data, error } = await supabase.from('exercises').select('*')
      .eq('plan_id', request.query.plan_id).eq('user_id', userId).order('created_at', { ascending: true })
    if (error) throw error
    return { exercises: data }
  })

  fastify.patch<{ Params: { id: string }; Body: { answer: string } }>('/:id/answer', {
    preHandler: [fastify.authenticate],
    schema: { body: { type: 'object', required: ['answer'], properties: { answer: { type: 'string', enum: ['a', 'b', 'c', 'd'] } } } },
  }, async (request) => {
    const userId   = getUserId(request)
    const exercise = await answerExercise(userId, request.params.id, request.body.answer)
    return { correct: exercise.answer === request.body.answer, answer: exercise.answer, explanation: exercise.explanation }
  })
}
