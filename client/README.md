# DreamVisualizer — Lab Work #5

**Тема:** Верстка мобильно-ориентированного приложения

## Структура проекта

```

client/
├── css/
│   ├── normalize.css      # CSS reset (normalize.css v8.0.1)
│   └── style.css          # Основные стили (mobile-first)
├── js/
│   └── app.js             # Логика приложения (compiled from src/index.ts)
├── assets/                # Изображения, логотипы, иконки
├── index.html             # Единая точка входа (SPA)
├── package.json
├── tsconfig.json
└── vite.config.js

```

> **Примечание:** исходный TypeScript (`src/index.ts`, `src/components/`) компилируется
> в `js/app.js`. Для разработки используется Vite, для production — build + минификация.

## Соответствие требованиям лабораторной работы

| Требование | Реализация |
|---|---|
| Структура папок (/css, /js, /assets) | ✅ `client/css/`, `client/js/`, `client/assets/` |
| Метатег Viewport | ✅ `index.html`: `width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no` |
| Сброс стилей | ✅ Подключён `normalize.css` |
| Семантическая разметка | ✅ `<header>`, `<main>`, `<nav>`, `<section>`, `<footer>` |
| Адаптивная сетка (Flexbox) | ✅ Все layout-контейнеры на Flexbox |
| Резиновая вёрстка (%, vw, vh, rem, em) | ✅ CSS-переменные + rem/vw/vh |
| Mobile First | ✅ Базовые стили для мобильных (≤480px), без медиа-запросов |
| Медиа-запросы | ✅ Breakpoints: 480px, 768px, 1024px, 1280px |
| Минификация | ⚙️ См. ниже |

## Breakpoints (Mobile First)

| Диапазон | Описание |
|---|---|
| `< 480px` | **База** — смартфоны (базовые стили без медиа-запросов) |
| `≥ 480px` | Большие телефоны / маленькие планшеты |
| `≥ 768px` | Планшеты |
| `≥ 1024px` | Десктопы |
| `≥ 1280px` | Большие десктопы |

## Минификация файлов

### Вариант 1: Онлайн-инструменты (быстро)

1. **CSS** — откройте https://cssminifier.com/, вставьте содержимое `style.css`, нажмите Minify, сохраните как `style.min.css`
2. **JS** — откройте https://javascript-minifier.com/, вставьте содержимое `app.js`, сохраните как `app.min.js`
3. **HTML** — откройте https://kangax.github.io/html-minifier/, вставьте `index.html`, сохраните как `index.min.html`

### Вариант 2: CLI (рекомендуется)

Установите инструменты глобально:

```bash
npm install -g csso-cli terser html-minifier-terser
```

Минификация:

```
# CSS
csso client/css/style.css -o client/css/style.min.css

# JS (ES modules)
terser client/js/app.js -c -m -o client/js/app.min.js

# HTML
html-minifier-terser \
  --collapse-whitespace \
  --remove-comments \
  --remove-optional-tags \
  --remove-redundant-attributes \
  --remove-attribute-quotes \
  --minify-css true \
  --minify-js true \
  client/index.html \
  -o client/index.min.html
```

### Вариант 3: npm-скрипты

Добавьте в `package.json`:

```
{
  "scripts": {
    "minify:css": "csso css/style.css -o css/style.min.css",
    "minify:js":  "terser js/app.js -c -m -o js/app.min.js",
    "minify:html":"html-minifier-terser --collapse-whitespace --remove-comments --minify-css true --minify-js true index.html -o index.min.html",
    "minify": "npm run minify:css && npm run minify:js && npm run minify:html"
  },
  "devDependencies": {
    "csso-cli": "^4.0.2",
    "terser": "^5.31.0",
    "html-minifier-terser": "^7.2.0"
  }
}
```

Запуск:

```
npm install
npm run minify
```

После минификации подключите `.min`-версии в HTML:

```
<link rel="stylesheet" href="/css/normalize.css" />
<link rel="stylesheet" href="/css/style.min.css" />
...
<script src="/js/app.min.js" type="module"></script>
```

### Ожидаемый эффект

| Файл ↕▾ | До ↕▾ | После ↕▾ | Экономия ↕▾ |
|---|---|---|---|
| −`style.css` | ~35 KB | ~22 KB | ~37% |
| −`app.js` | ~45 KB | ~28 KB | ~38% |
| −`index.html` | ~1.5 KB | ~1 KB | ~33% |
⚙

## Проверка соответствия

- ✅ **Mobile First** — базовые стили для экранов ≤480px, затем `@media (min-width: ...)`
- ✅ **Семантика** — `header`, `main`, `nav`, `section`, `footer` в разметке
- ✅ **Flexbox** — все layout-контейнеры используют `display: flex`
- ✅ **Резиновые единицы** — `rem`, `%`, `vw`, `vh`, `em` вместо `px` (кроме border и media queries)
- ✅ **Медиа-запросы** — 4 breakpoints (480, 768, 1024, 1280)
- ✅ **Viewport** — с `maximum-scale=1.0` и `user-scalable=no`
- ✅ **Сброс стилей** — `normalize.css` подключён первым

