// app.js (prod-style)
// Screens: Gate -> Marketing -> Language -> Intro -> Test Flow -> Consent -> Final Profile

import { Engine } from "./core/engine.js";
import { beep, haptic } from "./core/fx.js";
import { takeRandom, shuffle } from "./core/random.js";
import { LANGS, I18N } from "./core/i18n.js";
import { makeFlow } from "./core/flowFactory.js";

const app = document.getElementById("app");

// DEV: true = можно тестить в браузере без Telegram
const DEV_BYPASS_TG = true;

// --- storage keys ---
const LANG_KEY = "forbrain_lang_v1";
const CONSENT_KEY = "forbrain_consent_v1";
const SAVED_KEY_PREFIX = "forbrain_saved_tg_";
const LOCAL_LOG_KEY = "forbrain_local_log_v1";

// --- i18n state ---
let lang = localStorage.getItem(LANG_KEY) || "uz";
let t = I18N[lang] || I18N.uz;
let FLOW = makeFlow(lang);

// --- app state ---
let flowIndex = 0;
let engine = null;
let selected = null;

let breakdown = {}; // { tag: {correct,total} }
let history = {};   // { blockId: {...} }

let timerId = null;
let timeLeft = 0;

let lastClickTs = 0; // ✅ FIX: было не объявлено

// ---------------- helpers ----------------
function guardClick(minMs = 250) {
  const now = Date.now();
  if (now - lastClickTs < minMs) return false;
  lastClickTs = now;
  return true;
}

function setView(markup) {
  app.innerHTML = markup;
}

function htmlEscape(s) {
  return (s ?? "")
    .toString()
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
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

function vibro(ms = 18) {
  try { navigator.vibrate?.(ms); } catch {}
}

// ---------------- Telegram gate ----------------
function isTelegramWebApp() {
  if (DEV_BYPASS_TG) return true;
  return !!(window.Telegram && window.Telegram.WebApp);
}

function getTelegramUser() {
  if (DEV_BYPASS_TG) return { id: 999999, username: "dev_user" };
  return window.Telegram?.WebApp?.initDataUnsafe?.user || null;
}

// ---------------- timer ----------------
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
      haptic?.(25);
      beep?.(180, 0.12);
      engine?.skip();
      goNext();
    }
  }, 1000);
}

// ---------------- local log (demo) ----------------
function appendLocalLog(row) {
  const arr = JSON.parse(localStorage.getItem(LOCAL_LOG_KEY) || "[]");
  arr.push({ ts: new Date().toISOString(), ...row });
  localStorage.setItem(LOCAL_LOG_KEY, JSON.stringify(arr));
}

// ---------------- packed loader ----------------
// Поддерживаем ДВА варианта:
// 1) ./public/questions/... (когда index.html в корне, public подпапка)
// 2) ./questions/... (когда public — это корень сайта)
async function fetchJsonTry(urls) {
  let lastErr = null;
  for (const u of urls) {
    try {
      const res = await fetch(u, { cache: "no-store" });
      if (!res.ok) { lastErr = new Error(`${res.status} ${u}`); continue; }
      return await res.json();
    } catch (e) {
      lastErr = e;
    }
  }
  throw lastErr || new Error("fetch failed");
}

async function loadPackedBlock(lang, relPath) {
  // relPath: "it/03_it_l1"
  const bases = [
    `./public/questions/${lang}/${relPath}`,
    `./questions/${lang}/${relPath}`,
  ];

  // ✅ поддержим и ".packed.json" и ".packed"
  const urls = [];
  for (const b of bases) {
    urls.push(new URL(`${b}.packed.json`, window.location.href).toString());
    urls.push(new URL(`${b}.packed`, window.location.href).toString());
  }

  return await fetchJsonTry(urls);
}

function normalizePacked(arr) {
  // packed: {q,o,k,ok,bad} -> engine format
  return (arr || []).map(x => ({
    question: x.q,
    options: x.o,
    k: x.k,
    feedbackOk: x.ok || "",
    feedbackBad: x.bad || "",
  }));
}

