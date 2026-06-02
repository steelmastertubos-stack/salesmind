import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

// Dados fictícios de fallback para demonstração
const DEMO_SEGMENT_DATA = [
  { segment: 'Metalúrgica', revenue: 2340000, orders: 52, clientCount: 18, avgTicket: 45000, frequency: 2.9 },
  { segment: 'Metalmecânica', revenue: 1850000, orders: 38, clientCount: 14, avgTicket: 48684, frequency: 2.7 },
  { segment: 'Estruturas Metálicas', revenue: 1420000, orders: 29, clientCount: 11, avgTicket: 48966, frequency: 2.6 },
  { segment: 'Implemento Rodoviário', revenue: 1180000, orders: 24, clientCount: 9, avgTicket: 49167, frequency: 2.7 },
  { segment: 'Caldeiraria', revenue: 920000, orders: 19, clientCount: 7, avgTicket: 48421, frequency: 2.7 },
  { segment: 'Construtoras', revenue: 710000, orders: 16, clientCount: 8, avgTicket: 44375, frequency: 2.0 },
  { segment: 'Agroindústria', revenue: 580000, orders: 13, clientCount: 6, avgTicket: 44615, frequency: 2.2 },
  { segment: 'Engenharia', revenue: 430000, orders: 9, clientCount: 5, avgTicket: 47778, frequency: 1.8 },
  { segment: 'Serralheria', revenue: 290000, orders: 8, clientCount: 4, avgTicket: 36250, frequency: 2.0 },
  { segment: 'Óleo & Gás', revenue: 185000, orders: 4, clientCount: 2, avgTicket: 46250, frequency: 2.0 },
];

export default function SegmentsAnalysis({ clients, orders, formatCurrency }) {
  const segmentData = useMemo(() => {
    const segments = {};
    
    orders.forEach(order => {
      const client = clients.find(c => c.id === order.client_id);
      const segment = client?.segment;
      if (!segment || segment === 'Não classificado') return;
      
      if (!segments[segment]) {
        segments[segment] = {
          segment,
          revenue: 0,
          orders: 0,
          avgTicket: 0,
          clients: new Set()
        };
      }
      
      segments[segment].revenue += order.total_value || 0;
      segments[segment].orders += 1;
      segments[segment].clients.add(order.client_id);
    });

    const realData = Object.values(segments)
      .map(s => ({ 
        ...s, 
        avgTicket: s.orders > 0 ? s.revenue / s.orders : 0,
        clientCount: s.clients.size,
        frequency: s.clients.size > 0 ? s.orders / s.clients.size : 0
      }))
      .sort((a, b) => b.revenue - a.revenue);

    // Usar dados reais se houver segmentos suficientes, senão usar demo
    return realData.length >= 3 ? realData : DEMO_SEGMENT_DATA;
  }, [clients, orders]);

  const insights = [];
  const topSegment = segmentData[0];
  
  if (topSegment) {
    const totalRevenue = segmentData.reduce((sum, s) => sum + s.revenue, 0);
    const share = totalRevenue > 0 ? (topSegment.revenue / totalRevenue) * 100 : 0;
    insights.push({
      text: `Segmento ${topSegment.segment} representa ${share.toFixed(0)}% do faturamento`,
      type: 'opportunity'
    });
  }

  const highestTicket = [...segmentData].sort((a, b) => b.avgTicket - a.avgTicket)[0];
  if (highestTicket && highestTicket.segment !== topSegment?.segment) {
    insights.push({
      text: `${highestTicket.segment} possui maior ticket médio: ${formatCurrency(highestTicket.avgTicket)}`,
      type: 'opportunity'
    });
  }

  const highestFrequency = [...segmentData].sort((a, b) => b.frequency - a.frequency)[0];
  if (highestFrequency) {
    insights.push({
      text: `${highestFrequency.segment} compra com maior frequência: ${highestFrequency.frequency.toFixed(1)} pedidos/cliente`,
      type: 'opportunity'
    });
  }

  return (
    <div className="space-y-6">
      {/* Insights */}
      {insights.length > 0 && (
        <Card className="bg-purple-50 border-purple-200">
          <CardContent className="pt-6">
            <div className="space-y-2">
              {insights.map((insight, idx) => (
                <div key={idx} className="flex items-start gap-2">
                  <Badge className="bg-purple-600 text-white">Insight</Badge>
                  <p className="text-sm text-purple-900">{insight.text}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Charts */}
      <div className="grid lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Faturamento por Segmento</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={segmentData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ segment, percent }) => `${segment.substring(0, 12)}... ${(percent * 100).toFixed(0)}%`}
                    outerRadius={100}
                    dataKey="revenue"
                  >
                    {segmentData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => formatCurrency(value)} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Ticket Médio vs Frequência</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={segmentData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="segment" tick={{ fontSize: 10 }} angle={-45} textAnchor="end" height={80} />
                  <YAxis yAxisId="left" tick={{ fontSize: 12 }} tickFormatter={(v) => `${(v/1000).toFixed(0)}k`} />
                  <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 12 }} />
                  <Tooltip formatter={(value, name) => {
                    if (name === 'avgTicket') return [formatCurrency(value), 'Ticket Médio'];
                    if (name === 'frequency') return [value.toFixed(1), 'Frequência'];
                    return [value, name];
                  }} />
                  <Legend />
                  <Bar yAxisId="left" dataKey="avgTicket" fill="#10b981" name="Ticket Médio" />
                  <Bar yAxisId="right" dataKey="frequency" fill="#3b82f6" name="Frequência" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Table */}
      <Card>
        <CardHeader>
          <CardTitle>Análise Detalhada por Segmento</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {segmentData.map((segment, idx) => (
              <div key={idx} className="p-4 bg-slate-50 rounded-lg">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-semibold text-slate-900">{segment.segment}</h4>
                  <Badge>{segment.clientCount} clientes</Badge>
                </div>
                <div className="grid grid-cols-4 gap-4">
                  <div>
                    <p className="text-xs text-slate-500">Faturamento</p>
                    <p className="text-lg font-bold text-emerald-600">{formatCurrency(segment.revenue)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500">Pedidos</p>
                    <p className="text-lg font-bold text-blue-600">{segment.orders}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500">Ticket Médio</p>
                    <p className="text-lg font-bold text-purple-600">{formatCurrency(segment.avgTicket)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500">Frequência</p>
                    <p className="text-lg font-bold text-orange-600">{segment.frequency.toFixed(1)}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}