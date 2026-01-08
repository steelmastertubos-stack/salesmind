import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { 
  Brain, 
  TrendingUp, 
  Calendar, 
  Target,
  Sparkles,
  Loader2,
  AlertCircle,
  CheckCircle,
  MessageCircle,
  FileText,
  Phone
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';

export default function PurchasePrediction({ client, orders = [] }) {
  const [prediction, setPrediction] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const analyzePurchasePattern = async () => {
    if (orders.length === 0) {
      toast.error('Cliente não possui histórico de compras');
      return;
    }

    setIsAnalyzing(true);
    try {
      // Prepare purchase history data
      const purchaseHistory = orders
        .filter(o => o.status !== 'cancelled')
        .map(o => ({
          date: o.created_date,
          value: o.total_value,
          items: o.items?.map(i => ({
            product: i.product_name,
            quantity: i.quantity,
            price: i.unit_price
          })) || []
        }))
        .slice(0, 20); // Last 20 orders

      const currentDate = new Date().toISOString().split('T')[0];

      const prompt = `Você é um assistente especializado em análise preditiva de vendas B2B.

DADOS DO CLIENTE:
- Nome: ${client.trade_name || client.company_name}
- Segmento: ${client.segment || 'Não especificado'}
- Ciclo médio de compra: ${client.average_purchase_cycle || 'Não calculado'} dias
- Ticket médio: R$ ${(client.average_ticket || 0).toFixed(2)}
- Última compra: ${client.last_purchase_date || 'Nunca comprou'}
- Produto mais comprado: ${client.last_purchase_product || 'N/A'}

HISTÓRICO DE COMPRAS (${purchaseHistory.length} pedidos):
${JSON.stringify(purchaseHistory, null, 2)}

DATA ATUAL: ${currentDate}

TAREFA:
Analise o padrão de compras deste cliente e forneça:

1. PREVISÃO DE PRÓXIMA COMPRA
   - Data estimada da próxima compra
   - Nível de confiança da previsão (0-100)
   - Produtos que provavelmente serão comprados
   - Valor estimado da compra

2. ANÁLISE DE PADRÕES
   - Identificar frequência de compra (regular, irregular, sazonal)
   - Detectar tendências (crescimento, estabilidade, declínio)
   - Identificar sazonalidade (mês do ano, dia da semana, etc)
   - Produtos mais recorrentes

3. ALERTAS E OPORTUNIDADES
   - Cliente está atrasado para comprar? (sim/não e quantos dias)
   - Risco de perda do cliente? (baixo/médio/alto)
   - Oportunidades de upsell ou cross-sell
   - Momento ideal para contato

4. RECOMENDAÇÕES DE AÇÃO (3-5 ações específicas e práticas)
   - Ações prioritárias com timing específico
   - Abordagem recomendada
   - Ofertas personalizadas baseadas no histórico

Seja objetivo, prático e focado em gerar vendas.`;

      const result = await base44.integrations.Core.InvokeLLM({
        prompt,
        response_json_schema: {
          type: "object",
          properties: {
            next_purchase: {
              type: "object",
              properties: {
                predicted_date: { type: "string" },
                confidence: { type: "number" },
                predicted_products: { type: "array", items: { type: "string" } },
                estimated_value: { type: "number" }
              }
            },
            patterns: {
              type: "object",
              properties: {
                frequency: { type: "string" },
                trend: { type: "string" },
                seasonality: { type: "string" },
                top_products: { type: "array", items: { type: "string" } }
              }
            },
            alerts: {
              type: "object",
              properties: {
                is_overdue: { type: "boolean" },
                days_overdue: { type: "number" },
                churn_risk: { type: "string" },
                opportunities: { type: "array", items: { type: "string" } },
                best_contact_time: { type: "string" }
              }
            },
            recommendations: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  action: { type: "string" },
                  timing: { type: "string" },
                  approach: { type: "string" },
                  expected_outcome: { type: "string" }
                }
              }
            }
          }
        }
      });

      setPrediction(result);
      toast.success('Análise preditiva concluída!');
    } catch (error) {
      console.error('Error analyzing purchase pattern:', error);
      toast.error('Erro ao analisar padrão de compras');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const formatDate = (dateStr) => {
    try {
      return new Date(dateStr).toLocaleDateString('pt-BR', { 
        day: 'numeric', 
        month: 'long', 
        year: 'numeric' 
      });
    } catch {
      return dateStr;
    }
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value || 0);
  };

  const getChurnRiskConfig = (risk) => {
    switch (risk?.toLowerCase()) {
      case 'alto':
      case 'high':
        return { color: 'bg-red-100 text-red-700 border-red-200', icon: AlertCircle, label: 'Alto Risco' };
      case 'médio':
      case 'medio':
      case 'medium':
        return { color: 'bg-amber-100 text-amber-700 border-amber-200', icon: AlertCircle, label: 'Risco Médio' };
      default:
        return { color: 'bg-emerald-100 text-emerald-700 border-emerald-200', icon: CheckCircle, label: 'Baixo Risco' };
    }
  };

  const getActionIcon = (action) => {
    const actionLower = action?.toLowerCase() || '';
    if (actionLower.includes('whatsapp') || actionLower.includes('mensagem')) return MessageCircle;
    if (actionLower.includes('ligar') || actionLower.includes('telefone') || actionLower.includes('ligação')) return Phone;
    if (actionLower.includes('orçamento') || actionLower.includes('proposta')) return FileText;
    return Target;
  };

  if (!prediction && !isAnalyzing) {
    return (
      <Card className="border-dashed">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Brain className="w-5 h-5 text-purple-600" />
            <CardTitle>Análise Preditiva com IA</CardTitle>
          </div>
          <CardDescription>
            Use inteligência artificial para prever a próxima compra e receber recomendações personalizadas
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button 
            onClick={analyzePurchasePattern}
            disabled={orders.length === 0}
            className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700"
          >
            <Sparkles className="w-4 h-4 mr-2" />
            Analisar com IA
          </Button>
          {orders.length === 0 && (
            <p className="text-xs text-amber-600 mt-3 text-center">
              Cliente precisa ter histórico de compras para análise
            </p>
          )}
        </CardContent>
      </Card>
    );
  }

  if (isAnalyzing) {
    return (
      <Card>
        <CardContent className="py-12">
          <div className="flex flex-col items-center justify-center gap-3">
            <Loader2 className="w-8 h-8 text-purple-600 animate-spin" />
            <p className="text-sm text-slate-600">Analisando padrões de compra com IA...</p>
            <p className="text-xs text-slate-400">Isso pode levar alguns segundos</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const churnRisk = getChurnRiskConfig(prediction?.alerts?.churn_risk);
  const ChurnIcon = churnRisk.icon;

  return (
    <div className="space-y-4">
      {/* Prediction Card */}
      <Card className="border-2 border-purple-200 bg-gradient-to-br from-purple-50 to-indigo-50">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 bg-purple-600 rounded-xl flex items-center justify-center">
                <Brain className="w-5 h-5 text-white" />
              </div>
              <div>
                <CardTitle className="text-purple-900">Previsão de Próxima Compra</CardTitle>
                <CardDescription>Baseado em análise de IA</CardDescription>
              </div>
            </div>
            <Button
              size="sm"
              variant="outline"
              onClick={analyzePurchasePattern}
              disabled={isAnalyzing}
            >
              Atualizar
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid sm:grid-cols-2 gap-4 mb-4">
            <div className="bg-white rounded-xl p-4 border border-purple-100">
              <div className="flex items-center gap-2 mb-2">
                <Calendar className="w-4 h-4 text-purple-600" />
                <span className="text-xs text-slate-500">Data Prevista</span>
              </div>
              <p className="text-lg font-bold text-slate-900">
                {prediction?.next_purchase?.predicted_date 
                  ? formatDate(prediction.next_purchase.predicted_date)
                  : 'N/A'}
              </p>
              {prediction?.next_purchase?.confidence && (
                <div className="flex items-center gap-2 mt-2">
                  <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-purple-600 to-indigo-600 rounded-full"
                      style={{ width: `${prediction.next_purchase.confidence}%` }}
                    />
                  </div>
                  <span className="text-xs font-medium text-purple-600">
                    {prediction.next_purchase.confidence}%
                  </span>
                </div>
              )}
            </div>

            <div className="bg-white rounded-xl p-4 border border-purple-100">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="w-4 h-4 text-emerald-600" />
                <span className="text-xs text-slate-500">Valor Estimado</span>
              </div>
              <p className="text-lg font-bold text-emerald-600">
                {formatCurrency(prediction?.next_purchase?.estimated_value)}
              </p>
              <p className="text-xs text-slate-500 mt-1">
                Baseado no histórico
              </p>
            </div>
          </div>

          {prediction?.next_purchase?.predicted_products?.length > 0 && (
            <div className="bg-white rounded-xl p-4 border border-purple-100">
              <p className="text-xs text-slate-500 mb-2">Produtos Provavelmente Comprados:</p>
              <div className="flex flex-wrap gap-2">
                {prediction.next_purchase.predicted_products.map((product, i) => (
                  <Badge key={i} variant="secondary" className="bg-purple-100 text-purple-700">
                    {product}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Patterns Analysis */}
      {prediction?.patterns && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Análise de Padrões</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <div className="flex justify-between items-center p-3 bg-slate-50 rounded-lg">
                  <span className="text-sm text-slate-600">Frequência:</span>
                  <Badge>{prediction.patterns.frequency}</Badge>
                </div>
                <div className="flex justify-between items-center p-3 bg-slate-50 rounded-lg">
                  <span className="text-sm text-slate-600">Tendência:</span>
                  <Badge>{prediction.patterns.trend}</Badge>
                </div>
              </div>
              <div className="space-y-2">
                <div className="p-3 bg-slate-50 rounded-lg">
                  <span className="text-sm text-slate-600 block mb-1">Sazonalidade:</span>
                  <p className="text-sm font-medium">{prediction.patterns.seasonality}</p>
                </div>
              </div>
            </div>

            {prediction.patterns.top_products?.length > 0 && (
              <div className="mt-4">
                <p className="text-xs text-slate-500 mb-2">Produtos Mais Comprados:</p>
                <div className="flex flex-wrap gap-2">
                  {prediction.patterns.top_products.map((product, i) => (
                    <Badge key={i} variant="outline">
                      {product}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Alerts and Opportunities */}
      {prediction?.alerts && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Alertas e Oportunidades</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {prediction.alerts.is_overdue && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                <div className="flex items-center gap-2 mb-1">
                  <AlertCircle className="w-4 h-4 text-red-600" />
                  <span className="text-sm font-semibold text-red-900">Cliente Atrasado</span>
                </div>
                <p className="text-sm text-red-700">
                  {prediction.alerts.days_overdue} dias acima do ciclo esperado
                </p>
              </div>
            )}

            <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
              <span className="text-sm text-slate-600">Risco de Churn:</span>
              <Badge className={churnRisk.color}>
                <ChurnIcon className="w-3 h-3 mr-1" />
                {churnRisk.label}
              </Badge>
            </div>

            {prediction.alerts.best_contact_time && (
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-center gap-2 mb-1">
                  <Calendar className="w-4 h-4 text-blue-600" />
                  <span className="text-sm font-semibold text-blue-900">Melhor Momento para Contato</span>
                </div>
                <p className="text-sm text-blue-700">{prediction.alerts.best_contact_time}</p>
              </div>
            )}

            {prediction.alerts.opportunities?.length > 0 && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg">
                <p className="text-sm font-semibold text-emerald-900 mb-2">Oportunidades Identificadas:</p>
                <ul className="space-y-1">
                  {prediction.alerts.opportunities.map((opp, i) => (
                    <li key={i} className="text-sm text-emerald-700 flex items-start gap-2">
                      <CheckCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                      <span>{opp}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Recommendations */}
      {prediction?.recommendations?.length > 0 && (
        <Card className="border-2 border-emerald-200">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Target className="w-5 h-5 text-emerald-600" />
              Recomendações de Ação
            </CardTitle>
            <CardDescription>
              Ações práticas para maximizar as vendas com este cliente
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {prediction.recommendations.map((rec, index) => {
                const ActionIcon = getActionIcon(rec.action);
                return (
                  <div key={index} className="bg-slate-50 border border-slate-200 rounded-lg p-4">
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 bg-emerald-100 rounded-lg flex items-center justify-center flex-shrink-0">
                        <ActionIcon className="w-4 h-4 text-emerald-700" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-semibold text-slate-900">{rec.action}</h4>
                          {rec.timing && (
                            <Badge variant="outline" className="text-xs">
                              {rec.timing}
                            </Badge>
                          )}
                        </div>
                        {rec.approach && (
                          <p className="text-sm text-slate-600 mb-2">{rec.approach}</p>
                        )}
                        {rec.expected_outcome && (
                          <p className="text-xs text-emerald-700 flex items-center gap-1">
                            <CheckCircle className="w-3 h-3" />
                            {rec.expected_outcome}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}