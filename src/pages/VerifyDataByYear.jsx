import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Search } from 'lucide-react';
import PageHeader from '@/components/common/PageHeader';

export default function VerifyDataByYear() {
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState(null);

  const verifyData = async () => {
    setLoading(true);
    try {
      const [orders, opportunities, quotes] = await Promise.all([
        base44.entities.Order.list('-created_date', 5000),
        base44.entities.Opportunity.list('-created_date', 5000),
        base44.entities.Quote.list('-created_date', 5000)
      ]);

      // Agrupar por ano
      const ordersByYear = {};
      const opportunitiesByYear = {};
      const quotesByYear = {};

      orders.forEach(o => {
        const year = new Date(o.created_date).getFullYear();
        if (!isNaN(year)) {
          ordersByYear[year] = (ordersByYear[year] || 0) + 1;
        }
      });

      opportunities.forEach(o => {
        const year = new Date(o.created_date).getFullYear();
        if (!isNaN(year)) {
          opportunitiesByYear[year] = (opportunitiesByYear[year] || 0) + 1;
        }
      });

      quotes.forEach(q => {
        const year = new Date(q.created_date).getFullYear();
        if (!isNaN(year)) {
          quotesByYear[year] = (quotesByYear[year] || 0) + 1;
        }
      });

      setResults({
        ordersByYear,
        opportunitiesByYear,
        quotesByYear,
        totalOrders: orders.length,
        totalOpportunities: opportunities.length,
        totalQuotes: quotes.length,
        sampleOrders: orders.slice(0, 5).map(o => ({
          id: o.id,
          created_date: o.created_date,
          year: new Date(o.created_date).getFullYear()
        })),
        sampleOpportunities: opportunities.slice(0, 5).map(o => ({
          id: o.id,
          created_date: o.created_date,
          year: new Date(o.created_date).getFullYear()
        }))
      });
    } catch (error) {
      console.error('Erro ao verificar dados:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 pb-20 lg:pb-6">
      <PageHeader 
        title="Verificar Dados por Ano"
        subtitle="Análise de distribuição de registros por ano"
      />

      <Card>
        <CardHeader>
          <CardTitle>Análise de Dados</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {!results && (
            <Button 
              onClick={verifyData}
              disabled={loading}
              className="w-full"
              size="lg"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Verificando...
                </>
              ) : (
                <>
                  <Search className="w-5 h-5 mr-2" />
                  Verificar Dados
                </>
              )}
            </Button>
          )}

          {results && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                <Card className="bg-blue-50">
                  <CardContent className="pt-6">
                    <p className="text-sm text-slate-600 mb-1">Total de Pedidos</p>
                    <p className="text-3xl font-bold text-blue-600">{results.totalOrders}</p>
                  </CardContent>
                </Card>
                <Card className="bg-purple-50">
                  <CardContent className="pt-6">
                    <p className="text-sm text-slate-600 mb-1">Total de Oportunidades</p>
                    <p className="text-3xl font-bold text-purple-600">{results.totalOpportunities}</p>
                  </CardContent>
                </Card>
                <Card className="bg-green-50">
                  <CardContent className="pt-6">
                    <p className="text-sm text-slate-600 mb-1">Total de Orçamentos</p>
                    <p className="text-3xl font-bold text-green-600">{results.totalQuotes}</p>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>Pedidos por Ano</CardTitle>
                </CardHeader>
                <CardContent>
                  {Object.keys(results.ordersByYear).length > 0 ? (
                    <div className="space-y-2">
                      {Object.entries(results.ordersByYear)
                        .sort(([a], [b]) => b - a)
                        .map(([year, count]) => (
                          <div key={year} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                            <span className="font-semibold text-lg">{year}</span>
                            <span className="text-2xl font-bold text-blue-600">{count} pedidos</span>
                          </div>
                        ))}
                    </div>
                  ) : (
                    <p className="text-slate-500">Nenhum pedido encontrado</p>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Oportunidades por Ano</CardTitle>
                </CardHeader>
                <CardContent>
                  {Object.keys(results.opportunitiesByYear).length > 0 ? (
                    <div className="space-y-2">
                      {Object.entries(results.opportunitiesByYear)
                        .sort(([a], [b]) => b - a)
                        .map(([year, count]) => (
                          <div key={year} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                            <span className="font-semibold text-lg">{year}</span>
                            <span className="text-2xl font-bold text-purple-600">{count} oportunidades</span>
                          </div>
                        ))}
                    </div>
                  ) : (
                    <p className="text-slate-500">Nenhuma oportunidade encontrada</p>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Orçamentos por Ano</CardTitle>
                </CardHeader>
                <CardContent>
                  {Object.keys(results.quotesByYear).length > 0 ? (
                    <div className="space-y-2">
                      {Object.entries(results.quotesByYear)
                        .sort(([a], [b]) => b - a)
                        .map(([year, count]) => (
                          <div key={year} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                            <span className="font-semibold text-lg">{year}</span>
                            <span className="text-2xl font-bold text-green-600">{count} orçamentos</span>
                          </div>
                        ))}
                    </div>
                  ) : (
                    <p className="text-slate-500">Nenhum orçamento encontrado</p>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Amostra de Pedidos (5 primeiros)</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {results.sampleOrders.map(o => (
                      <div key={o.id} className="text-xs font-mono bg-slate-50 p-2 rounded">
                        ID: {o.id} | Data: {o.created_date} | Ano: {o.year}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Amostra de Oportunidades (5 primeiras)</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {results.sampleOpportunities.map(o => (
                      <div key={o.id} className="text-xs font-mono bg-slate-50 p-2 rounded">
                        ID: {o.id} | Data: {o.created_date} | Ano: {o.year}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Button 
                onClick={() => setResults(null)}
                variant="outline"
                className="w-full"
              >
                Verificar Novamente
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}