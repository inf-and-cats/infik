/* ИНФиК: мемные достижения и кот, который глючит без занятий.
   Подключать после practice.js. Всё остальное в проекте не меняется: функции урока и Практики
   оборачиваются здесь (finish, prCheck, prSolved, openTask, closeTask, renderTop, renderPath, openStreak). */

/* ---------- пиксельные значки 10×10 (палитра как у иконок уроков) ---------- */
const ACH_SPR = {
 hello:["...WWWW...","..WLLWWW..",".WLLLWWLW.",".WWLLWLLLW","WWWLWWLLWW","WWWWWWWLWW","WLWWWWWWW.",".WLLWWWWW.","..WWWWWW..","...WWWW..."],
 works:[".WWWWWWWW.",".WNNNNNNW.",".WNNNNNLW.",".WNNNNLNW.",".WLNNLNNW.",".WNLLNNNW.",".WWWWWWWW.","LLNNLLNNLL","NNLLNNLLNN","....WW...."],
 hunt:["..WWWW....",".W....W...","W..KK..W..","W.KNNK.W..","W.KKKK.W..",".W.KK.W...","..WWWWLL..","......LLL.",".......LLL","........L."],
 help:[".WWWWWWWW.","WWWWWWWWWW","WWWWKKWWWW","WWWWKKWWWW","WWWWKKWWWW","WWWWWWWWWW","WWWWKKWWWW",".WWWWWWWW.","..WW......",".W........"],
 syntax:[".KK....KK.","KKKK..KKKK","KKKKKKKKKK","KKKKWWKKKK","KKKKWWKKKK","KKKKKKKKKK",".KKKWWKKK.","..KKWKKK..","...KKKK...","....KK...."],
 loop:[".LLLLLLLL.","..W....W..","..WLLLLW..","...WLLW...","....LL....","....WW....","...W..W...","..W.LL.W..","..WLLLLW..",".LLLLLLLL."],
 peek:["..........","..........",".WWW..WWW.","WWNNWWWNNW","WWNNWWWNNW",".WWW..WWW.","NNNNNNNNNN","NPPNPPNPPN","NNNNNNNNNN","PPNPPNPPNP"],
 base:["..LLLLLL..",".LWWWWWWL.",".LLLLLLLL.",".LLLLLLLL.",".NLLLLLLN.",".LNNNNNNL.",".LLLLLLLL.",".NLLLLLLN.",".LNNNNNNL.","..LLLLLL.."],
 kino:["WNWNWNWNW.","NWNWNWNWNW","..........","WWWWWWWWWW","WNNNNNNNNW","WNLNNNNNNW","WNNNLLNNNW","WNNNNNNNNW","WWWWWWWWWW",".........."],
 catdev:["..........",".LP....PL.","LLPP..PPLL","L.PPPPPP.L","L.PNPPNP.L","LLPPPPPPLL","LLPPKKPPLL","..PPPPPP..","...PPPP...",".........."],
 owl:["....LLLL..","...LLL....","..LLL.....","..LLL..W..","..LLL.....","..LLL..W..","...LLL....","....LLLLL.","......LL..","W........."],
 lark:["....LL....",".L..LL..L.","..L....L..","....LL....","...LLLL...","LL.LLLL.LL","..LLLLLL..","..........","WWWWWWWWWW",".........."],
 friday:["LLLLLLLLLL","LKLLLLKLLL",".LLLKLLLL.",".LLLLLLKL.","..LKLLLL..","..LLLLKL..","...LLLL...","...LKLL...","....LL....","....LL...."],
 schrod:["..........","..P....P..","..PP..PP..","..PPPPPP..","LLLLLLLLLL","LNNNNNNNNL",".LLLLLLLL.",".LLLNNLLL.",".LLLLLLLL.",".LLLLLLLL."],
 fix404:["......WWW.",".....WWWWW","....WWKWKW","...WWWWWWW","..WKWKWKW.",".WWWWWWW..","WKWKWWW...","WWWWWW....","WWWWW.....",".WWW......"],
 paw:["..........",".WW....WW.",".WW.WW.WW.","....WW....",".WW....WW.",".WW.KK.WW.","...KKKK...","..KKKKKK..","..KKKKKK..","...K..K..."]
};
const ACH_C = {P:"#8e6bff",L:"#ecf141",W:"#f3f2ff",N:"#262b69",K:"#ff6b9a"};
function pxSvg(rows, cls){ let r=""; const w=rows[0].length;
  rows.forEach((row,y)=>[...row].forEach((c,x)=>{ if(c!==".") r+='<rect x="'+x+'" y="'+y+'" width="1" height="1" fill="'+ACH_C[c]+'"/>'; }));
  return '<svg class="'+(cls||"px")+'" viewBox="0 0 '+w+' '+rows.length+'" shape-rendering="crispEdges" aria-hidden="true">'+r+'</svg>'; }
