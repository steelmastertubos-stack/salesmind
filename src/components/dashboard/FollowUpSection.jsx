import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertCircle, Clock, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';

export default function FollowUpSection({ tasks = [] }) {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  // Separar follow-ups por categoria
  const overdueFollowUps = tasks.filter(t => {
    const dueDate = new Date(t.scheduled_date);
    return dueDate < today && t.status === 'pending' && t.task_type === 'follow_up';
  });

  const todayFollowUps = tasks.filter(t => {
    const dueDate = new Date(t.scheduled_date);
    return dueDate.getTime() === today.getTime() && t.status === 'pending' && t.task_type === 'follow_up';
  });

  const upcomingFollowUps = tasks.filter(t => {
    const dueDate = new Date(t.scheduled_date);
    return dueDate > today && t.status === 'pending' && t.task_type === 'follow_up';
  });

  if (tasks.length === 0) {
    return null;
  }

  return (
    <div className="grid lg:grid-cols-3 gap-4">
      {/* Follow-ups Atrasados */}
      {overdueFollowUps.length > 0 && (
        <Card className="border-red-200 bg-red-50/50">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-red-900">
              <AlertCircle className="w-5 h-5 text-red-600" />
              Atrasados
              <Badge className="bg-red-600 ml-auto">{overdueFollowUps.length}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {overdueFollowUps.slice(0, 3).map(task => (
              <Link
                key={task.id}
                to={createPageUrl(`ClientDetails?id=${task.client_id}`)}
                className="block p-2 rounded hover:bg-red-100 transition-colors"
              >
                <p className="text-sm font-medium text-slate-900">{task.title}</p>
                <p className="text-xs text-slate-600">{task.client_name}</p>
              </Link>
            ))}
            {overdueFollowUps.length > 3 && (
              <p className="text-xs text-red-600 font-medium">
                +{overdueFollowUps.length - 3} mais
              </p>
            )}
            <Button
              size="sm"
              variant="outline"
              className="w-full mt-2 border-red-600 text-red-600 hover:bg-red-100"
              asChild
            >
              <Link to={createPageUrl('Tasks')}>Ver todos</Link>
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Follow-ups de Hoje */}
      {todayFollowUps.length > 0 && (
        <Card className="border-yellow-200 bg-yellow-50/50">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-yellow-900">
              <Clock className="w-5 h-5 text-yellow-600" />
              Para Hoje
              <Badge className="bg-yellow-600 ml-auto">{todayFollowUps.length}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {todayFollowUps.slice(0, 3).map(task => (
              <Link
                key={task.id}
                to={createPageUrl(`ClientDetails?id=${task.client_id}`)}
                className="block p-2 rounded hover:bg-yellow-100 transition-colors"
              >
                <p className="text-sm font-medium text-slate-900">{task.title}</p>
                <p className="text-xs text-slate-600">{task.client_name}</p>
              </Link>
            ))}
            {todayFollowUps.length > 3 && (
              <p className="text-xs text-yellow-600 font-medium">
                +{todayFollowUps.length - 3} mais
              </p>
            )}
          </CardContent>
        </Card>
      )}

      {/* Próximos Follow-ups */}
      {upcomingFollowUps.length > 0 && (
        <Card className="border-emerald-200 bg-emerald-50/50">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-emerald-900">
              <CheckCircle2 className="w-5 h-5 text-emerald-600" />
              Próximos
              <Badge className="bg-emerald-600 ml-auto">{upcomingFollowUps.length}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {upcomingFollowUps.slice(0, 3).map(task => (
              <div key={task.id} className="p-2 rounded hover:bg-emerald-100 transition-colors">
                <p className="text-sm font-medium text-slate-900">{task.title}</p>
                <p className="text-xs text-slate-600">{task.client_name}</p>
              </div>
            ))}
            {upcomingFollowUps.length > 3 && (
              <p className="text-xs text-emerald-600 font-medium">
                +{upcomingFollowUps.length - 3} mais
              </p>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}