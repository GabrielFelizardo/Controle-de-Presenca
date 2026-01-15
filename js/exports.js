/**
 * EXPORTS.JS
 * Funções de exportação (PDF, TXT, CSV)
 */

const Exports = {
    /**
     * Exporta evento como PDF
     * @param {number} eventId - ID do evento
     */
    exportPDF(eventId) {
        const event = State.getEventById(eventId);
        if (!event || event.guests.length === 0) {
            alert('Sem dados para exportar!');
            return;
        }

        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();

        // Cabeçalho preto
        doc.setFillColor(0, 0, 0);
        doc.rect(0, 0, 210, 35, 'F');
        
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(28);
        doc.setFont(undefined, 'bold');
        doc.text(event.name.toUpperCase(), 20, 20);
        
        doc.setFontSize(11);
        doc.setFont(undefined, 'normal');
        const dateText = event.date 
            ? `Data do Evento: ${Utils.formatDateBR(event.date)}` 
            : 'Sistema de Controle de Presença';
        doc.text(dateText, 20, 28);

        // Estatísticas
        const stats = State.calculateStats(eventId);
        const percentage = stats.total > 0 
            ? Utils.calculatePercentage(stats.yes, stats.total) 
            : 0;
        
        let y = 45;
        doc.setTextColor(0, 0, 0);
        doc.setFontSize(14);
        doc.setFont(undefined, 'bold');
        doc.text('ESTATÍSTICAS', 20, y);
        
        y += 8;
        doc.setFontSize(10);
        doc.setFont(undefined, 'normal');
        doc.setDrawColor(200, 200, 200);
        doc.setLineWidth(0.5);
        
        // Cards de estatísticas
        doc.setFillColor(245, 245, 245);
        doc.roundedRect(20, y - 3, 40, 12, 2, 2, 'FD');
        doc.text(`Total: ${stats.total}`, 25, y + 4);
        
        doc.setFillColor(0, 204, 68, 25);
        doc.roundedRect(65, y - 3, 40, 12, 2, 2, 'FD');
        doc.setTextColor(0, 150, 50);
        doc.text(`✓ Sim: ${stats.yes}`, 70, y + 4);
        
        doc.setFillColor(255, 51, 51, 25);
        doc.roundedRect(110, y - 3, 40, 12, 2, 2, 'FD');
        doc.setTextColor(200, 0, 0);
        doc.text(`✗ Não: ${stats.no}`, 115, y + 4);
        
        doc.setFillColor(245, 245, 245);
        doc.roundedRect(155, y - 3, 40, 12, 2, 2, 'FD');
        doc.setTextColor(100, 100, 100);
        doc.text(`⏳ Pend: ${stats.pending}`, 160, y + 4);
        
        // Barra de progresso
        y += 18;
        doc.setTextColor(0, 0, 0);
        doc.setFontSize(9);
        doc.text(`Taxa de Confirmação: ${percentage}%`, 20, y);
        
        y += 3;
        doc.setDrawColor(200, 200, 200);
        doc.setLineWidth(1);
        doc.rect(20, y, 170, 5);
        
        if (percentage > 0) {
            doc.setFillColor(0, 204, 68);
            doc.rect(20, y, (170 * percentage / 100), 5, 'F');
        }

        // Título da tabela
        y += 12;
        doc.setFontSize(14);
        doc.setFont(undefined, 'bold');
        doc.text('LISTA DE CONVIDADOS', 20, y);
        y += 5;

        // Preparar dados da tabela
        const tableHeaders = ['#', 'Status', ...event.columns];
        const tableData = event.guests.map((guest, idx) => {
            const statusIcon = guest.status === 'yes' ? '✓' : 
                              guest.status === 'no' ? '✗' : '⏳';
            const statusText = guest.status === 'yes' ? 'Confirmado' : 
                              guest.status === 'no' ? 'Não vem' : 'Pendente';
            
            return [
                (idx + 1).toString(),
                `${statusIcon} ${statusText}`,
                ...event.columns.map(col => guest[col] || '-')
            ];
        });

        // Renderizar tabela
        if (typeof doc.autoTable === 'function') {
            doc.autoTable({
                head: [tableHeaders],
                body: tableData,
                startY: y,
                margin: { left: 20, right: 20 },
                styles: {
                    fontSize: 9,
                    cellPadding: 3,
                    lineColor: [200, 200, 200],
                    lineWidth: 0.1
                },
                headStyles: {
                    fillColor: [0, 0, 0],
                    textColor: [255, 255, 255],
                    fontStyle: 'bold',
                    halign: 'center'
                },
                columnStyles: {
                    0: { cellWidth: 10, halign: 'center' },
                    1: { cellWidth: 25 }
                },
                didParseCell: function(data) {
                    if (data.column.index === 1 && data.section === 'body') {
                        const text = data.cell.text[0];
                        if (text.includes('✓')) {
                            data.cell.styles.textColor = [0, 150, 50];
                        } else if (text.includes('✗')) {
                            data.cell.styles.textColor = [200, 0, 0];
                        } else {
                            data.cell.styles.textColor = [100, 100, 100];
                        }
                    }
                },
                alternateRowStyles: {
                    fillColor: [250, 250, 250]
                }
            });
        }

        // Rodapé em todas as páginas
        const pageCount = doc.internal.getNumberOfPages();
        for (let i = 1; i <= pageCount; i++) {
            doc.setPage(i);
            
            doc.setDrawColor(200, 200, 200);
            doc.setLineWidth(0.5);
            doc.line(20, 285, 190, 285);
            
            doc.setFontSize(8);
            doc.setTextColor(100, 100, 100);
            doc.text(`Gerado em: ${new Date().toLocaleString('pt-BR')}`, 20, 290);
            doc.text(`Página ${i} de ${pageCount}`, 170, 290);
        }

        // Salvar
        const filename = `${Utils.sanitizeFilename(event.name)}_Lista_Presenca.pdf`;
        doc.save(filename);
        
        Utils.log('PDF exportado', filename);
    },

    /**
     * Exporta evento como TXT
     * @param {number} eventId - ID do evento
     */
    exportTXT(eventId) {
        try {
            const content = Storage.exportToTXT(eventId);
            const event = State.getEventById(eventId);
            
            const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
            const filename = `${Utils.sanitizeFilename(event.name)}_Lista.txt`;
            
            Utils.downloadBlob(blob, filename);
            Utils.log('TXT exportado', filename);
            
        } catch (error) {
            alert('Erro ao exportar TXT: ' + error.message);
        }
    },

    /**
     * Exporta evento como CSV
     * @param {number} eventId - ID do evento
     */
    exportCSV(eventId) {
        try {
            const csv = Storage.exportToCSV(eventId);
            const event = State.getEventById(eventId);
            
            const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
            const filename = `${Utils.sanitizeFilename(event.name)}_Lista.csv`;
            
            Utils.downloadBlob(blob, filename);
            Utils.log('CSV exportado', filename);
            
        } catch (error) {
            alert('Erro ao exportar CSV: ' + error.message);
        }
    },

    /**
     * Exporta estatísticas detalhadas como JSON
     * @param {number} eventId - ID do evento
     */
    exportStatsJSON(eventId) {
        const event = State.getEventById(eventId);
        if (!event) return;

        const stats = State.calculateStats(eventId);
        
        const data = {
            evento: event.name,
            data: event.date ? Utils.formatDateBR(event.date) : null,
            estatisticas: {
                total: stats.total,
                confirmados: stats.yes,
                recusas: stats.no,
                pendentes: stats.pending,
                taxaConfirmacao: `${Utils.calculatePercentage(stats.yes, stats.total)}%`
            },
            convidados: event.guests.map(g => ({
                ...g,
                statusTexto: g.status === 'yes' ? 'Confirmado' : 
                            g.status === 'no' ? 'Não vem' : 'Pendente'
            })),
            geradoEm: new Date().toISOString()
        };

        const json = JSON.stringify(data, null, 2);
        const blob = new Blob([json], { type: 'application/json' });
        const filename = `${Utils.sanitizeFilename(event.name)}_Estatisticas.json`;
        
        Utils.downloadBlob(blob, filename);
        Utils.log('JSON exportado', filename);
    },

    /**
     * Exporta todos os eventos como um único arquivo
     */
    exportAllEvents() {
        if (State.events.length === 0) {
            alert('Nenhum evento para exportar!');
            return;
        }

        const data = {
            versao: '2.1',
            exportadoEm: new Date().toISOString(),
            totalEventos: State.events.length,
            eventos: State.events.map(event => ({
                nome: event.name,
                data: event.date,
                colunas: event.columns,
                totalConvidados: event.guests.length,
                estatisticas: State.calculateStats(event.id),
                convidados: event.guests
            }))
        };

        const json = JSON.stringify(data, null, 2);
        const blob = new Blob([json], { type: 'application/json' });
        const filename = `Todos_Eventos_${new Date().toISOString().split('T')[0]}.json`;
        
        Utils.downloadBlob(blob, filename);
        Utils.log('Todos os eventos exportados', filename);
    },

    /**
     * Prepara dados para impressão
     * @param {number} eventId - ID do evento
     */
    preparePrint(eventId) {
        const event = State.getEventById(eventId);
        if (!event) return;

        // Oculta elementos não imprimíveis temporariamente
        const hideElements = document.querySelectorAll(
            '.menu-bar, .tabs-wrapper, .action-bar, .btn, .search-input, .guest-actions, .footer-actions'
        );
        
        hideElements.forEach(el => el.style.display = 'none');

        // Imprime
        window.print();

        // Restaura elementos
        setTimeout(() => {
            hideElements.forEach(el => el.style.display = '');
        }, 100);
    },

    /**
     * Copia dados como tabela markdown
     * @param {number} eventId - ID do evento
     */
    async copyAsMarkdown(eventId) {
        const event = State.getEventById(eventId);
        if (!event || event.guests.length === 0) {
            alert('Sem dados para copiar!');
            return;
        }

        let markdown = `# ${event.name}\n\n`;
        
        if (event.date) {
            markdown += `**Data:** ${Utils.formatDateBR(event.date)}\n\n`;
        }

        const stats = State.calculateStats(eventId);
        markdown += `**Estatísticas:** Total: ${stats.total} | Confirmados: ${stats.yes} | Recusas: ${stats.no} | Pendentes: ${stats.pending}\n\n`;

        // Cabeçalho da tabela
        markdown += `| # | Status | ${event.columns.join(' | ')} |\n`;
        markdown += `|---|--------|${event.columns.map(() => '---').join('|')}|\n`;

        // Dados
        event.guests.forEach((guest, idx) => {
            const status = guest.status === 'yes' ? '✓' : 
                          guest.status === 'no' ? '✗' : '⏳';
            const row = [
                idx + 1,
                status,
                ...event.columns.map(col => guest[col] || '-')
            ];
            markdown += `| ${row.join(' | ')} |\n`;
        });

        const success = await Utils.copyToClipboard(markdown);
        if (success) {
            alert('✓ Tabela copiada como Markdown!');
        } else {
            alert('❌ Erro ao copiar para clipboard');
        }
    },

    /**
     * Gera relatório HTML para visualização
     * @param {number} eventId - ID do evento
     * @returns {string} HTML do relatório
     */
    generateHTMLReport(eventId) {
        const event = State.getEventById(eventId);
        if (!event) return '';

        const stats = State.calculateStats(eventId);
        const percentage = Utils.calculatePercentage(stats.yes, stats.total);

        let html = `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <title>${event.name} - Relatório</title>
    <style>
        body { font-family: Inter, Arial, sans-serif; padding: 40px; background: #f5f5f5; }
        .container { max-width: 1200px; margin: 0 auto; background: white; padding: 40px; }
        h1 { font-size: 32px; font-weight: 900; text-transform: uppercase; margin-bottom: 10px; }
        .stats { display: grid; grid-template-columns: repeat(4, 1fr); gap: 20px; margin: 30px 0; }
        .stat-card { padding: 20px; border: 2px solid #000; text-align: center; }
        .stat-value { font-size: 48px; font-weight: 900; margin: 10px 0; }
        table { width: 100%; border-collapse: collapse; margin-top: 30px; }
        th, td { padding: 12px; text-align: left; border-bottom: 1px solid #ddd; }
        th { background: #000; color: white; font-weight: bold; }
        tr:nth-child(even) { background: #f9f9f9; }
        .status-yes { color: #00cc44; font-weight: bold; }
        .status-no { color: #ff3333; font-weight: bold; }
        .status-pending { color: #999; }
    </style>
</head>
<body>
    <div class="container">
        <h1>${event.name}</h1>
        ${event.date ? `<p><strong>Data:</strong> ${Utils.formatDateBR(event.date)}</p>` : ''}
        
        <div class="stats">
            <div class="stat-card">
                <div>TOTAL</div>
                <div class="stat-value">${stats.total}</div>
            </div>
            <div class="stat-card">
                <div>CONFIRMADOS</div>
                <div class="stat-value status-yes">${stats.yes}</div>
                <div>${percentage}%</div>
            </div>
            <div class="stat-card">
                <div>RECUSAS</div>
                <div class="stat-value status-no">${stats.no}</div>
            </div>
            <div class="stat-card">
                <div>PENDENTES</div>
                <div class="stat-value status-pending">${stats.pending}</div>
            </div>
        </div>

        <table>
            <thead>
                <tr>
                    <th>#</th>
                    <th>Status</th>
                    ${event.columns.map(col => `<th>${col}</th>`).join('')}
                </tr>
            </thead>
            <tbody>
                ${event.guests.map((guest, idx) => {
                    const statusClass = guest.status === 'yes' ? 'status-yes' : 
                                       guest.status === 'no' ? 'status-no' : 'status-pending';
                    const statusText = guest.status === 'yes' ? '✓ Confirmado' : 
                                      guest.status === 'no' ? '✗ Não vem' : '⏳ Pendente';
                    
                    return `
                        <tr>
                            <td>${idx + 1}</td>
                            <td class="${statusClass}">${statusText}</td>
                            ${event.columns.map(col => `<td>${Utils.escapeHTML(guest[col] || '-')}</td>`).join('')}
                        </tr>
                    `;
                }).join('')}
            </tbody>
        </table>

        <p style="margin-top: 40px; color: #666; font-size: 12px;">
            Gerado em ${new Date().toLocaleString('pt-BR')} pelo Sistema de Controle de Presença
        </p>
    </div>
</body>
</html>
        `;

        return html;
    }
};

// Exporta globalmente
window.Exports = Exports;
