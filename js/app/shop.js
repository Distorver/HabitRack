// Shop module - links token balance to earned level-ups, handles purchases & inventory

const Shop = (function () {
  const HABITS_STORAGE_KEY = "habitrack_habits";
  const SHOP_PURCHASES_KEY = "habitrack_shop_purchases";

  const XP_PER_LEVEL = 600;
  const MAX_LEVEL = 100;
  const TOKENS_PER_LEVEL_UP = 100;

  let activeCategory = "all";
  let statusMessage = null;

  const els = {
    currentDate: document.getElementById("shopCurrentDate"),
    tokensBalance: document.getElementById("shopTokensBalance"),
    currentLevel: document.getElementById("shopCurrentLevel"),
    xpToNext: document.getElementById("shopXpToNext"),
    levelFraction: document.getElementById("shopLevelFraction"),
    spentSummary: document.getElementById("shopSpentSummary"),
    levelBar: document.getElementById("shopLevelBar"),
    ownedCount: document.getElementById("shopOwnedCount"),
    totalItemsCount: document.getElementById("shopTotalItemsCount"),
    inventoryList: document.getElementById("shopInventoryList"),
    shieldCount: document.getElementById("shopShieldCount"),
    filterButtons: document.querySelectorAll(".shop-filter-btn[data-category]"),
    statusBanner: document.getElementById("shopStatusBanner"),
    grid: document.getElementById("shopGrid"),
  };

  const SHOP_ITEMS = [
    {
      id: "streak_freeze",
      title: "Streak Freeze",
      desc: "Protects your daily streak if you miss a day.",
      category: "protection",
      categoryLabel: "Protection",
      icon: "snow-outline",
      accent: "#9dd6ea",
      price: 50,
      stackable: true,
    },
    {
      id: "double_shield",
      title: "Twin Shield Pack",
      desc: "Adds 2 extra streak protection charges at once.",
      category: "protection",
      categoryLabel: "Protection",
      icon: "shield-checkmark-outline",
      accent: "#b8e3cb",
      price: 90,
      stackable: true,
    },
    {
      id: "xp_spark_boost",
      title: "Focus Spark (+50 XP)",
      desc: "Grants an immediate +50 bonus XP toward your next level.",
      category: "boosts",
      categoryLabel: "XP Boost",
      icon: "flash-outline",
      accent: "#ff5500",
      price: 60,
      stackable: true,
    },
    {
      id: "xp_surge_boost",
      title: "Momentum Surge (+150 XP)",
      desc: "Grants a +150 bonus XP push toward leveling up.",
      category: "boosts",
      categoryLabel: "XP Boost",
      icon: "rocket-outline",
      accent: "#d9c3eb",
      price: 150,
      stackable: true,
    },
    {
      id: "badge_flame_frame",
      title: "Ember Badge Frame",
      desc: "Unlocks a warm orange highlight style for your badges.",
      category: "cosmetics",
      categoryLabel: "Style",
      icon: "flame-outline",
      accent: "#ff5500",
      price: 80,
      stackable: false,
    },
    {
      id: "badge_pastel_frame",
      title: "Pastel Aura Frame",
      desc: "Unlocks a soft pastel ring accent on your profile badges.",
      category: "cosmetics",
      categoryLabel: "Style",
      icon: "color-palette-outline",
      accent: "#f3b5be",
      price: 80,
      stackable: false,
    },
    {
      id: "journal_note_perk",
      title: "Daily Reflection Tag",
      desc: "Adds a custom milestone note marker to your log.",
      category: "cosmetics",
      categoryLabel: "Style",
      icon: "sparkles-outline",
      accent: "#f9e1a6",
      price: 70,
      stackable: false,
    },
    {
      id: "master_crest",
      title: "Consistency Crest",
      desc: "Collector emblem proving your commitment to daily habits.",
      category: "cosmetics",
      categoryLabel: "Emblem",
      icon: "ribbon-outline",
      accent: "#d9c3eb",
      price: 120,
      stackable: false,
    },
    {
      id: "theme_pink",
      title: "Pink Blossom Theme",
      desc: "A soft pink color theme for the whole app. Free for everyone.",
      category: "themes",
      categoryLabel: "Theme",
      icon: "flower-outline",
      accent: "#ff9cc1",
      price: 0,
      stackable: false,
      theme: "pink",
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

  function loadPurchases() {
    try {
      const raw = localStorage.getItem(SHOP_PURCHASES_KEY);
      if (!raw) {
        return { spentTokens: 0, bonusXp: 0, items: {} };
      }
      const parsed = JSON.parse(raw);
      return {
        spentTokens: Number(parsed?.spentTokens) || 0,
        bonusXp: Number(parsed?.bonusXp) || 0,
        items:
          parsed?.items && typeof parsed.items === "object" ? parsed.items : {},
      };
    } catch (e) {
      return { spentTokens: 0, bonusXp: 0, items: {} };
    }
  }

  function savePurchases(state) {
    try {
      localStorage.setItem(SHOP_PURCHASES_KEY, JSON.stringify(state));
    } catch (e) {
      console.error("Failed to save shop purchases:", e);
    }
  }

  function getHabitDayXp(habit, dateStr, sortedDates) {
    if (typeof Data !== "undefined" && typeof Data.getCompletionXp === "function") {
      return Data.getCompletionXp(habit, dateStr);
    }
    const idx = sortedDates.indexOf(dateStr);
    if (idx === -1) return 0;
    return 25 + Math.floor(idx / 2) * 5;
  }

  function computeWalletState(habits, purchases) {
    const habitXp = habits.reduce((total, habit) => {
      const dates = Array.isArray(habit.completedDates)
        ? Array.from(new Set(habit.completedDates)).sort()
        : [];
      return (
        total + dates.reduce((sum, d) => sum + getHabitDayXp(habit, d, dates), 0)
      );
    }, 0);

    const lifetimeXp = habitXp + (Number(purchases.bonusXp) || 0);
    const rawLevel = Math.floor(lifetimeXp / XP_PER_LEVEL) + 1;
    const level = Math.min(MAX_LEVEL, Math.max(1, rawLevel));
    const isMaxLevel = level >= MAX_LEVEL;

    const currentLevelXp = isMaxLevel ? XP_PER_LEVEL : lifetimeXp % XP_PER_LEVEL;
    const xpToNextLevel = isMaxLevel ? 0 : XP_PER_LEVEL - currentLevelXp;
    const xpPercent = isMaxLevel
      ? 100
      : Math.min(100, Math.round((currentLevelXp / XP_PER_LEVEL) * 100));

    const earnedTokens = Math.max(0, level - 1) * TOKENS_PER_LEVEL_UP;
    const spentTokens = Math.max(0, Number(purchases.spentTokens) || 0);
    const availableTokens = Math.max(0, earnedTokens - spentTokens);

    return {
      level,
      isMaxLevel,
      currentLevelXp,
      xpToNextLevel,
      xpPercent,
      availableTokens,
      spentTokens,
    };
  }

  function renderWalletAndInventory(wallet, purchases) {
    if (els.currentDate) {
      els.currentDate.textContent = formatHeaderDate(new Date());
    }
    if (els.tokensBalance) {
      els.tokensBalance.textContent = String(wallet.availableTokens);
    }
    if (els.currentLevel) {
      els.currentLevel.textContent = String(wallet.level).padStart(2, "0");
    }
    if (els.xpToNext) {
      els.xpToNext.textContent = wallet.isMaxLevel
        ? "MAX LVL"
        : `${wallet.xpToNextLevel} XP`;
    }
    if (els.levelFraction) {
      els.levelFraction.textContent = `${wallet.currentLevelXp} / ${XP_PER_LEVEL} XP`;
    }
    if (els.spentSummary) {
      els.spentSummary.textContent = `Spent: ${wallet.spentTokens} tokens`;
    }
    if (els.levelBar) {
      els.levelBar.style.width = `${wallet.xpPercent}%`;
      els.levelBar.parentElement?.setAttribute(
        "aria-valuenow",
        String(wallet.xpPercent)
      );
    }

    const ownedEntries = SHOP_ITEMS.filter(
      (item) => (purchases.items[item.id] || 0) > 0
    );

    if (els.ownedCount) {
      els.ownedCount.textContent = String(ownedEntries.length);
    }
    if (els.totalItemsCount) {
      els.totalItemsCount.textContent = String(SHOP_ITEMS.length);
    }

    const shields =
      (purchases.items.streak_freeze || 0) +
      (purchases.items.double_shield || 0) * 2;
    if (els.shieldCount) {
      els.shieldCount.textContent = String(shields);
    }

    if (els.inventoryList) {
      if (!ownedEntries.length) {
        els.inventoryList.innerHTML = `<div class="shop-muted-text small">No items purchased yet.</div>`;
      } else {
        els.inventoryList.innerHTML = ownedEntries
          .map((item) => {
            const qty = purchases.items[item.id] || 0;
            return `
              <div class="shop-inv-pill">
                <span class="shop-inv-name">${escapeHtml(item.title)}</span>
                <span class="shop-inv-qty mono-text">x${qty}</span>
              </div>
            `;
          })
          .join("");
      }
    }
  }

  function renderStatusBanner() {
    if (!els.statusBanner) return;

    if (!statusMessage) {
      els.statusBanner.className = "shop-status-banner d-none mb-3";
      els.statusBanner.textContent = "";
      return;
    }

    els.statusBanner.className = `shop-status-banner mb-3 is-${statusMessage.type}`;
    els.statusBanner.textContent = statusMessage.text;
  }

  function renderShopGrid(wallet, purchases) {
    if (!els.grid) return;

    const activeTheme = document.documentElement.dataset.theme || "dark";
    const visibleItems =
      activeCategory === "all"
        ? SHOP_ITEMS
        : SHOP_ITEMS.filter((item) => item.category === activeCategory);

    els.grid.innerHTML = visibleItems
      .map((item) => {
        const ownedQty = purchases.items[item.id] || 0;
        const alreadyOwnedUnique = !item.stackable && ownedQty > 0;
        const canAfford = wallet.availableTokens >= item.price;
        const disabled = alreadyOwnedUnique || !canAfford;
        const isTheme = Boolean(item.theme);
        const isActiveTheme = isTheme && activeTheme === item.theme;

        let actionHtml = "";
        if (isActiveTheme) {
          actionHtml = `<span class="shop-owned-tag"><ion-icon name="checkmark-outline"></ion-icon> Applied</span>`;
        } else if (isTheme) {
          actionHtml = `
            <button
              type="button"
              class="btn shop-buy-btn"
              data-apply-theme="${escapeHtml(item.theme)}"
            >
              Apply
            </button>
          `;
        } else if (alreadyOwnedUnique) {
          actionHtml = `<span class="shop-owned-tag"><ion-icon name="checkmark-outline"></ion-icon> Owned</span>`;
        } else {
          actionHtml = `
            <button
              type="button"
              class="btn shop-buy-btn"
              data-buy-id="${escapeHtml(item.id)}"
              ${disabled ? "disabled" : ""}
            >
              ${canAfford ? "Buy item" : "Need tokens"}
            </button>
          `;
        }

        return `
          <div class="col-12 col-sm-6 col-xl-3">
            <article class="shop-item-card" style="--item-accent: ${item.accent};">
              <div>
                <div class="d-flex align-items-center justify-content-between mb-3">
                  <span class="shop-item-icon">
                    <ion-icon name="${item.icon}"></ion-icon>
                  </span>
                  <span class="shop-category-tag mono-text">${escapeHtml(item.categoryLabel)}</span>
                </div>

                <h3 class="shop-item-title">${escapeHtml(item.title)}</h3>
                <p class="shop-item-desc">${escapeHtml(item.desc)}</p>
              </div>

              <div class="d-flex align-items-center justify-content-between pt-2 shop-divider">
                <span class="shop-price-text mono-text">
                  ${item.price === 0 ? "Free" : `${item.price} tokens`}
                </span>
                ${actionHtml}
              </div>
            </article>
          </div>
        `;
      })
      .join("");

    els.grid.querySelectorAll("[data-buy-id]").forEach((btn) => {
      btn.addEventListener("click", handlePurchase);
    });

    els.grid.querySelectorAll("[data-apply-theme]").forEach((btn) => {
      btn.addEventListener("click", handleApplyTheme);
    });

    if (window.ionicons) {
      window.ionicons.create();
    }
  }

  function handlePurchase(event) {
    const itemId = event.currentTarget.dataset.buyId;
    const item = SHOP_ITEMS.find((i) => i.id === itemId);
    if (!item) return;

    const habits = loadHabits();
    const purchases = loadPurchases();
    const wallet = computeWalletState(habits, purchases);

    const currentQty = purchases.items[item.id] || 0;
    if (!item.stackable && currentQty > 0) {
      statusMessage = {
        type: "error",
        text: `You already own "${item.title}".`,
      };
      render();
      return;
    }

    if (wallet.availableTokens < item.price) {
      statusMessage = {
        type: "error",
        text: `Not enough tokens for "${item.title}". Reach a new level in Your Progress to earn +100 tokens.`,
      };
      render();
      return;
    }

    purchases.spentTokens = (Number(purchases.spentTokens) || 0) + item.price;
    purchases.items[item.id] = currentQty + 1;

    if (item.id === "xp_spark_boost") {
      purchases.bonusXp = (Number(purchases.bonusXp) || 0) + 50;
    } else if (item.id === "xp_surge_boost") {
      purchases.bonusXp = (Number(purchases.bonusXp) || 0) + 150;
    }

    savePurchases(purchases);
    statusMessage = {
      type: "success",
      text: `Purchased "${item.title}" for ${item.price} tokens!`,
    };
    render();
  }

  function handleApplyTheme(event) {
    const theme = event.currentTarget.dataset.applyTheme;
    const item = SHOP_ITEMS.find((shopItem) => shopItem.theme === theme);
    if (typeof Profile === "undefined") return;

    statusMessage = {
      type: "success",
      text: `Applied "${item?.title || "theme"}".`,
    };
    Profile.applyTheme(theme, true);
    render();
  }

  function render() {
    const habits = loadHabits();
    const purchases = loadPurchases();
    const wallet = computeWalletState(habits, purchases);

    renderWalletAndInventory(wallet, purchases);
    renderStatusBanner();
    renderShopGrid(wallet, purchases);
  }

  function bindEvents() {
    els.filterButtons.forEach((btn) => {
      btn.addEventListener("click", () => {
        els.filterButtons.forEach((b) => b.classList.remove("is-active"));
        btn.classList.add("is-active");
        activeCategory = btn.dataset.category || "all";
        statusMessage = null;
        render();
      });
    });

    window.addEventListener("storage", (event) => {
      if (
        event.key === HABITS_STORAGE_KEY ||
        event.key === SHOP_PURCHASES_KEY
      ) {
        render();
      }
    });

    document.addEventListener("habitrack:themechange", render);

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
  Shop.init();
});