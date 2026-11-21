
// ===== 1. تلوين اللينك النشط وقت السكرول =====
const links = document.querySelectorAll('.nav-link');
const pages = document.querySelectorAll('.page');
const observer = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      links.forEach(l =>
        l.classList.toggle('active', l.getAttribute('href') === '#' + entry.target.id)
      );
    }
  });
}, { rootMargin: '-45% 0px -45% 0px' });

pages.forEach(p => observer.observe(p));

// ===== 2. الثوابت والتخزين =====
const XP_PER_GOAL = 25;
const START_Xp =100;
const XP_PER_LEVEL = 600;
const TOKENS_PER_LEVEL = 100;
const HABIT_COLORS = { sugar: '#a8d8f0', hydration: '#f4a9b8', sleep: '#cdb4e6', reading: '#f8c9a3' };
const STORAGE_KEY = 'habitrack-habits';

let habits = JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
let range = 7;   // بيتغير بالـ Toggle

function save() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(habits));
}

// تاريخ بصيغة 2026-11-21 (0 = النهارده، 1 = امبارح ...)
function dateKey(daysAgo = 0) {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  return d.toLocaleDateString('en-CA');
}

// ===== 3. بناء كارت العادة =====
const grid = document.getElementById('habits-grid');
function createCard(h) {
  const card = document.createElement('article');
  card.className = `card habit-card shape-${h.shape || 'square'}`;
  card.style.setProperty('--habit-color', habitColor(h));
  card.dataset.id = h.id;

  const doneToday = !!h.log[dateKey(0)];

  card.innerHTML = `
    <div class="habit-top">
      <span class="habit-icon"></span>
      <div class="habit-info">
        <div class="habit-name"></div>
        <div class="habit-goal"></div>
      </div>
      <button class="habit-check ${doneToday ? 'done' : ''}">✓</button>
      <button class="habit-delete">×</button>
    </div>
    <div>
      <div class="habit-label">Last ${range} Days</div>
      <div class="week"></div>
    </div>`;

  card.querySelector('.habit-icon').textContent = h.icon || h.name[0].toUpperCase();
  card.querySelector('.habit-name').textContent = h.name;
  card.querySelector('.habit-goal').textContent = h.goal;

  const check = card.querySelector('.habit-check');
  check.setAttribute('aria-label', `Mark ${h.name} done today`);
  check.setAttribute('aria-pressed', doneToday);
  card.querySelector('.habit-delete').setAttribute('aria-label', `Delete ${h.name}`);

  const week = card.querySelector('.week');
  week.classList.toggle('month', range === 30);
  for (let i = range - 1; i >= 0; i--) {
    const day = document.createElement('span');
    day.className = 'day' + (h.log[dateKey(i)] ? ' done' : '');
    week.appendChild(day);
  }
  return card;
}
// function createCard(h) {
//   const card = document.createElement('article');
//   card.className = `card habit-card ${h.color}`;
//   card.dataset.id = h.id;

//   const doneToday = !!h.log[dateKey(0)];

//   card.innerHTML = `
//     <div class="habit-top">
//       <span class="habit-icon"></span>
//       <div class="habit-info">
//         <div class="habit-name"></div>
//         <div class="habit-goal"></div>
//       </div>
//       <button class="habit-check ${doneToday ? 'done' : ''}" aria-label="Mark done">✓</button>
//       <button class="habit-delete" aria-label="Delete habit">×</button>
//     </div>
//     <div>
//       <div class="habit-label">Last ${range} Days</div>
//       <div class="week"></div>
//     </div>`;

//   card.querySelector('.habit-icon').textContent = h.name[0].toUpperCase();
//   card.querySelector('.habit-name').textContent = h.name;
//   card.querySelector('.habit-goal').textContent = h.goal;

//   const week = card.querySelector('.week');
//   week.classList.toggle('month', range === 30);
//   for (let i = range - 1; i >= 0; i--) {
//     const day = document.createElement('span');
//     day.className = 'day' + (h.log[dateKey(i)] ? ' done' : '');
//     week.appendChild(day);
//   }
//   return card;
// }

// ===== 4. الإحصائيات (Streak و Completion) =====
function updateStats() {
  const anyDone = (i) => habits.some(h => h.log[dateKey(i)]);
  let streak = 0;
  let i = anyDone(0) ? 0 : 1;
  while (anyDone(i)) { streak++; i++; }

  let done = 0;
  for (let d = 0; d < range; d++) {
    habits.forEach(h => { if (h.log[dateKey(d)]) done++; });
  }

  const total = habits.length * range;
  const pct = total ? Math.round((done / total) * 100) : 0;

  document.getElementById('streak-value').textContent =
    `${streak} ${streak === 1 ? 'Day' : 'Days'}`;
  document.getElementById('completion-value').textContent = `${pct}%`;
}

// ===== 5. المستوى و XP و Tokens =====
function updateLevel() {
  const goals = habits.reduce((n, h) => n + Object.keys(h.log).length, 0);
  const bonus = rewardTotals();
  const total = START_Xp + goals * XP_PER_GOAL + bonus.xp;
  const level = Math.floor(total / XP_PER_LEVEL) + 1;
  const xp = total % XP_PER_LEVEL;
  const pad = (n) => String(n).padStart(2, '0');

  document.getElementById('level-num').textContent = pad(level);
  document.getElementById('next-level').textContent = `Level ${pad(level + 1)}`;
  document.getElementById('xp-text').textContent = `${xp} / ${XP_PER_LEVEL} XP`;
  document.getElementById('xp-left').textContent = XP_PER_LEVEL - xp;
  document.getElementById('xp-total').textContent = total.toLocaleString();
  document.getElementById('xp-fill').style.width = `${(xp / XP_PER_LEVEL) * 100}%`;
  document.getElementById('ring-fg').setAttribute('stroke-dasharray', `${(xp / XP_PER_LEVEL) * 100} 100`);
  document.getElementById('tokens-value').textContent = tokenBalance().toLocaleString();
  document.getElementById('tokens-next-level').textContent = pad(level + 1);
}

