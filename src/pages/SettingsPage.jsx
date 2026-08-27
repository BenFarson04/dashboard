import { useState } from 'react'
import { useApp } from '../context/AppContext'
import { PageShell } from './PageShell'
import { Icon } from '../components/ui/Icon'
import { Card, Toggle, Chip, Button, IconButton, Badge, Field, inputClass } from '../components/ui/primitives'
import { EMAIL_CATEGORIES, defaultSettings } from '../data/mockData'
import { RECOMMENDED_INTERESTS } from '../data/newsConfig'
import { cn } from '../utils'

const CARD_LABELS = {
  calendar: 'Calendar', email: 'Relevant emails', tasks: 'Tasks',
  news: 'News', weather: 'Weather', quicklinks: 'Quick links',
}

const CONN_LABEL = {
  not_configured: { tone: 'gray', label: 'Not configured' },
  mock: { tone: 'amber', label: 'Using mock data' },
  local: { tone: 'blue', label: 'Local (this device)' },
  connected: { tone: 'green', label: 'Connected' },
  error: { tone: 'red', label: 'Connection error' },
}

function SettingRow({ title, hint, children }) {
  return (
    <div className="flex items-center justify-between gap-4 py-2.5">
      <div className="min-w-0">
        <p className="text-sm font-medium text-slate-700 dark:text-slate-200">{title}</p>
        {hint && <p className="text-xs text-slate-500 dark:text-slate-400">{hint}</p>}
      </div>
      <div className="shrink-0">{children}</div>
    </div>
  )
}

function MailboxConnection({ label, email, connected, ready, configured = true, error, onConnect, onDisconnect, permission }) {
  const status = error ? 'Action needed' : connected ? 'Connected' : !configured ? 'Not configured' : ready ? 'Disconnected' : 'Loading'
  const errorMessage = typeof error === 'string' ? error : error?.message
  const errorCode = typeof error === 'string' ? 'auth_error' : error?.code
  return (
    <div className="rounded-lg border border-slate-100 px-3 py-2.5 dark:border-slate-800">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-medium text-slate-700 dark:text-slate-200">{label}</p>
          <p className="text-xs text-slate-500 dark:text-slate-400">{email || permission}</p>
        </div>
        <Badge tone={error ? 'red' : connected ? 'green' : 'gray'}>{status}</Badge>
      </div>
      <div className="mt-2 flex flex-wrap items-center gap-2">
        <Button size="sm" icon={connected ? 'RefreshCw' : 'Link2'} onClick={onConnect} disabled={!ready} aria-label={`${connected ? 'Reconnect' : 'Connect'} ${label}`}>
          {connected ? 'Reconnect' : 'Connect'}
        </Button>
        {connected && <Button size="sm" variant="ghost" icon="Unlink" onClick={onDisconnect} aria-label={`Disconnect ${label}`}>Disconnect</Button>}
        <span className="text-[11px] text-slate-400">{permission}</span>
      </div>
      {error && <p role="alert" className="mt-2 text-xs text-red-600 dark:text-red-400">{errorMessage} ({errorCode})</p>}
    </div>
  )
}


