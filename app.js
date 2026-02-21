import { FLOW } from "./core/flow.js";
import { parseQuestionsFromTxt } from "./core/parser.js";
import { Engine } from "./core/engine.js";
import { beep, haptic } from "./core/fx.js";
import { takeRandom, shuffle } from "./core/random.js";

const app = document.getElementById("app");

let flowIndex = 0;
let engine = null;
let selected = null;
let breakdown = {};      // текущий блок: {tag:{correct,total}}
let history = {};        // все блоки: { blockId: {score,total,overall,breakdown,timeSpentSec} }

let timerId = null;
let timeLeft = 0;
let questionStartMs = 0;

// ---------- helpers ----------
function htmlEscape(s) {
  return (s ?? "").toString()
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}
function setView(markup) { app.innerHTML = markup; }

function pct(a, b) { return b ? Math.round((a / b) * 100) : 0; }

function levelByPercent(p) {
  if (p >= 85) return "🏆 Очень сильный";
  if (p >= 70) return "🔥 Сильный технарь";
  if (p >= 50) return "✅ Хорошая база";
  if (p >= 30) return "🌱 Потенциал есть";
  return "🧩 Старт";
}

function stopTimer() {
  if (timerId) clearInterval(timerId);
  timerId = null;
}

function startTimerForQuestion() {
  stopTimer();

  const sec = FLOW[flowIndex]?.timeSec ?? 0;
  if (!sec || sec <= 0) return;

  timeLeft = sec;
  questionStartMs = Date.now();

  timerId = setInterval(() => {
    timeLeft -= 1;
    const el = document.getElementById("timerValue");
    if (el) el.textContent = `${timeLeft}s`;

    if (timeLeft <= 0) {
      stopTimer();
      haptic(20);
      beep(180, 0.12);

      // время вышло → пропуск
      const res = engine.skip();
      if (FLOW[flowIndex].mode === "learn") {
        renderFeedbackScreen({ ok: false, skipped: true });
      } else {
        // быстро дальше
        goNext();
      }
    }
  }, 1000);
}

// ---------- screens ----------
function renderIntroScreen() {
  stopTimer();
  setView(`
    <div class="container">
      <div class="hero">
        <img src="./assets/ai_intro.jpg" alt="AI intro">
      </div>
      <div class="spacer"></div>
      <div class="card">
        <h1>Технологии 2026</h1>
        <p>2 вопроса с подсказками. Потом — быстрый челлендж (есть таймер).</p>
        <div class="row">
          <button class="btn primary" id="startBtn">Начать</button>
        </div>
        <p class="small">Совет: отвечай быстро. Назад не возвращаемся.</p>
      </div>
    </div>
  `);

  document.getElementById("startBtn").addEventListener("click", async () => {
    haptic(10); beep(880, 0.05);
    flowIndex = 0;
    await loadBlock(flowIndex);
    renderQuestionScreen();
  });
}

