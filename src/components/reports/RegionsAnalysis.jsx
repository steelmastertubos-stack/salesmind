import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MapPin, TrendingUp, TrendingDown } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function RegionsAnalysis({ orders, onClickState, formatCurrency }) {
  const regionData = useMemo(() => {
    const states = {};
    
    orders.forEach(order => {
      const state = order.client_state || 'Não informado';
      if (!states[state]) {
        states[state] = {
          state,
          revenue: 0,
          orders: 0,
          avgTicket: 0,
          weight: 0
        };
      }
      states[state].revenue += order.total_value || 0;
      states[state].orders += 1;
      states[state].weight += order.total_weight || 0;
    });

    return Object.values(states)
      .map(s => ({ ...s, avgTicket: s.orders > 0 ? s.revenue / s.orders : 0 }))
      .sort((a, b) => b.revenue - a.revenue);
  }, [orders]);

  const topState = regionData[0];
  const insights = [];

  if (topState) {
    insights.push({
      text: `${topState.state} lidera em volume com ${formatCurrency(topState.revenue)} (${topState.orders} pedidos)`,
      type: 'opportunity'
    });
  }

  const highestTicket = [...regionData].sort((a, b) => b.avgTicket - a.avgTicket)[0];
  if (highestTicket && highestTicket.state !== topState?.state) {
    insights.push({
      text: `${highestTicket.state} tem o melhor ticket médio: ${formatCurrency(highestTicket.avgTicket)}`,
      type: 'opportunity',
      filters: { state: highestTicket.state }
    });
  }

  return (
    <div className="space-y-6">
      {/* Insights */}
      {insights.length > 0 && (
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="pt-6">
            <div className="space-y-2">
              {insights.map((insight, idx) => (
                <div key={idx} className="flex items-start gap-2">
                  <Badge className="bg-blue-600 text-white">Insight</Badge>
                  <p className="text-sm text-blue-900">{insight.text}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Faturamento por Estado</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-96">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={regionData.slice(0, 10)} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis type="number" tick={{ fontSize: 12 }} tickFormatter={(v) => `${(v/1000).toFixed(0)}k`} />
                <YAxis type="category" dataKey="state" tick={{ fontSize: 12 }} width={50} />
                <Tooltip formatter={(value) => formatCurrency(value)} />
                <Bar dataKey="revenue" fill="#10b981" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardHeader>
          <CardTitle>Ranking por Estado</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {regionData.map((region, idx) => (
              <div 
                key={idx}
                className="flex items-center gap-3 p-3 hover:bg-slate-50 rounded-lg cursor-pointer transition-colors"
                onClick={() => onClickState?.(region.state)}
              >
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-white ${
                  idx === 0 ? 'bg-amber-500' :
                  idx === 1 ? 'bg-slate-400' :
                  idx === 2 ? 'bg-amber-700' :
                  'bg-slate-300'
                }`}>
                  {idx + 1}
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-slate-900">{region.state}</p>
                  <div className="flex gap-3 text-xs text-slate-500">
                    <span>{region.orders} pedidos</span>
                    <span>Ticket: {formatCurrency(region.avgTicket)}</span>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-bold text-emerald-600">{formatCurrency(region.revenue)}</p>
                  <p className="text-xs text-slate-500">{region.weight.toFixed(0)} kg</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}