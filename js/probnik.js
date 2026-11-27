/* «Пробник лайт»: мини-задачи ЕГЭ по номерам, которые уже прошли на курсе.
   Задачи — из банка content/probnik/eN.json (генератор: tools/probnik-kit/gen_probnik.js), шаги — обычные шаги уроков (sheet).
   Режимы: «Тренировка» — новая задача каждый раз, подсказки и разбор; «Зачёт» — вариант недели, общий для всех, таймер, без подсказок.
   Балл за номер — если все шаги решены верно с первого раза (на экзамене одна ошибка в формуле = неверный ответ).
   Сервер (server/Probnik.gs): probnik_result — сохранить попытку, probnik_top — лидеры недели.
   Подключать после lesson.js, app.js и materials.js: файл оборачивает renderPath, showStep, resolve, finish, closeLesson и openRewards. */

/* Номера в пробнике. Новый модуль готов и пройден на курсе → добавь строку и файл банка (генератор). free — доступно всем, остальное только ученикам */
const PB_TASKS=[
  {task:1, file:"content/probnik/e1.json", title:"Графы и таблицы", min:3},
  {task:2, file:"content/probnik/e2.json", title:"Алгебра логики", min:3},
  {task:6, file:"content/probnik/e6.json", title:"Исполнитель Черепаха", min:4},
  {task:9, file:"content/probnik/e9.json", title:"Числа в таблицах", min:6, free:true},
  {task:18, file:"content/probnik/e18.json", title:"Робот в таблице", min:8}
];
const PB_XP={train:5, exam:20};           // XP за решённый номер (в зачёте — только за первую попытку недели)
const PB_LESSON={e1l2:"Весовая таблица",e1l3:"Степень вершины",e1l4:"Редкая степень",e1l5:"Соседи-зацепки",e1l6:"Симметрия",e1l7:"Другие вопросы",e6l3:"Черепаха в Python",e6l5:"Точки или клетки",e6l6:"Пересечение и объединение",e2l6:"Таблица программой",e2l7:"Сопоставляем столбцы",e2l8:"Переводим в Python",e9l1:"Ячейки, формулы и функции",e9l2:"Условия: ЕСЛИ и И",e9l3:"Все числа разные",e9l4:"Сколько повторов",e9l5:"Три наименьших и порядок",e9l6:"Чётные и нечётные",e9l7:"Ловушки задания 9",
  e18l3:"МАКС и МИН",e18l4:"Решаем в таблице",e18l5:"Стены",e18l6:"Финиши и закутки"};
const PB_TAGMSG={"степени":"Степень — сколько линий сходится в вершине, в таблице — сколько чисел в строке. Числа не складываем, сумма всех степеней вдвое больше числа дорог.",
  "сопоставление":"Сопоставление: начинай с редкой степени, потом иди по соседям. Если степени одинаковые, ищи зацепку: соседа-двойку, общего соседа, треугольник.",
  "клетки":"Дорога между Пi и Пj записана на пересечении строки i и столбца j (и ещё раз зеркально).",
  "чтение ответа":"Ответ: проверь, что спросили — длину дороги, сумму, путь или номера пунктов, и в каком порядке писать номера.",
  "код черепахи":"Программа для Черепахи: строка алгоритма — строка кода, первой командой lt(90), расстояния умножаем на k, углы нет.",
  "формула":"Что считаем: точки с границей (a + 1)(b + 1), без границы (a − 1)(b − 1), площадь a · b, периметр 2(a + b); в объединении общую часть вычитаем.",
  "подсчёт":"Подсчёт по окну: длина стороны на единицу меньше числа точек на ней.","перевод":"Перевод F в Python: → это <=, ≡ это ==, каждая импликация и эквивалентность в скобках, not рядом с ними тоже.",
  "условие":"Программа выводит строки с тем же F, что во фрагменте. Сравнение пишется через ==.","столбцы":"Сопоставление столбцов: начинай с переменной, у которой во всех выведенных строках одно значение, или с самой редкой строки фрагмента.",
  "счётчики":"Счётчики СЧЁТЕСЛИ: диапазон строки закрепляется долларом только по столбцам.","условие 1":"Первое условие: сумма счётчиков показывает, какие в строке повторы.",
  "числа":"Вспомогательные числа строки: суммы, максимум и минимум, СУММЕСЛИ.","остатки":"Чётность через ОСТАТ(число; 2).","оба условия":"Итоговая формула: оба условия внутри И(…).",
  "ответ":"Формула ответа на весь столбец.","финиши":"Финиши: клетки со стеной справа и снизу.","закуток":"Закуток: клетки, куда робот не попадает.",
  "стены":"Клетки у стен: туда приходят только с одной стороны.","формулы":"Общая формула карты сумм: МАКС соседей плюс своя монета."};
