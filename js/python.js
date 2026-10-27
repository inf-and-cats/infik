/* Мини-Python ИНФиКа: переменные, ввод, условия, циклы, строки, списки, функции. Плюс подсветка синтаксиса.
   runPy(code, input) -> {out, err}. input — строки, которые «вводит пользователь» (массив или текст через \n).
   Как в терминале: подсказка input() и введённый текст попадают в вывод.
   Синтаксическая ошибка находится до запуска, поэтому программа с ней ничего не выводит (как настоящий Python). */

function PyErr(type,msg,line){ this.type=type; this.msg=msg; this.line=line; }

/* ---------- значения ---------- */
// int — BigInt, float — number, bool — boolean, str — string, None — null
function PyList(items){ this.items=items; }
function PyTuple(items){ this.items=items; }
function PyRange(a,b,s){ this.a=a; this.b=b; this.s=s; }
function PyType(name,call){ this.name=name; this.call=call; }
function PyBuiltin(name,fn){ this.name=name; this.fn=fn; }
function PyFunc(def,closure){ this.def=def; this.closure=closure; this.name=def.name; }
function PyMethod(self,name,fn){ this.self=self; this.name=name; this.fn=fn; }
const PY_NONE=null;

function tname(v){
  switch(typeof v){ case "bigint": return "int"; case "number": return "float"; case "boolean": return "bool"; case "string": return "str"; }
  if(v===null) return "NoneType";
  if(v instanceof PyList) return "list"; if(v instanceof PyTuple) return "tuple"; if(v instanceof PyRange) return "range";
  if(v instanceof PyType) return "type"; if(v instanceof PyFunc) return "function";
  if(v instanceof PyBuiltin||v instanceof PyMethod) return "builtin_function_or_method";
  return "object";
}
const isInt=v=>typeof v==="bigint"||typeof v==="boolean";
const isNum=v=>isInt(v)||typeof v==="number";
const toBig=v=>typeof v==="boolean"?(v?1n:0n):v;
const toF=v=>typeof v==="number"?v:Number(toBig(v));

function floatRepr(x){
  if(Number.isNaN(x)) return "nan";
  if(!Number.isFinite(x)) return x>0?"inf":"-inf";
  if(x===0) return Object.is(x,-0)?"-0.0":"0.0";
  const sign=x<0?"-":""; const e0=Math.abs(x).toExponential();
  const m=e0.match(/^(\d)(?:\.(\d+))?e([+-]\d+)$/); const D=m[1]+(m[2]||""); const e=Number(m[3]);
  if(e>=-4&&e<16){
    if(e>=0){ const ip=D.length>e+1?D.slice(0,e+1):D+"0".repeat(e+1-D.length); const fp=D.slice(e+1); return sign+ip+"."+(fp||"0"); }
    return sign+"0."+"0".repeat(-e-1)+D;
  }
  const mant=D.length>1?D[0]+"."+D.slice(1):D; const ex=Math.abs(e)<10?"0"+Math.abs(e):String(Math.abs(e));
  return sign+mant+"e"+(e<0?"-":"+")+ex;
}
function strRepr(s){
  const q=s.includes("'")&&!s.includes('"')?'"':"'";
  let r=q; for(const c of s){
    if(c==="\\") r+="\\\\"; else if(c===q) r+="\\"+q; else if(c==="\n") r+="\\n"; else if(c==="\t") r+="\\t"; else if(c==="\r") r+="\\r";
    else if(c.charCodeAt(0)<32||c.charCodeAt(0)===127) r+="\\x"+c.charCodeAt(0).toString(16).padStart(2,"0"); else r+=c; }
  return r+q;
}
function pyRepr(v){
  switch(typeof v){ case "bigint": return v.toString(); case "number": return floatRepr(v); case "boolean": return v?"True":"False"; case "string": return strRepr(v); }
  if(v===null) return "None";
  if(v instanceof PyList) return "["+v.items.map(pyRepr).join(", ")+"]";
  if(v instanceof PyTuple) return "("+v.items.map(pyRepr).join(", ")+(v.items.length===1?",":"")+")";
  if(v instanceof PyRange) return "range("+v.a+", "+v.b+(v.s!==1n?", "+v.s:"")+")";
  if(v instanceof PyType) return "<class '"+v.name+"'>";
  if(v instanceof PyFunc) return "<function "+v.name+" at 0x7f3a2c1b4e00>";
  if(v instanceof PyBuiltin) return "<built-in function "+v.name+">";
  if(v instanceof PyMethod) return "<built-in method "+v.name+" of "+tname(v.self)+" object at 0x7f3a2c1b4e00>";
  return "<object>";
}
const pyStr=v=>typeof v==="string"?v:pyRepr(v);
function truthy(v){
  switch(typeof v){ case "bigint": return v!==0n; case "number": return v!==0; case "boolean": return v; case "string": return v.length>0; }
  if(v===null) return false;
  if(v instanceof PyList||v instanceof PyTuple) return v.items.length>0;
  if(v instanceof PyRange) return rangeLen(v)>0n;
  return true;
}
function rangeLen(r){ if(r.s>0n) return r.b>r.a?(r.b-r.a+r.s-1n)/r.s:0n; return r.a>r.b?(r.a-r.b-r.s-1n)/(-r.s):0n; }

/* ---------- лексер ---------- */
const OPS=["**=","//=","...","==","!=","<=",">=","+=","-=","*=","/=","%=","**","//","->",":=","+","-","*","/","%","<",">","=","(",")","[","]","{","}",",",":",".",";","@","&","|","^","~"];
const KW=new Set(["if","else","elif","for","while","in","def","return","and","or","not","True","False","None","import","from","break","continue","pass","global","is","lambda","class","try","except","finally","with","as","yield","del","assert","raise","nonlocal","async","await"]);
const isIdStart=c=>/[A-Za-z_\u00C0-\u1FFF\u2C00-\uD7FF]/.test(c)&&!"«»".includes(c);
const isIdChar=c=>isIdStart(c)||/[0-9]/.test(c);

function lex(src){
  src=src.replace(/\r\n?/g,"\n").replace(/\t/g,"    ");
  const T=[], ind=[0], br=[]; let i=0, line=1, atStart=true;
  const push=(k,v,l)=>T.push({k,v,line:l==null?line:l});
  // Ошибку лексера не бросаем сразу: парсер может найти ошибку раньше (как в CPython)
  try{
  while(i<=src.length){
    if(atStart&&br.length===0){
      let j=i, n=0; while(src[j]===" "){ n++; j++; }
      if(j>=src.length){ i=j; break; }
      if(src[j]==="\n"||src[j]==="#"){ while(j<src.length&&src[j]!=="\n") j++; i=j+1; line++; continue; }
      if(src[j]==="\\"&&src[j+1]==="\n"){ i=j+2; line++; continue; }
      if(n>ind[ind.length-1]){ ind.push(n); push("indent",n); }
      else if(n<ind[ind.length-1]){
        while(n<ind[ind.length-1]){ ind.pop(); push("dedent",n); }
        if(n!==ind[ind.length-1]) throw new PyErr("IndentationError","unindent does not match any outer indentation level",line);
      }
      i=j; atStart=false;
    }
    if(i>=src.length) break;
    const c=src[i];
    if(c===" "){ i++; continue; }
    if(c==="#"){ while(i<src.length&&src[i]!=="\n") i++; continue; }
    if(c==="\\"&&src[i+1]==="\n"){ i+=2; line++; continue; }
    if(c==="\n"){ if(br.length===0){ push("nl"); atStart=true; } i++; line++; continue; }
    // строки, в том числе f"..." и r"..."
    let pre="", k=i; while(k<i+2&&/[fFrR]/.test(src[k]||"")){ pre+=src[k].toLowerCase(); k++; }
    if((src[k]==='"'||src[k]==="'")&&(pre===""||!isIdChar(src[i-1]||" "))){
      const q=src[k], triple=src.substr(k,3)===q+q+q, startLine=line; let j=k+(triple?3:1), s="";
      let fdepth=0;
      while(true){
        if(pre.includes("f")){
          const d0=src[j];
          if(d0==="{"&&src[j+1]==="{"&&fdepth===0){ s+="{{"; j+=2; continue; }
          if(d0==="}"&&src[j+1]==="}"&&fdepth===0){ s+="}}"; j+=2; continue; }
          if(d0==="{"){ fdepth++; s+=d0; j++; continue; }
          if(d0==="}"&&fdepth>0){ fdepth--; s+=d0; j++; continue; }
          if(fdepth>0&&(d0==='"'||d0==="'")){ let e2=j+1; while(e2<src.length&&src[e2]!==d0&&src[e2]!=="\n") e2++; s+=src.slice(j,e2+1); j=e2+1; continue; }
        }
        if(j>=src.length){ throw new PyErr("SyntaxError",(triple?"unterminated triple-quoted string literal":"unterminated string literal")+" (detected at line "+line+")",startLine); }
        const d=src[j];
        if(!triple&&d==="\n") throw new PyErr("SyntaxError","unterminated string literal (detected at line "+line+")",startLine);
        if(triple?src.substr(j,3)===q+q+q:d===q){ j+=triple?3:1; break; }
        if(d==="\\"&&!pre.includes("r")){ const e=src[j+1]; const map={n:"\n",t:"\t","\\":"\\","'":"'",'"':'"',r:"\r","0":"\0","\n":""};
          if(e in map){ s+=map[e]; if(e==="\n") line++; j+=2; continue; } s+="\\"; j++; continue; }
        if(d==="\n") line++;
        s+=d; j++;
      }
      push(pre.includes("f")?"fstr":"str",s,startLine); i=j; continue;
    }
    if(/[0-9]/.test(c)||(c==="."&&/[0-9]/.test(src[i+1]||""))){
      const m=src.slice(i).match(/^(?:[0-9][0-9_]*)?(?:\.[0-9_]*)?(?:[eE][+-]?[0-9]+)?/)[0];
      const after=src[i+m.length]||"";
      if(isIdChar(after)) throw new PyErr("SyntaxError","invalid decimal literal",line);
      const clean=m.replace(/_/g,"");
      if(/[.eE]/.test(clean)) push("num",Number(clean)); else push("num",BigInt(clean));
      i+=m.length; continue;
    }
    if(isIdStart(c)){ let j=i; while(j<src.length&&isIdChar(src[j])) j++; const w=src.slice(i,j); push(KW.has(w)?"kw":"name",w); i=j; continue; }
    const op=OPS.find(o=>src.startsWith(o,i));
    if(op){
      if("([{".includes(op)) br.push({c:op,line,idx:T.length});
      if(")]}".includes(op)){
        const want={")":"(","]":"[","}":"{"}[op];
        if(!br.length) throw new PyErr("SyntaxError","unmatched '"+op+"'",line);
        const top=br.pop(); if(top.c!==want) throw new PyErr("SyntaxError","closing parenthesis '"+op+"' does not match opening parenthesis '"+top.c+"'"+(top.line!==line?" on line "+top.line:""),line);
      }
      push("op",op); i+=op.length; continue;
    }
    const code=c.codePointAt(0);
    if(code>127||"«»“”„".includes(c)) throw new PyErr("SyntaxError","invalid character '"+String.fromCodePoint(code)+"' (U+"+code.toString(16).toUpperCase().padStart(4,"0")+")",line);
    throw new PyErr("SyntaxError","invalid syntax",line);
  }
  if(br.length){ const top=br[br.length-1]; const e=new PyErr("SyntaxError","'"+top.c+"' was never closed",top.line); e.openIdx=top.idx; throw e; }
  }catch(e){ if(!(e instanceof PyErr)) throw e; T.push({k:"error",err:e,line:e.line}); T.lexErr=e; return T; }
  if(T.length&&T[T.length-1].k!=="nl") push("nl");
  while(ind.length>1){ ind.pop(); push("dedent",0); }
  push("eof");
  return T;
}

