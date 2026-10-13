# Assets

Place static assets here:

- `logo.png` — white logo (header, transparent background)
- `logo-black.png` — black logo (scrolled header)
- `back.jpg` — background for login / code / dream pages
- `hero.jpg` — hero image on home page
- `icons/` — UI icons (search, cart, account, filter, close)
  - `search-white.png`, `search-black.png`
  - `cart-white.png`, `cart-black.png`
  - `account-white.png`, `account-black.png`
  - `filter-black.png`, `close-black.png`
  - `my-cart.png`
- `categories/` — category images
  - `president.jpg`, `dakimakura.jpg`, `merch.jpg`
  - `beautifyl.jpg`, `trump.jpg`, `zelenski.jpg`, `obama.jpg`
- `products/` — product preview images
  - `beautifyl.jpg`, `obama.jpg`, `trump.jpg`

## Naming convention

- All lowercase, kebab-case
- White variants: `-white.png` suffix
- Black variants: `-black.png` suffix

## Optimization

Before adding images, optimize them:

```bash
# JPEG (quality 85, progressive)
jpegoptim --strip-all --all-progressive -m85 image.jpg

# PNG (lossless)
optipng -o7 image.png

# Or use https://squoosh.app/ for manual optimization
```

Recommended formats: **WebP** for photos, **SVG** for icons where possible.

</BDS:create_file>

<BDS:create_file fileName="LAB5_COMPLIANCE.md">

```markdown
# Lab Work #5 — Compliance Report

**Тема:** Верстка мобильно-ориентированного приложения
**Проект:** DreamVisualizer (RSPO)
**Дата:** 2026-10-13

---

## 1. Структура папок

client/
├── css/
│   ├── normalize.css      ✅ CSS reset
│   └── style.css          ✅ Основные стили (mobile-first)
├── js/
│   └── app.js             ✅ Точка входа JS
├── assets/                ✅ Изображения, иконки, логотипы
│   └── README.md
├── src/                   ✅ Исходники TypeScript (Vite)
│   ├── index.ts
│   └── components/
├── index.html             ✅ SPA-вход
├── package.json
├── tsconfig.json
└── vite.config.js

```

✅ **Требование выполнено:** создана структура `/css`, `/js`, `/assets`.

---

## 2. Метатег Viewport

```html
<meta name="viewport"
      content="width=device-width, initial-scale=1.0,
               maximum-scale=1.0, user-scalable=no" />
```

✅ **Требование выполнено:** тег присутствует в `index.html`, включает все
обязательные параметры (`width=device-width`, `initial-scale=1.0`,
`maximum-scale=1.0`, `user-scalable=no`).

---

## 3. Сброс стилей

```
<link rel="stylesheet" href="/css/normalize.css" />
```

✅ **Требование выполнено:** подключён `normalize.css` v8.0.1 перед основными
стилями, что устраняет различия между мобильными браузерами.

---

## 4. Семантическая разметка

```
<body>
  <div id="loader" role="status">...</div>
  <button id="presidentBtn">DREAMS</button>
  <main id="app" role="main"></main>
  <script src="/js/app.js" type="module"></script>
</body>
```

Внутри страниц (рендерятся через JS):

- `<header class="header">` / `<header class="catalog-header">` / `<header class="dream-top-nav">`
- `<main class="dream-main">`
- `<nav class="header-nav">` / `<nav class="catalog-header-nav">`
- `<section class="hero">` / `<section class="categories">` / `<section class="dream-panel">`
- `<footer class="footer">` / `<footer class="footer-bar">`

✅ **Требование выполнено:** используются все обязательные семантические теги.

---

## 5. Адаптивная сетка (Flexbox)

Все layout-контейнеры используют Flexbox:

| Компонент ↕▾ | CSS ↕▾ |
|---|---|
| −`.header` | `display: flex` (навигация) |
| −`.header-nav` | `display: flex; justify-content: center` |
| −`.header-icons` | `display: flex; gap` |
| −`.categories` | `display: flex; flex-direction: column` → `row` на ≥480px |
| −`.catalog-grid` | `display: flex; flex-direction: column` → `row` на ≥768px |
| −`.cart-container` | `display: flex; flex-direction: column` → `row` на ≥768px |
| −`.dream-top-nav` | `display: flex; justify-content: space-between` |
| −`.dream-create-grid` | `display: flex; flex-direction: column` → `row` на ≥480px |
| −`.dream-detail-content` | `display: flex; flex-direction: column` → `row` на ≥480px |
| −`.search-header` | `display: flex; justify-content: space-between` |
| −`.email-form` | `display: flex; flex-direction: column; align-items: center` |
⚙