const PB_THEORY={
 1:[["Схема решения","Считаем степени на схеме и в таблице, находим пункт с редкой степенью, от него по соседям подписываем строки буквами. Потом читаем числа в нужных клетках."],
    ["Степень","Степень вершины — сколько дорог из неё выходит. На схеме это число линий в точке, в таблице — количество чисел в строке (не их сумма)."],
    ["Зацепки","Если степени одинаковые, смотрим на соседей: общий сосед двух двоек, двойка рядом с двойкой, треугольник. Таблицу и схему рисовали независимо: П1 не обязательно A."],
    ["Симметрия и ответ","Симметричные пункты различить нельзя — выбирай любой вариант, ответ не изменится. Номера пунктов пишем в порядке из условия, кратчайший путь считаем по сумме длин."]],
 6:[["Шаблон программы","<code>from turtle import *</code><br><code>tracer(0); screensize(10000, 10000)</code><br><code>lt(90); k = 10</code><br>строки алгоритма, потом <code>up()</code> и два цикла: <code>for x in range(…):</code> и <code>for y in range(…): goto(x*k, y*k); dot(3)</code>, в конце <code>update(); done()</code>."],
    ["Перевод команд","Вперёд n — <code>fd(n*k)</code>, Назад n — <code>bk(n*k)</code>, Направо m — <code>rt(m)</code>, Налево m — <code>lt(m)</code>, Поднять хвост — <code>up()</code>, Опустить — <code>down()</code>, Повтори k [ … ] — <code>for i in range(k): …</code>. Одна строка алгоритма — одна строка кода."],
    ["Что считаем","Прямоугольник a × b: точки с границей <code>(a + 1) · (b + 1)</code>, без границы <code>(a − 1) · (b − 1)</code>, площадь <code>a · b</code>, периметр <code>2 · (a + b)</code>. Длина стороны на 1 меньше числа точек на ней."],
    ["Объединение","Первая фигура плюс вторая минус их пересечение: общую часть иначе посчитаешь дважды. Для площади так же."]],
 2:[["Схема решения","Переводим F в Python, перебираем все 16 наборов и выводим строки, где F такое же, как во фрагменте. Потом сопоставляем вывод с фрагментом."],
    ["Перевод","¬ пишем как <code>not</code>, ∧ как <code>and</code>, ∨ как <code>or</code>.<br>A → B пишем как <code>A &lt;= B</code>, A ≡ B как <code>A == B</code>.<br>Каждую → и ≡ берём в скобки целиком, <code>not</code> рядом с ними тоже: <code>x == (not y)</code>."],
    ["Программа","Перебор: <code>for w, x, y, z in product([0, 1], repeat=4):</code><br>Внутри строка <code>F = …</code>, потом <code>if F == 0:</code> или <code>if F == 1:</code>, как во фрагменте, и <code>print(w, x, y, z)</code>."],
    ["Сопоставление","Ищем переменную, которая во всех выведенных строках одинакова, и столбец фрагмента, где её значение не нарушено. Строки фрагмента различные: две строки не могут оказаться одной строкой таблицы."]],
 9:[["Схема решения","Каждое условие считаем отдельным столбцом для одной строки, протягиваем до конца файла. Потом итоговый флаг через <code>ЕСЛИ(И(…);1;0)</code> и ответ на весь столбец."],
    ["Повторы","Счётчик <code>=СЧЁТЕСЛИ($A1:$E1;A1)</code> протягиваем вправо и вниз. Сумма счётчиков строки из пяти чисел: 5 — все разные, 7 — одна пара, 11 — одно число трижды."],
    ["Нужные функции","<code>МАКС</code>, <code>МИН</code>, <code>НАИМЕНЬШИЙ(диапазон;k)</code>, <code>СУММЕСЛИ(счётчики;1;числа)</code> — сумма неповторяющихся, <code>ОСТАТ(A1;2)</code> — чётность."],
    ["Номер строки","Наибольший номер: <code>ЕСЛИ(…;СТРОКА();0)</code> и МАКС. Наименьший: <code>ЕСЛИ(…;СТРОКА();\"\")</code> и МИН, чтобы нули не мешали."]],
 18:[["Финиши и закутки","Финиш — клетка со стеной справа и снизу, правый нижний угол тоже финиш. Закуток — клетки, куда не попасть: в копии их очищаем."],
    ["Карта сумм","Копию поля делаем ниже. Обычная клетка: <code>=МАКС(слева;сверху)+монета</code>. Первая строка и первый столбец — только сумма с соседом."],
    ["Стены","Если сверху стена, приходим только слева: <code>=слева+монета</code>. Если слева стена — только сверху."],
    ["Ответ","Наибольшая сумма среди финишей копии. Для минимума Ctrl+H меняет МАКС на МИН во всей копии."]]
};
let PB=null;                               // текущая попытка (копия лежит в S.pb.cur, чтобы продолжить после закрытия)
const PB_BANK={};
const pbAvail=()=>PB_TASKS.filter(t=>t.free||hasFull());
const pbSt=()=>{ S.pb=S.pb||{hist:[],seen:[]}; S.pb.hist=S.pb.hist||[]; S.pb.seen=S.pb.seen||[]; return S.pb; };
/* неделя по Москве, как в лиге (с понедельника) */
function pbWeek(){ const msk=new Date(Date.now()+3*3600*1000), back=(msk.getUTCDay()+6)%7;
  const mon=Date.UTC(msk.getUTCFullYear(),msk.getUTCMonth(),msk.getUTCDate()-back); return {key:new Date(mon).toISOString().slice(0,10), n:Math.floor(mon/(7*864e5))}; }
