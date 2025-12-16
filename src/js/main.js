import { getIconPath } from './iconMap.js';

// DOM элементы
const visitorsContainerEl = document.getElementById('visitors-container');
const ingredientGridEl = document.getElementById('ingredient-grid'); // больше не используется, но оставляем для совместимости
const shakerEl = document.getElementById('shaker');
const barFridgeEl = document.getElementById('bar-fridge');
const fridgeMenuEl = document.getElementById('fridge-menu');
const fridgeMenuGridEl = document.getElementById('fridge-menu-grid');
const fridgeMenuCloseEl = document.getElementById('fridge-menu-close');
const shakerContentEl = document.getElementById('shaker-content');
const shakerIconEl = document.getElementById('shaker-icon');
const statusLineEl = document.getElementById('status-line');
const levelEl = document.getElementById('hud-level');
const timeEl = document.getElementById('hud-time');
const ordersEl = document.getElementById('hud-orders');
const bestEl = document.getElementById('hud-best');
const statRunsEl = document.getElementById('stat-runs');
const statUniqueEl = document.getElementById('stat-unique');
const progressEl = document.getElementById('fill-progress');

const btnServe = document.getElementById('btn-serve');
const btnHint = document.getElementById('btn-hint');
const btnReset = document.getElementById('btn-reset');
const btnPause = document.getElementById('btn-pause');
const btnRotate = null; // кнопка поворота удалена из интерфейса
const btnShake = null;
const pourSpeedInput = null;
const shakeIntensityEl = null;
const powerHintEl = null;
const shakeProgressBarEl = document.getElementById('shake-progress-bar');
const shakeProgressLabelEl = document.getElementById('shake-progress-label');
const beerTapEl = document.getElementById('beer-tap');
const beerGlassEl = document.getElementById('beer-glass');
const trayContainerEl = document.querySelector('.tray-container');
const beerTapContainerEl = document.querySelector('.beer-tap-container');
const trayDrinkEl = document.getElementById('tray-drink');
const pauseMenuEl = document.getElementById('pause-menu');
const pauseMenuCloseEl = document.getElementById('pause-menu-close');
const pauseMenuLevelsEl = document.getElementById('pause-menu-levels');
const pauseMenuRestartEl = document.getElementById('pause-menu-restart');
const pauseMenuResumeEl = document.getElementById('pause-menu-resume');

const STORAGE_KEY = 'tavern-tapper-progress';
const VISITOR_TEMPLATE = document.getElementById('visitor-template');
const INGREDIENT_TEMPLATE = document.getElementById('ingredient-chip');

let gameData = { levels: [] };

// Игровые персонажи, которые приходят к стойке
const VISITOR_CHARACTERS = [
  { id: 'knight', icon: 'knight.png', label: 'Knight' },
  { id: 'witch', icon: 'witch2.png', label: 'Witch' },
  { id: 'mage', icon: 'mag.png', label: 'Mage' },
  { id: 'dwarf', icon: 'dwarf.png', label: 'Dwarf' },
];

function getRandomVisitorCharacter() {
  const idx = Math.floor(Math.random() * VISITOR_CHARACTERS.length);
  return VISITOR_CHARACTERS[idx];
}
let state = {
  currentLevel: null,
  activeOrder: null,
  activeVisitor: null,
  visitors: [],
  timer: 0,
  timerId: null,
  served: 0,
  bestTime: null,
  servedSet: new Set(),
  runs: 0,
  currentDrink: [], // Ингредиенты в шейкере
  rotation: 0,
  pourSpeed: 2,
  isShaking: false,
  shakeProgress: 0, // Прогресс взбалтывания (0-100)
  isDraggingShaker: false,
  lastShakePosition: { x: 0, y: 0 },
  shakeAnimationId: null,
};

// Позиции посетителей у барной стойки (можно настроить)
const VISITOR_POSITIONS = [
  { left: '12%', top: '40%' },
  { left: '32%', top: '40%' },
  { left: '54%', top: '40%' },
  { left: '76%', top: '40%' },
];

document.addEventListener('DOMContentLoaded', async () => {
  attachControls();
  await loadData();
  hydrateProgress();
  startNewRun();
});

