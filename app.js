// app.js
import { Engine } from "./core/engine.js";
import { beep, haptic } from "./core/fx.js";
import { takeRandom, shuffle } from "./core/random.js";
import { LANGS, I18N } from "./core/i18n.js";
import { makeFlow } from "./core/flowFactory.js";

const app = document.getElementById("app");

// true = разрешаем запуск в браузере (ПК), false = только Telegram WebApp
const DEV_BYPASS_TG = true;

// --- storage keys ---
const LANG_KEY = "forbrain_lang_v1";
const CONSENT_KEY = "forbrain_consent_v1";
const SAVED_KEY_PREFIX = "forbrain_saved_tg_"; // + tgId
const LOCAL_LOG_KEY = "forbrain_local_log_v1"; // demo local storage

// --- i18n ---
let lang = localStorage.getItem(LANG_KEY) || "uz";
let t = I18N[lang] || I18N.uz;
let FLOW = makeFlow(lang);

// --- state ---
let flowIndex = 0;
let engine = null;
let selected = null;
let langLocked = false;

let breakdown = {}; // { tag: {correct,total} }
let history = {};   // { blockId: {...} }

let timerId = null;
let timeLeft = 0;
let lastClickTs = 0;

// ---------------- helpers ----------------
function vibro(ms = 25) {
  try { navigator.vibrate?.(ms); } catch {}
}
function guardClick(minMs = 300) {
  const now = Date.now();
  if (now - lastClickTs < minMs) return false;
  lastClickTs = now;
  return true;
}
function setView(html) { app.innerHTML = html; }
function htmlEscape(s) {
  return (s ?? "")
    .toString()
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}
function pct(a, b) { return b ? Math.round((a / b) * 100) : 0; }
function levelByPercent(p) {
  if (p >= 85) return "🏆";
  if (p >= 70) return "🔥";
  if (p >= 50) return "✅";
  if (p >= 30) return "🌱";
  return "🧩";
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

// ---------------- load packed ----------------
// !!! ВАЖНО: БЕЗ /public — public это корень сайта !!!
async function loadPackedBlock(langCode, relPath) {
  const url = `/questions/${langCode}/${relPath}.packed.json`;
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) throw new Error(`Cannot load ${url}: ${res.status}`);
  return await res.json(); // array
}

// packed -> UI format
function normalizePacked(arr) {
  return arr.map(x => ({
    // UI expects these:
    question: x.q,
    options: x.o,
    k: x.k,

    // hints for learn mode:
    feedbackOk: x.ok || "",
    feedbackBad: x.bad || "",

    // keep extra if needed:
    ...x
  }));
}

