const STORAGE_KEY = "kakeibo_entries_v1";
const THEME_KEY = "kakeibo_theme";

const DEFAULT_CATEGORIES = {
  expense: ["食費", "日用品", "交通費", "住居費", "光熱費", "通信費", "医療費", "交際費", "教育", "娯楽", "その他"],
  income: ["給与", "副業", "賞与", "臨時収入", "その他"],
};

const els = {
  form: document.getElementById("entryForm"),
  entryId: document.getElementById("entryId"),
  type: document.getElementById("type"),
  date: document.getElementById("date"),
  category: document.getElementById("category"),
  memo: document.getElementById("memo"),
  amount: document.getElementById("amount"),
  saveBtn: document.getElementById("saveBtn"),
  cancelEditBtn: document.getElementById("cancelEditBtn"),
  targetMonth: document.getElementById("targetMonth"),
  sumIncome: document.getElementById("sumIncome"),
  sumExpense: document.getElementById("sumExpense"),
  sumBalance: document.getElementById("sumBalance"),
  breakdownList: document.getElementById("breakdownList"),
  tbody: document.getElementById("entryTableBody"),
  rowTemplate: document.getElementById("rowTemplate"),
  exportCsvBtn: document.getElementById("exportCsvBtn"),
  importCsvInput: document.getElementById("importCsvInput"),
  themeToggle: document.getElementById("themeToggle"),
};

let entries = loadEntries();

init();

function init() {
  setDefaultDate();
  setDefaultMonth();
  applySavedTheme();
  refreshCategoryOptions();
  renderAll();

  els.type.addEventListener("change", refreshCategoryOptions);

  els.form.addEventListener("submit", onSubmitEntry);
  els.cancelEditBtn.addEventListener("click", resetForm);
  els.targetMonth.addEventListener("change", renderAll);

  els.exportCsvBtn.addEventListener("click", exportCsv);
  els.importCsvInput.addEventListener("change", importCsv);

  els.themeToggle.addEventListener("click", toggleTheme);
}

function setDefaultDate() {
  if (!els.date.value) {
    els.date.value = toDateInputValue(new Date());
  }
}

function setDefaultMonth() {
  const now = new Date();
  const month = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  els.targetMonth.value = month;
}

