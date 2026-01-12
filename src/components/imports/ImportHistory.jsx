import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, Trash2, RotateCcw, Package, Users, Box } from 'lucide-react';
import { toast } from 'sonner';

export default function ImportHistory() {
  const queryClient = useQueryClient();
  const [showLegacy, setShowLegacy] = useState(false);

  const { data: batches = [], isLoading } = useQuery({
    queryKey: ['import-batches'],
    queryFn: () => base44.entities.ImportBatch.list('-created_date', 50)
  });

  // Buscar produtos e clientes agrupados por data para importações antigas
  const { data: products = [] } = useQuery({
    queryKey: ['products-for-history'],
    queryFn: () => base44.entities.Product.list('-created_date', 100),
    enabled: showLegacy
  });

  const { data: clients = [] } = useQuery({
    queryKey: ['clients-for-history'],
    queryFn: () => base44.entities.Client.list('-created_date', 100),
    enabled: showLegacy
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

  const deleteGroupMutation = useMutation({
    mutationFn: async ({ items, type }) => {
      for (const item of items) {
        if (type === 'Product') {
          await base44.entities.Product.delete(item.id);
        } else {
          await base44.entities.Client.delete(item.id);
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['products']);
      queryClient.invalidateQueries(['clients']);
      queryClient.invalidateQueries(['products-for-history']);
      queryClient.invalidateQueries(['clients-for-history']);
      toast.success('Registros removidos com sucesso!');
    },
    onError: () => {
      toast.error('Erro ao remover registros');
    }
  });

  const handleRevert = (batch) => {
    if (confirm(`Deseja realmente desfazer esta importação de ${batch.records_count} ${batch.entity_type === 'Product' ? 'produtos' : 'clientes'}?`)) {
      revertBatchMutation.mutate(batch);
    }
  };

  const handleDeleteGroup = (items, type, label) => {
    if (confirm(`Deseja realmente remover ${items.length} ${type === 'Product' ? 'produtos' : 'clientes'} ${label}?`)) {
      deleteGroupMutation.mutate({ items, type });
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

  // Agrupar produtos/clientes sem batch_id por data
  const groupByDate = (items, type) => {
    const withoutBatch = items.filter(item => !item.import_batch_id);
    const groups = {};
    
    withoutBatch.forEach(item => {
      const date = new Date(item.created_date).toLocaleDateString('pt-BR');
      if (!groups[date]) {
        groups[date] = [];
      }
      groups[date].push(item);
    });

    return Object.entries(groups)
      .map(([date, items]) => ({
        date,
        type,
        items,
        count: items.length
      }))
      .sort((a, b) => new Date(b.items[0].created_date) - new Date(a.items[0].created_date));
  };

  const activeBatches = batches.filter(b => b.status === 'active');
  const productGroups = showLegacy ? groupByDate(products, 'Product') : [];
  const clientGroups = showLegacy ? groupByDate(clients, 'Client') : [];
  const legacyGroups = [...productGroups, ...clientGroups];

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <RotateCcw className="w-5 h-5" />
            Histórico de Importações
          </CardTitle>
          {(products.length > 0 || clients.length > 0) && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowLegacy(!showLegacy)}
            >
              {showLegacy ? 'Ocultar antigas' : 'Ver todas'}
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {activeBatches.length === 0 && !showLegacy && (
          <p className="text-sm text-slate-500 text-center py-4">
            Nenhuma importação rastreada. Novas importações aparecerão aqui.
          </p>
        )}

        {activeBatches.map(batch => (
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
        ))}

        {showLegacy && legacyGroups.length > 0 && (
          <>
            <div className="border-t pt-3 mt-3">
              <p className="text-xs text-slate-500 mb-2">Registros anteriores (agrupados por data)</p>
            </div>
            {legacyGroups.map((group, idx) => (
              <div key={idx} className="flex items-center justify-between p-3 border rounded-lg bg-amber-50 border-amber-200">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-white border flex items-center justify-center">
                    {getIcon(group.type)}
                  </div>
                  <div>
                    <p className="font-medium text-sm">
                      {group.type === 'Product' ? 'Produtos' : 'Clientes'} do dia {group.date}
                    </p>
                    <p className="text-xs text-slate-600">
                      {group.count} registros sem rastreamento
                    </p>
                  </div>
                </div>
                <Button
                  size="sm"
                  variant="ghost"
                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                  onClick={() => handleDeleteGroup(group.items, group.type, `do dia ${group.date}`)}
                  disabled={deleteGroupMutation.isLoading}
                >
                  <Trash2 className="w-4 h-4 mr-1" />
                  Remover
                </Button>
              </div>
            ))}
          </>
        )}

        {showLegacy && legacyGroups.length === 0 && activeBatches.length === 0 && (
          <p className="text-sm text-slate-500 text-center py-4">
            Nenhum registro encontrado
          </p>
        )}
      </CardContent>
    </Card>
  );
}