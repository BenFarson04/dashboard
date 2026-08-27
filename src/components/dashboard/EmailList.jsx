import { useState } from 'react'
import { useApp } from '../../context/AppContext'
import { Icon } from '../ui/Icon'
import { Card, Badge, Button, Chip, StateBoundary, IconButton } from '../ui/primitives'
import { cn, relTime } from '../../utils'
import { EMAIL_CATEGORIES } from '../../data/mockData'
import { EMAIL_PROVIDERS } from '../../services/emailModel'

const IMPORTANCE = {
  high:   { tone: 'red', label: 'Important' },
  medium: { tone: 'amber', label: 'Notable' },
  low:    { tone: 'gray', label: 'FYI' },
}
const FEEDBACK = [
  { key: 'useful', icon: 'ThumbsUp', label: 'Useful' },
  { key: 'not_relevant', icon: 'ThumbsDown', label: 'Not relevant' },
  { key: 'dealt', icon: 'CircleCheck', label: 'Dealt with' },
]

function EmailItem({ email, focused }) {
  const { setEmailFeedbackFor, markEmailRead } = useApp()
  const [showWhy, setShowWhy] = useState(false)
  const imp = IMPORTANCE[email.importance] || IMPORTANCE.low
  const provider = EMAIL_PROVIDERS[email.provider] || { label: email.accountLabel || 'Email', tone: 'gray' }

  return (
    <li className={cn(
      'interactive-row rounded-xl border p-3',
      focused ? 'border-indigo-400 ring-2 ring-indigo-500' : 'border-slate-100 dark:border-slate-800',
      email.unread ? 'bg-white dark:bg-slate-900' : 'bg-slate-50/60 dark:bg-slate-900/40',
      email.feedback === 'not_relevant' && 'opacity-60',
    )}>
      <div className="flex items-start gap-2">
        {email.unread
          ? <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-indigo-500" aria-label="Unread" />
          : <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-transparent" aria-hidden="true" />}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className={cn('truncate text-sm', email.unread ? 'font-semibold text-slate-800 dark:text-slate-100' : 'font-medium text-slate-600 dark:text-slate-300')}>
              {email.sender}
            </span>
            <Badge tone={imp.tone}>{imp.label}</Badge>
            <Badge tone={provider.tone} className="shrink-0"><span className="h-1.5 w-1.5 rounded-full bg-current" aria-hidden="true" />{provider.label}</Badge>
            <span className="ml-auto shrink-0 text-[11px] text-slate-400">{relTime(email.received)}</span>
          </div>
          <p className={cn('truncate text-sm', email.unread ? 'text-slate-700 dark:text-slate-200' : 'text-slate-500 dark:text-slate-400')}>{email.subject}</p>
          <p className="mt-0.5 line-clamp-2 text-xs text-slate-500 dark:text-slate-400">{email.preview}</p>

          <div className="mt-2 flex flex-wrap items-center gap-1.5">
            <Badge tone="indigo" icon="Filter">{EMAIL_CATEGORIES.find(c => c.id === email.category)?.label || email.category}</Badge>
            <button onClick={() => setShowWhy(v => !v)} aria-expanded={showWhy}
              className="interactive-button inline-flex items-center gap-1 rounded px-1 text-[11px] font-medium text-slate-400 hover:text-slate-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/50 dark:hover:text-slate-200">
              <Icon name="HelpCircle" size={12} /> Why selected
            </button>
            <a href={email.webUrl || '#'} target={email.webUrl ? '_blank' : undefined} rel={email.webUrl ? 'noreferrer' : undefined} onClick={(e) => { if (!email.webUrl) e.preventDefault(); markEmailRead(email) }}
              className="ml-auto inline-flex items-center gap-1 text-[11px] font-medium text-indigo-600 hover:underline dark:text-indigo-300">
              Open <Icon name="ExternalLink" size={11} />
            </a>
          </div>

          {showWhy && (
            <p className="mt-2 rounded-lg bg-slate-50 px-2.5 py-1.5 text-[11px] text-slate-500 dark:bg-slate-800 dark:text-slate-400">
              {email.reason}
            </p>
          )}

          <div className="mt-2 flex items-center gap-1 border-t border-slate-100 pt-2 dark:border-slate-800">
            <span className="mr-1 text-[10px] uppercase tracking-wide text-slate-400">Feedback</span>
            {FEEDBACK.map(f => (
              <button
                key={f.key}
                onClick={() => setEmailFeedbackFor(email.id, f.key)}
                aria-pressed={email.feedback === f.key}
                aria-label={f.label}
                title={f.label}
                className={cn('interactive-button inline-flex h-7 items-center gap-1 rounded-md px-2 text-[11px] font-medium focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/50',
                  email.feedback === f.key
                    ? 'bg-indigo-600 text-white'
                    : 'text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800')}
              >
                <Icon name={f.icon} size={12} /> <span className="hidden sm:inline">{f.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </li>
  )
}

export function EmailList({ full = false }) {
  const { emails, loadEmails, focus, goTo, settings } = useApp()
  const [filter, setFilter] = useState('all')

  const all = emails.data || []
  const visibleCats = settings.emailCategories
  let list = all.filter(e => visibleCats.includes(e.category))
  if (filter === 'gmail' || filter === 'qub') list = list.filter(e => e.provider === filter)
  else if (filter !== 'all') list = list.filter(e => e.category === filter)
  const shown = full ? list : list.slice(0, 4)

  return (
    <Card
      title="Relevant emails" icon="Mail" labelledBy="email-title"
      action={!full && <Button variant="ghost" size="sm" iconRight="ArrowRight" onClick={() => goTo('email')}>Open</Button>}
    >
      {full && (
        <div className="mb-3 flex flex-wrap gap-1.5">
          {['all', 'gmail', 'qub'].map(provider => (
            <Chip key={provider} active={filter === provider} onClick={() => setFilter(provider)}>
              {provider === 'all' ? `All (${all.length})` : `${EMAIL_PROVIDERS[provider].label} (${all.filter(email => email.provider === provider).length})`}
            </Chip>
          ))}
          <span className="mx-1 h-6 w-px bg-slate-200 dark:bg-slate-700" aria-hidden="true" />
          {EMAIL_CATEGORIES.filter(c => visibleCats.includes(c.id)).map(c => (
            <Chip key={c.id} active={filter === c.id} onClick={() => setFilter(c.id)}>{c.label}</Chip>
          ))}
        </div>
      )}
      {full && Object.entries(emails.providers || {}).filter(([, message]) => message).map(([provider, message]) => (
        <p key={provider} role="alert" className="mb-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-200">
          {EMAIL_PROVIDERS[provider]?.label || provider} unavailable: {message}
        </p>
      ))}
      <StateBoundary
        loading={emails.loading}
        error={emails.error}
        onRetry={loadEmails}
        empty={!emails.loading && !emails.error && shown.length === 0}
        emptyProps={{ icon: 'Inbox', title: 'Nothing here', message: 'No emails match this filter.' }}
      >
        <ul className="space-y-2">
          {shown.map(e => (
            <EmailItem key={e.id} email={e} focused={focus?.type === 'email' && focus.id === e.id} />
          ))}
        </ul>
      </StateBoundary>
    </Card>
  )
}
