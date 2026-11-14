/* Электронная таблица для заданий ЕГЭ: вычислитель формул как в LibreOffice Calc
   (русские названия функций, аргументы через «;») и шаг урока "sheet".
   Описание формата шага — в комментарии над sheetStep(). */

/* ---------- адреса ячеек ---------- */
const XL_LOOK={"А":"A","В":"B","С":"C","Е":"E","Н":"H","К":"K","М":"M","О":"O","Р":"P","Т":"T","Х":"X"}; // кириллица, похожая на латиницу: «А1» с русской раскладки
function xlColName(c){ let s=""; c++; while(c>0){ const m=(c-1)%26; s=String.fromCharCode(65+m)+s; c=Math.floor((c-1)/26); } return s; }
function xlColNum(s){ let n=0; for(const ch of s) n=n*26+(ch.charCodeAt(0)-64); return n-1; }
function xlAddr(a){ const m=/^\$?([A-Z]{1,3})\$?(\d+)$/.exec(String(a).toUpperCase()); if(!m) throw new Error("bad address "+a); return {c:xlColNum(m[1]),r:+m[2]-1}; }
function xlName(c,r){ return xlColName(c)+(r+1); }
function xlRange(s){ const [a,b]=String(s).split(":"); const p=xlAddr(a), q=xlAddr(b||a); return {c1:Math.min(p.c,q.c),r1:Math.min(p.r,q.r),c2:Math.max(p.c,q.c),r2:Math.max(p.r,q.r)}; }

/* ---------- значения ---------- */
class XErr{ constructor(code){ this.code=code; } }
const XE={ val:new XErr("#ЗНАЧ!"), div:new XErr("#ДЕЛ/0!"), name:new XErr("#ИМЯ?"), ref:new XErr("#ССЫЛКА!"), num:new XErr("#ЧИСЛО!"), cyc:new XErr("Ошибка:522") };
class XParse extends Error{}
function xlShow(v){
  if(v==null) return "";
  if(v instanceof XErr) return v.code;
  if(v===true) return "ИСТИНА"; if(v===false) return "ЛОЖЬ";
  if(typeof v==="number"){ if(!isFinite(v)) return "#ЧИСЛО!"; if(Number.isInteger(v)) return String(v); return String(+v.toPrecision(10)).replace(".",","); }
  return String(v);
}

