import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  FileText, 
  Search,
  Filter,
  MoreVertical,
  Edit,
  Trash2,
  Send,
  CheckCircle,
  XCircle,
  ShoppingCart,
  Eye,
  MessageCircle,
  Mail
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import PageHeader from '@/components/common/PageHeader';
import SteelQuoteForm from '@/components/quotes/SteelQuoteForm';
import EmptyState from '@/components/common/EmptyState';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import ConvertQuoteDialog from '@/components/orders/ConvertQuoteDialog';
import QuotePrintView from '@/components/quotes/QuotePrintView';
import QuotePDFExport from '@/components/quotes/QuotePDFExport';
import SendQuoteDialog from '@/components/quotes/SendQuoteDialog';
import { createOpportunityFromQuote } from '@/components/utils/opportunityHelpers';
import { jsPDF } from 'jspdf';

export default function Quotes() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showForm, setShowForm] = useState(false);
  const [editingQuote, setEditingQuote] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [viewingQuote, setViewingQuote] = useState(null);
  const [clientIdFromUrl, setClientIdFromUrl] = useState(null);
  const [convertingQuote, setConvertingQuote] = useState(null);
  const [printingQuote, setPrintingQuote] = useState(null);
  const [sendingQuote, setSendingQuote] = useState(null);

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const clientId = urlParams.get('clientId');
    if (clientId) {
      setClientIdFromUrl(clientId);
      setShowForm(true);
    }
  }, []);

  const queryClient = useQueryClient();

  const { data: quotes = [], isLoading } = useQuery({
    queryKey: ['quotes'],
    queryFn: () => base44.entities.Quote.list('-created_date', 200)
  });

  const { data: representative = [] } = useQuery({
    queryKey: ['representative'],
    queryFn: () => base44.entities.Representative.list('-created_date', 1)
  });

  const { data: clients = [] } = useQuery({
    queryKey: ['clients'],
    queryFn: () => base44.entities.Client.list('company_name', 500)
  });

  const { data: principals = [] } = useQuery({
    queryKey: ['principals'],
    queryFn: () => base44.entities.Principal.list('-created_date', 100)
  });

  const createMutation = useMutation({
    mutationFn: async (data) => {
      const quoteNumber = `ORC-${Date.now().toString().slice(-6)}`;
      const quote = await base44.entities.Quote.create({ ...data, quote_number: quoteNumber });
      
      // AUTOMAÇÃO: Criar oportunidade se orçamento já criado como emitido/enviado
      if ((data.status === 'emitido' || data.status === 'enviado')) {
        const client = clients.find(c => c.id === data.client_id);
        try {
          await createOpportunityFromQuote(quote, client);
          await base44.entities.Quote.update(quote.id, { is_locked: true });
        } catch (error) {
          console.error('Error creating opportunity:', error);
        }
      }
      
      return quote;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['quotes'] });
      queryClient.invalidateQueries({ queryKey: ['opportunities'] });
      setShowForm(false);
      toast.success('Orçamento criado com sucesso!');
    }
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }) => {
      const updated = await base44.entities.Quote.update(id, data);
      
      // AUTOMAÇÃO: Criar oportunidade se status mudou para emitido/enviado
            if ((data.status === 'emitido' || data.status === 'enviado')) {
              const quote = quotes.find(q => q.id === id);
              const client = clients.find(c => c.id === quote?.client_id);

              if (quote && !quote.is_locked) {
                try {
                  await createOpportunityFromQuote({ ...quote, ...data }, client);
                  await base44.entities.Quote.update(id, { is_locked: true });
                  toast.success('Orçamento atualizado e oportunidade criada automaticamente!');
                } catch (error) {
                  console.error('Error creating opportunity:', error);
                  toast.error('Erro ao criar oportunidade');
                }
              }
            }
      
      return updated;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['quotes'] });
      queryClient.invalidateQueries({ queryKey: ['opportunities'] });
      setShowForm(false);
      setEditingQuote(null);
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Quote.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['quotes'] });
      setDeleteConfirm(null);
      toast.success('Orçamento excluído com sucesso!');
    }
  });

  const handleSave = (data) => {
    if (editingQuote) {
      updateMutation.mutate({ id: editingQuote.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const handleStatusChange = async (quote, newStatus) => {
    const updateData = { status: newStatus };
    
    if (newStatus === 'emitido') {
      // Gerar PDF automaticamente
      toast.info('Gerando PDF...');
      // Aguardar um pouco para garantir que o toast apareça
      setTimeout(() => {
        generateQuotePDF(quote);
      }, 300);
    } else if (newStatus === 'enviado') {
      // Abrir modal de envio
      setSendingQuote(quote);
      updateData.sent_date = new Date().toISOString().split('T')[0];
    }
    
    updateMutation.mutate({ id: quote.id, data: updateData });
  };

  const generateQuotePDF = (quote) => {
    try {
      const doc = new jsPDF();
      const rep = representative[0];
      
      // Simplified PDF generation
      doc.setFontSize(16);
      doc.text(`Orçamento ${quote.quote_number}`, 20, 20);
      doc.setFontSize(10);
      doc.text(`Cliente: ${quote.client_name}`, 20, 35);
      doc.text(`Representado: ${quote.principal_name}`, 20, 42);
      doc.text(`Valor Total: ${formatCurrency(quote.total_value)}`, 20, 49);
      
      doc.save(`Orcamento_${quote.quote_number}.pdf`);
      toast.success('PDF gerado com sucesso!');
    } catch (error) {
      console.error('Error generating PDF:', error);
      toast.error('Erro ao gerar PDF');
    }
  };

  const convertToOrderMutation = useMutation({
    mutationFn: async ({ quote, notes }) => {
      const orderNumber = `PED-${Date.now().toString().slice(-6)}`;
      const orderData = {
        order_number: orderNumber,
        quote_id: quote.id,
        client_id: quote.client_id,
        client_name: quote.client_name,
        principal_id: quote.principal_id,
        principal_name: quote.principal_name,
        items: quote.items,
        total_value: quote.total_value,
        total_weight: quote.items?.reduce((sum, item) => sum + (item.total_weight || 0), 0) || 0,
        total_icms: quote.total_icms,
        total_ipi: quote.total_ipi,
        payment_terms: quote.payment_terms,
        notes: notes || quote.notes,
        status: 'em_analise',
        commission_rate: quote.commission_rate || 0,
        expected_commission: (quote.total_value || 0) * ((quote.commission_rate || 0) / 100),
        status_history: [{
          status: 'em_analise',
          date: new Date().toISOString(),
          notes: 'Pedido criado a partir do orçamento'
        }]
      };
      
      const order = await base44.entities.Order.create(orderData);
      await base44.entities.Quote.update(quote.id, { status: 'converted' });
      return order;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['quotes'] });
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      setConvertingQuote(null);
      toast.success('Pedido criado com sucesso!');
    }
  });

  const filteredQuotes = quotes.filter(quote => {
    const matchesSearch = 
      (quote.quote_number?.toLowerCase() || '').includes(search.toLowerCase()) ||
      (quote.client_name?.toLowerCase() || '').includes(search.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || quote.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value || 0);
  };

  const calculateMarginAndCommission = (quote) => {
    const principal = principals.find(p => p.id === quote.principal_id);
    const isVTK = principal?.use_vtk_commission_table;
    
    if (!isVTK) {
      // Para outros representados, apenas comissão simples
      const commissionRate = principal?.commission_percentage || 0;
      const commissionValue = (quote.total_value || 0) * (commissionRate / 100);
      return { commissionValue, commissionRate, isVTK: false };
    }

    // Para VTK, calcular margem baseada nos itens
    let totalCost = 0;
    let totalSale = 0;

    quote.items?.forEach(item => {
      const itemCost = (item.cost_per_kg || 0) * (item.total_weight || item.quantity || 0);
      const itemSale = item.item_total || item.total_price || 0;
      totalCost += itemCost;
      totalSale += itemSale;
    });

    const margin = totalCost > 0 ? ((totalSale - totalCost) / totalCost) * 100 : 0;
    
    // Buscar comissão na tabela VTK
    let commissionRate = 0;
    if (principal.vtk_commission_table) {
      const bracket = principal.vtk_commission_table.find(
        b => margin >= b.min_margin && margin <= b.max_margin
      );
      commissionRate = bracket?.commission_rate || 0;
    }

    const commissionValue = (quote.total_value || 0) * (commissionRate / 100);
    
    return { margin, commissionValue, commissionRate, isVTK: true };
  };

  const getStatusConfig = (status) => {
    switch (status) {
      case 'rascunho':
        return { color: 'bg-slate-100 text-slate-700', label: 'Rascunho' };
      case 'emitido':
        return { color: 'bg-blue-100 text-blue-700', label: 'Emitido' };
      case 'enviado':
        return { color: 'bg-indigo-100 text-indigo-700', label: 'Enviado' };
      case 'convertido':
        return { color: 'bg-green-100 text-green-700', label: 'Convertido' };
      case 'cancelado':
        return { color: 'bg-red-100 text-red-700', label: 'Cancelado' };
      // Fallback para status antigos
      case 'draft':
        return { color: 'bg-slate-100 text-slate-700', label: 'Rascunho' };
      case 'sent':
        return { color: 'bg-blue-100 text-blue-700', label: 'Enviado' };
      default:
        return { color: 'bg-slate-100 text-slate-700', label: status };
    }
  };

  return (
    <div className="pb-20 lg:pb-6">
      <PageHeader 
        title="Orçamentos" 
        subtitle={`${quotes.length} orçamentos`}
        actionLabel="Novo Orçamento"
        onAction={() => {
          setEditingQuote(null);
          setClientIdFromUrl(null);
          setShowForm(true);
        }}
      />

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input
            placeholder="Buscar orçamento..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-40">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="rascunho">Rascunho</SelectItem>
            <SelectItem value="emitido">Emitido</SelectItem>
            <SelectItem value="enviado">Enviado</SelectItem>
            <SelectItem value="convertido">Convertido</SelectItem>
            <SelectItem value="cancelado">Cancelado</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Quotes List */}
      {isLoading ? (
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="bg-white rounded-2xl p-4 border border-slate-100">
              <Skeleton className="h-5 w-32 mb-2" />
              <Skeleton className="h-4 w-48 mb-4" />
              <Skeleton className="h-10 w-full" />
            </div>
          ))}
        </div>
      ) : filteredQuotes.length > 0 ? (
        <div className="space-y-3">
          {filteredQuotes.map((quote) => {
            const status = getStatusConfig(quote.status);
            const { margin, commissionValue, commissionRate, isVTK } = calculateMarginAndCommission(quote);
            
            return (
              <div key={quote.id} className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden hover:shadow-md transition-shadow">
                <div className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-slate-900">{quote.quote_number}</h3>
                        <Badge className={status.color}>{status.label}</Badge>
                      </div>
                      <p className="text-sm text-slate-600">{quote.client_name}</p>
                      <p className="text-xs text-slate-400">{quote.principal_name}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-emerald-600">{formatCurrency(quote.total_value)}</p>
                      <p className="text-xs text-slate-400">
                        {new Date(quote.created_date).toLocaleDateString('pt-BR')}
                      </p>
                    </div>
                  </div>

                  {/* Comissão Info */}
                  {commissionValue > 0 && (
                    <div className="bg-amber-50 rounded-lg p-2 mb-3 border border-amber-200">
                      <div className="flex items-center justify-between text-xs">
                        {isVTK ? (
                          <>
                            <span className="text-amber-700 font-medium">
                              Margem: {margin.toFixed(2)}% • Comissão: {commissionRate}%
                            </span>
                            <span className="text-amber-900 font-bold">
                              {formatCurrency(commissionValue)}
                            </span>
                          </>
                        ) : (
                          <>
                            <span className="text-amber-700 font-medium">
                              Comissão: {commissionRate}%
                            </span>
                            <span className="text-amber-900 font-bold">
                              {formatCurrency(commissionValue)}
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  )}

                  <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                    <div className="text-xs text-slate-500">
                      {quote.items?.length || 0} item(s)
                    </div>
                    <div className="flex items-center gap-2">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="outline" size="sm">
                            Ações
                            <MoreVertical className="w-4 h-4 ml-1" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => setViewingQuote(quote)}>
                            <Eye className="w-4 h-4 mr-2" />
                            Visualizar
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => setPrintingQuote(quote)}>
                            <FileText className="w-4 h-4 mr-2" />
                            Imprimir Formato
                          </DropdownMenuItem>
                          {!quote.is_locked && (
                            <DropdownMenuItem onClick={() => {
                              setEditingQuote(quote);
                              setShowForm(true);
                            }}>
                              <Edit className="w-4 h-4 mr-2" />
                              Editar
                            </DropdownMenuItem>
                          )}
                          {quote.is_locked && (
                            <DropdownMenuItem disabled>
                              <Edit className="w-4 h-4 mr-2" />
                              Travado (Oportunidade criada)
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuSeparator />
                          {(quote.status === 'rascunho' || quote.status === 'draft') && (
                            <>
                              <DropdownMenuItem onClick={() => handleStatusChange(quote, 'emitido')} className="text-blue-600">
                                <CheckCircle className="w-4 h-4 mr-2" />
                                ✅ Emitir Orçamento
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleStatusChange(quote, 'enviado')} className="text-green-600">
                                <Send className="w-4 h-4 mr-2" />
                                📤 Enviar ao Cliente
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                            </>
                          )}
                          {quote.status === 'emitido' && (
                            <>
                              <DropdownMenuItem onClick={() => handleStatusChange(quote, 'enviado')} className="text-green-600">
                                <Send className="w-4 h-4 mr-2" />
                                📤 Enviar ao Cliente
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                            </>
                          )}
                          {quote.status === 'enviado' && (
                            <>
                              <DropdownMenuItem onClick={() => setSendingQuote(quote)} className="text-green-600">
                                <Send className="w-4 h-4 mr-2" />
                                📤 Reenviar ao Cliente
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                            </>
                          )}
                          <DropdownMenuSeparator />
                          <DropdownMenuItem 
                            className="text-red-600"
                            onClick={() => setDeleteConfirm(quote)}
                          >
                            <Trash2 className="w-4 h-4 mr-2" />
                            Excluir
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <EmptyState
          icon={FileText}
          title="Nenhum orçamento encontrado"
          description="Crie seu primeiro orçamento para começar a vender"
          actionLabel="Novo Orçamento"
          onAction={() => setShowForm(true)}
        />
      )}

      {/* Quote Form Dialog */}
      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingQuote ? 'Editar Orçamento' : 'Novo Orçamento'}
            </DialogTitle>
          </DialogHeader>
          <SteelQuoteForm
            quote={editingQuote}
            clientId={clientIdFromUrl}
            onSave={handleSave}
            onCancel={() => {
              setShowForm(false);
              setEditingQuote(null);
              setClientIdFromUrl(null);
            }}
            isLoading={createMutation.isPending || updateMutation.isPending}
          />
        </DialogContent>
      </Dialog>

      {/* View Quote Dialog */}
      <Dialog open={!!viewingQuote} onOpenChange={() => setViewingQuote(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Orçamento {viewingQuote?.quote_number}</DialogTitle>
          </DialogHeader>
          {viewingQuote && (
            <div className="space-y-4">
              <div className="flex justify-end mb-3">
                <QuotePDFExport quote={viewingQuote} representative={representative[0]} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-slate-500">Cliente</p>
                  <p className="font-medium">{viewingQuote.client_name}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500">Representado</p>
                  <p className="font-medium">{viewingQuote.principal_name}</p>
                </div>
              </div>

              <div>
                <p className="text-xs text-slate-500 mb-2">Itens</p>
                <div className="space-y-2">
                  {viewingQuote.items?.map((item, i) => (
                    <div key={i} className="bg-slate-50 rounded-lg p-3 flex justify-between">
                      <div>
                        <p className="font-medium text-sm">{item.product_name}</p>
                        <p className="text-xs text-slate-500">
                          {item.quantity} {item.unit} x {formatCurrency(item.unit_price)}
                        </p>
                      </div>
                      <p className="font-semibold">{formatCurrency(item.total_price)}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-emerald-50 rounded-lg p-4">
                <div className="flex justify-between items-center">
                  <span className="font-medium">Total</span>
                  <span className="text-xl font-bold text-emerald-600">
                    {formatCurrency(viewingQuote.total_value)}
                  </span>
                </div>
              </div>

              {viewingQuote.notes && (
                <div>
                  <p className="text-xs text-slate-500 mb-1">Observações</p>
                  <p className="text-sm text-slate-600">{viewingQuote.notes}</p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Convert to Order Dialog */}
      <ConvertQuoteDialog
        quote={convertingQuote}
        onConvert={({ notes }) => convertToOrderMutation.mutate({ quote: convertingQuote, notes })}
        onClose={() => setConvertingQuote(null)}
        isLoading={convertToOrderMutation.isPending}
      />

      {/* Print View Dialog */}
      <Dialog open={!!printingQuote} onOpenChange={() => setPrintingQuote(null)}>
        <DialogContent className="max-w-5xl max-h-[95vh] overflow-y-auto p-0">
          {printingQuote && (
            <QuotePrintView 
              quote={printingQuote} 
              representative={representative[0]}
              onClose={() => setPrintingQuote(null)}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Send Quote Dialog */}
      {sendingQuote && (
        <SendQuoteDialog
          quote={sendingQuote}
          client={clients.find(c => c.id === sendingQuote.client_id)}
          representative={representative[0]}
          onClose={() => setSendingQuote(null)}
        />
      )}

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteConfirm} onOpenChange={() => setDeleteConfirm(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir Orçamento</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir o orçamento "{deleteConfirm?.quote_number}"? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteMutation.mutate(deleteConfirm.id)}
              className="bg-red-600 hover:bg-red-700"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}