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
npm run test:e2e # Playwright health, layout and visual regression tests
```

## Playwright regression tests

The Playwright suite builds and serves the production bundle automatically, then
checks the dashboard at the deployed production shape. It verifies that the page,
sidebar and core cards load, that critical resources do not fail, and that there are
no JavaScript errors. The layout test checks available-width usage, three desktop
columns, card bounds and overlap. Desktop and laptop screenshots are stored in
`tests/dashboard.spec.js-snapshots/` and compared on every run.

Install the browser once, then run locally:

```bash
npx playwright install chromium
npm run test:e2e
```

To test a deployed GitHub Pages build instead of the local production preview, set
`PLAYWRIGHT_BASE_URL`:

```bash
PLAYWRIGHT_BASE_URL=https://benfarson04.github.io/dashboard/ npm run test:e2e
```

When an intentional UI change is made, review the failure artifacts and update both
baselines deliberately with `npm run test:e2e:update`. Run the command at the same
viewport and with the same data/configuration as the test. Failed runs produce a
Playwright report, traces, screenshots and videos in `playwright-report/` and
`test-results/`; open the report with `npx playwright show-report` and inspect the
actual, expected and diff images. For layout failures, first check the card bounds
reported by the layout test and then inspect recent grid, column, width or breakpoint
changes. Do not update baselines to hide a missing card, overflow, overlap or console
error.

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
counts, and the broad article pool. The browser matches the full snapshot locally and
limits only the rendered dashboard preview.

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
- **News** uses the generated snapshot and matches it against each active custom
  interest. Live snapshots are labelled live; snapshots retaining stories from a
  failed feed refresh are labelled cached live. Demonstration content is used only
  when the deployed snapshot cannot be loaded. Articles can be saved for a persistent
  local reading list or pinned; the News page provides Recent News, Saved News, and
  Pinned News views, while pinned articles stay first in the dashboard widget.
- **Settings** covers name/greeting, location, news interests, email categories, calendar
  display, card visibility + ordering, theme, briefing preferences, connection status
  and a “force error” switch to preview error states.
- **Belfast** is the default weather location (editable in Settings).

---

## Multi-provider email

Email uses provider adapters behind `src/services/unifiedEmailService.js`. Gmail and
Microsoft Graph each return the same normalized record, then the aggregator combines
successful providers, ranks the combined set, applies the final eight-item display
limit, and reports provider failures independently. Stable IDs are prefixed with the
provider (`gmail:<id>` or `qub:<id>`), so feedback and read state cannot collide.

The normalized model includes `id`, `provider`, `accountId`, `accountLabel`, sender
name/address, subject, sanitized preview, received date, read/important flags,
categories, relevance score/reasons, and an HTTPS-only `webUrl`. Gmail is marked with
the text label `Gmail` and a green accent; QUB is marked `QUB` and blue. The full Email
page filters All, Gmail, QUB, and the existing local categories. Markers also appear
in daily briefing references. A failed provider leaves the other mailbox visible.

Gmail keeps its existing Google Identity Services flow, but its access token is now
held only in memory by the single app auth hook. The app does not persist Gmail tokens.
Microsoft Authentication Library owns the Microsoft cache and silent acquisition; the
app never reads refresh tokens or puts tokens in URLs. Disconnecting a mailbox clears
the dashboard's connection state only. It does not sign out of the other provider or
globally sign out of Microsoft. Use the browser/Microsoft account controls separately
to clear the library cache or sign out globally.

QUB uses the Microsoft `organizations` authority (work or school accounts), an SPA
redirect, and an explicit account-selection popup. The implementation accepts only
`bfarson01@qub.ac.uk`; a different account is not used to load mail. It requests:

- `User.Read`: identify the selected delegated account.
- `Mail.Read`: read the Inbox's sender, subject, body preview, date, read state,
  importance, and web link. `Mail.ReadBasic` is insufficient because the current UI
  intentionally displays `bodyPreview`; no full body or attachments are requested.

No send, delete, move, archive, write, directory-wide, application, or tenant-wide
permission is requested. Message data is fetched into memory and is not sent to an AI
service. Local storage contains settings, tasks, and user feedback/read preferences;
live message previews and bodies are not cached. Reset all data removes those local
preferences, while disconnecting QUB removes only its in-memory dashboard connection.

### Microsoft Entra setup

The repository cannot register an application in QUB's tenant. Create or obtain a
public Microsoft Entra app registration before testing live QUB mail:

1. Register an application with supported account type **Accounts in any
  organizational directory** (multitenant). Do not create a client secret.
2. Add a **Single-page application** platform with these exact redirect URIs. The
  deployed URI must use the repository's actual GitHub Pages path:
  `http://localhost:5173/dashboard/` and
  `https://<github-owner>.github.io/dashboard/`.
