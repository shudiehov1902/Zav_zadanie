# Отчет о недостающих картинках

## ИНГРЕДИЕНТЫ (для iconMap.js)

### ❌ Отсутствуют картинки:
1. **bitter** (red bitter) - используется в уровне 7 и 8 для Negroni и Dragon's Breath
   - Сейчас использует общую картинку `Alcohol.png`
   - Нужна отдельная картинка: `bitter.png` или `red_bitter.png`

2. **blueEssence** (blue mana syrup) - используется в уровне 8 для Mana Elixir
   - Сейчас не добавлен в iconMap
   - Нужна картинка: `blue_mana_syrup.png` или `blue_essence.png`

3. **chiliSyrup** (dragon chili syrup) - используется в уровне 8 для Dragon's Breath
   - Сейчас не добавлен в iconMap
   - Нужна картинка: `dragon_chili_syrup.png` или `chili_syrup.png`

### ⚠️ Используют общую картинку Alcohol.png (можно оставить или заменить):
- whiskey - используется в Old Fashioned
- bitters - используется в Old Fashioned
- vermouth - используется в Negroni

---

## ГОТОВЫЕ КОКТЕЙЛИ (для getTraySpriteForOrder)

### ❌ Отсутствуют картинки готовых коктейлей:
1. **Old Fashioned** - заказ в уровне 6
   - Нужна картинка: `old_fashioned.png`

2. **Mana Elixir** - заказ в уровне 8
   - Нужна картинка: `mana_elixir.png` или `mana_elixir.png`

3. **Dragon's Breath** - заказ в уровне 8
   - Нужна картинка: `dragons_breath.png` или `dragon_breath.png`

### ✅ Уже есть картинки:
- Pint of Lager → `FullPintOfBeer.png` ✅
- Shandy → `shandy.png` ✅
- Cuba Libre → `cuba_libre.png` ✅
- Mojito → `mojito.png` ✅
- Gin & Tonic → `gintonic.png` ✅
- Negroni → `negroni.png` ✅
- Trash → `trash.png` ✅

---

## ИТОГО НЕ ХВАТАЕТ:

### Обязательно нужно добавить:
1. `bitter.png` (или `red_bitter.png`) - для ингредиента "Red bitter"
2. `blue_mana_syrup.png` (или `blue_essence.png`) - для ингредиента "Blue mana syrup"
3. `dragon_chili_syrup.png` (или `chili_syrup.png`) - для ингредиента "Dragon chili syrup"
4. `old_fashioned.png` - для коктейля "Old Fashioned"
5. `mana_elixir.png` - для коктейля "Mana Elixir"
6. `dragons_breath.png` (или `dragon_breath.png`) - для коктейля "Dragon's Breath"

### Опционально (можно оставить Alcohol.png):
- `whiskey.png` - для более точного отображения
- `bitters.png` - для более точного отображения
- `vermouth.png` - для более точного отображения

