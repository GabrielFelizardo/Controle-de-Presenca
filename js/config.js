/**
 * CLIENTE DA API v3.0
 * Comunicação com Apps Script + Google Sheets
 */

const API = {
  /**
   * Requisição base
   */
  async request(action, data = {}) {
    // Se API não configurada, retorna mock
    if (!API_CONFIG.USE_SHEETS || !API_CONFIG.API_URL) {
      console.warn('⚠️ API não configurada - retornando mock');
      return this.mockResponse(action, data);
    }
    
    try {
      const payload = {
        action: action,
        spreadsheetId: getSpreadsheetId(),
        ...data
      };
      
      console.log(`📡 API Request: ${action}`, payload);
      
      const response = await fetch(API_CONFIG.API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'text/plain;charset=utf-8'
        },
        body: JSON.stringify(payload),
        redirect: 'follow'
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const result = await response.json();
      console.log(`✅ API Response (${action}):`, result);
      
      return result;
      
    } catch (error) {
      console.error('❌ Erro na API:', error);
      throw error;
    }
  },
  
  /**
   * Mock response (quando API não configurada)
   */
  mockResponse(action, data) {
    console.log(`🔧 Mock: ${action}`, data);
    return {
      success: true,
      mock: true,
      message: 'API não configurada - operação simulada'
    };
  },
  
  // ========================================
  // CLIENTE
  // ========================================
  
  /**
   * Busca ou cria planilha por email (SISTEMA v3.1)
   */
  async getOrCreateSpreadsheet(email) {
    try {
      console.log('📡 Buscando/criando planilha para:', email);
      
      const payload = {
        action: 'getOrCreateSpreadsheet',
        email: email
      };
      
      const response = await fetch(API_CONFIG.API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'text/plain;charset=utf-8'
        },
        body: JSON.stringify(payload),
        redirect: 'follow'
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const result = await response.json();
      console.log('✅ Resposta da API:', result);
      
      if (result.success && result.data) {
        // Salva o spreadsheetId
        if (result.data.spreadsheetId) {
          setSpreadsheetId(result.data.spreadsheetId);
        }
        
        return {
          success: true,
          spreadsheetId: result.data.spreadsheetId,
          spreadsheetUrl: result.data.spreadsheetUrl,
          isNew: result.data.isNew || false,
          data: result.data
        };
      }
      
      return result;
      
    } catch (error) {
      console.error('❌ Erro ao buscar planilha:', error);
      return {
        success: false,
        error: error.message
      };
    }
  },
  
  /**
   * Cria novo cliente (planilha)
   */
  async createClient(name, email, plan = 'basic') {
    const result = await this.request('createClient', { name, email, plan });
    
    if (result.spreadsheetId) {
      setSpreadsheetId(result.spreadsheetId);
    }
    
    return result;
  },
  
  /**
   * Busca dados do cliente
   */
  async getClient() {
    return await this.request('getClient');
  },
  
  // ========================================
  // EVENTOS
  // ========================================
  
  /**
   * Cria novo evento
   */
  async createEvent(name, date, description = '', location = '') {
    return await this.request('createEvent', {
      name, date, description, location
    });
  },
  
  /**
   * Lista eventos
   */
  async getEvents() {
    return await this.request('getEvents');
  },
  
  /**
   * Atualiza evento
   */
  async updateEvent(eventId, updates) {
    return await this.request('updateEvent', { eventId, updates });
  },
  
  /**
   * Deleta evento
   */
  async deleteEvent(eventId) {
    return await this.request('deleteEvent', { eventId });
  },
  
  // ========================================
  // CONVIDADOS
  // ========================================
  
  /**
   * Adiciona convidado
   */
  async addGuest(eventId, guest) {
    return await this.request('addGuest', { eventId, guest });
  },
  
  /**
   * Lista convidados de um evento
   */
  async getGuests(eventId) {
    return await this.request('getGuests', { eventId });
  },
  
  /**
   * Atualiza convidado
   */
  async updateGuest(guestId, updates) {
    return await this.request('updateGuest', { guestId, updates });
  },
  
  /**
   * Atualiza status do convidado
   */
  async updateStatus(guestId, status, eventId) {
    return await this.request('updateStatus', { guestId, status, eventId });
  },
  
  /**
   * Deleta convidado
   */
  async deleteGuest(guestId) {
    return await this.request('deleteGuest', { guestId });
  },
  
  // ========================================
  // FORMULÁRIOS
  // ========================================
  
  /**
   * Cria Google Form para evento
   */
  async createEventForm(eventId, eventName, eventDate) {
    return await this.request('createEventForm', {
      eventId, eventName, eventDate
    });
  },
  
  /**
   * Busca respostas do formulário
   */
  async getFormResponses(formId) {
    return await this.request('getFormResponses', { formId });
  },
  
  /**
   * Sincroniza respostas do formulário
   */
  async syncFormResponses(eventId) {
    return await this.request('syncFormResponses', { eventId });
  },
  
  // ========================================
  // HELPERS
  // ========================================
  
  /**
   * Testa conexão com API
   */
  async testConnection() {
    try {
      console.log('🔍 Testando conexão...');
      const result = await this.request('getClient');
      console.log('✅ Conexão OK', result);
      return true;
    } catch (error) {
      console.error('❌ Conexão falhou', error);
      return false;
    }
  }
};

// Exporta globalmente
window.API = API;

// Log inicial
console.log('📡 API Client v' + API_CONFIG.VERSION + ' carregado');

if (isApiConfigured()) {
  console.log('✅ API pronta para uso');
} else {
  console.log('⚠️ Configure a API primeiro:');
  console.log('  1. Deploy do Apps Script');
  console.log('  2. setupApi("url-do-apps-script")');
  console.log('  3. API.createClient("nome", "email")');
}
