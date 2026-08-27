import { useApp } from '../../context/AppContext'
import { formatEpisodeDuration, formatReleaseAge } from '../../services/podcastService'
import { Icon } from '../ui/Icon'
import { Button, Card, StateBoundary } from '../ui/primitives'

export function PodcastUpdates() {
  const { spotify, loadPodcasts } = useApp()
  const updates = spotify.data?.items || []

  return (
    <Card title="Podcast Updates" icon="Radio" labelledBy="podcast-updates-title"
      action={spotify.connected && <Button variant="ghost" size="sm" icon="RefreshCw" onClick={loadPodcasts}>Refresh</Button>}>
      {!spotify.connected ? (
        <div className="py-2 text-center">
          <p className="text-sm text-slate-600 dark:text-slate-300">Connect Spotify to see new podcast releases.</p>
          <Button className="mt-3" size="sm" icon="Link2" onClick={spotify.connect} disabled={!spotify.ready}>Connect Spotify</Button>
          {!spotify.configurationReady && <p className="mt-2 text-[11px] text-slate-400">Spotify is not configured for this deployment.</p>}
        </div>
      ) : (
        <StateBoundary loading={spotify.loading} error={spotify.error} empty={updates.length === 0} onRetry={loadPodcasts}
          emptyProps={{ icon: 'Radio', title: 'No new podcast episodes', message: 'No new podcast episodes in the last 3 days.' }}>
          <ul className="space-y-1.5">
            {updates.map(episode => (
              <li key={episode.id} className="interactive-row flex items-center gap-2 rounded-lg border border-slate-100 px-2.5 py-2 dark:border-slate-800">
                <Icon name="Radio" size={15} className="shrink-0 text-emerald-500" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs font-medium text-slate-700 dark:text-slate-200">{episode.podcastName}</p>
                  <p className="truncate text-sm text-slate-800 dark:text-slate-100">{episode.episodeTitle}</p>
                  <div className="mt-0.5 flex items-center gap-1.5 text-[11px] text-slate-400">
                    <span>{formatReleaseAge(episode.releasedAt, spotify.now)}</span><span aria-hidden="true">·</span><span>{formatEpisodeDuration(episode.durationMs)}</span>
                  </div>
                </div>
                <a href={episode.spotifyUrl} target="_blank" rel="noopener noreferrer" aria-label={`Open ${episode.episodeTitle} in Spotify`} title="Open in Spotify"
                  className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-slate-400 hover:bg-emerald-50 hover:text-emerald-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/50 dark:hover:bg-emerald-950/30">
                  <Icon name="ExternalLink" size={16} />
                </a>
              </li>
            ))}
          </ul>
          <p className="mt-2 truncate text-[11px] text-slate-400">Refreshed {new Date(spotify.refreshedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
        </StateBoundary>
      )}
    </Card>
  )
}
