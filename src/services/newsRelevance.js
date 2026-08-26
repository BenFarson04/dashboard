import { INTEREST_SYNONYMS, RECOMMENDED_INTERESTS } from '../data/newsConfig.js'

export const RELEVANCE_THRESHOLD = 2
export const CLASSIFICATION_VERSION = 'deterministic-v2'
const STOP_WORDS = new Set(['and', 'the', 'for', 'with', 'news', 'latest', 'about', 'from', 'into', 'your'])

export function normalizeText(value = '') {
  return String(value).toLowerCase().replace(/[&/,+:;()[\]{}.!?'"-]/g, ' ').replace(/\s+/g, ' ').trim()
}

function escapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function containsTerm(text, term) {
  return new RegExp(`(?:^|\\s)${escapeRegex(term)}(?=\\s|$)`).test(text)
}

function termsFor(interest) {
  const label = interest.label || interest.name || ''
  const configured = interest.terms || []

  const aliases = INTEREST_SYNONYMS[interest.id] || []
  return [...new Set([label, ...configured, ...aliases].map(normalizeText).filter(Boolean))]
}

function articleFields(article) {
  return {
    headline: normalizeText(article.headline),
    description: normalizeText(article.description),
    metadata: normalizeText([
      article.source,
  article.sourceId,
  article.sourceCategory,
  article.region,
      article.topic,
      ...(article.tags || []),
    ].join(' ')),
  }
}

function scoreInterest(article, interest) {
  const fields = articleFields(article)
  const matchedTerms = []
  let score = 0

  termsFor(interest).forEach(term => {
  const words = term.split(' ').filter(word => word.length > 2 && !STOP_WORDS.has(word))
  const phraseInHeadline = containsTerm(fields.headline, term)
  const phraseInDescription = containsTerm(fields.description, term)
  const phraseInMetadata = containsTerm(fields.metadata, term)
  const headlineWords = words.filter(word => containsTerm(fields.headline, word))
  const descriptionWords = words.filter(word => containsTerm(fields.description, word))
  const metadataWords = words.filter(word => containsTerm(fields.metadata, word))

  if (phraseInHeadline) {
      score += 10
      matchedTerms.push(term)
    } else if (phraseInDescription) {
      score += 6
      matchedTerms.push(term)
    } else if (phraseInMetadata && (phraseInHeadline || phraseInDescription || headlineWords.length || descriptionWords.length)) {
      score += 4
      matchedTerms.push(term)
    } else if (headlineWords.length && (words.length === 1 || headlineWords.length === words.length)) {
      score += headlineWords.length * 3
      matchedTerms.push(...headlineWords)
    } else if (descriptionWords.length && (words.length === 1 || descriptionWords.length === words.length)) {
      score += descriptionWords.length
      matchedTerms.push(...descriptionWords)
    } else if (metadataWords.length && (words.length === 1 || metadataWords.length === words.length) && (headlineWords.length || descriptionWords.length)) {
      score += 1
      matchedTerms.push(...metadataWords)
    }
  })
  return { score, matchedTerms: [...new Set(matchedTerms)] }
}

export function deterministicClassify(article, interests = RECOMMENDED_INTERESTS) {
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

// A server-side classifier can later implement the same (article, interests) contract.
export function classifyArticle(article, interests = RECOMMENDED_INTERESTS, classifier = deterministicClassify) {
  return classifier(article, interests)
}

export function rankArticles(articles, interests, selectedInterestId = null, feedback = {}, { classifier = deterministicClassify } = {}) {
  const active = interests.filter(interest => interest.active)
  return articles.map(article => classifyArticle(article, active, classifier))
    .map(article => feedback[article.id] === 'not_relevant'
      ? { ...article, relevanceScore: Math.max(0, article.relevanceScore - 3) }
      : article)
  .filter(article => !selectedInterestId || article.matchScores[selectedInterestId] >= RELEVANCE_THRESHOLD)
  .filter(article => article.matchedInterests.length > 0)
  .sort((a, b) => b.relevanceScore - a.relevanceScore || Date.parse(b.published || 0) - Date.parse(a.published || 0))
}
