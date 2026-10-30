/* Экраны приложения: путь, лига, награды, вкладки */
const BADGES = [
 {id:"first", title:"Первая программа", hint:"Пройди первый урок", ic:"brackets"},
 {id:"bug", title:"Охотник на баги", hint:"Найди первую ошибку", ic:"bug"},
 {id:"clean", title:"Без ошибок", hint:"Урок без единой ошибки", ic:"star"},
 {id:"s3", title:"Серия 3 дня", hint:"Занимайся 3 дня подряд", ic:"flame"},
 {id:"s7", title:"Серия 7 дней", hint:"Неделя без пропусков", ic:"flame"},
 {id:"boss1", title:"Босс модуля 1", hint:"Победи задачу-босса", ic:"crown"}
];


/* ---------- views ---------- */
function renderTop(){
  return '<div class="top"><div class="brand">ИНФиК</div><div class="stats">'+
   '<span class="stat" title="Серия дней">'+I.fire+S.streak+'</span>'+
   '<button class="stat xp'+(S.newBadge?' new':'')+'" type="button" id="xpbtn" aria-label="Опыт и награды" title="Опыт и награды">'+I.xp+S.xp+' XP</button>'+
   (S.hintRewards||!S.xp?'':'<span class="xp-hint" aria-hidden="true">Награды теперь здесь 👆</span>')+'</div></div>';
}
/* «Спидран» скрыт, если сервер сказал speedrun:false (ученики платного курса); без ответа — виден.
   После итогов акции (3 ноября) вкладка пропадает у всех */
