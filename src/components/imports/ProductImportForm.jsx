import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Upload, Download, Check, AlertCircle, Loader2, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
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

const downloadTemplate = (principalName = 'REPRESENTADA', isNewAco = false) => {
  const content = isNewAco 
    ? `Representada,Código,Nome,Categoria,Unidade,Peso/metro,Preço Base (R$/kg),Custo (R$/kg),IPI (%),Status
${principalName},${principalName}-TQ-100x100x3.00,TUBO QUADRADO 100x100x3.00,tubos_quadrados_retangulares,kg,9.500,7.99,5.40,5.0,Ativo
${principalName},${principalName}-TQ-150x150x4.75,TUBO QUADRADO 150x150x4.75,tubos_quadrados_retangulares,kg,17.750,8.20,5.60,5.0,Ativo`
    : `Representada,Código,Nome,Categoria,Unidade,Peso/metro,Preço Base (R$/kg),Custo (R$/kg),IPI (%),Status
${principalName},${principalName}-TQ-100x100x3.00,TUBO QUADRADO 100x100x3.00,tubos_quadrados_retangulares,kg,9.420,7.99,5.40,5.0,Ativo
${principalName},${principalName}-TR-1/2,TUBO REDONDO 1/2",tubos_redondos,mt,0.850,12.50,9.80,12.5,Ativo`;
  
  const element = document.createElement('a');
  element.setAttribute('href', 'data:text/csv;charset=utf-8,' + encodeURIComponent(content));
  element.setAttribute('download', `template-produtos-${principalName}.csv`);
  element.style.display = 'none';
  document.body.appendChild(element);
  element.click();
  document.body.removeChild(element);
};

