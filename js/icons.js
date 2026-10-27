/* ИНФиК: пиксельные иконки уроков 10×10. Подключать после core.js и до app.js */
const LESSON_SPR = {
 screen:[".NNNNNNNN.","NWWWWWWWWN","NWPWWWWWWN","NWWPWWWWWN","NWPWWWWWWN","NWWWWPPPWN","NWWWWWWWWN",".NNNNNNNN.","....NN....","..NNNNNN.."],
 quotes:["LL.LL.....","LL.LL.....",".L..L.....","L..L......","..........",".WWWWWWWW.","..........",".....L..L.",".....L..L.","....LL.LL."],
 calc:[".WWWWWWWW.",".WNNNNNNW.",".WNNNNLLW.",".WNNNNNNW.",".WWWWWWWW.",".WNWNWKKW.",".WWWWWWWW.",".WNWNWKKW.",".WWWWWWWW.",".........."],
 sep:["..........","LLL.W.LLL.","LLL...LLL.","..........","........W.","........W.","..W.....W.",".WWWWWWWW.","..W.......",".........."],
 hash:[".WWWWWWWW.","WWWNWWNWWW","WWNNNNNNWW","WWWNWWNWWW","WWNNNNNNWW","WWWNWWNWWW",".WWWWWWWW.","..WW......","..W.......",".........."],
 snake:["...LLLL...","..LNLLNL..","..LLLLLL..","...LLLL...","....KK....","..LL......",".LL.......","..LLLLLL..","......LL..",".LLLLLL..."],
 box:["..........",".WWWWWWWW.",".W......W.",".WWWWWWWW.",".W.LLLL.W.",".W......W.",".W......W.",".W......W.",".WWWWWWWW.",".........."],
 tag:["..........","..LLLLLLL.",".LLLLLLLL.","LLNLWWWWL.","LLLLLLLLL.","LLLLWWWLL.",".LLLLLLLL.","..LLLLLLL.","..........",".........."],
 types:["..........",".WW..LLL..","WWW.L...L.",".WW.L...L.",".WW.LLLLL.",".WW.L...L.",".WW.L...L.","WWWWL...L.","..........",".........."],
 kbd:["..........","..........","WWWWWWWWWW","W.W.W.W.WW","WWWWWWWWWW","WW.W.W.W.W","WWWWWWWWWW","W..LLLL..W","WWWWWWWWWW",".........."],
 convert:["LL.LL.....",".L..L.....","..........",".....L....","LLLLLLL...",".....L....","..........","...WWWW...","..WW..WW..","...WWWW..."],
 plus:["..........","..LL......","..LL......","LLLLLL....","LLLLLL....","..LL..WWWW","..LL......","......WWWW","..........",".........."]
};
const LESSON_SPR_C = {P:"#8e6bff",L:"#ecf141",W:"#f3f2ff",N:"#262b69",K:"#ff6b9a"};
function lessonSprite(name, swap){ let r=""; LESSON_SPR[name].forEach((row,y)=>[...row].forEach((c,x)=>{ if(c===".") return; const k=(swap&&swap[c])||c; r+='<rect x="'+x+'" y="'+y+'" width="1" height="1" fill="'+LESSON_SPR_C[k]+'"/>'; }));
  return '<svg viewBox="0 0 10 10" shape-rendering="crispEdges" aria-hidden="true">'+r+'</svg>'; }

/* Содержимое кружка на «Пути». Если у урока нет "icon", остаются старые значки. */
function lessonDisc(p, done, open){
  let s;
  if(p.icon && LESSON_SPR[p.icon]){
    s = lessonSprite(p.icon, done?{L:"P"}:null);
    if(done) s += '<i class="badge">'+I.check+'</i>';
    else if(!open) s += '<i class="badge">'+I.lock+'</i>';
  } else s = done?I.check:p.boss?I.crown:open?I.play:I.lock;
  if(p.boss) s += '<i class="crown">'+I.crown+'</i>';
  return s;
}
