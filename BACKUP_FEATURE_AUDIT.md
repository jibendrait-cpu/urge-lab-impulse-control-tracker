# Backup Feature Audit

Generated from the current workspace on 2026-04-24.

This file is an intentionally detailed inventory of the app as it exists now. It is meant as a backup reference before future changes, so it includes small UI behaviors, buttons, inputs, localStorage structures, formulas, report behavior, and PWA/cache behavior.

## App Identity

- App name in UI: `Urge Lab`.
- Full title: `Urge Lab - Impulse Control Tracker`.
- Purpose: track impulse/urge episodes, resistance duration, outcomes, triggers, replacement actions, recovery, focus windows, reflection, and practical analytics.
- App type: static browser app/PWA with plain `index.html`, `styles.css`, `app.js`, `manifest.json`, and `service-worker.js`.
- No server-side data storage.
- No account/login.
- No analytics SDK.
- No `package.json`.
- Live Netlify URL: `https://dreamy-concha-1b8a32.netlify.app`.
- Git branch at time of audit: `main`.
- Latest commit before this audit file: `f7a422540b4e2e6ef1c1d2243590d595fd39b212`.

## Source Files Covered

- `index.html`: all app screens, forms, buttons, modals, datalists, PWA metadata, script/style links.
- `styles.css`: light/dark visual system, layout, responsive behavior, buttons, cards, bars, modals, toast.
- `app.js`: full state model, rendering, event handlers, calculations, exports/imports, PWA registration, focus/friction/reminder logic.
- `service-worker.js`: offline caching, fetch strategy, cache updates.
- `manifest.json`: PWA install metadata and icon list.
- `netlify.toml`: static deploy settings, headers, redirects.
- `README.txt`: existing feature blueprint and limitations.
- `PROJECT_HANDOFF.md`: broader handoff document.

## Global UI Structure

- The app is a single-page static app. Navigation switches visible `<section>` panels by toggling the `.active` class.
- The initial visible view is `dashboard`.
- Tabs are plain buttons with `data-view` values.
- The active tab gets `.active`.
- Active view gets `.active`; inactive views are `display: none`.
- A global toast exists at `#toast` with `role="status"` and `aria-live="polite"`.
- Toasts appear by adding `.show` for 2800 ms.
- The layout uses `.app-shell` as the max-width container.
- Main content uses cards, grids, CSS bar rows, and modal sheets.
- On small screens, tabs become a fixed bottom navigation bar.
- On small screens, many grids collapse to one column.

## Header And Install Area

Elements:
- Brand mark: text `UL`.
- Brand text: `Urge Lab`.
- Brand subtitle: `Impulse-control tracker`.
- Current date pill: `#currentDatePill`.
- Install button: `#installBtn`, text `Install app`.
- Hero eyebrow: `Momentary tracking, not habit checklists`.
- Hero heading: `An impulse started. What happened next?`.
- Hero copy explains one-tap start/end and context capture.
- Hero primary CTA: `#startImpulse`, text `Impulse Started`, subtext `Start timer instantly`.

Behaviors:
- `#currentDatePill` is populated by `renderCurrentDate()` as `Today: <AD date> AD / <BS date> BS`.
- `#installBtn` is hidden by default in CSS/inline style.
- On `beforeinstallprompt`, the event is prevented, stored in `deferredPrompt`, and `#installBtn` is shown.
- Clicking `#installBtn` calls `deferredPrompt.prompt()`, waits for `userChoice`, clears `deferredPrompt`, and hides the button.
- Clicking hero `#startImpulse` calls `startBattle()` with the first configured category or `Other`.

## Navigation Tabs

Tabs:
- `Dashboard`: `data-view="dashboard"`.
- `Log`: `data-view="battle"`.
- `History`: `data-view="history"`.
- `Analytics`: `data-view="analytics"`.
- `Focus`: `data-view="focus"`.
- `Reflect`: `data-view="reflection"`.
- `Settings`: `data-view="settings"`.

Behavior:
- Clicking a tab calls `showView(tab.dataset.view)`.
- `showView()` makes the clicked tab active and shows the matching view section.
- It does not change URL/history.
- It does not persist active tab in localStorage.

## Dashboard View

Section id: `#dashboard`.

### Active Battle Card

Container: `#activeBattleCard`.

Default state:
- Has `.hidden`; not visible until an active battle starts.

Displayed fields:
- `#activeCategory`: active category name.
- `#activeStarted`: start timestamp formatted with AD and BS date/time.
- `#activeTimer`: live elapsed timer.
- `#activeReason`: today's pledge/reason.
- `#activeRescuePlan`: matching if-then rescue plan text.

Buttons:
- `.rescue-action[data-action="Breathing"]`: text `Breathe 4-6`.
- `.rescue-action[data-action="Drink water"]`: text `Drink water`.
- `.rescue-action[data-action="Walk"]`: text `Walk`.
- `.rescue-action[data-action="Changed room"]`: text `Change room`.
- `#wonBattle`: text `Won`.
- `#lostBattle`: text `Defeated`.
- `#cancelBattle`: text `Cancel mistaken start`.

