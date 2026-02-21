export class Engine {
  constructor(questions, mode = "quiz") {
    this.questions = questions || [];
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

  answer(selectedIdx) {
    const q = this.current();
    if (!q) return { ok: false };

    const correctIdx = q.correctIdx || [];
    const ok = correctIdx.includes(selectedIdx);

    if (ok) this.score += 1;

    return { ok };
  }

  skip() {
    // просто не добавляем очки
    return { ok: false, skipped: true };
  }

  next() {
    this.index += 1;
    return this.index < this.questions.length;
  }
}