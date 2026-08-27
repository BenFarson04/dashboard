// Deterministic briefing generation. This module never calls an AI service.
import { isSameDay, fmtTime } from '../utils/index.js'
import { getTaskCategory, isCompleted, sortTasks, TASK_STATUS } from './taskService.js'

export function getBriefingMode(now = new Date()) {
  const hour = new Date(now).getHours()
  if (hour < 12) return 'morning'
  if (hour < 18) return 'afternoon'
  return 'evening'
}

function dayEvents(events, date) { return events.filter(event => event.start && isSameDay(event.start, date)).sort((a, b) => new Date(a.start) - new Date(b.start)) }
function ref(type, item, label = item.title || item.subject || item.headline) { return { type, id: item.id, provider: item.provider, label } }
function plural(count, singular, pluralForm = `${singular}s`) { return `${count} ${count === 1 ? singular : pluralForm}` }
function emailProviderLabel(provider) { return provider === 'qub' ? 'QUB' : 'Gmail' }

function emailSummary(emails, mode, now) {
  const start = new Date(now)
  if (mode === 'morning') { start.setDate(start.getDate() - 1); start.setHours(18, 0, 0, 0) }
  else start.setHours(mode === 'afternoon' ? 5 : 18, 0, 0, 0)
  const fresh = emails.filter(email => email.receivedAt && new Date(email.receivedAt) >= start)
  const unread = emails.filter(email => email.unread && email.feedback !== 'not_relevant' && email.feedback !== 'dealt')
  const byProvider = ['gmail', 'qub'].map(provider => ({ provider, count: fresh.filter(email => email.provider === provider).length })).filter(item => item.count)
  const parts = []
  if (fresh.length) {
    const counts = byProvider.map(item => `${plural(item.count, 'new message')} from ${emailProviderLabel(item.provider)}`)
    parts.push(`${counts.join(' and ')} ${fresh.length === 1 ? 'has' : 'have'} arrived ${mode === 'morning' ? 'since yesterday evening' : mode === 'afternoon' ? 'since this morning' : 'today'}.`)
  } else if (mode !== 'evening') parts.push('No new email needs your attention right now.')
  const importantUnread = unread.filter(email => email.importance === 'high')
  if (mode === 'evening' && importantUnread.length) {
    const providers = [...new Set(importantUnread.map(emailProviderLabel))].join(' and ')
    parts.push(`${plural(importantUnread.length, 'important unread email')} ${importantUnread.length === 1 ? 'is' : 'are'} waiting in ${providers}.`)
  }
  return { text: parts.join(' '), refs: (fresh.length ? fresh : importantUnread).slice(0, 3).map(email => ref('email', email, `${emailProviderLabel(email.provider)}: ${email.sender}: ${email.subject}`)) }
}

function taskSummary(tasks, mode, now) {
  const outstanding = tasks.filter(task => !isCompleted(task) && getTaskCategory(task, now) !== 'unscheduled')
  const overdue = sortTasks(outstanding.filter(task => getTaskCategory(task, now) === TASK_STATUS.OVERDUE), TASK_STATUS.OVERDUE)
  const due = sortTasks(outstanding.filter(task => getTaskCategory(task, now) === TASK_STATUS.DUE), TASK_STATUS.DUE)
  const highPriorityDue = due.filter(task => task.priority === 'high')
  const dueSoon = due.filter(task => new Date(task.dueDate ?? task.due) - new Date(now) <= 2 * 86400000)
  const longRunning = outstanding.filter(task => task.createdAt && new Date(now) - new Date(task.createdAt) > 7 * 86400000)
  const completedRecently = tasks.filter(task => isCompleted(task) && task.completedAt && new Date(now) - new Date(task.completedAt) < 86400000)
  if (!outstanding.length && !completedRecently.length) return { text: '', refs: [] }
  const details = []
  if (overdue.length) details.push(plural(overdue.length, 'overdue item'))
  if (highPriorityDue.length) details.push(plural(highPriorityDue.length, 'high-priority task'))
  if (dueSoon.length) details.push(plural(dueSoon.length, 'task due soon'))
  if (mode === 'evening' && longRunning.length) details.push(plural(longRunning.length, 'long-running task'))
  let text = outstanding.length ? `You have ${plural(outstanding.length, 'outstanding task')}` : 'Your outstanding task list is clear'
  if (details.length) text += outstanding.length ? `, including ${details.join(' and ')}.` : `, with ${details.join(' and ')}.`
  else text += '.'
  if (completedRecently.length) text += ` You completed ${plural(completedRecently.length, 'task')} recently.`
  const focused = [...overdue, ...highPriorityDue, ...dueSoon, ...longRunning]
  return { text, refs: focused.filter((task, index) => focused.findIndex(item => item.id === task.id) === index).slice(0, 3).map(task => ref('task', task)) }
}

