'use client'

import Link from 'next/link'
import { Lock } from 'lucide-react'
import type { LimitedResponse } from '@/types'

interface Props {
  limitError: LimitedResponse
  context?: 'modal' | 'inline'
}

export const LimitReachedBlock = ({ limitError, context = 'modal' }: Props) => {
  const { usage } = limitError
  const percent   = usage.max ? Math.min(100, Math.round((usage.used / usage.max) * 100)) : 100

  return (
    <div className={`flex flex-col items-center text-center ${context === 'modal' ? 'py-10 px-6' : 'py-6 px-4'}`}>
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-amber-50 mb-4">
        <Lock className="text-amber-500" size={20} />
      </div>

      <h3 className="text-sm font-semibold text-gray-900 mb-1">Limite do plano atingido</h3>
      <p className="text-sm text-gray-500 mb-5 max-w-xs">
        Você usou {usage.used} de {usage.max ?? '∞'} gerações este mês.
        Faça upgrade para continuar.
      </p>

      {/* Usage bar */}
      {usage.max !== null && (
        <div className="w-full max-w-xs mb-5">
          <div className="flex justify-between text-xs text-gray-400 mb-1">
            <span>{usage.used} usadas</span>
            <span>{usage.max} total</span>
          </div>
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-gray-100">
            <div
              className="h-1.5 rounded-full bg-amber-400 transition-all"
              style={{ width: `${percent}%` }}
            />
          </div>
        </div>
      )}

      <Link
        href={limitError.upgrade_url}
        className="inline-flex items-center gap-2 rounded-md bg-indigo-600 px-5 py-2 text-sm font-semibold text-white hover:bg-indigo-500 transition-colors"
      >
        Ver planos
      </Link>
    </div>
  )
}
