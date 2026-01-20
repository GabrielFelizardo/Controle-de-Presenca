/**
 * APP.JS v3.1.1
 * ✅ CORRIGIDO: Não inicia até auth estar pronto
 */

const App = {
  async init() {
    console.log('🚀 App v3.1.1 iniciando...');
    
    try {
      this.loadConfig();
      this.initStorage();
      await this.loadData();
      this.initUI();
      this.initFeatures();
      this.enableAutoSave();
      
      console.log('✅ App inicializado');
      
    } catch (error) {
      console.error('❌ Erro na inicialização:', error);
      if (typeof UICore !== 'undefined') {
        UICore.showError('Erro ao inicializar: ' + error.message);
      }
    }
  },
  
  loadConfig() {
    if (typeof CONFIG !== 'undefined') {
      console.log('⚙️ CONFIG carregado:', CONFIG.VERSION);
    } else {
      console.warn('⚠️ CONFIG não encontrado');
    }
  },
  
  initStorage() {
    if (typeof Storage !== 'undefined') {
      Storage.init();
      console.log('💾 Storage inicializado');
    }
  },
  
  async loadData() {
    if (typeof State === 'undefined') {
      console.warn('⚠️ State não disponível');
      return;
    }
    
    // Carrega do localStorage
    if (typeof Storage !== 'undefined') {
      const loaded = Storage.load();
      if (loaded && State.events.length > 0) {
        console.log(`📊 ${State.events.length} evento(s) do localStorage`);
        return;
      }
    }
    
    // Se não tem dados locais e tem API
    if (typeof API !== 'undefined' && typeof AuthSystem !== 'undefined' && AuthSystem.spreadsheetId) {
      try {
        const result = await API.listEvents(AuthSystem.spreadsheetId);
        
        if (result.success && result.data && result.data.events) {
          // Converte eventos da API para formato local
          State.events = result.data.events.map(e => ({
            id: e.id || e.name,
            name: e.name,
            date: '',
            columns: [],
            guests: [],
            method: null
          }));
          
          console.log(`📊 ${State.events.length} evento(s) da API`);
        }
      } catch (error) {
        console.warn('⚠️ Erro ao carregar da API:', error);
      }
    }
    
    if (!State.events || State.events.length === 0) {
      State.events = [];
      console.log('📊 Iniciando vazio');
    }
  },
  
  initUI() {
    if (typeof UICore !== 'undefined') {
      UICore.init();
      console.log('🎨 UI inicializada');
    }
  },
  
  initFeatures() {
    if (typeof NameAutocomplete !== 'undefined') {
      NameAutocomplete.init();
    }
    
    if (typeof EditableTabs !== 'undefined') {
      EditableTabs.init();
    }
    
    if (typeof KeyboardShortcuts !== 'undefined') {
      KeyboardShortcuts.init();
    }
    
    if (typeof ErrorHandler !== 'undefined' && !ErrorHandler.enabled) {
      ErrorHandler.init();
    }
    
    console.log('✨ Features inicializadas');
  },
  
  enableAutoSave() {
    if (typeof Storage === 'undefined') return;
    
    setInterval(() => {
      Storage.save();
      this.updateAutoSaveIndicator();
    }, 300000);
    
    window.addEventListener('beforeunload', () => {
      Storage.save();
    });
    
    console.log('💾 Auto-save ativado');
  },
  
  updateAutoSaveIndicator() {
    const indicator = document.getElementById('auto-save');
    if (!indicator) return;
    
    indicator.textContent = '✓ SINCRONIZADO';
    indicator.style.opacity = '1';
    
    setTimeout(() => {
      indicator.style.opacity = '0.6';
    }, 2000);
  }
};

// Aguarda AuthSystem inicializar
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => {
      if (typeof AuthSystem !== 'undefined') {
        AuthSystem.init();
      }
    }, 100);
  });
} else {
  setTimeout(() => {
    if (typeof AuthSystem !== 'undefined') {
      AuthSystem.init();
    }
  }, 100);
}

window.App = App;
console.log('✅ App v3.1.1 carregado');
```
