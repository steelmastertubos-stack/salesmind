import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Search, Loader2, CheckCircle2 } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { base44 } from '@/api/base44Client';

export default function CNPJLookup({ onDataFetched, type = 'client' }) {
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

  const searchCNPJ = async (cnpjNumber) => {
    try {
      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `Busque informações oficiais da empresa com CNPJ ${cnpjNumber}. 
        
Retorne os dados EXATOS e OFICIAIS da empresa:
- Razão Social completa
- Nome Fantasia (se houver)
- CNPJ formatado
- Endereço completo (logradouro, número, complemento)
- Cidade
- Estado (UF)
- CEP
- CNAE principal com descrição
${type === 'principal' ? '- Telefone\n- E-mail' : '- Segmento de atuação'}

IMPORTANTE: Busque dados reais e atualizados. Não invente informações.`,
        add_context_from_internet: true,
        response_json_schema: {
          type: "object",
          properties: {
            company_name: { type: "string", description: "Razão social oficial" },
            trade_name: { type: "string", description: "Nome fantasia" },
            cnpj: { type: "string", description: "CNPJ formatado" },
            address: { type: "string", description: "Endereço completo" },
            city: { type: "string", description: "Cidade" },
            state: { type: "string", description: "Estado (UF)" },
            zip_code: { type: "string", description: "CEP" },
            segment: { type: "string", description: "Segmento de atuação" },
            cnae: { type: "string", description: "CNAE principal" }
          }
        }
      });

      return result;
    } catch (error) {
      console.error('Erro ao buscar CNPJ:', error);
      throw new Error('Erro ao buscar dados do CNPJ');
    }
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
      const data = await searchCNPJ(cnpj);
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