Behavior:
- Rescue action buttons only show a toast: `<action> marked as rescue action. Add it in the debrief if it helped.` They do not save data by themselves.
- `#wonBattle` calls `endBattle("won")`.
- `#lostBattle` calls `endBattle("defeated")`.
- `#cancelBattle` calls `cancelBattle()`.
- Active timer updates every second through `battleTimer`.
- Timer display uses `formatDurationMs()`, showing `MM:SS` under one hour and `H:MM:SS` after one hour.
- Starting a second battle while one is already active switches to Dashboard and shows toast `A battle is already active.`.
- Cancel behavior:
  - If elapsed time is over 60 seconds, confirm text is `Cancel this active battle? Use this only for mistaken starts.`
  - If elapsed time is 60 seconds or less, confirm text is `Cancel mistaken start?`
  - If confirmed, timer stops, active battle clears, and card hides.

### Daily Check-In

Container: `.pledge-card`.

Fields:
- `#pledgeDisplay`: current pledge text.
- `#reasonChips`: dynamic buttons for configured reasons.
- `#customPledge`: free-text input placeholder `Write today's reason`.
- `#savePledge`: button `Save reason`.

Default reasons:
- `I want my attention back`.
- `I protect my future self`.
- `I choose calm over impulse`.
- `I keep promises to myself`.

Behavior:
- `renderPledge()` renders each reason as a `.pill` with `data-reason`.
- Clicking a reason chip saves it for today's `dateKey(new Date())`.
- Clicking `#savePledge` saves `#customPledge` if non-empty.
- Empty custom pledge shows toast `Write a reason or choose one.`
- Saved pledge shape: `state.pledges[YYYY-MM-DD] = { text, createdAt }`.
- Today's pledge is used in active battle and focus/friction displays.
- If no pledge exists today, `todaysPledge()` returns first configured reason or `Choose control today.`.

### Dashboard Metrics

Metric IDs:
- `#mTotal`: total sessions.
- `#mWon`: count where `outcome === "won"`.
- `#mLost`: count where `outcome === "defeated"`.
- `#mRate`: win rate as whole percent.
- `#mWonTime`: total duration of won sessions.
- `#mLostTime`: total duration of defeated sessions.
- `#mAvgLostDuration`: defeated duration average.
- `#mQuickCollapse`: defeated sessions with duration under 60 seconds.
- `#mLongest`: longest won session duration.
- `#mSaved`: saved estimate for won sessions.
- `#mCurrentStreak`: current no-defeat streak in days.
- `#mBestStreak`: best no-defeat streak in logged days.
- `#mRecoveryScore`: recovery score.
- `#mTodayScore`: today's battle score.

Behavior:
- Metrics update on every `render()`, which is called after `saveState()`.
- Durations are formatted by `formatDuration()`.
- `formatDuration()` output:
  - Under 60 seconds: `<seconds>s`.
  - Under 60 minutes: rounded minutes as `<mins>m`.
  - One hour or more: `<hours>h` or `<hours>h <mins>m`.

### Won Time Vs Defeated Time

Elements:
- `#wonBar`: CSS width set from won seconds divided by max(wonSeconds, lostSeconds, 1).
- `#lostBar`: CSS width set from lost seconds divided by max(wonSeconds, lostSeconds, 1).

Behavior:
- Bar widths are percentages rounded to whole numbers.
- If no time exists, both bars remain effectively 0 because max is 1.
- Labels explain that won time and defeated time are actual durations.

### Today Pattern

Elements:
- `#todayPattern`.
- `#todayBars`.

Behavior:
- If no sessions today:
  - `#todayPattern` says `No urges logged today yet. Start with one tap when the first impulse appears.`
  - `#todayBars` shows empty message `Today's trigger map will appear here.`
- If sessions exist today:
  - Shows count of urges, wins, defeats, and score formula explanation.
  - `#todayBars` renders source counts for today's sessions.
- Counts include missing sources as `Unknown` because `countBy(today, "source")` is called without `skipEmpty`.

### Recent Sessions

Element:
- `#recentSessions`.

Behavior:
- Shows newest 6 sessions using `renderSessionList(..., false)`.
- Entries include category, outcome badge, dual AD/BS start time, duration, optional place/emotion/source/replacement, and optional notes.
- No delete button appears in recent sessions because `deletable` is false.
- If empty, shows `No sessions yet. When an impulse appears, tap Impulse Started.`

## Log View

Section id: `#battle`.

### Fast Impulse Log

Inputs/buttons:
- `#preCategory`: category select populated dynamically from `state.settings.categories`.
- `#preCustomCategory`: optional custom category text input.
- `#startImpulseLog`: button `Impulse Started`.

Behavior:
- Clicking `#startImpulseLog` calls `startBattle(getSelectedStartCategory())`.
- `startBattle()` then reads `#preCustomCategory` and uses it over selected category if non-empty.
- If custom category is used, it becomes active battle category immediately.
- Custom category is added to settings only later when `setSelectValue("endCategory", activeBattle.category)` runs in `endBattle()` if it is not already present.

### Manual Quick Entry

Form id: `#manualForm`.

