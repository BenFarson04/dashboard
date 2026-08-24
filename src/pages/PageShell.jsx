import { Icon } from '../components/ui/Icon'

// Simple titled wrapper for the detail pages.
export function PageShell({ icon, title, description, children, actions }) {
  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-indigo-600 shadow-sm dark:bg-slate-900">
            <Icon name={icon} size={20} />
          </div>
          <div>
            <h1 className="text-lg font-semibold text-slate-800 dark:text-slate-100">{title}</h1>
            {description && <p className="text-sm text-slate-500 dark:text-slate-400">{description}</p>}
          </div>
        </div>
        {actions}
      </div>
      {children}
    </div>
  )
}
