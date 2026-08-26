import assert from 'node:assert/strict'
import { classifyArticle, rankArticles, RELEVANCE_THRESHOLD } from '../src/services/newsRelevance.js'
import { RECOMMENDED_INTERESTS } from '../src/data/newsConfig.js'
import { normaliseItem, plainText } from './fetch-news.mjs'

const structural = { id: 'structural', label: 'Structural engineering', terms: ['structural engineering', 'bridge', 'steel frame'], active: true }
const finance = { id: 'finance', label: 'Finance', terms: ['personal finance', 'pension', 'markets'], active: true }
const custom = { id: 'custom-offshore-wind', label: 'Offshore Wind', terms: ['Offshore Wind'], active: true }

const bridge = classifyArticle({ headline: 'Bridge uses a new steel frame', description: 'A structural engineering project.', source: 'General News', tags: [], region: null }, [structural, finance])
assert.equal(bridge.matchedInterests[0], 'Structural engineering')
assert.ok(bridge.relevanceScore >= RELEVANCE_THRESHOLD)
assert.match(bridge.reason, /steel frame|bridge|structural engineering/)
assert.ok(bridge.matchedTerms.includes('bridge'))

const headlineMatch = classifyArticle({ headline: 'Offshore wind investment grows', description: 'A renewable energy update.', source: 'News', tags: [], region: null }, [custom])
const descriptionMatch = classifyArticle({ headline: 'Investment grows', description: 'Offshore wind projects expand.', source: 'News', tags: [], region: null }, [custom])
assert.ok(headlineMatch.relevanceScore > descriptionMatch.relevanceScore)
assert.equal(headlineMatch.matchedInterests[0], 'Offshore Wind')

const metadataMatch = classifyArticle({ headline: 'Offshore projects announced', description: 'Developers confirm plans.', source: 'Renewables Desk', sourceCategory: 'energy', tags: ['offshore wind'], region: null }, [custom])
assert.equal(metadataMatch.matchedInterests[0], 'Offshore Wind')
assert.ok(metadataMatch.reason.includes('offshore wind'))
assert.equal(classifyArticle({ headline: 'New projects announced', description: 'Developers confirm plans.', source: 'BBC News NI', topic: 'belfast', tags: ['northern ireland'] }, [{ id: 'belfast', label: 'Belfast', terms: ['Belfast'], active: true }]).matchedInterests.length, 0)
assert.equal(classifyArticle({ headline: 'Generic engineering update', description: '', source: 'News' }, [{ id: 'structural', label: 'Structural engineering', terms: ['Structural engineering'], active: true }]).matchedInterests.length, 0)
assert.equal(classifyArticle({ headline: 'A political speech mentions Japan', description: 'International relations continue.', source: 'World News' }, [RECOMMENDED_INTERESTS.find(interest => interest.id === 'japan-travel')]).matchedInterests.length, 0)
assert.equal(classifyArticle({ headline: 'A concrete bridge opens', description: 'The project is ready for visitors.', source: 'Local News' }, [RECOMMENDED_INTERESTS.find(interest => interest.id === 'structural-engineering')]).matchedInterests.length, 0)
assert.equal(classifyArticle({ headline: 'A party fund is announced', description: 'The group raised money.', source: 'General News' }, [RECOMMENDED_INTERESTS.find(interest => interest.id === 'finance-investing')]).matchedInterests.length, 0)
assert.equal(classifyArticle({ headline: 'A new game launches', description: 'The software is available today.', source: 'Games News' }, [RECOMMENDED_INTERESTS.find(interest => interest.id === 'ai-software')]).matchedInterests.length, 0)
assert.equal(rankArticles([{ headline: 'Offshore Wind', description: '', source: 'News' }], [{ ...custom, active: false }]).length, 0)

const generalBbc = classifyArticle({ headline: 'Government announces new policy', description: 'Officials met in London.', source: 'BBC World', tags: [], region: null }, [{ id: 'belfast-ni', label: 'Belfast and Northern Ireland', terms: ['belfast', 'northern ireland', 'stormont'], active: true }])
assert.equal(generalBbc.matchedInterests.length, 0)

const multi = classifyArticle({ headline: 'Pension funds invest in offshore wind', description: 'Markets respond to a renewable energy project.', source: 'News', tags: [], region: null }, [finance, { id: 'energy', label: 'Energy and infrastructure', terms: ['offshore wind', 'renewable energy'], active: true }])
assert.equal(multi.matchedInterests.length, 2)
assert.ok(rankArticles([multi], [finance, { id: 'energy', label: 'Energy and infrastructure', terms: ['offshore wind'], active: true }], 'energy').length === 1)

assert.equal(plainText('<p>Hello &amp; world</p><script>x</script>'), 'Hello & world')
assert.equal(normaliseItem({ title: 'Missing URL' }, { id: 'x', source: 'Source', topic: null }), null)
assert.equal(normaliseItem({ title: 'Unsafe', link: 'javascript:alert(1)' }, { id: 'x', source: 'Source', topic: null }), null)
console.log('news relevance and normalization tests passed')
