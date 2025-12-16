# Tavern Tapper - Pixel Bar Game PWA

Игра-симулятор бара в пиксельном стиле DnD таверны.

## Структура проекта

```
webte1_semestralne/
├── index.html              # Главная страница
├── manifest.webmanifest    # PWA манифест
├── service-worker.js       # Service Worker для PWA
├── src/
│   ├── css/
│   │   └── style.css      # Стили (пиксельный дизайн)
│   ├── js/
│   │   ├── main.js        # Основная логика игры
│   │   ├── iconMap.js     # Маппинг иконок
│   │   └── data/
│   │       └── levels.json # Уровни и рецепты
│   └── assets/
│       ├── icons/         # Иконки ингредиентов
│       └── background/    # Фон таверны (tavern-bg.png)
```

## Установка и запуск

1. Поместите фоновое изображение таверны в `src/assets/background/tavern-bg.png`
2. Откройте `index.html` в браузере или запустите локальный сервер:
   ```bash
   # Python
   python -m http.server 8000
   
   # Node.js
   npx serve .
   ```
3. Откройте http://localhost:8000

## Особенности

- ✅ PWA (можно установить как приложение)
- ✅ Drag & Drop ингредиентов
- ✅ Touch поддержка для мобильных
- ✅ Пиксельные диалоговые окна над посетителями
- ✅ Валидация рецептов
- ✅ Система уровней с прогрессом
- ✅ Таймеры для каждого заказа
- ✅ Поворот ингредиентов (клавиша R)
- ✅ Изменение скорости налива
- ✅ Сохранение прогресса в localStorage
- ✅ Печать инструкций (скрывает игровое поле)

## Управление

- **Перетаскивание**: Drag & Drop ингредиентов с барной стойки в зону приготовления
- **Touch**: Tap-and-hold для мобильных устройств
- **Поворот**: Кнопка "Rotate" или клавиша R
- **Скорость**: Слайдер "Speed"
- **Подача**: Кнопка "Serve" после приготовления напитка

## Добавление новых уровней

Отредактируйте `src/js/data/levels.json` и добавьте новый объект уровня:

```json
{
  "id": 9,
  "name": "New Level",
  "timeLimit": 90,
  "target": 5,
  "ingredients": [
    { "id": "gin", "label": "Gin" },
    { "id": "lime", "label": "Lime" }
  ],
  "orders": [
    {
      "name": "Gin & Tonic",
      "tags": ["gin", "refreshing"],
      "shortHint": "Gin + tonic",
      "hint": "Pour gin, add tonic water, lime garnish",
      "steps": ["Glass", "Gin 40%", "Tonic", "Lime"]
    }
  ]
}
```

Система автоматически подхватит новый уровень!

## Требования

- Современный браузер с поддержкой ES6 модулей
- Chrome/Firefox (оптимизировано)
- Для PWA: HTTPS или localhost


