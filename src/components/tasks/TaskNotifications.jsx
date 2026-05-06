import React, { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Bell, Clock, Phone, X, Check } from 'lucide-react';
import { toast } from 'sonner';

export default function TaskNotifications() {
  const [activeNotifications, setActiveNotifications] = useState([]);
  const [handledIds, setHandledIds] = useState(new Set());
  const queryClient = useQueryClient();

  const { data: tasks = [] } = useQuery({
    queryKey: ['tasks'],
    queryFn: () => base44.entities.Task.list('-scheduled_date', 100),
    refetchInterval: 60000 // Recarrega a cada 1 minuto
  });

  const updateTaskMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Task.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['tasks']);
    }
  });

  useEffect(() => {
    if (tasks.length > 0) {
      checkForReminders();
    }
  }, [tasks, handledIds]);

  const checkForReminders = () => {
    const now = new Date();
    const notifications = [];

    tasks.forEach(task => {
      if (task.status !== 'pending') return;
      if (handledIds.has(task.id)) return;

      const scheduledDateTime = new Date(`${task.scheduled_date}T${task.scheduled_time}`);
      const oneHourBefore = new Date(scheduledDateTime.getTime() - 60 * 60 * 1000);
      const fiveMinutesBefore = new Date(scheduledDateTime.getTime() - 5 * 60 * 1000);

      // Se está no momento ou passou
      if (now >= scheduledDateTime) {
        notifications.push({
          id: task.id,
          task,
          type: 'now',
          message: `AGORA: ${task.title}`,
          urgent: true
        });
      }
      // Se falta 5 minutos
      else if (now >= fiveMinutesBefore && !task.reminder_sent) {
        notifications.push({
          id: task.id,
          task,
          type: 'soon',
          message: `Em 5 min: ${task.title}`,
          urgent: true
        });
      }
      // Se falta 1 hora e ainda não enviou lembrete
      else if (now >= oneHourBefore && !task.reminder_sent) {
        notifications.push({
          id: task.id,
          task,
          type: 'hour',
          message: `Em 1 hora: ${task.title}`,
          urgent: false
        });
        
        // Marcar como lembrete enviado
        updateTaskMutation.mutate({
          id: task.id,
          data: { reminder_sent: true, reminder_datetime: now.toISOString() }
        });
      }

      // Verificar snooze
      if (task.snoozed_until) {
        const snoozeUntil = new Date(task.snoozed_until);
        if (now >= snoozeUntil) {
          notifications.push({
            id: task.id,
            task,
            type: 'snoozed',
            message: `Lembrete: ${task.title}`,
            urgent: true
          });
        }
      }
    });

    setActiveNotifications(notifications);

    // Toasts para novas notificações
    notifications.forEach(notif => {
      if (notif.urgent) {
        toast.info(notif.message, {
          duration: 10000,
          icon: '🔔'
        });
      }
    });
  };

  const removeNotification = (taskId) => {
    setHandledIds(prev => new Set([...prev, taskId]));
    setActiveNotifications(prev => prev.filter(n => n.id !== taskId));
  };

  const handleSnooze = (taskId, minutes) => {
    const snoozeUntil = new Date(Date.now() + minutes * 60 * 1000);
    removeNotification(taskId);
    updateTaskMutation.mutate({
      id: taskId,
      data: { 
        status: 'snoozed',
        snoozed_until: snoozeUntil.toISOString()
      }
    });
    toast.success(`Lembrete adiado por ${minutes} minutos`);
  };

  const handleComplete = (taskId) => {
    removeNotification(taskId);
    updateTaskMutation.mutate({
      id: taskId,
      data: { 
        status: 'completed',
        completed_at: new Date().toISOString()
      }
    });
    toast.success('Tarefa concluída!');
  };

  const handleDismiss = (taskId) => {
    removeNotification(taskId);
  };

  if (activeNotifications.length === 0) return null;

  return (
    <div className="fixed bottom-20 lg:bottom-6 right-4 z-50 space-y-2 max-w-sm">
      {activeNotifications.map(notif => (
        <Card key={notif.id} className={`${notif.urgent ? 'border-red-500 border-2 shadow-lg' : 'border-amber-500'} animate-in slide-in-from-right`}>
          <CardContent className="pt-4">
            <div className="flex items-start gap-3">
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${notif.urgent ? 'bg-red-100' : 'bg-amber-100'}`}>
                {notif.type === 'now' || notif.type === 'soon' ? (
                  <Bell className={`w-5 h-5 ${notif.urgent ? 'text-red-600 animate-bounce' : 'text-amber-600'}`} />
                ) : (
                  <Clock className="w-5 h-5 text-amber-600" />
                )}
              </div>
              <div className="flex-1">
                <h4 className={`font-semibold ${notif.urgent ? 'text-red-900' : 'text-slate-900'}`}>
                  {notif.message}
                </h4>
                {notif.task.client_name && (
                  <p className="text-xs text-slate-600 mt-1">Cliente: {notif.task.client_name}</p>
                )}
                {notif.task.description && (
                  <p className="text-xs text-slate-600 mt-1">{notif.task.description}</p>
                )}
                <div className="flex gap-2 mt-3">
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => handleSnooze(notif.id, 20)}
                    className="text-xs h-7"
                  >
                    <Clock className="w-3 h-3 mr-1" />
                    20 min
                  </Button>
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => handleSnooze(notif.id, 60)}
                    className="text-xs h-7"
                  >
                    <Clock className="w-3 h-3 mr-1" />
                    1 hora
                  </Button>
                  <Button 
                    size="sm" 
                    className="bg-emerald-600 hover:bg-emerald-700 text-xs h-7"
                    onClick={() => handleComplete(notif.id)}
                  >
                    <Check className="w-3 h-3 mr-1" />
                    Concluir
                  </Button>
                </div>
              </div>
              <Button
                size="icon"
                variant="ghost"
                className="h-6 w-6"
                onClick={() => handleDismiss(notif.id)}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}