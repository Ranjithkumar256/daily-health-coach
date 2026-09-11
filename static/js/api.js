/**
 * Daily Health Coach - Universal Hybrid API & On-Device Storage Driver
 * Automatically uses the Python backend if available, or operates 100% standalone
 * on-device (Zero Server Required) using LocalDB.
 * Strictly isolates real user data from preloaded demo data.
 */

const API = {
  baseUrl: '',
  _backendAvailable: null, // null = unknown, true = online, false = standalone on-device

  getToken() {
    return localStorage.getItem('dhc_auth_token');
  },

  isRealUser() {
    const user = window.LocalDB?.getCurrentUser();
    return Boolean(user && !user.is_demo && user.username !== 'demo');
  },

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
    const token = this.getToken();
    const authHeaders = token ? { 'Authorization': `Bearer ${token}` } : {};

    if (!hasBackend) {
      // Standalone on-device fallback to LocalDB
      if (endpoint === '/api/auth/login') {
        const body = JSON.parse(options.body || '{}');
        const ident = body.username_or_email || body.username;
        return window.LocalDB.login(ident, body.password);
      }
      if (endpoint === '/api/auth/register') {
        const body = JSON.parse(options.body || '{}');
        return window.LocalDB.register(body.full_name, body.username, body.email, body.password);
      }
      if (endpoint === '/api/auth/me') {
        const user = window.LocalDB.getCurrentUser();
        if (!user) throw new Error('Authentication required');
        return { status: 'authenticated', user };
      }
      if (endpoint === '/api/auth/logout') {
        return window.LocalDB.logout();
      }
      throw new Error('Backend not available - using local storage');
    }

    try {
      const res = await fetch(`${this.baseUrl}${endpoint}`, {
        headers: {
          'Content-Type': 'application/json',
          ...authHeaders,
          ...options.headers
        },
        ...options
      });

      if (!res.ok) {
        let errMsg = `HTTP error ${res.status}`;
        try {
          const errData = await res.json();
          if (errData && errData.detail) errMsg = errData.detail;
        } catch (e) {}
        throw new Error(errMsg);
      }

      const data = await res.json();
      if (endpoint.startsWith('/api/today')) {
        localStorage.setItem('cached_today_summary', JSON.stringify(data));
      }
      return data;
    } catch (err) {
      if (endpoint.startsWith('/api/auth/')) {
        // Fallback to local auth if network fails
        if (endpoint === '/api/auth/login') {
          const body = JSON.parse(options.body || '{}');
          const ident = body.username_or_email || body.username;
          return window.LocalDB.login(ident, body.password);
        }
        if (endpoint === '/api/auth/register') {
          const body = JSON.parse(options.body || '{}');
          return window.LocalDB.register(body.full_name, body.username, body.email, body.password);
        }
        if (endpoint === '/api/auth/me') {
          const user = window.LocalDB.getCurrentUser();
          if (!user) throw new Error('Authentication required');
          return { status: 'authenticated', user };
        }
        if (endpoint === '/api/auth/logout') {
          return window.LocalDB.logout();
        }
      }
      this._backendAvailable = false;
      throw err;
    }
  },

  // --- Authentication ---
  async login(usernameOrEmail, password) {
    return await this.request('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username_or_email: usernameOrEmail, password })
    });
  },

  async register(fullName, username, email, password) {
    return await this.request('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({ full_name: fullName, username, email, password })
    });
  },

  async getMe() {
    return await this.request('/api/auth/me');
  },

  async logout() {
    try {
      await this.request('/api/auth/logout', { method: 'POST' });
    } catch (e) {}
    localStorage.removeItem('dhc_local_user_v1');
    localStorage.removeItem('dhc_auth_token');
    window.LocalDB?.logout();
  },

  // --- Today's Full Summary ---
  async getToday(date = null) {
    if (this.isRealUser()) {
      return window.LocalDB.getTodaySummary(date);
    }
    try {
      return await this.request(`/api/today${date ? `?date=${encodeURIComponent(date)}` : ''}`);
    } catch (err) {
      return window.LocalDB.getTodaySummary(date);
    }
  },

  // --- Water Logging ---
  async logWater(amount_ml, note = null, date = null) {
    if (this.isRealUser()) {
      return window.LocalDB.addWaterLog(amount_ml, note, date);
    }
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
    if (this.isRealUser()) {
      return window.LocalDB.deleteWaterLog(id, date);
    }
    try {
      const query = date ? `?date=${encodeURIComponent(date)}` : '';
      return await this.request(`/api/water/${id}${query}`, { method: 'DELETE' });
    } catch (err) {
      return window.LocalDB.deleteWaterLog(id, date);
    }
  },

  // --- Food & Nutrition Logging ---
  async logFood(entry) {
    if (this.isRealUser()) {
      return window.LocalDB.addFoodLog(entry);
    }
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
    if (this.isRealUser()) {
      return window.LocalDB.deleteFoodLog(id, date);
    }
    try {
      const query = date ? `?date=${encodeURIComponent(date)}` : '';
      return await this.request(`/api/food/${id}${query}`, { method: 'DELETE' });
    } catch (err) {
      return window.LocalDB.deleteFoodLog(id, date);
    }
  },

  // --- Activity Logging ---
  async logActivity(entry) {
    if (this.isRealUser()) {
      return window.LocalDB.addActivityLog(entry);
    }
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
    if (this.isRealUser()) {
      return window.LocalDB.deleteActivityLog(id, date);
    }
    try {
      const query = date ? `?date=${encodeURIComponent(date)}` : '';
      return await this.request(`/api/activity/${id}${query}`, { method: 'DELETE' });
    } catch (err) {
      return window.LocalDB.deleteActivityLog(id, date);
    }
  },

  // --- Habits Checklist & Toggle ---
  async getHabits(date = null) {
    if (this.isRealUser()) {
      return window.LocalDB.getHabits(date);
    }
    try {
      const query = date ? `?date=${encodeURIComponent(date)}` : '';
      return await this.request(`/api/habits${query}`);
    } catch (err) {
      return window.LocalDB.getHabits(date);
    }
  },

  async toggleHabit(habit_id, date = null) {
    if (this.isRealUser()) {
      return window.LocalDB.toggleHabit(habit_id, date);
    }
    try {
      return await this.request('/api/habits/toggle', {
        method: 'POST',
        body: JSON.stringify({ habit_id, date })
      });
    } catch (err) {
      return window.LocalDB.toggleHabit(habit_id, date);
    }
  },

  // --- Targets & Goal Settings ---
  async getTargets() {
    if (this.isRealUser()) {
      return window.LocalDB.getTargets();
    }
    try {
      return await this.request('/api/targets');
    } catch (err) {
      return window.LocalDB.getTargets();
    }
  },

  async updateTargets(targets) {
    if (this.isRealUser()) {
      return window.LocalDB.setTargets(targets);
    }
    try {
      return await this.request('/api/targets', {
        method: 'POST',
        body: JSON.stringify(targets)
      });
    } catch (err) {
      return window.LocalDB.setTargets(targets);
    }
  },

  // --- Trend History (Last 7 Days) ---
  async getHistory() {
    if (this.isRealUser()) {
      return window.LocalDB.getHistory();
    }
    try {
      return await this.request('/api/history');
    } catch (err) {
      return window.LocalDB.getHistory();
    }
  },

  // --- Wearable & Smartwatch Sync ---
  async syncWearable(payload) {
    if (this.isRealUser()) {
      return window.LocalDB.saveWearable(payload);
    }
    try {
      return await this.request('/api/wearable/sync', {
        method: 'POST',
        body: JSON.stringify(payload)
      });
    } catch (err) {
      return window.LocalDB.saveWearable(payload);
    }
  },

  async pairWearable(brand, model_name, provider = 'Health Connect') {
    if (this.isRealUser()) {
      return window.LocalDB.saveWearable({ brand, model_name, provider, paired: true });
    }
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
    if (this.isRealUser()) {
      return window.LocalDB.simulateWatchPulse();
    }
    try {
      const query = date ? `?date=${encodeURIComponent(date)}` : '';
      return await this.request(`/api/wearable/simulate-pulse${query}`, { method: 'POST' });
    } catch (err) {
      return window.LocalDB.simulateWatchPulse();
    }
  },

  // --- Weight & Body Goals ---
  async logWeight(weight_kg, note = null, date = null) {
    if (this.isRealUser()) {
      return window.LocalDB.addWeightLog(weight_kg, note, date);
    }
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
    if (this.isRealUser()) {
      return window.LocalDB.getWeightLogs();
    }
    try {
      return await this.request('/api/weight/history');
    } catch (err) {
      return window.LocalDB.getWeightLogs();
    }
  },

  // --- Date-Wise Detailed History & Metabolism ---
  async getDetailedHistory(days = 14) {
    if (this.isRealUser()) {
      return window.LocalDB.getDetailedHistory(days);
    }
    try {
      return await this.request(`/api/history/detailed?days=${days}`);
    } catch (err) {
      return window.LocalDB.getDetailedHistory(days);
    }
  },

  async calculateMetabolism(payload) {
    if (this.isRealUser()) {
      return window.LocalDB.calculateMetabolism(payload);
    }
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
