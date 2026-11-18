/* «Что нового»: поп-ап один раз при входе, карточки листаются пальцем. В каждой карточке — живая механика (таблица, кот, таблица истинности).
   Новый выпуск = новый WN_ID и свой список WN_CARDS. Показали — S.wn = WN_ID. Подключать после sheet.js, robot.js, truth.js, probnik.js */
const WN_ID="ege-1118";
const WN_CARDS=[
 {task:9, art:"e9", title:"Числа в таблицах", lead:"Решаем как на экзамене: в настоящей таблице с формулами.",
  pts:["Нажми на ячейку — увидишь формулу", "Формулы протягиваются квадратиком, как в Calc", "Босс — файл на 28 000 строк"], demo:wnSheet},
 {task:18, art:"e18", title:"Кот-сборщик", lead:"Веди кота по полю и собирай монеты. Стены не пускают.",
  pts:["Сначала сам ищешь лучший путь", "Потом карта сумм: МАКС и МИН в таблице", "Финиши, стены и закутки — как в ЕГЭ"], demo:wnRobot, paid:true},
 {task:2, art:"e2", title:"Алгебра логики", lead:"Таблицы истинности, которые заполняешь нажатием.",
  pts:["Клетки заполняешь нажатием, ошибки видно сразу", "Собираешь F на Python из блоков", "Сопоставляешь столбцы, как в задании"], demo:wnTruth, paid:true}
];

function wnMaybe(){ if(S.wn===WN_ID||LS||SR||document.querySelector(".sheet-wrap,.wn-wrap")) return; openWhatsNew(); }
function openWhatsNew(){
  const stud=isStudent(), n=WN_CARDS.length;
  const wrap=h("div",{class:"wn-wrap",role:"dialog","aria-modal":"true","aria-label":"Что нового"});
  const box=h("div",{class:"wn"});
  box.innerHTML='<div class="wn-top"><b class="wn-h">ЧТО НОВОГО</b><button class="x" type="button" aria-label="Закрыть">'+I.close+'</button></div>'+
    '<p class="wn-sub">Вышли '+n+' задания ЕГЭ. Листай →</p>';
  const track=h("div",{class:"wn-track"});
  WN_CARDS.forEach((c,i)=>{
    const lock=c.paid&&!stud;
    const card=h("section",{class:"wn-card"});
    card.innerHTML='<div class="wn-head"><span class="wn-n">ЗАДАНИЕ '+c.task+'</span>'+(lock?'<span class="wn-lock">для учеников</span>':'<span class="wn-new">новое</span>')+'</div>'+
      '<div class="wn-title"><svg viewBox="0 0 16 16" shape-rendering="crispEdges" aria-hidden="true">'+wnArt(c.art)+'</svg><b>'+c.title+'</b></div><p class="wn-lead">'+c.lead+'</p>';
    const demo=h("div",{class:"wn-demo"}); demo.appendChild(h("div",{class:"wn-try"},"👆 попробуй прямо здесь"));
    c.demo(demo); card.appendChild(demo);
    card.appendChild(h("ul",{class:"wn-pts"},c.pts.map(p=>'<li>'+p+'</li>').join("")));
    if(i===n-1) card.appendChild(h("div",{class:"wn-pb"},'<b>ПРОБНИК ЛАЙТ</b>'+(stud?'Все три номера в формате экзамена: тренировка и вариант недели с лидерами':'Задание 9 в формате экзамена открыто всем, остальные номера — на курсе')));
    track.appendChild(card);
  });
  box.appendChild(track);
  const dots=h("div",{class:"wn-dots"}); for(let i=0;i<n;i++) dots.appendChild(h("i"));
  const go=h("button",{class:"main wn-go",type:"button"},"Дальше");
  box.append(dots,go); wrap.append(h("div",{class:"wn-bg"}),box); document.body.appendChild(wrap);
  document.body.style.overflow="hidden";
  requestAnimationFrame(()=>wrap.classList.add("on"));
  let cur=0;
  const upd=()=>{ cur=Math.round(track.scrollLeft/track.clientWidth); [...dots.children].forEach((d,i)=>d.classList.toggle("on",i===cur));
    go.textContent=cur<n-1?"Дальше":(stud?"Открыть задания ЕГЭ":"Попробовать задание 9"); };
  track.addEventListener("scroll",()=>{ clearTimeout(track._t); track._t=setTimeout(upd,60); },{passive:true});
  const close=()=>{ S.wn=WN_ID; save(); wrap.classList.remove("on"); document.body.style.overflow=""; setTimeout(()=>wrap.remove(),220); };
  go.onclick=()=>{ haptic("tap"); if(cur<n-1){ track.scrollTo({left:(cur+1)*track.clientWidth,behavior:"smooth"}); return; }
    close(); S.tab="path"; const sec=COURSE&&COURSE.sections.find(x=>x.ege); if(sec) S.sec=sec.id; save(); render(); };
  box.querySelector(".x").onclick=close; wrap.querySelector(".wn-bg").onclick=close;
  upd();
}
function wnArt(k){ const a=(typeof MOD_ART!=="undefined")&&MOD_ART[k]; if(!a) return ""; let r="";
  a.forEach((row,y)=>[...row].forEach((c,x)=>{ if(c!==".") r+='<rect x="'+x+'" y="'+y+'" width="1" height="1" fill="'+MOD_ART_C[c]+'"/>'; })); return r; }

