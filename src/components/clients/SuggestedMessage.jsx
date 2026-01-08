import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Copy, Check, MessageCircle } from 'lucide-react';
import { toast } from 'sonner';

export default function SuggestedMessage({ client, alert, lastOrder }) {
  const [copied, setCopied] = useState(false);

  const generateMessage = () => {
    const clientName = client.contact_name || client.trade_name || client.company_name;
    const companyName = client.trade_name || client.company_name;

    switch (alert?.type) {
      case 'cycle':
        return `Olá ${clientName}! Tudo bem?\n\nNotei que faz ${Math.floor((new Date() - new Date(client.last_purchase_date)) / (1000 * 60 * 60 * 24))} dias desde nossa última operação de ${client.last_purchase_product}.\n\nPodemos avaliar uma nova cotação? Temos ótimas condições disponíveis.\n\nAguardo seu retorno!`;

      case 'repurchase':
        return `Bom dia, ${clientName}!\n\nSegue sugestão de recompra:\n\n📦 ${client.last_purchase_product}\n💰 Valor anterior: R$ ${(client.last_purchase_value || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}\n\nPosso enviar uma cotação atualizada?\n\nAbraço!`;

      case 'cross_sell':
        const suggestions = getCrossSellProducts(lastOrder);
        return `Olá ${clientName}!\n\nVi que vocês compraram ${lastOrder?.items?.[0]?.product_name || 'materiais'} recentemente.\n\n💡 Sugiro complementar com:\n${suggestions.map(s => `• ${s}`).join('\n')}\n\nTem interesse em uma cotação?\n\nAbraço!`;

      case 'birthday':
        return `🎉 Parabéns, ${clientName}!\n\nQueremos desejar um feliz aniversário e muito sucesso!\n\nÉ uma honra ter ${companyName} como parceiro.\n\nUm grande abraço!`;

      case 'inactive':
        return `Olá ${clientName}, tudo bem?\n\nFaz um tempo que não conversamos e queria saber como estão as coisas por aí.\n\n${companyName} continua sendo muito importante para nós.\n\nPodemos marcar uma conversa?\n\nAbraço!`;

      case 'scheduled':
        return `Olá ${clientName}!\n\nConforme combinado, entro em contato para alinharmos as próximas operações.\n\nQual o melhor horário para conversarmos?\n\nAbraço!`;

      default:
        return `Olá ${clientName}!\n\nEstou entrando em contato para alinharmos novas oportunidades para ${companyName}.\n\nPodemos conversar?\n\nAguardo seu retorno!`;
    }
  };

  const getCrossSellProducts = (order) => {
    if (!order?.items) return ['Conexões', 'Flanges'];
    
    const item = order.items[0];
    const category = item.category || '';

    if (category.includes('tubo')) return ['Conexões soldáveis', 'Flanges de aço'];
    if (category === 'chapas') return ['Perfis estruturais', 'Cantoneiras'];
    if (category === 'perfis' || category === 'vigas') return ['Chapas de fixação'];
    
    return ['Materiais complementares'];
  };

  const message = generateMessage();

  const handleCopy = () => {
    navigator.clipboard.writeText(message);
    setCopied(true);
    toast.success('Mensagem copiada!');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleWhatsApp = () => {
    const phone = client.whatsapp?.replace(/\D/g, '') || client.phone?.replace(/\D/g, '');
    if (phone) {
      const url = `https://wa.me/55${phone}?text=${encodeURIComponent(message)}`;
      window.open(url, '_blank');
    } else {
      toast.error('Cliente não possui WhatsApp cadastrado');
    }
  };

  return (
    <div className="bg-gradient-to-br from-blue-50 to-blue-100 border-2 border-blue-200 rounded-xl p-4">
      <div className="flex items-center gap-2 mb-3">
        <MessageCircle className="w-5 h-5 text-blue-600" />
        <h4 className="font-semibold text-blue-900">Mensagem Sugerida</h4>
      </div>
      
      <div className="bg-white rounded-lg p-3 mb-3 border border-blue-200">
        <pre className="text-sm text-slate-700 whitespace-pre-wrap font-sans">
          {message}
        </pre>
      </div>

      <div className="flex gap-2">
        <Button
          size="sm"
          variant="outline"
          onClick={handleCopy}
          className="flex-1"
        >
          {copied ? (
            <>
              <Check className="w-4 h-4 mr-2" />
              Copiado!
            </>
          ) : (
            <>
              <Copy className="w-4 h-4 mr-2" />
              Copiar
            </>
          )}
        </Button>
        {client.whatsapp && (
          <Button
            size="sm"
            onClick={handleWhatsApp}
            className="flex-1 bg-emerald-600 hover:bg-emerald-700"
          >
            <MessageCircle className="w-4 h-4 mr-2" />
            Enviar
          </Button>
        )}
      </div>
    </div>
  );
}