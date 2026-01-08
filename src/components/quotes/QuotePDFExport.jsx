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
      const margin = 15;
      let y = 20;

      // Header - Logo e Dados do Representado
      doc.setFillColor(15, 42, 68); // #0F2A44
      doc.rect(0, 0, pageWidth, 15, 'F');
      
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(18);
      doc.setFont('helvetica', 'bold');
      doc.text('ORÇAMENTO', pageWidth / 2, 10, { align: 'center' });

      y = 25;

      // Box do Representado
      doc.setDrawColor(15, 42, 68);
      doc.setLineWidth(0.5);
      doc.rect(margin, y, pageWidth - 2 * margin - 50, 40);

      doc.setTextColor(15, 42, 68);
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text(quote.principal_name || 'Representado', margin + 3, y + 6);
      
      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(28, 28, 28);
      
      let textY = y + 12;
      if (quote.principal_cnpj) {
        doc.text(`CNPJ: ${quote.principal_cnpj}`, margin + 3, textY);
        textY += 5;
      }
      if (quote.principal_state_registration) {
        doc.text(`I.E.: ${quote.principal_state_registration}`, margin + 3, textY);
        textY += 5;
      }

      // Box Número do Orçamento
      doc.setFillColor(15, 42, 68);
      doc.rect(pageWidth - margin - 45, y, 45, 40, 'FD');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.text('ORÇAMENTO', pageWidth - margin - 22.5, y + 8, { align: 'center' });
      doc.setFontSize(11);
      doc.text(quote.quote_number || 'N/A', pageWidth - margin - 22.5, y + 16, { align: 'center' });
      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      const date = new Date(quote.created_date || new Date()).toLocaleDateString('pt-BR');
      doc.text(date, pageWidth - margin - 22.5, y + 24, { align: 'center' });

      y += 50;

      // Cliente
      doc.setFillColor(242, 244, 247);
      doc.rect(margin, y, pageWidth - 2 * margin, 8, 'F');
      doc.setTextColor(15, 42, 68);
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.text('CLIENTE', margin + 3, y + 5.5);

      y += 10;
      doc.setDrawColor(200, 200, 200);
      doc.setLineWidth(0.3);
      doc.rect(margin, y - 2, pageWidth - 2 * margin, 25);

      doc.setTextColor(28, 28, 28);
      doc.setFontSize(9);
      doc.setFont('helvetica', 'bold');
      doc.text(`Cliente: `, margin + 3, y + 3);
      doc.setFont('helvetica', 'normal');
      doc.text(quote.client_name || 'N/A', margin + 20, y + 3);

      y += 6;
      doc.text(`Endereço: ${quote.client_address || ''} - ${quote.client_city || ''}/${quote.client_state || ''}`, margin + 3, y + 3);
      
      y += 6;
      doc.text(`CNPJ: ${quote.client_cnpj || ''}`, margin + 3, y + 3);
      if (quote.client_state_registration) {
        doc.text(`I.E.: ${quote.client_state_registration}`, margin + 50, y + 3);
      }

      y += 10;

      // Itens
      y += 8;
      doc.setFillColor(242, 244, 247);
      doc.rect(margin, y, pageWidth - 2 * margin, 8, 'F');
      doc.setTextColor(15, 42, 68);
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.text('ITENS', margin + 3, y + 5.5);

      y += 10;

      // Table Header
      doc.setFillColor(31, 78, 121); // #1F4E79
      doc.rect(margin, y, pageWidth - 2 * margin, 8, 'F');
      
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(8);
      doc.setFont('helvetica', 'bold');
      
      const colWidths = [12, 15, 12, 60, 15, 15, 15, 16];
      let xPos = margin + 2;
      
      doc.text('Item', xPos, y + 5.5);
      xPos += colWidths[0];
      doc.text('Qtde', xPos, y + 5.5);
      xPos += colWidths[1];
      doc.text('Unid', xPos, y + 5.5);
      xPos += colWidths[2];
      doc.text('Produto', xPos, y + 5.5);
      xPos += colWidths[3];
      doc.text('ICMS', xPos, y + 5.5);
      xPos += colWidths[4];
      doc.text('IPI', xPos, y + 5.5);
      xPos += colWidths[5];
      doc.text('R$/kg', xPos, y + 5.5);
      xPos += colWidths[6];
      doc.text('Total', xPos, y + 5.5);

      y += 10;

      // Items
      doc.setTextColor(28, 28, 28);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);

      quote.items?.forEach((item, index) => {
        if (y > 250) {
          doc.addPage();
          y = 20;
        }

        xPos = margin + 2;
        doc.text(String(index + 1), xPos, y + 4);
        xPos += colWidths[0];
        doc.text(item.quantity.toFixed(2), xPos, y + 4);
        xPos += colWidths[1];
        doc.text(item.unit.toUpperCase(), xPos, y + 4);
        xPos += colWidths[2];
        
        const productText = `${item.product_code} - ${item.product_name}`;
        const splitText = doc.splitTextToSize(productText, colWidths[3] - 2);
        doc.text(splitText[0], xPos, y + 4);
        xPos += colWidths[3];
        
        doc.text(`${item.icms_rate}%`, xPos, y + 4);
        xPos += colWidths[4];
        doc.text(`${item.ipi_rate}%`, xPos, y + 4);
        xPos += colWidths[5];
        doc.text(formatCurrency(item.price_per_kg), xPos, y + 4);
        xPos += colWidths[6];
        doc.text(formatCurrency(item.item_total), xPos, y + 4);

        doc.setDrawColor(230, 230, 230);
        doc.line(margin, y + 6, pageWidth - margin, y + 6);
        
        y += 8;
      });

      // Totais
      y += 5;
      doc.setDrawColor(15, 42, 68);
      doc.setLineWidth(0.5);
      doc.rect(pageWidth - 80, y, 65, 35);

      doc.setFontSize(9);
      doc.setTextColor(28, 28, 28);
      
      doc.text('Subtotal Produtos:', pageWidth - 78, y + 6);
      doc.text(formatCurrency(quote.products_subtotal), pageWidth - 16, y + 6, { align: 'right' });
      
      doc.text('Total ICMS (incluso):', pageWidth - 78, y + 12);
      doc.text(formatCurrency(quote.total_icms), pageWidth - 16, y + 12, { align: 'right' });
      
      doc.text('Total IPI:', pageWidth - 78, y + 18);
      doc.text(formatCurrency(quote.total_ipi), pageWidth - 16, y + 18, { align: 'right' });

      if (quote.freight_value > 0) {
        doc.text('Frete:', pageWidth - 78, y + 24);
        doc.text(formatCurrency(quote.freight_value), pageWidth - 16, y + 24, { align: 'right' });
      }

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(11);
      doc.setTextColor(15, 42, 68);
      doc.text('VALOR TOTAL:', pageWidth - 78, y + 32);
      doc.setTextColor(29, 185, 84); // #1DB954
      doc.text(formatCurrency(quote.total_value), pageWidth - 16, y + 32, { align: 'right' });

      // Footer
      y = doc.internal.pageSize.getHeight() - 30;
      
      if (quote.payment_terms || quote.notes) {
        doc.setFontSize(8);
        doc.setTextColor(28, 28, 28);
        doc.setFont('helvetica', 'normal');
        
        if (quote.payment_terms) {
          doc.text(`Condições de Pagamento: ${quote.payment_terms}`, margin, y);
          y += 5;
        }
        if (quote.notes) {
          doc.text(`Observações: ${quote.notes}`, margin, y);
          y += 5;
        }
      }

      if (representative) {
        doc.setFontSize(7);
        doc.setTextColor(100, 100, 100);
        doc.text(`Vendedor: ${representative.name} - ${representative.document || ''}`, margin, y + 5);
        if (representative.email) {
          doc.text(`E-mail: ${representative.email}`, margin, y + 9);
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