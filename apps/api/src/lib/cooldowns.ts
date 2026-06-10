import type { CooldownResponse } from '@educarseia/types'
import { supabase } from './supabase'

export type SkillType = 'checkin' | 'recalibrate'

const COOLDOWN_HOURS: Record<SkillType, number> = {
  checkin:     24,
  recalibrate: 168, // 1 semana
}

const COOLDOWN_MESSAGES: Record<SkillType, string> = {
  checkin:     'Você já fez check-in recentemente. Tente novamente mais tarde.',
  recalibrate: 'Você já recalibrou o plano recentemente. Tente novamente na próxima semana.',
}

export interface CooldownResult {
  allowed:   boolean
  cooldown?: CooldownResponse
}

// Verifica cooldown por (user_id, skill_type, plan_id). Quando plan_id é
// ausente (Phase 1, dados manuais), o cooldown é aplicado por usuário.
export const checkSkillCooldown = async (
  userId: string,
  planId: string | undefined,
  skillType: SkillType,
): Promise<CooldownResult> => {
  let query = supabase
    .from('skill_usage_log')
    .select('created_at')
    .eq('user_id', userId)
    .eq('skill_type', skillType)
    .order('created_at', { ascending: false })
    .limit(1)

  query = planId ? query.eq('plan_id', planId) : query.is('plan_id', null)

  const { data, error } = await query.maybeSingle()
  if (error || !data) return { allowed: true } // fail open: não bloqueia por erro de DB

  const cooldownMs = COOLDOWN_HOURS[skillType] * 60 * 60 * 1000
  const retryAt    = new Date(new Date(data.created_at as string).getTime() + cooldownMs)

  if (retryAt > new Date()) {
    return {
      allowed:  false,
      cooldown: {
        cooldown: true,
        retry_at: retryAt.toISOString(),
        message:  COOLDOWN_MESSAGES[skillType],
      },
    }
  }
  return { allowed: true }
}

export const recordSkillUsage = async (
  userId: string,
  planId: string | undefined,
  skillType: SkillType,
): Promise<void> => {
  const { error } = await supabase
    .from('skill_usage_log')
    .insert({ user_id: userId, plan_id: planId ?? null, skill_type: skillType })

  if (error) console.error(`[cooldowns] falha ao registrar uso de ${skillType}:`, error.message)
}
