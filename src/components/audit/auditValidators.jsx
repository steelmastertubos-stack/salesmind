/**
 * Funções de validação para auditoria
 * Cada função valida uma seção específica e retorna {passed, issues, fixes}
 */

import { base44 } from '@/api/base44Client';
import { AUDIT_RULES, CLIENT_STATUS_RULES, STAGE_FOLLOWUP_RULES } from './auditConfig';
import auditLogger from './auditLogger';

// ============ OPPORTUNITIES ============
export async function auditOpportunities() {
  const result = { passed: true, issues: [], fixes: [], totalChecked: 0 };

  try {
    const opportunities = await base44.entities.Opportunity.list('-created_date', 2000);
    const orders = await base44.entities.Order.list('-created_date', 2000);
    const tasks = await base44.entities.Task.list('-created_date', 2000);

    result.totalChecked = opportunities.length;

    for (const opp of opportunities) {
      // OPP-001: Ganho sem Order
      if (opp.stage === 'ganho' && !opp.quote_id) {
        const existingOrder = orders.find(o => o.opportunity_id === opp.id);
        if (!existingOrder) {
          result.issues.push({
            rule: 'OPP-001',
            entityId: opp.id,
            message: `Oportunidade ganha sem pedido`,
            severity: 'CRITICAL',
            autoFix: true
          });

          // Auto-corrigir: criar order
          try {
            const newOrder = await base44.entities.Order.create({
              client_id: opp.client_id,
              principal_id: opp.principal_id,
              opportunity_id: opp.id,
              total_value: opp.value_estimated || 0,
              total_weight: opp.total_weight || 0,
              status: 'confirmado',
              notes: `Criado automaticamente pela auditoria de opportunity #${opp.id}`
            });

            result.fixes.push({
              rule: 'OPP-001',
              entityId: opp.id,
              action: `Order criado: ${newOrder.id}`,
              success: true
            });

            auditLogger.addFix('OPP-001', 'Opportunity', opp.id, `Order criada: ${newOrder.id}`, true);
          } catch (e) {
            auditLogger.addFix('OPP-001', 'Opportunity', opp.id, 'Falha ao criar Order', false);
          }
        }
      }

      // OPP-002: Perdido com tarefas ativas
      if (opp.stage === 'perdido') {
        const activeTasks = tasks.filter(t => t.opportunity_id === opp.id && t.status !== 'completed');
        if (activeTasks.length > 0) {
          result.issues.push({
            rule: 'OPP-002',
            entityId: opp.id,
            message: `Oportunidade perdida com ${activeTasks.length} tarefas ativas`,
            severity: 'HIGH',
            autoFix: true
          });

          // Auto-corrigir: cancelar tarefas
          for (const task of activeTasks) {
            try {
              await base44.entities.Task.update(task.id, { status: 'cancelled' });
              result.fixes.push({
                rule: 'OPP-002',
                entityId: task.id,
                action: 'Tarefa cancelada',
                success: true
              });
              auditLogger.addFix('OPP-002', 'Task', task.id, 'Cancelada', true);
            } catch (e) {
              auditLogger.addFix('OPP-002', 'Task', task.id, 'Falha ao cancelar', false);
            }
          }
        }
      }

      // OPP-003: Sem cliente
      if (!opp.client_id) {
        result.issues.push({
          rule: 'OPP-003',
          entityId: opp.id,
          message: 'Oportunidade sem cliente vinculado',
          severity: 'CRITICAL',
          autoFix: false
        });
        auditLogger.addIssue('OPP-003', 'Opportunity', opp.id, 'Sem cliente', 'CRITICAL');
      }

      // OPP-004: Negociação estagnada
      if (opp.stage === 'em_negociacao') {
        const lastContact = opp.last_contact_date ? new Date(opp.last_contact_date) : null;
        if (lastContact) {
          const daysSinceContact = Math.floor((new Date() - lastContact) / (1000 * 60 * 60 * 24));
          if (daysSinceContact > 15) {
            result.issues.push({
              rule: 'OPP-004',
              entityId: opp.id,
              message: `Negociação sem movimento há ${daysSinceContact} dias`,
              severity: 'HIGH',
              autoFix: true
            });

            // Auto-corrigir: criar tarefa follow-up
            try {
              const tomorrow = new Date();
              tomorrow.setDate(tomorrow.getDate() + 1);
              
              const newTask = await base44.entities.Task.create({
                title: `Follow-up urgente - Opportunity ${opp.quote_number || opp.id}`,
                opportunity_id: opp.id,
                client_id: opp.client_id,
                scheduled_date: tomorrow.toISOString().split('T')[0],
                scheduled_time: '09:00',
                task_type: 'follow_up',
                priority: 'high',
                status: 'pending'
              });

              result.fixes.push({
                rule: 'OPP-004',
                entityId: opp.id,
                action: `Task criada: ${newTask.id}`,
                success: true
              });

              auditLogger.addFix('OPP-004', 'Opportunity', opp.id, `Follow-up task criada: ${newTask.id}`, true);
            } catch (e) {
              auditLogger.addFix('OPP-004', 'Opportunity', opp.id, 'Falha ao criar task', false);
            }
          }
        }
      }
    }

    auditLogger.log('OPP-AUDIT', `Auditoria concluída: ${opportunities.length} oportunidades verificadas`, 'INFO');
  } catch (error) {
    result.passed = false;
    result.error = error.message;
    auditLogger.log('OPP-ERROR', error.message, 'ERROR');
  }

  return result;
}