/* ---------- парсер ---------- */
function parse(src){
  const T=lex(src); let p=0; const loops=[0], funcs=[0];
  const chk=()=>{ if(T[p].k==="error") throw T[p].err; };
  const peek=(o=0)=>{ if(!o) chk(); return T[p+o]||T[T.length-1]; }, next=()=>{ chk(); return T[p++]; };
  const is=(k,v)=>{ chk(); return T[p].k===k&&(v==null||T[p].v===v); };
  const isOp=v=>is("op",v), isKw=v=>is("kw",v);
  const err=(msg,line,type)=>new PyErr(type||"SyntaxError",msg,line==null?T[p].line:line);
  const expectOp=v=>{ if(!isOp(v)) throw err("invalid syntax"); return next(); };
  const startsExpr=t=>t.k==="name"||t.k==="num"||t.k==="str"||t.k==="fstr"||(t.k==="kw"&&["True","False","None","not","lambda"].includes(t.v))||(t.k==="op"&&["(","[","-","+","{","~"].includes(t.v));

  function block(kind,hline){
    if(!isOp(":")) throw err("expected ':'");
    next();
    if(!is("nl")) return simpleLine();
    next();
    if(!is("indent")) throw new PyErr("IndentationError","expected an indented block after "+kind+" on line "+hline,T[p].line);
    next(); const body=[];
    while(!is("dedent")&&!is("eof")) body.push(...statement());
    if(is("dedent")) next();
    return body;
  }
  function statement(){
    const t=peek();
    if(t.k==="indent") throw new PyErr("IndentationError","unexpected indent",t.line);
    if(t.k==="kw"){
      if(t.v==="if") return [ifStmt()];
      if(t.v==="while"){ next(); const test=condition(); loops[loops.length-1]++; const body=block("'while' statement",t.line); loops[loops.length-1]--; return [{k:"while",test,body,line:t.line}]; }
      if(t.v==="for"){ next(); const target=targetList(); if(!isKw("in")) throw err("invalid syntax"); next(); const iter=exprList(); loops[loops.length-1]++; const body=block("'for' statement",t.line); loops[loops.length-1]--; return [{k:"for",target,iter,body,line:t.line}]; }
      if(t.v==="def") return [defStmt()];
      if(t.v==="else"||t.v==="elif") throw err("invalid syntax");
    }
    return simpleLine();
  }
  function ifStmt(){
    const t=next(); const test=condition(); const body=block("'"+t.v+"' statement",t.line); let orelse=[];
    if(isKw("elif")) orelse=[ifStmt()];
    else if(isKw("else")){ const e=next(); orelse=block("'else' statement",e.line); }
    return {k:"if",test,body,orelse,line:t.line};
  }
  function condition(){
    const e=expr();
    if(isOp("=")) throw err("invalid syntax. Maybe you meant '==' or ':=' instead of '='?",e.line);
    return e;
  }
  function defStmt(){
    const t=next(); if(!is("name")) throw err("invalid syntax"); const name=next().v; expectOp("(");
    const params=[]; let seenDef=false;
    while(!isOp(")")){
      if(!is("name")) throw err("invalid syntax"); const pn=next().v; let def=null;
      if(isOp("=")){ next(); def=expr(); seenDef=true; } else if(seenDef) throw err("parameter without a default follows parameter with a default");
      params.push({name:pn,def}); if(isOp(",")){ next(); continue; } if(!isOp(")")) throw err("invalid syntax");
    }
    next(); loops.push(0); funcs.push(1);
    const body=block("function definition",t.line);
    loops.pop(); funcs.pop();
    return {k:"def",name,params,body,line:t.line};
  }
  function simpleLine(){
    const out=[simple()];
    while(isOp(";")){ next(); if(is("nl")) break; out.push(simple()); }
    if(!is("nl")&&!is("eof")) throw err("invalid syntax");
    if(is("nl")) next();
    return out;
  }
  function simple(){
    const t=peek(), line=t.line;
    if(t.k==="kw"){
      if(t.v==="pass"){ next(); return {k:"pass",line}; }
      if(t.v==="break"||t.v==="continue"){ next(); if(!loops[loops.length-1]) throw err("'"+t.v+"' "+(t.v==="break"?"outside loop":"not properly in loop"),line); return {k:t.v,line}; }
      if(t.v==="return"){ next(); if(!funcs[funcs.length-1]) throw err("'return' outside function",line); const v=(is("nl")||is("eof")||isOp(";"))?null:exprList(); return {k:"return",v,line}; }
      if(t.v==="global"){ next(); const names=[]; do{ if(!is("name")) throw err("invalid syntax"); names.push(next().v); }while(isOp(",")&&next()); return {k:"global",names,line}; }
      if(["import","from","class","try","with","lambda","del","raise","assert","yield","nonlocal","while","for","if","def","else","elif","except","finally"].includes(t.v)) throw err("invalid syntax",line);
    }
    const first=exprList();
    if(first.k==="name"&&first.id==="print"&&startsExpr(peek())&&!isOp("(")&&!isOp("[")&&!isOp("-")&&!isOp("+")) throw err("Missing parentheses in call to 'print'. Did you mean print(...)?",line);
    if(isOp("=")){
      const targets=[first]; let value;
      while(isOp("=")){ next(); value=exprList(); if(isOp("=")) targets.push(value); }
      targets.forEach(checkTarget);
      return {k:"assign",targets,value,line};
    }
    const aug=["+=","-=","*=","/=","//=","%=","**="].find(o=>isOp(o));
    if(aug){ next(); if(first.k!=="name"&&first.k!=="sub") throw err("'"+describe(first)+"' is an illegal expression for augmented assignment",line); const value=exprList(); return {k:"aug",op:aug.slice(0,-1),target:first,value,line}; }
    if(startsExpr(peek())&&!is("nl")) throw err("invalid syntax",peek().line);
    return {k:"expr",e:first,line};
  }
  function describe(e){ return {num:"literal",str:"literal",const:"literal",call:"function call",bin:"expression",unary:"expression",cmp:"comparison",bool:"expression",fstr:"f-string expression",list:"list",tuple:"tuple"}[e.k]||"expression"; }
  function checkTarget(e){
    if(e.k==="name"||e.k==="sub") return;
    if(e.k==="tuple"||e.k==="list"){ e.items.forEach(checkTarget); return; }
    if(e.k==="const"&&e.v===null) throw err("cannot assign to None",e.line);
    if(e.k==="const"&&typeof e.v==="boolean") throw err("cannot assign to "+(e.v?"True":"False"),e.line);
    throw err("cannot assign to "+describe(e)+" here. Maybe you meant '==' instead of '='?",e.line);
  }
  function targetList(){
    const items=[primaryTarget()];
    while(isOp(",")){ next(); if(isKw("in")) break; items.push(primaryTarget()); }
    return items.length===1?items[0]:{k:"tuple",items,line:items[0].line};
  }
  function primaryTarget(){ const e=bitor(); checkTarget(e); return e; }
  function exprList(){
    const line=peek().line; const first=expr();
    if(!isOp(",")) return first;
    const items=[first];
    while(isOp(",")){ next(); if(!startsExpr(peek())) break; items.push(expr()); }
    return {k:"tuple",items,line};
  }
  function expr(){
    const line=peek().line;
    if(isKw("lambda")) throw err("invalid syntax");
    const e=orTest();
    if(isKw("if")&&!is("nl")){
      const save=p; next(); const test=orTest();
      if(!isKw("else")){ p=save; return e; }
      next(); const orelse=expr(); return {k:"ifexp",test,body:e,orelse,line};
    }
    return e;
  }
  function orTest(){ let a=andTest(); while(isKw("or")){ const l=next().line; a={k:"bool",op:"or",a,b:andTest(),line:l}; } return a; }
  function andTest(){ let a=notTest(); while(isKw("and")){ const l=next().line; a={k:"bool",op:"and",a,b:notTest(),line:l}; } return a; }
  function notTest(){ if(isKw("not")){ const l=next().line; return {k:"not",e:notTest(),line:l}; } return comparison(); }
  function comparison(){
    const line=peek().line; const first=bitor(); const ops=[], rest=[];
    while(true){
      let op=null;
      if(["<",">","==","!=","<=",">="].some(o=>isOp(o))) op=next().v;
      else if(isKw("in")) { next(); op="in"; }
      else if(isKw("not")&&peek(1).k==="kw"&&peek(1).v==="in"){ next(); next(); op="not in"; }
      else if(isKw("is")){ next(); if(isKw("not")){ next(); op="is not"; } else op="is"; }
      if(!op) break; ops.push(op); rest.push(bitor());
    }
    return ops.length?{k:"cmp",first,ops,rest,line}:first;
  }
  function bitor(){ return arith(); }
  function arith(){ let a=term(); while(isOp("+")||isOp("-")){ const t=next(); a={k:"bin",op:t.v,a,b:term(),line:t.line}; } return a; }
  function term(){ let a=factor(); while(["*","/","//","%"].some(o=>isOp(o))){ const t=next(); a={k:"bin",op:t.v,a,b:factor(),line:t.line}; } return a; }
  function factor(){ if(isOp("-")||isOp("+")){ const t=next(); return {k:"unary",op:t.v,e:factor(),line:t.line}; } return power(); }
  function power(){ const a=primary(); if(isOp("**")){ const t=next(); return {k:"bin",op:"**",a,b:factor(),line:t.line}; } return a; }
  function primary(){
    let e=atom();
    while(true){
      if(isOp("(")){ const t=next(); const {args,kwargs}=callArgs(); e={k:"call",f:e,args,kwargs,line:t.line}; }
      else if(isOp("[")){ const t=next(); const idx=subscript(); expectOp("]"); e={k:"sub",obj:e,idx,line:t.line}; }
      else if(isOp(".")){ const t=next(); if(!is("name")) throw err("invalid syntax"); e={k:"attr",obj:e,name:next().v,line:t.line}; }
      else break;
    }
    return e;
  }
  function callArgs(){
    const args=[], kwargs=[];
    while(!isOp(")")){
      if(is("name")&&peek(1).k==="op"&&peek(1).v==="="){ const n=next().v; next(); kwargs.push({name:n,v:expr()}); }
      else { if(kwargs.length) throw err("positional argument follows keyword argument"); const a=expr(); args.push(a); if(isOp("=")) throw err('expression cannot contain assignment, perhaps you meant "=="?',a.line); }
      if(isOp(",")){ next(); continue; }
      if(isOp(")")) break;
      if(startsExpr(peek())) throw err("invalid syntax. Perhaps you forgot a comma?",(args[args.length-1]||{}).line);
      throw err("invalid syntax");
    }
    next(); return {args,kwargs};
  }
  function subscript(){
    const line=peek().line; let lo=null, hi=null, st=null;
    if(!isOp(":")) lo=expr();
    if(!isOp(":")) return lo;
    next(); if(!isOp(":")&&!isOp("]")) hi=expr();
    if(isOp(":")){ next(); if(!isOp("]")) st=expr(); }
    return {k:"slice",lo,hi,st,line};
  }
  function atom(){
    const t=peek();
    if(t.k==="name"){ next(); return {k:"name",id:t.v,line:t.line}; }
    if(t.k==="num"){ next(); return {k:"const",v:t.v,line:t.line}; }
    if(t.k==="str"||t.k==="fstr"){
      const parts=[];
      while(is("str")||is("fstr")){ const s=next(); if(s.k==="str") parts.push({lit:s.v}); else parts.push(...fparts(s.v,s.line)); }
      if(parts.every(x=>x.lit!=null)) return {k:"const",v:parts.map(x=>x.lit).join(""),line:t.line};
      return {k:"fstr",parts,line:t.line};
    }
    if(t.k==="kw"){
      if(t.v==="True"||t.v==="False"){ next(); return {k:"const",v:t.v==="True",line:t.line}; }
      if(t.v==="None"){ next(); return {k:"const",v:null,line:t.line}; }
    }
    if(t.k==="op"){
      if(t.v==="("){ next(); if(isOp(")")){ next(); return {k:"tuple",items:[],line:t.line}; }
        const e=expr(); if(isOp(",")){ const items=[e]; while(isOp(",")){ next(); if(isOp(")")) break; items.push(expr()); } expectOp(")"); return {k:"tuple",items,line:t.line}; }
        if(!isOp(")")){ if(startsExpr(peek())) throw err("invalid syntax. Perhaps you forgot a comma?",e.line); throw err("invalid syntax"); }
        next(); return e; }
      if(t.v==="["){ next(); const items=[];
        if(!isOp("]")){ const first=expr();
          if(isKw("for")){ next(); const target=targetList(); if(!isKw("in")) throw err("invalid syntax"); next(); const iter=orTest(); const conds=[]; while(isKw("if")){ next(); conds.push(orTest()); } expectOp("]"); return {k:"listcomp",e:first,target,iter,conds,line:t.line}; }
          items.push(first);
          while(isOp(",")){ next(); if(isOp("]")) break; items.push(expr()); }
          if(!isOp("]")){ if(startsExpr(peek())) throw err("invalid syntax. Perhaps you forgot a comma?",first.line); throw err("invalid syntax"); }
        }
        next(); return {k:"list",items,line:t.line}; }
    }
    if(t.k==="nl"||t.k==="eof") throw err("invalid syntax",t.line);
    throw err("invalid syntax",t.line);
  }
  function fparts(s,line){
    const out=[]; let i=0, lit="";
    while(i<s.length){
      const c=s[i];
      if(c==="{"&&s[i+1]==="{"){ lit+="{"; i+=2; continue; }
      if(c==="}"&&s[i+1]==="}"){ lit+="}"; i+=2; continue; }
      if(c==="}") throw new PyErr("SyntaxError","f-string: single '}' is not allowed",line);
      if(c==="{"){
        if(lit){ out.push({lit}); lit=""; }
        let depth=0, j=i+1, q=null;
        for(;j<s.length;j++){ const d=s[j]; if(q){ if(d===q) q=null; continue; } if(d==='"'||d==="'"){ q=d; continue; } if("([{".includes(d)) depth++; else if(")]}".includes(d)){ if(d==="}"&&depth===0) break; depth--; } else if(d===":"&&depth===0) break; }
        const code=s.slice(i+1,j); let spec="";
        if(s[j]===":"){ const k=s.indexOf("}",j); spec=s.slice(j+1,k); j=k; }
        if(j>=s.length||s[j]!=="}") throw new PyErr("SyntaxError","f-string: expecting '}'",line);
        if(!code.trim()) throw new PyErr("SyntaxError","f-string: valid expression required before '}'",line);
        let sub; try{ const P=parse(code.trim()); if(P.length!==1||P[0].k!=="expr") throw new PyErr("SyntaxError","f-string: invalid syntax",line); sub=P[0].e; }
        catch(e){ if(e instanceof PyErr) e.line=line; throw e; }
        setLine(sub,line); out.push({e:sub,spec}); i=j+1; continue;
      }
      lit+=c; i++;
    }
    if(lit) out.push({lit});
    return out;
  }
  function setLine(n,line){ if(n&&typeof n==="object"){ if("line" in n) n.line=line; for(const k in n) if(k!=="line") setLine(n[k],line); } }

  const body=[];
  try{
    while(!is("eof")){ if(is("nl")){ next(); continue; } if(is("dedent")){ next(); continue; } body.push(...statement()); }
  }catch(e){
    const le=T.lexErr;
    if(le&&e!==le&&e instanceof PyErr&&e.type==="SyntaxError"&&(le.openIdx==null||p>=le.openIdx)) throw le;
    throw e;
  }
  return body;
}