/* задание 9: таблица с формулами, тап по ячейке показывает формулу */
function wnSheet(b){
  const sh=xlFromSpec({data:[[48,12,90,12,7],[33,61,5,70,18],[25,25,25,80,3],[66,14,57,9,41]],
    pre:[{cell:"F1",f:"=МАКС(A1:E1)",fill:"F1:F4"},{cell:"G1",f:"=СЧЁТЕСЛИ(A1:E1;A1)",fill:"G1:G4"}]});
  b.appendChild(xlView(sh,{show:"A1:G4",sel:"G1"}));
}
/* задание 18: мини-поле, кот ходит вправо и вниз */
function wnRobot(b){
  const st={grid:[[7,3,9,2],[4,8,1,6],[2,5,7,3]],walls:{R:["B1"],D:["C2"]},dirs:"RD"};
  const F=rbField(st), best=F.best("max");
  const hud=h("div",{class:"rb-hud"}), coin=h("span",{class:"rb-chip"}); hud.appendChild(coin); b.appendChild(hud);
  const board=rbBoard(F,{ends:true}); board.cells.forEach((row,r)=>row.forEach((d,c)=>d.textContent=F.G[r][c]));
  const wrap=h("div",{class:"rb-wrap"}); wrap.appendChild(board); b.appendChild(wrap);
  const cat=h("img",{class:"rb-cat",alt:"Кот"}); board.appendChild(cat);
  const pad=h("div",{class:"rb-pad"}); b.appendChild(pad);
  let r,c,sum,trail,line,stop;
  const place=()=>{ cat.style.transform="translate(calc(var(--cs) * "+c+" + 4px),calc(var(--cs) * "+r+" + 4px))"; };
  const say=t=>{ coin.innerHTML='<span class="coin"></span>'+t; };
  function reset(){ [r,c]=F.start; sum=F.G[r][c]; trail=[[r,c]]; stop=false; board.cells.flat().forEach(d=>d.classList.remove("vis","best")); board.clearLines();
    board.mark(r,c,"vis"); line=board.line(trail,"me"); cat.src=rbCat(false); cat.classList.remove("boom"); place(); say(sum); btns[2].hidden=true; btns[0].hidden=btns[1].hidden=false; }
  function step(d){ if(stop) return;
    if(F.blocked(r,c,d)){ stop=true; haptic("error"); cat.src=rbCat(true); cat.classList.add("boom"); say(sum+" · бум! стена"); btns[0].hidden=btns[1].hidden=true; btns[2].hidden=false; return; }
    const [dr,dc]=RB_DIR[d]; r+=dr; c+=dc; sum+=F.G[r][c]; trail.push([r,c]); board.mark(r,c,"vis");
    line.setAttribute("points",trail.map(([y,x])=>(x*10+5)+","+(y*10+5)).join(" ")); place(); haptic("tap");
    if(F.isEnd(r,c)){ stop=true; say(sum+(sum===best.sum?" · максимум!":" · а можно "+best.sum)); if(sum===best.sum) sfx("ok"); btns[0].hidden=btns[1].hidden=true; btns[2].hidden=false; } else say(sum); }
  const btns=[["R","→ вправо"],["D","↓ вниз"],["","Ещё раз"]].map(([d,t])=>{ const x=h("button",{type:"button"},t); x.onclick=()=>d?step(d):reset(); pad.appendChild(x); return x; });
  reset();
}
/* задание 2: столбец x → y заполняется нажатием, после последней клетки — проверка */
function wnTruth(b){
  const rows=["00","01","10","11"], want=rows.map(s=>+(!(s[0]==="1"&&s[1]==="0")));
  const grid=h("div",{class:"tt-grid"}); grid.style.setProperty("--cols",3);
  ['<i>x</i>','<i>y</i>',ttSym("x → y")].forEach((x,k)=>grid.appendChild(h("div",{class:"tt-h"+(k===1?" sep":"")},x)));
  const val=rows.map(()=>""), cells=[];
  rows.forEach((s,r)=>{ grid.appendChild(h("div",{class:"tt-c"},s[0])); grid.appendChild(h("div",{class:"tt-c sep"},s[1]));
    const d=h("div",{class:"tt-c fx ask"}); d.onclick=()=>{ val[r]=val[r]===""?"0":val[r]==="0"?"1":"0"; d.textContent=val[r]; d.classList.add("set"); d.classList.remove("ok","no"); haptic("tap"); chk(); };
    cells.push(d); grid.appendChild(d); });
  const w=h("div",{class:"tt-wrap"}); w.appendChild(grid); b.appendChild(w);
  const note=h("p",{class:"wn-tnote"},"Импликация «если x, то y». Заполни последний столбец."); b.appendChild(note);
  function chk(){ if(val.some(v=>v==="")) return; const ok=val.every((v,i)=>+v===want[i]);
    cells.forEach((d,i)=>d.classList.toggle("no",+val[i]!==want[i]));
    note.innerHTML=ok?"<b>Верно!</b> Ложь только при x = 1, y = 0: обещание нарушено.":"Есть ошибка. Подсказка: импликация ложна ровно в одной строке.";
    if(ok){ cells.forEach(d=>d.classList.add("ok")); sfx("ok"); } }
}