// ============ ORDERS ============
export async function auditOrders() {
  const result = { passed: true, issues: [], fixes: [], totalChecked: 0 };

  try {
    const orders = await base44.entities.Order.list('-created_date', 2000);
    const commissions = await base44.entities.Commission.list('-created_date', 2000);
    const clients = await base44.entities.Client.list('company_name', 500);

    result.totalChecked = orders.length;

    for (const order of orders) {
      // ORD-001: Sem cliente
      if (!order.client_id) {
        result.issues.push({
          rule: 'ORD-001',
          entityId: order.id,
          message: 'Pedido sem cliente vinculado',
          severity: 'CRITICAL',
          autoFix: false
        });
        auditLogger.addIssue('ORD-001', 'Order', order.id, 'Sem cliente', 'CRITICAL');
      }

      // ORD-003: Sem itens
      if (!order.items || order.items.length === 0) {
        result.issues.push({
          rule: 'ORD-003',
          entityId: order.id,
          message: 'Pedido sem itens',
          severity: 'HIGH',
          autoFix: false
        });
        auditLogger.addIssue('ORD-003', 'Order', order.id, 'Sem itens', 'HIGH');
      }

      // ORD-004: Faturado sem comissão
      if (order.status === 'faturado' || order.status === 'entregue') {
        const hasCommission = commissions.some(c => c.order_id === order.id);
        if (!hasCommission && order.principal_id) {
          result.issues.push({
            rule: 'ORD-004',
            entityId: order.id,
            message: 'Pedido faturado sem comissão',
            severity: 'MEDIUM',
            autoFix: true
          });

          // Auto-corrigir: criar comissão padrão
          try {
            const principal = await base44.entities.Principal.read(order.principal_id);
            const commissionRate = principal?.commission_percentage || 5;
            const commissionValue = (order.total_value * commissionRate) / 100;

            const newCommission = await base44.entities.Commission.create({
              order_id: order.id,
              principal_id: order.principal_id,
              client_id: order.client_id,
              sales_value: order.total_value,
              commission_rate: commissionRate,
              commission_total_value: commissionValue,
              status: 'prevista',
              expected_first_receipt_date: new Date().toISOString().split('T')[0]
            });

            result.fixes.push({
              rule: 'ORD-004',
              entityId: order.id,
              action: `Comissão criada: ${newCommission.id}`,
              success: true
            });

            auditLogger.addFix('ORD-004', 'Order', order.id, `Comissão criada: ${newCommission.id}`, true);
          } catch (e) {
            auditLogger.addFix('ORD-004', 'Order', order.id, 'Falha ao criar comissão', false);
          }
        }
      }
    }

    auditLogger.log('ORD-AUDIT', `Auditoria concluída: ${orders.length} pedidos verificados`, 'INFO');
  } catch (error) {
    result.passed = false;
    result.error = error.message;
    auditLogger.log('ORD-ERROR', error.message, 'ERROR');
  }

  return result;
}

