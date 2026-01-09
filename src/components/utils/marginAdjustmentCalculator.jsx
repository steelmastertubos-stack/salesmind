/**
 * Calcula o ajuste de margem baseado na condição de pagamento
 * Segue política financeira VTK com penalização por dias adicionais
 */

/**
 * Extrai os prazos de uma condição de pagamento
 * Exemplos: "30/45/60", "À vista/30", "30 dias"
 */
export function extractPaymentTerms(paymentCondition) {
  if (!paymentCondition) return [];
  
  // Remover espaços extras e converter para minúsculas
  const condition = paymentCondition.trim().toLowerCase();
  
  // Mapear termos comuns
  const termMap = {
    'à vista': 0,
    'vista': 0,
    '0 dias': 0,
    'imediato': 0,
  };
  
  // Verificar se tem termo especial
  for (const [term, days] of Object.entries(termMap)) {
    if (condition.includes(term)) {
      return [days];
    }
  }
  
  // Extrair números (prazos em dias)
  const matches = condition.match(/\d+/g);
  return matches ? matches.map(m => parseInt(m, 10)) : [];
}

/**
 * Calcula a média de prazos de pagamento
 * Exemplos:
 * [30, 45, 60] → 45
 * [0, 30] → 15
 * [30] → 30
 */
export function calculateAveragePaymentTerm(paymentTerms) {
  if (!paymentTerms || paymentTerms.length === 0) return 0;
  
  const sum = paymentTerms.reduce((acc, term) => acc + term, 0);
  return Math.round(sum / paymentTerms.length);
}

/**
 * Calcula os dias penalizáveis
 * Os primeiros 30 dias NÃO geram penalização (já embutidos no custo)
 * dias_penalizaveis = max(prazo_medio - 30, 0)
 */
export function calculatePenalizableDays(averageTerm) {
  return Math.max(averageTerm - 30, 0);
}

/**
 * Calcula o ajuste de margem em %
 * 1,5% de margem a cada 30 dias adicionais
 * ajuste_margem (%) = (dias_penalizaveis / 30) × 1,5
 */
export function calculateMarginAdjustment(penalizableDays) {
  return (penalizableDays / 30) * 1.5;
}

/**
 * Calcula a margem considerada após ajuste
 * margem_considerada = margem_original - ajuste_margem
 * Nunca permite margem negativa
 */
export function calculateConsideredMargin(originalMargin, marginAdjustment) {
  const considered = originalMargin - marginAdjustment;
  return Math.max(considered, 0); // Impede margem negativa
}

/**
 * Função completa que executa todo o cálculo
 */
export function calculateMarginAdjustmentFull(paymentCondition, originalMargin) {
  // Passo 1: Extrair prazos
  const terms = extractPaymentTerms(paymentCondition);
  
  // Passo 2: Calcular média
  const averageTerm = calculateAveragePaymentTerm(terms);
  
  // Passo 3: Calcular dias penalizáveis
  const penalizableDays = calculatePenalizableDays(averageTerm);
  
  // Passo 4: Calcular ajuste
  const marginAdjustment = calculateMarginAdjustment(penalizableDays);
  
  // Passo 5: Calcular margem considerada
  const consideredMargin = calculateConsideredMargin(originalMargin, marginAdjustment);
  
  return {
    paymentTerms: terms,
    averageTerm,
    penalizableDays,
    marginAdjustment,
    originalMargin,
    consideredMargin,
    isAdjusted: marginAdjustment > 0
  };
}

/**
 * Retorna a faixa de comissão VTK baseada na margem considerada
 */
export function getVTKCommissionBracket(margin) {
  const vtkTable = [
    { minMargin: 15, maxMargin: 19.99, rate: 0.50, bracket: 'A' },
    { minMargin: 20, maxMargin: 20.49, rate: 0.60, bracket: 'B' },
    { minMargin: 20.5, maxMargin: 20.99, rate: 0.67, bracket: 'C' },
    { minMargin: 21, maxMargin: 21.49, rate: 0.74, bracket: 'D' },
    { minMargin: 21.5, maxMargin: 21.99, rate: 0.81, bracket: 'E' },
    { minMargin: 22, maxMargin: 22.49, rate: 0.88, bracket: 'F' },
    { minMargin: 22.5, maxMargin: 22.99, rate: 0.95, bracket: 'G' },
    { minMargin: 23, maxMargin: 23.49, rate: 1.02, bracket: 'H' },
    { minMargin: 23.5, maxMargin: 23.99, rate: 1.09, bracket: 'I' },
    { minMargin: 24, maxMargin: 24.49, rate: 1.16, bracket: 'J' },
    { minMargin: 24.5, maxMargin: 24.99, rate: 1.23, bracket: 'K' },
    { minMargin: 25, maxMargin: 25.49, rate: 1.30, bracket: 'L' },
    { minMargin: 25.5, maxMargin: 25.99, rate: 1.37, bracket: 'M' },
    { minMargin: 26, maxMargin: 26.49, rate: 1.44, bracket: 'N' },
    { minMargin: 26.5, maxMargin: 26.99, rate: 1.51, bracket: 'O' },
    { minMargin: 27, maxMargin: 27.49, rate: 1.58, bracket: 'P' },
    { minMargin: 27.5, maxMargin: 27.99, rate: 1.65, bracket: 'Q' },
    { minMargin: 28, maxMargin: 28.49, rate: 1.72, bracket: 'R' },
    { minMargin: 28.5, maxMargin: 28.99, rate: 1.79, bracket: 'S' },
    { minMargin: 29, maxMargin: 29.49, rate: 1.86, bracket: 'T' },
    { minMargin: 29.5, maxMargin: 29.99, rate: 1.93, bracket: 'U' },
    { minMargin: 30, maxMargin: 30.49, rate: 2.00, bracket: 'V' },
    { minMargin: 30.5, maxMargin: 30.99, rate: 2.10, bracket: 'W' },
    { minMargin: 31, maxMargin: 31.49, rate: 2.20, bracket: 'X' },
    { minMargin: 31.5, maxMargin: 31.99, rate: 2.30, bracket: 'Y' },
    { minMargin: 32, maxMargin: 32.49, rate: 2.40, bracket: 'Z1' },
    { minMargin: 32.5, maxMargin: 32.99, rate: 2.50, bracket: 'Z2' },
    { minMargin: 33, maxMargin: 33.49, rate: 2.60, bracket: 'Z3' },
    { minMargin: 33.5, maxMargin: 33.99, rate: 2.70, bracket: 'Z4' },
    { minMargin: 34, maxMargin: 34.49, rate: 2.80, bracket: 'Z5' },
    { minMargin: 34.5, maxMargin: 34.99, rate: 2.90, bracket: 'Z6' },
    { minMargin: 35, maxMargin: 49.99, rate: 3.00, bracket: 'Z7' },
    { minMargin: 50, maxMargin: 64.99, rate: 4.00, bracket: 'Z8' },
    { minMargin: 65, maxMargin: Infinity, rate: 5.00, bracket: 'Z9' }
  ];
  
  const bracket = vtkTable.find(b => margin >= b.minMargin && margin <= b.maxMargin);
  return bracket || { minMargin: 0, maxMargin: 14.99, rate: 0, bracket: 'ABAIXO_DO_MÍNIMO' };
}