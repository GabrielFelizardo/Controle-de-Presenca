/**
 * SISTEMA DE LOGIN POR EMAIL
 * v3.1 - Planilha como banco de dados
 */

const AuthSystem = {
  /**
   * Inicializa sistema de autenticação
   */
  init() {
    // Verifica se já tem email salvo
    const savedEmail = this.getSavedEmail();
    
    if (savedEmail) {
      // Tem email salvo - tenta logar automaticamente
      this.autoLogin(savedEmail);
    } else {
      // Não tem - mostra modal de login
      this.showLoginModal();
    }
  },
  
  /**
   * Mostra modal de login
   */
  showLoginModal() {
    const modal = document.createElement('div');
    modal.id = 'login-modal';
    modal.className = 'modal';
    modal.style.display = 'flex';
    modal.style.zIndex = '10000';
    
    modal.innerHTML = `
      <div class="modal-content">
        <div class="modal-header">
          <h2 class="modal-title">📋 SISTEMA DE PRESENÇA</h2>
        </div>
        
        <div style="padding: var(--space-4); line-height: 1.8;">
          <p style="margin-bottom: var(--space-4); text-align: center;">
            Digite seu email para acessar seus eventos
          </p>
          
          <div class="form-group">
            <label class="label">EMAIL</label>
            <input 
              type="email" 
              class="input" 
              id="login-email" 
              placeholder="seu@email.com"
              style="font-size: 16px;"
            >
          </div>
          
          <div style="background: #f0f9ff; border: 2px solid #0284c7; padding: var(--space-3); border-radius: 4px; margin-top: var(--space-3);">
            <p style="margin: 0; font-size: 14px; color: #0c4a6e;">
              <strong>💡 Primeira vez?</strong><br>
              Criaremos sua planilha automaticamente no Google Drive!
            </p>
          </div>
          
          <div id="login-status" style="margin-top: var(--space-3); padding: var(--space-3); border-radius: 4px; display: none;">
            <p id="login-status-text" style="margin: 0;"></p>
          </div>
        </div>
        
        <div class="modal-actions">
          <button class="btn btn-success" onclick="AuthSystem.handleLogin()" style="grid-column: 1 / -1;">
            ACESSAR →
          </button>
        </div>
      </div>
    `;
    
    document.body.appendChild(modal);
    
    // Foco no input
    setTimeout(() => {
      document.getElementById('login-email').focus();
    }, 100);
    
    // Enter pra logar
    document.getElementById('login-email').addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        this.handleLogin();
      }
    });
  },
  
  /**
   * Processa login
   */
  async handleLogin() {
    const email = document.getElementById('login-email').value.trim();
    const statusDiv = document.getElementById('login-status');
    const statusText = document.getElementById('login-status-text');
    
    // Validação
    if (!email) {
      alert('Digite seu email');
      return;
    }
    
    if (!email.includes('@')) {
      alert('Digite um email válido');
      return;
    }
    
    // Mostra status
    statusDiv.style.display = 'block';
    statusDiv.style.background = '#fffbeb';
    statusDiv.style.border = '2px solid #f59e0b';
    statusText.innerHTML = '⏳ Verificando...';
    
    try {
      // Busca ou cria planilha
      const result = await API.getOrCreateSpreadsheet(email);
      
      if (!result.success) {
        throw new Error(result.error || 'Erro ao acessar planilha');
      }
      
      // Salva dados
      this.saveSession(email, result.spreadsheetId);
      
      // Feedback
      if (result.isNew) {
        statusDiv.style.background = '#d1fae5';
        statusDiv.style.border = '2px solid #10b981';
        statusText.innerHTML = `
          ✅ <strong>Planilha criada!</strong><br>
          Você pode acessá-la no Google Drive:<br>
          <a href="${result.spreadsheetUrl}" target="_blank" style="color: #059669;">
            ${result.spreadsheetUrl}
          </a>
        `;
      } else {
        statusDiv.style.background = '#d1fae5';
        statusDiv.style.border = '2px solid #10b981';
        statusText.innerHTML = '✅ <strong>Bem-vindo de volta!</strong><br>Carregando seus eventos...';
      }
      
      // Aguarda 2 segundos e carrega sistema
      setTimeout(() => {
        this.closeLoginModal();
        this.loadSystem();
      }, 2000);
      
    } catch (error) {
      console.error('Erro no login:', error);
      statusDiv.style.background = '#fee2e2';
      statusDiv.style.border = '2px solid #ef4444';
      statusText.innerHTML = `
        ❌ <strong>Erro ao acessar sistema</strong><br>
        ${error.message}<br><br>
        Tente novamente ou verifique sua conexão.
      `;
    }
  },
  
  /**
   * Login automático
   */
  async autoLogin(email) {
    console.log('🔐 Auto-login:', email);
    
    try {
      // Busca planilha
      const result = await API.getOrCreateSpreadsheet(email);
      
      if (result.success) {
        this.saveSession(email, result.spreadsheetId);
        this.loadSystem();
      } else {
        // Falhou - mostra modal
        this.showLoginModal();
      }
      
    } catch (error) {
      console.error('Erro no auto-login:', error);
      this.showLoginModal();
    }
  },
  
  /**
   * Carrega sistema com dados da planilha
   */
  async loadSystem() {
    console.log('📊 Carregando sistema...');
    
    try {
      // Carrega eventos da planilha
      const result = await API.getEvents();
      
      if (result.success && result.events) {
        // Limpa eventos locais
        State.events = [];
        
        // Adiciona eventos da planilha
        result.events.forEach(event => {
          State.events.push({
            id: event.id,
            name: event.name,
            guests: [], // Será carregado depois
            date: '',
            createdAt: new Date()
          });
        });
        
        // Salva estado
        Storage.save();
        
        // Renderiza UI
        if (typeof UI !== 'undefined' && UI.init) {
          UI.init();
        }
        
        // Carrega convidados do primeiro evento
        if (State.events.length > 0) {
          await this.loadEventGuests(State.events[0].id);
        }
        
        console.log('✅ Sistema carregado!');
      }
      
    } catch (error) {
      console.error('Erro ao carregar sistema:', error);
      alert('Erro ao carregar eventos. Tente recarregar a página.');
    }
  },
  
  /**
   * Carrega convidados de um evento
   */
  async loadEventGuests(eventId) {
    try {
      const result = await API.getGuests(eventId);
      
      if (result.success && result.guests) {
        const event = State.events.find(e => e.id === eventId);
        if (event) {
          event.guests = result.guests.map(g => ({
            id: g.id,
            name: g.name,
            phone: g.phone,
            email: g.email,
            status: g.status,
            notes: g.notes
          }));
          
          Storage.save();
          
          // Atualiza UI
          if (typeof UI !== 'undefined' && UI.renderEvent) {
            UI.renderEvent(eventId);
          }
        }
      }
      
    } catch (error) {
      console.error('Erro ao carregar convidados:', error);
    }
  },
  
  /**
   * Salva sessão
   */
  saveSession(email, spreadsheetId) {
    localStorage.setItem('userEmail', email);
    localStorage.setItem('spreadsheetId', spreadsheetId);
    
    // Atualiza config global
    if (typeof setSpreadsheetId === 'function') {
      setSpreadsheetId(spreadsheetId);
    }
    
    console.log('✅ Sessão salva:', email);
  },
  
  /**
   * Obtém email salvo
   */
  getSavedEmail() {
    return localStorage.getItem('userEmail');
  },
  
  /**
   * Logout
   */
  logout() {
    if (confirm('Deseja sair? Seus dados estão salvos na planilha.')) {
      localStorage.removeItem('userEmail');
      localStorage.removeItem('spreadsheetId');
      location.reload();
    }
  },
  
  /**
   * Trocar de conta
   */
  switchAccount() {
    if (confirm('Deseja trocar de conta?')) {
      localStorage.removeItem('userEmail');
      localStorage.removeItem('spreadsheetId');
      location.reload();
    }
  },
  
  /**
   * Fecha modal de login
   */
  closeLoginModal() {
    const modal = document.getElementById('login-modal');
    if (modal) {
      modal.remove();
    }
  },
  
  /**
   * Mostra email atual no header
   */
  showCurrentUser() {
    const email = this.getSavedEmail();
    if (!email) return;
    
    const header = document.querySelector('.header');
    if (!header) return;
    
    const userInfo = document.createElement('div');
    userInfo.style.cssText = `
      position: absolute;
      top: 10px;
      right: 20px;
      display: flex;
      align-items: center;
      gap: 10px;
      font-size: 13px;
      color: var(--gray-600);
    `;
    
    userInfo.innerHTML = `
      <span>👤 ${email}</span>
      <button 
        class="btn" 
        onclick="AuthSystem.switchAccount()"
        style="padding: 4px 12px; font-size: 12px;"
      >
        Trocar
      </button>
    `;
    
    header.style.position = 'relative';
    header.appendChild(userInfo);
  }
};

// Exporta
window.AuthSystem = AuthSystem;

console.log('🔐 Auth System v3.1 carregado');
