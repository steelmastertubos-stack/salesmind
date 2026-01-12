import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Phone, Mail, MapPin, Calendar, Clock, User, X, Save } from 'lucide-react';

export default function TaskForm({ task, clients, onSave, onCancel }) {
  const [formData, setFormData] = useState({
    title: task?.title || '',
    description: task?.description || '',
    task_type: task?.task_type || 'call',
    client_id: task?.client_id || '',
    client_name: task?.client_name || '',
    scheduled_date: task?.scheduled_date || '',
    scheduled_time: task?.scheduled_time || '',
    priority: task?.priority || 'medium',
    notes: task?.notes || ''
  });

  const handleClientChange = (clientId) => {
    const client = clients.find(c => c.id === clientId);
    setFormData(prev => ({
      ...prev,
      client_id: clientId,
      client_name: client?.trade_name || client?.company_name || ''
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
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

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="title">Título da Tarefa *</Label>
        <Input
          id="title"
          value={formData.title}
          onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
          placeholder="Ex: Ligar para BNG"
          required
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="task_type">Tipo</Label>
          <Select value={formData.task_type} onValueChange={(v) => setFormData(prev => ({ ...prev, task_type: v }))}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="call">
                <div className="flex items-center gap-2">
                  <Phone className="w-4 h-4" />
                  Ligação
                </div>
              </SelectItem>
              <SelectItem value="email">
                <div className="flex items-center gap-2">
                  <Mail className="w-4 h-4" />
                  Email
                </div>
              </SelectItem>
              <SelectItem value="visit">
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4" />
                  Visita
                </div>
              </SelectItem>
              <SelectItem value="meeting">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  Reunião
                </div>
              </SelectItem>
              <SelectItem value="follow_up">Follow-up</SelectItem>
              <SelectItem value="other">Outro</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="priority">Prioridade</Label>
          <Select value={formData.priority} onValueChange={(v) => setFormData(prev => ({ ...prev, priority: v }))}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="low">Baixa</SelectItem>
              <SelectItem value="medium">Média</SelectItem>
              <SelectItem value="high">Alta</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="client_id">Cliente (opcional)</Label>
        <Select value={formData.client_id} onValueChange={handleClientChange}>
          <SelectTrigger>
            <SelectValue placeholder="Selecione um cliente" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={null}>Sem cliente</SelectItem>
            {clients.map(client => (
              <SelectItem key={client.id} value={client.id}>
                {client.trade_name || client.company_name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="scheduled_date">Data *</Label>
          <Input
            id="scheduled_date"
            type="date"
            value={formData.scheduled_date}
            onChange={(e) => setFormData(prev => ({ ...prev, scheduled_date: e.target.value }))}
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="scheduled_time">Horário *</Label>
          <Input
            id="scheduled_time"
            type="time"
            value={formData.scheduled_time}
            onChange={(e) => setFormData(prev => ({ ...prev, scheduled_time: e.target.value }))}
            required
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Descrição</Label>
        <Textarea
          id="description"
          value={formData.description}
          onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
          placeholder="Detalhes da tarefa..."
          rows={2}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="notes">Notas</Label>
        <Textarea
          id="notes"
          value={formData.notes}
          onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
          placeholder="Observações adicionais..."
          rows={2}
        />
      </div>

      <div className="flex justify-end gap-3 pt-4 border-t">
        <Button type="button" variant="outline" onClick={onCancel}>
          <X className="w-4 h-4 mr-2" />
          Cancelar
        </Button>
        <Button type="submit" className="bg-[#1DB954] hover:bg-[#15803d]">
          <Save className="w-4 h-4 mr-2" />
          Salvar Tarefa
        </Button>
      </div>
    </form>
  );
}