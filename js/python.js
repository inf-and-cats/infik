/* Мини-Python: print, строки, числа, арифметика. Плюс подсветка синтаксиса. */
/* ---------- tiny Python subset: print() with strings, numbers, + - * / // % ** ---------- */
function PyErr(type,msg,line){ this.type=type; this.msg=msg; this.line=line; }
function tokenize(src, ln){
  const t=[]; let i=0;
  while(i<src.length){
    const c=src[i];
    if(c===" "||c==="\t"){i++;continue}
    if(c==="#") break;
    if(c==='"'||c==="'"){ let j=i+1; while(j<src.length&&src[j]!==c) j++;
      if(j>=src.length) throw new PyErr("SyntaxError","unterminated string literal (detected at line "+ln+")",ln);
      t.push({k:"str",v:src.slice(i+1,j)}); i=j+1; continue; }
    if(/[0-9]/.test(c)){ let m=src.slice(i).match(/^[0-9]+(\.[0-9]+)?/); t.push({k:"num",v:Number(m[0]),f:!!m[1]}); i+=m[0].length; continue; }
    if(/[A-Za-zА-Яа-яЁё_]/.test(c)){ let m=src.slice(i).match(/^[A-Za-zА-Яа-яЁё_0-9]+/); t.push({k:"id",v:m[0]}); i+=m[0].length; continue; }
    const two=src.substr(i,2);
    if(two==="//"||two==="**"){ t.push({k:"op",v:two}); i+=2; continue; }
    if("()+-*/%,=".includes(c)){ t.push({k:"op",v:c}); i++; continue; }
    if("«»“”".includes(c)) throw new PyErr("SyntaxError","invalid character '"+c+"' (U+"+c.charCodeAt(0).toString(16).toUpperCase().padStart(4,"0")+")",ln);
    throw new PyErr("SyntaxError","invalid syntax",ln);
  }
  return t;
}
function fmt(v){ if(v.t==="str") return v.v; if(v.t==="float"){ return Number.isInteger(v.v)? v.v.toFixed(1) : String(v.v); } return String(v.v); }
function tname(v){ return v.t; }
function runPy(code){
  const out=[]; const lines=code.replace(/\t/g,"    ").split("\n");
  try{
    lines.forEach((raw,idx)=>{
      const ln=idx+1; const s=raw.replace(/\s+$/,"");
      if(!s.trim()||s.trim().startsWith("#")) return;
      if(/^\s/.test(s)) throw new PyErr("IndentationError","unexpected indent",ln);
      const T=tokenize(s,ln); let p=0;
      const peek=()=>T[p], next=()=>T[p++];
      const isOp=v=>T[p]&&T[p].k==="op"&&T[p].v===v;
      function atom(){
        const t=next();
        if(!t) throw new PyErr("SyntaxError","invalid syntax",ln);
        if(t.k==="str") return {t:"str",v:t.v};
        if(t.k==="num") return {t:t.f?"float":"int",v:t.v};
        if(t.k==="op"&&t.v==="("){ const v=expr(); if(!isOp(")")) throw new PyErr("SyntaxError","'(' was never closed",ln); p++; return v; }
        if(t.k==="id") throw new PyErr("NameError","name '"+t.v+"' is not defined",ln);
        throw new PyErr("SyntaxError","invalid syntax",ln);
      }
      function factor(){
        if(isOp("-")){ p++; const v=factor(); if(v.t==="str") throw new PyErr("TypeError","bad operand type for unary -: 'str'",ln); return {t:v.t,v:-v.v}; }
        const a=atom();
        if(isOp("**")){ p++; const b=factor(); return arith(a,"**",b); }
        return a;
      }
      function term(){ let a=factor(); while(T[p]&&T[p].k==="op"&&["*","/","//","%"].includes(T[p].v)){ const o=next().v; a=arith(a,o,factor()); } return a; }
      function expr(){ let a=term(); while(isOp("+")||isOp("-")){ const o=next().v; a=arith(a,o,term()); } return a; }
      function arith(a,o,b){
        if(a.t==="str"||b.t==="str"){
          if(o==="+"&&a.t==="str"&&b.t==="str") return {t:"str",v:a.v+b.v};
          if(o==="*"&&((a.t==="str"&&b.t==="int")||(a.t==="int"&&b.t==="str"))){ const s=a.t==="str"?a:b, n=a.t==="str"?b:a; return {t:"str",v:n.v>0?s.v.repeat(n.v):""}; }
          if(o==="+"&&a.t==="str") throw new PyErr("TypeError",'can only concatenate str (not "'+tname(b)+'") to str',ln);
          throw new PyErr("TypeError","unsupported operand type(s) for "+o+": '"+tname(a)+"' and '"+tname(b)+"'",ln);
        }
        const fl=a.t==="float"||b.t==="float";
        if((o==="/"||o==="//"||o==="%")&&b.v===0) throw new PyErr("ZeroDivisionError","division by zero",ln);
        if(o==="+") return {t:fl?"float":"int",v:a.v+b.v};
        if(o==="-") return {t:fl?"float":"int",v:a.v-b.v};
        if(o==="*") return {t:fl?"float":"int",v:a.v*b.v};
        if(o==="/") return {t:"float",v:a.v/b.v};
        if(o==="//") return {t:fl?"float":"int",v:Math.floor(a.v/b.v)};
        if(o==="%") return {t:fl?"float":"int",v:((a.v%b.v)+b.v)%b.v};
        if(o==="**") return {t:fl?"float":"int",v:Math.pow(a.v,b.v)};
      }
      const f=next();
      if(!f) return;
      if(f.k!=="id"){ throw new PyErr("SyntaxError","invalid syntax",ln); }
      if(f.v!=="print"){ if(isOp("(")) throw new PyErr("NameError","name '"+f.v+"' is not defined",ln); throw new PyErr("SyntaxError","invalid syntax",ln); }
      if(!isOp("(")){ throw new PyErr("SyntaxError","Missing parentheses in call to 'print'. Did you mean print(...)?",ln); }
      p++; const args=[]; let sep=" ", end="\n";
      while(!isOp(")")){
        if(!peek()) throw new PyErr("SyntaxError","'(' was never closed",ln);
        if(peek().k==="id"&&T[p+1]&&T[p+1].k==="op"&&T[p+1].v==="="){
          const name=next().v; p++; const v=expr();
          if(name==="sep") sep=fmt(v); else if(name==="end") end=fmt(v);
          else throw new PyErr("TypeError","'"+name+"' is an invalid keyword argument for print()",ln);
        } else args.push(expr());
        if(isOp(",")){ p++; continue; }
        if(!isOp(")")) throw new PyErr("SyntaxError","invalid syntax. Perhaps you forgot a comma?",ln);
      }
      p++;
      if(p<T.length) throw new PyErr("SyntaxError","invalid syntax",ln);
      out.push(args.map(fmt).join(sep)+end);
    });
  }catch(e){
    if(e instanceof PyErr) return {out:out.join(""),err:e};
    return {out:out.join(""),err:new PyErr("SyntaxError","invalid syntax",1)};
  }
  return {out:out.join(""),err:null};
}

