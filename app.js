// app.js
import { parseQuestionsFromTxt } from "./core/parser.js";
import { Engine } from "./core/engine.js";
import { beep, haptic } from "./core/fx.js";
import { takeRandom, shuffle } from "./core/random.js";
import { LANGS, I18N } from "./core/i18n.js";
import { makeFlow } from "./core/flowFactory.js";

const app = document.getElementById("app");
const DEV_BYPASS_TG = true; // ПК тест: true, прод: false

// --- storage keys ---
const LANG_KEY = "forbrain_lang_v1";
const CONSENT_KEY = "forbrain_consent_v1";
const SAVED_KEY_PREFIX = "forbrain_saved_tg_"; // + tgId
const LOCAL_LOG_KEY = "forbrain_local_log_v1"; // demo log on device

// --- i18n state ---
let lang = localStorage.getItem(LANG_KEY) || "uz";
let t = I18N[lang] || I18N.uz;
let FLOW = makeFlow(lang);

// блокируем смену языка после старта теста
let langLocked = false;

function setLang(newLang) {
  lang = newLang;
  localStorage.setItem(LANG_KEY, lang);
  t = I18N[lang] || I18N.uz;
  FLOW = makeFlow(lang);
}

// --- app state ---
let flowIndex = 0;
let engine = null;
let selected = null;

let breakdown = {}; // { tag: {correct,total} }
let history = {};   // { blockId: {...} }

let timerId = null;
let timeLeft = 0;

// --- click guard ---
let lastClickTs = 0;
function guardClick(minMs = 300) {
  const now = Date.now();
  if (now - lastClickTs < minMs) return false;
  lastClickTs = now;
  return true;
}

// --- helpers ---
function htmlEscape(s) {
  return (s ?? "")
    .toString()
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}
function setView(markup) {
  app.innerHTML = markup;
}
function pct(a, b) {
  return b ? Math.round((a / b) * 100) : 0;
}
function levelByPercent(p) {
  if (p >= 85) return "🏆";
  if (p >= 70) return "🔥";
  if (p >= 50) return "✅";
  if (p >= 30) return "🌱";
  return "🧩";
}

// --- Telegram gate ---
function isTelegramWebApp() {
  if (DEV_BYPASS_TG) return true;
  return !!(window.Telegram && window.Telegram.WebApp);
}
function getTelegramUser() {
  if (DEV_BYPASS_TG) return { id: 999999, username: "dev_user" };
  return window.Telegram?.WebApp?.initDataUnsafe?.user || null;
}

// --- timer ---
function stopTimer() {
  if (timerId) clearInterval(timerId);
  timerId = null;
}
function startTimerForQuestion() {
  stopTimer();
  const sec = FLOW[flowIndex]?.timeSec ?? 0;
  if (!sec || sec <= 0) return;

  timeLeft = sec;
  const el = document.getElementById("timerValue");
  if (el) el.textContent = `${timeLeft}s`;

  timerId = setInterval(() => {
    timeLeft -= 1;
    const tEl = document.getElementById("timerValue");
    if (tEl) tEl.textContent = `${timeLeft}s`;

    if (timeLeft <= 0) {
      stopTimer();
      haptic(25);
      beep(180, 0.12);
      engine.skip();
      goNext();
    }
  }, 1000);
}

// --- local log (demo) ---
function appendLocalLog(row) {
  const arr = JSON.parse(localStorage.getItem(LOCAL_LOG_KEY) || "[]");
  arr.push({ ts: new Date().toISOString(), ...row });
  localStorage.setItem(LOCAL_LOG_KEY, JSON.stringify(arr));
}

