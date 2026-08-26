// Shared feed metadata and recommended interests. Browser personalization stays local.
export const NEWS_FEEDS = [
  { id: 'bbc-ni', source: 'BBC News NI', url: 'https://feeds.bbci.co.uk/news/northern_ireland/rss.xml', category: 'regional', language: 'en', region: 'Northern Ireland', topic: 'belfast', enabled: true, trust: 1, defaultTags: ['northern ireland'] },
  { id: 'bbc-world', source: 'BBC World', url: 'https://feeds.bbci.co.uk/news/world/rss.xml', category: 'general', language: 'en', topic: null, enabled: true, trust: 1, defaultTags: [] },
  { id: 'bbc-technology', source: 'BBC Technology', url: 'https://feeds.bbci.co.uk/news/technology/rss.xml', category: 'technology', language: 'en', topic: 'digital', enabled: true, trust: 1, defaultTags: ['technology'] },
  { id: 'bbc-business', source: 'BBC Business', url: 'https://feeds.bbci.co.uk/news/business/rss.xml', category: 'finance', language: 'en', topic: 'finance', enabled: true, trust: 1, defaultTags: ['business'] },
  { id: 'bbc-science', source: 'BBC Science & Environment', url: 'https://feeds.bbci.co.uk/news/science_and_environment/rss.xml', category: 'science', language: 'en', topic: null, enabled: true, trust: 1, defaultTags: ['science', 'environment'] },
  { id: 'guardian-uk', source: 'The Guardian UK', url: 'https://www.theguardian.com/uk/rss', category: 'general', language: 'en', topic: null, enabled: true, trust: 1, defaultTags: [] },
  { id: 'guardian-technology', source: 'The Guardian Technology', url: 'https://www.theguardian.com/uk/technology/rss', category: 'technology', language: 'en', topic: 'digital', enabled: true, trust: 1, defaultTags: ['technology'] },
  { id: 'wired', source: 'WIRED', url: 'https://www.wired.com/feed/rss', category: 'technology', language: 'en', topic: 'digital', enabled: true, trust: 1, defaultTags: ['technology'] },
  { id: 'new-civil-engineer', source: 'New Civil Engineer', url: 'https://www.newcivilengineer.com/feed/', category: 'engineering', language: 'en', topic: 'structural', enabled: true, trust: 1, defaultTags: ['civil engineering', 'infrastructure'] },
  { id: 'construction-news', source: 'Construction News', url: 'https://www.constructionnews.co.uk/feed/', category: 'construction', language: 'en', topic: 'structural', enabled: true, trust: 1, defaultTags: ['construction', 'infrastructure'] },
]

export const RECOMMENDED_INTERESTS = [
  { id: 'structural-engineering', label: 'Structural engineering', terms: ['structural engineering', 'civil engineering', 'bridge engineering', 'bridge scour', 'structural design', 'structural assessment', 'steel frame', 'load bearing', 'eurocode', 'building structures', 'geotechnical engineering'] },
  { id: 'digital-engineering', label: 'Digital engineering', terms: ['digital engineering', 'bim', 'computational design', 'parametric design', 'grasshopper', 'digital twin', 'engineering software'] },
  { id: 'ai-software', label: 'AI and software', terms: ['artificial intelligence', 'machine learning', 'llm', 'coding agent', 'software development', 'developer tools', 'software products'] },
  { id: 'energy-infrastructure', label: 'Energy and infrastructure', terms: ['offshore wind', 'nuclear', 'grid', 'renewable energy', 'transport infrastructure', 'infrastructure'] },
  { id: 'finance-investing', label: 'Finance and investing', terms: ['finance', 'markets', 'stocks', 'investment funds', 'isa', 'pension', 'interest rates', 'personal finance', 'investing'] },
  { id: 'belfast-ni', label: 'Belfast and Northern Ireland', terms: ['belfast', 'northern ireland', 'stormont', 'ni executive', 'derry', 'londonderry', 'newry'] },
  { id: 'japan-travel', label: 'Japan travel', terms: ['japan travel', 'japan trip', 'tokyo travel', 'kyoto travel', 'osaka travel', 'japanese tourism', 'shinkansen'] },
]

export const LEGACY_TOPIC_TO_INTEREST = {
  structural: 'structural-engineering',
  digital: 'digital-engineering',
  ai: 'ai-software',
  energy: 'energy-infrastructure',
  finance: 'finance-investing',
  belfast: 'belfast-ni',
  japan: 'japan-travel',
}

export const INTEREST_SYNONYMS = {
  structural: ['structural engineering', 'civil engineering'],
  digital: ['digital engineering', 'engineering software', 'bim'],
  ai: ['artificial intelligence', 'machine learning', 'llm'],
  energy: ['energy infrastructure', 'renewable energy'],
  finance: ['financial', 'investing', 'personal finance'],
  belfast: ['northern ireland', 'ni executive'],
  japan: ['japan travel', 'japanese tourism'],
}
