/**
 * SISTEMA DE PRESENÇA - APPS SCRIPT BACKEND
 * v3.0 - Google Sheets + Forms Integration
 * 
 * Desenvolvido por: Gabriel Felizardo
 * 
 * FUNCIONALIDADES:
 * - API REST para frontend
 * - CRUD de eventos
 * - CRUD de convidados
 * - Criação automática de Google Forms
 * - Geração de QR Codes
 * - Sistema multi-cliente
 */

// ========================================
// CONFIGURAÇÕES GLOBAIS
// ========================================

const CONFIG = {
  SHEET_NAMES: {
    CONFIG: 'CONFIG',
    EVENTOS: 'EVENTOS',
    CONVIDADOS: 'CONVIDADOS',
    CONFIRMACOES: 'CONFIRMAÇÕES',
    FORMS: 'FORMS'
  },
  CORS_ORIGINS: ['*'], // Permitir todos (ajustar depois)
  VERSION: '3.0'
};

// ========================================
// ENDPOINT PRINCIPAL
// ========================================

/**
 * Recebe requisições POST do frontend
 */
function doPost(e) {
  try {
    // Parse do payload
    const data = JSON.parse(e.postData.contents);
    
    // Log da requisição
    logRequest(data);
    
    // Router de ações
    let result;
    switch(data.action) {
      // Cliente
      case 'createClient':
        result = createClient(data);
        break;
      case 'getClient':
        result = getClient(data);
        break;
        
      // Eventos
      case 'createEvent':
        result = createEvent(data);
        break;
      case 'getEvents':
        result = getEvents(data);
        break;
      case 'updateEvent':
        result = updateEvent(data);
        break;
      case 'deleteEvent':
        result = deleteEvent(data);
        break;
        
      // Convidados
      case 'addGuest':
        result = addGuest(data);
        break;
      case 'updateGuest':
        result = updateGuest(data);
        break;
      case 'deleteGuest':
        result = deleteGuest(data);
        break;
      case 'getGuests':
        result = getGuests(data);
        break;
      case 'updateStatus':
        result = updateStatus(data);
        break;
        
      // Formulários
      case 'createEventForm':
        result = createEventForm(data);
        break;
      case 'getFormResponses':
        result = getFormResponses(data);
        break;
        
      // Sincronização
      case 'syncFormResponses':
        result = syncFormResponses(data);
        break;
        
      default:
        result = errorResponse('Ação inválida: ' + data.action);
    }
    
    return createResponse(result);
    
  } catch (error) {
    logError(error);
    return createResponse(errorResponse(error.message));
  }
}

/**
 * Recebe requisições GET (para testes)
 */
function doGet(e) {
  return createResponse({
    success: true,
    message: 'Sistema de Presença API v' + CONFIG.VERSION,
    timestamp: new Date().toISOString()
  });
}

// ========================================
// CLIENTE (CRIAR PLANILHA)
// ========================================

/**
 * Cria novo cliente e sua planilha
 */
function createClient(data) {
  try {
    const { name, email, plan = 'basic' } = data;
    
    if (!name || !email) {
      return errorResponse('Nome e email são obrigatórios');
    }
    
    // Gera ID único
    const clientId = generateId();
    
    // Cria planilha nova
    const ss = SpreadsheetApp.create(`Sistema Presença - ${name}`);
    const spreadsheetId = ss.getId();
    const spreadsheetUrl = ss.getUrl();
    
    // Configura planilha
    setupClientSpreadsheet(ss, clientId, name, email, plan);
    
    // Compartilha com cliente
    try {
      ss.addEditor(email);
    } catch (e) {
      Logger.log('Aviso: Não foi possível compartilhar automaticamente. Email: ' + email);
    }
    
    return successResponse({
      clientId: clientId,
      spreadsheetId: spreadsheetId,
      spreadsheetUrl: spreadsheetUrl,
      name: name,
      email: email,
      plan: plan,
      createdAt: new Date().toISOString()
    });
    
  } catch (error) {
    return errorResponse('Erro ao criar cliente: ' + error.message);
  }
}

/**
 * Configura estrutura da planilha do cliente
 */
