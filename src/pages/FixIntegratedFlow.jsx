import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle, Loader2, AlertTriangle, Wrench, FileText, DollarSign } from 'lucide-react';
import { toast } from 'sonner';
import PageHeader from '@/components/common/PageHeader';

export default function FixIntegratedFlow() {
  const [fixing, setFixing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [logs, setLogs] = useState([]);
  const [results, setResults] = useState(null);

  const addLog = (message, type = 'info') => {
    const icon = type === 'error' ? '❌' : type === 'success' ? '✅' : type === 'warning' ? '⚠️' : '📝';
    setLogs(prev => [...prev, `${new Date().toLocaleTimeString()} ${icon} ${message}`]);
  };

  const fixIntegratedFlow = async () => {
    setFixing(true);
    setProgress(0);
    setLogs([]);
    setResults(null);

    const stats = {
      opportunitiesFixed: 0,
      ordersCreated: 0,
      commissionsCreated: 0,
      errors: []
    };

    try {
      addLog('🔧 Iniciando correção do fluxo integrado...', 'info');

      // 1. Buscar todas opportunities, orders e commissions
      addLog('📊 Carregando dados...', 'info');
      setProgress(10);

      const [opportunities, orders, commissions, principals] = await Promise.all([
        base44.entities.Opportunity.list('-created_date', 2000),
        base44.entities.Order.list('-created_date', 2000),
        base44.entities.Commission.list('-created_date', 2000),
        base44.entities.Principal.list('company_name', 100)
      ]);

      addLog(`Carregados: ${opportunities.length} oportunidades, ${orders.length} pedidos, ${commissions.length} comissões`, 'info');
      setProgress(20);

      // 2. CORRIGIR OPPORTUNITIES GANHAS SEM ORDER
      addLog('🎯 Verificando oportunidades ganhas sem pedido...', 'info');
      
      const wonOpportunities = opportunities.filter(o => o.stage === 'ganho');
      const opportunitiesWithoutOrder = wonOpportunities.filter(o => {
        return !orders.some(ord => ord.opportunity_id === o.id);
      });

      addLog(`Encontradas ${opportunitiesWithoutOrder.length} oportunidades ganhas sem pedido`, opportunitiesWithoutOrder.length > 0 ? 'warning' : 'success');

      if (opportunitiesWithoutOrder.length > 0) {
        for (let i = 0; i < opportunitiesWithoutOrder.length; i++) {
          const opp = opportunitiesWithoutOrder[i];
          
          try {
            // Buscar quote vinculado
            const relatedQuotes = await base44.entities.Quote.filter({ opportunity_id: opp.id }, '-created_date', 1);
            const quote = relatedQuotes[0];

            // Criar order
            const orderData = {
              opportunity_id: opp.id,
              quote_id: quote?.id || null,
              client_id: opp.client_id,
              client_name: opp.client_name,
              principal_id: opp.principal_id,
              principal_name: opp.principal_name,
              items: quote?.items || [],
              total_value: opp.value_estimated || quote?.total_value || 0,
              total_weight: quote?.total_weight || 0,
              total_icms: quote?.total_icms || 0,
              total_ipi: quote?.total_ipi || 0,
              status: 'faturado',
              created_date: opp.created_date || new Date().toISOString(),
              billing_date: opp.updated_date ? new Date(opp.updated_date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]
            };

            const newOrder = await base44.entities.Order.create(orderData);
            
            // Atualizar opportunity com order_id (se o campo existir)
            try {
              await base44.entities.Opportunity.update(opp.id, { order_id: newOrder.id });
            } catch (e) {
              // Campo pode não existir, ignorar
            }

            stats.ordersCreated++;
            stats.opportunitiesFixed++;
            addLog(`✅ Pedido criado para oportunidade ${opp.client_name}`, 'success');
          } catch (error) {
            stats.errors.push(`Oportunidade ${opp.id}: ${error.message}`);
            addLog(`❌ Erro ao criar pedido para ${opp.client_name}: ${error.message}`, 'error');
          }

          setProgress(20 + (i / opportunitiesWithoutOrder.length) * 30);
        }
      }

      setProgress(50);

      // 3. CORRIGIR ORDERS SEM COMMISSION
      addLog('💰 Verificando pedidos sem comissão...', 'info');
      
      // Recarregar orders após criação
      const updatedOrders = await base44.entities.Order.list('-created_date', 2000);
      
      const ordersWithoutCommission = updatedOrders.filter(order => {
        return !commissions.some(comm => comm.order_id === order.id);
      });

      addLog(`Encontrados ${ordersWithoutCommission.length} pedidos sem comissão`, ordersWithoutCommission.length > 0 ? 'warning' : 'success');

      if (ordersWithoutCommission.length > 0) {
        for (let i = 0; i < ordersWithoutCommission.length; i++) {
          const order = ordersWithoutCommission[i];
          
          try {
            // Buscar principal para taxa de comissão
            const principal = principals.find(p => p.id === order.principal_id);
            const commissionRate = principal?.commission_percentage || 3;

            // Calcular comissão
            const salesValue = order.total_value || 0;
            const commissionValue = (salesValue * commissionRate) / 100;

            const commissionData = {
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
            };

            await base44.entities.Commission.create(commissionData);
            
            stats.commissionsCreated++;
            addLog(`✅ Comissão criada para pedido ${order.client_name}`, 'success');
          } catch (error) {
            stats.errors.push(`Pedido ${order.id}: ${error.message}`);
            addLog(`❌ Erro ao criar comissão para ${order.client_name}: ${error.message}`, 'error');
          }

          setProgress(50 + (i / ordersWithoutCommission.length) * 40);
        }
      }

      setProgress(90);

      // 4. CRIAR PARCELAS PARA COMISSÕES SEM PARCELAS
      addLog('💳 Verificando comissões sem parcelas...', 'info');
      
      const updatedCommissions = await base44.entities.Commission.list('-created_date', 2000);
      const installments = await base44.entities.CommissionInstallment.list('-created_date', 5000);
      
      const commissionsWithoutInstallments = updatedCommissions.filter(comm => {
        return !installments.some(inst => inst.commission_id === comm.id);
      });

      addLog(`Encontradas ${commissionsWithoutInstallments.length} comissões sem parcelas`, commissionsWithoutInstallments.length > 0 ? 'warning' : 'success');

      if (commissionsWithoutInstallments.length > 0) {
        for (const commission of commissionsWithoutInstallments) {
          try {
            const principal = principals.find(p => p.id === commission.principal_id);
            const dueDate = new Date(commission.invoice_date || commission.created_date);
            dueDate.setDate(dueDate.getDate() + (principal?.payment_day || 30));

            await base44.entities.CommissionInstallment.create({
              commission_id: commission.id,
              representada_id: commission.principal_id,
              order_id: commission.order_id,
              installment_no: 1,
              installment_pct: 100,
              installment_value: commission.commission_total_value,
              due_date: dueDate.toISOString().split('T')[0],
              status: 'prevista',
              reference_month: new Date(commission.invoice_date || commission.created_date).toISOString().slice(0, 7)
            });

            addLog(`✅ Parcela criada para comissão ${commission.client_name}`, 'success');
          } catch (error) {
            addLog(`⚠️ Erro ao criar parcela para comissão ${commission.id}`, 'warning');
          }
        }
      }

      setProgress(100);
      setResults(stats);
      addLog('✨ Correção concluída!', 'success');
      toast.success('Fluxo integrado corrigido!');

    } catch (error) {
      console.error('Erro ao corrigir fluxo:', error);
      addLog(`❌ ERRO GERAL: ${error.message}`, 'error');
      toast.error('Erro ao corrigir fluxo');
      stats.errors.push(`Erro geral: ${error.message}`);
      setResults(stats);
    } finally {
      setFixing(false);
    }
  };

  return (
    <div className="space-y-6 pb-20 lg:pb-6">
      <PageHeader 
        title="Correção do Fluxo Integrado"
        subtitle="Corrigir oportunidades, pedidos e comissões com dados inconsistentes"
      />

      <Card>
        <CardHeader>
          <CardTitle>Correção Automática</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert>
            <Wrench className="w-4 h-4" />
            <AlertDescription>
              <strong>Esta operação irá:</strong>
              <ul className="list-disc ml-6 mt-2 space-y-1">
                <li>Criar pedidos para oportunidades ganhas sem pedido</li>
                <li>Criar comissões para todos os pedidos sem comissão</li>
                <li>Criar parcelas para comissões sem parcelas</li>
                <li>Vincular corretamente todos os registros</li>
              </ul>
            </AlertDescription>
          </Alert>

          {!fixing && !results && (
            <Button 
              onClick={fixIntegratedFlow}
              className="w-full bg-[#0F2A44] hover:bg-[#1F4E79]"
              size="lg"
            >
              <Wrench className="w-5 h-5 mr-2" />
              Iniciar Correção Automática
            </Button>
          )}

          {fixing && (
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <Loader2 className="w-5 h-5 animate-spin text-blue-600" />
                <span className="font-medium">Corrigindo dados...</span>
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
              <Alert className={results.errors.length > 0 ? 'bg-amber-50 border-amber-200' : 'bg-emerald-50 border-emerald-200'}>
                {results.errors.length > 0 ? (
                  <AlertTriangle className="w-4 h-4 text-amber-600" />
                ) : (
                  <CheckCircle className="w-4 h-4 text-emerald-600" />
                )}
                <AlertDescription className={results.errors.length > 0 ? 'text-amber-900' : 'text-emerald-900'}>
                  <strong>
                    {results.errors.length > 0 ? 'Correção concluída com avisos' : 'Correção concluída com sucesso!'}
                  </strong>
                </AlertDescription>
              </Alert>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-3 mb-2">
                      <CheckCircle className="w-8 h-8 text-emerald-600" />
                      <div>
                        <p className="text-3xl font-bold">{results.opportunitiesFixed}</p>
                        <p className="text-sm text-slate-600">Oportunidades Corrigidas</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-3 mb-2">
                      <FileText className="w-8 h-8 text-blue-600" />
                      <div>
                        <p className="text-3xl font-bold">{results.ordersCreated}</p>
                        <p className="text-sm text-slate-600">Pedidos Criados</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-3 mb-2">
                      <DollarSign className="w-8 h-8 text-purple-600" />
                      <div>
                        <p className="text-3xl font-bold">{results.commissionsCreated}</p>
                        <p className="text-sm text-slate-600">Comissões Criadas</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {results.errors.length > 0 && (
                <Card className="border-amber-200">
                  <CardHeader>
                    <CardTitle className="text-amber-800">Erros Encontrados</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {results.errors.map((error, i) => (
                        <div key={i} className="text-sm text-amber-700 bg-amber-50 p-2 rounded">
                          {error}
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              <Button 
                onClick={() => window.location.href = '/AuditFluxo'}
                className="w-full"
                size="lg"
              >
                Ver Auditoria Atualizada
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