const STORE_KEY = "urge-lab-complete-v1";

const defaults = {
  categories: [
    { name: "Social media", usualMinutes: 45 },
    { name: "Pornography", usualMinutes: 35 },
    { name: "Junk food", usualMinutes: 25 },
    { name: "Impulsive shopping", usualMinutes: 40 },
    { name: "Gaming", usualMinutes: 60 },
    { name: "Procrastination", usualMinutes: 50 },
    { name: "Other", usualMinutes: 30 }
  ],
  places: ["Bed", "Office", "Toilet", "Outside", "Study desk", "Kitchen", "Commute"],
  emotions: ["Bored", "Stressed", "Lonely", "Tired", "Anxious", "Angry", "Restless"],
  sources: ["Phone notification", "YouTube", "TikTok", "Memory", "Argument", "Sexual urge", "Scrolling", "Idle time"],
  replacements: ["Drink water", "Walk", "Breathing", "Push-ups", "Read", "Talked to someone", "Closed phone", "Changed room", "Prayer", "Journaling", "Music", "No replacement used"],
  reasons: ["I want my attention back", "I protect my future self", "I choose calm over impulse", "I keep promises to myself"],
  rescuePlans: [
    { category: "Social media", ifText: "I feel the urge to scroll in bed", thenText: "I will stand up and drink water" },
    { category: "Procrastination", ifText: "I avoid the first task", thenText: "I will do two minutes only" }
  ],
  targetSites: [
    { name: "YouTube", url: "https://www.youtube.com" },
    { name: "TikTok", url: "https://www.tiktok.com" },
    { name: "Instagram", url: "https://www.instagram.com" },
    { name: "Shopping", url: "https://www.amazon.com" }
  ],
  reminders: []
};

let state = loadState();
let activeBattle = null;
let battleTimer = null;
let activeFocus = null;
let focusTimer = null;
let friction = null;
let frictionTimer = null;
let deferredPrompt = null;
let analyticsRange = "daily";
let reminderTimers = [];

const $ = id => document.getElementById(id);
const $$ = selector => Array.from(document.querySelectorAll(selector));
const nowISO = () => new Date().toISOString();
const dateKey = date => new Date(date).toISOString().slice(0, 10);
const id = () => crypto.randomUUID ? crypto.randomUUID() : String(Date.now() + Math.random());

function loadState() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORE_KEY));
    return {
      sessions: Array.isArray(saved?.sessions) ? saved.sessions : [],
      pledges: saved?.pledges || {},
      reflections: Array.isArray(saved?.reflections) ? saved.reflections : [],
      focusLogs: Array.isArray(saved?.focusLogs) ? saved.focusLogs : [],
      frictionLogs: Array.isArray(saved?.frictionLogs) ? saved.frictionLogs : [],
      settings: { ...defaults, ...(saved?.settings || {}) }
    };
  } catch {
    return { sessions: [], pledges: {}, reflections: [], focusLogs: [], frictionLogs: [], settings: structuredClone(defaults) };
  }
}

function saveState() {
  localStorage.setItem(STORE_KEY, JSON.stringify(state));
  render();
  scheduleReminders();
}

function init() {
  syncSettingsUi();
  bindEvents();
  scheduleReminders();
  render();
  if ("serviceWorker" in navigator) window.addEventListener("load", () => navigator.serviceWorker.register("service-worker.js"));
}

function bindEvents() {
  $$(".tab").forEach(tab => tab.addEventListener("click", () => showView(tab.dataset.view)));
  $("startImpulse").addEventListener("click", () => startBattle());
  $("startImpulseLog").addEventListener("click", () => startBattle(getSelectedStartCategory()));
  $("wonBattle").addEventListener("click", () => endBattle("won"));
  $("lostBattle").addEventListener("click", () => endBattle("defeated"));
  $("cancelBattle").addEventListener("click", cancelBattle);
  $$(".rescue-action").forEach(btn => btn.addEventListener("click", () => toast(`${btn.dataset.action} marked as rescue action. Add it in the debrief if it helped.`)));
  $("endForm").addEventListener("submit", e => { e.preventDefault(); saveEndedBattle(false); });
  $("saveMinimal").addEventListener("click", () => saveEndedBattle(true));
  $("manualForm").addEventListener("submit", saveManual);
  $("savePledge").addEventListener("click", saveCustomPledge);
  $("clearAll").addEventListener("click", clearAll);
  ["filterCategory", "filterOutcome", "filterFrom", "filterTo"].forEach(id => $(id).addEventListener("input", renderHistory));
  $$(".range-btn").forEach(btn => btn.addEventListener("click", () => {
    analyticsRange = btn.dataset.range;
    $$(".range-btn").forEach(b => b.classList.toggle("active", b === btn));
    renderAnalytics();
  }));
  $$(".focus-start").forEach(btn => btn.addEventListener("click", () => startFocus(Number(btn.dataset.min))));
  $("startCustomFocus").addEventListener("click", () => startFocus(Number($("customFocus").value)));
  $("finishFocus").addEventListener("click", () => closeFocus(true));
  $("cancelFocus").addEventListener("click", () => closeFocus(false));
  $("addSite").addEventListener("click", addSite);
  $("enableNotifications").addEventListener("click", enableNotifications);
  $("addReminder").addEventListener("click", addReminder);
  $("reflectionForm").addEventListener("submit", saveReflection);
  $("addCategory").addEventListener("click", addCategory);
  $("addPlan").addEventListener("click", addPlan);
  $("saveLists").addEventListener("click", saveLists);
  $("exportJson").addEventListener("click", () => download("urge-lab-backup.json", JSON.stringify(state, null, 2), "application/json"));
  $("exportCsv").addEventListener("click", () => download("urge-lab-sessions.csv", sessionsToCsv(), "text/csv"));
  $("importJson").addEventListener("change", importJson);
  $("loadSampleData").addEventListener("click", loadSampleData);
  $("cancelFriction").addEventListener("click", cancelFriction);
  $("continueFriction").addEventListener("click", continueFriction);

  document.body.addEventListener("click", e => {
    const chip = e.target.closest(".chip[data-chip]");
    if (chip) selectChip(chip);
    const del = e.target.closest("[data-delete-session]");
    if (del) deleteSession(del.dataset.deleteSession);
    const deletePlan = e.target.closest("[data-delete-plan]");
    if (deletePlan) deletePlanByIndex(Number(deletePlan.dataset.deletePlan));
    const deleteReminder = e.target.closest("[data-delete-reminder]");
    if (deleteReminder) deleteReminderById(deleteReminder.dataset.deleteReminder);
    const shortcut = e.target.closest("[data-site-index]");
    if (shortcut) openFriction(Number(shortcut.dataset.siteIndex));
    const reason = e.target.closest("[data-reason]");
    if (reason) savePledge(reason.dataset.reason);
  });

  window.addEventListener("beforeinstallprompt", event => {
    event.preventDefault();
    deferredPrompt = event;
    $("installBtn").style.display = "inline-block";
  });
  $("installBtn").addEventListener("click", async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    await deferredPrompt.userChoice;
    deferredPrompt = null;
    $("installBtn").style.display = "none";
  });
}

