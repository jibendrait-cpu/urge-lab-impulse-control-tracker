# Project Handoff

Generated from workspace `C:\Users\Dell\Documents\URGE TRACKER` on 2026-04-24.

## A. Project Identity

- App name: Urge Lab - Impulse Control Tracker.
- Purpose: A beginner-friendly static PWA for tracking impulse/urge episodes, outcomes, resistance duration, triggers, replacement actions, focus windows, friction-gated distracting sites, reminders, reflections, and recovery patterns.
- Current live Netlify URL: https://dreamy-concha-1b8a32.netlify.app
- Netlify project: `dreamy-concha-1b8a32`, project ID `d91d652c-c80e-4fa0-8473-9d5dcafec745`.
- GitHub remote: `https://github.com/jibendrait-cpu/urge-lab-impulse-control-tracker.git`
- Branch: `main`.
- Latest app commit before this handoff file: check `git log -1 --oneline`. This file was updated again after the earlier cache-fix work.
- Package manager/build system: static HTML/CSS/JS app plus `package.json` for Netlify Function dependencies. No frontend bundler.

## B. Current Working Status

Already working:
- Static app loads from `index.html` with `styles.css` and `app.js`.
- Main screens work as client-side sections: Dashboard, Log, History, Analytics, Focus, Reflect, Settings.
- Data persists locally in `localStorage`.
- Signed-in accounts can keep a per-user cloud copy through Netlify Identity plus a Netlify Function backed by Netlify Blobs.
- PWA manifest, install prompt, icons, offline service worker, and Netlify static deployment are present.
- Netlify production was manually deployed and verified live after the PWA cache fix.

Recently fixed:
- Browser/PWA cache update issue. `index.html` now references `styles.css?v=20260424-dark-theme-3` and `app.js?v=20260424-dark-theme-3`.
- `app.js` `APP_VERSION` is `2026-04-24-dark-theme-3`.
- Service worker cache was bumped to `urge-lab-complete-v7-dark-theme`.
- Service worker registration now uses `navigator.serviceWorker.register(\`service-worker.js?v=${APP_VERSION}\`, { updateViaCache: "none" })`.
- Account UI was added in Settings and the header. Login/signup uses the Netlify Identity widget loaded from `https://identity.netlify.com/v1/netlify-identity-widget.js`.
- Signed-in users now save to account-specific local keys and can sync to `/.netlify/functions/account-state`.
- `package.json` was added with `@netlify/blobs`, and `netlify/functions/account-state.js` was added for per-user cloud state.
- Asset versions were bumped again: `styles.css?v=20260424-account-sync-1`, `app.js?v=20260424-account-sync-1`, `APP_VERSION = 2026-04-24-account-sync-1`, `CACHE_NAME = urge-lab-complete-v8-account-sync`.
- Log tab was redesigned for low-cognitive-load urge logging. It now uses large `Urge`, `Win`, and `Slip` actions, quick picks, visual urge-family cards, contextual sub-options, simple intensity/duration chips, optional details, and pin/unpin support.
- Asset versions were bumped for the quick urge picker: `styles.css?v=20260426-quick-urge-1`, `app.js?v=20260426-quick-urge-1`, `APP_VERSION = 2026-04-26-quick-urge-1`, `CACHE_NAME = urge-lab-complete-v9-quick-urge`.
- Old duplicate local app folder `urge tracker pwa` was synced with the current root app files, but that folder is ignored by Git.
- `urge-lab-impulse-control-tracker.zip` was rebuilt locally, but it is ignored by Git.

Still broken or uncertain:
- No automated browser test suite exists.
- No print/PDF report feature exists yet.
- Account login and sync require Netlify Identity to be enabled in the Netlify project before production signup/login will work.
- Cloud sync depends on the Netlify Function and Blobs runtime; local `index.html` use remains anonymous/local-only unless served in a Netlify-compatible environment.
- Reminder notifications rely on browser permission and active browser/PWA runtime; background reliability is not guaranteed.
- PWA cannot block other apps or system-wide websites; it only provides an in-app focus window and friction gate.
- Netlify deploy can be done manually with CLI, but the project may also auto-deploy from GitHub if configured in Netlify.
- The current handoff file may create a newer commit than the app commit listed above; check `git log -1` after pulling.

