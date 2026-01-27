import React, { useState, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { AlertTriangle } from 'lucide-react';

const PRIMARY_REASONS = [
  { value: 'preco', label: 'Preço' },
  { value: 'prazo_entrega', label: 'Prazo de entrega' },
  { value: 'concorrencia', label: 'Concorrência' },
  { value: 'estoque_indisponivel', label: 'Estoque indisponível' },
  { value: 'condicao_pagamento', label: 'Condição de pagamento' },
  { value: 'qualidade_tecnica', label: 'Qualidade/especificação técnica' },
  { value: 'cliente_desistiu', label: 'Cliente desistiu do projeto' },
  { value: 'falta_retorno_cliente', label: 'Falta de retorno do cliente' },
  { value: 'erro_interno', label: 'Erro interno/processo' },
  { value: 'outro', label: 'Outro' }
];

const SECONDARY_REASONS = [
  { value: 'followup_atrasado', label: 'Follow-up atrasado' },
  { value: 'proposta_confusa', label: 'Proposta confusa/incompleta' },
  { value: 'falta_alternativa_tecnica', label: 'Falta de alternativa técnica' },
  { value: 'condicao_comercial_fraca', label: 'Condição comercial fraca' },
  { value: 'demora_orcamento', label: 'Demora no orçamento' },
  { value: 'falta_urgencia', label: 'Falta de urgência / sem pressão' },
  { value: 'falta_decisor', label: 'Falta de contato com decisor' },
  { value: 'outro_motivo', label: 'Outros' }
];

export default function LossReasonModal({ isOpen, opportunity, onConfirm, onCancel }) {
  const [motivoPrimario, setMotivoPrimario] = useState('');
  const [motivosSecundarios, setMotivosSecundarios] = useState([]);
  const [observacao, setObservacao] = useState('');
  const [concorrente, setConcorrente] = useState('');
  const [errors, setErrors] = useState([]);

  const requiresObservacao = useMemo(() => {
    return motivoPrimario === 'outro' || motivosSecundarios.includes('outro_motivo');
  }, [motivoPrimario, motivosSecundarios]);

  const toggleSecondaryReason = (reason) => {
    setMotivosSecundarios(prev =>
      prev.includes(reason)
        ? prev.filter(r => r !== reason)
        : [...prev, reason]
    );
  };

  const calculatePeridaEvitavel = () => {
    if (motivoPrimario === 'cliente_desistiu') {
      return 'inevitavel';
    }

    const processRelatedSecondary = motivosSecundarios.some(m =>
      ['followup_atrasado', 'demora_orcamento', 'falta_decisor'].includes(m)
    );

    if (motivoPrimario === 'falta_retorno_cliente' || motivoPrimario === 'erro_interno' || processRelatedSecondary) {
      return 'evitavel';
    }

    if (['preco', 'prazo_entrega', 'concorrencia', 'condicao_pagamento', 'estoque_indisponivel'].includes(motivoPrimario)) {
      return processRelatedSecondary ? 'evitavel' : 'potencialmente_evitavel';
    }

    return 'potencialmente_evitavel';
  };

  const validateForm = () => {
    const newErrors = [];
    
    if (!motivoPrimario) {
      newErrors.push('Motivo principal é obrigatório');
    }

    if (requiresObservacao && !observacao.trim()) {
      newErrors.push('Observação é obrigatória para este motivo');
    }

    setErrors(newErrors);
    return newErrors.length === 0;
  };

  const handleSubmit = () => {
    if (!validateForm()) return;

    onConfirm({
      motivo_primario: motivoPrimario,
      motivos_secundarios: motivosSecundarios,
      observacao,
      concorrente,
      perda_evitavel: calculatePeridaEvitavel(),
      etapa_perda: opportunity.stage || 'outra'
    });

    // Reset form
    setMotivoPrimario('');
    setMotivosSecundarios([]);
    setObservacao('');
    setConcorrente('');
    setErrors([]);
  };

  const handleCancel = () => {
    setMotivoPrimario('');
    setMotivosSecundarios([]);
    setObservacao('');
    setConcorrente('');
    setErrors([]);
    onCancel();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleCancel}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-red-600" />
            Registrar Motivo da Perda
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Motivo Primário */}
          <div>
            <Label className="text-base font-semibold mb-2 block">
              Motivo Principal *
            </Label>
            <Select value={motivoPrimario} onValueChange={setMotivoPrimario}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione o motivo principal" />
              </SelectTrigger>
              <SelectContent>
                {PRIMARY_REASONS.map(reason => (
                  <SelectItem key={reason.value} value={reason.value}>
                    {reason.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Motivos Secundários */}
          <div>
            <Label className="text-base font-semibold mb-3 block">
              Motivos Secundários (opcional)
            </Label>
            <div className="space-y-2 bg-slate-50 p-3 rounded-lg border border-slate-200">
              {SECONDARY_REASONS.map(reason => (
                <div key={reason.value} className="flex items-center gap-2">
                  <Checkbox
                    id={reason.value}
                    checked={motivosSecundarios.includes(reason.value)}
                    onCheckedChange={() => toggleSecondaryReason(reason.value)}
                  />
                  <Label htmlFor={reason.value} className="font-normal cursor-pointer">
                    {reason.label}
                  </Label>
                </div>
              ))}
            </div>
          </div>

          {/* Concorrente */}
          <div>
            <Label className="font-semibold">
              Concorrente (opcional)
            </Label>
            <input
              type="text"
              value={concorrente}
              onChange={(e) => setConcorrente(e.target.value)}
              placeholder="Nome do concorrente que ganhou"
              className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm"
            />
          </div>

          {/* Observação */}
          {requiresObservacao && (
            <div className="bg-amber-50 border border-amber-200 p-3 rounded-lg">
              <p className="text-sm text-amber-800 mb-2 font-semibold">
                ⚠️ Observação obrigatória
              </p>
              <Textarea
                value={observacao}
                onChange={(e) => setObservacao(e.target.value)}
                placeholder="Descreva detalhes sobre a perda..."
                rows={3}
                className="text-sm"
              />
            </div>
          )}

          {!requiresObservacao && (
            <div>
              <Label className="font-semibold">
                Observações adicionais (opcional)
              </Label>
              <Textarea
                value={observacao}
                onChange={(e) => setObservacao(e.target.value)}
                placeholder="Detalhes relevantes sobre a perda..."
                rows={3}
                className="text-sm"
              />
            </div>
          )}

          {/* Classificação Evitabilidade */}
          {motivoPrimario && (
            <div className="bg-blue-50 border border-blue-200 p-3 rounded-lg">
              <p className="text-xs font-semibold text-blue-800 mb-1">Classificação:</p>
              <p className="text-sm font-bold text-blue-900">
                {calculatePeridaEvitavel() === 'inevitavel' && '🔴 Perda Inevitável'}
                {calculatePeridaEvitavel() === 'potencialmente_evitavel' && '🟡 Potencialmente Evitável'}
                {calculatePeridaEvitavel() === 'evitavel' && '🟢 Evitável'}
              </p>
            </div>
          )}

          {/* Erros */}
          {errors.length > 0 && (
            <div className="bg-red-50 border border-red-200 p-3 rounded-lg">
              <ul className="text-sm text-red-800 space-y-1">
                {errors.map((error, idx) => (
                  <li key={idx}>❌ {error}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Botões */}
          <div className="flex gap-3 pt-4 border-t">
            <Button variant="outline" onClick={handleCancel} className="flex-1">
              Cancelar
            </Button>
            <Button 
              onClick={handleSubmit} 
              className="flex-1 bg-red-600 hover:bg-red-700"
              disabled={!motivoPrimario}
            >
              Registrar Perda
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}