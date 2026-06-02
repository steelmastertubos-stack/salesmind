// ============================================================
// SALESMIND DEMO - DATA GENERATORS
// Funções puras de geração de dados fictícios
// ============================================================
import { STATES_CITIES, CLIENT_NAMES_BY_SEGMENT, SEGMENTS, MONTHLY_TARGETS, PRODUCT_SPECS, LOSS_REASONS } from './masterData';

// Seed-based random para reprodutibilidade
let seed = 42;
export const rand = (s = 0, e = 1) => {
  seed = (seed * 9301 + 49297) % 233280;
  return s + (seed / 233280) * (e - s);
};
export const randInt = (s, e) => Math.floor(rand(s, e + 1));
export const pick = (arr) => arr[randInt(0, arr.length - 1)];
export const pickN = (arr, n) => {
  const shuffled = [...arr];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = randInt(0, i);
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled.slice(0, n);
};

export const resetSeed = () => { seed = 42; };

// Gera datas distribuídas ao longo do ano
export const dateInMonth = (year, month, dayMin = 1, dayMax = 28) => {
  const day = randInt(dayMin, dayMax);
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
};

// Pesos sazonais
export const SEASONAL_WEIGHT = {
  1: 0.7, 2: 0.8, 3: 0.95, 4: 1.05, 5: 1.2,
  6: 1.25, 7: 1.35, 8: 1.45, 9: 1.55, 10: 1.65, 11: 1.30, 12: 0.90
};

export const generateCNPJ = (idx) => {
  const n = String(idx + 1000).padStart(8, '0');
  return `${n.slice(0,2)}.${n.slice(2,5)}.${n.slice(5,8)}/0001-${String(randInt(10,99))}`;
};

export const generatePhone = () => {
  const ddd = pick(['11','12','13','14','15','19','21','31','41','47','48','51','47','62','65','66','71','81','85']);
  return `(${ddd}) ${randInt(90000, 99999)}-${randInt(1000, 9999)}`;
};

export const generateEmail = (name, domain) => {
  const slug = name.toLowerCase()
    .replace(/[áàãâ]/g, 'a').replace(/[éê]/g, 'e').replace(/[íî]/g, 'i')
    .replace(/[óõô]/g, 'o').replace(/[úû]/g, 'u').replace(/[ç]/g, 'c')
    .replace(/[^a-z0-9]/g, '').slice(0, 20);
  return `contato@${slug}.com.br`;
};

