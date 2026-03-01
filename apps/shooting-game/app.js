const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const scoreEl = document.getElementById('score');
const livesEl = document.getElementById('lives');
const levelEl = document.getElementById('level');
const overlay = document.getElementById('overlay');
const overlayTitle = document.getElementById('overlayTitle');
const overlayText = document.getElementById('overlayText');
const restartBtn = document.getElementById('restartBtn');

const keys = { left: false, right: false, fire: false };
let touchLeft = false, touchRight = false, touchFire = false;

const state = {
  score: 0,
  lives: 3,
  level: 1,
  over: false,
  win: false,
  enemySpeed: 0.45,
  spawnMs: 900,
};

const player = { x: canvas.width/2-20, y: canvas.height-70, w: 40, h: 24, speed: 6, cooldown: 0 };
const bullets = [];
const enemies = [];
const stars = Array.from({length:70},()=>({x:Math.random()*canvas.width,y:Math.random()*canvas.height,s:Math.random()*2+1}));
let lastSpawn = 0;

function reset() {
  state.score = 0; state.lives = 3; state.level = 1; state.over = false; state.win = false;
  state.enemySpeed = 0.45; state.spawnMs = 900;
  player.x = canvas.width/2-20; player.cooldown = 0;
  bullets.length = 0; enemies.length = 0; lastSpawn = 0;
  overlay.classList.add('hidden');
}

function rectHit(a,b){
  return a.x < b.x+b.w && a.x+a.w > b.x && a.y < b.y+b.h && a.y+a.h > b.y;
}

function spawnEnemy(t){
  if (t-lastSpawn < state.spawnMs) return;
  lastSpawn = t;
  const w = 34, h = 24;
  enemies.push({x:Math.random()*(canvas.width-w),y:-h,w,h,vx:(Math.random()-.5)*1.1,vy:state.enemySpeed + Math.random()*0.9});
}

function update(dt, t){
  if(state.over) return;

  const movingLeft = keys.left || touchLeft;
  const movingRight = keys.right || touchRight;
  const firing = keys.fire || touchFire;

  if(movingLeft) player.x -= player.speed;
  if(movingRight) player.x += player.speed;
  player.x = Math.max(0, Math.min(canvas.width-player.w, player.x));

  if(player.cooldown>0) player.cooldown -= dt;
  if(firing && player.cooldown<=0){
    bullets.push({x:player.x+player.w/2-2,y:player.y-8,w:4,h:12,vy:8.8});
    player.cooldown = 180;
  }

  for(const b of bullets) b.y -= b.vy;
  for(const e of enemies){
    e.x += e.vx; e.y += e.vy;
    if(e.x<0 || e.x+e.w>canvas.width) e.vx *= -1;
  }

  spawnEnemy(t);

  for(let i=bullets.length-1;i>=0;i--){
    const b = bullets[i];
    if(b.y + b.h < 0) bullets.splice(i,1);
  }

  for(let i=enemies.length-1;i>=0;i--){
    const e = enemies[i];

    if(e.y > canvas.height){
      enemies.splice(i,1);
      state.lives--;
      if(state.lives<=0) endGame(false);
      continue;
    }

    if(rectHit(player,e)){
      enemies.splice(i,1);
      state.lives--;
      if(state.lives<=0) endGame(false);
      continue;
    }

    for(let j=bullets.length-1;j>=0;j--){
      if(rectHit(bullets[j],e)){
        bullets.splice(j,1);
        enemies.splice(i,1);
        state.score += 100;
        break;
      }
    }
  }

  const newLevel = Math.min(12, Math.floor(state.score/700)+1);
  if(newLevel !== state.level){
    state.level = newLevel;
    state.enemySpeed = 0.45 + (state.level-1)*0.18;
    state.spawnMs = Math.max(260, 900 - (state.level-1)*55);
  }

  if(state.score >= 9000) endGame(true);

  scoreEl.textContent = `SCORE: ${state.score}`;
  livesEl.textContent = `LIVES: ${state.lives}`;
  levelEl.textContent = `LEVEL: ${state.level}`;
}

function endGame(win){
  state.over = true;
  state.win = win;
  overlayTitle.textContent = win ? 'YOU WIN 🎉' : 'GAME OVER';
  overlayText.textContent = `Final Score: ${state.score}`;
  overlay.classList.remove('hidden');
}

function draw(){
  ctx.clearRect(0,0,canvas.width,canvas.height);

  ctx.fillStyle = '#050812';
  ctx.fillRect(0,0,canvas.width,canvas.height);
  ctx.fillStyle = '#9fb7ff';
  for(const s of stars){
    s.y += s.s*0.15; if(s.y>canvas.height) s.y = -3;
    ctx.fillRect(s.x,s.y,s.s,s.s);
  }

  ctx.fillStyle = '#43b0ff';
  ctx.fillRect(player.x,player.y,player.w,player.h);
  ctx.fillStyle = '#a8e1ff';
  ctx.fillRect(player.x+14,player.y-8,12,8);

  ctx.fillStyle = '#ffd84d';
  bullets.forEach(b => ctx.fillRect(b.x,b.y,b.w,b.h));

  enemies.forEach(e=>{
    ctx.fillStyle = '#ff5b6e';
    ctx.fillRect(e.x,e.y,e.w,e.h);
    ctx.fillStyle = '#ffd3da';
    ctx.fillRect(e.x+6,e.y+6,6,4);
    ctx.fillRect(e.x+e.w-12,e.y+6,6,4);
  });
}

let last = performance.now();
function loop(now){
  const dt = Math.min(33, now-last); last = now;
  update(dt, now);
  draw();
  requestAnimationFrame(loop);
}
requestAnimationFrame(loop);

addEventListener('keydown', e=>{
  if(e.key==='ArrowLeft') keys.left = true;
  if(e.key==='ArrowRight') keys.right = true;
  if(e.key===' ') { keys.fire = true; e.preventDefault(); }
});
addEventListener('keyup', e=>{
  if(e.key==='ArrowLeft') keys.left = false;
  if(e.key==='ArrowRight') keys.right = false;
  if(e.key===' ') keys.fire = false;
});

function bindTouch(id, setter){
  const el = document.getElementById(id);
  const on = (ev)=>{ev.preventDefault(); setter(true);} ;
  const off = (ev)=>{ev.preventDefault(); setter(false);} ;
  el.addEventListener('touchstart', on, {passive:false});
  el.addEventListener('touchend', off, {passive:false});
  el.addEventListener('touchcancel', off, {passive:false});
  el.addEventListener('mousedown', on);
  el.addEventListener('mouseup', off);
  el.addEventListener('mouseleave', off);
}
bindTouch('leftBtn',v=>touchLeft=v);
bindTouch('rightBtn',v=>touchRight=v);
bindTouch('fireBtn',v=>touchFire=v);

restartBtn.addEventListener('click', reset);
reset();
