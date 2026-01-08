import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { 
  BarChart3, 
  TrendingUp,
  Users,
  Package,
  DollarSign,
  Calendar,
  Download,
  FileText
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import PageHeader from '@/components/common/PageHeader';
import { Skeleton } from '@/components/ui/skeleton';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts';

const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316'];

export default function Reports() {
  const [period, setPeriod] = useState('month');

  const { data: orders = [], isLoading: loadingOrders } = useQuery({
    queryKey: ['orders'],
    queryFn: () => base44.entities.Order.list('-created_date', 500)
  });

  const { data: clients = [], isLoading: loadingClients } = useQuery({
    queryKey: ['clients'],
    queryFn: () => base44.entities.Client.list('-created_date', 500)
  });

  const { data: quotes = [], isLoading: loadingQuotes } = useQuery({
    queryKey: ['quotes'],
    queryFn: () => base44.entities.Quote.list('-created_date', 500)
  });

  const isLoading = loadingOrders || loadingClients || loadingQuotes;

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value || 0);
  };

  // Calculate monthly revenue
  const getMonthlyData = () => {
    const months = {};
    orders.forEach(order => {
      if (order.status !== 'cancelled') {
        const date = new Date(order.created_date);
        const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        if (!months[key]) {
          months[key] = { month: key, revenue: 0, orders: 0, commission: 0 };
        }
        months[key].revenue += order.total_value || 0;
        months[key].orders += 1;
        months[key].commission += order.expected_commission || 0;
      }
    });

    return Object.values(months)
      .sort((a, b) => a.month.localeCompare(b.month))
      .slice(-12)
      .map(m => ({
        ...m,
        monthLabel: new Date(m.month + '-01').toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' })
      }));
  };

  // Top clients by revenue
  const getTopClients = () => {
    const clientRevenue = {};
    orders.forEach(order => {
      if (order.status !== 'cancelled' && order.client_name) {
        if (!clientRevenue[order.client_name]) {
          clientRevenue[order.client_name] = { name: order.client_name, value: 0, orders: 0 };
        }
        clientRevenue[order.client_name].value += order.total_value || 0;
        clientRevenue[order.client_name].orders += 1;
      }
    });

    return Object.values(clientRevenue)
      .sort((a, b) => b.value - a.value)
      .slice(0, 10);
  };

  // Client status distribution
  const getClientStatusData = () => {
    const statusCount = {
      active: clients.filter(c => c.status === 'active').length,
      attention: clients.filter(c => c.status === 'attention').length,
      at_risk: clients.filter(c => c.status === 'at_risk').length,
      inactive: clients.filter(c => c.status === 'inactive').length
    };

    return [
      { name: 'Ativos', value: statusCount.active, color: '#10b981' },
      { name: 'Atenção', value: statusCount.attention, color: '#f59e0b' },
      { name: 'Em Risco', value: statusCount.at_risk, color: '#ef4444' },
      { name: 'Inativos', value: statusCount.inactive, color: '#94a3b8' }
    ].filter(s => s.value > 0);
  };

  // Quote conversion rate
  const getQuoteStats = () => {
    const total = quotes.length;
    const approved = quotes.filter(q => q.status === 'approved' || q.status === 'converted').length;
    const lost = quotes.filter(q => q.status === 'lost').length;
    const pending = quotes.filter(q => ['draft', 'sent', 'negotiating'].includes(q.status)).length;

    return {
      total,
      approved,
      lost,
      pending,
      conversionRate: total > 0 ? ((approved / total) * 100).toFixed(1) : 0
    };
  };

  // Summary stats
  const totalRevenue = orders.reduce((sum, o) => o.status !== 'cancelled' ? sum + (o.total_value || 0) : sum, 0);
  const totalCommission = orders.reduce((sum, o) => sum + (o.expected_commission || 0), 0);
  const paidCommission = orders
    .filter(o => o.commission_status === 'paid')
    .reduce((sum, o) => sum + (o.commission_paid_value || o.expected_commission || 0), 0);

  const monthlyData = getMonthlyData();
  const topClients = getTopClients();
  const clientStatusData = getClientStatusData();
  const quoteStats = getQuoteStats();

  return (
    <div className="pb-20 lg:pb-6">
      <PageHeader 
        title="Relatórios" 
        subtitle="Análise de desempenho comercial"
      >
        <Select value={period} onValueChange={setPeriod}>
          <SelectTrigger className="w-32">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="month">Este mês</SelectItem>
            <SelectItem value="quarter">Trimestre</SelectItem>
            <SelectItem value="year">Este ano</SelectItem>
            <SelectItem value="all">Todo período</SelectItem>
          </SelectContent>
        </Select>
      </PageHeader>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-xl p-4 border border-slate-100">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 bg-emerald-100 rounded-lg flex items-center justify-center">
              <DollarSign className="w-4 h-4 text-emerald-600" />
            </div>
            <span className="text-xs text-slate-500">Faturamento Total</span>
          </div>
          <p className="text-xl font-bold text-slate-900">{formatCurrency(totalRevenue)}</p>
        </div>

        <div className="bg-white rounded-xl p-4 border border-slate-100">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-4 h-4 text-purple-600" />
            </div>
            <span className="text-xs text-slate-500">Comissão Total</span>
          </div>
          <p className="text-xl font-bold text-slate-900">{formatCurrency(totalCommission)}</p>
          <p className="text-xs text-emerald-600">{formatCurrency(paidCommission)} recebida</p>
        </div>

        <div className="bg-white rounded-xl p-4 border border-slate-100">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
              <Users className="w-4 h-4 text-blue-600" />
            </div>
            <span className="text-xs text-slate-500">Clientes</span>
          </div>
          <p className="text-xl font-bold text-slate-900">{clients.length}</p>
          <p className="text-xs text-slate-500">{clients.filter(c => c.status === 'active').length} ativos</p>
        </div>

        <div className="bg-white rounded-xl p-4 border border-slate-100">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 bg-amber-100 rounded-lg flex items-center justify-center">
              <FileText className="w-4 h-4 text-amber-600" />
            </div>
            <span className="text-xs text-slate-500">Conversão</span>
          </div>
          <p className="text-xl font-bold text-slate-900">{quoteStats.conversionRate}%</p>
          <p className="text-xs text-slate-500">{quoteStats.approved} de {quoteStats.total} orçamentos</p>
        </div>
      </div>

      <Tabs defaultValue="revenue" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="revenue">Faturamento</TabsTrigger>
          <TabsTrigger value="clients">Clientes</TabsTrigger>
          <TabsTrigger value="ranking">Ranking</TabsTrigger>
        </TabsList>

        {/* Revenue Tab */}
        <TabsContent value="revenue" className="space-y-6">
          <div className="bg-white rounded-xl p-4 border border-slate-100">
            <h3 className="font-semibold text-slate-900 mb-4">Faturamento Mensal</h3>
            {isLoading ? (
              <Skeleton className="h-64 w-full" />
            ) : monthlyData.length > 0 ? (
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={monthlyData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis dataKey="monthLabel" tick={{ fontSize: 12 }} />
                    <YAxis tick={{ fontSize: 12 }} tickFormatter={(v) => `${(v/1000).toFixed(0)}k`} />
                    <Tooltip 
                      formatter={(value) => formatCurrency(value)}
                      labelFormatter={(label) => label}
                    />
                    <Bar dataKey="revenue" fill="#10b981" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-64 flex items-center justify-center text-slate-400">
                Sem dados para exibir
              </div>
            )}
          </div>

          <div className="bg-white rounded-xl p-4 border border-slate-100">
            <h3 className="font-semibold text-slate-900 mb-4">Comissão Mensal</h3>
            {isLoading ? (
              <Skeleton className="h-48 w-full" />
            ) : monthlyData.length > 0 ? (
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={monthlyData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis dataKey="monthLabel" tick={{ fontSize: 12 }} />
                    <YAxis tick={{ fontSize: 12 }} tickFormatter={(v) => `${(v/1000).toFixed(0)}k`} />
                    <Tooltip formatter={(value) => formatCurrency(value)} />
                    <Line type="monotone" dataKey="commission" stroke="#8b5cf6" strokeWidth={2} dot={{ fill: '#8b5cf6' }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-48 flex items-center justify-center text-slate-400">
                Sem dados para exibir
              </div>
            )}
          </div>
        </TabsContent>

        {/* Clients Tab */}
        <TabsContent value="clients" className="space-y-6">
          <div className="grid lg:grid-cols-2 gap-6">
            <div className="bg-white rounded-xl p-4 border border-slate-100">
              <h3 className="font-semibold text-slate-900 mb-4">Status dos Clientes</h3>
              {isLoading ? (
                <Skeleton className="h-48 w-full" />
              ) : clientStatusData.length > 0 ? (
                <div className="h-48">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={clientStatusData}
                        cx="50%"
                        cy="50%"
                        innerRadius={40}
                        outerRadius={70}
                        paddingAngle={2}
                        dataKey="value"
                      >
                        {clientStatusData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value, name) => [value, name]} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="h-48 flex items-center justify-center text-slate-400">
                  Sem dados para exibir
                </div>
              )}
              <div className="flex flex-wrap justify-center gap-3 mt-2">
                {clientStatusData.map((item, i) => (
                  <div key={i} className="flex items-center gap-1.5">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                    <span className="text-xs text-slate-600">{item.name} ({item.value})</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white rounded-xl p-4 border border-slate-100">
              <h3 className="font-semibold text-slate-900 mb-4">Clientes Inativos</h3>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {clients
                  .filter(c => c.status === 'at_risk' || c.status === 'inactive')
                  .slice(0, 10)
                  .map(client => {
                    const daysSince = client.last_purchase_date 
                      ? Math.floor((new Date() - new Date(client.last_purchase_date)) / (1000 * 60 * 60 * 24))
                      : null;
                    return (
                      <div key={client.id} className="flex items-center justify-between p-2 bg-slate-50 rounded-lg">
                        <div>
                          <p className="text-sm font-medium text-slate-900">
                            {client.trade_name || client.company_name}
                          </p>
                          <p className="text-xs text-slate-500">{client.segment}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-medium text-red-600">{daysSince || '-'} dias</p>
                          <p className="text-xs text-slate-500">sem compra</p>
                        </div>
                      </div>
                    );
                  })}
                {clients.filter(c => c.status === 'at_risk' || c.status === 'inactive').length === 0 && (
                  <p className="text-center text-slate-400 py-8">Nenhum cliente inativo</p>
                )}
              </div>
            </div>
          </div>
        </TabsContent>

        {/* Ranking Tab */}
        <TabsContent value="ranking" className="space-y-6">
          <div className="bg-white rounded-xl p-4 border border-slate-100">
            <h3 className="font-semibold text-slate-900 mb-4">Top 10 Clientes por Faturamento</h3>
            {isLoading ? (
              <Skeleton className="h-64 w-full" />
            ) : topClients.length > 0 ? (
              <div className="space-y-3">
                {topClients.map((client, index) => (
                  <div key={client.name} className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-white ${
                      index === 0 ? 'bg-amber-500' :
                      index === 1 ? 'bg-slate-400' :
                      index === 2 ? 'bg-amber-700' :
                      'bg-slate-300'
                    }`}>
                      {index + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-slate-900 truncate">{client.name}</p>
                      <p className="text-xs text-slate-500">{client.orders} pedidos</p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-emerald-600">{formatCurrency(client.value)}</p>
                    </div>
                    <div className="w-24 h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-emerald-500 rounded-full"
                        style={{ width: `${(client.value / topClients[0].value) * 100}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="h-64 flex items-center justify-center text-slate-400">
                Sem dados para exibir
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}