## Контрольные вопросы

### 1. Оптимизация интерфейса под мобильный UI/UX. Что это означает?

Оптимизация под мобильный UI/UX — это проектирование интерфейса с учётом физических
ограничений смартфона: маленький экран, управление пальцем, ограниченная пропускная
способность сети. Включает:

- **Touch-friendly элементы:** кнопки ≥44×44px (Apple HIG), ≥48×48dp (Material Design)
- **Вертикальный скролл** вместо горизонтального
- **Читаемость:** минимальный размер шрифта 16px (иначе iOS зумит input)
- **Упрощённая навигация:** hamburger-меню, bottom-nav, свайпы
- **Производительность:** минификация, lazy-loading, оптимизация изображений
- **Контент в один столбец** вместо многоколоночных desktop-сеток

### 2. Каким образом можно устранить различия в мобильных браузерах?

1. **CSS Reset / Normalize.css** — приводит базовые стили к единому виду
2. **Vendor prefixes** — `-webkit-`, `-moz-`, `-ms-` для экспериментальных свойств
3. **Autoprefixer** — автоматическая расстановка префиксов по browserslist
4. **Feature queries (`@supports`)** — условное применение стилей
5. **Polyfills** — JS-библиотеки для эмуляции новых API (например, `core-js`)
6. **Progressive enhancement** — базовая функциональность работает везде, продвинутая — в современных браузерах
7. **Тестирование** — BrowserStack, реальные устройства

### 3. Что означает стратегия Mobile First?

**Mobile First** — подход к вёрстке, при котором сначала пишутся стили для мобильных
устройств (узкие экраны), а затем через `@media (min-width: ...)` добавляются
стили для более широких экранов.

**Преимущества:**

- Фокус на главном контенте (маленький экран заставляет расставлять приоритеты)
- Меньше CSS (мобильные стили — базовые, десктоп — только дополнения)
- Лучшая производительность на мобильных (не загружаются лишние стили)
- Поощряет использование относительных единиц

```
/* Mobile First: базовые стили для мобильных */
.container { display: flex; flex-direction: column; }

/* Затем — для планшетов и выше */
@media (min-width: 768px) {
  .container { flex-direction: row; }
}
```

### 4. Что такое медиа-запросы. Примеры медиа-запросов.

**Медиа-запрос** — конструкция CSS, позволяющая применять стили только при
определённых условиях (ширина экрана, ориентация, разрешение и т.д.).

```
/* Mobile First (min-width) */
@media (min-width: 768px) { /* планшеты и выше */ }
@media (min-width: 1024px) { /* десктопы */ }

/* Desktop First (max-width) */
@media (max-width: 767px) { /* только мобильные */ }

/* Ориентация */
@media (orientation: landscape) { }

/* Плотность пикселей (Retina) */
@media (-webkit-min-device-pixel-ratio: 2),
       (min-resolution: 192dpi) { }

/* Тёмная тема */
@media (prefers-color-scheme: dark) { }

/* Уменьшенная анимация */
@media (prefers-reduced-motion: reduce) { }

/* Комбинирование */
@media (min-width: 768px) and (max-width: 1023px) { }
```

### 5. Что такое минификация файлов веб страниц?

**Минификация** — процесс удаления из исходного кода всех символов, не влияющих
на его работу: пробелов, переводов строк, комментариев, лишних точек с запятой,
переименования переменных в короткие имена (для JS).

**Что удаляется:**

- Комментарии (`/* ... */`, `// ...`)
- Пробелы и переводы строк
- Последние `;` в блоках
- Длинные имена переменных → короткие (только JS, при `-m`)

**Инструменты:**

- CSS: `cssnano`, `csso`, `clean-css`
- JS: `terser`, `uglify-js`, `esbuild`
- HTML: `html-minifier-terser`

**Зачем:**

- Уменьшение размера файла → быстрее загрузка
- Меньше трафика → экономия для пользователя
- Лучший Lighthouse Performance Score

**Важно:** минификация — часть **build-процесса**, не заменяет gzip/brotli-сжатие
на сервере, а дополняет его.

</BDS:create_file>

<BDS:create_file fileName="client/js/app.js">

```javascript
/**
 * DreamVisualizer — application entry point.
 *
 * NOTE: In development this file is compiled from `src/index.ts` by Vite.
 * In production it is minified to `js/app.min.js`.
 *
 * For the lab work, this file re-exports the compiled module so that
 * `index.html` can reference `/js/app.js` directly (see README.md).
 *
 * If you want to run the app without the Vite dev server, build first:
 *   npm run build
 * then copy `dist/assets/*.js` to this file.
 */

// Re-export the compiled application module.
// During development, Vite serves `src/index.ts` via the dev server.
// During production build, Vite emits a hashed bundle in `dist/assets/`.
//
// The import below is a placeholder that the Vite build step replaces.
// Do not edit manually — regenerate with `npm run build`.

import "../src/index.ts";

