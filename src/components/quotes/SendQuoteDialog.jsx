import React, { useState, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { MessageCircle, Mail, Edit2, Send } from 'lucide-react';
import { jsPDF } from 'jspdf';

export default function SendQuoteDialog({ quote, client, representative, onClose }) {
  if (!quote || !client) return null;

  const [channel, setChannel] = useState(null);
  const [editableMessage, setEditableMessage] = useState('');
  const [editableSubject, setEditableSubject] = useState('');

  // Lógica inteligente: decidir se mostra valor no email
  const shouldShowValueInEmail = useMemo(() => {
    // Mostrar valor se cliente for recorrente (tem histórico)
    if (client.purchase_count > 0) return true;
    
    // Esconder se cliente novo ou sem histórico
    if (!client.last_purchase_value) return false;
    
    // Esconder se ticket for muito maior que média histórica
    if (client.average_ticket && quote.total_value > client.average_ticket * 1.5) return false;
    
    return true;
  }, [client, quote]);

  // Gerar mensagens automáticas
  const generateMessage = (type) => {
    const contactName = client.contact_name || client.trade_name?.split(' ')[0] || 'Cliente';
    const companyName = representative?.name || 'Nossa empresa';
    const value = (quote.total_value || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 });

    if (type === 'whatsapp') {
      return `Oi ${contactName}, tudo bem?

Te enviei o orçamento ${quote.quote_number}, no valor total de R$ ${value}, conforme combinamos.

Material será fornecido pela *${quote.principal_name || 'nossa representada'}*, referência no mercado.

O PDF vai anexado pra você conferir os detalhes.

Qualquer dúvida ou se quiser ajustar algo, me chama por aqui 👍`;
    }

    if (type === 'email_with_value') {
      return `Prezado ${contactName},

Conforme alinhado, segue em anexo o orçamento ${quote.quote_number}, no valor de R$ ${value}, com as condições comerciais para sua análise.

Material será fornecido pela <strong>${quote.principal_name || 'nossa representada'}</strong>, referência no mercado.

Caso queira ajustar algum ponto ou alinhar os próximos passos, você prefere que conversemos por e-mail ou posso te ligar rapidamente?

Atenciosamente,
${companyName}`;
    }

    if (type === 'email_without_value') {
      return `Prezado ${contactName},

Segue em anexo o orçamento ${quote.quote_number}, preparado conforme sua solicitação e as condições alinhadas.

Material será fornecido pela <strong>${quote.principal_name || 'nossa representada'}</strong>, referência no mercado.

Quando puder analisar, consegue me confirmar se está tudo ok ou se prefere que a gente alinhe algum ponto antes de avançarmos?

Atenciosamente,
${companyName}`;
    }
  };

  const generateSubject = () => {
    if (shouldShowValueInEmail) {
      return `Orçamento ${quote.quote_number} | Condições comerciais`;
    }
    return `Proposta comercial ${quote.quote_number}`;
  };

  const handleSelectWhatsApp = () => {
    setChannel('whatsapp');
    setEditableMessage(generateMessage('whatsapp'));
  };

  const handleSelectEmail = () => {
    setChannel('email');
    const messageType = shouldShowValueInEmail ? 'email_with_value' : 'email_without_value';
    setEditableMessage(generateMessage(messageType));
    setEditableSubject(generateSubject());
  };

  const handleSendWhatsApp = () => {
    const phone = client.whatsapp || client.phone || '';
    const cleanPhone = phone.replace(/\D/g, '');
    const whatsappUrl = `https://wa.me/55${cleanPhone}?text=${encodeURIComponent(editableMessage)}`;
    window.open(whatsappUrl, '_blank');
    onClose();
  };

  const handleSendEmail = async () => {
    try {
      // Generate PDF first
      const pdfBlob = await generateQuotePDF();
      
      // Download PDF automatically
      const url = URL.createObjectURL(pdfBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Orcamento_${quote.quote_number || 'SEM_NUMERO'}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      // Small delay to ensure download starts
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Open Outlook with email pre-filled
      const email = client.email || '';
      const mailtoUrl = `mailto:${email}?subject=${encodeURIComponent(editableSubject)}&body=${encodeURIComponent(editableMessage)}`;
      window.location.href = mailtoUrl;
      
      onClose();
    } catch (error) {
      console.error('Error:', error);
      // Fallback: just open email
      const email = client.email || '';
      const mailtoUrl = `mailto:${email}?subject=${encodeURIComponent(editableSubject)}&body=${encodeURIComponent(editableMessage)}`;
      window.location.href = mailtoUrl;
      onClose();
    }
  };

  const generateQuotePDF = async () => {
    return new Promise((resolve, reject) => {
      try {
        const doc = new jsPDF();
        const pageWidth = doc.internal.pageSize.getWidth();
        const pageHeight = doc.internal.pageSize.getHeight();
        const margin = 10;
        let y = 10;

        // Border
        doc.setDrawColor(0, 0, 0);
        doc.setLineWidth(1);
        doc.rect(5, 5, pageWidth - 10, pageHeight - 10);

        // Header
        y = 8;
        doc.setLineWidth(0.5);
        doc.rect(margin, y, 75, 42);

        if (quote.principal_logo_url) {
          try {
            doc.addImage(quote.principal_logo_url, 'PNG', margin + 3, y + 3, 30, 12);
          } catch (e) {}
        }

        doc.setTextColor(0, 0, 0);
        doc.setFontSize(8);
        doc.setFont('helvetica', 'bold');
        const principalLines = doc.splitTextToSize(quote.principal_name || '', 70);
        doc.text(principalLines, margin + 3, y + (quote.principal_logo_url ? 18 : 8));

        doc.setFontSize(7);
        doc.setFont('helvetica', 'normal');
        let textY = y + (quote.principal_logo_url ? 23 : 13);
        if (quote.principal_cnpj) {
          doc.text(`CNPJ: ${quote.principal_cnpj}`, margin + 3, textY);
          textY += 3.5;
        }
        if (quote.principal_phone) {
          doc.text(`Fone: ${quote.principal_phone}`, margin + 3, textY);
        }

        doc.rect(margin + 78, y, 75, 42);
        doc.setFillColor(230, 230, 230);
        doc.rect(margin + 78, y, 75, 6, 'F');
        doc.setDrawColor(0, 0, 0);
        doc.line(margin + 78, y + 6, margin + 153, y + 6);
        doc.setTextColor(0, 0, 0);
        doc.setFontSize(8);
        doc.setFont('helvetica', 'bold');
        doc.text('Representante Comercial', margin + 115.5, y + 4, { align: 'center' });

        if (representative) {
          let repY = y + 11;
          doc.setFontSize(8);
          doc.setFont('helvetica', 'bold');
          const repNameLines = doc.splitTextToSize(representative.name || '', 70);
          doc.text(repNameLines, margin + 80, repY);
          repY += repNameLines.length * 4;

          doc.setFontSize(7);
          doc.setFont('helvetica', 'normal');
          if (representative.document) {
            doc.text(`CNPJ/CPF: ${representative.document}`, margin + 80, repY);
            repY += 3.5;
          }
          if (representative.phone) {
            doc.text(`Telefone: ${representative.phone}`, margin + 80, repY);
            repY += 3.5;
          }
          if (representative.email) {
            doc.text(`E-mail: ${representative.email}`, margin + 80, repY);
          }
        }

        doc.setFillColor(255, 255, 255);
        doc.rect(margin + 156, y, 44, 42, 'FD');
        doc.setTextColor(0, 0, 0);
        doc.setFontSize(9);
        doc.setFont('helvetica', 'bold');
        doc.text('ORÇAMENTO', margin + 178, y + 8, { align: 'center' });
        doc.setFontSize(9);
        doc.text(`Nº. ${quote.quote_number || ''}`, margin + 178, y + 16, { align: 'center' });
        doc.setFontSize(7);
        doc.setFont('helvetica', 'normal');
        const date = new Date(quote.created_date || new Date()).toLocaleDateString('pt-BR');
        doc.text(date, margin + 178, y + 22, { align: 'center' });

        y += 45;

        // Cliente
        doc.setLineWidth(0.5);
        doc.rect(margin, y, pageWidth - 2 * margin, 20);
        doc.setFillColor(230, 230, 230);
        doc.rect(margin, y, pageWidth - 2 * margin, 6, 'F');
        doc.setDrawColor(0, 0, 0);
        doc.line(margin, y + 6, pageWidth - margin, y + 6);
        doc.setTextColor(0, 0, 0);
        doc.setFontSize(9);
        doc.setFont('helvetica', 'bold');
        doc.text('Cliente', margin + (pageWidth - 2 * margin) / 2, y + 4, { align: 'center' });

        y += 8;
        doc.setFontSize(7);
        doc.setFont('helvetica', 'bold');
        doc.text(`Cliente: `, margin + 3, y + 3);
        doc.setFont('helvetica', 'normal');
        doc.text(quote.client_name || '', margin + 18, y + 3);

        y += 4;
        doc.setFont('helvetica', 'bold');
        doc.text(`Endereço: `, margin + 3, y + 3);
        doc.setFont('helvetica', 'normal');
        doc.text(`${quote.client_address || ''} - ${quote.client_city || ''}/${quote.client_state || ''}`, margin + 22, y + 3);

        y += 4;
        doc.setFont('helvetica', 'bold');
        doc.text(`CNPJ: `, margin + 3, y + 3);
        doc.setFont('helvetica', 'normal');
        doc.text(quote.client_cnpj || '', margin + 15, y + 3);

        y += 7;

        // Items header
        doc.setLineWidth(0.5);
        doc.rect(margin, y, pageWidth - 2 * margin, 6);
        doc.setFillColor(230, 230, 230);
        doc.rect(margin, y, pageWidth - 2 * margin, 6, 'F');
        doc.setDrawColor(0, 0, 0);
        doc.line(margin, y + 6, pageWidth - margin, y + 6);
        doc.setTextColor(0, 0, 0);
        doc.setFontSize(9);
        doc.setFont('helvetica', 'bold');
        doc.text('Itens', margin + (pageWidth - 2 * margin) / 2, y + 4, { align: 'center' });

        y += 6;

        // Table Header
        doc.setFillColor(240, 240, 240);
        doc.rect(margin, y, pageWidth - 2 * margin, 7, 'F');
        doc.setDrawColor(0, 0, 0);
        doc.setLineWidth(0.5);
        doc.line(margin, y + 7, pageWidth - margin, y + 7);

        doc.setTextColor(0, 0, 0);
        doc.setFontSize(7);
        doc.setFont('helvetica', 'bold');

        const colX = [margin + 1, margin + 10, margin + 23, margin + 35, margin + 100, margin + 120, margin + 135, margin + 150, margin + 170, margin + 185];

        doc.text('Item', colX[0], y + 4.5);
        doc.text('Qtde', colX[1], y + 4.5);
        doc.text('Unid', colX[2], y + 4.5);
        doc.text('Produto', colX[3], y + 4.5);
        doc.text('NCM', colX[4], y + 4.5);
        doc.text('Preço Unit', colX[5], y + 4.5);
        doc.text('ICMS', colX[6], y + 4.5);
        doc.text('IPI', colX[7], y + 4.5);
        doc.text('Valor Total', colX[8], y + 4.5);
        doc.text('Entrega*', colX[9], y + 4.5);

        y += 7;

        // Items
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(7);

        quote.items?.forEach((item, index) => {
          if (y > 240) {
            doc.addPage();
            y = 20;
          }

          const rowHeight = 12;
          const formatCurrency = (value) => {
            return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 2 }).format(value || 0);
          };

          doc.text(String(index + 1), colX[0] + 2, y + 5);
          doc.text(item.quantity.toFixed(3), colX[1] + 1, y + 5);
          doc.text(item.unit.toUpperCase(), colX[2] + 1, y + 5);

          const productName = `${item.product_code} - ${item.product_name}`;
          const productLines = doc.splitTextToSize(productName, 63);
          doc.text(productLines[0], colX[3] + 1, y + 5);

          doc.text(item.ncm || '', colX[4] + 1, y + 5);
          doc.text(formatCurrency(item.price_per_kg), colX[5] + 1, y + 5);
          doc.text(item.icms_rate.toFixed(2), colX[6] + 1, y + 5);
          doc.text(item.ipi_rate.toFixed(2), colX[7] + 1, y + 5);
          doc.text(formatCurrency(item.item_total), colX[8] + 1, y + 5);
          doc.text(item.delivery_days > 0 ? `${item.delivery_days}` : '-', colX[9] + 2, y + 5);

          doc.setDrawColor(200, 200, 200);
          doc.setLineWidth(0.2);
          doc.line(margin, y + rowHeight, pageWidth - margin, y + rowHeight);

          y += rowHeight;
        });

        // Totals
        y += 3;
        const totalBoxX = pageWidth - 75;
        doc.setLineWidth(0.5);
        doc.rect(totalBoxX, y, 65, 32);

        const formatCurrency = (value) => {
          return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 2 }).format(value || 0);
        };

        doc.setFontSize(8);
        doc.setTextColor(0, 0, 0);
        doc.setFont('helvetica', 'bold');

        doc.text('Valor Total Produtos:', totalBoxX + 2, y + 6);
        doc.text(formatCurrency(quote.products_subtotal), pageWidth - 12, y + 6, { align: 'right' });

        doc.text('Valor ICMS ST:', totalBoxX + 2, y + 12);
        doc.text(formatCurrency(0), pageWidth - 12, y + 12, { align: 'right' });

        doc.text('Valor Total do IPI:', totalBoxX + 2, y + 18);
        doc.text(formatCurrency(quote.total_ipi), pageWidth - 12, y + 18, { align: 'right' });

        doc.setLineWidth(0.3);
        doc.line(totalBoxX, y + 21, totalBoxX + 65, y + 21);

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(9);
        doc.text('Valor Total da Proposta:', totalBoxX + 2, y + 27);
        doc.text(formatCurrency(quote.total_value), pageWidth - 12, y + 27, { align: 'right' });

        // Return as blob
        const pdfBlob = doc.output('blob');
        resolve(pdfBlob);
      } catch (error) {
        reject(error);
      }
    });
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Enviar Orçamento {quote.quote_number}</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="bg-slate-50 rounded-lg p-4">
            <p className="text-sm text-slate-600 mb-1">Cliente</p>
            <p className="font-semibold">{client.trade_name || client.company_name}</p>
            {client.contact_name && (
              <p className="text-sm text-slate-500">Contato: {client.contact_name}</p>
            )}
            <p className="text-sm text-slate-500 mt-1">Valor: R$ {(quote.total_value || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
          </div>

          {!channel ? (
            <>
              <div className="space-y-3">
                <Button
                  onClick={handleSelectWhatsApp}
                  disabled={!client.whatsapp && !client.phone}
                  className="w-full bg-green-600 hover:bg-green-700"
                >
                  <MessageCircle className="w-4 h-4 mr-2" />
                  Enviar via WhatsApp
                  {(client.whatsapp || client.phone) && (
                    <span className="ml-2 text-xs">({client.whatsapp || client.phone})</span>
                  )}
                </Button>

                <Button
                  onClick={handleSelectEmail}
                  disabled={!client.email}
                  variant="outline"
                  className="w-full"
                >
                  <Mail className="w-4 h-4 mr-2" />
                  Enviar via Email
                  {client.email && (
                    <span className="ml-2 text-xs">({client.email})</span>
                  )}
                </Button>
              </div>

              {!client.whatsapp && !client.phone && (
                <p className="text-xs text-amber-600">⚠️ Cliente sem WhatsApp/Telefone cadastrado</p>
              )}
              {!client.email && (
                <p className="text-xs text-amber-600">⚠️ Cliente sem email cadastrado</p>
              )}
            </>
          ) : (
            <>
              {channel === 'whatsapp' && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                  <div className="flex items-center gap-2 text-sm text-green-800 mb-2">
                    <MessageCircle className="w-4 h-4" />
                    <span className="font-semibold">WhatsApp - Mensagem gerada automaticamente</span>
                  </div>
                  <p className="text-xs text-green-700">💬 Tom informal, valor incluído, chamada para ação</p>
                </div>
              )}

              {channel === 'email' && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                  <div className="flex items-center gap-2 text-sm text-blue-800 mb-2">
                    <Mail className="w-4 h-4" />
                    <span className="font-semibold">E-mail - Mensagem gerada automaticamente</span>
                  </div>
                  {shouldShowValueInEmail ? (
                    <p className="text-xs text-blue-700">✉️ Cliente recorrente: valor incluído no corpo</p>
                  ) : (
                    <p className="text-xs text-blue-700">✉️ Cliente novo/alto ticket: valor no PDF anexo</p>
                  )}
                </div>
              )}

              {channel === 'email' && (
                <div className="space-y-2">
                  <Label>Assunto</Label>
                  <Textarea
                    value={editableSubject}
                    onChange={(e) => setEditableSubject(e.target.value)}
                    rows={1}
                    className="resize-none"
                  />
                </div>
              )}

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>Mensagem {channel === 'whatsapp' ? '(WhatsApp)' : '(E-mail)'}</Label>
                  <span className="text-xs text-slate-500 flex items-center gap-1">
                    <Edit2 className="w-3 h-3" />
                    Editável
                  </span>
                </div>
                <Textarea
                  value={editableMessage}
                  onChange={(e) => setEditableMessage(e.target.value)}
                  rows={channel === 'whatsapp' ? 8 : 10}
                  className="font-mono text-sm"
                />
              </div>

              <div className="flex gap-3">
                <Button
                  onClick={() => setChannel(null)}
                  variant="outline"
                  className="flex-1"
                >
                  Voltar
                </Button>
                <Button
                  onClick={channel === 'whatsapp' ? handleSendWhatsApp : handleSendEmail}
                  className={channel === 'whatsapp' ? 'flex-1 bg-green-600 hover:bg-green-700' : 'flex-1 bg-blue-600 hover:bg-blue-700'}
                >
                  <Send className="w-4 h-4 mr-2" />
                  Enviar {channel === 'whatsapp' ? 'WhatsApp' : 'E-mail'}
                </Button>
              </div>

              {channel === 'email' && (
                <p className="text-xs text-emerald-600 bg-emerald-50 border border-emerald-200 rounded p-2">
                  ✅ O PDF será baixado automaticamente ao enviar. Anexe-o no Outlook!
                </p>
              )}
              {channel === 'whatsapp' && (
                <p className="text-xs text-amber-600 bg-amber-50 border border-amber-200 rounded p-2">
                  📎 Lembre-se de anexar o PDF do orçamento ao enviar!
                </p>
              )}
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}