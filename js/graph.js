/* ИНФиК: графы и весовые таблицы (задание 1 ЕГЭ). Подключать после editor.js и до lesson.js.
   1) Граф: grView(g,opt) — схема дорог в SVG: вершины, рёбра, веса у линий, значки степеней, подписи «П1» у вершин, нажатие на вершину и на дорогу.
   2) Таблица: grTable(t,opt) — весовая таблица как в ЕГЭ: серая диагональ, числа или звёздочки, счётчики чисел в строках, буквы у строк.
   3) Сопоставление: grIsos(g,t) — все способы назвать строки таблицы буквами графа (для проверки ответов и симметрии).
   4) Шаг урока "graph" (mode vdeg | rdeg | deg | pickv | pickr | cell | edge | match | fill | answer) и блок graph у теории и вопроса: grBlock(spec).
   Данные: g = {v:{A:[x,y],…}, e:[["A","B",12],…], icons:{A:"user"}, names:{A:"Дом"}, lp:{A:"n"}}; координаты любые, y вниз.
           t = {n:6, e:[[1,2,39],…], star:true (звёздочки вместо чисел)}. Поля шага — в комментарии над graphStep. */

const GR_HL={l:"#ecf141",k:"#ff6b9a",c:"#4fd1e8",p:"#8e6bff",o:"#ff9b3d",g:"#5fd38d"};
const grKey=(i,j)=>Math.min(i,j)+"-"+Math.max(i,j);
const grEKey=(a,b)=>[a,b].sort().join("~");
/* смежность и степени */
function grAdj(g){ const A={}; Object.keys(g.v).forEach(v=>A[v]=new Set()); g.e.forEach(([a,b])=>{ A[a].add(b); A[b].add(a); }); return A; }
function grTAdj(t){ const A={}; for(let i=1;i<=t.n;i++) A[i]=new Set(); t.e.forEach(([i,j])=>{ A[i].add(j); A[j].add(i); }); return A; }
function grTW(t){ const W={}; t.e.forEach(([i,j,w])=>W[grKey(i,j)]=w); return W; }
function grGW(g){ const W={}; g.e.forEach(([a,b,w])=>W[grEKey(a,b)]=w); return W; }
/* все сопоставления букв строкам: [{A:3, B:1, …}] */
function grIsos(g,t){
  const L=Object.keys(g.v).sort(), GA=grAdj(g), TA=grTAdj(t), out=[];
  if(L.length!==t.n) return out;
  const m={}, used=new Set();
  (function rec(k){ if(out.length>200) return;
    if(k===L.length){ out.push(Object.assign({},m)); return; }
    const v=L[k];
    for(let i=1;i<=t.n;i++){ if(used.has(i)||TA[i].size!==GA[v].size) continue;
      let ok=true; for(let q=0;q<k;q++){ const u=L[q]; if(GA[v].has(u)!==TA[i].has(m[u])){ ok=false; break; } }
      if(ok){ m[v]=i; used.add(i); rec(k+1); used.delete(i); delete m[v]; } } })(0);
  return out;
}

/* ---------- пиксельные значки вершин 10×10 (вводный урок) ---------- */
const GR_SPR={
 user:["...NNNN...","..NWWWWN..","..NWWWWN..","..NWWWWN..","...NNNN...","..........",".NNNNNNNN.","NPPPPPPPPN","NPPPPPPPPN","NNNNNNNNNN"],
 router:["..N....N..","..N....N..","..N....N..","..N....N..","NNNNNNNNNN","NWWWWWWWWN","NWLWLWWKWN","NWWWWWWWWN","NNNNNNNNNN",".N......N."],
 home:["....NN....","...NLLN...","..NLLLLN..",".NLLLLLLN.","NNNNNNNNNN",".NWWWWWWN.",".NWKWWNNN.",".NWWWWNPN.",".NWWWWNPN.",".NNNNNNNN."],
 school:["....NN....","...NPPN...","NNNNNNNNNN","NWWWWWWWWN","NWCWWWWCWN","NWWWWWWWWN","NWCWNNWCWN","NWWWNPNWWN","NWWWNPNWWN","NNNNNNNNNN"],
 cross:["...NNNN...","...NWWN...","...NWWN...","NNNNWWNNNN","NWWWLLWWWN","NWWWLLWWWN","NNNNWWNNNN","...NWWN...","...NWWN...","...NNNN..."],
 note:["....NNNNNN","....NPPPPN","....NNNNNN","....N....N","....N....N","....N....N","NNNNN..NNN","NPPPN.NPPN","NPPPN.NPPN","NNNN..NNN."],
 phones:["..NNNNNN..",".NWWWWWWN.","NW......WN","N........N","N........N","NN......NN","NPN....NPN","NPN....NPN","NPN....NPN",".N......N."],
 box:["..........","NNNNNNNNNN","NOOOOOOOON","NNNNNNNNNN","NWWWLLWWWN","NWWWLLWWWN","NWWWWWWWWN","NWWWWWWWWN","NNNNNNNNNN",".........."]
};
const GR_SPR_C={P:"#8e6bff",L:"#ecf141",W:"#ffffff",N:"#262b69",K:"#ff6b9a",C:"#4fd1e8",O:"#ff9b3d"};
function grSprite(name,x,y,s){ const a=GR_SPR[name]; if(!a) return ""; const u=s/10; let r="";
  a.forEach((row,j)=>[...row].forEach((c,i)=>{ if(c!==".") r+='<rect x="'+(x-s/2+i*u).toFixed(2)+'" y="'+(y-s/2+j*u).toFixed(2)+'" width="'+(u+.05).toFixed(2)+'" height="'+(u+.05).toFixed(2)+'" fill="'+GR_SPR_C[c]+'"/>'; }));
  return '<g shape-rendering="crispEdges">'+r+'</g>'; }

