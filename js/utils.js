/**
 * UTILS.JS
 * Funções auxiliares e utilitárias
 */

const Utils = {
    /**
     * Formata data para padrão brasileiro
     * @param {string} dateStr - Data no formato YYYY-MM-DD
     * @returns {string} Data formatada DD/MM/YYYY
     */
    formatDateBR(dateStr) {
        if (!dateStr) return '';
        const date = new Date(dateStr + 'T00:00:00');
        return date.toLocaleDateString('pt-BR', { 
            day: '2-digit', 
            month: '2-digit', 
            year: 'numeric' 
        });
    },

    /**
     * Gera ID único baseado em timestamp
     * @returns {number} ID único
     */
    generateId() {
        return Date.now() + Math.random();
    },

    /**
     * Valida campo baseado em tipo
     * @param {string} type - Tipo do campo (email, telefone, cpf)
     * @param {string} value - Valor a validar
     * @returns {boolean} True se válido
     */
    validateField(type, value) {
        if (!value) return true; // Campo vazio é válido

        const patterns = {
            email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
            telefone: /^\(?[1-9]{2}\)?\s?[0-9]{4,5}-?[0-9]{4}$/,
            phone: /^\(?[1-9]{2}\)?\s?[0-9]{4,5}-?[0-9]{4}$/,
            cpf: /^\d{3}\.\d{3}\.\d{3}-\d{2}$/,
            whatsapp: /^\(?[1-9]{2}\)?\s?[0-9]{4,5}-?[0-9]{4}$/
        };

        const lowerType = type.toLowerCase();
        for (const key in patterns) {
            if (lowerType.includes(key)) {
                return patterns[key].test(value);
            }
        }
        
        return true; // Se não encontrou padrão, considera válido
    },

    /**
     * Detecta ícone baseado no nome do campo
     * @param {string} fieldName - Nome do campo
     * @returns {string} Emoji do ícone
     */
    getFieldIcon(fieldName) {
        const fieldIcons = {
            'email': '✉', 
            'telefone': '📱', 
            'phone': '📱', 
            'whatsapp': '💬',
            'cidade': '📍', 
            'city': '📍', 
            'endereco': '🏠', 
            'endereço': '🏠',
            'cpf': '🆔', 
            'rg': '🆔', 
            'idade': '🎂', 
            'data': '📅',
            'empresa': '🏢',
            'cargo': '💼'
        };

        const lower = fieldName.toLowerCase();
        for (const key in fieldIcons) {
            if (lower.includes(key)) return fieldIcons[key];
        }
        return '•';
    },

    /**
     * Detecta separador em string CSV/TSV
     * @param {string} line - Primeira linha do arquivo
     * @returns {string} Separador detectado
     */
    detectSeparator(line) {
        if (line.includes('\t')) return '\t';
        if (line.includes(',')) return ',';
        if (line.includes(';')) return ';';
        return '\t'; // Default
    },

    /**
     * Sanitiza nome de arquivo
     * @param {string} filename - Nome original
     * @returns {string} Nome sanitizado
     */
    sanitizeFilename(filename) {
        return filename
            .replace(/\s+/g, '_')
            .replace(/[^a-zA-Z0-9_-]/g, '')
            .substring(0, 50);
    },

    /**
     * Calcula tamanho de dados em KB
     * @param {string} data - String de dados
     * @returns {number} Tamanho em KB
     */
    getDataSizeKB(data) {
        return new Blob([data]).size / 1024;
    },

    /**
     * Debounce function para otimizar eventos
     * @param {Function} func - Função a debouncar
     * @param {number} wait - Tempo de espera em ms
     * @returns {Function} Função debounced
     */
    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    },

    /**
     * Clona objeto profundamente
     * @param {Object} obj - Objeto a clonar
     * @returns {Object} Cópia do objeto
     */
    deepClone(obj) {
        return JSON.parse(JSON.stringify(obj));
    },

    /**
     * Ordena array de objetos por propriedade
     * @param {Array} array - Array a ordenar
     * @param {string} property - Propriedade para ordenar
     * @param {boolean} ascending - Ascendente ou descendente
     * @returns {Array} Array ordenado
     */
    sortByProperty(array, property, ascending = true) {
        return array.sort((a, b) => {
            const valA = (a[property] || '').toLowerCase();
            const valB = (b[property] || '').toLowerCase();
            const comparison = valA.localeCompare(valB);
            return ascending ? comparison : -comparison;
        });
    },

    /**
     * Filtra array removendo duplicatas
     * @param {Array} array - Array original
     * @returns {Array} Array sem duplicatas
     */
    removeDuplicates(array) {
        return [...new Set(array)];
    },

    /**
     * Trunca texto com reticências
     * @param {string} text - Texto original
     * @param {number} maxLength - Tamanho máximo
     * @returns {string} Texto truncado
     */
    truncate(text, maxLength) {
        if (text.length <= maxLength) return text;
        return text.substring(0, maxLength - 3) + '...';
    },

    /**
     * Gera hash simples de string
     * @param {string} str - String a processar
     * @returns {number} Hash numérico
     */
    simpleHash(str) {
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            const char = str.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash;
        }
        return Math.abs(hash);
    },

    /**
     * Verifica se string contém apenas espaços
     * @param {string} str - String a verificar
     * @returns {boolean} True se vazia
     */
    isBlank(str) {
        return !str || /^\s*$/.test(str);
    },

    /**
     * Capitaliza primeira letra
     * @param {string} str - String original
     * @returns {string} String capitalizada
     */
    capitalize(str) {
        if (!str) return '';
        return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
    },

    /**
     * Formata número com separadores de milhar
     * @param {number} num - Número a formatar
     * @returns {string} Número formatado
     */
    formatNumber(num) {
        return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
    },

    /**
     * Calcula percentual
     * @param {number} value - Valor
     * @param {number} total - Total
     * @returns {number} Percentual arredondado
     */
    calculatePercentage(value, total) {
        if (total === 0) return 0;
        return Math.round((value / total) * 100);
    },

    /**
     * Cria elemento HTML a partir de string
     * @param {string} html - HTML string
     * @returns {HTMLElement} Elemento DOM
     */
    createElementFromHTML(html) {
        const template = document.createElement('template');
        template.innerHTML = html.trim();
        return template.content.firstChild;
    },

    /**
     * Escapa HTML para prevenir XSS
     * @param {string} text - Texto a escapar
     * @returns {string} Texto escapado
     */
    escapeHTML(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    },

    /**
     * Download de blob como arquivo
     * @param {Blob} blob - Blob de dados
     * @param {string} filename - Nome do arquivo
     */
    downloadBlob(blob, filename) {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    },

    /**
     * Copia texto para clipboard
     * @param {string} text - Texto a copiar
     * @returns {Promise<boolean>} Sucesso da operação
     */
    async copyToClipboard(text) {
        try {
            await navigator.clipboard.writeText(text);
            return true;
        } catch (err) {
            console.error('Erro ao copiar:', err);
            return false;
        }
    },

    /**
     * Aguarda tempo em ms (para uso com async/await)
     * @param {number} ms - Milissegundos
     * @returns {Promise} Promise que resolve após delay
     */
    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    },

    /**
     * Verifica se está rodando em mobile
     * @returns {boolean} True se mobile
     */
    isMobile() {
        return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    },

    /**
     * Log com timestamp (para debug)
     * @param {string} message - Mensagem
     * @param {any} data - Dados adicionais
     */
    log(message, data = null) {
        const timestamp = new Date().toLocaleTimeString('pt-BR');
        console.log(`[${timestamp}] ${message}`, data || '');
    }
};

// Exporta globalmente
window.Utils = Utils;