function toRelPathFromDataFile(file) {
  // "./data/ru/it/03_it_l1.txt" -> "it/03_it_l1"
  return file
    .replace(/^\.?\/*data\//, "")
    .replace(/^\w+\//, "")
    .replace(/\.txt$/i, "");
}

// ---------------- Screens ----------------

// 1) Gate (video + play)
function renderPlayGate() {
  stopTimer();

  setView(`
    <div class="gate">
      <video class="gateVideo" autoplay muted loop playsinline preload="auto">
        <source src="./assets/intro.mp4" type="video/mp4">
      </video>

      <div class="gateShade"></div>

      <div class="gateCenter">
        <button class="playBtn" id="playBtn" aria-label="Play">▶</button>
        <div class="gateText">ForBrain • Technology</div>
        <div class="gateSub">Tap / Click to start</div>
      </div>
    </div>
  `);

  document.getElementById("playBtn").addEventListener("click", () => {
    if (!guardClick(200)) return;
    haptic?.(10); beep?.(720, 0.04); vibro(20);
    document.querySelector(".gate")?.classList.add("fadeOut");
    setTimeout(() => renderMarketingScreen(), 250);
  });
}

// 2) Marketing (UZ+RU вместе)
function renderMarketingScreen() {
  stopTimer();

  setView(`
    <div class="container">
      <div class="card">
        <h1 style="margin:0;">ForBrain Technology</h1>

        <div class="spacer"></div>

        <p style="font-size:18px; font-weight:700; margin:0;">
          Farzandingiz qaysi yo‘nalishga moyil?<br>
          Ваш ребёнок к какому направлению склонен?
        </p>

        <div class="spacer"></div>

        <p class="small" style="margin:0;">
          3–5 daqiqalik bepul test kuchli tomonlarni aniqlaydi.<br>
          Бесплатный тест за 3–5 минут покажет сильные стороны.
        </p>

        <div class="spacer"></div>

        <div style="text-align:left;">
          <div class="badge">🧠 Mantiq / Логика</div><div class="spacer"></div>
          <div class="badge">💻 IT va dasturlash / IT и программирование</div><div class="spacer"></div>
          <div class="badge">🎮 3D va muhandislik / 3D и инженерное мышление</div><div class="spacer"></div>
          <div class="badge">⚡ Fizika / Физика</div>
        </div>

        <div class="spacer"></div>
        <button class="btn primary" id="goLang">Davom etish / Продолжить</button>
      </div>
    </div>
  `);

  document.getElementById("goLang").addEventListener("click", () => {
    if (!guardClick(200)) return;
    haptic?.(8); beep?.(880, 0.04); vibro(15);
    renderLanguageScreen();
  });
}

// 3) Language
function renderLanguageScreen() {
  stopTimer();

  setView(`
    <div class="container">
      <div class="card">
        <h1>${htmlEscape(t.chooseLangTitle || "Choose language")}</h1>
        <p class="small">${htmlEscape(t.chooseLangText || "")}</p>

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

      lang = btn.dataset.lang;
      localStorage.setItem(LANG_KEY, lang);

      t = I18N[lang] || I18N.uz;
      FLOW = makeFlow(lang);

      haptic?.(8); beep?.(720, 0.03); vibro(12);
      renderIntroScreen();
    });
  });
}

// 4) Intro
function renderIntroScreen() {
  stopTimer();

  if (!isTelegramWebApp()) {
    // в проде можно показать “Открой в Telegram”
  }

  setView(`
    <div class="container">
      <div class="card">
        <h1>${htmlEscape(t.introTitle || "ForBrain")}</h1>
        <p>${htmlEscape(t.introText || "")}</p>

        <div class="spacer"></div>
        <p class="small">${htmlEscape(t.tipFast || "")}</p>

        <div class="spacer"></div>
        <button class="btn primary" id="startBtn">${htmlEscape(t.startBtn || "Start")}</button>
      </div>
    </div>
  `);

  document.getElementById("startBtn").addEventListener("click", async () => {
    if (!guardClick(250)) return;

    haptic?.(10); beep?.(880, 0.05); vibro(18);

    flowIndex = 0;
    history = {};
    breakdown = {};

    await loadBlock(flowIndex);
    renderQuestionScreen();
  });
}

// ---------------- FLOW / LOAD BLOCK ----------------
async function loadBlock(idx) {
  const block = FLOW[idx];
  breakdown = {};

  if (!block) throw new Error("FLOW пустой или idx вне диапазона");

  if (block.file) {
    const rel = toRelPathFromDataFile(block.file);
    const packed = await loadPackedBlock(lang, rel);
    engine = new Engine(normalizePacked(packed), block.mode);
    return;
  }

  if (block.parts) {
    let finalQuestions = [];

    for (const part of block.parts) {
      const rel = toRelPathFromDataFile(part.file);
      const packed = await loadPackedBlock(lang, rel);
      const normalized = normalizePacked(packed);

      const tagged = normalized.map(q => ({ ...q, tag: part.tag }));
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

// ---------------- Test UI ----------------
function renderTopBar() {
  const total = engine?.total ?? 0;
  const current = (engine?.index ?? 0) + 1;
  const percent = total ? Math.round(((current - 1) / total) * 100) : 0;

  const blockId = FLOW[flowIndex]?.id ?? "block";
  const sec = FLOW[flowIndex]?.timeSec ?? 0;

  const timerBadge = sec && sec > 0
    ? `<span class="badge">⏳ <b id="timerValue">${timeLeft}s</b></span>`
    : `<span class="badge">⏳ <b>—</b></span>`;

  return `
    <div class="card">
      <div class="row" style="justify-content:space-between; align-items:center; gap:10px; flex-wrap:wrap;">
        <span class="badge">${htmlEscape(t.block || "Блок")}: <b>${htmlEscape(blockId)}</b></span>
        <span class="badge">${htmlEscape(t.question || "Вопрос")}: <b>${current}/${total}</b></span>
        <span class="badge">${htmlEscape(t.score || "Очки")}: <b>${engine?.score ?? 0}</b></span>
        ${timerBadge}
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

  setView(`
    <div class="container">
      ${renderTopBar()}
      <div class="spacer"></div>

      <div class="card">
        <h2>${htmlEscape(q.question)}</h2>

        ${q.options.map((o, i) =>
          `<div class="option" data-idx="${i}">${htmlEscape(o)}</div>`
        ).join("")}

        <div class="spacer"></div>

        <div class="row">
          <button class="btn primary" id="answerBtn" disabled>
            ${htmlEscape(t.answerBtn || "Ответить")}
          </button>
        </div>

        <p class="small">${
          FLOW[flowIndex].mode === "learn"
            ? htmlEscape(t.learnHint || "")
            : htmlEscape(t.quizHint || "")
        }</p>
      </div>
    </div>
  `);

  startTimerForQuestion();

  const btn = document.getElementById("answerBtn");

  document.querySelectorAll(".option").forEach(el => {
    el.addEventListener("click", () => {
      if (!guardClick(120)) return;

      document.querySelectorAll(".option").forEach(x => x.classList.remove("selected"));
      el.classList.add("selected");

      selected = Number(el.dataset.idx);
      btn.disabled = false;

      haptic?.(8);
      beep?.(720, 0.03);
    });
  });

  btn.addEventListener("click", () => {
    if (!guardClick(250)) return;
    if (selected === null) return;

    stopTimer();

    const qBefore = engine.current();
    const res = engine.answer(selected);

    if (qBefore?.tag && breakdown[qBefore.tag]) {
      if (res.ok) breakdown[qBefore.tag].correct += 1;
    }

    if (FLOW[flowIndex].mode === "learn") {
      renderFeedbackScreen(res);
    } else {
      haptic?.(10);
      if (res.ok) beep?.(950, 0.05);
      else beep?.(220, 0.07);
      goNext();
    }
  });
}

function renderFeedbackScreen(res) {
  stopTimer();

  const ok = !!res.ok;
  const msg = (res.feedback && res.feedback.trim())
    ? res.feedback
    : (ok ? (t.feedbackOk || "Верно.") : (t.feedbackBad || "Неверно."));

  setView(`
    <div class="container">
      ${renderTopBar()}
      <div class="spacer"></div>

      <div class="card">
        <h2 class="notice ${ok ? "ok" : "bad"}">${ok ? "✅" : "⚠️"}</h2>
        <p>${htmlEscape(msg)}</p>

        <div class="spacer"></div>

        <div class="row">
          <button class="btn primary" id="nextBtn">${htmlEscape(t.nextBtn || "Дальше")}</button>
        </div>
      </div>
    </div>
  `);

  document.getElementById("nextBtn").addEventListener("click", () => {
    if (!guardClick(250)) return;
    haptic?.(8);
    beep?.(880, 0.04);
    goNext();
  });
}

function renderBreakdownBars() {
  const labels = (t.tags || {});
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
    score, total, overall,
    breakdown: JSON.parse(JSON.stringify(breakdown)),
  };

  const nextIndex = flowIndex + 1;
  const hasNext = nextIndex < FLOW.length;

  setView(`
    <div class="container">
      <div class="card">
        <h1>${htmlEscape(t.doneTitle || "Готово!")}</h1>

        <div class="spacer"></div>

        <p><b>${htmlEscape(t.block || "Блок")}:</b> ${htmlEscape(blockId)}</p>
        <p><b>${htmlEscape(t.result || "Результат")}:</b> ${score}/${total} • <b>${overall}%</b> • <b>${levelByPercent(overall)}</b></p>

        ${blockId === "stage1" ? renderBreakdownBars() : ""}

        <div class="spacer"></div>

        ${
          hasNext
            ? `<p>${htmlEscape(t.continueQ || "Продолжить?")}</p>`
            : `<p>${htmlEscape("Показать итоговый профиль и рекомендации?")}</p>`
        }

        <div class="spacer"></div>

        <div class="row">
          ${
            hasNext
              ? `<button class="btn primary" id="nextBlockBtn">${htmlEscape(t.yes || "Далее")}</button>`
              : `<button class="btn primary" id="finalBtn">${htmlEscape("Показать результат")}</button>`
          }
          <button class="btn" id="restartBtn">${htmlEscape(t.restartBtn || "Пройти заново")}</button>
        </div>
      </div>
    </div>
  `);

  if (hasNext) {
    document.getElementById("nextBlockBtn").addEventListener("click", async () => {
      if (!guardClick(250)) return;
      haptic?.(10); beep?.(880, 0.05);

      flowIndex = nextIndex;
      await loadBlock(flowIndex);
      renderQuestionScreen();
    });
  } else {
    document.getElementById("finalBtn").addEventListener("click", () => {
      if (!guardClick(250)) return;
      haptic?.(10); beep?.(880, 0.05);
      renderConsentScreen(() => renderFinalSummaryScreen());
    });
  }

  document.getElementById("restartBtn").addEventListener("click", () => {
    if (!guardClick(250)) return;
    flowIndex = 0;
    history = {};
    renderPlayGate();
  });
}

function renderConsentScreen(onDone) {
  stopTimer();

  setView(`
    <div class="container">
      <div class="card">
        <h1 style="margin:0;">${htmlEscape(t.consentTitle || "Согласие")}</h1>

        <div class="spacer"></div>
        <p class="small">${htmlEscape(t.consentText || "")}</p>

        <div class="spacer"></div>

        <label class="small">
          <input type="checkbox" id="consentChk">
          ${htmlEscape(t.consentChk || "Я согласен(на).")}
        </label>

        <div class="spacer"></div>

        <div class="row">
          <button class="btn primary" id="consentYes" disabled>${htmlEscape(t.consentYes || "Да")}</button>
          <button class="btn" id="consentNo">${htmlEscape(t.consentNo || "Нет")}</button>
        </div>
      </div>
    </div>
  `);

  const yesBtn = document.getElementById("consentYes");
  document.getElementById("consentChk").addEventListener("change", (e) => {
    yesBtn.disabled = !e.target.checked;
  });

  document.getElementById("consentYes").addEventListener("click", () => {
    if (!guardClick(250)) return;
    localStorage.setItem(CONSENT_KEY, "1");
    onDone();
  });

  document.getElementById("consentNo").addEventListener("click", () => {
    if (!guardClick(250)) return;
    localStorage.setItem(CONSENT_KEY, "0");
    onDone();
  });
}

function renderFinalSummaryScreen() {
  stopTimer();

  const u = getTelegramUser();
  const tgId = String(u?.id || "0");
  const savedKey = SAVED_KEY_PREFIX + tgId;

  const consent = localStorage.getItem(CONSENT_KEY) === "1";
  const alreadySaved = localStorage.getItem(savedKey) === "1";

  const s1 = history.stage1?.breakdown || {};
  const pLogic = s1.logic ? pct(s1.logic.correct, s1.logic.total) : null;
  const pAlgo  = s1.algorithm ? pct(s1.algorithm.correct, s1.algorithm.total) : null;
  const pSpat  = s1.spatial ? pct(s1.spatial.correct, s1.spatial.total) : null;
  const pEng   = s1.engineering ? pct(s1.engineering.correct, s1.engineering.total) : null;

  const engineerScore = (pSpat ?? 0) + (pEng ?? 0);
  const coderScore = (pAlgo ?? 0) + (pLogic ?? 0);

  let profileIcon = "⚖️";
  if (!history.stage1) profileIcon = "ℹ️";
  else if (engineerScore - coderScore >= 20) profileIcon = "🛠️";
  else if (coderScore - engineerScore >= 20) profileIcon = "💻";

  setView(`
    <div class="container">
      <div class="card">
        <h1 style="margin:0;">${htmlEscape(t.profileTitle || "Твой профиль")}</h1>

        <div class="spacer"></div>

        <p class="small"><b>Telegram:</b> @${htmlEscape(u?.username || "no_username")} (id: ${htmlEscape(tgId)})</p>
        <p><b>${htmlEscape(t.profileLabel || "Профиль")}:</b> ${profileIcon}</p>

        <div class="spacer"></div>

        <h3>${htmlEscape(t.coursePickTitle || "Что дальше?")}</h3>
        <p class="small">${htmlEscape(t.coursePickHint || "")}</p>

        <div class="row" style="flex-wrap:wrap; gap:10px;">
          <button class="btn" data-course="3D">${htmlEscape(t.course3d || "3D")}</button>
          <button class="btn" data-course="Cyber">${htmlEscape(t.courseCyber || "Cyber")}</button>
          <button class="btn" data-course="Physics">${htmlEscape(t.coursePhysics || "Physics")}</button>
          <button class="btn" data-course="IT">${htmlEscape(t.courseIT || "IT")}</button>
          <button class="btn" data-course="Prog">${htmlEscape(t.courseProg || "Programming")}</button>
          <button class="btn" data-course="Other">${htmlEscape(t.courseOther || "Other")}</button>
        </div>

        <div class="spacer"></div>
        <input id="customCourse" class="input" placeholder="${htmlEscape(t.courseOtherPlaceholder || "")}" />

        <div class="spacer"></div>
        <p class="small">
          ${consent ? "Consent: ✅" : "Consent: ❌"}
          ${alreadySaved ? `<br><b>${htmlEscape(t.savedOnce || "Already saved.")}</b>` : ""}
        </p>

        <div class="spacer"></div>

        <div class="row">
          <button class="btn primary" id="saveBtn" disabled>${htmlEscape(t.saveBtn || "Save")}</button>
          <button class="btn" id="restartBtn">${htmlEscape(t.restartBtn || "Restart")}</button>
        </div>

        <div class="spacer"></div>
        <p class="small">${htmlEscape(t.savedDemoHint || "")}</p>
      </div>
    </div>
  `);

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

      haptic?.(8);
      beep?.(720, 0.03);
    });
  });

  saveBtn.addEventListener("click", () => {
    if (!guardClick(250)) return;

    if (!consent) {
      alert(t.needConsent || "Consent required.");
      return;
    }
    if (alreadySaved) return;

    const custom = (document.getElementById("customCourse").value || "").trim();
    const finalCourse = pickedCourse === "Other" ? custom : pickedCourse;

    appendLocalLog({
      tg_id: tgId,
      tg_username: u?.username || "",
      lang,
      course: finalCourse || "",
      profile: profileIcon,
      history,
    });

    localStorage.setItem(savedKey, "1");
    haptic?.(25);
    beep?.(1100, 0.08);
    alert(t.savedOk || "Saved!");

    renderFinalSummaryScreen();
  });

  document.getElementById("restartBtn").addEventListener("click", () => {
    if (!guardClick(250)) return;
    flowIndex = 0;
    history = {};
    renderPlayGate();
  });
}

// ---------------- flow navigation ----------------
function goNext() {
  stopTimer();
  const hasMore = engine.next();
  if (hasMore) return renderQuestionScreen();
  return renderBlockSummaryScreen();
}

// START
renderPlayGate();