/* ---------- схема: SVG ---------- */
const GR_DIR={n:[0,-1],s:[0,1],e:[1,0],w:[-1,0],ne:[.75,-.75],nw:[-.75,-.75],se:[.75,.75],sw:[-.75,.75]};
/* opt: w (показывать веса, по умолчанию да, если они есть), hlV {A:"l"}, hlE [[a,b,цвет]], badges {A:"2"|"?"} + badgeCls {A:"ok"|"no"},
        tags {A:"П1"}, sel (Set вершин), selE (Set ключей рёбер), onV(v), onE(a,b), dimE (бледные рёбра кроме hlE) */
function grView(g,opt){
  const wrap=h("div",{class:"gr-view"}); const V={g,opt:Object.assign({},opt||{})};
  const ids=Object.keys(g.v), P0=ids.map(k=>g.v[k]);
  const x1=Math.min(...P0.map(p=>p[0])), x2=Math.max(...P0.map(p=>p[0])), y1=Math.min(...P0.map(p=>p[1])), y2=Math.max(...P0.map(p=>p[1]));
  const sc=Math.min(280/Math.max(1,x2-x1), (g.h||190)/Math.max(1,y2-y1));
  const P={}; ids.forEach(k=>P[k]=[(g.v[k][0]-x1)*sc,(g.v[k][1]-y1)*sc]);
  const cx=P0.length?ids.reduce((a,k)=>a+P[k][0],0)/ids.length:0, cy=ids.reduce((a,k)=>a+P[k][1],0)/Math.max(1,ids.length);
  const W=(x2-x1)*sc, H=(y2-y1)*sc;
  function labPos(k){ let d;
    if(g.lp&&g.lp[k]) d=GR_DIR[g.lp[k]];
    else { let dx=P[k][0]-cx, dy=P[k][1]-cy; const n=Math.hypot(dx,dy)||1; dx/=n; dy/=n;
      /* не класть подпись на ребро: сдвигаем от ближайшего ребра */
      const nb=g.e.filter(e=>e[0]===k||e[1]===k).map(e=>e[0]===k?e[1]:e[0]);
      let best=[dx,dy], bs=-9;
      for(let a=0;a<16;a++){ const ang=a*Math.PI/8, ux=Math.cos(ang), uy=Math.sin(ang);
        let s=ux*dx+uy*dy; nb.forEach(o=>{ let ex=P[o][0]-P[k][0], ey=P[o][1]-P[k][1]; const m=Math.hypot(ex,ey)||1; s-=Math.max(0,(ux*ex+uy*ey)/m)*1.6; });
        if(s>bs){ bs=s; best=[ux,uy]; } }
      d=best; }
    if(g.names&&g.icons&&g.icons[k]) return [P[k][0], P[k][1]+33];
    const r=g.icons&&g.icons[k]?30:17; return [P[k][0]+d[0]*r, P[k][1]+d[1]*r+5]; }
  function wPos(a,b){ const [ax,ay]=P[a],[bx,by]=P[b]; let mx=(ax+bx)/2, my=(ay+by)/2; let nx=-(by-ay), ny=bx-ax; const n=Math.hypot(nx,ny)||1; nx/=n; ny/=n;
    if((mx-cx)*nx+(my-cy)*ny<0){ nx=-nx; ny=-ny; }
    if(g.wp&&g.wp[grEKey(a,b)]==="in"){ nx=-nx; ny=-ny; }
    return [mx+nx*11, my+ny*11+4.5]; }
  V.draw=function(){ const o=V.opt; let s="";
    const hlE={}; (o.hlE||[]).forEach(([a,b,c])=>hlE[grEKey(a,b)]=c||"l");
    const showW=o.w!==false;
    g.e.forEach(([a,b,w])=>{ const k=grEKey(a,b), c=hlE[k], sel=o.selE&&o.selE.has(k), ok=o.okE&&o.okE.has(k), no=o.noE&&o.noE.has(k);
      const [ax,ay]=P[a],[bx,by]=P[b];
      if(c||sel||ok||no) s+='<line x1="'+ax+'" y1="'+ay+'" x2="'+bx+'" y2="'+by+'" stroke="'+(ok?"#5fd38d":no?"#ff6b9a":sel?"#8e6bff":GR_HL[c])+'" stroke-width="9" stroke-linecap="round"/>';
      s+='<line x1="'+ax+'" y1="'+ay+'" x2="'+bx+'" y2="'+by+'" class="gr-ln'+(o.dimE&&!c?' dim':'')+'"/>';
      if(o.onE) s+='<line x1="'+ax+'" y1="'+ay+'" x2="'+bx+'" y2="'+by+'" class="gr-hitE" data-e="'+a+'|'+b+'"/>';
      if(showW&&w!=null){ const [lx,ly]=wPos(a,b); s+='<text x="'+lx+'" y="'+ly+'" class="gr-w'+(c?' hl':'')+'">'+w+'</text>'; } });
    ids.forEach(k=>{ const [x,y]=P[k], c=o.hlV&&o.hlV[k], sel=o.sel&&o.sel.has(k), ok=o.okV&&o.okV.has(k), no=o.noV&&o.noV.has(k);
      const ic=g.icons&&g.icons[k];
      if(c||sel||ok||no) s+='<circle cx="'+x+'" cy="'+y+'" r="'+(ic?25:11)+'" fill="'+(ok?"#5fd38d":no?"#ff6b9a":sel?"#8e6bff":GR_HL[c])+'"/>';
      if(ic) s+='<rect x="'+(x-19)+'" y="'+(y-19)+'" width="38" height="38" rx="7" class="gr-icbg"/>'+grSprite(ic,x,y,28);
      else s+='<circle cx="'+x+'" cy="'+y+'" r="5" class="gr-pt"/>';
      const [lx,ly]=labPos(k), lab=g.names&&g.names[k]!=null?g.names[k]:k;
      if(lab!=="") s+='<text x="'+lx+'" y="'+ly+'" class="gr-lab'+(g.names?' nm':'')+'">'+esc(lab)+'</text>';
      const bd=o.badges&&o.badges[k]; if(bd!=null){ const bx=lx+(lab.length>1?lab.length*4.5+12:18), by=ly-5, cl=o.badgeCls&&o.badgeCls[k]||"";
        s+='<g class="gr-bd '+cl+(bd==="?"?' ask':'')+'"><rect x="'+(bx-9)+'" y="'+(by-9)+'" width="18" height="18" rx="5"/><text x="'+bx+'" y="'+(by+4.5)+'">'+bd+'</text></g>'; }
      const tg=o.tags&&o.tags[k]; if(tg){ const tx=lx, ty=ly+(ly<y?-19:15); s+='<g class="gr-tag"><rect x="'+(tx-15)+'" y="'+(ty-10)+'" width="30" height="17" rx="5"/><text x="'+tx+'" y="'+(ty+3)+'">'+esc(tg)+'</text></g>'; }
      if(o.onV) s+='<circle cx="'+x+'" cy="'+y+'" r="22" class="gr-hitV" data-v="'+esc(k)+'"/>'; });
    /* рамка: точки, подписи и место под плашки (если у вида есть tags или badges — даже пустые) */
    let bx1=0,by1=0,bx2=W,by2=H; const grow=(x,y)=>{ bx1=Math.min(bx1,x); bx2=Math.max(bx2,x); by1=Math.min(by1,y); by2=Math.max(by2,y); };
    ids.forEach(k=>{ const [lx,ly]=labPos(k), ic=g.icons&&g.icons[k]; grow(P[k][0]-(ic?22:12),P[k][1]-(ic?22:12)); grow(P[k][0]+(ic?22:12),P[k][1]+(ic?22:12));
      grow(lx-12,ly-18); grow(lx+12,ly+6);
      if(o.badges) grow(lx+29,ly-15);
      if(o.tags){ const ty=ly+(ly<P[k][1]?-19:15); grow(lx-17,ty-12); grow(lx+17,ty+9); } });
    g.e.forEach(([a,c,w])=>{ if(w!=null&&o.w!==false){ const [lx,ly]=wPos(a,c); grow(lx-16,ly-14); grow(lx+16,ly+5); } });
    const vb=[bx1-6,by1-6,bx2-bx1+12,by2-by1+12];
    wrap.innerHTML='<svg viewBox="'+vb.join(" ")+'" class="gr-svg" role="img" aria-label="Схема дорог">'+s+'</svg>';
  };
  wrap.addEventListener("click",ev=>{ const t=ev.target, o=V.opt;
    if(t.dataset&&t.dataset.v&&o.onV) return o.onV(t.dataset.v);
    if(t.dataset&&t.dataset.e&&o.onE){ const [a,b]=t.dataset.e.split("|"); o.onE(a,b); } });
  V.set=x=>{ Object.assign(V.opt,x); V.draw(); };
  wrap.V=V; V.draw(); return wrap;
}

