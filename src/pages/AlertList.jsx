import React, { useState, useMemo } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { useSearchParams, Link } from 'react-router-dom';
import PageHeader from '@/components/common/PageHeader';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card } from '@/components/ui/card';
import { 
  AlertTriangle, 
  Clock, 
  TrendingDown,
  MessageCircle,
  Phone,
  Mail,
  ChevronRight,
  Filter,
  Search,
  MapPin
} from 'lucide-react';
import { processClientAlerts, filterByAlertType } from '@/components/utils/alertEngine';
import { createPageUrl } from '@/utils';

export default function AlertList() {
  const [searchParams] = useSearchParams();
  const alertType = searchParams.get('type') || 'RISK';
  const [search, setSearch] = useState('');
  const [segmentFilter, setSegmentFilter] = useState('all');

  const { data: clients = [] } = useQuery({
    queryKey: ['clients'],
    queryFn: () => base44.entities.Client.list('-opportunity_index', 500)
  });

  const { data: orders = [] } = useQuery({
    queryKey: ['orders'],
    queryFn: () => base44.entities.Order.list('-created_date', 1000)
  });

  const processedClients = useMemo(() => {
    const alerts = processClientAlerts(clients, orders);
    return filterByAlertType(alerts, alertType);
  }, [clients, orders, alertType]);

  const filteredClients = useMemo(() => {
    return processedClients.filter(c => {
      const matchesSearch = !search || 
        c.company_name?.toLowerCase().includes(search.toLowerCase()) ||
        c.trade_name?.toLowerCase().includes(search.toLowerCase());
      
      const matchesSegment = segmentFilter === 'all' || c.segment === segmentFilter;
      
      return matchesSearch && matchesSegment;
    });
  }, [processedClients, search, segmentFilter]);

  const segments = [...new Set(clients.map(c => c.segment).filter(Boolean))];

  const alertConfig = {
    RISK: {
      title: 'Clientes em Risco',
      subtitle: 'Ação de Recuperação',
      icon: AlertTriangle,
      color: 'text-red-600',
      bgColor: 'bg-red-50',
      borderColor: 'border-red-200'
    },
    ATTENTION: {
      title: 'Requerem Atenção',
      subtitle: 'Antecipar Compra',
      icon: Clock,
      color: 'text-amber-600',
      bgColor: 'bg-amber-50',
      borderColor: 'border-amber-200'
    },
    INACTIVE: {
      title: 'Clientes Inativos',
      subtitle: 'Reativar ou Classificar',
      icon: TrendingDown,
      color: 'text-slate-600',
      bgColor: 'bg-slate-50',
      borderColor: 'border-slate-200'
    }
  };

  const config = alertConfig[alertType];
  const Icon = config.icon;

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value || 0);
  };

  return (
    <div className="space-y-6 pb-20 lg:pb-6">
      <PageHeader 
        title={config.title}
        subtitle={config.subtitle}
        backTo="Dashboard"
      />

      {/* Filtros */}
      <Card className="p-4">
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
              placeholder="Buscar cliente..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={segmentFilter} onValueChange={setSegmentFilter}>
            <SelectTrigger className="w-full lg:w-48">
              <SelectValue placeholder="Todos os segmentos" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os segmentos</SelectItem>
              {segments.map(seg => (
                <SelectItem key={seg} value={seg}>{seg}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </Card>

      {/* Lista de Clientes */}
      <div className="space-y-3">
        {filteredClients.length === 0 ? (
          <Card className="p-8 text-center">
            <Icon className="w-12 h-12 mx-auto text-slate-300 mb-3" />
            <h3 className="font-semibold text-slate-900 mb-1">Nenhum cliente encontrado</h3>
            <p className="text-sm text-slate-500">Tente ajustar os filtros</p>
          </Card>
        ) : (
          filteredClients.map((client) => (
            <Card 
              key={client.id}
              className={`p-4 hover:shadow-md transition-shadow ${config.borderColor} border-l-4`}
            >
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                {/* Info */}
                <div className="flex-1">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h3 className="font-bold text-slate-900 text-lg">
                        {client.trade_name || client.company_name}
                      </h3>
                      <div className="flex items-center gap-2 text-sm text-slate-500 mt-1">
                        {client.city && client.state && (
                          <>
                            <MapPin className="w-3 h-3" />
                            <span>{client.city}/{client.state}</span>
                            <span>•</span>
                          </>
                        )}
                        <span>{client.segment || 'Sem segmento'}</span>
                      </div>
                    </div>
                    <Badge className={`${config.bgColor} ${config.color} border-0`}>
                      Score: {client.priorityScore}
                    </Badge>
                  </div>

                  {/* Métricas */}
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mt-3">
                    <div className="bg-slate-50 rounded-lg p-2">
                      <p className="text-xs text-slate-500">Última compra</p>
                      <p className="font-bold text-sm text-slate-900">{client.daysSince} dias atrás</p>
                    </div>
                    <div className="bg-slate-50 rounded-lg p-2">
                      <p className="text-xs text-slate-500">Ciclo médio</p>
                      <p className="font-bold text-sm text-slate-900">{client.avgCycle} dias</p>
                    </div>
                    <div className="bg-slate-50 rounded-lg p-2">
                      <p className="text-xs text-slate-500">Atraso</p>
                      <p className={`font-bold text-sm ${client.delay > 0 ? 'text-red-600' : 'text-green-600'}`}>
                        {client.delay > 0 ? `+${client.delay}` : '0'} dias
                      </p>
                    </div>
                    <div className="bg-slate-50 rounded-lg p-2">
                      <p className="text-xs text-slate-500">Ticket médio</p>
                      <p className="font-bold text-sm text-slate-900">{formatCurrency(client.avgTicket)}</p>
                    </div>
                  </div>

                  {client.mostPurchased && (
                    <div className="mt-2 text-xs text-slate-600">
                      <span className="font-medium">Produto principal:</span> {client.mostPurchased.name}
                    </div>
                  )}
                </div>

                {/* Ações */}
                <div className="flex lg:flex-col gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    className="flex-1 lg:w-32"
                    onClick={() => {
                      const message = `Olá! Gostaria de falar sobre uma oportunidade para ${client.trade_name || client.company_name}`;
                      window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, '_blank');
                    }}
                  >
                    <MessageCircle className="w-4 h-4 mr-2" />
                    WhatsApp
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="flex-1 lg:w-32"
                  >
                    <Phone className="w-4 h-4 mr-2" />
                    Ligar
                  </Button>
                  <Link to={createPageUrl(`ClientAlertDetail?clientId=${client.id}&alertType=${alertType}`)}>
                    <Button size="sm" className="w-full lg:w-32 bg-[#1DB954] hover:bg-[#1DB954]/90">
                      Detalhes
                      <ChevronRight className="w-4 h-4 ml-1" />
                    </Button>
                  </Link>
                </div>
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}