function showView(view) {
  $$(".tab").forEach(tab => tab.classList.toggle("active", tab.dataset.view === view));
  $$(".view").forEach(panel => panel.classList.toggle("active", panel.id === view));
}

function startBattle(category = state.settings.categories[0]?.name || "Other") {
  if (activeBattle) {
    showView("dashboard");
    toast("A battle is already active.");
    return;
  }
  const custom = $("preCustomCategory")?.value?.trim();
  activeBattle = { id: id(), startTime: nowISO(), category: custom || category };
  $("activeBattleCard").classList.remove("hidden");
  showView("dashboard");
  tickBattle();
  battleTimer = setInterval(tickBattle, 1000);
}

function tickBattle() {
  if (!activeBattle) return;
  const start = new Date(activeBattle.startTime);
  $("activeCategory").textContent = activeBattle.category;
  $("activeStarted").textContent = `Started ${start.toLocaleTimeString([], { hour: "numeric", minute: "2-digit", second: "2-digit" })}`;
  $("activeTimer").textContent = formatDurationMs(Date.now() - start.getTime());
  $("activeReason").textContent = todaysPledge();
  $("activeRescuePlan").textContent = planFor(activeBattle.category);
}

function endBattle(outcome) {
  if (!activeBattle) return;
  const end = nowISO();
  $("endOutcome").value = outcome;
  $("endStart").value = activeBattle.startTime;
  $("endEnd").value = end;
  setSelectValue("endCategory", activeBattle.category);
  $("endTitle").textContent = outcome === "won" ? "Won. Capture what worked." : "Defeated. Capture the chain without shame.";
  $("endSubtitle").textContent = `Duration: ${formatDurationMs(new Date(end) - new Date(activeBattle.startTime))}. Context is optional but improves pattern detection.`;
  clearInterval(battleTimer);
  battleTimer = null;
  activeBattle = null;
  $("activeBattleCard").classList.add("hidden");
  $("endModal").classList.add("active");
}

function cancelBattle() {
  if (!activeBattle) return;
  const elapsed = Date.now() - new Date(activeBattle.startTime).getTime();
  const message = elapsed > 60000 ? "Cancel this active battle? Use this only for mistaken starts." : "Cancel mistaken start?";
  if (!confirm(message)) return;
  clearInterval(battleTimer);
  battleTimer = null;
  activeBattle = null;
  $("activeBattleCard").classList.add("hidden");
}

function saveEndedBattle(minimal) {
  const start = $("endStart").value;
  const end = $("endEnd").value;
  const session = {
    id: id(),
    startTime: start,
    endTime: end,
    outcome: $("endOutcome").value,
    category: $("endCategory").value || "Other",
    durationSeconds: Math.max(1, Math.round((new Date(end) - new Date(start)) / 1000)),
    place: minimal ? "" : selectedOrCustom("place", "customPlace"),
    emotion: minimal ? "" : selectedOrCustom("emotion", "customEmotion"),
    source: minimal ? "" : selectedOrCustom("source", "customSource"),
    replacement: minimal ? "" : selectedOrCustom("replacement", "customReplacement"),
    recoveryMinutes: minimal ? 0 : nonNegative($("endRecovery").value),
    notes: minimal ? "" : $("endNotes").value.trim()
  };
  state.sessions.unshift(session);
  $("endForm").reset();
  clearChipSelections();
  $("endModal").classList.remove("active");
  saveState();
}

function saveManual(event) {
  event.preventDefault();
  const mins = nonNegative($("manualDuration").value);
  const end = new Date();
  const start = new Date(end.getTime() - mins * 60000);
  state.sessions.unshift({
    id: id(),
    startTime: start.toISOString(),
    endTime: end.toISOString(),
    outcome: $("manualOutcome").value,
    category: $("manualCategory").value || "Other",
    durationSeconds: mins * 60,
    place: $("manualPlace").value.trim(),
    emotion: $("manualEmotion").value.trim(),
    source: $("manualSource").value.trim(),
    replacement: $("manualReplacement").value.trim(),
    recoveryMinutes: 0,
    notes: $("manualNotes").value.trim()
  });
  event.target.reset();
  saveState();
}

