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

  let selectedIcon = 'leaf';

  // Icon options
  const icons = ['leaf', 'water', 'moon', 'book', 'run', 'pill', 'heart', 'brain'];

  function init() {
    if (!modal) return;
    
    renderIconPicker();
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
      brain: 'hardware-chip-outline'
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
    renderIconPicker();
    
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
      Data.addHabit({ name, icon, goal, goalType });
      
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