import React from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  TrendingUp, 
  Phone, 
  MessageCircle,
  Eye,
  Clock,
  DollarSign
} from 'lucide-react';
import { calculateClientScore } from '@/components/clients/ClientScore';

export default function PriorityClients({ clients, orders }) {
  const formatCurrency = (value) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value || 0);
  };

  // Calcular score para cada cliente
  const clientsWithScore = clients.map(client => {
    const clientOrders = orders.filter(o => o.client_id === client.id);
    const score = calculateClientScore(client, clientOrders);
    return { ...client, score };
  });

  // Filtrar e ordenar por prioridade
  const priorityClients = clientsWithScore
    .filter(c => c.score >= 60) // Apenas média-alta prioridade
    .sort((a, b) => b.score - a.score)
    .slice(0, 5);

  if (priorityClients.length === 0) {
    return (
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 text-center">
        <TrendingUp className="w-10 h-10 text-slate-300 mx-auto mb-3" />
        <p className="text-slate-500">Nenhum cliente prioritário no momento</p>
      </div>
    );
  }

  const getScoreColor = (score) => {
    if (score >= 80) return 'text-red-600 bg-red-100 border-red-200';
    if (score >= 60) return 'text-orange-600 bg-orange-100 border-orange-200';
    return 'text-amber-600 bg-amber-100 border-amber-200';
  };

  const getActionReason = (client) => {
    const today = new Date();
    
    if (client.last_purchase_date && client.average_purchase_cycle) {
      const daysSince = Math.floor((today - new Date(client.last_purchase_date)) / (1000 * 60 * 60 * 24));
      if (daysSince > client.average_purchase_cycle) {
        return `Ciclo vencido há ${daysSince - client.average_purchase_cycle} dias`;
      }
      if (daysSince >= client.average_purchase_cycle - 3) {
        return 'Ciclo próximo do vencimento';
      }
    }
    
    if (client.last_contact_date) {
      const daysSinceContact = Math.floor((today - new Date(client.last_contact_date)) / (1000 * 60 * 60 * 24));
      if (daysSinceContact > 30) {
        return `Sem contato há ${daysSinceContact} dias`;
      }
    }

    if (client.status === 'at_risk') return 'Cliente em risco';
    
    return 'Alta oportunidade de venda';
  };

  return (
    <div className="bg-gradient-to-br from-orange-50 to-red-50 rounded-2xl shadow-lg border-2 border-orange-200 p-4">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 bg-red-500 rounded-xl flex items-center justify-center">
          <TrendingUp className="w-6 h-6 text-white" />
        </div>
        <div>
          <h3 className="font-bold text-slate-900">Clientes Prioritários</h3>
          <p className="text-sm text-slate-600">Contatos urgentes para hoje</p>
        </div>
      </div>

      <div className="space-y-2">
        {priorityClients.map((client, index) => {
          const whatsappLink = client.whatsapp 
            ? `https://wa.me/55${client.whatsapp.replace(/\D/g, '')}`
            : null;

          return (
            <div 
              key={client.id} 
              className="bg-white rounded-xl p-3 border-2 border-orange-200 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-bold text-slate-700 text-lg">#{index + 1}</span>
                    <h4 className="font-semibold text-slate-900">
                      {client.trade_name || client.company_name}
                    </h4>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-slate-500 mb-2">
                    <Clock className="w-3 h-3" />
                    {getActionReason(client)}
                  </div>
                </div>
                <Badge className={`${getScoreColor(client.score)} border font-bold`}>
                  {client.score}
                </Badge>
              </div>

              {client.average_ticket > 0 && (
                <div className="flex items-center gap-1 text-xs text-emerald-600 mb-3">
                  <DollarSign className="w-3 h-3" />
                  Ticket médio: {formatCurrency(client.average_ticket)}
                </div>
              )}

              <div className="flex gap-2">
                <Link to={createPageUrl(`ClientDetails?id=${client.id}`)} className="flex-1">
                  <Button size="sm" variant="outline" className="w-full text-xs">
                    <Eye className="w-3 h-3 mr-1" />
                    Ver
                  </Button>
                </Link>
                {whatsappLink && (
                  <a href={whatsappLink} target="_blank" rel="noopener noreferrer" className="flex-1">
                    <Button size="sm" className="w-full bg-emerald-600 hover:bg-emerald-700 text-xs">
                      <MessageCircle className="w-3 h-3 mr-1" />
                      WhatsApp
                    </Button>
                  </a>
                )}
                {client.phone && (
                  <a href={`tel:${client.phone}`} className="flex-1">
                    <Button size="sm" variant="outline" className="w-full text-xs">
                      <Phone className="w-3 h-3 mr-1" />
                      Ligar
                    </Button>
                  </a>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <Link to={createPageUrl('Clients')}>
        <Button variant="outline" className="w-full mt-3">
          Ver Todos os Clientes
        </Button>
      </Link>
    </div>
  );
}