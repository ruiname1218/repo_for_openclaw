const KEY = 'todo-app-items-v1'
const listEl = document.getElementById('todo-list')
const formEl = document.getElementById('todo-form')
const inputEl = document.getElementById('todo-input')
const metaEl = document.getElementById('meta')
const clearDoneBtn = document.getElementById('clear-done')
const filterButtons = [...document.querySelectorAll('[data-filter]')]

let filter = 'all'
let items = load()

function load() {
  try { return JSON.parse(localStorage.getItem(KEY) || '[]') } catch { return [] }
}
function save() { localStorage.setItem(KEY, JSON.stringify(items)) }

function render() {
  const visible = items.filter(item => filter === 'all' ? true : filter === 'done' ? item.done : !item.done)
  listEl.innerHTML = ''

  for (const item of visible) {
    const li = document.createElement('li')
    li.className = 'todo-item'

    const left = document.createElement('div')
    left.className = 'todo-left'

    const checkbox = document.createElement('input')
    checkbox.type = 'checkbox'
    checkbox.checked = item.done
    checkbox.addEventListener('change', () => toggle(item.id))

    const text = document.createElement('span')
    text.className = `todo-text ${item.done ? 'done' : ''}`
    text.textContent = item.text

    left.append(checkbox, text)

    const del = document.createElement('button')
    del.className = 'small'
    del.textContent = '削除'
    del.addEventListener('click', () => remove(item.id))

    li.append(left, del)
    listEl.appendChild(li)
  }

  const done = items.filter(i => i.done).length
  metaEl.textContent = `全${items.length}件 / 完了${done}件 / 未完了${items.length - done}件`
}

function add(text) {
  items.unshift({ id: crypto.randomUUID(), text, done: false })
  save(); render()
}
function toggle(id) {
  items = items.map(i => i.id === id ? { ...i, done: !i.done } : i)
  save(); render()
}
function remove(id) {
  items = items.filter(i => i.id !== id)
  save(); render()
}
function clearDone() {
  items = items.filter(i => !i.done)
  save(); render()
}

formEl.addEventListener('submit', (e) => {
  e.preventDefault()
  const text = inputEl.value.trim()
  if (!text) return
  add(text)
  inputEl.value = ''
  inputEl.focus()
})

clearDoneBtn.addEventListener('click', clearDone)
filterButtons.forEach(btn => {
  btn.addEventListener('click', () => {
    filter = btn.dataset.filter
    filterButtons.forEach(b => b.classList.toggle('active', b === btn))
    render()
  })
})

render()
