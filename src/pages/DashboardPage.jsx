import { useApp } from '../context/AppContext'
import { DailyBriefing } from '../components/dashboard/DailyBriefing'
import { CalendarCard } from '../components/dashboard/CalendarCard'
import { EmailList } from '../components/dashboard/EmailList'
import { TasksPanel } from '../components/dashboard/TasksPanel'
import { NewsFeed } from '../components/dashboard/NewsFeed'
import { WeatherCard } from '../components/dashboard/WeatherCard'
import { QuickLinks } from '../components/dashboard/QuickLinks'
import { PodcastUpdates } from '../components/dashboard/PodcastUpdates'

const CARDS = {
  calendar: CalendarCard,
  email: EmailList,
  tasks: TasksPanel,
  news: NewsFeed,
  weather: WeatherCard,
  quicklinks: QuickLinks,
  podcasts: PodcastUpdates,
}

export function DashboardPage() {
  const { settings } = useApp()
  const order = settings.cards.order.filter(id => settings.cards.visible[id] !== false && CARDS[id])

  return (
    <div className="space-y-5">
      <DailyBriefing />
      <div className="grid items-start gap-5 lg:grid-cols-12">
        {order.map(id => {
          const Cmp = CARDS[id]
          const span = id === 'email' || id === 'news' ? 'lg:col-span-7' : id === 'calendar' || id === 'tasks' ? 'lg:col-span-5' : 'lg:col-span-4'
          const utility = id === 'weather' || id === 'podcasts' || id === 'quicklinks'
          return (
            <div key={id} className={`${span} ${utility ? 'lg:col-start-9' : ''}`}>
              <Cmp />
            </div>
          )
        })}
      </div>
    </div>
  )
}
