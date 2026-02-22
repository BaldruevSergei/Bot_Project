import { decrypt } from "./cryptobox.js";

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

    const correctIndex = Number(decrypt(q.k));
    const ok = Number(selectedIndex) === correctIndex;

    if (ok) this.score += 1;

    // feedback можно держать пустым, а в app.js подставлять t.feedbackOk/Bad
    return { ok, feedback: q.feedback || "" };
  }

  skip() {
    this.index += 1;
    return true;
  }

  next() {
    this.index += 1;
    return this.index < this.total;
  }
}