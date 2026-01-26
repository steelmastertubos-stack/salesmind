import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle, Loader2, Database, Users, Target, Bell } from 'lucide-react';
import { toast } from 'sonner';
import PageHeader from '@/components/common/PageHeader';

export default function GenerateHistoricalData() {
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
      addLog('🚀 Iniciando geração de dados históricos...');

      // 1. CLIENTES (90 clientes: 40 ativos, 30 recorrentes, 20 inativos)
      addLog('📊 Criando clientes...');
      setProgress(10);

      const segments = ['Metalúrgica', 'Metalmecânica', 'Caldeiraria', 'Estruturas Metálicas', 'Engenharia', 'Construtoras', 'Implemento Agrícola', 'Implemento Rodoviário'];
      const states = ['SP', 'MG', 'RJ', 'RS', 'PR', 'SC', 'BA', 'PE', 'CE'];

      const clients = [];
      
      // 40 ativos
      for (let i = 1; i <= 40; i++) {
        const segment = segments[Math.floor(Math.random() * segments.length)];
        const state = states[Math.floor(Math.random() * states.length)];
        clients.push({
          company_name: `${segment} ${state} ${i} LTDA`,
          trade_name: `Cliente Ativo ${i}`,
          cnpj: `${String(i).padStart(8, '0')}/0001-00`,
          segment,
          state,
          city: `Cidade ${i}`,
          address: `Rua ${i}, ${i}00`,
          phone: `(11) 9${String(i).padStart(4, '0')}-${String(i).padStart(4, '0')}`,
          email: `cliente${i}@email.com`,
          contact_name: `Contato ${i}`,
          status: 'active',
          last_purchase_date: new Date(2025, Math.floor(Math.random() * 3) + 9, Math.floor(Math.random() * 28) + 1).toISOString().split('T')[0],
          average_purchase_cycle: 30 + Math.floor(Math.random() * 30),
          average_ticket: 10000 + Math.floor(Math.random() * 40000)
        });
      }
      
      // 30 em atenção (recorrentes)
      for (let i = 41; i <= 70; i++) {
        const segment = segments[Math.floor(Math.random() * segments.length)];
        const state = states[Math.floor(Math.random() * states.length)];
        clients.push({
          company_name: `${segment} ${state} ${i} LTDA`,
          trade_name: `Cliente Recorrente ${i}`,
          cnpj: `${String(i).padStart(8, '0')}/0001-00`,
          segment,
          state,
          city: `Cidade ${i}`,
          address: `Rua ${i}, ${i}00`,
          phone: `(11) 9${String(i).padStart(4, '0')}-${String(i).padStart(4, '0')}`,
          email: `cliente${i}@email.com`,
          contact_name: `Contato ${i}`,
          status: 'attention',
          last_purchase_date: new Date(2025, Math.floor(Math.random() * 6) + 3, Math.floor(Math.random() * 28) + 1).toISOString().split('T')[0],
          average_purchase_cycle: 45 + Math.floor(Math.random() * 45),
          average_ticket: 8000 + Math.floor(Math.random() * 30000)
        });
      }
      
      // 20 inativos
      for (let i = 71; i <= 90; i++) {
        const segment = segments[Math.floor(Math.random() * segments.length)];
        const state = states[Math.floor(Math.random() * states.length)];
        clients.push({
          company_name: `${segment} ${state} ${i} LTDA`,
          trade_name: `Cliente Inativo ${i}`,
          cnpj: `${String(i).padStart(8, '0')}/0001-00`,
          segment,
          state,
          city: `Cidade ${i}`,
          address: `Rua ${i}, ${i}00`,
          phone: `(11) 9${String(i).padStart(4, '0')}-${String(i).padStart(4, '0')}`,
          email: `cliente${i}@email.com`,
          contact_name: `Contato ${i}`,
          status: 'inactive',
          last_purchase_date: new Date(2024, Math.floor(Math.random() * 12), Math.floor(Math.random() * 28) + 1).toISOString().split('T')[0],
          average_purchase_cycle: 60 + Math.floor(Math.random() * 60),
          average_ticket: 5000 + Math.floor(Math.random() * 25000)
        });
      }

      const createdClients = await base44.entities.Client.bulkCreate(clients);
      addLog(`✅ ${createdClients.length} clientes criados`);
      setProgress(30);

      // 2. PRODUTOS
      addLog('📦 Criando produtos...');
      
      const principals = await base44.entities.Principal.list('company_name', 10);
      const principalId = principals[0]?.id;

      if (!principalId) {
        throw new Error('Nenhum representado encontrado. Crie ao menos um representado primeiro.');
      }

      const products = [
        { code: 'TUB-001', name: 'TUBO QUADRADO 100X100X3MM', category: 'tubos_quadrados_retangulares', base_price_per_kg: 8.5, weight_per_meter: 9.42 },
        { code: 'TUB-002', name: 'TUBO RETANGULAR 100X50X2,65MM', category: 'tubos_quadrados_retangulares', base_price_per_kg: 8.2, weight_per_meter: 6.12 },
        { code: 'TUB-003', name: 'TUBO REDONDO 2" SCH40', category: 'tubos_redondos', base_price_per_kg: 9.0, weight_per_meter: 3.65 },
        { code: 'CHA-001', name: 'CHAPA 1/4" (6,35MM)', category: 'chapas', base_price_per_kg: 7.8, weight_per_meter: 0 },
        { code: 'PER-001', name: 'PERFIL U 100X50', category: 'perfis', base_price_per_kg: 8.3, weight_per_meter: 7.1 }
      ].map(p => ({ ...p, principal_id: principalId, unit: 'kg', is_active: true }));

      const createdProducts = await base44.entities.Product.bulkCreate(products);
      addLog(`✅ ${createdProducts.length} produtos criados`);
      setProgress(40);

      // 3. NEGOCIAÇÕES (450 ao longo de 2025)
      addLog('💼 Criando negociações de 2025...');
      
      const stages = ['proposta_enviada', 'em_negociacao', 'ganho', 'perdido'];
      const lossReasons = ['Preço alto', 'Prazo', 'Concorrente', 'Sem retorno', 'Projeto cancelado'];
      
      const opportunities = [];
      const quotes = [];
      const orders = [];
      const createdOpportunities = [];

      // Criar oportunidades primeiro
      for (let i = 1; i <= 450; i++) {
        const client = createdClients[Math.floor(Math.random() * createdClients.length)];
        const month = Math.floor(i / 38);
        const day = Math.floor(Math.random() * 28) + 1;
        const createdDate = new Date(2025, month, day);
        
        const value = 5000 + Math.floor(Math.random() * 95000);
        const stage = stages[Math.floor(Math.random() * stages.length)];
        
        opportunities.push({
          client_id: client.id,
          client_name: client.trade_name || client.company_name,
          principal_id: principalId,
          principal_name: principals[0].trade_name,
          value_estimated: value,
          stage,
          created_date: createdDate.toISOString(),
          loss_reason: stage === 'perdido' ? lossReasons[Math.floor(Math.random() * lossReasons.length)] : null,
          _tempIndex: i
        });
      }

      // Criar oportunidades em lotes e guardar os IDs
      const oppBatches = [];
      for (let i = 0; i < opportunities.length; i += 50) {
        oppBatches.push(opportunities.slice(i, i + 50));
      }

      for (let i = 0; i < oppBatches.length; i++) {
        const batch = await base44.entities.Opportunity.bulkCreate(oppBatches[i]);
        createdOpportunities.push(...batch);
        addLog(`📈 Criadas ${Math.min((i + 1) * 50, opportunities.length)} / ${opportunities.length} oportunidades`);
        setProgress(40 + (i / oppBatches.length) * 20);
      }

      setProgress(60);
      addLog(`💡 ${createdOpportunities.length} oportunidades criadas, gerando orçamentos vinculados...`);

      // Criar quotes vinculados às oportunidades
      for (let i = 0; i < createdOpportunities.length; i++) {
        const opp = createdOpportunities[i];
        const client = createdClients.find(c => c.id === opp.client_id);
        const product = createdProducts[Math.floor(Math.random() * createdProducts.length)];
        const quantity = 100 + Math.floor(Math.random() * 900);
        
        const quote = {
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
          status: opp.stage === 'ganho' ? 'convertido' : opp.stage === 'perdido' ? 'cancelado' : 'enviado',
          created_date: opp.created_date
        };
        quotes.push(quote);

        // Order (se ganho)
        if (opp.stage === 'ganho') {
          const orderDate = new Date(opp.created_date);
          orders.push({
            opportunity_id: opp.id,
            quote_id: null, // será atualizado depois
            client_id: opp.client_id,
            client_name: opp.client_name,
            principal_id: principalId,
            principal_name: principals[0].trade_name,
            items: quote.items,
            total_value: opp.value_estimated,
            total_weight: quantity,
            status: 'faturado',
            created_date: opp.created_date,
            billing_date: new Date(orderDate.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
          });
        }
      }

      // Criar quotes em lotes
      const quoteBatches = [];
      for (let i = 0; i < quotes.length; i += 50) {
        quoteBatches.push(quotes.slice(i, i + 50));
      }

      const createdQuotes = [];
      for (let i = 0; i < quoteBatches.length; i++) {
        const batch = await base44.entities.Quote.bulkCreate(quoteBatches[i]);
        createdQuotes.push(...batch);
        addLog(`📋 Criados ${Math.min((i + 1) * 50, quotes.length)} / ${quotes.length} orçamentos`);
        setProgress(60 + (i / quoteBatches.length) * 15);
      }

      setProgress(75);
      addLog(`🔗 Vinculando registros e criando comissões...`);

      if (orders.length > 0) {
        // Vincular quote_id aos pedidos
        for (let i = 0; i < orders.length; i++) {
          const order = orders[i];
          const quote = createdQuotes.find(q => q.opportunity_id === order.opportunity_id);
          if (quote) {
            order.quote_id = quote.id;
          }
        }

        const orderBatches = [];
        for (let i = 0; i < orders.length; i += 50) {
          orderBatches.push(orders.slice(i, i + 50));
        }

        const createdOrders = [];
        for (let i = 0; i < orderBatches.length; i++) {
          const batch = await base44.entities.Order.bulkCreate(orderBatches[i]);
          createdOrders.push(...batch);
          addLog(`✅ Criados ${Math.min((i + 1) * 50, orders.length)} / ${orders.length} pedidos`);
          setProgress(75 + (i / orderBatches.length) * 10);
        }

        // Criar comissões para todos os pedidos
        addLog(`💰 Criando comissões para ${createdOrders.length} pedidos...`);
        
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

        // Criar comissões em lotes
        const commissionBatches = [];
        for (let i = 0; i < commissions.length; i += 50) {
          commissionBatches.push(commissions.slice(i, i + 50));
        }

        const createdCommissions = [];
        for (let i = 0; i < commissionBatches.length; i++) {
          const batch = await base44.entities.Commission.bulkCreate(commissionBatches[i]);
          createdCommissions.push(...batch);
          setProgress(85 + (i / commissionBatches.length) * 5);
        }

        addLog(`✅ ${createdCommissions.length} comissões criadas`);

        // Criar parcelas para as comissões
        addLog(`💳 Criando parcelas de comissão...`);
        
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

        // Criar parcelas em lotes
        const installmentBatches = [];
        for (let i = 0; i < installments.length; i += 50) {
          installmentBatches.push(installments.slice(i, i + 50));
        }

        for (let i = 0; i < installmentBatches.length; i++) {
          await base44.entities.CommissionInstallment.bulkCreate(installmentBatches[i]);
        }

        addLog(`✅ ${installments.length} parcelas criadas`);
      }

      setProgress(90);

      // 4. TAREFAS E ALERTAS
      addLog('🔔 Gerando tarefas e alertas...');
      
      const tasks = [];
      const now = new Date();
      
      // Tarefas de follow-up (20)
      for (let i = 0; i < 20; i++) {
        const client = createdClients[Math.floor(Math.random() * createdClients.length)];
        const daysAhead = Math.floor(Math.random() * 30);
        const taskDate = new Date(now.getTime() + daysAhead * 24 * 60 * 60 * 1000);
        
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
      addLog(`✅ ${tasks.length} tarefas criadas`);

      setProgress(100);
      
      const finalResults = {
        clients: createdClients.length,
        products: createdProducts.length,
        opportunities: opportunities.length,
        quotes: quotes.length,
        orders: orders.length,
        commissions: orders.length,
        tasks: tasks.length
      };

      setResults(finalResults);
      addLog('✨ Geração concluída com sucesso!');
      toast.success('Dados históricos gerados!');

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
        title="Gerar Dados Históricos 2025"
        subtitle="Criar dados completos para testes de usabilidade"
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
                <li>450 negociações distribuídas em 2025</li>
                <li>Orçamentos e pedidos vinculados com datas reais</li>
                <li>20 tarefas de follow-up agendadas</li>
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
                  <strong>Dados gerados com sucesso!</strong>
                </AlertDescription>
              </Alert>

              <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
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
                      <Target className="w-8 h-8 text-emerald-600" />
                      <div>
                        <p className="text-3xl font-bold">{results.opportunities}</p>
                        <p className="text-sm text-slate-600">Negociações</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-3 mb-2">
                      <CheckCircle className="w-8 h-8 text-purple-600" />
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
                        <p className="text-3xl font-bold">{results.tasks}</p>
                        <p className="text-sm text-slate-600">Tarefas</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <Button 
                onClick={() => window.location.href = '/Reports'}
                className="w-full"
                size="lg"
              >
                Ver Relatórios
              </Button>

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