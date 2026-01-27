import React from 'react';
import { AlertCircle, Clock, Users, FileText, CheckCircle2, Zap } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';

/**
 * Ação do Dia (D1)
 * Mostra 1 (e só 1) ação principal baseada em prioridade
 */
export default function DailyActionAlert({ tasks = [], opportunities = [], clients = [] }) {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  // Contar follow-ups atrasados
  const overdueFollowUps = tasks.filter(t => {
    const dueDate = new Date(t.scheduled_date);
    return dueDate < today && t.status === 'pending' && t.task_type === 'follow_up';
  });

  // Contar follow-ups de hoje
  const todayFollowUps = tasks.filter(t => {
    const dueDate = new Date(t.scheduled_date);
    return dueDate.getTime() === today.getTime() && t.status === 'pending' && t.task_type === 'follow_up';
  });

  // Contar clientes em risco
  const riskClients = clients.filter(c => c.status === 'at_risk');

  // Contar propostas sem retorno (> 10 dias sem contato)
  const stalProposals = opportunities.filter(opp => {
    if (opp.status !== 'proposta_enviada' && opp.status !== 'em_negociacao') return false;
    const lastContact = new Date(opp.last_contact_at || opp.created_date);
    const daysSince = Math.floor((now - lastContact) / (1000 * 60 * 60 * 24));
    return daysSince > 10;
  });

  // Determinar ação principal (prioridade)
  let action = null;
  let priority = 'info';

  if (overdueFollowUps.length > 0) {
    action = {
      type: 'overdue',
      title: `⚠️ Você tem ${overdueFollowUps.length} follow-up${overdueFollowUps.length > 1 ? 's' : ''} ATRASADO${overdueFollowUps.length > 1 ? 'S' : ''}`,
      description: 'Estes precisam de ação HOJE. Clique para ver.',
      icon: AlertCircle,
      color: 'red',
      cta: 'Ver Atrasados',
      link: 'Tasks'
    };
    priority = 'critical';
  } else if (todayFollowUps.length > 0) {
    action = {
      type: 'today',
      title: `📋 Você tem ${todayFollowUps.length} follow-up para HOJE`,
      description: 'Mantenha as oportunidades quentes com estes contatos.',
      icon: Clock,
      color: 'yellow',
      cta: 'Ver Tarefas de Hoje',
      link: 'Tasks'
    };
    priority = 'high';
  } else if (riskClients.length > 0) {
    action = {
      type: 'risk',
      title: `🚨 ${riskClients.length} cliente${riskClients.length > 1 ? 's' : ''} EM RISCO`,
      description: 'Clientes inativos ou próximos de cancelar.',
      icon: Users,
      color: 'orange',
      cta: 'Ver Clientes',
      link: 'Clients'
    };
    priority = 'high';
  } else if (stalProposals.length > 0) {
    action = {
      type: 'stale',
      title: `📧 ${stalProposals.length} proposta${stalProposals.length > 1 ? 's' : ''} SEM RETORNO`,
      description: 'Estes orçamentos podem esfriar. Retome o contato.',
      icon: FileText,
      color: 'blue',
      cta: 'Ver Propostas',
      link: 'Opportunities'
    };
    priority = 'medium';
  } else {
    action = {
      type: 'clear',
      title: '✅ Tudo em dia!',
      description: 'Ótimo trabalho! Nenhuma ação urgente. Que tal criar uma nova oportunidade?',
      icon: CheckCircle2,
      color: 'green',
      cta: 'Nova Oportunidade',
      link: 'Opportunities'
    };
    priority = 'success';
  }

  if (!action) return null;

  const IconComponent = action.icon;
  const colorMap = {
    red: 'bg-red-50 border-red-200 text-red-900',
    yellow: 'bg-yellow-50 border-yellow-200 text-yellow-900',
    orange: 'bg-orange-50 border-orange-200 text-orange-900',
    blue: 'bg-blue-50 border-blue-200 text-blue-900',
    green: 'bg-emerald-50 border-emerald-200 text-emerald-900'
  };

  const badgeMap = {
    red: 'bg-red-600',
    yellow: 'bg-yellow-600',
    orange: 'bg-orange-600',
    blue: 'bg-blue-600',
    green: 'bg-emerald-600'
  };

  return (
    <Card className={`border-2 ${colorMap[action.color]} cursor-pointer hover:shadow-lg transition-shadow`}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3 flex-1">
            <IconComponent className={`w-6 h-6 mt-1 flex-shrink-0`} />
            <div>
              <CardTitle className="text-lg">{action.title}</CardTitle>
              <p className="text-sm mt-1 opacity-80">{action.description}</p>
            </div>
          </div>
          {priority && (
            <Badge className={`${badgeMap[action.color]} whitespace-nowrap`}>
              {priority === 'critical' ? '🔴 CRÍTICO' : priority === 'high' ? '🟡 ALTO' : '🔵 INFO'}
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <Button asChild className="w-full" variant={priority === 'critical' ? 'default' : 'outline'}>
          <Link to={createPageUrl(action.link)}>
            <Zap className="w-4 h-4 mr-2" />
            {action.cta}
          </Link>
        </Button>
      </CardContent>
    </Card>
  );
}