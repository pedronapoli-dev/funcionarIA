import { FastifyPluginAsync } from 'fastify'
import Stripe from 'stripe'
import { supabase } from '../lib/supabase'

declare module 'fastify' {
  interface FastifyRequest {
    rawBody?: Buffer
  }
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2024-04-10' })

export const webhookRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.post('/stripe', { config: { rawBody: true } }, async (request, reply) => {
    const sig = request.headers['stripe-signature'] as string
    let event: Stripe.Event
    try { event = stripe.webhooks.constructEvent(request.rawBody ?? Buffer.alloc(0), sig, process.env.STRIPE_WEBHOOK_SECRET!) }
    catch { return reply.status(400).send({ error: 'Assinatura inválida' }) }

    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as Stripe.Checkout.Session
      if (session.metadata?.user_id)
        await supabase.from('users').update({ plan: 'pro', stripe_customer_id: session.customer as string }).eq('id', session.metadata.user_id)
    }
    if (event.type === 'customer.subscription.deleted') {
      const sub = event.data.object as Stripe.Subscription
      await supabase.from('users').update({ plan: 'free' }).eq('stripe_customer_id', sub.customer as string)
    }
    return { received: true }
  })
}
