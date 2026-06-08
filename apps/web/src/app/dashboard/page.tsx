'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { Plus, Clock, CalendarDays, ChevronRight, Loader2 } from 'lucide-react'
import { plansApi } from '@/lib/api'
import { PLAN_STATUS_CONFIG, getProgressBarColor, formatDateBR } from '@/lib/constants'
import type { Plan, LoadingState } from '@/types'

const DashboardPage = () => {
  const [plans, setPlans] = useState<Plan[]>([])
  const [state, setState] = useState<LoadingState>('loading')

  useEffect(() => {
    plansApi.list()
      .then(res => { setPlans(res.plans); setState('success') })
      .catch(() => setState('error'))
  }, [])

  const { active, avgProgress, nextExam } = useMemo(() => {
    const active = plans.filter(p => p.status === 'active')
    const avgProgress = active.length
      ? Math.round(active.reduce((s, p) => s + p.progress, 0) / active.length)
      : 0
    const nextExam = plans
      .filter(p => p.exam_date && new Date(p.exam_date) >= new Date())
      .sort((a, b) => new Date(a.exam_date!).getTime() - new Date(b.exam_date!).getTime())[0]
    return { active, avgProgress, nextExam }
  }, [plans])

  if (state === 'loading') return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <Loader2 className="animate-spin text-indigo-600" size={24} />
    </div>
  )

  return (
    <main className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">

      {/* Page header */}
      <div className="page-header">
        <div>
          <h1 className="text-2xl font-bold leading-7 text-gray-900">Meus Planos</h1>
          <p className="mt-1 text-sm text-gray-500">Acompanhe o progresso de cada disciplina</p>
        </div>
        <Link href="/plan/new" className="btn-primary">
          <Plus size={14} /> Novo plano
        </Link>
      </div>

      {plans.length === 0 ? (
        /* Empty state */
        <div className="text-center py-16">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-indigo-50">
            <Plus className="text-indigo-600" size={22} />
          </div>
          <h3 className="text-sm font-semibold text-gray-900">Nenhum plano criado</h3>
          <p className="mt-1 text-sm text-gray-500">
            Faça upload da ementa para começar.
          </p>
          <div className="mt-6">
            <Link href="/plan/new" className="btn-primary">
              <Plus size={14} /> Criar primeiro plano
            </Link>
          </div>
        </div>
      ) : (
        <>
          {/* Stats */}
          <dl className="grid grid-cols-1 gap-5 sm:grid-cols-3 mb-8">
            {[
              { label: 'Planos ativos',    value: active.length,       suffix: ''  },
              { label: 'Progresso médio',  value: `${avgProgress}%`,   suffix: ''  },
              {
                label: 'Próxima prova',
                value: nextExam
                  ? formatDateBR(nextExam.exam_date!)
                  : '—',
                suffix: '',
              },
            ].map(stat => (
              <div key={stat.label} className="card px-4 py-5 sm:p-6">
                <dt className="truncate text-sm font-medium text-gray-500">{stat.label}</dt>
                <dd className="mt-1 text-3xl font-semibold tracking-tight text-gray-900">{stat.value}</dd>
              </div>
            ))}
          </dl>

          {/* Plans list */}
          <div className="card">
            <ul role="list" className="divide-y divide-gray-100">
              {plans.map(plan => <PlanRow key={plan.id} plan={plan} />)}
            </ul>

            <div className="border-t border-gray-100 px-5 py-3">
              <Link
                href="/plan/new"
                className="flex items-center gap-2 text-sm font-medium text-indigo-600 hover:text-indigo-500"
              >
                <Plus size={14} /> Adicionar disciplina
              </Link>
            </div>
          </div>
        </>
      )}

    </main>
  )
}

export default DashboardPage

const PlanRow = ({ plan }: { plan: Plan }) => {
  const status = PLAN_STATUS_CONFIG[plan.status]
  const barColor = getProgressBarColor(plan.progress)

  return (
    <li>
      <Link
        href={`/plan/${plan.id}`}
        className="flex items-center justify-between gap-x-6 px-5 py-4 hover:bg-gray-50 transition-colors"
      >
        {/* Left */}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 mb-0.5">
            <span className={status.cls}>{status.label}</span>
          </div>
          <p className="truncate text-sm font-semibold text-gray-900">{plan.title}</p>
          {plan.subjects && (
            <p className="truncate text-xs text-gray-400 mt-0.5">{plan.subjects.name}</p>
          )}
          {/* Progress bar */}
          <div className="mt-2 flex items-center gap-2">
            <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-gray-100">
              <div className={`h-1.5 rounded-full ${barColor}`} style={{ width: `${plan.progress}%` }} />
            </div>
            <span className="text-xs tabular-nums text-gray-500">{plan.progress}%</span>
          </div>
        </div>

        {/* Right meta */}
        <div className="hidden sm:flex flex-shrink-0 items-center gap-4 text-xs text-gray-400">
          <span className="flex items-center gap-1">
            <Clock size={11} /> {plan.total_weeks}sem
          </span>
          {plan.exam_date && (
            <span className="flex items-center gap-1">
              <CalendarDays size={11} />
              {formatDateBR(plan.exam_date)}
            </span>
          )}
          <ChevronRight size={14} className="text-gray-300" />
        </div>
      </Link>
    </li>
  )
}
