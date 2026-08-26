import { useMemo, useState } from 'react'
import { useApp } from '../../context/AppContext'
import { Icon } from '../ui/Icon'
import { Card, Badge, Button, Chip, StateBoundary } from '../ui/primitives'
import { cn, relTime } from '../../utils'
import { RECOMMENDED_INTERESTS } from '../../data/newsConfig'

function NewsItem({ item, saved, feedback, onSave, onDismiss, onFeedback }) {
  const [showWhy, setShowWhy] = useState(false)
  return (
    <li className="rounded-xl border border-slate-100 p-3 hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-800/40">
      <div className="flex items-center gap-2 text-[11px] text-slate-400">
        <span className="font-medium text-slate-500 dark:text-slate-400">{item.source}</span>
        <span>·</span>
        <span>{relTime(item.published)}</span>
        <Badge tone="indigo" className="ml-auto">{item.matchedInterests?.[0] || item.sourceCategory || 'News'}</Badge>
      </div>
      <a href={item.url} target="_blank" rel="noopener noreferrer"
        className="mt-1 block text-sm font-semibold text-slate-800 hover:text-indigo-600 dark:text-slate-100 dark:hover:text-indigo-300">
        {item.headline}
      </a>
      <p className="mt-0.5 line-clamp-2 text-xs text-slate-500 dark:text-slate-400">{item.description}</p>

      <div className="mt-2 flex items-center gap-1.5">
        <button onClick={() => setShowWhy(v => !v)} aria-expanded={showWhy}
          className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
          <Icon name="HelpCircle" size={12} /> Why this?
        </button>
        <div className="ml-auto flex gap-0.5">
          <button onClick={() => onFeedback(item.id, 'useful')} aria-pressed={feedback === 'useful'} aria-label="Mark article useful" title="Useful"
            className={cn('inline-flex h-7 w-7 items-center justify-center rounded-md', feedback === 'useful' ? 'text-emerald-600' : 'text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800')}>
            <Icon name="ThumbsUp" size={14} />
          </button>
          <button onClick={() => onFeedback(item.id, 'not_relevant')} aria-pressed={feedback === 'not_relevant'} aria-label="Mark article not relevant" title="Not relevant"
            className={cn('inline-flex h-7 w-7 items-center justify-center rounded-md', feedback === 'not_relevant' ? 'text-red-600' : 'text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800')}>
            <Icon name="ThumbsDown" size={14} />
          </button>
          <button onClick={() => onSave(item.id)} aria-pressed={saved} aria-label={saved ? 'Unsave article' : 'Save article'} title="Save"
            className={cn('inline-flex h-7 w-7 items-center justify-center rounded-md', saved ? 'text-indigo-600 dark:text-indigo-300' : 'text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800')}>
            <Icon name={saved ? 'BookmarkCheck' : 'Bookmark'} size={15} />
          </button>
          <button onClick={() => onDismiss(item.id)} aria-label="Dismiss article" title="Dismiss"
            className="inline-flex h-7 w-7 items-center justify-center rounded-md text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800">
            <Icon name="X" size={15} />
          </button>
          <a href={item.url} target="_blank" rel="noopener noreferrer" aria-label="Open article" title="Open"
            className="inline-flex h-7 w-7 items-center justify-center rounded-md text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800">
            <Icon name="ExternalLink" size={15} />
          </a>
        </div>
      </div>
      {item.matchedInterests?.length > 0 && <div className="mt-2 flex flex-wrap gap-1">
        {item.matchedInterests.map(interest => <Badge key={interest} tone="blue">{interest}</Badge>)}
      </div>}
      {showWhy && <p className="mt-2 rounded-lg bg-slate-50 px-2.5 py-1.5 text-[11px] text-slate-500 dark:bg-slate-800 dark:text-slate-400">{item.reasons?.join(' ') || item.reason}</p>}
    </li>
  )
}

export function NewsFeed({ full = false }) {
  const { news, loadNews, savedNews, dismissedNews, newsFeedback, setNewsFeedback, toggleSaveNews, dismissNews, restoreNews, settings, goTo } = useApp()
  const interests = settings.interests || RECOMMENDED_INTERESTS.map(interest => ({ ...interest, active: true }))
  const [selectedInterest, setSelectedInterest] = useState(null)
  const [savedOnly, setSavedOnly] = useState(false)

  const items = useMemo(() => {
    let list = (news.data || []).filter(n => !dismissedNews.includes(n.id))
    list = selectedInterest ? list.filter(n => n.matchScores?.[selectedInterest] >= 2) : list
    if (savedOnly) list = list.filter(n => savedNews.includes(n.id))
    return list
  }, [news.data, dismissedNews, selectedInterest, savedOnly, savedNews])

  return (
    <Card title="Personalised news" icon="Newspaper" labelledBy="news-title"
      action={!full
        ? <Button variant="ghost" size="sm" iconRight="ArrowRight" onClick={() => goTo('news')}>Open</Button>
        : <Chip active={savedOnly} onClick={() => setSavedOnly(v => !v)}>Saved only</Chip>}>
      {news.sourceStatus === 'demonstration' && <p className="mb-2 inline-flex items-center gap-1 rounded-md bg-amber-50 px-2 py-1 text-[11px] font-medium text-amber-700 dark:bg-amber-950/40 dark:text-amber-300">
        <Icon name="Info" size={12} /> Demonstration articles — not current or genuine news.
      </p>}
      {news.sourceStatus === 'live' && <p className="mb-2 inline-flex items-center gap-1 text-[11px] font-medium text-emerald-700 dark:text-emerald-300">
        <Icon name="Radio" size={12} /> Live news
      </p>}
      {news.sourceStatus === 'stale' && <p className="mb-2 inline-flex items-center gap-1 text-[11px] font-medium text-amber-700 dark:text-amber-300">
        <Icon name="Clock3" size={12} /> Cached live news
      </p>}

      {full && (
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
          message: savedOnly ? 'You haven’t saved anything yet.' : interests.some(interest => interest.active) ? 'No stories match your interests.' : 'Activate an interest in Settings to personalize your feed.',
          action: <Button variant="subtle" size="sm" icon="RefreshCw" onClick={loadNews}>Try again</Button>,
        }}
      >
        <ul className="space-y-2">
          {(full ? items : items.slice(0, 3)).map(n => (
            <NewsItem key={n.id} item={n} saved={savedNews.includes(n.id)} feedback={newsFeedback[n.id]} onSave={toggleSaveNews} onDismiss={dismissNews} onFeedback={setNewsFeedback} />
          ))}
        </ul>
      </StateBoundary>

      {full && dismissedNews.length > 0 && (
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
