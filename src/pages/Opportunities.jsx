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
import { calculateCommission, isFixedCommissionRepresentative } from '@/components/utils/commissionCalculator';

const getVTKCommissionRate = (margin) => {
  const vtkTable = [
    { minMargin: 15, maxMargin: 19.99, rate: 0.50 },
    { minMargin: 20, maxMargin: 20.49, rate: 0.60 },
    { minMargin: 20.5, maxMargin: 20.99, rate: 0.67 },
    { minMargin: 21, maxMargin: 21.49, rate: 0.74 },
    { minMargin: 21.5, maxMargin: 21.99, rate: 0.81 },
    { minMargin: 22, maxMargin: 22.49, rate: 0.88 },
    { minMargin: 22.5, maxMargin: 22.99, rate: 0.95 },
    { minMargin: 23, maxMargin: 23.49, rate: 1.02 },
    { minMargin: 23.5, maxMargin: 23.99, rate: 1.09 },
    { minMargin: 24, maxMargin: 24.49, rate: 1.16 },
    { minMargin: 24.5, maxMargin: 24.99, rate: 1.23 },
    { minMargin: 25, maxMargin: 25.49, rate: 1.30 },
    { minMargin: 25.5, maxMargin: 25.99, rate: 1.37 },
    { minMargin: 26, maxMargin: 26.49, rate: 1.44 },
    { minMargin: 26.5, maxMargin: 26.99, rate: 1.51 },
    { minMargin: 27, maxMargin: 27.49, rate: 1.58 },
    { minMargin: 27.5, maxMargin: 27.99, rate: 1.65 },
    { minMargin: 28, maxMargin: 28.49, rate: 1.72 },
    { minMargin: 28.5, maxMargin: 28.99, rate: 1.79 },
    { minMargin: 29, maxMargin: 29.49, rate: 1.86 },
    { minMargin: 29.5, maxMargin: 29.99, rate: 1.93 },
    { minMargin: 30, maxMargin: 30.49, rate: 2.00 },
    { minMargin: 30.5, maxMargin: 30.99, rate: 2.10 },
    { minMargin: 31, maxMargin: 31.49, rate: 2.20 },
    { minMargin: 31.5, maxMargin: 31.99, rate: 2.30 },
    { minMargin: 32, maxMargin: 32.49, rate: 2.40 },
    { minMargin: 32.5, maxMargin: 32.99, rate: 2.50 },
    { minMargin: 33, maxMargin: 33.49, rate: 2.60 },
    { minMargin: 33.5, maxMargin: 33.99, rate: 2.70 },
    { minMargin: 34, maxMargin: 34.49, rate: 2.80 },
    { minMargin: 34.5, maxMargin: 34.99, rate: 2.90 },
    { minMargin: 35, maxMargin: 49.99, rate: 3.00 },
    { minMargin: 50, maxMargin: 64.99, rate: 4.00 },
    { minMargin: 65, maxMargin: Infinity, rate: 5.00 }
  ];

  const bracket = vtkTable.find(b => margin >= b.minMargin && margin <= b.maxMargin);
  return bracket?.rate || 0;
};

