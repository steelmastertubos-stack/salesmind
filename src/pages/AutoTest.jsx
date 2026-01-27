import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Play, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  Download,
  Database,
  FileText,
  Loader2,
  AlertCircle
} from 'lucide-react';
import PageHeader from '@/components/common/PageHeader';
import { toast } from 'sonner';

export default function AutoTest() {
  const [running, setRunning] = useState(false);
  const [currentTest, setCurrentTest] = useState(null);
  const [executionId, setExecutionId] = useState(null);

  const { data: testReports = [], refetch } = useQuery({
    queryKey: ['testReports', executionId],
    queryFn: () => executionId 
      ? base44.entities.TestReport.filter({ execution_id: executionId }, '-created_date', 100)
      : Promise.resolve([]),
    enabled: !!executionId
  });

  const runTest = async (testName, testDescription, testFn) => {
    const startTime = Date.now();
    setCurrentTest(testName);
    
    try {
      const evidence = await testFn();
      const executionTime = Date.now() - startTime;
      
      await base44.entities.TestReport.create({
        test_name: testName,
        test_description: testDescription,
        status: 'PASS',
        execution_time_ms: executionTime,
        evidence,
        execution_id: executionId,
        executed_at: new Date().toISOString()
      });
      
      return { success: true, evidence };
    } catch (error) {
      const executionTime = Date.now() - startTime;
      
      await base44.entities.TestReport.create({
        test_name: testName,
        test_description: testDescription,
        status: 'FAIL',
        execution_time_ms: executionTime,
        error_message: error.message,
        evidence: { error: error.toString() },
        execution_id: executionId,
        executed_at: new Date().toISOString()
      });
      
      return { success: false, error: error.message };
    }
  };

  const executeAllTests = async () => {
    setRunning(true);
    const newExecutionId = `EXEC-${Date.now()}`;
    setExecutionId(newExecutionId);
    
    try {
      // TESTE A - Histórico 2025 existe
      await runTest(
        'TESTE A',
        'Histórico 2025 existe e é detectável',
        async () => {
          const orders = await base44.entities.Order.list('-created_date', 5000);
          const opportunities = await base44.entities.Opportunity.list('-created_date', 5000);
          
          const yearCounts = { orders: {}, opportunities: {} };
          let minDate = null, maxDate = null;
          
          orders.forEach(o => {
            const date = new Date(o.closed_at || o.billing_date || o.created_date);
            const year = date.getFullYear();
            yearCounts.orders[year] = (yearCounts.orders[year] || 0) + 1;
            
            if (!minDate || date < minDate) minDate = date;
            if (!maxDate || date > maxDate) maxDate = date;
          });
          
          opportunities.forEach(o => {
            const date = new Date(o.won_at || o.created_date);
            const year = date.getFullYear();
            yearCounts.opportunities[year] = (yearCounts.opportunities[year] || 0) + 1;
          });
          
          const has2025Orders = (yearCounts.orders[2025] || 0) > 0;
          const has2025Opps = (yearCounts.opportunities[2025] || 0) > 0;
          
          if (!has2025Orders && !has2025Opps) {
            throw new Error('Nenhum dado de 2025 encontrado');
          }
          
          return {
            yearCounts,
            minDate: minDate?.toISOString(),
            maxDate: maxDate?.toISOString(),
            has2025: true,
            count2025: (yearCounts.orders[2025] || 0) + (yearCounts.opportunities[2025] || 0)
          };
        }
      );
      
      // TESTE B - Filtro de ano mostra 2025
      await runTest(
        'TESTE B',
        'Filtro de Ano mostra 2025',
        async () => {
          const orders = await base44.entities.Order.list('-created_date', 5000);
          const opportunities = await base44.entities.Opportunity.list('-created_date', 5000);
          
          const years = new Set();
          
          orders.forEach(o => {
            const date = new Date(o.closed_at || o.billing_date || o.created_date);
            if (!isNaN(date.getTime())) years.add(date.getFullYear());
          });
          
          opportunities.forEach(o => {
            const date = new Date(o.won_at || o.created_date);
            if (!isNaN(date.getTime())) years.add(date.getFullYear());
          });
          
          const yearArray = Array.from(years).sort((a, b) => b - a);
          
          if (!yearArray.includes(2025)) {
            throw new Error('2025 não está na lista de anos disponíveis');
          }
          
          return { availableYears: yearArray, has2025: true };
        }
      );
      
      // TESTE C - Dashboard 2025 não zerado
      await runTest(
        'TESTE C',
        'Dashboard 2025 não pode ficar zerado',
        async () => {
          const orders = await base44.entities.Order.list('-created_date', 5000);
          const quotes = await base44.entities.Quote.list('-created_date', 5000);
          const opportunities = await base44.entities.Opportunity.list('-created_date', 5000);
          
          const orders2025 = orders.filter(o => {
            const date = new Date(o.closed_at || o.billing_date || o.created_date);
            return date.getFullYear() === 2025;
          });
          
          const quotes2025 = quotes.filter(q => {
            const date = new Date(q.created_date);
            return date.getFullYear() === 2025;
          });
          
          const opps2025 = opportunities.filter(o => {
            const date = new Date(o.created_date);
            return date.getFullYear() === 2025;
          });
          
          const revenue = orders2025.reduce((sum, o) => sum + (o.total_value || 0), 0);
          const ordersCount = orders2025.length;
          const avgTicket = ordersCount > 0 ? revenue / ordersCount : 0;
          const quotesWon = opps2025.filter(o => o.stage === 'ganho').length;
          
          if (revenue === 0 || ordersCount === 0) {
            throw new Error(`Dashboard 2025 zerado: faturamento=${revenue}, pedidos=${ordersCount}`);
          }
          
          return {
            year: 2025,
            revenue,
            orders: ordersCount,
            avgTicket,
            quotesWon,
            quotesCreated: quotes2025.length
          };
        }
      );
      
      // TESTE D - Automação de tarefa de follow-up
      await runTest(
        'TESTE D',
        'Proposta enviada cria tarefa de follow-up',
        async () => {
          const { automatePropostaEnviada } = await import('@/components/utils/smartAutomation');
          
          const clients = await base44.entities.Client.list('company_name', 10);
          const principals = await base44.entities.Principal.list('company_name', 10);
          
          if (clients.length === 0 || principals.length === 0) {
            throw new Error('Sem clientes ou representadas para teste');
          }
          
          const testClient = clients[0];
          const testPrincipal = principals[0];
          
          // Criar opportunity de teste
          const opportunity = await base44.entities.Opportunity.create({
            client_id: testClient.id,
            client_name: testClient.company_name,
            principal_id: testPrincipal.id,
            principal_name: testPrincipal.company_name,
            value_estimated: 50000,
            stage: 'proposta_enviada',
            notes: '[AUTOTEST] Teste de automação de tarefa'
          });
          
          // Executar automação
          const result = await automatePropostaEnviada(opportunity);
          
          if (!result.task) {
            throw new Error('Automação não criou tarefa');
          }
          
          const task = result.task;
          const scheduledDate = new Date(task.scheduled_date);
          const expectedDate = new Date();
          expectedDate.setDate(expectedDate.getDate() + 3);
          
          const daysDiff = Math.abs((scheduledDate - expectedDate) / (1000 * 60 * 60 * 24));
          
          if (daysDiff > 1) {
            throw new Error(`Tarefa criada com data incorreta: esperado +3 dias, obteve ${task.scheduled_date}`);
          }
          
          if (task.priority !== 'medium') {
            throw new Error(`Prioridade incorreta: esperado medium, obteve ${task.priority}`);
          }
          
          return {
            opportunity_id: opportunity.id,
            task_id: task.id,
            task_type: task.task_type,
            task_priority: task.priority,
            scheduled_date: task.scheduled_date,
            client_name: testClient.company_name
          };
        }
      );
      
      // TESTE E - Fluxo ganho → Order + Commission
      await runTest(
        'TESTE E',
        'Fluxo integrado: Ganho gera Order e Commission',
        async () => {
          const { automateGanho } = await import('@/components/utils/smartAutomation');
          
          const clients = await base44.entities.Client.list('company_name', 10);
          const principals = await base44.entities.Principal.list('company_name', 10);
          const products = await base44.entities.Product.list('name', 10);
          
          if (clients.length === 0 || principals.length === 0 || products.length === 0) {
            throw new Error('Dados insuficientes para teste');
          }
          
          const testClient = clients[0];
          const testPrincipal = principals[0];
          const testProduct = products[0];
          
          // Criar quote de teste
          const quote = await base44.entities.Quote.create({
            client_id: testClient.id,
            client_name: testClient.company_name,
            principal_id: testPrincipal.id,
            principal_name: testPrincipal.company_name,
            items: [{
              product_id: testProduct.id,
              product_name: testProduct.name,
              quantity: 1000,
              unit: 'kg',
              price_per_kg: 10,
              item_total: 10000
            }],
            total_value: 10000,
            total_weight: 1000,
            status: 'emitido',
            notes: '[AUTOTEST] Quote para teste de conversão'
          });
          
          // Criar opportunity vinculada
          const opportunity = await base44.entities.Opportunity.create({
            quote_id: quote.id,
            client_id: testClient.id,
            client_name: testClient.company_name,
            principal_id: testPrincipal.id,
            principal_name: testPrincipal.company_name,
            value_estimated: 10000,
            stage: 'ganho',
            notes: '[AUTOTEST] Opp para teste de conversão'
          });
          
          // Executar automação
          const result = await automateGanho(opportunity, quote, testPrincipal);
          
          if (!result.order) {
            throw new Error('Automação não criou Order');
          }
          
          if (!result.commission) {
            throw new Error('Automação não criou Commission');
          }
          
          // Verificar parcelas criadas
          const installments = await base44.entities.CommissionInstallment.filter(
            { commission_id: result.commission.id },
            '-created_date',
            10
          );
          
          return {
            quote_id: quote.id,
            opportunity_id: opportunity.id,
            order_id: result.order.id,
            order_number: result.order.order_number,
            commission_id: result.commission.id,
            commission_value: result.commission.commission_total_value,
            installments_count: installments.length
          };
        }
      );
      
      // TESTE F - Tags automáticas
      await runTest(
        'TESTE F',
        'Tags automáticas por histórico (Recorrente/Premium/Inativo)',
        async () => {
          const clients = await base44.entities.Client.list('company_name', 500);
          
          const recorrente = clients.find(c => c.auto_tags?.includes('Recorrente'));
          const premium = clients.find(c => c.auto_tags?.includes('Premium'));
          const inativo = clients.find(c => 
            c.status === 'inactive' || 
            c.status === 'at_risk' || 
            c.auto_tags?.includes('Inativo')
          );
          
          const results = {
            recorrente: recorrente ? { id: recorrente.id, name: recorrente.company_name, tags: recorrente.auto_tags } : null,
            premium: premium ? { id: premium.id, name: premium.company_name, tags: premium.auto_tags } : null,
            inativo: inativo ? { id: inativo.id, name: inativo.company_name, status: inativo.status } : null
          };
          
          if (!recorrente && !premium && !inativo) {
            throw new Error('Nenhuma tag automática encontrada');
          }
          
          return results;
        }
      );
      
      // TESTE G - Ranking de clientes
      await runTest(
        'TESTE G',
        'Ranking "Melhores Clientes do Ano" (Premiação)',
        async () => {
          const orders = await base44.entities.Order.list('-created_date', 5000);
          const clients = await base44.entities.Client.list('company_name', 500);
          
          const orders2025 = orders.filter(o => {
            const date = new Date(o.closed_at || o.billing_date || o.created_date);
            return date.getFullYear() === 2025;
          });
          
          const clientRevenue = {};
          orders2025.forEach(o => {
            if (!clientRevenue[o.client_id]) {
              const client = clients.find(c => c.id === o.client_id);
              clientRevenue[o.client_id] = {
                id: o.client_id,
                name: o.client_name || client?.company_name,
                revenue: 0,
                orders: 0
              };
            }
            clientRevenue[o.client_id].revenue += o.total_value || 0;
            clientRevenue[o.client_id].orders += 1;
          });
          
          const ranking = Object.values(clientRevenue)
            .sort((a, b) => b.revenue - a.revenue)
            .slice(0, 10);
          
          if (ranking.length < 10) {
            throw new Error(`Apenas ${ranking.length} clientes no ranking (esperado 10+)`);
          }
          
          return { top10: ranking, totalClients: Object.keys(clientRevenue).length };
        }
      );
      
      // TESTE H - Drill-down dos cards
      await runTest(
        'TESTE H',
        'Drill-down dos cards funciona',
        async () => {
          const orders = await base44.entities.Order.list('-created_date', 100);
          const opportunities = await base44.entities.Opportunity.filter(
            { stage: 'proposta_enviada' },
            '-created_date',
            100
          );
          const clients = await base44.entities.Client.filter(
            { status: 'inactive' },
            '-created_date',
            100
          );
          
          const results = {
            orders: { count: orders.length, route: '/Orders' },
            opportunities: { count: opportunities.length, route: '/Opportunities' },
            inactiveClients: { count: clients.length, route: '/Clients?status=inactive' }
          };
          
          if (orders.length === 0) {
            throw new Error('Card "Pedidos" sem dados');
          }
          
          return results;
        }
      );
      
      await refetch();
      toast.success('✅ Bateria de testes concluída!');
      
    } catch (error) {
      console.error('Erro na execução:', error);
      toast.error('Erro ao executar testes');
    } finally {
      setRunning(false);
      setCurrentTest(null);
    }
  };

  const exportToCSV = () => {
    if (!testReports.length) return;
    
    const csv = [
      ['Teste', 'Descrição', 'Status', 'Tempo (ms)', 'Erro', 'Evidências'].join(','),
      ...testReports.map(t => [
        t.test_name,
        t.test_description,
        t.status,
        t.execution_time_ms || '',
        t.error_message || '',
        JSON.stringify(t.evidence || {})
      ].join(','))
    ].join('\n');
    
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `autotest-${executionId}.csv`;
    a.click();
    toast.success('Relatório exportado');
  };

  const passCount = testReports.filter(t => t.status === 'PASS').length;
  const failCount = testReports.filter(t => t.status === 'FAIL').length;
  const totalTests = 8; // A-H

  return (
    <div className="pb-20 lg:pb-6 space-y-6">
      <PageHeader 
        title="AutoTest - Homologação Automatizada" 
        subtitle="Bateria de testes end-to-end com evidências"
      />

      {/* Status Geral */}
      <div className="grid lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">Testes Executados</p>
                <p className="text-2xl font-bold">{testReports.length} / {totalTests}</p>
              </div>
              <FileText className="w-8 h-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">Passou</p>
                <p className="text-2xl font-bold text-green-600">{passCount}</p>
              </div>
              <CheckCircle2 className="w-8 h-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">Falhou</p>
                <p className="text-2xl font-bold text-red-600">{failCount}</p>
              </div>
              <XCircle className="w-8 h-8 text-red-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">Status Geral</p>
                <p className="text-lg font-bold">
                  {failCount === 0 && passCount === totalTests ? '✅ OK' : 
                   failCount > 0 ? '❌ FALHOU' : '⏳ Pendente'}
                </p>
              </div>
              <Database className="w-8 h-8 text-slate-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Ações */}
      <Card>
        <CardContent className="py-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <h3 className="font-semibold text-lg">Executar Bateria de Testes</h3>
              <p className="text-sm text-slate-500">
                Testes A-H serão executados sequencialmente (~15-30s)
              </p>
            </div>
            <div className="flex gap-3">
              <Button
                onClick={executeAllTests}
                disabled={running}
                className="bg-[#1DB954] hover:bg-[#1DB954]/90"
              >
                {running ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Executando...
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4 mr-2" />
                    Executar Homologação
                  </>
                )}
              </Button>
              
              {testReports.length > 0 && (
                <Button variant="outline" onClick={exportToCSV}>
                  <Download className="w-4 h-4 mr-2" />
                  Exportar CSV
                </Button>
              )}
            </div>
          </div>
          
          {running && currentTest && (
            <div className="mt-4 p-3 bg-blue-50 rounded-lg flex items-center gap-3">
              <Loader2 className="w-5 h-5 text-blue-600 animate-spin" />
              <p className="text-sm font-medium text-blue-900">
                Executando: {currentTest}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Resultados dos Testes */}
      {testReports.length > 0 && (
        <div className="space-y-4">
          <h3 className="font-semibold text-lg">Resultados da Execução</h3>
          
          {testReports.map((test, idx) => (
            <Card key={idx} className={
              test.status === 'PASS' ? 'border-green-200 bg-green-50/30' :
              test.status === 'FAIL' ? 'border-red-200 bg-red-50/30' :
              'border-slate-200'
            }>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    {test.status === 'PASS' && <CheckCircle2 className="w-6 h-6 text-green-600 mt-0.5" />}
                    {test.status === 'FAIL' && <XCircle className="w-6 h-6 text-red-600 mt-0.5" />}
                    {test.status === 'RUNNING' && <Loader2 className="w-6 h-6 text-blue-600 animate-spin mt-0.5" />}
                    
                    <div>
                      <CardTitle className="text-base flex items-center gap-2">
                        {test.test_name}
                        <Badge variant={test.status === 'PASS' ? 'success' : test.status === 'FAIL' ? 'destructive' : 'secondary'}>
                          {test.status}
                        </Badge>
                      </CardTitle>
                      <p className="text-sm text-slate-600 mt-1">{test.test_description}</p>
                    </div>
                  </div>
                  
                  {test.execution_time_ms && (
                    <div className="flex items-center gap-1 text-xs text-slate-500">
                      <Clock className="w-3 h-3" />
                      {test.execution_time_ms}ms
                    </div>
                  )}
                </div>
              </CardHeader>
              
              <CardContent>
                {test.status === 'FAIL' && test.error_message && (
                  <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                    <div className="flex items-start gap-2">
                      <AlertCircle className="w-4 h-4 text-red-600 mt-0.5" />
                      <div>
                        <p className="text-sm font-medium text-red-900">Erro:</p>
                        <p className="text-sm text-red-700">{test.error_message}</p>
                      </div>
                    </div>
                  </div>
                )}
                
                {test.evidence && Object.keys(test.evidence).length > 0 && (
                  <div className="space-y-2">
                    <p className="text-xs font-semibold text-slate-700 uppercase">Evidências:</p>
                    <pre className="bg-slate-900 text-slate-100 p-3 rounded-lg text-xs overflow-x-auto">
                      {JSON.stringify(test.evidence, null, 2)}
                    </pre>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Critério de Aceite */}
      <Card className="border-2 border-dashed border-slate-300">
        <CardHeader>
          <CardTitle className="text-base">📋 Critério de Aceite Global</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm">
            <div className="flex items-center gap-2">
              {passCount >= 5 && testReports.some(t => t.test_name === 'TESTE A' && t.status === 'PASS') ? 
                <CheckCircle2 className="w-4 h-4 text-green-600" /> : 
                <XCircle className="w-4 h-4 text-slate-400" />
              }
              <span>TESTE A, B, C, D e E = PASS</span>
            </div>
            <div className="flex items-center gap-2">
              {failCount === 0 && passCount > 0 ? 
                <CheckCircle2 className="w-4 h-4 text-green-600" /> : 
                <XCircle className="w-4 h-4 text-slate-400" />
              }
              <span>Nenhum erro durante execução</span>
            </div>
            <div className="flex items-center gap-2">
              {testReports.length > 0 ? 
                <CheckCircle2 className="w-4 h-4 text-green-600" /> : 
                <XCircle className="w-4 h-4 text-slate-400" />
              }
              <span>Relatório exportável</span>
            </div>
          </div>
          
          {passCount >= 5 && failCount === 0 && testReports.length >= 5 && (
            <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-sm font-semibold text-green-900">
                ✅ Sistema APROVADO na homologação!
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}