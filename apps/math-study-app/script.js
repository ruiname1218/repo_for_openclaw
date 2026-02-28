const QUESTIONS_PER_SESSION = 10;

const el = {
  setup: document.getElementById('setup'),
  quiz: document.getElementById('quiz'),
  result: document.getElementById('result'),
  mode: document.getElementById('mode'),
  difficulty: document.getElementById('difficulty'),
  startBtn: document.getElementById('startBtn'),
  progress: document.getElementById('progress'),
  timer: document.getElementById('timer'),
  question: document.getElementById('question'),
  answerInput: document.getElementById('answerInput'),
  submitBtn: document.getElementById('submitBtn'),
  nextBtn: document.getElementById('nextBtn'),
  feedback: document.getElementById('feedback'),
  scoreText: document.getElementById('scoreText'),
  timeText: document.getElementById('timeText'),
  weakStats: document.getElementById('weakStats'),
  retryBtn: document.getElementById('retryBtn'),
  bestScore: document.getElementById('bestScore'),
  streak: document.getElementById('streak'),
  themeToggle: document.getElementById('themeToggle'),
};

const opLabel = { add: 'たし算', sub: 'ひき算', mul: 'かけ算', div: 'わり算' };
const symbol = { add: '+', sub: '-', mul: '×', div: '÷' };
const ranges = {
  easy: [1, 10],
  medium: [5, 30],
  hard: [10, 99],
};

let state = {};
let timerId = null;

