/* ================= Спидран ================= */
const SR_DAYS = [
 {day:1, boss:"Жирный Килобайт", topic:"Биты, байты и системы счисления", spr:"kb"},
 {day:2, boss:"Шифровальщик", topic:"Кодирование информации", spr:"lock"},
 {day:3, boss:"Баг, жук в коде", topic:"Python: переменные и типы", spr:"bug"},
 {day:4, boss:"Бесконечный Цикл", topic:"Python: условия и циклы", spr:"loop"},
 {day:5, boss:"ЕГЭ-босс", topic:"Финал: задания в духе ЕГЭ", spr:"ege", final:true}
];
const SPR = {
 kb:["...PPPP...","..PPPPPP..",".PPPPPPPP.","PPWNPPWNPP","PPWNPPWNPP","PPPPPPPPPP","PPPLLLLPPP","PPPPPPPPPP",".PPPPPPPP.","..PP..PP.."],
 lock:["...WWWW...","..W....W..","..W....W..",".LLLLLLLL.",".LWNLLWNL.",".LLLLLLLL.",".LLLNNLLL.",".LLLNNLLL.",".LLLLLLLL.",".........."],
 bug:["..W....W..","...W..W...","..KKKKKK..","WKKWKKWKKW",".KKNKKNKK.","WKKKKKKKKW",".KKKNNKKK.","WKKKKKKKKW","..KKKKKK..","...W..W..."],
 loop:["..........","..........",".LLL..LLL.","L...LL...L","L.W.LL.W.L","L...LL...L",".LLL..LLL.","..........","..........",".........."],
 ege:[".L..L..L..",".LL.LL.LL.",".LLLLLLLL.",".PPPPPPPP.","PPWNPPWNPP","PPPPPPPPPP","PPNNNNNNPP","PPPPPPPPPP",".PPPPPPPP.",".........."]
};
const SPR_C = {P:"#8e6bff",L:"#ecf141",W:"#f3f2ff",N:"#262b69",K:"#ff6b9a"};
function sprite(name){ let r=""; SPR[name].forEach((row,y)=>[...row].forEach((c,x)=>{ if(c!==".") r+='<rect x="'+x+'" y="'+y+'" width="1" height="1" fill="'+SPR_C[c]+'"/>'; }));
  return '<svg viewBox="0 0 10 10" shape-rendering="crispEdges" aria-hidden="true">'+r+'</svg>'; }

function loadScript(src){ return new Promise((ok,fail)=>{ const s=document.createElement("script"); s.src=src; s.onload=ok; s.onerror=fail; document.head.appendChild(s); }); }

/* --- связь с сервером --- */
async function api(action, payload, tries){
  if(!API_URL) return demoApi(action, payload||{});
  const body=JSON.stringify(Object.assign({action, initData:(tg&&tg.initData)||""}, payload||{}));
  let lastErr;
  for(let i=0;i<(tries||3);i++){
    try{
      const r=await fetch(API_URL,{method:"POST",body,headers:{"Content-Type":"text/plain;charset=utf-8"}});
      const j=await r.json(); if(j.error) throw Object.assign(new Error(j.error),{server:true}); return j;
    }catch(e){ lastErr=e; if(e.server) break; if(i+1<(tries||3)) await new Promise(res=>setTimeout(res,tries?2000:700*(i+1))); }
  }
  throw lastErr;
}

