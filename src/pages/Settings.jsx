import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  User, 
  Building2, 
  Upload,
  Save,
  LogOut,
  Palette,
  Database,
  FileSpreadsheet
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import PageHeader from '@/components/common/PageHeader';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';

export default function Settings() {
  const queryClient = useQueryClient();

  const { data: user, isLoading: loadingUser } = useQuery({
    queryKey: ['user'],
    queryFn: () => base44.auth.me()
  });

  const { data: representatives = [], isLoading: loadingRep } = useQuery({
    queryKey: ['representatives'],
    queryFn: () => base44.entities.Representative.list('-created_date', 1)
  });

  const [repData, setRepData] = useState({
    name: '',
    document: '',
    phone: '',
    email: '',
    region: '',
    logo_url: '',
    signature: '',
    signature_image_url: '',
    bank_name: '',
    bank_agency: '',
    bank_account: '',
    pix_key: ''
  });

  useEffect(() => {
    if (representatives.length > 0) {
      const rep = representatives[0];
      setRepData({
        name: rep.name || '',
        document: rep.document || '',
        phone: rep.phone || '',
        email: rep.email || '',
        region: rep.region || '',
        logo_url: rep.logo_url || '',
        signature: rep.signature || '',
        signature_image_url: rep.signature_image_url || '',
        bank_name: rep.bank_name || '',
        bank_agency: rep.bank_agency || '',
        bank_account: rep.bank_account || '',
        pix_key: rep.pix_key || ''
      });
    }
  }, [representatives]);

  const saveMutation = useMutation({
    mutationFn: async (data) => {
      if (representatives.length > 0) {
        return base44.entities.Representative.update(representatives[0].id, data);
      } else {
        return base44.entities.Representative.create(data);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['representatives'] });
      toast.success('Configurações salvas com sucesso!');
    }
  });

  const handleLogoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        const { file_url } = await base44.integrations.Core.UploadFile({ file });
        setRepData(prev => ({ ...prev, logo_url: file_url }));
        toast.success('Logo enviado com sucesso!');
      } catch (error) {
        toast.error('Erro ao enviar logo');
      }
    }
  };

  const handleSignatureUpload = async (e) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        const { file_url } = await base44.integrations.Core.UploadFile({ file });
        setRepData(prev => ({ ...prev, signature_image_url: file_url }));
        toast.success('Assinatura enviada com sucesso!');
      } catch (error) {
        toast.error('Erro ao enviar assinatura');
      }
    }
  };

  const handleSave = () => {
    saveMutation.mutate(repData);
  };

  const handleLogout = () => {
    base44.auth.logout();
  };

  const isLoading = loadingUser || loadingRep;

  return (
    <div className="pb-20 lg:pb-6">
      <PageHeader 
        title="Configurações" 
        subtitle="Gerencie seu perfil e preferências"
      />

      <Tabs defaultValue="profile" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="profile">
            <User className="w-4 h-4 mr-2" />
            Perfil
          </TabsTrigger>
          <TabsTrigger value="company">
            <Building2 className="w-4 h-4 mr-2" />
            Empresa
          </TabsTrigger>
          <TabsTrigger value="data">
            <Database className="w-4 h-4 mr-2" />
            Dados
          </TabsTrigger>
        </TabsList>

        {/* Profile Tab */}
        <TabsContent value="profile">
          <Card>
            <CardHeader>
              <CardTitle>Dados do Representante</CardTitle>
              <CardDescription>
                Informações básicas e de contato
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {isLoading ? (
                <div className="space-y-4">
                  {[...Array(4)].map((_, i) => (
                    <Skeleton key={i} className="h-10 w-full" />
                  ))}
                </div>
              ) : (
                <>
                  <div className="flex items-center gap-4 mb-6">
                    <div className="relative">
                      {repData.logo_url ? (
                        <img 
                          src={repData.logo_url} 
                          alt="Logo"
                          className="w-20 h-20 rounded-xl object-cover border border-slate-200"
                        />
                      ) : (
                        <div className="w-20 h-20 bg-slate-100 rounded-xl flex items-center justify-center">
                          <Building2 className="w-8 h-8 text-slate-400" />
                        </div>
                      )}
                      <label className="absolute -bottom-2 -right-2 w-8 h-8 bg-[#1e3a5f] rounded-full flex items-center justify-center cursor-pointer hover:bg-[#2d4a6f] transition-colors">
                        <Upload className="w-4 h-4 text-white" />
                        <input 
                          type="file" 
                          className="hidden" 
                          accept="image/*"
                          onChange={handleLogoUpload}
                        />
                      </label>
                    </div>
                    <div>
                      <p className="font-medium text-slate-900">{repData.name || 'Seu nome'}</p>
                      <p className="text-sm text-slate-500">{user?.email}</p>
                    </div>
                  </div>

                  <div className="grid sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Nome Completo</Label>
                      <Input
                        value={repData.name}
                        onChange={(e) => setRepData({ ...repData, name: e.target.value })}
                        placeholder="Seu nome"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>CPF/CNPJ</Label>
                      <Input
                        value={repData.document}
                        onChange={(e) => setRepData({ ...repData, document: e.target.value })}
                        placeholder="000.000.000-00"
                      />
                    </div>
                  </div>

                  <div className="grid sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Telefone</Label>
                      <Input
                        value={repData.phone}
                        onChange={(e) => setRepData({ ...repData, phone: e.target.value })}
                        placeholder="(00) 00000-0000"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>E-mail</Label>
                      <Input
                        value={repData.email}
                        onChange={(e) => setRepData({ ...repData, email: e.target.value })}
                        placeholder="seu@email.com"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Região de Atuação</Label>
                    <Input
                      value={repData.region}
                      onChange={(e) => setRepData({ ...repData, region: e.target.value })}
                      placeholder="Ex: São Paulo, Interior SP, Sul do Brasil"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Assinatura (para propostas)</Label>
                    <Textarea
                      value={repData.signature}
                      onChange={(e) => setRepData({ ...repData, signature: e.target.value })}
                      placeholder="Sua assinatura padrão para propostas e orçamentos"
                      rows={3}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Assinatura em Imagem (PNG)</Label>
                    <div className="flex items-center gap-4">
                      {repData.signature_image_url && (
                        <img 
                          src={repData.signature_image_url} 
                          alt="Assinatura"
                          className="h-16 object-contain border border-slate-200 rounded-lg px-2"
                        />
                      )}
                      <label className="cursor-pointer">
                        <div className="px-4 py-2 border-2 border-dashed border-slate-300 rounded-lg hover:border-slate-400 transition-colors">
                          <Upload className="w-5 h-5 mx-auto mb-1 text-slate-400" />
                          <span className="text-xs text-slate-600">Upload PNG</span>
                        </div>
                        <input 
                          type="file" 
                          className="hidden" 
                          accept="image/png"
                          onChange={handleSignatureUpload}
                        />
                      </label>
                    </div>
                    <p className="text-xs text-slate-500">
                      Faça upload de uma imagem PNG transparente da sua assinatura
                    </p>
                  </div>

                  <Button 
                    onClick={handleSave}
                    disabled={saveMutation.isPending}
                    className="bg-[#1e3a5f] hover:bg-[#2d4a6f]"
                  >
                    <Save className="w-4 h-4 mr-2" />
                    {saveMutation.isPending ? 'Salvando...' : 'Salvar Alterações'}
                  </Button>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Company/Bank Tab */}
        <TabsContent value="company">
          <Card>
            <CardHeader>
              <CardTitle>Dados Bancários</CardTitle>
              <CardDescription>
                Informações para recebimento de comissões (opcional)
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {isLoading ? (
                <div className="space-y-4">
                  {[...Array(4)].map((_, i) => (
                    <Skeleton key={i} className="h-10 w-full" />
                  ))}
                </div>
              ) : (
                <>
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Banco</Label>
                      <Input
                        value={repData.bank_name}
                        onChange={(e) => setRepData({ ...repData, bank_name: e.target.value })}
                        placeholder="Nome do banco"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Agência</Label>
                      <Input
                        value={repData.bank_agency}
                        onChange={(e) => setRepData({ ...repData, bank_agency: e.target.value })}
                        placeholder="0000"
                      />
                    </div>
                  </div>

                  <div className="grid sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Conta</Label>
                      <Input
                        value={repData.bank_account}
                        onChange={(e) => setRepData({ ...repData, bank_account: e.target.value })}
                        placeholder="00000-0"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Chave PIX</Label>
                      <Input
                        value={repData.pix_key}
                        onChange={(e) => setRepData({ ...repData, pix_key: e.target.value })}
                        placeholder="CPF, e-mail ou telefone"
                      />
                    </div>
                  </div>

                  <Button 
                    onClick={handleSave}
                    disabled={saveMutation.isPending}
                    className="bg-[#1e3a5f] hover:bg-[#2d4a6f]"
                  >
                    <Save className="w-4 h-4 mr-2" />
                    {saveMutation.isPending ? 'Salvando...' : 'Salvar Alterações'}
                  </Button>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Data Tab */}
        <TabsContent value="data">
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Importar Dados</CardTitle>
                <CardDescription>
                  Importe produtos e tabelas de preço
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-4">
                  <p className="text-sm text-amber-800">
                    <strong>Em breve:</strong> Importação de tabelas de preço e estoques via Excel/CSV
                  </p>
                </div>
                <Button variant="outline" disabled>
                  <FileSpreadsheet className="w-4 h-4 mr-2" />
                  Importar Excel
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Conta</CardTitle>
                <CardDescription>
                  Gerenciar sua conta
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button 
                  variant="outline" 
                  onClick={handleLogout}
                  className="text-red-600 border-red-200 hover:bg-red-50"
                >
                  <LogOut className="w-4 h-4 mr-2" />
                  Sair da Conta
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}