/* ---------- весовая таблица ---------- */
/* opt: hlC [[i,j,цвет]] (клетка и зеркальная), hlR {i:цвет}, cnt {i:"3"|"?"} + cntCls, tags {i:"F"}, onCell(i,j), onRow(i), onCnt(i),
        hide Set("i-j") — пустые клетки для заполнения, vals {"i-j":v}, selC "i-j", selR i, cellCls {"i-j":"ok"|"no"}, mirror (подсветка зеркальной: да) */
function grTable(t,opt){
  const wrap=h("div",{class:"gr-twrap"}), V={t,opt:Object.assign({},opt||{})}; const TW=grTW(t);
  V.draw=function(){ const o=V.opt, n=t.n; const hl={}; (o.hlC||[]).forEach(([i,j,c])=>{ hl[i+"-"+j]=c||"l"; if(o.mirror!==false) hl[j+"-"+i]=c||"l"; });
    const hasTags=!!o.tags, hasCnt=!!o.cnt;
    let s='<table class="gr-t'+(t.star?' star':'')+(n>7?' wide':'')+'"><tr>'+(hasTags?'<th class="tg"></th>':'')+'<th class="c0"></th>';
    for(let j=1;j<=n;j++) s+='<th class="ch'+(o.hlR&&o.hlR[j]?' hl-'+o.hlR[j]:'')+'">П'+j+'</th>';
    if(hasCnt) s+='<th class="cn-h">дорог</th>';
    s+='</tr>';
    for(let i=1;i<=n;i++){ const rh=o.hlR&&o.hlR[i];
      s+='<tr>'+(hasTags?'<td class="tg'+(o.tags[i]?' on':'')+(o.selR===i?' sel':'')+'" data-r="'+i+'">'+(o.tags[i]?esc(o.tags[i]):'')+'</td>':'');
      s+='<th class="rh'+(rh?' hl-'+rh:'')+(o.selR===i?' sel':'')+(o.onRow?' tap':'')+'" data-r="'+i+'">П'+i+'</th>';
      for(let j=1;j<=n;j++){ const k=i+"-"+j;
        if(i===j){ s+='<td class="dg"></td>'; continue; }
        const key=grKey(i,j), w=TW[key]; let v=w==null?"":t.star?"*":w, cls="";
        if(o.hide&&o.hide.has(k)){ v=o.vals&&o.vals[k]!=null?o.vals[k]:""; cls+=" fill"+(v!==""?" set":""); }
        if(hl[k]) cls+=" hl-"+hl[k];
        if(o.selC===k) cls+=" sel";
        if(o.cellCls&&o.cellCls[k]) cls+=" "+o.cellCls[k];
        if(o.onCell) cls+=" tap";
        s+='<td class="'+cls.trim()+'" data-c="'+k+'">'+v+'</td>'; }
      if(hasCnt){ const c=o.cnt[i], cl=o.cntCls&&o.cntCls[i]||""; s+='<td class="cn'+(c==="?"?' ask':'')+' '+cl+(o.onCnt?' tap':'')+'" data-n="'+i+'">'+(c==null?"":c)+'</td>'; }
      s+='</tr>'; }
    wrap.innerHTML=s+'</table>';
  };
  wrap.addEventListener("click",ev=>{ const td=ev.target.closest("td,th"); if(!td) return; const o=V.opt;
    if(td.dataset.c&&o.onCell){ const [i,j]=td.dataset.c.split("-").map(Number); return o.onCell(i,j); }
    if(td.dataset.n&&o.onCnt) return o.onCnt(+td.dataset.n);
    if(td.dataset.r&&o.onRow) return o.onRow(+td.dataset.r); });
  V.set=x=>{ Object.assign(V.opt,x); V.draw(); };
  wrap.V=V; V.draw(); return wrap;
}

