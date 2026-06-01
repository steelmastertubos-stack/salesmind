import React from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { DollarSign, Clock, CheckCircle2, TrendingUp } from 'lucide-react';

export default function CommissionSummaryPanel({ commissions = [], installments = [] }) {
  const fmt = (v) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(v || 0);
  const today = new Date().toISOString().split('T')[0];

  const prevista = commissions.filter(c => c.status === 'prevista').reduce((s, c) => s + (c.commission_total_value || c.commission_value || 0), 0);
  const aReceber = installments.filter(i => i.status === 'a_receber').reduce((s, i) => s + (i.installment_value || 0), 0);
  const recebida = installments.filter(i => i.status === 'recebida').reduce((s, i) => s + (i.received_value || i.installment_value || 0), 0);
  const atrasada = installments.filter(i => i.status !== 'recebida' && i.due_date && i.due_date < today).reduce((s, i) => s + (i.installment_value || 0), 0);

  const items = [
    { label: 'Prevista',   value: prevista,  icon: TrendingUp,  color: 'text-blue-600',    bg: 'bg-blue-50' },
    { label: 'A Receber',  value: aReceber,  icon: Clock,       color: 'text-amber-600',   bg: 'bg-amber-50' },
    { label: 'Recebida',   value: recebida,  icon: CheckCircle2,color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { label: 'Atrasada',   value: atrasada,  icon: DollarSign,  color: 'text-red-600',     bg: 'bg-red-50' },
  ];

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <DollarSign className="w-4 h-4 text-emerald-500" />
          <h3 className="font-semibold text-slate-800 text-sm">Comissões</h3>
        </div>
        <Link to={createPageUrl('Financeiro')} className="text-xs text-blue-600 hover:underline font-medium">Financeiro →</Link>
      </div>
      <div className="grid grid-cols-2 gap-2">
        {items.map(item => (
          <div key={item.label} className={`${item.bg} rounded-xl p-3`}>
            <p className={`text-base font-bold ${item.color}`}>{fmt(item.value)}</p>
            <p className="text-[10px] text-slate-500 font-medium mt-0.5">{item.label}</p>
          </div>
        ))}
      </div>
    </div>
  );
}