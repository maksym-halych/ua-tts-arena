export const LANGS = ["en", "uk"] as const;
export type Lang = (typeof LANGS)[number];

const en = {
  meta: {
    title: "UA TTS Arena",
    description: "Listen to Ukrainian text-to-speech models and vote for the voice that sounds more natural.",
  },
  nav: {
    vote: "Vote",
    leaderboard: "Leaderboard",
    admin: "Admin",
    signIn: "Sign in",
    signOut: "Sign out",
    language: "Language",
  },
  landing: {
    title: "Which voice sounds more natural?",
    body: "Listen to the same Ukrainian sentence from two anonymous text-to-speech models, then pick the one that sounds more natural.",
    cta: "Sign in to vote",
  },
  signIn: {
    title: "Sign in",
    body: "Sign in to vote. The app stores your email address and your votes, and it counts one vote for each comparison.",
    google: "Continue with Google",
    error: "Sign-in failed. Try again.",
    localTitle: "Local sign-in",
    localBody: "This form is available only with a local database. It doesn't check the address.",
    email: "Email address",
    localSubmit: "Sign in",
    noMethod: "No sign-in method is available. Ask the administrator to set up Google sign-in.",
  },
  arena: {
    question: "Which sample sounds more natural?",
    sentence: "Sentence",
    sample: "Sample",
    sideA: "A",
    sideB: "B",
    vote: "Vote",
    listenFirst: "Listen to both",
    heard: "Heard",
    loading: "Loading the samples…",
    play: "Play",
    pause: "Pause",
    yourPick: "Your pick",
    recorded: "Your vote is recorded.",
    hidden: "The model names are hidden.",
    next: "Next comparison",
    skip: "Skip this sentence",
    doneTitle: "You rated every comparison.",
    doneBody: "Thank you. New comparisons appear when new models are added.",
    unavailableTitle: "No comparisons are available yet.",
    unavailableBody: "Come back when the arena has at least two models.",
    listenMore: "Listen a little longer before you vote.",
    tooMany: "You are voting very fast. Wait a minute and try again.",
    audioError: "A sample failed to load.",
    error: "Something went wrong.",
    retry: "Try again",
  },
  leaderboard: {
    title: "Leaderboard",
    intro:
      "Raters compare two anonymous samples of the same sentence. Ratings come from a Bradley–Terry fit. The rank (#) uses the lower bound of the 95% confidence interval. Select a column heading to sort the list.",
    rank: "#",
    model: "Model",
    rating: "Rating",
    winRate: "Win rate",
    votes: "Votes",
    wer: "Avg WER",
    cer: "Avg CER",
    note: "Automatic speech recognition gives WER and CER. A lower value is better. A model with no votes has no rating yet.",
    empty: "No models are available yet.",
    private: "The leaderboard is not public at the moment.",
  },
  errors: {
    title: "Something went wrong.",
    notFound: "This page doesn't exist.",
    home: "Go to the main page",
  },
};

export type Strings = typeof en;

const uk: Strings = {
  meta: {
    title: "UA TTS Arena",
    description: "Слухайте українські моделі синтезу мовлення і голосуйте за голос, який звучить природніше.",
  },
  nav: {
    vote: "Голосування",
    leaderboard: "Рейтинг",
    admin: "Адмін",
    signIn: "Увійти",
    signOut: "Вийти",
    language: "Мова",
  },
  landing: {
    title: "Який голос звучить природніше?",
    body: "Послухайте те саме українське речення від двох анонімних моделей синтезу мовлення і виберіть запис, який звучить природніше.",
    cta: "Увійти, щоб голосувати",
  },
  signIn: {
    title: "Вхід",
    body: "Увійдіть, щоб голосувати. Застосунок зберігає вашу електронну адресу й голоси та зараховує один голос за кожне порівняння.",
    google: "Продовжити з Google",
    error: "Не вдалося увійти. Спробуйте ще раз.",
    localTitle: "Локальний вхід",
    localBody: "Ця форма доступна лише з локальною базою даних. Вона не перевіряє адресу.",
    email: "Електронна адреса",
    localSubmit: "Увійти",
    noMethod: "Немає доступного способу входу. Попросіть адміністратора налаштувати вхід через Google.",
  },
  arena: {
    question: "Який запис звучить природніше?",
    sentence: "Речення",
    sample: "Запис",
    sideA: "А",
    sideB: "Б",
    vote: "Голосувати",
    listenFirst: "Послухайте обидва",
    heard: "Прослухано",
    loading: "Завантажуємо записи…",
    play: "Відтворити",
    pause: "Пауза",
    yourPick: "Ваш вибір",
    recorded: "Ваш голос зараховано.",
    hidden: "Назви моделей приховано.",
    next: "Наступне порівняння",
    skip: "Пропустити це речення",
    doneTitle: "Ви оцінили всі порівняння.",
    doneBody: "Дякуємо! Нові порівняння з'являться, коли додадуть нові моделі.",
    unavailableTitle: "Порівнянь поки немає.",
    unavailableBody: "Поверніться, коли в арені буде щонайменше дві моделі.",
    listenMore: "Послухайте ще трохи, перш ніж голосувати.",
    tooMany: "Ви голосуєте дуже швидко. Зачекайте хвилину і спробуйте ще раз.",
    audioError: "Не вдалося завантажити запис.",
    error: "Щось пішло не так.",
    retry: "Спробувати ще раз",
  },
  leaderboard: {
    title: "Рейтинг",
    intro:
      "Слухачі порівнюють два анонімні записи того самого речення. Оцінки обчислено за моделлю Бредлі–Террі. Місце (№) визначено за нижньою межею 95% довірчого інтервалу. Натисніть заголовок стовпця, щоб упорядкувати список.",
    rank: "№",
    model: "Модель",
    rating: "Оцінка",
    winRate: "Частка перемог",
    votes: "Голоси",
    wer: "Сер. WER",
    cer: "Сер. CER",
    note: "WER і CER отримано за допомогою автоматичного розпізнавання мовлення. Менше значення краще. Модель без голосів ще не має оцінки.",
    empty: "Моделей поки немає.",
    private: "Рейтинг зараз не публічний.",
  },
  errors: {
    title: "Щось пішло не так.",
    notFound: "Такої сторінки немає.",
    home: "На головну сторінку",
  },
};

export const STRINGS: Record<Lang, Strings> = { en, uk };

/** Ukrainian if the browser prefers it to English, otherwise English. */
export function langFromHeader(acceptLanguage: string | null): Lang {
  const first = acceptLanguage?.split(",")[0]?.trim().toLowerCase() ?? "";
  return first.startsWith("uk") ? "uk" : "en";
}

export function isLang(value: unknown): value is Lang {
  return LANGS.includes(value as Lang);
}
