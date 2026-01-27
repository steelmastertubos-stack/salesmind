import React from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { 
  Building2,
  Phone, 
  MessageCircle, 
  FileText, 
  MoreVertical,
  Calendar,
  TrendingUp,
  AlertTriangle,
  Clock,
  MapPin
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function ClientCard({ client, onEdit, onAddFollowUp }) {
  const daysSinceLastPurchase = client.last_purchase_date 
    ? Math.floor((new Date() - new Date(client.last_purchase_date)) / (1000 * 60 * 60 * 24))
    : null;

  const getStatusConfig = () => {
    switch (client.status) {
      case 'at_risk':
        return { color: 'bg-red-100 text-red-700 border-red-200', dot: 'bg-red-500', label: 'Em Risco' };
      case 'attention':
        return { color: 'bg-amber-100 text-amber-700 border-amber-200', dot: 'bg-amber-500', label: 'Atenção' };
      case 'inactive':
        return { color: 'bg-slate-100 text-slate-700 border-slate-200', dot: 'bg-slate-400', label: 'Inativo' };
      default:
        return { color: 'bg-emerald-100 text-emerald-700 border-emerald-200', dot: 'bg-emerald-500', label: 'Ativo' };
    }
  };

  const status = getStatusConfig();

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
    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden hover:shadow-md transition-all">
      {/* Header */}
      <div className="p-4 border-b border-slate-100">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-[#1e3a5f] to-[#2d4a6f] rounded-xl flex items-center justify-center text-white font-bold">
              {(client.trade_name || client.company_name || '?').charAt(0)}
            </div>
            <div>
              <h3 className="font-semibold text-slate-900 line-clamp-1">
                {client.trade_name || client.company_name}
              </h3>
              <div className="flex items-center gap-2 text-xs text-slate-500">
                <span>{client.cnpj}</span>
                {client.city && (
                  <>
                    <span>•</span>
                    <span className="flex items-center gap-0.5">
                      <MapPin className="w-3 h-3" />
                      {client.city}/{client.state}
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreVertical className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onEdit(client)}>
                Editar Cliente
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onAddFollowUp(client)}>
                Registrar Follow-up
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link to={createPageUrl(`ClientDetails?id=${client.id}`)}>
                  Ver Histórico Completo
                </Link>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Stats */}
      <div className="p-4 grid grid-cols-4 gap-3">
        <div className="text-center">
          <p className="text-xs text-slate-500 mb-1">Dias s/ compra</p>
          <p className="text-lg font-bold text-slate-900">{daysSinceLastPurchase ?? '-'}</p>
        </div>
        <div className="text-center">
          <p className="text-xs text-slate-500 mb-1">Ciclo médio</p>
          <p className="text-lg font-bold text-slate-900">
            {client.average_purchase_cycle ? `${client.average_purchase_cycle}d` : '-'}
          </p>
        </div>
        <div className="text-center">
          <p className="text-xs text-slate-500 mb-1">Ticket médio</p>
          <p className="text-sm font-bold text-slate-900">
            {client.average_ticket ? `R$ ${(client.average_ticket / 1000).toFixed(0)}k` : '-'}
          </p>
        </div>
        <div className="text-center">
          <p className="text-xs text-slate-500 mb-1">Índice</p>
          <div className={`inline-flex items-center justify-center w-10 h-10 rounded-full ${
            client.opportunity_index > 70 ? 'bg-emerald-100 text-emerald-700' :
            client.opportunity_index > 40 ? 'bg-amber-100 text-amber-700' :
            'bg-slate-100 text-slate-700'
          }`}>
            <span className="text-sm font-bold">{client.opportunity_index || 0}</span>
          </div>
        </div>
      </div>

      {/* Last Purchase */}
      {client.last_purchase_product && (
        <div className="px-4 pb-3">
          <div className="bg-slate-50 rounded-xl p-3">
            <p className="text-xs text-slate-500 mb-1">Última compra</p>
            <p className="text-sm font-medium text-slate-900 line-clamp-1">{client.last_purchase_product}</p>
            <div className="flex items-center justify-between mt-1">
              <span className="text-xs text-slate-500">
                {client.last_purchase_date && new Date(client.last_purchase_date).toLocaleDateString('pt-BR')}
              </span>
              <span className="text-sm font-semibold text-emerald-600">
                {formatCurrency(client.last_purchase_value)}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
        <Badge className={status.color}>
          <span className={`w-1.5 h-1.5 rounded-full ${status.dot} mr-1.5`}></span>
          {status.label}
        </Badge>
        
        <div className="flex gap-2">
          <Link to={createPageUrl(`Quotes?clientId=${client.id}`)}>
            <Button size="sm" className="bg-[#1e3a5f] hover:bg-[#2d4a6f] h-8 text-xs">
              <FileText className="w-3.5 h-3.5 mr-1" />
              Orçar
            </Button>
          </Link>
          {whatsappLink && (
            <a href={whatsappLink} target="_blank" rel="noopener noreferrer">
              <Button size="sm" variant="outline" className="h-8 text-emerald-600 border-emerald-200 hover:bg-emerald-50">
                <MessageCircle className="w-4 h-4" />
              </Button>
            </a>
          )}
          {client.phone && (
            <a href={`tel:${client.phone}`}>
              <Button size="sm" variant="outline" className="h-8 text-blue-600 border-blue-200 hover:bg-blue-50">
                <Phone className="w-4 h-4" />
              </Button>
            </a>
          )}
        </div>
      </div>
    </div>
  );
}