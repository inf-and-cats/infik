/* ИНФиК: Черепаха (задание 6 ЕГЭ). Подключать после editor.js и до lesson.js.
   1) Алгоритм в записи ЕГЭ: tuRun(["Повтори 2 [Вперёд 9 Направо 90 Вперёд 15 Направо 90]", …]) — линии, кадры для пошагового показа, фигуры.
   2) Фигуры и подсчёт: tuCount(run,{op,fig,what}) — точки (с границей и без), площадь, периметр пересечения или объединения.
   3) Поле с сеткой: tuView(opt) — холст с точками, приближение (кнопки, щипок, колесо), перетаскивание, нажатие на точку.
   4) Окно «Python Turtle Graphics» под выводом программы: если код подключал turtle (js/python.js пишет линии и точки в r.turtle).
   5) Шаг урока "turtle" (mode play | drive | point | mark | answer | code) и блок turtle у теории и вопроса: tuBlock(spec).
   Поля шага — в комментарии над turtleStep. */

/* ---------- алгоритм в записи ЕГЭ ---------- */
const TU_WORDS=[["Поднять хвост","up"],["Опустить хвост","down"],["Вперёд","fd"],["Вперед","fd"],["Назад","bk"],["Направо","rt"],["Вправо","rt"],["Налево","lt"],["Влево","lt"],["Повтори","rep"]];
/* разбор строк алгоритма: команды с номером строки и позицией в строке (для подсветки) */
function tuParse(lines){
  const toks=[];
  lines.forEach((ln,li)=>{ let i=0; const s=ln;
    while(i<s.length){
      if(/\s/.test(s[i])){ i++; continue; }
      if(s[i]==="["||s[i]==="]"){ toks.push({t:s[i],li,a:i,b:i+1}); i++; continue; }
      const w=TU_WORDS.find(([w])=>s.startsWith(w,i));
      if(!w){ const m=/^\S+/.exec(s.slice(i)); throw new Error("Не понимаю «"+m[0]+"» в строке "+(li+1)); }
      let j=i+w[0].length; let n=null;
      if(w[1]!=="up"&&w[1]!=="down"){ const m=/^\s*(-?\d+)/.exec(s.slice(j)); if(!m) throw new Error("После «"+w[0]+"» нужно число"); n=+m[1]; j+=m[0].length; }
      toks.push({t:w[1],n,li,a:i,b:j}); i=j; }
  });
  let p=0;
  function block(end){ const out=[];
    while(p<toks.length){ const k=toks[p];
      if(k.t==="]"){ if(!end) throw new Error("Лишняя ]"); p++; return out; }
      if(k.t==="["){ throw new Error("[ без «Повтори»"); }
      p++;
      if(k.t==="rep"){ if(!toks[p]||toks[p].t!=="[") throw new Error("После «Повтори "+k.n+"» нужна ["); p++; out.push({t:"rep",n:k.n,body:block(true),li:k.li,a:k.a,b:k.b}); }
      else out.push(k); }
    if(end) throw new Error("Не хватает ]"); return out; }
  return block(false);
}
const tuR=v=>Math.abs(v-Math.round(v))<1e-9?Math.round(v):Math.round(v*1e9)/1e9;
/* выполнить: линии (только с опущенным хвостом), все перемещения, кадры после каждой команды */
function tuRun(lines){
  const prog=tuParse(lines);
  let x=0,y=0,hd=90,pen=true; const segs=[], moves=[], frames=[{x,y,h:hd,pen,n:0,cmd:null,pass:[]}], runs=[[[0,0]]];
  const pass=[];
  function exec(list){ list.forEach(c=>{
    if(c.t==="rep"){ for(let i=0;i<c.n;i++){ pass.push({li:c.li,a:c.a,i:i+1,n:c.n}); exec(c.body); pass.pop(); } return; }
    if(c.t==="fd"||c.t==="bk"){ const d=(c.t==="fd"?1:-1)*c.n, r=hd*Math.PI/180, nx=tuR(x+d*Math.cos(r)), ny=tuR(y+d*Math.sin(r));
      moves.push([x,y,nx,ny,pen]); if(pen){ segs.push([x,y,nx,ny]); runs[runs.length-1].push([nx,ny]); } x=nx; y=ny; }
    else if(c.t==="rt") hd=((hd-c.n)%360+360)%360;
    else if(c.t==="lt") hd=((hd+c.n)%360+360)%360;
    else if(c.t==="up") pen=false;
    else if(c.t==="down"){ if(!pen) runs.push([[x,y]]); pen=true; }
    if(frames.length>5000) throw new Error("Слишком длинный алгоритм");
    frames.push({x,y,h:hd,pen,n:segs.length,cmd:c,pass:pass.map(p=>Object.assign({},p))}); }); }
  exec(prog);
  /* фигура = замкнутый контур одного «опущенного» участка: точки до первого возвращения в начало */
  const figs=runs.filter(r=>r.length>1).map(r=>{ const p0=r[0]; let j=r.findIndex((p,i)=>i>0&&p[0]===p0[0]&&p[1]===p0[1]); if(j<0) j=r.length; return r.slice(0,j); });
  return {lines,prog,segs,moves,frames,figs,end:{x,y,h:hd,pen}};
}
/* ---------- геометрия ---------- */
function tuOnSeg(px,py,a,b){ const [x1,y1]=a,[x2,y2]=b; const cr=(x2-x1)*(py-y1)-(y2-y1)*(px-x1); if(Math.abs(cr)>1e-7) return false;
  return px>=Math.min(x1,x2)-1e-9&&px<=Math.max(x1,x2)+1e-9&&py>=Math.min(y1,y2)-1e-9&&py<=Math.max(y1,y2)+1e-9; }
function tuOnPoly(px,py,P){ for(let i=0;i<P.length;i++) if(tuOnSeg(px,py,P[i],P[(i+1)%P.length])) return true; return false; }
function tuInPoly(px,py,P){ let c=false; for(let i=0,j=P.length-1;i<P.length;j=i++){ const [xi,yi]=P[i],[xj,yj]=P[j];
  if(((yi>py)!==(yj>py))&&(px<(xj-xi)*(py-yi)/(yj-yi)+xi)) c=!c; } return c; }