Must be tested manually:
- Open production URL and confirm current UI loads.
- Install/reopen PWA on phone/desktop and confirm the new service worker activates.
- Start an impulse, win/defeat it, save minimal and save with context.
- Add manual entry and verify dashboard/history/analytics update.
- Switch light/dark theme and reload.
- Export/import JSON and export CSV.
- Test offline reload after one successful online load.
- Enable Netlify Identity in the site dashboard, sign up a test user, log in, create data, reload, and confirm data syncs back into the same account.
- Confirm sign-out returns to anonymous local data and does not leak the signed-in account state.
- Test Netlify redeploy after future changes.

## C. Full Feature List

Screens/pages:
- Dashboard: active battle card, daily check-in, metrics, won/defeated time comparison, today pattern, recent sessions.
- Log: 2-second quick logger with Urge/Win/Slip actions, quick picks, visual urge families, contextual sub-options, simple intensity/duration selectors, and optional detail drawer.
- History: category/outcome/date filtering and deletable session list.
- Analytics: daily/weekly/monthly/yearly range summaries, trend bars, high-risk hour, category analysis, top places/emotions/sources, replacement effectiveness, pattern insights.
- Focus: protected focus window, friction mode shortcuts, risk reminders.
- Reflect: end-of-day reflection form and recent reflection list.
- Settings: account and sync, appearance/theme, category usual lost time, if-then rescue plans, quick-select lists, data backup.
- Modals: end battle/debrief modal and friction mode pause modal.

Buttons and actions:
- Header: `Account`, `Install app`.
- Hero/Dashboard: `Impulse Started`, rescue action buttons `Breathe 4-6`, `Drink water`, `Walk`, `Change room`, `Won`, `Defeated`, `Cancel mistaken start`, reason chips, `Save reason`.
- Tabs: `Dashboard`, `Log`, `History`, `Analytics`, `Focus`, `Reflect`, `Settings`.
- Log: `Urge`, `Win`, `Slip`, quick-pick pills, urge-family cards, sub-option chips, `Pin`/`Unpin`, intensity chips, duration chips, `Add details`, `Start urge timer`, `Save win`, `Save slip`.
- History: `Clear all`, per-session `Delete`.
- Analytics: `Daily`, `Weekly`, `Monthly`, `Yearly`.
- Focus: `15 min`, `30 min`, `60 min`, `Start custom`, target-site shortcut buttons, `Add gate`, `Enable notifications`, `Add reminder`, per-reminder `Delete`, `Complete focus window`, `Cancel focus window`.
- Reflect: `Save reflection`.
- Settings: `Log in`, `Create account`, `Log out`, `Sync now`, `Save theme`, per-category `Save`, `Add category`, `Add plan`, per-plan `Delete`, `Save lists`, `Load sample data`, `Export JSON backup`, `Export CSV`, `Import JSON backup`.
- End battle modal: `Save minimal`, `Save with context`.
- Friction modal: `Cancel`, `Continue to site`.

Forms, inputs, dropdowns:
- Daily check-in: `customPledge`.
- Quick logger: hidden compatibility fields `preCategory`, `preCustomCategory`, `manualOutcome`, `manualCategory`, `manualDuration`; visual controls `quickAction`, `quickPickChips`, `urgeGroupGrid`, `subOptionChips`, `intensityChips`, `durationChips`.
- Optional quick-log details: `manualPlace`, `manualEmotion`, `manualSource`, `manualReplacement`, `manualNotes`.
- History filters: `filterCategory`, `filterOutcome`, `filterFrom`, `filterTo`.
- Focus custom: `customFocus`.
- Site gate: `customSiteName`, `customSiteUrl`.
- Reminder: `reminderHour`, `reminderLabel`, `reminderDay`.
- Reflection: `reflectTrigger`, `reflectHelped`, `reflectTomorrow`.
- Theme: `themeSetting`.
- Category settings: dynamic `data-cat-name` and `data-cat-min` inputs.
- New category: `newCategoryName`, `newCategoryMinutes`.
- Rescue plan: `planCategory`, `planIf`, `planThen`.
- Quick-select lists: `placesSetting`, `emotionsSetting`, `sourcesSetting`, `replacementsSetting`, `reasonsSetting`.
- Import: `importJson`.
- End modal: `endOutcome`, `endStart`, `endEnd`, `endCategory`, chip groups for place/emotion/source/replacement, custom fields `customPlace`, `customEmotion`, `customSource`, `customReplacement`, `endRecovery`, `endNotes`.
- Friction modal: `whyNow`.
- Datalists: `placeOptions`, `emotionOptions`, `sourceOptions`, `replacementOptions`.

