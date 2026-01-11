/**
 * SalesMind Insights Engine
 * Gera insights acionáveis baseados em dados reais de clientes
 */

export function generateActionableInsights(clients, orders, quotes, opportunities) {
  const insights = [];
  const now = new Date();

  clients.forEach(client => {
    if (!client.last_purchase_date) return;

    const clientOrders = orders.filter(o => o.client_id === client.id);
    const clientQuotes = quotes.filter(q => q.client_id === client.id && q.status !== 'convertido' && q.status !== 'cancelado');
    const avgCycle = client.average_purchase_cycle || 30;
    const daysSince = Math.floor((now - new Date(client.last_purchase_date)) / (1000 * 60 * 60 * 24));
    const avgTicket = client.average_ticket || 0;
    const lastPurchaseValue = client.last_purchase_value || 0;

    // 1. JANELA DE RECOMPRA ABERTA (85-100% do ciclo)
    if (daysSince >= avgCycle * 0.85 && daysSince <= avgCycle * 1.05) {
      insights.push({
        client_id: client.id,
        client_name: client.trade_name || client.company_name,
        title: '🎯 Janela de recompra aberta',
        what_is_happening: `${client.trade_name || client.company_name} está no momento ideal de compra (${daysSince} dias do ciclo de ${avgCycle})`,
        why_it_matters: `Cliente compra regularmente ${formatCurrency(avgTicket)}. Ação agora evita perda.`,
        recommended_action: {
          action_type: 'WHATSAPP',
          channel: 'WHATSAPP',
          best_time_window: '09:00-11:00'
        },
        message_template: {
          whatsapp_text: `Olá ${client.contact_name || 'Cliente'}! Vimos que geralmente você compra nesta época. Como estão os projetos aí? Podemos antecipar alguma demanda ou preparar um orçamento?`,
          call_script: `Cliente no ciclo. Perguntar: "Como andam os projetos?" e "Podemos ajudar com algo específico?"`,
          email_subject: `${client.trade_name || client.company_name} - Momento de nova compra?`,
          email_body: `Olá ${client.contact_name || 'Cliente'},\n\nNotamos que geralmente você compra nesta época.\nPodemos antecipar alguma demanda?\n\nAguardo seu retorno!`
        },
        explainability: [
          `• Última compra há ${daysSince} dias (ciclo médio: ${avgCycle} dias)`,
          `• Ticket médio: ${formatCurrency(avgTicket)}`,
          `• Segmento: ${client.segment || 'N/A'} | UF: ${client.state || 'N/A'}`
        ],
        priority_score: 85 + Math.min(15, Math.floor(avgTicket / 10000)),
        segment: client.segment,
        state: client.state
      });
    }

    // 2. ACIMA DO CICLO (RISCO)
    if (daysSince > avgCycle * 1.1 && daysSince < 60) {
      insights.push({
        client_id: client.id,
        client_name: client.trade_name || client.company_name,
        title: '⚠️ Cliente acima do ciclo',
        what_is_happening: `${client.trade_name || client.company_name} está ${daysSince - avgCycle} dias atrasado no ciclo de compra`,
        why_it_matters: `Risco de perda de ${formatCurrency(avgTicket)} em receita recorrente.`,
        recommended_action: {
          action_type: 'CALL',
          channel: 'CALL',
          best_time_window: '14:00-16:00'
        },
        message_template: {
          whatsapp_text: `${client.contact_name || 'Cliente'}, tudo bem? Faz tempo que não conversamos! Como estão os projetos aí? Precisam de algo específico?`,
          call_script: `Ligar perguntando como estão os projetos. Descobrir se há algum problema ou se competitor entrou.`,
          email_subject: `${client.trade_name || client.company_name} - Saudades de vocês!`,
          email_body: `Olá ${client.contact_name || 'Cliente'},\n\nFaz um tempo que não conversamos.\nTudo bem com os projetos?\n\nEstamos à disposição!`
        },
        explainability: [
          `• ${daysSince - avgCycle} dias acima do ciclo normal`,
          `• Última compra: ${formatCurrency(lastPurchaseValue)}`,
          `• Risco de migração para concorrente`
        ],
        priority_score: 75 + Math.min(20, Math.floor((daysSince - avgCycle) / 5)),
        segment: client.segment,
        state: client.state
      });
    }

    // 3. ORÇAMENTO PARADO (PIPELINE)
    if (clientQuotes.length > 0) {
      clientQuotes.forEach(quote => {
        const quoteAge = Math.floor((now - new Date(quote.created_date)) / (1000 * 60 * 60 * 24));
        if (quoteAge >= 7) {
          insights.push({
            client_id: client.id,
            client_name: client.trade_name || client.company_name,
            title: '📋 Orçamento parado',
            what_is_happening: `Orçamento ${quote.quote_number} parado há ${quoteAge} dias (${formatCurrency(quote.total_value || 0)})`,
            why_it_matters: `Pipeline de ${formatCurrency(quote.total_value || 0)} em risco de perda.`,
            recommended_action: {
              action_type: 'WHATSAPP',
              channel: 'WHATSAPP',
              best_time_window: '10:00-12:00'
            },
            message_template: {
              whatsapp_text: `${client.contact_name || 'Cliente'}, e o orçamento ${quote.quote_number}? Surgiu alguma dúvida? Posso ajustar prazo, condição ou especificação?`,
              call_script: `Perguntar sobre orçamento. Descobrir objeção. Oferecer ajuste se necessário.`,
              email_subject: `Orçamento ${quote.quote_number} - Alguma dúvida?`,
              email_body: `Olá ${client.contact_name || 'Cliente'},\n\nE o orçamento ${quote.quote_number}?\nPosso ajudar com alguma dúvida?\n\nEstou à disposição!`
            },
            explainability: [
              `• Orçamento parado há ${quoteAge} dias`,
              `• Valor: ${formatCurrency(quote.total_value || 0)}`,
              `• Probabilidade de fechamento cai 15% após 7 dias`
            ],
            priority_score: 70 + Math.min(25, Math.floor((quote.total_value || 0) / 50000)),
            segment: client.segment,
            state: client.state
          });
        }
      });
    }

    // 4. QUEDA DE TICKET (RISCO SILENCIOSO)
    if (clientOrders.length >= 2 && avgTicket > 0 && lastPurchaseValue < avgTicket * 0.7) {
      insights.push({
        client_id: client.id,
        client_name: client.trade_name || client.company_name,
        title: '📉 Queda no ticket médio',
        what_is_happening: `Última compra de ${formatCurrency(lastPurchaseValue)} está 30%+ abaixo do histórico (${formatCurrency(avgTicket)})`,
        why_it_matters: `Cliente pode estar comprando menos ou migrando volume para concorrente.`,
        recommended_action: {
          action_type: 'CALL',
          channel: 'CALL',
          best_time_window: '09:00-11:00'
        },
        message_template: {
          whatsapp_text: `${client.contact_name || 'Cliente'}, notei que as últimas compras foram menores. Está tudo ok? Podemos melhorar em algo?`,
          call_script: `Perguntar se houve mudança nos projetos. Descobrir se há insatisfação ou competitor.`,
          email_subject: `Tudo ok por aí?`,
          email_body: `Olá ${client.contact_name || 'Cliente'},\n\nNotei mudança no volume recente.\nQuer conversar sobre isso?\n\nEstou à disposição!`
        },
        explainability: [
          `• Última compra: ${formatCurrency(lastPurchaseValue)} vs média ${formatCurrency(avgTicket)}`,
          `• Queda de ${Math.round((1 - lastPurchaseValue/avgTicket) * 100)}%`,
          `• Pode indicar insatisfação ou concorrência`
        ],
        priority_score: 65 + Math.min(20, Math.floor(avgTicket / 20000)),
        segment: client.segment,
        state: client.state
      });
    }
  });

  // PRIORIZAÇÃO E DIVERSIDADE
  return insights
    .sort((a, b) => b.priority_score - a.priority_score)
    .reduce((acc, insight) => {
      const stateCount = acc.filter(i => i.state === insight.state).length;
      const segmentCount = acc.filter(i => i.segment === insight.segment).length;
      
      if (acc.length < 5 && stateCount < 2 && segmentCount < 2) {
        acc.push(insight);
      } else if (acc.length < 5) {
        acc.push(insight);
      }
      
      return acc;
    }, [])
    .slice(0, 5);
}

function formatCurrency(value) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(value || 0);
}