// ============ COMMISSIONS ============
export async function auditCommissions() {
  const result = { passed: true, issues: [], fixes: [], totalChecked: 0 };

  try {
    const commissions = await base44.entities.Commission.list('-created_date', 2000);
    const orders = await base44.entities.Order.list('-created_date', 2000);

    result.totalChecked = commissions.length;

    // COM-001: Duplicatas
    const commsByOrder = {};
    for (const comm of commissions) {
      if (!commsByOrder[comm.order_id]) commsByOrder[comm.order_id] = [];
      commsByOrder[comm.order_id].push(comm);
    }

    for (const [orderId, comms] of Object.entries(commsByOrder)) {
      if (comms.length > 1) {
        result.issues.push({
          rule: 'COM-001',
          entityId: orderId,
          message: `${comms.length} comissões duplicadas para mesmo pedido`,
          severity: 'MEDIUM',
          autoFix: true
        });

        // Auto-corrigir: manter maior valor, deletar outros
        const sorted = comms.sort((a, b) => (b.commission_total_value || 0) - (a.commission_total_value || 0));
        const toKeep = sorted[0];

        for (let i = 1; i < sorted.length; i++) {
          try {
            await base44.entities.Commission.delete(sorted[i].id);
            result.fixes.push({
              rule: 'COM-001',
              entityId: sorted[i].id,
              action: 'Comissão duplicada removida',
              success: true
            });
            auditLogger.addFix('COM-001', 'Commission', sorted[i].id, 'Removida duplicata', true);
          } catch (e) {
            auditLogger.addFix('COM-001', 'Commission', sorted[i].id, 'Falha ao remover', false);
          }
        }
      }
    }

    auditLogger.log('COM-AUDIT', `Auditoria concluída: ${commissions.length} comissões verificadas`, 'INFO');
  } catch (error) {
    result.passed = false;
    result.error = error.message;
    auditLogger.log('COM-ERROR', error.message, 'ERROR');
  }

  return result;
}

