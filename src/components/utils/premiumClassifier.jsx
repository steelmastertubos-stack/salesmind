/**
 * 🏆 CLASSIFICADOR DE CLIENTE PREMIUM
 * Sistema derivado que atualiza is_premium baseado em regras comerciais
 * 
 * REGRAS OBRIGATÓRIAS:
 * ✓ status = Ativo (exclusivo)
 * ✓ ≥ 3 compras em meses distintos no ano
 * ✓ ticket_medio ≥ threshold
 * ✓ dias_desde_ultima_compra dentro do ciclo médio
 * 
 * Se virar Inativo → remove is_premium automaticamente
 */

import { base44 } from '@/api/base44Client';

const DEFAULT_TICKET_THRESHOLD = 50000;
const MIN_RECURRENT_MONTHS = 3;

export async function recalculatePremiumClients(year = 2025, ticketThreshold = DEFAULT_TICKET_THRESHOLD) {
  try {
    console.log(`🏆 Recalculando clientes Premium para ${year}...`);
    
    const [clients, orders] = await Promise.all([
      base44.entities.Client.list('company_name', 1000),
      base44.entities.Order.list('-created_date', 5000)
    ]);

    const results = {
      promoted: [],
      demoted: [],
      unchanged: 0
    };

    for (const client of clients) {
      const result = await evaluatePremiumStatus(client, orders, year, ticketThreshold);
      
      if (result.changed) {
        if (result.is_premium) {
          results.promoted.push({ id: client.id, name: client.company_name, ...result.metrics });
        } else {
          results.demoted.push({ id: client.id, name: client.company_name, reason: result.reason });
        }
      } else {
        results.unchanged++;
      }
    }

    console.log('✅ Recálculo Premium concluído:', results);
    return results;
  } catch (error) {
    console.error('❌ Erro ao recalcular Premium:', error);
    throw error;
  }
}

export async function evaluatePremiumStatus(client, allOrders, year, ticketThreshold = DEFAULT_TICKET_THRESHOLD) {
  try {
    const previousPremium = client.is_premium || false;

    // REGRA 1: Cliente Inativo NUNCA pode ser Premium
    if (client.status === 'inactive') {
      if (previousPremium) {
        await removePremium(client, year);
        return { 
          changed: true, 
          is_premium: false, 
          reason: 'Cliente ficou inativo',
          action: 'removed'
        };
      }
      return { changed: false, is_premium: false, reason: 'Cliente inativo' };
    }

    // Filtrar pedidos do cliente no ano
    const clientOrders = allOrders.filter(o => {
      if (o.client_id !== client.id) return false;
      const date = new Date(o.created_date);
      return date.getFullYear() === year;
    });

    if (clientOrders.length === 0) {
      if (previousPremium) {
        await removePremium(client, year);
        return { changed: true, is_premium: false, reason: 'Sem compras no ano' };
      }
      return { changed: false, is_premium: false };
    }

    // REGRA 2: Recorrência (3+ meses distintos)
    const monthsWithPurchase = new Set(
      clientOrders.map(o => new Date(o.created_date).getMonth())
    );
    const isRecurrent = monthsWithPurchase.size >= MIN_RECURRENT_MONTHS;

    // REGRA 3: Ticket médio alto
    const revenue = clientOrders.reduce((sum, o) => sum + (o.total_value || 0), 0);
    const avgTicket = revenue / clientOrders.length;
    const hasHighTicket = avgTicket >= ticketThreshold;

    // REGRA 4: Dentro do ciclo médio
    const lastOrder = clientOrders.sort((a, b) => 
      new Date(b.created_date) - new Date(a.created_date)
    )[0];
    
    const daysSince = Math.floor((new Date() - new Date(lastOrder.created_date)) / (1000 * 60 * 60 * 24));
    const avgCycle = client.average_purchase_cycle || 30;
    const withinCycle = daysSince <= avgCycle;

    // CLASSIFICAÇÃO FINAL: Ativo + Recorrente + Ticket Alto + Dentro do Ciclo
    const shouldBePremium = (
      client.status === 'active' &&
      isRecurrent &&
      hasHighTicket &&
      withinCycle
    );

    // Aplicar mudança se necessário
    if (shouldBePremium !== previousPremium) {
      if (shouldBePremium) {
        await promoteToPremium(client, year, { revenue, avgTicket, monthsActive: monthsWithPurchase.size });
      } else {
        await removePremium(client, year);
      }

      return {
        changed: true,
        is_premium: shouldBePremium,
        metrics: { revenue, avgTicket, monthsActive: monthsWithPurchase.size, daysSince },
        action: shouldBePremium ? 'promoted' : 'demoted'
      };
    }

    return { 
      changed: false, 
      is_premium: shouldBePremium,
      metrics: { revenue, avgTicket, monthsActive: monthsWithPurchase.size, daysSince }
    };
  } catch (error) {
    console.error('❌ Erro em evaluatePremiumStatus:', error);
    throw error;
  }
}

async function promoteToPremium(client, year, metrics) {
  const historicalTag = `Premium - ${year}`;
  const existingTags = client.auto_tags || [];
  const newTags = existingTags.includes(historicalTag) ? existingTags : [...existingTags, historicalTag];

  await base44.entities.Client.update(client.id, {
    is_premium: true,
    premium_since: new Date().toISOString().split('T')[0],
    premium_year: year,
    auto_tags: newTags,
    tags_last_updated: new Date().toISOString()
  });

  console.log(`⭐ Cliente promovido a Premium: ${client.company_name}`, metrics);
}

async function removePremium(client, year) {
  const historicalTag = `Premium - ${year}`;
  const existingTags = client.auto_tags || [];
  
  // Manter apenas tag histórica
  const newTags = existingTags.includes(historicalTag) ? existingTags : [...existingTags, historicalTag];

  await base44.entities.Client.update(client.id, {
    is_premium: false,
    auto_tags: newTags,
    tags_last_updated: new Date().toISOString()
  });

  console.log(`📉 Cliente removido de Premium: ${client.company_name} (histórico mantido)`);
}

export default {
  recalculatePremiumClients,
  evaluatePremiumStatus
};