function loadSampleData() {
  if (state.sessions.length && !confirm("Add sample data to your existing data? It will not delete your current entries.")) return;
  const day = daysBack => {
    const date = new Date();
    date.setDate(date.getDate() - daysBack);
    return date;
  };
  const at = (daysBack, hour, minute, durationMinutes) => {
    const start = day(daysBack);
    start.setHours(hour, minute, 0, 0);
    const end = new Date(start.getTime() + durationMinutes * 60000);
    return { startTime: start.toISOString(), endTime: end.toISOString(), durationSeconds: durationMinutes * 60 };
  };
  const samples = [
    { ...at(0, 22, 18, 14), outcome: "won", category: "Social media", place: "Bed", emotion: "Bored", source: "YouTube", replacement: "Changed room", recoveryMinutes: 3, notes: "Left phone on desk and drank water." },
    { ...at(0, 16, 40, 7), outcome: "won", category: "Junk food", place: "Kitchen", emotion: "Stressed", source: "Idle time", replacement: "Walk", recoveryMinutes: 2, notes: "Walked outside before eating." },
    { ...at(1, 23, 5, 28), outcome: "defeated", category: "Social media", place: "Bed", emotion: "Tired", source: "TikTok", replacement: "No replacement used", recoveryMinutes: 45, notes: "Late-night phone in bed is risky." },
    { ...at(1, 9, 20, 6), outcome: "won", category: "Procrastination", place: "Study desk", emotion: "Anxious", source: "Idle time", replacement: "Breathing", recoveryMinutes: 4, notes: "Two-minute start helped." },
    { ...at(2, 21, 50, 18), outcome: "won", category: "Pornography", place: "Toilet", emotion: "Lonely", source: "Sexual urge", replacement: "Prayer", recoveryMinutes: 8, notes: "Used rescue plan and left the room." },
    { ...at(3, 14, 10, 12), outcome: "defeated", category: "Impulsive shopping", place: "Office", emotion: "Stressed", source: "Phone notification", replacement: "No replacement used", recoveryMinutes: 30, notes: "Notification triggered browsing." },
    { ...at(3, 18, 30, 9), outcome: "won", category: "Gaming", place: "Study desk", emotion: "Restless", source: "Memory", replacement: "Push-ups", recoveryMinutes: 5, notes: "Moved energy physically." },
    { ...at(4, 22, 30, 16), outcome: "won", category: "Social media", place: "Bed", emotion: "Bored", source: "Scrolling", replacement: "Closed phone", recoveryMinutes: 2, notes: "Closed phone before opening app loop." },
    { ...at(5, 12, 15, 5), outcome: "won", category: "Junk food", place: "Kitchen", emotion: "Tired", source: "Idle time", replacement: "Drink water", recoveryMinutes: 1, notes: "Water reduced intensity." },
    { ...at(6, 23, 45, 35), outcome: "defeated", category: "Pornography", place: "Bed", emotion: "Lonely", source: "Sexual urge", replacement: "No replacement used", recoveryMinutes: 60, notes: "Need phone outside bedroom." },
    { ...at(7, 10, 5, 8), outcome: "won", category: "Procrastination", place: "Study desk", emotion: "Anxious", source: "Idle time", replacement: "Journaling", recoveryMinutes: 6, notes: "Wrote the first next action." },
    { ...at(8, 20, 25, 11), outcome: "won", category: "Gaming", place: "Office", emotion: "Restless", source: "YouTube", replacement: "Read", recoveryMinutes: 4, notes: "Read one chapter instead." }
  ].map(sample => ({ id: id(), ...sample }));

  state.sessions = [...samples, ...state.sessions].sort((a, b) => new Date(b.startTime) - new Date(a.startTime));
  const today = dateKey(new Date());
  state.pledges[today] = { text: "I want my attention back", createdAt: nowISO() };
  state.reflections.unshift({
    id: id(),
    date: today,
    trigger: "Boredom and phone in bed",
    helped: "Changing room, walking, and closing phone",
    tomorrow: "Keep phone away from bed after 10 PM"
  });
  const focusStart = new Date();
  focusStart.setHours(8, 30, 0, 0);
  state.focusLogs.unshift({
    id: id(),
    startTime: focusStart.toISOString(),
    minutes: 30,
    endAt: focusStart.getTime() + 30 * 60000,
    completed: true,
    closedAt: new Date(focusStart.getTime() + 30 * 60000).toISOString()
  });
  saveState();
  showView("dashboard");
  toast("Sample data loaded. Check Dashboard, History, and Analytics.");
}

function render() {
  syncDynamicOptions();
  renderPledge();
  renderDashboard();
  renderHistory();
  renderAnalytics();
  renderFocus();
  renderReflections();
  renderSettings();
  $("storageStatus").textContent = `${state.sessions.length} sessions, ${state.reflections.length} reflections, ${state.focusLogs.length} focus logs stored locally.`;
}

function renderDashboard() {
  const s = state.sessions;
  const won = s.filter(x => x.outcome === "won");
  const lost = s.filter(x => x.outcome === "defeated");
  const wonSeconds = sum(won, "durationSeconds");
  const lostSeconds = sum(lost, "durationSeconds");
  const saved = savedSeconds(won);
  const today = s.filter(x => dateKey(x.startTime) === dateKey(new Date()));
  const score = todayScore(today);
  $("mTotal").textContent = s.length;
  $("mWon").textContent = won.length;
  $("mLost").textContent = lost.length;
  $("mRate").textContent = pct(won.length, s.length);
  $("mWonTime").textContent = formatDuration(wonSeconds);
  $("mLostTime").textContent = formatDuration(lostSeconds);
  $("mLongest").textContent = formatDuration(Math.max(0, ...won.map(x => x.durationSeconds || 0)));
  $("mSaved").textContent = formatDuration(saved);
  $("mCurrentStreak").textContent = `${currentNoDefeatStreak()}d`;
  $("mBestStreak").textContent = `${bestNoDefeatStreak()}d`;
  $("mRecoveryScore").textContent = recoveryScore();
  $("mTodayScore").textContent = score;
  const maxTime = Math.max(wonSeconds, lostSeconds, 1);
  $("wonBar").style.width = `${Math.round(wonSeconds / maxTime * 100)}%`;
  $("lostBar").style.width = `${Math.round(lostSeconds / maxTime * 100)}%`;
  renderTodayPattern(today);
  $("recentSessions").innerHTML = renderSessionList(s.slice(0, 6), false);
}

