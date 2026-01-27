/**
 * 🎯 SMART AUTOMATION ENGINE - SALESMIND
 * PRINCÍPIO MESTRE: O funil manda, a automação obedece
 * 
 * Regras de ouro:
 * - NUNCA duplicar tarefa
 * - NUNCA criar tarefa fora do estágio
 * - NUNCA gerar conflito de status do cliente
 * - Status operacional é ÚNICO (Ativo/Em Risco/Inativo)
 * - Tags históricas não geram automação
 */

import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';

// ==================== AUTOMAÇÃO DE FOLLOW-UP POR ESTÁGIO ====================

/**
 * 🟦 PROPOSTA ENVIADA
 * Criar apenas 1 tarefa ativa por oportunidade
 */
export async function automatePropostaEnviada(opportunity) {
  try {
    console.log('🟦 Automação: Proposta Enviada', opportunity.id);

    // Verificar se já existe tarefa ativa para esta oportunidade
    const existingTasks = await base44.entities.Task.filter(
      { opportunity_id: opportunity.id, status: 'pending' },
      '-created_date',
      10
    );

    if (existingTasks.length > 0) {
      console.log('⚠️ Tarefa já existe, cancelando duplicação');
      return { skipped: true, reason: 'Tarefa já existe' };
    }

    // Criar tarefa: +3 dias, prioridade média
    const followUpDate = addDays(new Date(), 3);
    
    const task = await base44.entities.Task.create({
      title: `Follow-up Proposta - ${opportunity.client_name}`,
      description: `✓ Confirmar recebimento da proposta\n✓ Validar dúvidas técnicas\n✓ Reforçar prazo/condição\n✓ Registrar retorno`,
      task_type: 'follow_up',
      client_id: opportunity.client_id,
      client_name: opportunity.client_name,
      opportunity_id: opportunity.id,
      scheduled_date: formatDate(followUpDate),
      scheduled_time: '10:00',
      status: 'pending',
      priority: 'medium'
    });

    // Atualizar oportunidade
    await base44.entities.Opportunity.update(opportunity.id, {
      next_followup_at: followUpDate.toISOString(),
      last_contact_at: new Date().toISOString(),
      timeline: [
        ...(opportunity.timeline || []),
        {
          date: new Date().toISOString(),
          type: 'automation',
          description: '✅ Tarefa de follow-up criada (+3 dias)',
          user: 'system'
        }
      ]
    });

    console.log('✅ Tarefa criada:', task.id);
    return { task };
  } catch (error) {
    console.error('❌ Erro em automatePropostaEnviada:', error);
    throw error;
  }
}

/**
 * 🟨 NEGOCIAÇÃO
 * Concluir tarefa anterior e criar nova (+2 dias, prioridade ALTA)
 */
export async function automateEmNegociacao(opportunity) {
  try {
    console.log('🟨 Automação: Em Negociação', opportunity.id);

    // 1. Concluir tarefas anteriores do estágio "proposta_enviada"
    const previousTasks = await base44.entities.Task.filter(
      { opportunity_id: opportunity.id, status: 'pending' },
      '-created_date',
      20
    );

    for (const task of previousTasks) {
      await base44.entities.Task.update(task.id, {
        status: 'completed',
        notes: 'Auto-concluída ao mudar para Negociação'
      });
    }

    // 2. Criar nova tarefa: +2 dias, ALTA prioridade
    const followUpDate = addDays(new Date(), 2);
    
    const task = await base44.entities.Task.create({
      title: `🔥 Follow-up Negociação - ${opportunity.client_name}`,
      description: `✓ Ajustar preço/prazo/condição\n✓ Validar objeções\n✓ Confirmar decisão`,
      task_type: 'follow_up',
      client_id: opportunity.client_id,
      client_name: opportunity.client_name,
      opportunity_id: opportunity.id,
      scheduled_date: formatDate(followUpDate),
      scheduled_time: '09:00',
      status: 'pending',
      priority: 'high'
    });

    // 3. Atualizar oportunidade
    await base44.entities.Opportunity.update(opportunity.id, {
      next_followup_at: followUpDate.toISOString(),
      last_contact_at: new Date().toISOString(),
      priority_score: Math.max(opportunity.priority_score || 0, 70),
      risk_level: 'medium',
      timeline: [
        ...(opportunity.timeline || []),
        {
          date: new Date().toISOString(),
          type: 'automation',
          description: '🔥 Negociação ativa - Acompanhamento diário',
          user: 'system'
        }
      ]
    });

    console.log('✅ Negociação automatizada:', task.id);
    return { task };
  } catch (error) {
    console.error('❌ Erro em automateEmNegociacao:', error);
    throw error;
  }
}

