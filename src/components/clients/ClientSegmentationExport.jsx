import React from 'react';
import { Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { getSegmentCode } from '@/components/utils/segmentMapping';

export default function ClientSegmentationExport({ clients }) {
  const exportCSV = () => {
    if (!clients || clients.length === 0) {
      toast.error('Nenhum cliente para exportar');
      return;
    }

    // Headers
    const headers = [
      'ID',
      'Razão Social',
      'Nome Fantasia',
      'CNPJ',
      'Segmento',
      'Código Segmento',
      'Porte/Complexidade',
      'Aplicações Principais'
    ];

    // Rows
    const rows = clients.map(client => [
      client.id || '',
      client.company_name || '',
      client.trade_name || '',
      client.cnpj || '',
      client.segment || '',
      client.segment_code || getSegmentCode(client.segment) || '',
      client.complexity || '',
      (client.main_applications || []).join('; ')
    ]);

    // CSV content
    const csvContent = [
      headers.join(','),
      ...rows.map(row => 
        row.map(cell => 
          typeof cell === 'string' && cell.includes(',') 
            ? `"${cell}"` 
            : cell
        ).join(',')
      )
    ].join('\n');

    // Download
    const element = document.createElement('a');
    element.setAttribute('href', `data:text/csv;charset=utf-8,${encodeURIComponent(csvContent)}`);
    element.setAttribute('download', `clientes-segmentacao-${new Date().toISOString().split('T')[0]}.csv`);
    element.style.display = 'none';
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);

    toast.success('CSV exportado com sucesso!');
  };

  return (
    <Button
      onClick={exportCSV}
      variant="outline"
      size="sm"
      className="gap-2"
    >
      <Download className="w-4 h-4" />
      Exportar CSV (Segmentação)
    </Button>
  );
}