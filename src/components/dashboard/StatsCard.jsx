import React from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';

export default function StatsCard({ title, value, subtitle, icon: Icon, trend, trendValue, color = 'emerald' }) {
  const colorClasses = {
    emerald: {
      bg: 'bg-emerald-50',
      icon: 'bg-emerald-500',
      text: 'text-emerald-600'
    },
    blue: {
      bg: 'bg-blue-50',
      icon: 'bg-blue-500',
      text: 'text-blue-600'
    },
    amber: {
      bg: 'bg-amber-50',
      icon: 'bg-amber-500',
      text: 'text-amber-600'
    },
    purple: {
      bg: 'bg-purple-50',
      icon: 'bg-purple-500',
      text: 'text-purple-600'
    },
    slate: {
      bg: 'bg-slate-50',
      icon: 'bg-slate-500',
      text: 'text-slate-600'
    }
  };

  const colors = colorClasses[color] || colorClasses.emerald;

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-4 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-3">
        <div className={`${colors.icon} w-10 h-10 rounded-xl flex items-center justify-center`}>
          <Icon className="w-5 h-5 text-white" />
        </div>
        {trend && (
          <div className={`flex items-center gap-1 text-xs font-medium ${trend === 'up' ? 'text-emerald-600' : 'text-red-600'}`}>
            {trend === 'up' ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
            {trendValue}
          </div>
        )}
      </div>
      <p className="text-2xl font-bold text-slate-900 mb-0.5">{value}</p>
      <p className="text-xs text-slate-500 font-medium uppercase tracking-wide">{title}</p>
      {subtitle && (
        <p className="text-xs text-slate-400 mt-1">{subtitle}</p>
      )}
    </div>
  );
}