/**
 * 🟩 GANHO
 * Concluir todas as tarefas de venda e criar tarefa de pós-venda
 */
export async function automateGanho(opportunity, quote, principal) {
  try {
    console.log('🟩 Automação: Ganho', opportunity.id);

    // 1. Concluir TODAS as tarefas de venda
    const saleTasks = await base44.entities.Task.filter(
      { opportunity_id: opportunity.id, status: 'pending' },
      '-created_date',
      50
    );

    for (const task of saleTasks) {
      await base44.entities.Task.update(task.id, {
        status: 'completed',
        completed_at: new Date().toISOString(),
        notes: 'Auto-concluída ao ganhar negócio'
      });
    }

    // 2. Criar Order
    const order = await createOrderFromOpportunity(opportunity, quote, principal);

    // 3. Criar Commission
    const commission = await createCommissionFromOrder(order, principal);

    // 4. Criar parcelas de comissão
    await createCommissionInstallments(commission, order, principal);

    // 5. Criar tarefa de pós-venda (+1 dia, ALTA prioridade)
    const posVendaDate = addDays(new Date(), 1);
    
    await base44.entities.Task.create({
      title: `📦 Pós-venda + Pedido - ${opportunity.client_name}`,
      description: `✓ Conferir pedido\n✓ Confirmar estoque\n✓ Alinhar prazo de entrega\n✓ Registrar no financeiro`,
      task_type: 'follow_up',
      client_id: opportunity.client_id,
      client_name: opportunity.client_name,
      opportunity_id: opportunity.id,
      scheduled_date: formatDate(posVendaDate),
      scheduled_time: '09:00',
      status: 'pending',
      priority: 'high'
    });

    // 6. Atualizar Quote
    if (quote) {
      await base44.entities.Quote.update(quote.id, {
        status: 'convertido',
        approved_date: formatDate(new Date())
      });
    }

    // 7. Atualizar Cliente
    await updateClientAfterPurchase(opportunity.client_id, order.total_value);

    console.log('✅ Fluxo Ganho completo:', { order: order.id, commission: commission.id });
    toast.success(`🎉 Pedido ${order.order_number} criado automaticamente!`);
    
    return { order, commission };
  } catch (error) {
    console.error('❌ Erro crítico em automateGanho:', error);
    
    await base44.entities.FinancialAudit.create({
      type: 'PEDIDO_SEM_COMISSAO',
      severity: 'CRITICO',
      entity_type: 'Opportunity',
      entity_id: opportunity.id,
      message: `Falha ao criar pedido/comissão: ${error.message}`
    });
    
    throw error;
  }
}

// ==================== AUTOMAÇÃO DE STATUS DO CLIENTE ====================

/**
 * ⚠️ CLIENTE EM RISCO
 * Gatilho: dias > ciclo_medio × 1.3 E status = Ativo/Recorrente
 * NUNCA rodar se já estiver Inativo
 */
export async function checkClientAtRisk(client, orders) {
  try {
    // Não processar se já está inativo
    if (client.status === 'inactive') {
      return { skipped: true, reason: 'Cliente já inativo' };
    }

    const avgCycle = client.average_purchase_cycle || 30;
    const threshold = avgCycle * 1.3;
    
    const lastOrder = orders.filter(o => o.client_id === client.id)
      .sort((a, b) => new Date(b.created_date) - new Date(a.created_date))[0];
    
    if (!lastOrder) return { skipped: true };

    const daysSince = Math.floor((new Date() - new Date(lastOrder.created_date)) / (1000 * 60 * 60 * 24));

    if (daysSince > threshold && (client.status === 'active' || !client.status)) {
      // Atualizar status → Em Risco
      await base44.entities.Client.update(client.id, {
        status: 'at_risk',
        status_history: [
          ...(client.status_history || []),
          {
            status: 'at_risk',
            date: new Date().toISOString(),
            reason: `${daysSince} dias sem compra (ciclo: ${avgCycle})`,
            notes: 'Automação: ultrapassou 1.3x do ciclo'
          }
        ]
      });

      // Criar tarefa de reativação
      const taskDate = addDays(new Date(), 1);
      
      await base44.entities.Task.create({
        title: `⚠️ Reativação - Cliente em risco: ${client.company_name}`,
        description: `Cliente há ${daysSince} dias sem comprar (ciclo médio: ${avgCycle} dias)\nÚltima compra: ${lastOrder.created_date?.split('T')[0]}`,
        task_type: 'call',
        client_id: client.id,
        client_name: client.company_name,
        scheduled_date: formatDate(taskDate),
        scheduled_time: '10:00',
        status: 'pending',
        priority: 'high'
      });

      console.log('✅ Cliente marcado como EM RISCO:', client.id);
      return { updated: true, status: 'at_risk' };
    }

    return { skipped: true };
  } catch (error) {
    console.error('❌ Erro em checkClientAtRisk:', error);
    throw error;
  }
}

