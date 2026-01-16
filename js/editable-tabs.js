/**
 * EDITABLE TABS - v2.3
 * Sistema para editar nome das abas inline
 */

const EditableTabs = {
    currentlyEditing: null,
    originalName: null,
    
    /**
     * Inicializa o sistema
     */
    init() {
        console.log('EditableTabs iniciado');
    },
    
    /**
     * Torna uma aba editável
     */
    makeTabEditable(tab, eventId) {
        // Ignora se for o botão de fechar ou nova aba
        if (tab.classList.contains('new-tab')) return;
        
        // Adiciona classe editável
        tab.classList.add('tab-editable');
        
        // Cria hint
        if (!tab.querySelector('.tab-edit-hint')) {
            const hint = document.createElement('div');
            hint.className = 'tab-edit-hint';
            hint.textContent = 'Duplo clique para editar';
            tab.appendChild(hint);
        }
        
        // Event listener para duplo clique
        tab.addEventListener('dblclick', (e) => {
            // Ignora se clicar no botão fechar
            if (e.target.classList.contains('tab-close')) return;
            
            e.stopPropagation();
            this.startEditing(tab, eventId);
        });
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
        
        // Pega nome atual (sem o botão X)
        const closeBtn = tab.querySelector('.tab-close');
        const textNode = Array.from(tab.childNodes).find(
            node => node.nodeType === Node.TEXT_NODE
        );
        const currentName = textNode ? textNode.textContent.trim() : tab.textContent.trim();
        
        this.originalName = currentName;
        
        // Remove hint
        const hint = tab.querySelector('.tab-edit-hint');
        if (hint) hint.remove();
        
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
        
        // Adiciona nome
        tab.appendChild(document.createTextNode(name));
        
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
        
        // Adiciona hint novamente
        const hint = document.createElement('div');
        hint.className = 'tab-edit-hint';
        hint.textContent = 'Duplo clique para editar';
        tab.appendChild(hint);
        
        // Reseta variáveis
        this.currentlyEditing = null;
        this.originalName = null;
    },
    
    /**
     * Atualiza todas as abas (chamar após renderizar)
     */
    updateAllTabs() {
        document.querySelectorAll('.tab:not(.new-tab)').forEach(tab => {
            const eventId = State.events.find(e => 
                tab.textContent.includes(e.name)
            )?.id;
            
            if (eventId) {
                this.makeTabEditable(tab, eventId);
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
