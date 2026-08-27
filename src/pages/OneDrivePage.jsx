import { useMemo, useState } from 'react'
import { useApp } from '../context/AppContext'
import { PageShell } from './PageShell'
import { Badge, Button, Card, Chip, EmptyState, ErrorState, IconButton, Spinner, inputClass } from '../components/ui/primitives'
import { Icon } from '../components/ui/Icon'
import { cn } from '../utils'

const FILTERS = [
  ['all', 'All'], ['documents', 'Documents'], ['pdfs', 'PDFs'], ['spreadsheets', 'Spreadsheets'],
  ['presentations', 'Presentations'], ['images', 'Images'], ['folders', 'Folders'], ['other', 'Other'],
]

const fileIcon = file => file.isFolder ? 'Folder' : file.category === 'pdfs' ? 'FileText' : file.category === 'spreadsheets' ? 'FileSpreadsheet' : file.category === 'presentations' ? 'Presentation' : file.category === 'images' ? 'Image' : 'FileText'

function formatDate(value) {
  if (!value) return 'Date unavailable'
  const date = new Date(value)
  return Number.isNaN(date.valueOf()) ? 'Date unavailable' : date.toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })
}

function formatSize(size) {
  if (!Number.isFinite(size)) return 'Size unavailable'
  if (size < 1024) return `${size} B`
  if (size < 1024 * 1024) return `${Math.round(size / 1024)} KB`
  if (size < 1024 * 1024 * 1024) return `${(size / (1024 * 1024)).toFixed(1)} MB`
  return `${(size / (1024 * 1024 * 1024)).toFixed(1)} GB`
}

