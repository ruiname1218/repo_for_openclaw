const c=document.getElementById('game'),x=c.getContext('2d');
const scoreEl=document.getElementById('score'),livesEl=document.getElementById('lives'),levelEl=document.getElementById('level');
const k={l:false,r:false,f:false};let tl=false,tr=false,tf=false;
const s={score:0,lives:3,level:1,speed:0.5,spawn:900,over:false};
const p={x:430,y:500,w:40,h:24,v:6,cd:0}; const bs=[],es=[]; let last=0;
const stars=Array.from({length:70},()=>({x:Math.random()*c.width,y:Math.random()*c.height,s:Math.random()*2+1}));
const hit=(a,b)=>a.x<b.x+b.w&&a.x+a.w>b.x&&a.y<b.y+b.h&&a.y+a.h>b.y;
function reset(){Object.assign(s,{score:0,lives:3,level:1,speed:0.5,spawn:900,over:false}); p.x=430;p.cd=0;bs.length=0;es.length=0;last=0;}
function spawn(t){if(t-last<s.spawn) return; last=t; const w=34,h=24; es.push({x:Math.random()*(c.width-w),y:-h,w,h,vx:(Math.random()-.5)*1.2,vy:s.speed+Math.random()});}
function upd(dt,t){if(s.over)return; const L=k.l||tl,R=k.r||tr,F=k.f||tf; if(L)p.x-=p.v; if(R)p.x+=p.v; p.x=Math.max(0,Math.min(c.width-p.w,p.x)); if(p.cd>0)p.cd-=dt;
if(F&&p.cd<=0){bs.push({x:p.x+p.w/2-2,y:p.y-10,w:4,h:12,vy:9});p.cd=170}
bs.forEach(b=>b.y-=b.vy); es.forEach(e=>{e.x+=e.vx;e.y+=e.vy;if(e.x<0||e.x+e.w>c.width)e.vx*=-1}); spawn(t);
for(let i=bs.length-1;i>=0;i--)if(bs[i].y+bs[i].h<0)bs.splice(i,1);
for(let i=es.length-1;i>=0;i--){const e=es[i]; if(e.y>c.height){es.splice(i,1); if(--s.lives<=0)s.over=true; continue;} if(hit(p,e)){es.splice(i,1); if(--s.lives<=0)s.over=true; continue;}
for(let j=bs.length-1;j>=0;j--){if(hit(bs[j],e)){bs.splice(j,1);es.splice(i,1);s.score+=100;break;}}}
const nl=Math.min(12,Math.floor(s.score/700)+1); if(nl!==s.level){s.level=nl;s.speed=0.5+(nl-1)*0.18;s.spawn=Math.max(260,900-(nl-1)*55)}
scoreEl.textContent=`SCORE: ${s.score}`; livesEl.textContent=`LIVES: ${s.lives}`; levelEl.textContent=`LEVEL: ${s.level}`;}
function draw(){x.clearRect(0,0,c.width,c.height); x.fillStyle='#060a14'; x.fillRect(0,0,c.width,c.height); x.fillStyle='#9cb7ff'; stars.forEach(st=>{st.y+=st.s*0.16;if(st.y>c.height)st.y=-2;x.fillRect(st.x,st.y,st.s,st.s)});
x.fillStyle='#45b4ff';x.fillRect(p.x,p.y,p.w,p.h);x.fillStyle='#9fe4ff';x.fillRect(p.x+14,p.y-8,12,8);x.fillStyle='#ffe066';bs.forEach(b=>x.fillRect(b.x,b.y,b.w,b.h));
es.forEach(e=>{x.fillStyle='#ff5e74';x.fillRect(e.x,e.y,e.w,e.h)});
if(s.over){x.fillStyle='rgba(0,0,0,.55)';x.fillRect(0,0,c.width,c.height);x.fillStyle='#fff';x.textAlign='center';x.font='bold 42px system-ui';x.fillText('GAME OVER',c.width/2,c.height/2);x.font='18px system-ui';x.fillText('Rで再スタート',c.width/2,c.height/2+34);} }
let prev=performance.now(); function loop(now){const dt=Math.min(33,now-prev);prev=now;upd(dt,now);draw();requestAnimationFrame(loop)} requestAnimationFrame(loop);
addEventListener('keydown',e=>{if(e.key==='ArrowLeft')k.l=true; if(e.key==='ArrowRight')k.r=true; if(e.key===' ') {k.f=true;e.preventDefault();} if((e.key==='r'||e.key==='R')&&s.over)reset();});
addEventListener('keyup',e=>{if(e.key==='ArrowLeft')k.l=false; if(e.key==='ArrowRight')k.r=false; if(e.key===' ')k.f=false;});
const bind=(id,set)=>{const b=document.getElementById(id); const on=e=>{e.preventDefault();set(true)},off=e=>{e.preventDefault();set(false)}; b.addEventListener('touchstart',on,{passive:false});b.addEventListener('touchend',off,{passive:false});b.addEventListener('touchcancel',off,{passive:false});b.addEventListener('mousedown',on);b.addEventListener('mouseup',off);b.addEventListener('mouseleave',off);};
bind('left',v=>tl=v); bind('right',v=>tr=v); bind('fire',v=>tf=v);
reset();
