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
const btnRecipes = document.getElementById('btn-recipes');
const recipesMenuEl = document.getElementById('recipes-menu');
const recipesMenuCloseEl = document.getElementById('recipes-menu-close');
const recipesMenuListEl = document.getElementById('recipes-menu-list');

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
  isShaken: false, // Флаг, что шейкер был взболтан до 100%
  isDraggingShaker: false,
  lastShakePosition: { x: 0, y: 0 },
  shakeAnimationId: null,
};

// Позиции посетителей у барной стойки (перед баром, но не на столе)
const VISITOR_POSITIONS = [
  { left: '50%', top: '-10%' }, // Центр, значительно выше середины экрана
];

// Адаптивные позиции для мобильных устройств
function getVisitorPositions() {
  const isMobile = window.innerWidth <= 768;
  const isSmallMobile = window.innerWidth <= 480;
  
  if (isSmallMobile) {
    // Для очень маленьких экранов - один посетитель по центру, значительно выше
    return [
      { left: '50%', top: '12%' },
    ];
  } else if (isMobile) {
    // Для мобильных - один посетитель по центру, значительно выше
    return [
      { left: '50%', top: '14%' },
    ];
  }
  
  // Для десктопов - используем стандартные позиции
  return VISITOR_POSITIONS;
}

document.addEventListener('DOMContentLoaded', async () => {
  attachControls();
  await loadData();
  hydrateProgress();
  startNewRun();
  
  // Обработчик изменения размера окна для адаптации на мобильных
  let resizeTimeout;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(() => {
      // Пересоздаем посетителей с новыми позициями при изменении размера
      if (state.visitors.length > 0 && state.currentLevel) {
        const activeVisitor = state.activeVisitor;
        if (activeVisitor) {
          const order = activeVisitor.order;
          const positions = getVisitorPositions();
          const position = positions[0] || VISITOR_POSITIONS[0];
          
          // Обновляем позицию текущего посетителя (всегда по центру)
          activeVisitor.element.style.left = position.left || '50%';
          activeVisitor.element.style.top = position.top;
          // Transform будет установлен анимацией, не перезаписываем его если анимация активна
          if (!activeVisitor.element.hasAttribute('data-animating')) {
            activeVisitor.element.style.transform = 'translateX(-50%)';
          }
        }
      }
    }, 250);
  });
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
  
  // Обработчики для меню рецептов
  btnRecipes?.addEventListener('click', openRecipesMenu);
  recipesMenuCloseEl?.addEventListener('click', closeRecipesMenu);
  recipesMenuEl?.querySelector('.recipes-menu__overlay')?.addEventListener('click', closeRecipesMenu);
  
  // Клик по пивному крану — наливаем или опустошаем бокал
  beerTapEl?.addEventListener('click', handleBeerTap);
  
  // Перетаскивание бокала между краном и подносом
  if (beerGlassEl) {
    beerGlassEl.setAttribute('draggable', 'true');
    beerGlassEl.addEventListener('dragstart', handleBeerGlassDragStart);
    beerGlassEl.addEventListener('dragend', handleBeerGlassDragEnd);
    // Добавляем поддержку touch-событий для мобильных
    beerGlassEl.addEventListener('touchstart', handleBeerGlassTouchStart, { passive: false });
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
      // Проверяем, что перетаскиваемый элемент является ингредиентом
      // (имеет класс fridge-menu__item или является валидным ингредиентом)
      const draggedEl = draggedElement || document.querySelector(`[data-id="${ingredientId}"]`);
      if (draggedEl && draggedEl.classList.contains('fridge-menu__item')) {
        addIngredientToShaker(ingredientId);
      } else {
        // Пытаемся добавить, но addIngredientToShaker проверит валидность
        addIngredientToShaker(ingredientId);
      }
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
        // Показываем коктейль на подносе
        if (state.currentDrink.length > 0) {
          showDrinkOnTray();
          // Сбрасываем прогресс после показа коктейля
          setTimeout(() => {
            state.shakeProgress = 0;
            if (shakeProgressBarEl) {
              shakeProgressBarEl.style.width = '0%';
            }
            if (shakeProgressLabelEl) {
              shakeProgressLabelEl.textContent = '0%';
              shakeProgressLabelEl.style.color = 'var(--text)';
            }
          }, 500);
        }
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
        // Показываем коктейль на подносе
        if (state.currentDrink.length > 0) {
          showDrinkOnTray();
          // Сбрасываем прогресс после показа коктейля
          setTimeout(() => {
            state.shakeProgress = 0;
            if (shakeProgressBarEl) {
              shakeProgressBarEl.style.width = '0%';
            }
            if (shakeProgressLabelEl) {
              shakeProgressLabelEl.textContent = '0%';
              shakeProgressLabelEl.style.color = 'var(--text)';
            }
          }, 500);
        }
      }
    }
  });
}

