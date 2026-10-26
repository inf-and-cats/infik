/* ИНФиК: общие вещи — Telegram, иконки, сохранение прогресса, помощники */
const CAT = "assets/infik.png";
let COURSE = null; // структура курса из content/course.json
const tg = window.Telegram && window.Telegram.WebApp;
if (tg) { try { tg.ready(); tg.expand(); } catch(e){} }
function haptic(kind){ try { tg && tg.HapticFeedback && tg.HapticFeedback.notificationOccurred(kind); } catch(e){} }

/* ---------- icons ---------- */
const I = {
  fire:'<svg viewBox="0 0 10 12" shape-rendering="crispEdges"><g fill="#512da8"><rect x="4" y="0" width="1" height="2"/><rect x="6" y="1" width="1" height="2"/><rect x="3" y="2" width="4" height="2"/><rect x="2" y="4" width="6" height="2"/><rect x="1" y="6" width="8" height="5"/><rect x="2" y="11" width="6" height="1"/></g><g fill="#ecf141"><rect x="4" y="6" width="2" height="1"/><rect x="3" y="7" width="4" height="4"/></g></svg>',
  xp:'<svg viewBox="0 0 10 10" shape-rendering="crispEdges"><g fill="#ecf141" stroke="#262b69" stroke-width=".6"><path d="M5 .5 6.3 3.6 9.5 3.8 7 6 7.8 9.4 5 7.6 2.2 9.4 3 6 .5 3.8 3.7 3.6Z"/></g></svg>',
  lock:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><rect x="5" y="11" width="14" height="10" rx="2.5" fill="currentColor" fill-opacity=".15"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/></svg>',
  play:'<svg viewBox="0 0 24 24" fill="currentColor"><path d="M8 5.5v13a1 1 0 0 0 1.5.86l10.5-6.5a1 1 0 0 0 0-1.72L9.5 4.64A1 1 0 0 0 8 5.5Z"/></svg>',
  check:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="m5 12.5 4.5 4.5L19 7.5"/></svg>',
  crown:'<svg viewBox="0 0 24 24" fill="currentColor"><path d="M3 8l4.5 4L12 5l4.5 7L21 8l-2 11H5Z"/></svg>',
  brackets:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="m8 7-5 5 5 5M16 7l5 5-5 5M13.5 5l-3 14"/></svg>',
  bug:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><rect x="7" y="7" width="10" height="13" rx="5" fill="currentColor" fill-opacity=".15"/><path d="M9 7a3 3 0 0 1 6 0M3 13h4M17 13h4M4 7l3 2M20 7l-3 2M4 19l3-2M20 19l-3-2M12 11v9"/></svg>',
  star:'<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2.8 14.8 9l6.7.6-5.1 4.4 1.6 6.6L12 17.1l-6 3.5 1.6-6.6-5.1-4.4L9.2 9Z"/></svg>',
  flame:'<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2c1 4 5 5.5 5 11a5 5 0 0 1-10 0c0-2.4 1.2-3.9 2.5-5 .2 2 1 3 2 3.2C11 8.5 11 5 12 2Z"/></svg>',
  medal:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linejoin="round"><path d="M8 2h8l-2 6h-4Z"/><circle cx="12" cy="15" r="6" fill="currentColor" fill-opacity=".15"/><path d="M12 12v6M10 13.5l2-1.5"/></svg>',
  path:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><circle cx="7" cy="5" r="2.5"/><circle cx="17" cy="12" r="2.5"/><circle cx="7" cy="19" r="2.5"/><path d="M9.3 6.2 14.7 10.8M14.7 13.2 9.3 17.8"/></svg>',
  trophy:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M7 4h10v5a5 5 0 0 1-10 0Z"/><path d="M7 6H4a3 3 0 0 0 3 4M17 6h3a3 3 0 0 1-3 4M12 14v4M8 21h8"/></svg>',
  close:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round"><path d="M6 6l12 12M18 6 6 18"/></svg>',
  blocks:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><rect x="3" y="4" width="8" height="6" rx="2"/><rect x="13" y="4" width="8" height="6" rx="2"/><rect x="3" y="14" width="12" height="6" rx="2"/></svg>',
  kbd:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><rect x="2.5" y="6" width="19" height="12" rx="2.5"/><path d="M6 10h.01M10 10h.01M14 10h.01M18 10h.01M8 14h8"/></svg>'
};

