/* ИНФиК: шаг урока "truth" — таблицы истинности (задание 2). Подключать после core.js и до lesson.js.
   Выражения пишутся знаками ЕГЭ: ¬ ∧ ∨ → ≡, переменные — одна латинская буква, скобки.
   Поля шага:
     vars ["x","y"] — столбцы переменных (их порядок задаёт порядок строк 00, 01, 10, 11);
     cols [{h:"x ∧ y", e:"x ∧ y", ask:true}] — столбцы после переменных: h — шапка, e — выражение (по умолчанию h), ask — ученик заполняет сам;
     rows ["01","11"] — показать только эти наборы (по умолчанию все 2ⁿ); askVars — значения переменных заполняет ученик; hideVars — не рисовать столбцы переменных (набор назван в заголовке);
     mode "fill" — нажатием на клетки ученик ставит 0 и 1 в столбцы ask (и в переменные, если askVars);
     mode "pick" — нажми на строки, где столбец pick.col (номер с 0 среди cols, по умолчанию последний) равен pick.val;
     mode "show" — готовая таблица без задания (hl: {val:0} подсветить строки, где последний столбец равен val);
     mode "match" — фрагмент без подписей: expr, frag [["","0","1","0","0"], ...] (последнее значение — F), vars;
                    ученик расставляет буквы по столбцам, строки фрагмента отмечаются ✓/✗; out true — рядом вывод программы (строки с нужным F);
                    answer "yxzw" (если не указан — считается сам; в файле урока он всё равно нужен для проверки валидатором);
     mode "answer" — тот же фрагмент только для чтения и поле ответа (answer "yxzw");
     mode "translate" — собрать запись выражения expr на Python из блоков: bank (одноразовые), reuse (многоразовые, по умолчанию скобки);
                    проверка — запуск мини-Python на всех 2ⁿ наборах; при расхождении показан первый набор, где ответ другой; text, why, kind, title. */
const TT_OPS={"≡":1,"→":2,"∨":3,"∧":4};
function ttParse(src){
  const toks=(src.match(/[a-zA-Z]|[¬∧∨→≡()01]/g)||[]); let p=0;
  function prim(){ const t=toks[p++];
    if(t==="¬") return {k:"not",a:prim()};
    if(t==="("){ const e=bin(0); if(toks[p++]!==")") throw new Error("скобка в «"+src+"»"); return e; }
    if(t==="0"||t==="1") return {k:"c",v:+t};
    if(!t||!/[a-zA-Z]/.test(t)) throw new Error("выражение «"+src+"»");
    return {k:"v",n:t}; }
  function bin(min){ let l=prim(); while(p<toks.length&&TT_OPS[toks[p]]>min){ const op=toks[p++]; const r=bin(TT_OPS[op]); l={k:op,a:l,b:r}; } return l; }
  const e=bin(0); if(p!==toks.length) throw new Error("выражение «"+src+"»"); return e;
}
function ttEval(e,env){
  switch(e.k){ case "v": return env[e.n]; case "c": return e.v; case "not": return 1-ttEval(e.a,env); }
  const a=ttEval(e.a,env), b=ttEval(e.b,env);
  return e.k==="∧"?a&b:e.k==="∨"?a|b:e.k==="→"?(a<=b?1:0):(a===b?1:0);
}
const TT_CACHE={};
function ttFn(src){ return TT_CACHE[src]||(TT_CACHE[src]=(t=>env=>ttEval(t,env))(ttParse(src))); }
function ttVarsOf(src){ return [...new Set(src.match(/[a-zA-Z]/g)||[])].sort(); }
function ttSets(n){ const a=[]; for(let i=0;i<1<<n;i++) a.push(i.toString(2).padStart(n,"0")); return a; }
function ttEnv(vars,bits){ const e={}; vars.forEach((v,i)=>e[v]=+bits[i]); return e; }
/* все подходящие расстановки букв по столбцам фрагмента (строки фрагмента — разные строки таблицы) */
function ttSolve(expr,frag,vars){
  vars=vars||ttVarsOf(expr); const f=ttFn(expr), n=vars.length, sets=ttSets(n), res=[];
  const perms=a=>a.length<2?[a]:a.flatMap((x,i)=>perms(a.slice(0,i).concat(a.slice(i+1))).map(r=>[x].concat(r)));
  perms(vars).forEach(perm=>{ if(ttFit(f,vars,perm,frag,sets).ok) res.push(perm.join("")); });
  return res;
}
/* perm[i] — буква i-го столбца или null. Для каждой строки фрагмента: подходящие наборы; ok — есть разные наборы для всех строк */
function ttFit(f,vars,perm,frag,sets){
  sets=sets||ttSets(vars.length);
  const cand=frag.map(row=>sets.filter(bits=>{ const env=ttEnv(vars,bits); if(f(env)!==+row[row.length-1]) return false;
    return row.slice(0,-1).every((c,i)=>c===""||perm[i]==null||env[perm[i]]===+c); }));
  const inj=(i,used)=>i===cand.length||cand[i].some(o=>!used.has(o)&&inj(i+1,new Set(used).add(o)));
  return {cand,ok:cand.every(c=>c.length)&&inj(0,new Set())};
}
function ttSym(s){ return esc(s).replace(/([¬∧∨→≡])/g,'<span class="tt-op">$1</span>'); }

