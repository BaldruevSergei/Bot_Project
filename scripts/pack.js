// scripts/pack.js
const fs = require("fs");
const path = require("path");

const KEY = "forbrain_secret_key_2026";

// XOR + Base64: безопасно для файлов
function encIndex(numStr) {
  let bin = "";
  for (let i = 0; i < numStr.length; i++) {
    bin += String.fromCharCode(
      numStr.charCodeAt(i) ^ KEY.charCodeAt(i % KEY.length)
    );
  }
  return Buffer.from(bin, "binary").toString("base64");
}

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

    for (let i = 1; i < lines.length; i++) {
      const s = lines[i];

      // Игнорируем фидбек вообще
      if (s.startsWith("!!") || s.startsWith("!")) continue;

      const isCorrect = s.startsWith("*");
      const clean = isCorrect ? s.slice(1).trim() : s;

      // Берём только варианты (A) ... / B) ... и т.п. — но можно и без проверки
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
      k: encIndex(String(correctIndex)) // <-- ШИФРУЕМ ТОЛЬКО ИНДЕКС
    });
  }

  return packed;
}

// Рекурсивно проходит data/ и создаёт public/questions/ с теми же подпапками
function processDir(inputDir, outputDir) {
  fs.mkdirSync(outputDir, { recursive: true });

  const items = fs.readdirSync(inputDir);

  for (const item of items) {
    const full = path.join(inputDir, item);
    const stat = fs.statSync(full);

    if (stat.isDirectory()) {
      processDir(full, path.join(outputDir, item));
      continue;
    }

    if (item.endsWith(".txt")) {
      const txt = fs.readFileSync(full, "utf8");
      const prefix = path.basename(item, ".txt").replace(/[^a-zA-Z0-9]+/g, "_");
      const packed = parseTxtToPacked(txt, prefix);

      const outFile = path.join(
        outputDir,
        item.replace(".txt", ".packed.json")
      );

      fs.writeFileSync(outFile, JSON.stringify(packed), "utf8");
      console.log(`Packed ${packed.length} questions -> ${outFile}`);
    }
  }
}

processDir("data", "questions");
console.log("DONE");