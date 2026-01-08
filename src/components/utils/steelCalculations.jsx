// Utilitários para cálculos do setor de aço

/**
 * Calcula o IPI automático baseado na categoria
 */
export function getIPIRate(category) {
  switch (category) {
    case 'tubos_quadrados_retangulares':
      return 5.0; // 5%
    case 'chapas':
    case 'tubos_redondos':
      return 3.25; // 3,25%
    case 'perfis':
    case 'vigas':
    case 'cantoneiras':
      return 0; // ISENTO
    default:
      return 0;
  }
}

/**
 * Calcula o ICMS baseado no estado do cliente
 */
export function getICMSRate(clientState, isImported = false) {
  if (isImported) return 4.0; // Produtos importados sempre 4%
  
  // Estados com ICMS 7%
  const states7 = ['AL', 'BA', 'CE', 'ES', 'MA', 'PB', 'PE', 'PI', 'RN', 'SE'];
  
  // Estados com ICMS 12%
  const states12 = ['AC', 'AM', 'AP', 'PA', 'RO', 'RR', 'TO', 'DF', 'GO', 'MT', 'MS'];
  
  // Estados com ICMS 18% (Sul/Sudeste)
  const states18 = ['MG', 'RJ', 'SP', 'PR', 'SC', 'RS'];
  
  if (states7.includes(clientState)) return 7.0;
  if (states12.includes(clientState)) return 12.0;
  if (states18.includes(clientState)) return 18.0;
  
  return 18.0; // Default
}

/**
 * Remove ICMS do preço base e aplica novo ICMS
 */
export function recalculatePrice(basePriceWith18, newICMSRate) {
  // Preço base está com ICMS 18%
  // 1. Remover ICMS 18%
  const priceWithoutICMS = basePriceWith18 / 1.18;
  
  // 2. Aplicar novo ICMS
  const newICMSMultiplier = 1 + (newICMSRate / 100);
  const newPrice = priceWithoutICMS * newICMSMultiplier;
  
  return {
    priceWithoutICMS,
    priceWithICMS: newPrice,
    icmsValue: newPrice - priceWithoutICMS
  };
}

/**
 * Calcula totais de um item
 */
export function calculateItemTotals(item) {
  const {
    unit,
    quantity,
    weight_per_meter,
    total_weight: manualWeight,
    base_price_per_kg,
    icms_rate,
    ipi_rate
  } = item;

  // 1. Calcular peso total
  let totalWeight = 0;
  if (unit === 'kg') {
    totalWeight = quantity;
  } else if (unit === 'mt') {
    totalWeight = quantity * weight_per_meter;
  } else if (unit === 'pc') {
    totalWeight = manualWeight || 0; // Peso manual obrigatório
  }

  if (!totalWeight || totalWeight <= 0) {
    throw new Error('Peso total inválido');
  }

  // 2. Recalcular preço por kg com ICMS correto
  const priceCalc = recalculatePrice(base_price_per_kg, icms_rate);
  const pricePerKg = priceCalc.priceWithICMS;

  // 3. Calcular subtotal (produtos)
  const itemSubtotal = totalWeight * pricePerKg;

  // 4. Calcular ICMS
  const icmsValue = totalWeight * priceCalc.icmsValue;

  // 5. Calcular IPI sobre o subtotal
  const ipiValue = itemSubtotal * (ipi_rate / 100);

  // 6. Total do item
  const itemTotal = itemSubtotal + ipiValue;

  return {
    total_weight: totalWeight,
    price_per_kg: pricePerKg,
    item_subtotal: itemSubtotal,
    icms_value: icmsValue,
    ipi_value: ipiValue,
    item_total: itemTotal
  };
}

/**
 * Calcula totais do orçamento
 */
export function calculateQuoteTotals(items, freightValue = 0) {
  let productsSubtotal = 0;
  let totalICMS = 0;
  let totalIPI = 0;

  items.forEach(item => {
    productsSubtotal += item.item_subtotal || 0;
    totalICMS += item.icms_value || 0;
    totalIPI += item.ipi_value || 0;
  });

  const totalValue = productsSubtotal + totalIPI + freightValue;

  return {
    products_subtotal: productsSubtotal,
    total_icms: totalICMS,
    total_ipi: totalIPI,
    total_value: totalValue
  };
}

/**
 * Valida orçamento antes de salvar
 */
export function validateQuote(quote) {
  const errors = [];

  if (!quote.principal_id) errors.push('Representado não selecionado');
  if (!quote.client_id) errors.push('Cliente não selecionado');
  if (!quote.client_state) errors.push('Estado do cliente não definido');
  if (!quote.items || quote.items.length === 0) errors.push('Nenhum item adicionado');

  quote.items?.forEach((item, index) => {
    if (!item.total_weight || item.total_weight <= 0) {
      errors.push(`Item ${index + 1}: Peso total não definido`);
    }
    if (!item.icms_rate && item.icms_rate !== 0) {
      errors.push(`Item ${index + 1}: ICMS não definido`);
    }
    if (!item.ipi_rate && item.ipi_rate !== 0) {
      errors.push(`Item ${index + 1}: IPI não definido`);
    }
  });

  return {
    isValid: errors.length === 0,
    errors
  };
}