/* ---------- выполнение ---------- */
class BreakSig{} class ContinueSig{} class ReturnSig{ constructor(v){ this.v=v; } }
const LIMIT_STEPS=300000, LIMIT_OUT=200000, LIMIT_DEPTH=900;

function runPy(code,input){
  const out=[]; let outLen=0;
  const inputs=Array.isArray(input)?input.slice():(input==null||input===""?[]:String(input).replace(/\n$/,"").split("\n"));
  let steps=0, depth=0, curLine=1;
  const write=s=>{ out.push(s); outLen+=s.length; if(outLen>LIMIT_OUT) throw new PyErr("TimeoutError","программа выводит слишком много. Возможно, цикл не заканчивается",curLine); };
  const tick=()=>{ if(++steps>LIMIT_STEPS) throw new PyErr("TimeoutError","программа работает слишком долго. Возможно, цикл не заканчивается",curLine); };
  const E=(type,msg)=>new PyErr(type,msg,null);

  /* --- операции --- */
  function floorDivBig(a,b){ const q=a/b; return (a%b!==0n&&((a<0n)!==(b<0n)))?q-1n:q; }
  function modBig(a,b){ const r=a%b; return (r!==0n&&((r<0n)!==(b<0n)))?r+b:r; }
  function fmodPy(a,b){ let m=a%b; if(m&&((b<0)!==(m<0))) m+=b; return m; }
  function fdivPy(a,b){ const m=a%b; let div=(a-m)/b; if(m&&((b<0)!==(m<0))) div-=1; if(div){ let f=Math.floor(div); if(div-f>0.5) f+=1; return f; } return 0*(a/b); }
  function binop(op,a,b,aug){
    if(isNum(a)&&isNum(b)){
      if(isInt(a)&&isInt(b)){
        const x=toBig(a), y=toBig(b);
        switch(op){
          case "+": return x+y; case "-": return x-y; case "*": return x*y;
          case "/": if(y===0n) throw E("ZeroDivisionError","division by zero"); return Number(x)/Number(y);
          case "//": if(y===0n) throw E("ZeroDivisionError","integer division or modulo by zero"); return floorDivBig(x,y);
          case "%": if(y===0n) throw E("ZeroDivisionError","integer modulo by zero"); return modBig(x,y);
          case "**": if(y<0n){ if(x===0n) throw E("ZeroDivisionError","zero to a negative power"); return Math.pow(Number(x),Number(y)); }
            if(y>100000n||(x>1n||x<-1n)&&y*BigInt(x.toString(2).length)>400000n) throw E("OverflowError","слишком большое число"); return x**y;
        }
      }
      const x=toF(a), y=toF(b);
      switch(op){
        case "+": return x+y; case "-": return x-y; case "*": return x*y;
        case "/": if(y===0) throw E("ZeroDivisionError","float division by zero"); return x/y;
        case "//": if(y===0) throw E("ZeroDivisionError","float floor division by zero"); return fdivPy(x,y);
        case "%": if(y===0) throw E("ZeroDivisionError","float modulo by zero"); return fmodPy(x,y);
        case "**": if(x===0&&y<0) throw E("ZeroDivisionError","zero to a negative power"); { const r=Math.pow(x,y); if(!Number.isFinite(r)&&Number.isFinite(x)&&Number.isFinite(y)) throw E("OverflowError","(34, 'Numerical result out of range')"); return r; }
      }
    }
    const ta=tname(a), tb=tname(b);
    if(op==="+"){
      if(typeof a==="string"&&typeof b==="string") return a+b;
      if(a instanceof PyList&&b instanceof PyList) return new PyList(a.items.concat(b.items));
      if(a instanceof PyTuple&&b instanceof PyTuple) return new PyTuple(a.items.concat(b.items));
      if(typeof a==="string"||a instanceof PyList||a instanceof PyTuple) throw E("TypeError",'can only concatenate '+ta+' (not "'+tb+'") to '+ta);
    }
    if(op==="*"){
      const seq=v=>typeof v==="string"||v instanceof PyList||v instanceof PyTuple;
      if(seq(a)||seq(b)){
        const s=seq(a)?a:b, n=seq(a)?b:a;
        if(!isInt(n)) throw E("TypeError","can't multiply sequence by non-int of type '"+tname(n)+"'");
        const k=Number(toBig(n)); if(k*(typeof s==="string"?s.length:s.items.length)>1e6) throw E("MemoryError","слишком длинный результат");
        if(typeof s==="string") return k>0?s.repeat(k):"";
        const items=[]; for(let i=0;i<k;i++) items.push(...s.items); return s instanceof PyList?new PyList(items):new PyTuple(items);
      }
    }
    if(op==="%"&&typeof a==="string") throw E("TypeError","not all arguments converted during string formatting");
    const sym=aug?op+"=":op==="**"?"** or pow()":op;
    throw E("TypeError","unsupported operand type(s) for "+sym+": '"+ta+"' and '"+tb+"'");
  }
  function eq(a,b){
    if(isNum(a)&&isNum(b)){ if(isInt(a)&&isInt(b)) return toBig(a)===toBig(b); return toF(a)===toF(b); }
    if(typeof a==="string"||typeof b==="string") return a===b;
    if(a===null||b===null) return a===b;
    if((a instanceof PyList&&b instanceof PyList)||(a instanceof PyTuple&&b instanceof PyTuple)){ if(a.items.length!==b.items.length) return false; for(let i=0;i<a.items.length;i++) if(!eq(a.items[i],b.items[i])) return false; return true; }
    if(a instanceof PyRange&&b instanceof PyRange) return a.a===b.a&&a.b===b.b&&a.s===b.s;
    return a===b;
  }
  function lt(a,b,op){
    if(isNum(a)&&isNum(b)){ if(isInt(a)&&isInt(b)) return toBig(a)<toBig(b); return toF(a)<toF(b); }
    if(typeof a==="string"&&typeof b==="string") return a<b;
    if((a instanceof PyList&&b instanceof PyList)||(a instanceof PyTuple&&b instanceof PyTuple)){
      const n=Math.min(a.items.length,b.items.length);
      for(let i=0;i<n;i++){ if(!eq(a.items[i],b.items[i])) return lt(a.items[i],b.items[i],op); }
      return a.items.length<b.items.length;
    }
    throw E("TypeError","'"+op+"' not supported between instances of '"+tname(a)+"' and '"+tname(b)+"'");
  }
  function compare(op,a,b){
    switch(op){
      case "==": return eq(a,b); case "!=": return !eq(a,b);
      case "<": return lt(a,b,"<"); case ">": return lt(b,a,">"); case "<=": return lt(a,b,"<=")||eq(a,b); case ">=": return lt(b,a,">=")||eq(a,b);
      case "in": return contains(b,a); case "not in": return !contains(b,a);
      case "is": return a===b||(a===null&&b===null); case "is not": return !(a===b);
    }
  }
  function contains(c,x){
    if(typeof c==="string"){ if(typeof x!=="string") throw E("TypeError","'in <string>' requires string as left operand, not "+tname(x)); return c.includes(x); }
    if(c instanceof PyList||c instanceof PyTuple) return c.items.some(v=>eq(v,x));
    if(c instanceof PyRange){ if(!isInt(x)) return false; const v=toBig(x); if(c.s>0n?(v<c.a||v>=c.b):(v>c.a||v<=c.b)) return false; return (v-c.a)%c.s===0n; }
    throw E("TypeError","argument of type '"+tname(c)+"' is not iterable");
  }
  function iterate(v){
    if(typeof v==="string") return Array.from(v)[Symbol.iterator]();
    if(v instanceof PyList){ let i=0; return {next:()=>i<v.items.length?{value:v.items[i++],done:false}:{done:true},[Symbol.iterator](){return this;}}; }
    if(v instanceof PyTuple) return v.items[Symbol.iterator]();
    if(v instanceof PyRange){ let c=v.a; return {next:()=>((v.s>0n?c<v.b:c>v.b)?{value:(c+=v.s)-v.s,done:false}:{done:true}),[Symbol.iterator](){return this;}}; }
    throw E("TypeError","'"+tname(v)+"' object is not iterable");
  }
  const toArray=v=>{ const a=[]; for(const x of iterate(v)){ tick(); a.push(x); } return a; };
  function index(obj,idx){
    if(idx&&idx.k==="sliceval") return slice(obj,idx);
    if(typeof obj==="string"||obj instanceof PyList||obj instanceof PyTuple){
      const tn=tname(obj);
      if(!isInt(idx)) throw E("TypeError",tn==="str"?"string indices must be integers, not '"+tname(idx)+"'":tn+" indices must be integers or slices, not "+tname(idx));
      const arr=typeof obj==="string"?Array.from(obj):obj.items; let i=Number(toBig(idx)); if(i<0) i+=arr.length;
      if(i<0||i>=arr.length) throw E("IndexError",(tn==="str"?"string":tn)+" index out of range");
      return arr[i];
    }
    if(obj instanceof PyRange){ const n=rangeLen(obj); let i=toBig(idx); if(i<0n) i+=n; if(i<0n||i>=n) throw E("IndexError","range object index out of range"); return obj.a+i*obj.s; }
    throw E("TypeError","'"+tname(obj)+"' object is not subscriptable");
  }
  function sliceIdx(sl,len){
    const g=(v,name)=>{ if(v===null) return null; if(!isInt(v)) throw E("TypeError","slice indices must be integers or None or have an __index__ method"); return Number(toBig(v)); };
    let st=g(sl.st); if(st===0) throw E("ValueError","slice step cannot be zero"); if(st===null) st=1;
    let lo=g(sl.lo), hi=g(sl.hi);
    const norm=(v,def)=>{ if(v===null) return def; if(v<0){ v+=len; if(v<0) v=st<0?-1:0; } else if(v>=len) v=st<0?len-1:len; return v; };
    lo=norm(lo,st>0?0:len-1); hi=norm(hi,st>0?len:-1);
    const idx=[]; if(st>0) for(let i=lo;i<hi;i+=st) idx.push(i); else for(let i=lo;i>hi;i+=st) idx.push(i);
    return idx;
  }
  function slice(obj,sl){
    if(typeof obj==="string"){ const a=Array.from(obj); return sliceIdx(sl,a.length).map(i=>a[i]).join(""); }
    if(obj instanceof PyList) return new PyList(sliceIdx(sl,obj.items.length).map(i=>obj.items[i]));
    if(obj instanceof PyTuple) return new PyTuple(sliceIdx(sl,obj.items.length).map(i=>obj.items[i]));
    throw E("TypeError","'"+tname(obj)+"' object is not subscriptable");
  }
  function setIndex(obj,idx,v){
    if(obj instanceof PyList){
      if(!isInt(idx)) throw E("TypeError","list indices must be integers or slices, not "+tname(idx));
      let i=Number(toBig(idx)); if(i<0) i+=obj.items.length; if(i<0||i>=obj.items.length) throw E("IndexError","list assignment index out of range");
      obj.items[i]=v; return;
    }
    throw E("TypeError","'"+tname(obj)+"' object does not support item assignment");
  }

  /* --- форматирование для f-строк --- */
  function format(v,spec){
    if(!spec) return pyStr(v);
    const m=spec.match(/^(?:(.)?([<>^]))?(\d*)(,)?(?:\.(\d+))?([dfs%]?)$/);
    if(!m) throw E("ValueError","Invalid format specifier '"+spec+"' for object of type '"+tname(v)+"'");
    const [,fill=" ",align,width,comma,prec,type]=m; let s;
    if(type==="f"||(prec!=null&&type===""&&isNum(v))){ if(!isNum(v)) throw E("ValueError","Unknown format code 'f' for object of type '"+tname(v)+"'"); s=type==="f"?toF(v).toFixed(prec==null?6:Number(prec)):floatRepr(Number(toF(v).toPrecision(Number(prec)||1))); }
    else if(type==="%"){ s=(toF(v)*100).toFixed(prec==null?6:Number(prec))+"%"; }
    else if(type==="d"){ if(!isInt(v)) throw E("ValueError","Unknown format code 'd' for object of type '"+tname(v)+"'"); s=toBig(v).toString(); }
    else s=pyStr(v);
    if(comma){ const [ip,fp]=s.split("."); s=ip.replace(/\B(?=(\d{3})+(?!\d))/g,",")+(fp!=null?"."+fp:""); }
    const w=Number(width||0); const al=align||(isNum(v)?">":"<");
    if(s.length<w){ const pad=w-s.length; if(al==="<") s=s+fill.repeat(pad); else if(al===">") s=fill.repeat(pad)+s; else s=fill.repeat(Math.floor(pad/2))+s+fill.repeat(pad-Math.floor(pad/2)); }
    return s;
  }

  /* --- встроенные функции --- */
  const argc=(name,args,min,max)=>{ if(args.length<min||args.length>max){ if(max===min) throw E("TypeError",name+"() takes exactly "+(min===1?"one argument":min+" arguments")+" ("+args.length+" given)"); throw E("TypeError",name+" expected "+(args.length<min?"at least "+min:"at most "+max)+" argument"+((args.length<min?min:max)===1?"":"s")+", got "+args.length); } };
  function toInt(v,base){
    if(base!=null){ if(typeof v!=="string") throw E("TypeError","int() can't convert non-string with explicit base"); const b=Number(toBig(base)); const s=v.trim().replace(/_/g,"").toLowerCase().replace(b===2?/^0b/:b===8?/^0o/:b===16?/^0x/:/^$/,""); const digits="0123456789abcdefghijklmnopqrstuvwxyz".slice(0,b);
      const neg=s.startsWith("-"); const body=s.replace(/^[+-]/,""); if(!body||[...body].some(c=>!digits.includes(c))) throw E("ValueError","invalid literal for int() with base "+b+": "+strRepr(v));
      let r=0n; for(const c of body) r=r*BigInt(b)+BigInt(digits.indexOf(c)); return neg?-r:r; }
    if(typeof v==="bigint") return v; if(typeof v==="boolean") return v?1n:0n;
    if(typeof v==="number"){ if(!Number.isFinite(v)) throw E(Number.isNaN(v)?"ValueError":"OverflowError",Number.isNaN(v)?"cannot convert float NaN to integer":"cannot convert float infinity to integer"); return BigInt(Math.trunc(v)); }
    if(typeof v==="string"){ const s=v.trim(); if(/^[+-]?\d+(_\d+)*$/.test(s)) return BigInt(s.replace(/_/g,"")); throw E("ValueError","invalid literal for int() with base 10: "+strRepr(v)); }
    throw E("TypeError","int() argument must be a string, a bytes-like object or a real number, not '"+tname(v)+"'");
  }
  function toFloat(v){
    if(typeof v==="number") return v; if(isInt(v)) return Number(toBig(v));
    if(typeof v==="string"){ const s=v.trim().toLowerCase().replace(/_/g,""); if(/^[+-]?(\d+\.?\d*|\.\d+)(e[+-]?\d+)?$/.test(s)) return Number(s); if(/^[+-]?(inf|infinity)$/.test(s)) return s.startsWith("-")?-Infinity:Infinity; if(/^[+-]?nan$/.test(s)) return NaN; throw E("ValueError","could not convert string to float: "+strRepr(v)); }
    throw E("TypeError","float() argument must be a string or a real number, not '"+tname(v)+"'");
  }
  function pyRound(x,nd){
    if(isInt(x)){ if(nd==null||toBig(nd)>=0n) return toBig(x); const p=10n**(-toBig(nd)); const q=toBig(x); const r=modBig(q,p); let d=q-r; if(r*2n>p||(r*2n===p&&(d/p)%2n!==0n)) d+=p; return d; }
    if(typeof x!=="number") throw E("TypeError","type "+tname(x)+" doesn't define __round__ method");
    const n=nd==null?0:Number(toBig(nd));
    if(!Number.isFinite(x)){ if(nd==null) throw E(Number.isNaN(x)?"ValueError":"OverflowError",Number.isNaN(x)?"cannot convert float NaN to integer":"cannot convert float infinity to integer"); return x; }
    let r;
    if(n>=0&&n<=20){
      const exact=Math.abs(x).toFixed(Math.min(100,n+60)); const dot=exact.indexOf("."); const tail=exact.slice(dot+1+n);
      const fixed=Math.abs(x).toFixed(n);
      if(/^50*$/.test(tail)){ const down=exact.slice(0,dot+1+n).replace(/\.$/,""); const lastDigit=Number(down.replace(".","").slice(-1)); r=lastDigit%2===0?Number(down):Number(fixed); }
      else r=Number(fixed);
      r=x<0?-r:r;
    } else { const p=Math.pow(10,n); r=Math.round(x*p)/p; }
    return nd==null?BigInt(Math.round(r)===r?r:Math.trunc(r)):r;
  }
  function minmax(name,args,kw){
    const key=kw.key||null, def=("default" in kw)?kw.default:undefined;
    let items=args.length===1?toArray(args[0]):args;
    if(!args.length) throw E("TypeError",name+" expected at least 1 argument, got 0");
    if(!items.length){ if(def!==undefined) return def; throw E("ValueError",name+"() iterable argument is empty"); }
    let best=items[0], bk=key?callValue(key,[best],{}):best;
    for(const x of items.slice(1)){ const k=key?callValue(key,[x],{}):x; if(name==="max"?lt(bk,k,"<"):lt(k,bk,"<")){ best=x; bk=k; } }
    return best;
  }
  function sortList(arr,key,reverse){
    const keys=arr.map(x=>key?callValue(key,[x],{}):x);
    const idx=arr.map((_,i)=>i);
    idx.sort((i,j)=>{ const a=keys[i], b=keys[j]; if(reverse){ if(lt(b,a,"<")) return -1; if(lt(a,b,"<")) return 1; return i-j; } if(lt(a,b,"<")) return -1; if(lt(b,a,"<")) return 1; return i-j; });
    return idx.map(i=>arr[i]);
  }
  const T_int=new PyType("int",(a,kw)=>{ if(!a.length) return 0n; return toInt(a[0],a[1]); });
  const T_float=new PyType("float",a=>a.length?toFloat(a[0]):0);
  const T_str=new PyType("str",a=>a.length?pyStr(a[0]):"");
  const T_bool=new PyType("bool",a=>a.length?truthy(a[0]):false);
  const T_list=new PyType("list",a=>new PyList(a.length?toArray(a[0]):[]));
  const T_tuple=new PyType("tuple",a=>new PyTuple(a.length?toArray(a[0]):[]));
  const T_range=new PyType("range",a=>{
    argc("range",a,1,3); a.forEach(x=>{ if(!isInt(x)) throw E("TypeError","'"+tname(x)+"' object cannot be interpreted as an integer"); });
    const v=a.map(toBig); const r=a.length===1?new PyRange(0n,v[0],1n):new PyRange(v[0],v[1],a.length===3?v[2]:1n);
    if(r.s===0n) throw E("ValueError","range() arg 3 must not be zero"); return r; });
  const T_type=new PyType("type",a=>{ argc("type",a,1,1); return typeOf(a[0]); });
  const TYPES={int:T_int,float:T_float,str:T_str,bool:T_bool,list:T_list,tuple:T_tuple,range:T_range,NoneType:new PyType("NoneType",()=>null),function:new PyType("function"),type:T_type,builtin_function_or_method:new PyType("builtin_function_or_method")};
  const typeOf=v=>TYPES[tname(v)]||new PyType(tname(v));
  const B={
    print:(a,kw)=>{ let sep=" ", end="\n";
      for(const k in kw){ if(k!=="sep"&&k!=="end") throw E("TypeError","print() got an unexpected keyword argument '"+k+"'"); }
      if("sep" in kw){ if(kw.sep!==null&&typeof kw.sep!=="string") throw E("TypeError","sep must be None or a string, not "+tname(kw.sep)); if(kw.sep!==null) sep=kw.sep; }
      if("end" in kw){ if(kw.end!==null&&typeof kw.end!=="string") throw E("TypeError","end must be None or a string, not "+tname(kw.end)); if(kw.end!==null) end=kw.end; }
      write(a.map(pyStr).join(sep)+end); return null; },
    input:(a)=>{ argc("input",a,0,1); if(a.length) write(pyStr(a[0])); if(!inputs.length) throw E("EOFError","EOF when reading a line"); const v=inputs.shift(); write(v+"\n"); return v; },
    len:(a)=>{ argc("len",a,1,1); const v=a[0]; if(typeof v==="string") return BigInt(Array.from(v).length); if(v instanceof PyList||v instanceof PyTuple) return BigInt(v.items.length); if(v instanceof PyRange) return rangeLen(v); throw E("TypeError","object of type '"+tname(v)+"' has no len()"); },
    abs:(a)=>{ argc("abs",a,1,1); const v=a[0]; if(isInt(v)){ const x=toBig(v); return x<0n?-x:x; } if(typeof v==="number") return Math.abs(v); throw E("TypeError","bad operand type for abs(): '"+tname(v)+"'"); },
    min:(a,kw)=>minmax("min",a,kw), max:(a,kw)=>minmax("max",a,kw),
    sum:(a)=>{ argc("sum",a,1,2); let s=a.length>1?a[1]:0n; if(typeof s==="string") throw E("TypeError","sum() can't sum strings [use ''.join(seq) instead]"); for(const x of iterate(a[0])){ tick(); s=binop("+",s,x); } return s; },
    round:(a)=>{ argc("round",a,1,2); return pyRound(a[0],a.length>1&&a[1]!==null?a[1]:null); },
    sorted:(a,kw)=>{ argc("sorted",a,1,1); return new PyList(sortList(toArray(a[0]),kw.key||null,truthy(kw.reverse||false))); },
    reversed:(a)=>{ argc("reversed",a,1,1); return new PyList(toArray(a[0]).reverse()); },
    enumerate:(a,kw)=>{ argc("enumerate",a,1,2); let i=a.length>1?toBig(a[1]):("start" in kw?toBig(kw.start):0n); return new PyList(toArray(a[0]).map(x=>new PyTuple([i++,x]))); },
    divmod:(a)=>{ argc("divmod",a,2,2); return new PyTuple([binop("//",a[0],a[1]),binop("%",a[0],a[1])]); },
    pow:(a)=>{ argc("pow",a,2,3); if(a.length===3) return modBig(toBig(a[0])**toBig(a[1]),toBig(a[2])); return binop("**",a[0],a[1]); },
    ord:(a)=>{ argc("ord",a,1,1); if(typeof a[0]!=="string"||Array.from(a[0]).length!==1) throw E("TypeError","ord() expected a character, but string of length "+(typeof a[0]==="string"?Array.from(a[0]).length:0)+" found"); return BigInt(a[0].codePointAt(0)); },
    chr:(a)=>{ argc("chr",a,1,1); return String.fromCodePoint(Number(toBig(a[0]))); },
    bin:(a)=>{ const x=toBig(a[0]); return (x<0n?"-0b":"0b")+(x<0n?-x:x).toString(2); },
    oct:(a)=>{ const x=toBig(a[0]); return (x<0n?"-0o":"0o")+(x<0n?-x:x).toString(8); },
    hex:(a)=>{ const x=toBig(a[0]); return (x<0n?"-0x":"0x")+(x<0n?-x:x).toString(16); },
    map:(a)=>{ if(a.length<2) throw E("TypeError","map() must have at least two arguments."); const its=a.slice(1).map(toArray); const n=Math.min(...its.map(x=>x.length)); const r=[]; for(let i=0;i<n;i++) r.push(callValue(a[0],its.map(x=>x[i]),{})); return new PyList(r); },
    zip:(a)=>{ const its=a.map(toArray); const n=its.length?Math.min(...its.map(x=>x.length)):0; const r=[]; for(let i=0;i<n;i++) r.push(new PyTuple(its.map(x=>x[i]))); return new PyList(r); },
    isinstance:(a)=>{ argc("isinstance",a,2,2); const ts=a[1] instanceof PyTuple?a[1].items:[a[1]]; return ts.some(t=>t===typeOf(a[0])||(t===T_int&&typeof a[0]==="boolean")); },
  };
  const builtins=new Map(Object.entries(B).map(([k,f])=>[k,new PyBuiltin(k,f)]));
  for(const t of [T_int,T_float,T_str,T_bool,T_list,T_tuple,T_range,T_type]) builtins.set(t.name,t);

  /* --- методы строк и списков --- */
  function strMethod(s,name){
    const need=(a,n,m)=>argc(name,a,n,m==null?n:m);
    const reqStr=(v,i)=>{ if(typeof v!=="string") throw E("TypeError","must be str, not "+tname(v)); return v; };
    const M={
      upper:a=>(need(a,0),s.toUpperCase()), lower:a=>(need(a,0),s.toLowerCase()),
      capitalize:a=>s.charAt(0).toUpperCase()+s.slice(1).toLowerCase(),
      title:a=>s.toLowerCase().replace(/(^|[^A-Za-zА-Яа-яЁё])([A-Za-zА-Яа-яЁё])/g,(m,p,c)=>p+c.toUpperCase()),
      strip:a=>a.length&&a[0]!==null?s.replace(new RegExp("^["+esc_re(a[0])+"]+|["+esc_re(a[0])+"]+$","g"),""):s.replace(/^\s+|\s+$/g,""),
      lstrip:a=>a.length&&a[0]!==null?s.replace(new RegExp("^["+esc_re(a[0])+"]+"),""):s.replace(/^\s+/,""),
      rstrip:a=>a.length&&a[0]!==null?s.replace(new RegExp("["+esc_re(a[0])+"]+$"),""):s.replace(/\s+$/,""),
      count:a=>{ need(a,1,3); const sub=reqStr(a[0]); const t=slice(s,{lo:a[1]??null,hi:a[2]??null,st:null}); if(sub==="") return BigInt(Array.from(t).length+1); return BigInt(t.split(sub).length-1); },
      find:a=>{ need(a,1,3); const sub=reqStr(a[0]); const st=a.length>1?Number(toBig(a[1])):0; const i=s.indexOf(sub,st<0?Math.max(0,s.length+st):st); return BigInt(i); },
      rfind:a=>BigInt(s.lastIndexOf(reqStr(a[0]))),
      index:a=>{ const i=s.indexOf(reqStr(a[0])); if(i<0) throw E("ValueError","substring not found"); return BigInt(i); },
      replace:a=>{ need(a,2,3); const o=reqStr(a[0]), n=reqStr(a[1]); let c=a.length>2?Number(toBig(a[2])):-1; if(c<0) return s.split(o).join(n); let r=s; let out="", rest=s; while(c-->0){ const i=rest.indexOf(o); if(i<0) break; out+=rest.slice(0,i)+n; rest=rest.slice(i+o.length); if(o==="") { out+=rest.charAt(0); rest=rest.slice(1); } } return out+rest; },
      split:(a,kw)=>{ const sep=a.length&&a[0]!==null?a[0]:("sep" in kw?kw.sep:null); const mx=a.length>1?Number(toBig(a[1])):-1;
        if(sep===null){ const parts=s.trim().split(/\s+/).filter(x=>x!==""); if(mx>=0&&parts.length>mx+1){ const re=/\S+/g; let m, cnt=0, res=[]; while((m=re.exec(s))&&cnt<mx){ res.push(m[0]); cnt++; } res.push(s.slice(re.lastIndex).replace(/^\s+/,"")); return new PyList(res.filter(x=>x!=="")); } return new PyList(parts); }
        reqStr(sep); if(sep==="") throw E("ValueError","empty separator"); const parts=s.split(sep); if(mx>=0&&parts.length>mx+1) return new PyList([...parts.slice(0,mx),parts.slice(mx).join(sep)]); return new PyList(parts); },
      join:a=>{ need(a,1); const items=toArray(a[0]); items.forEach((x,i)=>{ if(typeof x!=="string") throw E("TypeError","sequence item "+i+": expected str instance, "+tname(x)+" found"); }); return items.join(s); },
      startswith:a=>s.startsWith(reqStr(a[0])), endswith:a=>s.endsWith(reqStr(a[0])),
      isdigit:a=>s.length>0&&/^\d+$/.test(s), isalpha:a=>s.length>0&&/^[A-Za-zА-Яа-яЁё]+$/.test(s),
      isalnum:a=>s.length>0&&/^[A-Za-zА-Яа-яЁё0-9]+$/.test(s),
      isupper:a=>/[A-Za-zА-Яа-яЁё]/.test(s)&&s===s.toUpperCase(), islower:a=>/[A-Za-zА-Яа-яЁё]/.test(s)&&s===s.toLowerCase(),
      isspace:a=>s.length>0&&/^\s+$/.test(s),
      zfill:a=>{ const w=Number(toBig(a[0])); const neg=/^[+-]/.test(s); const body=neg?s.slice(1):s; return (neg?s[0]:"")+body.padStart(w-(neg?1:0),"0"); },
      center:a=>{ const w=Number(toBig(a[0])), f=a[1]||" "; const pad=w-s.length; if(pad<=0) return s; const l=Math.floor(pad/2)+(pad%2&&w%2?1:0); return f.repeat(l)+s+f.repeat(pad-l); },
      ljust:a=>s.padEnd(Number(toBig(a[0])),a[1]||" "), rjust:a=>s.padStart(Number(toBig(a[0])),a[1]||" "),
      format:(a)=>{ let i=0; return s.replace(/\{(\d*)\}/g,(m,n)=>pyStr(a[n===""?i++:Number(n)])); },
    };
    if(!M[name]) throw E("AttributeError","'str' object has no attribute '"+name+"'");
    return new PyMethod(s,name,M[name]);
  }
  function esc_re(chars){ return String(chars).replace(/[\\\]\[^-]/g,"\\$&"); }
  function listMethod(l,name){
    const it=l.items;
    const M={
      append:a=>{ argc("list.append",a,1,1); it.push(a[0]); return null; },
      extend:a=>{ it.push(...toArray(a[0])); return null; },
      insert:a=>{ if(a.length!==2) throw E("TypeError","insert expected 2 arguments, got "+a.length); let i=Number(toBig(a[0])); if(i<0) i=Math.max(0,it.length+i); it.splice(Math.min(i,it.length),0,a[1]); return null; },
      remove:a=>{ const i=it.findIndex(v=>eq(v,a[0])); if(i<0) throw E("ValueError","list.remove(x): x not in list"); it.splice(i,1); return null; },
      pop:a=>{ if(!it.length) throw E("IndexError","pop from empty list"); let i=a.length?Number(toBig(a[0])):it.length-1; if(i<0) i+=it.length; if(i<0||i>=it.length) throw E("IndexError","pop index out of range"); return it.splice(i,1)[0]; },
      index:a=>{ const i=it.findIndex(v=>eq(v,a[0])); if(i<0) throw E("ValueError",pyRepr(a[0])+" is not in list"); return BigInt(i); },
      count:a=>BigInt(it.filter(v=>eq(v,a[0])).length),
      sort:(a,kw)=>{ const s=sortList(it,kw.key||null,truthy(kw.reverse||false)); it.splice(0,it.length,...s); return null; },
      reverse:a=>{ it.reverse(); return null; },
      copy:a=>new PyList(it.slice()), clear:a=>{ it.length=0; return null; },
    };
    if(!M[name]) throw E("AttributeError","'list' object has no attribute '"+name+"'");
    return new PyMethod(l,name,M[name]);
  }
  function getAttr(obj,name){
    if(typeof obj==="string") return strMethod(obj,name);
    if(obj instanceof PyList) return listMethod(obj,name);
    if(obj instanceof PyTuple){ if(name==="count") return new PyMethod(obj,name,a=>BigInt(obj.items.filter(v=>eq(v,a[0])).length)); if(name==="index") return new PyMethod(obj,name,a=>{ const i=obj.items.findIndex(v=>eq(v,a[0])); if(i<0) throw E("ValueError","tuple.index(x): x not in tuple"); return BigInt(i); }); }
    if(typeof obj==="number"&&name==="is_integer") return new PyMethod(obj,name,()=>Number.isInteger(obj));
    throw E("AttributeError","'"+tname(obj)+"' object has no attribute '"+name+"'");
  }

  /* --- вызов функций --- */
  function callValue(f,args,kw){
    if(f instanceof PyBuiltin||f instanceof PyMethod) return f.fn(args,kw);
    if(f instanceof PyType){ if(!f.call) throw E("TypeError","cannot create '"+f.name+"' instances"); return f.call(args,kw); }
    if(f instanceof PyFunc) return callFunc(f,args,kw);
    throw E("TypeError","'"+tname(f)+"' object is not callable");
  }
  function callFunc(f,args,kw){
    const d=f.def, frame={vars:new Map(),locals:d.locals,globals:d.globalsDecl,parent:f.closure};
    const ps=d.params;
    if(args.length>ps.length){ const nreq=ps.filter(p=>!p.defVal).length; const takes=nreq===ps.length?String(ps.length):"from "+nreq+" to "+ps.length; throw E("TypeError",d.name+"() takes "+takes+" positional argument"+(ps.length===1&&nreq===ps.length?"":"s")+" but "+args.length+" "+(args.length===1?"was":"were")+" given"); }
    ps.forEach((p,i)=>{ if(i<args.length) frame.vars.set(p.name,args[i]); });
    for(const k in kw){ if(!ps.some(p=>p.name===k)) throw E("TypeError",d.name+"() got an unexpected keyword argument '"+k+"'"); if(frame.vars.has(k)) throw E("TypeError",d.name+"() got multiple values for argument '"+k+"'"); frame.vars.set(k,kw[k]); }
    const missing=ps.filter(p=>!frame.vars.has(p.name)&&!p.defVal).map(p=>p.name);
    if(missing.length){ const names=missing.map(n=>"'"+n+"'"); const list=names.length===1?names[0]:names.length===2?names[0]+" and "+names[1]:names.slice(0,-1).join(", ")+", and "+names[names.length-1]; throw E("TypeError",d.name+"() missing "+missing.length+" required positional argument"+(missing.length>1?"s":"")+": "+list); }
    ps.forEach(p=>{ if(!frame.vars.has(p.name)) frame.vars.set(p.name,p.defVal.v); });
    if(++depth>LIMIT_DEPTH){ depth=0; throw E("RecursionError","maximum recursion depth exceeded"); }
    try{ execBlock(d.body,frame); return null; }
    catch(e){ if(e instanceof ReturnSig) return e.v; throw e; }
    finally{ depth--; }
  }

  /* --- переменные --- */
  const globals=new Map();
  function lookup(name,frame){
    for(let f=frame;f;f=f.parent){
      if(f.globals&&f.globals.has(name)) break;
      if(f.locals&&f.locals.has(name)){ if(f.vars.has(name)) return f.vars.get(name); if(f===frame) throw E("UnboundLocalError","cannot access local variable '"+name+"' where it is not associated with a value"); throw E("NameError","cannot access free variable '"+name+"' where it is not associated with a value in enclosing scope"); }
    }
    if(globals.has(name)) return globals.get(name);
    if(builtins.has(name)) return builtins.get(name);
    throw E("NameError","name '"+name+"' is not defined");
  }
  function assignName(name,v,frame){ if(frame&&frame.locals.has(name)&&!(frame.globals&&frame.globals.has(name))) frame.vars.set(name,v); else globals.set(name,v); }
  function assign(t,v,frame){
    if(t.k==="name") return assignName(t.id,v,frame);
    if(t.k==="sub"){ const obj=ev(t.obj,frame), idx=ev(t.idx,frame); if(idx&&idx.k==="sliceval"){ if(!(obj instanceof PyList)) throw E("TypeError","'"+tname(obj)+"' object does not support item assignment"); const ids=sliceIdx(idx,obj.items.length); const vals=toArray(v); if(idx.st===null||idx.st===1n){ const lo=ids.length?ids[0]:Math.max(0,Math.min(obj.items.length,idx.lo===null?0:Number(toBig(idx.lo))<0?obj.items.length+Number(toBig(idx.lo)):Number(toBig(idx.lo)))); obj.items.splice(lo,ids.length,...vals); } else { if(vals.length!==ids.length) throw E("ValueError","attempt to assign sequence of size "+vals.length+" to extended slice of size "+ids.length); ids.forEach((i,k)=>obj.items[i]=vals[k]); } return; } return setIndex(obj,idx,v); }
    if(t.k==="tuple"||t.k==="list"){
      if(!(typeof v==="string"||v instanceof PyList||v instanceof PyTuple||v instanceof PyRange)) throw E("TypeError","cannot unpack non-iterable "+tname(v)+" object");
      const vals=toArray(v);
      if(vals.length<t.items.length) throw E("ValueError","not enough values to unpack (expected "+t.items.length+", got "+vals.length+")");
      if(vals.length>t.items.length) throw E("ValueError","too many values to unpack (expected "+t.items.length+")");
      t.items.forEach((x,i)=>assign(x,vals[i],frame)); return;
    }
  }

  /* --- выражения --- */
  function ev(n,frame){
    switch(n.k){
      case "const": return n.v;
      case "name": return lookup(n.id,frame);
      case "fstr": return n.parts.map(x=>x.lit!=null?x.lit:format(ev(x.e,frame),x.spec)).join("");
      case "bin": return binop(n.op,ev(n.a,frame),ev(n.b,frame));
      case "unary": { const v=ev(n.e,frame); if(n.op==="-"){ if(isInt(v)) return -toBig(v); if(typeof v==="number") return -v; throw E("TypeError","bad operand type for unary -: '"+tname(v)+"'"); } if(!isNum(v)) throw E("TypeError","bad operand type for unary +: '"+tname(v)+"'"); return isInt(v)?toBig(v):v; }
      case "not": return !truthy(ev(n.e,frame));
      case "bool": { const a=ev(n.a,frame); if(n.op==="and") return truthy(a)?ev(n.b,frame):a; return truthy(a)?a:ev(n.b,frame); }
      case "cmp": { let a=ev(n.first,frame); for(let i=0;i<n.ops.length;i++){ const b=ev(n.rest[i],frame); if(!compare(n.ops[i],a,b)) return false; a=b; } return true; }
      case "ifexp": return truthy(ev(n.test,frame))?ev(n.body,frame):ev(n.orelse,frame);
      case "call": { const f=ev(n.f,frame); const args=n.args.map(a=>ev(a,frame)); const kw={}; n.kwargs.forEach(k=>kw[k.name]=ev(k.v,frame)); return callValue(f,args,kw); }
      case "sub": return index(ev(n.obj,frame),ev(n.idx,frame));
      case "slice": return {k:"sliceval",lo:n.lo?ev(n.lo,frame):null,hi:n.hi?ev(n.hi,frame):null,st:n.st?ev(n.st,frame):null};
      case "attr": return getAttr(ev(n.obj,frame),n.name);
      case "list": return new PyList(n.items.map(x=>ev(x,frame)));
      case "tuple": return new PyTuple(n.items.map(x=>ev(x,frame)));
      case "listcomp": { const res=[]; const inner={vars:new Map(),locals:new Set(names(n.target)),globals:null,parent:frame}; for(const x of iterate(ev(n.iter,frame))){ tick(); assign(n.target,x,inner); if(n.conds.every(c=>truthy(ev(c,inner)))) res.push(ev(n.e,inner)); } return new PyList(res); }
    }
    throw E("SyntaxError","invalid syntax");
  }
  function names(t){ return t.k==="name"?[t.id]:t.k==="tuple"||t.k==="list"?t.items.flatMap(names):[]; }

  /* --- инструкции --- */
  function execBlock(body,frame){ for(const s of body) exec(s,frame); }
  function exec(s,frame){
    tick(); curLine=s.line;
    try{
      switch(s.k){
        case "expr": ev(s.e,frame); return;
        case "assign": { const v=ev(s.value,frame); s.targets.forEach(t=>assign(t,v,frame)); return; }
        case "aug": { const cur=ev(s.target,frame), rhs=ev(s.value,frame);
          if(s.op==="+"&&cur instanceof PyList){ cur.items.push(...toArray(rhs)); assign(s.target,cur,frame); return; }
          assign(s.target,binop(s.op,cur,rhs,true),frame); return; }
        case "pass": case "global": return;
        case "break": throw new BreakSig(); case "continue": throw new ContinueSig();
        case "return": throw new ReturnSig(s.v?ev(s.v,frame):null);
        case "if": if(truthy(ev(s.test,frame))) execBlock(s.body,frame); else execBlock(s.orelse,frame); return;
        case "while": while(truthy(ev(s.test,frame))){ curLine=s.line; tick(); try{ execBlock(s.body,frame); }catch(e){ if(e instanceof BreakSig) break; if(e instanceof ContinueSig) continue; throw e; } curLine=s.line; } return;
        case "for": { const it=iterate(ev(s.iter,frame)); for(const x of it){ tick(); assign(s.target,x,frame); try{ execBlock(s.body,frame); }catch(e){ if(e instanceof BreakSig) break; if(e instanceof ContinueSig) continue; throw e; } } return; }
        case "def": { const d=s; if(!d.locals){ d.locals=collectLocals(d); d.globalsDecl=collectGlobals(d.body); } d.params.forEach(p=>{ p.defVal=p.def?{v:ev(p.def,frame)}:null; }); assignName(d.name,new PyFunc(d,frame),frame); return; }
      }
    }catch(e){ if(e instanceof PyErr&&e.line==null) e.line=s.line; throw e; }
  }
  function collectGlobals(body){ const g=new Set(); const walk=b=>b.forEach(s=>{ if(s.k==="global") s.names.forEach(n=>g.add(n)); if(s.body&&s.k!=="def") walk(s.body); if(s.orelse) walk(s.orelse); }); walk(body); return g; }
  function collectLocals(d){
    const L=new Set(d.params.map(p=>p.name)), g=collectGlobals(d.body);
    const walk=b=>b.forEach(s=>{
      if(s.k==="assign") s.targets.forEach(t=>names(t).forEach(n=>L.add(n)));
      if(s.k==="aug"&&s.target.k==="name") L.add(s.target.id);
      if(s.k==="for") names(s.target).forEach(n=>L.add(n));
      if(s.k==="def"){ L.add(s.name); return; }
      if(s.body) walk(s.body); if(s.orelse) walk(s.orelse);
    });
    walk(d.body); g.forEach(n=>L.delete(n)); return L;
  }

  try{
    const prog=parse(code);
    execBlock(prog,null);
  }catch(e){
    if(e instanceof PyErr) return {out:out.join(""),err:e};
    if(e instanceof RangeError) return {out:out.join(""),err:new PyErr("RecursionError","maximum recursion depth exceeded",curLine)};
    return {out:out.join(""),err:new PyErr("SyntaxError","invalid syntax",curLine)};
  }
  return {out:out.join(""),err:null};
}

