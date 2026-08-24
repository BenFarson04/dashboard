// Daily briefing generator.
// -----------------------------------------------------------------------------
// This is NOT hard-coded text: it derives a briefing from the live dashboard data
// (events, emails, tasks, weather) using simple rules. Each sentence carries the
// source items it was built from, so the UI can render "why am I seeing this?" and
// deep-link to the underlying records.
//
// FUTURE (optional): send this same structured summary — NOT raw email/calendar
// content — to an LLM to phrase it more naturally. Keep it behind a setting and a
// backend so no tokens/secrets live in the client.
// -----------------------------------------------------------------------------
import { isToday, isPast, fmtTime } from '../utils'

export function generateBriefing({ events = [], emails = [], tasks = [], weather = null, prefs = {} }) {
  const p = { includeCalendar: true, includeEmail: true, includeTasks: true, includeWeather: true, ...prefs }
  const parts = []

  if (p.includeCalendar) {
    const todays = events.filter(e => isToday(e.start))
    const upcoming = todays.filter(e => !isPast(e.end || e.start))
    const needsPrep = todays.filter(e => e.prep && !isPast(e.start))
    if (todays.length === 0) {
      parts.push({ text: 'You have no events scheduled today.', refs: [] })
    } else {
      const next = upcoming[0]
      let text = `You have ${todays.length} event${todays.length > 1 ? 's' : ''} today`
      if (next) text += `, next up ${next.title} at ${fmtTime(next.start)}`
      text += '.'
      parts.push({ text, refs: todays.map(e => ({ type: 'event', id: e.id, label: e.title })) })
      if (needsPrep.length) {
        parts.push({
          text: `Your ${fmtTime(needsPrep[0].start)} ${needsPrep[0].title} may need preparation.`,
          refs: needsPrep.map(e => ({ type: 'event', id: e.id, label: e.title })),
        })
      }
    }
  }

  if (p.includeEmail) {
    const important = emails.filter(e => e.importance === 'high')
    const unreadImportant = important.filter(e => e.unread)
    if (important.length) {
      parts.push({
        text: `${important.length} email${important.length > 1 ? 's appear' : ' appears'} important${unreadImportant.length ? ` (${unreadImportant.length} unread)` : ''}.`,
        refs: important.map(e => ({ type: 'email', id: e.id, label: `${e.sender}: ${e.subject}` })),
      })
    }
  }

  if (p.includeTasks) {
    const overdue = tasks.filter(t => !t.completed && t.due && isPast(t.due))
    const dueToday = tasks.filter(t => !t.completed && t.due && isToday(t.due) && !isPast(t.due))
    if (overdue.length) {
      parts.push({
        text: `${overdue.length} task${overdue.length > 1 ? 's are' : ' is'} overdue.`,
        refs: overdue.map(t => ({ type: 'task', id: t.id, label: t.title })),
      })
    } else if (dueToday.length) {
      parts.push({
        text: `${dueToday.length} task${dueToday.length > 1 ? 's are' : ' is'} due later today.`,
        refs: dueToday.map(t => ({ type: 'task', id: t.id, label: t.title })),
      })
    }
  }

  if (p.includeWeather && weather?.current) {
    const c = weather.current
    if (c.rainProbability >= 50) {
      parts.push({ text: `Rain is likely in ${weather.location} (${c.rainProbability}%) — plan for it.`, refs: [] })
    }
  }

  return {
    generatedAt: new Date(),
    parts,
    // Plain-text version for accessibility / copying.
    text: parts.map(p => p.text).join(' '),
  }
}