// --- language button (indicator only when locked) ---
function bindLangButton() {
  const btn = document.getElementById("langBtn");
  if (!btn) return;

  // always show indicator
  btn.textContent = `🌐 ${lang.toUpperCase()}`;

  // lock behavior: show but disabled
  if (langLocked) {
    btn.disabled = true;
    btn.classList.add("disabled");
    btn.title = "Language locked during test";
    return;
  }

  btn.disabled = false;
  btn.classList.remove("disabled");
  btn.title = "";

  btn.addEventListener("click", () => {
    if (!guardClick(200)) return;
    renderLanguageModal();
  });
}

// --- Language modal ---
function renderLanguageModal() {
  const overlay = document.createElement("div");
  overlay.className = "modalOverlay";

  overlay.innerHTML = `
    <div class="modalCard">
      <h2>${htmlEscape(t.chooseLangTitle)}</h2>
      <p class="small">${htmlEscape(t.chooseLangText)}</p>
      <div class="spacer"></div>

      <div class="row" style="flex-wrap:wrap; gap:10px;">
        ${LANGS.map(x => `<button class="btn" data-langpick="${x.code}">${htmlEscape(x.label)}</button>`).join("")}
      </div>

      <div class="spacer"></div>
      <div class="row">
        <button class="btn" id="closeLangModal">✖</button>
      </div>
    </div>
  `;

  document.body.appendChild(overlay);

  overlay.querySelector("#closeLangModal").addEventListener("click", () => overlay.remove());

  overlay.querySelectorAll("[data-langpick]").forEach(b => {
    b.addEventListener("click", () => {
      if (!guardClick(200)) return;
      const newLang = b.dataset.langpick;
      setLang(newLang);
      overlay.remove();

      // если мы на экране выбора языка или интро — просто перерисуем интро
      // если уже тест идёт — не даём менять
      renderIntroScreen();
    });
  });
}

// --- Screens ---
function renderTelegramOnlyScreen() {
  stopTimer();
  setView(`
    <div class="container">
      <div class="card">
        <h1>${htmlEscape(t.openInTelegramTitle)}</h1>
        <p>${htmlEscape(t.openInTelegramText)}</p>
        <div class="spacer"></div>
        <p class="small">${htmlEscape(t.openInTelegramHint)}</p>
      </div>
    </div>
  `);
}

function renderLanguageScreen() {
  stopTimer();
  langLocked = false;

  setView(`
    <div class="container">
      <div class="card">
        <h1>${htmlEscape(t.chooseLangTitle)}</h1>
        <p>${htmlEscape(t.chooseLangText)}</p>
        <div class="spacer"></div>
        <div class="row" style="flex-wrap:wrap; gap:10px;">
          ${LANGS.map(x => `<button class="btn" data-lang="${x.code}">${htmlEscape(x.label)}</button>`).join("")}
        </div>
      </div>
    </div>
  `);

  document.querySelectorAll("[data-lang]").forEach(btn => {
    btn.addEventListener("click", () => {
      if (!guardClick(200)) return;
      setLang(btn.dataset.lang);
      renderIntroScreen();
    });
  });
}

function renderIntroScreen() {
  stopTimer();

  if (!isTelegramWebApp()) return renderTelegramOnlyScreen();
  const u = getTelegramUser();
  if (!u?.id) return renderTelegramOnlyScreen();

  try {
    window.Telegram.WebApp.ready();
    window.Telegram.WebApp.expand();
  } catch {}

  setView(`
    <div class="container">
      <div class="hero">
        <img src="./assets/ai_intro.jpg" alt="AI intro">
      </div>

      <div class="spacer"></div>

      <div class="card">
        <div class="row space">
          <h1 style="margin:0;">${htmlEscape(t.introTitle)}</h1>
          <button class="btn small" id="langBtn">🌐 ${lang.toUpperCase()}</button>
        </div>

        <div class="spacer"></div>
        <p>${htmlEscape(t.introText)}</p>

        <div class="spacer"></div>
        <div class="row">
          <button class="btn primary" id="startBtn">${htmlEscape(t.startBtn)}</button>
        </div>

        <div class="spacer"></div>
        <p class="small">${htmlEscape(t.tipFast)}</p>
      </div>
    </div>
  `);

  bindLangButton();

  document.getElementById("startBtn").addEventListener("click", async () => {
    if (!guardClick()) return;

    haptic(10);
    beep(880, 0.05);

    // старт теста -> язык фиксируем
    langLocked = true;

    flowIndex = 0;
    history = {};
    await loadBlock(flowIndex);
    renderQuestionScreen();
  });
}

