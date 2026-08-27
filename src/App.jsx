import { AppProvider, useApp } from './context/AppContext'
import { Sidebar } from './components/layout/Sidebar'
import { Header } from './components/layout/Header'
import { DashboardPage } from './pages/DashboardPage'
import { CalendarPage } from './pages/CalendarPage'
import { EmailPage } from './pages/EmailPage'
import { TasksPage } from './pages/TasksPage'
import { NewsPage } from './pages/NewsPage'
import { SettingsPage } from './pages/SettingsPage'
import { OneDrivePage } from './pages/OneDrivePage'

const PAGES = {
  dashboard: DashboardPage,
  calendar: CalendarPage,
  email: EmailPage,
  tasks: TasksPage,
  news: NewsPage,
  onedrive: OneDrivePage,
  settings: SettingsPage,
}

function Shell() {
  const { page } = useApp()
  const Page = PAGES[page] || DashboardPage
  return (
    <div className="app-shell flex h-screen overflow-hidden bg-[var(--page-bg)] text-[var(--text-primary)]">
      <a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:left-2 focus:top-2 focus:z-50 focus:rounded-md focus:bg-indigo-600 focus:px-3 focus:py-2 focus:text-sm focus:text-white">
        Skip to content
      </a>
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <Header />
        <main id="main" tabIndex={-1} className="flex-1 overflow-y-auto px-4 py-5 sm:px-6 sm:py-7 xl:px-10">
          <div className="mx-auto w-full max-w-[1600px] page-enter">
            <Page />
          </div>
        </main>
      </div>
    </div>
  )
}

export default function App() {
  return (
    <AppProvider>
      <Shell />
    </AppProvider>
  )
}
