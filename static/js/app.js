/**
 * Daily Health Coach - Main Application Controller
 * Manages UI rendering, user actions, modals, date navigation, and Android PWA events.
 */

class HealthCoachApp {
  constructor() {
    this.currentDate = null;
    this.state = null;
    this.history = [];
    this.chart = null;
    this.deferredInstallPrompt = null;
    this.phoneViewActive = false;
    this.activeMobileTab = 'today';
    this.nextWaterReminderTime = Date.now() + 60 * 60 * 1000;
  }

  async init() {
    this.chart = new HealthCharts('trendChartContainer');
    this.bindEvents();
    this.initPWA();
    this.startWaterReminderScheduler();
    await this.refreshData();
    window.addEventListener('resize', () => this.chart.render());
  }

  async refreshData() {
    try {
      const [summary, history] = await Promise.all([
        API.getToday(this.currentDate),
        API.getHistory()
      ]);
      this.state = summary;
      this.history = history;
      this.render();
      this.chart.setData(this.history);

      const rangeVal = document.getElementById('historyRangeSelect')?.value || 14;
      await this.loadDetailedHistory(parseInt(rangeVal, 10));
    } catch (err) {
      console.error('Error refreshing data:', err);
      this.showToast('Offline mode active - using cached records', 'warning');
    }
  }

  render() {
    if (!this.state) return;

    // 1. Date & Streak Header
    this.renderHeader();

    // 2. Health Score Ring
    this.renderHealthScore();

    // 3. Transformation Roadmap (What will do, how much done, what can do)
    this.renderTransformationRoadmap();

    // 4. AI Coach Panel
    this.renderCoachTips();

    // 5. Hydration Engine
    this.renderHydration();

    // 6. Fuel & Macros (Protein focus)
    this.renderNutrition();

    // 7. Movement & Activity
    this.renderMovement();

    // 8. Micro-Habits Checklist
    this.renderHabits();

    // 9. Smartwatch Telemetry
    this.renderWearable();

    // 10. Discipline Streaks (No Fast Food, No Sweets)
    this.renderStreaks();

    // 11. Body Composition (Weight, Height, Target, BMI)
    this.renderBodyComposition();

    // 12. Water Reminder Countdown
    this.renderWaterReminder();
  }

  renderHeader() {
    const streakEl = document.getElementById('streakDaysDisplay');
    if (streakEl) streakEl.textContent = `${this.state.streak_days} Day Streak`;

    const dateHeading = document.getElementById('currentDateHeading');
    const dateSub = document.getElementById('currentDateSub');
    const datePicker = document.getElementById('datePickerInput');
    const todayJumpBtn = document.getElementById('todayJumpBtn');
    const dateStatusBadge = document.getElementById('dateStatusBadge');

    const todayStr = new Date().toISOString().split('T')[0];
    const isToday = this.state.date === todayStr;

    if (datePicker) {
      datePicker.value = this.state.date;
    }

    if (dateHeading && dateSub) {
      const d = new Date(this.state.date + 'T00:00:00');
      dateHeading.textContent = isToday ? 'Today' : d.toLocaleDateString(undefined, { weekday: 'long' });
      dateSub.textContent = d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
    }

    if (todayJumpBtn) {
      todayJumpBtn.style.display = isToday ? 'none' : 'inline-flex';
    }

    if (dateStatusBadge) {
      if (isToday) {
        dateStatusBadge.textContent = 'Live Active Day';
        dateStatusBadge.className = 'badge badge-emerald';
      } else {
        dateStatusBadge.textContent = `Viewing ${this.state.date}`;
        dateStatusBadge.className = 'badge badge-azure';
      }
    }
  }

  renderHealthScore() {
    const scoreVal = document.getElementById('healthScoreVal');
    const scoreGrade = document.getElementById('healthScoreGrade');
    const scoreCircle = document.getElementById('scoreRingProgress');

    if (scoreVal) scoreVal.textContent = this.state.health_score;
    if (scoreGrade) scoreGrade.textContent = this.state.score_grade;

    if (scoreCircle) {
      // Circumference = 2 * PI * 80 = ~502
      const circumference = 502;
      const offset = circumference - (this.state.health_score / 100) * circumference;
      scoreCircle.style.strokeDashoffset = offset;
    }

    // Breakdown mini stats
    const bd = this.state.score_breakdown || {};
    const setVal = (id, val) => {
      const el = document.getElementById(id);
      if (el) el.textContent = `${val}/25`;
    };
    setVal('breakdownHydra', bd.hydration_pts || 0);
    setVal('breakdownMove', bd.movement_pts || 0);
    setVal('breakdownFuel', bd.fuel_pts || 0);
    setVal('breakdownHabits', bd.habits_pts || 0);
  }

  renderCoachTips() {
    const container = document.getElementById('coachTipsContainer');
    if (!container) return;

    if (!this.state.coach_tips || this.state.coach_tips.length === 0) {
      container.innerHTML = `
        <div class="tip-card">
          <div class="tip-top">
            <span class="tip-icon">✨</span>
            <span class="tip-title">All Systems Balanced</span>
          </div>
          <p class="tip-message">You're cruising at optimal levels. Keep sipping water and moving!</p>
        </div>
      `;
      return;
    }

    container.innerHTML = this.state.coach_tips.map(tip => `
      <div class="tip-card urgency-${tip.urgency} animate-slide-up">
        <div class="tip-top">
          <span class="tip-icon">${tip.icon}</span>
          <span class="tip-title">${tip.title}</span>
        </div>
        <p class="tip-message">${tip.message}</p>
        ${tip.action_suggestion ? `
          <div class="tip-action">
            <span>↳ Tip:</span> ${tip.action_suggestion}
          </div>
        ` : ''}
      </div>
    `).join('');
  }

