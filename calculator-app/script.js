const displayEl = document.getElementById("display");
const expressionEl = document.getElementById("expression");
const keypad = document.querySelector(".keypad");
const historyList = document.getElementById("historyList");
const clearHistoryBtn = document.getElementById("clearHistory");
const themeToggleBtn = document.getElementById("themeToggle");

const HISTORY_KEY = "calculator_history_v1";
const THEME_KEY = "calculator_theme_v1";

let currentInput = "0";
let expression = "";
let justEvaluated = false;

function render() {
  displayEl.textContent = currentInput;
  expressionEl.textContent = expression || "\u00A0";
}

function formatNumber(value) {
  if (!Number.isFinite(value)) throw new Error("計算エラー");
  return parseFloat(value.toFixed(12)).toString();
}

function safeEvaluate(expr) {
  if (!expr || /[+\-*/.]$/.test(expr)) throw new Error("式が不完全です");
  if (!/^[\d+\-*/.()\s]+$/.test(expr)) throw new Error("無効な式です");

  const result = Function(`"use strict"; return (${expr});`)();

  if (!Number.isFinite(result)) {
    throw new Error("0で割ることはできません");
  }

  if (/\/\s*0+(?:\.0+)?(?!\d)/.test(expr.replace(/\s+/g, ""))) {
    throw new Error("0で割ることはできません");
  }

  return formatNumber(result);
}

function addToHistory(expr, result) {
  const history = JSON.parse(localStorage.getItem(HISTORY_KEY) || "[]");
  history.unshift({ expr, result, ts: Date.now() });
  const capped = history.slice(0, 30);
  localStorage.setItem(HISTORY_KEY, JSON.stringify(capped));
  renderHistory();
}

function renderHistory() {
  const history = JSON.parse(localStorage.getItem(HISTORY_KEY) || "[]");
  historyList.innerHTML = "";

  if (history.length === 0) {
    const li = document.createElement("li");
    li.className = "history-item";
    li.textContent = "履歴はありません";
    historyList.appendChild(li);
    return;
  }

  history.forEach((item) => {
    const li = document.createElement("li");
    li.className = "history-item";
    li.innerHTML = `<span class="expr">${item.expr}</span><strong>${item.result}</strong>`;
    li.title = "クリックで結果を再利用";
    li.addEventListener("click", () => {
      currentInput = item.result;
      expression = "";
      justEvaluated = false;
      render();
    });
    historyList.appendChild(li);
  });
}

function resetAll() {
  currentInput = "0";
  expression = "";
  justEvaluated = false;
  render();
}

function clearEntry() {
  currentInput = "0";
  render();
}

function backspace() {
  if (justEvaluated) {
    resetAll();
    return;
  }
  currentInput = currentInput.length > 1 ? currentInput.slice(0, -1) : "0";
  render();
}

function inputDigit(digit) {
  if (justEvaluated) {
    expression = "";
    currentInput = digit;
    justEvaluated = false;
    render();
    return;
  }
  currentInput = currentInput === "0" ? digit : currentInput + digit;
  render();
}

function inputDecimal() {
  if (justEvaluated) {
    expression = "";
    currentInput = "0.";
    justEvaluated = false;
    render();
    return;
  }
  if (!currentInput.includes(".")) {
    currentInput += ".";
    render();
  }
}

function toggleSign() {
  if (currentInput === "0") return;
  currentInput = currentInput.startsWith("-") ? currentInput.slice(1) : `-${currentInput}`;
  render();
}

function applyPercent() {
  try {
    const val = Number(currentInput);
    if (!Number.isFinite(val)) throw new Error("無効な数値です");
    currentInput = formatNumber(val / 100);
    render();
  } catch (err) {
    showError(err.message);
  }
}

function inputOperator(op) {
  if (justEvaluated) {
    expression = currentInput + ` ${op} `;
    currentInput = "0";
    justEvaluated = false;
    render();
    return;
  }

  if (expression && /[+\-*/]\s$/.test(expression)) {
    expression = expression.replace(/[+\-*/]\s$/, `${op} `);
  } else {
    expression += `${currentInput} ${op} `;
    currentInput = "0";
  }
  render();
}

function evaluate() {
  try {
    const fullExpression = (expression + currentInput).trim();
    const result = safeEvaluate(fullExpression);
    const prettyExpr = fullExpression.replace(/\*/g, "×").replace(/\//g, "÷");

    addToHistory(prettyExpr, result);
    expression = `${prettyExpr} =`;
    currentInput = result;
    justEvaluated = true;
    render();
  } catch (err) {
    showError(err.message || "計算エラー");
  }
}

function showError(message) {
  currentInput = "エラー";
  expression = message;
  justEvaluated = true;
  render();
}

function handleAction(action, value) {
  switch (action) {
    case "digit":
      inputDigit(value);
      break;
    case "decimal":
      inputDecimal();
      break;
    case "operator":
      inputOperator(value);
      break;
    case "equals":
      evaluate();
      break;
    case "ac":
      resetAll();
      break;
    case "c":
      clearEntry();
      break;
    case "backspace":
      backspace();
      break;
    case "sign":
      toggleSign();
      break;
    case "percent":
      applyPercent();
      break;
    default:
      break;
  }
}

keypad.addEventListener("click", (event) => {
  const button = event.target.closest("button");
  if (!button) return;
  handleAction(button.dataset.action, button.dataset.value);
});

document.addEventListener("keydown", (event) => {
  const { key } = event;
  if (/^\d$/.test(key)) return handleAction("digit", key);

  const keyMap = {
    ".": ["decimal"],
    ",": ["decimal"],
    "+": ["operator", "+"],
    "-": ["operator", "-"],
    "*": ["operator", "*"],
    "/": ["operator", "/"],
    Enter: ["equals"],
    "=": ["equals"],
    Backspace: ["backspace"],
    Escape: ["ac"],
    "%": ["percent"],
  };

  if (keyMap[key]) {
    event.preventDefault();
    const [action, value] = keyMap[key];
    handleAction(action, value);
  }
});

clearHistoryBtn.addEventListener("click", () => {
  localStorage.removeItem(HISTORY_KEY);
  renderHistory();
});

themeToggleBtn.addEventListener("click", () => {
  const dark = document.body.classList.toggle("dark");
  localStorage.setItem(THEME_KEY, dark ? "dark" : "light");
  themeToggleBtn.textContent = dark ? "☀️ ライト" : "🌙 ダーク";
});

(function initTheme() {
  const saved = localStorage.getItem(THEME_KEY);
  const shouldDark = saved === "dark";
  document.body.classList.toggle("dark", shouldDark);
  themeToggleBtn.textContent = shouldDark ? "☀️ ライト" : "🌙 ダーク";
})();

render();
renderHistory();
