import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Upload, Download, Check, AlertCircle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';

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
  const content = `code,name,description,category,unit,weight_per_meter,base_price_per_kg,cost_per_kg,ipi_rate,is_active
TUBO-001,Tubo 1/2",Tubo sem costura,tubos_redondos,mt,0.5,150.00,120.00,12.5,true
TUBO-002,Tubo 3/4",Tubo sem costura,tubos_redondos,mt,0.75,180.00,145.00,12.5,true`;
  
  const element = document.createElement('a');
  element.setAttribute('href', 'data:text/csv;charset=utf-8,' + encodeURIComponent(content));
  element.setAttribute('download', 'template-produtos.csv');
  element.style.display = 'none';
  document.body.appendChild(element);
  element.click();
  document.body.removeChild(element);
};

export default function ProductImportForm({ onSuccess }) {
  const [file, setFile] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [preview, setPreview] = useState(null);
  const [errors, setErrors] = useState([]);

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
    
    if (!row.name?.trim()) rowErrors.push(`Linha ${index + 2}: Nome do produto obrigatório`);
    if (!row.base_price_per_kg) rowErrors.push(`Linha ${index + 2}: Preço base obrigatório`);
    if (isNaN(parseFloat(row.base_price_per_kg))) rowErrors.push(`Linha ${index + 2}: Preço base deve ser um número`);
    
    return rowErrors;
  };

  const handleImport = async () => {
    if (!file) {
      toast.error('Selecione um arquivo');
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

        // Gerar ID do lote
        const batchId = `PROD-${Date.now()}`;

        // Preparar dados
        const products = rows.map(row => ({
          code: row.code || '',
          name: row.name,
          description: row.description || '',
          category: row.category || 'outros',
          unit: row.unit || 'kg',
          weight_per_meter: parseFloat(row.weight_per_meter) || 0,
          base_price_per_kg: parseFloat(row.base_price_per_kg),
          cost_per_kg: parseFloat(row.cost_per_kg) || 0,
          ipi_rate: parseFloat(row.ipi_rate) || 0,
          is_active: row.is_active !== 'false',
          import_batch_id: batchId
        }));

        // Importar em lotes
        const batchSize = 50;
        let imported = 0;
        
        for (let i = 0; i < products.length; i += batchSize) {
          const batch = products.slice(i, i + batchSize);
          await base44.entities.Product.bulkCreate(batch);
          imported += batch.length;
        }

        // Registrar lote de importação
        await base44.entities.ImportBatch.create({
          batch_id: batchId,
          entity_type: 'Product',
          records_count: imported,
          file_name: file.name,
          status: 'active'
        });

        toast.success(`${imported} produtos importados com sucesso!`);
        setFile(null);
        setPreview(null);
        onSuccess?.();
      } catch (error) {
        console.error('Erro na importação:', error);
        toast.error('Erro ao importar produtos');
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

      <div className="border-2 border-dashed border-slate-300 rounded-lg p-6 text-center">
        <Input
          type="file"
          accept=".csv"
          onChange={handleFileChange}
          className="hidden"
          id="product-file"
        />
        <label htmlFor="product-file" className="cursor-pointer">
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
            Prévia: {preview.total} produto(s) para importar
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
        disabled={!file || isLoading}
        className="w-full bg-emerald-600 hover:bg-emerald-700"
      >
        {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
        {isLoading ? 'Importando...' : 'Importar Produtos'}
      </Button>
    </div>
  );
}