function rand(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function formatTime(sec) {
  const m = String(Math.floor(sec / 60)).padStart(2, '0');
  const s = String(sec % 60).padStart(2, '0');
  return `${m}:${s}`;
}

function getStorage() {
  return {
    bestScore: Number(localStorage.getItem('math_best_score') || 0),
    streakCount: Number(localStorage.getItem('math_streak_count') || 0),
    lastStudyDate: localStorage.getItem('math_last_study_date') || '',
    darkMode: localStorage.getItem('math_dark_mode') === '1',
  };
}

function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

function yesterdayStr() {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return d.toISOString().slice(0, 10);
}

function renderTopStats() {
  const s = getStorage();
  el.bestScore.textContent = `${s.bestScore} / ${QUESTIONS_PER_SESSION}`;
  el.streak.textContent = `${s.streakCount}日`;
}

function applyTheme() {
  const { darkMode } = getStorage();
  document.body.classList.toggle('dark', darkMode);
  el.themeToggle.textContent = darkMode ? '☀️ ライトモード' : '🌙 ダークモード';
}

function buildQuestion(mode, difficulty) {
  const [min, max] = ranges[difficulty];
  let a = rand(min, max);
  let b = rand(min, max);
  let answer, expression, explanation;

  if (mode === 'add') {
    answer = a + b;
    expression = `${a} + ${b}`;
    explanation = `${a}に${b}を足すので${answer}`;
  }

  if (mode === 'sub') {
    if (b > a) [a, b] = [b, a];
    answer = a - b;
    expression = `${a} - ${b}`;
    explanation = `${a}から${b}を引くので${answer}`;
  }

  if (mode === 'mul') {
    if (difficulty === 'easy') {
      a = rand(1, 9);
      b = rand(1, 9);
    } else if (difficulty === 'medium') {
      a = rand(2, 12);
      b = rand(2, 12);
    } else {
      a = rand(5, 20);
      b = rand(5, 20);
    }
    answer = a * b;
    expression = `${a} × ${b}`;
    explanation = `${a}を${b}回たすのと同じで${answer}`;
  }

  if (mode === 'div') {
    const divisor = difficulty === 'easy' ? rand(2, 9) : difficulty === 'medium' ? rand(2, 12) : rand(3, 20);
    const quotient = difficulty === 'easy' ? rand(1, 10) : difficulty === 'medium' ? rand(2, 12) : rand(2, 20);
    a = divisor * quotient;
    b = divisor;
    answer = quotient;
    expression = `${a} ÷ ${b}`;
    explanation = `${a}を${b}こずつ分けると${answer}こ`;
  }

  return { mode, a, b, answer, expression, explanation };
}

function updateQuestionView() {
  const q = state.questions[state.index];
  el.progress.textContent = `${state.index + 1} / ${QUESTIONS_PER_SESSION}`;
  el.question.textContent = `${q.expression} = ?`;
  el.answerInput.value = '';
  el.answerInput.focus();
  el.feedback.textContent = '';
  el.feedback.className = 'feedback';
  el.nextBtn.classList.add('hidden');
  el.submitBtn.disabled = false;
}

function startQuiz() {
  const mode = el.mode.value;
  const difficulty = el.difficulty.value;

  state = {
    mode,
    difficulty,
    index: 0,
    score: 0,
    elapsed: 0,
    questions: Array.from({ length: QUESTIONS_PER_SESSION }, () => buildQuestion(mode, difficulty)),
    statsByOp: {
      add: { correct: 0, wrong: 0 },
      sub: { correct: 0, wrong: 0 },
      mul: { correct: 0, wrong: 0 },
      div: { correct: 0, wrong: 0 },
    },
  };

  el.setup.classList.add('hidden');
  el.result.classList.add('hidden');
  el.quiz.classList.remove('hidden');

  clearInterval(timerId);
  el.timer.textContent = '⏱ 00:00';
  timerId = setInterval(() => {
    state.elapsed += 1;
    el.timer.textContent = `⏱ ${formatTime(state.elapsed)}`;
  }, 1000);

  updateQuestionView();
}

function submitAnswer() {
  const q = state.questions[state.index];
  const val = Number(el.answerInput.value);

  if (Number.isNaN(val)) {
    el.feedback.textContent = '数字を入力してね！';
    el.feedback.className = 'feedback bad';
    return;
  }

  const correct = val === q.answer;
  if (correct) {
    state.score += 1;
    state.statsByOp[q.mode].correct += 1;
    el.feedback.textContent = `✅ 正解！ ${q.explanation}`;
    el.feedback.className = 'feedback ok';
  } else {
    state.statsByOp[q.mode].wrong += 1;
    el.feedback.textContent = `❌ おしい！ 正解は ${q.answer}。解説: ${q.explanation}`;
    el.feedback.className = 'feedback bad';
  }

  el.submitBtn.disabled = true;
  el.nextBtn.classList.remove('hidden');
}

function saveProgress() {
  const s = getStorage();
  if (state.score > s.bestScore) {
    localStorage.setItem('math_best_score', String(state.score));
  }

  const today = todayStr();
  const yesterday = yesterdayStr();
  let nextStreak = s.streakCount;

  if (s.lastStudyDate === today) {
    nextStreak = s.streakCount;
  } else if (s.lastStudyDate === yesterday) {
    nextStreak = s.streakCount + 1;
  } else {
    nextStreak = 1;
  }

  localStorage.setItem('math_streak_count', String(nextStreak));
  localStorage.setItem('math_last_study_date', today);
}

function renderResult() {
  saveProgress();
  renderTopStats();

  el.quiz.classList.add('hidden');
  el.result.classList.remove('hidden');

  el.scoreText.textContent = `スコア: ${state.score} / ${QUESTIONS_PER_SESSION}（${opLabel[state.mode]}・${el.difficulty.options[el.difficulty.selectedIndex].text}）`;
  el.timeText.textContent = `かかった時間: ${formatTime(state.elapsed)}`;

  const lines = Object.entries(state.statsByOp)
    .filter(([, v]) => v.correct + v.wrong > 0)
    .map(([k, v]) => {
      const total = v.correct + v.wrong;
      const rate = Math.round((v.correct / total) * 100);
      return `<li>${opLabel[k]}: 正解${v.correct} / ${total}（正答率 ${rate}%）</li>`;
    })
    .join('');

  el.weakStats.innerHTML = `
    <p>📊 にがてポイント確認</p>
    <ul>${lines || '<li>データなし</li>'}</ul>
  `;
}

function nextQuestion() {
  state.index += 1;
  if (state.index >= QUESTIONS_PER_SESSION) {
    clearInterval(timerId);
    renderResult();
    return;
  }
  updateQuestionView();
}

el.startBtn.addEventListener('click', startQuiz);
el.submitBtn.addEventListener('click', submitAnswer);
el.nextBtn.addEventListener('click', nextQuestion);
el.retryBtn.addEventListener('click', () => {
  el.result.classList.add('hidden');
  el.setup.classList.remove('hidden');
});
el.answerInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') {
    if (el.nextBtn.classList.contains('hidden')) submitAnswer();
    else nextQuestion();
  }
});

el.themeToggle.addEventListener('click', () => {
  const s = getStorage();
  localStorage.setItem('math_dark_mode', s.darkMode ? '0' : '1');
  applyTheme();
});

applyTheme();
renderTopStats();
