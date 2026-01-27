import React, { useState, useMemo } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSearchParams } from 'react-router-dom';
import PageHeader from '@/components/common/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  MessageCircle, 
  Phone, 
  Mail, 
  FileText,
  TrendingUp,
  Clock,
  DollarSign,
  Package,
  CheckCircle2,
  AlertTriangle,
  Calendar
} from 'lucide-react';
import { toast } from 'sonner';
import { processClientAlerts, replaceTemplateVariables } from '@/components/utils/alertEngine';

export default function ClientAlertDetail() {
  const [searchParams] = useSearchParams();
  let clientId = searchParams.get('clientId');
  const alertType = searchParams.get('alertType') || searchParams.get('type');
  const queryClient = useQueryClient();

  const [selectedTemplate, setSelectedTemplate] = useState('');
  const [customMessage, setCustomMessage] = useState('');
  const [actionNotes, setActionNotes] = useState('');
  const [classification, setClassification] = useState('');
  const [classificationNotes, setClassificationNotes] = useState('');
  const [nextFollowUp, setNextFollowUp] = useState('');

  const { data: client } = useQuery({
    queryKey: ['client', clientId],
    queryFn: () => base44.entities.Client.filter({ id: clientId }, '', 1).then(r => r[0]),
    enabled: !!clientId
  });

  const { data: orders = [] } = useQuery({
    queryKey: ['orders'],
    queryFn: () => base44.entities.Order.list('-created_date', 1000)
  });

  const { data: templates = [] } = useQuery({
    queryKey: ['templates', alertType],
    queryFn: () => base44.entities.MessageTemplate.filter({ alert_type: alertType, is_active: true })
  });

  const { data: activities = [] } = useQuery({
    queryKey: ['activities', clientId],
    queryFn: () => base44.entities.Activity.filter({ customer_id: clientId }, '-created_date', 50)
  });

  const clientData = useMemo(() => {
    if (!client) return null;
    const processed = processClientAlerts([client], orders);
    return processed[0];
  }, [client, orders]);

  const clientOrders = useMemo(() => {
    return orders
      .filter(o => o.client_id === clientId)
      .sort((a, b) => new Date(b.created_date) - new Date(a.created_date))
      .slice(0, 5);
  }, [orders, clientId]);

  const createActivityMutation = useMutation({
    mutationFn: (data) => base44.entities.Activity.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['activities']);
      toast.success('Atividade registrada!');
    }
  });

  const handleAction = async (actionType, channel = null) => {
    const templateData = {
      contactName: client.contact_name,
      companyName: client.trade_name || client.company_name,
      days: clientData?.daysSince,
      cycle: clientData?.avgCycle,
      productName: clientData?.mostPurchased?.name,
      value: clientData?.avgTicket?.toFixed(0),
      salesPerson: 'Representante'
    };

    let message = customMessage;
    if (selectedTemplate) {
      const template = templates.find(t => t.id === selectedTemplate);
      message = replaceTemplateVariables(template.body, templateData);
    }

    // Registrar atividade
    await createActivityMutation.mutateAsync({
      customer_id: clientId,
      customer_name: client.trade_name || client.company_name,
      alert_type: alertType,
      action_type: actionType,
      template_id: selectedTemplate || null,
      notes: actionNotes || message,
      status: 'in_progress'
    });

    // Executar ação
    if (actionType === 'WHATSAPP') {
      window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, '_blank');
    } else if (actionType === 'EMAIL' && channel === 'outlook') {
      const subject = templates.find(t => t.id === selectedTemplate)?.subject || 'Contato';
      window.location.href = `mailto:${client.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(message)}`;
    } else if (actionType === 'QUOTE') {
      window.location.href = `/Quotes?clientId=${clientId}`;
    }

    setCustomMessage('');
    setActionNotes('');
  };

  const handleClassify = async () => {
    if (!classification) {
      toast.error('Selecione uma classificação');
      return;
    }

    await createActivityMutation.mutateAsync({
      customer_id: clientId,
      customer_name: client.trade_name || client.company_name,
      alert_type: alertType,
      action_type: 'CLASSIFY',
      classification,
      classification_notes: classificationNotes,
      status: 'resolved',
      notes: `Classificado como: ${classification}`
    });

    setClassification('');
    setClassificationNotes('');
  };

  const handleResolve = async () => {
    await createActivityMutation.mutateAsync({
      customer_id: clientId,
      customer_name: client.trade_name || client.company_name,
      alert_type: alertType,
      action_type: 'RESOLVED',
      notes: actionNotes,
      status: 'resolved'
    });

    toast.success('Alerta resolvido!');
    window.history.back();
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value || 0);
  };

  if (!client || !clientData) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#1DB954]"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-20 lg:pb-6">
      <PageHeader 
        title={client.trade_name || client.company_name}
        subtitle={`Alerta: ${alertType === 'RISK' ? 'Em Risco' : alertType === 'ATTENTION' ? 'Requer Atenção' : 'Inativo'}`}
        backTo={`AlertList?type=${alertType}`}
      />

      <div className="grid lg:grid-cols-3 gap-6">
        {/* BLOCO A - Resumo */}
        <div className="lg:col-span-2 space-y-6">
          {/* Métricas Principais */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5" />
                Resumo do Cliente
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <Label className="text-slate-500 text-xs">Última Compra</Label>
                  <p className="font-bold text-2xl">{clientData.daysSince}</p>
                  <p className="text-xs text-slate-500">dias atrás</p>
                </div>
                <div>
                  <Label className="text-slate-500 text-xs">Ciclo Médio</Label>
                  <p className="font-bold text-2xl">{clientData.avgCycle}</p>
                  <p className="text-xs text-slate-500">dias</p>
                </div>
                <div>
                  <Label className="text-slate-500 text-xs">Atraso</Label>
                  <p className={`font-bold text-2xl ${clientData.delay > 0 ? 'text-red-600' : 'text-green-600'}`}>
                    {clientData.delay > 0 ? `+${clientData.delay}` : '0'}
                  </p>
                  <p className="text-xs text-slate-500">dias</p>
                </div>
                <div>
                  <Label className="text-slate-500 text-xs">Ticket Médio</Label>
                  <p className="font-bold text-lg">{formatCurrency(clientData.avgTicket)}</p>
                </div>
              </div>

              {clientData.mostPurchased && (
                <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                  <div className="flex items-center gap-2 text-sm">
                    <Package className="w-4 h-4 text-blue-600" />
                    <span className="font-medium text-blue-900">Produto principal:</span>
                    <span className="text-blue-700">{clientData.mostPurchased.name}</span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Histórico de Compras */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="w-5 h-5" />
                Últimas 5 Compras
              </CardTitle>
            </CardHeader>
            <CardContent>
              {clientOrders.length > 0 ? (
                <div className="space-y-2">
                  {clientOrders.map((order) => (
                    <div key={order.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                      <div>
                        <p className="font-medium text-sm">{order.order_number}</p>
                        <p className="text-xs text-slate-500">
                          {new Date(order.created_date).toLocaleDateString('pt-BR')}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-emerald-600">{formatCurrency(order.total_value)}</p>
                        <Badge variant="outline" className="text-xs">{order.status}</Badge>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center text-slate-500 py-8">Nenhuma compra registrada</p>
              )}
            </CardContent>
          </Card>

          {/* Histórico de Atividades */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5" />
                Histórico de Atividades
              </CardTitle>
            </CardHeader>
            <CardContent>
              {activities.length > 0 ? (
                <div className="space-y-2">
                  {activities.map((activity) => (
                    <div key={activity.id} className="flex gap-3 p-3 bg-slate-50 rounded-lg">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <Badge variant="outline" className="text-xs">{activity.action_type}</Badge>
                          <span className="text-xs text-slate-500">
                            {new Date(activity.created_date).toLocaleString('pt-BR')}
                          </span>
                        </div>
                        <p className="text-sm text-slate-700">{activity.notes}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center text-slate-500 py-8">Nenhuma atividade registrada</p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* BLOCO B - Próximo Passo */}
        <div className="space-y-6">
          <Card className="border-2 border-[#1DB954]">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-[#1DB954]" />
                Próximo Passo
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="message">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="message">Mensagem</TabsTrigger>
                  <TabsTrigger value="actions">Ações</TabsTrigger>
                </TabsList>

                <TabsContent value="message" className="space-y-4">
                  {/* Templates */}
                  {templates.length > 0 && (
                    <div>
                      <Label>Template</Label>
                      <Select value={selectedTemplate} onValueChange={(val) => {
                        setSelectedTemplate(val);
                        const template = templates.find(t => t.id === val);
                        if (template) {
                          const data = {
                            contactName: client.contact_name,
                            companyName: client.trade_name || client.company_name,
                            days: clientData.daysSince,
                            cycle: clientData.avgCycle,
                            productName: clientData.mostPurchased?.name,
                            value: clientData.avgTicket?.toFixed(0),
                            salesPerson: 'Representante'
                          };
                          setCustomMessage(replaceTemplateVariables(template.body, data));
                        }
                      }}>
                        <SelectTrigger>
                          <SelectValue placeholder="Escolha um template" />
                        </SelectTrigger>
                        <SelectContent>
                          {templates.map(t => (
                            <SelectItem key={t.id} value={t.id}>
                              {t.name} ({t.channel})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  {/* Mensagem Customizada */}
                  <div>
                    <Label>Mensagem (editável)</Label>
                    <Textarea
                      value={customMessage}
                      onChange={(e) => setCustomMessage(e.target.value)}
                      rows={6}
                      placeholder="Digite sua mensagem..."
                    />
                  </div>

                  <div>
                    <Label>Observações internas</Label>
                    <Textarea
                      value={actionNotes}
                      onChange={(e) => setActionNotes(e.target.value)}
                      rows={2}
                      placeholder="Notas sobre esta ação..."
                    />
                  </div>

                  {/* Botões de Envio */}
                  <div className="space-y-2">
                    <Button
                      className="w-full bg-green-600 hover:bg-green-700"
                      onClick={() => handleAction('WHATSAPP')}
                      disabled={!customMessage}
                    >
                      <MessageCircle className="w-4 h-4 mr-2" />
                      Enviar WhatsApp
                    </Button>
                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={() => handleAction('EMAIL', 'outlook')}
                      disabled={!customMessage}
                    >
                      <Mail className="w-4 h-4 mr-2" />
                      Abrir no Outlook
                    </Button>
                  </div>
                </TabsContent>

                <TabsContent value="actions" className="space-y-4">
                  {/* Ações Rápidas */}
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => handleAction('QUOTE')}
                  >
                    <FileText className="w-4 h-4 mr-2" />
                    Gerar Orçamento
                  </Button>

                  {alertType === 'INACTIVE' && (
                    <>
                      <div className="border-t pt-4 mt-4">
                        <Label className="mb-2 block">Classificar Cliente</Label>
                        <Select value={classification} onValueChange={setClassification}>
                          <SelectTrigger>
                            <SelectValue placeholder="Motivo da inatividade" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="outro_fornecedor">Comprando com outro fornecedor</SelectItem>
                            <SelectItem value="projeto_parado">Projeto parado</SelectItem>
                            <SelectItem value="problema_preco">Problema de preço</SelectItem>
                            <SelectItem value="problema_prazo">Problema de prazo</SelectItem>
                            <SelectItem value="problema_atendimento">Problema de atendimento</SelectItem>
                            <SelectItem value="outro">Outro</SelectItem>
                          </SelectContent>
                        </Select>

                        <Textarea
                          value={classificationNotes}
                          onChange={(e) => setClassificationNotes(e.target.value)}
                          placeholder="Detalhes adicionais..."
                          className="mt-2"
                          rows={3}
                        />

                        <Button
                          className="w-full mt-2"
                          onClick={handleClassify}
                          disabled={!classification}
                        >
                          Salvar Classificação
                        </Button>
                      </div>
                    </>
                  )}

                  {/* Agendar Follow-up */}
                  <div className="border-t pt-4">
                    <Label>Próximo Follow-up</Label>
                    <Input
                      type="date"
                      value={nextFollowUp}
                      onChange={(e) => setNextFollowUp(e.target.value)}
                      className="mt-2"
                    />
                    <Button
                      variant="outline"
                      className="w-full mt-2"
                      onClick={async () => {
                        await createActivityMutation.mutateAsync({
                          customer_id: clientId,
                          customer_name: client.trade_name || client.company_name,
                          alert_type: alertType,
                          action_type: 'REMINDER',
                          next_follow_up: nextFollowUp,
                          status: 'pending'
                        });
                        setNextFollowUp('');
                      }}
                      disabled={!nextFollowUp}
                    >
                      <Calendar className="w-4 h-4 mr-2" />
                      Agendar
                    </Button>
                  </div>

                  {/* Marcar como Resolvido */}
                  <Button
                    className="w-full bg-emerald-600 hover:bg-emerald-700"
                    onClick={handleResolve}
                  >
                    <CheckCircle2 className="w-4 h-4 mr-2" />
                    Marcar como Resolvido
                  </Button>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}