import type { BloomLevel } from '@/types'

const BLOOM_CONFIG: Record<BloomLevel, { label: string; className: string }> = {
  lembrar:  { label: 'Recordar',     className: 'bg-gray-100   text-gray-600'   },
  entender: { label: 'Compreender',  className: 'bg-blue-100   text-blue-700'   },
  aplicar:  { label: 'Aplicar',      className: 'bg-indigo-100 text-indigo-700' },
  analisar: { label: 'Analisar',     className: 'bg-violet-100 text-violet-700' },
  avaliar:  { label: 'Avaliar',      className: 'bg-amber-100  text-amber-700'  },
  criar:    { label: 'Criar',        className: 'bg-emerald-100 text-emerald-700'},
}

interface BloomBadgeProps {
  level: BloomLevel | undefined
  className?: string
}

export const BloomBadge = ({ level, className = '' }: BloomBadgeProps) => {
  if (!level) return null
  const { label, className: colorClass } = BLOOM_CONFIG[level]
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${colorClass} ${className}`}>
      {label}
    </span>
  )
}

// Horizontal strip showing Bloom level distribution across all days
interface BloomDistributionProps {
  days: Array<{ bloom_level?: BloomLevel; completed?: boolean }>
}

export const BloomDistribution = ({ days }: BloomDistributionProps) => {
  const levels: BloomLevel[] = ['lembrar', 'entender', 'aplicar', 'analisar', 'avaliar', 'criar']

  const counts = days.reduce<Partial<Record<BloomLevel, number>>>((acc, d) => {
    if (d.bloom_level) acc[d.bloom_level] = (acc[d.bloom_level] ?? 0) + 1
    return acc
  }, {})

  const total = Object.values(counts).reduce((a, b) => a + b, 0)
  if (total === 0) return null

  return (
    <div className="space-y-2">
      <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Distribuição cognitiva</p>
      {/* Segmented bar */}
      <div className="flex h-2 rounded-full overflow-hidden gap-0.5">
        {levels.map(level => {
          const count = counts[level] ?? 0
          if (count === 0) return null
          const pct = (count / total) * 100
          const { className: colorClass } = BLOOM_CONFIG[level]
          // Extract bg color from className (first token)
          const bg = colorClass.split(' ')[0]
          return <div key={level} style={{ width: `${pct}%` }} className={`${bg} rounded-full`} />
        })}
      </div>
      {/* Legend chips */}
      <div className="flex flex-wrap gap-1.5">
        {levels.map(level => {
          const count = counts[level] ?? 0
          if (count === 0) return null
          return (
            <span key={level} className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${BLOOM_CONFIG[level].className}`}>
              {BLOOM_CONFIG[level].label}
              <span className="opacity-70">{count}</span>
            </span>
          )
        })}
      </div>
    </div>
  )
}
