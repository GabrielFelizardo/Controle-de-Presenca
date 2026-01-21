/**
 * SINCRONIZAÇÃO COM PLANILHA v3.1.2
 * ✅ CORRIGIDO: Passa spreadsheetId corretamente
 */

const SheetSync = {
  enabled: false,
  
  /**
   * Ativa sincronização
   */
  enable() {
    if (this.enabled) {
      console.log('⚠️ SheetSync já está ativo');
      return;
    }
    
    if (!AuthSystem || !AuthSystem.spreadsheetId) {
      console.error('❌ Não pode ativar SheetSync: sem spreadsheetId');
      return;
    }
    
    this.interceptEventOperations();
    this.interceptGuestOperations();
    this.enabled = true;
    
    console.log('✅ Sincronização com planilha ativada');
    console.log('📊 SpreadsheetId:', AuthSystem.spreadsheetId);
  },
  
  // ========================================
  // EVENTOS
  // ========================================
  
  /**
   * Intercepta operações de eventos
   */
  interceptEventOperations() {
    // Salva função original
    const originalAddEvent = State.addEvent;
    
    // ✅ CORRIGIDO: Sobrescreve addEvent
    State.addEvent = async function(name, date) {
      console.log('📝 Criando evento:', name);
      
      // Verifica se tem spreadsheetId
      if (!AuthSystem.spreadsheetId) {
        console.warn('⚠️ Sem spreadsheetId - criando apenas localmente');
        return originalAddEvent.call(State, name, date);
      }
      
      try {
        // ✅ CORRIGIDO: Passa spreadsheetId!
        const result = await API.createEvent(
          AuthSystem.spreadsheetId,  // ← AQUI!
          name,
          date || '',
          '',
          ''
        );
        
        if (!result.success) {
          throw new Error(result.error || 'Erro ao criar evento na planilha');
        }
        
        // 2. Cria local
        const localEvent = {
          id: result.data.eventId,
          name: name,
          date: date || '',
          guests: [],
          columns: [],
          method: null,
          createdAt: new Date(),
          sheetName: result.data.sheetName,
          syncedToSheet: true
        };
        
        State.events.push(localEvent);
        Storage.save();
        
        console.log('✅ Evento criado na planilha:', localEvent);
        
        // Mostra notificação
        if (typeof UICore !== 'undefined') {
          UICore.showNotification('✅ Evento criado no Google Drive!', 'success');
        }
        
        return localEvent;
        
      } catch (error) {
        console.error('❌ Erro ao criar evento no Sheets:', error);
        
        // Mostra erro pro usuário
        if (typeof UICore !== 'undefined') {
          UICore.showError('Erro ao salvar no Google Drive: ' + error.message);
        }
        
        // Cria localmente mesmo com erro
        console.log('📝 Criando evento apenas localmente...');
        const localEvent = originalAddEvent.call(State, name, date);
        localEvent.syncedToSheet = false;
        return localEvent;
      }
    };
    
    // Sobrescreve removeEvent
    const originalRemoveEvent = State.removeEvent;
    
    State.removeEvent = async function(eventId) {
      console.log('🗑️ Deletando evento:', eventId);
      
      const event = State.getEventById(eventId);
      if (!event) return false;
      
      // Se tem sheetName, deleta do Sheets também
      if (event.sheetName && AuthSystem.spreadsheetId) {
        try {
          const result = await API.deleteEvent(
            AuthSystem.spreadsheetId,
            event.sheetName
          );
          
          if (!result.success) {
            console.warn('⚠️ Erro ao deletar do Sheets:', result.error);
          } else {
            console.log('✅ Evento deletado do Sheets');
          }
          
        } catch (error) {
          console.error('❌ Erro ao deletar do Sheets:', error);
        }
      }
      
      // Deleta local
      const success = originalRemoveEvent.call(State, eventId);
      Storage.save();
      
      return success;
    };
  },
  
  // ========================================
  // CONVIDADOS
  // ========================================
  
  /**
   * Intercepta operações de convidados
   */
  interceptGuestOperations() {
    // Salva função original
    const originalAddGuest = State.addGuest;
    
    // ✅ CORRIGIDO: Sobrescreve addGuest
    State.addGuest = async function(eventId, guest) {
      console.log('👤 Adicionando convidado:', guest.name);
      
      const event = State.getEventById(eventId);
      if (!event) {
        throw new Error('Evento não encontrado');
      }
      
      // Se evento não está sincronizado com Sheets, adiciona só localmente
      if (!event.sheetName || !AuthSystem.spreadsheetId) {
        console.log('📝 Adicionando convidado apenas localmente');
        return originalAddGuest.call(State, eventId, guest);
      }
      
      try {
        // ✅ CORRIGIDO: Passa spreadsheetId e sheetName!
        const result = await API.addGuest(
          AuthSystem.spreadsheetId,
          event.sheetName,
          guest
        );
        
        if (!result.success) {
          throw new Error(result.error || 'Erro ao adicionar convidado');
        }
        
        // 2. Adiciona local
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
        
        console.log('✅ Convidado adicionado na planilha:', localGuest);
        
        return localGuest;
        
      } catch (error) {
        console.error('❌ Erro ao adicionar convidado no Sheets:', error);
        
        // Adiciona localmente mesmo com erro
        console.log('📝 Adicionando convidado apenas localmente...');
        return originalAddGuest.call(State, eventId, guest);
      }
    };
    
    // Sobrescreve updateGuestStatus
    const originalUpdateStatus = State.updateGuestStatus;
    
    State.updateGuestStatus = async function(eventId, guestIndex, status) {
      console.log('🔄 Atualizando status:', guestIndex, status);
      
      const event = State.getEventById(eventId);
      if (!event) return;
      
      const guest = event.guests[guestIndex];
      if (!guest) return;
      
      // Se evento está sincronizado, atualiza no Sheets
      if (event.sheetName && AuthSystem.spreadsheetId && guest.id) {
        try {
          const result = await API.updateGuest(
            AuthSystem.spreadsheetId,
            event.sheetName,
            guest.id,
            { status: status }
          );
          
          if (!result.success) {
            console.warn('⚠️ Erro ao atualizar no Sheets:', result.error);
          } else {
            console.log('✅ Status atualizado no Sheets');
          }
          
        } catch (error) {
          console.error('❌ Erro ao atualizar no Sheets:', error);
        }
      }
      
      // Atualiza local
      originalUpdateStatus.call(State, eventId, guestIndex, status);
      Storage.save();
    };
    
    // Sobrescreve removeGuest
    const originalRemoveGuest = State.removeGuest;
    
    State.removeGuest = async function(eventId, guestIndex) {
      console.log('🗑️ Deletando convidado:', guestIndex);
      
      const event = State.getEventById(eventId);
      if (!event) return false;
      
      const guest = event.guests[guestIndex];
      if (!guest) return false;
      
      // Se evento está sincronizado, deleta do Sheets
      if (event.sheetName && AuthSystem.spreadsheetId && guest.id) {
        try {
          const result = await API.deleteGuest(
            AuthSystem.spreadsheetId,
            event.sheetName,
            guest.id
          );
          
          if (!result.success) {
            console.warn('⚠️ Erro ao deletar do Sheets:', result.error);
          } else {
            console.log('✅ Convidado deletado do Sheets');
          }
          
        } catch (error) {
          console.error('❌ Erro ao deletar do Sheets:', error);
        }
      }
      
      // Deleta local
      const success = originalRemoveGuest.call(State, eventId, guestIndex);
      Storage.save();
      
      return success;
    };
  },
  
  /**
   * Desativa sincronização (para debug)
   */
  disable() {
    this.enabled = false;
    console.log('⚠️ SheetSync desativado');
  }
};

// Exporta
window.SheetSync = SheetSync;

console.log('🔄 Sheet Sync v3.1.2 carregado');
