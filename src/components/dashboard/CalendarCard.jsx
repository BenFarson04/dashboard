import { useState } from 'react'
import { useApp } from '../../context/AppContext'
import { Icon } from '../ui/Icon'
import { Card, Badge, Button, StateBoundary, Modal, IconButton } from '../ui/primitives'
import { cn, fmtTime, fmtDayShort, isToday, isPast } from '../../utils'

const CATEGORY_TONE = { Work: 'blue', Personal: 'green', Finance: 'amber', University: 'indigo' }
// Explicit (non-interpolated) classes so Tailwind keeps them in the build.
const CATEGORY_BAR = { Work: 'bg-blue-400', Personal: 'bg-emerald-400', Finance: 'bg-amber-400', University: 'bg-indigo-400' }

function EventRow({ ev, focused, onOpen }) {
  const past = isPast(ev.end || ev.start)
  return (
    <li
      className={cn(
        'group flex gap-3 rounded-xl border border-transparent p-2 transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/60',
        focused && 'ring-2 ring-indigo-500',
        past && 'opacity-60',
      )}
    >
      <div className="flex w-12 shrink-0 flex-col items-center">
        <span className="text-xs font-semibold text-slate-700 dark:text-slate-200">{fmtTime(ev.start)}</span>
        <span className="text-[10px] text-slate-400">{fmtTime(ev.end)}</span>
      </div>
      <div className={cn('mt-1 w-1 shrink-0 rounded-full', CATEGORY_BAR[ev.category] || 'bg-slate-300')} aria-hidden="true" />
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <p className="truncate text-sm font-medium text-slate-800 dark:text-slate-100">{ev.title}</p>
          {ev.prep && <Badge tone="amber" icon="Flag">Prep</Badge>}
        </div>
        <div className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-slate-500 dark:text-slate-400">
          <span className="inline-flex items-center gap-1">
            <Icon name={ev.online ? 'Video' : 'MapPin'} size={12} />
            {ev.location}
          </span>
          <Badge tone={CATEGORY_TONE[ev.category] || 'gray'}>{ev.category}</Badge>
        </div>
      </div>
      <button
        onClick={() => onOpen(ev)}
        className="self-center rounded-md px-2 py-1 text-xs font-medium text-indigo-600 opacity-0 hover:bg-indigo-50 focus:opacity-100 group-hover:opacity-100 dark:text-indigo-300 dark:hover:bg-indigo-950/40"
      >
        Details
      </button>
    </li>
  )
}

export function CalendarCard({ full = false }) {
  const { calendar, loadCalendar, focus, goTo } = useApp()
  const [detail, setDetail] = useState(null)

  const events = calendar.data || []
  const today = events.filter(e => isToday(e.start))
  const upcoming = events.filter(e => !isToday(e.start) && !isPast(e.start))

  const action = (
    <Button variant="ghost" size="sm" iconRight="ArrowRight" onClick={() => goTo('calendar')}>
      {full ? '' : 'Open'}
    </Button>
  )

  return (
    <Card title="Calendar" icon="Calendar" labelledBy="cal-title" action={!full ? action : undefined}>
      <StateBoundary
        loading={calendar.loading}
        error={calendar.error}
        onRetry={loadCalendar}
        empty={!calendar.loading && !calendar.error && today.length === 0 && upcoming.length === 0}
        emptyProps={{ icon: 'Calendar', title: 'No events', message: 'Your schedule is clear.' }}
      >
        <div className="space-y-4">
          <div>
            <p className="mb-1 px-2 text-[11px] font-semibold uppercase tracking-wide text-slate-400">Today</p>
            {today.length === 0 ? (
              <p className="px-2 py-3 text-sm text-slate-500 dark:text-slate-400">No events today.</p>
            ) : (
              <ul className="space-y-1">
                {(full ? today : today.slice(0, 4)).map(ev => (
                  <EventRow key={ev.id} ev={ev} focused={focus?.type === 'event' && focus.id === ev.id} onOpen={setDetail} />
                ))}
              </ul>
            )}
          </div>

          {(full || upcoming.length > 0) && (
            <div>
              <p className="mb-1 px-2 text-[11px] font-semibold uppercase tracking-wide text-slate-400">Upcoming</p>
              <ul className="space-y-1">
                {(full ? upcoming : upcoming.slice(0, 2)).map(ev => (
                  <li key={ev.id} className="flex items-center gap-3 rounded-xl p-2 hover:bg-slate-50 dark:hover:bg-slate-800/60">
                    <span className="w-12 shrink-0 text-center text-[11px] font-medium text-slate-500">{fmtDayShort(ev.start)}</span>
                    <span className="w-10 shrink-0 text-xs text-slate-500">{fmtTime(ev.start)}</span>
                    <span className="min-w-0 flex-1 truncate text-sm text-slate-700 dark:text-slate-200">{ev.title}</span>
                    {ev.prep && <Badge tone="amber" icon="Flag">Prep</Badge>}
                    <button onClick={() => setDetail(ev)} className="rounded-md px-2 py-1 text-xs text-indigo-600 hover:bg-indigo-50 dark:text-indigo-300 dark:hover:bg-indigo-950/40">Details</button>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </StateBoundary>

      <Modal
        open={!!detail}
        onClose={() => setDetail(null)}
        title={detail?.title || 'Event'}
        footer={<Button variant="primary" size="sm" icon="ExternalLink">Open in calendar</Button>}
      >
        {detail && (
          <div className="space-y-3 text-sm">
            <div className="flex flex-wrap gap-2">
              <Badge tone={CATEGORY_TONE[detail.category] || 'gray'}>{detail.category}</Badge>
              {detail.prep && <Badge tone="amber" icon="Flag">Preparation needed</Badge>}
              <Badge tone="gray" icon={detail.online ? 'Video' : 'MapPin'}>{detail.online ? 'Online' : 'In person'}</Badge>
            </div>
            <p className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
              <Icon name="Clock" size={15} className="text-slate-400" />
              {fmtDayShort(detail.start)}, {fmtTime(detail.start)}–{fmtTime(detail.end)}
            </p>
            <p className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
              <Icon name={detail.online ? 'Video' : 'MapPin'} size={15} className="text-slate-400" />
              {detail.location}
            </p>
            <p className="text-slate-600 dark:text-slate-300">{detail.details}</p>
          </div>
        )}
      </Modal>
    </Card>
  )
}
