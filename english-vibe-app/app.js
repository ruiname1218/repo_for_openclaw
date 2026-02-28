const WORDS = [
  { word: "apple", meaning: "りんご", example: "I eat an apple every morning." },
  { word: "book", meaning: "本", example: "This book is easy to read." },
  { word: "water", meaning: "水", example: "Please drink more water." },
  { word: "friend", meaning: "友だち", example: "My friend lives in Tokyo." },
  { word: "school", meaning: "学校", example: "She goes to school by bus." },
  { word: "family", meaning: "家族", example: "My family likes sushi." },
  { word: "house", meaning: "家", example: "Their house is very clean." },
  { word: "music", meaning: "音楽", example: "I listen to music at night." },
  { word: "food", meaning: "食べ物", example: "Japanese food is delicious." },
  { word: "happy", meaning: "うれしい", example: "I am happy today." },
  { word: "morning", meaning: "朝", example: "I jog in the morning." },
  { word: "night", meaning: "夜", example: "It is quiet at night." },
  { word: "work", meaning: "仕事", example: "He starts work at nine." },
  { word: "study", meaning: "勉強する", example: "We study English together." },
  { word: "travel", meaning: "旅行する", example: "I want to travel abroad." },
  { word: "time", meaning: "時間", example: "Do you have time now?" },
  { word: "money", meaning: "お金", example: "I save money every month." },
  { word: "weather", meaning: "天気", example: "The weather is sunny." },
  { word: "beautiful", meaning: "美しい", example: "That beach is beautiful." },
  { word: "small", meaning: "小さい", example: "I have a small bag." },
  { word: "big", meaning: "大きい", example: "This city is big." },
  { word: "fast", meaning: "速い", example: "This train is very fast." },
  { word: "slow", meaning: "遅い", example: "Please speak slowly." },
  { word: "open", meaning: "開ける", example: "Open the window, please." },
  { word: "close", meaning: "閉める", example: "Close the door gently." },
  { word: "question", meaning: "質問", example: "I have a question." },
  { word: "answer", meaning: "答え", example: "Your answer is correct." },
  { word: "learn", meaning: "学ぶ", example: "Children learn quickly." },
  { word: "speak", meaning: "話す", example: "Can you speak English?" },
  { word: "listen", meaning: "聞く", example: "Listen to your teacher." },
];

const STORAGE_KEYS = {
  progress: "englishVibeProgress",
  streak: "englishVibeStreak",
  theme: "englishVibeTheme",
};

const defaultProgress = { correct: 0, answered: 0 };

let progress = loadJSON(STORAGE_KEYS.progress, defaultProgress);
let streak = loadJSON(STORAGE_KEYS.streak, { count: 0, lastDate: null });
let currentCard = null;
let currentQuiz = null;

const el = {
  correctCount: document.getElementById("correctCount"),
  answeredCount: document.getElementById("answeredCount"),
  accuracy: document.getElementById("accuracy"),
  streak: document.getElementById("streak"),
  cardWord: document.getElementById("cardWord"),
  cardMeaning: document.getElementById("cardMeaning"),
  cardExample: document.getElementById("cardExample"),
  toggleAnswerBtn: document.getElementById("toggleAnswerBtn"),
  nextCardBtn: document.getElementById("nextCardBtn"),
  flashcard: document.getElementById("flashcard"),
  tabs: document.querySelectorAll(".tab"),
  flashcardMode: document.getElementById("flashcardMode"),
  quizMode: document.getElementById("quizMode"),
  quizWord: document.getElementById("quizWord"),
  quizChoices: document.getElementById("quizChoices"),
  quizFeedback: document.getElementById("quizFeedback"),
  nextQuizBtn: document.getElementById("nextQuizBtn"),
  themeToggle: document.getElementById("themeToggle"),
};

