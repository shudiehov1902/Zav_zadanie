import { getIconPath } from './iconMap.js';

const visitorsContainerEl = document.getElementById('visitors-container');
const ingredientGridEl = document.getElementById('ingredient-grid'); 
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
const hudRunsEl = document.getElementById('hud-runs');
const statRunsEl = document.getElementById('stat-runs');
const statUniqueEl = document.getElementById('stat-unique');
const progressEl = document.getElementById('fill-progress');

const btnServe = document.getElementById('btn-serve');
const btnHint = document.getElementById('btn-hint');
const btnReset = document.getElementById('btn-reset');
const btnPause = document.getElementById('btn-pause');
const btnFullscreen = document.getElementById('btn-fullscreen');
const backgroundMusicEl = document.getElementById('background-music');
const btnRotate = null; 
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
const winMenuEl = document.getElementById('win-menu');
const winMenuTimeEl = document.getElementById('win-menu-time');
const winMenuRestartEl = document.getElementById('win-menu-restart');
const loseMenuEl = document.getElementById('lose-menu');
const loseMenuRestartEl = document.getElementById('lose-menu-restart');
const orientationMessageEl = document.getElementById('orientation-message');
const btnInstructions = document.getElementById('btn-instructions');
const instructionsMenuEl = document.getElementById('instructions-menu');
const instructionsMenuCloseEl = document.getElementById('instructions-menu-close');
const pauseMenuInstructionsEl = document.getElementById('pause-menu-instructions');
const startMenuEl = document.getElementById('start-menu');
const startMenuStartEl = document.getElementById('start-menu-start');
const startMenuTitleEl = document.getElementById('start-menu-title');
const startMenuMessageEl = document.getElementById('start-menu-message');
const startMenuActionsEl = document.getElementById('start-menu-actions');

const STORAGE_KEY = 'tavern-tapper-progress';

const TAVERN_BASE_WIDTH = 1280;
const TAVERN_BASE_HEIGHT = 720;

function updateTavernScale() {
  const tavernEl = document.querySelector('.tavern');
  if (!tavernEl) return;
  const contentEl = tavernEl.querySelector('.tavern__content');
  if (!contentEl) return;

  const availableWidth = tavernEl.clientWidth;
  const availableHeight = tavernEl.clientHeight;
  if (!availableWidth || !availableHeight) return;

  const scale = Math.min(
    availableWidth / TAVERN_BASE_WIDTH,
    availableHeight / TAVERN_BASE_HEIGHT
  );

  contentEl.style.transform = `translateX(-50%) scale(${scale})`;
}
const VISITOR_TEMPLATE = document.getElementById('visitor-template');
const INGREDIENT_TEMPLATE = document.getElementById('ingredient-chip');

let gameData = { levels: [] };

function getDisplayName(item) {
  return item?.displayName || item?.name || '';
}

function getIngredientLabel(ingredient) {
  return ingredient?.displayLabel || ingredient?.label || ingredient?.id || '';
}

const VISITOR_CHARACTERS = [
  { id: 'knight', icon: 'knight.png', label: 'Rytier' },
  { id: 'witch', icon: 'witch.png', label: 'Čarodejnica' },
  { id: 'mage', icon: 'mage.png', label: 'Mág' },
  { id: 'dwarf', icon: 'dwarf.png', label: 'Trpaslík' },
];

function getRandomVisitorCharacter() {
  const idx = Math.floor(Math.random() * VISITOR_CHARACTERS.length);
  return VISITOR_CHARACTERS[idx];
}
let state = {
  currentLevel: null,
  currentLevelId: null,
  activeOrder: null,
  activeVisitor: null,
  visitors: [],
  timer: 0,
  timerId: null,
  served: 0,
  bestTime: null,
  levelStats: {}, 
  servedSet: new Set(),
  usedOrdersInLevel: new Set(), 
  runs: 0,
  currentDifficulty: 1, 
  runStartTime: null, 
  currentDrink: [], 
  rotation: 0,
  pourSpeed: 2,
  isShaking: false,
  shakeProgress: 0, 
  isShaken: false, 
  isDraggingShaker: false,
  lastShakePosition: { x: 0, y: 0 },
  shakeAnimationId: null,
};

const VISITOR_POSITIONS = [
  { left: '50%', bottom: '118px' },
];

function getVisitorPositions() {
  return VISITOR_POSITIONS;
}

function checkOrientation() {
  if (!orientationMessageEl) return;

  const pageEl = document.querySelector('.page');
  
  const isPortrait = window.innerHeight > window.innerWidth;
  
  if (isPortrait) {
    orientationMessageEl.style.display = 'flex';
    if (pageEl) pageEl.style.display = 'none';
    document.body.style.overflow = 'hidden';
  } else {
    orientationMessageEl.style.display = 'none';
    if (pageEl) pageEl.style.display = '';
    document.body.style.overflow = '';
  }
}

let resizeHandlerAdded = false;

function hideMobileAddressBar() {
  if (/iPhone|iPad|iPod|Android/i.test(navigator.userAgent)) {
    setTimeout(() => {
      window.scrollTo(0, 1);
    }, 100);
    
    const viewportHeight = window.innerHeight;
    document.documentElement.style.height = `${viewportHeight}px`;
    document.documentElement.style.overflow = 'hidden';
    document.body.style.height = `${viewportHeight}px`;
    document.body.style.overflow = 'hidden';
    
    if (!resizeHandlerAdded) {
      resizeHandlerAdded = true;
      window.addEventListener('resize', () => {
        const currentHeight = window.innerHeight;
        document.documentElement.style.height = `${currentHeight}px`;
        document.body.style.height = `${currentHeight}px`;
      });
    }
  }
}

async function requestFullscreen() {
  try {
    const element = document.documentElement;
    
    if (element.requestFullscreen) {
      await element.requestFullscreen();
    } else if (element.webkitRequestFullscreen) {
      await element.webkitRequestFullscreen();
    } else if (element.webkitRequestFullScreen) {
      await element.webkitRequestFullScreen();
    } else if (element.mozRequestFullScreen) {
      await element.mozRequestFullScreen();
    } else if (element.msRequestFullscreen) {
      await element.msRequestFullscreen();
    } else {
      hideMobileAddressBar();
    }
    
    if (/iPhone|iPad|iPod|Android/i.test(navigator.userAgent)) {
      hideMobileAddressBar();
      
      if (screen.orientation && screen.orientation.lock) {
        try {
          await screen.orientation.lock('landscape');
        } catch (e) {
          console.log('Orientation lock failed:', e);
        }
      }
    }
  } catch (err) {
    console.log('Fullscreen request failed:', err);
    hideMobileAddressBar();
  }
}

function isFullscreen() {
  return !!(document.fullscreenElement || 
            document.webkitFullscreenElement || 
            document.mozFullScreenElement || 
            document.msFullscreenElement);
}

function exitFullscreen() {
  if (document.exitFullscreen) {
    document.exitFullscreen();
  } else if (document.webkitExitFullscreen) {
    document.webkitExitFullscreen();
  } else if (document.mozCancelFullScreen) {
    document.mozCancelFullScreen();
  } else if (document.msExitFullscreen) {
    document.msExitFullscreen();
  }
}

function toggleFullscreen() {
  if (isFullscreen()) {
    exitFullscreen();
  } else {
    requestFullscreen();
  }
}

function updateFullscreenButton() {
  if (!btnFullscreen) return;
  if (isFullscreen()) {
    btnFullscreen.textContent = '⛶';
    btnFullscreen.title = 'Ukončiť celú obrazovku';
  } else {
    btnFullscreen.textContent = '⛶';
    btnFullscreen.title = 'Celá obrazovka';
  }
}

function startBackgroundMusic() {
  if (!backgroundMusicEl) return;
  
  const playPromise = backgroundMusicEl.play();
  
  if (playPromise !== undefined) {
    playPromise.catch(error => {
      console.log('Music autoplay prevented:', error);
    });
  }
}

function stopBackgroundMusic() {
  if (!backgroundMusicEl) return;
  backgroundMusicEl.pause();
  backgroundMusicEl.currentTime = 0;
}

