import React, { useState, useMemo } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import {
  Brain, TrendingUp, TrendingDown, DollarSign, Target, Users, Package,
  Building2, AlertTriangle, Phone, MessageCircle, Mail, Zap, BarChart3,
  Calendar, RefreshCw, ChevronDown, ChevronUp, Star, Award, Shield
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';

const fmt = (v) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(v || 0);
const fmtPct = (v) => `${(v || 0).toFixed(1)}%`;
const COLORS = ['#3b82f6','#10b981','#f59e0b','#ef4444','#8b5cf6','#ec4899','#14b8a6','#f97316'];

/* ── Scoring de cliente ── */
function calcClientScore(client, clientOrders) {
  let score = 0;
  const now = new Date();
  const orders = clientOrders || [];

  // Frequência (0-25)
  const freq = orders.length;
  score += Math.min(freq * 5, 25);

  // Ticket médio (0-20)
  const totalRev = orders.reduce((s, o) => s + (o.total_value || 0), 0);
  const avgTicket = freq > 0 ? totalRev / freq : 0;
  if (avgTicket > 100000) score += 20;
  else if (avgTicket > 50000) score += 15;
  else if (avgTicket > 20000) score += 10;
  else if (avgTicket > 5000) score += 5;

  // Recência (0-30)
  if (client.last_purchase_date) {
    const days = Math.floor((now - new Date(client.last_purchase_date)) / 86400000);
    if (days <= 30) score += 30;
    else if (days <= 60) score += 20;
    else if (days <= 90) score += 10;
    else if (days <= 180) score += 5;
  }

  // Valor total (0-15)
  if (totalRev > 500000) score += 15;
  else if (totalRev > 100000) score += 10;
  else if (totalRev > 20000) score += 5;

  // Recorrência (0-10)
  if (freq >= 10) score += 10;
  else if (freq >= 5) score += 7;
  else if (freq >= 2) score += 3;

  return Math.min(Math.round(score), 100);
}

function clientClassification(score) {
  if (score >= 90) return { label: 'Cliente Estratégico', icon: '🏆', color: 'text-amber-700', bg: 'bg-amber-50', border: 'border-amber-300' };
  if (score >= 80) return { label: 'Cliente Premium', icon: '🥇', color: 'text-yellow-700', bg: 'bg-yellow-50', border: 'border-yellow-300' };
  if (score >= 60) return { label: 'Cliente Ativo', icon: '🟢', color: 'text-emerald-700', bg: 'bg-emerald-50', border: 'border-emerald-300' };
  if (score >= 40) return { label: 'Atenção', icon: '🟡', color: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-200' };
  return { label: 'Em Risco', icon: '🔴', color: 'text-red-700', bg: 'bg-red-50', border: 'border-red-300' };
}

/* ── KPI Card ── */
function KPICard({ label, value, sub, color = 'blue', icon: Icon }) {
  const map = {
    blue: 'bg-blue-500', green: 'bg-emerald-500', red: 'bg-red-500',
    amber: 'bg-amber-500', purple: 'bg-violet-500', slate: 'bg-slate-500'
  };
  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-4 flex items-start gap-3">
      <div className={`w-9 h-9 ${map[color] || map.blue} rounded-xl flex items-center justify-center flex-shrink-0`}>
        <Icon className="w-5 h-5 text-white" />
      </div>
      <div className="min-w-0">
        <p className="text-lg font-bold text-slate-900 leading-none truncate">{value}</p>
        <p className="text-[10px] text-slate-500 uppercase tracking-wide mt-0.5">{label}</p>
        {sub && <p className="text-[10px] text-slate-400 mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}

/* ── Section Header ── */
function SectionHeader({ icon: Icon, title, sub }) {
  return (
    <div className="flex items-center gap-3 mb-4">
      <div className="w-8 h-8 bg-slate-100 rounded-xl flex items-center justify-center">
        <Icon className="w-4 h-4 text-slate-600" />
      </div>
      <div>
        <h2 className="text-base font-bold text-slate-800">{title}</h2>
        {sub && <p className="text-xs text-slate-400">{sub}</p>}
      </div>
    </div>
  );
}

export default function Intelligence() {
  const [periodFilter, setPeriodFilter] = useState('all');
  const [principalFilter, setPrincipalFilter] = useState('all');
  const [segmentFilter, setSegmentFilter] = useState('all');

  const { data: clients = [], isLoading: lc } = useQuery({ queryKey: ['clients'], queryFn: () => base44.entities.Client.list('-opportunity_index', 300) });
  const { data: orders = [], isLoading: lo } = useQuery({ queryKey: ['orders'], queryFn: () => base44.entities.Order.list('-created_date', 1000) });
  const { data: quotes = [], isLoading: lq } = useQuery({ queryKey: ['quotes'], queryFn: () => base44.entities.Quote.list('-created_date', 500) });
  const { data: opportunities = [] } = useQuery({ queryKey: ['opportunities'], queryFn: () => base44.entities.Opportunity.list('-created_date', 300) });
  const { data: commissions = [] } = useQuery({ queryKey: ['commissions'], queryFn: () => base44.entities.Commission.list('-created_date', 500) });
  const { data: installments = [] } = useQuery({ queryKey: ['commission-installments'], queryFn: () => base44.entities.CommissionInstallment.list('-due_date', 500) });
  const { data: principals = [] } = useQuery({ queryKey: ['principals'], queryFn: () => base44.entities.Principal.list('company_name', 50) });
  const { data: goals = [] } = useQuery({ queryKey: ['monthly-goals'], queryFn: () => base44.entities.MonthlyGoal.list('-created_date', 12) });

  const isLoading = lc || lo || lq;

  /* ── filtro período ── */
  const filteredOrders = useMemo(() => {
    const now = new Date();
    return orders.filter(o => {
      const d = new Date(o.created_date);
      if (isNaN(d)) return false;
      if (principalFilter !== 'all' && o.principal_id !== principalFilter) return false;
      if (periodFilter === 'month') return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
      if (periodFilter === 'quarter') {
        const q = Math.floor(now.getMonth() / 3);
        return Math.floor(d.getMonth() / 3) === q && d.getFullYear() === now.getFullYear();
      }
      if (periodFilter === 'year') return d.getFullYear() === now.getFullYear();
      return true;
    });
  }, [orders, periodFilter, principalFilter]);

  /* ── KPIs gerais ── */
  const kpis = useMemo(() => {
    const now = new Date();
    const m = now.getMonth(); const y = now.getFullYear();
    const today = orders.filter(o => new Date(o.created_date).toDateString() === now.toDateString());
    const week = orders.filter(o => (now - new Date(o.created_date)) / 86400000 <= 7);
    const month = orders.filter(o => { const d = new Date(o.created_date); return d.getMonth() === m && d.getFullYear() === y; });
    const year = orders.filter(o => new Date(o.created_date).getFullYear() === y);

    const rev = (arr) => arr.reduce((s, o) => s + (o.total_value || 0), 0);
    const convRate = quotes.length > 0 ? (opportunities.filter(o => o.stage === 'ganho').length / quotes.length) * 100 : 0;

    const prevista = commissions.filter(c => c.status === 'prevista').reduce((s, c) => s + (c.commission_total_value || c.commission_value || 0), 0);
    const aReceber = installments.filter(i => i.status === 'a_receber').reduce((s, i) => s + (i.installment_value || 0), 0);
    const recebida = installments.filter(i => i.status === 'recebida').reduce((s, i) => s + (i.received_value || i.installment_value || 0), 0);

    const goalRecord = goals.find(g => g.month === `${y}-${String(m + 1).padStart(2, '0')}`);
    const monthGoal = goalRecord?.revenue_goal || 0;
    const monthRev = rev(month);
    const goalPct = monthGoal > 0 ? (monthRev / monthGoal) * 100 : 0;

    return { today: rev(today), week: rev(week), month: monthRev, year: rev(year), convRate, prevista, aReceber, recebida, monthGoal, goalPct, todayOrders: today.length, monthOrders: month.length };
  }, [orders, quotes, opportunities, commissions, installments, goals]);

  /* ── Previsão 30/60/90 ── */
  const forecast = useMemo(() => {
    const now = new Date();
    const last90 = orders.filter(o => (now - new Date(o.created_date)) / 86400000 <= 90);
    const daily = last90.reduce((s, o) => s + (o.total_value || 0), 0) / 90;
    return { d30: daily * 30, d60: daily * 60, d90: daily * 90, goalProb: kpis.goalPct };
  }, [orders, kpis]);

  /* ── Score de clientes ── */
  const clientsWithScore = useMemo(() => {
    return clients.map(c => {
      const co = orders.filter(o => o.client_id === c.id);
      const score = calcClientScore(c, co);
      const totalRev = co.reduce((s, o) => s + (o.total_value || 0), 0);
      const lastOrder = co.sort((a, b) => new Date(b.created_date) - new Date(a.created_date))[0];
      const daysSince = c.last_purchase_date ? Math.floor((new Date() - new Date(c.last_purchase_date)) / 86400000) : null;
      return { ...c, score, totalRev, orderCount: co.length, lastOrderProduct: lastOrder?.items?.[0]?.product_name, daysSincePurchase: daysSince };
    }).sort((a, b) => b.score - a.score);
  }, [clients, orders]);

  /* ── ABC Clientes ── */
  const abcClients = useMemo(() => {
    const total = filteredOrders.reduce((s, o) => s + (o.total_value || 0), 0);
    const map = {};
    filteredOrders.forEach(o => {
      const k = o.client_name || 'Desconhecido';
      map[k] = (map[k] || 0) + (o.total_value || 0);
    });
    const sorted = Object.entries(map).sort((a, b) => b[1] - a[1]);
    let cum = 0;
    return sorted.map(([name, value]) => {
      cum += value;
      const pct = total > 0 ? (cum / total) * 100 : 0;
      return { name, value, pct, class: pct <= 80 ? 'A' : pct <= 95 ? 'B' : 'C' };
    });
  }, [filteredOrders]);

  /* ── ABC Produtos ── */
  const abcProducts = useMemo(() => {
    const map = {};
    filteredOrders.forEach(o => o.items?.forEach(i => {
      const k = i.product_name || 'Sem nome';
      if (!map[k]) map[k] = { value: 0, weight: 0 };
      map[k].value += i.item_total || 0;
      map[k].weight += i.total_weight || 0;
    }));
    const total = Object.values(map).reduce((s, v) => s + v.value, 0);
    const sorted = Object.entries(map).sort((a, b) => b[1].value - a[1].value);
    let cum = 0;
    return sorted.map(([name, { value, weight }]) => {
      cum += value;
      const pct = total > 0 ? (cum / total) * 100 : 0;
      return { name, value, weight, pct, class: pct <= 80 ? 'A' : pct <= 95 ? 'B' : 'C' };
    }).slice(0, 20);
  }, [filteredOrders]);

  /* ── Sazonalidade ── */
  const seasonality = useMemo(() => {
    const months = Array.from({ length: 12 }, (_, i) => ({
      month: new Date(2000, i).toLocaleString('pt-BR', { month: 'short' }),
      revenue: 0, orders: 0
    }));
    orders.forEach(o => {
      const m = new Date(o.created_date).getMonth();
      if (!isNaN(m)) { months[m].revenue += o.total_value || 0; months[m].orders++; }
    });
    return months;
  }, [orders]);

  /* ── Performance por Representada ── */
  const principalPerf = useMemo(() => {
    const map = {};
    filteredOrders.forEach(o => {
      const k = o.principal_name || 'Desconhecida';
      if (!map[k]) map[k] = { name: k, revenue: 0, orders: 0, commission: 0 };
      map[k].revenue += o.total_value || 0;
      map[k].orders++;
    });
    const totalRev = Object.values(map).reduce((s, v) => s + v.revenue, 0);
    return Object.values(map).map(p => ({
      ...p,
      share: totalRev > 0 ? (p.revenue / totalRev) * 100 : 0,
      avgTicket: p.orders > 0 ? p.revenue / p.orders : 0
    })).sort((a, b) => b.revenue - a.revenue);
  }, [filteredOrders]);

  /* ── Clientes para recuperar ── */
  const recoveryClients = useMemo(() => {
    return clientsWithScore
      .filter(c => c.daysSincePurchase !== null && c.daysSincePurchase >= 30)
      .sort((a, b) => b.daysSincePurchase - a.daysSincePurchase)
      .slice(0, 20);
  }, [clientsWithScore]);

  /* ── Insights IA ── */
  const aiInsights = useMemo(() => {
    const insights = [];
    const now = new Date();

    // Clientes concentrados
    const top3Revenue = abcClients.slice(0, 3).reduce((s, c) => s + c.value, 0);
    const totalRev = abcClients.reduce((s, c) => s + c.value, 0);
    if (totalRev > 0 && abcClients.length >= 3) {
      const pct = (top3Revenue / totalRev * 100).toFixed(0);
      insights.push({ type: 'risk', text: `${abcClients.slice(0, 3).length} clientes representam ${pct}% da sua receita. Alta concentração de risco.` });
    }

    // Oportunidades com alta chance
    const hotOpps = opportunities.filter(o => (o.priority_score || 0) >= 70 && o.stage !== 'ganho' && o.stage !== 'perdido');
    const hotValue = hotOpps.reduce((s, o) => s + (o.value_estimated || o.total_value || 0), 0);
    if (hotOpps.length > 0) {
      insights.push({ type: 'opportunity', text: `Você possui ${fmt(hotValue)} em oportunidades com alta chance de fechamento (${hotOpps.length} deals).` });
    }

    // Clientes em risco de perda
    const atRisk = clients.filter(c => c.status === 'at_risk' || c.status === 'inactive');
    if (atRisk.length > 0) {
      insights.push({ type: 'risk', text: `${atRisk.length} clientes estão em risco ou inativos. Reative contato imediatamente.` });
    }

    // Comissões em atraso
    const today = now.toISOString().split('T')[0];
    const overdueComm = installments.filter(i => i.status !== 'recebida' && i.due_date && i.due_date < today);
    const overdueVal = overdueComm.reduce((s, i) => s + (i.installment_value || 0), 0);
    if (overdueVal > 0) {
      insights.push({ type: 'risk', text: `Existem ${fmt(overdueVal)} em comissões em atraso (${overdueComm.length} parcelas).` });
    }

    // Maior representada
    if (principalPerf.length > 0) {
      const top = principalPerf[0];
      insights.push({ type: 'info', text: `${top.name} lidera com ${fmt(top.revenue)} (${top.share.toFixed(0)}% do faturamento).` });
    }

    // Meta do mês
    if (kpis.monthGoal > 0) {
      const remaining = kpis.monthGoal - kpis.month;
      if (remaining > 0) {
        insights.push({ type: kpis.goalPct >= 70 ? 'opportunity' : 'risk', text: `Meta do mês: ${fmtPct(kpis.goalPct)} atingida. Faltam ${fmt(remaining)} para bater a meta.` });
      } else {
        insights.push({ type: 'opportunity', text: `🎯 Meta do mês batida! Faturamento de ${fmt(kpis.month)} superou a meta de ${fmt(kpis.monthGoal)}.` });
      }
    }

    // Recompra iminente
    const recompra = clientsWithScore.filter(c => {
      const cycle = c.average_purchase_cycle || 30;
      return c.daysSincePurchase >= cycle * 0.9 && c.daysSincePurchase < cycle * 1.3;
    });
    if (recompra.length > 0) {
      insights.push({ type: 'opportunity', text: `${recompra.length} clientes estão no ciclo de recompra. Alta probabilidade de pedido em breve.` });
    }

    return insights;
  }, [abcClients, opportunities, clients, installments, principalPerf, kpis, clientsWithScore]);

  if (isLoading) {
    return (
      <div className="space-y-4 pb-20">
        <Skeleton className="h-12 w-72 rounded-xl" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {[...Array(8)].map((_, i) => <Skeleton key={i} className="h-20 rounded-2xl" />)}
        </div>
        <Skeleton className="h-64 rounded-2xl" />
      </div>
    );
  }

  const segments = [...new Set(clients.map(c => c.segment).filter(Boolean))];

  return (
    <div className="pb-24 lg:pb-8 space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-violet-600 rounded-xl flex items-center justify-center">
              <Brain className="w-4 h-4 text-white" />
            </div>
            <h1 className="text-xl font-bold text-slate-900">SalesMind Intelligence Center</h1>
          </div>
          <p className="text-xs text-slate-400">Cockpit comercial integrado · Dados em tempo real</p>
        </div>

        {/* Filtros globais */}
        <div className="flex flex-wrap gap-2">
          <Select value={periodFilter} onValueChange={setPeriodFilter}>
            <SelectTrigger className="w-36 h-8 text-xs">
              <SelectValue placeholder="Período" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todo período</SelectItem>
              <SelectItem value="month">Este mês</SelectItem>
              <SelectItem value="quarter">Este trimestre</SelectItem>
              <SelectItem value="year">Este ano</SelectItem>
            </SelectContent>
          </Select>
          <Select value={principalFilter} onValueChange={setPrincipalFilter}>
            <SelectTrigger className="w-36 h-8 text-xs">
              <SelectValue placeholder="Representada" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas</SelectItem>
              {principals.map(p => <SelectItem key={p.id} value={p.id}>{p.trade_name || p.company_name}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* KPIs executivos */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <KPICard label="Hoje" value={fmt(kpis.today)} sub={`${kpis.todayOrders} pedidos`} icon={DollarSign} color="green" />
        <KPICard label="Mês Atual" value={fmt(kpis.month)} sub={`${kpis.monthOrders} pedidos`} icon={TrendingUp} color="blue" />
        <KPICard label="Ano" value={fmt(kpis.year)} sub="faturamento" icon={BarChart3} color="purple" />
        <KPICard label="Conversão" value={fmtPct(kpis.convRate)} sub={`${opportunities.filter(o=>o.stage==='ganho').length} negócios ganhos`} icon={Target} color="amber" />
        <KPICard label="Comissão Prevista" value={fmt(kpis.prevista)} sub="negócios ganhos" icon={DollarSign} color="green" />
        <KPICard label="A Receber" value={fmt(kpis.aReceber)} sub="aguardando" icon={Calendar} color="amber" />
        <KPICard label="Recebida" value={fmt(kpis.recebida)} sub="confirmada" icon={DollarSign} color="green" />
        <KPICard label="Pipeline" value={fmt(opportunities.filter(o=>o.stage!=='ganho'&&o.stage!=='perdido').reduce((s,o)=>s+(o.value_estimated||o.total_value||0),0))} sub={`${opportunities.filter(o=>o.stage!=='ganho'&&o.stage!=='perdido').length} oportunidades`} icon={Zap} color="blue" />
      </div>

      {/* Meta + Previsão */}
      <div className="grid lg:grid-cols-2 gap-4">
        {/* Meta */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5">
          <SectionHeader icon={Target} title="Meta vs Realizado" sub="Mês atual" />
          {kpis.monthGoal > 0 ? (
            <>
              <div className="flex items-end justify-between mb-3">
                <div>
                  <p className="text-2xl font-bold text-slate-900">{fmt(kpis.month)}</p>
                  <p className="text-xs text-slate-400">de {fmt(kpis.monthGoal)} · meta</p>
                </div>
                <p className={`text-3xl font-bold ${kpis.goalPct >= 100 ? 'text-emerald-500' : kpis.goalPct >= 70 ? 'text-blue-500' : 'text-red-500'}`}>
                  {kpis.goalPct.toFixed(0)}%
                </p>
              </div>
              <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden mb-3">
                <div className={`h-full rounded-full transition-all ${kpis.goalPct >= 100 ? 'bg-emerald-500' : kpis.goalPct >= 70 ? 'bg-blue-500' : 'bg-red-500'}`} style={{ width: `${Math.min(kpis.goalPct, 100)}%` }} />
              </div>
              <p className="text-xs text-slate-500">{kpis.goalPct >= 100 ? '🎯 Meta atingida!' : `Faltam ${fmt(kpis.monthGoal - kpis.month)} para bater a meta`}</p>
            </>
          ) : (
            <p className="text-sm text-slate-400">Configure uma meta em Configurações para visualizar aqui.</p>
          )}
        </div>

        {/* Previsão */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5">
          <SectionHeader icon={TrendingUp} title="Motor de Previsão" sub="Baseado nos últimos 90 dias" />
          <div className="grid grid-cols-3 gap-3">
            {[{ label: '30 dias', value: forecast.d30 }, { label: '60 dias', value: forecast.d60 }, { label: '90 dias', value: forecast.d90 }].map(f => (
              <div key={f.label} className="bg-blue-50 rounded-xl p-3 text-center">
                <p className="text-base font-bold text-blue-700">{fmt(f.value)}</p>
                <p className="text-[10px] text-slate-500 mt-0.5">{f.label}</p>
              </div>
            ))}
          </div>
          {kpis.monthGoal > 0 && (
            <div className="mt-3 p-3 bg-slate-50 rounded-xl">
              <p className="text-xs text-slate-600">
                Probabilidade de atingir meta: <strong className={kpis.goalPct >= 70 ? 'text-emerald-600' : 'text-red-500'}>{Math.min(Math.round(kpis.goalPct), 100)}%</strong>
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Insights IA */}
      <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl p-5">
        <div className="flex items-center gap-2 mb-4">
          <Brain className="w-5 h-5 text-violet-400" />
          <h2 className="text-sm font-bold text-white">Insights de Inteligência Artificial</h2>
          <Badge className="bg-violet-600 text-white text-[10px]">Automático</Badge>
        </div>
        <div className="space-y-2">
          {aiInsights.map((ins, i) => (
            <div key={i} className={`flex items-start gap-2 px-3 py-2 rounded-lg text-sm ${ins.type === 'risk' ? 'bg-red-900/40 text-red-200' : ins.type === 'opportunity' ? 'bg-emerald-900/40 text-emerald-200' : 'bg-slate-700/50 text-slate-300'}`}>
              <span className="flex-shrink-0 mt-0.5">{ins.type === 'risk' ? '⚠️' : ins.type === 'opportunity' ? '💡' : 'ℹ️'}</span>
              <span>{ins.text}</span>
            </div>
          ))}
          {aiInsights.length === 0 && <p className="text-slate-400 text-sm">Carregando análises...</p>}
        </div>
      </div>

      {/* Tabs principais */}
      <Tabs defaultValue="clients">
        <TabsList className="flex flex-wrap gap-1 h-auto p-1">
          <TabsTrigger value="clients">👥 Clientes</TabsTrigger>
          <TabsTrigger value="recovery">🔔 Recuperação</TabsTrigger>
          <TabsTrigger value="abc">📊 Curva ABC</TabsTrigger>
          <TabsTrigger value="products">📦 Produtos</TabsTrigger>
          <TabsTrigger value="principals">🏢 Representadas</TabsTrigger>
          <TabsTrigger value="seasonality">📅 Sazonalidade</TabsTrigger>
          <TabsTrigger value="commissions">💰 Comissões</TabsTrigger>
        </TabsList>

        {/* TAB: SCORE DE CLIENTES */}
        <TabsContent value="clients" className="mt-4 space-y-3">
          <SectionHeader icon={Users} title="Score de Inteligência de Clientes" sub="Classificação automática por frequência, ticket, recência e valor" />
          <div className="space-y-2">
            {clientsWithScore.slice(0, 30).map(c => {
              const cls = clientClassification(c.score);
              return (
                <Link key={c.id} to={createPageUrl(`ClientDetails?id=${c.id}`)} className="block">
                  <div className={`flex items-center gap-3 p-3 rounded-xl border ${cls.border} ${cls.bg} hover:shadow-sm transition`}>
                    <div className="text-lg w-6 text-center">{cls.icon}</div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-slate-800 truncate">{c.trade_name || c.company_name}</p>
                      <p className={`text-[10px] font-medium ${cls.color}`}>{cls.label}</p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-sm font-bold text-slate-700">{fmt(c.totalRev)}</p>
                      <p className="text-[10px] text-slate-400">{c.orderCount} pedidos</p>
                    </div>
                    <div className="flex-shrink-0">
                      <div className="w-12 h-12 rounded-full border-2 border-current flex items-center justify-center" style={{ borderColor: c.score >= 80 ? '#10b981' : c.score >= 60 ? '#3b82f6' : c.score >= 40 ? '#f59e0b' : '#ef4444' }}>
                        <span className="text-xs font-bold text-slate-700">{c.score}</span>
                      </div>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </TabsContent>

        {/* TAB: RECUPERAÇÃO */}
        <TabsContent value="recovery" className="mt-4 space-y-3">
          <SectionHeader icon={AlertTriangle} title="Central de Recuperação de Clientes" sub="Clientes sem compra por período — ordenados por urgência" />
          {recoveryClients.length === 0 ? (
            <div className="text-center py-12 text-slate-400">Nenhum cliente em recuperação identificado.</div>
          ) : (
            <div className="space-y-2">
              {recoveryClients.map(c => {
                const days = c.daysSincePurchase;
                const urgency = days >= 180 ? { label: '180+ dias', color: 'bg-red-600' } :
                  days >= 120 ? { label: '120+ dias', color: 'bg-red-500' } :
                  days >= 90 ? { label: '90+ dias', color: 'bg-amber-500' } :
                  days >= 60 ? { label: '60+ dias', color: 'bg-amber-400' } :
                  { label: '30+ dias', color: 'bg-blue-400' };
                return (
                  <div key={c.id} className="bg-white border border-slate-200 rounded-xl p-4 flex items-center gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="text-sm font-semibold text-slate-800 truncate">{c.trade_name || c.company_name}</p>
                        <Badge className={`${urgency.color} text-white text-[10px]`}>{urgency.label}</Badge>
                      </div>
                      <p className="text-xs text-slate-400">Último produto: {c.lastOrderProduct || 'N/A'} · {fmt(c.totalRev)} total</p>
                    </div>
                    <div className="flex gap-1 flex-shrink-0">
                      {c.whatsapp && (
                        <a href={`https://wa.me/${c.whatsapp.replace(/\D/g,'')}`} target="_blank" rel="noreferrer">
                          <Button size="sm" className="h-7 bg-emerald-500 hover:bg-emerald-600 text-white px-2 text-xs">
                            <MessageCircle className="w-3 h-3" />
                          </Button>
                        </a>
                      )}
                      {c.phone && (
                        <a href={`tel:${c.phone}`}>
                          <Button size="sm" variant="outline" className="h-7 px-2 text-xs">
                            <Phone className="w-3 h-3" />
                          </Button>
                        </a>
                      )}
                      {c.email && (
                        <a href={`mailto:${c.email}`}>
                          <Button size="sm" variant="outline" className="h-7 px-2 text-xs">
                            <Mail className="w-3 h-3" />
                          </Button>
                        </a>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </TabsContent>

        {/* TAB: CURVA ABC */}
        <TabsContent value="abc" className="mt-4 space-y-6">
          <div className="grid lg:grid-cols-2 gap-6">
            {/* ABC Clientes */}
            <div className="bg-white rounded-2xl border border-slate-200 p-5">
              <SectionHeader icon={Users} title="ABC — Clientes" sub="Por faturamento" />
              <div className="space-y-1 max-h-80 overflow-y-auto">
                {abcClients.slice(0, 20).map((c, i) => (
                  <div key={i} className="flex items-center gap-2 py-1.5 border-b border-slate-50">
                    <Badge className={`w-5 h-5 flex items-center justify-center text-[10px] font-bold flex-shrink-0 ${c.class === 'A' ? 'bg-emerald-500' : c.class === 'B' ? 'bg-blue-500' : 'bg-slate-400'}`}>{c.class}</Badge>
                    <span className="text-xs text-slate-700 flex-1 truncate">{c.name}</span>
                    <span className="text-xs font-semibold text-emerald-600 flex-shrink-0">{fmt(c.value)}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* ABC Produtos */}
            <div className="bg-white rounded-2xl border border-slate-200 p-5">
              <SectionHeader icon={Package} title="ABC — Produtos" sub="Por faturamento" />
              <div className="space-y-1 max-h-80 overflow-y-auto">
                {abcProducts.map((p, i) => (
                  <div key={i} className="flex items-center gap-2 py-1.5 border-b border-slate-50">
                    <Badge className={`w-5 h-5 flex items-center justify-center text-[10px] font-bold flex-shrink-0 ${p.class === 'A' ? 'bg-emerald-500' : p.class === 'B' ? 'bg-blue-500' : 'bg-slate-400'}`}>{p.class}</Badge>
                    <span className="text-xs text-slate-700 flex-1 truncate">{p.name}</span>
                    <span className="text-xs text-slate-400 flex-shrink-0">{p.weight.toFixed(0)}kg</span>
                    <span className="text-xs font-semibold text-emerald-600 flex-shrink-0">{fmt(p.value)}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </TabsContent>

        {/* TAB: PRODUTOS */}
        <TabsContent value="products" className="mt-4 space-y-4">
          <SectionHeader icon={Package} title="Análise de Produtos" sub="Mais vendidos por faturamento e volume" />
          <div className="bg-white rounded-2xl border border-slate-200 p-5">
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={abcProducts.slice(0, 10)} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis type="number" tick={{ fontSize: 11 }} tickFormatter={v => `${(v/1000).toFixed(0)}k`} />
                  <YAxis type="category" dataKey="name" width={120} tick={{ fontSize: 10 }} />
                  <Tooltip formatter={v => fmt(v)} />
                  <Bar dataKey="value" fill="#3b82f6" radius={[0, 4, 4, 0]} name="Faturamento" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
          <div className="grid grid-cols-1 gap-2">
            {abcProducts.slice(0, 10).map((p, i) => (
              <div key={i} className="bg-white border border-slate-100 rounded-xl p-3 flex items-center gap-3">
                <span className="w-6 h-6 bg-slate-100 rounded-lg flex items-center justify-center text-xs font-bold text-slate-500 flex-shrink-0">{i + 1}</span>
                <span className="flex-1 text-sm font-medium text-slate-700 truncate">{p.name}</span>
                <span className="text-xs text-slate-400">{p.weight.toFixed(0)} kg</span>
                <span className="text-sm font-semibold text-emerald-600">{fmt(p.value)}</span>
              </div>
            ))}
          </div>
        </TabsContent>

        {/* TAB: REPRESENTADAS */}
        <TabsContent value="principals" className="mt-4 space-y-4">
          <SectionHeader icon={Building2} title="Performance por Representada" sub="Receita, participação e ticket médio" />
          <div className="grid gap-3">
            {principalPerf.map((p, i) => (
              <div key={i} className="bg-white rounded-2xl border border-slate-200 p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-400 w-5">#{i+1}</span>
                    <h4 className="font-bold text-slate-800 text-sm">{p.name}</h4>
                  </div>
                  <Badge className="bg-blue-100 text-blue-700 text-xs">{p.share.toFixed(1)}% receita</Badge>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div className="text-center">
                    <p className="text-base font-bold text-emerald-600">{fmt(p.revenue)}</p>
                    <p className="text-[10px] text-slate-400">Receita</p>
                  </div>
                  <div className="text-center">
                    <p className="text-base font-bold text-blue-600">{p.orders}</p>
                    <p className="text-[10px] text-slate-400">Pedidos</p>
                  </div>
                  <div className="text-center">
                    <p className="text-base font-bold text-purple-600">{fmt(p.avgTicket)}</p>
                    <p className="text-[10px] text-slate-400">Ticket Médio</p>
                  </div>
                </div>
                <div className="mt-3 w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full bg-blue-500 rounded-full" style={{ width: `${p.share}%` }} />
                </div>
              </div>
            ))}
            {principalPerf.length === 0 && <p className="text-slate-400 text-sm text-center py-8">Sem dados de pedidos para o período selecionado.</p>}
          </div>
        </TabsContent>

        {/* TAB: SAZONALIDADE */}
        <TabsContent value="seasonality" className="mt-4 space-y-4">
          <SectionHeader icon={Calendar} title="Análise de Sazonalidade" sub="Padrões históricos mês a mês" />
          <div className="bg-white rounded-2xl border border-slate-200 p-5">
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={seasonality}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} tickFormatter={v => `${(v/1000).toFixed(0)}k`} />
                  <Tooltip formatter={v => fmt(v)} />
                  <Bar dataKey="revenue" fill="#3b82f6" radius={[4, 4, 0, 0]} name="Faturamento" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
          <div className="grid grid-cols-3 lg:grid-cols-6 gap-2">
            {seasonality.map((m, i) => {
              const maxRev = Math.max(...seasonality.map(s => s.revenue));
              const pct = maxRev > 0 ? (m.revenue / maxRev) * 100 : 0;
              return (
                <div key={i} className="bg-white border border-slate-100 rounded-xl p-3 text-center">
                  <p className="text-[10px] text-slate-400 uppercase">{m.month}</p>
                  <p className="text-sm font-bold text-slate-700 mt-1">{fmt(m.revenue)}</p>
                  <div className="w-full h-1 bg-slate-100 rounded-full overflow-hidden mt-2">
                    <div className="h-full bg-blue-400 rounded-full" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </TabsContent>

        {/* TAB: COMISSÕES */}
        <TabsContent value="commissions" className="mt-4 space-y-4">
          <SectionHeader icon={DollarSign} title="Análise de Comissões" sub="Fluxo previsto e realizado" />
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {[
              { label: 'Prevista', value: kpis.prevista, color: 'blue' },
              { label: 'A Receber', value: kpis.aReceber, color: 'amber' },
              { label: 'Recebida', value: kpis.recebida, color: 'green' },
              { label: 'Total Projetado', value: kpis.prevista + kpis.aReceber + kpis.recebida, color: 'purple' },
            ].map(item => (
              <KPICard key={item.label} label={item.label} value={fmt(item.value)} icon={DollarSign} color={item.color} />
            ))}
          </div>

          {/* Fluxo futuro */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5">
            <h3 className="text-sm font-bold text-slate-700 mb-4">Fluxo de Comissões — Próximos vencimentos</h3>
            <div className="space-y-2 max-h-72 overflow-y-auto">
              {installments
                .filter(i => i.status !== 'recebida' && i.due_date)
                .sort((a, b) => a.due_date.localeCompare(b.due_date))
                .slice(0, 20)
                .map((inst, i) => {
                  const isOverdue = inst.due_date < new Date().toISOString().split('T')[0];
                  return (
                    <div key={i} className={`flex items-center gap-3 py-2 border-b border-slate-50 ${isOverdue ? 'opacity-80' : ''}`}>
                      <Badge className={isOverdue ? 'bg-red-500 text-white' : inst.status === 'a_receber' ? 'bg-amber-500 text-white' : 'bg-slate-200 text-slate-600'}>{isOverdue ? 'Atrasada' : inst.status === 'a_receber' ? 'A Receber' : 'Prevista'}</Badge>
                      <span className="text-xs text-slate-500 flex-shrink-0">{inst.due_date ? new Date(inst.due_date).toLocaleDateString('pt-BR') : '-'}</span>
                      <span className="text-xs text-slate-700 flex-1 truncate">Parcela #{inst.installment_no}</span>
                      <span className="text-sm font-semibold text-emerald-600">{fmt(inst.installment_value)}</span>
                    </div>
                  );
                })}
              {installments.filter(i => i.status !== 'recebida').length === 0 && (
                <p className="text-slate-400 text-sm text-center py-6">Nenhum vencimento pendente.</p>
              )}
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}