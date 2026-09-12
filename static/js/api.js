// API Client for Life RPG
const API_BASE = '/api';

class ApiClient {
  constructor() {
    this.token = localStorage.getItem('life_rpg_token') || null;
  }

  setToken(token) {
    this.token = token;
    if (token) {
      localStorage.setItem('life_rpg_token', token);
    } else {
      localStorage.removeItem('life_rpg_token');
    }
  }

  getHeaders() {
    const headers = {
      'Content-Type': 'application/json',
    };
    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }
    return headers;
  }

  async request(endpoint, options = {}) {
    const url = `${API_BASE}${endpoint}`;
    const headers = this.getHeaders();

    const config = {
      ...options,
      headers: {
        ...headers,
        ...options.headers,
      },
    };

    try {
      const response = await fetch(url, config);

      if (response.status === 401) {
        // Unauthorized - Clear token & prompt auth
        this.setToken(null);
        if (!endpoint.includes('/auth/login') && !endpoint.includes('/auth/signup')) {
          window.dispatchEvent(new CustomEvent('auth:required'));
        }
      }

      if (response.status === 204) {
        return null;
      }

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || 'An error occurred with the request');
      }

      return data;
    } catch (error) {
      console.error(`API Error on [${options.method || 'GET'}] ${endpoint}:`, error);
      throw error;
    }
  }

  // Auth Endpoints
  async signup(username, email, password) {
    const data = await this.request('/auth/signup', {
      method: 'POST',
      body: JSON.stringify({ username, email, password }),
    });
    this.setToken(data.access_token);
    return data;
  }

  async login(usernameOrEmail, password) {
    const data = await this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username_or_email: usernameOrEmail, password }),
    });
    this.setToken(data.access_token);
    return data;
  }

  async getMe() {
    return await this.request('/auth/me');
  }

  // Quest Endpoints
  async getQuests(status = 'all', category = 'all', difficulty = 'all') {
    let query = `?status_filter=${status}`;
    if (category && category !== 'all') query += `&category=${encodeURIComponent(category)}`;
    if (difficulty && difficulty !== 'all') query += `&difficulty=${encodeURIComponent(difficulty)}`;
    return await this.request(`/quests${query}`);
  }

  async createQuest(questData) {
    return await this.request('/quests', {
      method: 'POST',
      body: JSON.stringify(questData),
    });
  }

  async updateQuest(questId, questData) {
    return await this.request(`/quests/${questId}`, {
      method: 'PUT',
      body: JSON.stringify(questData),
    });
  }

  async deleteQuest(questId) {
    return await this.request(`/quests/${questId}`, {
      method: 'DELETE',
    });
  }

  async completeQuest(questId) {
    return await this.request(`/quests/${questId}/complete`, {
      method: 'POST',
    });
  }

  async uncompleteQuest(questId) {
    return await this.request(`/quests/${questId}/uncomplete`, {
      method: 'POST',
    });
  }

  // Character Profile & Activity
  async getProfile() {
    return await this.request('/character/profile');
  }

  async updateProfile(profileData) {
    return await this.request('/character/profile', {
      method: 'PATCH',
      body: JSON.stringify(profileData),
    });
  }

  async getActivityLogs() {
    return await this.request('/character/activity');
  }

  // Shop & Inventory
  async getShopItems() {
    return await this.request('/shop/items');
  }

  async getInventory() {
    return await this.request('/shop/inventory');
  }

  async buyItem(itemId) {
    return await this.request(`/shop/buy/${itemId}`, {
      method: 'POST',
    });
  }

  async equipItem(inventoryId) {
    return await this.request(`/shop/equip/${inventoryId}`, {
      method: 'POST',
    });
  }

  async useConsumable(inventoryId) {
    return await this.request(`/shop/use/${inventoryId}`, {
      method: 'POST',
    });
  }

  // Boss Dungeons
  async getBoss() {
    return await this.request('/boss');
  }

  async respawnBoss() {
    return await this.request('/boss/respawn', {
      method: 'POST',
    });
  }
}

const api = new ApiClient();
