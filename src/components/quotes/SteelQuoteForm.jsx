import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { 
  Plus, 
  Trash2, 
  Save, 
  X,
  Search,
  Package,
  AlertCircle,
  Calculator,
  Shield,
  Building2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { getICMSRate, getIPIRate, calculateItemTotals, calculateQuoteTotals, validateQuote } from '@/components/utils/steelCalculations';
import { toast } from 'sonner';

const STATES = [
  'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA', 
  'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN', 
  'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO'
];

export default function SteelQuoteForm({ quote, clientId, onSave, onCancel, isLoading }) {
  const [formData, setFormData] = useState({
    client_id: quote?.client_id || clientId || '',
    client_state: quote?.client_state || '',
    principal_id: quote?.principal_id || '',
    items: quote?.items || [],
    freight_type: quote?.freight_type || 'FOB',
    freight_value: quote?.freight_value || 0,
    payment_terms: quote?.payment_terms || '',
    validity_days: quote?.validity_days || 7,
    notes: quote?.notes || '',
    status: quote?.status || 'draft'
  });

  const [showProductPicker, setShowProductPicker] = useState(false);
  const [productSearch, setProductSearch] = useState('');
  const [validationErrors, setValidationErrors] = useState([]);

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
      ? base44.entities.Product.filter({ principal_id: formData.principal_id, is_active: true }, 'name', 500)
      : [],
    enabled: !!formData.principal_id
  });

  const { data: representative = [] } = useQuery({
    queryKey: ['representative'],
    queryFn: () => base44.entities.Representative.list('-created_date', 1)
  });

  // Auto-populate client data when selected
  useEffect(() => {
    if (formData.client_id && clients.length > 0) {
      const client = clients.find(c => c.id === formData.client_id);
      if (client && !formData.client_state) {
        setFormData(prev => ({
          ...prev,
          client_state: client.state || ''
        }));
      }
    }
  }, [formData.client_id, clients]);

  // Recalculate all items when client state changes
  useEffect(() => {
    if (formData.client_state && formData.items.length > 0) {
      const recalculatedItems = formData.items.map(item => {
        const product = products.find(p => p.id === item.product_id);
        const icmsRate = getICMSRate(formData.client_state, product?.is_imported);
        
        try {
          const calculated = calculateItemTotals({
            ...item,
            icms_rate: icmsRate
          });
          return { ...item, ...calculated, icms_rate: icmsRate };
        } catch {
          return item;
        }
      });

      setFormData(prev => ({ ...prev, items: recalculatedItems }));
    }
  }, [formData.client_state]);

  const addProduct = (product) => {
    if (!formData.client_state) {
      toast.error('Selecione o estado do cliente primeiro');
      return;
    }

    const icmsRate = getICMSRate(formData.client_state, product.is_imported);
    const ipiRate = getIPIRate(product.category);

    const newItem = {
      product_id: product.id,
      product_code: product.code || '',
      product_name: product.name,
      description: product.description || '',
      category: product.category,
      ncm: product.ncm || '',
      unit: product.unit || 'kg',
      quantity: product.min_quantity || 1,
      weight_per_meter: product.weight_per_meter || 0,
      total_weight: 0,
      base_price_per_kg: product.base_price_per_kg || 0,
      cost_per_kg: product.cost_per_kg || 0,
      icms_rate: icmsRate,
      icms_st_rate: product.icms_st_rate || 0,
      ipi_rate: ipiRate,
      price_per_kg: 0,
      item_subtotal: 0,
      icms_value: 0,
      ipi_value: 0,
      item_total: 0,
      delivery_days: 0
    };

    // Calculate immediately if possible
    if (newItem.unit === 'kg') {
      newItem.total_weight = newItem.quantity;
    } else if (newItem.unit === 'mt' && newItem.weight_per_meter > 0) {
      newItem.total_weight = newItem.quantity * newItem.weight_per_meter;
    }

    if (newItem.total_weight > 0) {
      try {
        const calculated = calculateItemTotals(newItem);
        Object.assign(newItem, calculated);
      } catch (error) {
        console.error('Error calculating item:', error);
      }
    }

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

    // Recalculate when relevant fields change
    if (['quantity', 'unit', 'weight_per_meter', 'total_weight'].includes(field)) {
      try {
        const calculated = calculateItemTotals(newItems[index]);
        Object.assign(newItems[index], calculated);
      } catch (error) {
        console.error('Error calculating item:', error);
      }
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
    
    // Build complete quote data
    const client = clients.find(c => c.id === formData.client_id);
    const principal = principals.find(p => p.id === formData.principal_id);
    const rep = representative[0];

    const quoteData = {
      ...formData,
      client_name: client?.trade_name || client?.company_name,
      client_cnpj: client?.cnpj,
      client_state_registration: client?.state_registration,
      client_address: client?.address,
      client_city: client?.city,
      client_phone: client?.phone,
      client_contact: client?.contact_name,
      principal_name: principal?.trade_name || principal?.company_name,
      principal_cnpj: principal?.cnpj,
      principal_state_registration: principal?.state_registration,
      principal_address: principal?.address,
      principal_city: principal?.city,
      principal_state: principal?.state,
      principal_phone: principal?.phone,
      principal_logo_url: principal?.logo_url,
      representative_name: rep?.name,
      representative_document: rep?.document,
      representative_logo_url: rep?.logo_url,
      ...calculateQuoteTotals(formData.items, formData.freight_value || 0)
    };

    // Validate
    const validation = validateQuote(quoteData);
    if (!validation.isValid) {
      setValidationErrors(validation.errors);
      toast.error('Corrija os erros antes de salvar');
      return;
    }

    setValidationErrors([]);
    onSave(quoteData);
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

  const totals = calculateQuoteTotals(formData.items, formData.freight_value || 0);

  const getCategoryLabel = (category) => {
    const labels = {
      tubos_quadrados_retangulares: 'Tubos Quad/Ret',
      chapas: 'Chapas',
      tubos_redondos: 'Tubos Redondos',
      perfis: 'Perfis',
      vigas: 'Vigas',
      cantoneiras: 'Cantoneiras'
    };
    return labels[category] || category;
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Validation Errors */}
      {validationErrors.length > 0 && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            <ul className="list-disc list-inside space-y-1">
              {validationErrors.map((error, i) => (
                <li key={i}>{error}</li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
      )}

      {/* Representado Selection - CRÍTICO */}
      <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-4">
        <div className="flex items-center gap-2 mb-3">
          <Shield className="w-5 h-5 text-blue-600" />
          <Label className="text-blue-900 font-semibold">Representado (Obrigatório)</Label>
        </div>
        <Select 
          value={formData.principal_id} 
          onValueChange={(v) => {
            setFormData({ ...formData, principal_id: v, items: [] });
            toast.info('Estoque atualizado para o representado selecionado');
          }}
        >
          <SelectTrigger>
            <SelectValue placeholder="⚠️ Selecione o representado" />
          </SelectTrigger>
          <SelectContent>
            {principals.map(principal => (
              <SelectItem key={principal.id} value={principal.id}>
                {principal.trade_name || principal.company_name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {!formData.principal_id && (
          <p className="text-xs text-red-600 mt-2">⚠️ Cada representado possui estoque independente</p>
        )}
      </div>

      {/* Client and State Selection */}
      <div className="grid sm:grid-cols-3 gap-4">
        <div className="space-y-2 sm:col-span-2">
          <Label>Cliente *</Label>
          <Select value={formData.client_id} onValueChange={(v) => setFormData({ ...formData, client_id: v })}>
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
          <Label>Estado (UF) *</Label>
          <Select value={formData.client_state} onValueChange={(v) => setFormData({ ...formData, client_state: v })}>
            <SelectTrigger>
              <SelectValue placeholder="UF" />
            </SelectTrigger>
            <SelectContent>
              {STATES.map(state => (
                <SelectItem key={state} value={state}>{state}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* ICMS Info */}
      {formData.client_state && (
        <Alert>
          <Calculator className="h-4 w-4" />
          <AlertDescription>
            ICMS automático para {formData.client_state}: <strong>{getICMSRate(formData.client_state)}%</strong>
            {' '}(produtos importados: 4%)
          </AlertDescription>
        </Alert>
      )}

      {/* Items */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Label>Itens do Orçamento</Label>
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() => setShowProductPicker(true)}
            disabled={!formData.principal_id || !formData.client_state}
          >
            <Plus className="w-4 h-4 mr-1" />
            Adicionar Produto
          </Button>
        </div>

        {!formData.principal_id && (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>Selecione o representado primeiro</AlertDescription>
          </Alert>
        )}

        {!formData.client_state && formData.principal_id && (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>Selecione o estado do cliente para calcular ICMS</AlertDescription>
          </Alert>
        )}

        {formData.items.length === 0 && formData.principal_id && formData.client_state && (
          <div className="bg-slate-50 rounded-xl p-8 text-center">
            <Package className="w-10 h-10 text-slate-300 mx-auto mb-2" />
            <p className="text-sm text-slate-500">Adicione produtos ao orçamento</p>
          </div>
        )}

        {/* Items Table */}
        {formData.items.length > 0 && (
          <div className="border rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 border-b">
                  <tr>
                    <th className="text-left p-2 font-medium">Código</th>
                    <th className="text-left p-2 font-medium">Descrição</th>
                    <th className="text-left p-2 font-medium">Unid</th>
                    <th className="text-right p-2 font-medium">Qtd</th>
                    <th className="text-right p-2 font-medium">Peso/mt</th>
                    <th className="text-right p-2 font-medium">Peso Total</th>
                    <th className="text-right p-2 font-medium">R$/kg</th>
                    <th className="text-center p-2 font-medium">ICMS</th>
                    <th className="text-center p-2 font-medium">IPI</th>
                    <th className="text-right p-2 font-medium">Total</th>
                    <th className="text-center p-2 font-medium">Prazo</th>
                    <th className="p-2"></th>
                  </tr>
                </thead>
                <tbody>
                  {formData.items.map((item, index) => (
                    <tr key={index} className="border-b hover:bg-slate-50">
                      <td className="p-2">
                        <div className="text-xs font-mono">{item.product_code}</div>
                        <div className="flex flex-wrap gap-1 mt-1">
                          <Badge variant="outline" className="text-[10px]">
                            {getCategoryLabel(item.category)}
                          </Badge>
                          {item.icms_st_rate > 0 && (
                            <Badge className="bg-orange-100 text-orange-700 text-[10px]">
                              ST {item.icms_st_rate}%
                            </Badge>
                          )}
                        </div>
                      </td>
                      <td className="p-2">
                        <div className="font-medium">{item.product_name}</div>
                        {item.description && (
                          <div className="text-xs text-slate-500">{item.description}</div>
                        )}
                      </td>
                      <td className="p-2">
                        <Select
                          value={item.unit}
                          onValueChange={(v) => updateItem(index, 'unit', v)}
                        >
                          <SelectTrigger className="w-16 h-8">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="kg">KG</SelectItem>
                            <SelectItem value="mt">MT</SelectItem>
                            <SelectItem value="pc">PÇ</SelectItem>
                          </SelectContent>
                        </Select>
                      </td>
                      <td className="p-2">
                        <Input
                          type="number"
                          min="0"
                          step="0.01"
                          value={item.quantity}
                          onChange={(e) => updateItem(index, 'quantity', parseFloat(e.target.value) || 0)}
                          className="w-20 h-8 text-right"
                        />
                      </td>
                      <td className="p-2 text-right">
                        {item.unit === 'mt' ? (
                          <span className="text-slate-600">{item.weight_per_meter?.toFixed(2)}</span>
                        ) : (
                          <span className="text-slate-400">-</span>
                        )}
                      </td>
                      <td className="p-2">
                        {item.unit === 'pc' ? (
                          <Input
                            type="number"
                            min="0"
                            step="0.01"
                            value={item.total_weight}
                            onChange={(e) => updateItem(index, 'total_weight', parseFloat(e.target.value) || 0)}
                            className="w-24 h-8 text-right"
                            placeholder="Manual"
                          />
                        ) : (
                          <span className="font-semibold">{item.total_weight?.toFixed(2)}</span>
                        )}
                      </td>
                      <td className="p-2 text-right font-medium">
                        {formatCurrency(item.price_per_kg)}
                      </td>
                      <td className="p-2 text-center">
                        <Badge className="bg-blue-100 text-blue-700 text-[10px]">
                          {item.icms_rate}%
                        </Badge>
                      </td>
                      <td className="p-2 text-center">
                        <Badge className="bg-purple-100 text-purple-700 text-[10px]">
                          {item.ipi_rate}%
                        </Badge>
                      </td>
                      <td className="p-2 text-right font-bold text-emerald-600">
                        {formatCurrency(item.item_total)}
                      </td>
                      <td className="p-2">
                        <Input
                          type="number"
                          min="0"
                          step="1"
                          value={item.delivery_days}
                          onChange={(e) => updateItem(index, 'delivery_days', parseInt(e.target.value) || 0)}
                          className="w-16 h-8 text-center"
                          placeholder="0"
                        />
                      </td>
                      <td className="p-2">
                        <Button
                          type="button"
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8"
                          onClick={() => removeItem(index)}
                        >
                          <Trash2 className="w-4 h-4 text-red-500" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Totals */}
      {formData.items.length > 0 && (
        <div className="bg-slate-50 rounded-xl p-4 space-y-3">
          <div className="grid sm:grid-cols-3 gap-4 mb-4">
            <div className="space-y-2">
              <Label>Tipo de Frete</Label>
              <Select 
                value={formData.freight_type} 
                onValueChange={(v) => setFormData({ ...formData, freight_type: v })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="FOB">FOB (Por conta do Cliente)</SelectItem>
                  <SelectItem value="CIF">CIF (Por conta do Vendedor)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Valor do Frete</Label>
              <Input
                type="number"
                min="0"
                step="0.01"
                value={formData.freight_value}
                onChange={(e) => setFormData({ ...formData, freight_value: parseFloat(e.target.value) || 0 })}
                placeholder="R$ 0,00"
              />
            </div>
            <div className="space-y-2">
              <Label>Condições de Pagamento</Label>
              <Input
                value={formData.payment_terms}
                onChange={(e) => setFormData({ ...formData, payment_terms: e.target.value })}
                placeholder="Ex: 28/35/42 dias"
              />
            </div>
          </div>

          <div className="border-t pt-3 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-slate-600">Subtotal Produtos:</span>
              <span className="font-semibold">{formatCurrency(totals.products_subtotal)}</span>
            </div>
            <div className="flex justify-between text-sm text-blue-700">
              <span>Total ICMS (incluso):</span>
              <span className="font-semibold">{formatCurrency(totals.total_icms)}</span>
            </div>
            <div className="flex justify-between text-sm text-purple-700">
              <span>Total IPI:</span>
              <span className="font-semibold">+ {formatCurrency(totals.total_ipi)}</span>
            </div>
            {formData.freight_value > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-slate-600">Frete:</span>
                <span className="font-semibold">+ {formatCurrency(formData.freight_value)}</span>
              </div>
            )}
            <div className="flex justify-between text-xl font-bold pt-2 border-t">
              <span>Valor Total:</span>
              <span className="text-emerald-600">{formatCurrency(totals.total_value)}</span>
            </div>
          </div>
        </div>
      )}

      {/* Additional Info */}
      <div className="grid sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Validade (dias)</Label>
          <Input
            type="number"
            min="1"
            value={formData.validity_days}
            onChange={(e) => setFormData({ ...formData, validity_days: parseInt(e.target.value) || 7 })}
          />
        </div>
        <div className="space-y-2">
          <Label>Observações</Label>
          <Textarea
            value={formData.notes}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            rows={2}
            placeholder="Observações do orçamento..."
          />
        </div>
      </div>

      {/* Actions */}
      <div className="flex justify-end gap-3 pt-4 border-t">
        <Button type="button" variant="outline" onClick={onCancel}>
          <X className="w-4 h-4 mr-2" />
          Cancelar
        </Button>
        <Button 
          type="submit" 
          disabled={isLoading || !formData.client_id || !formData.principal_id || !formData.client_state || formData.items.length === 0}
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
            <DialogTitle>
              <div className="flex items-center gap-2">
                <Building2 className="w-5 h-5" />
                Produtos - {principals.find(p => p.id === formData.principal_id)?.trade_name}
              </div>
            </DialogTitle>
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
            <div className="max-h-96 overflow-y-auto space-y-2">
              {filteredProducts.length > 0 ? (
                filteredProducts.map(product => (
                  <div
                    key={product.id}
                    className="p-3 rounded-lg border border-slate-200 hover:bg-slate-50 cursor-pointer transition-colors"
                    onClick={() => addProduct(product)}
                  >
                    <div className="flex justify-between items-start mb-1">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                               <p className="font-medium text-slate-900">{product.name}</p>
                               <Badge variant="outline" className="text-[10px]">
                                 {getCategoryLabel(product.category)}
                               </Badge>
                               {product.icms_st_rate > 0 && (
                                 <Badge className="bg-orange-100 text-orange-700 text-[10px]">
                                   ICMS ST {product.icms_st_rate}%
                                 </Badge>
                               )}
                             </div>
                        {product.code && (
                          <p className="text-xs text-slate-500 font-mono">Cód: {product.code}</p>
                        )}
                      </div>
                      <div className="text-right">
                        <span className="text-sm font-semibold text-emerald-600">
                          {formatCurrency(product.base_price_per_kg)}/kg
                        </span>
                        <p className="text-xs text-slate-500">c/ ICMS 18%</p>
                      </div>
                    </div>
                    {product.weight_per_meter > 0 && (
                      <p className="text-xs text-slate-500">Peso: {product.weight_per_meter} kg/mt</p>
                    )}
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