const pbTime=s=>Math.floor(s/60)+":"+String(s%60).padStart(2,"0");

/* ---------- пиксельные значки 12×12 (как в нижнем меню) ---------- */
const PB_PX={
 puzzle:["...###......","..#ooo#.....","..#ooo#.....","###ooo####..","#oooooooo#..","#oooooooo###","#oooooooooo#","#oooooooooo#","#oooooooo###","#oooooooo#..","#oooooooo#..","##########.."],
 clock:["....####....","..##oooo##..",".#oooo#ooo#.",".#oooo#ooo#.","#ooooo#oooo#","#ooooo####o#","#oooooooooo#","#oooooooooo#",".#oooooooo#.",".#oooooooo#.","..##oooo##..","....####...."],
 book:["............",".##......##.","#oo##..##oo#","#oooo##oooo#","#oooo##oooo#","#oooo##oooo#","#oooo##oooo#","#oooo##oooo#","#oooo##oooo#",".##oo##oo##.","...##..##...","............"],
 trophy:["............","..########..","#.#oooooo#.#","#.#oooooo#.#",".##oooooo##.","...#oooo#...","....####....",".....##.....",".....##.....","...######...","...######...","............"],
 lock:["....####....","...#....#...","..#......#..","..#......#..",".##########.",".#oooooooo#.",".#oooooooo#.",".#ooo##ooo#.",".#ooo##ooo#.",".#oooooooo#.",".##########.","............"]
};
function pbIcon(k){ let r=""; PB_PX[k].forEach((row,y)=>[...row].forEach((c,x)=>{ if(c!==".") r+='<rect'+(c==="o"?' class="o"':'')+' x="'+x+'" y="'+y+'" width="1" height="1"/>'; }));
  return '<svg class="pb-ic" viewBox="0 0 12 12" shape-rendering="crispEdges" fill="currentColor" aria-hidden="true">'+r+'</svg>'; }

/* ---------- карточка в разделе «Задания ЕГЭ» ---------- */
function pbCard(){
  const av=pbAvail(), on=av.map(t=>t.task), st=pbSt();
  const strip='<div class="pb-strip">'+Array.from({length:27},(_,i)=>'<i class="'+(on.includes(i+1)?"on":"")+'">'+(i+1)+'</i>').join("")+'</div>';
  const best=st.hist.filter(x=>x.mode==="exam"&&x.week===pbWeek().key&&x.max===on.length).sort((a,b)=>b.score-a.score||a.sec-b.sec)[0];
  const c=h("section",{class:"pb-card"});
  c.innerHTML=(hasFull()&&!st.opened?'<span class="pb-badge">новое</span>':'')+'<div class="pb-t">ПРОБНИК<br>ЛАЙТ</div>'+
    '<p class="pb-sub">'+(hasFull()?"Задачи как в ЕГЭ по номерам, которые уже "+(isStudent()?"прошли на курсе":"есть в приложении")+". Один номер — одна задача.":"Задачи как в ЕГЭ. Попробуй на задании 9, остальные номера открываются на курсе.")+'</p>'+strip+
    (hasFull()?'<div class="pb-meta"><span>В пробнике номеров: <b>'+on.length+' из 27</b></span>'+(best?'<span>Зачёт недели: <b>'+best.score+'/'+best.max+' · '+pbTime(best.sec)+'</b></span>':'')+'</div>'
      :'<p class="pb-note">Жёлтое — можно решить сейчас, серое — откроется на курсе.</p>');
  const go=h("button",{class:"main",type:"button"},st.cur?"Продолжить пробник":hasFull()?"Решить пробник":"Решить задание 9"); go.onclick=()=>pbIntro();
  c.appendChild(go);
  const row=h("div",{class:"pb-links"});
  if(hasFull()&&API_URL){ const lb=h("button",{type:"button"},pbIcon("trophy")+"Лидеры недели"); lb.onclick=pbLeaders; row.appendChild(lb); }
  if(st.hist.length){ const hb=h("button",{type:"button"},pbIcon("book")+"Мои результаты"); hb.onclick=()=>openSheet("Мой пробник",pbHistBox(true)); row.appendChild(hb); }
  if(row.children.length) c.appendChild(row);
  return c;
}
/* карточка встаёт над модулями раздела «Задания ЕГЭ» */
const pbRenderPath=renderPath;
renderPath=function(app){
  pbRenderPath(app);
  if(!COURSE) return; const sec=COURSE.sections.find(x=>x.id===S.sec)||COURSE.sections[0];
  if(!sec||!sec.ege) return; const bar=app.querySelector(".secs"); if(bar) bar.after(pbCard());
};

