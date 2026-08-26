import Parser from 'rss-parser'
import { existsSync, readFileSync, mkdirSync, writeFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const OUTPUT = resolve(ROOT, 'public/data/news.json')

export const RSS_FEEDS = [
  { url: 'https://feeds.bbci.co.uk/news/northern_ireland/rss.xml', topic: 'belfast', source: 'BBC News NI' },
  { url: 'https://feeds.bbci.co.uk/news/technology/rss.xml', topic: 'digital', source: 'BBC Technology' },
  { url: 'https://feeds.bbci.co.uk/news/business/rss.xml', topic: 'finance', source: 'BBC Business' },
]

const parser = new Parser({
  timeout: 15000,
  headers: { 'User-Agent': 'personal-productivity-dashboard-news-refresh/1.0' },
})

function decodeEntities(value) {
  return value
    .replace(/&(?:amp|lt|gt|quot|apos|#39|#x27|nbsp);/gi, entity => ({
      '&amp;': '&', '&lt;': '<', '&gt;': '>', '&quot;': '"', '&apos;': "'",
      '&#39;': "'", '&#x27;': "'", '&nbsp;': ' ',
    }[entity.toLowerCase()] || entity))
}

export function plainText(value = '') {
  return decodeEntities(String(value)
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/https?:\/\/\S+/g, ' ')
    .replace(/[\u00a0\r\n\t]+/g, ' ')
    .replace(/\s{2,}/g, ' ')
    .trim())
}

function validDate(value) {
  const date = value ? new Date(value) : null
  return date && !Number.isNaN(date.getTime()) ? date.toISOString() : ''
}

function usableUrl(value) {
  try {
    const protocol = new URL(value).protocol
    return protocol === 'http:' || protocol === 'https:'
  } catch {
    return false
  }
}

export function normaliseItem(item, feed) {
  const headline = plainText(item.title)
  const url = String(item.link || item.guid || '').trim()
  if (!headline || !usableUrl(url)) return null

  const published = validDate(item.isoDate || item.pubDate)
  return {
    id: url,
    source: feed.source,
    topic: feed.topic,
    headline,
    description: plainText(item.contentSnippet || item.content || item.description || ''),
    published,
    reason: `From ${feed.source}`,
    url,
  }
}

async function fetchFeed(feed) {
  const parsed = await parser.parseURL(feed.url)
  const items = parsed.items.map(item => normaliseItem(item, feed)).filter(Boolean)
  if (items.length === 0) throw new Error('Feed returned no usable stories')
  return { feed, items }
}

function deduplicate(items) {
  const seen = new Set()
  return items.filter(item => {
    const key = item.url || item.headline
    if (!key || seen.has(key)) return false
    seen.add(key)
    return true
  }).sort((a, b) => {
    const left = a.published ? Date.parse(a.published) : 0
    const right = b.published ? Date.parse(b.published) : 0
    return right - left
  })
}

function readPrevious() {
  if (!existsSync(OUTPUT)) return null
  try {
    const previous = JSON.parse(readFileSync(OUTPUT, 'utf8'))
    return Array.isArray(previous.items) ? previous : null
  } catch (error) {
    console.warn(`Could not read previous news snapshot: ${error.message}`)
    return null
  }
}

export async function generateNewsSnapshot() {
  const previous = readPrevious()
  const results = await Promise.allSettled(RSS_FEEDS.map(fetchFeed))
  const successfulFeeds = []
  const failedFeeds = []
  const currentItems = []

  results.forEach((result, index) => {
    const feed = RSS_FEEDS[index]
    if (result.status === 'fulfilled') {
      successfulFeeds.push(feed.source)
      currentItems.push(...result.value.items)
    } else {
      failedFeeds.push({ source: feed.source, url: feed.url, error: result.reason?.message || 'Feed request failed' })
      console.error(`${feed.source} failed: ${result.reason?.message || result.reason}`)
    }
  })

  const successfulTopics = new Set(successfulFeeds.map(source => RSS_FEEDS.find(feed => feed.source === source).topic))
  const previousItems = previous?.items || []
  const retainedItems = previousItems.filter(item => !successfulTopics.has(item.topic))
  // Keep the full snapshot. The browser filters by topic before its 12-item limit.
  const items = deduplicate([...currentItems, ...retainedItems])

  if (items.length === 0) throw new Error('No usable stories were returned and no previous snapshot is available')

  return {
    generatedAt: new Date().toISOString(),
    status: failedFeeds.length === 0 ? 'live' : 'stale',
    successfulFeeds,
    failedFeeds,
    items,
  }
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const snapshot = await generateNewsSnapshot()
  mkdirSync(dirname(OUTPUT), { recursive: true })
  writeFileSync(OUTPUT, `${JSON.stringify(snapshot, null, 2)}\n`)
  console.log(`Wrote ${snapshot.items.length} stories (${snapshot.status}) to ${OUTPUT}`)
  if (snapshot.failedFeeds.length) console.warn(`Retained previous stories for ${snapshot.failedFeeds.length} failed feed(s).`)
}
