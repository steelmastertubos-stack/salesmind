import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Building2, 
  MapPin, 
  Phone, 
  Mail, 
  User,
  Brain,
  Save,
  X,
  Heart
} from 'lucide-react';
import CNPJLookup from '@/components/clients/CNPJLookup';

const SEGMENTS = [
  'Indústria',
  'Comércio',
  'Serviços',
  'Construção Civil',
  'Agronegócio',
  'Metalurgia',
  'Química',
  'Alimentício',
  'Têxtil',
  'Outro'
];

const STATES = [
  'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA', 
  'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN', 
  'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO'
];

export default function ClientForm({ client, onSave, onCancel, isLoading }) {
  const [formData, setFormData] = useState({
    company_name: client?.company_name || '',
    trade_name: client?.trade_name || '',
    cnpj: client?.cnpj || '',
    state_registration: client?.state_registration || '',
    segment: client?.segment || '',
    cnae: client?.cnae || '',
    address: client?.address || '',
    city: client?.city || '',
    state: client?.state || '',
    zip_code: client?.zip_code || '',
    phone: client?.phone || '',
    whatsapp: client?.whatsapp || '',
    email: client?.email || '',
    contact_name: client?.contact_name || '',
    contact_role: client?.contact_role || '',
    contact_birthday: client?.contact_birthday || '',
    contact_football_team: client?.contact_football_team || '',
    contact_favorite_drink: client?.contact_favorite_drink || '',
    contact_interests: client?.contact_interests || '',
    important_dates: client?.important_dates || '',
    personal_notes: client?.personal_notes || '',
    purchase_preferences: client?.purchase_preferences || '',
    price_restrictions: client?.price_restrictions || '',
    payment_restrictions: client?.payment_restrictions || '',
    product_restrictions: client?.product_restrictions || '',
    strategic_notes: client?.strategic_notes || '',
    previous_complaints: client?.previous_complaints || '',
    recurring_objections: client?.recurring_objections || '',
    special_conditions: client?.special_conditions || '',
    last_contact_date: client?.last_contact_date || '',
    next_contact_date: client?.next_contact_date || '',
    status: client?.status || 'active',
    is_active: client?.is_active !== false
  });

  const handleCNPJData = (data) => {
    setFormData(prev => ({
      ...prev,
      ...data
    }));
  };

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Tabs defaultValue="basic" className="w-full">
        <TabsList className="grid w-full grid-cols-4 mb-6">
          <TabsTrigger value="basic" className="text-xs sm:text-sm">
            <Building2 className="w-4 h-4 mr-1 sm:mr-2" />
            <span className="hidden sm:inline">Dados</span>
          </TabsTrigger>
          <TabsTrigger value="contact" className="text-xs sm:text-sm">
            <Phone className="w-4 h-4 mr-1 sm:mr-2" />
            Contato
          </TabsTrigger>
          <TabsTrigger value="relationship" className="text-xs sm:text-sm">
            <Heart className="w-4 h-4 mr-1 sm:mr-2" />
            Relação
          </TabsTrigger>
          <TabsTrigger value="memory" className="text-xs sm:text-sm">
            <Brain className="w-4 h-4 mr-1 sm:mr-2" />
            Memória
          </TabsTrigger>
        </TabsList>

        <TabsContent value="basic" className="space-y-4">
          {!client && <CNPJLookup onDataFetched={handleCNPJData} />}
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="company_name">Razão Social *</Label>
              <Input
                id="company_name"
                value={formData.company_name}
                onChange={(e) => handleChange('company_name', e.target.value)}
                placeholder="Razão social da empresa"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="trade_name">Nome Fantasia</Label>
              <Input
                id="trade_name"
                value={formData.trade_name}
                onChange={(e) => handleChange('trade_name', e.target.value)}
                placeholder="Nome fantasia"
              />
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="cnpj">CNPJ *</Label>
              <Input
                id="cnpj"
                value={formData.cnpj}
                onChange={(e) => handleChange('cnpj', e.target.value)}
                placeholder="00.000.000/0000-00"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="state_registration">Inscrição Estadual</Label>
              <Input
                id="state_registration"
                value={formData.state_registration}
                onChange={(e) => handleChange('state_registration', e.target.value)}
                placeholder="Inscrição estadual"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="segment">Segmento</Label>
            <Select value={formData.segment} onValueChange={(v) => handleChange('segment', v)}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione o segmento" />
              </SelectTrigger>
              <SelectContent>
                {SEGMENTS.map(seg => (
                  <SelectItem key={seg} value={seg}>{seg}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="address">Endereço</Label>
            <Input
              id="address"
              value={formData.address}
              onChange={(e) => handleChange('address', e.target.value)}
              placeholder="Rua, número, complemento"
            />
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            <div className="space-y-2 col-span-2 sm:col-span-1">
              <Label htmlFor="city">Cidade</Label>
              <Input
                id="city"
                value={formData.city}
                onChange={(e) => handleChange('city', e.target.value)}
                placeholder="Cidade"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="state">Estado</Label>
              <Select value={formData.state} onValueChange={(v) => handleChange('state', v)}>
                <SelectTrigger>
                  <SelectValue placeholder="UF" />
                </SelectTrigger>
                <SelectContent>
                  {STATES.map(st => (
                    <SelectItem key={st} value={st}>{st}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="zip_code">CEP</Label>
              <Input
                id="zip_code"
                value={formData.zip_code}
                onChange={(e) => handleChange('zip_code', e.target.value)}
                placeholder="00000-000"
              />
            </div>
          </div>
        </TabsContent>

        <TabsContent value="contact" className="space-y-4">
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="contact_name">Nome do Contato</Label>
              <Input
                id="contact_name"
                value={formData.contact_name}
                onChange={(e) => handleChange('contact_name', e.target.value)}
                placeholder="Nome do contato principal"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="contact_role">Cargo</Label>
              <Input
                id="contact_role"
                value={formData.contact_role}
                onChange={(e) => handleChange('contact_role', e.target.value)}
                placeholder="Cargo do contato"
              />
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="phone">Telefone</Label>
              <Input
                id="phone"
                value={formData.phone}
                onChange={(e) => handleChange('phone', e.target.value)}
                placeholder="(00) 0000-0000"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="whatsapp">WhatsApp</Label>
              <Input
                id="whatsapp"
                value={formData.whatsapp}
                onChange={(e) => handleChange('whatsapp', e.target.value)}
                placeholder="(00) 00000-0000"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">E-mail</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => handleChange('email', e.target.value)}
              placeholder="email@empresa.com.br"
            />
          </div>

          <div className="grid sm:grid-cols-2 gap-4 pt-4 border-t">
            <div className="space-y-2">
              <Label htmlFor="last_contact_date">Último Contato</Label>
              <Input
                id="last_contact_date"
                type="date"
                value={formData.last_contact_date}
                onChange={(e) => handleChange('last_contact_date', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="next_contact_date">Próximo Contato</Label>
              <Input
                id="next_contact_date"
                type="date"
                value={formData.next_contact_date}
                onChange={(e) => handleChange('next_contact_date', e.target.value)}
              />
            </div>
          </div>
        </TabsContent>

        <TabsContent value="relationship" className="space-y-4">
          <div className="bg-pink-50 border border-pink-200 rounded-xl p-4 mb-4">
            <p className="text-sm text-pink-800">
              <Heart className="w-4 h-4 inline mr-1" />
              <strong>Relacionamento:</strong> Informações pessoais que ajudam a criar conexão com o cliente.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="contact_birthday">Aniversário do Contato</Label>
              <Input
                id="contact_birthday"
                type="date"
                value={formData.contact_birthday}
                onChange={(e) => handleChange('contact_birthday', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="contact_football_team">Time de Futebol</Label>
              <Input
                id="contact_football_team"
                value={formData.contact_football_team}
                onChange={(e) => handleChange('contact_football_team', e.target.value)}
                placeholder="Ex: Flamengo, São Paulo..."
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="contact_favorite_drink">Bebida Preferida</Label>
            <Input
              id="contact_favorite_drink"
              value={formData.contact_favorite_drink}
              onChange={(e) => handleChange('contact_favorite_drink', e.target.value)}
              placeholder="Ex: Café expresso, Whisky..."
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="contact_interests">Interesses e Hobbies</Label>
            <Textarea
              id="contact_interests"
              value={formData.contact_interests}
              onChange={(e) => handleChange('contact_interests', e.target.value)}
              placeholder="Ex: Gosta de pescar, acompanha F1, toca violão..."
              rows={2}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="important_dates">Datas Importantes</Label>
            <Textarea
              id="important_dates"
              value={formData.important_dates}
              onChange={(e) => handleChange('important_dates', e.target.value)}
              placeholder="Ex: Aniversário da empresa em 15/03, casamento do filho em junho..."
              rows={2}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="personal_notes">Observações Pessoais</Label>
            <Textarea
              id="personal_notes"
              value={formData.personal_notes}
              onChange={(e) => handleChange('personal_notes', e.target.value)}
              placeholder="Anotações sobre a personalidade, estilo, preferências do contato..."
              rows={3}
            />
          </div>
        </TabsContent>

        <TabsContent value="memory" className="space-y-4">
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-4">
            <p className="text-sm text-amber-800">
              <Brain className="w-4 h-4 inline mr-1" />
              <strong>Memória Comercial:</strong> Use este espaço para registrar informações estratégicas que ajudarão em futuras negociações.
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="purchase_preferences">Preferências de Compra</Label>
            <Textarea
              id="purchase_preferences"
              value={formData.purchase_preferences}
              onChange={(e) => handleChange('purchase_preferences', e.target.value)}
              placeholder="Ex: Prefere comprar no início do mês, gosta de tubos de 6m..."
              rows={3}
            />
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="price_restrictions">Restrições de Preço</Label>
              <Textarea
                id="price_restrictions"
                value={formData.price_restrictions}
                onChange={(e) => handleChange('price_restrictions', e.target.value)}
                placeholder="Ex: Só fecha se tiver 5% de desconto..."
                rows={2}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="payment_restrictions">Restrições de Prazo</Label>
              <Textarea
                id="payment_restrictions"
                value={formData.payment_restrictions}
                onChange={(e) => handleChange('payment_restrictions', e.target.value)}
                placeholder="Ex: Só paga em 45 dias..."
                rows={2}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="product_restrictions">Restrições de Produto</Label>
            <Textarea
              id="product_restrictions"
              value={formData.product_restrictions}
              onChange={(e) => handleChange('product_restrictions', e.target.value)}
              placeholder="Ex: Não trabalha com marca X, só aceita produto nacional..."
              rows={2}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="strategic_notes">Observações Estratégicas</Label>
            <Textarea
              id="strategic_notes"
              value={formData.strategic_notes}
              onChange={(e) => handleChange('strategic_notes', e.target.value)}
              placeholder="Anotações importantes sobre o cliente..."
              rows={3}
            />
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="previous_complaints">Reclamações Anteriores</Label>
              <Textarea
                id="previous_complaints"
                value={formData.previous_complaints}
                onChange={(e) => handleChange('previous_complaints', e.target.value)}
                placeholder="Histórico de reclamações..."
                rows={2}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="recurring_objections">Objeções Recorrentes</Label>
              <Textarea
                id="recurring_objections"
                value={formData.recurring_objections}
                onChange={(e) => handleChange('recurring_objections', e.target.value)}
                placeholder="Objeções que sempre aparecem..."
                rows={2}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="special_conditions">Condições Especiais Negociadas</Label>
            <Textarea
              id="special_conditions"
              value={formData.special_conditions}
              onChange={(e) => handleChange('special_conditions', e.target.value)}
              placeholder="Condições especiais acordadas com o cliente..."
              rows={2}
            />
          </div>
        </TabsContent>
      </Tabs>

      <div className="flex justify-end gap-3 pt-4 border-t">
        <Button type="button" variant="outline" onClick={onCancel}>
          <X className="w-4 h-4 mr-2" />
          Cancelar
        </Button>
        <Button type="submit" disabled={isLoading} className="bg-[#1e3a5f] hover:bg-[#2d4a6f]">
          <Save className="w-4 h-4 mr-2" />
          {isLoading ? 'Salvando...' : 'Salvar Cliente'}
        </Button>
      </div>
    </form>
  );
}