function calendarSummary(events, mode, now) {
  const today = dayEvents(events, now)
  const tomorrow = new Date(now); tomorrow.setDate(tomorrow.getDate() + 1)
  const nextDay = dayEvents(events, tomorrow)
  if (mode === 'evening') return nextDay.length ? { text: `Tomorrow has ${plural(nextDay.length, 'meeting')}, starting with ${nextDay[0].title} at ${fmtTime(nextDay[0].start)}.`, refs: nextDay.map(event => ref('event', event)) } : { text: 'You have no meetings scheduled tomorrow.', refs: [] }
  const remaining = mode === 'morning' ? today : today.filter(event => new Date(event.end || event.start) > new Date(now))
  if (!today.length) return { text: mode === 'morning' ? 'You have no meetings scheduled today.' : 'You have no meetings remaining today.', refs: [] }
  if (!remaining.length) return { text: 'You have no meetings remaining today.', refs: [] }
  const prefix = mode === 'morning' ? `You have ${plural(today.length, 'meeting')} today` : `You have ${plural(remaining.length, 'meeting')} remaining today`
  return { text: `${prefix}, with ${remaining[0].title} at ${fmtTime(remaining[0].start)} next.`, refs: remaining.map(event => ref('event', event)) }
}

function weatherSummary(weather, mode) {
  const current = weather?.current
  if (!current) return { text: '', refs: [] }
  const forecast = weather.forecast || []
  const rain = Math.max(current.rainProbability || 0, ...forecast.map(hour => hour.rain || 0))
  const wind = Math.max(current.windKph || 0, ...forecast.map(hour => hour.windKph || 0))
  if (rain >= 60) return { text: `Rain is likely ${mode === 'morning' ? 'today' : 'for the rest of the day'}${weather.location ? ` in ${weather.location}` : ''}; a jacket may be useful.`, refs: [] }
  if (wind >= 40) return { text: `High winds are expected later${mode === 'evening' ? ' this evening' : ' today'}; allow extra time outside.`, refs: [] }
  if (current.tempC <= 5) return { text: `It will be cold${weather.location ? ` in ${weather.location}` : ''} today, so wrap up warm.`, refs: [] }
  if (current.tempC >= 22) return { text: 'Warm conditions are expected today; stay hydrated if you are outside.', refs: [] }
  if (rain < 20 && current.tempC >= 10) return { text: mode === 'evening' ? 'Conditions should stay dry and mild this evening.' : 'Conditions should stay dry and mild for most of the day.', refs: [] }
  return { text: '', refs: [] }
}

function newsSummary(news) {
  const top = [...news].sort((a, b) => (b.relevanceScore || 0) - (a.relevanceScore || 0) || new Date(b.published || 0) - new Date(a.published || 0))[0]
  return top ? { text: `The most relevant news today concerns ${top.headline}.`, refs: [ref('news', top, top.headline)] } : { text: '', refs: [] }
}

export function generateBriefing({ events = [], emails = [], tasks = [], weather = null, news = [], prefs = {}, now = new Date(), maxWords = 140 } = {}) {
  const mode = getBriefingMode(now)
  const enabled = { includeCalendar: true, includeEmail: true, includeTasks: true, includeWeather: true, includeNews: true, ...prefs }
  const sections = []
  if (enabled.includeCalendar) sections.push(calendarSummary(events, mode, now))
  if (enabled.includeWeather) sections.push(weatherSummary(weather, mode))
  if (enabled.includeTasks) sections.push(taskSummary(tasks, mode, now))
  if (enabled.includeEmail) sections.push(emailSummary(emails, mode, now))
  if (enabled.includeNews) sections.push(newsSummary(news))
  const parts = sections.filter(section => section.text).map(section => ({ ...section, text: section.text.trim() }))
  const greeting = mode === 'morning' ? 'Good morning' : mode === 'afternoon' ? 'Good afternoon' : 'Good evening'
  const fullText = `${greeting}. ${parts.map(part => part.text).join(' ')}`
  const words = fullText.split(/\s+/)
  const text = words.length <= maxWords ? fullText : `${words.slice(0, maxWords).join(' ').replace(/[,.]$/, '')}.`
  return { mode, generatedAt: new Date(now), parts, text, fullText }
}
