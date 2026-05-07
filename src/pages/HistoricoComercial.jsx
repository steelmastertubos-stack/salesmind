import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Download, Search, FileText, Target, Filter, Calendar } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const MONTHS = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
];

const QUOTE_STATUS_LABELS = {
  rascunho: 'Rascunho',
  emitido: 'Emitido',
  enviado: 'Enviado',
  aprovado: 'Aprovado',
  convertido: 'Convertido',
  cancelado: 'Cancelado'
};

const OPP_STAGE_LABELS = {
  proposta_enviada: 'Proposta Enviada',
  em_negociacao: 'Em Negociação',
  ganho: 'Ganho',
  perdido: 'Perdido'
};

const STATUS_COLORS = {
  rascunho: 'bg-slate-100 text-slate-700',
  emitido: 'bg-blue-100 text-blue-700',
  enviado: 'bg-amber-100 text-amber-700',
  aprovado: 'bg-emerald-100 text-emerald-700',
  convertido: 'bg-green-100 text-green-700',
  cancelado: 'bg-red-100 text-red-700',
  proposta_enviada: 'bg-blue-100 text-blue-700',
  em_negociacao: 'bg-amber-100 text-amber-700',
  ganho: 'bg-emerald-100 text-emerald-700',
  perdido: 'bg-red-100 text-red-700'
};

const formatCurrency = (v) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(v || 0);

const formatDate = (d) => d ? new Date(d).toLocaleDateString('pt-BR') : '—';

