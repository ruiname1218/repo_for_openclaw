const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');

const scoreEl = document.getElementById('score');
const highScoreEl = document.getElementById('highScore');
const startBtn = document.getElementById('startBtn');
const pauseBtn = document.getElementById('pauseBtn');
const soundBtn = document.getElementById('soundBtn');
const overlay = document.getElementById('overlay');
const overlayTitle = document.getElementById('overlayTitle');
const overlayText = document.getElementById('overlayText');

const W = canvas.width;
const H = canvas.height;

const state = {
  running: false,
  paused: false,
  soundOn: true,
  score: 0,
  highScore: Number(localStorage.getItem('rocketDodgeHighScore') || 0),
  time: 0,
  keys: { left: false, right: false, up: false, down: false },
  asteroids: [],
  stars: [],
  particles: [],
};

const rocket = { x: W / 2, y: H - 90, w: 30, h: 38, speed: 280 };

highScoreEl.textContent = state.highScore;

const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
function beep(freq = 440, duration = 0.08, type = 'sine', gainVal = 0.05) {
  if (!state.soundOn) return;
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.type = type;
  osc.frequency.value = freq;
  gain.gain.value = gainVal;
  osc.connect(gain).connect(audioCtx.destination);
  osc.start();
  osc.stop(audioCtx.currentTime + duration);
}

function rand(min, max) {
  return Math.random() * (max - min) + min;
}

function resetGame() {
  state.score = 0;
  state.time = 0;
  state.asteroids = [];
  state.stars = [];
  state.particles = [];
  rocket.x = W / 2;
  rocket.y = H - 90;
  scoreEl.textContent = '0';
}

function startGame() {
  if (audioCtx.state === 'suspended') audioCtx.resume();
  resetGame();
  state.running = true;
  state.paused = false;
  pauseBtn.textContent = '一時停止';
  hideOverlay();
  beep(520, 0.1, 'triangle', 0.07);
}

function gameOver() {
  state.running = false;
  if (state.score > state.highScore) {
    state.highScore = state.score;
    localStorage.setItem('rocketDodgeHighScore', String(state.highScore));
    highScoreEl.textContent = state.highScore;
  }
  showOverlay('ゲームオーバー！', `最終スコア: ${state.score} / ハイスコア: ${state.highScore}`);
  beep(160, 0.2, 'sawtooth', 0.08);
}

function togglePause() {
  if (!state.running) return;
  state.paused = !state.paused;
  pauseBtn.textContent = state.paused ? '再開' : '一時停止';
  if (state.paused) {
    showOverlay('一時停止中', '「再開」または P キーで戻る');
  } else {
    hideOverlay();
  }
}

function showOverlay(title, text) {
  overlayTitle.textContent = title;
  overlayText.textContent = text;
  overlay.classList.add('show');
}

function hideOverlay() {
  overlay.classList.remove('show');
}

function createExplosion(x, y, color = '#ffbb66', count = 18) {
  for (let i = 0; i < count; i++) {
    state.particles.push({
      x,
      y,
      vx: rand(-140, 140),
      vy: rand(-140, 140),
      life: rand(0.3, 0.9),
      r: rand(1.5, 4),
      color,
    });
  }
}

function spawnAsteroid(difficulty) {
  const r = rand(13, 25);
  state.asteroids.push({
    x: rand(r, W - r),
    y: -40,
    r,
    vy: rand(80, 150) + difficulty * rand(14, 28),
    vx: rand(-35, 35),
  });
}

function spawnStar(difficulty) {
  const r = rand(8, 12);
  state.stars.push({
    x: rand(r, W - r),
    y: -20,
    r,
    vy: rand(90, 130) + difficulty * 8,
  });
}

function circleHitRect(c, rct) {
  const cx = Math.max(rct.x, Math.min(c.x, rct.x + rct.w));
  const cy = Math.max(rct.y, Math.min(c.y, rct.y + rct.h));
  const dx = c.x - cx;
  const dy = c.y - cy;
  return dx * dx + dy * dy <= c.r * c.r;
}

