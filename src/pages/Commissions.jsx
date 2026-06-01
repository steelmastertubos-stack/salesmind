import React, { useState, useMemo } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  DollarSign, Calendar, TrendingUp, CheckCircle2, Clock,
  AlertCircle, Edit2, Save, X, ChevronRight, Building2, ArrowUpRight
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';

const fmt = (v) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(v || 0);
const fmt2 = (v) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 2 }).format(v || 0);

function KPIBox({ label, value, icon: Icon, color = 'blue', sub }) {
  const map = {
    blue:   { bg: 'bg-blue-50',    text: 'text-blue-700',    icon: 'bg-blue-500' },
    amber:  { bg: 'bg-amber-50',   text: 'text-amber-700',   icon: 'bg-amber-500' },
    green:  { bg: 'bg-emerald-50', text: 'text-emerald-700', icon: 'bg-emerald-500' },
    red:    { bg: 'bg-red-50',     text: 'text-red-700',     icon: 'bg-red-500' },
    slate:  { bg: 'bg-slate-50',   text: 'text-slate-700',   icon: 'bg-slate-500' },
  };
  const c = map[color] || map.blue;
  return (
    <div className={`${c.bg} rounded-2xl p-4 flex items-start gap-3`}>
      <div className={`w-9 h-9 ${c.icon} rounded-xl flex items-center justify-center flex-shrink-0`}>
        <Icon className="w-5 h-5 text-white" />
      </div>
      <div>
        <p className={`text-xl font-bold ${c.text}`}>{value}</p>
        <p className="text-xs text-slate-500 font-medium mt-0.5">{label}</p>
        {sub && <p className="text-[10px] text-slate-400 mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}

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
  const { data: installments = [] } = useQuery({
    queryKey: ['commission-installments'],
    queryFn: () => base44.entities.CommissionInstallment.list('-due_date', 500)
  });
  const { data: orders = [] } = useQuery({
    queryKey: ['orders'],
    queryFn: () => base44.entities.Order.list('-created_date', 500)
  });

  const today = new Date().toISOString().split('T')[0];
  const now = new Date();

  const updateCommissionMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Commission.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['commissions'] });
      setEditingId(null);
      toast.success('Comissão atualizada!');
    }
  });

  const getStatusConfig = (status) => {
    switch (status) {
      case 'prevista': return { color: 'bg-slate-100 text-slate-700', label: 'Prevista', icon: Clock };
      case 'a_receber': return { color: 'bg-amber-100 text-amber-700', label: 'A Receber', icon: TrendingUp };
      case 'recebida': return { color: 'bg-emerald-100 text-emerald-700', label: 'Recebida', icon: CheckCircle2 };
      case 'cancelada': return { color: 'bg-red-100 text-red-700', label: 'Cancelada', icon: AlertCircle };
      default: return { color: 'bg-slate-100 text-slate-700', label: status, icon: Clock };
    }
  };

  const filteredCommissions = commissions.filter(c => {
    const statusMatch = statusFilter === 'all' || c.status === statusFilter;
    const principalMatch = principalFilter === 'all' || c.principal_id === principalFilter;
    return statusMatch && principalMatch;
  });

  const totals = useMemo(() => ({
    prevista: commissions.filter(c => c.status === 'prevista').reduce((s, c) => s + (c.commission_total_value || c.commission_value || 0), 0),
    a_receber: commissions.filter(c => c.status === 'a_receber').reduce((s, c) => s + (c.commission_total_value || c.commission_value || 0), 0),
    recebida: commissions.filter(c => c.status === 'recebida').reduce((s, c) => s + (c.commission_total_value || c.commission_value || 0), 0),
  }), [commissions]);

  // Projeção por período
  const projections = useMemo(() => {
    const getFutureValue = (days) => {
      const cutoff = new Date(now.getTime() + days * 86400000).toISOString().split('T')[0];
      return installments
        .filter(i => i.status !== 'recebida' && i.due_date && i.due_date >= today && i.due_date <= cutoff)
        .reduce((s, i) => s + (i.installment_value || 0), 0);
    };
    return { d30: getFutureValue(30), d60: getFutureValue(60), d90: getFutureValue(90) };
  }, [installments, today, now]);

  // Por representada
  const byPrincipal = useMemo(() => {
    const map = {};
    commissions.forEach(c => {
      const k = c.principal_name || 'Desconhecida';
      if (!map[k]) map[k] = { name: k, prevista: 0, a_receber: 0, recebida: 0 };
      const v = c.commission_total_value || c.commission_value || 0;
      if (c.status === 'prevista') map[k].prevista += v;
      else if (c.status === 'a_receber') map[k].a_receber += v;
      else if (c.status === 'recebida') map[k].recebida += v;
    });
    return Object.values(map).sort((a, b) => (b.a_receber + b.prevista) - (a.a_receber + a.prevista));
  }, [commissions]);

  // Próximas parcelas
  const upcomingInstallments = useMemo(() => {
    return installments
      .filter(i => i.status !== 'recebida' && i.due_date)
      .sort((a, b) => a.due_date.localeCompare(b.due_date))
      .slice(0, 20);
  }, [installments]);

  const editingCommission = commissions.find(c => c.id === editingId);

  const handleSaveEdit = () => {
    const commission = commissions.find(c => c.id === editingId);
    if (!commission) return;
    const commVal = commission.commission_total_value || commission.commission_value || 0;
    const newStatus = (parseFloat(editData.value_received) || 0) >= commVal ? 'recebida' : 'a_receber';
    updateCommissionMutation.mutate({
      id: editingId,
      data: {
        payment_date: editData.payment_date,
        commission_value: parseFloat(editData.value_received) || 0,
        status: newStatus,
        notes: editData.notes
      }
    });
  };

  return (
    <div className="pb-20 lg:pb-6 space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Comissões</h1>
          <p className="text-xs text-slate-400">{commissions.length} registros · {filteredCommissions.length} exibidos</p>
        </div>
        <Link to={createPageUrl('Financeiro')}>
          <Button variant="outline" size="sm" className="text-slate-600">
            <ArrowUpRight className="w-3.5 h-3.5 mr-1.5" />
            Financeiro
          </Button>
        </Link>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
        <KPIBox label="Prevista" value={fmt(totals.prevista)} icon={Clock} color="blue" sub="Negócios ganhos" />
        <KPIBox label="A Receber" value={fmt(totals.a_receber)} icon={TrendingUp} color="amber" sub="Aguardando" />
        <KPIBox label="Recebida" value={fmt(totals.recebida)} icon={CheckCircle2} color="green" sub="Confirmada" />
      </div>

      {/* Projeção */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4">
        <div className="flex items-center gap-2 mb-3">
          <Calendar className="w-4 h-4 text-blue-500" />
          <span className="text-sm font-bold text-slate-800">Projeção de Recebimento (parcelas)</span>
        </div>
        <div className="grid grid-cols-3 gap-3">
          {[{ label: '30 dias', value: projections.d30 }, { label: '60 dias', value: projections.d60 }, { label: '90 dias', value: projections.d90 }].map(p => (
            <div key={p.label} className="bg-blue-50 rounded-xl p-3 text-center">
              <p className="text-lg font-bold text-blue-700">{fmt(p.value)}</p>
              <p className="text-[10px] text-slate-500 mt-0.5">{p.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-2">
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-36 h-8 text-xs">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="prevista">Prevista</SelectItem>
            <SelectItem value="a_receber">A Receber</SelectItem>
            <SelectItem value="recebida">Recebida</SelectItem>
            <SelectItem value="cancelada">Cancelada</SelectItem>
          </SelectContent>
        </Select>
        <Select value={principalFilter} onValueChange={setPrincipalFilter}>
          <SelectTrigger className="w-full sm:w-44 h-8 text-xs">
            <SelectValue placeholder="Representada" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas</SelectItem>
            {principals.map(p => (
              <SelectItem key={p.id} value={p.id}>{p.trade_name || p.company_name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="comissoes">
        <TabsList>
          <TabsTrigger value="comissoes">Comissões</TabsTrigger>
          <TabsTrigger value="parcelas">Próximas Parcelas</TabsTrigger>
          <TabsTrigger value="porrepresentada">Por Representada</TabsTrigger>
        </TabsList>

        {/* Comissões */}
        <TabsContent value="comissoes" className="mt-4">
          {isLoading ? (
            <div className="space-y-3">{[...Array(4)].map((_, i) => <Skeleton key={i} className="h-16 rounded-xl" />)}</div>
          ) : filteredCommissions.length > 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-slate-50 border-b">
                    <tr>
                      <th className="text-left p-3 font-medium text-slate-700">Representada</th>
                      <th className="text-left p-3 font-medium text-slate-700">Cliente</th>
                      <th className="text-left p-3 font-medium text-slate-700">Pedido</th>
                      <th className="text-right p-3 font-medium text-slate-700">Vendas</th>
                      <th className="text-right p-3 font-medium text-slate-700">%</th>
                      <th className="text-right p-3 font-medium text-slate-700">Comissão</th>
                      <th className="text-center p-3 font-medium text-slate-700">Status</th>
                      <th className="text-center p-3 font-medium text-slate-700">Ação</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredCommissions.map(commission => {
                      const sc = getStatusConfig(commission.status);
                      const StatusIcon = sc.icon;
                      const commVal = commission.commission_total_value || commission.commission_value || 0;
                      return (
                        <tr key={commission.id} className="border-b hover:bg-slate-50">
                          <td className="p-3 font-medium text-slate-800 truncate max-w-[120px]">{commission.principal_name}</td>
                          <td className="p-3 text-slate-600 truncate max-w-[120px]">{commission.client_name}</td>
                          <td className="p-3 text-xs text-slate-400 font-mono">{commission.order_number?.slice(-8) || '-'}</td>
                          <td className="p-3 text-right text-emerald-700 font-semibold">{fmt(commission.sales_value || commission.invoice_value)}</td>
                          <td className="p-3 text-right text-slate-600 font-semibold">{(commission.commission_rate || 0).toFixed(2)}%</td>
                          <td className="p-3 text-right font-bold text-emerald-600">{fmt(commVal)}</td>
                          <td className="p-3 text-center">
                            <Badge className={sc.color}>{sc.label}</Badge>
                          </td>
                          <td className="p-3 text-center">
                            <Button size="sm" variant="ghost" onClick={() => { setEditingId(commission.id); setEditData({ payment_date: '', value_received: commVal, notes: commission.notes || '' }); }} className="h-7 w-7 p-0">
                              <Edit2 className="w-3.5 h-3.5" />
                            </Button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              {/* Footer */}
              <div className="p-3 bg-slate-50 border-t flex justify-end gap-4 text-sm">
                <span className="text-slate-500">Total filtrado:</span>
                <span className="font-bold text-emerald-700">
                  {fmt(filteredCommissions.reduce((s, c) => s + (c.commission_total_value || c.commission_value || 0), 0))}
                </span>
              </div>
            </div>
          ) : (
            <div className="text-center py-12 bg-white rounded-2xl border border-slate-100">
              <DollarSign className="w-10 h-10 text-slate-300 mx-auto mb-3" />
              <p className="text-slate-400 text-sm">Nenhuma comissão encontrada</p>
            </div>
          )}
        </TabsContent>

        {/* Parcelas */}
        <TabsContent value="parcelas" className="mt-4">
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 border-b">
                  <tr>
                    <th className="text-left p-3 font-medium text-slate-700">Representada</th>
                    <th className="text-center p-3 font-medium text-slate-700">Parcela</th>
                    <th className="text-right p-3 font-medium text-slate-700">Valor</th>
                    <th className="text-center p-3 font-medium text-slate-700">Vencimento</th>
                    <th className="text-center p-3 font-medium text-slate-700">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {upcomingInstallments.map(inst => {
                    const pName = principals.find(p => p.id === inst.representada_id)?.trade_name || '-';
                    const isOverdue = inst.due_date < today;
                    return (
                      <tr key={inst.id} className={`border-b ${isOverdue ? 'bg-red-50/40' : 'hover:bg-slate-50'}`}>
                        <td className="p-3 text-sm font-medium text-slate-800">{pName}</td>
                        <td className="p-3 text-center"><Badge variant="outline" className="text-[10px]">#{inst.installment_no}</Badge></td>
                        <td className="p-3 text-right font-semibold text-emerald-700">{fmt2(inst.installment_value)}</td>
                        <td className={`p-3 text-center text-xs font-medium ${isOverdue ? 'text-red-600' : 'text-slate-600'}`}>
                          {inst.due_date ? format(new Date(inst.due_date), 'dd/MM/yyyy') : '-'}
                        </td>
                        <td className="p-3 text-center">
                          {isOverdue ? <Badge className="bg-red-500 text-white text-[10px]">Atrasada</Badge>
                            : inst.status === 'a_receber' ? <Badge className="bg-amber-500 text-white text-[10px]">A Receber</Badge>
                            : <Badge variant="outline" className="text-[10px]">Prevista</Badge>}
                        </td>
                      </tr>
                    );
                  })}
                  {upcomingInstallments.length === 0 && (
                    <tr><td colSpan="5" className="p-8 text-center text-slate-400">Nenhuma parcela pendente</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </TabsContent>

        {/* Por Representada */}
        <TabsContent value="porrepresentada" className="mt-4 space-y-3">
          {byPrincipal.map(p => (
            <div key={p.name} className="bg-white rounded-2xl border border-slate-200 p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-slate-400" />
                  <h4 className="font-semibold text-slate-800 text-sm">{p.name}</h4>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div className="bg-blue-50 rounded-xl p-3 text-center">
                  <p className="text-base font-bold text-blue-700">{fmt(p.prevista)}</p>
                  <p className="text-[10px] text-slate-400">Prevista</p>
                </div>
                <div className="bg-amber-50 rounded-xl p-3 text-center">
                  <p className="text-base font-bold text-amber-700">{fmt(p.a_receber)}</p>
                  <p className="text-[10px] text-slate-400">A Receber</p>
                </div>
                <div className="bg-emerald-50 rounded-xl p-3 text-center">
                  <p className="text-base font-bold text-emerald-700">{fmt(p.recebida)}</p>
                  <p className="text-[10px] text-slate-400">Recebida</p>
                </div>
              </div>
            </div>
          ))}
          {byPrincipal.length === 0 && <p className="text-slate-400 text-sm text-center py-8">Sem dados</p>}
        </TabsContent>
      </Tabs>

      {/* Edit Dialog */}
      <Dialog open={!!editingId} onOpenChange={() => setEditingId(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Registrar Recebimento</DialogTitle></DialogHeader>
          {editingCommission && (
            <div className="space-y-4">
              <div className="bg-slate-50 rounded-xl p-3">
                <p className="text-xs text-slate-500">Representada · Cliente</p>
                <p className="font-semibold">{editingCommission.principal_name} · {editingCommission.client_name}</p>
                <p className="text-lg font-bold text-emerald-600 mt-1">
                  {fmt2(editingCommission.commission_total_value || editingCommission.commission_value)}
                </p>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-medium text-slate-600">Data de Pagamento</label>
                <Input type="date" value={editData.payment_date} onChange={e => setEditData({ ...editData, payment_date: e.target.value })} />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-medium text-slate-600">Valor Recebido (R$)</label>
                <Input type="number" step="0.01" value={editData.value_received} onChange={e => setEditData({ ...editData, value_received: e.target.value })} />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-medium text-slate-600">Observações</label>
                <Input value={editData.notes} onChange={e => setEditData({ ...editData, notes: e.target.value })} placeholder="Notas..." />
              </div>
              <div className="flex gap-3 pt-2">
                <Button variant="outline" onClick={() => setEditingId(null)} className="flex-1">
                  <X className="w-4 h-4 mr-2" />Cancelar
                </Button>
                <Button onClick={handleSaveEdit} disabled={updateCommissionMutation.isPending} className="flex-1 bg-emerald-600 hover:bg-emerald-700">
                  <Save className="w-4 h-4 mr-2" />Salvar
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}