export default function HistoricoComercial() {
  const now = new Date();
  const [filterMonth, setFilterMonth] = useState('all');
  const [filterYear, setFilterYear] = useState(String(now.getFullYear()));
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterClient, setFilterClient] = useState('');
  const [activeTab, setActiveTab] = useState('quotes');

  const { data: quotes = [], isLoading: loadingQuotes } = useQuery({
    queryKey: ['quotes-history'],
    queryFn: () => base44.entities.Quote.list('-created_date', 1000)
  });

  const { data: opportunities = [], isLoading: loadingOpps } = useQuery({
    queryKey: ['opportunities-history'],
    queryFn: () => base44.entities.Opportunity.list('-created_date', 1000)
  });

  const years = useMemo(() => {
    const ys = new Set();
    [...quotes, ...opportunities].forEach(r => {
      if (r.created_date) ys.add(new Date(r.created_date).getFullYear());
    });
    const arr = Array.from(ys).sort((a, b) => b - a);
    return arr.length ? arr : [now.getFullYear()];
  }, [quotes, opportunities]);

  const matchesPeriod = (dateStr) => {
    if (!dateStr) return false;
    const d = new Date(dateStr);
    if (String(d.getFullYear()) !== filterYear) return false;
    if (filterMonth !== 'all' && d.getMonth() !== parseInt(filterMonth)) return false;
    return true;
  };

  const filteredQuotes = useMemo(() => quotes.filter(q => {
    if (!matchesPeriod(q.created_date)) return false;
    if (filterStatus !== 'all' && q.status !== filterStatus) return false;
    if (filterClient && !q.client_name?.toLowerCase().includes(filterClient.toLowerCase())) return false;
    return true;
  }), [quotes, filterMonth, filterYear, filterStatus, filterClient]);

  const filteredOpps = useMemo(() => opportunities.filter(o => {
    if (!matchesPeriod(o.created_date)) return false;
    if (filterStatus !== 'all' && o.stage !== filterStatus) return false;
    if (filterClient && !o.client_name?.toLowerCase().includes(filterClient.toLowerCase())) return false;
    return true;
  }), [opportunities, filterMonth, filterYear, filterStatus, filterClient]);

  // Totais
  const totalQuotedValue = filteredQuotes.reduce((s, q) => s + (q.total_value || 0), 0);
  const wonQuotes = filteredQuotes.filter(q => ['aprovado', 'convertido'].includes(q.status));
  const totalOppValue = filteredOpps.reduce((s, o) => s + (o.value_estimated || o.total_value || 0), 0);
  const wonOpps = filteredOpps.filter(o => o.stage === 'ganho');

  const exportCSV = (data, filename) => {
    if (!data.length) return;
    const keys = Object.keys(data[0]).filter(k => !['items', 'timeline', 'status_history', 'payment_installments'].includes(k));
    const header = keys.join(';');
    const rows = data.map(row => keys.map(k => {
      const v = row[k];
      if (v === null || v === undefined) return '';
      if (typeof v === 'object') return JSON.stringify(v);
      return String(v).replace(/;/g, ',');
    }).join(';'));
    const csv = [header, ...rows].join('\n');
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  const periodLabel = filterMonth === 'all'
    ? filterYear
    : `${MONTHS[parseInt(filterMonth)]}/${filterYear}`;

  const isLoading = loadingQuotes || loadingOpps;

  return (
    <div className="space-y-6 pb-20 lg:pb-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <Calendar className="w-6 h-6 text-blue-600" />
            Histórico Comercial
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            Consulte cotações e oportunidades de meses anteriores
          </p>
        </div>
      </div>

      {/* Filtros */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <Filter className="w-4 h-4" /> Filtros
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <Select value={filterYear} onValueChange={setFilterYear}>
              <SelectTrigger><SelectValue placeholder="Ano" /></SelectTrigger>
              <SelectContent>
                {years.map(y => <SelectItem key={y} value={String(y)}>{y}</SelectItem>)}
              </SelectContent>
            </Select>

            <Select value={filterMonth} onValueChange={setFilterMonth}>
              <SelectTrigger><SelectValue placeholder="Mês" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os meses</SelectItem>
                {MONTHS.map((m, i) => <SelectItem key={i} value={String(i)}>{m}</SelectItem>)}
              </SelectContent>
            </Select>

            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger><SelectValue placeholder="Status" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os status</SelectItem>
                {activeTab === 'quotes'
                  ? Object.entries(QUOTE_STATUS_LABELS).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)
                  : Object.entries(OPP_STAGE_LABELS).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)
                }
              </SelectContent>
            </Select>

            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                placeholder="Buscar cliente..."
                value={filterClient}
                onChange={e => setFilterClient(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* KPIs do Período */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl border border-slate-100 p-4 shadow-sm">
          <p className="text-xs text-slate-500 uppercase tracking-wide mb-1">Cotações</p>
          <p className="text-2xl font-bold text-slate-900">{filteredQuotes.length}</p>
          <p className="text-xs text-slate-400">{formatCurrency(totalQuotedValue)}</p>
        </div>
        <div className="bg-white rounded-2xl border border-slate-100 p-4 shadow-sm">
          <p className="text-xs text-slate-500 uppercase tracking-wide mb-1">Cotações Ganhas</p>
          <p className="text-2xl font-bold text-emerald-600">{wonQuotes.length}</p>
          <p className="text-xs text-slate-400">{formatCurrency(wonQuotes.reduce((s, q) => s + (q.total_value || 0), 0))}</p>
        </div>
        <div className="bg-white rounded-2xl border border-slate-100 p-4 shadow-sm">
          <p className="text-xs text-slate-500 uppercase tracking-wide mb-1">Oportunidades</p>
          <p className="text-2xl font-bold text-blue-600">{filteredOpps.length}</p>
          <p className="text-xs text-slate-400">{formatCurrency(totalOppValue)}</p>
        </div>
        <div className="bg-white rounded-2xl border border-slate-100 p-4 shadow-sm">
          <p className="text-xs text-slate-500 uppercase tracking-wide mb-1">Opp. Ganhas</p>
          <p className="text-2xl font-bold text-emerald-600">{wonOpps.length}</p>
          <p className="text-xs text-slate-400">{formatCurrency(wonOpps.reduce((s, o) => s + (o.value_estimated || o.total_value || 0), 0))}</p>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={v => { setActiveTab(v); setFilterStatus('all'); }}>
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <TabsList>
            <TabsTrigger value="quotes" className="flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5" /> Cotações ({filteredQuotes.length})
            </TabsTrigger>
            <TabsTrigger value="opportunities" className="flex items-center gap-1.5">
              <Target className="w-3.5 h-3.5" /> Oportunidades ({filteredOpps.length})
            </TabsTrigger>
          </TabsList>

          <Button
            variant="outline"
            size="sm"
            onClick={() => activeTab === 'quotes'
              ? exportCSV(filteredQuotes, `cotacoes_${periodLabel}.csv`)
              : exportCSV(filteredOpps, `oportunidades_${periodLabel}.csv`)
            }
            className="flex items-center gap-2"
          >
            <Download className="w-3.5 h-3.5" />
            Exportar CSV
          </Button>
        </div>

        {/* Cotações */}
        <TabsContent value="quotes">
          <Card>
            <CardContent className="p-0">
              {isLoading ? (
                <div className="p-8 text-center text-slate-400">Carregando...</div>
              ) : filteredQuotes.length === 0 ? (
                <div className="p-8 text-center text-slate-400">
                  <FileText className="w-10 h-10 mx-auto mb-2 opacity-30" />
                  <p>Nenhuma cotação encontrada para o período selecionado.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-slate-100 bg-slate-50">
                        <th className="text-left p-3 text-xs font-semibold text-slate-500 uppercase">Nº</th>
                        <th className="text-left p-3 text-xs font-semibold text-slate-500 uppercase">Cliente</th>
                        <th className="text-left p-3 text-xs font-semibold text-slate-500 uppercase">Representada</th>
                        <th className="text-left p-3 text-xs font-semibold text-slate-500 uppercase">Data</th>
                        <th className="text-right p-3 text-xs font-semibold text-slate-500 uppercase">Valor</th>
                        <th className="text-center p-3 text-xs font-semibold text-slate-500 uppercase">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredQuotes.map(q => (
                        <tr key={q.id} className="border-b border-slate-50 hover:bg-slate-50 transition-colors">
                          <td className="p-3 font-mono text-xs text-slate-500">{q.quote_number || '—'}</td>
                          <td className="p-3 font-medium text-slate-900">{q.client_name || '—'}</td>
                          <td className="p-3 text-slate-600 text-xs">{q.principal_name || '—'}</td>
                          <td className="p-3 text-slate-500 text-xs">{formatDate(q.created_date)}</td>
                          <td className="p-3 text-right font-semibold text-slate-900">{formatCurrency(q.total_value)}</td>
                          <td className="p-3 text-center">
                            <Badge className={STATUS_COLORS[q.status] || 'bg-slate-100 text-slate-600'}>
                              {QUOTE_STATUS_LABELS[q.status] || q.status}
                            </Badge>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr className="bg-slate-50 border-t-2 border-slate-200">
                        <td colSpan={4} className="p-3 text-xs font-semibold text-slate-600">
                          Total ({filteredQuotes.length} cotações)
                        </td>
                        <td className="p-3 text-right font-bold text-slate-900">{formatCurrency(totalQuotedValue)}</td>
                        <td />
                      </tr>
                    </tfoot>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Oportunidades */}
        <TabsContent value="opportunities">
          <Card>
            <CardContent className="p-0">
              {isLoading ? (
                <div className="p-8 text-center text-slate-400">Carregando...</div>
              ) : filteredOpps.length === 0 ? (
                <div className="p-8 text-center text-slate-400">
                  <Target className="w-10 h-10 mx-auto mb-2 opacity-30" />
                  <p>Nenhuma oportunidade encontrada para o período selecionado.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-slate-100 bg-slate-50">
                        <th className="text-left p-3 text-xs font-semibold text-slate-500 uppercase">Cliente</th>
                        <th className="text-left p-3 text-xs font-semibold text-slate-500 uppercase">Representada</th>
                        <th className="text-left p-3 text-xs font-semibold text-slate-500 uppercase">Criada em</th>
                        <th className="text-left p-3 text-xs font-semibold text-slate-500 uppercase">Próx. Ação</th>
                        <th className="text-right p-3 text-xs font-semibold text-slate-500 uppercase">Valor Est.</th>
                        <th className="text-center p-3 text-xs font-semibold text-slate-500 uppercase">Estágio</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredOpps.map(o => (
                        <tr key={o.id} className="border-b border-slate-50 hover:bg-slate-50 transition-colors">
                          <td className="p-3 font-medium text-slate-900">{o.client_name || '—'}</td>
                          <td className="p-3 text-slate-600 text-xs">{o.principal_name || '—'}</td>
                          <td className="p-3 text-slate-500 text-xs">{formatDate(o.created_date)}</td>
                          <td className="p-3 text-slate-500 text-xs">{formatDate(o.next_action_date)}</td>
                          <td className="p-3 text-right font-semibold text-slate-900">
                            {formatCurrency(o.value_estimated || o.total_value)}
                          </td>
                          <td className="p-3 text-center">
                            <Badge className={STATUS_COLORS[o.stage] || 'bg-slate-100 text-slate-600'}>
                              {OPP_STAGE_LABELS[o.stage] || o.stage}
                            </Badge>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr className="bg-slate-50 border-t-2 border-slate-200">
                        <td colSpan={4} className="p-3 text-xs font-semibold text-slate-600">
                          Total ({filteredOpps.length} oportunidades)
                        </td>
                        <td className="p-3 text-right font-bold text-slate-900">{formatCurrency(totalOppValue)}</td>
                        <td />
                      </tr>
                    </tfoot>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}