// ===== 6. كارت Keep it going =====
function updateKeepGoing() {
  const key = dateKey(0);
  const done = habits.filter(h => h.log[key]).length;
  const left = habits.length - done;

  const title = document.getElementById('keep-title');
  const text = document.getElementById('keep-text');
  const xp = document.getElementById('keep-xp');

  if (habits.length === 0) {
    title.textContent = 'No habits yet.';
    text.textContent = 'Add your first habit to start earning XP.';
    xp.textContent = '';
  } else if (left === 0) {
    title.textContent = 'All done for today.';
    text.textContent = 'Every goal is reached. See you tomorrow.';
    xp.textContent = '';
  } else {
    title.textContent = done === 0
      ? 'Start with one small win.'
      : `${done} ${done === 1 ? 'win' : 'wins'} already today.`;
    text.textContent = `${left} more ${left === 1 ? 'habit' : 'habits'} to reach today's goals.`;
    xp.textContent = `${left} more ${left === 1 ? 'goal' : 'goals'} = +${left * XP_PER_GOAL} XP`;
  }
}

// ===== 7. الشارت الأسبوعي =====
function updateWeekChart() {
  const chart = document.getElementById('week-chart');
  const legend = document.getElementById('week-legend');
  chart.innerHTML = '';
  legend.innerHTML = '';

  const n = habits.length;

  let thisWeek = 0, lastWeek = 0;
  for (let i = 0; i < 7; i++) {
    habits.forEach(h => {
      if (h.log[dateKey(i)]) thisWeek++;
      if (h.log[dateKey(i + 7)]) lastWeek++;
    });
  }
  const diff = (thisWeek - lastWeek) * XP_PER_GOAL;

  document.getElementById('week-xp').textContent = `${thisWeek * XP_PER_GOAL} XP`;
  document.getElementById('week-diff').textContent =
    `${diff >= 0 ? '+' : ''}${diff} vs. last week`;
  document.getElementById('week-goals').textContent =
    `${thisWeek} of ${n * 7} goals reached`;
  chart.setAttribute('aria-label', `${thisWeek} of ${n * 7} goals reached this week`);

  if (n === 0) {
    const p = document.createElement('p');
    p.className = 'week-empty';
    p.textContent = 'Add a habit to see your week here.';
    chart.appendChild(p);
    return;
  }

  for (let i = 6; i >= 0; i--) {
    const col = document.createElement('div');
    col.className = 'week-col';

    const bar = document.createElement('div');
    bar.className = 'week-bar';
    habits.forEach(h => {
      if (h.log[dateKey(i)]) {
        const seg = document.createElement('span');
        // seg.className = `seg ${h.color}`;
        seg.className = 'sag';
        seg.style.backgroundColor = habitColor(h);
        seg.style.height = `${100 / n}%`;
        bar.appendChild(seg);
      }
    });

    const d = new Date();
    d.setDate(d.getDate() - i);
    const label = document.createElement('span');
    label.className = 'week-day' + (i === 0 ? ' today' : '');
    label.textContent = i === 0 ? 'Today' : d.toLocaleDateString('en-US', { weekday: 'short' });

    col.append(bar, label);
    chart.appendChild(col);
  }

  habits.forEach(h => {
    const item = document.createElement('span');
    item.style.setProperty('--c', habitColor(h));
    item.textContent = h.name;
    legend.appendChild(item);
  });
}
// ===== Streak لكل عادة، والـ Streak العام =====
function habitStreak(h) {
  let i = h.log[dateKey(0)] ? 0 : 1;   // لو لسه ما علمتش النهارده، العد من امبارح
  let s = 0;
  while (h.log[dateKey(i)]) { s++; i++; }
  return s;
}

function globalStreak() {
  const anyDone = (i) => habits.some(h => h.log[dateKey(i)]);
  let i = anyDone(0) ? 0 : 1;
  let s = 0;
  while (anyDone(i)) { s++; i++; }
  return s;
}

// ===== جدول Every habit adds up =====
function updateTable() {
  const box = document.getElementById('habit-rows');
  box.innerHTML = `
    <div class="habit-row head">
      <span>Habit</span>
      <span class="row-week-label row-week">Last 7 days</span>
      <span>Streak</span>
      <span>Today</span>
    </div>`;

  let done = 0;
  habits.forEach(h => {
    const row = document.createElement('div');
    // row.className = `habit-row ${h.color}`;
    row.className = `habit-row shape-${h.shape || 'square'}`;
    row.style.setProperty('--habit-color', habitColor(h));


    const name = document.createElement('span');
    name.className = 'row-name';
    name.textContent = h.name;
    const goal = document.createElement('small');
    goal.textContent = h.goal;
    name.appendChild(goal);

    const week = document.createElement('span');
    week.className = 'row-week';
    for (let i = 6; i >= 0; i--) {
      const m = document.createElement('span');
      const ok = !!h.log[dateKey(i)];
      if (ok) done++;
      m.className = 'mini' + (ok ? ' done' : '');
      week.appendChild(m);
    }

    const s = habitStreak(h);
    const streak = document.createElement('span');
    streak.textContent = `${s} ${s === 1 ? 'day' : 'days'}`;

    const today = document.createElement('span');
    const doneToday = !!h.log[dateKey(0)];
    today.className = 'row-today' + (doneToday ? ' done' : '');
    today.textContent = doneToday ? 'Goal reached' : '—';

    row.append(name, week, streak, today);
    box.appendChild(row);
  });

  const total = habits.length * 7;
  const pct = total ? Math.round((done / total) * 100) : 0;
  document.getElementById('table-pct').textContent = `${pct}% completed this week`;
}

