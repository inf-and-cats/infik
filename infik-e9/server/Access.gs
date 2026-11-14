/**
 * ИНФиК — доступы: кто ученик курса.
 * Ученик = состоит в закрытом канале учеников (проверяем через бота) или отмечен на листе «Доступ».
 * Ученикам «Спидран» не показывается, и сервер не принимает от них ответы.
 * Однажды найденный в канале ученик записывается в «Доступ» и остаётся учеником навсегда.
 *
 * Нужен Bot.gs (берёт токен, id канала с листа «Бот» и функцию tgApi_).
 * В Code.gs в doPost нужны 2 строки, см. README.
 */

var SHEET_ACCESS = 'Доступ';
// Роли на листе «Доступ»:
//   ученик   — все разделы, без «Спидрана»
//   спидран  — показать «Спидран» даже ученику (для тебя и тестировщиков)

function accessSheet_() {
  var ss = SpreadsheetApp.getActive(), sh = ss.getSheetByName(SHEET_ACCESS);
  if (!sh) {
    sh = ss.insertSheet(SHEET_ACCESS);
    sh.appendRow(['tg_id', 'Имя', 'Роль', 'Откуда', 'Когда']);
    sh.setFrozenRows(1);
    sh.getRange('C2:C2000').setDataValidation(SpreadsheetApp.newDataValidation().requireValueInList(['ученик', 'спидран'], true).build());
  }
  return sh;
}

// Можно выполнить вручную, чтобы сразу создать лист «Доступ»
function accessSetup() { accessSheet_(); }

function accessRole_(user) {
  var c = CacheService.getScriptCache(), key = 'acc_' + user.id, hit = c.get(key);
  if (hit !== null) return hit;
  var sh = accessSheet_();
  var f = sh.getRange('A:A').createTextFinder(user.id).matchEntireCell(true).findNext();
  var role = f ? String(sh.getRange(f.getRow(), 3).getValue()).trim() : '';
  var ttl = 600;
  if (!role) {
    var m = studentMember_(user);
    if (m === true) {
      role = 'ученик';
      var lock = LockService.getScriptLock(); lock.waitLock(20000);
      try {
        if (!sh.getRange('A:A').createTextFinder(user.id).matchEntireCell(true).findNext()) {
          sh.appendRow([user.id, user.name, role, 'канал/чат', new Date()]);
          sh.getRange(sh.getLastRow(), 1).setNumberFormat('@').setValue(user.id);
        }
      } finally { lock.releaseLock(); }
    } else if (m === null) ttl = 60;   // Telegram не ответил: считаем не учеником и скоро спросим снова
  }
  c.put(key, role, ttl);
  return role;
}

// Состоит ли человек в закрытом канале учеников ИЛИ в закрытом чате учеников.
// true — да, false — нет, null — Telegram не ответил. Чат задаётся строкой «Чат учеников (id)» на листе «Бот» (бот должен быть в чате).
function studentMember_(user) {
  var conf = botConf_(), ids = [conf['Канал учеников (id)'], conf['Чат учеников (id)']].filter(function (x) { return x; });
  var failed = false;
  for (var i = 0; i < ids.length; i++) {
    var r = tgApi_('getChatMember', { chat_id: ids[i], user_id: Number(user.id) });
    if (!r.ok) { failed = true; continue; }
    var st = r.result.status;
    if (st === 'member' || st === 'administrator' || st === 'creator' || (st === 'restricted' && r.result.is_member)) return true;
  }
  return failed ? null : false;
}

function isStudent_(user) { return accessRole_(user) === 'ученик'; }

// Ответ приложению: что показывать.
// Роль «спидран» (ты и тестировщики) показывает «Спидран», но если человек в канале или чате учеников,
// приложение всё равно считает его учеником: никаких предложений демо и покупки.
function access_(user) {
  var role = accessRole_(user), student = role === 'ученик';
  if (role === 'спидран') {
    var c = CacheService.getScriptCache(), key = 'accm_' + user.id, hit = c.get(key);
    if (hit === null) { var m = studentMember_(user); hit = m ? '1' : '0'; c.put(key, hit, m === null ? 60 : 600); }
    student = hit === '1';
  }
  return { student: student, speedrun: role !== 'ученик', allSections: student || role === 'спидран' };
}
