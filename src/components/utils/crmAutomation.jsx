/**
 * AUTOMAÇÕES COMPLETAS DO CRM - SALESMIND
 * Sistema de automação para cada transição de estágio do funil
 */

import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';

/**
 * AUTOMAÇÃO: Proposta Enviada
 * - Criar tarefa automática de follow-up (+2 dias úteis)
 * - Gerar alerta visual de proposta pendente
 * - Se 3 dias sem interação, marcar como oportunidade prioritária
 */
export async function automatePropostaEnviada(opportunity) {
  try {
    console.log('🚀 Automação: Proposta Enviada', opportunity.id);

    // 1. Criar tarefa de follow-up (+2 dias úteis)
    const followUpDate = addBusinessDays(new Date(), 2);
    const followUpTime = '10:00';

    await base44.entities.Task.create({
      title: `Follow-up: ${opportunity.client_name}`,
      description: `Acompanhar proposta enviada - Valor: R$ ${(opportunity.value_estimated || 0).toLocaleString('pt-BR')}`,
      task_type: 'follow_up',
      client_id: opportunity.client_id,
      client_name: opportunity.client_name,
      opportunity_id: opportunity.id,
      scheduled_date: formatDate(followUpDate),
      scheduled_time: followUpTime,
      status: 'pending',
      priority: 'medium'
    });

    // 2. Atualizar oportunidade com data de próximo contato
    await base44.entities.Opportunity.update(opportunity.id, {
      next_action_date: formatDate(followUpDate),
      next_action_type: 'whatsapp',
      last_contact_date: formatDate(new Date()),
      risk_level: 'low',
      timeline: [
        ...(opportunity.timeline || []),
        {
          date: new Date().toISOString(),
          type: 'automation',
          description: '✅ Tarefa de follow-up criada automaticamente (+2 dias úteis)',
          user: 'system'
        }
      ]
    });

    console.log('✅ Automação Proposta Enviada concluída');
    return true;
  } catch (error) {
    console.error('❌ Erro na automação Proposta Enviada:', error);
    
    // Criar alerta de auditoria
    await createAuditAlert({
      type: 'AUTOMACAO_FALHOU',
      severity: 'CRITICO',
      entity_type: 'Opportunity',
      entity_id: opportunity.id,
      message: `Falha na automação de Proposta Enviada: ${error.message}`
    });
    
    throw error;
  }
}

/**
 * AUTOMAÇÃO: Em Negociação
 * - Criar tarefa automática diária de acompanhamento
 * - Gerar alerta de negociação ativa
 * - Se 2 dias sem movimentação, gerar alerta crítico
 */
export async function automateEmNegociacao(opportunity) {
  try {
    console.log('🚀 Automação: Em Negociação', opportunity.id);

    // 1. Criar tarefa diária de acompanhamento
    const tomorrow = addBusinessDays(new Date(), 1);
    
    await base44.entities.Task.create({
      title: `🔥 Negociação Ativa: ${opportunity.client_name}`,
      description: `Oportunidade em negociação - Valor: R$ ${(opportunity.value_estimated || 0).toLocaleString('pt-BR')}\n⚠️ Requer atenção diária!`,
      task_type: 'follow_up',
      client_id: opportunity.client_id,
      client_name: opportunity.client_name,
      opportunity_id: opportunity.id,
      scheduled_date: formatDate(tomorrow),
      scheduled_time: '09:00',
      status: 'pending',
      priority: 'high'
    });

    // 2. Atualizar oportunidade com status de negociação ativa
    await base44.entities.Opportunity.update(opportunity.id, {
      next_action_date: formatDate(tomorrow),
      next_action_type: 'call',
      last_contact_date: formatDate(new Date()),
      risk_level: 'medium',
      priority_score: Math.max(opportunity.priority_score || 0, 70),
      timeline: [
        ...(opportunity.timeline || []),
        {
          date: new Date().toISOString(),
          type: 'automation',
          description: '🔥 Entrou em negociação - Acompanhamento diário ativado',
          user: 'system'
        }
      ]
    });

    console.log('✅ Automação Em Negociação concluída');
    return true;
  } catch (error) {
    console.error('❌ Erro na automação Em Negociação:', error);
    await createAuditAlert({
      type: 'AUTOMACAO_FALHOU',
      severity: 'CRITICO',
      entity_type: 'Opportunity',
      entity_id: opportunity.id,
      message: `Falha na automação de Em Negociação: ${error.message}`
    });
    throw error;
  }
}

