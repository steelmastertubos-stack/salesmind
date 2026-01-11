import React, { useState, useMemo } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link, useNavigate } from 'react-router-dom';
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
  Zap,
  Phone,
  MessageCircle,
  Mail,
  FileText,
  CheckCircle2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import PageHeader from '@/components/common/PageHeader';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { generateActionableInsights } from '@/components/ai/InsightsEngine';
import QuickActionModal from '@/components/ai/QuickActionModal';

export default function AIInsights() {
  const [filter, setFilter] = useState('all');
  const [selectedInsight, setSelectedInsight] = useState(null);
  const [actionModal, setActionModal] = useState(null);
  const [processingAction, setProcessingAction] = useState(null);
  
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: clients = [], isLoading: loadingClients } = useQuery({
    queryKey: ['clients'],
    queryFn: () => base44.entities.Client.list('-opportunity_index', 200)
  });

  const { data: orders = [], isLoading: loadingOrders } = useQuery({
    queryKey: ['orders'],
    queryFn: () => base44.entities.Order.list('-created_date', 1000)
  });

  const { data: quotes = [], isLoading: loadingQuotes } = useQuery({
    queryKey: ['quotes'],
    queryFn: () => base44.entities.Quote.list('-created_date', 500)
  });

  const { data: opportunities = [], isLoading: loadingOpportunities } = useQuery({
    queryKey: ['opportunities'],
    queryFn: () => base44.entities.Opportunity.list('-created_date', 500)
  });

  const { data: activities = [] } = useQuery({
    queryKey: ['activities'],
    queryFn: () => base44.entities.Activity.list('-created_date', 100)
  });

  // Generate insights using rules engine
  const dailyInsights = useMemo(() => {
    if (!clients.length || !orders.length) return [];
    const insights = generateActionableInsights(clients, orders, quotes, opportunities);
    
    // Enrich with insight_id and check if action already exists
    return insights.map((insight, idx) => {
      const insightId = `INSIGHT-${insight.client_id}-${insight.insight_type || 'ACTION'}-${idx}`;
      const existingActivity = activities.find(a => 
        a.customer_id === insight.client_id && 
        a.notes?.includes(insight.title)
      );
      
      return {
        ...insight,
        insight_id: insightId,
        insight_type: insight.insight_type || 'OPPORTUNITY',
        scope_type: 'CUSTOMER',
        scope_id: insight.client_id,
        activity_id: existingActivity?.id,
        status: existingActivity ? 'IN_PROGRESS' : 'NEW'
      };
    });
  }, [clients, orders, quotes, opportunities, activities]);

  const handleGenerateAction = async (insight) => {
    setProcessingAction(insight.insight_id);

    try {
      const channel = insight.recommended_action?.channel || 'WHATSAPP';
      
      // A) Create Activity Log
      const activityData = {
        customer_id: insight.client_id,
        customer_name: insight.client_name,
        alert_type: 'ATTENTION',
        action_type: channel,
        notes: `[IA] ${insight.title}\n\n${insight.what_is_happening}\n\nAção: ${channel}`,
        status: 'in_progress',
        next_follow_up: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0]
      };

      const activity = await base44.entities.Activity.create(activityData);
      
      // B) Open execution flow based on action type
      if (['WHATSAPP', 'CALL', 'EMAIL'].includes(channel)) {
        setActionModal({ ...insight, activity_id: activity.id });
        toast.success('Ação criada! Prepare sua mensagem');
      } else {
        // Fallback: navigate to customer detail
        navigate(createPageUrl(`ClientDetails?id=${insight.client_id}`));
        toast.success('Ação criada! Abrindo detalhes do cliente');
      }

      // D) Update UI
      queryClient.invalidateQueries(['activities']);
      
    } catch (error) {
      console.error('Error creating action:', error);
      toast.error('Não foi possível gerar a ação');
    } finally {
      setProcessingAction(null);
    }
  };

  const getDefaultRoute = (insight) => {
    if (insight.scope_type === 'CUSTOMER') {
      return createPageUrl(`ClientDetails?id=${insight.scope_id}`);
    }
    if (insight.scope_type === 'SEGMENT') {
      return createPageUrl(`Reports`);
    }
    if (insight.scope_type === 'REGION') {
      return createPageUrl(`Reports`);
    }
    return createPageUrl('Dashboard');
  };

  const handleActionComplete = () => {
    toast.success('Ação concluída com sucesso');
    queryClient.invalidateQueries(['activities']);
  };

  const getActionIcon = (type) => {
    switch (type) {
      case 'WHATSAPP': return MessageCircle;
      case 'CALL': return Phone;
      case 'EMAIL': return Mail;
      default: return FileText;
    }
  };

  if (loadingClients || loadingOrders || loadingQuotes || loadingOpportunities) {
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
    <div className="pb-20 lg:pb-6 space-y-6">
      <PageHeader 
        title="🎯 Top 5 Ações do Dia" 
        subtitle={`${dailyInsights.length} ações prioritárias baseadas em dados reais`}
      />

      {/* Daily Actions */}
      {dailyInsights.length === 0 ? (
        <Card className="bg-gradient-to-br from-slate-50 to-slate-100">
          <CardContent className="pt-12 pb-12 text-center">
            <Sparkles className="w-12 h-12 text-slate-400 mx-auto mb-3" />
            <h3 className="text-lg font-semibold text-slate-600 mb-2">Nenhuma ação prioritária hoje</h3>
            <p className="text-sm text-slate-500">Continue acompanhando seus clientes</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {dailyInsights.map((insight, idx) => {
            const ActionIcon = getActionIcon(insight.recommended_action?.action_type || insight.recommended_action?.channel);
            const isProcessing = processingAction === insight.insight_id;
            const hasAction = insight.status === 'IN_PROGRESS';
            
            return (
              <Card key={idx} className="border-l-4 border-l-purple-600 hover:shadow-lg transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge className="bg-purple-100 text-purple-700 font-mono text-xs">
                          #{idx + 1}
                        </Badge>
                        <Badge variant="outline">
                          Score: {insight.priority_score}
                        </Badge>
                        {hasAction && (
                          <Badge className="bg-green-100 text-green-700">
                            <CheckCircle2 className="w-3 h-3 mr-1" />
                            Em andamento
                          </Badge>
                        )}
                      </div>
                      <CardTitle className="text-base">{insight.title}</CardTitle>
                      <Link 
                        to={createPageUrl(`ClientDetails?id=${insight.client_id}`)}
                        className="text-sm text-slate-600 hover:text-purple-600 transition-colors"
                      >
                        {insight.client_name} →
                      </Link>
                    </div>
                    {hasAction ? (
                      <Link to={createPageUrl(`ClientAlertDetail?id=${insight.client_id}`)}>
                        <Button variant="outline" className="border-green-600 text-green-700 hover:bg-green-50">
                          <CheckCircle2 className="w-4 h-4 mr-2" />
                          Ver Ação
                        </Button>
                      </Link>
                    ) : (
                      <Button
                        className="bg-purple-600 hover:bg-purple-700"
                        onClick={() => handleGenerateAction(insight)}
                        disabled={isProcessing}
                      >
                        {isProcessing ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Criando...
                          </>
                        ) : (
                          <>
                            <ActionIcon className="w-4 h-4 mr-2" />
                            Gerar Ação
                          </>
                        )}
                      </Button>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <p className="text-sm text-slate-700 mb-1">
                      <span className="font-semibold">O que está acontecendo:</span> {insight.what_is_happening}
                    </p>
                    <p className="text-sm text-slate-700">
                      <span className="font-semibold">Por que importa:</span> {insight.why_it_matters}
                    </p>
                  </div>

                  <div className="bg-slate-50 rounded-lg p-3">
                    <p className="text-xs font-semibold text-slate-600 mb-2">
                      📞 {insight.recommended_action?.channel === 'WHATSAPP' ? 'Mensagem sugerida:' : 
                          insight.recommended_action?.channel === 'CALL' ? 'Script da ligação:' : 
                          'Email sugerido:'}
                    </p>
                    <p className="text-sm text-slate-700 italic">
                      {insight.message_template?.whatsapp_text || insight.message_template?.call_script}
                    </p>
                    {insight.recommended_action?.best_time_window && (
                      <p className="text-xs text-slate-500 mt-2">
                        ⏰ Melhor horário: {insight.recommended_action.best_time_window}
                      </p>
                    )}
                  </div>

                  <div className="bg-blue-50 rounded-lg p-3">
                    <p className="text-xs font-semibold text-blue-900 mb-1">💡 Por que essa ação?</p>
                    <ul className="text-xs text-blue-800 space-y-0.5">
                      {insight.explainability?.map((point, i) => (
                        <li key={i}>{point}</li>
                      ))}
                    </ul>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Quick Action Modal */}
      {actionModal && (
        <QuickActionModal
          insight={actionModal}
          onClose={() => setActionModal(null)}
          onComplete={handleActionComplete}
        />
      )}
    </div>
  );
}