/**
 * QR-SYNC.JS
 * Sincronização via QR Code entre dispositivos
 */

const QRSync = {
    /**
     * Gera QR Code com dados comprimidos
     */
    async generateQRCode() {
        const data = State.exportState();
        
        // Comprime dados (LZ-String)
        const compressed = LZString.compressToEncodedURIComponent(
            JSON.stringify(data)
        );
        
        // Calcula tamanho
        const sizeKB = new Blob([compressed]).size / 1024;
        
        // Verifica se não está muito grande
        if (sizeKB > 2048) { // 2MB limit
            alert(
                '❌ Dados muito grandes para QR Code!\n\n' +
                `Tamanho: ${sizeKB.toFixed(0)}KB\n` +
                'Limite: 2048KB\n\n' +
                'Use "Exportar Arquivo" ao invés.'
            );
            return;
        }
        
        // Gera URL
        const url = `${window.location.origin}${window.location.pathname}?sync=${compressed}`;
        
        // Modal com QR Code
        const modal = document.createElement('div');
        modal.className = 'modal active';
        modal.id = 'qr-modal';
        modal.innerHTML = `
            <div class="modal-content" style="text-align: center;">
                <div class="modal-header">
                    <h2 class="modal-title">📱 SINCRONIZAR VIA QR CODE</h2>
                </div>
                
                <div style="background: var(--gray-100); padding: var(--space-4); margin-bottom: var(--space-3); border-radius: 8px;">
                    <div id="qrcode-container" style="display: flex; justify-content: center; margin-bottom: var(--space-2);"></div>
                    <div class="label">TAMANHO: ${sizeKB.toFixed(1)}KB</div>
                </div>
                
                <div class="tutorial-steps" style="text-align: left;">
                    <div class="tutorial-step">
                        <div class="step-number">1</div>
                        <div class="step-content">
                            <h3>Abra a câmera do celular</h3>
                            <p class="body-text-small">iPhone ou Android, tanto faz</p>
                        </div>
                    </div>
                    
                    <div class="tutorial-step">
                        <div class="step-number">2</div>
                        <div class="step-content">
                            <h3>Aponte para o QR Code</h3>
                            <p class="body-text-small">Uma notificação vai aparecer</p>
                        </div>
                    </div>
                    
                    <div class="tutorial-step">
                        <div class="step-number">3</div>
                        <div class="step-content">
                            <h3>Clique na notificação</h3>
                            <p class="body-text-small">O site vai abrir com seus dados!</p>
                        </div>
                    </div>
                </div>
                
                <div class="help-note" style="margin-top: var(--space-4);">
                    <p><strong>💡 ATENÇÃO:</strong></p>
                    <p class="body-text-small">
                        O QR Code contém TODOS os seus dados.
                        Não compartilhe screenshot dele com outras pessoas!
                    </p>
                </div>
                
                <button class="btn btn-primary" data-action="close" style="width: 100%; margin-top: var(--space-3);">
                    FECHAR
                </button>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        // Gera QR Code (biblioteca QRCode.js)
        try {
            new QRCode(document.getElementById('qrcode-container'), {
                text: url,
                width: 280,
                height: 280,
                colorDark: '#000000',
                colorLight: '#ffffff',
                correctLevel: QRCode.CorrectLevel.M
            });
        } catch (error) {
            console.error('Erro ao gerar QR Code:', error);
            alert('Erro ao gerar QR Code. Verifique se a biblioteca está carregada.');
            modal.remove();
            return;
        }
        
        modal.querySelector('[data-action="close"]').addEventListener('click', () => {
            modal.remove();
        });
    },
    
    /**
     * Verifica se há dados de QR Code na URL
     */
    checkForQRSync() {
        const params = new URLSearchParams(window.location.search);
        const syncData = params.get('sync');
        
        if (syncData) {
            try {
                // Descomprime
                const json = LZString.decompressFromEncodedURIComponent(syncData);
                const data = JSON.parse(json);
                
                // Valida
                if (!data.events || !Array.isArray(data.events)) {
                    throw new Error('Dados inválidos');
                }
                
                // Mostra preview
                this.showQRSyncPreview(data);
                
                // Limpa URL
                window.history.replaceState({}, '', window.location.pathname);
                
            } catch (error) {
                console.error('QR sync error:', error);
                alert('❌ Erro ao carregar dados do QR Code');
            }
        }
    },
    
    /**
     * Preview antes de importar
     */
    showQRSyncPreview(data) {
        const modal = document.createElement('div');
        modal.className = 'modal active';
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h2 class="modal-title">📱 DADOS RECEBIDOS VIA QR!</h2>
                </div>
                
                <div style="text-align: center; margin: var(--space-4) 0;">
                    <div style="font-size: 64px; margin-bottom: var(--space-2);">✅</div>
                    <p>Você escaneou um QR Code com:</p>
                </div>
                
                <div style="padding: var(--space-3); background: var(--gray-100); border: 2px solid var(--gray-900); margin-bottom: var(--space-3);">
                    <h3 style="margin-bottom: var(--space-2);">EVENTOS ENCONTRADOS:</h3>
                    ${data.events.map(e => `
                        <div style="padding: var(--space-2); background: white; margin-bottom: var(--space-1); border-left: 3px solid var(--accent-success);">
                            <strong>${e.name}</strong>
                            <div class="body-text-small">${e.guests.length} convidados</div>
                        </div>
                    `).join('')}
                </div>
                
                ${State.events.length > 0 ? `
                    <div style="padding: var(--space-3); background: #fff3cd; border-left: 4px solid #ffb700; margin-bottom: var(--space-3);">
                        <strong>⚠️ VOCÊ TEM ${State.events.length} EVENTO(S) AQUI</strong>
                        <p class="body-text-small">Escolha como importar:</p>
                    </div>
                ` : ''}
                
                <div style="display: grid; gap: var(--space-2);">
                    <button class="btn btn-primary" data-import-mode="replace">
                        🔄 SUBSTITUIR TUDO
                    </button>
                    
                    <button class="btn btn-success" data-import-mode="merge">
                        ➕ JUNTAR COM OS ATUAIS
                    </button>
                    
                    <button class="btn" data-action="cancel">
                        CANCELAR
                    </button>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        // Replace
        modal.querySelector('[data-import-mode="replace"]').addEventListener('click', () => {
            State.importState(data);
            Storage.save();
            modal.remove();
            location.reload();
        });
        
        // Merge
        modal.querySelector('[data-import-mode="merge"]').addEventListener('click', () => {
            const existingIds = new Set(State.events.map(e => e.id));
            const newEvents = data.events.filter(e => !existingIds.has(e.id));
            State.events.push(...newEvents);
            Storage.save();
            modal.remove();
            location.reload();
        });
        
        // Cancel
        modal.querySelector('[data-action="cancel"]').addEventListener('click', () => {
            modal.remove();
        });
    }
};

// Exporta globalmente
window.QRSync = QRSync;
