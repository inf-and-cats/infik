Исправь фильтр задачника в «Практике» (js/practice.js и css/practice.css). Работай поверх текущей версии.

1. Функцию `modPassed(id)` замени на `modReached(id)`: модуль считается доступным, если его порядковый номер не больше номера самого дальнего модуля, где пройден хотя бы один урок (`S.done`). Начал модуль 3, значит видишь задачи модулей 1–3.
   ```js
   function modReached(id){
     if(!COURSE) return false;
     let reached=-1, idx=-1, k=0;
     for(const sec of COURSE.sections) for(const M of sec.modules){ if(M.id===id) idx=k; if(M.lessons&&M.lessons.some(p=>S.done[p.id])) reached=k; k++; }
     return idx>=0&&idx<=reached;
   }
   ```
   В `renderPractice`: `const can=t=>modReached(t.need)`.
2. Вкладку «Мне по силам» переименуй в «По пройденному».
3. Во «Всех задачах» убери замочек: задачи по темам впереди открываются, поэтому замок вводит в заблуждение. Вместо класса `lock` используй класс `ahead` (бледная карточка, `opacity:.6`), под названием подпись `<small class="pr-ahead">тема впереди</small>`, справа как обычно «+N XP».
   CSS: `.pr-task.ahead{opacity:.6}`, `.pr-task.ahead .pr-xp{color:var(--ink-soft)}`, `.pr-ahead{font-size:12px;color:var(--ink-soft);font-weight:700}`. Старые правила `.pr-task.lock` удалить.
4. Тексты: под фильтром «Здесь задачи по темам модулей, которые ты уже начал.» и во «Всех задачах» «Бледные задачи по темам, до которых ты ещё не дошёл, но решать их можно.» В пустом состоянии «Пройди первый урок на Пути, и здесь появятся задачи.»
