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
 plus:["..........","..LL......","..LL......","LLLLLL....","LLLLLL....","..LL..WWWW","..LL......","......WWWW","..........",".........."],
 paren:["..L....L..",".L......L.","L........L","L...WW...L","L.WWWWWW.L","L.WWWWWW.L","L...WW...L","L........L",".L......L.","..L....L.."],
 divide:["..........","....LL....","....LL....","..........","WWWWWWWWWW","WWWWWWWWWW","..........","....LL....","....LL....",".........."],
 digits:["..........","..........",".W.LLL.KKK","WW...L...K",".W.LLL.KKK",".W.L.....K",".W.LLL.KKK","..........","WWWWWWWWWW",".........."],
 even:["..........",".LL....LL.",".LL....LL.","..........",".LL....LL.",".LL....LL.","..........",".KK.......",".KK.......",".........."],
 tools:["..........","W........W","W........W","W..L..L..W","W...LL...W","W...LL...W","W..L..L..W","W........W","W........W",".........."],
 compare:["..........","....LL....","...LL.....","..LL..WWWW",".LL.......","..LL..WWWW","...LL.....","....LL....","..........",".........."],
 branch:["LL......KK","LL......KK",".LL....KK.","..LL..KK..","...LLKK...","....WW....","....WW....","....WW....","....WW....",".........."],
 ladder:["..........","LL.WWWWWWW","LL.WWWWWWW","..........","WW.WWWWW..","WW.WWWWW..","..........","WW.WWWW...","WW.WWWW...",".........."],
 logic:["..........","..........","..WWLLKK..",".WWLLLLKK.",".WWLLLLKK.",".WWLLLLKK.",".WWLLLLKK.","..WWLLKK..","..........",".........."],
 nest:["WWWWWWWWWW","W........W","W.LLLLLL.W","W.L....L.W","W.L.KK.L.W","W.L.KK.L.W","W.L....L.W","W.LLLLLL.W","W........W","WWWWWWWWWW"],
 max3:["..........","....LL....","....LL....","....LL....","....LL..WW","WW..LL..WW","WW..LL..WW","WW..LL..WW","WW..LL..WW",".........."],
 loop:["..........", "...LLLL...", "..L....L..", ".L......L.", ".L.....LLL", ".L......L.", ".L........", "..L....L..", "...LLLL...", ".........."],
 steps:["..........", ".......LL.", ".......LL.", ".....LLLL.", ".....LLLL.", "...LLLLLL.", "...LLLLLL.", ".LLLLLLLL.", ".LLLLLLLL.", ".........."],
 sum:["..........", ".LLLLLLL..", ".LL.......", "..LL......", "...LL.....", "..LL......", ".LL.......", ".LLLLLLL..", "..........", ".........."],
 filter:["..........", "LLLLLLLLLL", ".LLLLLLLL.", "..LLLLLL..", "...LLLL...", "....LL....", "....LL....", "....LL....", "....WW....", ".........."],
 peak:["......K...", "......KK..", "......W...", ".....LLL..", "....LLLLL.", "...LLLLLLL", "..LLLLLLLL", ".LLLLLLLLL", "LLLLLLLLLL", ".........."],
 grid:["..........", ".LL.LL.LL.", ".LL.LL.LL.", "..........", ".LL.WW.LL.", ".LL.WW.LL.", "..........", ".LL.LL.LL.", ".LL.LL.LL.", ".........."],
 wloop:["...LLLL...", "..L....L..", ".L..WW..L.", ".L.W..W.L.", ".L....W.LL", "L....W..LL", "L....W....", "L.........", ".L...W..L.", "..LLLLLL.."],
 cut:["..........", "LL.LL.....", "LL.LL.K...", "LL.LL.K...", "LL.LL.K...", "LL.LL.K.WW", "......K.WW", "........WW", "........WW", ".........."],
 zero:["..........", "...LLLL...", "..LL..LL..", "..LL..LL..", "..LL..LL..", "..LL..LL..", "..LL..LL..", "...LLLL...", "..........", "KKKKKKKKKK"],
 stop:["...KKKK...", "..KKKKKK..", ".KKKKKKKK.", "KKKKKKKKKK", "KWWWWWWWWK", "KWWWWWWWWK", "KKKKKKKKKK", ".KKKKKKKK.", "..KKKKKK..", "...KKKK..."],
 binary:["..........", ".L...WWW..", "LL..W...W.", ".L..W...W.", ".L..W...W.", ".L..W...W.", ".L..W...W.", "LLL..WWW..", "..........", ".........."],
 inf:["..........", "..........", ".LLL..LLL.", "L...LL...L", "L....L...L", "L...L....L", "L...LL...L", ".LLL..LLL.", "..........", ".........."],
 index:["....KK....", "....KK....", "....KK....", "..KKKKKK..", "...KKKK...", "....KK....", "..........", ".WW.LL.WW.", ".WW.LL.WW.", ".WW.LL.WW."],
 slice:["..........", "WW.LLLL.WW", "WW.LLLL.WW", "..........", "..K....K..", "..KKKKKK..", "..........", "...LLLL...", "...LLLL...", ".........."],
 ruler:["..........", "LLLLLLLLLL", "LNLNLNLNLL", "LNLLLNLLLL", "LLLLLLLLLL", "..........", ".W......W.", "WWWWWWWWWW", ".W......W.", ".........."],
 wand:["..K.....L.", ".KKK...LLL", "..K.....L.", "...LL.....", "...LL.....", ".....WW...", "......WW..", ".......WW.", "........WW", ".........W"],
 lens:["..WWWW....", ".W....W...", "W..LL..W..", "W.LLLL.W..", "W..LL..W..", ".W....W...", "..WWWWKK..", "......KKK.", ".......KKK", "........KK"],
 mirror:["....WW....", "LL..WW..LL", "L...WW...L", "LLL.WW.LLL", "L...WW...L", "LL..WW..LL", "....WW....", ".K..WW..K.", "KKK.WW.KKK", "....WW...."],
 lbox:["..........", "LL......LL", "L........L", "L........L", "LWW.KK.WWL", "LWW.KK.WWL", "L........L", "L........L", "LL......LL", ".........."],
 ladd:["......LL..", "......LL..", "....LLLLLL", "....LLLLLL", "......LL..", "......LL..", "..........", "WW.WW.KK..", "WW.WW.KK..", ".........."],
 lwalk:["..........", "WW.WW.WW..", "WW.WW.WW..", "..........", "KK........", "KK....L...", "LLLLLLLLL.", "......L...", "..........", ".........."],
 lchart:["........KK", "........KK", "....WW..KK", "....WW..KK", "....WW..KK", "LL..WW..KK", "LL..WW..KK", "LL..WW..KK", "..........", "WWWWWWWWWW"],
 lsplit:["KK......KK", "K.K....K.K", ".KK....KK.", "...K..K...", "....KK....", "....KK....", "..........", "LLL.LLL.LL", "LLL.LLL.LL", ".........."],
 ltarget:["....L.....", "..LLLLL...", ".L..L..L..", ".L.....L..", "LLL.K.LLL.", ".L.....L..", ".L..L..L..", "..LLLLL...", "....L.....", ".........."],
 fdef:["..LL......", ".L........", ".L....K.K.", "LLL..K...K", ".L...K...K", ".L...K...K", ".L....K.K.", ".L........", "L.........", ".........."],
 farg:["..........", "....WWWWWW", "....W....W", "..L.W....W", "LLLLW.KK.W", "LLLLW.KK.W", "..L.W....W", "....W....W", "....WWWWWW", ".........."],
 fret:["..........", "WWWWWW....", "W....W....", "W....W.L..", "W.KKLLLLLL", "W.KKLLLLLL", "W....W.L..", "W....W....", "WWWWWW....", ".........."],
 fhome:["....LL....", "...LLLL...", "..LLLLLL..", ".LLLLLLLL.", "LLLLLLLLLL", ".WWWWWWWW.", ".WKKWWWWW.", ".WKKWWNNW.", ".WWWWWNNW.", ".WWWWWNNW."],
 fcombo:["..........", "WWW...KKK.", "W.W...K.K.", "W.WLLLK.K.", "W.W...K.K.", "WWW...KKK.", ".......L..", ".......L..", "......LLL.", "......LLL."]
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

