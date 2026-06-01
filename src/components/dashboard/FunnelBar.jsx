import React from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';

export default function FunnelBar({ opportunities = [] }) {
  const stages = [
    { id: 'proposta_enviada', label: 'Proposta',    color: 'bg-blue-500',    light: 'bg-blue-50',    text: 'text-blue-700' },
    { id: 'em_negociacao',   label: 'Negociação',  color: 'bg-amber-500',   light: 'bg-amber-50',   text: 'text-amber-700' },
    { id: 'ganho',           label: 'Ganho',       color: 'bg-emerald-500', light: 'bg-emerald-50', text: 'text-emerald-700' },
    { id: 'perdido',         label: 'Perdido',     color: 'bg-red-500',     light: 'bg-red-50',     text: 'text-red-700' },
  ];
  const fmt = (v) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(v || 0);

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-slate-800 text-sm">Funil Comercial</h3>
        <Link to={createPageUrl('Opportunities')} className="text-xs text-blue-600 hover:underline font-medium">Ver CRM →</Link>
      </div>
      <div className="grid grid-cols-4 gap-3">
        {stages.map(stage => {
          const opps = opportunities.filter(o => o.stage === stage.id);
          const value = opps.reduce((s, o) => s + (o.value_estimated || o.total_value || 0), 0);
          return (
            <Link key={stage.id} to={createPageUrl('Opportunities')} className="block">
              <div className={`${stage.light} rounded-xl p-3 text-center hover:shadow-sm transition-shadow`}>
                <div className={`w-8 h-1.5 rounded-full ${stage.color} mx-auto mb-2`} />
                <p className={`text-2xl font-bold ${stage.text}`}>{opps.length}</p>
                <p className="text-[10px] text-slate-500 font-medium mt-0.5">{stage.label}</p>
                <p className="text-[10px] font-semibold text-slate-600 mt-1">{fmt(value)}</p>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}