/**
 * ⛔ CLIENTE INATIVO
 * Gatilho: 90+ dias sem compra
 * Status Inativo SEMPRE sobrepõe qualquer outro status
 */
export async function checkClientInactive(client, orders) {
  try {
    const lastOrder = orders.filter(o => o.client_id === client.id)
      .sort((a, b) => new Date(b.created_date) - new Date(a.created_date))[0];
    
    if (!lastOrder) return { skipped: true };

    const daysSince = Math.floor((new Date() - new Date(lastOrder.created_date)) / (1000 * 60 * 60 * 24));

    if (daysSince > 90) {
      // Atualizar para INATIVO (remove qualquer outro status)
      await base44.entities.Client.update(client.id, {
        status: 'inactive',
        inactive_count: (client.inactive_count || 0) + 1,
        last_inactive_date: formatDate(new Date()),
        status_history: [
          ...(client.status_history || []),
          {
            status: 'inactive',
            date: new Date().toISOString(),
            reason: `${daysSince} dias sem compra`,
            notes: 'Automação: 90+ dias sem atividade'
          }
        ]
      });

      // Criar tarefa de reativação URGENTE
      const taskDate = addDays(new Date(), 1);
      
      await base44.entities.Task.create({
        title: `🚨 Reativação - 90 dias sem compra: ${client.company_name}`,
        description: `Cliente INATIVO há ${daysSince} dias\nHistórico de inativações: ${(client.inactive_count || 0) + 1}x`,
        task_type: 'call',
        client_id: client.id,
        client_name: client.company_name,
        scheduled_date: formatDate(taskDate),
        scheduled_time: '09:00',
        status: 'pending',
        priority: 'high'
      });

      console.log('✅ Cliente marcado como INATIVO:', client.id);
      return { updated: true, status: 'inactive' };
    }

    return { skipped: true };
  } catch (error) {
    console.error('❌ Erro em checkClientInactive:', error);
    throw error;
  }
}

/**
 * 🏆 CLASSIFICAÇÃO PREMIUM (derivada, não tag)
 * Regras obrigatórias:
 * - status = Ativo
 * - ≥ 3 compras em meses distintos no ano
 * - ticket_medio ≥ threshold configurável
 * - dias_desde_ultima_compra dentro do ciclo
 * 
 * Se virar Inativo → remove is_premium, mantém apenas histórico
 */
