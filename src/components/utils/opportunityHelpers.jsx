// Calcula score de prioridade da oportunidade
export function calculatePriorityScore(opportunityData, clientHistory = {}) {
  let score = 50; // Base score

  // 1. Valor do orçamento (0-30 pontos)
  const value = opportunityData.total_value || 0;
  if (value > 100000) score += 30;
  else if (value > 50000) score += 20;
  else if (value > 20000) score += 10;

  // 2. Peso (0-15 pontos)
  const weight = opportunityData.total_weight || 0;
  if (weight > 10000) score += 15;
  else if (weight > 5000) score += 10;
  else if (weight > 1000) score += 5;

  // 3. Histórico do cliente (0-25 pontos)
  if (clientHistory.average_ticket) {
    if (value >= clientHistory.average_ticket * 1.5) score += 15;
    else if (value >= clientHistory.average_ticket) score += 10;
    else if (value >= clientHistory.average_ticket * 0.7) score += 5;
  }

  if (clientHistory.purchase_count > 10) score += 10;
  else if (clientHistory.purchase_count > 5) score += 5;

  // Limitar entre 0 e 100
  return Math.min(Math.max(score, 0), 100);
}

// Define próxima ação baseada no estágio
export function getDefaultNextAction(stage) {
  const today = new Date();
  let daysToAdd = 3;

  if (stage === 'em_negociacao') {
    daysToAdd = 2;
  }

  const nextDate = new Date(today);
  nextDate.setDate(nextDate.getDate() + daysToAdd);

  return {
    next_action_date: nextDate.toISOString().split('T')[0],
    next_action_type: 'whatsapp'
  };
}

// Cria timeline inicial
export function createInitialTimeline(quoteNumber, userName) {
  return [{
    date: new Date().toISOString(),
    type: 'created',
    description: `Oportunidade criada a partir do orçamento ${quoteNumber}`,
    user: userName || 'system'
  }];
}

// Calcula nível de risco
export function calculateRiskLevel(daysWithoutContact, stage) {
  if (stage === 'ganho' || stage === 'perdido') return 'low';
  
  if (daysWithoutContact >= 7) return 'high';
  if (daysWithoutContact >= 4) return 'medium';
  return 'low';
}