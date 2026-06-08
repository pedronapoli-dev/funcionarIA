import { FastifyPluginAsync } from 'fastify'
import { supabase } from '../lib/supabase'
import { getUserId } from '../plugins/auth'
import { generateAndSavePlan, completeSession } from '../services/planService'

const FREE_PLAN_LIMIT = 2

export const plansRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.post<{
    Body: {
      subject_id:    string
      hours_per_day: number
      days_per_week: number
      exam_date?:    string
      course?:       string
      enable_sm2?:     boolean
      enable_youtube?: boolean
      student_profile?: {
        prior_knowledge_level:  number
        learning_formats:       string[]
        previous_blocks?:       string[]
        application_context:    string
        weekly_hours_available: number
      }
    }
  }>('/', {
    preHandler: [fastify.authenticate],
    schema: { body: { type: 'object', required: ['subject_id', 'hours_per_day', 'days_per_week'],
      properties: {
        subject_id:      { type: 'string' },
        hours_per_day:   { type: 'number', minimum: 0.5, maximum: 12 },
        days_per_week:   { type: 'integer', minimum: 1, maximum: 7 },
        exam_date:       { type: 'string' },
        course:          { type: 'string' },
        enable_sm2:      { type: 'boolean' },
        enable_youtube:  { type: 'boolean' },
        student_profile: { type: 'object', properties: {
          prior_knowledge_level:  { type: 'number', minimum: 0, maximum: 10 },
          learning_formats:       { type: 'array', items: { type: 'string' } },
          previous_blocks:        { type: 'array', items: { type: 'string' } },
          application_context:    { type: 'string' },
          weekly_hours_available: { type: 'number' },
        } },
      } } },
  }, async (request, reply) => {
    const userId = getUserId(request)
    const { data: user } = await supabase.from('users').select('plan, plans_count').eq('id', userId).single()
    if (user?.plan === 'free' && (user?.plans_count ?? 0) >= FREE_PLAN_LIMIT)
      return reply.status(402).send({ error: 'Limite do plano gratuito atingido.', upgrade_url: '/planos' })
    const sp = request.body.student_profile
    const plan = await generateAndSavePlan({
      userId, subjectId: request.body.subject_id,
      hoursPerDay: request.body.hours_per_day, daysPerWeek: request.body.days_per_week,
      examDate: request.body.exam_date, course: request.body.course,
      enableSm2:     request.body.enable_sm2,
      enableYoutube: request.body.enable_youtube,
      priorKnowledgeLevel: sp?.prior_knowledge_level,
      learningFormats:     sp?.learning_formats,
      applicationContext:  sp?.application_context,
    })
    return reply.status(201).send({ plan })
  })

  fastify.get('/', { preHandler: [fastify.authenticate] }, async (request) => {
    const userId = getUserId(request)
    const { data, error } = await supabase.from('plans')
      .select('id, title, status, progress, total_weeks, exam_date, created_at, subjects ( id, name, code )')
      .eq('user_id', userId).order('created_at', { ascending: false })
    if (error) throw error
    return { plans: data }
  })

  fastify.get<{ Params: { id: string } }>('/:id', { preHandler: [fastify.authenticate] }, async (request, reply) => {
    const userId = getUserId(request)
    const { data, error } = await supabase.from('plans').select('*, subjects ( * )')
      .eq('id', request.params.id).eq('user_id', userId).single()
    if (error || !data) return reply.status(404).send({ error: 'Plano não encontrado' })
    return { plan: data }
  })

  fastify.patch<{ Params: { id: string }; Body: { week: number; day: number; duration_actual?: number } }>('/:id/session', {
    preHandler: [fastify.authenticate],
    schema: { body: { type: 'object', required: ['week', 'day'], properties: { week: { type: 'integer' }, day: { type: 'integer' }, duration_actual: { type: 'integer' } } } },
  }, async (request) => {
    const userId = getUserId(request)
    await completeSession(userId, request.params.id, request.body.week, request.body.day, request.body.duration_actual)
    return { ok: true }
  })

  fastify.delete<{ Params: { id: string } }>('/:id', { preHandler: [fastify.authenticate] }, async (request, reply) => {
    const userId = getUserId(request)
    const { error } = await supabase.from('plans').delete().eq('id', request.params.id).eq('user_id', userId)
    if (error) throw error
    return reply.status(204).send()
  })
}