// ===== Little milestones =====
function updateMilestones() {
  const goals = habits.reduce((n, h) => n + Object.keys(h.log).length, 0);
  const streak = globalStreak();

  const items = [
    { title: 'The first step', desc: 'Reach your first goal.', value: Math.min(goals, 1), max: 1, unit: 'goal' },
    { title: 'One week stronger', desc: 'Hit a goal every day for 7 days.', value: Math.min(streak, 7), max: 7, unit: 'days' },
    { title: 'Two weeks of you', desc: 'Reach a 14 day activity streak.', value: Math.min(streak, 14), max: 14, unit: 'days' }
  ];

  const list = document.getElementById('milestones');
  list.innerHTML = '';

  items.forEach(it => {
    const unlocked = it.value >= it.max;
    const li = document.createElement('li');
    li.className = 'milestone' + (unlocked ? ' unlocked' : '');

    const title = document.createElement('span');
    title.className = 'milestone-title';
    title.textContent = it.title;

    const desc = document.createElement('small');
    desc.textContent = unlocked ? 'Unlocked' : it.desc;

    li.append(title, desc);

    if (!unlocked) {
      const count = document.createElement('div');
      count.className = 'milestone-count';
      count.innerHTML = '<span></span><span></span>';
      count.children[0].textContent = `${it.value} / ${it.max} ${it.unit}`;
      count.children[1].textContent = `${it.max - it.value} to go`;

      const bar = document.createElement('div');
      bar.className = 'progress-bar';
      bar.innerHTML = '<div class="progress-fill"></div>';
      bar.firstChild.style.width = `${(it.value / it.max) * 100}%`;

      li.append(count, bar);
    }
    list.appendChild(li);
  });
}


// ===== الإنجازات =====
const RARITIES = ['Starter', 'Rare', 'Epic', 'Legendary'];

const ACHIEVEMENTS = [
  { title: 'The first step', desc: 'Reach your first habit goal.', rarity: 'Starter', xp: 25, max: 1, value: s => s.goals },
  { title: 'Habit builder', desc: 'Build 3 habits.', rarity: 'Starter', xp: 25, max: 3, value: s => s.habits },
  { title: 'One week stronger', desc: 'Hit a goal every day for 7 days.', rarity: 'Starter', xp: 50, max: 7, value: s => s.streak },
  { title: 'Thirty wins', desc: 'Reach 30 goals in total.', rarity: 'Starter', xp: 75, max: 30, value: s => s.goals },
  { title: 'Two weeks of you', desc: 'Reach any habit goal for 14 days in a row.', rarity: 'Rare', xp: 150, tokens: 50, max: 14, value: s => s.streak },
  { title: 'Perfect day', desc: 'Reach 3 goals in a single day.', rarity: 'Rare', xp: 100, tokens: 50, max: 3, value: s => s.bestDay },
  { title: 'A month of you', desc: 'Keep a 30 day streak.', rarity: 'Epic', xp: 300, tokens: 100, max: 30, value: s => s.streak },
  { title: 'Three weeks, no excuses', desc: 'Keep a 21 day streak.', rarity: 'Epic', xp: 200, tokens: 100, max: 21, value: s => s.streak, secret: true },
  { title: 'The century', desc: 'Reach 100 goals in total.', rarity: 'Legendary', xp: 500, tokens: 200, max: 100, value: s => s.goals }
]; const UNLOCK_KEY = 'habitrack-unlocked';
let unlocked = JSON.parse(localStorage.getItem(UNLOCK_KEY)) || {};   // { "The first step": "2026-11-21" }
let booting = true;       // أول تشغيل: بنسجل من غير Toast
let achFilter = 'all';

function fmtDate(key) {
  return new Date(key + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: '2-digit' });
}

// أرقام بنقيس عليها كل الإنجازات
function achievementStats() {
  const perDay = {};
  habits.forEach(h => Object.keys(h.log).forEach(d => { perDay[d] = (perDay[d] || 0) + 1; }));
  const counts = Object.values(perDay);
  return {
    goals: counts.reduce((a, b) => a + b, 0),
    streak: globalStreak(),
    habits: habits.length,
    bestDay: Math.max(0, ...counts)
  };
}

// Toast
let toastTimer;
function showToast(msg) {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.remove('show'), 3500);
}

// بيسجل أي إنجاز اتحقق لأول مرة (بتاريخ النهارده)
function syncAchievements() {
  const s = achievementStats();
  const fresh = ACHIEVEMENTS.filter(a => !unlocked[a.title] && a.value(s) >= a.max);
  if (fresh.length === 0) return;

  fresh.forEach(a => { unlocked[a.title] = dateKey(0); });
  localStorage.setItem(UNLOCK_KEY, JSON.stringify(unlocked));

  if (!booting) {
    const xp = fresh.reduce((n, a) => n + a.xp, 0);
    showToast(`Achievement unlocked: ${fresh.map(a => a.title).join(', ')} (+${xp} XP)`);
  }
}

