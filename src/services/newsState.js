const ARTICLE_FIELDS = ['url', 'headline', 'description', 'source', 'published', 'sourceCategory', 'reason']

function timestamp(value, fallback) {
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback
}

export function normalizeNewsState(value, timestampKey) {
  if (!Array.isArray(value)) return []
  const seen = new Set()
  return value.reduce((records, entry) => {
    const record = typeof entry === 'string' ? { id: entry } : entry
    if (!record || typeof record.id !== 'string' || seen.has(record.id)) return records
    seen.add(record.id)
    records.push({
      ...record,
      [timestampKey]: timestamp(record[timestampKey], Date.now()),
    })
    return records
  }, [])
}

export function articleStateRecord(article, timestampKey, existing = {}) {
  const record = { id: article.id, ...existing }
  ARTICLE_FIELDS.forEach(field => {
    if (article[field] !== undefined) record[field] = article[field]
  })
  record[timestampKey] = timestamp(existing[timestampKey], Date.now())
  return record
}

export function mergeNewsState(records, articles, timestampKey) {
  const articlesById = new Map((articles || []).map(article => [article.id, article]))
  let changed = false
  const merged = records.map(record => {
    const article = articlesById.get(record.id)
    if (!article) return record
    const next = articleStateRecord(article, timestampKey, record)
    if (ARTICLE_FIELDS.some(field => next[field] !== record[field])) changed = true
    return next
  })
  return changed ? merged : records
}

export function toggleNewsState(records, article, timestampKey) {
  const existing = records.find(record => record.id === article.id)
  if (existing) return records.filter(record => record.id !== article.id)
  return [...records, articleStateRecord(article, timestampKey)]
}

export function sortNewsItems(items, pinnedRecords = [], view = 'recent') {
  const pinnedById = new Map(pinnedRecords.map(record => [record.id, record]))
  const publishedTime = item => Date.parse(item.published || '') || 0
  const pinnedTime = item => pinnedById.get(item.id)?.pinnedAt || 0
  return [...items].sort((left, right) => {
    const leftPinned = pinnedById.has(left.id)
    const rightPinned = pinnedById.has(right.id)
    if (view === 'pinned') return pinnedTime(right) - pinnedTime(left) || publishedTime(right) - publishedTime(left)
    if (leftPinned !== rightPinned) return leftPinned ? -1 : 1
    return publishedTime(right) - publishedTime(left)
  })
}