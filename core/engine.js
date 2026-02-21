// core/engine.js
export class Engine {
  constructor(questions = [], mode = "quiz") {
    this.questions = questions;
    this.mode = mode; // "learn" | "quiz"
    this.index = 0;
    this.score = 0;
  }

  get total() {
    return this.questions.length;
  }

  current() {
    return this.questions[this.index] || null;
  }

  answer(selectedIndex) {
    const q = this.current();
    if (!q) return { ok: false, feedback: "" };

    const ok = Number(selectedIndex) === Number(q.correctIndex);
    if (ok) this.score += 1;

    // ВАЖНО: возвращаем feedback
    const feedback = ok ? (q.feedbackOk || "") : (q.feedbackBad || "");

    return { ok, feedback };
  }

  skip() {
    // пропуск = просто дальше, без очков
    this.index += 1;
    return true;
  }

  next() {
    this.index += 1;
    return this.index < this.total;
  }
}