import assert from 'node:assert/strict'
import { calculateFundPerformance, DEFAULT_FUND_TIMEFRAME, filterFundObservations, getFundTimeframeState, parseFundData } from '../src/services/fundService.js'

const observations = [
  { date: '2016-01-04', price: 100 }, { date: '2023-01-03', price: 120 },
  { date: '2025-01-02', price: 110 }, { date: '2025-11-03', price: 115 },
  { date: '2025-12-01', price: 125 }, { date: '2025-12-02', price: 130 },
]
const data = parseFundData({
  verificationStatus: 'verified',
  fund: { name: 'AJ Bell Adventurous', shareClass: 'Accumulation', quoteUnit: 'pence', launchDate: '2016-01-04' },
  source: 'Fixture verified source', observations,
})

assert.deepEqual(filterFundObservations(observations, '1M').map(item => item.date), ['2025-11-03', '2025-12-01', '2025-12-02'])
assert.deepEqual(filterFundObservations(observations, '3Y').map(item => item.date), ['2023-01-03', '2025-01-02', '2025-11-03', '2025-12-01', '2025-12-02'])
assert.equal(DEFAULT_FUND_TIMEFRAME, '1M')
assert.deepEqual(filterFundObservations(observations, '1Y').map(item => item.date), ['2025-01-02', '2025-11-03', '2025-12-01', '2025-12-02'])
assert.equal(getFundTimeframeState(data, '10Y').available, true)
assert.equal(getFundTimeframeState({ ...data, observations: observations.slice(-1) }, '10Y').available, false)
assert.deepEqual(filterFundObservations(observations.filter(item => item.date !== '2025-11-03'), '1M').map(item => item.date), ['2025-12-01', '2025-12-02'])
assert.equal(calculateFundPerformance([{ date: '2025-12-02', price: 130 }]), null)
const performance = calculateFundPerformance([{ date: '2025-12-01', price: 125 }, { date: '2025-12-02', price: 130 }])
assert.deepEqual(performance.first, { date: '2025-12-01', price: 125 })
assert.equal(Math.round(performance.percentage * 100) / 100, 4)
assert.throws(() => parseFundData({ verificationStatus: 'unverified', fund: {}, observations: [] }), /not verified/)

console.log('fund filtering and performance tests passed')