Inputs:
- `#manualOutcome`: select with `won` and `defeated`.
- `#manualCategory`: category select populated from settings.
- `#manualDuration`: number input, min `0`, step `1`, default `5`.
- `#manualPlace`: text input with `placeOptions` datalist.
- `#manualEmotion`: text input with `emotionOptions` datalist.
- `#manualSource`: text input with `sourceOptions` datalist.
- `#manualReplacement`: text input with `replacementOptions` datalist.
- `#manualNotes`: textarea.
- Submit button: `Save manual entry`.

Behavior:
- Submit calls `saveManual(event)`.
- Duration minutes are passed through `nonNegative()`.
- End time is current time.
- Start time is calculated as `end - durationMinutes * 60000`.
- `durationSeconds = minutes * 60`.
- `recoveryMinutes` is always `0` for manual entries.
- The form resets after saving.
- The new session is unshifted to the front of `state.sessions`.

## End Battle Modal

Modal id: `#endModal`.

Hidden fields:
- `#endOutcome`.
- `#endStart`.
- `#endEnd`.

Visible fields:
- `#endTitle`.
- `#endSubtitle`.
- `#endCategory`: category select.
- `#placeChips` plus `#customPlace`.
- `#emotionChips` plus `#customEmotion`.
- `#sourceChips` plus `#customSource`.
- `#replacementChips` plus `#customReplacement`.
- `#endRecovery`: number input, min `0`, step `1`, default `0`.
- `#endNotes`: textarea.

Buttons:
- `#saveMinimal`: button `Save minimal`.
- Submit button: `Save with context`.

Behavior:
- `endBattle(outcome)` opens the modal and clears active battle.
- Modal title:
  - Won: `Won. Capture what worked.`
  - Defeated: `Defeated. Capture the chain without shame.`
- Subtitle includes elapsed duration.
- `#saveMinimal` calls `saveEndedBattle(true)`.
- Form submit calls `saveEndedBattle(false)`.
- Minimal save stores blank place/emotion/source/replacement/notes and `recoveryMinutes = 0`.
- Full save uses custom input first, selected chip second, blank last.
- `durationSeconds` is at least `1` second.
- After save, form resets, chip selections clear, modal closes, and state saves.
- There is no explicit close/cancel button on this modal.

Chip behavior:
- Chip buttons are rendered dynamically from settings lists.
- Only one chip per group can be selected.
- Clicking a chip removes `.selected` from all chips with the same `data-chip`, then selects the clicked chip.
- Custom text overrides selected chip value.

## History View

Section id: `#history`.

Inputs/buttons:
- `#filterCategory`: category filter select with `All` plus categories.
- `#filterOutcome`: `All`, `Won`, `Defeated`.
- `#filterFrom`: date input.
- `#filterTo`: date input.
- `#clearAll`: button `Clear all`.
- `#historyList`: rendered session list.

Behavior:
- Date filters use AD browser date input values.
- Filter comparison uses string date keys `YYYY-MM-DD`.
- Filtering criteria:
  - Category matches or category is `all`.
  - Outcome matches or outcome is `all`.
  - From empty or session date >= from.
  - To empty or session date <= to.
- Every filter input/change rerenders history.
- Session entries in history are deletable.
- Delete button calls `deleteSession(sessionId)`.
- Deleting confirms with `Delete this session?`.
- `#clearAll` confirms with `Clear all local sessions, reflections, focus logs, and friction logs? Settings stay in place.`
- Clear all empties `sessions`, `reflections`, `focusLogs`, and `frictionLogs`, but keeps settings and pledges.

## Analytics View

Section id: `#analytics`.

Range buttons:
- `.range-btn[data-range="daily"]`: Daily.
- `.range-btn[data-range="weekly"]`: Weekly.
- `.range-btn[data-range="monthly"]`: Monthly.
- `.range-btn[data-range="yearly"]`: Yearly.

Behavior:
- Current in-memory range is `analyticsRange`, default `daily`.
- Clicking a range button updates `analyticsRange`, toggles active button class, and rerenders analytics.
- Range selection is not saved to localStorage.

Reports/visual blocks:
- `#rangeSummary`: latest period summary tiles.
- `#trendBars`: wins/defeats trend for last 8 groups.
- `#timeTrendBars`: won/lost time trend for last 8 groups.
- `#hourBars`: high-risk hour counts.
- `#categoryBars`: category win rates.
- `#placeBars`: top places.
- `#emotionBars`: top emotions.
- `#sourceBars`: top sources.
- `#replacementBars`: replacement effectiveness.
- `#insightText`: pattern insight text cards.

Range summary behavior:
- Groups sessions by current range.
- Uses the latest sorted group only.
- Shows:
  - `<range> period`.
  - Total urges.
  - Win rate.
  - Won / defeated time.
- Empty state: `No <range> analytics yet. Log an urge or load sample data.`

Trend behavior:
- Uses up to last 8 sorted groups.
- Win/defeat trend values use count of sessions.
- Time trend values use total duration seconds.
- `trendRow()` draws a single CSS bar with green and red gradient sections.
- Trend value for win/defeat trend is win rate.
- Trend value for time trend is total duration for that group.
- Empty states:
  - `No trend data yet.`
  - `No time trend yet.`

