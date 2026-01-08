import React from 'react';
import { Target, TrendingUp, Clock, XCircle, CheckCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';

export default function GoalsPanel({ orders = [], quotes = [] }) {
  // Calcular valores do mês atual
  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();

  const thisMonthOrders = orders.filter(o => {
    const orderDate = new Date(o.created_date);
    return orderDate.getMonth() === currentMonth && 
           orderDate.getFullYear() === currentYear &&
           o.status !== 'cancelled';
  });

  const thisMonthQuotes = quotes.filter(q => {
    const quoteDate = new Date(q.created_date);
    return quoteDate.getMonth() === currentMonth && 
           quoteDate.getFullYear() === currentYear;
  });

  // Valores
  const sold = thisMonthOrders.reduce((sum, o) => sum + (o.total_value || 0), 0);
  const negotiating = thisMonthQuotes
    .filter(q => ['sent', 'negotiating'].includes(q.status))
    .reduce((sum, q) => sum + (q.total_value || 0), 0);
  const lost = thisMonthQuotes
    .filter(q => q.status === 'lost')
    .reduce((sum, q) => sum + (q.total_value || 0), 0);

  // Meta (pode ser configurável, por enquanto 100k)
  const goal = 100000;
  
  const soldPercent = (sold / goal) * 100;
  const negotiatingPercent = (negotiating / goal) * 100;
  const lostPercent = (lost / goal) * 100;

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value || 0);
  };

  const formatPercent = (value) => {
    return `${value.toFixed(1)}%`;
  };

  return (
    <Card className="border-2 border-emerald-200 bg-gradient-to-br from-emerald-50 to-green-50 shadow-lg">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-emerald-600 rounded-xl flex items-center justify-center">
              <Target className="w-5 h-5 text-white" />
            </div>
            <div>
              <CardTitle className="text-emerald-900">Meta do Mês</CardTitle>
              <p className="text-xs text-emerald-700">
                {new Date().toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}
              </p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold text-emerald-900">{formatCurrency(goal)}</p>
            <p className="text-xs text-emerald-700">Meta mensal</p>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Vendido */}
        <div className="bg-white rounded-xl p-4 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-emerald-600" />
              <span className="font-semibold text-slate-900">Vendido</span>
            </div>
            <div className="text-right">
              <p className="text-xl font-bold text-emerald-600">{formatCurrency(sold)}</p>
              <p className="text-sm font-semibold text-emerald-700">{formatPercent(soldPercent)}</p>
            </div>
          </div>
          <Progress value={soldPercent} className="h-3 bg-emerald-100">
            <div className="h-full bg-gradient-to-r from-emerald-500 to-emerald-600 rounded-full transition-all" />
          </Progress>
          <p className="text-xs text-slate-500 mt-1">{thisMonthOrders.length} pedidos fechados</p>
        </div>

        {/* Em Negociação */}
        <div className="bg-white rounded-xl p-4 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-blue-600" />
              <span className="font-semibold text-slate-900">Em Negociação</span>
            </div>
            <div className="text-right">
              <p className="text-xl font-bold text-blue-600">{formatCurrency(negotiating)}</p>
              <p className="text-sm font-semibold text-blue-700">{formatPercent(negotiatingPercent)}</p>
            </div>
          </div>
          <Progress value={negotiatingPercent} className="h-3 bg-blue-100">
            <div className="h-full bg-gradient-to-r from-blue-500 to-blue-600 rounded-full transition-all" />
          </Progress>
          <p className="text-xs text-slate-500 mt-1">
            {thisMonthQuotes.filter(q => ['sent', 'negotiating'].includes(q.status)).length} orçamentos ativos
          </p>
        </div>

        {/* Perdidos */}
        <div className="bg-white rounded-xl p-4 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <XCircle className="w-5 h-5 text-red-600" />
              <span className="font-semibold text-slate-900">Perdidos</span>
            </div>
            <div className="text-right">
              <p className="text-xl font-bold text-red-600">{formatCurrency(lost)}</p>
              <p className="text-sm font-semibold text-red-700">{formatPercent(lostPercent)}</p>
            </div>
          </div>
          <Progress value={lostPercent} className="h-3 bg-red-100">
            <div className="h-full bg-gradient-to-r from-red-500 to-red-600 rounded-full transition-all" />
          </Progress>
          <p className="text-xs text-slate-500 mt-1">
            {thisMonthQuotes.filter(q => q.status === 'lost').length} orçamentos perdidos
          </p>
        </div>

        {/* Resumo */}
        <div className="bg-gradient-to-r from-slate-800 to-slate-900 rounded-xl p-4 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-slate-300 mb-1">Falta para a Meta</p>
              <p className="text-2xl font-bold">
                {formatCurrency(Math.max(0, goal - sold))}
              </p>
            </div>
            <div className="text-right">
              <div className={`text-3xl font-bold ${soldPercent >= 100 ? 'text-emerald-400' : 'text-white'}`}>
                {formatPercent(soldPercent)}
              </div>
              <p className="text-xs text-slate-300">
                {soldPercent >= 100 ? '🎉 Meta batida!' : 'da meta'}
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}