import React from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';

export default function ExecutiveKPICard({ title, value, subtitle, icon: Icon, color = 'blue', trend, trendValue, onClick, badge }) {
  const palette = {
    blue:   { bg: 'bg-blue-500',    border: 'border-blue-200',    light: 'bg-blue-50',    text: 'text-blue-600' },
    green:  { bg: 'bg-emerald-500', border: 'border-emerald-200', light: 'bg-emerald-50', text: 'text-emerald-600' },
    red:    { bg: 'bg-red-500',     border: 'border-red-200',     light: 'bg-red-50',     text: 'text-red-600' },
    purple: { bg: 'bg-violet-500',  border: 'border-violet-200',  light: 'bg-violet-50',  text: 'text-violet-600' },
    slate:  { bg: 'bg-slate-500',   border: 'border-slate-200',   light: 'bg-slate-50',   text: 'text-slate-600' },
    amber:  { bg: 'bg-amber-500',   border: 'border-amber-200',   light: 'bg-amber-50',   text: 'text-amber-600' },
  };
  const c = palette[color] || palette.blue;

  return (
    <div
      className={`bg-white rounded-2xl border ${c.border} p-4 flex flex-col gap-3 ${onClick ? 'cursor-pointer hover:shadow-md transition-shadow' : ''}`}
      onClick={onClick}
    >
      <div className="flex items-center justify-between">
        <div className={`w-9 h-9 ${c.bg} rounded-xl flex items-center justify-center`}>
          <Icon className="w-5 h-5 text-white" />
        </div>
        {badge && <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${c.light} ${c.text}`}>{badge}</span>}
        {trend && !badge && (
          <div className={`flex items-center gap-1 text-xs font-semibold ${trend === 'up' ? 'text-emerald-600' : 'text-red-500'}`}>
            {trend === 'up' ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
            {trendValue}
          </div>
        )}
      </div>
      <div>
        <p className="text-xl font-bold text-slate-900 leading-none">{value}</p>
        <p className="text-xs text-slate-500 font-medium mt-1 uppercase tracking-wide">{title}</p>
        {subtitle && <p className="text-xs text-slate-400 mt-0.5">{subtitle}</p>}
      </div>
    </div>
  );
}