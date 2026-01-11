import axios from 'axios'
import { format } from 'date-fns'

// Lambda URL for São Paulo ITBI data
const BASE = import.meta.env.DEV
  ? '/api'
  : 'https://7qrc3rfl2f226uqohfpkus4hzu0faves.lambda-url.us-west-2.on.aws'

// Fetch features - Lambda API returns paginated data
export async function fetchRecentFeatures(): Promise<any[]> {
  const limit = 5000
  let offset = 0
  let all: any[] = []

  try {
    while (true) {
      const params = new URLSearchParams({
        limit: String(limit),
        offset: String(offset)
      })
      const url = `${BASE}?${params.toString()}`
      console.log(`Fetching from Lambda: offset=${offset}, limit=${limit}`)
      console.log(`Full URL: ${url}`)

      const res = await axios.get(url, {
        timeout: 30000,
        headers: {
          'Accept': 'application/json'
        },
        transformResponse: [(data) => {
          // Don't transform, just return raw data
          return data
        }]
      })

      // Parse response - handle both object and string cases
      let data = res.data

      if (typeof data === 'string') {
        console.log('Response is a string, parsing JSON with NaN handling...')
        // Replace NaN with null to make it valid JSON
        const cleanedData = data.replace(/:\s*NaN/g, ': null')
        data = JSON.parse(cleanedData)
      }

      console.log('Data type:', typeof data)
      console.log('Has data array:', Array.isArray(data?.data))

      const dataArray = data?.data || []
      console.log(`Data array length: ${dataArray.length}`)

      if (!data || !dataArray || dataArray.length === 0) {
        console.log('No more data to fetch.')
        break
      }

      all = all.concat(dataArray)
      console.log(`Fetched ${data.data.length} records. Total so far: ${all.length}/${data.total_records}`)

      // Continue fetching until we get all records or reach a reasonable limit
      if (data.data.length < limit || all.length >= data.total_records) {
        console.log(`Pagination complete. Total records: ${all.length}`)
        break
      }
      offset += limit
    }
    console.log(`Final total: ${all.length} records fetched`)
    return all
  } catch (error) {
    console.error('Error fetching ITBI data:', error)
    throw new Error('Failed to fetch property data from São Paulo. Please try again later.')
  }
}

function normalizeString(s: string) {
  return s
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
}

export function parseFeaturesForRecords(features: any[]) {
  // Convert Lambda API data into records
  const records: any[] = []
  console.log(`Parsing ${features.length} features from Lambda API`)

  for (const f of features) {
    // Get street name
    const address = f.street ? String(f.street).trim() : ''
    if (!address) continue

    // Parse year_month (format: "YYYY-MM")
    const yearMonth = f.year_month
    if (!yearMonth) continue

    const [year, month] = yearMonth.split('-').map(Number)
    if (!year || !month) continue

    // Create date from year and month
    const dateVal = new Date(year, month - 1, 1)

    // Get values from Lambda API response
    const totalValue = f.total_transaction_value || 0
    const totalArea = f.total_built_area_m2 || 0
    const transactionCount = f.total_transactions || 1
    const avgArea = f.avg_built_area_m2 || 0

    // Calculate average value
    const avgValue = totalValue / transactionCount

    // Calculate m2 price
    let m2Price: number | null = null
    if (totalValue > 0 && totalArea > 0) {
      m2Price = totalValue / totalArea
    }

    // Map construction_type to uso field for filtering
    // Lambda data uses construction_type to distinguish residential vs commercial
    let uso = 'RESIDENCIAL'
    if (f.construction_type) {
      const constructionType = String(f.construction_type).toUpperCase().trim()
      // Commercial types include: COMERCIAL VERTICAL, COMERCIAL HORIZONTAL
      if (constructionType.includes('COMERCIAL')) {
        uso = 'NAO RESIDENCIAL'
      }
      // Residential types include: RESIDENCIAL VERTICAL, RESIDENCIAL HORIZONTAL
      // Default is already RESIDENCIAL, so no change needed
    }

    records.push({
      raw: f,
      date: dateVal,
      address,
      value: avgValue,
      area: avgArea,
      m2Price,
      transactionCount,
      totalValue,
      totalArea,
      bairro: f.neighborhood || '',
      uso: uso,
      year,
      month,
      propertyUse: f.property_use || '',
      constructionType: f.construction_type || ''
    })
  }

  console.log(`Parsed ${records.length} valid records from ${features.length} features`)
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