Object.keys(ACH_SPR).forEach(k=>{ I["px_"+k]=pxSvg(ACH_SPR[k]); });

/* secret: пока не получено, вместо названия «???» */
const ACH = [
 {id:"a_hello", title:"Hello, World!", hint:"Первая решённая задача в Практике", ic:"px_hello"},
 {id:"a_works", title:"Работает — не трогай", hint:"10 задач с первой попытки", ic:"px_works"},
 {id:"a_hunt", title:"Я тебя найду", hint:"3 раза упал на скрытом тесте и всё-таки сдал", ic:"px_hunt"},
 {id:"a_help", title:"print('помогите')", hint:"10 попыток в одной задаче, но не сдался", ic:"px_help"},
 {id:"a_syntax", title:"SyntaxError — моя любовь", hint:"50 синтаксических ошибок за всё время", ic:"px_syntax"},
 {id:"a_loop", title:"Бесконечный цикл", hint:"Программа зависла", ic:"px_loop", secret:true},
 {id:"a_peek", title:"Я просто посмотреть", hint:"Открыл задачу ★★★ и сразу закрыл", ic:"px_peek", secret:true},
 {id:"a_base", title:"Это база", hint:"Пройдены все уроки модуля 1", ic:"px_base"},
 {id:"a_kino", title:"Абсолютное кино", hint:"Босс без единой ошибки · кот получает очки", ic:"px_kino", item:"glasses"},
 {id:"a_catdev", title:"Котик-программист", hint:"7 дней огонька · кот получает бабочку", ic:"px_catdev", item:"bow"},
 {id:"a_owl", title:"Сова", hint:"Решил после полуночи · кот получает колпак", ic:"px_owl", item:"cap"},
 {id:"a_lark", title:"Жаворонок", hint:"Решил до 7 утра", ic:"px_lark"},
 {id:"a_friday", title:"Пятница, вечер, Python", hint:"Решил в пятницу после 20:00", ic:"px_friday"},
 {id:"a_schrod", title:"Кот Шрёдингера", hint:"Спас огонёк в последний час дня", ic:"px_schrod", secret:true},
 {id:"a_404", title:"404: кот не найден", hint:"Довёл кота до 404 и починил", ic:"px_fix404"},
 {id:"a_paw", title:"Не трогай кота", hint:"10 раз подряд тыкнул в кота", ic:"px_paw", secret:true}
];
BADGES.push(...ACH.map(a=>({id:a.id,title:a.title,hint:a.hint,ic:a.ic,secret:a.secret})));
SYNC_KEYS.push("ach","catSt","catAt");
const achS=()=>S.ach||(S.ach={first:0,syn:0});
const achItem=id=>{ const a=ACH.find(x=>x.id===id); return a&&a.item; };

/* выдаём достижение: в S.badges, тост и строка «Новая награда» в окне результата */
let ACH_NEW=[];
function achGive(id){
  if(S.badges[id]) return false;
  S.badges[id]=true; S.newBadge=true; const a=ACH.find(x=>x.id===id); ACH_NEW.push(a);
  save(); haptic("success"); toast("🏆 "+(a.secret?"Секретное достижение: ":"Достижение: ")+a.title);
  return true;
}
function achUnlockRows(){ const rows=ACH_NEW.map(x=>h("div",{class:"unlock"},'<span class="ic">'+I[x.ic]+'</span><div><small>'+(x.secret?"Секретное достижение":"Достижение")+'</small><b>'+esc(x.title)+'</b></div>')); ACH_NEW=[]; return rows; }

/* достижения за время решения */
function achTime(){
  const d=new Date(), hr=d.getHours();
  if(hr<5) achGive("a_owl");
  else if(hr<7) achGive("a_lark");
  if(d.getDay()===5&&hr>=20) achGive("a_friday");
}

