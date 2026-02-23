console.log("PACK SCRIPT REAL VERSION 3");
const fs = require("fs");
const path = require("path");

const ROOT = process.cwd();
const DATA_DIR = path.join(ROOT, "data");
const OUT_DIR = path.join(ROOT, "public", "questions");

const KEY = "forbrain_secret_key_2026";

// ================= CRYPTO =================
function encryptNode(str) {
  let out = "";
  for (let i = 0; i < str.length; i++) {
    out += String.fromCharCode(
      str.charCodeAt(i) ^ KEY.charCodeAt(i % KEY.length)
    );
  }
  return Buffer.from(out, "binary").toString("base64");
}

// ================= HELPERS =================
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

// ================= PARSER =================
function parseTxt(raw) {
  // удаляем BOM если есть
  raw = raw.replace(/^\uFEFF/, "");

  const text = raw.replace(/\r\n/g, "\n").trim();
  if (!text) return [];

  const blocks = text
    .split(/\n\s*\n+/g)
    .map(s => s.trim())
    .filter(Boolean);

  const out = [];

  for (const block of blocks) {
    const lines = block
      .split("\n")
      .map(s => s.trim())
      .filter(Boolean);

    if (lines.length < 2) continue;

    const q = lines[0];

    const options = [];
    let correctIndex = -1;

    let feedbackOk = "";
    let feedbackBad = "";

    for (let i = 1; i < lines.length; i++) {
      let line = lines[i].trim();

      // ========= FEEDBACK =========
      if (/^!!/.test(line)) {
        feedbackOk += line.replace(/^!!\s*/, "") + " ";
        continue;
      }

      if (/^!(?!!)/.test(line)) {
        feedbackBad += line.replace(/^!\s*/, "") + " ";
        continue;
      }

      // ========= OPTIONS =========
      let isCorrect = false;

      if (line.startsWith("*")) {
        isCorrect = true;
        line = line.slice(1).trim();
      }

      // убираем A) B) C) и русские аналоги
      line = line.replace(/^[A-DА-Г]\)\s*/i, "");

      options.push(line);

      if (isCorrect) {
        correctIndex = options.length - 1;
      }
    }

    if (!options.length) continue;
    if (correctIndex < 0) correctIndex = 0;

    const encrypted = encryptNode(String(correctIndex));

    out.push({
      q,
      o: options,
      k: encrypted,
      ok: feedbackOk.trim(),
      bad: feedbackBad.trim(),
    });
  }

  return out;
}

// ================= WALK =================
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

// ================= PACK =================
function packAll() {
  const all = walkDir(DATA_DIR).filter(f =>
    f.toLowerCase().endsWith(".txt")
  );

  for (const filePath of all) {
    const rel = path.relative(DATA_DIR, filePath).replace(/\\/g, "/");
    const parts = rel.split("/");
    const lang = parts[0];

    if (!isLangFolderName(lang)) continue;

    const relNoExt = rel.replace(/\.txt$/i, "");
    const relInsideLang = relNoExt.split("/").slice(1).join("/");

    const outBase = path.join(OUT_DIR, lang, relInsideLang);

    const raw = readText(filePath);
    const parsed = parseTxt(raw);

    writeJson(outBase + ".packed.json", parsed);
    writeJson(outBase + ".packed", parsed);

    console.log("[ok]", rel);
  }

  console.log("DONE");
}

packAll();