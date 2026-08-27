// -----------------------------------------------------------------------------
// DEMONSTRATION DATA ONLY
// -----------------------------------------------------------------------------
// Everything in this file is fictional mock data used to make the first version
// of the dashboard fully functional without any live API credentials.
// It is deliberately isolated here so the service layer can swap it out for real
// Microsoft Graph / news / weather responses without touching the UI.
// -----------------------------------------------------------------------------
import { atToday } from '../utils'
import { RECOMMENDED_INTERESTS } from './newsConfig'

export const EMAIL_CATEGORIES = [
  { id: 'important',  label: 'Important' },
  { id: 'university', label: 'University/career' },
  { id: 'travel',     label: 'Travel' },
  { id: 'finance',    label: 'Finance' },
  { id: 'personal',   label: 'Personal' },
  { id: 'other',      label: 'Other' },
]

// --- Calendar ---------------------------------------------------------------
export const mockEvents = [
  {
    id: 'ev1', title: 'Team stand-up', start: atToday(9, 0), end: atToday(9, 15),
    location: 'Microsoft Teams', online: true, category: 'Work', prep: false,
    details: 'Daily sync. Share yesterday/today/blockers. No prep needed.',
  },
  {
    id: 'ev2', title: 'Structures coordination — GSA model review', start: atToday(10, 0), end: atToday(11, 0),
    location: 'Room 4.2', online: false, category: 'Work', prep: true,
    details: 'Walk through the steel braced-frame GSA model and load takedowns before issue. Bring updated section sizes and the drawing register.',
  },
  {
    id: 'ev3', title: 'Lunch with brother — Japan trip planning', start: atToday(13, 0), end: atToday(14, 0),
    location: 'Chubby Cherub Deli, Belfast', online: false, category: 'Personal', prep: false,
    details: 'Confirm Kanazawa + Takayama nights and finalise the Wanderlog food tiers.',
  },
  {
    id: 'ev4', title: 'Pension options review call', start: atToday(15, 30), end: atToday(16, 0),
    location: 'Phone', online: true, category: 'Finance', prep: true,
    details: 'Aegon vs AJ Bell SIPP consolidation. Have current fund charges and transfer values to hand.',
  },
  {
    id: 'ev5', title: 'Strength session', start: atToday(17, 30), end: atToday(18, 15),
    location: 'Gym', online: false, category: 'Personal', prep: false,
    details: 'Lower body. Eat pre-workout carbs ~1h before.',
  },
  // Upcoming (future days)
  {
    id: 'ev6', title: 'End-of-placement report review', start: atToday(11, 0, 1), end: atToday(12, 0, 1),
    location: 'Microsoft Teams', online: true, category: 'University', prep: true,
    details: 'QUB tutor review of the placement report draft.',
  },
  {
    id: 'ev7', title: 'Clarendon Wharf design team meeting', start: atToday(9, 30, 2), end: atToday(10, 30, 2),
    location: 'Room 2.1', online: false, category: 'Work', prep: false,
    details: 'Coordination with architect on transfer structure.',
  },
  {
    id: 'ev8', title: 'Junior hockey coaching', start: atToday(18, 0, 2), end: atToday(19, 30, 2),
    location: 'Club pitch', online: false, category: 'Personal', prep: false, details: 'Weekly session.',
  },
]

