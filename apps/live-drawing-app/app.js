const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');

const color = document.getElementById('color');
const size = document.getElementById('size');
const sizeVal = document.getElementById('sizeVal');
const eraserBtn = document.getElementById('eraser');
const undoBtn = document.getElementById('undo');
const redoBtn = document.getElementById('redo');
const clearBtn = document.getElementById('clear');
const saveBtn = document.getElementById('save');

const MAX = 20;
const undo = [];
const redo = [];
let drawing = false;
let eraser = false;
let lx = 0, ly = 0;

function fit(){
  const ratio = window.devicePixelRatio || 1;
  const rect = canvas.getBoundingClientRect();
  const snap = canvas.width ? canvas.toDataURL() : null;
  canvas.width = Math.floor(rect.width * ratio);
  canvas.height = Math.floor(rect.height * ratio);
  ctx.setTransform(1,0,0,1,0,0);
  ctx.scale(ratio, ratio);
  ctx.fillStyle = '#fff';
  ctx.fillRect(0,0,rect.width,rect.height);
  if(snap){
    const img = new Image();
    img.onload = ()=> ctx.drawImage(img,0,0,rect.width,rect.height);
    img.src = snap;
  }
}

function point(e){
  const r = canvas.getBoundingClientRect();
  const x = e.touches ? e.touches[0].clientX : e.clientX;
  const y = e.touches ? e.touches[0].clientY : e.clientY;
  return {x: x-r.left, y: y-r.top};
}

function style(){
  ctx.lineCap='round'; ctx.lineJoin='round';
  ctx.lineWidth = Number(size.value);
  ctx.strokeStyle = eraser ? '#fff' : color.value;
}

function push(){
  if(undo.length >= MAX) undo.shift();
  undo.push(canvas.toDataURL('image/png'));
  redo.length = 0;
  undoBtn.disabled = undo.length <= 1;
  redoBtn.disabled = redo.length === 0;
}

function restore(data){
  const img = new Image();
  img.onload = ()=>{
    const r = canvas.getBoundingClientRect();
    ctx.fillStyle='#fff';
    ctx.fillRect(0,0,r.width,r.height);
    ctx.drawImage(img,0,0,r.width,r.height);
  };
  img.src=data;
}

function start(e){
  e.preventDefault();
  const p = point(e);
  drawing = true; lx=p.x; ly=p.y;
  style();
}

function move(e){
  if(!drawing) return;
  e.preventDefault();
  const p = point(e);
  ctx.beginPath();
  ctx.moveTo(lx,ly);
  ctx.lineTo(p.x,p.y);
  ctx.stroke();
  lx=p.x; ly=p.y;
}

function end(e){
  if(!drawing) return;
  e.preventDefault();
  drawing = false;
  push();
}

size.addEventListener('input', ()=> sizeVal.textContent = `${size.value}px`);
eraserBtn.addEventListener('click', ()=>{
  eraser = !eraser;
  eraserBtn.setAttribute('aria-pressed', String(eraser));
  eraserBtn.textContent = eraser ? '消しゴム ON' : '消しゴム OFF';
});
undoBtn.addEventListener('click', ()=>{
  if(undo.length<=1) return;
  redo.push(undo.pop());
  restore(undo[undo.length-1]);
  undoBtn.disabled = undo.length <= 1;
  redoBtn.disabled = redo.length === 0;
});
redoBtn.addEventListener('click', ()=>{
  if(!redo.length) return;
  const d = redo.pop(); undo.push(d); restore(d);
  undoBtn.disabled = undo.length <= 1;
  redoBtn.disabled = redo.length === 0;
});
clearBtn.addEventListener('click', ()=>{
  if(!confirm('全消ししますか？')) return;
  const r = canvas.getBoundingClientRect();
  ctx.fillStyle='#fff';
  ctx.fillRect(0,0,r.width,r.height);
  push();
});
saveBtn.addEventListener('click', ()=>{
  const a = document.createElement('a');
  a.download = `live-drawing-${Date.now()}.png`;
  a.href = canvas.toDataURL('image/png');
  a.click();
});

['mousedown','mousemove','mouseup','mouseleave'].forEach(ev=>
  canvas.addEventListener(ev, e=>({mousedown:start,mousemove:move,mouseup:end,mouseleave:end}[ev](e)))
);
['touchstart','touchmove','touchend','touchcancel'].forEach(ev=>
  canvas.addEventListener(ev, e=>({touchstart:start,touchmove:move,touchend:end,touchcancel:end}[ev](e)), {passive:false})
);

window.addEventListener('resize', fit);
fit();
push();
