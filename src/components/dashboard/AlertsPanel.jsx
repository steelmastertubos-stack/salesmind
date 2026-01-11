import React from 'react';
import { Link } from 'react-router-dom';
import { 
  AlertTriangle, 
  Clock, 
  TrendingDown,
  DollarSign,
  Bell,
  ChevronRight
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { createPageUrl } from '@/utils';

export default function AlertsPanel({ clients, commissionAlerts }) {
  const inactiveClients = clients.filter(c => {
    if (!c.last_purchase_date) return false;
    const days = Math.floor((new Date() - new Date(c.last_purchase_date)) / (1000 * 60 * 60 * 24));
    return days > (c.average_purchase_cycle || 30);
  });

  const attentionClients = clients.filter(c => c.status === 'attention').length;
  const atRiskClients = clients.filter(c => c.status === 'at_risk').length;

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value || 0);
  };

  const alerts = [
    {
      id: 1,
      type: 'RISK',
      icon: AlertTriangle,
      title: 'Clientes em Risco',
      value: atRiskClients,
      description: 'Ação de Recuperação',
      color: 'bg-red-500',
      bgColor: 'bg-red-50',
      textColor: 'text-red-700'
    },
    {
      id: 2,
      type: 'ATTENTION',
      icon: Clock,
      title: 'Requerem Atenção',
      value: attentionClients,
      description: 'Antecipar Compra',
      color: 'bg-amber-500',
      bgColor: 'bg-amber-50',
      textColor: 'text-amber-700'
    },
    {
      id: 3,
      type: 'INACTIVE',
      icon: TrendingDown,
      title: 'Inativos',
      value: inactiveClients.length,
      description: 'Reativar ou Classificar',
      color: 'bg-slate-500',
      bgColor: 'bg-slate-50',
      textColor: 'text-slate-700'
    }
  ];

  if (commissionAlerts?.blockedValue > 0) {
    alerts.push({
      id: 4,
      type: 'money',
      icon: DollarSign,
      title: 'Comissão Travada',
      value: formatCurrency(commissionAlerts.blockedValue),
      description: `${commissionAlerts.blockedCount} pedido(s)`,
      color: 'bg-purple-500',
      bgColor: 'bg-purple-50',
      textColor: 'text-purple-700'
    });
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-4">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Bell className="w-5 h-5 text-slate-600" />
          <h3 className="font-semibold text-slate-900">Alertas Inteligentes</h3>
        </div>
        <Badge variant="outline" className="text-slate-500">
          {alerts.filter(a => a.value > 0 || typeof a.value === 'string').length} ativos
        </Badge>
      </div>

      <div className="space-y-3">
        {alerts.map((alert) => (
          (alert.value > 0 || typeof alert.value === 'string') && (
            <Link 
              key={alert.id}
              to={createPageUrl(`AlertList?type=${alert.type}`)}
              className={`${alert.bgColor} rounded-xl p-3 flex items-center justify-between cursor-pointer hover:opacity-90 transition-opacity block`}
            >
              <div className="flex items-center gap-3">
                <div className={`${alert.color} w-10 h-10 rounded-xl flex items-center justify-center`}>
                  <alert.icon className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className={`font-semibold ${alert.textColor}`}>{alert.title}</p>
                  <p className="text-xs text-slate-500">{alert.description}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className={`font-bold text-lg ${alert.textColor}`}>
                  {alert.value}
                </span>
                <ChevronRight className={`w-4 h-4 ${alert.textColor}`} />
              </div>
            </Link>
          )
        ))}

        {alerts.every(a => a.value === 0) && (
          <div className="text-center py-6 text-slate-500">
            <Bell className="w-8 h-8 mx-auto mb-2 opacity-30" />
            <p className="text-sm">Nenhum alerta no momento</p>
          </div>
        )}
      </div>
    </div>
  );
}