// Achievements module - tracks 24 dynamic badges across Starter, Rare, Epic & Legendary tiers

const Achievements = (function () {
  const HABITS_STORAGE_KEY = "habitrack_habits";
  const UNLOCK_DATES_KEY = "habitrack_achievement_dates";

  let activeFilter = "all";

  const els = {
    currentDate: document.getElementById("achCurrentDate"),
    nextRing: document.getElementById("nextAchRing"),
    nextIcon: document.getElementById("nextAchIcon"),
    nextTitle: document.getElementById("nextAchTitle"),
    nextDesc: document.getElementById("nextAchDesc"),
    nextFraction: document.getElementById("nextAchFraction"),
    nextRemaining: document.getElementById("nextAchRemaining"),
    nextBar: document.getElementById("nextAchBar"),
    nextXp: document.getElementById("nextAchXp"),
    nextTokens: document.getElementById("nextAchTokens"),
    collectionUnlocked: document.getElementById("collectionUnlockedCount"),
    collectionTotal: document.getElementById("collectionTotalCount"),
    collectionBar: document.getElementById("collectionProgressBar"),
    rarityStarter: document.getElementById("rarityStarterCount"),
    rarityRare: document.getElementById("rarityRareCount"),
    rarityEpic: document.getElementById("rarityEpicCount"),
    rarityLegendary: document.getElementById("rarityLegendaryCount"),
    filterAllBtn: document.getElementById("filterAllBtn"),
    filterUnlockedBtn: document.getElementById("filterUnlockedBtn"),
    filterProgressBtn: document.getElementById("filterProgressBtn"),
    filterLockedBtn: document.getElementById("filterLockedBtn"),
    filterButtons: document.querySelectorAll(".ach-filter-btn[data-filter]"),
    grid: document.getElementById("achievementsGrid"),
  };

  // 24 Achievements matching rarity distribution: 8 Starter, 10 Rare, 4 Epic, 2 Legendary
  const BADGE_DEFINITIONS = [
    // --- STARTER (8) ---
    {
      id: "first_step",
      title: "The first step",
      desc: "Reach your first habit goal.",
      icon: "flag-outline",
      rarity: "starter",
      accent: "#f4efc6",
      xp: 25,
      tokens: 15,
      target: 1,
      unit: "goal",
      measure: (m) => m.totalCompletions,
    },
    {
      id: "habit_builder",
      title: "Habit builder",
      desc: "Create 3 active habits in your routine.",
      icon: "layers-outline",
      rarity: "starter",
      accent: "#b8e3cb",
      xp: 25,
      tokens: 15,
      target: 3,
      unit: "habits",
      measure: (m) => m.totalHabits,
    },
    {
      id: "three_day_spark",
      title: "Three-day spark",
      desc: "Keep your streak alive for 3 days.",
      icon: "flame-outline",
      rarity: "starter",
      accent: "#ff5500",
      xp: 30,
      tokens: 20,
      target: 3,
      unit: "days",
      measure: (m) => m.bestStreak,
    },
    {
      id: "high_five",
      title: "High five",
      desc: "Complete 5 habit goals in total.",
      icon: "hand-left-outline",
      rarity: "starter",
      accent: "#9dd6ea",
      xp: 30,
      tokens: 20,
      target: 5,
      unit: "goals",
      measure: (m) => m.totalCompletions,
    },
    {
      id: "hydration_starter",
      title: "First sip",
      desc: "Log 3 hydration or water goals.",
      icon: "water-outline",
      rarity: "starter",
      accent: "#f3b5be",
      xp: 30,
      tokens: 20,
      target: 3,
      unit: "days",
      measure: (m) => m.waterCompletions,
    },
    {
      id: "page_turner",
      title: "Page turner",
      desc: "Finish 3 reading sessions.",
      icon: "book-outline",
      rarity: "starter",
      accent: "#b8e3cb",
      xp: 30,
      tokens: 20,
      target: 3,
      unit: "sessions",
      measure: (m) => m.readingCompletions,
    },
    {
      id: "night_owl_rest",
      title: "Rested start",
      desc: "Hit your sleep goal 3 times.",
      icon: "moon-outline",
      rarity: "starter",
      accent: "#d9c3eb",
      xp: 30,
      tokens: 20,
      target: 3,
      unit: "nights",
      measure: (m) => m.sleepCompletions,
    },
    {
      id: "double_digits",
      title: "Double digits",
      desc: "Reach 10 completed goals overall.",
      icon: "checkmark-done-outline",
      rarity: "starter",
      accent: "#f4efc6",
      xp: 40,
      tokens: 25,
      target: 10,
      unit: "goals",
      measure: (m) => m.totalCompletions,
    },

    // --- RARE (10) ---
    {
      id: "one_week_stronger",
      title: "One week stronger",
      desc: "Hit a goal every day for 7 days.",
      icon: "flame-outline",
      rarity: "rare",
      accent: "#ff5500",
      xp: 50,
      tokens: 30,
      target: 7,
      unit: "days",
      measure: (m) => m.bestStreak,
    },
    {
      id: "hydro_hero",
      title: "Hydro hero",
      desc: "Reach your water goal 7 days in a row.",
      icon: "water-outline",
      rarity: "rare",
      accent: "#f3b5be",
      xp: 50,
      tokens: 30,
      target: 7,
      unit: "days",
      measure: (m) => m.waterStreak,
    },
    {
      id: "comeback_kid",
      title: "Comeback kid",
      desc: "Get back on track after a missed day.",
      icon: "refresh-outline",
      rarity: "rare",
      accent: "#9dd6ea",
      xp: 40,
      tokens: 25,
      target: 1,
      unit: "comeback",
      measure: (m) => (m.hasComeback ? 1 : 0),
    },
    {
      id: "sleep_well",
      title: "Sleep well",
      desc: "Hit your sleep goal 5 nights in a row.",
      icon: "moon-outline",
      rarity: "rare",
      accent: "#d9c3eb",
      xp: 60,
      tokens: 35,
      target: 5,
      unit: "nights",
      measure: (m) => m.sleepStreak,
    },
    {
      id: "perfect_day",
      title: "Perfect day",
      desc: "Reach all 4 goals in a single day.",
      icon: "star-outline",
      rarity: "rare",
      accent: "#ff5500",
      xp: 100,
      tokens: 50,
      target: 4,
      unit: "goals",
      measure: (m) => m.bestSingleDayCount,
    },
    {
      id: "quarter_century",
      title: "Quarter century",
      desc: "Complete 25 habit goals across any habits.",
      icon: "medal-outline",
      rarity: "rare",
      accent: "#f3b5be",
      xp: 60,
      tokens: 35,
      target: 25,
      unit: "goals",
      measure: (m) => m.totalCompletions,
    },
    {
      id: "sweet_control",
      title: "Sugar mindful",
      desc: "Track your sugar intake 10 times.",
      icon: "leaf-outline",
      rarity: "rare",
      accent: "#b8e3cb",
      xp: 55,
      tokens: 30,
      target: 10,
      unit: "days",
      measure: (m) => m.sugarCompletions,
    },
    {
      id: "bookworm",
      title: "Bookworm",
      desc: "Finish 30 reading sessions.",
      icon: "book-outline",
      rarity: "rare",
      accent: "#b8e3cb",
      xp: 75,
      tokens: 40,
      target: 30,
      unit: "sessions",
      measure: (m) => m.readingCompletions,
    },
    {
      id: "rising_level",
      title: "Level climber",
      desc: "Reach Level 03 in Your Progress.",
      icon: "arrow-up-circle-outline",
      rarity: "rare",
      accent: "#9dd6ea",
      xp: 70,
      tokens: 40,
      target: 3,
      unit: "level",
      measure: (m) => m.level,
    },
    {
      id: "ten_day_rhythm",
      title: "Ten-day rhythm",
      desc: "Maintain an active streak for 10 days.",
      icon: "pulse-outline",
      rarity: "rare",
      accent: "#f4efc6",
      xp: 80,
      tokens: 45,
      target: 10,
      unit: "days",
      measure: (m) => m.bestStreak,
    },

    // --- EPIC (4) ---
    {
      id: "two_weeks_of_you",
      title: "Two weeks of you",
      desc: "Reach any habit goal for 14 days in a row.",
      icon: "trending-up-outline",
      rarity: "epic",
      accent: "#d9c3eb",
      xp: 150,
      tokens: 50,
      target: 14,
      unit: "days",
      measure: (m) => m.bestStreak,
    },
    {
      id: "fifty_club",
      title: "Fifty club",
      desc: "Reach 50 total completed habit goals.",
      icon: "trophy-outline",
      rarity: "epic",
      accent: "#d9c3eb",
      xp: 120,
      tokens: 60,
      target: 50,
      unit: "goals",
      measure: (m) => m.totalCompletions,
    },
    {
      id: "secret_hat_trick",
      title: "Secret achievement",
      revealedTitle: "Triple perfect",
      desc: "Keep showing up to reveal this one.",
      revealedDesc: "Complete all active habits on 3 separate days.",
      icon: "sparkles-outline",
      rarity: "epic",
      accent: "#d9c3eb",
      xp: 100,
      tokens: 60,
      secret: true,
      target: 3,
      unit: "days",
      measure: (m) => m.perfectDaysCount,
    },
    {
      id: "three_week_iron",
      title: "21-day habit",
      desc: "Stay consistent for 21 consecutive days.",
      icon: "shield-checkmark-outline",
      rarity: "epic",
      accent: "#d9c3eb",
      xp: 180,
      tokens: 80,
      target: 21,
      unit: "days",
      measure: (m) => m.bestStreak,
    },

    // --- LEGENDARY (2) ---
    {
      id: "unstoppable_thirty",
      title: "Unstoppable 30",
      desc: "Achieve a 30-day unbroken activity streak.",
      icon: "flame-outline",
      rarity: "legendary",
      accent: "#ff5500",
      xp: 250,
      tokens: 120,
      target: 30,
      unit: "days",
      measure: (m) => m.bestStreak,
    },
    {
      id: "secret_centurion",
      title: "Secret achievement",
      revealedTitle: "Century master",
      desc: "Keep showing up to reveal this one.",
      revealedDesc: "Complete 100 total habit goals across your journey.",
      icon: "diamond-outline",
      rarity: "legendary",
      accent: "#ff5500",
      xp: 300,
      tokens: 150,
      secret: true,
      target: 100,
      unit: "goals",
      measure: (m) => m.totalCompletions,
    },
  ];

  function escapeHtml(value) {
    return String(value ?? "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
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

  function formatShortMonthDay(isoStr) {
    if (!isoStr) return "";
    const parsed = new Date(`${isoStr}T00:00:00`);
    if (Number.isNaN(parsed.getTime())) return isoStr;
    const month = parsed.toLocaleDateString("en-US", { month: "short" });
    const day = String(parsed.getDate()).padStart(2, "0");
    return `${month} ${day}`;
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

  function loadUnlockDates() {
    try {
      const raw = localStorage.getItem(UNLOCK_DATES_KEY);
      if (!raw) return {};
      const parsed = JSON.parse(raw);
      return parsed && typeof parsed === "object" ? parsed : {};
    } catch (e) {
      return {};
    }
  }

  function saveUnlockDates(map) {
    try {
      localStorage.setItem(UNLOCK_DATES_KEY, JSON.stringify(map));
    } catch (e) {
      // Ignore storage errors
    }
  }

  function computeSingleHabitStreak(dates) {
    if (!dates.length) return 0;
    const uniqueSorted = Array.from(new Set(dates)).sort();
    let best = 1;
    let current = 1;

    for (let i = 1; i < uniqueSorted.length; i++) {
      const prev = new Date(`${uniqueSorted[i - 1]}T00:00:00`);
      const curr = new Date(`${uniqueSorted[i]}T00:00:00`);
      const diffDays = Math.round((curr - prev) / 86400000);
      if (diffDays === 1) {
        current++;
        best = Math.max(best, current);
      } else if (diffDays > 1) {
        current = 1;
      }
    }
    return best;
  }

  function gatherUserMetrics(habits) {
    const todayStr = getTodayISO();
    const totalHabits = habits.length;
    const allDatesSet = new Set();
    const perDateCounts = {};

    let totalCompletions = 0;
    let waterCompletions = 0;
    let waterStreak = 0;
    let readingCompletions = 0;
    let sleepCompletions = 0;
    let sleepStreak = 0;
    let sugarCompletions = 0;
    let lifetimeXp = 0;

    habits.forEach((habit) => {
      const dates = Array.isArray(habit.completedDates)
        ? Array.from(new Set(habit.completedDates))
            .filter((d) => typeof d === "string" && d && d <= todayStr)
            .sort()
        : [];

      totalCompletions += dates.length;
      dates.forEach((d, idx) => {
        allDatesSet.add(d);
        perDateCounts[d] = (perDateCounts[d] || 0) + 1;
        lifetimeXp += 25 + Math.floor(idx / 2) * 5;
      });

      const nameLower = String(habit.name || "").toLowerCase();
      const iconLower = String(habit.icon || "").toLowerCase();

      if (nameLower.includes("water") || nameLower.includes("hydro") || iconLower === "water") {
        waterCompletions += dates.length;
        waterStreak = Math.max(waterStreak, computeSingleHabitStreak(dates));
      }

      if (nameLower.includes("read") || nameLower.includes("book") || iconLower === "book") {
        readingCompletions += dates.length;
      }

      if (nameLower.includes("sleep") || iconLower === "moon" || iconLower === "bed") {
        sleepCompletions += dates.length;
        sleepStreak = Math.max(sleepStreak, computeSingleHabitStreak(dates));
      }

      if (nameLower.includes("sugar") || iconLower === "leaf") {
        sugarCompletions += dates.length;
      }
    });

    const sortedAllDates = Array.from(allDatesSet).sort();
    const bestStreak = computeSingleHabitStreak(sortedAllDates);

    // Comeback: gap of >= 2 days between two completed dates
    let hasComeback = false;
    for (let i = 1; i < sortedAllDates.length; i++) {
      const prev = new Date(`${sortedAllDates[i - 1]}T00:00:00`);
      const curr = new Date(`${sortedAllDates[i]}T00:00:00`);
      if (Math.round((curr - prev) / 86400000) >= 2) {
        hasComeback = true;
        break;
      }
    }

    const dayCounts = Object.values(perDateCounts);
    const bestSingleDayCount = dayCounts.length ? Math.max(...dayCounts) : 0;
    const minPerfectTarget = Math.max(1, totalHabits);
    const perfectDaysCount =
      totalHabits > 0
        ? dayCounts.filter((count) => count >= minPerfectTarget).length
        : 0;

    const level = Math.min(100, Math.floor(lifetimeXp / 600) + 1);

    return {
      totalHabits,
      totalCompletions,
      bestStreak,
      waterCompletions,
      waterStreak,
      readingCompletions,
      sleepCompletions,
      sleepStreak,
      sugarCompletions,
      hasComeback,
      bestSingleDayCount,
      perfectDaysCount,
      level,
    };
  }

  function evaluateBadges(habits) {
    const metrics = gatherUserMetrics(habits);
    const unlockDates = loadUnlockDates();
    const todayStr = getTodayISO();
    let datesChanged = false;

    const evaluated = BADGE_DEFINITIONS.map((def) => {
      const rawCurrent = Math.max(0, Number(def.measure(metrics)) || 0);
      const current = Math.min(def.target, rawCurrent);
      const isUnlocked = current >= def.target;
      const pct = Math.min(100, Math.round((current / def.target) * 100));

      let status = "locked";
      if (isUnlocked) {
        status = "unlocked";
        if (!unlockDates[def.id]) {
          unlockDates[def.id] = todayStr;
          datesChanged = true;
        }
      } else {
        if (unlockDates[def.id]) {
          delete unlockDates[def.id];
          datesChanged = true;
        }
        status = current > 0 ? "in_progress" : "locked";
      }

      return {
        ...def,
        current,
        pct,
        status,
        unlockedDate: unlockDates[def.id] || null,
      };
    });

    if (datesChanged) {
      saveUnlockDates(unlockDates);
    }

    return evaluated;
  }

  function renderTopSection(badges) {
    if (els.currentDate) {
      els.currentDate.textContent = formatHeaderDate(new Date());
    }

    // Pick closest in-progress achievement, or first locked non-secret achievement
    const inProgress = badges
      .filter((b) => b.status === "in_progress")
      .sort((a, b) => b.pct - a.pct);
    const nextLocked = badges.filter((b) => b.status === "locked" && !b.secret);
    const featured = inProgress[0] || nextLocked[0] || badges[0];

    if (featured) {
      if (els.nextRing) {
        els.nextRing.style.setProperty("--ring-pct", `${featured.pct}%`);
      }
      if (els.nextIcon) {
        els.nextIcon.setAttribute("name", featured.icon);
      }
      if (els.nextTitle) {
        els.nextTitle.textContent = featured.title;
      }
      if (els.nextDesc) {
        els.nextDesc.textContent = featured.desc;
      }
      if (els.nextFraction) {
        els.nextFraction.textContent = `${featured.current} / ${featured.target} ${featured.unit}`;
      }
      if (els.nextRemaining) {
        const rem = Math.max(0, featured.target - featured.current);
        els.nextRemaining.textContent =
          rem === 0
            ? "Unlocked!"
            : `${rem} ${rem === 1 ? featured.unit.replace(/s$/, "") : featured.unit} to go`;
      }
      if (els.nextBar) {
        els.nextBar.style.width = `${featured.pct}%`;
        els.nextBar.parentElement?.setAttribute("aria-valuenow", String(featured.pct));
      }
      if (els.nextXp) {
        els.nextXp.textContent = `+${featured.xp} XP`;
      }
      if (els.nextTokens) {
        els.nextTokens.textContent = `+${featured.tokens} tokens`;
      }
    }

    // Collection summary
    const totalCount = badges.length;
    const unlockedCount = badges.filter((b) => b.status === "unlocked").length;
    const collectionPct =
      totalCount > 0 ? Math.round((unlockedCount / totalCount) * 100) : 0;

    if (els.collectionUnlocked) {
      els.collectionUnlocked.textContent = String(unlockedCount);
    }
    if (els.collectionTotal) {
      els.collectionTotal.textContent = String(totalCount);
    }
    if (els.collectionBar) {
      els.collectionBar.style.width = `${collectionPct}%`;
      els.collectionBar.parentElement?.setAttribute(
        "aria-valuenow",
        String(collectionPct)
      );
    }

    const byRarity = (rarity) => {
      const group = badges.filter((b) => b.rarity === rarity);
      const done = group.filter((b) => b.status === "unlocked").length;
      return `${done} / ${group.length}`;
    };

    if (els.rarityStarter) els.rarityStarter.textContent = byRarity("starter");
    if (els.rarityRare) els.rarityRare.textContent = byRarity("rare");
    if (els.rarityEpic) els.rarityEpic.textContent = byRarity("epic");
    if (els.rarityLegendary) els.rarityLegendary.textContent = byRarity("legendary");
  }

  function renderFilterCounts(badges) {
    const unlockedCount = badges.filter((b) => b.status === "unlocked").length;
    const progressCount = badges.filter((b) => b.status === "in_progress").length;
    const lockedCount = badges.filter((b) => b.status === "locked").length;

    if (els.filterAllBtn) els.filterAllBtn.textContent = `All ${badges.length}`;
    if (els.filterUnlockedBtn)
      els.filterUnlockedBtn.textContent = `Unlocked ${unlockedCount}`;
    if (els.filterProgressBtn)
      els.filterProgressBtn.textContent = `In progress ${progressCount}`;
    if (els.filterLockedBtn)
      els.filterLockedBtn.textContent = `Locked ${lockedCount}`;
  }

  function renderBadgesGrid(badges) {
    if (!els.grid) return;

    const filtered =
      activeFilter === "all"
        ? badges
        : badges.filter((b) => b.status === activeFilter);

    if (!filtered.length) {
      els.grid.innerHTML = `
        <div class="col-12">
          <div class="ach-panel text-center py-4 ach-muted-text">
            No achievements in this category yet. Keep tracking your habits!
          </div>
        </div>
      `;
      return;
    }

    els.grid.innerHTML = filtered
      .map((badge) => {
        const isUnlocked = badge.status === "unlocked";
        const isInProgress = badge.status === "in_progress";
        const isSecretLocked = Boolean(badge.secret && !isUnlocked);

        const displayTitle =
          badge.secret && isUnlocked && badge.revealedTitle
            ? badge.revealedTitle
            : badge.title;
        const displayDesc =
          badge.secret && isUnlocked && badge.revealedDesc
            ? badge.revealedDesc
            : badge.desc;
        const displayIcon = isSecretLocked ? "lock-closed-outline" : badge.icon;

        const accentVar =
          isUnlocked || isInProgress ? badge.accent : "rgba(155, 149, 142, 0.35)";

        let topRightHtml = "";
        if (isUnlocked) {
          topRightHtml = `<span class="badge-check-square" title="Unlocked"><ion-icon name="checkmark-outline"></ion-icon></span>`;
        } else if (isSecretLocked) {
          topRightHtml = `<span class="badge-secret-tag mono-text">SECRET</span>`;
        } else if (isInProgress) {
          topRightHtml = `<span class="badge-pct-tag mono-text">${badge.pct}%</span>`;
        }

        let bottomLeftHtml = "";
        if (isUnlocked) {
          const dateLabel = formatShortMonthDay(badge.unlockedDate);
          bottomLeftHtml = `<span class="badge-status-text">Unlocked ${escapeHtml(dateLabel)}</span>`;
        } else if (isInProgress) {
          bottomLeftHtml = `<span class="badge-status-text is-progress mono-text">${badge.current} / ${badge.target}</span>`;
        } else {
          bottomLeftHtml = `<span class="badge-status-text">Locked</span>`;
        }

        return `
          <div class="col-12 col-sm-6 col-xl-3">
            <article
              class="badge-card ${!isUnlocked && !isInProgress ? "is-locked" : ""}"
              style="--badge-accent: ${accentVar};"
            >
              <div>
                <div class="d-flex align-items-start justify-content-between mb-3">
                  <span class="badge-icon-box">
                    <ion-icon name="${displayIcon}"></ion-icon>
                  </span>
                  ${topRightHtml}
                </div>

                <h3 class="badge-title">${escapeHtml(displayTitle)}</h3>
                <p class="badge-desc">${escapeHtml(displayDesc)}</p>
              </div>

              <div>
                <div
                  class="progress badge-bar-track"
                  role="progressbar"
                  aria-valuenow="${badge.pct}"
                  aria-valuemin="0"
                  aria-valuemax="100"
                >
                  <div
                    class="progress-bar badge-bar-fill"
                    style="width: ${badge.pct}%"
                  ></div>
                </div>

                <div class="d-flex align-items-center justify-content-between">
                  ${bottomLeftHtml}
                  <span class="badge-xp-reward mono-text">+${badge.xp} XP</span>
                </div>
              </div>
            </article>
          </div>
        `;
      })
      .join("");

    if (window.ionicons) {
      window.ionicons.create();
    }
  }

  function render() {
    const habits = loadHabits();
    const badges = evaluateBadges(habits);

    renderTopSection(badges);
    renderFilterCounts(badges);
    renderBadgesGrid(badges);
  }

  function bindEvents() {
    els.filterButtons.forEach((btn) => {
      btn.addEventListener("click", () => {
        els.filterButtons.forEach((b) => b.classList.remove("is-active"));
        btn.classList.add("is-active");
        activeFilter = btn.dataset.filter || "all";
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
  Achievements.init();
});