/**
 * AUTOMAÇÕES OBRIGATÓRIAS DO FLUXO
 * Executa gatilhos automáticos: Quote → Opp → Order → Commission
 */

import { base44 } from '@/api/base44Client';
import { QUOTE_STATUS, OPPORTUNITY_STAGE, ORDER_STATUS, COMMISSION_STATUS } from './fluxoConstants';

/**
 * AUTO: Quote SENT → Criar Opportunity
 */
export async function automateQuoteToOpportunity(quote, client, principal) {
  try {
    if (quote.status !== QUOTE_STATUS.SENT) return null;

    // Verificar se oportunidade já existe
    const existingOpp = await base44.entities.Opportunity.filter(
      { quote_id: quote.id },
      '',
      1
    ).then(r => r[0]);

    if (existingOpp) return existingOpp;

    // Criar nova oportunidade
    const opportunity = await base44.entities.Opportunity.create({
      quote_id: quote.id,
      quote_number: quote.quote_number,
      client_id: quote.client_id,
      client_name: quote.client_name,
      principal_id: quote.principal_id,
      principal_name: quote.principal_name,
      total_value: quote.total_value,
      total_weight: quote.items?.reduce((sum, item) => sum + (item.total_weight || 0), 0) || 0,
      stage: OPPORTUNITY_STAGE.PROPOSAL_SENT,
      next_action_date: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // +2 dias
      next_action_type: 'whatsapp',
      last_contact_date: new Date().toISOString().split('T')[0],
      priority_score: 50,
      risk_level: 'low',
      timeline: [{
        date: new Date().toISOString(),
        type: 'stage_change',
        description: 'Oportunidade criada automaticamente ao enviar orçamento',
        user: 'system'
      }],
      notes: `Orçamento ${quote.quote_number} - Valor: R$ ${quote.total_value?.toLocaleString('pt-BR')}`
    });

    console.log('✅ Oportunidade criada automaticamente:', opportunity.id);
    return opportunity;
  } catch (error) {
    console.error('❌ Erro ao criar oportunidade automaticamente:', error);
    throw error;
  }
}

/**
 * AUTO: Opportunity WON → Criar Order + Commission
 */
export async function automateOpportunityToOrderAndCommission(opportunity, quote, principal) {
  try {
    if (opportunity.stage !== OPPORTUNITY_STAGE.WON) return null;

    // 1. CRIAR ORDER
    const orderNumber = `PED-${Date.now().toString().slice(-6)}`;
    
    // Calcular comissão (com fallback)
    let commissionRate = principal?.commission_percentage || 0;
    const expectedCommission = (quote?.total_value || 0) * (commissionRate / 100);

    const order = await base44.entities.Order.create({
      order_number: orderNumber,
      quote_id: quote.id,
      client_id: opportunity.client_id,
      client_name: opportunity.client_name,
      principal_id: opportunity.principal_id,
      principal_name: opportunity.principal_name,
      items: quote?.items || [],
      total_value: quote?.total_value || 0,
      total_weight: opportunity.total_weight || 0,
      total_icms: quote?.total_icms || 0,
      total_ipi: quote?.total_ipi || 0,
      payment_terms: quote?.payment_terms || principal?.payment_terms || '30 dias',
      status: ORDER_STATUS.ANALYZING,
      commission_rate: commissionRate,
      expected_commission: expectedCommission,
      commission_status: COMMISSION_STATUS.EXPECTED,
      notes: `Criado automaticamente ao ganhar oportunidade ${opportunity.quote_number}`,
      status_history: [{
        status: ORDER_STATUS.ANALYZING,
        date: new Date().toISOString(),
        notes: 'Pedido criado automaticamente'
      }]
    });

    console.log('✅ Pedido criado automaticamente:', order.id);

    // 2. CRIAR COMMISSION
    const commission = await base44.entities.Commission.create({
      order_id: order.id,
      order_number: order.order_number,
      principal_id: principal.id,
      principal_name: principal.trade_name || principal.company_name,
      client_id: opportunity.client_id,
      client_name: opportunity.client_name,
      invoice_date: null, // Será preenchido quando NF for registrada
      invoice_value: quote?.total_value || 0,
      commission_rate: commissionRate,
      commission_value: expectedCommission,
      status: COMMISSION_STATUS.EXPECTED,
      notes: `Criada automaticamente ao ganhar pedido ${orderNumber}`
    });

    console.log('✅ Comissão criada automaticamente:', commission.id);

    return { order, commission };
  } catch (error) {
    console.error('❌ Erro ao criar pedido/comissão automaticamente:', error);
    throw error;
  }
}

/**
 * AUTO: Order INVOICED → Atualizar Commission para TO_RECEIVE
 */
export async function automateOrderInvoicedToCommission(order) {
  try {
    if (order.status !== ORDER_STATUS.INVOICED) return null;

    // Encontrar comissão
    const commission = await base44.entities.Commission.filter(
      { order_id: order.id },
      '',
      1
    ).then(r => r[0]);

    if (!commission) {
      console.warn('⚠️ Pedido faturado mas comissão não encontrada');
      return null;
    }

    // Atualizar status
    const updated = await base44.entities.Commission.update(commission.id, {
      status: COMMISSION_STATUS.TO_RECEIVE,
      invoice_date: order.invoice_date,
      invoice_value: order.invoiced_value || order.total_value
    });

    console.log('✅ Comissão atualizada para A_RECEBER');
    return updated;
  } catch (error) {
    console.error('❌ Erro ao atualizar comissão:', error);
    throw error;
  }
}

/**
 * AUTO: Order CANCELLED → Atualizar Commission para AT_RISK
 */
export async function automateOrderCancelledToCommission(order) {
  try {
    if (order.status !== ORDER_STATUS.CANCELLED) return null;

    const commission = await base44.entities.Commission.filter(
      { order_id: order.id },
      '',
      1
    ).then(r => r[0]);

    if (commission) {
      await base44.entities.Commission.update(commission.id, {
        status: COMMISSION_STATUS.AT_RISK,
        notes: `Marcada como em risco ao cancelar pedido ${order.order_number}`
      });
      console.log('✅ Comissão marcada como EM_RISCO');
    }
  } catch (error) {
    console.error('❌ Erro ao atualizar comissão (cancelamento):', error);
  }
}

/**
 * VALIDADOR: Garante que transição é permitida antes de automação
 */
export function validateAutomationTrigger(entityType, oldStatus, newStatus) {
  const validTransitions = {
    Quote: {
      [QUOTE_STATUS.SENT]: [QUOTE_STATUS.CONVERTED, QUOTE_STATUS.CANCELLED]
    },
    Opportunity: {
      [OPPORTUNITY_STAGE.WON]: []
    },
    Order: {
      [ORDER_STATUS.INVOICED]: [ORDER_STATUS.DELIVERED, ORDER_STATUS.CANCELLED],
      [ORDER_STATUS.CANCELLED]: []
    }
  };

  const allowed = validTransitions[entityType]?.[oldStatus] || [];
  if (!allowed.includes(newStatus)) {
    throw new Error(`❌ Transição inválida: ${entityType} ${oldStatus} → ${newStatus}`);
  }

  return true;
}