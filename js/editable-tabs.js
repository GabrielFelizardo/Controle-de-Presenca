/**
 * EDITABLE TABS - v2.3 (COM ÍCONE)
 * Sistema para editar nome das abas usando ícone ✏️
 */

const EditableTabs = {
    currentlyEditing: null,
    originalName: null,
    
    /**
     * Inicializa o sistema
     */
    init() {
        console.log('EditableTabs iniciado (versão com ícone)');
    },
    
    /**
     * Torna uma aba editável
     */
    makeTabEditable(tab, eventId) {
        // Ignora se for o botão de fechar ou nova aba
        if (tab.classList.contains('new-tab')) return;
        
        // Adiciona classe editável
        tab.classList.add('tab-editable');
        
        // Reorganiza conteúdo da aba se ainda não foi feito
        if (!tab.querySelector('.tab-content-wrapper')) {
            const currentContent = tab.innerHTML;
            const closeBtn = tab.querySelector('.tab-close');
            
            // Pega o texto (sem o botão X)
            let textContent = currentContent;
            if (closeBtn) {
                const tempDiv = document.createElement('div');
                tempDiv.innerHTML = currentContent;
                tempDiv.querySelector('.tab-close')?.remove();
                textContent = tempDiv.textContent.trim();
            }
            
            // Reconstrói com wrapper
            tab.innerHTML = `
                <span class="tab-content-wrapper">
                    <span class="tab-name-text">${textContent}</span>
                    <span class="tab-edit-icon" title="Editar nome">✏️</span>
                </span>
            `;
            
            // Adiciona botão X de volta se tinha
            if (closeBtn) {
                tab.appendChild(closeBtn);
            }
        }
        
        // Event listener no ícone de editar
        const editIcon = tab.querySelector('.tab-edit-icon');
        if (editIcon) {
            editIcon.addEventListener('click', (e) => {
                e.stopPropagation();
                this.startEditing(tab, eventId);
            });
        }
    },
    
    /**
     * Inicia edição
     */
    startEditing(tab, eventId) {
        // Se já está editando outra aba, salva primeiro
        if (this.currentlyEditing && this.currentlyEditing !== tab) {
            this.saveEdit();
        }
        
        this.currentlyEditing = tab;
        
        // Pega nome atual
        const nameText = tab.querySelector('.tab-name-text');
        const currentName = nameText ? nameText.textContent.trim() : tab.textContent.trim();
        
        this.originalName = currentName;
        
        // Adiciona helper text
        this.showHelper('Digite o novo nome e pressione Enter');
        
        // Limpa conteúdo
        tab.innerHTML = '';
        
        // Adiciona classe editing
        tab.classList.add('editing');
        
        // Cria input
        const input = document.createElement('input');
        input.type = 'text';
        input.className = 'tab-edit-input';
        input.value = currentName;
        input.dataset.eventId = eventId;
        
        // Event listeners
        input.addEventListener('blur', () => {
            setTimeout(() => this.saveEdit(), 100);
        });
        
        input.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                this.saveEdit();
            } else if (e.key === 'Escape') {
                e.preventDefault();
                this.cancelEdit();
            }
        });
        
        // Adiciona ao tab
        tab.appendChild(input);
        
        // Foca e seleciona
        input.focus();
        input.select();
    },
    
    /**
     * Salva edição
     */
    saveEdit() {
        if (!this.currentlyEditing) return;
        
        const tab = this.currentlyEditing;
        const input = tab.querySelector('.tab-edit-input');
        
        if (!input) return;
        
        const newName = input.value.trim();
        const eventId = parseFloat(input.dataset.eventId);
        
        // Esconde helper
        this.hideHelper();
        
        // Valida nome
        if (!newName) {
            alert('Nome não pode ser vazio!');
            input.focus();
            return;
        }
        
        // Se mudou, atualiza
        if (newName !== this.originalName) {
            // Atualiza no State
            const event = State.events.find(e => e.id === eventId);
            if (event) {
                event.name = newName;
                Storage.save();
                
                // Animação de sucesso
                tab.classList.add('tab-save-animation');
                setTimeout(() => {
                    tab.classList.remove('tab-save-animation');
                }, 400);
            }
        }
        
        // Restaura aba
        this.restoreTab(tab, newName, eventId);
    },
    
    /**
     * Cancela edição
     */
    cancelEdit() {
        if (!this.currentlyEditing) return;
        
        const tab = this.currentlyEditing;
        const input = tab.querySelector('.tab-edit-input');
        const eventId = input ? parseFloat(input.dataset.eventId) : null;
        
        // Esconde helper
        this.hideHelper();
        
        // Restaura com nome original
        this.restoreTab(tab, this.originalName, eventId);
    },
    
    /**
     * Restaura aba ao estado normal
     */
    restoreTab(tab, name, eventId) {
        // Remove classe editing
        tab.classList.remove('editing');
        
        // Limpa conteúdo
        tab.innerHTML = '';
        
        // Reconstrói conteúdo
        const wrapper = document.createElement('span');
        wrapper.className = 'tab-content-wrapper';
        
        const nameSpan = document.createElement('span');
        nameSpan.className = 'tab-name-text';
        nameSpan.textContent = name;
        
        const editIcon = document.createElement('span');
        editIcon.className = 'tab-edit-icon';
        editIcon.title = 'Editar nome';
        editIcon.textContent = '✏️';
        editIcon.addEventListener('click', (e) => {
            e.stopPropagation();
            this.startEditing(tab, eventId);
        });
        
        wrapper.appendChild(nameSpan);
        wrapper.appendChild(editIcon);
        tab.appendChild(wrapper);
        
        // Adiciona botão fechar se tiver múltiplos eventos
        if (State.events.length > 1) {
            const closeBtn = document.createElement('span');
            closeBtn.className = 'tab-close';
            closeBtn.textContent = '×';
            closeBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                UI.deleteEvent(eventId);
            });
            tab.appendChild(closeBtn);
        }
        
        // Reseta variáveis
        this.currentlyEditing = null;
        this.originalName = null;
    },
    
    /**
     * Mostra helper text
     */
    showHelper(text) {
        let helper = document.getElementById('tab-edit-helper');
        if (!helper) {
            helper = document.createElement('div');
            helper.id = 'tab-edit-helper';
            helper.className = 'tab-edit-helper';
            document.body.appendChild(helper);
        }
        helper.textContent = text;
        helper.classList.add('active');
    },
    
    /**
     * Esconde helper text
     */
    hideHelper() {
        const helper = document.getElementById('tab-edit-helper');
        if (helper) {
            helper.classList.remove('active');
        }
    },
    
    /**
     * Atualiza todas as abas (chamar após renderizar)
     */
    updateAllTabs() {
        document.querySelectorAll('.tab:not(.new-tab)').forEach(tab => {
            // Pega eventId do dataset ou procura pelo nome
            let eventId = tab.dataset.eventId;
            
            if (!eventId) {
                // Tenta encontrar pelo texto
                const tabText = tab.textContent.replace('×', '').replace('✏️', '').trim();
                const event = State.events.find(e => e.name === tabText);
                if (event) {
                    eventId = event.id;
                    tab.dataset.eventId = eventId;
                }
            }
            
            if (eventId) {
                this.makeTabEditable(tab, parseFloat(eventId));
            }
        });
    }
};

// Exporta globalmente
window.EditableTabs = EditableTabs;

// Auto-inicializa
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => EditableTabs.init());
} else {
    EditableTabs.init();
}
