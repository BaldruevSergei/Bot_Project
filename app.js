// app.js
import { Engine } from "./core/engine.js";
import { beep, haptic } from "./core/fx.js";
import { takeRandom, shuffle } from "./core/random.js";
import { LANGS, I18N } from "./core/i18n.js";
import { makeFlow } from "./core/flowFactory.js";

const app = document.getElementById("app");
const DEV_BYPASS_TG = true;

// --- storage keys ---
const LANG_KEY = "forbrain_lang_v1";
const CONSENT_KEY = "forbrain_consent_v1";
const SAVED_KEY_PREFIX = "forbrain_saved_tg_";
const LOCAL_LOG_KEY = "forbrain_local_log_v1";

// --- i18n ---
let lang = localStorage.getItem(LANG_KEY) || "uz";
let t = I18N[lang] || I18N.uz;
let FLOW = makeFlow(lang);

// --- state ---
let flowIndex = 0;
let engine = null;
let selected = null;
let langLocked = false;
let breakdown = {};
let history = {};
let timerId = null;
let timeLeft = 0;
let lastClickTs = 0;

// ---------------- HELPERS ----------------

function guardClick(minMs = 300) {
  const now = Date.now();
  if (now - lastClickTs < minMs) return false;
  lastClickTs = now;
  return true;
}

function setView(html) {
  app.innerHTML = html;
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

// ---------------- LOAD PACKED ----------------

async function loadPackedBlock(lang, relPath) {
  const url = `/public/questions/${lang}/${relPath}.packed.json`;
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) throw new Error(`Cannot load ${url}: ${res.status}`);
  return await res.json();
}

function normalizePacked(arr) {
  return arr.map(x => ({
    question: x.q,
    options: x.o,
    k: x.k,
    ...x
  }));
}

// ---------------- FLOW ----------------

async function loadBlock(idx) {
  const block = FLOW[idx];
  breakdown = {};

  if (block.file) {
    const rel = block.file
      .replace(/^\.?\/*data\//, "")
      .replace(/^\w+\//, "")
      .replace(/\.txt$/i, "");

    const packed = await loadPackedBlock(lang, rel);
    engine = new Engine(normalizePacked(packed), block.mode);
    return;
  }

  if (block.parts) {
    let finalQuestions = [];

    for (const part of block.parts) {
      const rel = part.file
        .replace(/^\.?\/*data\//, "")
        .replace(/^\w+\//, "")
        .replace(/\.txt$/i, "");

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
  }
}

// ---------------- RENDER ----------------

function renderLanguageScreen() {
  langLocked = false;

  setView(`
    <div class="container">
      <div class="card">
        <h1>${t.chooseLangTitle}</h1>
        <div class="row">
          ${LANGS.map(x =>
            `<button class="btn" data-lang="${x.code}">${x.label}</button>`
          ).join("")}
        </div>
      </div>
    </div>
  `);

  document.querySelectorAll("[data-lang]").forEach(btn => {
    btn.addEventListener("click", () => {
      if (!guardClick()) return;
      lang = btn.dataset.lang;
      localStorage.setItem(LANG_KEY, lang);
      t = I18N[lang] || I18N.uz;
      FLOW = makeFlow(lang);
      renderIntroScreen();
    });
  });
}

function renderIntroScreen() {
  setView(`
    <div class="container">
      <div class="card">
        <h1>${t.introTitle}</h1>
        <button class="btn primary" id="startBtn">${t.startBtn}</button>
      </div>
    </div>
  `);

  document.getElementById("startBtn").addEventListener("click", async () => {
    if (!guardClick()) return;
    langLocked = true;
    flowIndex = 0;
    await loadBlock(flowIndex);
    renderQuestionScreen();
  });
}

function renderQuestionScreen() {
  selected = null;
  const q = engine.current();
  if (!q) return renderBlockSummary();

  setView(`
    <div class="container">
      <div class="card">
        <h2>${htmlEscape(q.question)}</h2>
        ${q.options.map((o, i) =>
          `<div class="option" data-idx="${i}">${htmlEscape(o)}</div>`
        ).join("")}
        <button class="btn primary" id="answerBtn" disabled>${t.answerBtn}</button>
      </div>
    </div>
  `);

  const btn = document.getElementById("answerBtn");

  document.querySelectorAll(".option").forEach(el => {
    el.addEventListener("click", () => {
      document.querySelectorAll(".option").forEach(x => x.classList.remove("selected"));
      el.classList.add("selected");
      selected = Number(el.dataset.idx);
      btn.disabled = false;
    });
  });

  btn.addEventListener("click", () => {
    if (selected === null) return;
    const res = engine.answer(selected);
    if (res.ok) beep(900, 0.05);
    goNext();
  });
}

function renderBlockSummary() {
  const score = engine.score;
  const total = engine.total;

  const nextIndex = flowIndex + 1;
  const hasNext = nextIndex < FLOW.length;

  setView(`
    <div class="container">
      <div class="card">
        <h1>Готово!</h1>
        <p>${score}/${total} (${pct(score, total)}%)</p>

        <div class="spacer"></div>

        <div class="row">
          ${
            hasNext
              ? `<button class="btn primary" id="nextBlockBtn">Дальше</button>`
              : `<button class="btn primary" id="finalBtn">Показать результат</button>`
          }
          <button class="btn" id="restartBtn">Пройти заново</button>
        </div>
      </div>
    </div>
  `);

  if (hasNext) {
    document.getElementById("nextBlockBtn").addEventListener("click", async () => {
      if (!guardClick()) return;

      flowIndex = nextIndex;
      await loadBlock(flowIndex);
      renderQuestionScreen();
    });
  } else {
    document.getElementById("finalBtn").addEventListener("click", () => {
      if (!guardClick()) return;
      renderFinalSummaryScreen(); // твой финальный экран профиля
    });
  }

  document.getElementById("restartBtn").addEventListener("click", () => {
    if (!guardClick()) return;
    flowIndex = 0;
    renderLanguageScreen();
  });
}
function goNext() {
  if (engine.next()) renderQuestionScreen();
  else renderBlockSummary();
}

// START
renderLanguageScreen();