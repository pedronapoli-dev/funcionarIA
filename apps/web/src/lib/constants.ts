export const getProgressBarColor = (progress: number): string =>
  progress >= 75 ? 'bg-green-500' : progress >= 40 ? 'bg-indigo-600' : 'bg-amber-400'

export const PLAN_STATUS_CONFIG = {
  active:    { label: 'Ativo',     cls: 'badge-indigo' },
  completed: { label: 'Concluído', cls: 'badge-green'  },
  archived:  { label: 'Arquivado', cls: 'badge-gray'   },
} as const

export const EXERCISE_TYPE_LABELS: Record<string, string> = {
  conceitual: 'Conceitual', aplicacao: 'Aplicação', analise: 'Análise', metacognitiva: 'Metacognitiva',
}

export const CHECKIN_ACTION_LABELS: Record<string, string> = {
  manter: 'Manter o ritmo', desacelerar: 'Desacelerar', acelerar: 'Acelerar', recalibrar: 'Recalibrar plano',
}

export const ROOT_CAUSE_LABELS: Record<string, string> = {
  'ZDP violado': 'Conteúdo fora da sua zona de desenvolvimento',
  'carga cognitiva excessiva': 'Carga cognitiva excessiva',
  'motivação': 'Problema de motivação',
  'ritmo': 'Problema de ritmo',
}

export const formatDateBR = (date: string | Date): string =>
  new Date(date).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })
