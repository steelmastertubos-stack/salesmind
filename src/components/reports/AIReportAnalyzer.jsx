import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Sparkles, TrendingUp, Target, AlertTriangle, Loader2, ChevronDown, ChevronUp, Zap, ArrowRight } from 'lucide-react';
import { toast } from 'sonner';

export default function AIReportAnalyzer({ 
  orders = [], 
  opportunities = [], 
  clients = [], 
  period = 'all',
  yearFilter = 'all',
  formatCurrency 
}) {
  const [analysis, setAnalysis] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [expandedSections, setExpandedSections] = useState({
    predictions: true,
    actions: true,
    executive: true
  });

  const toggleSection = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const analyzeWithAI = async () => {
    setIsAnalyzing(true);
    try {
      // Preparar dados estruturados
      const analysisData = prepareAnalysisData();
      
      const prompt = `Você é um consultor de vendas B2B especializado em análise de dados comerciais.

DADOS DO PERÍODO:
${JSON.stringify(analysisData, null, 2)}

Por favor, forneça uma análise COMPLETA E DETALHADA em formato JSON com:

1. PREVISÕES (predictions): Array de 3-4 previsões específicas sobre:
   - Faturamento esperado para próximo mês/trimestre (com valores estimados)
   - Tendências de conversão e pipeline
   - Produtos/segmentos que devem crescer ou cair
   - Riscos identificados

2. AÇÕES RECOMENDADAS (actions): Array de 5-6 ações práticas e específicas:
   - Prioridade: "high", "medium", "low"
   - Tipo: "marketing", "sales", "retention", "expansion"
   - Título curto e ação detalhada
   - Impacto esperado (quantitativo se possível)
   - Timeline sugerido

3. RESUMO EXECUTIVO (executive_summary): Objeto com:
   - overview: Resumo geral em 2-3 frases
   - highlights: Array de 3-4 destaques principais (positivos e negativos)
   - key_metrics: Métricas principais com interpretação
   - bottom_line: Conclusão final e próximos passos

IMPORTANTE:
- Use valores REAIS dos dados fornecidos
- Seja ESPECÍFICO em números e prazos
- Forneça ações PRÁTICAS e imediatas
- Identifique OPORTUNIDADES E RISCOS reais`;

      const result = await base44.integrations.Core.InvokeLLM({
        prompt,
        response_json_schema: {
          type: "object",
          properties: {
            predictions: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  type: { type: "string" },
                  title: { type: "string" },
                  description: { type: "string" },
                  confidence: { type: "string" },
                  impact: { type: "string" },
                  value: { type: "string" }
                }
              }
            },
            actions: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  priority: { type: "string" },
                  type: { type: "string" },
                  title: { type: "string" },
                  description: { type: "string" },
                  expected_impact: { type: "string" },
                  timeline: { type: "string" }
                }
              }
            },
            executive_summary: {
              type: "object",
              properties: {
                overview: { type: "string" },
                highlights: { 
                  type: "array",
                  items: { type: "string" }
                },
                key_metrics: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      metric: { type: "string" },
                      value: { type: "string" },
                      interpretation: { type: "string" }
                    }
                  }
                },
                bottom_line: { type: "string" }
              }
            }
          }
        }
      });

      setAnalysis(result);
      toast.success('Análise gerada com sucesso!');
    } catch (error) {
      console.error('Erro ao gerar análise:', error);
      toast.error('Erro ao gerar análise com IA');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const prepareAnalysisData = () => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    // Calcular métricas agregadas
    const totalRevenue = orders.reduce((sum, o) => sum + (o.total_value || 0), 0);
    const avgTicket = orders.length > 0 ? totalRevenue / orders.length : 0;
    const conversionRate = opportunities.length > 0 
      ? (opportunities.filter(o => o.stage === 'ganho').length / opportunities.length) * 100 
      : 0;

    // Análise mensal
    const monthlyData = {};
    orders.forEach(order => {
      const date = new Date(order.created_date);
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      if (!monthlyData[key]) {
        monthlyData[key] = { revenue: 0, orders: 0 };
      }
      monthlyData[key].revenue += order.total_value || 0;
      monthlyData[key].orders += 1;
    });

    const monthlyArray = Object.entries(monthlyData)
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-6)
      .map(([month, data]) => ({
        month,
        revenue: data.revenue,
        orders: data.orders
      }));

    // Top clientes
    const clientRevenue = {};
    orders.forEach(order => {
      const clientId = order.client_id;
      if (!clientRevenue[clientId]) {
        clientRevenue[clientId] = {
          name: order.client_name,
          revenue: 0,
          orders: 0
        };
      }
      clientRevenue[clientId].revenue += order.total_value || 0;
      clientRevenue[clientId].orders += 1;
    });

    const topClients = Object.values(clientRevenue)
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);

    // Análise de pipeline
    const pipelineByStage = {
      proposta_enviada: opportunities.filter(o => o.stage === 'proposta_enviada').length,
      em_negociacao: opportunities.filter(o => o.stage === 'em_negociacao').length,
      ganho: opportunities.filter(o => o.stage === 'ganho').length,
      perdido: opportunities.filter(o => o.stage === 'perdido').length
    };

    const pipelineValue = opportunities
      .filter(o => o.stage !== 'perdido' && o.stage !== 'ganho')
      .reduce((sum, o) => sum + (o.value_estimated || 0), 0);

    return {
      period: period === 'all' ? 'Todo período' : period,
      year: yearFilter === 'all' ? 'Todos os anos' : yearFilter,
      summary: {
        total_revenue: totalRevenue,
        total_orders: orders.length,
        avg_ticket: avgTicket,
        conversion_rate: conversionRate,
        active_clients: clients.filter(c => c.status === 'active').length,
        at_risk_clients: clients.filter(c => c.status === 'at_risk').length
      },
      monthly_trend: monthlyArray,
      top_clients: topClients,
      pipeline: {
        by_stage: pipelineByStage,
        total_value: pipelineValue,
        total_opportunities: opportunities.length
      },
      segments: getSegmentBreakdown(orders, clients),
      recent_wins: opportunities.filter(o => o.stage === 'ganho').slice(-5).map(o => ({
        client: o.client_name,
        value: o.value_estimated
      })),
      recent_losses: opportunities.filter(o => o.stage === 'perdido').slice(-5).map(o => ({
        client: o.client_name,
        reason: o.loss_reason
      }))
    };
  };

  const getSegmentBreakdown = (orders, clients) => {
    const segments = {};
    orders.forEach(order => {
      const client = clients.find(c => c.id === order.client_id);
      const segment = client?.segment || 'Outros';
      if (!segments[segment]) {
        segments[segment] = { revenue: 0, orders: 0 };
      }
      segments[segment].revenue += order.total_value || 0;
      segments[segment].orders += 1;
    });
    return segments;
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800 border-red-300';
      case 'medium': return 'bg-amber-100 text-amber-800 border-amber-300';
      case 'low': return 'bg-blue-100 text-blue-800 border-blue-300';
      default: return 'bg-slate-100 text-slate-800 border-slate-300';
    }
  };

  const getTypeIcon = (type) => {
    switch (type) {
      case 'marketing': return <Target className="w-4 h-4" />;
      case 'sales': return <TrendingUp className="w-4 h-4" />;
      case 'retention': return <AlertTriangle className="w-4 h-4" />;
      case 'expansion': return <Sparkles className="w-4 h-4" />;
      default: return <Zap className="w-4 h-4" />;
    }
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <Card className="bg-gradient-to-br from-purple-50 to-indigo-50 border-purple-200">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-xl flex items-center justify-center">
                <Sparkles className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900">Análise com Inteligência Artificial</h3>
                <p className="text-sm text-slate-600">Insights preditivos, ações recomendadas e resumo executivo</p>
              </div>
            </div>
            <Button
              onClick={analyzeWithAI}
              disabled={isAnalyzing}
              className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700"
            >
              {isAnalyzing ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Analisando...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 mr-2" />
                  Gerar Análise IA
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Results */}
      {analysis && (
        <>
          {/* Resumo Executivo */}
          <Card className="border-indigo-200">
            <CardHeader className="cursor-pointer hover:bg-slate-50" onClick={() => toggleSection('executive')}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-indigo-600" />
                  <CardTitle className="text-lg">📊 Resumo Executivo</CardTitle>
                </div>
                {expandedSections.executive ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
              </div>
            </CardHeader>
            {expandedSections.executive && analysis.executive_summary && (
              <CardContent className="space-y-4">
                <div className="p-4 bg-indigo-50 rounded-lg border border-indigo-200">
                  <p className="text-sm leading-relaxed text-slate-800">{analysis.executive_summary.overview}</p>
                </div>

                {analysis.executive_summary.highlights && (
                  <div>
                    <h4 className="font-semibold text-sm mb-2 text-slate-700">Destaques Principais:</h4>
                    <div className="space-y-2">
                      {analysis.executive_summary.highlights.map((highlight, idx) => (
                        <div key={idx} className="flex items-start gap-2 text-sm">
                          <ArrowRight className="w-4 h-4 text-indigo-600 mt-0.5 flex-shrink-0" />
                          <span className="text-slate-700">{highlight}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {analysis.executive_summary.key_metrics && (
                  <div>
                    <h4 className="font-semibold text-sm mb-2 text-slate-700">Métricas-Chave:</h4>
                    <div className="grid gap-2">
                      {analysis.executive_summary.key_metrics.map((metric, idx) => (
                        <div key={idx} className="p-3 bg-white rounded-lg border border-slate-200">
                          <div className="flex items-center justify-between mb-1">
                            <span className="font-medium text-slate-900">{metric.metric}</span>
                            <Badge variant="outline">{metric.value}</Badge>
                          </div>
                          <p className="text-xs text-slate-600">{metric.interpretation}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {analysis.executive_summary.bottom_line && (
                  <div className="p-4 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-lg text-white">
                    <p className="text-sm font-medium">{analysis.executive_summary.bottom_line}</p>
                  </div>
                )}
              </CardContent>
            )}
          </Card>

          {/* Previsões */}
          <Card className="border-emerald-200">
            <CardHeader className="cursor-pointer hover:bg-slate-50" onClick={() => toggleSection('predictions')}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-emerald-600" />
                  <CardTitle className="text-lg">🔮 Insights Preditivos</CardTitle>
                </div>
                {expandedSections.predictions ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
              </div>
            </CardHeader>
            {expandedSections.predictions && analysis.predictions && (
              <CardContent>
                <div className="space-y-3">
                  {analysis.predictions.map((pred, idx) => (
                    <div key={idx} className="p-4 bg-emerald-50 rounded-lg border border-emerald-200">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="font-semibold text-slate-900">{pred.title}</h4>
                            {pred.confidence && (
                              <Badge className="bg-emerald-100 text-emerald-800">
                                {pred.confidence}
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-slate-700">{pred.description}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4 mt-2 text-xs">
                        {pred.impact && (
                          <span className="text-emerald-700 font-medium">Impacto: {pred.impact}</span>
                        )}
                        {pred.value && (
                          <span className="text-slate-600">Valor estimado: {pred.value}</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            )}
          </Card>

          {/* Ações Recomendadas */}
          <Card className="border-blue-200">
            <CardHeader className="cursor-pointer hover:bg-slate-50" onClick={() => toggleSection('actions')}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Target className="w-5 h-5 text-blue-600" />
                  <CardTitle className="text-lg">🎯 Ações Recomendadas</CardTitle>
                </div>
                {expandedSections.actions ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
              </div>
            </CardHeader>
            {expandedSections.actions && analysis.actions && (
              <CardContent>
                <div className="space-y-3">
                  {analysis.actions.map((action, idx) => (
                    <div key={idx} className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                          {getTypeIcon(action.type)}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-start justify-between mb-2">
                            <h4 className="font-semibold text-slate-900">{action.title}</h4>
                            <Badge className={getPriorityColor(action.priority)}>
                              {action.priority === 'high' ? 'Alta' : action.priority === 'medium' ? 'Média' : 'Baixa'}
                            </Badge>
                          </div>
                          <p className="text-sm text-slate-700 mb-2">{action.description}</p>
                          <div className="flex items-center gap-4 text-xs">
                            {action.expected_impact && (
                              <span className="text-blue-700 font-medium">💡 {action.expected_impact}</span>
                            )}
                            {action.timeline && (
                              <span className="text-slate-600">⏱️ {action.timeline}</span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            )}
          </Card>
        </>
      )}
    </div>
  );
}