export async function updatePremiumClassification(client, orders, year = 2025, ticketThreshold = 50000) {
  try {
    // Cliente Inativo NUNCA pode ser Premium
    if (client.status === 'inactive') {
      if (client.is_premium) {
        // Remover classificação Premium mas manter histórico
        const historicalTag = `Premium - ${year}`;
        const existingTags = client.auto_tags || [];
        
        await base44.entities.Client.update(client.id, {
          is_premium: false,
          auto_tags: existingTags.includes(historicalTag) ? existingTags : [...existingTags, historicalTag],
          tags_last_updated: new Date().toISOString()
        });
        
        console.log('✅ Premium removido (cliente inativo), histórico mantido:', client.id);
      }
      return { is_premium: false, reason: 'Cliente inativo' };
    }

    // Filtrar pedidos do ano
    const ordersYear = orders.filter(o => {
      const date = new Date(o.created_date);
      return date.getFullYear() === year && o.client_id === client.id;
    });

    // Verificar recorrência (3+ meses distintos)
    const monthsWithPurchase = new Set(
      ordersYear.map(o => new Date(o.created_date).getMonth())
    );
    
    const isRecurrent = monthsWithPurchase.size >= 3;

    // Calcular ticket médio
    const revenue = ordersYear.reduce((sum, o) => sum + (o.total_value || 0), 0);
    const avgTicket = ordersYear.length > 0 ? revenue / ordersYear.length : 0;
    const hasHighTicket = avgTicket >= ticketThreshold;

    // Verificar última compra dentro do ciclo
    const lastOrder = ordersYear.sort((a, b) => new Date(b.created_date) - new Date(a.created_date))[0];
    const daysSince = lastOrder ? 
      Math.floor((new Date() - new Date(lastOrder.created_date)) / (1000 * 60 * 60 * 24)) : 999;
    const avgCycle = client.average_purchase_cycle || 30;
    const withinCycle = daysSince <= avgCycle;

    // Cliente Premium = Ativo + Recorrente + Ticket Alto + Dentro do Ciclo
    const shouldBePremium = (client.status === 'active') && isRecurrent && hasHighTicket && withinCycle;

    // Atualizar se mudou
    if (client.is_premium !== shouldBePremium) {
      const updateData = {
        is_premium: shouldBePremium,
        tags_last_updated: new Date().toISOString()
      };

      if (shouldBePremium) {
        updateData.premium_since = formatDate(new Date());
        updateData.premium_year = year;
        
        // Adicionar tag histórica
        const historicalTag = `Premium - ${year}`;
        const existingTags = client.auto_tags || [];
        updateData.auto_tags = existingTags.includes(historicalTag) ? existingTags : [...existingTags, historicalTag];
      }

      await base44.entities.Client.update(client.id, updateData);

      console.log(`✅ Premium atualizado: ${client.id} → ${shouldBePremium}`);
      return { 
        is_premium: shouldBePremium, 
        revenue, 
        avg_ticket: avgTicket,
        months_active: monthsWithPurchase.size,
        days_since_purchase: daysSince
      };
    }

    return { skipped: true, is_premium: client.is_premium };
  } catch (error) {
    console.error('❌ Erro em updatePremiumClassification:', error);
    throw error;
  }
}

/**
 * 🏷️ TAGS HISTÓRICAS (complementares)
 * Aplicar tags de HISTÓRICO por ano
 */
export async function applyHistoricalTags(client, orders, year = 2025) {
  try {
    const ordersYear = orders.filter(o => {
      const date = new Date(o.created_date);
      return date.getFullYear() === year && o.client_id === client.id;
    });

    const tags = [];

    // Tag: Recorrente (3+ compras em meses distintos)
    const monthsWithPurchase = new Set(
      ordersYear.map(o => new Date(o.created_date).getMonth())
    );
    
    if (monthsWithPurchase.size >= 3) {
      tags.push(`Recorrente - ${year}`);
    }

    if (tags.length > 0) {
      const existingTags = client.auto_tags || [];
      const newTags = [...new Set([...existingTags, ...tags])];
      
      await base44.entities.Client.update(client.id, {
        auto_tags: newTags,
        tags_last_updated: new Date().toISOString()
      });

      console.log('✅ Tags históricas aplicadas:', client.id, tags);
      return { tags };
    }

    return { skipped: true };
  } catch (error) {
    console.error('❌ Erro em applyHistoricalTags:', error);
    throw error;
  }
}

/**
 * 📦 ESTOQUE MÍNIMO
 * Não criar múltiplas tarefas para o mesmo produto
 */
export async function checkStockMinimum(product, principal) {
  try {
    if ((product.stock_quantity || 0) >= (product.min_quantity || 0)) {
      return { skipped: true };
    }

    // Verificar se já existe tarefa ativa de reposição para este produto
    const existingTasks = await base44.entities.Task.filter(
      { status: 'pending' },
      '-created_date',
      100
    );

    const hasPendingTask = existingTasks.some(t => 
      t.title.includes(product.name) && t.title.includes('Reposição')
    );

    if (hasPendingTask) {
      return { skipped: true, reason: 'Tarefa de reposição já existe' };
    }

    // Criar tarefa
    const task = await base44.entities.Task.create({
      title: `📦 Reposição de estoque: ${product.name}`,
      description: `Estoque atual: ${product.stock_quantity} ${product.unit}\nMínimo: ${product.min_quantity} ${product.unit}\nRepresentada: ${principal?.company_name}`,
      task_type: 'other',
      scheduled_date: formatDate(new Date()),
      scheduled_time: '08:00',
      status: 'pending',
      priority: 'high'
    });

    console.log('✅ Alerta de estoque criado:', task.id);
    return { task };
  } catch (error) {
    console.error('❌ Erro em checkStockMinimum:', error);
    throw error;
  }
}

