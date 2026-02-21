// Parses your TXT format into question objects.
// Rules:
// - Questions separated by empty line(s)
// - Options are lines starting with A) / B) / C) / D)
// - Correct option starts with * (e.g. *C) ...)
// - Intro can include:
//   !! text for correct feedback
//   !  text for incorrect feedback
export function parseQuestionsFromTxt(txt) {
  const lines = (txt || "").split(/\r?\n/);

  const questions = [];
  let curQ = null;
  let curOpts = [];
  let correct = [];
  let feedbackOk = "";
  let feedbackBad = "";

  function pushCurrent() {
    if (!curQ) return;
    if (curOpts.length < 2) return;

    questions.push({
      question: curQ.trim(),
      options: curOpts.map(s => s.trim()),
      correctIdx: [...correct],
      feedbackOk: feedbackOk.trim(),
      feedbackBad: feedbackBad.trim(),
    });

    curQ = null;
    curOpts = [];
    correct = [];
    feedbackOk = "";
    feedbackBad = "";
  }

  for (let raw of lines) {
    const line = (raw ?? "").trim();

    // пустая строка = разделитель
    if (line === "") {
      pushCurrent();
      continue;
    }

    // feedback
    if (line.startsWith("!!")) {
      feedbackOk += (feedbackOk ? "\n" : "") + line.slice(2).trim();
      continue;
    }
    if (line.startsWith("!")) {
      feedbackBad += (feedbackBad ? "\n" : "") + line.slice(1).trim();
      continue;
    }

    // вариант ответа
    // допускаем "*A) ..." или "#B) ..." или "A) ..."
    const m = line.match(/^(\*|#)?\s*([A-DА-Г])\)\s*(.+)$/i);
    if (m) {
      const mark = m[1]; // "*" or "#"
      const text = `${m[2].toUpperCase()}) ${m[3]}`;
      const idx = curOpts.length;
      curOpts.push(text);

      if (mark === "*" || mark === "#") correct.push(idx);
      continue;
    }

    // если это новая строка вопроса
    if (!curQ) {
      curQ = line;
    } else {
      // если вопрос многострочный
      curQ += " " + line;
    }
  }

  pushCurrent();
  return questions;
}