Dashboard/report/chart elements:
- Metrics: total urges, won urges, defeated urges, win rate, total won time, defeated time, average defeated duration, quick-collapse count, longest resisted, saved estimate, current streak, best streak, recovery score, today's battle score.
- Bars/charts are DOM/CSS bars, not canvas/SVG charts.
- Reports are screen-based only right now; there is no dedicated print/PDF report button or print stylesheet.

localStorage keys and data structures:
- `urge-lab-complete-v1`: main JSON state.
- `urge-lab-complete-v1:account:<userId>`: per-account local cache after sign-in.
- `urge-lab-app-version`: stores last app version seen by the browser for service-worker update checks.
- Stored local entries now use a wrapper object `{ state, updatedAt }` when rewritten by the new save path. Legacy direct-state JSON still loads.
- Main state shape:
  - `sessions`: array of urge sessions.
  - `pledges`: object keyed by AD date `YYYY-MM-DD`, value `{ text, createdAt }`.
  - `reflections`: array of `{ id, date, trigger, helped, tomorrow }`.
  - `focusLogs`: array of focus windows `{ id, startTime, minutes, endAt, completed, closedAt }`.
  - `frictionLogs`: array of gate events containing site, action `cancelled` or `continued`, why text, timestamps.
  - `settings`: object merged with `defaults`.
- Session shape:
  - `{ id, startTime, endTime, outcome, category, urgeGroup, urgeSubcategory, intensity, durationBucket, durationSeconds, place, emotion, source, replacement, recoveryMinutes, notes }`.
- Settings shape:
  - `categories`: array of `{ name, usualMinutes }`.
  - `places`, `emotions`, `sources`, `replacements`, `reasons`: string arrays.
  - `rescuePlans`: array of `{ category, ifText, thenText }`.
  - `targetSites`: array of `{ name, url }`.
  - `pinnedUrges`: string array of pinned quick-pick urge labels.
  - `reminders`: array of `{ id, hour, day, label }`.
  - `theme`: `"light"` or `"dark"`.

PWA/install/offline:
- `manifest.json` uses standalone display, portrait orientation, scope `./`, start URL `./index.html`, and icons in `icons/`.
- `beforeinstallprompt` is captured in `app.js` and shown through `installBtn`.
- `service-worker.js` caches app shell assets and icons.
- External account UI script is loaded from Netlify Identity CDN and is not cached in the local service worker asset list.
- Navigations, `index.html`, `app.js`, and `styles.css` are network-first with offline fallback.
- Other GET requests are cache-first with network fallback.
- `SKIP_WAITING` message, `self.skipWaiting()`, and `clients.claim()` are used to activate updates promptly.

Theme/dark mode:
- Default theme is light in `defaults.theme`.
- User setting is saved as `state.settings.theme`.
- `applyTheme()` sets `document.documentElement.dataset.theme`, `colorScheme`, and the `theme-color` meta tag.
- CSS has `:root` and `:root[data-theme="dark"]` variables.

Print/PDF/report:
- No print/PDF feature exists yet.
- User preference is to make reports printable/PDF-friendly in future work.

## D. File Map

`index.html`
- Purpose: Static app shell, metadata, PWA links, all screen markup, modals, datalists, script/style references.
- Main sections: header hero, tabs, `dashboard`, `battle`, `history`, `analytics`, `focus`, `reflection`, `settings`, `endModal`, `frictionModal`.
- Important IDs: all buttons/forms listed in section C.
- Recent edits: account header button and Settings account/sync card added; Netlify Identity widget script loaded; Log tab replaced with quick urge picker; asset query strings updated to `quick-urge-1`.

