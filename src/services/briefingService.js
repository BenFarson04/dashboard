// Daily briefing generator.
//
// This briefing is generated locally from the dashboard's calendar, email,
// tasks, weather and news data. Nothing is sent to an external AI service.

import { isToday, isPast, fmtTime } from '../utils'

export function generateBriefing({
  events = [],
  emails = [],
  tasks = [],
  weather = null,
  news = [],
  prefs = {},
}) {
  const p = {
    includeCalendar: true,
    includeEmail: true,
    includeTasks: true,
    includeWeather: true,
    includeNews: true,
    ...prefs,
  }

  const parts = []

  // ---------------------------------------------------------------------------
  // CALENDAR
  // ---------------------------------------------------------------------------

  if (p.includeCalendar) {
    const todaysEvents = events.filter(event => isToday(event.start))

    const upcomingEvents = todaysEvents.filter(event =>
      !isPast(event.end || event.start)
    )

    const eventsNeedingPrep = upcomingEvents.filter(event => event.prep)

    if (todaysEvents.length === 0) {
      parts.push({
        text: 'You have no events scheduled today.',
        refs: [],
      })
    } else {
      const nextEvent = upcomingEvents[0]

      let text = `You have ${todaysEvents.length} event${
        todaysEvents.length === 1 ? '' : 's'
      } today`

      if (nextEvent) {
        text += `, with ${nextEvent.title} next at ${fmtTime(nextEvent.start)}`
      }

      text += '.'

      parts.push({
        text,
        refs: todaysEvents.map(event => ({
          type: 'event',
          id: event.id,
          label: event.title,
        })),
      })

      if (eventsNeedingPrep.length > 0) {
        const preparationEvent = eventsNeedingPrep[0]

        parts.push({
          text: `Your ${fmtTime(preparationEvent.start)} ${
            preparationEvent.title
          } may require some preparation.`,
          refs: eventsNeedingPrep.map(event => ({
            type: 'event',
            id: event.id,
            label: event.title,
          })),
        })
      }
    }
  }

  // ---------------------------------------------------------------------------
  // EMAIL
  // ---------------------------------------------------------------------------

  if (p.includeEmail) {
    const importantEmails = emails.filter(
      email =>
        email.importance === 'high' &&
        email.feedback !== 'not_relevant' &&
        email.feedback !== 'dealt'
    )

    const unreadImportantEmails = importantEmails.filter(email => email.unread)

    if (importantEmails.length > 0) {
      parts.push({
        text: `${importantEmails.length} email${
          importantEmails.length === 1 ? ' appears' : 's appear'
        } important${
          unreadImportantEmails.length > 0
            ? `, including ${unreadImportantEmails.length} unread`
            : ''
        }.`,
        refs: importantEmails.map(email => ({
          type: 'email',
          id: email.id,
          provider: email.provider,
          label: `${email.sender}: ${email.subject}`,
        })),
      })
    }
  }

  // ---------------------------------------------------------------------------
  // TASKS
  // ---------------------------------------------------------------------------

  if (p.includeTasks) {
    const overdueTasks = tasks.filter(
      task => !task.completed && task.due && isPast(task.due)
    )

    const dueTodayTasks = tasks.filter(
      task =>
        !task.completed &&
        task.due &&
        isToday(task.due) &&
        !isPast(task.due)
    )

    if (overdueTasks.length > 0) {
      parts.push({
        text: `${overdueTasks.length} task${
          overdueTasks.length === 1 ? ' is' : 's are'
        } overdue.`,
        refs: overdueTasks.map(task => ({
          type: 'task',
          id: task.id,
          label: task.title,
        })),
      })
    } else if (dueTodayTasks.length > 0) {
      parts.push({
        text: `${dueTodayTasks.length} task${
          dueTodayTasks.length === 1 ? ' is' : 's are'
        } due later today.`,
        refs: dueTodayTasks.map(task => ({
          type: 'task',
          id: task.id,
          label: task.title,
        })),
      })
    }
  }

  // ---------------------------------------------------------------------------
  // WEATHER
  // ---------------------------------------------------------------------------

  if (p.includeWeather && weather?.current) {
    const current = weather.current

    if (current.rainProbability >= 60) {
      parts.push({
        text: `Rain is likely in ${weather.location} today, with a ${current.rainProbability}% chance.`,
        refs: [],
      })
    } else if (current.rainProbability >= 30) {
      parts.push({
        text: `There is a moderate chance of rain in ${weather.location} today.`,
        refs: [],
      })
    } else if (current.tempC <= 5) {
      parts.push({
        text: `It is cold in ${weather.location} today at around ${current.tempC}°C.`,
        refs: [],
      })
    } else if (current.tempC >= 22) {
      parts.push({
        text: `It should be relatively warm in ${weather.location} today at around ${current.tempC}°C.`,
        refs: [],
      })
    }
  }

  // ---------------------------------------------------------------------------
  // NEWS
  // ---------------------------------------------------------------------------

  if (p.includeNews && news.length > 0) {
    // The news service should already return articles ordered by relevance/date.
    // Use only one story in the daily briefing so the summary stays concise.
    const topStory = news[0]

    parts.push({
      text: `Worth knowing: ${topStory.headline}.`,
      refs: [
        {
          type: 'news',
          id: topStory.id,
          label: topStory.headline,
        },
      ],
    })
  }

  return {
    generatedAt: new Date(),
    parts,
    text: parts.map(part => part.text).join(' '),
  }
}