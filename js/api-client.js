/**
 * CLIENTE DA API v3.1
 * Sistema baseado em email + planilha
 * ✅ Melhorado com tratamento de erros robusto
 */

"use strict";

const API = {
  /**
   * Requisição base com retry automático
   * @param {string} action - Ação a executar
   * @param {Object} data - Dados da requisição
   * @param {number} retries - Tentativas restantes
   * @returns {Promise<Object>} Resultado da API
   */
  async request(action, data = {}, retries = 3) {
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
      
      console.log(`📡 API Request: ${action}`, payload);
      
      const response = await fetch(API_CONFIG.API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
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
      console.error(`❌ Erro na API (${action}):`, error);
      
      // Retry automático em caso de erro de rede
      if (retries > 0 && error.message.includes('fetch')) {
        console.log(`🔄 Tentando novamente... (${retries} tentativas restantes)`);
        await this.sleep(1000); // Aguarda 1 segundo
        return this.request(action, data, retries - 1);
      }
      
      return { 
        success: false, 
        error: error.message,
        action: action
      };
    }
  },
  
  /**
   * Helper - aguarda tempo em ms
   */
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  },
  
  // ========================================
  // AUTENTICAÇÃO
  // ========================================
  
  /**
   * Busca ou cria planilha por email
   * @param {string} email - Email do usuário
   * @returns {Promise<Object>} Dados da planilha
   */
  async getOrCreateSpreadsheet(email) {
    try {
      if (!email || !email.includes('@')) {
        return { success: false, error: 'Email inválido' };
      }
      
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
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      
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
      return { 
        success: false, 
        error: error.message || 'Erro ao acessar API'
      };
    }
  },
  
  // ========================================
  // EVENTOS
  // ========================================
  
  /**
   * Cria novo evento (nova aba na planilha)
   * @param {string} name - Nome do evento
   * @param {string} date - Data do evento
   * @param {string} description - Descrição
   * @returns {Promise<Object>} Evento criado
   */
  async createEvent(name, date, description) {
    if (!name || name.trim() === '') {
      return { success: false, error: 'Nome do evento é obrigatório' };
    }
    
    const result = await this.request('createEvent', {
      name: name.trim(),
      date: date || '',
      description: description || ''
    });
    
    return result;
  },
  
  /**
   * Lista eventos (abas da planilha)
   * @returns {Promise<Object>} Lista de eventos
   */
  async getEvents() {
    const result = await this.request('getEvents');
    return result.success ? result.data : { events: [] };
  },
  
  /**
   * Atualiza evento (renomeia aba)
   * @param {string} eventId - ID do evento
   * @param {string} newName - Novo nome
   * @returns {Promise<Object>} Resultado
   */
  async updateEvent(eventId, newName) {
    if (!newName || newName.trim() === '') {
      return { success: false, error: 'Novo nome é obrigatório' };
    }
    
    return await this.request('updateEvent', {
      eventId,
      newName: newName.trim()
    });
  },
  
  /**
   * Deleta evento (deleta aba)
   * @param {string} eventId - ID do evento
   * @returns {Promise<Object>} Resultado
   */
  async deleteEvent(eventId) {
    return await this.request('deleteEvent', { eventId });
  },
  
  // ========================================
  // CONVIDADOS
  // ========================================
  
  /**
   * Adiciona convidado (adiciona linha na aba)
   * @param {string} eventId - ID do evento
   * @param {Object} guest - Dados do convidado
   * @returns {Promise<Object>} Convidado criado
   */
  async addGuest(eventId, guest) {
    if (!guest.name || guest.name.trim() === '') {
      return { success: false, error: 'Nome do convidado é obrigatório' };
    }
    
    return await this.request('addGuest', {
      eventId,
      guest: {
        name: guest.name.trim(),
        phone: (guest.phone || '').trim(),
        email: (guest.email || '').trim(),
        status: guest.status || 'pending',
        notes: (guest.notes || '').trim()
      }
    });
  },
  
  /**
   * Lista convidados (linhas da aba)
   * @param {string} eventId - ID do evento
   * @returns {Promise<Object>} Lista de convidados
   */
  async getGuests(eventId) {
    const result = await this.request('getGuests', { eventId });
    return result.success ? result.data : { guests: [] };
  },
  
  /**
   * Atualiza convidado (atualiza linha)
   * @param {string} eventId - ID do evento
   * @param {number} guestId - ID do convidado
   * @param {Object} updates - Atualizações
   * @returns {Promise<Object>} Resultado
   */
  async updateGuest(eventId, guestId, updates) {
    // Limpa valores
    const cleanUpdates = {};
    for (const key in updates) {
      if (updates[key] !== undefined) {
        cleanUpdates[key] = typeof updates[key] === 'string' 
          ? updates[key].trim() 
          : updates[key];
      }
    }
    
    return await this.request('updateGuest', {
      eventId,
      guestId,
      updates: cleanUpdates
    });
  },
  
  /**
   * Deleta convidado (deleta linha)
   * @param {string} eventId - ID do evento
   * @param {number} guestId - ID do convidado
   * @returns {Promise<Object>} Resultado
   */
  async deleteGuest(eventId, guestId) {
    return await this.request('deleteGuest', {
      eventId,
      guestId
    });
  },
  
  // ========================================
  // FORMULÁRIOS
  // ========================================
  
  /**
   * Cria formulário Google Forms
   * @param {string} eventId - ID do evento
   * @param {string} eventName - Nome do evento
   * @returns {Promise<Object>} Dados do formulário
   */
  async createEventForm(eventId, eventName) {
    return await this.request('createEventForm', {
      eventId,
      eventName: eventName || eventId
    });
  },
  
  /**
   * Sincroniza respostas do formulário
   * @param {string} eventId - ID do evento
   * @param {string} formId - ID do formulário
   * @returns {Promise<Object>} Resultado da sincronização
   */
  async syncFormResponses(eventId, formId) {
    return await this.request('syncFormResponses', {
      eventId,
      formId
    });
  },
  
  // ========================================
  // HELPERS & DIAGNOSTICS
  // ========================================
  
  /**
   * Testa conexão com a API
   * @returns {Promise<boolean>} True se conectado
   */
  async testConnection() {
    try {
      console.log('🔍 Testando conexão com API...');
      
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
  },
  
  /**
   * Retorna informações de diagnóstico
   * @returns {Object} Informações da API
   */
  getDiagnostics() {
    return {
      configured: !!API_CONFIG.API_URL,
      apiUrl: API_CONFIG.API_URL || 'NÃO CONFIGURADA',
      spreadsheetId: localStorage.getItem('spreadsheetId') || 'NÃO CONFIGURADO',
      userEmail: localStorage.getItem('userEmail') || 'NÃO LOGADO',
      version: API_CONFIG.VERSION || '3.1'
    };
  },
  
  /**
   * Limpa cache e força reconexão
   */
  resetConnection() {
    console.log('🔄 Resetando conexão...');
    // Mantém email mas limpa spreadsheetId para forçar busca novamente
    const email = localStorage.getItem('userEmail');
    localStorage.removeItem('spreadsheetId');
    console.log('✅ Conexão resetada. Email mantido:', email);
  }
};

// Exporta globalmente
window.API = API;

// Log de inicialização
console.log('📡 API Client v3.1 carregado');
console.log('📊 Diagnóstico:', API.getDiagnostics());
