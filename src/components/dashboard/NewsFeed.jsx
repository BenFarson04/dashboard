import { useMemo, useState } from 'react'
import { useApp } from '../../context/AppContext'
import { Icon } from '../ui/Icon'
import { Card, Badge, Button, Chip, StateBoundary } from '../ui/primitives'
import { cn, relTime } from '../../utils'
import { RECOMMENDED_INTERESTS } from '../../data/newsConfig'
import { sortNewsItems } from '../../services/newsState'

function NewsItem({ item, saved, pinned, feedback, onSave, onPin, onDismiss, onFeedback }) {
  const [showWhy, setShowWhy] = useState(false)
  return (
    <li className={cn('interactive-row rounded-xl border p-3 hover:bg-slate-50 dark:hover:bg-slate-800/40', pinned ? 'border-indigo-200 bg-indigo-50/40 dark:border-indigo-900 dark:bg-indigo-950/20' : 'border-slate-100 dark:border-slate-800')}>
      <div className="flex items-center gap-2 text-[11px] text-slate-400">
        <span className="font-medium text-slate-500 dark:text-slate-400">{item.source}</span>
        <span>·</span>
        <span>{relTime(item.published)}</span>
        {pinned && <Badge tone="indigo" icon="Pin">Pinned</Badge>}
        <Badge tone="indigo" className="ml-auto">{item.matchedInterests?.[0] || item.sourceCategory || 'News'}</Badge>
      </div>
      <a href={item.url} target="_blank" rel="noopener noreferrer"
        className="mt-1 block text-sm font-semibold text-slate-800 hover:text-indigo-600 dark:text-slate-100 dark:hover:text-indigo-300">
        {item.headline}
      </a>
      {item.description && <p className="mt-0.5 line-clamp-2 text-xs text-slate-500 dark:text-slate-400">{item.description}</p>}

      <div className="mt-2 flex items-center gap-1.5">
        <button onClick={() => setShowWhy(v => !v)} aria-expanded={showWhy}
          className="interactive-button inline-flex items-center gap-1 rounded px-1 text-[11px] font-medium text-slate-400 hover:text-slate-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/50 dark:hover:text-slate-200">
          <Icon name="HelpCircle" size={12} /> Why this?
        </button>
        <div className="ml-auto flex gap-0.5">
          <button onClick={() => onFeedback(item.id, 'useful')} aria-pressed={feedback === 'useful'} aria-label="Mark article useful" title="Useful"
            className={cn('interactive-button inline-flex h-7 w-7 items-center justify-center rounded-md focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/50', feedback === 'useful' ? 'text-emerald-600' : 'text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800')}>
            <Icon name="ThumbsUp" size={14} />
          </button>
          <button onClick={() => onFeedback(item.id, 'not_relevant')} aria-pressed={feedback === 'not_relevant'} aria-label="Mark article not relevant" title="Not relevant"
            className={cn('interactive-button inline-flex h-7 w-7 items-center justify-center rounded-md focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/50', feedback === 'not_relevant' ? 'text-red-600' : 'text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800')}>
            <Icon name="ThumbsDown" size={14} />
          </button>
          <button onClick={() => onPin(item)} aria-pressed={pinned} aria-label={pinned ? 'Unpin article' : 'Pin article'} title={pinned ? 'Unpin' : 'Pin'}
            className={cn('interactive-button inline-flex h-7 w-7 items-center justify-center rounded-md focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/50', pinned ? 'text-indigo-600 dark:text-indigo-300' : 'text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800')}>
            <Icon name="Pin" size={15} />
          </button>
          <button onClick={() => onSave(item)} aria-pressed={saved} aria-label={saved ? 'Unsave article' : 'Save article'} title={saved ? 'Unsave' : 'Save'}
            className={cn('interactive-button inline-flex h-7 w-7 items-center justify-center rounded-md focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/50', saved ? 'text-indigo-600 dark:text-indigo-300' : 'text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800')}>
            <Icon name={saved ? 'BookmarkCheck' : 'Bookmark'} size={15} />
          </button>
          <button onClick={() => onDismiss(item.id)} aria-label="Dismiss article" title="Dismiss"
            className="interactive-button inline-flex h-7 w-7 items-center justify-center rounded-md text-slate-400 hover:bg-slate-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/50 dark:hover:bg-slate-800">
            <Icon name="X" size={15} />
          </button>
          <a href={item.url} target="_blank" rel="noopener noreferrer" aria-label="Open article" title="Open"
            className="interactive-button inline-flex h-7 w-7 items-center justify-center rounded-md text-slate-400 hover:bg-slate-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/50 dark:hover:bg-slate-800">
            <Icon name="ExternalLink" size={15} />
          </a>
        </div>
      </div>
      {item.matchedInterests?.length > 0 && <div className="mt-2 flex flex-wrap gap-1">
        {item.matchedInterests.map(interest => <Badge key={interest} tone="blue">{interest}</Badge>)}
      </div>}
      {showWhy && <p className="mt-2 rounded-lg bg-slate-50 px-2.5 py-1.5 text-[11px] text-slate-500 dark:bg-slate-800 dark:text-slate-400">{item.reasons?.join(' ') || item.reason || 'Saved article'}</p>}
    </li>
  )
}

