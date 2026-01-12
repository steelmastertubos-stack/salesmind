import React, { useState, useMemo } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import PageHeader from '@/components/common/PageHeader';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Package, Search, Edit, Trash2, Filter, X, Download } from 'lucide-react';
import { toast } from 'sonner';

export default function ProductsPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterPrincipal, setFilterPrincipal] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [filterStatus, setFilterStatus] = useState('active');
  const [showForm, setShowForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const queryClient = useQueryClient();

  const { data: products = [], isLoading } = useQuery({
    queryKey: ['products'],
    queryFn: () => base44.entities.Product.list('name', 500)
  });

  const { data: principals = [] } = useQuery({
    queryKey: ['principals'],
    queryFn: () => base44.entities.Principal.list('company_name', 100)
  });

  const createProductMutation = useMutation({
    mutationFn: async (data) => {
      // Verificar duplicidade de código
      if (data.code) {
        const existing = products.find(p => p.code === data.code && p.id !== editingProduct?.id);
        if (existing) {
          throw new Error(`Código "${data.code}" já existe no sistema`);
        }
      }
      return base44.entities.Product.create(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['products']);
      setShowForm(false);
      setEditingProduct(null);
      toast.success('Produto criado com sucesso!');
    },
    onError: (error) => {
      toast.error(error.message || 'Erro ao criar produto');
    }
  });

  const updateProductMutation = useMutation({
    mutationFn: async ({ id, data }) => {
      // Verificar duplicidade de código
      if (data.code) {
        const existing = products.find(p => p.code === data.code && p.id !== id);
        if (existing) {
          throw new Error(`Código "${data.code}" já existe no sistema`);
        }
      }
      return base44.entities.Product.update(id, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['products']);
      setShowForm(false);
      setEditingProduct(null);
      toast.success('Produto atualizado!');
    },
    onError: (error) => {
      toast.error(error.message || 'Erro ao atualizar produto');
    }
  });

  const deleteProductMutation = useMutation({
    mutationFn: (id) => base44.entities.Product.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['products']);
      toast.success('Produto excluído!');
    }
  });

  // Criar mapa de representados
  const principalsMap = useMemo(() => {
    const map = {};
    principals.forEach(p => {
      map[p.id] = p.trade_name || p.company_name;
    });
    return map;
  }, [principals]);

  // Filtrar produtos
  const filteredProducts = products.filter(p => {
    const searchMatch = !searchTerm || 
      p.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.code?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.description?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const principalMatch = !filterPrincipal || p.principal_id === filterPrincipal;
    const categoryMatch = !filterCategory || p.category === filterCategory;
    const statusMatch = filterStatus === 'all' || 
      (filterStatus === 'active' && p.is_active !== false) ||
      (filterStatus === 'inactive' && p.is_active === false);
    
    return searchMatch && principalMatch && categoryMatch && statusMatch;
  });

  const exportToCSV = () => {
    const headers = ['Representada', 'Código', 'Nome', 'Categoria', 'Unidade', 'Peso/metro', 'Preço Base (R$/kg)', 'Custo (R$/kg)', 'IPI (%)', 'Status'];
    const rows = filteredProducts.map(p => [
      principalsMap[p.principal_id] || '-',
      p.code || '-',
      p.name,
      p.category || '-',
      p.unit || 'kg',
      p.weight_per_meter || '-',
      (p.base_price_per_kg || 0).toFixed(2),
      (p.cost_per_kg || 0).toFixed(2),
      (p.ipi_rate || 0).toFixed(2),
      p.is_active !== false ? 'Ativo' : 'Inativo'
    ]);

    const csv = [headers, ...rows].map(row => row.map(v => `"${v}"`).join(',')).join('\n');
    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `produtos-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    toast.success('Lista exportada!');
  };

  const handleDelete = (id) => {
    if (confirm('Deseja excluir este produto?')) {
      deleteProductMutation.mutate(id);
    }
  };

  return (
    <div className="pb-20 lg:pb-6 space-y-6">
      <PageHeader
        title="Lista Técnica de Produtos"
        subtitle="Catálogo padronizado para estoque, orçamentos e comissões"
        actionLabel="Novo Produto"
        onAction={() => {
          setEditingProduct(null);
          setShowForm(true);
        }}
      >
        <Button variant="outline" onClick={exportToCSV} disabled={filteredProducts.length === 0}>
          <Download className="w-4 h-4 mr-2" />
          Exportar CSV
        </Button>
      </PageHeader>

      <Card>
        <CardContent className="p-4 space-y-4">
          <div className="flex flex-col lg:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
              <Input
                placeholder="Buscar por nome, código ou descrição..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <Select value={filterPrincipal} onValueChange={setFilterPrincipal}>
              <SelectTrigger className="w-full lg:w-[200px]">
                <SelectValue placeholder="Representada" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={null}>Todas</SelectItem>
                {principals.map(p => (
                  <SelectItem key={p.id} value={p.id}>{p.trade_name || p.company_name}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={filterCategory} onValueChange={setFilterCategory}>
              <SelectTrigger className="w-full lg:w-[180px]">
                <SelectValue placeholder="Categoria" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={null}>Todas</SelectItem>
                <SelectItem value="tubos_quadrados_retangulares">Tubos Quad/Ret</SelectItem>
                <SelectItem value="tubos_redondos">Tubos Redondos</SelectItem>
                <SelectItem value="chapas">Chapas</SelectItem>
                <SelectItem value="perfis">Perfis</SelectItem>
                <SelectItem value="vigas">Vigas</SelectItem>
                <SelectItem value="cantoneiras">Cantoneiras</SelectItem>
                <SelectItem value="outros">Outros</SelectItem>
              </SelectContent>
            </Select>

            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-full lg:w-[140px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="active">Ativos</SelectItem>
                <SelectItem value="inactive">Inativos</SelectItem>
                <SelectItem value="all">Todos</SelectItem>
              </SelectContent>
            </Select>

            {(filterPrincipal || filterCategory) && (
              <Button variant="ghost" size="icon" onClick={() => {
                setFilterPrincipal('');
                setFilterCategory('');
              }}>
                <X className="w-4 h-4" />
              </Button>
            )}
          </div>

          <p className="text-sm text-slate-600">
            {filteredProducts.length} produto(s) encontrado(s)
          </p>
        </CardContent>
      </Card>

      <Card>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-slate-50">
                <th className="text-left p-3 font-medium text-slate-700">Representada</th>
                <th className="text-left p-3 font-medium text-slate-700">Código</th>
                <th className="text-left p-3 font-medium text-slate-700">Produto</th>
                <th className="text-left p-3 font-medium text-slate-700">Categoria</th>
                <th className="text-center p-3 font-medium text-slate-700">Un</th>
                <th className="text-right p-3 font-medium text-slate-700">Peso/m</th>
                <th className="text-right p-3 font-medium text-slate-700">Preço (R$/kg)</th>
                <th className="text-right p-3 font-medium text-slate-700">Custo (R$/kg)</th>
                <th className="text-right p-3 font-medium text-slate-700">IPI %</th>
                <th className="text-center p-3 font-medium text-slate-700">Status</th>
                <th className="text-center p-3 font-medium text-slate-700">Ações</th>
              </tr>
            </thead>
            <tbody>
              {filteredProducts.map(product => (
                <tr key={product.id} className="border-b hover:bg-slate-50 transition-colors">
                  <td className="p-3">
                    <span className="text-xs font-medium text-slate-900">
                      {principalsMap[product.principal_id] || '-'}
                    </span>
                  </td>
                  <td className="p-3">
                    <code className="text-xs bg-slate-100 px-2 py-1 rounded">
                      {product.code || '-'}
                    </code>
                  </td>
                  <td className="p-3">
                    <div>
                      <p className="font-medium text-slate-900">{product.name}</p>
                      {product.description && (
                        <p className="text-xs text-slate-500 mt-0.5 truncate max-w-[200px]">
                          {product.description}
                        </p>
                      )}
                    </div>
                  </td>
                  <td className="p-3 text-xs text-slate-600">
                    {product.category?.replace(/_/g, ' ') || '-'}
                  </td>
                  <td className="p-3 text-center">
                    <Badge variant="outline" className="text-xs">
                      {product.unit || 'kg'}
                    </Badge>
                  </td>
                  <td className="p-3 text-right text-slate-700">
                    {product.weight_per_meter ? product.weight_per_meter.toFixed(3) : '-'}
                  </td>
                  <td className="p-3 text-right font-semibold text-emerald-700">
                    {(product.base_price_per_kg || 0).toFixed(2)}
                  </td>
                  <td className="p-3 text-right text-slate-700">
                    {(product.cost_per_kg || 0).toFixed(2)}
                  </td>
                  <td className="p-3 text-right text-slate-700">
                    {(product.ipi_rate || 0).toFixed(1)}
                  </td>
                  <td className="p-3 text-center">
                    <Badge variant={product.is_active !== false ? 'default' : 'secondary'} className="text-xs">
                      {product.is_active !== false ? 'Ativo' : 'Inativo'}
                    </Badge>
                  </td>
                  <td className="p-3">
                    <div className="flex items-center justify-center gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0"
                        onClick={() => {
                          setEditingProduct(product);
                          setShowForm(true);
                        }}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                        onClick={() => handleDelete(product.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {filteredProducts.length === 0 && (
            <div className="py-12 text-center">
              <Package className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <p className="text-slate-500">
                {searchTerm || filterPrincipal || filterCategory ? 'Nenhum produto encontrado' : 'Nenhum produto cadastrado'}
              </p>
            </div>
          )}
        </div>
      </Card>

      <Dialog open={showForm} onOpenChange={(open) => {
        if (!open) {
          setShowForm(false);
          setEditingProduct(null);
        }
      }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingProduct ? 'Editar Produto' : 'Novo Produto'}
            </DialogTitle>
          </DialogHeader>
          <ProductForm
            product={editingProduct}
            principals={principals}
            onSave={(data) => {
              if (editingProduct) {
                updateProductMutation.mutate({ id: editingProduct.id, data });
              } else {
                createProductMutation.mutate(data);
              }
            }}
            onCancel={() => {
              setShowForm(false);
              setEditingProduct(null);
            }}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}

function ProductForm({ product, principals, onSave, onCancel }) {
  const [formData, setFormData] = useState({
    principal_id: product?.principal_id || '',
    code: product?.code || '',
    name: product?.name || '',
    description: product?.description || '',
    category: product?.category || 'outros',
    ncm: product?.ncm || '',
    unit: product?.unit || 'kg',
    factor_6m: product?.factor_6m || '',
    weight_per_meter: product?.weight_per_meter || '',
    ipi_rate: product?.ipi_rate || '',
    base_price_per_kg: product?.base_price_per_kg || '',
    cost_per_kg: product?.cost_per_kg || '',
    is_active: product?.is_active !== false
  });

  const selectedPrincipal = principals.find(p => p.id === formData.principal_id);
  const isNewAco = selectedPrincipal?.trade_name?.toUpperCase().includes('NEW') || 
                   selectedPrincipal?.company_name?.toUpperCase().includes('NEW');

  const handleSubmit = (e) => {
    e.preventDefault();
    
    const data = {
      ...formData,
      factor_6m: parseFloat(formData.factor_6m) || 0,
      weight_per_meter: isNewAco && formData.factor_6m 
        ? parseFloat(formData.factor_6m) / 6 
        : parseFloat(formData.weight_per_meter) || 0,
      ipi_rate: parseFloat(formData.ipi_rate) || 0,
      base_price_per_kg: parseFloat(formData.base_price_per_kg),
      cost_per_kg: parseFloat(formData.cost_per_kg) || 0
    };
    onSave(data);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-xs text-blue-900">
        <p className="font-medium mb-1">⚠️ Regras importantes:</p>
        <ul className="space-y-1 ml-4">
          <li>• Preço base e custo são valores PUROS (sem ICMS/IPI)</li>
          <li>• Código deve ser único (ex: NEWACO-TQ-100x100x3.00)</li>
          <li>• Todo produto deve ter uma representada vinculada</li>
        </ul>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Representada *</Label>
          <Select value={formData.principal_id} onValueChange={(v) => setFormData(prev => ({ ...prev, principal_id: v }))} required>
            <SelectTrigger className={!formData.principal_id ? 'border-red-300' : ''}>
              <SelectValue placeholder="Selecione a representada" />
            </SelectTrigger>
            <SelectContent>
              {principals.map(p => (
                <SelectItem key={p.id} value={p.id}>{p.trade_name || p.company_name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          {!formData.principal_id && (
            <p className="text-xs text-red-600">Representada é obrigatória</p>
          )}
        </div>

        <div className="space-y-2">
          <Label>Código Técnico *</Label>
          <Input 
            value={formData.code} 
            onChange={(e) => setFormData(prev => ({ ...prev, code: e.target.value }))}
            placeholder="NEWACO-TQ-100x100x3.00"
            required
          />
          <p className="text-xs text-slate-500">
            Padrão: REPRESENTADA-TIPO-MEDIDA
          </p>
        </div>
      </div>

      <div className="space-y-2">
        <Label>Nome do Produto *</Label>
        <Input value={formData.name} onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))} required />
      </div>

      <div className="space-y-2">
        <Label>Descrição</Label>
        <Textarea value={formData.description} onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))} rows={2} />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Categoria</Label>
          <Select value={formData.category} onValueChange={(v) => setFormData(prev => ({ ...prev, category: v }))}>
            <SelectTrigger>
              <SelectValue />
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
        </div>

        <div className="space-y-2">
          <Label>NCM</Label>
          <Input value={formData.ncm} onChange={(e) => setFormData(prev => ({ ...prev, ncm: e.target.value }))} />
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="space-y-2">
          <Label>Unidade</Label>
          <Select value={formData.unit} onValueChange={(v) => setFormData(prev => ({ ...prev, unit: v }))}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="kg">kg</SelectItem>
              <SelectItem value="mt">mt</SelectItem>
              <SelectItem value="pc">pc</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {isNewAco ? (
          <>
            <div className="space-y-2">
              <Label className="text-blue-900">Fator (peso barra 6m) *</Label>
              <Input 
                type="number" 
                step="0.01" 
                value={formData.factor_6m} 
                onChange={(e) => {
                  const factor = e.target.value;
                  setFormData(prev => ({ 
                    ...prev, 
                    factor_6m: factor,
                    weight_per_meter: factor ? (parseFloat(factor) / 6).toFixed(3) : ''
                  }));
                }}
                className="border-blue-300 bg-blue-50"
              />
              <p className="text-xs text-blue-700">Ex: 57 kg gera 9.500 kg/mt</p>
            </div>

            <div className="space-y-2">
              <Label className="text-slate-500">Peso/metro (calculado)</Label>
              <Input 
                type="text" 
                value={formData.weight_per_meter ? parseFloat(formData.weight_per_meter).toFixed(3) : '-'}
                disabled
                className="bg-slate-100 text-slate-700 font-semibold cursor-not-allowed"
              />
              <p className="text-xs text-slate-500">Automático: fator ÷ 6</p>
            </div>
          </>
        ) : (
          <div className="space-y-2">
            <Label>Peso/metro (kg/mt)</Label>
            <Input 
              type="number" 
              step="0.01" 
              value={formData.weight_per_meter} 
              onChange={(e) => setFormData(prev => ({ ...prev, weight_per_meter: e.target.value }))} 
            />
          </div>
        )}

        <div className="space-y-2">
          <Label>IPI (%)</Label>
          <Input type="number" step="0.01" value={formData.ipi_rate} onChange={(e) => setFormData(prev => ({ ...prev, ipi_rate: e.target.value }))} />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 bg-emerald-50 p-3 rounded-lg border border-emerald-200">
        <div className="space-y-2">
          <Label className="text-emerald-900">Preço Base (R$/kg) * - SEM IMPOSTOS</Label>
          <Input 
            type="number" 
            step="0.01" 
            value={formData.base_price_per_kg} 
            onChange={(e) => setFormData(prev => ({ ...prev, base_price_per_kg: e.target.value }))} 
            required
            className="font-semibold"
          />
          <p className="text-xs text-emerald-700">Valor puro, ICMS/IPI calculados no orçamento</p>
        </div>

        <div className="space-y-2">
          <Label className="text-emerald-900">Custo (R$/kg) - SEM IMPOSTOS</Label>
          <Input 
            type="number" 
            step="0.01" 
            value={formData.cost_per_kg} 
            onChange={(e) => setFormData(prev => ({ ...prev, cost_per_kg: e.target.value }))}
            className="font-semibold"
          />
          <p className="text-xs text-emerald-700">Usado para cálculo de margem</p>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          id="is_active"
          checked={formData.is_active}
          onChange={(e) => setFormData(prev => ({ ...prev, is_active: e.target.checked }))}
          className="w-4 h-4"
        />
        <Label htmlFor="is_active" className="cursor-pointer">Produto ativo</Label>
      </div>

      <div className="flex justify-end gap-3 pt-4 border-t">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancelar
        </Button>
        <Button 
          type="submit" 
          className="bg-[#1DB954] hover:bg-[#15803d]"
          disabled={!formData.principal_id || !formData.code || !formData.name || !formData.base_price_per_kg}
        >
          {product ? 'Atualizar' : 'Criar'} Produto
        </Button>
      </div>
    </form>
  );
}