/* --- демо-режим: тот же протокол, но всё в памяти страницы --- */
const DEMO={ prog:{}, rivals:[["Даня К.",230],["Алиса",210],["Max_coder",180],["Соня В.",150],["Тимур",120],["Ева",90],["Артём",60],["Лиза П.",40],["Гоша",20],["Вика",10],["Рома",10]] };
function demoQ(day,n){ const q=(window.SPEEDRUN_Q||[]).find(x=>x.day===day&&x.n===n); return q&&Object.assign({type:q.type,out:q.out,ege:q.ege},q.v[0]); }
function demoTotal(){ let t=0; Object.values(DEMO.prog).forEach(d=>Object.values(d).forEach(a=>t+=a.pts)); return t; }
function demoApi(action,p){
  return new Promise(res=>setTimeout(()=>{
    const Q=window.SPEEDRUN_Q||[];
    if(action==="state"){
      const me={name:(TG_USER&&TG_USER.first_name)||"Ты",total:demoTotal()};
      const all=DEMO.rivals.map(r=>({name:r[0],total:r[1]})).concat([Object.assign({me:true},me)]).sort((a,b)=>b.total-a.total);
      me.rank=me.total?all.findIndex(r=>r.me)+1:0;
      res({ me, players:all.length, endsAt:new Date(2026,10,1,23,59).getTime(), leaders:all.filter(r=>r.total>0||r.me).slice(0,10),
        days:SR_DAYS.map(d=>{ const pr=DEMO.prog[d.day]||{}; return {day:d.day,open:true,closed:false,opensAt:0,total:Q.filter(q=>q.day===d.day).length,answered:Object.keys(pr).length,score:Object.values(pr).reduce((s,a)=>s+a.pts,0)}; }) });
    } else if(action==="start"){
      const pr=DEMO.prog[p.day]||{};
      res({day:p.day,questions:Q.filter(q=>q.day===p.day).map(q=>{ const v=demoQ(q.day,q.n); const it={n:q.n,type:v.type,text:v.text,code:v.code||"",out:!!v.out};
        if(v.type!=="num") it.opts=v.opts.slice().sort(()=>Math.random()-.5);
        if(pr[q.n]) it.done={choice:pr[q.n].c,ok:pr[q.n].ok,correct:v.opts[0],explain:v.explain,ege:v.ege}; return it; })});
    } else if(action==="answer"){
      const v=demoQ(p.day,p.n); const pr=DEMO.prog[p.day]=DEMO.prog[p.day]||{};
      const norm=s=>String(s).trim().replace(",",".").toLowerCase();
      let ok=norm(p.choice)===norm(v.opts[0]), pts=ok?(p.day===5?20:10):0;
      if(pr[p.n]){ ok=pr[p.n].ok; pts=0; } else pr[p.n]={c:p.choice,ok,pts};
      res({ok,points:pts,correct:v.opts[0],explain:v.explain,ege:v.ege,total:demoTotal()});
    }
  },250));
}

/* --- экран раздела --- */
let SR_STATE=null;
function fmtLeft(ms){ if(ms<=0) return ["0","игра окончена"]; const d=Math.floor(ms/864e5), h=Math.floor(ms%864e5/36e5), m=Math.floor(ms%36e5/6e4);
  return d?[String(d),plural(d,"день","дня","дней")+" до финиша"]:h?[String(h),plural(h,"час","часа","часов")+" до финиша"]:[String(m),"мин. до финиша"]; }