  renderHydration() {
    const bottleFill = document.getElementById('bottleFillLevel');
    const readout = document.getElementById('bottleReadout');
    const statText = document.getElementById('waterStatText');
    const logsContainer = document.getElementById('waterLogsContainer');

    const pct = Math.min(100, this.state.water_progress_pct);
    if (bottleFill) bottleFill.style.height = `${Math.max(10, pct)}%`;
    if (readout) readout.textContent = `${pct}%`;

    if (statText) {
      statText.textContent = `${this.state.water_total_ml.toLocaleString()} / ${this.state.targets.water_target_ml.toLocaleString()} ml`;
    }

    if (logsContainer) {
      if (!this.state.water_logs || this.state.water_logs.length === 0) {
        logsContainer.innerHTML = `<p style="font-size: 0.8rem; color: var(--text-muted);">No water logged yet today.</p>`;
      } else {
        logsContainer.innerHTML = this.state.water_logs.slice(0, 3).map(w => `
          <div class="activity-log-item">
            <span>💧 <strong>+${w.amount_ml}ml</strong> <small style="color: var(--text-muted); margin-left: 6px;">${w.timestamp || ''}</small></span>
            <button onclick="app.removeWater(${w.id})" style="color: var(--text-muted); font-size: 0.75rem;" title="Remove">✕</button>
          </div>
        `).join('');
      }
    }
  }

  renderNutrition() {
    // Calorie stats
    const remainingEl = document.getElementById('calRemainingDisplay');
    const consumedEl = document.getElementById('calConsumedDisplay');
    const burnedEl = document.getElementById('calBurnedDisplay');
    const targetEl = document.getElementById('calTargetDisplay');

    if (remainingEl) remainingEl.textContent = this.state.calories_remaining.toLocaleString();
    if (consumedEl) consumedEl.textContent = `${this.state.calories_consumed.toLocaleString()} kcal`;
    if (burnedEl) burnedEl.textContent = `${this.state.calories_burned.toLocaleString()} kcal`;
    if (targetEl) targetEl.textContent = `${this.state.targets.calories_target.toLocaleString()} kcal`;

    // Protein meter (Highlight feature)
    const protText = document.getElementById('proteinStatText');
    const protFill = document.getElementById('proteinProgressFill');
    const protPct = Math.min(100, this.state.protein_progress_pct);

    if (protText) {
      protText.textContent = `${this.state.protein_total_g}g / ${this.state.targets.protein_target_g}g (${protPct}%)`;
    }
    if (protFill) {
      protFill.style.width = `${protPct}%`;
    }

    // Carbs & Fat
    const carbsText = document.getElementById('carbsStatText');
    const carbsFill = document.getElementById('carbsProgressFill');
    const carbsPct = Math.min(100, Math.round((this.state.carbs_total_g / this.state.targets.carbs_target_g) * 100));
    if (carbsText) carbsText.textContent = `${this.state.carbs_total_g}g / ${this.state.targets.carbs_target_g}g`;
    if (carbsFill) carbsFill.style.width = `${carbsPct}%`;

    const fatText = document.getElementById('fatStatText');
    const fatFill = document.getElementById('fatProgressFill');
    const fatPct = Math.min(100, Math.round((this.state.fat_total_g / this.state.targets.fat_target_g) * 100));
    if (fatText) fatText.textContent = `${this.state.fat_total_g}g / ${this.state.targets.fat_target_g}g`;
    if (fatFill) fatFill.style.width = `${fatPct}%`;
  }

  renderMovement() {
    const stepsBig = document.getElementById('stepsBigNumber');
    const stepsSub = document.getElementById('stepsTargetSub');
    const activeMin = document.getElementById('activeMinutesDisplay');
    const burnedEl = document.getElementById('movementCaloriesDisplay');
    const activitiesList = document.getElementById('activityLogsContainer');

    if (stepsBig) stepsBig.textContent = this.state.steps_total.toLocaleString();
    if (stepsSub) stepsSub.textContent = `Goal: ${this.state.targets.steps_target.toLocaleString()} steps (${this.state.steps_progress_pct}%)`;
    if (activeMin) activeMin.textContent = `${this.state.active_minutes_total}m`;
    if (burnedEl) burnedEl.textContent = `${this.state.calories_burned} kcal`;

    if (activitiesList) {
      if (!this.state.activity_logs || this.state.activity_logs.length === 0) {
        activitiesList.innerHTML = `<p style="font-size: 0.8rem; color: var(--text-muted);">No workouts logged today.</p>`;
      } else {
        activitiesList.innerHTML = this.state.activity_logs.map(a => `
          <div class="activity-log-item">
            <div>
              <strong>${a.name}</strong>
              <div style="font-size: 0.75rem; color: var(--text-muted);">
                ${a.duration_min} min • ${a.calories_burned} kcal • ${a.steps > 0 ? a.steps + ' steps' : a.intensity}
              </div>
            </div>
            <button onclick="app.removeActivity(${a.id})" style="color: var(--text-muted); font-size: 0.75rem;" title="Remove">✕</button>
          </div>
        `).join('');
      }
    }
  }

