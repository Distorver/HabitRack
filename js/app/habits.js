// Habits module - main page logic for habits dashboard

const Habits = (function() {
  const container = document.getElementById('habitsGrid');
  const statsContainer = document.getElementById('statsContainer');
  const timeFilterBtns = document.querySelectorAll('.time-filter button');
  
  let currentFilter = 7; // 7 or 30 days

  // Icon mapping
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

  function init() {
    if (!container) return;
    
    setupEventListeners();
    render();
  }

  function setupEventListeners() {
    // Time filter toggle
    timeFilterBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        timeFilterBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        currentFilter = parseInt(btn.dataset.days);
        render();
      });
    });
  }

  function render() {
    renderStats();
    renderHabits();
  }

  function renderStats() {
    if (!statsContainer) return;
    
    const stats = Data.getStats(currentFilter);
    
    statsContainer.innerHTML = `
      <div class="stat-card">
        <span class="stat-label">Total Habits</span>
        <span class="stat-value">${stats.totalHabits}</span>
      </div>
      <div class="stat-card">
        <span class="stat-label">Streak</span>
        <span class="stat-value">${stats.streak} <span>Days</span></span>
      </div>
      <div class="stat-card">
        <span class="stat-label">Completion</span>
        <span class="stat-value">${stats.completion}<span>%</span></span>
      </div>
    `;
  }

  function renderHabits() {
    if (!container) return;
    
    const habits = Data.getHabits();
    const lastDays = Data.getLastDays(currentFilter);
    
    container.innerHTML = habits.map(habit => {
      const today = Data.getToday();
      const isCompletedToday = habit.completedDates.includes(today);
      
      return `
        <div class="habit-card" data-habit-id="${habit.id}">
          <div class="habit-card-header">
            <div class="habit-info">
              <div class="habit-icon icon-${habit.icon}">
                <ion-icon name="${iconMap[habit.icon] || 'ellipse-outline'}"></ion-icon>
              </div>
              <div class="habit-details">
                <h3>${habit.name}</h3>
                <p>${habit.goal}</p>
              </div>
            </div>
            <button class="btn-checkin ${isCompletedToday ? 'completed' : ''}" 
                    data-habit-id="${habit.id}"
                    aria-label="${isCompletedToday ? 'Mark as incomplete' : 'Mark as complete'}">
              <ion-icon name="checkmark-outline"></ion-icon>
            </button>
          </div>
          <div class="habit-log">
            <div class="habit-log-title">Last ${currentFilter} Days</div>
            <div class="habit-days">
              ${lastDays.map(day => {
                const completed = habit.completedDates.includes(day.date);
                return `
                  <div class="day-box ${completed ? 'completed' : ''} ${day.isToday ? 'today' : ''}" 
                       title="${day.date}">
                    ${day.dayName}
                  </div>
                `;
              }).join('')}
            </div>
          </div>
        </div>
      `;
    }).join('');

    // Re-initialize ionicons
    if (window.ionicons) {
      window.ionicons.create();
    }

    // Add click handlers for check-in buttons
    container.querySelectorAll('.btn-checkin').forEach(btn => {
      btn.addEventListener('click', handleCheckin);
    });
  }

  function handleCheckin(e) {
    const btn = e.currentTarget;
    const habitId = parseInt(btn.dataset.habitId);
    
    // Toggle completion
    Data.toggleHabitCompletion(habitId);
    
    // Re-render to show updated state
    render();
  }

  return {
    init,
    render,
    renderStats,
    renderHabits
  };
})();