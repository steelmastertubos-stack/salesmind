/**
 * Motor de Alertas Inteligentes
 * Calcula alertas, scores e priorização de clientes
 */

/**
 * Calcula o ciclo médio de compras do cliente
 */
export function calculateAverageCycle(orders, clientId) {
  const clientOrders = orders
    .filter(o => o.client_id === clientId && o.status !== 'cancelado')
    .sort((a, b) => new Date(a.created_date) - new Date(b.created_date));

  if (clientOrders.length < 2) return null;

  const intervals = [];
  for (let i = 1; i < clientOrders.length; i++) {
    const prev = new Date(clientOrders[i - 1].created_date);
    const curr = new Date(clientOrders[i].created_date);
    const days = Math.floor((curr - prev) / (1000 * 60 * 60 * 24));
    intervals.push(days);
  }

  return Math.round(intervals.reduce((sum, days) => sum + days, 0) / intervals.length);
}

/**
 * Calcula dias desde a última compra
 */
export function daysSinceLastPurchase(lastPurchaseDate) {
  if (!lastPurchaseDate) return Infinity;
  return Math.floor((new Date() - new Date(lastPurchaseDate)) / (1000 * 60 * 60 * 24));
}

/**
 * Calcula ticket médio do cliente
 */
export function calculateAverageTicket(orders, clientId) {
  const clientOrders = orders.filter(o => o.client_id === clientId && o.status !== 'cancelado');
  if (clientOrders.length === 0) return 0;
  
  const total = clientOrders.reduce((sum, o) => sum + (o.total_value || 0), 0);
  return total / clientOrders.length;
}

/**
 * Calcula produto mais comprado
 */
export function getMostPurchasedProduct(orders, clientId) {
  const clientOrders = orders.filter(o => o.client_id === clientId && o.status !== 'cancelado');
  const productCounts = {};

  clientOrders.forEach(order => {
    order.items?.forEach(item => {
      const key = item.product_name || item.product_code;
      if (!productCounts[key]) {
        productCounts[key] = { name: key, count: 0, totalValue: 0 };
      }
      productCounts[key].count += item.quantity || 1;
      productCounts[key].totalValue += item.item_total || 0;
    });
  });

  const products = Object.values(productCounts);
  return products.sort((a, b) => b.totalValue - a.totalValue)[0] || null;
}

/**
 * Determina tipo de alerta do cliente
 */
export function getAlertType(client, orders) {
  // Se não tem última compra, não gera alerta
  if (!client.last_purchase_date) return null;
  
  const avgCycle = calculateAverageCycle(orders, client.id) || client.average_purchase_cycle || 30;
  const daysSince = daysSinceLastPurchase(client.last_purchase_date);

  // INACTIVE: 60+ dias sem comprar
  if (daysSince >= 60) return 'INACTIVE';

  // RISK: passou do ciclo médio
  if (daysSince > avgCycle) return 'RISK';

  // ATTENTION: entre 85% do ciclo e o ciclo completo
  if (daysSince >= avgCycle * 0.85 && daysSince <= avgCycle) return 'ATTENTION';

  return null;
}

/**
 * Calcula score de prioridade (0-100)
 */
export function calculatePriorityScore(client, orders) {
  const avgCycle = calculateAverageCycle(orders, client.id) || client.average_purchase_cycle || 30;
  const daysSince = daysSinceLastPurchase(client.last_purchase_date);
  const avgTicket = calculateAverageTicket(orders, client.id) || client.average_ticket || 0;

  // Fator de atraso (quanto mais atrasado, maior o score)
  const delayFactor = Math.max(0, daysSince - avgCycle);
  
  // Fator de valor (quanto maior o ticket, maior o score)
  const ticketFactor = avgTicket / 1000;

  // Score final (0-100)
  let score = Math.min(100, delayFactor + ticketFactor);

  // Boost se estiver muito atrasado
  if (daysSince > avgCycle * 1.5) score = Math.min(100, score * 1.5);

  return Math.round(score);
}

/**
 * Processa alertas de todos os clientes
 */
export function processClientAlerts(clients, orders) {
  return clients.map(client => {
    const alertType = getAlertType(client, orders);
    const avgCycle = calculateAverageCycle(orders, client.id) || client.average_purchase_cycle || 30;
    const daysSince = daysSinceLastPurchase(client.last_purchase_date);
    const avgTicket = calculateAverageTicket(orders, client.id) || client.average_ticket || 0;
    const priorityScore = calculatePriorityScore(client, orders);
    const mostPurchased = getMostPurchasedProduct(orders, client.id);

    return {
      ...client,
      alertType,
      avgCycle,
      daysSince,
      avgTicket,
      priorityScore,
      mostPurchased,
      delay: Math.max(0, daysSince - avgCycle)
    };
  }).filter(c => c.alertType); // Só clientes com alerta
}

/**
 * Filtra clientes por tipo de alerta
 */
export function filterByAlertType(processedClients, alertType) {
  return processedClients
    .filter(c => c.alertType === alertType)
    .sort((a, b) => b.priorityScore - a.priorityScore);
}

/**
 * Substitui variáveis em templates
 */
export function replaceTemplateVariables(template, data) {
  let message = template;
  
  message = message.replace(/{NOME}/g, data.contactName || 'Cliente');
  message = message.replace(/{EMPRESA}/g, data.companyName || '');
  message = message.replace(/{DIAS}/g, data.days || '');
  message = message.replace(/{CICLO}/g, data.cycle || '');
  message = message.replace(/{ITEM}/g, data.productName || '');
  message = message.replace(/{VALOR}/g, data.value || '');
  message = message.replace(/{VENDEDOR}/g, data.salesPerson || '');

  return message;
}