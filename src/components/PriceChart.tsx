import { useMemo } from 'react'
import { Chart, registerables } from 'chart.js'
import { Line } from 'react-chartjs-2'
import { groupByMonth } from '../api/itbi'
import { format, subMonths } from 'date-fns'
import { ptBR } from 'date-fns/locale'

Chart.register(...registerables)

type Theme = {
  bgGradient: string
  titleGradient: string
  primary: string
  secondary: string
}

export default function PriceChart({ records, street, theme }: { records: any[]; street: string; theme: Theme }) {
  const filtered = records.filter((r) => r.address && r.address.toLowerCase().includes(street.toLowerCase()))
  const byMonth = groupByMonth(filtered)

  // Get the neighborhood name from the first filtered record
  const neighborhood = filtered.length > 0 ? filtered[0].bairro : ''

  const last24 = useMemo(() => {
    const end = new Date()
    const months: string[] = []
    // Generate last 24 months: go back 24 months to today (inclusive)
    for (let i = 24; i >= 1; i--) months.push(format(subMonths(end, i), 'yyyy-MM'))

    const values = months.map((m) => {
      const items = byMonth[m] || []
      if (items.length === 0) return null

      // Aggregate properly: sum(média_valor_imóvel * total_transações) / sum(média_área_construída * total_transações)
      const totalValue = items.reduce((sum, item) => sum + (item.totalValue ?? 0), 0)
      const totalArea = items.reduce((sum, item) => sum + (item.totalArea ?? 0), 0)

      return totalArea > 0 ? totalValue / totalArea : null
    })

    // For transaction counts, sum up the transactionCount from all items in each month
    const counts = months.map((m) => {
      const items = byMonth[m] || []
      return items.reduce((sum: number, item: any) => sum + (item.transactionCount ?? 0), 0)
    })

    return { months, values, counts }
  }, [byMonth, filtered.length, street, filtered])

  const getChartColors = () => {
    if (theme.primary === 'blue') {
      return {
        line: {
          border: '#2563eb',
          background: 'rgba(37, 99, 235, 0.1)',
          point: '#2563eb'
        },
        bar: {
          background: 'rgba(147, 51, 234, 0.3)',
          border: 'rgba(147, 51, 234, 0.5)'
        }
      }
    } else {
      return {
        line: {
          border: '#dc2626',
          background: 'rgba(220, 38, 38, 0.1)',
          point: '#dc2626'
        },
        bar: {
          background: 'rgba(249, 115, 22, 0.3)',
          border: 'rgba(249, 115, 22, 0.5)'
        }
      }
    }
  }

  const chartColors = getChartColors()

  const chartLabels = last24.months.map((m) => {
    const [year, month] = m.split('-')
    // Use local timezone to avoid timezone shift issues
    return format(new Date(parseInt(year), parseInt(month) - 1, 1), 'MMM yyyy', { locale: ptBR })
  })

  const chartData = {
    labels: chartLabels,
    datasets: [
      {
        type: 'line' as const,
        label: 'R$/m²',
        data: last24.values.map((v) => (v === null ? null : Math.round(v))),
        borderColor: chartColors.line.border,
        backgroundColor: chartColors.line.background,
        tension: 0.4,
        spanGaps: true,
        fill: true,
        borderWidth: 3,
        pointRadius: 4,
        pointHoverRadius: 6,
        pointBackgroundColor: chartColors.line.point,
        pointBorderColor: '#fff',
        pointBorderWidth: 2,
        yAxisID: 'y'
      },
      {
        type: 'bar' as const,
        label: 'Transações',
        data: last24.counts,
        backgroundColor: chartColors.bar.background,
        borderColor: chartColors.bar.border,
        borderWidth: 1,
        yAxisID: 'y1'
      }
    ]
  }

  const opts: any = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      mode: 'index',
      intersect: false,
    },
    plugins: {
      legend: {
        display: true,
        position: 'top',
        labels: {
          usePointStyle: true,
          padding: 15,
          font: {
            size: 13,
            weight: 500
          }
        }
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        padding: 12,
        titleFont: {
          size: 14,
          weight: 'bold'
        },
        bodyFont: {
          size: 13
        },
        callbacks: {
          label: function(context: any) {
            let label = context.dataset.label || '';
            if (label) {
              label += ': ';
            }
            if (context.parsed.y !== null) {
              if (context.dataset.type === 'line') {
                label += 'R$ ' + context.parsed.y.toLocaleString('pt-BR');
              } else {
                label += context.parsed.y + ' transação' + (context.parsed.y !== 1 ? 'ões' : '');
              }
            }
            return label;
          }
        }
      }
    },
    scales: {
      y: {
        type: 'linear',
        display: true,
        position: 'left',
        beginAtZero: false,
        grid: {
          color: 'rgba(0, 0, 0, 0.05)'
        },
        ticks: {
          callback: function(value: any) {
            return 'R$ ' + value.toLocaleString('pt-BR');
          },
          font: {
            size: 11
          }
        },
        title: {
          display: true,
          text: 'Valor m² (R$)',
          font: {
            size: 12,
            weight: 600
          }
        }
      },
      y1: {
        type: 'linear',
        display: true,
        position: 'right',
        beginAtZero: true,
        grid: {
          drawOnChartArea: false,
        },
        ticks: {
          font: {
            size: 11
          }
        },
        title: {
          display: true,
          text: 'Transações',
          font: {
            size: 12,
            weight: 600
          }
        }
      },
      x: {
        grid: {
          display: false
        },
        ticks: {
          font: {
            size: 11
          },
          maxRotation: 45,
          minRotation: 45
        }
      }
    }
  }

  return (
    <div className="bg-white rounded-xl sm:rounded-2xl p-4 sm:p-8 shadow-lg">
      <div className="mb-4 sm:mb-6">
        <h2 className="text-lg sm:text-2xl font-bold text-slate-800">Evolução do Preço do Metro Quadrado - Últimos 24 Meses</h2>
        <p className="text-sm sm:text-base text-slate-800 mt-1 truncate">
          <strong>{street}</strong>
          {neighborhood && <span className="text-slate-400 ml-2">• {neighborhood}</span>}
        </p>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">Histórico de valorização baseado em transações ITBI oficiais</p>
      </div>
      <div className="h-64 sm:h-80 md:h-96">
        <Line key={`chart-${street}-${filtered.length}`} data={chartData} options={opts} />
      </div>
    </div>
  )
}