/* ---------- блок для теории и вопроса ---------- */
/* spec: {g, t, w, hlV, hlE, hlC, hlR, deg:true (степени у вершин), cnt:true (числа в строках), tags {A:"П1"}, rtags {1:"F"}, only:"g"|"t", cap} */
function grBlock(sp){
  const box=h("div",{class:"gr-block"});
  if(sp.g&&sp.only!=="t"){ const A=grAdj(sp.g), bd={}; if(sp.deg) Object.keys(A).forEach(k=>bd[k]=String(A[k].size));
    box.appendChild(grView(sp.g,{w:sp.w,hlV:sp.hlV,hlE:sp.hlE,badges:sp.deg?bd:null,tags:sp.tags,dimE:sp.dimE})); }
  if(sp.t&&sp.only!=="g"){ const A=grTAdj(sp.t), cn={}; if(sp.cnt) Object.keys(A).forEach(k=>cn[k]=String(A[k].size));
    box.appendChild(grTable(sp.t,{hlC:sp.hlC,hlR:sp.hlR,cnt:sp.cnt?cn:null,tags:sp.rtags})); }
  if(sp.cap) box.appendChild(h("p",{class:"gr-cap"},sp.cap));
  return box;
}

/* ---------- шаг урока "graph" ----------
   Общие поля: g, t (что показать), w:false — не показывать веса на схеме, text, hlV/hlE/hlC/hlR — подсветка.
   mode:"vdeg"  — подписать степень каждой вершины (нажатие меняет ? → 1 → 2 …); ask:["A",…] — какие вершины (по умолчанию все).
   mode:"rdeg"  — подписать, сколько дорог в каждой строке таблицы. mode:"deg" — и то и другое.
   mode:"pickv" — нажать на вершины: ans ["C","A"] (набор), alt [[…]] — другие верные наборы.
   mode:"pickr" — нажать на строки таблицы: ans [2,6], alt.
   mode:"cell"  — нажать на клетки: ans [[4,6],[3,2]] (порядок в паре не важен), alt [[[…]]].
   mode:"edge"  — нажать на дороги схемы: ans [["E","A"]], alt.
   mode:"match" — подписать строки буквами: нажать на строку, потом на вершину; rows [1,5] — какие строки нужны (по умолчанию все);
                  верно, если подписи не противоречат хотя бы одному сопоставлению (симметрия учтена); fixed {1:"F"} — уже подписано.
   mode:"fill"  — заполнить клетки таблицы: fill [[1,2],[2,1]] — какие клетки пусты, chips [12,25] — числа (многоразовые).
   mode:"answer"— ответ числом или строкой цифр: answer; notes — можно подписывать строки буквами для себя (на проверку не влияет), fixed.
   Подсказка после ошибки — why шага. */
