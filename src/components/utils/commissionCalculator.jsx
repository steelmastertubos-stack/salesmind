// Representados com comissão fixa (não usam VTK)
const FIXED_COMMISSION_REPRESENTATIVES = {
  'new aço': 3,
  'intersteel': 4
};

/**
 * Determina se um representado tem comissão fixa
 */
export function isFixedCommissionRepresentative(principalName) {
  if (!principalName) return false;
  const name = principalName.toLowerCase();
  return Object.keys(FIXED_COMMISSION_REPRESENTATIVES).some(
    rep => name.includes(rep)
  );
}

/**
 * Retorna a taxa de comissão fixa para o representado
 */
export function getFixedCommissionRate(principalName) {
  if (!principalName) return 0;
  const name = principalName.toLowerCase();
  
  for (const [rep, rate] of Object.entries(FIXED_COMMISSION_REPRESENTATIVES)) {
    if (name.includes(rep)) {
      return rate;
    }
  }
  
  return 0;
}

/**
 * Calcula a comissão baseado no tipo de representado
 */
export function calculateCommission(principal, quoteValue, items) {
  const principalName = principal?.trade_name || principal?.company_name || '';
  
  // Se é representado com comissão fixa
  if (isFixedCommissionRepresentative(principalName)) {
    const rate = getFixedCommissionRate(principalName);
    return {
      rate,
      value: (quoteValue || 0) * (rate / 100),
      isFixed: true,
      type: 'tabelado'
    };
  }
  
  // Caso contrário, usar a comissão do representado ou VTK
  return {
    rate: principal?.commission_percentage || 0,
    value: (quoteValue || 0) * ((principal?.commission_percentage || 0) / 100),
    isFixed: false,
    type: 'representado'
  };
}