import { useState, useCallback } from 'react'

export const useAsyncAction = <T>() => {
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState<string | null>(null)
  const [result, setResult]   = useState<T | null>(null)

  const execute = useCallback(async (fn: () => Promise<T>) => {
    setLoading(true); setError(null)
    try {
      const data = await fn()
      setResult(data)
      return data
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erro inesperado.'
      setError(msg)
      return null
    } finally { setLoading(false) }
  }, [])

  const reset = useCallback(() => { setResult(null); setError(null) }, [])

  return { loading, error, result, execute, reset } as const
}