// مجموع مكافآت الإنجازات المفتوحة
function rewardTotals() {
  let xp = 0, tokens = 0;
  ACHIEVEMENTS.forEach(a => {
    if (unlocked[a.title]) { xp += a.xp; tokens += a.tokens || 0; }
  });
  return { xp, tokens };
}

function updateAchievements() {
  const s = achievementStats();

  const list = ACHIEVEMENTS.map(a => {
    const done = !!unlocked[a.title];
    const value = done ? a.max : Math.min(a.value(s), a.max);
    let status = done ? 'unlocked' : value > 0 ? 'progress' : 'locked';
    if (a.secret && !done) status = 'locked';
    return { ...a, value, status, date: unlocked[a.title] };
  });

  // --- Next achievement: الأقرب للاكتمال ---
  const next = list
    .filter(a => a.status === 'progress')
    .sort((a, b) => b.value / b.max - a.value / a.max)[0]
    || list.find(a => a.status === 'locked' && !a.secret);

  if (next) {
    document.getElementById('next-title').textContent = next.title;
    document.getElementById('next-desc').textContent = next.desc;
    document.getElementById('next-count').textContent = `${next.value} / ${next.max}`;
    document.getElementById('next-left').textContent = `${next.max - next.value} to go`;
    document.getElementById('next-fill').style.width = `${(next.value / next.max) * 100}%`;
    document.getElementById('next-rewards').innerHTML =
      `<span class="reward">+${next.xp} XP</span>` +
      (next.tokens ? `<span class="reward">+${next.tokens} tokens</span>` : '');
  } else {
    document.getElementById('next-title').textContent = 'Every badge unlocked.';
    document.getElementById('next-desc').textContent = 'You collected them all.';
    document.getElementById('next-count').textContent = '';
    document.getElementById('next-left').textContent = '';
    document.getElementById('next-fill').style.width = '100%';
    document.getElementById('next-rewards').innerHTML = '';
  }

  // --- Collection ---
  const got = list.filter(a => a.status === 'unlocked').length;
  document.getElementById('col-unlocked').textContent = got;
  document.getElementById('col-total').textContent = list.length;
  document.getElementById('col-fill').style.width = `${(got / list.length) * 100}%`;

  document.getElementById('rarity-list').innerHTML = RARITIES.map(r => {
    const all = list.filter(a => a.rarity === r);
    const n = all.filter(a => a.status === 'unlocked').length;
    return `<li class="r-${r.toLowerCase()}"><span class="rar-name">${r}</span><span>${n} / ${all.length}</span></li>`;
  }).join('');

  // --- الشبكة ---
  const box = document.getElementById('ach-grid');
  box.innerHTML = '';
  const shown = list.filter(a => achFilter === 'all' || a.status === achFilter);

  if (shown.length === 0) {
    box.innerHTML = '<p class="empty">Nothing here yet. Keep showing up.</p>';
    return;
  }

  shown.forEach(a => {
    const hidden = a.secret && a.status !== 'unlocked';
    const pct = Math.round((a.value / a.max) * 100);
    const badge = hidden ? 'SECRET' : a.status === 'unlocked' ? '✓' : a.status === 'progress' ? `${pct}%` : '';
    const foot = a.status === 'unlocked' ? `Unlocked ${fmtDate(a.date)}`
      : a.status === 'progress' ? `${a.value} / ${a.max}` : 'Locked';

    const card = document.createElement('article');
    card.className = `card ach-card ${a.status} r-${a.rarity.toLowerCase()}`;
    // innerHTML آمن هنا: البيانات من الثوابت مش من كتابة المستخدم
    card.innerHTML = `
      <div class="ach-row">
        <span class="ach-icon">${hidden ? '🔒' : '★'}</span>
        <span class="ach-badge">${badge}</span>
      </div>
      <div class="ach-title">${hidden ? 'Secret achievement' : a.title}</div>
      <p class="ach-desc">${hidden ? 'Keep showing up to reveal this one.' : a.desc}</p>
      ${hidden ? '' : `<div class="progress-bar"><div class="progress-fill" style="width:${pct}%"></div></div>`}
      <div class="ach-foot"><span>${foot}</span><span>+${a.xp} XP</span></div>`;
    box.appendChild(card);
  });
}

// فلتر All / Unlocked / In progress / Locked
const filterBtns = document.querySelectorAll('#ach-filter .toggle-btn');
filterBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    filterBtns.forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    achFilter = btn.dataset.filter;
    updateAchievements();
  });
});
// ===== Shop =====
const SHOP_KEY = 'habitrack-shop';
const SHOP_ITEMS = [
  { id: 'ember', name: 'Ember', color: '#ff5a1f', price: 0 },
  { id: 'ocean', name: 'Ocean', color: '#2f7de1', price: 50 },
  { id: 'mint', name: 'Mint', color: '#1a9462', price: 50 },
  { id: 'violet', name: 'Violet', color: '#8b5cf6', price: 100 },
  { id: 'rose', name: 'Rose', color: '#e0457b', price: 100 }
];

let shop = JSON.parse(localStorage.getItem(SHOP_KEY)) || { owned: ['ember'], active: 'ember' };

function saveShop() {
  localStorage.setItem(SHOP_KEY, JSON.stringify(shop));
}

function applyTheme() {
  const item = SHOP_ITEMS.find(i => i.id === shop.active) || SHOP_ITEMS[0];
  document.documentElement.style.setProperty('--accent', item.color);
}