export function NewsFeed({ full = false }) {
  const { news, loadNews, savedNews, pinnedNews, dismissedNews, newsFeedback, setNewsFeedback, toggleSaveNews, togglePinNews, dismissNews, restoreNews, settings, goTo } = useApp()
  const interests = settings.interests || RECOMMENDED_INTERESTS.map(interest => ({ ...interest, active: true }))
  const [selectedInterest, setSelectedInterest] = useState(null)
  const [view, setView] = useState('recent')
  const savedIds = useMemo(() => new Set(savedNews.map(record => record.id)), [savedNews])
  const pinnedIds = useMemo(() => new Set(pinnedNews.map(record => record.id)), [pinnedNews])

  const items = useMemo(() => {
    const known = new Map((news.data || []).map(item => [item.id, item]))
    ;[...savedNews, ...pinnedNews].forEach(record => { if (!known.has(record.id)) known.set(record.id, record) })
    let list = [...known.values()]
    if (view === 'recent') list = list.filter(item => !dismissedNews.includes(item.id))
    if (view === 'saved') list = list.filter(item => savedIds.has(item.id))
    if (view === 'pinned') list = list.filter(item => pinnedIds.has(item.id))
    if (selectedInterest && view === 'recent') list = list.filter(item => item.matchScores?.[selectedInterest] >= 2)
    return sortNewsItems(list, pinnedNews, view)
  }, [news.data, savedNews, pinnedNews, dismissedNews, selectedInterest, savedIds, pinnedIds, view])

  const viewSelector = full && <div className="flex flex-wrap justify-end gap-1">
    {[['recent', 'Recent News'], ['saved', 'Saved News'], ['pinned', 'Pinned News']].map(([id, label]) => (
      <Chip key={id} active={view === id} onClick={() => setView(id)}>{label}</Chip>
    ))}
  </div>

  return (
    <Card title="Personalised news" icon="Newspaper" labelledBy="news-title"
      action={!full ? <Button variant="ghost" size="sm" iconRight="ArrowRight" onClick={() => goTo('news')}>Open</Button> : viewSelector}>
      {news.sourceStatus === 'demonstration' && <p className="mb-2 inline-flex items-center gap-1 rounded-md bg-amber-50 px-2 py-1 text-[11px] font-medium text-amber-700 dark:bg-amber-950/40 dark:text-amber-300">
        <Icon name="Info" size={12} /> Demonstration articles — not current or genuine news.
      </p>}
      {news.sourceStatus === 'live' && <p className="mb-2 inline-flex items-center gap-1 text-[11px] font-medium text-emerald-700 dark:text-emerald-300">
        <Icon name="Radio" size={12} /> Live news
      </p>}
      {news.sourceStatus === 'stale' && <p className="mb-2 inline-flex items-center gap-1 text-[11px] font-medium text-amber-700 dark:text-amber-300">
        <Icon name="Clock3" size={12} /> Cached live news
      </p>}

      {full && view === 'recent' && (
        <div className="mb-3 flex flex-wrap gap-1.5">
          <Chip active={!selectedInterest} onClick={() => setSelectedInterest(null)}>All active interests</Chip>
          {interests.filter(interest => interest.active).map(interest => (
            <Chip key={interest.id} active={selectedInterest === interest.id} onClick={() => setSelectedInterest(interest.id)}>{interest.label}</Chip>
          ))}
        </div>
      )}

      <StateBoundary
        loading={news.loading}
        error={news.error}
        onRetry={loadNews}
        empty={!news.loading && !news.error && items.length === 0}
        emptyProps={{
          icon: 'Newspaper',
          title: interests.some(interest => interest.active) ? 'No articles' : 'No active interests',
          message: view === 'saved' ? 'Save an article to build your reading list.' : view === 'pinned' ? 'Pin an article to keep it at the top.' : interests.some(interest => interest.active) ? 'No stories match your interests.' : 'Activate an interest in Settings to personalize your feed.',
          action: <Button variant="subtle" size="sm" icon="RefreshCw" onClick={loadNews}>Try again</Button>,
        }}
      >
        <ul className="space-y-2">
          {(full ? items : items.slice(0, 3)).map(n => (
            <NewsItem key={n.id} item={n} saved={savedIds.has(n.id)} pinned={pinnedIds.has(n.id)} feedback={newsFeedback[n.id]} onSave={toggleSaveNews} onPin={togglePinNews} onDismiss={dismissNews} onFeedback={setNewsFeedback} />
          ))}
        </ul>
      </StateBoundary>

      {full && dismissedNews.length > 0 && view === 'recent' && (
        <div className="mt-3 border-t border-slate-100 pt-2 dark:border-slate-800">
          <p className="mb-1 text-[11px] text-slate-400">Dismissed ({dismissedNews.length})</p>
          <button onClick={() => dismissedNews.forEach(restoreNews)} className="text-xs font-medium text-indigo-600 hover:underline dark:text-indigo-300">
            Restore all dismissed
          </button>
        </div>
      )}
    </Card>
  )
}
