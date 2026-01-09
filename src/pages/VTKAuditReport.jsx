import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Download, Calendar, Building2, Filter } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import PageHeader from '@/components/common/PageHeader';
import { Skeleton } from '@/components/ui/skeleton';

export default function VTKAuditReport() {
  const [monthFilter, setMonthFilter] = useState(new Date().toISOString().slice(0, 7));
  const [principalFilter, setPrincipalFilter] = useState('all');

  const { data: orders = [], isLoading } = useQuery({
    queryKey: ['orders'],
    queryFn: () => base44.entities.Order.list('-created_date', 500)
  });

  const { data: principals = [] } = useQuery({
    queryKey: ['principals'],
    queryFn: () => base44.entities.Principal.list('company_name', 100)
  });

  // Filtrar apenas pedidos VTK do mês
  const filteredOrders = orders.filter(order => {
    const orderMonth = order.created_date.slice(0, 7);
    const isVTK = principals.find(p => p.id === order.principal_id)?.use_vtk_commission_table;
    const matchMonth = orderMonth === monthFilter;
    const matchPrincipal = principalFilter === 'all' || order.principal_id === principalFilter;
    
    return isVTK && matchMonth && matchPrincipal;
  });

  const totals = {
    orders: filteredOrders.length,
    total_value: filteredOrders.reduce((sum, o) => sum + (o.total_value || 0), 0),
    total_cost: filteredOrders.reduce((sum, o) => sum + (o.total_cost || 0), 0),
    total_commission: filteredOrders.reduce((sum, o) => sum + (o.expected_commission || 0), 0)
  };

  const totalMarginValue = totals.total_value - totals.total_cost;
  const totalMarginPct = totals.total_value > 0 ? (totalMarginValue / totals.total_value) * 100 : 0;

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
      'Representado',
      'Produto',
      'Bitola',
      'Schedule',
      'Quantidade',
      'Valor Venda',
      'Custo Total',
      'Margem R$',
      'Margem %',
      'Taxa Comissão %',
      'Comissão R$'
    ];

    const rows = filteredOrders.map(order => {
      const principal = principals.find(p => p.id === order.principal_id);
      const margin = order.total_value - (order.total_cost || 0);
      const marginPct = order.total_value > 0 ? (margin / order.total_value) * 100 : 0;

      return [
        order.order_number,
        new Date(order.created_date).toLocaleDateString('pt-BR'),
        order.client_name,
        principal?.trade_name || principal?.company_name || '',
        order.items?.map(i => i.product_name).join('; ') || '',
        order.items?.map(i => i.bitola || '-').join('; ') || '',
        order.items?.map(i => i.schedule || '-').join('; ') || '',
        order.items?.reduce((sum, i) => sum + (i.quantity || 0), 0) || 0,
        order.total_value,
        order.total_cost || 0,
        margin,
        marginPct.toFixed(2),
        order.commission_rate || 0,
        order.expected_commission || 0
      ];
    });

    const csv = [
      headers.join(','),
      ...rows.map(row => row.map(cell => 
        typeof cell === 'string' ? `"${cell}"` : cell
      ).join(','))
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `relatorio_vtk_${monthFilter}.csv`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  };

  return (
    <div className="space-y-6 pb-20 lg:pb-6">
      <PageHeader 
        title="Relatório de Auditoria VTK" 
        subtitle="Análise detalhada de margens e comissões"
      />

      {/* Filtros */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 space-y-2">
            <label className="text-sm font-medium">Mês/Ano</label>
            <Input
              type="month"
              value={monthFilter}
              onChange={(e) => setMonthFilter(e.target.value)}
            />
          </div>

          <div className="flex-1 space-y-2">
            <label className="text-sm font-medium">Representado</label>
            <Select value={principalFilter} onValueChange={setPrincipalFilter}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                {principals.filter(p => p.use_vtk_commission_table).map(p => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.trade_name || p.company_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-end">
            <Button 
              onClick={exportToCSV}
              className="bg-emerald-600 hover:bg-emerald-700 w-full sm:w-auto"
            >
              <Download className="w-4 h-4 mr-2" />
              Exportar CSV
            </Button>
          </div>
        </div>
      </div>

      {/* Cards de Resumo */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl border border-slate-200 p-6">
          <p className="text-sm text-slate-600 mb-2">Pedidos</p>
          <p className="text-3xl font-bold text-slate-900">{totals.orders}</p>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-6">
          <p className="text-sm text-slate-600 mb-2">Valor Vendido</p>
          <p className="text-2xl font-bold text-emerald-600">
            {formatCurrency(totals.total_value)}
          </p>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-6">
          <p className="text-sm text-slate-600 mb-2">Margem (R$)</p>
          <p className="text-2xl font-bold text-blue-600">
            {formatCurrency(totalMarginValue)}
          </p>
          <p className="text-xs text-slate-500 mt-1">{totalMarginPct.toFixed(2)}% de margem</p>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-6">
          <p className="text-sm text-slate-600 mb-2">Comissão Total</p>
          <p className="text-2xl font-bold text-purple-600">
            {formatCurrency(totals.total_commission)}
          </p>
        </div>
      </div>

      {/* Tabela */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200">
          <h3 className="font-bold text-lg">Detalhes por Pedido</h3>
        </div>

        {isLoading ? (
          <div className="space-y-2 p-6">
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} className="h-10 w-full" />
            ))}
          </div>
        ) : filteredOrders.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="text-left px-4 py-3 font-medium">Pedido</th>
                  <th className="text-left px-4 py-3 font-medium">Data</th>
                  <th className="text-left px-4 py-3 font-medium">Cliente</th>
                  <th className="text-left px-4 py-3 font-medium">Produto</th>
                  <th className="text-right px-4 py-3 font-medium">Venda</th>
                  <th className="text-right px-4 py-3 font-medium">Custo</th>
                  <th className="text-right px-4 py-3 font-medium">Margem</th>
                  <th className="text-center px-4 py-3 font-medium">Margem %</th>
                  <th className="text-right px-4 py-3 font-medium">Comissão %</th>
                  <th className="text-right px-4 py-3 font-medium">Comissão</th>
                </tr>
              </thead>
              <tbody>
                {filteredOrders.map((order) => {
                  const margin = order.total_value - (order.total_cost || 0);
                  const marginPct = order.total_value > 0 ? (margin / order.total_value) * 100 : 0;

                  return (
                    <tr key={order.id} className="border-b border-slate-100 hover:bg-slate-50">
                      <td className="px-4 py-3 font-mono font-bold">{order.order_number}</td>
                      <td className="px-4 py-3">
                        {new Date(order.created_date).toLocaleDateString('pt-BR')}
                      </td>
                      <td className="px-4 py-3">{order.client_name}</td>
                      <td className="px-4 py-3 text-slate-600 text-xs">
                        {order.items?.map(i => i.product_name).join(', ') || '-'}
                      </td>
                      <td className="px-4 py-3 text-right font-semibold">
                        {formatCurrency(order.total_value)}
                      </td>
                      <td className="px-4 py-3 text-right text-slate-600">
                        {formatCurrency(order.total_cost || 0)}
                      </td>
                      <td className="px-4 py-3 text-right font-semibold">
                        {formatCurrency(margin)}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <Badge className={marginPct >= 20 ? 'bg-emerald-100 text-emerald-700' : 'bg-yellow-100 text-yellow-700'}>
                          {marginPct.toFixed(2)}%
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-right font-bold">
                        {(order.commission_rate || 0).toFixed(2)}%
                      </td>
                      <td className="px-4 py-3 text-right font-bold text-purple-600">
                        {formatCurrency(order.expected_commission || 0)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot className="bg-slate-50 border-t-2 border-slate-200 font-bold">
                <tr>
                  <td colSpan="3" className="px-4 py-4">TOTAL</td>
                  <td className="px-4 py-4"></td>
                  <td className="px-4 py-4 text-right">{formatCurrency(totals.total_value)}</td>
                  <td className="px-4 py-4 text-right">{formatCurrency(totals.total_cost)}</td>
                  <td className="px-4 py-4 text-right">{formatCurrency(totalMarginValue)}</td>
                  <td className="px-4 py-4 text-center">
                    <Badge className="bg-slate-200 text-slate-800">
                      {totalMarginPct.toFixed(2)}%
                    </Badge>
                  </td>
                  <td className="px-4 py-4"></td>
                  <td className="px-4 py-4 text-right text-purple-600">{formatCurrency(totals.total_commission)}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        ) : (
          <div className="p-8 text-center">
            <p className="text-slate-500">Nenhum pedido VTK encontrado para o período selecionado</p>
          </div>
        )}
      </div>
    </div>
  );
}