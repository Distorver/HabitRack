// Habits module - main page logic for habits dashboard

const Habits = (function () {
  const container = document.getElementById("habitsGrid");
  const statsContainer = document.getElementById("statsContainer");
  const timeFilterBtns = document.querySelectorAll(".time-filter button");

  let currentFilter = 7;

  // Icon mapping
  const iconMap = {
    leaf: "leaf-outline",
    water: "water-outline",
    moon: "moon-outline",
    book: "book-outline",
    run: "fitness-outline",
    pill: "medical-outline",
    heart: "heart-outline",
    brain: "hardware-chip-outline",
    walk: "walk-outline",
    bicycle: "bicycle-outline",
    body: "body-outline",
    barbell: "barbell-outline",
    nutrition: "nutrition-outline",
    sunny: "sunny-outline",
    cafe: "cafe-outline",
    bed: "bed-outline",
    school: "school-outline",
    code: "code-slash-outline",
    "musical-notes": "musical-notes-outline",
    cash: "cash-outline",
  };

  function escapeHtml(value) {
    return String(value ?? "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  function hexToRgb(hex) {
    const normalized = (hex || "#f4b8c3").replace("#", "");
    const value = parseInt(
      normalized.length === 3
        ? normalized
            .split("")
            .map((char) => char + char)
            .join("")
        : normalized,
      16,
    );
    return {
      r: (value >> 16) & 255,
      g: (value >> 8) & 255,
      b: value & 255,
    };
  }

  function init() {
    if (!container) return;

    setupEventListeners();
    render();
  }

  function setupEventListeners() {
    // Time filter toggle
    timeFilterBtns.forEach((btn) => {
      btn.addEventListener("click", () => {
        timeFilterBtns.forEach((b) => b.classList.remove("active"));
        btn.classList.add("active");
        currentFilter = btn.dataset.days === "all" ? "all" : 7;
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

    const stats = Data.getStats(currentFilter === "all" ? 364 : currentFilter);

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
    const isAllDays = currentFilter === "all";
    const lastDays = Data.getLastDays(isAllDays ? 364 : currentFilter);

    container.innerHTML = habits
      .map((habit) => {
        const today = Data.getToday();
        const isCompletedToday = habit.completedDates.includes(today);
        const color = habit.color || "#f4b8c3";
        const rgb = hexToRgb(color);

        return `
        <div class="habit-card" data-habit-id="${habit.id}"
             style="--habit-color: ${color}; --habit-rgb: ${rgb.r}, ${rgb.g}, ${rgb.b};">
          <div class="habit-card-header">
            <div class="habit-info">
              <div class="habit-icon icon-${habit.icon}">
                <ion-icon name="${iconMap[habit.icon] || "ellipse-outline"}"></ion-icon>
              </div>
              <div class="habit-details">
                <h3>${escapeHtml(habit.name)}</h3>
                <p>${escapeHtml(habit.description || habit.goal)}</p>
              </div>
            </div>
            <div class="habit-card-actions">
            <button class="btn-remove-habit"
                    type="button"
                    data-habit-id="${habit.id}"
                    aria-label="Remove ${escapeHtml(habit.name)}"
                    title="Remove habit">
              <ion-icon name="trash-outline"></ion-icon>
            </button>
              <button class="btn-checkin ${isCompletedToday ? "completed" : ""}"
                      data-habit-id="${habit.id}"
                      aria-label="${isCompletedToday ? "Mark as incomplete" : "Mark as complete"}">
                <ion-icon name="checkmark-outline"></ion-icon>
              </button>
            </div>
          </div>
          <div class="habit-log">
            <div class="habit-log-title">${isAllDays ? "All Days" : `Last ${currentFilter} Days`}</div>
            <div class="habit-days ${isAllDays ? "days-30" : "days-7"}">
              ${lastDays
                .map((day) => {
                  const completed = habit.completedDates.includes(day.date);
                  return `
                  <div class="day-item">
                    ${!isAllDays ? `<span class="day-label">${day.dayName}</span>` : ""}
                    <button type="button"
                            class="day-box ${completed ? "completed" : ""} ${day.isToday ? "today" : ""}"
                            data-habit-id="${habit.id}"
                            data-date="${day.date}"
                            aria-label="${completed ? "Mark" : "Mark"} ${day.date} ${completed ? "incomplete" : "complete"}"
                            title="${day.date}">
                    </button>
                  </div>
                `;
                })
                .join("")}
            </div>
          </div>
        </div>
      `;
      })
      .join("");

    // Re-initialize ionicons
    if (window.ionicons) {
      window.ionicons.create();
    }

    // Add click handlers for check-in buttons
    container.querySelectorAll(".btn-checkin").forEach((btn) => {
      btn.addEventListener("click", handleCheckin);
    });

    container.querySelectorAll(".day-box").forEach((btn) => {
      btn.addEventListener("click", handleDayToggle);
    });

    container.querySelectorAll(".btn-remove-habit").forEach((btn) => {
      btn.addEventListener("click", handleRemoveHabit);
    });

    if (currentFilter === "all") {
      requestAnimationFrame(() => {
        container.querySelectorAll(".habit-days.days-30").forEach((grid) => {
          grid.scrollLeft = grid.scrollWidth;
        });
      });
    }
  }

  function handleCheckin(e) {
    const btn = e.currentTarget;
    const habitId = parseInt(btn.dataset.habitId);

    // Toggle completion
    Data.toggleHabitCompletion(habitId);

    // Re-render to show updated state
    render();
  }

  function handleDayToggle(e) {
    const btn = e.currentTarget;
    const habitId = parseInt(btn.dataset.habitId);
    Data.toggleHabitCompletionDate(habitId, btn.dataset.date);
    render();
  }

  function handleRemoveHabit(e) {
    const habitId = parseInt(e.currentTarget.dataset.habitId);
    Data.removeHabit(habitId);
    render();
  }

  return {
    init,
    render,
    renderStats,
    renderHabits,
  };
})();
