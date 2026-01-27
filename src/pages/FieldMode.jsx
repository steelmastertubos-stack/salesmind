import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { 
  Search, 
  MapPin,
  Phone,
  MessageCircle,
  FileText,
  ChevronRight,
  Calendar,
  TrendingUp,
  Zap,
  Star,
  Mail
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { format } from 'date-fns';

export default function FieldMode() {
  const [search, setSearch] = useState('');
  const [showContactDialog, setShowContactDialog] = useState(false);
  const [selectedClient, setSelectedClient] = useState(null);
  const [contactForm, setContactForm] = useState({
    notes: '',
    next_action_date: format(new Date(), 'yyyy-MM-dd'),
    next_action_type: 'whatsapp',
    create_task: false
  });
  
  const queryClient = useQueryClient();

  const { data: clients = [], isLoading } = useQuery({
    queryKey: ['clients-field'],
    queryFn: () => base44.entities.Client.list('-opportunity_index', 50)
  });

  const calculateDaysSince = (date) => {
    if (!date) return null;
    return Math.floor((new Date() - new Date(date)) / (1000 * 60 * 60 * 24));
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value || 0);
  };

  const filteredClients = clients.filter(client => 
    (client.company_name?.toLowerCase() || '').includes(search.toLowerCase()) ||
    (client.trade_name?.toLowerCase() || '').includes(search.toLowerCase()) ||
    (client.city?.toLowerCase() || '').includes(search.toLowerCase())
  );

  const topOpportunities = filteredClients.slice(0, 10);

  const createFollowUpMutation = useMutation({
    mutationFn: (data) => base44.entities.FollowUp.create(data),
    onSuccess: () => {
      toast.success('Contato registrado!');
      queryClient.invalidateQueries(['clients-field']);
      setShowContactDialog(false);
      setContactForm({
        notes: '',
        next_action_date: format(new Date(), 'yyyy-MM-dd'),
        next_action_type: 'whatsapp',
        create_task: false
      });
    }
  });

  const createTaskMutation = useMutation({
    mutationFn: (data) => base44.entities.Task.create(data),
    onSuccess: () => {
      toast.success('Tarefa criada!');
    }
  });

  const handleOpenContactDialog = (client) => {
    setSelectedClient(client);
    setShowContactDialog(true);
  };

  const handleSubmitContact = async () => {
    if (!selectedClient || !contactForm.notes) {
      toast.error('Preencha as observações do contato');
      return;
    }

    try {
      // Criar follow-up
      await createFollowUpMutation.mutateAsync({
        client_id: selectedClient.id,
        client_name: selectedClient.trade_name || selectedClient.company_name,
        type: contactForm.next_action_type,
        notes: contactForm.notes,
        outcome: 'neutral',
        next_action_date: contactForm.next_action_date,
        contact_date: format(new Date(), 'yyyy-MM-dd')
      });

      // Criar tarefa se solicitado
      if (contactForm.create_task) {
        await createTaskMutation.mutateAsync({
          title: `Acompanhamento: ${selectedClient.trade_name || selectedClient.company_name}`,
          description: contactForm.notes,
          task_type: contactForm.next_action_type,
          client_id: selectedClient.id,
          client_name: selectedClient.trade_name || selectedClient.company_name,
          scheduled_date: contactForm.next_action_date,
          scheduled_time: '09:00',
          status: 'pending',
          priority: 'medium'
        });
      }
    } catch (error) {
      console.error('Error creating follow-up:', error);
      toast.error('Erro ao registrar contato');
    }
  };

  return (
    <div className="pb-24 min-h-screen bg-slate-50">
      {/* Compact Header */}
      <div className="bg-[#1e3a5f] text-white px-4 py-4 -mx-4 lg:-mx-6 -mt-4 lg:-mt-6 mb-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <MapPin className="w-5 h-5 text-emerald-400" />
            <h1 className="font-bold text-lg">Modo Campo</h1>
          </div>
          <Badge className="bg-emerald-500 text-white">
            {topOpportunities.length} oportunidades
          </Badge>
        </div>
        
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input
            placeholder="Buscar cliente ou cidade..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 bg-white/10 border-white/20 text-white placeholder:text-white/60"
          />
        </div>
      </div>

      {/* Quick Stats */}
      <div className="flex gap-3 overflow-x-auto pb-3 mb-4 -mx-4 px-4 scrollbar-hide">
        <div className="bg-white rounded-xl p-3 min-w-[120px] border border-slate-100">
          <p className="text-xs text-slate-500">Hoje</p>
          <p className="text-lg font-bold text-slate-900">
            {new Date().toLocaleDateString('pt-BR', { weekday: 'short', day: 'numeric' })}
          </p>
        </div>
        <div className="bg-emerald-50 rounded-xl p-3 min-w-[120px] border border-emerald-100">
          <p className="text-xs text-emerald-600">Top Oportunidade</p>
          <p className="text-lg font-bold text-emerald-700">
            {topOpportunities[0]?.opportunity_index || 0}
          </p>
        </div>
        <div className="bg-amber-50 rounded-xl p-3 min-w-[120px] border border-amber-100">
          <p className="text-xs text-amber-600">Em Atenção</p>
          <p className="text-lg font-bold text-amber-700">
            {clients.filter(c => c.status === 'attention').length}
          </p>
        </div>
        <div className="bg-red-50 rounded-xl p-3 min-w-[120px] border border-red-100">
          <p className="text-xs text-red-600">Em Risco</p>
          <p className="text-lg font-bold text-red-700">
            {clients.filter(c => c.status === 'at_risk').length}
          </p>
        </div>
      </div>

      {/* Client List - Optimized for Field */}
      <div className="space-y-3">
        {isLoading ? (
          [...Array(5)].map((_, i) => (
            <div key={i} className="bg-white rounded-xl p-4 border border-slate-100">
              <div className="flex items-center gap-3">
                <Skeleton className="w-12 h-12 rounded-xl" />
                <div className="flex-1">
                  <Skeleton className="h-5 w-32 mb-1" />
                  <Skeleton className="h-4 w-24" />
                </div>
              </div>
            </div>
          ))
        ) : (
          topOpportunities.map((client, index) => {
            const daysSince = calculateDaysSince(client.last_purchase_date);
            const whatsappLink = client.whatsapp 
              ? `https://wa.me/55${client.whatsapp.replace(/\D/g, '')}`
              : null;

            return (
              <div key={client.id} className="bg-white rounded-xl border border-slate-100 overflow-hidden">
                {/* Main Info - Tappable Area */}
                <Link 
                  to={createPageUrl(`ClientDetails?id=${client.id}`)}
                  className="block p-4"
                >
                  <div className="flex items-start gap-3">
                    {/* Rank Badge */}
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-white ${
                      index === 0 ? 'bg-emerald-500' :
                      index < 3 ? 'bg-[#1e3a5f]' : 'bg-slate-400'
                    }`}>
                      {index + 1}
                    </div>

                    {/* Client Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <h3 className="font-semibold text-slate-900 truncate">
                          {client.trade_name || client.company_name}
                        </h3>
                        {index === 0 && <Star className="w-4 h-4 text-amber-500 flex-shrink-0" />}
                      </div>
                      
                      <div className="flex items-center gap-2 text-xs text-slate-500">
                        {client.city && (
                          <span className="flex items-center gap-0.5">
                            <MapPin className="w-3 h-3" />
                            {client.city}
                          </span>
                        )}
                        {client.segment && (
                          <>
                            <span>•</span>
                            <span>{client.segment}</span>
                          </>
                        )}
                      </div>

                      {/* Key Metrics */}
                      <div className="flex items-center gap-4 mt-2">
                        <div className="flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5 text-slate-400" />
                          <span className={`text-sm font-medium ${
                            daysSince > (client.average_purchase_cycle || 30) 
                              ? 'text-red-600' 
                              : 'text-slate-700'
                          }`}>
                            {daysSince ?? '-'} dias
                          </span>
                        </div>
                        <div className="flex items-center gap-1">
                          <TrendingUp className="w-3.5 h-3.5 text-slate-400" />
                          <span className="text-sm font-medium text-slate-700">
                            {client.average_purchase_cycle || '-'}d ciclo
                          </span>
                        </div>
                        <div className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                          (client.opportunity_index || 0) > 70 ? 'bg-emerald-100 text-emerald-700' :
                          (client.opportunity_index || 0) > 40 ? 'bg-amber-100 text-amber-700' :
                          'bg-slate-100 text-slate-700'
                        }`}>
                          {client.opportunity_index || 0}
                        </div>
                      </div>

                      {/* Last Purchase */}
                      {client.last_purchase_product && (
                        <div className="mt-2 p-2 bg-slate-50 rounded-lg">
                          <p className="text-xs text-slate-500">Última compra:</p>
                          <p className="text-sm font-medium text-slate-700 truncate">
                            {client.last_purchase_product}
                          </p>
                          <p className="text-sm font-semibold text-emerald-600">
                            {formatCurrency(client.last_purchase_value)}
                          </p>
                        </div>
                      )}
                    </div>

                    <ChevronRight className="w-5 h-5 text-slate-400 flex-shrink-0" />
                  </div>
                </Link>

                {/* Quick Actions */}
                <div className="flex border-t border-slate-100">
                  <button 
                    onClick={() => handleOpenContactDialog(client)}
                    className="flex-1 flex items-center justify-center gap-2 py-3 text-sm font-medium text-purple-600 hover:bg-purple-50 transition-colors"
                  >
                    <Calendar className="w-4 h-4" />
                    Contatar
                  </button>
                  
                  <Link 
                    to={createPageUrl(`Quotes?clientId=${client.id}`)}
                    className="flex-1 flex items-center justify-center gap-2 py-3 text-sm font-medium text-[#1e3a5f] hover:bg-slate-50 transition-colors border-l border-slate-100"
                  >
                    <FileText className="w-4 h-4" />
                    Orçar
                  </Link>
                  
                  {whatsappLink && (
                    <a 
                      href={whatsappLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 flex items-center justify-center gap-2 py-3 text-sm font-medium text-emerald-600 hover:bg-emerald-50 transition-colors border-l border-slate-100"
                    >
                      <MessageCircle className="w-4 h-4" />
                      WhatsApp
                    </a>
                  )}
                  
                  {client.phone && (
                    <a 
                      href={`tel:${client.phone}`}
                      className="flex-1 flex items-center justify-center gap-2 py-3 text-sm font-medium text-blue-600 hover:bg-blue-50 transition-colors border-l border-slate-100"
                    >
                      <Phone className="w-4 h-4" />
                      Ligar
                    </a>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {filteredClients.length === 0 && !isLoading && (
        <div className="text-center py-12">
          <MapPin className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-500">Nenhum cliente encontrado</p>
        </div>
      )}

      {/* Contact Dialog */}
      <Dialog open={showContactDialog} onOpenChange={setShowContactDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {selectedClient?.trade_name || selectedClient?.company_name}
            </DialogTitle>
            <p className="text-sm text-slate-500">{selectedClient?.company_name}</p>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label>Registrar Contato</Label>
              <Textarea
                value={contactForm.notes}
                onChange={(e) => setContactForm(prev => ({ ...prev, notes: e.target.value }))}
                placeholder="cobrar follow"
                rows={3}
                className="mt-1"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Próxima Ação</Label>
                <Input
                  type="date"
                  value={contactForm.next_action_date}
                  onChange={(e) => setContactForm(prev => ({ ...prev, next_action_date: e.target.value }))}
                  className="mt-1"
                />
              </div>
              <div>
                <Label>Tipo</Label>
                <Select 
                  value={contactForm.next_action_type} 
                  onValueChange={(v) => setContactForm(prev => ({ ...prev, next_action_type: v }))}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="whatsapp">WhatsApp</SelectItem>
                    <SelectItem value="call">Ligação</SelectItem>
                    <SelectItem value="email">E-mail</SelectItem>
                    <SelectItem value="visit">Visita</SelectItem>
                    <SelectItem value="meeting">Reunião</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="create_task"
                checked={contactForm.create_task}
                onChange={(e) => setContactForm(prev => ({ ...prev, create_task: e.target.checked }))}
                className="w-4 h-4 rounded border-slate-300"
              />
              <Label htmlFor="create_task" className="cursor-pointer">
                Criar tarefa de acompanhamento
              </Label>
            </div>

            <div className="flex gap-3 pt-4 border-t">
              <Button
                variant="outline"
                onClick={() => setShowContactDialog(false)}
                className="flex-1"
              >
                Cancelar
              </Button>
              <Button
                onClick={handleSubmitContact}
                disabled={createFollowUpMutation.isPending}
                className="flex-1 bg-[#1DB954] hover:bg-[#15803d]"
              >
                Registrar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}