const DB=[
{c:'japan',q:'鎌倉幕府を開いた人物は？',o:['源頼朝','徳川家康','足利尊氏','織田信長'],a:0,e:'1192年（最近は1185年説も有力）に源頼朝が鎌倉幕府を開いたとされます。'},
{c:'japan',q:'明治維新が始まるきっかけとなった年は？',o:['1853','1868','1877','1894'],a:1,e:'1868年の王政復古・明治新政府成立が大きな転換点です。'},
{c:'japan',q:'大化の改新が起きたのは何世紀？',o:['5世紀','6世紀','7世紀','8世紀'],a:2,e:'645年なので7世紀です。'},
{c:'world',q:'フランス革命が始まった年は？',o:['1776','1789','1815','1848'],a:1,e:'1789年、バスティーユ牢獄襲撃が象徴的事件です。'},
{c:'world',q:'産業革命が最初に本格化した国は？',o:['フランス','アメリカ','ドイツ','イギリス'],a:3,e:'18世紀後半のイギリスで機械化が進展しました。'},
{c:'world',q:'第一次世界大戦の開戦年は？',o:['1905','1914','1918','1939'],a:1,e:'1914年、サラエボ事件を契機に開戦しました。'}
];
const $=s=>document.querySelector(s);
const category=$('#category'),startBtn=$('#startBtn'),quizArea=$('#quizArea');
const progress=$('#progress'),scoreEl=$('#score'),question=$('#question'),choices=$('#choices'),explain=$('#explain'),nextBtn=$('#nextBtn');
let quiz=[],i=0,score=0,locked=false;
const shuffle=a=>a.map(v=>[Math.random(),v]).sort((x,y)=>x[0]-y[0]).map(v=>v[1]);
function render(){const q=quiz[i];progress.textContent=`${i+1} / ${quiz.length}`;scoreEl.textContent=`Score: ${score}`;question.textContent=q.q;choices.innerHTML='';explain.textContent='';nextBtn.classList.add('hidden');locked=false;
q.o.forEach((t,idx)=>{const b=document.createElement('button');b.className='choice';b.textContent=t;b.onclick=()=>pick(idx,b);choices.appendChild(b);});}
function pick(idx,btn){if(locked)return;locked=true;const q=quiz[i];[...choices.children].forEach((b,n)=>{if(n===q.a)b.classList.add('correct');});if(idx===q.a){score++;scoreEl.textContent=`Score: ${score}`;}else btn.classList.add('wrong');explain.textContent=q.e;nextBtn.classList.remove('hidden');}
nextBtn.onclick=()=>{i++;if(i<quiz.length)render();else{question.textContent='学習完了！';choices.innerHTML='';explain.textContent=`最終スコア: ${score} / ${quiz.length}`;nextBtn.classList.add('hidden');}};
startBtn.onclick=()=>{const c=category.value;const src=c==='all'?DB:DB.filter(x=>x.c===c);quiz=shuffle(src).slice(0,5);i=0;score=0;if(!quiz.length)return;quizArea.classList.remove('hidden');render();};