/* ---------- кот ----------
   S.catSt — стадия после последнего занятия, S.catAt — день последнего занятия.
   Каждый пропущенный день портит кота на одну стадию: 0 целый, 1 лагает, 2 пиксели, 3 ASCII, 4 — 404.
   Урок или задача чинит одну стадию, задача дня — сразу целиком. */
const CAT_ST=[["Мурчит","целый"],["Лагает","пропущен день"],["Пикселится","пропущено 2 дня"],["Остался код","пропущено 3 дня"],["404: кот не найден","пропало 4+ дня"]];
function daysSince(k){ if(!k) return 0; const [y,m,d]=String(k).split("-").map(Number), n=new Date();
  return Math.round((new Date(n.getFullYear(),n.getMonth(),n.getDate())-new Date(y,m-1,d))/864e5); }
function catStage(){ const at=S.catAt||S.lastDay; if(!at) return 0;
  return Math.max(0,Math.min(4,(S.catSt||0)+Math.max(0,daysSince(at)-1))); }
function catRepair(full){
  const before=catStage(), after=full?0:Math.max(0,before-1);
  S.catSt=after; S.catAt=today();
  if(before===4) S.ach_was404=true;
  if(S.ach_was404&&after===0){ S.ach_was404=false; achGive("a_404"); }
  return [before,after];
}
/* пиксельный кот 64×61: голова слева сверху (x<30, y<26) */
const CAT_PX=[".......................................SSSSAAAA.................",
 ".....................................SSSSSSSAAAAAS..............",
 "......................A............SSSSSSSSSAAAAASSS............",
 "....................AANN..........SSSSSSSSSSSAAAAASSSS..........",
 "..................AAANNNA.........SSSSSSSSSSSAAAAASSSSSS........",
 ".................AAAANNNN........SSSSSSSSSSSSAAAAASSSSSSA.......",
 "..AAAAA....AAAAAAAAANNNNN........SSSSSSSSSSSSSAAAASSSSSSAA......",
 ".NNAAAAAAAAAAAAASAAAAANNNA......SSSSSSSSSSSSSSAAAASSSSSSAAA.....",
 ".NNNNNAAAAASSAAASAAAAAAANA......SSSSSSSSSSSSSSAAAASSSSSSAAAA....",
 ".NNNNNAAAAASAASAAAAAAAAAAA......SSSSSSSSSSSSSSAAAASSSSSSAAAS....",
 ".NNNNAAAAAAAAASAAAAAAAAAAAA.....SSSSSSSSSSSSSSAAAASSSSSSAAASS...",
 ".NNNAAAAAAAAAAAAAANNNNAAAAAA.....SSSSSSLSSSSSSAAASSSSSSSAAASSS..",
 ".NNAAAAAANNNNAAAANWWDNNAASSS.....SSSSLLLSSSSSSAAASSSSSSAAAASSS..",
 ".NNAAAAANWWWNNAAANWWWNNAAASSS.....SLLLLLLSSSSAAAASSSSSSAAAASSSS.",
 ".AAAAAANWWWWNNAAANWWNNAAAAAAAA...LLLLLLLLSSSSAAASSSSSSSAAASSSSS.",
 ".AAAAAANNWDNNNANNNNNAAAAAAASSS.LLLLLLLLLAAASSAAASSSSSSAAAASSSSA.",
 ".AAAAAAAANNNNANNNNNNNNAAAAASSLLLLLLLLLLAAAA......SSSSSAAASSSSAA.",
 "AASSSAAAAAANNNNNNAANNANAAAAALLLLLLLLLLLNNAAA......SSSAAAASSSSAAA",
 "SSSSSAAAANNANAANNNNAANNAAALLLLLLLLLLLLLAAAAA.......SSAAASSSSAAAA",
 "SSSAAAAAAAANANNNAAAAAAAALLLLLLLLLLLLDDLAAAA.........AAAAASSAAAAA",
 "SAAASAAAANNAKNKAAAAAAALLLLLLLLLLLLLLLDLNNAA..........AAAAAAAAAAA",
 "AASSSAAAAAAAKKKAAAAAAALLLLLLLLLLLLLLLDDLAA...........AAAAAAAAAAA",
 ".SSSAAAAAAAAAAAAAAAAAALLLLLLLLLDDLLDLLLLL............AAAAAAAAAAA",
 ".SSSAAAAAAAAAAAAAAAAAALLLLLLLLDDDLLDLLLLL.............AAAAAAAAAA",
 "..SAAAAAAAAAAAAAAAAAAALLLLLLDDDLDLLLLLLLLL............AAAAAAAAAA",
 "..AAAAAAAAAAAAAAAAAAAALLLDLDLDDLLLLLLLLLLL...SSSSS....AAAAAAAAAA",
 "..AAAAAAAAAAAAAAAAAAAAALLLDDDDLLLLLLLLLLLLAASSSNSSS...AAAAAAAAAA",
 "..AAAAAAAAAAAAAAAAAAAAALLLDLLLLLLLLLLLLLLAASSNSNSNN...AAAAAAAAAA",
 "..AAAAAAAAAAAAAAAAAAAALLLLLLLLLLLLLLLLLLAAASSNNSSNNS..AAAAAAAAAA",
 ".AAAAAAAAAAAAAAAAAAAALLLLLLLLLLLLLLLLLAAAAASSNSNNSSS.AAAAAAAAAA.",
 ".AAAAAAAAAAAAAAAAAALLLLLLLLLLLLLLLLLLAAAAAANNSNNNNNS.AAAAAAAAAA.",
 ".AAAAAAAAAAAAAAAAAAAAAAAAALLLLLLLLLAAAAAAAASNSNNNNSSSAAAAAAAAAA.",
 ".AAAAAAAAAAAAAAAAAAAAAAAAAAALLLLLAAAAAAAAAASSSSNSSSSSAAAAAAAAAA.",
 ".AAAAAAAAAAAAAAAAAAAAAAAAANNLLLLAAAAAAAAAAAASSSSSSSSSAAAAAAAAA..",
 ".AAAAAAAAAAAAAAAAAAAAAAAAAAALLAAAAAAAAAAAAAASSSSSSSSSAAAAAAAAA..",
 ".AAAAAAAAAAAAAAAAAAAAAAAAANNLAAAAAAAAAAAAAAASSSSSSSSSAAAAAAAAA..",
 ".AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAASSSSSSSSAAAAAAAA...",
 "..AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAASSSSSSSSAAAAAAAA...",
 "..AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAASSSSSSSSAAAAAAA....",
 "..AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAASSSSSSSAAAAAAA....",
 "..AAAAAAAAAAAAAAAAAAAAAAAAASSAAAAAAAAAAAAAAAAASSSSSSSAAAAAA.....",
 "...AAAAAAAAAAAAAAAAAAAAAASSSNSSSAAAAAAAAAAAAAAASSSSSSAAAAAA.....",
 "...AAAAAAAAAAAAAAAAAAAAASSNSNNSSSAAAAAAAAAAAAAASSSSSAAAAAA......",
 "...AAAAAAAAAAAAAAAAAAAAASSNNSSNSSSSAAAAAAAAAAAAASSSSAAAAAA......",
 "....AAAAAAAAAAAAAAAAAAAASSSSNNNNSSSSAAAAAAAAAAAAASSAAAAAA.......",
 "....AAAAAAAAAAAAAAAAAAAASNNSNNNSSSSSSAAAAAAAAAAAAAAAAAAAA.......",
 ".....AAAAAAAAAAAAAAAAAAASSNSNNNSSSSSSSAAAAAAAAAAAAAAAAAA........",
 ".....AAAAAAAAAAAAAAAAAAASSNNNNSSSSSSSSSAAAAAAAAAAAAAAAA.........",
 "......AAAAAAAAAAAAAAAAAAASNNSSSSSSSSSSSSAAAAAAAAAAAAAAA.........",
 ".......AAAAAAAAAAAAAAAAAAAASSSSSSSSSSSSSSAAAAAAAAAAAAA..........",
 "........AAAAAAAAAAAAAAAAAAAASSSSSSSSSSSSSAAAAAAAAAAAA...........",
 "........AAAAAAAAAAAAAAAAAAAAAAASSSSSSSSSSSAAAAAAAAAA............",
 ".........AAAAAAAAAAAAAAAAAAAAAAAASSSSSSSSSAAAAAAAAA.............",
 "..........AAAAAAAAAAAAAAAAAAAAAAAAAAASSSSAAAAAAAAA..............",
 "...........AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA................",
 ".............AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA.................",
 "..............AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA...................",
 "................AAAAAAAAAAAAAAAAAAAAAAAAAAA.....................",
 "..................AAAAAAAAAAAAAAAAAAAAAAA.......................",
 ".....................AAAAAAAAAAAAAAAAA..........................",
 "........................AAAAAAAAAA.............................."];
