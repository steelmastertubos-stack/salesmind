import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import PageHeader from '@/components/common/PageHeader';
import { 
  Target, 
  TrendingUp, 
  CheckCircle2, 
  XCircle, 
  Clock,
  Phone,
  Mail,
  MessageCircle,
  AlertTriangle,
  Calendar,
  DollarSign,
  Weight
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import OpportunityCard from '@/components/opportunities/OpportunityCard';
import OpportunityDetail from '@/components/opportunities/OpportunityDetail';

export default function Opportunities() {
  const [selectedStage, setSelectedStage] = useState('all');
  const [selectedOpportunity, setSelectedOpportunity] = useState(null);
  const queryClient = useQueryClient();

  const { data: opportunities = [], isLoading } = useQuery({
    queryKey: ['opportunities'],
    queryFn: () => base44.entities.Opportunity.list('-created_date', 500)
  });

  // Update days without contact
  useEffect(() => {
    opportunities.forEach(opp => {
      if (opp.last_contact_date && opp.stage !== 'ganho' && opp.stage !== 'perdido') {
        const lastContact = new Date(opp.last_contact_date);
        const today = new Date();
        const daysDiff = Math.floor((today - lastContact) / (1000 * 60 * 60 * 24));
        
        if (daysDiff !== opp.days_without_contact) {
          base44.entities.Opportunity.update(opp.id, { days_without_contact: daysDiff });
        }
      }
    });
  }, [opportunities]);

  const stages = {
    proposta_enviada: { label: 'Proposta Enviada', icon: Target, color: 'bg-blue-500' },
    em_negociacao: { label: 'Em Negociação', icon: TrendingUp, color: 'bg-yellow-500' },
    ganho: { label: 'Ganho', icon: CheckCircle2, color: 'bg-green-500' },
    perdido: { label: 'Perdido', icon: XCircle, color: 'bg-red-500' }
  };

  const filteredOpportunities = selectedStage === 'all' 
    ? opportunities 
    : opportunities.filter(opp => opp.stage === selectedStage);

  // Priority opportunities (high score, overdue follow-ups)
  const priorityOpportunities = opportunities.filter(opp => {
    if (opp.stage === 'ganho' || opp.stage === 'perdido') return false;
    
    const isHighScore = opp.priority_score >= 70;
    const isOverdue = opp.next_action_date && new Date(opp.next_action_date) < new Date();
    const stagnant = opp.days_without_contact >= 5;
    
    return isHighScore || isOverdue || stagnant;
  });

  // Stats
  const stats = {
    total: opportunities.length,
    proposta_enviada: opportunities.filter(o => o.stage === 'proposta_enviada').length,
    em_negociacao: opportunities.filter(o => o.stage === 'em_negociacao').length,
    ganho: opportunities.filter(o => o.stage === 'ganho').length,
    perdido: opportunities.filter(o => o.stage === 'perdido').length,
    totalValue: opportunities
      .filter(o => o.stage !== 'perdido')
      .reduce((sum, o) => sum + (o.total_value || 0), 0)
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value || 0);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#1DB954]"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader 
        title="Oportunidades" 
        subtitle="Funil de vendas e acompanhamento comercial"
      />

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">Total Ativo</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.proposta_enviada + stats.em_negociacao}</div>
            <p className="text-xs text-slate-500">{formatCurrency(stats.totalValue)}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-blue-600 flex items-center gap-2">
              <Target className="w-4 h-4" />
              Proposta Enviada
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.proposta_enviada}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-yellow-600 flex items-center gap-2">
              <TrendingUp className="w-4 h-4" />
              Em Negociação
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.em_negociacao}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-green-600 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4" />
              Ganho
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.ganho}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-red-600 flex items-center gap-2">
              <XCircle className="w-4 h-4" />
              Perdido
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.perdido}</div>
          </CardContent>
        </Card>
      </div>

      {/* Priority Alerts */}
      {priorityOpportunities.length > 0 && (
        <Card className="border-orange-200 bg-orange-50">
          <CardHeader>
            <CardTitle className="text-sm font-medium text-orange-800 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5" />
              🎯 Oportunidades Prioritárias para Contato Hoje ({priorityOpportunities.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {priorityOpportunities.slice(0, 3).map(opp => (
              <div 
                key={opp.id}
                className="flex items-center justify-between p-3 bg-white rounded-lg cursor-pointer hover:shadow-md transition-shadow"
                onClick={() => setSelectedOpportunity(opp)}
              >
                <div>
                  <p className="font-semibold text-slate-900">{opp.client_name}</p>
                  <p className="text-sm text-slate-600">
                    {formatCurrency(opp.total_value)} • {opp.days_without_contact} dias sem contato
                  </p>
                </div>
                <Badge variant={opp.risk_level === 'high' ? 'destructive' : 'default'}>
                  Score: {opp.priority_score}
                </Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Filter Tabs */}
      <Tabs value={selectedStage} onValueChange={setSelectedStage}>
        <TabsList className="w-full justify-start">
          <TabsTrigger value="all">Todas ({opportunities.length})</TabsTrigger>
          <TabsTrigger value="proposta_enviada">
            Proposta Enviada ({stats.proposta_enviada})
          </TabsTrigger>
          <TabsTrigger value="em_negociacao">
            Em Negociação ({stats.em_negociacao})
          </TabsTrigger>
          <TabsTrigger value="ganho">
            Ganho ({stats.ganho})
          </TabsTrigger>
          <TabsTrigger value="perdido">
            Perdido ({stats.perdido})
          </TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Opportunities Grid */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredOpportunities.map(opp => (
          <OpportunityCard 
            key={opp.id}
            opportunity={opp}
            onClick={() => setSelectedOpportunity(opp)}
          />
        ))}
      </div>

      {filteredOpportunities.length === 0 && (
        <Card>
          <CardContent className="text-center py-12">
            <Target className="w-12 h-12 text-slate-300 mx-auto mb-4" />
            <p className="text-slate-500">Nenhuma oportunidade neste estágio</p>
          </CardContent>
        </Card>
      )}

      {/* Opportunity Detail Dialog */}
      {selectedOpportunity && (
        <OpportunityDetail
          opportunity={selectedOpportunity}
          onClose={() => setSelectedOpportunity(null)}
          onUpdate={() => {
            queryClient.invalidateQueries(['opportunities']);
            setSelectedOpportunity(null);
          }}
        />
      )}
    </div>
  );
}