import React from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Calendar, Phone, Mail, MapPin, Clock, CheckCircle2 } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

const typeIcon = { call: Phone, email: Mail, visit: MapPin, meeting: Calendar, follow_up: Clock };
const typeColor = {
  call: 'bg-blue-100 text-blue-600', email: 'bg-purple-100 text-purple-600',
  visit: 'bg-amber-100 text-amber-700', meeting: 'bg-emerald-100 text-emerald-600',
  follow_up: 'bg-slate-100 text-slate-500',
};

export default function TodayAgendaPanel({ tasks = [] }) {
  const queryClient = useQueryClient();
  const today = new Date().toISOString().split('T')[0];

  const todayTasks = tasks.filter(t => t.status === 'pending' && t.scheduled_date === today).sort((a, b) => (a.scheduled_time || '').localeCompare(b.scheduled_time || ''));
  const overdueTasks = tasks.filter(t => t.status === 'pending' && t.scheduled_date < today).slice(0, 3);

  const complete = async (task) => {
    await base44.entities.Task.update(task.id, { status: 'completed', completed_at: new Date().toISOString() });
    queryClient.invalidateQueries(['tasks']);
    toast.success('Tarefa concluída!');
  };

  const renderTask = (task, overdue = false) => {
    const Icon = typeIcon[task.task_type] || Clock;
    const colorClass = typeColor[task.task_type] || typeColor.follow_up;
    return (
      <div key={task.id} className={`flex items-start gap-3 p-3 rounded-xl border transition-colors ${overdue ? 'border-red-200 bg-red-50/40' : 'border-slate-100 hover:bg-slate-50'}`}>
        <div className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 ${colorClass}`}>
          <Icon className="w-3.5 h-3.5" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-slate-800 truncate">{task.title}</p>
          {task.client_name && <p className="text-[10px] text-slate-400 mt-0.5">{task.client_name}</p>}
          <p className="text-[10px] text-slate-400 mt-0.5">{task.scheduled_time || ''}</p>
        </div>
        <button onClick={() => complete(task)} className="p-1 rounded-lg hover:bg-emerald-100 text-slate-300 hover:text-emerald-600 transition-colors flex-shrink-0">
          <CheckCircle2 className="w-4 h-4" />
        </button>
      </div>
    );
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-blue-500" />
          <h3 className="font-semibold text-slate-800 text-sm">Agenda de Hoje</h3>
        </div>
        <Link to={createPageUrl('Tasks')} className="text-xs text-blue-600 hover:underline font-medium">Ver agenda →</Link>
      </div>
      {overdueTasks.length > 0 && (
        <div className="mb-3">
          <p className="text-[10px] text-red-500 font-bold uppercase tracking-wide mb-1">Atrasadas</p>
          <div className="space-y-1.5">{overdueTasks.map(t => renderTask(t, true))}</div>
        </div>
      )}
      {todayTasks.length > 0 ? (
        <div className="space-y-1.5">{todayTasks.map(t => renderTask(t))}</div>
      ) : (
        <div className="text-center py-6 text-slate-400">
          <Calendar className="w-8 h-8 mx-auto mb-2 text-slate-200" />
          <p className="text-xs">Sem tarefas para hoje</p>
          <Link to={createPageUrl('Tasks')} className="text-xs text-blue-500 hover:underline mt-1 block">+ Criar tarefa</Link>
        </div>
      )}
    </div>
  );
}