function updateShakeProgress(distance) {
  // Накопление прогресса зависит от силы тряски (pourSpeed)
  const progressPerPixel = 0.1 * state.pourSpeed; // Чем больше сила, тем быстрее накапливается
  const wasComplete = state.shakeProgress >= 100;
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
      state.isShaken = true; // Помечаем, что шейкер взболтан
      
      // Когда шейкер готов, автоматически показываем коктейль на подносе
      if (!wasComplete && state.currentDrink.length > 0) {
        showDrinkOnTray();
        // Сбрасываем прогресс после показа коктейля (но флаг isShaken остается true)
        setTimeout(() => {
          state.shakeProgress = 0;
          if (shakeProgressBarEl) {
            shakeProgressBarEl.style.width = '0%';
          }
          if (shakeProgressLabelEl) {
            shakeProgressLabelEl.textContent = '0%';
            shakeProgressLabelEl.style.color = 'var(--text)';
          }
        }, 500); // Небольшая задержка, чтобы игрок увидел "READY!"
      }
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
  state.isShaken = false; // Сбрасываем флаг при старте уровня
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

  // Удаляем старые speech-bubble из .tavern перед созданием нового посетителя
  const tavernEl = document.querySelector('.tavern');
  if (tavernEl) {
    const oldBubbles = tavernEl.querySelectorAll('.speech-bubble');
    oldBubbles.forEach(bubble => bubble.remove());
  }

  visitorsContainerEl.innerHTML = '';
  state.visitors = [];

  const orders = [...state.currentLevel.orders];
  const randomIndex = Math.floor(Math.random() * orders.length);
  const order = orders[randomIndex];
  const positions = getVisitorPositions();
  const position = positions[0] || VISITOR_POSITIONS[0];

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
  
  // Устанавливаем позицию (left всегда 50% для центрирования)
  visitorEl.style.left = position.left || '50%';
  visitorEl.style.top = position.top;
  
  // Помечаем, что анимация активна
  visitorEl.setAttribute('data-animating', 'true');
  
  // После завершения анимации убираем флаг
  setTimeout(() => {
    visitorEl.removeAttribute('data-animating');
  }, 1200);

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
  
  // Удаляем speech-bubble из visitor и перемещаем его в .tavern для независимого позиционирования
  bubbleEl.remove();
  const tavernEl = document.querySelector('.tavern');
  if (tavernEl) {
    tavernEl.appendChild(bubbleEl);
  }
  
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
  
  // Сохраняем родительский элемент для возврата
  const originalParent = element.parentElement;
  const originalNextSibling = element.nextSibling;
  
  // Перемещаем элемент в body, чтобы он не обрезался меню
  document.body.appendChild(element);
  
  element.style.position = 'fixed';
  element.style.left = touch.clientX - rect.width / 2 + 'px';
  element.style.top = touch.clientY - rect.height / 2 + 'px';
  element.style.zIndex = '3000';  // выше меню (1000) и паузы (2000)
  element.classList.add('dragging');
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
      
      // Проверка наведения на бокал пива (для создания shandy)
      if (beerGlassEl) {
        const beerGlassRect = beerGlassEl.getBoundingClientRect();
        if (t.clientX >= beerGlassRect.left && t.clientX <= beerGlassRect.right &&
            t.clientY >= beerGlassRect.top && t.clientY <= beerGlassRect.bottom &&
            beerGlassEl.dataset.state === 'full') {
          beerGlassEl.style.filter = 'drop-shadow(0 0 12px rgba(241, 179, 63, 0.8))';
        } else {
          beerGlassEl.style.filter = '';
        }
      }
    }
  };
  
  const handleTouchEnd = (ev) => {
    const shakerRect = shakerEl.getBoundingClientRect();
    const beerGlassRect = beerGlassEl?.getBoundingClientRect();
    const touchEnd = ev.changedTouches[0];
    
    let handled = false;
    
    // Проверяем, что элемент является ингредиентом из меню холодильника
    if (touchEnd.clientX >= shakerRect.left && touchEnd.clientX <= shakerRect.right &&
        touchEnd.clientY >= shakerRect.top && touchEnd.clientY <= shakerRect.bottom) {
      // Проверяем, что элемент имеет класс fridge-menu__item (ингредиент из меню)
      if (element.classList.contains('fridge-menu__item') && element.dataset.id) {
        addIngredientToShaker(element.dataset.id);
        handled = true;
      } else {
        status('Only ingredients can be added to the shaker!', true);
      }
    }
    
    // Проверяем, перетащили ли ингредиент на бокал пива (для создания shandy)
    if (!handled && beerGlassRect && beerGlassEl && 
        touchEnd.clientX >= beerGlassRect.left && touchEnd.clientX <= beerGlassRect.right &&
        touchEnd.clientY >= beerGlassRect.top && touchEnd.clientY <= beerGlassRect.bottom) {
      // Проверяем, что элемент является ингредиентом из меню
      if (element.classList.contains('fridge-menu__item') && element.dataset.id) {
        const ingredientId = element.dataset.id.toLowerCase();
        // Проверяем, что это кола (coke или cola)
        if (ingredientId === 'coke' || ingredientId === 'cola') {
          // Проверяем, что бокал полный (содержит пиво)
          if (beerGlassEl.dataset.state === 'full') {
            // Превращаем пиво в shandy
            beerGlassEl.src = './src/assets/icons/shandy.png';
            beerGlassEl.dataset.state = 'shandy';
            beerGlassEl.style.filter = '';
            // Скрываем trash/коктейль с подноса при создании shandy
            hideTrayDrink();
            status('Shandy created! Beer + Cola', false);
            handled = true;
          } else {
            status('Fill the glass with beer first!', true);
          }
        } else {
          status('Only cola can be mixed with beer!', true);
        }
      }
    }
    
    // Возвращаем элемент обратно в меню
    element.classList.remove('dragging');
    element.style.position = '';
    element.style.left = '';
    element.style.top = '';
    element.style.zIndex = '';
    
    // Возвращаем элемент в исходное место
    if (!handled) {
      if (originalNextSibling) {
        originalParent.insertBefore(element, originalNextSibling);
      } else {
        originalParent.appendChild(element);
      }
    } else {
      // Если ингредиент был использован, возвращаем его в меню
      if (originalNextSibling) {
        originalParent.insertBefore(element, originalNextSibling);
      } else {
        originalParent.appendChild(element);
      }
    }
    
    document.removeEventListener('touchmove', handleTouchMove);
    document.removeEventListener('touchend', handleTouchEnd);
    draggedElement = null;
    shakerEl.classList.remove('drag-over');
    if (beerGlassEl) {
      beerGlassEl.style.filter = '';
    }
  };
  
  document.addEventListener('touchmove', handleTouchMove, { passive: false });
  document.addEventListener('touchend', handleTouchEnd, { once: true });
  e.preventDefault();
}