function renderTopBar() {
  const total = engine?.total ?? 0;
  const current = (engine?.index ?? 0) + 1;
  const percent = total ? Math.round(((current - 1) / total) * 100) : 0;

  const sec = FLOW[flowIndex]?.timeSec ?? 0;
  const timerBadge = sec && sec > 0
    ? `<span class="badge">⏳ <b id="timerValue">${timeLeft}s</b></span>`
    : `<span class="badge">⏳ <b>—</b></span>`;

  return `
    <div class="card">
      <div class="row" style="justify-content:space-between; align-items:center;">
        <span class="badge">${htmlEscape(t.block)}: <b>${htmlEscape(FLOW[flowIndex].id)}</b></span>
        <span class="badge">${htmlEscape(t.question)}: <b>${current}/${total}</b></span>
        <span class="badge">${htmlEscape(t.score)}: <b>${engine?.score ?? 0}</b></span>
        ${timerBadge}
        <button class="btn small" id="langBtn">🌐 ${lang.toUpperCase()}</button>
      </div>
      <div class="spacer"></div>
      <div class="progress"><div style="width:${percent}%"></div></div>
    </div>
  `;
}

function renderQuestionScreen() {
  selected = null;

  const q = engine.current();
  if (!q) return renderBlockSummaryScreen();

  const sec = FLOW[flowIndex]?.timeSec ?? 0;
  if (sec > 0) timeLeft = sec;

  const optionsMarkup = q.options.map((opt, idx) => `
    <div class="option" data-idx="${idx}">${htmlEscape(opt)}</div>
  `).join("");

  setView(`
    <div class="container">
      ${renderTopBar()}
      <div class="spacer"></div>
      <div class="card">
        <h2>${htmlEscape(q.question)}</h2>
        ${optionsMarkup}
        <div class="spacer"></div>
        <div class="row">
          <button class="btn primary" id="answerBtn" disabled>${htmlEscape(t.answerBtn)}</button>
        </div>
        <p class="small">${
          FLOW[flowIndex].mode === "learn" ? htmlEscape(t.learnHint) : htmlEscape(t.quizHint)
        }</p>
      </div>
    </div>
  `);

  bindLangButton();
  startTimerForQuestion();

  const answerBtn = document.getElementById("answerBtn");

  document.querySelectorAll(".option").forEach(el => {
    el.addEventListener("click", () => {
      if (!guardClick(120)) return;

      haptic(8);
      document.querySelectorAll(".option").forEach(x => x.classList.remove("selected"));
      el.classList.add("selected");

      selected = Number(el.dataset.idx);
      answerBtn.disabled = false;
      beep(720, 0.03);
    });
  });

  answerBtn.addEventListener("click", () => {
    if (!guardClick()) return;
    if (selected === null) return;

    stopTimer();

    // ВАЖНО: берём вопрос ДО ответа (для breakdown)
    const qBefore = engine.current();
    const res = engine.answer(selected);

    if (qBefore?.tag && breakdown[qBefore.tag]) {
      if (res.ok) breakdown[qBefore.tag].correct += 1;
    }

    if (FLOW[flowIndex].mode === "learn") {
      renderFeedbackScreen(res);
    } else {
      haptic(10);
      if (res.ok) beep(950, 0.05);
      else beep(220, 0.07);
      goNext();
    }
  });
}

