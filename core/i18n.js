// core/i18n.js

export const LANGS = [
  { code: "uz", label: "O‘zbekcha" },
  { code: "ru", label: "Русский" },
  { code: "en", label: "English" },
];

export const I18N = {
  uz: {
    // brand / gate
    brandTitle: "ForBrain Akademiya",
    gatePlayAria: "Boshlash",
    gateSub: "Boshlash uchun bosing",

    // marketing
    marketingTitle: "Farzandingiz qaysi yo‘nalishga moyil?",
    marketingSubtitle: "3–5 daqiqalik bepul test kuchli tomonlarni ko‘rsatadi.",
    marketingTagLogic: "Mantiq",
    marketingTagIT: "IT va dasturlash",
    marketingTag3D: "3D grafika va muhandislik fikrlash",
    marketingTagPhysics: "Fizika",
    marketingTagAI: "Sun’iy intellekt",
    marketingContinue: "Davom etish",

    // language
    chooseLangTitle: "Tilni tanlang",
    chooseLangText: "Test va natijalar tanlangan tilda bo‘ladi.",

    // intro
    introTitle: "ForBrain",
    introText: "Qisqa test: savollarga tez javob bering.",
    tipFast: "Maslahat: ko‘p o‘ylamang, birinchi fikr ko‘pincha to‘g‘ri.",
    startBtn: "Boshlash",

    // test UI
    block: "Blok",
    question: "Savol",
    score: "Ball",
    answerBtn: "Javob berish",
    nextBtn: "Keyingi",
    learnHint: "O‘rganish rejimi: javobdan keyin izoh chiqadi.",
    quizHint: "Test rejimi: tez javob bering.",
    feedbackOk: "To‘g‘ri.",
    feedbackBad: "Noto‘g‘ri.",

    // block summary
    doneTitle: "Tayyor!",
    result: "Natija",
    continueQ: "Davom ettirasizmi?",
    yes: "Keyingi",
    restartBtn: "Qayta boshlash",
    finalAsk: "Yakuniy profil va tavsiyalarni ko‘rsatamizmi?",
    showResult: "Natijani ko‘rsatish",

    // consent
    consentTitle: "Rozilik",
    consentText: "Natijani saqlash va konsultatsiya uchun rozilik kerak.",
    consentChk: "Roziman.",
    consentYes: "Ha",
    consentNo: "Yo‘q",

    // final
    finalTitle: "Sizning profilingiz",
    finalProfileUniversal: "Universal texnik profil",
    finalProfileIT: "IT va dasturlashga moyillik kuchli",
    finalProfileEngineering: "Muhandislik/3D fikrlash kuchli",

    intensiveTitle: "3 oylik intensiv (bahor)",
    intensiveLine1: "Logika, IT, 3D-grafika, fizika va sun’iy intellektni kuchaytiramiz.",
    intensiveLine2: "Boshlang‘ichdan o‘rtacha darajagacha — hamma uchun mos.",
    intensiveLine3: "Darslar tizimli, amaliy va motivatsion formatda.",
    intensiveStart: "Boshlanishi: mart oyidan",

    chooseDirection: "Qaysi yo‘nalishni kuchaytirmoqchisiz?",
    dirLogic: "Mantiq",
    dirIT: "IT",
    dir3D: "3D-grafika",
    dirPhysics: "Fizika",
    dirAI: "Sun’iy intellekt",
    dirCustom: "Boshqa",
    dirCustomPlaceholder: "Agar “Boshqa” bo‘lsa, yozing...",

    sendResult: "Tanlovni saqlash",
    getConsult: "Konsultatsiya olish",
    twoClicksHint: "2 ta aniq bosish: avval saqlang, keyin konsultatsiyaga o‘ting.",

    savedOk: "Saqlandi!",
    needCustomDir: "Iltimos, “Boshqa” uchun matn kiriting.",
    sendFail: "Internet xatosi. Qayta urinib ko‘ring.",

    // labels for message
    dirLabel_logic: "Mantiq",
    dirLabel_it: "IT",
    dirLabel_3d: "3D-grafika",
    dirLabel_physics: "Fizika",
    dirLabel_ai: "Sun’iy intellekt",

    consultMessage:
      "Salom! Men testdan o‘tdim. Profil: {profile}. Yo‘nalish: {direction}. Konsultatsiya olmoqchiman.",
  },

  ru: {
    // brand / gate
    brandTitle: "ForBrain Академия",
    gatePlayAria: "Старт",
    gateSub: "Нажмите, чтобы начать",

    // marketing
    marketingTitle: "Ваш ребёнок к какому направлению склонен?",
    marketingSubtitle: "Бесплатный тест за 3–5 минут покажет сильные стороны.",
    marketingTagLogic: "Логика",
    marketingTagIT: "IT и программирование",
    marketingTag3D: "3D-графика и инженерное мышление",
    marketingTagPhysics: "Физика",
    marketingTagAI: "Искусственный интеллект",
    marketingContinue: "Продолжить",

    // language
    chooseLangTitle: "Выберите язык",
    chooseLangText: "Тест и результаты будут на выбранном языке.",

    // intro
    introTitle: "ForBrain",
    introText: "Короткий тест: отвечайте быстро и честно.",
    tipFast: "Совет: не думайте слишком долго — первая мысль часто верная.",
    startBtn: "Начать",

    // test UI
    block: "Блок",
    question: "Вопрос",
    score: "Очки",
    answerBtn: "Ответить",
    nextBtn: "Дальше",
    learnHint: "Режим обучения: после ответа будет объяснение.",
    quizHint: "Тестовый режим: отвечайте быстро.",
    feedbackOk: "Верно.",
    feedbackBad: "Неверно.",

    // block summary
    doneTitle: "Готово!",
    result: "Результат",
    continueQ: "Продолжить?",
    yes: "Далее",
    restartBtn: "Пройти заново",
    finalAsk: "Показать итоговый профиль и рекомендации?",
    showResult: "Показать результат",

    // consent
    consentTitle: "Согласие",
    consentText: "Чтобы сохранить результат и перейти к консультации, нужно согласие.",
    consentChk: "Я согласен(на).",
    consentYes: "Да",
    consentNo: "Нет",

    // final
    finalTitle: "Твой профиль",
    finalProfileUniversal: "Универсальный технический профиль",
    finalProfileIT: "Сильная склонность к IT и программированию",
    finalProfileEngineering: "Сильная склонность к инженерии и 3D-мышлению",

    intensiveTitle: "Весенний 3-месячный интенсив",
    intensiveLine1: "Прокачка логики, IT, 3D-графики, физики и искусственного интеллекта.",
    intensiveLine2: "Подходит для любого уровня подготовки.",
    intensiveLine3: "Системно, практично и без перегруза — один шаг за другим.",
    intensiveStart: "Старт: в марте",

    chooseDirection: "Что вы хотите прокачать в первую очередь?",
    dirLogic: "Логика",
    dirIT: "IT",
    dir3D: "3D-графика",
    dirPhysics: "Физика",
    dirAI: "Искусственный интеллект",
    dirCustom: "Другое",
    dirCustomPlaceholder: "Если выбрали «Другое», напишите…",

    sendResult: "Сохранить выбор",
    getConsult: "Получить консультацию",
    twoClicksHint: "Два аккуратных клика: 1) сохранить выбор 2) получить консультацию.",

    savedOk: "Сохранено!",
    needCustomDir: "Пожалуйста, заполните поле «Другое».",
    sendFail: "Ошибка сети. Попробуйте ещё раз.",

    // labels for message
    dirLabel_logic: "Логика",
    dirLabel_it: "IT",
    dirLabel_3d: "3D-графика",
    dirLabel_physics: "Физика",
    dirLabel_ai: "Искусственный интеллект",

    consultMessage:
      "Здравствуйте! Я прошёл(ла) тест. Профиль: {profile}. Выбор: {direction}. Хочу получить консультацию.",
  },

  en: {
    // brand / gate
    brandTitle: "ForBrain Academy",
    gatePlayAria: "Start",
    gateSub: "Tap / Click to start",

    // marketing
    marketingTitle: "Which direction is your child inclined to?",
    marketingSubtitle: "A free 3–5 minute test will show strong sides.",
    marketingTagLogic: "Logic",
    marketingTagIT: "IT & programming",
    marketingTag3D: "3D graphics & engineering thinking",
    marketingTagPhysics: "Physics",
    marketingTagAI: "Artificial Intelligence",
    marketingContinue: "Continue",

    // language
    chooseLangTitle: "Choose language",
    chooseLangText: "The test and results will be in the selected language.",

    // intro
    introTitle: "ForBrain",
    introText: "Short test: answer quickly and honestly.",
    tipFast: "Tip: don’t overthink — your first idea is often right.",
    startBtn: "Start",

    // test UI
    block: "Block",
    question: "Question",
    score: "Score",
    answerBtn: "Answer",
    nextBtn: "Next",
    learnHint: "Learning mode: you will see an explanation after answering.",
    quizHint: "Quiz mode: answer fast.",
    feedbackOk: "Correct.",
    feedbackBad: "Incorrect.",

    // block summary
    doneTitle: "Done!",
    result: "Result",
    continueQ: "Continue?",
    yes: "Next",
    restartBtn: "Restart",
    finalAsk: "Show final profile and recommendations?",
    showResult: "Show result",

    // consent
    consentTitle: "Consent",
    consentText: "Consent is required to save the result and go to consultation.",
    consentChk: "I agree.",
    consentYes: "Yes",
    consentNo: "No",

    // final
    finalTitle: "Your profile",
    finalProfileUniversal: "Universal technical profile",
    finalProfileIT: "Strong inclination to IT and programming",
    finalProfileEngineering: "Strong inclination to engineering & 3D thinking",

    intensiveTitle: "Spring 3-month intensive",
    intensiveLine1: "Boost logic, IT, 3D graphics, physics and artificial intelligence.",
    intensiveLine2: "Suitable for any skill level.",
    intensiveLine3: "Step-by-step, practical and without overload.",
    intensiveStart: "Starts in March",

    chooseDirection: "What do you want to boost first?",
    dirLogic: "Logic",
    dirIT: "IT",
    dir3D: "3D graphics",
    dirPhysics: "Physics",
    dirAI: "Artificial Intelligence",
    dirCustom: "Other",
    dirCustomPlaceholder: "If “Other”, type your option…",

    sendResult: "Save choice",
    getConsult: "Get consultation",
    twoClicksHint: "Two clear clicks: 1) save choice 2) open consultation.",

    savedOk: "Saved!",
    needCustomDir: "Please fill “Other”.",
    sendFail: "Network error. Please try again.",

    // labels for message
    dirLabel_logic: "Logic",
    dirLabel_it: "IT",
    dirLabel_3d: "3D graphics",
    dirLabel_physics: "Physics",
    dirLabel_ai: "Artificial Intelligence",

    consultMessage:
      "Hello! I finished the test. Profile: {profile}. Choice: {direction}. I would like a consultation.",
  },
};