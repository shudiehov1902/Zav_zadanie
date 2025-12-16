import { getIconPath } from './iconMap.js';

// DOM элементы
const visitorsContainerEl = document.getElementById('visitors-container');
const ingredientGridEl = document.getElementById('ingredient-grid');
const shakerEl = document.getElementById('shaker');
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
const btnRotate = document.getElementById('btn-rotate');
const btnShake = document.getElementById('btn-shake');
const pourSpeedInput = document.getElementById('pour-speed');
const shakeIntensityEl = document.getElementById('shake-intensity');
const powerHintEl = document.getElementById('power-hint');
const shakeProgressBarEl = document.getElementById('shake-progress-bar');
const shakeProgressLabelEl = document.getElementById('shake-progress-label');

const STORAGE_KEY = 'tavern-tapper-progress';
const VISITOR_TEMPLATE = document.getElementById('visitor-template');
const INGREDIENT_TEMPLATE = document.getElementById('ingredient-chip');

let gameData = { levels: [] };
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
  // V2 mode
  v2Mode: false,
  mistakes: 0,
  v2Index: 0,
};

// Позиции посетителей (можно настроить)
const VISITOR_POSITIONS = [
  { left: '20%', top: '15%' },
  { left: '40%', top: '15%' },
  { left: '60%', top: '15%' },
  { left: '80%', top: '15%' },
];

// V2 drink recipes mapping to ingredient ids present in the project
const DRINK_RECIPES_V2 = {
  beer: ['stein', 'lager', 'foam'],
  cola: ['highball', 'soda'],
  mojito: ['highball', 'rum', 'mint', 'lime', 'syrup', 'soda', 'cubes'],
  cuba_libre: ['highball', 'rum', 'soda', 'lime'],
  negroni: ['rocks', 'gin', 'campari', 'vermouth', 'orange'],
};

const HERO_SPRITES = ['knight', 'witch2', 'mag', 'dwarf'];

function getSpeedMs(speed) {
  switch (speed) {
    case 'very_fast': return 300;
    case 'fast': return 500;
    case 'medium_fast': return 700;
    case 'medium': return 900;
    default: return 1200; // slow
  }
}

function getWaitTimeSec(speed) {
  switch (speed) {
    case 'very_fast': return 6;
    case 'fast': return 8;
    case 'medium_fast': return 10;
    case 'medium': return 12;
    default: return 15;
  }
}

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
  btnRotate?.addEventListener('click', handleRotate);
  pourSpeedInput?.addEventListener('input', (e) => {
    state.pourSpeed = parseInt(e.target.value);
    updateShakeIntensity();
    status(`Shake power: ${getPowerLabel(state.pourSpeed)}`);
  });
  
  // Инициализация подсказок
  updateShakeIntensity();
  
  document.addEventListener('keydown', (e) => {
    if (e.key.toLowerCase() === 'r' && !e.ctrlKey && !e.metaKey) {
      handleRotate();
    }
  });
  
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

  // Adjust visitor walk transition based on customer speed (v2) — configured on startLevel
  
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
    // Try V2 levels first
    try {
      const resV2 = await fetch('./src/js/data/levels_v2.json');
      if (resV2.ok) {
        const v2 = await resV2.json();
        if (v2 && Array.isArray(v2.levels) && v2.levels.length) {
          state.v2Mode = true;
          gameData = { levels: v2.levels };
          statUniqueEl.textContent = v2.levels.length.toString();
          return;
        }
      }
    } catch (_) { /* ignore */ }

    // Fallback to legacy levels.json
    const res = await fetch('./src/js/data/levels.json');
    gameData = await res.json();
    statUniqueEl.textContent = gameData.levels.length.toString();
  } catch (err) {
    console.error(err);
    status('Failed to load levels data', true);
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
  state.mistakes = 0;
  if (state.v2Mode) state.v2Index = 0;
  statRunsEl.textContent = state.runs.toString();
  startLevel();
  persistProgress();
}