// ============ CLIENTS (Status e Premium) ============
export async function auditClients() {
  const result = { passed: true, issues: [], fixes: [], totalChecked: 0 };

  try {
    const clients = await base44.entities.Client.list('company_name', 500);
    const orders = await base44.entities.Order.list('-billing_date', 2000);

    result.totalChecked = clients.length;

    for (const client of clients) {
      // CLI-001: Premium sem status ativo
      if (client.is_premium && client.status !== 'active') {
        result.issues.push({
          rule: 'CLI-001',
          entityId: client.id,
          message: `Cliente Premium com status "${client.status}" (não-ativo)`,
          severity: 'HIGH',
          autoFix: true
        });

        try {
          await base44.entities.Client.update(client.id, { is_premium: false });
          result.fixes.push({
            rule: 'CLI-001',
            entityId: client.id,
            action: 'Flag Premium removida',
            success: true
          });
          auditLogger.addFix('CLI-001', 'Client', client.id, 'Premium flag removida', true);
        } catch (e) {
          auditLogger.addFix('CLI-001', 'Client', client.id, 'Falha ao remover Premium', false);
        }
      }

      // CLI-002: Múltiplos status (validação)
      const validStatuses = ['active', 'at_risk', 'inactive'];
      if (!validStatuses.includes(client.status)) {
        result.issues.push({
          rule: 'CLI-002',
          entityId: client.id,
          message: `Status inválido: "${client.status}"`,
          severity: 'HIGH',
          autoFix: true
        });

        try {
          await base44.entities.Client.update(client.id, { status: 'active' });
          result.fixes.push({
            rule: 'CLI-002',
            entityId: client.id,
            action: 'Status corrigido para "active"',
            success: true
          });
          auditLogger.addFix('CLI-002', 'Client', client.id, 'Status corrigido', true);
        } catch (e) {
          auditLogger.addFix('CLI-002', 'Client', client.id, 'Falha ao corrigir status', false);
        }
      }

      // CLI-003 e CLI-004: Verificar ciclo de compras
      if (client.status === 'active') {
        const clientOrders = orders.filter(o => o.client_id === client.id);
        if (clientOrders.length > 0) {
          const lastOrder = clientOrders[0];
          const lastPurchaseDate = new Date(lastOrder.billing_date || lastOrder.invoice_date || lastOrder.created_date);
          const daysSincePurchase = Math.floor((new Date() - lastPurchaseDate) / (1000 * 60 * 60 * 24));

          // CLI-004: Inativo (> 90 dias)
          if (daysSincePurchase > 90) {
            result.issues.push({
              rule: 'CLI-004',
              entityId: client.id,
              message: `Sem compra há ${daysSincePurchase} dias (> 90)`,
              severity: 'MEDIUM',
              autoFix: true
            });

            try {
              await base44.entities.Client.update(client.id, {
                status: 'inactive',
                last_contact_date: new Date().toISOString().split('T')[0]
              });
              result.fixes.push({
                rule: 'CLI-004',
                entityId: client.id,
                action: 'Status alterado para "inactive"',
                success: true
              });
              auditLogger.addFix('CLI-004', 'Client', client.id, 'Marcado como inativo', true);
            } catch (e) {
              auditLogger.addFix('CLI-004', 'Client', client.id, 'Falha ao marcar inativo', false);
            }
          }
        }
      }
    }

    auditLogger.log('CLI-AUDIT', `Auditoria concluída: ${clients.length} clientes verificados`, 'INFO');
  } catch (error) {
    result.passed = false;
    result.error = error.message;
    auditLogger.log('CLI-ERROR', error.message, 'ERROR');
  }

  return result;
}

// ============ DATA CONSISTENCY ============
export async function auditDataConsistency() {
  const result = { passed: true, issues: [], fixes: [], totalChecked: 0 };

  try {
    const orders = await base44.entities.Order.list('-created_date', 2000);

    // Extrair anos disponíveis
    const yearsSet = new Set();
    orders.forEach(o => {
      const dateToUse = o.billing_date || o.invoice_date || o.created_date;
      if (dateToUse) {
        yearsSet.add(new Date(dateToUse).getFullYear());
      }
    });

    const availableYears = Array.from(yearsSet).sort((a, b) => b - a);

    result.issues.push({
      rule: 'DC-CHECK',
      entityId: 'DATA',
      message: `Anos disponíveis: ${availableYears.join(', ')}`,
      severity: 'INFO',
      autoFix: false
    });

    for (const year of availableYears) {
      const yearOrders = orders.filter(o => {
        const dateToUse = o.billing_date || o.invoice_date || o.created_date;
        return dateToUse && new Date(dateToUse).getFullYear() === year;
      });

      result.issues.push({
        rule: 'DC-YEAR',
        entityId: `YEAR-${year}`,
        message: `${year}: ${yearOrders.length} pedidos, R$ ${yearOrders.reduce((s, o) => s + (o.total_value || 0), 0).toFixed(2)}`,
        severity: 'INFO',
        autoFix: false
      });
    }

    result.totalChecked = availableYears.length;
    auditLogger.log('DC-AUDIT', `Auditoria concluída: ${availableYears.length} anos verificados`, 'INFO');
  } catch (error) {
    result.passed = false;
    result.error = error.message;
    auditLogger.log('DC-ERROR', error.message, 'ERROR');
  }

  return result;
}