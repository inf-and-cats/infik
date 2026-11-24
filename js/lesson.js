/* Движок урока: показ шагов, проверка, повтор ошибок, финал */
/* ---------- lesson engine ---------- */
let LS=null;
async function startLesson(p){
  let lesson;
  try{ const r=await fetch(p.file,{cache:"no-cache"}); if(!r.ok) throw new Error(r.status); lesson=await r.json(); }
  catch(e){ toast("Не получилось загрузить урок. Проверь интернет"); return; }
  p=Object.assign({},p,{steps:lesson.steps});
  LS={p, queue:p.steps.map((s,i)=>Object.assign({_i:i},s)), pos:0, mistakes:0, redo:new Set(), xp:0, t0:Date.now(), bugFound:false};
  const el=$("#lesson"); el.hidden=false; document.body.style.overflow="hidden";
  el.innerHTML='<div class="lesson-in"><div class="lhead"><button class="x" type="button" aria-label="Выйти из урока">'+I.close+'</button><div class="prog"><i></i></div><button class="x book" type="button" aria-label="Теория урока" hidden>'+I.book+'</button><button class="x snd" type="button"></button></div><div class="lbody" id="lbody"></div></div><div class="lfoot" id="lfoot"><div class="lfoot-in" id="lfoot-in"></div></div>';
  el.querySelector(".x").onclick=closeLesson;
  el.querySelector(".book").onclick=openLessonTheory;
  sndBtn(el.querySelector(".snd"));
  track("lesson_start",p.id); // статистика: js/stats.js
  showStep();
}
/* кнопка звука в шапке урока: пиксельный динамик, перечёркнут — звук выключен */
const SND_ON='<svg viewBox="0 0 12 10" shape-rendering="crispEdges" fill="currentColor"><rect x="0" y="3" width="3" height="4"/><rect x="3" y="2" width="1" height="6"/><rect x="4" y="1" width="1" height="8"/><rect x="5" y="0" width="1" height="10"/><rect x="7" y="4" width="1" height="2"/><rect x="8" y="2" width="1" height="1"/><rect x="9" y="3" width="1" height="4"/><rect x="8" y="7" width="1" height="1"/><rect x="10" y="1" width="1" height="1"/><rect x="11" y="2" width="1" height="6"/><rect x="10" y="8" width="1" height="1"/></svg>';
const SND_OFF='<svg viewBox="0 0 12 10" shape-rendering="crispEdges" fill="currentColor"><rect x="0" y="3" width="3" height="4"/><rect x="3" y="2" width="1" height="6"/><rect x="4" y="1" width="1" height="8"/><rect x="5" y="0" width="1" height="10"/><rect x="7" y="3" width="1" height="1"/><rect x="8" y="4" width="1" height="1"/><rect x="9" y="5" width="1" height="1"/><rect x="10" y="6" width="1" height="1"/><rect x="10" y="3" width="1" height="1"/><rect x="9" y="4" width="1" height="1"/><rect x="8" y="5" width="1" height="1"/><rect x="7" y="6" width="1" height="1"/></svg>';
function sndBtn(b){
  const draw=()=>{ const on=S.sound!==false; b.innerHTML=on?SND_ON:SND_OFF; b.setAttribute("aria-label",on?"Выключить звук":"Включить звук"); b.classList.toggle("off",!on); };
  draw(); b.onclick=()=>{ S.sound=S.sound===false; save(); draw(); if(S.sound) sfx("ok"); toast(S.sound?"Звук включён":"Звук выключен"); };
}
function closeLesson(){ if(LS&&!LS.fin) track("lesson_quit",LS.p.id,{s:Math.round((Date.now()-LS.t0)/1000)}); $("#lesson").hidden=true; document.body.style.overflow=""; LS=null; render(); }
function setProg(){ $("#lesson .prog i").style.width=(LS.pos/LS.queue.length*100)+"%"; }