function graphStep(st,b){
  [].concat(st.text||[]).forEach(t=>b.appendChild(h("p",{class:"txt"},t)));
  ({vdeg:grDeg,rdeg:grDeg,deg:grDeg,pickv:grPick,pickr:grPick,cell:grPick,edge:grPick,match:grMatch,fill:grFill,answer:grAnswer})[st.mode](st,b);
}
function grShake(){ const lb=$("#lbody"); lb.classList.remove("shake"); void lb.offsetWidth; lb.classList.add("shake"); haptic("error"); }
function grNote(b,t){ b.appendChild(h("p",{class:"note"},t)); }

/* --- степени --- */
function grDeg(st,b){
  const doV=st.mode!=="rdeg", doR=st.mode!=="vdeg";
  const GA=st.g?grAdj(st.g):null, TA=st.t?grTAdj(st.t):null;
  const askV=doV?(st.ask||Object.keys(st.g.v)):[], askR=doR?(st.askR||Object.keys(TA).map(Number)):[];
  const bv={}, br={}; askV.forEach(k=>bv[k]="?"); askR.forEach(i=>br[i]="?");
  const max=st.max||5; let done=false;
  const cyc=x=>x==="?"?"1":+x>=max?"?":String(+x+1);
  let gv=null, tv=null;
  if(st.g){ const fixed={}; if(!doV&&st.deg) Object.keys(GA).forEach(k=>fixed[k]=String(GA[k].size));
    gv=grView(st.g,{w:st.w,hlV:st.hlV,hlE:st.hlE,badges:doV?bv:(st.deg?fixed:null),onV:doV?(k=>{ if(done||!(k in bv)) return; bv[k]=cyc(bv[k]); haptic("tap"); gv.V.draw(); upd(); }):null}); b.appendChild(gv); }
  if(st.t){ tv=grTable(st.t,{hlR:st.hlR,hlC:st.hlC,cnt:doR?br:null,onCnt:doR?(i=>{ if(done||!(i in br)) return; br[i]=cyc(br[i]); haptic("tap"); tv.V.draw(); upd(); }):null,
    onRow:doR?(i=>{ if(done||!(i in br)) return; br[i]=cyc(br[i]); haptic("tap"); tv.V.draw(); upd(); }):null}); b.appendChild(tv); }
  grNote(b,(doV?"Нажимай на вершину: число рядом с ней растёт. ":"")+(doR?"Нажимай на строку: число в столбце «дорог» растёт.":""));
  function upd(){ chk.disabled=Object.values(bv).concat(Object.values(br)).some(x=>x==="?"); }
  const chk=footer(null,{btn:"Проверить",disabled:true,on:()=>{ done=true; let bad=0; const cv={}, cr={};
    askV.forEach(k=>{ const ok=+bv[k]===GA[k].size; cv[k]=ok?"ok":"no"; if(!ok){ bad++; bv[k]=String(GA[k].size); } });
    askR.forEach(i=>{ const ok=+br[i]===TA[i].size; cr[i]=ok?"ok":"no"; if(!ok){ bad++; br[i]=String(TA[i].size); } });
    if(gv) gv.V.set({badgeCls:cv}); if(tv) tv.V.set({cntCls:cr});
    resolve(!bad,st,bad?"Ошибок: "+bad+", правильные числа уже стоят на местах.":""); }});
}

