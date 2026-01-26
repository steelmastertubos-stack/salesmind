import React, { useMemo } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Trophy, Target, TrendingUp, Award, Zap, Users, Crown, Medal, Star, Flame } from 'lucide-react';
import PageHeader from '@/components/common/PageHeader';
import { Progress } from '@/components/ui/progress';

export default function Gamification() {
  const { data: orders = [] } = useQuery({
    queryKey: ['orders'],
    queryFn: () => base44.entities.Order.list('-created_date', 1000)
  });

  const { data: opportunities = [] } = useQuery({
    queryKey: ['opportunities'],
    queryFn: () => base44.entities.Opportunity.list('-created_date', 1000)
  });

  const { data: quotes = [] } = useQuery({
    queryKey: ['quotes'],
    queryFn: () => base44.entities.Quote.list('-created_date', 1000)
  });

  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();

  // Calculate leaderboard data
  const leaderboardData = useMemo(() => {
    const userStats = {};

    // Process orders
    orders.forEach(order => {
      const orderDate = new Date(order.created_date);
      if (orderDate.getMonth() === currentMonth && orderDate.getFullYear() === currentYear) {
        const user = order.created_by || 'Sistema';
        if (!userStats[user]) {
          userStats[user] = {
            name: user,
            revenue: 0,
            deals: 0,
            quotes: 0,
            won: 0,
            conversionRate: 0,
            avgTicket: 0
          };
        }
        userStats[user].revenue += order.total_value || 0;
        userStats[user].deals += 1;
      }
    });

    // Process opportunities
    opportunities.forEach(opp => {
      const oppDate = new Date(opp.created_date);
      if (oppDate.getMonth() === currentMonth && oppDate.getFullYear() === currentYear) {
        const user = opp.created_by || 'Sistema';
        if (!userStats[user]) {
          userStats[user] = {
            name: user,
            revenue: 0,
            deals: 0,
            quotes: 0,
            won: 0,
            conversionRate: 0,
            avgTicket: 0
          };
        }
        userStats[user].quotes += 1;
        if (opp.stage === 'ganho') userStats[user].won += 1;
      }
    });

    // Calculate metrics
    Object.values(userStats).forEach(stat => {
      stat.conversionRate = stat.quotes > 0 ? (stat.won / stat.quotes) * 100 : 0;
      stat.avgTicket = stat.deals > 0 ? stat.revenue / stat.deals : 0;
    });

    return Object.values(userStats);
  }, [orders, opportunities, currentMonth, currentYear]);

  const revenueLeaderboard = [...leaderboardData].sort((a, b) => b.revenue - a.revenue);
  const dealsLeaderboard = [...leaderboardData].sort((a, b) => b.deals - a.deals);
  const conversionLeaderboard = [...leaderboardData].sort((a, b) => b.conversionRate - a.conversionRate);

  // Badge system
  const calculateBadges = (user) => {
    const badges = [];
    
    if (user.revenue >= 1000000) badges.push({ icon: Crown, label: 'Million Maker', color: 'text-yellow-500' });
    else if (user.revenue >= 500000) badges.push({ icon: Trophy, label: 'Top Seller', color: 'text-orange-500' });
    else if (user.revenue >= 200000) badges.push({ icon: Medal, label: 'Rising Star', color: 'text-blue-500' });
    
    if (user.deals >= 50) badges.push({ icon: Flame, label: 'Deal Machine', color: 'text-red-500' });
    else if (user.deals >= 30) badges.push({ icon: Zap, label: 'Deal Maker', color: 'text-purple-500' });
    
    if (user.conversionRate >= 70) badges.push({ icon: Target, label: 'Sniper', color: 'text-green-500' });
    else if (user.conversionRate >= 50) badges.push({ icon: Star, label: 'Closer', color: 'text-emerald-500' });
    
    return badges;
  };

  // Team challenges
  const teamChallenge = useMemo(() => {
    const totalRevenue = leaderboardData.reduce((sum, u) => sum + u.revenue, 0);
    const totalDeals = leaderboardData.reduce((sum, u) => sum + u.deals, 0);
    const target = 5000000; // R$ 5M target
    const dealsTarget = 200;

    return {
      revenueProgress: (totalRevenue / target) * 100,
      dealsProgress: (totalDeals / dealsTarget) * 100,
      totalRevenue,
      totalDeals,
      target,
      dealsTarget
    };
  }, [leaderboardData]);

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value || 0);
  };

  const getRankIcon = (index) => {
    if (index === 0) return <Crown className="w-6 h-6 text-yellow-500" />;
    if (index === 1) return <Medal className="w-6 h-6 text-slate-400" />;
    if (index === 2) return <Medal className="w-6 h-6 text-amber-700" />;
    return <div className="w-6 h-6 flex items-center justify-center text-slate-400 font-bold">{index + 1}</div>;
  };

  return (
    <div className="pb-20 lg:pb-6 space-y-6">
      <PageHeader 
        title="🏆 Ranking de Performance" 
        subtitle="Competição amigável para motivar a equipe"
      />

      {/* Team Challenge */}
      <Card className="bg-gradient-to-r from-purple-600 to-blue-600 text-white">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Users className="w-6 h-6" />
            <CardTitle>Desafio da Equipe - {new Date().toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">Meta de Faturamento</span>
              <span className="text-lg font-bold">{formatCurrency(teamChallenge.totalRevenue)} / {formatCurrency(teamChallenge.target)}</span>
            </div>
            <Progress value={teamChallenge.revenueProgress} className="h-3 bg-white/20" />
            <p className="text-xs mt-1 text-white/80">{teamChallenge.revenueProgress.toFixed(0)}% concluído</p>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">Meta de Negócios Fechados</span>
              <span className="text-lg font-bold">{teamChallenge.totalDeals} / {teamChallenge.dealsTarget}</span>
            </div>
            <Progress value={teamChallenge.dealsProgress} className="h-3 bg-white/20" />
            <p className="text-xs mt-1 text-white/80">{teamChallenge.dealsProgress.toFixed(0)}% concluído</p>
          </div>

          {teamChallenge.revenueProgress >= 100 && teamChallenge.dealsProgress >= 100 && (
            <div className="mt-4 p-3 bg-white/20 rounded-lg text-center">
              <p className="font-bold">🎉 DESAFIO CONCLUÍDO! Time está arrasando!</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Leaderboards */}
      <Tabs defaultValue="revenue" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="revenue">💰 Faturamento</TabsTrigger>
          <TabsTrigger value="deals">📦 Negócios</TabsTrigger>
          <TabsTrigger value="conversion">🎯 Conversão</TabsTrigger>
        </TabsList>

        {/* Revenue Leaderboard */}
        <TabsContent value="revenue" className="space-y-4">
          {revenueLeaderboard.map((user, index) => {
            const badges = calculateBadges(user);
            return (
              <Card key={user.name} className={index === 0 ? 'border-yellow-400 border-2' : ''}>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-4">
                    <div className="flex-shrink-0">
                      {getRankIcon(index)}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-bold text-lg truncate">{user.name}</h3>
                        {badges.map((badge, idx) => (
                          <badge.icon key={idx} className={`w-5 h-5 ${badge.color}`} title={badge.label} />
                        ))}
                      </div>
                      
                      <div className="grid grid-cols-3 gap-4 mt-2">
                        <div>
                          <p className="text-xs text-slate-500">Faturamento</p>
                          <p className="text-xl font-bold text-emerald-600">{formatCurrency(user.revenue)}</p>
                        </div>
                        <div>
                          <p className="text-xs text-slate-500">Negócios</p>
                          <p className="text-xl font-bold text-blue-600">{user.deals}</p>
                        </div>
                        <div>
                          <p className="text-xs text-slate-500">Ticket Médio</p>
                          <p className="text-xl font-bold text-purple-600">{formatCurrency(user.avgTicket)}</p>
                        </div>
                      </div>
                    </div>

                    {index === 0 && (
                      <Badge className="bg-yellow-500 text-white">
                        <Trophy className="w-4 h-4 mr-1" />
                        Líder
                      </Badge>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </TabsContent>

        {/* Deals Leaderboard */}
        <TabsContent value="deals" className="space-y-4">
          {dealsLeaderboard.map((user, index) => {
            const badges = calculateBadges(user);
            return (
              <Card key={user.name} className={index === 0 ? 'border-blue-400 border-2' : ''}>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-4">
                    <div className="flex-shrink-0">
                      {getRankIcon(index)}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-bold text-lg truncate">{user.name}</h3>
                        {badges.map((badge, idx) => (
                          <badge.icon key={idx} className={`w-5 h-5 ${badge.color}`} title={badge.label} />
                        ))}
                      </div>
                      
                      <div className="grid grid-cols-3 gap-4 mt-2">
                        <div>
                          <p className="text-xs text-slate-500">Negócios Fechados</p>
                          <p className="text-xl font-bold text-blue-600">{user.deals}</p>
                        </div>
                        <div>
                          <p className="text-xs text-slate-500">Faturamento</p>
                          <p className="text-xl font-bold text-emerald-600">{formatCurrency(user.revenue)}</p>
                        </div>
                        <div>
                          <p className="text-xs text-slate-500">Conversão</p>
                          <p className="text-xl font-bold text-purple-600">{user.conversionRate.toFixed(1)}%</p>
                        </div>
                      </div>
                    </div>

                    {index === 0 && (
                      <Badge className="bg-blue-500 text-white">
                        <Flame className="w-4 h-4 mr-1" />
                        Deal King
                      </Badge>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </TabsContent>

        {/* Conversion Leaderboard */}
        <TabsContent value="conversion" className="space-y-4">
          {conversionLeaderboard.map((user, index) => {
            const badges = calculateBadges(user);
            return (
              <Card key={user.name} className={index === 0 ? 'border-green-400 border-2' : ''}>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-4">
                    <div className="flex-shrink-0">
                      {getRankIcon(index)}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-bold text-lg truncate">{user.name}</h3>
                        {badges.map((badge, idx) => (
                          <badge.icon key={idx} className={`w-5 h-5 ${badge.color}`} title={badge.label} />
                        ))}
                      </div>
                      
                      <div className="grid grid-cols-3 gap-4 mt-2">
                        <div>
                          <p className="text-xs text-slate-500">Taxa de Conversão</p>
                          <p className="text-xl font-bold text-green-600">{user.conversionRate.toFixed(1)}%</p>
                        </div>
                        <div>
                          <p className="text-xs text-slate-500">Ganhos / Propostas</p>
                          <p className="text-xl font-bold text-blue-600">{user.won} / {user.quotes}</p>
                        </div>
                        <div>
                          <p className="text-xs text-slate-500">Negócios</p>
                          <p className="text-xl font-bold text-purple-600">{user.deals}</p>
                        </div>
                      </div>
                    </div>

                    {index === 0 && (
                      <Badge className="bg-green-500 text-white">
                        <Target className="w-4 h-4 mr-1" />
                        Sniper
                      </Badge>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </TabsContent>
      </Tabs>

      {/* Badges Legend */}
      <Card>
        <CardHeader>
          <CardTitle>🏅 Sistema de Conquistas</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="flex items-center gap-2">
              <Crown className="w-5 h-5 text-yellow-500" />
              <div>
                <p className="font-semibold text-sm">Million Maker</p>
                <p className="text-xs text-slate-500">R$ 1M+ em vendas</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Trophy className="w-5 h-5 text-orange-500" />
              <div>
                <p className="font-semibold text-sm">Top Seller</p>
                <p className="text-xs text-slate-500">R$ 500K+ em vendas</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Medal className="w-5 h-5 text-blue-500" />
              <div>
                <p className="font-semibold text-sm">Rising Star</p>
                <p className="text-xs text-slate-500">R$ 200K+ em vendas</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Flame className="w-5 h-5 text-red-500" />
              <div>
                <p className="font-semibold text-sm">Deal Machine</p>
                <p className="text-xs text-slate-500">50+ negócios fechados</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Zap className="w-5 h-5 text-purple-500" />
              <div>
                <p className="font-semibold text-sm">Deal Maker</p>
                <p className="text-xs text-slate-500">30+ negócios fechados</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Target className="w-5 h-5 text-green-500" />
              <div>
                <p className="font-semibold text-sm">Sniper</p>
                <p className="text-xs text-slate-500">70%+ conversão</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Star className="w-5 h-5 text-emerald-500" />
              <div>
                <p className="font-semibold text-sm">Closer</p>
                <p className="text-xs text-slate-500">50%+ conversão</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}