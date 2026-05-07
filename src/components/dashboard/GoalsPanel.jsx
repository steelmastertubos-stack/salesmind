import React, { useState, useEffect } from 'react';
import { Target, TrendingUp, Clock, XCircle, CheckCircle, Edit2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

export default function GoalsPanel({ orders = [], quotes = [], opportunities = [], selectedMonth, selectedYear, periodType = 'month' }) {
  const [showEditGoal, setShowEditGoal] = useState(false);
  const [newGoalValue, setNewGoalValue] = useState('');
  const queryClient = useQueryClient();

  const now = new Date();
  // Use selected period or fall back to current month
  const currentMonth = selectedMonth !== undefined ? selectedMonth + 1 : now.getMonth() + 1; // 1-12
  const currentYear = selectedYear !== undefined ? selectedYear : now.getFullYear();

  // Buscar meta do período
  const { data: currentGoalData } = useQuery({
    queryKey: ['monthlyGoal', currentYear, currentMonth, periodType],
    queryFn: async () => {
      const goals = await base44.entities.MonthlyGoal.filter({ 
        year: currentYear, 
        month: currentMonth 
      }, '', 1);
      return goals[0] || null;
    }
  });

  const updateGoalMutation = useMutation({
    mutationFn: async (goalValue) => {
      if (currentGoalData) {
        return base44.entities.MonthlyGoal.update(currentGoalData.id, { goal_value: goalValue });
      } else {
        return base44.entities.MonthlyGoal.create({
          year: currentYear,
          month: currentMonth,
          goal_value: goalValue,
          achieved_value: 0,
          is_achieved: false
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['monthlyGoal']);
      toast.success('Meta atualizada!');
      setShowEditGoal(false);
    }
  });

  const checkAndCreateNextGoalMutation = useMutation({
    mutationFn: async ({ achievedValue }) => {
      // Marcar meta atual como atingida
      await base44.entities.MonthlyGoal.update(currentGoalData.id, {
        is_achieved: true,
        achieved_value: achievedValue,
        achieved_date: new Date().toISOString().split('T')[0]
      });

      // Calcular próxima meta (10% acima do valor atingido)
      const nextGoalValue = Math.round(achievedValue * 1.1);
      
      // Criar meta do próximo mês
      const nextMonth = currentMonth === 12 ? 1 : currentMonth + 1;
      const nextYear = currentMonth === 12 ? currentYear + 1 : currentYear;

      const existingNextGoal = await base44.entities.MonthlyGoal.filter({
        year: nextYear,
        month: nextMonth
      }, '', 1);

      if (existingNextGoal.length === 0) {
        await base44.entities.MonthlyGoal.create({
          year: nextYear,
          month: nextMonth,
          goal_value: nextGoalValue,
          achieved_value: 0,
          is_achieved: false
        });
        toast.success(`🎉 Meta batida! Próxima meta criada: ${formatCurrency(nextGoalValue)}`);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['monthlyGoal']);
    }
  });

  const inPeriod = (dateStr) => {
    if (!dateStr) return false;
    const d = new Date(dateStr);
    if (periodType === 'year') return d.getFullYear() === currentYear;
    if (periodType === 'quarter') {
      const selectedQ = Math.floor((currentMonth - 1) / 3);
      const dq = Math.floor(d.getMonth() / 3);
      return d.getFullYear() === currentYear && dq === selectedQ;
    }
    return d.getMonth() + 1 === currentMonth && d.getFullYear() === currentYear;
  };

  const thisMonthOrders = orders.filter(o => inPeriod(o.created_date) && o.status !== 'cancelled');
  const thisMonthOpportunities = opportunities.filter(opp => inPeriod(opp.created_date));

  // Valores - usar oportunidades do CRM
  const sold = thisMonthOrders.reduce((sum, o) => sum + (o.total_value || 0), 0);
  const negotiating = thisMonthOpportunities
    .filter(opp => opp.stage === 'em_negociacao')
    .reduce((sum, opp) => sum + (opp.total_value || 0), 0);
  const lost = thisMonthOpportunities
    .filter(opp => opp.stage === 'perdido')
    .reduce((sum, opp) => sum + (opp.total_value || 0), 0);

  // Meta do mês atual
  const goal = currentGoalData?.goal_value || 100000;
  
  const soldPercent = (sold / goal) * 100;
  const negotiatingPercent = (negotiating / goal) * 100;
  const lostPercent = (lost / goal) * 100;

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value || 0);
  };

  const formatPercent = (value) => {
    return `${value.toFixed(1)}%`;
  };

  // Verificar se meta foi batida e criar próxima meta
  useEffect(() => {
    if (currentGoalData && !currentGoalData.is_achieved && sold >= goal) {
      checkAndCreateNextGoalMutation.mutate({ achievedValue: sold });
    }
  }, [sold, goal, currentGoalData]);

  return (
    <Card className="border-2 border-emerald-200 bg-gradient-to-br from-emerald-50 to-green-50 shadow-lg">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-emerald-600 rounded-xl flex items-center justify-center shrink-0">
              <Target className="w-5 h-5 text-white" />
            </div>
            <div>
              <CardTitle className="text-emerald-900">
                {periodType === 'year' ? 'Meta do Ano' : periodType === 'quarter' ? 'Meta do Trimestre' : 'Meta do Mês'}
              </CardTitle>
              <p className="text-xs text-emerald-700">
                {periodType === 'year'
                  ? `Ano ${currentYear}`
                  : periodType === 'quarter'
                    ? `T${Math.ceil(currentMonth / 3)} ${currentYear}`
                    : new Date(currentYear, currentMonth - 1).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}
              </p>
            </div>
          </div>
          <div className="bg-white rounded-xl px-4 py-2 shadow-sm border-2 border-emerald-200 min-w-[140px] relative group">
            <Button
              variant="ghost"
              size="icon"
              className="absolute -top-2 -right-2 h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity bg-white shadow-md"
              onClick={() => {
                setNewGoalValue(goal.toString());
                setShowEditGoal(true);
              }}
            >
              <Edit2 className="w-3 h-3" />
            </Button>
            <p className="text-xs text-slate-500 mb-0.5">Meta</p>
            <p className="text-lg font-bold text-emerald-900">{formatCurrency(goal)}</p>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-2xl font-bold text-emerald-600">{formatPercent(soldPercent)}</span>
              <span className="text-xs text-slate-500">atingido</span>
            </div>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Vendido */}
        <div className="bg-white rounded-xl p-4 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-emerald-600" />
              <span className="font-semibold text-slate-900">Vendido</span>
            </div>
            <div className="text-right">
              <p className="text-xl font-bold text-emerald-600">{formatCurrency(sold)}</p>
              <p className="text-sm font-semibold text-emerald-700">{formatPercent(soldPercent)}</p>
            </div>
          </div>
          <Progress value={soldPercent} className="h-3 bg-emerald-100">
            <div className="h-full bg-gradient-to-r from-emerald-500 to-emerald-600 rounded-full transition-all" />
          </Progress>
          <p className="text-xs text-slate-500 mt-1">{thisMonthOrders.length} pedidos fechados</p>
        </div>

        {/* Em Negociação */}
        <div className="bg-white rounded-xl p-4 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-blue-600" />
              <span className="font-semibold text-slate-900">Em Negociação</span>
            </div>
            <div className="text-right">
              <p className="text-xl font-bold text-blue-600">{formatCurrency(negotiating)}</p>
              <p className="text-sm font-semibold text-blue-700">{formatPercent(negotiatingPercent)}</p>
            </div>
          </div>
          <Progress value={negotiatingPercent} className="h-3 bg-blue-100">
            <div className="h-full bg-gradient-to-r from-blue-500 to-blue-600 rounded-full transition-all" />
          </Progress>
          <p className="text-xs text-slate-500 mt-1">
            {thisMonthOpportunities.filter(opp => opp.stage === 'em_negociacao').length} oportunidades ativas
          </p>
        </div>

        {/* Perdidos */}
        <div className="bg-white rounded-xl p-4 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <XCircle className="w-5 h-5 text-red-600" />
              <span className="font-semibold text-slate-900">Perdidos</span>
            </div>
            <div className="text-right">
              <p className="text-xl font-bold text-red-600">{formatCurrency(lost)}</p>
              <p className="text-sm font-semibold text-red-700">{formatPercent(lostPercent)}</p>
            </div>
          </div>
          <Progress value={lostPercent} className="h-3 bg-red-100">
            <div className="h-full bg-gradient-to-r from-red-500 to-red-600 rounded-full transition-all" />
          </Progress>
          <p className="text-xs text-slate-500 mt-1">
            {thisMonthOpportunities.filter(opp => opp.stage === 'perdido').length} oportunidades perdidas
          </p>
        </div>

        {/* Resumo */}
        <div className="bg-gradient-to-r from-slate-800 to-slate-900 rounded-xl p-4 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-slate-300 mb-1">Falta para a Meta</p>
              <p className="text-2xl font-bold">
                {formatCurrency(Math.max(0, goal - sold))}
              </p>
            </div>
            <div className="text-right">
              <div className={`text-3xl font-bold ${soldPercent >= 100 ? 'text-emerald-400' : 'text-white'}`}>
                {formatPercent(soldPercent)}
              </div>
              <p className="text-xs text-slate-300">
                {soldPercent >= 100 ? '🎉 Meta batida!' : 'da meta'}
              </p>
            </div>
          </div>
        </div>
      </CardContent>

      {/* Edit Goal Dialog */}
      <Dialog open={showEditGoal} onOpenChange={setShowEditGoal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Meta do Mês</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Novo valor da meta</label>
              <Input
                type="number"
                value={newGoalValue}
                onChange={(e) => setNewGoalValue(e.target.value)}
                placeholder="100000"
              />
            </div>
            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => setShowEditGoal(false)}>
                Cancelar
              </Button>
              <Button 
                className="bg-[#0F2A44] hover:bg-[#1F4E79]"
                onClick={() => {
                  const value = parseFloat(newGoalValue);
                  if (value > 0) {
                    updateGoalMutation.mutate(value);
                  }
                }}
              >
                Salvar Meta
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  );
}