import { INTEREST_SYNONYMS, RECOMMENDED_INTERESTS } from '../data/newsConfig.js'

export const RELEVANCE_THRESHOLD = 2
export const CLASSIFICATION_VERSION = 'deterministic-v1'
const STOP_WORDS = new Set(['and', 'the', 'for', 'with', 'news', 'latest', 'about', 'from', 'into', 'your'])

export function normalizeText(value = '') {
  return String(value).toLowerCase().replace(/[&/,+:;()[\]{}.!?'"-]/g, ' ').replace(/\s+/g, ' ').trim()
}

function termsFor(interest) {
  const label = interest.label || interest.name || ''
  const configured = interest.terms || []
  const aliases = INTEREST_SYNONYMS[interest.id] || []
  return [...new Set([label, ...configured, ...aliases].map(normalizeText).filter(Boolean))]
}

function scoreInterest(article, interest) {
  const headline = normalizeText(article.headline)
  const description = normalizeText(article.description)
  const context = normalizeText([article.source, article.region, ...(article.tags || [])].join(' '))
  const terms = termsFor(interest)
  const matchedTerms = []
  let score = 0
  terms.forEach(term => {
    const words = term.split(' ').filter(word => word.length > 2 && !STOP_WORDS.has(word))
    const phraseMatch = headline.includes(term) || description.includes(term)
    const headlineWords = words.filter(word => new RegExp(`\\b${word.replace(/[.*+?^${}()|[\\]\\\\]/g, '\\\\$&')}\\b`).test(headline))
    const descriptionWords = words.filter(word => new RegExp(`\\b${word.replace(/[.*+?^${}()|[\\]\\\\]/g, '\\\\$&')}\\b`).test(description))
    const contextMatch = words.some(word => new RegExp(`\\b${word}\\b`).test(context))
    if (phraseMatch) { score += headline.includes(term) ? 7 : 4; matchedTerms.push(term) }
    else if (headlineWords.length) { score += headlineWords.length * 3; matchedTerms.push(...headlineWords) }
    else if (descriptionWords.length) { score += descriptionWords.length; matchedTerms.push(...descriptionWords) }
    else if (contextMatch) { score += 1; matchedTerms.push(term) }
  })
  return { score, matchedTerms: [...new Set(matchedTerms)] }
}

export function classifyArticle(article, interests = RECOMMENDED_INTERESTS) {
  const matches = interests.map(interest => ({ interest, ...scoreInterest(article, interest) }))
    .filter(match => match.score >= RELEVANCE_THRESHOLD)
    .sort((a, b) => b.score - a.score)
  const matchedInterests = matches.map(match => match.interest.label)
  const matchedTerms = [...new Set(matches.flatMap(match => match.matchedTerms))]
  const reasons = matches.map(match => `Matched ${match.interest.label} because it mentions ${match.matchedTerms.slice(0, 3).join(', ')}.`)
  return {
    ...article,
    matchedInterests,
    matchedTerms,
    relevanceScore: matches[0]?.score || 0,
    matchScores: Object.fromEntries(matches.map(match => [match.interest.id, match.score])),
    reason: reasons[0] || 'No active interest match.',
    reasons,
    classificationMethod: 'deterministic',
    classificationVersion: CLASSIFICATION_VERSION,
  }
}

export function rankArticles(articles, interests, selectedInterestId = null, feedback = {}) {
  const active = interests.filter(interest => interest.active)
  return articles.map(article => classifyArticle(article, active))
    .map(article => feedback[article.id] === 'not_relevant'
      ? { ...article, relevanceScore: Math.max(0, article.relevanceScore - 3) }
      : article)
    .filter(article => !selectedInterestId || article.matchScores[selectedInterestId] >= RELEVANCE_THRESHOLD)
    .filter(article => article.matchedInterests.length > 0)
    .sort((a, b) => b.relevanceScore - a.relevanceScore || Date.parse(b.published || 0) - Date.parse(a.published || 0))
}
