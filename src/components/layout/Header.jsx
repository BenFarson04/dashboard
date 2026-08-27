import { useMemo, useRef, useState } from 'react'
import { useApp } from '../../context/AppContext'
import { Icon } from '../ui/Icon'
import { IconButton } from '../ui/primitives'
import { cn, fmtDayLong, greetingFor } from '../../utils'

// Command bar: search across pages, tasks, emails, news and quick links, then jump.
function CommandBar() {
  const { goTo, tasks, emails, news, quickLinks, settings } = useApp()
  const [q, setQ] = useState('')
  const [open, setOpen] = useState(false)
  const [active, setActive] = useState(0)
  const boxRef = useRef(null)

  const results = useMemo(() => {
    const term = q.trim().toLowerCase()
    const pages = [
      { type: 'page', id: 'dashboard', label: 'Dashboard', icon: 'LayoutDashboard' },
      { type: 'page', id: 'calendar', label: 'Calendar', icon: 'Calendar' },
      { type: 'page', id: 'email', label: 'Email', icon: 'Mail' },
      { type: 'page', id: 'tasks', label: 'Tasks', icon: 'CheckSquare' },
      { type: 'page', id: 'news', label: 'News', icon: 'Newspaper' },
      { type: 'page', id: 'settings', label: 'Settings', icon: 'Settings' },
    ]
    if (!term) return pages
    const match = (s) => s.toLowerCase().includes(term)
    return [
      ...pages.filter(p => match(p.label)),
      ...tasks.filter(t => match(t.title)).slice(0, 4).map(t => ({ type: 'task', id: t.id, label: t.title, icon: 'CheckSquare', page: 'tasks' })),
      ...(emails.data || []).filter(e => match(e.subject) || match(e.sender)).slice(0, 4).map(e => ({ type: 'email', id: e.id, label: `${e.sender}: ${e.subject}`, icon: 'Mail', page: 'email' })),
      ...(news.data || []).filter(n => match(n.headline)).slice(0, 3).map(n => ({ type: 'news', id: n.id, label: n.headline, icon: 'Newspaper', page: 'news' })),
      ...quickLinks.filter(l => match(l.label)).slice(0, 3).map(l => ({ type: 'link', id: l.id, label: l.label, icon: 'Link2', url: l.url })),
    ].slice(0, 10)
  }, [q, tasks, emails.data, news.data, quickLinks])

  const choose = (r) => {
    if (!r) return
    if (r.type === 'link' && r.url) { window.open(r.url, '_blank', 'noopener'); }
    else goTo(r.page || r.id, r.type === 'page' ? null : { type: r.type, id: r.id })
    setQ(''); setOpen(false)
  }

  const onKeyDown = (e) => {
    if (e.key === 'ArrowDown') { e.preventDefault(); setActive(a => Math.min(a + 1, results.length - 1)) }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setActive(a => Math.max(a - 1, 0)) }
    else if (e.key === 'Enter') { e.preventDefault(); choose(results[active]) }
    else if (e.key === 'Escape') { setOpen(false) }
  }

  return (
    <div ref={boxRef} className="relative w-full max-w-md">
      <label htmlFor="cmd" className="sr-only">Search or jump to a page</label>
      <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 focus-within:border-indigo-500 focus-within:ring-2 focus-within:ring-indigo-500/20 dark:border-slate-700 dark:bg-slate-800">
        <Icon name="Search" size={16} className="text-slate-400" />
        <input
          id="cmd"
          type="text"
          value={q}
          placeholder="Search or jump to…"
          onChange={(e) => { setQ(e.target.value); setOpen(true); setActive(0) }}
          onFocus={() => setOpen(true)}
          onBlur={() => setTimeout(() => setOpen(false), 150)}
          onKeyDown={onKeyDown}
          role="combobox"
          aria-expanded={open}
          aria-controls="cmd-results"
          aria-autocomplete="list"
          className="w-full bg-transparent text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none dark:text-slate-200"
        />
      </div>
      {open && results.length > 0 && (
        <ul id="cmd-results" role="listbox" className="absolute z-30 mt-1 max-h-80 w-full overflow-y-auto rounded-lg border border-slate-200 bg-white p-1 shadow-lg dark:border-slate-700 dark:bg-slate-900">
          {results.map((r, i) => (
            <li key={r.type + r.id} role="option" aria-selected={i === active}>
              <button
                onMouseDown={(e) => { e.preventDefault(); choose(r) }}
                onMouseEnter={() => setActive(i)}
                className={cn('interactive-button flex w-full items-center gap-2 rounded-md px-2.5 py-2 text-left text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/50', i === active ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950/50 dark:text-indigo-200' : 'text-slate-600 dark:text-slate-300')}
              >
                <Icon name={r.icon} size={15} className="shrink-0 text-slate-400" />
                <span className="truncate">{r.label}</span>
                <span className="ml-auto shrink-0 text-[10px] uppercase tracking-wide text-slate-400">{r.type}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

// Google sign-in / sign-out control.
function AuthButton() {
  const { emailAccounts } = useApp()
  const { ready, connected: isSignedIn, account, connect: signIn, disconnect: signOut } = emailAccounts.gmail
  if (!ready) return null
  return isSignedIn ? (
    <button
      onClick={signOut}
      title={`Signed in as ${account?.username} — click to sign out`}
      className="interactive-button hidden items-center gap-1.5 rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/50 sm:inline-flex dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
    >
      <Icon name="User" size={14} />
      Sign out
    </button>
  ) : (
    <button
      onClick={signIn}
      className="interactive-button inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-2.5 py-1.5 text-xs font-medium text-white hover:bg-indigo-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/50"
    >
      <Icon name="User" size={14} />
      <span className="hidden sm:inline">Sign in with Google</span>
      <span className="sm:hidden">Sign in</span>
    </button>
  )
}

export function Header() {
  const { settings, toggleTheme, refreshAll, setMobileNavOpen, goTo, calendar } = useApp()
  const [spin, setSpin] = useState(false)
  const dark = settings.theme === 'dark'
  const greeting = settings.greetingStyle === 'fixed' ? settings.fixedGreeting : greetingFor()

  const doRefresh = () => { setSpin(true); refreshAll(); setTimeout(() => setSpin(false), 700) }

  return (
    <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/80 backdrop-blur dark:border-slate-800 dark:bg-slate-900/80">
      <div className="flex items-center gap-3 px-4 py-2.5">
        <IconButton label="Open navigation" icon="Menu" className="md:hidden" onClick={() => setMobileNavOpen(true)} />

        <div className="hidden min-w-0 sm:block">
          <p className="truncate text-sm font-semibold text-slate-800 dark:text-slate-100">
            {greeting}, {settings.name}
          </p>
          <p className="truncate text-xs text-slate-500 dark:text-slate-400">{fmtDayLong()}</p>
        </div>

        <div className="mx-auto flex-1 px-2 sm:px-4">
          <CommandBar />
        </div>

        <div className="flex items-center gap-1">
          <AuthButton />
          <IconButton label="Refresh data" icon="RefreshCw" onClick={doRefresh} className={spin ? 'animate-spin' : ''} />
          <IconButton label={dark ? 'Switch to light mode' : 'Switch to dark mode'} icon={dark ? 'Sun' : 'Moon'} onClick={toggleTheme} />
          <IconButton label="Settings" icon="Settings" onClick={() => goTo('settings')} />
          <button
            onClick={() => goTo('settings')}
            aria-label="Profile and settings"
            className="interactive-button ml-1 flex h-8 w-8 items-center justify-center rounded-full bg-indigo-600 text-xs font-semibold text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/50"
          >
            {settings.name?.[0]?.toUpperCase() || 'U'}
          </button>
        </div>
      </div>
    </header>
  )
}