function setupClientSpreadsheet(ss, clientId, name, email, plan) {
  // Remove aba padrão e cria estrutura
  const defaultSheet = ss.getSheets()[0];
  
  // Cria abas
  const configSheet = defaultSheet.setName(CONFIG.SHEET_NAMES.CONFIG);
  const eventsSheet = ss.insertSheet(CONFIG.SHEET_NAMES.EVENTOS);
  const guestsSheet = ss.insertSheet(CONFIG.SHEET_NAMES.CONVIDADOS);
  const confirmSheet = ss.insertSheet(CONFIG.SHEET_NAMES.CONFIRMACOES);
  const formsSheet = ss.insertSheet(CONFIG.SHEET_NAMES.FORMS);
  
  // CONFIG
  configSheet.getRange('A1:B1').setValues([['Chave', 'Valor']]);
  configSheet.appendRow(['clientId', clientId]);
  configSheet.appendRow(['name', name]);
  configSheet.appendRow(['email', email]);
  configSheet.appendRow(['plan', plan]);
  configSheet.appendRow(['createdAt', new Date()]);
  configSheet.appendRow(['apiVersion', CONFIG.VERSION]);
  
  // EVENTOS
  eventsSheet.getRange('A1:H1').setValues([[
    'EventID', 'Nome', 'Data', 'Descrição', 'Local', 
    'FormURL', 'FormID', 'Criado Em'
  ]]);
  
  // CONVIDADOS
  guestsSheet.getRange('A1:I1').setValues([[
    'GuestID', 'EventID', 'Nome', 'Telefone', 'Email', 
    'Status', 'Origem', 'Criado Em', 'Atualizado Em'
  ]]);
  
  // CONFIRMAÇÕES (Log)
  confirmSheet.getRange('A1:F1').setValues([[
    'Timestamp', 'EventID', 'GuestID', 'Nome', 'Status', 'Origem'
  ]]);
  
  // FORMS
  formsSheet.getRange('A1:E1').setValues([[
    'FormID', 'EventID', 'FormURL', 'EditURL', 'Criado Em'
  ]]);
  
  // Formata headers (todas as abas)
  [configSheet, eventsSheet, guestsSheet, confirmSheet, formsSheet].forEach(sheet => {
    const lastCol = sheet.getLastColumn();
    if (lastCol > 0) {
      sheet.getRange(1, 1, 1, lastCol)
        .setBackground('#000000')
        .setFontColor('#FFFFFF')
        .setFontWeight('bold')
        .setHorizontalAlignment('center');
      
      // Auto-resize
      for (let i = 1; i <= lastCol; i++) {
        sheet.autoResizeColumn(i);
      }
    }
  });
  
  // Protege aba CONFIG
  const protection = configSheet.protect();
  protection.setWarningOnly(true);
  
  return ss;
}

/**
 * Busca dados do cliente
 */
function getClient(data) {
  try {
    const { spreadsheetId } = data;
    
    if (!spreadsheetId) {
      return errorResponse('spreadsheetId é obrigatório');
    }
    
    const ss = SpreadsheetApp.openById(spreadsheetId);
    const configSheet = ss.getSheetByName(CONFIG.SHEET_NAMES.CONFIG);
    const configData = configSheet.getDataRange().getValues();
    
    // Converte array para objeto
    const config = {};
    for (let i = 1; i < configData.length; i++) {
      config[configData[i][0]] = configData[i][1];
    }
    
    return successResponse(config);
    
  } catch (error) {
    return errorResponse('Erro ao buscar cliente: ' + error.message);
  }
}

// ========================================
// EVENTOS
// ========================================

/**
 * Cria novo evento
 */
function createEvent(data) {
  try {
    const { spreadsheetId, name, date, description = '', location = '' } = data;
    
    if (!spreadsheetId || !name) {
      return errorResponse('spreadsheetId e name são obrigatórios');
    }
    
    const ss = SpreadsheetApp.openById(spreadsheetId);
    const eventsSheet = ss.getSheetByName(CONFIG.SHEET_NAMES.EVENTOS);
    
    const eventId = generateId();
    const createdAt = new Date();
    
    eventsSheet.appendRow([
      eventId,
      name,
      date || '',
      description,
      location,
      '', // FormURL (será preenchido depois)
      '', // FormID (será preenchido depois)
      createdAt
    ]);
    
    return successResponse({
      eventId: eventId,
      name: name,
      date: date,
      description: description,
      location: location,
      createdAt: createdAt.toISOString()
    });
    
  } catch (error) {
    return errorResponse('Erro ao criar evento: ' + error.message);
  }
}

/**
 * Lista eventos
 */
