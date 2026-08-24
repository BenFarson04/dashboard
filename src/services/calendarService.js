// LIVE calendar service — Google Calendar API (read-only).
import { CALENDAR_BASE } from '../auth/googleConfig'

export const meta = { key: 'calendar', name: 'Calendar', source: 'google' }

function categorise(ev) {
  const s = `${ev.summary || ''} ${ev.description || ''}`.toLowerCase()
  if (/gym|lunch|coffee|dinner|hockey|family/.test(s)) return 'Personal'
  if (/finance|pension|bank|invoice/.test(s)) return 'Finance'
  if (/uni|lecture|tutor|placement|assignment|qub/.test(s)) return 'University'
  return 'Work'
}

export async function getEvents({ getToken } = {}) {
  const token = await getToken()

  const start = new Date(); start.setHours(0, 0, 0, 0)
  const end = new Date(); end.setDate(end.getDate() + 7); end.setHours(23, 59, 59, 999)

  const url = `${CALENDAR_BASE}/calendars/primary/events`
    + `?timeMin=${encodeURIComponent(start.toISOString())}`
    + `&timeMax=${encodeURIComponent(end.toISOString())}`
    + `&singleEvents=true&orderBy=startTime&maxResults=50`

  const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } })
  if (!res.ok) throw new Error(`Google Calendar error (${res.status})`)
  const data = await res.json()

  return (data.items || [])
    .filter(ev => ev.status !== 'cancelled')
    .map(ev => {
      const startISO = ev.start?.dateTime || ev.start?.date
      const endISO = ev.end?.dateTime || ev.end?.date
      const online = !!(ev.hangoutLink || /zoom|teams|meet\.google/i.test(ev.location || ''))
      return {
        id: ev.id,
        title: ev.summary || '(no title)',
        start: new Date(startISO),
        end: new Date(endISO),
        location: ev.hangoutLink ? 'Google Meet' : (ev.location || 'No location'),
        online,
        category: categorise(ev),
        prep: /review|prep|meeting|call|coordination|interview/i.test(ev.summary || '') && !!ev.description,
        details: ev.description || '',
        webLink: ev.htmlLink,
      }
    })
}