/* ---------- вход: пояснение, режим, список номеров ---------- */
function pbShell(){ const el=$("#lesson"); el.hidden=false; document.body.style.overflow="hidden"; return el; }
function pbClose(){ clearInterval(PB_TIMER); PB=null; LS=null; $("#lesson").hidden=true; document.body.style.overflow=""; render(); }
function pbIntro(){
  const st=pbSt(); if(!st.opened){ st.opened=true; save(); }
  const el=pbShell(); let mode=st.cur?st.cur.mode:(st.lastMode||"exam");
  el.innerHTML='<div class="lesson-in"><div class="lhead"><button class="x" type="button" aria-label="Закрыть">'+I.close+'</button><div class="pb-hpill"><span>Пробник лайт</span></div></div><div class="lbody pb-intro" id="lbody"></div></div><div class="lfoot" id="lfoot"><div class="lfoot-in" id="lfoot-in"></div></div>';
  el.querySelector(".x").onclick=pbClose;
  const b=$("#lbody");
  b.appendChild(h("div",{class:"pb-h1"},"ПРОБНИК ЛАЙТ"));
  b.appendChild(h("div",{class:"pb-box"},'<p><b>Это задачи из настоящего ЕГЭ.</b> Формулировки как в демоверсии и реальных вариантах, вопросы те же, что на экзамене.</p><p>Отличие одно: данных меньше. Вместо поля 20×20 или файла на десятки тысяч строк здесь таблица, которую удобно решать на телефоне. Решение разбито на шаги, как в боссе модуля.</p>'));
  b.appendChild(h("div",{class:"pb-key"},'<b class="k">ВАЖНО</b>Номер засчитывается, если все шаги решены верно с первого раза: на экзамене одна ошибка в формуле — и ответ уже другой.'));
  if(st.cur){
    b.appendChild(h("div",{class:"pb-box"},'<p>У тебя есть незаконченный пробник ('+(st.cur.mode==="exam"?"зачёт":"тренировка")+'). Можно продолжить с того же места или начать заново.</p>'));
  } else {
    b.appendChild(h("div",{class:"pb-sec"},"Режим"));
    const modes=h("div",{class:"pb-modes"});
    [["exam","clock","Зачёт","Вариант недели, общий для всех. Таймер, без подсказок. Идёт в лидерборд"],["train","puzzle","Тренировка","Каждый раз новая задача. Подсказки и разбор после шага"]].forEach(([id,ic,t,d])=>{
      const m=h("button",{class:"pb-mode"+(mode===id?" sel":""),type:"button","aria-pressed":String(mode===id)},'<b>'+pbIcon(ic)+t+'</b><small>'+d+'</small>');
      m.onclick=()=>{ mode=id; modes.querySelectorAll(".pb-mode").forEach(x=>{ x.classList.toggle("sel",x===m); x.setAttribute("aria-pressed",String(x===m)); }); upd(); }; modes.appendChild(m); });
    b.appendChild(modes);
    /* тренировка: все номера или один */
    const pickBox=h("div",{class:"pb-pickwrap"});
    pickBox.appendChild(h("div",{class:"pb-sec"},"Что тренируем"));
    const picks=h("div",{class:"pb-picks"});
    [[0,"Все номера"]].concat(pbAvail().map(t=>[t.task,"№"+t.task+" · "+t.title])).forEach(([k,t])=>{
      const on=(st.trainOnly||0)===k, x=h("button",{class:"pb-pick"+(on?" sel":""),type:"button","aria-pressed":String(on)},esc(t));
      x.onclick=()=>{ st.trainOnly=k||null; save(); picks.querySelectorAll(".pb-pick").forEach(y=>{ y.classList.toggle("sel",y===x); y.setAttribute("aria-pressed",String(y===x)); }); haptic("tap"); upd(); };
      picks.appendChild(x); });
    pickBox.appendChild(picks); if(pbAvail().length>1) b.appendChild(pickBox);
  }
  b.appendChild(h("div",{class:"pb-sec"},"В пробнике"));
  const list=h("div",{class:"pb-list"});
  pbAvail().forEach(t=>list.appendChild(h("div",{class:"pb-row"},'<span class="n">'+t.task+'</span><div><b>'+esc(t.title)+'</b><small>≈ '+t.min+' минут на экзамене</small></div>')));
  if(!hasFull()) PB_TASKS.filter(t=>!t.free).forEach(t=>list.appendChild(h("div",{class:"pb-row off"},'<span class="n off">'+t.task+'</span><div><b>'+esc(t.title)+'</b><small>для учеников курса</small></div>'+pbIcon("lock"))));
  list.appendChild(h("div",{class:"pb-row"},'<span class="n off">+</span><div><b>Новые номера</b><small>добавятся, когда пройдём их на курсе</small></div>'));
  b.appendChild(list);
  const total=pbAvail().reduce((a,t)=>a+t.min,0);
  function upd(){
    if(st.cur){ const fi=$("#lfoot-in"); fi.innerHTML="";
      const again=h("button",{class:"pb-second",type:"button"},"Начать заново"); again.onclick=()=>{ st.cur=null; save(); pbIntro(); };
      const go=h("button",{class:"main",type:"button"},"Продолжить"); go.onclick=()=>pbResume(); fi.append(again,go); return; }
    const pb=b.querySelector(".pb-pickwrap"); if(pb) pb.hidden=mode!=="train";
    const only=pbTrainTask();
    footer(null,{btn:mode==="exam"?"Начать · "+total+" мин":"Начать тренировку"+(only?" · №"+only.task:""),on:()=>pbStart(mode)});
  }
  upd();
}

