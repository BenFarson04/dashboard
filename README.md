# Command Centre — Personal Productivity Dashboard

A clean, modern personal command centre that brings together your **calendar, relevant
emails, tasks, personalised news, weather, quick links** and an **AI‑style daily
briefing** in one restrained, Notion/Microsoft‑style interface.

> News is refreshed from BBC RSS feeds by GitHub Actions and deployed as a static JSON
> snapshot. No news API key is required; tasks, quick links and settings persist in
> `localStorage`.

---

## Two ways to run it

### 1. Zero‑install preview (fastest look)
**Just double‑click `preview.html`** (or drag it into a browser tab). The JSX is
**pre‑compiled to plain JavaScript**, so there is no in‑browser transpiler — it loads
instantly. It only pulls React, lucide and Tailwind from a CDN, so you need an internet
connection. If anything fails, the page shows the error on screen (never a blank page).

- You do **not** need VS Code Live Server or any extension for this file.
- `localStorage` persistence may be limited when opened directly from `file://`.
  For full persistence, serve it: `npx serve .` or `python3 -m http.server`.
- `preview.html` is **generated** from `src/` by `node scripts/build-preview.mjs` —
  edit the source, not the HTML.

### 2. Full dev project (for continued development)
```bash
npm install
npm run dev      # start Vite dev server (http://localhost:5173)
npm run build    # production build
```

---

## Architecture

```
src/
  main.jsx                 App entry (React + StrictMode)
  App.jsx                  Shell: sidebar + header + page router
  index.css                Tailwind v4 + dark-mode variant + base styles

  data/
    mockData.js            ALL demonstration data (isolated, clearly labelled)

  services/                Data-service abstraction (swap mock → live here only)
    index.js               Registry the UI imports from
    calendarService.js     getEvents()        → Microsoft Graph later
    emailService.js        getRelevantEmails() → Microsoft Graph later
    newsService.js         getNews()           → deployed RSS snapshot
    weatherService.js      getWeather()        → weather API later
    briefingService.js     generateBriefing()  → derives briefing from data (rules)
    _helpers.js            async delay + error simulation

  context/
    AppContext.jsx         Single source of truth: settings, tasks, quick links,
                           email feedback, news save/dismiss, data fetching,
                           loading/error state, theme, navigation, deep-linking

  hooks/
    useLocalStorage.js     Persist state to localStorage

  components/
    ui/                    Reusable primitives (Card, Button, Badge, Chip, Toggle,
                           Modal, StateBoundary, EmptyState, ErrorState, Field, Icon)
    layout/                Sidebar (collapsible + mobile drawer), Header (command bar)
    dashboard/             DailyBriefing, CalendarCard, EmailList, TasksPanel,
                           NewsFeed, WeatherCard, QuickLinks  (each reused on its page)

  pages/                   DashboardPage, Calendar/Email/Tasks/News/Settings pages
```

The `scripts/fetch-news.mjs` build step fetches and normalizes the BBC feeds into
`public/data/news.json` before Vite builds the site.

## News intelligence

The central registry in `src/data/newsConfig.js` contains only verified RSS/Atom
sources with stable IDs, publication names, categories, language, region, trust tier,
and broad default tags. Current sources are BBC News NI, BBC World, BBC Technology, BBC
Business, BBC Science & Environment, The Guardian UK, The Guardian Technology, WIRED,
New Civil Engineer, and Construction News. Utility Week was checked but rejected because
the endpoint returned a 403 HTML page rather than a usable feed. The system does not
scrape ordinary pages or store article text.

Actions fetch enabled feeds concurrently with timeouts and partial-failure handling.
Records are cleaned, validated, deduplicated, retained for 14 days, and capped at 250
items. `news.json` stores schema version, generation time, feed successes/failures,
counts, and the broad article pool. The browser applies the final 12-item limit only
after local interest matching.

Interests are stored in `localStorage` under the existing settings record. Legacy
`newsTopics` settings migrate to the recommended interests. Each interest can be added,
edited, activated, deactivated, or removed in Settings; exact duplicates are rejected.
The deterministic classifier weights exact headline phrases above headline words,
description terms, and weak source/tag context. It records matched terms, scores,
matched interests, method, and version, and never labels a general feed as Belfast by
source alone. Saved and dismissed article IDs remain local browser state.

Classification is intentionally behind an adapter boundary in
`src/services/classificationAdapter.js`. A future server-side or Actions enrichment
step may add labels after deterministic classification, but must remain disabled by
default, keep credentials off the client, and fall back to the deterministic result.

To add a source, verify its URL returns RSS or Atom with `curl -L` and a representative
parse in the agent environment, add its complete registry entry, then run
`npm run news:refresh` and `npm run test:news`. Do not add guessed URLs, HTML pages, or
feed-level narrow tags that the publication does not genuinely imply. To add a
recommended interest or synonym group, update `RECOMMENDED_INTERESTS` or
`INTEREST_SYNONYMS` in `src/data/newsConfig.js` and add a focused classifier assertion.

**Key design decisions**

- **Modular data layer.** Components never call mock data directly — they call services.
  News is fetched outside the browser, normalized by `scripts/fetch-news.mjs`, and
  served from the app's own `data/news.json` path. This avoids RSS CORS and proxy
  availability issues on GitHub Pages.
- **The briefing is generated, not hard‑coded.** `briefingService.generateBriefing()`
  derives sentences from today’s events, the email shortlist, tasks and weather, and
  attaches the **source items** behind each sentence (powering “Why am I seeing this?”
  and deep links). No email/calendar content is sent anywhere.
- **Restrained styling.** Light neutral background, white cards, soft shadows, rounded
  corners, one accent colour (indigo), full dark mode, responsive down to mobile.