/* --- нажми на вершины, строки, клетки, дороги --- */
function grPick(st,b){
  const m=st.mode, sel=new Set(); let done=false, gv=null, tv=null;
  const norm=x=>m==="cell"?grKey(x[0],x[1]):m==="edge"?grEKey(x[0],x[1]):String(x);
  const sets=[st.ans].concat(st.alt||[]).map(a=>new Set(a.map(norm))), need=sets[0].size;
  const tog=k=>{ if(done) return; if(sel.has(k)) sel.delete(k); else { if(need===1) sel.clear(); sel.add(k); } haptic("tap"); draw(); };
  if(st.g){ gv=grView(st.g,{w:st.w,hlV:st.hlV,hlE:st.hlE,tags:st.tags,badges:st.deg?grDegMap(st.g):null,onV:m==="pickv"?(k=>tog(k)):null,onE:m==="edge"?((a,c)=>tog(grEKey(a,c))):null}); b.appendChild(gv); }
  if(st.t){ tv=grTable(st.t,{hlC:st.hlC,hlR:st.hlR,tags:st.rtags,cnt:st.cnt?grCntMap(st.t):null,onRow:m==="pickr"?(i=>tog(String(i))):null,onCell:m==="cell"?((i,j)=>tog(grKey(i,j))):null}); b.appendChild(tv); }
  function draw(){
    if(gv){ if(m==="pickv") gv.V.set({sel}); if(m==="edge") gv.V.set({selE:sel}); }
    if(tv){ if(m==="pickr") tv.V.set({hlR:Object.assign({},st.hlR||{},Object.fromEntries([...sel].map(i=>[i,"p"])))});
      if(m==="cell"){ const cc={}; sel.forEach(k=>{ const [i,j]=k.split("-"); cc[i+"-"+j]="sel"; cc[j+"-"+i]="sel"; }); tv.V.set({cellCls:cc}); } }
    chk.disabled=sel.size!==need; }
  const one={pickv:"Нажми на вершину схемы.",pickr:"Нажми на номер строки таблицы.",cell:"Нажми на клетку таблицы.",edge:"Нажми на дорогу на схеме."}[m];
  const many={pickv:"вершины схемы",pickr:"номера строк таблицы",cell:"клетки таблицы",edge:"дороги на схеме"}[m];
  grNote(b,need>1?"Выбери "+many+": нужно "+need+". Повторное нажатие снимает выбор.":one);
  const chk=footer(null,{btn:"Проверить",disabled:true,on:()=>{ done=true;
    const hit=sets.find(S=>S.size===sel.size&&[...sel].every(k=>S.has(k))), ok=!!hit, right=hit||sets[0];
    if(m==="pickv") gv.V.set({sel:new Set(),okV:new Set([...sel].filter(k=>right.has(k))),noV:new Set([...sel].filter(k=>!right.has(k))),hlV:Object.assign({},st.hlV||{},ok?{}:Object.fromEntries([...right].filter(k=>!sel.has(k)).map(k=>[k,"g"])))});
    if(m==="edge") gv.V.set({selE:new Set(),okE:new Set(ok?[...sel]:[...right]),noE:new Set([...sel].filter(k=>!right.has(k)))});
    if(m==="pickr"){ const hr=Object.assign({},st.hlR||{}); [...right].forEach(i=>hr[i]="g"); [...sel].filter(k=>!right.has(k)).forEach(i=>hr[i]="k"); tv.V.set({hlR:hr}); }
    if(m==="cell"){ const cc={}; [...right].forEach(k=>{ const [i,j]=k.split("-"); cc[i+"-"+j]=cc[j+"-"+i]="ok"; }); [...sel].filter(k=>!right.has(k)).forEach(k=>{ const [i,j]=k.split("-"); cc[i+"-"+j]=cc[j+"-"+i]="no"; }); tv.V.set({cellCls:cc}); }
    resolve(ok,st); }});
}
const grDegMap=g=>{ const A=grAdj(g), o={}; Object.keys(A).forEach(k=>o[k]=String(A[k].size)); return o; };
const grCntMap=t=>{ const A=grTAdj(t), o={}; Object.keys(A).forEach(k=>o[k]=String(A[k].size)); return o; };