// Gera 200 clientes fictícios distribuídos por segmento e região
export const generateClients = () => {
  resetSeed();
  const clients = [];
  const stateEntries = Object.entries(STATES_CITIES);
  let cnpjIdx = 0;

  // Distribuição de clientes por segmento
  const segmentDistribution = {
    'Estruturas Metálicas': 25, 'Metalúrgica': 22, 'Caldeiraria': 18,
    'Implemento Rodoviário': 15, 'Metalmecânica': 20, 'Construtoras': 18,
    'Serralheria': 15, 'Agroindústria': 15, 'Engenharia': 12,
    'Óleo & Gás': 8, 'Mineração': 8, 'Energia': 10, 'Papel e Celulose': 8,
  };

  for (const [segment, count] of Object.entries(segmentDistribution)) {
    const names = CLIENT_NAMES_BY_SEGMENT[segment] || [];
    for (let i = 0; i < count; i++) {
      const [state, cities] = stateEntries[cnpjIdx % stateEntries.length];
      const city = pick(cities);
      const baseName = names[i % names.length];
      const suffix = i >= names.length ? ` ${i - names.length + 2}` : '';
      const company_name = baseName + suffix;

      // Distribuição de tickets - curva ABC
      const tier = cnpjIdx < 20 ? 'A' : cnpjIdx < 60 ? 'B' : 'C';
      const baseTicket = tier === 'A' ? rand(80000, 200000) : tier === 'B' ? rand(20000, 80000) : rand(3000, 20000);

      // Datas de última compra para simular risco
      const daysSinceLastPurchase = cnpjIdx < 150
        ? randInt(1, 45)
        : cnpjIdx < 170
        ? randInt(46, 90)
        : cnpjIdx < 185
        ? randInt(91, 150)
        : randInt(151, 200);

      const lastPurchaseDate = new Date('2025-12-31');
      lastPurchaseDate.setDate(lastPurchaseDate.getDate() - daysSinceLastPurchase);

      const totalPurchases = Math.round(baseTicket * randInt(3, 15));

      clients.push({
        company_name,
        trade_name: company_name,
        cnpj: generateCNPJ(cnpjIdx),
        segment,
        state,
        city,
        address: `Rua Industrial, ${randInt(100, 9999)}`,
        zip_code: `${randInt(10000, 99999)}-${randInt(100, 999)}`,
        phone: generatePhone(),
        whatsapp: generatePhone(),
        email: generateEmail(company_name, state.toLowerCase()),
        contact_name: pick(['João Silva', 'Maria Santos', 'Carlos Oliveira', 'Ana Costa', 'Roberto Lima', 'Fernanda Alves', 'Paulo Souza', 'Juliana Ferreira', 'Ricardo Pereira', 'Camila Rodrigues', 'Marcelo Araújo', 'Patrícia Nascimento', 'Gustavo Martins', 'Renata Castro']),
        contact_role: pick(['Gerente de Compras', 'Diretor Industrial', 'Supervisor de Produção', 'Comprador', 'Engenheiro de Manutenção', 'Gerente Industrial', 'Proprietário']),
        average_ticket: Math.round(baseTicket),
        total_purchases: totalPurchases,
        purchase_count: randInt(3, 18),
        last_purchase_date: lastPurchaseDate.toISOString().split('T')[0],
        average_purchase_cycle: randInt(25, 60),
        status: daysSinceLastPurchase > 90 ? 'at_risk' : 'active',
        opportunity_index: tier === 'A' ? randInt(70, 95) : tier === 'B' ? randInt(40, 70) : randInt(10, 40),
        is_active: true,
        is_premium: tier === 'A' && daysSinceLastPurchase < 30,
      });
      cnpjIdx++;
    }
  }
  return clients;
};

// Gera produtos
export const generateProducts = (principalIds) => {
  resetSeed();
  const products = [];
  PRODUCT_SPECS.forEach((spec, idx) => {
    const principal = principalIds[idx % principalIds.length];
    products.push({
      principal_id: principal,
      code: spec.code,
      name: spec.name,
      category: spec.cat,
      unit: 'kg',
      base_price_per_kg: parseFloat(spec.price.toFixed(2)),
      cost_per_kg: parseFloat((spec.price * 0.78).toFixed(2)),
      factor_6m: spec.factor,
      weight_per_meter: parseFloat((spec.factor / 6).toFixed(3)),
      ipi_rate: spec.cat === 'chapas' ? 0 : 5,
      stock_quantity: randInt(5000, 50000),
      min_quantity: randInt(100, 500),
      is_active: true,
      is_imported: rand() < 0.1,
    });
  });
  return products;
};