Grouping formulas:
- Daily group key: `YYYY-MM-DD`.
- Weekly group key: `<year>-W<weekNumber>`.
- Monthly group key: `<year>-<zero-padded month>`.
- Yearly group key: `<year>`.

High-risk hour behavior:
- Counts every session by `new Date(session.startTime).getHours()`.
- Renders up to 8 rows sorted by count.

Category analysis behavior:
- Iterates over configured categories, not arbitrary session categories only.
- For each category, calculates total sessions and wins.
- Shows only categories with at least 1 session.
- Bar width is category win percentage.
- Value text is win rate.
- Empty state: `No category data yet.`

Top places/emotions/sources behavior:
- Uses `countBy(..., skipEmpty = true)`, so blank fields are ignored.
- Renders top 8 rows by count.
- Empty state: `No data yet.`

Replacement effectiveness behavior:
- Ignores sessions without `replacement`.
- Groups by replacement text.
- Tracks `{ total, wins }`.
- Sorts by `wins / total`, highest first.
- Shows top 8 replacements.
- Bar width and value are replacement win percentage.
- Empty state: `Add replacement actions to see what works.`

Pattern insights behavior:
- Requires at least 3 sessions.
- Empty state under 3 sessions: `Add at least three sessions for practical pattern insights.`
- If defeated sessions exist, risky hour/source/place/emotion are based on defeated sessions; otherwise based on all sessions.
- Potential insights:
  - Most defeats/urges happen around `<hour>:00`.
  - Highest-signal emotion.
  - Highest-signal place.
  - Highest-signal trigger source.
  - Replacement with highest success signal and its percent.
  - Pledge day recovery signal if there are at least 2 sessions on pledge days.
- Insights are plain text, not recommendations generated by AI.

## Focus View

Section id: `#focus`.

### Active Focus Card

Container: `#focusActiveCard`.

Fields:
- `#focusTitle`: displays `<minutes>-minute safe window`.
- `#focusTimer`: countdown timer.
- `#focusReason`: today's pledge.

Buttons:
- `#finishFocus`: `Complete focus window`.
- `#cancelFocus`: `Cancel focus window`.

Behavior:
- Hidden when no `activeFocus`.
- `startFocus(minutes)` creates `activeFocus = { id, startTime, minutes, endAt }`.
- `tickFocus()` updates countdown every second.
- When remaining time hits 0, `closeFocus(true)` is called automatically.
- Completing logs `{ ...activeFocus, completed: true, closedAt }`.
- Cancelling logs `{ ...activeFocus, completed: false, closedAt }`.
- Focus logs are unshifted into `state.focusLogs`.

### Start Protected Window

Buttons/inputs:
- `.focus-start[data-min="15"]`: `15 min`.
- `.focus-start[data-min="30"]`: `30 min`.
- `.focus-start[data-min="60"]`: `60 min`.
- `#customFocus`: number input, min `1`.
- `#startCustomFocus`: `Start custom`.

Behavior:
- Quick buttons call `startFocus(Number(data-min))`.
- Custom button calls `startFocus(Number(customFocus.value))`.
- `startFocus()` clamps to at least 1 minute using `Math.max(1, Math.round(minutes || 0))`.
- Starting focus switches to Focus tab.
- There is no prevention against starting a new focus while one is already active.

### Friction Mode Shortcuts

Elements:
- `#siteShortcuts`: dynamic shortcut grid.
- `#customSiteName`.
- `#customSiteUrl`.
- `#addSite`: `Add gate`.

Default target sites:
- YouTube: `https://www.youtube.com`.
- TikTok: `https://www.tiktok.com`.
- Instagram: `https://www.instagram.com`.
- Shopping: `https://www.amazon.com`.

Behavior:
- `renderFocus()` renders one button per `state.settings.targetSites`.
- Each shortcut has `data-site-index`.
- Clicking a shortcut calls `openFriction(index)`.
- `#addSite` calls `addSite()`.
- `addSite()` requires both name and valid URL; otherwise toast `Add a site name and URL.`
- `normalizeUrl()` adds `https://` if protocol is missing.
- Valid added sites are pushed into `state.settings.targetSites`.
- Name and URL inputs clear after successful add.
- There is no UI to delete target sites currently.

### Friction Modal

Modal id: `#frictionModal`.

Fields:
- `#frictionTitle`: changes to `Pause before <site.name>`.
- `#frictionReason`: today's pledge.
- `#frictionCountdown`: countdown starts at 5.
- `#whyNow`: input for reason.

Buttons:
- `#cancelFriction`: `Cancel`.
- `#continueFriction`: `Continue to site`, initially disabled.

Behavior:
- Opening friction sets `friction = { site, startedAt, remaining: 5 }`.
- Countdown decrements every second.
- Continue button remains disabled until countdown reaches 0.
- Cancel logs `{ ...friction, action: "cancelled", why, closedAt }`.
- Continue logs `{ ...friction, action: "continued", why, closedAt }`.
- Continue opens the target URL with `window.open(url, "_blank", "noopener")`.
- Both cancel and continue close the modal and save state.

### Risk Reminders