export default function Opportunities() {
  const [selectedOpportunity, setSelectedOpportunity] = useState(null);
  const [showEmailPreview, setShowEmailPreview] = useState(false);
  const [emailPreview, setEmailPreview] = useState({ subject: '', body: '', principalEmail: '', opportunityId: '', newStage: '' });
  const [editableEmailBody, setEditableEmailBody] = useState('');
  const [attachedFiles, setAttachedFiles] = useState([]);
  const [showPendingEmails, setShowPendingEmails] = useState(false);
  const queryClient = useQueryClient();

  const { data: pendingEmails = [] } = useQuery({
    queryKey: ['pendingEmails'],
    queryFn: () => base44.entities.PendingEmail.filter({ status: 'pending' }, '-created_date', 100),
    refetchInterval: 60000 // Atualiza a cada 1 minuto
  });

  const { data: opportunities = [], isLoading } = useQuery({
    queryKey: ['opportunities'],
    queryFn: () => base44.entities.Opportunity.list('-priority_score', 500)
  });

  const updateStageMutation = useMutation({
    mutationFn: async ({ id, newStage }) => {
      return base44.entities.Opportunity.update(id, { stage: newStage });
    },
    onSuccess: () => {
      queryClient.refetchQueries({ queryKey: ['opportunities'] });
      queryClient.refetchQueries({ queryKey: ['commissions'] });
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

  const handleDragEnd = async (result) => {
    if (!result.destination) return;
    
    const { draggableId, destination } = result;
    const newStage = destination.droppableId;
    const opportunity = opportunities.find(o => o.id === draggableId);
    
    // Se mudou para GANHO, mostrar preview do email
    if (newStage === 'ganho' && opportunity?.stage !== 'ganho') {
      console.log('🎯 Movendo para GANHO - preparando preview de email');
      try {
        const [principal, client] = await Promise.all([
          base44.entities.Principal.filter({ id: opportunity.principal_id }, '', 1).then(r => r[0]),
          base44.entities.Client.filter({ id: opportunity.client_id }, '', 1).then(r => r[0])
        ]);

        if (principal?.email) {
          const isPrimeiraVenda = !client?.purchase_count || client.purchase_count === 0;
          const representativeName = await base44.auth.me().then(u => u.full_name).catch(() => 'Representante');
          
          const subject = isPrimeiraVenda 
            ? `Pedido Fechado - ${opportunity.client_name} - R$ ${(opportunity.total_value || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })} - Análise de Crédito`
            : `Pedido Fechado - ${opportunity.client_name} - R$ ${(opportunity.total_value || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;

          let body = `Olá ${principal.trade_name || principal.company_name},\n\nFechamos mais um! 🎯\n\n`;
          body += `Cliente: ${opportunity.client_name}\n`;
          body += `Valor: R$ ${(opportunity.total_value || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}\n`;
          body += `Peso: ${(opportunity.total_weight || 0).toFixed(0)} kg\n`;
          body += `Orçamento: ${opportunity.quote_number}\n\n`;
          
          if (isPrimeiraVenda) {
            body += `⚠️ Cliente novo - dados cadastrais, contrato social e notas em anexo para análise de crédito.\n\n`;
          }
          
          body += `Preciso confirmar prazo de entrega. Pode me retornar assim que possível?\n\n`;
          body += `Abraço,\n${representativeName}`;

          setEmailPreview({ subject, body, principalEmail: principal.email, opportunityId: draggableId, newStage });
          setEditableEmailBody(body);
          setShowEmailPreview(true);
          return;
        }
      } catch (error) {
        console.error('Erro ao preparar email:', error);
      }
    }
    
    updateStageMutation.mutate({ id: draggableId, newStage });
  };

  const confirmSendEmail = async () => {
    try {
      console.log('📧 confirmSendEmail iniciado');
      const opportunity = opportunities.find(o => o.id === emailPreview.opportunityId);
      console.log('Oportunidade encontrada:', opportunity);

      // 1. Criar pedido automaticamente
       const quote = await base44.entities.Quote.filter({ id: opportunity.quote_id }, '', 1).then(r => r[0]);

       if (quote) {
         const principal = await base44.entities.Principal.filter({ id: opportunity.principal_id }, '', 1).then(r => r[0]);

         // Calcular comissão baseado no tipo de representado
         let commissionRate = 0;
         let expectedCommission = 0;

         if (isFixedCommissionRepresentative(principal?.trade_name || principal?.company_name)) {
           // Comissão fixa (tabelado)
           const commission = calculateCommission(principal, quote.total_value, quote.items);
           commissionRate = commission.rate;
           expectedCommission = commission.value;
         } else {
           // Comissão VTK ou do representado
           let totalCost = 0;
           let totalSale = 0;

           quote.items?.forEach(item => {
             const weight = item.total_weight || item.quantity || 0;
             if (item.vtk_cost > 0 && item.vtk_margin_pct > 0) {
               totalCost += item.vtk_cost * weight;
               totalSale += item.item_total || 0;
             } else {
               totalCost += (item.cost_per_kg || 0) * weight;
               totalSale += item.item_total || 0;
             }
           });

           const margin = totalSale > 0 && totalCost > 0 ? ((totalSale - totalCost) / totalSale) * 100 : 0;
           commissionRate = margin >= 15 ? getVTKCommissionRate(margin) : (principal?.commission_percentage || 0);
           expectedCommission = (quote.total_value || 0) * (commissionRate / 100);
         }

         const orderNumber = `PED-${Date.now().toString().slice(-6)}`;
         const order = await base44.entities.Order.create({
           order_number: orderNumber,
           quote_id: quote.id,
           client_id: opportunity.client_id,
           client_name: opportunity.client_name,
           principal_id: opportunity.principal_id,
           principal_name: opportunity.principal_name,
           items: quote.items,
           total_value: quote.total_value,
           total_weight: opportunity.total_weight,
           total_icms: quote.total_icms,
           total_ipi: quote.total_ipi,
           payment_terms: quote.payment_terms,
           notes: quote.notes,
           status: 'em_analise',
           commission_rate: commissionRate,
           expected_commission: expectedCommission,
           commission_status: 'pending',
           status_history: [{
             status: 'em_analise',
             date: new Date().toISOString(),
             notes: 'Pedido criado automaticamente ao ganhar oportunidade'
           }]
         });

         // 3. Criar comissão automaticamente
         if (principal && order) {
           try {
             console.log('🎯 Criando comissão:', {
               order_id: order.id,
               principal_id: principal.id,
               invoice_value: quote.total_value,
               commission_rate: commissionRate,
               commission_value: expectedCommission,
               status: 'prevista'
             });

             const commission = await base44.entities.Commission.create({
               order_id: order.id,
               order_number: order.order_number,
               principal_id: principal.id,
               principal_name: principal.trade_name || principal.company_name,
               client_id: opportunity.client_id,
               client_name: opportunity.client_name,
               invoice_value: quote.total_value || 0,
               commission_rate: commissionRate,
               commission_value: expectedCommission,
               status: 'prevista',
               notes: 'Comissão gerada automaticamente ao criar pedido'
             });

             console.log('✅ Comissão criada com sucesso:', commission);
             await new Promise(r => setTimeout(r, 500)); // Aguarda um pouco
             queryClient.invalidateQueries({ queryKey: ['commissions'] });
           } catch (commError) {
             console.error('❌ Erro ao criar comissão:', commError);
           }
         }

        // 3. Atualizar orçamento para convertido
        await base44.entities.Quote.update(quote.id, {
          status: 'convertido',
          approved_date: new Date().toISOString().split('T')[0]
        });
      }

      toast.success('Pedido criado com sucesso! 🎉');
      setShowEmailPreview(false);
      setAttachedFiles([]);

      // 4. Atualizar estágio da oportunidade
      updateStageMutation.mutate({ id: emailPreview.opportunityId, newStage: emailPreview.newStage });
      queryClient.refetchQueries({ queryKey: ['orders'] });
      queryClient.refetchQueries({ queryKey: ['quotes'] });
      queryClient.refetchQueries({ queryKey: ['commissions'] });
    } catch (error) {
      console.error('Erro:', error);
      toast.error('Erro ao processar');
    }
  };

  const handleSendLater = async () => {
    try {
      const opportunity = opportunities.find(o => o.id === emailPreview.opportunityId);
      const now = new Date();
      const oneHourLater = new Date(now.getTime() + 60 * 60 * 1000);

      await base44.entities.PendingEmail.create({
        opportunity_id: emailPreview.opportunityId,
        opportunity_name: opportunity.client_name,
        recipient_email: emailPreview.principalEmail,
        subject: emailPreview.subject,
        body: editableEmailBody,
        scheduled_for: now.toISOString(),
        next_reminder: oneHourLater.toISOString(),
        reminder_count: 0,
        status: 'pending'
      });

      toast.success('Lembrete criado! Você será notificado em 1 hora');
      setShowEmailPreview(false);

      // Atualizar estágio mesmo assim
      updateStageMutation.mutate({ id: emailPreview.opportunityId, newStage: emailPreview.newStage });
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      queryClient.invalidateQueries({ queryKey: ['quotes'] });
      queryClient.invalidateQueries({ queryKey: ['commissions'] });
    } catch (error) {
      console.error('Erro:', error);
      toast.error('Erro ao criar lembrete');
    }
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

  const overdueReminders = pendingEmails.filter(email => {
    const nextReminder = new Date(email.next_reminder);
    return nextReminder <= new Date();
  });

  return (
    <div className="space-y-6 pb-6">
      <PageHeader 
        title="CRM" 
        subtitle="Funil de vendas e acompanhamento comercial"
      >
        {pendingEmails.length > 0 && (
          <Button variant="outline" onClick={() => setShowPendingEmails(true)}>
            <Clock className="w-4 h-4 mr-2" />
            Emails Pendentes ({overdueReminders.length})
          </Button>
        )}
      </PageHeader>

      {/* Pending Emails Alert */}
      {overdueReminders.length > 0 && (
        <div className="bg-orange-50 border border-orange-200 rounded-xl p-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-orange-600 mt-0.5" />
            <div className="flex-1">
              <h3 className="font-semibold text-orange-900">⏰ {overdueReminders.length} email(s) aguardando envio</h3>
              <p className="text-sm text-orange-700 mt-1">
                Você tem emails pendentes para representados. Clique para revisar e enviar.
              </p>
              <Button 
                size="sm" 
                className="mt-3 bg-orange-600 hover:bg-orange-700"
                onClick={() => setShowPendingEmails(true)}
              >
                Ver Pendências
              </Button>
            </div>
          </div>
        </div>
      )}

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

      {/* Email Preview Dialog - Drag to Ganho */}
      {showEmailPreview && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[80vh] overflow-y-auto p-6">
            <h3 className="text-xl font-bold mb-4">📧 Prévia do Email ao Representado</h3>
            
            <div className="space-y-4">
              <div>
                <label className="text-sm text-slate-600 font-medium">Para:</label>
                <p className="font-medium">{emailPreview.principalEmail}</p>
              </div>

              <div>
                <label className="text-sm text-slate-600 font-medium">Assunto:</label>
                <p className="font-medium">{emailPreview.subject}</p>
              </div>

              <div>
                <label className="text-sm text-slate-600 font-medium mb-2 block">Mensagem (editável):</label>
                <textarea
                  value={editableEmailBody}
                  onChange={(e) => setEditableEmailBody(e.target.value)}
                  rows={12}
                  className="w-full p-3 border border-slate-300 rounded-lg font-mono text-sm"
                />
              </div>

              <div>
                <label className="text-sm text-slate-600 font-medium mb-2 block">📎 Documentos para Anexar (se necessário)</label>
                <div className="border-2 border-dashed border-slate-300 rounded-lg p-4 hover:border-slate-400 transition-colors">
                  <input
                    type="file"
                    multiple
                    onChange={(e) => setAttachedFiles(Array.from(e.target.files || []))}
                    className="w-full cursor-pointer"
                  />
                  {attachedFiles.length > 0 && (
                    <div className="mt-2 space-y-1">
                      {attachedFiles.map((file, idx) => (
                        <div key={idx} className="text-xs text-slate-600">✓ {file.name}</div>
                      ))}
                    </div>
                  )}
                </div>
                <p className="text-xs text-slate-500 mt-2">Dados cadastrais, contrato social, notas de crédito, etc.</p>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <p className="text-xs text-blue-800">
                  ℹ️ O email será preparado para você enviar manualmente com os anexos
                </p>
              </div>

              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={() => setShowEmailPreview(false)}
                  className="flex-1"
                >
                  Cancelar
                </Button>
                <Button
                  onClick={() => {
                    const emailContent = `Para: ${emailPreview.principalEmail}\nAssunto: ${emailPreview.subject}\n\n${editableEmailBody}`;
                    navigator.clipboard.writeText(emailContent);
                    toast.success('Email copiado! Cole no Outlook');
                  }}
                  className="flex-1 bg-blue-600 hover:bg-blue-700"
                >
                  <Mail className="w-4 h-4 mr-2" />
                  Copiar para Outlook
                </Button>
                <Button
                  onClick={confirmSendEmail}
                  className="flex-1 bg-green-600 hover:bg-green-700"
                >
                  <CheckCircle2 className="w-4 h-4 mr-2" />
                  Criar Pedido
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Pending Emails Dialog */}
      {showPendingEmails && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-3xl w-full max-h-[80vh] overflow-y-auto p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold">📧 Emails Pendentes de Envio</h3>
              <Button variant="ghost" size="icon" onClick={() => setShowPendingEmails(false)}>
                <XCircle className="w-5 h-5" />
              </Button>
            </div>

            <div className="space-y-3">
              {pendingEmails.map(email => {
                const isOverdue = new Date(email.next_reminder) <= new Date();
                return (
                  <div key={email.id} className={`border rounded-lg p-4 ${isOverdue ? 'border-orange-300 bg-orange-50' : 'border-slate-200'}`}>
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <h4 className="font-semibold text-slate-900">{email.opportunity_name}</h4>
                        <p className="text-sm text-slate-600">{email.recipient_email}</p>
                        <p className="text-xs text-slate-500 mt-1">
                          {email.reminder_count} lembrete(s) • 
                          Próximo: {new Date(email.next_reminder).toLocaleString('pt-BR')}
                        </p>
                      </div>
                      {isOverdue && (
                        <Badge className="bg-orange-600 text-white">Atrasado</Badge>
                      )}
                    </div>

                    <div className="flex gap-2 mt-3">
                      <Button
                        size="sm"
                        className="bg-green-600 hover:bg-green-700"
                        onClick={async () => {
                          try {
                            await base44.integrations.Core.SendEmail({
                              to: email.recipient_email,
                              subject: email.subject,
                              body: email.body
                            });

                            const opportunity = opportunities.find(o => o.id === email.opportunity_id);
                             const quote = await base44.entities.Quote.filter({ id: opportunity?.quote_id }, '', 1).then(r => r[0]);

                             if (quote) {
                                const principal = await base44.entities.Principal.filter({ id: opportunity.principal_id }, '', 1).then(r => r[0]);

                                // Calcular comissão baseado no tipo de representado
                                let commissionRate = 0;
                                let expectedCommission = 0;

                                if (isFixedCommissionRepresentative(principal?.trade_name || principal?.company_name)) {
                                  const commission = calculateCommission(principal, quote.total_value, quote.items);
                                  commissionRate = commission.rate;
                                  expectedCommission = commission.value;
                                } else {
                                  let totalCost = 0;
                                  let totalSale = 0;

                                  quote.items?.forEach(item => {
                                    const weight = item.total_weight || item.quantity || 0;
                                    if (item.vtk_cost > 0 && item.vtk_margin_pct > 0) {
                                      totalCost += item.vtk_cost * weight;
                                      totalSale += item.item_total || 0;
                                    } else {
                                      totalCost += (item.cost_per_kg || 0) * weight;
                                      totalSale += item.item_total || 0;
                                    }
                                  });

                                  const margin = totalSale > 0 && totalCost > 0 ? ((totalSale - totalCost) / totalSale) * 100 : 0;
                                  commissionRate = margin >= 15 ? getVTKCommissionRate(margin) : (principal?.commission_percentage || 0);
                                  expectedCommission = (quote.total_value || 0) * (commissionRate / 100);
                                }

                               const orderNumber = `PED-${Date.now().toString().slice(-6)}`;
                               const newOrder = await base44.entities.Order.create({
                                 order_number: orderNumber,
                                 quote_id: quote.id,
                                 client_id: opportunity.client_id,
                                 client_name: opportunity.client_name,
                                 principal_id: opportunity.principal_id,
                                 principal_name: opportunity.principal_name,
                                 items: quote.items,
                                 total_value: quote.total_value,
                                 total_weight: opportunity.total_weight,
                                 total_icms: quote.total_icms,
                                 total_ipi: quote.total_ipi,
                                 payment_terms: quote.payment_terms,
                                 notes: quote.notes,
                                 status: 'em_analise',
                                 commission_rate: commissionRate,
                                 expected_commission: expectedCommission,
                                 commission_status: 'pending',
                                 status_history: [{
                                   status: 'em_analise',
                                   date: new Date().toISOString(),
                                   notes: 'Pedido criado ao enviar email ao representado'
                                 }]
                               });

                               // Criar comissão automaticamente
                               if (principal && newOrder) {
                                 await base44.entities.Commission.create({
                                   order_id: newOrder.id,
                                   order_number: newOrder.order_number,
                                   principal_id: principal.id,
                                   principal_name: principal.trade_name || principal.company_name,
                                   client_id: opportunity.client_id,
                                   client_name: opportunity.client_name,
                                   invoice_value: quote.total_value || 0,
                                   commission_rate: commissionRate,
                                   commission_value: expectedCommission,
                                   status: 'prevista'
                                 });
                                 queryClient.invalidateQueries({ queryKey: ['commissions'] });
                               }

                              await base44.entities.Quote.update(quote.id, {
                                status: 'convertido',
                                approved_date: new Date().toISOString().split('T')[0]
                              });
                            }

                            await base44.entities.PendingEmail.update(email.id, { status: 'sent' });
                            toast.success('Email enviado e pedido criado!');
                            queryClient.refetchQueries({ queryKey: ['pendingEmails'] });
                            queryClient.refetchQueries({ queryKey: ['orders'] });
                            queryClient.refetchQueries({ queryKey: ['commissions'] });
                          } catch (error) {
                            toast.error('Erro ao enviar email');
                          }
                        }}
                      >
                        <Mail className="w-4 h-4 mr-1" />
                        Enviar Agora
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={async () => {
                          const nextReminder = new Date(new Date().getTime() + 60 * 60 * 1000);
                          await base44.entities.PendingEmail.update(email.id, {
                            next_reminder: nextReminder.toISOString(),
                            reminder_count: (email.reminder_count || 0) + 1
                          });
                          toast.success('Lembrete adiado por 1 hora');
                          queryClient.invalidateQueries(['pendingEmails']);
                        }}
                      >
                        <Clock className="w-4 h-4 mr-1" />
                        +1 hora
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={async () => {
                          await base44.entities.PendingEmail.update(email.id, { status: 'cancelled' });
                          toast.success('Email cancelado');
                          queryClient.invalidateQueries(['pendingEmails']);
                        }}
                      >
                        Cancelar
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}