// "./data/ru/intro/00_intro_ai.txt" -> "intro/00_intro_ai"
function toRelPathFromDataFile(file) {
  return file
    .replace(/^\.?\/*data\//, "")
    .replace(/^\w+\//, "")
    .replace(/\.txt$/i, "");
}

// ---------------- language button ----------------
function bindLangButton() {
  const btn = document.getElementById("langBtn");
  if (!btn) return;

  btn.textContent = `🌐 ${lang.toUpperCase()}`;

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

function renderLanguageModal() {
  const overlay = document.createElement("div");
  overlay.className = "modalOverlay";

  overlay.innerHTML = `
    <div class="modalCard">
      <h2>${htmlEscape(t.chooseLangTitle || "Choose language")}</h2>
      <p class="small">${htmlEscape(t.chooseLangText || "")}</p>
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
      // пока тест не начался — покажем интро
      renderIntroScreen();
    });
  });
}

function setLang(newLang) {
  lang = newLang;
  localStorage.setItem(LANG_KEY, lang);
  t = I18N[lang] || I18N.uz;
  FLOW = makeFlow(lang);
}

// ---------------- screens ----------------

// Screen 0: ripple + play
function renderPlayGate() {
  stopTimer();
  langLocked = false;

  setView(`
    <div class="gate">
      <div class="gateNoise"></div>

      <div class="gateCenter">
        <button class="playBtn" id="playBtn" aria-label="Play">
          <span class="playIcon">▶</span>
        </button>

        <div class="gateText">ForBrain • Technology</div>
        <div class="gateSub">Tap / Click to start</div>
      </div>
    </div>
  `);

  document.getElementById("playBtn").addEventListener("click", () => {
    if (!guardClick(200)) return;
    haptic?.(10);
    beep?.(720, 0.04);
    vibro(20);

    document.querySelector(".gate")?.classList.add("fadeOut");
    setTimeout(() => renderMarketingScreen(), 220);
  });
}

// Screen 1: marketing UZ+RU together
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
          <div class="badge">🧠 Mantiq / Логика</div>
          <div class="spacer"></div>
          <div class="badge">💻 IT / Dasturlash • IT / Программирование</div>
          <div class="spacer"></div>
          <div class="badge">🎮 3D / Muhandislik • 3D / Инженерность</div>
          <div class="spacer"></div>
          <div class="badge">⚡ Fizika / Физика</div>
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

// Screen 2: language choice
function renderLanguageScreen() {
  stopTimer();
  langLocked = false;

  setView(`
    <div class="container">
      <div class="card">
        <h1>${htmlEscape(t.chooseLangTitle || "Tilni tanlang / Выберите язык")}</h1>
        <p class="small">${htmlEscape(t.chooseLangText || "Choose language")}</p>

        <div class="spacer"></div>

        <div class="row" style="flex-wrap:wrap; gap:10px;">
          ${LANGS.map(x => `
            <button class="btn" data-lang="${x.code}">
              ${htmlEscape(x.label)}
            </button>
          `).join("")}
        </div>
      </div>
    </div>
  `);

  document.querySelectorAll("[data-lang]").forEach(btn => {
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

// Screen 3: intro (on chosen language)
function renderIntroScreen() {
  stopTimer();

  setView(`
    <div class="container">
      <div class="card">
        <div class="row space">
          <h1 style="margin:0;">${htmlEscape(t.introTitle || "ForBrain")}</h1>
          <button class="btn small" id="langBtn">🌐 ${lang.toUpperCase()}</button>
        </div>

        <div class="spacer"></div>
        <p>${htmlEscape(t.introText || "")}</p>

        <div class="spacer"></div>
        <p class="small">${htmlEscape(t.tipFast || "")}</p>

        <div class="spacer"></div>
        <button class="btn primary" id="startBtn">${htmlEscape(t.startBtn || "Start")}</button>
      </div>
    </div>
  `);

  bindLangButton();

  document.getElementById("startBtn").addEventListener("click", async () => {
    if (!guardClick(250)) return;

    if (!isTelegramWebApp()) {
      // если хочешь — можешь показать screen "open in telegram"
      // но DEV_BYPASS_TG=true — пропускаем
    }

    haptic?.(10);
    beep?.(880, 0.05);
    vibro(20);

    langLocked = true;
    flowIndex = 0;
    history = {};

    await loadBlock(flowIndex);
    renderQuestionScreen();
  });
}

// ---------------- flow / load block ----------------
async function loadBlock(idx) {
  const block = FLOW[idx];
  breakdown = {};

  if (!block) throw new Error("FLOW empty or idx out of range");

  // single file block
  if (block.file) {
    const rel = toRelPathFromDataFile(block.file);
    const packed = await loadPackedBlock(lang, rel);
    engine = new Engine(normalizePacked(packed), block.mode);
    return;
  }

  // parts (random selection)
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

  throw new Error("Unknown block config in FLOW");
}

// ---------------- test render ----------------
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
  if (!q) return renderBlockSummary();

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

  bindLangButton();
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

    // breakdown for stage1
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

  bindLangButton();

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

function renderBlockSummary() {
  stopTimer();

  const blockId = FLOW[flowIndex]?.id ?? "block";
  const total = engine?.total ?? 0;
  const score = engine?.score ?? 0;
  const overall = pct(score, total);

  history[blockId] = {
    score, total, overall,
    breakdown: JSON.parse(JSON.stringify(breakdown))
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
            ? `<p>${htmlEscape(t.continueQ || "Продолжить?")}</p>
               <div class="spacer"></div>
               <div class="row">
                 <button class="btn primary" id="yesNextBtn">${htmlEscape(t.yes || "Да")}</button>
                 <button class="btn" id="noBtn">${htmlEscape(t.no || "Нет")}</button>
               </div>`
            : `<p>${htmlEscape(t.continueQ || "Показать итог?")}</p>
               <div class="spacer"></div>
               <div class="row">
                 <button class="btn primary" id="finalBtn">${htmlEscape(t.result || "Результат")}</button>
                 <button class="btn" id="restartBtn">${htmlEscape(t.restartBtn || "Пройти заново")}</button>
               </div>`
        }
      </div>
    </div>
  `);

  if (hasNext) {
    document.getElementById("yesNextBtn").addEventListener("click", async () => {
      if (!guardClick(250)) return;
      haptic?.(10);
      beep?.(880, 0.05);

      flowIndex = nextIndex;
      await loadBlock(flowIndex);
      renderQuestionScreen();
    });

    document.getElementById("noBtn").addEventListener("click", () => {
      if (!guardClick(250)) return;
      renderConsentScreen(() => renderFinalSummaryScreen());
    });

  } else {
    document.getElementById("finalBtn").addEventListener("click", () => {
      if (!guardClick(250)) return;
      renderConsentScreen(() => renderFinalSummaryScreen());
    });

    document.getElementById("restartBtn").addEventListener("click", () => {
      if (!guardClick(250)) return;
      flowIndex = 0;
      history = {};
      renderPlayGate();
    });
  }
}

function goNext() {
  stopTimer();
  if (engine.next()) renderQuestionScreen();
  else renderBlockSummary();
}

// ---------------- consent + final ----------------
function renderConsentScreen(onDone) {
  stopTimer();

  setView(`
    <div class="container">
      <div class="card">
        <h1>${htmlEscape(t.consentTitle || "Согласие")}</h1>

        <div class="spacer"></div>
        <p class="small">${htmlEscape(t.consentText || "")}</p>

        <div class="spacer"></div>
        <label class="small">
          <input type="checkbox" id="consentChk">
          ${htmlEscape(t.consentChk || "Согласен")}
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

  if (!isTelegramWebApp()) {
    // Можно сделать отдельный экран “Открой в Telegram”
    // но сейчас DEV_BYPASS_TG=true — пропускаем
  }

  const u = getTelegramUser();
  const tgId = String(u?.id || "0");
  const savedKey = SAVED_KEY_PREFIX + tgId;

  const alreadySaved = localStorage.getItem(savedKey) === "1";
  const consent = localStorage.getItem(CONSENT_KEY) === "1";

  // profile by stage1 breakdown
  const s1 = history.stage1?.breakdown || {};
  const pLogic = s1.logic ? pct(s1.logic.correct, s1.logic.total) : null;
  const pAlgo  = s1.algorithm ? pct(s1.algorithm.correct, s1.algorithm.total) : null;
  const pSpat  = s1.spatial ? pct(s1.spatial.correct, s1.spatial.total) : null;
  const pEng   = s1.engineering ? pct(s1.engineering.correct, s1.engineering.total) : null;

  const engineerScore = (pSpat ?? 0) + (pEng ?? 0);
  const coderScore = (pAlgo ?? 0) + (pLogic ?? 0);

  let profile = t.profileUniversal || "⚖️";
  if (!history.stage1) profile = t.profileNeedStage1 || "ℹ️";
  else if (engineerScore - coderScore >= 20) profile = t.profileEngineer || "🛠️";
  else if (coderScore - engineerScore >= 20) profile = t.profileCoder || "💻";

  setView(`
    <div class="container">
      <div class="card">
        <h1>${htmlEscape(t.profileTitle || "Итог")}</h1>

        <div class="spacer"></div>

        <p class="small"><b>Telegram:</b> @${htmlEscape(u?.username || "no_username")} (id: ${htmlEscape(tgId)})</p>
        <p><b>${htmlEscape(t.profileLabel || "Профиль")}:</b> ${htmlEscape(profile)}</p>

        <div class="spacer"></div>

        <h3>${htmlEscape(t.coursePickTitle || "Выбери курс")}</h3>
        <p class="small">${htmlEscape(t.coursePickHint || "")}</p>

        <div class="row" style="flex-wrap:wrap; gap:10px;">
          <button class="btn" data-course="3D">${htmlEscape(t.course3d || "3D")}</button>
          <button class="btn" data-course="Cyber">${htmlEscape(t.courseCyber || "Cyber")}</button>
          <button class="btn" data-course="Physics">${htmlEscape(t.coursePhysics || "Physics")}</button>
          <button class="btn" data-course="IT">${htmlEscape(t.courseIT || "IT")}</button>
          <button class="btn" data-course="Prog">${htmlEscape(t.courseProg || "Prog")}</button>
          <button class="btn" data-course="Other">${htmlEscape(t.courseOther || "Other")}</button>
        </div>

        <div class="spacer"></div>
        <input id="customCourse" class="input" placeholder="${htmlEscape(t.courseOtherPlaceholder || "")}" />

        <div class="spacer"></div>
        <p class="small">
          ${consent ? (htmlEscape(t.consentShort || "Consent") + ": ✅") : (htmlEscape(t.consentShort || "Consent") + ": ❌")}
          ${alreadySaved ? `<br><b>${htmlEscape(t.savedOnce || "Already saved once")}</b>` : ""}
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
      alert(t.needConsent || "Need consent");
      return;
    }
    if (alreadySaved) return;

    const custom = (document.getElementById("customCourse").value || "").trim();
    const finalCourse = (pickedCourse === "Other") ? custom : pickedCourse;

    appendLocalLog({
      tg_id: tgId,
      tg_username: u?.username || "",
      lang,
      course: finalCourse || "",
      profile,
      history,
    });

    localStorage.setItem(savedKey, "1");

    haptic?.(25);
    beep?.(1100, 0.08);
    alert(t.savedOk || "Saved");

    renderFinalSummaryScreen();
  });

  document.getElementById("restartBtn").addEventListener("click", () => {
    if (!guardClick(250)) return;
    history = {};
    flowIndex = 0;
    langLocked = false;
    renderPlayGate();
  });
}

// START
renderPlayGate();