document.addEventListener('DOMContentLoaded', async () => {
  
  checkOrientation();
  window.addEventListener('orientationchange', checkOrientation);
  window.addEventListener('resize', checkOrientation);

  updateTavernScale();

  attachControls();
  await loadData();
  hydrateProgress();
  
  hideMobileAddressBar();
  
  setTimeout(async () => {
    if (!isFullscreen()) {
      await requestFullscreen();
    }
  }, 500);
  
  let lastTouchY = 0;
  window.addEventListener('touchstart', (e) => {
    lastTouchY = e.touches[0].clientY;
    hideMobileAddressBar();
  });
  
  window.addEventListener('touchmove', (e) => {
    const currentY = e.touches[0].clientY;
    if (Math.abs(currentY - lastTouchY) > 10) {
      hideMobileAddressBar();
    }
  });
  
  window.addEventListener('scroll', () => {
    hideMobileAddressBar();
  });
  
  window.addEventListener('resize', () => {
    hideMobileAddressBar();
  });
  
  document.addEventListener('fullscreenchange', () => {
    updateFullscreenButton();
  });
  
  document.addEventListener('webkitfullscreenchange', () => {
    updateFullscreenButton();
  });
  
  document.addEventListener('mozfullscreenchange', () => {
    updateFullscreenButton();
  });
  
  document.addEventListener('MSFullscreenChange', () => {
    updateFullscreenButton();
  });
  
  updateFullscreenButton();
  
  if (backgroundMusicEl) {
    backgroundMusicEl.volume = 0.5;
    
    const startMusicOnInteraction = () => {
      startBackgroundMusic();
      document.removeEventListener('click', startMusicOnInteraction);
      document.removeEventListener('touchstart', startMusicOnInteraction);
    };
    
    document.addEventListener('click', startMusicOnInteraction, { once: true });
    document.addEventListener('touchstart', startMusicOnInteraction, { once: true });
  }

  
  showStartMenu();

  let resizeTimeout;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(() => {
      
      updateTavernScale();

      if (state.visitors.length > 0 && state.currentLevel) {
        const activeVisitor = state.activeVisitor;
        if (activeVisitor) {
          const order = activeVisitor.order;
          const positions = getVisitorPositions();
          const position = positions[0] || VISITOR_POSITIONS[0];
          
          activeVisitor.element.style.left = position.left || '50%';
          activeVisitor.element.style.bottom = position.bottom;
          
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
  btnReset?.addEventListener('click', () => {
    
    state.servedSet.clear();
    state.usedOrdersInLevel.clear();
    state.currentDifficulty = 1;
    state.runStartTime = null;
    startNewRun();
  });
  btnHint?.addEventListener('click', showCurrentHint);
  btnPause?.addEventListener('click', togglePause);
  btnFullscreen?.addEventListener('click', toggleFullscreen);
  
  pauseMenuCloseEl?.addEventListener('click', closePauseMenu);
  pauseMenuResumeEl?.addEventListener('click', closePauseMenu);
  pauseMenuRestartEl?.addEventListener('click', () => {
    closePauseMenu();
    startLevel();
  });
  pauseMenuEl?.querySelector('.pause-menu__overlay')?.addEventListener('click', closePauseMenu);
  
  barFridgeEl?.addEventListener('click', toggleFridgeMenu);
  fridgeMenuCloseEl?.addEventListener('click', closeFridgeMenu);
  fridgeMenuEl?.querySelector('.fridge-menu__overlay')?.addEventListener('click', closeFridgeMenu);
  
  btnRecipes?.addEventListener('click', openRecipesMenu);
  recipesMenuCloseEl?.addEventListener('click', closeRecipesMenu);
  recipesMenuEl?.querySelector('.recipes-menu__overlay')?.addEventListener('click', closeRecipesMenu);
  
  btnInstructions?.addEventListener('click', openInstructionsMenu);
  instructionsMenuCloseEl?.addEventListener('click', closeInstructionsMenu);
  instructionsMenuEl?.querySelector('.instructions-menu__overlay')?.addEventListener('click', closeInstructionsMenu);
  pauseMenuInstructionsEl?.addEventListener('click', openInstructionsMenu);
  
  startMenuStartEl?.addEventListener('click', handleStartGame);
  
  winMenuRestartEl?.addEventListener('click', () => {
    closeWinMenu();
    state.servedSet.clear();
    state.usedOrdersInLevel.clear();
    state.currentDifficulty = 1;
    state.runStartTime = null;
    startNewRun();
  });
  winMenuEl?.querySelector('.win-menu__overlay')?.addEventListener('click', closeWinMenu);

  loseMenuRestartEl?.addEventListener('click', () => {
    closeLoseMenu();
    
    state.servedSet.clear();
    state.usedOrdersInLevel.clear();
    state.currentDifficulty = 1;
    state.runStartTime = null;
    startNewRun();
  });
  loseMenuEl?.querySelector('.lose-menu__overlay')?.addEventListener('click', closeLoseMenu);

  beerTapEl?.addEventListener('click', handleBeerTap);
  
  if (beerGlassEl) {
    beerGlassEl.setAttribute('draggable', 'false');
    setupBeerGlassDragging();
  }

  if (beerGlassEl) {
    beerGlassEl.addEventListener('dragover', (e) => {
      e.preventDefault();
      
      if (beerGlassEl.dataset.state === 'full') {
        beerGlassEl.style.filter = 'drop-shadow(0 0 12px rgba(241, 179, 63, 0.8))';
      }
    });
    
    beerGlassEl.addEventListener('dragleave', () => {
      beerGlassEl.style.filter = '';
    });
    
    beerGlassEl.addEventListener('drop', handleIngredientOnBeerGlass);
  }
  
  shakerEl?.addEventListener('dragover', (e) => {
    e.preventDefault();
    shakerEl.classList.add('drag-over');
  });
  
  shakerEl?.addEventListener('dragleave', () => {
    shakerEl.classList.remove('drag-over');
  });
  
  setupShakerShaking();
  
  window.handleDrop = function(e) {
    e.preventDefault();
    shakerEl?.classList.remove('drag-over');
    const ingredientId = e.dataTransfer.getData('text/plain');
    if (ingredientId) {

      const draggedEl = draggedElement || document.querySelector(`[data-id="${ingredientId}"]`);
      if (draggedEl && draggedEl.classList.contains('fridge-menu__item')) {
        addIngredientToShaker(ingredientId);
      } else {
        
        addIngredientToShaker(ingredientId);
      }
    }
  };
}

function setupShakerShaking() {
  if (!shakerEl) return;
  
  const shakerContainer = shakerEl.closest('.shaker-container');
  if (!shakerContainer) return;
  
  let isMouseDown = false;
  let startX = 0;
  let startY = 0;
  let currentX = 0;
  let currentY = 0;
  let lastMoveX = 0;
  let lastMoveY = 0;
  let shakeDistance = 0;
  let originalPosition = null;
  let originalTransform = null;
  let returnAnimationId = null;

  function saveOriginalPosition() {
    const rect = shakerContainer.getBoundingClientRect();
    const computedStyle = window.getComputedStyle(shakerContainer);
    
    originalPosition = {
      left: rect.left,
      top: rect.top,
      width: rect.width,
      height: rect.height
    };
    originalTransform = computedStyle.transform;
  }

  function returnToOriginalPosition() {
    if (!originalPosition || !shakerContainer) return;

    if (returnAnimationId) {
      cancelAnimationFrame(returnAnimationId);
    }
    
    const startLeft = parseFloat(shakerContainer.style.left) || originalPosition.left;
    const startTop = parseFloat(shakerContainer.style.top) || originalPosition.top;

    const currentTransform = shakerContainer.style.transform || '';
    let startRotation = 0;
    const rotateMatch = currentTransform.match(/rotate\(([^)]+)\)/);
    if (rotateMatch) {
      startRotation = parseFloat(rotateMatch[1]) || 0;
    }
    
    const startSpeed = state.pourSpeed;
    
    const targetLeft = originalPosition.left;
    const targetTop = originalPosition.top;
    const targetRotation = 0;
    const targetSpeed = 2; 
    
    const duration = 500; 
    const startTime = performance.now();
    
    function animate(currentTime) {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);

      const easeOut = 1 - Math.pow(1 - progress, 3);
      
      const currentLeft = startLeft + (targetLeft - startLeft) * easeOut;
      const currentTop = startTop + (targetTop - startTop) * easeOut;
      const currentRotation = startRotation + (targetRotation - startRotation) * easeOut;
      const currentSpeed = startSpeed + (targetSpeed - startSpeed) * easeOut;
      
      shakerContainer.style.left = currentLeft + 'px';
      shakerContainer.style.top = currentTop + 'px';
      shakerContainer.style.transform = `rotate(${currentRotation}deg)`;
      state.pourSpeed = Math.round(currentSpeed);
      updateShakeIntensity();
      
      if (progress < 1) {
        returnAnimationId = requestAnimationFrame(animate);
      } else {
        
        shakerContainer.style.position = '';
        shakerContainer.style.left = '';
        shakerContainer.style.top = '';
        shakerContainer.style.transform = '';
        returnAnimationId = null;
      }
    }
    
    returnAnimationId = requestAnimationFrame(animate);
  }

  shakerEl.addEventListener('mousedown', (e) => {
    if (state.currentDrink.length === 0) {
      status('Najprv pridajte ingrediencie do šejkra!', true);
      return;
    }

    if (!originalPosition) {
      saveOriginalPosition();
    }
    
    isMouseDown = true;
    state.isDraggingShaker = true;
    shakerEl.classList.add('dragging');
    
    const rect = shakerContainer.getBoundingClientRect();
    startX = e.clientX - rect.left;
    startY = e.clientY - rect.top;
    currentX = e.clientX;
    currentY = e.clientY;
    lastMoveX = e.clientX;
    lastMoveY = e.clientY;
    shakeDistance = 0;

    shakerContainer.style.position = 'fixed';
    shakerContainer.style.left = rect.left + 'px';
    shakerContainer.style.top = rect.top + 'px';
    shakerContainer.style.zIndex = '1000';
    
    e.preventDefault();
  });
  
  document.addEventListener('mousemove', (e) => {
    if (!isMouseDown || !state.isDraggingShaker) return;
    
    currentX = e.clientX;
    currentY = e.clientY;

    const rect = shakerContainer.getBoundingClientRect();
    const newLeft = currentX - startX;
    const newTop = currentY - startY;
    
    shakerContainer.style.left = newLeft + 'px';
    shakerContainer.style.top = newTop + 'px';

    const deltaX = currentX - originalPosition.left;
    const deltaY = currentY - originalPosition.top;
    const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
    
    const angle = Math.atan2(deltaY, deltaX) * (180 / Math.PI);
    shakerContainer.style.transform = `rotate(${angle}deg)`;

    const maxDistance = 300;
    const normalizedDistance = Math.min(distance / maxDistance, 1);
    state.pourSpeed = Math.max(1, Math.min(4, Math.round(1 + normalizedDistance * 3)));
    updateShakeIntensity();

    const moveDeltaX = Math.abs(e.clientX - lastMoveX);
    const moveDeltaY = Math.abs(e.clientY - lastMoveY);
    const moveDistance = Math.sqrt(moveDeltaX * moveDeltaX + moveDeltaY * moveDeltaY);
    
    if (moveDistance > 5) {
      shakeDistance += moveDistance;
      updateShakeProgress(shakeDistance);
      
      if (!shakerEl.classList.contains('shaking')) {
        shakerEl.classList.add('shaking');
      }
    }
    
    lastMoveX = e.clientX;
    lastMoveY = e.clientY;
    e.preventDefault();
  });
  
  document.addEventListener('mouseup', () => {
    if (isMouseDown) {
      isMouseDown = false;
      state.isDraggingShaker = false;
      shakerEl.classList.remove('dragging');
      shakerEl.classList.remove('shaking');

      returnToOriginalPosition();
      
      if (state.shakeProgress >= 100) {
        state.isShaking = false;
        status('Nápoj je dokonale premiešaný a pripravený na servírovanie.');
        if (state.currentDrink.length > 0) {
          showDrinkOnTray();
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
  
  shakerEl.addEventListener('touchstart', (e) => {
    if (state.currentDrink.length === 0) {
      status('Najprv pridajte ingrediencie do šejkra!', true);
      return;
    }
    
    const touch = e.touches[0];

    if (!originalPosition) {
      saveOriginalPosition();
    }
    
    isMouseDown = true;
    state.isDraggingShaker = true;
    shakerEl.classList.add('dragging');
    
    const rect = shakerContainer.getBoundingClientRect();
    startX = touch.clientX - rect.left;
    startY = touch.clientY - rect.top;
    currentX = touch.clientX;
    currentY = touch.clientY;
    lastMoveX = touch.clientX;
    lastMoveY = touch.clientY;
    shakeDistance = 0;

    shakerContainer.style.position = 'fixed';
    shakerContainer.style.left = rect.left + 'px';
    shakerContainer.style.top = rect.top + 'px';
    shakerContainer.style.zIndex = '1000';
    
    e.preventDefault();
  });
  
  document.addEventListener('touchmove', (e) => {
    if (!isMouseDown || !state.isDraggingShaker) return;
    const touch = e.touches[0];
    
    currentX = touch.clientX;
    currentY = touch.clientY;

    const rect = shakerContainer.getBoundingClientRect();
    const newLeft = currentX - startX;
    const newTop = currentY - startY;
    
    shakerContainer.style.left = newLeft + 'px';
    shakerContainer.style.top = newTop + 'px';

    const deltaX = currentX - originalPosition.left;
    const deltaY = currentY - originalPosition.top;
    const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
    
    const angle = Math.atan2(deltaY, deltaX) * (180 / Math.PI);
    shakerContainer.style.transform = `rotate(${angle}deg)`;

    const maxDistance = 300;
    const normalizedDistance = Math.min(distance / maxDistance, 1);
    state.pourSpeed = Math.max(1, Math.min(4, Math.round(1 + normalizedDistance * 3)));
    updateShakeIntensity();

    const moveDeltaX = Math.abs(touch.clientX - lastMoveX);
    const moveDeltaY = Math.abs(touch.clientY - lastMoveY);
    const moveDistance = Math.sqrt(moveDeltaX * moveDeltaX + moveDeltaY * moveDeltaY);
    
    if (moveDistance > 5) {
      shakeDistance += moveDistance;
      updateShakeProgress(shakeDistance);
      
      if (!shakerEl.classList.contains('shaking')) {
        shakerEl.classList.add('shaking');
      }
    }
    
    lastMoveX = touch.clientX;
    lastMoveY = touch.clientY;
    e.preventDefault();
  });
  
  document.addEventListener('touchend', () => {
    if (isMouseDown) {
      isMouseDown = false;
      state.isDraggingShaker = false;
      shakerEl.classList.remove('dragging');
      shakerEl.classList.remove('shaking');

      returnToOriginalPosition();
      
      if (state.shakeProgress >= 100) {
        state.isShaking = false;
        status('Nápoj je dokonale premiešaný a pripravený na servírovanie.');
        if (state.currentDrink.length > 0) {
          showDrinkOnTray();
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

  window.addEventListener('resize', () => {
    originalPosition = null;
  });
}

function updateShakeProgress(distance) {
  
  const progressPerPixel = 0.1 * state.pourSpeed; 
  const wasComplete = state.shakeProgress >= 100;
  const newProgress = Math.min(100, state.shakeProgress + (distance * progressPerPixel / 10));
  
  state.shakeProgress = newProgress;
  
  if (shakeProgressBarEl) {
    shakeProgressBarEl.style.width = `${newProgress}%`;
  }
  
  if (shakeProgressLabelEl) {
    shakeProgressLabelEl.textContent = `${Math.floor(newProgress)}%`;
    
    if (newProgress >= 100) {
      shakeProgressLabelEl.textContent = 'HOTOVO!';
      shakeProgressLabelEl.style.color = 'var(--success)';
      state.isShaken = true; 
      
      if (!wasComplete && state.currentDrink.length > 0) {
        showDrinkOnTray();
        
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
    if (!res.ok) {
      throw new Error(`HTTP ${res.status} while loading levels.json`);
    }
    gameData = await res.json();
    statUniqueEl.textContent = gameData.levels.length.toString();
  } catch (err) {
    console.error(err);
    const isFileProtocol = window.location.protocol === 'file:';
    const message = isFileProtocol
      ? 'Spustite hru cez lokálny server, nie priamo cez file://index.html'
      : 'Nepodarilo sa načítať dáta úrovní.';
    status(message, true);
  }
}

function hydrateProgress() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
    state.runs = saved.runs || 0;
    
    if (state.runs === 0) {
      state.bestTime = null;
      state.levelStats = {};
    } else {
      state.bestTime = saved.bestTime ?? null;
      state.levelStats = saved.levelStats || {};
    }
    
    state.servedSet = new Set(saved.servedSet || []);
    state.runStartTime = saved.runStartTime || null; 
    state.currentLevelId = saved.currentLevelId || null;

    const completedLevels = state.servedSet.size;
    if (completedLevels === 0) {
      state.currentDifficulty = 1;
    } else if (completedLevels === 1) {
      state.currentDifficulty = 2;
    } else if (completedLevels === 2) {
      state.currentDifficulty = 3;
    } else {
      state.currentDifficulty = 1; 
    }
    
    statRunsEl.textContent = state.runs.toString();
    if (hudRunsEl) hudRunsEl.textContent = state.runs.toString();
    renderBestTime();
  } catch (err) {
    console.warn('progress parse failed', err);
  }
}

function persistProgress() {
  const payload = {
    runs: state.runs,
    bestTime: state.bestTime,
    levelStats: state.levelStats, 
    servedSet: Array.from(state.servedSet),
    currentDifficulty: state.currentDifficulty, 
    currentLevelId: state.currentLevel ? state.currentLevel.id : null,
    runStartTime: state.runStartTime, 
  };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
}

function startNewRun() {
  if (!gameData.levels.length) return;
  state.runs += 1;
  state.served = 0;
  state.servedSet = new Set();
  state.usedOrdersInLevel.clear(); 
  state.currentDifficulty = 1; 
  state.currentLevelId = null;
  state.runStartTime = Date.now(); 
  statRunsEl.textContent = state.runs.toString();
  if (hudRunsEl) hudRunsEl.textContent = state.runs.toString();
  startLevel();
  persistProgress();
}

function startLevel() {
  clearTimer();
  if (!gameData.levels.length) return;
  
  const completedLevels = state.servedSet.size;

  if (completedLevels === 0) {
    state.currentDifficulty = 1;
  } else if (completedLevels === 1) {
    state.currentDifficulty = 2;
  } else if (completedLevels === 2) {
    state.currentDifficulty = 3;
  } else {
    
    showWinMessage();
    return;
  }

  const availableLevels = gameData.levels.filter(l => {
    const levelDifficulty = l.difficulty || 1;
    return !state.servedSet.has(l.id) && levelDifficulty === state.currentDifficulty;
  });

  let levelsToChoose = availableLevels.length > 0 ? availableLevels : 
    gameData.levels.filter(l => {
      const levelDifficulty = l.difficulty || 1;
      return levelDifficulty === state.currentDifficulty;
    });

  if (levelsToChoose.length === 0) {
    state.servedSet.clear();
    state.usedOrdersInLevel.clear();
    state.currentDifficulty = 1;
    startNewRun();
    return;
  }
  
  let selectedLevel = null;
  if (state.currentLevelId) {
    selectedLevel = levelsToChoose.find(l => l.id === state.currentLevelId);
  }
  
  if (!selectedLevel) {
    const randomIndex = Math.floor(Math.random() * levelsToChoose.length);
    selectedLevel = levelsToChoose[randomIndex];
  }
  
  state.currentLevel = selectedLevel;
  state.currentLevelId = selectedLevel.id;

  state.usedOrdersInLevel.clear();
  
  state.timer = state.currentLevel.timeLimit;
  state.served = 0;
  state.currentDrink = [];
  state.rotation = 0;
  state.isShaking = false;
  state.shakeProgress = 0;
  state.isShaken = false; 
  state.isDraggingShaker = false;
  state.pourSpeed = 2; 
  
  ordersEl.textContent = `0/${state.currentLevel.target}`;
  const difficulty = state.currentLevel.difficulty || 1;
  levelEl.textContent = `Nár. ${difficulty} Úr.${state.currentLevel.id}`;
  
  renderBestTime();

  if (pourSpeedInput) {
    pourSpeedInput.value = state.pourSpeed;
  }
  
  renderVisitors();
  renderIngredients(); 
  clearShaker();
  updateShakeIntensity();
  tick();
  status(`${getDisplayName(state.currentLevel)} — obslúžte ${state.currentLevel.target} objednávok`);
}

function renderVisitors() {
  
  visitorsContainerEl.innerHTML = '';
  state.visitors = [];
  spawnNextVisitor();
}

function spawnNextVisitor() {
  if (!state.currentLevel) return;

  if (state.served >= state.currentLevel.target || state.timer <= 0) return;

  const tavernEl = document.querySelector('.tavern');
  if (tavernEl) {
    const oldBubbles = tavernEl.querySelectorAll('.speech-bubble');
    oldBubbles.forEach(bubble => bubble.remove());
  }

  visitorsContainerEl.innerHTML = '';
  state.visitors = [];

  const allOrders = [...state.currentLevel.orders];
  const availableOrders = allOrders.filter(order => !state.usedOrdersInLevel.has(order.name));

  let ordersToChoose = availableOrders.length > 0 ? availableOrders : allOrders;

  if (availableOrders.length === 0) {
    state.usedOrdersInLevel.clear();
    ordersToChoose = allOrders;
  }

  const randomIndex = Math.floor(Math.random() * ordersToChoose.length);
  const order = ordersToChoose[randomIndex];

  state.usedOrdersInLevel.add(order.name);
  
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
  
  visitorEl.style.left = position.left || '50%';
  visitorEl.style.bottom = position.bottom;
  
  visitorEl.setAttribute('data-animating', 'true');
  
  setTimeout(() => {
    visitorEl.removeAttribute('data-animating');
  }, 1200);

  const character = getRandomVisitorCharacter();
  visitorEl.dataset.characterId = character.id;
  if (avatarImg) {
    avatarImg.src = `./src/assets/visitors/${character.icon}`;
    avatarImg.alt = character.label;
  }
  
  titleEl.textContent = getDisplayName(order).toUpperCase();
  hintEl.textContent = order.shortHint;
  bubbleEl.dataset.orderId = order.name;
  
  bubbleEl.remove();
  const tavernEl = document.querySelector('.tavern');
  const tavernContentEl = tavernEl?.querySelector('.tavern__content');
  if (tavernContentEl) {
    tavernContentEl.appendChild(bubbleEl);
  } else if (tavernEl) {
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
        status('Objednávka vypršala. Prichádza ďalší hosť.', true);
        
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
  status(`Aktívna objednávka: ${getDisplayName(visitor.order)}`);
}

function activateNextVisitor() {

  spawnNextVisitor();
}

function renderIngredients() {
  
  if (!fridgeMenuGridEl) return;
  
  fridgeMenuGridEl.innerHTML = '';
  
  if (!state.currentLevel || !state.currentLevel.ingredients) {
    return;
  }
  
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
  
  allIngredients.forEach((ing) => {
    const item = document.createElement('div');
    item.className = 'fridge-menu__item';
    item.dataset.id = ing.id;
    const displayLabel = getIngredientLabel(ing);
    item.dataset.label = displayLabel;
    item.draggable = true;
    
    const img = document.createElement('img');
    img.src = getIconPath(ing.id);
    img.alt = displayLabel;
    img.draggable = false;
    
    const label = document.createElement('span');
    label.className = 'fridge-menu__item-label';
    label.textContent = displayLabel;
    
    item.appendChild(img);
    item.appendChild(label);
    
    item.draggable = false;
    setupIngredientDragging(item, ing);
    
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
  renderIngredients(); 
  status('Chladnička je otvorená.');
}

function closeFridgeMenu() {
  if (!fridgeMenuEl) return;
  fridgeMenuEl.style.display = 'none';
  status('Chladnička je zatvorená.');
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
  
  const originalParent = element.parentElement;
  const originalNextSibling = element.nextSibling;
  
  document.body.appendChild(element);
  
  element.style.position = 'fixed';
  element.style.left = touch.clientX - rect.width / 2 + 'px';
  element.style.top = touch.clientY - rect.height / 2 + 'px';
  element.style.zIndex = '3000';  
  element.classList.add('dragging');
  draggedElement = element;
  
  const handleTouchMove = (ev) => {
    if (ev.touches.length > 0) {
      const t = ev.touches[0];
      element.style.left = t.clientX - rect.width / 2 + 'px';
      element.style.top = t.clientY - rect.height / 2 + 'px';
      
      const shakerRect = shakerEl.getBoundingClientRect();
      if (t.clientX >= shakerRect.left && t.clientX <= shakerRect.right &&
          t.clientY >= shakerRect.top && t.clientY <= shakerRect.bottom) {
        shakerEl.classList.add('drag-over');
      } else {
        shakerEl.classList.remove('drag-over');
      }
      
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
    
    if (touchEnd.clientX >= shakerRect.left && touchEnd.clientX <= shakerRect.right &&
        touchEnd.clientY >= shakerRect.top && touchEnd.clientY <= shakerRect.bottom) {
      
      if (element.classList.contains('fridge-menu__item') && element.dataset.id) {
        addIngredientToShaker(element.dataset.id);
        handled = true;
      } else {
        status('Do šejkra môžete pridať iba ingrediencie.', true);
      }
    }
    
    if (!handled && beerGlassRect && beerGlassEl && 
        touchEnd.clientX >= beerGlassRect.left && touchEnd.clientX <= beerGlassRect.right &&
        touchEnd.clientY >= beerGlassRect.top && touchEnd.clientY <= beerGlassRect.bottom) {
      
      if (element.classList.contains('fridge-menu__item') && element.dataset.id) {
        const ingredientId = element.dataset.id.toLowerCase();
        
        if (ingredientId === 'coke' || ingredientId === 'cola') {
          
          if (beerGlassEl.dataset.state === 'full') {
            
            beerGlassEl.src = './src/assets/icons/shandy.png';
            beerGlassEl.dataset.state = 'shandy';
            beerGlassEl.style.filter = '';
            
            hideTrayDrink();
            status('Shandy je pripravené: pivo a kola.', false);
            handled = true;
          } else {
            status('Najprv naplňte pohár pivom.', true);
          }
        } else {
          status('S pivom môžete zmiešať iba kolu.', true);
        }
      }
    }
    
    element.classList.remove('dragging');
    element.style.position = '';
    element.style.left = '';
    element.style.top = '';
    element.style.zIndex = '';
    
    if (!handled) {
      if (originalNextSibling) {
        originalParent.insertBefore(element, originalNextSibling);
      } else {
        originalParent.appendChild(element);
      }
    } else {
      
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

function setupIngredientDragging(item, ingredient) {
  if (!item || !ingredient) return;
  
  let isMouseDown = false;
  let hasMoved = false; 
  let currentX = 0;
  let currentY = 0;
  let lastMoveX = 0;
  let lastMoveY = 0;
  let startDragX = 0;
  let startDragY = 0;
  let originalPosition = null;
  let ghostElement = null;
  let returnAnimationId = null;

  function saveOriginalPosition() {
    const rect = item.getBoundingClientRect();
    originalPosition = {
      left: rect.left,
      top: rect.top,
      width: rect.width,
      height: rect.height
    };
  }

  function createGhostElement() {
    if (ghostElement) return ghostElement;
    
    const img = item.querySelector('img');
    if (!img) return null;
    
    ghostElement = document.createElement('img');
    ghostElement.src = img.src;
    ghostElement.alt = img.alt;
    ghostElement.style.position = 'fixed';
    ghostElement.style.width = '80px';
    ghostElement.style.height = '80px';
    ghostElement.style.pointerEvents = 'none';
    ghostElement.style.zIndex = '3000';
    ghostElement.style.imageRendering = 'pixelated';
    ghostElement.style.imageRendering = '-moz-crisp-edges';
    ghostElement.style.imageRendering = 'crisp-edges';
    ghostElement.style.filter = 'drop-shadow(0 4px 8px rgba(0,0,0,0.6))';
    ghostElement.style.opacity = '0.9';
    ghostElement.style.transition = 'none';
    
    document.body.appendChild(ghostElement);
    return ghostElement;
  }

  function removeGhostElement() {
    if (ghostElement && ghostElement.parentElement) {
      ghostElement.parentElement.removeChild(ghostElement);
    }
    ghostElement = null;
  }

  function returnToOriginalPosition() {
    if (!originalPosition || !ghostElement) return;

    if (returnAnimationId) {
      cancelAnimationFrame(returnAnimationId);
    }
    
    const startLeft = parseFloat(ghostElement.style.left) || originalPosition.left;
    const startTop = parseFloat(ghostElement.style.top) || originalPosition.top;

    const currentTransform = ghostElement.style.transform || '';
    let startRotation = 0;
    const rotateMatch = currentTransform.match(/rotate\(([^)]+)\)/);
    if (rotateMatch) {
      startRotation = parseFloat(rotateMatch[1]) || 0;
    }
    
    const startSpeed = state.pourSpeed;
    
    const targetLeft = originalPosition.left;
    const targetTop = originalPosition.top;
    const targetRotation = 0;
    const targetSpeed = 2; 
    
    const duration = 500; 
    const startTime = performance.now();
    
    function animate(currentTime) {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);

      const easeOut = 1 - Math.pow(1 - progress, 3);
      
      const currentLeft = startLeft + (targetLeft - startLeft) * easeOut;
      const currentTop = startTop + (targetTop - startTop) * easeOut;
      const currentRotation = startRotation + (targetRotation - startRotation) * easeOut;
      const currentSpeed = startSpeed + (targetSpeed - startSpeed) * easeOut;
      
      ghostElement.style.left = currentLeft + 'px';
      ghostElement.style.top = currentTop + 'px';
      ghostElement.style.transform = `rotate(${currentRotation}deg)`;
      state.pourSpeed = Math.round(currentSpeed);
      updateShakeIntensity();
      
      if (progress < 1) {
        returnAnimationId = requestAnimationFrame(animate);
      } else {
        
        removeGhostElement();
        returnAnimationId = null;
      }
    }
    
    returnAnimationId = requestAnimationFrame(animate);
  }

  item.addEventListener('mousedown', (e) => {
    e.preventDefault();
    e.stopPropagation();

    hasMoved = false;

    if (!originalPosition) {
      saveOriginalPosition();
    }

    const ghost = createGhostElement();
    if (!ghost) return;
    
    isMouseDown = true;
    item.classList.add('dragging');
    
    const rect = item.getBoundingClientRect();
    const imgRect = item.querySelector('img')?.getBoundingClientRect() || rect;

    currentX = e.clientX;
    currentY = e.clientY;
    startDragX = e.clientX;
    startDragY = e.clientY;
    lastMoveX = e.clientX;
    lastMoveY = e.clientY;
    
    ghost.style.left = (e.clientX - 40) + 'px';
    ghost.style.top = (e.clientY - 40) + 'px';
    
    const handleMouseMove = (e) => {
      if (!isMouseDown || !ghost) return;

      const dragDeltaX = Math.abs(e.clientX - startDragX);
      const dragDeltaY = Math.abs(e.clientY - startDragY);
      const dragDistance = Math.sqrt(dragDeltaX * dragDeltaX + dragDeltaY * dragDeltaY);
      
      if (dragDistance > 5) {
        hasMoved = true; 
      }
      
      currentX = e.clientX;
      currentY = e.clientY;

      ghost.style.left = (currentX - 40) + 'px';
      ghost.style.top = (currentY - 40) + 'px';

      const deltaX = currentX - startDragX;
      const deltaY = currentY - startDragY;
      const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);

      const moveDeltaX = currentX - lastMoveX;
      const moveDeltaY = currentY - lastMoveY;
      const moveDistance = Math.sqrt(moveDeltaX * moveDeltaX + moveDeltaY * moveDeltaY);
      
      let angle = 0;
      if (moveDistance > 0.5) {
        
        angle = Math.atan2(moveDeltaY, moveDeltaX) * (180 / Math.PI);
      } else {
        
        angle = Math.atan2(deltaY, deltaX) * (180 / Math.PI);
      }
      
      ghost.style.transform = `rotate(${angle}deg)`;

      const maxDistance = 300;
      const normalizedDistance = Math.min(distance / maxDistance, 1);
      state.pourSpeed = Math.max(1, Math.min(4, Math.round(1 + normalizedDistance * 3)));
      updateShakeIntensity();

      const shakerRect = shakerEl.getBoundingClientRect();
      if (currentX >= shakerRect.left && currentX <= shakerRect.right &&
          currentY >= shakerRect.top && currentY <= shakerRect.bottom) {
        shakerEl.classList.add('drag-over');
      } else {
        shakerEl.classList.remove('drag-over');
      }

      if (beerGlassEl) {
        const beerGlassRect = beerGlassEl.getBoundingClientRect();
        if (currentX >= beerGlassRect.left && currentX <= beerGlassRect.right &&
            currentY >= beerGlassRect.top && currentY <= beerGlassRect.bottom &&
            beerGlassEl.dataset.state === 'full') {
          beerGlassEl.style.filter = 'drop-shadow(0 0 12px rgba(241, 179, 63, 0.8))';
        } else {
          beerGlassEl.style.filter = '';
        }
      }
      
      lastMoveX = currentX;
      lastMoveY = currentY;
      e.preventDefault();
    };
    
    const handleMouseUp = (e) => {
      if (!isMouseDown) return;
      
      isMouseDown = false;
      item.classList.remove('dragging');
      
      const shakerRect = shakerEl.getBoundingClientRect();
      const beerGlassRect = beerGlassEl?.getBoundingClientRect();
      let handled = false;

      if (!hasMoved && item.dataset.id) {
        addIngredientToShaker(item.dataset.id);
        handled = true;
      } else {
        
        if (currentX >= shakerRect.left && currentX <= shakerRect.right &&
            currentY >= shakerRect.top && currentY <= shakerRect.bottom) {
          if (item.dataset.id) {
            addIngredientToShaker(item.dataset.id);
            handled = true;
          }
        }

        if (!handled && beerGlassRect && beerGlassEl && 
            currentX >= beerGlassRect.left && currentX <= beerGlassRect.right &&
            currentY >= beerGlassRect.top && currentY <= beerGlassRect.bottom) {
          if (item.dataset.id) {
            const ingredientId = item.dataset.id.toLowerCase();
            if (ingredientId === 'coke' || ingredientId === 'cola') {
              if (beerGlassEl.dataset.state === 'full') {
                beerGlassEl.src = './src/assets/icons/shandy.png';
                beerGlassEl.dataset.state = 'shandy';
                beerGlassEl.style.filter = '';
                hideTrayDrink();
                status('Shandy je pripravené: pivo a kola.', false);
                handled = true;
              } else {
                status('Najprv naplňte pohár pivom.', true);
              }
            } else {
              status('S pivom môžete zmiešať iba kolu.', true);
            }
          }
        }
      }
      
      shakerEl.classList.remove('drag-over');
      if (beerGlassEl) {
        beerGlassEl.style.filter = '';
      }

      if (!handled) {
        returnToOriginalPosition();
      } else {
        
        removeGhostElement();
        originalPosition = null; 
      }
      
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
    
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  });

  item.addEventListener('touchstart', (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    const touch = e.touches[0];

    hasMoved = false;

    if (!originalPosition) {
      saveOriginalPosition();
    }

    const ghost = createGhostElement();
    if (!ghost) return;
    
    isMouseDown = true;
    item.classList.add('dragging');
    
    currentX = touch.clientX;
    currentY = touch.clientY;
    startDragX = touch.clientX;
    startDragY = touch.clientY;
    lastMoveX = touch.clientX;
    lastMoveY = touch.clientY;
    
    ghost.style.left = (touch.clientX - 40) + 'px';
    ghost.style.top = (touch.clientY - 40) + 'px';
    
    const handleTouchMove = (ev) => {
      if (!isMouseDown || !ghost) return;
      const t = ev.touches[0];

      const dragDeltaX = Math.abs(t.clientX - startDragX);
      const dragDeltaY = Math.abs(t.clientY - startDragY);
      const dragDistance = Math.sqrt(dragDeltaX * dragDeltaX + dragDeltaY * dragDeltaY);
      
      if (dragDistance > 5) {
        hasMoved = true; 
      }
      
      currentX = t.clientX;
      currentY = t.clientY;

      ghost.style.left = (currentX - 40) + 'px';
      ghost.style.top = (currentY - 40) + 'px';

      const deltaX = currentX - startDragX;
      const deltaY = currentY - startDragY;
      const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);

      const moveDeltaX = currentX - lastMoveX;
      const moveDeltaY = currentY - lastMoveY;
      const moveDistance = Math.sqrt(moveDeltaX * moveDeltaX + moveDeltaY * moveDeltaY);
      
      let angle = 0;
      if (moveDistance > 0.5) {
        
        angle = Math.atan2(moveDeltaY, moveDeltaX) * (180 / Math.PI);
      } else {
        
        angle = Math.atan2(deltaY, deltaX) * (180 / Math.PI);
      }
      
      ghost.style.transform = `rotate(${angle}deg)`;

      const maxDistance = 300;
      const normalizedDistance = Math.min(distance / maxDistance, 1);
      state.pourSpeed = Math.max(1, Math.min(4, Math.round(1 + normalizedDistance * 3)));
      updateShakeIntensity();

      const shakerRect = shakerEl.getBoundingClientRect();
      if (currentX >= shakerRect.left && currentX <= shakerRect.right &&
          currentY >= shakerRect.top && currentY <= shakerRect.bottom) {
        shakerEl.classList.add('drag-over');
      } else {
        shakerEl.classList.remove('drag-over');
      }

      if (beerGlassEl) {
        const beerGlassRect = beerGlassEl.getBoundingClientRect();
        if (currentX >= beerGlassRect.left && currentX <= beerGlassRect.right &&
            currentY >= beerGlassRect.top && currentY <= beerGlassRect.bottom &&
            beerGlassEl.dataset.state === 'full') {
          beerGlassEl.style.filter = 'drop-shadow(0 0 12px rgba(241, 179, 63, 0.8))';
        } else {
          beerGlassEl.style.filter = '';
        }
      }
      
      lastMoveX = currentX;
      lastMoveY = currentY;
      ev.preventDefault();
    };
    
    const handleTouchEnd = (ev) => {
      if (!isMouseDown) return;
      
      isMouseDown = false;
      item.classList.remove('dragging');
      
      const touchEnd = ev.changedTouches[0];
      const shakerRect = shakerEl.getBoundingClientRect();
      const beerGlassRect = beerGlassEl?.getBoundingClientRect();
      let handled = false;

      if (!hasMoved && item.dataset.id) {
        addIngredientToShaker(item.dataset.id);
        handled = true;
      } else {
        
        if (touchEnd.clientX >= shakerRect.left && touchEnd.clientX <= shakerRect.right &&
            touchEnd.clientY >= shakerRect.top && touchEnd.clientY <= shakerRect.bottom) {
          if (item.dataset.id) {
            addIngredientToShaker(item.dataset.id);
            handled = true;
          }
        }

        if (!handled && beerGlassRect && beerGlassEl && 
            touchEnd.clientX >= beerGlassRect.left && touchEnd.clientX <= beerGlassRect.right &&
            touchEnd.clientY >= beerGlassRect.top && touchEnd.clientY <= beerGlassRect.bottom) {
          if (item.dataset.id) {
            const ingredientId = item.dataset.id.toLowerCase();
            if (ingredientId === 'coke' || ingredientId === 'cola') {
              if (beerGlassEl.dataset.state === 'full') {
                beerGlassEl.src = './src/assets/icons/shandy.png';
                beerGlassEl.dataset.state = 'shandy';
                beerGlassEl.style.filter = '';
                hideTrayDrink();
                status('Shandy je pripravené: pivo a kola.', false);
                handled = true;
              } else {
                status('Najprv naplňte pohár pivom.', true);
              }
            } else {
              status('S pivom môžete zmiešať iba kolu.', true);
            }
          }
        }
      }
      
      shakerEl.classList.remove('drag-over');
      if (beerGlassEl) {
        beerGlassEl.style.filter = '';
      }

      if (!handled) {
        returnToOriginalPosition();
      } else {
        
        removeGhostElement();
        originalPosition = null; 
      }
      
      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('touchend', handleTouchEnd);
    };
    
    document.addEventListener('touchmove', handleTouchMove, { passive: false });
    document.addEventListener('touchend', handleTouchEnd, { once: true });
  });
}

function addIngredientToShaker(ingredientId) {
  
  const forbiddenIds = ['beer-glass', 'fridge', 'tap', 'trash', 'shaker', 'tray', 'server'];
  if (forbiddenIds.includes(ingredientId)) {
    status('Tento predmet nemožno pridať do šejkra.', true);
    return;
  }
  
  let ingredient = null;
  
  if (gameData.levels) {
    for (const level of gameData.levels) {
      if (level.ingredients) {
        ingredient = level.ingredients.find(ing => ing.id === ingredientId);
        if (ingredient) break;
      }
    }
  }
  
  if (!ingredient) {
    status('Do šejkra môžete pridať iba ingrediencie.', true);
    return;
  }
  
  if (state.currentDrink.length === 0) {
    hideTrayDrink();
    state.isShaken = false; 
  }
  
  state.currentDrink.push({
    id: ingredientId,
    label: getIngredientLabel(ingredient),
    rotation: state.rotation,
  });
  
  renderShaker();
  status(`Pridané do šejkra: ${getIngredientLabel(ingredient)}`);
}

function handleRotate() {
  if (state.currentDrink.length === 0) {
    status('Najprv pridajte ingredienciu.', true);
    return;
  }
  
  state.rotation = (state.rotation + 90) % 360;
  if (state.currentDrink.length > 0) {
    state.currentDrink[state.currentDrink.length - 1].rotation = state.rotation;
  }
  renderShaker();
  status(`Otočené o ${state.rotation}°`);
}

function getPowerLabel(power) {
  const labels = {
    1: 'Jemne (1)',
    2: 'Stredne (2)',
    3: 'Silno (3)',
    4: 'Veľmi silno (4)'
  };
  return labels[power] || 'Stredne (2)';
}

function getPowerDescription(power) {
  const descriptions = {
    1: 'Jemné miešanie',
    2: 'Bežné miešanie',
    3: 'Silné miešanie',
    4: 'Maximálna sila'
  };
  return descriptions[power] || 'Bežné miešanie';
}

function updateShakeIntensity() {
  if (shakeIntensityEl) {
    shakeIntensityEl.textContent = `${state.pourSpeed} (${getPowerLabel(state.pourSpeed).split('(')[0].trim()})`;
  }
  if (powerHintEl) {
    powerHintEl.textContent = getPowerLabel(state.pourSpeed);
  }
}

function renderShaker() {
  shakerContentEl.innerHTML = '';
  
  if (state.currentDrink.length === 0) {
    const emptyMsg = document.createElement('div');
    emptyMsg.className = 'shaker-ingredients-panel__empty';
    emptyMsg.textContent = 'Pridajte ingrediencie';
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
    removeBtn.setAttribute('aria-label', `Odstrániť ${ing.label}`);
    removeBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      removeIngredientFromShaker(index);
    });
    
    item.appendChild(img);
    item.appendChild(label);
    item.appendChild(removeBtn);
    shakerContentEl.appendChild(item);
  });
  
  const shakeInfo = document.createElement('div');
  shakeInfo.className = 'shaker-ingredients-panel__shake-info';
  shakeInfo.textContent = `Sila miešania: ${state.pourSpeed} (${getPowerLabel(state.pourSpeed).split('(')[0].trim()})`;
  shakerContentEl.appendChild(shakeInfo);
}

function removeIngredientFromShaker(index) {
  if (index >= 0 && index < state.currentDrink.length) {
    const removed = state.currentDrink[index];
    state.currentDrink.splice(index, 1);
    renderShaker();
    status(`Odstránené zo šejkra: ${removed.label}`);
  }
}

function clearShaker() {
  state.currentDrink = [];
  state.rotation = 0;
  state.isShaking = false;
  state.shakeProgress = 0;
  state.isShaken = false; 
  state.isDraggingShaker = false;
  shakerContentEl.innerHTML = '';
  shakerEl?.classList.remove('shaking');
  shakerEl?.classList.remove('dragging');
  
  hideTrayDrink();
  
  if (shakeProgressBarEl) {
    shakeProgressBarEl.style.width = '0%';
  }
  if (shakeProgressLabelEl) {
    shakeProgressLabelEl.textContent = '0%';
    shakeProgressLabelEl.style.color = 'var(--text)';
  }
}

function showTrayDrink(order) {
  if (!trayDrinkEl || !order) return;
  
  const sprite = getTraySpriteForOrder(order);
  if (!sprite) return;
  
  trayContainerEl?.classList.remove('tray-container--trash');
  trayDrinkEl.src = `./src/assets/icons/${sprite}`;
  trayDrinkEl.alt = getDisplayName(order);
  trayDrinkEl.style.display = 'block';
}

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

  if (name.includes('dragon') && name.includes('breath')) {
    return 'dragonsbreath.png';
  }
  
  if (name.includes('lager') || name.includes('beer') || name.includes('pint')) {
    return 'FullPintOfBeer.png';
  }
  
  return null;
}

function handleBeerTap() {
  if (!beerGlassEl) return;
  
  if (!isGlassUnderTap()) {
    status('Najprv položte pohár pod výčap.', true);
    return;
  }
  
  const isFull = beerGlassEl.dataset.state === 'full';
  
  if (isFull) {
    beerGlassEl.src = './src/assets/icons/EmptyPintOfBeer.png';
    beerGlassEl.dataset.state = 'empty';
    status('Pohár je prázdny.', false);
  } else {
    beerGlassEl.src = './src/assets/icons/FullPintOfBeer.png';
    beerGlassEl.dataset.state = 'full';
    
    hideTrayDrink();
    status('Pivo je načapované.', false);
  }
}

function isGlassUnderTap() {

  if (!beerTapContainerEl || !beerGlassEl) return false;
  
  const tapRect = beerTapContainerEl.getBoundingClientRect();
  const glassRect = beerGlassEl.getBoundingClientRect();
  
  const glassCenterX = glassRect.left + glassRect.width / 2;
  const glassBottomY = glassRect.bottom;

  // The faucet is left of the tower column, so validate against its real spout.
  const spoutX = tapRect.left + tapRect.width * 0.28;
  const withinX = Math.abs(glassCenterX - spoutX) <= 60;
  const withinY =
    glassBottomY >= tapRect.bottom - 35 &&
    glassBottomY <= tapRect.bottom + 45;
  
  return withinX && withinY;
}

function setupBeerGlassDragging() {
  if (!beerGlassEl) return;
  
  let isMouseDown = false;
  let currentX = 0;
  let currentY = 0;
  let lastMoveX = 0;
  let lastMoveY = 0;
  let startDragX = 0;
  let startDragY = 0;
  let originalPosition = null;
  let originalParent = null;
  let originalNextSibling = null;
  let returnAnimationId = null;

  function saveOriginalPosition() {
    const rect = beerGlassEl.getBoundingClientRect();
    originalPosition = {
      left: rect.left,
      top: rect.top,
      width: rect.width,
      height: rect.height
    };
    originalParent = beerGlassEl.parentElement;
    originalNextSibling = beerGlassEl.nextSibling;
  }

  function returnToOriginalPosition() {
    if (!originalPosition || !beerGlassEl || !originalParent) return;

    if (returnAnimationId) {
      cancelAnimationFrame(returnAnimationId);
    }
    
    const startLeft = parseFloat(beerGlassEl.style.left) || originalPosition.left;
    const startTop = parseFloat(beerGlassEl.style.top) || originalPosition.top;

    const currentTransform = beerGlassEl.style.transform || '';
    let startRotation = 0;
    const rotateMatch = currentTransform.match(/rotate\(([^)]+)\)/);
    if (rotateMatch) {
      startRotation = parseFloat(rotateMatch[1]) || 0;
    }
    
    const startSpeed = state.pourSpeed;
    
    const targetLeft = originalPosition.left;
    const targetTop = originalPosition.top;
    const targetRotation = 0;
    const targetSpeed = 2; 
    
    const duration = 500; 
    const startTime = performance.now();
    
    function animate(currentTime) {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);

      const easeOut = 1 - Math.pow(1 - progress, 3);
      
      const currentLeft = startLeft + (targetLeft - startLeft) * easeOut;
      const currentTop = startTop + (targetTop - startTop) * easeOut;
      const currentRotation = startRotation + (targetRotation - startRotation) * easeOut;
      const currentSpeed = startSpeed + (targetSpeed - startSpeed) * easeOut;
      
      beerGlassEl.style.left = currentLeft + 'px';
      beerGlassEl.style.top = currentTop + 'px';
      beerGlassEl.style.transform = `rotate(${currentRotation}deg)`;
      state.pourSpeed = Math.round(currentSpeed);
      updateShakeIntensity();
      
      if (progress < 1) {
        returnAnimationId = requestAnimationFrame(animate);
      } else {
        
        beerGlassEl.style.position = '';
        beerGlassEl.style.left = '';
        beerGlassEl.style.top = '';
        beerGlassEl.style.transform = '';

        if (originalNextSibling) {
          originalParent.insertBefore(beerGlassEl, originalNextSibling);
        } else {
          originalParent.appendChild(beerGlassEl);
        }
        
        returnAnimationId = null;
      }
    }
    
    returnAnimationId = requestAnimationFrame(animate);
  }

  beerGlassEl.addEventListener('mousedown', (e) => {
  e.preventDefault();
    e.stopPropagation();

    if (!originalPosition) {
      saveOriginalPosition();
    }
    
    isMouseDown = true;
    beerGlassEl.classList.add('dragging');
    
    const rect = beerGlassEl.getBoundingClientRect();
    startDragX = e.clientX;
    startDragY = e.clientY;
    currentX = e.clientX;
    currentY = e.clientY;
    lastMoveX = e.clientX;
    lastMoveY = e.clientY;

    document.body.appendChild(beerGlassEl);

    beerGlassEl.style.position = 'fixed';
    beerGlassEl.style.left = rect.left + 'px';
    beerGlassEl.style.top = rect.top + 'px';
    beerGlassEl.style.zIndex = '1000';
    
    const handleMouseMove = (e) => {
      if (!isMouseDown) return;
      
      currentX = e.clientX;
      currentY = e.clientY;

      const rect = beerGlassEl.getBoundingClientRect();
      const newLeft = currentX - rect.width / 2;
      const newTop = currentY - rect.height / 2;
      
      beerGlassEl.style.left = newLeft + 'px';
      beerGlassEl.style.top = newTop + 'px';

      const deltaX = currentX - startDragX;
      const deltaY = currentY - startDragY;
      const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);

      const moveDeltaX = currentX - lastMoveX;
      const moveDeltaY = currentY - lastMoveY;
      const moveDistance = Math.sqrt(moveDeltaX * moveDeltaX + moveDeltaY * moveDeltaY);
      
      let angle = 0;
      if (moveDistance > 0.5) {
        angle = Math.atan2(moveDeltaY, moveDeltaX) * (180 / Math.PI);
      } else {
        angle = Math.atan2(deltaY, deltaX) * (180 / Math.PI);
      }
      
      beerGlassEl.style.transform = `rotate(${angle}deg)`;

      const maxDistance = 300;
      const normalizedDistance = Math.min(distance / maxDistance, 1);
      state.pourSpeed = Math.max(1, Math.min(4, Math.round(1 + normalizedDistance * 3)));
      updateShakeIntensity();

      const tapRect = beerTapContainerEl?.getBoundingClientRect();
      const trayRect = trayContainerEl?.getBoundingClientRect();
      
      if (tapRect && currentX >= tapRect.left && currentX <= tapRect.right &&
          currentY >= tapRect.top && currentY <= tapRect.bottom) {
        beerTapContainerEl.style.filter = 'drop-shadow(0 0 12px rgba(241, 179, 63, 0.8))';
      } else {
        beerTapContainerEl.style.filter = '';
      }
      
      if (trayRect && currentX >= trayRect.left && currentX <= trayRect.right &&
          currentY >= trayRect.top && currentY <= trayRect.bottom) {
        trayContainerEl.style.filter = 'drop-shadow(0 0 12px rgba(241, 179, 63, 0.8))';
      } else {
        trayContainerEl.style.filter = '';
      }
      
      lastMoveX = currentX;
      lastMoveY = currentY;
      e.preventDefault();
    };
    
    const handleMouseUp = (e) => {
      if (!isMouseDown) return;
      
      isMouseDown = false;
      beerGlassEl.classList.remove('dragging');
      
      const tapRect = beerTapContainerEl?.getBoundingClientRect();
      const trayRect = trayContainerEl?.getBoundingClientRect();
      let dropped = false;

      if (tapRect && currentX >= tapRect.left && currentX <= tapRect.right &&
          currentY >= tapRect.top && currentY <= tapRect.bottom) {
    
    beerTapContainerEl.appendChild(beerGlassEl);
        
    beerGlassEl.style.position = '';
        beerGlassEl.style.left = '';
        beerGlassEl.style.top = '';
        beerGlassEl.style.transform = '';
        beerGlassEl.style.zIndex = '';
    status('Pohár je pod výčapom.', false);
        dropped = true;
        originalPosition = null; 
      } else if (trayRect && currentX >= trayRect.left && currentX <= trayRect.right &&
                 currentY >= trayRect.top && currentY <= trayRect.bottom) {
    
    trayContainerEl.appendChild(beerGlassEl);
        
    beerGlassEl.style.position = '';
        beerGlassEl.style.left = '';
        beerGlassEl.style.top = '';
        beerGlassEl.style.transform = '';
        beerGlassEl.style.zIndex = '';
    status('Pohár je na podnose.', false);
        dropped = true;
        originalPosition = null; 
      }
      
      beerTapContainerEl.style.filter = '';
      trayContainerEl.style.filter = '';

      if (!dropped) {
        returnToOriginalPosition();
      }
      
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
    
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  });

  beerGlassEl.addEventListener('touchstart', (e) => {
    e.preventDefault();
    e.stopPropagation();
  
  const touch = e.touches[0];

    if (!originalPosition) {
      saveOriginalPosition();
    }
    
    isMouseDown = true;
    beerGlassEl.classList.add('dragging');
    
    const rect = beerGlassEl.getBoundingClientRect();
    startDragX = touch.clientX;
    startDragY = touch.clientY;
    currentX = touch.clientX;
    currentY = touch.clientY;
    lastMoveX = touch.clientX;
    lastMoveY = touch.clientY;

    document.body.appendChild(beerGlassEl);

    beerGlassEl.style.position = 'fixed';
    beerGlassEl.style.left = rect.left + 'px';
    beerGlassEl.style.top = rect.top + 'px';
    beerGlassEl.style.zIndex = '1000';
  
  const handleTouchMove = (ev) => {
      if (!isMouseDown) return;
      const t = ev.touches[0];
      
      currentX = t.clientX;
      currentY = t.clientY;

      const rect = beerGlassEl.getBoundingClientRect();
      const newLeft = currentX - rect.width / 2;
      const newTop = currentY - rect.height / 2;
      
      beerGlassEl.style.left = newLeft + 'px';
      beerGlassEl.style.top = newTop + 'px';

      const deltaX = currentX - startDragX;
      const deltaY = currentY - startDragY;
      const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);

      const moveDeltaX = currentX - lastMoveX;
      const moveDeltaY = currentY - lastMoveY;
      const moveDistance = Math.sqrt(moveDeltaX * moveDeltaX + moveDeltaY * moveDeltaY);
      
      let angle = 0;
      if (moveDistance > 0.5) {
        angle = Math.atan2(moveDeltaY, moveDeltaX) * (180 / Math.PI);
      } else {
        angle = Math.atan2(deltaY, deltaX) * (180 / Math.PI);
      }
      
      beerGlassEl.style.transform = `rotate(${angle}deg)`;

      const maxDistance = 300;
      const normalizedDistance = Math.min(distance / maxDistance, 1);
      state.pourSpeed = Math.max(1, Math.min(4, Math.round(1 + normalizedDistance * 3)));
      updateShakeIntensity();

      const tapRect = beerTapContainerEl?.getBoundingClientRect();
      const trayRect = trayContainerEl?.getBoundingClientRect();
      
      if (tapRect && currentX >= tapRect.left && currentX <= tapRect.right &&
          currentY >= tapRect.top && currentY <= tapRect.bottom) {
        beerTapContainerEl.style.filter = 'drop-shadow(0 0 12px rgba(241, 179, 63, 0.8))';
      } else {
        beerTapContainerEl.style.filter = '';
      }
      
      if (trayRect && currentX >= trayRect.left && currentX <= trayRect.right &&
          currentY >= trayRect.top && currentY <= trayRect.bottom) {
        trayContainerEl.style.filter = 'drop-shadow(0 0 12px rgba(241, 179, 63, 0.8))';
      } else {
        trayContainerEl.style.filter = '';
      }
      
      lastMoveX = currentX;
      lastMoveY = currentY;
      ev.preventDefault();
  };
  
  const handleTouchEnd = (ev) => {
      if (!isMouseDown) return;
    
      isMouseDown = false;
      beerGlassEl.classList.remove('dragging');
      
      const touchEnd = ev.changedTouches[0];
    const tapRect = beerTapContainerEl?.getBoundingClientRect();
    const trayRect = trayContainerEl?.getBoundingClientRect();
      let dropped = false;
    
    if (tapRect && touchEnd.clientX >= tapRect.left && touchEnd.clientX <= tapRect.right &&
        touchEnd.clientY >= tapRect.top && touchEnd.clientY <= tapRect.bottom) {
      
        beerTapContainerEl.appendChild(beerGlassEl);
        
        beerGlassEl.style.position = '';
        beerGlassEl.style.left = '';
        beerGlassEl.style.top = '';
        beerGlassEl.style.transform = '';
        beerGlassEl.style.zIndex = '';
      status('Pohár je pod výčapom.', false);
      dropped = true;
        originalPosition = null; 
    } else if (trayRect && touchEnd.clientX >= trayRect.left && touchEnd.clientX <= trayRect.right &&
               touchEnd.clientY >= trayRect.top && touchEnd.clientY <= trayRect.bottom) {
      
        trayContainerEl.appendChild(beerGlassEl);
        
        beerGlassEl.style.position = '';
        beerGlassEl.style.left = '';
        beerGlassEl.style.top = '';
        beerGlassEl.style.transform = '';
        beerGlassEl.style.zIndex = '';
      status('Pohár je na podnose.', false);
      dropped = true;
        originalPosition = null; 
      }
      
    beerTapContainerEl.style.filter = '';
    trayContainerEl.style.filter = '';

      if (!dropped) {
        returnToOriginalPosition();
      }
    
    document.removeEventListener('touchmove', handleTouchMove);
    document.removeEventListener('touchend', handleTouchEnd);
  };
  
  document.addEventListener('touchmove', handleTouchMove, { passive: false });
  document.addEventListener('touchend', handleTouchEnd, { once: true });
  });

  window.addEventListener('resize', () => {
    originalPosition = null;
  });
}

function handleIngredientOnBeerGlass(e) {
  e.preventDefault();
  e.stopPropagation();
  
  if (!beerGlassEl) return;
  
  if (beerGlassEl.dataset.state !== 'full') {
    status('Najprv naplňte pohár pivom.', true);
    beerGlassEl.style.filter = '';
    return;
  }
  
  const ingredientId = e.dataTransfer.getData('text/plain');
  if (!ingredientId) return;
  
  const ingredientIdLower = ingredientId.toLowerCase();
  if (ingredientIdLower !== 'coke' && ingredientIdLower !== 'cola') {
    status('S pivom môžete zmiešať iba kolu.', true);
    beerGlassEl.style.filter = '';
    return;
  }
  
  beerGlassEl.src = './src/assets/icons/shandy.png';
  beerGlassEl.dataset.state = 'shandy';
  beerGlassEl.style.filter = '';
  
  hideTrayDrink();
  status('Shandy je pripravené: pivo a kola.', false);
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
  
  const isOnTray = trayContainerEl && trayContainerEl.contains(beerGlassEl);
  
  const isFull = beerGlassEl.dataset.state === 'full';
  return isOnTray && isFull;
}

function isShandyOnTray() {
  if (!beerGlassEl) return false;
  
  const isOnTray = trayContainerEl && trayContainerEl.contains(beerGlassEl);
  
  const isShandy = beerGlassEl.dataset.state === 'shandy';
  return isOnTray && isShandy;
}

function handleServe() {
  if (!state.activeOrder) {
    status('Nie je aktívna žiadna objednávka.', true);
    return;
  }
  
  const isBeer = isBeerOrder(state.activeOrder);
  const isShandy = isShandyOrder(state.activeOrder);
  
  if (isBeer || isShandy) {
    
    if (isShandy) {
      
      if (!isShandyOnTray()) {
        status('Najprv položte Shandy na podnos.', true);
        return;
      }
    } else {
      
      if (!isFullBeerGlassOnTray()) {
        status('Najprv položte plný pivný pohár na podnos.', true);
        return;
      }
    }
    
    state.served += 1;
    ordersEl.textContent = `${state.served}/${state.currentLevel.target}`;
    progressEl.style.width = Math.min(100, (state.served / state.currentLevel.target) * 100) + '%';
    
    clearVisitorTimer(state.activeVisitor);
    state.activeVisitor.bubble.classList.remove('active');
    state.activeVisitor.bubble.classList.add('served');
    
    status(`✓ ${getDisplayName(state.activeOrder)} je obslúžené.`, false);
    
    if (beerGlassEl) {
      beerGlassEl.src = './src/assets/icons/EmptyPintOfBeer.png';
      beerGlassEl.dataset.state = 'empty';
      
      const beerGlassStartEl = document.querySelector('.beer-glass-start');
      if (beerGlassStartEl) {
        beerGlassStartEl.appendChild(beerGlassEl);
        beerGlassEl.style.position = '';
      }
    }
    
    if (isShandy && trayDrinkEl) {
      trayDrinkEl.style.display = 'none';
    }
    
    if (state.served >= state.currentLevel.target) {
      const elapsed = state.currentLevel.timeLimit - state.timer;
      state.servedSet.add(state.currentLevel.id);
      updateBest(elapsed);

      if (state.servedSet.size >= 3) {
        status('Úroveň je dokončená.', false);
        setTimeout(() => showWinMessage(), 1500);
      } else {
        status('Úroveň je dokončená. Spúšťa sa ďalšia...', false);
      setTimeout(() => startLevel(), 1500);
      }
    } else {
      setTimeout(() => {
        
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
    
    if (state.currentDrink.length === 0) {
      status('Najprv pripravte nápoj.', true);
      return;
    }
    
    if (state.shakeProgress < 100 && !state.isShaken) {
      status(`Miešajte ešte chvíľu. (${Math.floor(state.shakeProgress)} %)`, true);
      return;
    }
    
    const isValid = validateRecipe(state.currentDrink, state.activeOrder);
    
    if (isValid) {

      hideTrayDrink();
      state.served += 1;
      ordersEl.textContent = `${state.served}/${state.currentLevel.target}`;
      progressEl.style.width = Math.min(100, (state.served / state.currentLevel.target) * 100) + '%';
      
      clearVisitorTimer(state.activeVisitor);
      state.activeVisitor.bubble.classList.remove('active');
      state.activeVisitor.bubble.classList.add('served');
      
      status(`✓ ${getDisplayName(state.activeOrder)} je obslúžené.`, false);
      clearShaker();
      
      if (state.served >= state.currentLevel.target) {
        const elapsed = state.currentLevel.timeLimit - state.timer;
        state.servedSet.add(state.currentLevel.id);
        updateBest(elapsed);

        if (state.servedSet.size >= 3) {
          status('Úroveň je dokončená.', false);
          setTimeout(() => showWinMessage(), 1500);
        } else {
          status('Úroveň je dokončená. Spúšťa sa ďalšia...', false);
        setTimeout(() => startLevel(), 1500);
        }
      } else {
        setTimeout(() => {
          
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
      
      const matchedOrder = findMatchingRecipe(state.currentDrink);
      
      hideTrayDrink();
      
      if (matchedOrder) {
        
        status(`Nesprávna objednávka. Pripravili ste ${getDisplayName(matchedOrder)}, hosť chce ${getDisplayName(state.activeOrder)}.`, true);
        clearShaker();
      } else {
        
        status('Táto kombinácia nezodpovedá žiadnemu receptu.', true);
        clearShaker();
      }
    }
  }
}

function findMatchingRecipe(drink) {
  if (!drink || drink.length === 0) return null;
  if (!gameData.levels) return null;
  
  for (const level of gameData.levels) {
    if (!level.orders) continue;
    
    for (const order of level.orders) {
      
      if (validateRecipe(drink, order)) {
        return order; 
      }
    }
  }
  
  return null; 
}

function showTrayTrash() {
  if (!trayDrinkEl) return;
  trayContainerEl?.classList.remove('tray-container--trash');
  trayDrinkEl.src = './src/assets/icons/trash.png';
  trayDrinkEl.alt = 'Pokazený koktail';
  trayDrinkEl.style.display = 'block';
}

function showDrinkOnTray() {
  if (!trayDrinkEl || !state.currentDrink || state.currentDrink.length === 0) return;
  
  hideTrayDrink();
  
  const matchedOrder = findMatchingRecipe(state.currentDrink);
  
  if (matchedOrder) {
    
    showTrayDrink(matchedOrder);
    
    status(`Koktail je pripravený: ${getDisplayName(matchedOrder)}`, false);
  } else {
    
    showTrayTrash();
    
    status('Táto kombinácia nezodpovedá žiadnemu receptu.', true);
  }
}

function hideTrayDrink() {
  if (!trayDrinkEl) return;
  trayContainerEl?.classList.remove('tray-container--trash');
  trayDrinkEl.style.display = 'none';
}

function validateRecipe(drink, order) {
  
  const requiredIngredients = order.ingredients || [];
  
  if (requiredIngredients.length === 0) {
    console.warn(`Recipe "${order.name}" has no ingredients specified!`);
    return false;
  }
  
  const drinkIds = drink.map(ing => ing.id.toLowerCase()).sort();
  const requiredIds = requiredIngredients.map(ing => ing.toLowerCase()).sort();
  
  console.log('=== Recipe Validation ===');
  console.log('Order:', order.name);
  console.log('Required ingredients:', requiredIds);
  console.log('Drink ingredients:', drinkIds);
  
  for (const required of requiredIds) {
    if (!drinkIds.includes(required)) {
      console.log(`Missing ingredient: ${required}`);
      return false;
    }
  }
  
  const extraIngredients = drinkIds.filter(id => !requiredIds.includes(id));
  if (extraIngredients.length > 0) {
    console.log(`Extra ingredients not allowed: ${extraIngredients.join(', ')}`);
    console.log(`Expected: ${requiredIds.join(', ')}, but got: ${drinkIds.join(', ')}`);
    return false;
  }
  
  if (drinkIds.length !== requiredIds.length) {
    console.log(`Ingredient count mismatch: got ${drinkIds.length}, required ${requiredIds.length}`);
    return false;
  }
  
  return true;
}

let lastHintClick = 0;
let showingSolution = false;

function showCurrentHint() {
  if (!state.activeOrder) {
    status('Nie je aktívna žiadna objednávka.', true);
    return;
  }
  
  const now = Date.now();
  
  if (now - lastHintClick < 2000 && !showingSolution) {
    showingSolution = true;
    showSolution();
    lastHintClick = 0; 
    return;
  }
  
  showingSolution = false;
  lastHintClick = now;
  const hint = state.activeOrder.hint || state.activeOrder.shortHint;
  status(`Pomoc: ${hint} (kliknite znova pre riešenie)`, false);
}

function showSolution() {
  if (!state.activeOrder) {
    status('Nie je aktívna žiadna objednávka.', true);
    return;
  }
  
  if (state.activeOrder.ingredients && state.activeOrder.ingredients.length > 0) {
    const ingredients = state.activeOrder.ingredients.map(ing => {
      
      let label = ing;
      if (gameData.levels) {
        for (const level of gameData.levels) {
          if (level.ingredients) {
            const ingredient = level.ingredients.find(i => i.id === ing);
            if (ingredient) {
              label = getIngredientLabel(ingredient);
              break;
            }
          }
        }
      }
      return label;
    }).join(', ');
    status(`Riešenie: ${ingredients}`, false);
  } else if (state.activeOrder.steps && state.activeOrder.steps.length > 0) {
    
    const steps = state.activeOrder.steps.join(' → ');
    status(`Riešenie: ${steps}`, false);
  } else {
    status('Pre túto objednávku nie je dostupné riešenie.', true);
  }
}

function togglePause() {
  if (!state.timerId) {
    
    closePauseMenu();
  } else {
    
    clearTimer();
    state.visitors.forEach(v => clearVisitorTimer(v));
    openPauseMenu();
    status('Hra je pozastavená.');
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
  
  if (!state.timerId) {
    tick();
    state.visitors.forEach(v => startVisitorTimer(v));
    status('Pokračujete v hre.');
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
    
    const difficulty = level.difficulty || 1;
    btn.textContent = `Nár. ${difficulty} Úr.${level.id}: ${getDisplayName(level)}`;
    btn.addEventListener('click', () => {
      
      state.currentLevel = level;
      state.timer = level.timeLimit;
      state.served = 0;
      state.currentDrink = [];
      state.shakeProgress = 0;
      
      ordersEl.textContent = `0/${level.target}`;
      levelEl.textContent = `Nár. ${difficulty} Úr.${level.id}`;
      
      renderVisitors();
      clearShaker();
      tick();
      closePauseMenu();
      status(`Zvolená úroveň ${level.id}: ${getDisplayName(level)}`);
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
      showLoseMenu();
    }
  }, 1000);
}

function clearTimer() {
  if (state.timerId) clearInterval(state.timerId);
  state.timerId = null;
}

function updateBest(elapsed) {
  if (!state.currentLevel) return;
  
  const levelId = state.currentLevel.id;

  if (!state.levelStats[levelId]) {
    state.levelStats[levelId] = {
      plays: 0,
      bestTime: null
    };
  }

  state.levelStats[levelId].plays += 1;

  if (state.levelStats[levelId].bestTime === null || elapsed < state.levelStats[levelId].bestTime) {
    state.levelStats[levelId].bestTime = elapsed;
    renderBestTime();
  }

  persistProgress();
}

function renderBestTime() {
  if (!bestEl) return;
  
  if (state.currentLevel) {
    const levelStats = state.levelStats[state.currentLevel.id] || { plays: 0, bestTime: null };
    if (levelStats.bestTime !== null) {
      bestEl.textContent = formatTime(levelStats.bestTime);
      return;
    }
  }
  
  bestEl.textContent = '—';
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

function showWinMessage() {
  if (!winMenuEl) return;

  let totalTime = 0;
  if (state.runStartTime) {
    totalTime = Math.floor((Date.now() - state.runStartTime) / 1000);
  } else {
    
    let estimatedTime = 0;
    state.servedSet.forEach(levelId => {
      const level = gameData.levels.find(l => l.id === levelId);
      if (level) {
        estimatedTime += level.timeLimit;
      }
    });
    totalTime = estimatedTime;
  }
  
  const formattedTime = formatTime(totalTime);

  if (winMenuTimeEl) {
    winMenuTimeEl.textContent = formattedTime;
  }

  if (state.bestTime === null || totalTime < state.bestTime) {
    state.bestTime = totalTime;
    renderBestTime();
  }

  clearTimer();
  state.visitors.forEach(v => clearVisitorTimer(v));

  winMenuEl.style.display = 'block';

  persistProgress();
}

function closeWinMenu() {
  if (!winMenuEl) return;
  winMenuEl.style.display = 'none';
}

function showLoseMenu() {
  if (!loseMenuEl) return;

  clearTimer();
  state.visitors.forEach(v => clearVisitorTimer(v));

  loseMenuEl.style.display = 'block';
}

function closeLoseMenu() {
  if (!loseMenuEl) return;
  loseMenuEl.style.display = 'none';
}

function openRecipesMenu() {
  if (!recipesMenuEl) return;
  recipesMenuEl.style.display = 'block';
  renderRecipes();
}

function closeRecipesMenu() {
  if (!recipesMenuEl) return;
  recipesMenuEl.style.display = 'none';
}

function openInstructionsMenu() {
  if (!instructionsMenuEl) return;
  instructionsMenuEl.style.display = 'block';
}

function closeInstructionsMenu() {
  if (!instructionsMenuEl) return;
  instructionsMenuEl.style.display = 'none';
}

function showStartMenu() {
  if (!startMenuEl) return;
  
  const hasProgress = (state.servedSet && state.servedSet.size > 0) || (state.runs && state.runs > 0);
  
  if (hasProgress) {
    if (startMenuTitleEl) startMenuTitleEl.textContent = 'TATRA BANKA TAVERN';
    if (startMenuMessageEl) {
      const completedLevels = state.servedSet ? state.servedSet.size : 0;
      startMenuMessageEl.textContent = `Chcete pokračovať?\nDokončené úrovne: ${completedLevels}.`;
    }
    
    if (startMenuActionsEl) {
      startMenuActionsEl.innerHTML = '';
      const continueBtn = document.createElement('button');
      continueBtn.className = 'btn btn--primary';
      continueBtn.textContent = 'POKRAČOVAŤ';
      continueBtn.addEventListener('click', handleContinueGame);
      const newGameBtn = document.createElement('button');
      newGameBtn.className = 'btn btn--ghost';
      newGameBtn.textContent = 'NOVÁ HRA';
      newGameBtn.addEventListener('click', handleStartNewGame);
      startMenuActionsEl.appendChild(continueBtn);
      startMenuActionsEl.appendChild(newGameBtn);
    }
  } else {
    if (startMenuTitleEl) startMenuTitleEl.textContent = 'TATRA BANKA TAVERN';
    if (startMenuMessageEl) {
      startMenuMessageEl.innerHTML = 'Vitajte v Tatra banka Tavern.<br>Ste pripravení obslúžiť hostí?';
    }
    
    if (startMenuActionsEl) {
      startMenuActionsEl.innerHTML = '';
      const startBtn = document.createElement('button');
      startBtn.className = 'btn btn--primary';
      startBtn.id = 'start-menu-start';
      startBtn.textContent = 'SPUSTIŤ HRU';
      startBtn.addEventListener('click', handleStartGame);
      startMenuActionsEl.appendChild(startBtn);
    }
  }
  
  startMenuEl.style.display = 'block';
}

function closeStartMenu() {
  if (!startMenuEl) return;
  startMenuEl.style.display = 'none';
}

function handleStartGame() {
  closeStartMenu();
  
  if (state.servedSet.size === 0 && state.runs === 0) {
    startNewRun();
  } else {
    const completedLevels = state.servedSet.size;
    if (completedLevels === 0) {
      state.currentDifficulty = 1;
    } else if (completedLevels === 1) {
      state.currentDifficulty = 2;
    } else if (completedLevels === 2) {
      state.currentDifficulty = 3;
    } else {
      showWinMessage();
      return;
    }
    startLevel();
  }
}

function handleContinueGame() {
  closeStartMenu();
  
  const completedLevels = state.servedSet ? state.servedSet.size : 0;
  
  if (completedLevels === 0) {
    state.currentDifficulty = 1;
    startNewRun();
  } else if (completedLevels === 1) {
    state.currentDifficulty = 2;
    startLevel();
  } else if (completedLevels === 2) {
    state.currentDifficulty = 3;
    startLevel();
  } else {
    showWinMessage();
  }
}

function handleStartNewGame() {
  closeStartMenu();
  
  state.servedSet.clear();
  state.usedOrdersInLevel.clear();
  state.currentDifficulty = 1;
  state.currentLevelId = null;
  state.runStartTime = null;
  
  startNewRun();
}

function renderRecipes() {
  if (!recipesMenuListEl || !gameData.levels) return;
  
  recipesMenuListEl.innerHTML = '';
  
  const allRecipes = new Map();
  
  gameData.levels.forEach(level => {
    if (!level.orders) return;
    
    level.orders.forEach(order => {
      
      const key = order.name.toLowerCase();
      if (!allRecipes.has(key)) {
        allRecipes.set(key, {
          name: order.name,
          displayName: getDisplayName(order),
          hint: order.hint || order.shortHint || '',
          steps: order.steps || [],
          ingredients: order.ingredients || [],
          level: getDisplayName(level)
        });
      }
    });
  });
  
  const sortedRecipes = Array.from(allRecipes.values()).sort((a, b) => 
    a.displayName.localeCompare(b.displayName, 'sk')
  );
  
  sortedRecipes.forEach(recipe => {
    const recipeEl = document.createElement('div');
    recipeEl.className = 'recipes-menu__item';
    
    const ingredients = extractIngredientsFromSteps(recipe.steps, recipe.ingredients);
    
    const cocktailImage = getTraySpriteForOrder({ name: recipe.name });
    const cocktailImagePath = cocktailImage 
      ? `./src/assets/icons/${cocktailImage}` 
      : './src/assets/icons/FullPintOfBeer.png'; 
    
    const headerEl = document.createElement('div');
    headerEl.className = 'recipes-menu__item-header';
    
    const imageEl = document.createElement('img');
    imageEl.className = 'recipes-menu__item-image';
    imageEl.src = cocktailImagePath;
    imageEl.alt = recipe.displayName;
    
    const infoEl = document.createElement('div');
    infoEl.className = 'recipes-menu__item-info';
    
    const nameEl = document.createElement('h3');
    nameEl.className = 'recipes-menu__item-name';
    nameEl.textContent = recipe.displayName;
    
    const hintEl = document.createElement('p');
    hintEl.className = 'recipes-menu__item-hint';
    hintEl.textContent = recipe.hint;
    
    infoEl.appendChild(nameEl);
    infoEl.appendChild(hintEl);
    headerEl.appendChild(imageEl);
    headerEl.appendChild(infoEl);
    
    const ingredientsEl = document.createElement('div');
    ingredientsEl.className = 'recipes-menu__item-ingredients';
    
    if (ingredients.length > 0) {
      const ingredientsTitleEl = document.createElement('h4');
      ingredientsTitleEl.className = 'recipes-menu__item-ingredients-title';
      ingredientsTitleEl.textContent = 'Ingrediencie:';
      
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

function extractIngredientsFromSteps(steps, recipeIngredients) {
  
  if (recipeIngredients && recipeIngredients.length > 0) {
    const ingredients = [];
    recipeIngredients.forEach(ingId => {
      
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
        label: ingredientData ? getIngredientLabel(ingredientData) : ingId.charAt(0).toUpperCase() + ingId.slice(1)
      });
    });
    return ingredients;
  }
  
  if (!steps || steps.length === 0) return [];
  
  const ingredients = [];
  const glassware = ['stein', 'highball', 'rocks', 'coupe', 'shaker', 'mug', 'glass'];
  const actions = ['take', 'add', 'pour', 'top', 'stir', 'shake', 'muddle', 'strain', 'rim', 'fill'];
  
  steps.forEach(step => {
    const stepLower = step.toLowerCase();
    
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
          label: ingredientData ? getIngredientLabel(ingredientData) : 'Modrá mana esencia'
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
          label: ingredientData ? getIngredientLabel(ingredientData) : 'Dračí čili sirup'
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
          label: ingredientData ? getIngredientLabel(ingredientData) : 'Červený bitter'
        });
      }
    }
    
    const ingredientPatterns = [
      /\b(gin|rum|vodka|whiskey|tequila|mezcal|lager|vermouth|campari|liqueur|espresso|bitters)\b/,
      /\b(soda|syrup|mint|lime|orange|lemon|pineapple|foam|cubes|white|beans|cola|ice|tonic)\b/,
    ];
    
    ingredientPatterns.forEach(pattern => {
      const match = stepLower.match(pattern);
      if (match) {
        const ing = match[1];
        
        if (!actions.includes(ing) && !glassware.includes(ing)) {
          
          const normalizedIng = ing === 'cubes' ? 'ice' : ing;
          
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
              label: ingredientData ? getIngredientLabel(ingredientData) : normalizedIng.charAt(0).toUpperCase() + normalizedIng.slice(1)
            });
          }
        }
      }
    });
  });
  
  return ingredients;
}

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
  
  console.log('%cAll ingredients in the fridge:', 'font-size: 16px; font-weight: bold; color: #f1b33f;');
  console.log('================================');
  sorted.forEach((ing, i) => {
    console.log(`${(i+1).toString().padStart(2, '0')}. ${ing.id.padEnd(20)} - ${ing.label}`);
  });
  console.log('================================');
  console.log(`Total: ${allIngredients.size} unique ingredients`);
  
  return sorted;
};