function footer(state,opts){
  const f=$("#lfoot"), fi=$("#lfoot-in"); f.className="lfoot"+(state?" "+state:""); fi.innerHTML="";
  if(state){
    const fb=h("div",{class:"fb"},'<img class="px" src="'+catImg()+'" alt=""><div><h3>'+opts.head+'</h3>'+(opts.text?'<p>'+opts.text+'</p>':"")+'</div>');
    fi.appendChild(fb);
  }
  if(DEV && !state && opts.btn==="Проверить"){ // годмод: засчитать задание без ответа
    const d=h("button",{class:"dev",type:"button"},"⚡ Засчитать"); d.onclick=()=>resolve(true,LS.queue[LS.pos]); fi.appendChild(d); }
  const b=h("button",{class:"main",type:"button"},opts.btn); if(opts.disabled) b.disabled=true; b.onclick=opts.on; fi.appendChild(b);
  return b;
}
const PRAISE=["Отлично!","Так держать!","Верно!","Мур, правильно!","Супер!"];
function resolve(ok,step,detail){
  if(ok){ haptic("success"); sfx("ok"); if(!step._again) LS.xp+=10; else LS.xp+=5; footer("good",{head:PRAISE[Math.floor(Math.random()*PRAISE.length)],text:step.why,btn:"Дальше",on:nextStep}); }
  else { haptic("error"); LS.mistakes++; if(!LS.redo.has(step._i)){ LS.redo.add(step._i); LS.queue.push(Object.assign({},step,{_again:true})); setProg(); }
    footer("bad",{head:"Почти!",text:(detail?detail+" ":"")+step.why+(step._again?"":" Вернёмся к этому заданию в конце урока."),btn:"Понятно",on:nextStep});
    const lb=$("#lbody"); lb.classList.remove("shake"); void lb.offsetWidth; lb.classList.add("shake"); }
}
function nextStep(){ LS.pos++; if(LS.pos>=LS.queue.length) finish(); else showStep(); }

function showStep(){
  setProg();
  $("#lesson .book").hidden=!LS.queue.slice(0,LS.pos).some(s=>s.type==="theory");
  const st=LS.queue[LS.pos], b=$("#lbody"); b.innerHTML=""; b.scrollTop=0;
  b.appendChild(h("div",{class:"kind"},st.kind+(st._again?' <span class="again">Повторим</span>':"")));
  b.appendChild(h("h2",{class:"q"},st.title));
  if(st.calc) b.appendChild(calcBtn(st.calc)); // скриншот настоящего Calc по кнопке (js/sheet.js)
  if(st.input&&st.type!=="theory") b.appendChild(inputBlock(st.input));
  if(st.expectOut) b.appendChild(expectBlock(st.expectOut));
  ({theory,choice,build,bug,indent,parsons,write,sheet:sheetStep,robot:robotStep,truth:truthStep,turtle:turtleStep})[st.type](st,b);
}

