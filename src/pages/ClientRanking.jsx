import React, { useState, useMemo } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import PageHeader from '@/components/common/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Trophy, 
  Medal, 
  Award,
  Download,
  TrendingUp,
  DollarSign,
  ShoppingCart,
  Target,
  Sparkles
} from 'lucide-react';
import { toast } from 'sonner';

export default function ClientRanking() {
  const currentYear = new Date().getFullYear();
  const [selectedYear, setSelectedYear] = useState(currentYear);
  const [rankingSize, setRankingSize] = useState('10');

  const { data: orders = [], isLoading: loadingOrders } = useQuery({
    queryKey: ['orders'],
    queryFn: () => base44.entities.Order.list('-created_date', 2000)
  });

  const { data: clients = [], isLoading: loadingClients } = useQuery({
    queryKey: ['clients'],
    queryFn: () => base44.entities.Client.list('company_name', 500)
  });

  // Filtrar pedidos do ano selecionado
  const yearOrders = useMemo(() => {
    return orders.filter(o => {
      if (!o.created_date) return false;
      const orderYear = new Date(o.created_date).getFullYear();
      return orderYear === parseInt(selectedYear);
    });
  }, [orders, selectedYear]);

  // Calcular ranking
  const ranking = useMemo(() => {
    const clientStats = {};

    yearOrders.forEach(order => {
      if (!order.client_id) return;

      if (!clientStats[order.client_id]) {
        clientStats[order.client_id] = {
          client_id: order.client_id,
          total_revenue: 0,
          order_count: 0,
          total_weight: 0,
          orders: []
        };
      }

      clientStats[order.client_id].total_revenue += order.total_value || 0;
      clientStats[order.client_id].order_count += 1;
      clientStats[order.client_id].total_weight += order.total_weight || 0;
      clientStats[order.client_id].orders.push(order);
    });

    // Enriquecer com dados do cliente
    const enriched = Object.values(clientStats).map(stat => {
      const client = clients.find(c => c.id === stat.client_id);
      return {
        ...stat,
        client_name: client?.trade_name || client?.company_name || 'Cliente não encontrado',
        client_segment: client?.segment,
        client_city: client?.city,
        client_state: client?.state,
        client_email: client?.email,
        client_phone: client?.phone,
        client_contact: client?.contact_name,
        avg_ticket: stat.total_revenue / stat.order_count,
        auto_tags: client?.auto_tags || [],
        manual_tags: client?.manual_tags || []
      };
    });

    // Ordenar por faturamento
    return enriched.sort((a, b) => b.total_revenue - a.total_revenue);
  }, [yearOrders, clients]);

  const topClients = ranking.slice(0, parseInt(rankingSize));

  // Identificar clientes para premiação
  const awardClients = useMemo(() => {
    return ranking.filter(r => 
      r.auto_tags.includes('Cliente Premium') ||
      r.auto_tags.includes('Cliente Recorrente') ||
      ranking.indexOf(r) < 20 // Top 20
    );
  }, [ranking]);

  // Exportar para CSV
  const handleExport = () => {
    const headers = [
      'Posição',
      'Cliente',
      'Segmento',
      'Cidade',
      'Estado',
      'Contato',
      'Email',
      'Telefone',
      'Faturamento',
      'Pedidos',
      'Ticket Médio',
      'Tags Automáticas',
      'Tags Manuais'
    ];

    const rows = topClients.map((r, idx) => [
      idx + 1,
      r.client_name,
      r.client_segment || '',
      r.client_city || '',
      r.client_state || '',
      r.client_contact || '',
      r.client_email || '',
      r.client_phone || '',
      r.total_revenue.toFixed(2),
      r.order_count,
      r.avg_ticket.toFixed(2),
      r.auto_tags.join('; '),
      r.manual_tags.join('; ')
    ]);

    const csv = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `ranking-clientes-${selectedYear}.csv`;
    link.click();
    
    toast.success('Ranking exportado com sucesso!');
  };

  const getMedalIcon = (position) => {
    if (position === 0) return <Trophy className="w-6 h-6 text-yellow-500" />;
    if (position === 1) return <Medal className="w-6 h-6 text-slate-400" />;
    if (position === 2) return <Award className="w-6 h-6 text-amber-600" />;
    return null;
  };

  // Anos disponíveis
  const availableYears = useMemo(() => {
    const years = new Set();
    orders.forEach(o => {
      if (o.created_date) {
        years.add(new Date(o.created_date).getFullYear());
      }
    });
    return Array.from(years).sort((a, b) => b - a);
  }, [orders]);

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value || 0);
  };

  return (
    <div className="pb-20 lg:pb-6 space-y-6">
      <PageHeader
        title="🏆 Ranking de Clientes"
        subtitle={`Melhores clientes do ano ${selectedYear}`}
      />

      {/* Filtros */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1">
              <label className="text-xs text-slate-600 mb-1 block">Ano</label>
              <Select value={String(selectedYear)} onValueChange={setSelectedYear}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {availableYears.map(year => (
                    <SelectItem key={year} value={String(year)}>
                      {year}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex-1">
              <label className="text-xs text-slate-600 mb-1 block">Mostrar Top</label>
              <Select value={rankingSize} onValueChange={setRankingSize}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="10">Top 10</SelectItem>
                  <SelectItem value="20">Top 20</SelectItem>
                  <SelectItem value="50">Top 50</SelectItem>
                  <SelectItem value="999">Todos</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Button 
              onClick={handleExport} 
              variant="outline"
              className="mt-auto"
              disabled={topClients.length === 0}
            >
              <Download className="w-4 h-4 mr-2" />
              Exportar CSV
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Resumo */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <DollarSign className="w-8 h-8 text-emerald-500" />
              <div>
                <p className="text-xs text-slate-600">Faturamento Total</p>
                <p className="text-lg font-bold text-slate-900">
                  {formatCurrency(ranking.reduce((sum, r) => sum + r.total_revenue, 0))}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <ShoppingCart className="w-8 h-8 text-blue-500" />
              <div>
                <p className="text-xs text-slate-600">Total de Pedidos</p>
                <p className="text-lg font-bold text-slate-900">
                  {ranking.reduce((sum, r) => sum + r.order_count, 0)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Target className="w-8 h-8 text-purple-500" />
              <div>
                <p className="text-xs text-slate-600">Ticket Médio Geral</p>
                <p className="text-lg font-bold text-slate-900">
                  {formatCurrency(
                    ranking.reduce((sum, r) => sum + r.total_revenue, 0) / 
                    ranking.reduce((sum, r) => sum + r.order_count, 0)
                  )}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Sparkles className="w-8 h-8 text-amber-500" />
              <div>
                <p className="text-xs text-slate-600">Clientes Premium</p>
                <p className="text-lg font-bold text-slate-900">
                  {awardClients.length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Ranking Table */}
      <Card>
        <CardHeader>
          <CardTitle>Top {rankingSize === '999' ? 'Clientes' : rankingSize} - {selectedYear}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b bg-slate-50">
                <tr>
                  <th className="text-center p-3 font-semibold w-16">#</th>
                  <th className="text-left p-3 font-semibold">Cliente</th>
                  <th className="text-center p-3 font-semibold">Tags</th>
                  <th className="text-right p-3 font-semibold">Faturamento</th>
                  <th className="text-center p-3 font-semibold">Pedidos</th>
                  <th className="text-right p-3 font-semibold">Ticket Médio</th>
                </tr>
              </thead>
              <tbody>
                {topClients.map((r, idx) => (
                  <tr 
                    key={r.client_id} 
                    className={`border-b hover:bg-slate-50 transition-colors ${
                      idx < 3 ? 'bg-amber-50/30' : ''
                    }`}
                  >
                    <td className="p-3 text-center">
                      <div className="flex items-center justify-center gap-2">
                        {getMedalIcon(idx)}
                        <span className="font-bold text-slate-700">{idx + 1}</span>
                      </div>
                    </td>
                    <td className="p-3">
                      <Link 
                        to={createPageUrl(`ClientDetails?id=${r.client_id}`)}
                        className="hover:text-purple-600 transition-colors"
                      >
                        <p className="font-semibold text-slate-900">{r.client_name}</p>
                        <p className="text-xs text-slate-500">{r.client_segment}</p>
                      </Link>
                    </td>
                    <td className="p-3">
                      <div className="flex flex-wrap gap-1 justify-center">
                        {r.auto_tags.slice(0, 2).map((tag, i) => (
                          <Badge 
                            key={i} 
                            className="bg-gradient-to-r from-purple-500 to-indigo-500 text-white text-[10px]"
                          >
                            {tag}
                          </Badge>
                        ))}
                        {r.manual_tags.slice(0, 1).map((tag, i) => (
                          <Badge 
                            key={i} 
                            variant="outline"
                            className="text-[10px]"
                          >
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    </td>
                    <td className="p-3 text-right font-bold text-emerald-600">
                      {formatCurrency(r.total_revenue)}
                    </td>
                    <td className="p-3 text-center">
                      <Badge variant="outline">{r.order_count}</Badge>
                    </td>
                    <td className="p-3 text-right text-slate-700">
                      {formatCurrency(r.avg_ticket)}
                    </td>
                  </tr>
                ))}
                {topClients.length === 0 && (
                  <tr>
                    <td colSpan="6" className="p-8 text-center text-slate-500">
                      Nenhum pedido encontrado em {selectedYear}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Lista de Premiação */}
      <Card className="border-2 border-amber-200 bg-gradient-to-br from-amber-50 to-yellow-50">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Trophy className="w-6 h-6 text-amber-600" />
              <CardTitle>🎁 Clientes para Premiação - {selectedYear}</CardTitle>
            </div>
            <Button 
              onClick={() => {
                const headers = ['Cliente', 'Contato', 'Email', 'Telefone', 'Faturamento', 'Tags'];
                const rows = awardClients.map(r => [
                  r.client_name,
                  r.client_contact || '',
                  r.client_email || '',
                  r.client_phone || '',
                  r.total_revenue.toFixed(2),
                  [...r.auto_tags, ...r.manual_tags].join('; ')
                ]);
                const csv = [
                  headers.join(','),
                  ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
                ].join('\n');
                const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
                const url = URL.createObjectURL(blob);
                const link = document.createElement('a');
                link.href = url;
                link.download = `premiacao-${selectedYear}.csv`;
                link.click();
                toast.success('Lista de premiação exportada!');
              }}
              variant="outline"
              size="sm"
              className="border-amber-500 text-amber-700 hover:bg-amber-100"
            >
              <Download className="w-4 h-4 mr-2" />
              Exportar Lista
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-slate-700 mb-4">
            <strong>{awardClients.length} clientes</strong> qualificados para ações de premiação, brindes ou campanhas especiais.
          </p>
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {awardClients.slice(0, 20).map((r, idx) => (
              <div 
                key={r.client_id} 
                className="bg-white rounded-lg p-3 border border-amber-200 flex items-center justify-between"
              >
                <div className="flex-1">
                  <p className="font-semibold text-slate-900">{r.client_name}</p>
                  <p className="text-xs text-slate-600">
                    {r.client_contact} • {r.client_phone}
                  </p>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {r.auto_tags.map((tag, i) => (
                      <Badge 
                        key={i} 
                        className="bg-gradient-to-r from-purple-500 to-indigo-500 text-white text-[10px]"
                      >
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-bold text-emerald-600">{formatCurrency(r.total_revenue)}</p>
                  <p className="text-xs text-slate-500">{r.order_count} pedidos</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}