function renderTodayPattern(today) {
  if (!today.length) {
    $("todayPattern").textContent = "No urges logged today yet. Start with one tap when the first impulse appears.";
    $("todayBars").innerHTML = `<div class="empty">Today's trigger map will appear here.</div>`;
    return;
  }
  const wins = today.filter(x => x.outcome === "won").length;
  const losses = today.length - wins;
  $("todayPattern").textContent = `${today.length} urge${today.length === 1 ? "" : "s"} today: ${wins} won, ${losses} defeated. Score formula: wins x10 - defeats x8 + won minutes/5 + recovery bonus + focus completions.`;
  renderBars("todayBars", countBy(today, "source"), today.length);
}

function renderHistory() {
  const category = $("filterCategory").value || "all";
  const outcome = $("filterOutcome").value || "all";
  const from = $("filterFrom").value;
  const to = $("filterTo").value;
  const filtered = state.sessions.filter(s => {
    const d = dateKey(s.startTime);
    return (category === "all" || s.category === category) &&
      (outcome === "all" || s.outcome === outcome) &&
      (!from || d >= from) &&
      (!to || d <= to);
  });
  $("historyList").innerHTML = renderSessionList(filtered, true);
}

function renderAnalytics() {
  const sessions = state.sessions;
  renderTrend(sessions);
  renderBars("hourBars", hourCounts(sessions), sessions.length);
  renderCategoryAnalysis(sessions);
  renderBars("placeBars", countBy(sessions, "place", true), sessions.length);
  renderBars("emotionBars", countBy(sessions, "emotion", true), sessions.length);
  renderBars("sourceBars", countBy(sessions, "source", true), sessions.length);
  renderReplacementEffectiveness(sessions);
  renderInsights(sessions);
}

function renderTrend(sessions) {
  const groups = groupSessions(sessions, analyticsRange);
  const labels = Object.keys(groups).sort().slice(-8);
  if (!labels.length) {
    $("trendBars").innerHTML = `<div class="empty">No trend data yet.</div>`;
    $("timeTrendBars").innerHTML = `<div class="empty">No time trend yet.</div>`;
    return;
  }
  const maxCount = Math.max(1, ...labels.map(k => groups[k].length));
  $("trendBars").innerHTML = labels.map(label => {
    const won = groups[label].filter(s => s.outcome === "won").length;
    const lost = groups[label].length - won;
    return trendRow(label, won, lost, maxCount, `${pct(won, won + lost)}`);
  }).join("");
  const maxTime = Math.max(1, ...labels.map(k => sum(groups[k], "durationSeconds")));
  $("timeTrendBars").innerHTML = labels.map(label => {
    const wonTime = sum(groups[label].filter(s => s.outcome === "won"), "durationSeconds");
    const lostTime = sum(groups[label].filter(s => s.outcome === "defeated"), "durationSeconds");
    return trendRow(label, wonTime, lostTime, maxTime, formatDuration(wonTime + lostTime));
  }).join("");
}

function renderCategoryAnalysis(sessions) {
  const rows = state.settings.categories.map(cat => {
    const items = sessions.filter(s => s.category === cat.name);
    const wins = items.filter(s => s.outcome === "won").length;
    return [cat.name, items.length, wins, pct(wins, items.length)];
  }).filter(row => row[1] > 0).sort((a, b) => b[1] - a[1]);
  $("categoryBars").innerHTML = rows.length ? rows.map(([name, total, wins, rate]) => `
    <div class="bar-row"><span>${esc(name)}</span><div class="bar"><i style="width:${Math.round(wins / total * 100)}%"></i></div><strong>${rate}</strong></div>
  `).join("") : `<div class="empty">No category data yet.</div>`;
}

function renderReplacementEffectiveness(sessions) {
  const map = {};
  sessions.forEach(s => {
    if (!s.replacement) return;
    map[s.replacement] ||= { total: 0, wins: 0 };
    map[s.replacement].total += 1;
    if (s.outcome === "won") map[s.replacement].wins += 1;
  });
  const rows = Object.entries(map).sort((a, b) => (b[1].wins / b[1].total) - (a[1].wins / a[1].total)).slice(0, 8);
  $("replacementBars").innerHTML = rows.length ? rows.map(([name, data]) => {
    const rate = Math.round(data.wins / data.total * 100);
    return `<div class="bar-row"><span>${esc(name)}</span><div class="bar"><i style="width:${rate}%"></i></div><strong>${rate}%</strong></div>`;
  }).join("") : `<div class="empty">Add replacement actions to see what works.</div>`;
}

function renderInsights(sessions) {
  if (sessions.length < 3) {
    $("insightText").innerHTML = `<div class="empty">Add at least three sessions for practical pattern insights.</div>`;
    return;
  }
  const defeated = sessions.filter(s => s.outcome === "defeated");
  const insights = [];
  const riskyHour = topEntry(hourCounts(defeated.length ? defeated : sessions));
  if (riskyHour) insights.push(`Most ${defeated.length ? "defeats" : "urges"} happen around ${riskyHour[0]}:00.`);
  [["emotion", "emotion"], ["place", "place"], ["source", "trigger source"]].forEach(([key, label]) => {
    const top = topEntry(countBy(defeated.length ? defeated : sessions, key, true));
    if (top) insights.push(`${title(top[0])} is your highest-signal ${label}.`);
  });
  const replacement = bestReplacement(sessions);
  if (replacement) insights.push(`${replacement.name} has the highest replacement success signal at ${replacement.rate}%.`);
  const pledgeDays = new Set(Object.keys(state.pledges));
  const pledgeSessions = sessions.filter(s => pledgeDays.has(dateKey(s.startTime)));
  if (pledgeSessions.length >= 2) {
    const withPledgeRecovery = average(pledgeSessions.map(s => s.recoveryMinutes || 0));
    const allRecovery = average(sessions.map(s => s.recoveryMinutes || 0));
    insights.push(withPledgeRecovery <= allRecovery ? "You recover faster on days with a morning pledge." : "Pledge days are logged; recovery speed is still forming a clear signal.");
  }
  $("insightText").innerHTML = insights.map(text => `<div class="insight">${esc(text)}</div>`).join("");
}