/* ---------- подсветка ---------- */
function esc(s){ return s.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;"); }
const HL_KW=new Set(["if","else","elif","for","while","in","def","return","and","or","not","True","False","None","import","from","break","continue","pass","global","is","lambda"]);
const BI=new Set(["print","input","int","str","float","bool","len","range","sum","min","max","abs","round","type","list","sorted","reversed","enumerate","divmod","ord","chr","bin","pow","tuple","isinstance"]);
function hl(line){
  const m=line.match(/^( *)/)[1].length; let html="";
  const full=Math.floor(m/4); for(let i=0;i<full;i++) html+='<span class="ind">    </span>';
  let rest=line.slice(full*4);
  const re=/(#.*$)|([fF]?"[^"]*"?|[fF]?'[^']*'?)|(\b\d+(?:\.\d+)?\b)|([A-Za-zА-Яа-яЁё_][\wА-Яа-яЁё]*)|([()\[\]{}])|([^#"'\w()\[\]{}А-Яа-яЁё]+)/g;
  let mm; while((mm=re.exec(rest))){
    if(mm[1]) html+='<span class="t-com">'+esc(mm[1])+'</span>';
    else if(mm[2]) html+='<span class="t-str">'+esc(mm[2])+'</span>';
    else if(mm[3]) html+='<span class="t-num">'+mm[3]+'</span>';
    else if(mm[4]) html+= BI.has(mm[4])?'<span class="t-fn">'+mm[4]+'</span>':HL_KW.has(mm[4])?'<span class="t-kw">'+mm[4]+'</span>':esc(mm[4]);
    else if(mm[5]) html+='<span class="t-par">'+mm[5]+'</span>';
    else html+=esc(mm[6]||mm[0]);
    if(re.lastIndex===mm.index) re.lastIndex++;
  }
  return html;
}
if(typeof module!=="undefined") module.exports={runPy,hl,floatRepr};
