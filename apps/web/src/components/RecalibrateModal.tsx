'use client'

import { useState } from 'react'
import { X, Loader2, AlertTriangle } from 'lucide-react'
import { skillsApi } from '@/lib/api'
import { ROOT_CAUSE_LABELS } from '@/lib/constants'
import { useAsyncAction } from '@/hooks/useAsyncAction'
import { LimitReachedBlock } from '@/components/LimitReachedBlock'
import type { Plan, ScheduleWeek, RecalibrateResult } from '@/types'

interface Props {
  plan: Plan
  activeWeek: number
  onClose: () => void
}

type BlockType = 'compreensão' | 'ritmo-baixo' | 'ritmo-alto' | 'motivação'

const BLOCK_OPTIONS: { value: BlockType; label: string; description: string }[] = [
  { value: 'compreensão', label: 'Nao estou entendendo',    description: 'O conteudo esta dificil demais' },
  { value: 'ritmo-baixo', label: 'Nao estou conseguindo acompanhar', description: 'O ritmo esta rapido demais' },
  { value: 'ritmo-alto',  label: 'Esta facil demais',       description: 'Quero ir mais rapido' },
  { value: 'motivação',   label: 'Perdi a motivacao',       description: 'Nao sei por que estou estudando isso' },
]

export const RecalibrateModal = ({ plan, activeWeek, onClose }: Props) => {
  const [blockType, setBlockType]       = useState<BlockType | null>(null)
  const [blockedTopic, setBlockedTopic] = useState('')
  const { loading, error, limitError, result, execute } = useAsyncAction<RecalibrateResult>()

  const currentWeek = plan.schedule.find((w: ScheduleWeek) => w.week === activeWeek)
  const allDays     = plan.schedule.flatMap((w: ScheduleWeek) => w.days)
  const topicsDone  = allDays.filter(d => d.completed).map(d => d.topic)
  const topicsRemaining = allDays.filter(d => !d.completed).map(d => d.topic)
  const currentScaffolding = currentWeek?.scaffolding_level ?? 'medio'

  // Unique incomplete topics for the selector
  const incompleteTopics = [...new Set(topicsRemaining)]

  const handleSubmit = async () => {
    if (!blockType || !blockedTopic) return
    await execute(async () => {
      const res = await skillsApi.recalibrate({
        plan_id:             plan.id,
        blocked_topic:       blockedTopic,
        block_type:          blockType,
        weeks_current:       activeWeek,
        weeks_remaining:     plan.total_weeks - activeWeek,
        topics_remaining:    [...new Set(topicsRemaining)],
        topics_done:         [...new Set(topicsDone)],
        application_context: plan.application_context ?? '',
        current_scaffolding: currentScaffolding,
      })
      return res.recalibration
    })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-4">
      <div className="absolute inset-0 bg-gray-500/75" onClick={onClose} />

      <div className="relative flex w-full max-h-[90vh] flex-col overflow-hidden rounded-t-3xl bg-white shadow-xl sm:my-8 sm:max-w-lg sm:max-h-[80vh] sm:rounded-lg">

        {/* Header */}
        <div className="flex flex-shrink-0 items-center justify-between border-b border-gray-100 px-5 py-4">
          <div className="flex items-center gap-2">
            <AlertTriangle size={16} className="text-amber-500" />
            <h2 className="font-semibold text-gray-900">Estou travado</h2>
          </div>
          <button onClick={onClose} className="rounded-md p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600" aria-label="Fechar">
            <X size={18} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          {result ? (
            <RecalibrateResultView result={result} onClose={onClose} />
          ) : limitError ? (
            <LimitReachedBlock limitError={limitError} context="modal" />
          ) : (
            <>
              {/* Block type selection */}
              <div>
                <label className="text-sm font-semibold text-gray-700 mb-2 block">O que esta acontecendo?</label>
                <div className="space-y-2">
                  {BLOCK_OPTIONS.map(opt => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setBlockType(opt.value)}
                      className={`w-full text-left rounded-lg border px-4 py-3 transition-colors ${
                        blockType === opt.value
                          ? 'border-indigo-400 bg-indigo-50 ring-1 ring-indigo-400'
                          : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      <p className="text-sm font-medium text-gray-900">{opt.label}</p>
                      <p className="text-xs text-gray-500">{opt.description}</p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Topic selector */}
              <div>
                <label htmlFor="blocked-topic" className="text-sm font-semibold text-gray-700">
                  Em qual topico?
                </label>
                <select
                  id="blocked-topic"
                  value={blockedTopic}
                  onChange={e => setBlockedTopic(e.target.value)}
                  className="mt-1.5 w-full rounded-md border-gray-300 text-sm shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                >
                  <option value="">Selecione o topico...</option>
                  {incompleteTopics.map(t => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>

              {error && <p className="text-sm text-red-600">{error}</p>}

              <button
                onClick={handleSubmit}
                disabled={!blockType || !blockedTopic || loading}
                className="btn-primary w-full py-2.5"
              >
                {loading ? <Loader2 size={15} className="animate-spin" /> : 'Pedir ajuda da IA'}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

const RecalibrateResultView = ({ result, onClose }: { result: RecalibrateResult; onClose: () => void }) => {
  return (
    <div className="space-y-4">
      {/* Diagnosis */}
      <div>
        <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-1">Diagnostico</p>
        <p className="text-sm text-gray-700 leading-relaxed">{result.diagnosis}</p>
        {result.root_cause && (
          <span className="mt-1.5 inline-block rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-medium text-amber-700 ring-1 ring-inset ring-amber-200">
            {ROOT_CAUSE_LABELS[result.root_cause] ?? result.root_cause}
          </span>
        )}
      </div>

      {/* Actions */}
      {result.actions && result.actions.length > 0 && (
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-2">Acoes recomendadas</p>
          <ul className="space-y-2">
            {result.actions.map((a, i) => (
              <li key={i} className="rounded-md bg-gray-50 p-3 ring-1 ring-gray-200">
                <p className="text-sm font-medium text-gray-900">{a.description}</p>
                <p className="mt-0.5 text-xs text-gray-500">{a.rationale}</p>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Motivational message */}
      {result.motivational_message && (
        <div className="rounded-md bg-indigo-50 px-4 py-3 ring-1 ring-inset ring-indigo-100">
          <p className="text-sm text-indigo-700 leading-relaxed">{result.motivational_message}</p>
        </div>
      )}

      {/* Topics to skip */}
      {result.topics_to_skip && result.topics_to_skip.length > 0 && (
        <div>
          <p className="text-xs font-semibold text-gray-400 mb-1">Topicos que podem ser pulados</p>
          <div className="flex flex-wrap gap-1.5">
            {result.topics_to_skip.map((t) => (
              <span key={t} className="rounded-full bg-gray-100 px-2.5 py-0.5 text-xs text-gray-600">{t}</span>
            ))}
          </div>
        </div>
      )}

      <button onClick={onClose} className="btn-secondary w-full">Fechar</button>
    </div>
  )
}
