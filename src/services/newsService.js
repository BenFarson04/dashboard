// News data service. RSS is fetched and normalized by GitHub Actions.
import { mockNews } from '../data/mockData'
import { maybeFail } from './_helpers'

const NEWS_PATH = `${import.meta.env.BASE_URL}data/news.json`
export const meta = { key: 'news', name: 'News', source: 'rss-snapshot' }

function sortNews(items) {
  return [...items].sort((a, b) => {
    const left = a.published ? Date.parse(a.published) : 0
    const right = b.published ? Date.parse(b.published) : 0
    return right - left
  })
}

function usableItem(item) {
  return item && typeof item.headline === 'string' && item.headline.trim()
    && typeof item.url === 'string' && item.url.trim()
}

function deduplicate(items) {
  const seen = new Set()
  return items.filter(item => {
    const key = item.url || item.headline
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })
}

async function fetchSnapshot() {
  const response = await fetch(NEWS_PATH, { cache: 'no-store' })
  if (!response.ok) throw new Error(`News snapshot request failed (${response.status})`)
  const snapshot = await response.json()
  if (!snapshot || !Array.isArray(snapshot.items)) throw new Error('News snapshot is invalid')
  return snapshot
}

export async function getNews({ failRate = 0 } = {}) {
  maybeFail(failRate)

  try {
    const snapshot = await fetchSnapshot()
    const items = sortNews(deduplicate(snapshot.items.filter(usableItem)))
    return { items, status: snapshot.status || 'live', metadata: snapshot }
  } catch (error) {
    console.error('Live news snapshot unavailable:', error.message)
    const items = sortNews(deduplicate(mockNews.filter(usableItem)))
    return {
      items,
      status: items.length ? 'demonstration' : 'no-data',
      metadata: { error: 'News is temporarily unavailable' },
    }
  }
}
