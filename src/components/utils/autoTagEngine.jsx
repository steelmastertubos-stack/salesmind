/**
 * Auto Tag Engine - Calcula tags automáticas baseadas no histórico do cliente
 */

/**
 * Calcula tags automáticas para um cliente
 * @param {Object} client - Cliente
 * @param {Array} orders - Todos os pedidos (para calcular percentis)
 * @param {Array} clientOrders - Pedidos do cliente específico
 * @returns {Array} Tags automáticas
 */
export function calculateAutoTags(client, allOrders, clientOrders) {
  const tags = [];
  const now = new Date();

  // Dados agregados do cliente
  const totalRevenue = clientOrders.reduce((sum, o) => sum + (o.total_value || 0), 0);
  const avgTicket = client.average_ticket || (totalRevenue / (clientOrders.length || 1));
  const purchaseCount = clientOrders.length;

  // Calcular percentil 80 do faturamento (top 20%)
  const allRevenues = {};
  allOrders.forEach(order => {
    if (!allRevenues[order.client_id]) allRevenues[order.client_id] = 0;
    allRevenues[order.client_id] += order.total_value || 0;
  });
  const revenueValues = Object.values(allRevenues).sort((a, b) => b - a);
  const top20Threshold = revenueValues[Math.floor(revenueValues.length * 0.2)] || 50000;

  // Calcular ticket médio geral
  const allTickets = Object.entries(allRevenues).map(([clientId, rev]) => {
    const ordersByClient = allOrders.filter(o => o.client_id === clientId);
    return rev / (ordersByClient.length || 1);
  });
  const avgTicketGeral = allTickets.reduce((a, b) => a + b, 0) / (allTickets.length || 1);

  // 🟢 Cliente Premium
  if (
    totalRevenue >= top20Threshold ||
    avgTicket > avgTicketGeral * 1.5 ||
    totalRevenue >= 100000
  ) {
    tags.push('Cliente Premium');
  }

  // 🔵 Cliente Recorrente
  const uniqueMonths = new Set(
    clientOrders
      .filter(o => o.created_date)
      .map(o => {
        const date = new Date(o.created_date);
        return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      })
  );

  if (purchaseCount >= 3 && uniqueMonths.size >= 3) {
    tags.push('Cliente Recorrente');
  }

  // 🟡 Cliente Ativo
  const lastPurchaseDate = client.last_purchase_date ? new Date(client.last_purchase_date) : null;
  const daysSinceLastPurchase = lastPurchaseDate 
    ? Math.floor((now - lastPurchaseDate) / (1000 * 60 * 60 * 24))
    : 999;

  const lastContactDate = client.last_contact_date ? new Date(client.last_contact_date) : null;
  const daysSinceContact = lastContactDate
    ? Math.floor((now - lastContactDate) / (1000 * 60 * 60 * 24))
    : 999;

  if (daysSinceLastPurchase <= 60 || daysSinceContact <= 60) {
    tags.push('Cliente Ativo');
  }

  // 🔴 Cliente em Risco / Inativo
  if (daysSinceLastPurchase >= 120) {
    tags.push('Cliente Inativo');
  } else if (daysSinceLastPurchase >= 90 && daysSinceContact >= 90) {
    tags.push('Cliente em Risco');
  }

  // Tag de Alto Ticket
  if (avgTicket > avgTicketGeral * 2) {
    tags.push('Alto Ticket');
  }

  // Tag de Comprador Frequente
  if (purchaseCount >= 5) {
    tags.push('Comprador Frequente');
  }

  return tags;
}

/**
 * Recalcula tags automáticas para todos os clientes
 */
export async function recalculateAllAutoTags(clients, orders, base44Instance) {
  const updates = [];

  for (const client of clients) {
    const clientOrders = orders.filter(o => o.client_id === client.id);
    const autoTags = calculateAutoTags(client, orders, clientOrders);

    // Apenas atualizar se as tags mudaram
    const currentAutoTags = client.auto_tags || [];
    const tagsChanged = 
      autoTags.length !== currentAutoTags.length ||
      autoTags.some(tag => !currentAutoTags.includes(tag));

    if (tagsChanged) {
      updates.push({
        id: client.id,
        data: {
          auto_tags: autoTags,
          tags_last_updated: new Date().toISOString()
        }
      });
    }
  }

  return updates;
}