import { useState, useCallback } from 'react'
import { ApiLimitError, ApiCooldownError } from '@/lib/api'
import type { LimitedResponse, CooldownResponse } from '@/types'

export const useAsyncAction = <T>() => {
  const [loading, setLoading]         = useState(false)
  const [error, setError]             = useState<string | null>(null)
  const [limitError, setLimitError]   = useState<LimitedResponse | null>(null)
  const [cooldownError, setCooldownError] = useState<CooldownResponse | null>(null)
  const [result, setResult]           = useState<T | null>(null)

  const execute = useCallback(async (fn: () => Promise<T>) => {
    setLoading(true); setError(null); setLimitError(null); setCooldownError(null)
    try {
      const data = await fn()
      setResult(data)
      return data
    } catch (err: unknown) {
      if (err instanceof ApiLimitError) {
        setLimitError({ limited: true, upgrade_url: err.upgrade_url, usage: err.usage })
      } else if (err instanceof ApiCooldownError) {
        setCooldownError({ cooldown: true, retry_at: err.retry_at, message: err.message })
      } else {
        const msg = err instanceof Error ? err.message : 'Erro inesperado.'
        setError(msg)
      }
      return null
    } finally { setLoading(false) }
  }, [])

  const reset = useCallback(() => { setResult(null); setError(null); setLimitError(null); setCooldownError(null) }, [])

  return { loading, error, limitError, cooldownError, result, execute, reset } as const
}
