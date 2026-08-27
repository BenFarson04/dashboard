import { normalizeEmail } from './emailModel.js'

const GRAPH_BASE = 'https://graph.microsoft.com/v1.0'
const PAGE_SIZE = 25

function categoryFor(subject, sender) {
  const text = `${subject} ${sender}`.toLowerCase()
  if (/qub|lecture|tutor|university|deadline|assignment|module/.test(text)) return 'university'
  if (/invoice|payment|statement|bank|pension|isa/.test(text)) return 'finance'
  if (/flight|booking|itinerary|hotel|trip/.test(text)) return 'travel'
  return 'other'
}

function graphError(status, code) {
  const error = new Error(status === 403 ? 'QUB mailbox permission was denied.' : status === 401 ? 'QUB needs you to reconnect.' : status === 429 ? 'Microsoft Graph is temporarily throttling requests. Try again shortly.' : 'QUB mailbox could not be loaded.')
  error.code = code || `graph_http_${status}`
  error.status = status
  return error
}

export async function getMessages({ acquireAccess, accountId, accountLabel }) {
  const token = await acquireAccess()
  const params = new URLSearchParams({
    '$top': String(PAGE_SIZE),
    '$orderby': 'receivedDateTime desc',
    '$select': 'id,from,subject,bodyPreview,receivedDateTime,isRead,importance,webLink',
  })
  const response = await fetch(`${GRAPH_BASE}/me/mailFolders/inbox/messages?${params}`, { headers: { Authorization: `Bearer ${token}` } })
  if (!response.ok) {
    let code = ''
    try { code = (await response.json()).error?.code || '' } catch { /* ignore malformed error response */ }
    throw graphError(response.status, code)
  }
  const payload = await response.json()
  return (payload.value || []).map(message => normalizeGraphMessage(message, accountId, accountLabel))
}

export function normalizeGraphMessage(message, accountId = 'test-account', accountLabel = 'QUB') {
    const senderAddress = message.from?.emailAddress?.address || ''
    const senderName = message.from?.emailAddress?.name || senderAddress || 'Unknown sender'
    const subject = message.subject || '(no subject)'
    const receivedAt = new Date(message.receivedDateTime)
    const validDate = Number.isNaN(receivedAt.valueOf()) ? null : receivedAt
    const important = message.importance === 'high'
    const score = (message.isRead ? 0 : 2) + (important ? 3 : 0) + (/urgent|action|deadline|review|today|asap|reminder/i.test(subject) ? 2 : 0)
    return normalizeEmail({ provider: 'qub', accountId, accountLabel, providerMessageId: message.id || 'missing-id',
      senderName, senderAddress, subject, preview: message.bodyPreview, receivedAt: validDate,
      isRead: message.isRead, isImportant: important, categories: [categoryFor(subject, senderAddress)], relevanceScore: score,
      relevanceReasons: [important ? 'Flagged important by Microsoft 365.' : '', message.isRead ? '' : 'Unread.'].filter(Boolean), webUrl: /^https:\/\//i.test(message.webLink || '') ? message.webLink : null })
}

export function handleAuthError(error) { return error }