function attachControls() {
  btnServe?.addEventListener('click', handleServe);
  btnReset?.addEventListener('click', startLevel);
  btnHint?.addEventListener('click', showCurrentHint);
  btnPause?.addEventListener('click', togglePause);
  // Кнопка и функционал поворота отключены
  
  // Горячая клавиша R больше не используется для поворота
  
  // Обработчики для меню паузы
  pauseMenuCloseEl?.addEventListener('click', closePauseMenu);
  pauseMenuResumeEl?.addEventListener('click', closePauseMenu);
  pauseMenuRestartEl?.addEventListener('click', () => {
    closePauseMenu();
    startLevel();
  });
  pauseMenuEl?.querySelector('.pause-menu__overlay')?.addEventListener('click', closePauseMenu);
  
  // Обработчики для холодильника
  barFridgeEl?.addEventListener('click', toggleFridgeMenu);
  fridgeMenuCloseEl?.addEventListener('click', closeFridgeMenu);
  fridgeMenuEl?.querySelector('.fridge-menu__overlay')?.addEventListener('click', closeFridgeMenu);
  
  // Клик по пивному крану — наливаем или опустошаем бокал
  beerTapEl?.addEventListener('click', handleBeerTap);
  
  // Перетаскивание бокала между краном и подносом
  if (beerGlassEl) {
    beerGlassEl.setAttribute('draggable', 'true');
    beerGlassEl.addEventListener('dragstart', handleBeerGlassDragStart);
    beerGlassEl.addEventListener('dragend', handleBeerGlassDragEnd);
  }
  
  [beerTapContainerEl, trayContainerEl].forEach(zone => {
    zone?.addEventListener('dragover', (e) => {
      e.preventDefault();
    });
    zone?.addEventListener('drop', handleBeerGlassDrop);
  });
  
  // Обработчик для смешивания напитков: перетаскивание ингредиентов на бокал
  if (beerGlassEl) {
    beerGlassEl.addEventListener('dragover', (e) => {
      e.preventDefault();
      // Показываем визуальную подсказку, что можно смешать
      if (beerGlassEl.dataset.state === 'full') {
        beerGlassEl.style.filter = 'drop-shadow(0 0 12px rgba(241, 179, 63, 0.8))';
      }
    });
    
    beerGlassEl.addEventListener('dragleave', () => {
      beerGlassEl.style.filter = '';
    });
    
    beerGlassEl.addEventListener('drop', handleIngredientOnBeerGlass);
  }
  
  // Обработчики для шейкера (drop ингредиентов)
  shakerEl?.addEventListener('dragover', (e) => {
    e.preventDefault();
    shakerEl.classList.add('drag-over');
  });
  
  shakerEl?.addEventListener('dragleave', () => {
    shakerEl.classList.remove('drag-over');
  });
  
  // Обработчики для тряски шейкера мышью
  setupShakerShaking();
  
  // Глобальный обработчик drop
  window.handleDrop = function(e) {
    e.preventDefault();
    shakerEl?.classList.remove('drag-over');
    const ingredientId = e.dataTransfer.getData('text/plain');
    if (ingredientId) {
      addIngredientToShaker(ingredientId);
    }
  };
}

function setupShakerShaking() {
  if (!shakerEl) return;
  
  let isMouseDown = false;
  let lastX = 0;
  let lastY = 0;
  let shakeDistance = 0;
  
  // Mouse events
  shakerEl.addEventListener('mousedown', (e) => {
    if (state.currentDrink.length === 0) {
      status('Add ingredients to shaker first!', true);
      return;
    }
    isMouseDown = true;
    state.isDraggingShaker = true;
    shakerEl.classList.add('dragging');
    lastX = e.clientX;
    lastY = e.clientY;
    shakeDistance = 0;
    e.preventDefault();
  });
  
  document.addEventListener('mousemove', (e) => {
    if (!isMouseDown || !state.isDraggingShaker) return;
    
    const deltaX = Math.abs(e.clientX - lastX);
    const deltaY = Math.abs(e.clientY - lastY);
    const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
    
    if (distance > 5) { // Минимальное движение для засчета
      shakeDistance += distance;
      updateShakeProgress(shakeDistance);
      
      // Анимация тряски
      if (!shakerEl.classList.contains('shaking')) {
        shakerEl.classList.add('shaking');
      }
    }
    
    lastX = e.clientX;
    lastY = e.clientY;
  });
  
  document.addEventListener('mouseup', () => {
    if (isMouseDown) {
      isMouseDown = false;
      state.isDraggingShaker = false;
      shakerEl.classList.remove('dragging');
      shakerEl.classList.remove('shaking');
      
      if (state.shakeProgress >= 100) {
        state.isShaking = false;
        status('Shaker fully mixed! Ready to serve.');
      }
    }
  });
  
  // Touch events для мобильных
  shakerEl.addEventListener('touchstart', (e) => {
    if (state.currentDrink.length === 0) {
      status('Add ingredients to shaker first!', true);
      return;
    }
    const touch = e.touches[0];
    isMouseDown = true;
    state.isDraggingShaker = true;
    shakerEl.classList.add('dragging');
    lastX = touch.clientX;
    lastY = touch.clientY;
    shakeDistance = 0;
    e.preventDefault();
  });
  
  document.addEventListener('touchmove', (e) => {
    if (!isMouseDown || !state.isDraggingShaker) return;
    const touch = e.touches[0];
    
    const deltaX = Math.abs(touch.clientX - lastX);
    const deltaY = Math.abs(touch.clientY - lastY);
    const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
    
    if (distance > 5) {
      shakeDistance += distance;
      updateShakeProgress(shakeDistance);
      
      if (!shakerEl.classList.contains('shaking')) {
        shakerEl.classList.add('shaking');
      }
    }
    
    lastX = touch.clientX;
    lastY = touch.clientY;
    e.preventDefault();
  });
  
  document.addEventListener('touchend', () => {
    if (isMouseDown) {
      isMouseDown = false;
      state.isDraggingShaker = false;
      shakerEl.classList.remove('dragging');
      shakerEl.classList.remove('shaking');
      
      if (state.shakeProgress >= 100) {
        state.isShaking = false;
        status('Shaker fully mixed! Ready to serve.');
      }
    }
  });
}

function updateShakeProgress(distance) {
  // Накопление прогресса зависит от силы тряски (pourSpeed)
  const progressPerPixel = 0.1 * state.pourSpeed; // Чем больше сила, тем быстрее накапливается
  const newProgress = Math.min(100, state.shakeProgress + (distance * progressPerPixel / 10));
  
  state.shakeProgress = newProgress;
  
  if (shakeProgressBarEl) {
    shakeProgressBarEl.style.width = `${newProgress}%`;
  }
  
  if (shakeProgressLabelEl) {
    shakeProgressLabelEl.textContent = `${Math.floor(newProgress)}%`;
    
    if (newProgress >= 100) {
      shakeProgressLabelEl.textContent = 'READY!';
      shakeProgressLabelEl.style.color = 'var(--success)';
    } else if (newProgress >= 75) {
      shakeProgressLabelEl.style.color = 'var(--accent)';
    } else {
      shakeProgressLabelEl.style.color = 'var(--text)';
    }
  }
}

