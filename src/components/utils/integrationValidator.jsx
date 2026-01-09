/**
 * VALIDADOR DE INTEGRAÇÃO - Identifica quebras no fluxo
 * Auditoria automática da cadeia Quote → Opp → Order → Commission
 */

import { QUOTE_STATUS, OPPORTUNITY_STAGE, ORDER_STATUS, COMMISSION_STATUS, REQUIRED_LINKS } from './fluxoConstants';

export class IntegrationValidator {
  constructor(quotes = [], opportunities = [], orders = [], commissions = [], clients = []) {
    this.quotes = quotes;
    this.opportunities = opportunities;
    this.orders = orders;
    this.commissions = commissions;
    this.clients = clients;
    this.issues = [];
  }

  /**
   * Executa auditoria completa e retorna lista de problemas
   */
  runFullAudit() {
    this.issues = [];
    
    this.auditQuoteToOpportunity();
    this.auditOpportunityToOrder();
    this.auditOrderToCommission();
    this.auditOrphanRecords();
    this.auditStatusConsistency();
    this.auditCalculationPersistence();

    return {
      totalIssues: this.issues.length,
      critical: this.issues.filter(i => i.severity === 'CRITICAL').length,
      warning: this.issues.filter(i => i.severity === 'WARNING').length,
      issues: this.issues
    };
  }

  /**
   * Valida: Cada Quote ENVIADA deve ter Opportunity
   */
  auditQuoteToOpportunity() {
    this.quotes.forEach(quote => {
      if (quote.status === QUOTE_STATUS.SENT || quote.status === QUOTE_STATUS.CONVERTED) {
        const opp = this.opportunities.find(o => o.quote_id === quote.id);
        
        if (!opp) {
          this.issues.push({
            id: `AUDIT_QUOTE_NO_OPP_${quote.id}`,
            severity: 'CRITICAL',
            module: 'Quote → Opportunity',
            entity: `Quote ${quote.quote_number}`,
            problem: `Orçamento enviado (${quote.status}) mas SEM oportunidade no CRM`,
            expected: 'Deve existir Opportunity com stage=proposta_enviada',
            actual: 'Opportunity não existe',
            fixAction: 'Criar Opportunity automaticamente'
          });
        } else if (!opp.stage) {
          this.issues.push({
            id: `AUDIT_OPP_NO_STAGE_${opp.id}`,
            severity: 'WARNING',
            module: 'Opportunity',
            entity: `Opportunity ${opp.client_name}`,
            problem: 'Oportunidade sem stage definido',
            expected: 'stage deve estar em [proposta_enviada, em_negociacao, ganho, perdido]',
            actual: `stage = "${opp.stage || 'undefined'}"`,
            fixAction: 'Definir stage correto'
          });
        }
      }
    });
  }

  /**
   * Valida: Cada Opportunity GANHA deve ter Order
   */
  auditOpportunityToOrder() {
    this.opportunities.forEach(opp => {
      if (opp.stage === OPPORTUNITY_STAGE.WON) {
        const order = this.orders.find(o => o.quote_id === opp.quote_id && o.principal_id === opp.principal_id);
        
        if (!order) {
          this.issues.push({
            id: `AUDIT_OPP_NO_ORDER_${opp.id}`,
            severity: 'CRITICAL',
            module: 'Opportunity → Order',
            entity: `Opportunity ${opp.client_name}`,
            problem: `Oportunidade ganha mas SEM pedido criado`,
            expected: `Deve existir Order vinculado à oportunidade`,
            actual: `Order não encontrado`,
            value: opp.total_value,
            fixAction: 'Criar Order automaticamente ao marcar como GANHO'
          });
        }
      }
    });
  }