/* тело карточки теории: абзацы, код с «Запустить», совет котика. Заголовок рисует тот, кто вызывает */
function theoryCard(st){
  const f=document.createDocumentFragment();
  (st.text||[]).forEach(t=>f.appendChild(h("p",{class:"txt"},t)));
  /* карточки определений: [{term, text}] */
  if(st.defs){ const d=h("div",{class:"defs"}); st.defs.forEach(x=>d.appendChild(h("div",{class:"def"},'<b>'+x.term+'</b><p>'+x.text+'</p>'))); f.appendChild(d); }
  if(st.sheet) f.appendChild(sheetBlock(st.sheet)); // таблица Calc (js/sheet.js)
  if(st.tt) f.appendChild(truthBlock(st.tt)); // таблица истинности (js/truth.js)
  if(st.turtle) f.appendChild(tuBlock(st.turtle)); // Черепаха: алгоритм и поле (js/turtle.js)
  if(st.key) f.appendChild(h("div",{class:"key"},'<small>Главное</small><p>'+st.key+'</p>'));
  if(st.input) f.appendChild(inputBlock(st.input));
  if(st.code) f.appendChild(ideView(st.code,{run:st.run,input:st.input}));
  if(st.tip) f.appendChild(h("div",{class:"tip"},'<img class="px" src="'+catImg()+'" alt="ИНФиК"><p>'+st.tip+'</p>'));
  return f;
}
/* карточка теории с заголовком — для панели «Теория урока» и шпаргалки модуля */
function theoryArticle(st){ const a=h("article",{class:"tcard"}); a.appendChild(h("h3",null,st.title)); a.appendChild(theoryCard(st)); return a; }
/* книжка в уроке: пройденная теория по порядку, без повторов */
function openLessonTheory(){
  if(!LS) return;
  const list=h("div",{class:"sheet-list"}), seen=new Set();
  LS.queue.slice(0,LS.pos).forEach(s=>{ if(s.type!=="theory"||seen.has(s._i)) return; seen.add(s._i); list.appendChild(theoryArticle(s)); });
  openSheet("Теория урока",list);
}
function theory(st,b){
  b.appendChild(theoryCard(st));
  footer(null,{btn:"Дальше",on:()=>{ LS.xp+=0; nextStep(); }});
}
function choice(st,b){
  if(st.text) [].concat(st.text).forEach(t=>b.appendChild(h("p",{class:"txt"},t)));
  if(st.sheet) b.appendChild(sheetBlock(st.sheet));
  if(st.tt) b.appendChild(truthBlock(st.tt));
  if(st.turtle) b.appendChild(tuBlock(st.turtle));
  if(st.code){ const v=ideView(st.code,{input:st.input}); b.appendChild(v); if(st.showRun) v.showRun(); }
  const box=h("div",{class:"opts"}); let sel=null, done=false;
  const order=st.options.map((o,i)=>i);
  const btns=order.map((oi,k)=>{ const o=st.options[oi];
    const inner=typeof o==="string"?esc(o):o.html!=null?o.html:o.out!=null?'<pre>'+esc(o.out)+'</pre>':'<code>'+esc(o.code)+'</code>';
    const btn=h("button",{class:"opt",type:"button","aria-pressed":"false"},'<span class="k">'+(k+1)+'</span><span>'+inner+'</span>');
    btn.onclick=()=>{ if(done) return; sel=oi; btns.forEach(x=>x.setAttribute("aria-pressed","false")); btn.setAttribute("aria-pressed","true"); chk.disabled=false; };
    box.appendChild(btn); return btn; });
  b.appendChild(box);
  const chk=footer(null,{btn:"Проверить",disabled:true,on:()=>{ done=true; const ok=sel===st.answer;
    btns[order.indexOf(st.answer)].classList.add("ok"); if(!ok) btns[order.indexOf(sel)].classList.add("no"); resolve(ok,st); }});
}
function bug(st,b){
  let sel=null, done=false;
  const v=ideView(st.code,{input:st.input,onTap:(i,ln)=>{ if(done) return; sel=i; v.lineEls.forEach(x=>x.classList.remove("sel")); ln.classList.add("sel"); chk.disabled=false; }});
  b.appendChild(v);
  b.appendChild(h("div",{class:"tip"},'<img class="px" src="'+catImg()+'" alt="ИНФиК"><p>Смотри внимательно на кавычки и скобки. <em>Баги любят прятаться.</em></p>'));
  const chk=footer(null,{btn:"Проверить",disabled:true,on:()=>{ done=true; const ok=sel+1===st.bug;
    v.lineEls[st.bug-1].classList.remove("sel"); v.lineEls[st.bug-1].classList.add(ok?"goodl":"badl"); if(!ok) v.lineEls[sel].classList.replace("sel","badl");
    v.showRun(); if(ok) LS.bugFound=true; resolve(ok,st); }});
}
function indent(st,b){
  const lines=st.code.split("\n"); let sel=null, done=false;
  const wrap=h("div"); b.appendChild(wrap);
  const tools=h("div",{class:"btools"});
  const dedent=h("button",{class:"tool",type:"button"},"<code>⇤</code> Убрать отступ");
  const ind=h("button",{class:"tool",type:"button"},"<code>⇥</code> Добавить отступ");
  tools.append(dedent,ind); b.appendChild(tools);
  b.appendChild(h("p",{class:"note"},"Нажми на строку, потом на кнопку."));
  function draw(){ wrap.innerHTML=""; const v=ideView(lines.join("\n"),{run:true,input:st.input,onTap:(i)=>{ if(done) return; sel=i; draw(); }}); if(sel!=null) v.lineEls[sel].classList.add("sel"); wrap.appendChild(v); wrap.v=v; }
  dedent.onclick=()=>{ if(sel==null||done) return toast("Сначала выбери строку"); lines[sel]=lines[sel].replace(/^ {1,4}/,""); draw(); };
  ind.onclick=()=>{ if(sel==null||done) return toast("Сначала выбери строку"); lines[sel]="    "+lines[sel]; draw(); };
  draw();
  footer(null,{btn:"Проверить",on:()=>{ done=true; const r=wrap.v.showRun(lines.join("\n")); resolve(!r.err&&r.out===st.expect,st, r.err?"Python всё ещё ругается: "+r.err.type+".":""); }});
}
function parsons(st,b){
  const shuffled=st.lines.map((l,i)=>({l,i})); const ans=[];
  const out=h("div"); const bank=h("div",{class:"bank"});
  b.append(out,h("p",{class:"note"},"Нажимай на строки в нужном порядке. Нажми на строку в редакторе, чтобы убрать её."),bank);
  let chk;
  function draw(){
    out.innerHTML="";
    const src=ans.length?ans.map(a=>a.l).join("\n"):"";
    const v=ideView(src||" ",{run:ans.length>0,input:st.input,onTap:(i)=>{ if(!ans.length) return; ans.splice(i,1); draw(); }});
    if(!ans.length){ v.lineEls[0].innerHTML='<span style="color:var(--ide-dim)">Сюда встанут строки…</span>'; v.querySelector(".gut").innerHTML="<div>1</div>"; }
    out.appendChild(v); out.v=v;
    bank.innerHTML="";
    shuffled.forEach(s=>{ const c=h("button",{class:"chip ide-chip"+(ans.includes(s)?" used":""),type:"button"},hl(s.l)); c.onclick=()=>{ ans.push(s); draw(); }; bank.appendChild(c); });
    if(chk) chk.disabled=ans.length!==st.lines.length;
  }
  chk=footer(null,{btn:"Проверить",disabled:true,on:()=>{ const r=out.v.showRun(ans.map(a=>a.l).join("\n")); resolve(!r.err&&r.out===st.expect,st); }});
  draw();
}


