import React from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Flame, Clock } from 'lucide-react';

function ScoreBadge({ score }) {
  if (score >= 81) return <span className="text-[10px] font-bold px-2 py-0.5 bg-red-100 text-red-700 rounded-full">🔥 Máx</span>;
  if (score >= 61) return <span className="text-[10px] font-bold px-2 py-0.5 bg-amber-100 text-amber-700 rounded-full">Quente</span>;
  if (score >= 31) return <span className="text-[10px] font-bold px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full">Morno</span>;
  return <span className="text-[10px] font-bold px-2 py-0.5 bg-slate-100 text-slate-500 rounded-full">Frio</span>;
}

export default function PriorityOpportunitiesPanel({ opportunities = [] }) {
  const fmt = (v) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(v || 0);
  const active = opportunities
    .filter(o => o.stage !== 'ganho' && o.stage !== 'perdido')
    .sort((a, b) => (b.priority_score || 0) - (a.priority_score || 0))
    .slice(0, 6);

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Flame className="w-4 h-4 text-red-500" />
          <h3 className="font-semibold text-slate-800 text-sm">Oportunidades Prioritárias</h3>
        </div>
        <Link to={createPageUrl('Opportunities')} className="text-xs text-blue-600 hover:underline font-medium">Ver CRM →</Link>
      </div>
      {active.length === 0 ? (
        <p className="text-sm text-slate-400 text-center py-6">Nenhuma oportunidade ativa</p>
      ) : (
        <div className="space-y-2">
          {active.map(opp => {
            const overdue = opp.next_action_date && opp.next_action_date < new Date().toISOString().split('T')[0];
            return (
              <div key={opp.id} className={`flex items-center gap-3 p-3 rounded-xl border transition-colors hover:bg-slate-50 ${overdue ? 'border-red-200 bg-red-50/40' : 'border-slate-100'}`}>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-slate-800 truncate">{opp.client_name}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-xs font-bold text-emerald-600">{fmt(opp.value_estimated || opp.total_value)}</span>
                    {(opp.days_without_contact || 0) > 0 && (
                      <span className="flex items-center gap-1 text-[10px] text-slate-400">
                        <Clock className="w-2.5 h-2.5" />{opp.days_without_contact}d
                      </span>
                    )}
                  </div>
                </div>
                <ScoreBadge score={opp.priority_score || 0} />
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}