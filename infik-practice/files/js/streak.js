/* Огонёк (серия дней) и вопрос «В каком ты классе?».
   Огонёк продлевает любой пройденный урок или решённая задача из «Практики».
   Пропустил день — огонёк гаснет. Сервер (Streak.gs) знает день и серию, чтобы бот напомнил в 18:00 МСК. */

function dayKey(shift){ const d=new Date(); d.setDate(d.getDate()+(shift||0)); return d.getFullYear()+"-"+(d.getMonth()+1)+"-"+d.getDate(); }
/* серия на сегодня: если вчера и сегодня занятий не было, огонёк погас */
function streakNow(){ return (S.lastDay===today()||S.lastDay===dayKey(-1))?(S.streak||0):0; }
function streakLit(){ return S.lastDay===today(); }
/* дни с занятиями; у старых учеников списка нет, восстанавливаем по серии */
function streakDays(){
  if(S.days&&S.days.length) return new Set(S.days);
  const set=new Set(); if(!S.lastDay) return set;
  const [y,m,d]=S.lastDay.split("-").map(Number);
  for(let i=0;i<Math.min(S.streak||0,60);i++){ const x=new Date(y,m-1,d-i); set.add(x.getFullYear()+"-"+(x.getMonth()+1)+"-"+x.getDate()); }
  return set;
}
/* вызывать, когда урок пройден или задача решена. save() делает тот, кто вызвал */
function bumpStreak(){
  const t=today(); if(S.lastDay===t) return false;
  const days=[...streakDays()];
  S.streak=S.lastDay===dayKey(-1)?(S.streak||0)+1:1; S.lastDay=t;
  S.days=days.concat(t).slice(-60); S.best=Math.max(S.best||0,S.streak);
  streakPing();
  return true;
}
function streakGive(give){ [[3,"s3"],[7,"s7"],[14,"s14"],[30,"s30"]].forEach(([n,id])=>{ if(S.streak>=n) give(id); }); }

/* сервер: день и серия для напоминаний. Фоном, ошибки молча пропускаем */
const streakSrv=()=>!!(API_URL&&tg&&tg.initData);
function streakPing(){
  if(!streakSrv()) return;
  api("streak_ping",{streak:S.streak||0,grade:S.grade||""},2).then(r=>{ if(r&&typeof r.remind==="boolean"){ S.remind=r.remind; try { localStorage.setItem(KEY, JSON.stringify(S)); } catch(e){} } }).catch(()=>{});
}

/* шторка «Огонёк» по нажатию на огонёк вверху */
function openStreak(){
  const n=streakNow(), lit=streakLit(), box=h("div",{class:"stk"});
  box.appendChild(h("div",{class:"stk-big"+(lit?"":" off")},I.flame+'<b>'+n+'</b><span>'+(n?plural(n,"день","дня","дней")+" подряд":"огонёк не горит")+'</span>'));
  const days=streakDays(), row=h("div",{class:"stk-week"}), WD=["вс","пн","вт","ср","чт","пт","сб"];
  for(let i=6;i>=0;i--){ const d=new Date(); d.setDate(d.getDate()-i); const k=dayKey(-i);
    row.appendChild(h("div",{class:(days.has(k)?"on":"")+(i===0?" now":"")},'<i>'+(days.has(k)?I.flame:"")+'</i><small>'+(i===0?"сегодня":WD[d.getDay()])+'</small>')); }
  box.appendChild(row);
  box.appendChild(h("p",{class:"stk-tx"},lit?"Огонёк сегодня горит! Завтра пройди урок или реши задачу, и серия продолжится."
    :n?"Пройди урок или реши задачу сегодня, иначе в полночь огонёк погаснет."
    :"Пройди урок или реши любую задачу, и огонёк загорится. Занимайся каждый день, чтобы он не гас."));
  if(S.best>1) box.appendChild(h("p",{class:"note"},"Лучшая серия: "+S.best+" "+plural(S.best,"день","дня","дней")));
  let sh;
  if(!lit){ const go=h("button",{class:"main",type:"button"},practiceOn()?"Задача дня":"Продолжить учиться");
    go.onclick=()=>{ sh.close(); S.tab=practiceOn()?"practice":"path"; save(); render(); window.scrollTo(0,0); }; box.appendChild(go); }
  if(streakSrv()){
    const on=S.remind!==false, lab=h("label",{class:"stk-rem"},'<input type="checkbox"'+(on?" checked":"")+'><span><b>Напоминать в 18:00</b><small>Бот напишет, если огонёк ещё не горит. Время московское</small></span>');
    lab.querySelector("input").onchange=e=>{ const v=e.target.checked; S.remind=v; try { localStorage.setItem(KEY, JSON.stringify(S)); } catch(err){}
      api("streak_remind",{on:v},2).then(()=>toast(v?"Бот напомнит в 18:00":"Больше не напоминаем")).catch(()=>{ toast("Не получилось сохранить, проверь интернет"); e.target.checked=!v; S.remind=!v; }); };
    box.appendChild(lab);
  }
  sh=openSheet("Огонёк",box);
}

/* ---------- один раз спрашиваем класс ---------- */
const GRADES=[["7","7 класс"],["8","8 класс"],["9","9 класс"],["10","10 класс"],["11","11 класс"],["out","Уже не в школе"]];
function maybeAskGrade(){
  if(S.grade||S.gradeAsked) return;
  /* на новом устройстве ответ мог прийти из облака Telegram: сначала проверяем его */
  if(cloud){ try { cloud.getItem("progress",(err,val)=>{ let o=null; try { o=JSON.parse(val||"null"); } catch(e){}
    if(o&&(o.grade||o.gradeAsked)){ S.grade=o.grade; S.gradeAsked=true; return; } askGrade(); }); return; } catch(e){} }
  askGrade();
}
function askGrade(){
  if(S.grade||S.gradeAsked||LS||PR) return;
  S.gradeAsked=true; save(); // спрашиваем один раз, даже если закрыли без ответа
  const box=h("div",{class:"grade"},'<img src="'+CAT+'" alt=""><p>Спрошу один раз. Так я пойму, какие задачи и материалы тебе нужнее.</p>');
  const g=h("div",{class:"grade-list"}); let sh;
  GRADES.forEach(([v,t])=>{ const b=h("button",{type:"button","aria-label":t},v==="out"?t:v+"<small>класс</small>"); b.onclick=()=>{ S.grade=v; save(); haptic("success"); sh.close(); toast("Мур, спасибо! 🐱");
    if(streakSrv()) api("streak_grade",{grade:v},2).catch(()=>{}); }; g.appendChild(b); });
  box.appendChild(g);
  sh=openSheet("В каком ты классе?",box);
}
