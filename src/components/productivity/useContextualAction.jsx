import { useLocation } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';

/**
 * Hook que retorna a ação contextual baseada na página atual e dados
 */
export function useContextualAction() {
  const location = useLocation();
  const pathname = location.pathname;

  // Extrair nome da página e parâmetros
  const getPageContext = () => {
    if (pathname.includes('/dashboard') || pathname === '/') {
      return { page: 'Dashboard', clientId: null, opportunityId: null };
    }
    if (pathname.includes('/clients') && pathname.split('/').length > 2) {
      const id = pathname.split('/')[2];
      return { page: 'ClientDetail', clientId: id, opportunityId: null };
    }
    if (pathname.includes('/clients')) {
      return { page: 'Clients', clientId: null, opportunityId: null };
    }
    if (pathname.includes('/opportunities') && pathname.split('/').length > 2) {
      const id = pathname.split('/')[2];
      return { page: 'OpportunityDetail', clientId: null, opportunityId: id };
    }
    if (pathname.includes('/opportunities')) {
      return { page: 'Opportunities', clientId: null, opportunityId: null };
    }
    if (pathname.includes('/quotes')) {
      return { page: 'Quotes', clientId: null, opportunityId: null };
    }
    if (pathname.includes('/orders')) {
      return { page: 'Orders', clientId: null, opportunityId: null };
    }
    if (pathname.includes('/products')) {
      return { page: 'Products', clientId: null, opportunityId: null };
    }
    return { page: 'Other', clientId: null, opportunityId: null };
  };

  const context = getPageContext();

  // Buscar dados do cliente se estiver em página de cliente
  const { data: client } = useQuery({
    queryKey: ['client-for-action', context.clientId],
    queryFn: () => base44.entities.Client.read(context.clientId),
    enabled: !!context.clientId,
    staleTime: 5 * 60 * 1000
  });

  // Definir ação contextual
  const getContextualAction = () => {
    switch (context.page) {
      case 'Dashboard':
      case 'Clients':
      case 'Quotes':
        return {
          label: 'Nova Oportunidade',
          icon: '✏️',
          action: 'create-opportunity',
          params: { clientId: null }
        };

      case 'ClientDetail':
        if (client?.status === 'inactive') {
          return {
            label: 'Reativar Cliente',
            icon: '🔄',
            action: 'reactivate-client',
            params: { clientId: context.clientId }
          };
        }
        return {
          label: 'Nova Oportunidade',
          icon: '✏️',
          action: 'create-opportunity',
          params: { clientId: context.clientId }
        };

      case 'OpportunityDetail':
        return {
          label: 'Criar Tarefa',
          icon: '📋',
          action: 'create-task',
          params: { opportunityId: context.opportunityId }
        };

      case 'Opportunities':
        return {
          label: 'Nova Oportunidade',
          icon: '✏️',
          action: 'create-opportunity',
          params: { clientId: null }
        };

      case 'Orders':
        return {
          label: 'Novo Pedido',
          icon: '📦',
          action: 'create-order',
          params: {}
        };

      case 'Products':
        return {
          label: 'Novo Produto',
          icon: '📌',
          action: 'create-product',
          params: {}
        };

      default:
        return {
          label: 'Nova Ação',
          icon: '⚡',
          action: 'create-opportunity',
          params: { clientId: null }
        };
    }
  };

  return {
    action: getContextualAction(),
    context,
    client
  };
}