function renderFeedbackScreen(res) {
  stopTimer();

  const ok = !!res.ok;
  const title = ok ? "✅" : "⚠️";

  // ВАЖНО: берём подсказку из res.feedback
  const msg = (res.feedback && res.feedback.trim())
    ? res.feedback
    : (ok ? (t.defaultOkHint || "Верно.") : (t.defaultBadHint || "Неверно."));

  setView(`
    <div class="container">
      ${renderTopBar()}
      <div class="spacer"></div>
      <div class="card">
        <h2 class="notice ${ok ? "ok" : "bad"}">${title}</h2>
        <p>${htmlEscape(msg)}</p>
        <div class="spacer"></div>
        <div class="row">
          <button class="btn primary" id="nextBtn">${htmlEscape(t.nextBtn)}</button>
        </div>
      </div>
    </div>
  `);

  bindLangButton();

  document.getElementById("nextBtn").addEventListener("click", () => {
    if (!guardClick()) return;
    haptic(8);
    beep(880, 0.04);
    goNext();
  });
}

function renderBreakdownBars() {
  const labels = {
    logic: "Logic",
    spatial: "Spatial",
    algorithm: "Algorithm",
    engineering: "Engineering",
  };

  const keys = Object.keys(breakdown);
  if (!keys.length) return "";

  return keys.map(tag => {
    const c = breakdown[tag].correct;
    const tt = breakdown[tag].total;
    const p = pct(c, tt);
    return `
      <div class="spacer"></div>
      <div class="badge">${htmlEscape(labels[tag] ?? tag)}: <b>${c}/${tt}</b> • <b>${p}%</b></div>
      <div class="spacer"></div>
      <div class="progress"><div style="width:${p}%"></div></div>
    `;
  }).join("");
}

function renderBlockSummaryScreen() {
  stopTimer();

  const blockId = FLOW[flowIndex]?.id ?? "block";
  const total = engine?.total ?? 0;
  const score = engine?.score ?? 0;
  const overall = pct(score, total);

  history[blockId] = {
    score,
    total,
    overall,
    breakdown: JSON.parse(JSON.stringify(breakdown)),
  };

  const nextIndex = flowIndex + 1;
  const hasNext = nextIndex < FLOW.length;

  setView(`
    <div class="container">
      <div class="card">
        <div class="row space">
          <h1 style="margin:0;">${htmlEscape(t.doneTitle)}</h1>
          <button class="btn small" id="langBtn">🌐 ${lang.toUpperCase()}</button>
        </div>

        <div class="spacer"></div>
        <p><b>${htmlEscape(t.block)}:</b> ${htmlEscape(blockId)}</p>
        <p><b>${htmlEscape(t.result)}:</b> ${score}/${total} • <b>${overall}%</b> • <b>${levelByPercent(overall)}</b></p>

        ${blockId === "stage1" ? renderBreakdownBars() : ""}

        <div class="spacer"></div>
        <p>${htmlEscape(t.continueQ)}</p>

        <div class="spacer"></div>
        <div class="row">
          ${hasNext ? `<button class="btn primary" id="yesNextBtn">${htmlEscape(t.yes)}</button>` : ""}
          <button class="btn" id="noBtn">${htmlEscape(t.no)}</button>
        </div>
      </div>
    </div>
  `);

  bindLangButton();

  if (hasNext) {
    document.getElementById("yesNextBtn").addEventListener("click", async () => {
      if (!guardClick()) return;
      haptic(10);
      beep(880, 0.05);

      flowIndex = nextIndex;
      await loadBlock(flowIndex);
      renderQuestionScreen();
    });
  }

  document.getElementById("noBtn").addEventListener("click", () => {
    if (!guardClick()) return;
    haptic(10);
    beep(440, 0.05);
    renderConsentScreen(() => renderFinalSummaryScreen());
  });
}