// --- Email ------------------------------------------------------------------
export const mockEmails = [
  {
    id: 'em1', sender: 'Ben McIlroy', senderEmail: 'b.mcilroy@example.com',
    subject: 'GSA model review — bring load takedowns', preview: "Can you have the updated braced-frame model and the drawing register ready for the 10:00? Want to check the transfer level before we issue.",
    received: atToday(8, 5), importance: 'high', category: 'important', unread: true,
    reason: 'From your manager and references your 10:00 meeting today.',
  },
  {
    id: 'em2', sender: 'AJ Bell', senderEmail: 'noreply@ajbell.example.com',
    subject: 'Your SIPP transfer illustration is ready', preview: 'The illustration comparing your current Aegon arrangement with an AJ Bell SIPP is available to view in your account.',
    received: atToday(7, 40), importance: 'high', category: 'finance', unread: true,
    reason: 'Time-sensitive and linked to your 15:30 pension review call.',
  },
  {
    id: 'em3', sender: 'QUB Placements Office', senderEmail: 'placements@qub.example.ac.uk',
    subject: 'Placement report — submission deadline reminder', preview: 'A reminder that your end-of-placement report is due next week. Please ensure your industrial mentor has signed off.',
    received: atToday(17, 10, -1), importance: 'medium', category: 'university', unread: true,
    reason: 'Approaching university deadline that needs an action from you.',
  },
  {
    id: 'em4', sender: 'Wanderlog', senderEmail: 'trips@wanderlog.example.com',
    subject: 'Your brother shared “Japan 2027” with you', preview: 'You now have edit access to the Japan 2027 itinerary. 14 places have been added across Tokyo, Kanazawa and Kyoto.',
    received: atToday(20, 30, -1), importance: 'low', category: 'travel', unread: false,
    reason: 'Matches your Japan travel interests and active trip planning.',
  },
  {
    id: 'em5', sender: 'Chase', senderEmail: 'hello@chase.example.com',
    subject: 'Your saver account is now open', preview: 'Welcome — your linked saver is ready. Boosted rate applies for the first 12 months on balances up to the limit.',
    received: atToday(9, 15, -1), importance: 'low', category: 'finance', unread: false,
    reason: 'Relates to your recent savings account set-up.',
  },
  {
    id: 'em6', sender: 'Arup IT', senderEmail: 'it@example.com',
    subject: 'Scheduled VPN maintenance this weekend', preview: 'Remote access may be intermittent on Saturday between 08:00 and 11:00 while we apply updates.',
    received: atToday(16, 0, -1), importance: 'low', category: 'other', unread: false,
    reason: 'General notice — low priority, no action required.',
  },
  {
    id: 'em7', sender: 'Autodesk', senderEmail: 'news@autodesk.example.com',
    subject: 'Webinar: automating documentation with the Revit API', preview: 'Join our session on scripting repetitive documentation tasks — relevant to your drawing-register automation work.',
    received: atToday(12, 0, -1), importance: 'medium', category: 'university', unread: true,
    reason: 'Matches your interest in digital engineering and workflow automation.',
  },
]

// --- News (all fictional demo articles) ------------------------------------
export const mockNews = [
  { id: 'n1', source: 'The Structural Engineer', topic: 'structural',
    headline: 'Revised guidance on imposed-load reduction factors for tall buildings',
    description: 'Institution updates practical worked examples for multi-storey load takedowns and reduction factors.',
    published: atToday(6, 30), reason: 'You are applying imposed-load reduction factors on a 22-storey design.',
    url: 'https://example.com/demo/structural-load-reduction' },
  { id: 'n2', source: 'NCE', topic: 'digital',
    headline: 'Parametric-to-analysis workflows cut modelling time on braced frames',
    description: 'Case studies show Grasshopper-to-GSA pipelines reducing manual re-modelling.',
    published: atToday(5, 10), reason: 'Relevant to your Grasshopper + Oasys GSA workflow.',
    url: 'https://example.com/demo/parametric-gsa' },
  { id: 'n3', source: 'The Verge', topic: 'ai',
    headline: 'New wave of AI agents targets repetitive engineering admin',
    description: 'Vendors pitch task automation for document generation and register creation.',
    published: atToday(22, 0, -1), reason: 'Matches your interest in AI agents for engineering admin.',
    url: 'https://example.com/demo/ai-agents-admin' },
  { id: 'n4', source: 'Reuters', topic: 'energy',
    headline: 'Offshore wind pipeline expands with new grid-connection commitments',
    description: 'Developers confirm timelines for several large offshore projects.',
    published: atToday(21, 0, -1), reason: 'Relevant to your interest in energy & infrastructure careers.',
    url: 'https://example.com/demo/offshore-wind' },
  { id: 'n5', source: 'Financial Times', topic: 'finance',
    headline: 'Platform fee comparison: SIPPs, ISAs and LISAs in 2027',
    description: 'A look at how flat-fee vs percentage-fee platforms stack up for smaller portfolios.',
    published: atToday(20, 0, -1), reason: 'Matches your ISA/LISA/SIPP and platform-fee research.',
    url: 'https://example.com/demo/platform-fees' },
  { id: 'n6', source: 'BBC News NI', topic: 'belfast',
    headline: 'Belfast city-centre regeneration scheme reaches next design stage',
    description: 'Waterside development moves forward with revised public-realm proposals.',
    published: atToday(7, 45), reason: 'Local to Belfast and relevant to your project sectors.',
    url: 'https://example.com/demo/belfast-regeneration' },
  { id: 'n7', source: 'Japan Guide', topic: 'japan',
    headline: 'Spring 2027 rail-pass changes: what regional travellers should know',
    description: 'Updated coverage and pricing for regional passes ahead of the spring season.',
    published: atToday(4, 30), reason: 'Useful for your March–April 2027 Japan itinerary.',
    url: 'https://example.com/demo/japan-rail-pass' },
  { id: 'n8', source: 'Dezeen', topic: 'structural',
    headline: 'Mass-timber hybrid frames gain traction for mid-rise offices',
    description: 'Designers report growing appetite for timber-steel hybrids on carbon grounds.',
    published: atToday(23, 30, -2), reason: 'Structural engineering topic in your saved interests.',
    url: 'https://example.com/demo/mass-timber' },
]

