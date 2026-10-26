/* Запуск приложения */
if(Date.now()<new Date(2026,10,3).getTime()) S.tab="speed"; // во время акции открываемся на «Спидране»
render();
fetch("content/course.json",{cache:"no-cache"}).then(r=>r.json()).then(c=>{ COURSE=c; if(!LS&&!SR) render(); })
  .catch(()=>toast("Не получилось загрузить курс. Проверь интернет"));
