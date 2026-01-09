/**
 * FONTE ÚNICA DE VERDADE - Statuses e Enums do Sistema
 * Todos os módulos devem usar estes valores (sem exceção)
 */

export const QUOTE_STATUS = {
  DRAFT: 'rascunho',
  ISSUED: 'emitido',
  SENT: 'enviado',
  CONVERTED: 'convertido',
  CANCELLED: 'cancelado'
};

export const OPPORTUNITY_STAGE = {
  PROPOSAL_SENT: 'proposta_enviada',
  IN_NEGOTIATION: 'em_negociacao',
  WON: 'ganho',
  LOST: 'perdido'
};

export const ORDER_STATUS = {
  ANALYZING: 'em_analise',
  CONFIRMED: 'confirmado',
  IN_PRODUCTION: 'em_producao',
  INVOICED: 'faturado',
  DELIVERED: 'entregue',
  CANCELLED: 'cancelado'
};

export const COMMISSION_STATUS = {
  EXPECTED: 'prevista',           // Pedido em análise
  TO_INVOICE: 'a_faturar',        // Pedido confirmado/produção
  TO_RECEIVE: 'a_receber',        // Pedido faturado (NF registrada)
  RECEIVED: 'recebida',           // Pagamento recebido
  AT_RISK: 'em_risco',            // Pagamento atrasado
  DISPUTED: 'em_disputa'          // Em disputa
};

export const FOLLOW_UP_TYPE = {
  WHATSAPP: 'whatsapp',
  CALL: 'call',
  EMAIL: 'email',
  VISIT: 'visit',
  MEETING: 'meeting'
};

/**
 * Regras de Transição Válidas
 * Evita estados inválidos
 */
export const VALID_TRANSITIONS = {
  // Quote transitions
  [QUOTE_STATUS.DRAFT]: [QUOTE_STATUS.ISSUED, QUOTE_STATUS.CANCELLED],
  [QUOTE_STATUS.ISSUED]: [QUOTE_STATUS.SENT, QUOTE_STATUS.CANCELLED],
  [QUOTE_STATUS.SENT]: [QUOTE_STATUS.CONVERTED, QUOTE_STATUS.CANCELLED],
  [QUOTE_STATUS.CONVERTED]: [],
  [QUOTE_STATUS.CANCELLED]: [],

  // Opportunity transitions
  [OPPORTUNITY_STAGE.PROPOSAL_SENT]: [OPPORTUNITY_STAGE.IN_NEGOTIATION, OPPORTUNITY_STAGE.LOST],
  [OPPORTUNITY_STAGE.IN_NEGOTIATION]: [OPPORTUNITY_STAGE.WON, OPPORTUNITY_STAGE.LOST],
  [OPPORTUNITY_STAGE.WON]: [],
  [OPPORTUNITY_STAGE.LOST]: [],

  // Order transitions
  [ORDER_STATUS.ANALYZING]: [ORDER_STATUS.CONFIRMED, ORDER_STATUS.CANCELLED],
  [ORDER_STATUS.CONFIRMED]: [ORDER_STATUS.IN_PRODUCTION, ORDER_STATUS.CANCELLED],
  [ORDER_STATUS.IN_PRODUCTION]: [ORDER_STATUS.INVOICED, ORDER_STATUS.CANCELLED],
  [ORDER_STATUS.INVOICED]: [ORDER_STATUS.DELIVERED, ORDER_STATUS.CANCELLED],
  [ORDER_STATUS.DELIVERED]: [],
  [ORDER_STATUS.CANCELLED]: [],

  // Commission transitions
  [COMMISSION_STATUS.EXPECTED]: [COMMISSION_STATUS.TO_INVOICE, COMMISSION_STATUS.AT_RISK],
  [COMMISSION_STATUS.TO_INVOICE]: [COMMISSION_STATUS.TO_RECEIVE, COMMISSION_STATUS.AT_RISK],
  [COMMISSION_STATUS.TO_RECEIVE]: [COMMISSION_STATUS.RECEIVED, COMMISSION_STATUS.AT_RISK, COMMISSION_STATUS.DISPUTED],
  [COMMISSION_STATUS.RECEIVED]: [COMMISSION_STATUS.DISPUTED],
  [COMMISSION_STATUS.AT_RISK]: [COMMISSION_STATUS.TO_RECEIVE, COMMISSION_STATUS.DISPUTED],
  [COMMISSION_STATUS.DISPUTED]: [COMMISSION_STATUS.RECEIVED]
};

/**
 * Automações Obrigatórias do Fluxo
 */
export const AUTOMATION_RULES = {
  // Quando Quote muda para SENT → Criar/Atualizar Opportunity
  QUOTE_SENT_CREATE_OPP: {
    trigger: `Quote.status = ${QUOTE_STATUS.SENT}`,
    action: 'Criar Opportunity com stage = proposta_enviada',
    mandatory: true
  },

  // Quando Opportunity muda para WON → Criar Order + Commission
  OPP_WON_CREATE_ORDER: {
    trigger: `Opportunity.stage = ${OPPORTUNITY_STAGE.WON}`,
    action: 'Criar Order + Commission',
    mandatory: true
  },

  // Quando Order muda para INVOICED → Commission muda para TO_RECEIVE
  ORDER_INVOICED_UPDATE_COMMISSION: {
    trigger: `Order.status = ${ORDER_STATUS.INVOICED}`,
    action: 'Commission.status = a_receber',
    mandatory: true
  },

  // Quando Order muda para CANCELLED → Commission muda para AT_RISK
  ORDER_CANCELLED_COMMISSION: {
    trigger: `Order.status = ${ORDER_STATUS.CANCELLED}`,
    action: 'Commission.status = em_risco',
    mandatory: true
  }
};

/**
 * Validação de Vínculo Obrigatório
 */
export const REQUIRED_LINKS = {
  // Ordem sempre tem Orçamento
  Order: ['quote_id', 'client_id', 'principal_id'],
  
  // Comissão sempre tem Pedido e Representada
  Commission: ['order_id', 'principal_id', 'invoice_value'],
  
  // Oportunidade sempre tem Cliente e Representada
  Opportunity: ['client_id', 'principal_id', 'quote_id'],
  
  // Follow-up sempre tem Oportunidade ou Cliente
  FollowUp: ['client_id']
};