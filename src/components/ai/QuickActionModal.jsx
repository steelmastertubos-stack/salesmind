import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Phone, MessageCircle, Mail, Copy, ExternalLink, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';

export default function QuickActionModal({ insight, onClose, onComplete }) {
  const [message, setMessage] = useState(
    insight.message_template?.whatsapp_text || 
    insight.message_template?.call_script || 
    insight.message_template?.email_body || 
    ''
  );
  const [completed, setCompleted] = useState(false);

  const actionType = insight.recommended_action?.action_type || insight.recommended_action?.channel;
  const channel = insight.recommended_action?.channel;

  const handleExecute = () => {
    if (channel === 'WHATSAPP') {
      const text = encodeURIComponent(message);
      window.open(`https://wa.me/?text=${text}`, '_blank');
      toast.success('WhatsApp aberto');
    } else if (channel === 'CALL') {
      toast.success('Ligação iniciada');
    } else if (channel === 'EMAIL') {
      const subject = insight.message_template?.email_subject || 'Contato';
      const body = encodeURIComponent(message);
      window.location.href = `mailto:?subject=${encodeURIComponent(subject)}&body=${body}`;
      toast.success('Email aberto');
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(message);
    toast.success('Mensagem copiada');
  };

  const handleMarkComplete = () => {
    setCompleted(true);
    onComplete();
    setTimeout(() => onClose(), 1000);
  };

  const getIcon = () => {
    if (channel === 'WHATSAPP') return MessageCircle;
    if (channel === 'CALL') return Phone;
    if (channel === 'EMAIL') return Mail;
    return MessageCircle;
  };

  const getTitle = () => {
    if (channel === 'WHATSAPP') return 'Enviar WhatsApp';
    if (channel === 'CALL') return 'Script da Ligação';
    if (channel === 'EMAIL') return 'Enviar Email';
    return 'Ação Rápida';
  };

  const Icon = getIcon();

  if (completed) {
    return (
      <Dialog open={true} onOpenChange={onClose}>
        <DialogContent className="max-w-md">
          <div className="text-center py-8">
            <CheckCircle className="w-16 h-16 text-green-600 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-slate-900 mb-2">Ação Concluída!</h3>
            <p className="text-sm text-slate-600">A ação foi registrada com sucesso</p>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Icon className="w-5 h-5" />
            {getTitle()}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <p className="text-sm text-blue-900 font-semibold mb-1">{insight.title}</p>
            <p className="text-xs text-blue-700">{insight.what_is_happening}</p>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-slate-700">
                {channel === 'CALL' ? 'Script' : 'Mensagem'}
              </label>
              <Button variant="ghost" size="sm" onClick={handleCopy}>
                <Copy className="w-4 h-4 mr-1" />
                Copiar
              </Button>
            </div>
            <Textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={8}
              className="font-mono text-sm"
            />
          </div>

          <div className="bg-slate-50 rounded-lg p-3">
            <p className="text-xs font-semibold text-slate-600 mb-1">💡 Por que essa ação?</p>
            <ul className="text-xs text-slate-700 space-y-0.5">
              {insight.explainability?.map((point, i) => (
                <li key={i}>• {point}</li>
              ))}
            </ul>
          </div>

          <div className="flex gap-3">
            <Button onClick={onClose} variant="outline" className="flex-1">
              Cancelar
            </Button>
            <Button 
              onClick={handleExecute}
              className="flex-1 bg-purple-600 hover:bg-purple-700"
            >
              <ExternalLink className="w-4 h-4 mr-2" />
              {channel === 'WHATSAPP' ? 'Abrir WhatsApp' : 
               channel === 'CALL' ? 'Ligar Agora' : 
               'Abrir Email'}
            </Button>
            <Button 
              onClick={handleMarkComplete}
              className="flex-1 bg-green-600 hover:bg-green-700"
            >
              <CheckCircle className="w-4 h-4 mr-2" />
              Marcar como Feito
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}