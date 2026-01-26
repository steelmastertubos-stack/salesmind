/**
 * AUTO-FIX DE PROBLEMAS DE AUDITORIA
 * Corrige automaticamente inconsistências detectadas pela IntegrationValidator
 */

import { base44 } from '@/api/base44Client';
import { calculateCommission } from './commissionCalculator';

export class AuditFixer {
  constructor() {
    this.fixLog = [];
  }

  /**
   * Executa correção de todos os problemas críticos
   */
  async fixAllIssues(issues, quotes, opportunities, orders, commissions, principals) {
    this.fixLog = [];
    const criticalIssues = issues.filter(i => i.severity === 'CRITICAL');

    for (const issue of criticalIssues) {
      try {
        await this.fixIssue(issue, quotes, opportunities, orders, commissions, principals);
      } catch (error) {
        this.fixLog.push({
          issue_id: issue.id,
          status: 'error',
          error: error.message
        });
      }
    }

    return {
      fixed: this.fixLog.filter(l => l.status === 'fixed').length,
      failed: this.fixLog.filter(l => l.status === 'error').length,
      log: this.fixLog
    };
  }

  /**
   * Corrige um problema específico
   */
  async fixIssue(issue, quotes, opportunities, orders, commissions, principals) {
    const issueType = this.getIssueType(issue.id);

    switch (issueType) {
      case 'QUOTE_NO_OPP':
        return await this.fixQuoteNoOpportunity(issue, quotes);
      
      case 'OPP_NO_ORDER':
        return await this.fixOpportunityNoOrder(issue, quotes, opportunities, principals);
      
      case 'ORDER_NO_COMMISSION':
        return await this.fixOrderNoCommission(issue, orders, principals);
      
      case 'COMMISSION_ZERO_VALUE':
        return await this.fixCommissionZeroValue(issue, orders, commissions);
      
      default:
        this.fixLog.push({
          issue_id: issue.id,
          status: 'skipped',
          message: 'Tipo de issue não suportado para auto-fix'
        });
    }
  }

  /**
   * Fix: Quote sem Opportunity
   */
  async fixQuoteNoOpportunity(issue, quotes) {
    const quoteId = this.extractId(issue.id);
    const quote = quotes.find(q => q.id === quoteId);

    if (!quote) {
      throw new Error('Quote não encontrado');
    }

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
      next_action_date: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      next_action_type: 'whatsapp',
      priority_score: 50
    };

    const newOpp = await base44.entities.Opportunity.create(opportunityData);

    this.fixLog.push({
      issue_id: issue.id,
      status: 'fixed',
      action: 'Opportunity criada',
      created_id: newOpp.id
    });