/* закрытая область: внутри или на линии */
function tuMember(run,op,fig){
  const F=run.figs; const inF=(P,x,y)=>tuOnPoly(x,y,P)||tuInPoly(x,y,P);
  if(op==="inter") return (x,y)=>F.every(P=>inF(P,x,y));
  if(op==="union") return (x,y)=>F.some(P=>inF(P,x,y));
  const P=F[fig||0]; return (x,y)=>inF(P,x,y);
}
function tuBox(run){ let x1=Infinity,y1=Infinity,x2=-Infinity,y2=-Infinity; run.figs.flat().forEach(([x,y])=>{ x1=Math.min(x1,x); y1=Math.min(y1,y); x2=Math.max(x2,x); y2=Math.max(y2,y); }); return [Math.floor(x1),Math.floor(y1),Math.ceil(x2),Math.ceil(y2)]; }
/* точки области: all — с границей, strict — без неё; border — только граница */
function tuPoints(run,op,fig,kind){
  const C=tuMember(run,op,fig), [x1,y1,x2,y2]=tuBox(run), e=1e-4, out=[];
  const inner=(x,y)=>[[1,0],[-1,0],[0,1],[0,-1],[1,1],[1,-1],[-1,1],[-1,-1]].every(([a,b])=>C(x+a*e,y+b*e));
  for(let x=x1;x<=x2;x++) for(let y=y1;y<=y2;y++){ if(!C(x,y)) continue; const i=inner(x,y);
    if(kind==="strict"&&!i) continue; if(kind==="border"&&i) continue; out.push(x+","+y); }
  return out;
}
function tuAxis(run){ return run.segs.every(([a,b,c,d])=>a===c||b===d); }
function tuArea(run,op,fig){
  const C=tuMember(run,op,fig), [x1,y1,x2,y2]=tuBox(run);
  if(!tuAxis(run)){ const P=run.figs[fig||0]; let s=0; P.forEach((p,i)=>{ const q=P[(i+1)%P.length]; s+=p[0]*q[1]-q[0]*p[1]; }); return Math.abs(s)/2; }
  let n=0; for(let x=x1;x<x2;x++) for(let y=y1;y<y2;y++) if(C(x+.5,y+.5)) n++; return n;
}
function tuPerim(run,op,fig){
  const C=tuMember(run,op,fig), [x1,y1,x2,y2]=tuBox(run), e=1e-4;
  const bd=(x,y)=>C(x,y)&&!(C(x+e,y)&&C(x-e,y)&&C(x,y+e)&&C(x,y-e));
  let n=0; for(let x=x1;x<=x2;x++) for(let y=y1;y<=y2;y++){ if(x<x2&&bd(x+.5,y)) n++; if(y<y2&&bd(x,y+.5)) n++; } return n;
}
/* ответ на вопрос задания: what = points | strict | area | perimeter */
function tuCount(run,q){ const op=q.op||"one", fig=q.fig||0;
  if(q.what==="area") return tuArea(run,op,fig); if(q.what==="perimeter") return tuPerim(run,op,fig);
  return tuPoints(run,op,fig,q.what==="strict"?"strict":"all").length; }
/* прямоугольник фигуры [x1,y1,x2,y2] — для подсветки и разборов */
function tuRect(P){ const xs=P.map(p=>p[0]), ys=P.map(p=>p[1]); return [Math.min(...xs),Math.min(...ys),Math.max(...xs),Math.max(...ys)]; }
/* набор точек рисунка (каждые полклетки по главной оси) — чтобы сравнивать рисунки, нарезанные на отрезки по-разному */
function tuSample(segs,scale){ const S=new Set(); const key=(x,y)=>Math.round(x*1000)+","+Math.round(y*1000);
  segs.forEach(([a,b,c,d])=>{ a/=scale; b/=scale; c/=scale; d/=scale; const dx=c-a, dy=d-b, L=Math.max(Math.abs(dx),Math.abs(dy));
    if(L<1e-9) return; const main=Math.abs(dx)>=Math.abs(dy)-1e-6?"x":"y", m0=main==="x"?a:b, m1=main==="x"?c:d;
    const lo=Math.min(m0,m1), hi=Math.max(m0,m1); S.add(key(a,b)); S.add(key(c,d));
    for(let v=Math.ceil(lo*2-1e-9)/2; v<=hi+1e-9; v+=.5){ const t=(v-m0)/(m1-m0); S.add(key(a+dx*t,b+dy*t)); } });
  return S; }
function tuSameSet(A,B){ if(A.size!==B.size) return false; for(const x of A) if(!B.has(x)) return false; return true; }
const tuDirWord=h=>({0:"вправо",45:"вправо-вверх",90:"вверх",135:"влево-вверх",180:"влево",225:"влево-вниз",270:"вниз",315:"вправо-вниз"})[Math.round(h)%360]||Math.round(h)+"°";
const tuArrow=h=>({0:"→",45:"↗",90:"↑",135:"↖",180:"←",225:"↙",270:"↓",315:"↘"})[Math.round(h)%360]||"•";
const tuNum=v=>String(tuR(v)).replace("-","−").replace(".",",");