function addIngredientToShaker(ingredientId) {
  // Проверяем, что это не специальные элементы интерфейса
  const forbiddenIds = ['beer-glass', 'fridge', 'tap', 'trash', 'shaker', 'tray', 'server'];
  if (forbiddenIds.includes(ingredientId)) {
    status('This item cannot be added to the shaker!', true);
    return;
  }
  
  // Ищем ингредиент во всех уровнях, а не только в текущем
  let ingredient = null;
  
  if (gameData.levels) {
    for (const level of gameData.levels) {
      if (level.ingredients) {
        ingredient = level.ingredients.find(ing => ing.id === ingredientId);
        if (ingredient) break;
      }
    }
  }
  
  // Если ингредиент не найден в списке ингредиентов, не добавляем его
  if (!ingredient) {
    status('Only ingredients can be added to the shaker!', true);
    return;
  }
  
  // Если добавляем первый ингредиент в пустой шейкер, скрываем предыдущий напиток с подноса
  if (state.currentDrink.length === 0) {
    hideTrayDrink();
    state.isShaken = false; // Сбрасываем флаг при добавлении нового ингредиента
  }
  
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
  state.isShaken = false; // Сбрасываем флаг при очистке шейкера
  state.isDraggingShaker = false;
  shakerContentEl.innerHTML = '';
  shakerEl?.classList.remove('shaking');
  shakerEl?.classList.remove('dragging');
  
  // Скрываем коктейль с подноса при очистке шейкера
  hideTrayDrink();
  
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
  if (!order || !order.name) return null;
  
  const name = order.name.toLowerCase();
  
  if (name.includes('shandy')) return 'shandy.png';
  if (name.includes('mojito')) return 'mojito.png';
  if (name.includes('negroni')) return 'negroni.png';
  if (name.includes('gin') && name.includes('tonic')) return 'gintonic.png';
  if (name.includes('cuba libre')) return 'cuba_libre.png';
  if (name.includes('coke') || name.includes('cola')) return 'coke.png';
  if (name.includes('old fashioned')) return 'oldfashioned.png';
  if (name.includes('mana elixir')) return 'ManaElixir.png';
  // Проверка для Dragon's Breath (разные варианты написания с апострофом или без)
  // Проверяем наличие обоих слов "dragon" и "breath" в названии
  // Учитываем возможные варианты: "dragon's breath", "dragons breath", "dragon breath"
  if (name.includes('dragon') && name.includes('breath')) {
    return 'dragonsbreath.png';
  }
  
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
    // Скрываем trash/коктейль с подноса при наливании пива
    hideTrayDrink();
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

// Обработчик touch-событий для бокала пива на мобильных
function handleBeerGlassTouchStart(e) {
  if (!beerGlassEl) return;
  
  const touch = e.touches[0];
  const element = beerGlassEl;
  const rect = element.getBoundingClientRect();
  
  // Сохраняем родительский элемент для возврата
  const originalParent = element.parentElement;
  const originalNextSibling = element.nextSibling;
  
  // Перемещаем элемент в body, чтобы он не обрезался
  document.body.appendChild(element);
  
  element.style.position = 'fixed';
  element.style.left = touch.clientX - rect.width / 2 + 'px';
  element.style.top = touch.clientY - rect.height / 2 + 'px';
  element.style.zIndex = '3000';
  element.classList.add('dragging');
  
  const handleTouchMove = (ev) => {
    if (ev.touches.length > 0) {
      const t = ev.touches[0];
      element.style.left = t.clientX - rect.width / 2 + 'px';
      element.style.top = t.clientY - rect.height / 2 + 'px';
      
      // Проверка наведения на кран и поднос
      const tapRect = beerTapContainerEl?.getBoundingClientRect();
      const trayRect = trayContainerEl?.getBoundingClientRect();
      
      if (tapRect && t.clientX >= tapRect.left && t.clientX <= tapRect.right &&
          t.clientY >= tapRect.top && t.clientY <= tapRect.bottom) {
        beerTapContainerEl.style.filter = 'drop-shadow(0 0 12px rgba(241, 179, 63, 0.8))';
      } else {
        beerTapContainerEl.style.filter = '';
      }
      
      if (trayRect && t.clientX >= trayRect.left && t.clientX <= trayRect.right &&
          t.clientY >= trayRect.top && t.clientY <= trayRect.bottom) {
        trayContainerEl.style.filter = 'drop-shadow(0 0 12px rgba(241, 179, 63, 0.8))';
      } else {
        trayContainerEl.style.filter = '';
      }
    }
  };
  
  const handleTouchEnd = (ev) => {
    const touchEnd = ev.changedTouches[0];
    let dropped = false;
    
    // Проверяем, куда был сброшен бокал
    const tapRect = beerTapContainerEl?.getBoundingClientRect();
    const trayRect = trayContainerEl?.getBoundingClientRect();
    
    if (tapRect && touchEnd.clientX >= tapRect.left && touchEnd.clientX <= tapRect.right &&
        touchEnd.clientY >= tapRect.top && touchEnd.clientY <= tapRect.bottom) {
      // Перемещаем бокал под кран
      beerTapContainerEl.appendChild(element);
      element.style.position = 'static';
      status('Glass moved under the tap.', false);
      dropped = true;
    } else if (trayRect && touchEnd.clientX >= trayRect.left && touchEnd.clientX <= trayRect.right &&
               touchEnd.clientY >= trayRect.top && touchEnd.clientY <= trayRect.bottom) {
      // Ставим бокал на поднос
      trayContainerEl.appendChild(element);
      element.style.position = '';
      status('Glass placed on the tray.', false);
      dropped = true;
    }
    
    // Если не сбросили в нужное место, возвращаем в исходное
    if (!dropped) {
      if (originalNextSibling) {
        originalParent.insertBefore(element, originalNextSibling);
      } else {
        originalParent.appendChild(element);
      }
    }
    
    // Очищаем стили
    element.classList.remove('dragging');
    element.style.position = '';
    element.style.left = '';
    element.style.top = '';
    element.style.zIndex = '';
    beerTapContainerEl.style.filter = '';
    trayContainerEl.style.filter = '';
    
    document.removeEventListener('touchmove', handleTouchMove);
    document.removeEventListener('touchend', handleTouchEnd);
  };
  
  document.addEventListener('touchmove', handleTouchMove, { passive: false });
  document.addEventListener('touchend', handleTouchEnd, { once: true });
  e.preventDefault();
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
  // Скрываем trash/коктейль с подноса при создании shandy
  hideTrayDrink();
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
    
    // Проверяем, что шейкер был взболтан (либо прогресс 100%, либо флаг isShaken)
    if (state.shakeProgress < 100 && !state.isShaken) {
      status(`Shake the shaker more! (${Math.floor(state.shakeProgress)}%)`, true);
      return;
    }
    
    const isValid = validateRecipe(state.currentDrink, state.activeOrder);
    
    if (isValid) {
      // Ингредиенты подходят к текущему заказу - успешная подача
      // Коктейль уже показан на подносе после взбалтывания, просто скрываем его
      hideTrayDrink();
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
      // Рецепт невалиден для текущего заказа - проверяем, подходят ли ингредиенты к какому-то рецепту
      const matchedOrder = findMatchingRecipe(state.currentDrink);
      
      // Коктейль уже показан на подносе после взбалтывания, просто скрываем его
      hideTrayDrink();
      
      if (matchedOrder) {
        // Ингредиенты подходят к какому-то рецепту, но не к текущему заказу
        status(`Wrong order! You made ${matchedOrder.name}, but customer wants ${state.activeOrder.name}.`, true);
        clearShaker();
      } else {
        // Ингредиенты не подходят ни к одному рецепту - создали trash
        status('Trash created! Ingredients don\'t match any recipe.', true);
        clearShaker();
      }
    }
  }
}

