import { PLAN_LIMITS } from '@educarseia/types'
import type { UserPlan, LimitedResponse, UsageWarning } from '@educarseia/types'
import { supabase } from './supabase'

// ── Constantes ────────────────────────────────────────────────────────────────

const WARNING_THRESHOLD = 0.8  // Avisa quando uso >= 80%

// ── Helpers internos ──────────────────────────────────────────────────────────

const buildUsage = (used: number, max: number | null) => ({
  used,
  max,
  percent: max === null ? 0 : Math.round((used / max) * 100),
})

// ── Verificação de limite de planos ──────────────────────────────────────────

export interface PlansLimitResult {
  allowed: boolean
  limited?: LimitedResponse
}

export const checkPlansLimit = async (
  userId: string,
  plan: UserPlan,
  plansCount: number,
): Promise<PlansLimitResult> => {
  const { maxPlans } = PLAN_LIMITS[plan]
  if (maxPlans === null) return { allowed: true }

  if (plansCount >= maxPlans) {
    return {
      allowed: false,
      limited: {
        limited:     true,
        upgrade_url: '/planos',
        usage:       buildUsage(plansCount, maxPlans),
      },
    }
  }
  return { allowed: true }
}

// ── Verificação e incremento de API calls ────────────────────────────────────

export interface ApiCallResult {
  allowed:  boolean
  warning?: UsageWarning
  limited?: LimitedResponse
}

export const checkAndIncrementApiCall = async (
  userId: string,
  plan: UserPlan,
): Promise<ApiCallResult> => {
  const { maxApiCallsPerMonth } = PLAN_LIMITS[plan]

  // Planos ilimitados: sempre permitido. Tracking via RPC (incremento atômico,
  // fire-and-forget — não bloqueia a resposta nem falha a requisição).
  if (maxApiCallsPerMonth === null) {
    void supabase.rpc('increment_api_calls', { user_id: userId }).then(({ error }) => {
      if (error) console.error('[limits] increment_api_calls falhou:', error.message)
    })
    return { allowed: true }
  }

  // Busca estado atual com verificação de reset mensal
  const { data: user, error } = await supabase
    .from('users')
    .select('api_calls_this_month, api_calls_reset_at')
    .eq('id', userId)
    .single()

  if (error || !user) return { allowed: true }  // fail open: não bloqueia por erro de DB

  // Reset mensal se passou a data
  let currentCalls = user.api_calls_this_month as number
  const resetAt    = user.api_calls_reset_at ? new Date(user.api_calls_reset_at as string) : null

  if (resetAt && new Date() >= resetAt) {
    currentCalls = 0
    const nextReset = new Date()
    nextReset.setMonth(nextReset.getMonth() + 1)
    nextReset.setDate(1)
    nextReset.setHours(0, 0, 0, 0)

    await supabase
      .from('users')
      .update({ api_calls_this_month: 0, api_calls_reset_at: nextReset.toISOString() })
      .eq('id', userId)
  }

  // Verificar limite
  if (currentCalls >= maxApiCallsPerMonth) {
    return {
      allowed: false,
      limited: {
        limited:     true,
        upgrade_url: '/planos',
        usage:       buildUsage(currentCalls, maxApiCallsPerMonth),
      },
    }
  }

  // Incrementar
  await supabase
    .from('users')
    .update({ api_calls_this_month: currentCalls + 1 })
    .eq('id', userId)

  const newCount = currentCalls + 1
  const percent  = Math.round((newCount / maxApiCallsPerMonth) * 100)

  // Aviso a 80%
  if (percent >= WARNING_THRESHOLD * 100) {
    return {
      allowed: true,
      warning: {
        warning: true,
        usage:   buildUsage(newCount, maxApiCallsPerMonth),
      },
    }
  }

  return { allowed: true }
}
