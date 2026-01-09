import React, { useState, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { MessageCircle, Mail, Edit2, Send } from 'lucide-react';

export default function SendQuoteDialog({ quote, client, representative, onClose }) {
  if (!quote || !client) return null;

  const [channel, setChannel] = useState(null);
  const [editableMessage, setEditableMessage] = useState('');
  const [editableSubject, setEditableSubject] = useState('');

  // Lógica inteligente: decidir se mostra valor no email
  const shouldShowValueInEmail = useMemo(() => {
    // Mostrar valor se cliente for recorrente (tem histórico)
    if (client.purchase_count > 0) return true;
    
    // Esconder se cliente novo ou sem histórico
    if (!client.last_purchase_value) return false;
    
    // Esconder se ticket for muito maior que média histórica
    if (client.average_ticket && quote.total_value > client.average_ticket * 1.5) return false;
    
    return true;
  }, [client, quote]);

  // Gerar mensagens automáticas
  const generateMessage = (type) => {
    const contactName = client.contact_name || client.trade_name?.split(' ')[0] || 'Cliente';
    const companyName = representative?.name || 'Nossa empresa';
    const value = (quote.total_value || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 });

    if (type === 'whatsapp') {
      return `Oi ${contactName}, tudo bem?

Te enviei o orçamento ${quote.quote_number}, no valor total de R$ ${value}, conforme combinamos.

Material será fornecido pela *${quote.principal_name || 'nossa representada'}*, referência no mercado.

O PDF vai anexado pra você conferir os detalhes.

Qualquer dúvida ou se quiser ajustar algo, me chama por aqui 👍`;
    }

    if (type === 'email_with_value') {
      return `Prezado ${contactName},

Conforme alinhado, segue em anexo o orçamento ${quote.quote_number}, no valor de R$ ${value}, com as condições comerciais para sua análise.

Material será fornecido pela <strong>${quote.principal_name || 'nossa representada'}</strong>, referência no mercado.

Caso queira ajustar algum ponto ou alinhar os próximos passos, você prefere que conversemos por e-mail ou posso te ligar rapidamente?

Atenciosamente,
${companyName}`;
    }

    if (type === 'email_without_value') {
      return `Prezado ${contactName},

Segue em anexo o orçamento ${quote.quote_number}, preparado conforme sua solicitação e as condições alinhadas.

Material será fornecido pela <strong>${quote.principal_name || 'nossa representada'}</strong>, referência no mercado.

Quando puder analisar, consegue me confirmar se está tudo ok ou se prefere que a gente alinhe algum ponto antes de avançarmos?

Atenciosamente,
${companyName}`;
    }
  };

  const generateSubject = () => {
    if (shouldShowValueInEmail) {
      return `Orçamento ${quote.quote_number} | Condições comerciais`;
    }
    return `Proposta comercial ${quote.quote_number}`;
  };

  const handleSelectWhatsApp = () => {
    setChannel('whatsapp');
    setEditableMessage(generateMessage('whatsapp'));
  };

  const handleSelectEmail = () => {
    setChannel('email');
    const messageType = shouldShowValueInEmail ? 'email_with_value' : 'email_without_value';
    setEditableMessage(generateMessage(messageType));
    setEditableSubject(generateSubject());
  };

  const handleSendWhatsApp = () => {
    const phone = client.whatsapp || client.phone || '';
    const cleanPhone = phone.replace(/\D/g, '');
    const whatsappUrl = `https://wa.me/55${cleanPhone}?text=${encodeURIComponent(editableMessage)}`;
    window.open(whatsappUrl, '_blank');
    onClose();
  };

  const handleSendEmail = () => {
    const email = client.email || '';
    const mailtoUrl = `mailto:${email}?subject=${encodeURIComponent(editableSubject)}&body=${encodeURIComponent(editableMessage)}`;
    window.location.href = mailtoUrl;
    onClose();
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Enviar Orçamento {quote.quote_number}</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="bg-slate-50 rounded-lg p-4">
            <p className="text-sm text-slate-600 mb-1">Cliente</p>
            <p className="font-semibold">{client.trade_name || client.company_name}</p>
            {client.contact_name && (
              <p className="text-sm text-slate-500">Contato: {client.contact_name}</p>
            )}
            <p className="text-sm text-slate-500 mt-1">Valor: R$ {(quote.total_value || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
          </div>

          {!channel ? (
            <>
              <div className="space-y-3">
                <Button
                  onClick={handleSelectWhatsApp}
                  disabled={!client.whatsapp && !client.phone}
                  className="w-full bg-green-600 hover:bg-green-700"
                >
                  <MessageCircle className="w-4 h-4 mr-2" />
                  Enviar via WhatsApp
                  {(client.whatsapp || client.phone) && (
                    <span className="ml-2 text-xs">({client.whatsapp || client.phone})</span>
                  )}
                </Button>

                <Button
                  onClick={handleSelectEmail}
                  disabled={!client.email}
                  variant="outline"
                  className="w-full"
                >
                  <Mail className="w-4 h-4 mr-2" />
                  Enviar via Email
                  {client.email && (
                    <span className="ml-2 text-xs">({client.email})</span>
                  )}
                </Button>
              </div>

              {!client.whatsapp && !client.phone && (
                <p className="text-xs text-amber-600">⚠️ Cliente sem WhatsApp/Telefone cadastrado</p>
              )}
              {!client.email && (
                <p className="text-xs text-amber-600">⚠️ Cliente sem email cadastrado</p>
              )}
            </>
          ) : (
            <>
              {channel === 'whatsapp' && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                  <div className="flex items-center gap-2 text-sm text-green-800 mb-2">
                    <MessageCircle className="w-4 h-4" />
                    <span className="font-semibold">WhatsApp - Mensagem gerada automaticamente</span>
                  </div>
                  <p className="text-xs text-green-700">💬 Tom informal, valor incluído, chamada para ação</p>
                </div>
              )}

              {channel === 'email' && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                  <div className="flex items-center gap-2 text-sm text-blue-800 mb-2">
                    <Mail className="w-4 h-4" />
                    <span className="font-semibold">E-mail - Mensagem gerada automaticamente</span>
                  </div>
                  {shouldShowValueInEmail ? (
                    <p className="text-xs text-blue-700">✉️ Cliente recorrente: valor incluído no corpo</p>
                  ) : (
                    <p className="text-xs text-blue-700">✉️ Cliente novo/alto ticket: valor no PDF anexo</p>
                  )}
                </div>
              )}

              {channel === 'email' && (
                <div className="space-y-2">
                  <Label>Assunto</Label>
                  <Textarea
                    value={editableSubject}
                    onChange={(e) => setEditableSubject(e.target.value)}
                    rows={1}
                    className="resize-none"
                  />
                </div>
              )}

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>Mensagem {channel === 'whatsapp' ? '(WhatsApp)' : '(E-mail)'}</Label>
                  <span className="text-xs text-slate-500 flex items-center gap-1">
                    <Edit2 className="w-3 h-3" />
                    Editável
                  </span>
                </div>
                <Textarea
                  value={editableMessage}
                  onChange={(e) => setEditableMessage(e.target.value)}
                  rows={channel === 'whatsapp' ? 8 : 10}
                  className="font-mono text-sm"
                />
              </div>

              <div className="flex gap-3">
                <Button
                  onClick={() => setChannel(null)}
                  variant="outline"
                  className="flex-1"
                >
                  Voltar
                </Button>
                <Button
                  onClick={channel === 'whatsapp' ? handleSendWhatsApp : handleSendEmail}
                  className={channel === 'whatsapp' ? 'flex-1 bg-green-600 hover:bg-green-700' : 'flex-1 bg-blue-600 hover:bg-blue-700'}
                >
                  <Send className="w-4 h-4 mr-2" />
                  Enviar {channel === 'whatsapp' ? 'WhatsApp' : 'E-mail'}
                </Button>
              </div>

              <p className="text-xs text-amber-600 bg-amber-50 border border-amber-200 rounded p-2">
                📎 Lembre-se de anexar o PDF do orçamento ao enviar!
              </p>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}