function renderTopBar() {
  const total = engine?.total ?? 0;
  const current = (engine?.index ?? 0) + 1;
  const percent = total ? Math.round(((current - 1) / total) * 100) : 0;

  const sec = FLOW[flowIndex]?.timeSec ?? 0;
  const timerBadge = (sec && sec > 0)
    ? `<span class="badge">⏳ <b id="timerValue">${timeLeft}s</b></span>`
    : `<span class="badge">⏳ <b>—</b></span>`;

  return `
    <div class="card">
      <div class="row" style="justify-content:space-between; align-items:center;">
        <span class="badge">Блок: <b>${htmlEscape(FLOW[flowIndex].id)}</b></span>
        <span class="badge">Вопрос: <b>${current}/${total}</b></span>
        <span class="badge">Очки: <b>${engine?.score ?? 0}</b></span>
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
  if (!q) return renderBlockSummaryScreen(); // ✅ после блока — не финал, а вопрос "продолжить?"

  const optionsMarkup = q.options.map((opt, idx) => `
    <div class="option" data-idx="${idx}">
      ${htmlEscape(opt)}
    </div>
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
          <button class="btn primary" id="answerBtn" disabled>Ответить</button>
        </div>
        <p class="small">${FLOW[flowIndex].mode === "learn" ? "Интро: после ответа покажем подсказку." : "Челлендж: без подсказок. Есть таймер!"}</p>
      </div>
    </div>
  `);

  startTimerForQuestion();

  const answerBtn = document.getElementById("answerBtn");
  document.querySelectorAll(".option").forEach(el => {
    el.addEventListener("click", () => {
      haptic(8);
      document.querySelectorAll(".option").forEach(x => x.classList.remove("selected"));
      el.classList.add("selected");
      selected = Number(el.dataset.idx);
      answerBtn.disabled = false;
      beep(720, 0.03);
    });
  });

  answerBtn.addEventListener("click", () => {
    if (selected === null) return;

    stopTimer();

    const res = engine.answer(selected);

    // breakdown по tag
    const curQ = engine.current();
    if (curQ?.tag && breakdown[curQ.tag]) {
      if (res.ok) breakdown[curQ.tag].correct += 1;
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
  const q = engine.current();
  const ok = res.ok;

  let title = ok ? "✅ Верно" : "⚠️ Не совсем";
  if (res.skipped) title = "⏳ Время вышло";

  const msg = ok
    ? (q.feedbackOk || "Отлично! Идём дальше.")
    : (q.feedbackBad || "Смотри внимательнее. Идём дальше.");

  setView(`
    <div class="container">
      ${renderTopBar()}
      <div class="spacer"></div>
      <div class="card">
        <h2 class="notice ${ok ? "ok" : "bad"}">${title}</h2>
        <p>${htmlEscape(msg)}</p>
        <div class="spacer"></div>
        <div class="row">
          <button class="btn primary" id="nextBtn">Дальше</button>
        </div>
      </div>
    </div>
  `);

  haptic(14);
  if (ok) beep(950, 0.06);
  else beep(220, 0.08);

  document.getElementById("nextBtn").addEventListener("click", () => {
    haptic(8); beep(880, 0.04);
    goNext();
  });
}

// ---------- after each block: summary + continue? ----------
function renderBlockSummaryScreen() {
  stopTimer();

  const blockId = FLOW[flowIndex]?.id ?? "block";
  const total = engine?.total ?? 0;
  const score = engine?.score ?? 0;
  const overall = pct(score, total);
  const level = levelByPercent(overall);

  // сохранить историю блока
  history[blockId] = {
    score, total, overall,
    breakdown: JSON.parse(JSON.stringify(breakdown)),
  };

  let title = "Готово!";
  let text = "Хочешь продолжить?";

  if (overall >= 70) {
    title = "🔥 Отлично!";
    text = "Сильный результат. Хочешь проверить следующий блок?";
  } else if (overall >= 45) {
    title = "👍 Неплохо";
    text = "Потенциал хороший. Хочешь проверить следующий блок?";
  } else {
    title = "💡 Не расстраивайся";
    text = "Это нормально — навык прокачивается. Хочешь попробовать следующий блок?";
  }

  // след. блок
  const nextIndex = flowIndex + 1;
  const hasNext = nextIndex < FLOW.length;
  const nextId = hasNext ? FLOW[nextIndex].id : null;

  const nextLabel = {
    stage1: "мышление",
    physics: "физику",
    it: "IT",
  }[nextId] || "следующий блок";

  setView(`
    <div class="container">
      <div class="card">
        <h1>${htmlEscape(title)}</h1>

        <p><b>Блок:</b> ${htmlEscape(blockId)}</p>
        <p><b>Результат:</b> ${score}/${total} • <b>${overall}%</b> • <b>${htmlEscape(level)}</b></p>

        ${blockId === "stage1" ? renderBreakdownBars() : ""}

        <div class="spacer"></div>
        <p>${htmlEscape(text)}</p>

        <div class="spacer"></div>
        <div class="row">
          ${hasNext ? `<button class="btn primary" id="yesNextBtn">Да, проверить ${htmlEscape(nextLabel)}</button>` : ""}
          <button class="btn" id="noBtn">Нет, достаточно</button>
        </div>

        <p class="small">Если нажмёшь “нет”, покажем общий профиль и рекомендации.</p>
      </div>
    </div>
  `);

  if (hasNext) {
    document.getElementById("yesNextBtn").addEventListener("click", async () => {
      haptic(10); beep(880, 0.05);
      flowIndex = nextIndex;
      await loadBlock(flowIndex);
      renderQuestionScreen();
    });
  }

  document.getElementById("noBtn").addEventListener("click", () => {
    haptic(10); beep(440, 0.05);
    renderFinalSummaryScreen();
  });
}

function renderBreakdownBars() {
  const labels = {
    logic: "Логика",
    spatial: "Пространство",
    algorithm: "Алгоритмы",
    engineering: "Инженерность",
  };

  const keys = Object.keys(breakdown);
  if (!keys.length) return "";

  return keys.map(tag => {
    const c = breakdown[tag].correct;
    const t = breakdown[tag].total;
    const p = pct(c, t);
    return `
      <div class="spacer"></div>
      <div class="badge">${labels[tag] ?? tag}: <b>${c}/${t}</b> • <b>${p}%</b></div>
      <div class="spacer"></div>
      <div class="progress"><div style="width:${p}%"></div></div>
    `;
  }).join("");
}

// ---------- final profile + CTA ----------
function renderFinalSummaryScreen() {
  stopTimer();

  const hasStage1 = !!history.stage1?.breakdown;

  const s1 = history.stage1?.breakdown || {};
  const it = history.it ? history.it.overall : null;
  const ph = history.physics ? history.physics.overall : null;

  function tagP(tag) {
    const v = s1[tag];
    if (!v || !v.total) return null;          // ← ВАЖНО: null, а не 0
    return pct(v.correct, v.total);
  }

  const pLogic = tagP("logic");
  const pAlgo  = tagP("algorithm");
  const pSpat  = tagP("spatial");
  const pEng   = tagP("engineering");

  // сильные стороны (топ-2)
  const arr = [
    { k: "Логика", p: pLogic },
    { k: "Алгоритмы", p: pAlgo },
    { k: "Пространство", p: pSpat },
    { k: "Инженерность", p: pEng },
  ].sort((a,b) => b.p - a.p);

  const top1 = arr[0];
  const top2 = arr[1];

  // профили (очень простая, но рабочая эвристика)
  const engineerScore = (pSpat + pEng) / 2;
  const coderScore = (pAlgo + pLogic) / 2;

  let profile = "Тех-потенциал";
  if (engineerScore - coderScore >= 10) profile = "🛠️ Инженер / 3D-направление";
  else if (coderScore - engineerScore >= 10) profile = "💻 Программист / аналитик";
  else profile = "⚖️ Универсальный технарь";

  // CTA рекомендации
  const rec = [];

  if (engineerScore >= 60) rec.push("🎮 Курс 3D-моделирования (пространство + инженерность)");
  if (coderScore >= 60) rec.push("🛡️ Курс по кибербезопасности (логика + системность)");
  if (ph !== null) rec.push(`⚡ Физика: ${ph}% — можно усилить под инженерию`);
  else rec.push("⚡ Проверить физику (для инженерной траектории)");

  if (it !== null) rec.push(`🧠 Информатика: ${it}% — база для IT`);
  else rec.push("🧠 Проверить информатику (для IT-траектории)");

  setView(`
    <div class="container">
      <div class="card">
        <h1>Твой профиль</h1>

        <p><b>Предрасположенность:</b> ${htmlEscape(profile)}</p>
        <div class="spacer"></div>

        <p><b>Сильные стороны:</b></p>
        <div class="badge">${htmlEscape(top1.k)}: <b>${top1.p}%</b></div>
        <div class="spacer"></div>
        <div class="badge">${htmlEscape(top2.k)}: <b>${top2.p}%</b></div>

        <div class="spacer"></div>
        <p><b>Что попробовать дальше:</b></p>
        <ul>
          ${rec.map(x => `<li>${htmlEscape(x)}</li>`).join("")}
        </ul>

        <div class="spacer"></div>
        <p><b>Хочешь продолжить тесты?</b></p>
        <div class="row">
          <button class="btn primary" id="goPhysics">Физика</button>
          <button class="btn" id="goIt">Информатика</button>
        </div>

        <div class="spacer"></div>
        <div class="row">
          <button class="btn" id="restartBtn">Пройти заново</button>
        </div>
      </div>
    </div>
  `);

  document.getElementById("goPhysics").addEventListener("click", async () => {
    haptic(10); beep(880, 0.05);
    const idx = FLOW.findIndex(b => b.id === "physics");
    if (idx >= 0) {
      flowIndex = idx;
      await loadBlock(flowIndex);
      renderQuestionScreen();
    }
  });

  document.getElementById("goIt").addEventListener("click", async () => {
    haptic(10); beep(880, 0.05);
    const idx = FLOW.findIndex(b => b.id === "it");
    if (idx >= 0) {
      flowIndex = idx;
      await loadBlock(flowIndex);
      renderQuestionScreen();
    }
  });

  document.getElementById("restartBtn").addEventListener("click", () => {
    haptic(12); beep(880, 0.05);
    history = {};
    renderIntroScreen();
  });
}

// ---------- flow ----------
function goNext() {
  const hasMore = engine.next();
  if (hasMore) return renderQuestionScreen();

  // ✅ блок закончился → экран итогов блока + выбор Да/Нет
  return renderBlockSummaryScreen();
}

// ---------- loading ----------
async function loadText(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error("Не удалось загрузить: " + url);
  return await res.text();
}

async function loadBlock(idx) {
  const block = FLOW[idx];

  // новый блок — сбрасываем breakdown
  breakdown = {};

  // 1) одиночный файл
  if (block.file) {
    const txt = await loadText(block.file);
    const parsed = parseQuestionsFromTxt(txt);
    engine = new Engine(parsed, block.mode);
    return;
  }

  // 2) parts (квоты + теги + перемешивание)
  if (block.parts) {
    let finalQuestions = [];

    for (const part of block.parts) {
      const txt = await loadText(part.file);
      const parsed = parseQuestionsFromTxt(txt);

      const tagged = parsed.map(q => ({ ...q, tag: part.tag }));
      const selected = takeRandom(tagged, part.pick);

      breakdown[part.tag] ??= { correct: 0, total: 0 };
      breakdown[part.tag].total += selected.length;

      finalQuestions = finalQuestions.concat(selected);
    }

    // ✅ перемешать, чтобы не шло “кусок алгоритмов подряд”
    finalQuestions = shuffle(finalQuestions);

    engine = new Engine(finalQuestions, block.mode);
    return;
  }

  throw new Error("Непонятная конфигурация блока в FLOW");
}

// start
renderIntroScreen();