// ==================== HELPERS DE ORDER E COMMISSION ====================

async function createOrderFromOpportunity(opportunity, quote, principal) {
  if (!quote) {
    throw new Error('Quote não encontrado para criar Order');
  }

  const orderNumber = `PED-${Date.now().toString().slice(-6)}`;
  
  const order = await base44.entities.Order.create({
    order_number: orderNumber,
    quote_id: quote.id,
    opportunity_id: opportunity.id,
    client_id: opportunity.client_id,
    client_name: opportunity.client_name,
    principal_id: opportunity.principal_id,
    principal_name: opportunity.principal_name,
    items: quote.items || [],
    total_value: quote.total_value || 0,
    total_weight: quote.total_weight || 0,
    total_icms: quote.total_icms || 0,
    total_ipi: quote.total_ipi || 0,
    terms: quote.terms,
    payment_terms: quote.payment_terms,
    status: 'aberto',
    notes: `[AUTOMAÇÃO] Criado ao ganhar oportunidade`,
    status_history: [{
      status: 'aberto',
      date: new Date().toISOString(),
      notes: 'Pedido criado automaticamente'
    }]
  });

  console.log('✅ Order criado:', order.id);
  return order;
}

async function createCommissionFromOrder(order, principal) {
  const commissionRate = principal?.commission_percentage || 3;
  const commissionValue = (order.total_value || 0) * (commissionRate / 100);

  const commission = await base44.entities.Commission.create({
    order_id: order.id,
    order_number: order.order_number,
    quote_id: order.quote_id,
    opportunity_id: order.opportunity_id,
    principal_id: order.principal_id,
    principal_name: order.principal_name,
    client_id: order.client_id,
    client_name: order.client_name,
    sales_value: order.total_value,
    commission_rate: commissionRate,
    commission_total_value: commissionValue,
    commission_value: commissionValue,
    status: 'prevista',
    notes: '[AUTOMAÇÃO] Comissão criada automaticamente'
  });

  console.log('✅ Commission criada:', commission.id);
  return commission;
}

async function createCommissionInstallments(commission, order, principal) {
  const policy = principal?.commission_policy || 'FIXA';
  
  if (policy === 'FIXA') {
    // Parcela única no dia de pagamento
    const paymentDay = principal.payment_day || 15;
    const dueDate = getNextPaymentDate(paymentDay);
    
    await base44.entities.CommissionInstallment.create({
      commission_id: commission.id,
      representada_id: principal.id,
      order_id: order.id,
      installment_no: 1,
      installment_pct: 100,
      installment_value: commission.commission_total_value,
      due_date: formatDate(dueDate),
      status: 'prevista',
      reference_month: formatMonth(dueDate)
    });
  }
  // Adicionar lógica para outras políticas se necessário
}

async function updateClientAfterPurchase(clientId, purchaseValue) {
  const client = await base44.entities.Client.filter({ id: clientId }, '', 1).then(r => r[0]);
  if (!client) return;

  await base44.entities.Client.update(clientId, {
    last_purchase_date: formatDate(new Date()),
    last_purchase_value: purchaseValue,
    purchase_count: (client.purchase_count || 0) + 1,
    total_purchases: (client.total_purchases || 0) + purchaseValue,
    status: 'active', // Compra reativa o cliente
    last_contact_date: formatDate(new Date())
  });
}

// ==================== UTILS ====================

function addDays(date, days) {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

function formatDate(date) {
  return date.toISOString().split('T')[0];
}

function formatMonth(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
}

function getNextPaymentDate(dayOfMonth) {
  const now = new Date();
  let paymentDate = new Date(now.getFullYear(), now.getMonth(), dayOfMonth);
  
  if (paymentDate < now) {
    paymentDate = new Date(now.getFullYear(), now.getMonth() + 1, dayOfMonth);
  }
  
  return paymentDate;
}

export default {
  automatePropostaEnviada,
  automateEmNegociacao,
  automateGanho,
  checkClientAtRisk,
  checkClientInactive,
  updatePremiumClassification,
  applyHistoricalTags,
  checkStockMinimum
};