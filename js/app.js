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
const GEAR='<svg viewBox="0 0 12 12" shape-rendering="crispEdges" fill="currentColor" aria-hidden="true"><rect x="5" y="0" width="2" height="2"/><rect x="5" y="10" width="2" height="2"/><rect x="0" y="5" width="2" height="2"/><rect x="10" y="5" width="2" height="2"/><rect x="1" y="1" width="2" height="2"/><rect x="9" y="1" width="2" height="2"/><rect x="1" y="9" width="2" height="2"/><rect x="9" y="9" width="2" height="2"/><rect x="3" y="2" width="6" height="1"/><rect x="2" y="3" width="8" height="6"/><rect x="3" y="9" width="6" height="1"/><rect x="5" y="5" width="2" height="2" fill="var(--surface)"/></svg>';
function renderTop(){
  return '<div class="top"><div class="brand">ИНФиК</div><div class="stats">'+
   (CHAT_URL?'<button class="stat chat'+(S.chatSeen?'':' new')+'" type="button" id="chatbtn" aria-label="Чат учеников" title="Чат учеников">'+I.chat+'</button>':'')+
   '<button class="stat fire'+(streakLit()?'':' off')+'" type="button" id="firebtn" aria-label="Огонёк: дней подряд" title="Огонёк">'+I.fire+streakNow()+'</button>'+
   '<button class="stat xp'+(S.newBadge?' new':'')+'" type="button" id="xpbtn" aria-label="Опыт и награды" title="Опыт и награды">'+I.xp+S.xp+' XP</button>'+
   '<button class="stat gear" type="button" id="gearbtn" aria-label="Настройки" title="Настройки">'+GEAR+'</button>'+
   (S.hintRewards||!S.xp?'':'<span class="xp-hint" aria-hidden="true">Награды теперь здесь 👆</span>')+'</div></div>';
}
/* «Спидран» скрыт, если сервер сказал speedrun:false (ученики платного курса); без ответа — виден.
   После итогов акции (3 ноября) вкладка пропадает у всех */
const SPEED_HIDE_AT=new Date("2026-11-01T00:00:00+03:00").getTime(); // акция «Спидран» закончилась
function speedOn(){ return Date.now()<SPEED_HIDE_AT && !(S.access && S.access.speedrun===false); }
function render(){
  if((S.tab==="speed" && !speedOn()) || (S.tab==="practice" && !practiceOn()) || (S.tab==="course" && !courseOn()) || (S.tab==="materials" && !MATERIALS_TAB) || S.tab==="badges") S.tab="path";
  const app=$("#app"); app.innerHTML="";
  app.insertAdjacentHTML("beforeend",renderTop());
  const xb=$("#xpbtn"); if(xb) xb.onclick=openRewards;
  const fb=$("#firebtn"); if(fb) fb.onclick=openStreak;
  const cb=$("#chatbtn"); if(cb) cb.onclick=openChat;
  const gb=$("#gearbtn"); if(gb) gb.onclick=openSettings;
  if(S.tab==="speed") renderSpeed(app); else if(S.tab==="practice") renderPractice(app); else if(S.tab==="league") renderLeague(app); else if(S.tab==="materials") renderMaterials(app); else if(S.tab==="course") renderCoursePage(app); else renderPath(app);
  const tabs=$("#tabs"); tabs.innerHTML="";
  [["path","Путь",tabIcon("path")],["speed","Спидран",tabIcon("fire")],["practice","Практика",tabIcon("code")],["materials","Материалы",tabIcon("book")],["league","Лига",tabIcon("trophy")],["course","Курс",tabIcon("cap")]].filter(([id])=>(id!=="speed"||speedOn())&&(id!=="practice"||practiceOn())&&(id!=="course"||courseOn())&&(id!=="materials"||MATERIALS_TAB)).forEach(([id,name,ic])=>{
    const b=h("button",{role:"tab","aria-selected":String(S.tab===id),type:"button"},ic+name);
    b.onclick=()=>{S.tab=id;save();render();window.scrollTo(0,0);}; tabs.appendChild(b); });
  demoBar();
}
/* пиксельные значки нижнего меню 12×12: # — цвет вкладки, o — акцент (жёлтый/розовый у выбранной) */
const TAB_PX={
 path:[".###........",".#o#........",".####.......",".....##.....",".......####.","........#o#.",".......####.",".....##.....","....#.......",".####.......",".#o#........",".###........"],
 fire:[".....#......",".....##.....","....###..#..","....####.#..","...#######..","..########..","..###o#####.",".###ooo####.",".##ooooo###.",".##ooooo###.","..##ooo###..","...######..."],
 code:["............","############","#..........#","#.#........#","#..#.......#","#...#......#","#..#.......#","#.#..oooo..#","#..........#","############","............","............"],
 book:["............",".##......##.","#..##..##..#","#.oo.##.oo.#","#....##....#","#.oo.##.oo.#","#....##....#","#.oo.##.oo.#","#....##....#",".##..##..##.","...##..##...","............"],
 trophy:["............","..########..","#.#o######.#","#.#o######.#",".##o#######.","...######...","....####....",".....##.....",".....##.....","...######...","...######...","............"],
 cap:["............",".....##.....","...######...",".##########.","############",".##########o","...######..o","...######..o","...######.oo","....####..oo","............","............"]
};
function tabIcon(k){ let r=""; TAB_PX[k].forEach((row,y)=>[...row].forEach((c,x)=>{ if(c!==".") r+='<rect'+(c==="o"?' class="ac"':'')+' x="'+x+'" y="'+y+'" width="1" height="1"/>'; }));
  return '<svg viewBox="0 0 12 12" shape-rendering="crispEdges" fill="currentColor" aria-hidden="true">'+r+'</svg>'; }