function build(st,b){
  let chk; const api=codeEntry(b,st,()=>{ if(chk) chk.disabled=!api.code.trim(); });
  chk=footer(null,{btn:"Проверить",disabled:true,on:()=>{ const r=api.run(); resolve(!r.err&&r.out===st.expect,st, r.err?"Python выдал ошибку "+r.err.type+".":r.out?"Программа вывела «"+esc(r.out.trim())+"».":""); }});
  chk.disabled=!api.code.trim();
}
function write(st,b){
  b.appendChild(h("p",{class:"txt"},st.text));
  let chk; const api=codeEntry(b,st,()=>{ if(chk) chk.disabled=!api.code.trim(); });
  chk=footer(null,{btn:"Проверить",disabled:true,on:()=>{ const r=api.run(); const msg=r.err?"Python выдал ошибку "+r.err.type+".":checkOutput(st.check,r); resolve(!msg,st,msg||""); }});
  chk.disabled=!api.code.trim();
}

function finish(){
  const p=LS.p, first=!S.done[p.id]; const clean=LS.mistakes===0;
  if(clean) LS.xp+=20;
  S.xp+=LS.xp; S.done[p.id]=true;
  leagueXp(LS.xp,p.id);
  LS.fin=true; track("lesson_done",p.id,{xp:LS.xp,m:LS.mistakes,s:Math.round((Date.now()-LS.t0)/1000),e:[...LS.redo].join(",")});
  bumpStreak(); // огонёк: js/streak.js
  const newB=[]; function give(id){ if(!S.badges[id]){ S.badges[id]=true; newB.push(BADGES.find(b=>b.id===id)); } }
  give("first"); if(LS.bugFound) give("bug"); if(clean) give("clean"); streakGive(give);
  if(newB.length) S.newBadge=true; // значок XP мигает, пока ученик не откроет награды
  save(); haptic("success"); sfx("win");
  const sec=Math.round((Date.now()-LS.t0)/1000), acc=Math.round(100*p.steps.filter(s=>s.type!=="theory").length/Math.max(1,p.steps.filter(s=>s.type!=="theory").length+LS.mistakes));
  $("#lesson .prog i").style.width="100%";
  const b=$("#lbody"); b.innerHTML=""; b.classList.add("finish");
  b.appendChild(h("h2",null,"Урок пройден!"));
  b.appendChild(h("div",{class:"fstats"},'<div><b>+'+LS.xp+'</b><small>XP</small></div><div><b>'+acc+'%</b><small>Точность</small></div><div><b>'+Math.floor(sec/60)+':'+String(sec%60).padStart(2,"0")+'</b><small>Время</small></div>'));
  newB.forEach(x=>b.appendChild(h("div",{class:"unlock"},'<span class="ic">'+I[x.ic]+'</span><div><small>Новая награда</small><b>'+x.title+'</b></div>')));
  if(newB.length) b.appendChild(h("p",{class:"note"},"Все награды — по нажатию на ⭐ XP вверху экрана."));
  if(!/^e\d/.test(p.id)){ // карточка сторис про Python — не для уроков ЕГЭ
    b.appendChild(h("div",{class:"story"},'<div class="s1">я теперь программист</div><div class="s2">Написал первую программу на Python</div><svg class="zz" viewBox="0 0 120 24" fill="none" stroke="#ecf141" stroke-width="5" stroke-linejoin="round" aria-hidden="true"><path d="M2 20 20 4l18 16L56 4l18 16L92 4l18 16"/></svg><div class="s3">ИНФиК · урок 1 из 60</div><img class="px" src="'+catImg()+'" alt="">'));
    b.appendChild(h("p",{class:"note"},"Такую карточку ученик сможет выложить в сторис. Каждый пост ведёт новых людей в приложение."));
  }
  if(p.offer&&typeof egeOffer==="function") b.appendChild(egeOffer("boss_"+p.id)); // после босса задания ЕГЭ: курс или демо
  else b.appendChild(demoCta("lesson_"+p.id,"Понравилось? Попробуй урок ЕГЭ","Преподаватель разберёт задание №7. Бесплатно, нужна только регистрация."));
  b.classList.remove("shake");
  footer(null,{btn:"На карту",on:()=>{ b.classList.remove("finish"); closeLesson(); }});
}



/* блок «Программа должна вывести» — как терминал */
function expectBlock(text){
  return h("div",{class:"expect"},'<div class="th">Программа должна вывести</div><pre>'+esc(text)+'</pre>');
}
/* блок «Пользователь вводит»: что программа получит через input(), по строке на каждый ввод */
function inputBlock(lines){
  return h("div",{class:"expect inp"},'<div class="th">Пользователь вводит</div><pre>'+esc(lines.join("\n"))+'</pre>');
}
/* проверка вывода по описанию из файла урока: {lines: N, equals: {"номер строки": "текст"}} */
function checkOutput(c,r){
  const ls=r.out.replace(/\n$/,"").split("\n"); const cnt=r.out?ls.length:0;
  if(c.lines&&cnt!==c.lines) return "Нужно строк вывода: "+c.lines+". Сейчас: "+cnt+".";
  for(const k in (c.equals||{})){ const want=c.equals[k], got=(ls[k-1]||"").trim().replace(/[.!]$/,"");
    if(got.toLowerCase()!==want.toLowerCase()) return "Строка "+k+" должна быть «"+want+"»."; }
  if(ls.some(l=>!l.trim())) return "В выводе есть пустая строка.";
  return null;
}
