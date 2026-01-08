import React from 'react';
import { Badge } from '@/components/ui/badge';
import { 
  Clock, 
  ShoppingCart, 
  Cake, 
  AlertCircle,
  TrendingUp,
  Calendar
} from 'lucide-react';
import SuggestedMessage from './SuggestedMessage';

export default function ClientAlerts({ client, orders, showMessages = true }) {
  const alerts = [];
  const today = new Date();
  const lastOrder = orders.sort((a, b) => new Date(b.created_date) - new Date(a.created_date))[0];

  // 1. Alerta de ciclo de compra
  if (client.last_purchase_date && client.average_purchase_cycle) {
    const lastPurchase = new Date(client.last_purchase_date);
    const daysSince = Math.floor((today - lastPurchase) / (1000 * 60 * 60 * 24));
    const cycle = client.average_purchase_cycle;

    if (daysSince >= cycle - 3 && daysSince <= cycle + 5) {
      alerts.push({
        type: 'cycle',
        icon: Clock,
        color: daysSince > cycle ? 'bg-red-100 text-red-700 border-red-200' : 'bg-amber-100 text-amber-700 border-amber-200',
        title: daysSince > cycle ? 'Ciclo de Compra Vencido' : 'Ciclo de Compra Próximo',
        description: `Cliente costuma comprar a cada ${cycle} dias. Última compra há ${daysSince} dias.`,
        action: 'Fazer contato de follow-up'
      });
    }
  }

  // 2. Alerta de aniversário do contato
  if (client.contact_birthday) {
    const birthday = new Date(client.contact_birthday);
    const thisYearBirthday = new Date(today.getFullYear(), birthday.getMonth(), birthday.getDate());
    const daysUntil = Math.floor((thisYearBirthday - today) / (1000 * 60 * 60 * 24));

    if (daysUntil >= 0 && daysUntil <= 7) {
      alerts.push({
        type: 'birthday',
        icon: Cake,
        color: 'bg-pink-100 text-pink-700 border-pink-200',
        title: daysUntil === 0 ? 'Aniversário Hoje!' : `Aniversário em ${daysUntil} dias`,
        description: `${client.contact_name} faz aniversário ${daysUntil === 0 ? 'hoje' : `em ${daysUntil} dias`}`,
        action: 'Enviar mensagem de parabéns'
      });
    }
  }

  // 3. Sugestão de recompra
  if (client.last_purchase_product && client.average_purchase_cycle) {
    const lastPurchase = new Date(client.last_purchase_date);
    const daysSince = Math.floor((today - lastPurchase) / (1000 * 60 * 60 * 24));
    
    if (daysSince >= client.average_purchase_cycle - 5 && daysSince < client.average_purchase_cycle) {
      alerts.push({
        type: 'repurchase',
        icon: ShoppingCart,
        color: 'bg-blue-100 text-blue-700 border-blue-200',
        title: 'Oportunidade de Recompra',
        description: `Cliente pode precisar de ${client.last_purchase_product} novamente`,
        action: 'Oferecer cotação'
      });
    }
  }

  // 4. Cliente inativo
  if (client.status === 'inactive' || client.status === 'at_risk') {
    alerts.push({
      type: 'inactive',
      icon: AlertCircle,
      color: 'bg-red-100 text-red-700 border-red-200',
      title: client.status === 'inactive' ? 'Cliente Inativo' : 'Cliente em Risco',
      description: 'Faz tempo que não há interação com este cliente',
      action: 'Agendar visita comercial'
    });
  }

  // 5. Próximo contato agendado
  if (client.next_contact_date) {
    const nextContact = new Date(client.next_contact_date);
    const daysUntil = Math.floor((nextContact - today) / (1000 * 60 * 60 * 24));

    if (daysUntil >= -1 && daysUntil <= 3) {
      alerts.push({
        type: 'scheduled',
        icon: Calendar,
        color: 'bg-purple-100 text-purple-700 border-purple-200',
        title: daysUntil < 0 ? 'Contato Atrasado' : daysUntil === 0 ? 'Contato Hoje' : `Contato em ${daysUntil} dias`,
        description: `Contato agendado para ${nextContact.toLocaleDateString('pt-BR')}`,
        action: 'Realizar contato'
      });
    }
  }

  if (alerts.length === 0) return null;

  return (
    <div className="space-y-3">
      <h3 className="font-semibold text-slate-900 flex items-center gap-2">
        <TrendingUp className="w-5 h-5 text-emerald-600" />
        Alertas e Oportunidades
      </h3>
      {alerts.map((alert, index) => {
        const Icon = alert.icon;
        return (
          <div key={index} className="space-y-3">
            <div className={`rounded-xl p-4 border-2 ${alert.color}`}>
              <div className="flex items-start gap-3">
                <Icon className="w-5 h-5 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <h4 className="font-semibold mb-1">{alert.title}</h4>
                  <p className="text-sm mb-2">{alert.description}</p>
                  <Badge variant="outline" className="text-xs">
                    💡 {alert.action}
                  </Badge>
                </div>
              </div>
            </div>
            {showMessages && (
              <SuggestedMessage client={client} alert={alert} lastOrder={lastOrder} />
            )}
          </div>
        );
      })}
    </div>
  );
}