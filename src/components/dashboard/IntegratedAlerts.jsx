import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  AlertTriangle, 
  Clock, 
  Target,
  Calendar,
  Phone,
  TrendingDown,
  Zap
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import PurchaseCycleActionMenu from './PurchaseCycleActionMenu';

export default function IntegratedAlerts() {
  const { data: clients = [] } = useQuery({
    queryKey: ['clients'],
    queryFn: () => base44.entities.Client.list('-last_purchase_date', 500)
  });

  const { data: opportunities = [] } = useQuery({
    queryKey: ['opportunities'],
    queryFn: () => base44.entities.Opportunity.list('-created_date', 500)
  });

  const { data: quotes = [] } = useQuery({
    queryKey: ['quotes'],
    queryFn: () => base44.entities.Quote.list('-created_date', 500)
  });

  // 1. Oportunidades com follow-up atrasado
  const overdueFollowUps = opportunities.filter(opp => {
    if (opp.stage === 'ganho' || opp.stage === 'perdido') return false;
    if (!opp.next_action_date) return false;
    return new Date(opp.next_action_date) < new Date();
  });

  // 2. Orçamentos próximos do vencimento
  const expiringQuotes = quotes.filter(quote => {
    if (quote.status !== 'emitido' && quote.status !== 'enviado') return false;
    if (!quote.validity_date) return false;
    const validityDate = new Date(quote.validity_date);
    const today = new Date();
    const daysUntil = Math.floor((validityDate - today) / (1000 * 60 * 60 * 24));
    return daysUntil >= 0 && daysUntil <= 2;
  });

  // 3. Clientes no ciclo de compra
  const clientsInPurchaseCycle = clients.filter(client => {
    if (!client.last_purchase_date || !client.average_purchase_cycle) return false;
    const lastPurchase = new Date(client.last_purchase_date);
    const today = new Date();
    const daysSinceLastPurchase = Math.floor((today - lastPurchase) / (1000 * 60 * 60 * 24));
    return daysSinceLastPurchase >= client.average_purchase_cycle - 5;
  });

  // 4. Oportunidades paradas (+ de 5 dias sem contato)
  const stagnantOpportunities = opportunities.filter(opp => {
    if (opp.stage === 'ganho' || opp.stage === 'perdido') return false;
    return opp.days_without_contact >= 5;
  });

  // 5. Clientes em risco (at_risk ou inactive)
  const clientsAtRisk = clients.filter(client => 
    client.status === 'at_risk' || client.status === 'attention'
  );

  const allAlerts = [
    ...overdueFollowUps.map(opp => ({
      id: `follow_up_${opp.id}`,
      type: 'follow_up',
      severity: 'high',
      title: 'Follow-up Atrasado',
      description: `${opp.client_name} - ${opp.total_value?.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}`,
      action: 'Contatar agora',
      link: createPageUrl('Opportunities')
    })),
    ...expiringQuotes.map(quote => ({
      id: `expiring_${quote.id}`,
      type: 'expiring_quote',
      severity: 'high',
      title: 'Orçamento Vencendo',
      description: `${quote.quote_number} - ${quote.client_name}`,
      action: 'Ver orçamento',
      link: createPageUrl('Quotes')
    })),
    ...clientsInPurchaseCycle.slice(0, 3).map(client => ({
      id: `cycle_${client.id}`,
      type: 'purchase_cycle',
      severity: 'medium',
      title: 'Cliente no Ciclo de Compra',
      description: `${client.trade_name || client.company_name} - Última compra há ${Math.floor((new Date() - new Date(client.last_purchase_date)) / (1000 * 60 * 60 * 24))} dias`,
      action: 'Criar orçamento',
      link: createPageUrl('Clients')
    })),
    ...stagnantOpportunities.slice(0, 2).map(opp => ({
      id: `stagnant_${opp.id}`,
      type: 'stagnant',
      severity: 'medium',
      title: 'Oportunidade Parada',
      description: `${opp.client_name} - ${opp.days_without_contact} dias sem contato`,
      action: 'Retomar',
      link: createPageUrl('Opportunities')
    })),
    ...clientsAtRisk.slice(0, 2).map(client => ({
      id: `risk_${client.id}`,
      type: 'client_risk',
      severity: 'medium',
      title: 'Cliente em Risco',
      description: `${client.trade_name || client.company_name}`,
      action: 'Ver histórico',
      link: createPageUrl('Clients')
    }))
  ];

  const getIcon = (type) => {
    switch (type) {
      case 'follow_up': return Phone;
      case 'expiring_quote': return Clock;
      case 'purchase_cycle': return Calendar;
      case 'stagnant': return Target;
      case 'client_risk': return TrendingDown;
      default: return Zap;
    }
  };

  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'high': return 'bg-red-100 text-red-800 border-red-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default: return 'bg-blue-100 text-blue-800 border-blue-200';
    }
  };

  if (allAlerts.length === 0) {
    return null;
  }

  return (
    <Card className="border-orange-200 bg-gradient-to-br from-orange-50 to-white">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-orange-900">
          <AlertTriangle className="w-5 h-5" />
          Alertas Inteligentes ({allAlerts.length})
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {allAlerts.slice(0, 5).map(alert => {
          const Icon = getIcon(alert.type);
          return (
            <div
              key={alert.id}
              className={`p-3 rounded-lg border ${getSeverityColor(alert.severity)} flex items-center justify-between`}
            >
              <div className="flex items-start gap-3 flex-1">
                <Icon className="w-5 h-5 mt-0.5" />
                <div>
                  <p className="font-semibold text-sm">{alert.title}</p>
                  <p className="text-xs opacity-80">{alert.description}</p>
                </div>
              </div>
              <Link to={alert.link}>
                <Button size="sm" variant="outline" className="text-xs">
                  {alert.action}
                </Button>
              </Link>
            </div>
          );
        })}
        {allAlerts.length > 5 && (
          <p className="text-center text-xs text-slate-500 pt-2">
            + {allAlerts.length - 5} alertas adicionais
          </p>
        )}
      </CardContent>
    </Card>
  );
}