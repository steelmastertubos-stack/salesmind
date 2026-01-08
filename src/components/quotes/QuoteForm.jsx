import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { 
  Plus, 
  Trash2, 
  Save, 
  X,
  Search,
  Package
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

export default function QuoteForm({ quote, clientId, onSave, onCancel, isLoading }) {
  const [formData, setFormData] = useState({
    client_id: quote?.client_id || clientId || '',
    client_name: quote?.client_name || '',
    principal_id: quote?.principal_id || '',
    principal_name: quote?.principal_name || '',
    items: quote?.items || [],
    subtotal: quote?.subtotal || 0,
    tax_rate: quote?.tax_rate || 0,
    tax_value: quote?.tax_value || 0,
    freight_type: quote?.freight_type || 'cif',
    freight_value: quote?.freight_value || 0,
    discount_percentage: quote?.discount_percentage || 0,
    discount_value: quote?.discount_value || 0,
    total_value: quote?.total_value || 0,
    total_weight: quote?.total_weight || 0,
    payment_terms: quote?.payment_terms || '',
    validity_days: quote?.validity_days || 7,
    notes: quote?.notes || '',
    status: quote?.status || 'draft'
  });

  const [showProductPicker, setShowProductPicker] = useState(false);
  const [productSearch, setProductSearch] = useState('');

  const { data: clients = [] } = useQuery({
    queryKey: ['clients'],
    queryFn: () => base44.entities.Client.list('company_name', 500)
  });

  const { data: principals = [] } = useQuery({
    queryKey: ['principals'],
    queryFn: () => base44.entities.Principal.list('company_name', 100)
  });

  const { data: products = [] } = useQuery({
    queryKey: ['products', formData.principal_id],
    queryFn: () => formData.principal_id 
      ? base44.entities.Product.filter({ principal_id: formData.principal_id }, 'name', 500)
      : [],
    enabled: !!formData.principal_id
  });

  useEffect(() => {
    if (clientId && clients.length > 0) {
      const client = clients.find(c => c.id === clientId);
      if (client) {
        setFormData(prev => ({
          ...prev,
          client_id: clientId,
          client_name: client.trade_name || client.company_name
        }));
      }
    }
  }, [clientId, clients]);

  useEffect(() => {
    calculateTotals();
  }, [formData.items, formData.tax_rate, formData.freight_value, formData.discount_percentage]);

  const calculateTotals = () => {
    const subtotal = formData.items.reduce((sum, item) => sum + (item.total_price || 0), 0);
    const totalWeight = formData.items.reduce((sum, item) => sum + (item.weight || 0), 0);
    const taxValue = subtotal * (formData.tax_rate / 100);
    const discountValue = subtotal * (formData.discount_percentage / 100);
    const totalValue = subtotal + taxValue + formData.freight_value - discountValue;

    setFormData(prev => ({
      ...prev,
      subtotal,
      total_weight: totalWeight,
      tax_value: taxValue,
      discount_value: discountValue,
      total_value: Math.max(0, totalValue)
    }));
  };

  const handleClientChange = (clientId) => {
    const client = clients.find(c => c.id === clientId);
    setFormData(prev => ({
      ...prev,
      client_id: clientId,
      client_name: client?.trade_name || client?.company_name || ''
    }));
  };

  const handlePrincipalChange = (principalId) => {
    const principal = principals.find(p => p.id === principalId);
    setFormData(prev => ({
      ...prev,
      principal_id: principalId,
      principal_name: principal?.trade_name || principal?.company_name || '',
      tax_rate: principal?.default_tax_rate || 0,
      freight_type: principal?.freight_policy || 'cif',
      payment_terms: principal?.payment_terms || '',
      items: []
    }));
  };

  const addProduct = (product) => {
    const newItem = {
      product_id: product.id,
      product_code: product.code || '',
      product_name: product.name,
      description: product.description || '',
      quantity: product.min_quantity || 1,
      unit: product.unit || 'un',
      weight: (product.weight_per_unit || 0) * (product.min_quantity || 1),
      unit_price: product.price || 0,
      total_price: (product.price || 0) * (product.min_quantity || 1)
    };

    setFormData(prev => ({
      ...prev,
      items: [...prev.items, newItem]
    }));
    setShowProductPicker(false);
    setProductSearch('');
  };

  const updateItem = (index, field, value) => {
    const newItems = [...formData.items];
    newItems[index] = { ...newItems[index], [field]: value };

    if (field === 'quantity' || field === 'unit_price') {
      const quantity = field === 'quantity' ? value : newItems[index].quantity;
      const unitPrice = field === 'unit_price' ? value : newItems[index].unit_price;
      newItems[index].total_price = quantity * unitPrice;
    }

    setFormData(prev => ({ ...prev, items: newItems }));
  };

  const removeItem = (index) => {
    setFormData(prev => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value || 0);
  };

  const filteredProducts = products.filter(p => 
    p.name?.toLowerCase().includes(productSearch.toLowerCase()) ||
    p.code?.toLowerCase().includes(productSearch.toLowerCase())
  );

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Client and Principal Selection */}
      <div className="grid sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Cliente *</Label>
          <Select value={formData.client_id} onValueChange={handleClientChange}>
            <SelectTrigger>
              <SelectValue placeholder="Selecione o cliente" />
            </SelectTrigger>
            <SelectContent>
              {clients.map(client => (
                <SelectItem key={client.id} value={client.id}>
                  {client.trade_name || client.company_name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Representado *</Label>
          <Select value={formData.principal_id} onValueChange={handlePrincipalChange}>
            <SelectTrigger>
              <SelectValue placeholder="Selecione o representado" />
            </SelectTrigger>
            <SelectContent>
              {principals.map(principal => (
                <SelectItem key={principal.id} value={principal.id}>
                  {principal.trade_name || principal.company_name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Items */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Label>Itens do Orçamento</Label>
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() => setShowProductPicker(true)}
            disabled={!formData.principal_id}
          >
            <Plus className="w-4 h-4 mr-1" />
            Adicionar Produto
          </Button>
        </div>

        {formData.items.length === 0 ? (
          <div className="bg-slate-50 rounded-xl p-8 text-center">
            <Package className="w-10 h-10 text-slate-300 mx-auto mb-2" />
            <p className="text-sm text-slate-500">
              {formData.principal_id 
                ? 'Adicione produtos ao orçamento' 
                : 'Selecione um representado para adicionar produtos'}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {formData.items.map((item, index) => (
              <div key={index} className="bg-slate-50 rounded-xl p-4">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <p className="font-medium text-slate-900">{item.product_name}</p>
                    {item.description && (
                      <p className="text-xs text-slate-500">{item.description}</p>
                    )}
                  </div>
                  <Button
                    type="button"
                    size="icon"
                    variant="ghost"
                    className="h-8 w-8 text-red-500 hover:text-red-700"
                    onClick={() => removeItem(index)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                  <div className="space-y-1">
                    <Label className="text-xs">Qtd</Label>
                    <Input
                      type="number"
                      min="0"
                      step="0.01"
                      value={item.quantity}
                      onChange={(e) => updateItem(index, 'quantity', parseFloat(e.target.value) || 0)}
                      className="h-9"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Unidade</Label>
                    <Input
                      value={item.unit}
                      onChange={(e) => updateItem(index, 'unit', e.target.value)}
                      className="h-9"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Preço Unit.</Label>
                    <Input
                      type="number"
                      min="0"
                      step="0.01"
                      value={item.unit_price}
                      onChange={(e) => updateItem(index, 'unit_price', parseFloat(e.target.value) || 0)}
                      className="h-9"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Total</Label>
                    <div className="h-9 bg-white rounded-md border px-3 flex items-center text-sm font-medium">
                      {formatCurrency(item.total_price)}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Totals */}
      {formData.items.length > 0 && (
        <div className="bg-slate-50 rounded-xl p-4 space-y-3">
          <div className="grid sm:grid-cols-3 gap-4">
            <div className="space-y-1">
              <Label className="text-xs">% Impostos</Label>
              <Input
                type="number"
                min="0"
                step="0.01"
                value={formData.tax_rate}
                onChange={(e) => setFormData({ ...formData, tax_rate: parseFloat(e.target.value) || 0 })}
                className="h-9"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Frete</Label>
              <Input
                type="number"
                min="0"
                step="0.01"
                value={formData.freight_value}
                onChange={(e) => setFormData({ ...formData, freight_value: parseFloat(e.target.value) || 0 })}
                className="h-9"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">% Desconto</Label>
              <Input
                type="number"
                min="0"
                max="100"
                step="0.1"
                value={formData.discount_percentage}
                onChange={(e) => setFormData({ ...formData, discount_percentage: parseFloat(e.target.value) || 0 })}
                className="h-9"
              />
            </div>
          </div>

          <div className="border-t pt-3 space-y-1.5">
            <div className="flex justify-between text-sm">
              <span className="text-slate-500">Subtotal:</span>
              <span>{formatCurrency(formData.subtotal)}</span>
            </div>
            {formData.tax_value > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Impostos ({formData.tax_rate}%):</span>
                <span>+ {formatCurrency(formData.tax_value)}</span>
              </div>
            )}
            {formData.freight_value > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Frete:</span>
                <span>+ {formatCurrency(formData.freight_value)}</span>
              </div>
            )}
            {formData.discount_value > 0 && (
              <div className="flex justify-between text-sm text-emerald-600">
                <span>Desconto ({formData.discount_percentage}%):</span>
                <span>- {formatCurrency(formData.discount_value)}</span>
              </div>
            )}
            <div className="flex justify-between text-lg font-bold pt-2 border-t">
              <span>Total:</span>
              <span className="text-emerald-600">{formatCurrency(formData.total_value)}</span>
            </div>
          </div>
        </div>
      )}

      {/* Additional Info */}
      <div className="grid sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Condições de Pagamento</Label>
          <Input
            value={formData.payment_terms}
            onChange={(e) => setFormData({ ...formData, payment_terms: e.target.value })}
            placeholder="Ex: 30/60/90 dias"
          />
        </div>
        <div className="space-y-2">
          <Label>Validade (dias)</Label>
          <Input
            type="number"
            min="1"
            value={formData.validity_days}
            onChange={(e) => setFormData({ ...formData, validity_days: parseInt(e.target.value) || 7 })}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label>Observações</Label>
        <Textarea
          value={formData.notes}
          onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
          rows={3}
          placeholder="Observações do orçamento..."
        />
      </div>

      {/* Actions */}
      <div className="flex justify-end gap-3 pt-4 border-t">
        <Button type="button" variant="outline" onClick={onCancel}>
          <X className="w-4 h-4 mr-2" />
          Cancelar
        </Button>
        <Button 
          type="submit" 
          disabled={isLoading || !formData.client_id || !formData.principal_id || formData.items.length === 0}
          className="bg-[#1e3a5f] hover:bg-[#2d4a6f]"
        >
          <Save className="w-4 h-4 mr-2" />
          {isLoading ? 'Salvando...' : 'Salvar Orçamento'}
        </Button>
      </div>

      {/* Product Picker Dialog */}
      <Dialog open={showProductPicker} onOpenChange={setShowProductPicker}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Adicionar Produto</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                placeholder="Buscar produto..."
                value={productSearch}
                onChange={(e) => setProductSearch(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="max-h-64 overflow-y-auto space-y-2">
              {filteredProducts.length > 0 ? (
                filteredProducts.map(product => (
                  <div
                    key={product.id}
                    className="p-3 rounded-lg border border-slate-200 hover:bg-slate-50 cursor-pointer transition-colors"
                    onClick={() => addProduct(product)}
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-medium text-slate-900">{product.name}</p>
                        {product.code && (
                          <p className="text-xs text-slate-500">Cód: {product.code}</p>
                        )}
                      </div>
                      <span className="text-sm font-semibold text-emerald-600">
                        {formatCurrency(product.price)}
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-slate-500">
                  <Package className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">Nenhum produto encontrado</p>
                </div>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </form>
  );
}