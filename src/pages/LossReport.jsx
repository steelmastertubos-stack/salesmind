import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import PageHeader from '@/components/common/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line } from 'recharts';
import { TrendingDown, Calendar, DollarSign, Target, AlertTriangle, Download } from 'lucide-react';

const LOSS_REASONS_MAP = {
  'price': { label: 'Preço', color: '#EF4444' },
  'delivery_time': { label: 'Prazo de entrega', color: '#F97316' },
  'competition': { label: 'Concorrência', color: '#EAB308' },
  'quality_spec': { label: 'Qualidade / Especificação técnica', color: '#3B82F6' },
  'client_gave_up': { label: 'Cliente desistiu do projeto', color: '#8B5CF6' },
  'no_client_response': { label: 'Falta de retorno do cliente', color: '#06B6D4' },
  'payment_conditions': { label: 'Condição de pagamento', color: '#EC4899' },
  'out_of_stock': { label: 'Estoque indisponível', color: '#14B8A6' },
  'internal_error': { label: 'Erro interno / Processo', color: '#6366F1' },
  'other': { label: 'Outro', color: '#64748B' }
};

export default function LossReport() {
  const [filterPeriod, setFilterPeriod] = useState('month');
  const [filterMonth, setFilterMonth] = useState(new Date().getMonth() + 1);
  const [filterYear, setFilterYear] = useState(new Date().getFullYear());
  const [filterQuarter, setFilterQuarter] = useState(Math.ceil((new Date().getMonth() + 1) / 3));
  const [filterVendor, setFilterVendor] = useState('');
  const [filterClient, setFilterClient] = useState('');
  const [filterReason, setFilterReason] = useState('');

  const { data: lostDeals = [] } = useQuery({
    queryKey: ['lost-deals'],
    queryFn: () => base44.entities.LostDeal.list('-loss_date', 1000)
  });

  const { data: opportunities = [] } = useQuery({
    queryKey: ['opportunities'],
    queryFn: () => base44.entities.Opportunity.list('-created_date', 1000)
  });

  // Filtrar dados
  const filteredDeals = useMemo(() => {
    return lostDeals.filter(deal => {
      if (filterPeriod === 'month' && (deal.loss_month !== filterMonth || deal.loss_year !== filterYear)) return false;
      if (filterPeriod === 'quarter' && (deal.loss_quarter !== filterQuarter || deal.loss_year !== filterYear)) return false;
      if (filterPeriod === 'semester' && (deal.loss_semester !== filterQuarter || deal.loss_year !== filterYear)) return false;
      if (filterPeriod === 'year' && deal.loss_year !== filterYear) return false;
      if (filterVendor && deal.vendor_email !== filterVendor) return false;
      if (filterClient && deal.client_id !== filterClient) return false;
      if (filterReason && deal.loss_reason !== filterReason) return false;
      return true;
    });
  }, [lostDeals, filterPeriod, filterMonth, filterYear, filterQuarter, filterVendor, filterClient, filterReason]);

  // Calcular indicadores
  const kpis = useMemo(() => {
    const totalLost = filteredDeals.length;
    const totalValue = filteredDeals.reduce((sum, d) => sum + (d.deal_value || 0), 0);
    const avgTime = filteredDeals.length > 0 
      ? Math.round(filteredDeals.reduce((sum, d) => sum + (d.time_in_funnel_days || 0), 0) / totalLost)
      : 0;

    // Taxa de perda
    const totalOpportunities = opportunities.length;
    const lossRate = totalOpportunities > 0 ? Math.round((totalLost / totalOpportunities) * 100) : 0;

    // Top motivo
    const reasonCounts = {};
    filteredDeals.forEach(d => {
      reasonCounts[d.loss_reason] = (reasonCounts[d.loss_reason] || 0) + 1;
    });
    const topReason = Object.entries(reasonCounts).sort(([,a], [,b]) => b - a)[0];

    return {
      totalLost,
      totalValue,
      avgTime,
      lossRate,
      topReason: topReason ? LOSS_REASONS_MAP[topReason[0]]?.label : 'N/A'
    };
  }, [filteredDeals, opportunities]);

  // Gráfico por motivo
  const reasonChart = useMemo(() => {
    const data = {};
    filteredDeals.forEach(d => {
      if (!data[d.loss_reason]) {
        data[d.loss_reason] = { reason: d.loss_reason, count: 0, value: 0 };
      }
      data[d.loss_reason].count += 1;
      data[d.loss_reason].value += d.deal_value || 0;
    });

    return Object.values(data)
      .map(item => ({
        name: LOSS_REASONS_MAP[item.reason]?.label || item.reason,
        count: item.count,
        value: item.value,
        color: LOSS_REASONS_MAP[item.reason]?.color,
        reason: item.reason
      }))
      .sort((a, b) => b.count - a.count);
  }, [filteredDeals]);

  // Gráfico por período (últimos 12 meses)
  const periodChart = useMemo(() => {
    const months = {};
    const now = new Date();
    
    for (let i = 11; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      months[key] = { month: d.toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' }), count: 0, value: 0 };
    }

    filteredDeals.forEach(d => {
      const key = `${d.loss_year}-${String(d.loss_month).padStart(2, '0')}`;
      if (months[key]) {
        months[key].count += 1;
        months[key].value += d.deal_value || 0;
      }
    });

    return Object.values(months);
  }, [filteredDeals]);

  // Gráfico por vendedor
  const vendorChart = useMemo(() => {
    const vendors = {};
    filteredDeals.forEach(d => {
      if (!vendors[d.vendor_email]) {
        vendors[d.vendor_email] = { vendor: d.vendor_name || d.vendor_email, count: 0, value: 0 };
      }
      vendors[d.vendor_email].count += 1;
      vendors[d.vendor_email].value += d.deal_value || 0;
    });

    return Object.values(vendors)
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
  }, [filteredDeals]);

  // Insights automáticos
  const insights = useMemo(() => {
    const reasonCounts = {};
    filteredDeals.forEach(d => {
      reasonCounts[d.loss_reason] = (reasonCounts[d.loss_reason] || 0) + 1;
    });

    const topReason = Object.entries(reasonCounts).sort(([,a], [,b]) => b - a)[0];
    const topReasonPct = filteredDeals.length > 0 
      ? Math.round((topReason[1] / filteredDeals.length) * 100)
      : 0;

    const vendorLosses = {};
    filteredDeals.forEach(d => {
      if (!vendorLosses[d.vendor_email]) vendorLosses[d.vendor_email] = [];
      vendorLosses[d.vendor_email].push(d.loss_reason);
    });

    const insights_list = [];

    if (topReasonPct >= 30) {
      insights_list.push({
        type: 'warning',
        message: `⚠️ "${LOSS_REASONS_MAP[topReason[0]]?.label}" representa ${topReasonPct}% das perdas.`
      });
    }

    const vendorWithMostLosses = Object.entries(vendorLosses).sort(([,a], [,b]) => b.length - a.length)[0];
    if (vendorWithMostLosses) {
      insights_list.push({
        type: 'alert',
        message: `📊 ${vendorWithMostLosses[1][0] ? vendorWithMostLosses[1][0].split('@')[0] : 'Vendedor'} precisa de suporte em "${LOSS_REASONS_MAP[vendorWithMostLosses[1][0]]?.label || 'N/A'}"`
      });
    }

    return insights_list;
  }, [filteredDeals]);

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value || 0);
  };

  return (
    <div className="space-y-6 pb-10">
      <PageHeader 
        title="Relatório de Motivos de Perda"
        subtitle="Análise detalhada de negociações perdidas"
      />

      {/* Filtros */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Filtros</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
            <Select value={filterPeriod} onValueChange={setFilterPeriod}>
              <SelectTrigger>
                <SelectValue placeholder="Período" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="month">Mês</SelectItem>
                <SelectItem value="quarter">Trimestre</SelectItem>
                <SelectItem value="semester">Semestre</SelectItem>
                <SelectItem value="year">Ano</SelectItem>
              </SelectContent>
            </Select>

            <Select value={String(filterYear)} onValueChange={(v) => setFilterYear(parseInt(v))}>
              <SelectTrigger>
                <SelectValue placeholder="Ano" />
              </SelectTrigger>
              <SelectContent>
                {[2024, 2025, 2026].map(y => (
                  <SelectItem key={y} value={String(y)}>{y}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={filterReason} onValueChange={setFilterReason}>
              <SelectTrigger>
                <SelectValue placeholder="Motivo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={null}>Todos</SelectItem>
                {Object.entries(LOSS_REASONS_MAP).map(([key, { label }]) => (
                  <SelectItem key={key} value={key}>{label}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Button variant="outline" size="sm" className="w-full">
              <Download className="w-4 h-4 mr-2" />
              Exportar
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <TrendingDown className="w-8 h-8 text-red-600 mx-auto mb-2" />
              <p className="text-sm text-slate-600">Negócios Perdidos</p>
              <p className="text-3xl font-bold text-red-600">{kpis.totalLost}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <DollarSign className="w-8 h-8 text-red-500 mx-auto mb-2" />
              <p className="text-sm text-slate-600">Valor Perdido</p>
              <p className="text-2xl font-bold">{formatCurrency(kpis.totalValue)}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <AlertTriangle className="w-8 h-8 text-amber-600 mx-auto mb-2" />
              <p className="text-sm text-slate-600">Taxa de Perda</p>
              <p className="text-3xl font-bold text-amber-600">{kpis.lossRate}%</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <Target className="w-8 h-8 text-purple-600 mx-auto mb-2" />
              <p className="text-sm text-slate-600">Top Motivo</p>
              <p className="text-sm font-bold mt-2">{kpis.topReason}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <Calendar className="w-8 h-8 text-blue-600 mx-auto mb-2" />
              <p className="text-sm text-slate-600">Tempo Médio</p>
              <p className="text-3xl font-bold text-blue-600">{kpis.avgTime}</p>
              <p className="text-xs text-slate-500">dias</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Insights */}
      {insights.length > 0 && (
        <div className="space-y-2">
          {insights.map((insight, idx) => (
            <div key={idx} className={`p-3 rounded-lg border ${
              insight.type === 'warning' 
                ? 'bg-amber-50 border-amber-200 text-amber-800' 
                : 'bg-red-50 border-red-200 text-red-800'
            }`}>
              <p className="text-sm font-medium">{insight.message}</p>
            </div>
          ))}
        </div>
      )}

      {/* Gráficos */}
      <div className="grid lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Perdas por Motivo</CardTitle>
          </CardHeader>
          <CardContent>
            {reasonChart.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={reasonChart}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} fontSize={12} />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="count" fill="#EF4444" name="Quantidade" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-center text-slate-500 py-8">Sem dados</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Distribuição de Valor Perdido</CardTitle>
          </CardHeader>
          <CardContent>
            {reasonChart.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={reasonChart}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={100}
                  >
                    {reasonChart.map((entry, index) => (
                      <Cell key={index} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => formatCurrency(value)} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-center text-slate-500 py-8">Sem dados</p>
            )}
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Tendência de Perdas (últimos 12 meses)</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={periodChart}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <YAxis yAxisId="right" orientation="right" />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="count" stroke="#EF4444" name="Quantidade" />
                <Line type="monotone" dataKey="value" stroke="#F97316" name="Valor" yAxisId="right" />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Top 5 Vendedores com Mais Perdas</CardTitle>
          </CardHeader>
          <CardContent>
            {vendorChart.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={vendorChart}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="vendor" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="count" fill="#8B5CF6" name="Quantidade" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-center text-slate-500 py-8">Sem dados</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Tabela de Detalhes */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Histórico de Perdas</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b">
                <tr>
                  <th className="text-left py-2">Cliente</th>
                  <th className="text-left py-2">Motivo</th>
                  <th className="text-right py-2">Valor</th>
                  <th className="text-left py-2">Vendedor</th>
                  <th className="text-left py-2">Data</th>
                </tr>
              </thead>
              <tbody>
                {filteredDeals.slice(0, 10).map(deal => (
                  <tr key={deal.id} className="border-b hover:bg-slate-50">
                    <td className="py-3">{deal.client_name}</td>
                    <td className="py-3">
                      <Badge variant="outline" className="text-xs">
                        {LOSS_REASONS_MAP[deal.motivo_primario]?.label || deal.motivo_primario}
                      </Badge>
                    </td>
                    <td className="py-3 text-right font-semibold">{formatCurrency(deal.deal_value)}</td>
                    <td className="py-3 text-sm text-slate-600">{deal.vendor_name}</td>
                    <td className="py-3 text-sm">{new Date(deal.loss_date).toLocaleDateString('pt-BR')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}