`styles.css`
- Purpose: Responsive app styling, CSS variables, light/dark themes, cards, metrics, bars, modals, sticky/fixed mobile tabs.
- Important variables: `--ink`, `--muted`, `--paper`, `--panel`, `--line`, `--navy`, `--blue`, `--teal`, `--green`, `--amber`, `--red`, `--shadow`, `--radius`.
- Main layout classes: `.app-shell`, `.hero`, `.tabs`, `.view`, `.card`, `.battle-card`, `.metric-grid`, `.split`, `.grid-2`, `.grid-3`, `.grid-4`, `.modal`, `.sheet`.
- Recent edits: added account button, account status pill, account facts styling, and quick-logger card/grid/chip styling.

`app.js`
- Purpose: Full client app logic, data model, calculations, rendering, event binding, backup/import/export, reminders, focus/friction, account login hooks, per-user local caches, and sync calls.
- Important constants/variables: `STORE_KEY`, `ACCOUNT_STORE_PREFIX`, `SYNC_ENDPOINT`, `APP_VERSION`, `defaults`, `URGE_GROUPS`, `INTENSITY_OPTIONS`, `DURATION_OPTIONS`, `currentStoreKey`, `currentUser`, `state`, `quickLog`, `activeBattle`, `pendingBattleContext`, `battleTimer`, `activeFocus`, `focusTimer`, `friction`, `frictionTimer`, `deferredPrompt`, `analyticsRange`, `reminderTimers`, `syncTimer`, `syncInFlight`, `syncStatus`.
- Main functions:
  - Lifecycle/PWA/Auth: `init`, `registerServiceWorker`, `bindEvents`, `initIdentity`, `applyAccount`, `openAccountModal`, `logoutAccount`.
  - State: `blankState`, `normalizeState`, `readStoredBundle`, `loadState`, `writeStoredBundle`, `saveState`.
  - Navigation: `showView`.
  - Quick logger: `ensureQuickLogDefaults`, `renderQuickLog`, `selectQuickAction`, `selectQuickPick`, `selectUrgeGroup`, `selectUrgeSub`, `selectIntensity`, `selectDuration`, `togglePinnedUrge`, `selectedUrge`, `urgeFromLabel`, `quickPickItems`, `smartDefaultsFor`, `durationOptionByValue`.
  - Battles: `startBattle`, `tickBattle`, `endBattle`, `cancelBattle`, `saveEndedBattle`, `saveManual`, `deleteSession`, `clearAll`.
  - Rendering: `render`, `renderAccountUi`, `renderDashboard`, `renderTodayPattern`, `renderHistory`, `renderAnalytics`, `renderCurrentDate`, `renderRangeSummary`, `renderTrend`, `renderCategoryAnalysis`, `renderReplacementEffectiveness`, `renderInsights`, `renderFocus`, `renderReflections`, `renderSettings`, `renderPledge`, `renderSessionList`, `renderBars`, `renderChips`.
  - Sync: `scheduleRemoteSync`, `syncAccountState`, `fetchAccountState`, `pushAccountState`, `currentJwt`, `isNewer`.
  - Focus/friction/reminders: `startFocus`, `tickFocus`, `closeFocus`, `addSite`, `openFriction`, `cancelFriction`, `continueFriction`, `enableNotifications`, `addReminder`, `deleteReminderById`, `scheduleReminders`, `fireReminder`, `nextReminderDelay`.
  - Settings: `syncSettingsUi`, `applyTheme`, `syncDynamicOptions`, `savePledge`, `saveCustomPledge`, `todaysPledge`, `saveCategoryEdit`, `addCategory`, `addPlan`, `deletePlanByIndex`, `saveLists`, `saveTheme`.
  - Calculations/helpers: `savedSeconds`, `todayScore`, `recoveryScore`, `currentNoDefeatStreak`, `bestNoDefeatStreak`, `groupSessions`, `trendRow`, `summaryTile`, `countBy`, `hourCounts`, `bestReplacement`, `topEntry`, `parseList`, `nonNegative`, `sum`, `average`, `pct`, date/BS helpers, `normalizeUrl`, `download`, `sessionsToCsv`, `importJson`, `toast`.