/**
 * AUTOMAÇÃO: Ganho
 * - Criar pedido automaticamente
 * - Gerar comissão automaticamente (status: prevista)
 * - Criar tarefa de acompanhamento de faturamento
 * - Integrar pedido com financeiro, comissões e relatórios
 */
export async function automateGanho(opportunity, quote, principal) {
  try {
    console.log('🚀 Automação: Ganho', opportunity.id);

    // VALIDAÇÃO OBRIGATÓRIA
    if (!quote) {
      throw new Error('❌ Oportunidade ganha sem orçamento vinculado!');
    }

    // 1. CRIAR PEDIDO
    const orderNumber = `PED-${Date.now().toString().slice(-6)}`;
    
    // Calcular comissão (considerando política do representado)
    const commissionData = await calculateCommissionForOrder(quote, principal);
    
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
      payment_installments: parsePaymentTerms(quote.terms),
      commission_rate: commissionData.rate,
      expected_commission: commissionData.value,
      status: 'aberto',
      notes: `Criado automaticamente ao ganhar oportunidade ${opportunity.quote_number}`,
      status_history: [{
        status: 'aberto',
        date: new Date().toISOString(),
        notes: 'Pedido criado automaticamente pelo CRM'
      }]
    });

    console.log('✅ Pedido criado:', order.id);

    // 2. CRIAR COMISSÃO MASTER
    const commission = await base44.entities.Commission.create({
      order_id: order.id,
      order_number: order.order_number,
      quote_id: quote.id,
      opportunity_id: opportunity.id,
      principal_id: principal.id,
      principal_name: principal.trade_name || principal.company_name,
      client_id: opportunity.client_id,
      client_name: opportunity.client_name,
      sales_value: quote.total_value || 0,
      commission_rate: commissionData.rate,
      commission_total_value: commissionData.value,
      commission_value: commissionData.value,
      margin_pct: commissionData.margin,
      status: 'prevista',
      notes: `Comissão criada automaticamente pelo CRM ao ganhar pedido`
    });

    console.log('✅ Comissão criada:', commission.id);

    // 3. CRIAR PARCELAS DE COMISSÃO (baseado na política do representado)
    await createCommissionInstallments(commission, order, principal);

    // 4. CRIAR TAREFA DE ACOMPANHAMENTO DE FATURAMENTO
    const followUpDate = addBusinessDays(new Date(), 3);
    
    await base44.entities.Task.create({
      title: `📦 Acompanhar Faturamento: ${opportunity.client_name}`,
      description: `Pedido ${orderNumber} aguardando faturamento\nValor: R$ ${(order.total_value || 0).toLocaleString('pt-BR')}\nComissão prevista: R$ ${(commission.commission_total_value || 0).toLocaleString('pt-BR')}`,
      task_type: 'follow_up',
      client_id: opportunity.client_id,
      client_name: opportunity.client_name,
      opportunity_id: opportunity.id,
      scheduled_date: formatDate(followUpDate),
      scheduled_time: '14:00',
      status: 'pending',
      priority: 'high'
    });

    // 5. ATUALIZAR ORÇAMENTO
    await base44.entities.Quote.update(quote.id, {
      status: 'convertido',
      approved_date: formatDate(new Date())
    });

    // 6. ATUALIZAR OPORTUNIDADE
    await base44.entities.Opportunity.update(opportunity.id, {
      timeline: [
        ...(opportunity.timeline || []),
        {
          date: new Date().toISOString(),
          type: 'automation',
          description: `✅ Pedido ${orderNumber} criado | Comissão R$ ${commissionData.value.toFixed(2)} | Tarefa de faturamento agendada`,
          user: 'system'
        }
      ]
    });

    // 7. ATUALIZAR CLIENTE
    const client = await base44.entities.Client.filter({ id: opportunity.client_id }, '', 1).then(r => r[0]);
    if (client) {
      await base44.entities.Client.update(client.id, {
        last_purchase_date: formatDate(new Date()),
        last_purchase_value: order.total_value,
        purchase_count: (client.purchase_count || 0) + 1,
        total_purchases: (client.total_purchases || 0) + order.total_value
      });
    }

    console.log('✅ Automação Ganho concluída com sucesso!');
    toast.success(`Pedido ${orderNumber} criado automaticamente! 🎉`);
    
    return { order, commission };
  } catch (error) {
    console.error('❌ Erro crítico na automação Ganho:', error);
    
    await createAuditAlert({
      type: 'PEDIDO_SEM_COMISSAO',
      severity: 'CRITICO',
      entity_type: 'Opportunity',
      entity_id: opportunity.id,
      message: `Falha ao criar pedido/comissão: ${error.message}`
    });
    
    throw error;
  }
}

