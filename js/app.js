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
   '<span class="stat" title="Опыт">'+I.xp+S.xp+' XP</span></div></div>';
}
function render(){
  const app=$("#app"); app.innerHTML="";
  app.insertAdjacentHTML("beforeend",renderTop());
  if(S.tab==="path") renderPath(app); else if(S.tab==="speed") renderSpeed(app); else if(S.tab==="league") renderLeague(app); else renderBadges(app);
  const tabs=$("#tabs"); tabs.innerHTML="";
  [["path","Путь",I.path],["speed","Спидран",I.fire],["league","Лига",I.trophy],["badges","Награды",I.medal]].forEach(([id,name,ic])=>{
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
    const tag=x.free?'<span class="free">Бесплатно</span>':!hasLessons(x)?'<span class="lk">'+I.lock+'</span>':"";
    const b=h("button",{class:"sec",role:"tab","aria-selected":String(x===sec),type:"button"},'<small>Раздел '+(i+1)+tag+'</small><b>'+esc(x.title)+'</b>');
    b.onclick=()=>{ S.sec=x.id; save(); render(); }; bar.appendChild(b);
  });
  app.appendChild(bar);
  if(!hasLessons(sec)) app.appendChild(h("section",{class:"sec-soon"},'<span class="ic">'+I.lock+'</span><div><b>'+esc(sec.title)+'</b><p>'+esc(sec.about)+'. Раздел скоро откроется.</p></div>'));
  sec.modules.forEach((M,mi)=>{
    if(!M.lessons){ app.appendChild(h("div",{class:"locked-mod"},I.lock.replace("<svg",'<svg width="26" height="26"')+'<div><small>Модуль '+(mi+1)+'</small><b>'+esc(M.title)+'</b></div>'+(M.ege?'<span class="ege">'+esc(M.ege)+'</span>':""))); return; }
    const PATH=M.lessons, doneN=PATH.filter(p=>S.done[p.id]).length;
    app.appendChild(h("section",{class:"module"},'<div class="eyebrow">Модуль '+(mi+1)+' · '+doneN+' из '+PATH.length+'</div><h2>'+esc(M.title)+'</h2><p>'+esc(M.about||"")+'</p><div class="bar"><i style="width:'+(doneN/PATH.length*100)+'%"></i></div><img src="'+CAT+'" alt="">'));
    const path=h("div",{class:"path"});
    const offs=[0,-60,-80,-30,40,0];
    PATH.forEach((p,i)=>{
      const done=!!S.done[p.id]; const open=!done&&(i===0||S.done[PATH[i-1].id]);
      const n=h("button",{class:"node"+(done?" done":open?" open":"")+(p.boss?" boss":""),type:"button",style:"transform:translateX("+offs[i%offs.length]+"px)"});
      n.innerHTML=(open?'<span class="start">'+(i===0?"Начать":"Дальше")+'</span>':"")+'<span class="disc">'+lessonDisc(p,done,open)+'</span><span class="lbl">'+(i+1)+'. '+p.title+'</span>';
      n.onclick=()=>{ if(p.file&&(open||done)) startLesson(p); else if(open) toast("Этот урок появится в следующей версии прототипа"); else toast("Сначала пройди урок "+i); };
      path.appendChild(n);
    });
    app.appendChild(path);
    if(mi===0) app.appendChild(courseCta("path_"+sec.id,"Весь ЕГЭ, а не только Python","Здесь ты знакомишься с Python. На годовом курсе разберём все 27 заданий ЕГЭ с преподавателем — от первого до последнего."));
  });
  if(!hasLessons(sec)) app.appendChild(courseCta("path_"+sec.id,"Не жди — начни сейчас","На годовом курсе всё это уже есть: разберём все 27 заданий ЕГЭ с преподавателем."));
}
const RIVALS=[["Даня К.",412],["Алиса",355],["Тимур",298],["Соня В.",240],["Max_coder",187],["Ева",150],["Артём",96],["Лиза П.",61],["Гоша",24]];
function renderLeague(app){
  app.appendChild(h("h1",{class:"page"},"Бронзовая лига"));
  app.appendChild(h("p",{class:"sub"},"Неделя заканчивается в воскресенье. Первые 3 поднимаются в Серебряную лигу."));
  const all=RIVALS.map(r=>({n:r[0],xp:r[1]})).concat([{n:TG_USER&&TG_USER.first_name?TG_USER.first_name+" (ты)":"Ты",xp:S.xp,me:true}]).sort((a,b)=>b.xp-a.xp);
  const box=h("div",{class:"league"}); const cols=["#ecf141","#cfeb62","#a5a9e3","#c9b8f5","#f5b8d1"];
  all.forEach((r,i)=>{ if(i===3) box.appendChild(h("div",{class:"zone"},"↑ Зона повышения"));
    box.appendChild(h("div",{class:"row"+(r.me?" me":"")},'<span class="pos">'+(i+1)+'</span><span class="ava" style="background:'+(r.me?"#512da8":cols[i%cols.length])+';color:'+(r.me?"#ecf141":"#262b69")+'">'+r.n[0]+'</span><span class="name">'+esc(r.n)+'</span><span class="xp">'+r.xp+' XP</span>')); });
  app.appendChild(box);
  app.appendChild(h("p",{class:"note"},"В прототипе соперники выдуманные. Твой прогресс "+(cloud?"сохраняется в твоём аккаунте Telegram.":"сохраняется в этом браузере. Открой приложение в Telegram, чтобы он привязался к аккаунту.")+" Настоящий рейтинг появится вместе с бэкендом."));
}
function renderBadges(app){
  app.appendChild(h("h1",{class:"page"},"Награды"));
  const g=h("div",{class:"badges"});
  BADGES.forEach(b=>g.appendChild(h("div",{class:"badge"+(S.badges[b.id]?" on":"")},'<span class="ic">'+I[b.ic]+'</span><b>'+b.title+'</b><small>'+b.hint+'</small>')));
  app.appendChild(g);
  const r=h("button",{class:"reset",type:"button"},"Сбросить прогресс прототипа");
  r.onclick=()=>{ if(r.dataset.sure){ Object.assign(S,{xp:0,streak:0,lastDay:null,done:{},badges:{}}); save(); render(); toast("Прогресс сброшен"); } else { r.dataset.sure=1; r.textContent="Нажми ещё раз, чтобы сбросить"; } };
  app.appendChild(r);
}

