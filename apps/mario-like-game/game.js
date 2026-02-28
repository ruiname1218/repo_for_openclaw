const c = document.getElementById('game');
const ctx = c.getContext('2d');
const scoreEl = document.getElementById('score');
const livesEl = document.getElementById('lives');
const msgEl = document.getElementById('msg');

const W = c.width, H = c.height;
const keys = {};

const world = {
  gravity: 0.65,
  groundY: 460,
  scrollX: 0,
  levelLength: 3600,
  score: 0,
  lives: 3,
  won: false,
  gameOver: false,
};

const player = {
  x: 120, y: 0, w: 34, h: 48,
  vx: 0, vy: 0,
  speed: 4.2,
  jump: -12.5,
  onGround: false,
  invincible: 0,
};

const platforms = [
  { x: 0, y: 500, w: world.levelLength, h: 80, type: 'ground' },
  { x: 420, y: 420, w: 160, h: 20 },
  { x: 760, y: 360, w: 140, h: 20 },
  { x: 1250, y: 400, w: 120, h: 20 },
  { x: 1710, y: 350, w: 180, h: 20 },
  { x: 2500, y: 410, w: 150, h: 20 },
];

const pipes = [
  { x: 620, y: 390, w: 70, h: 110 },
  { x: 1460, y: 360, w: 70, h: 140 },
  { x: 2860, y: 380, w: 70, h: 120 },
];

const enemies = [
  { x: 920, y: 472, w: 34, h: 28, vx: -1.1, alive: true },
  { x: 1840, y: 472, w: 34, h: 28, vx: -1.0, alive: true },
  { x: 3010, y: 472, w: 34, h: 28, vx: -1.2, alive: true },
];

const coins = [];
for (let i = 0; i < 24; i++) coins.push({ x: 220 + i * 130, y: 250 + (i % 3) * 55, r: 10, got: false });

const goal = { x: 3430, y: 320, w: 16, h: 180 };

function resetPlayer() {
  player.x = 120; player.y = 300; player.vx = 0; player.vy = 0; player.onGround = false;
  world.scrollX = 0;
}

function aabb(a, b) {
  return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
}

function update() {
  if (world.won || world.gameOver) return;
  player.vx = 0;
  if (keys['ArrowLeft']) player.vx = -player.speed;
  if (keys['ArrowRight']) player.vx = player.speed;
  if (keys[' '] && player.onGround) { player.vy = player.jump; player.onGround = false; }

  player.vy += world.gravity;
  player.x += player.vx;
  player.y += player.vy;

  player.onGround = false;

  const solids = [...platforms, ...pipes];
  for (const s of solids) {
    if (!aabb(player, s)) continue;

    const prevY = player.y - player.vy;
    const landed = prevY + player.h <= s.y;
    if (landed && player.vy >= 0) {
      player.y = s.y - player.h;
      player.vy = 0;
      player.onGround = true;
    } else {
      if (player.vx > 0) player.x = s.x - player.w;
      if (player.vx < 0) player.x = s.x + s.w;
    }
  }

  if (player.y > H + 120) loseLife();

  for (const e of enemies) {
    if (!e.alive) continue;
    e.x += e.vx;
    if (e.x < 820 || e.x > world.levelLength - 100) e.vx *= -1;

    const p = { x: player.x, y: player.y, w: player.w, h: player.h };
    if (aabb(p, e)) {
      const stomp = player.vy > 1 && player.y + player.h - 8 < e.y;
      if (stomp) {
        e.alive = false;
        player.vy = -8;
        world.score += 150;
      } else if (player.invincible <= 0) {
        loseLife();
      }
    }
  }

  for (const coin of coins) {
    if (coin.got) continue;
    const dx = player.x + player.w / 2 - coin.x;
    const dy = player.y + player.h / 2 - coin.y;
    if (Math.hypot(dx, dy) < 26) {
      coin.got = true;
      world.score += 50;
    }
  }

  if (player.x + player.w > goal.x && player.y < goal.y + goal.h) {
    world.won = true;
    msgEl.textContent = 'CLEAR! 🎉 (Rで再開)';
  }

  const leftBound = world.scrollX + 220;
  const rightBound = world.scrollX + 620;
  if (player.x > rightBound) world.scrollX = Math.min(player.x - 620, world.levelLength - W);
  if (player.x < leftBound) world.scrollX = Math.max(player.x - 220, 0);

  if (player.invincible > 0) player.invincible--;

  scoreEl.textContent = `SCORE: ${world.score}`;
  livesEl.textContent = `LIVES: ${world.lives}`;
}

