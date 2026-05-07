import React, { useState, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { Upload, Download, AlertCircle, Loader2, CheckCircle2, Edit3, FileSpreadsheet, ChevronRight, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import * as XLSX from 'xlsx';

// ── Colunas esperadas ──────────────────────────────────────────────────────────
const EXPECTED_COLS = [
  { key: 'company_name', label: 'Razão Social',      required: true },
  { key: 'cnpj',         label: 'CNPJ',              required: true },
  { key: 'email',        label: 'E-mail',            required: false },
  { key: 'phone',        label: 'Telefone',          required: false },
  { key: 'whatsapp',     label: 'WhatsApp',          required: false },
  { key: 'contact_name', label: 'Nome do Responsável', required: false },
  { key: 'segment',      label: 'Segmento / Área',   required: false },
  { key: 'trade_name',   label: 'Nome Fantasia',     required: false },
  { key: 'city',         label: 'Cidade',            required: false },
  { key: 'state',        label: 'Estado (UF)',       required: false },
];

const SEGMENTS = [
  'Metalúrgica','Metalmecânica','Caldeiraria','Estruturas Metálicas','Engenharia',
  'Construtoras','Implemento Agrícola','Implemento Rodoviário','Agroindústria',
  'Óleo & Gás','Química / Petroquímica','Alimentos & Bebidas','Papel e Celulose',
  'Manutenção Industrial','Montagem Industrial','Distribuidor de Aço','Serralheria'
];

// ── Parse planilha ─────────────────────────────────────────────────────────────
const parseFile = (file, binary) => {
  const isExcel = /\.(xlsx|xls)$/i.test(file.name);
  const workbook = XLSX.read(binary, { type: isExcel ? 'binary' : 'string' });
  const ws = workbook.Sheets[workbook.SheetNames[0]];
  const data = XLSX.utils.sheet_to_json(ws, { defval: '' });
  return data.map(row => {
    const clean = {};
    Object.keys(row).forEach(k => { clean[k] = String(row[k] ?? '').trim(); });
    return clean;
  });
};

// ── Tentar mapear colunas da planilha ─────────────────────────────────────────
const autoMap = (sheetHeaders) => {
  const synonyms = {
    company_name: ['razao social','razão social','empresa','company_name','company name','nome empresa','nome da empresa'],
    cnpj:         ['cnpj','cpf/cnpj'],
    email:        ['email','e-mail','e_mail','correio'],
    phone:        ['telefone','fone','phone','tel','celular'],
    whatsapp:     ['whatsapp','wpp','zap','whats'],
    contact_name: ['responsavel','responsável','contato','nome contato','contact_name','nome responsável','nome do responsavel'],
    segment:      ['segmento','area','área','ramo','setor'],
    trade_name:   ['nome fantasia','trade_name','fantasia'],
    city:         ['cidade','city'],
    state:        ['estado','uf','state'],
  };

  const mapping = {};
  EXPECTED_COLS.forEach(({ key }) => {
    const found = sheetHeaders.find(h =>
      synonyms[key]?.some(s => h.toLowerCase().includes(s))
    );
    mapping[key] = found || '';
  });
  return mapping;
};

// ── Template download ──────────────────────────────────────────────────────────
const downloadTemplate = () => {
  // Aba principal com dados
  const wsData = [
    ['Razão Social *','CNPJ *','E-mail','Telefone','WhatsApp','Nome do Responsável','Segmento / Área','Nome Fantasia','Cidade','Estado'],
    ['Metalúrgica Santos Ltda','12.345.678/0001-99','contato@santos.com','11 3333-4444','11 9 8765-4321','Carlos Santos','Metalúrgica','Santos Metal','São Paulo','SP'],
    ['Caldeiraria Norte S/A','98.765.432/0001-00','comercial@cnorte.com.br','51 3222-8888','51 9 9876-5432','Ana Oliveira','Caldeiraria','CaldeNorte','Porto Alegre','RS'],
    ['Estruturas MG Ltda','11.222.333/0001-44','contato@estruturasmg.com','31 4000-1234','31 9 7654-3210','Roberto Lima','Estruturas Metálicas','','Belo Horizonte','MG'],
    ['Distribuidora Aço Sul Ltda','55.666.777/0001-88','vendas@acosul.com.br','41 3500-9900','','Marcos Pereira','Distribuidor de Aço','Aço Sul','Curitiba','PR'],
    ['Serralheria Nova Era ME','33.444.555/0001-11','','62 3100-0000','62 9 8888-7777','','Serralheria','Nova Era','Goiânia','GO'],
  ];

  const ws = XLSX.utils.aoa_to_sheet(wsData);

  // Largura das colunas
  ws['!cols'] = [
    { wch: 35 }, { wch: 20 }, { wch: 30 }, { wch: 16 },
    { wch: 18 }, { wch: 25 }, { wch: 28 }, { wch: 25 },
    { wch: 18 }, { wch: 8 },
  ];

  // Aba de instruções
  const wsInst = XLSX.utils.aoa_to_sheet([
    ['INSTRUÇÕES DE PREENCHIMENTO'],
    [''],
    ['CAMPOS OBRIGATÓRIOS (*)',''],
    ['Razão Social','Nome oficial da empresa conforme CNPJ'],
    ['CNPJ','Formato: 12.345.678/0001-99  (com pontos, barra e traço)'],
    [''],
    ['CAMPOS OPCIONAIS','Podem ser deixados em branco e preenchidos depois no sistema'],
    ['E-mail','E-mail principal de contato'],
    ['Telefone','Ex: 11 3333-4444 ou (11) 3333-4444'],
    ['WhatsApp','Ex: 11 9 8765-4321'],
    ['Nome do Responsável','Nome do contato principal da empresa'],
    ['Segmento / Área','Valores aceitos (copie exatamente):'],
    ['','Metalúrgica'],
    ['','Metalmecânica'],
    ['','Caldeiraria'],
    ['','Estruturas Metálicas'],
    ['','Engenharia'],
    ['','Construtoras'],
    ['','Implemento Agrícola'],
    ['','Implemento Rodoviário'],
    ['','Agroindústria'],
    ['','Óleo & Gás'],
    ['','Química / Petroquímica'],
    ['','Alimentos & Bebidas'],
    ['','Papel e Celulose'],
    ['','Manutenção Industrial'],
    ['','Montagem Industrial'],
    ['','Distribuidor de Aço'],
    ['','Serralheria'],
    ['Nome Fantasia','Nome popular / comercial da empresa'],
    ['Cidade','Ex: São Paulo'],
    ['Estado','Sigla da UF: SP, RJ, MG, RS...'],
    [''],
    ['DICAS',''],
    ['• Não altere os cabeçalhos da aba "Clientes"',''],
    ['• Remova as linhas de exemplo antes de importar (ou mantenha, o sistema detecta automaticamente)',''],
    ['• Aceita arquivos .xlsx, .xls e .csv',''],
    ['• Campos em branco podem ser preenchidos direto na tela de revisão antes de importar',''],
  ]);
  wsInst['!cols'] = [{ wch: 55 }, { wch: 30 }];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Clientes');
  XLSX.utils.book_append_sheet(wb, wsInst, 'Instruções');
  XLSX.writeFile(wb, 'modelo-importacao-clientes.xlsx');
};

// ── Componente principal ───────────────────────────────────────────────────────
export default function ClientImportForm({ onSuccess }) {
  const [step, setStep] = useState('upload'); // upload | map | review | done
  const [sheetRows, setSheetRows]   = useState([]);
  const [sheetHeaders, setSheetHeaders] = useState([]);
  const [mapping, setMapping]       = useState({});
  const [rows, setRows]             = useState([]); // rows with mapped + editable data
  const [isLoading, setIsLoading]   = useState(false);
  const fileRef = useRef();

  // ── Step 1: Upload ───────────────────────────────────────────────────────────
  const handleFile = (e) => {
    const f = e.target.files[0];
    if (!f) return;
    const isExcel = /\.(xlsx|xls)$/i.test(f.name);
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const parsed = parseFile(f, ev.target.result);
        if (!parsed.length) { toast.error('Arquivo vazio'); return; }
        const headers = Object.keys(parsed[0]);
        setSheetHeaders(headers);
        setSheetRows(parsed);
        setMapping(autoMap(headers));
        setStep('map');
      } catch { toast.error('Erro ao ler o arquivo'); }
    };
    isExcel ? reader.readAsBinaryString(f) : reader.readAsText(f);
  };

  // ── Step 2: Confirm mapping → build review rows ──────────────────────────────
  const handleConfirmMap = () => {
    const mapped = sheetRows.map((row, idx) => {
      const r = { _idx: idx };
      EXPECTED_COLS.forEach(({ key }) => {
        r[key] = mapping[key] ? (row[mapping[key]] || '') : '';
      });
      return r;
    });
    setRows(mapped);
    setStep('review');
  };

  // ── Step 3: Inline edit ───────────────────────────────────────────────────────
  const updateCell = (idx, key, val) => {
    setRows(prev => prev.map((r, i) => i === idx ? { ...r, [key]: val } : r));
  };

  const removeRow = (idx) => setRows(prev => prev.filter((_, i) => i !== idx));

  const validRows    = rows.filter(r => r.company_name?.trim() && r.cnpj?.trim());
  const invalidCount = rows.length - validRows.length;

  // ── Step 4: Import ────────────────────────────────────────────────────────────
  const handleImport = async () => {
    setIsLoading(true);
    const batchId = `CLIENT-${Date.now()}`;
    const clients = validRows.map(r => ({
      company_name: r.company_name.trim(),
      trade_name:   r.trade_name?.trim() || r.company_name.trim(),
      cnpj:         r.cnpj.trim(),
      email:        r.email?.trim() || '',
      phone:        r.phone?.trim() || '',
      whatsapp:     r.whatsapp?.trim() || r.phone?.trim() || '',
      contact_name: r.contact_name?.trim() || '',
      segment:      r.segment?.trim() || 'Metalúrgica',
      city:         r.city?.trim() || '',
      state:        r.state?.trim() || '',
      status:       'active',
      is_active:    true,
      import_batch_id: batchId,
    }));

    const size = 50;
    let imported = 0;
    for (let i = 0; i < clients.length; i += size) {
      await base44.entities.Client.bulkCreate(clients.slice(i, i + size));
      imported += Math.min(size, clients.length - i);
    }
    await base44.entities.ImportBatch.create({
      batch_id: batchId, entity_type: 'Client',
      records_count: imported, status: 'active',
    });

    setIsLoading(false);
    setStep('done');
    toast.success(`${imported} cliente(s) importado(s) com sucesso!`);
    onSuccess?.();
  };

  // ── Render ────────────────────────────────────────────────────────────────────
  if (step === 'done') {
    return (
      <div className="text-center py-12 space-y-4">
        <CheckCircle2 className="w-16 h-16 text-emerald-500 mx-auto" />
        <p className="text-xl font-semibold text-slate-800">Importação concluída!</p>
        <p className="text-slate-500">{validRows.length} clientes adicionados ao sistema.</p>
        <Button onClick={() => { setStep('upload'); setRows([]); setSheetRows([]); }}>
          Nova Importação
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-5">

      {/* Steps indicator */}
      <div className="flex items-center gap-1 text-xs font-medium">
        {['upload','map','review'].map((s, i) => (
          <React.Fragment key={s}>
            <span className={`px-2 py-1 rounded-full ${step === s ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-500'}`}>
              {i+1}. {s === 'upload' ? 'Arquivo' : s === 'map' ? 'Mapeamento' : 'Revisão'}
            </span>
            {i < 2 && <ChevronRight className="w-3 h-3 text-slate-300" />}
          </React.Fragment>
        ))}
      </div>

      {/* ── STEP 1: Upload ── */}
      {step === 'upload' && (
        <div className="space-y-4">
          <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4 flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-emerald-800">📥 Baixe o modelo de planilha</p>
              <p className="text-xs text-emerald-600 mt-0.5">Inclui exemplos preenchidos e aba com instruções detalhadas</p>
            </div>
            <Button variant="outline" size="sm" onClick={downloadTemplate} className="flex items-center gap-2 border-emerald-400 text-emerald-700 hover:bg-emerald-100 whitespace-nowrap ml-4">
              <Download className="w-4 h-4" /> Baixar Modelo .xlsx
            </Button>
          </div>

          <div
            className="border-2 border-dashed border-slate-300 rounded-xl p-10 text-center cursor-pointer hover:border-emerald-400 hover:bg-emerald-50/30 transition-colors"
            onClick={() => fileRef.current?.click()}
          >
            <FileSpreadsheet className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <p className="font-medium text-slate-700">Clique para selecionar o arquivo</p>
            <p className="text-xs text-slate-400 mt-1">CSV, XLS ou XLSX</p>
            <input ref={fileRef} type="file" accept=".csv,.xlsx,.xls" className="hidden" onChange={handleFile} />
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm text-blue-800 space-y-1">
            <p className="font-semibold">Campos obrigatórios na planilha:</p>
            <p>✅ Razão Social &nbsp;|&nbsp; ✅ CNPJ</p>
            <p className="text-blue-600">Os demais campos (e-mail, telefone, responsável, área) podem ser preenchidos após a importação diretamente no sistema.</p>
          </div>
        </div>
      )}

      {/* ── STEP 2: Column Mapping ── */}
      {step === 'map' && (
        <div className="space-y-4">
          <p className="text-sm text-slate-600">
            Encontramos <strong>{sheetRows.length}</strong> registro(s). Confirme o mapeamento das colunas:
          </p>

          <div className="border rounded-xl overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-4 py-2 text-left font-medium text-slate-600">Campo do sistema</th>
                  <th className="px-4 py-2 text-left font-medium text-slate-600">Coluna da planilha</th>
                  <th className="px-4 py-2 text-left font-medium text-slate-600">Prévia</th>
                </tr>
              </thead>
              <tbody>
                {EXPECTED_COLS.map(({ key, label, required }) => (
                  <tr key={key} className="border-t">
                    <td className="px-4 py-2 font-medium">
                      {label}
                      {required && <span className="ml-1 text-red-500">*</span>}
                    </td>
                    <td className="px-4 py-2">
                      <Select
                        value={mapping[key] || '__none__'}
                        onValueChange={v => setMapping(prev => ({ ...prev, [key]: v === '__none__' ? '' : v }))}
                      >
                        <SelectTrigger className="w-48 h-8 text-xs">
                          <SelectValue placeholder="Não mapeado" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="__none__">— Não mapeado —</SelectItem>
                          {sheetHeaders.map(h => (
                            <SelectItem key={h} value={h}>{h}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </td>
                    <td className="px-4 py-2 text-xs text-slate-500 max-w-[200px] truncate">
                      {mapping[key] ? (sheetRows[0]?.[mapping[key]] || '—') : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setStep('upload')}>Voltar</Button>
            <Button
              className="bg-emerald-600 hover:bg-emerald-700 flex-1"
              onClick={handleConfirmMap}
              disabled={!mapping['company_name'] || !mapping['cnpj']}
            >
              Continuar para Revisão <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          </div>
        </div>
      )}

      {/* ── STEP 3: Review + inline edit ── */}
      {step === 'review' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-slate-600">
              <strong>{validRows.length}</strong> prontos para importar
              {invalidCount > 0 && <span className="text-red-500 ml-2">· {invalidCount} inválido(s) – sem Razão Social ou CNPJ</span>}
            </p>
            <p className="text-xs text-slate-400 flex items-center gap-1">
              <Edit3 className="w-3 h-3" /> Clique nas células para editar
            </p>
          </div>

          <div className="border rounded-xl overflow-auto max-h-[480px]">
            <table className="w-full text-xs min-w-[900px]">
              <thead className="bg-slate-50 sticky top-0 z-10">
                <tr>
                  <th className="px-2 py-2 text-left">#</th>
                  {EXPECTED_COLS.map(({ key, label, required }) => (
                    <th key={key} className="px-2 py-2 text-left whitespace-nowrap">
                      {label}{required && <span className="text-red-500 ml-0.5">*</span>}
                    </th>
                  ))}
                  <th className="px-2 py-2"></th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row, idx) => {
                  const invalid = !row.company_name?.trim() || !row.cnpj?.trim();
                  return (
                    <tr key={idx} className={`border-t ${invalid ? 'bg-red-50' : 'hover:bg-slate-50'}`}>
                      <td className="px-2 py-1 text-slate-400">{idx + 1}</td>
                      {EXPECTED_COLS.map(({ key, required }) => (
                        <td key={key} className="px-1 py-1">
                          {key === 'segment' ? (
                            <Select
                              value={row[key] || ''}
                              onValueChange={v => updateCell(idx, key, v)}
                            >
                              <SelectTrigger className={`h-7 text-xs min-w-[140px] ${!row[key] ? 'border-amber-300 bg-amber-50' : ''}`}>
                                <SelectValue placeholder="Selecionar..." />
                              </SelectTrigger>
                              <SelectContent>
                                {SEGMENTS.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                              </SelectContent>
                            </Select>
                          ) : (
                            <Input
                              value={row[key] || ''}
                              onChange={e => updateCell(idx, key, e.target.value)}
                              className={`h-7 text-xs min-w-[100px] ${required && !row[key]?.trim() ? 'border-red-400 bg-red-50' : !row[key]?.trim() ? 'border-amber-200 bg-amber-50/40' : ''}`}
                              placeholder={required ? '(obrigatório)' : '(opcional)'}
                            />
                          )}
                        </td>
                      ))}
                      <td className="px-1 py-1">
                        <button onClick={() => removeRow(idx)} className="p-1 text-slate-300 hover:text-red-500 transition-colors">
                          <X className="w-3 h-3" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {invalidCount > 0 && (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 flex gap-2 text-sm text-amber-800">
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <span>Linhas em vermelho não serão importadas por falta de Razão Social ou CNPJ. Complete os dados ou remova as linhas.</span>
            </div>
          )}

          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setStep('map')}>Voltar</Button>
            <Button
              className="bg-emerald-600 hover:bg-emerald-700 flex-1"
              onClick={handleImport}
              disabled={isLoading || validRows.length === 0}
            >
              {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {isLoading ? 'Importando...' : `Importar ${validRows.length} cliente(s)`}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}