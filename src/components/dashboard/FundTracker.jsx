import { useId } from 'react'
import { useApp } from '../../context/AppContext'
import { useLocalStorage } from '../../hooks/useLocalStorage'
import { DEFAULT_FUND_TIMEFRAME, FUND_TIMEFRAMES, getFundTimeframeState } from '../../services/fundService'
import { Card, StateBoundary } from '../ui/primitives'
import { cn } from '../../utils'

const formatDate = date => new Date(`${date}T00:00:00Z`).toLocaleDateString([], { day: 'numeric', month: 'short', year: 'numeric' })
const formatPrice = (price, unit) => `${price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 4 })} ${unit}`

function FundChart({ observations, unit, summaryId }) {
  const values = observations.map(observation => observation.price)
  const min = Math.min(...values)
  const max = Math.max(...values)
  const range = max - min || Math.max(max * 0.01, 1)
  const points = observations.map((observation, index) => {
    const x = observations.length === 1 ? 160 : (index / (observations.length - 1)) * 320
    const y = 86 - ((observation.price - min) / range) * 68
    return { ...observation, x, y }
  })
  const latest = observations.at(-1)

  return (
    <div className="mt-3">
      <svg viewBox="0 0 320 96" preserveAspectRatio="none" className="h-24 w-full text-indigo-500" role="img" aria-labelledby={summaryId}>
        <title id={summaryId}>Fund price movement from {formatDate(observations[0].date)} to {formatDate(latest.date)}</title>
        <line x1="0" y1="86" x2="320" y2="86" className="stroke-slate-200 dark:stroke-slate-700" strokeWidth="1" />
        <polyline points={points.map(point => `${point.x},${point.y}`).join(' ')} fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        {points.map(point => <circle key={point.date} cx={point.x} cy={point.y} r="2.5" fill="currentColor"><title>{formatDate(point.date)}: {formatPrice(point.price, unit)}</title></circle>)}
      </svg>
      <p className="text-[11px] text-slate-500 dark:text-slate-400">Latest observation: {formatDate(latest.date)} · {formatPrice(latest.price, unit)}</p>
    </div>
  )
}

export function FundTracker() {
  const { fund, loadFund } = useApp()
  const [timeframe, setTimeframe] = useLocalStorage('pd.fundTimeframe', DEFAULT_FUND_TIMEFRAME, value => FUND_TIMEFRAMES.includes(value) ? value : DEFAULT_FUND_TIMEFRAME)
  const summaryId = useId()
  const data = fund.data
  const state = data ? getFundTimeframeState(data, timeframe) : null
  const latest = data?.observations.at(-1)
  const periodLabel = state?.isShortenedSinceLaunch ? 'Since launch within the selected period.' : null

  return (
    <Card title="Fund Tracker" icon="LineChart" labelledBy="fund-tracker-title">
      <StateBoundary loading={fund.loading} error={fund.error} onRetry={loadFund} empty={!data} emptyProps={{ icon: 'LineChart', title: 'Fund data not configured', message: 'Add VITE_FUND_DATA_URL for a verified AJ Bell Adventurous data source.' }}>
        {data && (
          <div>
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-slate-800 dark:text-slate-100">{data.fund.name}</p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">Latest: {formatPrice(latest.price, data.fund.quoteUnit)}</p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">Dated: {formatDate(latest.date)}</p>
              </div>
              <span className="shrink-0 text-[10px] text-slate-400">Price movement</span>
            </div>
            <div className="mt-3 flex items-center justify-between gap-2">
              <div role="group" aria-label="Fund chart timeframe" className="flex rounded-lg border border-slate-200 p-0.5 dark:border-slate-700">
                {FUND_TIMEFRAMES.map(option => {
                  const optionState = getFundTimeframeState(data, option)
                  return <button key={option} type="button" disabled={!optionState.available} aria-pressed={timeframe === option} aria-label={`${option}${optionState.available ? '' : ', insufficient verified history'}`} onClick={() => setTimeframe(option)} className={cn('interactive-button rounded-md px-2 py-1 text-[11px] font-medium focus:outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-indigo-600', timeframe === option ? 'bg-indigo-600 text-white' : 'text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800', !optionState.available && 'cursor-not-allowed opacity-40')}>{option}</button>
                })}
              </div>
              <span className="text-[11px] text-slate-400">{timeframe}</span>
            </div>
            {!state.available ? <p role="status" className="mt-4 rounded-lg bg-slate-50 px-3 py-3 text-xs text-slate-500 dark:bg-slate-800 dark:text-slate-400">Insufficient verified history for this period.</p> : (
              <>
                <FundChart observations={state.observations} unit={data.fund.quoteUnit} summaryId={summaryId} />
                <p className="mt-2 text-xs text-slate-600 dark:text-slate-300">Period change: <strong className={state.performance.percentage >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}>{state.performance.percentage >= 0 ? '+' : ''}{state.performance.percentage.toFixed(2)}%</strong><span className="ml-2 text-slate-400">{periodLabel || `${formatDate(state.performance.first.date)} to ${formatDate(state.performance.last.date)}`}</span></p>
              </>
            )}
            <p className="mt-2 text-[11px] text-slate-400">Updated: {data.updatedAt ? new Date(data.updatedAt).toLocaleString() : formatDate(latest.date)} · Daily fund price</p>
          </div>
        )}
      </StateBoundary>
    </Card>
  )
}