if(typeof module!=="undefined") module.exports={tuParse,tuRun,tuCount,tuPoints,tuArea,tuPerim,tuRect,tuSample,tuSameSet,tuMember};
if(typeof document==="undefined"){ /* Node: только расчёты */ }
else {

/* ---------- пиксельная черепаха 11×11 (смотрит вверх) ---------- */
const TU_PX=["....hhh....","....hhh....","..l.ddd.l..","..ldLdLdl..",".ddLLdLLdd.",".dLddLddLd.",".ddLLdLLdd.","..ldLdLdl..","..l.ddd.l..",".....d.....","..........."];
const TU_PAL={h:"#7bc96f",l:"#7bc96f",d:"#2e6b33",L:"#c6e83a"};
let TU_SPRITE=null;
function tuSprite(){ if(TU_SPRITE) return TU_SPRITE; const c=document.createElement("canvas"); c.width=11; c.height=11; const g=c.getContext("2d");
  TU_PX.forEach((r,y)=>[...r].forEach((ch,x)=>{ if(TU_PAL[ch]){ g.fillStyle=TU_PAL[ch]; g.fillRect(x,y,1,1); } })); return TU_SPRITE=c; }

/* ---------- поле ---------- */
/* opt: segs (линии), ghost (пунктир «как надо»), unit (шаг сетки в координатах рисунка: 1 у алгоритма, k у программы),
   grid true — точки во всех целых местах; dots [[x,y,size]] — точки, которые поставила программа (окно Python);
   axes true — оси; turtle {x,y,h}; marks Set("x,y" в шагах сетки); hl [x1,y1,x2,y2] — подсветка прямоугольника (в шагах);
   fit [x1,y1,x2,y2] — что показать сначала (в шагах); win true — рамка окна Python; onTap(x,y) — нажатие на точку (в шагах) */
function tuView(opt){
  const box=h("div",{class:"tu-view"+(opt.win?" tu-win":"")});
  if(opt.win) box.appendChild(h("div",{class:"tu-wbar"},'<span>Python Turtle Graphics</span><i></i><i></i><i></i>'));
  const cv=h("canvas",{class:"tu-cv","aria-label":opt.label||"Поле Черепахи"}); box.appendChild(cv);
  const tools=h("div",{class:"tu-tools"});
  const zin=h("button",{type:"button","aria-label":"Приблизить"},"+"), zout=h("button",{type:"button","aria-label":"Отдалить"},"−"), zfit=h("button",{type:"button","aria-label":"Показать всё"},"⤢");
  tools.append(zin,zout,zfit); box.appendChild(tools);
  const chip=h("div",{class:"tu-chip"}); chip.hidden=true; box.appendChild(chip);
  const V={opt,cx:0,cy:0,s:10,W:300,H:240,box,cv,chip};
  const u=()=>opt.unit||1;
  function bounds(){
    if(opt.fit){ const [a,b,c,d]=opt.fit; return [a*u(),b*u(),c*u(),d*u()]; }
    const pts=[]; (opt.segs||[]).forEach(s=>{ pts.push([s[0],s[1]],[s[2],s[3]]); }); (opt.ghost||[]).forEach(s=>{ pts.push([s[0],s[1]],[s[2],s[3]]); });
    if(opt.turtle) pts.push([opt.turtle.x,opt.turtle.y]); if(!pts.length) pts.push([0,0]);
    let x1=Math.min(...pts.map(p=>p[0])),x2=Math.max(...pts.map(p=>p[0])),y1=Math.min(...pts.map(p=>p[1])),y2=Math.max(...pts.map(p=>p[1]));
    if(opt.axes||opt.grid){ x1=Math.min(x1,0); y1=Math.min(y1,0); x2=Math.max(x2,0); y2=Math.max(y2,0); }
    const m=Math.max(2*u(),(Math.max(x2-x1,y2-y1))*.08); return [x1-m,y1-m,x2+m,y2+m]; }
  V.fit=()=>{ const [x1,y1,x2,y2]=bounds(); V.cx=(x1+x2)/2; V.cy=(y1+y2)/2; V.s=Math.min(V.W/Math.max(1e-6,x2-x1),V.H/Math.max(1e-6,y2-y1)); V.draw(); };
  function size(){ const w=Math.max(220,Math.round(box.clientWidth||Math.min(window.innerWidth-32,528))); const hgt=Math.round(Math.min(opt.height||w*.78,380));
    const dpr=window.devicePixelRatio||1; V.W=w; V.H=hgt; cv.width=w*dpr; cv.height=hgt*dpr; cv.style.height=hgt+"px"; V.dpr=dpr; }
  const sx=x=>(x-V.cx)*V.s+V.W/2, sy=y=>(V.cy-y)*V.s+V.H/2;
  const wx=X=>(X-V.W/2)/V.s+V.cx, wy=Y=>V.cy-(Y-V.H/2)/V.s;
  V.toScreen=(x,y)=>[sx(x),sy(y)];
  V.draw=()=>{
    const g=cv.getContext("2d"); g.setTransform(V.dpr,0,0,V.dpr,0,0); 
    g.fillStyle="#fff"; g.fillRect(0,0,V.W,V.H);
    const U=u(), step=V.s*U; // пикселей экрана на шаг сетки
    const gx1=Math.floor(wx(0)/U)-1, gx2=Math.ceil(wx(V.W)/U)+1, gy1=Math.floor(wy(V.H)/U)-1, gy2=Math.ceil(wy(0)/U)+1;
    /* подсветка */
    if(opt.hl){ const [a,b,c,d]=opt.hl; g.fillStyle="rgba(236,241,65,.55)"; g.fillRect(sx(a*U),sy(d*U),(c-a)*U*V.s,(d-b)*U*V.s); g.strokeStyle="#e8590c"; g.lineWidth=3; g.strokeRect(sx(a*U),sy(d*U),(c-a)*U*V.s,(d-b)*U*V.s); }
    /* оси */
    if(opt.axes){ g.strokeStyle="#c9c5ef"; g.lineWidth=1.5; g.beginPath(); g.moveTo(sx(0),0); g.lineTo(sx(0),V.H); g.moveTo(0,sy(0)); g.lineTo(V.W,sy(0)); g.stroke();
      g.fillStyle="#8b86c9"; g.font="600 10px Nunito, sans-serif"; const every=step>=26?1:step>=12?5:step>=5?10:step>=2?20:50;
      for(let i=Math.ceil(gx1/every)*every;i<=gx2;i+=every){ if(i) g.fillText(String(i),sx(i*U)+2,sy(0)+11); }
      for(let i=Math.ceil(gy1/every)*every;i<=gy2;i+=every){ if(i) g.fillText(String(i),sx(0)+3,sy(i*U)-2); }
      g.fillText("0",sx(0)+3,sy(0)+11); }
    /* сетка точек */
    if(opt.grid&&step>=5&&(gx2-gx1)*(gy2-gy1)<90000){ const r=Math.max(1,Math.min(2.6,step*.09)); g.fillStyle="#262b69";
      for(let i=gx1;i<=gx2;i++) for(let j=gy1;j<=gy2;j++) g.fillRect(sx(i*U)-r,sy(j*U)-r,2*r,2*r); }
    /* точки программы (как в окне Python: размер в пикселях окна, при приближении растут) */
    if(opt.dots){ g.fillStyle="#000"; const k=Math.max(.6,Math.min(3,V.s));
      opt.dots.forEach(([x,y,sz])=>{ const X=sx(x),Y=sy(y); if(X<-5||Y<-5||X>V.W+5||Y>V.H+5) return; const r=Math.max(.8,sz*k/2); g.fillRect(X-r,Y-r,2*r,2*r); }); }
    /* пунктир «как надо» */
    if(opt.ghost&&opt.ghost.length){ g.save(); g.setLineDash([6,5]); g.strokeStyle="#2f9e5b"; g.lineWidth=3; g.globalAlpha=.85; g.beginPath(); opt.ghost.forEach(([a,b,c,d])=>{ g.moveTo(sx(a),sy(b)); g.lineTo(sx(c),sy(d)); }); g.stroke(); g.restore(); }
    /* линии */
    g.strokeStyle=opt.win?"#000":"#512da8"; g.lineWidth=opt.win?1.5:2.5; g.lineCap="round"; g.beginPath();
    (opt.segs||[]).forEach(([a,b,c,d])=>{ g.moveTo(sx(a),sy(b)); g.lineTo(sx(c),sy(d)); });
    if(V.partial){ const [a,b,c,d]=V.partial; g.moveTo(sx(a),sy(b)); g.lineTo(sx(c),sy(d)); }
    g.stroke();
    /* отметки ученика и разбор */
    const mk=(k,fn)=>{ const [i,j]=k.split(",").map(Number); fn(sx(i*U),sy(j*U)); };
    const R=Math.max(4,Math.min(9,step*.32));
    if(opt.marks) opt.marks.forEach(k=>mk(k,(X,Y)=>{ g.fillStyle="#ecf141"; g.strokeStyle="#262b69"; g.lineWidth=1.5; g.fillRect(X-R,Y-R,2*R,2*R); g.strokeRect(X-R,Y-R,2*R,2*R); }));
    if(V.miss) V.miss.forEach(k=>mk(k,(X,Y)=>{ g.strokeStyle="#d6336c"; g.lineWidth=2.5; g.beginPath(); g.arc(X,Y,R+2,0,7); g.stroke(); }));
    if(V.extra) V.extra.forEach(k=>mk(k,(X,Y)=>{ g.strokeStyle="#d6336c"; g.lineWidth=3; g.beginPath(); g.moveTo(X-R,Y-R); g.lineTo(X+R,Y+R); g.moveTo(X+R,Y-R); g.lineTo(X-R,Y+R); g.stroke(); }));
    if(V.pick){ mk(V.pick,(X,Y)=>{ g.strokeStyle=V.pickCls==="no"?"#d6336c":V.pickCls==="ok"?"#2f9e5b":"#512da8"; g.lineWidth=3; g.beginPath(); g.arc(X,Y,R+3,0,7); g.stroke(); }); }
    if(V.right){ mk(V.right,(X,Y)=>{ g.strokeStyle="#2f9e5b"; g.lineWidth=3; g.beginPath(); g.arc(X,Y,R+3,0,7); g.stroke(); }); }
    /* черепаха */
    const T=V.turtle||opt.turtle; if(T){ const sp=tuSprite(), z=Math.max(22,Math.min(34,step*1.1)); g.save(); g.translate(sx(T.x),sy(T.y)); g.rotate(-(T.h-90)*Math.PI/180); g.imageSmoothingEnabled=false; g.drawImage(sp,-z/2,-z/2,z,z); g.restore(); }
  };
  V.set=o=>{ Object.assign(opt,o); V.draw(); };
  V.setTurtle=t=>{ V.turtle=t; V.draw(); };
  V.zoom=(f,X,Y)=>{ X=X==null?V.W/2:X; Y=Y==null?V.H/2:Y; const x=wx(X),y=wy(Y); V.s=Math.max(.05,Math.min(400,V.s*f)); V.cx=x-(X-V.W/2)/V.s; V.cy=y+(Y-V.H/2)/V.s; V.draw(); };
  zin.onclick=()=>V.zoom(1.5); zout.onclick=()=>V.zoom(1/1.5); zfit.onclick=()=>V.fit();
  /* жесты: тянуть, щипок, нажатие */
  const P=new Map(); let moved=false, pinch=null, last=null;
  cv.addEventListener("pointerdown",e=>{ cv.setPointerCapture(e.pointerId); P.set(e.pointerId,[e.offsetX,e.offsetY]); moved=false; last=[e.offsetX,e.offsetY];
    if(P.size===2){ const [a,b]=[...P.values()]; pinch={d:Math.hypot(a[0]-b[0],a[1]-b[1]),s:V.s}; } });
  cv.addEventListener("pointermove",e=>{ if(!P.has(e.pointerId)) return; const p=[e.offsetX,e.offsetY]; const o=P.get(e.pointerId); P.set(e.pointerId,p);
    if(P.size===2&&pinch){ const [a,b]=[...P.values()]; const d=Math.hypot(a[0]-b[0],a[1]-b[1]); const mx=(a[0]+b[0])/2,my=(a[1]+b[1])/2; V.zoom(pinch.s*d/pinch.d/V.s,mx,my); moved=true; return; }
    if(Math.hypot(p[0]-last[0],p[1]-last[1])>6) moved=true;
    if(moved){ V.cx-=(p[0]-o[0])/V.s; V.cy+=(p[1]-o[1])/V.s; V.draw(); } });
  const up=e=>{ if(!P.has(e.pointerId)) return; P.delete(e.pointerId); if(P.size<2) pinch=null;
    if(!moved&&P.size===0&&opt.onTap){ const U=u(), x=Math.round(wx(e.offsetX)/U), y=Math.round(wy(e.offsetY)/U);
      const dpx=Math.hypot(sx(x*U)-e.offsetX,sy(y*U)-e.offsetY); if(dpx<=Math.max(14,V.s*U*.45)) opt.onTap(x,y); } };
  cv.addEventListener("pointerup",up); cv.addEventListener("pointercancel",e=>{ P.delete(e.pointerId); pinch=null; });
  cv.addEventListener("wheel",e=>{ e.preventDefault(); V.zoom(e.deltaY<0?1.2:1/1.2,e.offsetX,e.offsetY); },{passive:false});
  /* размер узнаём, когда поле уже на странице */
  const start=()=>{ size(); V.fit(); };
  requestAnimationFrame(()=>{ if(box.isConnected) start(); else setTimeout(start,30); });
  if(window.ResizeObserver){ let w0=0; new ResizeObserver(()=>{ const w=box.clientWidth; if(w&&Math.abs(w-w0)>4){ w0=w; const c=[V.cx,V.cy], s=V.s, W0=V.W; size(); if(W0>0&&s){ V.s=s*V.W/W0; V.cx=c[0]; V.cy=c[1]; V.draw(); } else V.fit(); } }).observe(box); }
  box.V=V; return box;
}

/* ---------- запись алгоритма с подсветкой команды ---------- */
function tuAlgBox(lines,opt){
  opt=opt||{};
  const box=h("div",{class:"tu-alg"}); const spans=[];
  lines.forEach((ln,li)=>{ const row=h("div",{class:"tu-aln"+(opt.onLine?" tap":"")}); let toks=[]; try{ toks=[]; tuParse([ln]).forEach(function walk(c){ toks.push(c); if(c.body) c.body.forEach(walk); }); }catch(e){}
    const cuts=toks.map(c=>[c.a,c.b]).sort((a,b)=>a[0]-b[0]); let pos=0;
    cuts.forEach(([a,b])=>{ if(a>pos) row.appendChild(document.createTextNode(ln.slice(pos,a))); const s=h("span",null,esc(ln.slice(a,b))); spans.push({li,a,el:s}); row.appendChild(s); pos=b; });
    if(pos<ln.length) row.appendChild(document.createTextNode(ln.slice(pos)));
    if(opt.onLine) row.onclick=()=>opt.onLine(li);
    box.appendChild(row); });
  box.rows=[...box.children];
  box.hlCmd=c=>{ spans.forEach(s=>s.el.classList.toggle("cur",!!c&&s.li===c.li&&s.a===c.a)); };
  box.hlLine=li=>{ box.rows.forEach((r,i)=>r.classList.toggle("cur",i===li)); };
  return box;
}

/* ---------- пошаговый показ алгоритма ---------- */
function tuPlayer(spec){
  const run=tuRun(spec.alg); const wrap=h("div",{class:"tu-play"});
  const alg=tuAlgBox(spec.alg); wrap.appendChild(alg);
  const view=tuView({segs:[],grid:spec.grid!==false,axes:spec.axes!==false,turtle:{x:0,y:0,h:90},fit:spec.fit||tuFitOf(run),hl:null}); wrap.appendChild(view);
  const V=view.V; const info=h("div",{class:"tu-info"}); wrap.appendChild(info);
  const pad=h("div",{class:"tu-pbtn"});
  const bReset=h("button",{type:"button"},"↺ Сначала"), bStep=h("button",{type:"button",class:"go"},"Шаг ▸"), bAll=h("button",{type:"button"},"Всё ▸▸");
  pad.append(bReset,bStep,bAll); wrap.appendChild(pad);
  let i=0, anim=null;
  function show(){ const f=run.frames[i]; V.partial=null; V.set({segs:run.segs.slice(0,f.n)}); V.setTurtle({x:f.x,y:f.y,h:f.h}); alg.hlCmd(f.cmd);
    const ps=f.pass.length?" · проход "+f.pass.map(p=>p.i+" из "+p.n).join(", "):"";
    info.innerHTML='<b>('+tuNum(f.x)+'; '+tuNum(f.y)+')</b> · голова '+tuArrow(f.h)+'&#xFE0E; '+tuDirWord(f.h)+' · хвост '+(f.pen?"опущен":"поднят")+ps;
    bStep.disabled=bAll.disabled=i>=run.frames.length-1; if(spec.onEnd&&i>=run.frames.length-1) spec.onEnd(); }
  function step(){ if(anim||i>=run.frames.length-1) return; const a=run.frames[i], b=run.frames[i+1];
    if(a.x===b.x&&a.y===b.y||matchMedia("(prefers-reduced-motion: reduce)").matches){ i++; show(); return; }
    const t0=performance.now(), dur=Math.min(600,180+40*Math.hypot(b.x-a.x,b.y-a.y));
    const tick=t=>{ const k=Math.min(1,(t-t0)/dur), x=a.x+(b.x-a.x)*k, y=a.y+(b.y-a.y)*k; V.partial=a.pen&&b.n>a.n?[a.x,a.y,x,y]:null; V.setTurtle({x,y,h:a.h}); alg.hlCmd(b.cmd);
      if(k<1) anim=requestAnimationFrame(tick); else { anim=null; i++; show(); } };
    anim=requestAnimationFrame(tick); }
  bStep.onclick=step; bAll.onclick=()=>{ if(anim){ cancelAnimationFrame(anim); anim=null; } i=run.frames.length-1; show(); haptic("tap"); };
  bReset.onclick=()=>{ if(anim){ cancelAnimationFrame(anim); anim=null; } i=0; show(); };
  if(spec.done){ i=run.frames.length-1; }
  setTimeout(show,0);
  wrap.run=run; wrap.V=V; return wrap;
}
function tuFitOf(run){ const pts=[[0,0]]; run.moves.forEach(m=>{ pts.push([m[0],m[1]],[m[2],m[3]]); });
  const xs=pts.map(p=>p[0]), ys=pts.map(p=>p[1]); const x1=Math.min(...xs),x2=Math.max(...xs),y1=Math.min(...ys),y2=Math.max(...ys);
  const m=Math.max(1.5,Math.max(x2-x1,y2-y1)*.08); return [x1-m,y1-m,x2+m,y2+m]; }

/* ---------- блок для теории и вопроса: turtle:{alg, play, code, hl, grid, axes, fit, k, showAlg, view:false — только запись алгоритма} ---------- */
function tuBlock(spec){
  if(spec.code){ const r=runPy(spec.code,[]); return tuPyWindow(r.turtle||{segs:[],dots:[]},spec); }
  if(spec.play) return tuPlayer(spec);
  const run=tuRun(spec.alg); const wrap=h("div",{class:"tu-block"});
  if(spec.showAlg!==false) wrap.appendChild(tuAlgBox(spec.alg));
  if(spec.view===false) return wrap;
  const t=run.end; wrap.appendChild(tuView({segs:run.segs,grid:spec.grid!==false,axes:spec.axes!==false,turtle:spec.turtle===false?null:{x:t.x,y:t.y,h:t.h},hl:spec.hl,fit:spec.fit||tuFitOf(run)}));
  return wrap;
}
/* окно Python Turtle Graphics по результату программы */
function tuPyWindow(T,spec){ spec=spec||{};
  const k=spec.k||10;
  return tuView({win:true,segs:T.segs,dots:T.dots,turtle:spec.turtle?{x:T.x,y:T.y,h:T.h}:null,unit:k,fit:spec.fit,hl:spec.hl,ghost:spec.ghost,marks:spec.marks,onTap:spec.onTap}); }
/* вывод программы в уроке: если подключали turtle, под выводом окно с рисунком */
const tuShowTerm0=showTerm;
showTerm=function(term,r){ tuShowTerm0(term,r);
  if(!r.turtle) return;
  if(!r.out){ const p=term.querySelector("pre[style]"); if(p) p.remove(); const th=term.querySelector(".th"); if(th&&!r.err) th.textContent="Окно рисунка"; const pr=term.querySelector("pre:not(.err)"); if(pr&&!pr.textContent) pr.remove(); }
  const k=(/\bk\s*=\s*(\d+)/.exec(r.code||"")||[])[1];
  term.appendChild(tuPyWindow(r.turtle,{k:k?+k:10,turtle:true})); };
const tuRunPy0=runPy;
runPy=function(code,inp,opt){ const r=tuRunPy0(code,inp,opt); if(r&&r.turtle) r.code=code; return r; };

/* ===================== шаг урока "turtle" =====================
   alg [строки] — алгоритм в записи ЕГЭ; text [абзацы]; why.
   mode "play"   — пошаговый показ (Шаг / Всё / Сначала);
   mode "drive"  — водим Черепаху кнопками и повторяем пунктирную фигуру target [строки]; nums [1,2,3] — шаги, angles [90], tail — кнопка хвоста;
   mode "point"  — нажми на точку: ask "end" (где окажется Черепаха) или answer [x,y]; show — алгоритм уже нарисован; play — с пошаговым показом;
   mode "mark"   — отметь точки: count {op:"inter"|"union"|"one", fig, what:"points"|"strict"}; маленькие фигуры;
   mode "answer" — рисунок и поле для числа: answer N; count {op,fig,what} — чем проверяет валидатор; code — программа Python, рисунок в её окне
                   (если есть и alg, над окном запись алгоритма, иначе сама программа);
                   hl [x1,y1,x2,y2] — подсветить область; fit — что показать;
   mode "code"   — собрать программу: head [строки], slots [{label, ans:[фишки]}] (по строке на строку алгоритма), tail [строки], chips [фишки],
                   k 10; dots [x1,x2,y1,y2] — программа должна поставить точки во всех целых местах этого прямоугольника. */
function turtleStep(st,b){
  [].concat(st.text||[]).forEach(t=>b.appendChild(h("p",{class:"txt"},t)));
  ({play:tuStepPlay,drive:tuDrive,point:tuPoint,mark:tuMark,answer:tuAnswer,code:tuCode})[st.mode||"play"](st,b);
}
function tuStepPlay(st,b){ b.appendChild(tuPlayer(st)); footer(null,{btn:"Дальше",on:nextStep}); }
function tuShake(){ const lb=$("#lbody"); lb.classList.remove("shake"); void lb.offsetWidth; lb.classList.add("shake"); haptic("error"); }

/* --- водим сами --- */
function tuDrive(st,b){
  const tgt=tuRun(st.target), want=tuSample(tgt.segs,1);
  const fit=tuFitOf(tgt); fit[0]=Math.min(fit[0],-1.5); fit[1]=Math.min(fit[1],-1.5);
  const view=tuView({segs:[],ghost:tgt.segs,grid:true,axes:true,turtle:{x:0,y:0,h:90},fit}); b.appendChild(view); const V=view.V;
  const log=h("div",{class:"tu-log"}); b.appendChild(log);
  const nums=st.nums||[1,2,3], angles=st.angles||[90]; let n=nums[0];
  const pad=h("div",{class:"tu-drive"}); b.appendChild(pad);
  const numRow=h("div",{class:"tu-nums"},'<span>Шаг:</span>'); nums.forEach(v=>{ const x=h("button",{type:"button","aria-pressed":String(v===n)},String(v)); x.onclick=()=>{ n=v; numRow.querySelectorAll("button").forEach(y=>y.setAttribute("aria-pressed",String(y===x))); }; numRow.appendChild(x); });
  pad.appendChild(numRow);
  const cmds=[]; const btn=(lab,fn,cls)=>{ const x=h("button",{type:"button",class:cls||""},lab); x.onclick=fn; pad.appendChild(x); return x; };
  btn("Вперёд",()=>add("Вперёд "+n),"wide2"); btn("Назад",()=>add("Назад "+n),"wide2");
  angles.forEach(a=>{ btn("Налево "+a,()=>add("Налево "+a)); btn("Направо "+a,()=>add("Направо "+a)); });
  let tailB=null; if(st.tail){ tailB=btn("Поднять хвост",()=>{ const up=cmds.filter(c=>/хвост/.test(c)).length%2===0; add(up?"Поднять хвост":"Опустить хвост"); },"wide"); }
  const undo=h("button",{type:"button",class:"tu-undo"},"⌫ Отменить"); undo.onclick=()=>{ cmds.pop(); redraw(); };
  function redraw(){ const r=tuRun(cmds.length?[cmds.join(" ")]:[""]); V.set({segs:r.segs}); V.setTurtle({x:r.end.x,y:r.end.y,h:r.end.h});
    log.innerHTML=cmds.length?'<b>Твой алгоритм:</b> '+cmds.map(esc).join(" "):'<span class="dim">Нажимай на кнопки, Черепаха запишет команды сюда.</span>';
    if(cmds.length) log.appendChild(undo);
    if(tailB) tailB.textContent=r.end.pen?"Поднять хвост":"Опустить хвост";
    chk.disabled=!cmds.length; return r; }
  function add(c){ cmds.push(c); haptic("tap"); const r=redraw(); if(tuSameSet(tuSample(r.segs,1),want)) ok(); }
  let done=false;
  function ok(){ if(done) return; done=true; pad.querySelectorAll("button").forEach(x=>x.disabled=true); undo.remove(); resolve(true,st); }
  const chk=footer(null,{btn:"Проверить",disabled:true,on:()=>{ const r=tuRun([cmds.join(" ")]); const S=tuSample(r.segs,1);
    if(tuSameSet(S,want)) return ok();
    const extra=[...S].some(x=>!want.has(x)); tuShake(); toast(extra?"Есть линия, которой нет в пунктире. Нажми «Отменить»":"Фигура ещё не дорисована"); }});
  redraw();
}

/* --- нажми на точку --- */
function tuPoint(st,b){
  const run=tuRun(st.alg), ans=st.ask==="end"?[run.end.x,run.end.y]:st.answer;
  let player=null, V;
  if(st.play){ player=tuPlayer(Object.assign({},st,{done:false})); b.appendChild(player); V=player.V; V.opt.onTap=tap; }
  else { if(st.showAlg!==false) b.appendChild(tuAlgBox(st.alg));
    const fit=st.fit||tuFitOf(run); const view=tuView({segs:st.show?run.segs:[],grid:true,axes:true,turtle:st.show?{x:run.end.x,y:run.end.y,h:run.end.h}:{x:0,y:0,h:90},fit,onTap:tap}); b.appendChild(view); V=view.V; }
  b.appendChild(h("p",{class:"note"},"Нажми на точку поля. Поле можно приближать и двигать."));
  let sel=null, done=false;
  function tap(x,y){ if(done) return; sel=[x,y]; V.pick=x+","+y; V.pickCls=""; V.draw(); chk.disabled=false; haptic("tap"); V.chip.hidden=false; V.chip.textContent="Точка ("+tuNum(x)+"; "+tuNum(y)+")"; }
  const chk=footer(null,{btn:"Проверить",disabled:true,on:()=>{ done=true; const ok=sel[0]===ans[0]&&sel[1]===ans[1];
    V.pickCls=ok?"ok":"no"; if(!ok) V.right=ans[0]+","+ans[1];
    if(!player||true){ V.partial=null; V.set({segs:run.segs}); V.setTurtle({x:run.end.x,y:run.end.y,h:run.end.h}); }
    resolve(ok,st,ok?"":"Ты выбрал ("+tuNum(sel[0])+"; "+tuNum(sel[1])+"), а нужно ("+tuNum(ans[0])+"; "+tuNum(ans[1])+")."); }});
}

/* --- отметь точки --- */
function tuMark(st,b){
  const run=tuRun(st.alg), q=st.count||{op:"one",what:"strict"};
  const want=new Set(tuPoints(run,q.op||"one",q.fig||0,q.what==="strict"?"strict":q.what==="border"?"border":"all"));
  if(st.showAlg) b.appendChild(tuAlgBox(st.alg));
  const marks=new Set(); let done=false;
  const view=tuView({segs:run.segs,grid:true,axes:st.axes===true,marks,fit:st.fit||tuFitOf(run),onTap:(x,y)=>{ if(done) return; const k=x+","+y; marks.has(k)?marks.delete(k):marks.add(k); haptic("tap"); V.draw(); cnt(); }});
  b.appendChild(view); const V=view.V;
  const c=h("div",{class:"tu-count"}); b.appendChild(c);
  const cnt=()=>{ c.innerHTML="Отмечено: <b>"+marks.size+"</b>"; chk.disabled=!marks.size; };
  const chk=footer(null,{btn:"Проверить",disabled:true,on:()=>{ done=true;
    V.miss=[...want].filter(k=>!marks.has(k)); V.extra=[...marks].filter(k=>!want.has(k)); V.draw();
    const ok=!V.miss.length&&!V.extra.length;
    resolve(ok,st,ok?"":(V.miss.length?"Пропущено точек: "+V.miss.length+" (красные кружки). ":"")+(V.extra.length?"Лишних: "+V.extra.length+" (красные крестики). ":"")+"Всего нужных точек "+want.size+"."); }});
  cnt();
}

/* --- рисунок и ответ числом --- */
function tuAnswer(st,b){
  const marks=new Set(); let done=false, V;
  const onTap=(x,y)=>{ if(done) return; const k=x+","+y; marks.has(k)?marks.delete(k):marks.add(k); haptic("tap"); V.draw(); cnt(); };
  if(st.code){ b.appendChild(st.alg?tuAlgBox(st.alg):ideView(st.code,{})); const r=runPy(st.code,[]); const w=tuPyWindow(r.turtle||{segs:[],dots:[]},{k:st.k||10,fit:st.fit,hl:st.hl,marks,onTap}); b.appendChild(w); V=w.V; }
  else { const run=tuRun(st.alg); if(st.showAlg!==false) b.appendChild(tuAlgBox(st.alg));
    const view=tuView({segs:run.segs,grid:st.grid!==false,axes:st.axes!==false,hl:st.hl,marks,fit:st.fit||tuFitOf(run),turtle:st.turtle?{x:run.end.x,y:run.end.y,h:run.end.h}:null,onTap}); b.appendChild(view); V=view.V; }
  const c=h("div",{class:"tu-count"}); b.appendChild(c);
  const cnt=()=>{ c.innerHTML=marks.size?"Отмечено точек: <b>"+marks.size+"</b> <button type=\"button\" class=\"tu-clr\">снять</button>":'<span class="dim">Нажимай на точки, чтобы отмечать их при подсчёте. На проверку отметки не влияют.</span>';
    const x=c.querySelector(".tu-clr"); if(x) x.onclick=()=>{ marks.clear(); V.draw(); cnt(); }; };
  cnt();
  const inp=h("input",{class:"tu-ans",inputmode:"numeric",autocomplete:"off","aria-label":"Ответ",placeholder:"Ответ"}); b.appendChild(inp);
  inp.addEventListener("input",()=>{ chk.disabled=!inp.value.trim(); });
  inp.addEventListener("keydown",e=>{ if(e.key==="Enter"&&!chk.disabled) chk.click(); });
  const chk=footer(null,{btn:"Проверить",disabled:true,on:()=>{ const v=inp.value.trim().replace(/\s/g,"");
    if(!/^-?\d+$/.test(v)){ toast("Ответ — целое число"); return; }
    done=true; inp.disabled=true; const ok=+v===st.answer; inp.classList.add(ok?"ok":"no"); resolve(ok,st,ok?"":"Твой ответ "+v+"."); }});
}

/* --- собери программу --- */
function tuJoin(chips){ let s=""; chips.forEach((c,i)=>{ if(i) s+=/:$/.test(chips[i-1])?" ":"; "; s+=c; }); return s; }
function tuCode(st,b){
  const k=st.k||10, head=st.head||[], tail=st.tail||[], slots=st.slots.map(s=>({label:s.label,t:(s.pre||[]).slice(),fixed:!!s.fixed,ind:s.ind||0}));
  let cur=slots.findIndex(s=>!s.fixed); if(cur<0) cur=0; let done=false;
  const ref=st.alg?tuRun(st.alg):null;
  const ide=h("div",{class:"ide tu-ide"}); ide.appendChild(h("div",{class:"ide-bar"},'<span class="dots"><i></i><i></i><i></i></span><span class="file">main.py</span>'));
  const runB=h("button",{class:"run",type:"button"},I.play+"Запустить"); ide.firstChild.appendChild(runB);
  const body=h("div",{class:"code"}); ide.appendChild(body);
  const term=h("div",{class:"term"}); term.hidden=true; ide.appendChild(term);
  b.appendChild(ide);
  let algBox=null; if(st.alg){ algBox=tuAlgBox(st.alg,{onLine:li=>{ const si=slots.findIndex(s=>s.alg===li); }}); }
  const palette=h("div",{class:"bank tu-bank"});
  const tools=h("div",{class:"btools"}); const del=h("button",{class:"tool",type:"button"},"<code>⌫</code> Стереть"); tools.appendChild(del);
  if(algBox){ b.insertBefore(algBox,ide); b.insertBefore(h("div",{class:"tu-sub"},"Алгоритм из условия"),algBox); }
  b.appendChild(tools); b.appendChild(palette);
  const code=()=>head.concat(slots.map(s=>" ".repeat(4*s.ind)+tuJoin(s.t)),tail).join("\n");
  function draw(){
    body.innerHTML=""; const gut=h("div",{class:"gut"}), ls=h("div",{class:"lines"}); let n=0;
    const fixed=l=>{ gut.appendChild(h("div",null,String(++n))); ls.appendChild(h("div",{class:"ln"},hl(l)||" ")); };
    head.forEach(fixed);
    slots.forEach((s,si)=>{ gut.appendChild(h("div",null,String(++n)));
      if(s.fixed){ ls.appendChild(h("div",{class:"ln"},hl(" ".repeat(4*s.ind)+tuJoin(s.t)))); return; }
      const ln=h("div",{class:"ln tap tu-slot"+(si===cur&&!done?" cur":"")}); ln.onclick=e=>{ if(done) return; cur=si; draw(); };
      for(let i=0;i<s.ind;i++) ln.appendChild(h("span",{class:"ind"},"    "));
      s.t.forEach((c,ci)=>{ if(ci) ln.appendChild(h("span",{class:"tu-sep"},/:$/.test(s.t[ci-1])?" ":"; "));
        const x=h("button",{class:"chip ide-chip",type:"button"},hl(c)); x.onclick=e=>{ e.stopPropagation(); if(done) return; s.t.splice(ci,1); cur=si; draw(); }; ln.appendChild(x); });
      if(!s.t.length) ln.appendChild(h("span",{class:"tu-ph"},si===cur?"▌ "+esc(s.label||""):esc(s.label||"")));
      ls.appendChild(ln); });
    tail.forEach(fixed);
    body.append(gut,ls);
    if(algBox) algBox.hlLine(slots[cur]&&slots[cur].alg!=null?slots[cur].alg:-1);
    chk.disabled=slots.some(s=>!s.fixed&&!s.t.length);
  }
  (st.chips||[]).forEach(c=>{ const x=h("button",{class:"chip",type:"button"},esc(c)); x.onclick=()=>{ if(done||slots[cur].fixed) return; slots[cur].t.push(c); haptic("tap"); draw(); }; palette.appendChild(x); });
  del.onclick=()=>{ if(done) return; slots[cur].t.pop(); draw(); };
  slots.forEach((s,i)=>{ if(st.slots[i].alg!=null) s.alg=st.slots[i].alg; });
  runB.onclick=()=>{ const r=runPy(code(),[]); showTerm(term,r); };
  const chk=footer(null,{btn:"Проверить",disabled:true,on:()=>{ const r=runPy(code(),[]); done=true; draw(); showTerm(term,r);
    const msg=tuCheckCode(st,r,ref,k);
    if(msg&&r.turtle){ const w=term.querySelector(".tu-view"); if(w&&ref){ w.V.set({ghost:ref.segs.map(s=>s.map(v=>v*k))}); } }
    resolve(!msg,st,msg||""); }});
  draw();
}
/* что не так с программой: null — всё верно */
function tuCheckCode(st,r,ref,k){
  if(r.err) return "Python выдал ошибку "+r.err.type+": "+esc(r.err.msg)+" (строка "+r.err.line+").";
  const T=r.turtle; if(!T) return "Программа ничего не нарисовала: нет строки from turtle import *.";
  if(ref){ const want=tuSample(ref.segs,1), got=tuSample(T.segs,k);
    if(!tuSameSet(want,got)){
      const rot=tuSample(T.segs.map(([a,b,c,d])=>[-b,a,-d,c]),k); // повернуть на 90° против часовой
      if(tuSameSet(want,rot)) return "Рисунок повёрнут: Черепаха в Python сначала смотрит вправо, первой командой нужен <code>lt(90)</code>.";
      if(T.segs.length>ref.segs.length*3+20) return "Лишние линии: перед точками хвост нужно поднять, <code>up()</code>.";
      return "Рисунок не совпадает с алгоритмом. Зелёный пунктир — как должно быть. Проверь, что все расстояния умножены на k, а углы нет.";
    } }
  if(st.dots){ const [x1,x2,y1,y2]=st.dots, have=new Set(T.dots.map(([x,y])=>Math.round(x/k*1000)+","+Math.round(y/k*1000)));
    for(let x=x1;x<=x2;x++) for(let y=y1;y<=y2;y++) if(!have.has(x*1000+","+y*1000)) return "Не хватает точки ("+x+"; "+y+"). Проверь границы range: правая граница в него не входит.";
    if(!ref&&T.segs.length) return "На рисунке лишние линии: перед точками хвост нужно поднять, <code>up()</code>."; }
  return null;
}
}
