import React, { useState, useMemo } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { 
  DollarSign, ShoppingCart, FileText, Users, TrendingUp, RefreshCw,
  Zap, Target, AlertTriangle, Clock, Phone, MessageCircle, Mail,
  ChevronRight, Package, BarChart3, ArrowUp, ArrowDown
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { toast } from 'sonner';

const fmt = (v) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(v || 0);
const fmtPct = (v) => `${(v || 0).toFixed(0)}%`;

/* ── KPI Card ── */
function KPICard({ title, value, sub, icon: Icon, color = 'blue', badge, trend, trendLabel }) {
  const palette = {
    blue:   { icon: 'bg-blue-500',    border: 'border-blue-100',    val: 'text-blue-700' },
    green:  { icon: 'bg-emerald-500', border: 'border-emerald-100', val: 'text-emerald-700' },
    red:    { icon: 'bg-red-500',     border: 'border-red-100',     val: 'text-red-700' },
    amber:  { icon: 'bg-amber-500',   border: 'border-amber-100',   val: 'text-amber-700' },
    purple: { icon: 'bg-violet-500',  border: 'border-violet-100',  val: 'text-violet-700' },
    slate:  { icon: 'bg-slate-500',   border: 'border-slate-100',   val: 'text-slate-700' },
  };
  const c = palette[color] || palette.blue;
  return (
    <div className={`bg-white rounded-2xl border ${c.border} p-4 flex flex-col gap-2`}>
      <div className="flex items-center justify-between">
        <div className={`w-8 h-8 ${c.icon} rounded-xl flex items-center justify-center`}>
          <Icon className="w-4 h-4 text-white" />
        </div>
        {badge && <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 ${c.val}`}>{badge}</span>}
        {trend !== undefined && !badge && (
          <div className={`flex items-center gap-0.5 text-xs font-semibold ${trend >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
            {trend >= 0 ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />}
            {trendLabel}
          </div>
        )}
      </div>
      <div>
        <p className="text-xl font-bold text-slate-900 leading-tight">{value}</p>
        <p className="text-[11px] text-slate-400 uppercase tracking-wide mt-0.5 font-medium">{title}</p>
        {sub && <p className="text-[11px] text-slate-400 mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}

/* ── Funil Inline ── */
function FunnelStrip({ opportunities }) {
  const stages = [
    { id: 'proposta_enviada', label: 'Proposta',   color: 'bg-blue-500',    text: 'text-blue-700',    light: 'bg-blue-50' },
    { id: 'em_negociacao',   label: 'Negociação', color: 'bg-amber-500',   text: 'text-amber-700',   light: 'bg-amber-50' },
    { id: 'ganho',           label: 'Ganho',      color: 'bg-emerald-500', text: 'text-emerald-700', light: 'bg-emerald-50' },
    { id: 'perdido',         label: 'Perdido',    color: 'bg-red-500',     text: 'text-red-700',     light: 'bg-red-50' },
  ];
  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Target className="w-4 h-4 text-slate-500" />
          <span className="text-sm font-semibold text-slate-800">Funil CRM</span>
        </div>
        <Link to={createPageUrl('Opportunities')} className="text-xs text-blue-600 hover:underline flex items-center gap-0.5">
          Abrir CRM <ChevronRight className="w-3 h-3" />
        </Link>
      </div>
      <div className="grid grid-cols-4 gap-2">
        {stages.map(s => {
          const opps = opportunities.filter(o => o.stage === s.id);
          const val = opps.reduce((acc, o) => acc + (o.value_estimated || o.total_value || 0), 0);
          return (
            <div key={s.id} className={`${s.light} rounded-xl p-3 text-center`}>
              <div className={`w-6 h-1 rounded-full ${s.color} mx-auto mb-1.5`} />
              <p className={`text-2xl font-bold ${s.text}`}>{opps.length}</p>
              <p className="text-[10px] text-slate-500 font-medium">{s.label}</p>
              <p className="text-[10px] font-semibold text-slate-600 mt-0.5">{fmt(val)}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ── Meta Bar ── */
function GoalBar({ revenue, goal }) {
  if (!goal) return null;
  const pct = Math.min((revenue / goal) * 100, 100);
  const color = pct >= 100 ? 'bg-emerald-500' : pct >= 70 ? 'bg-blue-500' : pct >= 40 ? 'bg-amber-500' : 'bg-red-500';
  const textColor = pct >= 100 ? 'text-emerald-600' : pct >= 70 ? 'text-blue-600' : pct >= 40 ? 'text-amber-600' : 'text-red-600';
  return (
    <div className="bg-white rounded-2xl border border-slate-200 px-5 py-4">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <Target className="w-4 h-4 text-slate-400" />
          <span className="text-sm font-semibold text-slate-700">Meta do Mês</span>
        </div>
        <span className={`text-lg font-bold ${textColor}`}>{fmtPct(pct)}</span>
      </div>
      <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
        <div className={`h-full rounded-full transition-all ${color}`} style={{ width: `${pct}%` }} />
      </div>
      <div className="flex justify-between mt-1.5">
        <span className="text-xs text-slate-500">{fmt(revenue)} realizado</span>
        <span className="text-xs text-slate-400">meta: {fmt(goal)}</span>
      </div>
    </div>
  );
}

/* ── Alertas ── */
function AlertsBox({ clients, tasks, opportunities, installments }) {
  const today = new Date().toISOString().split('T')[0];
  const overdueTasks = tasks.filter(t => t.status === 'pending' && t.scheduled_date < today);
  const atRisk = clients.filter(c => c.status === 'at_risk' || c.status === 'inactive');
  const stalledOpps = opportunities.filter(o => o.stage !== 'ganho' && o.stage !== 'perdido' && (o.days_without_contact || 0) >= 7);
  const overdueComm = installments.filter(i => i.status !== 'recebida' && i.due_date && i.due_date < today);

  const alerts = [
    overdueTasks.length > 0 && { label: `${overdueTasks.length} follow-ups atrasados`, color: 'bg-red-50 border-red-200 text-red-700', icon: Clock, href: 'Tasks' },
    atRisk.length > 0 && { label: `${atRisk.length} clientes em risco`, color: 'bg-amber-50 border-amber-200 text-amber-700', icon: AlertTriangle, href: 'Clients' },
    stalledOpps.length > 0 && { label: `${stalledOpps.length} oportunidades paradas`, color: 'bg-blue-50 border-blue-200 text-blue-700', icon: Target, href: 'Opportunities' },
    overdueComm.length > 0 && { label: `${overdueComm.length} comissões em atraso`, color: 'bg-violet-50 border-violet-200 text-violet-700', icon: DollarSign, href: 'Financeiro' },
  ].filter(Boolean);

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-4">
      <div className="flex items-center gap-2 mb-3">
        <AlertTriangle className="w-4 h-4 text-slate-500" />
        <span className="text-sm font-semibold text-slate-800">Alertas</span>
        {alerts.length > 0 && <Badge className="bg-red-500 text-white text-[10px] px-1.5">{alerts.length}</Badge>}
      </div>
      {alerts.length === 0 ? (
        <div className="text-center py-4">
          <p className="text-xs text-emerald-600 font-semibold">✅ Tudo em dia!</p>
        </div>
      ) : (
        <div className="space-y-1.5">
          {alerts.map((a, i) => {
            const Icon = a.icon;
            return (
              <Link key={i} to={createPageUrl(a.href)}>
                <div className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-xs font-medium ${a.color} hover:opacity-80 transition`}>
                  <Icon className="w-3.5 h-3.5 flex-shrink-0" />
                  <span className="flex-1">{a.label}</span>
                  <ChevronRight className="w-3 h-3 flex-shrink-0" />
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* ── Oportunidades Prioritárias ── */
function PriorityOpps({ opportunities }) {
  const active = opportunities
    .filter(o => o.stage !== 'ganho' && o.stage !== 'perdido')
    .sort((a, b) => (b.priority_score || 0) - (a.priority_score || 0))
    .slice(0, 5);
  const today = new Date().toISOString().split('T')[0];

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Zap className="w-4 h-4 text-amber-500" />
          <span className="text-sm font-semibold text-slate-800">Oportunidades Prioritárias</span>
        </div>
        <Link to={createPageUrl('Opportunities')} className="text-xs text-blue-600 hover:underline">Ver todas →</Link>
      </div>
      {active.length === 0 ? (
        <p className="text-xs text-slate-400 text-center py-4">Nenhuma oportunidade ativa</p>
      ) : (
        <div className="space-y-2">
          {active.map(o => {
            const overdue = o.next_action_date && o.next_action_date < today;
            const scoreColor = (o.priority_score || 0) >= 70 ? 'bg-red-100 text-red-700' : (o.priority_score || 0) >= 40 ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-600';
            return (
              <div key={o.id} className={`flex items-center gap-3 p-2.5 rounded-xl border ${overdue ? 'border-red-200 bg-red-50/40' : 'border-slate-100 hover:bg-slate-50'} transition`}>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-slate-800 truncate">{o.client_name}</p>
                  <p className="text-xs text-slate-400">{fmt(o.value_estimated || o.total_value)} · {o.principal_name}</p>
                </div>
                <div className="flex items-center gap-1.5 flex-shrink-0">
                  {(o.days_without_contact || 0) > 0 && (
                    <span className="text-[10px] text-slate-400 flex items-center gap-0.5">
                      <Clock className="w-2.5 h-2.5" />{o.days_without_contact}d
                    </span>
                  )}
                  <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${scoreColor}`}>
                    {o.priority_score || 0}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* ── Agenda Hoje ── */
function TodayAgenda({ tasks }) {
  const today = new Date().toISOString().split('T')[0];
  const todayTasks = tasks.filter(t => t.status === 'pending' && t.scheduled_date === today).sort((a, b) => (a.scheduled_time || '').localeCompare(b.scheduled_time || ''));
  const overdue = tasks.filter(t => t.status === 'pending' && t.scheduled_date < today).slice(0, 3);
  const typeIcon = { call: Phone, email: Mail, visit: MessageCircle, follow_up: Clock };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-blue-500" />
          <span className="text-sm font-semibold text-slate-800">Agenda de Hoje</span>
          {todayTasks.length > 0 && <Badge className="bg-blue-500 text-white text-[10px] px-1.5">{todayTasks.length}</Badge>}
        </div>
        <Link to={createPageUrl('Tasks')} className="text-xs text-blue-600 hover:underline">Ver agenda →</Link>
      </div>
      {overdue.length > 0 && (
        <div className="mb-2 space-y-1">
          {overdue.map(t => {
            const Icon = typeIcon[t.task_type] || Clock;
            return (
              <div key={t.id} className="flex items-center gap-2 px-2.5 py-1.5 bg-red-50 border border-red-200 rounded-lg">
                <Icon className="w-3 h-3 text-red-400 flex-shrink-0" />
                <p className="text-xs text-red-700 truncate flex-1">{t.title}</p>
                <span className="text-[10px] text-red-400">Atrasada</span>
              </div>
            );
          })}
        </div>
      )}
      {todayTasks.length === 0 && overdue.length === 0 ? (
        <div className="text-center py-4">
          <p className="text-xs text-slate-400">Sem tarefas para hoje</p>
          <Link to={createPageUrl('Tasks')} className="text-xs text-blue-500 hover:underline mt-1 block">+ Criar tarefa</Link>
        </div>
      ) : (
        <div className="space-y-1">
          {todayTasks.map(t => {
            const Icon = typeIcon[t.task_type] || Clock;
            return (
              <div key={t.id} className="flex items-center gap-2 px-2.5 py-1.5 border border-slate-100 rounded-lg hover:bg-slate-50">
                <Icon className="w-3 h-3 text-slate-400 flex-shrink-0" />
                <p className="text-xs text-slate-700 truncate flex-1">{t.title}</p>
                {t.client_name && <span className="text-[10px] text-slate-400 truncate">{t.client_name}</span>}
                {t.scheduled_time && <span className="text-[10px] text-slate-400 flex-shrink-0">{t.scheduled_time}</span>}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* ── Comissões resumo ── */
function CommissionBox({ commissions, installments }) {
  const today = new Date().toISOString().split('T')[0];
  const prevista = commissions.filter(c => c.status === 'prevista').reduce((s, c) => s + (c.commission_total_value || c.commission_value || 0), 0);
  const aReceber = installments.filter(i => i.status === 'a_receber').reduce((s, i) => s + (i.installment_value || 0), 0);
  const recebida = installments.filter(i => i.status === 'recebida').reduce((s, i) => s + (i.received_value || i.installment_value || 0), 0);
  const atrasada = installments.filter(i => i.status !== 'recebida' && i.due_date && i.due_date < today).reduce((s, i) => s + (i.installment_value || 0), 0);

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <DollarSign className="w-4 h-4 text-emerald-500" />
          <span className="text-sm font-semibold text-slate-800">Comissões</span>
        </div>
        <Link to={createPageUrl('Financeiro')} className="text-xs text-blue-600 hover:underline">Financeiro →</Link>
      </div>
      <div className="grid grid-cols-2 gap-2">
        {[
          { label: 'Prevista', value: prevista, bg: 'bg-blue-50', text: 'text-blue-700' },
          { label: 'A Receber', value: aReceber, bg: 'bg-amber-50', text: 'text-amber-700' },
          { label: 'Recebida', value: recebida, bg: 'bg-emerald-50', text: 'text-emerald-700' },
          { label: 'Atrasada', value: atrasada, bg: atrasada > 0 ? 'bg-red-50' : 'bg-slate-50', text: atrasada > 0 ? 'text-red-700' : 'text-slate-400' },
        ].map(item => (
          <div key={item.label} className={`${item.bg} rounded-xl p-2.5`}>
            <p className={`text-sm font-bold ${item.text}`}>{fmt(item.value)}</p>
            <p className="text-[10px] text-slate-500 mt-0.5">{item.label}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── Insights IA rápidos ── */
function QuickInsights({ clients, orders, opportunities, installments, kpis }) {
  const insights = useMemo(() => {
    const list = [];
    const now = new Date();
    const today = now.toISOString().split('T')[0];

    // Oportunidades hot
    const hot = opportunities.filter(o => (o.priority_score || 0) >= 70 && o.stage !== 'ganho' && o.stage !== 'perdido');
    if (hot.length > 0) list.push({ type: 'opp', text: `${hot.length} oportunidades quentes — ${fmt(hot.reduce((s, o) => s + (o.value_estimated || 0), 0))} em jogo` });

    // Clientes em risco
    const risco = clients.filter(c => c.status === 'at_risk' || c.status === 'inactive');
    if (risco.length > 0) list.push({ type: 'risk', text: `${risco.length} clientes em risco — contato urgente` });

    // Comissões vencendo em 15d
    const in15 = new Date(now.getTime() + 15 * 86400000).toISOString().split('T')[0];
    const dueSoon = installments.filter(i => i.status !== 'recebida' && i.due_date && i.due_date >= today && i.due_date <= in15);
    const dueSoonVal = dueSoon.reduce((s, i) => s + (i.installment_value || 0), 0);
    if (dueSoonVal > 0) list.push({ type: 'info', text: `${fmt(dueSoonVal)} em comissões vencem nos próximos 15 dias` });

    // Meta do mês
    if (kpis.goalPct > 0 && kpis.goalPct < 100) {
      list.push({ type: kpis.goalPct >= 70 ? 'opp' : 'risk', text: `Meta do mês: ${fmtPct(kpis.goalPct)} — faltam ${fmt(kpis.remaining)}` });
    }

    return list.slice(0, 4);
  }, [clients, opportunities, installments, kpis]);

  if (insights.length === 0) return null;

  return (
    <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Zap className="w-4 h-4 text-violet-400" />
          <span className="text-sm font-bold text-white">Insights do Dia</span>
        </div>
        <Link to={createPageUrl('Intelligence')} className="text-xs text-violet-300 hover:underline">Intelligence →</Link>
      </div>
      <div className="space-y-1.5">
        {insights.map((ins, i) => (
          <div key={i} className={`flex items-start gap-2 px-3 py-2 rounded-lg text-xs ${ins.type === 'risk' ? 'bg-red-900/40 text-red-200' : ins.type === 'opp' ? 'bg-emerald-900/40 text-emerald-200' : 'bg-slate-700/50 text-slate-300'}`}>
            <span className="flex-shrink-0">{ins.type === 'risk' ? '⚠️' : ins.type === 'opp' ? '💡' : 'ℹ️'}</span>
            <span>{ins.text}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ══════════════ MAIN DASHBOARD ══════════════ */
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
  const { data: clients = [], isLoading: lc } = useQuery({ queryKey: ['clients'], queryFn: () => base44.entities.Client.list('-opportunity_index', 300) });
  const { data: opportunities = [], isLoading: lo } = useQuery({ queryKey: ['opportunities'], queryFn: () => base44.entities.Opportunity.list('-priority_score', 300) });
  const { data: orders = [], isLoading: lor } = useQuery({ queryKey: ['orders'], queryFn: () => base44.entities.Order.list('-created_date', 500) });
  const { data: quotes = [], isLoading: lq } = useQuery({ queryKey: ['quotes'], queryFn: () => base44.entities.Quote.list('-created_date', 200) });
  const { data: tasks = [] } = useQuery({ queryKey: ['tasks'], queryFn: () => base44.entities.Task.list('-scheduled_date', 200) });
  const { data: commissions = [] } = useQuery({ queryKey: ['commissions'], queryFn: () => base44.entities.Commission.list('-created_date', 500) });
  const { data: installments = [] } = useQuery({ queryKey: ['commission-installments'], queryFn: () => base44.entities.CommissionInstallment.list('-due_date', 500) });
  const { data: goals = [] } = useQuery({ queryKey: ['monthly-goals'], queryFn: () => base44.entities.MonthlyGoal.list('-created_date', 12) });

  const isLoading = lc || lo || lor || lq;

  // KPIs calculados
  const kpis = useMemo(() => {
    const monthOrders = orders.filter(o => {
      const d = new Date(o.created_date);
      return d.getMonth() === thisMonth && d.getFullYear() === thisYear;
    });
    const prevMonthOrders = orders.filter(o => {
      const d = new Date(o.created_date);
      const pm = thisMonth === 0 ? 11 : thisMonth - 1;
      const py = thisMonth === 0 ? thisYear - 1 : thisYear;
      return d.getMonth() === pm && d.getFullYear() === py;
    });

    const monthRevenue = monthOrders.reduce((s, o) => s + (o.total_value || 0), 0);
    const prevRevenue = prevMonthOrders.reduce((s, o) => s + (o.total_value || 0), 0);
    const revTrend = prevRevenue > 0 ? ((monthRevenue - prevRevenue) / prevRevenue) * 100 : 0;

    const pipelineValue = opportunities
      .filter(o => o.stage !== 'perdido' && o.stage !== 'ganho')
      .reduce((s, o) => s + (o.value_estimated || o.total_value || 0), 0);

    const openQuotes = quotes.filter(q => ['rascunho', 'emitido', 'enviado'].includes(q.status));
    const openQuotesVal = openQuotes.reduce((s, q) => s + (q.total_value || 0), 0);

    const commPrevista = commissions.filter(c => c.status === 'prevista').reduce((s, c) => s + (c.commission_total_value || c.commission_value || 0), 0);

    const goalRecord = goals.find(g => g.month === `${thisYear}-${String(thisMonth + 1).padStart(2, '0')}`);
    const monthGoal = goalRecord?.revenue_goal || 0;
    const goalPct = monthGoal > 0 ? (monthRevenue / monthGoal) * 100 : 0;
    const remaining = Math.max(monthGoal - monthRevenue, 0);

    return {
      monthRevenue, prevRevenue, revTrend,
      pipelineValue, pipelineCount: opportunities.filter(o => o.stage !== 'perdido' && o.stage !== 'ganho').length,
      openQuotes: openQuotes.length, openQuotesVal,
      commPrevista,
      activeClients: clients.filter(c => c.status === 'active').length,
      atRiskClients: clients.filter(c => c.status === 'at_risk' || c.status === 'inactive').length,
      monthOrders: monthOrders.length,
      monthGoal, goalPct, remaining,
    };
  }, [orders, quotes, opportunities, commissions, clients, goals, thisMonth, thisYear]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await queryClient.invalidateQueries();
    setRefreshing(false);
    toast.success('Dados atualizados!');
  };

  const dateStr = now.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' });

  return (
    <div className="pb-24 lg:pb-8 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold text-slate-900">
            {greeting}, {user?.full_name?.split(' ')[0] || 'Representante'} 👋
          </h1>
          <p className="text-xs text-slate-400 capitalize">{dateStr}</p>
        </div>
        <Button variant="outline" size="sm" onClick={handleRefresh} disabled={refreshing} className="text-slate-500 border-slate-200">
          <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${refreshing ? 'animate-spin' : ''}`} />
          Atualizar
        </Button>
      </div>

      {/* KPIs */}
      {isLoading ? (
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
          {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-24 rounded-2xl" />)}
        </div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
          <KPICard
            title="Faturado no Mês"
            value={fmt(kpis.monthRevenue)}
            sub={`${kpis.monthOrders} pedidos`}
            icon={DollarSign}
            color="green"
            badge={kpis.monthGoal > 0 ? `${Math.round(kpis.goalPct)}% meta` : undefined}
            trend={kpis.revTrend}
            trendLabel={`${Math.abs(kpis.revTrend).toFixed(0)}%`}
          />
          <KPICard
            title="Pipeline Ativo"
            value={fmt(kpis.pipelineValue)}
            sub={`${kpis.pipelineCount} oportunidades`}
            icon={TrendingUp}
            color="blue"
          />
          <KPICard
            title="Cotações Abertas"
            value={kpis.openQuotes}
            sub={fmt(kpis.openQuotesVal)}
            icon={FileText}
            color="purple"
          />
          <KPICard
            title="Comissão Prevista"
            value={fmt(kpis.commPrevista)}
            sub="negócios ganhos"
            icon={DollarSign}
            color="green"
          />
          <KPICard
            title="Clientes Ativos"
            value={kpis.activeClients}
            sub={kpis.atRiskClients > 0 ? `${kpis.atRiskClients} em risco` : 'sem alertas'}
            icon={Users}
            color={kpis.atRiskClients > 0 ? 'red' : 'blue'}
            badge={kpis.atRiskClients > 0 ? `${kpis.atRiskClients} alertas` : undefined}
          />
        </div>
      )}

      {/* Meta */}
      {!isLoading && kpis.monthGoal > 0 && <GoalBar revenue={kpis.monthRevenue} goal={kpis.monthGoal} />}

      {/* Funil */}
      {!isLoading && <FunnelStrip opportunities={opportunities} />}

      {/* Grid Principal */}
      <div className="grid lg:grid-cols-3 gap-4">
        {/* Coluna esquerda: oportunidades + agenda */}
        <div className="lg:col-span-2 space-y-4">
          {isLoading ? <Skeleton className="h-56 rounded-2xl" /> : <PriorityOpps opportunities={opportunities} />}
          {isLoading ? <Skeleton className="h-44 rounded-2xl" /> : <TodayAgenda tasks={tasks} />}
          {!isLoading && <QuickInsights clients={clients} orders={orders} opportunities={opportunities} installments={installments} kpis={kpis} />}
        </div>

        {/* Coluna direita: alertas + comissões */}
        <div className="space-y-4">
          {isLoading ? <Skeleton className="h-48 rounded-2xl" /> : (
            <AlertsBox clients={clients} tasks={tasks} opportunities={opportunities} installments={installments} />
          )}
          {isLoading ? <Skeleton className="h-44 rounded-2xl" /> : (
            <CommissionBox commissions={commissions} installments={installments} />
          )}

          {/* Atalhos rápidos */}
          {!isLoading && (
            <div className="bg-white rounded-2xl border border-slate-200 p-4">
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-3">Ações Rápidas</p>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { label: 'Novo Orçamento', icon: FileText, href: 'Quotes', color: 'bg-blue-50 text-blue-700 hover:bg-blue-100' },
                  { label: 'Ver CRM', icon: Target, href: 'Opportunities', color: 'bg-amber-50 text-amber-700 hover:bg-amber-100' },
                  { label: 'Intelligence', icon: Zap, href: 'Intelligence', color: 'bg-violet-50 text-violet-700 hover:bg-violet-100' },
                  { label: 'Relatórios', icon: BarChart3, href: 'Reports', color: 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100' },
                ].map(a => {
                  const Icon = a.icon;
                  return (
                    <Link key={a.href} to={createPageUrl(a.href)}>
                      <div className={`flex flex-col items-center gap-1.5 px-2 py-3 rounded-xl text-xs font-semibold transition ${a.color} text-center`}>
                        <Icon className="w-5 h-5" />
                        {a.label}
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}