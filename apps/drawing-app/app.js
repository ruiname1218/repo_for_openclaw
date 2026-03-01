const canvas = document.getElementById("drawingCanvas");
const ctx = canvas.getContext("2d");

const colorPicker = document.getElementById("colorPicker");
const brushSize = document.getElementById("brushSize");
const brushSizeValue = document.getElementById("brushSizeValue");
const eraserBtn = document.getElementById("eraserBtn");
const undoBtn = document.getElementById("undoBtn");
const redoBtn = document.getElementById("redoBtn");
const clearBtn = document.getElementById("clearBtn");
const downloadBtn = document.getElementById("downloadBtn");

const MAX_HISTORY = 20;
let drawing = false;
let isEraser = false;
let lastX = 0;
let lastY = 0;

const undoStack = [];
const redoStack = [];

function resizeCanvas() {
  const ratio = window.devicePixelRatio || 1;
  const rect = canvas.getBoundingClientRect();

  const prevImage = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const prevWidth = canvas.width;
  const prevHeight = canvas.height;

  canvas.width = Math.floor(rect.width * ratio);
  canvas.height = Math.floor(rect.height * ratio);

  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.scale(ratio, ratio);

  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, rect.width, rect.height);

  if (prevWidth > 0 && prevHeight > 0) {
    const temp = document.createElement("canvas");
    temp.width = prevWidth;
    temp.height = prevHeight;
    temp.getContext("2d").putImageData(prevImage, 0, 0);
    ctx.drawImage(temp, 0, 0, rect.width, rect.height);
  }
}

function getPoint(e) {
  const rect = canvas.getBoundingClientRect();
  const clientX = e.touches ? e.touches[0].clientX : e.clientX;
  const clientY = e.touches ? e.touches[0].clientY : e.clientY;
  return { x: clientX - rect.left, y: clientY - rect.top };
}

function applyBrushStyle() {
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.lineWidth = Number(brushSize.value);
  ctx.strokeStyle = isEraser ? "#ffffff" : colorPicker.value;
}

function pushHistory() {
  if (undoStack.length >= MAX_HISTORY) undoStack.shift();
  undoStack.push(canvas.toDataURL("image/png"));
  redoStack.length = 0;
  updateButtons();
}

function restoreFromDataUrl(dataUrl) {
  const img = new Image();
  img.onload = () => {
    const rect = canvas.getBoundingClientRect();
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, rect.width, rect.height);
    ctx.drawImage(img, 0, 0, rect.width, rect.height);
  };
  img.src = dataUrl;
}

function updateButtons() {
  undoBtn.disabled = undoStack.length <= 1;
  redoBtn.disabled = redoStack.length === 0;
}

function startDraw(e) {
  e.preventDefault();
  const p = getPoint(e);
  drawing = true;
  lastX = p.x;
  lastY = p.y;
  applyBrushStyle();
}

function draw(e) {
  if (!drawing) return;
  e.preventDefault();
  const p = getPoint(e);

  ctx.beginPath();
  ctx.moveTo(lastX, lastY);
  ctx.lineTo(p.x, p.y);
  ctx.stroke();

  lastX = p.x;
  lastY = p.y;
}

function stopDraw(e) {
  if (!drawing) return;
  e.preventDefault();
  drawing = false;
  pushHistory();
}

brushSize.addEventListener("input", () => {
  brushSizeValue.textContent = `${brushSize.value}px`;
});

colorPicker.addEventListener("input", () => {
  if (isEraser) {
    isEraser = false;
    eraserBtn.setAttribute("aria-pressed", "false");
    eraserBtn.textContent = "消しゴム OFF";
  }
});

eraserBtn.addEventListener("click", () => {
  isEraser = !isEraser;
  eraserBtn.setAttribute("aria-pressed", String(isEraser));
  eraserBtn.textContent = isEraser ? "消しゴム ON" : "消しゴム OFF";
});

undoBtn.addEventListener("click", () => {
  if (undoStack.length <= 1) return;
  const current = undoStack.pop();
  redoStack.push(current);
  restoreFromDataUrl(undoStack[undoStack.length - 1]);
  updateButtons();
});

redoBtn.addEventListener("click", () => {
  if (redoStack.length === 0) return;
  const next = redoStack.pop();
  undoStack.push(next);
  restoreFromDataUrl(next);
  updateButtons();
});

clearBtn.addEventListener("click", () => {
  if (!confirm("キャンバスを全消ししますか？")) return;
  const rect = canvas.getBoundingClientRect();
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, rect.width, rect.height);
  pushHistory();
});

downloadBtn.addEventListener("click", () => {
  const link = document.createElement("a");
  link.download = `drawing-${Date.now()}.png`;
  link.href = canvas.toDataURL("image/png");
  link.click();
});

["mousedown", "mousemove", "mouseup", "mouseleave"].forEach((event) => {
  canvas.addEventListener(event, (e) => {
    if (event === "mousedown") startDraw(e);
    if (event === "mousemove") draw(e);
    if (event === "mouseup" || event === "mouseleave") stopDraw(e);
  });
});

["touchstart", "touchmove", "touchend", "touchcancel"].forEach((event) => {
  canvas.addEventListener(
    event,
    (e) => {
      if (event === "touchstart") startDraw(e);
      if (event === "touchmove") draw(e);
      if (event === "touchend" || event === "touchcancel") stopDraw(e);
    },
    { passive: false }
  );
});

window.addEventListener("resize", resizeCanvas);

resizeCanvas();
pushHistory();
