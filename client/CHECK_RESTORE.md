# Как проверить, что всё работает

## 1. Структура после распаковки

```

D:\ab\client
├── css
│   ├── normalize.css       (был)
│   ├── style.css           (был)
│   ├── dark-mobile.css     (был, для мобильной тёмной темы)
│   └── desktop-nav.css     ← НОВЫЙ
├── src
│   ├── components
│   │   └── burger-menu.ts  (был)
│   └── index.ts            ← ОБНОВЛЁННЫЙ
├── index.html              ← ОБНОВЛЁННЫЙ (4 CSS)
└── package.json и др.

```

## 2. Запуск

Backend (терминал 1):
```bash
cd D:\ab
npm run dev
# Server running on port 3000
```

Frontend (терминал 2):

```
cd D:\ab\client
npx vite
# Local: http://localhost:5173/
```

## 3. Проверка мобильной версии (≤767px)

DevTools → Toggle device toolbar (Ctrl+Shift+M) → iPhone SE:

- □  
Верх: слева ≡, по центру лого, справа пусто
- □  
Клик на ≡ → выезжает панель слева
- □  
В панели: Все сны / Избранное / История / Выйти
- □  
Всё тёмное

## 4. Проверка десктопа (≥768px)

DevTools → Responsive → ширина 1280px:

- □  
Верх: лого по центру, справа: Все сны / Избранное / История / Выйти →
- □  
Бургера ≡ НЕТ
- □  
Клики по кнопкам работают
- □  
Активный пункт подсвечен фиолетовым (#a73cff)

## 5. Если что-то не работает

**Не видно бургера на мобильном** → проверьте, что `dark-mobile.css` подключён.

**Не видно инлайн-кнопок на десктопе** → проверьте, что `desktop-nav.css` подключён последним в `<head>`.

**Кнопки есть, но не кликаются** → откройте консоль, поищите ошибки. Скорее всего `setupDesktopNavHandlers()` не вызван. Он вызывается внутри `mountBurgerMenu()`, которая должна быть вызвана на каждой dream-странице (`renderDreamCreatePage`, `renderDreamListPage`, `renderDreamDetailPage`, `renderDreamForeignDetailPage`).

**Логотип не по центру на десктопе** → в `desktop-nav.css` правило `.dream-nav-center { position: absolute; left: 50%; transform: translateX(-50%); }` должно быть. Проверьте, что файл подключён.

