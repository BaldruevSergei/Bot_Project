// scripts/pack.js
// Упаковка вопросов из data/**.txt -> public/questions/**.packed.json
// Шифруем только индекс правильного ответа (k) и сохраняем подсказки (!! / !)

const fs = require("fs");
const path = require("path");

// !!! ДОЛЖЕН СОВПАДАТЬ С core/cryptobox.js !!!
const KEY = "forbrain_secret_2026";

// XOR + Base64 (совместимо с твоим cryptobox: btoa/atob + XOR)
function encXorBase64(str) {
  let out = "";
  for (let i = 0; i < str.length; i++) {
    out += String.fromCharCode(
      str.charCodeAt(i) ^ KEY.charCodeAt(i % KEY.length)
    );
  }
  return Buffer.from(out, "binary").toString("base64");
}

/**
 * Формат блока в txt:
 * Вопрос
 * *A) ...
 * B) ...
 * !! Подсказка если верно
 * ! Подсказка если неверно
 *
 * Блоки разделяются пустой строкой.
 */
function parseTxtToPacked(txt, prefix = "q") {
  const blocks = txt
    .replace(/\r/g, "")
    .split("\n\n")
    .map(b => b.trim())
    .filter(Boolean);

  const packed = [];
  let qCounter = 0;

  for (const block of blocks) {
    const lines = block
      .split("\n")
      .map(l => l.trim())
      .filter(Boolean);

    if (lines.length < 3) continue;

    const question = lines[0];

    const options = [];
    let correctIndex = -1;

    const okHints = [];
    const badHints = [];

    for (let i = 1; i < lines.length; i++) {
      const s = lines[i];

      // подсказки
      if (s.startsWith("!!")) {
        okHints.push(s.replace(/^!!\s?/, "").trim());
        continue;
      }
      if (s.startsWith("!")) {
        // важно: сюда попадут только одиночные "!" (не "!!"), т.к. выше уже отфильтровали
        badHints.push(s.replace(/^!\s?/, "").trim());
        continue;
      }

      // варианты ответа
      const isCorrect = s.startsWith("*");
      const clean = isCorrect ? s.slice(1).trim() : s.trim();

      options.push(clean);
      if (isCorrect) correctIndex = options.length - 1;
    }

    if (options.length < 2 || correctIndex < 0) continue;

    qCounter += 1;

    packed.push({
      type: "question",
      id: `${prefix}_${String(qCounter).padStart(3, "0")}`,
      q: question,
      o: options,
      k: encXorBase64(String(correctIndex)), // шифруем индекс
      ok: okHints.join("\n").trim(),         // подсказка "верно"
      bad: badHints.join("\n").trim()        // подсказка "неверно"
    });
  }

  return packed;
}

function isDir(p) {
  try { return fs.statSync(p).isDirectory(); } catch { return false; }
}

function ensureDir(p) {
  fs.mkdirSync(p, { recursive: true });
}

// Рекурсивно проходит inputDir и создаёт outputDir с теми же подпапками
function processDir(inputDir, outputDir) {
  if (!isDir(inputDir)) {
    console.error(`❌ Input dir not found: ${inputDir}`);
    process.exit(1);
  }

  ensureDir(outputDir);

  const items = fs.readdirSync(inputDir, { withFileTypes: true });

  for (const it of items) {
    const fullIn = path.join(inputDir, it.name);
    const fullOut = path.join(outputDir, it.name);

    if (it.isDirectory()) {
      processDir(fullIn, fullOut);
      continue;
    }

    if (it.isFile() && it.name.toLowerCase().endsWith(".txt")) {
      const txt = fs.readFileSync(fullIn, "utf8");
      const prefix = path.basename(it.name, ".txt").replace(/[^a-zA-Z0-9]+/g, "_");
      const packed = parseTxtToPacked(txt, prefix);

      const outFile = path.join(
        outputDir,
        it.name.replace(/\.txt$/i, ".packed.json")
      );

      fs.writeFileSync(outFile, JSON.stringify(packed, null, 0), "utf8");
      console.log(`✅ Packed ${packed.length} -> ${outFile}`);
    }
  }
}

// ---- RUN ----
processDir("data", path.join("public", "questions"));
console.log("DONE ✅");