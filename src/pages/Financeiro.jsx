import React, { useState, useMemo } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { 
  DollarSign, TrendingUp, Clock, CheckCircle2, AlertCircle,
  Plus, Filter, Calendar, Building2, ChevronRight, ArrowUpRight
} from 'lucide-react';
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
    purple: { bg: 'bg-violet-50',  text: 'text-violet-700',  icon: 'bg-violet-500' },
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

export default function FinanceiroPage() {
  const [selectedMonth, setSelectedMonth] = useState(format(new Date(), 'yyyy-MM'));
  const [selectedPrincipal, setSelectedPrincipal] = useState('');
  const [showReceiptForm, setShowReceiptForm] = useState(false);
  const queryClient = useQueryClient();

  const { data: installments = [] } = useQuery({
    queryKey: ['commission-installments'],
    queryFn: () => base44.entities.CommissionInstallment.list('-due_date', 500)
  });
  const { data: receipts = [] } = useQuery({
    queryKey: ['receipts'],
    queryFn: () => base44.entities.Receipt.list('-received_at', 200)
  });
  const { data: principals = [] } = useQuery({
    queryKey: ['principals'],
    queryFn: () => base44.entities.Principal.list('trade_name', 100)
  });
  const { data: commissions = [] } = useQuery({
    queryKey: ['commissions'],
    queryFn: () => base44.entities.Commission.list('-created_date', 500)
  });

  const now = new Date();
  const today = now.toISOString().split('T')[0];

  const summary = useMemo(() => {
    const filtered = installments.filter(i => {
      const monthMatch = !selectedMonth || i.reference_month === selectedMonth;
      const principalMatch = !selectedPrincipal || i.representada_id === selectedPrincipal;
      return monthMatch && principalMatch;
    });

    const previsto = filtered.filter(i => i.status === 'prevista').reduce((s, i) => s + (i.installment_value || 0), 0);
    const aReceber = filtered.filter(i => i.status === 'a_receber').reduce((s, i) => s + (i.installment_value || 0), 0);
    const recebido = filtered.filter(i => i.status === 'recebida').reduce((s, i) => s + (i.received_value || i.installment_value || 0), 0);
    const atrasado = filtered.filter(i => i.status !== 'recebida' && i.due_date && i.due_date < today).reduce((s, i) => s + (i.installment_value || 0), 0);

    return { previsto, aReceber, recebido, atrasado };
  }, [installments, selectedMonth, selectedPrincipal, today]);

  // Projeções futuras
  const projections = useMemo(() => {
    const getFutureValue = (days) => {
      const cutoff = new Date(now.getTime() + days * 86400000).toISOString().split('T')[0];
      return installments
        .filter(i => i.status !== 'recebida' && i.due_date && i.due_date >= today && i.due_date <= cutoff)
        .reduce((s, i) => s + (i.installment_value || 0), 0);
    };
    return {
      d30: getFutureValue(30),
      d60: getFutureValue(60),
      d90: getFutureValue(90),
    };
  }, [installments, today, now]);

  // Por representada
  const byPrincipal = useMemo(() => {
    const map = {};
    installments.forEach(i => {
      const name = principals.find(p => p.id === i.representada_id)?.trade_name ||
        principals.find(p => p.id === i.representada_id)?.company_name || 'Desconhecida';
      if (!map[name]) map[name] = { name, previsto: 0, aReceber: 0, recebido: 0 };
      if (i.status === 'prevista') map[name].previsto += i.installment_value || 0;
      if (i.status === 'a_receber') map[name].aReceber += i.installment_value || 0;
      if (i.status === 'recebida') map[name].recebido += i.received_value || i.installment_value || 0;
    });
    return Object.values(map).sort((a, b) => (b.aReceber + b.previsto) - (a.aReceber + a.previsto));
  }, [installments, principals]);

  const filteredInstallments = useMemo(() => {
    return installments.filter(i => {
      const monthMatch = !selectedMonth || i.reference_month === selectedMonth;
      const principalMatch = !selectedPrincipal || i.representada_id === selectedPrincipal;
      return monthMatch && principalMatch;
    }).sort((a, b) => (a.due_date || '').localeCompare(b.due_date || ''));
  }, [installments, selectedMonth, selectedPrincipal]);

  const getStatusBadge = (inst) => {
    if (inst.status === 'recebida') return <Badge className="bg-emerald-500 text-white text-[10px]">Recebida</Badge>;
    if (inst.due_date && inst.due_date < today) return <Badge className="bg-red-500 text-white text-[10px]">Atrasada</Badge>;
    if (inst.status === 'a_receber') return <Badge className="bg-amber-500 text-white text-[10px]">A Receber</Badge>;
    return <Badge variant="outline" className="text-[10px]">Prevista</Badge>;
  };

  return (
    <div className="pb-20 lg:pb-6 space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Financeiro</h1>
          <p className="text-xs text-slate-400">Gestão de comissões e recebimentos</p>
        </div>
        <Button onClick={() => setShowReceiptForm(true)} className="bg-emerald-600 hover:bg-emerald-700">
          <Plus className="w-4 h-4 mr-2" />
          Registrar Recebimento
        </Button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <KPIBox label="Previsto" value={fmt(summary.previsto)} icon={Clock} color="blue" sub="Negócios futuros" />
        <KPIBox label="A Receber" value={fmt(summary.aReceber)} icon={TrendingUp} color="amber" sub="Aguardando pagamento" />
        <KPIBox label="Recebido" value={fmt(summary.recebido)} icon={CheckCircle2} color="green" sub="Realizado" />
        <KPIBox label="Atrasado" value={fmt(summary.atrasado)} icon={AlertCircle} color={summary.atrasado > 0 ? 'red' : 'green'} sub={summary.atrasado > 0 ? 'Verificar urgente' : 'Em dia'} />
      </div>

      {/* Projeção */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5">
        <div className="flex items-center gap-2 mb-4">
          <ArrowUpRight className="w-4 h-4 text-blue-500" />
          <h3 className="text-sm font-bold text-slate-800">Projeção de Recebimentos</h3>
        </div>
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: 'Próximos 30 dias', value: projections.d30, color: 'text-blue-700', bg: 'bg-blue-50' },
            { label: 'Próximos 60 dias', value: projections.d60, color: 'text-amber-700', bg: 'bg-amber-50' },
            { label: 'Próximos 90 dias', value: projections.d90, color: 'text-emerald-700', bg: 'bg-emerald-50' },
          ].map(p => (
            <div key={p.label} className={`${p.bg} rounded-xl p-4 text-center`}>
              <p className={`text-xl font-bold ${p.color}`}>{fmt(p.value)}</p>
              <p className="text-[10px] text-slate-500 mt-1 font-medium">{p.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Por Representada */}
      {byPrincipal.length > 0 && (
        <div className="bg-white rounded-2xl border border-slate-200 p-5">
          <div className="flex items-center gap-2 mb-4">
            <Building2 className="w-4 h-4 text-slate-500" />
            <h3 className="text-sm font-bold text-slate-800">Por Representada</h3>
          </div>
          <div className="space-y-2">
            {byPrincipal.map(p => (
              <div key={p.name} className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-slate-800 truncate">{p.name}</p>
                </div>
                <div className="flex gap-3 text-xs flex-shrink-0">
                  {p.aReceber > 0 && <span className="text-amber-600 font-semibold">{fmt(p.aReceber)}</span>}
                  {p.recebido > 0 && <span className="text-emerald-600 font-semibold">{fmt(p.recebido)}</span>}
                  {p.previsto > 0 && <span className="text-blue-600">{fmt(p.previsto)}</span>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tabs */}
      <Tabs defaultValue="parcelas">
        <div className="flex flex-col lg:flex-row items-start lg:items-center gap-3 mb-4">
          <TabsList>
            <TabsTrigger value="parcelas">Parcelas</TabsTrigger>
            <TabsTrigger value="recebimentos">Recebimentos</TabsTrigger>
          </TabsList>
          <div className="flex gap-2 ml-auto">
            <Input type="month" value={selectedMonth} onChange={e => setSelectedMonth(e.target.value)} className="w-36 h-8 text-xs" />
            <Select value={selectedPrincipal || ''} onValueChange={v => setSelectedPrincipal(v || '')}>
              <SelectTrigger className="w-40 h-8 text-xs">
                <SelectValue placeholder="Representada" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={null}>Todas</SelectItem>
                {principals.map(p => (
                  <SelectItem key={p.id} value={p.id}>{p.trade_name || p.company_name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <TabsContent value="parcelas">
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 border-b">
                  <tr>
                    <th className="text-left p-3 font-medium text-slate-700">Representada</th>
                    <th className="text-left p-3 font-medium text-slate-700">Pedido</th>
                    <th className="text-center p-3 font-medium text-slate-700">#</th>
                    <th className="text-right p-3 font-medium text-slate-700">Valor</th>
                    <th className="text-center p-3 font-medium text-slate-700">Vencimento</th>
                    <th className="text-center p-3 font-medium text-slate-700">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredInstallments.map(inst => {
                    const pName = principals.find(p => p.id === inst.representada_id)?.trade_name || '-';
                    const isOverdue = inst.status !== 'recebida' && inst.due_date && inst.due_date < today;
                    return (
                      <tr key={inst.id} className={`border-b ${isOverdue ? 'bg-red-50/40' : 'hover:bg-slate-50'}`}>
                        <td className="p-3 text-sm font-medium text-slate-800">{pName}</td>
                        <td className="p-3 text-xs text-slate-500 font-mono">{inst.order_id?.slice(-6) || '-'}</td>
                        <td className="p-3 text-center"><Badge variant="outline" className="text-[10px]">#{inst.installment_no}</Badge></td>
                        <td className="p-3 text-right font-semibold text-emerald-700">{fmt2(inst.installment_value)}</td>
                        <td className={`p-3 text-center text-xs ${isOverdue ? 'text-red-600 font-semibold' : 'text-slate-600'}`}>
                          {inst.due_date ? format(new Date(inst.due_date), 'dd/MM/yyyy') : '-'}
                        </td>
                        <td className="p-3 text-center">{getStatusBadge(inst)}</td>
                      </tr>
                    );
                  })}
                  {filteredInstallments.length === 0 && (
                    <tr><td colSpan="6" className="p-8 text-center text-slate-400">Nenhuma parcela encontrada</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="recebimentos">
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 border-b">
                  <tr>
                    <th className="text-left p-3 font-medium text-slate-700">Data</th>
                    <th className="text-left p-3 font-medium text-slate-700">Representada</th>
                    <th className="text-right p-3 font-medium text-slate-700">Valor</th>
                    <th className="text-left p-3 font-medium text-slate-700">Observações</th>
                  </tr>
                </thead>
                <tbody>
                  {receipts.map(r => {
                    const pName = principals.find(p => p.id === r.representada_id)?.trade_name || '-';
                    return (
                      <tr key={r.id} className="border-b hover:bg-slate-50">
                        <td className="p-3 text-xs text-slate-600">{r.received_at ? format(new Date(r.received_at), 'dd/MM/yyyy') : '-'}</td>
                        <td className="p-3 text-sm font-medium text-slate-800">{pName}</td>
                        <td className="p-3 text-right font-semibold text-emerald-700">{fmt2(r.amount)}</td>
                        <td className="p-3 text-xs text-slate-500">{r.notes || '-'}</td>
                      </tr>
                    );
                  })}
                  {receipts.length === 0 && (
                    <tr><td colSpan="4" className="p-8 text-center text-slate-400">Nenhum recebimento registrado</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </TabsContent>
      </Tabs>

      {/* Receipt Form Dialog */}
      <Dialog open={showReceiptForm} onOpenChange={setShowReceiptForm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Registrar Recebimento</DialogTitle>
          </DialogHeader>
          <ReceiptForm principals={principals} onSuccess={() => {
            setShowReceiptForm(false);
            queryClient.invalidateQueries(['receipts']);
            queryClient.invalidateQueries(['commission-installments']);
          }} />
        </DialogContent>
      </Dialog>
    </div>
  );
}

function ReceiptForm({ principals, onSuccess }) {
  const [formData, setFormData] = useState({
    representada_id: '',
    received_at: format(new Date(), 'yyyy-MM-dd'),
    amount: '',
    notes: ''
  });
  const createReceiptMutation = useMutation({
    mutationFn: (data) => base44.entities.Receipt.create(data),
    onSuccess: () => { toast.success('Recebimento registrado!'); onSuccess(); }
  });
  const handleSubmit = (e) => {
    e.preventDefault();
    createReceiptMutation.mutate({ ...formData, amount: parseFloat(formData.amount) });
  };
  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label>Representada *</Label>
        <Select value={formData.representada_id} onValueChange={v => setFormData(p => ({ ...p, representada_id: v }))} required>
          <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
          <SelectContent>
            {principals.map(p => <SelectItem key={p.id} value={p.id}>{p.trade_name || p.company_name}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Data *</Label>
          <Input type="date" value={formData.received_at} onChange={e => setFormData(p => ({ ...p, received_at: e.target.value }))} required />
        </div>
        <div className="space-y-2">
          <Label>Valor (R$) *</Label>
          <Input type="number" step="0.01" value={formData.amount} onChange={e => setFormData(p => ({ ...p, amount: e.target.value }))} required />
        </div>
      </div>
      <div className="space-y-2">
        <Label>Observações</Label>
        <Textarea value={formData.notes} onChange={e => setFormData(p => ({ ...p, notes: e.target.value }))} rows={2} />
      </div>
      <div className="flex justify-end pt-2">
        <Button type="submit" disabled={createReceiptMutation.isPending} className="bg-emerald-600 hover:bg-emerald-700">
          Registrar
        </Button>
      </div>
    </form>
  );
}