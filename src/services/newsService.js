// News data service.
// -----------------------------------------------------------------------------
// CURRENT: returns fictional demo articles.
// FUTURE:  fetch from an RSS aggregator or news API (e.g. a small backend that
//          reads per-topic RSS feeds and normalises them to this shape). Keep the
//          returned object shape identical so the UI needs no changes.
// -----------------------------------------------------------------------------
import { mockNews } from '../data/mockData'
import { delay, maybeFail } from './_helpers'

export const meta = { key: 'news', name: 'News', source: 'mock' }

export async function getNews({ topics = null, failRate = 0 } = {}) {
  await delay(450)
  maybeFail(failRate)
  const items = [...mockNews].sort((a, b) => new Date(b.published) - new Date(a.published))
  return topics ? items.filter(n => topics.includes(n.topic)) : items
}
