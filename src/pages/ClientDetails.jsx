import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { 
  Building2,
  Phone, 
  MessageCircle, 
  Mail,
  MapPin,
  FileText, 
  Edit,
  Calendar,
  TrendingUp,
  Package,
  DollarSign,
  Clock,
  Plus,
  Brain,
  History,
  Target,
  AlertTriangle,
  CheckCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import PageHeader from '@/components/common/PageHeader';
import ClientForm from '@/components/forms/ClientForm';
import PurchasePrediction from '@/components/ai/PurchasePrediction';
import CrossSellSuggestions from '@/components/clients/CrossSellSuggestions';
import ClientAlerts from '@/components/clients/ClientAlerts';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';

export default function ClientDetails() {
  const [clientId, setClientId] = useState(null);
  const [showEditForm, setShowEditForm] = useState(false);
  const [showFollowUpForm, setShowFollowUpForm] = useState(false);
  const [followUpData, setFollowUpData] = useState({
    type: 'call',
    subject: '',
    notes: '',
    outcome: '',
    next_action: '',
    next_action_date: '',
    contact_date: new Date().toISOString().split('T')[0]
  });

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const id = urlParams.get('id');
    setClientId(id);
  }, []);

  const queryClient = useQueryClient();

  const { data: client, isLoading: loadingClient } = useQuery({
    queryKey: ['client', clientId],
    queryFn: async () => {
      if (!clientId) return null;
      const clients = await base44.entities.Client.filter({ id: clientId });
      return clients[0] || null;
    },
    enabled: !!clientId
  });

  const { data: quotes = [] } = useQuery({
    queryKey: ['client-quotes', clientId],
    queryFn: () => clientId 
      ? base44.entities.Quote.filter({ client_id: clientId }, '-created_date', 50)
      : [],
    enabled: !!clientId
  });

  const { data: orders = [] } = useQuery({
    queryKey: ['client-orders', clientId],
    queryFn: () => clientId 
      ? base44.entities.Order.filter({ client_id: clientId }, '-created_date', 50)
      : [],
    enabled: !!clientId
  });

  const { data: followUps = [] } = useQuery({
    queryKey: ['client-followups', clientId],
    queryFn: () => clientId 
      ? base44.entities.FollowUp.filter({ client_id: clientId }, '-created_date', 50)
      : [],
    enabled: !!clientId
  });

  const updateMutation = useMutation({
    mutationFn: (data) => base44.entities.Client.update(clientId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['client', clientId] });
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      setShowEditForm(false);
      toast.success('Cliente atualizado!');
    }
  });

  const createFollowUpMutation = useMutation({
    mutationFn: (data) => base44.entities.FollowUp.create({
      ...data,
      client_id: clientId,
      client_name: client?.trade_name || client?.company_name
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['client-followups', clientId] });
      setShowFollowUpForm(false);
      setFollowUpData({
        type: 'call',
        subject: '',
        notes: '',
        outcome: '',
        next_action: '',
        next_action_date: '',
        contact_date: new Date().toISOString().split('T')[0]
      });
      toast.success('Follow-up registrado!');
    }
  });

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value || 0);
  };

  const daysSinceLastPurchase = client?.last_purchase_date 
    ? Math.floor((new Date() - new Date(client.last_purchase_date)) / (1000 * 60 * 60 * 24))
    : null;

  const getStatusConfig = (status) => {
    switch (status) {
      case 'at_risk':
        return { color: 'bg-red-100 text-red-700', label: 'Em Risco' };
      case 'attention':
        return { color: 'bg-amber-100 text-amber-700', label: 'Atenção' };
      case 'inactive':
        return { color: 'bg-slate-100 text-slate-700', label: 'Inativo' };
      default:
        return { color: 'bg-emerald-100 text-emerald-700', label: 'Ativo' };
    }
  };

  if (loadingClient) {
    return (
      <div className="space-y-6 pb-20 lg:pb-6">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-40 w-full rounded-xl" />
        <Skeleton className="h-60 w-full rounded-xl" />
      </div>
    );
  }

  if (!client) {
    return (
      <div className="text-center py-12">
        <Building2 className="w-12 h-12 text-slate-300 mx-auto mb-3" />
        <p className="text-slate-500">Cliente não encontrado</p>
        <Link to={createPageUrl('Clients')}>
          <Button variant="outline" className="mt-4">Voltar para Clientes</Button>
        </Link>
      </div>
    );
  }

  const status = getStatusConfig(client.status);
  const whatsappLink = client.whatsapp 
    ? `https://wa.me/55${client.whatsapp.replace(/\D/g, '')}`
    : null;

  const totalPurchases = orders.reduce((sum, o) => o.status !== 'cancelled' ? sum + (o.total_value || 0) : sum, 0);

  return (
    <div className="pb-20 lg:pb-6">
      <PageHeader 
        title={client.trade_name || client.company_name}
        subtitle={client.cnpj}
        backTo="Clients"
      >
        <Button variant="outline" onClick={() => setShowEditForm(true)}>
          <Edit className="w-4 h-4 mr-2" />
          Editar
        </Button>
      </PageHeader>

      {/* Client Header Card */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-4 mb-6">
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Main Info */}
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-3">
              <Badge className={status.color}>{status.label}</Badge>
              {client.segment && (
                <Badge variant="outline">{client.segment}</Badge>
              )}
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div>
                <p className="text-xs text-slate-500">Dias s/ compra</p>
                <p className={`text-xl font-bold ${daysSinceLastPurchase > (client.average_purchase_cycle || 30) ? 'text-red-600' : 'text-slate-900'}`}>
                  {daysSinceLastPurchase ?? '-'}
                </p>
              </div>
              <div>
                <p className="text-xs text-slate-500">Ciclo médio</p>
                <p className="text-xl font-bold text-slate-900">{client.average_purchase_cycle || '-'}d</p>
              </div>
              <div>
                <p className="text-xs text-slate-500">Ticket médio</p>
                <p className="text-xl font-bold text-slate-900">{formatCurrency(client.average_ticket)}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500">Índice Oport.</p>
                <div className={`inline-flex items-center justify-center w-10 h-10 rounded-full text-sm font-bold ${
                  (client.opportunity_index || 0) > 70 ? 'bg-emerald-100 text-emerald-700' :
                  (client.opportunity_index || 0) > 40 ? 'bg-amber-100 text-amber-700' :
                  'bg-slate-100 text-slate-700'
                }`}>
                  {client.opportunity_index || 0}
                </div>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex sm:flex-col gap-2">
            <Link to={createPageUrl(`Quotes?clientId=${client.id}`)} className="flex-1 sm:flex-none">
              <Button className="w-full bg-[#1e3a5f] hover:bg-[#2d4a6f]">
                <FileText className="w-4 h-4 mr-2" />
                Novo Orçamento
              </Button>
            </Link>
            <Button variant="outline" onClick={() => setShowFollowUpForm(true)} className="flex-1 sm:flex-none">
              <Plus className="w-4 h-4 mr-2" />
              Follow-up
            </Button>
          </div>
        </div>

        {/* Contact Buttons */}
        <div className="flex gap-2 mt-4 pt-4 border-t border-slate-100">
          {whatsappLink && (
            <a href={whatsappLink} target="_blank" rel="noopener noreferrer" className="flex-1">
              <Button variant="outline" className="w-full text-emerald-600 border-emerald-200 hover:bg-emerald-50">
                <MessageCircle className="w-4 h-4 mr-2" />
                WhatsApp
              </Button>
            </a>
          )}
          {client.phone && (
            <a href={`tel:${client.phone}`} className="flex-1">
              <Button variant="outline" className="w-full text-blue-600 border-blue-200 hover:bg-blue-50">
                <Phone className="w-4 h-4 mr-2" />
                Ligar
              </Button>
            </a>
          )}
          {client.email && (
            <a href={`mailto:${client.email}`} className="flex-1">
              <Button variant="outline" className="w-full">
                <Mail className="w-4 h-4 mr-2" />
                E-mail
              </Button>
            </a>
          )}
        </div>
      </div>

      {/* Alerts */}
      <ClientAlerts client={client} orders={orders} />

      {/* Cross-Sell Suggestions */}
      {orders.length > 0 && (
        <div className="mt-6">
          <CrossSellSuggestions 
            client={client} 
            lastOrder={orders.sort((a, b) => new Date(b.created_date) - new Date(a.created_date))[0]} 
          />
        </div>
      )}

      {/* Tabs */}
      <Tabs defaultValue="ai" className="space-y-4">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="ai" className="text-xs">
            <Brain className="w-3 h-3 mr-1" />
            IA
          </TabsTrigger>
          <TabsTrigger value="history" className="text-xs">Histórico</TabsTrigger>
          <TabsTrigger value="memory" className="text-xs">Memória</TabsTrigger>
          <TabsTrigger value="followups" className="text-xs">Follow-ups</TabsTrigger>
          <TabsTrigger value="info" className="text-xs">Dados</TabsTrigger>
        </TabsList>

        {/* AI Tab */}
        <TabsContent value="ai">
          <PurchasePrediction client={client} orders={orders} />
        </TabsContent>

        {/* History Tab */}
        <TabsContent value="history" className="space-y-4">
          <div className="bg-white rounded-xl p-4 border border-slate-100">
            <h3 className="font-semibold text-slate-900 mb-3">Resumo</h3>
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center p-3 bg-slate-50 rounded-lg">
                <p className="text-2xl font-bold text-slate-900">{orders.length}</p>
                <p className="text-xs text-slate-500">Pedidos</p>
              </div>
              <div className="text-center p-3 bg-slate-50 rounded-lg">
                <p className="text-2xl font-bold text-emerald-600">{formatCurrency(totalPurchases)}</p>
                <p className="text-xs text-slate-500">Total</p>
              </div>
              <div className="text-center p-3 bg-slate-50 rounded-lg">
                <p className="text-2xl font-bold text-slate-900">{quotes.length}</p>
                <p className="text-xs text-slate-500">Orçamentos</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-4 border border-slate-100">
            <h3 className="font-semibold text-slate-900 mb-3">Últimos Pedidos</h3>
            {orders.length > 0 ? (
              <div className="space-y-2">
                {orders.slice(0, 5).map(order => (
                  <div key={order.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                    <div>
                      <p className="font-medium text-sm">{order.order_number || order.id?.slice(-6)}</p>
                      <p className="text-xs text-slate-500">
                        {new Date(order.created_date).toLocaleDateString('pt-BR')}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-emerald-600">{formatCurrency(order.total_value)}</p>
                      <p className="text-xs text-slate-500">{order.items?.length || 0} itens</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center text-slate-400 py-6">Nenhum pedido registrado</p>
            )}
          </div>
        </TabsContent>

        {/* Memory Tab */}
        <TabsContent value="memory" className="space-y-4">
          {/* Relationship Info */}
          {(client.contact_birthday || client.contact_football_team || client.contact_favorite_drink || client.contact_interests || client.personal_notes) && (
            <div className="bg-pink-50 border border-pink-200 rounded-xl p-4 mb-4">
              <div className="flex items-center gap-2 mb-3">
                <History className="w-5 h-5 text-pink-600" />
                <h3 className="font-semibold text-pink-900">Informações de Relacionamento</h3>
              </div>
              <div className="space-y-2 text-sm">
                {client.contact_birthday && (
                  <div>
                    <span className="text-pink-600 font-medium">Aniversário:</span>{' '}
                    <span className="text-pink-800">{new Date(client.contact_birthday).toLocaleDateString('pt-BR')}</span>
                  </div>
                )}
                {client.contact_football_team && (
                  <div>
                    <span className="text-pink-600 font-medium">Time:</span>{' '}
                    <span className="text-pink-800">{client.contact_football_team}</span>
                  </div>
                )}
                {client.contact_favorite_drink && (
                  <div>
                    <span className="text-pink-600 font-medium">Bebida:</span>{' '}
                    <span className="text-pink-800">{client.contact_favorite_drink}</span>
                  </div>
                )}
                {client.contact_interests && (
                  <div>
                    <span className="text-pink-600 font-medium">Interesses:</span>{' '}
                    <span className="text-pink-800">{client.contact_interests}</span>
                  </div>
                )}
                {client.important_dates && (
                  <div>
                    <span className="text-pink-600 font-medium">Datas Importantes:</span>{' '}
                    <span className="text-pink-800">{client.important_dates}</span>
                  </div>
                )}
                {client.personal_notes && (
                  <div className="pt-2 border-t border-pink-200">
                    <span className="text-pink-600 font-medium">Observações:</span>
                    <p className="text-pink-800 mt-1">{client.personal_notes}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <Brain className="w-5 h-5 text-amber-600" />
              <h3 className="font-semibold text-amber-900">Memória Comercial</h3>
            </div>
            <p className="text-sm text-amber-700">
              Informações estratégicas sobre este cliente
            </p>
          </div>

          <div className="space-y-3">
            {client.purchase_preferences && (
              <div className="bg-white rounded-xl p-4 border border-slate-100">
                <p className="text-xs text-slate-500 mb-1">Preferências de Compra</p>
                <p className="text-sm text-slate-700">{client.purchase_preferences}</p>
              </div>
            )}
            {client.price_restrictions && (
              <div className="bg-white rounded-xl p-4 border border-slate-100">
                <p className="text-xs text-slate-500 mb-1">Restrições de Preço</p>
                <p className="text-sm text-slate-700">{client.price_restrictions}</p>
              </div>
            )}
            {client.strategic_notes && (
              <div className="bg-white rounded-xl p-4 border border-slate-100">
                <p className="text-xs text-slate-500 mb-1">Observações Estratégicas</p>
                <p className="text-sm text-slate-700">{client.strategic_notes}</p>
              </div>
            )}
            {client.recurring_objections && (
              <div className="bg-red-50 rounded-xl p-4 border border-red-100">
                <p className="text-xs text-red-600 mb-1">Objeções Recorrentes</p>
                <p className="text-sm text-red-700">{client.recurring_objections}</p>
              </div>
            )}
            {client.special_conditions && (
              <div className="bg-emerald-50 rounded-xl p-4 border border-emerald-100">
                <p className="text-xs text-emerald-600 mb-1">Condições Especiais</p>
                <p className="text-sm text-emerald-700">{client.special_conditions}</p>
              </div>
            )}
            {!client.purchase_preferences && !client.strategic_notes && !client.recurring_objections && (
              <p className="text-center text-slate-400 py-6">Nenhuma informação de memória registrada</p>
            )}
          </div>
        </TabsContent>

        {/* Follow-ups Tab */}
        <TabsContent value="followups" className="space-y-4">
          <div className="bg-white rounded-xl p-4 border border-slate-100">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-slate-900">Histórico de Contatos</h3>
              <Button size="sm" onClick={() => setShowFollowUpForm(true)}>
                <Plus className="w-4 h-4 mr-1" />
                Novo
              </Button>
            </div>
            {followUps.length > 0 ? (
              <div className="space-y-3">
                {followUps.map(fu => (
                  <div key={fu.id} className="p-3 bg-slate-50 rounded-lg">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">{fu.type}</Badge>
                        {fu.outcome && (
                          <Badge className={
                            fu.outcome === 'positive' ? 'bg-emerald-100 text-emerald-700' :
                            fu.outcome === 'negative' ? 'bg-red-100 text-red-700' :
                            'bg-slate-100 text-slate-700'
                          }>
                            {fu.outcome === 'positive' ? 'Positivo' :
                             fu.outcome === 'negative' ? 'Negativo' :
                             fu.outcome === 'no_answer' ? 'Sem resposta' : 'Neutro'}
                          </Badge>
                        )}
                      </div>
                      <span className="text-xs text-slate-500">
                        {new Date(fu.contact_date || fu.created_date).toLocaleDateString('pt-BR')}
                      </span>
                    </div>
                    {fu.subject && <p className="font-medium text-sm mb-1">{fu.subject}</p>}
                    {fu.notes && <p className="text-sm text-slate-600">{fu.notes}</p>}
                    {fu.next_action && (
                      <div className="mt-2 pt-2 border-t border-slate-200 text-xs text-slate-500">
                        Próxima ação: {fu.next_action}
                        {fu.next_action_date && ` - ${new Date(fu.next_action_date).toLocaleDateString('pt-BR')}`}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center text-slate-400 py-6">Nenhum follow-up registrado</p>
            )}
          </div>
        </TabsContent>

        {/* Info Tab */}
        <TabsContent value="info">
          <div className="bg-white rounded-xl p-4 border border-slate-100 space-y-4">
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-slate-500">Razão Social</p>
                <p className="font-medium">{client.company_name}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500">Nome Fantasia</p>
                <p className="font-medium">{client.trade_name || '-'}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500">CNPJ</p>
                <p className="font-medium">{client.cnpj}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500">Inscrição Estadual</p>
                <p className="font-medium">{client.state_registration || '-'}</p>
              </div>
            </div>

            {(client.address || client.city) && (
              <div>
                <p className="text-xs text-slate-500 mb-1">Endereço</p>
                <p className="font-medium flex items-start gap-1">
                  <MapPin className="w-4 h-4 text-slate-400 mt-0.5 flex-shrink-0" />
                  {client.address && <span>{client.address}, </span>}
                  {client.city}/{client.state} {client.zip_code && `- ${client.zip_code}`}
                </p>
              </div>
            )}

            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-slate-500">Contato</p>
                <p className="font-medium">{client.contact_name || '-'}</p>
                {client.contact_role && <p className="text-sm text-slate-500">{client.contact_role}</p>}
              </div>
              <div>
                <p className="text-xs text-slate-500">Segmento</p>
                <p className="font-medium">{client.segment || '-'}</p>
              </div>
            </div>
          </div>
        </TabsContent>
      </Tabs>

      {/* Edit Form Dialog */}
      <Dialog open={showEditForm} onOpenChange={setShowEditForm}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Editar Cliente</DialogTitle>
          </DialogHeader>
          <ClientForm
            client={client}
            onSave={(data) => updateMutation.mutate(data)}
            onCancel={() => setShowEditForm(false)}
            isLoading={updateMutation.isPending}
          />
        </DialogContent>
      </Dialog>

      {/* Follow-up Form Dialog */}
      <Dialog open={showFollowUpForm} onOpenChange={setShowFollowUpForm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Registrar Follow-up</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Tipo de Contato</Label>
                <Select value={followUpData.type} onValueChange={(v) => setFollowUpData({ ...followUpData, type: v })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="call">Ligação</SelectItem>
                    <SelectItem value="visit">Visita</SelectItem>
                    <SelectItem value="whatsapp">WhatsApp</SelectItem>
                    <SelectItem value="email">E-mail</SelectItem>
                    <SelectItem value="meeting">Reunião</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Data do Contato</Label>
                <Input
                  type="date"
                  value={followUpData.contact_date}
                  onChange={(e) => setFollowUpData({ ...followUpData, contact_date: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Assunto</Label>
              <Input
                value={followUpData.subject}
                onChange={(e) => setFollowUpData({ ...followUpData, subject: e.target.value })}
                placeholder="Assunto do contato"
              />
            </div>

            <div className="space-y-2">
              <Label>Anotações</Label>
              <Textarea
                value={followUpData.notes}
                onChange={(e) => setFollowUpData({ ...followUpData, notes: e.target.value })}
                placeholder="Detalhes da conversa..."
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label>Resultado</Label>
              <Select value={followUpData.outcome} onValueChange={(v) => setFollowUpData({ ...followUpData, outcome: v })}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o resultado" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="positive">Positivo</SelectItem>
                  <SelectItem value="neutral">Neutro</SelectItem>
                  <SelectItem value="negative">Negativo</SelectItem>
                  <SelectItem value="no_answer">Sem Resposta</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Próxima Ação</Label>
                <Input
                  value={followUpData.next_action}
                  onChange={(e) => setFollowUpData({ ...followUpData, next_action: e.target.value })}
                  placeholder="O que fazer depois?"
                />
              </div>
              <div className="space-y-2">
                <Label>Data Próxima Ação</Label>
                <Input
                  type="date"
                  value={followUpData.next_action_date}
                  onChange={(e) => setFollowUpData({ ...followUpData, next_action_date: e.target.value })}
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <Button variant="outline" onClick={() => setShowFollowUpForm(false)}>
                Cancelar
              </Button>
              <Button 
                onClick={() => createFollowUpMutation.mutate(followUpData)}
                disabled={createFollowUpMutation.isPending}
                className="bg-[#1e3a5f] hover:bg-[#2d4a6f]"
              >
                {createFollowUpMutation.isPending ? 'Salvando...' : 'Salvar'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}