import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Switch } from '@/components/ui/switch';
import { LayoutGrid, BarChart3, TrendingUp, Users, DollarSign, Package, Target, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

const AVAILABLE_KPIS = [
  { id: 'total_orders', name: 'Total de Pedidos', icon: Package, category: 'vendas' },
  { id: 'total_value', name: 'Faturamento Total', icon: DollarSign, category: 'vendas' },
  { id: 'avg_ticket', name: 'Ticket Médio', icon: TrendingUp, category: 'vendas' },
  { id: 'conversion_rate', name: 'Taxa de Conversão', icon: Target, category: 'vendas' },
  { id: 'total_quotes', name: 'Orçamentos Emitidos', icon: BarChart3, category: 'vendas' },
  { id: 'active_opportunities', name: 'Oportunidades Ativas', icon: Target, category: 'crm' },
  { id: 'new_clients', name: 'Novos Clientes', icon: Users, category: 'crm' },
  { id: 'clients_at_risk', name: 'Clientes em Risco', icon: AlertCircle, category: 'crm' },
  { id: 'total_commission', name: 'Comissões Totais', icon: DollarSign, category: 'financeiro' },
  { id: 'commission_pending', name: 'Comissões Pendentes', icon: AlertCircle, category: 'financeiro' },
  { id: 'margin_avg', name: 'Margem Média', icon: TrendingUp, category: 'financeiro' },
  { id: 'total_weight', name: 'Peso Total Vendido', icon: Package, category: 'operacional' }
];

const AVAILABLE_CHARTS = [
  { id: 'monthly_evolution', name: 'Evolução Mensal', category: 'vendas' },
  { id: 'sales_by_principal', name: 'Vendas por Representada', category: 'vendas' },
  { id: 'sales_by_client', name: 'Top Clientes', category: 'vendas' },
  { id: 'funnel_analysis', name: 'Funil de Vendas', category: 'crm' },
  { id: 'client_status', name: 'Status dos Clientes', category: 'crm' },
  { id: 'commission_timeline', name: 'Timeline de Comissões', category: 'financeiro' },
  { id: 'product_performance', name: 'Performance de Produtos', category: 'operacional' },
  { id: 'seasonality', name: 'Sazonalidade', category: 'vendas' }
];

export default function DashboardConfigurator({ open, onClose, dashboard = null, onSave, currentUser }) {
  const [formData, setFormData] = useState(dashboard || {
    name: '',
    description: '',
    dashboard_type: 'personalizado',
    is_shared: false,
    selected_kpis: [],
    selected_charts: [],
    is_favorite: false
  });

  const handleSubmit = () => {
    if (!formData.name?.trim()) {
      toast.error('Nome do dashboard é obrigatório');
      return;
    }

    if (formData.selected_kpis.length === 0 && formData.selected_charts.length === 0) {
      toast.error('Selecione pelo menos 1 KPI ou gráfico');
      return;
    }

    onSave({
      ...formData,
      owner_email: currentUser?.email
    });
  };

  const toggleKPI = (kpiId) => {
    const selected = formData.selected_kpis || [];
    setFormData({
      ...formData,
      selected_kpis: selected.includes(kpiId)
        ? selected.filter(id => id !== kpiId)
        : [...selected, kpiId]
    });
  };

  const toggleChart = (chartId) => {
    const selected = formData.selected_charts || [];
    setFormData({
      ...formData,
      selected_charts: selected.includes(chartId)
        ? selected.filter(id => id !== chartId)
        : [...selected, chartId]
    });
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {dashboard ? 'Editar Dashboard' : 'Criar Dashboard Personalizado'}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Informações básicas */}
          <div className="space-y-4">
            <div>
              <Label>Nome do Dashboard *</Label>
              <Input
                placeholder="Ex: Dashboard de Vendas, Dashboard Pós-venda..."
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>

            <div>
              <Label>Descrição</Label>
              <Textarea
                placeholder="Objetivo e uso deste dashboard..."
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={2}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Tipo</Label>
                <Select value={formData.dashboard_type} onValueChange={(v) => setFormData({ ...formData, dashboard_type: v })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="vendas">Vendas</SelectItem>
                    <SelectItem value="pos_venda">Pós-venda</SelectItem>
                    <SelectItem value="financeiro">Financeiro</SelectItem>
                    <SelectItem value="operacional">Operacional</SelectItem>
                    <SelectItem value="executivo">Executivo</SelectItem>
                    <SelectItem value="personalizado">Personalizado</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-3 pt-6">
                <div className="flex items-center gap-2">
                  <Switch
                    checked={formData.is_shared}
                    onCheckedChange={(v) => setFormData({ ...formData, is_shared: v })}
                  />
                  <Label className="text-sm">Compartilhar com equipe</Label>
                </div>
                <div className="flex items-center gap-2">
                  <Switch
                    checked={formData.is_favorite}
                    onCheckedChange={(v) => setFormData({ ...formData, is_favorite: v })}
                  />
                  <Label className="text-sm">Marcar como favorito</Label>
                </div>
              </div>
            </div>
          </div>

          {/* Seleção de KPIs */}
          <div>
            <h3 className="font-semibold text-sm mb-3 flex items-center gap-2">
              <TrendingUp className="w-4 h-4" />
              KPIs e Métricas ({formData.selected_kpis?.length || 0} selecionados)
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-64 overflow-y-auto p-2 border rounded-lg bg-slate-50">
              {AVAILABLE_KPIS.map(kpi => {
                const Icon = kpi.icon;
                const isSelected = formData.selected_kpis?.includes(kpi.id);
                return (
                  <div
                    key={kpi.id}
                    onClick={() => toggleKPI(kpi.id)}
                    className={`
                      flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-all
                      ${isSelected 
                        ? 'bg-[#0F2A44] text-white shadow-md' 
                        : 'bg-white hover:bg-slate-100 border border-slate-200'}
                    `}
                  >
                    <Checkbox checked={isSelected} className="pointer-events-none" />
                    <Icon className="w-4 h-4" />
                    <div className="flex-1">
                      <p className="text-sm font-medium">{kpi.name}</p>
                      <p className={`text-xs ${isSelected ? 'text-slate-300' : 'text-slate-500'}`}>
                        {kpi.category}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Seleção de Gráficos */}
          <div>
            <h3 className="font-semibold text-sm mb-3 flex items-center gap-2">
              <BarChart3 className="w-4 h-4" />
              Gráficos e Análises ({formData.selected_charts?.length || 0} selecionados)
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-64 overflow-y-auto p-2 border rounded-lg bg-slate-50">
              {AVAILABLE_CHARTS.map(chart => {
                const isSelected = formData.selected_charts?.includes(chart.id);
                return (
                  <div
                    key={chart.id}
                    onClick={() => toggleChart(chart.id)}
                    className={`
                      flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-all
                      ${isSelected 
                        ? 'bg-[#1DB954] text-white shadow-md' 
                        : 'bg-white hover:bg-slate-100 border border-slate-200'}
                    `}
                  >
                    <Checkbox checked={isSelected} className="pointer-events-none" />
                    <BarChart3 className="w-4 h-4" />
                    <div className="flex-1">
                      <p className="text-sm font-medium">{chart.name}</p>
                      <p className={`text-xs ${isSelected ? 'text-white/80' : 'text-slate-500'}`}>
                        {chart.category}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Ações */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button onClick={handleSubmit} className="bg-[#0F2A44] hover:bg-[#1F4E79]">
              {dashboard ? 'Salvar Alterações' : 'Criar Dashboard'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}