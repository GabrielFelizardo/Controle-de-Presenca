/**
 * API CLIENT v4.0 - Completo
 */

const API = {
  // Configurações
  getUrl() {
    if (typeof CONFIG !== 'undefined' && CONFIG.API) {
      return CONFIG.API.CURRENT_URL;
    }
    return localStorage.getItem('apiUrl') || 'https://script.google.com/macros/s/AKfycbxsGjeJ_KnQIFlwKpZiCfA4YYGYucBcCbJWyyt8dBX-40YNOeK1O04oxeyDLwFZrwH4ig/exec';
  },

  setUrl(url) {
    localStorage.setItem('apiUrl', url);
    if (typeof CONFIG !== 'undefined' && CONFIG.API) {
      CONFIG.API.CURRENT_URL = url;
    }
    console.log('✅ URL da API atualizada:', url);
  },

  // Core Request
  async request(action, data = {}) {
    const url = this.getUrl();
    const payload = { action, ...data };
    console.log(`☁️ API Request: ${action}`, payload);
    
    try {
      const response = await fetch(url, {
        method: 'POST',
        body: JSON.stringify(payload)
      });
      
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      
      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'Erro desconhecido na API');
      }
      
      return result;
    } catch (error) {
      console.error(`❌ Erro API (${action}):`, error);
      throw error;
    }
  },

  // Teste de Conexão
  async testConnection() {
    try {
      const result = await this.request('ping');
      return result.message === 'Pong';
    } catch (e) {
      return false;
    }
  },

  // === MÉTODOS CLOUD (NOVOS) ===

  async getFullData(spreadsheetId) {
    return await this.request('getFullData', { spreadsheetId });
  },

  async updateSheetColumns(spreadsheetId, eventId, columns) {
    return await this.request('updateSheetColumns', { 
      spreadsheetId, eventId, columns 
    });
  },

  async createEventFormSmart(spreadsheetId, eventId, columns) {
    return await this.request('createEventFormSmart', {
      spreadsheetId, eventId, columns
    });
  },

  // === MÉTODOS CRUD BÁSICOS ===

  async getOrCreateSpreadsheet(email) {
    return await this.request('getOrCreateSpreadsheet', { email });
  },

  async createEvent(spreadsheetId, name) {
    return await this.request('createEvent', { spreadsheetId, name });
  },

  async deleteEvent(spreadsheetId, eventId) {
    return await this.request('deleteEvent', { spreadsheetId, eventId });
  },
  
  async updateEventName(spreadsheetId, eventId, newName) {
    return await this.request('updateEventName', { spreadsheetId, eventId, newName });
  },

  async addGuest(spreadsheetId, eventId, guest) {
    return await this.request('addGuest', { spreadsheetId, eventId, guest });
  },

  async updateGuest(spreadsheetId, eventId, guestId, updates) {
    return await this.request('updateGuest', { spreadsheetId, eventId, guestId, updates });
  },

  async deleteGuest(spreadsheetId, eventId, guestId) {
    return await this.request('deleteGuest', { spreadsheetId, eventId, guestId });
  }
};

window.API = API;
