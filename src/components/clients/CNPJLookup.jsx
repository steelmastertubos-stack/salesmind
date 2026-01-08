import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Search, Loader2, CheckCircle2 } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

export default function CNPJLookup({ onDataFetched }) {
  const [cnpj, setCnpj] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const formatCNPJ = (value) => {
    return value
      .replace(/\D/g, '')
      .replace(/^(\d{2})(\d)/, '$1.$2')
      .replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3')
      .replace(/\.(\d{3})(\d)/, '.$1/$2')
      .replace(/(\d{4})(\d)/, '$1-$2')
      .slice(0, 18);
  };

  const mockCNPJSearch = async (cnpjNumber) => {
    // Simulação de busca em API (Receita Federal)
    await new Promise(resolve => setTimeout(resolve, 1500));

    const mockData = {
      company_name: 'INDUSTRIA DE MATERIAIS SIDERURGICOS LTDA',
      trade_name: 'SIDERÚRGICA DO VALE',
      cnpj: cnpjNumber,
      address: 'RUA DAS INDUSTRIAS, 1234',
      city: 'BETIM',
      state: 'MG',
      zip_code: '32600-000',
      segment: 'Metalurgia',
      cnae: '2511-0/00 - Fabricação de estruturas metálicas',
      state_registration: '062.123.456.0012',
      phone: '(31) 3594-5000',
      email: 'contato@siderurgicadovale.com.br'
    };

    return mockData;
  };

  const handleSearch = async () => {
    const cleanCNPJ = cnpj.replace(/\D/g, '');
    
    if (cleanCNPJ.length !== 14) {
      setError('CNPJ deve ter 14 dígitos');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const data = await mockCNPJSearch(cleanCNPJ);
      onDataFetched(data);
    } catch (err) {
      setError('Erro ao buscar CNPJ. Verifique o número e tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <Alert className="bg-blue-50 border-blue-200">
        <CheckCircle2 className="h-4 w-4 text-blue-600" />
        <AlertDescription className="text-blue-900">
          Informe o CNPJ para buscar dados da Receita Federal automaticamente
        </AlertDescription>
      </Alert>

      <div className="flex gap-3">
        <div className="flex-1 space-y-2">
          <Label>CNPJ *</Label>
          <Input
            value={cnpj}
            onChange={(e) => setCnpj(formatCNPJ(e.target.value))}
            placeholder="00.000.000/0000-00"
            maxLength={18}
          />
        </div>
        <div className="flex items-end">
          <Button
            type="button"
            onClick={handleSearch}
            disabled={loading || cnpj.replace(/\D/g, '').length !== 14}
            className="bg-[#1e3a5f] hover:bg-[#2d4a6f]"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Buscando...
              </>
            ) : (
              <>
                <Search className="w-4 h-4 mr-2" />
                Buscar
              </>
            )}
          </Button>
        </div>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
    </div>
  );
}