function toDateInputValue(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function refreshCategoryOptions() {
  const list = DEFAULT_CATEGORIES[els.type.value];
  els.category.innerHTML = "";
  list.forEach((c) => {
    const opt = document.createElement("option");
    opt.value = c;
    opt.textContent = c;
    els.category.appendChild(opt);
  });
}

function onSubmitEntry(e) {
  e.preventDefault();

  const entry = {
    id: els.entryId.value || crypto.randomUUID(),
    type: els.type.value,
    date: els.date.value,
    category: els.category.value,
    memo: els.memo.value.trim(),
    amount: Number(els.amount.value),
  };

  if (!entry.date || !entry.category || !entry.amount || entry.amount < 1) {
    alert("入力内容を確認してください。");
    return;
  }

  const idx = entries.findIndex((x) => x.id === entry.id);
  if (idx >= 0) {
    entries[idx] = entry;
  } else {
    entries.push(entry);
  }

  saveEntries();
  resetForm();
  renderAll();
}

function resetForm() {
  els.entryId.value = "";
  els.saveBtn.textContent = "追加";
  els.cancelEditBtn.hidden = true;
  els.form.reset();
  els.type.value = "expense";
  refreshCategoryOptions();
  setDefaultDate();
}

function renderAll() {
  renderTable();
  renderSummary();
}

function renderTable() {
  const sorted = [...entries].sort((a, b) => b.date.localeCompare(a.date));
  els.tbody.innerHTML = "";

  for (const entry of sorted) {
    const row = els.rowTemplate.content.firstElementChild.cloneNode(true);
    row.querySelector('[data-k="date"]').textContent = entry.date;
    row.querySelector('[data-k="type"]').textContent = entry.type === "income" ? "収入" : "支出";
    row.querySelector('[data-k="category"]').textContent = entry.category;
    row.querySelector('[data-k="memo"]').textContent = entry.memo || "-";
    row.querySelector('[data-k="amount"]').textContent = formatYen(entry.amount);

    row.querySelector(".edit").addEventListener("click", () => startEdit(entry.id));
    row.querySelector(".delete").addEventListener("click", () => removeEntry(entry.id));

    els.tbody.appendChild(row);
  }
}

function renderSummary() {
  const month = els.targetMonth.value;
  const monthEntries = entries.filter((e) => e.date.startsWith(month));

  const income = sumByType(monthEntries, "income");
  const expense = sumByType(monthEntries, "expense");
  const balance = income - expense;

  els.sumIncome.textContent = formatYen(income);
  els.sumExpense.textContent = formatYen(expense);
  els.sumBalance.textContent = formatYen(balance);

  const expenseByCat = {};
  monthEntries
    .filter((e) => e.type === "expense")
    .forEach((e) => {
      expenseByCat[e.category] = (expenseByCat[e.category] || 0) + e.amount;
    });

  const sorted = Object.entries(expenseByCat).sort((a, b) => b[1] - a[1]);
  els.breakdownList.innerHTML = "";

  if (sorted.length === 0) {
    const li = document.createElement("li");
    li.textContent = "データがありません。";
    els.breakdownList.appendChild(li);
    return;
  }

  for (const [cat, amount] of sorted) {
    const li = document.createElement("li");
    li.textContent = `${cat}: ${formatYen(amount)}`;
    els.breakdownList.appendChild(li);
  }
}

function sumByType(list, type) {
  return list.filter((e) => e.type === type).reduce((sum, e) => sum + e.amount, 0);
}

function startEdit(id) {
  const e = entries.find((x) => x.id === id);
  if (!e) return;

  els.entryId.value = e.id;
  els.type.value = e.type;
  refreshCategoryOptions();
  els.date.value = e.date;
  els.category.value = e.category;
  els.memo.value = e.memo;
  els.amount.value = String(e.amount);
  els.saveBtn.textContent = "更新";
  els.cancelEditBtn.hidden = false;
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function removeEntry(id) {
  const ok = confirm("この明細を削除しますか？");
  if (!ok) return;

  entries = entries.filter((e) => e.id !== id);
  saveEntries();
  renderAll();
}

function loadEntries() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveEntries() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
}

function formatYen(num) {
  return new Intl.NumberFormat("ja-JP", { style: "currency", currency: "JPY", maximumFractionDigits: 0 }).format(num);
}

function exportCsv() {
  const header = ["id", "type", "date", "category", "memo", "amount"];
  const rows = entries.map((e) => [e.id, e.type, e.date, e.category, e.memo, String(e.amount)]);
  const csv = [header, ...rows]
    .map((row) => row.map(csvEscape).join(","))
    .join("\n");

  const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `kakeibo-${els.targetMonth.value || "all"}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

function importCsv(ev) {
  const file = ev.target.files?.[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = () => {
    try {
      const text = String(reader.result || "").replace(/^\uFEFF/, "");
      const parsed = parseCsv(text);
      if (parsed.length === 0) throw new Error("empty");

      const imported = [];
      for (const row of parsed) {
        const [id, type, date, category, memo, amount] = row;
        if (!["income", "expense"].includes(type)) continue;
        const num = Number(amount);
        if (!date || !category || !Number.isFinite(num) || num < 1) continue;

        imported.push({
          id: id || crypto.randomUUID(),
          type,
          date,
          category,
          memo: memo || "",
          amount: num,
        });
      }

      if (imported.length === 0) {
        alert("有効なデータが見つかりませんでした。");
      } else {
        const map = new Map(entries.map((e) => [e.id, e]));
        imported.forEach((e) => map.set(e.id, e));
        entries = [...map.values()];
        saveEntries();
        renderAll();
        alert(`${imported.length}件をインポートしました。`);
      }
    } catch {
      alert("CSVの読み込みに失敗しました。形式を確認してください。");
    } finally {
      els.importCsvInput.value = "";
    }
  };
  reader.readAsText(file);
}

function csvEscape(v) {
  const s = String(v ?? "");
  if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

function parseCsv(text) {
  const rows = [];
  let row = [];
  let cell = "";
  let inQuote = false;

  const pushCell = () => { row.push(cell); cell = ""; };
  const pushRow = () => {
    if (row.length > 0 || cell.length > 0) {
      pushCell();
      rows.push(row);
      row = [];
    }
  };

  for (let i = 0; i < text.length; i++) {
    const ch = text[i];

    if (inQuote) {
      if (ch === '"' && text[i + 1] === '"') {
        cell += '"';
        i++;
      } else if (ch === '"') {
        inQuote = false;
      } else {
        cell += ch;
      }
      continue;
    }

    if (ch === '"') inQuote = true;
    else if (ch === ",") pushCell();
    else if (ch === "\n") pushRow();
    else if (ch !== "\r") cell += ch;
  }
  pushRow();

  if (rows.length && rows[0].join(",").toLowerCase().includes("id,type,date")) {
    rows.shift();
  }
  return rows;
}

function applySavedTheme() {
  const isDark = localStorage.getItem(THEME_KEY) === "dark";
  setTheme(isDark ? "dark" : "light");
}

function toggleTheme() {
  const next = document.body.classList.contains("dark") ? "light" : "dark";
  setTheme(next);
}

function setTheme(theme) {
  document.body.classList.toggle("dark", theme === "dark");
  localStorage.setItem(THEME_KEY, theme);
  els.themeToggle.textContent = theme === "dark" ? "☀️ ライトモード" : "🌙 ダークモード";
}
