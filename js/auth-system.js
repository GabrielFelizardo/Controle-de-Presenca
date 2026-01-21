/**
 * AUTH SYSTEM v3.1.2
 * ✅ CORRIGIDO: Inicializa App após login
 */

const AuthSystem = {
  currentUser: null,
  isAuthenticated: false,
  spreadsheetId: null,
  
  init() {
    console.log('🔐 Auth System v3.1.2 iniciando...');
    
    try {
      this.loadSavedUser();
      this.attachLoginListeners();
      
      if (this.currentUser) {
        this.autoLogin();
      } else {
        this.showLoginScreen();
      }
    } catch (error) {
      console.error('❌ Erro ao inicializar auth:', error);
      this.showLoginScreen();
    }
  },
  
  loadSavedUser() {
    try {
      const saved = localStorage.getItem('auth_user');
      if (saved) {
        this.currentUser = JSON.parse(saved);
        console.log('👤 Usuário salvo:', this.currentUser.email);
      }
    } catch (error) {
      console.warn('⚠️ Erro ao carregar usuário:', error);
      localStorage.removeItem('auth_user');
    }
  },
  
  async autoLogin() {
    if (!this.currentUser || !this.currentUser.email) {
      this.showLoginScreen();
      return;
    }
    
    try {
      console.log('🔄 Auto-login:', this.currentUser.email);
      
      this.showLoading('Conectando...');
      
      const response = await API.getOrCreateSpreadsheet(this.currentUser.email);
      
      if (response.success) {
        this.isAuthenticated = true;
        this.spreadsheetId = response.data.spreadsheetId;
        
        // ✅ NOVO: Salva spreadsheetId no localStorage também
        localStorage.setItem('spreadsheetId', this.spreadsheetId);
        
        console.log('✅ Auto-login bem-sucedido');
        console.log('📊 SpreadsheetId:', this.spreadsheetId);
        
        this.hideLoginScreen();
        this.showMainApp();
      } else {
        throw new Error(response.error || 'Falha na validação');
      }
      
    } catch (error) {
      console.error('❌ Erro no auto-login:', error);
      this.logout(false);
      this.showLoginScreen();
      this.showError('Sessão expirada. Faça login novamente.');
    }
  },
  
  async login(email) {
    if (!email || !this.validateEmail(email)) {
      this.showError('Email inválido!');
      return false;
    }
    
    try {
      this.showLoading('Autenticando...');
      
      const response = await API.getOrCreateSpreadsheet(email);
      
      if (response.success) {
        this.currentUser = {
          email: email,
          name: email.split('@')[0],
          loginAt: new Date().toISOString()
        };
        
        this.isAuthenticated = true;
        this.spreadsheetId = response.data.spreadsheetId;
        
        // Salva no localStorage
        localStorage.setItem('auth_user', JSON.stringify(this.currentUser));
        localStorage.setItem('spreadsheetId', this.spreadsheetId);
        
        // ✅ NOVO: Adiciona email ao histórico
        this.addToEmailHistory(email);
        
        console.log('✅ Login bem-sucedido:', email);
        console.log('📊 SpreadsheetId:', this.spreadsheetId);
        console.log('📄 Planilha URL:', response.data.spreadsheetUrl);
        
        this.hideLoginScreen();
        this.showMainApp();
        
        return true;
        
      } else {
        throw new Error(response.error || 'Erro ao validar email');
      }
      
    } catch (error) {
      console.error('❌ Erro no login:', error);
      this.showError(error.message);
      return false;
    }
  },
  
  logout(showMessage = true) {
    try {
      this.currentUser = null;
      this.isAuthenticated = false;
      this.spreadsheetId = null;
      
      localStorage.removeItem('auth_user');
      localStorage.removeItem('spreadsheetId');
      
      // ✅ NOVO: Desativa SheetSync
      if (typeof SheetSync !== 'undefined') {
        SheetSync.disable();
      }
      
      this.showLoginScreen();
      this.hideMainApp();
      
      if (showMessage) {
        setTimeout(() => {
          const status = document.getElementById('login-status');
          if (status) {
            status.textContent = 'Logout realizado com sucesso';
            status.style.color = '#00cc44';
          }
        }, 100);
      }
      
      console.log('👋 Logout realizado');
      
    } catch (error) {
      console.error('❌ Erro no logout:', error);
    }
  },
  
  async switchAccount() {
    const confirmed = confirm('Deseja trocar de conta?\n\nVocê será desconectado.');
    
    if (confirmed) {
      this.logout(false);
      setTimeout(() => {
        const emailInput = document.getElementById('email-input');
        if (emailInput) emailInput.focus();
      }, 500);
    }
  },
  
  // ✅ NOVO: Histórico de emails
  addToEmailHistory(email) {
    try {
      let history = JSON.parse(localStorage.getItem('email_history') || '[]');
      
      // Remove duplicatas
      history = history.filter(e => e !== email);
      
      // Adiciona no início
      history.unshift(email);
      
      // Limita a 5
      history = history.slice(0, 5);
      
      localStorage.setItem('email_history', JSON.stringify(history));
    } catch (error) {
      console.warn('⚠️ Erro ao salvar histórico de emails:', error);
    }
  },
  
  getEmailHistory() {
    try {
      return JSON.parse(localStorage.getItem('email_history') || '[]');
    } catch (error) {
      return [];
    }
  },
  
  // UI METHODS
  
  showLoginScreen() {
    const loginScreen = document.getElementById('login-screen');
    if (loginScreen) {
      loginScreen.classList.add('active');
      
      // ✅ NOVO: Adiciona datalist com histórico
      setTimeout(() => {
        this.addEmailDatalist();
        const emailInput = document.getElementById('email-input');
        if (emailInput) emailInput.focus();
      }, 300);
    }
  },
  
  // ✅ NOVO: Adiciona datalist com histórico de emails
  addEmailDatalist() {
    const emailInput = document.getElementById('email-input');
    if (!emailInput) return;
    
    const history = this.getEmailHistory();
    if (history.length === 0) return;
    
    // Remove datalist anterior se existir
    const oldDatalist = document.getElementById('email-history-datalist');
    if (oldDatalist) oldDatalist.remove();
    
    // Cria novo datalist
    const datalist = document.createElement('datalist');
    datalist.id = 'email-history-datalist';
    
    history.forEach(email => {
      const option = document.createElement('option');
      option.value = email;
      datalist.appendChild(option);
    });
    
    emailInput.setAttribute('list', 'email-history-datalist');
    emailInput.parentElement.appendChild(datalist);
    
    console.log('📧 Histórico de emails:', history);
  },
  
  hideLoginScreen() {
    const loginScreen = document.getElementById('login-screen');
    if (loginScreen) {
      loginScreen.classList.remove('active');
    }
  },
  
  showMainApp() {
    const mainApp = document.getElementById('main-app');
    if (mainApp) {
      mainApp.style.display = 'block';
    }
    
    this.updateUserInfo();
    
    // ✅ CORRIGIDO: Inicializa app DEPOIS de mostrar interface
    if (typeof App !== 'undefined' && App.init) {
      setTimeout(() => {
        console.log('🚀 Inicializando App após login...');
        App.init();
      }, 100);
    }
  },
  
  hideMainApp() {
    const mainApp = document.getElementById('main-app');
    if (mainApp) {
      mainApp.style.display = 'none';
    }
  },
  
  updateUserInfo() {
    if (!this.currentUser) return;
    
    const userInfoDisplay = document.getElementById('user-info-display');
    const userAvatar = document.getElementById('user-avatar');
    const userName = document.getElementById('user-name');
    const userEmail = document.getElementById('user-email');
    
    if (userInfoDisplay) userInfoDisplay.classList.add('active');
    if (userName) userName.textContent = this.currentUser.name || 'Usuário';
    if (userEmail) userEmail.textContent = this.currentUser.email;
    if (userAvatar) {
      const initial = (this.currentUser.name || this.currentUser.email || 'U').charAt(0).toUpperCase();
      userAvatar.textContent = initial;
    }
  },
  
  showLoading(message = 'Carregando...') {
    const loginForm = document.getElementById('login-form');
    const loginBtn = document.getElementById('btn-login');
    const statusEl = document.getElementById('login-status');
    
    if (loginForm) {
      loginForm.style.opacity = '0.6';
      loginForm.style.pointerEvents = 'none';
    }
    
    if (loginBtn) {
      loginBtn.classList.add('loading');
      loginBtn.innerHTML = message + ' <span class="spinner"></span>';
    }
    
    if (statusEl) {
      statusEl.textContent = '';
      statusEl.className = '';
    }
  },
  
  showError(message) {
    const loginForm = document.getElementById('login-form');
    const loginBtn = document.getElementById('btn-login');
    const statusEl = document.getElementById('login-status');
    
    if (loginForm) {
      loginForm.style.opacity = '1';
      loginForm.style.pointerEvents = 'auto';
    }
    
    if (loginBtn) {
      loginBtn.classList.remove('loading');
      loginBtn.textContent = 'ACESSAR SISTEMA';
    }
    
    if (statusEl) {
      statusEl.textContent = message;
      statusEl.className = 'error';
    }
    
    setTimeout(() => {
      if (statusEl) {
        statusEl.textContent = '';
        statusEl.className = '';
      }
    }, 5000);
  },
  
  attachLoginListeners() {
    const loginBtn = document.getElementById('btn-login');
    if (loginBtn) {
      loginBtn.addEventListener('click', () => this.handleLoginClick());
    }
    
    const emailInput = document.getElementById('email-input');
    if (emailInput) {
      emailInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
          this.handleLoginClick();
        }
      });
    }
  },
  
  async handleLoginClick() {
    const emailInput = document.getElementById('email-input');
    if (!emailInput) return;
    
    const email = emailInput.value.trim();
    await this.login(email);
  },
  
  validateEmail(email) {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email);
  },
  
  get authenticated() {
    return this.isAuthenticated && this.currentUser !== null;
  },
  
  get userEmail() {
    return this.currentUser?.email || null;
  },
  
  get userName() {
    return this.currentUser?.name || null;
  }
};

window.AuthSystem = AuthSystem;
console.log('🔐 Auth System v3.1.2 carregado');
