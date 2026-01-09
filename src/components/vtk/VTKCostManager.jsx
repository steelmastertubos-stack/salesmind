import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Upload, Plus, Trash2, Edit } from 'lucide-react';
import { toast } from 'sonner';

export default function VTKCostManager() {
  const [showDialog, setShowDialog] = useState(false);
  const [editingCost, setEditingCost] = useState(null);
  const [formData, setFormData] = useState({
    aba_name: '',
    aba_date: '',
    product_type: '',
    specification: '',
    category: '',
    bitola: '',
    schedule: '',
    unit: 'KG',
    cost_per_unit: '',
    notes: ''
  });

  const queryClient = useQueryClient();

  const { data: costs = [], isLoading } = useQuery({
    queryKey: ['vtkCosts'],
    queryFn: () => base44.entities.VTKCost.list('-aba_date', 500)
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.VTKCost.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vtkCosts'] });
      resetForm();
      setShowDialog(false);
      toast.success('Custo VTK criado com sucesso!');
    },
    onError: (error) => {
      toast.error('Erro ao criar custo: ' + error.message);
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.VTKCost.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vtkCosts'] });
      resetForm();
      setShowDialog(false);
      toast.success('Custo VTK atualizado com sucesso!');
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.VTKCost.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vtkCosts'] });
      toast.success('Custo VTK excluído com sucesso!');
    }
  });

  const resetForm = () => {
    setFormData({
      aba_name: '',
      aba_date: '',
      product_type: '',
      specification: '',
      category: '',
      bitola: '',
      schedule: '',
      unit: 'KG',
      cost_per_unit: '',
      notes: ''
    });
    setEditingCost(null);
  };

  const handleOpen = (cost = null) => {
    if (cost) {
      setFormData(cost);
      setEditingCost(cost);
    } else {
      resetForm();
    }
    setShowDialog(true);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    const data = {
      ...formData,
      cost_per_unit: parseFloat(formData.cost_per_unit)
    };

    if (editingCost) {
      updateMutation.mutate({ id: editingCost.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  // Agrupar por aba
  const costsByAba = costs.reduce((acc, cost) => {
    if (!acc[cost.aba_name]) {
      acc[cost.aba_name] = [];
    }
    acc[cost.aba_name].push(cost);
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Tabelas de Custo VTK</h2>
        <Button onClick={() => handleOpen()} className="bg-emerald-600 hover:bg-emerald-700">
          <Plus className="w-4 h-4 mr-2" />
          Novo Custo
        </Button>
      </div>

      {/* Abas */}
      {Object.keys(costsByAba).map((abaName) => (
        <div key={abaName} className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
          <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-6 py-4">
            <h3 className="font-bold text-lg">{abaName}</h3>
            <p className="text-sm text-blue-100">
              {costsByAba[abaName].length} registros
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="text-left px-4 py-3 font-medium">Data</th>
                  <th className="text-left px-4 py-3 font-medium">Tipo Produto</th>
                  <th className="text-left px-4 py-3 font-medium">Especificação</th>
                  <th className="text-left px-4 py-3 font-medium">Categoria</th>
                  <th className="text-left px-4 py-3 font-medium">Bitola</th>
                  <th className="text-left px-4 py-3 font-medium">Schedule</th>
                  <th className="text-right px-4 py-3 font-medium">Custo (R$/KG)</th>
                  <th className="text-center px-4 py-3 font-medium">Ações</th>
                </tr>
              </thead>
              <tbody>
                {costsByAba[abaName].map((cost) => (
                  <tr key={cost.id} className="border-b border-slate-100 hover:bg-slate-50">
                    <td className="px-4 py-3">
                      {new Date(cost.aba_date).toLocaleDateString('pt-BR')}
                    </td>
                    <td className="px-4 py-3 font-medium">{cost.product_type}</td>
                    <td className="px-4 py-3 text-slate-600">{cost.specification}</td>
                    <td className="px-4 py-3">{cost.category}</td>
                    <td className="px-4 py-3 font-mono">{cost.bitola}</td>
                    <td className="px-4 py-3 font-mono">{cost.schedule}</td>
                    <td className="px-4 py-3 text-right font-semibold">
                      R$ {cost.cost_per_unit.toFixed(2)}
                    </td>
                    <td className="px-4 py-3 flex items-center justify-center gap-2">
                      <button
                        onClick={() => handleOpen(cost)}
                        className="p-2 hover:bg-blue-100 rounded-lg transition-colors"
                      >
                        <Edit className="w-4 h-4 text-blue-600" />
                      </button>
                      <button
                        onClick={() => deleteMutation.mutate(cost.id)}
                        className="p-2 hover:bg-red-100 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-4 h-4 text-red-600" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ))}

      {/* Dialog de Edição */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {editingCost ? 'Editar Custo VTK' : 'Novo Custo VTK'}
            </DialogTitle>
          </DialogHeader>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Aba</Label>
                <Select 
                  value={formData.aba_name} 
                  onValueChange={(v) => setFormData({...formData, aba_name: v})}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione a aba" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Tubulão com Costura">Tubulão com Costura</SelectItem>
                    <SelectItem value="Tubo Sem Costura">Tubo Sem Costura</SelectItem>
                    <SelectItem value="Tubo Com Costura">Tubo Com Costura</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Data da Tabela</Label>
                <Input
                  type="date"
                  value={formData.aba_date}
                  onChange={(e) => setFormData({...formData, aba_date: e.target.value})}
                />
              </div>

              <div className="space-y-2">
                <Label>Tipo de Produto</Label>
                <Input
                  value={formData.product_type}
                  onChange={(e) => setFormData({...formData, product_type: e.target.value})}
                  placeholder="ex: Tubulão"
                />
              </div>

              <div className="space-y-2">
                <Label>Especificação</Label>
                <Input
                  value={formData.specification}
                  onChange={(e) => setFormData({...formData, specification: e.target.value})}
                  placeholder="ex: API 5L Grau B"
                />
              </div>

              <div className="space-y-2">
                <Label>Categoria</Label>
                <Input
                  value={formData.category}
                  onChange={(e) => setFormData({...formData, category: e.target.value})}
                  placeholder="ex: PRETO - IMPORTADO"
                />
              </div>

              <div className="space-y-2">
                <Label>Bitola</Label>
                <Input
                  value={formData.bitola}
                  onChange={(e) => setFormData({...formData, bitola: e.target.value})}
                  placeholder='ex: 12", 1/2"'
                />
              </div>

              <div className="space-y-2">
                <Label>Schedule/Espessura</Label>
                <Input
                  value={formData.schedule}
                  onChange={(e) => setFormData({...formData, schedule: e.target.value})}
                  placeholder="ex: SCH 40, SCH 80"
                />
              </div>

              <div className="space-y-2">
                <Label>Unidade</Label>
                <Select 
                  value={formData.unit} 
                  onValueChange={(v) => setFormData({...formData, unit: v})}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="KG">KG</SelectItem>
                    <SelectItem value="MT">MT</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Custo Unitário (R$)</Label>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.cost_per_unit}
                  onChange={(e) => setFormData({...formData, cost_per_unit: e.target.value})}
                  placeholder="0.00"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Observações</Label>
              <Textarea
                value={formData.notes}
                onChange={(e) => setFormData({...formData, notes: e.target.value})}
                placeholder="ex: Itens fora de estoque, sob consulta"
                rows={2}
              />
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t">
              <Button type="button" variant="outline" onClick={() => setShowDialog(false)}>
                Cancelar
              </Button>
              <Button 
                type="submit" 
                disabled={createMutation.isPending || updateMutation.isPending}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {editingCost ? 'Atualizar' : 'Criar'} Custo
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}