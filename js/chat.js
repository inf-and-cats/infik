/* Чат учеников: кнопка в шапке рядом с огоньком открывает шторку с описанием и ссылкой на Telegram-чат.
   Ссылка — CHAT_URL в config.js. Красная точка на кнопке горит, пока ученик ни разу не открыл шторку. */

I.chat='<svg viewBox="0 0 12 11" shape-rendering="crispEdges"><g fill="#512da8"><rect x="1" y="0" width="10" height="1"/><rect x="0" y="1" width="12" height="6"/><rect x="1" y="7" width="10" height="1"/><rect x="2" y="8" width="2" height="1"/><rect x="2" y="9" width="1" height="1"/></g><g fill="#ecf141"><rect x="3" y="3" width="2" height="2"/><rect x="7" y="3" width="2" height="2"/></g></svg>';

/* пиксельные значки 10×10 для пунктов шторки (буквы — цвета, как в LESSON_SPR_C) */
const CHAT_SPR={
 talk:["LLLLLLL...","LLLLLLL...","LNLNLNL...","LLLLLLL...","LLLLLLL...","LL.PPPPPPP","L..PPPPPPP","...PWPWPWP","...PPPPPPP","........PP"],
 help:[".WWWWWWWW.","WWWKKKKWWW","WWKKWWKKWW","WWWWWKKWWW","WWWWKKWWWW","WWWWWWWWWW","WWWWKKWWWW",".WWWWWWWW.","..WW......","..W......."],
 cat:["..........",".P......P.",".PP....PP.",".PPPPPPPP.",".PWNPPWNP.",".PPPPPPPP.",".PPPKKPPP.","..PPPPPP..","....LL....","...LLLL..."],
 heart:[".KK.KK.",
        "KWKKKKK",
        "KKKKKKK",
        ".KKKKK.",
        "..KKK..",
        "...K..."]
};
function chatSprite(name){
  const rows=CHAT_SPR[name]; let r="";
  rows.forEach((row,y)=>[...row].forEach((c,x)=>{ if(c!==".") r+='<rect x="'+x+'" y="'+y+'" width="1" height="1" fill="'+LESSON_SPR_C[c]+'"/>'; }));
  return '<svg viewBox="0 0 '+rows[0].length+' '+rows.length+'" shape-rendering="crispEdges" aria-hidden="true">'+r+'</svg>';
}

function openChat(){
  if(!S.chatSeen){ S.chatSeen=true; save(); const cb=$("#chatbtn"); if(cb) cb.classList.remove("new"); }
  const box=h("div",{class:"cht"});
  const cat=typeof catSrc==="function"?catSrc(0,false,[]):CAT; // пиксельный кот из js/achieve.js
  box.appendChild(h("div",{class:"cht-hero"},'<img src="'+cat+'" alt=""><div><b>Учимся вместе</b><span>Ребята, которые учат Python и готовятся к ЕГЭ по информатике</span></div>'));
  box.appendChild(h("ul",{class:"cht-list"},
    '<li><i>'+chatSprite("talk")+'</i><span><b>Обсудить задачи</b><small>Разобрать решение или сравнить, кто как написал</small></span></li>'+
    '<li><i>'+chatSprite("help")+'</i><span><b>Попросить помощи</b><small>Застрял на уроке? Спроси, и ребята подскажут</small></span></li>'+
    '<li><i>'+chatSprite("cat")+'</i><span><b>Познакомиться</b><small>Найти друзей по интересам и не учиться в одиночку</small></span></li>'));
  const go=h("button",{class:"main",type:"button"},I.chat+"Перейти в чат");
  box.appendChild(go);
  box.appendChild(h("p",{class:"note"},"Чат откроется в Telegram. Будь вежлив, и готовые ответы на задачи дня не выкладывай "+chatSprite("heart")));
  const sh=openSheet("Чат ИНФиКа",box);
  const el=box.closest(".sheet"); if(el) el.classList.add("fit","pix");
  go.onclick=()=>{
    haptic("success");
    try { if(tg&&tg.openTelegramLink&&/^https:\/\/t\.me\//.test(CHAT_URL)){ tg.openTelegramLink(CHAT_URL); sh.close(); return; } } catch(e){}
    window.open(CHAT_URL,"_blank","noopener"); sh.close();
  };
}