/* ---------- разбор формулы ---------- */
function xlTokens(src){
  const T=[], s=src; let i=0;
  while(i<s.length){
    const c=s[i];
    if(/\s/.test(c)){ i++; continue; }
    if(c==='"'){ let j=i+1, v=""; while(j<s.length&&s[j]!=='"') v+=s[j++]; if(j>=s.length) throw new XParse("не закрыта кавычка"); T.push({t:"str",v}); i=j+1; continue; }
    let m=/^\d+(?:[.,]\d+)?/.exec(s.slice(i));
    if(m){ T.push({t:"num",v:parseFloat(m[0].replace(",","."))}); i+=m[0].length; continue; }
    m=/^[A-Za-zА-Яа-яЁё$_][A-Za-zА-Яа-яЁё$_0-9.]*/.exec(s.slice(i));
    if(m){
      const w=m[0]; i+=w.length;
      let k=i; while(k<s.length&&s[k]===" ") k++;
      if(s[k]==="("){ T.push({t:"fn",v:w.toUpperCase().replace(/Ё/g,"Е")}); i=k; continue; }
      const lat=[...w.toUpperCase()].map(ch=>XL_LOOK[ch]||ch).join("");
      const r=/^(\$?)([A-Z]{1,3})(\$?)(\d+)$/.exec(lat);
      if(r&&+r[4]>0){ T.push({t:"ref",c:xlColNum(r[2]),r:+r[4]-1,ca:!!r[1],ra:!!r[3]}); continue; }
      const up=w.toUpperCase();
      if(up==="ИСТИНА"||up==="TRUE"){ T.push({t:"bool",v:true}); continue; }
      if(up==="ЛОЖЬ"||up==="FALSE"){ T.push({t:"bool",v:false}); continue; }
      T.push({t:"bad",v:w}); continue;
    }
    const two=s.substr(i,2);
    if(two==="<="||two===">="||two==="<>"){ T.push({t:"op",v:two}); i+=2; continue; }
    if("+-*/^&=<>();:".includes(c)){ T.push({t:"op",v:c}); i++; continue; }
    if(c===",") throw new XParse("аргументы функции разделяются точкой с запятой «;»");
    if(c==="≠") throw new XParse("знака «≠» в Calc нет, «не равно» пишется как <>");
    if(c==="≥"||c==="≤") throw new XParse("пиши >= или <= двумя знаками");
    throw new XParse("непонятный символ «"+c+"»");
  }
  return T;
}
function xlParse(src){
  src=String(src||"").trim();
  if(!src.startsWith("=")) throw new XParse("формула начинается со знака «=»");
  const T=xlTokens(src.slice(1)); let p=0;
  if(!T.length) throw new XParse("после «=» ничего нет");
  const peek=()=>T[p], isOp=v=>T[p]&&T[p].t==="op"&&T[p].v===v;
  const eat=v=>{ if(!isOp(v)) throw new XParse(v===")"?"не хватает закрывающей скобки":"ожидался знак «"+v+"»"); p++; };
  function bin(next,ops){ return ()=>{ let a=next(); while(T[p]&&T[p].t==="op"&&ops.includes(T[p].v)){ const op=T[p++].v; a={k:"bin",op,a,b:next()}; } return a; }; }
  function unary(){ if(isOp("-")){ p++; return {k:"neg",a:unary()}; } if(isOp("+")){ p++; return unary(); } return range(); }
  function range(){ const a=primary(); if(isOp(":")){ p++; const b=primary(); if(a.k!=="ref"||b.k!=="ref") throw new XParse("диапазон пишется так: A1:E1"); return {k:"range",a,b}; } return a; }
  function primary(){
    const t=peek(); if(!t) throw new XParse("формула оборвалась");
    if(t.t==="num"||t.t==="str"||t.t==="bool"){ p++; return {k:"lit",v:t.v}; }
    if(t.t==="ref"){ p++; return {k:"ref",c:t.c,r:t.r,ca:t.ca,ra:t.ra}; }
    if(t.t==="bad"){ p++; return {k:"bad",v:t.v}; }
    if(t.t==="fn"){ p++; eat("("); const args=[]; if(!isOp(")")){ args.push(expr()); while(isOp(";")){ p++; args.push(expr()); } } eat(")"); return {k:"fn",name:t.v,args}; }
    if(isOp("(")){ p++; const e=expr(); eat(")"); return e; }
    if(isOp(")")) throw new XParse("лишняя закрывающая скобка");
    throw new XParse("не на месте знак «"+t.v+"»");
  }
  const pow=bin(unary,["^"]), mul=bin(pow,["*","/"]), add=bin(mul,["+","-"]), cat=bin(add,["&"]), cmp=bin(cat,["=","<>","<",">","<=",">="]);
  const expr=cmp;
  const ast=expr();
  if(p<T.length) throw new XParse(isOp(")")?"лишняя закрывающая скобка":isOp(";")?"«;» стоит вне скобок функции":"в формуле что-то лишнее после «"+src.slice(1).trim().slice(0,30)+"»");
  return ast;
}
/* текст формулы после протягивания на dc столбцов и dr строк: относительные адреса сдвигаются, с $ — нет */
function xlShiftText(src,dc,dr){
  return String(src).split('"').map((part,i)=>i%2?part:part.replace(/(^|[^A-Za-zА-Яа-яЁё0-9_$])(\$?)([A-Za-z]{1,3})(\$?)(\d+)(?![A-Za-zА-Яа-яЁё0-9_(])/g,(m,pre,ca,col,ra,row)=>{
    const c=ca?xlColNum(col.toUpperCase()):xlColNum(col.toUpperCase())+dc, r=ra?+row:+row+dr;
    if(c<0||r<1) return pre+"#ССЫЛКА!";
    return pre+ca+xlColName(c)+ra+r;
  })).join('"');
}

/* ---------- вычисление ---------- */
const XL_FN={};
function xlNum(v){ if(v instanceof XErr) throw v; if(v==null) return 0; if(typeof v==="boolean") return v?1:0; if(typeof v==="number") return v; const n=Number(String(v).replace(",",".")); if(String(v).trim()!==""&&isFinite(n)) return n; throw XE.val; }
function xlBool(v){ if(v instanceof XErr) throw v; if(typeof v==="boolean") return v; if(v==null) return false; if(typeof v==="number") return v!==0; throw XE.val; }
function xlCmp(a,b){ // -1/0/1, как в Calc: числа меньше строк, пустая = 0 или ""
  if(a instanceof XErr) throw a; if(b instanceof XErr) throw b;
  const norm=x=>typeof x==="boolean"?(x?1:0):x;
  a=norm(a); b=norm(b);
  if(a==null) a=typeof b==="string"?"":0; if(b==null) b=typeof a==="string"?"":0;
  if(typeof a==="number"&&typeof b==="number") return a<b?-1:a>b?1:0;
  if(typeof a==="number") return -1; if(typeof b==="number") return 1;
  a=a.toLowerCase(); b=b.toLowerCase(); return a<b?-1:a>b?1:0;
}
function xlEval(n,ctx,dc,dr){
  switch(n.k){
    case "lit": return n.v;
    case "bad": return XE.name;
    case "ref": { const c=n.ca?n.c:n.c+dc, r=n.ra?n.r:n.r+dr; if(c<0||r<0) return XE.ref; return ctx.get(c,r); }
    case "range": return XE.val; // диапазон сам по себе не число
    case "neg": try{ return -xlNum(xlEval(n.a,ctx,dc,dr)); }catch(e){ return e instanceof XErr?e:XE.val; }
    case "bin": {
      const a=xlEval(n.a,ctx,dc,dr); if(a instanceof XErr) return a;
      const b=xlEval(n.b,ctx,dc,dr); if(b instanceof XErr) return b;
      try{
        switch(n.op){
          case "+": return xlNum(a)+xlNum(b); case "-": return xlNum(a)-xlNum(b); case "*": return xlNum(a)*xlNum(b);
          case "/": { const d=xlNum(b); if(d===0) return XE.div; return xlNum(a)/d; }
          case "^": return Math.pow(xlNum(a),xlNum(b));
          case "&": return xlShow(a)+xlShow(b);
          case "=": return xlCmp(a,b)===0; case "<>": return xlCmp(a,b)!==0;
          case "<": return xlCmp(a,b)<0; case ">": return xlCmp(a,b)>0; case "<=": return xlCmp(a,b)<=0; case ">=": return xlCmp(a,b)>=0;
        }
      }catch(e){ return e instanceof XErr?e:XE.val; }
    }
    case "fn": {
      const f=XL_FN[n.name]; if(!f) return XE.name;
      try{ return f(n.args,ctx,dc,dr); }catch(e){ if(e instanceof XErr) return e; throw e; }
    }
  }
  return XE.val;
}
/* аргумент функции: диапазон → массив ячеек, иначе одно значение */
function xlArg(a,ctx,dc,dr){
  if(a.k==="range"){
    const A=a.a, B=a.b;
    const c1=A.ca?A.c:A.c+dc, r1=A.ra?A.r:A.r+dr, c2=B.ca?B.c:B.c+dc, r2=B.ra?B.r:B.r+dr;
    if(Math.min(c1,c2)<0||Math.min(r1,r2)<0) throw XE.ref;
    const out=[]; for(let r=Math.min(r1,r2);r<=Math.max(r1,r2);r++) for(let c=Math.min(c1,c2);c<=Math.max(c1,c2);c++) out.push(ctx.get(c,r));
    return {range:true,cells:out};
  }
  return {range:false,v:xlEval(a,ctx,dc,dr)};
}
/* числа из аргументов: в диапазоне пустые и текст пропускаются (ИСТИНА/ЛОЖЬ в Calc — это 1 и 0), одиночный аргумент приводится к числу */
function xlNums(args,ctx,dc,dr){
  const out=[];
  args.forEach(a=>{ const x=xlArg(a,ctx,dc,dr);
    if(x.range) x.cells.forEach(v=>{ if(v instanceof XErr) throw v; if(typeof v==="number") out.push(v); else if(typeof v==="boolean") out.push(v?1:0); });
    else out.push(xlNum(x.v)); });
  return out;
}
function xlCells(a,ctx,dc,dr){ const x=xlArg(a,ctx,dc,dr); return x.range?x.cells:[x.v]; }
function xlCrit(v){ // условие СЧЁТЕСЛИ: число, ячейка или текст вида ">=70"
  if(v instanceof XErr) throw v;
  if(typeof v==="number"||typeof v==="boolean"){ const n=xlNum(v); return x=>(typeof x==="number"||typeof x==="boolean")&&xlNum(x)===n; }
  const m=/^(<=|>=|<>|<|>|=)?(.*)$/.exec(String(v==null?"":v)); const op=m[1]||"=", rest=m[2].trim();
  const n=rest!==""&&isFinite(Number(rest.replace(",",".")))?Number(rest.replace(",",".")):null;
  return x=>{
    if(x instanceof XErr) return false;
    if(n!=null){ if(typeof x!=="number"&&typeof x!=="boolean") return op==="<>"; const d=xlNum(x)-n;
      return op==="="?d===0:op==="<>"?d!==0:op==="<"?d<0:op===">"?d>0:op==="<="?d<=0:d>=0; }
    const s=x==null?"":String(x).toLowerCase(), t=rest.toLowerCase();
    return op==="<>"?s!==t:op==="="?s===t:false;
  };
}
function xlArgc(args,lo,hi){ if(args.length<lo||args.length>hi) throw XE.val; }
Object.assign(XL_FN,{
  "СУММ":(a,c,x,y)=>xlNums(a,c,x,y).reduce((s,v)=>s+v,0),
  "СРЗНАЧ":(a,c,x,y)=>{ const n=xlNums(a,c,x,y); if(!n.length) throw XE.div; return n.reduce((s,v)=>s+v,0)/n.length; },
  "МАКС":(a,c,x,y)=>{ const n=xlNums(a,c,x,y); return n.length?Math.max(...n):0; },
  "МИН":(a,c,x,y)=>{ const n=xlNums(a,c,x,y); return n.length?Math.min(...n):0; },
  "СЧЕТ":(a,c,x,y)=>{ let k=0; a.forEach(z=>xlCells(z,c,x,y).forEach(v=>{ if(typeof v==="number"||typeof v==="boolean") k++; })); return k; },
  "СЧЕТЗ":(a,c,x,y)=>{ let k=0; a.forEach(z=>xlCells(z,c,x,y).forEach(v=>{ if(v!=null&&v!=="") k++; })); return k; },
  "ПРОИЗВЕД":(a,c,x,y)=>{ const n=xlNums(a,c,x,y); return n.length?n.reduce((s,v)=>s*v,1):0; },
  "НАИБОЛЬШИЙ":(a,c,x,y)=>{ xlArgc(a,2,2); const n=xlNums([a[0]],c,x,y).sort((p,q)=>q-p), k=Math.floor(xlNum(xlEval(a[1],c,x,y))); if(k<1||k>n.length) throw XE.num; return n[k-1]; },
  "НАИМЕНЬШИЙ":(a,c,x,y)=>{ xlArgc(a,2,2); const n=xlNums([a[0]],c,x,y).sort((p,q)=>p-q), k=Math.floor(xlNum(xlEval(a[1],c,x,y))); if(k<1||k>n.length) throw XE.num; return n[k-1]; },
  "СЧЕТЕСЛИ":(a,c,x,y)=>{ xlArgc(a,2,2); const f=xlCrit(xlEval(a[1],c,x,y)); return xlCells(a[0],c,x,y).filter(f).length; },
  "СУММЕСЛИ":(a,c,x,y)=>{ xlArgc(a,2,3); const f=xlCrit(xlEval(a[1],c,x,y)), w=xlCells(a[0],c,x,y), s=a[2]?xlCells(a[2],c,x,y):w; let t=0; w.forEach((v,i)=>{ if(f(v)){ const z=s[i]; if(z instanceof XErr) throw z; if(typeof z==="number") t+=z; } }); return t; },
  "ЕСЛИ":(a,c,x,y)=>{ xlArgc(a,1,3); const k=xlBool(xlEval(a[0],c,x,y)); if(k) return a.length>1?xlEval(a[1],c,x,y):true; return a.length>2?xlEval(a[2],c,x,y):false; },
  "И":(a,c,x,y)=>{ xlArgc(a,1,255); let r=true; a.forEach(z=>xlCells(z,c,x,y).forEach(v=>{ if(v==null) return; if(!xlBool(v)) r=false; })); return r; },
  "ИЛИ":(a,c,x,y)=>{ xlArgc(a,1,255); let r=false; a.forEach(z=>xlCells(z,c,x,y).forEach(v=>{ if(v==null) return; if(xlBool(v)) r=true; })); return r; },
  "НЕ":(a,c,x,y)=>{ xlArgc(a,1,1); return !xlBool(xlEval(a[0],c,x,y)); },
  "ОСТАТ":(a,c,x,y)=>{ xlArgc(a,2,2); const n=xlNum(xlEval(a[0],c,x,y)), d=xlNum(xlEval(a[1],c,x,y)); if(d===0) throw XE.div; return n-d*Math.floor(n/d); },
  "ABS":(a,c,x,y)=>{ xlArgc(a,1,1); return Math.abs(xlNum(xlEval(a[0],c,x,y))); },
  "ЦЕЛОЕ":(a,c,x,y)=>{ xlArgc(a,1,1); return Math.floor(xlNum(xlEval(a[0],c,x,y))); }
});
/* английские имена — для тех, у кого Excel на английском */
Object.entries({SUM:"СУММ",AVERAGE:"СРЗНАЧ",MAX:"МАКС",MIN:"МИН",COUNT:"СЧЕТ",COUNTA:"СЧЕТЗ",PRODUCT:"ПРОИЗВЕД",LARGE:"НАИБОЛЬШИЙ",SMALL:"НАИМЕНЬШИЙ",COUNTIF:"СЧЕТЕСЛИ",SUMIF:"СУММЕСЛИ",IF:"ЕСЛИ",AND:"И",OR:"ИЛИ",NOT:"НЕ",MOD:"ОСТАТ",INT:"ЦЕЛОЕ"}).forEach(([en,ru])=>XL_FN[en]=XL_FN[ru]);

/* ---------- лист: данные + формулы ---------- */
function xlGen(g){ // случайный «файл» по зерну: одинаковый у всех учеников
  let s=(g.seed||1)>>>0; const rnd=()=>{ s=(s+0x6D2B79F5)>>>0; let t=s; t=Math.imul(t^t>>>15,t|1); t^=t+Math.imul(t^t>>>7,t|61); return ((t^t>>>14)>>>0)/4294967296; };
  const lo=g.min||1, hi=g.max||100, rows=[];
  for(let r=0;r<g.rows;r++){ const row=[]; for(let c=0;c<(g.cols||5);c++){ if(c&&g.dup&&rnd()<g.dup) row.push(row[Math.floor(rnd()*c)]); else row.push(lo+Math.floor(rnd()*(hi-lo+1))); } rows.push(row); }
  return rows;
}
function xlSheet(data){
  const F=new Map(); let memo=new Map(); const busy=new Set();
  const key=(c,r)=>c+","+r;
  const sh={data, rows:data.length,
    get(c,r){ const k=key(c,r), f=F.get(k);
      if(!f){ const row=data[r]; const v=row?row[c]:null; return v===undefined?null:v; }
      if(memo.has(k)) return memo.get(k);
      if(busy.has(k)) return XE.cyc;
      busy.add(k); let v; try{ v=f.err?XE.val:xlEval(f.ast,sh,f.dc,f.dr); } finally{ busy.delete(k); }
      memo.set(k,v); return v; },
    formula(c,r){ const f=F.get(key(c,r)); return f?(f.dc||f.dr?xlShiftText(f.src,f.dc,f.dr):f.src):null; },
    has(c,r){ return F.has(key(c,r)); },
    set(addr,src){ const {c,r}=typeof addr==="string"?xlAddr(addr):addr; memo=new Map();
      if(src==null||src===""){ F.delete(key(c,r)); return; }
      let ast=null, err=null; try{ ast=xlParse(src); }catch(e){ err=e.message; }
      F.set(key(c,r),{src,ast,err,dc:0,dr:0,c0:c,r0:r}); },
    /* протянуть формулу из ячейки from на весь диапазон rng (как маркер заполнения) */
    fill(from,rng){ const o=xlAddr(from), f=F.get(key(o.c,o.r)); if(!f) return; const R=xlRange(rng); memo=new Map();
      for(let r=R.r1;r<=R.r2;r++) for(let c=R.c1;c<=R.c2;c++){ if(c===o.c&&r===o.r) continue; F.set(key(c,r),{src:f.src,ast:f.ast,err:f.err,dc:c-o.c,dr:r-o.r}); } },
    clearRange(rng){ const R=xlRange(rng); memo=new Map(); for(let r=R.r1;r<=R.r2;r++) for(let c=R.c1;c<=R.c2;c++) F.delete(key(c,r)); },
    touch(){ memo=new Map(); }, // данные поменяли руками — пересчитать формулы
    maxCol(){ let m=0; data.forEach(row=>m=Math.max(m,row.length-1)); F.forEach((_,k)=>m=Math.max(m,+k.split(",")[0])); return m; }
  };
  return sh;
}
/* лист по описанию из урока: data или gen + pre (готовые формулы, при необходимости протянутые) */
function xlFromSpec(sp,dataOverride){
  const data=dataOverride||(sp.gen?xlGen(sp.gen):sp.data.map(r=>r.slice()));
  const sh=xlSheet(data);
  (sp.pre||[]).forEach(p=>{ sh.set(p.cell,p.f); if(p.fill) sh.fill(p.cell,p.fill); });
  return sh;
}
/* «другие числа» той же формы: ловим формулы, подогнанные под ответ */
function xlAltData(data,seed){
  const flat=data.flat().filter(v=>typeof v==="number"), lo=Math.min(...flat), hi=Math.max(...flat);
  const g=xlGen({rows:data.length,cols:Math.max(...data.map(r=>r.length)),min:lo,max:hi,seed:seed||7,dup:.25});
  return data.map((row,r)=>row.map((v,c)=>v==null?null:g[r][c]));
}

/* ---------- вид таблицы ---------- */
/* opts: show "A1:K6" — что показать (по умолчанию все данные и формулы); sel "G1"; noBar — без строки формул;
   mark {rows:Set} — отмеченные строки; picks Set("c,r") — отмеченные ячейки; goal "G1" — ячейка-цель;
   onCell(c,r), onRow(r) — тапы; barEditor — строку формул заполняет шаг;
   handle {on(), onDrag(c,r), onDouble()} — квадратик маркера заполнения в углу выбранной ячейки */
function xlView(sh,opts){
  opts=opts||{};
  const w=h("div",{class:"xl"+(opts.noBar?" no-bar":"")});
  const bar=h("div",{class:"xl-bar"},'<span class="xl-addr"></span><span class="xl-fx">ƒx</span><span class="xl-src"></span>');
  const scroll=h("div",{class:"xl-scroll"}); w.append(bar,scroll);
  const foot=h("div",{class:"xl-foot"}); foot.hidden=true; w.appendChild(foot);
  let sel=opts.sel?xlAddr(opts.sel):null;
  w.sheet=sh;
  function cols(){ const R=opts.show?xlRange(opts.show):null; const c2=R?R.c2:Math.max(sh.maxCol(),4); const c1=R?R.c1:0; const a=[]; for(let c=c1;c<=c2;c++) a.push(c); return a; }
  function rows(){ const R=opts.show?xlRange(opts.show):null; const n=sh.rows; const r1=R?R.r1:0, r2=R?Math.min(R.r2,n-1):n-1;
    const a=[]; if(r2-r1+1<=10){ for(let r=r1;r<=r2;r++) a.push(r); return a; }
    for(let r=r1;r<r1+6;r++) a.push(r); a.push(-1); a.push(r2); return a; } // большой файл: начало, «⋮» и последняя строка
  function showBar(){
    const ad=bar.querySelector(".xl-addr"), sc=bar.querySelector(".xl-src");
    if(opts.barEditor){ ad.textContent=sel?xlName(sel.c,sel.r):""; return; }
    if(!sel){ ad.textContent=""; sc.innerHTML='<span class="xl-ph">нажми на любую ячейку</span>'; sc.classList.remove("xl-has-f"); return; }
    ad.textContent=xlName(sel.c,sel.r); const f=sh.formula(sel.c,sel.r), txt=f!=null?f:xlShow(sh.get(sel.c,sel.r));
    const changed=sc.textContent!==txt||sc.dataset.a!==ad.textContent;
    sc.textContent=txt; sc.dataset.a=ad.textContent; sc.classList.toggle("xl-has-f",f!=null);
    if(changed&&w.isConnected){ sc.classList.remove("xl-flash"); void sc.offsetWidth; sc.classList.add("xl-flash"); } // новая ячейка — строка формул мигает
  }
  w.draw=function(anim){
    const C=cols(), Rr=rows(), marks=opts.mark&&opts.mark.rows, goal=opts.goal?xlAddr(opts.goal):null;
    const hOn=opts.handle&&sel&&opts.handle.on();
    /* пустой столбец (как F между данными и формулами) — узкий */
    const empty=c=>Rr.every(r=>r<0||(sh.get(c,r)==null&&!sh.has(c,r)))&&!(sel&&sel.c===c)&&!(goal&&goal.c===c);
    let html='<table class="xl-t"><thead><tr><th class="xl-corner"></th>'+C.map(c=>'<th class="'+(empty(c)?"xl-gap":"")+'">'+xlColName(c)+'</th>').join("")+'</tr></thead><tbody>';
    Rr.forEach((r,ri)=>{
      if(r<0){ html+='<tr class="xl-more" data-more="1"><th>⋮</th>'+C.map(c=>'<td data-c="'+c+'" class="'+(empty(c)?"xl-gap":"")+'">'+(sh.has(c,0)||sh.get(c,0)!=null?"⋮":"")+'</td>').join("")+'</tr>'; return; }
      html+='<tr data-r="'+r+'" class="'+(marks&&marks.has(r)?"xl-mark":"")+'"><th'+(opts.onRow?' role="button" tabindex="0"':'')+'>'+(r+1)+'</th>';
      C.forEach(c=>{
        const v=sh.get(c,r), f=sh.has(c,r), cls=[], isSel=sel&&sel.c===c&&sel.r===r;
        if(empty(c)) cls.push("xl-gap");
        if(f) cls.push("xl-f"); if(v instanceof XErr) cls.push("xl-err");
        if(typeof v==="number") cls.push("xl-n");
        if(isSel) cls.push("xl-sel");
        if(goal&&goal.c===c&&goal.r===r) cls.push("xl-goal");
        if(opts.picks&&opts.picks.has(c+","+r)) cls.push("xl-pick");
        if(anim&&f&&anim.has(c+","+r)) cls.push("xl-pop");
        html+='<td data-c="'+c+'" class="'+cls.join(" ")+'"'+(anim&&anim.has(c+","+r)?' style="animation-delay:'+(Math.min(ri,9)*45)+'ms"':'')+'>'+esc(xlShow(v))+(isSel&&hOn?'<span class="xl-handle" role="button" aria-label="Маркер заполнения: потяни, чтобы протянуть формулу"></span>':'')+'</td>';
      });
      html+='</tr>';
    });
    scroll.innerHTML=html+'</tbody></table>';
    showBar();
    /* выбранная ячейка должна быть видна: на узком экране таблица прокручивается вбок */
    const sc=scroll.querySelector('.xl-sel'); if(sc){ const l=sc.offsetLeft, r=l+sc.offsetWidth; if(r>scroll.scrollLeft+scroll.clientWidth||l<scroll.scrollLeft) scroll.scrollLeft=Math.max(0,r-scroll.clientWidth+4); }
    if(sh.rows>10){ foot.hidden=false; foot.textContent="В файле "+sh.rows+" "+plural(sh.rows,"строка","строки","строк")+". Показаны начало и конец"; }
  };
  scroll.addEventListener("click",e=>{
    if(e.target.closest(".xl-handle")) return;
    const th=e.target.closest("tbody th"), td=e.target.closest("td[data-c]"), tr=e.target.closest("tr[data-r]");
    if(!tr) return; const r=+tr.dataset.r;
    if(opts.onRow&&(th||td)){ opts.onRow(r); return; }
    if(td){ const c=+td.dataset.c; if(opts.onCell){ opts.onCell(c,r); return; } sel={c,r}; w.draw(); }
  });
  scroll.addEventListener("keydown",e=>{ if((e.key==="Enter"||e.key===" ")&&opts.onRow){ const tr=e.target.closest("tr[data-r]"); if(tr){ e.preventDefault(); opts.onRow(+tr.dataset.r); } } });
  /* маркер заполнения: тянем пальцем или мышью, подсвечиваем, куда протянется; двойное нажатие — до конца, как в Calc */
  if(opts.handle){
    let drag=null, lastTap=0;
    const target=(x,y)=>{ const el=document.elementFromPoint(x,y); if(!el) return null; const tr=el.closest("tr"), td=el.closest("td[data-c]"); if(!tr||!scroll.contains(tr)) return null;
      let r; if(tr.dataset.more){ const all=[...scroll.querySelectorAll("tr[data-r]")]; r=+all[all.length-2].dataset.r+1; } else if(tr.dataset.r!=null) r=+tr.dataset.r; else return null;
      const c=td?+td.dataset.c:sel.c; return {c:Math.max(c,sel.c),r:Math.max(r,sel.r)}; };
    const paint=t=>{ scroll.querySelectorAll(".xl-drag").forEach(x=>x.classList.remove("xl-drag")); if(!t) return;
      scroll.querySelectorAll("tr").forEach(tr=>{ const more=!!tr.dataset.more; if(tr.dataset.r==null&&!more) return; const r=more?null:+tr.dataset.r;
        tr.querySelectorAll("td[data-c]").forEach(td=>{ const c=+td.dataset.c; const inR=more?(t.r>+[...scroll.querySelectorAll("tr[data-r]")].slice(-2)[0].dataset.r):(r>=sel.r&&r<=t.r);
          if(inR&&c>=sel.c&&c<=t.c&&!(c===sel.c&&r===sel.r)) td.classList.add("xl-drag"); }); }); };
    scroll.addEventListener("pointerdown",e=>{ const hd=e.target.closest(".xl-handle"); if(!hd) return; e.preventDefault(); e.stopPropagation();
      try{ hd.setPointerCapture(e.pointerId); }catch(_){}
      drag={id:e.pointerId,t:null,moved:false,x:e.clientX,y:e.clientY}; w.classList.add("xl-dragging"); });
    scroll.addEventListener("pointermove",e=>{ if(!drag||e.pointerId!==drag.id) return; e.preventDefault();
      if(Math.abs(e.clientX-drag.x)+Math.abs(e.clientY-drag.y)>6) drag.moved=true;
      const t=target(e.clientX,e.clientY); if(t){ drag.t=t; paint(t); } });
    const end=e=>{ if(!drag||e.pointerId!==drag.id) return; const d=drag; drag=null; w.classList.remove("xl-dragging"); paint(null);
      if(d.moved&&d.t&&(d.t.r!==sel.r||d.t.c!==sel.c)){ opts.handle.onDrag(d.t.c,d.t.r); return; }
      if(!d.moved){ const now=Date.now(); if(now-lastTap<400){ lastTap=0; opts.handle.onDouble(); } else { lastTap=now; toast("Тяни квадратик вниз. Двойное нажатие — протянуть до конца"); } } };
    scroll.addEventListener("pointerup",end); scroll.addEventListener("pointercancel",end);
  }
  w.select=a=>{ sel=a?xlAddr(a):null; w.draw(); };
  w.bar=bar;
  w.draw();
  return w;
}
/* таблица внутри теории или вопроса с выбором: только смотреть, тап по ячейке показывает адрес и формулу */
function sheetBlock(sp){ const sh=xlFromSpec(sp); return xlView(sh,{show:sp.show,sel:sp.sel}); }

/* ---------- шаг урока "sheet" ----------
   Общие поля: data — строки чисел (null — пустая ячейка) или gen {rows,cols,min,max,seed,dup} — большой файл;
   pre [{cell,f,fill}] — формулы, которые уже стоят в таблице; show "A1:H6" — какую часть показать; text [абзацы]; why.
   mode "rows": ученик отмечает подходящие строки, answer [номера строк с 1].
   mode "pick": ученик нажимает на ячейку (ячейки), answer ["D2"].
   mode "edit": ученик меняет числа в ячейках edit "A1:E1", чтобы в goal {cell,value} получилось нужное значение.
   mode "formula": ученик пишет формулу в ячейку cell; solution — эталон; fill "G1:G6" — формулу нужно протянуть
     за квадратик; chips — блоки для сборки (без них только клавиатура). Проверка: значения ученика и эталона
     совпадают во всех ячейках (и на других числах той же формы — чтобы не подогнать ответ). */
function sheetStep(st,b){
  (st.text||[]).forEach(t=>b.appendChild(h("p",{class:"txt"},t)));
  if(st.mode==="rows") return sheetRows(st,b);
  if(st.mode==="pick") return sheetPick(st,b);
  if(st.mode==="edit") return sheetEdit(st,b);
  return sheetFormula(st,b);
}
function sheetRows(st,b){
  const sh=xlFromSpec(st), picked=new Set(); let done=false;
  const v=xlView(sh,{show:st.show,noBar:true,mark:{rows:picked},onRow:r=>{ if(done) return; picked.has(r)?picked.delete(r):picked.add(r); v.draw(); chk.disabled=!picked.size; }});
  b.appendChild(v);
  b.appendChild(h("p",{class:"note"},"Нажимай на строки, которые подходят. Нажми ещё раз, чтобы снять отметку."));
  const chk=footer(null,{btn:"Проверить",disabled:true,on:()=>{ done=true;
    const want=new Set(st.answer.map(n=>n-1)), ok=want.size===picked.size&&[...want].every(r=>picked.has(r));
    v.querySelectorAll("tr[data-r]").forEach(tr=>{ const r=+tr.dataset.r; if(want.has(r)) tr.classList.add(picked.has(r)?"xl-ok":"xl-miss"); else if(picked.has(r)) tr.classList.add("xl-no"); });
    const miss=[...want].filter(r=>!picked.has(r)).length, extra=[...picked].filter(r=>!want.has(r)).length;
    resolve(ok,st,ok?"":(miss?"Пропущено строк: "+miss+". ":"")+(extra?"Лишних строк: "+extra+". ":"")); }});
}
function sheetPick(st,b){
  const sh=xlFromSpec(st), picks=new Set(), one=st.answer.length===1; let done=false;
  const v=xlView(sh,{show:st.show,picks,onCell:(c,r)=>{ if(done) return; const k=c+","+r; if(one){ picks.clear(); picks.add(k); } else picks.has(k)?picks.delete(k):picks.add(k);
    v.select(xlName(c,r)); chk.disabled=!picks.size; }});
  b.appendChild(v);
  const chk=footer(null,{btn:"Проверить",disabled:true,on:()=>{ done=true;
    const want=new Set(st.answer.map(a=>{ const p=xlAddr(a); return p.c+","+p.r; })), ok=want.size===picks.size&&[...want].every(k=>picks.has(k));
    const got=[...picks].map(k=>{ const [c,r]=k.split(",").map(Number); return xlName(c,r); });
    resolve(ok,st,ok?"":"Ты нажал на "+got.join(", ")+"."); }});
}
function sheetEdit(st,b){
  const sh=xlFromSpec(st), E=xlRange(st.edit), goal=xlAddr(st.goal.cell); let done=false, cur=null;
  const inEdit=(c,r)=>c>=E.c1&&c<=E.c2&&r>=E.r1&&r<=E.r2;
  const v=xlView(sh,{show:st.show,goal:st.goal.cell,onCell:(c,r)=>{ if(done) return;
    if(!inEdit(c,r)){ const f=sh.formula(c,r); toast(f!=null?xlName(c,r)+": "+f:"Эту ячейку менять не нужно"); return; }
    cur={c,r}; v.select(xlName(c,r)); row.hidden=false; lbl.textContent=xlName(c,r)+" ="; inp.value=xlShow(sh.data[r][c]); inp.focus(); inp.select(); }});
  b.appendChild(v);
  const row=h("div",{class:"xl-editrow"}), lbl=h("b"), inp=h("input",{type:"text",inputmode:"numeric",class:"xl-num","aria-label":"Новое число",enterkeyhint:"done",autocomplete:"off"});
  row.append(lbl,inp); row.hidden=true; b.appendChild(row);
  b.appendChild(h("p",{class:"note"},"Нажми на число в таблице, чтобы его поменять. Цель обведена: следи, как она пересчитывается."));
  inp.addEventListener("input",()=>{ if(!cur||done) return; const t=inp.value.trim().replace(",","."); sh.data[cur.r][cur.c]=t===""?null:(isFinite(Number(t))?Number(t):t); sh.touch(); v.draw(); chk.disabled=false; });
  inp.addEventListener("keydown",e=>{ if(e.key==="Enter"){ e.preventDefault(); inp.blur(); } });
  const chk=footer(null,{btn:"Проверить",disabled:true,on:()=>{ done=true; row.hidden=true;
    const got=sh.get(goal.c,goal.r), ok=typeof got==="number"&&Math.abs(got-st.goal.value)<1e-9;
    resolve(ok,st,ok?"":"В "+st.goal.cell+" сейчас «"+xlShow(got)+"», а нужно "+xlShow(st.goal.value)+"."); }});
}
function sheetFormula(st,b){
  const sh=xlFromSpec(st), cell=xlAddr(st.cell), fillR=st.fill?xlRange(st.fill):null;
  let src="", fillTo=null, prevFill=null, done=false, toks=[], md=st.chips?S.mode:"kbd", parseErr=null;
  const v=xlView(sh,{show:st.show,sel:st.cell,barEditor:true,
    onCell:(c,r)=>{ const f=sh.formula(c,r); if(f!=null&&!(c===cell.c&&r===cell.r)) toast(xlName(c,r)+": "+f); },
    handle:fillR?{on:()=>!!src&&!parseErr&&!done,
      onDrag:(c,r)=>{ fillTo=(c===cell.c&&r===cell.r)?null:{c,r}; haptic("success"); apply(true); },
      onDouble:()=>{ fillTo=fillR.c1===fillR.c2?{c:cell.c,r:fillR.r2}:{c:fillR.c2,r:fillR.r2}; haptic("success"); apply(true); }}:null});
  b.appendChild(v);
  const srcEl=v.bar.querySelector(".xl-src"); srcEl.classList.add("xl-edit");
  const msg=h("p",{class:"xl-msg"}); msg.hidden=true;
  const hint=h("p",{class:"xl-hint"},'<span class="xl-hq" aria-hidden="true"></span><span>Формула готова. Теперь потяни за квадратик в углу ячейки вниз до последней строки. Двойное нажатие на квадратик протянет формулу до конца сразу.</span>'); hint.hidden=true;
  const host=h("div",{class:"xl-entry"}); b.append(msg,hint,host);
  const covered=()=>!fillR||(fillTo&&fillTo.r>=fillR.r2&&fillTo.c>=fillR.c2);
  let chk;
  function apply(anim){
    if(prevFill){ sh.clearRange(prevFill); prevFill=null; }
    sh.set(cell,src||null);
    parseErr=null; if(src){ try{ xlParse(src); }catch(e){ parseErr=e.message; } }
    if(fillTo&&src&&!parseErr){ prevFill=xlName(cell.c,cell.r)+":"+xlName(fillTo.c,fillTo.r); sh.fill(st.cell,prevFill); }
    msg.hidden=!parseErr; if(parseErr) msg.textContent="Calc не поймёт формулу: "+parseErr;
    let a=null; if(anim&&prevFill){ const R=xlRange(prevFill); a=new Set(); for(let r=R.r1;r<=R.r2;r++) for(let c=R.c1;c<=R.c2;c++) a.add(c+","+r); }
    v.draw(a);
    hint.hidden=!(fillR&&src&&!parseErr&&!covered()&&!done);
    if(chk) chk.disabled=!src||!!parseErr;
  }
  function drawEntry(){
    host.innerHTML="";
    if(st.chips){
      const mode=h("div",{class:"mode",role:"group","aria-label":"Способ ввода"});
      const mB=h("button",{type:"button","aria-pressed":String(md==="blocks")},I.blocks+"Блоки"), mK=h("button",{type:"button","aria-pressed":String(md==="kbd")},I.kbd+"Клавиатура");
      mB.onclick=()=>{ if(md==="blocks"||done) return; md="blocks"; S.mode="blocks"; save(); toks=[]; src=""; fillTo=null; drawEntry(); apply(); };
      mK.onclick=()=>{ if(md==="kbd"||done) return; md="kbd"; S.mode="kbd"; save(); drawEntry(); apply(); };
      mode.append(mB,mK); host.appendChild(mode);
    }
    if(md==="blocks"&&st.chips){
      const drawSrc=()=>{ srcEl.innerHTML=toks.length?toks.map((t,i)=>'<button class="xl-tok" type="button" data-i="'+i+'">'+esc(t)+'</button>').join(""):'<span class="xl-ph">собери формулу из блоков</span>'; };
      srcEl.onclick=e=>{ const t=e.target.closest(".xl-tok"); if(!t||done) return; toks.splice(+t.dataset.i,1); src=toks.join(""); drawSrc(); apply(); };
      const tools=h("div",{class:"btools"});
      const del=h("button",{class:"tool",type:"button"},"<code>⌫</code> Стереть"); del.onclick=()=>{ if(done) return; toks.pop(); src=toks.join(""); drawSrc(); apply(); };
      tools.appendChild(del);
      const bank=h("div",{class:"bank"});
      st.chips.forEach(t=>{ const c=h("button",{class:"chip",type:"button"},esc(t)); c.onclick=()=>{ if(done) return; toks.push(t); src=toks.join(""); drawSrc(); apply(); }; bank.appendChild(c); });
      drawSrc();
      host.append(bank,tools);
    } else {
      srcEl.onclick=null; srcEl.innerHTML="";
      const inp=h("input",{class:"xl-input",type:"text",spellcheck:"false",autocomplete:"off",autocorrect:"off",autocapitalize:"characters",placeholder:"=СУММ(A1:E1)","aria-label":"Формула для ячейки "+st.cell,enterkeyhint:"done"});
      inp.value=src||st.start||""; srcEl.appendChild(inp);
      const sync=()=>{ src=inp.value.trim(); apply(); };
      inp.addEventListener("input",sync);
      inp.addEventListener("keydown",e=>{ if(e.key==="Enter"){ e.preventDefault(); inp.blur(); } });
      const keys=h("div",{class:"keys xl-keys"});
      ["=","(",")",";",":","$",">","<","*","+","-"].forEach(k=>{ const x=h("button",{type:"button"},esc(k)); x.onclick=()=>{ if(done) return; const s=inp.selectionStart??inp.value.length, e=inp.selectionEnd??s; inp.setRangeText(k,s,e,"end"); inp.focus(); sync(); }; keys.appendChild(x); });
      host.append(keys);
      setTimeout(()=>{ if(!done&&!("ontouchstart" in window)) inp.focus({preventScroll:true}); },50);
      src=inp.value.trim();
    }
  }
  chk=footer(null,{btn:"Проверить",disabled:true,on:()=>{
    if(fillR&&!covered()){ /* не ошибка, а подсказка: формулу ещё не протянули до конца */
      haptic("warning"); hint.hidden=false; hint.classList.remove("xl-nudge"); void hint.offsetWidth; hint.classList.add("xl-nudge");
      toast(fillTo?"Протянуто только до строки "+(fillTo.r+1)+", а данные идут до "+(fillR.r2+1):"Сначала протяни формулу за квадратик"); return; }
    done=true;
    const r=sheetCheck(st,src);
    v.draw();
    resolve(r.ok,st,r.msg||"");
  }});
  drawEntry(); apply();
}
/* сравнить формулу ученика с эталоном: на числах урока и на других числах той же формы */
function sheetCheck(st,src){
  try{ xlParse(src); }catch(e){ return {ok:false,msg:"В формуле ошибка: "+e.message+"."}; }
  const cellsOf=()=>{ const R=xlRange(st.fill||st.cell), a=[]; for(let r=R.r1;r<=R.r2;r++) for(let c=R.c1;c<=R.c2;c++) a.push([c,r]); return a; };
  const run=(data,f)=>{ const sh=xlFromSpec(st,data); sh.set(st.cell,f); if(st.fill) sh.fill(st.cell,st.fill); return sh; };
  const base=xlFromSpec(st).data;
  const sets=[base]; if(!st.gen) sets.push(xlAltData(base,11),xlAltData(base,23));
  for(let k=0;k<sets.length;k++){
    const a=run(sets[k].map(r=>r.slice()),src), e=run(sets[k].map(r=>r.slice()),st.solution);
    for(const [c,r] of cellsOf()){
      const x=a.get(c,r), y=e.get(c,r);
      const same=(x instanceof XErr||y instanceof XErr)?(x instanceof XErr&&y instanceof XErr&&x.code===y.code):(typeof x==="number"&&typeof y==="number"?Math.abs(x-y)<1e-9:x===y||(x==null&&y==null));
      if(!same){
        if(k===0) return {ok:false,msg:"В ячейке "+xlName(c,r)+" получилось «"+xlShow(x)+"», а здесь нужно другое."};
        return {ok:false,msg:"На этих числах формула сработала, но на других она даст не то. Похоже, она подогнана под эту таблицу."};
      }
    }
  }
  return {ok:true};
}
/* для проверки уроков в Node */
if(typeof module!=="undefined") module.exports={sheetCheck,xlParse,xlTokens,xlEval,xlSheet,xlFromSpec,xlGen,xlShow,xlShiftText,xlAltData,xlAddr,xlRange,xlColName,xlName,XErr};
