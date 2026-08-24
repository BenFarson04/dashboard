import { PageShell } from './PageShell'
import { CalendarCard } from '../components/dashboard/CalendarCard'

export function CalendarPage() {
  return (
    <PageShell icon="Calendar" title="Calendar" description="Today’s timeline and what’s coming up.">
      <div className="max-w-3xl"><CalendarCard full /></div>
    </PageShell>
  )
}
