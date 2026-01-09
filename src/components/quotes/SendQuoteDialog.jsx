import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { MessageCircle, Mail, FileDown } from 'lucide-react';

export default function SendQuoteDialog({ quote, client, representative, onClose }) {
  if (!quote || !client) return null;

  const handleWhatsApp = () => {
    const phone = client.whatsapp || client.phone || '';
    const cleanPhone = phone.replace(/\D/g, '');
    
    const message = `Olá! Segue o orçamento ${quote.quote_number} no valor de R$ ${(quote.total_value || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}. Por favor, confira os detalhes.`;
    
    const whatsappUrl = `https://wa.me/55${cleanPhone}?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
    onClose();
  };

  const handleEmail = () => {
    const email = client.email || '';
    const subject = `Orçamento ${quote.quote_number} - ${representative?.name || ''}`;
    const body = `Prezado(a) ${client.contact_name || client.trade_name || client.company_name},\n\nSegue em anexo o orçamento ${quote.quote_number} no valor de R$ ${(quote.total_value || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}.\n\nFicamos à disposição para esclarecimentos.\n\nAtenciosamente,\n${representative?.name || ''}`;
    
    const mailtoUrl = `mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    window.location.href = mailtoUrl;
    onClose();
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent>
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
          </div>

          <div className="space-y-3">
            <Button
              onClick={handleWhatsApp}
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
              onClick={handleEmail}
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
        </div>
      </DialogContent>
    </Dialog>
  );
}