async function loadData() {
  try {
    const res = await fetch('./src/js/data/levels.json');
    gameData = await res.json();
    statUniqueEl.textContent = gameData.levels.length.toString();
  } catch (err) {
    console.error(err);
    status('Failed to load levels.json', true);
  }
}

function hydrateProgress() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
    state.runs = saved.runs || 0;
    state.bestTime = saved.bestTime ?? null;
    state.servedSet = new Set(saved.servedSet || []);
    statRunsEl.textContent = state.runs.toString();
    renderBestTime();
  } catch (err) {
    console.warn('progress parse failed', err);
  }
}

function persistProgress() {
  const payload = {
    runs: state.runs,
    bestTime: state.bestTime,
    servedSet: Array.from(state.servedSet),
  };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
}

function startNewRun() {
  if (!gameData.levels.length) return;
  state.runs += 1;
  state.served = 0;
  state.servedSet = new Set();
  statRunsEl.textContent = state.runs.toString();
  startLevel();
  persistProgress();
}

function startLevel() {
  clearTimer();
  if (!gameData.levels.length) return;
  
  const availableLevels = gameData.levels.filter(l => !state.servedSet.has(l.id));
  if (availableLevels.length === 0) {
    state.servedSet.clear();
    startNewRun();
    return;
  }
  
  const randomIndex = Math.floor(Math.random() * availableLevels.length);
  state.currentLevel = availableLevels[randomIndex];
  state.timer = state.currentLevel.timeLimit;
  state.served = 0;
  state.currentDrink = [];
  state.rotation = 0;
  state.isShaking = false;
  state.shakeProgress = 0;
  state.isDraggingShaker = false;
  state.pourSpeed = 2; // Сброс на среднюю силу
  
  ordersEl.textContent = `0/${state.currentLevel.target}`;
  levelEl.textContent = `Lv.${state.currentLevel.id}`;
  
  // Обновляем слайдер
  if (pourSpeedInput) {
    pourSpeedInput.value = state.pourSpeed;
  }
  
  renderVisitors();
  renderIngredients(); // Показываем ВСЕ ингредиенты уровня
  clearShaker();
  updateShakeIntensity();
  tick();
  status(`Level ${state.currentLevel.name} — serve ${state.currentLevel.target} drinks`);
}

function renderVisitors() {
  // Очищаем и запускаем первую волну посетителей: по одному у стойки
  visitorsContainerEl.innerHTML = '';
  state.visitors = [];
  spawnNextVisitor();
}

function spawnNextVisitor() {
  if (!state.currentLevel) return;

  // Если уровень уже выполнен или время вышло — новых не спауним
  if (state.served >= state.currentLevel.target || state.timer <= 0) return;

  visitorsContainerEl.innerHTML = '';
  state.visitors = [];

  const orders = [...state.currentLevel.orders];
  const randomIndex = Math.floor(Math.random() * orders.length);
  const order = orders[randomIndex];
  const position = VISITOR_POSITIONS[0];

  const visitor = createVisitor(order, 0, position);
  state.visitors.push(visitor);
  visitorsContainerEl.appendChild(visitor.element);
  activateVisitor(visitor);
}

function createVisitor(order, index, position) {
  const clone = VISITOR_TEMPLATE.content.cloneNode(true);
  const visitorEl = clone.querySelector('.visitor');
  const bubbleEl = clone.querySelector('.speech-bubble');
  const titleEl = bubbleEl.querySelector('.speech-bubble__title');
  const hintEl = bubbleEl.querySelector('.speech-bubble__hint');
  const avatarImg = clone.querySelector('.visitor__img');
  
  visitorEl.style.left = position.left;
  visitorEl.style.top = position.top;

  // Назначаем случайного персонажа и картинку
  const character = getRandomVisitorCharacter();
  visitorEl.dataset.characterId = character.id;
  if (avatarImg) {
    avatarImg.src = `./src/assets/icons/${character.icon}`;
    avatarImg.alt = character.label;
  }
  
  titleEl.textContent = order.name.toUpperCase();
  hintEl.textContent = order.shortHint;
  bubbleEl.dataset.orderId = order.name;
  
  const visitor = {
    element: visitorEl,
    bubble: bubbleEl,
    order: order,
    index: index,
    timer: state.currentLevel.timeLimit,
    timerId: null,
  };
  
  startVisitorTimer(visitor);
  
  return visitor;
}

function startVisitorTimer(visitor) {
  clearVisitorTimer(visitor);
  updateVisitorTimer(visitor);
  visitor.timerId = setInterval(() => {
    visitor.timer -= 1;
    updateVisitorTimer(visitor);
    if (visitor.timer <= 0) {
      clearVisitorTimer(visitor);
      visitor.bubble.classList.add('expired');
      if (visitor === state.activeVisitor) {
        status('Order expired! Try next customer.', true);
        // Убираем текущего гостя и вызываем следующего
        setTimeout(() => {
          const el = visitor.element;
          if (el && el.parentElement === visitorsContainerEl) {
            visitorsContainerEl.removeChild(el);
          }
          spawnNextVisitor();
        }, 600);
      }
    }
  }, 1000);
}

function updateVisitorTimer(visitor) {
  const timerEl = visitor.bubble.querySelector('.speech-bubble__timer');
  if (timerEl) {
    timerEl.textContent = `TIME: ${formatTime(visitor.timer)}`;
    if (visitor.timer < 10) {
      timerEl.style.color = 'var(--danger)';
    } else {
      timerEl.style.color = 'var(--danger)';
    }
  }
}