export default function ProductImportForm({ onSuccess }) {
  const [selectedPrincipalId, setSelectedPrincipalId] = useState('');
  const [file, setFile] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [preview, setPreview] = useState(null);
  const [errors, setErrors] = useState([]);

  const { data: principals = [] } = useQuery({
    queryKey: ['principals'],
    queryFn: () => base44.entities.Principal.list('company_name', 100)
  });

  const { data: allProducts = [] } = useQuery({
    queryKey: ['products'],
    queryFn: () => base44.entities.Product.list('name', 2500)
  });

  const selectedPrincipal = principals.find(p => p.id === selectedPrincipalId);
  const isNewAco = selectedPrincipal?.trade_name?.toUpperCase().includes('NEW') || 
                   selectedPrincipal?.company_name?.toUpperCase().includes('NEW');

  const handleDeleteAll = async () => {
    if (!confirm('⚠️ ATENÇÃO: Deseja EXCLUIR TODOS OS PRODUTOS do sistema? Esta ação não pode ser desfeita!')) {
      return;
    }
    
    if (!confirm('Tem certeza absoluta? Todos os produtos serão removidos permanentemente!')) {
      return;
    }

    setIsLoading(true);
    try {
      const productsToDelete = allProducts;
      let deleted = 0;
      
      for (const product of productsToDelete) {
        await base44.entities.Product.delete(product.id);
        deleted++;
      }

      toast.success(`${deleted} produtos excluídos com sucesso!`);
      onSuccess?.();
    } catch (error) {
      console.error('Erro ao excluir produtos:', error);
      toast.error('Erro ao excluir produtos');
    } finally {
      setIsLoading(false);
    }
  };

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
    
    // Aceitar tanto formato novo quanto exportado
    const code = row.code || row['Código'] || row.Codigo;
    const name = row.name || row['Nome'];
    const price = row.base_price_per_kg || row['Preço Base (R$/kg)'] || row['Preco Base (R$/kg)'];
    
    if (!code?.trim()) rowErrors.push(`Linha ${index + 2}: Código técnico obrigatório`);
    if (!name?.trim()) rowErrors.push(`Linha ${index + 2}: Nome do produto obrigatório`);
    if (!price) rowErrors.push(`Linha ${index + 2}: Preço base obrigatório`);
    if (isNaN(parseFloat(price))) rowErrors.push(`Linha ${index + 2}: Preço base deve ser um número`);
    
    return rowErrors;
  };

  const handleImport = async () => {
    if (!selectedPrincipalId) {
      toast.error('Selecione a representada');
      return;
    }
    
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

        // Identificar produtos existentes com os mesmos códigos da MESMA representada
        const existingProducts = allProducts.filter(p => 
          p.principal_id === selectedPrincipalId &&
          rows.some(row => {
            const code = row.code || row['Código'] || row.Codigo;
            return p.code === code?.replace(/"/g, '');
          })
        );

        // Desativar/excluir produtos duplicados com tratamento de erro
        if (existingProducts.length > 0) {
          toast.info(`Processando ${existingProducts.length} produtos duplicados...`);
          let softDeleted = 0;
          let hardDeleted = 0;
          let failed = 0;
          
          for (const product of existingProducts) {
            try {
              // Tentar soft delete primeiro
              await base44.entities.Product.update(product.id, { 
                is_active: false,
                deleted_at: new Date().toISOString()
              });
              softDeleted++;
            } catch (softError) {
              try {
                // Se soft delete falhar, tentar hard delete
                await base44.entities.Product.delete(product.id);
                hardDeleted++;
              } catch (hardError) {
                console.error('Erro ao remover produto duplicado:', product.code, hardError);
                failed++;
              }
            }
          }
          
          toast.success(`Duplicados processados: ${softDeleted} desativados, ${hardDeleted} excluídos${failed > 0 ? `, ${failed} falharam` : ''}`);
        }

        // Gerar ID do lote
        const batchId = `PROD-${Date.now()}`;

        // Preparar dados - aceitar formato exportado do CSV
        const products = rows.map(row => {
          // Remover aspas dos valores
          const cleanValue = (v) => v?.toString().replace(/"/g, '').trim();
          
          const code = cleanValue(row.code || row['Código'] || row.Codigo);
          const name = cleanValue(row.name || row['Nome']);
          const description = cleanValue(row.description || row['Descrição'] || row.Descricao || '');
          const category = cleanValue(row.category || row['Categoria']) || 'outros';
          const unit = cleanValue(row.unit || row['Unidade']) || 'kg';
          const weightPerMeter = parseFloat(cleanValue(row.weight_per_meter || row['Peso/metro'] || row['Peso/m'] || row.factor_6m || 0));
          const basePrice = parseFloat(cleanValue(row.base_price_per_kg || row['Preço Base (R$/kg)'] || row['Preco Base (R$/kg)']));
          const cost = parseFloat(cleanValue(row.cost_per_kg || row['Custo (R$/kg)'] || 0));
          const ipi = parseFloat(cleanValue(row.ipi_rate || row['IPI (%)'] || row['IPI'] || 0));
          const status = cleanValue(row.is_active || row.Status || 'Ativo');
          const isActive = status !== 'false' && status !== 'Inativo';

          return {
            principal_id: selectedPrincipalId,
            code,
            name,
            description,
            category,
            unit,
            weight_per_meter: weightPerMeter,
            base_price_per_kg: basePrice,
            cost_per_kg: cost,
            ipi_rate: ipi,
            is_active: isActive,
            import_batch_id: batchId
          };
        });

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
      <div className="bg-blue-50 border border-blue-300 rounded-lg p-4">
        <p className="text-sm font-medium text-blue-900 mb-2">
          ✅ Importação no Formato Exportado
        </p>
        <p className="text-xs text-blue-800 mb-2">
          Use o CSV exportado pela página de Produtos (mesmo formato). O sistema identifica e exclui automaticamente produtos duplicados (mesmo código) antes de importar.
        </p>
        <div className="bg-emerald-100 border border-emerald-300 rounded p-2 mt-2">
          <p className="text-xs font-semibold text-emerald-900">
            🔄 Produtos duplicados são removidos automaticamente
          </p>
          <p className="text-xs text-emerald-800 mt-1">
            Se o código já existe, o produto antigo será excluído e substituído pela nova versão
          </p>
        </div>
      </div>

      <div className="space-y-2">
        <Label className="text-sm font-medium">1. Selecione a Representada *</Label>
        <Select value={selectedPrincipalId} onValueChange={setSelectedPrincipalId}>
          <SelectTrigger className={!selectedPrincipalId ? 'border-red-300' : ''}>
            <SelectValue placeholder="Escolha a representada para importar produtos" />
          </SelectTrigger>
          <SelectContent>
            {principals.map(p => (
              <SelectItem key={p.id} value={p.id}>
                {p.trade_name || p.company_name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {!selectedPrincipalId && (
          <p className="text-xs text-red-600">Obrigatório selecionar a representada</p>
        )}
      </div>

      <div className="flex gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => downloadTemplate(
            selectedPrincipal?.trade_name?.toUpperCase() || 'REPRESENTADA',
            isNewAco
          )}
          className="flex items-center gap-2"
          disabled={!selectedPrincipalId}
        >
          <Download className="w-4 h-4" />
          Baixar Template {isNewAco && '(NEW AÇO)'}
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={handleDeleteAll}
          className="flex items-center gap-2 text-red-600 hover:text-red-700 hover:bg-red-50 ml-auto"
          disabled={isLoading || allProducts.length === 0}
        >
          <Trash2 className="w-4 h-4" />
          Excluir Todos ({allProducts.length})
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
        disabled={!selectedPrincipalId || !file || isLoading}
        className="w-full bg-emerald-600 hover:bg-emerald-700"
      >
        {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
        {isLoading ? 'Importando...' : `Importar Produtos para ${selectedPrincipal?.trade_name || 'Representada'}`}
      </Button>
    </div>
  );
}