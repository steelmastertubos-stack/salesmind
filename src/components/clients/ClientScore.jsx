import React from 'react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

export default function ClientScore({ client, orders }) {
  const calculateScore = () => {
    let score = 50; // Base score
    const today = new Date();

    // 1. Ciclo de compra (max +30 / -30)
    if (client.last_purchase_date && client.average_purchase_cycle) {
      const daysSince = Math.floor((today - new Date(client.last_purchase_date)) / (1000 * 60 * 60 * 24));
      const cycle = client.average_purchase_cycle;
      
      if (daysSince > cycle + 7) {
        score += 30; // Muito atrasado - alta prioridade
      } else if (daysSince >= cycle - 3) {
        score += 20; // Próximo do ciclo
      } else if (daysSince < cycle * 0.5) {
        score -= 10; // Comprou recentemente
      }
    }

    // 2. Valor médio (max +20)
    if (client.average_ticket) {
      if (client.average_ticket > 50000) score += 20;
      else if (client.average_ticket > 20000) score += 15;
      else if (client.average_ticket > 10000) score += 10;
      else if (client.average_ticket > 5000) score += 5;
    }

    // 3. Frequência de compra (max +15)
    if (client.purchase_count) {
      if (client.purchase_count > 10) score += 15;
      else if (client.purchase_count > 5) score += 10;
      else if (client.purchase_count > 2) score += 5;
    }

    // 4. Tempo sem contato (max +15 / -10)
    if (client.last_contact_date) {
      const daysSinceContact = Math.floor((today - new Date(client.last_contact_date)) / (1000 * 60 * 60 * 24));
      if (daysSinceContact > 30) score += 15;
      else if (daysSinceContact > 15) score += 10;
      else if (daysSinceContact < 3) score -= 10;
    } else {
      score += 10; // Nunca contatado
    }

    // 5. Status do cliente (max +10 / -20)
    if (client.status === 'at_risk') score += 10;
    else if (client.status === 'inactive') score += 5;
    else if (client.status === 'attention') score += 5;

    // 6. Cross-sell disponível (max +10)
    if (orders.length > 0 && client.last_purchase_product) {
      score += 10;
    }

    return Math.min(Math.max(score, 0), 100);
  };

  const score = calculateScore();

  const getScoreConfig = (score) => {
    if (score >= 80) {
      return {
        color: 'text-red-600 bg-red-100',
        label: 'Prioridade Máxima',
        icon: TrendingUp,
        borderColor: 'border-red-300'
      };
    } else if (score >= 60) {
      return {
        color: 'text-orange-600 bg-orange-100',
        label: 'Alta Prioridade',
        icon: TrendingUp,
        borderColor: 'border-orange-300'
      };
    } else if (score >= 40) {
      return {
        color: 'text-amber-600 bg-amber-100',
        label: 'Média Prioridade',
        icon: Minus,
        borderColor: 'border-amber-300'
      };
    } else {
      return {
        color: 'text-slate-600 bg-slate-100',
        label: 'Baixa Prioridade',
        icon: TrendingDown,
        borderColor: 'border-slate-300'
      };
    }
  };

  const config = getScoreConfig(score);
  const Icon = config.icon;

  return (
    <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border-2 ${config.borderColor} ${config.color}`}>
      <Icon className="w-4 h-4" />
      <span className="text-sm font-semibold">{score}</span>
      <span className="text-xs">{config.label}</span>
    </div>
  );
}

export function calculateClientScore(client, orders) {
  let score = 50;
  const today = new Date();

  if (client.last_purchase_date && client.average_purchase_cycle) {
    const daysSince = Math.floor((today - new Date(client.last_purchase_date)) / (1000 * 60 * 60 * 24));
    const cycle = client.average_purchase_cycle;
    
    if (daysSince > cycle + 7) score += 30;
    else if (daysSince >= cycle - 3) score += 20;
    else if (daysSince < cycle * 0.5) score -= 10;
  }

  if (client.average_ticket) {
    if (client.average_ticket > 50000) score += 20;
    else if (client.average_ticket > 20000) score += 15;
    else if (client.average_ticket > 10000) score += 10;
    else if (client.average_ticket > 5000) score += 5;
  }

  if (client.purchase_count) {
    if (client.purchase_count > 10) score += 15;
    else if (client.purchase_count > 5) score += 10;
    else if (client.purchase_count > 2) score += 5;
  }

  if (client.last_contact_date) {
    const daysSinceContact = Math.floor((today - new Date(client.last_contact_date)) / (1000 * 60 * 60 * 24));
    if (daysSinceContact > 30) score += 15;
    else if (daysSinceContact > 15) score += 10;
    else if (daysSinceContact < 3) score -= 10;
  } else {
    score += 10;
  }

  if (client.status === 'at_risk') score += 10;
  else if (client.status === 'inactive') score += 5;
  else if (client.status === 'attention') score += 5;

  if (orders.length > 0 && client.last_purchase_product) score += 10;

  return Math.min(Math.max(score, 0), 100);
}