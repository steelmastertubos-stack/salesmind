import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp, TrendingDown, DollarSign, Package, Users, Target, BarChart3, AlertCircle } from 'lucide-react';
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const KPI_ICONS = {
  total_orders: Package,
  total_value: DollarSign,
  avg_ticket: TrendingUp,
  conversion_rate: Target,
  total_quotes: BarChart3,
  active_opportunities: Target,
  new_clients: Users,
  clients_at_risk: AlertCircle,
  total_commission: DollarSign,
  commission_pending: AlertCircle,
  margin_avg: TrendingUp,
  total_weight: Package
};

function KPICard({ kpiId, data, comparisonData }) {
  const Icon = KPI_ICONS[kpiId] || BarChart3;
  const value = data?.[kpiId] || 0;
  const previousValue = comparisonData?.[kpiId] || 0;
  const change = previousValue > 0 ? ((value - previousValue) / previousValue) * 100 : 0;
  const isPositive = change >= 0;

  const formatValue = (v) => {
    if (kpiId.includes('value') || kpiId.includes('commission') || kpiId.includes('ticket')) {
      return `R$ ${v.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;
    }
    if (kpiId.includes('rate') || kpiId.includes('margin')) {
      return `${v.toFixed(1)}%`;
    }
    if (kpiId.includes('weight')) {
      return `${v.toLocaleString('pt-BR')} kg`;
    }
    return v.toLocaleString('pt-BR');
  };

  const getKPIName = (id) => {
    const kpi = AVAILABLE_KPIS.find(k => k.id === id);
    return kpi?.name || id;
  };

  return (
    <Card className="hover:shadow-lg transition-all">
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <p className="text-sm text-slate-500 mb-1">{getKPIName(kpiId)}</p>
            <p className="text-2xl font-bold text-slate-900">{formatValue(value)}</p>
            {comparisonData && (
              <div className={`flex items-center gap-1 mt-2 text-xs ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
                {isPositive ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                <span>{Math.abs(change).toFixed(1)}% vs período anterior</span>
              </div>
            )}
          </div>
          <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center">
            <Icon className="w-5 h-5 text-slate-600" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function ChartWidget({ chartId, data, filters }) {
  const getChartName = (id) => {
    const chart = AVAILABLE_CHARTS.find(c => c.id === id);
    return chart?.name || id;
  };

  const renderChart = () => {
    switch (chartId) {
      case 'monthly_evolution':
        return (
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={data?.monthlyData || []}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip formatter={(value) => `R$ ${value.toLocaleString('pt-BR')}`} />
              <Legend />
              <Line type="monotone" dataKey="value" stroke="#0F2A44" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        );

      case 'sales_by_principal':
        return (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={data?.principalData || []}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip formatter={(value) => `R$ ${value.toLocaleString('pt-BR')}`} />
              <Bar dataKey="value" fill="#1DB954" />
            </BarChart>
          </ResponsiveContainer>
        );

      case 'sales_by_client':
        return (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={data?.clientData || []} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" />
              <YAxis dataKey="name" type="category" width={150} />
              <Tooltip formatter={(value) => `R$ ${value.toLocaleString('pt-BR')}`} />
              <Bar dataKey="value" fill="#0F2A44" />
            </BarChart>
          </ResponsiveContainer>
        );

      case 'funnel_analysis':
        return (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={data?.funnelData || []}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="stage" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="count" fill="#3498DB" />
            </BarChart>
          </ResponsiveContainer>
        );

      case 'client_status':
        const COLORS = ['#1DB954', '#F1C40F', '#E74C3C', '#95A5A6'];
        return (
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={data?.statusData || []}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={(entry) => `${entry.name}: ${entry.value}`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {(data?.statusData || []).map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        );

      default:
        return (
          <div className="h-64 flex items-center justify-center text-slate-400">
            <p>Dados não disponíveis</p>
          </div>
        );
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{getChartName(chartId)}</CardTitle>
      </CardHeader>
      <CardContent>
        {renderChart()}
      </CardContent>
    </Card>
  );
}

export default function CustomDashboardView({ dashboard, kpiData, chartData, comparisonData, filters }) {
  return (
    <div className="space-y-6">
      {/* Header do Dashboard */}
      <div className="bg-white rounded-lg p-4 border">
        <h2 className="text-xl font-bold text-slate-900">{dashboard.name}</h2>
        {dashboard.description && (
          <p className="text-sm text-slate-600 mt-1">{dashboard.description}</p>
        )}
      </div>

      {/* KPIs Grid */}
      {dashboard.selected_kpis?.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {dashboard.selected_kpis.map(kpiId => (
            <KPICard
              key={kpiId}
              kpiId={kpiId}
              data={kpiData}
              comparisonData={comparisonData}
            />
          ))}
        </div>
      )}

      {/* Charts Grid */}
      {dashboard.selected_charts?.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {dashboard.selected_charts.map(chartId => (
            <ChartWidget
              key={chartId}
              chartId={chartId}
              data={chartData}
              filters={filters}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export { KPICard, ChartWidget, AVAILABLE_KPIS, AVAILABLE_CHARTS };