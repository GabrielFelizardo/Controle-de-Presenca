/**
 * CONFIGURAÇÃO DA API v3.0
 * Google Apps Script + Sheets
 */

const API_CONFIG = {
  API_URL: 'https://script.google.com/macros/s/AKfycbyVVle9p5SFCsbBrQF95JgL14WE5Ecguo9Po6E3gq17yVaHzZ-Vl8J_TX3SHOHdaDZc/exec',
  API_URL: localStorage.getItem('apiUrl') || '',
  
  // ID da planilha do cliente (será preenchido automaticamente)
  SPREADSHEET_ID: localStorage.getItem('spreadsheetId') || null,
  
  // Configurações de sincronização
  SYNC_INTERVAL: 10000, // 10 segundos
  ENABLE_AUTO_SYNC: true,
  
  // Modo de operação
  USE_SHEETS: false, // Muda para true quando configurar API
  
  // Versão
  VERSION: '3.0'
};

/**
 * Salva URL da API
 */
function setApiUrl(url) {
  localStorage.setItem('apiUrl', url);
  API_CONFIG.API_URL = url;
  API_CONFIG.USE_SHEETS = true;
  console.log('✅ API URL configurada:', url);
}

/**
 * Salva spreadsheetId
 */
function setSpreadsheetId(id) {
  localStorage.setItem('spreadsheetId', id);
  API_CONFIG.SPREADSHEET_ID = id;
  console.log('✅ Spreadsheet ID configurado:', id);
}

/**
 * Obtém spreadsheetId
 */
function getSpreadsheetId() {
  return API_CONFIG.SPREADSHEET_ID;
}

/**
 * Obtém URL da API
 */
function getApiUrl() {
  return API_CONFIG.API_URL;
}

/**
 * Verifica se API está configurada
 */
function isApiConfigured() {
  return !!(API_CONFIG.API_URL && API_CONFIG.SPREADSHEET_ID);
}

/**
 * Limpa configuração (útil para testes)
 */
function clearApiConfig() {
  localStorage.removeItem('apiUrl');
  localStorage.removeItem('spreadsheetId');
  API_CONFIG.API_URL = '';
  API_CONFIG.SPREADSHEET_ID = null;
  API_CONFIG.USE_SHEETS = false;
  console.log('✅ Configuração da API limpa');
}

// Log inicial
console.log('📊 API Config v' + API_CONFIG.VERSION);
if (isApiConfigured()) {
  console.log('✅ API configurada e pronta');
  console.log('  - Spreadsheet:', API_CONFIG.SPREADSHEET_ID);
} else {
  console.log('⚠️ API não configurada - usando modo local');
  console.log('  Execute: setupApi("sua-url-do-apps-script")');
}

/**
 * Setup inicial (chamar uma vez)
 */
function setupApi(apiUrl) {
  if (!apiUrl) {
    console.error('❌ Forneça a URL do Apps Script');
    console.log('Exemplo: setupApi("https://script.google.com/macros/s/ABC123/exec")');
    return;
  }
  
  setApiUrl(apiUrl);
  console.log('✅ API configurada!');
  console.log('Próximo passo: criar cliente com API.createClient("Nome", "email@example.com")');
}

// Exporta para window
window.API_CONFIG = API_CONFIG;
window.setApiUrl = setApiUrl;
window.setSpreadsheetId = setSpreadsheetId;
window.getSpreadsheetId = getSpreadsheetId;
window.getApiUrl = getApiUrl;
window.isApiConfigured = isApiConfigured;
window.clearApiConfig = clearApiConfig;
window.setupApi = setupApi;
