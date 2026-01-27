import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import PageHeader from '@/components/common/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { 
  Sparkles, 
  Play, 
  CheckCircle2, 
  Loader2,
  AlertCircle,
  Info
} from 'lucide-react';
import { toast } from 'sonner';
import { calculateAutoTags } from '@/components/utils/autoTagEngine';

export default function RecalculateTags() {
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [results, setResults] = useState(null);
  const queryClient = useQueryClient();

  const { data: clients = [] } = useQuery({
    queryKey: ['clients'],
    queryFn: () => base44.entities.Client.list('company_name', 500)
  });

  const { data: orders = [] } = useQuery({
    queryKey: ['orders'],
    queryFn: () => base44.entities.Order.list('-created_date', 2000)
  });

  const handleRecalculate = async () => {
    setIsProcessing(true);
    setProgress(0);
    setResults(null);

    const updates = [];
    let processedCount = 0;
    let changedCount = 0;

    try {
      for (const client of clients) {
        const clientOrders = orders.filter(o => o.client_id === client.id);
        const autoTags = calculateAutoTags(client, orders, clientOrders);

        const currentAutoTags = client.auto_tags || [];
        const tagsChanged = 
          autoTags.length !== currentAutoTags.length ||
          autoTags.some(tag => !currentAutoTags.includes(tag));

        if (tagsChanged) {
          await base44.entities.Client.update(client.id, {
            auto_tags: autoTags,
            tags_last_updated: new Date().toISOString()
          });
          changedCount++;
        }

        processedCount++;
        setProgress((processedCount / clients.length) * 100);
      }

      setResults({
        total: clients.length,
        updated: changedCount,
        unchanged: clients.length - changedCount
      });

      queryClient.invalidateQueries(['clients']);
      toast.success('Tags recalculadas com sucesso!');

    } catch (error) {
      console.error('Error recalculating tags:', error);
      toast.error('Erro ao recalcular tags');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="pb-20 lg:pb-6 space-y-6">
      <PageHeader
        title="Recalcular Tags Automáticas"
        subtitle="Atualiza as tags automáticas de todos os clientes baseado no histórico"
      />

      <Card className="border-2 border-purple-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-purple-600" />
            Processamento de Tags
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <Info className="w-5 h-5 text-blue-600 mt-0.5" />
              <div className="flex-1 text-sm text-blue-900">
                <p className="font-semibold mb-2">Tags que serão calculadas:</p>
                <ul className="space-y-1 text-xs">
                  <li>• <strong>Cliente Premium:</strong> Top 20% faturamento, ticket médio alto ou +R$100k</li>
                  <li>• <strong>Cliente Recorrente:</strong> 3+ compras em meses diferentes</li>
                  <li>• <strong>Cliente Ativo:</strong> Compra ou contato nos últimos 60 dias</li>
                  <li>• <strong>Cliente em Risco:</strong> 90+ dias sem compra/contato</li>
                  <li>• <strong>Cliente Inativo:</strong> 120+ dias sem compra</li>
                  <li>• <strong>Alto Ticket:</strong> Ticket médio 2x acima da média</li>
                  <li>• <strong>Comprador Frequente:</strong> 5+ pedidos</li>
                </ul>
              </div>
            </div>
          </div>

          <div className="bg-slate-50 rounded-lg p-4">
            <div className="grid grid-cols-2 gap-4 text-center">
              <div>
                <p className="text-2xl font-bold text-slate-900">{clients.length}</p>
                <p className="text-xs text-slate-600">Clientes cadastrados</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-purple-600">{orders.length}</p>
                <p className="text-xs text-slate-600">Pedidos no histórico</p>
              </div>
            </div>
          </div>

          {isProcessing && (
            <div className="space-y-2">
              <Progress value={progress} className="h-2" />
              <p className="text-sm text-slate-600 text-center">
                Processando... {Math.round(progress)}%
              </p>
            </div>
          )}

          {results && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-3">
                <CheckCircle2 className="w-5 h-5 text-green-600" />
                <p className="font-semibold text-green-900">Processamento Concluído</p>
              </div>
              <div className="grid grid-cols-3 gap-3 text-center">
                <div>
                  <p className="text-xl font-bold text-slate-900">{results.total}</p>
                  <p className="text-xs text-slate-600">Total</p>
                </div>
                <div>
                  <p className="text-xl font-bold text-green-600">{results.updated}</p>
                  <p className="text-xs text-slate-600">Atualizados</p>
                </div>
                <div>
                  <p className="text-xl font-bold text-slate-500">{results.unchanged}</p>
                  <p className="text-xs text-slate-600">Sem mudanças</p>
                </div>
              </div>
            </div>
          )}

          <Button
            onClick={handleRecalculate}
            disabled={isProcessing || clients.length === 0}
            className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700"
          >
            {isProcessing ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Processando...
              </>
            ) : (
              <>
                <Play className="w-4 h-4 mr-2" />
                Recalcular Tags Agora
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>⚙️ Quando executar?</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-slate-700">
          <p>• <strong>Recomendado:</strong> Executar diariamente ou semanalmente</p>
          <p>• <strong>Após importação:</strong> Sempre que importar novos pedidos</p>
          <p>• <strong>Antes de relatórios:</strong> Para garantir dados atualizados</p>
          <p>• <strong>Antes de campanhas:</strong> Para gerar listas de premiação</p>
        </CardContent>
      </Card>
    </div>
  );
}