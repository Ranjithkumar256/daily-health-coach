/**
 * Daily Health Coach - REST Client for Python FastAPI Backend
 * Includes offline caching in LocalStorage for seamless Android PWA usage.
 */

const API = {
  baseUrl: '',

  async request(endpoint, options = {}) {
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
      // Cache latest day summary if it's today's endpoint
      if (endpoint.startsWith('/api/today')) {
        localStorage.setItem('cached_today_summary', JSON.stringify(data));
      }
      return data;
    } catch (err) {
      console.warn(`API call ${endpoint} failed, checking offline cache:`, err);
      if (endpoint.startsWith('/api/today')) {
        const cached = localStorage.getItem('cached_today_summary');
        if (cached) return JSON.parse(cached);
      }
      throw err;
    }
  },

  async getToday(date = null) {
    const query = date ? `?date=${encodeURIComponent(date)}` : '';
    return this.request(`/api/today${query}`);
  },

  async logWater(amount_ml, note = null, date = null) {
    return this.request('/api/water', {
      method: 'POST',
      body: JSON.stringify({ amount_ml, note, date })
    });
  },

  async deleteWater(id, date = null) {
    const query = date ? `?date=${encodeURIComponent(date)}` : '';
    return this.request(`/api/water/${id}${query}`, { method: 'DELETE' });
  },

  async logFood(entry) {
    return this.request('/api/food', {
      method: 'POST',
      body: JSON.stringify(entry)
    });
  },

  async deleteFood(id, date = null) {
    const query = date ? `?date=${encodeURIComponent(date)}` : '';
    return this.request(`/api/food/${id}${query}`, { method: 'DELETE' });
  },

  async logActivity(entry) {
    return this.request('/api/activity', {
      method: 'POST',
      body: JSON.stringify(entry)
    });
  },

  async deleteActivity(id, date = null) {
    const query = date ? `?date=${encodeURIComponent(date)}` : '';
    return this.request(`/api/activity/${id}${query}`, { method: 'DELETE' });
  },

  async toggleHabit(habit_id, date = null) {
    return this.request('/api/habits/toggle', {
      method: 'POST',
      body: JSON.stringify({ habit_id, date })
    });
  },

  async getHistory() {
    return this.request('/api/history');
  },

  async updateTargets(targets, date = null) {
    const query = date ? `?date=${encodeURIComponent(date)}` : '';
    return this.request(`/api/targets${query}`, {
      method: 'PUT',
      body: JSON.stringify(targets)
    });
  },

  async resetSeed() {
    return this.request('/api/seed', { method: 'POST' });
  },

  // --- Wearables / Smartwatch API ---
  async getWearableStatus(date = null) {
    const query = date ? `?date=${encodeURIComponent(date)}` : '';
    return this.request(`/api/wearable/status${query}`);
  },

  async syncWearable(payload) {
    return this.request('/api/wearable/sync', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  },

  async pairWearable(brand, model_name, provider = null) {
    return this.request('/api/wearable/pair', {
      method: 'POST',
      body: JSON.stringify({ brand, model_name, provider })
    });
  },

  async simulateWatchPulse(date = null) {
    const query = date ? `?date=${encodeURIComponent(date)}` : '';
    return this.request(`/api/wearable/simulate-pulse${query}`, {
      method: 'POST'
    });
  },

  // --- Weight & Body Goals API ---
  async logWeight(weight_kg, note = null, date = null) {
    return this.request('/api/weight', {
      method: 'POST',
      body: JSON.stringify({ weight_kg, note, date })
    });
  },

  async getWeightHistory() {
    return this.request('/api/weight/history');
  },

  // --- Date-Wise Tracking & Metabolism Calculations ---
  async getDetailedHistory(days = 14) {
    return this.request(`/api/history/detailed?days=${days}`);
  },

  async calculateMetabolism(payload) {
    return this.request('/api/metabolism/calculate', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  }
};

window.API = API;
