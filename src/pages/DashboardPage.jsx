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
    <div className="space-y-4">
      <DailyBriefing />
      {/* Masonry-style columns keep short cards (weather, links) from leaving gaps. */}
      <div className="gap-4 [column-fill:_balance] md:columns-2 xl:columns-3">
        {order.map(id => {
          const Cmp = CARDS[id]
          return (
            <div key={id} className="mb-4 break-inside-avoid">
              <Cmp />
            </div>
          )
        })}
      </div>
    </div>
  )
}
