import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Database, Zap, TrendingUp, Calendar } from 'lucide-react';
import { toast } from 'sonner';
import PageHeader from '@/components/common/PageHeader';

export default function TestDataGenerator() {
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState('');

  const { data: clients = [] } = useQuery({
    queryKey: ['clients'],
    queryFn: () => base44.entities.Client.list('company_name', 500)
  });

  const { data: principals = [] } = useQuery({
    queryKey: ['principals'],
    queryFn: () => base44.entities.Principal.list('company_name', 100)
  });

  const { data: products = [] } = useQuery({
    queryKey: ['products'],
    queryFn: () => base44.entities.Product.list('name', 2500)
  });

  const getRandomDate = (startDaysAgo, endDaysAgo) => {
    const now = new Date();
    const start = new Date(now);
    start.setDate(start.getDate() - startDaysAgo);
    const end = new Date(now);
    end.setDate(end.getDate() - endDaysAgo);
    const timestamp = start.getTime() + Math.random() * (end.getTime() - start.getTime());
    return new Date(timestamp);
  };

  const randomItem = (array) => array[Math.floor(Math.random() * array.length)];
  const randomNumber = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;

  const generateHistoricalData = async () => {
    if (clients.length === 0 || principals.length === 0 || products.length === 0) {
      toast.error('Aguarde carregar os dados necessários');
      return;
    }

    setIsGenerating(true);
    
    try {
      // Distribuir dados ao longo de 12 meses
      const months = 12;
      let quotesCreated = 0;
      let opportunitiesCreated = 0;
      let ordersCreated = 0;
      let commissionsCreated = 0;

      for (let month = 0; month < months; month++) {
        const startDaysAgo = (months - month) * 30;
        const endDaysAgo = (months - month - 1) * 30;
        
        setProgress(`Gerando dados do mês ${month + 1}/${months}...`);

        // Gerar 15-25 orçamentos por mês
        const quotesThisMonth = randomNumber(15, 25);
        
        for (let i = 0; i < quotesThisMonth; i++) {
          const client = randomItem(clients);
          const principal = randomItem(principals);
          const principalProducts = products.filter(p => p.principal_id === principal.id);
          
          if (principalProducts.length === 0) continue;

          const numItems = randomNumber(1, 5);
          const items = [];
          let productsSubtotal = 0;
          let totalWeight = 0;
          let totalIcms = 0;
          let totalIpi = 0;

          for (let j = 0; j < numItems; j++) {
            const product = randomItem(principalProducts);
            const quantity = randomNumber(10, 500);
            const weight = quantity * (product.weight_per_meter || 1);
            const basePrice = product.base_price_per_kg || 10;
            const icmsRate = client.state === principal.state ? 18 : 12;
            const ipiRate = product.ipi_rate || 0;
            
            const pricePerKg = basePrice * (1 + Math.random() * 0.3); // variação de preço
            const itemSubtotal = weight * pricePerKg;
            const icmsValue = itemSubtotal * (icmsRate / 100);
            const ipiValue = itemSubtotal * (ipiRate / 100);

            items.push({
              product_id: product.id,
              product_code: product.code,
              product_name: product.name,
              quantity,
              unit: product.unit || 'kg',
              weight_per_meter: product.weight_per_meter,
              total_weight: weight,
              base_price_per_kg: basePrice,
              price_per_kg: pricePerKg,
              icms_rate: icmsRate,
              ipi_rate: ipiRate,
              item_subtotal: itemSubtotal,
              icms_value: icmsValue,
              ipi_value: ipiValue,
              item_total: itemSubtotal + icmsValue + ipiValue
            });

            productsSubtotal += itemSubtotal;
            totalWeight += weight;
            totalIcms += icmsValue;
            totalIpi += ipiValue;
          }

          const totalValue = productsSubtotal + totalIcms + totalIpi;
          const createdDate = getRandomDate(startDaysAgo, endDaysAgo);
          const quoteNumber = `ORC-${createdDate.getFullYear()}-${String(createdDate.getMonth() + 1).padStart(2, '0')}-${String(quotesCreated + 1).padStart(4, '0')}`;

          // Definir status baseado na idade
          const ageInDays = Math.floor((new Date() - createdDate) / (1000 * 60 * 60 * 24));
          let status = 'emitido';
          let sentDate = null;

          if (ageInDays > 3) {
            status = 'enviado';
            sentDate = new Date(createdDate);
            sentDate.setDate(sentDate.getDate() + randomNumber(1, 3));
          }

          const quote = await base44.entities.Quote.create({
            quote_number: quoteNumber,
            client_id: client.id,
            client_name: client.trade_name || client.company_name,
            client_cnpj: client.cnpj,
            client_state: client.state,
            principal_id: principal.id,
            principal_name: principal.trade_name || principal.company_name,
            items,
            products_subtotal: productsSubtotal,
            total_icms: totalIcms,
            total_ipi: totalIpi,
            total_weight: totalWeight,
            total_value: totalValue,
            terms: randomItem(['30/60/90', '30/45/60', '21/28', 'A VISTA']),
            status,
            sent_date: sentDate ? sentDate.toISOString().split('T')[0] : null,
            created_date: createdDate.toISOString()
          });

          quotesCreated++;

          // 60% chance de criar oportunidade se enviado
          if (status === 'enviado' && Math.random() < 0.6) {
            const stage = randomItem(['proposta_enviada', 'proposta_enviada', 'em_negociacao', 'ganho', 'perdido']);
            
            const opportunity = await base44.entities.Opportunity.create({
              quote_id: quote.id,
              quote_number: quoteNumber,
              created_from_quote_id: quote.id,
              client_id: client.id,
              client_name: client.trade_name || client.company_name,
              principal_id: principal.id,
              principal_name: principal.trade_name || principal.company_name,
              value_estimated: totalValue,
              total_weight: totalWeight,
              stage,
              last_contact_date: sentDate,
              created_date: sentDate
            });

            opportunitiesCreated++;

            // Se ganho, criar pedido e comissão
            if (stage === 'ganho' && ageInDays > 10) {
              const orderDate = new Date(sentDate);
              orderDate.setDate(orderDate.getDate() + randomNumber(7, 20));
              
              const orderNumber = `PED-${orderDate.getFullYear()}-${String(orderDate.getMonth() + 1).padStart(2, '0')}-${String(ordersCreated + 1).padStart(4, '0')}`;

              const order = await base44.entities.Order.create({
                order_number: orderNumber,
                quote_id: quote.id,
                opportunity_id: opportunity.id,
                client_id: client.id,
                client_name: client.trade_name || client.company_name,
                principal_id: principal.id,
                principal_name: principal.trade_name || principal.company_name,
                items: items.map(item => ({
                  ...item,
                  unit_price: item.price_per_kg,
                  unit_cost: item.base_price_per_kg * 0.8,
                  total_price: item.item_total,
                  total_cost: item.total_weight * item.base_price_per_kg * 0.8
                })),
                total_value: totalValue,
                total_weight: totalWeight,
                total_icms: totalIcms,
                total_ipi: totalIpi,
                terms: quote.terms,
                status: 'faturado',
                billing_date: orderDate.toISOString().split('T')[0],
                invoice_date: orderDate.toISOString().split('T')[0],
                invoiced_value: totalValue,
                created_date: orderDate.toISOString()
              });

              ordersCreated++;

              // Criar comissão
              const commissionRate = principal.commission_percentage || 3;
              const commissionTotal = totalValue * (commissionRate / 100);

              const commission = await base44.entities.Commission.create({
                representada_id: principal.id,
                principal_id: principal.id,
                principal_name: principal.trade_name || principal.company_name,
                client_id: client.id,
                client_name: client.trade_name || client.company_name,
                order_id: order.id,
                order_number: orderNumber,
                quote_id: quote.id,
                opportunity_id: opportunity.id,
                sales_value: totalValue,
                commission_rate: commissionRate,
                commission_total_value: commissionTotal,
                commission_value: commissionTotal,
                status: 'a_receber',
                invoice_date: orderDate.toISOString().split('T')[0],
                created_date: orderDate.toISOString()
              });

              commissionsCreated++;

              // Criar parcelas de comissão
              const terms = quote.terms.split('/');
              const paymentDay = principal.payment_day || 10;
              
              for (let t = 0; t < terms.length; t++) {
                const daysToAdd = parseInt(terms[t]) || 30;
                const dueDate = new Date(orderDate);
                dueDate.setDate(dueDate.getDate() + daysToAdd);
                dueDate.setDate(paymentDay);

                const installmentValue = commissionTotal / terms.length;
                const installmentPct = 100 / terms.length;

                // Se a data de vencimento já passou há mais de 5 dias, marcar como recebida
                const isPast = dueDate < new Date(Date.now() - 5 * 24 * 60 * 60 * 1000);
                const statusInstallment = isPast ? 'recebida' : 'a_receber';

                await base44.entities.CommissionInstallment.create({
                  commission_id: commission.id,
                  representada_id: principal.id,
                  order_id: order.id,
                  installment_no: t + 1,
                  installment_pct: installmentPct,
                  installment_value: installmentValue,
                  due_date: dueDate.toISOString().split('T')[0],
                  status: statusInstallment,
                  received_value: statusInstallment === 'recebida' ? installmentValue : null,
                  received_at: statusInstallment === 'recebida' ? dueDate.toISOString().split('T')[0] : null,
                  reference_month: `${dueDate.getFullYear()}-${String(dueDate.getMonth() + 1).padStart(2, '0')}`
                });
              }

              // Atualizar cliente com última compra
              await base44.entities.Client.update(client.id, {
                last_purchase_date: orderDate.toISOString().split('T')[0],
                last_purchase_product: items[0].product_name,
                last_purchase_value: totalValue,
                purchase_count: (client.purchase_count || 0) + 1,
                total_purchases: (client.total_purchases || 0) + totalValue
              });
            }
          }

          // Atualizar cliente com último orçamento
          if (!client.last_quoted_date || new Date(client.last_quoted_date) < createdDate) {
            await base44.entities.Client.update(client.id, {
              last_quoted_date: createdDate.toISOString().split('T')[0],
              last_quoted_product: items[0].product_name,
              last_quoted_value: totalValue
            });
          }
        }
      }

      setProgress('Concluído!');
      toast.success(`Dados gerados! ${quotesCreated} orçamentos, ${opportunitiesCreated} oportunidades, ${ordersCreated} pedidos, ${commissionsCreated} comissões`);
      
    } catch (error) {
      console.error('Erro ao gerar dados:', error);
      toast.error('Erro ao gerar dados: ' + error.message);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <PageHeader
        title="Gerador de Dados de Teste"
        subtitle="Criar histórico retroativo de 1 ano para testes"
      />

      <div className="max-w-2xl mx-auto space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="w-5 h-5" />
              Status dos Dados
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-slate-50 p-4 rounded-lg text-center">
                <p className="text-sm text-slate-600">Clientes</p>
                <p className="text-2xl font-bold text-slate-900">{clients.length}</p>
              </div>
              <div className="bg-slate-50 p-4 rounded-lg text-center">
                <p className="text-sm text-slate-600">Representadas</p>
                <p className="text-2xl font-bold text-slate-900">{principals.length}</p>
              </div>
              <div className="bg-slate-50 p-4 rounded-lg text-center">
                <p className="text-sm text-slate-600">Produtos</p>
                <p className="text-2xl font-bold text-slate-900">{products.length}</p>
              </div>
            </div>

            {isGenerating && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-center gap-3 mb-2">
                  <Loader2 className="w-5 h-5 animate-spin text-blue-600" />
                  <p className="font-medium text-blue-900">Gerando dados históricos...</p>
                </div>
                <p className="text-sm text-blue-700">{progress}</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              O que será gerado
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-start gap-3">
              <Zap className="w-5 h-5 text-emerald-600 mt-0.5" />
              <div>
                <p className="font-medium text-slate-900">180-300 Orçamentos</p>
                <p className="text-sm text-slate-600">Distribuídos ao longo de 12 meses</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <TrendingUp className="w-5 h-5 text-blue-600 mt-0.5" />
              <div>
                <p className="font-medium text-slate-900">~60% Oportunidades</p>
                <p className="text-sm text-slate-600">Com estágios variados no funil</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Zap className="w-5 h-5 text-amber-600 mt-0.5" />
              <div>
                <p className="font-medium text-slate-900">Pedidos e Comissões</p>
                <p className="text-sm text-slate-600">Para oportunidades ganhas com parcelas</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Zap className="w-5 h-5 text-purple-600 mt-0.5" />
              <div>
                <p className="font-medium text-slate-900">Atualização de Clientes</p>
                <p className="text-sm text-slate-600">Último orçamento e última compra</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Button
          onClick={generateHistoricalData}
          disabled={isGenerating || clients.length === 0}
          className="w-full bg-[#0F2A44] hover:bg-[#1F4E79] h-12 text-lg"
        >
          {isGenerating ? (
            <>
              <Loader2 className="w-5 h-5 mr-2 animate-spin" />
              Gerando Dados...
            </>
          ) : (
            <>
              <Zap className="w-5 h-5 mr-2" />
              Gerar Histórico de 1 Ano
            </>
          )}
        </Button>

        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
          <p className="text-sm text-amber-800">
            ⚠️ Esta operação pode demorar alguns minutos e criará centenas de registros. 
            Use apenas em ambiente de testes.
          </p>
        </div>
      </div>
    </div>
  );
}