function renderConsentScreen(onDone) {
  setView(`
    <div class="container">
      <div class="card">
        <div class="row space">
          <h1 style="margin:0;">${htmlEscape(t.consentTitle)}</h1>
          <button class="btn small" id="langBtn">🌐 ${lang.toUpperCase()}</button>
        </div>

        <div class="spacer"></div>
        <p class="small">${htmlEscape(t.consentText)}</p>

        <div class="spacer"></div>
        <label class="small">
          <input type="checkbox" id="consentChk">
          ${htmlEscape(t.consentChk)}
        </label>

        <div class="spacer"></div>
        <div class="row">
          <button class="btn primary" id="consentYes" disabled>${htmlEscape(t.consentYes)}</button>
          <button class="btn" id="consentNo">${htmlEscape(t.consentNo)}</button>
        </div>
      </div>
    </div>
  `);

  bindLangButton();

  const yesBtn = document.getElementById("consentYes");
  document.getElementById("consentChk").addEventListener("change", (e) => {
    yesBtn.disabled = !e.target.checked;
  });

  document.getElementById("consentYes").addEventListener("click", () => {
    if (!guardClick()) return;
    localStorage.setItem(CONSENT_KEY, "1");
    onDone();
  });

  document.getElementById("consentNo").addEventListener("click", () => {
    if (!guardClick()) return;
    localStorage.setItem(CONSENT_KEY, "0");
    onDone();
  });
}

function renderFinalSummaryScreen() {
  stopTimer();

  if (!isTelegramWebApp()) return renderTelegramOnlyScreen();
  const u = getTelegramUser();
  if (!u?.id) return renderTelegramOnlyScreen();

  const tgId = String(u.id);
  const savedKey = SAVED_KEY_PREFIX + tgId;
  const alreadySaved = localStorage.getItem(savedKey) === "1";
  const consent = localStorage.getItem(CONSENT_KEY) === "1";

  const s1 = history.stage1?.breakdown || {};
  const pLogic = s1.logic ? pct(s1.logic.correct, s1.logic.total) : null;
  const pAlgo  = s1.algorithm ? pct(s1.algorithm.correct, s1.algorithm.total) : null;
  const pSpat  = s1.spatial ? pct(s1.spatial.correct, s1.spatial.total) : null;
  const pEng   = s1.engineering ? pct(s1.engineering.correct, s1.engineering.total) : null;

  const engineerScore = (pSpat ?? 0) + (pEng ?? 0);
  const coderScore = (pAlgo ?? 0) + (pLogic ?? 0);

  let profile = "⚖️";
  if (!history.stage1) profile = "ℹ️";
  else if (engineerScore - coderScore >= 20) profile = "🛠️";
  else if (coderScore - engineerScore >= 20) profile = "💻";

  setView(`
    <div class="container">
      <div class="card">
        <div class="row space">
          <h1 style="margin:0;">${htmlEscape(t.profileTitle)}</h1>
          <button class="btn small" id="langBtn">🌐 ${lang.toUpperCase()}</button>
        </div>

        <div class="spacer"></div>

        <p class="small"><b>Telegram:</b> @${htmlEscape(u.username || "no_username")} (id: ${htmlEscape(tgId)})</p>
        <p><b>Profile:</b> ${htmlEscape(profile)}</p>

        <div class="spacer"></div>
        <h3>${htmlEscape(t.coursePickTitle)}</h3>
        <p class="small">${htmlEscape(t.coursePickHint)}</p>

        <div class="row" style="flex-wrap:wrap; gap:10px;">
          <button class="btn" data-course="3D">🎮 3D</button>
          <button class="btn" data-course="Cyber">🛡️ Cyber</button>
          <button class="btn" data-course="Physics">⚡ Physics</button>
          <button class="btn" data-course="IT">🧠 IT</button>
          <button class="btn" data-course="Prog">💻 Programming</button>
          <button class="btn" data-course="Other">✍️ Other</button>
        </div>

        <div class="spacer"></div>
        <input id="customCourse" class="input" placeholder="${htmlEscape(t.courseOtherPlaceholder)}" />

        <div class="spacer"></div>
        <p class="small">
          ${consent ? "Consent: ✅" : "Consent: ❌"}
          ${alreadySaved ? `<br><b>${htmlEscape(t.savedOnce)}</b>` : ""}
        </p>

        <div class="spacer"></div>
        <div class="row">
          <button class="btn primary" id="saveBtn" disabled>${htmlEscape(t.saveBtn)}</button>
          <button class="btn" id="restartBtn">${htmlEscape(t.restartBtn)}</button>
        </div>

        <div class="spacer"></div>
        <p class="small">${htmlEscape(t.savedDemoHint)}</p>
      </div>
    </div>
  `);

  bindLangButton();

  let pickedCourse = null;
  const saveBtn = document.getElementById("saveBtn");

  if (alreadySaved || !consent) saveBtn.disabled = true;

  document.querySelectorAll("[data-course]").forEach(btn => {
    btn.addEventListener("click", () => {
      if (!guardClick(150)) return;
      if (alreadySaved || !consent) return;

      document.querySelectorAll("[data-course]").forEach(x => x.classList.remove("selected"));
      btn.classList.add("selected");

      pickedCourse = btn.dataset.course;
      saveBtn.disabled = false;
      haptic(8);
      beep(720, 0.03);
    });
  });

  saveBtn.addEventListener("click", () => {
    if (!guardClick()) return;

    if (!consent) {
      alert(t.needConsent);
      return;
    }
    if (alreadySaved) return;

    const custom = (document.getElementById("customCourse").value || "").trim();
    const finalCourse = pickedCourse === "Other" ? custom : pickedCourse;

    appendLocalLog({
      tg_id: tgId,
      tg_username: u.username || "",
      lang,
      course: finalCourse || "",
      profile,
      history,
    });

    localStorage.setItem(savedKey, "1");

    haptic(25);
    beep(1100, 0.08);
    alert(t.savedOk);

    renderFinalSummaryScreen();
  });

  document.getElementById("restartBtn").addEventListener("click", () => {
    if (!guardClick()) return;
    haptic(12);
    beep(880, 0.05);

    // рестарт = возвращаемся в интро (язык остаётся, но можно снова выбрать только до старта)
    history = {};
    langLocked = false;
    renderIntroScreen();
  });
}

