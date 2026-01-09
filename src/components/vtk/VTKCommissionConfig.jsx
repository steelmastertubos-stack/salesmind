import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, Trash2, Table as TableIcon } from 'lucide-react';
import { toast } from 'sonner';
import { DEFAULT_VTK_TABLE } from '@/components/utils/vtkCommissionCalculator';

export default function VTKCommissionConfig({ principal, onSave }) {
  const [isEnabled, setIsEnabled] = useState(principal?.use_vtk_commission_table || false);
  const [table, setTable] = useState(principal?.vtk_commission_table || DEFAULT_VTK_TABLE);

  const handleAddRow = () => {
    const lastRow = table[table.length - 1];
    const newMinMargin = lastRow ? lastRow.max_margin + 0.01 : 0;
    
    setTable([...table, {
      min_margin: parseFloat(newMinMargin.toFixed(2)),
      max_margin: parseFloat((newMinMargin + 2).toFixed(2)),
      commission_rate: 0,
      bracket_name: `Faixa ${table.length + 1}`
    }]);
  };

  const handleRemoveRow = (index) => {
    if (table.length <= 1) {
      toast.error('Mantenha pelo menos uma faixa');
      return;
    }
    setTable(table.filter((_, i) => i !== index));
  };

  const handleUpdateRow = (index, field, value) => {
    const updated = [...table];
    updated[index] = { ...updated[index], [field]: parseFloat(value) || 0 };
    setTable(updated);
  };

  const handleSave = () => {
    // Validar tabela
    const sorted = [...table].sort((a, b) => a.min_margin - b.min_margin);
    
    onSave({
      use_vtk_commission_table: isEnabled,
      vtk_commission_table: sorted
    });
  };

  const handleLoadDefault = () => {
    setTable(DEFAULT_VTK_TABLE);
    toast.success('Tabela padrão carregada');
  };

  return (
    <Card className="border-2 border-emerald-200">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TableIcon className="w-5 h-5 text-emerald-600" />
          Configuração VTK - Comissão por Margem
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-4">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={isEnabled}
              onChange={(e) => setIsEnabled(e.target.checked)}
              className="w-5 h-5 rounded border-slate-300"
            />
            <span className="font-medium">Habilitar cálculo VTK para este representado</span>
          </label>
        </div>

        {isEnabled && (
          <>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm">
              <p className="font-medium text-blue-900 mb-1">📊 Como funciona:</p>
              <ul className="text-blue-800 space-y-1 text-xs ml-4 list-disc">
                <li>Margem Original = (Venda - Custo) / Venda × 100</li>
                <li>Se Prazo Médio {'>'} 40 dias: Margem Considerada = Margem Original - 0,5%</li>
                <li>Comissão determinada pela faixa de Margem Considerada</li>
              </ul>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-base font-semibold">Tabela de Faixas de Margem</Label>
                <div className="flex gap-2">
                  <Button type="button" variant="outline" size="sm" onClick={handleLoadDefault}>
                    Carregar Padrão
                  </Button>
                  <Button type="button" variant="outline" size="sm" onClick={handleAddRow}>
                    <Plus className="w-4 h-4 mr-1" />
                    Adicionar Faixa
                  </Button>
                </div>
              </div>

              <div className="border rounded-lg overflow-hidden">
                <div className="grid grid-cols-[1fr,1fr,1fr,1.5fr,auto] gap-2 p-2 bg-slate-100 text-xs font-semibold">
                  <div>Margem Mín (%)</div>
                  <div>Margem Máx (%)</div>
                  <div>Comissão (%)</div>
                  <div>Nome da Faixa</div>
                  <div></div>
                </div>
                
                {table.map((row, index) => (
                  <div key={index} className="grid grid-cols-[1fr,1fr,1fr,1.5fr,auto] gap-2 p-2 border-t items-center">
                    <Input
                      type="number"
                      step="0.01"
                      value={row.min_margin}
                      onChange={(e) => handleUpdateRow(index, 'min_margin', e.target.value)}
                      className="h-9 text-sm"
                    />
                    <Input
                      type="number"
                      step="0.01"
                      value={row.max_margin}
                      onChange={(e) => handleUpdateRow(index, 'max_margin', e.target.value)}
                      className="h-9 text-sm"
                    />
                    <Input
                      type="number"
                      step="0.1"
                      value={row.commission_rate}
                      onChange={(e) => handleUpdateRow(index, 'commission_rate', e.target.value)}
                      className="h-9 text-sm"
                    />
                    <Input
                      type="text"
                      value={row.bracket_name}
                      onChange={(e) => handleUpdateRow(index, 'bracket_name', e.target.value)}
                      className="h-9 text-sm"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => handleRemoveRow(index)}
                      className="h-9 w-9 text-red-600"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-xs text-amber-800">
              ⚠️ <strong>Importante:</strong> As faixas devem ser contínuas e sem sobreposição. 
              O sistema ordena automaticamente ao salvar.
            </div>
          </>
        )}

        <div className="flex justify-end pt-4">
          <Button onClick={handleSave} className="bg-emerald-600 hover:bg-emerald-700">
            Salvar Configuração VTK
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}