function renderFocus() {
  $("focusActiveCard").classList.toggle("hidden", !activeFocus);
  $("siteShortcuts").innerHTML = state.settings.targetSites.map((site, index) => `
    <button class="shortcut" data-site-index="${index}">${esc(site.name)}<span>${esc(site.url)}</span></button>
  `).join("");
  $("reminderList").innerHTML = state.settings.reminders.length ? state.settings.reminders.map(r => `
    <div class="entry"><div class="entry-head"><strong>${esc(r.label || "Risk reminder")}</strong><button class="link-btn" data-delete-reminder="${r.id}">Delete</button></div><div class="entry-meta"><span>${r.day === "all" ? "Every day" : weekdayName(r.day)}</span><span>${String(r.hour).padStart(2, "0")}:00</span></div></div>
  `).join("") : `<div class="empty">No risk reminders yet.</div>`;
}

function startFocus(minutes) {
  minutes = Math.max(1, Math.round(minutes || 0));
  activeFocus = { id: id(), startTime: nowISO(), minutes, endAt: Date.now() + minutes * 60000 };
  tickFocus();
  focusTimer = setInterval(tickFocus, 1000);
  showView("focus");
}

function tickFocus() {
  if (!activeFocus) return;
  const remaining = Math.max(0, activeFocus.endAt - Date.now());
  $("focusTitle").textContent = `${activeFocus.minutes}-minute safe window`;
  $("focusTimer").textContent = formatDurationMs(remaining);
  $("focusReason").textContent = todaysPledge();
  $("focusActiveCard").classList.remove("hidden");
  if (remaining === 0) closeFocus(true);
}

function closeFocus(completed) {
  if (!activeFocus) return;
  state.focusLogs.unshift({ ...activeFocus, completed, closedAt: nowISO() });
  activeFocus = null;
  clearInterval(focusTimer);
  $("focusActiveCard").classList.add("hidden");
  saveState();
}

function renderReflections() {
  const today = state.reflections.find(r => r.date === dateKey(new Date()));
  if (today) {
    $("reflectTrigger").value = today.trigger || "";
    $("reflectHelped").value = today.helped || "";
    $("reflectTomorrow").value = today.tomorrow || "";
  }
  $("reflectionList").innerHTML = state.reflections.length ? state.reflections.slice(0, 10).map(r => `
    <article class="entry"><strong>${esc(r.date)}</strong><p class="subtle">Trigger: ${esc(r.trigger || "-")}</p><p class="subtle">Helped: ${esc(r.helped || "-")}</p><p class="subtle">Tomorrow: ${esc(r.tomorrow || "-")}</p></article>
  `).join("") : `<div class="empty">No reflections saved yet.</div>`;
}

function saveReflection(event) {
  event.preventDefault();
  const today = dateKey(new Date());
  state.reflections = state.reflections.filter(r => r.date !== today);
  state.reflections.unshift({
    id: id(),
    date: today,
    trigger: $("reflectTrigger").value.trim(),
    helped: $("reflectHelped").value.trim(),
    tomorrow: $("reflectTomorrow").value.trim()
  });
  saveState();
}

function renderSettings() {
  $("categorySettings").innerHTML = state.settings.categories.map((cat, index) => `
    <div class="setting-row grid-3">
      <label class="field">Category <input data-cat-name="${index}" value="${esc(cat.name)}"></label>
      <label class="field">Usual lost minutes <input data-cat-min="${index}" type="number" min="1" value="${cat.usualMinutes}"></label>
      <button class="soft-btn" onclick="saveCategoryEdit(${index})">Save</button>
    </div>
  `).join("");
  $("planSettings").innerHTML = state.settings.rescuePlans.length ? state.settings.rescuePlans.map((plan, index) => `
    <div class="entry"><div class="entry-head"><strong>${esc(plan.category)}</strong><button class="link-btn" data-delete-plan="${index}">Delete</button></div><p class="subtle">If ${esc(plan.ifText)}, then ${esc(plan.thenText)}.</p></div>
  `).join("") : `<div class="empty">No if-then rescue plans yet.</div>`;
}

function syncSettingsUi() {
  $("placesSetting").value = state.settings.places.join(", ");
  $("emotionsSetting").value = state.settings.emotions.join(", ");
  $("sourcesSetting").value = state.settings.sources.join(", ");
  $("replacementsSetting").value = state.settings.replacements.join(", ");
  $("reasonsSetting").value = state.settings.reasons.join(", ");
}

function syncDynamicOptions() {
  const catOptions = state.settings.categories.map(c => `<option value="${esc(c.name)}">${esc(c.name)}</option>`).join("");
  ["preCategory", "manualCategory", "endCategory", "planCategory"].forEach(id => {
    const current = $(id).value;
    $(id).innerHTML = catOptions;
    if ([...$(id).options].some(option => option.value === current)) $(id).value = current;
  });
  const filterCurrent = $("filterCategory").value || "all";
  $("filterCategory").innerHTML = `<option value="all">All</option>${catOptions}`;
  if ([...$("filterCategory").options].some(option => option.value === filterCurrent)) $("filterCategory").value = filterCurrent;
  datalist("placeOptions", state.settings.places);
  datalist("emotionOptions", state.settings.emotions);
  datalist("sourceOptions", state.settings.sources);
  datalist("replacementOptions", state.settings.replacements);
  renderChips("placeChips", "place", state.settings.places);
  renderChips("emotionChips", "emotion", state.settings.emotions);
  renderChips("sourceChips", "source", state.settings.sources);
  renderChips("replacementChips", "replacement", state.settings.replacements);
}

