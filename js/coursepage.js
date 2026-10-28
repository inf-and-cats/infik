/* Вкладка «Курс»: продающая страница годового курса. Содержимое — content/course-page.json */
let CP=null;
fetch("content/course-page.json",{cache:"no-cache"}).then(r=>r.ok?r.json():null).then(c=>{ if(!c) return; CP=c; if(!LS&&!SR) render(); }).catch(()=>{});
const courseOn=()=>!!CP && !isStudent();

function renderCoursePage(app){
  const c=CP, e=v=>escA(v);
  app.appendChild(h("section",{class:"cp-hero"},'<small>'+e(c.tagline)+'</small><h1>'+e(c.title)+'</h1><p>'+e(c.about)+'</p>'));
  if(c.facts&&c.facts.length) app.appendChild(h("div",{class:"cp-facts"},c.facts.map(f=>'<div><b>'+e(f.n)+'</b><small>'+e(f.t)+'</small></div>').join("")));
  const vids=(c.videos||[]).filter(v=>v.url);
  if(vids.length){
    const s=h("section",{class:"cp-sec"},'<h2>Посмотри</h2>');
    vids.forEach(v=>{ const b=h("button",{class:"cp-video",type:"button"},'<span class="pl">'+I.play+'</span><b>'+e(v.title)+'</b>'); b.onclick=()=>openVideo({title:v.title,video:v.url}); s.appendChild(b); });
    app.appendChild(s);
  }
  if(c.program&&c.program.length) app.appendChild(programBlock(c));
  const vr=c.videoReviews||[], tr=c.reviews||[];
  if(vr.length||tr.length){
    const s=h("section",{class:"cp-sec"},'<h2>Отзывы учеников</h2>');
    if(vr.length){
      const row=h("div",{class:"cp-vr"});
      vr.forEach(v=>row.appendChild(h("div",{class:"cp-vr-i"+(v.round?" round":"")},'<video src="'+e(v.src)+'" poster="'+e(v.poster||"")+'" controls playsinline preload="none"></video>')));
      s.appendChild(row);
    }
    tr.forEach(r=>{
      const card=h("div",{class:"cp-rev"},(r.score?'<span class="sc"><b>'+e(r.score)+'</b><small>баллов</small></span>':"")+'<p>'+e(r.text)+'</p>');
      if(r.proof){ const pb=h("button",{class:"reset",type:"button"},"Результат с Госуслуг"); pb.onclick=()=>openSheet("Результат ЕГЭ",h("img",{class:"cp-proof",src:r.proof,alt:"Результат ЕГЭ: "+r.score+" баллов"})); card.appendChild(pb); }
      s.appendChild(card);
    });
    if(c.reviewsUrl){ const rl=h("button",{class:"cp-more",type:"button"},"Все отзывы в Telegram-канале →"); rl.onclick=()=>{ try{ if(tg&&tg.openTelegramLink&&/^https:\/\/t\.me\//.test(c.reviewsUrl)){ tg.openTelegramLink(c.reviewsUrl); return; } }catch(e){} openLinkOut(c.reviewsUrl); }; s.appendChild(rl); }
    app.appendChild(s);
  }
  if(COURSE_URL){
    const b=h("button",{class:"main cp-cta",type:"button"},e(c.cta||"Записаться на курс"));
    b.onclick=()=>{ haptic("success"); openCourse("course_tab"); };
    app.appendChild(b);
  }
}

/* программа: шкала месяцев и карточки модулей, которые листаются вбок */
function programBlock(c){
  const e=v=>escA(v), now=Date.now(), day=s=>new Date(s+"T00:00:00+03:00").getTime();
  const t0=day(c.programStart||"2026-10-01"), t1=day(c.programEnd||"2027-05-31");
  const pct=Math.max(0,Math.min(100,(now-t0)/(t1-t0)*100));
  let cur=-1; c.program.forEach((m,i)=>{ if(m.from&&day(m.from)<=now) cur=i; });
  const months=["окт","ноя","дек","янв","фев","мар","апр","май"], mi=Math.floor(pct/100*months.length);
  const sec=h("section",{class:"cp-prog2"},'<h2>Программа на год</h2>'+
    '<div class="cp-months">'+months.map((m,i)=>'<span'+(now>=t0&&now<=t1&&i===Math.min(mi,7)?' class="on"':'')+'>'+m+'</span>').join("")+'</div>'+
    '<div class="cp-tl"><i style="width:'+pct+'%"></i>'+(now>=t0&&now<=t1?'<span style="left:'+pct+'%">сейчас</span>':"")+'</div>');
  const row=h("div",{class:"cp-cards"});
  c.program.forEach((m,i)=>{
    const tasks=String(m.tasks||"").split(",").map(x=>x.trim()).filter(Boolean);
    row.appendChild(h("div",{class:"cp-card"+(i===cur?" now":""),style:"--c:"+e(m.color||"#ecf141")},
      (i===cur?'<span class="cp-now">идёт сейчас</span>':"")+'<div class="ic">'+e(m.icon||"📘")+'</div><small>Модуль '+(i+1)+(m.months?' · '+e(m.months):"")+'</small><b>'+e(m.title)+'</b><p>'+e(m.about)+'</p>'+
      (tasks.length?'<div class="tk">'+tasks.map(x=>'<span>№'+e(x)+'</span>').join("")+'</div>':"")));
  });
  sec.appendChild(row);
  sec.appendChild(h("p",{class:"cp-hint"},"Листай карточки →"));
  if(cur>0) requestAnimationFrame(()=>{ const el=row.children[cur]; if(el) row.scrollLeft=el.offsetLeft-row.offsetLeft-4; });
  return sec;
}