// --- Weather (Belfast default) ----------------------------------------------
export const mockWeather = {
  location: 'Belfast',
  current: { tempC: 14, condition: 'Light rain', rainProbability: 70, feelsLikeC: 12, windKph: 18 },
  suggestion: 'Rain likely around your lunch walk — take a jacket and leave a bit early for the 13:00.',
  forecast: [
    { label: 'Now',  tempC: 14, condition: 'Light rain',   rain: 70 },
    { label: '12:00', tempC: 15, condition: 'Showers',      rain: 60 },
    { label: '15:00', tempC: 16, condition: 'Cloudy',       rain: 30 },
    { label: '18:00', tempC: 14, condition: 'Clear',        rain: 10 },
    { label: '21:00', tempC: 12, condition: 'Clear',        rain: 5 },
  ],
}

// --- Quick links (seed data; persisted to localStorage) ---------------------
export const defaultQuickLinks = [
  { id: 'q1', label: 'Queen’s University Belfast', url: 'https://www.qub.ac.uk', group: 'University' },
  { id: 'q2', label: 'Outlook Email', url: 'https://outlook.office.com/mail', group: 'Email' },
  { id: 'q3', label: 'Outlook Calendar', url: 'https://outlook.office.com/calendar', group: 'Calendar' },
  { id: 'q4', label: 'AJ Bell', url: 'https://www.ajbell.co.uk', group: 'Finance' },
  { id: 'q5', label: 'Wanderlog — Japan 2027', url: 'https://wanderlog.com', group: 'Travel planning' },
  { id: 'q6', label: 'MyFitnessPal', url: 'https://www.myfitnesspal.com', group: 'Fitness' },
  { id: 'q7', label: 'Section Studio', url: 'https://github.com', group: 'Personal projects' },
]

export const defaultSettings = {
  name: 'Ben',
  greetingStyle: 'time', // 'time' | 'fixed'
  fixedGreeting: 'Welcome back',
  location: 'Belfast',
  interests: RECOMMENDED_INTERESTS.map(interest => ({ ...interest, active: true })),
  emailCategories: EMAIL_CATEGORIES.map(c => c.id),
  calendar: { showWeekends: true, twentyFourHour: true },
  briefing: { includeCalendar: true, includeEmail: true, includeTasks: true, includeWeather: true, includeNews:true, tone: 'concise' },
  theme: 'light', // 'light' | 'dark'
  cards: {
    // visibility + order for the main dashboard grid
    order: ['calendar', 'email', 'tasks', 'news', 'weather', 'podcasts', 'quicklinks'],
    visible: { calendar: true, email: true, tasks: true, news: true, weather: true, podcasts: true, quicklinks: true },
  },
}

// Where each data service currently stands. Drives the Settings "connections" view.
export const connectionStatus = {
  calendar: 'Connected',   // not_configured | mock | connected | error
  email: 'Connected',
  news: 'connected',
  weather: 'Connected',
  tasks: 'local',     // tasks are genuinely local (localStorage), not mocked-remote
}
