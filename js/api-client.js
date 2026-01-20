/**
 * API CLIENT v3.1.0
 * Cliente para comunicação com Google Apps Script
 * ✅ CORRIGIDO: API_CONFIG → CONFIG.API
 */

const API = {
  // ========================================
  // CONFIGURAÇÃO
  // ========================================
  
  /**
   * Obtém URL da API
   */
  getUrl() {
    // Tenta usar CONFIG se existir, senão usa localStorage direto
    if (typeof CONFIG !== 'undefined' && CONFIG.API) {
      return CONFIG.API.CURRENT_URL;
    }
    
    // Fallback para localStorage
    return localStorage.getItem('apiUrl') || 
           'https://script.google.com/macros/s/SEU_SCRIPT_ID/exec';
  },
  
  /**
   * Obtém timeout
   */
  getTimeout() {
    if (typeof CONFIG !== 'undefined' && CONFIG.API) {
      return CONFIG.API.TIMEOUT || 30000;
    }
    return 30000;
  },
  
  // ========================================
  // REQUISIÇÕES
  // ========================================
  
  /**
   * Faz requisição para API
   */
  async request(action, data = {}) {
    try {
      const url = this.getUrl();
      const timeout = this.getTimeout();
      
      console.log(`📡 API Request: ${action}`, data);
      
      // Cria controller para timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);
      
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          action: action,
          data: JSON.stringify(data)
        }),
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
  
  // ========================================
  // MÉTODOS ESPECÍFICOS
  // ========================================
  
  /**
   * Valida usuário
   */
  async validateUser(email) {
    try {
      return await this.request('validateUser', { email });
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  },
  
  /**
   * Cria evento
   */
  async createEvent(name, date = '', description = '', location = '') {
    try {
      return await this.request('createEvent', {
        name,
        date,
        description,
        location
      });
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  },
  
  /**
   * Deleta evento
   */
  async deleteEvent(eventId) {
    try {
      return await this.request('deleteEvent', { eventId });
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  },
  
  /**
   * Adiciona convidado
   */
  async addGuest(eventId, guest) {
    try {
      return await this.request('addGuest', {
        eventId,
        guest
      });
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  },
  
  /**
   * Atualiza convidado
   */
  async updateGuest(eventId, guestId, data) {
    try {
      return await this.request('updateGuest', {
        eventId,
        guestId,
        data
      });
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  },
  
  /**
   * Deleta convidado
   */
  async deleteGuest(eventId, guestId) {
    try {
      return await this.request('deleteGuest', {
        eventId,
        guestId
      });
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  },
  
  /**
   * Lista todos os eventos
   */
  async listEvents() {
    try {
      return await this.request('listEvents');
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  },
  
  /**
   * Obtém dados de um evento
   */
  async getEvent(eventId) {
    try {
      return await this.request('getEvent', { eventId });
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  },
  
  /**
   * Sincroniza evento completo
   */
  async syncEvent(eventId, eventData) {
    try {
      return await this.request('syncEvent', {
        eventId,
        eventData
      });
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  },
  
  // ========================================
  // BATCH OPERATIONS
  // ========================================
  
  /**
   * Adiciona múltiplos convidados de uma vez
   */
  async addGuestsBatch(eventId, guests) {
    try {
      const results = [];
      
      for (const guest of guests) {
        const result = await this.addGuest(eventId, guest);
        results.push(result);
        
        if (!result.success) {
          console.warn('Falha ao adicionar:', guest, result.error);
        }
      }
      
      const successCount = results.filter(r => r.success).length;
      
      return {
        success: successCount > 0,
        data: {
          total: guests.length,
          success: successCount,
          failed: guests.length - successCount
        }
      };
      
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  },
  
  /**
   * Atualiza múltiplos convidados
   */
  async updateGuestsBatch(eventId, updates) {
    try {
      const results = [];
      
      for (const update of updates) {
        const result = await this.updateGuest(
          eventId, 
          update.guestId, 
          update.data
        );
        results.push(result);
      }
      
      const successCount = results.filter(r => r.success).length;
      
      return {
        success: successCount > 0,
        data: {
          total: updates.length,
          success: successCount,
          failed: updates.length - successCount
        }
      };
      
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  },
  
  // ========================================
  // UTILITIES
  // ========================================
  
  /**
   * Testa conexão com API
   */
  async testConnection() {
    try {
      const result = await this.request('ping');
      return result.success;
    } catch (error) {
      console.error('Erro ao testar conexão:', error);
      return false;
    }
  },
  
  /**
   * Define URL da API
   */
  setUrl(url) {
    localStorage.setItem('apiUrl', url);
    
    if (typeof CONFIG !== 'undefined' && CONFIG.API) {
      CONFIG.API.CURRENT_URL = url;
    }
    
    console.log('✅ URL da API atualizada:', url);
  },
  
  /**
   * Obtém URL atual da API
   */
  getCurrentUrl() {
    return this.getUrl();
  }
};

// Exporta globalmente
window.API = API;

console.log('📡 API Client v3.1.0 carregado');
