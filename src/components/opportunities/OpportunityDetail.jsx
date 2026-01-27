import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  MessageCircle, 
  Phone, 
  Mail, 
  Target,
  TrendingUp,
  CheckCircle2,
  XCircle,
  Calendar,
  FileText,
  Clock
} from 'lucide-react';
import { toast } from 'sonner';
import LossReasonModal from './LossReasonModal';

export default function OpportunityDetail({ opportunity, onClose, onUpdate }) {
  const [activeTab, setActiveTab] = useState('overview');
  const [contactNote, setContactNote] = useState('');
  const [nextActionDate, setNextActionDate] = useState('');
  const [nextActionType, setNextActionType] = useState('whatsapp');
  const [newStage, setNewStage] = useState(opportunity.stage);
  const [showEmailPreview, setShowEmailPreview] = useState(false);
  const [emailPreview, setEmailPreview] = useState({ subject: '', body: '' });
  const [editableEmailBody, setEditableEmailBody] = useState('');
  const [showLossModal, setShowLossModal] = useState(false);
  const [pendingStageChange, setPendingStageChange] = useState(null);

  const queryClient = useQueryClient();

  const updateOpportunityMutation = useMutation({
    mutationFn: (data) => base44.entities.Opportunity.update(opportunity.id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['opportunities']);
      toast.success('Oportunidade atualizada!');
      onUpdate();
    }
  });

  const createLostDealMutation = useMutation({
    mutationFn: (data) => base44.entities.LostDeal.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['opportunities']);
      toast.success('Perda registrada e analisada!');
    }
  });

  const handleAddContact = () => {
    if (!contactNote.trim()) {
      toast.error('Adicione uma nota sobre o contato');
      return;
    }

    const timeline = opportunity.timeline || [];
    timeline.push({
      date: new Date().toISOString(),
      type: 'contact',
      description: contactNote,
      user: 'user'
    });

    updateOpportunityMutation.mutate({
      timeline,
      last_contact_date: new Date().toISOString().split('T')[0],
      days_without_contact: 0,
      next_action_date: nextActionDate || null,
      next_action_type: nextActionType
    });

    setContactNote('');
    setNextActionDate('');
  };

  const handleStageChange = async () => {
    // Se mudou para PERDIDO, mostrar modal obrigatório
    if (newStage === 'perdido' && opportunity.stage !== 'perdido') {
      setPendingStageChange('perdido');
      setShowLossModal(true);
      return;
    }

    // Se mudou para GANHO, mostrar preview do email
    if (newStage === 'ganho' && opportunity.stage !== 'ganho') {
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

          setEmailPreview({ subject, body, principalEmail: principal.email });
          setEditableEmailBody(body);
          setShowEmailPreview(true);
          return;
        }
      } catch (error) {
        console.error('Erro ao preparar email:', error);
      }
    }

    // Continuar com atualização normal
    const timeline = opportunity.timeline || [];
    timeline.push({
      date: new Date().toISOString(),
      type: 'stage_change',
      description: `Mudou para: ${stages[newStage].label}${newStage === 'perdido' ? ` - ${lossReason}` : ''}`,
      user: 'user'
    });

    updateOpportunityMutation.mutate({
      stage: newStage,
      timeline,
      loss_reason: newStage === 'perdido' ? lossReason : null
    });
  };

  const confirmSendEmail = async () => {
    try {
      // 1. Enviar email ao representado
      await base44.integrations.Core.SendEmail({
        to: emailPreview.principalEmail,
        subject: emailPreview.subject,
        body: editableEmailBody
      });

      // 2. Criar pedido automaticamente
      const quote = await base44.entities.Quote.filter({ id: opportunity.quote_id }, '', 1).then(r => r[0]);
      const principal = await base44.entities.Principal.filter({ id: opportunity.principal_id }, '', 1).then(r => r[0]);
      
      if (quote && principal) {
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
          commission_rate: 5,
          expected_commission: (quote.total_value || 0) * 0.05,
          status_history: [{
            status: 'em_analise',
            date: new Date().toISOString(),
            notes: 'Pedido criado automaticamente ao ganhar oportunidade'
          }]
        });

        // 3. Criar comissão automaticamente
        try {
          await base44.entities.Commission.create({
            order_id: order.id,
            order_number: order.order_number,
            principal_id: principal.id,
            principal_name: principal.trade_name || principal.company_name,
            client_id: opportunity.client_id,
            client_name: opportunity.client_name,
            invoice_value: quote.total_value || 0,
            commission_rate: 5,
            commission_value: (quote.total_value || 0) * 0.05,
            status: 'prevista',
            notes: 'Comissão gerada automaticamente ao criar pedido'
          });
        } catch (commError) {
          console.error('Erro ao criar comissão:', commError);
        }

        // 4. Atualizar orçamento para convertido
        await base44.entities.Quote.update(quote.id, {
          status: 'convertido',
          approved_date: new Date().toISOString().split('T')[0]
        });
      }

      toast.success('Email enviado e pedido criado!');
      setShowEmailPreview(false);

      // 5. Atualizar estágio
      const timeline = opportunity.timeline || [];
      timeline.push({
        date: new Date().toISOString(),
        type: 'stage_change',
        description: `Mudou para: Ganho`,
        user: 'user'
      });

      updateOpportunityMutation.mutate({
        stage: 'ganho',
        timeline
      });
    } catch (error) {
      console.error('Erro:', error);
      toast.error('Erro ao processar');
    }
  };

  const handleWhatsApp = () => {
    const message = `Olá! Referente ao orçamento ${opportunity.quote_number} no valor de ${formatCurrency(opportunity.total_value)}. Gostaria de alinhar os próximos passos.`;
    window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, '_blank');
  };

  const stages = {
    proposta_enviada: { label: 'Proposta Enviada', icon: Target },
    em_negociacao: { label: 'Em Negociação', icon: TrendingUp },
    ganho: { label: 'Ganho', icon: CheckCircle2 },
    perdido: { label: 'Perdido', icon: XCircle }
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value || 0);
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold">{opportunity.client_name}</h2>
              <p className="text-sm text-slate-600">{opportunity.principal_name}</p>
            </div>
            <Badge className="text-base">
              {formatCurrency(opportunity.total_value)}
            </Badge>
          </DialogTitle>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="w-full">
            <TabsTrigger value="overview">Visão Geral</TabsTrigger>
            <TabsTrigger value="contact">Contatar</TabsTrigger>
            <TabsTrigger value="stage">Alterar Estágio</TabsTrigger>
            <TabsTrigger value="timeline">Histórico</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-slate-600">Orçamento</Label>
                <p className="font-mono font-bold">{opportunity.quote_number}</p>
              </div>
              <div>
                <Label className="text-slate-600">Estágio</Label>
                <p className="font-semibold">{stages[opportunity.stage].label}</p>
              </div>
              <div>
                <Label className="text-slate-600">Valor</Label>
                <p className="font-bold text-emerald-600">{formatCurrency(opportunity.total_value)}</p>
              </div>
              <div>
                <Label className="text-slate-600">Peso Total</Label>
                <p className="font-semibold">{opportunity.total_weight?.toFixed(0)} kg</p>
              </div>
              <div>
                <Label className="text-slate-600">Último Contato</Label>
                <p className="font-semibold">
                  {opportunity.last_contact_date 
                    ? new Date(opportunity.last_contact_date).toLocaleDateString('pt-BR')
                    : 'Nunca'}
                </p>
              </div>
              <div>
                <Label className="text-slate-600">Dias sem Contato</Label>
                <p className="font-semibold text-orange-600">
                  {opportunity.days_without_contact || 0} dias
                </p>
              </div>
              <div>
                <Label className="text-slate-600">Próxima Ação</Label>
                <p className="font-semibold">
                  {opportunity.next_action_date 
                    ? new Date(opportunity.next_action_date).toLocaleDateString('pt-BR')
                    : 'Não definida'}
                </p>
              </div>
              <div>
                <Label className="text-slate-600">Score de Prioridade</Label>
                <p className="font-bold text-lg">{opportunity.priority_score || 0}/100</p>
              </div>
            </div>

            {opportunity.notes && (
              <div>
                <Label className="text-slate-600">Observações</Label>
                <p className="text-sm mt-1">{opportunity.notes}</p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="contact" className="space-y-4">
            <div className="flex gap-2 mb-4">
              <Button onClick={handleWhatsApp} className="flex-1 bg-green-600 hover:bg-green-700">
                <MessageCircle className="w-4 h-4 mr-2" />
                WhatsApp
              </Button>
              <Button variant="outline" className="flex-1">
                <Phone className="w-4 h-4 mr-2" />
                Ligar
              </Button>
              <Button variant="outline" className="flex-1">
                <Mail className="w-4 h-4 mr-2" />
                E-mail
              </Button>
            </div>

            <div className="space-y-4">
              <div>
                <Label>Registrar Contato</Label>
                <Textarea
                  value={contactNote}
                  onChange={(e) => setContactNote(e.target.value)}
                  placeholder="Descreva o que foi discutido..."
                  rows={4}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Próxima Ação</Label>
                  <Input
                    type="date"
                    value={nextActionDate}
                    onChange={(e) => setNextActionDate(e.target.value)}
                  />
                </div>
                <div>
                  <Label>Tipo</Label>
                  <Select value={nextActionType} onValueChange={setNextActionType}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="whatsapp">WhatsApp</SelectItem>
                      <SelectItem value="call">Ligação</SelectItem>
                      <SelectItem value="email">E-mail</SelectItem>
                      <SelectItem value="visit">Visita</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <Button onClick={handleAddContact} className="w-full">
                Registrar Contato
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="stage" className="space-y-4">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
              <p className="text-xs text-blue-800">
                💡 Você pode mover a oportunidade para qualquer estágio, inclusive voltar para etapas anteriores se necessário.
              </p>
            </div>
            
            <div>
              <Label>Novo Estágio</Label>
              <Select value={newStage} onValueChange={setNewStage}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="proposta_enviada">⬅️ Proposta Enviada</SelectItem>
                  <SelectItem value="em_negociacao">🔄 Em Negociação</SelectItem>
                  <SelectItem value="ganho">✅ Ganho</SelectItem>
                  <SelectItem value="perdido">❌ Perdido</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {newStage === 'perdido' && (
              <div>
                <Label>Motivo da Perda</Label>
                <Textarea
                  value={lossReason}
                  onChange={(e) => setLossReason(e.target.value)}
                  placeholder="Preço, prazo, concorrente, etc..."
                  rows={3}
                />
              </div>
            )}

            <Button 
              onClick={handleStageChange} 
              className="w-full"
              disabled={newStage === opportunity.stage}
            >
              Alterar Estágio
            </Button>
          </TabsContent>

          <TabsContent value="timeline" className="space-y-3">
            {opportunity.timeline && opportunity.timeline.length > 0 ? (
              opportunity.timeline.slice().reverse().map((event, index) => (
                <div key={index} className="flex gap-3 p-3 bg-slate-50 rounded-lg">
                  <div className="flex flex-col items-center">
                    <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center">
                      {event.type === 'contact' ? <Phone className="w-4 h-4" /> : <FileText className="w-4 h-4" />}
                    </div>
                    {index < opportunity.timeline.length - 1 && (
                      <div className="w-0.5 h-full bg-slate-200 mt-2"></div>
                    )}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-semibold">{event.description}</p>
                    <p className="text-xs text-slate-500">
                      {new Date(event.date).toLocaleString('pt-BR')}
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-center text-slate-500 py-8">Nenhum evento registrado</p>
            )}
          </TabsContent>
        </Tabs>

        {/* Email Preview Dialog */}
        {showEmailPreview && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl max-w-2xl w-full max-h-[80vh] overflow-y-auto p-6">
              <h3 className="text-xl font-bold mb-4">📧 Prévia do Email ao Representado</h3>
              
              <div className="space-y-4">
                <div>
                  <Label className="text-slate-600">Para:</Label>
                  <p className="font-medium">{emailPreview.principalEmail}</p>
                </div>

                <div>
                  <Label className="text-slate-600">Assunto:</Label>
                  <p className="font-medium">{emailPreview.subject}</p>
                </div>

                <div>
                  <Label className="text-slate-600">Mensagem (editável):</Label>
                  <Textarea
                    value={editableEmailBody}
                    onChange={(e) => setEditableEmailBody(e.target.value)}
                    rows={12}
                    className="mt-2 font-mono text-sm"
                  />
                </div>

                <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                  <p className="text-xs text-amber-800">
                    📎 Lembre-se de anexar os documentos do cliente ao email (dados cadastrais, contrato social, notas)
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
                    onClick={confirmSendEmail}
                    className="flex-1 bg-green-600 hover:bg-green-700"
                  >
                    <Mail className="w-4 h-4 mr-2" />
                    Enviar Email
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}