Inputs/buttons:
- `#reminderHour`: number input min `0`, max `23`, default `22`.
- `#reminderLabel`: text input.
- `#reminderDay`: select with `all`, Monday through Sunday numeric day values.
- `#enableNotifications`: `Enable notifications`.
- `#addReminder`: `Add reminder`.
- `#reminderList`: rendered reminder list.

Behavior:
- `enableNotifications()` checks for `Notification` support.
- If unsupported, toast `This browser does not support notifications.`
- If supported, calls `Notification.requestPermission()`.
- Toasts `Notifications enabled.` or `Notifications were not enabled.`
- `addReminder()` clamps hour between 0 and 23.
- Empty reminder label becomes `Risk reminder`.
- Reminder shape: `{ id, hour, day, label }`.
- `renderFocus()` shows each reminder with label, day label, hour, and Delete button.
- Reminder Delete calls `deleteReminderById(reminderId)`.
- `scheduleReminders()` clears existing timeouts and schedules next timeout for each reminder.
- `nextReminderDelay()` searches the next 8 days for a matching day/hour in the future.
- `fireReminder()` shows browser notification if permission is granted and always shows a toast.
- Reminders are runtime JavaScript timers only; they are not native background alarms.

## Reflect View

Section id: `#reflection`.

Form id: `#reflectionForm`.

Inputs:
- `#reflectTrigger`: `What triggered me most today?`
- `#reflectHelped`: `What helped most today?`
- `#reflectTomorrow`: `What will I do tomorrow?`
- Submit button: `Save reflection`.

List:
- `#reflectionList`: recent reflections.

Behavior:
- `renderReflections()` finds today's reflection and pre-fills the three inputs if present.
- Submit calls `saveReflection(event)`.
- Saving removes any existing reflection for today and unshifts the new one.
- Reflection shape: `{ id, date, trigger, helped, tomorrow }`.
- `#reflectionList` shows up to 10 reflections.
- Reflection display includes dual AD/BS date and the three prompt answers.
- Empty state: `No reflections saved yet.`

## Settings View

Section id: `#settings`.

### Appearance

Controls:
- `#themeSetting`: select with `light` and `dark`.
- `#saveTheme`: `Save theme`.

Behavior:
- `saveTheme()` stores `"dark"` only if selected value is `dark`; otherwise stores `"light"`.
- `applyTheme()` sets:
  - `document.documentElement.dataset.theme`.
  - `document.documentElement.style.colorScheme`.
  - `meta[name="theme-color"]` to `#0b1220` for dark and `#12213b` for light.
- CSS dark theme is driven by `:root[data-theme="dark"]`.
- Toast says `Theme set to <theme>.`

### Categories And Usual Lost Time

Dynamic list:
- `#categorySettings`.

Per category controls:
- Category name input with `data-cat-name="<index>"`.
- Usual lost minutes input with `data-cat-min="<index>"`, type number, min `1`.
- Inline button with `onclick="saveCategoryEdit(<index>)"`.

Add controls:
- `#newCategoryName`.
- `#newCategoryMinutes`, number min `1`, default `30`.
- `#addCategory`.

Default categories:
- Social media: 45.
- Pornography: 35.
- Junk food: 25.
- Impulsive shopping: 40.
- Gaming: 60.
- Procrastination: 50.
- Other: 30.

Behavior:
- `saveCategoryEdit(index)` updates name and usual minutes.
- Empty category name does nothing.
- Usual minutes default to 30 if invalid, then clamp at min 1.
- `window.saveCategoryEdit = saveCategoryEdit` exists so inline onclick works.
- `addCategory()` requires non-empty name; empty shows toast `Category name required.`
- Duplicate category names are ignored case-insensitively.
- Add clears category name only; it does not clear `newCategoryMinutes`.
- Category deletion does not exist.

### If-Then Rescue Plans

Dynamic list:
- `#planSettings`.

Inputs/buttons:
- `#planCategory`: category select.
- `#planIf`: text input placeholder `scroll in bed`.
- `#planThen`: text input placeholder `stand up and drink water`.
- `#addPlan`: `Add plan`.

Default plans:
- Social media: if `I feel the urge to scroll in bed`, then `I will stand up and drink water`.
- Procrastination: if `I avoid the first task`, then `I will do two minutes only`.

Behavior:
- `addPlan()` requires both if and then text; otherwise toast `Add both if and then text.`
- Plans are pushed into `state.settings.rescuePlans`.
- If/then inputs clear after add.
- Each plan renders with a Delete button.
- Delete calls `deletePlanByIndex(index)` and splices the plan.
- Active battle rescue plan uses first matching category plan, or first plan if none match.
- If no rescue plans exist, `planFor()` returns `No rescue plan yet. Add one in Settings.`

### Quick-Select Lists

Textareas:
- `#placesSetting`.
- `#emotionsSetting`.
- `#sourcesSetting`.
- `#replacementsSetting`.
- `#reasonsSetting`.

Button:
- `#saveLists`: `Save lists`.

Behavior:
- Values are comma-separated.
- `parseList()` trims items, removes blanks, deduplicates with `Set`.
- If a textarea produces no valid items, fallback default list is used.
- Saving updates settings lists and rerenders chips/datalists/reason chips.

