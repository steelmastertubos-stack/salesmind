import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import PageHeader from '@/components/common/PageHeader';
import TaskForm from '@/components/tasks/TaskForm';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Plus, 
  Phone, 
  Mail, 
  MapPin, 
  Calendar, 
  Clock, 
  Check, 
  X,
  AlertCircle,
  Trash2
} from 'lucide-react';
import { toast } from 'sonner';

export default function TasksPage() {
  const [showForm, setShowForm] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const queryClient = useQueryClient();

  const { data: tasks = [], isLoading } = useQuery({
    queryKey: ['tasks'],
    queryFn: () => base44.entities.Task.list('-scheduled_date', 200)
  });

  const { data: clients = [] } = useQuery({
    queryKey: ['clients'],
    queryFn: () => base44.entities.Client.list('company_name', 200)
  });

  const createTaskMutation = useMutation({
    mutationFn: (data) => base44.entities.Task.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['tasks']);
      setShowForm(false);
      setEditingTask(null);
      toast.success('Tarefa criada com sucesso!');
    }
  });

  const updateTaskMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Task.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['tasks']);
      setShowForm(false);
      setEditingTask(null);
      toast.success('Tarefa atualizada!');
    }
  });

  const deleteTaskMutation = useMutation({
    mutationFn: (id) => base44.entities.Task.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['tasks']);
      toast.success('Tarefa excluída!');
    }
  });

  const handleSave = (data) => {
    if (editingTask) {
      updateTaskMutation.mutate({ id: editingTask.id, data });
    } else {
      createTaskMutation.mutate(data);
    }
  };

  const handleComplete = (task) => {
    updateTaskMutation.mutate({
      id: task.id,
      data: { status: 'completed', completed_at: new Date().toISOString() }
    });
  };

  const handleDelete = (id) => {
    if (confirm('Deseja excluir esta tarefa?')) {
      deleteTaskMutation.mutate(id);
    }
  };

  const getTypeIcon = (type) => {
    switch (type) {
      case 'call': return <Phone className="w-4 h-4" />;
      case 'email': return <Mail className="w-4 h-4" />;
      case 'visit': return <MapPin className="w-4 h-4" />;
      case 'meeting': return <Calendar className="w-4 h-4" />;
      default: return <Clock className="w-4 h-4" />;
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800';
      case 'medium': return 'bg-amber-100 text-amber-800';
      case 'low': return 'bg-blue-100 text-blue-800';
      default: return 'bg-slate-100 text-slate-800';
    }
  };

  const pendingTasks = tasks.filter(t => t.status === 'pending');
  const completedTasks = tasks.filter(t => t.status === 'completed');
  const snoozedTasks = tasks.filter(t => t.status === 'snoozed');

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });
  };

  const isToday = (date) => {
    const today = new Date();
    const taskDate = new Date(date);
    return today.toDateString() === taskDate.toDateString();
  };

  const isPast = (date, time) => {
    const now = new Date();
    const taskDateTime = new Date(`${date}T${time}`);
    return taskDateTime < now;
  };

  return (
    <div className="pb-20 lg:pb-6 space-y-6">
      <PageHeader
        title="📅 Minhas Tarefas"
        subtitle="Gerencie seus compromissos e lembretes"
        actionLabel="Nova Tarefa"
        onAction={() => {
          setEditingTask(null);
          setShowForm(true);
        }}
      />

      <Tabs defaultValue="pending" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="pending">
            Pendentes ({pendingTasks.length})
          </TabsTrigger>
          <TabsTrigger value="completed">
            Concluídas ({completedTasks.length})
          </TabsTrigger>
          <TabsTrigger value="snoozed">
            Adiadas ({snoozedTasks.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="pending" className="space-y-3">
          {pendingTasks.length > 0 ? (
            pendingTasks.map(task => {
              const isTaskPast = isPast(task.scheduled_date, task.scheduled_time);
              const isTaskToday = isToday(task.scheduled_date);
              
              return (
                <Card key={task.id} className={`${isTaskPast ? 'border-red-300 bg-red-50' : isTaskToday ? 'border-amber-300 bg-amber-50' : ''}`}>
                  <CardContent className="pt-4">
                    <div className="flex items-start gap-3">
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                        task.priority === 'high' ? 'bg-red-100' : 
                        task.priority === 'medium' ? 'bg-amber-100' : 
                        'bg-blue-100'
                      }`}>
                        {getTypeIcon(task.task_type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <h4 className="font-semibold text-slate-900">{task.title}</h4>
                          <Badge className={getPriorityColor(task.priority)}>
                            {task.priority === 'high' ? 'Alta' : task.priority === 'medium' ? 'Média' : 'Baixa'}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-slate-600 mb-2">
                          <div className="flex items-center gap-1">
                            <Calendar className="w-4 h-4" />
                            {formatDate(task.scheduled_date)}
                          </div>
                          <div className="flex items-center gap-1">
                            <Clock className="w-4 h-4" />
                            {task.scheduled_time}
                          </div>
                        </div>
                        {task.client_name && (
                          <p className="text-sm text-slate-600">Cliente: {task.client_name}</p>
                        )}
                        {task.description && (
                          <p className="text-sm text-slate-600 mt-1">{task.description}</p>
                        )}
                        {isTaskPast && (
                          <div className="flex items-center gap-1 text-red-600 text-sm mt-2">
                            <AlertCircle className="w-4 h-4" />
                            Tarefa atrasada
                          </div>
                        )}
                        <div className="flex gap-2 mt-3">
                          <Button 
                            size="sm" 
                            className="bg-emerald-600 hover:bg-emerald-700"
                            onClick={() => handleComplete(task)}
                          >
                            <Check className="w-4 h-4 mr-1" />
                            Concluir
                          </Button>
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => {
                              setEditingTask(task);
                              setShowForm(true);
                            }}
                          >
                            Editar
                          </Button>
                          <Button 
                            size="sm" 
                            variant="ghost"
                            onClick={() => handleDelete(task.id)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })
          ) : (
            <Card>
              <CardContent className="pt-8 pb-8 text-center">
                <Clock className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                <p className="text-slate-500">Nenhuma tarefa pendente</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="completed" className="space-y-3">
          {completedTasks.map(task => (
            <Card key={task.id} className="opacity-60">
              <CardContent className="pt-4">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-emerald-100">
                    <Check className="w-5 h-5 text-emerald-600" />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold text-slate-900 line-through">{task.title}</h4>
                    <p className="text-sm text-slate-600">
                      Concluída em {new Date(task.completed_at).toLocaleString('pt-BR')}
                    </p>
                  </div>
                  <Button 
                    size="sm" 
                    variant="ghost"
                    onClick={() => handleDelete(task.id)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="snoozed" className="space-y-3">
          {snoozedTasks.map(task => (
            <Card key={task.id} className="border-amber-300">
              <CardContent className="pt-4">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-amber-100">
                    <Clock className="w-5 h-5 text-amber-600" />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold text-slate-900">{task.title}</h4>
                    <p className="text-sm text-slate-600">
                      Lembrar em {new Date(task.snoozed_until).toLocaleString('pt-BR')}
                    </p>
                    <Button 
                      size="sm" 
                      className="mt-2"
                      onClick={() => updateTaskMutation.mutate({
                        id: task.id,
                        data: { status: 'pending', snoozed_until: null }
                      })}
                    >
                      Reativar Agora
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>
      </Tabs>

      <Dialog open={showForm} onOpenChange={(open) => {
        if (!open) {
          setShowForm(false);
          setEditingTask(null);
        }
      }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingTask ? 'Editar Tarefa' : 'Nova Tarefa'}
            </DialogTitle>
          </DialogHeader>
          <TaskForm
            task={editingTask}
            clients={clients}
            onSave={handleSave}
            onCancel={() => {
              setShowForm(false);
              setEditingTask(null);
            }}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}