const CAT_PAL={N:"#262b69",D:"#512da8",S:"#6f67c9",M:"#8e8ae2",A:"#aba8ec",L:"#ecf141",K:"#ff8fb0",W:"#ffffff"};
const CAT_GREY={N:"#55576f",D:"#7a7b90",S:"#8e8fa3",M:"#a9aabb",A:"#c4c5d2",L:"#dcdcc8",K:"#c9b9be",W:"#f0f0f0"};
/* вещи: rows — значок для шторки, px/at — как они сидят на пиксельном коте */
const CAT_ITEMS={
 glasses:{rows:["NNNNNNNNNNNN","NWNNN..NWNNN","NNNNN..NNNNN",".NNN....NNN."],
   px:["NNNNNNNNNNNNNNNNNN","NWWNNNNNNNNWWNNNNN","NWNNNNNNNNNWNNNNNN","NNNNNNN..NNNNNNNNN",".NNNNN....NNNNNNN."],at:[6,11]},
 cap:{rows:["........WW","......NNWW",".....NPN..","....NPPN..","...NPPPN..","..NPPPPPN.",".NPPPPPPN.","WWWWWWWWWW"],
   px:["........LL.","......NNLL.",".....NPN...","....NPPN...","...NPPPN...","..NPPPPPN..",".NPPPPPPN..","NLNLNLNLNLN"],at:[6,-3]},
 bow:{rows:["KK..KK","KKKKKK","KKNNKK","KKKKKK","KK..KK"],at:[10,23]}
};
const CAT_ASCII={"/":["..#",".#.",".#.","#..","#.."],"\\":["#..",".#.",".#.","..#","..#"],"_":["...","...","...","...","###"],"(":[".#","#.","#.","#.",".#"],")":["#.",".#",".#",".#","#."],"o":["...","###","#.#","###","..."],".":["...","...","...",".#.","..."],">":["#..",".#.","..#",".#.","#.."],"<":["..#",".#.","#..",".#.","..#"],"^":[".#.","#.#","...","...","..."]," ":["...","...","...","...","..."]};
const CAT_SRC={};
/* рисует стадию в маленький canvas и отдаёт data-URL, чтобы картинку можно было вставлять строкой (шапка) */
function catSrc(stage, small, items){
  const key=stage+(small?"s":"b")+(items||[]).join(); if(CAT_SRC[key]) return CAT_SRC[key];
  const W=small?30:64, H=small?26:CAT_PX.length, px=[];
  const cell=(x,y)=>{ const r=CAT_PX[y]; return r&&x<W&&y<H?r[x]||".":"."; };
  for(let y=0;y<H;y++) for(let x=0;x<W;x++){ const ch=cell(x,y); if(ch!==".") px.push([x,y,ch]); }
  let w=W, h=H, bg=null; const out=[];
  if(stage===0){ const pad=small?0:5; h=H+pad; /* сверху запас под колпак */
    px.forEach(p=>out.push([p[0],p[1]+pad,CAT_PAL[p[2]]]));
    (items||[]).forEach(k=>{ const it=CAT_ITEMS[k], r=it.px||it.rows;
      r.forEach((row,y)=>[...row].forEach((c,x)=>{ if(c!==".") out.push([it.at[0]+x,it.at[1]+y+pad,ACH_C[c]]); })); }); }
  else if(stage===1){ const sh=small?(y=>y>=10&&y<14?2:0):(y=>y>=20&&y<26?3:y>=38&&y<42?-2:0); w=W+4;
    px.forEach(p=>out.push([p[0]+sh(p[1])+1,p[1],"#ff6b9a"]));
    px.forEach(p=>out.push([p[0]+sh(p[1])+3,p[1],"#4fd1e8"]));
    px.forEach(p=>out.push([p[0]+sh(p[1])+2,p[1],CAT_PAL[p[2]]])); }
  else if(stage===2){ const k=small?3:4, o=small?1:2; w=Math.ceil(W/k); h=Math.ceil(H/k);
    for(let y=0;y<H;y+=k) for(let x=0;x<W;x+=k){ const ch=cell(x+o,y+o); if(ch!==".") out.push([x/k,y/k,CAT_GREY[ch]]); } }
  else if(stage===3){ bg="#12143f";
    if(small){ w=7; h=9; [[1,3],[3,2],[5,3],[2,5],[4,5],[3,6]].forEach(p=>out.push([p[0],p[1],"#ecf141"])); }
    else { w=40; h=26; [" /\\_/\\ ","( o.o )"," > ^ < "].forEach((line,li)=>{ let cx=2;
      [...line].forEach(ch=>{ const f=CAT_ASCII[ch]||CAT_ASCII[" "]; f.forEach((r,ry)=>[...r].forEach((p,rx)=>{ if(p==="#") out.push([cx+rx,4+li*7+ry,"#ecf141"]); })); cx+=f[0].length+1; }); }); } }
  else { w=18; h=20; const D={"4":["#.#","#.#","###","..#","..#"],"0":["###","#.#","#.#","#.#","###"]}; let cx=3;
    "404".split("").forEach(d=>{ D[d].forEach((r,ry)=>[...r].forEach((p,rx)=>{ if(p==="#") out.push([cx+rx,8+ry,"#6d6f9c"]); })); cx+=4; });
    for(let i=0;i<20;i+=2){ out.push([i,0,"#3b3f8f"],[i,19,"#3b3f8f"],[0,i,"#3b3f8f"],[17,i,"#3b3f8f"]); } }
  let url=CAT;
  try { const c=document.createElement("canvas"); c.width=w; c.height=h; const g=c.getContext("2d");
    if(bg){ g.fillStyle=bg; g.fillRect(0,0,w,h); }
    out.forEach(p=>{ g.fillStyle=p[2]; g.fillRect(p[0],p[1],1,1); }); url=c.toDataURL(); } catch(e){}
  return CAT_SRC[key]=url;
}
/* кот нужной стадии; small — мордочка для шапки и карточки */
function catView(stage, small){
  const box=h("div",{class:"cat cat-s"+stage+(small?" sm":"")});
  const items=stage===0&&!small?ACH.filter(a=>a.item&&S.badges[a.id]).map(a=>a.item):[];
  box.innerHTML='<img class="cat-px" src="'+catSrc(stage,small,items)+'" alt="кот">'+(stage===3&&!small?'<span class="cat-cur"></span>':'');
  return box;
}