- Recent edits: account sync logic added; quick urge picker added; `APP_VERSION` bumped to `2026-04-26-quick-urge-1`; service worker registration still uses versioned URL and `{ updateViaCache: "none" }`.

`netlify/functions/account-state.js`
- Purpose: Authenticated Netlify Function for reading/writing a signed-in user's app state.
- Important behavior: reads Identity claims from Netlify `clientContext`, uses `Authorization: Bearer <jwt>` from the browser, stores JSON in Netlify Blobs store `urge-lab-user-state`.
- Supported methods: `GET` returns `{ state, updatedAt, user }`; `PUT` upserts `{ state, updatedAt }`.

`package.json`
- Purpose: tracks runtime dependency for Netlify Blobs and provides a repo check script.
- Important values: dependency `@netlify/blobs`, script `npm run check`.

`service-worker.js`
- Purpose: Offline cache and update behavior.
- Important constants: `CACHE_NAME = "urge-lab-complete-v9-quick-urge"`, `ASSETS`.
- Main handlers: `message`, `install`, `activate`, `fetch`.
- Recent edits: cache version bumped to v9 and asset query strings updated to `quick-urge-1`.

`manifest.json`
- Purpose: PWA install metadata.
- Important values: `name`, `short_name`, `start_url`, `scope`, `display`, `orientation`, `background_color`, `theme_color`, icon definitions.
- Recent edits: none in latest commit.

`netlify.toml`
- Purpose: Netlify static deployment config.
- Important settings: `[build] publish = "."`; `[functions] directory = "netlify/functions"`; no-cache headers for `/index.html` and `/service-worker.js`; security headers; SPA-style redirect `/*` to `/index.html`.
- Recent edits: explicit functions directory added.

`README.txt`
- Purpose: Human-readable feature blueprint, limitations, run/deploy notes, file list, privacy note.
- Recent edits: updated to mention optional account login, Netlify sync testing, package/function files, and signed-in privacy behavior.

`.gitignore`
- Purpose: Keeps local deploy artifacts out of Git.
- Ignored: `.netlify/`, `node_modules/`, `*.zip`, `urge tracker pwa/`.

`icons/`
- Purpose: PWA icons and SVG favicon.
- Files: `icon.svg`, `icon-192.png`, `icon-512.png`, `maskable-512.png`.

`urge tracker pwa/`
- Purpose: Duplicate local app folder, ignored by Git.
- Status: synced with root files after the cache-fix work, but future source-of-truth edits should be made in root tracked files.

`.netlify/`
- Purpose: Netlify local state and temporary deploy folders, ignored by Git.
- Important local state: `.netlify/state.json` contains site ID `d91d652c-c80e-4fa0-8473-9d5dcafec745`.

`urge-lab-impulse-control-tracker.zip`
- Purpose: Rebuilt manual upload artifact, ignored by Git.
- Status: local convenience artifact only.

## E. Data and Logic

Storage:
- Anonymous use still stores data locally in browser `localStorage`.
- Signed-in use stores an account-specific local cache under `urge-lab-complete-v1:account:<userId>` and syncs that state to Netlify Blobs through `/.netlify/functions/account-state`.
- `readStoredBundle()` supports both legacy raw state and the new wrapped `{ state, updatedAt }` format.
- `saveState()` writes the local bundle, rerenders the app, reschedules reminders, and queues remote sync when a user is signed in.
- Import/export use JSON. CSV export only includes session fields.

Date logic:
- `dateKey()` creates local AD date keys in `YYYY-MM-DD`.
- Display dates show AD and BS. BS uses `Intl.DateTimeFormat("en-u-ca-nepali")` when supported and `adToApproxBs()` fallback otherwise.
- History filters use browser AD date inputs.