function getEvents(data) {
  try {
    const { spreadsheetId } = data;
    
    if (!spreadsheetId) {
      return errorResponse('spreadsheetId é obrigatório');
    }
    
    const ss = SpreadsheetApp.openById(spreadsheetId);
    const eventsSheet = ss.getSheetByName(CONFIG.SHEET_NAMES.EVENTOS);
    const eventsData = eventsSheet.getDataRange().getValues();
    
    const events = [];
    for (let i = 1; i < eventsData.length; i++) {
      events.push({
        id: eventsData[i][0],
        name: eventsData[i][1],
        date: eventsData[i][2],
        description: eventsData[i][3],
        location: eventsData[i][4],
        formUrl: eventsData[i][5],
        formId: eventsData[i][6],
        createdAt: eventsData[i][7]
      });
    }
    
    return successResponse({ events: events });
    
  } catch (error) {
    return errorResponse('Erro ao listar eventos: ' + error.message);
  }
}

/**
 * Atualiza evento
 */
function updateEvent(data) {
  try {
    const { spreadsheetId, eventId, updates } = data;
    
    if (!spreadsheetId || !eventId || !updates) {
      return errorResponse('spreadsheetId, eventId e updates são obrigatórios');
    }
    
    const ss = SpreadsheetApp.openById(spreadsheetId);
    const eventsSheet = ss.getSheetByName(CONFIG.SHEET_NAMES.EVENTOS);
    const eventsData = eventsSheet.getDataRange().getValues();
    
    // Encontra evento
    for (let i = 1; i < eventsData.length; i++) {
      if (eventsData[i][0] === eventId) {
        if (updates.name !== undefined) eventsSheet.getRange(i + 1, 2).setValue(updates.name);
        if (updates.date !== undefined) eventsSheet.getRange(i + 1, 3).setValue(updates.date);
        if (updates.description !== undefined) eventsSheet.getRange(i + 1, 4).setValue(updates.description);
        if (updates.location !== undefined) eventsSheet.getRange(i + 1, 5).setValue(updates.location);
        
        return successResponse({ updated: true });
      }
    }
    
    return errorResponse('Evento não encontrado');
    
  } catch (error) {
    return errorResponse('Erro ao atualizar evento: ' + error.message);
  }
}

/**
 * Deleta evento
 */
function deleteEvent(data) {
  try {
    const { spreadsheetId, eventId } = data;
    
    if (!spreadsheetId || !eventId) {
      return errorResponse('spreadsheetId e eventId são obrigatórios');
    }
    
    const ss = SpreadsheetApp.openById(spreadsheetId);
    const eventsSheet = ss.getSheetByName(CONFIG.SHEET_NAMES.EVENTOS);
    const eventsData = eventsSheet.getDataRange().getValues();
    
    // Encontra e deleta
    for (let i = 1; i < eventsData.length; i++) {
      if (eventsData[i][0] === eventId) {
        eventsSheet.deleteRow(i + 1);
        return successResponse({ deleted: true });
      }
    }
    
    return errorResponse('Evento não encontrado');
    
  } catch (error) {
    return errorResponse('Erro ao deletar evento: ' + error.message);
  }
}

// ========================================
// CONVIDADOS
// ========================================

/**
 * Adiciona convidado
 */
function addGuest(data) {
  try {
    const { spreadsheetId, eventId, guest } = data;
    
    if (!spreadsheetId || !eventId || !guest || !guest.name) {
      return errorResponse('Dados incompletos');
    }
    
    const ss = SpreadsheetApp.openById(spreadsheetId);
    const guestsSheet = ss.getSheetByName(CONFIG.SHEET_NAMES.CONVIDADOS);
    
    const guestId = generateId();
    const createdAt = new Date();
    
    // Usa lock para evitar race condition
    const lock = LockService.getScriptLock();
    lock.waitLock(10000);
    
    try {
      guestsSheet.appendRow([
        guestId,
        eventId,
        guest.name,
        guest.phone || '',
        guest.email || '',
        guest.status || 'pending',
        guest.origin || 'manual',
        createdAt,
        createdAt
      ]);
    } finally {
      lock.releaseLock();
    }
    
    // Log confirmação
    logConfirmation(ss, eventId, guestId, guest.name, guest.status || 'pending', guest.origin || 'manual');
    
    return successResponse({
      guestId: guestId,
      eventId: eventId,
      name: guest.name,
      status: guest.status || 'pending',
      createdAt: createdAt.toISOString()
    });
    
  } catch (error) {
    return errorResponse('Erro ao adicionar convidado: ' + error.message);
  }
}

