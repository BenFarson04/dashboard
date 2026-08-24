import { PageShell } from './PageShell'
import { EmailList } from '../components/dashboard/EmailList'

export function EmailPage() {
  return (
    <PageShell icon="Mail" title="Relevant emails" description="A focused shortlist — not your whole inbox.">
      <div className="max-w-3xl"><EmailList full /></div>
    </PageShell>
  )
}
