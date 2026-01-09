import React from 'react';
import { Button } from '@/components/ui/button';
import { FileDown, Loader2 } from 'lucide-react';
import { jsPDF } from 'jspdf';
import { toast } from 'sonner';

export default function QuotePDFExport({ quote, representative }) {
  const [isGenerating, setIsGenerating] = React.useState(false);

  const generatePDF = async () => {
    setIsGenerating(true);
    
    try {
        const doc = new jsPDF();
        const pageWidth = doc.internal.pageSize.getWidth();
        const pageHeight = doc.internal.pageSize.getHeight();
        const margin = 10;
        let y = 10;

        // Borda externa da página
        doc.setDrawColor(0, 0, 0);
        doc.setLineWidth(1);
        doc.rect(5, 5, pageWidth - 10, pageHeight - 10);

        // Header com 3 boxes
        y = 8;

        // Box 1: Representado (esquerda)
        doc.setLineWidth(0.5);
        doc.rect(margin, y, 75, 42);

        // Logo do Representado
        if (quote.principal_logo_url) {
          try {
            doc.addImage(quote.principal_logo_url, 'PNG', margin + 3, y + 3, 30, 12);
          } catch (e) {
            console.log('Could not add principal logo');
          }
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

        // Box 2: Representante Comercial (centro)
        doc.rect(margin + 78, y, 75, 42);

        // Header
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

        // Box 3: Número do Orçamento (direita)
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

      // Itens
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

        doc.text(String(index + 1), colX[0] + 2, y + 5);
        doc.text(item.quantity.toFixed(3), colX[1] + 1, y + 5);
        doc.text(item.unit.toUpperCase(), colX[2] + 1, y + 5);

        const productName = `${item.product_code} - ${item.product_name}`;
        const productLines = doc.splitTextToSize(productName, 63);
        doc.text(productLines[0], colX[3] + 1, y + 5);
        if (item.description && productLines.length === 1) {
          doc.setFontSize(6);
          doc.text(item.description.substring(0, 40), colX[3] + 1, y + 8);
          doc.setFontSize(7);
        }

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

      // Totais
      y += 3;
      const totalBoxX = pageWidth - 75;
      doc.setLineWidth(0.5);
      doc.rect(totalBoxX, y, 65, 32);

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

      // Footer - Condições Gerais e Observações
      y += 35;

      // Boxes lado a lado
      const boxWidth = (pageWidth - 2 * margin - 3) / 2;

      // Condições Gerais
      doc.setLineWidth(0.5);
      doc.rect(margin, y, boxWidth, 35);
      doc.setFillColor(230, 230, 230);
      doc.rect(margin, y, boxWidth, 6, 'F');
      doc.line(margin, y + 6, margin + boxWidth, y + 6);

      doc.setTextColor(0, 0, 0);
      doc.setFontSize(9);
      doc.setFont('helvetica', 'bold');
      doc.text('Condições Gerais', margin + boxWidth / 2, y + 4, { align: 'center' });

      doc.setFontSize(7);
      doc.setFont('helvetica', 'normal');
      let condY = y + 10;
      const validityDate = new Date();
      validityDate.setDate(validityDate.getDate() + (quote.validity_days || 7));
      doc.text(`Data de Validade: ${validityDate.toLocaleDateString('pt-BR')}`, margin + 2, condY);
      condY += 3.5;
      if (quote.payment_terms) {
        doc.text(`Condição de Pagamento: ${quote.payment_terms}`, margin + 2, condY);
        condY += 3.5;
      }
      doc.text(`Finalidade da Venda: Industrialização`, margin + 2, condY);
      condY += 3.5;
      doc.text(`Contribuinte: SIM`, margin + 2, condY);
      condY += 3.5;
      doc.text(`Modalidade do Frete: ${quote.freight_type || 'FOB'}`, margin + 2, condY);
      condY += 3.5;
      if (quote.client_address) {
        const addressLines = doc.splitTextToSize(`Local de Entrega: ${quote.client_address}, ${quote.client_city}/${quote.client_state}`, boxWidth - 4);
        doc.text(addressLines, margin + 2, condY);
      }

      // Observações
      doc.rect(margin + boxWidth + 3, y, boxWidth, 35);
      doc.setFillColor(230, 230, 230);
      doc.rect(margin + boxWidth + 3, y, boxWidth, 6, 'F');
      doc.line(margin + boxWidth + 3, y + 6, margin + 2 * boxWidth + 3, y + 6);

      doc.setFontSize(9);
      doc.setFont('helvetica', 'bold');
      doc.text('Observações', margin + boxWidth + 3 + boxWidth / 2, y + 4, { align: 'center' });

      doc.setFontSize(7);
      doc.setFont('helvetica', 'normal');
      let obsY = y + 10;
      const obsText = [
        'Prazo de Entrega contados em Dias Úteis após',
        'aprovação do Orçamento.',
        'Descarga dos materiais por conta do cliente.',
        'Liberação de faturamento mediante a análise e',
        'aprovação do setor de crédito. Análise é feita somente',
        'após confirmação do pedido.'
      ];
      obsText.forEach(line => {
        doc.text(line, margin + boxWidth + 5, obsY);
        obsY += 3.5;
      });

      if (quote.notes) {
        obsY += 2;
        const notesLines = doc.splitTextToSize(quote.notes, boxWidth - 4);
        doc.text(notesLines, margin + boxWidth + 5, obsY);
      }

      y += 38;

      // Vendedor
      if (representative) {
        doc.setFontSize(7);
        doc.setTextColor(0, 0, 0);
        doc.setFont('helvetica', 'normal');
        doc.text(`Vendedor: ${representative.document || ''} - ${representative.name || ''}`, margin, y);
        if (representative.email) {
          doc.text(`E-mail: ${representative.email}`, margin, y + 4);
        }
      }

      y += 10;

      // De acordo
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.text('De acordo', pageWidth / 2, y, { align: 'center' });

      // Signature
      if (representative?.signature_image_url) {
        try {
          doc.addImage(representative.signature_image_url, 'PNG', pageWidth / 2 - 20, y + 5, 40, 15);
        } catch (e) {
          console.log('Could not add signature');
        }
      }

      // Save
      doc.save(`Orcamento_${quote.quote_number || 'SEM_NUMERO'}.pdf`);
      toast.success('PDF gerado com sucesso!');
    } catch (error) {
      console.error('Error generating PDF:', error);
      toast.error('Erro ao gerar PDF');
    } finally {
      setIsGenerating(false);
    }
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 2
    }).format(value || 0);
  };

  return (
    <Button
      onClick={generatePDF}
      disabled={isGenerating}
      variant="outline"
      className="border-[#0F2A44] text-[#0F2A44] hover:bg-[#0F2A44] hover:text-white"
    >
      {isGenerating ? (
        <>
          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          Gerando...
        </>
      ) : (
        <>
          <FileDown className="w-4 h-4 mr-2" />
          Exportar PDF
        </>
      )}
    </Button>
  );
}