  renderWearable() {
    const w = this.state.wearable;
    const t = this.state.latest_telemetry;
    if (!w && !t) return;

    if (w) {
      const nameEl = document.getElementById('watchModelName');
      const syncTag = document.getElementById('watchSyncTag');
      const batTag = document.getElementById('watchBatteryTag');

      if (nameEl) nameEl.textContent = `${w.model_name}`;
      if (syncTag) syncTag.textContent = `${w.provider} • ${w.last_sync_timestamp}`;
      if (batTag) batTag.textContent = `🔋 ${w.battery_pct}%`;
    }

    if (t) {
      const hrEl = document.getElementById('watchHeartRateBpm');
      const zoneBadge = document.getElementById('watchHrZoneBadge');
      const stepsEl = document.getElementById('watchSensorSteps');
      const sleepEl = document.getElementById('watchSleepVal');
      const sleepQuality = document.getElementById('watchSleepQuality');

      if (hrEl) hrEl.textContent = t.heart_rate_bpm;
      if (zoneBadge) {
        zoneBadge.textContent = t.hr_zone;
        zoneBadge.className = `badge ${t.heart_rate_bpm > 110 ? 'badge-amber' : 'badge-emerald'}`;
      }
      if (stepsEl) stepsEl.textContent = (t.steps || this.state.steps_total).toLocaleString();
      if (sleepEl) sleepEl.textContent = `${t.sleep_hours || 7.5}h`;
      if (sleepQuality) sleepQuality.textContent = `${t.sleep_quality_pct || 88}% Quality`;
    }
  }

  // --- Discipline Streaks (No Fast Food, No Sweets) ---

  renderStreaks() {
    const fastFoodEl = document.getElementById('noFastFoodStreakVal');
    const sweetsEl = document.getElementById('noSweetsStreakVal');
    const btnFastFood = document.getElementById('btnToggleFastFood');
    const btnSweets = document.getElementById('btnToggleSweets');

    if (fastFoodEl) fastFoodEl.innerHTML = `🔥 ${this.state.no_fastfood_streak || 8}d`;
    if (sweetsEl) sweetsEl.innerHTML = `🔥 ${this.state.no_sweets_streak || 5}d`;

    if (this.state.habits) {
      const hFF = this.state.habits.find(h => h.id === 'habit_no_fastfood');
      if (hFF && btnFastFood) {
        btnFastFood.textContent = hFF.completed ? 'Checked ✓' : 'Check Today';
        btnFastFood.classList.toggle('active', hFF.completed);
      }

      const hSW = this.state.habits.find(h => h.id === 'habit_no_sweets');
      if (hSW && btnSweets) {
        btnSweets.textContent = hSW.completed ? 'Checked ✓' : 'Check Today';
        btnSweets.classList.toggle('active', hSW.completed);
      }
    }
  }

  async toggleSpecificHabit(habitId) {
    await this.toggleHabit(habitId);
    this.renderStreaks();
  }

  // --- Body Composition & Target Weight ---

  renderBodyComposition() {
    const t = this.state.targets || {};
    const curWeightEl = document.getElementById('bodyCurrentWeight');
    const heightEl = document.getElementById('bodyHeight');
    const goalWeightEl = document.getElementById('bodyTargetWeight');
    const diffEl = document.getElementById('bodyWeightToLose');
    const fillEl = document.getElementById('bodyWeightProgressFill');
    const bmiBadge = document.getElementById('bodyBmiBadge');

    if (curWeightEl) curWeightEl.textContent = t.current_weight_kg || 78.5;
    if (heightEl) heightEl.textContent = t.height_cm || 175;
    if (goalWeightEl) goalWeightEl.textContent = t.target_weight_kg || 72.0;

    if (diffEl) {
      const diff = this.state.weight_to_target_kg;
      diffEl.textContent = `${diff > 0 ? '-' : '+'}${Math.abs(diff)} kg to target`;
      diffEl.style.color = diff <= 0 ? 'var(--emerald-400)' : 'var(--amber-400)';
    }

    if (fillEl) {
      fillEl.style.width = `${this.state.weight_progress_pct || 65}%`;
    }

    if (bmiBadge) {
      bmiBadge.textContent = `BMI: ${this.state.bmi || 25.6} • ${this.state.bmi_category || 'Normal'}`;
    }

    // Populate Target Settings modal inputs if empty
    const inputCur = document.getElementById('targetCurrentWeight');
    const inputH = document.getElementById('targetHeight');
    const inputGoal = document.getElementById('targetGoalWeight');
    const inputInterval = document.getElementById('targetWaterInterval');

    if (inputCur && !inputCur.value) inputCur.value = t.current_weight_kg || 78.5;
    if (inputH && !inputH.value) inputH.value = t.height_cm || 175;
    if (inputGoal && !inputGoal.value) inputGoal.value = t.target_weight_kg || 72.0;
    if (inputInterval && !inputInterval.value) inputInterval.value = t.water_reminder_interval_min || 60;
  }

  // --- Water Reminder Scheduler ---

  startWaterReminderScheduler() {
    setInterval(() => {
      this.renderWaterReminder();
    }, 1000);
  }

  renderWaterReminder() {
    const countdownEl = document.getElementById('waterReminderCountdown');
    const statusEl = document.getElementById('waterReminderStatusText');
    const intervalMin = (this.state && this.state.targets && this.state.targets.water_reminder_interval_min) || 60;

    if (statusEl) {
      statusEl.textContent = `Interval: Every ${intervalMin}m`;
    }

    const now = Date.now();
    const diffMs = this.nextWaterReminderTime - now;

    if (diffMs <= 0) {
      // Trigger water reminder chime!
      window.soundEngine.playChime('water');
      window.soundEngine.vibrate([30, 40, 30]);
      this.showToast('💧 Time to Hydrate! Drink a glass of water (250ml)', 'info');
      // Reset timer
      this.nextWaterReminderTime = Date.now() + intervalMin * 60 * 1000;
      return;
    }

    if (countdownEl) {
      const mins = Math.floor(diffMs / 60000);
      const secs = Math.floor((diffMs % 60000) / 1000);
      countdownEl.textContent = `⏳ In ${mins}m ${secs < 10 ? '0' : ''}${secs}s`;
    }
  }