/* ---------- обёртки ---------- */
const _runPy=runPy; let ACH_LASTERR=null;
runPy=function(code,inp,opt){ const r=_runPy(code,inp,opt); ACH_LASTERR=r&&r.err?r.err.type:null;
  if(ACH_LASTERR==="TimeoutError") setTimeout(()=>achGive("a_loop"),0); return r; };

const ACH_TRY={}; let ACH_PEEK=null;
const _openTask=openTask;
openTask=function(t,o){ ACH_TRY[t.id]=ACH_TRY[t.id]||{n:0,hidden:0}; ACH_PEEK=t.lvl===3&&!prDone(t.id)?{t0:Date.now(),tried:false}:null; return _openTask(t,o); };
const _closeTask=closeTask;
closeTask=function(){ if(ACH_PEEK&&!ACH_PEEK.tried&&Date.now()-ACH_PEEK.t0<10000) achGive("a_peek"); ACH_PEEK=null; return _closeTask(); };

const _prCheck=prCheck;
prCheck=function(t,code){
  if(ACH_PEEK) ACH_PEEK.tried=true;
  const r=_prCheck(t,code), tr=ACH_TRY[t.id]||(ACH_TRY[t.id]={n:0,hidden:0});
  if(!r.ok){ tr.n++;
    if(ACH_LASTERR==="SyntaxError"){ const a=achS(); a.syn=(a.syn||0)+1; save(); if(a.syn>=50) achGive("a_syntax"); }
    const m=/^Тест (\d+) из/.exec(r.head||""); if(m&&+m[1]>(t.show||1)) tr.hidden++;
  }
  return r;
};
const _prSolved=prSolved;
prSolved=function(t,o){
  ACH_NEW=[];
  const tr=ACH_TRY[t.id]||{n:0,hidden:0}, saveLast=S.lastDay===dayKey(-1)&&new Date().getHours()===23&&(S.streak||0)>0;
  const first=!(S.pr&&S.pr[o&&o.daily!=null?o.key:t.id]);
  catRepair(o&&o.daily!=null);
  achGive("a_hello");
  if(first&&tr.n===0){ const a=achS(); a.first=(a.first||0)+1; if(a.first>=10) achGive("a_works"); }
  if(tr.hidden>=3) achGive("a_hunt");
  if(tr.n>=10) achGive("a_help");
  achTime(); if(saveLast) achGive("a_schrod");
  ACH_TRY[t.id]={n:0,hidden:0};
  const res=_prSolved(t,o);
  if((S.streak||0)>=7) achGive("a_catdev");
  const ok=document.querySelector("#lfoot-in .pr-ok"); if(ok) achUnlockRows().forEach(x=>ok.appendChild(x)); else ACH_NEW=[];
  return res;
};
const _finish=finish;
finish=function(){
  ACH_NEW=[];
  const p=LS.p, clean=LS.mistakes===0, saveLast=S.lastDay===dayKey(-1)&&new Date().getHours()===23&&(S.streak||0)>0;
  catRepair(false);
  if(p.boss&&clean) achGive("a_kino");
  achTime(); if(saveLast) achGive("a_schrod");
  const res=_finish();
  if((S.streak||0)>=7) achGive("a_catdev");
  if(COURSE){ const m1=COURSE.sections[0].modules[0]; if(m1&&m1.lessons&&m1.lessons.every(x=>S.done[x.id])) achGive("a_base"); }
  const story=document.querySelector("#lbody .story"); const rows=achUnlockRows(); if(story) rows.forEach(x=>story.before(x));
  return res;
};