/**
 * Atualiza convidado
 */
function updateGuest(data) {
  try {
    const { spreadsheetId, guestId, updates } = data;
    
    if (!spreadsheetId || !guestId || !updates) {
      return errorResponse('Dados incompletos');
    }
    
    const ss = SpreadsheetApp.openById(spreadsheetId);
    const guestsSheet = ss.getSheetByName(CONFIG.SHEET_NAMES.CONVIDADOS);
    const guestsData = guestsSheet.getDataRange().getValues();
    
    for (let i = 1; i < guestsData.length; i++) {
      if (guestsData[i][0] === guestId) {
        if (updates.name !== undefined) guestsSheet.getRange(i + 1, 3).setValue(updates.name);
        if (updates.phone !== undefined) guestsSheet.getRange(i + 1, 4).setValue(updates.phone);
        if (updates.email !== undefined) guestsSheet.getRange(i + 1, 5).setValue(updates.email);
        if (updates.status !== undefined) guestsSheet.getRange(i + 1, 6).setValue(updates.status);
        
        guestsSheet.getRange(i + 1, 9).setValue(new Date());
        
        return successResponse({ updated: true });
      }
    }
    
    return errorResponse('Convidado não encontrado');
    
  } catch (error) {
    return errorResponse('Erro ao atualizar convidado: ' + error.message);
  }
}

/**
 * Atualiza status do convidado
 */
function updateStatus(data) {
  try {
    const { spreadsheetId, guestId, status, eventId } = data;
    
    if (!spreadsheetId || !guestId || !status) {
      return errorResponse('spreadsheetId, guestId e status são obrigatórios');
    }
    
    const ss = SpreadsheetApp.openById(spreadsheetId);
    const guestsSheet = ss.getSheetByName(CONFIG.SHEET_NAMES.CONVIDADOS);
    const guestsData = guestsSheet.getDataRange().getValues();
    
    for (let i = 1; i < guestsData.length; i++) {
      if (guestsData[i][0] === guestId) {
        guestsSheet.getRange(i + 1, 6).setValue(status);
        guestsSheet.getRange(i + 1, 9).setValue(new Date());
        
        // Log
        logConfirmation(ss, eventId || guestsData[i][1], guestId, guestsData[i][2], status, 'update');
        
        return successResponse({ updated: true, status: status });
      }
    }
    
    return errorResponse('Convidado não encontrado');
    
  } catch (error) {
    return errorResponse('Erro ao atualizar status: ' + error.message);
  }
}

/**
 * Lista convidados de um evento
 */
function getGuests(data) {
  try {
    const { spreadsheetId, eventId } = data;
    
    if (!spreadsheetId || !eventId) {
      return errorResponse('spreadsheetId e eventId são obrigatórios');
    }
    
    const ss = SpreadsheetApp.openById(spreadsheetId);
    const guestsSheet = ss.getSheetByName(CONFIG.SHEET_NAMES.CONVIDADOS);
    const guestsData = guestsSheet.getDataRange().getValues();
    
    const guests = [];
    for (let i = 1; i < guestsData.length; i++) {
      if (guestsData[i][1] === eventId) {
        guests.push({
          id: guestsData[i][0],
          eventId: guestsData[i][1],
          name: guestsData[i][2],
          phone: guestsData[i][3],
          email: guestsData[i][4],
          status: guestsData[i][5],
          origin: guestsData[i][6],
          createdAt: guestsData[i][7],
          updatedAt: guestsData[i][8]
        });
      }
    }
    
    return successResponse({ guests: guests });
    
  } catch (error) {
    return errorResponse('Erro ao listar convidados: ' + error.message);
  }
}

/**
 * Deleta convidado
 */
function deleteGuest(data) {
  try {
    const { spreadsheetId, guestId } = data;
    
    if (!spreadsheetId || !guestId) {
      return errorResponse('spreadsheetId e guestId são obrigatórios');
    }
    
    const ss = SpreadsheetApp.openById(spreadsheetId);
    const guestsSheet = ss.getSheetByName(CONFIG.SHEET_NAMES.CONVIDADOS);
    const guestsData = guestsSheet.getDataRange().getValues();
    
    for (let i = 1; i < guestsData.length; i++) {
      if (guestsData[i][0] === guestId) {
        guestsSheet.deleteRow(i + 1);
        return successResponse({ deleted: true });
      }
    }
    
    return errorResponse('Convidado não encontrado');
    
  } catch (error) {
    return errorResponse('Erro ao deletar convidado: ' + error.message);
  }
}

