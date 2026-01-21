/**
 * APP.JS v3.1.3
 * ✅ CORRIGIDO: Ativa SheetSync após autenticação
 * ✅ CORRIGIDO: Sincroniza apenas eventos com colunas definidas
 */

const App = {
  async init() {
    console.log('🚀 App v3.1.2 iniciando...');
    
    try {
      this.loadConfig();
      await this.loadData();
      this.initUI();
      this.initFeatures();
      this.enableAutoSave();
      
      // ✅ NOVO: Ativa sincronização se estiver autenticado
      if (typeof AuthSystem !== 'undefined' && AuthSystem.authenticated) {
        this.enableSheetSync();
      }
      
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
            method: null,
            sheetName: e.sheetName,
            syncedToSheet: true
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
  
  // ✅ NOVO: Ativa sincronização com Sheets
  enableSheetSync() {
    if (typeof SheetSync === 'undefined') {
      console.warn('⚠️ SheetSync não disponível');
      return;
    }
    
    if (!AuthSystem.spreadsheetId) {
      console.warn('⚠️ Sem spreadsheetId - sincronização desabilitada');
      return;
    }
    
    try {
      SheetSync.enable();
      console.log('✅ SheetSync ativado com spreadsheetId:', AuthSystem.spreadsheetId);
      
      // ✅ NOVO: Sincroniza eventos locais existentes
      this.syncLocalEventsToSheet();
      
    } catch (error) {
      console.error('❌ Erro ao ativar SheetSync:', error);
    }
  },
  
  // ✅ CORRIGIDO: Sincroniza eventos que existem só localmente
  async syncLocalEventsToSheet() {
    if (!State.events || State.events.length === 0) return;
    
    console.log('🔄 Verificando eventos para sincronizar...');
    
    for (const event of State.events) {
      // ✅ CORREÇÃO: Só sincroniza se evento TEM COLUNAS definidas e TEM CONVIDADOS
      // Se não tem colunas ainda, vai sincronizar quando adicionar primeiro convidado
      if (!event.sheetName && !event.syncedToSheet && event.columns && event.columns.length > 0 && event.guests && event.guests.length > 0) {
        try {
          console.log(`📤 Criando evento "${event.name}" no Google Sheets com colunas:`, event.columns);
          
          const result = await API.createEvent(
            AuthSystem.spreadsheetId,
            event.name,
            event.date || '',
            '',
            event.columns  // ← PASSA AS COLUNAS CORRETAS!
          );
          
          if (result.success) {
            event.sheetName = result.data.sheetName || result.data.eventId;
            event.syncedToSheet = true;
            console.log(`✅ Evento "${event.name}" sincronizado`);
            
            // Agora adiciona os convidados
            for (const guest of event.guests) {
              try {
                await API.addGuest(
                  AuthSystem.spreadsheetId,
                  event.sheetName,
                  guest
                );
                console.log(`✅ Convidado "${guest[event.columns[0]]}" adicionado`);
              } catch (error) {
                console.error(`❌ Erro ao adicionar convidado:`, error);
              }
            }
          }
          
        } catch (error) {
          console.error(`❌ Erro ao sincronizar evento "${event.name}":`, error);
        }
      } else if (!event.sheetName && !event.syncedToSheet) {
        console.log(`ℹ️ Evento "${event.name}" ainda sem colunas - será sincronizado ao adicionar primeiro convidado`);
      }
    }
    
    Storage.save();
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
console.log('✅ App v3.1.2 carregado');
