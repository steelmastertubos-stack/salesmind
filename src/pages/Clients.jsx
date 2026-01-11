import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  Search, 
  Filter,
  Users,
  Plus,
  X,
  SlidersHorizontal
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import PageHeader from '@/components/common/PageHeader';
import ClientCard from '@/components/clients/ClientCard';
import ClientForm from '@/components/forms/ClientForm';
import EmptyState from '@/components/common/EmptyState';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';

export default function Clients() {
  const queryClient = useQueryClient();
  
  // Check for segment filter from URL
  const urlParams = new URLSearchParams(window.location.search);
  const urlSegment = urlParams.get('segment');
  
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [segmentFilter, setSegmentFilter] = useState(urlSegment || 'all');
  const [showForm, setShowForm] = useState(false);
  const [editingClient, setEditingClient] = useState(null);
  const [showFilters, setShowFilters] = useState(false);

  const { data: clients = [], isLoading } = useQuery({
    queryKey: ['clients'],
    queryFn: () => base44.entities.Client.list('-opportunity_index', 200)
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Client.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      setShowForm(false);
      toast.success('Cliente cadastrado com sucesso!');
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Client.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      setShowForm(false);
      setEditingClient(null);
      toast.success('Cliente atualizado com sucesso!');
    }
  });

  const handleSave = (data) => {
    if (editingClient) {
      updateMutation.mutate({ id: editingClient.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const handleEdit = (client) => {
    setEditingClient(client);
    setShowForm(true);
  };

  const handleAddFollowUp = (client) => {
    // Navigate to follow-up creation
    window.location.href = `/ClientDetails?id=${client.id}&action=followup`;
  };

  const segments = [...new Set(clients.map(c => c.segment).filter(Boolean))];

  const filteredClients = clients.filter(client => {
    const matchesSearch = 
      (client.company_name?.toLowerCase() || '').includes(search.toLowerCase()) ||
      (client.trade_name?.toLowerCase() || '').includes(search.toLowerCase()) ||
      (client.cnpj || '').includes(search);
    
    const matchesStatus = statusFilter === 'all' || client.status === statusFilter;
    const matchesSegment = segmentFilter === 'all' || client.segment === segmentFilter;
    
    return matchesSearch && matchesStatus && matchesSegment;
  });

  const activeFilters = [
    statusFilter !== 'all' && statusFilter,
    segmentFilter !== 'all' && segmentFilter
  ].filter(Boolean).length;

  return (
    <div className="pb-20 lg:pb-6">
      <PageHeader 
        title="Clientes" 
        subtitle={`${clients.length} clientes cadastrados`}
        actionLabel="Novo Cliente"
        onAction={() => {
          setEditingClient(null);
          setShowForm(true);
        }}
      />

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input
            placeholder="Buscar por nome, fantasia ou CNPJ..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        
        <Sheet open={showFilters} onOpenChange={setShowFilters}>
          <SheetTrigger asChild>
            <Button variant="outline" className="relative">
              <SlidersHorizontal className="w-4 h-4 mr-2" />
              Filtros
              {activeFilters > 0 && (
                <Badge className="ml-2 bg-[#1e3a5f] text-white h-5 w-5 p-0 flex items-center justify-center">
                  {activeFilters}
                </Badge>
              )}
            </Button>
          </SheetTrigger>
          <SheetContent>
            <SheetHeader>
              <SheetTitle>Filtros</SheetTitle>
            </SheetHeader>
            <div className="space-y-6 mt-6">
              <div className="space-y-2">
                <label className="text-sm font-medium">Status</label>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Todos os status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    <SelectItem value="active">Ativo</SelectItem>
                    <SelectItem value="attention">Atenção</SelectItem>
                    <SelectItem value="at_risk">Em Risco</SelectItem>
                    <SelectItem value="inactive">Inativo</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Segmento</label>
                <Select value={segmentFilter} onValueChange={setSegmentFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Todos os segmentos" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    {segments.map(seg => (
                      <SelectItem key={seg} value={seg}>{seg}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <Button 
                variant="outline" 
                className="w-full"
                onClick={() => {
                  setStatusFilter('all');
                  setSegmentFilter('all');
                }}
              >
                Limpar Filtros
              </Button>
            </div>
          </SheetContent>
        </Sheet>
      </div>

      {/* Active Filters */}
      {activeFilters > 0 && (
        <div className="flex flex-wrap gap-2 mb-4">
          {statusFilter !== 'all' && (
            <Badge variant="secondary" className="pl-2">
              Status: {statusFilter}
              <button onClick={() => setStatusFilter('all')} className="ml-1 hover:bg-slate-200 rounded-full p-0.5">
                <X className="w-3 h-3" />
              </button>
            </Badge>
          )}
          {segmentFilter !== 'all' && (
            <Badge variant="secondary" className="pl-2">
              Segmento: {segmentFilter}
              <button onClick={() => setSegmentFilter('all')} className="ml-1 hover:bg-slate-200 rounded-full p-0.5">
                <X className="w-3 h-3" />
              </button>
            </Badge>
          )}
        </div>
      )}

      {/* Client List */}
      {isLoading ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="bg-white rounded-2xl p-4 border border-slate-100">
              <Skeleton className="h-12 w-12 rounded-xl mb-3" />
              <Skeleton className="h-5 w-32 mb-2" />
              <Skeleton className="h-4 w-24 mb-4" />
              <div className="grid grid-cols-4 gap-2 mb-4">
                {[...Array(4)].map((_, j) => (
                  <Skeleton key={j} className="h-14" />
                ))}
              </div>
              <Skeleton className="h-10 w-full" />
            </div>
          ))}
        </div>
      ) : filteredClients.length > 0 ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredClients.map((client) => (
            <ClientCard 
              key={client.id} 
              client={client}
              onEdit={handleEdit}
              onAddFollowUp={handleAddFollowUp}
            />
          ))}
        </div>
      ) : (
        <EmptyState
          icon={Users}
          title={search || activeFilters > 0 ? 'Nenhum cliente encontrado' : 'Nenhum cliente cadastrado'}
          description={search || activeFilters > 0 
            ? 'Tente ajustar os filtros ou buscar por outro termo'
            : 'Comece cadastrando seu primeiro cliente para gerenciar suas vendas'
          }
          actionLabel={!search && activeFilters === 0 ? 'Cadastrar Cliente' : undefined}
          onAction={!search && activeFilters === 0 ? () => setShowForm(true) : undefined}
        />
      )}

      {/* Client Form Dialog */}
      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingClient ? 'Editar Cliente' : 'Novo Cliente'}
            </DialogTitle>
          </DialogHeader>
          <ClientForm
            client={editingClient}
            onSave={handleSave}
            onCancel={() => {
              setShowForm(false);
              setEditingClient(null);
            }}
            isLoading={createMutation.isPending || updateMutation.isPending}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}