function update(dt) {
  if (!state.running || state.paused) return;

  state.time += dt;
  const difficulty = 1 + state.time * 0.06;

  if (Math.random() < (0.015 + difficulty * 0.002) * dt * 60) spawnAsteroid(difficulty);
  if (Math.random() < (0.008 + difficulty * 0.0008) * dt * 60) spawnStar(difficulty);

  const move = { x: 0, y: 0 };
  if (state.keys.left) move.x -= 1;
  if (state.keys.right) move.x += 1;
  if (state.keys.up) move.y -= 1;
  if (state.keys.down) move.y += 1;

  const len = Math.hypot(move.x, move.y) || 1;
  rocket.x += (move.x / len) * rocket.speed * dt;
  rocket.y += (move.y / len) * rocket.speed * dt;
  rocket.x = Math.max(0, Math.min(W - rocket.w, rocket.x));
  rocket.y = Math.max(0, Math.min(H - rocket.h, rocket.y));

  createExhaust(dt);

  for (const a of state.asteroids) {
    a.x += a.vx * dt;
    a.y += a.vy * dt;
    if (a.x < a.r || a.x > W - a.r) a.vx *= -1;
  }
  for (const s of state.stars) s.y += s.vy * dt;

  for (let i = state.asteroids.length - 1; i >= 0; i--) {
    const a = state.asteroids[i];
    if (a.y > H + 40) state.asteroids.splice(i, 1);
    else if (circleHitRect(a, rocket)) {
      createExplosion(rocket.x + rocket.w / 2, rocket.y + rocket.h / 2, '#ff6b6b', 36);
      gameOver();
      return;
    }
  }

  for (let i = state.stars.length - 1; i >= 0; i--) {
    const s = state.stars[i];
    if (s.y > H + 25) state.stars.splice(i, 1);
    else if (circleHitRect(s, rocket)) {
      state.stars.splice(i, 1);
      state.score += 10;
      scoreEl.textContent = String(state.score);
      createExplosion(s.x, s.y, '#ffe768', 12);
      beep(760, 0.06, 'square', 0.05);
    }
  }

  for (let i = state.particles.length - 1; i >= 0; i--) {
    const p = state.particles[i];
    p.life -= dt;
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    p.vy += 160 * dt;
    if (p.life <= 0) state.particles.splice(i, 1);
  }

  state.score += dt * (4 + difficulty);
  scoreEl.textContent = Math.floor(state.score);
}

function createExhaust(dt) {
  if (!state.running || state.paused) return;
  if (Math.random() < 0.55) {
    state.particles.push({
      x: rocket.x + rocket.w / 2 + rand(-2, 2),
      y: rocket.y + rocket.h,
      vx: rand(-18, 18),
      vy: rand(30, 90),
      life: rand(0.2, 0.45),
      r: rand(1, 2.6),
      color: '#5ee7ff',
    });
  }
}

function drawBackground() {
  ctx.fillStyle = '#0b1128';
  ctx.fillRect(0, 0, W, H);
  for (let i = 0; i < 35; i++) {
    ctx.fillStyle = `rgba(255,255,255,${0.15 + (i % 5) * 0.07})`;
    const x = (i * 97 + state.time * 14 * (1 + (i % 3))) % W;
    const y = (i * 53 + state.time * 30 * (1 + (i % 2))) % H;
    ctx.fillRect(x, y, 2, 2);
  }
}

