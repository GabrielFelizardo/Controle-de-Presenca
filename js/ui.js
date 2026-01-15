/**
 * UI.JS
 * Renderização e manipulação do DOM
 */

const UI = {
    /**
     * Inicializa listeners de eventos
     */
    init() {
        this.setupMenuListeners();
        this.setupModalListeners();
        this.setupKeyboardShortcuts();
        this.setupClickOutside();
    },

    /**
     * Configura listeners do menu
     */
    setupMenuListeners() {
        // Botões do menu
        document.querySelectorAll('[data-menu]').forEach(button => {
            button.addEventListener('click', (e) => {
                e.stopPropagation();
                this.toggleMenu(button);
            });
        });

        // Itens do menu (ações)
        document.querySelectorAll('[data-action]').forEach(item => {
            item.addEventListener('click', () => {
                const action = item.dataset.action;
                this.handleMenuAction(action);
                this.closeAllMenus();
            });
        });
    },

    /**
     * Configura listeners dos modais
     */
    setupModalListeners() {
        document.querySelectorAll('[data-modal-action]').forEach(button => {
            button.addEventListener('click', () => {
                const action = button.dataset.modalAction;
                this.handleModalAction(action);
            });
        });

        document.querySelectorAll('[data-bulk-action]').forEach(button => {
            button.addEventListener('click', () => {
                const action = button.dataset.bulkAction;
                this.handleBulkAction(action);
            });
        });
    },

    /**
     * Configura atalhos de teclado
     */
    setupKeyboardShortcuts() {
        document.addEventListener('keydown', (e) => {
            // Ctrl+S ou Cmd+S - Salvar
            if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') {
                e.preventDefault();
                Storage.save();
                alert('✓ Salvo!');
            }

            // Ctrl+P ou Cmd+P - Imprimir
            if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'p') {
                e.preventDefault();
                window.print();
            }

            // ESC - Fechar modais e menus
            if (e.key === 'Escape') {
                this.closeAllModals();
                this.closeAllMenus();
            }
        });
    },

    /**
     * Fecha menus ao clicar fora
     */
    setupClickOutside() {
        document.addEventListener('click', (e) => {
            if (!e.target.closest('.menu-item')) {
                this.closeAllMenus();
            }
        });
    },

    /**
     * Trata ações do menu
     */
    handleMenuAction(action) {
        const eventId = State.currentEventId;

        const actions = {
            'new-event': () => this.showModal('new-event-modal'),
            'save': () => { Storage.save(); alert('✓ Salvo!'); },
            'export-pdf': () => Exports.exportPDF(eventId),
            'export-txt': () => Exports.exportTXT(eventId),
            'export-csv': () => Exports.exportCSV(eventId),
            'print': () => window.print(),
            'duplicate-event': () => this.duplicateEvent(),
            'clear-all': () => this.clearAllData(),
            'quick-add': () => this.showQuickAdd(),
            'bulk-edit': () => this.showBulkEdit(),
            'select-all': () => this.selectAllGuests(),
            'confirm-all': () => this.confirmAllGuests(),
            'reject-all': () => this.rejectAllGuests(),
            'reset-all': () => this.resetAllGuests(),
            'toggle-compact': () => this.toggleCompactMode(),
            'filter-all': () => this.filterView('all'),
            'filter-yes': () => this.filterView('yes'),
            'filter-no': () => this.filterView('no'),
            'filter-pending': () => this.filterView('pending'),
            'sort-name': () => this.sortGuests('name'),
            'sort-status': () => this.sortGuests('status'),
            'detailed-stats': () => this.showDetailedStats(),
            'backup': () => Storage.downloadBackup(),
            'restore': () => this.showModal('restore-modal'),
            'help': () => this.showModal('help-modal'),
            'shortcuts': () => this.showModal('shortcuts-modal'),
            'about': () => this.showModal('about-modal')
        };

        if (actions[action]) {
            actions[action]();
        }
    },

    /**
     * Trata ações dos modais
     */
    handleModalAction(action) {
        const actions = {
            'cancel': () => this.closeAllModals(),
            'create-event': () => this.createNewEvent(),
            'save-edit': () => this.saveEditGuest(),
            'save-quick-add': () => this.saveQuickAdd(),
            'restore-backup': () => this.restoreBackup()
        };

        if (actions[action]) {
            actions[action]();
        }
    },

    /**
     * Trata ações em lote
     */
    handleBulkAction(action) {
        if (State.selectedGuests.size === 0) {
            alert('Selecione convidados primeiro (menu Editar → Selecionar Todos)!');
            return;
        }

        State.bulkUpdateStatus(State.currentEventId, action, State.selectedGuests);
        Storage.autoSave();
        this.closeModal('bulk-edit-modal');
        this.renderEventContent();
        State.selectedGuests.clear();
    },

    /**
     * Toggle menu dropdown
     */
    toggleMenu(button) {
        this.closeAllMenus();
        const dropdown = button.nextElementSibling;
        dropdown.classList.toggle('active');
        button.classList.toggle('active');
    },

    /**
     * Fecha todos os menus
     */
    closeAllMenus() {
        document.querySelectorAll('.dropdown').forEach(d => d.classList.remove('active'));
        document.querySelectorAll('.menu-button').forEach(b => b.classList.remove('active'));
    },

    /**
     * Mostra modal
     */
    showModal(modalId) {
        document.getElementById(modalId).classList.add('active');
    },

    /**
     * Fecha modal específico
     */
    closeModal(modalId) {
        document.getElementById(modalId).classList.remove('active');
    },

    /**
     * Fecha todos os modais
     */
    closeAllModals() {
        document.querySelectorAll('.modal.active').forEach(m => m.classList.remove('active'));
    },

    /**
     * Mostra modal de confirmação
     */
    showConfirm(title, message, callback) {
        document.getElementById('confirm-title').textContent = title;
        document.getElementById('confirm-message').textContent = message;
        
        const confirmBtn = document.getElementById('confirm-action');
        confirmBtn.onclick = () => {
            callback();
            this.closeModal('confirm-modal');
        };
        
        this.showModal('confirm-modal');
    },

    /**
     * Renderiza abas dos eventos
     */
    renderTabs() {
        const container = document.getElementById('tabs-container');
        container.innerHTML = '';

        State.events.forEach(event => {
            const tab = document.createElement('button');
            tab.className = `tab ${event.id === State.currentEventId ? 'active' : ''}`;
            
            let tabContent = event.name;
            if (State.events.length > 1) {
                tabContent += `<span class="tab-close">×</span>`;
            }
            tab.innerHTML = tabContent;
            
            tab.addEventListener('click', (e) => {
                if (e.target.classList.contains('tab-close')) {
                    e.stopPropagation();
                    this.deleteEvent(event.id);
                } else {
                    this.switchToEvent(event.id);
                }
            });
            
            container.appendChild(tab);
        });

        // Botão nova aba
        const newTab = document.createElement('button');
        newTab.className = 'tab new-tab';
        newTab.textContent = '+ NOVO';
        newTab.addEventListener('click', () => this.showModal('new-event-modal'));
        container.appendChild(newTab);
    },

    /**
     * Troca para evento específico
     */
    switchToEvent(eventId) {
        State.currentEventId = eventId;
        this.renderTabs();
        this.renderEventContent();
    },

    /**
     * Cria novo evento
     */
    createNewEvent() {
        const name = document.getElementById('new-event-name').value.trim();
        const date = document.getElementById('new-event-date').value;
        
        if (!name) {
            alert('Digite o nome do evento!');
            return;
        }

        const event = State.addEvent(name, date);
        Storage.save();
        this.closeModal('new-event-modal');
        this.switchToEvent(event.id);
        
        // Limpa campos
        document.getElementById('new-event-name').value = '';
        document.getElementById('new-event-date').value = '';
    },

    /**
     * Deleta evento
     */
    deleteEvent(eventId) {
        this.showConfirm('EXCLUIR EVENTO', 'Tem certeza?', () => {
            State.removeEvent(eventId);
            Storage.save();
            
            if (State.currentEventId === eventId) {
                this.switchToEvent(State.events[0].id);
            } else {
                this.renderTabs();
            }
        });
    },

    /**
     * Duplica evento atual
     */
    duplicateEvent() {
        const newEvent = State.duplicateEvent(State.currentEventId);
        
        if (!newEvent) {
            alert('Crie convidados antes de duplicar!');
            return;
        }

        Storage.save();
        this.renderTabs();
        this.switchToEvent(newEvent.id);
        alert('✓ Evento duplicado! Status resetado.');
    },

    /**
     * Limpa todos os dados
     */
    clearAllData() {
        this.showConfirm('LIMPAR TUDO', 'Tem certeza? Todos os eventos serão excluídos.', () => {
            Storage.clear();
            State.clearAll();
            State.createDefaultEvent();
            Storage.save();
            this.renderTabs();
            this.switchToEvent(State.events[0].id);
        });
    },

    /**
     * Renderiza conteúdo do evento
     */
    renderEventContent() {
        const event = State.getCurrentEvent();
        const container = document.getElementById('event-content');

        if (!event.method) {
            this.renderMethodChoice();
        } else if (event.method === 'paste') {
            this.renderPasteSection(event);
        } else if (event.method === 'manual') {
            this.renderManualSection(event);
        }
    },

    /**
     * Renderiza escolha de método
     */
    renderMethodChoice() {
        const container = document.getElementById('event-content');
        container.innerHTML = `
            <section class="choice-section">
                <div class="section-header">
                    <h2 class="heading-2">ESCOLHA O MÉTODO</h2>
                </div>
                <div class="choice-grid">
                    <div class="choice-card" data-method="paste">
                        <div class="choice-icon">📋</div>
                        <h3 class="choice-title">Copiar e Colar</h3>
                        <p class="choice-description">Cole dados direto da sua planilha. Rápido e simples.</p>
                    </div>
                    <div class="choice-card" data-method="manual">
                        <div class="choice-icon">✍️</div>
                        <h3 class="choice-title">Criar Manual</h3>
                        <p class="choice-description">Adicione convidados manualmente no sistema.</p>
                    </div>
                </div>
            </section>
        `;

        document.querySelectorAll('[data-method]').forEach(card => {
            card.addEventListener('click', () => {
                const method = card.dataset.method;
                State.setEventMethod(State.currentEventId, method);
                Storage.save();
                this.renderEventContent();
            });
        });
    },

    /**
     * Renderiza seção de colar dados
     */
    renderPasteSection(event) {
        const container = document.getElementById('event-content');
        container.innerHTML = `
            <section class="import-section active">
                <div class="form-group">
                    <label class="label">COLE OS DADOS DA PLANILHA</label>
                    <textarea id="paste-data" class="input" style="min-height: 200px; font-family: monospace; font-size: 13px;" placeholder="Ctrl+A na planilha → Ctrl+C → Ctrl+V aqui"></textarea>
                    <div class="help-note">
                        <p class="body-text-small"><strong>PASSO A PASSO:</strong></p>
                        <p class="body-text-small">1. Abra sua planilha no Google Sheets</p>
                        <p class="body-text-small">2. Selecione TUDO (Ctrl+A)</p>
                        <p class="body-text-small">3. Copie (Ctrl+C)</p>
                        <p class="body-text-small">4. Cole acima (Ctrl+V)</p>
                        <p class="body-text-small">5. Clique em IMPORTAR</p>
                        <p class="body-text-small"><strong>IMPORTANTE:</strong> Primeira linha = nomes das colunas</p>
                    </div>
                    <div class="action-bar" style="margin-top: var(--space-3);">
                        <button class="btn btn-success" id="btn-import-paste">IMPORTAR</button>
                        <button class="btn" id="btn-reset-method">← VOLTAR</button>
                    </div>
                </div>
            </section>
        `;

        document.getElementById('btn-import-paste').addEventListener('click', () => this.loadPastedData());
        document.getElementById('btn-reset-method').addEventListener('click', () => this.resetMethod());

        if (event.guests.length > 0) {
            this.renderGuestsSection(event);
        }
    },

    /**
     * Carrega dados colados
     */
    loadPastedData() {
        const data = document.getElementById('paste-data').value.trim();
        if (!data) {
            alert('Cole os dados da planilha!');
            return;
        }

        try {
            const lines = data.split('\n')
                .map(l => l.trim())
                .filter(l => l);
            
            if (lines.length < 2) {
                throw new Error('Precisa de cabeçalho + pelo menos 1 linha de dados');
            }

            // Detecta separador
            const separator = Utils.detectSeparator(lines[0]);

            // Extrai colunas
            const columns = lines[0].split(separator)
                .map(c => c.trim())
                .filter(c => c && c !== '');

            // Valida colunas únicas
            if (new Set(columns).size !== columns.length) {
                throw new Error('Colunas duplicadas detectadas!');
            }

            // Processa convidados
            const guests = [];
            for (let i = 1; i < lines.length; i++) {
                const values = lines[i].split(separator);
                
                // Pula linhas vazias
                if (values.every(v => !v.trim())) continue;
                
                const guest = { 
                    id: Utils.generateId(),
                    status: null 
                };
                
                columns.forEach((col, idx) => {
                    guest[col] = (values[idx] || '').trim();
                });
                
                guests.push(guest);
            }

            if (guests.length === 0) {
                throw new Error('Nenhum dado válido encontrado!');
            }

            Utils.log('Importação', `${guests.length} convidados, ${columns.length} colunas`);

            // Pergunta se quer sobrescrever (se já tiver dados)
            const event = State.getCurrentEvent();
            if (event.guests.length > 0) {
                this.showConfirm(
                    'SOBRESCREVER DADOS',
                    `Você tem ${event.guests.length} convidados. Substituir?`,
                    () => {
                        State.setEventColumns(State.currentEventId, columns);
                        State.setEventGuests(State.currentEventId, guests);
                        Storage.save();
                        this.renderEventContent();
                    }
                );
            } else {
                State.setEventColumns(State.currentEventId, columns);
                State.setEventGuests(State.currentEventId, guests);
                Storage.save();
                this.renderEventContent();
            }

        } catch (error) {
            alert(`❌ ERRO: ${error.message}\n\nDica: Verifique se copiou corretamente da planilha.`);
            console.error('Parse error:', error);
        }
    },

    /**
     * Renderiza seção manual
     */
    renderManualSection(event) {
        const container = document.getElementById('event-content');

        if (event.guests.length === 0) {
            container.innerHTML = `
                <section class="manual-section active">
                    <div class="form-group">
                        <label class="label">DEFINA AS COLUNAS</label>
                        <input type="text" class="input" id="column-names" placeholder="Ex: Nome, Telefone, Email, Cidade (separado por vírgula)">
                        <div class="help-note">
                            <p class="body-text-small">Digite os nomes das colunas que você quer, separados por vírgula.</p>
                        </div>
                        <button class="btn btn-success" style="margin-top: var(--space-2);" id="btn-setup-columns">DEFINIR COLUNAS</button>
                    </div>
                    <button class="btn" id="btn-reset-method-2">← VOLTAR</button>
                </section>
            `;

            document.getElementById('btn-setup-columns').addEventListener('click', () => this.setupManualColumns());
            document.getElementById('btn-reset-method-2').addEventListener('click', () => this.resetMethod());
        } else {
            this.renderGuestsSection(event);
        }
    },

    /**
     * Continua em outro bloco devido ao tamanho...
     * (Este arquivo está ficando muito grande, vou dividir em mais linhas)
     */
    setupManualColumns() {
        const input = document.getElementById('column-names').value.trim();
        if (!input) {
            alert('Digite os nomes das colunas!');
            return;
        }

        const columns = input.split(',').map(c => c.trim()).filter(c => c);
        if (columns.length === 0) {
            alert('Digite pelo menos uma coluna!');
            return;
        }

        State.setEventColumns(State.currentEventId, columns);
        
        const firstGuest = { id: Utils.generateId(), status: null };
        columns.forEach(col => firstGuest[col] = '');
        State.setEventGuests(State.currentEventId, [firstGuest]);
        
        Storage.save();
        this.renderManualForm();
    },

    // Continua no próximo arquivo...
};

// Exporta globalmente
window.UI = UI;
