// core/parser.js
export function parseQuestionsFromTxt(txt) {
  const lines = (txt || "").split(/\r?\n/);

  const questions = [];

  let qText = "";
  let options = [];
  let correctIndex = -1;
  let feedbackOk = "";
  let feedbackBad = "";

  const flush = () => {
    if (!qText) return;
    if (options.length < 2) return;
    if (correctIndex < 0) correctIndex = 0;

    questions.push({
      question: qText.trim(),
      options: options.map(x => x.trim()),
      correctIndex,
      feedbackOk: feedbackOk.trim(),
      feedbackBad: feedbackBad.trim(),
    });

    qText = "";
    options = [];
    correctIndex = -1;
    feedbackOk = "";
    feedbackBad = "";
  };

  const isOptionLine = (s) => {
    const x = s.trim();
    if (!x) return false;
    const noStar = x.startsWith("*") ? x.slice(1).trim() : x;
    return /^[A-DА-Г]\)\s*/i.test(noStar);
  };

  for (const raw of lines) {
    const s = (raw ?? "").trim();

    // пустые строки просто игнорим
    if (!s) continue;

    // feedback lines
    if (s.startsWith("!!")) {
      feedbackOk = s.slice(2).trim();
      continue;
    }
    if (s.startsWith("!")) {
      feedbackBad = s.slice(1).trim();
      continue;
    }

    // options
    if (s.startsWith("*") || isOptionLine(s)) {
      let line = s;
      let isCorrect = false;

      if (line.startsWith("*")) {
        isCorrect = true;
        line = line.slice(1).trim();
      }

      line = line.replace(/^[A-DА-Г]\)\s*/i, "");
      if (isCorrect) correctIndex = options.length;
      options.push(line);
      continue;
    }

    // если уже есть вопрос + варианты, и встретили новый текст — это новый вопрос
    if (qText && options.length >= 2) flush();

    qText = s;
  }

  flush();
  return questions;
}