/* ---------- банк и выбор задач ---------- */
/* тренировка по одному номеру: S.pb.trainOnly = номер задания (null — все) */
const pbTrainTask=()=>{ const k=pbSt().trainOnly; return k?pbAvail().find(t=>t.task===k)||null:null; };
async function pbBank(t){
  if(PB_BANK[t.task]) return PB_BANK[t.task];
  const r=await fetch(t.file,{cache:"no-cache"}); if(!r.ok) throw new Error(r.status);
  return PB_BANK[t.task]=await r.json();
}
/* шаги варианта: общее (таблица, стены) лежит в base, у задания 9 формулы прошлых шагов складываются в pre (как в генераторе) */
function pbSteps(v){ const out=[], pre=[]; v.steps.forEach((s,i)=>{ const st=Object.assign({},v.base,s,{_i:i}); if(v.cum){ st.pre=pre.slice(); if(st.mode==="formula") pre.push({cell:st.cell,f:st.solution,fill:st.fill}); } out.push(st); }); return out; }
async function pbStart(mode){
  const st=pbSt(); st.lastMode=mode;
  const fi=$("#lfoot-in"); if(fi) fi.innerHTML='<div class="sr-loading"><i></i>Собираем вариант</div>';
  const only=mode==="train"?pbTrainTask():null;
  let banks; try{ banks=await Promise.all((only?[only]:pbAvail()).map(pbBank)); }catch(e){ toast("Не получилось загрузить задачи. Проверь интернет"); pbIntro(); return; }
  const wk=pbWeek();
  const ids=banks.map(B=>{
    if(mode==="exam") return B.week[wk.n%B.week.length].id;
    const fresh=B.train.filter(v=>!st.seen.includes(v.id)), pool=fresh.length?fresh:B.train;
    return pool[Math.floor(Math.random()*pool.length)].id; });
  if(mode==="train"){ st.seen=st.seen.concat(ids).slice(-150); }
  st.cur={mode, week:wk.key, ids, i:0, t0:Date.now(), sec:0, tasks:{}, theory:false};
  save(); pbResume();
}
function pbFind(id){ for(const k in PB_BANK){ const B=PB_BANK[k]; const v=B.train.find(x=>x.id===id)||B.week.find(x=>x.id===id); if(v) return v; } return null; }
async function pbResume(){
  const st=pbSt(), cur=st.cur; if(!cur) return pbIntro();
  try{ await Promise.all(pbAvail().map(pbBank)); }catch(e){ toast("Не получилось загрузить задачи. Проверь интернет"); return; }
  if(cur.i>=cur.ids.length) return pbResults();
  const v=pbFind(cur.ids[cur.i]); if(!v){ st.cur=null; save(); return pbIntro(); }
  cur.t0=Date.now()-cur.sec*1000;          // время идёт только пока пробник открыт
  pbRunTask(v);
}

/* ---------- задача: шаги урока со своей шапкой ---------- */
let PB_TIMER=null;
function pbRunTask(v){
  const cur=pbSt().cur, steps=pbSteps(v), limit=pbAvail().reduce((a,t)=>a+t.min,0)*60;
  PB={v, cur, res:{}, tries:{}, limit};
  LS={p:{id:"pb_"+v.task,title:"Пробник",steps}, queue:steps, pos:0, mistakes:0, redo:new Set(), xp:0, t0:Date.now(), fin:true, pb:true};
  const el=pbShell();
  el.innerHTML='<div class="lesson-in"><div class="lhead"><button class="x" type="button" aria-label="Выйти из пробника">'+I.close+'</button><div class="pb-hpill"><span>№'+v.task+' · '+(cur.i+1)+'/'+cur.ids.length+'</span><span class="tm">'+(cur.mode==="exam"?"":"тренировка")+'</span></div><button class="pb-theory" type="button">'+pbIcon("book")+'Теория</button><button class="x book" type="button" style="display:none"></button></div><div class="prog pb-prog"><i></i></div><div class="lbody" id="lbody"></div></div><div class="lfoot" id="lfoot"><div class="lfoot-in" id="lfoot-in"></div></div>';
  el.querySelector(".x").onclick=()=>{ pbSave(); pbClose(); toast("Пробник сохранён, можно продолжить позже"); };
  el.querySelector(".pb-theory").onclick=pbTheory;
  clearInterval(PB_TIMER);
  const tick=()=>{ const tm=el.querySelector(".tm"); if(!tm||!PB) return; cur.sec=Math.round((Date.now()-cur.t0)/1000);
    if(cur.mode==="exam"){ tm.textContent=pbTime(cur.sec)+"/"+pbTime(limit); tm.classList.toggle("over",cur.sec>limit); } };
  tick(); PB_TIMER=setInterval(tick,1000);
  showStep();
}
function pbSave(){ if(!PB) return; const cur=PB.cur; cur.sec=Math.round((Date.now()-cur.t0)/1000); save(); }

