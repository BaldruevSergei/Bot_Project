export const LANGS = [
  { code: "ru", label: "Русский" },
  { code: "uz", label: "O‘zbek" },
  { code: "en", label: "English" },
];

export const I18N = {
  ru: {
    chooseLangTitle: "Выбор языка",
    chooseLangText: "Выберите язык интерфейса и тестов.",
    openInTelegramTitle: "Открой в Telegram",
    openInTelegramText: "Этот тест работает как Telegram WebApp.",
    openInTelegramHint: "Открой через бота и нажми кнопку запуска.",

    introTitle: "Технологии 2026",
    introText: "2 вопроса с подсказками, потом быстрый челлендж с таймером.",
    startBtn: "Начать",
    tipFast: "Совет: отвечай быстро. Назад не возвращаемся.",

    block: "Блок",
    question: "Вопрос",
    score: "Очки",

    answerBtn: "Ответить",
    nextBtn: "Дальше",
    learnHint: "Интро: после ответа покажем подсказку.",
    quizHint: "Челлендж: без подсказок. Есть таймер!",

    doneTitle: "Готово!",
    result: "Результат",
    continueQ: "Продолжить?",
    yes: "Да",
    no: "Нет",

    consentTitle: "Согласие",
    consentText: "Мы можем сохранить твой результат и выбор курса, чтобы дать рекомендации.",
    consentChk: "Я согласен(на), что мои ответы могут быть сохранены и проанализированы.",
    consentYes: "Да, показать результат",
    consentNo: "Нет, не сохранять",

    feedbackOk: "Отлично! Идём дальше.",
    feedbackBad: "Смотри внимательнее. Идём дальше.",

    profileTitle: "Твой профиль",
    profileLabel: "Предрасположенность",
    strengthsTitle: "Сильные стороны",
    strengthsNeed: "Сильные стороны появятся после Stage1.",
    profileEngineer: "🛠️ Инженер / 3D-направление",
    profileCoder: "💻 IT / программирование",
    profileUniversal: "⚖️ Универсальный технарь",
    profileNeedStage1: "ℹ️ Пройди Stage1 для профиля",

    coursePickTitle: "Что прокачать дальше?",
    coursePickHint: "Выбери интерес. Сохранение — только если ты дал согласие.",
    course3d: "🎮 3D-моделирование",
    courseCyber: "🛡️ Кибербезопасность",
    coursePhysics: "⚡ Физика",
    courseIT: "🧠 Информатика",
    courseProg: "💻 Программирование",
    courseOther: "✍️ Свой вариант",
    courseOtherPlaceholder: "Если свой вариант — напиши сюда",

    saveBtn: "Сохранить выбор",
    restartBtn: "Пройти заново",
    consentShort: "Согласие",
    savedOnce: "Этот аккаунт уже сохранил выбор (1 раз).",
    needConsent: "Нужно согласие (галочка).",
    savedOk: "Готово! (Сохранено локально для демо.)",
    savedDemoHint: "Сейчас это сохраняется в localStorage (демо).",

    tags: {
      logic: "Логика",
      spatial: "Пространство",
      algorithm: "Алгоритмы",
      engineering: "Инженерность",
      physics: "Физика",
      it: "Информатика",
    },
  },

  en: {
    chooseLangTitle: "Choose language",
    chooseLangText: "Select interface + tests language.",
    openInTelegramTitle: "Open in Telegram",
    openInTelegramText: "This works as a Telegram WebApp.",
    openInTelegramHint: "Open via the bot and press Start.",

    introTitle: "Tech 2026",
    introText: "2 learning questions, then a fast timed challenge.",
    startBtn: "Start",
    tipFast: "Tip: answer fast. No going back.",

    block: "Block",
    question: "Question",
    score: "Score",

    answerBtn: "Answer",
    nextBtn: "Next",
    learnHint: "Learn mode: show hint after answer.",
    quizHint: "Quiz mode: no hints. Timer is on.",

    doneTitle: "Done!",
    result: "Result",
    continueQ: "Continue?",
    yes: "Yes",
    no: "No",

    consentTitle: "Consent",
    consentText: "We can save your result and chosen course to give recommendations.",
    consentChk: "I agree that my answers may be saved and analyzed.",
    consentYes: "Yes, show result",
    consentNo: "No, don't save",

    feedbackOk: "Nice! Go on.",
    feedbackBad: "Almost. Go on.",

    profileTitle: "Your profile",
    profileLabel: "Profile",
    strengthsTitle: "Strengths",
    strengthsNeed: "Strengths will appear after Stage1.",
    profileEngineer: "🛠️ Engineering / 3D",
    profileCoder: "💻 IT / Coding",
    profileUniversal: "⚖️ Universal",
    profileNeedStage1: "ℹ️ Finish Stage1 for profile",

    coursePickTitle: "What to improve?",
    coursePickHint: "Pick your interest. Saved only if you gave consent.",
    course3d: "🎮 3D",
    courseCyber: "🛡️ Cybersecurity",
    coursePhysics: "⚡ Physics",
    courseIT: "🧠 IT",
    courseProg: "💻 Programming",
    courseOther: "✍️ Other",
    courseOtherPlaceholder: "If Other — type here",

    saveBtn: "Save choice",
    restartBtn: "Restart",
    consentShort: "Consent",
    savedOnce: "Already saved once (per account).",
    needConsent: "Consent required.",
    savedOk: "Saved (local demo).",
    savedDemoHint: "Currently saved to localStorage (demo).",

    tags: {
      logic: "Logic",
      spatial: "Spatial",
      algorithm: "Algorithm",
      engineering: "Engineering",
      physics: "Physics",
      it: "IT",
    },
  },

  uz: {
    // пока можно оставить русские строки как временный fallback
    // (или позже переведёшь)
    ...null
  },
};

// простой fallback: если uz пустой — используем ru
I18N.uz = I18N.uz && Object.keys(I18N.uz).length ? I18N.uz : I18N.ru;