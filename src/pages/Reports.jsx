import React, { useState, useMemo } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { 
  BarChart3, 
  TrendingUp,
  TrendingDown,
  Users,
  Package,
  DollarSign,
  Calendar,
  FileText,
  Target,
  Building2,
  ArrowUpRight,
  ArrowDownRight,
  Minus,
  Filter,
  X,
  MapPin,
  Zap
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import PageHeader from '@/components/common/PageHeader';
import { Skeleton } from '@/components/ui/skeleton';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, ComposedChart, Legend } from 'recharts';
import AIInsightsBlock from '@/components/reports/AIInsightsBlock';
import AIReportAnalyzer from '@/components/reports/AIReportAnalyzer';
import RegionsAnalysis from '@/components/reports/RegionsAnalysis';
import SegmentsAnalysis from '@/components/reports/SegmentsAnalysis';
import SeasonalityCrossAnalysis from '@/components/reports/SeasonalityCrossAnalysis';
import { toast } from 'sonner';

const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316'];

export default function Reports() {
  const navigate = useNavigate();
  
  // Ler ano da URL se presente
  const urlParams = new URLSearchParams(window.location.search);
  const urlYear = urlParams.get('year');
  
  // Filtros globais
  const [period, setPeriod] = useState('all');
  const [yearFilter, setYearFilter] = useState(urlYear || 'all');
  const [comparisonPeriod, setComparisonPeriod] = useState('lastMonth');
  const [clientFilter, setClientFilter] = useState('all');
  const [principalFilter, setPrincipalFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [activeTab, setActiveTab] = useState('executive');

  // Data fetching
  const { data: orders = [], isLoading: loadingOrders } = useQuery({
    queryKey: ['orders'],
    queryFn: () => base44.entities.Order.list('-created_date', 1000)
  });

  const { data: clients = [], isLoading: loadingClients } = useQuery({
    queryKey: ['clients'],
    queryFn: () => base44.entities.Client.list('company_name', 500)
  });

  const { data: quotes = [], isLoading: loadingQuotes } = useQuery({
    queryKey: ['quotes'],
    queryFn: () => base44.entities.Quote.list('-created_date', 1000)
  });

  const { data: opportunities = [], isLoading: loadingOpportunities } = useQuery({
    queryKey: ['opportunities'],
    queryFn: () => base44.entities.Opportunity.list('-created_date', 1000)
  });

  const { data: principals = [] } = useQuery({
    queryKey: ['principals'],
    queryFn: () => base44.entities.Principal.list('company_name', 500)
  });

  const isLoading = loadingOrders || loadingClients || loadingQuotes || loadingOpportunities;

  // Get available years from data - extrair de TODAS as datas relevantes
  const availableYears = useMemo(() => {
    const years = new Set();
    
    // Adicionar anos dos pedidos (created_date, billing_date, closed_at)
    orders.forEach(order => {
      const createdDate = new Date(order.created_date);
      if (!isNaN(createdDate.getTime())) years.add(createdDate.getFullYear());
      
      if (order.billing_date) {
        const billingDate = new Date(order.billing_date);
        if (!isNaN(billingDate.getTime())) years.add(billingDate.getFullYear());
      }
      
      if (order.closed_at) {
        const closedDate = new Date(order.closed_at);
        if (!isNaN(closedDate.getTime())) years.add(closedDate.getFullYear());
      }
    });
    
    // Adicionar anos das oportunidades (created_date e won_at)
    opportunities.forEach(opp => {
      const createdDate = new Date(opp.created_date);
      if (!isNaN(createdDate.getTime())) years.add(createdDate.getFullYear());
      
      if (opp.won_at) {
        const wonDate = new Date(opp.won_at);
        if (!isNaN(wonDate.getTime())) years.add(wonDate.getFullYear());
      }
    });
    
    // Adicionar anos dos orçamentos
    quotes.forEach(quote => {
      const createdDate = new Date(quote.created_date);
      if (!isNaN(createdDate.getTime())) years.add(createdDate.getFullYear());
    });
    
    console.log('📅 Anos disponíveis:', Array.from(years).sort());
    
    return Array.from(years).sort((a, b) => b - a);
  }, [orders, quotes, opportunities]);

  // Utility functions
  const formatCurrency = (value) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value || 0);
  };

  const formatPercentage = (value) => {
    const sign = value > 0 ? '+' : '';
    return `${sign}${value.toFixed(1)}%`;
  };

  const getDateRange = (periodKey) => {
    const now = new Date();
    let start, end;

    switch (periodKey) {
      case 'thisMonth':
        start = new Date(now.getFullYear(), now.getMonth(), 1);
        end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        break;
      case 'lastMonth':
        start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        end = new Date(now.getFullYear(), now.getMonth(), 0);
        break;
      case 'thisQuarter':
        const quarter = Math.floor(now.getMonth() / 3);
        start = new Date(now.getFullYear(), quarter * 3, 1);
        end = new Date(now.getFullYear(), quarter * 3 + 3, 0);
        break;
      case 'lastQuarter':
        const lastQ = Math.floor(now.getMonth() / 3) - 1;
        const lastQYear = lastQ < 0 ? now.getFullYear() - 1 : now.getFullYear();
        const lastQMonth = lastQ < 0 ? 9 : lastQ * 3;
        start = new Date(lastQYear, lastQMonth, 1);
        end = new Date(lastQYear, lastQMonth + 3, 0);
        break;
      case 'thisYear':
        start = new Date(now.getFullYear(), 0, 1);
        end = new Date(now.getFullYear(), 11, 31);
        break;
      case 'lastYear':
        start = new Date(now.getFullYear() - 1, 0, 1);
        end = new Date(now.getFullYear() - 1, 11, 31);
        break;
      default:
        start = new Date(2000, 0, 1);
        end = now;
    }

    return { start, end };
  };

  // Filter data - usar campos corretos para cada entidade
  const filterData = (data, config = {}) => {
    return data.filter(item => {
      // Determinar campo de data baseado no tipo
      let dateField = config.dateField || 'created_date';
      
      // Para orders financeiros, usar closed_at ou billing_date
      if (config.useClosedDate && item.closed_at) {
        dateField = 'closed_at';
      } else if (config.useClosedDate && item.billing_date) {
        dateField = 'billing_date';
      }
      
      // Para opportunities ganhas, usar won_at se disponível
      if (config.useWonDate && item.won_at && item.stage === 'ganho') {
        dateField = 'won_at';
      }
      
      const date = new Date(item[dateField]);
      if (isNaN(date.getTime())) return false;
      
      // Filtro de ano
      const matchesYear = yearFilter === 'all' || date.getFullYear() === parseInt(yearFilter);
      if (!matchesYear) return false;
      
      // Filtro de período (se ano específico, considerar meses dentro daquele ano)
      if (period !== 'all') {
        const { start, end } = getDateRange(period);
        // Ajustar para o ano selecionado se não for 'all'
        if (yearFilter !== 'all') {
          const selectedYear = parseInt(yearFilter);
          start.setFullYear(selectedYear);
          end.setFullYear(selectedYear);
        }
        if (date < start || date > end) return false;
      }
      
      // Filtros adicionais
      const matchesClient = clientFilter === 'all' || item.client_id === clientFilter;
      const matchesPrincipal = principalFilter === 'all' || item.principal_id === principalFilter;
      const matchesStatus = statusFilter === 'all' || item.status === statusFilter;
      
      return matchesClient && matchesPrincipal && matchesStatus;
    });
  };

  const filteredOrders = useMemo(() => filterData(orders, { useClosedDate: true }), [orders, period, yearFilter, clientFilter, principalFilter, statusFilter]);
  const filteredQuotes = useMemo(() => filterData(quotes), [quotes, period, yearFilter, clientFilter, principalFilter, statusFilter]);
  const filteredOpportunities = useMemo(() => filterData(opportunities, { useWonDate: true }), [opportunities, period, yearFilter, clientFilter, principalFilter, statusFilter]);

  // Comparison data
  const comparisonOrders = useMemo(() => {
    const { start, end } = getDateRange(comparisonPeriod);
    return orders.filter(o => {
      const date = new Date(o.created_date);
      return date >= start && date <= end;
    });
  }, [orders, comparisonPeriod]);

  // KPIs with comparison
  const calculateKPIs = () => {
    const current = {
      revenue: filteredOrders.reduce((sum, o) => sum + (o.total_value || 0), 0),
      orders: filteredOrders.length,
      avgTicket: filteredOrders.length > 0 ? filteredOrders.reduce((sum, o) => sum + (o.total_value || 0), 0) / filteredOrders.length : 0,
      commission: filteredOrders.reduce((sum, o) => sum + (o.expected_commission || 0), 0),
      quotesCreated: filteredQuotes.length,
      quotesWon: filteredOpportunities.filter(o => o.stage === 'ganho').length,
      quotesLost: filteredOpportunities.filter(o => o.stage === 'perdido').length,
      conversionRate: filteredQuotes.length > 0 ? (filteredOpportunities.filter(o => o.stage === 'ganho').length / filteredQuotes.length) * 100 : 0,
    };

    const previous = {
      revenue: comparisonOrders.reduce((sum, o) => sum + (o.total_value || 0), 0),
      orders: comparisonOrders.length,
      avgTicket: comparisonOrders.length > 0 ? comparisonOrders.reduce((sum, o) => sum + (o.total_value || 0), 0) / comparisonOrders.length : 0,
    };

    const changes = {
      revenue: previous.revenue > 0 ? ((current.revenue - previous.revenue) / previous.revenue) * 100 : 0,
      orders: previous.orders > 0 ? ((current.orders - previous.orders) / previous.orders) * 100 : 0,
      avgTicket: previous.avgTicket > 0 ? ((current.avgTicket - previous.avgTicket) / previous.avgTicket) * 100 : 0,
    };

    return { current, previous, changes };
  };

  const kpis = calculateKPIs();

  // Monthly evolution
  const getMonthlyEvolution = () => {
    const months = {};
    
    [...orders, ...quotes].forEach(item => {
      const date = new Date(item.created_date);
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      
      if (!months[key]) {
        months[key] = { 
          month: key, 
          revenue: 0, 
          orders: 0, 
          quotes: 0,
          quotesWon: 0,
          quotesLost: 0,
          conversion: 0
        };
      }
      
      if (item.total_value !== undefined) {
        months[key].revenue += item.total_value || 0;
        months[key].orders += 1;
      }
      
      if (item.quote_number !== undefined) {
        months[key].quotes += 1;
        if (item.status === 'convertido') months[key].quotesWon += 1;
        if (item.status === 'cancelado') months[key].quotesLost += 1;
      }
    });

    return Object.values(months)
      .sort((a, b) => a.month.localeCompare(b.month))
      .slice(-12)
      .map(m => ({
        ...m,
        conversion: m.quotes > 0 ? (m.quotesWon / m.quotes) * 100 : 0,
        monthLabel: new Date(m.month + '-01').toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' })
      }));
  };

  // Product analysis
  const getProductAnalysis = () => {
    const products = {};
    
    filteredOrders.forEach(order => {
      order.items?.forEach(item => {
        const key = item.product_name || 'Sem nome';
        if (!products[key]) {
          products[key] = {
            name: key,
            value: 0,
            weight: 0,
            quantity: 0,
            orders: 0
          };
        }
        products[key].value += item.item_total || 0;
        products[key].weight += item.total_weight || 0;
        products[key].quantity += item.quantity || 0;
        products[key].orders += 1;
      });
    });

    return Object.values(products)
      .sort((a, b) => b.value - a.value)
      .slice(0, 10);
  };

  // Client analysis
  const getClientAnalysis = () => {
    const clientData = {};
    
    filteredOrders.forEach(order => {
      const key = order.client_name || 'Sem nome';
      if (!clientData[key]) {
        clientData[key] = {
          name: key,
          revenue: 0,
          orders: 0,
          avgTicket: 0
        };
      }
      clientData[key].revenue += order.total_value || 0;
      clientData[key].orders += 1;
    });

    return Object.values(clientData)
      .map(c => ({ ...c, avgTicket: c.orders > 0 ? c.revenue / c.orders : 0 }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 10);
  };

  // Principal analysis
  const getPrincipalAnalysis = () => {
    const principalData = {};
    
    filteredOrders.forEach(order => {
      const key = order.principal_name || 'Sem nome';
      if (!principalData[key]) {
        principalData[key] = {
          name: key,
          revenue: 0,
          orders: 0,
          quotes: 0,
          conversion: 0
        };
      }
      principalData[key].revenue += order.total_value || 0;
      principalData[key].orders += 1;
    });

    filteredQuotes.forEach(quote => {
      const key = quote.principal_name || 'Sem nome';
      if (principalData[key]) {
        principalData[key].quotes += 1;
      }
    });

    return Object.values(principalData)
      .map(p => ({ 
        ...p, 
        conversion: p.quotes > 0 ? (p.orders / p.quotes) * 100 : 0,
        avgTicket: p.orders > 0 ? p.revenue / p.orders : 0
      }))
      .sort((a, b) => b.revenue - a.revenue);
  };

  // Funnel analysis
  const getFunnelAnalysis = () => {
    const stages = {
      proposta_enviada: opportunities.filter(o => o.stage === 'proposta_enviada').length,
      em_negociacao: opportunities.filter(o => o.stage === 'em_negociacao').length,
      ganho: opportunities.filter(o => o.stage === 'ganho').length,
      perdido: opportunities.filter(o => o.stage === 'perdido').length,
    };

    const total = Object.values(stages).reduce((sum, v) => sum + v, 0);

    return [
      { stage: 'Proposta Enviada', count: stages.proposta_enviada, percentage: total > 0 ? (stages.proposta_enviada / total) * 100 : 0, color: '#3b82f6' },
      { stage: 'Em Negociação', count: stages.em_negociacao, percentage: total > 0 ? (stages.em_negociacao / total) * 100 : 0, color: '#f59e0b' },
      { stage: 'Ganho', count: stages.ganho, percentage: total > 0 ? (stages.ganho / total) * 100 : 0, color: '#10b981' },
      { stage: 'Perdido', count: stages.perdido, percentage: total > 0 ? (stages.perdido / total) * 100 : 0, color: '#ef4444' },
    ];
  };

  // Seasonality analysis
  const getSeasonalityAnalysis = () => {
    const monthlyData = {};
    
    orders.forEach(order => {
      const date = new Date(order.created_date);
      const month = date.getMonth();
      
      if (!monthlyData[month]) {
        monthlyData[month] = {
          month: new Date(2000, month, 1).toLocaleDateString('pt-BR', { month: 'long' }),
          revenue: 0,
          orders: 0,
          weight: 0
        };
      }
      
      monthlyData[month].revenue += order.total_value || 0;
      monthlyData[month].orders += 1;
      monthlyData[month].weight += order.total_weight || 0;
    });

    return Object.values(monthlyData);
  };

  const monthlyEvolution = getMonthlyEvolution();
  const productAnalysis = getProductAnalysis();
  const clientAnalysis = getClientAnalysis();
  const principalAnalysis = getPrincipalAnalysis();
  const funnelAnalysis = getFunnelAnalysis();
  const seasonalityAnalysis = getSeasonalityAnalysis();

  // Trend indicator component
  const TrendIndicator = ({ value, showValue = true }) => {
    if (value > 0) {
      return (
        <div className="flex items-center gap-1 text-emerald-600">
          <ArrowUpRight className="w-4 h-4" />
          {showValue && <span className="text-sm font-medium">{formatPercentage(value)}</span>}
        </div>
      );
    } else if (value < 0) {
      return (
        <div className="flex items-center gap-1 text-red-600">
          <ArrowDownRight className="w-4 h-4" />
          {showValue && <span className="text-sm font-medium">{formatPercentage(value)}</span>}
        </div>
      );
    }
    return (
      <div className="flex items-center gap-1 text-slate-400">
        <Minus className="w-4 h-4" />
        {showValue && <span className="text-sm font-medium">0%</span>}
      </div>
    );
  };

  // Generate AI Insights
  const generateInsights = () => {
    const insights = [];
    
    // Segment insights
    const segmentData = {};
    filteredOrders.forEach(order => {
      const client = clients.find(c => c.id === order.client_id);
      const segment = client?.segment || 'Outros';
      if (!segmentData[segment]) segmentData[segment] = { revenue: 0, orders: 0 };
      segmentData[segment].revenue += order.total_value || 0;
      segmentData[segment].orders += 1;
    });
    
    const totalRevenue = Object.values(segmentData).reduce((sum, s) => sum + s.revenue, 0);
    const topSegment = Object.entries(segmentData).sort(([,a], [,b]) => b.revenue - a.revenue)[0];
    if (topSegment && totalRevenue > 0) {
      const [segment, data] = topSegment;
      const share = (data.revenue / totalRevenue) * 100;
      insights.push({
        text: `${segment} gera ${share.toFixed(0)}% do faturamento (${formatCurrency(data.revenue)})`,
        type: 'opportunity',
        filters: { segment }
      });
    }

    // Region insights
    const regionData = {};
    filteredOrders.forEach(order => {
      const state = order.client_state || 'Outros';
      if (!regionData[state]) regionData[state] = { revenue: 0, orders: 0, avgTicket: 0 };
      regionData[state].revenue += order.total_value || 0;
      regionData[state].orders += 1;
    });
    
    Object.keys(regionData).forEach(state => {
      regionData[state].avgTicket = regionData[state].orders > 0 ? regionData[state].revenue / regionData[state].orders : 0;
    });

    const topState = Object.entries(regionData).sort(([,a], [,b]) => b.revenue - a.revenue)[0];
    const highestTicketState = Object.entries(regionData).sort(([,a], [,b]) => b.avgTicket - a.avgTicket)[0];
    
    if (topState && highestTicketState && topState[0] !== highestTicketState[0]) {
      insights.push({
        text: `${topState[0]} lidera em volume, mas ${highestTicketState[0]} tem maior ticket médio (${formatCurrency(highestTicketState[1].avgTicket)})`,
        type: 'opportunity',
        filters: { state: highestTicketState[0] }
      });
    }

    // Conversion insights
    if (kpis.current.conversionRate < 40 && kpis.current.quotesCreated > 10) {
      insights.push({
        text: `Taxa de conversão baixa (${kpis.current.conversionRate.toFixed(1)}%). Revisar qualificação de leads e follow-up`,
        type: 'risk'
      });
    }

    return insights;
  };

  const aiInsights = generateInsights();

  const handleGenerateAction = async (insight) => {
    try {
      // Create activity log
      const activityData = {
        customer_id: 'SEGMENT',
        customer_name: insight.text,
        alert_type: 'ATTENTION',
        action_type: 'REMINDER',
        notes: `[IA - Relatórios] ${insight.text}\n\nAção: Analisar ${insight.filters?.segment || insight.filters?.state || 'segmento'}`,
        status: 'pending'
      };

      await base44.entities.Activity.create(activityData);
      
      // Navigate based on filters
      if (insight.filters?.segment) {
        navigate(createPageUrl(`Clients?segment=${encodeURIComponent(insight.filters.segment)}`));
        toast.success('Mostrando clientes do segmento', { description: insight.filters.segment });
      } else if (insight.filters?.state) {
        navigate(createPageUrl(`Clients?state=${encodeURIComponent(insight.filters.state)}`));
        toast.success('Mostrando clientes do estado', { description: insight.filters.state });
      } else {
        toast.success('Ação criada com sucesso');
      }
    } catch (error) {
      console.error('Error creating action:', error);
      toast.error('Erro ao criar ação');
    }
  };

  const handleClickState = (state) => {
    toast.info(`Filtro aplicado: ${state}`);
  };

  // Handler for Focus Cards
  const handleFocusCardClick = (type) => {
    console.log('🔍 FocusCardClick START', { type, filteredOrdersLength: filteredOrders.length });

    if (type === 'SEGMENT') {
      const segmentData = filteredOrders.reduce((acc, o) => {
        const client = clients.find(c => c.id === o.client_id);
        const seg = client?.segment || 'Outros';
        acc[seg] = (acc[seg] || 0) + (o.total_value || 0);
        return acc;
      }, {});
      
      const topSegment = Object.entries(segmentData).sort(([,a], [,b]) => b - a)[0];
      console.log('📊 Top Segment:', topSegment);

      if (topSegment && topSegment[0] !== 'Outros') {
        setActiveTab('segments');
        setTimeout(() => {
          const element = document.querySelector('[value="segments"]');
          if (element) element.scrollIntoView({ behavior: 'smooth' });
        }, 100);
        toast.success('Segmento Mais Lucrativo', { 
          description: `${topSegment[0]} - ${formatCurrency(topSegment[1])}` 
        });
      } else {
        toast.info('Sem dados de segmento disponíveis');
      }
    } 
    else if (type === 'REGION') {
      const regionData = filteredOrders.reduce((acc, o) => {
        const state = o.client_state || 'Outros';
        acc[state] = (acc[state] || 0) + (o.total_value || 0);
        return acc;
      }, {});
      
      const topRegion = Object.entries(regionData).sort(([,a], [,b]) => b - a)[0];
      console.log('🗺️ Top Region:', topRegion);
      console.log('🚀 Navigating to Clients with state:', topRegion?.[0]);

      if (topRegion && topRegion[0] !== 'Outros') {
        const url = createPageUrl(`Clients?state=${encodeURIComponent(topRegion[0])}`);
        console.log('📍 URL:', url);
        navigate(url);
        toast.success('Região Mais Forte', { 
          description: `${topRegion[0]} - ${formatCurrency(topRegion[1])}` 
        });
      } else {
        toast.info('Sem dados de região disponíveis');
      }
    } 
    else if (type === 'OPPORTUNITY') {
      const openOpps = kpis.current.quotesCreated - kpis.current.quotesWon - kpis.current.quotesLost;
      console.log('🎯 Open Opportunities:', openOpps);
      console.log('🚀 Navigating to Opportunities page');
      
      const url = createPageUrl('Opportunities');
      console.log('📍 URL:', url);
      navigate(url);
      toast.success('Oportunidades em Aberto', { 
        description: openOpps > 0 ? `${openOpps} negócios ativos` : 'Ver funil de vendas'
      });
    }

    console.log('✅ FocusCardClick END');
  };

  return (
    <div className="pb-20 lg:pb-6 space-y-6">
      <PageHeader 
        title="Central de Inteligência Comercial" 
        subtitle="Análise integrada de desempenho e decisão estratégica"
      />

      {/* Filtros Globais */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Filter className="w-5 h-5 text-slate-600" />
              <CardTitle className="text-base">Filtros de Análise</CardTitle>
            </div>
            {(clientFilter !== 'all' || principalFilter !== 'all' || statusFilter !== 'all') && (
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => {
                  setClientFilter('all');
                  setPrincipalFilter('all');
                  setStatusFilter('all');
                }}
              >
                <X className="w-4 h-4 mr-1" />
                Limpar Filtros
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3">
            <Select value={yearFilter} onValueChange={setYearFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Ano" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os Anos</SelectItem>
                {availableYears.map(year => (
                  <SelectItem key={year} value={year.toString()}>{year}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <Select value={period} onValueChange={setPeriod}>
              <SelectTrigger>
                <SelectValue placeholder="Período" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="thisMonth">Este Mês</SelectItem>
                <SelectItem value="lastMonth">Mês Passado</SelectItem>
                <SelectItem value="thisQuarter">Este Trimestre</SelectItem>
                <SelectItem value="lastQuarter">Trimestre Passado</SelectItem>
                <SelectItem value="thisYear">Este Ano</SelectItem>
                <SelectItem value="lastYear">Ano Passado</SelectItem>
                <SelectItem value="all">Todo Período</SelectItem>
              </SelectContent>
            </Select>

            <Select value={comparisonPeriod} onValueChange={setComparisonPeriod}>
              <SelectTrigger>
                <SelectValue placeholder="Comparar com" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="lastMonth">Mês Anterior</SelectItem>
                <SelectItem value="lastQuarter">Trimestre Anterior</SelectItem>
                <SelectItem value="lastYear">Ano Anterior</SelectItem>
              </SelectContent>
            </Select>

            <Select value={clientFilter} onValueChange={setClientFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Cliente" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os Clientes</SelectItem>
                {clients.map(c => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.trade_name || c.company_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={principalFilter} onValueChange={setPrincipalFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Representada" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas Representadas</SelectItem>
                {principals.map(p => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.trade_name || p.company_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos Status</SelectItem>
                <SelectItem value="em_analise">Em Análise</SelectItem>
                <SelectItem value="confirmado">Confirmado</SelectItem>
                <SelectItem value="faturado">Faturado</SelectItem>
                <SelectItem value="entregue">Entregue</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Empty State */}
      {!isLoading && filteredOrders.length === 0 && filteredQuotes.length === 0 && (
        <Card>
          <CardContent className="py-12">
            <div className="text-center space-y-3">
              <div className="w-16 h-16 mx-auto bg-slate-100 rounded-full flex items-center justify-center">
                <BarChart3 className="w-8 h-8 text-slate-400" />
              </div>
              <h3 className="text-lg font-semibold text-slate-900">Sem dados para o período selecionado</h3>
              <p className="text-sm text-slate-500">Ajuste os filtros ou aguarde a importação de dados históricos</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* AI Insights Block */}
      {filteredOrders.length > 0 && <AIInsightsBlock insights={aiInsights} onGenerateAction={handleGenerateAction} />}

      {/* AI Report Analyzer */}
      {filteredOrders.length > 0 && (
        <AIReportAnalyzer
          orders={filteredOrders}
          opportunities={filteredOpportunities}
          clients={clients}
          period={period}
          yearFilter={yearFilter}
          formatCurrency={formatCurrency}
        />
      )}

      {/* KPIs com Comparação */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <Card 
      className="cursor-pointer hover:shadow-lg transition-shadow"
      onClick={() => navigate(createPageUrl('Orders'))}
      >
      <CardContent className="pt-6">
        <div className="flex items-start justify-between mb-2">
          <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center">
            <DollarSign className="w-5 h-5 text-emerald-600" />
          </div>
          <TrendIndicator value={kpis.changes.revenue} />
        </div>
        <p className="text-2xl font-bold text-slate-900">{formatCurrency(kpis.current.revenue)}</p>
        <p className="text-sm text-slate-500">Faturamento</p>
        <p className="text-xs text-slate-400 mt-1">
          Anterior: {formatCurrency(kpis.previous.revenue)}
        </p>
      </CardContent>
      </Card>

        <Card
          className="cursor-pointer hover:shadow-lg transition-shadow"
          onClick={() => navigate(createPageUrl('Orders'))}
        >
          <CardContent className="pt-6">
            <div className="flex items-start justify-between mb-2">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <FileText className="w-5 h-5 text-blue-600" />
              </div>
              <TrendIndicator value={kpis.changes.orders} />
            </div>
            <p className="text-2xl font-bold text-slate-900">{kpis.current.orders}</p>
            <p className="text-sm text-slate-500">Pedidos</p>
            <p className="text-xs text-slate-400 mt-1">
              Anterior: {kpis.previous.orders}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-start justify-between mb-2">
              <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-purple-600" />
              </div>
              <TrendIndicator value={kpis.changes.avgTicket} />
            </div>
            <p className="text-2xl font-bold text-slate-900">{formatCurrency(kpis.current.avgTicket)}</p>
            <p className="text-sm text-slate-500">Ticket Médio</p>
            <p className="text-xs text-slate-400 mt-1">
              Anterior: {formatCurrency(kpis.previous.avgTicket)}
            </p>
          </CardContent>
        </Card>

        <Card
          className="cursor-pointer hover:shadow-lg transition-shadow"
          onClick={() => navigate(createPageUrl('Opportunities?stage=ganho'))}
        >
          <CardContent className="pt-6">
            <div className="flex items-start justify-between mb-2">
              <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center">
                <Target className="w-5 h-5 text-amber-600" />
              </div>
              <Badge variant={kpis.current.conversionRate > 50 ? "success" : "secondary"}>
                {kpis.current.conversionRate.toFixed(1)}%
              </Badge>
            </div>
            <p className="text-2xl font-bold text-slate-900">{kpis.current.quotesWon}</p>
            <p className="text-sm text-slate-500">Negócios Ganhos</p>
            <p className="text-xs text-slate-400 mt-1">
              De {kpis.current.quotesCreated} orçamentos
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-2 lg:grid-cols-8">
          <TabsTrigger value="ia">🤖 IA</TabsTrigger>
          <TabsTrigger value="executive">Executiva</TabsTrigger>
          <TabsTrigger value="sales">Vendas</TabsTrigger>
          <TabsTrigger value="clients">Clientes</TabsTrigger>
          <TabsTrigger value="regions">Regiões</TabsTrigger>
          <TabsTrigger value="segments">Segmentos</TabsTrigger>
          <TabsTrigger value="crm">CRM/Funil</TabsTrigger>
          <TabsTrigger value="seasonality">Sazonalidade</TabsTrigger>
        </TabsList>

        {/* IA Tab */}
        <TabsContent value="ia" className="space-y-6">
          <AIReportAnalyzer
            orders={filteredOrders}
            opportunities={filteredOpportunities}
            clients={clients}
            period={period}
            yearFilter={yearFilter}
            formatCurrency={formatCurrency}
          />
        </TabsContent>

        {/* Visão Executiva */}
        <TabsContent value="executive" className="space-y-6">
          <div className="grid lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Evolução Mensal</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={monthlyEvolution}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                      <XAxis dataKey="monthLabel" tick={{ fontSize: 11 }} />
                      <YAxis tick={{ fontSize: 12 }} tickFormatter={(v) => `${(v/1000).toFixed(0)}k`} />
                      <Tooltip formatter={(value, name) => {
                        if (name === 'revenue') return [formatCurrency(value), 'Faturamento'];
                        return [value, name];
                      }} />
                      <Legend />
                      <Line type="monotone" dataKey="revenue" stroke="#ef4444" strokeWidth={3} name="Faturamento" dot={{ fill: '#ef4444', r: 5 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Performance Resumida</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 bg-emerald-50 rounded-lg">
                    <span className="text-sm font-medium">Faturamento</span>
                    <span className="text-lg font-bold text-emerald-600">{formatCurrency(kpis.current.revenue)}</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                    <span className="text-sm font-medium">Pedidos</span>
                    <span className="text-lg font-bold text-blue-600">{kpis.current.orders}</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-purple-50 rounded-lg">
                    <span className="text-sm font-medium">Ticket Médio</span>
                    <span className="text-lg font-bold text-purple-600">{formatCurrency(kpis.current.avgTicket)}</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-amber-50 rounded-lg">
                    <span className="text-sm font-medium">Conversão</span>
                    <span className="text-lg font-bold text-amber-600">{kpis.current.conversionRate.toFixed(1)}%</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>💡 Onde Focar Agora?</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid lg:grid-cols-3 gap-4">
                <Button 
                  className="h-20 bg-emerald-600 hover:bg-emerald-700 active:scale-95 flex-col transition-all cursor-pointer"
                  onClick={() => handleFocusCardClick('SEGMENT')}
                >
                  <Zap className="w-6 h-6 mb-2" />
                  Segmento Mais Lucrativo
                </Button>
                <Button 
                  className="h-20 bg-blue-600 hover:bg-blue-700 active:scale-95 flex-col transition-all cursor-pointer"
                  onClick={() => handleFocusCardClick('REGION')}
                >
                  <MapPin className="w-6 h-6 mb-2" />
                  Região Mais Forte
                </Button>
                <Button 
                  className="h-20 bg-purple-600 hover:bg-purple-700 active:scale-95 flex-col transition-all cursor-pointer"
                  onClick={() => handleFocusCardClick('OPPORTUNITY')}
                >
                  <Target className="w-6 h-6 mb-2" />
                  Oportunidades em Aberto
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Vendas Tab */}
        <TabsContent value="sales" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Evolução Mensal de Vendas</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-80 w-full" />
              ) : (
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart data={monthlyEvolution}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                      <XAxis dataKey="monthLabel" tick={{ fontSize: 12 }} />
                      <YAxis yAxisId="left" tick={{ fontSize: 12 }} tickFormatter={(v) => `${(v/1000).toFixed(0)}k`} />
                      <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 12 }} />
                      <Tooltip formatter={(value, name) => {
                        if (name === 'revenue') return [formatCurrency(value), 'Faturamento'];
                        if (name === 'orders') return [value, 'Pedidos'];
                        if (name === 'conversion') return [`${value.toFixed(1)}%`, 'Conversão'];
                        return [value, name];
                      }} />
                      <Legend />
                      <Bar yAxisId="left" dataKey="revenue" fill="#10b981" name="Faturamento" radius={[4, 4, 0, 0]} />
                      <Line yAxisId="right" type="monotone" dataKey="orders" stroke="#3b82f6" strokeWidth={2} name="Pedidos" dot={{ fill: '#3b82f6' }} />
                      <Line yAxisId="right" type="monotone" dataKey="conversion" stroke="#8b5cf6" strokeWidth={2} name="Conversão %" dot={{ fill: '#8b5cf6' }} />
                    </ComposedChart>
                  </ResponsiveContainer>
                </div>
              )}
            </CardContent>
          </Card>

          <div className="grid lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Ciclo de Vendas</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                    <span className="text-sm font-medium">Negócios Iniciados</span>
                    <span className="text-xl font-bold text-blue-600">{kpis.current.quotesCreated}</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-emerald-50 rounded-lg">
                    <span className="text-sm font-medium">Negócios Ganhos</span>
                    <span className="text-xl font-bold text-emerald-600">{kpis.current.quotesWon}</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                    <span className="text-sm font-medium">Negócios Perdidos</span>
                    <span className="text-xl font-bold text-red-600">{kpis.current.quotesLost}</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-purple-50 rounded-lg">
                    <span className="text-sm font-medium">Taxa de Conversão</span>
                    <span className="text-xl font-bold text-purple-600">{kpis.current.conversionRate.toFixed(1)}%</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Comissões</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={monthlyEvolution}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                      <XAxis dataKey="monthLabel" tick={{ fontSize: 12 }} />
                      <YAxis tick={{ fontSize: 12 }} />
                      <Tooltip formatter={(value) => formatCurrency(value)} />
                      <Line type="monotone" dataKey="revenue" stroke="#8b5cf6" strokeWidth={2} dot={{ fill: '#8b5cf6' }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Produtos Tab */}
        <TabsContent value="products" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Top 10 Produtos Mais Vendidos</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-96 w-full" />
              ) : productAnalysis.length > 0 ? (
                <div className="space-y-3">
                  {productAnalysis.map((product, index) => (
                    <div key={index} className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-white ${
                        index === 0 ? 'bg-amber-500' :
                        index === 1 ? 'bg-slate-400' :
                        index === 2 ? 'bg-amber-700' :
                        'bg-slate-300'
                      }`}>
                        {index + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-slate-900 truncate">{product.name}</p>
                        <div className="flex gap-4 text-xs text-slate-500">
                          <span>{product.orders} pedidos</span>
                          <span>{product.weight.toFixed(0)} kg</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-emerald-600">{formatCurrency(product.value)}</p>
                      </div>
                      <div className="w-24 h-2 bg-slate-100 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-emerald-500 rounded-full"
                          style={{ width: `${(product.value / productAnalysis[0].value) * 100}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="h-64 flex items-center justify-center text-slate-400">
                  Sem dados para exibir
                </div>
              )}
            </CardContent>
          </Card>

          <div className="grid lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Mix de Produtos (Valor)</CardTitle>
              </CardHeader>
              <CardContent>
                {productAnalysis.length > 0 && (
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={productAnalysis.slice(0, 5)}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ name, percent }) => `${name.substring(0, 15)}... ${(percent * 100).toFixed(0)}%`}
                          outerRadius={80}
                          dataKey="value"
                        >
                          {productAnalysis.slice(0, 5).map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(value) => formatCurrency(value)} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Mix de Produtos (Volume)</CardTitle>
              </CardHeader>
              <CardContent>
                {productAnalysis.length > 0 && (
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={productAnalysis.slice(0, 5)}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ name, percent }) => `${name.substring(0, 15)}... ${(percent * 100).toFixed(0)}%`}
                          outerRadius={80}
                          dataKey="weight"
                        >
                          {productAnalysis.slice(0, 5).map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(value) => `${value.toFixed(0)} kg`} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* CRM/Funil Tab */}
        <TabsContent value="crm" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Funil de Vendas</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {funnelAnalysis.map((stage, index) => (
                  <div key={index}>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-slate-900">{stage.stage}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold">{stage.count}</span>
                        <span className="text-xs text-slate-500">({stage.percentage.toFixed(1)}%)</span>
                      </div>
                    </div>
                    <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden">
                      <div 
                        className="h-full rounded-full transition-all"
                        style={{ 
                          width: `${stage.percentage}%`,
                          backgroundColor: stage.color
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <div className="grid lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Taxa Ganhos vs Perdidos</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={[
                          { name: 'Ganhos', value: kpis.current.quotesWon, color: '#10b981' },
                          { name: 'Perdidos', value: kpis.current.quotesLost, color: '#ef4444' }
                        ]}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                        outerRadius={80}
                        dataKey="value"
                      >
                        <Cell fill="#10b981" />
                        <Cell fill="#ef4444" />
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Conversão no Tempo</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={monthlyEvolution}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                      <XAxis dataKey="monthLabel" tick={{ fontSize: 12 }} />
                      <YAxis tick={{ fontSize: 12 }} />
                      <Tooltip formatter={(value) => `${value.toFixed(1)}%`} />
                      <Line type="monotone" dataKey="conversion" stroke="#10b981" strokeWidth={2} dot={{ fill: '#10b981' }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Clientes Tab */}
        <TabsContent value="clients" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Top 10 Clientes por Faturamento</CardTitle>
            </CardHeader>
            <CardContent>
              {clientAnalysis.length > 0 ? (
                <div className="space-y-3">
                  {clientAnalysis.map((client, index) => (
                    <div key={index} className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-white ${
                        index === 0 ? 'bg-amber-500' :
                        index === 1 ? 'bg-slate-400' :
                        index === 2 ? 'bg-amber-700' :
                        'bg-slate-300'
                      }`}>
                        {index + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-slate-900 truncate">{client.name}</p>
                        <p className="text-xs text-slate-500">{client.orders} pedidos • Ticket: {formatCurrency(client.avgTicket)}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-emerald-600">{formatCurrency(client.revenue)}</p>
                      </div>
                      <div className="w-24 h-2 bg-slate-100 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-emerald-500 rounded-full"
                          style={{ width: `${(client.revenue / clientAnalysis[0].revenue) * 100}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="h-64 flex items-center justify-center text-slate-400">
                  Sem dados para exibir
                </div>
              )}
            </CardContent>
          </Card>

          <div className="grid lg:grid-cols-3 gap-6">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between mb-2">
                  <Users className="w-8 h-8 text-emerald-600" />
                  <Badge className="bg-emerald-100 text-emerald-700">Ativos</Badge>
                </div>
                <p className="text-3xl font-bold">{clients.filter(c => c.status === 'active').length}</p>
                <p className="text-sm text-slate-500 mt-1">Clientes Ativos</p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between mb-2">
                  <Users className="w-8 h-8 text-amber-600" />
                  <Badge className="bg-amber-100 text-amber-700">Atenção</Badge>
                </div>
                <p className="text-3xl font-bold">{clients.filter(c => c.status === 'attention').length}</p>
                <p className="text-sm text-slate-500 mt-1">Clientes em Atenção</p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between mb-2">
                  <Users className="w-8 h-8 text-red-600" />
                  <Badge className="bg-red-100 text-red-700">Risco</Badge>
                </div>
                <p className="text-3xl font-bold">{clients.filter(c => c.status === 'at_risk' || c.status === 'inactive').length}</p>
                <p className="text-sm text-slate-500 mt-1">Clientes em Risco</p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Regiões Tab */}
        <TabsContent value="regions" className="space-y-6">
          <RegionsAnalysis 
            orders={filteredOrders} 
            onClickState={handleClickState}
            formatCurrency={formatCurrency}
          />
        </TabsContent>

        {/* Segmentos Tab */}
        <TabsContent value="segments" className="space-y-6">
          <SegmentsAnalysis 
            clients={clients}
            orders={filteredOrders}
            formatCurrency={formatCurrency}
          />
        </TabsContent>

        {/* Representadas Tab */}
        <TabsContent value="principals" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Performance por Representada</CardTitle>
            </CardHeader>
            <CardContent>
              {principalAnalysis.length > 0 ? (
                <div className="space-y-4">
                  {principalAnalysis.map((principal, index) => (
                    <div key={index} className="p-4 bg-slate-50 rounded-lg">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="font-semibold text-slate-900">{principal.name}</h4>
                        <Badge variant={principal.conversion > 50 ? "success" : "secondary"}>
                          {principal.conversion.toFixed(1)}% conversão
                        </Badge>
                      </div>
                      <div className="grid grid-cols-3 gap-4">
                        <div>
                          <p className="text-xs text-slate-500">Faturamento</p>
                          <p className="text-lg font-bold text-emerald-600">{formatCurrency(principal.revenue)}</p>
                        </div>
                        <div>
                          <p className="text-xs text-slate-500">Pedidos</p>
                          <p className="text-lg font-bold text-blue-600">{principal.orders}</p>
                        </div>
                        <div>
                          <p className="text-xs text-slate-500">Ticket Médio</p>
                          <p className="text-lg font-bold text-purple-600">{formatCurrency(principal.avgTicket)}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="h-64 flex items-center justify-center text-slate-400">
                  Sem dados para exibir
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Sazonalidade Tab */}
        <TabsContent value="seasonality" className="space-y-6">
          <SeasonalityCrossAnalysis
            clients={clients}
            orders={orders}
            formatCurrency={formatCurrency}
          />

          <Card>
            <CardHeader>
              <CardTitle>Análise Mensal Histórica</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={seasonalityAnalysis}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                    <YAxis yAxisId="left" tick={{ fontSize: 12 }} tickFormatter={(v) => `${(v/1000).toFixed(0)}k`} />
                    <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 12 }} />
                    <Tooltip formatter={(value, name) => {
                      if (name === 'revenue') return [formatCurrency(value), 'Faturamento'];
                      if (name === 'orders') return [value, 'Pedidos'];
                      if (name === 'weight') return [`${value.toFixed(0)} kg`, 'Volume'];
                      return [value, name];
                    }} />
                    <Legend />
                    <Bar yAxisId="left" dataKey="revenue" fill="#10b981" name="Faturamento" radius={[4, 4, 0, 0]} />
                    <Line yAxisId="right" type="monotone" dataKey="orders" stroke="#3b82f6" strokeWidth={2} name="Pedidos" />
                    <Line yAxisId="right" type="monotone" dataKey="weight" stroke="#f59e0b" strokeWidth={2} name="Volume (kg)" />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}