/**
 * STATE.JS
 * Gerenciamento centralizado de estado da aplicação
 */

const State = {
    // Estado da aplicação
    events: [],
    currentEventId: null,
    editingGuestIndex: null,
    compactMode: false,
    selectedGuests: new Set(),
    statsCache: new Map(),

    /**
     * Inicializa estado
     */
    init() {
        this.events = [];
        this.currentEventId = null;
        this.editingGuestIndex = null;
        this.compactMode = false;
        this.selectedGuests = new Set();
        this.statsCache = new Map();
    },

    /**
     * Obtém evento atual
     * @returns {Object|null} Evento atual
     */
    getCurrentEvent() {
        return this.events.find(e => e.id === this.currentEventId);
    },

    /**
     * Obtém evento por ID
     * @param {number} eventId - ID do evento
     * @returns {Object|null} Evento encontrado
     */
    getEventById(eventId) {
        return this.events.find(e => e.id === eventId);
    },

    /**
     * Cria evento padrão
     * @returns {Object} Novo evento
     */
    createDefaultEvent() {
        const event = {
            id: Utils.generateId(),
            name: 'Primeiro Evento',
            date: '',
            columns: [],
            guests: [],
            method: null
        };
        this.events.push(event);
        return event;
    },

    /**
     * Adiciona novo evento
     * @param {string} name - Nome do evento
     * @param {string} date - Data do evento
     * @returns {Object} Evento criado
     */
    addEvent(name, date = '') {
        const event = {
            id: Utils.generateId(),
            name: name,
            date: date,
            columns: [],
            guests: [],
            method: null
        };
        this.events.push(event);
        return event;
    },

    /**
     * Remove evento
     * @param {number} eventId - ID do evento
     * @returns {boolean} Sucesso da operação
     */
    removeEvent(eventId) {
        const index = this.events.findIndex(e => e.id === eventId);
        if (index === -1) return false;
        
        this.events.splice(index, 1);
        this.clearStatsCache(eventId);
        return true;
    },

    /**
     * Duplica evento
     * @param {number} eventId - ID do evento a duplicar
     * @returns {Object|null} Novo evento
     */
    duplicateEvent(eventId) {
        const original = this.getEventById(eventId);
        if (!original || original.guests.length === 0) return null;

        const duplicate = {
            id: Utils.generateId(),
            name: original.name + ' (Cópia)',
            date: original.date,
            columns: [...original.columns],
            guests: original.guests.map(g => ({
                ...Utils.deepClone(g),
                id: Utils.generateId(),
                status: null // Reseta status
            })),
            method: original.method
        };

        this.events.push(duplicate);
        return duplicate;
    },

    /**
     * Atualiza método de importação do evento
     * @param {number} eventId - ID do evento
     * @param {string} method - Método ('paste' ou 'manual')
     */
    setEventMethod(eventId, method) {
        const event = this.getEventById(eventId);
        if (event) {
            event.method = method;
        }
    },

    /**
     * Define colunas do evento
     * @param {number} eventId - ID do evento
     * @param {Array<string>} columns - Array de nomes de colunas
     */
    setEventColumns(eventId, columns) {
        const event = this.getEventById(eventId);
        if (event) {
            event.columns = columns;
            this.clearStatsCache(eventId);
        }
    },

    /**
     * Adiciona convidado ao evento
     * @param {number} eventId - ID do evento
     * @param {Object} guest - Dados do convidado
     * @returns {boolean} Sucesso da operação
     */
    addGuest(eventId, guest) {
        const event = this.getEventById(eventId);
        if (!event) return false;

        guest.id = guest.id || Utils.generateId();
        guest.status = guest.status || null;
        event.guests.push(guest);
        this.clearStatsCache(eventId);
        return true;
    },

    /**
     * Atualiza convidado
     * @param {number} eventId - ID do evento
     * @param {number} guestIndex - Índice do convidado
     * @param {Object} guestData - Novos dados
     * @returns {boolean} Sucesso da operação
     */
    updateGuest(eventId, guestIndex, guestData) {
        const event = this.getEventById(eventId);
        if (!event || !event.guests[guestIndex]) return false;

        event.guests[guestIndex] = {
            ...event.guests[guestIndex],
            ...guestData
        };
        this.clearStatsCache(eventId);
        return true;
    },

    /**
     * Remove convidado
     * @param {number} eventId - ID do evento
     * @param {number} guestIndex - Índice do convidado
     * @returns {boolean} Sucesso da operação
     */
    removeGuest(eventId, guestIndex) {
        const event = this.getEventById(eventId);
        if (!event || !event.guests[guestIndex]) return false;

        event.guests.splice(guestIndex, 1);
        this.clearStatsCache(eventId);
        return true;
    },

    /**
     * Atualiza status do convidado
     * @param {number} eventId - ID do evento
     * @param {number} guestIndex - Índice do convidado
     * @param {string} status - Novo status ('yes', 'no', null)
     */
    updateGuestStatus(eventId, guestIndex, status) {
        const event = this.getEventById(eventId);
        if (!event || !event.guests[guestIndex]) return;

        event.guests[guestIndex].status = status;
        this.clearStatsCache(eventId);
    },

    /**
     * Substitui todos os convidados do evento
     * @param {number} eventId - ID do evento
     * @param {Array} guests - Nova lista de convidados
     */
    setEventGuests(eventId, guests) {
        const event = this.getEventById(eventId);
        if (!event) return;

        // Garante que cada convidado tem ID e status
        event.guests = guests.map(g => ({
            ...g,
            id: g.id || Utils.generateId(),
            status: g.status || null
        }));
        this.clearStatsCache(eventId);
    },

    /**
     * Calcula estatísticas do evento (com cache)
     * @param {number} eventId - ID do evento
     * @param {boolean} forceRecalc - Forçar recálculo
     * @returns {Object} Estatísticas
     */
    calculateStats(eventId, forceRecalc = false) {
        const event = this.getEventById(eventId);
        if (!event) return { total: 0, yes: 0, no: 0, pending: 0 };

        const cacheKey = `${eventId}-${event.guests.length}`;
        
        if (!forceRecalc && this.statsCache.has(cacheKey)) {
            return this.statsCache.get(cacheKey);
        }

        const stats = {
            total: event.guests.length,
            yes: event.guests.filter(g => g.status === 'yes').length,
            no: event.guests.filter(g => g.status === 'no').length,
            pending: event.guests.filter(g => !g.status).length
        };

        this.statsCache.set(cacheKey, stats);
        return stats;
    },

    /**
     * Limpa cache de estatísticas
     * @param {number} eventId - ID do evento (opcional)
     */
    clearStatsCache(eventId = null) {
        if (eventId) {
            // Remove apenas entradas deste evento
            for (const key of this.statsCache.keys()) {
                if (key.startsWith(`${eventId}-`)) {
                    this.statsCache.delete(key);
                }
            }
        } else {
            // Limpa todo o cache
            this.statsCache.clear();
        }
    },

    /**
     * Ordena convidados do evento
     * @param {number} eventId - ID do evento
     * @param {string} field - Campo para ordenar ('name' ou 'status')
     */
    sortGuests(eventId, field) {
        const event = this.getEventById(eventId);
        if (!event || event.guests.length === 0) return;

        if (field === 'name') {
            const firstCol = event.columns[0];
            event.guests.sort((a, b) => {
                const valA = (a[firstCol] || '').toLowerCase();
                const valB = (b[firstCol] || '').toLowerCase();
                return valA.localeCompare(valB);
            });
        } else if (field === 'status') {
            const statusOrder = { 'yes': 0, 'no': 1, 'null': 2 };
            event.guests.sort((a, b) => {
                return statusOrder[a.status || 'null'] - statusOrder[b.status || 'null'];
            });
        }
    },

    /**
     * Aplica ação em massa aos convidados
     * @param {number} eventId - ID do evento
     * @param {string} action - Ação ('yes', 'no', 'reset')
     * @param {Set<number>} guestIndices - Índices dos convidados
     */
    bulkUpdateStatus(eventId, action, guestIndices) {
        const event = this.getEventById(eventId);
        if (!event) return;

        guestIndices.forEach(index => {
            if (event.guests[index]) {
                if (action === 'yes') {
                    event.guests[index].status = 'yes';
                } else if (action === 'no') {
                    event.guests[index].status = 'no';
                } else if (action === 'reset') {
                    event.guests[index].status = null;
                }
            }
        });

        this.clearStatsCache(eventId);
    },

    /**
     * Confirma todos os convidados
     * @param {number} eventId - ID do evento
     */
    confirmAllGuests(eventId) {
        const event = this.getEventById(eventId);
        if (!event) return;

        event.guests.forEach(g => g.status = 'yes');
        this.clearStatsCache(eventId);
    },

    /**
     * Recusa todos os convidados
     * @param {number} eventId - ID do evento
     */
    rejectAllGuests(eventId) {
        const event = this.getEventById(eventId);
        if (!event) return;

        event.guests.forEach(g => g.status = 'no');
        this.clearStatsCache(eventId);
    },

    /**
     * Reseta status de todos os convidados
     * @param {number} eventId - ID do evento
     */
    resetAllGuests(eventId) {
        const event = this.getEventById(eventId);
        if (!event) return;

        event.guests.forEach(g => g.status = null);
        this.clearStatsCache(eventId);
    },

    /**
     * Limpa todos os dados
     */
    clearAll() {
        this.events = [];
        this.currentEventId = null;
        this.editingGuestIndex = null;
        this.compactMode = false;
        this.selectedGuests.clear();
        this.statsCache.clear();
    },

    /**
     * Exporta estado completo
     * @returns {Object} Estado serializado
     */
    exportState() {
        return {
            version: '2.1',
            date: new Date().toISOString(),
            events: Utils.deepClone(this.events),
            currentEventId: this.currentEventId,
            compactMode: this.compactMode
        };
    },

    /**
     * Importa estado
     * @param {Object} stateData - Dados do estado
     * @returns {boolean} Sucesso da operação
     */
    importState(stateData) {
        try {
            if (!stateData.events || !Array.isArray(stateData.events)) {
                throw new Error('Formato inválido');
            }

            this.events = stateData.events;
            this.currentEventId = stateData.currentEventId || (this.events[0]?.id || null);
            this.compactMode = stateData.compactMode || false;
            this.selectedGuests.clear();
            this.statsCache.clear();
            
            return true;
        } catch (error) {
            console.error('Erro ao importar estado:', error);
            return false;
        }
    },

    /**
     * Valida integridade dos dados
     * @returns {Array<string>} Lista de erros encontrados
     */
    validateData() {
        const errors = [];

        this.events.forEach((event, eventIndex) => {
            if (!event.id) {
                errors.push(`Evento ${eventIndex}: ID ausente`);
            }
            if (!event.name || Utils.isBlank(event.name)) {
                errors.push(`Evento ${eventIndex}: Nome inválido`);
            }
            if (!Array.isArray(event.columns)) {
                errors.push(`Evento ${eventIndex}: Colunas inválidas`);
            }
            if (!Array.isArray(event.guests)) {
                errors.push(`Evento ${eventIndex}: Convidados inválidos`);
            }

            // Valida duplicatas de IDs
            const guestIds = event.guests.map(g => g.id);
            if (guestIds.length !== new Set(guestIds).size) {
                errors.push(`Evento ${event.name}: IDs duplicados em convidados`);
            }
        });

        return errors;
    }
};

// Exporta globalmente
window.State = State;
