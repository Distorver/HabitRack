// Modal module - handles Add Habit modal

const Modal = (function() {
  const modal = document.getElementById('habitModal');
  const overlay = document.getElementById('modalOverlay');
  const openBtn = document.getElementById('btnAddHabit');
  const closeBtn = document.getElementById('btnCloseModal');
  const form = document.getElementById('habitForm');
  const goalInput = document.getElementById('habitGoal');
  const goalTypeContainer = document.getElementById('goalTypeContainer');
  const selectedIconInput = document.getElementById('selectedIcon');
  const selectedColorInput = document.getElementById('selectedColor');

  let selectedIcon = 'leaf';
  let selectedColor = '#f4b8c3';

  // Icon options
  const icons = [
    'leaf', 'water', 'moon', 'book', 'run', 'pill', 'heart', 'brain',
    'walk', 'bicycle', 'body', 'barbell', 'nutrition', 'sunny',
    'cafe', 'bed', 'school', 'code', 'musical-notes', 'cash'
  ];

  const colors = [
    '#f4b8c3',
    '#f7c8a4',
    '#f9e1a6',
    '#f4efc6',
    '#dfe8c6',
    '#bfe0cf',
    '#b6def0',
    '#c5d0ea',
    '#d6bee1'
  ];

  function init() {
    if (!modal) return;
    
    renderIconPicker();
    renderColorPicker();
    applySelectedColor();
    setupEventListeners();
  }

  function renderIconPicker() {
    const container = document.getElementById('iconPicker');
    if (!container) return;

    const iconMap = {
      leaf: 'leaf-outline',
      water: 'water-outline',
      moon: 'moon-outline',
      book: 'book-outline',
      run: 'fitness-outline',
      pill: 'medical-outline',
      heart: 'heart-outline',
      brain: 'hardware-chip-outline',
      walk: 'walk-outline',
      bicycle: 'bicycle-outline',
      body: 'body-outline',
      barbell: 'barbell-outline',
      nutrition: 'nutrition-outline',
      sunny: 'sunny-outline',
      cafe: 'cafe-outline',
      bed: 'bed-outline',
      school: 'school-outline',
      code: 'code-slash-outline',
      'musical-notes': 'musical-notes-outline',
      cash: 'cash-outline'
    };

    container.innerHTML = icons.map(icon => `
      <button type="button" 
              class="icon-option ${icon === selectedIcon ? 'selected' : ''}" 
              data-icon="${icon}">
        <ion-icon name="${iconMap[icon] || 'ellipse-outline'}"></ion-icon>
      </button>
    `).join('');

    // Re-initialize ionicons
    if (window.ionicons) {
      window.ionicons.create();
    }
  }

  function renderColorPicker() {
    const container = document.getElementById('colorPicker');
    if (!container) return;

    container.innerHTML = colors.map(color => `
      <button type="button"
              class="color-option ${color === selectedColor ? 'selected' : ''}"
              data-color="${color}"
              style="--option-color: ${color}"
              aria-label="Choose ${color}">
        <span></span>
      </button>
    `).join('');
  }

  function applySelectedColor() {
    if (modal) {
      modal.style.setProperty('--habit-modal-color', selectedColor);
    }
  }

  function setupEventListeners() {
    // Open modal
    if (openBtn) {
      openBtn.addEventListener('click', open);
    }

    // Close modal
    if (closeBtn) {
      closeBtn.addEventListener('click', close);
    }

    // Close on overlay click
    if (overlay) {
      overlay.addEventListener('click', (e) => {
        if (e.target === overlay) {
          close();
        }
      });
    }

    // Close on escape key
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && overlay && overlay.classList.contains('active')) {
        close();
      }
    });

    // Icon picker
    const container = document.getElementById('iconPicker');
    if (container) {
      container.addEventListener('click', (e) => {
        const option = e.target.closest('.icon-option');
        if (option) {
          selectedIcon = option.dataset.icon;
          renderIconPicker();
          if (selectedIconInput) {
            selectedIconInput.value = selectedIcon;
          }
        }
      });
    }

    const colorContainer = document.getElementById('colorPicker');
    if (colorContainer) {
      colorContainer.addEventListener('click', (e) => {
        const option = e.target.closest('.color-option');
        if (option) {
          selectedColor = option.dataset.color;
          renderColorPicker();
          if (selectedColorInput) {
            selectedColorInput.value = selectedColor;
          }
          applySelectedColor();
        }
      });
    }

    // Goal type toggle
    const goalTypeBtns = document.querySelectorAll('.goal-type-btn');
    goalTypeBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        goalTypeBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        
        const type = btn.dataset.goalType;
        if (goalInput) {
          if (type === 'boolean') {
            goalInput.value = 'Daily tracking';
            goalInput.disabled = true;
          } else {
            goalInput.value = '';
            goalInput.disabled = false;
            goalInput.placeholder = 'e.g., 2L, 30m, 8h';
          }
        }
      });
    });

    // Form submission
    if (form) {
      form.addEventListener('submit', handleSubmit);
    }
  }

  function open() {
    if (overlay) {
      overlay.classList.add('active');
      document.body.style.overflow = 'hidden';
    }
    // Reset form
    if (form) form.reset();
    selectedIcon = 'leaf';
    selectedColor = '#f4b8c3';
    renderIconPicker();
    renderColorPicker();
    if (selectedIconInput) selectedIconInput.value = selectedIcon;
    if (selectedColorInput) selectedColorInput.value = selectedColor;
    applySelectedColor();
    
    // Set default goal type
    const booleanBtn = document.querySelector('[data-goal-type="boolean"]');
    if (booleanBtn) {
      booleanBtn.click();
    }
  }

  function close() {
    if (overlay) {
      overlay.classList.remove('active');
      document.body.style.overflow = '';
    }
  }

  function handleSubmit(e) {
    e.preventDefault();
    
    const name = document.getElementById('habitName')?.value.trim();
    const icon = selectedIcon;
    const activeBtn = document.querySelector('.goal-type-btn.active');
    const goalType = activeBtn?.dataset.goalType || 'boolean';
    const goal = goalType === 'boolean' ? 'Daily tracking' : goalInput?.value.trim();
    const description = document.getElementById('habitDescription')?.value.trim();

    if (!name) {
      alert('Please enter a habit name');
      return;
    }

    if (goalType !== 'boolean' && !goal) {
      alert('Please enter a goal');
      return;
    }

    // Add habit via Data module
    if (typeof Data !== 'undefined') {
      Data.addHabit({ name, icon, goal, goalType, color: selectedColor, description });
      
      // Refresh the habits display
      if (typeof Habits !== 'undefined') {
        Habits.render();
      }
    }

    close();
  }

  return {
    init,
    open,
    close
  };
})();