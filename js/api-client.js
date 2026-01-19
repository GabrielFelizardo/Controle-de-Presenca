/**
 * CLIENTE DA API v3.1
 * Sistema baseado em email + planilha
 */

const API = {
  /**
   * Requisição base
   */
  async request(action, data = {}) {
    if (!API_CONFIG.API_URL) {
      console.warn('⚠️ API não configurada');
      return { success: false, error: 'API não configurada' };
    }
    
    try {
      const spreadsheetId = localStorage.getItem('spreadsheetId');
      
      const payload = {
        action: action,
        spreadsheetId: spreadsheetId,
        ...data
      };
      
      console.log(`📡 API Request: ${action}`);
      
      const response = await fetch(API_CONFIG.API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        redirect: 'follow'
      });
      
      const result = await response.json();
      
      console.log(`✅ API Response:`, result);
      
      return result;
      
    } catch (error) {
      console.error('❌ Erro na API:', error);
      return { success: false, error: error.message };
    }
  },
  
  // ========================================
  // AUTENTICAÇÃO
  // ========================================
  
  /**
   * Busca ou cria planilha por email
   */
  async getOrCreateSpreadsheet(email) {
    try {
      const payload = {
        action: 'getOrCreateSpreadsheet',
        email: email
      };
      
      const response = await fetch(API_CONFIG.API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        redirect: 'follow'
      });
      
      const result = await response.json();
      
      if (result.success && result.data) {
        return {
          success: true,
          spreadsheetId: result.data.spreadsheetId,
          spreadsheetUrl: result.data.spreadsheetUrl,
          email: result.data.email,
          isNew: result.data.isNew
        };
      }
      
      return result;
      
    } catch (error) {
      console.error('Erro ao buscar/criar planilha:', error);
      return { success: false, error: error.message };
    }
  },
  
  // ========================================
  // EVENTOS
  // ========================================
  
  /**
   * Cria novo evento (nova aba na planilha)
   */
  async createEvent(name, date, description) {
    const result = await this.request('createEvent', {
      name, date, description
    });
    
    return result;
  },
  
  /**
   * Lista eventos (abas da planilha)
   */
  async getEvents() {
    const result = await this.request('getEvents');
    return result.success ? result.data : { events: [] };
  },
  
  /**
   * Atualiza evento (renomeia aba)
   */
  async updateEvent(eventId, newName) {
    return await this.request('updateEvent', {
      eventId, newName
    });
  },
  
  /**
   * Deleta evento (deleta aba)
   */
  async deleteEvent(eventId) {
    return await this.request('deleteEvent', { eventId });
  },
  
  // ========================================
  // CONVIDADOS
  // ========================================
  
  /**
   * Adiciona convidado (adiciona linha na aba)
   */
  async addGuest(eventId, guest) {
    return await this.request('addGuest', {
      eventId, guest
    });
  },
  
  /**
   * Lista convidados (linhas da aba)
   */
  async getGuests(eventId) {
    const result = await this.request('getGuests', { eventId });
    return result.success ? result.data : { guests: [] };
  },
  
  /**
   * Atualiza convidado (atualiza linha)
   */
  async updateGuest(eventId, guestId, updates) {
    return await this.request('updateGuest', {
      eventId, guestId, updates
    });
  },
  
  /**
   * Deleta convidado (deleta linha)
   */
  async deleteGuest(eventId, guestId) {
    return await this.request('deleteGuest', {
      eventId, guestId
    });
  },
  
  // ========================================
  // FORMULÁRIOS
  // ========================================
  
  /**
   * Cria formulário Google Forms
   */
  async createEventForm(eventId, eventName) {
    return await this.request('createEventForm', {
      eventId, eventName
    });
  },
  
  /**
   * Sincroniza respostas do formulário
   */
  async syncFormResponses(eventId, formId) {
    return await this.request('syncFormResponses', {
      eventId, formId
    });
  },
  
  // ========================================
  // HELPERS
  // ========================================
  
  /**
   * Testa conexão
   */
  async testConnection() {
    try {
      const response = await fetch(API_CONFIG.API_URL, {
        method: 'GET',
        redirect: 'follow'
      });
      
      const result = await response.json();
      console.log('✅ Conexão OK:', result);
      return true;
      
    } catch (error) {
      console.error('❌ Conexão falhou:', error);
      return false;
    }
  }
};

// Exporta
window.API = API;

console.log('📡 API Client v3.1 carregado');
