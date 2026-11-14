/* Бесплатный демо-доступ к курсу ЕГЭ на платформе StudyCats.
   Плашка над нижним меню видна на всех экранах. Карточки после уроков и задач ведут туда же.
   По нажатию — шторка «3 шага, платить не нужно», потом переход по DEMO_URL с меткой. Пустой DEMO_URL — ничего не показываем. */
const demoOn=()=>!!DEMO_URL && !isStudent();
/* после нажатия «Получить бесплатно» плашка прячется на 3 дня, потом возвращается (вдруг не дошёл до конца) */
const DEMO_PAUSE=3*24*3600e3;
const demoBarOn=()=>demoOn() && !(S.demoAt && Date.now()-S.demoAt<DEMO_PAUSE);
function demoLink(from){
  let url=DEMO_URL;
  try { const u=new URL(DEMO_URL); if(!u.searchParams.has("utm_source")){ u.searchParams.set("utm_source","infik_app"); u.searchParams.set("utm_content",from||"app"); } url=u.toString(); } catch(e){}
  return url;
}
/* счётчик нажатий: строка в лист «Демо» (Demo.gs). sendBeacon доходит, даже если Telegram сразу уводит в браузер */
function demoLog(ev,from){
  if(!(API_URL&&tg&&tg.initData)) return;
  const body=JSON.stringify({action:"demo_click",initData:tg.initData,ev,from:from||"",grade:S.grade||""});
  try { if(navigator.sendBeacon && navigator.sendBeacon(API_URL,new Blob([body],{type:"text/plain;charset=utf-8"}))) return; } catch(e){}
  try { fetch(API_URL,{method:"POST",body,headers:{"Content-Type":"text/plain;charset=utf-8"},keepalive:true}).catch(()=>{}); } catch(e){}
}
function openDemo(from){
  demoLog("open",from);
  if(!S.demoSeen){ S.demoSeen=true; save(); document.body.classList.remove("demo-new"); }
  const box=h("div",{class:"dm"});
  box.appendChild(h("div",{class:"dm-hero"},'<img src="'+CAT+'" alt=""><div><small>Бесплатно</small><b>Урок ЕГЭ с преподавателем</b><span>Разберём задание №7: кодирование информации. Урок остаётся у тебя навсегда</span></div>'));
  box.appendChild(h("ol",{class:"dm-steps"},
    '<li><span>Нажми кнопку <b>«Получить бесплатно»</b> ниже</span></li>'+
    '<li><span><b>Зарегистрируйся</b> на платформе</span></li>'+
    '<li><span><b>Купи курс за 0 ₽</b>. Платить ничего не нужно</span></li>'));
  box.appendChild(h("figure",{class:"dm-cart"},'<img src="assets/demo-cart.png" alt="Корзина: к оплате 0 ₽"><figcaption>Так выглядит корзина на платформе</figcaption>'));
  const go=h("button",{class:"main",type:"button"},"Получить бесплатно");
  box.appendChild(go);
  box.appendChild(h("p",{class:"note"},"Платформа откроется в браузере. Там же можно посмотреть и полный курс."));
  const sh=openSheet("Бесплатный урок",box);
  go.onclick=()=>{ haptic("success"); const url=demoLink(from);
    demoLog("go",from); S.demoAt=Date.now(); save(); demoBar();
    try { if(tg&&tg.openLink){ tg.openLink(url); sh.close(); return; } } catch(e){} window.open(url,"_blank","noopener"); sh.close(); };
}
/* пиксельный подарок в правом нижнем углу (вместо широкой плашки): рисуется заново при каждом render() */
const DM_GIFT=(()=>{ const g=["..KK....KK..",".K..K..K..K.",".K...KK...K.","..KKKKKKKK..","NNNNNKKNNNNN","NLLLLKKLLLLN","NNNNNKKNNNNN",".NLLLKKLLLN.",".NLLLKKLLLN.",".NLLLKKLLLN.",".NLLLKKLLLN.",".NNNNNNNNNN."], C={N:"#262b69",L:"#ecf141",K:"#ff6b9a"};
  let r=""; g.forEach((row,y)=>[...row].forEach((c,x)=>{ if(c!==".") r+='<rect x="'+x+'" y="'+y+'" width="1" height="1" fill="'+C[c]+'"/>'; }));
  return '<svg viewBox="0 0 12 12" shape-rendering="crispEdges" aria-hidden="true">'+r+'</svg>'; })();
function demoBar(){
  let bar=$("#demobar");
  if(!demoBarOn()){ if(bar) bar.remove(); document.body.classList.remove("has-demo"); return; }
  if(!bar){ bar=h("button",{id:"demobar",class:"dm-fab",type:"button","aria-label":"Бесплатный урок ЕГЭ с преподавателем"},DM_GIFT); bar.onclick=()=>openDemo("bar_"+S.tab); document.body.appendChild(bar); }
  document.body.classList.add("has-demo"); document.body.classList.toggle("demo-new",!S.demoSeen);
}
/* карточка вместо «Купить курс»: после урока, на Пути, после задачи */
function demoCta(from,title,text){
  if(!demoOn()) return document.createDocumentFragment();
  const c=h("section",{class:"dm-card"},'<small>🎁 Бесплатно</small><b>'+title+'</b><p>'+text+'</p>');
  const b=h("button",{class:"main",type:"button"},"Забрать бесплатный урок"); b.onclick=()=>openDemo(from);
  c.appendChild(b); return c;
}
