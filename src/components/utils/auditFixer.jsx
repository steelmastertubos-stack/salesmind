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

    const quote = quotes.find(q => q.id === opp.quote_id);
    if (!quote) {
      throw new Error('Quote vinculado não encontrado');
    }

    const principal = principals.find(p => p.id === opp.principal_id);

    // Calcular comissão
    const commissionRate = quote.commission_rate || principal?.commission_percentage || 5;
    const expectedCommission = (opp.total_value || 0) * (commissionRate / 100);

    const orderData = {
      order_number: `PED-${Date.now()}`,
      quote_id: opp.quote_id,
      client_id: opp.client_id,
      client_name: opp.client_name,
      principal_id: opp.principal_id,
      principal_name: opp.principal_name,
      items: quote.items || [],
      total_value: opp.total_value,
      total_weight: opp.total_weight,
      payment_terms: quote.payment_terms,
      commission_rate: commissionRate,
      expected_commission: expectedCommission,
      status: 'em_analise',
      notes: `[AUTO-FIX] Pedido criado automaticamente pela auditoria`
    };

    const newOrder = await base44.entities.Order.create(orderData);

    // Criar comissão também
    await this.createCommissionForOrder(newOrder, principal);

    this.fixLog.push({
      issue_id: issue.id,
      status: 'fixed',
      action: 'Order + Commission criados',
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
   * Helper: Criar Commission para Order
   */
  async createCommissionForOrder(order, principal) {
    const rate = order.commission_rate || principal?.commission_percentage || 5;
    const commissionValue = (order.total_value || 0) * (rate / 100);

    const commissionData = {
      order_id: order.id,
      order_number: order.order_number,
      principal_id: order.principal_id,
      principal_name: order.principal_name,
      client_id: order.client_id,
      client_name: order.client_name,
      invoice_date: order.invoice_date || new Date().toISOString().split('T')[0],
      invoice_value: order.total_value,
      commission_rate: rate,
      commission_value: commissionValue,
      status: 'prevista'
    };

    return await base44.entities.Commission.create(commissionData);
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