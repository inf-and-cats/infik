/* «Практика»: задача дня и общий задачник. Ученик сам пишет программу, проверяем на нескольких вводах.
   Задачи лежат в content/practice.json. Любая решённая задача зажигает огонёк (js/streak.js). */
I.code='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><rect x="2.5" y="4" width="19" height="16" rx="3" fill="currentColor" fill-opacity=".15"/><path d="m7 10 3 2.5L7 15M12.5 15h4.5"/></svg>';
BADGES.push({id:"s14",title:"Серия 14 дней",hint:"Две недели без пропусков",ic:"flame"},{id:"s30",title:"Серия 30 дней",hint:"Месяц без пропусков",ic:"flame"},
  {id:"task1",title:"Сам пишу код",hint:"Реши задачу в Практике",ic:"kbd"},{id:"daily",title:"Задача дня",hint:"Реши задачу дня",ic:"star"});

/* Практика появляется вместо «Спидрана», когда он закончится. Разработчику видна сразу */
function practiceOn(){ return DEV || !speedOn(); }
const PR_XP={1:15,2:25,3:40}, PR_DAILY_XP=[20,50];
let PRACTICE=null, PR=null, PR_ALL=false;
const PR_DRAFT={}; // недописанный код по задачам, пока приложение открыто

function practiceData(){
  return PRACTICE?Promise.resolve(PRACTICE):fetch("content/practice.json",{cache:"no-cache"}).then(r=>{ if(!r.ok) throw new Error(r.status); return r.json(); }).then(d=>PRACTICE=d);
}
/* задача дня одна на всех: номер дня от даты start по кругу */
function dailyToday(d){
  if(!d.daily||!d.daily.length) return null;
  const [y,m,dd]=String(d.start||"2026-11-01").split("-").map(Number), now=new Date();
  const i=Math.round((new Date(now.getFullYear(),now.getMonth(),now.getDate())-new Date(y,m-1,dd))/864e5), n=d.daily.length;
  return d.daily[((i%n)+n)%n];
}
/* «По пройденному»: задачи всех модулей до самого дальнего, где пройден хотя бы один урок.
   Начал модуль 3 — видишь задачи модулей 1–3 */
function modReached(id){
  if(!COURSE) return false;
  let reached=-1, idx=-1, k=0;
  for(const sec of COURSE.sections) for(const M of sec.modules){ if(M.id===id) idx=k; if(M.lessons&&M.lessons.some(p=>S.done[p.id])) reached=k; k++; }
  return idx>=0&&idx<=reached;
}
function modTitle(id){ if(COURSE) for(const sec of COURSE.sections){ const i=sec.modules.findIndex(M=>M.id===id); if(i>=0) return "Модуль "+(i+1)+" · "+sec.modules[i].title; } return id; }
const stars=n=>'<span class="pr-stars" aria-label="Сложность '+n+' из 3">'+[1,2,3].map(i=>'<i class="'+(i<=n?"on":"")+'">'+I.star+'</i>').join("")+'</span>';
const prDone=id=>!!(S.pr&&S.pr[id]);

