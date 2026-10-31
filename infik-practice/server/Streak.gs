/**
 * ИНФиК — огонёк (серия дней), класс ученика и напоминание ботом в 18:00 по Москве.
 * Лежит рядом с Code.gs, League.gs и Bot.gs в том же проекте Apps Script.
 * Пользуется verifyInitData_ (Code.gs), а также botConf_, botSetConf_, appButton_, tgApi_ и sendBatch_ (Bot.gs).
 *
 * Действия (POST, как у лиги):
 *   { action: 'streak_ping',   initData, streak, grade } → ученик сегодня прошёл урок или решил задачу
 *   { action: 'streak_remind', initData, on }            → включить или выключить напоминание
 *   { action: 'streak_grade',  initData, grade }         → ответ на вопрос «В каком ты классе?»
 * Ответ: { ok: true, remind: true|false }
 *
 * Один раз после добавления файла: выполнить streakSetup (создаст лист «Огонёк», строку текста на листе «Бот»
 * и ежедневный запуск streakRemind в 18:00 по Москве).
 */

var SHEET_STREAK = 'Огонёк';
var STREAK_HEAD = ['id', 'Имя', 'username', 'Серия', 'Последний день', 'Обновлено', 'Напоминать', 'Класс', 'Последнее напоминание'];
var STREAK_TEXT_KEY = 'Напоминание про огонёк';
var STREAK_TEXT_DEFAULT = '🔥 Твой огонёк горит уже {серия} подряд! Пройди сегодня урок или реши задачу дня, иначе в полночь он погаснет 🐱';

function streakSetup() {
  streakSheet_();
  if (!botConf_()[STREAK_TEXT_KEY]) botSetConf_(STREAK_TEXT_KEY, STREAK_TEXT_DEFAULT, 'Текст напоминания в 18:00. {серия} заменится на «5 дней». Пусто или «выкл» — напоминания не отправляются');
  ScriptApp.getProjectTriggers().forEach(function (t) { if (t.getHandlerFunction() === 'streakRemind') ScriptApp.deleteTrigger(t); });
  ScriptApp.newTrigger('streakRemind').timeBased().atHour(18).nearMinute(0).everyDays(1).inTimezone('Europe/Moscow').create();
}

function streak_(user, req) {
  var lock = LockService.getScriptLock(); lock.waitLock(10000);
  try {
    var sh = streakSheet_(), row = streakRow_(sh, user.id), v;
    if (!row) {
      sh.appendRow([user.id, user.name, user.username, 0, '', new Date(), 'да', '', '']);
      row = sh.getLastRow();
      sh.getRange(row, 1).setNumberFormat('@').setValue(user.id);
      CacheService.getScriptCache().put('srow_' + user.id, String(row), 21600);
    }
    v = sh.getRange(row, 1, 1, STREAK_HEAD.length).getValues()[0];
    v[1] = user.name; v[2] = user.username; v[5] = new Date();
    if (req.action === 'streak_ping') {
      v[3] = Math.max(0, Math.min(Number(req.streak) || 0, 3650));
      v[4] = streakDay_(0);
      if (req.grade) v[7] = streakGrade_(req.grade);
    } else if (req.action === 'streak_remind') {
      v[6] = req.on ? 'да' : 'нет';
    } else if (req.action === 'streak_grade') {
      v[7] = streakGrade_(req.grade);
    } else return { error: 'Неизвестное действие' };
    sh.getRange(row, 1, 1, STREAK_HEAD.length).setValues([v]);
    sh.getRange(row, 5).setNumberFormat('@').setValue(v[4]);
    return { ok: true, remind: String(v[6]) !== 'нет' };
  } finally { lock.releaseLock(); }
}

/* ---------- напоминание в 18:00 ---------- */

