const PERIOD_MONTHS = { '1M': 1, '3M': 3, '1Y': 12, '3Y': 36, '10Y': 120 }
const EXPECTED_FUND_NAME = 'AJ Bell Adventurous'

export const FUND_TIMEFRAMES = Object.keys(PERIOD_MONTHS)
export const DEFAULT_FUND_TIMEFRAME = '1M'
export const FUND_DATA_URL = typeof import.meta.env === 'object' ? import.meta.env.VITE_FUND_DATA_URL : undefined

export function parseFundData(payload) {
  if (payload?.verificationStatus !== 'verified') throw new Error('Fund data source is not verified.')
  if (payload.fund?.name !== EXPECTED_FUND_NAME || !payload.fund?.shareClass || !payload.fund?.quoteUnit) throw new Error('Verified AJ Bell Adventurous metadata is incomplete or mismatched.')
  if (!Array.isArray(payload.observations)) throw new Error('Verified fund observations are missing.')

  const observations = payload.observations
    .map(observation => ({ date: observation.date, price: Number(observation.price) }))
    .filter(observation => /^\d{4}-\d{2}-\d{2}$/.test(observation.date) && Number.isFinite(observation.price) && observation.price > 0)
    .sort((a, b) => a.date.localeCompare(b.date))

  if (observations.length < 2) throw new Error('Verified fund data needs at least two valid observations.')
  return {
    fund: { ...payload.fund, launchDate: payload.fund.launchDate || observations[0].date },
    source: payload.source || 'Verified fund data source',
    sourceUrl: payload.sourceUrl || '',
    updatedAt: payload.updatedAt || null,
    observations,
  }
}

export function filterFundObservations(observations, timeframe, latestDate = observations.at(-1)?.date) {
  const months = PERIOD_MONTHS[timeframe]
  if (!months || !latestDate) return []
  const end = new Date(`${latestDate}T00:00:00Z`)
  const start = new Date(end)
  start.setUTCMonth(start.getUTCMonth() - months)
  const startDate = start.toISOString().slice(0, 10)
  return observations.filter(observation => observation.date >= startDate && observation.date <= latestDate)
}

export function calculateFundPerformance(observations) {
  if (observations.length < 2) return null
  const first = observations[0]
  const last = observations.at(-1)
  return { percentage: ((last.price - first.price) / first.price) * 100, first, last }
}

export function getFundTimeframeState(data, timeframe) {
  const observations = filterFundObservations(data.observations, timeframe)
  const performance = calculateFundPerformance(observations)
  const isShortenedSinceLaunch = timeframe === '10Y' && data.fund.launchDate > observations[0]?.date
  return { observations, performance, available: observations.length >= 2, isShortenedSinceLaunch }
}

export async function getFundData() {
  if (!FUND_DATA_URL) return null
  const response = await fetch(FUND_DATA_URL)
  if (!response.ok) throw new Error(`Fund data fetch failed (${response.status})`)
  return parseFundData(await response.json())
}