const pbShowStep=showStep;
showStep=function(){
  pbShowStep();
  if(!LS||!LS.pb||!PB) return;
  const st=LS.queue[LS.pos], b=$("#lbody"), n=LS.queue.length;
  const kind=b.querySelector(".kind"); if(kind) kind.innerHTML="Шаг "+(LS.pos+1)+" из "+n+" · "+esc(st.kind||"");
  const dots=h("div",{class:"pb-steps"}); for(let i=0;i<n;i++) dots.appendChild(h("i",{class:i<LS.pos?"d":i===LS.pos?"c":""}));
  if(kind) kind.after(dots);
  const cond=h("div",{class:"pb-cond"},'<span class="tag">Как в ЕГЭ · '+(/демоверси/.test(PB.v.src)?"тип из демоверсии 2027":"тип из реальных вариантов")+'</span><p>'+esc(PB.v.short)+'</p>');
  const more=h("button",{class:"more",type:"button"},"Полное условие ▾"); let open=false;
  const fullBox=h("div",{class:"pb-full",hidden:""},PB.v.full.split("\n").map(x=>PB.v.expr&&x.replace(/\u00a0/g," ")==="F = "+PB.v.expr?'<div class="tt-expr">'+esc(x)+'</div>':'<p>'+esc(x)+'</p>').join(""));
  more.onclick=()=>{ open=!open; fullBox.hidden=!open; more.textContent=open?"Свернуть ▴":"Полное условие ▾"; };
  cond.append(more,fullBox); b.prepend(cond);
  if(PB.cur.mode==="train"&&st.hint){
    const hb=h("button",{class:"reset pb-hint",type:"button"},"💡 Подсказка");
    hb.onclick=()=>hb.replaceWith(h("div",{class:"tip"},'<img class="px" src="'+catImg()+'" alt="ИНФиК"><p>'+st.hint+'</p>'));
    const q=b.querySelector("h2.q"); (q||kind).after(hb);
  }
  const pr=$("#lesson .pb-prog i"); if(pr) pr.style.width=(LS.pos/n*100)+"%";
};
const pbResolve0=resolve;
resolve=function(ok,step,detail){
  if(!LS||!LS.pb||!PB) return pbResolve0(ok,step,detail);
  const k=step._i; if(PB.res[k]===undefined) PB.res[k]=!!ok;
  if(PB.cur.mode==="exam"){ haptic("tap"); nextStep(); return; } // как на экзамене: без подсказки, верно или нет
  if(ok){ haptic("success"); sfx("ok"); footer("good",{head:PB.res[k]?PRAISE[Math.floor(Math.random()*PRAISE.length)]:"Теперь верно",text:step.why,btn:"Дальше",on:nextStep}); return; }
  haptic("error"); PB.tries[k]=(PB.tries[k]||0)+1;
  const lb=$("#lbody"); lb.classList.remove("shake"); void lb.offsetWidth; lb.classList.add("shake");
  if(PB.tries[k]<2){ footer("bad",{head:"Не так",text:(detail||"")+" Попробуй ещё раз"+(step.hint?" или открой подсказку":"")+".",btn:"Ещё раз",on:()=>{ showStep(); }}); return; }
  footer("bad",{head:"Разбор",text:(detail?detail+" ":"")+"Правильно так: "+step.why,btn:"Дальше",on:nextStep});
};
const pbFinish0=finish;
finish=function(){
  if(!LS||!LS.pb||!PB) return pbFinish0();
  const v=PB.v, cur=PB.cur;
  const steps=LS.queue.map(s=>({tag:s.tag,les:s.les,ok:PB.res[s._i]===true}));
  cur.tasks[v.task]={id:v.id, ok:steps.every(s=>s.ok), steps};
  cur.i++; pbSave(); save();
  if(cur.i<cur.ids.length){ pbResume(); return; }
  pbResults();
};
const pbClose0=closeLesson;
closeLesson=function(){ if(LS&&LS.pb){ pbSave(); pbClose(); return; } pbClose0(); };

