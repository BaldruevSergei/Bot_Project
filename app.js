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

// Google Apps Script Web App URL (принимает POST JSON)
const GOOGLE_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbwGL1xMmJIC92wff1KukEu5liAbmyHjpy1H1JW_IKB0QGTb1i4C7hZwUAjlOcHRyRH0uA/exec";

// Telegram username консультанта / ссылка
const CONSULT_USERNAME = "https://t.me/muhlisa_yuldashovna";

// 🔐 секрет для Apps Script (должен совпадать с SECRET в Code.gs)
const APP_SECRET = "forbrain_secret_2026_x9K";

// --- storage keys ---
const LANG_KEY = "forbrain_lang_v1";
const CONSENT_KEY = "forbrain_consent_v1";
const SAVED_KEY_PREFIX = "forbrain_saved_tg_";
const LOCAL_LOG_KEY = "forbrain_local_log_v1";

// ---- device lock v1 (запираем после клика "консультация") ----
const DEVICE_ID_KEY = "fb_device_id_v1";
const COMPLETED_KEY = "fb_completed_v1";

// ---- choice lock v1 (запираем Save choice, чтобы не спамили) ----
const CHOICE_SAVED_KEY = "fb_choice_saved_v1";
const CHOICE_LAST_DIR_KEY = "fb_choice_last_dir_v1";

function getDeviceId() {
  let id = localStorage.getItem(DEVICE_ID_KEY);
  if (!id) {
    id =
      (crypto.randomUUID && crypto.randomUUID()) ||
      "d_" + Math.random().toString(16).slice(2);
    localStorage.setItem(DEVICE_ID_KEY, id);
  }
  return id;
}
function isCompleted() {
  return localStorage.getItem(COMPLETED_KEY) === "1";
}
function markCompleted() {
  localStorage.setItem(COMPLETED_KEY, "1");
}

function isChoiceSaved() {
  return localStorage.getItem(CHOICE_SAVED_KEY) === "1";
}
function markChoiceSaved(dir) {
  localStorage.setItem(CHOICE_SAVED_KEY, "1");
  if (dir) localStorage.setItem(CHOICE_LAST_DIR_KEY, dir);
}
function getLastChoice() {
  return localStorage.getItem(CHOICE_LAST_DIR_KEY) || "";
}

const deviceId = getDeviceId();

// если уже проходил — показываем заглушку и выходим
if (isCompleted()) {
  document.getElementById("app").innerHTML = `
    <div style="padding:20px; font-family: sans-serif;">
      <h2>Вы уже проходили тест с этого устройства</h2>
      <p>Если нужен разбор — нажмите «Написать консультанту».</p>
      <a href="${CONSULT_USERNAME}" target="_blank" rel="noopener"
         style="display:inline-block; padding:12px 16px; border:1px solid #000; text-decoration:none;">
        Написать консультанту
      </a>
    </div>
  `;
  throw new Error("Device locked: already completed");
}

if (window.Telegram?.WebApp) {
  window.Telegram.WebApp.expand();
}

// --- i18n state ---
let lang = localStorage.getItem(LANG_KEY) || "uz";
let t = I18N[lang] || I18N.uz;
let FLOW = makeFlow(lang);

// --- app state ---
let flowIndex = 0;
let engine = null;
let selected = null;

let breakdown = {}; // { tag: {correct,total} }
let history = {}; // { blockId: {...} }

let timerId = null;
let timeLeft = 0;

let lastClickTs = 0;

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
  try {
    navigator.vibrate?.(ms);
  } catch {}
}

function tr(key, fallback = "") {
  const v = t?.[key];
  return v === undefined || v === null || v === "" ? fallback : v;
}

function setLang(code) {
  lang = code;
  localStorage.setItem(LANG_KEY, lang);
  t = I18N[lang] || I18N.uz;
  FLOW = makeFlow(lang);
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
      engine?.skip?.();
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
      if (!res.ok) {
        lastErr = new Error(`${res.status} ${u}`);
        continue;
      }
      return await res.json();
    } catch (e) {
      lastErr = e;
    }
  }
  throw lastErr || new Error("fetch failed");
}