function renderPath(app){
  const d=daysToEge();
  app.appendChild(h("div",{class:"countdown"},'<b>'+d+'</b><span>'+plural(d,"день","дня","дней")+' до ЕГЭ <small style="opacity:.7">(≈ 1 июня)</small><br><em>успеваешь, если по уроку в день</em></span>'));
  if(!COURSE){ app.appendChild(h("div",{class:"sr-loading"},"<i></i>Загружаем курс")); return; }
  /* разделы: переключатель сверху. Раздел без уроков пока закрыт («скоро») */
  const SECS=COURSE.sections, hasLessons=sec=>sec.modules.some(m=>m.lessons);
  const sec=SECS.find(x=>x.id===S.sec)||SECS[0];
  const bar=h("div",{class:"secs",role:"tablist","aria-label":"Разделы курса"});
  SECS.forEach((x,i)=>{
    const tag=x.free&&!isStudent()?'<span class="free">Бесплатно</span>':x.tag&&!isStudent()?'<span class="free">'+esc(x.tag)+'</span>':!hasLessons(x)?'<span class="lk">'+I.lock+'</span>':"";
    const isNew=x.new&&!(S.secSeen&&S.secSeen[x.id])&&x!==sec; // значок «новое», пока раздел ни разу не открывали
    const b=h("button",{class:"sec",role:"tab","aria-selected":String(x===sec),type:"button"},(isNew?'<span class="sec-new">новое</span>':'')+'<small>Раздел '+(i+1)+tag+'</small><b>'+esc(x.title)+'</b>');
    b.onclick=()=>{ S.sec=x.id; save(); render(); }; bar.appendChild(b);
  });
  app.appendChild(bar);
  if(sec.new&&!(S.secSeen&&S.secSeen[sec.id])){ (S.secSeen||(S.secSeen={}))[sec.id]=1; try { localStorage.setItem(KEY, JSON.stringify(S)); } catch(e){} } // открыли раздел — значок больше не показываем
  if(!hasLessons(sec)) app.appendChild(h("section",{class:"sec-soon"},'<span class="ic">'+I.lock+'</span><div><b>'+esc(sec.title)+'</b><p>'+esc(sec.about)+'. Раздел скоро откроется.</p></div>'));
  /* модули сворачиваются: по умолчанию открыт только текущий, выбор ученика запоминаем в S.fold */
  const fold=S.fold||(S.fold={}), curM=sec.modules.find(m=>m.lessons&&m.lessons.some(p=>!S.done[p.id]));
  /* раздел ЕГЭ: закрытые задания — сеткой плиток после открытых модулей; платный модуль для не-ученика тоже закрыт */
  const egeLocked=sec.ege?sec.modules.filter(M=>!M.lessons||(M.paid&&!isStudent())):[];
  sec.modules.forEach((M,mi)=>{
    if(egeLocked.includes(M)) return;
    if(!M.lessons){ app.appendChild(h("div",{class:"locked-mod"},I.lock.replace("<svg",'<svg width="26" height="26"')+'<div><small>Модуль '+(mi+1)+'</small><b>'+esc(M.title)+'</b></div>'+(M.ege?'<span class="ege">'+esc(M.ege)+'</span>':""))); return; }
    const PATH=M.lessons, doneN=PATH.filter(p=>S.done[p.id]).length;
    const shut=M.id in fold?fold[M.id]:M!==curM;
    const mod=h("section",{class:"module"+(shut?" shut":"")},'<button class="fold" type="button" aria-expanded="'+!shut+'" aria-label="'+(shut?"Развернуть":"Свернуть")+' модуль"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="m6 9 6 6 6-6"/></svg></button><div class="eyebrow">'+(sec.ege&&M.task?"Задание "+M.task:"Модуль "+(mi+1))+' · '+doneN+' из '+PATH.length+'</div><h2>'+esc(M.title)+'</h2><p>'+esc(M.about||"")+'</p><div class="bar"><i style="width:'+(doneN/PATH.length*100)+'%"></i></div>'+moduleArt(M));
    mod.onclick=e=>{ if(e.target.closest(".mod-tools")) return; fold[M.id]=!shut; try { localStorage.setItem(KEY, JSON.stringify(S)); } catch(e){} render(); }; // без save(): сворачивание не прогресс, метку синхронизации не сдвигаем
    const cheat=PATH.filter(p=>S.done[p.id]&&p.file);
    const tools=h("div",{class:"mod-tools"});
    if(M.video){ const vb=h("button",{class:"cheat",type:"button"},I.play+"Видео"); vb.onclick=()=>openVideo(M); tools.appendChild(vb); }
    if(cheat.length){ const cb=h("button",{class:"cheat",type:"button"},"📖 Шпаргалка"); cb.onclick=()=>openCheatSheet(M,cheat); tools.appendChild(cb); }
    if(tools.children.length) mod.insertBefore(tools,mod.querySelector("img,.mod-art"));
    app.appendChild(mod);
    const path=h("div",{class:"path"});
    const offs=[0,-60,-80,-30,40,0];
    PATH.forEach((p,i)=>{
      const done=!!S.done[p.id]; const open=!done&&(isStudent()?i===PATH.findIndex(q=>!S.done[q.id]):(i===0||S.done[PATH[i-1].id])); // у ученика «Дальше» одно — на первом непройденном
      const free=!done&&!open&&isStudent(); // ученикам курса открыты все уроки; «Дальше» всё равно стоит на следующем по порядку
      const n=h("button",{class:"node"+(done?" done":open?" open":free?" free":"")+(p.boss?" boss":""),type:"button",style:"transform:translateX("+offs[i%offs.length]+"px)"});
      n.innerHTML=(open?'<span class="start">'+(i===0?"Начать":"Дальше")+'</span>':"")+'<span class="disc">'+lessonDisc(p,done,open||free)+'</span><span class="lbl">'+(i+1)+'. '+p.title+'</span>';
      n.onclick=()=>{ if(p.file&&(open||done||free||DEV)){ if(free) toast("Этот урок опирается на урок "+i+". Если что-то непонятно, загляни туда"); startLesson(p); } else if(open||free||DEV) toast("Урок в разработке"); else toast("Сначала пройди урок "+i); }; // DEV: любой урок без прохождения предыдущих
      path.appendChild(n);
    });
    if(!shut) app.appendChild(path);
    if(mi===0&&!sec.ege) app.appendChild(demoCta("path_"+sec.id,"Python — это половина ЕГЭ","Вторую половину разбираем с преподавателем. Первый урок бесплатно: задание №7 ЕГЭ."));
  });
  if(egeLocked.length) egeGrid(app,egeLocked);
  if(!hasLessons(sec)) app.appendChild(courseCta("path_"+sec.id,"Не жди — начни сейчас","На годовом курсе всё это уже есть: разберём все 27 заданий ЕГЭ с преподавателем."));
}
/* ---------- раздел ЕГЭ: закрытые задания ---------- */
function egeGrid(app,list){
  app.appendChild(h("div",{class:"ege-head"},'<b>Остальные задания</b><small>'+(isStudent()?"скоро":"для учеников курса")+'</small>'));
  const g=h("div",{class:"ege-grid"});
  list.forEach(M=>{ const t=h("button",{class:"ege-tile",type:"button","aria-label":"Задание "+M.task+": "+M.title},I.lock+'<b>'+esc(String(M.task))+'</b><span>'+esc(M.title)+'</span>');
    t.onclick=()=>openEgeLock(M); g.appendChild(t); });
  app.appendChild(g);
}
/* экран замка: главная кнопка — купить курс, вторая — демо с честной подписью, что задания откроет только покупка */
function egeLockBody(from,lead){
  const box=h("div",{class:"ege-lock"});
  box.appendChild(h("p",{class:"txt"},lead));
  if(COURSE_URL){ const b=h("button",{class:"main",type:"button"},"Открыть все задания — купить курс"); b.onclick=()=>{ haptic("success"); openCourse(from); }; box.appendChild(b); }
  if(typeof demoOn==="function"&&demoOn()){ const d=h("button",{class:"demo-alt",type:"button"},"Сначала попробовать курс бесплатно"); d.onclick=()=>openDemo(from); box.appendChild(d);
    box.appendChild(h("small",null,"Демо — это пробный доступ к занятиям курса с преподавателем. Задания ЕГЭ в приложении открываются после покупки курса.")); }
  return box;
}
function openEgeLock(M){
  if(isStudent()){ toast("Задание "+M.task+" скоро появится"); return; }
  haptic("warning");
  openSheet("Задание "+M.task+" — для учеников курса",egeLockBody("lock_ege"+M.task,"«"+M.title+"» и остальные задания ЕГЭ разбираем так же подробно, как задание 9. Они открыты ученикам годового курса."));
}
/* в конце босса задания ЕГЭ */
function egeOffer(from){
  if(isStudent()) return document.createDocumentFragment();
  const c=h("section",{class:"course-cta"},'<small>'+esc(COURSE_NAME)+'</small><b>Одно задание ЕГЭ ты уже умеешь</b>');
  c.appendChild(egeLockBody(from,"Осталось ещё 26. На курсе разбираем их все с преподавателем."));
  return c;
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
/* пьедестал: пиксельные коты трёх расцветок (по имени), корона у первого */
const PD_PAL=[null,{D:"#a8501f",S:"#d9772f",M:"#f0a050",A:"#f7c48a"},{D:"#4b4f6b",S:"#6e7391",M:"#9599b3",A:"#c3c6da"}];
const PD_CROWN='<svg class="crown" viewBox="0 0 15 10" shape-rendering="crispEdges" aria-hidden="true"><g fill="#ecf141"><rect x="0" y="2" width="2" height="2"/><rect x="6" y="0" width="3" height="2"/><rect x="13" y="2" width="2" height="2"/><rect x="1" y="4" width="2" height="2"/><rect x="6" y="2" width="3" height="2"/><rect x="12" y="4" width="2" height="2"/><rect x="1" y="6" width="13" height="2"/><rect x="3" y="5" width="9" height="1"/><rect x="5" y="4" width="5" height="1"/></g><g fill="#ff6b9a"><rect x="7" y="6" width="1" height="1"/></g><g fill="#262b69"><rect x="1" y="8" width="13" height="2"/></g><g fill="#a9b62a"><rect x="2" y="8" width="11" height="1"/></g></svg>';
/* мордочки для мест 1–3: заменяют прямоугольник x 6…23, y 11…21 у кота CAT_PX */
const PD_FACE={
 1:["AAAAAAAAAAAAAAAAAA","AAAAAAAAAAAAAAAAAA","AAANAAAAAAAAANAAAA","AANANAAAAAAANANAAA","ANAAANAAAAANAAANAA","AAAAAAAAAAAAAAAAAA",
    "KKAAAAAAKAAAAAAKKA","AAAAANNNNNNNAAAAAA","AAAAANKKKKKNAAAAAA","AAAAAANKKKNAAAAAAA","AAAAAAANNNAAAAAAAA"], // счастливый
 2:["AAAAAAAAAAAAAAAAAA","AAAAAAAAAAANNNNAAA","AAAAAAAAAANWWNNNAA","ANAAANAAAANWNNNNAA","AANNNAAAAANNNNNNAA","AAAAAAAAAAANNNNAAA",
    "KKAAAAAAKAAAAAAKKA","AAAAANAANAANAAAAAA","AAAAAANNANNAAAAAAA","AAAAAAAAKKAAAAAAAA","AAAAAAAAAAAAAAAAAA"], // подмигивает
 3:["AAAAAAAAAAAAAAAAAA","AANNNNAAAAAANNNNAA","ANWWNNNAAAANWWNNNA","ANWNNNNAAAANWNNNNA","ANNNNNNAAAANNNNNNA","AANNNNAAAAAANNNNAA",
    "KKAAAAAAKKAAAAAKKA","AAAAAAAANNAAAAAAAA","AAAAAAANAANAAAAAAA","AAAAAAAANNAAAAAAAA","AAAAAAAAAAAAAAAAAA"]  // удивлённый
};
const PD_CAT={};
function podiumCat(v,place){
  const key=v+"_"+place; if(PD_CAT[key]) return PD_CAT[key];
  let url=CAT;
  try { if(typeof CAT_PX==="undefined") return CAT;
    const W=30,H=26,c=document.createElement("canvas"); c.width=W; c.height=H; const g=c.getContext("2d"), pal=Object.assign({},CAT_PAL,PD_PAL[v]||{}), face=PD_FACE[place];
    for(let y=0;y<H;y++) for(let x=0;x<W;x++){
      let ch=(CAT_PX[y]||"")[x];
      if(face&&y>=11&&y<=21&&x>=6&&x<=23) ch=face[y-11][x-6];
      if(ch&&ch!=="."&&ch!=="L"&&!(ch==="D"&&x>=22)){ /* L и D справа — кусок таблички с хвоста, на пьедестале не нужен */ g.fillStyle=pal[ch]; g.fillRect(x,y,1,1); } }
    url=c.toDataURL(); } catch(e){}
  return PD_CAT[key]=url;
}
function podium(top){
  const box=h("div",{class:"podium"});
  [2,1,3].forEach(place=>{
    const r=top.find(x=>x.rank===place);
    if(!r){ box.appendChild(h("div",{class:"pd empty p"+place},'<span class="nm">&nbsp;</span><span class="pxp">свободно</span><div class="blk">'+place+'</div>')); return; }
    const n=String(r.name||"?"), v=[...n].reduce((s,ch)=>s+ch.charCodeAt(0),0)%3;
    box.appendChild(h("div",{class:"pd p"+place+(r.me?" me":"")},(place===1?PD_CROWN:"")+'<img class="ava" src="'+podiumCat(v,place)+'" alt=""><span class="nm">'+esc(n)+(r.me?" (ты)":"")+'</span><span class="pxp">'+r.xp+' XP</span><div class="blk">'+place+'</div>'));
  });
  return box;
}
function leagueTable(box,st){
  box.innerHTML="";
  box.appendChild(h("div",{class:"lg-left"},I.flame+'<span>'+leagueLeft(st.endsAt-Date.now())+'</span>'+(st.players?'<small>'+st.players+' '+plural(st.players,"участник","участника","участников")+'</small>':"")));
  if(!st.me.rank) box.appendChild(h("div",{class:"sr-note"},"<b>Тебя пока нет в таблице.</b> Пройди урок, чтобы попасть в таблицу этой недели."));
  if(st.leaders.length){
    box.appendChild(podium(st.leaders.filter(r=>r.rank<=3)));
    const t=h("div",{class:"league"}), rest=st.leaders.filter(r=>r.rank>3);
    rest.forEach(r=>t.appendChild(leagueRow(r)));
    if(st.me.rank&&!st.leaders.some(r=>r.me)){ t.appendChild(h("div",{class:"row gap"},"…")); t.appendChild(leagueRow(Object.assign({me:true},st.me))); }
    if(t.children.length) box.appendChild(t);
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

