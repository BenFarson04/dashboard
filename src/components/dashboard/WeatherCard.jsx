import { useApp } from '../../context/AppContext'
import { Icon } from '../ui/Icon'
import { Card, Badge, StateBoundary } from '../ui/primitives'

function conditionIcon(c = '') {
  const s = c.toLowerCase()
  if (s.includes('rain') || s.includes('shower')) return 'CloudRain'
  if (s.includes('cloud')) return 'Cloud'
  if (s.includes('wind')) return 'Wind'
  return 'Sun'
}

export function WeatherCard() {
  const { weather, loadWeather } = useApp()
  const w = weather.data

  return (
    <Card title="Weather" icon="CloudRain" labelledBy="weather-title">
      <StateBoundary loading={weather.loading} error={weather.error} onRetry={loadWeather}>
        {w && (
          <div>
            <div className="flex items-center gap-3">
              <Icon name={conditionIcon(w.current.condition)} size={40} className="text-indigo-500" />
              <div>
                <p className="text-3xl font-semibold text-slate-800 dark:text-slate-100">{w.current.tempC}°</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">{w.current.condition} · {w.location}</p>
              </div>
              <div className="ml-auto space-y-1 text-right text-[11px] text-slate-500 dark:text-slate-400">
                <Badge tone="blue" icon="Umbrella">{w.current.rainProbability}% rain</Badge>
                <p>Feels {w.current.feelsLikeC}° · Wind {w.current.windKph} km/h</p>
              </div>
            </div>

            <p className="mt-3 flex items-start gap-2 rounded-lg bg-slate-50 px-3 py-2 text-xs text-slate-600 dark:bg-slate-800 dark:text-slate-300">
              <Icon name="Info" size={14} className="mt-0.5 shrink-0 text-indigo-500" />
              {w.suggestion}
            </p>

            <ul className="mt-3 grid grid-cols-5 gap-1 text-center">
              {w.forecast.map(f => (
                <li key={f.label} className="rounded-lg py-2 hover:bg-slate-50 dark:hover:bg-slate-800/60">
                  <p className="text-[11px] text-slate-400">{f.label}</p>
                  <Icon name={conditionIcon(f.condition)} size={18} className="mx-auto my-1 text-slate-500" />
                  <p className="text-xs font-medium text-slate-700 dark:text-slate-200">{f.tempC}°</p>
                  <p className="text-[10px] text-blue-500">{f.rain}%</p>
                </li>
              ))}
            </ul>
          </div>
        )}
      </StateBoundary>
    </Card>
  )
}
