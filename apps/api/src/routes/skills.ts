import { FastifyPluginAsync } from 'fastify'
import type { UserPlan } from '@educarseia/types'
import { runDiagnosis }     from '../services/diagnoseService'
import { runCheckin }       from '../services/checkinService'
import { runRecalibration } from '../services/recalibrateService'
import { supabase }         from '../lib/supabase'
import { getUserId }        from '../plugins/auth'
import { checkAndIncrementApiCall } from '../lib/limits'
import { checkSkillCooldown, recordSkillUsage } from '../lib/cooldowns'

const MAX_TOPICS_FOR_PLAN = 30   // caps output tokens in generate-plan

export const skillsRoutes: FastifyPluginAsync = async (fastify) => {

  // POST /api/skills/diagnose
  // Pedagogical diagnostic before plan generation.
  // Uses generate() — no MCP needed (self-contained analysis).
  fastify.post<{
    Body: {
      subject_name:        string
      topics:              string[]
      prior_knowledge_level: number
      learning_formats:    string[]
      previous_blocks?:    string[]
      application_context: string
      weekly_hours:        number
      exam_date?:          string
    }
  }>('/diagnose', {
    preHandler: [fastify.authenticate],
    schema: {
      body: {
        type: 'object',
        required: ['subject_name', 'topics', 'prior_knowledge_level', 'learning_formats', 'application_context', 'weekly_hours'],
        properties: {
          subject_name:           { type: 'string' },
          topics:                 { type: 'array', items: { type: 'string' }, maxItems: MAX_TOPICS_FOR_PLAN },
          prior_knowledge_level:  { type: 'number', minimum: 0, maximum: 10 },
          learning_formats:       { type: 'array', items: { type: 'string' } },
          previous_blocks:        { type: 'array', items: { type: 'string' } },
          application_context:    { type: 'string' },
          weekly_hours:           { type: 'number', minimum: 1, maximum: 168 },
          exam_date:              { type: 'string' },
        },
      },
    },
  }, async (request, reply) => {
    const result = await runDiagnosis({
      subjectName:         request.body.subject_name,
      topics:              request.body.topics,
      priorKnowledgeLevel: request.body.prior_knowledge_level,
      learningFormats:     request.body.learning_formats,
      previousBlocks:      request.body.previous_blocks,
      applicationContext:  request.body.application_context,
      weeklyHours:         request.body.weekly_hours,
      examDate:            request.body.exam_date,
    })
    return reply.status(200).send({ diagnostic: result })
  })

  // POST /api/skills/checkin
  // Weekly progress evaluation. Phase 1: manual data. Phase 2: Supabase MCP.
  // Cooldown: 1 call per 24h per plan (per usuário quando plan_id ausente).
  fastify.post<{
    Body: {
      plan_id?:                 string   // optional now; required in Phase 2 for MCP
      week:                     number
      topics_covered:           string[]
      mastery_criteria_results: { topic: string; achieved: boolean; notes?: string }[]
      spaced_reviews_done:      boolean
      difficulties:             string
      hours_studied_this_week:  number
      hours_planned_this_week:  number
      application_context:      string
    }
  }>('/checkin', {
    preHandler: [fastify.authenticate],
    schema: {
      body: {
        type: 'object',
        required: ['week', 'topics_covered', 'mastery_criteria_results', 'spaced_reviews_done', 'difficulties', 'hours_studied_this_week', 'hours_planned_this_week', 'application_context'],
        properties: {
          plan_id:                  { type: 'string' },
          week:                     { type: 'integer', minimum: 1 },
          topics_covered:           { type: 'array', items: { type: 'string' } },
          mastery_criteria_results: {
            type: 'array',
            items: {
              type: 'object',
              required: ['topic', 'achieved'],
              properties: { topic: { type: 'string' }, achieved: { type: 'boolean' }, notes: { type: 'string' } },
            },
          },
          spaced_reviews_done:     { type: 'boolean' },
          difficulties:            { type: 'string' },
          hours_studied_this_week: { type: 'number', minimum: 0 },
          hours_planned_this_week: { type: 'number', minimum: 0 },
          application_context:     { type: 'string' },
        },
      },
    },
  }, async (request, reply) => {
    const userId = getUserId(request)
    const planId = request.body.plan_id

    const cooldownResult = await checkSkillCooldown(userId, planId, 'checkin')
    if (!cooldownResult.allowed) return reply.status(429).send(cooldownResult.cooldown)

    const { data: user } = await supabase.from('users').select('plan').eq('id', userId).single()
    const callResult = await checkAndIncrementApiCall(userId, (user?.plan ?? 'free') as UserPlan)
    if (!callResult.allowed) return reply.status(402).send(callResult.limited)

    const result = await runCheckin({
      week:                   request.body.week,
      topicsCovered:          request.body.topics_covered,
      masteryCriteriaResults: request.body.mastery_criteria_results,
      spacedReviewsDone:      request.body.spaced_reviews_done,
      difficulties:           request.body.difficulties,
      hoursStudiedThisWeek:   request.body.hours_studied_this_week,
      hoursPlannedThisWeek:   request.body.hours_planned_this_week,
      applicationContext:     request.body.application_context,
    }, planId)

    await recordSkillUsage(userId, planId, 'checkin')

    return reply.status(200).send({ checkin: result, ...(callResult.warning ?? {}) })
  })

  // POST /api/skills/recalibrate
  // Plan recalibration when a block is detected. Phase 1: manual data. Phase 2: Supabase MCP.
  // Cooldown: 1 call per 168h (1 week) per plan (per usuário quando plan_id ausente).
  fastify.post<{
    Body: {
      plan_id?:            string   // optional now; required in Phase 2 for MCP
      blocked_topic:       string
      block_type:          'compreensão' | 'ritmo-baixo' | 'ritmo-alto' | 'motivação'
      weeks_current:       number
      weeks_remaining:     number
      topics_remaining:    string[]
      topics_done:         string[]
      application_context: string
      current_scaffolding: string
    }
  }>('/recalibrate', {
    preHandler: [fastify.authenticate],
    schema: {
      body: {
        type: 'object',
        required: ['blocked_topic', 'block_type', 'weeks_current', 'weeks_remaining', 'topics_remaining', 'topics_done', 'application_context', 'current_scaffolding'],
        properties: {
          plan_id:             { type: 'string' },
          blocked_topic:       { type: 'string' },
          block_type:          { type: 'string', enum: ['compreensão', 'ritmo-baixo', 'ritmo-alto', 'motivação'] },
          weeks_current:       { type: 'integer', minimum: 1 },
          weeks_remaining:     { type: 'integer', minimum: 0 },
          topics_remaining:    { type: 'array', items: { type: 'string' } },
          topics_done:         { type: 'array', items: { type: 'string' } },
          application_context: { type: 'string' },
          current_scaffolding: { type: 'string', enum: ['alto', 'medio', 'baixo'] },
        },
      },
    },
  }, async (request, reply) => {
    const userId = getUserId(request)
    const planId = request.body.plan_id

    const cooldownResult = await checkSkillCooldown(userId, planId, 'recalibrate')
    if (!cooldownResult.allowed) return reply.status(429).send(cooldownResult.cooldown)

    const { data: user } = await supabase.from('users').select('plan').eq('id', userId).single()
    const callResult = await checkAndIncrementApiCall(userId, (user?.plan ?? 'free') as UserPlan)
    if (!callResult.allowed) return reply.status(402).send(callResult.limited)

    const result = await runRecalibration({
      blockedTopic:       request.body.blocked_topic,
      blockType:          request.body.block_type,
      weeksCurrent:       request.body.weeks_current,
      weeksRemaining:     request.body.weeks_remaining,
      topicsRemaining:    request.body.topics_remaining,
      topicsDone:         request.body.topics_done,
      applicationContext: request.body.application_context,
      currentScaffolding: request.body.current_scaffolding,
    }, planId)

    await recordSkillUsage(userId, planId, 'recalibrate')

    return reply.status(200).send({ recalibration: result, ...(callResult.warning ?? {}) })
  })
}
