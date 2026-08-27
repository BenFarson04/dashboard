import { useState } from 'react'
import { useApp } from '../../context/AppContext'
import { Icon } from '../ui/Icon'
import { Card, Button, IconButton, Modal, Field, inputClass } from '../ui/primitives'

const GROUP_ICON = {
  University: 'GraduationCap', Email: 'Mail', Calendar: 'Calendar', Finance: 'PiggyBank',
  'Travel planning': 'Plane', Fitness: 'Dumbbell', 'Personal projects': 'Globe', Other: 'Link2',
}
const GROUPS = ['University', 'Email', 'Calendar', 'Finance', 'Travel planning', 'Fitness', 'Personal projects', 'Other']

const linkIcon = link => link.icon || GROUP_ICON[link.group] || 'Link2'

function LinkEditor({ open, onClose, link }) {
  const { addLink, updateLink } = useApp()
  const editing = !!link
  const [form, setForm] = useState(() => ({ label: link?.label || '', url: link?.url || 'https://', group: link?.group || 'Other' }))
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))
  const save = () => {
    if (!form.label.trim() || !form.url.trim()) return
    if (editing) updateLink(link.id, form); else addLink(form)
    onClose()
  }
  return (
    <Modal open={open} onClose={onClose} title={editing ? 'Edit link' : 'Add link'}
      footer={<><Button variant="ghost" size="sm" onClick={onClose}>Cancel</Button><Button variant="primary" size="sm" icon="Check" onClick={save}>{editing ? 'Save' : 'Add'}</Button></>}>
      <div className="space-y-3">
        <Field label="Label" htmlFor="l-label"><input id="l-label" className={inputClass} value={form.label} autoFocus onChange={e => set('label', e.target.value)} /></Field>
        <Field label="URL" htmlFor="l-url"><input id="l-url" type="url" className={inputClass} value={form.url} onChange={e => set('url', e.target.value)} /></Field>
        <Field label="Group" htmlFor="l-group">
          <select id="l-group" className={inputClass} value={form.group} onChange={e => set('group', e.target.value)}>
            {GROUPS.map(g => <option key={g} value={g}>{g}</option>)}
          </select>
        </Field>
      </div>
    </Modal>
  )
}

export function QuickLinks() {
  const { quickLinks, deleteLink, moveLink } = useApp()
  const [manage, setManage] = useState(false)
  const [editing, setEditing] = useState(null)
  const [adding, setAdding] = useState(false)

  return (
    <Card title="Quick links" icon="Link2" labelledBy="links-title"
      action={<div className="flex gap-1">
        <Button variant="ghost" size="sm" icon={manage ? 'Check' : 'Pencil'} onClick={() => setManage(m => !m)}>{manage ? 'Done' : 'Edit'}</Button>
        <Button variant="subtle" size="sm" icon="Plus" onClick={() => setAdding(true)}>Add</Button>
      </div>}>
      {quickLinks.length === 0 ? (
        <p className="py-4 text-center text-sm text-slate-500">No links yet — add your first one.</p>
      ) : !manage ? (
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          {quickLinks.map(l => (
            <a key={l.id} href={l.url} target="_blank" rel="noopener noreferrer"
              title={l.label}
              className="interactive-row interactive-button flex min-h-11 items-center gap-2 rounded-xl border border-slate-100 px-3 py-2.5 text-sm text-slate-700 hover:-translate-y-0.5 hover:border-indigo-200 hover:bg-indigo-50/50 hover:shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/50 dark:border-slate-800 dark:text-slate-200 dark:hover:bg-slate-800">
              <Icon name={linkIcon(l)} size={16} className="shrink-0 text-indigo-500" />
              <span className="min-w-0 line-clamp-2 leading-5">{l.label}</span>
            </a>
          ))}
        </div>
      ) : (
        <ul className="space-y-1.5">
          {quickLinks.map((l, i) => (
            <li key={l.id} className="flex items-center gap-2 rounded-lg border border-slate-100 px-2 py-1.5 dark:border-slate-800">
              <Icon name={linkIcon(l)} size={15} className="shrink-0 text-slate-400" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm text-slate-700 dark:text-slate-200">{l.label}</p>
                <p className="truncate text-[11px] text-slate-400">{l.group}</p>
              </div>
              <IconButton label="Move up" icon="ChevronUp" className="h-7 w-7" disabled={i === 0} onClick={() => moveLink(l.id, 'up')} />
              <IconButton label="Move down" icon="ChevronDown" className="h-7 w-7" disabled={i === quickLinks.length - 1} onClick={() => moveLink(l.id, 'down')} />
              <IconButton label="Edit link" icon="Pencil" className="h-7 w-7" onClick={() => setEditing(l)} />
              <IconButton label="Delete link" icon="Trash2" className="h-7 w-7" onClick={() => deleteLink(l.id)} />
            </li>
          ))}
        </ul>
      )}

      {adding && <LinkEditor key="add" open onClose={() => setAdding(false)} link={null} />}
      {editing && <LinkEditor key={editing.id} open onClose={() => setEditing(null)} link={editing} />}
    </Card>
  )
}
