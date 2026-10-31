/* Материалы (PDF через бота), видео модуля и шторка наград */
I.cap='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M2.5 9 12 4.5 21.5 9 12 13.5Z" fill="currentColor" fill-opacity=".15"/><path d="M6.5 11v5c3.3 2.2 7.7 2.2 11 0v-5M21.5 9v5"/></svg>';
I.send='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 3 10 14M21 3l-7 18-4-7-7-4Z"/></svg>';

/* ---------- материалы: список с сервера, файл присылает бот ---------- */
let MT=null, MT_TAG="Все";
const escA=v=>esc(String(v==null?"":v)).replace(/"/g,"&quot;");
const MT_DEMO={items:[
  {id:"demo1",title:"Шпаргалка: основы Python",desc:"print, переменные, условия и циклы на одной странице",tag:"Python",size:"2 МБ"},
  {id:"demo2",title:"Системы счисления за 10 минут",desc:"Перевод чисел без калькулятора",tag:"ЕГЭ",size:"4 МБ"},
  {id:"demo3",title:"Конспект для учеников курса",desc:"Пример закрытого материала",tag:"ЕГЭ",size:"6 МБ",locked:true}
]};
const matOn=()=>!!(API_URL&&tg&&tg.initData);
const MATERIALS_TAB=false; // вкладка «Материалы» пока скрыта; чтобы вернуть, поставить true

async function renderMaterials(app){
  app.appendChild(h("h1",{class:"page"},"Материалы"));
  app.appendChild(h("p",{class:"sub"},"Конспекты и шпаргалки. Нажми «Получить», и бот пришлёт файл в чат."));
  const box=h("div",{class:"mt"}); app.appendChild(box);
  if(!matOn()){
    if(DEV){ box.appendChild(h("div",{class:"sr-note"},"<b>Демо-список.</b> Вне Telegram настоящие материалы не загружаются.")); matList(box,MT_DEMO,true); }
    else box.appendChild(h("div",{class:"sr-note"},"<b>Материалы работают внутри Telegram.</b> Открой приложение через бота, и он пришлёт файлы в чат."));
    return;
  }
  if(MT) matList(box,MT); else box.appendChild(h("div",{class:"sr-loading"},"<i></i>Загружаем материалы"));
  try{
    const st=await api("materials_list");
    if(S.tab!=="materials"||!box.isConnected) return;
    MT=st; matList(box,st);
  }catch(e){
    if(S.tab!=="materials"||!box.isConnected||MT) return;
    box.innerHTML=""; box.appendChild(h("div",{class:"sr-note"},"<b>Не получилось загрузить материалы.</b> "+escA(e.message||"Проверь интернет")));
    const r=h("button",{class:"reset",type:"button"},"Обновить"); r.onclick=render; box.appendChild(r);
  }
}
function matList(box,st,demo){
  const keep=box.querySelector(".sr-note"); box.innerHTML=""; if(demo&&keep) box.appendChild(keep);
  const items=st.items||[];
  if(!items.length){ box.appendChild(h("p",{class:"note"},"Материалы скоро появятся 🐱")); return; }
  const tags=["Все"].concat([...new Set(items.map(x=>x.tag).filter(Boolean))]);
  if(!tags.includes(MT_TAG)) MT_TAG="Все";
  if(tags.length>2){
    const ch=h("div",{class:"mt-tags",role:"tablist","aria-label":"Темы"});
    tags.forEach(t=>{ const b=h("button",{type:"button",role:"tab","aria-selected":String(t===MT_TAG)},escA(t)); b.onclick=()=>{ MT_TAG=t; matList(box,st,demo); }; ch.appendChild(b); });
    box.appendChild(ch);
  }
  items.filter(x=>MT_TAG==="Все"||x.tag===MT_TAG).forEach(x=>{
    const cover=x.cover?'<img src="'+escA(x.cover)+'" alt="" loading="lazy">':'<span>PDF</span>';
    const c=h("div",{class:"mt-card"+(x.locked?" locked":"")},'<div class="mt-cover">'+cover+'</div><div class="mt-tx"><b>'+escA(x.title)+'</b>'+(x.desc?'<p>'+escA(x.desc)+'</p>':"")+'<small>'+(x.locked?"Для учеников курса":["PDF",x.size].filter(Boolean).join(" · "))+'</small></div>');
    const b=h("button",{class:"mt-get",type:"button"},x.locked?I.lock:"Получить");
    if(x.locked){ b.setAttribute("aria-label","Закрыто: для учеников курса"); b.onclick=()=>toast("Этот материал для учеников годового курса"); }
    else b.onclick=()=>matGet(x,b,demo);
    c.appendChild(b); box.appendChild(c);
  });
}
async function matGet(x,b,demo){
  if(b.disabled) return;
  if(demo){ toast("В Telegram бот пришлёт «"+x.title+"» в чат"); return; }
  b.disabled=true; const was=b.innerHTML; b.innerHTML='<i class="spin"></i>';
  try{
    await api("materials_get",{id:x.id},1);
    haptic("success"); b.innerHTML=I.check; b.classList.add("ok");
    matSent(x);
  }catch(e){ haptic("error"); toast(e.message||"Не получилось, попробуй ещё раз"); b.innerHTML=was; }
  b.disabled=false;
}
/* после отправки: подсказать, где файл, и дать вернуться в чат */
function matSent(x){
  const box=h("div",{class:"mt-sent"},'<span class="ic">'+I.send+'</span><b>Отправил в чат с ботом</b><p>«'+escA(x.title)+'» уже ждёт тебя в Telegram. Там его можно открыть и сохранить.</p>');
  const go=h("button",{class:"main",type:"button"},"Перейти в чат"); 
  const sh=openSheet("Материал отправлен",box);
  go.onclick=()=>{ try{ tg.close(); }catch(e){ sh.close(); } };
  const stay=h("button",{class:"reset",type:"button"},"Остаться в ИНФиКе"); stay.onclick=()=>sh.close();
  box.append(go,stay);
}

/* ---------- видео модуля: Kinescope, VK Видео, Rutube, YouTube ---------- */
function videoEmbed(url){
  let u; try{ u=new URL(url); }catch(e){ return null; }
  const host=u.hostname.replace(/^www\.|^m\./,""), p=u.pathname;
  let m;
  if(host==="kinescope.io") return "https://kinescope.io/embed/"+p.replace(/^\/(embed\/)?/,"");
  if(host==="youtu.be") return "https://www.youtube-nocookie.com/embed/"+p.slice(1);
  if(host.endsWith("youtube.com")){ const id=u.searchParams.get("v")||((m=p.match(/^\/(?:shorts|embed|live)\/([\w-]+)/))&&m[1]); return id?"https://www.youtube-nocookie.com/embed/"+id:null; }
  if(host==="rutube.ru"){ m=p.match(/\/(?:video|play\/embed)\/([\w]+)/); return m?"https://rutube.ru/play/embed/"+m[1]:null; }
  if(host==="vkvideo.ru"||host==="vk.com"||host==="vk.ru"){
    if(/video_ext\.php/.test(p)) return url;
    m=(p+u.search).match(/video(-?\d+)_(\d+)/); return m?"https://vkvideo.ru/video_ext.php?oid="+m[1]+"&id="+m[2]+"&hd=2":null;
  }
  return null;
}
function openLinkOut(url){ try{ if(tg&&tg.openLink){ tg.openLink(url); return; } }catch(e){} window.open(url,"_blank","noopener"); }
function openVideo(M){
  const src=videoEmbed(M.video);
  if(!src){ openLinkOut(M.video); return; }
  const box=h("div",{class:"vid"},'<div class="vid-frame"><iframe src="'+escA(src)+'" title="'+escA(M.title)+'" allow="autoplay; fullscreen; picture-in-picture; encrypted-media" allowfullscreen></iframe></div>');
  if(M.videoAbout) box.appendChild(h("p",{class:"note"},escA(M.videoAbout)));
  const out=h("button",{class:"reset",type:"button"},"Не грузится? Открыть видео отдельно"); out.onclick=()=>openLinkOut(M.video);
  box.appendChild(out);
  openSheet("Видео: "+M.title,box);
}

/* ---------- награды: шторка по нажатию на XP ---------- */
function openRewards(){
  S.newBadge=false; S.hintRewards=true; save(); render();
  const box=h("div",{class:"rw"});
  const got=BADGES.filter(b=>S.badges[b.id]).length, lessons=Object.keys(S.done).length;
  box.appendChild(h("div",{class:"rw-stats"},'<div><b>'+S.xp+'</b><small>XP</small></div><div><b>'+S.streak+'</b><small>'+plural(S.streak,"день","дня","дней")+' подряд</small></div><div><b>'+lessons+'</b><small>'+plural(lessons,"урок","урока","уроков")+'</small></div>'));
  box.appendChild(h("h3",{class:"rw-h"},"Награды · "+got+" из "+BADGES.length));
  const g=h("div",{class:"badges"});
  BADGES.forEach(b=>g.appendChild(h("div",{class:"badge"+(S.badges[b.id]?" on":"")},'<span class="ic">'+I[b.ic]+'</span><b>'+b.title+'</b><small>'+b.hint+'</small>')));
  box.appendChild(g);
  openSheet("Твой прогресс",box);
}
