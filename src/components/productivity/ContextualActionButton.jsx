import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useContextualAction } from './useContextualAction';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription
} from '@/components/ui/dialog';
import { Loader2 } from 'lucide-react';

// Modais rápidos de criação
function QuickCreateOpportunity({ clientId, onClose }) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    client_id: clientId || '',
    value_estimated: '',
    next_action_type: 'call'
  });

  const handleCreate = async () => {
    if (!formData.client_id) {
      alert('Selecione um cliente');
      return;
    }
    setLoading(true);
    try {
      const opp = await base44.entities.Opportunity.create({
        ...formData,
        value_estimated: parseFloat(formData.value_estimated) || 0,
        stage: 'proposta_enviada'
      });
      onClose();
    } catch (e) {
      alert(`Erro: ${e.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <input
        type="text"
        placeholder="Valor estimado (R$)"
        className="w-full px-3 py-2 border rounded-lg"
        value={formData.value_estimated}
        onChange={(e) => setFormData({ ...formData, value_estimated: e.target.value })}
      />
      <select
        className="w-full px-3 py-2 border rounded-lg"
        value={formData.next_action_type}
        onChange={(e) => setFormData({ ...formData, next_action_type: e.target.value })}
      >
        <option value="call">Ligar</option>
        <option value="email">E-mail</option>
        <option value="visit">Visita</option>
        <option value="whatsapp">WhatsApp</option>
      </select>
      <Button
        onClick={handleCreate}
        disabled={loading}
        className="w-full bg-blue-600 hover:bg-blue-700"
      >
        {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
        Criar Oportunidade
      </Button>
    </div>
  );
}

function QuickCreateTask({ opportunityId, onClose }) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    scheduled_date: new Date().toISOString().split('T')[0],
    scheduled_time: '09:00',
    task_type: 'call'
  });

  const handleCreate = async () => {
    if (!formData.title) {
      alert('Informe o título da tarefa');
      return;
    }
    setLoading(true);
    try {
      await base44.entities.Task.create({
        ...formData,
        opportunity_id: opportunityId,
        status: 'pending',
        priority: 'medium'
      });
      onClose();
    } catch (e) {
      alert(`Erro: ${e.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <input
        type="text"
        placeholder="Título da tarefa"
        className="w-full px-3 py-2 border rounded-lg"
        value={formData.title}
        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
      />
      <input
        type="date"
        className="w-full px-3 py-2 border rounded-lg"
        value={formData.scheduled_date}
        onChange={(e) => setFormData({ ...formData, scheduled_date: e.target.value })}
      />
      <input
        type="time"
        className="w-full px-3 py-2 border rounded-lg"
        value={formData.scheduled_time}
        onChange={(e) => setFormData({ ...formData, scheduled_time: e.target.value })}
      />
      <select
        className="w-full px-3 py-2 border rounded-lg"
        value={formData.task_type}
        onChange={(e) => setFormData({ ...formData, task_type: e.target.value })}
      >
        <option value="call">Ligar</option>
        <option value="email">E-mail</option>
        <option value="visit">Visita</option>
        <option value="meeting">Reunião</option>
        <option value="follow_up">Follow-up</option>
      </select>
      <Button
        onClick={handleCreate}
        disabled={loading}
        className="w-full bg-blue-600 hover:bg-blue-700"
      >
        {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
        Criar Tarefa
      </Button>
    </div>
  );
}

export default function ContextualActionButton() {
  const [open, setOpen] = useState(false);
  const { action, context } = useContextualAction();

  const getModalContent = () => {
    switch (action.action) {
      case 'create-opportunity':
        return (
          <>
            <DialogTitle>Nova Oportunidade</DialogTitle>
            <DialogDescription>Criação rápida de oportunidade</DialogDescription>
            <QuickCreateOpportunity clientId={action.params.clientId} onClose={() => setOpen(false)} />
          </>
        );
      case 'create-task':
        return (
          <>
            <DialogTitle>Nova Tarefa</DialogTitle>
            <DialogDescription>Crie uma tarefa para acompanhamento</DialogDescription>
            <QuickCreateTask opportunityId={action.params.opportunityId} onClose={() => setOpen(false)} />
          </>
        );
      default:
        return (
          <>
            <DialogTitle>Ação</DialogTitle>
            <DialogDescription>Recurso em desenvolvimento</DialogDescription>
          </>
        );
    }
  };

  return (
    <>
      <Button
        onClick={() => setOpen(true)}
        className="bg-green-600 hover:bg-green-700 text-white font-semibold shadow-lg"
        size="lg"
      >
        <span className="mr-2">{action.icon}</span>
        {action.label}
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            {getModalContent()}
          </DialogHeader>
        </DialogContent>
      </Dialog>
    </>
  );
}