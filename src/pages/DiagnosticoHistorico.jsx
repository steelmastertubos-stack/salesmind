import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Search } from 'lucide-react';
import PageHeader from '@/components/common/PageHeader';

export default function DiagnosticoHistorico() {
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState(null);

  const executeDiagnostic = async () => {
    setLoading(true);
    try {
      const [orders, opportunities] = await Promise.all([
        base44.entities.Order.list('-created_date', 5000),
        base44.entities.Opportunity.list('-created_date', 5000)
      ]);

      // A) Orders - intervalo de datas
      let minCreatedAt = null, maxCreatedAt = null;
      let minClosedAt = null, maxClosedAt = null;

      orders.forEach(o => {
        const created = new Date(o.created_date);
        const closed = o.billing_date ? new Date(o.billing_date) : null;

        if (!minCreatedAt || created < minCreatedAt) minCreatedAt = created;
        if (!maxCreatedAt || created > maxCreatedAt) maxCreatedAt = created;

        if (closed) {
          if (!minClosedAt || closed < minClosedAt) minClosedAt = closed;
          if (!maxClosedAt || closed > maxClosedAt) maxClosedAt = closed;
        }
      });

      // B) Orders por ano
      const ordersByYear = {};
      orders.forEach(o => {
        const year = new Date(o.created_date).getFullYear();
        if (!isNaN(year)) {
          ordersByYear[year] = (ordersByYear[year] || 0) + 1;
        }
      });

      const ordersByYearClosed = {};
      orders.forEach(o => {
        if (o.billing_date) {
          const year = new Date(o.billing_date).getFullYear();
          if (!isNaN(year)) {
            ordersByYearClosed[year] = (ordersByYearClosed[year] || 0) + 1;
          }
        }
      });

      // C) Opportunities - intervalo de datas
      let minOppCreated = null, maxOppCreated = null;
      let minWonAt = null, maxWonAt = null;

      opportunities.forEach(o => {
        const created = new Date(o.created_date);
        if (!minOppCreated || created < minOppCreated) minOppCreated = created;
        if (!maxOppCreated || created > maxOppCreated) maxOppCreated = created;

        if (o.stage === 'ganho' && o.updated_date) {
          const won = new Date(o.updated_date);
          if (!minWonAt || won < minWonAt) minWonAt = won;
          if (!maxWonAt || won > maxWonAt) maxWonAt = won;
        }
      });

      // D) Opportunities por ano
      const oppsByYear = {};
      opportunities.forEach(o => {
        const year = new Date(o.created_date).getFullYear();
        if (!isNaN(year)) {
          oppsByYear[year] = (oppsByYear[year] || 0) + 1;
        }
      });

      const wonByYear = {};
      opportunities.filter(o => o.stage === 'ganho').forEach(o => {
        const year = new Date(o.created_date).getFullYear();
        if (!isNaN(year)) {
          wonByYear[year] = (wonByYear[year] || 0) + 1;
        }
      });

      setResults({
        orders: {
          total: orders.length,
          minCreatedAt: minCreatedAt?.toISOString(),
          maxCreatedAt: maxCreatedAt?.toISOString(),
          minClosedAt: minClosedAt?.toISOString(),
          maxClosedAt: maxClosedAt?.toISOString(),
          byYearCreated: ordersByYear,
          byYearClosed: ordersByYearClosed
        },
        opportunities: {
          total: opportunities.length,
          minCreatedAt: minOppCreated?.toISOString(),
          maxCreatedAt: maxOppCreated?.toISOString(),
          minWonAt: minWonAt?.toISOString(),
          maxWonAt: maxWonAt?.toISOString(),
          byYear: oppsByYear,
          wonByYear: wonByYear
        }
      });
    } catch (error) {
      console.error('Erro ao executar diagnóstico:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 pb-20 lg:pb-6">
      <PageHeader 
        title="Diagnóstico – Histórico"
        subtitle="Validação de intervalos de datas e contagem por ano"
      />

      <Card>
        <CardContent className="pt-6">
          <Button 
            onClick={executeDiagnostic}
            disabled={loading}
            className="w-full bg-[#0F2A44] hover:bg-[#1F4E79]"
            size="lg"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                Executando Diagnóstico...
              </>
            ) : (
              <>
                <Search className="w-5 h-5 mr-2" />
                Executar Diagnóstico
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {results && (
        <>
          {/* A) Orders - intervalo de datas */}
          <Card>
            <CardHeader>
              <CardTitle>A) Orders (Pedidos) – Intervalo de Datas</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <p className="text-sm font-semibold text-blue-900 mb-2">Total de Pedidos</p>
                  <p className="text-3xl font-bold text-blue-600">{results.orders.total}</p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  <div className="bg-slate-50 p-4 rounded-lg">
                    <p className="text-sm font-semibold mb-2">created_date (created_at)</p>
                    <div className="space-y-1">
                      <p className="text-xs text-slate-600">MIN: <span className="font-mono font-bold">{results.orders.minCreatedAt || 'N/A'}</span></p>
                      <p className="text-xs text-slate-600">MAX: <span className="font-mono font-bold">{results.orders.maxCreatedAt || 'N/A'}</span></p>
                    </div>
                  </div>

                  <div className="bg-slate-50 p-4 rounded-lg">
                    <p className="text-sm font-semibold mb-2">billing_date (closed_at)</p>
                    <div className="space-y-1">
                      <p className="text-xs text-slate-600">MIN: <span className="font-mono font-bold">{results.orders.minClosedAt || 'N/A'}</span></p>
                      <p className="text-xs text-slate-600">MAX: <span className="font-mono font-bold">{results.orders.maxClosedAt || 'N/A'}</span></p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* B) Orders por ano */}
          <Card>
            <CardHeader>
              <CardTitle>B) Orders por Ano</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-semibold mb-3">Por created_date:</p>
                  {Object.keys(results.orders.byYearCreated).length > 0 ? (
                    <div className="space-y-2">
                      {Object.entries(results.orders.byYearCreated)
                        .sort(([a], [b]) => b - a)
                        .map(([year, count]) => (
                          <div key={year} className={`flex items-center justify-between p-3 rounded-lg ${year === '2025' ? 'bg-emerald-100 border-2 border-emerald-500' : 'bg-slate-50'}`}>
                            <span className="font-bold text-lg">{year}</span>
                            <span className="text-xl font-bold text-blue-600">{count} pedidos</span>
                          </div>
                        ))}
                    </div>
                  ) : (
                    <p className="text-slate-500">Nenhum pedido</p>
                  )}
                </div>

                <div>
                  <p className="text-sm font-semibold mb-3">Por billing_date (closed_at):</p>
                  {Object.keys(results.orders.byYearClosed).length > 0 ? (
                    <div className="space-y-2">
                      {Object.entries(results.orders.byYearClosed)
                        .sort(([a], [b]) => b - a)
                        .map(([year, count]) => (
                          <div key={year} className={`flex items-center justify-between p-3 rounded-lg ${year === '2025' ? 'bg-emerald-100 border-2 border-emerald-500' : 'bg-slate-50'}`}>
                            <span className="font-bold text-lg">{year}</span>
                            <span className="text-xl font-bold text-purple-600">{count} pedidos</span>
                          </div>
                        ))}
                    </div>
                  ) : (
                    <p className="text-slate-500">Nenhum pedido com billing_date</p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* C) Opportunities - intervalo de datas */}
          <Card>
            <CardHeader>
              <CardTitle>C) Opportunities (Negociações) – Intervalo de Datas</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="bg-purple-50 p-4 rounded-lg">
                  <p className="text-sm font-semibold text-purple-900 mb-2">Total de Oportunidades</p>
                  <p className="text-3xl font-bold text-purple-600">{results.opportunities.total}</p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  <div className="bg-slate-50 p-4 rounded-lg">
                    <p className="text-sm font-semibold mb-2">created_date (created_at)</p>
                    <div className="space-y-1">
                      <p className="text-xs text-slate-600">MIN: <span className="font-mono font-bold">{results.opportunities.minCreatedAt || 'N/A'}</span></p>
                      <p className="text-xs text-slate-600">MAX: <span className="font-mono font-bold">{results.opportunities.maxCreatedAt || 'N/A'}</span></p>
                    </div>
                  </div>

                  <div className="bg-slate-50 p-4 rounded-lg">
                    <p className="text-sm font-semibold mb-2">updated_date (won_at para ganhas)</p>
                    <div className="space-y-1">
                      <p className="text-xs text-slate-600">MIN: <span className="font-mono font-bold">{results.opportunities.minWonAt || 'N/A'}</span></p>
                      <p className="text-xs text-slate-600">MAX: <span className="font-mono font-bold">{results.opportunities.maxWonAt || 'N/A'}</span></p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* D) Opportunities por ano */}
          <Card>
            <CardHeader>
              <CardTitle>D) Opportunities por Ano</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-semibold mb-3">Por created_date:</p>
                  {Object.keys(results.opportunities.byYear).length > 0 ? (
                    <div className="space-y-2">
                      {Object.entries(results.opportunities.byYear)
                        .sort(([a], [b]) => b - a)
                        .map(([year, count]) => (
                          <div key={year} className={`flex items-center justify-between p-3 rounded-lg ${year === '2025' ? 'bg-emerald-100 border-2 border-emerald-500' : 'bg-slate-50'}`}>
                            <span className="font-bold text-lg">{year}</span>
                            <span className="text-xl font-bold text-purple-600">{count} oportunidades</span>
                          </div>
                        ))}
                    </div>
                  ) : (
                    <p className="text-slate-500">Nenhuma oportunidade</p>
                  )}
                </div>

                <div>
                  <p className="text-sm font-semibold mb-3">Oportunidades GANHAS por ano:</p>
                  {Object.keys(results.opportunities.wonByYear).length > 0 ? (
                    <div className="space-y-2">
                      {Object.entries(results.opportunities.wonByYear)
                        .sort(([a], [b]) => b - a)
                        .map(([year, count]) => (
                          <div key={year} className={`flex items-center justify-between p-3 rounded-lg ${year === '2025' ? 'bg-emerald-100 border-2 border-emerald-500' : 'bg-slate-50'}`}>
                            <span className="font-bold text-lg">{year}</span>
                            <span className="text-xl font-bold text-green-600">{count} ganhas</span>
                          </div>
                        ))}
                    </div>
                  ) : (
                    <p className="text-slate-500">Nenhuma oportunidade ganha</p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Resumo */}
          <Card className="border-2 border-blue-500">
            <CardHeader>
              <CardTitle>📊 Resumo – Anos Detectados</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <p className="font-semibold mb-2">Anos em Orders (created_date):</p>
                  <p className="font-mono text-lg">{Object.keys(results.orders.byYearCreated).sort((a, b) => b - a).join(', ') || 'Nenhum'}</p>
                </div>

                <div className="bg-purple-50 p-4 rounded-lg">
                  <p className="font-semibold mb-2">Anos em Opportunities (created_date):</p>
                  <p className="font-mono text-lg">{Object.keys(results.opportunities.byYear).sort((a, b) => b - a).join(', ') || 'Nenhum'}</p>
                </div>

                {(Object.keys(results.orders.byYearCreated).includes('2025') || Object.keys(results.opportunities.byYear).includes('2025')) ? (
                  <div className="bg-emerald-100 border-2 border-emerald-500 p-4 rounded-lg">
                    <p className="text-emerald-900 font-bold text-center text-lg">✅ 2025 DETECTADO NOS DADOS</p>
                  </div>
                ) : (
                  <div className="bg-red-100 border-2 border-red-500 p-4 rounded-lg">
                    <p className="text-red-900 font-bold text-center text-lg">❌ 2025 NÃO ENCONTRADO</p>
                    <p className="text-sm text-red-700 text-center mt-2">Execute o gerador de dados novamente</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}