// Находит рецепт, к которому подходят ингредиенты (если есть)
function findMatchingRecipe(drink) {
  if (!drink || drink.length === 0) return null;
  if (!gameData.levels) return null;
  
  // Проверяем все рецепты во всех уровнях
  for (const level of gameData.levels) {
    if (!level.orders) continue;
    
    for (const order of level.orders) {
      // Проверяем, подходит ли текущий набор ингредиентов к этому рецепту
      if (validateRecipe(drink, order)) {
        return order; // Нашли подходящий рецепт
      }
    }
  }
  
  return null; // Не подходит ни к одному рецепту
}

// Показывает trash на подносе
function showTrayTrash() {
  if (!trayDrinkEl) return;
  trayDrinkEl.src = './src/assets/icons/trash.png';
  trayDrinkEl.alt = 'Trash';
  trayDrinkEl.style.display = 'block';
}

// Автоматически показывает коктейль на подносе после взбалтывания
function showDrinkOnTray() {
  if (!trayDrinkEl || !state.currentDrink || state.currentDrink.length === 0) return;
  
  // Сначала скрываем предыдущий напиток (если был)
  hideTrayDrink();
  
  // Ищем подходящий рецепт
  const matchedOrder = findMatchingRecipe(state.currentDrink);
  
  if (matchedOrder) {
    // Показываем найденный коктейль
    showTrayDrink(matchedOrder);
    // Показываем название коктейля в статусе
    status(`Cocktail created: ${matchedOrder.name}`, false);
  } else {
    // Показываем trash
    showTrayTrash();
    // Показываем в статусе, что создан trash
    status('Trash created! Ingredients don\'t match any recipe.', true);
  }
}

