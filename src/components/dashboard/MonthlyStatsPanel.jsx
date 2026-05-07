import React from 'react';
import { DollarSign, FileText, Target, TrendingUp, TrendingDown, CheckCircle } from 'lucide-react';
import StatsCard from './StatsCard';

const MONTHS = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
];

function getPeriodLabel(selectedMonth, selectedYear, periodType) {
  if (periodType === 'year') return `Ano ${selectedYear}`;
  if (periodType === 'quarter') {
    const q = Math.floor(selectedMonth / 3) + 1;
    return `T${q} ${selectedYear}`;
  }
  return `${MONTHS[selectedMonth]} ${selectedYear}`;
}

export default function MonthlyStatsPanel({
  quotes = [], opportunities = [], orders = [], commissions = [],
  selectedMonth, selectedYear, periodType = 'month'
}) {

  const inPeriod = (dateStr) => {
    if (!dateStr) return false;
    const d = new Date(dateStr);
    if (periodType === 'year') return d.getFullYear() === selectedYear;
    if (periodType === 'quarter') {
      const q = Math.floor(selectedMonth / 3);
      const dq = Math.floor(d.getMonth() / 3);
      return d.getFullYear() === selectedYear && dq === q;
    }
    return d.getMonth() === selectedMonth && d.getFullYear() === selectedYear;
  };

  const periodQuotes = quotes.filter(q => inPeriod(q.created_date));
  const openQuotes = periodQuotes.filter(q => ['rascunho', 'emitido', 'enviado'].includes(q.status));
  const wonQuotes = periodQuotes.filter(q => ['aprovado', 'convertido'].includes(q.status));
  const lostQuotes = periodQuotes.filter(q => q.status === 'cancelado');
  const totalQuotedValue = periodQuotes.reduce((sum, q) => sum + (q.total_value || 0), 0);

  const periodOpps = opportunities.filter(o => inPeriod(o.created_date));

  const periodOrders = orders.filter(o => inPeriod(o.created_date) && o.status !== 'cancelado');

  const periodCommission = commissions
    .filter(c => {
      const order = orders.find(o => o.id === c.order_id);
      return order && inPeriod(order.created_date);
    })
    .reduce((sum, c) => sum + (c.commission_total_value || c.commission_value || 0), 0);

  const formatCurrency = (v) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(v || 0);

  const periodLabel = getPeriodLabel(selectedMonth, selectedYear, periodType);

  return (
    <div className="space-y-3">
      <p className="text-xs text-slate-500 font-medium uppercase tracking-wide">
        Estatísticas · {periodLabel}
      </p>
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
        <StatsCard
          title="Oportunidades"
          value={periodOpps.length}
          icon={Target}
          color="blue"
          subtitle="criadas no período"
        />
        <StatsCard
          title="Total Cotado"
          value={formatCurrency(totalQuotedValue)}
          icon={FileText}
          color="amber"
          subtitle={`${periodQuotes.length} cotações`}
        />
        <StatsCard
          title="Cotações Ganhas"
          value={wonQuotes.length}
          icon={CheckCircle}
          color="emerald"
          subtitle={formatCurrency(wonQuotes.reduce((s, q) => s + (q.total_value || 0), 0))}
        />
        <StatsCard
          title="Cotações Perdidas"
          value={lostQuotes.length}
          icon={TrendingDown}
          color="slate"
          subtitle={formatCurrency(lostQuotes.reduce((s, q) => s + (q.total_value || 0), 0))}
        />
        <StatsCard
          title="Cotações em Aberto"
          value={openQuotes.length}
          icon={FileText}
          color="purple"
          subtitle={formatCurrency(openQuotes.reduce((s, q) => s + (q.total_value || 0), 0))}
        />
        <StatsCard
          title="Comissão Estimada"
          value={formatCurrency(periodCommission)}
          icon={TrendingUp}
          color="emerald"
          subtitle={`${periodOrders.length} pedidos ganhos`}
        />
      </div>
    </div>
  );
}