function clearVisitorTimer(visitor) {
  if (visitor.timerId) {
    clearInterval(visitor.timerId);
    visitor.timerId = null;
  }
}

function activateVisitor(visitor) {
  state.visitors.forEach(v => {
    v.bubble.classList.remove('active');
    clearVisitorTimer(v);
  });
  
  state.activeVisitor = visitor;
  state.activeOrder = visitor.order;
  visitor.bubble.classList.add('active');
  startVisitorTimer(visitor);
  status(`Active order: ${visitor.order.name}`);
}

function activateNextVisitor() {
  // Логика очереди больше не нужна, но оставляем функцию,
  // чтобы не ломать возможные внешние вызовы. Просто спаун нового.
  spawnNextVisitor();
}

function renderIngredients() {
  // Теперь ингредиенты отображаются в меню холодильника, а не на столе
  if (!fridgeMenuGridEl) return;
  
  fridgeMenuGridEl.innerHTML = '';
  
  // Показываем ВСЕ ингредиенты уровня в меню холодильника
  if (!state.currentLevel || !state.currentLevel.ingredients) {
    return;
  }
  
  // Создаём список всех доступных ингредиентов для всех рецептов
  const allIngredients = new Map();
  
  // Собираем все ингредиенты из всех уровней
  gameData.levels.forEach(level => {
    if (level.ingredients) {
      level.ingredients.forEach(ing => {
        if (!allIngredients.has(ing.id)) {
          allIngredients.set(ing.id, ing);
        }
      });
    }
  });
  
  // Отображаем все ингредиенты в меню холодильника
  allIngredients.forEach((ing) => {
    const item = document.createElement('div');
    item.className = 'fridge-menu__item';
    item.dataset.id = ing.id;
    item.dataset.label = ing.label;
    item.draggable = true;
    
    const img = document.createElement('img');
    img.src = getIconPath(ing.id);
    img.alt = ing.label;
    img.draggable = false;
    
    const label = document.createElement('span');
    label.className = 'fridge-menu__item-label';
    label.textContent = ing.label;
    
    item.appendChild(img);
    item.appendChild(label);
    
    item.addEventListener('dragstart', handleDragStart);
    item.addEventListener('dragend', handleDragEnd);
    item.addEventListener('touchstart', handleTouchStart, { passive: false });
    item.addEventListener('click', () => {
      addIngredientToShaker(ing.id);
      status(`Added ${ing.label} to shaker`);
    });
    
    fridgeMenuGridEl.appendChild(item);
  });
}

function toggleFridgeMenu() {
  if (!fridgeMenuEl) return;
  const isOpen = fridgeMenuEl.style.display !== 'none';
  if (isOpen) {
    closeFridgeMenu();
  } else {
    openFridgeMenu();
  }
}

function openFridgeMenu() {
  if (!fridgeMenuEl) return;
  fridgeMenuEl.style.display = 'block';
  renderIngredients(); // Обновляем список ингредиентов при открытии
  status('Fridge menu opened');
}

function closeFridgeMenu() {
  if (!fridgeMenuEl) return;
  fridgeMenuEl.style.display = 'none';
  status('Fridge menu closed');
}

let draggedElement = null;

function handleDragStart(e) {
  draggedElement = this;
  this.classList.add('dragging');
  e.dataTransfer.effectAllowed = 'move';
  e.dataTransfer.setData('text/plain', this.dataset.id);
}

function handleDragEnd() {
  if (draggedElement) {
    draggedElement.classList.remove('dragging');
    draggedElement = null;
  }
  shakerEl?.classList.remove('drag-over');
}

function handleTouchStart(e) {
  const touch = e.touches[0];
  const element = e.currentTarget;
  const rect = element.getBoundingClientRect();
  
  element.style.position = 'fixed';
  element.style.left = touch.clientX - rect.width / 2 + 'px';
  element.style.top = touch.clientY - rect.height / 2 + 'px';
  element.style.zIndex = '1000';
  draggedElement = element;
  
  const handleTouchMove = (ev) => {
    if (ev.touches.length > 0) {
      const t = ev.touches[0];
      element.style.left = t.clientX - rect.width / 2 + 'px';
      element.style.top = t.clientY - rect.height / 2 + 'px';
      
      // Проверка наведения на шейкер
      const shakerRect = shakerEl.getBoundingClientRect();
      if (t.clientX >= shakerRect.left && t.clientX <= shakerRect.right &&
          t.clientY >= shakerRect.top && t.clientY <= shakerRect.bottom) {
        shakerEl.classList.add('drag-over');
      } else {
        shakerEl.classList.remove('drag-over');
      }
    }
  };
  
  const handleTouchEnd = (ev) => {
    const shakerRect = shakerEl.getBoundingClientRect();
    const touchEnd = ev.changedTouches[0];
    
    if (touchEnd.clientX >= shakerRect.left && touchEnd.clientX <= shakerRect.right &&
        touchEnd.clientY >= shakerRect.top && touchEnd.clientY <= shakerRect.bottom) {
      addIngredientToShaker(element.dataset.id);
    }
    
    element.style.position = '';
    element.style.left = '';
    element.style.top = '';
    element.style.zIndex = '';
    
    document.removeEventListener('touchmove', handleTouchMove);
    document.removeEventListener('touchend', handleTouchEnd);
    draggedElement = null;
    shakerEl.classList.remove('drag-over');
  };
  
  document.addEventListener('touchmove', handleTouchMove, { passive: false });
  document.addEventListener('touchend', handleTouchEnd, { once: true });
  e.preventDefault();
}

