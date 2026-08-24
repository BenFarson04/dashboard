import { PageShell } from './PageShell'
import { NewsFeed } from '../components/dashboard/NewsFeed'

export function NewsPage() {
  return (
    <PageShell icon="Newspaper" title="Personalised news" description="Filtered to the topics you care about.">
      <div className="max-w-3xl"><NewsFeed full /></div>
    </PageShell>
  )
}