function FileRow({ file }) {
  return (
    <li className="interactive-row flex items-center gap-3 rounded-lg border border-slate-100 px-3 py-2.5 dark:border-slate-800">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-300">
        <Icon name={fileIcon(file)} size={18} />
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-slate-700 dark:text-slate-200" title={file.name}>{file.name}</p>
        <p className="mt-0.5 flex flex-wrap gap-x-2 text-xs text-slate-500 dark:text-slate-400">
          <span>{file.isFolder ? 'Folder' : file.extension ? `.${file.extension}` : 'File type unavailable'}</span>
          <span>{formatDate(file.modifiedAt)}</span>
          {!file.isFolder && <span>{formatSize(file.size)}</span>}
          {file.modifiedBy && <span className="hidden sm:inline">by {file.modifiedBy}</span>}
        </p>
      </div>
      {file.webUrl ? (
        <a
          href={file.webUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="interactive-button inline-flex shrink-0 items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-medium text-indigo-600 hover:bg-indigo-50 focus:outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 dark:text-indigo-300 dark:hover:bg-indigo-950/40"
        >
          <Icon name="ExternalLink" size={14} />
          <span className="hidden sm:inline">Open</span>
          <span className="sr-only"> {file.name} in OneDrive</span>
        </a>
      ) : <span className="text-[11px] text-slate-400">Link unavailable</span>}
    </li>
  )
}

function AccessState({ configured, connected, enabled, authError, onConnect, onEnable }) {
  if (!configured) return <EmptyState icon="Cloud" title="Microsoft is not configured" message="Add the public Microsoft client ID to enable QUB OneDrive access." />
  if (!connected) return <EmptyState icon="Cloud" title="Connect QUB to view OneDrive" message="Use the approved QUB Microsoft account to request read-only file access." action={<Button icon="Link2" onClick={onConnect}>Connect QUB</Button>} />
  if (authError) return <ErrorState message={authError.message || 'OneDrive access needs attention.'} onRetry={onEnable} />
  if (!enabled) return <EmptyState icon="ShieldCheck" title="OneDrive access is not enabled" message="Files.Read is separate from email access and may need QUB administrator approval." action={<Button icon="Link2" onClick={onEnable}>Allow OneDrive access</Button>} />
  return null
}

export function OneDrivePage() {
  const { emailAccounts, oneDrive, oneDriveEnabled, enableOneDrive, disconnectOneDrive, loadOneDrive, searchOneDrive } = useApp()
  const qub = emailAccounts.qub
  const [query, setQuery] = useState('')
  const [activeQuery, setActiveQuery] = useState('')
  const [filter, setFilter] = useState('all')
  const connected = qub.isConnected
  const accessState = !qub.configurationReady || !connected || !oneDriveEnabled
  const files = oneDrive.data?.items || []
  const visibleFiles = useMemo(() => {
    const filtered = filter === 'all' ? files : files.filter(file => file.category === filter)
    if (activeQuery) return filtered
    return [...filtered].sort((a, b) => (b.modifiedAt || '').localeCompare(a.modifiedAt || ''))
  }, [files, filter, activeQuery])
  const counts = useMemo(() => Object.fromEntries(FILTERS.map(([id]) => [id, id === 'all' ? files.length : files.filter(file => file.category === id).length])), [files])

  const submitSearch = event => {
    event.preventDefault()
    const term = query.trim()
    if (!term) return
    setActiveQuery(term)
    searchOneDrive(term)
  }
  const clearSearch = () => {
    setQuery('')
    setActiveQuery('')
    loadOneDrive()
  }
  const enable = async () => { await enableOneDrive() }
  const accessAction = () => enableOneDrive()

  return (
    <PageShell
      icon="Cloud"
      title="OneDrive"
      description={`QUB Microsoft account${qub.accountEmail ? ` · ${qub.accountEmail}` : ''}`}
      actions={<div className="flex flex-wrap justify-end gap-2">
        {oneDrive.data?.driveUrl && <a href={oneDrive.data.driveUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3 py-2 text-sm font-medium text-white hover:bg-indigo-500 focus:outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"><Icon name="ExternalLink" size={16} /> <span className="hidden sm:inline">Open OneDrive</span></a>}
        {oneDriveEnabled && <Button size="sm" icon="RefreshCw" onClick={loadOneDrive} disabled={oneDrive.loading}>Refresh</Button>}
      </div>}
    >
      <div className="flex flex-wrap items-center gap-2">
        <Badge tone={connected && oneDriveEnabled ? 'green' : 'gray'} icon={connected && oneDriveEnabled ? 'Check' : 'Info'}>{connected && oneDriveEnabled ? 'Connected' : connected ? 'Email connected' : 'Disconnected'}</Badge>
        {connected && oneDriveEnabled && <Button size="sm" variant="ghost" icon="Unlink" onClick={disconnectOneDrive}>Disconnect OneDrive</Button>}
      </div>
      {accessState ? <AccessState configured={qub.configurationReady} connected={connected} enabled={oneDriveEnabled} authError={qub.error} onConnect={accessAction} onEnable={enable} /> : oneDrive.error ? <ErrorState message={oneDrive.error} onRetry={loadOneDrive} /> : (
        <Card title={activeQuery ? `Search results for “${activeQuery}”` : 'Recent files'} icon="Clock3" action={activeQuery ? <Button size="sm" variant="ghost" icon="X" onClick={clearSearch}>Clear search</Button> : null}>
          <form onSubmit={submitSearch} className="mb-4 flex gap-2">
            <label htmlFor="onedrive-search" className="sr-only">Search OneDrive</label>
            <div className="relative flex-1">
              <Icon name="Search" size={16} className="pointer-events-none absolute left-3 top-2.5 text-slate-400" />
              <input id="onedrive-search" className={cn(inputClass, 'pl-9')} value={query} placeholder="Search OneDrive" onChange={event => setQuery(event.target.value)} />
            </div>
            <Button type="submit" disabled={!query.trim() || oneDrive.loading}>Search</Button>
            {activeQuery && <IconButton label="Clear search" icon="X" onClick={clearSearch} />}
          </form>
          <div className="mb-4 flex flex-wrap gap-1.5" aria-label="File type filters">
            {FILTERS.map(([id, label]) => <Chip key={id} active={filter === id} onClick={() => setFilter(id)}>{label} <span className="ml-1 opacity-70">{counts[id]}</span></Chip>)}
          </div>
          {oneDrive.loading ? <div className="flex justify-center py-10"><Spinner /></div> : visibleFiles.length === 0 ? <EmptyState icon={activeQuery ? 'SearchX' : 'FolderOpen'} title={activeQuery ? 'No matching files' : 'No recent files'} message={activeQuery ? 'Try a different search or clear the search.' : 'Files modified recently will appear here.'} action={activeQuery ? <Button size="sm" icon="X" onClick={clearSearch}>Clear search</Button> : null} /> : <ul className="space-y-1.5">{visibleFiles.map(file => <FileRow key={file.id} file={file} />)}</ul>}
        </Card>
      )}
    </PageShell>
  )
}