/* ---------- теория по номеру ---------- */
function pbTheory(){
  if(!PB) return;
  if(PB.cur.mode==="exam"&&!PB.cur.theory){ PB.cur.theory=true; save(); }
  const box=h("div",{class:"pb-th"});
  if(PB.cur.mode==="exam") box.appendChild(h("p",{class:"note"},"В зачёте теория открыта, но результат получит пометку «с теорией»."));
  (PB_THEORY[PB.v.task]||[]).forEach(([t,x])=>box.appendChild(h("div",null,'<h3>'+t+'</h3><p>'+x+'</p>')));
  const les=[...new Set(LS.queue.map(s=>s.les).filter(Boolean))];
  if(les.length) box.appendChild(h("p",{class:"note"},"Подробно — в уроках: "+les.map(l=>"«"+(PB_LESSON[l]||l)+"»").join(", ")+". Ссылки будут в итогах."));
  openSheet("Теория · задание "+PB.v.task,box);
}

/* ---------- итог ---------- */
function pbResults(){
  clearInterval(PB_TIMER);
  const st=pbSt(), cur=st.cur; if(!cur){ pbClose(); return; }
  const tasks=cur.ids.map(id=>{ const v=pbFind(id); return {task:v.task, title:(PB_TASKS.find(t=>t.task===v.task)||{}).title||"", r:cur.tasks[v.task]||{ok:false,steps:[]}}; });
  const score=tasks.filter(t=>t.r.ok).length, max=tasks.length, full=max===PB_TASKS.length;
  const firstWeek=cur.mode==="exam"&&!st.hist.some(x=>x.mode==="exam"&&x.week===cur.week);
  const xp=score*(cur.mode==="exam"?(firstWeek?PB_XP.exam:0):PB_XP.train);
  const rec={d:today(), at:Date.now(), week:cur.week, mode:cur.mode, score, max, sec:cur.sec, theory:cur.theory,
    tasks:tasks.map(t=>({task:t.task, ok:t.r.ok, bad:(t.r.steps.find(s=>!s.ok)||{}).tag||""}))};
  st.hist.unshift(rec); st.hist=st.hist.slice(0,30); st.cur=null;
  if(xp){ S.xp+=xp; if(typeof leagueXp==="function") leagueXp(xp,"pb_"+cur.mode); }
  if(typeof bumpStreak==="function") bumpStreak();
  save(); haptic("success"); sfx("win");
  if(typeof track==="function") track("task_done","pb_"+cur.mode,{xp,m:max-score,s:cur.sec});
  const el=pbShell(); PB=null; LS=null;
  el.innerHTML='<div class="lesson-in"><div class="lhead"><button class="x" type="button" aria-label="Закрыть">'+I.close+'</button><div class="pb-hpill"><span>Итог</span></div></div><div class="lbody" id="lbody"></div></div><div class="lfoot" id="lfoot"><div class="lfoot-in" id="lfoot-in"></div></div>';
  el.querySelector(".x").onclick=pbClose;
  const b=$("#lbody");
  const lim=pbAvail().reduce((a,t)=>a+t.min,0)*60;
  b.appendChild(h("div",{class:"pb-score"},'<span>Пробник лайт · '+(cur.mode==="exam"?"зачёт":"тренировка")+'</span><b>'+score+' / '+max+'</b><span>'+plural(score,"первичный балл","первичных балла","первичных баллов")+' из пройденных номеров</span>'+
    '<div class="chips"><em>⏱ '+pbTime(cur.sec)+(cur.mode==="exam"?" из "+pbTime(lim):"")+'</em>'+(xp?'<em>+'+xp+' XP</em>':'')+(cur.theory?'<em>с теорией</em>':'')+'<em class="pb-place" hidden></em></div>'));
  b.appendChild(h("div",{class:"pb-sec"},"По заданиям"));
  const list=h("div",{class:"pb-list"});
  tasks.forEach(t=>list.appendChild(h("div",{class:"pb-row"},'<span class="n">'+t.task+'</span><div><b>'+esc(t.title)+'</b><div class="pb-stepmarks">'+
    t.r.steps.filter((s,i,a)=>a.findIndex(x=>x.tag===s.tag)===i).map(s=>{ const ok=t.r.steps.filter(x=>x.tag===s.tag).every(x=>x.ok); return '<em class="'+(ok?"":"x")+'">'+esc(s.tag)+'</em>'; }).join("")+'</div></div><span class="'+(t.r.ok?"ok":"bad")+'">'+(t.r.ok?"+1":"0")+'</span>')));
  b.appendChild(list);
  const bad=tasks.filter(t=>!t.r.ok&&t.r.steps.length);
  if(bad.length){
    b.appendChild(h("div",{class:"pb-sec"},"Где ошибка"));
    bad.forEach(t=>{ const s=t.r.steps.find(x=>!x.ok); const box=h("div",{class:"pb-trip"},'<b>'+t.task+' · '+esc(s.tag)+'</b><p>'+esc(PB_TAGMSG[s.tag]||"")+'</p>');
      if(s.les&&PB_LESSON[s.les]){ const go=h("button",{type:"button"},"Повторить урок «"+PB_LESSON[s.les]+"»"); go.onclick=()=>pbOpenLesson(s.les); box.appendChild(go); }
      b.appendChild(box); });
  }
  if(!isStudent()&&typeof egeOffer==="function") b.appendChild(egeOffer("probnik"));
  footer(null,{btn:cur.mode==="exam"?"Готово":"Ещё раз · новые задачи",on:()=>{ if(cur.mode==="exam") pbClose(); else pbStart("train"); }});
  /* на сервер: таблица результатов и лидеры недели */
  if(API_URL&&tg&&tg.initData) api("probnik_result",{mode:cur.mode, week:cur.week, ids:cur.ids.join(" "), score, max, full, sec:cur.sec, theory:cur.theory, grade:S.grade||"",
    tasks:rec.tasks.map(t=>t.task+":"+(t.ok?"+":"-")).join(" "), steps:tasks.map(t=>t.task+"|"+t.r.steps.map(s=>s.tag+(s.ok?"+":"-")).join(",")).join(" ; ")},2)
    .then(r=>{ if(r&&r.place&&cur.mode==="exam"){ const p=$("#lesson .pb-place"); if(p){ p.hidden=false; p.textContent="🏆 "+r.place+" место"; } } }).catch(()=>{});
}
function pbOpenLesson(id){
  let p=null; (COURSE?COURSE.sections:[]).forEach(s=>s.modules.forEach(m=>(m.lessons||[]).forEach(l=>{ if(l.id===id) p=l; })));
  if(!p){ toast("Урок не найден"); return; }
  pbClose(); startLesson(p);
}

