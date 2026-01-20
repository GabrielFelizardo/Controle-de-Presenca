/**
 * SINCRONIZAÇÃO COM PLANILHA v3.1.0
 * Intercepta operações locais e sincroniza com Sheets
 * 
 * ✅ CORRIGIDO: parâmetro location em createEvent
 */

const SheetSync = {
  /**
   * Ativa sincronização
   */
  enable() {
    this.interceptEventOperations();
    this.interceptGuestOperations();
    console.log('✅ Sincronização com planilha ativada');
  },
  
  // ========================================
  // EVENTOS
  // ========================================
  
  /**
   * Intercepta operações de eventos
   */
  interceptEventOperations() {
    // Salva funções originais
    const originalCreateEvent = State.createEvent;
    const originalDeleteEvent = State.deleteEvent;
    
    // Sobrescreve createEvent
    State.createEvent = async function(name, date) {
      console.log('📝 Criando evento:', name);
      
      try {
        // 1. Cria na planilha primeiro
        // ✅ CORRIGIDO: adicionado 4º parâmetro (location)
        const result = await API.createEvent(name, date || '', '', '');
        
        if (!result.success) {
          throw new Error(result.error || 'Erro ao criar evento na planilha');
        }
        
        // 2. Cria local
        const localEvent = {
          id: result.data.eventId,
          name: name,
          date: date || '',
          guests: [],
          createdAt: new Date(),
          sheetName: result.data.sheetName
        };
        
        State.events.push(localEvent);
        Storage.save();
        
        console.log('✅ Evento criado:', localEvent);
        return localEvent;
        
      } catch (error) {
        console.error('❌ Erro ao criar evento:', error);
        alert('Erro ao criar evento: ' + error.message);
        return null;
      }
    };
    
    // Sobrescreve deleteEvent
    State.deleteEvent = async function(eventId) {
      console.log('🗑️ Deletando evento:', eventId);
      
      try {
        // 1. Deleta da planilha
        const result = await API.deleteEvent(eventId);
        
        if (!result.success) {
          throw new Error(result.error || 'Erro ao deletar evento');
        }
        
        // 2. Deleta local
        const index = State.events.findIndex(e => e.id === eventId);
        if (index > -1) {
          State.events.splice(index, 1);
          Storage.save();
        }
        
        console.log('✅ Evento deletado');
        return true;
        
      } catch (error) {
        console.error('❌ Erro ao deletar evento:', error);
        alert('Erro ao deletar evento: ' + error.message);
        return false;
      }
    };
  },
  
  // ========================================
  // CONVIDADOS
  // ========================================
  
  /**
   * Intercepta operações de convidados
   */
  interceptGuestOperations() {
    // Salva funções originais
    const originalAddGuest = State.addGuest;
    const originalUpdateGuest = State.updateGuestStatus;
    const originalDeleteGuest = State.deleteGuest;
    
    // Sobrescreve addGuest
    State.addGuest = async function(eventId, guest) {
      console.log('👤 Adicionando convidado:', guest.name);
      
      try {
        // 1. Adiciona na planilha
        const result = await API.addGuest(eventId, guest);
        
        if (!result.success) {
          throw new Error(result.error || 'Erro ao adicionar convidado');
        }
        
        // 2. Adiciona local
        const event = State.events.find(e => e.id === eventId);
        if (!event) {
          throw new Error('Evento não encontrado');
        }
        
        const localGuest = {
          id: result.data.guestId,
          name: guest.name,
          phone: guest.phone || '',
          email: guest.email || '',
          status: guest.status || 'pending',
          notes: guest.notes || ''
        };
        
        event.guests.push(localGuest);
        Storage.save();
        
        console.log('✅ Convidado adicionado:', localGuest);
        return localGuest;
        
      } catch (error) {
        console.error('❌ Erro ao adicionar convidado:', error);
        alert('Erro ao adicionar convidado: ' + error.message);
        return null;
      }
    };
    
    // Sobrescreve updateGuestStatus
    State.updateGuestStatus = async function(eventId, guestId, status) {
      console.log('🔄 Atualizando status:', guestId, status);
      
      try {
        // 1. Atualiza na planilha
        const result = await API.updateGuest(eventId, guestId, { status: status });
        
        if (!result.success) {
          throw new Error(result.error || 'Erro ao atualizar status');
        }
        
        // 2. Atualiza local
        const event = State.events.find(e => e.id === eventId);
        if (event) {
          const guest = event.guests.find(g => g.id === guestId);
          if (guest) {
            guest.status = status;
            Storage.save();
          }
        }
        
        console.log('✅ Status atualizado');
        return true;
        
      } catch (error) {
        console.error('❌ Erro ao atualizar status:', error);
        alert('Erro ao atualizar status: ' + error.message);
        return false;
      }
    };
    
    // Sobrescreve deleteGuest
    State.deleteGuest = async function(eventId, guestId) {
      console.log('🗑️ Deletando convidado:', guestId);
      
      try {
        // 1. Deleta da planilha
        const result = await API.deleteGuest(eventId, guestId);
        
        if (!result.success) {
          throw new Error(result.error || 'Erro ao deletar convidado');
        }
        
        // 2. Deleta local
        const event = State.events.find(e => e.id === eventId);
        if (event) {
          const index = event.guests.findIndex(g => g.id === guestId);
          if (index > -1) {
            event.guests.splice(index, 1);
            Storage.save();
          }
        }
        
        console.log('✅ Convidado deletado');
        return true;
        
      } catch (error) {
        console.error('❌ Erro ao deletar convidado:', error);
        alert('Erro ao deletar convidado: ' + error.message);
        return false;
      }
    };
  }
};

// Exporta
window.SheetSync = SheetSync;

console.log('🔄 Sheet Sync v3.1.0 carregado');
