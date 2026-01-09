import React, { useState, useMemo } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import PageHeader from '@/components/common/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line } from 'recharts';
import { Download, Filter, TrendingDown } from 'lucide-react';
import { calculateMarginAdjustmentFull, getVTKCommissionBracket } from '@/components/utils/marginAdjustmentCalculator';

export default function VTKMarginAuditReport() {
  const [monthFilter, setMonthFilter] = useState(new Date().toISOString().split('T')[0].substring(0, 7));
  const [principalFilter, setPrincipalFilter] = useState('all');

  const { data: orders = [] } = useQuery({
    queryKey: ['orders'],
    queryFn: () => base44.entities.Order.list('-created_date', 500)
  });

  const { data: principals = [] } = useQuery({
    queryKey: ['principals'],
    queryFn: () => base44.entities.Principal.list('', 500)
  });

  const { data: quotes = [] } = useQuery({
    queryKey: ['quotes'],
    queryFn: () => base44.entities.Quote.list('', 500)
  });

  const { data: commissions = [] } = useQuery({
    queryKey: ['commissions'],
    queryFn: () => base44.entities.Commission.list('', 500)
  });

  // Combinar dados com cálculos de ajuste
  const auditData = useMemo(() => {
    return orders
      .filter(order => {
        const orderMonth = order.created_date?.substring(0, 7);
        const monthMatch = !monthFilter || orderMonth === monthFilter;
        const principalMatch = principalFilter === 'all' || order.principal_id === principalFilter;
        return monthMatch && principalMatch;
      })
      .map(order => {
        const quote = quotes.find(q => q.id === order.quote_id);
        const principal = principals.find(p => p.id === order.principal_id);
        const commission = commissions.find(c => c.order_id === order.id);

        // Calcular ajuste de margem
        const marginCalc = calculateMarginAdjustmentFull(
          quote?.payment_terms || 'N/A',
          order.original_margin_pct || 0
        );

        // Obter faixa VTK
        const vtkBracket = getVTKCommissionBracket(marginCalc.consideredMargin);

        return {
          id: order.id,
          order_number: order.order_number,
          client_name: order.client_name,
          principal_name: principal?.trade_name || principal?.company_name,
          created_date: order.created_date,
          total_value: order.total_value,
          payment_terms: quote?.payment_terms || 'N/A',
          ...marginCalc,
          vtkBracket: vtkBracket.bracket,
          vtkRate: vtkBracket.rate,
          commission_value: commission?.commission_value || 0,
          commission_status: commission?.status || 'N/A'
        };
      });
  }, [orders, quotes, principals, commissions, monthFilter, principalFilter]);

  // Estatísticas gerais
  const stats = useMemo(() => {
    if (auditData.length === 0) return null;

    const totalOrders = auditData.length;
    const totalAdjustment = auditData.reduce((sum, o) => sum + o.marginAdjustment, 0);
    const avgAdjustment = totalAdjustment / totalOrders;
    const ordersWithAdjustment = auditData.filter(o => o.marginAdjustment > 0).length;
    const totalCommission = auditData.reduce((sum, o) => sum + o.commission_value, 0);

    return {
      totalOrders,
      totalAdjustment,
      avgAdjustment,
      ordersWithAdjustment,
      totalCommission,
      impactPercentage: ((ordersWithAdjustment / totalOrders) * 100).toFixed(1)
    };
  }, [auditData]);

  // Gráfico de evolução mensal
  const monthlyTrend = useMemo(() => {
    const grouped = {};
    
    orders.forEach(order => {
      const month = order.created_date?.substring(0, 7);
      if (month) {
        if (!grouped[month]) {
          grouped[month] = { month, orders: 0, totalAdjustment: 0, avgMargin: 0 };
        }
        grouped[month].orders++;
        
        const quote = quotes.find(q => q.id === order.quote_id);
        const calc = calculateMarginAdjustmentFull(quote?.payment_terms || 'N/A', order.original_margin_pct || 0);
        grouped[month].totalAdjustment += calc.marginAdjustment;
      }
    });

    return Object.values(grouped)
      .map(d => ({
        ...d,
        avgAdjustment: (d.totalAdjustment / d.orders).toFixed(2)
      }))
      .sort((a, b) => a.month.localeCompare(b.month));
  }, [orders, quotes]);

  // Gráfico de distribuição por faixa VTK
  const distributionByBracket = useMemo(() => {
    const grouped = {};
    
    auditData.forEach(item => {
      if (!grouped[item.vtkBracket]) {
        grouped[item.vtkBracket] = { bracket: item.vtkBracket, count: 0, avgMargin: 0 };
      }
      grouped[item.vtkBracket].count++;
      grouped[item.vtkBracket].avgMargin += item.consideredMargin;
    });

    return Object.values(grouped)
      .map(d => ({
        ...d,
        avgMargin: (d.avgMargin / d.count).toFixed(2)
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
  }, [auditData]);

  const exportToCSV = () => {
    const headers = [
      'Pedido',
      'Cliente',
      'Representado',
      'Valor',
      'Condição Pagto',
      'Prazo Médio',
      'Margem Original',
      'Ajuste',
      'Margem Considerada',
      'Faixa VTK',
      'Taxa Comissão',
      'Comissão',
      'Status'
    ];

    const rows = auditData.map(item => [
      item.order_number,
      item.client_name,
      item.principal_name,
      item.total_value.toFixed(2),
      item.payment_terms,
      item.averageTerm,
      item.originalMargin.toFixed(2),
      item.marginAdjustment.toFixed(2),
      item.consideredMargin.toFixed(2),
      item.vtkBracket,
      item.vtkRate.toFixed(2),
      item.commission_value.toFixed(2),
      item.commission_status
    ]);

    const csv = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `vtk_audit_${monthFilter}.csv`);
    link.click();
  };

  return (
    <div className="space-y-6">
      <PageHeader 
        title="Auditoria VTK - Ajuste de Margem Financeira"
        subtitle="Análise detalhada de impacto da condição de pagamento na margem e comissão"
      />

      {/* Filtros */}
      <div className="flex gap-3 items-end">
        <div className="flex-1">
          <label className="text-xs font-medium text-slate-600">Mês</label>
          <Input
            type="month"
            value={monthFilter}
            onChange={(e) => setMonthFilter(e.target.value)}
            className="mt-1"
          />
        </div>
        <div className="flex-1">
          <label className="text-xs font-medium text-slate-600">Representado</label>
          <Select value={principalFilter} onValueChange={setPrincipalFilter}>
            <SelectTrigger className="mt-1">
              <SelectValue />
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
        <Button onClick={exportToCSV} className="bg-blue-600 hover:bg-blue-700">
          <Download className="w-4 h-4 mr-2" />
          Exportar CSV
        </Button>
      </div>

      {/* Estatísticas Gerais */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-slate-600">Total de Pedidos</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{stats.totalOrders}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-slate-600">Com Ajuste</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{stats.ordersWithAdjustment}</p>
              <p className="text-xs text-slate-500">{stats.impactPercentage}%</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-slate-600">Ajuste Médio</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-orange-600">-{stats.avgAdjustment.toFixed(2)}%</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-slate-600">Ajuste Total</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-red-600">-{stats.totalAdjustment.toFixed(2)}%</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-slate-600">Total Comissões</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">
                R$ {(stats.totalCommission || 0).toLocaleString('pt-BR', { maximumFractionDigits: 0 })}
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Gráficos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Tendência mensal */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Evolução de Ajustes Mensais</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={monthlyTrend}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip formatter={(value) => value.toFixed(2)} />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="avgAdjustment" 
                  stroke="#f97316" 
                  name="Ajuste Médio (%)"
                  strokeWidth={2}
                />
                <Line 
                  type="monotone" 
                  dataKey="orders" 
                  stroke="#3b82f6" 
                  name="Qty. Pedidos"
                  yAxisId="right"
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Distribuição por faixa */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Distribuição por Faixa VTK</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={distributionByBracket}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="bracket" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="count" fill="#8b5cf6" name="Qtd Pedidos" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Tabela detalhada */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Detalhamento por Pedido</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead className="border-b border-slate-200 bg-slate-50">
                <tr>
                  <th className="text-left p-2 font-semibold">Pedido</th>
                  <th className="text-left p-2 font-semibold">Cliente</th>
                  <th className="text-left p-2 font-semibold">Condição</th>
                  <th className="text-right p-2 font-semibold">Prazo</th>
                  <th className="text-right p-2 font-semibold">Margem Orig.</th>
                  <th className="text-right p-2 font-semibold text-orange-600">Ajuste</th>
                  <th className="text-right p-2 font-semibold text-green-600">Margem Cons.</th>
                  <th className="text-center p-2 font-semibold">Faixa VTK</th>
                  <th className="text-right p-2 font-semibold">Comissão</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {auditData.map(item => (
                  <tr key={item.id} className="hover:bg-slate-50">
                    <td className="p-2 font-mono font-semibold">{item.order_number}</td>
                    <td className="p-2 text-slate-700 truncate">{item.client_name}</td>
                    <td className="p-2 text-slate-600">{item.payment_terms}</td>
                    <td className="p-2 text-right">{item.averageTerm}d</td>
                    <td className="p-2 text-right">{item.originalMargin.toFixed(2)}%</td>
                    <td className={`p-2 text-right font-semibold ${item.marginAdjustment > 0 ? 'text-orange-600' : 'text-slate-400'}`}>
                      {item.marginAdjustment > 0 ? '-' : ''}{item.marginAdjustment.toFixed(2)}%
                    </td>
                    <td className="p-2 text-right font-semibold text-green-700 bg-green-50">
                      {item.consideredMargin.toFixed(2)}%
                    </td>
                    <td className="p-2 text-center">
                      <Badge variant="outline">{item.vtkBracket}</Badge>
                    </td>
                    <td className="p-2 text-right font-semibold">
                      R$ {item.commission_value.toLocaleString('pt-BR', { maximumFractionDigits: 2 })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {auditData.length === 0 && (
            <div className="text-center py-8 text-slate-500">
              Nenhum pedido encontrado para o filtro selecionado
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}