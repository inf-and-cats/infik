/* ИНФиК: шаг урока "robot" — кот-сборщик монет (задание 18). Подключать после core.js и до lesson.js.
   Поля шага:
     grid [[монеты]] — поле (строки сверху вниз); walls {R:["C2","D3:D5"], D:["B2:C2"]} — стена справа от клетки (R) и под клеткой (D);
     dirs "RD" (по умолчанию) | "RU" | "LD" | "LU" — куда ходит кот; старт в противоположном углу;
     mode "play" — кот ходит по кнопкам; goal "any" (дойти куда угодно) | "max" | "min" (найти лучший путь);
     mode "sums" — карта сумм: в каждой клетке выбрать, откуда пришёл кот; fn "max" | "min"; askEnd — в конце нажать на клетку с ответом;
     mode "show" — готовая карта сумм без заданий (path — показать лучший путь);
     grey true/false — штриховать клетки, куда не попасть (в play по умолчанию да, в sums нет: ученик находит их сам);
     prefill N — сколько клеток карты сумм уже заполнено (по порядку обхода); text, why. */
const RB_DIR={R:[0,1,"→","Вправо"],L:[0,-1,"←","Влево"],D:[1,0,"↓","Вниз"],U:[-1,0,"↑","Вверх"]};
const RB_FROM={R:["←","слева"],L:["→","справа"],D:["↑","сверху"],U:["↓","снизу"]};
function rbCell(a){ const p=xlAddr(a); return [p.r,p.c]; }
function rbList(arr){ const out=[]; (arr||[]).forEach(a=>{ const R=xlRange(a); for(let r=R.r1;r<=R.r2;r++) for(let c=R.c1;c<=R.c2;c++) out.push(r+","+c); }); return new Set(out); }
/* модель поля: стены, ходы, лучшие суммы */
function rbField(st){
  const G=st.grid, n=G.length, m=G[0].length, dirs=(st.dirs||"RD").split(""), WR=rbList(st.walls&&st.walls.R), WD=rbList(st.walls&&st.walls.D);
  const hd=dirs.find(d=>d==="R"||d==="L"), vd=dirs.find(d=>d==="D"||d==="U");
  const start=[vd==="D"?0:n-1, hd==="R"?0:m-1];
  const wallR=(r,c)=>c>=m-1||c<0||WR.has(r+","+c), wallD=(r,c)=>r>=n-1||r<0||WD.has(r+","+c);
  const blocked=(r,c,d)=>d==="R"?wallR(r,c):d==="L"?(c===0||wallR(r,c-1)):d==="D"?wallD(r,c):(r===0||wallD(r-1,c));
  const F={G,n,m,dirs,hd,vd,start,wallR,wallD,blocked};
  /* порядок обхода: от старта по строкам */
  const order=[]; const rs=[...Array(n).keys()], cs=[...Array(m).keys()]; if(vd==="U") rs.reverse(); if(hd==="L") cs.reverse();
  rs.forEach(r=>cs.forEach(c=>order.push([r,c]))); F.order=order;
  /* соседи-предшественники клетки: откуда кот мог прийти */
  F.preds=(r,c)=>{ const a=[]; [hd,vd].forEach(d=>{ const [dr,dc]=RB_DIR[d], pr=r-dr, pc=c-dc;
    a.push({d,r:pr,c:pc,out:pr<0||pc<0||pr>=n||pc>=m,wall:!(pr<0||pc<0||pr>=n||pc>=m)&&blocked(pr,pc,d)}); }); return a; };
  F.solve=fn=>{ const S=[],P=[]; for(let r=0;r<n;r++){ S.push(Array(m).fill(null)); P.push(Array(m).fill(null)); }
    order.forEach(([r,c])=>{ if(r===start[0]&&c===start[1]){ S[r][c]=G[r][c]; return; }
      const ok=F.preds(r,c).filter(p=>!p.out&&!p.wall&&S[p.r][p.c]!=null); if(!ok.length) return;
      const b=ok.reduce((a,p)=>(fn==="min"?S[p.r][p.c]<S[a.r][a.c]:S[p.r][p.c]>S[a.r][a.c])?p:a);
      S[r][c]=S[b.r][b.c]+G[r][c]; P[r][c]=b; }); return {S,P}; };
  const MX=F.solve("max"); F.reach=(r,c)=>MX.S[r][c]!=null;
  F.isEnd=(r,c)=>F.reach(r,c)&&dirs.every(d=>blocked(r,c,d));
  F.ends=order.filter(([r,c])=>F.isEnd(r,c));
  /* клетки, куда из-за внутренней стены можно прийти только с одной стороны (жёлтые в конспекте) */
  F.oneSide=(r,c)=>{ if(!F.reach(r,c)) return false; const p=F.preds(r,c); return p.some(x=>!x.out&&x.wall)&&p.some(x=>!x.out&&!x.wall); };
  F.best=fn=>{ const R=F.solve(fn); let e=null; F.ends.forEach(([r,c])=>{ if(!e||(fn==="min"?R.S[r][c]<R.S[e[0]][e[1]]:R.S[r][c]>R.S[e[0]][e[1]])) e=[r,c]; });
    const path=[e]; let [r,c]=e; while(R.P[r][c]){ const p=R.P[r][c]; r=p.r; c=p.c; path.unshift([r,c]); } return {sum:R.S[e[0]][e[1]],path,end:e,S:R.S}; };
  return F;
}
/* пиксельный кот (голова 30×26 из achieve.js); glitch — «сломанный» кот после стены */
const RB_CAT={};
function rbCat(glitch){
  const k=glitch?"g":"n"; if(RB_CAT[k]) return RB_CAT[k];
  if(typeof CAT_PX==="undefined") return CAT;
  const W=30,H=26,cv=document.createElement("canvas"); cv.width=W+4; cv.height=H; const g=cv.getContext("2d");
  const put=(dx,col)=>{ for(let y=0;y<H;y++) for(let x=0;x<W;x++){ const ch=CAT_PX[y][x]; if(ch&&ch!=="."&&ch!=="L"){ g.fillStyle=col||CAT_PAL[ch]; g.fillRect(x+dx,y,1,1); } } };
  if(glitch){ put(0,"#ff6b9a"); put(4,"#4fd1e8"); put(2); g.clearRect(0,9,W+4,2); g.clearRect(0,17,W+4,1); } else put(2);
  return RB_CAT[k]=cv.toDataURL();
}
/* поле: клетки, стены (тени внутрь клетки), след и кот */
function rbBoard(F,opt){
  const box=h("div",{class:"rb-field"}); box.style.setProperty("--cols",F.m);
  const cells=[];
  for(let r=0;r<F.n;r++){ cells.push([]); for(let c=0;c<F.m;c++){
    const sh=[]; if(c<F.m-1&&F.wallR(r,c)) sh.push("inset -4px 0 0 var(--ink)"); if(c>0&&F.wallR(r,c-1)) sh.push("inset 4px 0 0 var(--ink)");
    if(r<F.n-1&&F.wallD(r,c)) sh.push("inset 0 -4px 0 var(--ink)"); if(r>0&&F.wallD(r-1,c)) sh.push("inset 0 4px 0 var(--ink)");
    const d=h("div",{class:"rb-c"}); d.dataset.sh=sh.join(","); d.style.boxShadow=d.dataset.sh;
    if(opt.grey&&!F.reach(r,c)) d.classList.add("grey");
    if(r===F.start[0]&&c===F.start[1]) d.classList.add("start");
    if(opt.ends&&F.isEnd(r,c)) d.classList.add("end");
    box.appendChild(d); cells[r].push(d); } }
  const svg=document.createElementNS("http://www.w3.org/2000/svg","svg"); svg.setAttribute("class","rb-path"); svg.setAttribute("viewBox","0 0 "+F.m*10+" "+F.n*10); svg.setAttribute("preserveAspectRatio","none"); box.appendChild(svg);
  box.cells=cells;
  box.line=(pts,cls)=>{ const pl=document.createElementNS(svg.namespaceURI,"polyline"); pl.setAttribute("points",pts.map(([r,c])=>(c*10+5)+","+(r*10+5)).join(" ")); pl.setAttribute("class",cls); svg.appendChild(pl); return pl; };
  box.clearLines=()=>{ svg.innerHTML=""; };
  box.mark=(r,c,cls,on)=>{ const d=cells[r][c]; d.classList.toggle(cls,on!==false); };
  box.ring=(r,c)=>{ cells.flat().forEach(d=>{ d.classList.remove("cur"); d.style.boxShadow=d.dataset.sh; }); if(r==null) return; const d=cells[r][c]; d.classList.add("cur"); d.style.boxShadow=[d.dataset.sh,"inset 0 0 0 3px var(--purple)"].filter(Boolean).join(","); };
  return box;
}
function rbLegend(F,opt){
  const it=[]; if(opt.start!==false) it.push('<span><i class="lg-start"></i>старт</span>'); if(opt.ends) it.push('<span><i class="lg-end"></i>'+(F.ends.length>1?"тупики-финиши":"финиш")+'</span>');
  if(opt.yellow) it.push('<span><i class="lg-yel"></i>прийти можно только с одной стороны</span>');
  if(opt.grey&&F.order.some(([r,c])=>!F.reach(r,c))) it.push('<span><i class="lg-grey"></i>сюда не попасть</span>');
  return h("div",{class:"rb-legend"},it.join(""));
}
function robotStep(st,b){
  (st.text||[]).forEach(t=>b.appendChild(h("p",{class:"txt"},t)));
  const F=rbField(st);
  if(st.mode==="sums"||st.mode==="show") return rbSums(st,b,F);
  return rbPlay(st,b,F);
}
/* ===== режим «пройди сам» ===== */
function rbPlay(st,b,F){
  const goal=st.goal||"any", best=F.best(goal==="min"?"min":"max"), grey=st.grey!==false;
  const hud=h("div",{class:"rb-hud"}), coin=h("span",{class:"rb-chip"}), aim=h("span",{class:"rb-chip goal"});
  aim.innerHTML=goal==="max"?"Цель: максимум":goal==="min"?"Цель: минимум":"Дойди до финиша"; hud.append(coin,aim); b.appendChild(hud);
  const board=rbBoard(F,{grey,ends:true}); const wrap=h("div",{class:"rb-wrap"}); wrap.appendChild(board); b.appendChild(wrap);
  board.cells.forEach((row,r)=>row.forEach((d,c)=>d.textContent=F.G[r][c]));
  b.appendChild(rbLegend(F,{ends:true,grey}));
  const cat=h("img",{class:"rb-cat",alt:"Кот"}); board.appendChild(cat);
  const note=h("p",{class:"rb-note"}); note.hidden=true; b.appendChild(note);
  const pad=h("div",{class:"rb-pad"}); b.appendChild(pad);
  let r,c,sum,trail,dead,fin,tries=0,line;
  const btns=F.dirs.map(d=>{ const x=h("button",{type:"button"},'<b>'+RB_DIR[d][2]+'&#xFE0E;</b>'+RB_DIR[d][3]); x.onclick=()=>step(d); pad.appendChild(x); return x; });
  const place=()=>{ cat.style.transform="translate(calc(var(--cs) * "+c+" + 4px),calc(var(--cs) * "+r+" + 4px))"; };
  function reset(){ [r,c]=F.start; sum=F.G[r][c]; trail=[[r,c]]; dead=false; fin=false;
    board.cells.flat().forEach(d=>d.classList.remove("vis","best")); board.clearLines(); board.querySelectorAll(".rb-hit,.rb-plus").forEach(x=>x.remove());
    board.mark(r,c,"vis"); line=board.line(trail,"me"); cat.src=rbCat(false); cat.classList.remove("boom"); place(); coin.innerHTML='<span class="coin"></span>'+sum;
    note.hidden=true; btns.forEach(x=>x.disabled=false); footer(null,{btn:"Проверить",disabled:true,on:()=>{}}); }
  function step(d){ if(dead||fin) return;
    if(F.blocked(r,c,d)){ dead=true; haptic("error"); cat.src=rbCat(true); cat.classList.add("boom");
      const w=h("div",{class:"rb-hit"}); const S="var(--cs)";
      if(d==="R"||d==="L"){ const x=d==="R"?c+1:c; Object.assign(w.style,{left:"calc("+S+" * "+x+" - 3px)",top:"calc("+S+" * "+r+")",width:"6px",height:S}); }
      else { const y=d==="D"?r+1:r; Object.assign(w.style,{top:"calc("+S+" * "+y+" - 3px)",left:"calc("+S+" * "+c+")",height:"6px",width:S}); }
      board.appendChild(w); btns.forEach(x=>x.disabled=true);
      const edge=(d==="R"&&c===F.m-1)||(d==="L"&&c===0)||(d==="D"&&r===F.n-1)||(d==="U"&&r===0);
      note.hidden=false; note.className="rb-note bad"; note.innerHTML="<b>Бум!</b> "+(edge?"Край поля — тоже стена.":"Сквозь стену кот пройти не может.")+" Попробуй другой путь.";
      footer(null,{btn:"Заново",on:reset}); return; }
    const [dr,dc]=RB_DIR[d]; r+=dr; c+=dc; sum+=F.G[r][c]; trail.push([r,c]); board.mark(r,c,"vis"); line.setAttribute("points",trail.map(([y,x])=>(x*10+5)+","+(y*10+5)).join(" "));
    place(); coin.innerHTML='<span class="coin"></span>'+sum; haptic("success");
    const p=h("span",{class:"rb-plus"},"+"+F.G[r][c]); p.style.left="calc(var(--cs) * "+c+")"; p.style.top="calc(var(--cs) * "+r+")"; board.appendChild(p); setTimeout(()=>p.remove(),700);
    if(F.isEnd(r,c)) finish(); }
  function showBest(){ board.line(best.path,"best"); best.path.forEach(([y,x])=>board.mark(y,x,"best")); }
  function finish(){ fin=true; btns.forEach(x=>x.disabled=true); tries++;
    const hit=sum===best.sum;
    if(goal==="any"){ showBest(); st.why=(hit?"Ты собрал "+sum+" — это и есть максимум! ":"Ты собрал "+sum+", а лучший путь (зелёный пунктир) даёт "+best.sum+". ")+(st.whyAny||""); resolve(true,st); return; }
    if(hit){ showBest(); resolve(true,st); return; }
    note.hidden=false; note.className="rb-note"; note.innerHTML="Ты собрал <b>"+sum+"</b>, а можно "+(goal==="min"?"меньше":"больше")+". Попробуй другой путь.";
    if(tries>=2){ const sb=h("button",{class:"rb-show",type:"button"},"Показать лучший путь"); sb.onclick=()=>{ sb.remove(); showBest(); note.innerHTML="Лучший путь — зелёный пунктир: "+best.sum+" "+plural(best.sum,"монета","монеты","монет")+"."; resolve(false,st); }; note.appendChild(sb); }
    footer(null,{btn:"Ещё раз",on:reset}); }
  /* стрелки на клавиатуре — для компьютера */
  const key=e=>{ if(!b.isConnected){ document.removeEventListener("keydown",key); return; } const m={ArrowRight:"R",ArrowLeft:"L",ArrowDown:"D",ArrowUp:"U"}[e.key]; if(m&&F.dirs.includes(m)){ e.preventDefault(); step(m); } };
  document.addEventListener("keydown",key);
  reset();
}
/* ===== режим «карта сумм» ===== */
function rbSums(st,b,F){
  const fn=st.fn||"max", R=F.solve(fn), best=F.best(fn), show=st.mode==="show";
  const board=rbBoard(F,{grey:show||st.grey===true,ends:show}); const wrap=h("div",{class:"rb-wrap"}); wrap.appendChild(board); b.appendChild(wrap);
  const hasGrey=F.order.some(([r,c])=>!F.reach(r,c)), hasYel=F.order.some(([r,c])=>F.oneSide(r,c));
  b.appendChild(rbLegend(F,{ends:show,grey:show||st.grey===true,yellow:hasYel,start:true}));
  const paint=(r,c)=>{ const d=board.cells[r][c];
    if(!F.reach(r,c)){ d.classList.add("grey"); d.innerHTML='<span class="small">'+F.G[r][c]+'</span>'; return; }
    d.innerHTML='<span class="small">'+F.G[r][c]+'</span><span class="sum">'+R.S[r][c]+'</span>'; if(F.oneSide(r,c)) d.classList.add("yel"); };
  F.order.forEach(([r,c])=>{ board.cells[r][c].innerHTML='<span class="small">'+F.G[r][c]+'</span>'; });
  if(show){ F.order.forEach(([r,c])=>paint(r,c)); if(st.path!==false){ board.line(best.path,"best"); } footer(null,{btn:"Дальше",on:nextStep}); return; }
  const q=F.order.filter(([r,c])=>!(r===F.start[0]&&c===F.start[1])); let i=0, miss=0, done=false;
  paint(...F.start); for(let k=0;k<(st.prefill||0)&&i<q.length;k++,i++) paint(...q[i]);
  const ask=h("p",{class:"rb-note"}); b.appendChild(ask);
  const pad=h("div",{class:"rb-pad"}); b.appendChild(pad);
  function cur(){
    if(i>=q.length){ return end(); }
    const [r,c]=q[i]; board.ring(r,c); pad.innerHTML="";
    ask.className="rb-note"; ask.innerHTML="Клетка с монетой <b>"+F.G[r][c]+"</b>. Откуда сюда выгоднее прийти?";
    const P=F.preds(r,c);
    P.forEach(p=>{ const [ar,word]=RB_FROM[p.d]; const v=!p.out&&!p.wall?R.S[p.r][p.c]:null;
      const lab=p.out?"нет клетки":p.wall?"стена":v==null?"сюда не попасть":word+" "+v;
      const x=h("button",{type:"button"},'<b>'+ar+'&#xFE0E;</b>'+lab); x.disabled=p.out||p.wall||v==null; x.onclick=()=>pick(p); pad.appendChild(x); });
    if(hasGrey){ const g=h("button",{type:"button",class:"wide"},"Сюда кот не попадёт"); g.onclick=()=>pick(null); pad.appendChild(g); }
  }
  function wrong(t){ miss++; haptic("error"); toast(t); const lb=$("#lbody"); lb.classList.remove("shake"); void lb.offsetWidth; lb.classList.add("shake"); }
  function pick(p){ if(done) return; const [r,c]=q[i];
    const ok=F.preds(r,c).filter(x=>!x.out&&!x.wall&&R.S[x.r][x.c]!=null);
    if(p===null){ if(ok.length){ wrong("Сюда можно прийти: посмотри на соседей"); return; } }
    else { const v=R.S[p.r][p.c], want=fn==="min"?Math.min(...ok.map(x=>R.S[x.r][x.c])):Math.max(...ok.map(x=>R.S[x.r][x.c]));
      if(v!==want){ wrong((fn==="min"?"Для минимума берём меньшее: ":"Для максимума берём большее: ")+ok.map(x=>RB_FROM[x.d][1]+" "+R.S[x.r][x.c]).join(", ")); return; } }
    haptic("success"); paint(r,c); board.cells[r][c].classList.add("pop"); i++;
    /* клетки, куда никак не попасть, и клетки с одним путём кот заполняет сам, если так задано */
    while(i<q.length&&st.auto&&F.preds(...q[i]).filter(x=>!x.out&&!x.wall&&R.S[x.r][x.c]!=null).length<2&&F.reach(...q[i])){ paint(...q[i]); i++; }
    cur(); }
  function end(){ board.ring(null); pad.innerHTML="";
    if(!st.askEnd){ finishOk(); return; }
    F.ends.forEach(([r,c])=>board.mark(r,c,"end"));
    ask.innerHTML=F.ends.length>1?"Карта готова. Финишей несколько (красные рамки). Нажми на клетку, где ответ — "+(fn==="min"?"минимальная":"максимальная")+" сумма.":"Карта готова. Нажми на клетку с ответом.";
    footer(null,{btn:"Проверить",disabled:true,on:()=>{}});
    board.cells.forEach((row,r)=>row.forEach((d,c)=>{ d.classList.add("tap"); d.onclick=()=>{ if(done) return;
      board.cells.flat().forEach(x=>x.classList.remove("picked")); d.classList.add("picked");
      footer(null,{btn:"Проверить",on:()=>{ done=true; const ok=r===best.end[0]&&c===best.end[1];
        board.line(best.path,"best");
        if(ok) finishOk(); else { board.mark(best.end[0],best.end[1],"picked"); resolve(false,st,F.isEnd(r,c)?"Это финиш, но не самый "+(fn==="min"?"маленький":"большой")+".":"Это не финиш: из этой клетки кот может идти дальше."); } }}); }; }));
  }
  function finishOk(){ done=true; if(!st.askEnd) board.line(best.path,"best"); resolve(miss<3,st,miss?"Ошибок по дороге: "+miss+".":""); }
  cur();
}
