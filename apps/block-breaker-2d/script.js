const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const scoreEl = document.getElementById('score');
const livesEl = document.getElementById('lives');
const levelEl = document.getElementById('level');
const overlay = document.getElementById('overlay');

const W = canvas.width, H = canvas.height;
let running = false;
let score = 0, lives = 3, level = 1;

const paddle = { w: 120, h: 14, x: W/2-60, y: H-34, speed: 8, vx: 0 };
const ball = { x: W/2, y: H-54, r: 8, vx: 4, vy: -4 };
let bricks = [];

function makeBricks(rows = 5, cols = 10) {
  bricks = [];
  const pad = 8, bw = (W - 120 - pad*(cols-1)) / cols, bh = 20;
  const ox = 60, oy = 70;
  for (let r=0; r<rows; r++) {
    for (let c=0; c<cols; c++) {
      bricks.push({
        x: ox + c*(bw+pad), y: oy + r*(bh+pad), w: bw, h: bh,
        hp: 1 + Math.floor(r/2),
        color: `hsl(${(c*26+r*14)%360} 85% ${55-r*4}%)`
      });
    }
  }
}

function resetBall() {
  ball.x = paddle.x + paddle.w/2;
  ball.y = paddle.y - 12;
  ball.vx = (Math.random() > .5 ? 1 : -1) * (3.8 + level*0.2);
  ball.vy = -(3.8 + level*0.2);
}

function restart() {
  score = 0; lives = 3; level = 1;
  paddle.x = W/2 - paddle.w/2;
  makeBricks();
  resetBall();
  running = false;
  overlay.textContent = 'Spaceで開始';
  syncHud();
}

function nextLevel() {
  level++;
  makeBricks(Math.min(8, 5 + Math.floor(level/2)), 10);
  resetBall();
  running = false;
  overlay.textContent = `Level ${level} クリア! Spaceで次へ`;
  syncHud();
}

function syncHud() {
  scoreEl.textContent = score;
  livesEl.textContent = lives;
  levelEl.textContent = level;
}

function collideRectCircle(rect, circle) {
  const cx = Math.max(rect.x, Math.min(circle.x, rect.x + rect.w));
  const cy = Math.max(rect.y, Math.min(circle.y, rect.y + rect.h));
  const dx = circle.x - cx, dy = circle.y - cy;
  return dx*dx + dy*dy <= circle.r*circle.r;
}

function update() {
  paddle.x += paddle.vx;
  paddle.x = Math.max(0, Math.min(W - paddle.w, paddle.x));

  if (!running) {
    ball.x = paddle.x + paddle.w/2;
    return;
  }

  ball.x += ball.vx;
  ball.y += ball.vy;

  if (ball.x - ball.r < 0 || ball.x + ball.r > W) ball.vx *= -1;
  if (ball.y - ball.r < 0) ball.vy *= -1;

  if (ball.y - ball.r > H) {
    lives--;
    syncHud();
    if (lives <= 0) {
      running = false;
      overlay.textContent = 'ゲームオーバー。Rでリスタート';
      return;
    }
    running = false;
    overlay.textContent = 'ミス！ Spaceで再開';
    resetBall();
  }

  if (collideRectCircle(paddle, ball) && ball.vy > 0) {
    const hit = (ball.x - (paddle.x + paddle.w/2)) / (paddle.w/2);
    ball.vx = hit * (5.2 + level*0.2);
    ball.vy = -Math.abs(ball.vy);
  }

  for (let i = bricks.length - 1; i >= 0; i--) {
    const b = bricks[i];
    if (!collideRectCircle(b, ball)) continue;

    b.hp--;
    score += 10;
    if (b.hp <= 0) bricks.splice(i, 1);

    // simple bounce
    ball.vy *= -1;
    syncHud();
    break;
  }

  if (bricks.length === 0) nextLevel();
}

function draw() {
  ctx.clearRect(0, 0, W, H);

  // stars
  ctx.save();
  ctx.globalAlpha = .18;
  for (let i=0; i<70; i++) {
    const x = (i*97) % W, y = (i*53) % H;
    ctx.fillStyle = '#cbd5ff';
    ctx.fillRect(x, y, 2, 2);
  }
  ctx.restore();

  // bricks
  for (const b of bricks) {
    ctx.fillStyle = b.color;
    ctx.fillRect(b.x, b.y, b.w, b.h);
    if (b.hp > 1) {
      ctx.fillStyle = 'rgba(0,0,0,.25)';
      ctx.fillRect(b.x, b.y, b.w, b.h);
    }
  }

  // paddle
  ctx.fillStyle = '#8ec5ff';
  ctx.fillRect(paddle.x, paddle.y, paddle.w, paddle.h);

  // ball
  ctx.beginPath();
  ctx.arc(ball.x, ball.y, ball.r, 0, Math.PI * 2);
  ctx.fillStyle = '#ffd166';
  ctx.fill();
}

function loop() {
  update();
  draw();
  requestAnimationFrame(loop);
}

addEventListener('keydown', (e) => {
  if (['ArrowLeft','a','A'].includes(e.key)) paddle.vx = -paddle.speed;
  if (['ArrowRight','d','D'].includes(e.key)) paddle.vx = paddle.speed;
  if (e.key === ' ') {
    e.preventDefault();
    if (!running && lives > 0) {
      running = true;
      overlay.textContent = '';
    }
  }
  if (e.key.toLowerCase() === 'r') restart();
});

addEventListener('keyup', (e) => {
  if (['ArrowLeft','ArrowRight','a','A','d','D'].includes(e.key)) paddle.vx = 0;
});

// touch support
let touchX = null;
canvas.addEventListener('touchstart', e => {
  touchX = e.touches[0].clientX;
  if (!running && lives > 0) { running = true; overlay.textContent = ''; }
}, {passive:true});
canvas.addEventListener('touchmove', e => {
  const x = e.touches[0].clientX;
  if (touchX !== null) {
    const dx = x - touchX;
    paddle.x += dx * 1.4;
    paddle.x = Math.max(0, Math.min(W - paddle.w, paddle.x));
  }
  touchX = x;
}, {passive:true});
canvas.addEventListener('touchend', () => { touchX = null; }, {passive:true});

makeBricks();
syncHud();
overlay.textContent = 'Spaceで開始';
loop();
