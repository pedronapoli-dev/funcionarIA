import { FastifyPluginAsync } from 'fastify'
import { supabase } from '../lib/supabase'
import { getUserId } from '../plugins/auth'
import { extractTextFromPdf, parseSubjectFromText, saveSubject } from '../services/subjectService'

export const subjectsRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.post('/upload', { preHandler: [fastify.authenticate] }, async (request, reply) => {
    const userId = getUserId(request)
    const data = await request.file()
    if (!data) return reply.status(400).send({ error: 'Nenhum arquivo enviado' })
    if (data.mimetype !== 'application/pdf') return reply.status(400).send({ error: 'Apenas PDF' })
    const buffer  = await data.toBuffer()
    const rawText = await extractTextFromPdf(buffer)
    if (rawText.length < 50) return reply.status(422).send({ error: 'PDF sem texto suficiente' })
    const parsed  = await parseSubjectFromText(rawText)
    const subject = await saveSubject(userId, parsed, rawText, 'pdf')
    return reply.status(201).send({ subject })
  })

  fastify.post('/text', {
    preHandler: [fastify.authenticate],
    schema: { body: { type: 'object', required: ['text'], properties: { text: { type: 'string', minLength: 50 } } } },
  }, async (request, reply) => {
    const userId = getUserId(request)
    const { text } = request.body as { text: string }
    const parsed  = await parseSubjectFromText(text)
    const subject = await saveSubject(userId, parsed, text, 'text')
    return reply.status(201).send({ subject })
  })

  fastify.get('/', { preHandler: [fastify.authenticate] }, async (request) => {
    const userId = getUserId(request)
    const { data, error } = await supabase.from('subjects')
      .select('id, name, code, workload_hours, credits, topics, created_at')
      .eq('user_id', userId).order('created_at', { ascending: false })
    if (error) throw error
    return { subjects: data }
  })

  fastify.get<{ Params: { id: string } }>('/:id', { preHandler: [fastify.authenticate] }, async (request, reply) => {
    const userId = getUserId(request)
    const { data, error } = await supabase.from('subjects').select('*')
      .eq('id', request.params.id).eq('user_id', userId).single()
    if (error || !data) return reply.status(404).send({ error: 'Ementa não encontrada' })
    return { subject: data }
  })

  fastify.patch<{ Params: { id: string } }>('/:id', { preHandler: [fastify.authenticate] }, async (request, reply) => {
    const userId = getUserId(request)
    const body = request.body as Partial<{ name: string; code: string | null; course: string | null; university: string | null; credits: number | null }>
    const allowed: Record<string, unknown> = {}
    for (const key of ['name', 'code', 'course', 'university', 'credits'] as const) {
      if (key in body) allowed[key] = body[key]
    }
    const { data, error } = await supabase.from('subjects')
      .update(allowed).eq('id', request.params.id).eq('user_id', userId).select().single()
    if (error || !data) return reply.status(404).send({ error: 'Ementa não encontrada' })
    return { subject: data }
  })

  fastify.delete<{ Params: { id: string } }>('/:id', { preHandler: [fastify.authenticate] }, async (request, reply) => {
    const userId = getUserId(request)
    const { error } = await supabase.from('subjects').delete().eq('id', request.params.id).eq('user_id', userId)
    if (error) throw error
    return reply.status(204).send()
  })
}
