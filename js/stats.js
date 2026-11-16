/* Статистика: что ученик делает в приложении. Сервер пишет это в лист «События» (server/Stats.gs).
   Отправляем пачками фоном; без интернета копим в localStorage и досылаем при следующем запуске.
   Ничего не ждём и ошибок не показываем: статистика не должна мешать учиться. */
const EV_KEY="infik-ev-v1";
let EV_Q=(()=>{ try { return JSON.parse(localStorage.getItem(EV_KEY))||[]; } catch(e){ return []; } })();
let EV_T=null, EV_BUSY=false;
const statsOn=()=>!!(API_URL&&tg&&tg.initData);
function evSave(){ try { localStorage.setItem(EV_KEY, JSON.stringify(EV_Q.slice(-200))); } catch(e){} }
/* t — код события (open, lesson_start, lesson_done, lesson_quit, task_start, task_done), w — id урока или задачи */
function track(t,w,extra){
  if(!statsOn()) return;
  EV_Q.push(Object.assign({t,w:w||""},extra||{})); evSave();
  clearTimeout(EV_T); EV_T=setTimeout(evFlush,2500);
}
function evFlush(){
  if(EV_BUSY||!EV_Q.length||!statsOn()) return;
  EV_BUSY=true; const pack=EV_Q.slice(0,20);
  api("stats_event",{ev:pack,grade:S.grade||""},2)
    .then(r=>{ if(r&&r.ok){ EV_Q=EV_Q.slice(pack.length); evSave(); } })
    .catch(()=>{})
    .finally(()=>{ EV_BUSY=false; if(EV_Q.length) EV_T=setTimeout(evFlush,5000); });
}
/* «вход» — один раз в день: так видно, сколько человек вообще открывали приложение */
(function(){
  if(!statsOn()) return;
  let last=""; try { last=localStorage.getItem(EV_KEY+"-open")||""; } catch(e){}
  if(last!==today()){ try { localStorage.setItem(EV_KEY+"-open",today()); } catch(e){} track("open"); }
  else if(EV_Q.length) EV_T=setTimeout(evFlush,3000); // досылаем то, что не ушло в прошлый раз
})();
/* при сворачивании приложения стараемся отправить сразу */
document.addEventListener("visibilitychange",()=>{ if(document.visibilityState==="hidden"){ clearTimeout(EV_T); evFlush(); } });
