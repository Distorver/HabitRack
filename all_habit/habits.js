const links = document.querySelectorAll('.nav-link');
const pages = document.querySelectorAll('.page');

// أثناء السكرول: لوّن اللينك بتاع السكشن اللي في نص الشاشة
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
// Toggle: 7 days / 30 days
const toggleBtns = document.querySelectorAll('.toggle-btn');
toggleBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    toggleBtns.forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
  });
});

// Checkbox: بيعلّم النهارده (آخر مربع) كمنجز
document.querySelectorAll('.habit-check').forEach(btn => {
  btn.addEventListener('click', () => {
    btn.classList.toggle('done');
    const today = btn.closest('.habit-card').querySelector('.day:last-child');
    today.classList.toggle('done', btn.classList.contains('done'));
  });
});// نافذة Add Habit
const dialog = document.getElementById('habit-dialog');
const habitForm = document.getElementById('habit-form');

document.getElementById('add-habit-btn').addEventListener('click', () => dialog.showModal());
document.getElementById('cancel-habit').addEventListener('click', () => dialog.close());

// الضغط على الخلفية المعتمة يقفل النافذة
dialog.addEventListener('click', (e) => {
  if (e.target === dialog) dialog.close();
});

// تفضية الفورم كل ما النافذة تتقفل

dialog.addEventListener('close', () => habitForm.reset());
// ===== تخزين العادات =====
const STORAGE_KEY = 'habitrack-habits';
let habits = JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];

function save() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(habits));
}

// تاريخ بصيغة 2026-11-18 (0 = النهارده، 1 = امبارح ...)
function dateKey(daysAgo = 0) {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  return d.toLocaleDateString('en-CA');
}

// ===== بناء الكارت =====
const grid = document.getElementById('habits-grid');

function createCard(h) {
  const card = document.createElement('article');
  card.className = `card habit-card ${h.color}`;
  card.dataset.id = h.id;

  const doneToday = !!h.log[dateKey(0)];

  card.innerHTML = `
    <div class="habit-top">
      <span class="habit-icon"></span>
      <div class="habit-info">
        <div class="habit-name"></div>
        <div class="habit-goal"></div>
      </div>
      <button class="habit-check ${doneToday ? 'done' : ''}" aria-label="Mark done">✓</button>
    </div>
    <div>
      <div class="habit-label">Last 7 Days</div>
      <div class="week"></div>
    </div>`;

  // textContent بدل innerHTML للنص اللي المستخدم كتبه (أمان)
  card.querySelector('.habit-icon').textContent = h.name[0].toUpperCase();
  card.querySelector('.habit-name').textContent = h.name;
  card.querySelector('.habit-goal').textContent = h.goal;

  const week = card.querySelector('.week');
  for (let i = 6; i >= 0; i--) {
    const day = document.createElement('span');
    day.className = 'day' + (h.log[dateKey(i)] ? ' done' : '');
    week.appendChild(day);
  }
  return card;
}

function render() {
  grid.innerHTML = '';
  habits.forEach(h => grid.appendChild(createCard(h)));
  document.getElementById('total-habits').textContent = habits.length;
}

// ===== الـ Checkbox =====
grid.addEventListener('click', (e) => {
  const btn = e.target.closest('.habit-check');
  if (!btn) return;

  const habit = habits.find(h => h.id === btn.closest('.habit-card').dataset.id);
  const key = dateKey(0);

  if (habit.log[key]) delete habit.log[key];
  else habit.log[key] = true;

  save();
  render();
});

// ===== حفظ عادة جديدة من الفورم =====
habitForm.addEventListener('submit', () => {
  const data = new FormData(habitForm);
  const name = data.get('name').trim();
  if (!name) return;

  habits.push({
    id: Date.now().toString(),
    name,
    goal: data.get('goal').trim() || 'Daily tracking',
    color: data.get('color'),
    log: {}   // { "2026-11-18": true }
  });

  save();
  render();
});

render();