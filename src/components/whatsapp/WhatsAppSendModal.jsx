import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { MessageCircle, Send, FileText, Pencil, Calendar, CheckCircle, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

const CATEGORY_LABELS = {
  primeiro_contato: 'Primeiro Contato',
  follow_up: 'Follow-up',
  proposta_enviada: 'Proposta Enviada',
  lembrete_reuniao: 'Lembrete de Reunião',
  recuperacao_lead: 'Recuperação de Lead',
  pos_venda: 'Pós-venda',
  renovacao_recompra: 'Renovação / Recompra',
  outro: 'Outro'
};

function applyVariables(text, vars) {
  return text
    .replace(/\{\{nome_cliente\}\}/g, vars.nome_cliente || '')
    .replace(/\{\{nome_vendedor\}\}/g, vars.nome_vendedor || '')
    .replace(/\{\{empresa\}\}/g, vars.empresa || '')
    .replace(/\{\{produto\}\}/g, vars.produto || '')
    .replace(/\{\{data\}\}/g, vars.data || '');
}

export default function WhatsAppSendModal({ open, onClose, client, opportunity }) {
  const queryClient = useQueryClient();
  const [mode, setMode] = useState('template'); // 'template' | 'manual'
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [message, setMessage] = useState('');
  const [notes, setNotes] = useState('');
  const [createFollowup, setCreateFollowup] = useState(true);
  const [followupDate, setFollowupDate] = useState('');
  const [user, setUser] = useState(null);

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
    // Default followup: 2 dias a partir de hoje
    const d = new Date();
    d.setDate(d.getDate() + 2);
    setFollowupDate(d.toISOString().split('T')[0]);
  }, []);

  const { data: templates = [] } = useQuery({
    queryKey: ['whatsapp-templates'],
    queryFn: () => base44.entities.WhatsAppTemplate.filter({ is_active: true })
  });

  const vars = {
    nome_cliente: client?.contact_name || client?.trade_name || client?.company_name || '',
    nome_vendedor: user?.full_name || '',
    empresa: client?.company_name || '',
    produto: opportunity?.principal_name || '',
    data: new Date().toLocaleDateString('pt-BR')
  };

  const handleSelectTemplate = (tpl) => {
    setSelectedTemplate(tpl);
    setMessage(applyVariables(tpl.body, vars));
  };

  const phone = client?.whatsapp || client?.phone || '';
  const phoneClean = phone.replace(/\D/g, '');
  const phoneValid = phoneClean.length >= 10;

  const saveMutation = useMutation({
    mutationFn: async (data) => {
      const msg = await base44.entities.WhatsAppMessage.create(data);
      if (createFollowup && followupDate) {
        await base44.entities.Task.create({
          title: `Follow-up WhatsApp: ${client?.trade_name || client?.company_name}`,
          description: `Retornar contato após mensagem enviada via WhatsApp.\n\nMensagem: ${message.slice(0, 200)}`,
          task_type: 'follow_up',
          client_id: client?.id,
          client_name: client?.trade_name || client?.company_name,
          scheduled_date: followupDate,
          scheduled_time: '09:00',
          status: 'pending',
          priority: 'medium'
        });
      }
      return msg;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['whatsapp-messages'] });
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      toast.success('Mensagem registrada e WhatsApp aberto!');
      onClose();
    }
  });

  const handleSend = () => {
    if (!message.trim()) {
      toast.error('Digite uma mensagem');
      return;
    }
    if (!phoneValid) {
      toast.error('Número de WhatsApp inválido');
      return;
    }

    // Abrir WhatsApp
    const encodedMsg = encodeURIComponent(message);
    const waUrl = `https://wa.me/55${phoneClean}?text=${encodedMsg}`;
    window.open(waUrl, '_blank');

    // Registrar no CRM
    saveMutation.mutate({
      client_id: client.id,
      client_name: client.trade_name || client.company_name,
      client_phone: phone,
      template_id: selectedTemplate?.id || null,
      template_name: selectedTemplate?.name || null,
      message_content: message,
      message_type: selectedTemplate ? 'template' : 'manual',
      funnel_stage: opportunity?.stage || null,
      sender_name: user?.full_name || '',
      sender_email: user?.email || '',
      status: 'sent',
      notes,
      followup_task_created: createFollowup && !!followupDate,
      followup_date: followupDate || null,
      sent_at: new Date().toISOString()
    });
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MessageCircle className="w-5 h-5 text-green-600" />
            Enviar Mensagem — {client?.trade_name || client?.company_name}
          </DialogTitle>
        </DialogHeader>

        {/* Phone info */}
        <div className={`flex items-center gap-2 p-3 rounded-lg text-sm ${phoneValid ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'}`}>
          {phoneValid ? <CheckCircle className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
          {phoneValid ? `Número: ${phone}` : 'Número de WhatsApp não cadastrado ou inválido'}
        </div>

        {/* Mode selector */}
        <div className="flex gap-2">
          <Button
            type="button"
            size="sm"
            variant={mode === 'template' ? 'default' : 'outline'}
            onClick={() => setMode('template')}
            className={mode === 'template' ? 'bg-[#1e3a5f]' : ''}
          >
            <FileText className="w-4 h-4 mr-1" />
            Usar Template
          </Button>
          <Button
            type="button"
            size="sm"
            variant={mode === 'manual' ? 'default' : 'outline'}
            onClick={() => { setMode('manual'); setSelectedTemplate(null); setMessage(''); }}
            className={mode === 'manual' ? 'bg-[#1e3a5f]' : ''}
          >
            <Pencil className="w-4 h-4 mr-1" />
            Mensagem Manual
          </Button>
        </div>

        {/* Template selection */}
        {mode === 'template' && (
          <div className="space-y-3">
            <Label>Escolha um template</Label>
            <div className="grid gap-2 max-h-48 overflow-y-auto pr-1">
              {templates.map(tpl => (
                <button
                  key={tpl.id}
                  type="button"
                  onClick={() => handleSelectTemplate(tpl)}
                  className={`text-left p-3 rounded-lg border transition-all ${
                    selectedTemplate?.id === tpl.id
                      ? 'border-green-500 bg-green-50'
                      : 'border-slate-200 hover:border-slate-300 bg-white'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-medium text-sm">{tpl.name}</span>
                    <Badge variant="outline" className="text-xs">{CATEGORY_LABELS[tpl.category]}</Badge>
                  </div>
                  <p className="text-xs text-slate-500 line-clamp-2">{tpl.body}</p>
                </button>
              ))}
              {templates.length === 0 && (
                <p className="text-sm text-slate-400 text-center py-4">Nenhum template ativo. Crie templates na página WhatsApp.</p>
              )}
            </div>
          </div>
        )}

        {/* Message preview/editor */}
        {(mode === 'manual' || selectedTemplate) && (
          <div className="space-y-2">
            <Label>{mode === 'template' ? 'Mensagem (editável)' : 'Mensagem'}</Label>
            <Textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={5}
              placeholder="Digite sua mensagem..."
              className="font-mono text-sm"
            />
            {mode === 'manual' && (
              <p className="text-xs text-slate-400">
                Variáveis disponíveis: {'{{nome_cliente}}'} {'{{nome_vendedor}}'} {'{{empresa}}'} {'{{produto}}'} {'{{data}}'}
              </p>
            )}
          </div>
        )}

        {/* Notes */}
        <div className="space-y-2">
          <Label>Observações internas (não enviadas)</Label>
          <Input
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Contexto, resultado esperado..."
          />
        </div>

        {/* Follow-up */}
        <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg space-y-3">
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="create-followup"
              checked={createFollowup}
              onChange={(e) => setCreateFollowup(e.target.checked)}
              className="rounded"
            />
            <Label htmlFor="create-followup" className="cursor-pointer flex items-center gap-2">
              <Calendar className="w-4 h-4 text-amber-600" />
              Criar tarefa de follow-up automaticamente
            </Label>
          </div>
          {createFollowup && (
            <div className="flex items-center gap-2">
              <Label className="text-sm whitespace-nowrap">Data do retorno:</Label>
              <Input
                type="date"
                value={followupDate}
                onChange={(e) => setFollowupDate(e.target.value)}
                className="w-auto"
              />
            </div>
          )}
        </div>

        <div className="flex justify-end gap-3 pt-2">
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          <Button
            onClick={handleSend}
            disabled={!phoneValid || !message.trim() || saveMutation.isPending}
            className="bg-green-600 hover:bg-green-700 text-white"
          >
            <Send className="w-4 h-4 mr-2" />
            {saveMutation.isPending ? 'Registrando...' : 'Enviar no WhatsApp'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}