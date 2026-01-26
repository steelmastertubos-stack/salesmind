/**
 * AUTOMAÇÕES OBRIGATÓRIAS DO FLUXO
 * Executa gatilhos automáticos: Quote → Opp → Order → Commission
 */

import { base44 } from '@/api/base44Client';
import { QUOTE_STATUS, OPPORTUNITY_STAGE, ORDER_STATUS, COMMISSION_STATUS } from './fluxoConstants';

// Garantir que Opportunity GANHO sempre cria Order
export const ensureOrderForWonOpportunity = async (opportunity) => {
  try {
    // Verificar se já existe order
    const existingOrders = await base44.entities.Order.filter({ opportunity_id: opportunity.id }, '-created_date', 1);
    if (existingOrders.length > 0) {
      await ensureCommissionForOrder(existingOrders[0]);
      return existingOrders[0];
    }

    // Buscar quote vinculado
    const relatedQuotes = await base44.entities.Quote.filter({ opportunity_id: opportunity.id }, '-created_date', 1);
    const quote = relatedQuotes[0];

    // Criar order
    const orderData = {
      opportunity_id: opportunity.id,
      quote_id: quote?.id || null,
      client_id: opportunity.client_id,
      client_name: opportunity.client_name,
      principal_id: opportunity.principal_id,
      principal_name: opportunity.principal_name,
      items: quote?.items || [],
      total_value: opportunity.value_estimated || quote?.total_value || 0,
      total_weight: quote?.total_weight || 0,
      total_icms: quote?.total_icms || 0,
      total_ipi: quote?.total_ipi || 0,
      status: 'confirmado',
      created_date: opportunity.updated_date || new Date().toISOString(),
      billing_date: new Date().toISOString().split('T')[0]
    };

    const newOrder = await base44.entities.Order.create(orderData);
    
    // Criar comissão automaticamente
    await ensureCommissionForOrder(newOrder);
    
    return newOrder;
  } catch (error) {
    console.error('Erro ao criar order:', error);
    throw error;
  }
};

// Garantir que todo Order tenha Commission
export const ensureCommissionForOrder = async (order) => {
  try {
    // Verificar se já existe commission
    const existingCommissions = await base44.entities.Commission.filter({ order_id: order.id }, '-created_date', 1);
    if (existingCommissions.length > 0) {
      return existingCommissions[0];
    }

    // Buscar principal para taxa de comissão
    const principals = await base44.entities.Principal.list('id', 100);
    const principal = principals.find(p => p.id === order.principal_id);
    
    const commissionRate = principal?.commission_percentage || 3;
    const salesValue = order.total_value || 0;
    const commissionValue = (salesValue * commissionRate) / 100;

    const commissionData = {
      order_id: order.id,
      opportunity_id: order.opportunity_id,
      quote_id: order.quote_id,
      principal_id: order.principal_id,
      principal_name: order.principal_name,
      client_id: order.client_id,
      client_name: order.client_name,
      sales_value: salesValue,
      commission_rate: commissionRate,
      commission_total_value: commissionValue,
      commission_value: commissionValue,
      status: 'prevista',
      invoice_date: order.billing_date || order.created_date
    };

    const newCommission = await base44.entities.Commission.create(commissionData);
    
    // Criar parcela
    const dueDate = new Date(order.billing_date || order.created_date);
    dueDate.setDate(dueDate.getDate() + (principal?.payment_day || 30));

    await base44.entities.CommissionInstallment.create({
      commission_id: newCommission.id,
      representada_id: order.principal_id,
      order_id: order.id,
      installment_no: 1,
      installment_pct: 100,
      installment_value: commissionValue,
      due_date: dueDate.toISOString().split('T')[0],
      status: 'prevista',
      reference_month: new Date(order.billing_date || order.created_date).toISOString().slice(0, 7)
    });
    
    return newCommission;
  } catch (error) {
    console.error('Erro ao criar commission:', error);
    throw error;
  }
};

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
      value_estimated: quote.total_value,
      total_weight: quote.items?.reduce((sum, item) => sum + (item.total_weight || 0), 0) || 0,
      stage: OPPORTUNITY_STAGE.PROPOSAL_SENT,
      next_action_date: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
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

    // Usar função garantidora
    const order = await ensureOrderForWonOpportunity(opportunity);
    
    console.log('✅ Pedido e comissão criados automaticamente:', order.id);
    return { order };
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

    const commission = await base44.entities.Commission.filter(
      { order_id: order.id },
      '',
      1
    ).then(r => r[0]);

    if (!commission) {
      console.warn('⚠️ Pedido faturado mas comissão não encontrada, criando...');
      return await ensureCommissionForOrder(order);
    }

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