Analytics/report calculations:
- Range grouping is done by `groupSessions(sessions, analyticsRange)`.
- Daily key is `YYYY-MM-DD`.
- Weekly key is `YYYY-W<weekNumber>`.
- Monthly key is `YYYY-MM`.
- Yearly key is `YYYY`.
- Range summary uses latest group only.
- Trends show last 8 groups.
- High-risk hour counts `new Date(startTime).getHours()`.
- Category analysis shows win rate per configured category with sessions.
- Replacement effectiveness ranks replacement actions by wins / total uses.
- Top place/emotion/source use simple frequency counts.
- Insights require at least 3 sessions and summarize risky hour, highest-signal emotion/place/source, best replacement success signal, and pledge/recovery signal.

Scores/formulas:
- Win rate: `won / total`.
- Saved estimate: for each won session, `max(category usual lost minutes * 60 - durationSeconds, 0)`.
- Today's battle score: `max(0, round(wins * 10 - defeats * 8 + wonMinutes / 5 + focusBonus + recoveryBonus))`.
- Focus bonus: `5` points per completed focus log today.
- Recovery bonus: `8` if there is a defeat today and a later won session after that defeat.
- Recovery score: per defeat, add `35` if next session after defeat is won, `25` if next session is within 24 hours, `40` if `recoveryMinutes <= 30`; average across defeats. If there are sessions but no defeats, score is `100`; no sessions gives `0`.
- Current no-defeat streak: counts backward from today while no defeated session exists on each day, stopping before the earliest session date.
- Best no-defeat streak: longest run among logged session days without defeated sessions.
- Quick-collapse count: defeated sessions with `durationSeconds < 60`.

Service worker/cache/version update:
- `APP_VERSION` in `app.js` is stored in `localStorage` key `urge-lab-app-version`.
- On version change, existing service worker registrations are asked to update.
- Registration URL is versioned: `service-worker.js?v=${APP_VERSION}`.
- `updateViaCache: "none"` tells the browser not to satisfy service worker update checks from HTTP cache.
- `service-worker.js` uses `CACHE_NAME`; bump it whenever cached assets change.
- `index.html` and `service-worker.js` receive no-cache headers in `netlify.toml`.

Account logic:
- Login/signup UI is handled by the Netlify Identity widget script.
- Each signed-in user gets a separate local cache key and a separate blob entry keyed by Identity user ID.
- Browser requests to `/.netlify/functions/account-state` send a JWT in the `Authorization` header.
- The function reads Identity user data from Netlify `clientContext.user`, with a fallback parser for `clientContext.custom.netlify`.
- Cloud sync is pull-on-login/manual sync and push-after-save with a short debounce.
- If Netlify Identity is not enabled or the function is unavailable, the app stays usable in anonymous local-only mode.

## F. Deployment Status

- Production URL: https://dreamy-concha-1b8a32.netlify.app
- Unique deploy URL from last manual production deploy: `https://69eaebc8c2d6326a0d57db83--dreamy-concha-1b8a32.netlify.app`
- Netlify build/deploy method: static deploy from project root, `publish = "."`.
- Netlify account sync prerequisites: enable Identity in the site dashboard before testing signup/login in production.
- Manual deploy used: clean `git archive` extracted into `.netlify/deploy-850c4ea`, then `npx --yes netlify-cli deploy --prod --dir .netlify\deploy-850c4ea`.
- GitHub push status before handoff file: `main` synced with `origin/main` at `850c4ea`.
- Cache/service-worker issue: fixed by query-string bumps, cache name bump, no-cache headers, `skipWaiting`, `clients.claim`, and `updateViaCache: "none"`.

Exact redeploy steps:
1. Edit tracked root files only.
2. Run `npm run check` or at minimum `node --check app.js` and `node --check netlify/functions/account-state.js`.
3. If JS/CSS changed, bump `APP_VERSION` in `app.js`, asset query strings in `index.html`, and `CACHE_NAME` plus asset query strings in `service-worker.js`.
4. Commit changes: `git add .` then `git commit -m "Clear message"`.
5. Push: `git push origin main`.
6. If Netlify auto-deploy is configured, wait for Netlify build.
7. For manual deploy, run `npx --yes netlify-cli deploy --prod --dir .` or create a clean deploy folder with `git archive` and deploy that folder.
8. Verify production files with `Invoke-WebRequest` or browser devtools.

