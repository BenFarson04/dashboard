export const PODCAST_WINDOW_MS = 72 * 60 * 60 * 1000
const API_BASE = 'https://api.spotify.com/v1'

async function spotifyFetch(path, accessToken, fetchImpl) {
  const response = await fetchImpl(`${API_BASE}${path}`, { headers: { Authorization: `Bearer ${accessToken}` } })
  const data = await response.json().catch(() => ({}))
  if (!response.ok) throw new Error(data.error?.message || 'Spotify podcast updates could not be loaded.')
  return data
}

function showFrom(item) { return item?.show || item }

export function filterAndSortEpisodes(episodes, now = Date.now()) {
  return episodes
    .map(episode => ({
      id: episode.id,
      podcastName: episode.show?.name || episode.podcastName || 'Podcast',
      episodeTitle: episode.name,
      releasedAt: new Date(episode.release_date).getTime(),
      durationMs: episode.duration_ms,
      spotifyUrl: episode.external_urls?.spotify || `https://open.spotify.com/episode/${episode.id}`,
    }))
    .filter(episode => Number.isFinite(episode.releasedAt) && episode.releasedAt <= now && now - episode.releasedAt <= PODCAST_WINDOW_MS)
    .sort((a, b) => b.releasedAt - a.releasedAt)
}

export async function getPodcastUpdates({ accessToken, now = Date.now(), fetchImpl = fetch }) {
  if (!accessToken) throw Object.assign(new Error('Spotify is disconnected.'), { code: 'disconnected' })
  const [followed, saved] = await Promise.all([
    spotifyFetch('/me/following?type=show&limit=50', accessToken, fetchImpl),
    spotifyFetch('/me/shows?limit=50', accessToken, fetchImpl),
  ])
  const shows = [...(followed.items || []), ...(saved.items || [])]
    .map(showFrom)
    .filter(show => show?.id)
    .filter((show, index, list) => list.findIndex(candidate => candidate.id === show.id) === index)
  const episodePages = await Promise.all(shows.map(show => spotifyFetch(`/shows/${encodeURIComponent(show.id)}/episodes?limit=50`, accessToken, fetchImpl)))
  const episodes = episodePages.flatMap((page, index) => (page.items || []).map(episode => ({ ...episode, show: episode.show || shows[index] })))
  return { items: filterAndSortEpisodes(episodes, now), refreshedAt: now, showCount: shows.length }
}

export function formatEpisodeDuration(durationMs) {
  const minutes = Math.max(0, Math.round((durationMs || 0) / 60000))
  const hours = Math.floor(minutes / 60)
  const remaining = minutes % 60
  return hours ? `${hours}h${remaining ? ` ${remaining}m` : ''}` : `${minutes}m`
}

export function formatReleaseAge(releasedAt, now = Date.now()) {
  const hours = Math.floor(Math.max(0, now - releasedAt) / 3600000)
  if (hours < 1) return 'Just now'
  if (hours < 24) return `${hours}h ago`
  if (hours < 48) return 'Yesterday'
  return `${Math.floor(hours / 24)} days ago`
}
