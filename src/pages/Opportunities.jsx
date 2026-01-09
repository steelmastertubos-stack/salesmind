import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import PageHeader from '@/components/common/PageHeader';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
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
  Weight,
  Send
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import OpportunityDetail from '@/components/opportunities/OpportunityDetail';

export default function Opportunities() {
  const [selectedOpportunity, setSelectedOpportunity] = useState(null);
  const queryClient = useQueryClient();

  const { data: opportunities = [], isLoading } = useQuery({
    queryKey: ['opportunities'],
    queryFn: () => base44.entities.Opportunity.list('-priority_score', 500)
  });

  const updateStageMutation = useMutation({
    mutationFn: ({ id, newStage }) => base44.entities.Opportunity.update(id, { stage: newStage }),
    onSuccess: () => {
      queryClient.invalidateQueries(['opportunities']);
      toast.success('Estágio atualizado!');
    }
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

  const stages = [
    { id: 'proposta_enviada', label: 'Proposta Enviada', icon: Send, color: 'bg-blue-500', textColor: 'text-blue-600' },
    { id: 'em_negociacao', label: 'Em Negociação', icon: TrendingUp, color: 'bg-yellow-500', textColor: 'text-yellow-600' },
    { id: 'ganho', label: 'Ganho', icon: CheckCircle2, color: 'bg-green-500', textColor: 'text-green-600' },
    { id: 'perdido', label: 'Perdido', icon: XCircle, color: 'bg-red-500', textColor: 'text-red-600' }
  ];

  const handleDragEnd = (result) => {
    if (!result.destination) return;
    
    const { draggableId, destination } = result;
    const newStage = destination.droppableId;
    
    updateStageMutation.mutate({ id: draggableId, newStage });
  };

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
    <div className="space-y-6 pb-6">
      <PageHeader 
        title="CRM" 
        subtitle="Funil de vendas e acompanhamento comercial"
      />

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <Card className="border-slate-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">Total Ativo</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.proposta_enviada + stats.em_negociacao}</div>
            <p className="text-xs text-slate-500">{formatCurrency(stats.totalValue)}</p>
          </CardContent>
        </Card>

        {stages.map(stage => {
          const Icon = stage.icon;
          const count = stats[stage.id];
          return (
            <Card key={stage.id} className="border-slate-200">
              <CardHeader className="pb-2">
                <CardTitle className={`text-sm font-medium ${stage.textColor} flex items-center gap-2`}>
                  <Icon className="w-4 h-4" />
                  {stage.label}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{count}</div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Priority Alerts */}
      {priorityOpportunities.length > 0 && (
        <Card className="border-orange-200 bg-orange-50">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-orange-800 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5" />
              🎯 Oportunidades Prioritárias ({priorityOpportunities.length})
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

      {/* Kanban Board */}
      <DragDropContext onDragEnd={handleDragEnd}>
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
          {stages.map(stage => {
            const Icon = stage.icon;
            const stageOpportunities = opportunities.filter(opp => opp.stage === stage.id);
            const stageValue = stageOpportunities.reduce((sum, opp) => sum + (opp.total_value || 0), 0);
            
            return (
              <div key={stage.id} className="flex flex-col">
                <div className={`${stage.color} text-white rounded-t-xl p-3`}>
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <Icon className="w-5 h-5" />
                      <h3 className="font-semibold">{stage.label}</h3>
                    </div>
                    <Badge variant="secondary" className="bg-white/20 text-white border-0">
                      {stageOpportunities.length}
                    </Badge>
                  </div>
                  <p className="text-xs opacity-90">{formatCurrency(stageValue)}</p>
                </div>
                
                <Droppable droppableId={stage.id}>
                  {(provided, snapshot) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.droppableProps}
                      className={`flex-1 bg-slate-50 rounded-b-xl p-3 space-y-3 min-h-[300px] border-2 border-t-0 transition-colors ${
                        snapshot.isDraggingOver ? 'border-blue-400 bg-blue-50' : 'border-slate-200'
                      }`}
                    >
                      {stageOpportunities.map((opp, index) => (
                        <Draggable key={opp.id} draggableId={opp.id} index={index}>
                          {(provided, snapshot) => (
                            <div
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              {...provided.dragHandleProps}
                              className={`bg-white rounded-lg p-3 border border-slate-200 shadow-sm cursor-pointer hover:shadow-md transition-all ${
                                snapshot.isDragging ? 'shadow-xl rotate-2' : ''
                              }`}
                              onClick={() => setSelectedOpportunity(opp)}
                            >
                              <div className="flex items-start justify-between mb-2">
                                <h4 className="font-semibold text-sm text-slate-900 flex-1 line-clamp-1">
                                  {opp.client_name}
                                </h4>
                                {opp.priority_score >= 70 && (
                                  <Badge variant="destructive" className="text-[10px] px-1.5 py-0">
                                    {opp.priority_score}
                                  </Badge>
                                )}
                              </div>
                              
                              <p className="text-xs text-slate-500 mb-2 line-clamp-1">{opp.principal_name}</p>
                              
                              <div className="flex items-center justify-between text-xs">
                                <span className="font-bold text-emerald-600">
                                  {formatCurrency(opp.total_value)}
                                </span>
                                {opp.total_weight > 0 && (
                                  <span className="text-slate-500 flex items-center gap-1">
                                    <Weight className="w-3 h-3" />
                                    {opp.total_weight.toFixed(0)}kg
                                  </span>
                                )}
                              </div>
                              
                              {opp.next_action_date && (
                                <div className="flex items-center gap-1 mt-2 pt-2 border-t border-slate-100">
                                  <Calendar className="w-3 h-3 text-slate-400" />
                                  <span className="text-[10px] text-slate-500">
                                    {new Date(opp.next_action_date).toLocaleDateString('pt-BR')}
                                  </span>
                                </div>
                              )}
                              
                              {opp.days_without_contact >= 5 && (
                                <Badge variant="outline" className="mt-2 text-[10px] border-orange-300 text-orange-600">
                                  {opp.days_without_contact} dias sem contato
                                </Badge>
                              )}
                            </div>
                          )}
                        </Draggable>
                      ))}
                      {provided.placeholder}
                      
                      {stageOpportunities.length === 0 && (
                        <div className="text-center py-8 text-slate-400">
                          <Icon className="w-8 h-8 mx-auto mb-2 opacity-50" />
                          <p className="text-xs">Nenhuma oportunidade</p>
                        </div>
                      )}
                    </div>
                  )}
                </Droppable>
              </div>
            );
          })}
        </div>
      </DragDropContext>

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