## G. Known Bugs and Next Steps

Pending issues:
- Add print/PDF-friendly reports; currently absent.
- Add automated smoke tests or at least scripted DOM checks.
- Add a visible app version/build indicator in Settings so users can confirm updates.
- Improve PWA stale-cache recovery UX if an old service worker is still controlling an installed app.
- Consider replacing or abstracting the Netlify Identity widget later if you want a custom auth UI or a provider like Supabase/Auth0.
- Consider adding delete/edit controls for target-site shortcuts; currently sites can be added but not removed through UI.
- Consider adding delete/edit controls for categories with care for existing session references.
- Reminder scheduling is runtime-only; notifications will not be reliable when browser/PWA is fully closed.
- Approximate BS fallback may not be exact for all dates.
- `clearAll()` keeps settings but clears sessions/reflections/focus/friction logs; make sure user understands this before changing behavior.

Priority next tasks:
1. Add printable/PDF report view for dashboard and analytics. Likely files: `index.html`, `styles.css`, `app.js`.
2. Enable and verify Netlify Identity in production, then manually test signup/login/logout/sync across two browsers/devices.
3. Add app version/status display in Settings. Likely files: `index.html`, `app.js`.
4. Add target-site delete/edit UI. Likely files: `app.js`, possibly `index.html`.
5. Add smoke test script or a simple Playwright-based check now that `package.json` exists.

## H. Commands

Install:
- Run `npm install` once if you need the Netlify Function dependency locally.
- Optional static server: use existing Python or `npx serve`.

Run locally:
- Open `index.html` directly for basic use.
- Full local HTTP/PWA behavior: `python -m http.server 8080`
- Alternative: `npx serve .`
- For account sync/function testing: use `npx netlify dev` after `npm install`. The Netlify Identity widget may ask for the site URL on localhost.
- Then open `http://127.0.0.1:8080/`.

Build:
- No frontend build step. Netlify Functions use the dependency from `package.json`.

Test/check:
- JavaScript syntax: `npm run check`
- Git status: `git status --short --branch`
- Netlify status: `npx --yes netlify-cli status`
- Production file check example:
  - `Invoke-WebRequest -Uri https://dreamy-concha-1b8a32.netlify.app/index.html -UseBasicParsing`

Deploy:
- Git push path: `git push origin main`
- Netlify manual production deploy from root: `npx --yes netlify-cli deploy --prod --dir .`
- Safer clean-folder deploy:
  - `git archive --format=zip --output=.netlify\deploy-<hash>.zip HEAD`
  - `Expand-Archive -LiteralPath .netlify\deploy-<hash>.zip -DestinationPath .netlify\deploy-<hash> -Force`
  - `npx --yes netlify-cli deploy --prod --dir .netlify\deploy-<hash>`

VS Code/terminal notes:
- Work from `C:\Users\Dell\Documents\URGE TRACKER`.
- Source of truth is root tracked files, not ignored `urge tracker pwa/`.
- Avoid committing `.netlify/`, zip files, or duplicate ignored folder.

## I. User Preferences

- Keep app beginner-friendly.
- Keep UI simple, scientific, dashboard-based, and practical.
- Do not remove existing functions unless explicitly asked.
- Prefer dropdowns and app-like forms over raw data entry.
- Make reports printable/PDF-friendly.
- Keep Netlify deployment support.
- Keep PWA install/offline support.
- Preserve existing data model unless there is a clear migration path.

## Suggested Prompt For New Codex Session

Read `PROJECT_HANDOFF.md` first, then inspect the current repository before making changes. Continue work on the Urge Lab static PWA in `C:\Users\Dell\Documents\URGE TRACKER`. Preserve existing features and data, keep the UI beginner-friendly and dashboard-based, keep Netlify/PWA support, and do not remove functions unless I explicitly ask. Start by confirming the latest Git status, live Netlify URL, and current app version/cache version before editing.
