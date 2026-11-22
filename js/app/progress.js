// Progress module - zero-start progressive XP (25 + 5 every 2 days), level 1..100, tokens, and 7d/30d analytics

const Progress = (function () {
  const HABITS_STORAGE_KEY = "habitrack_habits";
  const XP_PER_LEVEL = 600;
  const MAX_LEVEL = 100;
  const TOKENS_PER_LEVEL_UP = 100;

  let currentRangeDays = 7;

  const els = {
    currentDate: document.getElementById("progressCurrentDate"),
    levelNumber: document.getElementById("levelNumber"),
    xpFraction: document.getElementById("xpFraction"),
    nextLevelLabel: document.getElementById("nextLevelLabel"),
    xpProgressBar: document.getElementById("xpProgressBar"),
    xpSubMeta: document.getElementById("xpSubMeta"),
    tokensCount: document.getElementById("tokensCount"),
    tokenBonusText: document.getElementById("tokenBonusText"),
    weekXpTotal: document.getElementById("weekXpTotal"),
    weekDeltaText: document.getElementById("weekDeltaText"),
    weeklyBarsContainer: document.getElementById("weeklyBarsContainer"),
    chartDateRange: document.getElementById("chartDateRange"),
    momentumHeading: document.getElementById("momentumHeading"),
    momentumDesc: document.getElementById("momentumDesc"),
    momentumReward: document.getElementById("momentumReward"),
    weeklyCompletionPct: document.getElementById("weeklyCompletionPct"),
    habitsProgressBody: document.getElementById("habitsProgressBody"),
    milestoneDaysText: document.getElementById("milestoneDaysText"),
    milestoneRemText: document.getElementById("milestoneRemText"),
    milestoneBar: document.getElementById("milestoneBar"),
    rangeButtons: document.querySelectorAll(".range-btn[data-range]"),
  };

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

  const segmentColors = ["seg-sky", "seg-rose", "seg-lavender", "seg-mint"];

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
      16
    );
    return {
      r: (value >> 16) & 255,
      g: (value >> 8) & 255,
      b: value & 255,
    };
  }

  function formatDateISO(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  }

  function getTodayISO() {
    return formatDateISO(new Date());
  }

  function formatHeaderDate(date = new Date()) {
    const weekday = date
      .toLocaleDateString("en-US", { weekday: "short" })
      .toUpperCase();
    const month = date
      .toLocaleDateString("en-US", { month: "short" })
      .toUpperCase();
    const day = String(date.getDate()).padStart(2, "0");
    return `${weekday}, ${month} ${day}`;
  }

  function formatShortRange(daysCount) {
    const end = new Date();
    const start = new Date();
    start.setDate(end.getDate() - (daysCount - 1));

    const startMonth = start.toLocaleDateString("en-US", { month: "short" });
    const endMonth = end.toLocaleDateString("en-US", { month: "short" });
    const startDay = start.getDate();
    const endDay = end.getDate();

    if (startMonth === endMonth) {
      return `${startMonth} ${startDay} – ${endDay}`;
    }
    return `${startMonth} ${startDay} – ${endMonth} ${endDay}`;
  }

  function loadHabits() {
    if (typeof Data !== "undefined" && typeof Data.getHabits === "function") {
      return Data.getHabits();
    }
    try {
      const raw = localStorage.getItem(HABITS_STORAGE_KEY);
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch (e) {
      return [];
    }
  }

  function getHabitDayXp(habit, dateStr) {
    if (typeof Data !== "undefined" && typeof Data.getCompletionXp === "function") {
      return Data.getCompletionXp(habit, dateStr);
    }
    const dates = Array.isArray(habit?.completedDates)
      ? Array.from(new Set(habit.completedDates)).sort()
      : [];
    const idx = dates.indexOf(dateStr);
    if (idx === -1) return 0;
    return 25 + Math.floor(idx / 2) * 5;
  }

  function getDaysList(daysCount) {
    const list = [];
    const today = new Date();
    for (let i = daysCount - 1; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      list.push({
        iso: formatDateISO(d),
        dayLabel:
          i === 0
            ? "Today"
            : d.toLocaleDateString("en-US", { weekday: "short" }),
        isToday: i === 0,
      });
    }
    return list;
  }

  function calculateStreak(habits) {
    if (!habits.length) return 0;

    const todayStr = getTodayISO();
    let streak = 0;
    const cursor = new Date();

    while (streak < 365) {
      const dateStr = formatDateISO(cursor);
      const anyCompleted = habits.some(
        (h) => Array.isArray(h.completedDates) && h.completedDates.includes(dateStr)
      );

      if (anyCompleted) {
        streak++;
        cursor.setDate(cursor.getDate() - 1);
      } else if (streak === 0 && dateStr === todayStr) {
        cursor.setDate(cursor.getDate() - 1);
      } else {
        break;
      }
    }

    return streak;
  }

  function computeProgressState(habits, rangeDays) {
    const lifetimeXp = habits.reduce((total, habit) => {
      const dates = Array.isArray(habit.completedDates)
        ? Array.from(new Set(habit.completedDates)).sort()
        : [];
      const habitXp = dates.reduce(
        (sum, dateStr) => sum + getHabitDayXp(habit, dateStr),
        0
      );
      return total + habitXp;
    }, 0);

    const rawLevel = Math.floor(lifetimeXp / XP_PER_LEVEL) + 1;
    const level = Math.min(MAX_LEVEL, Math.max(1, rawLevel));
    const isMaxLevel = level >= MAX_LEVEL;

    const currentLevelXp = isMaxLevel ? XP_PER_LEVEL : lifetimeXp % XP_PER_LEVEL;
    const xpToNextLevel = isMaxLevel ? 0 : XP_PER_LEVEL - currentLevelXp;
    const xpPercent = isMaxLevel
      ? 100
      : Math.min(100, Math.round((currentLevelXp / XP_PER_LEVEL) * 100));

    const levelsGained = Math.max(0, level - 1);
    const tokens = levelsGained * TOKENS_PER_LEVEL_UP;

    const daysList = getDaysList(rangeDays);
    let rangeXp = 0;
    let rangeGoalsReached = 0;

    daysList.forEach((day) => {
      habits.forEach((habit) => {
        const xpForDay = getHabitDayXp(habit, day.iso);
        if (xpForDay > 0) {
          rangeXp += xpForDay;
          rangeGoalsReached++;
        }
      });
    });

    const prevEnd = new Date();
    prevEnd.setDate(prevEnd.getDate() - rangeDays);
    let prevRangeXp = 0;

    for (let i = 0; i < rangeDays; i++) {
      const d = new Date(prevEnd);
      d.setDate(prevEnd.getDate() - i);
      const iso = formatDateISO(d);
      habits.forEach((habit) => {
        prevRangeXp += getHabitDayXp(habit, iso);
      });
    }

    const xpDiff = rangeXp - prevRangeXp;
    const possibleGoals = Math.max(1, habits.length * rangeDays);
    const completionPct = Math.min(
      100,
      Math.round((rangeGoalsReached / possibleGoals) * 100)
    );

    const todayISO = getTodayISO();
    const completedTodayHabits = habits.filter(
      (h) => Array.isArray(h.completedDates) && h.completedDates.includes(todayISO)
    );
    const remainingTodayHabits = habits.filter(
      (h) => !Array.isArray(h.completedDates) || !h.completedDates.includes(todayISO)
    );

    const nextGoalsPotentialXp = remainingTodayHabits.reduce((sum, habit) => {
      const existingCount = Array.isArray(habit.completedDates)
        ? habit.completedDates.length
        : 0;
      const nextDayNum = existingCount + 1;
      const nextXp = 25 + Math.floor((nextDayNum - 1) / 2) * 5;
      return sum + nextXp;
    }, 0);

    const streak = calculateStreak(habits);

    return {
      level,
      nextLevel: Math.min(MAX_LEVEL, level + 1),
      isMaxLevel,
      currentLevelXp,
      xpToNextLevel,
      xpPercent,
      lifetimeXp,
      tokens,
      rangeDays,
      daysList,
      rangeXp,
      xpDiff,
      rangeGoalsReached,
      possibleGoals,
      completionPct,
      completedTodayCount: completedTodayHabits.length,
      remainingTodayHabits,
      nextGoalsPotentialXp,
      streak,
    };
  }

  function renderHeaderAndLevel(state) {
    if (els.currentDate) {
      els.currentDate.textContent = formatHeaderDate(new Date());
    }

    if (els.levelNumber) {
      els.levelNumber.textContent = String(state.level).padStart(2, "0");
    }

    if (els.xpFraction) {
      els.xpFraction.textContent = `${state.currentLevelXp} / ${XP_PER_LEVEL} XP`;
    }

    if (els.nextLevelLabel) {
      els.nextLevelLabel.textContent = state.isMaxLevel
        ? "MAX LVL"
        : `Level ${String(state.nextLevel).padStart(2, "0")}`;
    }

    if (els.xpProgressBar) {
      els.xpProgressBar.style.width = `${state.xpPercent}%`;
      els.xpProgressBar.parentElement?.setAttribute(
        "aria-valuenow",
        String(state.xpPercent)
      );
    }

    if (els.xpSubMeta) {
      const formattedLifetime = state.lifetimeXp.toLocaleString("en-US");
      els.xpSubMeta.textContent = state.isMaxLevel
        ? `Max level 100 reached · ${formattedLifetime} lifetime XP`
        : `${state.xpToNextLevel} XP to your next level · ${formattedLifetime} lifetime XP`;
    }

    if (els.tokensCount) {
      els.tokensCount.textContent = String(state.tokens);
    }

    if (els.tokenBonusText) {
      els.tokenBonusText.textContent = state.isMaxLevel
        ? "Max level unlocked · Keep earning XP"
        : `+${TOKENS_PER_LEVEL_UP} tokens at Level ${String(state.nextLevel).padStart(2, "0")}`;
    }
  }

  function renderChart(habits, state) {
    const { rangeDays, daysList, rangeXp, xpDiff, rangeGoalsReached, possibleGoals } =
      state;

    if (els.weekXpTotal) {
      els.weekXpTotal.textContent = String(rangeXp);
    }

    if (els.weekDeltaText) {
      const sign = xpDiff >= 0 ? "+" : "";
      const periodLabel = rangeDays === 7 ? "last week" : "previous 30d";
      els.weekDeltaText.textContent = `${sign}${xpDiff} vs. ${periodLabel} · ${rangeGoalsReached} of ${possibleGoals} goals reached`;
    }

    if (els.chartDateRange) {
      els.chartDateRange.textContent = formatShortRange(rangeDays);
    }

    const legendContainer = document.querySelector(".chart-legend");
    if (legendContainer && habits.length) {
      legendContainer.innerHTML = habits
        .map(
          (h) =>
            `<span class="legend-item"><i class="legend-dot" style="background-color: ${h.color || "var(--color-orange, #fd551d)"};"></i> ${escapeHtml(h.name)}</span>`
        )
        .join("");
    }

    if (!els.weeklyBarsContainer) return;

    const is30Days = rangeDays === 30;
    els.weeklyBarsContainer.style.gridTemplateColumns = is30Days
      ? "repeat(30, minmax(0, 1fr))"
      : "repeat(7, minmax(0, 1fr))";
    els.weeklyBarsContainer.style.gap = is30Days ? "4px" : "12px";

    if (!habits.length) {
      els.weeklyBarsContainer.innerHTML = `<div class="muted-label">No habits yet</div>`;
      return;
    }

    const maxDailyXp = Math.max(100, habits.length * 40);

    els.weeklyBarsContainer.innerHTML = daysList
      .map((day) => {
        const segmentsHtml = habits
          .map((habit, idx) => {
            const xpVal = getHabitDayXp(habit, day.iso);
            if (xpVal <= 0) return "";

            const segColor = habit.color || "var(--color-orange, #fd551d)";
            const rawHeight = Math.round((xpVal / maxDailyXp) * 96);
            const heightPx = Math.max(is30Days ? 8 : 16, Math.min(28, rawHeight));

            return `<span class="bar-seg" style="height: ${heightPx}px; background-color: ${segColor};" title="${escapeHtml(habit.name)} (+${xpVal} XP)"></span>`;
          })
          .join("");

        const labelText = is30Days
          ? day.isToday
            ? "Now"
            : String(new Date(day.iso + "T00:00:00").getDate())
          : day.dayLabel;

        return `
          <div class="bar-column">
            <div class="bar-stack" style="${is30Days ? "max-width: 14px; gap: 2px;" : ""}">
              ${segmentsHtml}
            </div>
            <span class="bar-day mono-text ${day.isToday ? "is-today" : ""}" style="${is30Days ? "font-size: 0.62rem;" : ""}">
              ${escapeHtml(labelText)}
            </span>
          </div>
        `;
      })
      .join("");
  }

  function renderMomentum(habits, state) {
    const { completedTodayCount, remainingTodayHabits, nextGoalsPotentialXp } = state;
    const remCount = remainingTodayHabits.length;

    if (els.momentumHeading) {
      if (!habits.length) {
        els.momentumHeading.textContent = "Start from zero today.";
      } else if (completedTodayCount === 0) {
        els.momentumHeading.textContent = "No wins yet today.";
      } else if (completedTodayCount === 1) {
        els.momentumHeading.textContent = "One win already today.";
      } else if (completedTodayCount === 2) {
        els.momentumHeading.textContent = "Two wins already today.";
      } else {
        els.momentumHeading.textContent = `${completedTodayCount} wins already today.`;
      }
    }

    if (els.momentumDesc) {
      if (!habits.length) {
        els.momentumDesc.textContent =
          "Add a habit in All Habits and mark it complete to start earning progressive XP.";
      } else if (remCount === 0) {
        els.momentumDesc.textContent =
          "Every habit goal for today is complete. Great consistency!";
      } else {
        const previewNames = remainingTodayHabits
          .slice(0, 2)
          .map((h) => `${h.name} (${h.goal || "goal"})`)
          .join(" and ");
        els.momentumDesc.textContent = `Complete ${previewNames} to reach your next goals.`;
      }
    }

    if (els.momentumReward) {
      if (remCount <= 0) {
        els.momentumReward.textContent = "All daily goals completed";
      } else {
        els.momentumReward.textContent = `${remCount} more ${remCount === 1 ? "goal" : "goals"} = +${nextGoalsPotentialXp} XP`;
      }
    }
  }

  function renderHabitsTable(habits, state) {
    if (els.weeklyCompletionPct) {
      els.weeklyCompletionPct.textContent = `${state.completionPct}% completed in last ${state.rangeDays}d`;
    }

    if (!els.habitsProgressBody) return;

    if (!habits.length) {
      els.habitsProgressBody.innerHTML = `
        <tr>
          <td colspan="4" class="text-center py-4 muted-label">
            No habits found. Add a habit from All Habits to see progress here.
          </td>
        </tr>
      `;
      return;
    }

    const last7Days = getDaysList(7);
    const todayISO = getTodayISO();

    els.habitsProgressBody.innerHTML = habits
      .map((habit) => {
        const completedDates = Array.isArray(habit.completedDates)
          ? habit.completedDates
          : [];
        const isDoneToday = completedDates.includes(todayISO);
        const iconName = iconMap[habit.icon] || "ellipse-outline";
        const color = habit.color || "#f4b8c3";
        const rgb = hexToRgb(color);

        const doneIn7 = last7Days.filter((d) =>
          completedDates.includes(d.iso)
        ).length;

        const ticksHtml = last7Days
          .map(
            (d) =>
              `<span class="tick-pill ${completedDates.includes(d.iso) ? "is-done" : ""}" title="${d.iso} (+${getHabitDayXp(habit, d.iso)} XP)"></span>`
          )
          .join("");

        let habitStreak = 0;
        const cursor = new Date();
        while (habitStreak < 365) {
          const iso = formatDateISO(cursor);
          if (completedDates.includes(iso)) {
            habitStreak++;
            cursor.setDate(cursor.getDate() - 1);
          } else if (habitStreak === 0 && iso === todayISO) {
            cursor.setDate(cursor.getDate() - 1);
          } else {
            break;
          }
        }

        const todayStatusHtml = isDoneToday
          ? `<span class="status-reached"><ion-icon name="checkmark-outline"></ion-icon> Goal reached</span>`
          : `<span class="today-pending mono-text">${escapeHtml(habit.goal || "Pending")}</span>`;

        return `
          <tr style="--habit-color: ${color}; --habit-rgb: ${rgb.r}, ${rgb.g}, ${rgb.b};">
            <td>
              <div class="d-flex align-items-center gap-3">
                <span class="habit-badge-icon">
                  <ion-icon name="${iconName}"></ion-icon>
                </span>
                <div>
                  <div class="habit-row-title">${escapeHtml(habit.name)}</div>
                  <div class="habit-row-sub">${escapeHtml(habit.goal || "Daily tracking")}</div>
                </div>
              </div>
            </td>
            <td>
              <div class="mini-ticks d-flex gap-1 mb-1">
                ${ticksHtml}
              </div>
              <div class="habit-row-sub">${doneIn7} / 7 goals</div>
            </td>
            <td class="streak-cell">${habitStreak} ${habitStreak === 1 ? "day" : "days"}</td>
            <td class="text-end">${todayStatusHtml}</td>
          </tr>
        `;
      })
      .join("");
  }

  function renderMilestones(state) {
    const targetDays = 14;
    const currentStreakDays = Math.min(targetDays, state.streak || 0);
    const remainingDays = Math.max(0, targetDays - currentStreakDays);
    const pct = Math.min(100, Math.round((currentStreakDays / targetDays) * 100));

    if (els.milestoneDaysText) {
      els.milestoneDaysText.textContent = `${currentStreakDays} / ${targetDays} days`;
    }

    if (els.milestoneRemText) {
      els.milestoneRemText.textContent =
        remainingDays === 0
          ? "Milestone unlocked!"
          : `${remainingDays} ${remainingDays === 1 ? "day" : "days"} to go`;
    }

    if (els.milestoneBar) {
      els.milestoneBar.style.width = `${pct}%`;
      els.milestoneBar.parentElement?.setAttribute("aria-valuenow", String(pct));
    }
  }

  function render() {
    const habits = loadHabits();
    const state = computeProgressState(habits, currentRangeDays);

    renderHeaderAndLevel(state);
    renderChart(habits, state);
    renderMomentum(habits, state);
    renderHabitsTable(habits, state);
    renderMilestones(state);
  }

  function bindEvents() {
    els.rangeButtons.forEach((btn) => {
      btn.addEventListener("click", () => {
        els.rangeButtons.forEach((b) => b.classList.remove("is-active"));
        btn.classList.add("is-active");
        currentRangeDays = parseInt(btn.dataset.range, 10) === 30 ? 30 : 7;
        render();
      });
    });

    window.addEventListener("storage", (event) => {
      if (event.key === HABITS_STORAGE_KEY) {
        render();
      }
    });

    document.addEventListener("visibilitychange", () => {
      if (!document.hidden) {
        render();
      }
    });
  }

  function init() {
    bindEvents();
    render();
  }

  return {
    init,
    render,
  };
})();

document.addEventListener("DOMContentLoaded", () => {
  Progress.init();
});