async function renderPractice(app){
  app.appendChild(h("h1",{class:"page"},"Практика"));
  app.appendChild(h("p",{class:"sub"},"Пиши программы сам. Любая решённая задача зажигает огонёк."));
  const box=h("div",{class:"pr"}); app.appendChild(box);
  if(!PRACTICE) box.appendChild(h("div",{class:"sr-loading"},"<i></i>Загружаем задачи"));
  let d; try { d=await practiceData(); } catch(e){
    if(S.tab!=="practice"||!box.isConnected) return;
    box.innerHTML=""; box.appendChild(h("div",{class:"sr-note"},"<b>Не получилось загрузить задачи.</b> Проверь интернет."));
    const r=h("button",{class:"reset",type:"button"},"Обновить"); r.onclick=render; box.appendChild(r); return; }
  if(S.tab!=="practice"||!box.isConnected) return;
  box.innerHTML="";
  /* задача дня: лёгкая и со звёздочкой */
  const pair=dailyToday(d);
  if(pair){
    const left=Math.max(1,Math.ceil((new Date().setHours(24,0,0,0)-Date.now())/36e5));
    const card=h("section",{class:"pr-daily"},'<div class="pr-dh"><small>Задача дня</small><span>новая через '+left+' ч</span></div>');
    pair.forEach((t,v)=>{ const key="d:"+today()+":"+v, done=prDone(key);
      const b=h("button",{class:"pr-dtask"+(done?" done":""),type:"button"},'<span class="pr-dic">'+(done?I.check:v?I.star:I.code)+'</span><span class="pr-dtx"><small>'+(v?"Со звёздочкой":"Лёгкая")+'</small><b>'+esc(t.title)+'</b></span><span class="pr-xp">'+(done?"решено":"+"+PR_DAILY_XP[v]+" XP")+'</span>');
      b.onclick=()=>openTask(t,{daily:v,key}); card.appendChild(b); });
    box.appendChild(card);
  }
  /* задачник: по умолчанию задачи по пройденным темам, во «Всех задачах» — любые */
  box.appendChild(h("h2",{class:"pr-h"},"Задачник"));
  const tabs=h("div",{class:"mt-tags",role:"tablist","aria-label":"Какие задачи показать"});
  [["По пройденному",false],["Все задачи",true]].forEach(([t,all])=>{ const b=h("button",{type:"button",role:"tab","aria-selected":String(PR_ALL===all)},t);
    b.onclick=()=>{ PR_ALL=all; render(); }; tabs.appendChild(b); });
  box.appendChild(tabs);
  const can=t=>modReached(t.need), list=d.tasks.filter(t=>PR_ALL||can(t));
  const solved=d.tasks.filter(t=>prDone(t.id)).length;
  box.appendChild(h("p",{class:"note"},"Решено "+solved+" из "+d.tasks.length+(PR_ALL?". Бледные задачи по темам, до которых ты ещё не дошёл, но решать их можно.":". Здесь задачи по темам модулей, которые ты уже начал.")));
  if(!list.length){
    box.appendChild(h("div",{class:"sr-note"},"<b>Пока пусто.</b> Пройди первый урок на Пути, и здесь появятся задачи. Или загляни во все задачи, если уже знаешь Python."));
    const all=h("button",{class:"reset",type:"button"},"Показать все задачи"); all.onclick=()=>{ PR_ALL=true; render(); }; box.appendChild(all);
  }
  let lastNeed=null;
  list.forEach(t=>{
    if(t.need!==lastNeed){ lastNeed=t.need; box.appendChild(h("div",{class:"pr-mod"},esc(modTitle(t.need)))); }
    const done=prDone(t.id), ahead=!can(t);
    const b=h("button",{class:"pr-task"+(done?" done":"")+(ahead?" ahead":""),type:"button"},'<span class="pr-tx"><b>'+esc(t.title)+'</b>'+stars(t.lvl)+(ahead?'<small class="pr-ahead">тема впереди</small>':'')+'</span><span class="pr-xp">'+(done?I.check:"+"+PR_XP[t.lvl]+" XP")+'</span>');
    b.onclick=()=>openTask(t,{}); box.appendChild(b);
  });
}

