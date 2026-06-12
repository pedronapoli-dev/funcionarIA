import { FastifyPluginAsync } from 'fastify'
import Stripe from 'stripe'
import { supabase } from '../lib/supabase'
import { getUserId } from '../plugins/auth'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2024-04-10' })

export const accountRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.delete('/account', { preHandler: [fastify.authenticate] }, async (request, reply) => {
    const userId = getUserId(request)

    const { data: user, error: fetchErr } = await supabase
      .from('users').select('stripe_customer_id').eq('id', userId).single()
    if (fetchErr) return reply.status(500).send({ error: 'Erro ao buscar dados da conta.' })

    if (user?.stripe_customer_id) {
      try {
        for (const status of ['active', 'trialing'] as const) {
          const subs = await stripe.subscriptions.list({ customer: user.stripe_customer_id, status })
          await Promise.all(subs.data.map(s => stripe.subscriptions.cancel(s.id)))
        }
      } catch (err) {
        fastify.log.error({ userId, stripeCustomerId: user.stripe_customer_id, err }, 'Falha ao cancelar assinatura Stripe ao excluir conta')
      }
    }

    const { error: deleteErr } = await supabase.auth.admin.deleteUser(userId)
    if (deleteErr) return reply.status(500).send({ error: 'Erro ao excluir conta.' })

    return reply.status(204).send()
  })
}
