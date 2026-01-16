/**
 * NAME AUTOCOMPLETE - v2.3
 * Sistema de autocompletar nomes que se repetem
 */

const NameAutocomplete = {
    STORAGE_KEY: 'frequent_names',
    currentInput: null,
    selectedIndex: -1,
    
    /**
     * Inicializa o sistema
     */
    init() {
        console.log('NameAutocomplete iniciado');
    },
    
    /**
     * Obtém nomes frequentes do localStorage
     */
    getFrequentNames() {
        try {
            return JSON.parse(localStorage.getItem(this.STORAGE_KEY) || '[]');
        } catch {
            return [];
        }
    },
    
    /**
     * Salva nomes frequentes
     */
    saveFrequentNames(names) {
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(names));
    },
    
    /**
     * Adiciona um nome à lista de frequentes
     */
    addName(name) {
        if (!name || name.trim().length < 2) return;
        
        name = name.trim();
        const names = this.getFrequentNames();
        
        // Busca nome existente
        const existing = names.find(n => 
            n.name.toLowerCase() === name.toLowerCase()
        );
        
        if (existing) {
            // Incrementa contador
            existing.count++;
            existing.lastUsed = new Date().toISOString();
        } else {
            // Adiciona novo
            names.push({
                name: name,
                count: 1,
                firstUsed: new Date().toISOString(),
                lastUsed: new Date().toISOString()
            });
        }
        
        // Ordena por contador (mais usado primeiro)
        names.sort((a, b) => b.count - a.count);
        
        // Limita a 100 nomes
        if (names.length > 100) {
            names.splice(100);
        }
        
        this.saveFrequentNames(names);
    },
    
    /**
     * Busca sugestões baseadas no input
     */
    getSuggestions(query) {
        if (!query || query.length < 2) return [];
        
        const names = this.getFrequentNames();
        query = query.toLowerCase();
        
        // Filtra nomes que começam com a query
        const startsWith = names.filter(n => 
            n.name.toLowerCase().startsWith(query)
        );
        
        // Filtra nomes que contêm a query
        const contains = names.filter(n => 
            n.name.toLowerCase().includes(query) &&
            !n.name.toLowerCase().startsWith(query)
        );
        
        // Retorna primeiro os que começam, depois os que contêm
        return [...startsWith, ...contains].slice(0, 5);
    },
    
    /**
     * Ativa autocompletar em um input
     */
    attachToInput(input) {
        // Marca input como tendo autocomplete
        input.classList.add('input-with-autocomplete');
        
        // Cria container de sugestões se não existir
        let suggestionsDiv = input.nextElementSibling;
        if (!suggestionsDiv || !suggestionsDiv.classList.contains('name-suggestions')) {
            suggestionsDiv = document.createElement('div');
            suggestionsDiv.className = 'name-suggestions';
            
            // Wrappa input em container relativo
            const wrapper = document.createElement('div');
            wrapper.className = 'input-with-suggestions';
            input.parentNode.insertBefore(wrapper, input);
            wrapper.appendChild(input);
            wrapper.appendChild(suggestionsDiv);
        }
        
        // Event listeners
        input.addEventListener('input', (e) => this.handleInput(e, input));
        input.addEventListener('keydown', (e) => this.handleKeydown(e, input));
        input.addEventListener('blur', () => {
            // Delay pra permitir clique em sugestão
            setTimeout(() => this.hideSuggestions(input), 200);
        });
    },
    
    /**
     * Trata input do usuário
     */
    handleInput(e, input) {
        const query = input.value;
        const suggestions = this.getSuggestions(query);
        
        if (suggestions.length > 0) {
            this.showSuggestions(input, suggestions);
        } else {
            this.hideSuggestions(input);
        }
        
        this.selectedIndex = -1;
    },
    
    /**
     * Trata teclas especiais
     */
    handleKeydown(e, input) {
        const suggestionsDiv = this.getSuggestionsDiv(input);
        if (!suggestionsDiv || !suggestionsDiv.classList.contains('active')) return;
        
        const items = suggestionsDiv.querySelectorAll('.name-suggestion-item');
        
        switch(e.key) {
            case 'ArrowDown':
                e.preventDefault();
                this.selectedIndex = Math.min(this.selectedIndex + 1, items.length - 1);
                this.updateSelection(items);
                break;
                
            case 'ArrowUp':
                e.preventDefault();
                this.selectedIndex = Math.max(this.selectedIndex - 1, -1);
                this.updateSelection(items);
                break;
                
            case 'Enter':
                if (this.selectedIndex >= 0) {
                    e.preventDefault();
                    const selectedName = items[this.selectedIndex].dataset.name;
                    this.selectName(input, selectedName);
                }
                break;
                
            case 'Escape':
                this.hideSuggestions(input);
                break;
        }
    },
    
    /**
     * Mostra sugestões
     */
    showSuggestions(input, suggestions) {
        const suggestionsDiv = this.getSuggestionsDiv(input);
        if (!suggestionsDiv) return;
        
        suggestionsDiv.innerHTML = suggestions.map(s => `
            <div class="name-suggestion-item" data-name="${s.name}">
                <span class="name-suggestion-name">${s.name}</span>
                <div class="name-suggestion-meta">
                    <span class="name-suggestion-count">${s.count}x</span>
                    <span>usado</span>
                </div>
            </div>
        `).join('');
        
        // Click listeners
        suggestionsDiv.querySelectorAll('.name-suggestion-item').forEach(item => {
            item.addEventListener('click', () => {
                this.selectName(input, item.dataset.name);
            });
        });
        
        suggestionsDiv.classList.add('active');
    },
    
    /**
     * Esconde sugestões
     */
    hideSuggestions(input) {
        const suggestionsDiv = this.getSuggestionsDiv(input);
        if (suggestionsDiv) {
            suggestionsDiv.classList.remove('active');
        }
        this.selectedIndex = -1;
    },
    
    /**
     * Obtém div de sugestões
     */
    getSuggestionsDiv(input) {
        const wrapper = input.parentElement;
        if (wrapper && wrapper.classList.contains('input-with-suggestions')) {
            return wrapper.querySelector('.name-suggestions');
        }
        return null;
    },
    
    /**
     * Atualiza seleção visual
     */
    updateSelection(items) {
        items.forEach((item, idx) => {
            if (idx === this.selectedIndex) {
                item.classList.add('selected');
                item.scrollIntoView({ block: 'nearest' });
            } else {
                item.classList.remove('selected');
            }
        });
    },
    
    /**
     * Seleciona um nome
     */
    selectName(input, name) {
        input.value = name;
        this.hideSuggestions(input);
        
        // Trigger change event
        input.dispatchEvent(new Event('change', { bubbles: true }));
        input.focus();
    },
    
    /**
     * Registra uso de nome (chamar ao salvar convidado)
     */
    registerNameUsage(name) {
        this.addName(name);
    },
    
    /**
     * Obtém estatísticas
     */
    getStats() {
        const names = this.getFrequentNames();
        return {
            total: names.length,
            mostUsed: names[0] || null,
            totalUsage: names.reduce((sum, n) => sum + n.count, 0)
        };
    },
    
    /**
     * Limpa histórico
     */
    clear() {
        if (confirm('Limpar histórico de nomes frequentes?')) {
            localStorage.removeItem(this.STORAGE_KEY);
            alert('✓ Histórico limpo!');
        }
    }
};

// Exporta globalmente
window.NameAutocomplete = NameAutocomplete;

// Auto-inicializa
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => NameAutocomplete.init());
} else {
    NameAutocomplete.init();
}