/**
 * AUTOMAÇÃO: Perdido
 * - Exigir motivo da perda (campo obrigatório)
 * - Enviar dados para relatórios de perdas
 * - Criar tarefa futura de reativação (30/60/90 dias)
 */
export async function automatePerdido(opportunity, lossReason, reactivationDays = 60) {
  try {
    console.log('🚀 Automação: Perdido', opportunity.id);

    // VALIDAÇÃO OBRIGATÓRIA
    if (!lossReason || lossReason.trim() === '') {
      throw new Error('❌ Motivo da perda é obrigatório!');
    }

    // 1. Criar tarefa de reativação futura
    const reactivationDate = new Date();
    reactivationDate.setDate(reactivationDate.getDate() + reactivationDays);
    
    await base44.entities.Task.create({
      title: `🔄 Reativar Cliente: ${opportunity.client_name}`,
      description: `Cliente perdido há ${reactivationDays} dias\nMotivo: ${lossReason}\nValor da oportunidade perdida: R$ ${(opportunity.value_estimated || 0).toLocaleString('pt-BR')}`,
      task_type: 'follow_up',
      client_id: opportunity.client_id,
      client_name: opportunity.client_name,
      opportunity_id: opportunity.id,
      scheduled_date: formatDate(reactivationDate),
      scheduled_time: '10:00',
      status: 'pending',
      priority: 'medium'
    });

    // 2. Atualizar oportunidade com motivo da perda
    await base44.entities.Opportunity.update(opportunity.id, {
      loss_reason: lossReason,
      risk_level: 'high',
      timeline: [
        ...(opportunity.timeline || []),
        {
          date: new Date().toISOString(),
          type: 'automation',
          description: `❌ Oportunidade perdida: ${lossReason} | Reativação agendada para ${formatDate(reactivationDate)}`,
          user: 'system'
        }
      ]
    });

    // 3. Atualizar orçamento como cancelado
    if (opportunity.quote_id) {
      await base44.entities.Quote.update(opportunity.quote_id, {
        status: 'cancelado'
      });
    }

    console.log('✅ Automação Perdido concluída');
    toast.success(`Reativação agendada para ${formatDate(reactivationDate)}`);
    
    return true;
  } catch (error) {
    console.error('❌ Erro na automação Perdido:', error);
    throw error;
  }
}

/**
 * MONITORAMENTO AUTOMÁTICO
 * Verifica oportunidades sem interação e gera alertas
 */
export async function monitorOpportunities() {
  try {
    const opportunities = await base44.entities.Opportunity.list('', 500);
    const now = new Date();
    
    for (const opp of opportunities) {
      if (opp.stage === 'ganho' || opp.stage === 'perdido') continue;
      
      const lastContact = opp.last_contact_date ? new Date(opp.last_contact_date) : null;
      const daysSinceContact = lastContact ? Math.floor((now - lastContact) / (1000 * 60 * 60 * 24)) : 999;
      
      // PROPOSTA ENVIADA: 3 dias sem contato = prioridade
      if (opp.stage === 'proposta_enviada' && daysSinceContact >= 3) {
        await base44.entities.Opportunity.update(opp.id, {
          priority_score: 80,
          risk_level: 'high',
          days_without_contact: daysSinceContact
        });
        
        await createAuditAlert({
          type: 'OPORTUNIDADE_SEM_CONTATO',
          severity: 'ALERTA',
          entity_type: 'Opportunity',
          entity_id: opp.id,
          message: `⚠️ Proposta enviada há ${daysSinceContact} dias sem follow-up`
        });
      }
      
      // EM NEGOCIAÇÃO: 2 dias sem movimentação = crítico
      if (opp.stage === 'em_negociacao' && daysSinceContact >= 2) {
        await base44.entities.Opportunity.update(opp.id, {
          priority_score: 90,
          risk_level: 'high',
          days_without_contact: daysSinceContact
        });
        
        await createAuditAlert({
          type: 'NEGOCIACAO_PARADA',
          severity: 'CRITICO',
          entity_type: 'Opportunity',
          entity_id: opp.id,
          message: `🚨 Negociação há ${daysSinceContact} dias sem atualização - Risco de perda!`
        });
      }
    }
    
    console.log('✅ Monitoramento de oportunidades concluído');
  } catch (error) {
    console.error('❌ Erro no monitoramento:', error);
  }
}

