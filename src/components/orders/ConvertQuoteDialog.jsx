import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle2, ArrowRight } from 'lucide-react';

export default function ConvertQuoteDialog({ quote, onConvert, onClose, isLoading }) {
  const [notes, setNotes] = useState('');

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value || 0);
  };

  const handleConvert = () => {
    onConvert({ notes });
  };

  if (!quote) return null;

  return (
    <Dialog open={!!quote} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Converter Orçamento em Pedido</DialogTitle>
        </DialogHeader>

        <Alert>
          <CheckCircle2 className="h-4 w-4" />
          <AlertDescription>
            O orçamento será convertido em pedido mantendo todos os valores, impostos e dados técnicos.
          </AlertDescription>
        </Alert>

        <div className="space-y-4">
          <div className="bg-slate-50 rounded-lg p-4 space-y-3">
            <div className="flex justify-between">
              <span className="text-sm text-slate-600">Orçamento:</span>
              <span className="font-semibold">{quote.quote_number}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-slate-600">Cliente:</span>
              <span className="font-semibold">{quote.client_name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-slate-600">Representado:</span>
              <span className="font-semibold">{quote.principal_name}</span>
            </div>
            <div className="flex justify-between pt-3 border-t">
              <span className="text-sm text-slate-600">Valor Total:</span>
              <span className="text-xl font-bold text-emerald-600">
                {formatCurrency(quote.total_value)}
              </span>
            </div>
            <div className="flex justify-between text-xs text-slate-500">
              <span>Itens:</span>
              <span>{quote.items?.length || 0}</span>
            </div>
            <div className="flex justify-between text-xs text-slate-500">
              <span>ICMS Total:</span>
              <span>{formatCurrency(quote.total_icms)}</span>
            </div>
            <div className="flex justify-between text-xs text-slate-500">
              <span>IPI Total:</span>
              <span>{formatCurrency(quote.total_ipi)}</span>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Observações do Pedido (opcional)</Label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Ex: Cliente pediu urgência na entrega..."
              rows={3}
            />
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={onClose} disabled={isLoading}>
              Cancelar
            </Button>
            <Button 
              onClick={handleConvert}
              disabled={isLoading}
              className="bg-emerald-600 hover:bg-emerald-700"
            >
              <ArrowRight className="w-4 h-4 mr-2" />
              {isLoading ? 'Convertendo...' : 'Converter em Pedido'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}