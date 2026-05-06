/**
 * RELATÓRIO SEMANAL AUTOMÁTICO
 * 
 * Esta função deve ser executada semanalmente (domingo ou segunda) 
 * para enviar relatório de performance por email.
 * 
 * IMPORTANTE: Função backend requer backend functions habilitado.
 * Configurar no dashboard -> Settings -> Backend Functions -> Schedule
 * Agendar para rodar toda segunda-feira às 8:00 AM
 */

export default async function sendWeeklyReport({ base44 }) {
  try {
    // Buscar dados da semana
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    
    const opportunities = await base44.asServiceRole.entities.Opportunity.list('-created_date', 500);
    const orders = await base44.asServiceRole.entities.Order.list('-created_date', 500);
    const goals = await base44.asServiceRole.entities.MonthlyGoal.list('-year', 12);
    const user = await base44.auth.me();

    // Filtrar oportunidades da semana
    const weekOpps = opportunities.filter(o => {
      const date = new Date(o.created_date);
      return date >= sevenDaysAgo;
    });

    // Calcular estatísticas
    const ganhos = weekOpps.filter(o => o.stage === 'ganho').length;
    const emNegociacao = weekOpps.filter(o => o.stage === 'em_negociacao').length;
    const perdidos = weekOpps.filter(o => o.stage === 'perdido').length;
    const total = weekOpps.length;

    const pctGanhos = total > 0 ? ((ganhos / total) * 100).toFixed(1) : 0;
    const pctNegociacao = total > 0 ? ((emNegociacao / total) * 100).toFixed(1) : 0;
    const pctPerdidos = total > 0 ? ((perdidos / total) * 100).toFixed(1) : 0;

    // Calcular faturamento do mês
    const now = new Date();
    const monthOrders = orders.filter(o => {
      const date = new Date(o.created_date);
      return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
    });
    
    const faturamento = monthOrders.reduce((sum, o) => sum + (o.total_value || 0), 0);

    // Buscar meta do mês atual
    const currentGoal = goals.find(g => g.year === now.getFullYear() && g.month === (now.getMonth() + 1));
    const meta = currentGoal?.goal_value || 0;
    const pctMeta = meta > 0 ? ((faturamento / meta) * 100).toFixed(1) : 0;

    // Mensagens motivadoras baseadas na performance
    let motivacao = '';
    if (pctMeta >= 100) {
      motivacao = '🎉 Parabéns! Meta atingida! Continue com esse ritmo incrível!';
    } else if (pctMeta >= 80) {
      motivacao = '🔥 Você está quase lá! Faltam apenas ' + (100 - pctMeta).toFixed(0) + '% para bater a meta!';
    } else if (pctMeta >= 50) {
      motivacao = '💪 Metade do caminho feito! Vamos acelerar esta semana!';
    } else if (pctMeta >= 30) {
      motivacao = '⚡ Ainda há tempo! Foco nas oportunidades em negociação!';
    } else {
      motivacao = '🚀 Toda jornada começa com o primeiro passo! Vamos conquistar essa meta juntos!';
    }

    // Montar email
    const emailBody = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #0F2A44 0%, #1F4E79 100%); color: white; padding: 30px; text-align: center; border-radius: 12px 12px 0 0;">
          <h1 style="margin: 0; font-size: 28px;">📊 Relatório Semanal</h1>
          <p style="margin: 10px 0 0 0; opacity: 0.9;">Resumo da sua performance</p>
        </div>

        <div style="background: white; padding: 30px; border: 1px solid #e2e8f0;">
          <h2 style="color: #0F2A44; margin-top: 0;">Olá, ${user.full_name}!</h2>
          
          <div style="background: #f8fafc; border-left: 4px solid #1DB954; padding: 15px; margin: 20px 0; border-radius: 4px;">
            <p style="margin: 0; font-size: 16px; color: #1e293b; font-weight: 600;">${motivacao}</p>
          </div>

          <h3 style="color: #0F2A44; border-bottom: 2px solid #e2e8f0; padding-bottom: 10px;">📈 Negócios da Semana</h3>
          
          <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
            <tr style="background: #f1f5f9;">
              <td style="padding: 12px; border: 1px solid #e2e8f0;"><strong>Status</strong></td>
              <td style="padding: 12px; border: 1px solid #e2e8f0; text-align: center;"><strong>Quantidade</strong></td>
              <td style="padding: 12px; border: 1px solid #e2e8f0; text-align: center;"><strong>%</strong></td>
            </tr>
            <tr>
              <td style="padding: 12px; border: 1px solid #e2e8f0;">✅ Ganhos</td>
              <td style="padding: 12px; border: 1px solid #e2e8f0; text-align: center; color: #10b981; font-weight: bold;">${ganhos}</td>
              <td style="padding: 12px; border: 1px solid #e2e8f0; text-align: center; color: #10b981; font-weight: bold;">${pctGanhos}%</td>
            </tr>
            <tr style="background: #fefce8;">
              <td style="padding: 12px; border: 1px solid #e2e8f0;">⏳ Em Negociação</td>
              <td style="padding: 12px; border: 1px solid #e2e8f0; text-align: center; color: #f59e0b; font-weight: bold;">${emNegociacao}</td>
              <td style="padding: 12px; border: 1px solid #e2e8f0; text-align: center; color: #f59e0b; font-weight: bold;">${pctNegociacao}%</td>
            </tr>
            <tr>
              <td style="padding: 12px; border: 1px solid #e2e8f0;">❌ Perdidos</td>
              <td style="padding: 12px; border: 1px solid #e2e8f0; text-align: center; color: #ef4444; font-weight: bold;">${perdidos}</td>
              <td style="padding: 12px; border: 1px solid #e2e8f0; text-align: center; color: #ef4444; font-weight: bold;">${pctPerdidos}%</td>
            </tr>
            <tr style="background: #f8fafc; font-weight: bold;">
              <td style="padding: 12px; border: 1px solid #e2e8f0;">Total</td>
              <td style="padding: 12px; border: 1px solid #e2e8f0; text-align: center;">${total}</td>
              <td style="padding: 12px; border: 1px solid #e2e8f0; text-align: center;">100%</td>
            </tr>
          </table>

          <h3 style="color: #0F2A44; border-bottom: 2px solid #e2e8f0; padding-bottom: 10px; margin-top: 30px;">🎯 Progresso da Meta</h3>
          
          <div style="margin: 20px 0;">
            <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
              <span style="font-weight: 600;">Faturamento do Mês</span>
              <span style="font-weight: 600; color: #10b981;">R$ ${faturamento.toLocaleString('pt-BR')}</span>
            </div>
            <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
              <span>Meta do Mês</span>
              <span>R$ ${meta.toLocaleString('pt-BR')}</span>
            </div>
            <div style="background: #e2e8f0; height: 24px; border-radius: 12px; overflow: hidden; margin: 15px 0;">
              <div style="background: linear-gradient(90deg, #10b981 0%, #1DB954 100%); height: 100%; width: ${Math.min(pctMeta, 100)}%; display: flex; align-items: center; justify-content: center; color: white; font-weight: bold; font-size: 12px;">
                ${pctMeta}%
              </div>
            </div>
          </div>

          <div style="background: #f0fdf4; border: 1px solid #86efac; padding: 15px; border-radius: 8px; margin-top: 20px; text-align: center;">
            <p style="margin: 0; color: #166534; font-size: 18px; font-weight: bold;">
              Você está ${pctMeta >= 100 ? 'acima' : 'a ' + (100 - pctMeta).toFixed(0) + '%'} da meta! 🚀
            </p>
          </div>
        </div>

        <div style="background: #f8fafc; padding: 20px; text-align: center; border-radius: 0 0 12px 12px; border: 1px solid #e2e8f0; border-top: none;">
          <p style="margin: 0; color: #64748b; font-size: 14px;">
            SalesMind - Seu assistente de vendas inteligente
          </p>
        </div>
      </div>
    `;

    // Enviar email
    await base44.integrations.Core.SendEmail({
      to: user.email,
      subject: `📊 Relatório Semanal - ${pctGanhos}% de conversão esta semana`,
      body: emailBody
    });

    return {
      success: true,
      message: 'Relatório enviado com sucesso',
      stats: { ganhos, emNegociacao, perdidos, pctMeta }
    };
  } catch (error) {
    console.error('Erro ao enviar relatório:', error);
    return {
      success: false,
      error: error.message
    };
  }
}