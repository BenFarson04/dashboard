import assert from 'node:assert/strict'
import { classifyArticle, rankArticles, RELEVANCE_THRESHOLD } from '../src/services/newsRelevance.js'
import { normaliseItem, plainText } from './fetch-news.mjs'

const structural = { id: 'structural', label: 'Structural engineering', terms: ['structural engineering', 'bridge', 'steel frame'], active: true }
const finance = { id: 'finance', label: 'Finance', terms: ['personal finance', 'pension', 'markets'], active: true }

const bridge = classifyArticle({ headline: 'Bridge uses a new steel frame', description: 'A structural engineering project.', source: 'General News', tags: [], region: null }, [structural, finance])
assert.equal(bridge.matchedInterests[0], 'Structural engineering')
assert.ok(bridge.relevanceScore >= RELEVANCE_THRESHOLD)
assert.match(bridge.reason, /steel frame|bridge|structural engineering/)
assert.ok(bridge.matchedTerms.includes('bridge'))

const generalBbc = classifyArticle({ headline: 'Government announces new policy', description: 'Officials met in London.', source: 'BBC World', tags: [], region: null }, [{ id: 'belfast-ni', label: 'Belfast and Northern Ireland', terms: ['belfast', 'northern ireland', 'stormont'], active: true }])
assert.equal(generalBbc.matchedInterests.length, 0)

const multi = classifyArticle({ headline: 'Pension funds invest in offshore wind', description: 'Markets respond to a renewable energy project.', source: 'News', tags: [], region: null }, [finance, { id: 'energy', label: 'Energy and infrastructure', terms: ['offshore wind', 'renewable energy'], active: true }])
assert.equal(multi.matchedInterests.length, 2)
assert.ok(rankArticles([multi], [finance, { id: 'energy', label: 'Energy and infrastructure', terms: ['offshore wind'], active: true }], 'energy').length === 1)

assert.equal(plainText('<p>Hello &amp; world</p><script>x</script>'), 'Hello & world')
assert.equal(normaliseItem({ title: 'Missing URL' }, { id: 'x', source: 'Source', topic: null }), null)
assert.equal(normaliseItem({ title: 'Unsafe', link: 'javascript:alert(1)' }, { id: 'x', source: 'Source', topic: null }), null)
console.log('news relevance and normalization tests passed')
