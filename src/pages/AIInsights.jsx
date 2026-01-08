import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { 
  Brain, 
  Sparkles,
  TrendingUp,
  AlertTriangle,
  Target,
  Calendar,
  Loader2,
  ChevronRight,
  Filter,
  Zap
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import PageHeader from '@/components/common/PageHeader';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';

export default function AIInsights() {
  const [filter, setFilter] = useState('all'); // all, high_priority, overdue, opportunities
  const [analyzingAll, setAnalyzingAll] = useState(false);
  const [insights, setInsights] = useState({});

  const { data: clients = [], isLoading: loadingClients } = useQuery({
    queryKey: ['clients'],
    queryFn: () => base44.entities.Client.list('-opportunity_index', 50)
  });

  const { data: allOrders = [], isLoading: loadingOrders } = useQuery({
    queryKey: ['orders'],
    queryFn: () => base44.entities.Order.list('-created_date', 500)
  });

  const analyzeAllClients = async () => {
    setAnalyzingAll(true);
    const newInsights = {};
    
    try {
      // Analyze top 10 clients in parallel
      const topClients = clients.slice(0, 10);
      
      for (const client of topClients) {
        const clientOrders = allOrders.filter(o => o.client_id === client.id);
        
        if (clientOrders.length > 0) {
          try {
            const purchaseHistory = clientOrders
              .filter(o => o.status !== 'cancelled')
              .map(o => ({
                date: o.created_date,
                value: o.total_value,
                items: o.items?.map(i => i.product_name) || []
              }))
              .slice(0, 10);

            const prompt = `Analise rapidamente este cliente B2B:
Cliente: ${client.trade_name || client.company_name}
Ciclo médio: ${client.average_purchase_cycle || 30} dias
Última compra: ${client.last_purchase_date || 'Nunca'}
Histórico: ${JSON.stringify(purchaseHistory)}

Retorne uma análise resumida com:
1. Data prevista da próxima compra
2. Confiança da previsão (0-100)
3. Cliente está atrasado? (sim/não)
4. Nível de prioridade para contato (baixo/médio/alto)
5. Uma ação recomendada (máximo 1 frase)`;

            const result = await base44.integrations.Core.InvokeLLM({
              prompt,
              response_json_schema: {
                type: "object",
                properties: {
                  predicted_date: { type: "string" },
                  confidence: { type: "number" },
                  is_overdue: { type: "boolean" },
                  priority: { type: "string" },
                  quick_action: { type: "string" }
                }
              }
            });

            newInsights[client.id] = result;
          } catch (error) {
            console.error(`Error analyzing client ${client.id}:`, error);
          }
        }
      }

      setInsights(newInsights);
      toast.success('Análise concluída para todos os clientes');
    } catch (error) {
      console.error('Error in bulk analysis:', error);
      toast.error('Erro ao analisar clientes');
    } finally {
      setAnalyzingAll(false);
    }
  };

  const getClientOrders = (clientId) => {
    return allOrders.filter(o => o.client_id === clientId);
  };

  const formatDate = (dateStr) => {
    try {
      return new Date(dateStr).toLocaleDateString('pt-BR', { 
        day: 'numeric', 
        month: 'short'
      });
    } catch {
      return dateStr;
    }
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value || 0);
  };

  const getPriorityConfig = (priority) => {
    switch (priority?.toLowerCase()) {
      case 'alto':
      case 'high':
        return { color: 'bg-red-100 text-red-700 border-red-200', label: 'Alta' };
      case 'médio':
      case 'medio':
      case 'medium':
        return { color: 'bg-amber-100 text-amber-700 border-amber-200', label: 'Média' };
      default:
        return { color: 'bg-emerald-100 text-emerald-700 border-emerald-200', label: 'Baixa' };
    }
  };

  const filteredClients = clients.filter(client => {
    const insight = insights[client.id];
    const hasOrders = getClientOrders(client.id).length > 0;

    if (filter === 'high_priority') {
      return insight?.priority?.toLowerCase() === 'alto' || insight?.priority?.toLowerCase() === 'high';
    }
    if (filter === 'overdue') {
      return insight?.is_overdue === true;
    }
    if (filter === 'opportunities') {
      return hasOrders && (!insight || insight.confidence > 70);
    }
    return hasOrders; // Only show clients with orders for 'all'
  });

  const stats = {
    analyzed: Object.keys(insights).length,
    highPriority: Object.values(insights).filter(i => i.priority?.toLowerCase() === 'alto' || i.priority?.toLowerCase() === 'high').length,
    overdue: Object.values(insights).filter(i => i.is_overdue === true).length,
    opportunities: Object.values(insights).filter(i => i.confidence > 70).length
  };

  if (loadingClients || loadingOrders) {
    return (
      <div className="pb-20 lg:pb-6">
        <PageHeader title="Insights de IA" subtitle="Carregando..." />
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className="h-32 w-full rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="pb-20 lg:pb-6">
      <PageHeader 
        title="Insights de IA" 
        subtitle="Análise preditiva e recomendações inteligentes"
      >
        <Button
          onClick={analyzeAllClients}
          disabled={analyzingAll}
          className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700"
        >
          {analyzingAll ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Analisando...
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4 mr-2" />
              Analisar Todos
            </>
          )}
        </Button>
      </PageHeader>

      {/* Stats */}
      {Object.keys(insights).length > 0 && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
          <div className="bg-white rounded-xl p-4 border border-slate-100">
            <div className="flex items-center gap-2 mb-1">
              <Brain className="w-4 h-4 text-purple-600" />
              <span className="text-xs text-slate-500">Analisados</span>
            </div>
            <p className="text-2xl font-bold text-slate-900">{stats.analyzed}</p>
          </div>
          <div className="bg-white rounded-xl p-4 border border-slate-100">
            <div className="flex items-center gap-2 mb-1">
              <AlertTriangle className="w-4 h-4 text-red-600" />
              <span className="text-xs text-slate-500">Alta Prioridade</span>
            </div>
            <p className="text-2xl font-bold text-red-600">{stats.highPriority}</p>
          </div>
          <div className="bg-white rounded-xl p-4 border border-slate-100">
            <div className="flex items-center gap-2 mb-1">
              <Calendar className="w-4 h-4 text-amber-600" />
              <span className="text-xs text-slate-500">Atrasados</span>
            </div>
            <p className="text-2xl font-bold text-amber-600">{stats.overdue}</p>
          </div>
          <div className="bg-white rounded-xl p-4 border border-slate-100">
            <div className="flex items-center gap-2 mb-1">
              <Target className="w-4 h-4 text-emerald-600" />
              <span className="text-xs text-slate-500">Oportunidades</span>
            </div>
            <p className="text-2xl font-bold text-emerald-600">{stats.opportunities}</p>
          </div>
        </div>
      )}

      {/* Filter */}
      {Object.keys(insights).length > 0 && (
        <div className="mb-6">
          <Select value={filter} onValueChange={setFilter}>
            <SelectTrigger className="w-full sm:w-64">
              <Filter className="w-4 h-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos com Histórico</SelectItem>
              <SelectItem value="high_priority">Alta Prioridade</SelectItem>
              <SelectItem value="overdue">Atrasados</SelectItem>
              <SelectItem value="opportunities">Melhores Oportunidades</SelectItem>
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Empty State */}
      {Object.keys(insights).length === 0 && (
        <div className="bg-gradient-to-br from-purple-50 to-indigo-50 border-2 border-dashed border-purple-200 rounded-2xl p-12 text-center">
          <div className="w-16 h-16 bg-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Brain className="w-8 h-8 text-white" />
          </div>
          <h3 className="text-xl font-bold text-purple-900 mb-2">
            Análise Preditiva com IA
          </h3>
          <p className="text-slate-600 mb-6 max-w-md mx-auto">
            Use inteligência artificial para prever compras, identificar padrões e receber recomendações personalizadas para cada cliente
          </p>
          <Button
            onClick={analyzeAllClients}
            disabled={analyzingAll}
            className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700"
            size="lg"
          >
            {analyzingAll ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                Analisando Top 10 Clientes...
              </>
            ) : (
              <>
                <Sparkles className="w-5 h-5 mr-2" />
                Começar Análise
              </>
            )}
          </Button>
        </div>
      )}

      {/* Client List with Insights */}
      {filteredClients.length > 0 && (
        <div className="space-y-3">
          {filteredClients.map((client) => {
            const insight = insights[client.id];
            const orders = getClientOrders(client.id);
            const priorityConfig = insight ? getPriorityConfig(insight.priority) : null;

            return (
              <div key={client.id} className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden hover:shadow-md transition-shadow">
                <div className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-slate-900">
                          {client.trade_name || client.company_name}
                        </h3>
                        {insight?.is_overdue && (
                          <Badge className="bg-red-100 text-red-700">
                            <AlertTriangle className="w-3 h-3 mr-1" />
                            Atrasado
                          </Badge>
                        )}
                        {priorityConfig && (
                          <Badge className={priorityConfig.color}>
                            {priorityConfig.label}
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-3 text-xs text-slate-500">
                        <span>{client.segment}</span>
                        <span>•</span>
                        <span>{orders.length} pedidos</span>
                        <span>•</span>
                        <span>Ticket: {formatCurrency(client.average_ticket)}</span>
                      </div>
                    </div>
                    <Link to={createPageUrl(`ClientDetails?id=${client.id}`)}>
                      <Button variant="ghost" size="icon">
                        <ChevronRight className="w-5 h-5" />
                      </Button>
                    </Link>
                  </div>

                  {/* AI Insights */}
                  {insight ? (
                    <div className="space-y-3">
                      <div className="grid sm:grid-cols-3 gap-3">
                        <div className="bg-purple-50 rounded-lg p-3 border border-purple-100">
                          <div className="flex items-center gap-1 mb-1">
                            <Calendar className="w-3 h-3 text-purple-600" />
                            <span className="text-xs text-purple-700 font-medium">Próxima Compra</span>
                          </div>
                          <p className="text-sm font-bold text-purple-900">
                            {insight.predicted_date ? formatDate(insight.predicted_date) : 'N/A'}
                          </p>
                          {insight.confidence && (
                            <div className="flex items-center gap-1 mt-1">
                              <div className="flex-1 h-1.5 bg-purple-200 rounded-full overflow-hidden">
                                <div 
                                  className="h-full bg-purple-600 rounded-full"
                                  style={{ width: `${insight.confidence}%` }}
                                />
                              </div>
                              <span className="text-xs text-purple-600">{insight.confidence}%</span>
                            </div>
                          )}
                        </div>

                        <div className="bg-slate-50 rounded-lg p-3 border border-slate-200">
                          <div className="flex items-center gap-1 mb-1">
                            <TrendingUp className="w-3 h-3 text-slate-600" />
                            <span className="text-xs text-slate-600 font-medium">Ciclo Atual</span>
                          </div>
                          <p className="text-sm font-bold text-slate-900">
                            {client.average_purchase_cycle || '-'} dias
                          </p>
                          {client.last_purchase_date && (
                            <p className="text-xs text-slate-500 mt-1">
                              Último: {formatDate(client.last_purchase_date)}
                            </p>
                          )}
                        </div>

                        <div className="bg-emerald-50 rounded-lg p-3 border border-emerald-100">
                          <div className="flex items-center gap-1 mb-1">
                            <Zap className="w-3 h-3 text-emerald-600" />
                            <span className="text-xs text-emerald-700 font-medium">Índice Oport.</span>
                          </div>
                          <p className="text-sm font-bold text-emerald-900">
                            {client.opportunity_index || 0}
                          </p>
                        </div>
                      </div>

                      {insight.quick_action && (
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                          <div className="flex items-start gap-2">
                            <Target className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                            <div>
                              <p className="text-xs font-semibold text-blue-900 mb-1">Ação Recomendada:</p>
                              <p className="text-sm text-blue-700">{insight.quick_action}</p>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="bg-slate-50 rounded-lg p-3 text-center">
                      <p className="text-xs text-slate-500">
                        {orders.length > 0 
                          ? 'Clique em "Analisar Todos" para gerar insights com IA'
                          : 'Cliente sem histórico de compras'}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {filteredClients.length === 0 && Object.keys(insights).length > 0 && (
        <div className="text-center py-12">
          <Filter className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-500">Nenhum cliente encontrado com este filtro</p>
        </div>
      )}
    </div>
  );
}