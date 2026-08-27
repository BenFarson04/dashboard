import { useState } from 'react'
import { useApp } from '../../context/AppContext'
import { Icon } from '../ui/Icon'
import { Button, Badge } from '../ui/primitives'
import { fmtTime, greetingFor } from '../../utils'
import { EMAIL_PROVIDERS } from '../../services/emailModel'

const REF_PAGE = { event: 'calendar', email: 'email', task: 'tasks', news: 'news'}

export function DailyBriefing() {
  const { briefing, refreshAll, settings, goTo, calendar, emails, weather } = useApp()
  const [showWhy, setShowWhy] = useState(false)

  const loading = calendar.loading || emails.loading || weather.loading

  const firstPart = briefing.parts[0]
  const supportingParts = briefing.parts.slice(1)

  return (
    <section aria-labelledby="briefing-title" className="overflow-hidden rounded-[var(--radius-card)] border border-indigo-200/70 bg-[var(--surface)] shadow-[var(--shadow-card)] dark:border-indigo-900/70">
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-sm shadow-indigo-600/20">
            <Icon name="Sparkles" size={18} />
          </div>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h2 id="briefing-title" className="text-base font-semibold text-[var(--text-primary)]">
                {greetingFor()}, {settings.name}
              </h2>
              <Badge tone="green" icon="Sparkles">Local rules</Badge>
            </div>
            <p className="mt-0.5 text-xs text-[var(--text-muted)]">
              Your short view of what needs attention today
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          <Button variant="ghost" size="sm" icon="RefreshCw" onClick={refreshAll} aria-label="Regenerate briefing">Regenerate</Button>
        </div>
      </div>

      <div className="mt-5 rounded-xl bg-indigo-50/70 p-4 dark:bg-indigo-950/30">
        {loading ? (
          <div className="space-y-2" aria-label="Loading briefing">
            <div className="skeleton-pulse h-4 w-3/4 rounded bg-indigo-100 dark:bg-indigo-900/60" />
            <div className="skeleton-pulse h-3 w-1/2 rounded bg-indigo-100 dark:bg-indigo-900/60" />
          </div>
        ) : briefing.parts.length === 0 ? (
          <div className="flex items-center gap-3">
            <Icon name="CircleCheck" size={20} className="text-emerald-600 dark:text-emerald-400" />
            <div><p className="text-sm font-semibold text-slate-800 dark:text-slate-100">Nothing urgent right now</p><p className="text-xs text-slate-500 dark:text-slate-400">Your dashboard is in a calm place.</p></div>
          </div>
        ) : (
          <div className="space-y-3">
            <p className="max-w-3xl text-base font-medium leading-relaxed text-slate-800 dark:text-slate-100">{firstPart.text}</p>
            {firstPart.refs.length > 0 && <RefList refs={firstPart.refs} goTo={goTo} />}
            {supportingParts.length > 0 && <div className="grid gap-2 border-t border-indigo-100 pt-3 sm:grid-cols-2 dark:border-indigo-900/60">
              {supportingParts.map((part, index) => <div key={index} className="text-sm leading-relaxed text-slate-600 dark:text-slate-300"><span>{part.text}</span>{part.refs.length > 0 && <RefList refs={part.refs} goTo={goTo} />}</div>)}
            </div>}
          </div>
        )}
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 pt-3 dark:border-slate-800">
        <button
          onClick={() => setShowWhy(v => !v)}
          aria-expanded={showWhy}
          className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
        >
          <Icon name="HelpCircle" size={14} />
          Why am I seeing this?
        </button>
        <span className="text-[11px] text-[var(--text-muted)]">Generated {fmtTime(briefing.generatedAt)} · dashboard data only</span>
      </div>

      {showWhy && (
        <div className="mt-2 rounded-xl bg-[var(--surface-inset)] p-3 text-xs leading-relaxed text-slate-600 dark:text-slate-300">
          This briefing is generated locally from your calendar, relevant-email
          shortlist, tasks, weather and selected news. Calendar, email and weather
          use your connected services. News is currently demonstration content until
          a live RSS or news source is connected. No email or calendar contents are
          sent to an external AI service.
        </div>
      )}
    </section>
  )
}

function RefList({ refs, goTo }) {
  return <div className="mt-2 flex flex-wrap gap-1.5">{refs.slice(0, 3).map(ref => (
    <button key={ref.type + ref.id} onClick={() => goTo(REF_PAGE[ref.type] || 'dashboard', { type: ref.type, id: ref.id })} className="inline-flex min-h-8 max-w-full items-center gap-1.5 rounded-lg border border-indigo-200 bg-white px-2.5 py-1 text-xs font-medium text-indigo-700 transition-colors hover:border-indigo-400 hover:bg-indigo-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/50 dark:border-indigo-800 dark:bg-slate-900 dark:text-indigo-300 dark:hover:bg-indigo-950/50" title={ref.label}>
      <Icon name={ref.type === 'event' ? 'Calendar' : ref.type === 'email' ? 'Mail' : ref.type === 'news' ? 'Newspaper' : 'CheckSquare'} size={12} />
      {ref.provider && <span className="shrink-0">{EMAIL_PROVIDERS[ref.provider]?.label || ref.provider}</span>}
      <span className="max-w-[14rem] truncate">{ref.label}</span>
    </button>
  ))}</div>
}
