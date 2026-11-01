/* Чат учеников: кнопка в шапке рядом с огоньком открывает шторку с описанием и ссылкой на Telegram-чат.
   Ссылка — CHAT_URL в config.js. Красная точка на кнопке горит, пока ученик ни разу не открыл шторку. */

I.chat='<svg viewBox="0 0 12 11" shape-rendering="crispEdges"><g fill="#512da8"><rect x="1" y="0" width="10" height="1"/><rect x="0" y="1" width="12" height="6"/><rect x="1" y="7" width="10" height="1"/><rect x="2" y="8" width="2" height="1"/><rect x="2" y="9" width="1" height="1"/></g><g fill="#ecf141"><rect x="3" y="3" width="2" height="2"/><rect x="7" y="3" width="2" height="2"/></g></svg>';

function openChat(){
  if(!S.chatSeen){ S.chatSeen=true; save(); const cb=$("#chatbtn"); if(cb) cb.classList.remove("new"); }
  const box=h("div",{class:"cht"});
  box.appendChild(h("div",{class:"cht-hero"},'<img src="'+CAT+'" alt=""><div><b>Учимся вместе</b><span>Ребята, которые учат Python и готовятся к ЕГЭ по информатике</span></div>'));
  box.appendChild(h("ul",{class:"cht-list"},
    '<li><i aria-hidden="true">🧩</i><span><b>Обсудить задачи</b><small>Разобрать решение или сравнить, кто как написал</small></span></li>'+
    '<li><i aria-hidden="true">🙋</i><span><b>Попросить помощи</b><small>Застрял на уроке? Спроси, и ребята подскажут</small></span></li>'+
    '<li><i aria-hidden="true">🐱</i><span><b>Познакомиться</b><small>Найти друзей по интересам и не учиться в одиночку</small></span></li>'));
  const go=h("button",{class:"main",type:"button"},"Перейти в чат");
  box.appendChild(go);
  box.appendChild(h("p",{class:"note"},"Чат откроется в Telegram. Будь вежлив, и готовые ответы на задачи дня не выкладывай 😉"));
  const sh=openSheet("Чат ИНФиКа",box);
  const el=box.closest(".sheet"); if(el) el.classList.add("fit");
  go.onclick=()=>{
    haptic("success");
    try { if(tg&&tg.openTelegramLink&&/^https:\/\/t\.me\//.test(CHAT_URL)){ tg.openTelegramLink(CHAT_URL); sh.close(); return; } } catch(e){}
    window.open(CHAT_URL,"_blank","noopener"); sh.close();
  };
}