// الرصيد = اللي كسبته - اللي صرفته
function earnedTokens() {
  const goals = habits.reduce((n, h) => n + Object.keys(h.log).length, 0);
  const bonus = rewardTotals();
  const level = Math.floor(( START_Xp + goals * XP_PER_GOAL + bonus.xp) / XP_PER_LEVEL) + 1;
  return (level - 1) * TOKENS_PER_LEVEL + bonus.tokens;
}

function spentTokens() {
  return SHOP_ITEMS.filter(i => shop.owned.includes(i.id)).reduce((n, i) => n + i.price, 0);
}

function tokenBalance() {
  return Math.max(0, earnedTokens() - spentTokens());
}

function updateShop() {
  const box = document.getElementById('shop-grid');
  const balance = tokenBalance();
  box.innerHTML = '';
  document.getElementById('shop-tokens').textContent = balance.toLocaleString();

  SHOP_ITEMS.forEach(item => {
    const owned = shop.owned.includes(item.id);
    const active = shop.active === item.id;

    const card = document.createElement('article');
    card.className = 'card shop-item' + (active ? ' active' : '');
    card.dataset.id = item.id;
    // innerHTML آمن هنا: البيانات من الثوابت مش من كتابة المستخدم
    card.innerHTML = `
      <span class="swatch" style="background:${item.color}"></span>
      <div class="shop-name">${item.name}</div>
      <div class="shop-price">${owned ? 'Owned' : item.price + ' tokens'}</div>
      <button class="btn-secondary shop-btn"></button>`;

    const btn = card.querySelector('.shop-btn');
    btn.textContent = active ? 'Equipped' : owned ? 'Equip' : `Buy · ${item.price}`;
    btn.disabled = active || (!owned && balance < item.price);
    box.appendChild(card);
  });
}

document.getElementById('shop-grid').addEventListener('click', (e) => {
  const btn = e.target.closest('.shop-btn');
  if (!btn || btn.disabled) return;

  const item = SHOP_ITEMS.find(i => i.id === btn.closest('.shop-item').dataset.id);

  if (!shop.owned.includes(item.id)) {
    if (tokenBalance() < item.price) return;
    shop.owned.push(item.id);
    showToast(`${item.name} theme unlocked`);
  }
  shop.active = item.id;
  saveShop();
  applyTheme();
  render();
});
// let achFilter = 'all';

// // أرقام بنقيس عليها كل الإنجازات (بتستخدم globalStreak من جزء الجدول)
// function achievementStats() {
//   const perDay = {};
//   habits.forEach(h => Object.keys(h.log).forEach(d => { perDay[d] = (perDay[d] || 0) + 1; }));
//   const counts = Object.values(perDay);
//   return {
//     goals: counts.reduce((a, b) => a + b, 0),
//     streak: globalStreak(),
//     habits: habits.length,
//     bestDay: Math.max(0, ...counts)
//   };
// }

// function updateAchievements() {
//   const s = achievementStats();

//   // حالة كل إنجاز: unlocked / progress / locked
//   const list = ACHIEVEMENTS.map(a => {
//     const value = Math.min(a.value(s), a.max);
//     let status = value >= a.max ? 'unlocked' : value > 0 ? 'progress' : 'locked';
//     if (a.secret && status !== 'unlocked') status = 'locked';
//     return { ...a, value, status };
//   });

//   // --- Next achievement: الأقرب للاكتمال ---
//   const next = list
//     .filter(a => a.status === 'progress')
//     .sort((a, b) => b.value / b.max - a.value / a.max)[0]
//     || list.find(a => a.status === 'locked' && !a.secret);

//   if (next) {
//     document.getElementById('next-title').textContent = next.title;
//     document.getElementById('next-desc').textContent = next.desc;
//     document.getElementById('next-count').textContent = `${next.value} / ${next.max}`;
//     document.getElementById('next-left').textContent = `${next.max - next.value} to go`;
//     document.getElementById('next-fill').style.width = `${(next.value / next.max) * 100}%`;
//     document.getElementById('next-rewards').innerHTML =
//       `<span class="reward">+${next.xp} XP</span>` +
//       (next.tokens ? `<span class="reward">+${next.tokens} tokens</span>` : '');
//   } else {
//     document.getElementById('next-title').textContent = 'Every badge unlocked.';
//     document.getElementById('next-desc').textContent = 'You collected them all.';
//     document.getElementById('next-count').textContent = '';
//     document.getElementById('next-left').textContent = '';
//     document.getElementById('next-fill').style.width = '100%';
//     document.getElementById('next-rewards').innerHTML = '';
//   }

//   // --- Collection ---
//   const unlocked = list.filter(a => a.status === 'unlocked').length;
//   document.getElementById('col-unlocked').textContent = unlocked;
//   document.getElementById('col-total').textContent = list.length;
//   document.getElementById('col-fill').style.width = `${(unlocked / list.length) * 100}%`;

//   document.getElementById('rarity-list').innerHTML = RARITIES.map(r => {
//     const all = list.filter(a => a.rarity === r);
//     const got = all.filter(a => a.status === 'unlocked').length;
//     return `<li class="r-${r.toLowerCase()}"><span class="rar-name">${r}</span><span>${got} / ${all.length}</span></li>`;
//   }).join('');

//   // --- الشبكة ---
//   const box = document.getElementById('ach-grid');
//   box.innerHTML = '';
//   const shown = list.filter(a => achFilter === 'all' || a.status === achFilter);

//   if (shown.length === 0) {
//     box.innerHTML = '<p class="empty">Nothing here yet. Keep showing up.</p>';
//     return;
//   }

