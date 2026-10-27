# Модуль 2 «Переменные и ввод»: инструкция для Claude в VS Code

Скопируй этот текст в Claude в VS Code целиком и приложи папку `infik-m2` (или распакуй её рядом с проектом).

---

Привет! Нужно добавить в проект ИНФиК модуль 2 и новый движок Python. Всё подготовлено и проверено, твоя задача — аккуратно перенести это в проект, не затирая другие правки.

## 1. Новый движок Python — заменить файл целиком

Замени `js/python.js` на `infik-m2/js/python.js`. Это единственный файл, который меняется целиком: в нём только движок (`runPy`, `PyErr`) и подсветка (`esc`, `hl`).

Что изменилось:
- `runPy(code, input)` — второй аргумент новый: строки, которые «вводит пользователь» (массив). Без него всё работает как раньше.
- Понимает переменные, `input`, `int/float/str`, `type`, `+=`, условия, циклы, строки, списки, функции, f-строки. Тексты ошибок совпадают с Python 3.13.
- Синтаксическая ошибка теперь находится до запуска, поэтому программа с ней ничего не выводит (как настоящий Python).
- Бесконечный цикл останавливается сам с ошибкой `TimeoutError`.

Если в старом `js/python.js` были свои правки в `hl()` (подсветка), перенеси их в новый файл.

## 2. Уроки

Скопируй папку `infik-m2/content/m2/` в `content/m2/` (7 файлов: `l1.json` … `l6.json`, `boss.json`).

## 3. Правки в остальных файлах

Есть готовый патч: `infik-m2/infik-m2-ui.patch` (`git apply infik-m2/infik-m2-ui.patch`). Если он не применяется из-за других изменений, сделай то же вручную:

**`js/editor.js`**, три места — передать ввод в `runPy`:
- в `ideView`: `runPy(c==null?code:c)` → `runPy(c==null?code:c,opts.input)`;
- в `codeEntry`, кнопка «Запустить»: `runPy(api.code)` → `runPy(api.code,st.input)`;
- в `codeEntry`, `api.run`: `runPy(api.code)` → `runPy(api.code,st.input)`.

**`js/lesson.js`:**
- в `showStep()` перед строкой с `expectBlock` добавить:
  `if(st.input&&st.type!=="theory") b.appendChild(inputBlock(st.input));`
- в `theoryCard()` перед строкой с `ideView` добавить `if(st.input) f.appendChild(inputBlock(st.input));`, а в сам вызов передать `input:st.input`: `ideView(st.code,{run:st.run,input:st.input})`;
- в `choice`, `bug`, `indent`, `parsons` в каждый вызов `ideView(...)` добавить в опции `input:st.input`;
- рядом с `expectBlock` добавить функцию:
  ```js
  /* блок «Пользователь вводит»: что программа получит через input(), по строке на каждый ввод */
  function inputBlock(lines){
    return h("div",{class:"expect inp"},'<div class="th">Пользователь вводит</div><pre>'+esc(lines.join("\n"))+'</pre>');
  }
  ```

**`css/app.css`** — после правила `.expect pre{...}` добавить:
```css
.expect.inp{border-left-color:var(--purple-ink)}
```

**`js/icons.js`** — в `LESSON_SPR` после `snake` добавить иконки уроков модуля 2:
```js
 box:["..........",".WWWWWWWW.",".W......W.",".WWWWWWWW.",".W.LLLL.W.",".W......W.",".W......W.",".W......W.",".WWWWWWWW.",".........."],
 tag:["..........","..LLLLLLL.",".LLLLLLLL.","LLNLWWWWL.","LLLLLLLLL.","LLLLWWWLL.",".LLLLLLLL.","..LLLLLLL.","..........",".........."],
 types:["..........",".WW..LLL..","WWW.L...L.",".WW.L...L.",".WW.LLLLL.",".WW.L...L.",".WW.L...L.","WWWWL...L.","..........",".........."],
 kbd:["..........","..........","WWWWWWWWWW","W.W.W.W.WW","WWWWWWWWWW","WW.W.W.W.W","WWWWWWWWWW","W..LLLL..W","WWWWWWWWWW",".........."],
 convert:["LL.LL.....",".L..L.....","..........",".....L....","LLLLLLL...",".....L....","..........","...WWWW...","..WW..WW..","...WWWW..."],
 plus:["..........","..LL......","..LL......","LLLLLL....","LLLLLL....","..LL..WWWW","..LL......","......WWWW","..........",".........."]
```

**`content/course.json`:**
- у раздела `s1` поле `about`: `"print, переменные, условия, циклы, строки, списки, функции"`;
- модуль `m2`: убрать `"ege"`, добавить `"about": "Переменные, ввод с клавиатуры, типы данных."` и список уроков:
  ```json
  "lessons": [
   {"id": "m2l1", "title": "Что такое переменная", "file": "content/m2/l1.json", "icon": "box"},
   {"id": "m2l2", "title": "Имена и перезапись", "file": "content/m2/l2.json", "icon": "tag"},
   {"id": "m2l3", "title": "Типы данных", "file": "content/m2/l3.json", "icon": "types"},
   {"id": "m2l4", "title": "Ввод с клавиатуры", "file": "content/m2/l4.json", "icon": "kbd"},
   {"id": "m2l5", "title": "Текст в число", "file": "content/m2/l5.json", "icon": "convert"},
   {"id": "m2l6", "title": "Изменяем переменные", "file": "content/m2/l6.json", "icon": "plus"},
   {"id": "m2boss", "title": "Задача-босс", "file": "content/m2/boss.json", "boss": true, "icon": "snake"}
  ]
  ```
- у модулей `m3`, `m4`, `m5` удалить поле `"ege"` (первый раздел теперь без номеров заданий ЕГЭ);
- после `m5` добавить закрытые модули: `{"id": "m6", "title": "Цикл while"}`, `{"id": "m7", "title": "Строки"}`, `{"id": "m8", "title": "Списки"}`, `{"id": "m9", "title": "Функции"}`.

## 4. Проверка

1. Открой приложение, пройди урок 1 модуля 1: всё должно работать как раньше.
2. Открой урок «Ввод с клавиатуры» модуля 2: над кодом должен быть блок «Пользователь вводит», а после «Запустить» в выводе — и ввод, и ответ программы.
3. В задании «Напиши сам» в конце урока набери `food = input()` и `print("Я тоже люблю", food)` — должно засчитаться.

## Новое поле в уроках: `input`

У любого шага может быть `"input": ["Аня", "16"]` — что пользователь вводит, по строке на каждый `input()`. В терминале, как в настоящем, видны и подсказка, и введённый текст, поэтому `expect` и `check` считают ввод отдельными строками вывода.
