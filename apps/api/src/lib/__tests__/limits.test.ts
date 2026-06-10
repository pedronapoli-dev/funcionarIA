/**
 * Unit tests for apps/api/src/lib/limits.ts
 *
 * Testa checkPlansLimit e checkAndIncrementApiCall para todos os tiers,
 * lógica de reset mensal, aviso de 80% e fail-open em erro de DB.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'

// ── Mock Supabase — vi.hoisted() garante inicialização antes do hoist de vi.mock ─

const { mockSingle, mockUpdate, mockEqUpdate, mockEqSelect, mockSelect, mockFrom, mockRpc } = vi.hoisted(() => ({
  mockSingle:   vi.fn(),
  mockUpdate:   vi.fn(),
  mockEqUpdate: vi.fn(),
  mockEqSelect: vi.fn(),
  mockSelect:   vi.fn(),
  mockFrom:     vi.fn(),
  mockRpc:      vi.fn(),
}))

vi.mock('../supabase', () => ({
  supabase: {
    from: mockFrom,
    rpc:  mockRpc,
  },
}))

// ── Imports após mock ─────────────────────────────────────────────────────────

import { checkPlansLimit, checkAndIncrementApiCall } from '../limits'

// ── Helpers ───────────────────────────────────────────────────────────────────

const NEXT_MONTH = (() => {
  const d = new Date()
  d.setMonth(d.getMonth() + 1)
  d.setDate(1)
  d.setHours(0, 0, 0, 0)
  return d
})()

const PAST_RESET = new Date(Date.now() - 1000).toISOString()      // já passou
const FUTURE_RESET = NEXT_MONTH.toISOString()                     // ainda não

function setupSelect(data: unknown, error: unknown = null) {
  mockSingle.mockResolvedValueOnce({ data, error })
  mockEqSelect.mockReturnValue({ single: mockSingle })
  mockSelect.mockReturnValue({ eq: mockEqSelect })
  mockEqUpdate.mockResolvedValue({ error: null })
  mockUpdate.mockReturnValue({ eq: mockEqUpdate })
  mockFrom.mockReturnValue({ select: mockSelect, update: mockUpdate })
}

// ── checkPlansLimit ───────────────────────────────────────────────────────────

describe('checkPlansLimit', () => {
  it('permite plano free com 0 planos (max=2)', async () => {
    const r = await checkPlansLimit('u1', 'free', 0)
    expect(r.allowed).toBe(true)
    expect(r.limited).toBeUndefined()
  })

  it('permite plano free com 1 plano (max=2)', async () => {
    const r = await checkPlansLimit('u1', 'free', 1)
    expect(r.allowed).toBe(true)
  })

  it('bloqueia plano free ao atingir 2 planos (max=2)', async () => {
    const r = await checkPlansLimit('u1', 'free', 2)
    expect(r.allowed).toBe(false)
    expect(r.limited).toBeDefined()
    expect(r.limited!.usage.used).toBe(2)
    expect(r.limited!.usage.max).toBe(2)
    expect(r.limited!.upgrade_url).toBe('/planos')
  })

  it('bloqueia plano basic ao atingir 10 planos (max=10)', async () => {
    const r = await checkPlansLimit('u1', 'basic', 10)
    expect(r.allowed).toBe(false)
    expect(r.limited!.usage.max).toBe(10)
  })

  it('permite plano pro com qualquer quantidade (max=null)', async () => {
    const r = await checkPlansLimit('u1', 'pro', 999)
    expect(r.allowed).toBe(true)
    expect(r.limited).toBeUndefined()
  })

  it('permite plano max com qualquer quantidade (max=null)', async () => {
    const r = await checkPlansLimit('u1', 'max', 999)
    expect(r.allowed).toBe(true)
  })

  it('permite plano beta com qualquer quantidade (max=null)', async () => {
    const r = await checkPlansLimit('u1', 'beta', 999)
    expect(r.allowed).toBe(true)
  })

  it('calcula percent corretamente (2/2 = 100%)', async () => {
    const r = await checkPlansLimit('u1', 'free', 2)
    expect(r.limited!.usage.percent).toBe(100)
  })
})

// ── checkAndIncrementApiCall ──────────────────────────────────────────────────

describe('checkAndIncrementApiCall', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockRpc.mockResolvedValue({ error: null })
  })

  it('permite plano max sem consultar DB (maxApiCallsPerMonth=null)', async () => {
    const r = await checkAndIncrementApiCall('u1', 'max')
    expect(r.allowed).toBe(true)
    expect(mockFrom).not.toHaveBeenCalled()
  })

  it('plano max dispara increment_api_calls via RPC (fire-and-forget)', async () => {
    const r = await checkAndIncrementApiCall('u1', 'max')
    expect(r.allowed).toBe(true)
    expect(mockRpc).toHaveBeenCalledWith('increment_api_calls', { user_id: 'u1' })
  })

  it('plano max não bloqueia mesmo se a RPC falhar', async () => {
    mockRpc.mockResolvedValue({ error: { message: 'boom' } })
    const r = await checkAndIncrementApiCall('u1', 'max')
    expect(r.allowed).toBe(true)
  })

  it('permite plano pro consultando DB (maxApiCallsPerMonth=100)', async () => {
    setupSelect({ api_calls_this_month: 0, api_calls_reset_at: FUTURE_RESET })
    const r = await checkAndIncrementApiCall('u1', 'pro')
    expect(r.allowed).toBe(true)
    expect(mockFrom).toHaveBeenCalled()
  })

  it('falha aberta (allowed:true) quando DB retorna erro', async () => {
    setupSelect(null, { message: 'DB error' })
    const r = await checkAndIncrementApiCall('u1', 'free')
    expect(r.allowed).toBe(true)
  })

  it('falha aberta quando DB retorna data nula', async () => {
    setupSelect(null, null)
    const r = await checkAndIncrementApiCall('u1', 'free')
    expect(r.allowed).toBe(true)
  })

  it('bloqueia quando calls atingiu limite (free: 10)', async () => {
    setupSelect({ api_calls_this_month: 10, api_calls_reset_at: FUTURE_RESET })
    const r = await checkAndIncrementApiCall('u1', 'free')
    expect(r.allowed).toBe(false)
    expect(r.limited).toBeDefined()
    expect(r.limited!.usage.used).toBe(10)
    expect(r.limited!.usage.max).toBe(10)
  })

  it('permite e retorna warning quando uso >= 80% (free: 9/10 → 90%)', async () => {
    setupSelect({ api_calls_this_month: 8, api_calls_reset_at: FUTURE_RESET })
    const r = await checkAndIncrementApiCall('u1', 'free')
    expect(r.allowed).toBe(true)
    expect(r.warning).toBeDefined()
    expect(r.warning!.usage.used).toBe(9)   // incrementado
    expect(r.warning!.usage.max).toBe(10)
    expect(r.warning!.usage.percent).toBeGreaterThanOrEqual(80)
  })

  it('permite sem warning com uso abaixo de 80% (free: 1/10)', async () => {
    setupSelect({ api_calls_this_month: 1, api_calls_reset_at: FUTURE_RESET })
    const r = await checkAndIncrementApiCall('u1', 'free')
    expect(r.allowed).toBe(true)
    expect(r.warning).toBeUndefined()
  })

  it('reseta contador quando reset_at já passou', async () => {
    setupSelect({ api_calls_this_month: 9, api_calls_reset_at: PAST_RESET })
    const r = await checkAndIncrementApiCall('u1', 'free')
    // Após reset, currentCalls = 0, então 0+1 = 1 → abaixo de 80%, sem warning
    expect(r.allowed).toBe(true)
    expect(r.warning).toBeUndefined()
    // Deve ter chamado update para resetar
    expect(mockUpdate).toHaveBeenCalled()
  })

  it('permite plano basic com 29/30 calls sem warning', async () => {
    setupSelect({ api_calls_this_month: 28, api_calls_reset_at: FUTURE_RESET })
    const r = await checkAndIncrementApiCall('u1', 'basic')
    expect(r.allowed).toBe(true)
    expect(r.warning).toBeDefined()   // 29/30 = ~97%
    expect(r.limited).toBeUndefined()
  })

  it('bloqueia plano basic com exatamente 30 calls', async () => {
    setupSelect({ api_calls_this_month: 30, api_calls_reset_at: FUTURE_RESET })
    const r = await checkAndIncrementApiCall('u1', 'basic')
    expect(r.allowed).toBe(false)
    expect(r.limited!.usage.max).toBe(30)
  })
})
