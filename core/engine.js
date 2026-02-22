import { decrypt } from "./cryptobox.js";

export class Engine {
  constructor(questions = [], mode = "quiz") {
    this.questions = questions;
    this.mode = mode;
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

  // 🔐 Дешифровываем индекс
  const realIndex = Number(decrypt(q.k));

  const ok = Number(selectedIndex) === realIndex;
  if (ok) this.score += 1;

  return { ok, feedback: "" };
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