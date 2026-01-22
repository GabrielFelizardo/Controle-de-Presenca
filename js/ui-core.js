/**
 * UI-CORE.JS v3.1.1
 * Sistema consolidado de Interface do Usuário
 * ✅ CORRIGIDO: Adicionadas funções showLoadingOverlay e hideLoadingOverlay
 * * Responsabilidades:
 * - Renderização de eventos
 * - Gestão de convidados
 * - Modais e notificações
 * - Event listeners
 */

"use strict";

const UICore = {
  // ========================================
  // INICIALIZAÇÃO
  // ========================================
  
  // Flag para evitar dupla inicialização
  initialized: false,

  /**
   * Inicializa sistema de UI
   */
  init() {
    if (this.initialized) return; // ✅ Evita rodar duas vezes
    
    console.log('🎨 UICore v3.1.1 inicializando...');
    
    try {
      this.attachGlobalListeners();
      this.renderTabs();
      
      if (State.events.length > 0) {
        if (!State.currentEventId) {
          State.currentEventId = State.events[0].id;
        }
        this.render();
      } else {
        this.renderEmptyState();
      }
      
      this.initialized = true; // ✅ Marca como iniciado
      console.log('✅ UICore inicializado');
    } catch (error) {
      console.error('❌ Erro ao inicializar UICore:', error);
      throw error;
    }
  },
  
  // ========================================
  // RENDERIZAÇÃO PRINCIPAL
  // ========================================
  
  /**
   * Renderiza UI completa do evento atual
   */
  render() {
    const event = State.getCurrentEvent();
    
    if (!event) {
      this.renderEmptyState();
      return;
    }
    
    const container = document.getElementById('event-content');
    if (!container) {
      console.error('Container #event-content não encontrado');
      return;
    }
    
    try {
      container.innerHTML = `
        <div class="stats-grid">
          ${this.renderStats(event)}
        </div>
        
        ${!event.method ? this.renderMethodChoice() : ''}
        
        ${this.renderMethodContent(event)}
        
        ${event.guests && event.guests.length > 0 ? this.renderGuestsTable(event) : ''}
      `;
      
      this.attachEventListeners();
      
    } catch (error) {
      console.error('Erro ao renderizar:', error);
      this.showError('Erro ao renderizar interface');
    }
  },
  
  /**
   * Renderiza estado vazio (nenhum evento)
   */
  renderEmptyState() {
    const container = document.getElementById('event-content');
    if (!container) return;
    
    container.innerHTML = `
      <div style="text-align: center; padding: var(--space-8) var(--space-4);">
        <div style="font-size: 64px; margin-bottom: var(--space-4); opacity: 0.3;">📋</div>
        <h2 class="heading-2" style="margin-bottom: var(--space-2);">
          NENHUM EVENTO CRIADO
        </h2>
        <p class="body-text-small" style="margin-bottom: var(--space-4); color: var(--gray-600);">
          Clique no botão abaixo ou use o menu Arquivo → Novo Evento
        </p>
        <button class="btn btn-primary" data-action="new-event">
          + CRIAR PRIMEIRO EVENTO
        </button>
      </div>
    `;
  },
  
  // ========================================
  // TABS
  // ========================================
  
  /**
   * Renderiza abas de eventos
   */
  renderTabs() {
    const tabsContainer = document.getElementById('tabs-container');
    if (!tabsContainer) return;
    
    tabsContainer.innerHTML = '';
    
    State.events.forEach(event => {
      const tab = document.createElement('button');
      tab.className = 'tab';
      tab.dataset.eventId = event.id;
      
      if (event.id === State.currentEventId) {
        tab.classList.add('active');
      }
      
      // Estrutura para edição inline
      tab.innerHTML = `
        <span class="tab-content-wrapper">
          <span class="tab-name-text">${event.name}</span>
          <span class="tab-edit-icon" title="Editar nome">✏️</span>
        </span>
      `;
      
      // Botão fechar (se tiver múltiplos eventos)
      if (State.events.length > 1) {
        const closeBtn = document.createElement('span');
        closeBtn.className = 'tab-close';
        closeBtn.textContent = '×';
        closeBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          this.deleteEvent(event.id);
        });
        tab.appendChild(closeBtn);
      }
      
      // Clique na aba
      tab.addEventListener('click', () => this.switchToEvent(event.id));
      
      tabsContainer.appendChild(tab);
    });
    
    // Botão nova aba
    const newTab = document.createElement('button');
    newTab.className = 'tab new-tab';
    newTab.textContent = '+ NOVO';
    newTab.addEventListener('click', () => this.showNewEventModal());
    tabsContainer.appendChild(newTab);
  },
  
  /**
   * Troca para evento específico
   */
  switchToEvent(eventId) {
    State.currentEventId = eventId;
    this.renderTabs();
    this.render();
    Storage.save();
  },
  
  /**
   * Deleta evento
   */
  async deleteEvent(eventId) {
    const event = State.getEventById(eventId);
    if (!event) return;
    
    const confirmed = await this.showConfirm(
      'DELETAR EVENTO',
      `Tem certeza que deseja deletar "${event.name}"?\n\nEsta ação não pode ser desfeita.`
    );
    
    if (!confirmed) return;
    
    try {
      const success = State.removeEvent(eventId);
      
      if (!success) {
        throw new Error('Falha ao remover evento');
      }
      
      // Se deletou o evento atual, vai pro primeiro
      if (State.currentEventId === eventId) {
        State.currentEventId = State.events[0]?.id || null;
      }
      
      Storage.save();
      this.renderTabs();
      this.render();
      this.showNotification('Evento deletado', 'success');
      
    } catch (error) {
      console.error('Erro ao deletar evento:', error);
      this.showError('Erro ao deletar evento');
    }
  },
  
  // ========================================
  // ESTATÍSTICAS
  // ========================================
  
  renderStats(event) {
    const stats = State.calculateStats(event.id);
    const confirmedPercent = event.guests.length > 0 
      ? Math.round((stats.yes / event.guests.length) * 100) 
      : 0;
    
    return `
      <div class="stat-card">
        <div class="label">TOTAL</div>
        <div class="stat-value">${event.guests.length}</div>
        <div class="stat-meta">CONVIDADOS</div>
      </div>
      
      <div class="stat-card success">
        <div class="label">CONFIRMADOS</div>
        <div class="stat-value">${stats.yes}</div>
        <div class="stat-meta">${confirmedPercent}%</div>
        <div class="progress-bar">
          <div class="progress-fill" style="width: ${confirmedPercent}%"></div>
        </div>
      </div>
      
      <div class="stat-card danger">
        <div class="label">RECUSAS</div>
        <div class="stat-value">${stats.no}</div>
        <div class="stat-meta">${Math.round((stats.no / (event.guests.length || 1)) * 100)}%</div>
      </div>
      
      <div class="stat-card">
        <div class="label">PENDENTES</div>
        <div class="stat-value">${stats.pending}</div>
        <div class="stat-meta">AGUARDANDO</div>
      </div>
    `;
  },
  
  // ========================================
  // ESCOLHA DE MÉTODO
  // ========================================
  
  renderMethodChoice() {
    return `
      <section class="choice-section section">
        <div class="section-header">
          <h2 class="heading-2">COMO ADICIONAR CONVIDADOS?</h2>
        </div>
        <div class="choice-grid">
          <div class="choice-card" data-choice="paste">
            <div class="choice-icon">📋</div>
            <div class="choice-title">COPIAR/COLAR</div>
            <div class="choice-description">
              Cole dados de uma planilha do Excel ou Google Sheets
            </div>
          </div>
          
          <div class="choice-card" data-choice="manual">
            <div class="choice-icon">✍️</div>
            <div class="choice-title">MANUAL</div>
            <div class="choice-description">
              Adicione convidados um por um através de formulário
            </div>
          </div>
        </div>
      </section>
    `;
  },
  
  renderMethodContent(event) {
    if (!event.method) return '';
    
    switch(event.method) {
      case 'paste':
        return this.renderPasteSection(event);
      case 'manual':
        return this.renderManualSection(event);
      default:
        return '';
    }
  },
  
  // ========================================
  // SEÇÃO PASTE
  // ========================================
  
  renderPasteSection(event) {
    if (event.guests.length > 0) return '';
    
    return `
      <section class="import-section active">
        <div class="section-header">
          <h2 class="heading-2">COLAR DADOS</h2>
        </div>
        <div class="form-group">
          <label class="label">COLE OS DADOS DA PLANILHA</label>
          <textarea 
            id="paste-data" 
            class="input" 
            style="min-height: 200px; font-family: monospace; font-size: 13px;" 
            placeholder="Ctrl+A na planilha → Ctrl+C → Ctrl+V aqui"
          ></textarea>
          <div class="help-note">
            <p class="body-text-small"><strong>PASSO A PASSO:</strong></p>
            <ol style="margin-left: 20px; margin-top: 8px;">
              <li>Abra sua planilha no Google Sheets ou Excel</li>
              <li>Selecione TUDO (Ctrl+A)</li>
              <li>Copie (Ctrl+C)</li>
              <li>Cole acima (Ctrl+V)</li>
              <li>Clique em IMPORTAR</li>
            </ol>
            <p class="body-text-small"><strong>⚠️ IMPORTANTE:</strong> Primeira linha = nomes das colunas</p>
          </div>
        </div>
        <div class="action-bar">
          <button class="btn btn-success" data-action="import-paste">IMPORTAR</button>
          <button class="btn" data-action="reset-method">← VOLTAR</button>
        </div>
      </section>
    `;
  },
  
  // ========================================
  // SEÇÃO MANUAL - VERSÃO CONSOLIDADA
  // ========================================
  
  renderManualSection(event) {
    // Se não tem colunas definidas
    if (!event.columns || event.columns.length === 0) {
      return `
        <section class="manual-section active">
          <div class="section-header">
            <h2 class="heading-2">CONFIGURAR COLUNAS</h2>
          </div>
          <div class="form-group">
            <label class="label">DEFINA AS COLUNAS</label>
            <input 
              type="text" 
              class="input" 
              id="column-names" 
              placeholder="Ex: Nome, Telefone, Email, Cidade (separado por vírgula)"
            >
            
            <div style="margin-top: var(--space-2);">
              <button class="btn btn-small" data-action="load-template">
                📋 CARREGAR TEMPLATE
              </button>
              <button class="btn btn-small" data-action="show-presets">
                ⭐ TEMPLATES PRONTOS
              </button>
            </div>
            
            <div class="help-note">
              <p class="body-text-small">
                Digite os nomes das colunas que você quer, separados por vírgula.
              </p>
              <p class="body-text-small">
                Ou use um template pronto para festas, casamentos, eventos corporativos, etc.
              </p>
            </div>
          </div>
          <div class="action-bar">
            <button class="btn btn-success" data-action="setup-columns">DEFINIR COLUNAS</button>
            <button class="btn" data-action="reset-method">← VOLTAR</button>
          </div>
        </section>
      `;
    }
    
    // Se tem colunas, mostra formulário
    if (event.guests.length === 0) {
      return `
        <section class="manual-section active">
          <div class="section-header">
            <h2 class="heading-2">ADICIONAR CONVIDADO</h2>
          </div>
          
          <div id="manual-entries">
            ${this.renderManualEntry(event, 0)}
          </div>
          
          <div class="action-bar" style="margin-top: var(--space-3);">
            <button class="btn btn-success" data-action="save-manual">
              ✓ ADICIONAR
            </button>
            <button class="btn" data-action="add-manual-row">
              + ADICIONAR MAIS LINHAS
            </button>
            <button class="btn" data-action="reset-method">
              ← REDEFINIR COLUNAS
            </button>
          </div>
          
          <div class="help-note" style="margin-top: var(--space-3);">
            <p class="body-text-small">
              💡 <strong>Dica:</strong> Preencha os campos e clique em "Adicionar". 
              Use "Adicionar Mais Linhas" para criar várias entradas de uma vez.
            </p>
          </div>
        </section>
      `;
    }
    
    return '';
  },
  
  /**
   * Renderiza linha de entrada manual
   */
  renderManualEntry(event, index) {
    const fields = event.columns.map(col => `
      <div class="form-group">
        <label class="label">${col.toUpperCase()}</label>
        <input 
          type="text" 
          class="input manual-input" 
          data-column="${col}"
          data-index="${index}"
          placeholder="${col}"
          ${col.toLowerCase().includes('nome') ? 'required' : ''}
        >
      </div>
    `).join('');
    
    return `
      <div class="manual-entry-row" data-index="${index}">
        ${fields}
      </div>
    `;
  },
  
  // ========================================
  // TABELA DE CONVIDADOS
  // ========================================
  
  renderGuestsTable(event) {
    return `
      <section class="table-card">
        <div class="table-header">
          <h3 class="table-title">👥 CONVIDADOS (${event.guests.length})</h3>
          <input 
            type="text" 
            class="search-input" 
            id="search-guests"
            placeholder="🔍 BUSCAR..."
          >
        </div>
        
        <div style="padding: var(--space-3); border-bottom: 2px solid var(--gray-200); display: flex; gap: var(--space-2); flex-wrap: wrap;">
          <button class="btn btn-success" data-action="quick-add">
            + ADICIONAR MAIS
          </button>
          ${event.method === 'paste' ? `
            <button class="btn" data-action="import-more">
              📋 IMPORTAR MAIS
            </button>
          ` : ''}
          <button class="btn" data-action="save-template">
            💾 SALVAR TEMPLATE
          </button>
        </div>
        
        <div class="table-wrapper">
          ${this.renderGuestsList(event)}
        </div>
        
        <div class="table-footer">
          <div class="footer-info">TOTAL: ${event.guests.length}</div>
          <div class="footer-actions">
            <button class="btn btn-small" data-action="export-pdf">📄 PDF</button>
            <button class="btn btn-small" data-action="export-txt">📝 TXT</button>
            <button class="btn btn-small" data-action="export-csv">📊 CSV</button>
          </div>
        </div>
      </section>
    `;
  },
  
  renderGuestsList(event) {
    // Cards mobile
    const cardsHTML = event.guests.map((guest, index) => 
      this.renderGuestCard(guest, event, index)
    ).join('');
    
    // Tabela desktop
    const rowsHTML = event.guests.map((guest, index) => 
      this.renderGuestRow(guest, event, index)
    ).join('');
    
    return `
      <div id="guests-cards">${cardsHTML}</div>
      <table class="desktop-table">
        <thead>
          <tr>
            ${event.columns.map(col => `<th><span class="label">${col.toUpperCase()}</span></th>`).join('')}
            <th style="text-align: center;"><span class="label">STATUS</span></th>
            <th><span class="label">AÇÕES</span></th>
          </tr>
        </thead>
        <tbody id="guests-tbody">
          ${rowsHTML}
        </tbody>
      </table>
    `;
  },
  
  renderGuestCard(guest, event, index) {
    const statusBadge = {
      'yes': '<span class="status-badge yes">✓ CONFIRMADO</span>',
      'no': '<span class="status-badge no">✗ NÃO VEM</span>',
      'pending': '<span class="status-badge pending">⏳ PENDENTE</span>'
    }[guest.status] || '<span class="status-badge pending">⏳ PENDENTE</span>';
    
    const firstCol = event.columns[0];
    const otherCols = event.columns.slice(1).map(col => {
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
    
    return `
      <div class="guest-card" data-status="${guest.status || 'pending'}" data-guest-index="${index}">
        <div class="guest-name">
          ${guest[firstCol] || '-'}
          ${statusBadge}
        </div>
        <div class="guest-fields">${otherCols}</div>
        <div class="presence-control">
          <label class="radio-group success">
            <input type="radio" name="status-m-${index}" ${guest.status === 'yes' ? 'checked' : ''} data-action="update-status" data-index="${index}" data-status="yes">
            <span class="radio-label">SIM</span>
          </label>
          <label class="radio-group danger">
            <input type="radio" name="status-m-${index}" ${guest.status === 'no' ? 'checked' : ''} data-action="update-status" data-index="${index}" data-status="no">
            <span class="radio-label">NÃO</span>
          </label>
        </div>
        <div class="guest-actions">
          <button class="btn btn-small" data-action="edit-guest" data-index="${index}">✏ EDITAR</button>
          <button class="btn btn-small btn-danger" data-action="delete-guest" data-index="${index}">🗑 EXCLUIR</button>
        </div>
      </div>
    `;
  },
  
  renderGuestRow(guest, event, index) {
    const cells = event.columns.map((col, colIdx) => {
      const value = guest[col] || '-';
      if (colIdx === 0) {
        const badge = guest.status === 'yes' ? '<span class="status-badge yes">✓</span>' :
                     guest.status === 'no' ? '<span class="status-badge no">✗</span>' :
                     '<span class="status-badge pending">⏳</span>';
        return `<td><div style="display: flex; align-items: center; gap: 8px; font-weight: var(--font-weight-bold);">${value} ${badge}</div></td>`;
      }
      return `<td>${value}</td>`;
    }).join('');
    
    return `
      <tr data-status="${guest.status || 'pending'}" data-guest-index="${index}">
        ${cells}
        <td>
          <div class="presence-control">
            <label class="radio-group success">
              <input type="radio" name="status-d-${index}" ${guest.status === 'yes' ? 'checked' : ''} data-action="update-status" data-index="${index}" data-status="yes">
              <span class="radio-label">SIM</span>
            </label>
            <label class="radio-group danger">
              <input type="radio" name="status-d-${index}" ${guest.status === 'no' ? 'checked' : ''} data-action="update-status" data-index="${index}" data-status="no">
              <span class="radio-label">NÃO</span>
            </label>
          </div>
        </td>
        <td>
          <div style="display: flex; gap: 4px;">
            <button class="btn btn-small" data-action="edit-guest" data-index="${index}">✏</button>
            <button class="btn btn-small btn-danger" data-action="delete-guest" data-index="${index}">×</button>
          </div>
        </td>
      </tr>
    `;
  },
  
  // ========================================
  // EVENT LISTENERS
  // ========================================
  
  attachGlobalListeners() {
    // ESC fecha modais
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        this.closeAllModals();
      }
    });
  },
  
  attachEventListeners() {
    // Choice cards
    document.querySelectorAll('[data-choice]').forEach(card => {
      card.addEventListener('click', () => {
        const choice = card.dataset.choice;
        this.handleMethodChoice(choice);
      });
    });
    
    // Botões com data-action
    document.querySelectorAll('[data-action]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const action = btn.dataset.action;
        const index = btn.dataset.index;
        const status = btn.dataset.status;
        
        this.handleAction(action, { index, status, button: btn });
      });
    });
    
    // Busca
    const searchInput = document.getElementById('search-guests');
    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        this.filterGuests(e.target.value);
      });
    }
  },
  
  // ========================================
  // HANDLERS
  // ========================================
  
  async handleMethodChoice(method) {
    const event = State.getCurrentEvent();
    if (!event) return;
    
    event.method = method;
    Storage.save();
    this.render();
  },
  
  async handleAction(action, data = {}) {
    const handlers = {
      'new-event': () => this.showNewEventModal(),
      'reset-method': () => this.resetMethod(),
      'import-paste': () => this.importPastedData(),
      'setup-columns': () => this.setupManualColumns(),
      'save-manual': () => this.saveManualGuests(),
      'add-manual-row': () => this.addManualRow(),
      'load-template': () => ColumnTemplates.showTemplateSelector(),
      'show-presets': () => ColumnTemplates.showPresetSelector(),
      'save-template': () => this.saveCurrentTemplate(),
      'import-more': () => this.showImportMoreModal(),
      'quick-add': () => this.showQuickAddModal(),
      'update-status': () => this.updateGuestStatus(data.index, data.status),
      'edit-guest': () => this.editGuest(data.index),
      'delete-guest': () => this.deleteGuest(data.index),
      'export-pdf': () => this.exportPDF(),
      'export-txt': () => this.exportTXT(),
      'export-csv': () => this.exportCSV()
    };
    
    const handler = handlers[action];
    if (handler) {
      try {
        await handler();
      } catch (error) {
        console.error(`Erro ao executar ação ${action}:`, error);
        this.showError(`Erro ao executar ${action}`);
      }
    } else {
      console.warn(`Ação não implementada: ${action}`);
    }
  },
  
  // ========================================
  // AÇÕES ESPECÍFICAS
  // ========================================
  
  resetMethod() {
    const event = State.getCurrentEvent();
    if (!event) return;
    
    event.method = null;
    event.columns = [];
    event.guests = [];
    Storage.save();
    this.render();
  },
  
  async importPastedData() {
    const textarea = document.getElementById('paste-data');
    if (!textarea) return;
    
    const data = textarea.value.trim();
    if (!data) {
      this.showError('Cole os dados primeiro!');
      return;
    }
    
    try {
      const lines = data.split('\n').filter(l => l.trim());
      if (lines.length < 2) {
        throw new Error('Precisa ter ao menos cabeçalho e uma linha de dados');
      }
      
      const separator = Utils.detectSeparator(lines[0]);
      const headers = lines[0].split(separator).map(h => h.trim());
      
      const event = State.getCurrentEvent();
      event.columns = headers;
      event.guests = [];
      
      for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(separator);
        const guest = { 
          id: Utils.generateId(),
          status: 'pending'
        };
        
        headers.forEach((col, idx) => {
          guest[col] = (values[idx] || '').trim();
        });
        
        event.guests.push(guest);
      }
      
      Storage.save();
      this.render();
      this.showNotification(`${event.guests.length} convidados importados!`, 'success');
      
    } catch (error) {
      console.error('Erro ao importar:', error);
      this.showError('Erro ao processar dados: ' + error.message);
    }
  },
  
  setupManualColumns() {
    const input = document.getElementById('column-names');
    if (!input) return;
    
    const columnsText = input.value.trim();
    if (!columnsText) {
      this.showError('Digite os nomes das colunas!');
      return;
    }
    
    const event = State.getCurrentEvent();
    event.columns = columnsText.split(',').map(c => c.trim()).filter(c => c);
    
    if (event.columns.length === 0) {
      this.showError('Digite ao menos uma coluna!');
      return;
    }
    
    Storage.save();
    this.render();
  },
  
  async saveManualGuests() {
    const event = State.getCurrentEvent();
    if (!event) return;
    
    const rows = document.querySelectorAll('.manual-entry-row');
    let added = 0;
    
    for (const row of rows) {
      const guest = { 
        id: Utils.generateId(),
        status: 'pending'
      };
      
      let hasData = false;
      
      event.columns.forEach(col => {
        const input = row.querySelector(`[data-column="${col}"]`);
        if (input) {
          const value = input.value.trim();
          guest[col] = value;
          if (value) hasData = true;
        }
      });
      
      if (hasData) {
        await State.addGuest(State.currentEventId, guest);
        added++;
      }
    }
    
    if (added > 0) {
      Storage.save();
      this.render();
      this.showNotification(`${added} convidado(s) adicionado(s)!`, 'success');
    } else {
      this.showError('Preencha ao menos um convidado!');
    }
  },
  
  addManualRow() {
    const container = document.getElementById('manual-entries');
    if (!container) return;
    
    const event = State.getCurrentEvent();
    const currentCount = container.querySelectorAll('.manual-entry-row').length;
    
    container.insertAdjacentHTML('beforeend', this.renderManualEntry(event, currentCount));
  },
  
  async updateGuestStatus(index, status) {
    await State.updateGuestStatus(State.currentEventId, index, status);
    Storage.save();
    this.render();
  },
  
  editGuest(index) {
    const event = State.getCurrentEvent();
    if (!event) return;
    
    const guest = event.guests[index];
    if (!guest) return;
    
    State.editingGuestIndex = index;
    
    const fieldsHTML = event.columns.map(col => `
      <div class="form-group">
        <label class="label">${col.toUpperCase()}</label>
        <input type="text" class="input" id="edit-${col}" value="${guest[col] || ''}">
      </div>
    `).join('');
    
    const editFields = document.getElementById('edit-fields');
    if (editFields) {
      editFields.innerHTML = fieldsHTML;
    }
    
    this.showModal('edit-modal');
  },
  
  async deleteGuest(index) {
    const confirmed = await this.showConfirm(
      'EXCLUIR CONVIDADO',
      'Tem certeza que deseja excluir este convidado?'
    );
    
    if (!confirmed) return;
    
    await State.removeGuest(State.currentEventId, index);
    Storage.save();
    this.render();
    this.showNotification('Convidado excluído', 'success');
  },
  
  filterGuests(term) {
    const lowerTerm = term.toLowerCase();
    const cards = document.querySelectorAll('.guest-card');
    const rows = document.querySelectorAll('#guests-tbody tr');
    
    [...cards, ...rows].forEach(el => {
      const text = el.textContent.toLowerCase();
      el.style.display = text.includes(lowerTerm) ? '' : 'none';
    });
  },
  
  saveCurrentTemplate() {
    const event = State.getCurrentEvent();
    if (!event || !event.columns || event.columns.length === 0) {
      this.showError('Sem colunas para salvar!');
      return;
    }
    
    if (typeof ColumnTemplates !== 'undefined') {
      ColumnTemplates.saveTemplate(event.columns);
    }
  },
  
  showImportMoreModal() {
    // TODO: Implementar
    this.showNotification('Em desenvolvimento', 'info');
  },
  
  showQuickAddModal() {
    // TODO: Implementar
    this.showNotification('Em desenvolvimento', 'info');
  },
  
  exportPDF() {
    const event = State.getCurrentEvent();
    if (!event) return;
    
    if (typeof Exports !== 'undefined' && Exports.exportPDF) {
      Exports.exportPDF(event.id);
    }
  },
  
  exportTXT() {
    const event = State.getCurrentEvent();
    if (!event) return;
    
    if (typeof Exports !== 'undefined' && Exports.exportTXT) {
      Exports.exportTXT(event.id);
    }
  },
  
  exportCSV() {
    const event = State.getCurrentEvent();
    if (!event) return;
    
    if (typeof Exports !== 'undefined' && Exports.exportCSV) {
      Exports.exportCSV(event.id);
    }
  },
  
  // ========================================
  // MODAIS
  // ========================================
  
  showModal(modalId) {
    const modal = document.getElementById(modalId);
    if (!modal) {
      console.warn(`Modal ${modalId} não encontrado`);
      return;
    }
    
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
  },
  
  closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (!modal) return;
    
    modal.classList.remove('active');
    document.body.style.overflow = '';
  },
  
  closeAllModals() {
    document.querySelectorAll('.modal.active').forEach(modal => {
      modal.classList.remove('active');
    });
    document.body.style.overflow = '';
  },
  
  showNewEventModal() {
    this.showModal('new-event-modal');
    setTimeout(() => {
      const nameInput = document.getElementById('new-event-name');
      if (nameInput) nameInput.focus();
    }, 100);
  },
  
  /**
   * Mostra diálogo de confirmação
   * @returns {Promise<boolean>} Retorna true se confirmado
   */
  showConfirm(title, message) {
    return new Promise((resolve) => {
      const modal = document.getElementById('confirm-modal');
      if (!modal) {
        resolve(confirm(message));
        return;
      }
      
      const titleEl = modal.querySelector('#confirm-title');
      const messageEl = modal.querySelector('#confirm-message');
      const confirmBtn = modal.querySelector('#confirm-action');
      
      if (titleEl) titleEl.textContent = title;
      if (messageEl) messageEl.textContent = message;
      
      // Remove listeners antigos
      const newConfirmBtn = confirmBtn.cloneNode(true);
      confirmBtn.replaceWith(newConfirmBtn);
      
      // Adiciona novo listener
      newConfirmBtn.addEventListener('click', () => {
        this.closeModal('confirm-modal');
        resolve(true);
      });
      
      // Cancelar
      const cancelBtns = modal.querySelectorAll('[data-modal-action="cancel"]');
      cancelBtns.forEach(btn => {
        btn.addEventListener('click', () => {
          this.closeModal('confirm-modal');
          resolve(false);
        });
      });
      
      this.showModal('confirm-modal');
    });
  },
  
  // ========================================
  // NOTIFICAÇÕES E LOADING
  // ========================================
  
  showNotification(message, type = 'info') {
    const colors = {
      'success': 'var(--accent-success)',
      'error': 'var(--accent-danger)',
      'info': 'var(--black)',
      'warning': '#ffb700'
    };
    
    const notification = document.createElement('div');
    notification.style.cssText = `
      position: fixed;
      top: 80px;
      right: 20px;
      padding: 16px 24px;
      background: ${colors[type] || colors.info};
      color: white;
      border-radius: 8px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.3);
      z-index: 99999;
      animation: slideIn 0.3s ease-out;
      font-weight: bold;
      font-size: 14px;
      max-width: 400px;
    `;
    
    notification.textContent = message;
    document.body.appendChild(notification);
    
    setTimeout(() => {
      notification.style.animation = 'slideIn 0.3s ease-out reverse';
      setTimeout(() => notification.remove(), 300);
    }, 3000);
  },
  
  showError(message) {
    this.showNotification(message, 'error');
  },
  
  /**
   * ✅ NOVO: Mostra overlay de loading
   */
  showLoadingOverlay(message = 'Carregando...') {
    // Remove overlay anterior se existir
    this.hideLoadingOverlay();
    
    const overlay = document.createElement('div');
    overlay.id = 'loading-overlay';
    overlay.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.7);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 999999;
    `;
    
    overlay.innerHTML = `
      <div style="
        background: white;
        padding: 32px 48px;
        border-radius: 12px;
        text-align: center;
        box-shadow: 0 8px 32px rgba(0,0,0,0.3);
      ">
        <div class="spinner" style="
          width: 48px;
          height: 48px;
          border: 4px solid #f3f3f3;
          border-top: 4px solid #000;
          border-radius: 50%;
          animation: spin 1s linear infinite;
          margin: 0 auto 16px;
        "></div>
        <div style="
          font-size: 16px;
          font-weight: bold;
          color: #000;
        ">${message}</div>
      </div>
    `;
    
    // Adiciona CSS da animação se não existir
    if (!document.getElementById('spinner-animation')) {
      const style = document.createElement('style');
      style.id = 'spinner-animation';
      style.textContent = `
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `;
      document.head.appendChild(style);
    }
    
    document.body.appendChild(overlay);
  },
  
  /**
   * ✅ NOVO: Esconde overlay de loading
   */
  hideLoadingOverlay() {
    const overlay = document.getElementById('loading-overlay');
    if (overlay) {
      overlay.remove();
    }
  }
};

// Compatibilidade com código antigo
const UI = UICore;

// Exporta globalmente
window.UICore = UICore;
window.UI = UI;

console.log('✅ UICore v3.1.1 carregado (com loading overlays)');
