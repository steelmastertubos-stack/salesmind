import React from 'react';
import VTKCostManager from '@/components/vtk/VTKCostManager';
import PageHeader from '@/components/common/PageHeader';

export default function VTKCostSetup() {
  return (
    <div className="space-y-6 pb-20 lg:pb-6">
      <PageHeader 
        title="Gerenciamento de Custos VTK" 
        subtitle="Importar e manter tabelas de custo das 3 abas"
      />

      <div className="bg-blue-50 border-2 border-blue-200 rounded-2xl p-6 mb-6">
        <h3 className="font-bold text-blue-900 mb-2">📋 Como funciona:</h3>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>✓ Cada aba da planilha VTK é importada como tabela de custo</li>
          <li>✓ No orçamento, o sistema busca o custo automaticamente</li>
          <li>✓ Margem é calculada com base no custo VTK oficial</li>
          <li>✓ Comissão é determinada conforme tabela de margem VTK</li>
          <li>✓ Relatório de auditoria rastreia todos os custos utilizados</li>
        </ul>
      </div>

      <VTKCostManager />
    </div>
  );
}