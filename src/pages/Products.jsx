import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import PageHeader from '@/components/common/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Package, Search, Edit, Trash2, Plus, DollarSign } from 'lucide-react';
import { toast } from 'sonner';

export default function ProductsPage() {
  const [searchTerm, setSearchTerm] = useState('');
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
    mutationFn: (data) => base44.entities.Product.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['products']);
      setShowForm(false);
      setEditingProduct(null);
      toast.success('Produto criado com sucesso!');
    }
  });

  const updateProductMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Product.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['products']);
      setShowForm(false);
      setEditingProduct(null);
      toast.success('Produto atualizado!');
    }
  });

  const deleteProductMutation = useMutation({
    mutationFn: (id) => base44.entities.Product.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['products']);
      toast.success('Produto excluído!');
    }
  });

  const filteredProducts = products.filter(p => 
    p.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.code?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleDelete = (id) => {
    if (confirm('Deseja excluir este produto?')) {
      deleteProductMutation.mutate(id);
    }
  };

  return (
    <div className="pb-20 lg:pb-6 space-y-6">
      <PageHeader
        title="Produtos"
        subtitle="Gerencie o catálogo de produtos"
        actionLabel="Novo Produto"
        onAction={() => {
          setEditingProduct(null);
          setShowForm(true);
        }}
      />

      <div className="flex items-center gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
          <Input
            placeholder="Buscar por nome, código ou descrição..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredProducts.map(product => (
          <Card key={product.id}>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <CardTitle className="text-base">{product.name}</CardTitle>
                  {product.code && (
                    <p className="text-sm text-slate-500 mt-1">Cód: {product.code}</p>
                  )}
                </div>
                <Badge variant={product.is_active ? 'default' : 'secondary'}>
                  {product.is_active ? 'Ativo' : 'Inativo'}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {product.description && (
                <p className="text-sm text-slate-600">{product.description}</p>
              )}
              
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <p className="text-slate-500">Categoria</p>
                  <p className="font-medium">{product.category || '-'}</p>
                </div>
                <div>
                  <p className="text-slate-500">Unidade</p>
                  <p className="font-medium">{product.unit || 'kg'}</p>
                </div>
              </div>

              <div className="pt-3 border-t">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-slate-500">Preço Base</span>
                  <span className="font-semibold text-emerald-600">
                    R$ {(product.base_price_per_kg || 0).toFixed(2)}/kg
                  </span>
                </div>
                {product.weight_per_meter > 0 && (
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-500">Peso/metro</span>
                    <span>{product.weight_per_meter} kg/mt</span>
                  </div>
                )}
              </div>

              <div className="flex gap-2 pt-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1"
                  onClick={() => {
                    setEditingProduct(product);
                    setShowForm(true);
                  }}
                >
                  <Edit className="w-4 h-4 mr-1" />
                  Editar
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDelete(product.id)}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredProducts.length === 0 && (
        <Card>
          <CardContent className="pt-8 pb-8 text-center">
            <Package className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-500">
              {searchTerm ? 'Nenhum produto encontrado' : 'Nenhum produto cadastrado'}
            </p>
          </CardContent>
        </Card>
      )}

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
    weight_per_meter: product?.weight_per_meter || '',
    ipi_rate: product?.ipi_rate || '',
    base_price_per_kg: product?.base_price_per_kg || '',
    cost_per_kg: product?.cost_per_kg || '',
    is_active: product?.is_active !== false
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    const data = {
      ...formData,
      weight_per_meter: parseFloat(formData.weight_per_meter) || 0,
      ipi_rate: parseFloat(formData.ipi_rate) || 0,
      base_price_per_kg: parseFloat(formData.base_price_per_kg),
      cost_per_kg: parseFloat(formData.cost_per_kg) || 0
    };
    onSave(data);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Representado *</Label>
          <Select value={formData.principal_id} onValueChange={(v) => setFormData(prev => ({ ...prev, principal_id: v }))}>
            <SelectTrigger>
              <SelectValue placeholder="Selecione" />
            </SelectTrigger>
            <SelectContent>
              {principals.map(p => (
                <SelectItem key={p.id} value={p.id}>{p.trade_name || p.company_name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Código</Label>
          <Input value={formData.code} onChange={(e) => setFormData(prev => ({ ...prev, code: e.target.value }))} />
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

        <div className="space-y-2">
          <Label>Peso/metro (kg/mt)</Label>
          <Input type="number" step="0.01" value={formData.weight_per_meter} onChange={(e) => setFormData(prev => ({ ...prev, weight_per_meter: e.target.value }))} />
        </div>

        <div className="space-y-2">
          <Label>IPI (%)</Label>
          <Input type="number" step="0.01" value={formData.ipi_rate} onChange={(e) => setFormData(prev => ({ ...prev, ipi_rate: e.target.value }))} />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Preço Base (R$/kg) *</Label>
          <Input type="number" step="0.01" value={formData.base_price_per_kg} onChange={(e) => setFormData(prev => ({ ...prev, base_price_per_kg: e.target.value }))} required />
        </div>

        <div className="space-y-2">
          <Label>Custo (R$/kg)</Label>
          <Input type="number" step="0.01" value={formData.cost_per_kg} onChange={(e) => setFormData(prev => ({ ...prev, cost_per_kg: e.target.value }))} />
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
        <Button type="submit" className="bg-[#1DB954] hover:bg-[#15803d]">
          Salvar Produto
        </Button>
      </div>
    </form>
  );
}