function loadJSON(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function saveJSON(key, data) {
  localStorage.setItem(key, JSON.stringify(data));
}

function localDateString() {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function yesterdayString(dateString) {
  const date = new Date(`${dateString}T00:00:00`);
  date.setDate(date.getDate() - 1);
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function updateStreakOnAnswer() {
  const today = localDateString();
  if (streak.lastDate === today) return;
  if (!streak.lastDate) {
    streak.count = 1;
  } else if (streak.lastDate === yesterdayString(today)) {
    streak.count += 1;
  } else {
    streak.count = 1;
  }
  streak.lastDate = today;
  saveJSON(STORAGE_KEYS.streak, streak);
}

function updateStats() {
  const accuracy = progress.answered ? Math.round((progress.correct / progress.answered) * 100) : 0;
  el.correctCount.textContent = progress.correct;
  el.answeredCount.textContent = progress.answered;
  el.accuracy.textContent = `${accuracy}%`;
  el.streak.textContent = `${streak.count || 0}日`;
}

function getRandomWord(excludeWord = null) {
  const pool = excludeWord ? WORDS.filter((w) => w.word !== excludeWord) : WORDS;
  return pool[Math.floor(Math.random() * pool.length)];
}

function renderCard() {
  currentCard = getRandomWord();
  el.cardWord.textContent = currentCard.word;
  el.cardMeaning.textContent = `意味: ${currentCard.meaning}`;
  el.cardExample.textContent = `例文: ${currentCard.example}`;
  hideCardAnswer();
}

function showCardAnswer() {
  el.cardMeaning.classList.remove("hidden");
  el.cardExample.classList.remove("hidden");
  el.toggleAnswerBtn.textContent = "隠す";
}

function hideCardAnswer() {
  el.cardMeaning.classList.add("hidden");
  el.cardExample.classList.add("hidden");
  el.toggleAnswerBtn.textContent = "意味を見る";
}

function toggleCardAnswer() {
  const hidden = el.cardMeaning.classList.contains("hidden");
  hidden ? showCardAnswer() : hideCardAnswer();
}

function setupQuiz() {
  currentQuiz = getRandomWord();
  const choices = [currentQuiz];
  while (choices.length < 4) {
    const candidate = getRandomWord(currentQuiz.word);
    if (!choices.find((c) => c.word === candidate.word)) choices.push(candidate);
  }

  shuffle(choices);
  el.quizWord.textContent = currentQuiz.word;
  el.quizChoices.innerHTML = "";
  el.quizFeedback.textContent = "";
  el.nextQuizBtn.classList.add("hidden");

  choices.forEach((choice) => {
    const btn = document.createElement("button");
    btn.className = "choice";
    btn.textContent = choice.meaning;
    btn.addEventListener("click", () => answerQuiz(choice, btn));
    el.quizChoices.appendChild(btn);
  });
}

function answerQuiz(choice, button) {
  const buttons = [...el.quizChoices.querySelectorAll("button")];
  buttons.forEach((b) => (b.disabled = true));

  const isCorrect = choice.word === currentQuiz.word;
  progress.answered += 1;
  if (isCorrect) {
    progress.correct += 1;
    button.classList.add("correct");
    el.quizFeedback.textContent = "正解！🎉";
  } else {
    button.classList.add("wrong");
    const correctBtn = buttons.find((b) => b.textContent === currentQuiz.meaning);
    if (correctBtn) correctBtn.classList.add("correct");
    el.quizFeedback.textContent = `不正解。正解は「${currentQuiz.meaning}」`;
  }

  updateStreakOnAnswer();
  saveJSON(STORAGE_KEYS.progress, progress);
  updateStats();
  el.nextQuizBtn.classList.remove("hidden");
}

function shuffle(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
}

function switchMode(mode) {
  const isFlash = mode === "flashcard";
  el.flashcardMode.classList.toggle("hidden", !isFlash);
  el.quizMode.classList.toggle("hidden", isFlash);
  el.tabs.forEach((tab) => tab.classList.toggle("active", tab.dataset.mode === mode));
  if (!isFlash) setupQuiz();
}

function applyTheme(theme) {
  const dark = theme === "dark";
  document.documentElement.classList.toggle("dark", dark);
  el.themeToggle.textContent = dark ? "☀️" : "🌙";
}

function initTheme() {
  const saved = localStorage.getItem(STORAGE_KEYS.theme);
  const preferredDark = window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches;
  const theme = saved || (preferredDark ? "dark" : "light");
  applyTheme(theme);
}

el.toggleAnswerBtn.addEventListener("click", toggleCardAnswer);
el.nextCardBtn.addEventListener("click", renderCard);
el.flashcard.addEventListener("click", toggleCardAnswer);
el.tabs.forEach((tab) => tab.addEventListener("click", () => switchMode(tab.dataset.mode)));
el.nextQuizBtn.addEventListener("click", setupQuiz);
el.themeToggle.addEventListener("click", () => {
  const next = document.documentElement.classList.contains("dark") ? "light" : "dark";
  applyTheme(next);
  localStorage.setItem(STORAGE_KEYS.theme, next);
});

updateStats();
initTheme();
renderCard();