- **Accessibility.** Semantic landmarks, keyboard‑navigable command bar and dialogs
  (Esc/arrow keys), `aria-*` labels on icon controls, visible focus rings, skip link.

---

## Feature notes / assumptions

- **Tasks** are genuinely local (CRUD + priority, category, due date, persisted).
- **Emails** show a scored *shortlist* with importance + a per‑item reason; feedback
  controls (useful / not relevant / dealt with) persist to demonstrate preference
  learning. Read/unread and feedback are stored locally.
- **News** uses BBC News NI (`belfast`), BBC Technology (`digital`) and BBC Business
  (`finance`). Live snapshots are labelled live; snapshots retaining stories from a
  failed feed refresh are labelled cached live. Demonstration content is used only
  when the deployed snapshot cannot be loaded.
- **Settings** covers name/greeting, location, news topics, email categories, calendar
  display, card visibility + ordering, theme, briefing preferences, connection status
  and a “force error” switch to preview error states.
- **Belfast** is the default weather location (editable in Settings).

---

## Future integration plan (replacing the mock services)

The UI won’t change — only the service files and an auth layer. Start **read‑only**.

### A. Microsoft identity / OAuth (MSAL)
- Use **`@azure/msal-browser`** (+ `@azure/msal-react`) for delegated sign‑in with PKCE.
- Register an app in **Entra ID**. Client ID/tenant are not secrets; **never** put a
  client secret in the browser. Use `VITE_MSAL_CLIENT_ID` / `VITE_MSAL_TENANT_ID`.
- Store tokens **in memory** via MSAL’s cache; do **not** hand‑roll `localStorage`
  token storage. Acquire tokens silently, falling back to popup/redirect.
- **Keep accounts separated.** Employer (Arup), university (QUB) and personal accounts
  are different tenants — use separate MSAL account contexts and let the user pick which
  account each service uses. Don’t mix data across tenants.

### B. Calendar — Microsoft Graph (read‑only)
- Scope: **`Calendars.Read`** (delegated).
- Call `GET /me/calendarView?startDateTime=…&endDateTime=…&$orderby=start/dateTime`.
- Map each event to the existing shape `{ id, title, start, end, location, online,
  category, prep, details }` inside `calendarService.getEvents()`.

### C. Email — Microsoft Graph (read‑only)
- Scope: **`Mail.Read`** (delegated).
- Call `GET /me/messages?$top=25&$select=from,subject,bodyPreview,receivedDateTime,importance,isRead`.
- Do the “relevant shortlist” scoring client‑side **or** in a backend. Return the
  existing email shape from `emailService.getRelevantEmails()`.
- **Do not** send message content to any AI service in this first version.

### D. News — RSS or news API
- Simplest: a small backend that fetches per‑topic **RSS** feeds, normalises them to the
  existing news shape, and serves JSON (`VITE_NEWS_API_BASE`). Keeps CORS + any keys
  server‑side. Update `newsService.getNews()` to `fetch` that endpoint.

### E. Weather API
- **Open‑Meteo** needs no key and can be called directly from the browser; map its
  response to `{ location, current, suggestion, forecast[] }` in `weatherService`.
- Keyed providers (e.g. OpenWeather) should be proxied via a backend so the key is
  never exposed.

### F. Optional AI‑generated briefing
- Send only the **structured** briefing summary (counts, titles) — never raw email or
  calendar bodies — to an LLM via a **backend** endpoint, behind a setting.
- Keep the model key server‑side. The current rule‑based briefing is the safe default.

### What needs a secure backend
- Any **API key/secret** (news key, weather key, LLM key, MSAL client secret).
- The optional **LLM briefing** call.
- Optional **caching / rate‑limiting** of Graph and news requests.

### Administrator‑consent note
Organisational (Arup/QUB) tenants often require an **admin** to consent to Graph scopes
like `Mail.Read` / `Calendars.Read`. Personal Microsoft accounts usually self‑consent.
Expect to request tenant admin consent for work/university accounts, and design for the
case where consent is refused (show the service as *Not configured* / *Connection error*).

---

## Security posture (this version)
- No credentials or tokens anywhere in the client.
- No email/calendar data leaves the browser; nothing is sent to an AI service.
- All persisted data is local to the browser and can be wiped from **Settings → Reset**.

## Scripts
- `npm run dev` / `npm run build` / `npm run preview` — Vite.
- `npm run news:refresh` — fetch the BBC feeds and update `public/data/news.json`.
- `node scripts/build-preview.mjs` — regenerate the standalone `preview.html`.
- `node scripts/validate.mjs` — syntax‑check every source file + the preview bundle.

Run `npm run test:news` for deterministic relevance, false-positive, normalization,
and unsafe-link checks. GitHub Actions refreshes on pushes to `main`, manual dispatch,
and every three hours. Failed feeds retain their previous source stories; a failed
refresh never deletes the last good snapshot.

## Live news pipeline

GitHub Actions runs the news refresh on pushes to `main`, on manual workflow dispatch,
and every three hours. The deploy job then builds and publishes the generated JSON with
the app. To refresh manually, open **Actions → Deploy to GitHub Pages → Run workflow**.

The sources and topic IDs are deliberately explicit in `scripts/fetch-news.mjs`:
BBC News NI → `belfast`, BBC Technology → `digital`, and BBC Business → `finance`.
Each item is validated, stripped to plain text, deduplicated by URL, sorted by date, and
filtered before the app applies its 12-item limit. A failed feed retains its previous
topic stories and marks the snapshot stale. If the snapshot cannot be loaded at all,
the app uses clearly labelled demonstration data. Add or remove a feed only by changing
the `RSS_FEEDS` configuration and its matching topic ID/source, then run the refresh
script and build locally.
