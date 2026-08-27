import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import { useLocalStorage } from '../hooks/useLocalStorage'
import * as services from '../services'
import { generateBriefing } from '../services'
import { rankArticles } from '../services/newsRelevance'
import { LEGACY_TOPIC_TO_INTEREST, RECOMMENDED_INTERESTS } from '../data/newsConfig'
import {
  defaultSettings, defaultQuickLinks, connectionStatus,
} from '../data/mockData'
import { TASK_STORAGE_KEY, createTask, migrateTasks, setTaskCompleted, updateTask as updatePersistedTask } from '../services/taskService'
import { useAuth } from '../auth/useAuth'
import { useMicrosoftAuth } from '../auth/useMicrosoftAuth'
import { useSpotifyAuth } from '../auth/useSpotifyAuth'
import { ONEDRIVE_SCOPES } from '../auth/microsoftConfig'
import { articleStateRecord, mergeNewsState, normalizeNewsState, toggleNewsState } from '../services/newsState'


const AppContext = createContext(null)

const LEGACY_DEFAULT_QUICK_LINK_IDS = new Set(['q1', 'q2', 'q3', 'q4', 'q5', 'q6', 'q7'])

const migrateQuickLinks = links => {
  if (!Array.isArray(links)) return defaultQuickLinks
  const currentDefaultIds = new Set(defaultQuickLinks.map(link => link.id))
  const storedById = new Map(links.map(link => [link.id, link]))
  const builtIns = defaultQuickLinks.map(defaultLink => storedById.get(defaultLink.id) || defaultLink)
  const userLinks = links.filter(link => !LEGACY_DEFAULT_QUICK_LINK_IDS.has(link.id) && !currentDefaultIds.has(link.id))
  return [...builtIns, ...userLinks]
}

// Small factory for the {data, loading, error} shape shared by every remote-ish service.
const idle = () => ({ data: null, loading: true, error: null })