/* шапка: пока кот целый — огонёк, иначе мордочка кота в той же стадии */
const _renderTop=renderTop;
renderTop=function(){ const s=_renderTop(), st=catStage(); if(!st) return s;
  return s.replace(I.fire, catView(st,true).outerHTML).replace('class="stat fire','class="stat fire catb'); };

/* «Путь»: карточка только у сломанного кота */
const _renderPath=renderPath;
renderPath=function(app){ const r=_renderPath(app), st=catStage(); if(!st) return r;
  const c=h("button",{class:"cat-card",type:"button"});
  c.appendChild(catView(st,true));
  c.insertAdjacentHTML("beforeend",'<div><b>'+(st===4?"404: кот не найден":st===3?"От кота остался код":st===2?"Кот пикселится":"Кот лагает 👾")+'</b><small>'+(st===4?"Задача дня вернёт его целиком":"Реши одну задачу, чтобы его починить")+'</small></div><span class="go">'+(st===4?"Вернуть":"Починить")+'</span>');
  c.onclick=()=>{ S.tab="practice"; save(); render(); window.scrollTo(0,0); };
  const cd=app.querySelector(".countdown"); if(cd) cd.after(c); else app.prepend(c);
  return r; };

/* шторка «Огонёк» → кот сверху, его вещи снизу */
const _openStreak=openStreak;
openStreak=function(){ const res=_openStreak(), box=document.querySelector(".sheet-wrap:last-child .stk"); if(!box) return res;
  const st=catStage(), top=h("div",{class:"cat-top"});
  const v=catView(st,false); top.appendChild(v);
  top.appendChild(h("div",{class:"cat-mood"},'<b>'+CAT_ST[st][0]+'</b><small>'+(st?"Каждая задача чинит кота на шаг, задача дня — целиком":"Занимайся каждый день, и кот будет целым")+'</small>'));
  let taps=0, tt; v.onclick=()=>{ taps++; clearTimeout(tt); tt=setTimeout(()=>taps=0,1500); v.classList.remove("boop"); void v.offsetWidth; v.classList.add("boop"); if(taps>=10){ taps=0; achGive("a_paw"); } };
  box.prepend(top);
  const items=ACH.filter(a=>a.item), got=items.filter(a=>S.badges[a.id]).length;
  const w=h("div",{class:"cat-items"},'<h3>Вещи кота · '+got+' из '+items.length+'</h3>');
  const row=h("div",{class:"cat-row"});
  items.forEach(a=>row.appendChild(h("div",{class:"cat-it"+(S.badges[a.id]?" on":"")},'<span>'+pxSvg(CAT_ITEMS[a.item].rows,"")+'</span><small>'+(S.badges[a.id]?esc(a.title):"???")+'</small>')));
  w.appendChild(row); box.appendChild(w);
  return res; };

