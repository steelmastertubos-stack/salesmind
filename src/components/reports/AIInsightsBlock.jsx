import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Sparkles, TrendingUp, AlertTriangle, Target } from 'lucide-react';

export default function AIInsightsBlock({ insights, onGenerateAction }) {
  if (!insights || insights.length === 0) return null;

  return (
    <Card className="border-purple-200 bg-gradient-to-br from-purple-50 to-white">
      <CardHeader>
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-purple-600" />
          <CardTitle className="text-base">🧠 Insights IA</CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {insights.map((insight, idx) => (
            <div 
              key={idx} 
              className="p-3 bg-white rounded-lg border border-slate-200 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between gap-3 mb-2">
                <p className="text-sm text-slate-700 flex-1">{insight.text}</p>
                <Badge 
                  variant={insight.type === 'opportunity' ? 'success' : 'warning'}
                  className={insight.type === 'opportunity' ? 'bg-emerald-100 text-emerald-700' : 'bg-orange-100 text-orange-700'}
                >
                  {insight.type === 'opportunity' ? (
                    <>
                      <Target className="w-3 h-3 mr-1" />
                      Oportunidade
                    </>
                  ) : (
                    <>
                      <AlertTriangle className="w-3 h-3 mr-1" />
                      Atenção
                    </>
                  )}
                </Badge>
              </div>
              <div className="flex items-center gap-2">
                <Button 
                  size="sm" 
                  className="bg-purple-600 hover:bg-purple-700"
                  onClick={() => onGenerateAction(insight)}
                >
                  Gerar Ação
                </Button>
                {insight.filters && (
                  <div className="flex gap-1">
                    {Object.entries(insight.filters).map(([key, value]) => (
                      <Badge key={key} variant="outline" className="text-xs">
                        {key}: {value}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}