// Gera orçamentos e pedidos com sazonalidade
export const generateOrdersAndQuotes = (clients, products, principals, year = 2025) => {
  resetSeed();
  const orders = [];
  const quotes = [];
  const opportunities = [];
  const lostDeals = [];
  const commissions = [];

  const productList = products.filter(p => p.is_active);
  const principalMap = {};
  principals.forEach(p => { principalMap[p.id] = p; });

  let orderCounter = 1;
  let quoteCounter = 1;
  let oppCounter = 1;

  for (let month = 1; month <= 12; month++) {
    const target = MONTHLY_TARGETS[month];
    const weight = SEASONAL_WEIGHT[month];

    // Número de pedidos proporcionais ao target
    const numOrders = Math.round((target / 25000) * (0.85 + rand() * 0.3));

    for (let i = 0; i < numOrders; i++) {
      const client = clients[randInt(0, clients.length - 1)];
      if (!client || !client.id) continue;

      const principal = principals[randInt(0, principals.length - 1)];
      if (!principal || !principal.id) continue;

      // Selecionar produtos para o pedido (2-5 itens)
      const numItems = randInt(2, 5);
      const selectedProducts = pickN(productList, numItems);
      const items = [];
      let totalValue = 0;
      let totalWeight = 0;

      selectedProducts.forEach(product => {
        if (!product) return;
        const qty = randInt(200, 3000);
        const price = product.base_price_per_kg * (0.90 + rand() * 0.20);
        const total = qty * price;
        totalValue += total;
        totalWeight += qty;
        items.push({
          product_id: product.id || '',
          product_code: product.code,
          product_name: product.name,
          quantity: qty,
          unit: 'kg',
          weight: qty,
          unit_price: parseFloat(price.toFixed(2)),
          unit_cost: product.cost_per_kg || parseFloat((price * 0.78).toFixed(2)),
          total_price: parseFloat(total.toFixed(2)),
          total_cost: parseFloat((qty * (product.cost_per_kg || price * 0.78)).toFixed(2)),
        });
      });

      if (items.length === 0) continue;

      const orderDate = dateInMonth(year, month);
      const commRate = principal.commission_percentage || 3.5;
      const expectedComm = totalValue * (commRate / 100);

      // Status baseado no mês (mais recentes = mais novos status)
      let orderStatus;
      if (month <= 6) {
        orderStatus = pick(['faturado', 'entregue', 'faturado', 'entregue']);
      } else if (month <= 9) {
        orderStatus = pick(['faturado', 'entregue', 'confirmado', 'em_producao']);
      } else if (month === 10) {
        orderStatus = pick(['faturado', 'confirmado', 'em_producao', 'aberto']);
      } else {
        orderStatus = pick(['confirmado', 'em_producao', 'aberto', 'aberto']);
      }

      const isFaturado = ['faturado', 'entregue'].includes(orderStatus);

      const order = {
        order_number: `PED-${String(orderCounter++).padStart(5, '0')}`,
        client_id: client.id,
        client_name: client.company_name,
        principal_id: principal.id,
        principal_name: principal.trade_name || principal.company_name,
        items,
        total_value: parseFloat(totalValue.toFixed(2)),
        total_weight: totalWeight,
        total_weight_kg: totalWeight,
        commission_rate: commRate,
        expected_commission: parseFloat(expectedComm.toFixed(2)),
        commission_status: isFaturado ? pick(['invoiced', 'paid', 'paid', 'paid']) : 'pending',
        status: orderStatus,
        billing_date: isFaturado ? orderDate : null,
        invoice_number: isFaturado ? `NF-${randInt(10000, 99999)}` : null,
        invoice_date: isFaturado ? orderDate : null,
        invoiced_value: isFaturado ? parseFloat(totalValue.toFixed(2)) : null,
        notes: null,
        payment_terms: pick(['30 dias', '28/35 dias', '30/60 dias', '30/45/60 dias']),
        created_date: orderDate,
      };

      orders.push(order);

      // Criar comissão vinculada
      const commStatus = isFaturado
        ? (month <= 9 ? 'recebida' : month <= 10 ? 'a_receber' : 'a_receber')
        : 'prevista';

      commissions.push({
        principal_id: principal.id,
        principal_name: principal.trade_name || principal.company_name,
        client_id: client.id,
        client_name: client.company_name,
        order_id: null, // será vinculado após criação
        order_number: order.order_number,
        sales_value: parseFloat(totalValue.toFixed(2)),
        commission_rate: commRate,
        commission_total_value: parseFloat(expectedComm.toFixed(2)),
        commission_value: parseFloat(expectedComm.toFixed(2)),
        status: commStatus,
        invoice_date: isFaturado ? orderDate : null,
        invoice_value: isFaturado ? parseFloat(totalValue.toFixed(2)) : null,
        payment_due_date: isFaturado ? addDays(orderDate, principal.payment_day || 30) : null,
        payment_date: commStatus === 'recebida' ? addDays(orderDate, (principal.payment_day || 30) + randInt(-5, 5)) : null,
      });
    }

    // Gerar cotações e oportunidades perdidas
    const numQuotes = Math.round(numOrders * 0.45);
    for (let i = 0; i < numQuotes; i++) {
      const client = clients[randInt(0, clients.length - 1)];
      if (!client || !client.id) continue;
      const principal = principals[randInt(0, principals.length - 1)];
      if (!principal || !principal.id) continue;

      const numItems = randInt(1, 3);
      const selectedProducts = pickN(productList, numItems);
      let totalValue = 0;
      const items = [];

      selectedProducts.forEach(product => {
        if (!product) return;
        const qty = randInt(100, 2000);
        const price = product.base_price_per_kg * (0.88 + rand() * 0.24);
        totalValue += qty * price;
        items.push({
          product_id: product.id || '',
          product_name: product.name,
          product_code: product.code,
          quantity: qty,
          unit: 'kg',
          unit_price: parseFloat(price.toFixed(2)),
          item_total: parseFloat((qty * price).toFixed(2)),
        });
      });

      const quoteDate = dateInMonth(year, month);
      const isLost = rand() < 0.3;
      const isOpen = !isLost && rand() < (month >= 10 ? 0.8 : 0.3);

      let quoteStatus = 'rascunho';
      if (isLost) quoteStatus = 'cancelado';
      else if (!isOpen) quoteStatus = 'convertido';
      else if (month <= 8) quoteStatus = 'enviado';
      else quoteStatus = pick(['enviado', 'rascunho', 'emitido']);

      const quote = {
        quote_number: `ORC-${String(quoteCounter++).padStart(5, '0')}`,
        client_id: client.id,
        client_name: client.company_name,
        principal_id: principal.id,
        principal_name: principal.trade_name || principal.company_name,
        items,
        total_value: parseFloat(totalValue.toFixed(2)),
        status: quoteStatus,
        sent_date: quoteDate,
        notes: null,
      };
      quotes.push(quote);

      // Oportunidade se enviado/ganho/perdido
      if (['enviado', 'convertido', 'cancelado'].includes(quoteStatus)) {
        const stage = quoteStatus === 'convertido' ? 'ganho' : quoteStatus === 'cancelado' ? 'perdido' : isOpen ? pick(['proposta_enviada', 'em_negociacao']) : 'ganho';

        opportunities.push({
          client_id: client.id,
          client_name: client.company_name,
          principal_id: principal.id,
          principal_name: principal.trade_name || principal.company_name,
          value_estimated: parseFloat(totalValue.toFixed(2)),
          stage,
          next_action_date: stage === 'proposta_enviada' || stage === 'em_negociacao' ? addDays(quoteDate, randInt(3, 15)) : null,
          last_contact_date: quoteDate,
          risk_level: rand() < 0.2 ? 'high' : rand() < 0.4 ? 'medium' : 'low',
          notes: null,
        });

        if (stage === 'perdido') {
          lostDeals.push({
            opportunity_id: null,
            client_id: client.id,
            client_name: client.company_name,
            deal_value: parseFloat(totalValue.toFixed(2)),
            motivo_primario: pick(LOSS_REASONS),
            loss_date: quoteDate,
            etapa_perda: pick(['proposta_enviada', 'em_negociacao']),
          });
        }
      }
    }
  }

  return { orders, quotes, opportunities, lostDeals, commissions };
};