function fmtOpen(ts){ const d=new Date(ts); return d.toLocaleDateString("ru-RU",{day:"numeric",month:"long"}); }
async function renderSpeed(app){
  const box=h("div",{style:"display:flex;flex-direction:column;gap:20px"}); app.appendChild(box);
  if(API_URL && !(tg && tg.initData)){
    box.appendChild(srHero(null));
    box.appendChild(h("div",{class:"sr-note"},"<b>Игра работает внутри Telegram.</b> Открой её через нашего бота: так мы узнаем тебя и запишем очки в таблицу лидеров."));
    return;
  }
  box.appendChild(h("div",{class:"sr-loading"},"<i></i>Загружаем забег"));
  if(!API_URL && !window.SPEEDRUN_Q) await loadScript("js/demo-questions.js").catch(()=>{});
  let st;
  try{ st=await api("state"); }catch(e){ box.innerHTML=""; box.appendChild(h("div",{class:"sr-note"},"<b>Не получилось загрузить игру.</b> "+esc(e.message||"Проверь интернет")+". ")); const b=h("button",{class:"reset",type:"button"},"Попробовать снова"); b.onclick=render; box.appendChild(b); return; }
  if(S.tab!=="speed") return;
  SR_STATE=st; box.innerHTML="";
  box.appendChild(srHero(st));
  if(!API_URL) box.appendChild(h("p",{class:"note"},"Демо-режим: все уровни открыты, соперники выдуманные. В Telegram игра работает с настоящей таблицей."));
  box.appendChild(h("h2",{class:"sr-h"},"Уровни"));
  const lv=h("div",{class:"sr-levels"});
  st.days.forEach(d=>{
    const meta=SR_DAYS[d.day-1], done=d.total&&d.answered>=d.total, started=d.answered>0;
    const cls="sr-lvl"+(meta.final?" boss":"")+(!d.open?" locked":done?" done":" open");
    const chip=!d.open?"Откроется "+fmtOpen(d.opensAt):done?d.score+" очков":started?d.answered+" из "+d.total+" · дальше":d.closed?"Закрыт":"Играть";
    const b=h("button",{class:cls,type:"button"},'<span class="spr">'+sprite(meta.spr)+'</span><span class="t"><small>'+(meta.final?"Финальный босс":"Уровень "+d.day)+'</small><b>'+meta.boss+'</b><span>'+meta.topic+'</span></span><span class="sr-chip">'+chip+'</span>');
    b.onclick=()=>{ if(!d.open) toast("Уровень откроется "+fmtOpen(d.opensAt)); else if(done) toast("Уровень пройден: "+d.score+" очков. Ответы засчитываются один раз."); else if(d.closed) toast("Игра завершена"); else startSpeedLevel(d.day); };
    lv.appendChild(b);
  });
  box.appendChild(lv);
  box.appendChild(h("h2",{class:"sr-h"},"Таблица лидеров"));
  const bd=h("div",{class:"sr-board"});
  bd.appendChild(h("div",{class:"sr-prize"},"Топ-3 получат скидку на курс «Спидран»"));
  if(!st.leaders.length) bd.appendChild(h("div",{class:"sr-row gap"},"Пока никто не набрал очков. Стань первым!"));
  st.leaders.forEach((r,i)=>bd.appendChild(h("div",{class:"sr-row"+(i<3?" top p"+(i+1):"")+(r.me?" me":"")},'<span class="pos">'+(i+1)+'</span><span class="nm">'+esc(r.name)+(r.me?" (ты)":"")+'</span><span class="pt">'+r.total+'</span>')));
  if(st.me.rank>10){ bd.appendChild(h("div",{class:"sr-row gap"},"…")); bd.appendChild(h("div",{class:"sr-row me"},'<span class="pos">'+st.me.rank+'</span><span class="nm">'+esc(st.me.name)+' (ты)</span><span class="pt">'+st.me.total+'</span>')); }
  box.appendChild(bd);
  box.appendChild(h("details",{class:"sr-rules"},'<summary>Правила забега</summary><ul>'+
    '<li>Каждый день открывается новый уровень из 10 вопросов. В воскресенье — финальный босс.</li>'+
    '<li>Верный ответ даёт 10 очков, у финального босса — 20.</li>'+
    '<li>На каждый вопрос можно ответить только один раз, переиграть нельзя.</li>'+
    '<li>Пропущенные уровни можно пройти позже, пока идёт игра.</li>'+
    '<li>При равенстве очков выше тот, кто набрал их раньше.</li>'+
    '<li>Итоги — 2 ноября в канале. Топ-3 получают скидку на курс.</li></ul>'));
}
function srHero(st){
  const left=st?fmtLeft(st.endsAt-Date.now()):["—","до финиша"];
  return h("section",{class:"sr-hero"},'<img src="'+CAT+'" alt=""><div class="sr-title">СПИДРАН</div>'+
    '<p class="sr-sub">Пройди все уровни и стань лучшим! <br> <b>Топ-3 забирают скидку.</b></p>'+
    '<div class="sr-stats"><div class="sr-stat"><b>'+(st?st.me.total:0)+'</b><small>Очки</small></div><div class="sr-stat"><b>'+(st&&st.me.rank?st.me.rank:"—")+'</b><small>Место</small></div><div class="sr-stat"><b>'+left[0]+'</b><small>'+left[1]+'</small></div></div>');
}