  testWaterReminder() {
    window.soundEngine.playChime('water');
    window.soundEngine.vibrate([30, 40, 30]);
    this.showToast('💧 [TEST REMINDER] Time to hydrate! Sip 250ml water now 🔔', 'info');
  }

  renderHabits() {
    const container = document.getElementById('habitsChecklistContainer');
    const habitsSummaryText = document.getElementById('habitsSummaryText');

    if (habitsSummaryText) {
      habitsSummaryText.textContent = `${this.state.habits_completed}/${this.state.habits_total} Completed`;
    }

    if (!container) return;
    container.innerHTML = this.state.habits.map(h => `
      <div class="habit-row ${h.completed ? 'completed' : ''}" onclick="app.toggleHabit('${h.id}')">
        <div class="habit-info-left">
          <div class="habit-custom-checkbox">
            <svg class="habit-checkbox-icon" viewBox="0 0 24 24">
              <polyline points="20 6 9 17 4 12"></polyline>
            </svg>
          </div>
          <div>
            <span class="habit-title-text">${h.icon} ${h.title}</span>
            <div style="font-size: 0.72rem; color: var(--text-muted);">${h.category}</div>
          </div>
        </div>
        <div class="habit-streak-tag">
          <span>🔥</span> ${h.streak_count}d
        </div>
      </div>
    `).join('');
  }

  // --- Actions ---

  async quickAddWater(amount_ml) {
    window.soundEngine.playChime('water');
    this.showToast(`+${amount_ml}ml water logged! 💧`);
    try {
      this.state = await API.logWater(amount_ml, 'Quick log', this.currentDate);
      this.render();
    } catch (e) {
      this.showToast('Failed to log water', 'error');
    }
  }

  async removeWater(id) {
    window.soundEngine.playChime('pop');
    this.state = await API.deleteWater(id, this.currentDate);
    this.render();
    this.showToast('Water entry deleted');
  }

  async quickAddFoodPreset(presetKey) {
    const presets = {
      yogurt: { name: "Greek Yogurt & Berries", meal_type: "Snack", calories: 280, protein_g: 22, carbs_g: 30, fat_g: 5 },
      chicken: { name: "Grilled Chicken Salad", meal_type: "Lunch", calories: 520, protein_g: 44, carbs_g: 32, fat_g: 14 },
      shake: { name: "Whey Protein Shake", meal_type: "Snack", calories: 200, protein_g: 27, carbs_g: 8, fat_g: 3 },
      eggs: { name: "Scrambled Eggs & Toast", meal_type: "Breakfast", calories: 380, protein_g: 20, carbs_g: 28, fat_g: 18 }
    };

    const item = presets[presetKey];
    if (!item) return;

    window.soundEngine.playChime('habit');
    this.showToast(`+${item.protein_g}g Protein logged! (${item.name}) 🥗`);
    try {
      this.state = await API.logFood({ ...item, date: this.currentDate });
      this.render();
    } catch (e) {
      this.showToast('Failed to log food', 'error');
    }
  }

  async removeFood(id) {
    window.soundEngine.playChime('pop');
    this.state = await API.deleteFood(id, this.currentDate);
    this.render();
    this.showToast('Meal removed');
  }

  async quickAddActivityPreset(presetKey) {
    const presets = {
      walk: { name: "30-min Brisk Walk", duration_min: 30, calories_burned: 150, steps: 3500, intensity: "Moderate" },
      gym: { name: "Strength & Gym Workout", duration_min: 45, calories_burned: 280, steps: 1800, intensity: "High" },
      run: { name: "25-min Outdoor Jog", duration_min: 25, calories_burned: 240, steps: 3800, intensity: "High" },
      yoga: { name: "20-min Morning Yoga / Mobility", duration_min: 20, calories_burned: 80, steps: 400, intensity: "Low" }
    };

    const act = presets[presetKey];
    if (!act) return;

    window.soundEngine.playChime('achievement');
    this.showToast(`Logged workout: ${act.name} (+${act.calories_burned} kcal) 🏃`);
    try {
      this.state = await API.logActivity({ ...act, date: this.currentDate });
      this.render();
    } catch (e) {
      this.showToast('Failed to log activity', 'error');
    }
  }

  async removeActivity(id) {
    window.soundEngine.playChime('pop');
    this.state = await API.deleteActivity(id, this.currentDate);
    this.render();
    this.showToast('Activity entry removed');
  }

  // --- Smartwatch & Wearable Actions ---

  async syncWatchTelemetry() {
    const iconSpan = document.getElementById('syncIconSpan');
    if (iconSpan) iconSpan.classList.add('spin-sync');

    window.soundEngine.playChime('water');
    this.showToast('Connecting to Smartwatch Sensor Stream... ⌚', 'info');

    try {
      this.state = await API.simulateWatchPulse(this.currentDate);
      this.history = await API.getHistory();
      this.render();
      this.chart.setData(this.history);

      const w = this.state.wearable;
      const t = this.state.latest_telemetry;
      window.soundEngine.playChime('achievement');
      this.showToast(`Synced ${w ? w.model_name : 'Watch'}! ${t ? t.steps.toLocaleString() + ' steps, ' + t.heart_rate_bpm + ' BPM 💓' : ''}`);
    } catch (err) {
      console.error('Watch sync error:', err);
      this.showToast('Failed to sync with smartwatch', 'error');
    } finally {
      if (iconSpan) iconSpan.classList.remove('spin-sync');
    }
  }

