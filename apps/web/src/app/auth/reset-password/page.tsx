'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase'
import { AlertCircle, Loader2, GraduationCap, KeyRound } from 'lucide-react'

type Status = 'checking' | 'ready' | 'invalid'

const ResetPasswordPage = () => {
  const router = useRouter()
  const [status, setStatus]       = useState<Status>('checking')
  const [password, setPassword]   = useState('')
  const [confirm, setConfirm]     = useState('')
  const [error, setError]         = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getSession().then(({ data }) => {
      setStatus(data.session ? 'ready' : 'invalid')
    })
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (password.length < 6) {
      setError('A senha precisa ter pelo menos 6 caracteres.')
      return
    }
    if (password !== confirm) {
      setError('As senhas não coincidem.')
      return
    }

    setIsLoading(true)
    const supabase = createClient()
    const { error } = await supabase.auth.updateUser({ password })
    if (error) { setError(error.message); setIsLoading(false); return }

    toast.success('Senha atualizada com sucesso!')
    router.push('/dashboard')
    router.refresh()
  }

  return (
    <div className="flex min-h-screen flex-col justify-center bg-gray-50 py-12 sm:px-6 lg:px-8">

      {/* Logo */}
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-600">
            <GraduationCap className="text-white" size={20} />
          </div>
        </div>
      </div>

      {status === 'invalid' ? (
        <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
          <div className="bg-white px-6 py-8 shadow-sm ring-1 ring-gray-900/5 sm:rounded-lg sm:px-10 text-center">
            <h2 className="text-lg font-bold text-gray-900 mb-2">Link inválido ou expirado</h2>
            <p className="text-sm text-gray-500 leading-relaxed">
              Solicite um novo link de redefinição de senha na tela de login.
            </p>
            <Link href="/login" className="mt-6 inline-flex btn-primary w-full py-2 justify-center">
              Voltar para o login
            </Link>
          </div>
        </div>
      ) : (
        <>
          <h2 className="mt-4 text-center text-2xl font-bold leading-9 tracking-tight text-gray-900">
            Criar nova senha
          </h2>
          <p className="mt-2 text-center text-sm text-gray-500">
            Escolha uma nova senha para sua conta
          </p>

          <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
            <div className="bg-white px-6 py-8 shadow-sm ring-1 ring-gray-900/5 sm:rounded-lg sm:px-10">
              <form onSubmit={handleSubmit} className="space-y-5">

                {error && (
                  <div className="flex items-start gap-2.5 rounded-md bg-red-50 p-3.5 ring-1 ring-inset ring-red-200">
                    <AlertCircle className="mt-px flex-shrink-0 text-red-500" size={15} />
                    <p className="text-sm text-red-700">{error}</p>
                  </div>
                )}

                <div>
                  <label htmlFor="password">Nova senha</label>
                  <div className="mt-1.5">
                    <input
                      id="password"
                      type="password"
                      required
                      autoComplete="new-password"
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      placeholder="••••••••"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="confirm">Confirmar nova senha</label>
                  <div className="mt-1.5">
                    <input
                      id="confirm"
                      type="password"
                      required
                      autoComplete="new-password"
                      value={confirm}
                      onChange={e => setConfirm(e.target.value)}
                      placeholder="••••••••"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isLoading || status === 'checking'}
                  className="btn-primary w-full py-2 mt-2"
                >
                  {isLoading
                    ? <Loader2 size={15} className="animate-spin" />
                    : <KeyRound size={15} />}
                  Salvar nova senha
                </button>
              </form>
            </div>
          </div>
        </>
      )}
    </div>
  )
}

export default ResetPasswordPage
