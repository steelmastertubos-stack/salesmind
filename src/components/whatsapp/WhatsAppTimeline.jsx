import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { MessageCircle, Clock, User, FileText, CheckCircle, Eye, Send } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const STATUS_CONFIG = {
  sent: { label: 'Enviado', color: 'bg-blue-100 text-blue-700', icon: Send },
  delivered: { label: 'Entregue', color: 'bg-emerald-100 text-emerald-700', icon: CheckCircle },
  read: { label: 'Lido', color: 'bg-purple-100 text-purple-700', icon: Eye },
  failed: { label: 'Falhou', color: 'bg-red-100 text-red-700', icon: Clock },
  pending: { label: 'Pendente', color: 'bg-slate-100 text-slate-600', icon: Clock }
};

const CATEGORY_LABELS = {
  primeiro_contato: 'Primeiro Contato',
  follow_up: 'Follow-up',
  proposta_enviada: 'Proposta',
  lembrete_reuniao: 'Reunião',
  recuperacao_lead: 'Recuperação',
  pos_venda: 'Pós-venda',
  renovacao_recompra: 'Renovação',
  outro: 'Outro'
};

export default function WhatsAppTimeline({ clientId }) {
  const { data: messages = [], isLoading } = useQuery({
    queryKey: ['whatsapp-messages', clientId],
    queryFn: () => base44.entities.WhatsAppMessage.filter({ client_id: clientId }, '-sent_at', 50),
    enabled: !!clientId
  });

  if (isLoading) {
    return <div className="animate-pulse space-y-3">{[1,2,3].map(i => <div key={i} className="h-16 bg-slate-100 rounded-lg" />)}</div>;
  }

  if (messages.length === 0) {
    return (
      <div className="text-center py-8">
        <MessageCircle className="w-10 h-10 text-slate-200 mx-auto mb-2" />
        <p className="text-slate-400 text-sm">Nenhuma mensagem enviada ainda</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {messages.map((msg) => {
        const statusCfg = STATUS_CONFIG[msg.status] || STATUS_CONFIG.sent;
        const StatusIcon = statusCfg.icon;
        const sentDate = msg.sent_at ? new Date(msg.sent_at) : new Date(msg.created_date);

        return (
          <div key={msg.id} className="flex gap-3">
            <div className="flex-shrink-0 mt-1">
              <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center">
                <MessageCircle className="w-4 h-4 text-green-600" />
              </div>
            </div>
            <div className="flex-1 bg-white border border-slate-100 rounded-xl p-3">
              <div className="flex items-center justify-between mb-2 flex-wrap gap-1">
                <div className="flex items-center gap-2">
                  <Badge className={statusCfg.color + ' text-xs'}>
                    <StatusIcon className="w-3 h-3 mr-1" />
                    {statusCfg.label}
                  </Badge>
                  {msg.template_name && (
                    <Badge variant="outline" className="text-xs">
                      <FileText className="w-3 h-3 mr-1" />
                      {msg.template_name}
                    </Badge>
                  )}
                </div>
                <span className="text-xs text-slate-400">
                  {format(sentDate, "dd/MM/yy 'às' HH:mm", { locale: ptBR })}
                </span>
              </div>
              <p className="text-sm text-slate-700 whitespace-pre-wrap">{msg.message_content}</p>
              {msg.notes && (
                <p className="text-xs text-slate-400 mt-2 pt-2 border-t border-slate-100 italic">{msg.notes}</p>
              )}
              <div className="flex items-center gap-1 mt-2 text-xs text-slate-400">
                <User className="w-3 h-3" />
                {msg.sender_name || 'Vendedor'}
                {msg.followup_task_created && (
                  <span className="ml-2 text-amber-600">• Follow-up agendado</span>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}