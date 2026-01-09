import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import PageHeader from '@/components/common/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Download, FileText, AlertCircle } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

export default function VTKAuditReport() {
  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth() + 1;
  
  const [selectedYear, setSelectedYear] = useState(currentYear);
  const [selectedMonth, setSelectedMonth] = useState(currentMonth);

  const { data: orders = [], isLoading } = useQuery({
    queryKey: ['orders'],
    queryFn: () => base44.entities.Order.list('-created_date', 500)
  });

  const { data: principals = [] } = useQuery({
    queryKey: ['principals'],
    queryFn: () => base44.entities.Principal.list('-created_date', 100)
  });

  // Filtrar pedidos VTK do mês selecionado
  const vtkPrincipal = principals.find(p => p.use_vtk_commission_table);
  
  const filteredOrders = orders.filter(o => {
    if (!o.created_date) return false;
    const orderDate = new Date(o.created_date);
    return (
      orderDate.getMonth() + 1 === selectedMonth &&
      orderDate.getFullYear() === selectedYear &&
      o.principal_id === vtkPrincipal?.id &&
      o.status !== 'cancelado'
    );
  });

  // Calcular totais
  const totals = filteredOrders.reduce((acc, order) => ({
    totalSales: acc.totalSales + (order.total_value || 0),
    totalCosts: acc.totalCosts + (order.total_cost || 0),
    totalCommission: acc.totalCommission + (order.expected_commission || 0),
    count: acc.count + 1
  }), { totalSales: 0, totalCosts: 0, totalCommission: 0, count: 0 });

  const overallMargin = totals.totalSales > 0 
    ? ((totals.totalSales - totals.totalCosts) / totals.totalSales * 100).toFixed(2)
    : 0;

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 2
    }).format(value || 0);
  };

  const exportToCSV = () => {
    const headers = [
      'Pedido',
      'Data',
      'Cliente',
      'Venda (R$)',
      'Custo (R$)',
      'Margem Original (%)',
      'Condição Pagamento',
      'Prazo Médio (dias)',
      'Ajuste (%)',
      'Margem Considerada (%)',
      'Faixa',
      '% Comissão',
      'Comissão (R$)'
    ];

    const rows = filteredOrders.map(order => [
      order.order_number || '-',
      new Date(order.created_date).toLocaleDateString('pt-BR'),
      order.client_name,
      (order.total_value || 0).toFixed(2),
      (order.total_cost || 0).toFixed(2),
      (order.original_margin_pct || 0).toFixed(2),
      order.payment_terms || '-',
      order.average_payment_days || 0,
      order.margin_adjustment || 0,
      (order.adjusted_margin_pct || 0).toFixed(2),
      order.commission_bracket || '-',
      order.commission_rate || 0,
      (order.expected_commission || 0).toFixed(2)
    ]);

    // Adicionar linha de totais
    rows.push([
      'TOTAL',
      '',
      `${totals.count} pedidos`,
      totals.totalSales.toFixed(2),
      totals.totalCosts.toFixed(2),
      overallMargin,
      '',
      '',
      '',
      '',
      '',
      '',
      totals.totalCommission.toFixed(2)
    ]);

    const csv = [
      headers.join(';'),
      ...rows.map(row => row.join(';'))
    ].join('\n');

    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `Auditoria_VTK_${selectedYear}_${String(selectedMonth).padStart(2, '0')}.csv`;
    link.click();
  };

  const monthNames = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
  ];

  if (!vtkPrincipal) {
    return (
      <div className="pb-20 lg:pb-6">
        <PageHeader title="Relatório de Auditoria VTK" subtitle="Conferência mensal de comissões" />
        <Card className="border-orange-200 bg-orange-50">
          <CardContent className="p-6 text-center">
            <AlertCircle className="w-12 h-12 text-orange-500 mx-auto mb-3" />
            <h3 className="font-semibold text-orange-900 mb-2">Nenhum representado VTK configurado</h3>
            <p className="text-sm text-orange-700">
              Configure um representado com a tabela de comissão VTK para usar este relatório.
            </p>
            <Button className="mt-4" onClick={() => window.location.href = '/Principals'}>
              Ir para Representados
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="pb-20 lg:pb-6 space-y-6">
      <PageHeader 
        title="Relatório de Auditoria VTK" 
        subtitle={`Representado: ${vtkPrincipal.trade_name || vtkPrincipal.company_name}`}
      />

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium">Período:</label>
              <Select value={String(selectedMonth)} onValueChange={(v) => setSelectedMonth(parseInt(v))}>
                <SelectTrigger className="w-36">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {monthNames.map((name, idx) => (
                    <SelectItem key={idx + 1} value={String(idx + 1)}>
                      {name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={String(selectedYear)} onValueChange={(v) => setSelectedYear(parseInt(v))}>
                <SelectTrigger className="w-28">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {[currentYear, currentYear - 1, currentYear - 2].map(year => (
                    <SelectItem key={year} value={String(year)}>
                      {year}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Button 
              onClick={exportToCSV} 
              disabled={filteredOrders.length === 0}
              className="ml-auto bg-emerald-600 hover:bg-emerald-700"
            >
              <Download className="w-4 h-4 mr-2" />
              Exportar CSV
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">Total Pedidos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totals.count}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">Venda Total</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-600">{formatCurrency(totals.totalSales)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">Margem Média</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{overallMargin}%</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">Comissão Total</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">{formatCurrency(totals.totalCommission)}</div>
          </CardContent>
        </Card>
      </div>

      {/* Orders Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Detalhamento dos Pedidos - {monthNames[selectedMonth - 1]}/{selectedYear}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-2">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : filteredOrders.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 border-b-2 border-slate-200">
                  <tr>
                    <th className="px-3 py-2 text-left font-semibold">Pedido</th>
                    <th className="px-3 py-2 text-left font-semibold">Data</th>
                    <th className="px-3 py-2 text-left font-semibold">Cliente</th>
                    <th className="px-3 py-2 text-right font-semibold">Venda</th>
                    <th className="px-3 py-2 text-right font-semibold">Custo</th>
                    <th className="px-3 py-2 text-right font-semibold">M. Orig</th>
                    <th className="px-3 py-2 text-center font-semibold">Prazo</th>
                    <th className="px-3 py-2 text-right font-semibold">Ajuste</th>
                    <th className="px-3 py-2 text-right font-semibold">M. Cons</th>
                    <th className="px-3 py-2 text-center font-semibold">Faixa</th>
                    <th className="px-3 py-2 text-right font-semibold">% Com</th>
                    <th className="px-3 py-2 text-right font-semibold">Comissão</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredOrders.map((order) => (
                    <tr key={order.id} className="border-b border-slate-100 hover:bg-slate-50">
                      <td className="px-3 py-3 font-mono text-xs">{order.order_number}</td>
                      <td className="px-3 py-3 text-xs">
                        {new Date(order.created_date).toLocaleDateString('pt-BR')}
                      </td>
                      <td className="px-3 py-3 text-xs">{order.client_name}</td>
                      <td className="px-3 py-3 text-right font-semibold text-emerald-700">
                        {formatCurrency(order.total_value)}
                      </td>
                      <td className="px-3 py-3 text-right text-slate-600">
                        {formatCurrency(order.total_cost)}
                      </td>
                      <td className="px-3 py-3 text-right font-semibold">
                        {(order.original_margin_pct || 0).toFixed(2)}%
                      </td>
                      <td className="px-3 py-3 text-center">
                        <span className={`px-2 py-1 rounded text-xs ${
                          (order.average_payment_days || 0) > 40 
                            ? 'bg-orange-100 text-orange-700' 
                            : 'bg-slate-100 text-slate-700'
                        }`}>
                          {order.average_payment_days || 0}d
                        </span>
                      </td>
                      <td className="px-3 py-3 text-right">
                        {order.margin_adjustment ? (
                          <span className="text-red-600 font-semibold">
                            {order.margin_adjustment.toFixed(1)}%
                          </span>
                        ) : (
                          <span className="text-slate-400">-</span>
                        )}
                      </td>
                      <td className="px-3 py-3 text-right font-bold text-blue-700">
                        {(order.adjusted_margin_pct || 0).toFixed(2)}%
                      </td>
                      <td className="px-3 py-3 text-center">
                        <span className="text-xs bg-indigo-100 text-indigo-700 px-2 py-1 rounded">
                          {order.commission_bracket || '-'}
                        </span>
                      </td>
                      <td className="px-3 py-3 text-right font-semibold">
                        {order.commission_rate || 0}%
                      </td>
                      <td className="px-3 py-3 text-right font-bold text-purple-700">
                        {formatCurrency(order.expected_commission)}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-slate-100 border-t-2 border-slate-300 font-bold">
                  <tr>
                    <td colSpan="3" className="px-3 py-3 text-left">
                      TOTAL ({totals.count} pedidos)
                    </td>
                    <td className="px-3 py-3 text-right text-emerald-700">
                      {formatCurrency(totals.totalSales)}
                    </td>
                    <td className="px-3 py-3 text-right">
                      {formatCurrency(totals.totalCosts)}
                    </td>
                    <td className="px-3 py-3 text-right text-blue-700">{overallMargin}%</td>
                    <td colSpan="5" className="px-3 py-3"></td>
                    <td className="px-3 py-3 text-right text-purple-700">
                      {formatCurrency(totals.totalCommission)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          ) : (
            <div className="text-center py-12">
              <FileText className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <p className="text-slate-600">Nenhum pedido VTK encontrado neste período</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}