// --- flow ---
function goNext() {
  const hasMore = engine.next();
  if (hasMore) return renderQuestionScreen();
  return renderBlockSummaryScreen();
}

// --- loading with ru fallback ---
async function loadText(url) {
  let res = await fetch(url);

  if (!res.ok) {
    const fallbackUrl = url.replace(`/data/${lang}/`, `/data/ru/`);
    res = await fetch(fallbackUrl);
    if (!res.ok) throw new Error("Не удалось загрузить: " + url + " (и fallback ru тоже)");
  }

  return await res.text();
}

async function loadBlock(idx) {
  const block = FLOW[idx];
  breakdown = {};

  if (block.file) {
    const txt = await loadText(block.file);
    const parsed = parseQuestionsFromTxt(txt);
    engine = new Engine(parsed, block.mode);
    return;
  }

  if (block.parts) {
    let finalQuestions = [];

    for (const part of block.parts) {
      const txt = await loadText(part.file);
      const parsed = parseQuestionsFromTxt(txt);

      const tagged = parsed.map(q => ({ ...q, tag: part.tag }));
      const selectedPart = takeRandom(tagged, part.pick);

      breakdown[part.tag] ??= { correct: 0, total: 0 };
      breakdown[part.tag].total += selectedPart.length;

      finalQuestions = finalQuestions.concat(selectedPart);
    }

    finalQuestions = shuffle(finalQuestions);
    engine = new Engine(finalQuestions, block.mode);
    return;
  }

  throw new Error("Непонятная конфигурация блока в FLOW");
}

// start
renderLanguageScreen();