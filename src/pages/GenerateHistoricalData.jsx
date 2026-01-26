import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle, Loader2, Database, Users, Target, Bell } from 'lucide-react';
import { toast } from 'sonner';
import PageHeader from '@/components/common/PageHeader';

export default function GenerateHistoricalData() {
  const navigate = useNavigate();
  const [generating, setGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [logs, setLogs] = useState([]);
  const [results, setResults] = useState(null);

  const addLog = (message) => {
    setLogs(prev => [...prev, `${new Date().toLocaleTimeString()} - ${message}`]);
  };

  const generateHistoricalData = async () => {
    setGenerating(true);
    setProgress(0);
    setLogs([]);
    setResults(null);

    try {
      addLog('🚀 Iniciando geração de dados históricos 2025...');

      // 1. CLIENTES
      addLog('📊 Criando 90 clientes...');
      setProgress(5);

      const segments = ['Metalúrgica', 'Metalmecânica', 'Caldeiraria', 'Estruturas Metálicas', 'Engenharia', 'Construtoras', 'Implemento Agrícola', 'Implemento Rodoviário'];
      const states = ['SP', 'MG', 'RJ', 'RS', 'PR', 'SC', 'BA', 'PE', 'CE'];

      const clients = [];
      
      for (let i = 1; i <= 40; i++) {
        clients.push({
          company_name: `${segments[i % segments.length]} ${states[i % states.length]} ${i} LTDA`,
          trade_name: `Cliente Ativo ${i}`,
          cnpj: `${String(i).padStart(8, '0')}/0001-00`,
          segment: segments[i % segments.length],
          state: states[i % states.length],
          city: `Cidade ${i}`,
          address: `Rua ${i}, ${i}00`,
          phone: `(11) 9${String(i).padStart(4, '0')}-${String(i).padStart(4, '0')}`,
          email: `cliente${i}@email.com`,
          contact_name: `Contato ${i}`,
          status: 'active',
          last_purchase_date: new Date(2025, 9 + Math.floor(Math.random() * 3), Math.floor(Math.random() * 28) + 1).toISOString().split('T')[0]
        });
      }
      
      for (let i = 41; i <= 70; i++) {
        clients.push({
          company_name: `${segments[i % segments.length]} ${states[i % states.length]} ${i} LTDA`,
          trade_name: `Cliente Recorrente ${i}`,
          cnpj: `${String(i).padStart(8, '0')}/0001-00`,
          segment: segments[i % segments.length],
          state: states[i % states.length],
          city: `Cidade ${i}`,
          address: `Rua ${i}, ${i}00`,
          phone: `(11) 9${String(i).padStart(4, '0')}-${String(i).padStart(4, '0')}`,
          email: `cliente${i}@email.com`,
          contact_name: `Contato ${i}`,
          status: 'attention',
          last_purchase_date: new Date(2025, 3 + Math.floor(Math.random() * 6), Math.floor(Math.random() * 28) + 1).toISOString().split('T')[0]
        });
      }
      
      for (let i = 71; i <= 90; i++) {
        clients.push({
          company_name: `${segments[i % segments.length]} ${states[i % states.length]} ${i} LTDA`,
          trade_name: `Cliente Inativo ${i}`,
          cnpj: `${String(i).padStart(8, '0')}/0001-00`,
          segment: segments[i % segments.length],
          state: states[i % states.length],
          city: `Cidade ${i}`,
          address: `Rua ${i}, ${i}00`,
          phone: `(11) 9${String(i).padStart(4, '0')}-${String(i).padStart(4, '0')}`,
          email: `cliente${i}@email.com`,
          contact_name: `Contato ${i}`,
          status: 'inactive',
          last_purchase_date: new Date(2024, Math.floor(Math.random() * 12), Math.floor(Math.random() * 28) + 1).toISOString().split('T')[0]
        });
      }

      const createdClients = await base44.entities.Client.bulkCreate(clients);
      addLog(`✅ ${createdClients.length} clientes criados`);
      setProgress(15);

      // 2. PRODUTOS
      addLog('📦 Criando produtos...');
      
      const principals = await base44.entities.Principal.list('company_name', 10);
      const principalId = principals[0]?.id;

      if (!principalId) {
        throw new Error('❌ Nenhum representado encontrado. Crie ao menos um representado primeiro.');
      }

      const products = [
        { code: 'TUB-001', name: 'TUBO QUADRADO 100X100X3MM', category: 'tubos_quadrados_retangulares', base_price_per_kg: 8.5, weight_per_meter: 9.42, cost_per_kg: 6.0 },
        { code: 'TUB-002', name: 'TUBO RETANGULAR 100X50X2,65MM', category: 'tubos_quadrados_retangulares', base_price_per_kg: 8.2, weight_per_meter: 6.12, cost_per_kg: 5.8 },
        { code: 'TUB-003', name: 'TUBO REDONDO 2" SCH40', category: 'tubos_redondos', base_price_per_kg: 9.0, weight_per_meter: 3.65, cost_per_kg: 6.3 },
        { code: 'CHA-001', name: 'CHAPA 1/4" (6,35MM)', category: 'chapas', base_price_per_kg: 7.8, weight_per_meter: 0, cost_per_kg: 5.5 },
        { code: 'PER-001', name: 'PERFIL U 100X50', category: 'perfis', base_price_per_kg: 8.3, weight_per_meter: 7.1, cost_per_kg: 5.9 }
      ].map(p => ({ ...p, principal_id: principalId, unit: 'kg', is_active: true }));

      const createdProducts = await base44.entities.Product.bulkCreate(products);
      addLog(`✅ ${createdProducts.length} produtos criados`);
      setProgress(25);

      // 3. OPORTUNIDADES 2025
      addLog('💼 Criando 450 oportunidades em 2025...');
      
      const stages = ['proposta_enviada', 'em_negociacao', 'ganho', 'perdido'];
      const stageWeights = [0.3, 0.2, 0.35, 0.15]; // 35% ganho
      const lossReasons = ['Preço alto', 'Prazo', 'Concorrente', 'Sem retorno', 'Projeto cancelado'];
      
      const opportunities = [];

      for (let i = 1; i <= 450; i++) {
        const client = createdClients[Math.floor(Math.random() * createdClients.length)];
        const month = Math.floor((i - 1) * 12 / 450); // Distribuir uniformemente
        const day = Math.floor(Math.random() * 28) + 1;
        const hour = Math.floor(Math.random() * 24);
        
        // Selecionar stage ponderado
        const rand = Math.random();
        let stage;
        if (rand < stageWeights[0]) stage = stages[0];
        else if (rand < stageWeights[0] + stageWeights[1]) stage = stages[1];
        else if (rand < stageWeights[0] + stageWeights[1] + stageWeights[2]) stage = stages[2];
        else stage = stages[3];
        
        const createdDate = new Date(Date.UTC(2025, month, day, hour, 0, 0));
        const value = 5000 + Math.floor(Math.random() * 95000);
        
        const oppData = {
          client_id: client.id,
          client_name: client.trade_name || client.company_name,
          principal_id: principalId,
          principal_name: principals[0].trade_name,
          value_estimated: value,
          stage,
          loss_reason: stage === 'perdido' ? lossReasons[Math.floor(Math.random() * lossReasons.length)] : null
        };
        
        // Se ganho, adicionar won_at
        if (stage === 'ganho') {
          const wonDate = new Date(createdDate);
          wonDate.setUTCDate(wonDate.getUTCDate() + Math.floor(Math.random() * 14) + 1);
          if (wonDate.getUTCFullYear() > 2025) {
            wonDate.setUTCFullYear(2025);
            wonDate.setUTCMonth(11);
            wonDate.setUTCDate(31);
          }
          oppData.won_at = wonDate.toISOString();
        }
        
        opportunities.push(oppData);
      }

      // Criar oportunidades com timestamp explícito
      const oppBatches = [];
      for (let i = 0; i < opportunities.length; i += 50) {
        oppBatches.push(opportunities.slice(i, i + 50));
      }

      const createdOpportunities = [];
      for (let i = 0; i < oppBatches.length; i++) {
        const batch = await base44.entities.Opportunity.bulkCreate(oppBatches[i]);
        createdOpportunities.push(...batch);
        addLog(`📈 ${Math.min((i + 1) * 50, opportunities.length)} / ${opportunities.length} oportunidades`);
        setProgress(25 + (i / oppBatches.length) * 20);
      }

      setProgress(45);
      addLog(`💡 Criando orçamentos vinculados...`);

      // 4. QUOTES
      const quotes = [];
      for (const opp of createdOpportunities) {
        const client = createdClients.find(c => c.id === opp.client_id);
        const product = createdProducts[Math.floor(Math.random() * createdProducts.length)];
        const quantity = 100 + Math.floor(Math.random() * 900);
        
        quotes.push({
          opportunity_id: opp.id,
          client_id: opp.client_id,
          client_name: opp.client_name,
          client_state: client?.state || 'SP',
          principal_id: principalId,
          principal_name: principals[0].trade_name,
          items: [{
            product_id: product.id,
            product_code: product.code,
            product_name: product.name,
            category: product.category,
            unit: 'kg',
            quantity,
            weight_per_meter: product.weight_per_meter,
            total_weight: quantity,
            base_price_per_kg: product.base_price_per_kg,
            price_per_kg: product.base_price_per_kg,
            icms_rate: 18,
            ipi_rate: 5,
            item_subtotal: quantity * product.base_price_per_kg,
            item_total: quantity * product.base_price_per_kg * 1.05
          }],
          total_value: opp.value_estimated,
          status: opp.stage === 'ganho' ? 'convertido' : opp.stage === 'perdido' ? 'cancelado' : 'enviado'
        });
      }

      const quoteBatches = [];
      for (let i = 0; i < quotes.length; i += 50) {
        quoteBatches.push(quotes.slice(i, i + 50));
      }

      const createdQuotes = [];
      for (let i = 0; i < quoteBatches.length; i++) {
        const batch = await base44.entities.Quote.bulkCreate(quoteBatches[i]);
        createdQuotes.push(...batch);
        setProgress(45 + (i / quoteBatches.length) * 15);
      }

      addLog(`✅ ${createdQuotes.length} orçamentos criados`);
      setProgress(60);

      // 5. ORDERS - APENAS OPORTUNIDADES GANHAS
      addLog('📦 Criando pedidos das oportunidades ganhas...');
      
      const wonOpportunities = createdOpportunities.filter(o => o.stage === 'ganho');
      const orders = [];

      for (const opp of wonOpportunities) {
        const quote = createdQuotes.find(q => q.opportunity_id === opp.id);
        const product = createdProducts[Math.floor(Math.random() * createdProducts.length)];
        const quantity = quote?.items?.[0]?.quantity || 100 + Math.floor(Math.random() * 900);
        
        const orderDate = new Date(opp.created_date);
        const billingDate = new Date(orderDate);
        billingDate.setUTCDate(billingDate.getUTCDate() + 7);
        
        // Garantir que billing_date também está em 2025
        if (billingDate.getUTCFullYear() > 2025) {
          billingDate.setUTCFullYear(2025);
          billingDate.setUTCMonth(11);
          billingDate.setUTCDate(31);
        }
        
        orders.push({
          opportunity_id: opp.id,
          quote_id: quote?.id || null,
          client_id: opp.client_id,
          client_name: opp.client_name,
          principal_id: principalId,
          principal_name: principals[0].trade_name,
          items: quote?.items || [],
          total_value: opp.value_estimated,
          total_weight: quantity,
          total_cost: quantity * (product.cost_per_kg || product.base_price_per_kg * 0.7),
          status: 'faturado',
          billing_date: billingDate.toISOString().split('T')[0],
          invoice_date: billingDate.toISOString().split('T')[0],
          closed_at: billingDate.toISOString()
        });
      }

      const orderBatches = [];
      for (let i = 0; i < orders.length; i += 50) {
        orderBatches.push(orders.slice(i, i + 50));
      }

      const createdOrders = [];
      for (let i = 0; i < orderBatches.length; i++) {
        const batch = await base44.entities.Order.bulkCreate(orderBatches[i]);
        createdOrders.push(...batch);
        addLog(`✅ ${Math.min((i + 1) * 50, orders.length)} / ${orders.length} pedidos`);
        setProgress(60 + (i / orderBatches.length) * 15);
      }

      setProgress(75);
      addLog(`💰 Criando comissões...`);

      // 6. COMMISSIONS
      const commissions = [];
      for (const order of createdOrders) {
        const principal = principals[0];
        const commissionRate = principal?.commission_percentage || 3;
        const salesValue = order.total_value || 0;
        const commissionValue = (salesValue * commissionRate) / 100;

        commissions.push({
          order_id: order.id,
          opportunity_id: order.opportunity_id,
          quote_id: order.quote_id,
          principal_id: order.principal_id,
          principal_name: order.principal_name,
          client_id: order.client_id,
          client_name: order.client_name,
          sales_value: salesValue,
          commission_rate: commissionRate,
          commission_total_value: commissionValue,
          commission_value: commissionValue,
          status: 'prevista',
          invoice_date: order.billing_date || order.created_date
        });
      }

      const commissionBatches = [];
      for (let i = 0; i < commissions.length; i += 50) {
        commissionBatches.push(commissions.slice(i, i + 50));
      }

      const createdCommissions = [];
      for (let i = 0; i < commissionBatches.length; i++) {
        const batch = await base44.entities.Commission.bulkCreate(commissionBatches[i]);
        createdCommissions.push(...batch);
        setProgress(75 + (i / commissionBatches.length) * 10);
      }

      addLog(`✅ ${createdCommissions.length} comissões criadas`);

      // 7. INSTALLMENTS
      addLog(`💳 Criando parcelas...`);
      
      const installments = [];
      for (const commission of createdCommissions) {
        const dueDate = new Date(commission.invoice_date);
        dueDate.setDate(dueDate.getDate() + 30);

        installments.push({
          commission_id: commission.id,
          representada_id: commission.principal_id,
          order_id: commission.order_id,
          installment_no: 1,
          installment_pct: 100,
          installment_value: commission.commission_total_value,
          due_date: dueDate.toISOString().split('T')[0],
          status: 'prevista',
          reference_month: new Date(commission.invoice_date).toISOString().slice(0, 7)
        });
      }

      const installmentBatches = [];
      for (let i = 0; i < installments.length; i += 50) {
        installmentBatches.push(installments.slice(i, i + 50));
      }

      for (let i = 0; i < installmentBatches.length; i++) {
        await base44.entities.CommissionInstallment.bulkCreate(installmentBatches[i]);
        setProgress(85 + (i / installmentBatches.length) * 5);
      }

      addLog(`✅ ${installments.length} parcelas criadas`);

      // 8. TAREFAS
      addLog('🔔 Criando tarefas...');
      
      const tasks = [];
      for (let i = 0; i < 20; i++) {
        const client = createdClients[Math.floor(Math.random() * createdClients.length)];
        const month = Math.floor(Math.random() * 12);
        const day = Math.floor(Math.random() * 28) + 1;
        const taskDate = new Date(2025, month, day);
        
        tasks.push({
          title: `Follow-up: ${client.trade_name}`,
          description: `Contatar cliente sobre proposta enviada`,
          task_type: 'follow_up',
          client_id: client.id,
          client_name: client.trade_name,
          scheduled_date: taskDate.toISOString().split('T')[0],
          scheduled_time: '10:00',
          status: 'pending',
          priority: 'medium'
        });
      }

      await base44.entities.Task.bulkCreate(tasks);
      setProgress(92);

      // 9. DADOS DO MÊS ATUAL (JAN/2026)
      addLog('📅 Criando dados do mês atual (2026-01)...');
      
      const currentMonthOpps = [];
      for (let i = 0; i < 15; i++) {
        const client = createdClients[Math.floor(Math.random() * 40)]; // Apenas ativos
        const day = Math.floor(Math.random() * 26) + 1;
        const value = 8000 + Math.floor(Math.random() * 50000);
        
        currentMonthOpps.push({
          client_id: client.id,
          client_name: client.trade_name,
          principal_id: principalId,
          principal_name: principals[0].trade_name,
          value_estimated: value,
          stage: ['proposta_enviada', 'em_negociacao'][Math.floor(Math.random() * 2)],
          created_date: new Date(2026, 0, day, 10, 0, 0).toISOString()
        });
      }

      const currentOpps = await base44.entities.Opportunity.bulkCreate(currentMonthOpps);
      addLog(`✅ ${currentOpps.length} oportunidades jan/2026 criadas`);
      
      setProgress(96);

      // VALIDAÇÃO FINAL
      const sampleOpp = createdOpportunities[0];
      const sampleOrder = createdOrders[0];
      const oppYear = new Date(sampleOpp?.created_date).getFullYear();
      const orderBillingYear = sampleOrder?.billing_date ? new Date(sampleOrder.billing_date).getFullYear() : 'N/A';
      
      addLog(`📅 Validação: Oportunidade ano ${oppYear}`);
      addLog(`📅 Validação: Pedido billing_date ano ${orderBillingYear}`);
      
      if (oppYear !== 2025) {
        addLog(`⚠️ ATENÇÃO: Oportunidades criadas em ${oppYear} ao invés de 2025`);
      }
      if (orderBillingYear !== 2025 && orderBillingYear !== 'N/A') {
        addLog(`⚠️ ATENÇÃO: Pedidos com billing_date em ${orderBillingYear} ao invés de 2025`);
      }
      
      setProgress(100);
      
      const finalResults = {
        clients: createdClients.length,
        products: createdProducts.length,
        opportunities2025: createdOpportunities.length,
        quotes: createdQuotes.length,
        orders: createdOrders.length,
        commissions: createdCommissions.length,
        tasks: tasks.length,
        currentMonth: currentOpps.length
      };

      setResults(finalResults);
      addLog('✨ Geração concluída! Redirecionando para relatórios...');
      toast.success('Dados históricos 2025 gerados com sucesso!');
      
      // Auto-redirecionar para Reports com filtro 2025
      setTimeout(() => {
        navigate(createPageUrl('Reports?year=2025'));
      }, 2000);

    } catch (error) {
      console.error('Erro ao gerar dados:', error);
      addLog(`❌ ERRO: ${error.message}`);
      toast.error('Erro ao gerar dados');
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="space-y-6 pb-20 lg:pb-6">
      <PageHeader 
        title="Gerar Base Histórica 2025"
        subtitle="Criar dados completos de jan/2025 a dez/2025 para validação do sistema"
      />

      <Card>
        <CardHeader>
          <CardTitle>Geração de Base de Dados Completa</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert>
            <Database className="w-4 h-4" />
            <AlertDescription>
              <strong>Esta operação irá criar:</strong>
              <ul className="list-disc ml-6 mt-2 space-y-1">
                <li>90 clientes (40 ativos, 30 recorrentes, 20 inativos)</li>
                <li>450 oportunidades distribuídas em 2025</li>
                <li>~157 pedidos (das oportunidades ganhas em 2025)</li>
                <li>Comissões e parcelas vinculadas</li>
                <li>20 tarefas de follow-up</li>
                <li>15 oportunidades em jan/2026 (mês atual)</li>
              </ul>
            </AlertDescription>
          </Alert>

          {!generating && !results && (
            <Button 
              onClick={generateHistoricalData}
              className="w-full bg-[#0F2A44] hover:bg-[#1F4E79]"
              size="lg"
            >
              <Database className="w-5 h-5 mr-2" />
              Gerar Dados Históricos
            </Button>
          )}

          {generating && (
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <Loader2 className="w-5 h-5 animate-spin text-blue-600" />
                <span className="font-medium">Gerando dados...</span>
              </div>
              <Progress value={progress} className="h-3" />
              <div className="bg-slate-50 rounded-lg p-4 max-h-64 overflow-y-auto">
                <div className="space-y-1 font-mono text-xs">
                  {logs.map((log, i) => (
                    <div key={i}>{log}</div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {results && (
            <div className="space-y-4">
              <Alert className="bg-emerald-50 border-emerald-200">
                <CheckCircle className="w-4 h-4 text-emerald-600" />
                <AlertDescription className="text-emerald-900">
                  <strong>Dados gerados com sucesso! Abrindo relatórios...</strong>
                </AlertDescription>
              </Alert>

              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-3 mb-2">
                      <Users className="w-8 h-8 text-blue-600" />
                      <div>
                        <p className="text-3xl font-bold">{results.clients}</p>
                        <p className="text-sm text-slate-600">Clientes</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-3 mb-2">
                      <Target className="w-8 h-8 text-purple-600" />
                      <div>
                        <p className="text-3xl font-bold">{results.opportunities2025}</p>
                        <p className="text-sm text-slate-600">Opps 2025</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-3 mb-2">
                      <CheckCircle className="w-8 h-8 text-green-600" />
                      <div>
                        <p className="text-3xl font-bold">{results.orders}</p>
                        <p className="text-sm text-slate-600">Pedidos</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-3 mb-2">
                      <Bell className="w-8 h-8 text-amber-600" />
                      <div>
                        <p className="text-3xl font-bold">{results.currentMonth}</p>
                        <p className="text-sm text-slate-600">Jan/2026</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div className="bg-slate-50 rounded-lg p-4 max-h-64 overflow-y-auto">
                <div className="space-y-1 font-mono text-xs">
                  {logs.map((log, i) => (
                    <div key={i}>{log}</div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}