/* --- подписи строк буквами (общая часть для match и answer) --- */
function grMatcher(st,b,onChange){
  const M=Object.assign({},st.fixed||{}); /* строка → буква */
  const fixed=new Set(Object.keys(st.fixed||{}).map(Number)); let selR=null, selV=null, lock=false;
  const tagsV=()=>{ const o={}; Object.keys(M).forEach(i=>o[M[i]]="П"+i); return o; };
  const gv=grView(st.g,{w:st.w,hlV:st.hlV,hlE:st.hlE,badges:st.deg?grDegMap(st.g):null,tags:tagsV(),onV:k=>{ if(lock) return; selV=k; tryPut(); }});
  const tv=grTable(st.t,{hlC:st.hlC,hlR:st.hlR,cnt:st.cnt?grCntMap(st.t):null,tags:M,onRow:i=>{ if(lock||fixed.has(i)) return; selR=selR===i?null:i; tryPut(); }});
  function tryPut(){
    if(selR!=null&&selV!=null){ Object.keys(M).forEach(i=>{ if(M[i]===selV&&!fixed.has(+i)) delete M[i]; });
      if(!Object.values(M).includes(selV)||M[selR]===selV) M[selR]=selV; else toast("Буква "+selV+" уже стоит у другой строки");
      selR=null; selV=null; haptic("tap"); }
    else if(selV!=null&&selR==null){ const i=Object.keys(M).find(i=>M[i]===selV&&!fixed.has(+i)); if(i){ delete M[i]; haptic("tap"); } else toast("Сначала нажми на строку таблицы (П1, П2…), потом на вершину"); selV=null; }
    draw(); }
  function draw(){ gv.V.set({tags:tagsV(),sel:new Set()}); tv.V.set({tags:M,selR}); if(onChange) onChange(M); }
  b.append(gv,tv);
  return {M,gv,tv,draw,lock:()=>{ lock=true; },clear:()=>{ Object.keys(M).forEach(i=>{ if(!fixed.has(+i)) delete M[i]; }); draw(); }};
}
/* почему подписи неверны: первая найденная причина */
function grWhyBad(st,M){
  const GA=grAdj(st.g), TA=grTAdj(st.t), rows=Object.keys(M).map(Number);
  for(const i of rows){ const v=M[i]; if(GA[v].size!==TA[i].size) return "У П"+i+" "+plural(TA[i].size,"дорога","дороги","дорог")+", а у "+v+" — "+GA[v].size+"."; }
  for(const i of rows) for(const j of rows){ if(i>=j) continue; const a=M[i], c=M[j];
    if(TA[i].has(j)&&!GA[a].has(c)) return "П"+i+" и П"+j+" в таблице соединены, а "+a+" и "+c+" на схеме — нет.";
    if(!TA[i].has(j)&&GA[a].has(c)) return a+" и "+c+" на схеме соединены, а П"+i+" и П"+j+" в таблице — нет."; }
  return "Такие подписи не сходятся с остальной схемой: проверь соседей.";
}
function grMatch(st,b){
  const isos=grIsos(st.g,st.t), need=st.rows||Array.from({length:st.t.n},(_,i)=>i+1);
  let chk;
  const api=grMatcher(st,b,M=>{ if(chk) chk.disabled=!need.every(i=>M[i]); });
  const clr=h("button",{class:"gr-clr",type:"button"},"Стереть подписи"); clr.onclick=()=>api.clear();
  grNote(b,"Нажми на строку таблицы, потом на вершину схемы: у строки появится буква, у вершины — номер строки."+(need.length<st.t.n?" Подписать нужно: "+need.map(i=>"П"+i).join(", ")+".":"")); b.appendChild(clr);
  chk=footer(null,{btn:"Проверить",disabled:true,on:()=>{ const M=api.M, keys=Object.keys(M).map(Number);
    const ok=isos.some(m=>keys.every(i=>m[M[i]]===i)); api.lock(); clr.remove();
    const right=isos.find(m=>keys.every(i=>m[M[i]]===i))||isos[0];
    if(!ok){ const want={}; Object.keys(right).forEach(v=>want[right[v]]=v); api.tv.V.set({tags:Object.fromEntries(need.map(i=>[i,want[i]]))}); api.gv.V.set({tags:Object.fromEntries(need.map(i=>[want[i],"П"+i]))}); }
    resolve(ok,st,ok?"":grWhyBad(st,M)+" Верные подписи теперь на схеме."); }});
  chk.disabled=!need.every(i=>api.M[i]);
}

