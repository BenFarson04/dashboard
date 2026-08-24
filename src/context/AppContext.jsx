import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { useLocalStorage } from '../hooks/useLocalStorage'
import * as services from '../services'
import { generateBriefing } from '../services'
import {
  defaultSettings, defaultTasks, defaultQuickLinks, connectionStatus,
} from '../data/mockData'

const AppContext = createContext(null)

// Small factory for the {data, loading, error} shape shared by every remote-ish service.
const idle = () => ({ data: null, loading: true, error: null })

export function AppProvider({ children }) {
  // ---- Persisted, user-editable state -------------------------------------
  const [settings, setSettings] = useLocalStorage('pd.settings', defaultSettings)
  const [tasks, setTasks] = useLocalStorage('pd.tasks', defaultTasks)
  const [quickLinks, setQuickLinks] = useLocalStorage('pd.quicklinks', defaultQuickLinks)
  const [emailFeedback, setEmailFeedback] = useLocalStorage('pd.emailFeedback', {}) // id -> 'useful'|'not_relevant'|'dealt'
  const [emailRead, setEmailRead] = useLocalStorage('pd.emailRead', {})              // id -> true
  const [savedNews, setSavedNews] = useLocalStorage('pd.savedNews', [])
  const [dismissedNews, setDismissedNews] = useLocalStorage('pd.dismissedNews', [])

  // ---- Ephemeral UI state --------------------------------------------------
  const [page, setPage] = useState('dashboard')
  const [sidebarOpen, setSidebarOpen] = useState(true)      // desktop collapse
  const [mobileNavOpen, setMobileNavOpen] = useState(false) // mobile drawer
  const [focus, setFocus] = useState(null)                  // {type,id} highlighted from briefing/deep-links
  const [failRates, setFailRates] = useState({ calendar: 0, email: 0, news: 0, weather: 0 }) // error-state demo

  // ---- Data services state -------------------------------------------------
  const [calendar, setCalendar] = useState(idle)
  const [emails, setEmails] = useState(idle)
  const [news, setNews] = useState(idle)
  const [weather, setWeather] = useState(idle)

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
    setCalendar(s => ({ ...s, loading: true, error: null }))
    try { setCalendar({ data: await services.calendar.getEvents({ failRate: failRates.calendar }), loading: false, error: null }) }
    catch (e) { setCalendar({ data: null, loading: false, error: e.message }) }
  }, [failRates.calendar])

  const loadEmails = useCallback(async () => {
    setEmails(s => ({ ...s, loading: true, error: null }))
    try { setEmails({ data: await services.email.getRelevantEmails({ failRate: failRates.email }), loading: false, error: null }) }
    catch (e) { setEmails({ data: null, loading: false, error: e.message }) }
  }, [failRates.email])

  const loadNews = useCallback(async () => {
    setNews(s => ({ ...s, loading: true, error: null }))
    try { setNews({ data: await services.news.getNews({ failRate: failRates.news }), loading: false, error: null }) }
    catch (e) { setNews({ data: null, loading: false, error: e.message }) }
  }, [failRates.news])

  const loadWeather = useCallback(async () => {
    setWeather(s => ({ ...s, loading: true, error: null }))
    try { setWeather({ data: await services.weather.getWeather({ location: settings.location, failRate: failRates.weather }), loading: false, error: null }) }
    catch (e) { setWeather({ data: null, loading: false, error: e.message }) }
  }, [settings.location, failRates.weather])

  useEffect(() => { loadCalendar() }, [loadCalendar])
  useEffect(() => { loadEmails() }, [loadEmails])
  useEffect(() => { loadNews() }, [loadNews])
  useEffect(() => { loadWeather() }, [loadWeather])

  const refreshAll = useCallback(() => {
    loadCalendar(); loadEmails(); loadNews(); loadWeather()
  }, [loadCalendar, loadEmails, loadNews, loadWeather])

  // ---- Task actions --------------------------------------------------------
  const addTask = useCallback((t) => setTasks(list => [
    { id: 'u' + Date.now(), completed: false, priority: 'medium', category: 'Personal', due: null, ...t }, ...list,
  ]), [setTasks])
  const updateTask = useCallback((id, patch) => setTasks(list => list.map(t => t.id === id ? { ...t, ...patch } : t)), [setTasks])
  const toggleTask = useCallback((id) => setTasks(list => list.map(t => t.id === id ? { ...t, completed: !t.completed } : t)), [setTasks])
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
  const setEmailFeedbackFor = useCallback((id, value) =>
    setEmailFeedback(m => ({ ...m, [id]: m[id] === value ? undefined : value })), [setEmailFeedback])
  const markEmailRead = useCallback((id) => setEmailRead(m => ({ ...m, [id]: true })), [setEmailRead])

  // ---- News actions --------------------------------------------------------
  const toggleSaveNews = useCallback((id) =>
    setSavedNews(list => list.includes(id) ? list.filter(x => x !== id) : [...list, id]), [setSavedNews])
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
      feedback: emailFeedback[e.id] || null,
    }))
  }, [emails.data, emailRead, emailFeedback])

  // ---- Derived: daily briefing --------------------------------------------
  const briefing = useMemo(() => generateBriefing({
    events: calendar.data || [],
    emails: enrichedEmails || [],
    tasks,
    weather: weather.data,
    prefs: settings.briefing,
  }), [calendar.data, enrichedEmails, tasks, weather.data, settings.briefing])

  const value = {
    // state
    settings, setSettings, tasks, quickLinks, savedNews, dismissedNews,
    page, sidebarOpen, mobileNavOpen, focus, failRates, setFailRates,
    connectionStatus,
    // data
    calendar, emails: { ...emails, data: enrichedEmails }, news, weather, briefing,
    // theme + nav
    toggleTheme, setSidebarOpen, setMobileNavOpen, goTo, setPage,
    // refresh
    refreshAll, loadCalendar, loadEmails, loadNews, loadWeather,
    // tasks
    addTask, updateTask, toggleTask, deleteTask,
    // links
    addLink, updateLink, deleteLink, moveLink,
    // email
    setEmailFeedbackFor, markEmailRead,
    // news
    toggleSaveNews, dismissNews, restoreNews,
  }

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>
}

export function useApp() {
  const ctx = useContext(AppContext)
  if (!ctx) throw new Error('useApp must be used inside <AppProvider>')
  return ctx
}
