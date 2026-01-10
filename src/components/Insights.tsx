import { useMemo } from 'react'
import { groupByMonth } from '../api/itbi'
import { subMonths, format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

type Theme = {
  bgGradient: string
  titleGradient: string
  primary: string
  secondary: string
}

export default function Insights({ records, street, theme }: { records: any[]; street: string; theme: Theme }) {
  const filtered = records.filter((r) => r.address && r.address.toLowerCase().includes(street.toLowerCase()))
  const byMonth = groupByMonth(filtered)

  const last24 = useMemo(() => {
    const end = new Date()
    const months: string[] = []
    for (let i = 23; i >= 0; i--) months.push(format(subMonths(end, i), 'yyyy-MM'))

    const prices = months.map((m) => {
      const items = byMonth[m] || []
      const p = items.map((it: any) => it.m2Price).filter((v: any) => typeof v === 'number' && isFinite(v))
      if (!p.length) return null
      // Since data is already aggregated, we can just take the average
      const avg = p.reduce((sum: number, val: number) => sum + val, 0) / p.length
      return avg
    })

    // For transaction counts, sum up the transactionCount field
    const counts = months.map((m) => {
      const items = byMonth[m] || []
      return items.reduce((sum: number, item: any) => sum + (item.transactionCount || 0), 0)
    })

    return { months, prices, counts }
  }, [byMonth])

  // Trend calculation
  const validPrices = last24.prices.map((v) => (v === null ? NaN : v)).filter((v) => !isNaN(v))
  let trend: 'up' | 'down' | 'flat' = 'flat'
  let percent = 0
  if (validPrices.length >= 2) {
    const first = validPrices[0]
    const last = validPrices[validPrices.length - 1]
    percent = first > 0 ? ((last - first) / first) * 100 : 0
    trend = percent > 3 ? 'up' : percent < -3 ? 'down' : 'flat'
  }

  // Peak detection: count z-score > 2
  const counts = last24.counts
  const mean = counts.reduce((a, b) => a + b, 0) / counts.length
  const std = Math.sqrt(counts.reduce((a, b) => a + (b - mean) ** 2, 0) / counts.length)
  const peaks = last24.months.filter((m, i) => counts[i] > mean + 2 * std && counts[i] > 5)

  // Get latest (most recent) price instead of median
  const latestPrice = validPrices.length > 0 ? validPrices[validPrices.length - 1] : 0

  // Total transactions across all months
  const totalTransactions = filtered.reduce((sum, r) => sum + (r.transactionCount || 0), 0)

  const getCardClasses = () => {
    if (theme.primary === 'blue') {
      return {
        trend: {
          bg: 'from-blue-50 to-blue-100',
          border: 'border-blue-200',
          icon: 'bg-blue-600'
        },
        launches: {
          bg: 'from-purple-50 to-purple-100',
          border: 'border-purple-200',
          icon: 'bg-purple-600',
          text: 'text-purple-600',
          badge: 'text-purple-700'
        },
        price: {
          bg: 'from-green-50 to-green-100',
          border: 'border-green-200',
          icon: 'bg-green-600',
          text: 'text-green-600'
        },
        transactions: {
          bg: 'from-orange-50 to-orange-100',
          border: 'border-orange-200',
          icon: 'bg-orange-600',
          text: 'text-orange-600'
        }
      }
    } else {
      return {
        trend: {
          bg: 'from-red-50 to-red-100',
          border: 'border-red-200',
          icon: 'bg-red-600'
        },
        launches: {
          bg: 'from-orange-50 to-orange-100',
          border: 'border-orange-200',
          icon: 'bg-orange-600',
          text: 'text-orange-600',
          badge: 'text-orange-700'
        },
        price: {
          bg: 'from-emerald-50 to-emerald-100',
          border: 'border-emerald-200',
          icon: 'bg-emerald-600',
          text: 'text-emerald-600'
        },
        transactions: {
          bg: 'from-amber-50 to-amber-100',
          border: 'border-amber-200',
          icon: 'bg-amber-600',
          text: 'text-amber-600'
        }
      }
    }
  }

  const cards = getCardClasses()

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-6">
      <div className={`bg-gradient-to-br ${cards.trend.bg} rounded-xl sm:rounded-2xl p-4 sm:p-6 shadow-md border ${cards.trend.border}`}>
        <div className="flex items-center gap-2 sm:gap-3 mb-2 sm:mb-3">
          <div className={`p-1.5 sm:p-2 ${cards.trend.icon} rounded-lg`}>
            <svg className="h-4 w-4 sm:h-6 sm:w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
            </svg>
          </div>
          <h4 className="text-sm sm:text-base font-semibold text-slate-800">Valorização</h4>
        </div>
        <p className="text-2xl sm:text-3xl font-bold mb-1 sm:mb-2">
          {trend === 'up' && <span className="text-green-600">↗ Alta</span>}
          {trend === 'down' && <span className="text-red-600">↘ Baixa</span>}
          {trend === 'flat' && <span className="text-slate-600">→ Estável</span>}
        </p>
        <p className="text-xs sm:text-sm text-slate-600">
          <span className={`font-semibold ${percent > 0 ? 'text-green-600' : percent < 0 ? 'text-red-600' : 'text-slate-600'}`}>
            {percent > 0 ? '+' : ''}{percent.toFixed(1)}%
          </span> em 24 meses
        </p>
      </div>

      <div className={`bg-gradient-to-br ${cards.launches.bg} rounded-xl sm:rounded-2xl p-4 sm:p-6 shadow-md border ${cards.launches.border}`}>
        <div className="flex items-center gap-2 sm:gap-3 mb-2 sm:mb-3">
          <div className={`p-1.5 sm:p-2 ${cards.launches.icon} rounded-lg`}>
            <svg className="h-4 w-4 sm:h-6 sm:w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
          </div>
          <h4 className="text-sm sm:text-base font-semibold text-slate-800">Lançamentos</h4>
        </div>
        <div className="text-xs sm:text-sm text-slate-700">
          {peaks.length === 0 && (
            <>
              <p className="text-xl sm:text-2xl font-bold text-slate-600 mb-1">Nenhum</p>
              <p className="text-slate-500">Sem atividade incomum</p>
            </>
          )}
          {peaks.length > 0 && (
            <>
              <p className={`text-xl sm:text-2xl font-bold ${cards.launches.text} mb-1 sm:mb-2`}>{peaks.length} detectado{peaks.length > 1 ? 's' : ''}</p>
              <div className="space-y-1">
                {peaks.slice(0, 3).map((p) => (
                  <div key={p} className={`text-xs bg-white rounded px-2 py-1 ${cards.launches.badge} font-medium`}>
                    {format(new Date(p + '-01'), 'MMM yyyy', { locale: ptBR })}
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      <div className={`bg-gradient-to-br ${cards.price.bg} rounded-xl sm:rounded-2xl p-4 sm:p-6 shadow-md border ${cards.price.border}`}>
        <div className="flex items-center gap-2 sm:gap-3 mb-2 sm:mb-3">
          <div className={`p-1.5 sm:p-2 ${cards.price.icon} rounded-lg`}>
            <svg className="h-4 w-4 sm:h-6 sm:w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h4 className="text-sm sm:text-base font-semibold text-slate-800">Valor m² Atual</h4>
        </div>
        <p className={`text-2xl sm:text-3xl font-bold ${cards.price.text} mb-1`}>
          R$ {Math.round(latestPrice).toLocaleString('pt-BR')}
        </p>
        <p className="text-xs sm:text-sm text-slate-600">preço por m²</p>
      </div>

      <div className={`bg-gradient-to-br ${cards.transactions.bg} rounded-xl sm:rounded-2xl p-4 sm:p-6 shadow-md border ${cards.transactions.border}`}>
        <div className="flex items-center gap-2 sm:gap-3 mb-2 sm:mb-3">
          <div className={`p-1.5 sm:p-2 ${cards.transactions.icon} rounded-lg`}>
            <svg className="h-4 w-4 sm:h-6 sm:w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          </div>
          <h4 className="text-sm sm:text-base font-semibold text-slate-800">Transações</h4>
        </div>
        <p className={`text-2xl sm:text-3xl font-bold ${cards.transactions.text} mb-1`}>{totalTransactions.toLocaleString('pt-BR')}</p>
        <p className="text-xs sm:text-sm text-slate-600">total no período</p>
      </div>
    </div>
  )
}
