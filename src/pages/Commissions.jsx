import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { 
  DollarSign, 
  Calendar,
  Filter,
  TrendingUp,
  CheckCircle2,
  Clock,
  AlertCircle
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import PageHeader from '@/components/common/PageHeader';
import { Skeleton } from '@/components/ui/skeleton';

export default function Commissions() {
  const [statusFilter, setStatusFilter] = useState('all');
  const [principalFilter, setPrincipalFilter] = useState('all');
  const [monthFilter, setMonthFilter] = useState('all');

  const { data: commissions = [], isLoading } = useQuery({
    queryKey: ['commissions'],
    queryFn: () => base44.entities.Commission.list('-created_date', 500)
  });

  const { data: principals = [] } = useQuery({
    queryKey: ['principals'],
    queryFn: () => base44.entities.Principal.list('company_name', 100)
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
        return { icon: Clock, color: 'bg-slate-100 text-slate-700', label: 'Prevista' };
      case 'faturada':
        return { icon: AlertCircle, color: 'bg-blue-100 text-blue-700', label: 'Faturada' };
      case 'a_receber':
        return { icon: TrendingUp, color: 'bg-amber-100 text-amber-700', label: 'A Receber' };
      case 'recebida':
        return { icon: CheckCircle2, color: 'bg-emerald-100 text-emerald-700', label: 'Recebida' };
      case 'atrasada':
        return { icon: AlertCircle, color: 'bg-red-100 text-red-700', label: 'Atrasada' };
      default:
        return { icon: Clock, color: 'bg-slate-100 text-slate-700', label: status };
    }
  };

  const filteredCommissions = commissions.filter(c => {
    const statusMatch = statusFilter === 'all' || c.status === statusFilter;
    const principalMatch = principalFilter === 'all' || c.principal_id === principalFilter;
    
    let monthMatch = true;
    if (monthFilter !== 'all' && c.invoice_date) {
      const invoiceMonth = new Date(c.invoice_date).toISOString().slice(0, 7);
      monthMatch = invoiceMonth === monthFilter;
    }
    
    return statusMatch && principalMatch && monthMatch;
  });

  const totals = {
    prevista: filteredCommissions.filter(c => c.status === 'prevista').reduce((sum, c) => sum + (c.commission_value || 0), 0),
    faturada: filteredCommissions.filter(c => c.status === 'faturada').reduce((sum, c) => sum + (c.commission_value || 0), 0),
    a_receber: filteredCommissions.filter(c => c.status === 'a_receber').reduce((sum, c) => sum + (c.commission_value || 0), 0),
    recebida: filteredCommissions.filter(c => c.status === 'recebida').reduce((sum, c) => sum + (c.commission_value || 0), 0)
  };

  const totalGeral = filteredCommissions.reduce((sum, c) => sum + (c.commission_value || 0), 0);

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

        <Select value={monthFilter} onValueChange={setMonthFilter}>
          <SelectTrigger className="w-full sm:w-40">
            <SelectValue placeholder="Mês" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="2026-01">Janeiro 2026</SelectItem>
            <SelectItem value="2025-12">Dezembro 2025</SelectItem>
            <SelectItem value="2025-11">Novembro 2025</SelectItem>
            <SelectItem value="2025-10">Outubro 2025</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Commissions List */}
      {isLoading ? (
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} className="h-24 w-full rounded-xl" />
          ))}
        </div>
      ) : filteredCommissions.length > 0 ? (
        <div className="space-y-3">
          {filteredCommissions.map((commission) => {
            const status = getStatusConfig(commission.status);
            const StatusIcon = status.icon;
            
            return (
              <div key={commission.id} className="bg-white rounded-xl shadow-sm border border-slate-100 p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold text-slate-900">{commission.principal_name}</h3>
                      <Badge className={status.color}>
                        <StatusIcon className="w-3 h-3 mr-1" />
                        {status.label}
                      </Badge>
                    </div>
                    <p className="text-sm text-slate-600">{commission.client_name}</p>
                    <p className="text-xs text-slate-400">Pedido: {commission.order_number}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-emerald-600">
                      {formatCurrency(commission.commission_value)}
                    </p>
                    <p className="text-xs text-slate-400">
                      {commission.commission_rate}% sobre {formatCurrency(commission.invoice_value)}
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                  <div className="flex items-center gap-4 text-xs text-slate-500">
                    {commission.invoice_date && (
                      <div className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        Faturado: {new Date(commission.invoice_date).toLocaleDateString('pt-BR')}
                      </div>
                    )}
                    {commission.payment_due_date && (
                      <div className="flex items-center gap-1">
                        <DollarSign className="w-3 h-3" />
                        Receb.: {new Date(commission.payment_due_date).toLocaleDateString('pt-BR')}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-12 bg-white rounded-xl border border-slate-100">
          <DollarSign className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-500">Nenhuma comissão encontrada</p>
        </div>
      )}

      {/* Total Footer */}
      {filteredCommissions.length > 0 && (
        <div className="mt-6 bg-gradient-to-r from-emerald-500 to-emerald-600 rounded-xl p-4 text-white">
          <div className="flex items-center justify-between">
            <span className="text-sm opacity-90">Total Filtrado</span>
            <span className="text-3xl font-bold">{formatCurrency(totalGeral)}</span>
          </div>
        </div>
      )}
    </div>
  );
}