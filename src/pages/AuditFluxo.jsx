import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import PageHeader from '@/components/common/PageHeader';
import { IntegrationValidator } from '@/components/utils/integrationValidator';
import { AuditFixer } from '@/components/utils/auditFixer';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { AlertTriangle, CheckCircle2, AlertCircle, Zap, RefreshCw, Wrench, Loader2 } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';

export default function AuditFluxo() {
  const [auditResult, setAuditResult] = useState(null);
  const [isRunning, setIsRunning] = useState(false);
  const [isFixing, setIsFixing] = useState(false);
  const queryClient = useQueryClient();

  const { data: quotes = [] } = useQuery({
    queryKey: ['quotes'],
    queryFn: () => base44.entities.Quote.list('-created_date', 500)
  });

  const { data: opportunities = [] } = useQuery({
    queryKey: ['opportunities'],
    queryFn: () => base44.entities.Opportunity.list('-created_date', 500)
  });

  const { data: orders = [] } = useQuery({
    queryKey: ['orders'],
    queryFn: () => base44.entities.Order.list('-created_date', 500)
  });

  const { data: commissions = [] } = useQuery({
    queryKey: ['commissions'],
    queryFn: () => base44.entities.Commission.list('-created_date', 500)
  });

  const { data: clients = [] } = useQuery({
    queryKey: ['clients'],
    queryFn: () => base44.entities.Client.list('company_name', 500)
  });

  const { data: principals = [] } = useQuery({
    queryKey: ['principals'],
    queryFn: () => base44.entities.Principal.list('company_name', 200)
  });

  const runAudit = async () => {
    setIsRunning(true);
    try {
      const validator = new IntegrationValidator(quotes, opportunities, orders, commissions, clients);
      const result = validator.runFullAudit();
      setAuditResult(result);
    } catch (error) {
      console.error('Erro ao executar auditoria:', error);
    } finally {
      setIsRunning(false);
    }
  };

  useEffect(() => {
    if (quotes.length > 0 && opportunities.length >= 0 && orders.length >= 0 && commissions.length >= 0) {
      runAudit();
    }
  }, [quotes, opportunities, orders, commissions]);

  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'CRITICAL':
        return 'bg-red-100 text-red-800 border-red-300';
      case 'WARNING':
        return 'bg-amber-100 text-amber-800 border-amber-300';
      default:
        return 'bg-blue-100 text-blue-800 border-blue-300';
    }
  };

  const getSeverityIcon = (severity) => {
    switch (severity) {
      case 'CRITICAL':
        return <AlertTriangle className="w-5 h-5 text-red-600" />;
      case 'WARNING':
        return <AlertCircle className="w-5 h-5 text-amber-600" />;
      default:
        return <Zap className="w-5 h-5 text-blue-600" />;
    }
  };

  const runAutoFix = async () => {
    if (!auditResult || auditResult.critical === 0) {
      toast.info('Nenhum problema crítico para corrigir');
      return;
    }

    setIsFixing(true);
    try {
      const fixer = new AuditFixer();
      const result = await fixer.fixAllIssues(
        auditResult.issues,
        quotes,
        opportunities,
        orders,
        commissions,
        principals
      );

      toast.success(`✅ ${result.fixed} problemas corrigidos!`, {
        description: result.failed > 0 ? `${result.failed} falharam` : 'Todos os problemas foram resolvidos'
      });

      // Atualizar dados
      queryClient.invalidateQueries(['quotes']);
      queryClient.invalidateQueries(['opportunities']);
      queryClient.invalidateQueries(['orders']);
      queryClient.invalidateQueries(['commissions']);

      // Executar nova auditoria
      setTimeout(() => runAudit(), 1000);
    } catch (error) {
      console.error('Erro ao executar auto-fix:', error);
      toast.error('Erro ao corrigir problemas');
    } finally {
      setIsFixing(false);
    }
  };

  const isHealthy = !auditResult || auditResult.critical === 0;

  return (
    <div className="pb-20 lg:pb-6">
      <PageHeader
        title="🔍 Auditoria do Fluxo Integrado"
        subtitle="Validação automática da cadeia Quote → Opp → Order → Commission"
      >
        <div className="flex gap-2">
          <Button
            onClick={runAudit}
            disabled={isRunning || isFixing}
            variant="outline"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${isRunning ? 'animate-spin' : ''}`} />
            {isRunning ? 'Auditando...' : 'Executar Auditoria'}
          </Button>
          {auditResult && auditResult.critical > 0 && (
            <Button
              onClick={runAutoFix}
              disabled={isFixing || isRunning}
              className="bg-[#1DB954] hover:bg-[#15803d]"
            >
              {isFixing ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Corrigindo...
                </>
              ) : (
                <>
                  <Wrench className="w-4 h-4 mr-2" />
                  Corrigir Problemas ({auditResult.critical})
                </>
              )}
            </Button>
          )}
        </div>
      </PageHeader>

      {/* Health Status */}
      {auditResult && (
        <div className={`rounded-xl p-6 mb-6 border-2 ${
          isHealthy
            ? 'bg-emerald-50 border-emerald-300'
            : 'bg-red-50 border-red-300'
        }`}>
          <div className="flex items-center justify-between">
            <div>
              <h3 className={`text-lg font-bold ${isHealthy ? 'text-emerald-900' : 'text-red-900'}`}>
                {isHealthy ? '✅ Sistema Saudável' : '⚠️ Sistema com Inconsistências'}
              </h3>
              <p className={`text-sm mt-1 ${isHealthy ? 'text-emerald-700' : 'text-red-700'}`}>
                Total de Issues: {auditResult.totalIssues} ({auditResult.critical} críticas, {auditResult.warning} avisos)
              </p>
            </div>
            {isHealthy ? (
              <CheckCircle2 className="w-12 h-12 text-emerald-600" />
            ) : (
              <AlertTriangle className="w-12 h-12 text-red-600" />
            )}
          </div>
        </div>
      )}

      {/* Summary Cards */}
      {auditResult && (
        <div className="grid grid-cols-3 gap-4 mb-6">
          <Card>
            <CardContent className="pt-6 text-center">
              <p className="text-3xl font-bold text-slate-900">{auditResult.totalIssues}</p>
              <p className="text-sm text-slate-600 mt-1">Problemas Encontrados</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6 text-center">
              <p className="text-3xl font-bold text-red-600">{auditResult.critical}</p>
              <p className="text-sm text-slate-600 mt-1">Críticas</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6 text-center">
              <p className="text-3xl font-bold text-amber-600">{auditResult.warning}</p>
              <p className="text-sm text-slate-600 mt-1">Avisos</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Issues by Module */}
      {auditResult && auditResult.issues.length > 0 && (
        <Tabs defaultValue="all" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="all">Todas ({auditResult.totalIssues})</TabsTrigger>
            <TabsTrigger value="critical">🔴 Críticas ({auditResult.critical})</TabsTrigger>
            <TabsTrigger value="warning">🟡 Avisos ({auditResult.warning})</TabsTrigger>
            <TabsTrigger value="modules">Por Módulo</TabsTrigger>
          </TabsList>

          {/* All Issues */}
          <TabsContent value="all" className="space-y-3">
            {auditResult.issues.map((issue) => (
              <Card key={issue.id} className={`border-l-4 ${getSeverityColor(issue.severity)}`}>
                <CardContent className="pt-4">
                  <div className="flex gap-4">
                    {getSeverityIcon(issue.severity)}
                    <div className="flex-1">
                      <div className="flex items-start justify-between mb-2">
                        <h4 className="font-semibold">{issue.entity}</h4>
                        <Badge className={getSeverityColor(issue.severity)}>
                          {issue.severity}
                        </Badge>
                      </div>
                      <p className="text-sm text-slate-700 mb-2">{issue.problem}</p>
                      <div className="grid grid-cols-2 gap-3 text-xs mb-2">
                        <div className="bg-white/50 p-2 rounded border">
                          <p className="text-slate-500">Esperado:</p>
                          <p className="font-mono text-slate-700">{issue.expected}</p>
                        </div>
                        <div className="bg-white/50 p-2 rounded border">
                          <p className="text-slate-500">Atual:</p>
                          <p className="font-mono text-slate-700">{issue.actual}</p>
                        </div>
                      </div>
                      <p className="text-xs text-slate-600">
                        <strong>Ação:</strong> {issue.fixAction}
                      </p>
                      {issue.value && (
                        <p className="text-xs text-slate-600 mt-1">
                          <strong>Valor:</strong> R$ {Number(issue.value).toLocaleString('pt-BR')}
                        </p>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </TabsContent>

          {/* Critical Only */}
          <TabsContent value="critical" className="space-y-3">
            {auditResult.issues
              .filter(i => i.severity === 'CRITICAL')
              .map((issue) => (
                <Card key={issue.id} className="border-l-4 bg-red-50 border-red-300">
                  <CardContent className="pt-4">
                    <div className="flex gap-4">
                      <AlertTriangle className="w-5 h-5 text-red-600 mt-1" />
                      <div className="flex-1">
                        <h4 className="font-semibold text-red-900">{issue.entity}</h4>
                        <p className="text-sm text-red-800 my-2">{issue.problem}</p>
                        <div className="bg-red-100 border border-red-300 rounded p-2 text-xs">
                          {issue.fixAction}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
          </TabsContent>

          {/* Warnings Only */}
          <TabsContent value="warning" className="space-y-3">
            {auditResult.issues
              .filter(i => i.severity === 'WARNING')
              .map((issue) => (
                <Card key={issue.id} className="border-l-4 bg-amber-50 border-amber-300">
                  <CardContent className="pt-4">
                    <div className="flex gap-4">
                      <AlertCircle className="w-5 h-5 text-amber-600 mt-1" />
                      <div className="flex-1">
                        <h4 className="font-semibold text-amber-900">{issue.entity}</h4>
                        <p className="text-sm text-amber-800 my-2">{issue.problem}</p>
                        <p className="text-xs text-amber-700">{issue.fixAction}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
          </TabsContent>

          {/* By Module */}
          <TabsContent value="modules" className="space-y-4">
            {Object.entries(auditResult.issues.reduce((acc, issue) => {
              if (!acc[issue.module]) acc[issue.module] = [];
              acc[issue.module].push(issue);
              return acc;
            }, {})).map(([module, issues]) => (
              <Card key={module}>
                <CardHeader>
                  <CardTitle className="text-base">{module}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {issues.map((issue) => (
                      <div
                        key={issue.id}
                        className={`p-3 rounded border-l-4 ${getSeverityColor(issue.severity)}`}
                      >
                        <p className="text-sm font-medium">{issue.entity}</p>
                        <p className="text-xs text-slate-600 mt-1">{issue.problem}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </TabsContent>
        </Tabs>
      )}

      {/* Empty State */}
      {!auditResult && (
        <Card>
          <CardContent className="pt-8 text-center pb-8">
            <Zap className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-500 mb-4">Clique em "Executar Auditoria" para iniciar validação</p>
          </CardContent>
        </Card>
      )}

      {/* Info Panel */}
      <Card className="mt-6 bg-blue-50 border-blue-200">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Zap className="w-5 h-5" />
            Sobre Auditoria
          </CardTitle>
        </CardHeader>
        <CardContent className="text-sm space-y-2 text-blue-900">
          <p>
            • <strong>CRÍTICA:</strong> Quebra o fluxo integrado (ex: Pedido sem comissão)
          </p>
          <p>
            • <strong>AVISO:</strong> Pode causar problemas (ex: status inconsistente)
          </p>
          <p>
            • Sistema ideal = 0 críticas, máximo 0 avisos
          </p>
        </CardContent>
      </Card>
    </div>
  );
}