function startLevel() {
  clearTimer();
  if (!gameData.levels.length) return;

  if (state.v2Mode) {
    const v2 = gameData.levels[state.v2Index] || gameData.levels[0];
    // Build derived level compatible with legacy code
    const allowed = v2.allowedDrinks || [];
    // Build ingredients union
    const ingSet = new Set();
    allowed.forEach(d => {
      const rec = DRINK_RECIPES_V2[d] || [];
      rec.forEach(x => ingSet.add(x));
    });
    const ingredients = Array.from(ingSet).map(id => ({ id, label: id.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()) }));
    // Build orders list from allowed drinks
    const orders = allowed.map(d => ({ id: d, name: d.replace(/_/g, ' ').toUpperCase(), shortHint: 'Make it right', hint: '' }));

    state.currentLevel = {
      id: v2.id,
      name: `Level ${v2.id}`,
      timeLimit: v2.timeLimitSec,
      target: v2.requiredOrders,
      maxMistakes: v2.maxMistakes ?? 0,
      customerSpeed: v2.customerSpeed || 'slow',
      allowedDrinks: allowed,
      ingredients,
      orders,
    };
    state.timer = state.currentLevel.timeLimit;
    state.served = 0;
    state.mistakes = 0;
  } else {
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
  }

  state.currentDrink = [];
  state.rotation = 0;
  state.isShaking = false;
  state.shakeProgress = 0;
  state.isDraggingShaker = false;
  state.pourSpeed = 2; // Сброс на среднюю силу

  ordersEl.textContent = `0/${state.currentLevel.target}` + (state.v2Mode && state.currentLevel.maxMistakes > 0 ? ` • 0/${state.currentLevel.maxMistakes}` : '');
  levelEl.textContent = `Lv.${state.currentLevel.id}`;

  // Обновляем слайдер
  if (pourSpeedInput) {
    pourSpeedInput.value = state.pourSpeed;
  }

  // Apply customer speed transition (v2)
  if (state.v2Mode) {
    const prev = document.getElementById('v2-speed-style');
    if (prev) prev.remove();
    const ms = getSpeedMs(state.currentLevel.customerSpeed);
    const style = document.createElement('style');
    style.id = 'v2-speed-style';
    style.textContent = `.visitor{transition: left ${ms}ms ease}`;
    document.head.appendChild(style);
  }

  renderVisitors();
  renderIngredients(); // Показываем ВСЕ ингредиенты уровня
  clearShaker();
  updateShakeIntensity();
  tick();
  status(`Level ${state.currentLevel.name} — serve ${state.currentLevel.target} drinks`);
}

function renderVisitors() {
  visitorsContainerEl.innerHTML = '';
  state.visitors = [];

  const visitorCount = 4;

  for (let i = 0; i < visitorCount; i++) {
    const position = VISITOR_POSITIONS[i] || VISITOR_POSITIONS[0];
    const order = state.v2Mode
      ? makeRandomOrderV2()
      : (state.currentLevel.orders[i % state.currentLevel.orders.length]);
    const visitor = createVisitor(order, i, position, { spawnFromEdge: true });
    state.visitors.push(visitor);
    visitorsContainerEl.appendChild(visitor.element);
  }

  if (state.visitors.length > 0) {
    activateVisitor(state.visitors[0]);
  }
}

