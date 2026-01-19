/**
 * SHEETS UI - INDICADORES VISUAIS
 * Mostra pro usuário que existe integração com Sheets
 */

const SheetsUI = {
  /**
   * Mostra banner de boas-vindas (primeira vez)
   */
  showWelcomeBanner() {
    // Só mostra se nunca viu antes
    if (localStorage.getItem('welcomeBannerSeen')) {
      return;
    }
    
    const banner = document.createElement('div');
    banner.id = 'welcome-banner';
    banner.style.cssText = `
      position: fixed;
      top: 20px;
      left: 50%;
      transform: translateX(-50%);
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 20px 30px;
      border-radius: 12px;
      box-shadow: 0 10px 40px rgba(0,0,0,0.3);
      z-index: 10000;
      max-width: 500px;
      animation: slideDown 0.5s ease-out;
    `;
    
    banner.innerHTML = `
      <div style="text-align: center;">
        <div style="font-size: 40px; margin-bottom: 10px;">🎉</div>
        <h3 style="margin: 0 0 10px 0; font-size: 20px;">BEM-VINDO À VERSÃO 3.0!</h3>
        <p style="margin: 0 0 15px 0; line-height: 1.6; font-size: 14px;">
          Agora você pode criar <strong>formulários online automáticos</strong> 
          e receber confirmações em tempo real!
        </p>
        <div style="display: grid; gap: 8px; text-align: left; font-size: 13px; margin-bottom: 20px;">
          <div>✅ Link para compartilhar no WhatsApp</div>
          <div>✅ Confirmações atualizam automaticamente</div>
          <div>✅ Seus dados salvos no Google Drive</div>
          <div>✅ 100% gratuito</div>
        </div>
        <div style="display: flex; gap: 10px; justify-content: center;">
          <button onclick="SheetsUI.closeWelcomeBanner()" style="
            background: rgba(255,255,255,0.2);
            border: 1px solid white;
            color: white;
            padding: 10px 20px;
            border-radius: 6px;
            cursor: pointer;
            font-size: 14px;
          ">
            Depois
          </button>
          <button onclick="SheetsUI.closeWelcomeBanner(); APISetup.showSetupModal();" style="
            background: white;
            border: none;
            color: #667eea;
            padding: 10px 20px;
            border-radius: 6px;
            cursor: pointer;
            font-weight: bold;
            font-size: 14px;
          ">
            Configurar Agora →
          </button>
        </div>
      </div>
    `;
    
    // Adiciona animação
    const style = document.createElement('style');
    style.textContent = `
      @keyframes slideDown {
        from {
          opacity: 0;
          transform: translateX(-50%) translateY(-20px);
        }
        to {
          opacity: 1;
          transform: translateX(-50%) translateY(0);
        }
      }
    `;
    document.head.appendChild(style);
    
    document.body.appendChild(banner);
    
    // Remove após 15 segundos se não clicar
    setTimeout(() => {
      if (document.getElementById('welcome-banner')) {
        this.closeWelcomeBanner();
      }
    }, 15000);
  },
  
  /**
   * Fecha banner de boas-vindas
   */
  closeWelcomeBanner() {
    const banner = document.getElementById('welcome-banner');
    if (banner) {
      banner.style.animation = 'slideUp 0.3s ease-out';
      setTimeout(() => banner.remove(), 300);
    }
    localStorage.setItem('welcomeBannerSeen', 'true');
  },
  
  /**
   * Adiciona card informativo no evento
   */
  addInfoCard() {
    // Só mostra se não configurou Sheets ainda
    if (isApiConfigured()) {
      return null;
    }
    
    const card = document.createElement('div');
    card.className = 'sheets-info-card';
    card.style.cssText = `
      background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
      border: 2px solid var(--black);
      padding: var(--space-3);
      margin-bottom: var(--space-3);
      border-radius: 4px;
      display: flex;
      align-items: center;
      gap: var(--space-3);
    `;
    
    card.innerHTML = `
      <div style="font-size: 32px;">💡</div>
      <div style="flex: 1;">
        <strong style="display: block; margin-bottom: 4px;">
          Configure formulários online
        </strong>
        <p style="margin: 0; font-size: 13px; color: var(--gray-700);">
          Crie um link para seus convidados confirmarem presença automaticamente!
        </p>
      </div>
      <button 
        class="btn btn-primary" 
        onclick="APISetup.showSetupModal()"
        style="white-space: nowrap;"
      >
        Configurar →
      </button>
    `;
    
    return card;
  },
  
  /**
   * Adiciona botão de formulário na aba
   */
  addFormButtonToTab(tab, eventId) {
    // Verifica se já tem
    if (tab.querySelector('.tab-form-btn')) {
      return;
    }
    
    const btn = document.createElement('span');
    btn.className = 'tab-form-btn';
    btn.textContent = '📋';
    btn.title = 'Formulário Online';
    btn.style.cssText = `
      margin-left: 6px;
      cursor: pointer;
      opacity: 0.6;
      transition: opacity 0.2s;
      font-size: 14px;
    `;
    
    btn.addEventListener('mouseover', () => btn.style.opacity = '1');
    btn.addEventListener('mouseout', () => btn.style.opacity = '0.6');
    
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      this.handleFormButtonClick(eventId);
    });
    
    // Adiciona antes do X
    const closeBtn = tab.querySelector('.tab-close');
    if (closeBtn) {
      tab.insertBefore(btn, closeBtn);
    }
  },
  
  /**
   * Trata clique no botão de formulário
   */
  handleFormButtonClick(eventId) {
    if (!isApiConfigured()) {
      // Se não configurou, mostra modal explicativo
      this.showNeedsSetupModal();
    } else {
      // Se já configurou, abre formulário
      this.showFormModal(eventId);
    }
  },
  
  /**
   * Modal explicando que precisa configurar
   */
  showNeedsSetupModal() {
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.style.display = 'flex';
    
    modal.innerHTML = `
      <div class="modal-content">
        <div class="modal-header">
          <h2 class="modal-title">📋 FORMULÁRIOS ONLINE</h2>
        </div>
        
        <div style="padding: var(--space-4); line-height: 1.8;">
          <p style="margin-bottom: var(--space-3);">
            Para usar formulários online, você precisa configurar a integração 
            com Google Sheets. É rápido (1 minuto) e <strong>totalmente grátis</strong>!
          </p>
          
          <div style="background: var(--gray-100); padding: var(--space-3); border-radius: 4px; margin-bottom: var(--space-3);">
            <p style="margin: 0 0 var(--space-2) 0;"><strong>O que você ganha:</strong></p>
            <div style="display: grid; gap: var(--space-1); font-size: 14px;">
              <div>✅ Link de confirmação automático</div>
              <div>✅ QR Code para compartilhar</div>
              <div>✅ Convidados confirmam sozinhos</div>
              <div>✅ Lista atualiza em tempo real</div>
              <div>✅ Dados salvos no Google Drive</div>
            </div>
          </div>
          
          <p style="font-size: 13px; color: var(--gray-600); margin: 0;">
            💡 A configuração é feita apenas uma vez.
          </p>
        </div>
        
        <div class="modal-actions">
          <button class="btn" onclick="this.closest('.modal').remove()">
            Agora Não
          </button>
          <button class="btn btn-success" onclick="
            this.closest('.modal').remove();
            APISetup.showSetupModal();
          ">
            Configurar Agora →
          </button>
        </div>
      </div>
    `;
    
    document.body.appendChild(modal);
  },
  
  /**
   * Modal com formulário (quando já configurado)
   */
  async showFormModal(eventId) {
    const event = State.events.find(e => e.id === eventId);
    if (!event) return;
    
    // Verifica se já tem formUrl
    if (!event.formUrl && event.sheetsEventId) {
      // Criar formulário
      try {
        const form = await API.createEventForm(
          event.sheetsEventId,
          event.name,
          event.date || ''
        );
        event.formUrl = form.formUrl;
        event.formId = form.formId;
        Storage.save();
      } catch (error) {
        alert('Erro ao criar formulário. Tente novamente.');
        console.error(error);
        return;
      }
    }
    
    if (!event.formUrl) {
      alert('Este evento ainda não tem formulário.\n\nCrie um novo evento para ter formulário automático.');
      return;
    }
    
    // Mostra modal com link
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.style.display = 'flex';
    
    modal.innerHTML = `
      <div class="modal-content">
        <div class="modal-header">
          <h2 class="modal-title">📋 FORMULÁRIO - ${event.name}</h2>
        </div>
        
        <div style="padding: var(--space-4);">
          <div class="form-group">
            <label class="label">🔗 LINK DO FORMULÁRIO</label>
            <div style="display: flex; gap: var(--space-2);">
              <input 
                type="text" 
                class="input" 
                value="${event.formUrl}" 
                readonly
                id="form-url-input"
                style="flex: 1;"
              >
              <button class="btn btn-primary" onclick="
                document.getElementById('form-url-input').select();
                document.execCommand('copy');
                this.textContent = '✓ COPIADO';
                setTimeout(() => this.textContent = 'COPIAR', 2000);
              ">
                COPIAR
              </button>
            </div>
          </div>
          
          <div class="form-group" style="margin-top: var(--space-4);">
            <label class="label">📱 COMPARTILHAR</label>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: var(--space-2);">
              <button class="btn btn-success" onclick="
                const url = '${event.formUrl}';
                const msg = 'Confirme sua presença: ${event.name}\\n\\n' + url;
                window.open('https://wa.me/?text=' + encodeURIComponent(msg));
              ">
                WhatsApp
              </button>
              
              <button class="btn" onclick="
                const url = '${event.formUrl}';
                const subject = 'Confirmação - ${event.name}';
                const body = 'Confirme sua presença acessando:\\n\\n' + url;
                window.open('mailto:?subject=' + encodeURIComponent(subject) + '&body=' + encodeURIComponent(body));
              ">
                Email
              </button>
            </div>
          </div>
        </div>
        
        <div class="modal-actions">
          <button class="btn" onclick="this.closest('.modal').remove()">
            FECHAR
          </button>
          <button class="btn btn-primary" onclick="window.open('${event.formUrl}', '_blank')">
            👁️ VER FORMULÁRIO
          </button>
        </div>
      </div>
    `;
    
    document.body.appendChild(modal);
  },
  
  /**
   * Inicializa UI do Sheets
   */
  init() {
    // Mostra banner de boas-vindas (primeira vez)
    setTimeout(() => {
      this.showWelcomeBanner();
    }, 2000);
    
    console.log('📊 Sheets UI inicializado');
  }
};

// Exporta
window.SheetsUI = SheetsUI;

// Inicializa quando DOM carregar
document.addEventListener('DOMContentLoaded', () => {
  SheetsUI.init();
});

console.log('📊 Sheets UI carregado');
