import { useApp } from '../../context/AppContext'
import { Icon } from '../ui/Icon'
import { cn } from '../../utils'

const NAV = [
  { id: 'dashboard', label: 'Dashboard', icon: 'LayoutDashboard' },
  { id: 'calendar',  label: 'Calendar',  icon: 'Calendar' },
  { id: 'email',     label: 'Email',     icon: 'Mail' },
  { id: 'tasks',     label: 'Tasks',     icon: 'CheckSquare' },
  { id: 'news',      label: 'News',      icon: 'Newspaper' },
  { id: 'settings',  label: 'Settings',  icon: 'Settings' },
]

function NavList({ collapsed }) {
  const { page, goTo } = useApp()
  return (
    <nav aria-label="Primary" className="flex-1 space-y-1 px-2 py-3">
      {NAV.map(item => {
        const active = page === item.id
        return (
          <button
            key={item.id}
            onClick={() => goTo(item.id)}
            aria-current={active ? 'page' : undefined}
            title={collapsed ? item.label : undefined}
            className={cn(
              'flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors focus:outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600',
              collapsed && 'justify-center px-0',
              active
                ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950/50 dark:text-indigo-300'
                : 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800',
            )}
          >
            <Icon name={item.icon} size={18} className="shrink-0" />
            {!collapsed && <span>{item.label}</span>}
          </button>
        )
      })}
    </nav>
  )
}

function Brand({ collapsed }) {
  return (
    <div className={cn('flex h-14 items-center gap-2 border-b border-slate-100 px-4 dark:border-slate-800', collapsed && 'justify-center px-0')}>
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-indigo-600 text-white">
        <Icon name="Sparkles" size={18} />
      </div>
      {!collapsed && <span className="text-sm font-semibold text-slate-800 dark:text-slate-100">Command Centre</span>}
    </div>
  )
}

export function Sidebar() {
  const { sidebarOpen, setSidebarOpen, mobileNavOpen, setMobileNavOpen } = useApp()
  const collapsed = !sidebarOpen

  return (
    <>
      {/* Desktop sidebar */}
      <aside
        className={cn(
          'hidden shrink-0 flex-col border-r border-slate-200 bg-white transition-[width] duration-200 md:flex dark:border-slate-800 dark:bg-slate-900',
          collapsed ? 'w-[68px]' : 'w-60',
        )}
      >
        <Brand collapsed={collapsed} />
        <NavList collapsed={collapsed} />
        <div className="border-t border-slate-100 p-2 dark:border-slate-800">
          <button
            onClick={() => setSidebarOpen(o => !o)}
            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            className={cn('flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800', collapsed && 'justify-center px-0')}
          >
            <Icon name={collapsed ? 'ChevronRight' : 'ChevronLeft'} size={18} />
            {!collapsed && <span>Collapse</span>}
          </button>
        </div>
      </aside>

      {/* Mobile drawer */}
      {mobileNavOpen && (
        <div className="fixed inset-0 z-40 md:hidden">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setMobileNavOpen(false)} aria-hidden="true" />
          <aside className="relative z-10 flex h-full w-64 flex-col border-r border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
            <Brand collapsed={false} />
            <NavList collapsed={false} />
          </aside>
        </div>
      )}
    </>
  )
}
