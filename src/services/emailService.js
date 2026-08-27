// Gmail provider adapter — read-only metadata and snippets.
import { GMAIL_BASE } from '../auth/googleConfig.js'
import { normalizeEmail } from './emailModel.js'

export const meta = { key: 'email', name: 'Email', source: 'google' }

function header(msg, name) {
  const h = (msg.payload?.headers || []).find(x => x.name.toLowerCase() === name.toLowerCase())
  return h ? h.value : ''
}

function parseFrom(value) {
  const m = value.match(/^\s*"?([^"<]*)"?\s*<([^>]+)>/)
  if (m) return { name: m[1].trim() || m[2], email: m[2] }
  return { name: value, email: value }
}

function categorise(subject, from) {
  const s = `${subject} ${from}`.toLowerCase()
  if (/qub|placement|lecture|tutor|university|deadline|assignment/.test(s)) return 'university'
  if (/pension|isa|sipp|bank|invoice|payment|statement|chase|aj bell/.test(s)) return 'finance'
  if (/flight|booking|itinerary|hotel|trip|wanderlog|ryokan/.test(s)) return 'travel'
  if (/gym|hockey|family/.test(s)) return 'personal'
  return 'other'
}

function score(msg, isUnread, subject) {
  let s = 0
  if (isUnread) s += 2
  if ((msg.labelIds || []).includes('IMPORTANT')) s += 3
  if (/urgent|action|deadline|review|today|asap|reminder/i.test(subject)) s += 2
  const ageHrs = (Date.now() - Number(msg.internalDate)) / 3.6e6
  if (ageHrs < 24) s += 2; else if (ageHrs < 72) s += 1
  return s
}

function reasonFor(isUnread, subject, important) {
  const bits = []
  if (important) bits.push('flagged important by Gmail')
  if (isUnread) bits.push('unread')
  if (/deadline|urgent|action|review/i.test(subject)) bits.push('mentions an action/deadline')
  return bits.length ? `Selected because it is ${bits.join(', ')}.` : 'Recent message from your inbox.'
}

function decodeSnippet(s) {
  return s.replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
    .replace(/&#39;/g, "'").replace(/&quot;/g, '"').replace(/&nbsp;/g, ' ')
}

export async function getMessages({ getToken } = {}) {
  const token = await getToken()
  const auth = { headers: { Authorization: `Bearer ${token}` } }

  // 1) List recent inbox message IDs.
  const listRes = await fetch(`${GMAIL_BASE}/users/me/messages?maxResults=25&labelIds=INBOX`, auth)
  if (!listRes.ok) throw new Error(`Gmail error (${listRes.status})`)
  const list = await listRes.json()
  const ids = (list.messages || []).map(m => m.id)

  // 2) Fetch lightweight metadata for each (headers + snippet only — no body).
  const msgs = await Promise.all(ids.map(async id => {
    const r = await fetch(
      `${GMAIL_BASE}/users/me/messages/${id}?format=metadata&metadataHeaders=From&metadataHeaders=Subject&metadataHeaders=Date`,
      auth,
    )
    return r.ok ? r.json() : null
  }))

  // 3) Normalise + score.
  const scored = msgs.filter(Boolean).map(msg => normalizeGmailMessage(msg))
  return scored.sort((a, b) => b.relevanceScore - a.relevanceScore || b.receivedAt - a.receivedAt)
}

export function normalizeGmailMessage(msg) {
  const subject = header(msg, 'Subject') || '(no subject)'
  const from = parseFrom(header(msg, 'From'))
  const isUnread = (msg.labelIds || []).includes('UNREAD')
  const important = (msg.labelIds || []).includes('IMPORTANT')
  const relevanceScore = score(msg, isUnread, subject)
  return normalizeEmail({ provider: 'gmail', accountId: 'google', accountLabel: 'Gmail', providerMessageId: msg.id,
    senderName: from.name, senderAddress: from.email, subject, preview: decodeSnippet(msg.snippet || ''),
    receivedAt: new Date(Number(msg.internalDate)), isRead: !isUnread, isImportant: important,
    categories: [categorise(subject, from.email)], relevanceScore,
    relevanceReasons: [reasonFor(isUnread, subject, important)], webUrl: `https://mail.google.com/mail/u/0/#inbox/${msg.id}` })
}

export const getRelevantEmails = getMessages