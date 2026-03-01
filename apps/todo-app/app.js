const KEY='todo-app-items-v1';
const form=document.getElementById('todoForm');
const input=document.getElementById('todoInput');
const list=document.getElementById('todoList');
const empty=document.getElementById('empty');
const clearDone=document.getElementById('clearDone');
const filterButtons=[...document.querySelectorAll('[data-filter]')];

let items=load();
let filter='all';

function load(){
  try{return JSON.parse(localStorage.getItem(KEY)||'[]');}
  catch{return []}
}
function save(){localStorage.setItem(KEY,JSON.stringify(items));}

function render(){
  list.innerHTML='';
  const visible=items.filter(i=>filter==='all'||(filter==='done'?i.done:!i.done));
  empty.style.display=visible.length?'none':'block';

  visible.forEach(item=>{
    const li=document.createElement('li');
    li.className=item.done?'done':'';

    const chk=document.createElement('input');
    chk.type='checkbox'; chk.checked=item.done;
    chk.onchange=()=>{item.done=chk.checked; save(); render();};

    const text=document.createElement('span');
    text.className='text'; text.textContent=item.text;

    const del=document.createElement('button');
    del.className='small danger'; del.textContent='削除';
    del.onclick=()=>{items=items.filter(x=>x.id!==item.id); save(); render();};

    li.append(chk,text,del);
    list.appendChild(li);
  });
}

form.onsubmit=(e)=>{
  e.preventDefault();
  const text=input.value.trim();
  if(!text) return;
  items.unshift({id:Date.now()+Math.random(),text,done:false});
  input.value='';
  save(); render();
};

filterButtons.forEach(btn=>btn.onclick=()=>{
  filter=btn.dataset.filter;
  filterButtons.forEach(b=>b.classList.toggle('active',b===btn));
  render();
});

clearDone.onclick=()=>{
  items=items.filter(i=>!i.done);
  save(); render();
};

render();
