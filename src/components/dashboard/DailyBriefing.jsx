import { useState } from 'react'
import { useApp } from '../../context/AppContext'
import { Icon } from '../ui/Icon'
import { Button, Badge } from '../ui/primitives'
import { fmtTime, greetingFor } from '../../utils'

const REF_PAGE = { event: 'calendar', email: 'email', task: 'tasks' }

export function DailyBriefing() {
  const { briefing, refreshAll, settings, goTo, calendar, emails, weather } = useApp()
  const [showWhy, setShowWhy] = useState(false)

  const loading = calendar.loading || emails.loading || weather.loading

  return (
    <section
      aria-labelledby="briefing-title"
      className="rounded-2xl border border-indigo-100 bg-gradient-to-br from-indigo-50 to-white p-5 shadow-sm dark:border-indigo-950/60 dark:from-indigo-950/40 dark:to-slate-900"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-600 text-white">
            <Icon name="Sparkles" size={18} />
          </div>
          <div>
            <h2 id="briefing-title" className="text-sm font-semibold text-slate-800 dark:text-slate-100">
              {greetingFor()}, {settings.name} — here’s your briefing
            </h2>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Generated {fmtTime(briefing.generatedAt)} · from your dashboard data
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          <Badge tone="amber" icon="Info">Mock data</Badge>
          <Button variant="ghost" size="sm" icon="RefreshCw" onClick={refreshAll} aria-label="Regenerate briefing">Regenerate</Button>
        </div>
      </div>

      <div className="mt-4">
        {loading ? (
          <p className="text-sm text-slate-500 dark:text-slate-400">Compiling your briefing…</p>
        ) : briefing.parts.length === 0 ? (
          <p className="text-sm text-slate-600 dark:text-slate-300">Nothing urgent right now. Enjoy the quiet. 🌿</p>
        ) : (
          <p className="text-[15px] leading-relaxed text-slate-700 dark:text-slate-200">
            {briefing.parts.map((part, i) => (
              <span key={i}>
                {part.text}{' '}
                {part.refs.length > 0 && (
                  <span className="mr-1 inline-flex flex-wrap gap-1 align-middle">
                    {part.refs.slice(0, 3).map(ref => (
                      <button
                        key={ref.type + ref.id}
                        onClick={() => goTo(REF_PAGE[ref.type] || 'dashboard', { type: ref.type, id: ref.id })}
                        className="inline-flex items-center gap-1 rounded-full border border-indigo-200 bg-white/70 px-2 py-0.5 text-xs font-medium text-indigo-700 hover:bg-white dark:border-indigo-900 dark:bg-slate-900/60 dark:text-indigo-300"
                        title={ref.label}
                      >
                        <Icon name={ref.type === 'event' ? 'Calendar' : ref.type === 'email' ? 'Mail' : 'CheckSquare'} size={11} />
                        <span className="max-w-[10rem] truncate">{ref.label}</span>
                      </button>
                    ))}
                  </span>
                )}
              </span>
            ))}
          </p>
        )}
      </div>

      <div className="mt-4 flex items-center justify-between border-t border-indigo-100/70 pt-3 dark:border-indigo-950/60">
        <button
          onClick={() => setShowWhy(v => !v)}
          aria-expanded={showWhy}
          className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
        >
          <Icon name="HelpCircle" size={14} />
          Why am I seeing this?
        </button>
      </div>

      {showWhy && (
        <div className="mt-2 rounded-xl bg-white/70 p-3 text-xs leading-relaxed text-slate-600 dark:bg-slate-900/60 dark:text-slate-300">
          This briefing is <strong>generated from your own dashboard data</strong> — today’s calendar events, the
          relevant-email shortlist, your task list and the weather — using simple rules (event count, items flagged
          for preparation, high-importance emails, overdue tasks, rain likelihood). Nothing is sent to an external AI
          service in this version. In a future version an optional LLM step could rephrase this
          <em> structured</em> summary more naturally, behind a setting and a secure backend.
        </div>
      )}
    </section>
  )
}