/* --- прохождение уровня --- */
let SR=null;
async function startSpeedLevel(day){
  const el=$("#lesson"); el.hidden=false; document.body.style.overflow="hidden";
  el.innerHTML='<div class="lesson-in"><div class="lhead"><button class="x" type="button" aria-label="Выйти">'+I.close+'</button><div class="prog"><i></i></div></div><div class="lbody" id="lbody"><div class="sr-loading"><i></i>Загружаем уровень</div></div></div><div class="lfoot" id="lfoot"><div class="lfoot-in" id="lfoot-in"></div></div>';
  el.querySelector(".x").onclick=closeSpeed;
  try{
    const r=await api("start",{day});
    SR={day, qs:r.questions, pos:r.questions.findIndex(q=>!q.done), got:0, right:0};
    if(SR.pos<0) SR.pos=SR.qs.length;
    SR.qs.forEach(q=>{ if(q.done&&q.done.ok) SR.right++; });
    srShow();
  }catch(e){ $("#lbody").innerHTML='<div class="sr-note"><b>Уровень не загрузился.</b> '+esc(e.message||"")+'</div>'; footer(null,{btn:"Назад",on:closeSpeed}); }
}
function closeSpeed(){ $("#lesson").hidden=true; document.body.style.overflow=""; SR=null; render(); }
function srProg(){ $("#lesson .prog i").style.width=(SR.pos/SR.qs.length*100)+"%"; }
function srShow(){
  srProg();
  if(SR.pos>=SR.qs.length) return srFinish();
  const q=SR.qs[SR.pos], b=$("#lbody"), meta=SR_DAYS[SR.day-1]; b.innerHTML=""; b.scrollTop=0;
  b.appendChild(h("div",{class:"kind"},(meta.final?"Финальный босс":"Уровень "+SR.day)+" · вопрос "+q.n+" из "+SR.qs.length));
  b.appendChild(h("h2",{class:"q"},esc(q.text)));
  if(q.code) b.appendChild(ideView(q.code,{}));
  let getAnswer, chk;
  if(q.type==="num"){
    const inp=h("input",{class:"num-in",id:"num-answer",inputmode:"decimal",autocomplete:"off",placeholder:"Ответ","aria-label":"Ответ числом"});
    inp.addEventListener("input",()=>chk.disabled=!inp.value.trim());
    inp.addEventListener("keydown",e=>{ if(e.key==="Enter"&&inp.value.trim()) chk.click(); });
    b.appendChild(inp); getAnswer=()=>inp.value.trim();
    setTimeout(()=>inp.focus(),50);
  } else {
    const box=h("div",{class:"opts"}); let sel=null;
    const btns=q.opts.map((o,k)=>{ const inner=q.out?'<pre>'+esc(o)+'</pre>':(/[()=%"]/.test(o)?'<code>'+esc(o)+'</code>':esc(o));
      const btn=h("button",{class:"opt",type:"button","aria-pressed":"false"},'<span class="k">'+(k+1)+'</span><span>'+inner+'</span>');
      btn.onclick=()=>{ if(chk.dataset.busy) return; sel=o; btns.forEach(x=>x.setAttribute("aria-pressed","false")); btn.setAttribute("aria-pressed","true"); chk.disabled=false; };
      box.appendChild(btn); return btn; });
    b.appendChild(box); getAnswer=()=>sel; q._btns=btns;
  }
  chk=footer(null,{btn:"Проверить",disabled:true,on:async()=>{
    if(chk.dataset.busy) return; chk.dataset.busy=1; chk.disabled=true; chk.textContent="Проверяем…";
    const choice=getAnswer();
    try{
      const r=await api("answer",{day:SR.day,n:q.n,choice});
      if(q._btns){ q._btns.forEach((x,i)=>{ if(q.opts[i]===r.correct) x.classList.add("ok"); else if(q.opts[i]===choice&&!r.ok) x.classList.add("no"); }); }
      if(r.ok) SR.right++;
      haptic(r.ok?"success":"error");
      const text=(r.ok?"":"Верный ответ: <b>"+esc(r.correct)+"</b>. ")+esc(r.explain||"")+(r.ege?'<span class="ege-line">'+esc(r.ege)+'</span>':"");
      footer(r.ok?"good":"bad",{head:r.ok?"+"+r.points+" очков!":"Мимо",text,btn:"Дальше",on:()=>{ SR.pos++; srShow(); }});
    }catch(e){ delete chk.dataset.busy; chk.disabled=false; chk.textContent="Проверить"; toast(e.message||"Нет связи. Попробуй ещё раз"); }
  }});
}
function srFinish(){
  const b=$("#lbody"), meta=SR_DAYS[SR.day-1]; b.innerHTML=""; b.classList.add("finish");
  $("#lesson .prog i").style.width="100%";
  b.appendChild(h("div",{class:"spr",style:"width:96px;height:96px;background:#1b1e52;border-radius:20px;display:grid;place-items:center"},sprite(meta.spr).replace("<svg",'<svg width="72" height="72"')));
  b.appendChild(h("h2",null,meta.final?"Босс повержен!":"Уровень пройден!"));
  b.appendChild(h("div",{class:"sr-result"},SR.right+"/"+SR.qs.length));
  b.appendChild(h("p",{class:"txt",style:"text-align:center"},meta.final?"Ты решил задания в духе настоящего ЕГЭ. Итоги забега — 2 ноября в канале.":"Следующий уровень откроется завтра. Загляни в таблицу лидеров!"));
  if(meta.final) b.appendChild(courseCta("speedrun_final","Готов к настоящему ЕГЭ?","Ты прошёл задания в духе экзамена. На годовом курсе разберём каждое из 27 заданий и выйдем на высокий балл."));
  footer(null,{btn:"К таблице лидеров",on:()=>{ b.classList.remove("finish"); closeSpeed(); }});
}

