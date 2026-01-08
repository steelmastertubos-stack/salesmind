import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Lightbulb, Plus } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';

export default function CrossSellSuggestions({ client, lastOrder }) {
  if (!lastOrder || !lastOrder.items || lastOrder.items.length === 0) {
    return null;
  }

  const getSuggestions = () => {
    const suggestions = [];
    const items = lastOrder.items || [];

    items.forEach(item => {
      const category = item.category || '';
      const name = (item.product_name || '').toLowerCase();

      // Sugestões baseadas em categoria e produto
      if (category === 'tubos_quadrados_retangulares' || category === 'tubos_redondos') {
        suggestions.push({
          title: 'Conexões e Flanges',
          reason: `Cliente comprou ${item.product_name}`,
          products: ['Flanges de aço', 'Conexões soldáveis', 'Curvas 90°']
        });
      }

      if (category === 'chapas') {
        suggestions.push({
          title: 'Perfis Estruturais',
          reason: 'Complemento comum para chapas',
          products: ['Perfis I', 'Perfis U', 'Cantoneiras']
        });
      }

      if (category === 'perfis' || category === 'vigas') {
        suggestions.push({
          title: 'Chapas de Fixação',
          reason: 'Usadas em estruturas com perfis',
          products: ['Chapas de aço 6mm', 'Chapas de aço 8mm']
        });
      }

      if (category === 'cantoneiras') {
        suggestions.push({
          title: 'Parafusos e Fixadores',
          reason: 'Necessários para montagem',
          products: ['Parafusos estruturais', 'Porcas e arruelas']
        });
      }
    });

    // Remover duplicatas
    const uniqueSuggestions = suggestions.reduce((acc, curr) => {
      if (!acc.find(s => s.title === curr.title)) {
        acc.push(curr);
      }
      return acc;
    }, []);

    return uniqueSuggestions.slice(0, 2); // Máximo 2 sugestões
  };

  const suggestions = getSuggestions();

  if (suggestions.length === 0) return null;

  return (
    <div className="bg-gradient-to-r from-amber-50 to-amber-100 border-2 border-amber-200 rounded-2xl p-4">
      <div className="flex items-start gap-3 mb-4">
        <div className="w-10 h-10 bg-amber-500 rounded-xl flex items-center justify-center flex-shrink-0">
          <Lightbulb className="w-5 h-5 text-white" />
        </div>
        <div className="flex-1">
          <h3 className="font-semibold text-amber-900 mb-1">Sugestões de Cross-Sell</h3>
          <p className="text-sm text-amber-700">
            Com base no último pedido, sugerimos oferecer:
          </p>
        </div>
      </div>

      <div className="space-y-3">
        {suggestions.map((suggestion, index) => (
          <div key={index} className="bg-white rounded-lg p-3 border border-amber-200">
            <div className="flex items-start justify-between mb-2">
              <div>
                <h4 className="font-medium text-slate-900">{suggestion.title}</h4>
                <p className="text-xs text-slate-500 mt-1">{suggestion.reason}</p>
              </div>
              <Badge className="bg-amber-200 text-amber-900">Sugestão</Badge>
            </div>
            <div className="flex flex-wrap gap-1 mt-2">
              {suggestion.products.map((product, i) => (
                <Badge key={i} variant="outline" className="text-xs">
                  {product}
                </Badge>
              ))}
            </div>
          </div>
        ))}
      </div>

      <Link to={createPageUrl(`Quotes?clientId=${client.id}`)} className="block mt-3">
        <Button className="w-full bg-amber-600 hover:bg-amber-700">
          <Plus className="w-4 h-4 mr-2" />
          Criar Orçamento
        </Button>
      </Link>
    </div>
  );
}