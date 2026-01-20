/**
 * SETUP VISUAL DA API
 * Interface para configurar Google Sheets sem usar console
 */

const APISetup = {
  /**
   * Mostra modal de configuração
   */
  showSetupModal() {
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.id = 'api-setup-modal';
    modal.style.display = 'flex';
    
    modal.innerHTML = `
      <div class="modal-content large">
        <div class="modal-header">
          <h2 class="modal-title">⚙️ CONFIGURAÇÃO INICIAL</h2>
        </div>
        
        <div style="padding: var(--space-4); line-height: 1.8;">
          <p style="margin-bottom: var(--space-4);">
            Configure a integração com Google Sheets para ter <strong>formulários online automáticos</strong> 
            e <strong>sincronização em tempo real</strong>.
          </p>
          
          <div class="form-group">
            <label class="label">1. SEUS DADOS</label>
            <input 
              type="text" 
              class="input" 
              id="setup-name" 
              placeholder="Seu nome"
              style="margin-bottom: var(--space-2);"
            >
            <input 
              type="email" 
              class="input" 
              id="setup-email" 
              placeholder="Seu email (Gmail)"
            >
          </div>
          
          <div class="form-group" style="margin-top: var(--space-4);">
            <label class="label">2. URL DA API DO GOOGLE SHEETS</label>
            <input 
              type="text" 
              class="input" 
              id="setup-api-url" 
              placeholder="https://script.google.com/macros/s/..."
              value="https://script.google.com/macros/s/AKfycbxsGjeJ_KnQIFlwKpZiCfA4YYGYucBcCbJWyyt8dBX-40YNOeK1O04oxeyDLwFZrwH4ig/exec"
            >
            <p style="font-size: 12px; color: var(--gray-600); margin-top: var(--space-2);">
              ℹ️ Você já tem a URL configurada! Se precisar alterar, cole aqui.
            </p>
          </div>
          
          <div id="setup-status" style="margin-top: var(--space-4); padding: var(--space-3); background: var(--gray-100); border-radius: 4px; display: none;">
            <p id="setup-status-text"></p>
          </div>
        </div>
        
        <div class="modal-actions">
          <button class="btn" onclick="APISetup.closeSetupModal()">
            PULAR (usar sem Sheets)
          </button>
          <button class="btn btn-success" onclick="APISetup.runSetup()">
            ✓ CONFIGURAR AGORA
          </button>
        </div>
      </div>
    `;
    
    document.body.appendChild(modal);
  },
  
  /**
   * Fecha modal
   */
  closeSetupModal() {
    const modal = document.getElementById('api-setup-modal');
    if (modal) {
      modal.remove();
    }
  },
  
  /**
   * Executa configuração
   */
  async runSetup() {
    const name = document.getElementById('setup-name').value.trim();
    const email = document.getElementById('setup-email').value.trim();
    const apiUrl = document.getElementById('setup-api-url').value.trim();
    
    const statusDiv = document.getElementById('setup-status');
    const statusText = document.getElementById('setup-status-text');
    
    // Validações
    if (!name) {
      alert('Digite seu nome');
      return;
    }
    
    if (!email) {
      alert('Digite seu email');
      return;
    }
    
    if (!apiUrl) {
      alert('Digite a URL da API');
      return;
    }
    
    // Mostra progresso
    statusDiv.style.display = 'block';
    statusText.innerHTML = '⏳ Configurando API...';
    
    try {
      // 1. Configura URL da API
      setApiUrl(apiUrl);
      statusText.innerHTML = '✓ API configurada<br>⏳ Criando sua planilha no Google Drive...';
      
      // 2. Cria cliente (planilha)
      await new Promise(resolve => setTimeout(resolve, 1000)); // Delay visual
      
      const result = await API.createClient(name, email, 'basic');
      
      statusText.innerHTML = '✓ API configurada<br>✓ Planilha criada<br>⏳ Finalizando...';
      
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Sucesso!
      statusDiv.style.background = '#d4edda';
      statusDiv.style.color = '#155724';
      statusText.innerHTML = `
        ✅ <strong>Configuração concluída!</strong><br><br>
        Sua planilha foi criada no Google Drive:<br>
        <strong>"Sistema Presença - ${name}"</strong><br><br>
        Agora você pode criar eventos com formulários automáticos!
      `;
      
      // Fecha após 3 segundos
      setTimeout(() => {
        this.closeSetupModal();
        
        // Recarrega interface
        if (typeof UI !== 'undefined' && UI.init) {
          UI.init();
        }
        
        // Mostra mensagem de sucesso
        alert('✅ Sistema configurado com sucesso!\n\nAgora seus eventos terão formulários online automáticos!');
        
      }, 3000);
      
    } catch (error) {
      console.error('Erro no setup:', error);
      statusDiv.style.background = '#f8d7da';
      statusDiv.style.color = '#721c24';
      statusText.innerHTML = `
        ❌ <strong>Erro na configuração</strong><br><br>
        ${error.message}<br><br>
        Tente novamente ou use o sistema sem integração com Sheets.
      `;
    }
  },
  
  /**
   * Verifica se precisa mostrar setup
   */
  checkAndShowSetup() {
    // Se já configurado, não mostra
    if (isApiConfigured()) {
      console.log('✅ API já configurada');
      return;
    }
    
    // Se tem URL mas não tem spreadsheet, tenta configurar
    const apiUrl = localStorage.getItem('apiUrl');
    if (apiUrl && !getSpreadsheetId()) {
      console.log('⚠️ API configurada mas sem planilha');
      // Não mostra modal automaticamente
      return;
    }
    
    // Não mostra automaticamente - deixa usuário decidir
    console.log('ℹ️ Sistema em modo local');
    console.log('Para habilitar Sheets: Menu Ferramentas → Configurar Google Sheets');
  },
  
  /**
   * Mostra modal de info sobre Sheets
   */
  showInfoModal() {
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.style.display = 'flex';
    
    modal.innerHTML = `
      <div class="modal-content">
        <div class="modal-header">
          <h2 class="modal-title">📊 GOOGLE SHEETS</h2>
        </div>
        
        <div style="padding: var(--space-4); line-height: 1.8;">
          <h3 style="margin-bottom: var(--space-3);">O que você ganha:</h3>
          
          <p style="margin-bottom: var(--space-2);">
            ✅ <strong>Formulário online automático</strong> para cada evento
          </p>
          <p style="margin-bottom: var(--space-2);">
            ✅ <strong>Link + QR Code</strong> para compartilhar no WhatsApp
          </p>
          <p style="margin-bottom: var(--space-2);">
            ✅ <strong>Confirmações automáticas</strong> - convidado preenche e atualiza sozinho
          </p>
          <p style="margin-bottom: var(--space-2);">
            ✅ <strong>Seus dados no Google Drive</strong> - pode abrir e ver quando quiser
          </p>
          <p style="margin-bottom: var(--space-2);">
            ✅ <strong>100% gratuito</strong> - R$ 0/mês para sempre
          </p>
          
          <div style="margin-top: var(--space-4); padding: var(--space-3); background: var(--gray-100); border-radius: 4px;">
            <p style="font-size: 14px; margin: 0;">
              💡 <strong>Importante:</strong> A configuração é feita uma única vez e leva menos de 1 minuto.
            </p>
          </div>
        </div>
        
        <div class="modal-actions">
          <button class="btn" onclick="this.closest('.modal').remove()">
            AGORA NÃO
          </button>
          <button class="btn btn-success" onclick="
            this.closest('.modal').remove();
            APISetup.showSetupModal();
          ">
            CONFIGURAR AGORA
          </button>
        </div>
      </div>
    `;
    
    document.body.appendChild(modal);
  }
};

// Exporta globalmente
window.APISetup = APISetup;

// Verifica no carregamento
document.addEventListener('DOMContentLoaded', () => {
  setTimeout(() => {
    APISetup.checkAndShowSetup();
  }, 1000);
});

console.log('⚙️ API Setup UI carregado');
