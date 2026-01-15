/**
 * STORAGE.JS
 * Gerenciamento de persistência de dados (localStorage)
 */

const Storage = {
    STORAGE_KEY: 'presenca_events',
    LAST_SAVE_KEY: 'presenca_last_save',
    MAX_SIZE_KB: 5120, // 5MB
    WARNING_SIZE_KB: 4000, // 4MB

    /**
     * Salva dados no localStorage
     * @returns {boolean} Sucesso da operação
     */
    save() {
        try {
            const data = JSON.stringify(State.events);
            
            // Verifica tamanho
            const sizeKB = Utils.getDataSizeKB(data);
            
            if (sizeKB > this.MAX_SIZE_KB) {
                alert(`❌ Dados muito grandes (${sizeKB.toFixed(0)}KB)! Faça backup e remova eventos antigos.`);
                return false;
            }

            if (sizeKB > this.WARNING_SIZE_KB) {
                console.warn(`⚠️ Storage: ${sizeKB.toFixed(0)}KB / ${this.MAX_SIZE_KB}KB`);
            }

            // Salva
            localStorage.setItem(this.STORAGE_KEY, data);
            localStorage.setItem(this.LAST_SAVE_KEY, new Date().toISOString());
            
            this.showSaveIndicator();
            Utils.log('Dados salvos', `${sizeKB.toFixed(1)}KB`);
            
            return true;

        } catch (e) {
            if (e.name === 'QuotaExceededError') {
                alert('❌ Armazenamento cheio! Faça backup e limpe dados antigos.');
            } else {
                alert('❌ Erro ao salvar: ' + e.message);
            }
            console.error('Erro ao salvar:', e);
            return false;
        }
    },

    /**
     * Carrega dados do localStorage
     * @returns {boolean} Sucesso da operação
     */
    load() {
        try {
            const saved = localStorage.getItem(this.STORAGE_KEY);
            
            if (!saved) {
                Utils.log('Nenhum dado salvo encontrado');
                return false;
            }

            const events = JSON.parse(saved);
            
            if (!Array.isArray(events)) {
                throw new Error('Formato inválido');
            }

            State.events = events;
            
            const lastSave = localStorage.getItem(this.LAST_SAVE_KEY);
            if (lastSave) {
                const date = new Date(lastSave);
                Utils.log('Dados carregados', date.toLocaleString('pt-BR'));
            }
            
            return true;

        } catch (e) {
            console.error('Erro ao carregar dados:', e);
            alert('⚠️ Erro ao carregar dados salvos. Iniciando nova sessão.');
            return false;
        }
    },

    /**
     * Limpa todos os dados do localStorage
     */
    clear() {
        localStorage.removeItem(this.STORAGE_KEY);
        localStorage.removeItem(this.LAST_SAVE_KEY);
        Utils.log('Storage limpo');
    },

    /**
     * Mostra indicador de salvamento automático
     */
    showSaveIndicator() {
        const indicator = document.getElementById('auto-save');
        if (!indicator) return;

        indicator.style.opacity = '1';
        setTimeout(() => {
            indicator.style.opacity = '0.5';
        }, 2000);
    },

    /**
     * Exporta backup completo
     * @returns {Object} Dados do backup
     */
    createBackup() {
        const backup = {
            version: '2.1',
            date: new Date().toISOString(),
            events: Utils.deepClone(State.events),
            metadata: {
                totalEvents: State.events.length,
                totalGuests: State.events.reduce((sum, e) => sum + e.guests.length, 0),
                createdAt: new Date().toISOString()
            }
        };

        return backup;
    },

    /**
     * Baixa backup como arquivo JSON
     */
    downloadBackup() {
        const backup = this.createBackup();
        const json = JSON.stringify(backup, null, 2);
        const blob = new Blob([json], { type: 'application/json' });
        
        const filename = `backup_presenca_${new Date().toISOString().split('T')[0]}.json`;
        Utils.downloadBlob(blob, filename);
        
        Utils.log('Backup gerado', filename);
    },

    /**
     * Restaura dados de um backup
     * @param {File} file - Arquivo de backup
     * @returns {Promise<boolean>} Sucesso da operação
     */
    async restoreBackup(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            
            reader.onload = (e) => {
                try {
                    const backup = JSON.parse(e.target.result);
                    
                    if (!backup.events || !Array.isArray(backup.events)) {
                        throw new Error('Formato de backup inválido');
                    }

                    // Valida versão
                    if (backup.version && backup.version !== '2.1' && backup.version !== '2.0') {
                        console.warn('Versão diferente:', backup.version);
                    }

                    // Restaura eventos
                    State.events = backup.events;
                    State.statsCache.clear();
                    
                    // Salva
                    this.save();
                    
                    Utils.log('Backup restaurado', `${backup.events.length} eventos`);
                    resolve(true);

                } catch (error) {
                    console.error('Erro ao restaurar backup:', error);
                    reject(error);
                }
            };

            reader.onerror = () => {
                reject(new Error('Erro ao ler arquivo'));
            };

            reader.readAsText(file);
        });
    },

    /**
     * Obtém informações sobre o storage
     * @returns {Object} Informações do storage
     */
    getStorageInfo() {
        try {
            const data = localStorage.getItem(this.STORAGE_KEY);
            const sizeKB = data ? Utils.getDataSizeKB(data) : 0;
            const lastSave = localStorage.getItem(this.LAST_SAVE_KEY);

            return {
                sizeKB: sizeKB,
                maxSizeKB: this.MAX_SIZE_KB,
                percentUsed: (sizeKB / this.MAX_SIZE_KB) * 100,
                lastSave: lastSave ? new Date(lastSave) : null,
                totalEvents: State.events.length,
                totalGuests: State.events.reduce((sum, e) => sum + e.guests.length, 0)
            };
        } catch (e) {
            console.error('Erro ao obter info do storage:', e);
            return null;
        }
    },

    /**
     * Verifica se há dados salvos
     * @returns {boolean} True se existem dados
     */
    hasData() {
        return localStorage.getItem(this.STORAGE_KEY) !== null;
    },

    /**
     * Exporta dados para formato CSV
     * @param {number} eventId - ID do evento
     * @returns {string} String CSV
     */
    exportToCSV(eventId) {
        const event = State.getEventById(eventId);
        if (!event || event.guests.length === 0) {
            throw new Error('Evento vazio ou não encontrado');
        }

        // Cabeçalho
        let csv = event.columns.join(',') + ',Status\n';
        
        // Dados
        event.guests.forEach(guest => {
            const row = event.columns.map(col => {
                const value = guest[col] || '';
                // Escapa vírgulas e aspas
                return value.includes(',') || value.includes('"') 
                    ? `"${value.replace(/"/g, '""')}"` 
                    : value;
            });
            
            const status = guest.status === 'yes' ? 'Confirmado' : 
                          guest.status === 'no' ? 'Não vem' : 'Pendente';
            row.push(status);
            
            csv += row.join(',') + '\n';
        });

        return csv;
    },

    /**
     * Exporta dados para formato TXT
     * @param {number} eventId - ID do evento
     * @returns {string} String formatada
     */
    exportToTXT(eventId) {
        const event = State.getEventById(eventId);
        if (!event || event.guests.length === 0) {
            throw new Error('Evento vazio ou não encontrado');
        }

        let content = `${event.name.toUpperCase()}\n${'='.repeat(50)}\n\n`;

        if (event.date) {
            content += `DATA: ${Utils.formatDateBR(event.date)}\n\n`;
        }

        event.guests.forEach((guest, i) => {
            const status = guest.status === 'yes' ? '[✓]' : 
                          guest.status === 'no' ? '[✗]' : '[ ]';
            const firstCol = event.columns[0];
            
            content += `${status} ${guest[firstCol] || '-'}\n`;
            
            event.columns.slice(1).forEach(col => {
                if (guest[col]) {
                    content += `   ${col}: ${guest[col]}\n`;
                }
            });
            content += '\n';
        });

        const stats = State.calculateStats(eventId);
        content += `${'='.repeat(50)}\n`;
        content += `Total: ${stats.total} | Sim: ${stats.yes} | Não: ${stats.no} | Pendentes: ${stats.pending}\n`;

        return content;
    },

    /**
     * Auto-save com debounce
     */
    autoSave: Utils.debounce(function() {
        Storage.save();
    }, 1000),

    /**
     * Migra dados de versão antiga (se necessário)
     * @param {Array} events - Eventos da versão antiga
     * @returns {Array} Eventos migrados
     */
    migrateData(events) {
        // Adiciona IDs aos convidados se não existirem
        return events.map(event => ({
            ...event,
            guests: event.guests.map(guest => ({
                ...guest,
                id: guest.id || Utils.generateId()
            }))
        }));
    },

    /**
     * Cria snapshot do estado atual
     * @returns {string} JSON do snapshot
     */
    createSnapshot() {
        return JSON.stringify(State.exportState(), null, 2);
    },

    /**
     * Restaura snapshot
     * @param {string} snapshotJson - JSON do snapshot
     * @returns {boolean} Sucesso
     */
    restoreSnapshot(snapshotJson) {
        try {
            const snapshot = JSON.parse(snapshotJson);
            return State.importState(snapshot);
        } catch (e) {
            console.error('Erro ao restaurar snapshot:', e);
            return false;
        }
    }
};

// Exporta globalmente
window.Storage = Storage;
