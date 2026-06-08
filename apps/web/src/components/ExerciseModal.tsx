'use client'

import { useEffect, useState } from 'react'
import { X, Loader2, CheckCircle2, XCircle } from 'lucide-react'
import { exercisesApi } from '@/lib/api'
import { EXERCISE_TYPE_LABELS } from '@/lib/constants'
import { BloomBadge } from '@/components/BloomBadge'
import type { Exercise, ScheduleDay } from '@/types'

interface Props {
  planId: string
  subjectName: string
  day: ScheduleDay | null
  progress?: number  // Plan progress 0-100, used to infer planPhase
  onClose: () => void
}

const inferPlanPhase = (progress: number): 'inicial' | 'intermediaria' | 'final' => {
  if (progress >= 70) return 'final'
  if (progress >= 30) return 'intermediaria'
  return 'inicial'
}

export const ExerciseModal = ({ planId, subjectName, day, progress = 0, onClose }: Props) => {
  const [exercises, setExercises] = useState<Exercise[]>([])
  const [loading, setLoading]     = useState(false)

  useEffect(() => {
    if (!day) { setExercises([]); return }
    setLoading(true)
    setExercises([])
    const run = async () => {
      const existing = await exercisesApi.listByPlan(planId)
      const forTopic = existing.exercises.filter(e => e.topic === day.topic)
      if (forTopic.length > 0) {
        setExercises(forTopic)
      } else {
        const res = await exercisesApi.generate({
          plan_id: planId,
          topic: day.topic,
          subject_name: subjectName,
          bloom_level: day.bloom_level,
          plan_phase: inferPlanPhase(progress),
        })
        setExercises(res.exercises)
      }
    }
    run().finally(() => setLoading(false))
  }, [day?.topic, planId])

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onClose])

  if (!day) return null

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-4">

      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-gray-500/75 transition-opacity"
        onClick={onClose}
      />

      {/* Panel */}
      <div className="relative flex w-full max-h-[90vh] flex-col overflow-hidden rounded-t-3xl bg-white shadow-xl sm:my-8 sm:max-w-2xl sm:max-h-[80vh] sm:rounded-lg">

        {/* Drag handle (mobile only) */}
        <div className="flex justify-center pb-1 pt-3 sm:hidden">
          <div className="h-1 w-10 rounded-full bg-gray-200" />
        </div>

        {/* Header */}
        <div className="flex flex-shrink-0 items-start justify-between border-b border-gray-100 px-5 py-4">
          <div className="min-w-0 flex-1 pr-4">
            <div className="mb-0.5 flex items-center gap-2">
              <p className="text-xs font-semibold uppercase tracking-widest text-indigo-600">Exercícios</p>
              {day.bloom_level && <BloomBadge level={day.bloom_level} />}
            </div>
            <h2 className="font-semibold leading-snug text-gray-900">{day.topic}</h2>
          </div>
          <button
            onClick={onClose}
            className="flex-shrink-0 rounded-md p-1.5 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
            aria-label="Fechar"
          >
            <X size={18} />
          </button>
        </div>

        {/* Mastery criteria banner */}
        {day.mastery_criteria && (
          <div className="flex-shrink-0 border-b border-amber-100 bg-amber-50 px-5 py-3">
            <p className="text-xs font-semibold text-amber-700">Critério de maestria</p>
            <p className="mt-0.5 text-xs leading-relaxed text-amber-600">{day.mastery_criteria}</p>
          </div>
        )}

        {/* Body */}
        <div className="flex-1 space-y-4 overflow-y-auto p-5">
          {loading ? (
            <div className="flex flex-col items-center justify-center gap-3 py-16">
              <Loader2 className="animate-spin text-indigo-600" size={32} />
              <p className="text-sm text-gray-400">Gerando exercícios com IA...</p>
            </div>
          ) : (
            exercises.map((ex, i) => <ExerciseCard key={ex.id} exercise={ex} index={i} />)
          )}
        </div>
      </div>
    </div>
  )
}

const ExerciseCard = ({ exercise, index }: { exercise: Exercise; index: number }) => {
  const [selected, setSelected] = useState<string | null>(exercise.user_answer ?? null)

  const revealed = selected !== null

  const handleAnswer = async (key: string) => {
    if (revealed) return
    setSelected(key)
    try { await exercisesApi.answer(exercise.id, key) } catch (err) { console.error('[exercise:answer]', err) }
  }

  const [hintOpen, setHintOpen] = useState(false)

  return (
    <div className="rounded-lg bg-gray-50 p-5 ring-1 ring-gray-200">

      <div className="mb-3 flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-wide text-gray-400">
          Questão {index + 1}
        </span>
        <span className="badge-indigo">{EXERCISE_TYPE_LABELS[exercise.type] ?? exercise.type}</span>
      </div>

      <p className="mb-4 font-medium leading-relaxed text-gray-800">{exercise.question}</p>

      {/* Scaffolded hint — shown before answering */}
      {!revealed && exercise.scaffolded_hint && (
        <div className="mb-3">
          <button
            onClick={() => setHintOpen(!hintOpen)}
            className="text-xs font-medium text-indigo-500 transition-colors hover:text-indigo-700"
          >
            {hintOpen ? 'Esconder dica' : 'Precisa de uma dica?'}
          </button>
          {hintOpen && (
            <p className="mt-1.5 rounded-md border border-indigo-100 bg-indigo-50/50 px-3 py-2 text-sm text-indigo-700">
              {exercise.scaffolded_hint}
            </p>
          )}
        </div>
      )}

      {exercise.options && exercise.options.length > 0 ? (
        <div className="space-y-2">
          {exercise.options.map(opt => {
            const isCorrect  = revealed && opt.key === exercise.answer
            const isWrong    = revealed && opt.key === selected && opt.key !== exercise.answer
            const isSelected = !revealed && opt.key === selected

            let cls = 'border-gray-200 bg-white text-gray-700 hover:border-indigo-300 hover:bg-indigo-50/40 cursor-pointer'
            if (isCorrect)  cls = 'border-green-400 bg-green-50 text-green-800 cursor-default'
            if (isWrong)    cls = 'border-red-300 bg-red-50 text-red-700 cursor-default'
            if (isSelected) cls = 'border-indigo-400 bg-indigo-50 text-indigo-700 cursor-pointer'
            if (revealed && !isCorrect && !isWrong) cls = 'border-gray-100 bg-white text-gray-400 cursor-default'

            return (
              <button
                key={opt.key}
                onClick={() => handleAnswer(opt.key)}
                disabled={revealed}
                className={`flex w-full items-center gap-3 rounded-md border px-4 py-3 text-left text-sm transition-all ${cls}`}
              >
                <span className="w-5 flex-shrink-0 text-xs font-bold">{opt.key.toUpperCase()}</span>
                <span className="flex-1 leading-snug">{opt.text}</span>
                {isCorrect && <CheckCircle2 size={16} className="flex-shrink-0 text-green-500" />}
                {isWrong   && <XCircle     size={16} className="flex-shrink-0 text-red-400"   />}
              </button>
            )
          })}
        </div>
      ) : (
        <p className="text-sm italic text-gray-500">
          Questão aberta para reflexão — não há alternativas.
        </p>
      )}

      {revealed && exercise.explanation && (
        <div className="mt-4 rounded-md border border-gray-100 bg-white p-4 text-sm leading-relaxed text-gray-600">
          <span className="font-semibold text-gray-700">Explicação: </span>
          {exercise.explanation}
        </div>
      )}
    </div>
  )
}