// ==================== FUNÇÕES AUXILIARES ====================

function addBusinessDays(date, days) {
  const result = new Date(date);
  let count = 0;
  
  while (count < days) {
    result.setDate(result.getDate() + 1);
    const dayOfWeek = result.getDay();
    if (dayOfWeek !== 0 && dayOfWeek !== 6) { // Não é fim de semana
      count++;
    }
  }
  
  return result;
}

function formatDate(date) {
  return date.toISOString().split('T')[0];
}

function parsePaymentTerms(terms) {
  if (!terms || !terms.includes('/')) return [];
  
  const parts = terms.split('/').map(t => parseInt(t.trim()));
  return parts.map((days, idx) => ({
    days: days,
    percentage: 100 / parts.length
  }));
}

async function calculateCommissionForOrder(quote, principal) {
  try {
    // Política FIXA (NEW AÇO, INTERSTEEL)
    if (principal.commission_policy === 'FIXA') {
      const rate = principal.commission_percentage || 0;
      const value = (quote.total_value || 0) * (rate / 100);
      return { rate, value, margin: 0 };
    }
    
    // Política POR_MARGEM (VTK)
    if (principal.commission_policy === 'POR_MARGEM' && principal.use_vtk_commission_table) {
      let totalCost = 0;
      let totalSale = 0;
      
      quote.items?.forEach(item => {
        const weight = item.total_weight || item.quantity || 0;
        totalCost += (item.vtk_cost || item.cost_per_kg || 0) * weight;
        totalSale += item.item_total || 0;
      });
      
      const margin = totalSale > 0 ? ((totalSale - totalCost) / totalSale) * 100 : 0;
      const rate = getVTKCommissionRate(margin, principal.vtk_commission_table);
      const value = (quote.total_value || 0) * (rate / 100);
      
      return { rate, value, margin };
    }
    
    // Fallback
    const rate = principal.commission_percentage || 0;
    const value = (quote.total_value || 0) * (rate / 100);
    return { rate, value, margin: 0 };
  } catch (error) {
    console.error('❌ Erro ao calcular comissão:', error);
    return { rate: 0, value: 0, margin: 0 };
  }
}

function getVTKCommissionRate(margin, commissionTable) {
  if (!commissionTable || !Array.isArray(commissionTable)) return 0;
  
  const bracket = commissionTable.find(b => 
    margin >= b.min_margin && margin <= b.max_margin
  );
  
  return bracket?.commission_rate || 0;
}

async function createCommissionInstallments(commission, order, principal) {
  try {
    const policy = principal.commission_policy;
    
    // POLÍTICA FIXA: Parcela única no dia de pagamento do representado
    if (policy === 'FIXA') {
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
      
      return;
    }
    
    // POLÍTICA PARCELADA: Criar parcelas baseadas nos vencimentos do cliente
    if (policy === 'PARCELADA_POR_VENCIMENTO' && order.payment_installments) {
      for (let i = 0; i < order.payment_installments.length; i++) {
        const inst = order.payment_installments[i];
        const dueDate = new Date();
        dueDate.setDate(dueDate.getDate() + inst.days);
        
        await base44.entities.CommissionInstallment.create({
          commission_id: commission.id,
          representada_id: principal.id,
          order_id: order.id,
          installment_no: i + 1,
          installment_pct: inst.percentage,
          installment_value: (commission.commission_total_value * inst.percentage) / 100,
          due_date: formatDate(dueDate),
          status: 'prevista',
          reference_month: formatMonth(dueDate)
        });
      }
    }
  } catch (error) {
    console.error('❌ Erro ao criar parcelas de comissão:', error);
    throw error;
  }
}

function getNextPaymentDate(dayOfMonth) {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  
  let paymentDate = new Date(year, month, dayOfMonth);
  
  // Se já passou, vai para o próximo mês
  if (paymentDate < now) {
    paymentDate = new Date(year, month + 1, dayOfMonth);
  }
  
  return paymentDate;
}

function formatMonth(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
}

async function createAuditAlert(data) {
  try {
    await base44.entities.FinancialAudit.create(data);
  } catch (error) {
    console.error('❌ Erro ao criar alerta de auditoria:', error);
  }
}

export default {
  automatePropostaEnviada,
  automateEmNegociacao,
  automateGanho,
  automatePerdido,
  monitorOpportunities
};