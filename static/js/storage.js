/**
 * Daily Health Coach - On-Device Storage & Local Heuristic Engine
 * Enables 100% Standalone, Zero-Server Operation with persistent LocalStorage.
 * Strictly isolates demo user sample data from real registered user accounts.
 */

(function () {
  const STORAGE_KEYS = {
    USERS: 'dhc_local_users_store_v2',
    USER: 'dhc_local_user_v1',
    AUTH_TOKEN: 'dhc_auth_token',
    TARGETS: 'dhc_targets_v1',
    HABITS: 'dhc_habits_v1',
    WATER_LOGS: 'dhc_water_logs_v1',
    FOOD_LOGS: 'dhc_food_logs_v1',
    ACTIVITY_LOGS: 'dhc_activity_logs_v1',
    WEIGHT_LOGS: 'dhc_weight_logs_v1',
    WEARABLE: 'dhc_wearable_v1',
    HABIT_COMPLETIONS: 'dhc_habit_completions_v1'
  };

  function getTodayString() {
    return new Date().toISOString().split('T')[0];
  }

  function getTimestampString() {
    return new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });
  }

  const DEFAULT_TARGETS = {
    water_target_ml: 2500,
    calories_target: 2000,
    protein_target_g: 130,
    carbs_target_g: 220,
    fat_target_g: 65,
    steps_target: 8000,
    current_weight_kg: 72.5,
    target_weight_kg: 68.0,
    age: 28,
    gender: 'Male',
    height_cm: 175.0,
    activity_level: 'Moderately Active',
    fitness_goal: 'Lose Weight'
  };

  const DEFAULT_HABITS = [
    { id: 1, title: 'Drink 500ml Water Upon Waking', category: 'Hydration', icon: '💧', streak_count: 6 },
    { id: 2, title: 'Morning Mobility & 10 Min Walk', category: 'Movement', icon: '👟', streak_count: 5 },
    { id: 3, title: 'Reach 30g+ Protein in Breakfast', category: 'Nutrition', icon: '🍳', streak_count: 8 },
    { id: 4, title: 'No Deep-Fried Fast Food Today', category: 'Discipline', icon: '🥗', streak_count: 12 },
    { id: 5, title: '10 Mins Evening Screen-Free Wind Down', category: 'Recovery', icon: '🌙', streak_count: 4 }
  ];

  const CLEAN_HABITS = DEFAULT_HABITS.map(h => ({ ...h, streak_count: 0 }));

  const LocalDB = {
    init() {
      this.getUsersList();
      if (!localStorage.getItem(STORAGE_KEYS.TARGETS)) {
        this.resetDefaults();
      }
    },

    getCurrentUser() {
      try {
        const raw = localStorage.getItem(STORAGE_KEYS.USER);
        return raw ? JSON.parse(raw) : null;
      } catch (e) {
        return null;
      }
    },

    getUsersList() {
      let users = [];
      try {
        const raw = localStorage.getItem(STORAGE_KEYS.USERS);
        if (raw) users = JSON.parse(raw);
      } catch (e) {
        users = [];
      }
      if (!Array.isArray(users)) users = [];

      // Ensure default demo user exists
      const demoExists = users.some(u => u.username === 'demo' || u.id === 1);
      if (!demoExists) {
        users.unshift({
          id: 1,
          username: 'demo',
          email: 'demo@dailyhealthcoach.app',
          full_name: 'Demo Athlete',
          password: 'demo123',
          is_demo: true,
          created_at: new Date().toISOString()
        });
        localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
      }
      return users;
    },

    getUserKey(baseKey) {
      const user = this.getCurrentUser();
      if (!user || user.is_demo || user.username === 'demo') {
        return baseKey;
      }
      return `${baseKey}_u${user.id}`;
    },

    getItem(baseKey, defaultValue = null) {
      const k = this.getUserKey(baseKey);
      const val = localStorage.getItem(k);
      if (val === null) return defaultValue;
      try {
        return JSON.parse(val);
      } catch (e) {
        return defaultValue;
      }
    },

    setItem(baseKey, value) {
      const k = this.getUserKey(baseKey);
      localStorage.setItem(k, JSON.stringify(value));
    },

    ensureCleanUserData(userId) {
      const uKey = (k) => `${k}_u${userId}`;
      if (!localStorage.getItem(uKey(STORAGE_KEYS.TARGETS))) {
        localStorage.setItem(uKey(STORAGE_KEYS.TARGETS), JSON.stringify(DEFAULT_TARGETS));
      }
      if (!localStorage.getItem(uKey(STORAGE_KEYS.HABITS))) {
        // Real user gets initial habits with 0 streaks
        const freshHabits = DEFAULT_HABITS.map(h => ({ ...h, streak_count: 0 }));
        localStorage.setItem(uKey(STORAGE_KEYS.HABITS), JSON.stringify(freshHabits));
      }
      if (!localStorage.getItem(uKey(STORAGE_KEYS.WATER_LOGS))) {
        localStorage.setItem(uKey(STORAGE_KEYS.WATER_LOGS), JSON.stringify([]));
      }
      if (!localStorage.getItem(uKey(STORAGE_KEYS.FOOD_LOGS))) {
        localStorage.setItem(uKey(STORAGE_KEYS.FOOD_LOGS), JSON.stringify([]));
      }
      if (!localStorage.getItem(uKey(STORAGE_KEYS.ACTIVITY_LOGS))) {
        localStorage.setItem(uKey(STORAGE_KEYS.ACTIVITY_LOGS), JSON.stringify([]));
      }
      if (!localStorage.getItem(uKey(STORAGE_KEYS.WEIGHT_LOGS))) {
        localStorage.setItem(uKey(STORAGE_KEYS.WEIGHT_LOGS), JSON.stringify([
          { id: 1, weight_kg: DEFAULT_TARGETS.current_weight_kg, date: getTodayString(), timestamp: getTimestampString(), note: 'Initial baseline weigh-in' }
        ]));
      }
      if (!localStorage.getItem(uKey(STORAGE_KEYS.WEARABLE))) {
        localStorage.setItem(uKey(STORAGE_KEYS.WEARABLE), JSON.stringify({
          paired: false,
          brand: 'None',
          model_name: 'Not Paired',
          last_sync: 'Never',
          battery_pct: 100,
          steps: 0,
          heart_rate_bpm: 72,
          active_calories: 0,
          sleep_hours: 0,
          sleep_quality_pct: 0,
          hr_zone: 'Resting',
          resting_hr: 60
        }));
      }
      if (!localStorage.getItem(uKey(STORAGE_KEYS.HABIT_COMPLETIONS))) {
        localStorage.setItem(uKey(STORAGE_KEYS.HABIT_COMPLETIONS), JSON.stringify({}));
      }
    },

    login(ident, password) {
      const users = this.getUsersList();
      const cleanIdent = (ident || '').trim().toLowerCase();
      const matched = users.find(u =>
        (u.username && u.username.toLowerCase() === cleanIdent) ||
        (u.email && u.email.toLowerCase() === cleanIdent)
      );

      if (!matched || matched.password !== password) {
        throw new Error('Incorrect username or password');
      }

      const isDemo = Boolean(matched.is_demo || matched.username === 'demo');
      const safeUser = {
        id: matched.id,
        username: matched.username,
        email: matched.email,
        full_name: matched.full_name || matched.username,
        is_demo: isDemo,
        created_at: matched.created_at
      };

      localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(safeUser));
      localStorage.setItem(STORAGE_KEYS.AUTH_TOKEN, 'dhc_local_token_' + safeUser.id);

      if (!isDemo) {
        this.ensureCleanUserData(safeUser.id);
      }

      return {
        user: safeUser,
        token: 'dhc_local_token_' + safeUser.id,
        message: 'Logged in successfully'
      };
    },

    register(fullName, username, email, password) {
      const cleanUsername = (username || '').trim().toLowerCase();
      const cleanEmail = (email || `${cleanUsername}@dailyhealthcoach.local`).trim().toLowerCase();
      const cleanFullName = (fullName || cleanUsername).trim();
      const pass = (password || '').trim();

      if (!cleanUsername || !pass) {
        throw new Error('Username and password are required');
      }
      if (cleanUsername.length < 3) {
        throw new Error('Username must be at least 3 characters long');
      }
      if (pass.length < 6) {
        throw new Error('Password must be at least 6 characters long');
      }

      const users = this.getUsersList();
      if (users.some(u => (u.username && u.username.toLowerCase() === cleanUsername) || (u.email && u.email.toLowerCase() === cleanEmail))) {
        throw new Error('Username or email is already registered');
      }

      const newUser = {
        id: Date.now(),
        username: cleanUsername,
        email: cleanEmail,
        full_name: cleanFullName,
        password: pass,
        is_demo: false,
        created_at: new Date().toISOString()
      };

      users.push(newUser);
      localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));

      const safeUser = {
        id: newUser.id,
        username: newUser.username,
        email: newUser.email,
        full_name: newUser.full_name,
        is_demo: false,
        created_at: newUser.created_at
      };

      localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(safeUser));
      localStorage.setItem(STORAGE_KEYS.AUTH_TOKEN, 'dhc_local_token_' + safeUser.id);

      // Initialize clean slate for this new real user
      this.ensureCleanUserData(newUser.id);

      return {
        user: safeUser,
        token: 'dhc_local_token_' + safeUser.id,
        message: 'Registration successful'
      };
    },

    logout() {
      localStorage.removeItem(STORAGE_KEYS.USER);
      localStorage.removeItem(STORAGE_KEYS.AUTH_TOKEN);
      return { success: true, message: 'Logged out successfully' };
    },

    resetDefaults() {
      const today = getTodayString();
      localStorage.setItem(STORAGE_KEYS.TARGETS, JSON.stringify(DEFAULT_TARGETS));
      localStorage.setItem(STORAGE_KEYS.HABITS, JSON.stringify(DEFAULT_HABITS));

      // Seed initial sample logs for today (demo day data)
      const sampleWater = [
        { id: 1, amount_ml: 500, timestamp: '07:30 AM', date: today, note: 'Morning wake-up glass' },
        { id: 2, amount_ml: 350, timestamp: '10:15 AM', date: today, note: 'Desk hydration mug' },
        { id: 3, amount_ml: 500, timestamp: '01:00 PM', date: today, note: 'Post-lunch flask' }
      ];
      localStorage.setItem(STORAGE_KEYS.WATER_LOGS, JSON.stringify(sampleWater));

      const sampleFood = [
        { id: 1, name: 'Greek Yogurt with Berries & Chia', meal_type: 'Breakfast', calories: 320, protein_g: 24, carbs_g: 36, fat_g: 8, timestamp: '08:15 AM', date: today },
        { id: 2, name: 'Grilled Herb Chicken & Quinoa Salad', meal_type: 'Lunch', calories: 580, protein_g: 46, carbs_g: 52, fat_g: 18, timestamp: '01:15 PM', date: today }
      ];
      localStorage.setItem(STORAGE_KEYS.FOOD_LOGS, JSON.stringify(sampleFood));

      const sampleActivity = [
        { id: 1, name: 'Morning Fast Walk', activity_type: 'Walking', duration_mins: 35, calories_burned: 180, steps: 4200, timestamp: '07:45 AM', date: today }
      ];
      localStorage.setItem(STORAGE_KEYS.ACTIVITY_LOGS, JSON.stringify(sampleActivity));

      const sampleWeight = [
        { id: 1, weight_kg: 73.2, date: this._getRelativeDateStr(-7), note: 'Week 1 baseline' },
        { id: 2, weight_kg: 72.8, date: this._getRelativeDateStr(-4), note: 'Mid-week weigh in' },
        { id: 3, weight_kg: 72.5, date: today, note: 'Today weigh in' }
      ];
      localStorage.setItem(STORAGE_KEYS.WEIGHT_LOGS, JSON.stringify(sampleWeight));

      const sampleWearable = {
        paired: true,
        brand: 'Apple Watch',
        model_name: 'Series 9',
        last_sync: '10 mins ago',
        battery_pct: 82,
        steps: 4650,
        heart_rate_bpm: 72,
        active_calories: 220,
        sleep_hours: 7.5,
        sleep_quality_pct: 88,
        hr_zone: 'Resting / Recovery',
        resting_hr: 60
      };
      localStorage.setItem(STORAGE_KEYS.WEARABLE, JSON.stringify(sampleWearable));

      // Mark first 2 habits done for today in demo mode
      const completions = {};
      completions[`${today}_1`] = true;
      completions[`${today}_2`] = true;
      localStorage.setItem(STORAGE_KEYS.HABIT_COMPLETIONS, JSON.stringify(completions));
    },

    _getRelativeDateStr(offsetDays) {
      const d = new Date();
      d.setDate(d.getDate() + offsetDays);
      return d.toISOString().split('T')[0];
    },

    getTargets() {
      const t = this.getItem(STORAGE_KEYS.TARGETS);
      return t ? t : { ...DEFAULT_TARGETS };
    },

    setTargets(targets) {
      const cur = this.getTargets();
      const updated = { ...cur, ...targets };
      this.setItem(STORAGE_KEYS.TARGETS, updated);
      return updated;
    },

    getHabits(date) {
      const targetDate = date || getTodayString();
      const user = this.getCurrentUser();
      const isDemo = !user || user.is_demo || user.username === 'demo';
      const defaultHabitList = isDemo ? DEFAULT_HABITS : CLEAN_HABITS;
      const habits = this.getItem(STORAGE_KEYS.HABITS, defaultHabitList);
      const completions = this.getItem(STORAGE_KEYS.HABIT_COMPLETIONS, {});

      return habits.map(h => ({
        ...h,
        completed: Boolean(completions[`${targetDate}_${h.id}`]),
        category_icon: h.icon
      }));
    },

    toggleHabit(habitId, date) {
      const targetDate = date || getTodayString();
      const completions = this.getItem(STORAGE_KEYS.HABIT_COMPLETIONS, {});
      const key = `${targetDate}_${habitId}`;
      const isCompleted = !completions[key];
      completions[key] = isCompleted;
      this.setItem(STORAGE_KEYS.HABIT_COMPLETIONS, completions);

      // Update streak count
      const habits = this.getItem(STORAGE_KEYS.HABITS, DEFAULT_HABITS);
      const habit = habits.find(h => h.id === habitId);
      if (habit) {
        habit.streak_count = isCompleted ? (habit.streak_count || 0) + 1 : Math.max(0, (habit.streak_count || 1) - 1);
        this.setItem(STORAGE_KEYS.HABITS, habits);
      }

      return this.getTodaySummary(targetDate);
    },

    // --- Water Logs ---
    getWaterLogs(date) {
      const targetDate = date || getTodayString();
      const all = this.getItem(STORAGE_KEYS.WATER_LOGS, []);
      return all.filter(item => item.date === targetDate);
    },

    addWaterLog(amount_ml, note, date) {
      const targetDate = date || getTodayString();
      const all = this.getItem(STORAGE_KEYS.WATER_LOGS, []);
      const entry = {
        id: Date.now(),
        amount_ml: parseInt(amount_ml, 10),
        note: note || '',
        timestamp: getTimestampString(),
        date: targetDate
      };
      all.unshift(entry);
      this.setItem(STORAGE_KEYS.WATER_LOGS, all);
      return this.getTodaySummary(targetDate);
    },

    deleteWaterLog(id, date) {
      const targetDate = date || getTodayString();
      let all = this.getItem(STORAGE_KEYS.WATER_LOGS, []);
      all = all.filter(item => item.id !== parseInt(id, 10));
      this.setItem(STORAGE_KEYS.WATER_LOGS, all);
      return this.getTodaySummary(targetDate);
    },

    // --- Food Logs ---
    getFoodLogs(date) {
      const targetDate = date || getTodayString();
      const all = this.getItem(STORAGE_KEYS.FOOD_LOGS, []);
      return all.filter(item => item.date === targetDate);
    },

    addFoodLog(entry) {
      const targetDate = entry.date || getTodayString();
      const all = this.getItem(STORAGE_KEYS.FOOD_LOGS, []);
      const newEntry = {
        id: Date.now(),
        name: entry.name || 'Meal',
        meal_type: entry.meal_type || 'Snack',
        calories: parseInt(entry.calories, 10) || 0,
        protein_g: parseFloat(entry.protein_g) || 0,
        carbs_g: parseFloat(entry.carbs_g) || 0,
        fat_g: parseFloat(entry.fat_g) || 0,
        timestamp: entry.timestamp || getTimestampString(),
        date: targetDate
      };
      all.unshift(newEntry);
      this.setItem(STORAGE_KEYS.FOOD_LOGS, all);
      return this.getTodaySummary(targetDate);
    },

    deleteFoodLog(id, date) {
      const targetDate = date || getTodayString();
      let all = this.getItem(STORAGE_KEYS.FOOD_LOGS, []);
      all = all.filter(item => item.id !== parseInt(id, 10));
      this.setItem(STORAGE_KEYS.FOOD_LOGS, all);
      return this.getTodaySummary(targetDate);
    },

    // --- Activity Logs ---
    getActivityLogs(date) {
      const targetDate = date || getTodayString();
      const all = this.getItem(STORAGE_KEYS.ACTIVITY_LOGS, []);
      return all.filter(item => item.date === targetDate);
    },

    addActivityLog(entry) {
      const targetDate = entry.date || getTodayString();
      const all = this.getItem(STORAGE_KEYS.ACTIVITY_LOGS, []);
      const newEntry = {
        id: Date.now(),
        name: entry.name || entry.activity_type || 'Workout',
        activity_type: entry.activity_type || 'Workout',
        duration_mins: parseInt(entry.duration_mins, 10) || 0,
        calories_burned: parseInt(entry.calories_burned, 10) || 0,
        steps: parseInt(entry.steps, 10) || 0,
        timestamp: entry.timestamp || getTimestampString(),
        date: targetDate
      };
      all.unshift(newEntry);
      this.setItem(STORAGE_KEYS.ACTIVITY_LOGS, all);
      return this.getTodaySummary(targetDate);
    },

    deleteActivityLog(id, date) {
      const targetDate = date || getTodayString();
      let all = this.getItem(STORAGE_KEYS.ACTIVITY_LOGS, []);
      all = all.filter(item => item.id !== parseInt(id, 10));
      this.setItem(STORAGE_KEYS.ACTIVITY_LOGS, all);
      return this.getTodaySummary(targetDate);
    },

    // --- Weight Logs ---
    getWeightLogs() {
      return this.getItem(STORAGE_KEYS.WEIGHT_LOGS, []);
    },

    addWeightLog(weight_kg, note, date) {
      const targetDate = date || getTodayString();
      const all = this.getWeightLogs();
      const newEntry = {
        id: Date.now(),
        weight_kg: parseFloat(weight_kg),
        note: note || '',
        date: targetDate,
        timestamp: getTimestampString()
      };
      all.unshift(newEntry);
      this.setItem(STORAGE_KEYS.WEIGHT_LOGS, all);
      this.setTargets({ current_weight_kg: parseFloat(weight_kg) });
      return newEntry;
    },

    // --- Wearable ---
    getWearable() {
      return this.getItem(STORAGE_KEYS.WEARABLE, { paired: false });
    },

    saveWearable(payload) {
      const cur = this.getWearable();
      const updated = { ...cur, ...payload, paired: true };
      this.setItem(STORAGE_KEYS.WEARABLE, updated);
      return updated;
    },

    simulateWatchPulse() {
      const w = this.getWearable();
      w.steps = (w.steps || 4500) + Math.floor(Math.random() * 400 + 150);
      w.heart_rate_bpm = Math.floor(Math.random() * 25 + 68);
      w.active_calories = (w.active_calories || 200) + Math.floor(Math.random() * 25 + 10);
      w.last_sync = 'Just now';
      this.setItem(STORAGE_KEYS.WEARABLE, w);
      return w;
    },

    // --- Scoring & Full Summary Generator ---
    getTodaySummary(date) {
      const targetDate = date || getTodayString();
      const user = this.getCurrentUser();
      const isDemo = !user || user.is_demo || user.username === 'demo';

      const targets = this.getTargets();
      const waterLogs = this.getWaterLogs(targetDate);
      const foodLogs = this.getFoodLogs(targetDate);
      const activityLogs = this.getActivityLogs(targetDate);
      const habits = this.getHabits(targetDate);
      const wearable = this.getWearable();

      const water_total_ml = waterLogs.reduce((acc, x) => acc + (x.amount_ml || 0), 0);
      const food_calories = foodLogs.reduce((acc, x) => acc + (x.calories || 0), 0);
      const protein_total_g = foodLogs.reduce((acc, x) => acc + (x.protein_g || 0), 0);
      const carbs_total_g = foodLogs.reduce((acc, x) => acc + (x.carbs_g || 0), 0);
      const fat_total_g = foodLogs.reduce((acc, x) => acc + (x.fat_g || 0), 0);

      const activity_calories = activityLogs.reduce((acc, x) => acc + (x.calories_burned || 0), 0);
      const activity_steps = activityLogs.reduce((acc, x) => acc + (x.steps || 0), 0);
      const steps_total = Math.max(activity_steps, wearable.paired ? (wearable.steps || 0) : 0);
      const calories_burned = Math.max(activity_calories, wearable.paired ? (wearable.active_calories || 0) : 0);

      const habits_completed = habits.filter(h => h.completed).length;
      const habits_total = habits.length;

      // Calculate health score (0-100)
      const water_ratio = Math.min(1.0, water_total_ml / Math.max(1, targets.water_target_ml));
      const steps_ratio = Math.min(1.0, steps_total / Math.max(1, targets.steps_target));
      const protein_ratio = Math.min(1.0, protein_total_g / Math.max(1, targets.protein_target_g));
      const habits_ratio = habits_total > 0 ? (habits_completed / habits_total) : 0;

      const water_score = Math.round(water_ratio * 25);
      const steps_score = Math.round(steps_ratio * 25);
      const fuel_score = Math.round(protein_ratio * 25);
      const habit_score = Math.round(habits_ratio * 25);

      const health_score = Math.min(100, water_score + steps_score + fuel_score + habit_score);

      let grade = 'Elite Consistency';
      if (health_score < 60) grade = 'Needs Attention';
      else if (health_score < 75) grade = 'Building Momentum';
      else if (health_score < 90) grade = 'On Track & Thriving';

      // Coaching tips
      const coach_tips = [];
      if (water_ratio >= 1.0) {
        coach_tips.push({
          id: 'hydra_achieved',
          category: 'hydration',
          urgency: 'achievement',
          title: 'Hydration Target Smashed!',
          message: `Outstanding! You have hit ${water_total_ml.toLocaleString()}ml. Cellular recovery and focus are primed.`,
          action_suggestion: 'Keep hydrated gently throughout the day.',
          icon: '🌊'
        });
      } else {
        const left = Math.max(0, targets.water_target_ml - water_total_ml);
        coach_tips.push({
          id: 'hydra_left',
          category: 'hydration',
          urgency: left > 1000 ? 'high' : 'medium',
          title: `Hydration Focus: ${left}ml Remaining`,
          message: `Drink ${Math.ceil(left / 250)} more glasses to hit your ${targets.water_target_ml}ml daily goal.`,
          action_suggestion: 'Keep a water bottle on your desk for regular sips.',
          icon: '💧'
        });
      }

      if (protein_ratio >= 1.0) {
        coach_tips.push({
          id: 'protein_achieved',
          category: 'protein',
          urgency: 'achievement',
          title: 'Protein Target Smashed!',
          message: `Logged ${protein_total_g.toFixed(0)}g protein! Excellent for muscle maintenance and lean body composition.`,
          action_suggestion: 'Maintain balanced fiber and carbs.',
          icon: '🍗'
        });
      } else {
        const pLeft = Math.max(0, Math.round(targets.protein_target_g - protein_total_g));
        coach_tips.push({
          id: 'protein_left',
          category: 'protein',
          urgency: 'medium',
          title: `${pLeft}g Protein to Reach Goal`,
          message: `You need ${pLeft}g more protein today.`,
          action_suggestion: 'Quick options: 2 scoops Greek yogurt, whey shake, or 3 boiled eggs.',
          icon: '🥗'
        });
      }

      // Action checklist
      const what_can_do_actions = [
        {
          title: water_total_ml >= targets.water_target_ml ? 'Hydration Target Completed' : `Drink ${Math.max(0, targets.water_target_ml - water_total_ml)}ml Water`,
          subtitle: water_total_ml >= targets.water_target_ml ? `${water_total_ml}ml logged today! Great job.` : 'Hit your cell hydration quota',
          category: 'hydration',
          done: water_total_ml >= targets.water_target_ml,
          icon: '💧'
        },
        {
          title: protein_total_g >= targets.protein_target_g ? 'Protein Goal Achieved' : `Fuel with ${Math.max(0, Math.round(targets.protein_target_g - protein_total_g))}g Protein`,
          subtitle: `${protein_total_g.toFixed(0)}g / ${targets.protein_target_g}g logged today`,
          category: 'protein',
          done: protein_total_g >= targets.protein_target_g,
          icon: '🍗'
        },
        {
          title: steps_total >= targets.steps_target ? 'Step Goal Achieved' : `Walk ${Math.max(0, targets.steps_target - steps_total)} More Steps`,
          subtitle: `${steps_total.toLocaleString()} / ${targets.steps_target.toLocaleString()} steps tracked`,
          category: 'movement',
          done: steps_total >= targets.steps_target,
          icon: '👟'
        }
      ];

      const water_progress_pct = Math.round(water_ratio * 100);
      const steps_progress_pct = Math.round(steps_ratio * 100);
      const protein_progress_pct = Math.round(protein_ratio * 100);
      const calories_remaining = Math.max(0, (targets.calories_target || 2000) - food_calories);
      const active_minutes_total = activityLogs.reduce((acc, x) => acc + (x.duration_minutes || 0), 0);

      const streak_days = isDemo ? 6 : Math.max(0, habits.reduce((max, h) => Math.max(max, h.streak_count || 0), 0));

      return {
        date: targetDate,
        health_score,
        health_grade: grade,
        streak_days,
        water_total_ml,
        water_progress_pct,
        calories_consumed: food_calories,
        calories_burned,
        calories_remaining,
        net_calories: food_calories - calories_burned,
        protein_total_g,
        protein_progress_pct,
        carbs_total_g,
        fat_total_g,
        steps_total,
        steps_progress_pct,
        active_minutes_total,
        habits_completed,
        habits_total,
        targets,
        coach_tips,
        water_logs: waterLogs,
        food_logs: foodLogs,
        activity_logs: activityLogs,
        habits,
        wearable_device: wearable,
        wearable_telemetry: wearable,
        transformation_roadmap: {
          goal_title: targets.fitness_goal || 'Healthy Lifestyle',
          what_will_do_summary: `Daily calorie budget: ${targets.calories_target} kcal, Protein: ${targets.protein_target_g}g.`,
          daily_calorie_target: targets.calories_target,
          daily_protein_target: targets.protein_target_g,
          daily_deficit_or_surplus: -400,
          projected_weeks_to_goal: 6,
          projected_completion_date: this._getRelativeDateStr(42),
          how_much_done_summary: `Target weight: ${targets.target_weight_kg} kg from ${targets.current_weight_kg} kg.`,
          weight_shifted_kg: 0.7,
          goal_achieved_pct: isDemo ? 35 : 0,
          total_days_active: isDemo ? 8 : (waterLogs.length > 0 || foodLogs.length > 0 ? 1 : 0),
          what_can_do_actions
        }
      };
    },

    getHistory() {
      // 7-day trend history
      const history = [];
      for (let i = 6; i >= 0; i--) {
        const d = this._getRelativeDateStr(-i);
        const daySummary = this.getTodaySummary(d);
        history.push({
          date: d,
          health_score: daySummary.health_score || 0,
          water_ml: daySummary.water_total_ml || 0,
          protein_g: daySummary.protein_total_g || 0,
          steps: daySummary.steps_total || 0,
          calories_consumed: daySummary.calories_consumed || 0
        });
      }
      return history;
    },

    getDetailedHistory(days = 14) {
      const records = [];
      for (let i = 0; i < days; i++) {
        const d = this._getRelativeDateStr(-i);
        const summary = this.getTodaySummary(d);
        let label = d;
        if (i === 0) label = 'Today';
        else if (i === 1) label = 'Yesterday';

        records.push({
          date: d,
          label: label,
          display_label: label,
          water_ml: summary.water_total_ml || 0,
          water_total_ml: summary.water_total_ml || 0,
          calories_consumed: summary.calories_consumed || 0,
          calories_burned: summary.calories_burned || 0,
          net_calories: summary.net_calories || 0,
          protein_g: summary.protein_total_g || 0,
          protein_total_g: summary.protein_total_g || 0,
          carbs_g: summary.carbs_total_g || 0,
          carbs_total_g: summary.carbs_total_g || 0,
          fat_g: summary.fat_total_g || 0,
          fat_total_g: summary.fat_total_g || 0,
          steps: summary.steps_total || 0,
          steps_total: summary.steps_total || 0,
          habits_completed: summary.habits_completed || 0,
          habits_total: summary.habits_total || 5,
          health_score: summary.health_score || 0,
          health_grade: summary.health_grade || 'Needs Attention',
          weight_kg: (summary.targets && summary.targets.current_weight_kg) || 72.5,
          water_count: (summary.water_logs && summary.water_logs.length) || 0,
          food_count: (summary.food_logs && summary.food_logs.length) || 0,
          activity_count: (summary.activity_logs && summary.activity_logs.length) || 0
        });
      }
      return records;
    },

    calculateMetabolism(payload) {
      const age = parseInt(payload.age, 10) || 28;
      const gender = (payload.gender || 'Male').toLowerCase();
      const height = parseFloat(payload.height_cm) || 175;
      const weight = parseFloat(payload.weight_kg) || 72.5;

      // Mifflin-St Jeor Formula
      let bmr = (10 * weight) + (6.25 * height) - (5 * age);
      if (gender === 'male') bmr += 5;
      else bmr -= 161;

      const activityMultipliers = {
        'sedentary': 1.2,
        'lightly active': 1.375,
        'moderately active': 1.55,
        'very active': 1.725
      };
      const actKey = (payload.activity_level || 'moderately active').toLowerCase();
      const mult = activityMultipliers[actKey] || 1.55;
      const tdee = Math.round(bmr * mult);

      let calTarget = tdee - 400; // Lose weight default
      if ((payload.fitness_goal || '').toLowerCase().includes('gain')) {
        calTarget = tdee + 350;
      } else if ((payload.fitness_goal || '').toLowerCase().includes('maintain')) {
        calTarget = tdee;
      }

      const proteinTarget = Math.round(weight * 2.0); // 2g per kg

      return {
        bmr: Math.round(bmr),
        tdee,
        recommended_calories: Math.max(1400, calTarget),
        recommended_protein_g: proteinTarget,
        recommended_water_ml: Math.round(weight * 35)
      };
    }
  };

  LocalDB.init();
  window.LocalDB = LocalDB;
})();
