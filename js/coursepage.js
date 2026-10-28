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
  if(c.program&&c.program.length){
    const s=h("section",{class:"cp-sec"},'<h2>Программа</h2>');
    const ol=h("ol",{class:"cp-prog"});
    c.program.forEach((m,i)=>ol.appendChild(h("li",null,'<span class="n">'+(i+1)+'</span><div><b>'+e(m.title)+'</b><p>'+e(m.about)+'</p>'+(m.tasks?'<small>Задания ЕГЭ: '+e(m.tasks)+'</small>':"")+'</div>')));
    s.appendChild(ol); app.appendChild(s);
  }
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
    app.appendChild(s);
  }
  if(COURSE_URL){
    const b=h("button",{class:"main cp-cta",type:"button"},e(c.cta||"Записаться на курс"));
    b.onclick=()=>{ haptic("success"); openCourse("course_tab"); };
    app.appendChild(b);
  }
}
