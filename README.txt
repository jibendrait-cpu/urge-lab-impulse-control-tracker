Urge Lab - Complete Impulse-Control Tracker

Feature blueprint:
- Core flow: one-tap "Impulse Started", live active-battle timer, start timestamp, rescue actions, cancel-with-confirmation, and one-tap Won/Defeated close.
- Quick log: large Urge / Win / Slip actions, pinned/recent/common urge picks, visual urge-family cards, contextual sub-options, intensity chips, duration chips, and optional details.
- Fast context: optional place, mood, trigger source, replacement action, recovery minutes, and notes using chips plus custom inputs.
- Prevention setup: target impulse categories, usual lost time per category, if-then rescue plans, daily pledge/reason reminder, editable quick-select lists.
- Dashboard: total urges, won urges, defeated urges, win rate, total won time, defeated time, longest resisted urge, saved time estimate, current streak, best streak, recovery score, and today's battle score.
- Saved time formula: for each won urge, max(category usual lost minutes - actual urge duration, 0). This is shown in Settings and Dashboard.
- Recovery score: averages post-defeat recovery quality using quick recovery, whether the next urge was won, and whether the user returned within 24 hours.
- Streak logic: days without a defeated urge across all categories.
- Today score formula: wins x10 - defeats x8 + won minutes/5 + focus completion bonus + same-day recovery bonus.
- Analytics: daily/weekly/monthly trends, high-risk hour, category analysis, trigger leaderboards for place/emotion/source, replacement effectiveness, and practical pattern insights.
- Focus layer: protected focus windows, in-app lock screen, countdown, completion logging, and friction-gated target-site shortcuts.
- Reminders: risky-hour reminder setup using browser notifications when permission is granted, plus in-app toast fallback.
- Reflection: three optional end-of-day prompts only.
- Data: localStorage persistence, urge group/subcategory/intensity fields, JSON backup/import, CSV export.
- Accounts: optional Netlify Identity login/signup so each signed-in user gets a separate local cache and cloud-backed state.
- PWA: installable manifest, offline service worker, Netlify static deploy config.

Browser/PWA limitations:
- A pure browser app cannot block other mobile apps, system-wide websites, or device settings.
- Browser notifications are permission-based and most reliable while the browser/app is running; exact background alarms are not guaranteed on all devices.
- The implemented alternative is an in-app focus lock screen, target-site friction gate, countdowns, completion logs, notification permission flow, and local reminder scheduling.

How to run:
1. Open index.html directly in a browser for basic use.
2. For full PWA/offline behavior, run a local static server from this folder:
   npx serve .
   or
   python -m http.server 8080
3. For local account-sync/function testing, run npm install, then use Netlify CLI:
   npx netlify dev
4. Deploy to Netlify for login and sync. Enable Netlify Identity in the site dashboard before testing signup/login.

Files:
- index.html: app shell and pages.
- styles.css: responsive product UI.
- app.js: local data model, calculations, interactions, exports, reminders, focus/friction logic.
- manifest.json: PWA install metadata.
- service-worker.js: offline cache service worker.
- netlify.toml: Netlify static deployment config.
- package.json: Netlify Function dependency and syntax check script.
- netlify/functions/account-state.js: authenticated account-state sync function backed by Netlify Blobs.
- icons/icon.svg: vector app icon.
- icons/icon-192.png, icons/icon-512.png, icons/maskable-512.png: install icons for PWA platforms.

Privacy:
Anonymous data is stored locally in this browser using localStorage. Signed-in account data is also cached locally per user and can sync through Netlify Identity, a Netlify Function, and Netlify Blobs. No analytics SDK is included.
