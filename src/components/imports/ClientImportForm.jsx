import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Upload, Download, AlertCircle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import * as XLSX from 'xlsx';

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

const parseExcel = (fileContent) => {
  const workbook = XLSX.read(fileContent, { type: 'binary' });
  const worksheet = workbook.Sheets[workbook.SheetNames[0]];
  const data = XLSX.utils.sheet_to_json(worksheet);
  
  if (data.length === 0) return { headers: [], rows: [] };
  
  const headers = Object.keys(data[0]);
  const rows = data.map(row => {
    const cleanRow = {};
    headers.forEach(header => {
      cleanRow[header] = (row[header] || '').toString().trim();
    });
    return cleanRow;
  });
  
  return { headers, rows };
};

const downloadTemplate = () => {
  const content = `code,company_name,trade_name,cnpj,email,phone,whatsapp,address,city,state,zip,country,responsible_user,status,notes
CLI001,Empresa Ltda,Empresa,12.345.678/0001-99,contato@empresa.com,1133334444,11987654321,Rua A 100,São Paulo,SP,01234567,Brasil,João Silva,active,Cliente prioritário
CLI002,Outro Negócio,Outro,98.765.432/0001-00,contato@outro.com,2133334444,21987654321,Rua B 200,Rio de Janeiro,RJ,20234567,Brasil,Maria Santos,active,`;
  
  const element = document.createElement('a');
  element.setAttribute('href', 'data:text/csv;charset=utf-8,' + encodeURIComponent(content));
  element.setAttribute('download', 'template-clientes.csv');
  element.style.display = 'none';
  document.body.appendChild(element);
  element.click();
  document.body.removeChild(element);
};

export default function ClientImportForm({ onSuccess }) {
  const [file, setFile] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [preview, setPreview] = useState(null);
  const [errors, setErrors] = useState([]);

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      const isExcel = selectedFile.name.endsWith('.xlsx') || selectedFile.name.endsWith('.xls');
      const reader = new FileReader();
      
      reader.onload = (event) => {
        try {
          const content = event.target.result;
          const { headers, rows } = isExcel ? parseExcel(content) : parseCSV(content);
          
          if (rows.length === 0) {
            toast.error('Arquivo vazio');
            return;
          }
          
          setFile(selectedFile);
          setPreview({ headers, rows: rows.slice(0, 5), total: rows.length });
          setErrors([]);
        } catch (error) {
          toast.error('Erro ao ler o arquivo');
        }
      };
      
      if (isExcel) {
        reader.readAsBinaryString(selectedFile);
      } else {
        reader.readAsText(selectedFile);
      }
    }
  };

  const validateRow = (row, index) => {
    const rowErrors = [];
    
    if (!row.company_name?.trim()) rowErrors.push(`Linha ${index + 2}: company_name obrigatório`);
    if (!row.cnpj?.trim()) rowErrors.push(`Linha ${index + 2}: CNPJ obrigatório`);
    if (row.cnpj && !/^\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}$/.test(row.cnpj)) {
      rowErrors.push(`Linha ${index + 2}: CNPJ em formato inválido (XX.XXX.XXX/XXXX-XX)`);
    }
    if (!row.email?.trim()) rowErrors.push(`Linha ${index + 2}: email obrigatório`);
    if (!row.phone?.trim()) rowErrors.push(`Linha ${index + 2}: phone obrigatório`);
    
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
        const isExcel = file.name.endsWith('.xlsx') || file.name.endsWith('.xls');
        const { rows } = isExcel ? parseExcel(event.target.result) : parseCSV(event.target.result);
        
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
        const batchId = `CLIENT-${Date.now()}`;

        // Preparar dados
         const clients = rows.map(row => ({
           code: row.code || `CLI-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
           company_name: row.company_name,
           trade_name: row.trade_name || row.company_name,
           cnpj: row.cnpj,
           email: row.email,
           phone: row.phone,
           whatsapp: row.whatsapp || row.phone || '',
           address: row.address || '',
           city: row.city || '',
           state: row.state || '',
           zip_code: row.zip || '',
           country: row.country || 'Brasil',
           contact_name: row.responsible_user || '',
           status: (row.status || 'active').toLowerCase() === 'active' ? 'active' : 'inactive',
           notes: row.notes || '',
           is_active: (row.status || 'active').toLowerCase() === 'active',
           import_batch_id: batchId
         }));

        // Importar em lotes
        const batchSize = 50;
        let imported = 0;
        
        for (let i = 0; i < clients.length; i += batchSize) {
          const batch = clients.slice(i, i + batchSize);
          await base44.entities.Client.bulkCreate(batch);
          imported += batch.length;
        }

        await base44.entities.ImportBatch.create({
          batch_id: batchId,
          entity_type: 'Client',
          records_count: imported,
          file_name: file.name,
          status: 'active'
        });

        toast.success(`${imported} clientes importados com sucesso!`);
        setFile(null);
        setPreview(null);
        onSuccess?.();
      } catch (error) {
        console.error('Erro na importação:', error);
        toast.error('Erro ao importar clientes');
      } finally {
        setIsLoading(false);
      }
    };
    
    const isExcel = file.name.endsWith('.xlsx') || file.name.endsWith('.xls');
    if (isExcel) {
      reader.readAsBinaryString(file);
    } else {
      reader.readAsText(file);
    }
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
          accept=".csv,.xlsx,.xls"
          onChange={handleFileChange}
          className="hidden"
          id="client-file"
        />
        <label htmlFor="client-file" className="cursor-pointer">
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
            Prévia: {preview.total} cliente(s) para importar
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
        {isLoading ? 'Importando...' : 'Importar Clientes'}
      </Button>
    </div>
  );
}