3. Add delegated Microsoft Graph permissions `User.Read` and `Mail.Read`, then save.
  QUB may require an administrator to grant consent; a successful identity login is
  not proof that mailbox access is allowed.
4. Set `VITE_MICROSOFT_CLIENT_ID` to the public Application (client) ID in a local
  `.env.local` file. `.env.local` is ignored by git. For Pages, add the same value as
  the GitHub Actions **repository variable** `VITE_MICROSOFT_CLIENT_ID`; it is an
  identifier, not a secret. The existing Google variable is unchanged.
5. Run `npm run dev`, open the dashboard, go to Settings, and connect QUB. Select the
  intended account in the popup and verify that a real Inbox request succeeds.

If the popup reports `AADSTS65001`, consent is required; approve the requested
delegated permissions if permitted. `AADSTS90094`, `admin_consent_required`, a 403,
or a message that the application is unverified/blocked means QUB policy requires an
administrator or blocks external apps. The legitimate next step is to ask the QUB
service desk/tenant administrator to review and approve the named app, or use an
institution-approved app. Do not bypass the policy or use IMAP/password login. A
cancelled popup, Conditional Access/MFA interruption, expired session, or silent
acquisition failure is reported with its technical code and a reconnect action. If no
client ID is configured, Settings shows a configuration state rather than a blank
page.

To remove consent, revoke the app from the Microsoft account's My Apps/consent page
or ask the tenant administrator to revoke it. Clearing browser site data clears the
MSAL browser cache; global Microsoft sign-out is a separate action.

To add another provider, implement the adapter methods in the provider service,
normalize into the shared model, register it in the unified aggregator, and add its
connection state and marker to Settings. Keep tokens in that provider's maintained
browser auth library and add synthetic tests before enabling it.

### QUB OneDrive

The OneDrive page is a separate, read-only capability on the existing QUB Microsoft
account. It requests only delegated `Files.Read`; this is intentionally separate from
the email connection's `User.Read` and `Mail.Read`. No client secret is required for
this SPA: the public client ID is enough, and MSAL owns its browser token cache.

#### Entra setup and incremental consent

1. Open the existing multitenant Entra app registration used by QUB email.
2. Add delegated Microsoft Graph permission `Files.Read`, then save. Do not add
  `Files.ReadWrite`, `Files.ReadWrite.All`, `Files.Read.All`, `Sites.Read.All`, or
  application permissions. If an existing QUB approval request is pending, update
  that request to include the named delegated `Files.Read` permission rather than
  creating a broader replacement.
3. Keep the existing SPA redirect URIs and `VITE_MICROSOFT_CLIENT_ID` configuration.
  For local testing, put the public ID in `.env.local`; no secret is needed.
4. Run `npm run dev`, open OneDrive, and choose **Allow OneDrive access**. This is a
  user-triggered incremental consent flow; opening the page does not open a popup.
5. Verify that Recent Files loads for the selected `bfarson01@qub.ac.uk` account,
  submit a non-empty search, clear it, and use an item's Graph-provided Open link.

