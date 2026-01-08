import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  ShoppingCart, 
  Search,
  Filter,
  MoreVertical,
  Eye,
  FileText,
  Truck,
  CheckCircle,
  DollarSign,
  AlertTriangle
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import PageHeader from '@/components/common/PageHeader';
import EmptyState from '@/components/common/EmptyState';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';

export default function Orders() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [viewingOrder, setViewingOrder] = useState(null);
  const [invoiceDialog, setInvoiceDialog] = useState(null);
  const [invoiceData, setInvoiceData] = useState({ invoice_number: '', invoice_date: '', invoiced_value: '' });

  const queryClient = useQueryClient();

  const { data: orders = [], isLoading } = useQuery({
    queryKey: ['orders'],
    queryFn: () => base44.entities.Order.list('-created_date', 200)
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Order.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      setInvoiceDialog(null);
      toast.success('Pedido atualizado com sucesso!');
    }
  });

  const handleStatusChange = (order, newStatus) => {
    updateMutation.mutate({ id: order.id, data: { status: newStatus } });
  };

  const handleCommissionStatusChange = (order, newStatus) => {
    updateMutation.mutate({ id: order.id, data: { commission_status: newStatus } });
  };

  const handleInvoiceSubmit = () => {
    if (invoiceDialog) {
      updateMutation.mutate({
        id: invoiceDialog.id,
        data: {
          invoice_number: invoiceData.invoice_number,
          invoice_date: invoiceData.invoice_date,
          invoiced_value: parseFloat(invoiceData.invoiced_value) || invoiceDialog.total_value,
          status: 'invoiced',
          commission_status: 'invoiced'
        }
      });
    }
  };

  const filteredOrders = orders.filter(order => {
    const matchesSearch = 
      (order.order_number?.toLowerCase() || '').includes(search.toLowerCase()) ||
      (order.client_name?.toLowerCase() || '').includes(search.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || order.status === statusFilter;
    
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
      case 'pending':
        return { color: 'bg-amber-100 text-amber-700', label: 'Pendente' };
      case 'confirmed':
        return { color: 'bg-blue-100 text-blue-700', label: 'Confirmado' };
      case 'in_production':
        return { color: 'bg-purple-100 text-purple-700', label: 'Em Produção' };
      case 'shipped':
        return { color: 'bg-cyan-100 text-cyan-700', label: 'Enviado' };
      case 'delivered':
        return { color: 'bg-teal-100 text-teal-700', label: 'Entregue' };
      case 'invoiced':
        return { color: 'bg-emerald-100 text-emerald-700', label: 'Faturado' };
      case 'cancelled':
        return { color: 'bg-red-100 text-red-700', label: 'Cancelado' };
      default:
        return { color: 'bg-slate-100 text-slate-700', label: status };
    }
  };

  const getCommissionStatusConfig = (status) => {
    switch (status) {
      case 'pending':
        return { color: 'bg-slate-100 text-slate-700', label: 'Pendente', icon: DollarSign };
      case 'invoiced':
        return { color: 'bg-blue-100 text-blue-700', label: 'Faturada', icon: FileText };
      case 'paid':
        return { color: 'bg-emerald-100 text-emerald-700', label: 'Paga', icon: CheckCircle };
      case 'at_risk':
        return { color: 'bg-amber-100 text-amber-700', label: 'Em Risco', icon: AlertTriangle };
      case 'glossed':
        return { color: 'bg-red-100 text-red-700', label: 'Glosada', icon: AlertTriangle };
      case 'disputed':
        return { color: 'bg-orange-100 text-orange-700', label: 'Em Disputa', icon: AlertTriangle };
      default:
        return { color: 'bg-slate-100 text-slate-700', label: status, icon: DollarSign };
    }
  };

  // Commission Summary
  const commissionSummary = {
    pending: orders.filter(o => o.commission_status === 'pending').reduce((s, o) => s + (o.expected_commission || 0), 0),
    invoiced: orders.filter(o => o.commission_status === 'invoiced').reduce((s, o) => s + (o.expected_commission || 0), 0),
    paid: orders.filter(o => o.commission_status === 'paid').reduce((s, o) => s + (o.commission_paid_value || o.expected_commission || 0), 0),
    atRisk: orders.filter(o => ['at_risk', 'glossed', 'disputed'].includes(o.commission_status)).reduce((s, o) => s + (o.expected_commission || 0), 0)
  };

  return (
    <div className="pb-20 lg:pb-6">
      <PageHeader 
        title="Pedidos" 
        subtitle={`${orders.length} pedidos`}
      />

      {/* Commission Summary */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        <div className="bg-white rounded-xl p-4 border border-slate-100">
          <p className="text-xs text-slate-500 mb-1">Comissão Pendente</p>
          <p className="text-lg font-bold text-slate-900">{formatCurrency(commissionSummary.pending)}</p>
        </div>
        <div className="bg-white rounded-xl p-4 border border-slate-100">
          <p className="text-xs text-slate-500 mb-1">Comissão Faturada</p>
          <p className="text-lg font-bold text-blue-600">{formatCurrency(commissionSummary.invoiced)}</p>
        </div>
        <div className="bg-white rounded-xl p-4 border border-slate-100">
          <p className="text-xs text-slate-500 mb-1">Comissão Paga</p>
          <p className="text-lg font-bold text-emerald-600">{formatCurrency(commissionSummary.paid)}</p>
        </div>
        <div className="bg-white rounded-xl p-4 border border-slate-100">
          <p className="text-xs text-slate-500 mb-1">Comissão em Risco</p>
          <p className="text-lg font-bold text-red-600">{formatCurrency(commissionSummary.atRisk)}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input
            placeholder="Buscar pedido..."
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
            <SelectItem value="pending">Pendente</SelectItem>
            <SelectItem value="confirmed">Confirmado</SelectItem>
            <SelectItem value="in_production">Em Produção</SelectItem>
            <SelectItem value="shipped">Enviado</SelectItem>
            <SelectItem value="delivered">Entregue</SelectItem>
            <SelectItem value="invoiced">Faturado</SelectItem>
            <SelectItem value="cancelled">Cancelado</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Orders List */}
      {isLoading ? (
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="bg-white rounded-2xl p-4 border border-slate-100">
              <Skeleton className="h-5 w-32 mb-2" />
              <Skeleton className="h-4 w-48" />
            </div>
          ))}
        </div>
      ) : filteredOrders.length > 0 ? (
        <div className="space-y-3">
          {filteredOrders.map((order) => {
            const status = getStatusConfig(order.status);
            const commStatus = getCommissionStatusConfig(order.commission_status);
            const CommIcon = commStatus.icon;

            return (
              <div key={order.id} className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden hover:shadow-md transition-shadow">
                <div className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-slate-900">{order.order_number || `PED-${order.id.slice(-6)}`}</h3>
                        <Badge className={status.color}>{status.label}</Badge>
                      </div>
                      <p className="text-sm text-slate-600">{order.client_name}</p>
                      <p className="text-xs text-slate-400">{order.principal_name}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-emerald-600">{formatCurrency(order.total_value)}</p>
                      <p className="text-xs text-slate-400">
                        {new Date(order.created_date).toLocaleDateString('pt-BR')}
                      </p>
                    </div>
                  </div>

                  {/* Commission Info */}
                  <div className="bg-slate-50 rounded-lg p-3 mb-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <CommIcon className="w-4 h-4 text-slate-500" />
                        <span className="text-sm text-slate-600">Comissão</span>
                        <Badge className={commStatus.color} variant="outline">
                          {commStatus.label}
                        </Badge>
                      </div>
                      <span className="font-semibold text-slate-900">
                        {formatCurrency(order.expected_commission)}
                      </span>
                    </div>
                    {order.invoice_number && (
                      <p className="text-xs text-slate-500 mt-1">
                        NF: {order.invoice_number} - {new Date(order.invoice_date).toLocaleDateString('pt-BR')}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                    <div className="text-xs text-slate-500">
                      {order.items?.length || 0} item(s)
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="outline" size="sm">
                          Ações
                          <MoreVertical className="w-4 h-4 ml-1" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => setViewingOrder(order)}>
                          <Eye className="w-4 h-4 mr-2" />
                          Visualizar
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => handleStatusChange(order, 'confirmed')}>
                          <CheckCircle className="w-4 h-4 mr-2" />
                          Confirmar Pedido
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleStatusChange(order, 'shipped')}>
                          <Truck className="w-4 h-4 mr-2" />
                          Marcar como Enviado
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => {
                          setInvoiceDialog(order);
                          setInvoiceData({
                            invoice_number: order.invoice_number || '',
                            invoice_date: order.invoice_date || new Date().toISOString().split('T')[0],
                            invoiced_value: order.invoiced_value || order.total_value
                          });
                        }}>
                          <FileText className="w-4 h-4 mr-2" />
                          Registrar NF
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => handleCommissionStatusChange(order, 'paid')}>
                          <DollarSign className="w-4 h-4 mr-2" />
                          Comissão Paga
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleCommissionStatusChange(order, 'at_risk')}>
                          <AlertTriangle className="w-4 h-4 mr-2" />
                          Comissão em Risco
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <EmptyState
          icon={ShoppingCart}
          title="Nenhum pedido encontrado"
          description="Os pedidos aparecem aqui quando orçamentos são convertidos"
        />
      )}

      {/* View Order Dialog */}
      <Dialog open={!!viewingOrder} onOpenChange={() => setViewingOrder(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Pedido {viewingOrder?.order_number || viewingOrder?.id?.slice(-6)}</DialogTitle>
          </DialogHeader>
          {viewingOrder && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-slate-500">Cliente</p>
                  <p className="font-medium">{viewingOrder.client_name}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500">Representado</p>
                  <p className="font-medium">{viewingOrder.principal_name}</p>
                </div>
              </div>

              <div>
                <p className="text-xs text-slate-500 mb-2">Itens</p>
                <div className="space-y-2">
                  {viewingOrder.items?.map((item, i) => (
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

              <div className="grid grid-cols-2 gap-4 bg-slate-50 rounded-lg p-4">
                <div>
                  <p className="text-xs text-slate-500">Total do Pedido</p>
                  <p className="text-xl font-bold text-emerald-600">{formatCurrency(viewingOrder.total_value)}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500">Comissão Prevista</p>
                  <p className="text-xl font-bold text-slate-900">{formatCurrency(viewingOrder.expected_commission)}</p>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Invoice Dialog */}
      <Dialog open={!!invoiceDialog} onOpenChange={() => setInvoiceDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Registrar Nota Fiscal</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Número da NF</Label>
              <Input
                value={invoiceData.invoice_number}
                onChange={(e) => setInvoiceData({ ...invoiceData, invoice_number: e.target.value })}
                placeholder="Número da nota fiscal"
              />
            </div>
            <div className="space-y-2">
              <Label>Data da NF</Label>
              <Input
                type="date"
                value={invoiceData.invoice_date}
                onChange={(e) => setInvoiceData({ ...invoiceData, invoice_date: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Valor Faturado</Label>
              <Input
                type="number"
                step="0.01"
                value={invoiceData.invoiced_value}
                onChange={(e) => setInvoiceData({ ...invoiceData, invoiced_value: e.target.value })}
              />
            </div>
            <div className="flex justify-end gap-3 pt-4">
              <Button variant="outline" onClick={() => setInvoiceDialog(null)}>Cancelar</Button>
              <Button onClick={handleInvoiceSubmit} className="bg-[#1e3a5f] hover:bg-[#2d4a6f]">
                Salvar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}