  /**
   * Valida: Cada Order deve ter Commission
   */
  auditOrderToCommission() {
    this.orders.forEach(order => {
      const comm = this.commissions.find(c => c.order_id === order.id);
      
      if (!comm) {
        this.issues.push({
          id: `AUDIT_ORDER_NO_COMMISSION_${order.id}`,
          severity: 'CRITICAL',
          module: 'Order → Commission',
          entity: `Order ${order.order_number}`,
          problem: `Pedido criado mas SEM comissão associada`,
          expected: `Commission deve ser criada com value = order.total_value * rate`,
          actual: `Commission não existe`,
          value: order.total_value,
          rate: order.commission_rate || 0,
          fixAction: 'Criar Commission automaticamente ao criar Order'
        });
      } else if (!comm.commission_value || comm.commission_value === 0) {
        this.issues.push({
          id: `AUDIT_COMMISSION_ZERO_VALUE_${comm.id}`,
          severity: 'CRITICAL',
          module: 'Commission',
          entity: `Commission ${comm.principal_name}`,
          problem: `Comissão com valor R$ 0.00 (commission_rate pode ser 0 ou inválido)`,
          expected: `commission_value = invoice_value * (commission_rate / 100)`,
          actual: `commission_value = R$ ${(comm.commission_value || 0).toFixed(2)}, rate = ${comm.commission_rate || 0}%`,
          fixAction: 'Calcular e persister commission_rate na Quote durante criação'
        });
      }
    });
  }

  /**
   * Valida: Nenhum registro órfão (sem vínculo)
   */
  auditOrphanRecords() {
    // Orders sem Cliente
    this.orders.forEach(order => {
      if (!order.client_id) {
        this.issues.push({
          id: `AUDIT_ORDER_NO_CLIENT_${order.id}`,
          severity: 'CRITICAL',
          module: 'Order',
          entity: `Order ${order.order_number}`,
          problem: 'Pedido sem cliente associado',
          fixAction: 'Garantir que client_id sempre existe'
        });
      }
      if (!order.principal_id) {
        this.issues.push({
          id: `AUDIT_ORDER_NO_PRINCIPAL_${order.id}`,
          severity: 'CRITICAL',
          module: 'Order',
          entity: `Order ${order.order_number}`,
          problem: 'Pedido sem representada associada',
          fixAction: 'Garantir que principal_id sempre existe'
        });
      }
    });

    // Commissions sem Order
    this.commissions.forEach(comm => {
      if (!comm.order_id) {
        this.issues.push({
          id: `AUDIT_COMMISSION_NO_ORDER_${comm.id}`,
          severity: 'CRITICAL',
          module: 'Commission',
          entity: `Commission ${comm.principal_name}`,
          problem: 'Comissão sem pedido associado (órfã)',
          fixAction: 'Comissão deve ser sempre criada via Order'
        });
      }
    });

    // Opportunities sem Quote
    this.opportunities.forEach(opp => {
      if (!opp.quote_id) {
        this.issues.push({
          id: `AUDIT_OPP_NO_QUOTE_${opp.id}`,
          severity: 'WARNING',
          module: 'Opportunity',
          entity: `Opportunity ${opp.client_name}`,
          problem: 'Oportunidade sem orçamento vinculado',
          fixAction: 'Oportunidade deve sempre ter quote_id'
        });
      }
    });
  }

  /**
   * Valida: Transições de status são válidas
   */
  auditStatusConsistency() {
    // Exemplo: Se pedido é "faturado", comissão deve ser "a_receber"
    this.orders.forEach(order => {
      if (order.status === ORDER_STATUS.INVOICED) {
        const comm = this.commissions.find(c => c.order_id === order.id);
        if (comm && comm.status !== COMMISSION_STATUS.TO_RECEIVE && comm.status !== COMMISSION_STATUS.RECEIVED) {
          this.issues.push({
            id: `AUDIT_COMM_STATUS_INCONSISTENT_${comm.id}`,
            severity: 'WARNING',
            module: 'Commission Status Sync',
            entity: `Commission ${comm.principal_name}`,
            problem: `Pedido faturado mas comissão em status="${comm.status}" (deveria ser "a_receber")`,
            expected: `status = ${COMMISSION_STATUS.TO_RECEIVE}`,
            actual: `status = ${comm.status}`,
            fixAction: 'Atualizar status da comissão quando pedido é faturado'
          });
        }
      }
    });
  }

