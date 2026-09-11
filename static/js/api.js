/**
 * Daily Health Coach - Universal Hybrid API & On-Device Storage Driver
 * Automatically uses the Python backend if available, or operates 100% standalone
 * on-device (Zero Server Required) using LocalDB.
 */

const API = {
  baseUrl: '',
  _backendAvailable: null, // null = unknown, true = online, false = standalone on-device

  async checkBackend() {
    if (this._backendAvailable !== null) return this._backendAvailable;
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 1500);
      const res = await fetch(`${this.baseUrl}/api/health`, { signal: controller.signal });
      clearTimeout(timeoutId);
      this._backendAvailable = res.ok;
    } catch (e) {
      console.info('Running in 100% Standalone On-Device Mode (Zero Server Needed).');
      this._backendAvailable = false;
    }
    return this._backendAvailable;
  },

  async request(endpoint, options = {}) {
    const hasBackend = await this.checkBackend();
    if (!hasBackend) {
      throw new Error('Backend not available - using local storage');
    }

    try {
      const res = await fetch(`${this.baseUrl}${endpoint}`, {
        headers: {
          'Content-Type': 'application/json',
          ...options.headers
        },
        ...options
      });

      if (!res.ok) {
        throw new Error(`HTTP error ${res.status}`);
      }

      const data = await res.json();
      if (endpoint.startsWith('/api/today')) {
        localStorage.setItem('cached_today_summary', JSON.stringify(data));
      }
      return data;
    } catch (err) {
      this._backendAvailable = false;
      throw err;
    }
  },

  // --- Today's Full Summary ---
  async getToday(date = null) {
    try {
      return await this.request(`/api/today${date ? `?date=${encodeURIComponent(date)}` : ''}`);
    } catch (err) {
      return window.LocalDB.getTodaySummary(date);
    }
  },

  // --- Water Logging ---
  async logWater(amount_ml, note = null, date = null) {
    try {
      return await this.request('/api/water', {
        method: 'POST',
        body: JSON.stringify({ amount_ml, note, date })
      });
    } catch (err) {
      return window.LocalDB.addWaterLog(amount_ml, note, date);
    }
  },

  async deleteWater(id, date = null) {
    try {
      const query = date ? `?date=${encodeURIComponent(date)}` : '';
      return await this.request(`/api/water/${id}${query}`, { method: 'DELETE' });
    } catch (err) {
      return window.LocalDB.deleteWaterLog(id, date);
    }
  },

  // --- Food & Nutrition Logging ---
  async logFood(entry) {
    try {
      return await this.request('/api/food', {
        method: 'POST',
        body: JSON.stringify(entry)
      });
    } catch (err) {
      return window.LocalDB.addFoodLog(entry);
    }
  },

  async deleteFood(id, date = null) {
    try {
      const query = date ? `?date=${encodeURIComponent(date)}` : '';
      return await this.request(`/api/food/${id}${query}`, { method: 'DELETE' });
    } catch (err) {
      return window.LocalDB.deleteFoodLog(id, date);
    }
  },

  // --- Physical Activity & Workouts ---
  async logActivity(entry) {
    try {
      return await this.request('/api/activity', {
        method: 'POST',
        body: JSON.stringify(entry)
      });
    } catch (err) {
      return window.LocalDB.addActivityLog(entry);
    }
  },

  async deleteActivity(id, date = null) {
    try {
      const query = date ? `?date=${encodeURIComponent(date)}` : '';
      return await this.request(`/api/activity/${id}${query}`, { method: 'DELETE' });
    } catch (err) {
      return window.LocalDB.deleteActivityLog(id, date);
    }
  },

  // --- Habit Tracking ---
  async toggleHabit(habit_id, date = null) {
    try {
      return await this.request('/api/habits/toggle', {
        method: 'POST',
        body: JSON.stringify({ habit_id, date })
      });
    } catch (err) {
      return window.LocalDB.toggleHabit(habit_id, date);
    }
  },

  // --- Trends & History ---
  async getHistory() {
    try {
      return await this.request('/api/history');
    } catch (err) {
      return window.LocalDB.getHistory();
    }
  },

  // --- Target Goals Configuration ---
  async updateTargets(targets, date = null) {
    try {
      const query = date ? `?date=${encodeURIComponent(date)}` : '';
      return await this.request(`/api/targets${query}`, {
        method: 'PUT',
        body: JSON.stringify(targets)
      });
    } catch (err) {
      window.LocalDB.setTargets(targets);
      return window.LocalDB.getTodaySummary(date);
    }
  },

  async resetSeed() {
    try {
      return await this.request('/api/seed', { method: 'POST' });
    } catch (err) {
      window.LocalDB.resetDefaults();
      return window.LocalDB.getTodaySummary();
    }
  },

  // --- Wearables / Smartwatch Simulation ---
  async getWearableStatus(date = null) {
    try {
      const query = date ? `?date=${encodeURIComponent(date)}` : '';
      return await this.request(`/api/wearable/status${query}`);
    } catch (err) {
      return window.LocalDB.getWearable();
    }
  },

  async syncWearable(payload) {
    try {
      return await this.request('/api/wearable/sync', {
        method: 'POST',
        body: JSON.stringify(payload)
      });
    } catch (err) {
      return window.LocalDB.saveWearable(payload);
    }
  },

  async pairWearable(brand, model_name, provider = null) {
    try {
      return await this.request('/api/wearable/pair', {
        method: 'POST',
        body: JSON.stringify({ brand, model_name, provider })
      });
    } catch (err) {
      return window.LocalDB.saveWearable({ brand, model_name, provider, paired: true });
    }
  },

  async simulateWatchPulse(date = null) {
    try {
      const query = date ? `?date=${encodeURIComponent(date)}` : '';
      return await this.request(`/api/wearable/simulate-pulse${query}`, { method: 'POST' });
    } catch (err) {
      return window.LocalDB.simulateWatchPulse();
    }
  },

  // --- Weight & Body Goals ---
  async logWeight(weight_kg, note = null, date = null) {
    try {
      return await this.request('/api/weight', {
        method: 'POST',
        body: JSON.stringify({ weight_kg, note, date })
      });
    } catch (err) {
      return window.LocalDB.addWeightLog(weight_kg, note, date);
    }
  },

  async getWeightHistory() {
    try {
      return await this.request('/api/weight/history');
    } catch (err) {
      return window.LocalDB.getWeightLogs();
    }
  },

  // --- Date-Wise Detailed History & Metabolism ---
  async getDetailedHistory(days = 14) {
    try {
      return await this.request(`/api/history/detailed?days=${days}`);
    } catch (err) {
      return window.LocalDB.getDetailedHistory(days);
    }
  },

  async calculateMetabolism(payload) {
    try {
      return await this.request('/api/metabolism/calculate', {
        method: 'POST',
        body: JSON.stringify(payload)
      });
    } catch (err) {
      return window.LocalDB.calculateMetabolism(payload);
    }
  }
};

window.API = API;