/* ---------- highlighting ---------- */
function esc(s){ return s.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;"); }
const KW=new Set(["if","else","elif","for","while","in","def","return","and","or","not","True","False","None","import","from"]);
const BI=new Set(["print","input","int","str","float","len","range","sum","min","max"]);
function hl(line){
  const m=line.match(/^( *)/)[1].length; let html="";
  const full=Math.floor(m/4); for(let i=0;i<full;i++) html+='<span class="ind">    </span>';
  let rest=line.slice(full*4);
  const re=/(#.*$)|("[^"]*"?|'[^']*'?)|(\b\d+(?:\.\d+)?\b)|([A-Za-zА-Яа-яЁё_][\wА-Яа-яЁё]*)|([()\[\]{}])|([^#"'\w()\[\]{}А-Яа-яЁё]+)/g;
  let mm; while((mm=re.exec(rest))){
    if(mm[1]) html+='<span class="t-com">'+esc(mm[1])+'</span>';
    else if(mm[2]) html+='<span class="t-str">'+esc(mm[2])+'</span>';
    else if(mm[3]) html+='<span class="t-num">'+mm[3]+'</span>';
    else if(mm[4]) html+= BI.has(mm[4])?'<span class="t-fn">'+mm[4]+'</span>':KW.has(mm[4])?'<span class="t-kw">'+mm[4]+'</span>':esc(mm[4]);
    else if(mm[5]) html+='<span class="t-par">'+mm[5]+'</span>';
    else html+=esc(mm[6]||mm[0]);
    if(re.lastIndex===mm.index) re.lastIndex++;
  }
  return html;
}

