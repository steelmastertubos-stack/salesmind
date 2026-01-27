import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';

export function useSuggestedAction() {
  const { data: opportunities } = useQuery({
    queryKey: ['opportunities-priority'],
    queryFn: async () => {
      const opps = await base44.entities.Opportunity.list('-priority_score', 100);
      return opps;
    },
    staleTime: 5 * 60 * 1000 // 5 minutos
  });

  const { data: tasks } = useQuery({
    queryKey: ['tasks-overdue'],
    queryFn: async () => {
      const allTasks = await base44.entities.Task.list('-scheduled_date', 100);
      return allTasks;
    },
    staleTime: 5 * 60 * 1000
  });

  const { data: clients } = useQuery({
    queryKey: ['clients-at-risk'],
    queryFn: async () => {
      const allClients = await base44.entities.Client.list('company_name', 500);
      return allClients;
    },
    staleTime: 10 * 60 * 1000
  });

  // Calcular ação sugerida baseada em prioridades
  const suggestedAction = (() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // 1. CRÍTICO: Follow-ups vencidos
    const overdueFollowUps = tasks?.filter(t => {
      if (t.status !== 'pending' && t.status !== 'snoozed') return false;
      const taskDate = new Date(t.scheduled_date);
      return taskDate < today;
    }) || [];

    if (overdueFollowUps.length > 0) {
      return {
        priority: 'CRITICAL',
        icon: '🔴',
        title: 'Follow-ups Vencidos!',
        message: `${overdueFollowUps.length} ação${overdueFollowUps.length > 1 ? 'ões' : ''} vencida${overdueFollowUps.length > 1 ? 's' : ''} aguardando execução`,
        actionLabel: 'Ver Follow-ups',
        filterPage: 'Tasks',
        filterParams: { status: ['pending', 'snoozed'], overdue: true },
        color: 'from-red-600 to-red-700'
      };
    }

    // 2. ALTO: Follow-ups de hoje
    const todayFollowUps = tasks?.filter(t => {
      if (t.status !== 'pending' && t.status !== 'snoozed') return false;
      const taskDate = new Date(t.scheduled_date);
      taskDate.setHours(0, 0, 0, 0);
      return taskDate.getTime() === today.getTime();
    }) || [];

    if (todayFollowUps.length > 0) {
      return {
        priority: 'HIGH',
        icon: '🟠',
        title: 'Follow-ups do Dia',
        message: `${todayFollowUps.length} ação${todayFollowUps.length > 1 ? 'ões' : ''} planejada${todayFollowUps.length > 1 ? 's' : ''} para hoje`,
        actionLabel: 'Ver Tarefas',
        filterPage: 'Tasks',
        filterParams: { status: 'pending', date: today.toISOString().split('T')[0] },
        color: 'from-orange-600 to-orange-700'
      };
    }

    // 3. MÉDIO: Clientes em risco
    const clientsAtRisk = clients?.filter(c => c.status === 'at_risk') || [];

    if (clientsAtRisk.length > 0) {
      return {
        priority: 'MEDIUM',
        icon: '🟡',
        title: 'Clientes em Risco',
        message: `${clientsAtRisk.length} cliente${clientsAtRisk.length > 1 ? 's' : ''} requer${clientsAtRisk.length > 1 ? '' : 'm'} atenção urgente`,
        actionLabel: 'Ver Clientes',
        filterPage: 'Clients',
        filterParams: { status: 'at_risk' },
        color: 'from-yellow-600 to-yellow-700'
      };
    }

    // 4. BAIXO: Propostas sem retorno
    const staleLead = opportunities?.filter(o => {
      if (o.stage !== 'proposta_enviada') return false;
      const sentDate = new Date(o.last_contact_at || o.created_date);
      const daysSinceSent = Math.floor((new Date() - sentDate) / (1000 * 60 * 60 * 24));
      return daysSinceSent > 3;
    }) || [];

    if (staleLead.length > 0) {
      return {
        priority: 'LOW',
        icon: '🔵',
        title: 'Propostas sem Retorno',
        message: `${staleLead.length} proposta${staleLead.length > 1 ? 's' : ''} aguardando retorno há mais de 3 dias`,
        actionLabel: 'Acompanhar',
        filterPage: 'Opportunities',
        filterParams: { stage: 'proposta_enviada' },
        color: 'from-blue-600 to-blue-700'
      };
    }

    // Padrão: Nada crítico
    return {
      priority: 'NONE',
      icon: '✨',
      title: 'Sistema em Dia',
      message: 'Nenhuma ação urgente no momento. Continue acompanhando!',
      actionLabel: 'Ver Dashboard',
      filterPage: 'Dashboard',
      filterParams: {},
      color: 'from-green-600 to-green-700'
    };
  })();

  return {
    suggestedAction,
    isLoading: !opportunities || !tasks || !clients
  };
}