import Parser from 'rss-parser'
import { existsSync, readFileSync, mkdirSync, writeFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { NEWS_FEEDS } from '../src/data/newsConfig.js'

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const OUTPUT = resolve(ROOT, 'public/data/news.json')
const MAX_SNAPSHOT_ITEMS = 250
const RETENTION_DAYS = 14

export const RSS_FEEDS = NEWS_FEEDS

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

function canonicalUrl(value, feedUrl) {
  try {
    const url = new URL(value, feedUrl)
    if (!['http:', 'https:'].includes(url.protocol)) return ''
    url.hash = ''
    for (const key of [...url.searchParams.keys()]) {
      if (/^(utm_|ref$|source$|at_medium$|at_campaign$)/i.test(key)) url.searchParams.delete(key)
    }
    return url.toString()
  } catch {
    return ''
  }
}

export function normaliseItem(item, feed) {
  const headline = plainText(item.title)
  const url = canonicalUrl(String(item.link || item.guid || '').trim(), feed.url)
  if (!headline || !url) return null

  const published = validDate(item.isoDate || item.pubDate)
  return {
    id: url,
    source: feed.source,
    sourceId: feed.id,
    sourceCategory: feed.category,
    region: feed.region || null,
    topic: feed.topic,
    tags: feed.defaultTags || [],
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
  }).filter(item => !item.published || Date.parse(item.published) >= Date.now() - RETENTION_DAYS * 86400000).sort((a, b) => {
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
  const enabledFeeds = RSS_FEEDS.filter(feed => feed.enabled)
  const results = await Promise.allSettled(enabledFeeds.map(fetchFeed))
  const successfulFeeds = []
  const failedFeeds = []
  const currentItems = []

  results.forEach((result, index) => {
    const feed = enabledFeeds[index]
    if (result.status === 'fulfilled') {
      successfulFeeds.push(feed.source)
      currentItems.push(...result.value.items)
    } else {
      failedFeeds.push({ source: feed.source, url: feed.url, error: result.reason?.message || 'Feed request failed' })
      console.error(`${feed.source} failed: ${result.reason?.message || result.reason}`)
    }
  })

  const successfulSources = new Set(successfulFeeds)
  const previousItems = previous?.items || []
  const retainedItems = previousItems.filter(item => !successfulSources.has(item.source))
  // Keep the full snapshot. The browser filters by topic before its 12-item limit.
  const items = deduplicate([...currentItems, ...retainedItems]).slice(0, MAX_SNAPSHOT_ITEMS)

  if (items.length === 0) throw new Error('No usable stories were returned and no previous snapshot is available')

  const sourceCounts = items.reduce((counts, item) => {
    counts[item.source] = (counts[item.source] || 0) + 1
    return counts
  }, {})
  return {
    schemaVersion: 2,
    generatedAt: new Date().toISOString(),
    status: failedFeeds.length === 0 ? 'live' : 'stale',
    successfulFeeds,
    failedFeeds,
    totalFetched: results.reduce((total, result) => total + (result.status === 'fulfilled' ? result.value.items.length : 0), 0),
    totalAccepted: items.length,
    sourceCounts,
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
