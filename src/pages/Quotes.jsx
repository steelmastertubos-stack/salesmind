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

  const createMutation = useMutation({
    mutationFn: async (data) => {
      const quoteNumber = `ORC-${Date.now().toString().slice(-6)}`;
      return base44.entities.Quote.create({ ...data, quote_number: quoteNumber });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['quotes'] });
      setShowForm(false);
      toast.success('Orçamento criado com sucesso!');
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Quote.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['quotes'] });
      setShowForm(false);
      setEditingQuote(null);
      toast.success('Orçamento atualizado com sucesso!');
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

  const handleStatusChange = (quote, newStatus) => {
    const updateData = { status: newStatus };
    if (newStatus === 'sent') {
      updateData.sent_date = new Date().toISOString().split('T')[0];
    } else if (newStatus === 'approved') {
      updateData.approved_date = new Date().toISOString().split('T')[0];
    }
    updateMutation.mutate({ id: quote.id, data: updateData });
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

  const getStatusConfig = (status) => {
    switch (status) {
      case 'draft':
        return { color: 'bg-slate-100 text-slate-700', label: 'Rascunho' };
      case 'sent':
        return { color: 'bg-blue-100 text-blue-700', label: 'Enviado' };
      case 'negotiating':
        return { color: 'bg-amber-100 text-amber-700', label: 'Em Negociação' };
      case 'approved':
        return { color: 'bg-emerald-100 text-emerald-700', label: 'Aprovado' };
      case 'lost':
        return { color: 'bg-red-100 text-red-700', label: 'Perdido' };
      case 'converted':
        return { color: 'bg-purple-100 text-purple-700', label: 'Convertido' };
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
            <SelectItem value="draft">Rascunho</SelectItem>
            <SelectItem value="sent">Enviado</SelectItem>
            <SelectItem value="negotiating">Em Negociação</SelectItem>
            <SelectItem value="approved">Aprovado</SelectItem>
            <SelectItem value="lost">Perdido</SelectItem>
            <SelectItem value="converted">Convertido</SelectItem>
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
                          <DropdownMenuItem onClick={() => {
                            setEditingQuote(quote);
                            setShowForm(true);
                          }}>
                            <Edit className="w-4 h-4 mr-2" />
                            Editar
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          {quote.status === 'draft' && (
                            <DropdownMenuItem onClick={() => handleStatusChange(quote, 'sent')}>
                              <Send className="w-4 h-4 mr-2" />
                              Marcar como Enviado
                            </DropdownMenuItem>
                          )}
                          {(quote.status === 'sent' || quote.status === 'negotiating') && (
                            <>
                              <DropdownMenuItem onClick={() => handleStatusChange(quote, 'negotiating')}>
                                <MessageCircle className="w-4 h-4 mr-2" />
                                Em Negociação
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleStatusChange(quote, 'approved')}>
                                <CheckCircle className="w-4 h-4 mr-2" />
                                Marcar como Aprovado
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleStatusChange(quote, 'lost')}>
                                <XCircle className="w-4 h-4 mr-2" />
                                Marcar como Perdido
                              </DropdownMenuItem>
                            </>
                          )}
                          {quote.status === 'approved' && (
                            <DropdownMenuItem onClick={() => setConvertingQuote(quote)}>
                              <ShoppingCart className="w-4 h-4 mr-2" />
                              Converter em Pedido
                            </DropdownMenuItem>
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