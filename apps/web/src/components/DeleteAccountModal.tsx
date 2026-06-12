'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { X, Loader2, AlertTriangle, AlertCircle } from 'lucide-react'
import { accountApi } from '@/lib/api'
import { createClient } from '@/lib/supabase'

interface Props {
  onClose: () => void
}

const CONFIRM_WORD = 'EXCLUIR'

export const DeleteAccountModal = ({ onClose }: Props) => {
  const router = useRouter()
  const [confirmText, setConfirmText] = useState('')
  const [loading, setLoading]         = useState(false)
  const [error, setError]             = useState<string | null>(null)

  const handleDelete = async () => {
    setLoading(true)
    setError(null)
    try {
      await accountApi.delete()
      const supabase = createClient()
      await supabase.auth.signOut()
      toast.success('Conta excluída com sucesso.')
      router.push('/')
      router.refresh()
    } catch {
      setError('Não foi possível excluir sua conta. Tente novamente ou contate o suporte.')
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-4">
      <div className="absolute inset-0 bg-gray-500/75" onClick={onClose} />

      <div className="relative flex w-full max-h-[90vh] flex-col overflow-hidden rounded-t-3xl bg-white shadow-xl sm:my-8 sm:max-w-md sm:max-h-[80vh] sm:rounded-lg">

        {/* Header */}
        <div className="flex flex-shrink-0 items-center justify-between border-b border-gray-100 px-5 py-4">
          <div className="flex items-center gap-2">
            <AlertTriangle size={16} className="text-red-500" />
            <h2 className="font-semibold text-gray-900">Excluir conta</h2>
          </div>
          <button onClick={onClose} className="rounded-md p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600" aria-label="Fechar">
            <X size={18} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          <p className="text-sm text-gray-600 leading-relaxed">
            Esta ação é <span className="font-semibold text-gray-900">permanente</span>. Todos os seus
            planos, disciplinas, exercícios e sessões de estudo serão excluídos. Se você tiver uma
            assinatura ativa, ela será cancelada.
          </p>

          {error && (
            <div className="flex items-start gap-2.5 rounded-md bg-red-50 p-3.5 ring-1 ring-inset ring-red-200">
              <AlertCircle className="mt-px flex-shrink-0 text-red-500" size={15} />
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          <div>
            <label htmlFor="confirm-delete">
              Digite <span className="font-semibold text-gray-900">{CONFIRM_WORD}</span> para confirmar
            </label>
            <div className="mt-1.5">
              <input
                id="confirm-delete"
                type="text"
                value={confirmText}
                onChange={e => setConfirmText(e.target.value)}
                placeholder={CONFIRM_WORD}
                autoComplete="off"
              />
            </div>
          </div>

          <button
            onClick={handleDelete}
            disabled={confirmText !== CONFIRM_WORD || loading}
            className="btn w-full bg-red-600 text-white hover:bg-red-500"
          >
            {loading && <Loader2 size={15} className="animate-spin" />}
            Excluir minha conta permanentemente
          </button>
        </div>
      </div>
    </div>
  )
}
