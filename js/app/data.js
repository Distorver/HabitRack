// Data module - handles habit data storage and retrieval

const Data = (function() {
  const STORAGE_KEY = 'habitrack_habits';
  
  // Default habits
  const defaultHabits = [
    {
      id: 1,
      name: "Sugar Intake",
      icon: "leaf",
      goal: "Daily tracking",
      goalType: "boolean",
      completedDates: []
    },
    {
      id: 2,
      name: "Hydration",
      icon: "water",
      goal: "2L",
      goalType: "numeric",
      completedDates: []
    },
    {
      id: 3,
      name: "Sleep",
      icon: "moon",
      goal: "7h",
      goalType: "numeric",
      completedDates: []
    },
    {
      id: 4,
      name: "Reading",
      icon: "book",
      goal: "30m",
      goalType: "numeric",
      completedDates: []
    }
  ];

  // Load habits from localStorage or use defaults
  function loadHabits() {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        return JSON.parse(stored);
      } catch (e) {
        console.error('Error parsing stored habits:', e);
      }
    }
    // Initialize with default habits for demo
    const habits = defaultHabits.map(h => ({
      ...h,
      completedDates: generateDemoCompletions()
    }));
    saveHabits(habits);
    return habits;
  }

  // Generate random completions for demo
  function generateDemoCompletions() {
    const dates = [];
    const today = new Date();
    // Random number of completions (0-6)
    const numCompletions = Math.floor(Math.random() * 7);
    
    for (let i = 0; i < numCompletions; i++) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      dates.push(formatDate(date));
    }
    return dates;
  }

  // Format date as YYYY-MM-DD
  function formatDate(date) {
    return date.toISOString().split('T')[0];
  }

  // Get today's date string
  function getToday() {
    return formatDate(new Date());
  }

  // Save habits to localStorage
  function saveHabits(habits) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(habits));
  }

  // Get habits
  function getHabits() {
    return loadHabits();
  }

  // Add new habit
  function addHabit(habitData) {
    const habits = loadHabits();
    const newHabit = {
      id: Date.now(),
      name: habitData.name,
      icon: habitData.icon,
      goal: habitData.goal,
      goalType: habitData.goalType,
      completedDates: []
    };
    habits.push(newHabit);
    saveHabits(habits);
    return habits;
  }

  // Toggle habit completion for today
  function toggleHabitCompletion(habitId) {
    const habits = loadHabits();
    const habit = habits.find(h => h.id === habitId);
    if (!habit) return habits;

    const today = getToday();
    const dateIndex = habit.completedDates.indexOf(today);

    if (dateIndex > -1) {
      habit.completedDates.splice(dateIndex, 1);
    } else {
      habit.completedDates.push(today);
    }

    saveHabits(habits);
    return habits;
  }

  // Get statistics
  function getStats(days = 7) {
    const habits = loadHabits();
    const today = getToday();
    
    // Total habits
    const totalHabits = habits.length;

    // Calculate streak (consecutive days with at least one completion)
    let streak = 0;
    let checkDate = new Date();
    
    while (true) {
      const dateStr = formatDate(checkDate);
      const hasCompletion = habits.some(h => h.completedDates.includes(dateStr));
      
      if (hasCompletion) {
        streak++;
        checkDate.setDate(checkDate.getDate() - 1);
      } else if (streak === 0 && dateStr !== today) {
        // Allow checking yesterday if today not completed yet
        checkDate.setDate(checkDate.getDate() - 1);
      } else {
        break;
      }
      
      // Safety limit
      if (streak > 365) break;
    }

    // Completion percentage (last N days based on filter)
    let totalPossible = totalHabits * days;
    let totalCompleted = 0;
    
    for (let i = 0; i < days; i++) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = formatDate(date);
      
      habits.forEach(h => {
        if (h.completedDates.includes(dateStr)) {
          totalCompleted++;
        }
      });
    }

    const completion = totalPossible > 0 
      ? Math.round((totalCompleted / totalPossible) * 100) 
      : 0;

    return { totalHabits, streak, completion };
  }

  // Get last N days
  function getLastDays(numDays = 7) {
    const days = [];
    const dayNames = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
    const today = new Date();
    
    for (let i = numDays - 1; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      days.push({
        date: formatDate(date),
        dayName: dayNames[date.getDay()],
        isToday: i === 0
      });
    }
    
    return days;
  }

  // Get last 7 days (backward compatible)
  function getLast7Days() {
    return getLastDays(7);
  }

  return {
    getHabits,
    addHabit,
    toggleHabitCompletion,
    getStats,
    getLastDays,
    getLast7Days,
    getToday
  };
})();