/* ---------- экран задачи (поверх приложения, как урок) ---------- */
const PR_KEYS=[["⇥ Tab","    "],["input()","input()"],["int(","int("],["print(","print("],["(","("],[")",")"],['"','"'],[":",":"],[",",","],["=","="],["==","=="],["%","%"],["//","//"],["if ","if "],["elif ","elif "],["else:","else:"],["and","and"],["or","or"]];
function openTask(t,o){
  PR={t,o};
  const el=$("#lesson"); el.hidden=false; document.body.style.overflow="hidden";
  el.innerHTML='<div class="lesson-in"><div class="lhead"><button class="x" type="button" aria-label="Закрыть задачу">'+I.close+'</button><div class="pr-top">'+(o.daily!=null?"Задача дня":esc(modTitle(t.need)))+'</div></div><div class="lbody" id="lbody"></div></div><div class="lfoot" id="lfoot"><div class="lfoot-in" id="lfoot-in"></div></div>';
  el.querySelector(".x").onclick=closeTask;
  const b=$("#lbody");
  b.appendChild(h("div",{class:"kind"},(o.daily!=null?(o.daily?"Со звёздочкой":"Лёгкая"):"Задача")+stars(t.lvl)));
  b.appendChild(h("h2",{class:"q"},esc(t.title)));
  b.appendChild(h("p",{class:"txt"},t.text));
  const ex=t.tests.slice(0,t.show||1);
  ex.forEach((x,i)=>{ const w=h("div",{class:"pr-ex"}); if(ex.length>1) w.appendChild(h("div",{class:"pr-exh"},"Пример "+(i+1)));
    if(x.in.length) w.appendChild(inputBlock(x.in)); w.appendChild(expectBlock(x.out.replace(/\n$/,""))); b.appendChild(w); });
  if(t.hint){ const hb=h("button",{class:"reset",type:"button"},"💡 Подсказка"); hb.onclick=()=>{ hb.replaceWith(h("div",{class:"tip"},'<img src="'+CAT+'" alt="ИНФиК"><p>'+t.hint+'</p>')); }; b.appendChild(hb); }
  const st={kbdOnly:true,input:ex[0]&&ex[0].in,keys:PR_KEYS,start:PR_DRAFT[t.id]||""};
  let chk, ed=null; ed=codeEntry(b,st,()=>{ if(!ed) return; PR_DRAFT[t.id]=ed.code; if(chk) chk.disabled=!ed.code.trim(); });
  b.appendChild(h("p",{class:"note"},"«Запустить» берёт ввод из первого примера. «Проверить» запускает программу на всех тестах. Подсказки в <code>input()</code> писать не нужно."));
  function idle(){ chk=prFoot(null,{btn:"Проверить",on:check}); chk.disabled=!ed.code.trim(); }
  function check(){
    const r=prCheck(t,ed.code);
    if(r.ok) return prSolved(t,o);
    haptic("error"); const lb=$("#lbody"); lb.classList.remove("shake"); void lb.offsetWidth; lb.classList.add("shake");
    prFoot("bad",{head:r.head,body:r.body,btn:"Исправить",on:()=>{ idle(); ed.focus(); }});
  }
  idle();
}
function closeTask(){ $("#lesson").hidden=true; document.body.style.overflow=""; PR=null; render(); }
function prFoot(state,opts){
  const f=$("#lfoot"), fi=$("#lfoot-in"); f.className="lfoot"+(state?" "+state:""); fi.innerHTML="";
  if(state){ const fb=h("div",{class:"fb"},'<img src="'+CAT+'" alt=""><div><h3>'+opts.head+'</h3></div>'); if(opts.body) fb.lastChild.appendChild(opts.body); fi.appendChild(fb); }
  if(DEV&&!state){ const d=h("button",{class:"dev",type:"button"},"⚡ Засчитать"); d.onclick=()=>prSolved(PR.t,PR.o); fi.appendChild(d); }
  const b=h("button",{class:"main",type:"button"},opts.btn); b.onclick=opts.on; fi.appendChild(b);
  return b;
}
/* сравнение вывода: регистр, пробелы в конце строки и точка или «!» в конце не важны. Пробелы в начале строки важны (ёлочка) */
function prNorm(s){ return String(s).replace(/\r/g,"").split("\n").map(l=>l.replace(/\s+$/,"").replace(/[.!]+$/,"").toLowerCase()).join("\n").replace(/\n+$/,""); }
function prCheck(t,code){
  for(let i=0;i<t.tests.length;i++){
    const x=t.tests[i], r=runPy(code,x.in,{noEcho:true});
    const body=h("div",{class:"pr-fail"});
    if(x.in.length) body.appendChild(h("div",null,'<small>Ввод</small><pre>'+esc(x.in.join("\n"))+'</pre>'));
    body.appendChild(h("div",null,'<small>Нужно</small><pre>'+esc(x.out.replace(/\n$/,""))+'</pre>'));
    if(r.err){ body.appendChild(h("div",null,'<small>Ошибка, строка '+r.err.line+'</small><pre>'+esc(r.err.type+": "+r.err.msg)+'</pre>'));
      return {ok:false,head:r.err.type==="EOFError"?"Лишний input()":"Python ругается",body}; }
    if(prNorm(r.out)!==prNorm(x.out)){ body.appendChild(h("div",null,'<small>Получилось</small><pre>'+(r.out.replace(/\n$/,"")?esc(r.out.replace(/\n$/,"")):"(пусто)")+'</pre>'));
      return {ok:false,head:"Тест "+(i+1)+" из "+t.tests.length+" не прошёл",body}; }
  }
  return {ok:true};
}
function prSolved(t,o){
  S.pr=S.pr||{};
  const key=o.daily!=null?o.key:t.id, first=!S.pr[key];
  const xp=first?(o.daily!=null?PR_DAILY_XP[o.daily]:PR_XP[t.lvl]):0;
  S.pr[key]=1; if(o.daily!=null) S.pr[t.id]=1;
  S.xp+=xp; if(xp) leagueXp(xp,"pr_"+t.id);
  const lit=bumpStreak();
  const newB=[]; const give=id=>{ if(!S.badges[id]){ S.badges[id]=true; newB.push(BADGES.find(b=>b.id===id)); } };
  give("task1"); if(o.daily!=null) give("daily"); streakGive(give);
  if(newB.length) S.newBadge=true;
  save(); haptic("success");
  const body=h("div",{class:"pr-ok"});
  body.appendChild(h("p",null,(xp?"<b>+"+xp+" XP.</b> ":"Эта задача уже решена, XP второй раз не начисляем. ")+(lit?"Огонёк зажжён: "+S.streak+" "+plural(S.streak,"день","дня","дней")+" подряд 🔥":"")));
  newB.forEach(x=>body.appendChild(h("div",{class:"unlock"},'<span class="ic">'+I[x.ic]+'</span><div><small>Новая награда</small><b>'+x.title+'</b></div>')));
  prFoot("good",{head:"Все тесты пройдены!",body,btn:"Дальше",on:closeTask});
}