function truthStep(st,b){
  [].concat(st.text||[]).forEach(t=>b.appendChild(h("p",{class:"txt"},t)));
  if(st.mode==="match"||st.mode==="answer") return ttMatch(st,b);
  if(st.mode==="translate") return ttTranslate(st,b);
  return ttTable(st,b);
}
/* ===== обычная таблица: fill / pick / show ===== */
function ttTable(st,b){
  const vars=st.vars, cols=(st.cols||[]).map(c=>Object.assign({e:c.h},c)), fns=cols.map(c=>ttFn(c.e));
  const rows=st.rows||ttSets(vars.length), mode=st.mode||(cols.some(c=>c.ask)||st.askVars?"fill":"show");
  const want=rows.map(bits=>{ const env=ttEnv(vars,bits); return vars.map(v=>env[v]).concat(fns.map(f=>f(env))); });
  const askCol=k=>k<vars.length?!!st.askVars:!!cols[k-vars.length].ask;
  const hideV=!!st.hideVars&&!st.askVars, vis=k=>!(hideV&&k<vars.length);
  const grid=h("div",{class:"tt-grid"}); grid.style.setProperty("--cols",(hideV?0:vars.length)+cols.length);
  if(vars.length) grid.style.setProperty("--vars",vars.length);
  const heads=vars.map(v=>'<i>'+v+'</i>').concat(cols.map(c=>ttSym(c.h)));
  heads.forEach((x,k)=>{ if(vis(k)) grid.appendChild(h("div",{class:"tt-h"+(k===vars.length-1?" sep":"")},x)); });
  const cells=[], rowEls=[]; const val=rows.map(()=>[]);
  rows.forEach((bits,r)=>{ cells.push([]); want[r].forEach((v,k)=>{
    const d=h("div",{class:"tt-c"+(k===vars.length-1?" sep":"")+(k>=vars.length?" fx":"")});
    if(mode==="fill"&&askCol(k)){ d.classList.add("ask"); val[r][k]=""; d.textContent="";
      d.onclick=()=>{ if(done) return; val[r][k]=val[r][k]===""?"0":val[r][k]==="0"?"1":"0"; d.textContent=val[r][k]; d.classList.add("set"); haptic("tap"); upd(); }; }
    else d.textContent=v;
    if(vis(k)) grid.appendChild(d); cells[r].push(d); }); });
  const wrap=h("div",{class:"tt-wrap"}); wrap.appendChild(grid); b.appendChild(wrap);
  const rowCells=r=>cells[r];
  if(st.hl){ rows.forEach((bits,r)=>{ if(want[r][want[r].length-1]===st.hl.val) rowCells(r).forEach(d=>d.classList.add("hl")); }); }
  let done=false, chk;
  if(mode==="show"){ if(!st._static) footer(null,{btn:"Дальше",on:nextStep}); return; }
  if(mode==="pick"){
    const pc=vars.length+(st.pick.col!=null?st.pick.col:cols.length-1), sel=new Set();
    b.appendChild(h("p",{class:"note"},"Нажимай на строки. Повторное нажатие снимает выбор."));
    rows.forEach((bits,r)=>rowCells(r).forEach(d=>{ d.classList.add("tap"); d.onclick=()=>{ if(done) return; sel.has(r)?sel.delete(r):sel.add(r); rowCells(r).forEach(x=>x.classList.toggle("picked",sel.has(r))); haptic("tap"); chk.disabled=!sel.size; }; }));
    chk=footer(null,{btn:"Проверить",disabled:true,on:()=>{ done=true; let miss=0, extra=0;
      rows.forEach((bits,r)=>{ const need=want[r][pc]===st.pick.val; if(need&&!sel.has(r)) miss++; if(!need&&sel.has(r)) extra++;
        rowCells(r).forEach(d=>{ d.classList.remove("picked"); if(need) d.classList.add(sel.has(r)?"ok":"hl"); else if(sel.has(r)) d.classList.add("no"); }); });
      resolve(!miss&&!extra,st,miss?"Пропущено строк: "+miss+".":extra?"Лишних строк: "+extra+".":""); }});
    return;
  }
  b.appendChild(h("p",{class:"note"},"Нажимай на пустые клетки: 0, ещё раз — 1."));
  function upd(){ chk.disabled=val.some(r=>r.some(x=>x==="")); }
  chk=footer(null,{btn:"Проверить",disabled:true,on:()=>{ done=true; let bad=0;
    rows.forEach((bits,r)=>want[r].forEach((v,k)=>{ if(val[r][k]==null) return; const d=cells[r][k]; d.classList.remove("ask");
      if(+val[r][k]===v) d.classList.add("ok"); else { bad++; d.classList.add("no"); d.innerHTML='<s>'+val[r][k]+'</s>'+v; } }));
    resolve(!bad,st,bad?"Неверных клеток: "+bad+". Правильные значения стоят рядом с зачёркнутыми.":""); }});
}
/* ===== фрагмент из задания: match / answer ===== */
function ttMatch(st,b){
  const vars=st.vars||ttVarsOf(st.expr), n=vars.length, f=ttFn(st.expr), sets=ttSets(n), frag=st.frag;
  const fval=frag[0][frag[0].length-1];
  const right=st.answer||ttSolve(st.expr,frag,vars)[0];
  b.appendChild(h("div",{class:"tt-expr"},'F = '+ttSym(st.expr)));
  /* вывод программы: строки, где F равна значению из фрагмента */
  if(st.out){ const fv=+fval, rows=sets.filter(bits=>f(ttEnv(vars,bits))===fv);
    const o=h("div",{class:"tt-out"},'<div class="th">Программа вывела строки с F = '+fv+'</div><pre>'+esc(vars.join(" ")+"\n"+rows.map(r=>r.split("").join(" ")).join("\n"))+'</pre>');
    b.appendChild(o); }
  const perm=Array(n).fill(null); let cur=0, done=false;
  const grid=h("div",{class:"tt-grid frag"}); grid.style.setProperty("--cols",n+1);
  const heads=[]; for(let i=0;i<n;i++){ const d=h("div",{class:"tt-h col"},"?"); heads.push(d); grid.appendChild(d); }
  grid.appendChild(h("div",{class:"tt-h fcol"},"F"));
  const cells=frag.map(row=>row.map((c,i)=>{ const d=h("div",{class:"tt-c"+(i===n?" fcol":"")+(c===""?" empty":"")},c); grid.appendChild(d); return d; }));
  const marks=frag.map(()=>h("div",{class:"tt-mark"}));
  const wrap=h("div",{class:"tt-wrap frag-wrap"}); const side=h("div",{class:"tt-marks"}); side.appendChild(h("div",{class:"tt-mark head"})); marks.forEach(m=>side.appendChild(m));
  wrap.append(grid,side); b.appendChild(wrap);
  if(st.mode==="answer"){
    heads.forEach((d,i)=>d.textContent="Перем. "+(i+1));
    const inp=h("input",{class:"tt-ans",type:"text",autocomplete:"off",autocapitalize:"off",spellcheck:"false",placeholder:"Ответ, например "+vars.slice().reverse().join("")});
    b.appendChild(inp);
    const chk=footer(null,{btn:"Проверить",disabled:true,on:()=>{ const v=inp.value.trim().toLowerCase();
      if(/[\s,;.]/.test(v)){ toast("Буквы пишутся подряд, без пробелов и запятых"); return; }
      done=true; inp.disabled=true; const ok=v===right; inp.classList.add(ok?"ok":"no");
      if(ok) restore(); resolve(ok,st,ok?"":"Правильный ответ: "+right+"."); }});
    inp.oninput=()=>{ chk.disabled=!inp.value.trim(); };
    return;
  }
  const bar=h("div",{class:"tt-bar"}); const chips=vars.map(v=>{ const c=h("button",{class:"chip",type:"button"},v); c.onclick=()=>put(v); bar.appendChild(c); return c; });
  const clr=h("button",{class:"chip clr",type:"button"},"Стереть"); clr.onclick=()=>{ if(done) return; perm[cur]=null; draw(); }; bar.appendChild(clr);
  b.appendChild(h("p",{class:"note"},"Выбери столбец, потом букву. Справа от каждой строки видно, нашлась ли она в таблице истинности при такой расстановке."));
  b.appendChild(bar);
  heads.forEach((d,i)=>d.onclick=()=>{ if(done) return; cur=i; draw(); });
  function put(v){ if(done) return; const j=perm.indexOf(v); if(j>=0) perm[j]=null; perm[cur]=v; haptic("tap");
    for(let k=1;k<=n;k++){ const nx=(cur+k)%n; if(perm[nx]==null){ cur=nx; break; } } draw(); }
  function draw(){
    heads.forEach((d,i)=>{ d.textContent=perm[i]||"?"; d.classList.toggle("cur",i===cur&&!done); d.classList.toggle("set",!!perm[i]); });
    chips.forEach((c,k)=>c.classList.toggle("tt-used",perm.includes(vars[k])));
    const fit=ttFit(f,vars,perm,frag,sets);
    marks.forEach((m,r)=>{ m.className="tt-mark "+(fit.cand[r].length?"ok":"no"); m.textContent=fit.cand[r].length?"✓":"✗"; });
    chk.disabled=perm.some(x=>x==null);
  }
  function restore(){ /* пустые клетки фрагмента: восстановленные значения, лаймом */
    const p=right.split(""), fit=ttFit(f,vars,p,frag,sets);
    const pickRows=(i,used)=>{ if(i===frag.length) return []; for(const o of fit.cand[i]){ if(used.has(o)) continue; const rest=pickRows(i+1,new Set(used).add(o)); if(rest) return [o].concat(rest); } return null; };
    const chosen=pickRows(0,new Set()); if(!chosen) return;
    heads.forEach((d,i)=>d.textContent=p[i]);
    frag.forEach((row,r)=>{ const env=ttEnv(vars,chosen[r]); row.slice(0,-1).forEach((c,i)=>{ if(c===""){ cells[r][i].textContent=env[p[i]]; cells[r][i].classList.add("restored"); } }); });
  }
  const chk=footer(null,{btn:"Проверить",disabled:true,on:()=>{ done=true; const got=perm.join(""), ok=got===right;
    const fit=ttFit(f,vars,perm,frag,sets); let why="";
    if(!ok){ if(fit.cand.some(c=>!c.length)) why="Не каждая строка фрагмента нашлась в таблице."; else why="Все строки находятся, но две из них совпадают с одной и той же строкой таблицы, а строки фрагмента различные."; why+=" Правильная расстановка: "+right+"."; }
    if(ok) restore(); draw(); resolve(ok,st,why); }});
  draw();
}
/* готовая таблица внутри теории или вопроса: поле "tt" шага ({vars, cols, rows, hl} или фрагмент {expr, frag}) */
function truthBlock(spec){
  const d=h("div",{class:"tt-block"});
  if(spec.frag){ /* фрагмент из условия: столбцы «Перем. 1…», пустые клетки пустые */
    const n=spec.frag[0].length-1, g=h("div",{class:"tt-grid frag"}); g.style.setProperty("--cols",n+1);
    for(let i=0;i<n;i++) g.appendChild(h("div",{class:"tt-h col"},spec.heads?spec.heads[i]:"Перем. "+(i+1)));
    g.appendChild(h("div",{class:"tt-h fcol"},"F"));
    spec.frag.forEach(row=>row.forEach((c,i)=>g.appendChild(h("div",{class:"tt-c"+(i===n?" fcol":"")+(c===""?" empty":"")+(spec.lime&&spec.lime.some(([r,k])=>row===spec.frag[r]&&k===i)?" restored":"")},c))));
    if(spec.expr) d.appendChild(h("div",{class:"tt-expr"},'F = '+ttSym(spec.expr)));
    const w=h("div",{class:"tt-wrap"}); w.appendChild(g); d.appendChild(w); return d; }
  ttTable(Object.assign({},spec,{mode:"show",_static:true}),d); return d;
}
/* ===== перевод выражения в Python ===== */
function ttTranslate(st,b){
  const vars=st.vars||ttVarsOf(st.expr), f=ttFn(st.expr), sets=ttSets(vars.length);
  b.appendChild(h("div",{class:"tt-expr"},'F = '+ttSym(st.expr)));
  const line=h("div",{class:"tt-py"}); b.appendChild(line);
  const bank=h("div",{class:"bank tt-pybank"}); b.appendChild(h("p",{class:"note"},"Нажимай на блоки по порядку. Нажми на блок в строке, чтобы убрать его.")); b.appendChild(bank);
  const items=(st.bank||[]).map((t,i)=>({t,id:i,used:false})), reuse=st.reuse||["(",")"], toks=[]; let done=false, chk;
  function draw(){
    line.innerHTML='<span class="tt-pyF">F =</span>';
    if(!toks.length) line.appendChild(h("span",{class:"tt-pyhint"},"собери выражение"));
    toks.forEach((x,i)=>{ const c=h("button",{class:"chip ide-chip",type:"button"},hl(x.t)); c.onclick=()=>{ if(done) return; toks.splice(i,1); if(x.id!=null) items[x.id].used=false; draw(); }; line.appendChild(c); });
    bank.innerHTML="";
    items.forEach(x=>{ const c=h("button",{class:"chip ide-chip"+(x.used?" used":""),type:"button"},hl(x.t)); c.onclick=()=>{ if(done||x.used) return; x.used=true; toks.push(x); haptic("tap"); draw(); }; bank.appendChild(c); });
    reuse.forEach(t=>{ const c=h("button",{class:"chip ide-chip re",type:"button"},hl(t)); c.onclick=()=>{ if(done) return; toks.push({t,id:null}); haptic("tap"); draw(); }; bank.appendChild(c); });
    if(chk) chk.disabled=!toks.length;
  }
  chk=footer(null,{btn:"Проверить",disabled:true,on:()=>{
    const code=joinTokens(toks.map(x=>x.t)); let bad=null, err=null;
    for(const bits of sets){ const env=ttEnv(vars,bits);
      const r=runPy(vars.join(", ")+" = "+vars.map(v=>env[v]).join(", ")+"\nF = "+code+"\nprint(int(bool(F)))",[]);
      if(r.err){ err=r.err; break; }
      const got=+r.out.trim(), want=f(env); if(got!==want){ bad={env,got,want}; break; } }
    done=true;
    const res=h("div",{class:"tt-out"}); b.appendChild(res);
    if(err){ res.innerHTML='<div class="th">Python</div><pre>'+esc(err.type+": "+err.msg)+'</pre>'; resolve(false,st,"Python не смог выполнить эту запись."); return; }
    if(bad){ res.innerHTML='<div class="th">Расхождение</div><pre>'+esc(vars.map(v=>v+" = "+bad.env[v]).join(", ")+"\nвыражение: "+bad.want+"\nтвоя запись: "+bad.got)+'</pre>'; resolve(false,st,"На этом наборе запись считает не то, что выражение."); return; }
    res.innerHTML='<div class="th">Проверено на всех '+sets.length+' наборах</div><pre>F = '+esc(code)+'</pre>'; resolve(true,st);
  }});
  draw();
}
