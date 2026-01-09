import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { ChevronDown, FileText, MessageCircle, Mail, Phone } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';

export default function PurchaseCycleActionMenu({ client }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button size="sm" variant="outline" className="text-xs gap-1">
          Ações
          <ChevronDown className="w-3 h-3" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        {/* Criar orçamento */}
        <DropdownMenuItem asChild>
          <Link to={createPageUrl('Quotes')} className="flex items-center gap-2 cursor-pointer">
            <FileText className="w-4 h-4" />
            <span>Criar Orçamento</span>
          </Link>
        </DropdownMenuItem>

        {/* Cobrar cotação */}
        <DropdownMenuItem asChild>
          <button 
            onClick={() => {
              const message = `Olá ${client.trade_name || client.company_name}! Gostaria de enviar uma cotação. Você poderia confirmar se está interessado? Aguardo retorno!`;
              window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, '_blank');
            }}
            className="flex items-center gap-2 w-full text-left cursor-pointer hover:bg-slate-100 px-2 py-1.5 rounded text-sm"
          >
            <MessageCircle className="w-4 h-4" />
            <span>Cobrar Cotação (WhatsApp)</span>
          </button>
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        {/* Entrar em contato */}
        {client.whatsapp && (
          <DropdownMenuItem asChild>
            <button 
              onClick={() => window.open(`https://wa.me/${client.whatsapp.replace(/\D/g, '')}`, '_blank')}
              className="flex items-center gap-2 w-full text-left cursor-pointer hover:bg-slate-100 px-2 py-1.5 rounded text-sm"
            >
              <MessageCircle className="w-4 h-4 text-green-600" />
              <span>WhatsApp</span>
            </button>
          </DropdownMenuItem>
        )}

        {client.email && (
          <DropdownMenuItem asChild>
            <a 
              href={`mailto:${client.email}`}
              className="flex items-center gap-2 w-full text-left cursor-pointer hover:bg-slate-100 px-2 py-1.5 rounded text-sm"
            >
              <Mail className="w-4 h-4 text-blue-600" />
              <span>E-mail</span>
            </a>
          </DropdownMenuItem>
        )}

        {client.phone && (
          <DropdownMenuItem asChild>
            <a 
              href={`tel:${client.phone}`}
              className="flex items-center gap-2 w-full text-left cursor-pointer hover:bg-slate-100 px-2 py-1.5 rounded text-sm"
            >
              <Phone className="w-4 h-4 text-slate-600" />
              <span>Ligar</span>
            </a>
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}