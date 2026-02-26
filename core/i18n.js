// core/i18n.js

export const LANGS = [
  { code: "uz", label: "O‘zbekcha" },
  { code: "ru", label: "Русский" },
  { code: "en", label: "English" },
];

export const I18N = {
  uz: {
    // brand / gate
    brandTitle: "ForBrain",
    gatePlayAria: "O‘zingni tekshir",
    gateSub: "Muhandis miyang bormi? 3–5 daqiqa",

    // marketing
    marketingTitle: "Sen qaysi yo‘nalishga ko‘proq moyilsan?",
    marketingSubtitle: "3–5 daqiqa — va texnik profilingni bilib olasan.",
    marketingTagLogic: "Mantiq",
    marketingTagIT: "IT va kod",
    marketingTag3D: "3D va muhandislik fikrlash",
    marketingTagPhysics: "Fizika",
    marketingTagAI: "Sun’iy intellekt",
    marketingContinue: "Testni boshlash",

    // language
    chooseLangTitle: "Tilni tanla",
    chooseLangText: "Test va natijalar tanlangan tilda bo‘ladi.",

    // intro
    introTitle: "Tezkor test",
    introText: "Tez va halol javob ber. Birinchi fikr ko‘pincha to‘g‘ri.",
    tipFast: "Bu yerda bilim emas, fikrlash tekshiriladi.",
    startBtn: "Boshladik",

    // test UI
    block: "Blok",
    question: "Savol",
    score: "Ball",
    answerBtn: "Javob berish",
    nextBtn: "Keyingi",
    learnHint: "O‘rganish rejimi: javobdan keyin izoh chiqadi.",
    quizHint: "Test rejimi: tez javob ber.",
    feedbackOk: "To‘g‘ri.",
    feedbackBad: "Noto‘g‘ri.",

    // block summary
    doneTitle: "Bo‘ldi!",
    result: "Natija",
    continueQ: "Davom etamizmi?",
    yes: "Keyingi",
    restartBtn: "Qayta boshlash",
    finalAsk: "Yakuniy profil va tavsiyalarni ko‘rsatamizmi?",
    showResult: "Profilni ko‘rsatish",

    // consent
    consentTitle: "Rozilik",
    consentText: "Natijani saqlash va konsultatsiyaga o‘tish uchun rozilik kerak.",
    consentChk: "Roziman.",
    consentYes: "Ha",
    consentNo: "Yo‘q",

    // final
    finalTitle: "Sening profiling",
    finalProfileUniversal: "Universal texnik profil",
    finalProfileIT: "IT va dasturlashga kuchli moyillik",
    finalProfileEngineering: "Muhandislik/3D fikrlash kuchli",

    intensiveTitle: "3 oylik Tech Intensive",
    intensiveLine1: "Mantiq, IT, 3D, fizika va sun’iy intellektni birga kuchaytiramiz.",
    intensiveLine2: "Nazariya kam — amaliyot ko‘p. Zerikish yo‘q.",
    intensiveLine3: "Boshlang‘ichdan kuchligacha — hamma uchun mos.",
    intensiveStart: "Start: mart",

    chooseDirection: "Nimani eng ko‘p kuchaytirmoqchisan?",
    dirLogic: "Mantiq",
    dirIT: "IT",
    dir3D: "3D",
    dirPhysics: "Fizika",
    dirAI: "Sun’iy intellekt",
    dirCustom: "Boshqa",
    dirCustomPlaceholder: "Agar “Boshqa” bo‘lsa, yoz…",

    sendResult: "Profilni saqlash",
    getConsult: "Konsultatsiya olish",
    twoClicksHint: "2 ta klik: 1) saqla 2) konsultatsiyaga o‘t",

    savedOk: "Saqlandi!",
    needCustomDir: "Iltimos, “Boshqa” uchun matn yoz.",
    sendFail: "Internet xatosi. Qayta urinib ko‘r.",

    // labels for message
    dirLabel_logic: "Mantiq",
    dirLabel_it: "IT",
    dirLabel_3d: "3D",
    dirLabel_physics: "Fizika",
    dirLabel_ai: "Sun’iy intellekt",

    consultMessage:
      "Salom! Men testdan o‘tdim. Profil: {profile}. Tanlovim: {direction}. Konsultatsiya olmoqchiman.",
  },

  ru: {
    // brand / gate
    brandTitle: "ForBrain",
    gatePlayAria: "Проверить себя",
    gateSub: "Есть ли у тебя мозг инженера? 3–5 минут",

    // marketing
    marketingTitle: "Ты технарь или просто думаешь, что технарь?",
    marketingSubtitle: "3–5 минут — и ты узнаешь свой технический профиль.",
    marketingTagLogic: "Логика",
    marketingTagIT: "IT и код",
    marketingTag3D: "3D и инженерия",
    marketingTagPhysics: "Физика",
    marketingTagAI: "Искусственный интеллект",
    marketingContinue: "Пройти тест",

    // language
    chooseLangTitle: "Выбери язык",
    chooseLangText: "Тест и результаты будут на выбранном языке.",

    // intro
    introTitle: "Честный тест мышления",
    introText: "Отвечай быстро и честно. Первая реакция важнее долгих раздумий.",
    tipFast: "Здесь проверяется не знание, а способ мышления.",
    startBtn: "Начать",

    // test UI
    block: "Блок",
    question: "Вопрос",
    score: "Очки",
    answerBtn: "Ответить",
    nextBtn: "Дальше",
    learnHint: "Режим обучения: после ответа будет объяснение.",
    quizHint: "Тестовый режим: отвечай быстро.",
    feedbackOk: "Верно.",
    feedbackBad: "Неверно.",

    // block summary
    doneTitle: "Готово!",
    result: "Результат",
    continueQ: "Продолжаем?",
    yes: "Далее",
    restartBtn: "Пройти заново",
    finalAsk: "Показать итоговый профиль и рекомендации?",
    showResult: "Показать профиль",

    // consent
    consentTitle: "Согласие",
    consentText: "Чтобы сохранить результат и перейти к консультации, нужно согласие.",
    consentChk: "Я согласен(на).",
    consentYes: "Да",
    consentNo: "Нет",

    // final
    finalTitle: "Твой технический профиль",
    finalProfileUniversal: "Универсальный технический потенциал",
    finalProfileIT: "Сильная склонность к IT и алгоритмическому мышлению",
    finalProfileEngineering: "Сильная склонность к инженерному и пространственному мышлению",

    intensiveTitle: "3-месячный Tech Intensive",
    intensiveLine1: "Прокачаем логику, IT, 3D, физику и искусственный интеллект.",
    intensiveLine2: "Без скучной теории — больше практики и реальных задач.",
    intensiveLine3: "Подходит для любого уровня — от новичка до сильного.",
    intensiveStart: "Старт: март",

    chooseDirection: "Что хочешь прокачать сильнее всего?",
    dirLogic: "Логика",
    dirIT: "IT",
    dir3D: "3D",
    dirPhysics: "Физика",
    dirAI: "ИИ",
    dirCustom: "Другое",
    dirCustomPlaceholder: "Если «Другое», напиши…",

    sendResult: "Сохранить профиль",
    getConsult: "Записаться на консультацию",
    twoClicksHint: "Два клика: 1) сохранить 2) перейти к консультации",

    savedOk: "Сохранено!",
    needCustomDir: "Заполни поле «Другое».",
    sendFail: "Ошибка сети. Попробуй ещё раз.",

    // labels for message
    dirLabel_logic: "Логика",
    dirLabel_it: "IT",
    dirLabel_3d: "3D",
    dirLabel_physics: "Физика",
    dirLabel_ai: "ИИ",

    consultMessage:
      "Привет! Я прошёл(ла) тест. Профиль: {profile}. Выбор: {direction}. Хочу консультацию.",
  },

  en: {
    // brand / gate
    brandTitle: "ForBrain",
    gatePlayAria: "Check yourself",
    gateSub: "Do you have an engineer’s brain? 3–5 min",

    // marketing
    marketingTitle: "Are you really a tech person — or just think you are?",
    marketingSubtitle: "3–5 minutes to reveal your technical profile.",
    marketingTagLogic: "Logic",
    marketingTagIT: "IT & code",
    marketingTag3D: "3D & engineering",
    marketingTagPhysics: "Physics",
    marketingTagAI: "Artificial Intelligence",
    marketingContinue: "Start the test",

    // language
    chooseLangTitle: "Choose language",
    chooseLangText: "The test and results will be in the selected language.",

    // intro
    introTitle: "A real thinking test",
    introText: "Answer fast and honestly. Your first reaction matters.",
    tipFast: "This checks how you think, not what you memorized.",
    startBtn: "Start",

    // test UI
    block: "Block",
    question: "Question",
    score: "Score",
    answerBtn: "Answer",
    nextBtn: "Next",
    learnHint: "Learning mode: you’ll see an explanation after answering.",
    quizHint: "Quiz mode: answer fast.",
    feedbackOk: "Correct.",
    feedbackBad: "Incorrect.",

    // block summary
    doneTitle: "Done!",
    result: "Result",
    continueQ: "Continue?",
    yes: "Next",
    restartBtn: "Restart",
    finalAsk: "Show the final profile and recommendations?",
    showResult: "Show profile",

    // consent
    consentTitle: "Consent",
    consentText: "Consent is required to save the result and open consultation.",
    consentChk: "I agree.",
    consentYes: "Yes",
    consentNo: "No",

    // final
    finalTitle: "Your technical profile",
    finalProfileUniversal: "Universal technical potential",
    finalProfileIT: "Strong inclination to IT & algorithmic thinking",
    finalProfileEngineering: "Strong inclination to engineering & spatial thinking",

    intensiveTitle: "3-month Tech Intensive",
    intensiveLine1: "Boost logic, IT, 3D, physics and artificial intelligence — together.",
    intensiveLine2: "Less boring theory — more practice and real tasks.",
    intensiveLine3: "Works for any level — beginner to advanced.",
    intensiveStart: "Starts in March",

    chooseDirection: "What do you want to boost the most?",
    dirLogic: "Logic",
    dirIT: "IT",
    dir3D: "3D",
    dirPhysics: "Physics",
    dirAI: "AI",
    dirCustom: "Other",
    dirCustomPlaceholder: "If “Other”, type it…",

    sendResult: "Save profile",
    getConsult: "Book a consultation",
    twoClicksHint: "Two clicks: 1) save 2) open consultation",

    savedOk: "Saved!",
    needCustomDir: "Please fill “Other”.",
    sendFail: "Network error. Please try again.",

    // labels for message
    dirLabel_logic: "Logic",
    dirLabel_it: "IT",
    dirLabel_3d: "3D",
    dirLabel_physics: "Physics",
    dirLabel_ai: "AI",

    consultMessage:
      "Hi! I finished the test. Profile: {profile}. Choice: {direction}. I want a consultation.",
  },
};