function renderPledge() {
  $("reasonChips").innerHTML = state.settings.reasons.map(reason => `<button class="pill" data-reason="${esc(reason)}">${esc(reason)}</button>`).join("");
  const pledge = todaysPledge();
  $("pledgeDisplay").textContent = pledge;
}

function savePledge(reason) {
  state.pledges[dateKey(new Date())] = { text: reason, createdAt: nowISO() };
  $("customPledge").value = "";
  saveState();
}

function saveCustomPledge() {
  const reason = $("customPledge").value.trim();
  if (!reason) return toast("Write a reason or choose one.");
  savePledge(reason);
}

function todaysPledge() {
  return state.pledges[dateKey(new Date())]?.text || state.settings.reasons[0] || "Choose control today.";
}

function saveCategoryEdit(index) {
  const name = document.querySelector(`[data-cat-name="${index}"]`).value.trim();
  const usualMinutes = Math.max(1, Math.round(Number(document.querySelector(`[data-cat-min="${index}"]`).value) || 30));
  if (!name) return;
  state.settings.categories[index] = { name, usualMinutes };
  saveState();
}
window.saveCategoryEdit = saveCategoryEdit;

function addCategory() {
  const name = $("newCategoryName").value.trim();
  const usualMinutes = Math.max(1, Math.round(Number($("newCategoryMinutes").value) || 30));
  if (!name) return toast("Category name required.");
  if (!state.settings.categories.some(c => c.name.toLowerCase() === name.toLowerCase())) {
    state.settings.categories.push({ name, usualMinutes });
  }
  $("newCategoryName").value = "";
  saveState();
}

function addPlan() {
  const category = $("planCategory").value;
  const ifText = $("planIf").value.trim();
  const thenText = $("planThen").value.trim();
  if (!ifText || !thenText) return toast("Add both if and then text.");
  state.settings.rescuePlans.push({ category, ifText, thenText });
  $("planIf").value = "";
  $("planThen").value = "";
  saveState();
}

function deletePlanByIndex(index) {
  state.settings.rescuePlans.splice(index, 1);
  saveState();
}

function saveLists() {
  state.settings.places = parseList($("placesSetting").value, defaults.places);
  state.settings.emotions = parseList($("emotionsSetting").value, defaults.emotions);
  state.settings.sources = parseList($("sourcesSetting").value, defaults.sources);
  state.settings.replacements = parseList($("replacementsSetting").value, defaults.replacements);
  state.settings.reasons = parseList($("reasonsSetting").value, defaults.reasons);
  saveState();
}

function addSite() {
  const name = $("customSiteName").value.trim();
  const url = normalizeUrl($("customSiteUrl").value.trim());
  if (!name || !url) return toast("Add a site name and URL.");
  state.settings.targetSites.push({ name, url });
  $("customSiteName").value = "";
  $("customSiteUrl").value = "";
  saveState();
}

function openFriction(index) {
  const site = state.settings.targetSites[index];
  if (!site) return;
  friction = { site, startedAt: nowISO(), remaining: 5 };
  $("frictionTitle").textContent = `Pause before ${site.name}`;
  $("frictionReason").textContent = todaysPledge();
  $("frictionCountdown").textContent = "5";
  $("whyNow").value = "";
  $("continueFriction").disabled = true;
  $("frictionModal").classList.add("active");
  clearInterval(frictionTimer);
  frictionTimer = setInterval(() => {
    friction.remaining -= 1;
    $("frictionCountdown").textContent = String(Math.max(0, friction.remaining));
    if (friction.remaining <= 0) {
      clearInterval(frictionTimer);
      $("continueFriction").disabled = false;
    }
  }, 1000);
}

function cancelFriction() {
  if (friction) state.frictionLogs.unshift({ ...friction, action: "cancelled", why: $("whyNow").value.trim(), closedAt: nowISO() });
  clearInterval(frictionTimer);
  friction = null;
  $("frictionModal").classList.remove("active");
  saveState();
}

function continueFriction() {
  if (!friction) return;
  state.frictionLogs.unshift({ ...friction, action: "continued", why: $("whyNow").value.trim(), closedAt: nowISO() });
  const url = friction.site.url;
  friction = null;
  $("frictionModal").classList.remove("active");
  saveState();
  window.open(url, "_blank", "noopener");
}

async function enableNotifications() {
  if (!("Notification" in window)) return toast("This browser does not support notifications.");
  const permission = await Notification.requestPermission();
  toast(permission === "granted" ? "Notifications enabled." : "Notifications were not enabled.");
}

function addReminder() {
  const hour = Math.max(0, Math.min(23, Math.round(Number($("reminderHour").value) || 0)));
  state.settings.reminders.push({ id: id(), hour, day: $("reminderDay").value, label: $("reminderLabel").value.trim() || "Risk reminder" });
  $("reminderLabel").value = "";
  saveState();
}

function deleteReminderById(reminderId) {
  state.settings.reminders = state.settings.reminders.filter(r => r.id !== reminderId);
  saveState();
}

function scheduleReminders() {
  reminderTimers.forEach(clearTimeout);
  reminderTimers = [];
  state.settings.reminders.forEach(reminder => {
    const delay = nextReminderDelay(reminder);
    reminderTimers.push(setTimeout(() => fireReminder(reminder), delay));
  });
}

function fireReminder(reminder) {
  const text = `${reminder.label}: pause, breathe, and remember why.`;
  if ("Notification" in window && Notification.permission === "granted") new Notification("Urge Lab", { body: text });
  toast(text);
  scheduleReminders();
}

