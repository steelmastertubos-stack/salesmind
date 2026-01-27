import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import PageHeader from '@/components/common/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  PlayCircle,
  RotateCcw,
  Download,
  Loader2,
  CheckSquare,
  Zap
} from 'lucide-react';
import { toast } from 'sonner';
import {
  auditOpportunities,
  auditOrders,
  auditCommissions,
  auditClients,
  auditDataConsistency
} from '@/components/audit/auditValidators';
import auditLogger from '@/components/audit/auditLogger';

export default function AuditComplete() {
  const [running, setRunning] = useState(false);
  const [auditResults, setAuditResults] = useState(null);
  const queryClient = useQueryClient();

  const auditModules = [
    { id: 'opportunities', name: 'Oportunidades', icon: '🎯', fn: auditOpportunities },
    { id: 'orders', name: 'Pedidos', icon: '📦', fn: auditOrders },
    { id: 'commissions', name: 'Comissões', icon: '💰', fn: auditCommissions },
    { id: 'clients', name: 'Clientes', icon: '👥', fn: auditClients },
    { id: 'consistency', name: 'Consistência', icon: '⚙️', fn: auditDataConsistency }
  ];

  const handleRunAudit = async () => {
    try {
      setRunning(true);
      auditLogger.start('AUDITORIA TOTAL DO SISTEMA');

      const results = {};
      let totalIssues = 0;
      let totalFixes = 0;

      for (const module of auditModules) {
        try {
          results[module.id] = await module.fn();
          totalIssues += results[module.id].issues.length;
          totalFixes += results[module.id].fixes.length;
        } catch (e) {
          results[module.id] = { passed: false, error: e.message, issues: [], fixes: [] };
          auditLogger.log(`${module.id.toUpperCase()}-ERR`, e.message, 'ERROR');
        }
      }

      auditLogger.end();
      const exportData = auditLogger.export();

      setAuditResults({
        modules: results,
        totalIssues,
        totalFixes,
        timestamp: new Date(),
        logs: exportData
      });

      // Invalidar queries para atualizar dados
      queryClient.invalidateQueries({ queryKey: ['opportunities'] });
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      queryClient.invalidateQueries({ queryKey: ['commissions'] });
      queryClient.invalidateQueries({ queryKey: ['clients'] });

      toast.success(`Auditoria concluída: ${totalIssues} problemas encontrados, ${totalFixes} corrigidos`);
    } catch (error) {
      toast.error(`Erro na auditoria: ${error.message}`);
      auditLogger.log('AUDIT-FATAL', error.message, 'ERROR');
    } finally {
      setRunning(false);
    }
  };

  const handleExportReport = () => {
    if (!auditResults) return;

    const report = {
      timestamp: auditResults.timestamp,
      totalIssues: auditResults.totalIssues,
      totalFixes: auditResults.totalFixes,
      modules: auditResults.modules,
      logs: auditResults.logs
    };

    const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `audit-report-${new Date().toISOString().split('T')[0]}.json`;
    link.click();

    toast.success('Relatório exportado');
  };

  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'CRITICAL':
        return 'bg-red-100 text-red-800';
      case 'HIGH':
        return 'bg-orange-100 text-orange-800';
      case 'MEDIUM':
        return 'bg-yellow-100 text-yellow-800';
      case 'LOW':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-slate-100 text-slate-800';
    }
  };

  const getSeverityIcon = (severity) => {
    switch (severity) {
      case 'CRITICAL':
        return <AlertTriangle className="w-4 h-4" />;
      case 'HIGH':
        return <AlertCircle className="w-4 h-4" />;
      case 'INFO':
        return <CheckCircle2 className="w-4 h-4 text-green-600" />;
      default:
        return <Zap className="w-4 h-4" />;
    }
  };

  return (
    <div className="pb-20 lg:pb-6 space-y-6">
      <PageHeader
        title="🔍 Auditoria Completa do Sistema"
        subtitle="Validação e auto-correção de integridade de dados"
      />

      {/* Status Card */}
      <Card className="border-2 border-blue-200 bg-gradient-to-br from-blue-50 to-indigo-50">
        <CardContent className="p-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-slate-900 mb-1">Estado do Sistema</h3>
                <p className="text-sm text-slate-600">
                  {auditResults
                    ? `Última auditoria: ${auditResults.timestamp.toLocaleString()}`
                    : 'Nenhuma auditoria executada ainda'}
                </p>
              </div>
              <Button
                onClick={handleRunAudit}
                disabled={running}
                className="bg-blue-600 hover:bg-blue-700"
                size="lg"
              >
                {running ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Executando...
                  </>
                ) : (
                  <>
                    <PlayCircle className="w-4 h-4 mr-2" />
                    Executar Auditoria Total
                  </>
                )}
              </Button>
            </div>

            {auditResults && (
              <div className="grid grid-cols-3 gap-3">
                <div className="bg-white rounded-lg p-3 border border-blue-200">
                  <p className="text-xs text-slate-600 mb-1">Problemas Encontrados</p>
                  <p className="text-2xl font-bold text-slate-900">{auditResults.totalIssues}</p>
                </div>
                <div className="bg-white rounded-lg p-3 border border-green-200">
                  <p className="text-xs text-slate-600 mb-1">Corrigidos</p>
                  <p className="text-2xl font-bold text-green-600">{auditResults.totalFixes}</p>
                </div>
                <div className="bg-white rounded-lg p-3 border border-orange-200">
                  <p className="text-xs text-slate-600 mb-1">Requerem Ação</p>
                  <p className="text-2xl font-bold text-orange-600">
                    {auditResults.totalIssues - auditResults.totalFixes}
                  </p>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Results by Module */}
      {auditResults && (
        <>
          <div className="grid gap-4">
            {auditModules.map((module) => {
              const result = auditResults.modules[module.id];
              const hasIssues = result?.issues?.length > 0;
              const isFixed = result?.fixes?.length > 0;

              return (
                <Card key={module.id} className={hasIssues ? 'border-orange-200' : 'border-green-200'}>
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-xl">{module.icon}</span>
                        <div>
                          <CardTitle className="text-base">{module.name}</CardTitle>
                          <p className="text-xs text-slate-600 mt-0.5">
                            {result?.totalChecked || 0} registros verificados
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {isFixed && (
                          <Badge className="bg-green-100 text-green-800">
                            <CheckCircle2 className="w-3 h-3 mr-1" />
                            {result.fixes.length} corrigido
                          </Badge>
                        )}
                        {hasIssues && (
                          <Badge className={getSeverityColor('HIGH')}>
                            {result.issues.length} problema
                          </Badge>
                        )}
                        {!hasIssues && (
                          <Badge className="bg-green-100 text-green-800">
                            <CheckCircle2 className="w-3 h-3 mr-1" />
                            OK
                          </Badge>
                        )}
                      </div>
                    </div>
                  </CardHeader>

                  {(hasIssues || isFixed) && (
                    <CardContent className="space-y-2">
                      {result.issues.slice(0, 5).map((issue, idx) => (
                        <div key={idx} className="flex items-start gap-2 p-2 bg-slate-50 rounded">
                          <div className="mt-0.5">{getSeverityIcon(issue.severity)}</div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-mono text-slate-600">{issue.rule}</span>
                              <Badge className={getSeverityColor(issue.severity)} variant="outline">
                                {issue.severity}
                              </Badge>
                              {issue.autoFix && (
                                <Badge className="bg-green-50 text-green-700 text-[10px]">AUTO-FIX</Badge>
                              )}
                            </div>
                            <p className="text-sm text-slate-700 mt-1">{issue.message}</p>
                            <p className="text-xs text-slate-500 mt-1">ID: {issue.entityId}</p>
                          </div>
                        </div>
                      ))}

                      {result.issues.length > 5 && (
                        <p className="text-xs text-slate-500 p-2">
                          +{result.issues.length - 5} outros problemas...
                        </p>
                      )}
                    </CardContent>
                  )}
                </Card>
              );
            })}
          </div>

          {/* Export Button */}
          <div className="flex gap-2">
            <Button onClick={handleExportReport} variant="outline" className="flex-1">
              <Download className="w-4 h-4 mr-2" />
              Exportar Relatório JSON
            </Button>
            <Button
              onClick={() => setAuditResults(null)}
              variant="outline"
              className="flex-1"
            >
              <RotateCcw className="w-4 h-4 mr-2" />
              Limpar Resultados
            </Button>
          </div>
        </>
      )}

      {/* Info Card */}
      <Card className="bg-slate-50 border-slate-200">
        <CardHeader>
          <CardTitle className="text-base">ℹ️ Sobre a Auditoria</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-slate-700">
          <p>
            • <strong>Idempotente:</strong> Seguro executar múltiplas vezes sem duplicar dados
          </p>
          <p>
            • <strong>Auto-correção:</strong> Corrige automaticamente problemas conhecidos e seguros
          </p>
          <p>
            • <strong>Problemas críticos:</strong> Marcados para revisão manual (ex: cliente faltando)
          </p>
          <p>
            • <strong>Conectividade total:</strong> Valida cadeia Oportunidade → Pedido → Comissão
          </p>
          <p>
            • <strong>Relatório completo:</strong> JSON com todos os detalhes, regras e evidências
          </p>
        </CardContent>
      </Card>
    </div>
  );
}