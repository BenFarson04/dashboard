import { useMemo, useState } from 'react'
import { useApp } from '../../context/AppContext'
import { Icon } from '../ui/Icon'
import { Card, Badge, Button, IconButton, Modal, Field, inputClass, EmptyState } from '../ui/primitives'
import { cn, fmtDayShort, fmtTime, isToday, isPast } from '../../utils'

const PRIORITY = {
  high:   { tone: 'red', label: 'High' },
  medium: { tone: 'amber', label: 'Medium' },
  low:    { tone: 'gray', label: 'Low' },
}
const CATEGORIES = ['Work', 'University', 'Finance', 'Travel', 'Personal', 'Projects']

function classify(t) {
  if (t.completed) return 'completed'
  if (t.due && isPast(t.due)) return 'overdue'
  if (t.due && isToday(t.due)) return 'today'
  return 'upcoming'
}

function TaskRow({ task, onEdit }) {
  const { toggleTask, deleteTask } = useApp()
  const overdue = !task.completed && task.due && isPast(task.due)
  return (
    <li className="group flex items-start gap-3 rounded-xl border border-slate-100 p-2.5 hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-800/60">
      <button
        onClick={() => toggleTask(task.id)}
        role="checkbox"
        aria-checked={task.completed}
        aria-label={task.completed ? 'Mark task incomplete' : 'Mark task complete'}
        className={cn('mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md border',
          task.completed ? 'border-indigo-600 bg-indigo-600 text-white' : 'border-slate-300 text-transparent hover:border-indigo-500 dark:border-slate-600')}
      >
        <Icon name="Check" size={13} />
      </button>
      <div className="min-w-0 flex-1">
        <p className={cn('text-sm', task.completed ? 'text-slate-400 line-through' : 'text-slate-800 dark:text-slate-100')}>{task.title}</p>
        <div className="mt-1 flex flex-wrap items-center gap-1.5">
          <Badge tone={PRIORITY[task.priority]?.tone}>{PRIORITY[task.priority]?.label}</Badge>
          <Badge tone="gray">{task.category}</Badge>
          {task.due && (
            <span className={cn('inline-flex items-center gap-1 text-[11px]', overdue ? 'font-medium text-red-600 dark:text-red-400' : 'text-slate-400')}>
              <Icon name="Clock" size={11} /> {fmtDayShort(task.due)} {fmtTime(task.due)}
            </span>
          )}
        </div>
      </div>
      <div className="flex shrink-0 gap-0.5 opacity-0 transition-opacity group-hover:opacity-100 focus-within:opacity-100">
        <IconButton label="Edit task" icon="Pencil" onClick={() => onEdit(task)} className="h-7 w-7" />
        <IconButton label="Delete task" icon="Trash2" onClick={() => deleteTask(task.id)} className="h-7 w-7" />
      </div>
    </li>
  )
}

function TaskEditor({ open, onClose, task }) {
  const { addTask, updateTask } = useApp()
  const editing = !!task
  const [form, setForm] = useState(() => ({
    title: task?.title || '', priority: task?.priority || 'medium',
    category: task?.category || 'Personal',
    due: task?.due ? new Date(task.due).toISOString().slice(0, 16) : '',
  }))
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const save = () => {
    if (!form.title.trim()) return
    const payload = { title: form.title.trim(), priority: form.priority, category: form.category, due: form.due ? new Date(form.due).toISOString() : null }
    if (editing) updateTask(task.id, payload); else addTask(payload)
    onClose()
  }

  return (
    <Modal open={open} onClose={onClose} title={editing ? 'Edit task' : 'Add task'}
      footer={<><Button variant="ghost" size="sm" onClick={onClose}>Cancel</Button><Button variant="primary" size="sm" icon="Check" onClick={save}>{editing ? 'Save' : 'Add task'}</Button></>}>
      <div className="space-y-3">
        <Field label="Title" htmlFor="t-title">
          <input id="t-title" className={inputClass} value={form.title} autoFocus
            onChange={e => set('title', e.target.value)} onKeyDown={e => e.key === 'Enter' && save()} placeholder="What needs doing?" />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Priority" htmlFor="t-pri">
            <select id="t-pri" className={inputClass} value={form.priority} onChange={e => set('priority', e.target.value)}>
              <option value="high">High</option><option value="medium">Medium</option><option value="low">Low</option>
            </select>
          </Field>
          <Field label="Category" htmlFor="t-cat">
            <select id="t-cat" className={inputClass} value={form.category} onChange={e => set('category', e.target.value)}>
              {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </Field>
        </div>
        <Field label="Due date & time" htmlFor="t-due" hint="Leave empty for no due date.">
          <input id="t-due" type="datetime-local" className={inputClass} value={form.due} onChange={e => set('due', e.target.value)} />
        </Field>
      </div>
    </Modal>
  )
}

export function TasksPanel({ full = false }) {
  const { tasks, goTo, focus } = useApp()
  const [tab, setTab] = useState('today')
  const [editing, setEditing] = useState(null)   // task object
  const [adding, setAdding] = useState(false)

  const groups = useMemo(() => {
    const g = { today: [], upcoming: [], overdue: [], completed: [] }
    tasks.forEach(t => g[classify(t)].push(t))
    return g
  }, [tasks])

  const TABS = [
    { id: 'today', label: 'Today', count: groups.today.length },
    { id: 'upcoming', label: 'Upcoming', count: groups.upcoming.length },
    { id: 'overdue', label: 'Overdue', count: groups.overdue.length },
    { id: 'completed', label: 'Completed', count: groups.completed.length },
  ]
  const list = groups[tab]

  return (
    <Card title="Tasks" icon="CheckSquare" labelledBy="tasks-title"
      action={<Button variant="subtle" size="sm" icon="Plus" onClick={() => setAdding(true)}>Add</Button>}>
      <div className="mb-3 flex flex-wrap gap-1" role="tablist" aria-label="Task groups">
        {TABS.map(t => (
          <button key={t.id} role="tab" aria-selected={tab === t.id} onClick={() => setTab(t.id)}
            className={cn('inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium',
              tab === t.id ? 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-100' : 'text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800/60')}>
            {t.label}
            <span className={cn('rounded-full px-1.5 text-[10px]', t.id === 'overdue' && t.count > 0 ? 'bg-red-100 text-red-700 dark:bg-red-950/60 dark:text-red-300' : 'bg-slate-200 text-slate-600 dark:bg-slate-700 dark:text-slate-300')}>{t.count}</span>
          </button>
        ))}
      </div>

      {list.length === 0 ? (
        <EmptyState icon="CheckSquare" title={`No ${tab} tasks`}
          message={tab === 'today' ? 'Nothing due today.' : 'You’re all caught up here.'}
          action={<Button variant="subtle" size="sm" icon="Plus" onClick={() => setAdding(true)}>Add a task</Button>} />
      ) : (
        <ul className="space-y-2">
          {(full ? list : list.slice(0, 5)).map(t => (
            <TaskRow key={t.id} task={t} onEdit={setEditing} />
          ))}
        </ul>
      )}

      {!full && list.length > 5 && (
        <button onClick={() => goTo('tasks')} className="mt-2 text-xs font-medium text-indigo-600 hover:underline dark:text-indigo-300">
          View all {list.length} →
        </button>
      )}

      {/* key forces a remount so the editor's form re-initialises for each open/task */}
      {adding && <TaskEditor key="add" open onClose={() => setAdding(false)} task={null} />}
      {editing && <TaskEditor key={editing.id} open onClose={() => setEditing(null)} task={editing} />}
    </Card>
  )
}