  /**
   * Valida: Cálculos estão persistidos (não recalculados)
   */
  auditCalculationPersistence() {
    // Quote: commission_rate deveria ser salvo
    this.quotes.forEach(quote => {
      if (!quote.commission_rate && quote.status !== QUOTE_STATUS.DRAFT) {
        this.issues.push({
          id: `AUDIT_QUOTE_NO_COMMISSION_RATE_${quote.id}`,
          severity: 'WARNING',
          module: 'Quote Calculations',
          entity: `Quote ${quote.quote_number}`,
          problem: 'Taxa de comissão não foi calculada/salva na Quote',
          expected: 'commission_rate deve ser calculado e persistido',
          actual: `commission_rate = ${quote.commission_rate || 'undefined'}`,
          fixAction: 'Calcular e salvar commission_rate ao criar/enviar quote'
        });
      }
    });

    // Order: expected_commission deveria ser > 0
    this.orders.forEach(order => {
      if (order.expected_commission === 0 || !order.expected_commission) {
        this.issues.push({
          id: `AUDIT_ORDER_COMMISSION_ZERO_${order.id}`,
          severity: 'CRITICAL',
          module: 'Order Calculations',
          entity: `Order ${order.order_number}`,
          problem: 'Comissão esperada é R$ 0 (deve herdar de Quote ou representada)',
          value: order.total_value,
          rate: order.commission_rate || 0,
          fixAction: 'Garantir que commission_rate > 0 na Quote antes de converter'
        });
      }
    });
  }

  /**
   * Retorna resumo por módulo
   */
  getSummaryByModule() {
    const summary = {};
    this.issues.forEach(issue => {
      if (!summary[issue.module]) {
        summary[issue.module] = { CRITICAL: 0, WARNING: 0 };
      }
      summary[issue.module][issue.severity]++;
    });
    return summary;
  }

  /**
   * Retorna apenas issues críticas (as que quebram fluxo)
   */
  getCriticalIssues() {
    return this.issues.filter(i => i.severity === 'CRITICAL');
  }
}

/**
 * Helper: Validar um status válido
 */
export function isValidStatus(entity, status) {
  const validStatuses = {
    Quote: Object.values(QUOTE_STATUS),
    Opportunity: Object.values(OPPORTUNITY_STAGE),
    Order: Object.values(ORDER_STATUS),
    Commission: Object.values(COMMISSION_STATUS)
  };
  return validStatuses[entity]?.includes(status) || false;
}

/**
 * Helper: Validar transição de status
 */
export function canTransitionTo(entity, currentStatus, newStatus) {
  const transitions = {
    Quote: {
      [QUOTE_STATUS.DRAFT]: [QUOTE_STATUS.ISSUED, QUOTE_STATUS.CANCELLED],
      [QUOTE_STATUS.ISSUED]: [QUOTE_STATUS.SENT, QUOTE_STATUS.CANCELLED],
      [QUOTE_STATUS.SENT]: [QUOTE_STATUS.CONVERTED, QUOTE_STATUS.CANCELLED],
      [QUOTE_STATUS.CONVERTED]: [],
      [QUOTE_STATUS.CANCELLED]: []
    },
    Opportunity: {
      [OPPORTUNITY_STAGE.PROPOSAL_SENT]: [OPPORTUNITY_STAGE.IN_NEGOTIATION, OPPORTUNITY_STAGE.LOST],
      [OPPORTUNITY_STAGE.IN_NEGOTIATION]: [OPPORTUNITY_STAGE.WON, OPPORTUNITY_STAGE.LOST],
      [OPPORTUNITY_STAGE.WON]: [],
      [OPPORTUNITY_STAGE.LOST]: []
    },
    Order: {
      [ORDER_STATUS.ANALYZING]: [ORDER_STATUS.CONFIRMED, ORDER_STATUS.CANCELLED],
      [ORDER_STATUS.CONFIRMED]: [ORDER_STATUS.IN_PRODUCTION, ORDER_STATUS.CANCELLED],
      [ORDER_STATUS.IN_PRODUCTION]: [ORDER_STATUS.INVOICED, ORDER_STATUS.CANCELLED],
      [ORDER_STATUS.INVOICED]: [ORDER_STATUS.DELIVERED, ORDER_STATUS.CANCELLED],
      [ORDER_STATUS.DELIVERED]: [],
      [ORDER_STATUS.CANCELLED]: []
    }
  };

  const allowed = transitions[entity]?.[currentStatus] || [];
  return allowed.includes(newStatus);
}