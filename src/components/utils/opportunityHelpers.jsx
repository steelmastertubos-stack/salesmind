import { base44 } from '@/api/base44Client';

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

// AUTOMAÇÃO: Cria oportunidade automaticamente ao emitir/enviar orçamento
export async function createOpportunityFromQuote(quote, client) {
  try {
    const nextAction = getDefaultNextAction('proposta_enviada');
    const priorityScore = calculatePriorityScore({
      total_value: quote.total_value,
      total_weight: quote.total_weight
    }, {
      average_ticket: client?.average_ticket,
      purchase_count: client?.purchase_count
    });

    const opportunityData = {
      quote_id: quote.id,
      quote_number: quote.quote_number,
      client_id: quote.client_id,
      client_name: quote.client_name,
      principal_id: quote.principal_id,
      principal_name: quote.principal_name,
      total_value: quote.total_value,
      total_weight: quote.total_weight,
      stage: 'proposta_enviada',
      next_action_date: nextAction.next_action_date,
      next_action_type: nextAction.next_action_type,
      last_contact_date: new Date().toISOString().split('T')[0],
      days_without_contact: 0,
      priority_score: priorityScore,
      risk_level: 'low',
      timeline: createInitialTimeline(quote.quote_number, 'system')
    };

    const opportunity = await base44.entities.Opportunity.create(opportunityData);
    return opportunity;
  } catch (error) {
    console.error('Error creating opportunity:', error);
    throw error;
  }
}

// AUTOMAÇÃO: Cria pedido automaticamente ao marcar oportunidade como GANHO
export async function createOrderFromOpportunity(opportunity, quote) {
  try {
    const orderData = {
      order_number: `PED-${Date.now()}`,
      quote_id: quote.id,
      client_id: opportunity.client_id,
      client_name: opportunity.client_name,
      principal_id: opportunity.principal_id,
      principal_name: opportunity.principal_name,
      items: quote.items,
      total_value: quote.total_value,
      total_weight: quote.total_weight,
      total_icms: quote.total_icms,
      total_ipi: quote.total_ipi,
      payment_terms: quote.payment_terms,
      notes: quote.notes,
      status: 'em_analise'
    };

    const order = await base44.entities.Order.create(orderData);
    
    // Atualizar orçamento para convertido
    await base44.entities.Quote.update(quote.id, {
      status: 'convertido',
      approved_date: new Date().toISOString().split('T')[0]
    });

    return order;
  } catch (error) {
    console.error('Error creating order:', error);
    throw error;
  }
}

// Verifica alertas de vencimento de orçamento
export function checkQuoteExpiration(quote) {
  if (!quote.validity_date) return null;
  
  const validityDate = new Date(quote.validity_date);
  const today = new Date();
  const daysUntilExpiry = Math.floor((validityDate - today) / (1000 * 60 * 60 * 24));

  if (daysUntilExpiry < 0) {
    return { type: 'expired', message: 'Orçamento vencido', severity: 'high' };
  } else if (daysUntilExpiry === 0) {
    return { type: 'expiring_today', message: 'Orçamento vence hoje', severity: 'high' };
  } else if (daysUntilExpiry <= 2) {
    return { type: 'expiring_soon', message: `Vence em ${daysUntilExpiry} dias`, severity: 'medium' };
  }

  return null;
}