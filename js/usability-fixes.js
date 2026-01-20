/**
 * USABILITY FIXES v3.1.0
 * Correções de usabilidade e features extras
 * ✅ LIMPO: removidas duplicações de renderManualSection e renderPasteSection
 */

// ========================================
// SCROLL DETECTOR
// ========================================

const ScrollDetector = {
  init() {
    this.attachScrollListeners();
  },
  
  attachScrollListeners() {
    const tableWrapper = document.querySelector('.table-wrapper');
    if (!tableWrapper) return;
    
    tableWrapper.addEventListener('scroll', () => {
      const scrollLeft = tableWrapper.scrollLeft;
      const scrollWidth = tableWrapper.scrollWidth;
      const clientWidth = tableWrapper.clientWidth;
      
      if (scrollLeft > 0) {
        tableWrapper.classList.add('is-scrolled');
      } else {
        tableWrapper.classList.remove('is-scrolled');
      }
      
      if (scrollLeft + clientWidth >= scrollWidth - 10) {
        tableWrapper.classList.add('is-scrolled-end');
      } else {
        tableWrapper.classList.remove('is-scrolled-end');
      }
    });
  }
};

// ========================================
// COLUMN TEMPLATES
// ========================================

const ColumnTemplates = {
  /**
   * Templates pré-definidos
   */
  presets: {
    'festa-aniversario': ['Nome', 'Telefone', 'Idade', 'Acompanhantes'],
    'casamento': ['Nome', 'Telefone', 'Email', 'Mesa', 'Acompanhante', 'Restrição Alimentar'],
    'corporativo': ['Nome', 'Empresa', 'Cargo', 'Email', 'Telefone'],
    'workshop': ['Nome', 'Email', 'Telefone', 'Área de Interesse', 'Experiência'],
    'evento-esportivo': ['Nome', 'Telefone', 'Equipe', 'Número da Camisa', 'Categoria'],
    'conferencia': ['Nome', 'Email', 'Empresa', 'Cargo', 'Cidade', 'Networking'],
    'formatura': ['Nome', 'Telefone', 'Curso', 'Acompanhantes', 'Mesa'],
    'basico': ['Nome', 'Telefone', 'Email']
  },
  
  /**
   * Mostra seletor de presets
   */
  showPresetSelector() {
    const modal = document.getElementById('template-preset-modal');
    if (!modal) {
      this.createPresetModal();
      return;
    }
    
    this.renderPresetList();
    modal.classList.add('active');
  },
  
  /**
   * Cria modal de presets (se não existir)
   */
  createPresetModal() {
    const modal = document.createElement('div');
    modal.id = 'template-preset-modal';
    modal.className = 'modal';
    modal.innerHTML = `
      <div class="modal-content">
        <div class="modal-header">
          <h2 class="heading-2">TEMPLATES PRONTOS</h2>
          <button class="modal-close" onclick="this.closest('.modal').classList.remove('active')">×</button>
        </div>
        <div class="modal-body" id="preset-list"></div>
      </div>
    `;
    document.body.appendChild(modal);
    
    this.showPresetSelector();
  },
  
  /**
   * Renderiza lista de presets
   */
  renderPresetList() {
    const container = document.getElementById('preset-list');
    if (!container) return;
    
    const html = Object.entries(this.presets).map(([key, columns]) => `
      <div class="preset-card" data-preset="${key}">
        <div class="preset-name">${this.formatPresetName(key)}</div>
        <div class="preset-columns">${columns.join(', ')}</div>
      </div>
    `).join('');
    
    container.innerHTML = html;
    
    // Adiciona listeners
    container.querySelectorAll('.preset-card').forEach(card => {
      card.addEventListener('click', () => {
        const presetKey = card.dataset.preset;
        this.applyPreset(presetKey);
      });
    });
  },
  
  /**
   * Formata nome do preset
   */
  formatPresetName(key) {
    return key
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  },
  
  /**
   * Aplica preset
   */
  applyPreset(presetKey) {
    const columns = this.presets[presetKey];
    if (!columns) return;
    
    const input = document.getElementById('column-names');
    if (input) {
      input.value = columns.join(', ');
    }
    
    // Fecha modal
    const modal = document.getElementById('template-preset-modal');
    if (modal) {
      modal.classList.remove('active');
    }
    
    if (typeof UICore !== 'undefined') {
      UICore.showNotification('Template carregado!', 'success');
    }
  },
  
  /**
   * Salva template personalizado
   */
  saveTemplate(columns) {
    if (!columns || columns.length === 0) {
      if (typeof UICore !== 'undefined') {
        UICore.showError('Nenhuma coluna para salvar!');
      }
      return;
    }
    
    const name = prompt('Nome do template:');
    if (!name) return;
    
    try {
      // Carrega templates salvos
      const saved = this.loadSavedTemplates();
      
      // Adiciona novo
      saved[name] = columns;
      
      // Salva
      localStorage.setItem('column_templates', JSON.stringify(saved));
      
      if (typeof UICore !== 'undefined') {
        UICore.showNotification('Template salvo!', 'success');
      } else {
        alert('Template salvo!');
      }
      
    } catch (error) {
      console.error('Erro ao salvar template:', error);
      if (typeof UICore !== 'undefined') {
        UICore.showError('Erro ao salvar template');
      }
    }
  },
  
  /**
   * Carrega templates salvos
   */
  loadSavedTemplates() {
    try {
      const saved = localStorage.getItem('column_templates');
      return saved ? JSON.parse(saved) : {};
    } catch (error) {
      console.error('Erro ao carregar templates:', error);
      return {};
    }
  },
  
  /**
   * Mostra seletor de templates salvos
   */
  showTemplateSelector() {
    const saved = this.loadSavedTemplates();
    
    if (Object.keys(saved).length === 0) {
      if (typeof UICore !== 'undefined') {
        UICore.showNotification('Nenhum template salvo ainda', 'info');
      } else {
        alert('Nenhum template salvo ainda');
      }
      return;
    }
    
    // Cria lista de opções
    const options = Object.keys(saved)
      .map((name, idx) => `${idx + 1}. ${name}`)
      .join('\n');
    
    const choice = prompt(`TEMPLATES SALVOS:\n\n${options}\n\nDigite o número do template:`);
    
    if (!choice) return;
    
    const index = parseInt(choice) - 1;
    const templateName = Object.keys(saved)[index];
    
    if (!templateName) {
      alert('Opção inválida!');
      return;
    }
    
    // Aplica template
    const columns = saved[templateName];
    const input = document.getElementById('column-names');
    if (input) {
      input.value = columns.join(', ');
      
      if (typeof UICore !== 'undefined') {
        UICore.showNotification(`Template "${templateName}" carregado!`, 'success');
      }
    }
  },
  
  /**
   * Deleta template
   */
  deleteTemplate(name) {
    const saved = this.loadSavedTemplates();
    
    if (!saved[name]) return;
    
    const confirmed = confirm(`Deletar template "${name}"?`);
    if (!confirmed) return;
    
    delete saved[name];
    
    localStorage.setItem('column_templates', JSON.stringify(saved));
    
    if (typeof UICore !== 'undefined') {
      UICore.showNotification('Template deletado', 'success');
    }
  }
};

