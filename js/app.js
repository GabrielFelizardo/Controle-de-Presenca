/**
 * APP.JS
 * Inicialização e coordenação da aplicação
 */

const App = {
    /**
     * Inicializa aplicação
     */
    init() {
        Utils.log('Iniciando aplicação');

        try {
            // ✅ CHECA QR SYNC ANTES DE CARREGAR DADOS
            QRSync.checkForQRSync();

            // Inicializa estado
            State.init();

            // Carrega dados salvos
            const hasData = Storage.load();

            // Se não tem dados, cria evento padrão
            if (!hasData || State.events.length === 0) {
                State.createDefaultEvent();
                Storage.save();
            }

            // Define evento atual
            if (!State.currentEventId && State.events.length > 0) {
                State.currentEventId = State.events[0].id;
            }

            // Inicializa UI
            UI.init();
            UI.renderTabs();
            UI.switchToEvent(State.currentEventId);

            // Valida integridade (apenas log)
            const errors = State.validateData();
            if (errors.length > 0) {
                console.warn('Avisos de validação:', errors);
            }

            // Setup auto-save periódico (a cada 30s)
            setInterval(() => {
                Storage.autoSave();
            }, 30000);

            // Log sucesso
            const info = Storage.getStorageInfo();
            Utils.log('Aplicação iniciada', 
                `${info.totalEvents} eventos, ${info.totalGuests} convidados, ${info.sizeKB.toFixed(1)}KB`
            );

            // Aviso se storage está cheio
            if (info.percentUsed > 80) {
                console.warn(`⚠️ Storage em ${info.percentUsed.toFixed(0)}%! Considere fazer backup.`);
            }

        } catch (error) {
            console.error('Erro ao inicializar aplicação:', error);
            alert('⚠️ Erro ao carregar aplicação. Verifique o console.');
        }
    },

    /**
     * Reinicia aplicação
     */
    restart() {
        Utils.log('Reiniciando aplicação');
        
        State.clearAll();
        State.createDefaultEvent();
        Storage.save();
        
        UI.renderTabs();
        UI.switchToEvent(State.events[0].id);
    },

    /**
     * Obtém informações da aplicação
     */
    getInfo() {
        return {
            version: '2.1',
            architecture: 'Modular',
            events: State.events.length,
            currentEvent: State.getCurrentEvent()?.name || null,
            storage: Storage.getStorageInfo(),
            features: {
                importMethods: ['paste', 'manual'],
                exportFormats: ['PDF', 'TXT', 'CSV', 'JSON'],
                cloudBackup: true,
                qrSync: true,
                autoSave: true,
                backup: true,
                statistics: true
            }
        };
    },

    /**
     * Modo debug (expõe objetos globalmente)
     */
    enableDebugMode() {
        window.DEBUG = {
            State,
            Storage,
            UI,
            Exports,
            Utils,
            CloudAssist,
            QRSync,
            App,
            info: () => App.getInfo(),
            export: () => console.log(JSON.stringify(State.exportState(), null, 2)),
            validate: () => console.log(State.validateData()),
            clear: () => {
                if (confirm('Limpar TUDO?')) {
                    App.restart();
                }
            }
        };
        
        console.log('🐛 Debug mode ativado!');
        console.log('Acesse via: window.DEBUG');
        console.log('Comandos: DEBUG.info(), DEBUG.export(), DEBUG.validate(), DEBUG.clear()');
    }
};

// Auto-inicializa quando DOM estiver pronto
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => App.init());
} else {
    App.init();
}

// Exporta globalmente
window.App = App;

// Ativa debug mode se URL tiver ?debug
if (window.location.search.includes('debug')) {
    App.enableDebugMode();
}

// Log de boas-vindas
console.log('%c📋 Sistema de Controle de Presença v2.1', 'font-size: 16px; font-weight: bold; color: #000;');
console.log('%cArquitetura Modular + Cloud Sync', 'color: #666;');
console.log('%cAdicione ?debug na URL para ativar modo debug', 'color: #0066ff;');
