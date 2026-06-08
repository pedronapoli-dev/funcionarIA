/**
 * Re-exporta @funcionaria/types.
 * No frontend, importe SEMPRE de '@/types', nunca direto de '@funcionaria/types'.
 *
 * Tipos exclusivos de UI (sem equivalente no backend) ficam abaixo.
 */
export * from '@funcionaria/types'

export type LoadingState  = 'idle' | 'loading' | 'success' | 'error'
export type NewPlanStep   = 'upload' | 'confirm' | 'profile' | 'configure' | 'generating'
