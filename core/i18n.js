export const LANGS = [
  { code: "ru", label: "Русский" },
  { code: "uz", label: "O‘zbek" },
  { code: "en", label: "English" },
];

export const I18N = {
  ru: {
    // -------- Language --------
    chooseLangTitle: "Выбор языка",
    chooseLangText: "Сначала выберите язык — дальше будет описание теста.",

    openInTelegramTitle: "Открой в Telegram",
    openInTelegramText: "Этот тест работает как Telegram WebApp.",
    openInTelegramHint: "Открой через бота и нажми кнопку запуска.",

    // -------- Intro --------
    introTitle: "Технологии 2026",
    introText:
      "Короткий тест (3–5 минут) для учеников и родителей. Покажет сильные стороны: логика, алгоритмы, пространственное мышление, основы физики и IT. В конце вы получите профиль и рекомендации по направлению (3D / кибербезопасность / программирование / физика / IT).",
    startBtn: "Начать",
    tipFast: "⏱ Отвечайте быстро. Назад не возвращаемся.",

    // -------- Top bar --------
    block: "Блок",
    question: "Вопрос",
    score: "Очки",

    // -------- Buttons --------
    answerBtn: "Ответить",
    nextBtn: "Дальше",
    learnHint: "Интро: после ответа покажем подсказку.",
    quizHint: "Челлендж: без подсказок. Есть таймер!",

    // -------- Block summary --------
    doneTitle: "Готово!",
    result: "Результат",
    continueQ: "Продолжить?",
    yes: "Да",
    no: "Нет",

    // -------- Consent --------
    consentTitle: "Согласие",
    consentText:
      "Мы можем сохранить твой результат и выбор курса, чтобы дать рекомендации.",
    consentChk:
      "Я согласен(на), что мои ответы могут быть сохранены и проанализированы.",
    consentYes: "Да, показать результат",
    consentNo: "Нет, не сохранять",

    // -------- Feedback --------
    feedbackOk: "Отлично! Идём дальше.",
    feedbackBad: "Смотри внимательнее. Идём дальше.",

    // -------- Profile --------
    profileTitle: "Твой профиль",
    profileLabel: "Предрасположенность",
    strengthsTitle: "Сильные стороны",
    strengthsNeed: "Сильные стороны появятся после Stage1.",
    profileEngineer: "🛠️ Инженер / 3D-направление",
    profileCoder: "💻 IT / программирование",
    profileUniversal: "⚖️ Универсальный технарь",
    profileNeedStage1: "ℹ️ Пройди Stage1 для профиля",

    // -------- Course pick --------
    coursePickTitle: "Что прокачать дальше?",
    coursePickHint:
      "Выбери интерес. Сохранение — только если ты дал согласие.",
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
    savedDemoHint:
      "Сейчас это сохраняется в localStorage (демо).",

    // -------- Tags --------
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
    chooseLangText:
      "Choose language first — test information will be shown next.",

    openInTelegramTitle: "Open in Telegram",
    openInTelegramText:
      "This test works as a Telegram WebApp.",
    openInTelegramHint:
      "Open via the bot and press Start.",

    introTitle: "Technology 2026",
    introText:
      "A short test (3–5 minutes) for students and parents. It shows strengths: logic, algorithms, spatial thinking, basic physics and IT. At the end you get a profile and recommendations (3D / Cybersecurity / Programming / Physics / IT).",
    startBtn: "Start",
    tipFast: "⏱ Answer fast. No going back.",

    block: "Block",
    question: "Question",
    score: "Score",

    answerBtn: "Answer",
    nextBtn: "Next",
    learnHint:
      "Intro: you will see a hint after answering.",
    quizHint:
      "Challenge: no hints. Timer is on.",

    doneTitle: "Done!",
    result: "Result",
    continueQ: "Continue?",
    yes: "Yes",
    no: "No",

    consentTitle: "Consent",
    consentText:
      "We can save your result and chosen course to give recommendations.",
    consentChk:
      "I agree that my answers may be saved and analyzed.",
    consentYes: "Yes, show result",
    consentNo: "No, don't save",

    feedbackOk: "Nice! Go on.",
    feedbackBad: "Almost. Go on.",

    profileTitle: "Your profile",
    profileLabel: "Profile",
    strengthsTitle: "Strengths",
    strengthsNeed:
      "Strengths will appear after Stage1.",
    profileEngineer:
      "🛠️ Engineering / 3D",
    profileCoder:
      "💻 IT / Programming",
    profileUniversal:
      "⚖️ Universal",
    profileNeedStage1:
      "ℹ️ Finish Stage1 for profile",

    coursePickTitle:
      "What to improve next?",
    coursePickHint:
      "Pick your interest. Saved only if you gave consent.",
    course3d: "🎮 3D Modeling",
    courseCyber: "🛡️ Cybersecurity",
    coursePhysics: "⚡ Physics",
    courseIT: "🧠 IT",
    courseProg: "💻 Programming",
    courseOther: "✍️ Other",
    courseOtherPlaceholder:
      "If Other — type here",

    saveBtn: "Save choice",
    restartBtn: "Restart",
    consentShort: "Consent",
    savedOnce:
      "Already saved once (per account).",
    needConsent: "Consent required.",
    savedOk: "Saved (local demo).",
    savedDemoHint:
      "Currently saved to localStorage (demo).",

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
    chooseLangTitle: "Tilni tanlang",
    chooseLangText:
      "Avval tilni tanlang — keyin test haqida ma’lumot chiqadi.",

    openInTelegramTitle:
      "Telegram orqali oching",
    openInTelegramText:
      "Bu test Telegram WebApp sifatida ishlaydi.",
    openInTelegramHint:
      "Bot orqali oching va Start tugmasini bosing.",

    introTitle: "Texnologiyalar 2026",
    introText:
      "Qisqa test (3–5 daqiqa) o‘quvchilar va ota-onalar uchun. Kuchli tomonlarni aniqlaydi: mantiq, algoritmlar, fazoviy fikrlash, fizika va IT asoslari. Yakunda profil va tavsiyalar olasiz (3D / Kiber / Dasturlash / Fizika / IT).",
    startBtn: "Boshlash",
    tipFast:
      "⏱ Tez javob bering. Orqaga qaytilmaydi.",

    block: "Blok",
    question: "Savol",
    score: "Ball",

    answerBtn: "Javob berish",
    nextBtn: "Keyingi",
    learnHint:
      "Kirish: javobdan keyin izoh chiqadi.",
    quizHint:
      "Challenge: izohsiz. Timer bor.",

    doneTitle: "Tugadi!",
    result: "Natija",
    continueQ: "Davom etamizmi?",
    yes: "Ha",
    no: "Yo‘q",

    consentTitle: "Rozilik",
    consentText:
      "Natijani va kurs tanlovini saqlab, tavsiya berishimiz mumkin.",
    consentChk:
      "Javoblarim saqlanishi va tahlil qilinishiga roziman.",
    consentYes:
      "Ha, natijani ko‘rsat",
    consentNo:
      "Yo‘q, saqlama",

    feedbackOk: "A’lo! Davom etamiz.",
    feedbackBad:
      "Yana bir qarab ko‘ring. Davom etamiz.",

    profileTitle: "Profilingiz",
    profileLabel: "Yo‘nalish",
    strengthsTitle: "Kuchli tomonlar",
    strengthsNeed:
      "Kuchli tomonlar Stage1 dan keyin chiqadi.",
    profileEngineer:
      "🛠️ Muhandis / 3D yo‘nalish",
    profileCoder:
      "💻 IT / Dasturlash",
    profileUniversal:
      "⚖️ Universal",
    profileNeedStage1:
      "ℹ️ Profil uchun Stage1 ni tugating",

    coursePickTitle:
      "Nimani rivojlantiramiz?",
    coursePickHint:
      "Qiziqishni tanlang. Saqlash faqat rozilik bo‘lsa.",
    course3d:
      "🎮 3D-modellashtirish",
    courseCyber:
      "🛡️ Kiberxavfsizlik",
    coursePhysics: "⚡ Fizika",
    courseIT: "🧠 Informatika",
    courseProg:
      "💻 Dasturlash",
    courseOther: "✍️ Boshqa",
    courseOtherPlaceholder:
      "Agar boshqa bo‘lsa — yozing",

    saveBtn: "Saqlash",
    restartBtn: "Qayta boshlash",
    consentShort: "Rozilik",
    savedOnce:
      "Bu akkaunt 1 marta saqlagan.",
    needConsent:
      "Rozilik kerak (belgi).",
    savedOk:
      "Tayyor! (Demo: lokal saqlandi.)",
    savedDemoHint:
      "Hozir localStorage ga saqlanadi (demo).",

    tags: {
      logic: "Mantiq",
      spatial: "Fazoviy",
      algorithm: "Algoritmlar",
      engineering: "Muhandislik",
      physics: "Fizika",
      it: "IT",
    },
  },
};