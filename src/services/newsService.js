// News data service. RSS feeds are proxied through RSS2JSON for GitHub Pages.
import { mockNews } from '../data/mockData'
import { maybeFail } from './_helpers'

const RSS2JSON_ENDPOINT = 'https://api.rss2json.com/v1/api.json?rss_url='

// These topic IDs match the existing dashboard filters.
export const RSS_FEEDS = [
  { url: 'https://feeds.bbci.co.uk/news/rss.xml', topic: 'belfast' },
  { url: 'https://feeds.bbci.co.uk/news/technology/rss.xml', topic: 'digital' },
  { url: 'https://feeds.bbci.co.uk/news/business/rss.xml', topic: 'finance' },
]

export const meta = { key: 'news', name: 'News', source: 'rss' }

function normaliseItem(item, feed) {
  const url = item.link || item.guid || ''
  const headline = item.title || ''
  const source = item.author || item.source || 'BBC News'

  return {
    id: url || headline,
    source,
    topic: feed.topic,
    headline,
    description: item.description || item.content || '',
    published: item.pubDate || '',
    reason: `From ${source}`,
    url,
  }
}

async function fetchFeed(feed) {
  const response = await fetch(`${RSS2JSON_ENDPOINT}${encodeURIComponent(feed.url)}`)
  if (!response.ok) throw new Error(`RSS2JSON request failed (${response.status})`)

  const payload = await response.json()
  if (payload.status !== 'ok' || !Array.isArray(payload.items)) {
    throw new Error(payload.message || 'RSS2JSON returned an invalid feed')
  }

  return payload.items.map(item => normaliseItem(item, feed))
}

export async function getNews({ topics = null, failRate = 0 } = {}) {
  maybeFail(failRate)

  const results = await Promise.allSettled(RSS_FEEDS.map(fetchFeed))
  const successful = results.filter(result => result.status === 'fulfilled')
  results.forEach((result, index) => {
    if (result.status === 'rejected') {
      console.error(`News feed ${RSS_FEEDS[index].url} failed:`, result.reason?.message || result.reason)
    }
  })

  // Keep the dashboard usable when the aggregator or every upstream feed is unavailable.
  if (successful.length === 0) {
    console.warn('All live news feeds failed; using demonstration articles as a fallback.')
    const fallback = [...mockNews].sort((a, b) => new Date(b.published) - new Date(a.published))
    return topics ? fallback.filter(n => topics.includes(n.topic)) : fallback
  }

  const seen = new Set()
  const items = successful
    .flatMap(result => result.value)
    .filter(item => {
      const key = item.url || item.headline
      if (!key || seen.has(key)) return false
      seen.add(key)
      return true
    })
    .sort((a, b) => new Date(b.published) - new Date(a.published))
    .slice(0, 12)

  return topics ? items.filter(n => topics.includes(n.topic)) : items
}
