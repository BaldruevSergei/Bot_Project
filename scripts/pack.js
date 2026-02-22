// scripts/pack.js
// Usage: npm run pack
// Input:  data/<lang>/**/<name>.txt
// Output: public/questions/<lang>/**/<name>.packed.json  (+ .packed mirror)

const fs = require("fs");
const path = require("path");

const ROOT = process.cwd();
const DATA_DIR = path.join(ROOT, "data");
const OUT_DIR = path.join(ROOT, "public", "questions");

// -------- helpers --------
function ensureDir(p) {
  fs.mkdirSync(p, { recursive: true });
}

function readText(p) {
  return fs.readFileSync(p, "utf8");
}

function writeJson(p, obj) {
  ensureDir(path.dirname(p));
  fs.writeFileSync(p, JSON.stringify(obj, null, 2), "utf8");
}

// -------- parser (TXT -> questions) --------
// формат:
// Вопрос?
// A) ...
// *B) ...   // * = правильный (single)
// (пустая строка) разделяет вопросы
function parseTxt(raw) {
  const text = raw.replace(/\r\n/g, "\n").trim();
  if (!text) return [];

  const blocks = text.split(/\n\s*\n+/g).map(s => s.trim()).filter(Boolean);

  const out = [];

  for (const block of blocks) {
    const lines = block.split("\n").map(s => s.trim()).filter(Boolean);
    if (lines.length < 3) continue;

    const q = lines[0];

    const options = [];
    let correctIndex = -1;

    for (let i = 1; i < lines.length; i++) {
      let line = lines[i];
      let isCorrect = false;

      if (line.startsWith("*")) {
        isCorrect = true;
        line = line.slice(1).trim();
      }

      // уберём "A) " "B) "
      line = line.replace(/^[A-DА-Г]\)\s*/i, "");

      options.push(line);
      if (isCorrect) correctIndex = options.length - 1;
    }

    if (correctIndex < 0) correctIndex = 0; // fallback

    out.push({
      q,
      o: options,
      k: String(correctIndex), // можно шифровать позже
      ok: "",                  // подсказки можно добавлять позже
      bad: ""
    });
  }

  return out;
}

// -------- walk --------
function walkDir(dir, files = []) {
  for (const name of fs.readdirSync(dir)) {
    const full = path.join(dir, name);
    const st = fs.statSync(full);
    if (st.isDirectory()) walkDir(full, files);
    else files.push(full);
  }
  return files;
}

function isLangFolderName(x) {
  return x === "ru" || x === "uz" || x === "en";
}

function packAll() {
  if (!fs.existsSync(DATA_DIR)) {
    throw new Error(`No data dir: ${DATA_DIR}`);
  }

  const all = walkDir(DATA_DIR).filter(f => f.toLowerCase().endsWith(".txt"));
  let count = 0;

  for (const filePath of all) {
    // data/<lang>/.../<name>.txt
    const rel = path.relative(DATA_DIR, filePath).replace(/\\/g, "/");
    const parts = rel.split("/");

    const lang = parts[0];
    if (!isLangFolderName(lang)) {
      console.log(`[skip] unknown lang folder: ${rel}`);
      continue;
    }

    const relNoExt = rel.replace(/\.txt$/i, "");
    // remove "<lang>/"
    const relInsideLang = relNoExt.split("/").slice(1).join("/");

    const outBase = path.join(OUT_DIR, lang, relInsideLang).replace(/\\/g, "/");

    const raw = readText(filePath);
    const parsed = parseTxt(raw);

    // write .packed.json
    const outJson = outBase + ".packed.json";
    writeJson(outJson, parsed);

    // mirror .packed (чтобы старые пути тоже работали)
    const outPacked = outBase + ".packed";
    writeJson(outPacked, parsed);

    count++;
    console.log(`[ok] ${rel} -> ${path.relative(ROOT, outJson)}`);
  }

  console.log(`DONE. Packed files: ${count}`);
}

packAll();