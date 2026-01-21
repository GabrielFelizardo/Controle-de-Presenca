/**
 * EDITABLE TABS v3.2.0
 * ✅ Tabs editáveis com sincronização no Google Sheets
 */

const EditableTabs = {
  init() {
    this.attachListeners();
    console.log('✏️ EditableTabs v3.2.0 inicializado');
  },
  
  attachListeners() {
    // Event delegation para tabs
    document.addEventListener('dblclick', (e) => {
      const tab = e.target.closest('.event-tab');
      if (tab && !tab.classList.contains('new-event-btn')) {
        this.makeEditable(tab);
      }
    });
  },
  
  makeEditable(tab) {
    const eventId = tab.dataset.eventId;
    if (!eventId) return;
    
    const event = State.getEventById(eventId);
    if (!event) return;
    
    const nameSpan = tab.querySelector('.event-name') || tab;
    const currentName = event.name;
    
    // Salva conteúdo original
    const originalHTML = nameSpan.innerHTML;
    
    // Cria input
    const input = document.createElement('input');
    input.type = 'text';
    input.value = currentName;
    input.className = 'tab-name-editor';
    input.style.cssText = `
      background: transparent;
      border: none;
      border-bottom: 2px solid #00ff00;
      color: inherit;
      font: inherit;
      padding: 2px 4px;
      width: 100%;
      outline: none;
    `;
    
    // Substitui conteúdo
    nameSpan.innerHTML = '';
    nameSpan.appendChild(input);
    
    input.focus();
    input.select();
    
    const saveEdit = async () => {
      const newName = input.value.trim();
      
      if (!newName) {
        // Se vazio, cancela
        nameSpan.innerHTML = originalHTML;
        return;
      }
      
      if (newName === currentName) {
        // Se não mudou, cancela
        nameSpan.innerHTML = originalHTML;
        return;
      }
      
      // ✅ NOVO: Chama SheetSync para renomear!
      if (typeof SheetSync !== 'undefined' && SheetSync.enabled) {
        const success = await SheetSync.renameEvent(eventId, newName);
        
        if (!success) {
          // Se falhou, reverte
          nameSpan.innerHTML = originalHTML;
          return;
        }
      } else {
        // Se SheetSync não está ativo, atualiza só localmente
        event.name = newName;
        Storage.save();
      }
      
      // Atualiza UI
      nameSpan.textContent = newName;
      
      // Atualiza título da página se for evento atual
      if (State.currentEventId === eventId && typeof UICore !== 'undefined') {
        UICore.updateEventTitle();
      }
    };
    
    // Salva ao pressionar Enter
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        saveEdit();
      } else if (e.key === 'Escape') {
        nameSpan.innerHTML = originalHTML;
      }
    });
    
    // Salva ao perder foco
    input.addEventListener('blur', () => {
      saveEdit();
    });
  }
};

window.EditableTabs = EditableTabs;
console.log('✏️ EditableTabs v3.2.0 carregado');
