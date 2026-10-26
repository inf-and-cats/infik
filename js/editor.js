/* Окно IDE: просмотр кода, запуск, ввод блоками и с клавиатуры */
/* IDE window: readonly, optional tap lines, optional run */
function ideView(code,opts){
  opts=opts||{};
  const w=h("div",{class:"ide"});
  const bar=h("div",{class:"ide-bar"},'<span class="dots"><i></i><i></i><i></i></span><span class="file">main.py</span>');
  w.appendChild(bar);
  const body=h("div",{class:"code"}); const gut=h("div",{class:"gut"}); const lines=h("div",{class:"lines"});
  const src=code.split("\n");
  src.forEach((l,i)=>{ gut.appendChild(h("div",null,String(i+1)));
    let html=hl(l).replace("@@BLANK@@",'<span class="blank">?</span>');
    if(l.includes("@@BLANK@@")) html=hl(l.replace("@@BLANK@@","")).replace(/^/,'<span class="blank">?</span>');
    const ln=h("div",{class:"ln"},html||" "); if(opts.onTap){ ln.classList.add("tap"); ln.tabIndex=0; ln.setAttribute("role","button"); ln.addEventListener("click",()=>opts.onTap(i,ln)); ln.addEventListener("keydown",e=>{if(e.key==="Enter"||e.key===" "){e.preventDefault();opts.onTap(i,ln);}}); }
    lines.appendChild(ln); });
  body.append(gut,lines); w.appendChild(body);
  const term=h("div",{class:"term"}); term.hidden=true; w.appendChild(term);
  w.showRun=function(c){ const r=runPy(c==null?code:c); showTerm(term,r); return r; };
  if(opts.run){ const b=h("button",{class:"run",type:"button"},I.play+"Запустить"); b.onclick=()=>w.showRun(); bar.appendChild(b); }
  w.lineEls=[...lines.children];
  return w;
}
function showTerm(term,r){
  term.hidden=false;
  let html='<div class="th">Вывод</div><pre>'+esc(r.out.replace(/\n$/,""))+'</pre>';
  if(r.err) html+='<pre class="err">'+(r.out?"\n":"")+'Строка '+r.err.line+'\n'+esc(r.err.type+": "+r.err.msg)+'</pre>';
  if(!r.out&&!r.err) html+='<pre style="opacity:.6">(пусто)</pre>';
  term.innerHTML=html;
}


