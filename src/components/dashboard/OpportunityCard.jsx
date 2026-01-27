import React from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { 
  Phone, 
  MessageCircle, 
  FileText, 
  TrendingUp,
  Calendar,
  Package,
  AlertTriangle,
  Clock
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

export default function OpportunityCard({ client, rank }) {
  const daysSinceLastPurchase = client.last_purchase_date 
    ? Math.floor((new Date() - new Date(client.last_purchase_date)) / (1000 * 60 * 60 * 24))
    : null;

  const getStatusConfig = () => {
    switch (client.status) {
      case 'at_risk':
        return { color: 'bg-red-500', text: 'Em Risco', icon: AlertTriangle };
      case 'attention':
        return { color: 'bg-amber-500', text: 'Atenção', icon: Clock };
      default:
        return { color: 'bg-emerald-500', text: 'Ativo', icon: TrendingUp };
    }
  };

  const status = getStatusConfig();
  const StatusIcon = status.icon;

  const getOpportunityColor = (index) => {
    if (index <= 100 && index > 70) return 'text-emerald-600 bg-emerald-50';
    if (index <= 70 && index > 40) return 'text-amber-600 bg-amber-50';
    return 'text-slate-600 bg-slate-50';
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value || 0);
  };

  const whatsappLink = client.whatsapp 
    ? `https://wa.me/55${client.whatsapp.replace(/\D/g, '')}`
    : null;

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden hover:shadow-md transition-shadow">
      <div className="p-4">
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3">
            {rank && (
              <div className="w-8 h-8 bg-[#1e3a5f] text-white rounded-full flex items-center justify-center text-sm font-bold">
                {rank}
              </div>
            )}
            <div>
              <h3 className="font-semibold text-slate-900 line-clamp-1">
                {client.trade_name || client.company_name}
              </h3>
              <p className="text-xs text-slate-500">{client.segment || 'Não categorizado'}</p>
            </div>
          </div>
          <div className={`${getOpportunityColor(client.opportunity_index || 0)} px-2.5 py-1 rounded-full`}>
            <span className="text-xs font-bold">{client.opportunity_index || 0}</span>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-3 gap-2 mb-4">
          <div className="bg-slate-50 rounded-xl p-2.5 text-center">
            <div className="flex items-center justify-center gap-1 text-slate-500 mb-1">
              <Calendar className="w-3 h-3" />
              <span className="text-[10px] uppercase font-medium">Dias</span>
            </div>
            <p className="text-lg font-bold text-slate-900">
              {daysSinceLastPurchase ?? '-'}
            </p>
          </div>
          <div className="bg-slate-50 rounded-xl p-2.5 text-center">
            <div className="flex items-center justify-center gap-1 text-slate-500 mb-1">
              <TrendingUp className="w-3 h-3" />
              <span className="text-[10px] uppercase font-medium">Ciclo</span>
            </div>
            <p className="text-lg font-bold text-slate-900">
              {client.average_purchase_cycle ? `${client.average_purchase_cycle}d` : '-'}
            </p>
          </div>
          <div className="bg-slate-50 rounded-xl p-2.5 text-center">
            <div className="flex items-center justify-center gap-1 text-slate-500 mb-1">
              <Package className="w-3 h-3" />
              <span className="text-[10px] uppercase font-medium">Ticket</span>
            </div>
            <p className="text-sm font-bold text-slate-900">
              {client.average_ticket ? `${(client.average_ticket / 1000).toFixed(0)}k` : '-'}
            </p>
          </div>
        </div>

        {/* Last Purchase Info */}
        {client.last_purchase_product && (
          <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-3 mb-3">
            <p className="text-xs text-emerald-700 font-medium mb-1">Última compra:</p>
            <p className="text-sm text-emerald-900 font-semibold line-clamp-1">
              {client.last_purchase_product}
            </p>
            <p className="text-xs text-emerald-600 mt-1">
              {formatCurrency(client.last_purchase_value)}
            </p>
          </div>
        )}

        {/* Last Quote Info */}
        {client.last_quoted_product && (
          <div className="bg-blue-50 border border-blue-100 rounded-xl p-3 mb-3">
            <p className="text-xs text-blue-700 font-medium mb-1">Último orçamento:</p>
            <p className="text-sm text-blue-900 font-semibold line-clamp-1">
              {client.last_quoted_product}
            </p>
            <div className="flex items-center justify-between mt-1">
              <p className="text-xs text-blue-600">
                {formatCurrency(client.last_quoted_value)}
              </p>
              <p className="text-xs text-blue-500">
                {client.last_quoted_date && new Date(client.last_quoted_date).toLocaleDateString('pt-BR')}
              </p>
            </div>
          </div>
        )}

        {/* Inactivity Warning */}
        {client.inactive_count > 0 && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-2.5 mb-3">
            <p className="text-xs text-amber-800 font-medium">
              ⚠️ Ficou inativo {client.inactive_count}x - Prospectar ativamente
            </p>
            {client.reactivation_notes && (
              <p className="text-xs text-amber-700 mt-1 line-clamp-2">
                {client.reactivation_notes}
              </p>
            )}
          </div>
        )}

        {/* Status Badge */}
        <div className="flex items-center gap-2 mb-4">
          <Badge className={`${status.color} text-white text-xs`}>
            <StatusIcon className="w-3 h-3 mr-1" />
            {status.text}
          </Badge>
          {daysSinceLastPurchase > (client.average_purchase_cycle || 30) && (
            <Badge variant="outline" className="text-red-600 border-red-200 text-xs">
              Acima do ciclo
            </Badge>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          <Link to={createPageUrl(`Quotes?clientId=${client.id}`)} className="flex-1">
            <Button size="sm" className="w-full bg-[#1e3a5f] hover:bg-[#2d4a6f] text-xs">
              <FileText className="w-3.5 h-3.5 mr-1.5" />
              Orçamento
            </Button>
          </Link>
          {whatsappLink && (
            <a href={whatsappLink} target="_blank" rel="noopener noreferrer">
              <Button size="sm" variant="outline" className="text-emerald-600 border-emerald-200 hover:bg-emerald-50">
                <MessageCircle className="w-4 h-4" />
              </Button>
            </a>
          )}
          {client.phone && (
            <a href={`tel:${client.phone}`}>
              <Button size="sm" variant="outline" className="text-blue-600 border-blue-200 hover:bg-blue-50">
                <Phone className="w-4 h-4" />
              </Button>
            </a>
          )}
        </div>
      </div>
    </div>
  );
}