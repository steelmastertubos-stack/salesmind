import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import PageHeader from '@/components/common/PageHeader';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { DollarSign, Play, CheckCircle2, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export default function FixNewAcoPrices() {
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [results, setResults] = useState(null);

  const { data: products = [], isLoading } = useQuery({
    queryKey: ['newaco-products'],
    queryFn: () => base44.entities.Product.filter({ principal_id: '69603df4d5041a54d9d31d32' })
  });

  const handleFix = async () => {
    setIsProcessing(true);
    setProgress(0);
    setResults(null);

    let updated = 0;

    try {
      for (let i = 0; i < products.length; i++) {
        const product = products[i];
        
        // Remover $inc se existir e aplicar o incremento
        const currentPrice = product.base_price_per_kg || 0;
        const hasIncrement = product.$inc?.base_price_per_kg;
        
        const updateData = {
          base_price_per_kg: hasIncrement 
            ? currentPrice + product.$inc.base_price_per_kg 
            : currentPrice + 2.0
        };

        // Remover o campo $inc se existir
        if (hasIncrement) {
          await base44.entities.Product.update(product.id, {
            ...updateData,
            $inc: null
          });
        } else {
          await base44.entities.Product.update(product.id, updateData);
        }

        updated++;
        setProgress((updated / products.length) * 100);
      }

      setResults({
        total: products.length,
        updated
      });

      toast.success('Preços atualizados com sucesso!');

    } catch (error) {
      console.error('Error updating prices:', error);
      toast.error('Erro ao atualizar preços');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="pb-20 lg:pb-6 space-y-6">
      <PageHeader
        title="Corrigir Preços New Aço"
        subtitle="Adicionar R$ 2,00/kg a todos os produtos"
      />

      <Card>
        <CardContent className="p-6 space-y-4">
          <div className="bg-slate-50 rounded-lg p-4">
            <div className="grid grid-cols-2 gap-4 text-center">
              <div>
                <p className="text-2xl font-bold text-slate-900">{products.length}</p>
                <p className="text-xs text-slate-600">Produtos New Aço</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-emerald-600">+R$ 2,00</p>
                <p className="text-xs text-slate-600">Por kg</p>
              </div>
            </div>
          </div>

          {isProcessing && (
            <div className="space-y-2">
              <Progress value={progress} className="h-2" />
              <p className="text-sm text-slate-600 text-center">
                Atualizando... {Math.round(progress)}%
              </p>
            </div>
          )}

          {results && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-3">
                <CheckCircle2 className="w-5 h-5 text-green-600" />
                <p className="font-semibold text-green-900">Concluído!</p>
              </div>
              <p className="text-sm text-green-800">
                {results.updated} produtos atualizados de {results.total} total
              </p>
            </div>
          )}

          <Button
            onClick={handleFix}
            disabled={isProcessing || isLoading}
            className="w-full bg-emerald-600 hover:bg-emerald-700"
          >
            {isProcessing ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Processando...
              </>
            ) : (
              <>
                <DollarSign className="w-4 h-4 mr-2" />
                Atualizar Preços Agora
              </>
            )}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}