/* ---------- storage ---------- */
const KEY = "infik-proto-v1";
function load(){ try { return JSON.parse(localStorage.getItem(KEY)) || {}; } catch(e){ return {}; } }
/* Progress lives in localStorage and, inside Telegram, also in Telegram CloudStorage (tied to the account, synced across devices). */
const cloud = (tg && tg.CloudStorage && tg.isVersionAtLeast && tg.isVersionAtLeast("6.9")) ? tg.CloudStorage : null;
const SYNC_KEYS=["xp","streak","lastDay","done","badges","mode","at"];
function save(){
  S.at=Date.now();
  try { localStorage.setItem(KEY, JSON.stringify(S)); } catch(e){}
  if(cloud){ const o={}; SYNC_KEYS.forEach(k=>o[k]=S[k]); try { cloud.setItem("progress", JSON.stringify(o), function(){}); } catch(e){} }
}
const S = Object.assign({ xp:0, streak:0, lastDay:null, done:{}, badges:{}, mode:"blocks", tab:"path", at:0 }, load());
const TG_USER = (tg && tg.initDataUnsafe && tg.initDataUnsafe.user) || null;
/* годмод: разработчик из DEV_IDS в Telegram или локальный запуск (localhost) */
const DEV = (TG_USER && DEV_IDS.includes(TG_USER.id)) || ["localhost","127.0.0.1"].includes(location.hostname);
if(cloud){ try { cloud.getItem("progress", function(err,val){
  if(err||!val) return; let o; try { o=JSON.parse(val); } catch(e){ return; }
  if((o.at||0)>(S.at||0)){ SYNC_KEYS.forEach(k=>{ if(o[k]!==undefined) S[k]=o[k]; }); try { localStorage.setItem(KEY, JSON.stringify(S)); } catch(e){} if(!LS) render(); }
}); } catch(e){} }


/* ---------- helpers ---------- */
const $=s=>document.querySelector(s);
function h(tag,attrs,html){ const e=document.createElement(tag); if(attrs) for(const k in attrs){ if(k==="class") e.className=attrs[k]; else if(k.startsWith("on")) e.addEventListener(k.slice(2),attrs[k]); else e.setAttribute(k,attrs[k]); } if(html!=null) e.innerHTML=html; return e; }
let toastT; function toast(msg){ const t=$("#toast"); t.textContent=msg; t.hidden=false; clearTimeout(toastT); toastT=setTimeout(()=>t.hidden=true,2200); }
function today(){ const d=new Date(); return d.getFullYear()+"-"+(d.getMonth()+1)+"-"+d.getDate(); }
function daysToEge(){ const ege=new Date(2027,5,1); return Math.max(0,Math.ceil((ege-new Date())/864e5)); }
function plural(n,a,b,c){ n=Math.abs(n)%100; const n1=n%10; if(n>10&&n<20) return c; if(n1>1&&n1<5) return b; if(n1===1) return a; return c; }

/* ---------- годовой курс: кнопка покупки ---------- */
/* Внутри Telegram ссылка открывается во внешнем браузере, иначе — в новой вкладке. from — где нажали (метка utm_content для аналитики). */
function openCourse(from){
  if(!COURSE_URL) return;
  let url=COURSE_URL;
  try { const u=new URL(COURSE_URL); if(!u.searchParams.has("utm_source")){ u.searchParams.set("utm_source","infik_app"); u.searchParams.set("utm_content",from||"app"); } url=u.toString(); } catch(e){}
  try { if(tg&&tg.openLink){ tg.openLink(url); return; } } catch(e){}
  window.open(url,"_blank","noopener");
}
/* карточка-приглашение на курс; title и text — заголовок и пояснение под конкретное место */
function courseCta(from,title,text){
  if(!COURSE_URL) return document.createDocumentFragment();
  const c=h("section",{class:"course-cta"},'<small>'+esc(COURSE_NAME)+'</small><b>'+title+'</b><p>'+text+'</p>');
  const b=h("button",{class:"main",type:"button"},"Купить курс"); b.onclick=()=>{ haptic("success"); openCourse(from); };
  c.appendChild(b); return c;
}