// ========================================
// KEYBOARD SHORTCUTS
// ========================================

const KeyboardShortcuts = {
  init() {
    document.addEventListener('keydown', (e) => {
      // Ctrl+S - Salvar
      if (e.ctrlKey && e.key === 's') {
        e.preventDefault();
        this.handleSave();
      }
      
      // Ctrl+N - Novo evento
      if (e.ctrlKey && e.key === 'n') {
        e.preventDefault();
        this.handleNewEvent();
      }
      
      // Ctrl+P - Imprimir
      if (e.ctrlKey && e.key === 'p') {
        e.preventDefault();
        window.print();
      }
      
      // Ctrl+F - Buscar
      if (e.ctrlKey && e.key === 'f') {
        e.preventDefault();
        this.focusSearch();
      }
      
      // ESC - Fechar modais
      if (e.key === 'Escape') {
        this.closeModals();
      }
    });
  },
  
  handleSave() {
    if (typeof Storage !== 'undefined') {
      Storage.save();
      if (typeof UICore !== 'undefined') {
        UICore.showNotification('Salvo!', 'success');
      }
    }
  },
  
  handleNewEvent() {
    if (typeof UICore !== 'undefined') {
      UICore.showNewEventModal();
    }
  },
  
  focusSearch() {
    const searchInput = document.getElementById('search-guests');
    if (searchInput) {
      searchInput.focus();
      searchInput.select();
    }
  },
  
  closeModals() {
    if (typeof UICore !== 'undefined') {
      UICore.closeAllModals();
    }
  }
};

// ========================================
// EXPORTAÇÃO GLOBAL
// ========================================

window.ScrollDetector = ScrollDetector;
window.ColumnTemplates = ColumnTemplates;
window.KeyboardShortcuts = KeyboardShortcuts;

console.log('✅ Usability Fixes v3.1.0 carregado (sem duplicações)');