function createVisitor(order, index, position, options = {}) {
  const clone = VISITOR_TEMPLATE.content.cloneNode(true);
  const visitorEl = clone.querySelector('.visitor');
  const bubbleEl = clone.querySelector('.speech-bubble');
  const titleEl = bubbleEl.querySelector('.speech-bubble__title');
  const hintEl = bubbleEl.querySelector('.speech-bubble__hint');

  // Hero sprite
  const heroImg = document.createElement('img');
  heroImg.className = 'visitor__hero';
  const heroKey = HERO_SPRITES[Math.floor(Math.random() * HERO_SPRITES.length)];
  heroImg.src = `./heroes/${heroKey}.png`;
  heroImg.alt = heroKey;

  // Initial position (spawn)
  if (options.spawnFromEdge && state.v2Mode) {
    visitorEl.style.left = '-15%';
    visitorEl.style.top = position.top;
    // Walk in next tick
    setTimeout(() => {
      visitorEl.style.left = position.left;
    }, 30);
  } else {
    visitorEl.style.left = position.left;
    visitorEl.style.top = position.top;
  }

  titleEl.textContent = order.name.toUpperCase();
  hintEl.textContent = order.shortHint || '';
  bubbleEl.dataset.orderId = order.name;

  // Compose element
  visitorEl.appendChild(heroImg);

  const waitSec = state.v2Mode ? getWaitTimeSec(state.currentLevel.customerSpeed) : state.currentLevel.timeLimit;

  const visitor = {
    element: visitorEl,
    bubble: bubbleEl,
    order: order,
    index: index,
    timer: waitSec,
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
      if (state.v2Mode) {
        state.mistakes += 1;
        updateOrdersHud();
        status('Customer left unhappy.', true);
        // Reset this visitor with a new order
        resetVisitorOrderV2(visitor);
        if (state.currentLevel.maxMistakes && state.mistakes > state.currentLevel.maxMistakes) {
          endLevelFail('Too many mistakes!');
          return;
        }
        // Move to next visitor
        activateNextVisitor();
      } else {
        if (visitor === state.activeVisitor) {
          status('Order expired! Try next customer.', true);
          activateNextVisitor();
        }
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

function makeRandomOrderV2() {
  const allowed = state.currentLevel.allowedDrinks || [];
  const id = allowed[Math.floor(Math.random() * allowed.length)];
  return {
    id,
    name: id.replace(/_/g, ' ').toUpperCase(),
    shortHint: 'Make it right',
  };
}

function resetVisitorOrderV2(visitor) {
  if (!state.v2Mode) return;
  const newOrder = makeRandomOrderV2();
  visitor.order = newOrder;
  const titleEl = visitor.bubble.querySelector('.speech-bubble__title');
  const hintEl = visitor.bubble.querySelector('.speech-bubble__hint');
  const timerEl = visitor.bubble.querySelector('.speech-bubble__timer');
  if (titleEl) titleEl.textContent = newOrder.name;
  if (hintEl) hintEl.textContent = 'Make it right';
  if (timerEl) timerEl.textContent = '';
  visitor.bubble.classList.remove('expired', 'served', 'active');
  visitor.timer = getWaitTimeSec(state.currentLevel.customerSpeed);
  clearVisitorTimer(visitor);
  // Re-start timer only if this is the active one
  if (visitor === state.activeVisitor) startVisitorTimer(visitor);
}

function updateOrdersHud() {
  if (!ordersEl) return;
  if (state.v2Mode && state.currentLevel.maxMistakes > 0) {
    ordersEl.textContent = `${state.served}/${state.currentLevel.target} • ${state.mistakes}/${state.currentLevel.maxMistakes}`;
  } else {
    ordersEl.textContent = `${state.served}/${state.currentLevel.target}`;
  }
}

function endLevelFail(msg) {
  status(msg, true);
  clearTimer();
  state.visitors.forEach(v => clearVisitorTimer(v));
  setTimeout(() => {
    // Restart the same level index in v2
    startLevel();
  }, 1500);
}

function activateNextVisitor() {
  const currentIndex = state.visitors.indexOf(state.activeVisitor);
  const nextIndex = (currentIndex + 1) % state.visitors.length;
  activateVisitor(state.visitors[nextIndex]);
}

function renderIngredients() {
  ingredientGridEl.innerHTML = '';
  
  // Показываем ВСЕ ингредиенты уровня, независимо от текущего заказа
  if (!state.currentLevel || !state.currentLevel.ingredients) {
    return;
  }
  
  // Размещаем ингредиенты на столе горизонтально, все видны одновременно
  state.currentLevel.ingredients.forEach((ing, index) => {
    const chip = INGREDIENT_TEMPLATE.content.cloneNode(true);
    const ingredientEl = chip.querySelector('.ingredient-on-table');
    
    // Не используем абсолютное позиционирование, используем flexbox
    ingredientEl.dataset.id = ing.id;
    ingredientEl.dataset.label = ing.label;
    
    const img = document.createElement('img');
    img.src = getIconPath(ing.id);
    img.alt = ing.label;
    img.draggable = false;
    img.title = ing.label;
    
    const label = document.createElement('span');
    label.className = 'chip__label';
    label.textContent = ing.label;
    
    ingredientEl.appendChild(img);
    ingredientEl.appendChild(label);
    
    ingredientEl.addEventListener('dragstart', handleDragStart);
    ingredientEl.addEventListener('dragend', handleDragEnd);
    ingredientEl.addEventListener('touchstart', handleTouchStart, { passive: false });
    ingredientEl.addEventListener('dblclick', () => addIngredientToShaker(ing.id));
    
    ingredientGridEl.appendChild(chip);
  });
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

function handleServe() {
  if (!state.activeOrder || state.currentDrink.length === 0) {
    status('Prepare a drink first!', true);
    return;
  }

  if (state.shakeProgress < 100) {
    status(`Shake the shaker more! (${Math.floor(state.shakeProgress)}%)`, true);
    return;
  }

  let isValid = false;

  if (state.v2Mode) {
    const target = DRINK_RECIPES_V2[state.activeOrder.id] || [];
    const have = state.currentDrink.map(i => i.id);
    // minimal check: include all target ingredients, allow a small number of extras
    const missing = target.filter(t => !have.includes(t));
    const extras = have.filter(h => !target.includes(h));
    isValid = missing.length === 0 && extras.length <= 2;
  } else {
    isValid = validateRecipe(state.currentDrink, state.activeOrder);
  }

  if (isValid) {
    state.served += 1;
    updateOrdersHud();
    progressEl.style.width = Math.min(100, (state.served / state.currentLevel.target) * 100) + '%';

    clearVisitorTimer(state.activeVisitor);
    state.activeVisitor.bubble.classList.remove('active');
    state.activeVisitor.bubble.classList.add('served');

    status(`✓ ${state.activeOrder.name} served!`, false);
    clearShaker();

    if (state.served >= state.currentLevel.target) {
      if (state.v2Mode) {
        status('Level complete! Next level...');
        state.v2Index = Math.min(state.v2Index + 1, gameData.levels.length - 1);
      } else {
        const elapsed = state.currentLevel.timeLimit - state.timer;
        state.servedSet.add(state.currentLevel.id);
        updateBest(elapsed);
        status('Level complete! Starting next level...');
      }
      setTimeout(() => startLevel(), 1500);
    } else {
      if (state.v2Mode) {
        // Give the same visitor a new random order and move on
        resetVisitorOrderV2(state.activeVisitor);
      }
      setTimeout(() => {
        activateNextVisitor();
      }, 600);
    }

    persistProgress();
  } else {
    if (state.v2Mode) {
      state.mistakes += 1;
      updateOrdersHud();
      if (state.currentLevel.maxMistakes && state.mistakes > state.currentLevel.maxMistakes) {
        endLevelFail('Too many mistakes!');
        return;
      }
    }
    status('Wrong recipe! Check the order.', true);
  }
}

function validateRecipe(drink, order) {
  const steps = order.steps || [];
  const requiredIngredients = [];
  
  steps.forEach(step => {
    const stepLower = step.toLowerCase();
    const ingredientPatterns = [
      /\b(stein|highball|rocks|coupe|shaker)\b/,
      /\b(gin|rum|vodka|whiskey|tequila|mezcal|lager|vermouth|campari|liqueur|espresso)\b/,
      /\b(soda|syrup|mint|lime|orange|lemon|foam|cubes|white|beans|bitters)\b/,
    ];
    
    ingredientPatterns.forEach(pattern => {
      const match = stepLower.match(pattern);
      if (match) {
        const ing = match[1];
        if (!['take', 'add', 'pour', 'top', 'stir', 'shake', 'muddle', 'strain', 'rim'].includes(ing)) {
          requiredIngredients.push(ing);
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
  if (state.v2Mode) {
    status(`Order: ${state.activeOrder.name}`);
    return;
  }
  const hint = state.activeOrder.hint || state.activeOrder.shortHint;
  status(`Hint: ${hint}`);
}

function togglePause() {
  if (!state.timerId) {
    tick();
    state.visitors.forEach(v => startVisitorTimer(v));
    status('Resumed.');
  } else {
    clearTimer();
    state.visitors.forEach(v => clearVisitorTimer(v));
    status('Paused.');
  }
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
      if (state.v2Mode) {
        endLevelFail('Time up!');
      } else {
        status('Time up! Restarting level.', true);
        setTimeout(() => startLevel(), 2000);
      }
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