export function AppProvider({ children }) {
  // ---- Persisted, user-editable state -------------------------------------
  const { getToken, isSignedIn: gmailConnected, account: gmailAccount, ready: gmailReady, error: gmailError, signIn: gmailSignIn, signOut: gmailSignOut } = useAuth()
  const qubAuth = useMicrosoftAuth()
  const spotifyAuth = useSpotifyAuth()
  const [settings, setSettings] = useLocalStorage('pd.settings', defaultSettings)
  const [tasks, setTasks] = useLocalStorage(TASK_STORAGE_KEY, [], migrateTasks)
  const [quickLinks, setQuickLinks] = useLocalStorage(
    'pd.quicklinks',
    defaultQuickLinks,
    migrateQuickLinks,
  )
  const [emailFeedback, setEmailFeedback] = useLocalStorage('pd.emailFeedback', {}) // id -> 'useful'|'not_relevant'|'dealt'
  const [emailRead, setEmailRead] = useLocalStorage('pd.emailRead', {})              // id -> true
  const [savedNews, setSavedNews] = useLocalStorage('pd.savedNews', [], value => normalizeNewsState(value, 'savedAt'))
  const [pinnedNews, setPinnedNews] = useLocalStorage('pd.pinnedNews', [], value => normalizeNewsState(value, 'pinnedAt'))
  const [dismissedNews, setDismissedNews] = useLocalStorage('pd.dismissedNews', [])
  const [newsFeedback, setNewsFeedback] = useLocalStorage('pd.newsFeedback', {})

  // ---- Ephemeral UI state --------------------------------------------------
  const [page, setPage] = useState('dashboard')
  const [sidebarOpen, setSidebarOpen] = useState(true)      // desktop collapse
  const [mobileNavOpen, setMobileNavOpen] = useState(false) // mobile drawer
  const [focus, setFocus] = useState(null)                  // {type,id} highlighted from briefing/deep-links
  const [failRates, setFailRates] = useState({ calendar: 0, email: 0, news: 0, weather: 0 }) // error-state demo

  // ---- Data services state -------------------------------------------------
  const [calendar, setCalendar] = useState(idle)
  const [emails, setEmails] = useState(() => ({ ...idle(), providers: {} }))
  const [news, setNews] = useState(() => ({ ...idle(), sourceStatus: 'no-data', metadata: null }))
  const [weather, setWeather] = useState(idle)
  const [spotify, setSpotify] = useState(() => ({ ...idle(), loading: false, now: Date.now(), refreshedAt: null }))
  const [oneDrive, setOneDrive] = useState(() => ({ ...idle(), loading: false }))
  const [fund, setFund] = useState(idle)
  const [oneDriveEnabled, setOneDriveEnabled] = useState(false)
  const oneDriveRequest = useRef(0)
  const [spotifyMeta, setSpotifyMeta] = useLocalStorage('pd.spotifyMeta', { lastRefresh: null })

  useEffect(() => {
    if (!Array.isArray(settings.interests)) {
      const activeLegacyIds = new Set((settings.newsTopics || []).map(topic => LEGACY_TOPIC_TO_INTEREST[topic]).filter(Boolean))
      setSettings(s => ({
        ...s,
        interests: RECOMMENDED_INTERESTS.map(interest => ({
          ...interest,
          active: s.newsTopics ? activeLegacyIds.has(interest.id) : true,
        })),
      }))
    }
  }, [settings.interests, settings.newsTopics, setSettings])

  useEffect(() => {
    if (!settings.cards?.order?.includes('podcasts') || !settings.cards?.order?.includes('fund')) {
      setSettings(s => {
        const quickLinksIndex = s.cards.order.indexOf('quicklinks')
        const order = [...s.cards.order]
        const insertAt = quickLinksIndex < 0 ? order.length : order.indexOf('podcasts') >= 0 ? quickLinksIndex : quickLinksIndex
        if (!order.includes('podcasts')) order.splice(insertAt, 0, 'podcasts')
        if (!order.includes('fund')) order.splice(order.indexOf('quicklinks') < 0 ? order.length : order.indexOf('quicklinks'), 0, 'fund')
        return { ...s, cards: { ...s.cards, order, visible: { ...s.cards.visible, podcasts: true, fund: true } } }
      })
    }
  }, [settings.cards, setSettings])

  useEffect(() => {
    if (!news.data?.length) return
    setSavedNews(records => mergeNewsState(records, news.data, 'savedAt'))
    setPinnedNews(records => mergeNewsState(records, news.data, 'pinnedAt'))
  }, [news.data, setSavedNews, setPinnedNews])

  // ---- Theme ---------------------------------------------------------------
  useEffect(() => {
    const root = document.documentElement
    if (settings.theme === 'dark') root.classList.add('dark')
    else root.classList.remove('dark')
  }, [settings.theme])

  const toggleTheme = useCallback(() => {
    setSettings(s => ({ ...s, theme: s.theme === 'dark' ? 'light' : 'dark' }))
  }, [setSettings])

  // ---- Loaders -------------------------------------------------------------
  const loadCalendar = useCallback(async () => {
    // Signed out → show an empty calendar rather than an error.
    if (!gmailConnected) { setCalendar({ data: [], loading: false, error: null }); return }
    setCalendar(s => ({ ...s, loading: true, error: null }))
    try { setCalendar({ data: await services.calendar.getEvents({ getToken }), loading: false, error: null }) }
    catch (e) { setCalendar({ data: null, loading: false, error: e.message }) }
  }, [gmailConnected, getToken])

  const loadEmails = useCallback(async () => {
    setEmails(s => ({ ...s, loading: true, error: null }))
    const result = await services.unifiedEmail.getMessages({
      gmailConnected, getGmailToken: getToken,
      qubConnected: qubAuth.isConnected, acquireQubAccess: qubAuth.acquireAccess, qubAccount: qubAuth.account,
    })
    const providerErrors = Object.fromEntries(Object.entries(result.providers).filter(([, error]) => error).map(([provider, error]) => [provider, error.message]))
    setEmails({ data: result.data, loading: false, error: null, providers: providerErrors })
  }, [gmailConnected, getToken, qubAuth.isConnected, qubAuth.acquireAccess, qubAuth.account])

  const loadNews = useCallback(async () => {
    setNews(s => ({ ...s, loading: true, error: null }))
    try {
      const result = await services.news.getNews({ failRate: failRates.news })
      setNews({ data: result.items, sourceStatus: result.status, metadata: result.metadata, loading: false, error: null })
    }
    catch (e) { setNews({ data: null, loading: false, error: e.message }) }
  }, [failRates.news])

  const loadWeather = useCallback(async () => {
    setWeather(s => ({ ...s, loading: true, error: null }))
    try { setWeather({ data: await services.weather.getWeather({ location: settings.location, failRate: failRates.weather }), loading: false, error: null }) }
    catch (e) { setWeather({ data: null, loading: false, error: e.message }) }
  }, [settings.location, failRates.weather])

  const loadFund = useCallback(async () => {
    setFund(s => ({ ...s, loading: true, error: null }))
    try { setFund({ data: await services.fund.getFundData(), loading: false, error: null }) }
    catch (error) { setFund({ data: null, loading: false, error: error.message }) }
  }, [])

  const loadPodcasts = useCallback(async () => {
    if (!spotifyAuth.isConnected) return
    setSpotify(s => ({ ...s, loading: true, error: null }))
    try {
      const result = await services.podcast.getPodcastUpdates({ accessToken: await spotifyAuth.getToken() })
      setSpotify({ ...result, now: Date.now(), loading: false, error: null })
      setSpotifyMeta({ lastRefresh: result.refreshedAt })
    } catch (error) { setSpotify(s => ({ ...s, loading: false, error: error.message })) }
  }, [spotifyAuth.isConnected, spotifyAuth.getToken, setSpotifyMeta])

  const loadOneDrive = useCallback(async () => {
    if (!oneDriveEnabled || !qubAuth.isConnected) {
      setOneDrive({ data: null, loading: false, error: null })
      return
    }
    const requestId = ++oneDriveRequest.current
    setOneDrive(s => ({ ...s, loading: true, error: null }))
    try {
      const accountId = qubAuth.account?.homeAccountId || qubAuth.account?.localAccountId || qubAuth.account?.username
      const accountLabel = qubAuth.accountEmail || 'QUB'
      const [driveUrl, items] = await Promise.all([
        services.oneDrive.getDrive({ acquireAccess: qubAuth.acquireAccess }),
        services.oneDrive.getRecentFiles({ acquireAccess: qubAuth.acquireAccess, accountId, accountLabel }),
      ])
      if (requestId === oneDriveRequest.current) setOneDrive({ data: { items, driveUrl }, loading: false, error: null })
    } catch (error) {
      if (requestId === oneDriveRequest.current) setOneDrive({ data: null, loading: false, error: error.message, errorCode: error.code })
    }
  }, [oneDriveEnabled, qubAuth.isConnected, qubAuth.account, qubAuth.accountEmail, qubAuth.acquireAccess])

  const searchOneDrive = useCallback(async query => {
    const requestId = ++oneDriveRequest.current
    setOneDrive(s => ({ ...s, loading: true, error: null }))
    try {
      const accountId = qubAuth.account?.homeAccountId || qubAuth.account?.localAccountId || qubAuth.account?.username
      const items = await services.oneDrive.searchFiles({ acquireAccess: qubAuth.acquireAccess, query, accountId, accountLabel: qubAuth.accountEmail || 'QUB' })
      if (requestId === oneDriveRequest.current) setOneDrive(s => ({ ...s, data: { ...(s.data || {}), items }, loading: false, error: null }))
    } catch (error) {
      if (requestId === oneDriveRequest.current) setOneDrive(s => ({ ...s, loading: false, error: error.message, errorCode: error.code }))
    }
  }, [qubAuth.account, qubAuth.accountEmail, qubAuth.acquireAccess])

  const enableOneDrive = useCallback(async () => {
    const connected = await qubAuth.connectWithScopes(ONEDRIVE_SCOPES)
    if (connected) setOneDriveEnabled(true)
    return connected
  }, [qubAuth.connectWithScopes])

  const disconnectOneDrive = useCallback(() => {
    oneDriveRequest.current += 1
    setOneDriveEnabled(false)
    setOneDrive({ data: null, loading: false, error: null })
  }, [])

  useEffect(() => { loadCalendar() }, [loadCalendar])
  useEffect(() => { loadEmails() }, [loadEmails])
  useEffect(() => { loadNews() }, [loadNews])
  useEffect(() => { loadWeather() }, [loadWeather])
  useEffect(() => { loadFund() }, [loadFund])
  useEffect(() => { loadPodcasts() }, [loadPodcasts])
  useEffect(() => { loadOneDrive() }, [loadOneDrive])
  useEffect(() => {
    if (!qubAuth.isConnected) disconnectOneDrive()
  }, [qubAuth.isConnected, disconnectOneDrive])

  const refreshAll = useCallback(() => {
    loadCalendar(); loadEmails(); loadNews(); loadWeather(); loadFund(); loadPodcasts(); loadOneDrive()
  }, [loadCalendar, loadEmails, loadNews, loadWeather, loadFund, loadPodcasts, loadOneDrive])

  // ---- Task actions --------------------------------------------------------
  const addTask = useCallback((t) => setTasks(list => [createTask(t), ...list]), [setTasks])
  const updateTask = useCallback((id, patch) => setTasks(list => list.map(t => t.id === id ? updatePersistedTask(t, patch) : t)), [setTasks])
  const toggleTask = useCallback((id) => setTasks(list => list.map(t => {
    if (t.id !== id) return t
    return setTaskCompleted(t, t.status !== 'completed')
  })), [setTasks])
  const deleteTask = useCallback((id) => setTasks(list => list.filter(t => t.id !== id)), [setTasks])

  // ---- Quick link actions --------------------------------------------------
  const addLink = useCallback((l) => setQuickLinks(list => [...list, { id: 'l' + Date.now(), group: 'Other', ...l }]), [setQuickLinks])
  const updateLink = useCallback((id, patch) => setQuickLinks(list => list.map(l => l.id === id ? { ...l, ...patch } : l)), [setQuickLinks])
  const deleteLink = useCallback((id) => setQuickLinks(list => list.filter(l => l.id !== id)), [setQuickLinks])
  const moveLink = useCallback((id, dir) => setQuickLinks(list => {
    const i = list.findIndex(l => l.id === id)
    if (i < 0) return list
    const j = dir === 'up' ? i - 1 : i + 1
    if (j < 0 || j >= list.length) return list
    const copy = [...list];[copy[i], copy[j]] = [copy[j], copy[i]]; return copy
  }), [setQuickLinks])

  // ---- Email actions -------------------------------------------------------
  const setEmailFeedbackFor = useCallback((email, value) =>
    setEmailFeedback(m => ({ ...m, [email.id]: m[email.id] === value ? undefined : value })), [setEmailFeedback])
  const markEmailRead = useCallback((email) => setEmailRead(m => ({ ...m, [email.id]: true })), [setEmailRead])

  // ---- News actions --------------------------------------------------------
  const toggleSaveNews = useCallback((article) =>
    setSavedNews(list => toggleNewsState(list, article, 'savedAt')), [setSavedNews])
  const togglePinNews = useCallback((article) =>
    setPinnedNews(list => toggleNewsState(list, article, 'pinnedAt')), [setPinnedNews])
  const dismissNews = useCallback((id) =>
    setDismissedNews(list => list.includes(id) ? list : [...list, id]), [setDismissedNews])
  const restoreNews = useCallback((id) =>
    setDismissedNews(list => list.filter(x => x !== id)), [setDismissedNews])

  // ---- Navigation / deep-linking ------------------------------------------
  const goTo = useCallback((nextPage, focusItem = null) => {
    setPage(nextPage); setFocus(focusItem); setMobileNavOpen(false)
    if (focusItem) setTimeout(() => setFocus(null), 2500) // auto-clear highlight
  }, [])

  // ---- Derived: enrich emails with local read/feedback state ---------------
  const enrichedEmails = useMemo(() => {
    if (!emails.data) return emails.data
    return emails.data.map(e => ({
      ...e,
      unread: emailRead[e.id] ? false : e.unread,
      feedback: emailFeedback[e.id] || (e.provider === 'gmail' ? emailFeedback[e.providerMessageId] : null) || null,
    }))
  }, [emails.data, emailRead, emailFeedback])

  // ---- Derived: daily briefing --------------------------------------------
  const briefing = useMemo(() => {
    const interests = settings.interests || RECOMMENDED_INTERESTS.map(interest => ({ ...interest, active: true }))
    const visibleNews = rankArticles(
      (news.data || []).filter(article => !dismissedNews.includes(article.id) && newsFeedback[article.id] !== 'not_relevant'),
      interests,
      null,
      newsFeedback,
    ).filter(article => article.relevanceScore >= 4).slice(0, 5)

    return generateBriefing({
      events: calendar.data || [],
      emails: enrichedEmails || [],
      tasks,
      weather: weather.data,
      news: visibleNews,
      prefs: settings.briefing,
    })
  }, [
    calendar.data,
    enrichedEmails,
    tasks,
    weather.data,
    news.data,
    dismissedNews,
    settings.briefing,
    settings.interests,
    newsFeedback,
  ])

  const personalizedNews = useMemo(() => {
    const ranked = rankArticles(
      news.data || [],
      settings.interests || RECOMMENDED_INTERESTS.map(interest => ({ ...interest, active: true })),
      null,
      newsFeedback,
    )
    const retained = new Map(ranked.map(article => [article.id, article]))
    ;[...savedNews, ...pinnedNews].forEach(record => {
      if (!retained.has(record.id)) retained.set(record.id, record)
    })
    return [...retained.values()]
  }, [news.data, settings.interests, newsFeedback, savedNews, pinnedNews])

  const value = {
    // state
    settings, setSettings, tasks, quickLinks, savedNews, pinnedNews, dismissedNews, newsFeedback,
    page, sidebarOpen, mobileNavOpen, focus, failRates, setFailRates,
    connectionStatus: {
      ...connectionStatus,
      email: gmailConnected || qubAuth.isConnected ? 'connected' : 'not_configured',
      gmail: gmailConnected ? 'connected' : 'not_configured',
      qub: qubAuth.error ? 'error' : qubAuth.isConnected ? 'connected' : qubAuth.configurationReady ? 'not_configured' : 'not_configured',
    },
    emailAccounts: {
      gmail: { connected: gmailConnected, account: gmailAccount, ready: gmailReady, error: gmailError, connect: gmailSignIn, disconnect: gmailSignOut },
      qub: qubAuth,
    },
    spotify: { ...spotify, ...spotifyMeta, ...spotifyAuth, error: spotifyAuth.error || spotify.error, connected: spotifyAuth.isConnected },
    // data
    calendar, emails: { ...emails, data: enrichedEmails }, news: { ...news, data: personalizedNews }, weather, fund, briefing,
    // theme + nav
    toggleTheme, setSidebarOpen, setMobileNavOpen, goTo, setPage,
    // refresh
    refreshAll, loadCalendar, loadEmails, loadNews, loadWeather, loadFund, loadPodcasts, loadOneDrive,
    oneDrive, oneDriveEnabled, enableOneDrive, disconnectOneDrive, searchOneDrive,
    // tasks
    addTask, updateTask, toggleTask, deleteTask,
    // links
    addLink, updateLink, deleteLink, moveLink,
    // email
    setEmailFeedbackFor, markEmailRead,
    // news
    toggleSaveNews, togglePinNews, dismissNews, restoreNews,
    setNewsFeedback: (id, value) => setNewsFeedback(current => ({ ...current, [id]: current[id] === value ? undefined : value })),
  }

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>
}

export function useApp() {
  const ctx = useContext(AppContext)
  if (!ctx) throw new Error('useApp must be used inside <AppProvider>')
  return ctx
}
