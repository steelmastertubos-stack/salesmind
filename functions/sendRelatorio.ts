import { base44 } from '@/api/base44Client';

export async function sendRelatorioEmail(email) {
  const relatorioContent = `
=================================================================
              RELATÓRIO ABRANGENTE - SALESMIND
              B2B Sales Intelligence Platform
=================================================================

📅 DATA DE GERAÇÃO: ${new Date().toLocaleDateString('pt-BR')}
📧 DESTINATÁRIO: ${email}

=================================================================
1. VISÃO GERAL DA APLICAÇÃO
=================================================================

Nome: SalesMind - B2B Sales Intelligence
Tipo: Sistema de Gestão de Vendas e CRM para Representantes
Objetivo: Otimizar vendas B2B, gerenciar clientes, orçamentos, pedidos e comissões
Stack: React 18 + TypeScript + Tailwind CSS + Base44 Backend

=================================================================
2. ARQUITETURA TÉCNICA
=================================================================

Frontend:
- React 18.2.0 com React Router
- TypeScript para type safety
- Tailwind CSS + Shadcn/UI components
- TanStack React Query para gerenciamento de estado
- Framer Motion para animações
- Lucide React para ícones

Backend:
- Base44 Platform (BaaS)
- Supabase (Banco de dados)
- Autenticação integrada

Estrutura:
├── entities/          (JSON Schemas - 11 entidades)
├── pages/             (13 páginas principais)
├── components/        (30+ componentes reutilizáveis)
├── functions/         (Utilitários e lógica de negócio)
├── Layout.js          (Layout global)
└── globals.css        (Estilos globais)

=================================================================
3. ENTIDADES DO SISTEMA (Modelos de Dados)
=================================================================

1️⃣ CLIENT (Cliente)
   - Dados da empresa e contato
   - Histórico de compras
   - Status (ativo, atenção, em risco, inativo)
   - Score de oportunidade
   - Datas de contato e próximas ações

2️⃣ PRINCIPAL (Representado/Fornecedor)
   - Empresa que o representante representa
   - Dados comerciais e de contato
   - Comissões e tabelas VTK
   - Produtos disponíveis

3️⃣ PRODUCT (Produto)
   - Código, nome, descrição
   - Categoria (tubos, chapas, perfis, etc)
   - Preços com ICMS 18%
   - Custos para cálculo de margem
   - Informações de estoque

4️⃣ QUOTE (Orçamento)
   - Número único do orçamento
   - Itens detalhados com cálculos
   - Impostos (ICMS, IPI) automáticos
   - Frete (FOB ou CIF)
   - Status: Rascunho → Enviado → Convertido

5️⃣ ORDER (Pedido)
   - Conversão de orçamento
   - Status completo (análise até entrega)
   - Cálculo de margem por item
   - Comissão esperada
   - Timeline de histórico

6️⃣ COMMISSION (Comissão)
   - Rastreamento de pagamentos
   - Status (prevista, faturada, recebida, atrasada)
   - Datas e valores

7️⃣ OPPORTUNITY (Oportunidade)
   - Funil de vendas (Kanban)
   - Estágios: Proposta → Negociação → Ganho/Perdido
   - Score de prioridade (0-100)
   - Dias sem contato
   - Razão de perda

8️⃣ REPRESENTATIVE (Representante)
   - Vendedor que usa o sistema
   - Dados, assinatura, dados bancários

9️⃣ FOLLOWUP (Acompanhamento)
   - Registro de contatos (call, visit, WhatsApp, email, meeting)
   - Resultado (positive, neutral, negative, no_answer)

🔟 PENDINGEMAIL (Fila de Emails)
   - Emails agendados
   - Lembretes automáticos

1️⃣1️⃣ MONTHLYGOAL (Meta Mensal)
   - Metas de vendas por mês
   - Rastreamento de atingimento

=================================================================
4. PÁGINAS PRINCIPAIS (13 Páginas)
=================================================================

📊 DASHBOARD (Painel Principal)
   ✓ Resumo de vendas (mês atual vs anterior)
   ✓ Desempenho vs meta mensal
   ✓ Cards com KPIs principais
   ✓ Alertas integrados
   ✓ Clientes prioritários
   ✓ Gráficos de tendências
   ✓ Ações rápidas

👥 CLIENTES (Gerenciamento de Base)
   ✓ Listagem com busca e filtros
   ✓ Status do cliente (ativo, em risco, inativo)
   ✓ Criação/edição via modal
   ✓ Busca de CNPJ automática
   ✓ Segmentação por atividade

🔍 DETALHES DO CLIENTE
   ✓ Histórico completo de compras
   ✓ Oportunidades ativas
   ✓ Últimos contatos
   ✓ Score de oportunidade
   ✓ Sugestões de cross-sell (IA)

📄 ORÇAMENTOS
   ✓ Criação com form avançado
   ✓ Seleção de representado (carga dinâmica de produtos)
   ✓ Seleção de cliente e estado (determina ICMS)
   ✓ Adição de itens com cálculo automático
   ✓ Cálculo de margem e comissão VTK
   ✓ Fluxo de status automático
   ✓ Envio via WhatsApp/Email
   ✓ Impressão e exportação PDF

📈 CRM / OPORTUNIDADES
   ✓ Kanban board com 4 colunas
   ✓ Drag-and-drop para mudar estágio
   ✓ Automação ao marcar como "Ganho"
   ✓ Criação automática de pedido
   ✓ Fila de emails pendentes com lembretes
   ✓ Detalhes em modal interativo

📦 PEDIDOS
   ✓ Listagem com filtros avançados
   ✓ Conversão automática de orçamento
   ✓ Status com timeline histórica
   ✓ Cálculo de margem por item
   ✓ Informações de faturamento
   ✓ Comissão esperada

💰 COMISSÕES
   ✓ Tabela detalhada de comissões
   ✓ Filtro por status (Esperada, Faturada, Recebida, Atrasada)
   ✓ Cards com totalizações
   ✓ Edição manual de comissões
   ✓ Cálculo de saldo pendente

🏢 REPRESENTADOS
   ✓ Gestão de fornecedores
   ✓ Configuração de comissões
   ✓ Editor de tabela VTK por margem

📊 RELATÓRIOS
   ✓ Relatórios customizáveis
   ✓ Filtros por período, cliente, representado
   ✓ Gráficos e exportação de dados

🤖 INSIGHTS IA
   ✓ Previsão de próxima compra
   ✓ Recomendações automáticas
   ✓ Análise de padrões de compra

🗺️ MODO CAMPO
   ✓ Interface otimizada para mobile
   ✓ Mapa de clientes
   ✓ Contatos rápidos

⚙️ CONFIGURAÇÕES
   ✓ Dados do representante
   ✓ Preferências
   ✓ Integração com sistemas externos

=================================================================
5. CÁLCULOS E LÓGICA DE NEGÓCIO
=================================================================

🧮 CÁLCULO DE ICMS
├─ Baseado no estado do cliente
├─ 18% para estados do Sul/Sudeste (SP, PR, SC, RS, RJ, MG)
├─ 12% para estados Centro-Oeste/Norte (MT, MS, GO, DF, etc)
├─ 7% para estados do Nordeste (BA, PE, CE, etc)
└─ 4% para produtos importados

🧮 CÁLCULO DE IPI
├─ Tubos quadrados/retangulares: 5%
├─ Chapas e tubos redondos: 3,25%
└─ Perfis, vigas, cantoneiras: ISENTO (0%)

📊 CÁLCULO DE MARGEM (VTK)
   Margem % = ((Venda Total - Custo Total) / Custo Total) × 100
   
   Componentes:
   ├─ Venda Total = Soma de itens com impostos
   └─ Custo Total = custo_per_kg × peso total de cada item

💵 CÁLCULO DE COMISSÃO VTK
   ├─ Tabela com 34 faixas de margem (15% a 65%+)
   ├─ Taxa varia conforme margem
   ├─ Exemplos:
   │  ├─ 15-19.99% margem → 0.50% comissão
   │  ├─ 20% margem → 0.60% comissão
   │  ├─ 23% margem → 1.02% comissão
   │  ├─ 30% margem → 2.00% comissão
   │  └─ 65%+ margem → 5.00% comissão
   └─ Comissão Final = Valor Total × (Taxa / 100)

💵 CÁLCULO DE COMISSÃO SIMPLES
   └─ Comissão = Valor Total × (Percentual Fixo / 100)

=================================================================
6. AUTOMAÇÕES IMPLEMENTADAS
=================================================================

🔄 AUTOMAÇÕES DO SISTEMA

1️⃣ Criação Automática de Oportunidade
   ├─ Ao emitir/enviar orçamento
   ├─ Cálculo automático de priority score
   └─ Lock automático do orçamento

2️⃣ Criação Automática de Pedido
   ├─ Ao arrastar oportunidade para "Ganho"
   ├─ Busca dados do orçamento
   ├─ Cria com status "em_análise"
   ├─ Envia email ao representado
   └─ Converte orçamento para "convertido"

3️⃣ Cálculo de Dias Sem Contato
   └─ Atualiza automaticamente em oportunidades ativas

4️⃣ Alertas de Oportunidades Prioritárias
   ├─ Score alto (≥70)
   ├─ Vencimento próximo
   ├─ Muitos dias sem contato (≥5 dias)
   └─ Risco Alto/Médio

5️⃣ Fila de Emails Pendentes
   ├─ Agendamento de envio
   ├─ Sistema de lembretes
   └─ Adia por 1 hora se necessário

=================================================================
7. COMPONENTES PRINCIPAIS
=================================================================

📦 COMPONENTES DE FORMULÁRIO
├─ ClientForm
└─ SteelQuoteForm (Form avançado com cálculos complexos)

📦 COMPONENTES DE EXIBIÇÃO
├─ ClientCard
├─ ClientScore
├─ OpportunityCard
└─ OpportunityDetail

📦 COMPONENTES DE ORÇAMENTO
├─ QuotePrintView
├─ QuotePDFExport
├─ SendQuoteDialog
└─ ConvertQuoteDialog

📦 COMPONENTES DE DASHBOARD
├─ GoalsPanel
├─ IntegratedAlerts
├─ PriorityClients
└─ StatsCard

📦 COMPONENTES AUXILIARES
├─ PageHeader
├─ EmptyState
├─ CNPJLookup
└─ UserNotRegisteredError

=================================================================
8. FLUXOS PRINCIPAIS DE NEGÓCIO
=================================================================

🔄 FLUXO DE VENDA COMPLETO
1. Criar Cliente
2. Criar Orçamento
3. Enviar Orçamento (automático: cria oportunidade)
4. Arrastar para "Ganho" no Kanban (automático: cria pedido)
5. Faturar Pedido
6. Registrar Comissão

🔄 FLUXO DE ORÇAMENTO
Rascunho → Enviado → Convertido (automático ao ganhar)

🔄 FLUXO DE PEDIDO
Em Análise → Confirmado → Em Produção → Faturado → Entregue

🔄 FLUXO DE OPORTUNIDADE (Kanban)
Proposta Enviada → Em Negociação → Ganho/Perdido

=================================================================
9. RESPONSIVIDADE
=================================================================

📱 DESIGN RESPONSIVO

Mobile (< 640px):
├─ Sidebar → Mobile menu conversível
├─ Bottom navigation para ações principais
├─ Modais full-screen
└─ Grid 1 coluna

Tablet (640px - 1024px):
├─ Sidebar conversível
├─ Grid 2 colunas
└─ Bottom navigation parcial

Desktop (> 1024px):
├─ Sidebar fixa (264px)
├─ Grid 3-4 colunas
└─ Navegação completa

=================================================================
10. INTEGRAÇÕES EXTERNAS
=================================================================

🔗 INTEGRAÇÕES DISPONÍVEIS (Requer backend functions)
├─ Google Docs/Sheets/Slides
├─ Slack
├─ Notion
├─ LinkedIn
├─ Salesforce
└─ HubSpot

=================================================================
11. MÉTRICAS E KPIs RASTREADOS
=================================================================

📊 KPIs PRINCIPAIS
1. Vendas Mensais - Valor total faturado
2. Meta de Vendas - Comparação com objetivo
3. Taxa de Conversão - Orçamentos → Pedidos
4. Valor Médio de Pedido - Ticket médio
5. Número de Clientes Ativos - Base ativa
6. Oportunidades em Funil - Por estágio
7. Dias Sem Contato - Risco de perda
8. Comissão a Receber - Previsão de ganho
9. Score de Prioridade - Ranking de clientes
10. Margem por Pedido - Rentabilidade

=================================================================
12. SEGURANÇA E AUTENTICAÇÃO
=================================================================

🔒 SEGURANÇA

├─ Autenticação integrada ao Base44
├─ Login por email
├─ Role-based (admin, user)
├─ Usuário logado rastreado em "created_by"
└─ Acesso a dados próprios do representante

=================================================================
13. FUNCIONALIDADES AVANÇADAS
=================================================================

🤖 IA E MACHINE LEARNING
├─ Previsão de data de próxima compra
├─ Cálculo inteligente de priority score
├─ Sugestões de cross-sell
└─ Análise automática de risco

🎯 INTERATIVIDADE
├─ Kanban com drag-and-drop
├─ Transições automáticas de status
├─ Cálculos complexos em tempo real
├─ Importação de dados (CNPJ lookup)
└─ Animações suaves (Framer Motion)

=================================================================
14. ROADMAP SUGERIDO
=================================================================

✅ JÁ IMPLEMENTADO
├─ Sistema completo de CRM
├─ Cálculos complexos de impostos
├─ Fluxo de vendas automático
├─ Interface responsiva
├─ Alertas inteligentes
└─ Tabela VTK de comissão por margem

🚀 SUGESTÕES FUTURAS
├─ Histórico detalhado de alterações
├─ Previsão de receita por período
├─ Integração com ERP
├─ App mobile nativa
├─ Relatórios agendados por email
├─ Análise de competidores
└─ Previsão de churn de clientes

=================================================================
15. CONCLUSÃO
=================================================================

SalesMind é uma aplicação B2B completa e robusta, especialmente
otimizada para representantes da indústria siderúrgica.

✨ Principais Diferenciais:
├─ CRM integrado com gerenciamento de orçamentos
├─ Cálculos complexos de impostos automatizados
├─ Sistema de comissão inteligente com tabelas VTK
├─ Interface intuitiva e responsiva
├─ Automações que reduzem trabalho manual
├─ Análise preditiva com IA
└─ Kanban visual para funil de vendas

A plataforma torna o processo de venda mais eficiente, o 
rastreamento de oportunidades visual e dinâmico, além de 
oferecer insights valiosos para tomada de decisão.

=================================================================
Relatório Gerado: ${new Date().toLocaleString('pt-BR')}
=================================================================
  `;

  try {
    await base44.integrations.Core.SendEmail({
      to: email,
      subject: '📊 RELATÓRIO COMPLETO - APLICATIVO SALESMIND',
      body: relatorioContent,
      from_name: 'SalesMind'
    });
    
    return {
      success: true,
      message: `Relatório enviado com sucesso para ${email}`
    };
  } catch (error) {
    console.error('Erro ao enviar relatório:', error);
    return {
      success: false,
      message: 'Erro ao enviar relatório: ' + error.message
    };
  }
}