function nextReminderDelay(reminder) {
  const now = new Date();
  for (let i = 0; i < 8; i++) {
    const d = new Date(now);
    d.setDate(now.getDate() + i);
    d.setHours(reminder.hour, 0, 0, 0);
    if ((reminder.day === "all" || String(d.getDay()) === String(reminder.day)) && d > now) return d - now;
  }
  return 86400000;
}

function renderSessionList(items, deletable) {
  if (!items.length) return `<div class="empty">No sessions yet. When an impulse appears, tap Impulse Started.</div>`;
  return items.map(s => `
    <article class="entry">
      <div class="entry-head">
        <strong>${esc(s.category || "Other")}</strong>
        <span class="badge ${s.outcome}">${s.outcome === "won" ? "Won" : "Defeated"}</span>
      </div>
      <div class="entry-meta">
        <span>${new Date(s.startTime).toLocaleString([], { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}</span>
        <span>${formatDuration(s.durationSeconds || 0)}</span>
        ${s.place ? `<span>${esc(s.place)}</span>` : ""}
        ${s.emotion ? `<span>${esc(s.emotion)}</span>` : ""}
        ${s.source ? `<span>${esc(s.source)}</span>` : ""}
        ${s.replacement ? `<span>${esc(s.replacement)}</span>` : ""}
      </div>
      ${s.notes ? `<p class="subtle">${esc(s.notes)}</p>` : ""}
      ${deletable ? `<button class="link-btn" data-delete-session="${s.id}">Delete</button>` : ""}
    </article>
  `).join("");
}

function deleteSession(sessionId) {
  if (!confirm("Delete this session?")) return;
  state.sessions = state.sessions.filter(s => s.id !== sessionId);
  saveState();
}

function clearAll() {
  if (!confirm("Clear all local sessions, reflections, focus logs, and friction logs? Settings stay in place.")) return;
  state.sessions = [];
  state.reflections = [];
  state.focusLogs = [];
  state.frictionLogs = [];
  saveState();
}

function savedSeconds(wonSessions) {
  return wonSessions.reduce((total, session) => {
    const usual = categoryUsualMinutes(session.category) * 60;
    return total + Math.max(usual - (session.durationSeconds || 0), 0);
  }, 0);
}

function todayScore(today) {
  const wins = today.filter(s => s.outcome === "won");
  const defeats = today.filter(s => s.outcome === "defeated");
  const wonMinutes = sum(wins, "durationSeconds") / 60;
  const focusBonus = state.focusLogs.filter(f => f.completed && dateKey(f.startTime) === dateKey(new Date())).length * 5;
  const recoveryBonus = defeats.some(Boolean) && wins.some(w => defeats.some(d => new Date(w.startTime) > new Date(d.endTime))) ? 8 : 0;
  return Math.max(0, Math.round(wins.length * 10 - defeats.length * 8 + wonMinutes / 5 + focusBonus + recoveryBonus));
}

function recoveryScore() {
  const sessions = [...state.sessions].sort((a, b) => new Date(a.startTime) - new Date(b.startTime));
  const defeats = sessions.filter(s => s.outcome === "defeated");
  if (!defeats.length) return sessions.length ? 100 : 0;
  let points = 0;
  defeats.forEach(defeat => {
    const next = sessions.find(s => new Date(s.startTime) > new Date(defeat.endTime));
    if (next?.outcome === "won") points += 35;
    if (next && hoursBetween(defeat.endTime, next.startTime) <= 24) points += 25;
    if ((defeat.recoveryMinutes || 999) <= 30) points += 40;
  });
  return Math.round(points / defeats.length);
}

function currentNoDefeatStreak() {
  const defeatDays = new Set(state.sessions.filter(s => s.outcome === "defeated").map(s => dateKey(s.startTime)));
  if (!state.sessions.length) return 0;
  const earliest = state.sessions.map(s => dateKey(s.startTime)).sort()[0];
  let streak = 0;
  const d = new Date();
  while (dateKey(d) >= earliest && !defeatDays.has(dateKey(d))) {
    streak += 1;
    d.setDate(d.getDate() - 1);
  }
  return streak;
}

function bestNoDefeatStreak() {
  if (!state.sessions.length) return 0;
  const days = [...new Set(state.sessions.map(s => dateKey(s.startTime)))].sort();
  const defeatDays = new Set(state.sessions.filter(s => s.outcome === "defeated").map(s => dateKey(s.startTime)));
  let best = 0;
  let current = 0;
  days.forEach(day => {
    if (defeatDays.has(day)) current = 0;
    else current += 1;
    best = Math.max(best, current);
  });
  return best;
}

function groupSessions(sessions, range) {
  return sessions.reduce((acc, s) => {
    const d = new Date(s.startTime);
    let key = dateKey(d);
    if (range === "weekly") key = `${d.getFullYear()}-W${weekNumber(d)}`;
    if (range === "monthly") key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    if (range === "yearly") key = String(d.getFullYear());
    acc[key] ||= [];
    acc[key].push(s);
    return acc;
  }, {});
}

function trendRow(label, good, bad, max, value) {
  const goodPct = Math.round(good / max * 100);
  const badPct = Math.round(bad / max * 100);
  return `<div class="trend-row"><span>${esc(label)}</span><div class="bar"><i style="width:${Math.max(goodPct, badPct)}%; background:linear-gradient(90deg,var(--green) ${goodPct}%, var(--red) ${goodPct}%);"></i></div><strong>${value}</strong></div>`;
}

function renderBars(id, counts, total) {
  const rows = Object.entries(counts).filter(([, v]) => v > 0).sort((a, b) => b[1] - a[1]).slice(0, 8);
  $(id).innerHTML = rows.length ? rows.map(([name, count]) => {
    const width = total ? Math.max(4, Math.round(count / total * 100)) : 0;
    return `<div class="bar-row"><span>${esc(name)}</span><div class="bar"><i style="width:${width}%"></i></div><strong>${count}</strong></div>`;
  }).join("") : `<div class="empty">No data yet.</div>`;
}