// Gera tarefas pendentes (futuro/presente)
export const generateTasks = (clients) => {
  resetSeed();
  const tasks = [];
  const today = new Date('2026-06-02');

  for (let i = 0; i < 30; i++) {
    const client = clients[randInt(0, clients.length - 1)];
    if (!client || !client.id) continue;
    const daysOffset = randInt(-5, 20);
    const taskDate = new Date(today);
    taskDate.setDate(taskDate.getDate() + daysOffset);

    tasks.push({
      title: pick([
        `Follow-up com ${client.company_name}`,
        `Ligar para ${client.contact_name || client.company_name}`,
        `Enviar proposta para ${client.company_name}`,
        `Verificar pedido em aberto - ${client.company_name}`,
        `Reunião com ${client.company_name}`,
        `Negociação com ${client.company_name}`,
      ]),
      task_type: pick(['call', 'follow_up', 'email', 'meeting', 'reminder']),
      client_id: client.id,
      client_name: client.company_name,
      scheduled_date: taskDate.toISOString().split('T')[0],
      scheduled_time: `${randInt(8, 17)}:${pick(['00', '30'])}`,
      status: daysOffset < -2 ? 'pending' : 'pending',
      priority: pick(['high', 'medium', 'medium', 'low']),
    });
  }
  return tasks;
};

// Helper: adicionar dias a uma data string
const addDays = (dateStr, days) => {
  if (!dateStr) return null;
  const d = new Date(dateStr);
  d.setDate(d.getDate() + (days || 30));
  return d.toISOString().split('T')[0];
};