// ========================================
// GOOGLE FORMS (FORMULÁRIO POR EVENTO)
// ========================================

/**
 * Cria Google Form para um evento
 */
function createEventForm(data) {
  try {
    const { spreadsheetId, eventId, eventName, eventDate } = data;
    
    if (!spreadsheetId || !eventId || !eventName) {
      return errorResponse('Dados incompletos');
    }
    
    const ss = SpreadsheetApp.openById(spreadsheetId);
    
    // Cria formulário
    const form = FormApp.create(`Confirmação - ${eventName}`);
    const formId = form.getId();
    
    // Configurações
    form.setTitle(`🎉 ${eventName}`);
    form.setDescription(
      `Confirme sua presença!\n\n` +
      (eventDate ? `📅 Data: ${eventDate}\n` : '') +
      `\nPreencha os dados abaixo para confirmar.`
    );
    form.setCollectEmail(false);
    form.setLimitOneResponsePerUser(false);
    form.setShowLinkToRespondAgain(false);
    form.setConfirmationMessage('✅ Presença confirmada com sucesso! Obrigado!');
    
    // Campo oculto: EventID
    form.addTextItem()
      .setTitle('EventID')
      .setHelpText('(não altere)')
      .setRequired(false);
    form.getItems()[0].asTextItem().setGeneralFeedbackText(
      FormApp.createFeedback().setText(eventId).build()
    );
    
    // Campos visíveis
    form.addTextItem()
      .setTitle('Nome Completo')
      .setRequired(true);
    
    form.addTextItem()
      .setTitle('Telefone')
      .setHelpText('Exemplo: (21) 99999-9999')
      .setRequired(false);
    
    form.addTextItem()
      .setTitle('Email')
      .setRequired(false);
    
    form.addMultipleChoiceItem()
      .setTitle('Você vai comparecer?')
      .setChoiceValues(['✅ Sim, estarei presente', '❌ Não poderei comparecer'])
      .setRequired(true);
    
    // Define destino das respostas
    const formSheet = ss.insertSheet(`Form_${eventId.substr(0, 8)}`);
    form.setDestination(FormApp.DestinationType.SPREADSHEET, ss.getId());
    
    // URLs
    const formUrl = form.getPublishedUrl();
    const editUrl = form.getEditUrl();
    
    // Salva info do form
    const formsSheet = ss.getSheetByName(CONFIG.SHEET_NAMES.FORMS);
    formsSheet.appendRow([
      formId,
      eventId,
      formUrl,
      editUrl,
      new Date()
    ]);
    
    // Atualiza evento com URLs
    const eventsSheet = ss.getSheetByName(CONFIG.SHEET_NAMES.EVENTOS);
    const eventsData = eventsSheet.getDataRange().getValues();
    for (let i = 1; i < eventsData.length; i++) {
      if (eventsData[i][0] === eventId) {
        eventsSheet.getRange(i + 1, 6).setValue(formUrl);
        eventsSheet.getRange(i + 1, 7).setValue(formId);
        break;
      }
    }
    
    return successResponse({
      formId: formId,
      formUrl: formUrl,
      editUrl: editUrl,
      eventId: eventId
    });
    
  } catch (error) {
    return errorResponse('Erro ao criar formulário: ' + error.message);
  }
}

/**
 * Busca respostas do formulário
 */
function getFormResponses(data) {
  try {
    const { formId } = data;
    
    if (!formId) {
      return errorResponse('formId é obrigatório');
    }
    
    const form = FormApp.openById(formId);
    const responses = form.getResponses();
    
    const results = [];
    responses.forEach(response => {
      const itemResponses = response.getItemResponses();
      const data = {
        timestamp: response.getTimestamp(),
        responseId: response.getId()
      };
      
      itemResponses.forEach(item => {
        data[item.getItem().getTitle()] = item.getResponse();
      });
      
      results.push(data);
    });
    
    return successResponse({ responses: results });
    
  } catch (error) {
    return errorResponse('Erro ao buscar respostas: ' + error.message);
  }
}

/**
 * Sincroniza respostas do formulário com a lista de convidados
 */
