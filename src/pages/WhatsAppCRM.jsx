import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  MessageCircle, Plus, Edit2, Trash2, Copy, ToggleLeft, ToggleRight,
  BarChart3, Users, Clock, TrendingUp, Send, CheckCircle, Eye,
  Search, Filter
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { format, subDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const CATEGORIES = [
  { value: 'primeiro_contato', label: 'Primeiro Contato' },
  { value: 'follow_up', label: 'Follow-up' },
  { value: 'proposta_enviada', label: 'Proposta Enviada' },
  { value: 'lembrete_reuniao', label: 'Lembrete de Reunião' },
  { value: 'recuperacao_lead', label: 'Recuperação de Lead' },
  { value: 'pos_venda', label: 'Pós-venda' },
  { value: 'renovacao_recompra', label: 'Renovação / Recompra' },
  { value: 'outro', label: 'Outro' }
];

const DEFAULT_TEMPLATES = [
  {
    name: 'Primeiro Contato',
    category: 'primeiro_contato',
    body: 'Olá, {{nome_cliente}}! Tudo bem? 😊\n\nMeu nome é {{nome_vendedor}} da {{empresa}}. Vi que você pode se interessar pelos nossos produtos de aço e gostaria de entender melhor suas necessidades.\n\nPosso te ajudar com alguma coisa? 🏭',
    variables: ['nome_cliente', 'nome_vendedor', 'empresa']
  },
  {
    name: 'Follow-up Proposta',
    category: 'proposta_enviada',
    body: 'Olá, {{nome_cliente}}! 👋\n\nPassando para verificar se você teve a oportunidade de analisar o orçamento que enviei referente a {{produto}}.\n\nTenho disponibilidade para conversar e tirar qualquer dúvida. Quando seria um bom momento?\n\nAtt, {{nome_vendedor}} — {{empresa}}',
    variables: ['nome_cliente', 'produto', 'nome_vendedor', 'empresa']
  },
  {
    name: 'Lembrete de Reunião',
    category: 'lembrete_reuniao',
    body: 'Olá, {{nome_cliente}}! 📅\n\nPassando para confirmar nossa reunião agendada para {{data}}.\n\nQualquer alteração, é só me avisar!\n\nAtt, {{nome_vendedor}}',
    variables: ['nome_cliente', 'data', 'nome_vendedor']
  },
  {
    name: 'Recuperação de Lead',
    category: 'recuperacao_lead',
    body: 'Olá, {{nome_cliente}}! Espero que esteja tudo bem por aí. 🙂\n\nFaz um tempo que não conversamos e queria saber se ainda há interesse nos nossos produtos. Temos novidades e condições especiais que podem te interessar.\n\nPosso te contar mais? {{nome_vendedor}} — {{empresa}}',
    variables: ['nome_cliente', 'nome_vendedor', 'empresa']
  },
  {
    name: 'Pós-venda',
    category: 'pos_venda',
    body: 'Olá, {{nome_cliente}}! 😊\n\nPassando para saber como foi a experiência com o pedido de {{produto}}. Chegou tudo certo? Ficou satisfeito?\n\nEstou à disposição para qualquer necessidade futura!\n\nAtt, {{nome_vendedor}} — {{empresa}}',
    variables: ['nome_cliente', 'produto', 'nome_vendedor', 'empresa']
  },
  {
    name: 'Renovação / Recompra',
    category: 'renovacao_recompra',
    body: 'Olá, {{nome_cliente}}! Tudo bem?\n\nBaseado no histórico de compras, acredito que você pode estar precisando repor o estoque de {{produto}} em breve.\n\nPositivando um pedido hoje, garantimos a disponibilidade e as melhores condições. Posso preparar uma proposta?\n\nAtt, {{nome_vendedor}} — {{empresa}}',
    variables: ['nome_cliente', 'produto', 'nome_vendedor', 'empresa']
  }
];

const EMPTY_TEMPLATE = { name: '', category: 'follow_up', body: '', is_active: true };

function TemplateForm({ template, onSave, onCancel, isLoading }) {
  const [form, setForm] = useState(template || EMPTY_TEMPLATE);

  const extractVars = (text) => {
    const matches = text.match(/\{\{(\w+)\}\}/g) || [];
    return [...new Set(matches.map(m => m.replace(/\{\{|\}\}/g, '')))];
  };

  const handleSave = () => {
    if (!form.name || !form.body) {
      toast.error('Nome e mensagem são obrigatórios');
      return;
    }
    onSave({ ...form, variables: extractVars(form.body) });
  };

  return (
    <div className="space-y-4">
      <div className="grid sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Nome do Template *</Label>
          <Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Ex: Follow-up inicial" />
        </div>
        <div className="space-y-2">
          <Label>Categoria *</Label>
          <Select value={form.category} onValueChange={v => setForm({ ...form, category: v })}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {CATEGORIES.map(c => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="space-y-2">
        <Label>Mensagem *</Label>
        <Textarea
          value={form.body}
          onChange={e => setForm({ ...form, body: e.target.value })}
          rows={6}
          placeholder="Digite a mensagem..."
        />
        <p className="text-xs text-slate-400">
          Variáveis: {'{{nome_cliente}}'} {'{{nome_vendedor}}'} {'{{empresa}}'} {'{{produto}}'} {'{{data}}'}
        </p>
        {extractVars(form.body).length > 0 && (
          <div className="flex flex-wrap gap-1">
            {extractVars(form.body).map(v => <Badge key={v} variant="secondary" className="text-xs">{'{{' + v + '}}'}</Badge>)}
          </div>
        )}
      </div>
      <div className="flex justify-end gap-3">
        <Button variant="outline" onClick={onCancel}>Cancelar</Button>
        <Button onClick={handleSave} disabled={isLoading} className="bg-green-600 hover:bg-green-700 text-white">
          {isLoading ? 'Salvando...' : 'Salvar Template'}
        </Button>
      </div>
    </div>
  );
}

export default function WhatsAppCRM() {
  const queryClient = useQueryClient();
  const [showTemplateForm, setShowTemplateForm] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState(null);
  const [searchMsg, setSearchMsg] = useState('');
  const [seedingDefaults, setSeedingDefaults] = useState(false);

  const { data: templates = [], isLoading: loadingTemplates } = useQuery({
    queryKey: ['whatsapp-templates'],
    queryFn: () => base44.entities.WhatsAppTemplate.list('-created_date', 100)
  });

  const { data: messages = [], isLoading: loadingMessages } = useQuery({
    queryKey: ['whatsapp-messages'],
    queryFn: () => base44.entities.WhatsAppMessage.list('-sent_at', 200)
  });

  const createTemplate = useMutation({
    mutationFn: (data) => base44.entities.WhatsAppTemplate.create(data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['whatsapp-templates'] }); setShowTemplateForm(false); toast.success('Template criado!'); }
  });

  const updateTemplate = useMutation({
    mutationFn: ({ id, data }) => base44.entities.WhatsAppTemplate.update(id, data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['whatsapp-templates'] }); setShowTemplateForm(false); setEditingTemplate(null); toast.success('Template atualizado!'); }
  });

  const deleteTemplate = useMutation({
    mutationFn: (id) => base44.entities.WhatsAppTemplate.delete(id),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['whatsapp-templates'] }); toast.success('Template excluído'); }
  });

  const toggleTemplate = (tpl) => {
    updateTemplate.mutate({ id: tpl.id, data: { is_active: !tpl.is_active } });
  };

  const duplicateTemplate = (tpl) => {
    createTemplate.mutate({ ...tpl, id: undefined, name: tpl.name + ' (cópia)', created_date: undefined });
  };

  const seedDefaultTemplates = async () => {
    setSeedingDefaults(true);
    for (const tpl of DEFAULT_TEMPLATES) {
      await base44.entities.WhatsAppTemplate.create({ ...tpl, is_active: true });
    }
    queryClient.invalidateQueries({ queryKey: ['whatsapp-templates'] });
    setSeedingDefaults(false);
    toast.success('Templates padrão criados!');
  };

  const handleSaveTemplate = (data) => {
    if (editingTemplate) {
      updateTemplate.mutate({ id: editingTemplate.id, data });
    } else {
      createTemplate.mutate(data);
    }
  };

  // Métricas
  const today = new Date();
  const last30 = subDays(today, 30);
  const recentMessages = messages.filter(m => new Date(m.sent_at || m.created_date) >= last30);
  const uniqueClients = new Set(recentMessages.map(m => m.client_id)).size;
  const pendingFollowups = messages.filter(m => m.followup_task_created && m.followup_date && new Date(m.followup_date) >= today).length;
  const bySender = recentMessages.reduce((acc, m) => { acc[m.sender_name || 'Desconhecido'] = (acc[m.sender_name || 'Desconhecido'] || 0) + 1; return acc; }, {});

  const filteredMessages = messages.filter(m =>
    !searchMsg ||
    (m.client_name || '').toLowerCase().includes(searchMsg.toLowerCase()) ||
    (m.message_content || '').toLowerCase().includes(searchMsg.toLowerCase())
  );

  return (
    <div className="pb-20 lg:pb-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <MessageCircle className="w-7 h-7 text-green-600" />
            WhatsApp CRM
          </h1>
          <p className="text-slate-500 text-sm mt-1">Gerencie mensagens, templates e histórico de conversas</p>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center">
                <Send className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{recentMessages.length}</p>
                <p className="text-xs text-slate-500">Mensagens (30d)</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
                <Users className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{uniqueClients}</p>
                <p className="text-xs text-slate-500">Clientes contatados</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center">
                <Clock className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{pendingFollowups}</p>
                <p className="text-xs text-slate-500">Follow-ups agendados</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center">
                <BarChart3 className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{templates.filter(t => t.is_active).length}</p>
                <p className="text-xs text-slate-500">Templates ativos</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="templates">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="templates">Templates</TabsTrigger>
          <TabsTrigger value="historico">Histórico</TabsTrigger>
          <TabsTrigger value="metricas">Métricas</TabsTrigger>
        </TabsList>

        {/* Templates Tab */}
        <TabsContent value="templates" className="space-y-4 mt-4">
          <div className="flex justify-between items-center">
            <p className="text-sm text-slate-500">{templates.length} templates cadastrados</p>
            <div className="flex gap-2">
              {templates.length === 0 && (
                <Button variant="outline" size="sm" onClick={seedDefaultTemplates} disabled={seedingDefaults}>
                  {seedingDefaults ? 'Criando...' : '✨ Criar templates padrão'}
                </Button>
              )}
              <Button
                size="sm"
                className="bg-green-600 hover:bg-green-700 text-white"
                onClick={() => { setEditingTemplate(null); setShowTemplateForm(true); }}
              >
                <Plus className="w-4 h-4 mr-1" />
                Novo Template
              </Button>
            </div>
          </div>

          {loadingTemplates ? (
            <div className="grid sm:grid-cols-2 gap-4">
              {[1,2,3,4].map(i => <div key={i} className="h-32 bg-slate-100 rounded-xl animate-pulse" />)}
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 gap-4">
              {templates.map(tpl => (
                <div key={tpl.id} className={`bg-white border rounded-xl p-4 ${!tpl.is_active ? 'opacity-60' : ''}`}>
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h3 className="font-semibold text-sm">{tpl.name}</h3>
                      <Badge variant="outline" className="text-xs mt-1">
                        {CATEGORIES.find(c => c.value === tpl.category)?.label || tpl.category}
                      </Badge>
                    </div>
                    <div className="flex gap-1">
                      <button onClick={() => toggleTemplate(tpl)} className="p-1 hover:bg-slate-100 rounded" title={tpl.is_active ? 'Desativar' : 'Ativar'}>
                        {tpl.is_active ? <ToggleRight className="w-5 h-5 text-green-600" /> : <ToggleLeft className="w-5 h-5 text-slate-400" />}
                      </button>
                      <button onClick={() => duplicateTemplate(tpl)} className="p-1 hover:bg-slate-100 rounded" title="Duplicar">
                        <Copy className="w-4 h-4 text-slate-500" />
                      </button>
                      <button onClick={() => { setEditingTemplate(tpl); setShowTemplateForm(true); }} className="p-1 hover:bg-slate-100 rounded" title="Editar">
                        <Edit2 className="w-4 h-4 text-slate-500" />
                      </button>
                      <button onClick={() => deleteTemplate.mutate(tpl.id)} className="p-1 hover:bg-red-50 rounded" title="Excluir">
                        <Trash2 className="w-4 h-4 text-red-400" />
                      </button>
                    </div>
                  </div>
                  <p className="text-xs text-slate-500 line-clamp-3 leading-relaxed">{tpl.body}</p>
                  {tpl.usage_count > 0 && (
                    <p className="text-xs text-slate-400 mt-2">Usado {tpl.usage_count}x</p>
                  )}
                </div>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Histórico Tab */}
        <TabsContent value="historico" className="space-y-4 mt-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
              placeholder="Buscar por cliente ou mensagem..."
              value={searchMsg}
              onChange={e => setSearchMsg(e.target.value)}
              className="pl-10"
            />
          </div>

          {loadingMessages ? (
            <div className="space-y-3">{[1,2,3].map(i => <div key={i} className="h-20 bg-slate-100 rounded-xl animate-pulse" />)}</div>
          ) : filteredMessages.length === 0 ? (
            <div className="text-center py-12">
              <MessageCircle className="w-12 h-12 text-slate-200 mx-auto mb-3" />
              <p className="text-slate-400">Nenhuma mensagem registrada ainda</p>
              <p className="text-slate-300 text-sm">Abra um cliente e clique em "Enviar WhatsApp"</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredMessages.map(msg => (
                <div key={msg.id} className="bg-white border border-slate-100 rounded-xl p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <p className="font-semibold text-sm">{msg.client_name}</p>
                      <p className="text-xs text-slate-400">{msg.client_phone}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-slate-400">
                        {msg.sent_at ? format(new Date(msg.sent_at), "dd/MM/yy HH:mm", { locale: ptBR }) : '-'}
                      </p>
                      <p className="text-xs text-slate-400">{msg.sender_name}</p>
                    </div>
                  </div>
                  <p className="text-sm text-slate-700 line-clamp-2">{msg.message_content}</p>
                  <div className="flex items-center gap-2 mt-2">
                    {msg.template_name && <Badge variant="outline" className="text-xs">{msg.template_name}</Badge>}
                    {msg.followup_task_created && <Badge className="bg-amber-100 text-amber-700 text-xs">Follow-up agendado</Badge>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Métricas Tab */}
        <TabsContent value="metricas" className="space-y-4 mt-4">
          <div className="grid sm:grid-cols-2 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Mensagens por Vendedor (30 dias)</CardTitle>
              </CardHeader>
              <CardContent>
                {Object.keys(bySender).length === 0 ? (
                  <p className="text-slate-400 text-sm">Sem dados</p>
                ) : (
                  <div className="space-y-2">
                    {Object.entries(bySender).sort((a, b) => b[1] - a[1]).map(([name, count]) => (
                      <div key={name} className="flex items-center gap-3">
                        <div className="flex-1 text-sm font-medium truncate">{name}</div>
                        <div className="flex items-center gap-2">
                          <div className="h-2 bg-green-500 rounded-full" style={{ width: `${(count / Math.max(...Object.values(bySender))) * 80}px` }} />
                          <span className="text-sm font-bold w-6 text-right">{count}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Templates Mais Usados</CardTitle>
              </CardHeader>
              <CardContent>
                {templates.filter(t => t.usage_count > 0).length === 0 ? (
                  <p className="text-slate-400 text-sm">Sem dados ainda</p>
                ) : (
                  <div className="space-y-2">
                    {templates.sort((a, b) => (b.usage_count || 0) - (a.usage_count || 0)).slice(0, 5).map(t => (
                      <div key={t.id} className="flex items-center justify-between text-sm">
                        <span className="truncate flex-1">{t.name}</span>
                        <span className="font-bold text-green-600 ml-2">{t.usage_count || 0}x</span>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Resumo Geral</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
                <div className="p-3 bg-slate-50 rounded-lg">
                  <p className="text-xl font-bold text-green-600">{messages.length}</p>
                  <p className="text-xs text-slate-500">Total de mensagens</p>
                </div>
                <div className="p-3 bg-slate-50 rounded-lg">
                  <p className="text-xl font-bold text-blue-600">{new Set(messages.map(m => m.client_id)).size}</p>
                  <p className="text-xs text-slate-500">Clientes únicos</p>
                </div>
                <div className="p-3 bg-slate-50 rounded-lg">
                  <p className="text-xl font-bold text-amber-600">{messages.filter(m => m.followup_task_created).length}</p>
                  <p className="text-xs text-slate-500">Follow-ups criados</p>
                </div>
                <div className="p-3 bg-slate-50 rounded-lg">
                  <p className="text-xl font-bold text-purple-600">{messages.filter(m => m.message_type === 'template').length}</p>
                  <p className="text-xs text-slate-500">Via template</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Template Form Dialog */}
      <Dialog open={showTemplateForm} onOpenChange={setShowTemplateForm}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingTemplate ? 'Editar Template' : 'Novo Template'}</DialogTitle>
          </DialogHeader>
          <TemplateForm
            template={editingTemplate}
            onSave={handleSaveTemplate}
            onCancel={() => { setShowTemplateForm(false); setEditingTemplate(null); }}
            isLoading={createTemplate.isPending || updateTemplate.isPending}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}