/* --- заполни таблицу --- */
function grFill(st,b){
  const hide=new Set(st.fill.map(([i,j])=>i+"-"+j)), vals={}, TW=grTW(st.t); let sel=null, done=false;
  if(st.g) b.appendChild(grView(st.g,{w:st.w,hlE:st.hlE,hlV:st.hlV,tags:st.tags}));
  const tv=grTable(st.t,{hide,vals,hlC:st.hlC,tags:st.rtags,onCell:(i,j)=>{ if(done) return; const k=i+"-"+j; if(!hide.has(k)) return; sel=k; haptic("tap"); tv.V.set({selC:sel}); }}); b.appendChild(tv);
  const bank=h("div",{class:"bank gr-bank"}); (st.chips||[]).forEach(c=>{ const x=h("button",{class:"chip",type:"button"},String(c)); x.onclick=()=>put(String(c)); bank.appendChild(x); });
  const er=h("button",{class:"chip gr-er",type:"button"},"⌫"); er.onclick=()=>put(null); bank.appendChild(er);
  grNote(b,st.free?"Нажми на клетку, потом на звёздочку. Клетки без дороги оставь пустыми, ⌫ стирает.":"Нажми на пустую клетку, потом на число."); b.appendChild(bank);
  function put(v){ if(done) return; if(!sel){ toast("Сначала нажми на пустую клетку"); return; } if(v==null) delete vals[sel]; else vals[sel]=v; haptic("tap");
    const nx=[...hide].find(k=>vals[k]==null); if(v!=null&&nx&&!st.free) sel=nx; tv.V.set({vals,selC:sel}); chk.disabled=!st.free&&[...hide].some(k=>vals[k]==null); }
  sel=[...hide][0]; tv.V.set({selC:sel});
  const chk=footer(null,{btn:"Проверить",disabled:!st.free,on:()=>{ done=true; const cls={}; let bad=0;
    hide.forEach(k=>{ const [i,j]=k.split("-").map(Number), w=TW[grKey(i,j)], want=w==null?"":st.t.star?"*":String(w); const ok=(vals[k]||"")===want; cls[k]=ok?"ok":"no"; if(!ok){ bad++; vals[k]=want; } });
    tv.V.set({cellCls:cls,vals,selC:null}); bank.remove(); resolve(!bad,st,bad?"Неверных клеток: "+bad+", правильные числа уже вписаны.":""); }});
}

/* --- ответ --- */
function grAnswer(st,b){
  let api=null;
  if(st.g&&st.t&&st.notes!==false){ api=grMatcher(st,b,null);
    const row=h("div",{class:"gr-nrow"}); const clr=h("button",{class:"gr-clr",type:"button"},"Стереть подписи"); clr.onclick=()=>api.clear();
    row.append(h("span",null,"Можно подписывать строки буквами: нажми на строку, потом на вершину. На проверку подписи не влияют."),clr); b.appendChild(row); }
  else b.appendChild(grBlock(st));
  const inp=h("input",{class:"tu-ans gr-ans",inputmode:"numeric",autocomplete:"off","aria-label":"Ответ",placeholder:"Ответ"}); b.appendChild(inp);
  inp.addEventListener("input",()=>{ chk.disabled=!inp.value.trim(); });
  inp.addEventListener("keydown",e=>{ if(e.key==="Enter"&&!chk.disabled) chk.click(); });
  const chk=footer(null,{btn:"Проверить",disabled:true,on:()=>{ const v=inp.value.trim().replace(/\s/g,"");
    if(!/^\d+$/.test(v)){ toast("Ответ — целое число, без пробелов и знаков"); return; }
    inp.disabled=true; if(api) api.lock(); const ok=v===String(st.answer); inp.classList.add(ok?"ok":"no"); resolve(ok,st,ok?"":"Твой ответ "+v+"."); }});
}