/* в наградах секретные достижения прячем, пока их нет */
const _openRewards=openRewards;
openRewards=function(){ const res=_openRewards();
  document.querySelectorAll(".sheet-wrap:last-child .badges .badge").forEach((el,i)=>{ const b=BADGES[i]; if(b&&b.secret&&!S.badges[b.id]){ el.querySelector("b").textContent="???"; el.querySelector("small").textContent="Секретное достижение"; } });
  return res; };

/* ---------- старые награды тоже пиксельные ---------- */
const OLD_SPR = {
 bug:["..W....W..","...W..W...","...KKKK...","W.KWKKWK.W",".WKKKKKKW.","..KKKKKK..","W.KKKKKK.W",".WKKKKKKW.","...KKKK...",".........."],
 clean:["....LL....","....LL....","...LLLL...","LLLLLLLLLL",".LLLLLLLL.","..LLLLLL..","..LLLLLL..",".LLL..LLL.",".LL....LL.",".........."],
 s3:["..........","....L.....","....LL....","...LLL....","...LLLL...","..LLLLLL..","..LLLLLL..","..LLLLLL..","...LLLL...",".........."],
 s7:["....L.....","....LL....","...LLL..L.","..LLLLL.L.","..LLLLLLL.",".LLLKKLLL.",".LLKKKKLL.",".LLKKKKLL.","..LKKKKL..","...LLLL..."],
 s14:["....K.....","....KK....","...KKK..K.","..KKLKK.K.","..KKLLKKK.",".KKLLLLKK.",".KKLWWLKK.",".KKLWWLKK.","..KLWWLK..","...KKKK..."],
 s30:["L...L...L.","LL.LLL.LL.","LLLLLLLLL.","....K.....","...KKK..K.","..KKLKK.K.",".KKLLLLKK.",".KKLWWLKK.","..KLWWLK..","...KKKK..."],
 boss1:["..........","L...LL...L","LL.LLLL.LL","LLLLLLLLLL","LLKLLLLKLL","LLLLWWLLLL","LLLLLLLLLL","WWWWWWWWWW","..........",".........."],
 daily:["..W....W..",".WWWWWWWW.",".WKKKKKKW.",".WWWWWWWW.",".WWWNNWWW.",".WNNNNNNW.",".WWNNNNWW.",".WWNWWNWW.",".WWWWWWWW.",".........."]
};
if(typeof LESSON_SPR!=="undefined"){ OLD_SPR.first=LESSON_SPR.screen; OLD_SPR.task1=LESSON_SPR.kbd; }
BADGES.forEach(b=>{ if(OLD_SPR[b.id]){ I["px_"+b.id]=pxSvg(OLD_SPR[b.id]); b.ic="px_"+b.id; } });

/* ---------- Практика: пиксельная картинка модуля у каждой задачи ---------- */
function taskArt(need){ const a=(typeof MOD_ART!=="undefined")&&MOD_ART[need]; if(!a) return "";
  let r=""; a.forEach((row,y)=>[...row].forEach((c,x)=>{ if(c!==".") r+='<rect x="'+x+'" y="'+y+'" width="1" height="1" fill="'+MOD_ART_C[c]+'"/>'; }));
  return '<span class="pr-art" aria-hidden="true"><svg viewBox="0 0 16 16" shape-rendering="crispEdges">'+r+'</svg></span>'; }
const _renderPractice=renderPractice;
renderPractice=async function(app){
  const res=await _renderPractice(app);
  if(PRACTICE) app.querySelectorAll(".pr-task").forEach(b=>{ if(b.querySelector(".pr-art")) return;
    const title=(b.querySelector(".pr-tx b")||{}).textContent, t=PRACTICE.tasks.find(x=>x.title===title);
    if(t) b.insertAdjacentHTML("afterbegin",taskArt(t.need)); });
  return res; };