The app does not claim that QUB will approve the permission. `AADSTS65001`,
`admin_consent_required`, a 403, or an application-blocked message means QUB
administrator approval is required. Ask the QUB service desk or tenant administrator
to review/approve the existing app and its delegated `Files.Read` request; never use
password or IMAP workarounds. A 401 means reconnect, while a 404 indicates that the
account may not have a provisioned OneDrive. Network and throttling errors can be
retried. Consent can be revoked from the Microsoft account's My Apps/consent page;
browser site-data clearing removes the MSAL browser cache, and is separate from the
dashboard's capability disconnect control.

Recent and search responses request bounded metadata only: names, IDs, file type,
size, dates, modified-by display name, folder information, and Microsoft's HTTPS
`webUrl`. Normalized metadata is held in memory for the current session only. File
contents, previews, download URLs, tokens, refresh tokens, and filenames are not
stored in localStorage. Disconnecting OneDrive clears its in-memory results without
disconnecting QUB email, Gmail, tasks, or news. Files open in a new browser tab using
the genuine Graph `webUrl`; the dashboard does not launch File Explorer, Word,
Bluebeam, or other desktop applications.

Automated fixtures cover normalization, malformed items, unknown/missing extensions,
unsafe links, pagination, duplicate IDs, and encoded search terms. A real QUB sign-in
and delegated `Files.Read` consent are required to verify live access. After deployment,
also confirm the exact GitHub Pages redirect URI, the OneDrive page navigation, Recent
Files, search/clear, safe external links, and approval-required states in the deployed
`/dashboard/` path.

### Spotify podcast updates

The Podcast Updates card uses Spotify's browser Authorization Code with PKCE flow.
It requests only `user-follow-read` for followed shows and `user-library-read` for
saved shows. The card fetches recent episodes through the official Spotify Web API,
keeps releases from the previous 72 hours, and opens an episode on Spotify. It does
not play audio, request passwords, scrape pages, or send content to an AI service.
Access tokens remain in memory; only the last successful refresh timestamp is stored.

#### Spotify app setup

1. Create an app in the [Spotify Developer Dashboard](https://developer.spotify.com/dashboard) and copy its Client ID. Do not create or use a client secret.
2. Add these Redirect URIs to the app: `http://localhost:5173/dashboard/` and `https://<github-owner>.github.io/dashboard/`.
3. For local development, add `VITE_SPOTIFY_CLIENT_ID=<client-id>` to `.env.local`.
4. For GitHub Pages, add a repository variable named `VITE_SPOTIFY_CLIENT_ID` under Settings → Secrets and variables → Actions → Variables. The client ID is public configuration; never add a client secret.
5. Run `npm run dev`, open Settings → Connected services, connect Spotify, and verify the card appears between Weather and Quick links.

If the client ID is absent, the app remains usable and the card shows its disconnected
setup state. Spotify controls API availability and account access.

## Existing calendar and future service integrations

The UI won’t change — only the service files and an auth layer. Start **read‑only**.

### A. Microsoft identity / OAuth (MSAL)
- Use **`@azure/msal-browser`** for delegated sign‑in with PKCE.
- Register an app in **Entra ID**. Client ID/tenant are not secrets; **never** put a
  client secret in the browser. Use `VITE_MICROSOFT_CLIENT_ID` only.
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
- No passwords, refresh tokens, client secrets, or private keys are stored in the client.
- Provider libraries handle browser token caches; Gmail access tokens are memory-only.
- No email/calendar data leaves the browser; nothing is sent to an AI service.
- All persisted data is local to the browser and can be wiped from **Settings → Reset**.

## Scripts
- `npm run dev` / `npm run build` / `npm run preview` — Vite.
- `npm run news:refresh` — fetch the BBC feeds and update `public/data/news.json`.
- `node scripts/build-preview.mjs` — regenerate the standalone `preview.html`.
- `node scripts/validate.mjs` — syntax‑check every source file + the preview bundle.
- `npm run test:email` — synthetic multi-provider normalization, ranking, and partial-failure tests.
- `npm run test:podcasts` — synthetic Spotify filtering, sorting, formatting, and failure tests.

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
