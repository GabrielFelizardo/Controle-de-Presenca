/**
 * CONFIGURAÇÕES DO SISTEMA v3.1.0
 * Centralizador de todas as configurações
 */

const CONFIG = {
  // ========================================
  // VERSÃO
  // ========================================
  VERSION: '3.1.0',
  BUILD_DATE: '2025-01-20',
  BUILD_TYPE: 'stable',
  
  // ========================================
  // API
  // ========================================
  API: {
    // URL padrão do script (substitua pela sua)
    DEFAULT_URL: 'https://script.google.com/macros/s/AKfycbxsGjeJ_KnQIFlwKpZiCfA4YYGYucBcCbJWyyt8dBX-40YNOeK1O04oxeyDLwFZrwH4ig/exec',
    
    // URL atual (pode ser alterada pelo usuário)
    get CURRENT_URL() {
      return localStorage.getItem('apiUrl') || this.DEFAULT_URL;
    },
    
    set CURRENT_URL(url) {
      localStorage.setItem('apiUrl', url);
    },
    
    // Timeout das requisições (ms)
    TIMEOUT: 30000,
    
    // Retry automático
    RETRY_ATTEMPTS: 3,
    RETRY_DELAY: 1000
  },
  
  // ========================================
  // STORAGE
  // ========================================
  STORAGE: {
    // Chave do localStorage
    KEY: 'presenca_data_v3',
    
    // Backup automático
    AUTO_BACKUP: true,
    BACKUP_INTERVAL: 300000, // 5 minutos
    
    // Compressão
    COMPRESS: true
  },
  
  // ========================================
  // UI
  // ========================================
  UI: {
    // Tema
    THEME: 'light', // 'light' ou 'dark'
    
    // Animações
    ANIMATIONS_ENABLED: true,
    
    // Modo compacto
    COMPACT_MODE: false,
    
    // Notificações
    NOTIFICATIONS_DURATION: 3000,
    
    // Auto-save visual
    SHOW_AUTO_SAVE_INDICATOR: true
  },
  
  // ========================================
  // FEATURES
  // ========================================
  FEATURES: {
    // Autocompletar nomes
    AUTOCOMPLETE: true,
    AUTOCOMPLETE_MIN_CHARS: 2,
    
    // QR Code sync
    QR_SYNC: true,
    
    // Cloud backup
    CLOUD_BACKUP: true,
    
    // Edição de tabs
    EDITABLE_TABS: true,
    
    // Templates
    COLUMN_TEMPLATES: true,
    
    // Estatísticas avançadas
    ADVANCED_STATS: true
  },
  
  // ========================================
  // VALIDAÇÃO
  // ========================================
  VALIDATION: {
    // Campos obrigatórios
    REQUIRED_FIELDS: ['name'],
    
    // Tamanho máximo de nome
    MAX_NAME_LENGTH: 100,
    
    // Tamanho máximo de nota
    MAX_NOTE_LENGTH: 500,
    
    // Email regex
    EMAIL_REGEX: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    
    // Telefone regex (BR)
    PHONE_REGEX: /^[0-9]{10,11}$/
  },
  
  // ========================================
  // EXPORTAÇÃO
  // ========================================
  EXPORT: {
    // PDF
    PDF: {
      FORMAT: 'a4',
      ORIENTATION: 'portrait',
      MARGIN: 15,
      FONT_SIZE: 10
    },
    
    // CSV
    CSV: {
      SEPARATOR: ',',
      ENCODING: 'UTF-8',
      BOM: true
    },
    
    // TXT
    TXT: {
      SEPARATOR: '\t',
      ENCODING: 'UTF-8'
    }
  },
  
  // ========================================
  // ERROR HANDLING
  // ========================================
  ERROR: {
    // Mostrar stack trace
    SHOW_STACK_TRACE: false,
    
    // Log no console
    LOG_TO_CONSOLE: true,
    
    // Enviar para servidor (futuro)
    SEND_TO_SERVER: false,
    
    // Salvar logs local
    SAVE_LOGS_LOCAL: true,
    MAX_LOGS: 100
  },
  
  // ========================================
  // SYNC
  // ========================================
  SYNC: {
    // Intervalo de sincronização automática
    AUTO_SYNC_INTERVAL: 60000, // 1 minuto
    
    // Sincronização em tempo real
    REALTIME_SYNC: true,
    
    // Resolver conflitos
    CONFLICT_RESOLUTION: 'server-wins' // 'server-wins', 'local-wins', 'merge'
  },
  
  // ========================================
  // MÉTODOS AUXILIARES
  // ========================================
  
  /**
   * Obtém configuração por caminho
   * Exemplo: CONFIG.get('API.TIMEOUT')
   */
  get(path) {
    const keys = path.split('.');
    let value = this;
    
    for (const key of keys) {
      value = value[key];
      if (value === undefined) return null;
    }
    
    return value;
  },
  
  /**
   * Define configuração
   * Exemplo: CONFIG.set('UI.THEME', 'dark')
   */
  set(path, newValue) {
    const keys = path.split('.');
    const lastKey = keys.pop();
    let obj = this;
    
    for (const key of keys) {
      if (!obj[key]) obj[key] = {};
      obj = obj[key];
    }
    
    obj[lastKey] = newValue;
    
    // Salva no localStorage se for configuração de usuário
    this.saveUserPreferences();
  },
  
  /**
   * Salva preferências do usuário
   */
  saveUserPreferences() {
    const prefs = {
      theme: this.UI.THEME,
      compactMode: this.UI.COMPACT_MODE,
      apiUrl: this.API.CURRENT_URL,
      autocomplete: this.FEATURES.AUTOCOMPLETE
    };
    
    localStorage.setItem('user_preferences', JSON.stringify(prefs));
  },
  
  /**
   * Carrega preferências do usuário
   */
  loadUserPreferences() {
    try {
      const saved = localStorage.getItem('user_preferences');
      if (!saved) return;
      
      const prefs = JSON.parse(saved);
      
      if (prefs.theme) this.UI.THEME = prefs.theme;
      if (prefs.compactMode !== undefined) this.UI.COMPACT_MODE = prefs.compactMode;
      if (prefs.apiUrl) this.API.CURRENT_URL = prefs.apiUrl;
      if (prefs.autocomplete !== undefined) this.FEATURES.AUTOCOMPLETE = prefs.autocomplete;
      
      console.log('✅ Preferências carregadas');
    } catch (error) {
      console.warn('⚠️ Erro ao carregar preferências:', error);
    }
  },
  
  /**
   * Reset para padrão
   */
  resetToDefault() {
    localStorage.removeItem('user_preferences');
    localStorage.removeItem('apiUrl');
    console.log('🔄 Configurações resetadas');
  }
};

// Carrega preferências ao iniciar
CONFIG.loadUserPreferences();

// Exporta globalmente
window.CONFIG = CONFIG;

console.log(`⚙️ CONFIG v${CONFIG.VERSION} carregado`);
