import React, { useState, useMemo } from 'react';
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
  Zap,
  Phone,
  MessageCircle,
  Mail,
  FileText
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import PageHeader from '@/components/common/PageHeader';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { generateActionableInsights } from '@/components/ai/InsightsEngine';

export default function AIInsights() {
  const [filter, setFilter] = useState('all');

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

  // Generate insights using rules engine
  const dailyInsights = useMemo(() => {
    if (!clients.length || !orders.length) return [];
    return generateActionableInsights(clients, orders, quotes, opportunities);
  }, [clients, orders, quotes, opportunities]);

  const handleAction = (insight, actionType) => {
    if (actionType === 'WHATSAPP') {
      const text = encodeURIComponent(insight.message_template.whatsapp_text);
      window.open(`https://wa.me/?text=${text}`, '_blank');
      toast.success('WhatsApp aberto');
    } else if (actionType === 'EMAIL') {
      const subject = encodeURIComponent(insight.message_template.email_subject);
      const body = encodeURIComponent(insight.message_template.email_body);
      window.location.href = `mailto:?subject=${subject}&body=${body}`;
      toast.success('Email aberto');
    } else if (actionType === 'CALL') {
      toast.info(insight.message_template.call_script);
    }
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
            const ActionIcon = getActionIcon(insight.recommended_action.action_type);
            
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
                      </div>
                      <CardTitle className="text-base">{insight.title}</CardTitle>
                      <Link 
                        to={createPageUrl(`ClientDetails?id=${insight.client_id}`)}
                        className="text-sm text-slate-600 hover:text-purple-600 transition-colors"
                      >
                        {insight.client_name} →
                      </Link>
                    </div>
                    <Button
                      className="bg-purple-600 hover:bg-purple-700"
                      onClick={() => handleAction(insight, insight.recommended_action.action_type)}
                    >
                      <ActionIcon className="w-4 h-4 mr-2" />
                      {insight.recommended_action.channel}
                    </Button>
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
                      📞 {insight.recommended_action.channel === 'WHATSAPP' ? 'Mensagem sugerida:' : 
                          insight.recommended_action.channel === 'CALL' ? 'Script da ligação:' : 
                          'Email sugerido:'}
                    </p>
                    <p className="text-sm text-slate-700 italic">
                      {insight.message_template.whatsapp_text || insight.message_template.call_script}
                    </p>
                    {insight.recommended_action.best_time_window && (
                      <p className="text-xs text-slate-500 mt-2">
                        ⏰ Melhor horário: {insight.recommended_action.best_time_window}
                      </p>
                    )}
                  </div>

                  <div className="bg-blue-50 rounded-lg p-3">
                    <p className="text-xs font-semibold text-blue-900 mb-1">💡 Por que essa ação?</p>
                    <ul className="text-xs text-blue-800 space-y-0.5">
                      {insight.explainability.map((point, i) => (
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
    </div>
  );
}