import { base44 } from '@/api/base44Client';

/**
 * Busca o custo correto da tabela VTK
 */
export async function getVTKCost({
  abaName,
  productType,
  specification,
  category,
  bitola,
  schedule
}) {
  try {
    const costs = await base44.entities.VTKCost.filter({
      aba_name: abaName,
      product_type: productType,
      bitola: bitola,
      schedule: schedule,
      is_active: true
    }, 'aba_date', 1);

    if (costs.length === 0) {
      return {
        found: false,
        error: `Custo não encontrado: ${bitola}" ${schedule}`
      };
    }

    // Retorna o custo mais recente
    const cost = costs[0];
    return {
      found: true,
      cost_per_unit: cost.cost_per_unit,
      aba_name: cost.aba_name,
      aba_date: cost.aba_date,
      unit: cost.unit,
      specification: cost.specification,
      category: cost.category,
      notes: cost.notes,
      cost_id: cost.id
    };
  } catch (error) {
    return {
      found: false,
      error: 'Erro ao buscar custo: ' + error.message
    };
  }
}

/**
 * Calcula margem baseada em custo VTK
 */
export function calculateVTKMargin(saleValue, costTotal) {
  if (costTotal <= 0) {
    return {
      margin_pct: 0,
      error: 'Custo total inválido'
    };
  }

  const margin = ((saleValue - costTotal) / saleValue) * 100;

  return {
    margin_pct: margin,
    sale_value: saleValue,
    cost_total: costTotal,
    margin_absolute: saleValue - costTotal
  };
}

/**
 * Aplica ajuste de prazo na margem
 * Prazo médio > 40 dias: reduz margem em 0.5 p.p.
 */
export function applyPaymentTermsAdjustment(marginPct, averagePaymentDays) {
  let adjustedMargin = marginPct;
  let adjustment = 0;

  if (averagePaymentDays > 40) {
    adjustment = -0.5; // Reduz 0.5 pontos percentuais
    adjustedMargin = marginPct + adjustment;
  }

  return {
    original_margin: marginPct,
    adjustment: adjustment,
    adjusted_margin: Math.max(0, adjustedMargin), // Não pode ser negativo
    average_payment_days: averagePaymentDays
  };
}

/**
 * Busca comissão VTK conforme margem
 */
export function getVTKCommissionRate(marginPct) {
  const vtkTable = [
    { minMargin: 15, maxMargin: 19.99, rate: 0.50 },
    { minMargin: 20, maxMargin: 20, rate: 0.60 },
    { minMargin: 20.5, maxMargin: 20.5, rate: 0.67 },
    { minMargin: 21, maxMargin: 21, rate: 0.74 },
    { minMargin: 21.5, maxMargin: 21.5, rate: 0.81 },
    { minMargin: 22, maxMargin: 22, rate: 0.88 },
    { minMargin: 22.5, maxMargin: 22.5, rate: 0.95 },
    { minMargin: 23, maxMargin: 23, rate: 1.02 },
    { minMargin: 23.5, maxMargin: 23.5, rate: 1.09 },
    { minMargin: 24, maxMargin: 24, rate: 1.16 },
    { minMargin: 24.5, maxMargin: 24.5, rate: 1.23 },
    { minMargin: 25, maxMargin: 25, rate: 1.30 },
    { minMargin: 25.5, maxMargin: 25.5, rate: 1.37 },
    { minMargin: 26, maxMargin: 26, rate: 1.44 },
    { minMargin: 26.5, maxMargin: 26.5, rate: 1.51 },
    { minMargin: 27, maxMargin: 27, rate: 1.58 },
    { minMargin: 27.5, maxMargin: 27.5, rate: 1.65 },
    { minMargin: 28, maxMargin: 28, rate: 1.72 },
    { minMargin: 28.5, maxMargin: 28.5, rate: 1.79 },
    { minMargin: 29, maxMargin: 29, rate: 1.86 },
    { minMargin: 29.5, maxMargin: 29.5, rate: 1.93 },
    { minMargin: 30, maxMargin: 30, rate: 2.00 },
    { minMargin: 30.5, maxMargin: 30.5, rate: 2.10 },
    { minMargin: 31, maxMargin: 31, rate: 2.20 },
    { minMargin: 31.5, maxMargin: 31.5, rate: 2.30 },
    { minMargin: 32, maxMargin: 32, rate: 2.40 },
    { minMargin: 32.5, maxMargin: 32.5, rate: 2.50 },
    { minMargin: 33, maxMargin: 33, rate: 2.60 },
    { minMargin: 33.5, maxMargin: 33.5, rate: 2.70 },
    { minMargin: 34, maxMargin: 34, rate: 2.80 },
    { minMargin: 34.5, maxMargin: 34.5, rate: 2.90 },
    { minMargin: 35, maxMargin: 49.99, rate: 3.00 },
    { minMargin: 50, maxMargin: 64.99, rate: 4.00 },
    { minMargin: 65, maxMargin: Infinity, rate: 5.00 }
  ];

  const bracket = vtkTable.find(b => marginPct >= b.minMargin && marginPct <= b.maxMargin);
  
  return {
    commission_rate: bracket?.rate || 0,
    bracket_info: bracket || { minMargin: 0, maxMargin: 0, rate: 0 }
  };
}

/**
 * Orquestra o cálculo completo de margem e comissão VTK
 */
export function calculateCompleteVTKCommission({
  saleValue,
  costTotal,
  averagePaymentDays = 30
}) {
  // 1. Calcular margem original
  const margin = calculateVTKMargin(saleValue, costTotal);
  
  if (margin.error) {
    return {
      success: false,
      error: margin.error
    };
  }

  // 2. Aplicar ajuste de prazo
  const adjustment = applyPaymentTermsAdjustment(margin.margin_pct, averagePaymentDays);

  // 3. Buscar comissão conforme margem ajustada
  const commission = getVTKCommissionRate(adjustment.adjusted_margin);

  // 4. Calcular valor de comissão
  const commissionValue = saleValue * (commission.commission_rate / 100);

  return {
    success: true,
    original_margin_pct: margin.margin_pct,
    margin_adjustment: adjustment.adjustment,
    adjusted_margin_pct: adjustment.adjusted_margin,
    average_payment_days: averagePaymentDays,
    commission_rate: commission.commission_rate,
    commission_value: commissionValue,
    bracket: commission.bracket_info,
    cost_total: costTotal,
    sale_value: saleValue
  };
}

/**
 * Validação antes de salvar orçamento VTK
 */
export function validateVTKQuoteItem(item, vtkCostData) {
  const errors = [];

  if (!vtkCostData || !vtkCostData.found) {
    errors.push(`Custo VTK não encontrado para ${item.bitola}" ${item.schedule}`);
  }

  if (!item.cost_per_kg || item.cost_per_kg <= 0) {
    errors.push('Custo por KG não definido');
  }

  if (!item.total_weight || item.total_weight <= 0) {
    errors.push('Peso total não calculado');
  }

  if (!item.item_total || item.item_total <= 0) {
    errors.push('Valor total do item não calculado');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}