  async sendManualWatchTelemetry() {
    const stepsInput = document.getElementById('manualWatchSteps');
    const hrInput = document.getElementById('manualWatchHr');

    const stepsVal = stepsInput && stepsInput.value ? parseInt(stepsInput.value, 10) : undefined;
    const hrVal = hrInput && hrInput.value ? parseInt(hrInput.value, 10) : undefined;

    window.soundEngine.playChime('habit');
    try {
      this.state = await API.syncWearable({
        steps: stepsVal,
        heart_rate_bpm: hrVal,
        date: this.currentDate
      });
      this.history = await API.getHistory();
      this.render();
      this.chart.setData(this.history);
      this.closeModal('modalWearableManage');
      this.showToast(`Smartwatch telemetry pushed successfully! ⌚`);
    } catch (err) {
      this.showToast('Error syncing watch data', 'error');
    }
  }

  async toggleHabit(habitId) {
    window.soundEngine.playChime('habit');
    try {
      this.state = await API.toggleHabit(habitId, this.currentDate);
      this.render();
      window.dispatchEvent(new CustomEvent('habitToggled', { detail: { habitId, completed: this.state.habits_completed } }));
      if (this.state.habits_completed === this.state.habits_total) {
        window.soundEngine.playChime('achievement');
        this.showToast('🎉 All daily habits completed! Consistency level 100%');
        if (window.AdsManager) {
          window.AdsManager.showInterstitial('🎉 Daily Habits 100% Complete! Streak Maintained!');
        }
      }
    } catch (e) {
      this.showToast('Failed to update habit', 'error');
    }
  }

  async resetToDemo() {
    if (confirm('Load realistic sample day data?')) {
      window.soundEngine.playChime('pop');
      this.state = await API.resetSeed();
      this.history = await API.getHistory();
      this.render();
      this.chart.setData(this.history);
      this.showToast('Demo day data loaded successfully! 🌿');
    }
  }

  // --- Date Navigation & Historical Tracking ---

  shiftDate(deltaDays) {
    const baseDate = this.state && this.state.date ? new Date(this.state.date + 'T00:00:00') : new Date();
    baseDate.setDate(baseDate.getDate() + deltaDays);
    this.currentDate = baseDate.toISOString().split('T')[0];
    window.soundEngine.playChime('pop');
    this.refreshData();
  }

  onDateInputChange(dateStr) {
    if (!dateStr) return;
    this.currentDate = dateStr;
    window.soundEngine.playChime('pop');
    this.refreshData();
  }

  jumpToToday() {
    this.currentDate = new Date().toISOString().split('T')[0];
    window.soundEngine.playChime('success');
    this.refreshData();
  }