const SPEED_HIDE_AT=new Date("2026-11-03T00:00:00+03:00").getTime();
function speedOn(){ return Date.now()<SPEED_HIDE_AT && !(S.access && S.access.speedrun===false); }
function render(){
  if((S.tab==="speed" && !speedOn()) || (S.tab==="course" && !courseOn()) || S.tab==="badges") S.tab="path";
  const app=$("#app"); app.innerHTML="";
  app.insertAdjacentHTML("beforeend",renderTop());
  const xb=$("#xpbtn"); if(xb) xb.onclick=openRewards;
  if(S.tab==="speed") renderSpeed(app); else if(S.tab==="league") renderLeague(app); else if(S.tab==="materials") renderMaterials(app); else if(S.tab==="course") renderCoursePage(app); else renderPath(app);
  const tabs=$("#tabs"); tabs.innerHTML="";
  [["path","Путь",I.path],["speed","Спидран",I.fire],["materials","Материалы",I.book],["league","Лига",I.trophy],["course","Курс",I.cap]].filter(([id])=>(id!=="speed"||speedOn())&&(id!=="course"||courseOn())).forEach(([id,name,ic])=>{
    const b=h("button",{role:"tab","aria-selected":String(S.tab===id),type:"button"},ic+name);
    b.onclick=()=>{S.tab=id;save();render();window.scrollTo(0,0);}; tabs.appendChild(b); });
}
function renderPath(app){
  const d=daysToEge();
  app.appendChild(h("div",{class:"countdown"},'<b>'+d+'</b><span>'+plural(d,"день","дня","дней")+' до ЕГЭ <small style="opacity:.7">(≈ 1 июня)</small><br><em>успеваешь, если по уроку в день</em></span>'));
  if(!COURSE){ app.appendChild(h("div",{class:"sr-loading"},"<i></i>Загружаем курс")); return; }
  /* разделы: переключатель сверху. Раздел без уроков пока закрыт («скоро») */
  const SECS=COURSE.sections, hasLessons=sec=>sec.modules.some(m=>m.lessons);
  const sec=SECS.find(x=>x.id===S.sec)||SECS[0];
  const bar=h("div",{class:"secs",role:"tablist","aria-label":"Разделы курса"});
  SECS.forEach((x,i)=>{
    const tag=x.free&&!isStudent()?'<span class="free">Бесплатно</span>':!hasLessons(x)?'<span class="lk">'+I.lock+'</span>':"";
    const b=h("button",{class:"sec",role:"tab","aria-selected":String(x===sec),type:"button"},'<small>Раздел '+(i+1)+tag+'</small><b>'+esc(x.title)+'</b>');
    b.onclick=()=>{ S.sec=x.id; save(); render(); }; bar.appendChild(b);
  });
  app.appendChild(bar);
  if(!hasLessons(sec)) app.appendChild(h("section",{class:"sec-soon"},'<span class="ic">'+I.lock+'</span><div><b>'+esc(sec.title)+'</b><p>'+esc(sec.about)+'. Раздел скоро откроется.</p></div>'));
  /* модули сворачиваются: по умолчанию открыт только текущий, выбор ученика запоминаем в S.fold */
  const fold=S.fold||(S.fold={}), curM=sec.modules.find(m=>m.lessons&&m.lessons.some(p=>!S.done[p.id]));
  sec.modules.forEach((M,mi)=>{
    if(!M.lessons){ app.appendChild(h("div",{class:"locked-mod"},I.lock.replace("<svg",'<svg width="26" height="26"')+'<div><small>Модуль '+(mi+1)+'</small><b>'+esc(M.title)+'</b></div>'+(M.ege?'<span class="ege">'+esc(M.ege)+'</span>':""))); return; }
    const PATH=M.lessons, doneN=PATH.filter(p=>S.done[p.id]).length;
    const shut=M.id in fold?fold[M.id]:M!==curM;
    const mod=h("section",{class:"module"+(shut?" shut":"")},'<button class="fold" type="button" aria-expanded="'+!shut+'" aria-label="'+(shut?"Развернуть":"Свернуть")+' модуль"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="m6 9 6 6 6-6"/></svg></button><div class="eyebrow">Модуль '+(mi+1)+' · '+doneN+' из '+PATH.length+'</div><h2>'+esc(M.title)+'</h2><p>'+esc(M.about||"")+'</p><div class="bar"><i style="width:'+(doneN/PATH.length*100)+'%"></i></div><img src="'+CAT+'" alt="">');
    mod.onclick=e=>{ if(e.target.closest(".mod-tools")) return; fold[M.id]=!shut; try { localStorage.setItem(KEY, JSON.stringify(S)); } catch(e){} render(); }; // без save(): сворачивание не прогресс, метку синхронизации не сдвигаем
    const cheat=PATH.filter(p=>S.done[p.id]&&p.file);
    const tools=h("div",{class:"mod-tools"});
    if(M.video){ const vb=h("button",{class:"cheat",type:"button"},I.play+"Видео"); vb.onclick=()=>openVideo(M); tools.appendChild(vb); }
    if(cheat.length){ const cb=h("button",{class:"cheat",type:"button"},"📖 Шпаргалка"); cb.onclick=()=>openCheatSheet(M,cheat); tools.appendChild(cb); }
    if(tools.children.length) mod.insertBefore(tools,mod.querySelector("img"));
    app.appendChild(mod);
    const path=h("div",{class:"path"});
    const offs=[0,-60,-80,-30,40,0];
    PATH.forEach((p,i)=>{
      const done=!!S.done[p.id]; const open=!done&&(i===0||S.done[PATH[i-1].id]);
      const n=h("button",{class:"node"+(done?" done":open?" open":"")+(p.boss?" boss":""),type:"button",style:"transform:translateX("+offs[i%offs.length]+"px)"});
      n.innerHTML=(open?'<span class="start">'+(i===0?"Начать":"Дальше")+'</span>':"")+'<span class="disc">'+lessonDisc(p,done,open)+'</span><span class="lbl">'+(i+1)+'. '+p.title+'</span>';
      n.onclick=()=>{ if(p.file&&(open||done||DEV)) startLesson(p); else if(open||DEV) toast("Урок в разработке"); else toast("Сначала пройди урок "+i); }; // DEV: любой урок без прохождения предыдущих
      path.appendChild(n);
    });
    if(!shut) app.appendChild(path);
    if(mi===0) app.appendChild(courseCta("path_"+sec.id,"Весь ЕГЭ, а не только Python","Здесь ты знакомишься с Python. На годовом курсе разберём все 27 заданий ЕГЭ с преподавателем — от первого до последнего."));
  });
  if(!hasLessons(sec)) app.appendChild(courseCta("path_"+sec.id,"Не жди — начни сейчас","На годовом курсе всё это уже есть: разберём все 27 заданий ЕГЭ с преподавателем."));
}
/* ---------- шпаргалка модуля: теория всех пройденных уроков ---------- */
const LESSON_JSON={}; // файлы уроков в памяти, чтобы не качать повторно
function lessonJson(file){
  return LESSON_JSON[file]||(LESSON_JSON[file]=fetch(file,{cache:"no-cache"}).then(r=>{ if(!r.ok) throw new Error(r.status); return r.json(); })
    .catch(e=>{ delete LESSON_JSON[file]; throw e; }));
}
function openCheatSheet(M,lessons){
  const list=h("div",{class:"sheet-list"},'<div class="sr-loading"><i></i>Загружаем шпаргалку</div>');
  openSheet("Шпаргалка: "+M.title,list);
  Promise.all(lessons.map(p=>lessonJson(p.file))).then(all=>{
    list.innerHTML="";
    all.forEach((l,k)=>{
      list.appendChild(h("h3",{class:"sheet-lesson"},lessons[k].title));
      const th=(l.steps||[]).filter(s=>s.type==="theory");
      if(th.length) th.forEach(s=>list.appendChild(theoryArticle(s))); else list.appendChild(h("p",{class:"note"},"В этом уроке нет теории."));
    });
  }).catch(()=>{ list.innerHTML=""; list.appendChild(h("div",{class:"sr-note"},"Не получилось загрузить, проверь интернет")); });
}
/* ---------- лига недели (сервер: league_state / league_xp) ---------- */
let LG_STATE=null; // последняя таблица недели с сервера
const leagueOn=()=>!!(API_URL&&tg&&tg.initData);
/* XP за урок в лигу: фоном, без ожидания, один повтор; ошибки молча пропускаем */
function leagueXp(xp,lesson){
  if(!leagueOn()||!xp) return;
  api("league_xp",{xp,lesson},2).then(st=>{ if(st&&st.leaders) LG_STATE=st; }).catch(()=>{});
}
function leagueLeft(ms){
  if(ms<=0) return "неделя подводит итоги";
  const d=Math.floor(ms/864e5), hh=Math.floor(ms/36e5), m=Math.max(1,Math.floor(ms/6e4));
  return "осталось "+(d?d+" "+plural(d,"день","дня","дней"):hh?hh+" ч":m+" мин");
}
function leagueRow(r){
  const n=String(r.name||"?"), c=r.me?" me":" c"+([...n].reduce((s,ch)=>s+ch.charCodeAt(0),0)%3);
  return h("div",{class:"row"+(r.me?" me":"")},'<span class="pos">'+r.rank+'</span><span class="ava'+c+'">'+esc([...n][0].toUpperCase())+'</span><span class="name">'+esc(n)+(r.me?" (ты)":"")+'</span><span class="xp">'+r.xp+' XP</span>');
}
function leagueTable(box,st){
  box.innerHTML="";
  box.appendChild(h("div",{class:"lg-left"},I.flame+'<span>'+leagueLeft(st.endsAt-Date.now())+'</span>'+(st.players?'<small>'+st.players+' '+plural(st.players,"участник","участника","участников")+'</small>':"")));
  if(!st.me.rank) box.appendChild(h("div",{class:"sr-note"},"<b>Тебя пока нет в таблице.</b> Пройди урок, чтобы попасть в таблицу этой недели."));
  if(st.leaders.length){
    const t=h("div",{class:"league"});
    st.leaders.forEach(r=>t.appendChild(leagueRow(r)));
    if(st.me.rank&&!st.leaders.some(r=>r.me)){ t.appendChild(h("div",{class:"row gap"},"…")); t.appendChild(leagueRow(Object.assign({me:true},st.me))); }
    box.appendChild(t);
  } else box.appendChild(h("p",{class:"note"},"На этой неделе ещё никто не набрал XP. Стань первым!"));
}
async function renderLeague(app){
  app.appendChild(h("h1",{class:"page"},"Лига недели"));
  app.appendChild(h("p",{class:"sub"},"Неделя обнуляется в понедельник. XP за уроки идут в таблицу."));
  const box=h("div",{class:"lg"}); app.appendChild(box);
  if(!leagueOn()){ box.appendChild(h("div",{class:"sr-note"},"<b>Лига работает внутри Telegram.</b> Открой приложение через бота, чтобы соревноваться с другими."+(API_URL?"":" Сервер не подключён."))); return; }
  if(LG_STATE) leagueTable(box,LG_STATE); else box.appendChild(h("div",{class:"sr-loading"},"<i></i>Загружаем лигу"));
  try{
    const st=await api("league_state");
    if(S.tab!=="league"||!box.isConnected) return;
    LG_STATE=st; leagueTable(box,st);
  }catch(e){
    if(S.tab!=="league"||!box.isConnected) return;
    if(LG_STATE) return toast("Не получилось обновить лигу");
    box.innerHTML=""; box.appendChild(h("div",{class:"sr-note"},"<b>Не получилось загрузить лигу.</b> "+esc(e.message||"Проверь интернет")));
    const r=h("button",{class:"reset",type:"button"},"Обновить"); r.onclick=render; box.appendChild(r);
  }
}

