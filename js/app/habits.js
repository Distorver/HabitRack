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
        const numericGoal =
          habit.goalType === "numeric" ? Data.getNumericGoal(habit.goal) : null;
        const increment = numericGoal ? Data.getHabitIncrement(habit) : 0;
        const progress = numericGoal ? Data.getHabitProgress(habit, today) : 0;
        const segmentCount = numericGoal
          ? Math.max(
              1,
              Math.ceil(Number((numericGoal.target / increment).toPrecision(12)))
            )
          : 0;
        const isNumericComplete = numericGoal && progress >= numericGoal.target;
        const checkinButton = numericGoal && !isNumericComplete
          ? renderNumericCheckin(
              habit,
              numericGoal,
              increment,
              progress,
              segmentCount
            )
          : `<button class="btn-checkin ${isNumericComplete || isCompletedToday ? "completed" : ""}"
                     type="button"
                     data-habit-id="${habit.id}"
                     aria-label="${isNumericComplete ? `Mark ${escapeHtml(habit.name)} incomplete` : isCompletedToday ? "Mark as incomplete" : "Mark as complete"}">
                <ion-icon name="checkmark-outline"></ion-icon>
              </button>`;

        return `
        <div class="habit-card" data-habit-id="${habit.id}"
             style="--habit-color: ${color}; --habit-rgb: ${rgb.r}, ${rgb.g}, ${rgb.b};">
          <div class="habit-card-header">
            <div class="habit-info">
              <button class="habit-icon icon-${habit.icon} habit-edit-trigger"
                      type="button"
                      data-habit-id="${habit.id}"
                      aria-label="Edit ${escapeHtml(habit.name)}"
                      title="Edit habit">
                <ion-icon name="${iconMap[habit.icon] || "ellipse-outline"}"></ion-icon>
              </button>
              <div class="habit-details">
                <h3><button class="habit-title-edit habit-edit-trigger"
                            type="button"
                            data-habit-id="${habit.id}"
                            aria-label="Edit ${escapeHtml(habit.name)}"
                            title="Edit habit">${escapeHtml(habit.name)}</button></h3>
                <p>${escapeHtml(habit.description || habit.goal)}</p>
              </div>
            </div>
            <div class="habit-card-actions">
              ${checkinButton}
            </div>
          </div>
          <div class="habit-log">
            <div class="habit-log-title">${isAllDays ? "All Days" : `Last ${currentFilter} Days`}</div>
            <div class="habit-days ${isAllDays ? "days-30" : "days-7"}">
              ${lastDays
                .map((day) => {
                  const completed = habit.completedDates.includes(day.date);
                  const dayProgress = numericGoal
                    ? Data.getHabitProgress(habit, day.date)
                    : 0;
                  const dayOpacity = numericGoal
                    ? 0.12 + 0.88 * Math.min(1, dayProgress / numericGoal.target)
                    : 0;
                  return `
                  <div class="day-item">
                    ${!isAllDays ? `<span class="day-label">${day.dayName}</span>` : ""}
                    <button type="button"
                            class="day-box ${completed ? "completed" : ""} ${numericGoal ? "numeric-progress" : ""} ${day.isToday ? "today" : ""}"
                            data-habit-id="${habit.id}"
                            data-date="${day.date}"
                            aria-label="${numericGoal ? `${dayProgress} of ${numericGoal.target}${numericGoal.unit ? ` ${escapeHtml(numericGoal.unit)}` : ""} on ${day.date}; toggle completion` : `${completed ? "Mark" : "Mark"} ${day.date} ${completed ? "incomplete" : "complete"}`}"
                            ${numericGoal ? `style="--day-opacity: ${dayOpacity}"` : ""}
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

    container.querySelectorAll(".habit-edit-trigger").forEach((btn) => {
      btn.addEventListener("click", handleEditHabit);
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
    const habit = Data.getHabits().find((item) => item.id === habitId);
    if (!habit) return;

    if (habit.goalType === "numeric") {
      const numericGoal = Data.getNumericGoal(habit.goal);
      const progress = Data.getHabitProgress(habit, Data.getToday());
      if (numericGoal && progress >= numericGoal.target) {
        Data.toggleHabitCompletionDate(habitId, Data.getToday());
      } else {
        Data.incrementHabitProgress(habitId);
      }
    } else {
      Data.toggleHabitCompletion(habitId);
    }

    // Re-render to show updated state
    render();
  }

  function renderNumericCheckin(habit, numericGoal, increment, progress, segmentCount) {
    const period = 100 / segmentCount;
    const gap = Math.min(1.5, period * 0.25);
    const segmentLength = period - gap;
    const progressSegments = Math.min(
      segmentCount,
      Math.ceil(progress / increment)
    );
    const trackDash = Array(segmentCount)
      .fill(`${segmentLength} ${gap}`)
      .join(" ");
    const progressDash = [
      ...Array(progressSegments).fill(`${segmentLength} ${gap}`),
      `0 ${Math.max(0, 100 - progressSegments * period)}`,
    ].join(" ");
    const unit = numericGoal.unit ? ` ${escapeHtml(numericGoal.unit)}` : "";
    const displayValue = String(progress);
    const displayWidth = Math.min(35, displayValue.length * 5.2);

    return `
      <button class="btn-checkin numeric-checkin"
              type="button"
              data-habit-id="${habit.id}"
              aria-label="Add ${increment}${unit} to ${escapeHtml(habit.name)} (${progress} of ${numericGoal.target}${unit} completed)"
              title="${progress} of ${numericGoal.target}${unit}">
        <svg class="checkin-border" viewBox="0 0 44 44" aria-hidden="true">
          <path class="checkin-border-track"
                d="M 3 3 H 41 V 41 H 3 Z"
                pathLength="100"
                stroke-dasharray="${trackDash}" />
          ${progressSegments ? `
          <path class="checkin-border-progress"
                d="M 3 3 H 41 V 41 H 3 Z"
                pathLength="100"
                stroke-dasharray="${progressDash}" />` : ""}
          <path class="checkin-border-hover"
                d="M 3 3 H 41 V 41 H 3 Z"
                pathLength="100"
                stroke-dasharray="${segmentLength} ${100 - segmentLength}"
                stroke-dashoffset="${-progressSegments * period}" />
          <text class="numeric-checkin-value"
                x="22"
                y="22"
                text-anchor="middle"
                dominant-baseline="central"
                textLength="${displayWidth}"
                lengthAdjust="spacingAndGlyphs">${escapeHtml(displayValue)}</text>
        </svg>
      </button>
    `;
  }

  function handleDayToggle(e) {
    const btn = e.currentTarget;
    const habitId = parseInt(btn.dataset.habitId);
    Data.toggleHabitCompletionDate(habitId, btn.dataset.date);
    render();
  }

  function handleEditHabit(e) {
    const habitId = parseInt(e.currentTarget.dataset.habitId);
    const habit = Data.getHabits().find((h) => h.id === habitId);

    if (!habit || typeof Modal === "undefined") return;

    Modal.openForEdit(habit);
  }

  return {
    init,
    render,
    renderStats,
    renderHabits,
  };
})();