  loadSpecificDate(dateStr) {
    this.currentDate = dateStr;
    window.soundEngine.playChime('pop');
    this.refreshData();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  // --- Transformation Roadmap ---

  renderTransformationRoadmap() {
    const roadmap = this.state.transformation_roadmap;
    if (!roadmap) return;

    // Goal badge
    const badge = document.getElementById('roadmapGoalBadge');
    if (badge) badge.textContent = roadmap.goal_title;

    // What Will Do
    const dailyCals = document.getElementById('roadmapDailyCals');
    if (dailyCals) dailyCals.textContent = roadmap.daily_calorie_target.toLocaleString();

    const defBadge = document.getElementById('roadmapDeficitBadge');
    if (defBadge) {
      if (roadmap.daily_deficit_or_surplus < 0) {
        defBadge.textContent = `${roadmap.daily_deficit_or_surplus} kcal Deficit`;
        defBadge.className = 'badge badge-amber';
      } else if (roadmap.daily_deficit_or_surplus > 0) {
        defBadge.textContent = `+${roadmap.daily_deficit_or_surplus} kcal Surplus`;
        defBadge.className = 'badge badge-azure';
      } else {
        defBadge.textContent = 'Maintenance Balance';
        defBadge.className = 'badge badge-emerald';
      }
    }

    const targetProt = document.getElementById('roadmapTargetProtein');
    if (targetProt) targetProt.textContent = `${roadmap.daily_protein_target}g`;

    const targetDate = document.getElementById('roadmapTargetDate');
    if (targetDate) targetDate.textContent = roadmap.projected_completion_date;

    const planSummary = document.getElementById('roadmapPlanSummary');
    if (planSummary) planSummary.textContent = roadmap.what_will_do_summary;

    // How Much Done
    const shifted = document.getElementById('roadmapWeightShifted');
    if (shifted) shifted.textContent = roadmap.weight_shifted_kg;

    const goalPctBadge = document.getElementById('roadmapGoalPctBadge');
    if (goalPctBadge) goalPctBadge.textContent = `${roadmap.goal_achieved_pct}% Achieved`;

    const progBar = document.getElementById('roadmapProgressBar');
    if (progBar) progBar.style.width = `${Math.min(100, Math.max(5, roadmap.goal_achieved_pct))}%`;

    const startW = document.getElementById('roadmapStartWeight');
    if (startW) startW.textContent = `${this.state.targets.starting_weight_kg || 80.0}kg`;

    const curW = document.getElementById('roadmapCurrentWeight');
    if (curW) curW.textContent = `${this.state.targets.current_weight_kg}kg`;

    const goalW = document.getElementById('roadmapTargetWeight');
    if (goalW) goalW.textContent = `${this.state.targets.target_weight_kg}kg`;

    const doneSummary = document.getElementById('roadmapDoneSummary');
    if (doneSummary) doneSummary.textContent = roadmap.how_much_done_summary;

    // What Can Do Actions
    const list = document.getElementById('roadmapActionsList');
    if (list) {
      list.innerHTML = '';
      (roadmap.what_can_do_actions || []).forEach(action => {
        const item = document.createElement('div');
        item.className = `roadmap-action-item ${action.done ? 'done' : ''}`;
        item.innerHTML = `
          <div class="roadmap-action-content">
            <span class="roadmap-action-icon">${action.icon}</span>
            <div>
              <div class="roadmap-action-title">${action.title}</div>
              <div class="roadmap-action-subtitle">${action.subtitle}</div>
            </div>
          </div>
          ${!action.done && action.category === 'hydration' ? `
            <button class="btn-chip" style="padding: 3px 8px; font-size: 0.7rem;" onclick="app.quickAddWater(250)">+250ml</button>
          ` : ''}
          ${action.done ? `
            <span class="badge badge-emerald" style="font-size: 0.65rem; padding: 2px 6px;">Done</span>
          ` : ''}
        `;
        list.appendChild(item);
      });
    }
  }

  // --- Detailed History Table Explorer ---

  async loadDetailedHistory(days = 14) {
    try {
      const records = await API.getDetailedHistory(days);
      this.renderDetailedHistory(records);
    } catch (err) {
      console.warn('Error loading detailed history:', err);
    }
  }

  renderDetailedHistory(records) {
    const tbody = document.getElementById('dateWiseTableBody');
    if (!tbody) return;
    tbody.innerHTML = '';

    records.forEach(r => {
      const isCurrent = r.date === this.state.date;
      const tr = document.createElement('tr');
      if (isCurrent) tr.className = 'active-date-row';

      let scoreClass = 'low';
      if (r.health_score >= 90) scoreClass = 'elite';
      else if (r.health_score >= 75) scoreClass = 'good';
      else if (r.health_score >= 55) scoreClass = 'fair';

      tr.innerHTML = `
        <td>
          <div style="font-weight: 700; color: #ffffff;">${r.label}</div>
          <div style="font-size: 0.7rem; color: var(--text-muted);">${r.date}</div>
        </td>
        <td><strong>${r.weight_kg}</strong> kg</td>
        <td><strong>${r.protein_g}</strong>g</td>
        <td>${r.calories_consumed.toLocaleString()} kcal</td>
        <td>${r.calories_burned.toLocaleString()} kcal</td>
        <td><strong>${r.net_calories.toLocaleString()}</strong> kcal</td>
        <td>${r.steps.toLocaleString()}</td>
        <td>${r.water_ml.toLocaleString()} ml</td>
        <td>${r.habits_completed} done</td>
        <td><span class="score-badge-table ${scoreClass}">${r.health_score}</span></td>
        <td>
          <button class="day-load-btn" onclick="app.loadSpecificDate('${r.date}')" title="Load full tracker for ${r.date}">
            ${isCurrent ? 'Viewing' : 'Load Day'}
          </button>
        </td>
      `;
      tbody.appendChild(tr);
    });
  }

  // --- Metabolism Calculation Engine Preview ---

  async previewMetabolismCalculation() {
    try {
      const payload = {
        age: parseInt(document.getElementById('targetAge').value, 10) || 28,
        gender: document.getElementById('targetGender').value || 'Male',
        height_cm: parseFloat(document.getElementById('targetHeight').value) || 175.0,
        current_weight_kg: parseFloat(document.getElementById('targetCurrentWeight').value) || 78.5,
        target_weight_kg: parseFloat(document.getElementById('targetGoalWeight').value) || 72.0,
        fitness_goal: document.getElementById('targetFitnessGoal').value || 'Lose Weight',
        activity_level: document.getElementById('targetActivityLevel').value || 'Moderately Active'
      };

      const res = await API.calculateMetabolism(payload);

      // Populate preview box
      const box = document.getElementById('metabolismPreviewBox');
      if (box) {
        box.style.display = 'flex';
        document.getElementById('metaPreviewGoalTitle').textContent = res.goal_label;
        document.getElementById('metaPreviewBmr').textContent = res.bmr_kcal.toLocaleString();
        document.getElementById('metaPreviewTdee').textContent = res.tdee_kcal.toLocaleString();
        document.getElementById('metaPreviewCals').textContent = res.recommended_calories.toLocaleString();
        document.getElementById('metaPreviewProt').textContent = `${res.recommended_protein_g}g`;
      }

      // Auto-fill target inputs
      document.getElementById('targetCalories').value = res.recommended_calories;
      document.getElementById('targetProtein').value = res.recommended_protein_g;
      document.getElementById('targetCarbs').value = res.recommended_carbs_g;
      document.getElementById('targetFat').value = res.recommended_fat_g;

      window.soundEngine.playChime('achievement');
      this.showToast('Mifflin-St Jeor targets calculated and auto-filled! ⚡');
    } catch (err) {
      console.error('Metabolism calculation error:', err);
      this.showToast('Could not calculate metabolism', 'warning');
    }
  }

  // --- View Mode & Modals ---

  togglePhonePreview() {
    this.phoneViewActive = !this.phoneViewActive;
    const phoneWrapper = document.getElementById('phoneFrameWrapper');
    const dashboardGrid = document.getElementById('dashboardMainGrid');
    const toggleBtn = document.getElementById('viewModeBtn');

    if (this.phoneViewActive) {
      if (phoneWrapper) phoneWrapper.classList.add('active');
      if (dashboardGrid) dashboardGrid.style.display = 'none';
      if (toggleBtn) {
        toggleBtn.classList.add('active');
        toggleBtn.innerHTML = `🖥️ Switch to Web Dashboard`;
      }
      this.showToast('Switched to Android Mobile App View 📱');
    } else {
      if (phoneWrapper) phoneWrapper.classList.remove('active');
      if (dashboardGrid) dashboardGrid.style.display = 'grid';
      if (toggleBtn) {
        toggleBtn.classList.remove('active');
        toggleBtn.innerHTML = `📱 Android App View`;
      }
      this.showToast('Switched to Web Dashboard View 🖥️');
    }
    setTimeout(() => this.chart.render(), 100);
  }

  openModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
      modal.classList.add('open');
      document.body.classList.add('modal-open');
      window.soundEngine?.playChime('pop');

      const dialog = modal.querySelector('.modal-dialog');
      if (dialog) dialog.scrollTop = 0;

      if (modalId === 'modalSettings' && this.state && this.state.targets) {
        const t = this.state.targets;
        if (document.getElementById('targetAge')) document.getElementById('targetAge').value = t.age || 28;
        if (document.getElementById('targetGender')) document.getElementById('targetGender').value = t.gender || 'Male';
        if (document.getElementById('targetHeight')) document.getElementById('targetHeight').value = t.height_cm || 175;
        if (document.getElementById('targetCurrentWeight')) document.getElementById('targetCurrentWeight').value = t.current_weight_kg || 78.5;
        if (document.getElementById('targetStartWeight')) document.getElementById('targetStartWeight').value = t.starting_weight_kg || 80.0;
        if (document.getElementById('targetGoalWeight')) document.getElementById('targetGoalWeight').value = t.target_weight_kg || 72.0;
        if (document.getElementById('targetFitnessGoal')) document.getElementById('targetFitnessGoal').value = t.fitness_goal || 'Lose Weight';
        if (document.getElementById('targetActivityLevel')) document.getElementById('targetActivityLevel').value = t.activity_level || 'Moderately Active';
        if (document.getElementById('targetCalories')) document.getElementById('targetCalories').value = t.calories_target || 2100;
        if (document.getElementById('targetProtein')) document.getElementById('targetProtein').value = t.protein_target_g || 130;
        if (document.getElementById('targetCarbs')) document.getElementById('targetCarbs').value = t.carbs_target_g || 220;
        if (document.getElementById('targetFat')) document.getElementById('targetFat').value = t.fat_target_g || 65;
        if (document.getElementById('targetSleep')) document.getElementById('targetSleep').value = t.sleep_target_hours || 8.0;
        if (document.getElementById('targetWater')) document.getElementById('targetWater').value = t.water_target_ml || 2500;
        if (document.getElementById('targetSteps')) document.getElementById('targetSteps').value = t.steps_target || 10000;
        if (document.getElementById('targetWaterInterval')) document.getElementById('targetWaterInterval').value = t.water_reminder_interval_min || 60;
      }
    }
  }

  closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
      modal.classList.remove('open');
      window.soundEngine?.playChime('pop');
      if (!document.querySelector('.modal-backdrop.open')) {
        document.body.classList.remove('modal-open');
      }
    }
  }

  switchMobileTab(tabName) {
    this.activeMobileTab = tabName;
    document.querySelectorAll('.nav-tab-item').forEach(el => {
      el.classList.toggle('active', el.dataset.tab === tabName);
    });

    const targetSection = document.getElementById(`section-${tabName}`);
    if (targetSection) {
      targetSection.scrollIntoView({ behavior: 'smooth' });
    }
  }

  showToast(message, type = 'success') {
    const container = document.getElementById('toastContainer');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.innerHTML = `<span>${message}</span>`;
    container.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(10px)';
      setTimeout(() => toast.remove(), 300);
    }, 2800);
  }

  initPWA() {
    // Service Worker Registration (skip in native Capacitor app)
    if ('serviceWorker' in navigator && !window.Capacitor) {
      window.addEventListener('load', () => {
        navigator.serviceWorker.register('sw.js').then(reg => {
          console.log('Daily Health Coach SW registered:', reg.scope);
        }).catch(err => {
          console.warn('SW registration error:', err);
        });
      });
    }

    // Capture install prompt
    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      this.deferredInstallPrompt = e;
      const installBtn = document.getElementById('pwaInstallBtn');
      if (installBtn) {
        installBtn.style.display = 'inline-flex';
        installBtn.addEventListener('click', () => {
          this.installPWA();
        });
      }
    });
  }

  async installPWA() {
    if (this.deferredInstallPrompt) {
      this.deferredInstallPrompt.prompt();
      const { outcome } = await this.deferredInstallPrompt.userChoice;
      if (outcome === 'accepted') {
        this.showToast('Installing Daily Health Coach on your device! 📲');
      }
      this.deferredInstallPrompt = null;
      const installBtn = document.getElementById('pwaInstallBtn');
      if (installBtn) installBtn.style.display = 'none';
    }
  }

  bindEvents() {
    // Sound Toggle
    const soundBtn = document.getElementById('soundToggleBtn');
    if (soundBtn) {
      soundBtn.addEventListener('click', () => {
        const enabled = window.soundEngine.toggleSound();
        soundBtn.textContent = enabled ? '🔊 Sound On' : '🔇 Sound Off';
        this.showToast(enabled ? 'Sound feedback active' : 'Sound muted');
      });
    }

    // Metric Switcher for 7-Day Chart
    document.querySelectorAll('.metric-chip').forEach(btn => {
      btn.addEventListener('click', (e) => {
        document.querySelectorAll('.metric-chip').forEach(b => b.classList.remove('active'));
        e.currentTarget.classList.add('active');
        this.chart.setMetric(e.currentTarget.dataset.metric);
      });
    });

    // Custom Water Form
    const waterForm = document.getElementById('customWaterForm');
    if (waterForm) {
      waterForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const amt = parseInt(document.getElementById('customWaterAmount').value, 10);
        const note = document.getElementById('customWaterNote').value;
        if (amt > 0) {
          await API.logWater(amt, note, this.currentDate);
          this.closeModal('modalCustomWater');
          waterForm.reset();
          await this.refreshData();
          this.showToast(`+${amt}ml water recorded! 💧`);
        }
      });
    }

    // Custom Meal Form
    const mealForm = document.getElementById('customMealForm');
    if (mealForm) {
      mealForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const meal = {
          name: document.getElementById('customMealName').value,
          meal_type: document.getElementById('customMealType').value,
          calories: parseInt(document.getElementById('customMealCals').value, 10) || 0,
          protein_g: parseFloat(document.getElementById('customMealProtein').value) || 0,
          carbs_g: parseFloat(document.getElementById('customMealCarbs').value) || 0,
          fat_g: parseFloat(document.getElementById('customMealFat').value) || 0,
          date: this.currentDate
        };
        await API.logFood(meal);
        this.closeModal('modalCustomMeal');
        mealForm.reset();
        await this.refreshData();
        this.showToast(`Logged ${meal.name} (+${meal.protein_g}g Protein) 🥗`);
      });
    }

    // Custom Workout Form
    const actForm = document.getElementById('customActivityForm');
    if (actForm) {
      actForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const act = {
          name: document.getElementById('customActName').value,
          duration_min: parseInt(document.getElementById('customActDuration').value, 10) || 15,
          calories_burned: parseInt(document.getElementById('customActCals').value, 10) || 0,
          steps: parseInt(document.getElementById('customActSteps').value, 10) || 0,
          intensity: document.getElementById('customActIntensity').value,
          date: this.currentDate
        };
        await API.logActivity(act);
        this.closeModal('modalCustomActivity');
        actForm.reset();
        await this.refreshData();
        this.showToast(`Logged workout: ${act.name}! 👟`);
      });
    }

    // Settings / Targets Form
    const targetsForm = document.getElementById('targetsForm');
    if (targetsForm) {
      targetsForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const newTargets = {
          age: parseInt(document.getElementById('targetAge').value, 10) || 28,
          gender: document.getElementById('targetGender').value || 'Male',
          height_cm: parseFloat(document.getElementById('targetHeight').value) || 175.0,
          current_weight_kg: parseFloat(document.getElementById('targetCurrentWeight').value) || 78.5,
          starting_weight_kg: parseFloat(document.getElementById('targetStartWeight').value) || 80.0,
          target_weight_kg: parseFloat(document.getElementById('targetGoalWeight').value) || 72.0,
          fitness_goal: document.getElementById('targetFitnessGoal').value || 'Lose Weight',
          activity_level: document.getElementById('targetActivityLevel').value || 'Moderately Active',
          calories_target: parseInt(document.getElementById('targetCalories').value, 10),
          protein_target_g: parseInt(document.getElementById('targetProtein').value, 10),
          carbs_target_g: parseInt(document.getElementById('targetCarbs').value, 10),
          fat_target_g: parseInt(document.getElementById('targetFat').value, 10),
          sleep_target_hours: parseFloat(document.getElementById('targetSleep').value),
          water_target_ml: parseInt(document.getElementById('targetWater').value, 10),
          steps_target: parseInt(document.getElementById('targetSteps').value, 10),
          water_reminder_interval_min: parseInt(document.getElementById('targetWaterInterval').value, 10) || 60
        };
        await API.updateTargets(newTargets, this.currentDate);
        this.nextWaterReminderTime = Date.now() + newTargets.water_reminder_interval_min * 60 * 1000;
        this.closeModal('modalSettings');
        await this.refreshData();
        this.showToast('Profile, goals and targets updated successfully! 🎯');
      });
    }

    // Log Weight Form
    const weightForm = document.getElementById('logWeightForm');
    if (weightForm) {
      weightForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const wKg = parseFloat(document.getElementById('inputWeighInKg').value);
        const note = document.getElementById('inputWeighInNote').value;

        if (wKg > 0) {
          window.soundEngine.playChime('achievement');
          await API.logWeight(wKg, note, this.currentDate);
          this.closeModal('modalLogWeight');
          weightForm.reset();
          await this.refreshData();
          this.showToast(`Logged new weight: ${wKg} kg! ⚖️`);
        }
      });
    }

    // Wearable Pairing Form
    const wearForm = document.getElementById('wearablePairForm');
    if (wearForm) {
      wearForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const brand = document.getElementById('wearableBrandSelect').value;
        const model = document.getElementById('wearableModelInput').value;

        window.soundEngine.playChime('achievement');
        await API.pairWearable(brand, model);
        this.closeModal('modalWearableManage');
        await this.refreshData();
        this.showToast(`Connected & paired with ${model}! ⌚`);
      });
    }

    // Universal Modal Backdrop Click to Close (Android & Desktop)
    document.querySelectorAll('.modal-backdrop').forEach(backdrop => {
      backdrop.addEventListener('click', (e) => {
        if (e.target === backdrop) {
          this.closeModal(backdrop.id);
        }
      });
    });

    // Keyboard ESC Key to Close
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        const openModals = document.querySelectorAll('.modal-backdrop.open');
        openModals.forEach(m => this.closeModal(m.id));
      }
    });
  }
}

// Global App Instance
window.app = new HealthCoachApp();
document.addEventListener('DOMContentLoaded', () => window.app.init());