function loseLife() {
  world.lives--;
  player.invincible = 90;
  if (world.lives <= 0) {
    world.gameOver = true;
    msgEl.textContent = 'GAME OVER (Rで再開)';
  } else {
    resetPlayer();
  }
}

function drawRect(x, y, w, h, color) {
  ctx.fillStyle = color;
  ctx.fillRect(x - world.scrollX, y, w, h);
}

function draw() {
  ctx.clearRect(0, 0, W, H);
  // sky
  ctx.fillStyle = '#7ec9ff';
  ctx.fillRect(0, 0, W, H);

  // clouds
  ctx.fillStyle = 'rgba(255,255,255,0.85)';
  for (let i = 0; i < 8; i++) {
    const cx = ((i * 360 - world.scrollX * 0.35) % (W + 260)) - 100;
    ctx.beginPath();
    ctx.ellipse(cx, 100 + (i % 2) * 50, 48, 24, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  // ground and platforms
  for (const p of platforms) drawRect(p.x, p.y, p.w, p.h, p.type === 'ground' ? '#6dbf4b' : '#b46b3a');

  // pipes
  for (const p of pipes) {
    drawRect(p.x, p.y, p.w, p.h, '#1f9c44');
    drawRect(p.x - 6, p.y - 12, p.w + 12, 14, '#28b34f');
  }

  // goal
  drawRect(goal.x, goal.y, goal.w, goal.h, '#ddd');
  drawRect(goal.x + 16, goal.y + 8, 34, 22, '#e11d48');

  // coins
  for (const coin of coins) {
    if (coin.got) continue;
    ctx.fillStyle = '#ffd54a';
    ctx.beginPath();
    ctx.arc(coin.x - world.scrollX, coin.y, coin.r, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#b8860b';
    ctx.stroke();
  }

  // enemies
  for (const e of enemies) {
    if (!e.alive) continue;
    drawRect(e.x, e.y, e.w, e.h, '#7c4a25');
    drawRect(e.x + 6, e.y + 20, 6, 6, '#111');
    drawRect(e.x + 22, e.y + 20, 6, 6, '#111');
  }

  // player
  if (!(player.invincible > 0 && Math.floor(player.invincible / 6) % 2 === 0)) {
    drawRect(player.x, player.y, player.w, player.h, '#ef4444');
    drawRect(player.x + 6, player.y + 8, 22, 10, '#b91c1c');
    drawRect(player.x + 8, player.y + 24, 18, 16, '#2563eb');
  }
}

function loop() { update(); draw(); requestAnimationFrame(loop); }

addEventListener('keydown', e => {
  if (['ArrowLeft', 'ArrowRight', ' '].includes(e.key)) e.preventDefault();
  keys[e.key] = true;
  if (e.key.toLowerCase() === 'r') {
    world.score = 0; world.lives = 3; world.won = false; world.gameOver = false;
    msgEl.textContent = '';
    enemies.forEach((e, i) => { e.alive = true; e.x = [920,1840,3010][i]; e.vx = -1 - i * 0.1; });
    coins.forEach(c => c.got = false);
    resetPlayer();
  }
});
addEventListener('keyup', e => keys[e.key] = false);

resetPlayer();
loop();