function addIngredientToShaker(ingredientId) {
  const ingredient = state.currentLevel?.ingredients.find(ing => ing.id === ingredientId);
  if (!ingredient) return;
  
  state.currentDrink.push({
    id: ingredientId,
    label: ingredient.label,
    rotation: state.rotation,
  });
  
  renderShaker();
  status(`Added ${ingredient.label} to shaker`);
}

function handleRotate() {
  if (state.currentDrink.length === 0) {
    status('Add ingredient first to rotate', true);
    return;
  }
  
  state.rotation = (state.rotation + 90) % 360;
  if (state.currentDrink.length > 0) {
    state.currentDrink[state.currentDrink.length - 1].rotation = state.rotation;
  }
  renderShaker();
  status(`Rotated ${state.rotation}°`);
}

function getPowerLabel(power) {
  const labels = {
    1: 'Light (1)',
    2: 'Medium (2)',
    3: 'Hard (3)',
    4: 'Very Hard (4)'
  };
  return labels[power] || 'Medium (2)';
}

function getPowerDescription(power) {
  const descriptions = {
    1: 'Light shake - gentle mixing',
    2: 'Medium shake - standard mixing',
    3: 'Hard shake - vigorous mixing',
    4: 'Very hard shake - maximum power'
  };
  return descriptions[power] || 'Medium shake';
}

function updateShakeIntensity() {
  if (shakeIntensityEl) {
    shakeIntensityEl.textContent = `${state.pourSpeed} (${getPowerLabel(state.pourSpeed).split('(')[0].trim()})`;
  }
  if (powerHintEl) {
    powerHintEl.textContent = getPowerLabel(state.pourSpeed);
  }
}

// Функция handleShake больше не нужна, тряска происходит через drag

function renderShaker() {
  shakerContentEl.innerHTML = '';
  
  if (state.currentDrink.length === 0) {
    const emptyMsg = document.createElement('div');
    emptyMsg.className = 'shaker-ingredients-panel__empty';
    emptyMsg.textContent = 'Drop ingredients here';
    shakerContentEl.appendChild(emptyMsg);
    return;
  }
  
  state.currentDrink.forEach((ing, index) => {
    const item = document.createElement('div');
    item.className = 'shaker-ingredient-item';
    item.dataset.index = index;
    
    const img = document.createElement('img');
    img.src = getIconPath(ing.id);
    img.alt = ing.label;
    
    const label = document.createElement('div');
    label.className = 'shaker-ingredient-item__label';
    label.textContent = ing.label;
    
    const removeBtn = document.createElement('button');
    removeBtn.className = 'shaker-ingredient-item__remove';
    removeBtn.textContent = '×';
    removeBtn.setAttribute('aria-label', `Remove ${ing.label}`);
    removeBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      removeIngredientFromShaker(index);
    });
    
    item.appendChild(img);
    item.appendChild(label);
    item.appendChild(removeBtn);
    shakerContentEl.appendChild(item);
  });
  
  // Добавляем подсказку о силе тряски
  const shakeInfo = document.createElement('div');
  shakeInfo.className = 'shaker-ingredients-panel__shake-info';
  shakeInfo.textContent = `Set shake power: ${state.pourSpeed} (${getPowerLabel(state.pourSpeed).split('(')[0].trim()})`;
  shakerContentEl.appendChild(shakeInfo);
}

function removeIngredientFromShaker(index) {
  if (index >= 0 && index < state.currentDrink.length) {
    const removed = state.currentDrink[index];
    state.currentDrink.splice(index, 1);
    renderShaker();
    status(`Removed ${removed.label} from shaker`);
  }
}

function clearShaker() {
  state.currentDrink = [];
  state.rotation = 0;
  state.isShaking = false;
  state.shakeProgress = 0;
  state.isDraggingShaker = false;
  shakerContentEl.innerHTML = '';
  shakerEl?.classList.remove('shaking');
  shakerEl?.classList.remove('dragging');
  
  if (shakeProgressBarEl) {
    shakeProgressBarEl.style.width = '0%';
  }
  if (shakeProgressLabelEl) {
    shakeProgressLabelEl.textContent = '0%';
    shakeProgressLabelEl.style.color = 'var(--text)';
  }
}

// Показ готового напитка на подносе в зависимости от заказа
function showTrayDrink(order) {
  if (!trayDrinkEl || !order) return;
  
  const sprite = getTraySpriteForOrder(order);
  if (!sprite) return;
  
  trayDrinkEl.src = `./src/assets/icons/${sprite}`;
  trayDrinkEl.alt = order.name;
  trayDrinkEl.style.display = 'block';
}

// Подбор подходящей иконки напитка
function getTraySpriteForOrder(order) {
  const name = (order.name || '').toLowerCase();
  
  if (name.includes('shandy')) return 'shandy.png';
  if (name.includes('mojito')) return 'mojito.png';
  if (name.includes('negroni')) return 'negroni.png';
  if (name.includes('gin') && name.includes('tonic')) return 'gintonic.png';
  if (name.includes('cuba libre')) return 'cuba_libre.png';
  if (name.includes('coke') || name.includes('cola')) return 'coke.png';
  
  // Для пива и прочих напитков по умолчанию используем полный бокал
  if (name.includes('lager') || name.includes('beer') || name.includes('pint')) {
    return 'FullPintOfBeer.png';
  }
  
  return null;
}

