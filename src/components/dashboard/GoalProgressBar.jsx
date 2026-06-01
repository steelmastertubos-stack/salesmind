import React from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Target } from 'lucide-react';

export default function GoalProgressBar({ revenue = 0, goal = 0 }) {
  const pct = goal > 0 ? Math.min((revenue / goal) * 100, 100) : 0;
  const remaining = Math.max(goal - revenue, 0);
  const fmt = (v) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(v || 0);
  const color = pct >= 100 ? 'bg-emerald-500' : pct >= 70 ? 'bg-blue-500' : pct >= 40 ? 'bg-amber-500' : 'bg-red-500';
  const textColor = pct >= 100 ? 'text-emerald-600' : pct >= 70 ? 'text-blue-600' : pct >= 40 ? 'text-amber-600' : 'text-red-600';

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-5">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Target className="w-4 h-4 text-slate-500" />
          <h3 className="font-semibold text-slate-800 text-sm">Meta do Mês</h3>
        </div>
        <Link to={createPageUrl('Reports')} className="text-xs text-blue-600 hover:underline font-medium">Relatórios →</Link>
      </div>
      <div className="flex items-end justify-between mb-2">
        <div>
          <p className={`text-2xl font-bold ${textColor}`}>{fmt(revenue)}</p>
          <p className="text-xs text-slate-500 mt-0.5">de {fmt(goal)} · Meta mensal</p>
        </div>
        <p className={`text-3xl font-bold ${textColor}`}>{pct.toFixed(0)}%</p>
      </div>
      <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden">
        <div className={`h-full rounded-full transition-all duration-500 ${color}`} style={{ width: `${pct}%` }} />
      </div>
      {remaining > 0 ? (
        <p className="text-xs text-slate-400 mt-2">Faltam {fmt(remaining)} para atingir a meta</p>
      ) : (
        <p className="text-xs text-emerald-600 font-semibold mt-2">🎯 Meta atingida!</p>
      )}
    </div>
  );
}