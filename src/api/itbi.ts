import axios from 'axios'
import { format } from 'date-fns'

// TODO: Update this with the actual São Paulo ITBI data source
// For now, using a placeholder. You'll need to find the São Paulo equivalent
// of Rio's ArcGIS ITBI endpoint or another official data source
const BASE = import.meta.env.DEV ? '/api' : 'https://placeholder-sp-data-source.sp.gov.br/api/itbi'

// Fetch features - get more data for better coverage
export async function fetchRecentFeatures(): Promise<any[]> {
  const page = 1000
  let offset = 0
  let all: any[] = []

  // Get current year and 2 years back for filtering
  const currentYear = new Date().getFullYear()
  const minYear = currentYear - 2

  try {
    while (true) {
      const params = new URLSearchParams({
        f: 'json',
        // Filter by year to reduce data load - last 3 years
        where: `ano_transação >= ${minYear}`,
        outFields: '*',
        resultOffset: String(offset),
        resultRecordCount: String(page)
      })
      const url = `${BASE}?${params.toString()}`
      const res = await axios.get(url, {
        timeout: 30000,
        headers: {
          'Accept': 'application/json'
        }
      })
      const data = res.data
      if (!data || !data.features) break
      all = all.concat(data.features)

      // Increased limit to 50k records to ensure we get all streets
      if (data.features.length < page || all.length >= 50000) break
      offset += page
    }
    return all
  } catch (error) {
    console.error('Error fetching ITBI data:', error)
    throw new Error('Failed to fetch property data from São Paulo City Hall. Please try again later.')
  }
}

function normalizeString(s: string) {
  return s
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
}

export function parseFeaturesForRecords(features: any[]) {
  // Convert aggregated monthly data into records
  const records: any[] = []

  for (const f of features) {
    const attrs = f.attributes || {}

    // Get street name
    const address = attrs.logradouro ? String(attrs.logradouro).trim() : ''
    if (!address) continue

    // Get year and month
    const year = attrs['ano_transação'] || attrs.ano_transacao
    const month = attrs['mês_transação'] || attrs.mes_transacao

    if (!year || !month) continue

    // Create date from year and month
    const dateVal = new Date(year, month - 1, 1)

    // Get values
    const avgValue = attrs['média_valor_imóvel'] || attrs.media_valor_imovel || 0
    const avgArea = attrs['média_área_construída'] || attrs.media_area_construida || 0

    // Get transaction count
    const transactionCount = attrs['total_transações'] || attrs.total_transacoes || 1

    // Store weighted values for proper aggregation
    // A = média_valor_imóvel * total_transações
    const totalValue = avgValue * transactionCount
    // B = média_área_construída * total_transações
    const totalArea = avgArea * transactionCount

    // Calculate m2 price for this record (will be recalculated during aggregation)
    let m2Price: number | null = null
    if (totalValue > 0 && totalArea > 0) {
      m2Price = totalValue / totalArea
    }

    records.push({
      raw: attrs,
      date: dateVal,
      address,
      value: avgValue,
      area: avgArea,
      m2Price,
      transactionCount,
      totalValue, // Store for aggregation
      totalArea,  // Store for aggregation
      bairro: attrs.bairro || '',
      uso: attrs.uso || '',
      year,
      month
    })
  }

  return records
}

export function filterRecordsByStreet(records: any[], street: string) {
  const s = normalizeString(street)
  return records.filter((r) => {
    if (!r.address) return false
    const a = normalizeString(r.address)
    return a.includes(s)
  })
}

export function groupByMonth(records: any[]) {
  const map: Record<string, any[]> = {}
  for (const r of records) {
    if (!r.date) continue
    const key = format(new Date(r.date), 'yyyy-MM')
    if (!map[key]) map[key] = []
    map[key].push(r)
  }
  return map
}
