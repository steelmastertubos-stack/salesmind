import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';

const LOSS_REASONS = {
  'price': 'Preço',
  'delivery_time': 'Prazo de entrega',
  'competition': 'Concorrência',
  'quality_spec': 'Qualidade / Especificação técnica',
  'client_gave_up': 'Cliente desistiu do projeto',
  'no_client_response': 'Falta de retorno do cliente',
  'payment_conditions': 'Condição de pagamento',
  'out_of_stock': 'Estoque indisponível',
  'internal_error': 'Erro interno / Processo',
  'other': 'Outro'
};

export default function LossReasonModal({ isOpen, opportunity, onConfirm, onCancel }) {
  const [reason, setReason] = useState('');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleConfirm = async () => {
    if (!reason) {
      toast.error('Selecione um motivo de perda');
      return;
    }

    if (reason === 'other' && !notes.trim()) {
      toast.error('Descreva o motivo quando selecionar "Outro"');
      return;
    }

    setIsSubmitting(true);
    try {
      await onConfirm({
        loss_reason: reason,
        loss_notes: notes || null
      });
      setReason('');
      setNotes('');
    } catch (error) {
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onCancel()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-red-600" />
            <DialogTitle>Registrar Motivo da Perda</DialogTitle>
          </div>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <p className="text-sm text-slate-600 mb-3">
              <strong>{opportunity?.client_name}</strong> - {opportunity?.total_value?.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
            </p>
          </div>

          <div>
            <Label htmlFor="reason" className="mb-2 block">
              Motivo da Perda *
            </Label>
            <Select value={reason} onValueChange={setReason}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione o motivo..." />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(LOSS_REASONS).map(([key, label]) => (
                  <SelectItem key={key} value={key}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {reason && (
            <div>
              <Label htmlFor="notes" className="mb-2 block">
                Observações {reason === 'other' ? '*' : '(opcional)'}
              </Label>
              <Textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Detalhe o motivo da perda..."
                rows={4}
              />
            </div>
          )}
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onCancel} disabled={isSubmitting}>
            Cancelar
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={!reason || isSubmitting}
            className="bg-red-600 hover:bg-red-700"
          >
            {isSubmitting ? 'Registrando...' : 'Confirmar Perda'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}