async function loadPackedBlock(langCode, relPath) {
  const bases = [
    `./public/questions/${langCode}/${relPath}`,
    `./questions/${langCode}/${relPath}`,
  ];

  const urls = [];
  for (const b of bases) {
    urls.push(new URL(`${b}.packed.json`, window.location.href).toString());
    urls.push(new URL(`${b}.packed`, window.location.href).toString());
  }

  return await fetchJsonTry(urls);
}

function normalizePacked(arr) {
  return (arr || []).map((x) => ({
    question: x.q,
    options: x.o,
    k: x.k,
    feedbackOk: x.ok || "",
    feedbackBad: x.bad || "",
  }));
}

function toRelPathFromDataFile(file) {
  return file
    .replace(/^\.?\/*data\//, "")
    .replace(/^\w+\//, "")
    .replace(/\.txt$/i, "");
}

// ---------------- Screens ----------------

// 1) Gate (video + play) — RU + UZ always
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

        <div class="gateText">
          ForBrain Akademiya • Академия
        </div>

        <div class="gateSub">
          Boshlash uchun bosing / Нажмите, чтобы начать
        </div>
      </div>
    </div>
  `);

  document.getElementById("playBtn").addEventListener("click", () => {
    if (!guardClick(200)) return;

    haptic?.(10);
    beep?.(720, 0.04);
    vibro(20);

    document.querySelector(".gate")?.classList.add("fadeOut");
    setTimeout(() => renderMarketingScreen(), 250);
  });
}

// 2) Marketing (RU + UZ together, NO i18n here by design)
function renderMarketingScreen() {
  stopTimer();

  setView(`
    <div class="container">
      <div class="card">
        <h1 style="margin:0;">ForBrain Akademiya • Академия</h1>

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
          <div class="badge">🎮 3D-grafika va muhandislik / 3D-графика и инженерное мышление</div><div class="spacer"></div>
          <div class="badge">⚡ Fizika / Физика</div><div class="spacer"></div>
          <div class="badge">🤖 Sun’iy intellekt / Искусственный интеллект</div>
        </div>

        <div class="spacer"></div>

        <button class="btn primary" id="goLang">
          Davom etish / Продолжить
        </button>
      </div>
    </div>
  `);

  document.getElementById("goLang").addEventListener("click", () => {
    if (!guardClick(200)) return;
    haptic?.(8);
    beep?.(880, 0.04);
    vibro(15);
    renderLanguageScreen();
  });
}

// 3) Language (NEUTRAL: always 3 langs, no i18n)
function renderLanguageScreen() {
  stopTimer();

  setView(`
    <div class="container">
      <div class="card">
        <h1 style="margin:0; font-size:20px; line-height:1.25;">
          🇷🇺 Выберите язык<br>
          🇺🇿 Tilni tanlang<br>
          🇬🇧 Choose language
        </h1>

        <div class="spacer"></div>

        <p class="small" style="margin:0; line-height:1.45;">
          🇷🇺 Этот язык будет использоваться в тесте и результатах.<br>
          🇺🇿 Bu til test va natijalarda ishlatiladi.<br>
          🇬🇧 This language will be used in the test and results.
        </p>

        <div class="spacer"></div>

        <div class="row" style="flex-wrap:wrap; gap:10px;">
          <button class="btn" data-lang="ru">Русский</button>
          <button class="btn" data-lang="uz">O‘zbekcha</button>
          <button class="btn" data-lang="en">English</button>
        </div>
      </div>
    </div>
  `);

  document.querySelectorAll("[data-lang]").forEach((btn) => {
    btn.addEventListener("click", () => {
      if (!guardClick(200)) return;

      setLang(btn.dataset.lang);

      haptic?.(8);
      beep?.(720, 0.03);
      vibro(12);
      renderIntroScreen();
    });
  });
}

// 4) Intro
function renderIntroScreen() {
  stopTimer();

  setView(`
    <div class="container">
      <div class="card">
        <h1>${htmlEscape(tr("introTitle", "ForBrain"))}</h1>
        <p>${htmlEscape(tr("introText", ""))}</p>

        <div class="spacer"></div>
        <p class="small">${htmlEscape(tr("tipFast", ""))}</p>

        <div class="spacer"></div>
        <button class="btn primary" id="startBtn">${htmlEscape(
          tr("startBtn", "Start")
        )}</button>
      </div>
    </div>
  `);

  document.getElementById("startBtn").addEventListener("click", async () => {
    if (!guardClick(250)) return;

    haptic?.(10);
    beep?.(880, 0.05);
    vibro(18);

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

  if (!block) throw new Error("FLOW empty or idx out of range");

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

      const tagged = normalized.map((q) => ({ ...q, tag: part.tag }));
      const selectedPart = takeRandom(tagged, part.pick);

      breakdown[part.tag] ??= { correct: 0, total: 0 };
      breakdown[part.tag].total += selectedPart.length;

      finalQuestions = finalQuestions.concat(selectedPart);
    }

    finalQuestions = shuffle(finalQuestions);
    engine = new Engine(finalQuestions, block.mode);
    return;
  }

  throw new Error("Unknown block config in FLOW");
}

// ---------------- Test UI ----------------
function renderTopBar() {
  const total = engine?.total ?? 0;
  const current = (engine?.index ?? 0) + 1;
  const percent = total ? Math.round(((current - 1) / total) * 100) : 0;

  const blockId = FLOW[flowIndex]?.id ?? "block";
  const sec = FLOW[flowIndex]?.timeSec ?? 0;

  const timerBadge =
    sec && sec > 0
      ? `<span class="badge">⏳ <b id="timerValue">${timeLeft}s</b></span>`
      : `<span class="badge">⏳ <b>—</b></span>`;

  return `
    <div class="card">
      <div class="row" style="justify-content:space-between; align-items:center; gap:10px; flex-wrap:wrap;">
        <span class="badge">${htmlEscape(
          tr("block", "Block")
        )}: <b>${htmlEscape(blockId)}</b></span>
        <span class="badge">${htmlEscape(
          tr("question", "Question")
        )}: <b>${current}/${total}</b></span>
        <span class="badge">${htmlEscape(
          tr("score", "Score")
        )}: <b>${engine?.score ?? 0}</b></span>
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

        ${q.options
          .map(
            (o, i) =>
              `<div class="option" data-idx="${i}">${htmlEscape(o)}</div>`
          )
          .join("")}

        <div class="spacer"></div>

        <div class="row">
          <button class="btn primary" id="answerBtn" disabled>
            ${htmlEscape(tr("answerBtn", "Answer"))}
          </button>
        </div>

        <p class="small">${
          FLOW[flowIndex].mode === "learn"
            ? htmlEscape(tr("learnHint", ""))
            : htmlEscape(tr("quizHint", ""))
        }</p>
      </div>
    </div>
  `);

  startTimerForQuestion();

  const btn = document.getElementById("answerBtn");

  document.querySelectorAll(".option").forEach((el) => {
    el.addEventListener("click", () => {
      if (!guardClick(120)) return;

      document
        .querySelectorAll(".option")
        .forEach((x) => x.classList.remove("selected"));
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
  const msg =
    res.feedback && res.feedback.trim()
      ? res.feedback
      : ok
      ? tr("feedbackOk", "Correct.")
      : tr("feedbackBad", "Incorrect.");

  setView(`
    <div class="container">
      ${renderTopBar()}
      <div class="spacer"></div>

      <div class="card">
        <h2 class="notice ${ok ? "ok" : "bad"}">${ok ? "✅" : "⚠️"}</h2>
        <p>${htmlEscape(msg)}</p>

        <div class="spacer"></div>

        <div class="row">
          <button class="btn primary" id="nextBtn">${htmlEscape(
            tr("nextBtn", "Next")
          )}</button>
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
  const labels = t.tags || {};
  const keys = Object.keys(breakdown);
  if (!keys.length) return "";

  return keys
    .map((tag) => {
      const c = breakdown[tag].correct;
      const tt = breakdown[tag].total;
      const p = pct(c, tt);

      return `
      <div class="spacer"></div>
      <div class="badge">${htmlEscape(
        labels[tag] ?? tag
      )}: <b>${c}/${tt}</b> • <b>${p}%</b></div>
      <div class="spacer"></div>
      <div class="progress"><div style="width:${p}%"></div></div>
    `;
    })
    .join("");
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
        <h1>${htmlEscape(tr("doneTitle", "Done!"))}</h1>

        <div class="spacer"></div>

        <p><b>${htmlEscape(tr("block", "Block"))}:</b> ${htmlEscape(blockId)}</p>
        <p><b>${htmlEscape(tr("result", "Result"))}:</b> ${score}/${total} • <b>${overall}%</b> • <b>${levelByPercent(
    overall
  )}</b></p>

        ${blockId === "stage1" ? renderBreakdownBars() : ""}

        <div class="spacer"></div>

        ${
          hasNext
            ? `<p>${htmlEscape(tr("continueQ", "Continue?"))}</p>`
            : `<p>${htmlEscape(
                tr("finalAsk", "Show final profile and recommendations?")
              )}</p>`
        }

        <div class="spacer"></div>

        <div class="row" style="flex-direction:column; gap:12px;">
          ${
            hasNext
              ? `<button class="btn primary" id="nextBlockBtn">${htmlEscape(
                  tr("yes", "Next")
                )}</button>`
              : `<button class="btn primary" id="finalBtn">${htmlEscape(
                  tr("showResult", "Show result")
                )}</button>`
          }
          <button class="btn" id="restartBtn">${htmlEscape(
            tr("restartBtn", "Restart")
          )}</button>
        </div>
      </div>
    </div>
  `);

  if (hasNext) {
    document
      .getElementById("nextBlockBtn")
      .addEventListener("click", async () => {
        if (!guardClick(250)) return;
        haptic?.(10);
        beep?.(880, 0.05);

        flowIndex = nextIndex;
        await loadBlock(flowIndex);
        renderQuestionScreen();
      });
  } else {
    document.getElementById("finalBtn").addEventListener("click", () => {
      if (!guardClick(250)) return;
      haptic?.(10);
      beep?.(880, 0.05);
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
        <h1 style="margin:0;">${htmlEscape(tr("consentTitle", "Consent"))}</h1>

        <div class="spacer"></div>
        <p class="small">${htmlEscape(tr("consentText", ""))}</p>

        <div class="spacer"></div>

        <label class="small">
          <input type="checkbox" id="consentChk">
          ${htmlEscape(tr("consentChk", "I agree."))}
        </label>

        <div class="spacer"></div>

        <div class="row">
          <button class="btn primary" id="consentYes" disabled>${htmlEscape(
            tr("consentYes", "Yes")
          )}</button>
          <button class="btn" id="consentNo">${htmlEscape(
            tr("consentNo", "No")
          )}</button>
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

// ---------------- FINAL SCREEN ----------------
function renderFinalSummaryScreen() {
  stopTimer();

  const u = getTelegramUser();
  const tgId = String(u?.id || "0");
  const username = u?.username || "";

  const s1 = history.stage1?.breakdown || {};

  const pctSafe = (obj) => {
    if (!obj || !obj.total) return 0;
    return Math.round((obj.correct / obj.total) * 100);
  };

  const logic = pctSafe(s1.logic);
  const algo = pctSafe(s1.algorithm);
  const spatial = pctSafe(s1.spatial);
  const eng = pctSafe(s1.engineering);

  const coderScore = logic + algo;
  const engineerScore = spatial + eng;

  let profileKey = "finalProfileUniversal";
  let profileIcon = "🧠";

  if (coderScore - engineerScore >= 20) {
    profileKey = "finalProfileIT";
    profileIcon = "💻";
  } else if (engineerScore - coderScore >= 20) {
    profileKey = "finalProfileEngineering";
    profileIcon = "🛠️";
  }

  const profileText = tr(profileKey, "Universal profile");

  setView(`
    <div class="container">
      <div class="card">
        <h1 style="margin:0;">${htmlEscape(tr("finalTitle", "Your result"))}</h1>

        <div class="spacer"></div>

        <p><b>${profileIcon} ${htmlEscape(profileText)}</b></p>

        <div class="spacer"></div>

        <div class="card" style="background:rgba(59,130,246,.08); border-color:rgba(59,130,246,.35);">
          <h3 style="margin:0;">${htmlEscape(tr("intensiveTitle", ""))}</h3>
          <div class="spacer"></div>
          <p style="margin:0;">${htmlEscape(tr("intensiveLine1", ""))}</p>
          <div class="spacer"></div>
          <p class="small" style="margin:0;">${htmlEscape(tr("intensiveLine2", ""))}</p>
          <p class="small" style="margin:0;">${htmlEscape(tr("intensiveLine3", ""))}</p>
          <div class="spacer"></div>
          <p style="margin:0;"><b>${htmlEscape(tr("intensiveStart", ""))}</b></p>
        </div>

        <div class="spacer"></div>

        <p class="small" style="margin:0;">${htmlEscape(tr("chooseDirection", ""))}</p>
        <div class="spacer"></div>

        <div class="row" style="flex-wrap:wrap; gap:10px;">
          <button class="btn dirBtn" data-dir="logic">🧠 ${htmlEscape(tr("dirLogic", "Logic"))}</button>
          <button class="btn dirBtn" data-dir="it">💻 ${htmlEscape(tr("dirIT", "IT"))}</button>
          <button class="btn dirBtn" data-dir="3d">🎮 ${htmlEscape(tr("dir3D", "3D"))}</button>
          <button class="btn dirBtn" data-dir="physics">⚡ ${htmlEscape(tr("dirPhysics", "Physics"))}</button>
          <button class="btn dirBtn" data-dir="ai">🤖 ${htmlEscape(tr("dirAI", "AI"))}</button>
          <button class="btn dirBtn" data-dir="custom">✍️ ${htmlEscape(tr("dirCustom", "Other"))}</button>
        </div>

        <div class="spacer"></div>

        <input
          id="customInput"
          class="input"
          placeholder="${htmlEscape(tr("dirCustomPlaceholder", ""))}"
        />

        <div class="spacer"></div>

        <div class="row" style="flex-direction:column; gap:12px;">
          <button class="btn primary" id="sendBtn" disabled>
            ${htmlEscape(tr("sendResult", "Save choice"))}
          </button>

          <button class="btn" id="consultBtn" disabled>
            ${htmlEscape(tr("getConsult", "Get consultation"))}
          </button>
        </div>

        <div class="spacer"></div>
        <p class="small" style="margin:0;">${htmlEscape(tr("twoClicksHint", ""))}</p>
      </div>
    </div>
  `);

  let selectedDir = null;
  let sent = false;

  const sendBtn = document.getElementById("sendBtn");
  const consultBtn = document.getElementById("consultBtn");

  // если уже сохранял раньше — не даём Save, но консультацию разрешаем
  if (isChoiceSaved()) {
    sent = true;
    sendBtn.disabled = true;
    sendBtn.textContent = tr("savedOk", "Saved!");
    consultBtn.disabled = false;
  }

  document.querySelectorAll(".dirBtn").forEach((btn) => {
    btn.addEventListener("click", () => {
      if (!guardClick(120)) return;

      document
        .querySelectorAll(".dirBtn")
        .forEach((b) => b.classList.remove("selected"));
      btn.classList.add("selected");

      selectedDir = btn.dataset.dir;

      // если уже сохранял ранее — Save не включаем (иначе спам)
      if (!isChoiceSaved()) sendBtn.disabled = false;

      haptic?.(8);
      beep?.(720, 0.03);
    });
  });

  sendBtn.addEventListener("click", async () => {
    if (!guardClick(250)) return;
    if (!selectedDir) return;
    if (sent) return;

    // фронтовая защита от спама
    if (isChoiceSaved()) {
      alert(tr("alreadySaved", "Вы уже сохраняли выбор с этого устройства."));
      consultBtn.disabled = false;
      return;
    }

    // 🔒 сразу блокируем кнопку, чтобы не было двойного клика
    sendBtn.disabled = true;
    sendBtn.textContent = tr("sending", "Отправка...");

    const custom = (document.getElementById("customInput")?.value || "").trim();
    const finalDir = selectedDir === "custom" ? custom : selectedDir;

    if (selectedDir === "custom" && !finalDir) {
      alert(tr("needCustomDir", "Please type your option."));
      sendBtn.disabled = false;
      sendBtn.textContent = tr("sendResult", "Save choice");
      return;
    }

    const u2 = getTelegramUser();
    const tgId2 = String(u2?.id || "0");

    // уникальный event_id (пусть будет с временем — сервер сам сделает upsert по device_id)
    const eventId = `save_${deviceId}_${Date.now()}`;

    const payload = {
      secret: APP_SECRET,
      event_id: eventId,
      device_id: deviceId,
      tg_id: tgId2,
      username,
      lang,
      profile: profileText,
      direction: finalDir || "",
      history,
      ts: new Date().toISOString(),
    };

    appendLocalLog(payload);

    try {
      if (GOOGLE_SCRIPT_URL && !GOOGLE_SCRIPT_URL.includes("PASTE_")) {
      await fetch(GOOGLE_SCRIPT_URL, {
      method: "POST",
      headers: { "Content-Type": "text/plain;charset=utf-8" }, // ✅ важно
      body: JSON.stringify(payload),
      });
      }
    } catch (e) {
      console.log("send analytics error", e);
      alert(tr("sendFail", "Network error. Try again."));
      sendBtn.disabled = false;
      sendBtn.textContent = tr("sendResult", "Save choice");
      return;
    }

    sent = true;
    consultBtn.disabled = false;

    // ✅ запоминаем, что Save уже был (и какой dir)
    markChoiceSaved(finalDir);

    haptic?.(18);
    beep?.(980, 0.06);
    alert(tr("savedOk", "Saved!"));
  });

  function resolveDirLabel() {
    const custom = (document.getElementById("customInput")?.value || "").trim();

    // если выбрали сейчас
    if (selectedDir) {
      if (selectedDir === "custom") return custom || tr("dirCustom", "Other");
      return tr(`dirLabel_${selectedDir}`, selectedDir);
    }

    // если уже сохраняли раньше — берём последнее из localStorage
    const last = getLastChoice();
    if (last) return tr(`dirLabel_${last}`, last);

    return tr("dirCustom", "Other");
  }

  consultBtn.addEventListener("click", () => {
    if (!guardClick(250)) return;

    // консультацию разрешаем если: либо уже sent, либо уже раньше сохраняли (isChoiceSaved)
    if (!sent && !isChoiceSaved()) return;

    const msgTemplate = tr(
      "consultMessage",
      "Hello! I finished the test. Profile: {profile}. Direction: {direction}."
    );

    const dirLabel = resolveDirLabel();

    const msg = encodeURIComponent(
      msgTemplate
        .replace("{profile}", profileText)
        .replace("{direction}", dirLabel)
    );

    const w = window.open(`${CONSULT_USERNAME}?text=${msg}`, "_blank");
    if (w) markCompleted(); // ✅ запираем устройство только после реального ухода к консультанту
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