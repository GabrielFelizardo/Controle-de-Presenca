/**
 * UI-GUESTS.JS
 * Funções de UI específicas para gestão de convidados
 * Complemento do ui.js
 */

// Estende o objeto UI
Object.assign(UI, {
    /**
     * Renderiza formulário manual
     */
    renderManualForm() {
        const event = State.getCurrentEvent();
        const container = document.getElementById('event-content');
        
        container.innerHTML = `
            <section class="manual-section active">
                <div class="form-group">
                    <label class="label">ADICIONAR CONVIDADOS</label>
                    <div id="manual-entries"></div>
                    <div class="action-bar" style="margin-top: var(--space-3);">
                        <button class="btn" id="btn-add-row">+ LINHA</button>
                        <button class="btn btn-success" id="btn-save-manual">CONFIRMAR</button>
                    </div>
                </div>
            </section>
        `;

        const entriesDiv = document.getElementById('manual-entries');
        event.guests.forEach((guest, idx) => {
            entriesDiv.appendChild(this.createManualRow(event.columns, guest, idx));
        });

        document.getElementById('btn-add-row').addEventListener('click', () => this.addManualRow());
        document.getElementById('btn-save-manual').addEventListener('click', () => this.saveManualGuests());
    },

    /**
     * Cria linha do formulário manual
     */
    createManualRow(columns, guest = {}, index) {
        const row = document.createElement('div');
        row.className = 'manual-entry-row';
        
        const fields = columns.map(col => `
            <div>
                <label class="label">${col.toUpperCase()}</label>
                <input type="text" class="input" value="${guest[col] || ''}" data-column="${col}">
            </div>
        `).join('');

        row.innerHTML = `
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: var(--space-2);">
                ${fields}
            </div>
            <button class="btn btn-danger btn-small" style="margin-top: var(--space-2);">REMOVER</button>
        `;

        const removeBtn = row.querySelector('.btn-danger');
        removeBtn.addEventListener('click', () => {
            if (document.querySelectorAll('.manual-entry-row').length > 1) {
                row.remove();
            } else {
                alert('Precisa ter pelo menos uma linha!');
            }
        });
        
        return row;
    },

    /**
     * Adiciona linha ao formulário manual
     */
    addManualRow() {
        const event = State.getCurrentEvent();
        const entriesDiv = document.getElementById('manual-entries');
        entriesDiv.appendChild(this.createManualRow(event.columns, {}, event.guests.length));
    },

    /**
     * Salva convidados do formulário manual
     */
    saveManualGuests() {
        const event = State.getCurrentEvent();
        const rows = document.querySelectorAll('.manual-entry-row');
        const guests = [];

        rows.forEach(row => {
            const guest = { 
                id: Utils.generateId(),
                status: null 
            };
            
            const inputs = row.querySelectorAll('input[data-column]');
            inputs.forEach(input => {
                guest[input.dataset.column] = input.value.trim();
            });
            
            if (Object.values(guest).some(v => v)) {
                guests.push(guest);
            }
        });

        if (guests.length === 0) {
            alert('Adicione pelo menos um convidado!');
            return;
        }

        State.setEventGuests(State.currentEventId, guests);
        Storage.save();
        this.renderEventContent();
    },

    /**
     * Reseta método de importação
     */
    resetMethod() {
        this.showConfirm('VOLTAR', 'Tem certeza? Os dados serão perdidos.', () => {
            const event = State.getCurrentEvent();
            event.method = null;
            event.columns = [];
            event.guests = [];
            Storage.save();
            this.renderEventContent();
        });
    },

    /**
     * Renderiza seção de convidados
     */
    renderGuestsSection(event) {
        const container = document.getElementById('event-content');
        
        const stats = State.calculateStats(event.id);
        const percentage = Utils.calculatePercentage(stats.yes, stats.total);

        container.innerHTML += `
            <section class="section">
                <div class="section-header">
                    <h2 class="heading-2">📊 ESTATÍSTICAS</h2>
                </div>
                <div class="stats-grid">
                    <div class="stat-card">
                        <div class="label">TOTAL</div>
                        <div class="stat-value">${stats.total}</div>
                        <div class="stat-meta">Convidados</div>
                    </div>
                    <div class="stat-card success">
                        <div class="label">CONFIRMADOS</div>
                        <div class="stat-value">${stats.yes}</div>
                        <div class="stat-meta">${percentage}%</div>
                        <div class="progress-bar">
                            <div class="progress-fill" style="width: ${percentage}%"></div>
                        </div>
                    </div>
                    <div class="stat-card danger">
                        <div class="label">RECUSAS</div>
                        <div class="stat-value">${stats.no}</div>
                        <div class="stat-meta">${Utils.calculatePercentage(stats.no, stats.total)}%</div>
                    </div>
                    <div class="stat-card">
                        <div class="label">PENDENTES</div>
                        <div class="stat-value">${stats.pending}</div>
                        <div class="stat-meta">Aguardando</div>
                    </div>
                </div>
            </section>

            <section class="table-card">
                <div class="table-header">
                    <h3 class="table-title">👥 CONVIDADOS (${event.guests.length})</h3>
                    <input type="text" class="search-input" placeholder="BUSCAR..." id="search-guests">
                </div>

                <div class="table-wrapper">
                    <div id="guests-cards"></div>
                    <table class="desktop-table">
                        <thead>
                            <tr>
                                ${event.columns.map(col => `<th><span class="label">${col.toUpperCase()}</span></th>`).join('')}
                                <th style="text-align: center;"><span class="label">STATUS</span></th>
                                <th><span class="label">AÇÕES</span></th>
                            </tr>
                        </thead>
                        <tbody id="guests-tbody"></tbody>
                    </table>
                </div>

                <div class="table-footer">
                    <div class="footer-info">${event.guests.length} CONVIDADOS</div>
                    <div class="footer-actions">
                        <button class="btn" id="btn-export-pdf-footer">📄 PDF</button>
                        <button class="btn" id="btn-export-txt-footer">📝 TXT</button>
                        <button class="btn" id="btn-export-csv-footer">📊 CSV</button>
                    </div>
                </div>
            </section>
        `;

        // Listeners
        document.getElementById('search-guests').addEventListener('keyup', (e) => this.filterGuests(e));
        document.getElementById('btn-export-pdf-footer').addEventListener('click', () => Exports.exportPDF(event.id));
        document.getElementById('btn-export-txt-footer').addEventListener('click', () => Exports.exportTXT(event.id));
        document.getElementById('btn-export-csv-footer').addEventListener('click', () => Exports.exportCSV(event.id));

        this.renderGuestsList(event);
    },

    /**
     * Renderiza lista de convidados
     */
    renderGuestsList(event) {
        const cardsContainer = document.getElementById('guests-cards');
        const tbodyContainer = document.getElementById('guests-tbody');

        cardsContainer.innerHTML = '';
        tbodyContainer.innerHTML = '';

        event.guests.forEach((guest, index) => {
            // Card mobile
            const card = this.createGuestCard(event, guest, index);
            cardsContainer.appendChild(card);

            // Row desktop
            const row = this.createGuestRow(event, guest, index);
            tbodyContainer.appendChild(row);
        });
    },

    /**
     * Cria card de convidado (mobile)
     */
    createGuestCard(event, guest, index) {
        const card = document.createElement('div');
        card.className = 'guest-card';
        card.dataset.status = guest.status || 'pending';
        
        const firstCol = event.columns[0];
        const statusBadge = guest.status === 'yes' ? '<span class="status-badge yes">✓ CONFIRMADO</span>' :
                           guest.status === 'no' ? '<span class="status-badge no">✗ NÃO VEM</span>' :
                           '<span class="status-badge pending">⏳ PENDENTE</span>';
        
        const otherFields = event.columns.slice(1).map(col => {
            if (!guest[col]) return '';
            const icon = Utils.getFieldIcon(col);
            return `
                <div class="guest-field-row">
                    <span class="field-icon">${icon}</span>
                    <span class="field-label">${col}:</span>
                    <span class="field-value">${guest[col]}</span>
                </div>
            `;
        }).join('');

        card.innerHTML = `
            <div class="guest-name">
                ${guest[firstCol] || '-'}
                ${statusBadge}
            </div>
            <div class="guest-fields">${otherFields}</div>
            <div class="presence-control">
                <label class="radio-group success">
                    <input type="radio" name="m${index}" ${guest.status === 'yes' ? 'checked' : ''}>
                    <span class="radio-label">SIM</span>
                </label>
                <label class="radio-group danger">
                    <input type="radio" name="m${index}" ${guest.status === 'no' ? 'checked' : ''}>
                    <span class="radio-label">NÃO</span>
                </label>
            </div>
            <div class="guest-actions">
                <button class="btn btn-small">✏ EDITAR</button>
                <button class="btn btn-small btn-danger">🗑 EXCLUIR</button>
            </div>
        `;

        // Listeners
        const radios = card.querySelectorAll('input[type="radio"]');
        radios[0].addEventListener('change', () => this.updateGuestStatus(index, 'yes'));
        radios[1].addEventListener('change', () => this.updateGuestStatus(index, 'no'));

        const buttons = card.querySelectorAll('.guest-actions button');
        buttons[0].addEventListener('click', () => this.editGuest(index));
        buttons[1].addEventListener('click', () => this.deleteGuest(index));

        return card;
    },

    /**
     * Cria linha de convidado (desktop)
     */
    createGuestRow(event, guest, index) {
        const row = document.createElement('tr');
        row.dataset.status = guest.status || 'pending';
        
        const cells = event.columns.map((col, idx) => {
            const value = guest[col] || '-';
            if (idx === 0) {
                const badge = guest.status === 'yes' ? '<span class="status-badge yes">✓</span>' :
                             guest.status === 'no' ? '<span class="status-badge no">✗</span>' :
                             '<span class="status-badge pending">⏳</span>';
                return `<td style="font-weight: var(--font-weight-bold);"><div style="display: flex; align-items: center; gap: 8px;">${value} ${badge}</div></td>`;
            }
            return `<td>${value}</td>`;
        }).join('');
        
        row.innerHTML = `
            ${cells}
            <td>
                <div class="presence-control">
                    <label class="radio-group success">
                        <input type="radio" name="d${index}" ${guest.status === 'yes' ? 'checked' : ''}>
                        <span class="radio-label">SIM</span>
                    </label>
                    <label class="radio-group danger">
                        <input type="radio" name="d${index}" ${guest.status === 'no' ? 'checked' : ''}>
                        <span class="radio-label">NÃO</span>
                    </label>
                </div>
            </td>
            <td>
                <div style="display: flex; gap: 4px;">
                    <button class="btn btn-small">✏</button>
                    <button class="btn btn-small btn-danger">×</button>
                </div>
            </td>
        `;

        // Listeners
        const radios = row.querySelectorAll('input[type="radio"]');
        radios[0].addEventListener('change', () => this.updateGuestStatus(index, 'yes'));
        radios[1].addEventListener('change', () => this.updateGuestStatus(index, 'no'));

        const buttons = row.querySelectorAll('td:last-child button');
        buttons[0].addEventListener('click', () => this.editGuest(index));
        buttons[1].addEventListener('click', () => this.deleteGuest(index));

        return row;
    },

    /**
     * Atualiza status do convidado
     */
    updateGuestStatus(index, status) {
        State.updateGuestStatus(State.currentEventId, index, status);
        Storage.autoSave();
        this.renderEventContent();
    },

    /**
     * Edita convidado
     */
    editGuest(index) {
        State.editingGuestIndex = index;
        const event = State.getCurrentEvent();
        const guest = event.guests[index];

        const fieldsHTML = event.columns.map(col => `
            <div class="form-group">
                <label class="label">${col.toUpperCase()}</label>
                <input type="text" class="input" id="edit-${col}" value="${guest[col] || ''}">
            </div>
        `).join('');

        document.getElementById('edit-fields').innerHTML = fieldsHTML;
        this.showModal('edit-modal');
    },

    /**
     * Salva edição do convidado
     */
    saveEditGuest() {
        const event = State.getCurrentEvent();
        const guest = event.guests[State.editingGuestIndex];

        event.columns.forEach(col => {
            const input = document.getElementById(`edit-${col}`);
            if (input) guest[col] = input.value.trim();
        });

        Storage.autoSave();
        this.closeModal('edit-modal');
        this.renderEventContent();
    },

    /**
     * Deleta convidado
     */
    deleteGuest(index) {
        this.showConfirm('EXCLUIR', 'Tem certeza?', () => {
            State.removeGuest(State.currentEventId, index);
            Storage.save();
            this.renderEventContent();
        });
    },

    /**
     * Filtra convidados pela busca
     */
    filterGuests(e) {
        const term = e.target.value.toLowerCase();
        const cards = document.querySelectorAll('.guest-card');
        const rows = document.querySelectorAll('#guests-tbody tr');

        [...cards, ...rows].forEach(item => {
            item.style.display = item.textContent.toLowerCase().includes(term) ? '' : 'none';
        });
    },

    /**
     * Mostra adicionar rápido
     */
    showQuickAdd() {
        const event = State.getCurrentEvent();
        if (!event || event.columns.length === 0) {
            alert('Crie colunas primeiro (escolha método Copiar/Colar ou Manual)!');
            return;
        }

        const fieldsHTML = event.columns.map(col => `
            <div class="form-group">
                <label class="label">${col.toUpperCase()}</label>
                <input type="text" class="input" id="qa-${col}">
            </div>
        `).join('');

        document.getElementById('quick-add-fields').innerHTML = fieldsHTML;
        this.showModal('quick-add-modal');
    },

    /**
     * Salva adição rápida
     */
    saveQuickAdd() {
        const event = State.getCurrentEvent();
        const guest = { 
            id: Utils.generateId(),
            status: null 
        };

        event.columns.forEach(col => {
            const input = document.getElementById(`qa-${col}`);
            if (input) guest[col] = input.value.trim();
        });

        if (Object.values(guest).some(v => v)) {
            State.addGuest(State.currentEventId, guest);
            Storage.autoSave();
            this.closeModal('quick-add-modal');
            this.renderEventContent();
        } else {
            alert('Preencha pelo menos um campo!');
        }
    },

    /**
     * Mostra edição em lote
     */
    showBulkEdit() {
        const event = State.getCurrentEvent();
        if (!event || event.guests.length === 0) {
            alert('Adicione convidados primeiro!');
            return;
        }
        this.showModal('bulk-edit-modal');
    },

    /**
     * Seleciona todos os convidados
     */
    selectAllGuests() {
        const event = State.getCurrentEvent();
        if (!event || event.guests.length === 0) return;

        State.selectedGuests.clear();
        event.guests.forEach((g, idx) => State.selectedGuests.add(idx));
        alert(`✓ ${State.selectedGuests.size} convidados selecionados! Use "Editar em Lote" para aplicar ações.`);
    },

    /**
     * Confirma todos os convidados
     */
    confirmAllGuests() {
        this.showConfirm('CONFIRMAR TODOS', 'Marcar TODOS como confirmados?', () => {
            State.confirmAllGuests(State.currentEventId);
            Storage.save();
            this.renderEventContent();
        });
    },

    /**
     * Recusa todos os convidados
     */
    rejectAllGuests() {
        this.showConfirm('RECUSAR TODOS', 'Marcar TODOS como recusados?', () => {
            State.rejectAllGuests(State.currentEventId);
            Storage.save();
            this.renderEventContent();
        });
    },

    /**
     * Reseta todos os convidados
     */
    resetAllGuests() {
        this.showConfirm('RESETAR STATUS', 'Resetar status de TODOS?', () => {
            State.resetAllGuests(State.currentEventId);
            Storage.save();
            this.renderEventContent();
        });
    },

    /**
     * Toggle modo compacto
     */
    toggleCompactMode() {
        State.compactMode = !State.compactMode;
        document.querySelectorAll('.guest-card').forEach(card => {
            card.classList.toggle('compact', State.compactMode);
        });
        alert(State.compactMode ? '✓ Modo compacto ativado' : '✓ Modo expandido ativado');
    },

    /**
     * Filtra visualização por status
     */
    filterView(filter) {
        const cards = document.querySelectorAll('.guest-card');
        const rows = document.querySelectorAll('#guests-tbody tr');

        [...cards, ...rows].forEach(item => {
            if (filter === 'all') {
                item.style.display = '';
            } else {
                item.style.display = item.dataset.status === filter ? '' : 'none';
            }
        });
    },

    /**
     * Ordena convidados
     */
    sortGuests(field) {
        const event = State.getCurrentEvent();
        if (!event || event.guests.length === 0) return;

        State.sortGuests(State.currentEventId, field);
        Storage.save();
        this.renderEventContent();
    },

    /**
     * Mostra estatísticas detalhadas
     */
    showDetailedStats() {
        const event = State.getCurrentEvent();
        if (!event || event.guests.length === 0) {
            alert('Adicione convidados primeiro!');
            return;
        }

        const stats = State.calculateStats(event.id);
        const percentage = Utils.calculatePercentage(stats.yes, stats.total);

        const html = `
            <div style="display: grid; gap: var(--space-4);">
                <div>
                    <h3 style="margin-bottom: 1rem;">RESUMO GERAL</h3>
                    <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: var(--space-2);">
                        <div style="padding: var(--space-3); background: var(--gray-100); border: 2px solid var(--gray-900);">
                            <div class="label">TOTAL</div>
                            <div style="font-size: 32px; font-weight: 900;">${stats.total}</div>
                        </div>
                        <div style="padding: var(--space-3); background: #e8f5e9; border: 2px solid var(--accent-success);">
                            <div class="label">TAXA CONFIRMAÇÃO</div>
                            <div style="font-size: 32px; font-weight: 900; color: var(--accent-success);">${percentage}%</div>
                        </div>
                    </div>
                </div>

                <div>
                    <h3 style="margin-bottom: 1rem;">DISTRIBUIÇÃO</h3>
                    <canvas id="stats-chart" width="400" height="200"></canvas>
                </div>

                <div>
                    <h3 style="margin-bottom: 1rem;">DETALHES</h3>
                    <table style="width: 100%; border-collapse: collapse;">
                        <tr style="border-bottom: 2px solid var(--gray-900);">
                            <th style="padding: var(--space-2); text-align: left;">Status</th>
                            <th style="padding: var(--space-2); text-align: right;">Quantidade</th>
                            <th style="padding: var(--space-2); text-align: right;">Percentual</th>
                        </tr>
                        <tr style="border-bottom: 1px solid var(--gray-300);">
                            <td style="padding: var(--space-2);">✓ Confirmados</td>
                            <td style="padding: var(--space-2); text-align: right; font-weight: bold;">${stats.yes}</td>
                            <td style="padding: var(--space-2); text-align: right;">${Utils.calculatePercentage(stats.yes, stats.total)}%</td>
                        </tr>
                        <tr style="border-bottom: 1px solid var(--gray-300);">
                            <td style="padding: var(--space-2);">✗ Recusas</td>
                            <td style="padding: var(--space-2); text-align: right; font-weight: bold;">${stats.no}</td>
                            <td style="padding: var(--space-2); text-align: right;">${Utils.calculatePercentage(stats.no, stats.total)}%</td>
                        </tr>
                        <tr>
                            <td style="padding: var(--space-2);">⏳ Pendentes</td>
                            <td style="padding: var(--space-2); text-align: right; font-weight: bold;">${stats.pending}</td>
                            <td style="padding: var(--space-2); text-align: right;">${Utils.calculatePercentage(stats.pending, stats.total)}%</td>
                        </tr>
                    </table>
                </div>
            </div>
        `;

        document.getElementById('stats-content').innerHTML = html;
        this.showModal('stats-modal');

        // Renderiza gráfico
        setTimeout(() => {
            const ctx = document.getElementById('stats-chart').getContext('2d');
            new Chart(ctx, {
                type: 'doughnut',
                data: {
                    labels: ['Confirmados', 'Recusas', 'Pendentes'],
                    datasets: [{
                        data: [stats.yes, stats.no, stats.pending],
                        backgroundColor: ['#00cc44', '#ff3333', '#cccccc'],
                        borderWidth: 2,
                        borderColor: '#ffffff'
                    }]
                },
                options: {
                    responsive: true,
                    plugins: {
                        legend: {
                            position: 'bottom'
                        }
                    }
                }
            });
        }, 100);
    },

    /**
     * Restaura backup
     */
    async restoreBackup() {
        const file = document.getElementById('restore-file').files[0];
        if (!file) {
            alert('Selecione um arquivo!');
            return;
        }

        try {
            await Storage.restoreBackup(file);
            this.closeModal('restore-modal');
            this.renderTabs();
            this.switchToEvent(State.events[0].id);
            alert('✓ Backup restaurado com sucesso!');
        } catch (error) {
            alert('Erro ao restaurar: ' + error.message);
        }
    }
});