function drawRocket() {
  const x = rocket.x;
  const y = rocket.y;
  ctx.save();
  ctx.translate(x + rocket.w / 2, y + rocket.h / 2);

  ctx.fillStyle = '#d7e6ff';
  ctx.beginPath();
  ctx.moveTo(0, -rocket.h / 2);
  ctx.lineTo(rocket.w / 2, rocket.h / 2);
  ctx.lineTo(-rocket.w / 2, rocket.h / 2);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = '#3ba7ff';
  ctx.beginPath();
  ctx.arc(0, 2, 6, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#ff6a4d';
  ctx.fillRect(-5, rocket.h / 2 - 1, 10, 8);

  ctx.restore();
}

function drawAsteroid(a) {
  ctx.save();
  ctx.translate(a.x, a.y);
  ctx.fillStyle = '#7f8798';
  ctx.beginPath();
  ctx.arc(0, 0, a.r, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#606877';
  ctx.beginPath();
  ctx.arc(-a.r * 0.3, -a.r * 0.2, a.r * 0.25, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawStar(s) {
  ctx.save();
  ctx.translate(s.x, s.y);
  ctx.fillStyle = '#ffe768';
  ctx.beginPath();
  for (let i = 0; i < 5; i++) {
    const a = (i * Math.PI * 2) / 5 - Math.PI / 2;
    const r1 = s.r;
    const r2 = s.r * 0.46;
    ctx.lineTo(Math.cos(a) * r1, Math.sin(a) * r1);
    ctx.lineTo(Math.cos(a + Math.PI / 5) * r2, Math.sin(a + Math.PI / 5) * r2);
  }
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

function drawParticles() {
  for (const p of state.particles) {
    ctx.globalAlpha = Math.max(0, p.life);
    ctx.fillStyle = p.color;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
}

function draw() {
  drawBackground();
  state.asteroids.forEach(drawAsteroid);
  state.stars.forEach(drawStar);
  drawRocket();
  drawParticles();
}

let last = performance.now();
function loop(now) {
  const dt = Math.min(0.033, (now - last) / 1000);
  last = now;
  update(dt);
  draw();
  requestAnimationFrame(loop);
}
requestAnimationFrame(loop);

function setKey(code, val) {
  if (code === 'ArrowLeft' || code === 'KeyA') state.keys.left = val;
  if (code === 'ArrowRight' || code === 'KeyD') state.keys.right = val;
  if (code === 'ArrowUp' || code === 'KeyW') state.keys.up = val;
  if (code === 'ArrowDown' || code === 'KeyS') state.keys.down = val;
}

window.addEventListener('keydown', (e) => {
  setKey(e.code, true);
  if (e.code === 'KeyP') togglePause();
});
window.addEventListener('keyup', (e) => setKey(e.code, false));

for (const btn of document.querySelectorAll('.touch-btn')) {
  const dir = btn.dataset.dir;
  const apply = (v) => {
    if (dir === 'left') state.keys.left = v;
    if (dir === 'right') state.keys.right = v;
    if (dir === 'up') state.keys.up = v;
    if (dir === 'down') state.keys.down = v;
  };
  btn.addEventListener('touchstart', (e) => { e.preventDefault(); apply(true); }, { passive: false });
  btn.addEventListener('touchend', (e) => { e.preventDefault(); apply(false); }, { passive: false });
  btn.addEventListener('mousedown', () => apply(true));
  btn.addEventListener('mouseup', () => apply(false));
  btn.addEventListener('mouseleave', () => apply(false));
}

let dragActive = false;
canvas.addEventListener('touchstart', (e) => { dragActive = true; handleDrag(e); }, { passive: false });
canvas.addEventListener('touchmove', (e) => { if (dragActive) handleDrag(e); }, { passive: false });
canvas.addEventListener('touchend', () => { dragActive = false; state.keys = { left: false, right: false, up: false, down: false }; });

function handleDrag(e) {
  e.preventDefault();
  const t = e.touches[0];
  const rect = canvas.getBoundingClientRect();
  const tx = ((t.clientX - rect.left) / rect.width) * W;
  const ty = ((t.clientY - rect.top) / rect.height) * H;
  const dx = tx - (rocket.x + rocket.w / 2);
  const dy = ty - (rocket.y + rocket.h / 2);
  state.keys.left = dx < -8;
  state.keys.right = dx > 8;
  state.keys.up = dy < -8;
  state.keys.down = dy > 8;
}

startBtn.addEventListener('click', startGame);
pauseBtn.addEventListener('click', togglePause);
soundBtn.addEventListener('click', () => {
  state.soundOn = !state.soundOn;
  soundBtn.textContent = state.soundOn ? '🔊 サウンド ON' : '🔈 サウンド OFF';
  beep(660, 0.05, 'triangle', 0.04);
});

showOverlay('スタート準備OK？', 'スタートを押して遊ぼう！');