export function SettingsPage() {
  const { settings, setSettings, connectionStatus, emailAccounts, failRates, setFailRates, toggleTheme } = useApp()
  const interests = settings.interests || RECOMMENDED_INTERESTS.map(interest => ({ ...interest, active: true }))
  const [interestDraft, setInterestDraft] = useState('')
  const [interestSearch, setInterestSearch] = useState('')
  const [editingInterest, setEditingInterest] = useState(null)
  const [interestError, setInterestError] = useState('')

  const patch = (p) => setSettings(s => ({ ...s, ...p }))
  const patchCalendar = (p) => setSettings(s => ({ ...s, calendar: { ...s.calendar, ...p } }))
  const patchBriefing = (p) => setSettings(s => ({ ...s, briefing: { ...s.briefing, ...p } }))

  const toggleInList = (key, id) => setSettings(s => {
    const list = s[key]
    return { ...s, [key]: list.includes(id) ? list.filter(x => x !== id) : [...list, id] }
  })

  const saveInterest = () => {
    const label = interestDraft.trim().replace(/\s+/g, ' ')
    if (!label) { setInterestError('Enter an interest first.'); return }
    if (label.length > 60) { setInterestError('Keep interests to 60 characters or fewer.'); return }
    const duplicate = interests.some(interest => interest.id !== editingInterest && interest.label.toLowerCase() === label.toLowerCase())
    if (duplicate) { setInterestError('That interest is already in your list.'); return }
    setSettings(s => {
      const currentInterests = Array.isArray(s.interests) ? s.interests : interests
      return { ...s, interests: editingInterest
        ? currentInterests.map(interest => interest.id === editingInterest ? { ...interest, label, terms: interest.id.startsWith('custom-') ? [label] : interest.terms } : interest)
        : [...currentInterests, { id: `custom-${Date.now()}`, label, terms: [label], active: true }] }
    })
    setInterestDraft('')
    setEditingInterest(null)
    setInterestError('')
  }

  const updateInterest = (id, patch) => setSettings(s => ({ ...s, interests: s.interests.map(interest => interest.id === id ? { ...interest, ...patch } : interest) }))
  const removeInterest = id => setSettings(s => ({ ...s, interests: s.interests.filter(interest => interest.id !== id) }))
  const resetInterests = () => setSettings(s => ({ ...s, interests: RECOMMENDED_INTERESTS.map(interest => ({ ...interest, active: true })) }))
  const visibleInterests = interests.filter(interest => interest.label.toLowerCase().includes(interestSearch.trim().toLowerCase()))

  const toggleCardVisible = (id) => setSettings(s => ({ ...s, cards: { ...s.cards, visible: { ...s.cards.visible, [id]: !s.cards.visible[id] } } }))
  const moveCard = (id, dir) => setSettings(s => {
    const order = [...s.cards.order]
    const i = order.indexOf(id); const j = dir === 'up' ? i - 1 : i + 1
    if (j < 0 || j >= order.length) return s
    ;[order[i], order[j]] = [order[j], order[i]]
    return { ...s, cards: { ...s.cards, order } }
  })

  const resetAll = () => {
    if (!confirm('Reset all settings, tasks and quick links to defaults? This clears saved data on this device.')) return
    ['pd.settings', 'pd.tasks', 'pd.quicklinks', 'pd.emailFeedback', 'pd.emailRead', 'pd.savedNews', 'pd.dismissedNews', 'pd.newsFeedback'].forEach(k => localStorage.removeItem(k))
    location.reload()
  }

  const services = ['calendar', 'news', 'weather', 'tasks']

  return (
    <PageShell icon="Settings" title="Settings" description="Personalise the dashboard. Changes are saved to this browser.">
      <div className="grid gap-4 lg:grid-cols-2">

        {/* Profile / greeting */}
        <Card title="Profile & greeting" icon="User">
          <div className="space-y-3">
            <Field label="Display name" htmlFor="s-name">
              <input id="s-name" className={inputClass} value={settings.name} onChange={e => patch({ name: e.target.value })} />
            </Field>
            <SettingRow title="Time-based greeting" hint="“Good morning/afternoon/evening”.">
              <Toggle checked={settings.greetingStyle === 'time'} onChange={v => patch({ greetingStyle: v ? 'time' : 'fixed' })} label="Time-based greeting" />
            </SettingRow>
            {settings.greetingStyle === 'fixed' && (
              <Field label="Fixed greeting" htmlFor="s-greet">
                <input id="s-greet" className={inputClass} value={settings.fixedGreeting} onChange={e => patch({ fixedGreeting: e.target.value })} />
              </Field>
            )}
            <Field label="Location (weather)" htmlFor="s-loc" hint="Weather updates automatically when you change this.">
              <input id="s-loc" className={inputClass} value={settings.location} onChange={e => patch({ location: e.target.value })} />
            </Field>
          </div>
        </Card>

        {/* Appearance */}
        <Card title="Appearance" icon="Sun">
          <SettingRow title="Dark mode" hint="Switches the whole interface.">
            <Toggle checked={settings.theme === 'dark'} onChange={toggleTheme} label="Dark mode" />
          </SettingRow>
          <div className="mt-2 border-t border-slate-100 pt-2 dark:border-slate-800">
            <p className="mb-2 text-sm font-medium text-slate-700 dark:text-slate-200">Calendar display</p>
            <SettingRow title="24-hour time"><Toggle checked={settings.calendar.twentyFourHour} onChange={v => patchCalendar({ twentyFourHour: v })} label="24-hour time" /></SettingRow>
            <SettingRow title="Show weekends"><Toggle checked={settings.calendar.showWeekends} onChange={v => patchCalendar({ showWeekends: v })} label="Show weekends" /></SettingRow>
          </div>
        </Card>

        {/* News interests */}
        <Card title="News interests" icon="Newspaper">
          <p className="mb-2 text-xs text-slate-500 dark:text-slate-400">Interests are stored on this device and matched locally against the live article pool.</p>
          <div className="flex gap-2">
            <input
              className={inputClass}
              value={interestDraft}
              maxLength={60}
              placeholder="Add an interest"
              onChange={event => setInterestDraft(event.target.value)}
              onKeyDown={event => { if (event.key === 'Enter') saveInterest() }}
            />
            <Button type="button" icon={editingInterest ? 'Check' : 'Plus'} onClick={saveInterest}>{editingInterest ? 'Save' : 'Add'}</Button>
          </div>
          {interestError && <p role="alert" className="mt-1 text-xs text-red-600 dark:text-red-400">{interestError}</p>}
          <input
            className={`${inputClass} mt-2`}
            value={interestSearch}
            placeholder="Search interests"
            aria-label="Search interests"
            onChange={event => setInterestSearch(event.target.value)}
          />
          <div className="mt-3 space-y-1.5">
            {visibleInterests.map(interest => (
              <div key={interest.id} className="flex items-center gap-2 rounded-lg border border-slate-100 px-2.5 py-2 dark:border-slate-800">
                <Toggle checked={interest.active} onChange={active => updateInterest(interest.id, { active })} label={`Use ${interest.label}`} />
                <span className="flex-1 text-sm text-slate-700 dark:text-slate-200">{interest.label}</span>
                <IconButton label={`Edit ${interest.label}`} icon="Pencil" onClick={() => { setEditingInterest(interest.id); setInterestDraft(interest.label) }} />
                <IconButton label={`Remove ${interest.label}`} icon="Trash2" onClick={() => removeInterest(interest.id)} />
              </div>
            ))}
            {visibleInterests.length === 0 && <p className="py-2 text-xs text-slate-500 dark:text-slate-400">No interests found.</p>}
          </div>
          <div className="mt-3 flex items-center justify-between gap-3">
            <p className="text-[11px] text-slate-400">Use several interests at once; matching is deterministic and transparent.</p>
            <Button type="button" variant="ghost" size="sm" onClick={resetInterests}>Reset recommended</Button>
          </div>
        </Card>

        {/* Email categories */}
        <Card title="Email filtering categories" icon="Filter">
          <p className="mb-2 text-xs text-slate-500 dark:text-slate-400">Which categories appear in the relevant-emails shortlist.</p>
          <div className="flex flex-wrap gap-1.5">
            {EMAIL_CATEGORIES.map(c => (
              <Chip key={c.id} active={settings.emailCategories.includes(c.id)} onClick={() => toggleInList('emailCategories', c.id)}>{c.label}</Chip>
            ))}
          </div>
        </Card>

        {/* Daily briefing */}
        <Card title="Daily briefing" icon="Sparkles">
          <p className="mb-2 text-xs text-slate-500 dark:text-slate-400">Choose what the briefing considers.</p>
          <SettingRow title="Include calendar"><Toggle checked={settings.briefing.includeCalendar} onChange={v => patchBriefing({ includeCalendar: v })} label="Include calendar" /></SettingRow>
          <SettingRow title="Include email"><Toggle checked={settings.briefing.includeEmail} onChange={v => patchBriefing({ includeEmail: v })} label="Include email" /></SettingRow>
          <SettingRow title="Include tasks"><Toggle checked={settings.briefing.includeTasks} onChange={v => patchBriefing({ includeTasks: v })} label="Include tasks" /></SettingRow>
          <SettingRow title="Include weather"><Toggle checked={settings.briefing.includeWeather} onChange={v => patchBriefing({ includeWeather: v })} label="Include weather" /></SettingRow>
          <SettingRow
            title="Include news"
            hint="Adds one relevant headline to the daily briefing."
          >
            <Toggle
              checked={settings.briefing.includeNews ?? true}
              onChange={v => patchBriefing({ includeNews: v })}
              label="Include news"
            />
          </SettingRow>
        </Card>

        {/* Cards visibility + order */}
        <Card title="Dashboard cards" icon="LayoutDashboard">
          <p className="mb-2 text-xs text-slate-500 dark:text-slate-400">Toggle visibility and reorder your dashboard.</p>
          <ul className="space-y-1.5">
            {settings.cards.order.map((id, i) => (
              <li key={id} className="flex items-center gap-2 rounded-lg border border-slate-100 px-2 py-1.5 dark:border-slate-800">
                <Icon name="GripVertical" size={15} className="text-slate-300" />
                <span className="flex-1 text-sm text-slate-700 dark:text-slate-200">{CARD_LABELS[id]}</span>
                <IconButton label="Move up" icon="ChevronUp" className="h-7 w-7" disabled={i === 0} onClick={() => moveCard(id, 'up')} />
                <IconButton label="Move down" icon="ChevronDown" className="h-7 w-7" disabled={i === settings.cards.order.length - 1} onClick={() => moveCard(id, 'down')} />
                <Toggle checked={settings.cards.visible[id]} onChange={() => toggleCardVisible(id)} label={`Show ${CARD_LABELS[id]}`} />
              </li>
            ))}
          </ul>
        </Card>

        {/* Connections */}
        <Card title="Connected services" icon="Link2">
          <p className="mb-2 text-xs text-slate-500 dark:text-slate-400">Each mailbox has independent authentication and connection controls.</p>
          <div className="mb-3 space-y-2">
            <MailboxConnection
              label="Gmail"
              email={emailAccounts.gmail.account?.email}
              connected={emailAccounts.gmail.connected}
              ready={emailAccounts.gmail.ready}
              error={emailAccounts.gmail.error}
              onConnect={emailAccounts.gmail.connect}
              onDisconnect={emailAccounts.gmail.disconnect}
              permission="Read-only Gmail access."
            />
            <MailboxConnection
              label="QUB University Email"
              email={emailAccounts.qub.accountEmail}
              connected={emailAccounts.qub.isConnected}
              ready={emailAccounts.qub.ready}
              configured={emailAccounts.qub.configurationReady}
              error={emailAccounts.qub.error}
              onConnect={emailAccounts.qub.connect}
              onDisconnect={emailAccounts.qub.disconnect}
              permission="Read-only Microsoft Graph mailbox access."
            />
          </div>
          <ul className="space-y-1.5">
            {services.map(key => {
              const status = CONN_LABEL[connectionStatus[key]] || CONN_LABEL.not_configured
              return (
                <li key={key} className="flex items-center justify-between gap-2 rounded-lg border border-slate-100 px-3 py-2 dark:border-slate-800">
                  <span className="text-sm capitalize text-slate-700 dark:text-slate-200">{key}</span>
                  <Badge tone={status.tone}>{status.label}</Badge>
                </li>
              )
            })}
          </ul>
          <p className="mt-2 text-[11px] text-slate-400">QUB access may require administrator approval from the university. This dashboard is not affiliated with Queen's University Belfast.</p>
        </Card>

        {/* Data & privacy */}
        <Card title="Data & privacy" icon="Info">
          <ul className="mb-3 space-y-1.5 text-xs text-slate-500 dark:text-slate-400">
            <li className="flex gap-2"><Icon name="Check" size={14} className="mt-0.5 text-emerald-500" /> Live Gmail and QUB message metadata is held in memory for this session; task, settings and feedback preferences remain local.</li>
            <li className="flex gap-2"><Icon name="Check" size={14} className="mt-0.5 text-emerald-500" /> No email or calendar content is sent to any AI service.</li>
            <li className="flex gap-2"><Icon name="Check" size={14} className="mt-0.5 text-emerald-500" /> OAuth tokens are handled by the provider libraries; this app never reads or stores refresh tokens.</li>
          </ul>
          <div className="mb-3 rounded-lg border border-slate-100 p-3 dark:border-slate-800">
            <p className="mb-2 text-sm font-medium text-slate-700 dark:text-slate-200">Demo error states</p>
            <p className="mb-2 text-[11px] text-slate-400">Force a service to fail so you can see the error UI.</p>
            <div className="flex flex-wrap gap-1.5">
              {['calendar', 'email', 'news', 'weather'].map(k => (
                <Chip key={k} active={failRates[k] > 0} onClick={() => setFailRates(r => ({ ...r, [k]: r[k] > 0 ? 0 : 1 }))}>
                  {k} {failRates[k] > 0 ? '✕' : ''}
                </Chip>
              ))}
            </div>
          </div>
          <Button variant="danger" size="sm" icon="Trash2" onClick={resetAll}>Reset all data to defaults</Button>
        </Card>
      </div>
    </PageShell>
  )
}
