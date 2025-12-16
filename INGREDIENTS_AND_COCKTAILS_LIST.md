# Полный список ингредиентов и коктейлей

## 📍 Где находятся данные:

1. **Ингредиенты** - в файле `src/js/data/levels.json` (массив `ingredients` в каждом уровне)
2. **Коктейли (заказы)** - в файле `src/js/data/levels.json` (массив `orders` в каждом уровне)
3. **Маппинг картинок для ингредиентов** - в файле `src/js/iconMap.js`
4. **Маппинг картинок для готовых коктейлей** - в функции `getTraySpriteForOrder()` в `src/js/main.js` (строки 909-925)

---

## 🥤 ВСЕ ИНГРЕДИЕНТЫ (по уровням):

### Уровень 1:
- (нет ингредиентов)

### Уровень 2:
- `cola` - Cola

### Уровень 3:
- `rum` - Rum
- `cola` - Cola
- `lime` - Lime wedge
- `ice` - Ice cubes

### Уровень 4:
- `rum` - Rum
- `cola` - Cola
- `lime` - Lime wedge
- `ice` - Ice cubes
- `mint` - Mint leaves
- `syrup` - Sugar syrup
- `soda` - Soda water

### Уровень 5:
- `gin` - Gin
- `tonic` - Tonic water
- `lime` - Lime wedge
- `ice` - Ice cubes
- `highball` - Tall glass (посуда)

### Уровень 6:
- `whiskey` - Whiskey
- `bitters` - Bitters
- `syrup` - Sugar syrup
- `orange` - Orange peel
- `ice` - Ice cubes
- `rocks` - Rocks glass (посуда)

### Уровень 7:
- `gin` - Gin
- `vermouth` - Red vermouth
- `bitter` - Red bitter ⚠️ (НЕТ в iconMap.js!)
- `orange` - Orange peel
- `ice` - Ice cubes
- `rocks` - Rocks glass (посуда)

### Уровень 8:
- `gin` - Gin
- `rum` - Rum
- `bitter` - Red bitter ⚠️ (НЕТ в iconMap.js!)
- `tonic` - Tonic water
- `blueEssence` - Blue mana syrup ⚠️ (НЕТ в iconMap.js!)
- `chiliSyrup` - Dragon chili syrup ⚠️ (НЕТ в iconMap.js!)
- `lime` - Lime wedge
- `ice` - Ice cubes
- `highball` - Tall glass (посуда)
- `rocks` - Rocks glass (посуда)

---

## 🍹 ВСЕ КОКТЕЙЛИ (заказы по уровням):

### Уровень 1:
- **Pint of Lager**

### Уровень 2:
- **Pint of Lager**
- **Shandy**

### Уровень 3:
- **Pint of Lager**
- **Shandy**
- **Cuba Libre**

### Уровень 4:
- **Pint of Lager**
- **Shandy**
- **Cuba Libre**
- **Mojito**

### Уровень 5:
- **Gin & Tonic**

### Уровень 6:
- **Old Fashioned** ⚠️ (НЕТ картинки в getTraySpriteForOrder!)

### Уровень 7:
- **Negroni**

### Уровень 8:
- **Mana Elixir** ⚠️ (НЕТ картинки в getTraySpriteForOrder!)
- **Dragon's Breath** ⚠️ (НЕТ картинки в getTraySpriteForOrder!)

---

## 📋 УНИКАЛЬНЫЙ СПИСОК ВСЕХ ИНГРЕДИЕНТОВ:

1. `cola` - Cola
2. `rum` - Rum
3. `lime` - Lime wedge
4. `ice` - Ice cubes
5. `mint` - Mint leaves
6. `syrup` - Sugar syrup
7. `soda` - Soda water
8. `gin` - Gin
9. `tonic` - Tonic water
10. `whiskey` - Whiskey
11. `bitters` - Bitters
12. `orange` - Orange peel
13. `vermouth` - Red vermouth
14. `bitter` - Red bitter ⚠️
15. `blueEssence` - Blue mana syrup ⚠️
16. `chiliSyrup` - Dragon chili syrup ⚠️
17. `highball` - Tall glass (посуда)
18. `rocks` - Rocks glass (посуда)

---

## 📋 УНИКАЛЬНЫЙ СПИСОК ВСЕХ КОКТЕЙЛЕЙ:

1. **Pint of Lager** ✅
2. **Shandy** ✅
3. **Cuba Libre** ✅
4. **Mojito** ✅
5. **Gin & Tonic** ✅
6. **Old Fashioned** ⚠️
7. **Negroni** ✅
8. **Mana Elixir** ⚠️
9. **Dragon's Breath** ⚠️

---

## ⚠️ ОТСУТСТВУЮЩИЕ КАРТИНКИ:

### Ингредиенты (нужно добавить в iconMap.js):
- `bitter` → нужна картинка `bitter.png` или `red_bitter.png`
- `blueEssence` → нужна картинка `blue_mana_syrup.png` или `blue_essence.png`
- `chiliSyrup` → нужна картинка `dragon_chili_syrup.png` или `chili_syrup.png`

### Коктейли (нужно добавить в getTraySpriteForOrder):
- **Old Fashioned** → нужна картинка `old_fashioned.png`
- **Mana Elixir** → нужна картинка `mana_elixir.png`
- **Dragon's Breath** → нужна картинка `dragons_breath.png` или `dragon_breath.png`

---

## 📁 ФАЙЛЫ ДЛЯ РЕДАКТИРОВАНИЯ:

1. **Добавить ингредиент** → `src/js/data/levels.json` (в массив `ingredients`)
2. **Добавить коктейль** → `src/js/data/levels.json` (в массив `orders`)
3. **Добавить картинку ингредиента** → `src/js/iconMap.js` (в объект `ICON_MAP`)
4. **Добавить картинку готового коктейля** → `src/js/main.js` (в функцию `getTraySpriteForOrder()`)

