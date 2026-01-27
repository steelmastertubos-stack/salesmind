import { base44 } from '@/api/base44Client';

const CORRECTIVE_ACTIONS = {
  preco: {
    title: 'Revisar estratégia de preço/alternativas técnicas',
    description: 'Analisar alternativas de material, especificações ou ajustes de margem',
    type: 'reminder'
  },
  prazo_entrega: {
    title: 'Verificar estoque/prazo do fornecedor',
    description: 'Conferir disponibilidade e tempo de reposição',
    type: 'reminder'
  },
  estoque_indisponivel: {
    title: 'Reposição/Planejamento de estoque',
    description: 'Ativar processo de recompra ou planejamento futuro',
    type: 'reminder'
  },
  falta_retorno_cliente: {
    title: 'Auditar disciplina de follow-up do vendedor',
    description: 'Revisar últimos 30 dias de contatos e follow-ups',
    type: 'attention'
  },
  followup_atrasado: {
    title: 'Auditar disciplina de follow-up do vendedor',
    description: 'Revisar últimos 30 dias de contatos e follow-ups',
    type: 'attention'
  }
};

export async function createCorrectiveActions(lostDeal, opportunity) {
  try {
    // Obter dados do usuário atual
    const user = await base44.auth.me();
    
    const actions = [];
    const motivo = lostDeal.motivo_primario;
    const secundarios = lostDeal.motivos_secundarios || [];

    // Determinar ações baseadas no motivo primário
    if (CORRECTIVE_ACTIONS[motivo]) {
      actions.push(motivo);
    }

    // Verificar motivos secundários que acionam ações
    if (secundarios.includes('followup_atrasado') || secundarios.includes('demora_orcamento')) {
      if (!actions.includes('falta_retorno_cliente')) {
        actions.push('falta_retorno_cliente');
      }
    }

    // Criar tarefas para cada ação
    for (const action of actions) {
      const config = CORRECTIVE_ACTIONS[action];
      
      await base44.entities.Task.create({
        title: config.title,
        description: config.description,
        task_type: 'follow_up',
        client_id: lostDeal.client_id,
        client_name: lostDeal.client_name,
        opportunity_id: lostDeal.opportunity_id,
        scheduled_date: new Date().toISOString().split('T')[0],
        scheduled_time: '09:00',
        priority: 'high',
        status: 'pending',
        notes: `Ação corretiva automática - Perda registrada\nMotivo: ${lostDeal.motivo_primario}\nValor: R$ ${lostDeal.deal_value}`
      });
    }

    // Se "Falta de retorno" ou "Follow-up atrasado", adicionar flag ao vendedor
    if (motivo === 'falta_retorno_cliente' || secundarios.includes('followup_atrasado')) {
      // Aqui você pode adicionar lógica para marcar vendedor em risco se tiver entidade
      // Por enquanto, criamos tarefa adicional para gestor
      await base44.entities.Task.create({
        title: '⚠️ Revisar vendedor - Múltiplas perdas por follow-up',
        description: 'Vendedor pode ter problemas com disciplina de contato',
        task_type: 'call',
        priority: 'high',
        scheduled_date: new Date().toISOString().split('T')[0],
        scheduled_time: '10:00',
        status: 'pending',
        notes: `Vendedor: ${lostDeal.vendor_name} (${lostDeal.vendor_email})\nCliente: ${lostDeal.client_name}\nMotivo: ${motivo}`
      });
    }

    // Atualizar flag na LostDeal
    await base44.entities.LostDeal.update(lostDeal.id, {
      corrective_tasks_created: true
    });

  } catch (error) {
    console.error('Erro ao criar ações corretivas:', error);
    throw error;
  }
}

export function getPeridaEvistavelLabel(classification) {
  const labels = {
    'inevitavel': { text: 'Inevitável', color: 'bg-red-100 text-red-800', icon: '🔴' },
    'potencialmente_evitavel': { text: 'Potencialmente Evitável', color: 'bg-yellow-100 text-yellow-800', icon: '🟡' },
    'evitavel': { text: 'Evitável', color: 'bg-green-100 text-green-800', icon: '🟢' }
  };
  
  return labels[classification] || labels.potencialmente_evitavel;
}