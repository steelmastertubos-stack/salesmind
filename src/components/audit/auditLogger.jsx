/**
 * Sistema de logging para auditorias
 * Registra todas as ações, correções e problemas encontrados
 */

class AuditLogger {
  constructor() {
    this.logs = [];
    this.startTime = null;
    this.endTime = null;
  }

  start(auditType) {
    this.logs = [];
    this.startTime = new Date();
    this.log('INIT', `Iniciando auditoria: ${auditType}`, 'INFO');
  }

  end() {
    this.endTime = new Date();
    const duration = (this.endTime - this.startTime) / 1000;
    this.log('END', `Auditoria finalizada em ${duration}s`, 'INFO');
  }

  log(code, message, severity = 'INFO', data = null) {
    const entry = {
      timestamp: new Date().toISOString(),
      code,
      message,
      severity,
      data
    };
    this.logs.push(entry);
    console.log(`[${code}] ${message}`, data || '');
  }

  // Registrar problemas encontrados
  addIssue(ruleId, entityType, entityId, message, severity = 'MEDIUM', autoFixed = false) {
    this.log(ruleId, `[${entityType}#${entityId}] ${message}`, severity, {
      entityType,
      entityId,
      autoFixed,
      ruleId
    });
  }

  // Registrar correção aplicada
  addFix(ruleId, entityType, entityId, action, result = true) {
    const severity = result ? 'SUCCESS' : 'ERROR';
    this.log(ruleId, `[FIX] ${entityType}#${entityId}: ${action}`, severity, {
      entityType,
      entityId,
      action,
      result
    });
  }

  // Estatísticas do log
  getStats() {
    const stats = {
      total: this.logs.length,
      critical: 0,
      high: 0,
      medium: 0,
      low: 0,
      success: 0,
      error: 0,
      issues: [],
      fixes: []
    };

    this.logs.forEach(log => {
      if (log.severity === 'CRITICAL') stats.critical++;
      else if (log.severity === 'HIGH') stats.high++;
      else if (log.severity === 'MEDIUM') stats.medium++;
      else if (log.severity === 'LOW') stats.low++;
      else if (log.severity === 'SUCCESS') stats.success++;
      else if (log.severity === 'ERROR') stats.error++;

      if (log.data?.autoFixed) stats.issues.push(log);
      if (log.code && log.code.includes('FIX')) stats.fixes.push(log);
    });

    return stats;
  }

  // Exportar logs
  export() {
    return {
      startTime: this.startTime,
      endTime: this.endTime,
      duration: this.endTime ? (this.endTime - this.startTime) / 1000 : 0,
      logs: this.logs,
      stats: this.getStats()
    };
  }

  // Limpar logs
  clear() {
    this.logs = [];
    this.startTime = null;
    this.endTime = null;
  }
}

export default new AuditLogger();