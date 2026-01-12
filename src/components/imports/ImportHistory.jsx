import React from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, Trash2, RotateCcw, Package, Users, Box } from 'lucide-react';
import { toast } from 'sonner';

export default function ImportHistory() {
  const queryClient = useQueryClient();

  const { data: batches = [], isLoading } = useQuery({
    queryKey: ['import-batches'],
    queryFn: () => base44.entities.ImportBatch.list('-created_date', 50)
  });

  const revertBatchMutation = useMutation({
    mutationFn: async (batch) => {
      // Deletar registros do lote
      if (batch.entity_type === 'Product') {
        const products = await base44.entities.Product.filter({ import_batch_id: batch.batch_id });
        for (const product of products) {
          await base44.entities.Product.delete(product.id);
        }
      } else if (batch.entity_type === 'Client') {
        const clients = await base44.entities.Client.filter({ import_batch_id: batch.batch_id });
        for (const client of clients) {
          await base44.entities.Client.delete(client.id);
        }
      }

      // Marcar lote como revertido
      await base44.entities.ImportBatch.update(batch.id, {
        status: 'reverted',
        reverted_at: new Date().toISOString()
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['import-batches']);
      queryClient.invalidateQueries(['products']);
      queryClient.invalidateQueries(['clients']);
      toast.success('Importação desfeita com sucesso!');
    },
    onError: () => {
      toast.error('Erro ao desfazer importação');
    }
  });

  const handleRevert = (batch) => {
    if (confirm(`Deseja realmente desfazer esta importação de ${batch.records_count} ${batch.entity_type === 'Product' ? 'produtos' : 'clientes'}?`)) {
      revertBatchMutation.mutate(batch);
    }
  };

  const getIcon = (type) => {
    switch (type) {
      case 'Product': return <Package className="w-5 h-5" />;
      case 'Client': return <Users className="w-5 h-5" />;
      case 'Stock': return <Box className="w-5 h-5" />;
      default: return null;
    }
  };

  const activeBatches = batches.filter(b => b.status === 'active');

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <RotateCcw className="w-5 h-5" />
          Histórico de Importações
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {activeBatches.length === 0 ? (
          <p className="text-sm text-slate-500 text-center py-4">
            Nenhuma importação realizada ainda. Após importar, você poderá desfazer aqui.
          </p>
        ) : (
          activeBatches.map(batch => (
          <div key={batch.id} className="flex items-center justify-between p-3 border rounded-lg bg-slate-50">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-white border flex items-center justify-center">
                {getIcon(batch.entity_type)}
              </div>
              <div>
                <p className="font-medium text-sm">
                  {batch.file_name || 'Importação'} 
                </p>
                <p className="text-xs text-slate-600">
                  {batch.records_count} {batch.entity_type === 'Product' ? 'produtos' : 'clientes'} • {new Date(batch.created_date).toLocaleString('pt-BR')}
                </p>
              </div>
            </div>
            <Button
              size="sm"
              variant="ghost"
              className="text-red-600 hover:text-red-700 hover:bg-red-50"
              onClick={() => handleRevert(batch)}
              disabled={revertBatchMutation.isLoading}
            >
              <Trash2 className="w-4 h-4 mr-1" />
              Desfazer
            </Button>
          </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}