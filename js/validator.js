/**
 * VALIDATOR v3.1.0
 * Validação de dados para prevenir corrupção
 */

const Validator = {
  /**
   * Valida evento
   */
  validateEvent(event) {
    const errors = [];
    
    if (!event.id) {
      errors.push('Evento sem ID');
    }
    
    if (!event.name || typeof event.name !== 'string') {
      errors.push('Nome de evento inválido');
    }
    
    if (!Array.isArray(event.columns)) {
      errors.push('Colunas devem ser array');
    }
    
    if (!Array.isArray(event.guests)) {
      errors.push('Convidados devem ser array');
    }
    
    return {
      valid: errors.length === 0,
      errors: errors
    };
  },
  
  /**
   * Valida convidado
   */
  validateGuest(guest, columns) {
    const errors = [];
    
    if (!guest.id) {
      errors.push('Convidado sem ID');
    }
    
    if (!guest.status) {
      guest.status = 'pending'; // Auto-fix
    }
    
    if (!['yes', 'no', 'pending'].includes(guest.status)) {
      errors.push('Status inválido: ' + guest.status);
    }
    
    // Valida campos obrigatórios (primeiro da lista geralmente é nome)
    if (columns && columns.length > 0) {
      const firstCol = columns[0];
      if (!guest[firstCol] || guest[firstCol].trim() === '') {
        errors.push(`Campo "${firstCol}" obrigatório`);
      }
    }
    
    return {
      valid: errors.length === 0,
      errors: errors,
      fixed: guest
    };
  },
  
  /**
   * Valida estado completo
   */
  validateState(state) {
    const errors = [];
    
    if (!Array.isArray(state.events)) {
      errors.push('State.events deve ser array');
      return { valid: false, errors };
    }
    
    state.events.forEach((event, idx) => {
      const eventValidation = this.validateEvent(event);
      if (!eventValidation.valid) {
        errors.push(`Evento ${idx}: ${eventValidation.errors.join(', ')}`);
      }
      
      event.guests.forEach((guest, guestIdx) => {
        const guestValidation = this.validateGuest(guest, event.columns);
        if (!guestValidation.valid) {
          errors.push(`Evento ${idx}, Convidado ${guestIdx}: ${guestValidation.errors.join(', ')}`);
        }
      });
    });
    
    return {
      valid: errors.length === 0,
      errors: errors
    };
  },
  
  /**
   * Sanitiza HTML para prevenir XSS
   */
  sanitizeHTML(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  },
  
  /**
   * Valida email
   */
  isValidEmail(email) {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email);
  },
  
  /**
   * Valida telefone brasileiro
   */
  isValidPhone(phone) {
    const cleaned = phone.replace(/\D/g, '');
    return cleaned.length >= 10 && cleaned.length <= 11;
  }
};

// Valida state ao carregar
if (typeof State !== 'undefined' && State.events) {
  const validation = Validator.validateState(State);
  if (!validation.valid) {
    console.warn('⚠️ State com problemas:', validation.errors);
  } else {
    console.log('✅ State válido');
  }
}

window.Validator = Validator;
console.log('✅ Validator v3.1.0 carregado');
