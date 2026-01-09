import React, { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Upload, Package, Users } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import PageHeader from '@/components/common/PageHeader';
import ProductImportForm from '@/components/imports/ProductImportForm';
import ClientImportForm from '@/components/imports/ClientImportForm';

export default function ImportData() {
  const queryClient = useQueryClient();

  const handleImportSuccess = () => {
    queryClient.invalidateQueries({ queryKey: ['products'] });
    queryClient.invalidateQueries({ queryKey: ['clients'] });
  };

  return (
    <div className="pb-20 lg:pb-6">
      <PageHeader 
        title="Importação em Massa" 
        subtitle="Importe produtos e clientes via CSV"
      />

      <div className="max-w-2xl mx-auto">
        <Tabs defaultValue="products" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="products" className="flex items-center gap-2">
              <Package className="w-4 h-4" />
              Produtos
            </TabsTrigger>
            <TabsTrigger value="clients" className="flex items-center gap-2">
              <Users className="w-4 h-4" />
              Clientes
            </TabsTrigger>
          </TabsList>

          <TabsContent value="products" className="space-y-4">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex gap-2">
                <Upload className="w-5 h-5 text-blue-600 flex-shrink-0" />
                <div className="text-sm text-blue-800">
                  <p className="font-medium mb-1">Formato esperado:</p>
                  <p>Arquivo CSV com colunas: code, name, description, category, unit, weight_per_meter, base_price_per_kg, cost_per_kg, ipi_rate, is_active</p>
                </div>
              </div>
            </div>
            <ProductImportForm onSuccess={handleImportSuccess} />
          </TabsContent>

          <TabsContent value="clients" className="space-y-4">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex gap-2">
                <Upload className="w-5 h-5 text-blue-600 flex-shrink-0" />
                <div className="text-sm text-blue-800">
                  <p className="font-medium mb-1">Formato esperado:</p>
                  <p>Arquivo CSV com colunas: company_name, trade_name, cnpj, state_registration, address, city, state, zip_code, phone, email, contact_name, contact_role, segment, status</p>
                </div>
              </div>
            </div>
            <ClientImportForm onSuccess={handleImportSuccess} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}