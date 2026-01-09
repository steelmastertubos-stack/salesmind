import React, { useState, useEffect } from 'react';
import { MessageCircle, Mail, Copy, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { generateClientMessages, formatMessageContext } from '@/components/utils/clientMessagingAutomation';

export default function AutomatedMessaging({ client, shouldMessage }) {
  const [messages, setMessages] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showWhatsApp, setShowWhatsApp] = useState(false);
  const [showEmail, setShowEmail] = useState(false);
  const [copiedType, setCopiedType] = useState(null);

  if (!shouldMessage) {
    return null;
  }

  const context = formatMessageContext(shouldMessage);

  const handleGenerateMessages = async () => {
    setLoading(true);
    try {
      const result = await generateClientMessages(client, shouldMessage);
      if (result) {
        setMessages(result);
        toast.success('Mensagens geradas com IA!');
      } else {
        toast.error('Erro ao gerar mensagens');
      }
    } catch (error) {
      console.error('Error:', error);
      toast.error('Erro ao gerar mensagens');
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text, type) => {
    navigator.clipboard.writeText(text);
    setCopiedType(type);
    setTimeout(() => setCopiedType(null), 2000);
    toast.success('Copiado!');
  };

  return (
    <>
      <div className={`border rounded-lg p-4 ${context?.color}`}>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <AlertCircle className="w-4 h-4" />
              <span className="font-semibold">{context?.label}</span>
            </div>
            <p className="text-sm mb-3">{context?.description}</p>
            <p className="text-xs opacity-75 mb-3">
              Últimos produtos: {shouldMessage.lastProducts}
            </p>
          </div>
        </div>

        {!messages ? (
          <Button
            size="sm"
            onClick={handleGenerateMessages}
            disabled={loading}
            className="w-full sm:w-auto"
            variant="outline"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Gerando...
              </>
            ) : (
              <>
                <MessageCircle className="w-4 h-4 mr-2" />
                Gerar Mensagens com IA
              </>
            )}
          </Button>
        ) : (
          <div className="flex flex-wrap gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => setShowWhatsApp(true)}
              className="gap-2"
            >
              <MessageCircle className="w-4 h-4" />
              WhatsApp
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setShowEmail(true)}
              className="gap-2"
            >
              <Mail className="w-4 h-4" />
              Email
            </Button>
          </div>
        )}
      </div>

      {/* WhatsApp Message Dialog */}
      <Dialog open={showWhatsApp} onOpenChange={setShowWhatsApp}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Mensagem WhatsApp</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Textarea
              value={messages?.whatsapp || ''}
              readOnly
              rows={6}
              className="font-medium"
            />
            <div className="flex gap-2">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setShowWhatsApp(false)}
              >
                Fechar
              </Button>
              <Button
                className="flex-1 gap-2"
                onClick={() => copyToClipboard(messages?.whatsapp, 'whatsapp')}
              >
                {copiedType === 'whatsapp' ? (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    Copiado!
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" />
                    Copiar
                  </>
                )}
              </Button>
            </div>
            <p className="text-xs text-slate-500">
              Copie a mensagem e envie via WhatsApp para {client.contact_name || 'cliente'}
            </p>
          </div>
        </DialogContent>
      </Dialog>

      {/* Email Message Dialog */}
      <Dialog open={showEmail} onOpenChange={setShowEmail}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Mensagem Email</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-xs text-slate-600 font-medium mb-1 block">
                Corpo da mensagem:
              </label>
              <Textarea
                value={messages?.email || ''}
                readOnly
                rows={6}
                className="font-medium text-sm"
              />
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setShowEmail(false)}
              >
                Fechar
              </Button>
              <Button
                className="flex-1 gap-2"
                onClick={() => copyToClipboard(messages?.email, 'email')}
              >
                {copiedType === 'email' ? (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    Copiado!
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" />
                    Copiar
                  </>
                )}
              </Button>
            </div>
            <p className="text-xs text-slate-500">
              Cole a mensagem em seu email e envie para {client.email}
            </p>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}