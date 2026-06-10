/**
 * Unit tests for apps/api/src/lib/cooldowns.ts
 *
 * Testa checkSkillCooldown (24h checkin / 168h recalibrate, escopo por plan_id
 * ou por usuário quando ausente) e recordSkillUsage.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'

// ── Mock Supabase — query builder encadeável que sempre retorna a si mesmo ────

const { mockMaybeSingle, mockInsert, mockFrom, mockEq, mockIs } = vi.hoisted(() => {
  const mockMaybeSingle = vi.fn()
  const mockInsert      = vi.fn()
  const chain: Record<string, ReturnType<typeof vi.fn>> = {}
  const mockEq = vi.fn(() => chain)
  const mockIs = vi.fn(() => chain)
  chain.select      = vi.fn(() => chain)
  chain.eq          = mockEq
  chain.order       = vi.fn(() => chain)
  chain.limit       = vi.fn(() => chain)
  chain.is          = mockIs
  chain.maybeSingle = mockMaybeSingle
  chain.insert      = mockInsert
  const mockFrom = vi.fn(() => chain)
  return { mockMaybeSingle, mockInsert, mockFrom, mockEq, mockIs }
})

vi.mock('../supabase', () => ({
  supabase: { from: mockFrom },
}))

// ── Imports após mock ─────────────────────────────────────────────────────────

import { checkSkillCooldown, recordSkillUsage } from '../cooldowns'

const HOUR = 60 * 60 * 1000

beforeEach(() => {
  vi.clearAllMocks()
  mockInsert.mockResolvedValue({ error: null })
})

// ── checkSkillCooldown ────────────────────────────────────────────────────────

describe('checkSkillCooldown', () => {
  it('permite quando não há uso anterior', async () => {
    mockMaybeSingle.mockResolvedValueOnce({ data: null, error: null })
    const r = await checkSkillCooldown('u1', 'p1', 'checkin')
    expect(r.allowed).toBe(true)
    expect(r.cooldown).toBeUndefined()
  })

  it('falha aberta (allowed:true) quando DB retorna erro', async () => {
    mockMaybeSingle.mockResolvedValueOnce({ data: null, error: { message: 'DB error' } })
    const r = await checkSkillCooldown('u1', 'p1', 'checkin')
    expect(r.allowed).toBe(true)
  })

  it('bloqueia checkin feito há 1h (cooldown de 24h)', async () => {
    const oneHourAgo = new Date(Date.now() - 1 * HOUR).toISOString()
    mockMaybeSingle.mockResolvedValueOnce({ data: { created_at: oneHourAgo }, error: null })

    const r = await checkSkillCooldown('u1', 'p1', 'checkin')
    expect(r.allowed).toBe(false)
    expect(r.cooldown?.cooldown).toBe(true)
    expect(r.cooldown?.message).toMatch(/check-in/i)

    const expectedRetry = new Date(oneHourAgo).getTime() + 24 * HOUR
    expect(new Date(r.cooldown!.retry_at).getTime()).toBe(expectedRetry)
  })

  it('permite checkin feito há 25h (cooldown de 24h expirado)', async () => {
    const twentyFiveHoursAgo = new Date(Date.now() - 25 * HOUR).toISOString()
    mockMaybeSingle.mockResolvedValueOnce({ data: { created_at: twentyFiveHoursAgo }, error: null })

    const r = await checkSkillCooldown('u1', 'p1', 'checkin')
    expect(r.allowed).toBe(true)
  })

  it('bloqueia recalibrate feito há 1 dia (cooldown de 168h/1 semana)', async () => {
    const oneDayAgo = new Date(Date.now() - 24 * HOUR).toISOString()
    mockMaybeSingle.mockResolvedValueOnce({ data: { created_at: oneDayAgo }, error: null })

    const r = await checkSkillCooldown('u1', 'p1', 'recalibrate')
    expect(r.allowed).toBe(false)
    expect(r.cooldown?.message).toMatch(/recalibr/i)

    const expectedRetry = new Date(oneDayAgo).getTime() + 168 * HOUR
    expect(new Date(r.cooldown!.retry_at).getTime()).toBe(expectedRetry)
  })

  it('permite recalibrate feito há 8 dias (cooldown de 168h expirado)', async () => {
    const eightDaysAgo = new Date(Date.now() - 8 * 24 * HOUR).toISOString()
    mockMaybeSingle.mockResolvedValueOnce({ data: { created_at: eightDaysAgo }, error: null })

    const r = await checkSkillCooldown('u1', 'p1', 'recalibrate')
    expect(r.allowed).toBe(true)
  })

  it('filtra por plan_id quando fornecido', async () => {
    mockMaybeSingle.mockResolvedValueOnce({ data: null, error: null })
    await checkSkillCooldown('u1', 'p1', 'checkin')
    expect(mockEq).toHaveBeenCalledWith('plan_id', 'p1')
    expect(mockIs).not.toHaveBeenCalled()
  })

  it('filtra por plan_id nulo quando ausente (Phase 1)', async () => {
    mockMaybeSingle.mockResolvedValueOnce({ data: null, error: null })
    await checkSkillCooldown('u1', undefined, 'checkin')
    expect(mockIs).toHaveBeenCalledWith('plan_id', null)
  })
})

// ── recordSkillUsage ──────────────────────────────────────────────────────────

describe('recordSkillUsage', () => {
  it('insere registro com plan_id quando fornecido', async () => {
    await recordSkillUsage('u1', 'p1', 'checkin')
    expect(mockInsert).toHaveBeenCalledWith({ user_id: 'u1', plan_id: 'p1', skill_type: 'checkin' })
  })

  it('insere registro com plan_id nulo quando ausente', async () => {
    await recordSkillUsage('u1', undefined, 'recalibrate')
    expect(mockInsert).toHaveBeenCalledWith({ user_id: 'u1', plan_id: null, skill_type: 'recalibrate' })
  })

  it('não lança erro quando insert falha', async () => {
    mockInsert.mockResolvedValueOnce({ error: { message: 'boom' } })
    await expect(recordSkillUsage('u1', 'p1', 'checkin')).resolves.toBeUndefined()
  })
})