function syncFormResponses(data) {
  try {
    const { spreadsheetId, eventId } = data;
    
    if (!spreadsheetId || !eventId) {
      return errorResponse('spreadsheetId e eventId são obrigatórios');
    }
    
    const ss = SpreadsheetApp.openById(spreadsheetId);
    
    // Busca FormID
    const formsSheet = ss.getSheetByName(CONFIG.SHEET_NAMES.FORMS);
    const formsData = formsSheet.getDataRange().getValues();
    let formId = null;
    
    for (let i = 1; i < formsData.length; i++) {
      if (formsData[i][1] === eventId) {
        formId = formsData[i][0];
        break;
      }
    }
    
    if (!formId) {
      return errorResponse('Formulário não encontrado para este evento');
    }
    
    // Busca respostas
    const form = FormApp.openById(formId);
    const responses = form.getResponses();
    
    const guestsSheet = ss.getSheetByName(CONFIG.SHEET_NAMES.CONVIDADOS);
    let syncedCount = 0;
    
    // Processa cada resposta
    responses.forEach(response => {
      const itemResponses = response.getItemResponses();
      const responseData = {};
      
      itemResponses.forEach(item => {
        responseData[item.getItem().getTitle()] = item.getResponse();
      });
      
      const name = responseData['Nome Completo'];
      const phone = responseData['Telefone'] || '';
      const email = responseData['Email'] || '';
      const statusText = responseData['Você vai comparecer?'];
      const status = statusText && statusText.includes('Sim') ? 'yes' : 'no';
      
      if (name) {
        // Verifica se já existe
        const guestsData = guestsSheet.getDataRange().getValues();
        let exists = false;
        
        for (let i = 1; i < guestsData.length; i++) {
          if (guestsData[i][1] === eventId && guestsData[i][2] === name) {
            // Atualiza existente
            guestsSheet.getRange(i + 1, 6).setValue(status);
            guestsSheet.getRange(i + 1, 9).setValue(new Date());
            exists = true;
            syncedCount++;
            break;
          }
        }
        
        if (!exists) {
          // Adiciona novo
          const guestId = generateId();
          guestsSheet.appendRow([
            guestId,
            eventId,
            name,
            phone,
            email,
            status,
            'form',
            new Date(),
            new Date()
          ]);
          
          logConfirmation(ss, eventId, guestId, name, status, 'form');
          syncedCount++;
        }
      }
    });
    
    return successResponse({
      synced: true,
      count: syncedCount,
      totalResponses: responses.length
    });
    
  } catch (error) {
    return errorResponse('Erro ao sincronizar: ' + error.message);
  }
}

// ========================================
// HELPERS
// ========================================

/**
 * Gera ID único
 */
function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
}

/**
 * Cria resposta de sucesso
 */
function successResponse(data) {
  return {
    success: true,
    data: data,
    timestamp: new Date().toISOString()
  };
}

/**
 * Cria resposta de erro
 */
function errorResponse(message) {
  return {
    success: false,
    error: message,
    timestamp: new Date().toISOString()
  };
}

/**
 * Cria resposta HTTP com CORS
 */
function createResponse(data) {
  const output = ContentService.createTextOutput(JSON.stringify(data));
  output.setMimeType(ContentService.MimeType.JSON);
  
  // CORS headers
  return output;
}

/**
 * Log de confirmação
 */
function logConfirmation(ss, eventId, guestId, name, status, origin) {
  try {
    const confirmSheet = ss.getSheetByName(CONFIG.SHEET_NAMES.CONFIRMACOES);
    confirmSheet.appendRow([
      new Date(),
      eventId,
      guestId,
      name,
      status,
      origin
    ]);
  } catch (e) {
    Logger.log('Erro ao logar confirmação: ' + e.message);
  }
}

/**
 * Log de requisição
 */
function logRequest(data) {
  Logger.log('Action: ' + data.action);
  Logger.log('Data: ' + JSON.stringify(data));
}

/**
 * Log de erro
 */
function logError(error) {
  Logger.log('ERRO: ' + error.message);
  Logger.log('Stack: ' + error.stack);
}

// ========================================
// TRIGGERS (OPCIONAL - AUTOMAÇÃO)
// ========================================

/**
 * Sincroniza automaticamente a cada X minutos
 * (Configurar trigger manual no Apps Script)
 */
function autoSyncAllForms() {
  // Busca todas as planilhas ativas
  // Sincroniza respostas de forms automaticamente
  // Implementar se necessário
}
