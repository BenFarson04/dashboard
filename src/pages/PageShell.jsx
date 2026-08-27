import { Icon } from '../components/ui/Icon'

// Simple titled wrapper for the detail pages.
export function PageShell({ icon, title, description, children, actions }) {
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-sm shadow-indigo-600/20">
            <Icon name={icon} size={20} />
          </div>
          <div>
            <h1 className="text-xl font-semibold tracking-tight text-[var(--text-primary)]">{title}</h1>
            {description && <p className="text-sm text-slate-500 dark:text-slate-400">{description}</p>}
          </div>
        </div>
        {actions}
      </div>
      {children}
    </div>
  )
}
