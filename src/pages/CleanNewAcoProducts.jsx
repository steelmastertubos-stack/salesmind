import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import PageHeader from '@/components/common/PageHeader';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { CheckCircle2, Loader2, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';

export default function CleanNewAcoProducts() {
  const [isProcessing, setIsProcessing] = useState(false);
  const [autoStart, setAutoStart] = useState(true);
  const [progress, setProgress] = useState(0);
  const [results, setResults] = useState(null);
  const [products, setProducts] = useState([]);

  useEffect(() => {
    const loadProducts = async () => {
      const allProducts = await base44.entities.Product.filter({ 
        principal_id: '69603df4d5041a54d9d31d32' 
      });
      setProducts(allProducts);
      
      if (autoStart && allProducts.length > 0) {
        handleClean(allProducts);
      }
    };
    loadProducts();
  }, []);

  const handleClean = async (productList) => {
    const productsToClean = productList || products;
    setIsProcessing(true);
    setProgress(0);
    setResults(null);

    let cleaned = 0;
    const errors = [];

    try {
      for (let i = 0; i < productsToClean.length; i++) {
        const product = productsToClean[i];
        
        try {
          // Criar um objeto limpo sem os campos $inc e $unset
          const cleanData = {};
          for (const [key, value] of Object.entries(product)) {
            if (key !== '$inc' && key !== '$unset' && key !== 'id' && key !== 'created_date' && key !== 'updated_date' && key !== 'created_by') {
              cleanData[key] = value;
            }
          }

          // Definir preço fixo de R$ 11,90/kg
          cleanData.base_price_per_kg = 11.90;

          await base44.entities.Product.update(product.id, cleanData);
          cleaned++;
        } catch (err) {
          errors.push({ id: product.id, code: product.code, error: err.message });
        }

        setProgress(((i + 1) / productsToClean.length) * 100);
      }

      setResults({
        total: productsToClean.length,
        cleaned,
        errors: errors.length
      });

      if (errors.length === 0) {
        toast.success('Todos os produtos foram limpos com sucesso!');
      } else {
        toast.warning(`${cleaned} produtos limpos, ${errors.length} erros`);
      }

    } catch (error) {
      console.error('Error cleaning products:', error);
      toast.error('Erro ao limpar produtos');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="pb-20 lg:pb-6 space-y-6">
      <PageHeader
        title="Atualizar Produtos New Aço"
        subtitle="Definir preço de R$ 11,90/kg para todos os produtos"
      />

      <Card>
        <CardContent className="p-6 space-y-4">
          <div className="bg-slate-50 rounded-lg p-4">
            <div className="grid grid-cols-2 gap-4 text-center">
              <div>
                <p className="text-2xl font-bold text-slate-900">{products.length}</p>
                <p className="text-xs text-slate-600">Produtos Total</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-emerald-600">{results?.cleaned || 0}</p>
                <p className="text-xs text-slate-600">Limpos</p>
              </div>
            </div>
          </div>

          {isProcessing && (
            <div className="space-y-2">
              <Progress value={progress} className="h-2" />
              <p className="text-sm text-slate-600 text-center">
                Limpando... {Math.round(progress)}%
              </p>
            </div>
          )}

          {results && (
            <div className={`${results.errors > 0 ? 'bg-yellow-50 border-yellow-200' : 'bg-green-50 border-green-200'} border rounded-lg p-4`}>
              <div className="flex items-center gap-2 mb-3">
                {results.errors > 0 ? (
                  <AlertTriangle className="w-5 h-5 text-yellow-600" />
                ) : (
                  <CheckCircle2 className="w-5 h-5 text-green-600" />
                )}
                <p className="font-semibold text-slate-900">
                  {results.errors > 0 ? 'Concluído com avisos' : 'Concluído!'}
                </p>
              </div>
              <p className="text-sm text-slate-800">
                {results.cleaned} produtos limpos de {results.total} total
                {results.errors > 0 && ` (${results.errors} erros)`}
              </p>
            </div>
          )}

          {!autoStart && (
            <Button
              onClick={() => handleClean()}
              disabled={isProcessing || products.length === 0}
              className="w-full bg-emerald-600 hover:bg-emerald-700"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Processando...
                </>
              ) : (
                'Limpar Produtos Agora'
              )}
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  );
}