// Простая логика пивного крана: по клику наполняем или опустошаем бокал.
function handleBeerTap() {
  if (!beerGlassEl) return;
  
  // Проверяем, стоит ли бокал под краном.
  if (!isGlassUnderTap()) {
    status('Place the glass under the tap first!', true);
    return;
  }
  
  const isFull = beerGlassEl.dataset.state === 'full';
  
  if (isFull) {
    beerGlassEl.src = './src/assets/icons/EmptyPintOfBeer.png';
    beerGlassEl.dataset.state = 'empty';
    status('Glass emptied.', false);
  } else {
    beerGlassEl.src = './src/assets/icons/FullPintOfBeer.png';
    beerGlassEl.dataset.state = 'full';
    status('Beer poured!', false);
  }
}

// Проверка, что бокал стоит непосредственно под краном
function isGlassUnderTap() {
  if (!beerTapEl || !beerGlassEl) return false;
  
  const tapRect = beerTapEl.getBoundingClientRect();
  const glassRect = beerGlassEl.getBoundingClientRect();
  
  const glassCenterX = glassRect.left + glassRect.width / 2;
  const glassTopY = glassRect.top;
  
  const withinX =
    glassCenterX >= tapRect.left - 20 &&
    glassCenterX <= tapRect.right + 20;
  
  const withinY =
    glassTopY >= tapRect.bottom - 40 &&
    glassTopY <= tapRect.bottom + 80;
  
  return withinX && withinY;
}

// Drag & drop бокала между краном и подносом
function handleBeerGlassDragStart(e) {
  e.dataTransfer.setData('text/plain', 'beer-glass');
  beerGlassEl?.classList.add('dragging');
}

function handleBeerGlassDragEnd() {
  beerGlassEl?.classList.remove('dragging');
}

function handleBeerGlassDrop(e) {
  e.preventDefault();
  const type = e.dataTransfer.getData('text/plain');
  if (type !== 'beer-glass' || !beerGlassEl) return;
  
  const target = e.currentTarget;
  
  if (target === beerTapContainerEl) {
    // Перемещаем бокал под кран
    beerTapContainerEl.appendChild(beerGlassEl);
    beerGlassEl.style.position = 'static';
    status('Glass moved under the tap.', false);
  } else if (target === trayContainerEl) {
    // Ставим бокал на поднос
    trayContainerEl.appendChild(beerGlassEl);
    beerGlassEl.style.position = '';
    status('Glass placed on the tray.', false);
  }
}

// Обработчик смешивания: перетаскивание ингредиента (колы) на полный бокал пива
function handleIngredientOnBeerGlass(e) {
  e.preventDefault();
  e.stopPropagation();
  
  if (!beerGlassEl) return;
  
  // Проверяем, что бокал полный (содержит пиво)
  if (beerGlassEl.dataset.state !== 'full') {
    status('Fill the glass with beer first!', true);
    beerGlassEl.style.filter = '';
    return;
  }
  
  const ingredientId = e.dataTransfer.getData('text/plain');
  if (!ingredientId) return;
  
  // Проверяем, что это кола (coke или cola)
  const ingredientIdLower = ingredientId.toLowerCase();
  if (ingredientIdLower !== 'coke' && ingredientIdLower !== 'cola') {
    status('Only cola can be mixed with beer!', true);
    beerGlassEl.style.filter = '';
    return;
  }
  
  // Превращаем пиво в shandy
  beerGlassEl.src = './src/assets/icons/shandy.png';
  beerGlassEl.dataset.state = 'shandy';
  beerGlassEl.style.filter = '';
  status('Shandy created! Beer + Cola', false);
}

function isBeerOrder(order) {
  if (!order) return false;
  const name = (order.name || '').toLowerCase();
  return name.includes('lager') || name.includes('beer') || name.includes('pint');
}

function isShandyOrder(order) {
  if (!order) return false;
  const name = (order.name || '').toLowerCase();
  return name.includes('shandy');
}

function isFullBeerGlassOnTray() {
  if (!beerGlassEl) return false;
  // Проверяем, что бокал находится на подносе
  const isOnTray = trayContainerEl && trayContainerEl.contains(beerGlassEl);
  // Проверяем, что бокал полный (пиво)
  const isFull = beerGlassEl.dataset.state === 'full';
  return isOnTray && isFull;
}

function isShandyOnTray() {
  if (!beerGlassEl) return false;
  // Проверяем, что бокал находится на подносе
  const isOnTray = trayContainerEl && trayContainerEl.contains(beerGlassEl);
  // Проверяем, что бокал содержит shandy
  const isShandy = beerGlassEl.dataset.state === 'shandy';
  return isOnTray && isShandy;
}