//   shown.forEach(a => {
//     const hidden = a.secret && a.status !== 'unlocked';
//     const pct = Math.round((a.value / a.max) * 100);
//     const badge = hidden ? 'SECRET' : a.status === 'unlocked' ? '✓' : a.status === 'progress' ? `${pct}%` : '';
//     const foot = a.status === 'unlocked' ? 'Unlocked' : a.status === 'progress' ? `${a.value} / ${a.max}` : 'Locked';

//     const card = document.createElement('article');
//     card.className = `card ach-card ${a.status} r-${a.rarity.toLowerCase()}`;
//     // innerHTML آمن هنا: البيانات من الثوابت اللي فوق مش من كتابة المستخدم
//     card.innerHTML = `
//       <div class="ach-row">
//         <span class="ach-icon">${hidden ? '🔒' : '★'}</span>
//         <span class="ach-badge">${badge}</span>
//       </div>
//       <div class="ach-title">${hidden ? 'Secret achievement' : a.title}</div>
//       <p class="ach-desc">${hidden ? 'Keep showing up to reveal this one.' : a.desc}</p>
//       ${hidden ? '' : `<div class="progress-bar"><div class="progress-fill" style="width:${pct}%"></div></div>`}
//       <div class="ach-foot"><span>${foot}</span><span>+${a.xp} XP</span></div>`;
//     box.appendChild(card);
//   });
// }

// // فلتر All / Unlocked / In progress / Locked
// const filterBtns = document.querySelectorAll('#ach-filter .toggle-btn');
// filterBtns.forEach(btn => {
//   btn.addEventListener('click', () => {
//     filterBtns.forEach(b => b.classList.remove('active'));
//     btn.classList.add('active');
//     achFilter = btn.dataset.filter;
//     updateAchievements();
//   });
// });
// ===== 8. الرسم الرئيسي =====
function render() {
  syncAchievements();
  grid.innerHTML = '';
  habits.forEach(h => grid.appendChild(createCard(h)));

  if (habits.length === 0) {
    grid.innerHTML = '<p class="empty">No habits yet. Click "ADD HABIT +" to start your first one.</p>';
  }

  document.getElementById('total-habits').textContent = habits.length;
  updateStats();
  updateLevel();
  updateKeepGoing();
  updateWeekChart();

  updateTable();
  updateMilestones();
  updateAchievements();
  updateShop();

}

// ===== 9. ✓ و × على كروت العادات =====
grid.addEventListener('click', (e) => {
  const card = e.target.closest('.habit-card');
  if (!card) return;

  const habit = habits.find(h => h.id === card.dataset.id);

  if (e.target.closest('.habit-delete')) {
    if (!confirm(`Delete "${habit.name}"?`)) return;
    habits = habits.filter(h => h.id !== habit.id);
  } else if (e.target.closest('.habit-check')) {
    const key = dateKey(0);
    if (habit.log[key]) delete habit.log[key];
    else habit.log[key] = true;
  } else {
    return;
  }

  save();
  render();
});

// ===== 10. الـ Toggle (7 / 30 days) =====
const toggleBtns = document.querySelectorAll('.header-actions .toggle-btn');
toggleBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    toggleBtns.forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    range = Number(btn.dataset.range);
    render();
  });
});

// ===== 11. نافذة Add Habit =====
const dialog = document.getElementById('habit-dialog');
const habitForm = document.getElementById('habit-form');

document.getElementById('add-habit-btn').addEventListener('click', () => dialog.showModal());
document.getElementById('cancel-habit').addEventListener('click', () => dialog.close());

dialog.addEventListener('click', (e) => {
  if (e.target === dialog) dialog.close();
});

dialog.addEventListener('close', () => habitForm.reset());
// ===== اختيارات النافذة =====
const ICONS = ['📖', '💧', '🌙', '🏃', '🍎', '🧘', '💪', '📝', '🎧', '🧹', '💊', '🎯', '🥗', '🧠', '🎸', '💻', '🙏', '🛌', '🌞', '🚭'];
const PALETTE = ['#a8d8f0', '#f4a9b8', '#cdb4e6', '#f8c9a3', '#b8e0c2', '#f7e08c', '#ff8a65', '#90a4ae'];
const SHAPES = [
  { id: 'square', label: 'Square' },
  { id: 'round', label: 'Rounded' },
  { id: 'circle', label: 'Circle' }
];
const SUGGESTIONS = [
  { name: 'Reading', goal: '30m Goal', icon: '📖', color: '#f8c9a3' },
  { name: 'Hydration', goal: '2L Goal', icon: '💧', color: '#f4a9b8' },
  { name: 'Sleep', goal: '7h Goal', icon: '🌙', color: '#cdb4e6' },
  { name: 'Workout', goal: '20m Goal', icon: '💪', color: '#ff8a65' },
  { name: 'Meditate', goal: '10m Goal', icon: '🧘', color: '#b8e0c2' },
  { name: 'No sugar', goal: 'Daily tracking', icon: '🍎', color: '#a8d8f0' }
];

// العادات القديمة لونها اسم (sugar...)، والجديدة لونها hex
function habitColor(h) {
  return HABIT_COLORS[h.color] || h.color;
}

