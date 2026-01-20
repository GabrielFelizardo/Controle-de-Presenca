/**
 * API CLIENT v3.1.1
 * ✅ CORRIGIDO: Envia JSON direto
 */

const API = {
  getUrl() {
    if (typeof CONFIG !== 'undefined' && CONFIG.API) {
      return CONFIG.API.CURRENT_URL;
    }
    return localStorage.getItem('apiUrl') || 
           'https://script.google.com/macros/s/AKfycbxsGjeJ_KnQIFlwKpZiCfA4YYGYucBcCbJWyyt8dBX-40YNOeK1O04oxeyDLwFZrwH4ig/exec';
  },
  
  getTimeout() {
    if (typeof CONFIG !== 'undefined' && CONFIG.API) {
      return CONFIG.API.TIMEOUT || 30000;
    }
    return 30000;
  },
  
  async request(action, data = {}) {
    try {
      const url = this.getUrl();
      const timeout = this.getTimeout();
      
      console.log(`📡 API Request: ${action}`, data);
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);
      
      // ✅ CORRIGIDO: Payload JSON
      const payload = {
        action: action,
        ...data
      };
      
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'text/plain',
        },
        body: JSON.stringify(payload),
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const result = await response.json();
      
      console.log(`✅ API Response: ${action}`, result);
      
      return result;
      
    } catch (error) {
      if (error.name === 'AbortError') {
        console.error('⏱️ Timeout na requisição:', action);
        throw new Error('Timeout: A requisição demorou muito');
      }
      
      console.error('❌ Erro na API:', error);
      throw error;
    }
  },
  
  async validateUser(email) {
    return await this.request('validateUser', { email });
  },
  
  async getOrCreateSpreadsheet(email) {
    return await this.request('getOrCreateSpreadsheet', { email });
  },
  
  async createEvent(spreadsheetId, name, date = '', description = '', location = '') {
    return await this.request('createEvent', {
      spreadsheetId,
      name,
      date,
      description,
      location
    });
  },
  
  async listEvents(spreadsheetId) {
    return await this.request('getEvents', { spreadsheetId });
  },
  
  async deleteEvent(spreadsheetId, eventId) {
    return await this.request('deleteEvent', { spreadsheetId, eventId });
  },
  
  async addGuest(spreadsheetId, eventId, guest) {
    return await this.request('addGuest', {
      spreadsheetId,
      eventId,
      guest
    });
  },
  
  async updateGuest(spreadsheetId, eventId, guestId, updates) {
    return await this.request('updateGuest', {
      spreadsheetId,
      eventId,
      guestId,
      updates
    });
  },
  
  async deleteGuest(spreadsheetId, eventId, guestId) {
    return await this.request('deleteGuest', {
      spreadsheetId,
      eventId,
      guestId
    });
  },
  
  async getGuests(spreadsheetId, eventId) {
    return await this.request('getGuests', {
      spreadsheetId,
      eventId
    });
  },
  
  setUrl(url) {
    localStorage.setItem('apiUrl', url);
    if (typeof CONFIG !== 'undefined' && CONFIG.API) {
      CONFIG.API.CURRENT_URL = url;
    }
    console.log('✅ URL da API atualizada:', url);
  },
  
  getCurrentUrl() {
    return this.getUrl();
  },
  
  async testConnection() {
    try {
      const result = await this.request('ping');
      return result.success;
    } catch (error) {
      return false;
    }
  }
};

window.API = API;
console.log('📡 API Client v3.1.1 carregado');