Default lists:
- Places: Bed, Office, Toilet, Outside, Study desk, Kitchen, Commute.
- Emotions: Bored, Stressed, Lonely, Tired, Anxious, Angry, Restless.
- Sources: Phone notification, YouTube, TikTok, Memory, Argument, Sexual urge, Scrolling, Idle time.
- Replacements: Drink water, Walk, Breathing, Push-ups, Read, Talked to someone, Closed phone, Changed room, Prayer, Journaling, Music, No replacement used.
- Reasons: I want my attention back, I protect my future self, I choose calm over impulse, I keep promises to myself.

### Data Backup

Controls:
- `#loadSampleData`: `Load sample data`.
- `#exportJson`: `Export JSON backup`.
- `#exportCsv`: `Export CSV`.
- `label[for="importJson"]`: visual `Import JSON backup` button.
- `#importJson`: hidden file input accepting `application/json`.
- `#storageStatus`: status text.

Behavior:
- `#storageStatus` displays `<sessions> sessions, <reflections> reflections, <focusLogs> focus logs stored locally.`
- JSON export downloads `urge-lab-backup.json` containing full `state` pretty-printed.
- CSV export downloads `urge-lab-sessions.csv`.
- Import reads selected JSON file and requires `imported.sessions` to be an array.
- Import merges imported settings over defaults.
- Import replaces current state with imported state.
- Import failure alerts `Import failed: <message>`.
- File input change triggers import.

Sample data behavior:
- If sessions already exist, confirm text is `Add sample data to your existing data? It will not delete your current entries.`
- Adds 12 sessions across current day and previous 8 days.
- Adds both won and defeated entries.
- Adds a pledge for today.
- Adds one reflection for today.
- Adds one completed 30-minute focus log at 8:30 AM today.
- Sorts sessions newest first.
- Switches to Dashboard and shows toast `Sample data loaded. Check Dashboard, History, and Analytics.`

## Datalists And Dynamic Options

Datalists:
- `#placeOptions`.
- `#emotionOptions`.
- `#sourceOptions`.
- `#replacementOptions`.

Dynamic selects:
- `#preCategory`.
- `#manualCategory`.
- `#endCategory`.
- `#planCategory`.
- `#filterCategory`.

Behavior:
- `syncDynamicOptions()` runs on render.
- Category selects preserve current value if possible.
- `filterCategory` always gets `All` plus categories.
- Datalists use current settings lists.
- End modal chips use current settings lists.

## State And localStorage

localStorage keys:
- `urge-lab-complete-v1`: main app state JSON.
- `urge-lab-app-version`: last version seen by current browser; used to trigger service worker update checks.

State object:
- `sessions`: array.
- `pledges`: object keyed by date.
- `reflections`: array.
- `focusLogs`: array.
- `frictionLogs`: array.
- `settings`: object.

Session fields:
- `id`: generated by `crypto.randomUUID()` if available, else timestamp plus random fallback.
- `startTime`: ISO string.
- `endTime`: ISO string.
- `outcome`: `"won"` or `"defeated"`.
- `category`: string.
- `durationSeconds`: number.
- `place`: string.
- `emotion`: string.
- `source`: string.
- `replacement`: string.
- `recoveryMinutes`: number.
- `notes`: string.

Pledge fields:
- Stored by date key.
- Value shape: `{ text, createdAt }`.

Reflection fields:
- `id`.
- `date`: `YYYY-MM-DD`.
- `trigger`.
- `helped`.
- `tomorrow`.

Focus log fields:
- `id`.
- `startTime`.
- `minutes`.
- `endAt`: numeric timestamp in ms.
- `completed`: boolean.
- `closedAt`.

Friction log fields:
- Existing `friction` object is spread into log.
- Includes `site`, `startedAt`, `remaining`, `action`, `why`, `closedAt`.
- `site` contains `{ name, url }`.

Settings fields:
- `categories`: array of `{ name, usualMinutes }`.
- `places`: string array.
- `emotions`: string array.
- `sources`: string array.
- `replacements`: string array.
- `reasons`: string array.
- `rescuePlans`: array of `{ category, ifText, thenText }`.
- `targetSites`: array of `{ name, url }`.
- `reminders`: array of `{ id, hour, day, label }`.
- `theme`: `"light"` or `"dark"`.

Load/save behavior:
- `loadState()` tries to parse localStorage.
- Invalid/missing state falls back to empty arrays and cloned defaults.
- Saved settings are shallow-merged over defaults.
- `saveState()` writes localStorage, calls `render()`, and calls `scheduleReminders()`.

## Formulas And Interpretation Rules

Date key:
- `dateKey(value)` converts date to local `YYYY-MM-DD`.
- Used for today filters, pledge keys, reflection date, and report grouping.

Win rate:
- `pct(won.length, total.length)`.
- Whole number percent, no decimals.
- If total is 0, returns `0%`.

Won time:
- Sum of `durationSeconds` for sessions where `outcome === "won"`.

Defeated time:
- Sum of `durationSeconds` for sessions where `outcome === "defeated"`.

Average defeated duration:
- Defeated time divided by defeated session count.
- If no defeats, 0.

