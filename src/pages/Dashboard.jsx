import React, { useState, useMemo } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { DollarSign, ShoppingCart, FileText, Users, TrendingUp, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import ExecutiveKPICard from '@/components/dashboard/ExecutiveKPICard.jsx';
import FunnelBar from '@/components/dashboard/FunnelBar.jsx';
import AlertsSummaryPanel from '@/components/dashboard/AlertsSummaryPanel.jsx';
import GoalProgressBar from '@/components/dashboard/GoalProgressBar.jsx';
import PriorityOpportunitiesPanel from '@/components/dashboard/PriorityOpportunitiesPanel.jsx';
import TodayAgendaPanel from '@/components/dashboard/TodayAgendaPanel.jsx';
import CommissionSummaryPanel from '@/components/dashboard/CommissionSummaryPanel.jsx';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';

const fmt = (v) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(v || 0);

export default function Dashboard() {
  const queryClient = useQueryClient();
  const [refreshing, setRefreshing] = useState(false);

  const now = new Date();
  const thisMonth = now.getMonth();
  const thisYear = now.getFullYear();

  const greeting = useMemo(() => {
    const h = now.getHours();
    if (h < 12) return 'Bom dia';
    if (h < 18) return 'Boa tarde';
    return 'Boa noite';
  }, []);

  const { data: user } = useQuery({ queryKey: ['user'], queryFn: () => base44.auth.me() });
  const { data: clients = [], isLoading: lc } = useQuery({ queryKey: ['clients'], queryFn: () => base44.entities.Client.list('-opportunity_index', 200) });
  const { data: opportunities = [], isLoading: lo } = useQuery({ queryKey: ['opportunities'], queryFn: () => base44.entities.Opportunity.list('-priority_score', 200) });
  const { data: orders = [], isLoading: lor } = useQuery({ queryKey: ['orders'], queryFn: () => base44.entities.Order.list('-created_date', 200) });
  const { data: quotes = [], isLoading: lq } = useQuery({ queryKey: ['quotes'], queryFn: () => base44.entities.Quote.list('-created_date', 100) });
  const { data: tasks = [] } = useQuery({ queryKey: ['tasks'], queryFn: () => base44.entities.Task.list('-scheduled_date', 100) });
  const { data: commissions = [] } = useQuery({ queryKey: ['commissions'], queryFn: () => base44.entities.Commission.list('-created_date', 300) });
  const { data: installments = [] } = useQuery({ queryKey: ['commission-installments'], queryFn: () => base44.entities.CommissionInstallment.list('-due_date', 300) });
  const { data: goals = [] } = useQuery({ queryKey: ['monthly-goals'], queryFn: () => base44.entities.MonthlyGoal.list('-created_date', 12) });

  const isLoading = lc || lo || lor || lq;

  // Métricas do mês atual
  const monthOrders = useMemo(() => orders.filter(o => {
    const d = new Date(o.created_date);
    return d.getMonth() === thisMonth && d.getFullYear() === thisYear;
  }), [orders, thisMonth, thisYear]);

  const monthRevenue = monthOrders.reduce((s, o) => s + (o.total_value || 0), 0);

  const monthQuotes = useMemo(() => quotes.filter(q => {
    const d = new Date(q.created_date);
    return d.getMonth() === thisMonth && d.getFullYear() === thisYear && ['rascunho', 'emitido', 'enviado'].includes(q.status);
  }), [quotes, thisMonth, thisYear]);

  const pipelineValue = opportunities
    .filter(o => o.stage !== 'perdido' && o.stage !== 'ganho')
    .reduce((s, o) => s + (o.value_estimated || o.total_value || 0), 0);

  const monthGoalRecord = goals.find(g => g.month === `${thisYear}-${String(thisMonth + 1).padStart(2, '0')}`);
  const monthGoal = monthGoalRecord?.revenue_goal || 0;

  const handleRefresh = async () => {
    setRefreshing(true);
    await Promise.all([
      queryClient.invalidateQueries(['clients']),
      queryClient.invalidateQueries(['opportunities']),
      queryClient.invalidateQueries(['orders']),
      queryClient.invalidateQueries(['quotes']),
      queryClient.invalidateQueries(['tasks']),
      queryClient.invalidateQueries(['commissions']),
      queryClient.invalidateQueries(['commission-installments']),
    ]);
    setRefreshing(false);
    toast.success('Dados atualizados!');
  };

  const dateStr = now.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

  return (
    <div className="pb-24 lg:pb-6 space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900">
            {greeting}, {user?.full_name?.split(' ')[0] || 'Representante'} 👋
          </h1>
          <p className="text-xs text-slate-400 capitalize mt-0.5">{dateStr}</p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={handleRefresh}
          disabled={refreshing}
          className="text-slate-500 border-slate-200"
        >
          <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${refreshing ? 'animate-spin' : ''}`} />
          Atualizar
        </Button>
      </div>

      {/* KPI Row */}
      {isLoading ? (
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
          {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-24 rounded-2xl" />)}
        </div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
          <ExecutiveKPICard
            title="Faturado no Mês"
            value={fmt(monthRevenue)}
            subtitle={`${monthOrders.length} pedidos`}
            icon={DollarSign}
            color="green"
            badge={monthGoal > 0 ? `${Math.round((monthRevenue / monthGoal) * 100)}% meta` : undefined}
          />
          <ExecutiveKPICard
            title="Pipeline Ativo"
            value={fmt(pipelineValue)}
            subtitle={`${opportunities.filter(o => o.stage !== 'ganho' && o.stage !== 'perdido').length} oportunidades`}
            icon={TrendingUp}
            color="blue"
          />
          <ExecutiveKPICard
            title="Cotações em Aberto"
            value={monthQuotes.length}
            subtitle={fmt(monthQuotes.reduce((s, q) => s + (q.total_value || 0), 0))}
            icon={FileText}
            color="purple"
          />
          <ExecutiveKPICard
            title="Comissão Prevista"
            value={fmt(commissions.filter(c => c.status === 'prevista').reduce((s, c) => s + (c.commission_total_value || c.commission_value || 0), 0))}
            subtitle="negócios ganhos"
            icon={DollarSign}
            color="green"
          />
          <ExecutiveKPICard
            title="Clientes Ativos"
            value={clients.filter(c => c.status === 'active').length}
            subtitle={`${clients.filter(c => c.status === 'at_risk' || c.status === 'inactive').length} em risco`}
            icon={Users}
            color={clients.filter(c => c.status === 'at_risk' || c.status === 'inactive').length > 0 ? 'red' : 'blue'}
          />
        </div>
      )}

      {/* Meta */}
      {monthGoal > 0 && !isLoading && (
        <GoalProgressBar revenue={monthRevenue} goal={monthGoal} />
      )}

      {/* Funil */}
      {!isLoading && <FunnelBar opportunities={opportunities} />}

      {/* Grid principal */}
      <div className="grid lg:grid-cols-3 gap-4">
        {/* Coluna esquerda: Oportunidades + Agenda */}
        <div className="lg:col-span-2 space-y-4">
          {isLoading ? (
            <Skeleton className="h-64 rounded-2xl" />
          ) : (
            <PriorityOpportunitiesPanel opportunities={opportunities} />
          )}
          {isLoading ? (
            <Skeleton className="h-48 rounded-2xl" />
          ) : (
            <TodayAgendaPanel tasks={tasks} />
          )}
        </div>

        {/* Coluna direita: Alertas + Comissões */}
        <div className="space-y-4">
          {isLoading ? (
            <Skeleton className="h-56 rounded-2xl" />
          ) : (
            <AlertsSummaryPanel
              clients={clients}
              tasks={tasks}
              opportunities={opportunities}
              installments={installments}
            />
          )}
          {isLoading ? (
            <Skeleton className="h-48 rounded-2xl" />
          ) : (
            <CommissionSummaryPanel commissions={commissions} installments={installments} />
          )}
        </div>
      </div>
    </div>
  );
}