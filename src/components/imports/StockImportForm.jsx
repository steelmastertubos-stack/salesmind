import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Upload, Download, AlertCircle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { useQuery } from '@tanstack/react-query';

const parseCSV = (fileContent) => {
  const lines = fileContent.trim().split('\n');
  if (lines.length < 2) return { headers: [], rows: [] };
  
  const headers = lines[0].split(',').map(h => h.trim());
  const rows = lines.slice(1).map(line => {
    const values = line.split(',').map(v => v.trim());
    const row = {};
    headers.forEach((header, i) => {
      row[header] = values[i] || '';
    });
    return row;
  });
  
  return { headers, rows };
};

const downloadTemplate = () => {
  const content = `product_code,product_name,quantity,unit
TUBO-001,Tubo 1/2",100,mt
TUBO-002,Tubo 3/4",150,mt
CHAPA-001,Chapa 3mm,50,pc`;
  
  const element = document.createElement('a');
  element.setAttribute('href', 'data:text/csv;charset=utf-8,' + encodeURIComponent(content));
  element.setAttribute('download', 'template-estoque.csv');
  element.style.display = 'none';
  document.body.appendChild(element);
  element.click();
  document.body.removeChild(element);
};

export default function StockImportForm({ onSuccess }) {
  const [file, setFile] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [preview, setPreview] = useState(null);
  const [errors, setErrors] = useState([]);
  const [selectedPrincipal, setSelectedPrincipal] = useState('');

  const { data: principals = [] } = useQuery({
    queryKey: ['principals'],
    queryFn: () => base44.entities.Principal.list('company_name', 500)
  });

  const { data: products = [] } = useQuery({
    queryKey: ['products'],
    queryFn: () => base44.entities.Product.list('name', 2500)
  });

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const content = event.target.result;
        const { headers, rows } = parseCSV(content);
        
        if (rows.length === 0) {
          toast.error('Arquivo vazio');
          return;
        }
        
        setFile(selectedFile);
        setPreview({ headers, rows: rows.slice(0, 5), total: rows.length });
        setErrors([]);
      };
      reader.readAsText(selectedFile);
    }
  };

  const validateRow = (row, index) => {
    const rowErrors = [];
    
    if (!row.product_code?.trim()) rowErrors.push(`Linha ${index + 2}: Código do produto obrigatório`);
    if (row.quantity === undefined || row.quantity === null || row.quantity === '') rowErrors.push(`Linha ${index + 2}: Quantidade obrigatória`);
    if (isNaN(parseFloat(row.quantity))) rowErrors.push(`Linha ${index + 2}: Quantidade deve ser um número`);
    
    return rowErrors;
  };

  const handleImport = async () => {
    if (!file) {
      toast.error('Selecione um arquivo');
      return;
    }

    if (!selectedPrincipal) {
      toast.error('Selecione uma representada');
      return;
    }

    setIsLoading(true);
    const reader = new FileReader();
    
    reader.onload = async (event) => {
      try {
        const { rows } = parseCSV(event.target.result);
        
        // Validar linhas
        const allErrors = [];
        rows.forEach((row, i) => {
          allErrors.push(...validateRow(row, i));
        });

        if (allErrors.length > 0) {
          setErrors(allErrors);
          toast.error(`${allErrors.length} erro(s) encontrado(s)`);
          setIsLoading(false);
          return;
        }

        // Preparar dados de estoque
        const principal = principals.find(p => p.id === selectedPrincipal);
        console.log('Principal selecionado:', principal);
        console.log('Total de produtos cadastrados:', products.length);
        
        const updatedStock = rows.map(row => {
          const product = products.find(p => p.code === row.product_code);
          console.log(`Processando ${row.product_code}:`, product ? 'Encontrado' : 'NÃO ENCONTRADO');
          
          return {
            product_id: product?.id || '',
            product_code: row.product_code,
            product_name: row.product_name || product?.name || '',
            quantity: parseFloat(row.quantity),
            unit: row.unit || 'kg',
            last_updated: new Date().toISOString()
          };
        });

        console.log('Stock preparado:', updatedStock);
        
        // Merge com estoque existente
        const existingStock = principal.stock || [];
        const mergedStock = [...existingStock];
        
        updatedStock.forEach(newItem => {
          const existingIndex = mergedStock.findIndex(s => s.product_code === newItem.product_code);
          if (existingIndex >= 0) {
            mergedStock[existingIndex] = newItem;
          } else {
            mergedStock.push(newItem);
          }
        });

        console.log('Stock mesclado final:', mergedStock);

        // Atualizar estoque da representada
        const result = await base44.entities.Principal.update(selectedPrincipal, {
          stock: mergedStock
        });
        
        console.log('Resultado da atualização:', result);
        toast.success(`${rows.length} itens de estoque importados para ${principal.trade_name || principal.company_name}!`);
        setFile(null);
        setPreview(null);
        setSelectedPrincipal('');
        onSuccess?.();
      } catch (error) {
        console.error('Erro na importação:', error);
        toast.error('Erro ao importar estoque');
      } finally {
        setIsLoading(false);
      }
    };
    
    reader.readAsText(file);
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={downloadTemplate}
          className="flex items-center gap-2"
        >
          <Download className="w-4 h-4" />
          Baixar Template
        </Button>
      </div>

      <Select value={selectedPrincipal} onValueChange={setSelectedPrincipal}>
        <SelectTrigger>
          <SelectValue placeholder="Selecione a representada" />
        </SelectTrigger>
        <SelectContent>
          {principals.map(p => (
            <SelectItem key={p.id} value={p.id}>
              {p.trade_name || p.company_name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <div className="border-2 border-dashed border-slate-300 rounded-lg p-6 text-center">
        <Input
          type="file"
          accept=".csv"
          onChange={handleFileChange}
          className="hidden"
          id="stock-file"
        />
        <label htmlFor="stock-file" className="cursor-pointer">
          <div className="flex flex-col items-center gap-2">
            <Upload className="w-8 h-8 text-slate-400" />
            <p className="text-sm font-medium">Clique ou arraste um arquivo CSV</p>
            <p className="text-xs text-slate-500">{file?.name || 'Nenhum arquivo selecionado'}</p>
          </div>
        </label>
      </div>

      {preview && (
        <div className="space-y-3">
          <p className="text-sm font-medium text-slate-700">
            Prévia: {preview.total} item(ns) para importar
          </p>
          
          <div className="overflow-x-auto border rounded-lg">
            <table className="w-full text-xs">
              <thead className="bg-slate-50">
                <tr>
                  {preview.headers.map(h => (
                    <th key={h} className="p-2 text-left font-medium">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {preview.rows.map((row, i) => (
                  <tr key={i} className="border-t hover:bg-slate-50">
                    {preview.headers.map(h => (
                      <td key={h} className="p-2 text-slate-600">{row[h]}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {errors.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3">
          <div className="flex items-start gap-2 mb-2">
            <AlertCircle className="w-5 h-5 text-red-600 mt-0.5" />
            <p className="font-medium text-red-900">Erros encontrados:</p>
          </div>
          <ul className="text-sm text-red-800 space-y-1">
            {errors.slice(0, 10).map((err, i) => (
              <li key={i}>• {err}</li>
            ))}
            {errors.length > 10 && <li>• +{errors.length - 10} erro(s)</li>}
          </ul>
        </div>
      )}

      <Button
        onClick={handleImport}
        disabled={!file || !selectedPrincipal || isLoading}
        className="w-full bg-emerald-600 hover:bg-emerald-700"
      >
        {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
        {isLoading ? 'Importando...' : 'Importar Estoque'}
      </Button>
    </div>
  );
}