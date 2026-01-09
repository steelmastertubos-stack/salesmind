import React from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Target, 
  TrendingUp, 
  CheckCircle2, 
  XCircle,
  Clock,
  AlertTriangle,
  Calendar
} from 'lucide-react';

export default function OpportunityCard({ opportunity, onClick }) {
  const stages = {
    proposta_enviada: { label: 'Proposta Enviada', icon: Target, color: 'bg-blue-100 text-blue-800 border-blue-200' },
    em_negociacao: { label: 'Em Negociação', icon: TrendingUp, color: 'bg-yellow-100 text-yellow-800 border-yellow-200' },
    ganho: { label: 'Ganho', icon: CheckCircle2, color: 'bg-green-100 text-green-800 border-green-200' },
    perdido: { label: 'Perdido', icon: XCircle, color: 'bg-red-100 text-red-800 border-red-200' }
  };

  const stage = stages[opportunity.stage];
  const StageIcon = stage.icon;

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value || 0);
  };

  const isOverdue = opportunity.next_action_date && new Date(opportunity.next_action_date) < new Date();
  const isHighPriority = opportunity.priority_score >= 70;
  const isStagnant = opportunity.days_without_contact >= 5;

  return (
    <Card 
      className="cursor-pointer hover:shadow-lg transition-all border-l-4"
      style={{ borderLeftColor: isHighPriority ? '#f59e0b' : isOverdue ? '#ef4444' : '#e2e8f0' }}
      onClick={onClick}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <h3 className="font-bold text-lg text-slate-900">{opportunity.client_name}</h3>
            <p className="text-sm text-slate-600">{opportunity.principal_name}</p>
          </div>
          <Badge className={stage.color}>
            <StageIcon className="w-3 h-3 mr-1" />
            {stage.label}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        {/* Value and Weight */}
        <div className="flex items-center justify-between">
          <div>
            <p className="text-2xl font-bold text-emerald-600">{formatCurrency(opportunity.total_value)}</p>
            <p className="text-xs text-slate-500">{opportunity.total_weight?.toFixed(0)} kg</p>
          </div>
          {opportunity.priority_score >= 0 && (
            <Badge variant={opportunity.priority_score >= 70 ? 'destructive' : 'outline'}>
              Score: {opportunity.priority_score}
            </Badge>
          )}
        </div>

        {/* Quote Number */}
        <p className="text-sm text-slate-600">
          📄 Orçamento: <span className="font-mono font-semibold">{opportunity.quote_number}</span>
        </p>

        {/* Alerts */}
        <div className="space-y-2">
          {isOverdue && (
            <div className="flex items-center gap-2 text-red-600 text-sm">
              <AlertTriangle className="w-4 h-4" />
              <span>Follow-up atrasado!</span>
            </div>
          )}
          
          {isStagnant && !isOverdue && (
            <div className="flex items-center gap-2 text-orange-600 text-sm">
              <Clock className="w-4 h-4" />
              <span>{opportunity.days_without_contact} dias sem contato</span>
            </div>
          )}

          {opportunity.next_action_date && !isOverdue && (
            <div className="flex items-center gap-2 text-slate-600 text-sm">
              <Calendar className="w-4 h-4" />
              <span>Próximo contato: {new Date(opportunity.next_action_date).toLocaleDateString('pt-BR')}</span>
            </div>
          )}
        </div>

        {/* Risk Badge */}
        {opportunity.risk_level === 'high' && (
          <Badge variant="destructive" className="w-full justify-center">
            ⚠️ Oportunidade em Risco
          </Badge>
        )}
      </CardContent>
    </Card>
  );
}