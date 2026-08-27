import { useEffect, useRef } from 'react'
import { cn } from '../../utils'
import { Icon } from './Icon'

// -----------------------------------------------------------------------------
// Reusable, presentation-only building blocks for the command-centre surface.
// -----------------------------------------------------------------------------

export function Card({ title, icon, action, children, className, bodyClassName, as: Tag = 'section', labelledBy }) {
  return (
    <Tag
      aria-labelledby={labelledBy}
      className={cn(
        'interactive-card rounded-[var(--radius-card)] border border-[var(--border-subtle)] bg-[var(--surface)]',
        className,
      )}
    >
      {(title || action) && (
        <header className="flex items-center justify-between gap-3 border-b border-[var(--border-subtle)] px-5 py-4">
          <div className="flex items-center gap-2 min-w-0">
            {icon && <Icon name={icon} size={18} className="shrink-0 text-indigo-500" />}
            {title && <h2 id={labelledBy} className="truncate text-[15px] font-semibold text-[var(--text-primary)]">{title}</h2>}
          </div>
          {action && <div className="shrink-0">{action}</div>}
        </header>
      )}
      <div className={cn('p-5', bodyClassName)}>{children}</div>
    </Tag>
  )
}

const BTN = {
  primary: 'bg-indigo-600 text-white hover:bg-indigo-500 focus-visible:outline-indigo-600',
  subtle:  'bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700',
  ghost:   'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800',
  danger:  'text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/40',
}

export function Button({ variant = 'subtle', size = 'md', icon, iconRight, children, className, ...props }) {
  const sizes = size === 'sm' ? 'px-2.5 py-1.5 text-xs' : 'px-3 py-2 text-sm'
  return (
    <button
      className={cn(
        'interactive-button inline-flex items-center justify-center gap-1.5 rounded-[var(--radius-control)] font-medium',
        'focus:outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 disabled:pointer-events-none disabled:opacity-50',
        sizes, BTN[variant], className,
      )}
      {...props}
    >
      {icon && <Icon name={icon} size={size === 'sm' ? 14 : 16} />}
      {children}
      {iconRight && <Icon name={iconRight} size={size === 'sm' ? 14 : 16} />}
    </button>
  )
}

export function IconButton({ label, icon, active, className, ...props }) {
  return (
    <button
      aria-label={label}
      title={label}
      className={cn(
        'interactive-button inline-flex h-10 w-10 items-center justify-center rounded-[var(--radius-control)] text-slate-500',
        'hover:bg-slate-100 hover:text-slate-700 focus:outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600',
        'dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-200',
        active && 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200',
        className,
      )}
      {...props}
    >
      <Icon name={icon} size={18} />
    </button>
  )
}

const TONES = {
  gray:   'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300',
  blue:   'bg-blue-50 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300',
  green:  'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300',
  amber:  'bg-amber-50 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300',
  red:    'bg-red-50 text-red-700 dark:bg-red-950/50 dark:text-red-300',
  indigo: 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950/50 dark:text-indigo-300',
}

export function Badge({ tone = 'gray', icon, children, className }) {
  return (
    <span className={cn('inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium', TONES[tone], className)}>
      {icon && <Icon name={icon} size={11} />}
      {children}
    </span>
  )
}

export function Chip({ active, children, className, ...props }) {
  return (
    <button
      aria-pressed={active}
      className={cn(
        'interactive-button rounded-full border px-3 py-1 text-xs font-medium focus:outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600',
        active
          ? 'border-indigo-600 bg-indigo-600 text-white'
          : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800',
        className,
      )}
      {...props}
    >
      {children}
    </button>
  )
}

export function Toggle({ checked, onChange, label, id }) {
  return (
    <button
      id={id}
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className={cn(
        'interactive-button relative inline-flex h-6 w-11 shrink-0 items-center rounded-full focus:outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600',
        checked ? 'bg-indigo-600' : 'bg-slate-300 dark:bg-slate-700',
      )}
    >
      <span className={cn('inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform duration-150', checked ? 'translate-x-5' : 'translate-x-0.5')} />
    </button>
  )
}

