import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { AlertTriangle, Clock, Users, RefreshCw, DollarSign, ChevronDown, ChevronUp } from 'lucide-react';

function AlertRow({ icon: Icon, color, label, count, value, href, children }) {
  const [open, setOpen] = useState(false);
  const colors = {
    red: 'bg-red-50 border-red-200 text-red-700',
    amber: 'bg-amber-50 border-amber-200 text-amber-700',
    blue: 'bg-blue-50 border-blue-200 text-blue-700',
    purple: 'bg-violet-50 border-violet-200 text-violet-700',
  };
  if (count === 0) return null;
  return (
    <div className={`rounded-xl border p-3 ${colors[color]}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Icon className="w-4 h-4 flex-shrink-0" />
          <span className="text-sm font-semibold">{label}</span>
          <span className="text-xs bg-white/60 px-1.5 py-0.5 rounded-full font-bold">{count}</span>
        </div>
        <div className="flex items-center gap-2">
          {value && <span className="text-xs font-semibold">{value}</span>}
          {children && (
            <button onClick={() => setOpen(o => !o)} className="p-0.5">
              {open ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
            </button>
          )}
          {href && <Link to={href} className="text-xs underline hover:no-underline">Ver</Link>}
        </div>
      </div>
      {open && children && <div className="mt-2 pt-2 border-t border-current/20 space-y-1">{children}</div>}
    </div>
  );
}

export default function AlertsSummaryPanel({ clients = [], tasks = [], opportunities = [], installments = [] }) {
  const now = new Date();
  const today = now.toISOString().split('T')[0];

  const overdueTasks = tasks.filter(t => t.status === 'pending' && t.scheduled_date < today);
  const atRiskClients = clients.filter(c => c.status === 'at_risk' || c.status === 'inactive');
  const stalledOpps = opportunities.filter(o => {
    if (o.stage === 'ganho' || o.stage === 'perdido') return false;
    return (o.days_without_contact || 0) >= 7;
  });
  const overdueInstallments = installments.filter(i => {
    if (i.status === 'recebida') return false;
    return i.due_date && i.due_date < today;
  });
  const overdueCommValue = overdueInstallments.reduce((s, i) => s + (i.installment_value || 0), 0);
  const fmt = (v) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(v);

  const hasAlerts = overdueTasks.length > 0 || atRiskClients.length > 0 || stalledOpps.length > 0 || overdueInstallments.length > 0;

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-5">
      <h3 className="font-semibold text-slate-800 text-sm mb-3">Central de Alertas</h3>
      {!hasAlerts ? (
        <div className="text-center py-6 text-slate-400">
          <div className="w-10 h-10 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-2">
            <AlertTriangle className="w-5 h-5 text-emerald-400" />
          </div>
          <p className="text-xs font-medium text-emerald-600">Tudo em dia!</p>
        </div>
      ) : (
        <div className="space-y-2">
          <AlertRow icon={Clock} color="red" label="Follow-ups atrasados" count={overdueTasks.length} href={createPageUrl('Tasks')}>
            {overdueTasks.slice(0, 3).map(t => <p key={t.id} className="text-xs">• {t.title} — {t.client_name || 'Sem cliente'}</p>)}
          </AlertRow>
          <AlertRow icon={Users} color="amber" label="Clientes em risco" count={atRiskClients.length} href={createPageUrl('Clients')}>
            {atRiskClients.slice(0, 3).map(c => <p key={c.id} className="text-xs">• {c.trade_name || c.company_name}</p>)}
          </AlertRow>
          <AlertRow icon={RefreshCw} color="blue" label="Oportunidades paradas" count={stalledOpps.length} href={createPageUrl('Opportunities')}>
            {stalledOpps.slice(0, 3).map(o => <p key={o.id} className="text-xs">• {o.client_name} — {o.days_without_contact}d sem contato</p>)}
          </AlertRow>
          <AlertRow icon={DollarSign} color="purple" label="Comissões em atraso" count={overdueInstallments.length} value={fmt(overdueCommValue)} href={createPageUrl('Financeiro')} />
        </div>
      )}
    </div>
  );
}