function renderChips(containerId, group, values) {
  $(containerId).innerHTML = values.map(v => `<button type="button" class="chip" data-chip="${group}" data-value="${esc(v)}">${esc(v)}</button>`).join("");
}

function selectChip(chip) {
  $$(`.chip[data-chip="${chip.dataset.chip}"]`).forEach(c => c.classList.remove("selected"));
  chip.classList.add("selected");
}

function clearChipSelections() {
  $$(".chip.selected").forEach(c => c.classList.remove("selected"));
}

function selectedOrCustom(group, customId) {
  return ($(customId).value.trim() || document.querySelector(`.chip.selected[data-chip="${group}"]`)?.dataset.value || "").trim();
}

function datalist(id, values) {
  $(id).innerHTML = values.map(v => `<option value="${esc(v)}"></option>`).join("");
}

function getSelectedStartCategory() {
  return $("preCategory").value || state.settings.categories[0]?.name || "Other";
}

function setSelectValue(id, value) {
  const select = $(id);
  if (![...select.options].some(o => o.value === value)) {
    state.settings.categories.push({ name: value, usualMinutes: 30 });
    syncDynamicOptions();
  }
  select.value = value;
}

function planFor(category) {
  const plan = state.settings.rescuePlans.find(p => p.category === category) || state.settings.rescuePlans[0];
  return plan ? `If ${plan.ifText}, then ${plan.thenText}.` : "No rescue plan yet. Add one in Settings.";
}

function categoryUsualMinutes(category) {
  return state.settings.categories.find(c => c.name === category)?.usualMinutes || 30;
}

function countBy(items, key, skipEmpty = false) {
  return items.reduce((acc, item) => {
    const value = item[key] || (skipEmpty ? "" : "Unknown");
    if (!value) return acc;
    acc[value] = (acc[value] || 0) + 1;
    return acc;
  }, {});
}

function hourCounts(items) {
  return items.reduce((acc, item) => {
    const hour = new Date(item.startTime).getHours();
    acc[hour] = (acc[hour] || 0) + 1;
    return acc;
  }, {});
}

function bestReplacement(sessions) {
  const map = {};
  sessions.forEach(s => {
    if (!s.replacement) return;
    map[s.replacement] ||= { total: 0, wins: 0 };
    map[s.replacement].total += 1;
    if (s.outcome === "won") map[s.replacement].wins += 1;
  });
  const ranked = Object.entries(map).filter(([, v]) => v.total > 0).sort((a, b) => (b[1].wins / b[1].total) - (a[1].wins / a[1].total));
  if (!ranked.length) return null;
  return { name: ranked[0][0], rate: Math.round(ranked[0][1].wins / ranked[0][1].total * 100) };
}

function topEntry(counts) {
  return Object.entries(counts).sort((a, b) => b[1] - a[1])[0];
}

function parseList(value, fallback) {
  const list = value.split(",").map(x => x.trim()).filter(Boolean);
  return list.length ? [...new Set(list)] : fallback;
}

function nonNegative(value) {
  return Math.max(0, Math.round(Number(value) || 0));
}

function sum(items, key) {
  return items.reduce((total, item) => total + (Number(item[key]) || 0), 0);
}

function average(values) {
  const nums = values.map(Number).filter(Number.isFinite);
  return nums.length ? nums.reduce((a, b) => a + b, 0) / nums.length : 0;
}

function pct(part, total) {
  return total ? `${Math.round(part / total * 100)}%` : "0%";
}

function formatDuration(seconds) {
  seconds = Math.max(0, Math.round(seconds || 0));
  if (seconds < 60) return `${seconds}s`;
  const mins = Math.round(seconds / 60);
  if (mins < 60) return `${mins}m`;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return m ? `${h}h ${m}m` : `${h}h`;
}

function formatDurationMs(ms) {
  const seconds = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h) return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

function hoursBetween(a, b) {
  return (new Date(b) - new Date(a)) / 3600000;
}

function weekNumber(date) {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
}

function title(value) {
  return String(value).charAt(0).toUpperCase() + String(value).slice(1);
}

function esc(value) {
  return String(value ?? "").replace(/[&<>"']/g, char => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" }[char]));
}

function normalizeUrl(url) {
  if (!url) return "";
  try {
    const withProtocol = /^https?:\/\//i.test(url) ? url : `https://${url}`;
    return new URL(withProtocol).href;
  } catch {
    return "";
  }
}

function download(filename, content, type) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

function sessionsToCsv() {
  const headers = ["startTime", "endTime", "outcome", "category", "durationSeconds", "place", "emotion", "source", "replacement", "recoveryMinutes", "notes"];
  const rows = state.sessions.map(s => headers.map(h => `"${String(s[h] ?? "").replaceAll('"', '""')}"`).join(","));
  return [headers.join(","), ...rows].join("\n");
}

async function importJson(event) {
  const file = event.target.files[0];
  if (!file) return;
  try {
    const imported = JSON.parse(await file.text());
    if (!Array.isArray(imported.sessions)) throw new Error("Missing sessions array");
    state = {
      sessions: imported.sessions || [],
      pledges: imported.pledges || {},
      reflections: imported.reflections || [],
      focusLogs: imported.focusLogs || [],
      frictionLogs: imported.frictionLogs || [],
      settings: { ...defaults, ...(imported.settings || {}) }
    };
    syncSettingsUi();
    saveState();
  } catch (error) {
    alert(`Import failed: ${error.message}`);
  }
}

function weekdayName(value) {
  return ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"][Number(value)] || "Every day";
}

function toast(message) {
  $("toast").textContent = message;
  $("toast").classList.add("show");
  setTimeout(() => $("toast").classList.remove("show"), 2800);
}

init();