/* ---------- лидеры недели ---------- */
async function pbLeaders(){
  const box=h("div",{class:"pb-lead"},'<div class="sr-loading"><i></i>Загружаем</div>');
  openSheet("Лидеры недели · зачёт",box);
  let r; try{ r=await api("probnik_top",{},2); }catch(e){ box.innerHTML='<p class="note">Не получилось загрузить, проверь интернет.</p>'; return; }
  box.innerHTML="";
  if(!r.leaders||!r.leaders.length){ box.appendChild(h("p",{class:"note"},"На этой неделе зачёт ещё никто не решал. Будь первым!")); return; }
  const ol=h("ol",{class:"pb-top"});
  r.leaders.forEach((x,i)=>ol.appendChild(h("li",{class:x.me?"me":""},'<span class="pl">'+(i+1)+'</span><b>'+esc(x.name)+'</b><span>'+x.score+'/'+x.max+' · '+pbTime(x.sec)+(x.theory?' · т':'')+'</span>')));
  box.appendChild(ol);
  if(r.me&&r.me.place>r.leaders.length) box.appendChild(h("p",{class:"note"},"Ты на "+r.me.place+" месте."));
  box.appendChild(h("p",{class:"note"},"В зачёт идёт лучшая попытка недели: сначала балл, потом время. «т» — решали с теорией. Новый вариант — в понедельник."));
}

/* ---------- «Мой пробник»: в шторке «Твой прогресс» и по кнопке в карточке ---------- */
function pbHistBox(big){
  const st=pbSt(), box=h("div",{class:"pb-hist"});
  if(!st.hist.length){ box.appendChild(h("p",{class:"note"},"Здесь появятся результаты пробников.")); return box; }
  if(!big) box.appendChild(h("h3",{class:"rw-h"},"Мой пробник"));
  /* где чаще ошибаюсь: по последним 10 попыткам */
  const recent=st.hist.slice(0,10), per={};
  recent.forEach(x=>x.tasks.forEach(t=>{ const p=per[t.task]||(per[t.task]={n:0,ok:0,bad:{}}); p.n++; if(t.ok) p.ok++; else if(t.bad) p.bad[t.bad]=(p.bad[t.bad]||0)+1; }));
  const g=h("div",{class:"pb-bars"});
  Object.keys(per).sort((a,b)=>a-b).forEach(k=>{ const p=per[k], pc=Math.round(100*p.ok/p.n), worst=Object.keys(p.bad).sort((a,b)=>p.bad[b]-p.bad[a])[0];
    g.appendChild(h("div",{class:"pb-bar"},'<span class="n">'+k+'</span><div><i style="width:'+pc+'%"></i></div><b>'+pc+'%</b>'+(worst?'<small>чаще всего: '+esc(worst)+'</small>':''))); });
  box.appendChild(g);
  const ul=h("ul",{class:"pb-hlist"});
  st.hist.slice(0,big?30:5).forEach(x=>ul.appendChild(h("li",null,'<span>'+esc(x.d.split("-").reverse().slice(0,2).join("."))+'</span><span>'+(x.mode==="exam"?"зачёт":"тренировка")+'</span><b>'+x.score+'/'+x.max+'</b><span>'+pbTime(x.sec)+'</span>')));
  box.appendChild(ul);
  return box;
}
const pbRewards0=openRewards;
openRewards=function(){
  pbRewards0();
  const st=pbSt(); if(!st.hist.length) return;
  const rw=[...document.querySelectorAll(".sheet .rw")].pop(); if(!rw) return;
  const stats=rw.querySelector(".rw-stats"); const box=pbHistBox(false); if(stats) stats.after(box); else rw.prepend(box);
};
