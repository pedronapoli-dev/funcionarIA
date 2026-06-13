'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Loader2, AlertCircle, ArrowUpCircle, MessageCircle } from 'lucide-react'
import { createClient } from '@/lib/supabase'
import { PLAN_LABELS, getProgressBarColor } from '@/lib/constants'
import { DeleteAccountModal } from '@/components/DeleteAccountModal'
import { PLAN_LIMITS } from '@/types'
import type { User, LoadingState } from '@/types'

const ContaPage = () => {
  const [user, setUser]             = useState<User | null>(null)
  const [state, setState]           = useState<LoadingState>('loading')
  const [showDeleteModal, setShowDeleteModal] = useState(false)

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) { setState('error'); return }
      supabase.from('users').select('*').eq('id', data.user.id).single().then(({ data: row, error }) => {
        if (error || !row) { setState('error'); return }
        setUser(row as User)
        setState('success')
      })
    })
  }, [])

  if (state === 'loading') {
    return (
      <main className="mx-auto max-w-3xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="flex items-center justify-center py-16 text-gray-400">
          <Loader2 size={20} className="animate-spin" />
        </div>
      </main>
    )
  }

  if (state === 'error' || !user) {
    return (
      <main className="mx-auto max-w-3xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="flex items-start gap-2.5 rounded-md bg-red-50 p-3.5 ring-1 ring-inset ring-red-200">
          <AlertCircle className="mt-px flex-shrink-0 text-red-500" size={15} />
          <p className="text-sm text-red-700">Não foi possível carregar os dados da sua conta.</p>
        </div>
      </main>
    )
  }

  const limits  = PLAN_LIMITS[user.plan]
  const usedPct = limits.maxApiCallsPerMonth
    ? Math.min(100, Math.round((user.api_calls_this_month / limits.maxApiCallsPerMonth) * 100))
    : 0

  return (
    <main className="mx-auto max-w-3xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="page-header">
        <div>
          <h1 className="text-2xl font-bold leading-7 text-gray-900">Minha Conta</h1>
          <p className="mt-1 text-sm text-gray-500">Seu perfil, plano e dados</p>
        </div>
      </div>

      <div className="space-y-6">

        {/* Perfil */}
        <section className="card px-4 py-5 sm:p-6">
          <h2 className="text-sm font-semibold text-gray-900">Perfil</h2>
          <dl className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <dt className="text-xs font-medium text-gray-500">Email</dt>
              <dd className="mt-1 text-sm text-gray-900">{user.email}</dd>
            </div>
            {user.full_name && (
              <div>
                <dt className="text-xs font-medium text-gray-500">Nome</dt>
                <dd className="mt-1 text-sm text-gray-900">{user.full_name}</dd>
              </div>
            )}
            {user.university && (
              <div>
                <dt className="text-xs font-medium text-gray-500">Universidade</dt>
                <dd className="mt-1 text-sm text-gray-900">{user.university}</dd>
              </div>
            )}
            {user.course && (
              <div>
                <dt className="text-xs font-medium text-gray-500">Curso</dt>
                <dd className="mt-1 text-sm text-gray-900">{user.course}</dd>
              </div>
            )}
            {user.semester != null && (
              <div>
                <dt className="text-xs font-medium text-gray-500">Semestre</dt>
                <dd className="mt-1 text-sm text-gray-900">{user.semester}</dd>
              </div>
            )}
          </dl>
        </section>

        {/* Plano e uso */}
        <section className="card px-4 py-5 sm:p-6">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-gray-900">Plano</h2>
            <span className="badge-indigo">{PLAN_LABELS[user.plan]}</span>
          </div>

          <dl className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <dt className="text-xs font-medium text-gray-500">Planos de estudo</dt>
              <dd className="mt-1 text-sm text-gray-900">
                {limits.maxPlans === null ? 'Ilimitado' : `Até ${limits.maxPlans}`}
              </dd>
            </div>
            <div>
              <dt className="text-xs font-medium text-gray-500">Gerações de IA por mês</dt>
              <dd className="mt-1 text-sm text-gray-900">
                {limits.maxApiCallsPerMonth === null ? 'Ilimitado' : `${limits.maxApiCallsPerMonth} por mês`}
              </dd>
            </div>
          </dl>

          {limits.maxApiCallsPerMonth !== null && (
            <div className="mt-4">
              <div className="flex items-center justify-between text-xs text-gray-500">
                <span>Uso este mês</span>
                <span>{user.api_calls_this_month} / {limits.maxApiCallsPerMonth}</span>
              </div>
              <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-gray-100">
                <div className={`h-full ${getProgressBarColor(100 - usedPct)}`} style={{ width: `${usedPct}%` }} />
              </div>
            </div>
          )}

          <div className="mt-5">
            <Link href="/planos" className="btn-secondary">
              <ArrowUpCircle size={14} /> Gerenciar assinatura
            </Link>
          </div>
        </section>

        {/* Comunidade */}
        {process.env.NEXT_PUBLIC_DISCORD_INVITE_URL && (
          <section className="card px-4 py-5 sm:p-6">
            <h2 className="text-sm font-semibold text-gray-900">Comunidade</h2>
            <p className="mt-1 text-sm text-gray-500">
              Entre no nosso Discord para trocar ideias com outros estudantes, dar sugestões e
              acompanhar novidades de primeira mão.
            </p>
            <div className="mt-4">
              <a href={process.env.NEXT_PUBLIC_DISCORD_INVITE_URL} target="_blank" rel="noopener noreferrer" className="btn-secondary">
                <MessageCircle size={14} /> Entrar no Discord
              </a>
            </div>
          </section>
        )}

        {/* Zona de risco */}
        <section className="card px-4 py-5 sm:p-6 ring-red-100">
          <h2 className="text-sm font-semibold text-gray-900">Zona de risco</h2>
          <p className="mt-1 text-sm text-gray-500">
            Excluir sua conta remove permanentemente seus planos, disciplinas, exercícios e dados de
            progresso, e cancela qualquer assinatura ativa.
          </p>
          <div className="mt-4">
            <button onClick={() => setShowDeleteModal(true)} className="btn bg-red-50 text-red-700 ring-1 ring-inset ring-red-200 hover:bg-red-100">
              Excluir conta
            </button>
          </div>
        </section>

      </div>

      {showDeleteModal && <DeleteAccountModal onClose={() => setShowDeleteModal(false)} />}
    </main>
  )
}

export default ContaPage