function buildPickers() {
  const iconBox = document.getElementById('icon-picker');
  ICONS.forEach((ic, i) => {
    const l = document.createElement('label');
    l.innerHTML = `<input type="radio" name="icon" value="${ic}" aria-label="Icon ${ic}" ${i === 0 ? 'checked' : ''}><span class="opt">${ic}</span>`;
    iconBox.appendChild(l);
  });

  const colorBox = document.getElementById('color-picker');
  PALETTE.forEach((c, i) => {
    const l = document.createElement('label');
    l.innerHTML = `<input type="radio" name="color" value="${c}" aria-label="Color ${c}" ${i === 0 ? 'checked' : ''}><span class="sw" style="--c:${c}"></span>`;
    colorBox.appendChild(l);
  });

  // اللون الحر
  const custom = document.createElement('label');
  custom.className = 'custom-color';
  custom.innerHTML = `
    <input type="radio" name="color" value="#ffffff" id="custom-radio" aria-label="Custom color">
    <span class="sw custom" id="custom-sw"></span>
    <input type="color" id="custom-input" value="#ffffff" aria-label="Pick a custom color">`;
  colorBox.appendChild(custom);

  document.getElementById('custom-input').addEventListener('input', (e) => {
    const radio = document.getElementById('custom-radio');
    radio.value = e.target.value;
    radio.checked = true;
    document.getElementById('custom-sw').style.setProperty('--c', e.target.value);
  });

  const shapeBox = document.getElementById('shape-picker');
  SHAPES.forEach((s, i) => {
    const l = document.createElement('label');
    l.innerHTML = `<input type="radio" name="shape" value="${s.id}" aria-label="${s.label}" ${i === 0 ? 'checked' : ''}><span class="opt"><i class="demo demo-${s.id}"></i></span>`;
    shapeBox.appendChild(l);
  });

  const chips = document.getElementById('suggestions');
  SUGGESTIONS.forEach(s => {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'chip';
    b.textContent = `${s.icon} ${s.name}`;
    b.addEventListener('click', () => {
      habitForm.elements['name'].value = s.name;
      habitForm.elements['goal'].value = s.goal;
      const pick = (field, value) => {
        const r = habitForm.querySelector(`input[name="${field}"][value="${value}"]`);
        if (r) r.checked = true;
      };
      pick('icon', s.icon);
      pick('color', s.color);
      updatePreview();
    });
    chips.appendChild(b);
  });

  // أسبوع تجريبي في المعاينة
  const pvWeek = document.getElementById('pv-week');
  [0, 1, 0, 1, 1, 0, 1].forEach(v => {
    const d = document.createElement('span');
    d.className = 'day' + (v ? ' done' : '');
    pvWeek.appendChild(d);
  });
}

function updatePreview() {
  const d = new FormData(habitForm);
  const pv = document.getElementById('preview');
  pv.className = `card habit-card preview shape-${d.get('shape')}`;
  pv.style.setProperty('--habit-color', d.get('color'));
  document.getElementById('pv-icon').textContent = d.get('icon');
  document.getElementById('pv-name').textContent = (d.get('name') || '').trim() || 'Habit name';
  document.getElementById('pv-goal').textContent = (d.get('goal') || '').trim() || 'Daily tracking';
}

habitForm.addEventListener('input', updatePreview);
habitForm.addEventListener('reset', () => setTimeout(updatePreview));

buildPickers();
updatePreview();

// ===== حفظ العادة =====
habitForm.addEventListener('submit', () => {
  const data = new FormData(habitForm);
  const name = data.get('name').trim();
  if (!name) return;

  habits.push({
    id: Date.now().toString(),
    name,
    goal: data.get('goal').trim() || 'Daily tracking',
    icon: data.get('icon'),
    color: data.get('color'),
    shape: data.get('shape'),
    log: {}
  });

  save();
  render();
});
// ===== تشغيل أول مرة =====
render();
booting = false;

// const links = document.querySelectorAll('.nav-link');

// const pages = document.querySelectorAll('.page');

// // أثناء السكرول: لوّن اللينك بتاع السكشن اللي في نص الشاشة
// const observer = new IntersectionObserver((entries) => {
//   entries.forEach(entry => {
//     if (entry.isIntersecting) {
//       links.forEach(l =>
//         l.classList.toggle('active', l.getAttribute('href') === '#' + entry.target.id)
//       );
//     }
//   });
// }, { rootMargin: '-45% 0px -45% 0px' });

// pages.forEach(p => observer.observe(p));
// // Toggle: 7 days / 30 days
// const toggleBtns = document.querySelectorAll('.toggle-btn');
// toggleBtns.forEach(btn => {
//   btn.addEventListener('click', () => {
//     toggleBtns.forEach(b => b.classList.remove('active'));
//     btn.classList.add('active');
//     range = Number(btn.dataset.range);
//     render();
//   });
// });

// // Checkbox: بيعلّم النهارده (آخر مربع) كمنجز
// document.querySelectorAll('.habit-check').forEach(btn => {
//   btn.addEventListener('click', () => {
//     btn.classList.toggle('done');
//     const today = btn.closest('.habit-card').querySelector('.day:last-child');
//     today.classList.toggle('done', btn.classList.contains('done'));
//   });
// });// نافذة Add Habit
// const dialog = document.getElementById('habit-dialog');
// const habitForm = document.getElementById('habit-form');

// document.getElementById('add-habit-btn').addEventListener('click', () => dialog.showModal());
// document.getElementById('cancel-habit').addEventListener('click', () => dialog.close());

// // الضغط على الخلفية المعتمة يقفل النافذة
// dialog.addEventListener('click', (e) => {
//   if (e.target === dialog) dialog.close();
// });

// // تفضية الفورم كل ما النافذة تتقفل

// dialog.addEventListener('close', () => habitForm.reset());
// // ===== تخزين العادات =====
// const STORAGE_KEY = 'habitrack-habits';
// let habits = JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];

// function save() {
//   localStorage.setItem(STORAGE_KEY, JSON.stringify(habits));
// }