/* Пиксельные картинки 16×16 на карточках модулей вместо кота. Ключ = id модуля (или поле "art" в course.json) */
const MOD_ART = {
 m1:["..........PPP...",".........PNPNP..","NNNNNNNNNPPPPP..","NDDDDDDDDNPPK...","NDWDDDDDDNPP....","NDDWDDDDDNPP....","NDWDDLLLDNPPP...","NDDDDDDDDN.PPP..","NDDDDDDDDN..PPP.","NNNNNNNNNN...PP.","....NN.......PP.","..NNNNNN....PPP.","..........PPPP..","...PPPPPPPPPP...","..PPPPPPPPP.....","................"],
 m2:["................","..PP........PP..","...PP......PP...","....PNNNNNNP....","..NNNNNNNNNNNN..","..NDDDDDDDDDDN..","..NDDDWWWDDDDN..","..NDDDWDDDDDDN..","..NDDDWWWDDDDN..","..NDDDDDWDDDDN..","..NDDDWWWDDDDN..","..NDDDDDDDDDDN..","..NNNNNNNNNNNN..","................","................","................"],
 m3:["..NNNNNNNNNNNN..","..NDDDDDDDDDDN..","..NDCCCCCCCCDN..","..NDCCCCCNNCDN..","..NDCCCCCCCCDN..","..NDDDDDDDDDDN..","..NDWWDWWDKKDN..","..NDWWDWWDKKDN..","..NDDDDDDDDDDN..","..NDWWDWWDKKDN..","..NDWWDWWDKKDN..","..NDDDDDDDDDDN..","..NDWWDWWDPPDN..","..NDWWDWWDPPDN..","..NDDDDDDDDDDN..","..NNNNNNNNNNNN.."],
 m4:["......NN........","..NNNNNNNNNNN...","..NWWWWWWWWWWN..","..NWNNWWWWWWWWN.","..NWWWWWWWWWWN..","..NNNNNNNNNNN...","......NN........","...NNNNNNNNNNN..","..NKKKKKKKKKKN..",".NKKWWKKKKKKKN..","..NKKKKKKKKKKN..","...NNNNNNNNNNN..","......NN........","......NN........","....NNNNNN......","................"],
 m5:["............D...",".....NNNN..DDD..","....NPPPP..DDDD.","...PPNN....DDDDD","..NPN.......DD..",".NPN...N....NPN.",".NPN..NN....NPN.",".NP....N.....PN.",".NP....N.....PN.",".NPN..NNN...NPN.",".NPN........NPN.","..NPN......NPN..","...PPNN..NNPP...","....NPPPPPPN....",".....NNNNNN.....","................"],
 m6:["..NNNNNNNNNNNN..","..NDDDDDDDDDDN..","...NWWWWWWWWN...","...NWOOOOOOWN...","....NWOOOOWN....",".....NWOOWN.....","......NWWN......","......NOWN......",".....NWOOWN.....","....NWWOOWWN....","...NWWOOOOWWN...","...NWOOOOOOWN...","...NWOOOOOOWN...","..NDDDDDDDDDDN..","..NNNNNNNNNNNN..","................"],
 m7:["................","................",".NNNNNNNNNNNNNN.","NWWWWWWWWWWWWWWN","NWWDWWDDWWWDDWWN","NWDWDWDWDWDWWWWN","NWDDDWDDWWDWWWWN","NWDWDWDWDWDWWWWN","NWDWDWDDWWWDDWWN","NWWWWWWWWWWWWWWN","NWWWWWWWWWWWWWWN",".NNNNNNNNNNNNNN.","...NNN..........","...N............","................","................"],
 m8:["....NNNNNN......","..NNNWWWWNNN....","..NDNNNNNNDN....","..NDWWWWWWDN....","..NDKKWNNNDN....","..NDKKWWWWDN....","..NDWWWWWWDN....","..NDLLWNNNDN....","..NDLLWWWWDN....","..NDWWWWWWDN....","..NDKKWNNNDN....","..NDKKWWWWDN....","..NDWWWWWWDN....","..NDDDDDDDDN....","..NNNNNNNNNN....","................"],
 m9:["......NNNN......","......NDDN......","..NN.NDDDDN.NN..","..NDNDDDDDDNDN..","...NDDDDDDDDN...","..NDDDNNNNDDDN..","NNDDDNPPPPNDDDNN","NDDDNPPLLPPNDDDN","NDDDNPPLLPPNDDDN","NNDDDNPPPPNDDDNN","..NDDDNNNNDDDN..","...NDDDDDDDDN...","..NDNDDDDDDNDN..","..NN.NDDDDN.NN..","......NDDN......","......NNNN......"]
};
const MOD_ART_C = {P:"#8e6bff",D:"#512da8",N:"#262b69",W:"#ffffff",K:"#ff6b9a",L:"#ecf141",C:"#4fd1e8",O:"#ff9b3d"};
function moduleArt(M){
  const a=MOD_ART[M.art||M.id]; if(!a) return '<img src="'+CAT+'" alt="">';
  let r=""; a.forEach((row,y)=>[...row].forEach((c,x)=>{ if(c!==".") r+='<rect x="'+x+'" y="'+y+'" width="1" height="1" fill="'+MOD_ART_C[c]+'"/>'; }));
  return '<span class="mod-art" aria-hidden="true"><svg viewBox="0 0 16 16" shape-rendering="crispEdges">'+r+'</svg></span>';
}
