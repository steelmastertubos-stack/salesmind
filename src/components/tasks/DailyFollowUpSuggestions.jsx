import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Phone, 
  MessageCircle, 
  Clock, 
  ChevronDown, 
  ChevronUp,
  Zap,
  Check,
  Plus,
  AlertTriangle,
  CalendarClock,
  Building2
} from 'lucide-react';
import { toast } from 'sonner';

// Regras de follow-up por tipo de cliente / situação
function getSuggestions(clients, tasks, opportunities) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // IDs de clientes que JÁ têm tarefa pendente hoje
  const clientsWithTaskToday = new Set(
    tasks
      .filter(t => {
        if (t.status !== 'pending') return false;
        const d = new Date(t.scheduled_date);
        d.setHours(0, 0, 0, 0);
        return d.getTime() === today.getTime();
      })
      .map(t => t.client_id)
      .filter(Boolean)
  );

  const daysSince = (dateStr) => {
    if (!dateStr) return 9999;
    const d = new Date(dateStr);
    return Math.floor((today - d) / (1000 * 60 * 60 * 24));
  };

  const suggestions = [];

  clients.forEach(client => {
    if (!client.is_active) return;
    if (clientsWithTaskToday.has(client.id)) return; // já tem follow-up hoje

    const lastContact = client.last_contact_date;
    const daysNoContact = daysSince(lastContact);
    const cycle = client.average_purchase_cycle || 30;

    // Verifica oportunidades abertas
    const openOpp = opportunities.find(
      o => o.client_id === client.id && ['proposta_enviada', 'em_negociacao'].includes(o.stage)
    );

    let reason = null;
    let urgency = 'low';

    // Oportunidade aberta + sem contato há 3+ dias
    if (openOpp && daysNoContact >= 3) {
      reason = `Oportunidade aberta (${openOpp.stage === 'proposta_enviada' ? 'Proposta Enviada' : 'Em Negociação'}) sem contato há ${daysNoContact} dias`;
      urgency = daysNoContact >= 7 ? 'high' : 'medium';
    }
    // Próximo de vencer ciclo de compra
    else if (daysNoContact >= cycle * 0.8) {
      reason = `Ciclo de compra: ${daysNoContact} dias sem contato (ciclo médio: ${cycle}d)`;
      urgency = daysNoContact >= cycle ? 'high' : 'medium';
    }
    // Cliente em risco sem contato recente
    else if (client.status === 'at_risk' && daysNoContact >= 5) {
      reason = `Cliente em risco — ${daysNoContact} dias sem contato`;
      urgency = 'high';
    }
    // Cliente ativo sem contato há muito tempo
    else if (client.status === 'active' && daysNoContact >= 15) {
      reason = `${daysNoContact} dias sem nenhum registro de contato`;
      urgency = daysNoContact >= 30 ? 'medium' : 'low';
    }

    if (reason) {
      suggestions.push({ client, reason, urgency, daysNoContact, openOpp });
    }
  });

  // Ordenar: high > medium > low, e dentro de cada urgência, pelo mais dias sem contato
  const urgencyOrder = { high: 0, medium: 1, low: 2 };
  suggestions.sort((a, b) => {
    const uDiff = urgencyOrder[a.urgency] - urgencyOrder[b.urgency];
    if (uDiff !== 0) return uDiff;
    return b.daysNoContact - a.daysNoContact;
  });

  return suggestions;
}

