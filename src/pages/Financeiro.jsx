import React, { useState, useMemo } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import PageHeader from '@/components/common/PageHeader';
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
  DollarSign, 
  TrendingUp, 
  Clock, 
  CheckCircle2, 
  AlertCircle,
  Calendar,
  Plus,
  Filter,
  Download
} from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';

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

  const { data: audits = [] } = useQuery({
    queryKey: ['financial-audits'],
    queryFn: () => base44.entities.FinancialAudit.list('-created_date', 200)
  });

  const { data: principals = [] } = useQuery({
    queryKey: ['principals'],
    queryFn: () => base44.entities.Principal.list('trade_name', 100)
  });

  const { data: commissions = [] } = useQuery({
    queryKey: ['commissions'],
    queryFn: () => base44.entities.Commission.list('-created_date', 500)
  });

  const { data: orders = [] } = useQuery({
    queryKey: ['orders'],
    queryFn: () => base44.entities.Order.list('-created_date', 500)
  });

  // Calcular resumo financeiro
  const summary = useMemo(() => {
    const now = new Date();
    
    // Filtrar parcelas
    const filtered = installments.filter(i => {
      const monthMatch = !selectedMonth || i.reference_month === selectedMonth;
      const principalMatch = !selectedPrincipal || i.representada_id === selectedPrincipal;
      return monthMatch && principalMatch;
    });

    // PREVISTO: Parcelas com status "prevista"
    const previsto = filtered
      .filter(i => i.status === 'prevista')
      .reduce((sum, i) => sum + (i.installment_value || 0), 0);

    // A RECEBER: Parcelas com status "a_receber" (não vencidas e não recebidas)
    const aReceber = filtered
      .filter(i => i.status === 'a_receber')
      .reduce((sum, i) => sum + (i.installment_value || 0), 0);

    // RECEBIDO: Parcelas com status "recebida"
    const recebido = filtered
      .filter(i => i.status === 'recebida')
      .reduce((sum, i) => sum + (i.received_value || i.installment_value || 0), 0);
    
    // ATRASADO: Parcelas não recebidas com vencimento passado
    const atrasado = filtered
      .filter(i => {
        if (i.status === 'recebida') return false;
        if (!i.due_date) return false;
        const dueDate = new Date(i.due_date);
        return dueDate < now;
      })
      .reduce((sum, i) => sum + (i.installment_value || 0), 0);

    return { previsto, aReceber, recebido, atrasado, total: previsto + aReceber + recebido };
  }, [installments, selectedMonth, selectedPrincipal]);

  return (
    <div className="pb-20 lg:pb-6 space-y-6">
      <PageHeader
        title="Módulo Financeiro"
        subtitle="Gestão de comissões, parcelas e recebimentos"
      >
        <Button onClick={() => setShowReceiptForm(true)} className="bg-[#1DB954] hover:bg-[#15803d]">
          <Plus className="w-4 h-4 mr-2" />
          Registrar Recebimento
        </Button>
      </PageHeader>

      {/* Filtros */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col lg:flex-row gap-3">
            <div className="flex-1">
              <Label className="text-xs mb-1 block">Mês de Referência</Label>
              <Input
                type="month"
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="w-full"
              />
            </div>
            <div className="flex-1">
              <Label className="text-xs mb-1 block">Representada</Label>
              <Select value={selectedPrincipal} onValueChange={setSelectedPrincipal}>
                <SelectTrigger>
                  <SelectValue placeholder="Todas" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={null}>Todas</SelectItem>
                  {principals.map(p => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.trade_name || p.company_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {(selectedMonth || selectedPrincipal) && (
              <Button 
                variant="outline" 
                onClick={() => {
                  setSelectedMonth(format(new Date(), 'yyyy-MM'));
                  setSelectedPrincipal('');
                }}
                className="mt-auto"
              >
                Limpar Filtros
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Resumo Financeiro */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-l-4 border-l-blue-500">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-slate-600 mb-1">Previsto</p>
                <p className="text-2xl font-bold text-blue-600">
                  R$ {summary.previsto.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </p>
              </div>
              <Clock className="w-8 h-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-amber-500">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-slate-600 mb-1">A Receber</p>
                <p className="text-2xl font-bold text-amber-600">
                  R$ {summary.aReceber.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </p>
              </div>
              <TrendingUp className="w-8 h-8 text-amber-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-green-500">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-slate-600 mb-1">Recebido</p>
                <p className="text-2xl font-bold text-green-600">
                  R$ {summary.recebido.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </p>
              </div>
              <CheckCircle2 className="w-8 h-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-red-500">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-slate-600 mb-1">Atrasado</p>
                <p className="text-2xl font-bold text-red-600">
                  R$ {summary.atrasado.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </p>
              </div>
              <AlertCircle className="w-8 h-8 text-red-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="parcelas" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="parcelas">Parcelas</TabsTrigger>
          <TabsTrigger value="recebimentos">Recebimentos</TabsTrigger>
          <TabsTrigger value="auditoria">Auditoria</TabsTrigger>
        </TabsList>

        <TabsContent value="parcelas">
          <InstallmentsTable 
            installments={installments}
            selectedMonth={selectedMonth}
            selectedPrincipal={selectedPrincipal}
            principals={principals}
          />
        </TabsContent>

        <TabsContent value="recebimentos">
          <ReceiptsTable receipts={receipts} principals={principals} />
        </TabsContent>

        <TabsContent value="auditoria">
          <AuditTable audits={audits} />
        </TabsContent>
      </Tabs>

      {/* Receipt Form Dialog */}
      <Dialog open={showReceiptForm} onOpenChange={setShowReceiptForm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Registrar Recebimento</DialogTitle>
          </DialogHeader>
          <ReceiptForm 
            principals={principals}
            onSuccess={() => {
              setShowReceiptForm(false);
              queryClient.invalidateQueries(['receipts']);
            }}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}

function InstallmentsTable({ installments, selectedMonth, selectedPrincipal, principals }) {
  const filtered = installments.filter(i => {
    const monthMatch = !selectedMonth || i.reference_month === selectedMonth;
    const principalMatch = !selectedPrincipal || i.representada_id === selectedPrincipal;
    return monthMatch && principalMatch;
  });

  const principalsMap = useMemo(() => {
    const map = {};
    principals.forEach(p => map[p.id] = p.trade_name || p.company_name);
    return map;
  }, [principals]);

  const getStatusBadge = (installment) => {
    if (installment.status === 'recebida') {
      return <Badge className="bg-green-500">Recebida</Badge>;
    }
    const now = new Date();
    const dueDate = new Date(installment.due_date);
    if (dueDate < now && installment.status !== 'recebida') {
      return <Badge className="bg-red-500">Atrasada</Badge>;
    }
    if (installment.status === 'a_receber') {
      return <Badge className="bg-amber-500">A Receber</Badge>;
    }
    return <Badge variant="outline">Prevista</Badge>;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Parcelas de Comissão ({filtered.length})</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b bg-slate-50">
              <tr>
                <th className="text-left p-3 font-medium">Representada</th>
                <th className="text-center p-3 font-medium">Parcela</th>
                <th className="text-right p-3 font-medium">Valor</th>
                <th className="text-center p-3 font-medium">Vencimento</th>
                <th className="text-center p-3 font-medium">Status</th>
                <th className="text-center p-3 font-medium">Recebido</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(inst => (
                <tr key={inst.id} className="border-b hover:bg-slate-50">
                  <td className="p-3">
                    <span className="text-xs font-medium">
                      {principalsMap[inst.representada_id] || '-'}
                    </span>
                  </td>
                  <td className="p-3 text-center">
                    <Badge variant="outline">#{inst.installment_no}</Badge>
                  </td>
                  <td className="p-3 text-right font-semibold text-green-700">
                    R$ {(inst.installment_value || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </td>
                  <td className="p-3 text-center text-xs">
                    {inst.due_date ? format(new Date(inst.due_date), 'dd/MM/yyyy') : '-'}
                  </td>
                  <td className="p-3 text-center">
                    {getStatusBadge(inst)}
                  </td>
                  <td className="p-3 text-center text-xs">
                    {inst.received_at ? format(new Date(inst.received_at), 'dd/MM/yyyy') : '-'}
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan="6" className="p-8 text-center text-slate-500">
                    Nenhuma parcela encontrada
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}

function ReceiptsTable({ receipts, principals }) {
  const principalsMap = useMemo(() => {
    const map = {};
    principals.forEach(p => map[p.id] = p.trade_name || p.company_name);
    return map;
  }, [principals]);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Recebimentos Registrados ({receipts.length})</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b bg-slate-50">
              <tr>
                <th className="text-left p-3 font-medium">Data</th>
                <th className="text-left p-3 font-medium">Representada</th>
                <th className="text-right p-3 font-medium">Valor</th>
                <th className="text-left p-3 font-medium">Observações</th>
              </tr>
            </thead>
            <tbody>
              {receipts.map(r => (
                <tr key={r.id} className="border-b hover:bg-slate-50">
                  <td className="p-3 text-xs">
                    {r.received_at ? format(new Date(r.received_at), 'dd/MM/yyyy') : '-'}
                  </td>
                  <td className="p-3">
                    <span className="text-xs font-medium">
                      {principalsMap[r.representada_id] || '-'}
                    </span>
                  </td>
                  <td className="p-3 text-right font-semibold text-green-700">
                    R$ {(r.amount || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </td>
                  <td className="p-3 text-xs text-slate-600">
                    {r.notes || '-'}
                  </td>
                </tr>
              ))}
              {receipts.length === 0 && (
                <tr>
                  <td colSpan="4" className="p-8 text-center text-slate-500">
                    Nenhum recebimento registrado
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}

function AuditTable({ audits }) {
  const unresolvedAudits = audits.filter(a => !a.resolved);

  const getSeverityBadge = (severity) => {
    if (severity === 'CRITICO') return <Badge className="bg-red-600">Crítico</Badge>;
    if (severity === 'ALERTA') return <Badge className="bg-amber-500">Alerta</Badge>;
    return <Badge variant="outline">Info</Badge>;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">
          Auditoria Financeira ({unresolvedAudits.length} pendentes)
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {unresolvedAudits.map(audit => (
            <div key={audit.id} className="border rounded-lg p-4 bg-slate-50">
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2">
                  {getSeverityBadge(audit.severity)}
                  <span className="text-xs font-medium text-slate-700">{audit.type}</span>
                </div>
                <span className="text-xs text-slate-500">
                  {audit.created_date ? format(new Date(audit.created_date), 'dd/MM/yyyy HH:mm') : ''}
                </span>
              </div>
              <p className="text-sm text-slate-700">{audit.message}</p>
              <div className="flex items-center gap-2 mt-2 text-xs text-slate-500">
                <span>{audit.entity_type}</span>
                <span>•</span>
                <span>ID: {audit.entity_id?.substring(0, 8)}...</span>
              </div>
            </div>
          ))}
          {unresolvedAudits.length === 0 && (
            <div className="p-8 text-center">
              <CheckCircle2 className="w-12 h-12 text-green-500 mx-auto mb-3" />
              <p className="text-slate-600">Nenhum problema detectado!</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
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
    onSuccess: () => {
      toast.success('Recebimento registrado!');
      onSuccess();
    }
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    createReceiptMutation.mutate({
      ...formData,
      amount: parseFloat(formData.amount)
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label>Representada *</Label>
        <Select 
          value={formData.representada_id} 
          onValueChange={(v) => setFormData(prev => ({ ...prev, representada_id: v }))}
          required
        >
          <SelectTrigger>
            <SelectValue placeholder="Selecione" />
          </SelectTrigger>
          <SelectContent>
            {principals.map(p => (
              <SelectItem key={p.id} value={p.id}>
                {p.trade_name || p.company_name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Data do Recebimento *</Label>
          <Input
            type="date"
            value={formData.received_at}
            onChange={(e) => setFormData(prev => ({ ...prev, received_at: e.target.value }))}
            required
          />
        </div>

        <div className="space-y-2">
          <Label>Valor (R$) *</Label>
          <Input
            type="number"
            step="0.01"
            value={formData.amount}
            onChange={(e) => setFormData(prev => ({ ...prev, amount: e.target.value }))}
            required
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label>Observações</Label>
        <Textarea
          value={formData.notes}
          onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
          rows={3}
        />
      </div>

      <div className="flex justify-end gap-3 pt-4 border-t">
        <Button type="submit" className="bg-[#1DB954] hover:bg-[#15803d]">
          Registrar Recebimento
        </Button>
      </div>
    </form>
  );
}