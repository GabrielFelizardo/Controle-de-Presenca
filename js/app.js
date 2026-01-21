/**
 * APP v4.0 - Completo
 * Inicialização Cloud First com suporte a legado
 */

const App = {
  async init() {
    console.log('🚀 App v4.0 iniciando...');
    
    // 1. Carrega Configurações
    this.loadConfig();

    // 2. Inicializa UI
    if (typeof UICore !== 'undefined') UICore.init();
    
    // 3. Verifica Autenticação e Carrega Dados
    if (typeof AuthSystem !== 'undefined') {
      AuthSystem.init();
      
      if (AuthSystem.isAuthenticated) {
        // Fluxo Cloud: Carrega direto da planilha
        await this.loadDataFromCloud();
      } else {
        // Fluxo Offline/Logout
        console.log('Aguardando login...');
        this.updateSyncIndicator('offline');
      }
    }
    
    // 4. Inicia Funcionalidades Extras
    this.initFeatures();
    
    // 5. Configura Auto-Refresh (Polling)
    this.enableCloudPolling();
  },
  
  loadConfig() {
    if (typeof CONFIG !== 'undefined') {
      CONFIG.loadUserPreferences();
      console.log('⚙️ Configurações carregadas');
    }
  },

  async loadDataFromCloud() {
    if (!AuthSystem.spreadsheetId) return;

    try {
      this.updateSyncIndicator('syncing');
      if (typeof UICore !== 'undefined') UICore.showLoading('☁️ Baixando dados da planilha...');
      
      const result = await API.getFullData(AuthSystem.spreadsheetId);
      
      if (result.success) {
        // A planilha é a verdade absoluta
        State.events = result.data.events;
        
        // Mantém seleção de evento se possível
        if (!State.currentEventId && State.events.length > 0) {
          State.currentEventId = State.events[0].id;
        }
        
        // Atualiza Interface
        if (typeof UICore !== 'undefined') {
          UICore.renderTabs();
          UICore.render();
          UICore.hideLoading();
        }
        
        // Salva backup local
        if (typeof Storage !== 'undefined') Storage.save();
        
        this.updateSyncIndicator('synced');
        console.log('✅ Dados sincronizados com a nuvem');
      }
    } catch (error) {
      console.error('Erro no sync:', error);
      this.updateSyncIndicator('error');
      if (typeof UICore !== 'undefined') {
        UICore.hideLoading();
        UICore.showError('Erro ao baixar dados. Verifique a internet.');
      }
    }
  },

  initFeatures() {
    if (typeof NameAutocomplete !== 'undefined') NameAutocomplete.init();
    if (typeof EditableTabs !== 'undefined') EditableTabs.init();
    if (typeof SheetSync !== 'undefined') SheetSync.enable();
    
    // Atalhos de teclado
    if (typeof KeyboardShortcuts !== 'undefined') KeyboardShortcuts.init();
  },

  enableCloudPolling() {
    // Atualiza a cada 5 minutos para pegar novos convidados do form
    setInterval(() => {
      if (AuthSystem.isAuthenticated) {
        console.log('🔄 Auto-refresh da nuvem...');
        // Faz refresh silencioso (sem bloquear tela)
        API.getFullData(AuthSystem.spreadsheetId).then(result => {
            if(result.success) {
                State.events = result.data.events;
                if (typeof UICore !== 'undefined') UICore.render();
                this.updateSyncIndicator('synced');
            }
        }).catch(err => console.warn('Falha no auto-refresh', err));
      }
    }, 300000); // 5 min
  },

  updateSyncIndicator(status) {
    const indicator = document.getElementById('auto-save');
    if (!indicator) return;

    const messages = {
      'syncing': { text: '☁️ SINCRONIZANDO...', color: '#666', opacity: 1 },
      'synced': { text: '✓ NUVEM OK', color: '#00cc44', opacity: 0.7 },
      'error': { text: '⚠ ERRO DE SYNC', color: '#ff3333', opacity: 1 },
      'offline': { text: 'OFFLINE', color: '#999', opacity: 0.5 }
    };

    const config = messages[status] || messages['offline'];
    
    indicator.textContent = config.text;
    indicator.style.color = config.color;
    indicator.style.opacity = config.opacity;
  }
};

window.App = App;