// Скрывает коктейль с подноса
function hideTrayDrink() {
  if (!trayDrinkEl) return;
  trayDrinkEl.style.display = 'none';
}

function validateRecipe(drink, order) {
  // Используем явный список ингредиентов из рецепта
  const requiredIngredients = order.ingredients || [];
  
  // Если ингредиенты не указаны явно, возвращаем false (рецепт некорректный)
  if (requiredIngredients.length === 0) {
    console.warn(`Recipe "${order.name}" has no ingredients specified!`);
    return false;
  }
  
  const drinkIds = drink.map(ing => ing.id.toLowerCase()).sort();
  const requiredIds = requiredIngredients.map(ing => ing.toLowerCase()).sort();
  
  // Отладочный вывод
  console.log('=== Recipe Validation ===');
  console.log('Order:', order.name);
  console.log('Required ingredients:', requiredIds);
  console.log('Drink ingredients:', drinkIds);
  
  // Проверяем, что все требуемые ингредиенты присутствуют
  for (const required of requiredIds) {
    if (!drinkIds.includes(required)) {
      console.log(`Missing ingredient: ${required}`);
      return false;
    }
  }
  
  // Проверяем лишние ингредиенты - не допускаем лишних вообще
  const extraIngredients = drinkIds.filter(id => !requiredIds.includes(id));
  if (extraIngredients.length > 0) {
    console.log(`Extra ingredients not allowed: ${extraIngredients.join(', ')}`);
    console.log(`Expected: ${requiredIds.join(', ')}, but got: ${drinkIds.join(', ')}`);
    return false;
  }
  
  // Проверяем, что количество ингредиентов точно соответствует требуемому
  if (drinkIds.length !== requiredIds.length) {
    console.log(`Ingredient count mismatch: got ${drinkIds.length}, required ${requiredIds.length}`);
    return false;
  }
  
  return true;
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

// Меню рецептов
function openRecipesMenu() {
  if (!recipesMenuEl) return;
  recipesMenuEl.style.display = 'block';
  renderRecipes();
}

function closeRecipesMenu() {
  if (!recipesMenuEl) return;
  recipesMenuEl.style.display = 'none';
}

function renderRecipes() {
  if (!recipesMenuListEl || !gameData.levels) return;
  
  recipesMenuListEl.innerHTML = '';
  
  // Собираем все уникальные рецепты из всех уровней
  const allRecipes = new Map();
  
  gameData.levels.forEach(level => {
    if (!level.orders) return;
    
    level.orders.forEach(order => {
      // Используем название коктейля как ключ, чтобы избежать дубликатов
      const key = order.name.toLowerCase();
      if (!allRecipes.has(key)) {
        allRecipes.set(key, {
          name: order.name,
          hint: order.hint || order.shortHint || '',
          steps: order.steps || [],
          ingredients: order.ingredients || [],
          level: level.name
        });
      }
    });
  });
  
  // Сортируем рецепты по названию
  const sortedRecipes = Array.from(allRecipes.values()).sort((a, b) => 
    a.name.localeCompare(b.name)
  );
  
  // Рендерим каждый рецепт
  sortedRecipes.forEach(recipe => {
    const recipeEl = document.createElement('div');
    recipeEl.className = 'recipes-menu__item';
    
    // Извлекаем ингредиенты из рецепта (используем поле ingredients, если есть)
    const ingredients = extractIngredientsFromSteps(recipe.steps, recipe.ingredients);
    
    // Получаем картинку готового коктейля
    const cocktailImage = getTraySpriteForOrder({ name: recipe.name });
    const cocktailImagePath = cocktailImage 
      ? `./src/assets/icons/${cocktailImage}` 
      : './src/assets/icons/FullPintOfBeer.png'; // fallback
    
    // Заголовок рецепта с картинкой коктейля
    const headerEl = document.createElement('div');
    headerEl.className = 'recipes-menu__item-header';
    
    const imageEl = document.createElement('img');
    imageEl.className = 'recipes-menu__item-image';
    imageEl.src = cocktailImagePath;
    imageEl.alt = recipe.name;
    
    const infoEl = document.createElement('div');
    infoEl.className = 'recipes-menu__item-info';
    
    const nameEl = document.createElement('h3');
    nameEl.className = 'recipes-menu__item-name';
    nameEl.textContent = recipe.name;
    
    const hintEl = document.createElement('p');
    hintEl.className = 'recipes-menu__item-hint';
    hintEl.textContent = recipe.hint;
    
    infoEl.appendChild(nameEl);
    infoEl.appendChild(hintEl);
    headerEl.appendChild(imageEl);
    headerEl.appendChild(infoEl);
    
    // Список ингредиентов
    const ingredientsEl = document.createElement('div');
    ingredientsEl.className = 'recipes-menu__item-ingredients';
    
    if (ingredients.length > 0) {
      const ingredientsTitleEl = document.createElement('h4');
      ingredientsTitleEl.className = 'recipes-menu__item-ingredients-title';
      ingredientsTitleEl.textContent = 'Ingredients:';
      
      const ingredientsListEl = document.createElement('div');
      ingredientsListEl.className = 'recipes-menu__item-ingredients-list';
      
      ingredients.forEach(ing => {
        const ingEl = document.createElement('div');
        ingEl.className = 'recipes-menu__ingredient';
        
        const ingImageEl = document.createElement('img');
        ingImageEl.className = 'recipes-menu__ingredient-image';
        ingImageEl.src = getIconPath(ing.id);
        ingImageEl.alt = ing.label;
        
        const ingLabelEl = document.createElement('span');
        ingLabelEl.className = 'recipes-menu__ingredient-label';
        ingLabelEl.textContent = ing.label;
        
        ingEl.appendChild(ingImageEl);
        ingEl.appendChild(ingLabelEl);
        ingredientsListEl.appendChild(ingEl);
      });
      
      ingredientsEl.appendChild(ingredientsTitleEl);
      ingredientsEl.appendChild(ingredientsListEl);
    }
    
    recipeEl.appendChild(headerEl);
    recipeEl.appendChild(ingredientsEl);
    recipesMenuListEl.appendChild(recipeEl);
  });
}

// Извлекает ингредиенты из рецепта (использует поле ingredients, если есть, иначе извлекает из steps)
function extractIngredientsFromSteps(steps, recipeIngredients) {
  // Если ингредиенты указаны явно в рецепте, используем их
  if (recipeIngredients && recipeIngredients.length > 0) {
    const ingredients = [];
    recipeIngredients.forEach(ingId => {
      // Ищем ингредиент в данных уровней для получения label
      let ingredientData = null;
      if (gameData.levels) {
        for (const level of gameData.levels) {
          if (level.ingredients) {
            ingredientData = level.ingredients.find(ing => ing.id === ingId);
            if (ingredientData) break;
          }
        }
      }
      
      ingredients.push({
        id: ingId,
        label: ingredientData?.label || ingId.charAt(0).toUpperCase() + ingId.slice(1)
      });
    });
    return ingredients;
  }
  
  // Иначе извлекаем из steps (старый способ для обратной совместимости)
  if (!steps || steps.length === 0) return [];
  
  const ingredients = [];
  const glassware = ['stein', 'highball', 'rocks', 'coupe', 'shaker', 'mug', 'glass'];
  const actions = ['take', 'add', 'pour', 'top', 'stir', 'shake', 'muddle', 'strain', 'rim', 'fill'];
  
  steps.forEach(step => {
    const stepLower = step.toLowerCase();
    
    // Паттерны для поиска ингредиентов
    // Сначала проверяем специальные случаи (многословные ингредиенты)
    if (stepLower.includes('blue mana syrup') || stepLower.includes('blue syrup')) {
      const normalizedIng = 'blueEssence';
      if (!ingredients.find(i => i.id === normalizedIng)) {
        let ingredientData = null;
        if (gameData.levels) {
          for (const level of gameData.levels) {
            if (level.ingredients) {
              ingredientData = level.ingredients.find(ing => ing.id === normalizedIng);
              if (ingredientData) break;
            }
          }
        }
        ingredients.push({
          id: normalizedIng,
          label: ingredientData?.label || 'Blue mana syrup'
        });
      }
    }
    
    if (stepLower.includes('dragon chili syrup') || stepLower.includes('chili syrup')) {
      const normalizedIng = 'chiliSyrup';
      if (!ingredients.find(i => i.id === normalizedIng)) {
        let ingredientData = null;
        if (gameData.levels) {
          for (const level of gameData.levels) {
            if (level.ingredients) {
              ingredientData = level.ingredients.find(ing => ing.id === normalizedIng);
              if (ingredientData) break;
            }
          }
        }
        ingredients.push({
          id: normalizedIng,
          label: ingredientData?.label || 'Dragon chili syrup'
        });
      }
    }
    
    if (stepLower.includes('red bitter') || (stepLower.includes('bitter') && !stepLower.includes('bitters'))) {
      const normalizedIng = 'bitter';
      if (!ingredients.find(i => i.id === normalizedIng)) {
        let ingredientData = null;
        if (gameData.levels) {
          for (const level of gameData.levels) {
            if (level.ingredients) {
              ingredientData = level.ingredients.find(ing => ing.id === normalizedIng);
              if (ingredientData) break;
            }
          }
        }
        ingredients.push({
          id: normalizedIng,
          label: ingredientData?.label || 'Red bitter'
        });
      }
    }
    
    // Обычные паттерны для остальных ингредиентов
    const ingredientPatterns = [
      /\b(gin|rum|vodka|whiskey|tequila|mezcal|lager|vermouth|campari|liqueur|espresso|bitters)\b/,
      /\b(soda|syrup|mint|lime|orange|lemon|pineapple|foam|cubes|white|beans|cola|ice|tonic)\b/,
    ];
    
    ingredientPatterns.forEach(pattern => {
      const match = stepLower.match(pattern);
      if (match) {
        const ing = match[1];
        // Исключаем действия и посуду
        if (!actions.includes(ing) && !glassware.includes(ing)) {
          // Нормализуем "cubes" в "ice"
          const normalizedIng = ing === 'cubes' ? 'ice' : ing;
          
          // Проверяем, не добавлен ли уже этот ингредиент
          if (!ingredients.find(i => i.id === normalizedIng)) {
            // Ищем ингредиент в данных уровней для получения label
            let ingredientData = null;
            if (gameData.levels) {
              for (const level of gameData.levels) {
                if (level.ingredients) {
                  ingredientData = level.ingredients.find(ing => ing.id === normalizedIng);
                  if (ingredientData) break;
                }
              }
            }
            
            ingredients.push({
              id: normalizedIng,
              label: ingredientData?.label || normalizedIng.charAt(0).toUpperCase() + normalizedIng.slice(1)
            });
          }
        }
      }
    });
  });
  
  return ingredients;
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