// // تاريخ بصيغة 2026-11-18 (0 = النهارده، 1 = امبارح ...)
// function dateKey(daysAgo = 0) {
//   const d = new Date();
//   d.setDate(d.getDate() - daysAgo);
//   return d.toLocaleDateString('en-CA');
// }

// // ===== بناء الكارت =====
// const grid = document.getElementById('habits-grid');

// function createCard(h) {
//   const card = document.createElement('article');
//   card.className = `card habit-card ${h.color}`;
//   card.dataset.id = h.id;

//   const doneToday = !!h.log[dateKey(0)];

//   card.innerHTML = `
//     <div class="habit-top">
//       <span class="habit-icon"></span>
//       <div class="habit-info">
//         <div class="habit-name"></div>
//         <div class="habit-goal"></div>
//       </div>
//     <button class="habit-check ${doneToday ? 'done' : ''}" aria-label="Mark done">✓</button>
//       <button class="habit-delete" aria-label="Delete habit">×</button>
//     </div>
//     <div>
//       <div class="habit-label">Last ${range} Days</div>
//       <div class="week"></div>
//     </div>`;

//   // textContent بدل innerHTML للنص اللي المستخدم كتبه (أمان)
//   card.querySelector('.habit-icon').textContent = h.name[0].toUpperCase();
//   card.querySelector('.habit-name').textContent = h.name;
//   card.querySelector('.habit-goal').textContent = h.goal;

//   const week = card.querySelector('.week');
//   week.classList.toggle('month', range === 30);
//   for (let i = range - 1; i >= 0; i--) {
//     const day = document.createElement('span');
//     day.className = 'day' + (h.log[dateKey(i)] ? ' done' : '');
//     week.appendChild(day);
//   }
//   return card;
// }
// // ===== الإحصائيات =====
// let range = 7;   // عدد الأيام اللي Completion بيتحسب عليها

// function updateStats() {
//   // Streak: أيام متتالية فيها عادة واحدة على الأقل اتعملت
//   const anyDone = (i) => habits.some(h => h.log[dateKey(i)]);
//   let streak = 0;
//   let i = anyDone(0) ? 0 : 1;   // لو لسه ما علمتش النهارده، العد بيبدأ من امبارح
//   while (anyDone(i)) { streak++; i++; }

//   // Completion: المنجز ÷ (عدد العادات × عدد الأيام)
//   let done = 0;
//   for (let d = 0; d < range; d++) {
//     habits.forEach(h => { if (h.log[dateKey(d)]) done++; });
//   }
//   const total = habits.length * range;
//   const pct = total ? Math.round((done / total) * 100) : 0;

//   document.getElementById('streak-value').textContent =
//     `${streak} ${streak === 1 ? 'Day' : 'Days'}`;
//   document.getElementById('completion-value').textContent = `${pct}%`;
// }// ===== XP والمستوى =====
// const XP_PER_GOAL = 25;
// const XP_PER_LEVEL = 600;

// function updateLevel() {
//   // كل يوم اتعلّم في أي عادة = هدف اتحقق = 25 XP
//   const goals = habits.reduce((n, h) => n + Object.keys(h.log).length, 0);
//   const total = goals * XP_PER_GOAL;
//   const level = Math.floor(total / XP_PER_LEVEL) + 1;
//   const xp = total % XP_PER_LEVEL;
//   const pad = (n) => String(n).padStart(2, '0');

//   document.getElementById('level-num').textContent = pad(level);
//   document.getElementById('next-level').textContent = `Level ${pad(level + 1)}`;
//   document.getElementById('xp-text').textContent = `${xp} / ${XP_PER_LEVEL} XP`;
//   document.getElementById('xp-left').textContent = XP_PER_LEVEL - xp;
//   document.getElementById('xp-total').textContent = total.toLocaleString();
//   document.getElementById('xp-fill').style.width = `${(xp / XP_PER_LEVEL) * 100}%`;
//   document.getElementById('ring-fg').setAttribute('stroke-dasharray', `${(xp / XP_PER_LEVEL) * 100} 100`);
// }
// function render() {
//   grid.innerHTML = '';
//   habits.forEach(h => grid.appendChild(createCard(h)));

//   if (habits.length === 0) {
//     grid.innerHTML = '<p class="empty">No habits yet. Click "ADD HABIT +" to start your first one.</p>';
//   }
//   document.getElementById('total-habits').textContent = habits.length;
//   updateStats();
//   updateLevel();
//   document.getElementById('total-habits').textContent = habits.length;

// }

// // ===== الـ Checkbox =====
// grid.addEventListener('click', (e) => {
//   const card = e.target.closest('.habit-card');
//   if (!card) return;

//   const habit = habits.find(h => h.id === card.dataset.id);

//   if (e.target.closest('.habit-delete')) {
//     if (!confirm(`Delete "${habit.name}"?`)) return;
//     habits = habits.filter(h => h.id !== habit.id);
//   } else if (e.target.closest('.habit-check')) {
//     const key = dateKey(0);
//     if (habit.log[key]) delete habit.log[key];
//     else habit.log[key] = true;
//   } else {
//     return;
//   }

//   save();
//   render();
// });

// // ===== حفظ عادة جديدة من الفورم =====
// habitForm.addEventListener('submit', () => {
//   const data = new FormData(habitForm);
//   const name = data.get('name').trim();
//   if (!name) return;

//   habits.push({
//     id: Date.now().toString(),
//     name,
//     goal: data.get('goal').trim() || 'Daily tracking',
//     color: data.get('color'),
//     log: {}   // { "2026-11-18": true }
//   });

//   save();
//   render();
// });

// render();