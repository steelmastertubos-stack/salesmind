/**
 * Configuração centralizada de auditorias
 * Define todas as regras, validações e auto-correções
 */

export const AUDIT_RULES = {
  OPPORTUNITIES: {
    WON_WITHOUT_ORDER: {
      id: 'OPP-001',
      severity: 'CRITICAL',
      description: 'Oportunidade com status "ganho" sem pedido vinculado',
      autoFix: true,
      action: 'Criar Order automaticamente'
    },
    LOST_WITH_ACTIVE_TASKS: {
      id: 'OPP-002',
      severity: 'HIGH',
      description: 'Oportunidade "perdida" com tarefas ativas',
      autoFix: true,
      action: 'Encerrar/cancelar tarefas'
    },
    MISSING_CLIENT: {
      id: 'OPP-003',
      severity: 'CRITICAL',
      description: 'Oportunidade sem cliente vinculado',
      autoFix: false,
      action: 'Requer correção manual'
    },
    STALE_NEGOTIATION: {
      id: 'OPP-004',
      severity: 'HIGH',
      description: 'Negociação sem movimento há > 15 dias',
      autoFix: true,
      action: 'Criar tarefa follow-up'
    }
  },

  QUOTES: {
    APPROVED_NO_OPPORTUNITY: {
      id: 'QT-001',
      severity: 'HIGH',
      description: 'Orçamento aprovado sem oportunidade',
      autoFix: true,
      action: 'Criar oportunidade'
    },
    INVALID_CLIENT: {
      id: 'QT-002',
      severity: 'CRITICAL',
      description: 'Orçamento vinculado a cliente inexistente',
      autoFix: false,
      action: 'Requer correção manual'
    },
    ORPHANED: {
      id: 'QT-003',
      severity: 'MEDIUM',
      description: 'Orçamento não convertido após 30 dias',
      autoFix: true,
      action: 'Marcar como cancelado e criar follow-up'
    }
  },

  ORDERS: {
    MISSING_CLIENT: {
      id: 'ORD-001',
      severity: 'CRITICAL',
      description: 'Pedido sem cliente vinculado',
      autoFix: false,
      action: 'Requer correção manual'
    },
    NO_OPPORTUNITY: {
      id: 'ORD-002',
      severity: 'MEDIUM',
      description: 'Pedido sem oportunidade vinculada',
      autoFix: true,
      action: 'Vincular se possível'
    },
    NO_ITEMS: {
      id: 'ORD-003',
      severity: 'HIGH',
      description: 'Pedido sem itens',
      autoFix: false,
      action: 'Marcar como inválido'
    },
    NO_COMMISSION: {
      id: 'ORD-004',
      severity: 'MEDIUM',
      description: 'Pedido faturado sem comissão',
      autoFix: true,
      action: 'Criar comissão com regra padrão'
    }
  },

  COMMISSIONS: {
    DUPLICATE: {
      id: 'COM-001',
      severity: 'MEDIUM',
      description: 'Comissão duplicada no mesmo pedido',
      autoFix: true,
      action: 'Deduplicar mantendo maior valor'
    },
    INVALID_VALUE: {
      id: 'COM-002',
      severity: 'MEDIUM',
      description: 'Comissão com valores inconsistentes',
      autoFix: true,
      action: 'Recalcular baseado em regra do representado'
    },
    ORPHANED: {
      id: 'COM-003',
      severity: 'HIGH',
      description: 'Comissão vinculada a pedido inexistente',
      autoFix: false,
      action: 'Marcar para revisão'
    }
  },

  STOCK: {
    NEGATIVE_BALANCE: {
      id: 'STK-001',
      severity: 'MEDIUM',
      description: 'Produto com saldo negativo',
      autoFix: true,
      action: 'Ajustar para 0 e registrar log'
    },
    BELOW_MINIMUM: {
      id: 'STK-002',
      severity: 'MEDIUM',
      description: 'Estoque abaixo do mínimo sem tarefa',
      autoFix: true,
      action: 'Criar tarefa de reposição'
    }
  },

  CLIENTS: {
    PREMIUM_NOT_ACTIVE: {
      id: 'CLI-001',
      severity: 'HIGH',
      description: 'Cliente Premium com status não-ativo',
      autoFix: true,
      action: 'Remover flag Premium'
    },
    STATUS_CONFLICT: {
      id: 'CLI-002',
      severity: 'HIGH',
      description: 'Cliente com múltiplos status operacionais',
      autoFix: true,
      action: 'Definir status único correto'
    },
    STALE_CONTACT: {
      id: 'CLI-003',
      severity: 'MEDIUM',
      description: 'Cliente sem contato há > ciclo médio × 1,3',
      autoFix: true,
      action: 'Marcar como "Em risco" + criar tarefa'
    },
    INACTIVE_THRESHOLD: {
      id: 'CLI-004',
      severity: 'MEDIUM',
      description: 'Cliente sem compra há > 90 dias',
      autoFix: true,
      action: 'Marcar como "Inativo" + criar tarefa'
    }
  },

  DATA_CONSISTENCY: {
    YEAR_FILTER_MISMATCH: {
      id: 'DC-001',
      severity: 'MEDIUM',
      description: 'Filtro de ano retorna dados inconsistentes',
      autoFix: false,
      action: 'Validar dados e corrigir filtro'
    },
    KPI_ZERO_WITH_DATA: {
      id: 'DC-002',
      severity: 'MEDIUM',
      description: 'KPI mostra 0 mas existem dados',
      autoFix: false,
      action: 'Revisar cálculo do KPI'
    }
  }
};

export const AUDIT_PRIORITIES = {
  CRITICAL: 1,
  HIGH: 2,
  MEDIUM: 3,
  LOW: 4
};

export const STAGE_FOLLOWUP_RULES = {
  'proposta_enviada': { days: 3, type: 'whatsapp', priority: 'high' },
  'em_negociacao': { days: 2, type: 'call', priority: 'high' },
  'ganho': { days: 1, type: 'email', priority: 'medium' },
  'perdido': { days: 0, type: null, priority: null } // sem follow-up
};

export const CLIENT_STATUS_RULES = {
  AT_RISK_THRESHOLD: 1.3, // 130% do ciclo médio
  INACTIVE_DAYS: 90,
  PREMIUM_MIN_REVENUE: 100000,
  PREMIUM_MIN_PURCHASES: 2
};