export function Spinner({ className }) {
  return <Icon name="RefreshCw" className={cn('animate-spin text-slate-400', className)} />
}

export function Skeleton({ className }) {
  return <div className={cn('skeleton-pulse rounded-md bg-slate-100 dark:bg-slate-800', className)} />
}

export function EmptyState({ icon = 'Inbox', title, message, action }) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 rounded-xl bg-[var(--surface-inset)] px-4 py-8 text-center">
      <div className="flex h-11 w-11 items-center justify-center rounded-full bg-slate-100 text-slate-400 dark:bg-slate-800">
        <Icon name={icon} size={20} />
      </div>
      <p className="text-sm font-medium text-slate-700 dark:text-slate-200">{title}</p>
      {message && <p className="max-w-xs text-xs text-slate-500 dark:text-slate-400">{message}</p>}
      {action && <div className="mt-1">{action}</div>}
    </div>
  )
}

export function ErrorState({ message, onRetry }) {
  return (
    <div role="alert" className="flex flex-col items-center justify-center gap-2 py-8 text-center">
      <div className="flex h-11 w-11 items-center justify-center rounded-full bg-red-50 text-red-500 dark:bg-red-950/50">
        <Icon name="AlertTriangle" size={20} />
      </div>
      <p className="text-sm font-medium text-slate-700 dark:text-slate-200">Something went wrong</p>
      <p className="max-w-xs text-xs text-slate-500 dark:text-slate-400">{message}</p>
      {onRetry && <Button variant="subtle" size="sm" icon="RefreshCw" onClick={onRetry} className="mt-1">Try again</Button>}
    </div>
  )
}

// Declarative wrapper that handles the loading / error / empty / ready states.
export function StateBoundary({ loading, error, empty, onRetry, skeleton, emptyProps, children }) {
  if (loading) return skeleton || <div className="space-y-2 py-2">{[0, 1, 2].map(i => <Skeleton key={i} className="h-12 w-full" />)}</div>
  if (error) return <ErrorState message={error} onRetry={onRetry} />
  if (empty) return <EmptyState {...emptyProps} />
  return children
}

export function Modal({ open, onClose, title, children, footer, labelledBy = 'modal-title' }) {
  const ref = useRef(null)
  useEffect(() => {
    if (!open) return
    const onKey = (e) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', onKey)
    ref.current?.focus()
    return () => document.removeEventListener('keydown', onKey)
  }, [open, onClose])

  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={onClose} aria-hidden="true" />
      <div
        ref={ref}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-labelledby={labelledBy}
        className="interactive-card relative z-10 w-full max-w-lg rounded-[var(--radius-card)] border border-[var(--border-subtle)] bg-[var(--surface-raised)] shadow-[var(--shadow-float)] outline-none"
      >
        <header className="flex items-center justify-between border-b border-[var(--border-subtle)] px-5 py-4">
          <h2 id={labelledBy} className="text-sm font-semibold text-slate-800 dark:text-slate-100">{title}</h2>
          <IconButton label="Close dialog" icon="X" onClick={onClose} />
        </header>
        <div className="max-h-[70vh] overflow-y-auto px-5 py-4">{children}</div>
        {footer && <footer className="flex justify-end gap-2 border-t border-slate-100 px-5 py-3 dark:border-slate-800">{footer}</footer>}
      </div>
    </div>
  )
}

// Shared form controls (used across Settings / task + link editors).
export function Field({ label, children, hint, htmlFor }) {
  return (
    <div className="space-y-1">
      {label && <label htmlFor={htmlFor} className="block text-xs font-medium text-slate-600 dark:text-slate-300">{label}</label>}
      {children}
      {hint && <p className="text-[11px] text-slate-400">{hint}</p>}
    </div>
  )
}

export const inputClass = cn(
  'w-full rounded-[var(--radius-control)] border border-[var(--border-subtle)] bg-[var(--surface-inset)] px-3 py-2.5 text-sm text-[var(--text-primary)] placeholder:text-slate-400 transition-colors duration-150',
  'focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20',
)
