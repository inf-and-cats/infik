/* Запуск приложения */
if(Date.now()<new Date(2026,10,3).getTime() && speedOn()) S.tab="speed"; // во время акции открываемся на «Спидране»
render();
/* доступ: ученикам платного курса «Спидран» не показываем. Ответ сервера главнее сохранённого; ошибки молча пропускаем */
if(API_URL && tg && tg.initData) api("access").then(a=>{
  const was=speedOn(), wasStudent=isStudent();
  S.access={student:!!a.student, speedrun:a.speedrun!==false, allSections:a.allSections!==false};
  try { localStorage.setItem(KEY, JSON.stringify(S)); } catch(e){} // без save(): не сдвигаем метку синхронизации прогресса
  if((was!==speedOn() || wasStudent!==isStudent()) && !LS && !SR) render();
}).catch(()=>{});
fetch("content/course.json",{cache:"no-cache"}).then(r=>r.json()).then(c=>{ COURSE=c; if(!LS&&!SR) render(); })
  .catch(()=>toast("Не получилось загрузить курс. Проверь интернет"));
