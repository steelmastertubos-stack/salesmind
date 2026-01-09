/**
 * VTK Commission Calculator
 * Calcula comissão baseada em margem e prazo médio de pagamento
 */

/**
 * Calcula a margem original do pedido
 * @param {number} saleValue - Valor de venda
 * @param {number} costValue - Valor de custo
 * @returns {number} Margem em percentual
 */
export function calculateOriginalMargin(saleValue, costValue) {
  if (!saleValue || saleValue === 0) return 0;
  return ((saleValue - costValue) / saleValue) * 100;
}

/**
 * Calcula o prazo médio ponderado a partir das parcelas
 * @param {Array} installments - Array de {days, percentage}
 * @returns {number} Prazo médio em dias
 */
export function calculateAveragePaymentDays(installments) {
  if (!installments || installments.length === 0) return 0;
  
  return installments.reduce((sum, inst) => {
    return sum + (inst.days * (inst.percentage / 100));
  }, 0);
}

/**
 * Aplica ajuste de margem baseado no prazo médio
 * @param {number} originalMargin - Margem original em %
 * @param {number} averageDays - Prazo médio em dias
 * @returns {object} { adjustedMargin, adjustment }
 */
export function applyMarginAdjustment(originalMargin, averageDays) {
  const adjustment = averageDays > 40 ? -0.5 : 0;
  const adjustedMargin = originalMargin + adjustment;
  
  return {
    adjustedMargin: Math.max(0, adjustedMargin), // Não permitir margem negativa
    adjustment
  };
}

/**
 * Determina a faixa de comissão baseada na margem
 * @param {number} margin - Margem considerada em %
 * @param {Array} commissionTable - Tabela de faixas [{min_margin, max_margin, commission_rate, bracket_name}]
 * @returns {object} { bracketName, commissionRate }
 */
export function getCommissionBracket(margin, commissionTable) {
  if (!commissionTable || commissionTable.length === 0) {
    return { bracketName: 'Sem tabela', commissionRate: 0 };
  }
  
  // Ordena a tabela por margem mínima
  const sortedTable = [...commissionTable].sort((a, b) => a.min_margin - b.min_margin);
  
  // Encontra a faixa correspondente
  for (const bracket of sortedTable) {
    if (margin >= bracket.min_margin && margin <= bracket.max_margin) {
      return {
        bracketName: bracket.bracket_name || `${bracket.min_margin}% - ${bracket.max_margin}%`,
        commissionRate: bracket.commission_rate
      };
    }
  }
  
  // Se não encontrou nenhuma faixa, retorna 0
  return { bracketName: 'Fora da faixa', commissionRate: 0 };
}

/**
 * Calcula o valor da comissão
 * @param {number} saleValue - Valor de venda
 * @param {number} commissionRate - Taxa de comissão em %
 * @returns {number} Valor da comissão em R$
 */
export function calculateCommissionValue(saleValue, commissionRate) {
  return (saleValue * commissionRate) / 100;
}

/**
 * Função principal: calcula todos os dados de comissão VTK para um pedido
 * @param {object} order - Pedido com total_value, total_cost, average_payment_days ou payment_installments
 * @param {object} principal - Representado com vtk_commission_table
 * @returns {object} Dados completos de comissão
 */
export function calculateVTKCommission(order, principal) {
  // 1. Calcular margem original
  const originalMargin = calculateOriginalMargin(order.total_value, order.total_cost);
  
  // 2. Determinar prazo médio
  let averageDays = order.average_payment_days || 0;
  if (!averageDays && order.payment_installments && order.payment_installments.length > 0) {
    averageDays = calculateAveragePaymentDays(order.payment_installments);
  }
  
  // 3. Aplicar ajuste de margem
  const { adjustedMargin, adjustment } = applyMarginAdjustment(originalMargin, averageDays);
  
  // 4. Determinar faixa de comissão
  const { bracketName, commissionRate } = getCommissionBracket(
    adjustedMargin, 
    principal?.vtk_commission_table || []
  );
  
  // 5. Calcular comissão em R$
  const commissionValue = Math.max(0, calculateCommissionValue(order.total_value, commissionRate));
  
  return {
    original_margin_pct: parseFloat(originalMargin.toFixed(2)),
    average_payment_days: parseFloat(averageDays.toFixed(0)),
    margin_adjustment: adjustment,
    adjusted_margin_pct: parseFloat(adjustedMargin.toFixed(2)),
    commission_bracket: bracketName,
    commission_rate: commissionRate,
    expected_commission: parseFloat(commissionValue.toFixed(2))
  };
}

/**
 * Tabela VTK padrão (exemplo)
 */
export const DEFAULT_VTK_TABLE = [
  { min_margin: 0, max_margin: 4.99, commission_rate: 0, bracket_name: 'Faixa 1 (0-4.99%)' },
  { min_margin: 5, max_margin: 6.99, commission_rate: 1, bracket_name: 'Faixa 2 (5-6.99%)' },
  { min_margin: 7, max_margin: 8.99, commission_rate: 2, bracket_name: 'Faixa 3 (7-8.99%)' },
  { min_margin: 9, max_margin: 10.99, commission_rate: 3, bracket_name: 'Faixa 4 (9-10.99%)' },
  { min_margin: 11, max_margin: 12.99, commission_rate: 4, bracket_name: 'Faixa 5 (11-12.99%)' },
  { min_margin: 13, max_margin: 100, commission_rate: 5, bracket_name: 'Faixa 6 (13%+)' }
];