function handleServe() {
  if (!state.activeOrder) {
    status('No active order!', true);
    return;
  }
  
  const isBeer = isBeerOrder(state.activeOrder);
  const isShandy = isShandyOrder(state.activeOrder);
  
  if (isBeer || isShandy) {
    // Для пива или shandy проверяем, есть ли нужный напиток на подносе
    if (isShandy) {
      // Для shandy проверяем, что на подносе shandy
      if (!isShandyOnTray()) {
        status('Place shandy on the tray first!', true);
        return;
      }
    } else {
      // Для пива проверяем, что на подносе полный бокал пива
      if (!isFullBeerGlassOnTray()) {
        status('Place a full beer glass on the tray first!', true);
        return;
      }
    }
    
    // Пиво готово к подаче
    state.served += 1;
    ordersEl.textContent = `${state.served}/${state.currentLevel.target}`;
    progressEl.style.width = Math.min(100, (state.served / state.currentLevel.target) * 100) + '%';
    
    clearVisitorTimer(state.activeVisitor);
    state.activeVisitor.bubble.classList.remove('active');
    state.activeVisitor.bubble.classList.add('served');
    
    status(`✓ ${state.activeOrder.name} served!`, false);
    
    // Очищаем бокал после подачи
    if (beerGlassEl) {
      beerGlassEl.src = './src/assets/icons/EmptyPintOfBeer.png';
      beerGlassEl.dataset.state = 'empty';
      // Возвращаем бокал на стартовую позицию
      const beerGlassStartEl = document.querySelector('.beer-glass-start');
      if (beerGlassStartEl) {
        beerGlassStartEl.appendChild(beerGlassEl);
        beerGlassEl.style.position = '';
      }
    }
    
    // Если это был shandy, также очищаем его с подноса
    if (isShandy && trayDrinkEl) {
      trayDrinkEl.style.display = 'none';
    }
    
    if (state.served >= state.currentLevel.target) {
      const elapsed = state.currentLevel.timeLimit - state.timer;
      state.servedSet.add(state.currentLevel.id);
      updateBest(elapsed);
      status('Level complete! Starting next level...');
      setTimeout(() => startLevel(), 1500);
    } else {
      setTimeout(() => {
        // Заменяем текущего гостя новым у стойки
        const active = state.activeVisitor;
        if (active) {
          const el = active.element;
          if (el && el.parentElement === visitorsContainerEl) {
            visitorsContainerEl.removeChild(el);
          }
        }
        spawnNextVisitor();
      }, 1000);
    }
    
    persistProgress();
  } else {
    // Для коктейлей проверяем шейкер как раньше
    if (state.currentDrink.length === 0) {
      status('Prepare a drink first!', true);
      return;
    }
    
    if (state.shakeProgress < 100) {
      status(`Shake the shaker more! (${Math.floor(state.shakeProgress)}%)`, true);
      return;
    }
    
    const isValid = validateRecipe(state.currentDrink, state.activeOrder);
    
    if (isValid) {
      // Показать готовый напиток на подносе (для любых коктейлей из шейкера)
      showTrayDrink(state.activeOrder);
      state.served += 1;
      ordersEl.textContent = `${state.served}/${state.currentLevel.target}`;
      progressEl.style.width = Math.min(100, (state.served / state.currentLevel.target) * 100) + '%';
      
      clearVisitorTimer(state.activeVisitor);
      state.activeVisitor.bubble.classList.remove('active');
      state.activeVisitor.bubble.classList.add('served');
      
      status(`✓ ${state.activeOrder.name} served!`, false);
      clearShaker();
      
      if (state.served >= state.currentLevel.target) {
        const elapsed = state.currentLevel.timeLimit - state.timer;
        state.servedSet.add(state.currentLevel.id);
        updateBest(elapsed);
        status('Level complete! Starting next level...');
        setTimeout(() => startLevel(), 1500);
      } else {
        setTimeout(() => {
          // Заменяем текущего гостя новым у стойки
          const active = state.activeVisitor;
          if (active) {
            const el = active.element;
            if (el && el.parentElement === visitorsContainerEl) {
              visitorsContainerEl.removeChild(el);
            }
          }
          spawnNextVisitor();
        }, 1000);
      }
      
      persistProgress();
    } else {
      // Рецепт невалиден - проверяем, подходят ли ингредиенты хотя бы к одному рецепту
      const matchesAnyRecipe = checkIfIngredientsMatchAnyRecipe(state.currentDrink);
      
      if (!matchesAnyRecipe) {
        // Ингредиенты не подходят ни к одному рецепту - создаем trash
        showTrayTrash();
        status('Trash created! Ingredients don\'t match any recipe.', true);
        clearShaker();
      } else {
        status('Wrong recipe! Check the order.', true);
      }
    }
  }
}

// Проверяет, подходят ли ингредиенты хотя бы к одному рецепту из всех уровней
function checkIfIngredientsMatchAnyRecipe(drink) {
  if (!drink || drink.length === 0) return false;
  if (!gameData.levels) return false;
  
  const drinkIds = drink.map(ing => ing.id.toLowerCase()).sort();
  
  // Проверяем все рецепты во всех уровнях
  for (const level of gameData.levels) {
    if (!level.orders) continue;
    
    for (const order of level.orders) {
      // Проверяем, подходит ли текущий набор ингредиентов к этому рецепту
      if (validateRecipe(drink, order)) {
        return true; // Нашли хотя бы один подходящий рецепт
      }
    }
  }
  
  return false; // Не подходит ни к одному рецепту
}

// Показывает trash на подносе
function showTrayTrash() {
  if (!trayDrinkEl) return;
  trayDrinkEl.src = './src/assets/icons/trash.png';
  trayDrinkEl.alt = 'Trash';
  trayDrinkEl.style.display = 'block';
}

