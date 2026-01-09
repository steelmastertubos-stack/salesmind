import React from 'react';
import { AlertCircle, TrendingDown, DollarSign } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { calculateMarginAdjustmentFull } from '@/components/utils/marginAdjustmentCalculator';

export default function MarginAdjustmentDisplay({ paymentCondition, originalMargin, showDetails = true }) {
  if (!paymentCondition || !originalMargin) {
    return null;
  }

  const calculation = calculateMarginAdjustmentFull(paymentCondition, originalMargin);

  return (
    <div className="space-y-3">
      {/* Alerta se houver ajuste significativo */}
      {calculation.marginAdjustment > 1 && (
        <Alert className="border-orange-200 bg-orange-50">
          <AlertCircle className="h-4 w-4 text-orange-600" />
          <AlertDescription className="text-orange-800">
            ⚠️ Ajuste de margem aplicado: <strong>-{calculation.marginAdjustment.toFixed(2)}%</strong>
            {calculation.consideredMargin < 20 && (
              <span className="block mt-1 text-xs">
                ⚠️ Margem considerada abaixo de 20% pode resultar em comissão inferior.
              </span>
            )}
          </AlertDescription>
        </Alert>
      )}

      {/* Card com cálculo detalhado */}
      {showDetails && (
        <Card className="border-slate-200 bg-slate-50">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <DollarSign className="w-4 h-4" />
              Ajuste de Margem Financeira
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {/* Prazos extraídos */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-white p-2 rounded border border-slate-200">
                <p className="text-xs text-slate-600">Condição de Pagamento</p>
                <p className="font-mono font-semibold text-sm">{paymentCondition}</p>
              </div>
              <div className="bg-white p-2 rounded border border-slate-200">
                <p className="text-xs text-slate-600">Prazos Extraídos</p>
                <p className="font-mono font-semibold text-sm">
                  {calculation.paymentTerms.length > 0 
                    ? calculation.paymentTerms.join(' / ') + ' dias'
                    : 'N/A'
                  }
                </p>
              </div>
            </div>

            {/* Cálculos principais */}
            <div className="space-y-2 pt-2 border-t border-slate-200">
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-700">📅 Prazo Médio</span>
                <span className="font-mono font-semibold">{calculation.averageTerm} dias</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-700">⏱️ Dias Penalizáveis</span>
                <span className="font-mono font-semibold text-orange-600">
                  {calculation.penalizableDays} dias
                </span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-700">📊 Margem Original</span>
                <span className="font-mono font-semibold">{originalMargin.toFixed(2)}%</span>
              </div>
              {calculation.marginAdjustment > 0 && (
                <div className="flex items-center justify-between text-sm pt-2 border-t border-slate-200">
                  <span className="text-slate-700 flex items-center gap-2">
                    <TrendingDown className="w-4 h-4 text-red-500" />
                    Ajuste Aplicado
                  </span>
                  <span className="font-mono font-semibold text-red-600">
                    -{calculation.marginAdjustment.toFixed(2)}%
                  </span>
                </div>
              )}
            </div>

            {/* Margem considerada - destaque principal */}
            <div className="bg-green-50 border-2 border-green-200 rounded p-3 mt-3">
              <p className="text-xs text-green-700 font-medium mb-1">✅ MARGEM CONSIDERADA</p>
              <p className="text-2xl font-bold text-green-700">
                {calculation.consideredMargin.toFixed(2)}%
              </p>
              <p className="text-xs text-green-600 mt-1">
                {calculation.consideredMargin < 15 && "⚠️ Abaixo do mínimo VTK"}
                {calculation.consideredMargin >= 15 && calculation.consideredMargin < 20 && "⚠️ Comissão reduzida"}
                {calculation.consideredMargin >= 20 && "✓ Margem adequada"}
              </p>
            </div>

            {/* Fórmula explicativa */}
            <div className="text-xs text-slate-600 bg-white p-2 rounded border border-slate-200 mt-3">
              <p className="font-mono space-y-1">
                <span className="block">Fórmula: (dias_penalizáveis / 30) × 1,5%</span>
                <span className="block">({calculation.penalizableDays} / 30) × 1,5 = {calculation.marginAdjustment.toFixed(2)}%</span>
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Versão compacta (apenas números) */}
      {!showDetails && (
        <div className="flex items-center gap-2 text-xs">
          <Badge variant="outline">{originalMargin.toFixed(2)}%</Badge>
          {calculation.marginAdjustment > 0 && (
            <>
              <span className="text-slate-400">→</span>
              <Badge className="bg-green-100 text-green-800">
                {calculation.consideredMargin.toFixed(2)}%
              </Badge>
            </>
          )}
          {calculation.marginAdjustment > 0 && (
            <span className="text-orange-600 text-xs font-medium">
              (-{calculation.marginAdjustment.toFixed(2)}%)
            </span>
          )}
        </div>
      )}
    </div>
  );
}