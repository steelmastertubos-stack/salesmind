import React, { useState, useCallback } from 'react';
import { base44 } from '@/api/base44Client';
import {
  Database, Trash2, Zap, CheckCircle2, AlertCircle, Loader2,
  RefreshCw, ChevronRight, Building2, Users, Package, ShoppingCart,
  FileText, DollarSign, Target, ListChecks, BarChart3
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { PRINCIPALS, PRODUCT_SPECS } from '@/lib/demoData/masterData';
import { generateClients, generateProducts, generateOrdersAndQuotes, generateTasks, resetSeed, rand, randInt, pick } from '@/lib/demoData/generators';

// ===================================================
// HELPERS
// ===================================================
const sleep = (ms) => new Promise(r => setTimeout(r, ms));

const deleteAll = async (entity, log) => {
  log(`  🗑️  Removendo ${entity}...`);
  let page = 0;
  let total = 0;
  while (true) {
    const items = await base44.entities[entity].list('-created_date', 200);
    if (!items || items.length === 0) break;
    await Promise.all(items.map(i => base44.entities[entity].delete(i.id)));
    total += items.length;
    page++;
    if (page > 100) break; // safety
    await sleep(300);
  }
  log(`  ✅  ${entity}: ${total} registros removidos`);
};

const bulkCreate = async (entity, items, batchSize = 20, log) => {
  let created = 0;
  for (let i = 0; i < items.length; i += batchSize) {
    const batch = items.slice(i, i + batchSize);
    const results = await Promise.allSettled(batch.map(item => base44.entities[entity].create(item)));
    const ok = results.filter(r => r.status === 'fulfilled').map(r => r.value);
    created += ok.length;
    await sleep(200);
  }
  log(`  ✅  ${entity}: ${created} criados`);
  return created;
};

// ===================================================
// STEP DEFINITIONS
// ===================================================
const STEPS = [
  { key: 'reset', label: 'Apagar dados existentes', icon: Trash2, color: 'text-red-500' },
  { key: 'principals', label: 'Criar Representadas', icon: Building2, color: 'text-blue-500' },
  { key: 'products', label: 'Criar Produtos (50+)', icon: Package, color: 'text-purple-500' },
  { key: 'clients', label: 'Criar Clientes (200)', icon: Users, color: 'text-emerald-500' },
  { key: 'orders', label: 'Criar Pedidos (histórico 12 meses)', icon: ShoppingCart, color: 'text-orange-500' },
  { key: 'quotes', label: 'Criar Orçamentos e CRM', icon: FileText, color: 'text-indigo-500' },
  { key: 'commissions', label: 'Criar Comissões', icon: DollarSign, color: 'text-amber-500' },
  { key: 'tasks', label: 'Criar Tarefas e Follow-ups', icon: ListChecks, color: 'text-cyan-500' },
  { key: 'audit', label: 'Auditoria e Validação Final', icon: BarChart3, color: 'text-green-500' },
];

export default function DemoSetup() {
  const [isRunning, setIsRunning] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentStep, setCurrentStep] = useState(null);
  const [completedSteps, setCompletedSteps] = useState({});
  const [logs, setLogs] = useState([]);
  const [error, setError] = useState(null);
  const [auditResult, setAuditResult] = useState(null);
  const [done, setDone] = useState(false);

  const addLog = useCallback((msg) => {
    setLogs(prev => [...prev, `${new Date().toLocaleTimeString('pt-BR')} — ${msg}`]);
  }, []);

  const markStep = (key, status) => setCompletedSteps(prev => ({ ...prev, [key]: status }));

  const runSetup = async () => {
    setIsRunning(true);
    setDone(false);
    setError(null);
    setLogs([]);
    setCompletedSteps({});
    setProgress(0);
    setAuditResult(null);

    try {
      // ===== PASSO 1: RESET =====
      setCurrentStep('reset');
      addLog('🔴 Iniciando reset completo...');
      const entitiesToDelete = ['Task', 'LostDeal', 'Opportunity', 'Order', 'Quote', 'Commission', 'CommissionInstallment', 'Client', 'Product', 'Principal'];
      for (const entity of entitiesToDelete) {
        await deleteAll(entity, addLog);
      }
      markStep('reset', 'ok');
      setProgress(10);

      // ===== PASSO 2: REPRESENTADAS =====
      setCurrentStep('principals');
      addLog('🏢 Criando representadas...');
      const createdPrincipals = [];
      for (const p of PRINCIPALS) {
        const result = await base44.entities.Principal.create({
          company_name: p.name,
          trade_name: p.name,
          cnpj: p.cnpj,
          commission_policy: p.commission_policy,
          commission_percentage: p.commission_percentage,
          use_vtk_commission_table: p.use_vtk_commission_table,
          is_active: true,
          payment_day: pick([5, 10, 15, 20, 25]),
          city: pick(['São Paulo', 'Belo Horizonte', 'Curitiba', 'Porto Alegre']),
          state: pick(['SP', 'MG', 'PR', 'RS']),
        });
        createdPrincipals.push(result);
        await sleep(100);
      }
      addLog(`  ✅  Principals: ${createdPrincipals.length} criados`);
      markStep('principals', 'ok');
      setProgress(18);

      // ===== PASSO 3: PRODUTOS =====
      setCurrentStep('products');
      addLog('📦 Criando produtos...');
      const productData = generateProducts(createdPrincipals.map(p => p.id));
      const createdProducts = [];
      for (let i = 0; i < productData.length; i += 10) {
        const batch = productData.slice(i, i + 10);
        const results = await Promise.allSettled(batch.map(p => base44.entities.Product.create(p)));
        results.forEach(r => { if (r.status === 'fulfilled') createdProducts.push(r.value); });
        await sleep(200);
      }
      addLog(`  ✅  Products: ${createdProducts.length} criados`);
      markStep('products', 'ok');
      setProgress(28);

      // ===== PASSO 4: CLIENTES =====
      setCurrentStep('clients');
      addLog('👥 Criando 200 clientes fictícios...');
      const clientData = generateClients();
      const createdClients = [];
      for (let i = 0; i < clientData.length; i += 15) {
        const batch = clientData.slice(i, i + 15);
        const results = await Promise.allSettled(batch.map(c => base44.entities.Client.create(c)));
        results.forEach(r => { if (r.status === 'fulfilled') createdClients.push(r.value); });
        const pct = 28 + Math.round((i / clientData.length) * 20);
        setProgress(pct);
        await sleep(250);
      }
      addLog(`  ✅  Clients: ${createdClients.length} criados`);
      markStep('clients', 'ok');
      setProgress(48);

      // ===== PASSO 5+6+7: PEDIDOS, ORÇAMENTOS, OPORTUNIDADES, COMISSÕES =====
      setCurrentStep('orders');
      addLog('🛒 Gerando histórico de 12 meses (pedidos, orçamentos, CRM)...');

      const { orders, quotes, opportunities, lostDeals, commissions } = generateOrdersAndQuotes(
        createdClients, createdProducts, createdPrincipals, 2025
      );

      addLog(`  📊  Gerados: ${orders.length} pedidos | ${quotes.length} orçamentos | ${opportunities.length} oportunidades`);

      // Criar pedidos em lotes
      const createdOrders = [];
      for (let i = 0; i < orders.length; i += 15) {
        const batch = orders.slice(i, i + 15);
        const results = await Promise.allSettled(batch.map(o => base44.entities.Order.create(o)));
        results.forEach(r => { if (r.status === 'fulfilled') createdOrders.push(r.value); });
        const pct = 48 + Math.round((i / orders.length) * 12);
        setProgress(pct);
        await sleep(300);
      }
      addLog(`  ✅  Orders: ${createdOrders.length} criados`);
      markStep('orders', 'ok');
      setProgress(60);

      // Criar orçamentos
      setCurrentStep('quotes');
      const createdQuotes = [];
      for (let i = 0; i < quotes.length; i += 15) {
        const batch = quotes.slice(i, i + 15);
        const results = await Promise.allSettled(batch.map(q => base44.entities.Quote.create(q)));
        results.forEach(r => { if (r.status === 'fulfilled') createdQuotes.push(r.value); });
        const pct = 60 + Math.round((i / quotes.length) * 8);
        setProgress(pct);
        await sleep(300);
      }
      addLog(`  ✅  Quotes: ${createdQuotes.length} criados`);

      // Criar oportunidades
      const createdOpps = [];
      for (let i = 0; i < opportunities.length; i += 15) {
        const batch = opportunities.slice(i, i + 15);
        const results = await Promise.allSettled(batch.map(o => base44.entities.Opportunity.create(o)));
        results.forEach(r => { if (r.status === 'fulfilled') createdOpps.push(r.value); });
        await sleep(200);
      }
      addLog(`  ✅  Opportunities: ${createdOpps.length} criados`);

      // Criar perdas
      const lostCreated = [];
      for (let i = 0; i < lostDeals.length; i += 10) {
        const batch = lostDeals.slice(i, i + 10);
        const results = await Promise.allSettled(batch.map(l => base44.entities.LostDeal.create(l)));
        results.forEach(r => { if (r.status === 'fulfilled') lostCreated.push(r.value); });
        await sleep(200);
      }
      addLog(`  ✅  LostDeals: ${lostCreated.length} criados`);
      markStep('quotes', 'ok');
      setProgress(70);

      // ===== PASSO 7: COMISSÕES =====
      setCurrentStep('commissions');
      addLog('💰 Criando comissões vinculadas...');

      // Vincular order_id nas comissões
      const orderByNum = {};
      createdOrders.forEach(o => { if (o.order_number) orderByNum[o.order_number] = o.id; });
      const commissionsWithId = commissions.map(c => ({
        ...c,
        order_id: orderByNum[c.order_number] || null,
      }));

      const createdComms = [];
      for (let i = 0; i < commissionsWithId.length; i += 15) {
        const batch = commissionsWithId.slice(i, i + 15);
        const results = await Promise.allSettled(batch.map(c => base44.entities.Commission.create(c)));
        results.forEach(r => { if (r.status === 'fulfilled') createdComms.push(r.value); });
        const pct = 70 + Math.round((i / commissionsWithId.length) * 12);
        setProgress(pct);
        await sleep(250);
      }
      addLog(`  ✅  Commissions: ${createdComms.length} criadas`);
      markStep('commissions', 'ok');
      setProgress(82);

      // ===== PASSO 8: TAREFAS =====
      setCurrentStep('tasks');
      addLog('📋 Criando tarefas e follow-ups...');
      const taskData = generateTasks(createdClients);
      const createdTasks = [];
      for (let i = 0; i < taskData.length; i += 10) {
        const batch = taskData.slice(i, i + 10);
        const results = await Promise.allSettled(batch.map(t => base44.entities.Task.create(t)));
        results.forEach(r => { if (r.status === 'fulfilled') createdTasks.push(r.value); });
        await sleep(200);
      }
      addLog(`  ✅  Tasks: ${createdTasks.length} criadas`);
      markStep('tasks', 'ok');
      setProgress(90);

      // ===== PASSO 9: AUDITORIA =====
      setCurrentStep('audit');
      addLog('🔍 Executando auditoria final...');
      await sleep(500);

      const totalRevenue = createdOrders.reduce((s, o) => s + (o.total_value || 0), 0);
      const totalCommissions = createdComms.reduce((s, c) => s + (c.commission_total_value || 0), 0);
      const openOpps = createdOpps.filter(o => ['proposta_enviada', 'em_negociacao'].includes(o.stage));
      const atRiskClients = createdClients.filter(c => c.status === 'at_risk');

      setAuditResult({
        principals: createdPrincipals.length,
        products: createdProducts.length,
        clients: createdClients.length,
        orders: createdOrders.length,
        quotes: createdQuotes.length,
        opportunities: createdOpps.length,
        lostDeals: lostCreated.length,
        commissions: createdComms.length,
        tasks: createdTasks.length,
        totalRevenue,
        totalCommissions,
        openOpportunities: openOpps.length,
        openValue: openOpps.reduce((s, o) => s + (o.value_estimated || 0), 0),
        atRiskClients: atRiskClients.length,
        winRate: createdOpps.length > 0 ? Math.round((createdOpps.filter(o => o.stage === 'ganho').length / createdOpps.length) * 100) : 0,
      });

      markStep('audit', 'ok');
      setProgress(100);
      setCurrentStep(null);
      setDone(true);
      addLog('🎉 AMBIENTE DE DEMONSTRAÇÃO CRIADO COM SUCESSO!');

    } catch (err) {
      console.error(err);
      setError(err.message || 'Erro inesperado durante a geração');
      addLog(`❌ ERRO: ${err.message}`);
    } finally {
      setIsRunning(false);
    }
  };

  const fmt = (v) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(v || 0);

  return (
    <div className="pb-20 lg:pb-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="bg-gradient-to-br from-[#0F2A44] to-[#1F4E79] rounded-2xl p-6 mb-6 text-white">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 bg-[#1DB954] rounded-xl flex items-center justify-center">
            <Database className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold">Ambiente de Demonstração</h1>
            <p className="text-blue-200 text-sm">Geração automática de base histórica fictícia — 12 meses de operação</p>
          </div>
        </div>

        {!done && !isRunning && (
          <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-3 text-center">
            {[
              { icon: Building2, label: '6 Representadas', sub: 'Fictícias' },
              { icon: Users, label: '200 Clientes', sub: 'Distribuídos' },
              { icon: Package, label: '50+ Produtos', sub: 'Catalogo' },
              { icon: ShoppingCart, label: '~800 Pedidos', sub: '12 meses' },
            ].map(({ icon: Icon, label, sub }) => (
              <div key={label} className="bg-white/10 rounded-xl p-3">
                <Icon className="w-5 h-5 mx-auto mb-1 text-[#1DB954]" />
                <p className="text-xs font-bold">{label}</p>
                <p className="text-[10px] text-blue-300">{sub}</p>
              </div>
            ))}
          </div>
        )}

        <div className="mt-4 p-3 bg-red-900/30 border border-red-400/30 rounded-xl">
          <p className="text-red-300 text-xs font-medium">
            ⚠️ ATENÇÃO: Este processo apagará TODOS os dados atuais (clientes, pedidos, produtos, etc) e criará novos dados fictícios. Use apenas em ambiente de demonstração.
          </p>
        </div>
      </div>

      {/* Steps */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 mb-4">
        <h3 className="font-semibold text-slate-800 mb-3 text-sm">Etapas do Processo</h3>
        <div className="space-y-2">
          {STEPS.map((step) => {
            const status = completedSteps[step.key];
            const isActive = currentStep === step.key;
            const Icon = step.icon;
            return (
              <div key={step.key} className={`flex items-center gap-3 p-2.5 rounded-xl transition-all ${isActive ? 'bg-blue-50 border border-blue-200' : status === 'ok' ? 'bg-emerald-50' : 'bg-slate-50'}`}>
                <div className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 ${isActive ? 'bg-blue-500' : status === 'ok' ? 'bg-emerald-500' : 'bg-slate-200'}`}>
                  {isActive ? <Loader2 className="w-4 h-4 text-white animate-spin" /> :
                    status === 'ok' ? <CheckCircle2 className="w-4 h-4 text-white" /> :
                    <Icon className={`w-4 h-4 ${status ? step.color : 'text-slate-400'}`} />}
                </div>
                <span className={`text-sm font-medium flex-1 ${isActive ? 'text-blue-700' : status === 'ok' ? 'text-emerald-700' : 'text-slate-600'}`}>
                  {step.label}
                </span>
                {status === 'ok' && <Badge className="bg-emerald-100 text-emerald-700 text-[10px]">✓ OK</Badge>}
                {isActive && <Badge className="bg-blue-100 text-blue-700 text-[10px] animate-pulse">Em andamento...</Badge>}
              </div>
            );
          })}
        </div>
      </div>

      {/* Progress */}
      {isRunning && (
        <div className="bg-white rounded-2xl border border-slate-200 p-4 mb-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-semibold text-slate-700">Progresso</span>
            <span className="text-sm font-bold text-blue-600">{progress}%</span>
          </div>
          <Progress value={progress} className="h-3 mb-2" />
          <p className="text-xs text-slate-400">Aguarde, isso pode levar alguns minutos...</p>
        </div>
      )}

      {/* Audit Result */}
      {auditResult && (
        <div className="bg-white rounded-2xl border border-emerald-200 p-4 mb-4">
          <div className="flex items-center gap-2 mb-4">
            <CheckCircle2 className="w-5 h-5 text-emerald-500" />
            <h3 className="font-bold text-emerald-800">Auditoria Completa — Ambiente Pronto!</h3>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-4">
            {[
              { label: 'Representadas', value: auditResult.principals, color: 'blue' },
              { label: 'Produtos', value: auditResult.products, color: 'purple' },
              { label: 'Clientes', value: auditResult.clients, color: 'emerald' },
              { label: 'Pedidos', value: auditResult.orders, color: 'orange' },
              { label: 'Orçamentos', value: auditResult.quotes, color: 'indigo' },
              { label: 'Oportunidades', value: auditResult.opportunities, color: 'cyan' },
              { label: 'Perdas Registradas', value: auditResult.lostDeals, color: 'red' },
              { label: 'Comissões', value: auditResult.commissions, color: 'amber' },
              { label: 'Tarefas', value: auditResult.tasks, color: 'teal' },
            ].map(({ label, value, color }) => (
              <div key={label} className="bg-slate-50 rounded-xl p-3 text-center">
                <p className="text-xl font-bold text-slate-800">{value}</p>
                <p className="text-[10px] text-slate-500 mt-0.5">{label}</p>
              </div>
            ))}
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 bg-slate-50 rounded-xl p-3">
            <div className="text-center">
              <p className="text-sm font-bold text-emerald-700">{fmt(auditResult.totalRevenue)}</p>
              <p className="text-[10px] text-slate-500">Faturamento Total</p>
            </div>
            <div className="text-center">
              <p className="text-sm font-bold text-amber-700">{fmt(auditResult.totalCommissions)}</p>
              <p className="text-[10px] text-slate-500">Total Comissões</p>
            </div>
            <div className="text-center">
              <p className="text-sm font-bold text-blue-700">{fmt(auditResult.openValue)}</p>
              <p className="text-[10px] text-slate-500">Pipeline Aberto</p>
            </div>
            <div className="text-center">
              <p className="text-sm font-bold text-purple-700">{auditResult.winRate}%</p>
              <p className="text-[10px] text-slate-500">Taxa de Conversão</p>
            </div>
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            {[
              `✅ CRM: ${auditResult.openOpportunities} oportunidades abertas`,
              `⚠️ ${auditResult.atRiskClients} clientes em risco`,
              `📊 12 meses de histórico`,
              `🎯 Sazonalidade configurada`,
              `💡 Insights IA disponíveis`,
            ].map(tag => (
              <Badge key={tag} variant="outline" className="text-[11px]">{tag}</Badge>
            ))}
          </div>
          <div className="mt-4 flex flex-wrap gap-3">
            <a href="/Dashboard" className="flex-1">
              <Button className="w-full bg-[#1DB954] hover:bg-[#17a349] text-white">
                <Zap className="w-4 h-4 mr-2" />Ver Dashboard
              </Button>
            </a>
            <a href="/Reports" className="flex-1">
              <Button variant="outline" className="w-full">
                <BarChart3 className="w-4 h-4 mr-2" />Ver Relatórios
              </Button>
            </a>
          </div>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-4 mb-4">
          <div className="flex items-center gap-2 mb-2">
            <AlertCircle className="w-4 h-4 text-red-500" />
            <p className="text-red-700 font-semibold text-sm">Erro na geração</p>
          </div>
          <p className="text-red-600 text-xs">{error}</p>
          <Button variant="outline" size="sm" className="mt-3" onClick={runSetup}>
            <RefreshCw className="w-3.5 h-3.5 mr-2" />Tentar novamente
          </Button>
        </div>
      )}

      {/* Log Console */}
      {logs.length > 0 && (
        <div className="bg-slate-900 rounded-2xl p-4 mb-4 max-h-56 overflow-y-auto">
          <p className="text-slate-400 text-[10px] font-mono mb-2">// Console de execução</p>
          {logs.map((log, i) => (
            <p key={i} className={`text-[11px] font-mono leading-relaxed ${log.includes('✅') ? 'text-emerald-400' : log.includes('❌') ? 'text-red-400' : log.includes('🎉') ? 'text-yellow-300' : 'text-slate-300'}`}>
              {log}
            </p>
          ))}
        </div>
      )}

      {/* CTA Button */}
      {!done && (
        <Button
          onClick={runSetup}
          disabled={isRunning}
          size="lg"
          className="w-full bg-gradient-to-r from-[#0F2A44] to-[#1F4E79] hover:from-[#1F4E79] hover:to-[#2d5f94] text-white font-bold h-14 text-base rounded-2xl shadow-lg"
        >
          {isRunning ? (
            <>
              <Loader2 className="w-5 h-5 mr-3 animate-spin" />
              Gerando base de dados... {progress}%
            </>
          ) : (
            <>
              <Zap className="w-5 h-5 mr-3" />
              🚀 Gerar Ambiente de Demonstração Completo
            </>
          )}
        </Button>
      )}

      {done && (
        <Button
          onClick={() => { setDone(false); setCompletedSteps({}); setLogs([]); setAuditResult(null); setProgress(0); }}
          variant="outline"
          className="w-full"
        >
          <RefreshCw className="w-4 h-4 mr-2" />
          Gerar novamente (apagará tudo)
        </Button>
      )}
    </div>
  );
}