import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, Loader2, AlertCircle, Zap } from 'lucide-react';
import { toast } from 'sonner';

export default function Generate2025DataPage() {
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentStep, setCurrentStep] = useState('');
  const [results, setResults] = useState(null);
  const [logs, setLogs] = useState([]);

  const addLog = (message, type = 'info') => {
    setLogs(prev => [...prev, { message, type, time: new Date().toLocaleTimeString() }]);
  };

  const generate2025Data = async () => {
    setIsGenerating(true);
    setProgress(0);
    setResults(null);
    setLogs([]);

    try {
      addLog('🚀 Iniciando geração de dados históricos de 2025...');

      // Buscar dados existentes
      setCurrentStep('Carregando dados existentes...');
      setProgress(5);
      
      const [existingClients, existingPrincipals, existingProducts] = await Promise.all([
        base44.entities.Client.list('company_name', 500),
        base44.entities.Principal.list('company_name', 100),
        base44.entities.Product.list('name', 500)
      ]);

      addLog(`✓ ${existingClients.length} clientes encontrados`);
      addLog(`✓ ${existingPrincipals.length} representados encontrados`);
      addLog(`✓ ${existingProducts.length} produtos encontrados`);

      if (existingClients.length === 0) {
        throw new Error('Nenhum cliente encontrado. Crie clientes primeiro.');
      }
      if (existingPrincipals.length === 0) {
        throw new Error('Nenhum representado encontrado. Crie representados primeiro.');
      }
      if (existingProducts.length === 0) {
        throw new Error('Nenhum produto encontrado. Crie produtos primeiro.');
      }

      // Dados gerados
      let createdQuotes = 0;
      let createdOrders = 0;
      let createdOpportunities = 0;
      let createdTasks = 0;

      // ETAPA 1: Criar orçamentos distribuídos ao longo de 2025
      setCurrentStep('Gerando orçamentos de 2025...');
      setProgress(10);
      addLog('📊 Criando 300 orçamentos distribuídos ao longo de 2025...');

      const monthlyDistribution = [15, 20, 35, 40, 25, 20, 25, 35, 40, 35, 25, 15]; // sazonalidade
      const statusOptions = ['enviado', 'aprovado', 'convertido', 'cancelado'];
      const termsOptions = ['A VISTA', '7', '14', '28', '30', '45', '60', '30/45/60', '45/60'];
      const freightTypes = ['FOB', 'CIF'];

      let quoteCounter = 1;
      const quotes = [];

      for (let month = 0; month < 12; month++) {
        const quotesThisMonth = monthlyDistribution[month];
        
        for (let i = 0; i < quotesThisMonth; i++) {
          // Cliente aleatório
          const client = existingClients[Math.floor(Math.random() * existingClients.length)];
          const principal = existingPrincipals[Math.floor(Math.random() * existingPrincipals.length)];
          
          // Data aleatória no mês
          const day = Math.floor(Math.random() * 28) + 1;
          const createdDate = new Date(2025, month, day);
          
          // Itens do orçamento (1 a 5 produtos)
          const numItems = Math.floor(Math.random() * 4) + 1;
          const items = [];
          let productsSubtotal = 0;
          let totalWeight = 0;
          let totalIcms = 0;
          let totalIpi = 0;

          for (let j = 0; j < numItems; j++) {
            const product = existingProducts[Math.floor(Math.random() * existingProducts.length)];
            const quantity = (Math.floor(Math.random() * 20) + 1) * 100; // 100 a 2000 kg
            const weightPerMeter = product.weight_per_meter || 1;
            const totalItemWeight = product.unit === 'mt' ? quantity * weightPerMeter : quantity;
            const basePrice = product.base_price_per_kg || 10;
            const icmsRate = product.is_imported ? 4 : 18;
            const ipiRate = product.ipi_rate || 5;
            
            const itemSubtotal = totalItemWeight * basePrice;
            const icmsValue = itemSubtotal * (icmsRate / 100);
            const ipiValue = itemSubtotal * (ipiRate / 100);
            const itemTotal = itemSubtotal + icmsValue + ipiValue;

            items.push({
              product_id: product.id,
              product_code: product.code,
              product_name: product.name,
              description: product.description,
              category: product.category,
              ncm: product.ncm,
              unit: product.unit || 'kg',
              quantity: quantity,
              weight_per_meter: weightPerMeter,
              total_weight: totalItemWeight,
              base_price_per_kg: basePrice,
              icms_rate: icmsRate,
              ipi_rate: ipiRate,
              price_per_kg: basePrice,
              item_subtotal: itemSubtotal,
              icms_value: icmsValue,
              ipi_value: ipiValue,
              item_total: itemTotal,
              delivery_days: Math.floor(Math.random() * 30) + 10
            });

            productsSubtotal += itemSubtotal;
            totalWeight += totalItemWeight;
            totalIcms += icmsValue;
            totalIpi += ipiValue;
          }

          const freightType = freightTypes[Math.floor(Math.random() * freightTypes.length)];
          const freightValue = freightType === 'CIF' ? totalWeight * 0.15 : 0;
          const totalValue = productsSubtotal + totalIcms + totalIpi + freightValue;
          const terms = termsOptions[Math.floor(Math.random() * termsOptions.length)];
          const avgTermDays = terms === 'A VISTA' ? 0 : 
                              terms.includes('/') ? 45 : parseInt(terms);

          // Status com lógica temporal
          let status = 'enviado';
          let sentDate = createdDate.toISOString().split('T')[0];
          let approvedDate = null;
          
          const daysSinceCreated = Math.floor((new Date('2025-12-31') - createdDate) / (1000 * 60 * 60 * 24));
          
          if (daysSinceCreated > 60) {
            // Orçamentos antigos: 60% convertidos, 20% aprovados, 10% cancelados, 10% em aberto
            const rand = Math.random();
            if (rand < 0.6) {
              status = 'convertido';
              approvedDate = new Date(createdDate.getTime() + (Math.random() * 10 + 5) * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
            } else if (rand < 0.8) {
              status = 'aprovado';
              approvedDate = new Date(createdDate.getTime() + (Math.random() * 7 + 3) * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
            } else if (rand < 0.9) {
              status = 'cancelado';
            }
          } else if (daysSinceCreated > 30) {
            const rand = Math.random();
            if (rand < 0.4) status = 'convertido';
            else if (rand < 0.6) status = 'aprovado';
            else if (rand < 0.7) status = 'cancelado';
          }

          const quote = {
            quote_number: `ORC-2025-${String(quoteCounter++).padStart(4, '0')}`,
            client_id: client.id,
            client_name: client.company_name,
            client_cnpj: client.cnpj,
            client_state: client.state,
            client_city: client.city,
            client_state_registration: client.state_registration,
            client_address: client.address,
            client_phone: client.phone,
            client_contact: client.contact_name,
            principal_id: principal.id,
            principal_name: principal.company_name,
            principal_cnpj: principal.cnpj,
            items: items,
            products_subtotal: productsSubtotal,
            total_icms: totalIcms,
            total_ipi: totalIpi,
            total_weight: totalWeight,
            freight_type: freightType,
            freight_value: freightValue,
            total_value: totalValue,
            terms: terms,
            avg_term_days: avgTermDays,
            payment_terms: terms === 'A VISTA' ? 'Pagamento à vista' : `Pagamento em ${terms} dias`,
            commission_rate: 3,
            commission_value_total: totalValue * 0.03,
            validity_days: 15,
            validity_date: new Date(createdDate.getTime() + 15 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            status: status,
            sent_date: sentDate,
            approved_date: approvedDate,
            is_locked: status === 'convertido'
          };

          quotes.push({ quote, createdDate });
        }
      }

      // Criar orçamentos em batches de 50
      const batchSize = 50;
      for (let i = 0; i < quotes.length; i += batchSize) {
        const batch = quotes.slice(i, i + batchSize);
        await Promise.all(batch.map(({ quote }) => base44.entities.Quote.create(quote)));
        createdQuotes += batch.length;
        setProgress(10 + (createdQuotes / quotes.length) * 30);
        addLog(`✓ ${createdQuotes}/${quotes.length} orçamentos criados`);
      }

      // Buscar orçamentos criados
      const allQuotes = await base44.entities.Quote.list('-created_date', 500);
      const quotes2025 = allQuotes.filter(q => {
        const year = new Date(q.created_date).getFullYear();
        return year === 2025;
      });

      addLog(`✅ ${createdQuotes} orçamentos criados com sucesso`);

      // ETAPA 2: Criar oportunidades para orçamentos
      setCurrentStep('Criando oportunidades...');
      setProgress(45);
      addLog('🎯 Criando oportunidades vinculadas...');

      const opportunities = [];
      for (const quote of quotes2025) {
        let stage = 'proposta_enviada';
        let lossReason = null;
        
        if (quote.status === 'convertido') stage = 'ganho';
        else if (quote.status === 'aprovado') stage = 'em_negociacao';
        else if (quote.status === 'cancelado') {
          stage = 'perdido';
          const reasons = ['Preço alto', 'Prazo longo', 'Concorrência', 'Projeto cancelado', 'Sem resposta'];
          lossReason = reasons[Math.floor(Math.random() * reasons.length)];
        }

        const opp = {
          quote_id: quote.id,
          quote_number: quote.quote_number,
          created_from_quote_id: quote.id,
          client_id: quote.client_id,
          client_name: quote.client_name,
          principal_id: quote.principal_id,
          principal_name: quote.principal_name,
          value_estimated: quote.total_value,
          total_value: quote.total_value,
          total_weight: quote.total_weight,
          stage: stage,
          loss_reason: lossReason,
          priority_score: Math.floor(Math.random() * 100),
          risk_level: stage === 'perdido' ? 'high' : stage === 'proposta_enviada' ? 'medium' : 'low'
        };

        opportunities.push(opp);
      }

      // Criar oportunidades em batch
      for (let i = 0; i < opportunities.length; i += batchSize) {
        const batch = opportunities.slice(i, i + batchSize);
        await Promise.all(batch.map(opp => base44.entities.Opportunity.create(opp)));
        createdOpportunities += batch.length;
        setProgress(45 + (createdOpportunities / opportunities.length) * 20);
        addLog(`✓ ${createdOpportunities}/${opportunities.length} oportunidades criadas`);
      }

      addLog(`✅ ${createdOpportunities} oportunidades criadas`);

      // ETAPA 3: Criar pedidos para orçamentos convertidos
      setCurrentStep('Criando pedidos...');
      setProgress(70);
      addLog('📦 Criando pedidos dos orçamentos convertidos...');

      const convertedQuotes = quotes2025.filter(q => q.status === 'convertido');
      const orders = [];

      for (const quote of convertedQuotes) {
        const orderItems = quote.items.map(item => ({
          product_id: item.product_id,
          product_code: item.product_code,
          product_name: item.product_name,
          description: item.description,
          quantity: item.quantity,
          unit: item.unit,
          weight: item.total_weight,
          unit_price: item.price_per_kg,
          unit_cost: item.base_price_per_kg * 0.7, // custo estimado
          total_price: item.item_total,
          total_cost: item.total_weight * item.base_price_per_kg * 0.7
        }));

        const totalCost = orderItems.reduce((sum, item) => sum + item.total_cost, 0);
        const marginPct = ((quote.total_value - totalCost) / quote.total_value) * 100;

        const billingDate = new Date(quote.approved_date);
        billingDate.setDate(billingDate.getDate() + Math.floor(Math.random() * 20) + 10);

        const order = {
          order_number: `PED-2025-${String(orders.length + 1).padStart(4, '0')}`,
          quote_id: quote.id,
          opportunity_id: null, // será vinculado depois
          client_id: quote.client_id,
          client_name: quote.client_name,
          principal_id: quote.principal_id,
          principal_name: quote.principal_name,
          items: orderItems,
          total_value: quote.total_value,
          total_cost: totalCost,
          total_weight: quote.total_weight,
          total_weight_kg: quote.total_weight,
          total_icms: quote.total_icms,
          total_ipi: quote.total_ipi,
          terms: quote.terms,
          avg_term_days: quote.avg_term_days,
          payment_terms: quote.payment_terms,
          original_margin_pct: marginPct,
          adjusted_margin_pct: marginPct,
          commission_rate: quote.commission_rate,
          expected_commission: quote.commission_value_total,
          status: 'faturado',
          billing_date: billingDate.toISOString().split('T')[0],
          invoice_number: `NF-${String(orders.length + 1).padStart(6, '0')}`,
          invoice_date: billingDate.toISOString().split('T')[0],
          invoiced_value: quote.total_value
        };

        orders.push(order);
      }

      // Criar pedidos em batch
      for (let i = 0; i < orders.length; i += batchSize) {
        const batch = orders.slice(i, i + batchSize);
        await Promise.all(batch.map(order => base44.entities.Order.create(order)));
        createdOrders += batch.length;
        setProgress(70 + (createdOrders / orders.length) * 15);
        addLog(`✓ ${createdOrders}/${orders.length} pedidos criados`);
      }

      addLog(`✅ ${createdOrders} pedidos criados`);

      // ETAPA 4: Criar tarefas
      setCurrentStep('Criando tarefas...');
      setProgress(85);
      addLog('✅ Criando tarefas e follow-ups...');

      const tasks = [];
      const taskTypes = ['call', 'email', 'visit', 'follow_up'];
      const priorities = ['low', 'medium', 'high'];

      // Criar tarefas para oportunidades em aberto
      const openOpps = opportunities.filter(o => o.stage === 'proposta_enviada' || o.stage === 'em_negociacao');
      
      for (const opp of openOpps.slice(0, 100)) { // limitar a 100 tarefas
        const taskDate = new Date(2025, Math.floor(Math.random() * 12), Math.floor(Math.random() * 28) + 1);
        const task = {
          title: `Follow-up ${opp.client_name}`,
          description: `Retomar contato sobre orçamento ${opp.quote_number}`,
          task_type: taskTypes[Math.floor(Math.random() * taskTypes.length)],
          client_id: opp.client_id,
          client_name: opp.client_name,
          opportunity_id: opp.id,
          scheduled_date: taskDate.toISOString().split('T')[0],
          scheduled_time: `${String(Math.floor(Math.random() * 8) + 9).padStart(2, '0')}:00`,
          status: taskDate > new Date() ? 'pending' : 'completed',
          priority: priorities[Math.floor(Math.random() * priorities.length)],
          completed_at: taskDate <= new Date() ? taskDate.toISOString() : null
        };

        tasks.push(task);
      }

      // Criar tarefas em batch
      for (let i = 0; i < tasks.length; i += batchSize) {
        const batch = tasks.slice(i, i + batchSize);
        await Promise.all(batch.map(task => base44.entities.Task.create(task)));
        createdTasks += batch.length;
        setProgress(85 + (createdTasks / tasks.length) * 10);
        addLog(`✓ ${createdTasks}/${tasks.length} tarefas criadas`);
      }

      addLog(`✅ ${createdTasks} tarefas criadas`);

      // Finalizar
      setProgress(100);
      setCurrentStep('Concluído!');
      
      const summary = {
        quotes: createdQuotes,
        opportunities: createdOpportunities,
        orders: createdOrders,
        tasks: createdTasks,
        totalRevenue: orders.reduce((sum, o) => sum + o.total_value, 0),
        avgTicket: orders.length > 0 ? orders.reduce((sum, o) => sum + o.total_value, 0) / orders.length : 0,
        conversionRate: createdQuotes > 0 ? ((createdOrders / createdQuotes) * 100).toFixed(1) : 0
      };

      setResults(summary);
      addLog(`\n🎉 GERAÇÃO COMPLETA!`);
      addLog(`📊 ${summary.quotes} orçamentos`);
      addLog(`🎯 ${summary.opportunities} oportunidades`);
      addLog(`📦 ${summary.orders} pedidos`);
      addLog(`✅ ${summary.tasks} tarefas`);
      addLog(`💰 R$ ${summary.totalRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} em faturamento`);
      addLog(`📈 Taxa de conversão: ${summary.conversionRate}%`);

      toast.success('Dados de 2025 gerados com sucesso!');

    } catch (error) {
      console.error('Erro:', error);
      addLog(`❌ ERRO: ${error.message}`, 'error');
      toast.error('Erro ao gerar dados: ' + error.message);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-3">
            <Zap className="w-6 h-6 text-[#1DB954]" />
            Gerador de Dados Históricos 2025
          </CardTitle>
          <p className="text-sm text-slate-600 mt-2">
            Cria um histórico completo de vendas, negociações, tarefas e relatórios para o ano de 2025.
            Popula 300+ orçamentos com sazonalidade realista, converte em pedidos e cria oportunidades no CRM.
          </p>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-2">
            <p className="text-sm font-semibold text-blue-900">📋 O que será criado:</p>
            <ul className="text-xs text-blue-800 space-y-1 ml-4">
              <li>• 300 orçamentos distribuídos em 2025 (com sazonalidade)</li>
              <li>• 300 oportunidades vinculadas (funil de vendas)</li>
              <li>• ~180 pedidos convertidos (60% de conversão)</li>
              <li>• 100 tarefas de follow-up</li>
              <li>• Dados para relatórios completos</li>
            </ul>
          </div>

          {!isGenerating && !results && (
            <Button 
              onClick={generate2025Data}
              className="w-full bg-[#1DB954] hover:bg-[#15803d] h-12 text-lg"
              size="lg"
            >
              <Zap className="w-5 h-5 mr-2" />
              Gerar Dados de 2025
            </Button>
          )}

          {isGenerating && (
            <div className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-600">{currentStep}</span>
                  <span className="font-medium">{progress}%</span>
                </div>
                <Progress value={progress} className="h-2" />
              </div>

              <Card className="bg-slate-50">
                <CardContent className="p-4 max-h-60 overflow-y-auto">
                  <div className="space-y-1 font-mono text-xs">
                    {logs.map((log, idx) => (
                      <div key={idx} className={`flex gap-2 ${log.type === 'error' ? 'text-red-600' : 'text-slate-700'}`}>
                        <span className="text-slate-400">{log.time}</span>
                        <span>{log.message}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {results && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-green-600 font-semibold">
                <CheckCircle2 className="w-5 h-5" />
                <span>Dados gerados com sucesso!</span>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <Card>
                  <CardContent className="p-4 text-center">
                    <p className="text-2xl font-bold text-slate-900">{results.quotes}</p>
                    <p className="text-xs text-slate-600">Orçamentos</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4 text-center">
                    <p className="text-2xl font-bold text-slate-900">{results.opportunities}</p>
                    <p className="text-xs text-slate-600">Oportunidades</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4 text-center">
                    <p className="text-2xl font-bold text-slate-900">{results.orders}</p>
                    <p className="text-xs text-slate-600">Pedidos</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4 text-center">
                    <p className="text-2xl font-bold text-slate-900">{results.tasks}</p>
                    <p className="text-xs text-slate-600">Tarefas</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4 text-center">
                    <p className="text-lg font-bold text-green-600">
                      R$ {(results.totalRevenue / 1000000).toFixed(1)}M
                    </p>
                    <p className="text-xs text-slate-600">Faturamento</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4 text-center">
                    <p className="text-lg font-bold text-blue-600">{results.conversionRate}%</p>
                    <p className="text-xs text-slate-600">Conversão</p>
                  </CardContent>
                </Card>
              </div>

              <div className="bg-slate-50 rounded-lg p-4 max-h-60 overflow-y-auto">
                <p className="text-xs font-semibold text-slate-700 mb-2">Log de execução:</p>
                <div className="space-y-1 font-mono text-xs text-slate-600">
                  {logs.map((log, idx) => (
                    <div key={idx}>{log.message}</div>
                  ))}
                </div>
              </div>

              <Button 
                onClick={() => window.location.href = '/Reports'}
                className="w-full"
                variant="outline"
              >
                Ir para Relatórios
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}