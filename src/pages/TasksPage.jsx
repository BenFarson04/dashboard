import { PageShell } from './PageShell'
import { TasksPanel } from '../components/dashboard/TasksPanel'

export function TasksPage() {
  return (
    <PageShell icon="CheckSquare" title="Tasks" description="Everything to do, grouped by when it matters.">
      <div className="max-w-3xl"><TasksPanel full /></div>
    </PageShell>
  )
}