    return newOpp;
  }

  /**
   * Fix: Opportunity ganha sem Order
   */
  async fixOpportunityNoOrder(issue, quotes, opportunities, principals) {
    const oppId = this.extractId(issue.id);
    const opp = opportunities.find(o => o.id === oppId);

    if (!opp) {
      throw new Error('Opportunity não encontrada');
    }

    // Se não tem quote, criar primeiro
    let quote = quotes.find(q => q.opportunity_id === opp.id);
    if (!quote) {
      quote = await this.createQuoteForOpportunity(opp);
    }

    const principal = principals.find(p => p.id === opp.principal_id);

    // Calcular comissão
    const commissionRate = quote.commission_rate || principal?.commission_percentage || 3;
    const expectedCommission = (opp.value_estimated || 0) * (commissionRate / 100);

    // Data de fechamento (usar won_at ou created_date)
    const wonDate = opp.won_at ? new Date(opp.won_at) : new Date(opp.created_date);
    const billingDate = new Date(wonDate);
    billingDate.setDate(billingDate.getDate() + 7);

    const orderData = {
      opportunity_id: opp.id,
      quote_id: quote.id,
      client_id: opp.client_id,
      client_name: opp.client_name,
      principal_id: opp.principal_id,
      principal_name: opp.principal_name,
      items: quote.items || [],
      total_value: opp.value_estimated || quote.total_value,
      total_weight: opp.total_weight || quote.total_weight,
      total_cost: (opp.value_estimated || 0) * 0.7,
      status: 'faturado',
      billing_date: billingDate.toISOString().split('T')[0],
      invoice_date: billingDate.toISOString().split('T')[0],
      closed_at: billingDate.toISOString(),
      commission_rate: commissionRate,
      expected_commission: expectedCommission,
      notes: `[AUTO-FIX] Pedido criado automaticamente`
    };

    const newOrder = await base44.entities.Order.create(orderData);

    // Criar comissão
    const newCommission = await this.createCommissionForOrder(newOrder, opp, principal);

    // Criar parcela
    await this.createInstallmentForCommission(newCommission, billingDate);

    this.fixLog.push({
      issue_id: issue.id,
      status: 'fixed',
      action: 'Fluxo completo criado: Order → Commission → Installment',
      created_id: newOrder.id
    });

    return newOrder;
  }

  /**
   * Fix: Order sem Commission
   */
  async fixOrderNoCommission(issue, orders, principals) {
    const orderId = this.extractId(issue.id);
    const order = orders.find(o => o.id === orderId);

    if (!order) {
      throw new Error('Order não encontrado');
    }

    const principal = principals.find(p => p.id === order.principal_id);
    const newCommission = await this.createCommissionForOrder(order, principal);

    this.fixLog.push({
      issue_id: issue.id,
      status: 'fixed',
      action: 'Commission criada',
      created_id: newCommission.id
    });

    return newCommission;
  }

  /**
   * Fix: Commission com valor zero
   */
  async fixCommissionZeroValue(issue, orders, commissions) {
    const commId = this.extractId(issue.id);
    const comm = commissions.find(c => c.id === commId);

    if (!comm) {
      throw new Error('Commission não encontrada');
    }

    const order = orders.find(o => o.id === comm.order_id);
    if (!order) {
      throw new Error('Order vinculado não encontrado');
    }

    const rate = order.commission_rate || 5;
    const calculatedValue = (order.total_value || 0) * (rate / 100);

    await base44.entities.Commission.update(comm.id, {
      commission_rate: rate,
      commission_value: calculatedValue
    });

    this.fixLog.push({
      issue_id: issue.id,
      status: 'fixed',
      action: 'Commission recalculada',
      updated_id: comm.id,
      new_value: calculatedValue
    });

    return comm;
  }

  /**
   * Helper: Criar Quote para Opportunity
   */
  async createQuoteForOpportunity(opp) {
    const quoteData = {
      opportunity_id: opp.id,
      client_id: opp.client_id,
      client_name: opp.client_name,
      principal_id: opp.principal_id,
      principal_name: opp.principal_name,
      total_value: opp.value_estimated || 10000,
      items: [],
      status: 'convertido'
    };

    return await base44.entities.Quote.create(quoteData);
  }

  /**
   * Helper: Criar Commission para Order
   */
  async createCommissionForOrder(order, opp, principal) {
    const rate = order.commission_rate || principal?.commission_percentage || 3;
    const commissionValue = (order.total_value || 0) * (rate / 100);

    const commissionData = {
      order_id: order.id,
      opportunity_id: order.opportunity_id || opp?.id,
      quote_id: order.quote_id,
      principal_id: order.principal_id,
      principal_name: order.principal_name,
      client_id: order.client_id,
      client_name: order.client_name,
      sales_value: order.total_value,
      commission_rate: rate,
      commission_total_value: commissionValue,
      commission_value: commissionValue,
      status: 'prevista',
      invoice_date: order.billing_date || order.invoice_date || new Date().toISOString().split('T')[0]
    };

    return await base44.entities.Commission.create(commissionData);
  }

  /**
   * Helper: Criar Installment para Commission
   */
  async createInstallmentForCommission(commission, billingDate) {
    const dueDate = new Date(billingDate);
    dueDate.setDate(dueDate.getDate() + 30);

    const installmentData = {
      commission_id: commission.id,
      representada_id: commission.principal_id,
      order_id: commission.order_id,
      installment_no: 1,
      installment_pct: 100,
      installment_value: commission.commission_total_value,
      due_date: dueDate.toISOString().split('T')[0],
      status: 'prevista',
      reference_month: new Date(commission.invoice_date).toISOString().slice(0, 7)
    };

    return await base44.entities.CommissionInstallment.create(installmentData);
  }

  /**
   * Helper: Extrair ID do issue_id
   */
  extractId(issueId) {
    const parts = issueId.split('_');
    return parts[parts.length - 1];
  }

  /**
   * Helper: Determinar tipo de issue
   */
  getIssueType(issueId) {
    if (issueId.includes('QUOTE_NO_OPP')) return 'QUOTE_NO_OPP';
    if (issueId.includes('OPP_NO_ORDER')) return 'OPP_NO_ORDER';
    if (issueId.includes('ORDER_NO_COMMISSION')) return 'ORDER_NO_COMMISSION';
    if (issueId.includes('COMMISSION_ZERO_VALUE')) return 'COMMISSION_ZERO_VALUE';
    return 'UNKNOWN';
  }
}