Quick-collapse count:
- Count defeated sessions where `durationSeconds < 60`.

Longest resisted:
- Max duration among won sessions.
- If no won sessions, 0.

Saved estimate:
- For every won session:
  - Get category usual lost minutes with `categoryUsualMinutes(session.category)`.
  - Convert usual minutes to seconds.
  - Add `max(usualSeconds - session.durationSeconds, 0)`.
- Defeated sessions do not contribute to saved estimate.

Today's battle score:
- `wins.length * 10`.
- Minus `defeats.length * 8`.
- Plus `wonMinutes / 5`.
- Plus focus bonus.
- Plus recovery bonus.
- Rounded to nearest integer.
- Clamped at minimum 0.
- Focus bonus is `5` per completed focus log today.
- Recovery bonus is `8` if at least one defeat exists today and a later won session starts after a defeated session's end time.

Recovery score:
- Sessions sorted oldest to newest.
- If no defeats and at least one session, returns 100.
- If no sessions, returns 0.
- For each defeated session:
  - Find next session after that defeat's `endTime`.
  - Add 35 points if next session outcome is won.
  - Add 25 points if next session exists and starts within 24 hours.
  - Add 40 points if defeated session `recoveryMinutes <= 30`.
- Final score is average points per defeat rounded.
- Because each defeat can get 35 + 25 + 40, score can reach 100.

Current no-defeat streak:
- Build set of date keys with defeated sessions.
- Start from today and move backward.
- Count each day until reaching earliest logged session date or a defeat day.
- Days without any sessions still count if they are after earliest logged session and have no defeat.

Best no-defeat streak:
- Uses only distinct days that have sessions.
- Iterates logged days sorted ascending.
- Any day with a defeat resets current streak to 0.
- Any logged day with no defeat increments current streak.
- Best is max current streak.

Trend grouping:
- `daily`: date key.
- `weekly`: year plus ISO-like week number from `weekNumber()`.
- `monthly`: year and zero-padded month.
- `yearly`: year.

Bar rendering:
- `renderBars()` sorts counts descending, takes top 8.
- Width is `max(4, round(count / total * 100))` if total exists.
- This means non-zero values always display at least 4% width.

Replacement ranking:
- Sorts replacements by `wins / total`.
- Does not weight by sample size beyond sorting.

Duration formatting:
- `formatDuration(seconds)` rounds seconds.
- Under 60 seconds: seconds.
- 60 seconds to under 60 minutes: rounded minutes.
- 60 minutes or more: hours and optional remaining minutes.

Nepali date behavior:
- `formatNepaliDate()` prefers `Intl.DateTimeFormat("en-u-ca-nepali")`.
- If unsupported or not resolved to Nepali calendar, uses approximate fallback.
- Fallback maps approximate AD month start dates to BS month names.
- Fallback BS year is AD + 57 after Baisakh start, otherwise AD + 56.

## Export, Import, And Download Behavior

Download helper:
- Creates Blob.
- Creates object URL.
- Creates temporary `<a>`.
- Sets `href` and `download`.
- Calls `link.click()`.
- Revokes object URL.

JSON export:
- Filename: `urge-lab-backup.json`.
- Content type: `application/json`.
- Content: full `state`, pretty JSON.

CSV export:
- Filename: `urge-lab-sessions.csv`.
- Content type: `text/csv`.
- Headers:
  - `startTime`.
  - `endTime`.
  - `outcome`.
  - `category`.
  - `durationSeconds`.
  - `place`.
  - `emotion`.
  - `source`.
  - `replacement`.
  - `recoveryMinutes`.
  - `notes`.
- Values are quoted.
- Double quotes inside values are escaped by doubling them.
- Only sessions are exported to CSV, not pledges/settings/reflections/focus/friction.

JSON import:
- Reads file text.
- Parses JSON.
- Requires `sessions` array.
- Replaces state with imported values and defaults for missing parts.
- Calls `syncSettingsUi()` and `saveState()`.
- Alerts on failure.

## PWA And Offline Behavior

Manifest:
- `name`: `Urge Lab - Impulse Control Tracker`.
- `short_name`: `Urge Lab`.
- `description`: `Track urges, resistance, triggers, battle duration, replacement behavior, and recovery.`
- `start_url`: `./index.html`.
- `scope`: `./`.
- `display`: `standalone`.
- `background_color`: `#fffaf0`.
- `theme_color`: `#14213d`.
- `orientation`: `portrait-primary`.
- Icons:
  - `icons/icon-192.png`, purpose `any`.
  - `icons/icon-512.png`, purpose `any`.
  - `icons/maskable-512.png`, purpose `maskable`.
  - `icons/icon.svg`, sizes `any`, purpose `any maskable`.

Service worker:
- Cache name: `urge-lab-complete-v7-dark-theme`.
- Cached assets:
  - `./`.
  - `./index.html`.
  - `./styles.css?v=20260424-dark-theme-3`.
  - `./app.js?v=20260424-dark-theme-3`.
  - `./manifest.json`.
  - `./icons/icon.svg`.
  - `./icons/icon-192.png`.
  - `./icons/icon-512.png`.
  - `./icons/maskable-512.png`.