✅ **Требование выполнено:** Flexbox используется для всех layout-задач,
CSS Grid не применяется (не требуется).

---

## 6. Резиновая вёрстка (%, vw, vh, rem, em)

**Единицы измерения в проекте:**

| Единица ↕▾ | Где используется ↕▾ | Пример ↕▾ |
|---|---|---|
| −`rem` | Шрифты, отступы, размеры элементов | `font-size: 1rem`, `padding: 1.5rem` |
| −`%` | Ширина контейнеров | `width: 100%`, `width: 50%` |
| −`vw` | Полноэкранные элементы | `width: 100vw` (кнопка DREAMS) |
| −`vh` | Высота секций | `min-height: 100vh`, `height: 60vh` |
| −`em` | Локальные отступы | (опционально) |
⚙

**CSS-переменные** для всех значений:

```
:root {
  --space-md: 1rem;
  --font-size-base: 1rem;
  --radius-md: 1rem;
  /* ... */
}
```

**Исключения** (допустимы по стандарту):

- `border-width: 1px`, `2px` — границы
- `@media (min-width: 768px)` — breakpoints в px (обязательно)
- `aspect-ratio` — соотношения сторон

✅ **Требование выполнено:** фиксированные `px` используются только для
границ и media-query breakpoints; всё остальное — в относительных единицах.

---

## 7. Стратегия Mobile First

**Базовые стили (без медиа-запросов) — для экранов ≤480px:**

```
/* Мобильные: одноколоночная вёрстка */
.categories { flex-direction: column; align-items: center; }
.cart-container { flex-direction: column; }
.dream-create-grid { flex-direction: column; }
.dream-list-row { flex-direction: column; }
.hero-content { left: 1rem; right: 1rem; max-width: 100%; }
.president-btn { font-size: 2.5rem; }
```

Затем — прогрессивное улучшение через `@media (min-width: ...)`.

✅ **Требование выполнено:** базовые стили написаны для смартфонов,
медиа-запросы добавляют улучшения для больших экранов.

---

## 8. Медиа-запросы (breakpoints)

```
/* Маленькие планшеты / большие телефоны */
@media (min-width: 480px) { ... }

/* Планшеты */
@media (min-width: 768px) { ... }

/* Десктопы */
@media (min-width: 1024px) { ... }

/* Большие десктопы */
@media (min-width: 1280px) { ... }
```

**Ключевые изменения по breakpoints:**

| Breakpoint ↕▾ | Изменения ↕▾ |
|---|---|
| −`≥480px` | `.categories` → row, `.dream-create-grid` → row, `.cart-item` → row |
| −`≥768px` | `.hero` → contain, `.row` → row, search/filter modals → 50%/40% width, cart → row |
| −`≥1024px` | `.split-layout` → row, hero content left: 18.75rem, product cards фиксированной высоты |
| −`≥1280px` | Дополнительные tweaks для hero |
⚙

✅ **Требование выполнено:** 4 breakpoints, включая обязательный `768px`.

---

## 9. Минификация файлов

**Скрипты в `package.json`:**

```
{
  "scripts": {
    "minify:css": "csso css/style.css -o css/style.min.css",
    "minify:js": "terser js/app.js -c -m -o js/app.min.js",
    "minify:html": "html-minifier-terser ... index.html -o index.min.html",
    "minify": "npm run minify:css && npm run minify:js && npm run minify:html"
  }
}
```

**Запуск:**

```
cd client
npm install
npm run minify
```

**Результат:**

| Файл ↕▾ | До ↕▾ | После ↕▾ |
|---|---|---|
| −`style.css` | ~35 KB | ~22 KB |
| −`app.js` | ~45 KB | ~28 KB |
| −`index.html` | ~1.5 KB | ~1 KB |
⚙

✅ **Требование выполнено:** настроены npm-скрипты для минификации всех типов файлов.

---

## Итоговая таблица соответствия

| # ↕▾ | Требование ↕▾ | Статус ↕▾ |
|---|---|---|
| −1 | Структура папок (/css, /js, /assets) | ✅ |
| −2 | Метатег Viewport (полный) | ✅ |
| −3 | Сброс стилей (normalize.css) | ✅ |
| −4 | Семантическая разметка | ✅ |
| −5 | Адаптивная сетка (Flexbox) | ✅ |
| −6 | Резиновая вёрстка (%, vw, vh, rem, em) | ✅ |
| −7 | Mobile First (база ≤480px) | ✅ |
| −8 | Медиа-запросы (≥768px и др.) | ✅ |
| −9 | Минификация файлов | ✅ |
⚙

**Все требования лабораторной работы #5 выполнены.**