// Запускается триггером раз в день. Пишет тем, у кого огонёк горел вчера, а сегодня ещё нет.
function streakRemind() {
  var conf = botConf_(), text = conf[STREAK_TEXT_KEY];
  if (!text || /^выкл/i.test(text)) return;
  var sh = streakSheet_(), last = sh.getLastRow();
  if (last < 2) return;
  var rows = sh.getRange(2, 1, last - 1, STREAK_HEAD.length).getValues();
  var today = streakDay_(0), yesterday = streakDay_(-1), groups = {}, rowOf = {};
  rows.forEach(function (r, i) {
    var day = r[4] instanceof Date ? Utilities.formatDate(r[4], 'Europe/Moscow', 'yyyy-MM-dd') : String(r[4]);
    var sent = r[8] instanceof Date ? Utilities.formatDate(r[8], 'Europe/Moscow', 'yyyy-MM-dd') : String(r[8]);
    if (String(r[6]) === 'нет' || !(Number(r[3]) >= 1) || day !== yesterday || sent === today) return;
    var n = Number(r[3]); (groups[n] = groups[n] || []).push(String(r[0])); rowOf[String(r[0])] = i + 2;
  });
  var app = appButton_(conf), kb = app ? app.inline_keyboard.slice() : [];
  if (kb.length) kb[0] = [{ text: '🔥 Зажечь огонёк', web_app: kb[0][0].web_app, url: kb[0][0].url }];
  kb.push([{ text: 'Не напоминать', callback_data: 'streak_off' }]);
  var markup = { inline_keyboard: kb }, stamp = [], off = [];
  Object.keys(groups).forEach(function (n) {
    var ids = groups[n], days = n + ' ' + streakPlural_(Number(n), 'день', 'дня', 'дней');
    for (var i = 0; i < ids.length; i += 25) {   // пачками, чтобы не упереться в лимиты Telegram
      var part = ids.slice(i, i + 25), res = sendBatch_(part, text.replace(/\{серия\}/g, days), markup);
      if (res.fatal) { console.error('Напоминание не ушло: ' + res.fatal); return; }
      part.forEach(function (id) { (res.failed.indexOf(id) >= 0 ? off : stamp).push(rowOf[id]); });
      Utilities.sleep(1000);
    }
  });
  stamp.forEach(function (row) { sh.getRange(row, 9).setNumberFormat('@').setValue(today); });
  off.forEach(function (row) { sh.getRange(row, 7).setValue('нет'); });   // бот заблокирован или чат не найден
  console.log('Напоминаний: ' + stamp.length + ', не дошло: ' + off.length);
}

// Кнопка «Не напоминать» под напоминанием. Вызывается из botHandle_ (Bot.gs). true — нажатие обработано.
function streakCallback_(cq) {
  if (!cq || cq.data !== 'streak_off') return false;
  var sh = streakSheet_(), row = streakRow_(sh, String(cq.from.id));
  if (row) sh.getRange(row, 7).setValue('нет');
  tgApi_('answerCallbackQuery', { callback_query_id: cq.id, text: 'Хорошо, больше не напоминаю. Включить снова можно в приложении, нажав на огонёк 🔥' , show_alert: true });
  if (cq.message) {
    var kb = (cq.message.reply_markup && cq.message.reply_markup.inline_keyboard || []).filter(function (r) { return !(r[0] && r[0].callback_data === 'streak_off'); });
    tgApi_('editMessageReplyMarkup', { chat_id: cq.message.chat.id, message_id: cq.message.message_id, reply_markup: { inline_keyboard: kb } });
  }
  return true;
}

/* ---------- помощники ---------- */

function streakSheet_() {
  var ss = SpreadsheetApp.getActive(), sh = ss.getSheetByName(SHEET_STREAK);
  if (!sh) { sh = ss.insertSheet(SHEET_STREAK); sh.appendRow(STREAK_HEAD); sh.setFrozenRows(1); }
  return sh;
}
function streakRow_(sh, id) {
  var c = CacheService.getScriptCache(), hit = c.get('srow_' + id);
  if (hit && sh.getRange(Number(hit), 1).getDisplayValue() === id) return Number(hit);
  var f = sh.getRange('A:A').createTextFinder(id).matchEntireCell(true).findNext();
  if (!f) return 0;
  c.put('srow_' + id, String(f.getRow()), 21600);
  return f.getRow();
}
/* день по Москве в виде 2026-10-31; shift — сдвиг в днях */
function streakDay_(shift) { return new Date(Date.now() + 3 * 3600 * 1000 + (shift || 0) * 86400000).toISOString().slice(0, 10); }
function streakGrade_(g) { g = String(g || ''); return g === 'out' ? 'не в школе' : (/^(7|8|9|10|11)$/.test(g) ? g : ''); }
function streakPlural_(n, a, b, c) { n = Math.abs(n) % 100; var n1 = n % 10; if (n > 10 && n < 20) return c; if (n1 > 1 && n1 < 5) return b; if (n1 === 1) return a; return c; }