export default function DailyFollowUpSuggestions() {
  const [expanded, setExpanded] = useState(true);
  const [dismissed, setDismissed] = useState(new Set());
  const queryClient = useQueryClient();

  const { data: clients = [] } = useQuery({
    queryKey: ['clients'],
    queryFn: () => base44.entities.Client.list('company_name', 300)
  });

  const { data: tasks = [] } = useQuery({
    queryKey: ['tasks'],
    queryFn: () => base44.entities.Task.list('-scheduled_date', 200)
  });

  const { data: opportunities = [] } = useQuery({
    queryKey: ['opportunities'],
    queryFn: () => base44.entities.Opportunity.list('-created_date', 200)
  });

  const createTaskMutation = useMutation({
    mutationFn: (data) => base44.entities.Task.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['tasks']);
      toast.success('Tarefa de follow-up criada!');
    }
  });

  const handleCreateTask = (suggestion) => {
    const today = new Date().toISOString().split('T')[0];
    createTaskMutation.mutate({
      title: `Follow-up: ${suggestion.client.company_name || suggestion.client.trade_name}`,
      description: suggestion.reason,
      task_type: 'follow_up',
      client_id: suggestion.client.id,
      client_name: suggestion.client.company_name || suggestion.client.trade_name,
      scheduled_date: today,
      scheduled_time: '09:00',
      priority: suggestion.urgency === 'high' ? 'high' : suggestion.urgency === 'medium' ? 'medium' : 'low',
      status: 'pending'
    });
    setDismissed(prev => new Set([...prev, suggestion.client.id]));
  };

  const handleDismiss = (clientId) => {
    setDismissed(prev => new Set([...prev, clientId]));
  };

  const allSuggestions = getSuggestions(clients, tasks, opportunities);
  const visibleSuggestions = allSuggestions.filter(s => !dismissed.has(s.client.id));

  const urgencyConfig = {
    high: { color: 'bg-red-100 text-red-700 border-red-200', dot: 'bg-red-500', label: 'Urgente' },
    medium: { color: 'bg-amber-100 text-amber-700 border-amber-200', dot: 'bg-amber-500', label: 'Atenção' },
    low: { color: 'bg-blue-50 text-blue-700 border-blue-200', dot: 'bg-blue-400', label: 'Rotina' }
  };

  const highCount = visibleSuggestions.filter(s => s.urgency === 'high').length;
  const mediumCount = visibleSuggestions.filter(s => s.urgency === 'medium').length;

  if (visibleSuggestions.length === 0 && allSuggestions.length === 0) return null;

  return (
    <div className="space-y-3">
      {/* Header */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between bg-white border border-slate-200 rounded-xl px-4 py-3 hover:bg-slate-50 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-amber-100 rounded-lg flex items-center justify-center">
            <CalendarClock className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-left">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-slate-900 text-sm">
                Sugestões de Follow-up para Hoje
              </span>
              {highCount > 0 && (
                <Badge className="bg-red-100 text-red-700 text-xs px-1.5 py-0">
                  {highCount} urgente{highCount > 1 ? 's' : ''}
                </Badge>
              )}
            </div>
            <p className="text-xs text-slate-500">
              {visibleSuggestions.length} clientes precisam de contato • baseado nos registros do CRM
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {visibleSuggestions.length > 0 && (
            <div className="flex gap-1">
              {highCount > 0 && <span className="w-2 h-2 rounded-full bg-red-500 mt-0.5"></span>}
              {mediumCount > 0 && <span className="w-2 h-2 rounded-full bg-amber-500 mt-0.5"></span>}
            </div>
          )}
          {expanded ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
        </div>
      </button>

      {/* List */}
      {expanded && (
        <div className="space-y-2">
          {visibleSuggestions.length === 0 ? (
            <div className="bg-white border border-slate-200 rounded-xl p-6 text-center">
              <Check className="w-10 h-10 text-emerald-400 mx-auto mb-2" />
              <p className="font-medium text-slate-700">Tudo em dia!</p>
              <p className="text-sm text-slate-500">Nenhum follow-up pendente identificado</p>
            </div>
          ) : (
            visibleSuggestions.slice(0, 10).map((suggestion) => {
              const cfg = urgencyConfig[suggestion.urgency];
              return (
                <Card key={suggestion.client.id} className={`border ${cfg.color.includes('red') ? 'border-red-200' : cfg.color.includes('amber') ? 'border-amber-200' : 'border-blue-200'}`}>
                  <CardContent className="pt-3 pb-3">
                    <div className="flex items-start gap-3">
                      <div className={`w-2 h-2 rounded-full mt-2 flex-shrink-0 ${cfg.dot}`} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2 flex-wrap">
                          <div>
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-semibold text-slate-900 text-sm">
                                {suggestion.client.company_name || suggestion.client.trade_name}
                              </span>
                              <Badge className={`text-xs px-1.5 py-0 ${cfg.color}`}>
                                {cfg.label}
                              </Badge>
                              {suggestion.openOpp && (
                                <Badge className="text-xs px-1.5 py-0 bg-purple-100 text-purple-700">
                                  <Zap className="w-3 h-3 mr-0.5" />
                                  Oportunidade aberta
                                </Badge>
                              )}
                            </div>
                            <p className="text-xs text-slate-500 mt-0.5 flex items-center gap-1">
                              <Building2 className="w-3 h-3" />
                              {suggestion.client.segment || 'Sem segmento'}
                              {suggestion.client.contact_name && ` • ${suggestion.client.contact_name}`}
                            </p>
                          </div>
                          <div className="flex items-center gap-2 text-xs text-slate-500">
                            <Clock className="w-3 h-3" />
                            {suggestion.daysNoContact === 9999 ? 'Sem registro' : `${suggestion.daysNoContact}d sem contato`}
                          </div>
                        </div>
                        <p className="text-xs text-slate-600 mt-1.5 bg-slate-50 rounded-md px-2 py-1">
                          {suggestion.reason}
                        </p>
                        <div className="flex items-center gap-2 mt-2 flex-wrap">
                          {suggestion.client.whatsapp && (
                            <a
                              href={`https://wa.me/${suggestion.client.whatsapp.replace(/\D/g, '')}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 text-xs bg-green-600 hover:bg-green-700 text-white px-2 py-1 rounded-md transition-colors"
                            >
                              <MessageCircle className="w-3 h-3" />
                              WhatsApp
                            </a>
                          )}
                          {suggestion.client.phone && (
                            <a
                              href={`tel:${suggestion.client.phone}`}
                              className="inline-flex items-center gap-1 text-xs bg-blue-600 hover:bg-blue-700 text-white px-2 py-1 rounded-md transition-colors"
                            >
                              <Phone className="w-3 h-3" />
                              Ligar
                            </a>
                          )}
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-6 text-xs px-2"
                            onClick={() => handleCreateTask(suggestion)}
                            disabled={createTaskMutation.isPending}
                          >
                            <Plus className="w-3 h-3 mr-1" />
                            Criar Tarefa
                          </Button>
                          <button
                            onClick={() => handleDismiss(suggestion.client.id)}
                            className="text-xs text-slate-400 hover:text-slate-600 px-1"
                          >
                            Ignorar
                          </button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })
          )}

          {visibleSuggestions.length > 10 && (
            <p className="text-xs text-center text-slate-500 py-2">
              + {visibleSuggestions.length - 10} outros clientes — acesse a aba <strong>Sugestões</strong> na página de Tarefas
            </p>
          )}
        </div>
      )}
    </div>
  );
}