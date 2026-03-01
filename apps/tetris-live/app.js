const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const scoreEl = document.getElementById('score');
const linesEl = document.getElementById('lines');
const levelEl = document.getElementById('level');

const COLS = 10, ROWS = 20, SIZE = 30;
const COLORS = ['#000','#5cc8ff','#ffd166','#b197fc','#7ae582','#ff6b6b','#fca311','#9ef01a'];
const SHAPES = [
  [],
  [[1,1,1,1]],                 // I
  [[2,2],[2,2]],               // O
  [[0,3,0],[3,3,3]],           // T
  [[0,4,4],[4,4,0]],           // S
  [[5,5,0],[0,5,5]],           // Z
  [[6,0,0],[6,6,6]],           // J
  [[0,0,7],[7,7,7]],           // L
];

let board, piece, nextDrop, dropInterval, score, lines, level, over, paused;

function reset(){
  board = Array.from({length: ROWS}, () => Array(COLS).fill(0));
  score = 0; lines = 0; level = 1; over = false; paused = false;
  dropInterval = 800; nextDrop = performance.now() + dropInterval;
  spawn();
  updateHUD();
}

function randPiece(){
  const type = 1 + (Math.random()*7|0);
  return { x: 3, y: 0, shape: SHAPES[type].map(r=>[...r]) };
}

function spawn(){
  piece = randPiece();
  if (collide(piece.x, piece.y, piece.shape)) over = true;
}

function collide(px, py, shape){
  for(let y=0;y<shape.length;y++) for(let x=0;x<shape[y].length;x++){
    if(!shape[y][x]) continue;
    const nx = px + x, ny = py + y;
    if(nx<0 || nx>=COLS || ny>=ROWS) return true;
    if(ny>=0 && board[ny][nx]) return true;
  }
  return false;
}

function merge(){
  piece.shape.forEach((row,y)=>row.forEach((v,x)=>{ if(v) board[piece.y+y][piece.x+x]=v; }));
}

function rotate(shape){
  return shape[0].map((_,i)=>shape.map(row=>row[i]).reverse());
}

function tryMove(dx,dy){
  if(!collide(piece.x+dx,piece.y+dy,piece.shape)){ piece.x+=dx; piece.y+=dy; return true; }
  return false;
}

function hardDrop(){ while(tryMove(0,1)){} tickLock(); }

function tickLock(){
  merge();
  let cleared = 0;
  for(let y=ROWS-1;y>=0;y--){
    if(board[y].every(v=>v)){ board.splice(y,1); board.unshift(Array(COLS).fill(0)); cleared++; y++; }
  }
  if(cleared){
    lines += cleared;
    score += [0,100,300,500,800][cleared] * level;
    level = 1 + Math.floor(lines/10);
    dropInterval = Math.max(90, 800 - (level-1)*65);
  }
  spawn();
  updateHUD();
}

function updateHUD(){ scoreEl.textContent=score; linesEl.textContent=lines; levelEl.textContent=level; }

function drawCell(x,y,v){
  ctx.fillStyle = COLORS[v];
  ctx.fillRect(x*SIZE,y*SIZE,SIZE,SIZE);
  ctx.strokeStyle = '#0a1022';
  ctx.strokeRect(x*SIZE,y*SIZE,SIZE,SIZE);
}

function draw(){
  ctx.clearRect(0,0,canvas.width,canvas.height);
  board.forEach((row,y)=>row.forEach((v,x)=> v && drawCell(x,y,v)));
  if(piece){ piece.shape.forEach((row,y)=>row.forEach((v,x)=>{ if(v) drawCell(piece.x+x,piece.y+y,v); })); }

  if(over || paused){
    ctx.fillStyle='rgba(0,0,0,.55)'; ctx.fillRect(0,0,canvas.width,canvas.height);
    ctx.fillStyle='#fff'; ctx.textAlign='center'; ctx.font='bold 30px system-ui';
    ctx.fillText(over?'GAME OVER':'PAUSED', canvas.width/2, canvas.height/2);
    ctx.font='16px system-ui';
    ctx.fillText(over?'Rで再スタート':'Pで再開', canvas.width/2, canvas.height/2 + 34);
  }
}

function step(now){
  if(!over && !paused && now >= nextDrop){
    if(!tryMove(0,1)) tickLock();
    nextDrop = now + dropInterval;
  }
  draw();
  requestAnimationFrame(step);
}

addEventListener('keydown', e=>{
  if(e.key==='r' || e.key==='R'){ reset(); return; }
  if(over) return;
  if(e.key==='p' || e.key==='P'){ paused=!paused; return; }
  if(paused) return;
  if(e.key==='ArrowLeft') tryMove(-1,0);
  if(e.key==='ArrowRight') tryMove(1,0);
  if(e.key==='ArrowDown'){ if(tryMove(0,1)) score += 1; updateHUD(); }
  if(e.key===' '){ e.preventDefault(); hardDrop(); }
  if(e.key==='ArrowUp'){
    const r = rotate(piece.shape);
    if(!collide(piece.x,piece.y,r)) piece.shape = r;
  }
});

function bind(id, fn){
  const b=document.getElementById(id); if(!b) return;
  b.addEventListener('click', ()=>{ if(!over && !paused) fn(); });
}
bind('left', ()=>tryMove(-1,0));
bind('right', ()=>tryMove(1,0));
bind('down', ()=>{ if(tryMove(0,1)) {score+=1; updateHUD();} });
bind('rot', ()=>{ const r=rotate(piece.shape); if(!collide(piece.x,piece.y,r)) piece.shape=r; });
bind('drop', hardDrop);

reset();
requestAnimationFrame(step);
