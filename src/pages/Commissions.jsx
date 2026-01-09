import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  DollarSign, 
  Calendar,
  Filter,
  TrendingUp,
  CheckCircle2,
  Clock,
  AlertCircle,
  Edit2,
  Save,
  X
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import PageHeader from '@/components/common/PageHeader';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';

export default function Commissions() {
  const [statusFilter, setStatusFilter] = useState('all');
  const [principalFilter, setPrincipalFilter] = useState('all');
  const [editingId, setEditingId] = useState(null);
  const [editData, setEditData] = useState({});
  const queryClient = useQueryClient();

  const { data: commissions = [], isLoading } = useQuery({
    queryKey: ['commissions'],
    queryFn: () => base44.entities.Commission.list('-created_date', 500)
  });

  const { data: principals = [] } = useQuery({
    queryKey: ['principals'],
    queryFn: () => base44.entities.Principal.list('company_name', 100)
  });

  const { data: orders = [] } = useQuery({
    queryKey: ['orders'],
    queryFn: () => base44.entities.Order.list('-created_date', 500)
  });

  const updateCommissionMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Commission.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['commissions'] });
      setEditingId(null);
      toast.success('Comissão atualizada!');
    }
  });

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value || 0);
  };

  const getStatusConfig = (status) => {
    switch (status) {
      case 'prevista':
      case 'pending':
        return { icon: Clock, color: 'bg-slate-100 text-slate-700', label: 'Prevista' };
      case 'faturada':
      case 'invoiced':
        return { icon: AlertCircle, color: 'bg-blue-100 text-blue-700', label: 'A Faturar' };
      case 'a_receber':
        return { icon: TrendingUp, color: 'bg-amber-100 text-amber-700', label: 'A Receber' };
      case 'recebida':
      case 'paid':
        return { icon: CheckCircle2, color: 'bg-emerald-100 text-emerald-700', label: 'Recebida' };
      case 'atrasada':
        return { icon: AlertCircle, color: 'bg-red-100 text-red-700', label: 'Atrasada' };
      default:
        return { icon: Clock, color: 'bg-slate-100 text-slate-700', label: status };
    }
  };

  const getOrderMargin = (orderId) => {
    const order = orders.find(o => o.id === orderId);
    if (!order || !order.items) return 0;
    
    let totalCost = 0;
    let totalSale = 0;
    order.items.forEach(item => {
      const itemCost = (item.cost_per_kg || 0) * (item.total_weight || item.quantity || 0);
      const itemSale = item.item_total || 0;
      totalCost += itemCost;
      totalSale += itemSale;
    });

    return totalCost > 0 ? ((totalSale - totalCost) / totalCost) * 100 : 0;
  };

  const getPrincipalPaymentDay = (principalId) => {
    const principal = principals.find(p => p.id === principalId);
    return principal?.payment_day || 10; // 10º dia por padrão
  };

  const calculateNextPaymentDate = (invoiceDate, principalId) => {
    if (!invoiceDate) return null;
    const invoice = new Date(invoiceDate);
    const paymentTerms = principals.find(p => p.id === principalId)?.payment_terms || '30 dias';
    
    // Extrair dias do texto (ex: "30/60/90 dias" -> primeira parcela é 30)
    const daysMatch = paymentTerms.match(/\d+/);
    const days = daysMatch ? parseInt(daysMatch[0]) : 30;
    
    const paymentDate = new Date(invoice);
    paymentDate.setDate(paymentDate.getDate() + days);
    return paymentDate;
  };

  const filteredCommissions = commissions.filter(c => {
    const statusMatch = statusFilter === 'all' || c.status === statusFilter;
    const principalMatch = principalFilter === 'all' || c.principal_id === principalFilter;
    return statusMatch && principalMatch;
  });

  const totals = {
    prevista: filteredCommissions.filter(c => ['prevista', 'pending'].includes(c.status)).reduce((sum, c) => sum + (c.commission_value || 0), 0),
    faturada: filteredCommissions.filter(c => ['faturada', 'invoiced'].includes(c.status)).reduce((sum, c) => sum + (c.commission_value || 0), 0),
    a_receber: filteredCommissions.filter(c => c.status === 'a_receber').reduce((sum, c) => sum + (c.commission_value || 0), 0),
    recebida: filteredCommissions.filter(c => ['recebida', 'paid'].includes(c.status)).reduce((sum, c) => sum + (c.commission_value || 0), 0)
  };

  const totalGeral = Object.values(totals).reduce((sum, val) => sum + val, 0);

  // Previsão de recebimento próximo mês
  const nextMonthForecast = commissions.filter(c => {
    const paymentDate = calculateNextPaymentDate(c.invoice_date, c.principal_id);
    if (!paymentDate) return false;
    const today = new Date();
    const nextMonth = new Date(today.getFullYear(), today.getMonth() + 1);
    return paymentDate.getMonth() === nextMonth.getMonth() && c.status !== 'recebida';
  });

  const handleEditCommission = (commission) => {
    setEditingId(commission.id);
    setEditData({
      payment_date: commission.payment_date || '',
      value_received: commission.value_received || 0,
      notes: commission.notes || ''
    });
  };

  const handleSaveEdit = () => {
    const commission = commissions.find(c => c.id === editingId);
    if (!commission) return;
    
    const newStatus = editData.value_received >= commission.commission_value ? 'recebida' : 'a_receber';
    const difference = (commission.commission_value || 0) - (editData.value_received || 0);

    updateCommissionMutation.mutate({
      id: editingId,
      data: {
        payment_date: editData.payment_date,
        value_received: parseFloat(editData.value_received) || 0,
        status: newStatus,
        notes: editData.notes
      }
    });
  };

  const editingCommission = commissions.find(c => c.id === editingId);

  return (
    <div className="pb-20 lg:pb-6">
      <PageHeader 
        title="Comissões" 
        subtitle={`${filteredCommissions.length} comissões`}
      />

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-gradient-to-br from-slate-50 to-slate-100 rounded-xl p-4">
          <p className="text-xs text-slate-600 mb-1">Prevista</p>
          <p className="text-2xl font-bold text-slate-900">{formatCurrency(totals.prevista)}</p>
        </div>
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-4">
          <p className="text-xs text-blue-600 mb-1">Faturada</p>
          <p className="text-2xl font-bold text-blue-900">{formatCurrency(totals.faturada)}</p>
        </div>
        <div className="bg-gradient-to-br from-amber-50 to-amber-100 rounded-xl p-4">
          <p className="text-xs text-amber-600 mb-1">A Receber</p>
          <p className="text-2xl font-bold text-amber-900">{formatCurrency(totals.a_receber)}</p>
        </div>
        <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 rounded-xl p-4">
          <p className="text-xs text-emerald-600 mb-1">Recebida</p>
          <p className="text-2xl font-bold text-emerald-900">{formatCurrency(totals.recebida)}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-40">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="prevista">Prevista</SelectItem>
            <SelectItem value="faturada">Faturada</SelectItem>
            <SelectItem value="a_receber">A Receber</SelectItem>
            <SelectItem value="recebida">Recebida</SelectItem>
            <SelectItem value="atrasada">Atrasada</SelectItem>
          </SelectContent>
        </Select>

        <Select value={principalFilter} onValueChange={setPrincipalFilter}>
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue placeholder="Representado" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            {principals.map(p => (
              <SelectItem key={p.id} value={p.id}>
                {p.trade_name || p.company_name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Detailed Table */}
      {isLoading ? (
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} className="h-16 w-full rounded-xl" />
          ))}
        </div>
      ) : filteredCommissions.length > 0 ? (
        <div className="border rounded-xl overflow-hidden bg-white">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b">
                <tr>
                  <th className="text-left p-3 font-medium text-slate-700">Representada</th>
                  <th className="text-left p-3 font-medium text-slate-700">Cliente</th>
                  <th className="text-left p-3 font-medium text-slate-700">Pedido</th>
                  <th className="text-right p-3 font-medium text-slate-700">Valor Vendido</th>
                  <th className="text-right p-3 font-medium text-slate-700">Margem</th>
                  <th className="text-right p-3 font-medium text-slate-700">% Comissão</th>
                  <th className="text-right p-3 font-medium text-slate-700">Comissão</th>
                  <th className="text-center p-3 font-medium text-slate-700">Status</th>
                  <th className="text-left p-3 font-medium text-slate-700">Previsão</th>
                  <th className="text-right p-3 font-medium text-slate-700">Recebido</th>
                  <th className="text-right p-3 font-medium text-slate-700">Saldo</th>
                  <th className="text-center p-3 font-medium text-slate-700">Ação</th>
                </tr>
              </thead>
              <tbody>
                {filteredCommissions.map((commission) => {
                  const status = getStatusConfig(commission.status);
                  const margin = getOrderMargin(commission.order_id);
                  const paymentDate = calculateNextPaymentDate(commission.invoice_date, commission.principal_id);
                  const received = commission.value_received || 0;
                  const balance = (commission.commission_value || 0) - received;
                  const StatusIcon = status.icon;

                  return (
                    <tr key={commission.id} className="border-b hover:bg-slate-50">
                      <td className="p-3 font-medium text-slate-900">{commission.principal_name}</td>
                      <td className="p-3 text-slate-600">{commission.client_name}</td>
                      <td className="p-3 font-mono text-xs text-slate-500">{commission.order_number}</td>
                      <td className="p-3 text-right text-emerald-600 font-semibold">{formatCurrency(commission.invoice_value)}</td>
                      <td className="p-3 text-right text-slate-700">{margin.toFixed(1)}%</td>
                      <td className="p-3 text-right font-semibold text-slate-900">{commission.commission_rate}%</td>
                      <td className="p-3 text-right font-bold text-emerald-600">{formatCurrency(commission.commission_value)}</td>
                      <td className="p-3 text-center">
                        <Badge className={status.color} variant="outline">
                          {status.label}
                        </Badge>
                      </td>
                      <td className="p-3 text-xs text-slate-600">
                        {paymentDate ? paymentDate.toLocaleDateString('pt-BR') : '-'}
                      </td>
                      <td className="p-3 text-right text-emerald-600 font-semibold">
                        {commission.value_received ? formatCurrency(commission.value_received) : '-'}
                      </td>
                      <td className={`p-3 text-right font-semibold ${balance > 0 ? 'text-amber-600' : 'text-emerald-600'}`}>
                        {formatCurrency(balance)}
                      </td>
                      <td className="p-3 text-center">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleEditCommission(commission)}
                          className="h-8 w-8 p-0"
                        >
                          <Edit2 className="w-4 h-4" />
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="text-center py-12 bg-white rounded-xl border border-slate-100">
          <DollarSign className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-500">Nenhuma comissão encontrada</p>
        </div>
      )}

      {/* Edit Dialog */}
      <Dialog open={!!editingId} onOpenChange={() => setEditingId(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Registrar Recebimento</DialogTitle>
          </DialogHeader>
          {editingCommission && (
            <div className="space-y-4">
              <div>
                <p className="text-xs text-slate-500 mb-1">Representada</p>
                <p className="font-semibold">{editingCommission.principal_name}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500 mb-1">Cliente</p>
                <p className="font-semibold">{editingCommission.client_name}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500 mb-1">Comissão Prevista</p>
                <p className="text-lg font-bold text-emerald-600">{formatCurrency(editingCommission.commission_value)}</p>
              </div>
              <div className="space-y-2">
                <label className="text-xs text-slate-600 font-medium">Data de Pagamento</label>
                <Input
                  type="date"
                  value={editData.payment_date}
                  onChange={(e) => setEditData({ ...editData, payment_date: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs text-slate-600 font-medium">Valor Recebido (R$)</label>
                <Input
                  type="number"
                  step="0.01"
                  value={editData.value_received}
                  onChange={(e) => setEditData({ ...editData, value_received: parseFloat(e.target.value) || 0 })}
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs text-slate-600 font-medium">Observações</label>
                <Input
                  value={editData.notes}
                  onChange={(e) => setEditData({ ...editData, notes: e.target.value })}
                  placeholder="Adicione notas..."
                />
              </div>
              <div className="bg-slate-50 rounded-lg p-3">
                <p className="text-xs text-slate-600 mb-1">Saldo Pendente</p>
                <p className="text-lg font-bold text-amber-600">
                  {formatCurrency((commission.commission_value || 0) - (editData.value_received || 0))}
                </p>
              </div>
              <div className="flex gap-3 pt-4">
                <Button variant="outline" onClick={() => setEditingId(null)} className="flex-1">
                  <X className="w-4 h-4 mr-2" />
                  Cancelar
                </Button>
                <Button 
                  onClick={handleSaveEdit} 
                  disabled={updateCommissionMutation.isPending}
                  className="flex-1 bg-emerald-600 hover:bg-emerald-700"
                >
                  <Save className="w-4 h-4 mr-2" />
                  Salvar
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Total Footer */}
      {filteredCommissions.length > 0 && (
        <div className="mt-6 bg-gradient-to-r from-emerald-500 to-teal-600 rounded-xl p-4 text-white">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-sm opacity-90 block">Total de Comissões</span>
              <p className="text-xs opacity-75 mt-1">Prevista + A Faturar + A Receber</p>
            </div>
            <span className="text-3xl font-bold">{formatCurrency(totalGeral)}</span>
          </div>
        </div>
      )}
    </div>
  );
}