function validateRecipe(drink, order) {
  const steps = order.steps || [];
  const requiredIngredients = [];
  
  // Список посуды, которую нужно исключить из ингредиентов
  const glassware = ['stein', 'highball', 'rocks', 'coupe', 'shaker'];
  
  steps.forEach(step => {
    const stepLower = step.toLowerCase();
    const ingredientPatterns = [
      /\b(stein|highball|rocks|coupe|shaker)\b/,
      /\b(gin|rum|vodka|whiskey|tequila|mezcal|lager|vermouth|campari|liqueur|espresso)\b/,
      /\b(soda|syrup|mint|lime|orange|lemon|foam|cubes|white|beans|bitters|cola|ice)\b/,
    ];
    
    ingredientPatterns.forEach(pattern => {
      const match = stepLower.match(pattern);
      if (match) {
        const ing = match[1];
        // Исключаем действия и посуду из списка ингредиентов
        if (!['take', 'add', 'pour', 'top', 'stir', 'shake', 'muddle', 'strain', 'rim'].includes(ing) &&
            !glassware.includes(ing)) {
          // Нормализуем "cubes" в "ice" для совместимости
          const normalizedIng = ing === 'cubes' ? 'ice' : ing;
          requiredIngredients.push(normalizedIng);
        }
      }
    });
  });
  
  const uniqueRequired = [...new Set(requiredIngredients)];
  const drinkIds = drink.map(ing => ing.id.toLowerCase()).sort();
  const requiredSorted = uniqueRequired.sort();
  
  for (const required of requiredSorted) {
    if (!drinkIds.includes(required)) {
      console.log(`Missing ingredient: ${required}`);
      return false;
    }
  }
  
  const extraIngredients = drinkIds.filter(id => !requiredSorted.includes(id));
  if (extraIngredients.length > 2) {
    console.log(`Too many extra ingredients: ${extraIngredients.join(', ')}`);
    return false;
  }
  
  return drinkIds.length >= Math.max(2, Math.ceil(requiredSorted.length * 0.7));
}

function showCurrentHint() {
  if (!state.activeOrder) {
    status('No active order', true);
    return;
  }
  const hint = state.activeOrder.hint || state.activeOrder.shortHint;
  status(`Hint: ${hint}`);
}

function togglePause() {
  if (!state.timerId) {
    // Игра была на паузе, просто закрываем меню (игра возобновится автоматически)
    closePauseMenu();
  } else {
    // Ставим на паузу и открываем меню
    clearTimer();
    state.visitors.forEach(v => clearVisitorTimer(v));
    openPauseMenu();
    status('Paused.');
  }
}

function openPauseMenu() {
  if (!pauseMenuEl) return;
  pauseMenuEl.style.display = 'block';
  renderPauseMenuLevels();
}

function closePauseMenu() {
  if (!pauseMenuEl) return;
  pauseMenuEl.style.display = 'none';
  // При закрытии меню автоматически возобновляем игру
  if (!state.timerId) {
    tick();
    state.visitors.forEach(v => startVisitorTimer(v));
    status('Resumed.');
  }
}

function renderPauseMenuLevels() {
  if (!pauseMenuLevelsEl || !gameData.levels) return;
  
  pauseMenuLevelsEl.innerHTML = '';
  
  gameData.levels.forEach(level => {
    const btn = document.createElement('button');
    btn.className = 'pause-menu__level-btn';
    if (state.currentLevel && state.currentLevel.id === level.id) {
      btn.classList.add('pause-menu__level-btn--active');
    }
    btn.textContent = `Level ${level.id}: ${level.name}`;
    btn.addEventListener('click', () => {
      // Переключаемся на выбранный уровень
      state.currentLevel = level;
      state.timer = level.timeLimit;
      state.served = 0;
      state.currentDrink = [];
      state.shakeProgress = 0;
      
      ordersEl.textContent = `0/${level.target}`;
      levelEl.textContent = `Lv.${level.id}`;
      
      renderVisitors();
      clearShaker();
      tick();
      closePauseMenu();
      status(`Switched to Level ${level.id}: ${level.name}`);
    });
    
    pauseMenuLevelsEl.appendChild(btn);
  });
}

function tick() {
  clearTimer();
  timeEl.textContent = formatTime(state.timer);
  state.timerId = setInterval(() => {
    state.timer -= 1;
    timeEl.textContent = formatTime(state.timer);
    if (state.timer <= 0) {
      clearTimer();
      state.visitors.forEach(v => clearVisitorTimer(v));
      status('Time up! Restarting level.', true);
      setTimeout(() => startLevel(), 2000);
    }
  }, 1000);
}

function clearTimer() {
  if (state.timerId) clearInterval(state.timerId);
  state.timerId = null;
}

function updateBest(elapsed) {
  if (state.bestTime === null || elapsed < state.bestTime) {
    state.bestTime = elapsed;
    renderBestTime();
  }
}

function renderBestTime() {
  bestEl.textContent = state.bestTime == null ? '—' : formatTime(state.bestTime);
}

function status(msg, isDanger = false) {
  statusLineEl.textContent = msg;
  statusLineEl.style.color = isDanger ? 'var(--danger)' : 'var(--muted)';
}

function formatTime(sec) {
  const m = Math.max(0, Math.floor(sec / 60));
  const s = Math.max(0, sec % 60);
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

// Утилита для просмотра всех ингредиентов в холодильнике (доступна в консоли)
window.showFridgeIngredients = function() {
  const allIngredients = new Map();
  
  gameData.levels.forEach(level => {
    if (level.ingredients) {
      level.ingredients.forEach(ing => {
        if (!allIngredients.has(ing.id)) {
          allIngredients.set(ing.id, ing);
        }
      });
    }
  });
  
  const sorted = Array.from(allIngredients.values()).sort((a, b) => a.id.localeCompare(b.id));
  
  console.log('%cВсе ингредиенты в холодильнике:', 'font-size: 16px; font-weight: bold; color: #f1b33f;');
  console.log('================================');
  sorted.forEach((ing, i) => {
    console.log(`${(i+1).toString().padStart(2, '0')}. ${ing.id.padEnd(20)} - ${ing.label}`);
  });
  console.log('================================');
  console.log(`Всего: ${allIngredients.size} уникальных ингредиентов`);
  
  return sorted;
};
