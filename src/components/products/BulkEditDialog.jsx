import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Edit3 } from 'lucide-react';

export default function BulkEditDialog({ open, onClose, selectedCount, onApply }) {
  const [field, setField] = useState('');
  const [value, setValue] = useState('');

  const handleApply = () => {
    if (!field) {
      alert('Selecione um campo para atualizar');
      return;
    }
    if (value === '') {
      alert('Insira um valor');
      return;
    }

    // Converter valor para número se necessário
    const finalValue = ['base_price_per_kg', 'cost_per_kg', 'ipi_rate', 'factor_6m', 'weight_per_meter'].includes(field)
      ? parseFloat(value)
      : value;

    onApply(field, finalValue);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Edit3 className="w-5 h-5 text-blue-600" />
            Edição em Lote
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <p className="text-sm text-blue-900">
              <strong>{selectedCount}</strong> produtos selecionados
            </p>
            <p className="text-xs text-blue-700 mt-1">
              Todos receberão o mesmo valor no campo escolhido
            </p>
          </div>

          <div className="space-y-2">
            <Label>Campo a Atualizar</Label>
            <Select value={field} onValueChange={setField}>
              <SelectTrigger>
                <SelectValue placeholder="Escolha o campo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="base_price_per_kg">Preço Base (R$/kg)</SelectItem>
                <SelectItem value="cost_per_kg">Custo (R$/kg)</SelectItem>
                <SelectItem value="ipi_rate">IPI (%)</SelectItem>
                <SelectItem value="category">Categoria</SelectItem>
                <SelectItem value="unit">Unidade</SelectItem>
                <SelectItem value="factor_6m">Fator (peso barra 6m)</SelectItem>
                <SelectItem value="weight_per_meter">Peso/metro (kg/mt)</SelectItem>
                <SelectItem value="ncm">NCM</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Novo Valor</Label>
            {field === 'category' ? (
              <Select value={value} onValueChange={setValue}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione a categoria" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="tubos_quadrados_retangulares">Tubos Quadrados/Retangulares</SelectItem>
                  <SelectItem value="tubos_redondos">Tubos Redondos</SelectItem>
                  <SelectItem value="chapas">Chapas</SelectItem>
                  <SelectItem value="perfis">Perfis</SelectItem>
                  <SelectItem value="vigas">Vigas</SelectItem>
                  <SelectItem value="cantoneiras">Cantoneiras</SelectItem>
                  <SelectItem value="outros">Outros</SelectItem>
                </SelectContent>
              </Select>
            ) : field === 'unit' ? (
              <Select value={value} onValueChange={setValue}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione a unidade" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="kg">kg</SelectItem>
                  <SelectItem value="mt">mt</SelectItem>
                  <SelectItem value="pc">pc</SelectItem>
                </SelectContent>
              </Select>
            ) : (
              <Input 
                type={['base_price_per_kg', 'cost_per_kg', 'ipi_rate', 'factor_6m', 'weight_per_meter'].includes(field) ? 'number' : 'text'}
                step="0.01"
                value={value} 
                onChange={(e) => setValue(e.target.value)}
                placeholder={
                  field === 'base_price_per_kg' ? 'Ex: 11.90' :
                  field === 'cost_per_kg' ? 'Ex: 9.50' :
                  field === 'ipi_rate' ? 'Ex: 12.0' :
                  field === 'factor_6m' ? 'Ex: 57.0' :
                  field === 'weight_per_meter' ? 'Ex: 9.500' :
                  field === 'ncm' ? 'Ex: 73061900' :
                  'Digite o valor'
                }
              />
            )}
          </div>

          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
            <p className="text-xs text-amber-900">
              <strong>Atenção:</strong> Esta ação irá sobrescrever o valor atual do campo em todos os produtos selecionados.
            </p>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button 
              onClick={handleApply}
              className="bg-blue-600 hover:bg-blue-700"
              disabled={!field || value === ''}
            >
              Aplicar a {selectedCount} Produtos
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}