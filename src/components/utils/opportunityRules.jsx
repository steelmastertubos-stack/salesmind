/**
 * Sistema de Regras CRM - Oportunidades
 * Regra Zero: Oportunidade SEM próxima ação = ERRO
 */

export const OPPORTUNITY_STAGES = {
  PROPOSAL_SENT: 'proposta_enviada',
  NEGOTIATION: 'em_negociacao',
  WON: 'ganho',
  LOST: 'perdido'
};

export const TASK_TYPES = {
  FOLLOW_UP: 'follow_up',
  POST_SALES: 'pós_venda',
  REACTIVATION: 'reactivation',
  STOCK_REPLENISHMENT: 'stock_replenishment'
};

/**
 * Validar se oportunidade tem próxima ação definida (Regra Zero)
 */
export function validateOpportunityHasNextAction(opportunity, tasks = []) {
  if (opportunity.status === OPPORTUNITY_STAGES.WON || opportunity.status === OPPORTUNITY_STAGES.LOST) {
    return { valid: true };
  }

  const hasFutureTask = tasks.some(
    task => 
      task.opportunity_id === opportunity.id &&
      task.status !== 'completed' &&
      task.status !== 'cancelled'
  );

  if (!hasFutureTask) {
    return {
      valid: false,
      error: 'Esta oportunidade não tem próximo passo definido. Crie uma tarefa antes de prosseguir.',
      severity: 'error'
    };
  }

  return { valid: true };
}

/**
 * Calcular score da oportunidade
 */
export function calculateOpportunityScore(opportunity, client, orders = []) {
  let score = 50; // base

  // Valor > ticket médio (+20)
  if (opportunity.value_estimated) {
    const averageTicket = orders.length > 0 
      ? orders.reduce((sum, o) => sum + (o.total_value || 0), 0) / orders.length
      : 0;
    
    if (opportunity.value_estimated > averageTicket) score += 20;
  }

  // Cliente Recorrente (+15)
  if (client?.auto_tags?.some(tag => tag.startsWith('Recorrente'))) {
    score += 15;
  }

  // Cliente Premium (+20)
  if (client?.is_premium) {
    score += 20;
  }

  // Sem contato > 5 dias (-25)
  if (opportunity.days_without_contact && opportunity.days_without_contact > 5) {
    score -= 25;
  }

  // Follow-up atrasado (-30)
  const now = new Date();
  const hasOverdueTask = (opportunity.relatedTasks || []).some(
    task => new Date(task.scheduled_date) < now && task.status !== 'completed'
  );
  if (hasOverdueTask) {
    score -= 30;
  }

  // Pedido criado (+30)
  if (opportunity.order_id) {
    score += 30;
  }

  return Math.max(0, Math.min(100, score));
}

/**
 * Classificar temperatura da oportunidade baseada no score
 */
export function getOpportunityTemperature(score) {
  if (score >= 70) return { label: 'Quente 🔥', color: 'red', intensity: 'high' };
  if (score >= 40) return { label: 'Morna ⚠️', color: 'yellow', intensity: 'medium' };
  return { label: 'Fria ❄️', color: 'blue', intensity: 'low' };
}

/**
 * Validar se pode mudar status sem tarefa de transição
 */
export function getRequiredTaskForStageTransition(newStage) {
  const requirements = {
    [OPPORTUNITY_STAGES.PROPOSAL_SENT]: {
      taskType: TASK_TYPES.FOLLOW_UP,
      taskTitle: 'Follow-up Proposta',
      daysUntilDue: 3,
      priority: 'medium'
    },
    [OPPORTUNITY_STAGES.NEGOTIATION]: {
      taskType: TASK_TYPES.FOLLOW_UP,
      taskTitle: 'Follow-up Negociação',
      daysUntilDue: 2,
      priority: 'high'
    },
    [OPPORTUNITY_STAGES.WON]: {
      taskType: TASK_TYPES.POST_SALES,
      taskTitle: 'Pós-venda + Pedido',
      daysUntilDue: 1,
      priority: 'high',
      requiresOrderCreation: true
    }
  };

  return requirements[newStage] || null;
}

/**
 * Detectar oportunidades em risco (sem contato + dias decorridos)
 */
export function getOpportunitiesAtRisk(opportunities = []) {
  const now = new Date();
  return opportunities.filter(opp => {
    if (opp.status === OPPORTUNITY_STAGES.WON || opp.status === OPPORTUNITY_STAGES.LOST) {
      return false;
    }

    const daysSinceContact = Math.floor(
      (now - new Date(opp.last_contact_at || opp.created_date)) / (1000 * 60 * 60 * 24)
    );

    return daysSinceContact >= 5;
  });
}

/**
 * Validar integridade (G0.1, G0.2, G0.3)
 */
export function validateDataIntegrity(clients = [], opportunities = [], tasks = []) {
  const issues = [];

  // G0.1 - Status exclusivo
  clients.forEach(client => {
    const statusCount = [
      client.status === 'active',
      client.status === 'at_risk',
      client.status === 'inactive'
    ].filter(Boolean).length;

    if (statusCount > 1) {
      issues.push({
        type: 'G0.1',
        severity: 'critical',
        entity: 'Client',
        entityId: client.id,
        message: `Cliente ${client.company_name} tem múltiplos status`
      });
    }
  });

  // G0.2 - 1 tarefa ativa por tipo por oportunidade
  opportunities.forEach(opp => {
    const activeTasks = tasks.filter(
      t => t.opportunity_id === opp.id && t.status !== 'completed' && t.status !== 'cancelled'
    );

    const tasksByType = {};
    activeTasks.forEach(task => {
      tasksByType[task.task_type] = (tasksByType[task.task_type] || 0) + 1;
    });

    Object.entries(tasksByType).forEach(([type, count]) => {
      if (count > 1) {
        issues.push({
          type: 'G0.2',
          severity: 'warning',
          entity: 'Opportunity',
          entityId: opp.id,
          message: `Oportunidade ${opp.id} tem ${count} tarefas ativas do tipo ${type}`
        });
      }
    });
  });

  return issues;
}

/**
 * Recalcular campos derivados de oportunidade
 */
export function enrichOpportunityData(opportunity, relatedTasks = [], client = {}) {
  const now = new Date();
  const lastContactDate = new Date(opportunity.last_contact_at || opportunity.created_date);
  const daysSinceContact = Math.floor((now - lastContactDate) / (1000 * 60 * 60 * 24));

  return {
    ...opportunity,
    days_without_contact: daysSinceContact,
    relatedTasks: relatedTasks,
    hasOverdueTask: relatedTasks.some(
      t => new Date(t.scheduled_date) < now && t.status !== 'completed'
    ),
    score: calculateOpportunityScore(opportunity, client),
    temperature: getOpportunityTemperature(calculateOpportunityScore(opportunity, client))
  };
}