Install behavior:
- On install, opens cache and adds all assets.
- Calls `self.skipWaiting()`.

Activate behavior:
- Deletes all caches whose key is not current `CACHE_NAME`.
- Calls `self.clients.claim()`.

Message behavior:
- If message data type is `SKIP_WAITING`, calls `self.skipWaiting()`.

Fetch behavior:
- Ignores non-GET requests.
- Network-first for navigation requests, `/index.html`, `/app.js`, and `/styles.css`.
- On successful network-first response, clones and stores response in current cache using the actual request key.
- On network-first failure, returns matching cached request or falls back to cached `./index.html`.
- Cache-first for other GET requests.
- On cache miss, fetches network, caches clone, and returns response.
- On cache-first network failure, falls back to cached `./index.html`.

App update behavior:
- `APP_VERSION = "2026-04-24-dark-theme-3"`.
- On init, if localStorage `urge-lab-app-version` does not match `APP_VERSION`, registrations are asked to update.
- Then localStorage `urge-lab-app-version` is set to current version.
- Service worker is registered on window load with versioned URL `service-worker.js?v=${APP_VERSION}`.
- Registration option `{ updateViaCache: "none" }` reduces stale HTTP cache issues.
- On `controllerchange`, app reloads once.
- If `registration.waiting` exists, app posts `{ type: "SKIP_WAITING" }`.
- On `updatefound`, if installing worker reaches installed state and a controller exists, waiting worker is told to skip waiting.

## Netlify Behavior

Config:
- Build publish directory: `.`.
- Security headers on all routes:
  - `X-Content-Type-Options = "nosniff"`.
  - `Referrer-Policy = "strict-origin-when-cross-origin"`.
- No-cache headers:
  - `/index.html`.
  - `/service-worker.js`.
- Redirect:
  - `/*` to `/index.html`, status `200`.

Deploy implications:
- Static root files are deployed.
- Since `publish = "."`, avoid putting unwanted files in root unless ignored/not deployed through clean deploy.
- `.netlify/`, zip files, and `urge tracker pwa/` are ignored by Git.
- Manual deploy from root can include `PROJECT_HANDOFF.md` and `BACKUP_FEATURE_AUDIT.md` unless a clean archive folder is used.

## Styling And UI Behaviors

Themes:
- Light theme uses warm paper background, navy hero, amber CTA, green/teal success accents, red warning accents.
- Dark theme changes CSS variables and background gradients.
- `color-scheme` is set for browser form controls.

Layout:
- `.hero` uses rounded large panel with gradient and decorative pseudo-element.
- `.primary-cta` is rotated slightly on desktop and unrotated on smaller screens.
- `.tabs` are sticky at top on desktop and fixed bottom on mobile.
- `.view` panels animate in with `rise`.
- `.card` and `.battle-card` use translucent panels and backdrop blur.
- `.metric-grid` is 4 columns desktop, 2 columns tablet, 1 column small mobile.
- `.split` is 2 columns desktop, 1 column mobile.
- `.shortcut-grid` is 4 columns desktop, 2 columns tablet, 1 column small mobile.
- Modals are fixed overlays, aligned bottom/center with `.sheet`.
- `.sr-only` hides the file input while keeping label button usable.

Button classes:
- `.solid-btn` and `.full-primary`: main dark filled actions.
- `.soft-btn` and `.pill`: secondary rounded controls.
- `.danger-btn`: red destructive action.
- `.link-btn`: transparent underlined action.
- `.win-btn`: green action.
- `.loss-btn`: red action.
- Disabled buttons get opacity 0.55 and `not-allowed` cursor.

Small visual behaviors:
- Inputs get blue focus border and shadow.
- `.tab.active`, `.segmented button.active`, `.chip.selected` change background.
- Badges have separate `won` and `defeated` colors.
- Empty states use dashed card style.
- Toast is centered at bottom.

## Known Missing Or Limited Features

- No dedicated print button.
- No PDF generation.
- No print stylesheet.
- No server sync or cloud backup.
- No account system.
- No data encryption beyond browser storage.
- No target-site delete/edit UI.
- No category delete UI.
- No edit existing session UI.
- No edit existing reflection except resaving today's reflection.
- No undo after delete or clear all.
- No automated tests.
- No build pipeline.
- No app version visible in UI.
- No native background reminders.
- PWA cannot block other apps or system-level browsing.
- Friction mode can open links but cannot enforce blocking.
- Analytics bars are simple DOM/CSS bars, not exportable charts.
- CSV export does not include settings, pledges, focus logs, friction logs, or reflections.

## Files Likely To Change For Future Feature Work

- Add printable/PDF reports: `index.html`, `styles.css`, `app.js`.
- Add visible app version/update button: `index.html`, `app.js`.
- Add target-site delete/edit: `app.js`, maybe `index.html`.
- Add category delete/edit safeguards: `app.js`, maybe `index.html`.
- Add session edit flow: `index.html`, `app.js`, `styles.css`.
- Add test tooling: new `package.json`, possible Playwright test files.
- Change PWA cache behavior: `app.js`, `service-worker.js`, `index.html`, `netlify.toml`.
