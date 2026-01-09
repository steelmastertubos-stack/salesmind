import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  Building2, 
  Plus, 
  Search,
  MoreVertical,
  Percent,
  Package,
  Truck,
  Edit,
  Trash2,
  Upload
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
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
import EmptyState from '@/components/common/EmptyState';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';

export default function Principals() {
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingPrincipal, setEditingPrincipal] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  const queryClient = useQueryClient();

  const { data: principals = [], isLoading } = useQuery({
    queryKey: ['principals'],
    queryFn: () => base44.entities.Principal.list('-created_date', 100)
  });

  const { data: products = [] } = useQuery({
    queryKey: ['products'],
    queryFn: () => base44.entities.Product.list('-created_date', 500)
  });

  const [formData, setFormData] = useState({
    company_name: '',
    trade_name: '',
    cnpj: '',
    phone: '',
    email: '',
    contact_name: '',
    logo_url: '',
    commission_percentage: '',
    tax_type: '',
    default_tax_rate: '',
    freight_policy: '',
    payment_terms: '',
    notes: '',
    is_active: true
  });

  const resetForm = () => {
    setFormData({
      company_name: '',
      trade_name: '',
      cnpj: '',
      phone: '',
      email: '',
      contact_name: '',
      logo_url: '',
      commission_percentage: '',
      tax_type: '',
      default_tax_rate: '',
      freight_policy: '',
      payment_terms: '',
      notes: '',
      is_active: true
    });
  };

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Principal.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['principals'] });
      setShowForm(false);
      resetForm();
      toast.success('Representado cadastrado com sucesso!');
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Principal.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['principals'] });
      setShowForm(false);
      setEditingPrincipal(null);
      resetForm();
      toast.success('Representado atualizado com sucesso!');
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Principal.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['principals'] });
      setDeleteConfirm(null);
      toast.success('Representado excluído com sucesso!');
    }
  });

  const handleEdit = (principal) => {
    setEditingPrincipal(principal);
    setFormData({
      company_name: principal.company_name || '',
      trade_name: principal.trade_name || '',
      cnpj: principal.cnpj || '',
      phone: principal.phone || '',
      email: principal.email || '',
      contact_name: principal.contact_name || '',
      logo_url: principal.logo_url || '',
      commission_percentage: principal.commission_percentage || '',
      tax_type: principal.tax_type || '',
      default_tax_rate: principal.default_tax_rate || '',
      freight_policy: principal.freight_policy || '',
      payment_terms: principal.payment_terms || '',
      notes: principal.notes || '',
      is_active: principal.is_active !== false
    });
    setShowForm(true);
  };

  const handleLogoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        const { file_url } = await base44.integrations.Core.UploadFile({ file });
        setFormData({ ...formData, logo_url: file_url });
        toast.success('Logo enviado com sucesso!');
      } catch (error) {
        toast.error('Erro ao enviar logo');
      }
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const data = {
      ...formData,
      commission_percentage: formData.commission_percentage ? parseFloat(formData.commission_percentage) : null,
      default_tax_rate: formData.default_tax_rate ? parseFloat(formData.default_tax_rate) : null
    };

    if (editingPrincipal) {
      updateMutation.mutate({ id: editingPrincipal.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const filteredPrincipals = principals.filter(p => 
    (p.company_name?.toLowerCase() || '').includes(search.toLowerCase()) ||
    (p.trade_name?.toLowerCase() || '').includes(search.toLowerCase()) ||
    (p.cnpj || '').includes(search)
  );

  const getProductCount = (principalId) => {
    return products.filter(p => p.principal_id === principalId).length;
  };

  const getFreightLabel = (type) => {
    switch (type) {
      case 'cif': return 'CIF';
      case 'fob': return 'FOB';
      case 'negotiable': return 'Negociável';
      default: return '-';
    }
  };

  const getTaxLabel = (type) => {
    switch (type) {
      case 'icms': return 'ICMS';
      case 'icms_st': return 'ICMS-ST';
      case 'simples': return 'Simples';
      case 'isento': return 'Isento';
      default: return '-';
    }
  };

  return (
    <div className="pb-20 lg:pb-6">
      <PageHeader 
        title="Representados" 
        subtitle={`${principals.length} empresas cadastradas`}
        actionLabel="Novo Representado"
        onAction={() => {
          setEditingPrincipal(null);
          resetForm();
          setShowForm(true);
        }}
      />

      {/* Search */}
      <div className="mb-6">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input
            placeholder="Buscar representado..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Principals List */}
      {isLoading ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="bg-white rounded-2xl p-4 border border-slate-100">
              <Skeleton className="h-12 w-12 rounded-xl mb-3" />
              <Skeleton className="h-5 w-32 mb-2" />
              <Skeleton className="h-4 w-24" />
            </div>
          ))}
        </div>
      ) : filteredPrincipals.length > 0 ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredPrincipals.map((principal) => (
            <div key={principal.id} className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden hover:shadow-md transition-shadow">
              <div className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl flex items-center justify-center text-white font-bold">
                      {(principal.trade_name || principal.company_name || '?').charAt(0)}
                    </div>
                    <div>
                      <h3 className="font-semibold text-slate-900 line-clamp-1">
                        {principal.trade_name || principal.company_name}
                      </h3>
                      <p className="text-xs text-slate-500">{principal.cnpj}</p>
                    </div>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreVertical className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => handleEdit(principal)}>
                        <Edit className="w-4 h-4 mr-2" />
                        Editar
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        className="text-red-600"
                        onClick={() => setDeleteConfirm(principal)}
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Excluir
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                <div className="grid grid-cols-3 gap-2 mt-4">
                  <div className="bg-slate-50 rounded-xl p-2.5 text-center">
                    <Percent className="w-4 h-4 text-slate-400 mx-auto mb-1" />
                    <p className="text-sm font-bold text-slate-900">
                      {principal.commission_percentage || '-'}%
                    </p>
                    <p className="text-[10px] text-slate-500">Comissão</p>
                  </div>
                  <div className="bg-slate-50 rounded-xl p-2.5 text-center">
                    <Package className="w-4 h-4 text-slate-400 mx-auto mb-1" />
                    <p className="text-sm font-bold text-slate-900">
                      {getProductCount(principal.id)}
                    </p>
                    <p className="text-[10px] text-slate-500">Produtos</p>
                  </div>
                  <div className="bg-slate-50 rounded-xl p-2.5 text-center">
                    <Truck className="w-4 h-4 text-slate-400 mx-auto mb-1" />
                    <p className="text-sm font-bold text-slate-900">
                      {getFreightLabel(principal.freight_policy)}
                    </p>
                    <p className="text-[10px] text-slate-500">Frete</p>
                  </div>
                </div>

                <div className="flex items-center gap-2 mt-4">
                  <Badge variant="outline" className="text-xs">
                    {getTaxLabel(principal.tax_type)}
                  </Badge>
                  {principal.is_active !== false && (
                    <Badge className="bg-emerald-100 text-emerald-700 text-xs">
                      Ativo
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <EmptyState
          icon={Building2}
          title="Nenhum representado cadastrado"
          description="Cadastre as empresas que você representa para começar a gerenciar seus produtos e vendas"
          actionLabel="Cadastrar Representado"
          onAction={() => setShowForm(true)}
        />
      )}

      {/* Form Dialog */}
      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingPrincipal ? 'Editar Representado' : 'Novo Representado'}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label>Logo da Empresa</Label>
              <div className="flex items-center gap-4">
                {formData.logo_url && (
                  <img 
                    src={formData.logo_url} 
                    alt="Logo"
                    className="h-16 object-contain border border-slate-200 rounded-lg px-2"
                  />
                )}
                <label className="cursor-pointer">
                  <div className="px-4 py-2 border-2 border-dashed border-slate-300 rounded-lg hover:border-slate-400 transition-colors">
                    <Upload className="w-5 h-5 mx-auto mb-1 text-slate-400" />
                    <span className="text-xs text-slate-600">Upload Logo</span>
                  </div>
                  <input 
                    type="file" 
                    className="hidden" 
                    accept="image/*"
                    onChange={handleLogoUpload}
                  />
                </label>
                {formData.logo_url && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setFormData({ ...formData, logo_url: '' })}
                  >
                    Remover
                  </Button>
                )}
              </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Razão Social *</Label>
                <Input
                  value={formData.company_name}
                  onChange={(e) => setFormData({ ...formData, company_name: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>Nome Fantasia</Label>
                <Input
                  value={formData.trade_name}
                  onChange={(e) => setFormData({ ...formData, trade_name: e.target.value })}
                />
              </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>CNPJ *</Label>
                <Input
                  value={formData.cnpj}
                  onChange={(e) => setFormData({ ...formData, cnpj: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>Contato</Label>
                <Input
                  value={formData.contact_name}
                  onChange={(e) => setFormData({ ...formData, contact_name: e.target.value })}
                />
              </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Telefone</Label>
                <Input
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>E-mail(s)</Label>
                <Input
                  type="text"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="email@exemplo.com; outro@exemplo.com"
                />
                <p className="text-xs text-slate-500">Separe múltiplos emails com ponto e vírgula (;)</p>
              </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>% Comissão</Label>
                <Input
                  type="number"
                  step="0.1"
                  value={formData.commission_percentage}
                  onChange={(e) => setFormData({ ...formData, commission_percentage: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Política de Frete</Label>
                <Select 
                  value={formData.freight_policy} 
                  onValueChange={(v) => setFormData({ ...formData, freight_policy: v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cif">CIF</SelectItem>
                    <SelectItem value="fob">FOB</SelectItem>
                    <SelectItem value="negotiable">Negociável</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Tributação</Label>
                <Select 
                  value={formData.tax_type} 
                  onValueChange={(v) => setFormData({ ...formData, tax_type: v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="icms">ICMS</SelectItem>
                    <SelectItem value="icms_st">ICMS-ST</SelectItem>
                    <SelectItem value="simples">Simples Nacional</SelectItem>
                    <SelectItem value="isento">Isento</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Alíquota Padrão (%)</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={formData.default_tax_rate}
                  onChange={(e) => setFormData({ ...formData, default_tax_rate: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Condições de Pagamento</Label>
              <Input
                value={formData.payment_terms}
                onChange={(e) => setFormData({ ...formData, payment_terms: e.target.value })}
                placeholder="Ex: 30/60/90 dias"
              />
            </div>

            <div className="space-y-2">
              <Label>Observações</Label>
              <Textarea
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                rows={2}
              />
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <Button type="button" variant="outline" onClick={() => setShowForm(false)}>
                Cancelar
              </Button>
              <Button 
                type="submit" 
                disabled={createMutation.isPending || updateMutation.isPending}
                className="bg-[#1e3a5f] hover:bg-[#2d4a6f]"
              >
                {createMutation.isPending || updateMutation.isPending ? 'Salvando...' : 'Salvar'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteConfirm} onOpenChange={() => setDeleteConfirm(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir Representado</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir "{deleteConfirm?.company_name}"? Esta ação não pode ser desfeita.
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