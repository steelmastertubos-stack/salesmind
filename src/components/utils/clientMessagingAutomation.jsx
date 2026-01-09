import { base44 } from '@/api/base44Client';

export const analyzeClientForMessaging = async (client, orders) => {
  if (!client || !orders || orders.length === 0) {
    return null;
  }

  // Verificar se está atrasado (7+ dias sem comprar)
  const lastOrder = orders[0];
  const lastPurchaseDate = new Date(lastOrder?.created_date);
  const today = new Date();
  const daysSincePurchase = Math.floor((today - lastPurchaseDate) / (1000 * 60 * 60 * 24));
  const isOverdue = daysSincePurchase >= 7;

  // Verificar ciclo de compra
  const avgCycle = client.average_purchase_cycle || 30;
  const predictedNextPurchase = new Date(lastPurchaseDate);
  predictedNextPurchase.setDate(predictedNextPurchase.getDate() + avgCycle);
  const isNearCycle = daysSincePurchase >= (avgCycle - 7);

  if (!isOverdue && !isNearCycle) {
    return null;
  }

  // Extrair últimos produtos comprados
  const lastProducts = orders
    .slice(0, 3)
    .flatMap(o => o.items?.map(i => i.product_name) || [])
    .filter((v, i, a) => a.indexOf(v) === i)
    .slice(0, 3)
    .join(', ');

  const shouldMessage = {
    isOverdue,
    isNearCycle,
    daysSincePurchase,
    lastProducts,
    clientName: client.trade_name || client.company_name,
    avgCycle
  };

  return shouldMessage;
};

export const generateClientMessages = async (client, shouldMessage) => {
  if (!shouldMessage) {
    return null;
  }

  const { clientName, lastProducts, daysSincePurchase, avgCycle, isOverdue, isNearCycle } = shouldMessage;

  let context = '';
  if (isOverdue) {
    context = `O cliente ${clientName} está há ${daysSincePurchase} dias sem comprar (passou do ciclo de ${avgCycle} dias). `;
  } else if (isNearCycle) {
    context = `O cliente ${clientName} está próximo do seu ciclo de compra (${daysSincePurchase} de ${avgCycle} dias). `;
  }

  const prompt = `Gere 2 mensagens para o cliente B2B "${clientName}":

Contexto: ${context}
Últimos produtos comprados: ${lastProducts}

1. MENSAGEM WHATSAPP (descontraída, alegre, 2-3 linhas, sem excesso de emojis, tom coloquial):
   - Refira os produtos que ele costuma comprar
   - Mencione que pode ajudá-lo com os mesmos ou similares
   - Termine com chamada para ação casual

2. MENSAGEM EMAIL (formal, profissional, 3-4 linhas, tom comercial):
   - Comece com saudação formal
   - Mencione os produtos que ele costuma comprar
   - Ofereça disponibilidade para cotação
   - Termine profissionalmente

Responda em JSON com as chaves: whatsapp_message e email_message`;

  try {
    const result = await base44.integrations.Core.InvokeLLM({
      prompt,
      response_json_schema: {
        type: "object",
        properties: {
          whatsapp_message: { type: "string" },
          email_message: { type: "string" }
        }
      }
    });

    return {
      whatsapp: result.whatsapp_message,
      email: result.email_message,
      ...shouldMessage
    };
  } catch (error) {
    console.error('Error generating messages:', error);
    return null;
  }
};

export const formatMessageContext = (shouldMessage) => {
  if (!shouldMessage) return null;

  const { isOverdue, isNearCycle, daysSincePurchase, avgCycle } = shouldMessage;

  if (isOverdue) {
    return {
      type: 'overdue',
      label: `⚠️ ${daysSincePurchase} dias sem comprar`,
      description: `Passou do ciclo de ${avgCycle} dias`,
      color: 'bg-red-100 text-red-700 border-red-200'
    };
  }

  if (isNearCycle) {
    return {
      type: 'near_cycle',
      label: '📅 Próximo do ciclo',
      description: `${daysSincePurchase}/${avgCycle} dias`,
      color: 'bg-amber-100 text-amber-700 border-amber-200'
    };
  }

  return null;
};