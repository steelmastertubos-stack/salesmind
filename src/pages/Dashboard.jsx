import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import IntegratedAlerts from '@/components/dashboard/IntegratedAlerts';
import { 
  Users, 
  FileText, 
  DollarSign, 
  TrendingUp,
  ShoppingCart,
  Target,
  Zap,
  Calendar,
  RefreshCw,
  Brain,
  Sparkles
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import StatsCard from '@/components/dashboard/StatsCard';
import OpportunityCard from '@/components/dashboard/OpportunityCard';
import AlertsPanel from '@/components/dashboard/AlertsPanel';
import GoalsPanel from '@/components/dashboard/GoalsPanel';
import PriorityClients from '@/components/dashboard/PriorityClients';
import { Skeleton } from '@/components/ui/skeleton';

export default function Dashboard() {
  const [greeting, setGreeting] = useState('');

  useEffect(() => {
    const hour = new Date().getHours();
    if (hour < 12) setGreeting('Bom dia');
    else if (hour < 18) setGreeting('Boa tarde');
    else setGreeting('Boa noite');
  }, []);

  const { data: clients = [], isLoading: loadingClients, refetch: refetchClients } = useQuery({
    queryKey: ['clients'],
    queryFn: () => base44.entities.Client.list('-opportunity_index', 100)
  });

  const { data: quotes = [], isLoading: loadingQuotes } = useQuery({
    queryKey: ['quotes'],
    queryFn: () => base44.entities.Quote.list('-created_date', 50)
  });

  const { data: orders = [], isLoading: loadingOrders } = useQuery({
    queryKey: ['orders'],
    queryFn: () => base44.entities.Order.list('-created_date', 100)
  });

  const { data: user } = useQuery({
    queryKey: ['user'],
    queryFn: () => base44.auth.me()
  });

  const calculateOpportunityIndex = (client) => {
    if (!client.last_purchase_date) return 30;
    
    const daysSince = Math.floor((new Date() - new Date(client.last_purchase_date)) / (1000 * 60 * 60 * 24));
    const cycle = client.average_purchase_cycle || 30;
    const ticket = client.average_ticket || 0;
    
    let index = 50;
    
    // Days factor
    if (daysSince >= cycle * 0.8) index += 30;
    else if (daysSince >= cycle * 0.5) index += 15;
    
    // Ticket factor
    if (ticket > 10000) index += 10;
    else if (ticket > 5000) index += 5;
    
    // Cap at 100
    return Math.min(100, Math.max(0, index));
  };

  const processedClients = clients.map(client => ({
    ...client,
    opportunity_index: client.opportunity_index || calculateOpportunityIndex(client)
  })).sort((a, b) => (b.opportunity_index || 0) - (a.opportunity_index || 0));

  const top10Clients = processedClients.slice(0, 10);

  const thisMonthOrders = orders.filter(o => {
    const orderDate = new Date(o.created_date);
    const now = new Date();
    return orderDate.getMonth() === now.getMonth() && orderDate.getFullYear() === now.getFullYear();
  });

  const thisMonthRevenue = thisMonthOrders.reduce((sum, o) => sum + (o.total_value || 0), 0);
  
  const pendingQuotes = quotes.filter(q => ['draft', 'sent', 'negotiating'].includes(q.status));
  const pendingQuotesValue = pendingQuotes.reduce((sum, q) => sum + (q.total_value || 0), 0);

  const pendingCommission = orders
    .filter(o => o.commission_status === 'pending' || o.commission_status === 'invoiced')
    .reduce((sum, o) => sum + (o.expected_commission || 0), 0);

  const blockedCommission = orders
    .filter(o => ['at_risk', 'glossed', 'disputed'].includes(o.commission_status))
    .reduce((sum, o) => sum + (o.expected_commission || 0), 0);

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value || 0);
  };

  const isLoading = loadingClients || loadingQuotes || loadingOrders;

  return (
    <div className="space-y-6 pb-20 lg:pb-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            {greeting}, {user?.full_name?.split(' ')[0] || 'Representante'}!
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            {new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}
          </p>
        </div>
        <Button 
          variant="outline" 
          onClick={() => refetchClients()}
          className="w-fit"
        >
          <RefreshCw className="w-4 h-4 mr-2" />
          Atualizar
        </Button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {isLoading ? (
          <>
            {[...Array(4)].map((_, i) => (
              <div key={i} className="bg-white rounded-2xl p-4 border border-slate-100">
                <Skeleton className="w-10 h-10 rounded-xl mb-3" />
                <Skeleton className="h-8 w-20 mb-1" />
                <Skeleton className="h-4 w-16" />
              </div>
            ))}
          </>
        ) : (
          <>
            <StatsCard
              title="Faturamento Mês"
              value={formatCurrency(thisMonthRevenue)}
              icon={DollarSign}
              color="emerald"
              subtitle={`${thisMonthOrders.length} pedidos`}
            />
            <StatsCard
              title="Orçamentos Abertos"
              value={pendingQuotes.length}
              icon={FileText}
              color="blue"
              subtitle={formatCurrency(pendingQuotesValue)}
            />
            <StatsCard
              title="Comissão Prevista"
              value={formatCurrency(pendingCommission)}
              icon={TrendingUp}
              color="purple"
            />
            <StatsCard
              title="Clientes Ativos"
              value={clients.filter(c => c.status === 'active').length}
              icon={Users}
              color="amber"
              subtitle={`de ${clients.length} total`}
            />
          </>
        )}
      </div>

      {/* Goals Panel - Destaque */}
      <GoalsPanel orders={orders} quotes={quotes} />

      {/* Priority Clients - NEW */}
      {!isLoading && clients.length > 0 && (
        <PriorityClients clients={clients} orders={orders} />
      )}

      {/* Main Content */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Top 10 Opportunities */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Zap className="w-5 h-5 text-emerald-500" />
              <h2 className="text-lg font-semibold text-slate-900">Top 10 Oportunidades</h2>
            </div>
            <span className="text-xs text-slate-500 bg-slate-100 px-2 py-1 rounded-full">
              Ordenado por índice
            </span>
          </div>

          {isLoading ? (
            <div className="grid sm:grid-cols-2 gap-4">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="bg-white rounded-2xl p-4 border border-slate-100">
                  <Skeleton className="h-6 w-32 mb-3" />
                  <Skeleton className="h-4 w-24 mb-4" />
                  <div className="grid grid-cols-3 gap-2 mb-4">
                    {[...Array(3)].map((_, j) => (
                      <Skeleton key={j} className="h-16 rounded-xl" />
                    ))}
                  </div>
                  <Skeleton className="h-10 w-full rounded-xl" />
                </div>
              ))}
            </div>
          ) : top10Clients.length > 0 ? (
            <div className="grid sm:grid-cols-2 gap-4">
              {top10Clients.map((client, index) => (
                <OpportunityCard 
                  key={client.id} 
                  client={client} 
                  rank={index + 1}
                />
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-2xl p-8 text-center border border-slate-100">
              <Users className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <h3 className="font-semibold text-slate-900 mb-1">Nenhum cliente cadastrado</h3>
              <p className="text-sm text-slate-500">Comece cadastrando seus clientes para ver as oportunidades</p>
            </div>
          )}
        </div>

        {/* Alerts Panel */}
        <div>
          <AlertsPanel 
            clients={processedClients}
            commissionAlerts={{
              blockedValue: blockedCommission,
              blockedCount: orders.filter(o => ['at_risk', 'glossed', 'disputed'].includes(o.commission_status)).length
            }}
          />

          {/* AI Insights Teaser */}
          <div className="bg-gradient-to-br from-purple-50 to-indigo-50 border-2 border-purple-200 rounded-2xl p-4 mt-4">
            <div className="flex items-center gap-2 mb-2">
              <Brain className="w-5 h-5 text-purple-600" />
              <h3 className="font-semibold text-purple-900">Insights com IA</h3>
            </div>
            <p className="text-sm text-purple-700 mb-3">
              Preveja compras e receba recomendações inteligentes
            </p>
            <Button className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700" asChild>
              <a href="/AIInsights">
                <Sparkles className="w-4 h-4 mr-2" />
                Ver Análises
              </a>
            </Button>
          </div>

          {/* Quick Actions */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-4 mt-4">
            <h3 className="font-semibold text-slate-900 mb-4">Ações Rápidas</h3>
            <div className="grid grid-cols-2 gap-2">
              <Button variant="outline" className="h-auto py-3 flex-col gap-1" asChild>
                <a href="/Clients">
                  <Users className="w-5 h-5 text-slate-600" />
                  <span className="text-xs">Novo Cliente</span>
                </a>
              </Button>
              <Button variant="outline" className="h-auto py-3 flex-col gap-1" asChild>
                <a href="/Quotes">
                  <FileText className="w-5 h-5 text-slate-600" />
                  <span className="text-xs">Novo Orçamento</span>
                </a>
              </Button>
              <Button variant="outline" className="h-auto py-3 flex-col gap-1" asChild>
                <a href="/FieldMode">
                  <Target className="w-5 h-5 text-slate-600" />
                  <span className="text-xs">Modo Campo</span>
                </a>
              </Button>
              <Button variant="outline" className="h-auto py-3 flex-col gap-1" asChild>
                <a href="/Reports">
                  <TrendingUp className="w-5 h-5 text-slate-600" />
                  <span className="text-xs">Relatórios</span>
                </a>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}