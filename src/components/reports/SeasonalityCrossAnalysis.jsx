import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

const MONTHS = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

export default function SeasonalityCrossAnalysis({ clients, orders, formatCurrency }) {
  // Mês × Segmento
  const monthSegmentData = useMemo(() => {
    const data = {};
    
    orders.forEach(order => {
      const date = new Date(order.created_date);
      const month = date.getMonth();
      const client = clients.find(c => c.id === order.client_id);
      const segment = client?.segment || 'Outros';
      
      if (!data[month]) {
        data[month] = { month: MONTHS[month], monthNum: month };
      }
      
      if (!data[month][segment]) {
        data[month][segment] = 0;
      }
      
      data[month][segment] += order.total_value || 0;
    });

    return Object.values(data).sort((a, b) => a.monthNum - b.monthNum);
  }, [clients, orders]);

  // Mês × Região
  const monthRegionData = useMemo(() => {
    const data = {};
    
    orders.forEach(order => {
      const date = new Date(order.created_date);
      const month = date.getMonth();
      const region = order.client_state || 'Outros';
      
      if (!data[month]) {
        data[month] = { month: MONTHS[month], monthNum: month };
      }
      
      if (!data[month][region]) {
        data[month][region] = 0;
      }
      
      data[month][region] += order.total_value || 0;
    });

    return Object.values(data).sort((a, b) => a.monthNum - b.monthNum);
  }, [orders]);

  // Detectar padrões sazonais
  const detectSeasonality = () => {
    const insights = [];
    const monthlyTotals = monthSegmentData.map(m => {
      const total = Object.entries(m)
        .filter(([key]) => key !== 'month' && key !== 'monthNum')
        .reduce((sum, [, value]) => sum + value, 0);
      return { month: m.month, total };
    });

    const avgRevenue = monthlyTotals.reduce((sum, m) => sum + m.total, 0) / monthlyTotals.length;
    const peakMonths = monthlyTotals.filter(m => m.total > avgRevenue * 1.3);
    const lowMonths = monthlyTotals.filter(m => m.total < avgRevenue * 0.7);

    if (peakMonths.length > 0) {
      insights.push({
        text: `Meses de pico: ${peakMonths.map(m => m.month).join(', ')}. Prepare estoque e equipe.`,
        type: 'opportunity'
      });
    }

    if (lowMonths.length > 0) {
      insights.push({
        text: `Meses fracos: ${lowMonths.map(m => m.month).join(', ')}. Oportunidade para campanhas.`,
        type: 'risk'
      });
    }

    return insights;
  };

  const insights = detectSeasonality();

  // Get unique segments and regions for legend
  const segments = [...new Set(orders.map(o => clients.find(c => c.id === o.client_id)?.segment).filter(Boolean))];
  const topRegions = [...new Set(orders.map(o => o.client_state).filter(Boolean))].slice(0, 5);

  const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6'];

  return (
    <div className="space-y-6">
      {/* Insights */}
      {insights.length > 0 && (
        <Card className="bg-orange-50 border-orange-200">
          <CardContent className="pt-6">
            <div className="space-y-2">
              {insights.map((insight, idx) => (
                <div key={idx} className="flex items-start gap-2">
                  <Badge className="bg-orange-600 text-white">Sazonalidade</Badge>
                  <p className="text-sm text-orange-900">{insight.text}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Mês × Segmento */}
      <Card>
        <CardHeader>
          <CardTitle>Faturamento: Mês × Segmento</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={monthSegmentData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 12 }} tickFormatter={(v) => `${(v/1000).toFixed(0)}k`} />
                <Tooltip formatter={(value) => formatCurrency(value)} />
                <Legend />
                {segments.map((segment, idx) => (
                  <Line 
                    key={segment}
                    type="monotone" 
                    dataKey={segment} 
                    stroke={COLORS[idx % COLORS.length]} 
                    strokeWidth={2}
                    dot={{ fill: COLORS[idx % COLORS.length] }}
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Mês × Região */}
      <Card>
        <CardHeader>
          <CardTitle>Faturamento: Mês × Região (Top 5)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={monthRegionData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 12 }} tickFormatter={(v) => `${(v/1000).toFixed(0)}k`} />
                <Tooltip formatter={(value) => formatCurrency(value)} />
                <Legend />
                {topRegions.map((region, idx) => (
                  <Line 
                    key={region}
                    type="monotone" 
                    dataKey={region} 
                    stroke={COLORS[idx % COLORS.length]} 
                    strokeWidth={2}
                    dot={{ fill: COLORS[idx % COLORS.length] }}
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}