/* shared code-entry block: blocks mode or keyboard mode, with toggle */
function joinTokens(ts){ let s=""; ts.forEach((t,i)=>{ if(i>0){ const p=ts[i-1]; if(!(p==="("||t===")"||t===","||t==="("||p==="'"||t==="'")) s+=" "; } s+=t; }); return s; }
function codeEntry(b,st,onChange){
  const host=h("div",{style:"display:flex;flex-direction:column;gap:12px"}); b.appendChild(host);
  const mode=h("div",{class:"mode",role:"group","aria-label":"Способ ввода"});
  const mB=h("button",{type:"button"},I.blocks+"Блоки"), mK=h("button",{type:"button"},I.kbd+"Клавиатура");
  mode.append(mB,mK); host.appendChild(mode);
  const area=h("div",{style:"display:flex;flex-direction:column;gap:12px"}); host.appendChild(area);
  const api={code:"",term:null};
  let lines=[{ind:0,t:[]}], cur=0;
  const bankItems=(st.bank||[]).map((t,i)=>({t,id:i,used:false}));
  function setMode(m){ S.mode=m; save(); mB.setAttribute("aria-pressed",String(m==="blocks")); mK.setAttribute("aria-pressed",String(m==="kbd")); draw(); }
  mB.onclick=()=>{ if(S.mode!=="blocks"){ lines=[{ind:0,t:[]}]; cur=0; bankItems.forEach(x=>x.used=false); setMode("blocks"); } };
  mK.onclick=()=>{ if(S.mode!=="kbd"){ api.code=blocksCode(); setMode("kbd"); } };
  function blocksCode(){ return lines.map(l=>" ".repeat(l.ind*4)+joinTokens(l.t.map(x=>x.t))).join("\n").replace(/\s+$/,""); }
  function shell(){ const w=h("div",{class:"ide"}); const bar=h("div",{class:"ide-bar"},'<span class="dots"><i></i><i></i><i></i></span><span class="file">main.py</span>');
    const run=h("button",{class:"run",type:"button"},I.play+"Запустить"); run.onclick=()=>{ const r=runPy(api.code); showTerm(term,r); }; bar.appendChild(run); w.appendChild(bar);
    const term=h("div",{class:"term"}); term.hidden=true; api.term=term; return {w,term}; }
  function draw(){
    area.innerHTML="";
    const {w,term}=shell();
    if(S.mode==="blocks"){
      const body=h("div",{class:"code"}); const gut=h("div",{class:"gut"}); const ls=h("div",{class:"lines"});
      lines.forEach((l,li)=>{ gut.appendChild(h("div",null,String(li+1)));
        const ln=h("div",{class:"ln tap"+(li===cur?" cur":"")}); ln.onclick=e=>{ if(e.target===ln){ cur=li; draw(); } };
        for(let k=0;k<l.ind;k++) ln.appendChild(h("span",{class:"ind"},"    "));
        l.t.forEach((x,ti)=>{ const c=h("button",{class:"chip ide-chip",type:"button"},hl(x.t)); c.onclick=e=>{ e.stopPropagation(); l.t.splice(ti,1); if(x.id!=null) bankItems[x.id].used=false; cur=li; draw(); }; ln.appendChild(c); });
        if(!l.t.length) ln.appendChild(h("span",{style:"color:var(--ide-dim)"},li===cur?"▌":" "));
        ls.appendChild(ln); });
      body.append(gut,ls); w.appendChild(body); w.appendChild(term); area.appendChild(w);
      const tools=h("div",{class:"btools"});
      const nl=h("button",{class:"tool",type:"button"},"<code>↵</code> Новая строка"); nl.onclick=()=>{ lines.splice(cur+1,0,{ind:lines[cur].ind,t:[]}); cur++; draw(); };
      const tb=h("button",{class:"tool",type:"button"},"<code>⇥</code> Отступ"); tb.onclick=()=>{ lines[cur].ind=lines[cur].ind?0:1; draw(); };
      const del=h("button",{class:"tool",type:"button"},"<code>⌫</code> Стереть"); del.onclick=()=>{ const l=lines[cur]; if(l.t.length){ const x=l.t.pop(); if(x.id!=null) bankItems[x.id].used=false; } else if(lines.length>1){ lines.splice(cur,1); cur=Math.max(0,cur-1); } draw(); };
      tools.append(nl,tb,del); area.appendChild(tools);
      const bank=h("div",{class:"bank"});
      (st.reuse||[]).forEach(t=>{ const c=h("button",{class:"chip",type:"button"},esc(t)); c.onclick=()=>{ lines[cur].t.push({t}); draw(); }; bank.appendChild(c); });
      bankItems.forEach(x=>{ const c=h("button",{class:"chip"+(x.used?" used":""),type:"button"},esc(x.t)); c.onclick=()=>{ x.used=true; lines[cur].t.push(x); draw(); }; bank.appendChild(c); });
      area.appendChild(bank);
      api.code=blocksCode();
    } else {
      const body=h("div",{class:"code"}); const gut=h("div",{class:"gut"}); const ed=h("div",{class:"ed"});
      const pre=h("pre"); const ta=h("textarea",{id:"code-input",spellcheck:"false",autocapitalize:"off",autocomplete:"off",autocorrect:"off","aria-label":"Код программы"});
      const ph=h("div",{class:"ed-ph"},'Пиши код здесь, например print("…")');
      ta.value=api.code;
      function sync(){ api.code=ta.value; const ls=ta.value.split("\n"); pre.innerHTML=ls.map(l=>hl(l)||" ").join("\n")+"\n"; gut.innerHTML=ls.map((_,i)=>"<div>"+(i+1)+"</div>").join(""); ph.hidden=!!ta.value; onChange&&onChange(); }
      function ins(txt){ const s=ta.selectionStart,e=ta.selectionEnd; ta.setRangeText(txt,s,e,"end"); sync(); ta.focus(); }
      ta.addEventListener("input",sync);
      ta.addEventListener("keydown",e=>{
        if(e.key==="Tab"){ e.preventDefault(); if(e.shiftKey){ const s=ta.selectionStart; const ls=ta.value.lastIndexOf("\n",s-1)+1; if(ta.value.substr(ls,4)==="    "){ ta.setRangeText("",ls,ls+4,"preserve"); sync(); } } else ins("    "); }
        else if(e.key==="Enter"){ e.preventDefault(); const s=ta.selectionStart; const ls=ta.value.lastIndexOf("\n",s-1)+1; const line=ta.value.slice(ls,s); let ind=line.match(/^ */)[0]; if(/:\s*$/.test(line)) ind+="    "; ins("\n"+ind); }
      });
      ed.append(pre,ta,ph); body.append(gut,ed); w.appendChild(body);
      const keys=h("div",{class:"keys"});
      [["⇥ Tab","    "],["print","print"],["(","("],[")",")"],['"','"'],[":",":"],[",",","],["=","="]].forEach(([l,v])=>{ const k=h("button",{type:"button"},esc(l)); k.onclick=()=>ins(v); keys.appendChild(k); });
      w.appendChild(keys); w.appendChild(term); area.appendChild(w);
      sync();
    }
    onChange&&onChange();
  }
  setMode(S.mode==="kbd"?"kbd":"blocks");
  api.run=()=>{ const r=runPy(api.code); showTerm(api.term,r); return r; };
  return api;
}
